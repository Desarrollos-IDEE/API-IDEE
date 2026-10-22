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

  test('ID Popup', async ({ page }) => {
    await page.evaluate(() => {
      const ogc001 = new IDEE.layer.OGCAPIFeatures({
        url: 'https://api-features.idee.es/collections/',
        name: 'falls',
        legend: 'Capa OGCAPIFeatures',
        extract: true,
      });
      window.ogc001 = ogc001;
      // El evento se escucha antes de añadir la capa: la respuesta puede llegar enseguida
      window.ogc_001Loaded = new Promise((resolve) => {
        window.ogc001.on(IDEE.evt.LOAD, () => {
          resolve();
        });
      });
      window.map.addLayers(window.ogc001);
    });
    await page.evaluate(() => window.ogc_001Loaded);
    await page.click('#map', { position: { x: 562, y: 293 } });
    await page.waitForSelector('.m-popup');
    const idPopup = await page.evaluate(() => {
      const popup = window.map.getPopup();
      const id = popup.getId();
      return id;
    });
    await page.waitForSelector('.m-popup');

    const popup = await page.locator('.m-popup');
    await expect(popup).toHaveId(idPopup);
  });
});
