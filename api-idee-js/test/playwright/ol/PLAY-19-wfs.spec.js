import { test, expect } from '@playwright/test';

test.describe('IDEE.layer.WFS', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/test/playwright/ol/basic-ol.html');
    await page.evaluate(() => {
      const map = IDEE.map({ container: 'map' });
      window.map = map;
    });
  });

  test('Method setName', async ({ page }) => {
    await page.evaluate(() => {
      const wfs_001 = new IDEE.layer.WFS({
        url: 'https://hcsigc.juntadeandalucia.es/geoserver/wfs?',
        namespace: 'IECA',
        name: 'sigc_provincias_pob_centroides_1724756847583',
        legend: 'Provincias',
        geometry: 'POINT',
      });
      window.wfs_001 = wfs_001;
      window.map.addLayers(wfs_001);
    });

    await page.waitForTimeout(5000);
    await page.evaluate(() => window.wfs_001.setName('sigc_campamentos_1724753464727'));
    const nameWFS = await page.evaluate(() => window.wfs_001.name);
    expect(nameWFS).toEqual('sigc_campamentos_1724753464727');
  });

  test('Methods setName, setNamespace and setURL', async ({ page }) => {
    await page.evaluate(() => {
      const wfs_002 = new IDEE.layer.WFS({
        url: 'https://hcsigc.juntadeandalucia.es/geoserver/wfs?',
        namespace: 'IECA',
        name: 'sigc_provincias_pob_centroides_1724756847583',
        legend: 'Provincias',
        geometry: 'POINT',
      });
      window.wfs_002 = wfs_002;
      window.map.addLayers(wfs_002);
    });

    await page.waitForTimeout(3000);
    await page.evaluate(() => window.wfs_002.setName('superadmin_provincias_1748514745131'));
    const nameWFS = await page.evaluate(() => window.wfs_002.name);
    expect(nameWFS).toEqual('superadmin_provincias_1748514745131');
    // await page.waitForTimeout(3000);
    await page.evaluate(() => window.wfs_002.setNamespace('Public'));
    const namespaceWFS = await page.evaluate(() => window.wfs_002.namespace);
    expect(namespaceWFS).toEqual('Public');
    // await page.waitForTimeout(3000);
    await page.evaluate(() => window.wfs_002.setURL('https://hcsigc-geoserver-sigc.desarrollo.guadaltel.es/geoserver/Public/ows?'));
    const urlWFS = await page.evaluate(() => window.wfs_002.url);
    expect(urlWFS).toEqual('https://hcsigc-geoserver-sigc.desarrollo.guadaltel.es/geoserver/Public/ows?');
    await page.waitForTimeout(3000);
    await expect(page).toHaveScreenshot('snapshot.png');
  });
});
