import { test, expect } from '@playwright/test';

test.describe('WMTS getMaxExtent, no maxExtent on map', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/test/playwright/ol/basic-ol.html');
    await page.evaluate(() => {
      const map = IDEE.map({
        container: 'map',
        layers: [],
      });
      window.map = map;
    });
  });

  test.describe('Method setName', () => {
    test('With useCapabilities: false and no maxExtent', async ({ page }) => {
      await page.evaluate(() => {
        const wmts_001 = new IDEE.layer.WMTS({
          url: 'https://www.ign.es/wmts/minutas-cartograficas',
          name: 'Minutas',
          legend: 'Minutas',
          matrixSet: 'GoogleMapsCompatible',
          useCapabilities: false,
          format: 'image/jpeg',
        }, {});
        window.wmts_001 = wmts_001;

        window.map.addLayers(wmts_001);
      });

      const extentWMTS = await page.evaluate(() => window.wmts_001.getMaxExtent());
      const extentProj = await page.evaluate(() => window.map.getProjection().getExtent());
      expect(extentWMTS).toEqual(extentProj);
    });

    test('With useCapabilities: true and no maxExtent', async ({ page }) => {
      await page.evaluate(() => {
        const wmts_001 = new IDEE.layer.WMTS({
          url: 'https://www.ign.es/wmts/minutas-cartograficas',
          name: 'Minutas',
          legend: 'Minutas',
          matrixSet: 'GoogleMapsCompatible',
          useCapabilities: true,
          format: 'image/jpeg',
        }, {});
        window.wmts_001 = wmts_001;

        // window.map.addLayers(wmts_001);
      });

      await page.evaluate(() => {
        return new Promise((resolve) => {
          window.wmts_001.on(IDEE.evt.ADDED_TO_MAP, () => {
            resolve();
          });
          window.map.addLayers(window.wmts_001);
        });
      });

      const extentWMTS = await page.evaluate(() => window.wmts_001.getMaxExtent());
      // await page.waitForTimeout(100000);
      expect(extentWMTS).toEqual(
        [-1335833.8895192828, 4163881.1440642904, 556597.4539663679, 5465442.183322749],
      );
    });

    test('With useCapabilities: false and maxExtent', async ({ page }) => {
      await page.evaluate(() => {
        const wmts_001 = new IDEE.layer.WMTS({
          url: 'https://www.ign.es/wmts/minutas-cartograficas',
          name: 'Minutas',
          legend: 'Minutas',
          matrixSet: 'GoogleMapsCompatible',
          useCapabilities: false,
          maxExtent: [-4452779, 1118889, -194306, 8625823],
          format: 'image/jpeg',
        }, {});
        window.wmts_001 = wmts_001;

        window.map.addLayers(wmts_001);
      });

      const extentWMTS = await page.evaluate(() => window.wmts_001.getMaxExtent());
      expect(extentWMTS).toEqual([-4452779, 1118889, -194306, 8625823]);
    });

    test('With useCapabilities: true and maxExtent', async ({ page }) => {
      await page.evaluate(() => {
        const wmts_001 = new IDEE.layer.WMTS({
          url: 'https://www.ign.es/wmts/minutas-cartograficas',
          name: 'Minutas',
          legend: 'Minutas',
          matrixSet: 'GoogleMapsCompatible',
          useCapabilities: true,
          maxExtent: [-4452779, 1118889, -194306, 8625823],
          format: 'image/jpeg',
        }, {});
        window.wmts_001 = wmts_001;

        window.map.addLayers(wmts_001);
      });

      const extentWMTS = await page.evaluate(() => window.wmts_001.getMaxExtent());
      expect(extentWMTS).toEqual([-4452779, 1118889, -194306, 8625823]);
    });
  });
});

test.describe('WMTS getMaxExtent, maxExtent on map', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/test/playwright/ol/basic-ol.html');
    await page.evaluate(() => {
      const map = IDEE.map({
        container: 'map',
        layers: [],
        maxExtent: [-4452779.222, 1118889.222, -194306.222, 8625823.222],
      });
      window.map = map;
    });
  });

  test.describe('Method setName', () => {
    test('With useCapabilities: false and no maxExtent', async ({ page }) => {
      await page.evaluate(() => {
        const wmts_001 = new IDEE.layer.WMTS({
          url: 'https://www.ign.es/wmts/minutas-cartograficas',
          name: 'Minutas',
          legend: 'Minutas',
          matrixSet: 'GoogleMapsCompatible',
          useCapabilities: false,
          format: 'image/jpeg',
        }, {});
        window.wmts_001 = wmts_001;

        window.map.addLayers(wmts_001);
      });

      const extentWMTS = await page.evaluate(() => window.wmts_001.getMaxExtent());
      const extentMap = await page.evaluate(() => window.map.getMaxExtent());
      expect(extentWMTS).toEqual(extentMap);
    });

    test('With useCapabilities: true and no maxExtent', async ({ page }) => {
      await page.evaluate(() => {
        const wmts_001 = new IDEE.layer.WMTS({
          url: 'https://www.ign.es/wmts/minutas-cartograficas',
          name: 'Minutas',
          legend: 'Minutas',
          matrixSet: 'GoogleMapsCompatible',
          useCapabilities: true,
          format: 'image/jpeg',
        }, {});
        window.wmts_001 = wmts_001;

        // window.map.addLayers(wmts_001);
      });

      await page.evaluate(() => {
        return new Promise((resolve) => {
          window.wmts_001.on(IDEE.evt.ADDED_TO_MAP, () => {
            resolve();
          });
          window.map.addLayers(window.wmts_001);
        });
      });

      const extentWMTS = await page.evaluate(() => window.wmts_001.getMaxExtent());
      // await page.waitForTimeout(100000);
      expect(extentWMTS).toEqual(
        [-1335833.8895192828, 4163881.1440642904, 556597.4539663679, 5465442.183322749],
      );
    });

    test('With useCapabilities: false and maxExtent', async ({ page }) => {
      await page.evaluate(() => {
        const wmts_001 = new IDEE.layer.WMTS({
          url: 'https://www.ign.es/wmts/minutas-cartograficas',
          name: 'Minutas',
          legend: 'Minutas',
          matrixSet: 'GoogleMapsCompatible',
          useCapabilities: false,
          maxExtent: [-4452779, 1118889, -194306, 8625823],
          format: 'image/jpeg',
        }, {});
        window.wmts_001 = wmts_001;

        window.map.addLayers(wmts_001);
      });

      const extentWMTS = await page.evaluate(() => window.wmts_001.getMaxExtent());
      expect(extentWMTS).toEqual([-4452779, 1118889, -194306, 8625823]);
    });

    test('With useCapabilities: true and maxExtent', async ({ page }) => {
      await page.evaluate(() => {
        const wmts_001 = new IDEE.layer.WMTS({
          url: 'https://www.ign.es/wmts/minutas-cartograficas',
          name: 'Minutas',
          legend: 'Minutas',
          matrixSet: 'GoogleMapsCompatible',
          useCapabilities: true,
          maxExtent: [-4452779, 1118889, -194306, 8625823],
          format: 'image/jpeg',
        }, {});
        window.wmts_001 = wmts_001;

        window.map.addLayers(wmts_001);
      });

      const extentWMTS = await page.evaluate(() => window.wmts_001.getMaxExtent());
      expect(extentWMTS).toEqual([-4452779, 1118889, -194306, 8625823]);
    });
  });
});
