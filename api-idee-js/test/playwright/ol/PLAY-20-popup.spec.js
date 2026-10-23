import { test, expect } from '@playwright/test';

test.describe('IDEE.Popup', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/test/playwright/ol/basic-ol.html');
    await page.evaluate(() => {
      const map = IDEE.map({
        container: 'map',
        center: [-516514.279416561, 4874194.031273619],
        zoom: 5,
        layers: [],
      });
      window.map = map;
    });
  });

  test('IDEE.Popup.options', async ({ page }) => {
    const text = 'Google Maps';
    await page.evaluate((msg) => {
      IDEE.Popup.options.takeMeThere = true;
      IDEE.Popup.options.textMode = true;
      IDEE.Popup.options.msg = msg;

      const ogc001 = new IDEE.layer.OGCAPIFeatures({
        url: 'https://api-features.idee.es/collections/',
        name: 'falls',
        legend: 'Capa OGCAPIFeatures',
        extract: true,
      });
      window.ogc001 = ogc001;
      window.ogc_001Loaded = new Promise((resolve) => {
        window.ogc001.on(IDEE.evt.LOAD, () => {
          resolve();
        });
      });
      window.map.addLayers(window.ogc001);
    }, text);
    await page.evaluate(() => window.ogc_001Loaded);
    await await page.click('#map', { position: { x: 562, y: 293 } });
    await page.waitForSelector('.m-popup .m-footer');

    const footer = await page.locator('.m-popup .m-footer');
    await expect(footer).toHaveText(text);
  });
});
