import { test, expect } from '@playwright/test';
import { prepareGeoPackagePage } from './fixtures/geopackage';

test.beforeEach(async ({ page }) => prepareGeoPackagePage(page));

test('GeoPackage: whenReady es estable y no requiere añadir el paquete al mapa', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const gpkg = new IDEE.layer.GeoPackage({ url: '/fixtures/geopackage/mixed.gpkg', name: 'sample' });
    const first = gpkg.whenReady();
    let events = 0;
    gpkg.on(IDEE.evt.LOAD_LAYERS, () => { events += 1; });
    const [a, b] = await Promise.all([first, gpkg.whenReady()]);
    const vector = gpkg.getLayer('places');
    return {
      samePromise: first === gpkg.whenReady(),
      sameResult: a === gpkg && b === gpkg,
      tables: gpkg.getLayers().map((layer) => layer.name),
      noMap: vector.getImpl().getLayer() === null,
      notRendered: !vector.getImpl().isLoaded(),
      events,
    };
  });
  expect(result).toEqual({
    samePromise: true,
    sameResult: true,
    tables: ['sample:places', 'sample:imagery'],
    noMap: true,
    notRendered: true,
    events: 0,
  });
});

test('GeoPackage: LOAD_LAYERS conserva su colección y ocurre una vez al añadir', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const map = IDEE.map({ container: 'map', layers: [], controls: [] });
    const gpkg = new IDEE.layer.GeoPackage({ url: '/fixtures/geopackage/mixed.gpkg' }, { visibility: false });
    await gpkg.whenReady();
    const original = gpkg.getLayer('places');
    let calls = 0;
    let matches = false;
    const loaded = new Promise((resolve) => {
      gpkg.on(IDEE.evt.LOAD_LAYERS, (layers) => {
        calls += 1;
        matches = layers.places === original && layers.imagery === gpkg.getLayer('imagery');
        resolve();
      });
    });
    map.addGeoPackage(gpkg);
    await loaded;
    return {
      calls,
      matches,
      sameChildren: gpkg.getLayer('places') === original,
      attached: gpkg.getLayers().every((layer) => map.getLayers().includes(layer)),
    };
  });
  expect(result).toEqual({
    calls: 1, matches: true, sameChildren: true, attached: true,
  });
});

test('GeoPackage: addLayers delega la incorporación al addTo del paquete', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const map = IDEE.map({ container: 'map', layers: [], controls: [] });
    const gpkg = new IDEE.layer.GeoPackage({ url: '/fixtures/geopackage/mixed.gpkg' });
    let added = 0;
    let loaded = 0;
    map.on(IDEE.evt.ADDED_GEOPACKAGE, () => { added += 1; });
    gpkg.on(IDEE.evt.LOAD_LAYERS, () => { loaded += 1; });
    map.addLayers(gpkg);
    await gpkg.whenReady();
    return {
      added,
      loaded,
      registered: map.geopackages.includes(gpkg),
      attached: gpkg.getLayers().every((layer) => map.getLayers().includes(layer)),
    };
  });
  expect(result).toEqual({ added: 1, loaded: 1, registered: true, attached: true });
});

['pending', 'ready'].forEach((state) => {
  test(`GeoPackage: carga en grupo con inicialización ${state}`, async ({ page }) => {
    await page.evaluate(async (initialState) => {
      const map = IDEE.map({ container: 'map', layers: [], controls: [] });
      const gpkg = new IDEE.layer.GeoPackage({ url: '/fixtures/geopackage/mixed.gpkg', name: 'sample' }, { visibility: false });
      if (initialState === 'ready') await gpkg.whenReady();
      const group = new IDEE.layer.LayerGroup({ name: 'group', layers: [gpkg] });
      window.geopackageGroup = group;
      map.addLayers(group);
    }, state);
    await expect.poll(() => page.evaluate(() => window.geopackageGroup.getLayers()
      .map((layer) => layer.name).sort())).toEqual(['sample:imagery', 'sample:places']);
  });
});

test('GeoPackage: un paquete vacío también completa la inicialización', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const gpkg = new IDEE.layer.GeoPackage({ url: '/fixtures/geopackage/empty.gpkg' });
    await gpkg.whenReady();
    let tables;
    gpkg.once(IDEE.evt.LOAD_LAYERS, (layers) => { tables = Object.keys(layers); });
    await gpkg.addTo(null, false);
    return { count: gpkg.getLayers().length, tables };
  });
  expect(result).toEqual({ count: 0, tables: [] });
});

test('GeoPackage: los fallos de lectura, proveedor y capa rechazan whenReady', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await page.route('**/missing.gpkg', (route) => route.fulfill({ status: 404, body: 'missing' }));
  await page.route('**/network-error.gpkg', (route) => route.abort());
  const failures = await page.evaluate(async () => {
    const badFile = new File(['invalid'], 'bad.gpkg');
    badFile.arrayBuffer = () => Promise.reject(new Error('read failed'));
    const consumed = new Response('consumed');
    await consumed.arrayBuffer();
    const cases = [
      [undefined],
      [{}],
      [{ source: new Uint8Array([1]), url: '/missing.gpkg' }],
      [{ source: null }],
      [{ url: '/missing.gpkg' }],
      [{ url: '/network-error.gpkg' }],
      [badFile],
      [consumed],
      [new Uint8Array([1, 2, 3])],
      [{ url: '/fixtures/geopackage/mixed.gpkg' }, { tile: { imagery: null } }],
      [{ url: '/fixtures/geopackage/mixed.gpkg' }, { predefinedStyles: 0 }],
    ];
    return Promise.all(cases.map(async ([source, options]) => {
      const gpkg = new IDEE.layer.GeoPackage(source, options);
      try {
        await gpkg.whenReady();
        return { rejected: false };
      } catch (error) {
        return { rejected: true, error: String(error), children: gpkg.getLayers().length };
      }
    }));
  });
  expect(failures).toHaveLength(11);
  failures.forEach((failure) => {
    expect(failure.rejected).toBe(true);
    expect(failure.error).toBeTruthy();
    expect(failure.children).toBe(0);
  });
  expect(failures[4].error).toContain('404');
  expect(failures[6].error).toContain('read failed');
  expect(pageErrors).toEqual([]);
});

test('GeoPackage: el mapa informa del fallo sin emitir LOAD_LAYERS', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await page.evaluate(() => {
    const map = IDEE.map({ container: 'map', layers: [], controls: [] });
    const gpkg = new IDEE.layer.GeoPackage(new Uint8Array([1, 2, 3]));
    window.geopackageLoads = 0;
    gpkg.on(IDEE.evt.LOAD_LAYERS, () => { window.geopackageLoads += 1; });
    map.addGeoPackage(gpkg);
  });
  await expect(page.locator('.m-dialog.error')).toBeVisible();
  expect(await page.evaluate(() => window.geopackageLoads)).toBe(0);
  expect(pageErrors).toEqual([]);
});

test('GeoPackage: el grupo informa del fallo y su promesa no queda pendiente', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await page.evaluate(() => {
    const map = IDEE.map({ container: 'map', layers: [], controls: [] });
    const gpkg = new IDEE.layer.GeoPackage(new Uint8Array([1, 2, 3]));
    window.failedGeoPackage = gpkg;
    const group = new IDEE.layer.LayerGroup({ name: 'group', layers: [gpkg] });
    window.geopackageGroup = group;
    map.addLayers(group);
  });
  await expect(page.locator('.m-dialog.error')).toBeVisible();
  const result = await page.evaluate(async () => {
    try {
      await window.geopackageGroup.getImpl().addLayer(window.failedGeoPackage);
      return false;
    } catch (error) {
      return window.geopackageGroup.getLayers().length === 0;
    }
  });
  expect(result).toBe(true);
  expect(pageErrors).toEqual([]);
});

test('GeoPackage: addTo propaga fallos de adición sin cambiar whenReady', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  const result = await page.evaluate(async () => {
    const map = IDEE.map({ container: 'map', layers: [], controls: [] });
    const gpkg = new IDEE.layer.GeoPackage({ url: '/fixtures/geopackage/vector.gpkg' });
    await gpkg.whenReady();
    map.addLayers = () => { throw new Error('attachment failed <img src="invalid">'); };
    try {
      await gpkg.addTo(map);
      return null;
    } catch (error) {
      return { error: String(error), ready: await gpkg.whenReady() === gpkg };
    }
  });
  expect(result).toEqual({ error: 'Error: attachment failed <img src="invalid">', ready: true });
  await expect(page.locator('.m-dialog.error')).toBeVisible();
  await expect(page.locator('.m-dialog.error .m-message')).toHaveText(result.error);
  await expect(page.locator('.m-dialog.error .m-message img')).toHaveCount(0);
  expect(pageErrors).toEqual([]);
});
