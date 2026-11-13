import { test, expect } from '@playwright/test';
import { prepareGeoPackagePage } from './fixtures/geopackage';

test.beforeEach(async ({ page }) => {
  await page.route('https://fonts.googleapis.com/**', (route) => route.fulfill({
    contentType: 'text/css', body: '',
  }));
  await prepareGeoPackagePage(page);
  await page.addScriptTag({ url: '/src/plugins/layerswitcher/dist/layerswitcher.ol.min.js' });
  await page.addStyleTag({ url: '/src/plugins/layerswitcher/dist/layerswitcher.ol.min.css' });
});

test('GeoPackage en LayerSwitcher: el zoom a la capa encuadra las teselas', async ({ page }) => {
  await page.evaluate(async () => {
    window.mapjs = IDEE.map({
      container: 'map', layers: [], controls: [], center: [1000000, 1000000], zoom: 12,
    });
    window.mapjs.addPlugin(new IDEE.plugin.Layerswitcher({
      collapsed: false, precharged: { services: [] },
    }));
    const gpkg = new IDEE.layer.GeoPackage({ url: '/fixtures/geopackage/raster.gpkg', name: 'r' });
    const loaded = new Promise((resolve) => { gpkg.once(IDEE.evt.LOAD_LAYERS, resolve); });
    window.mapjs.addLayers(gpkg);
    await loaded;
  });
  const item = page.locator('li.m-layerswitcher-sectionPanel[data-layer-name="r:imagery"]');
  await expect(item).toHaveCount(1);

  await item.locator('.m-layerswitcher-icons-target').click();

  await expect.poll(() => page.evaluate(() => window.mapjs.getZoom())).toBeLessThan(5);
  await expect(page.locator('.m-dialog')).toHaveCount(0);
});
