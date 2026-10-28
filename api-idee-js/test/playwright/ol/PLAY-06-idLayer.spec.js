import { test, expect } from '@playwright/test';

test.describe('Parámetro idLayer', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/test/playwright/ol/basic-ol.html');
    await page.evaluate(() => {
      const map = IDEE.map({ container: 'map', bgColorContainer: 'red' });
      window.map = map;
    });
  });

  test('Comprobamos que se añaden dos capas WMS con el mismo nombre', async ({ page }) => {
    await page.evaluate(() => {
      const wms001 = new IDEE.layer.WMS({
        url: 'https://www.ign.es/wms-inspire/unidades-administrativas?',
        name: 'AU.AdministrativeUnit',
        legend: 'Capa WMS l',
        isBase: false,
      });

      const wms002 = new IDEE.layer.WMS({
        url: 'https://www.ign.es/wms-inspire/unidades-administrativas?',
        name: 'AU.AdministrativeUnit',
        legend: 'Capa WMS l',
        isBase: false,
      });

      window.map.addLayers([wms001, wms002]);
    });
    const WMSLength = await page.evaluate(() => window.map.getWMS().length);
    expect(WMSLength).toEqual(2);
  });

  test('Comprobamos que se añaden dos capas OGCAPIFeatures con el mismo nombre', async ({ page }) => {
    await page.evaluate(() => {
      const ogc001 = new IDEE.layer.OGCAPIFeatures({
        url: 'https://api-features.idee.es/collections/',
        name: 'falls',
        legend: 'Capa OGCAPIFeatures',
        isBase: false,
        extract: true,
      });

      const ogc002 = new IDEE.layer.OGCAPIFeatures({
        url: 'https://api-features.idee.es/collections/',
        name: 'falls',
        legend: 'Capa OGCAPIFeatures',
        isBase: false,
        extract: true,
      });

      window.map.addLayers([ogc001, ogc002]);
    });

    const OGCLength = await page.evaluate(() => window.map.getOGCAPIFeatures().length);
    expect(OGCLength).toEqual(2);
  });
});
