import { test, expect } from '@playwright/test';
import path from 'path';
import { prepareGeoPackagePage } from './fixtures/geopackage';

test.beforeEach(async ({ page }) => {
  await page.route('**/gdal3WebAssembly.*', (route) => {
    const file = path.basename(new URL(route.request().url()).pathname);
    return route.fulfill({
      path: require.resolve(`gdal3.js/dist/package/${file}`),
      contentType: file.endsWith('.wasm') ? 'application/wasm' : 'application/octet-stream',
    });
  });
  await prepareGeoPackagePage(page);
});

['legacy', 'url'].forEach((signature) => {
  test(`GeoPackage: curvas con GDAL (${signature}) sin alterar tablas normales`, async ({ page }) => {
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    const result = await page.evaluate(async (form) => {
      const input = form === 'url' ? { url: '/fixtures/geopackage/curves.gpkg' }
        : await fetch('/fixtures/geopackage/curves.gpkg');
      const gpkg = new IDEE.layer.GeoPackage(input, { visibility: false });
      const ready = gpkg.whenReady();
      await ready;
      const ordinary = new IDEE.layer.GeoPackage({ url: '/fixtures/geopackage/mixed.gpkg' });
      await ordinary.whenReady();
      const curves = ['curve labels', 'arcs'].map((name) => {
        const feature = gpkg.getLayer(name).source.features[0];
        return {
          type: feature.geometry.type,
          properties: feature.properties,
          coordinates: feature.geometry.coordinates,
        };
      });
      const map = IDEE.map({ container: 'map', layers: [], controls: [] });
      const loaded = new Promise((resolve) => { gpkg.once(IDEE.evt.LOAD_LAYERS, resolve); });
      map.addGeoPackage(gpkg);
      await loaded;
      return {
        curves,
        count: gpkg.getLayers().length,
        samePromise: ready === gpkg.whenReady(),
        ordinaryEqual: JSON.stringify(gpkg.getLayer('places').source)
          === JSON.stringify(ordinary.getLayer('places').source),
        raster: gpkg.getLayer('imagery').type,
        attached: gpkg.getLayers().every((layer) => map.getLayers().includes(layer)),
      };
    }, signature);
    expect(result.count).toBe(4);
    expect(result.samePromise).toBe(true);
    expect(result.ordinaryEqual).toBe(true);
    expect(result.raster).toBe('GeoPackageTile');
    expect(result.attached).toBe(true);
    result.curves.forEach((curve) => {
      expect(curve.type).toBe('LineString');
      expect(curve.properties).toEqual({ feature_id: 7, title: 'Arco de prueba' });
      expect(curve.coordinates.length).toBeGreaterThan(3);
      expect(curve.coordinates[0]).toEqual([1, 0]);
      expect(curve.coordinates[curve.coordinates.length - 1]).toEqual([-1, 0]);
      curve.coordinates.forEach(([x, y]) => expect(Math.hypot(x, y)).toBeCloseTo(1, 8));
    });
    expect(errors).toEqual([]);
  });
});

test('GeoPackage: las tablas normales no inicializan GDAL', async ({ page }) => {
  let requests = 0;
  await page.route('**/gdal3WebAssembly.*', (route) => {
    requests += 1;
    return route.abort();
  });
  await page.evaluate(async () => {
    const gpkg = new IDEE.layer.GeoPackage({ url: '/fixtures/geopackage/mixed.gpkg' });
    await gpkg.whenReady();
  });
  expect(requests).toBe(0);
});

test('GeoPackage: dos paquetes con curvas se inicializan simultáneamente', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const packages = [0, 1].map((index) => new IDEE.layer.GeoPackage({
      url: '/fixtures/geopackage/curves.gpkg', name: `curves${index}`,
    }));
    await Promise.all(packages.map((gpkg) => gpkg.whenReady()));
    return packages.map((gpkg) => gpkg.getLayer('arcs').source.features.length);
  });
  expect(result).toEqual([1, 1]);
});

test('GeoPackage: un fallo de GDAL rechaza whenReady y permite reintentar', async ({ page }) => {
  await page.route('**/gdal3WebAssembly.wasm', (route) => route.abort());
  const rejected = await page.evaluate(async () => {
    const gpkg = new IDEE.layer.GeoPackage({ url: '/fixtures/geopackage/curves.gpkg' });
    try {
      await gpkg.whenReady();
      return false;
    } catch (error) {
      return gpkg.getLayers().length === 0;
    }
  });
  expect(rejected).toBe(true);
  await page.unroute('**/gdal3WebAssembly.wasm');
  const count = await page.evaluate(async () => {
    const gpkg = new IDEE.layer.GeoPackage({ url: '/fixtures/geopackage/curves.gpkg' });
    await gpkg.whenReady();
    return gpkg.getLayers().length;
  });
  expect(count).toBe(4);
});
