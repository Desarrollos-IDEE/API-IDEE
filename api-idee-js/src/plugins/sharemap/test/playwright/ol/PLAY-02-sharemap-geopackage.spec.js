import { test, expect } from '@playwright/test';
import path from 'path';
import { createGeoPackage } from '../../../../../../test/playwright/ol/fixtures/geopackage';
import { decodeRestLayer } from '../../../../../../test/playwright/common/rest-layer';

test.beforeEach(async ({ page }) => {
  await page.route('**/sql-wasm.wasm', (route) => route.fulfill({
    path: require.resolve('sql.js/dist/sql-wasm.wasm'),
    contentType: 'application/wasm',
  }));
  await page.route('**/fixtures/geopackage/*.gpkg', async (route) => {
    const kind = path.basename(new URL(route.request().url()).pathname, '.gpkg');
    await route.fulfill({ body: await createGeoPackage(kind), contentType: 'application/geopackage+sqlite3' });
  });
  await page.goto('/src/plugins/sharemap/test/playwright/ol/sharemap-ol.html', { waitUntil: 'domcontentloaded' });
});

test('ShareMap comparte un GeoPackage con una sola cadena para todas sus tablas', async ({ page }) => {
  const result = await page.evaluate(async () => {
    window.mapjs = IDEE.map({ container: 'mapjs', layers: [] });
    const gpkg = new IDEE.layer.GeoPackage({ url: '/fixtures/geopackage/multivector.gpkg', name: 'm' });
    const loaded = new Promise((resolve) => { gpkg.once(IDEE.evt.LOAD_LAYERS, resolve); });
    window.mapjs.addLayers(gpkg);
    await loaded;
    gpkg.getLayer('routes').setOpacity(0.5);
    const plugin = new IDEE.plugin.ShareMap({ shareLayer: true });
    window.mapjs.addPlugin(plugin);
    const control = plugin.controls[0];
    const params = control.getLayers();
    return {
      geopackage: params.filter((param) => param.startsWith('GeoPackage*')),
      container: gpkg.getRestLayer(),
    };
  });

  expect(result.geopackage).toEqual([result.container]);
  const decoded = decodeRestLayer(result.geopackage[0]);
  expect(Object.keys(decoded.options.tables).sort()).toEqual(['places', 'routes']);
  expect(decoded.options.tables.routes.opacity).toBe(0.5);
  expect(decoded.options.tableNames).toBeUndefined();
});

test('ShareMap comparte solo las tablas filtradas de un GeoPackage', async ({ page }) => {
  const result = await page.evaluate(async () => {
    window.mapjs = IDEE.map({ container: 'mapjs', layers: [] });
    const gpkg = new IDEE.layer.GeoPackage({ url: '/fixtures/geopackage/multivector.gpkg', name: 'm' });
    const loaded = new Promise((resolve) => { gpkg.once(IDEE.evt.LOAD_LAYERS, resolve); });
    window.mapjs.addLayers(gpkg);
    await loaded;
    const plugin = new IDEE.plugin.ShareMap({ shareLayer: false, filterLayers: ['m:routes'] });
    window.mapjs.addPlugin(plugin);
    return plugin.controls[0].getLayers().filter((param) => param.startsWith('GeoPackage*'));
  });

  expect(result).toHaveLength(1);
  expect(decodeRestLayer(result[0]).options.tableNames).toEqual(['routes']);
});
