import { test, expect } from '@playwright/test';
import path from 'path';
import { createGeoPackage, prepareGeoPackagePage } from './fixtures/geopackage';

const search = '#m-layerswitcher-addservices-search-input';
const submit = '#m-layerswitcher-addservices-search-btn';
const upload = '#m-layerswitcher-addservices-file-input';
const fileUrl = 'http://localhost:8081/fixtures/layerswitcher/SAMPLE.GPKG?download=1';

test.beforeEach(async ({ page }) => {
  if (process.env.API_IDEE_TEST_LAYERSWITCHER_BUILD) {
    await page.route('**/layerswitcher/dist/layerswitcher.ol.min.*', (route) => {
      const file = path.basename(new URL(route.request().url()).pathname);
      return route.fulfill({
        path: path.join(process.env.API_IDEE_TEST_LAYERSWITCHER_BUILD, file),
        contentType: file.endsWith('.css') ? 'text/css' : 'application/javascript',
      });
    });
  }
  await page.route('**/gdal3WebAssembly.*', (route) => {
    const file = path.basename(new URL(route.request().url()).pathname);
    return route.fulfill({
      path: require.resolve(`gdal3.js/dist/package/${file}`),
      contentType: file.endsWith('.wasm') ? 'application/wasm' : 'application/octet-stream',
    });
  });
  await prepareGeoPackagePage(page);
  await page.addScriptTag({ url: '/src/plugins/layerswitcher/dist/layerswitcher.ol.min.js' });
  await page.addStyleTag({ url: '/src/plugins/layerswitcher/dist/layerswitcher.ol.min.css' });
  await page.evaluate(() => {
    window.mapjs = IDEE.map({ container: 'map', layers: [], controls: [] });
    window.plugin = new IDEE.plugin.Layerswitcher({
      collapsed: false, precharged: { services: [] },
    });
    window.mapjs.addPlugin(window.plugin);
  });
  await page.locator('#layerswitcher-add-layer').click();
  await expect(page.locator(search)).toBeFocused();
});

['file', 'url'].forEach((source) => {
  ['vector', 'raster', 'mixed', 'curves'].forEach((kind) => {
    test(`GeoPackage en LayerSwitcher: ${source}, ${kind}`, async ({ page }, testInfo) => {
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      const buffer = await createGeoPackage(kind);
      const requests = [];
      if (source === 'file') {
        await page.locator(upload).setInputFiles({
          name: 'SAMPLE.GPKG', mimeType: 'application/geopackage+sqlite3', buffer,
        });
      } else {
        await page.route('**/fixtures/layerswitcher/**', (route) => {
          requests.push(route.request().url());
          return route.fulfill({ body: buffer });
        });
        await page.locator(search).fill(fileUrl);
        await page.locator(submit).click();
      }
      await expect(page.locator(search)).toHaveCount(0);
      const count = {
        curves: 4, mixed: 2, vector: 1, raster: 1,
      }[kind];
      await expect.poll(() => page.evaluate(() => window.mapjs.getLayers()
        .filter((layer) => layer.name.startsWith('SAMPLE:')).length)).toBe(count);
      const result = await page.evaluate(() => {
        const gpkg = window.mapjs.geopackages[0];
        return {
          count: window.mapjs.geopackages.length,
          names: gpkg.getLayers().map((layer) => layer.name),
          curve: gpkg.getLayer('arcs')?.source.features[0].geometry.type,
          raster: gpkg.getLayer('imagery')?.type,
        };
      });
      expect(result.count).toBe(1);
      expect(result.names.every((name) => name.startsWith('SAMPLE:'))).toBe(true);
      if (kind === 'curves') expect(result.curve).toBe('LineString');
      if (kind !== 'vector') expect(result.raster).toBe('GeoPackageTile');
      await expect(page.locator('#layerswitcher-layers')).toContainText(
        kind === 'raster' ? 'imagery' : 'places',
      );
      if (source === 'url') expect(requests).toEqual([fileUrl]);
      expect(errors).toEqual([]);
      if (source === 'file' && kind === 'mixed') {
        await page.screenshot({ path: testInfo.outputPath('loaded.png'), fullPage: true });
      }
    });
  });
});

test('LayerSwitcher: error HTTP, URL conservada y reintento', async ({ page }) => {
  await page.route(fileUrl, (route) => route.fulfill({ status: 404, body: 'missing' }));
  await page.locator(search).fill(fileUrl);
  await page.locator(submit).click();
  await expect(page.locator('.m-dialog.error')).toContainText('404');
  await page.locator('.m-dialog.error .m-button button').click();
  await expect(page.locator(search)).toHaveValue(fileUrl);
  await expect(page.locator(search)).toBeEnabled();
  await expect(page.locator('#m-layerswitcher-loading')).toHaveCount(0);
  expect(await page.evaluate(() => window.mapjs.geopackages.length)).toBe(0);
  const buffer = await createGeoPackage('vector');
  await page.route(fileUrl, (route) => route.fulfill({ body: buffer }));
  await page.locator(submit).click();
  await expect(page.locator(search)).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => window.mapjs.getLayers()
    .filter((layer) => layer.name.startsWith('SAMPLE:')).length)).toBe(1);
});

test('LayerSwitcher: archivo inválido permite volver a seleccionar', async ({ page }) => {
  await page.locator(upload).setInputFiles({
    name: 'invalid.gpkg', mimeType: 'application/octet-stream', buffer: Buffer.from('invalid'),
  });
  await expect(page.locator('.m-dialog.error')).toBeVisible();
  await page.locator('.m-dialog.error .m-button button').click();
  await expect(page.locator(upload)).toBeEnabled();
  await expect(page.locator(upload)).toHaveValue('');
  await page.locator(upload).setInputFiles({
    name: 'invalid.gpkg', mimeType: 'application/octet-stream', buffer: await createGeoPackage('vector'),
  });
  await expect(page.locator(search)).toHaveCount(0);
});

test('LayerSwitcher: carga pendiente sin peticiones duplicadas', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  let release;
  const gate = new Promise((resolve) => { release = resolve; });
  let requests = 0;
  const buffer = await createGeoPackage('mixed');
  await page.route(fileUrl, async (route) => {
    requests += 1;
    await gate;
    await route.fulfill({ body: buffer });
  });
  await page.locator(search).fill(fileUrl);
  await page.locator(submit).click();
  try {
    await expect(page.locator(search)).toBeDisabled();
    await expect(page.locator(upload)).toBeDisabled();
    await expect(page.getByRole('status')).toBeVisible();
    await page.locator(search).dispatchEvent('keydown', { keyCode: 13 });
  } finally {
    release();
  }
  await expect(page.locator(search)).toHaveCount(0);
  expect(requests).toBe(1);
});

test('LayerSwitcher: respeta la restricción de HTTP', async ({ page }) => {
  await page.evaluate(() => { window.plugin.controls[0].http = false; });
  let requested = false;
  await page.route(fileUrl, (route) => { requested = true; return route.abort(); });
  await page.locator(search).fill(fileUrl);
  await page.locator(submit).click();
  await expect(page.locator('.m-dialog.error')).toBeVisible();
  expect(requested).toBe(false);
});

test('LayerSwitcher: GeoJSON conserva el cargador habitual', async ({ page }) => {
  await page.locator(upload).setInputFiles({
    name: 'point.geojson',
    mimeType: 'application/geo+json',
    buffer: Buffer.from(JSON.stringify({
      type: 'FeatureCollection',
      features: [{ type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: [0, 0] } }],
    })),
  });
  await expect(page.locator(search)).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => window.mapjs.getLayers()
    .filter((layer) => layer.name === 'point').length)).toBe(1);
  expect(await page.evaluate(() => window.mapjs.geopackages.length)).toBe(0);
});
