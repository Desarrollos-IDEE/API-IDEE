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
        url: 'https://www.ideandalucia.es/services/DERA_g11_patrimonio/wfs?',
        namespace: 'DERA_g11_patrimonio',
        name: 'g11_05_Cavidad',
        legend: 'Cavidades',
        geometry: 'POINT',
      });
      window.wfs_001 = wfs_001;
      window.map.addLayers(wfs_001);
    });

    await page.evaluate(() => {
      return new Promise((resolve) => {
        window.wfs_001.on(IDEE.evt.LOAD, () => {
          resolve();
        });
      });
    });
    await page.evaluate(() => window.wfs_001.setName('g11_05_Cavidad'));
    const nameWFS = await page.evaluate(() => window.wfs_001.name);
    expect(nameWFS).toEqual('g11_05_Cavidad');
  });

  test('Methods setName, setNamespace and setURL', async ({ page }) => {
    await page.evaluate(() => {
      const wfs_002 = new IDEE.layer.WFS({
        url: 'https://www.ideandalucia.es/services/DERA_g11_patrimonio/wfs?',
        namespace: 'DERA_g11_patrimonio',
        name: 'g11_05_Cavidad',
        legend: 'Cavidades',
        geometry: 'POINT',
      });
      window.wfs_002 = wfs_002;
      window.map.addLayers(wfs_002);
    });

    await page.evaluate(() => {
      return new Promise((resolve) => {
        window.wfs_002.on(IDEE.evt.LOAD, () => {
          resolve();
        });
      });
    });
    await page.evaluate(() => window.wfs_002.setName('g11_05_Cavidad'));
    const nameWFS = await page.evaluate(() => window.wfs_002.name);
    expect(nameWFS).toEqual('g11_05_Cavidad');
    await page.evaluate(() => window.wfs_002.setNamespace('DERA_g11_patrimonio'));
    const namespaceWFS = await page.evaluate(() => window.wfs_002.namespace);
    expect(namespaceWFS).toEqual('DERA_g11_patrimonio');
    await page.evaluate(() => window.wfs_002.setURL('https://www.ideandalucia.es/services/DERA_g11_patrimonio/wfs?'));
    const urlWFS = await page.evaluate(() => window.wfs_002.url);
    expect(urlWFS).toEqual('https://www.ideandalucia.es/services/DERA_g11_patrimonio/wfs?');
    await expect(page).toHaveScreenshot('snapshot.png', { maxDiffPixelRatio: 0.5 });
  });
});
