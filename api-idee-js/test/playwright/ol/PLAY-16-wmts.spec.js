import { test, expect } from '@playwright/test';

test.describe('IDEE.layer.WMTS', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/test/playwright/ol/basic-ol.html');
    await page.evaluate(() => {
      const map = IDEE.map({ container: 'map' });
      window.map = map;
    });
  });

  test.describe('Method setName', () => {
    test('With useCapabilities: true', async ({ page }) => {
      await page.evaluate(() => {
        const wmts_001 = new IDEE.layer.WMTS({
          url: 'http://www.ign.es/wmts/ign-base?',
          name: 'IGNBaseTodo',
          legend: 'Mapa IGN',
          matrixSet: 'GoogleMapsCompatible',
          useCapabilities: true,
          format: 'image/jpeg',
        }, {});
        window.wmts_001 = wmts_001;

        window.map.addLayers(wmts_001);
      });

      await page.waitForTimeout(5000);
      await page.evaluate(() => window.wmts_001.setName('IGNBaseOrto'));
      const nameWMTS = await page.evaluate(() => window.wmts_001.name);
      expect(nameWMTS).toEqual('IGNBaseOrto');
    });

    test('With useCapabilities: false', async ({ page }) => {
      await page.evaluate(() => {
        const wmts_002 = new IDEE.layer.WMTS({
          url: 'http://www.ign.es/wmts/ign-base?',
          name: 'IGNBaseTodo',
          legend: 'Mapa IGN',
          matrixSet: 'GoogleMapsCompatible',
          useCapabilities: false,
          format: 'image/jpeg',
        }, {});
        window.wmts_002 = wmts_002;

        window.map.addLayers(wmts_002);
      });

      await page.waitForTimeout(5000);
      await page.evaluate(() => window.wmts_002.setName('IGNBaseOrto'));
      const nameWMTS = await page.evaluate(() => window.wmts_002.name);
      expect(nameWMTS).toEqual('IGNBaseOrto');
    });
  });

  test.describe('Method setURL', () => {
    test('With useCapabilities: true', async ({ page }) => {
      await page.evaluate(() => {
        const wmts_003 = new IDEE.layer.WMTS({
          url: 'http://www.ign.es/wmts/ign-base?',
          name: 'IGNBaseTodo',
          legend: 'Mapa IGN',
          matrixSet: 'GoogleMapsCompatible',
          useCapabilities: true,
          format: 'image/jpeg',
        });
        window.wmts_003 = wmts_003;

        window.map.addLayers(wmts_003);
      });

      await page.waitForTimeout(5000);
      await page.evaluate(() => window.wmts_003.setURL('https://www.ign.es/wmts/ign-base?'));
      const urlWMTS = await page.evaluate(() => window.wmts_003.url);
      expect(urlWMTS).toEqual('https://www.ign.es/wmts/ign-base?');
    });

    test('With useCapabilities: false', async ({ page }) => {
      await page.evaluate(() => {
        const wmts_004 = new IDEE.layer.WMTS({
          url: 'http://www.ign.es/wmts/ign-base?',
          name: 'IGNBaseTodo',
          legend: 'Mapa IGN',
          matrixSet: 'GoogleMapsCompatible',
          useCapabilities: false,
          format: 'image/jpeg',
        });
        window.wmts_004 = wmts_004;

        window.map.addLayers(wmts_004);
      });

      await page.waitForTimeout(5000);
      await page.evaluate(() => window.wmts_004.setURL('https://www.ign.es/wmts/ign-base?'));
      const urlWMTS = await page.evaluate(() => window.wmts_004.url);
      expect(urlWMTS).toEqual('https://www.ign.es/wmts/ign-base?');
    });
  });
});
