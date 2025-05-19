import { test, expect } from '@playwright/test';

test.describe('Parámetro idLayer', () => {
  test.beforeEach(async ({ page }) => {
    let map;
    await page.goto('/test/playwright/ol/basic-ol.html');
    await page.evaluate(() => {
      map = IDEE.map({ container: 'map', bgColorContainer: 'red' });
    });
  });

  test('Comprobamos que se añaden dos capas WMS con el mismo nombre', async ({ page }) => {
    await page.evaluate(() => {
      const wms_001 = new IDEE.layer.WMS({
        url: 'https://www.ign.es/wms-inspire/unidades-administrativas?',
        name: 'AU.AdministrativeUnit',
        legend: 'Capa WMS l',
        isBase: false,
      });

      const wms_002 = new IDEE.layer.WMS({
        url: 'https://www.ign.es/wms-inspire/unidades-administrativas?',
        name: 'AU.AdministrativeUnit',
        legend: 'Capa WMS l',
        isBase: false,
      });

      map.addLayers([wms_001, wms_002]);
    });
    const WMSLength = await page.evaluate(() => map.getWMS().length);
    expect(WMSLength).toEqual(2);
  });

  test('Comprobamos que se añaden dos capas OGCAPIFeatures con el mismo nombre', async ({ page }) => {
    await page.evaluate(() => {
      const ogc_001 = new IDEE.layer.OGCAPIFeatures({
        url: 'https://api-features.idee.es/collections/',
        name: 'falls',
        legend: 'Capa OGCAPIFeatures',
        isBase: false,
        extract: true,
      });

      const ogc_002 = new IDEE.layer.OGCAPIFeatures({
        url: 'https://api-features.idee.es/collections/',
        name: 'falls',
        legend: 'Capa OGCAPIFeatures',
        isBase: false,
        extract: true,
      });

      map.addLayers([ogc_001, ogc_002]);
    });

    const OGCLength = await page.evaluate(() => map.getOGCAPIFeatures().length);
    expect(OGCLength).toEqual(2);
  });
});
