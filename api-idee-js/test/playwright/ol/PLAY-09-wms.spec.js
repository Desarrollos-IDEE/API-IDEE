import { test, expect } from '@playwright/test';

test.describe('IDEE.layer.WMS', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/test/playwright/ol/basic-ol.html');
    await page.evaluate(() => {
      const map = IDEE.map({ container: 'map' });
      window.map = map;
    });
  });

  test.describe('Method setName', () => {
    test('To another layer', async ({ page }) => {
      await page.evaluate(() => {
        const wms_001 = new IDEE.layer.WMS({
          url: 'https://www.ign.es/wms-inspire/redes-geodesicas?',
          name: 'RED_NAP',
          legend: 'Red de Nivelación de Alta Presión',
          tiled: true,
          useCapabilities: true,
          version: '1.1.0',
        }, {});

        window.map.addLayers(wms_001);
        window.wms_001 = wms_001;
      });

      await page.waitForTimeout(5000);
      await page.evaluate(() => window.wms_001.setName('RED_REGENTE'));
      const nameWMS = await page.evaluate(() => window.wms_001.name);
      expect(nameWMS).toEqual('RED_REGENTE');
    });

    test('To WMS_FULL layer', async ({ page }) => {
      await page.evaluate(() => {
        const wms_002 = new IDEE.layer.WMS({
          url: 'https://www.ign.es/wms-inspire/redes-geodesicas?',
          name: 'RED_NAP',
          legend: 'Red de Nivelación de Alta Presión',
          tiled: true,
          useCapabilities: true,
          version: '1.1.0',
        }, {});

        window.map.addLayers(wms_002);
        window.wms_002 = wms_002;
      });

      await page.waitForTimeout(5000);
      await page.evaluate(() => window.wms_002.setName(''));
      const nameWMS = await page.evaluate(() => window.wms_002.name);
      expect(nameWMS).toEqual(expect.stringContaining('layer_'));
    });

    test('From WMS_FULL To a single layer', async ({ page }) => {
      await page.evaluate(() => {
        const wms_003 = new IDEE.layer.WMS({
          url: 'https://www.ign.es/wms-inspire/redes-geodesicas?',
          name: '',
          legend: 'Red de Nivelación de Alta Presión',
          tiled: true,
          useCapabilities: true,
          version: '1.1.0',
        }, {});

        window.wms_003 = wms_003;
      });

      await page.evaluate(() => {
        return new Promise((resolve) => {
          window.wms_003.on(IDEE.evt.ADDED_TO_MAP, () => {
            resolve();
          });
          window.map.addLayers(window.wms_003);
        });
      });
      await page.evaluate(() => window.wms_003.setName('RED_REGENTE'));
      const nameWMS = await page.evaluate(() => window.wms_003.name);
      expect(nameWMS).toEqual('RED_REGENTE');
    });
  });

  test.describe('Method setURL', () => {
    test('Layer with name', async ({ page }) => {
      await page.evaluate(() => {
        const wms_004 = new IDEE.layer.WMS({
          url: 'https://www.ign.es/wms-inspire/unidades-administrativas?',
          name: 'AU.AdministrativeUnit',
          legend: 'Red de Unidades Administrativas',
          tiled: true,
          useCapabilities: true,
          version: '1.1.0',
        });

        window.wms_004 = wms_004;
      });

      await page.evaluate(() => {
        return new Promise((resolve) => {
          window.wms_004.on(IDEE.evt.ADDED_TO_MAP, () => {
            resolve();
          });
          window.map.addLayers(window.wms_004);
        });
      });
      await page.evaluate(() => window.wms_004.setURL('http://www.ign.es/wms-inspire/unidades-administrativas?'));
      const urlWMS = await page.evaluate(() => window.wms_004.url);
      expect(urlWMS).toEqual('http://www.ign.es/wms-inspire/unidades-administrativas?');
    });

    test('Layer WMS_FULL', async ({ page }) => {
      await page.evaluate(() => {
        const wms_005 = new IDEE.layer.WMS({
          url: 'https://www.ign.es/wms-inspire/unidades-administrativas?',
          name: '',
          legend: 'Red de Unidades Administrativas',
          tiled: true,
          useCapabilities: true,
          version: '1.1.0',
        });

        window.wms_005 = wms_005;
      });

      await page.evaluate(() => {
        return new Promise((resolve) => {
          window.wms_005.on(IDEE.evt.ADDED_TO_MAP, () => {
            resolve();
          });
          window.map.addLayers(window.wms_005);
        });
      });
      await page.evaluate(() => window.wms_005.setURL('https://www.ign.es/wms-inspire/redes-geodesicas?'));
      const urlWMS = await page.evaluate(() => window.wms_005.url);
      expect(urlWMS).toEqual('https://www.ign.es/wms-inspire/redes-geodesicas?');
    });

    test('WMSFULL with mergeLayers true', async ({ page }) => {
      await page.evaluate(() => {
        const wms_006 = new IDEE.layer.WMS({
          url: 'https://www.ign.es/wms-inspire/unidades-administrativas?',
          name: '',
          legend: 'WMS',
          mergeLayers: true,
        });

        window.wms_006 = wms_006;
      });

      await page.evaluate(() => {
        return new Promise((resolve) => {
          window.wms_006.on(IDEE.evt.ADDED_TO_MAP, () => {
            resolve();
          });
          window.map.addLayers(window.wms_006);
        });
      });
      const numLayers = await page.evaluate(() => window.map.getLayers().length);
      expect(numLayers).toEqual(3);
    });

    test('WMSFULL with mergeLayers false', async ({ page }) => {
      await page.evaluate(() => {
        const wms_007 = new IDEE.layer.WMS({
          url: 'https://www.ign.es/wms-inspire/unidades-administrativas?',
          name: '',
          legend: 'WMS',
          mergeLayers: false,
        });

        window.wms_007 = wms_007;
      });

      await page.evaluate(() => {
        return new Promise((resolve) => {
          window.wms_007.on(IDEE.evt.ADDED_TO_MAP, () => {
            resolve();
          });
          window.map.addLayers(window.wms_007);
        });
      });
      const numLayers = await page.evaluate(() => window.map.getLayers().length);
      expect(numLayers).toEqual(6);
    });
  });

  test.describe('Method setVisible', () => {
    test('2 WMS base layers', async ({ page }) => {
      await page.evaluate(() => {
        window.map.setBbox([
          -686768.0771958077,
          4251980.700187735,
          -579147.4083832583,
          4352721.50889354,
        ]);

        const wms_001 = new IDEE.layer.WMS({
          url: 'https://www.ign.es/wms-inspire/unidades-administrativas?',
          name: 'AU.AdministrativeUnit',
          legend: 'Unidad administrativa',
          isBase: true,
        });
        window.wms_001 = wms_001;

        const wms_002 = new IDEE.layer.WMS({
          url: 'https://servicios.idee.es/wms-inspire/hidrografia?',
          name: 'HY.Network',
          legend: 'Red hidrográfica',
          isBase: true,
        });
        window.wms_002 = wms_002;
      });
      await page.evaluate(() => {
        return new Promise((resolve) => {
          let count = 0;
          window.wms_001.on(IDEE.evt.ADDED_TO_MAP, () => {
            count += 1;
            if (count === 2) resolve();
          });
          window.wms_002.on(IDEE.evt.ADDED_TO_MAP, () => {
            count += 1;
            if (count === 2) resolve();
          });
          window.map.addLayers([wms_001, wms_002]);
        });
      });
      await page.evaluate(() => window.wms_002.setVisible(true));
      await page.waitForTimeout(5000);
      await expect(page).toHaveScreenshot('snapshot.png', { maxDiffPixelRatio: 0.5 });
    });
  });
});
