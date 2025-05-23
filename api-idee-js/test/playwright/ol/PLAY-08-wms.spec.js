import { test, expect } from '@playwright/test';

test.describe('IDEE.layer.WMS', () => {
  let map;
  test.beforeEach(async ({ page }) => {
    await page.goto('/test/playwright/ol/basic-ol.html');
    await page.evaluate(() => {
      map = IDEE.map({ container: 'map' });
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

        map.addLayers(wms_001);
        window.wms_001 = wms_001;
      });

      await page.waitForTimeout(5000);
      await page.evaluate(() => wms_001.setName('RED_REGENTE'));
      const nameWMS = await page.evaluate(() => wms_001.name);
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

        map.addLayers(wms_002);
        window.wms_002 = wms_002;
      });

      await page.waitForTimeout(5000);
      await page.evaluate(() => wms_002.setName(''));
      const nameWMS = await page.evaluate(() => wms_002.name);
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

        map.addLayers(wms_003);
        window.wms_003 = wms_003;
      });

      await page.waitForTimeout(5000);
      await page.evaluate(() => wms_003.setName('RED_REGENTE'));
      const nameWMS = await page.evaluate(() => wms_003.name);
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

        map.addLayers(wms_004);
        window.wms_004 = wms_004;
      });

      await page.waitForTimeout(5000);
      await page.evaluate(() => wms_004.setURL('http://www.ign.es/wms-inspire/unidades-administrativas?'));
      const urlWMS = await page.evaluate(() => wms_004.url);
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

        map.addLayers(wms_005);
        window.wms_005 = wms_005;
      });

      await page.waitForTimeout(5000);
      await page.evaluate(() => wms_005.setURL('https://www.ign.es/wms-inspire/redes-geodesicas?'));
      const urlWMS = await page.evaluate(() => wms_005.url);
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

        map.addLayers(wms_006);
        window.wms_006 = wms_006;
      });

      await page.waitForTimeout(5000);
      const numLayers = await page.evaluate(() => map.getLayers().length);
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

        map.addLayers(wms_007);
        window.wms_007 = wms_007;
      });

      await page.waitForTimeout(5000);
      const numLayers = await page.evaluate(() => map.getLayers().length);
      expect(numLayers).toEqual(5);
    });
  });
});
