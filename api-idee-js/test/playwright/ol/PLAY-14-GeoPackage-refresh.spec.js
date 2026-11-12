import { test, expect } from '@playwright/test';
import { createGeoPackage, prepareGeoPackagePage } from './fixtures/geopackage';

const serveVersions = async (page) => {
  const state = { version: 'multivector', requests: [] };
  await page.route(/\/fixtures\/refresh\/data\.gpkg/, async (route) => {
    state.requests.push(new URL(route.request().url()));
    await route.fulfill({
      body: await createGeoPackage(state.version),
      contentType: 'application/geopackage+sqlite3',
    });
  });
  return state;
};

const addPackage = (page) => page.evaluate(async () => {
  const map = IDEE.map({
    container: 'map', layers: [], controls: [], center: [0, 0], zoom: 2,
  });
  const gpkg = new IDEE.layer.GeoPackage({ url: '/fixtures/refresh/data.gpkg', name: 'r' });
  const loaded = new Promise((resolve) => { gpkg.once(IDEE.evt.LOAD_LAYERS, resolve); });
  map.addLayers(gpkg);
  await loaded;
  window.gpkg = gpkg;
});

const refresh = (page, tables) => page.evaluate((names) => Promise.all(names.map((name) => (
  window.gpkg.getLayer(name).getImpl().refreshSource(() => true)
))), tables);

test.beforeEach(async ({ page }) => prepareGeoPackagePage(page));

test('GeoPackage: las recargas simultáneas de varias tablas comparten una descarga', async ({ page }) => {
  const state = await serveVersions(page);
  await addPackage(page);
  expect(state.requests).toHaveLength(1);

  await refresh(page, ['places', 'routes']);
  expect(state.requests).toHaveLength(2);
  expect(state.requests[1].searchParams.has('_ideeRefresh')).toBe(true);

  await refresh(page, ['places']);
  expect(state.requests).toHaveLength(3);

  await refresh(page, ['routes']);
  expect(state.requests).toHaveLength(3);
});

test('GeoPackage: una recarga sustituye las entidades y conserva la tabla si cambia el esquema', async ({ page }) => {
  const state = await serveVersions(page);
  state.version = 'vector';
  await addPackage(page);
  const count = () => page.evaluate(() => ({
    features: window.gpkg.getLayer('places').getFeatures().length,
    data: window.gpkg.properties.tables.places.data.features.length,
    exported: window.gpkg.toGeoJSON().features.length,
    metadata: window.gpkg.getMetadata().tables.places.count,
  }));
  await expect.poll(count).toEqual({
    features: 1, data: 1, exported: 1, metadata: 1,
  });

  state.version = 'bbox';
  await refresh(page, ['places']);
  expect(await count()).toEqual({
    features: 3, data: 3, exported: 3, metadata: 3,
  });

  state.version = 'raster';
  const error = await refresh(page, ['places']).catch((e) => String(e));
  expect(error).toContain('GeoPackage: places');
  expect(await count()).toEqual({
    features: 3, data: 3, exported: 3, metadata: 3,
  });
});

test('GeoPackage: una fuente binaria no se recarga', async ({ page }) => {
  const state = await serveVersions(page);
  await page.evaluate(async () => {
    const response = await fetch('/fixtures/refresh/data.gpkg');
    const map = IDEE.map({
      container: 'map', layers: [], controls: [], center: [0, 0], zoom: 2,
    });
    const gpkg = new IDEE.layer.GeoPackage({ source: response, name: 'local' });
    const loaded = new Promise((resolve) => { gpkg.once(IDEE.evt.LOAD_LAYERS, resolve); });
    map.addLayers(gpkg);
    await loaded;
    window.gpkg = gpkg;
  });
  const features = () => page.evaluate(() => window.gpkg.getLayer('places').getFeatures().length);
  await expect.poll(features).toBe(1);

  state.version = 'bbox';
  await refresh(page, ['places']);
  expect(await features()).toBe(1);
  expect(state.requests).toHaveLength(1);
});
