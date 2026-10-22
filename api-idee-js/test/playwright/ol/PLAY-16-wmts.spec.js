import { test, expect } from '@playwright/test';

test.describe('IDEE.layer.WMTS', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/test/playwright/ol/basic-ol.html');
    await page.evaluate(() => {
      const map = IDEE.map({ container: 'map', layers: [] });
      window.map = map;
    });
  });

  test.describe('Method setName', () => {
    test('With useCapabilities: true', async ({ page }) => {
      await page.evaluate(() => {
        const wmts001 = new IDEE.layer.WMTS({
          url: 'http://www.ign.es/wmts/ign-base?',
          name: 'IGNBaseTodo',
          legend: 'Mapa IGN',
          matrixSet: 'GoogleMapsCompatible',
          useCapabilities: true,
          format: 'image/jpeg',
        }, {});
        window.wmts001 = wmts001;

        window.map.addLayers(wmts001);
      });

      await page.evaluate(() => window.wmts001.setName('IGNBaseOrto'));
      const nameWMTS = await page.evaluate(() => window.wmts001.name);
      expect(nameWMTS).toEqual('IGNBaseOrto');
    });

    test('With useCapabilities: false', async ({ page }) => {
      await page.evaluate(() => {
        const wmts002 = new IDEE.layer.WMTS({
          url: 'http://www.ign.es/wmts/ign-base?',
          name: 'IGNBaseTodo',
          legend: 'Mapa IGN',
          matrixSet: 'GoogleMapsCompatible',
          useCapabilities: false,
          format: 'image/jpeg',
        }, {});
        window.wmts002 = wmts002;

        window.map.addLayers(wmts002);
      });

      await page.evaluate(() => window.wmts002.setName('IGNBaseOrto'));
      const nameWMTS = await page.evaluate(() => window.wmts002.name);
      expect(nameWMTS).toEqual('IGNBaseOrto');
    });
  });

  test.describe('Method setVisible', () => {
    test('2 WMTS base layers', async ({ page }) => {
      await page.evaluate(() => {
        window.map.setBbox([
          -804611.8055743021,
          4219255.695100406,
          -252119.19170603558,
          4530032.790401306,
        ]);

        const wmts001 = new IDEE.layer.WMTS({
          url: 'https://www.ign.es/wmts/ign-base?',
          name: 'IGNBaseTodo',
          legend: 'Mapa IGN',
          matrixSet: 'GoogleMapsCompatible',
          isBase: true,
        });
        window.wmts001 = wmts001;

        const wmts002 = new IDEE.layer.WMTS({
          legend: 'Capa WMTS',
          url: 'https://www.ign.es/wmts/pnoa-ma?',
          name: 'OI.OrthoimageCoverage',
          matrixSet: 'GoogleMapsCompatible',
          format: 'image/png',
          isBase: true,
        });
        window.wmts002 = wmts002;

        window.map.addLayers([wmts001, wmts002]);
      });

      await page.evaluate(() => window.wmts002.setVisible(true));
      await expect(page).toHaveScreenshot('snapshot.png', { maxDiffPixelRatio: 0.5 });
    });
  });
});
