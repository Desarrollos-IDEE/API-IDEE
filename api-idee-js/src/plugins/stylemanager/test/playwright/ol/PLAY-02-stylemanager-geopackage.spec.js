import { test, expect } from '@playwright/test';
import path from 'path';
import { createGeoPackage } from '../../../../../../test/playwright/ol/fixtures/geopackage';

test.beforeEach(async ({ page }) => {
  await page.route('**/sql-wasm.wasm', (route) => route.fulfill({
    path: require.resolve('sql.js/dist/sql-wasm.wasm'),
    contentType: 'application/wasm',
  }));
  await page.route('**/fixtures/geopackage/*.gpkg', async (route) => {
    const kind = path.basename(new URL(route.request().url()).pathname, '.gpkg');
    await route.fulfill({ body: await createGeoPackage(kind), contentType: 'application/geopackage+sqlite3' });
  });
  await page.goto('/src/plugins/stylemanager/test/playwright/ol/stylemanager-ol.html', { waitUntil: 'domcontentloaded' });
});

const addPackage = (page, name) => page.evaluate(async (packageName) => {
  const gpkg = new IDEE.layer.GeoPackage({ url: '/fixtures/geopackage/multivector.gpkg', name: packageName });
  const loaded = new Promise((resolve) => { gpkg.once(IDEE.evt.LOAD_LAYERS, resolve); });
  window.mapjs.addLayers(gpkg);
  await loaded;
}, name);

const options = (page) => page.evaluate(() => Array.from(document.querySelectorAll('#m-stylemanager-select option'))
  .map((option) => option.value).filter((value) => value.includes(':')).sort());

test('StyleManager ofrece las tablas vectoriales de un GeoPackage, también si llegan después', async ({ page }) => {
  await page.evaluate(() => { window.mapjs = IDEE.map({ container: 'mapjs', layers: [] }); });
  await addPackage(page, 'antes');
  await page.evaluate(() => {
    window.mp = new IDEE.plugin.StyleManager({ collapsed: false });
    window.mapjs.addPlugin(window.mp);
  });
  await expect.poll(() => options(page)).toEqual(['antes:places', 'antes:routes']);

  await addPackage(page, 'despues');
  await expect.poll(() => options(page)).toEqual([
    'antes:places', 'antes:routes', 'despues:places', 'despues:routes',
  ]);
});
