import { test, expect } from '@playwright/test';

test.describe('IDEE.layer.WMC', () => {
  let map;
  test.beforeEach(async ({ page }) => {
    await page.goto('/test/playwright/ol/basic-ol.html');
    await page.evaluate(() => {
      map = IDEE.map({
        container: 'map',
        projection: 'EPSG:3857*m',
        center: [-527439.7561017586, 4554984.900936406],
        zoom: 9,
      });
      window.map = map;
    });
  });

  test('Add layer', async ({ page }) => {
    await page.evaluate(() => {
      const wmc_001 = new IDEE.layer.WMC({
        url: 'https://componentes.idee.es/estaticos/Datos/WMC/mapa.xml',
        name: 'Mapa',
      });

      map.addLayers(wmc_001);
      window.wmc_001 = wmc_001;
    });

    await page.waitForTimeout(5000);
    const numLayers = await page.evaluate(() => map.getLayers().length);
    expect(numLayers).toEqual(7);
  });

  test('Add two WMC', async ({ page }) => {
    await page.evaluate(() => {
      const wmc_001 = new IDEE.layer.WMC({
        url: 'https://componentes.idee.es/estaticos/Datos/WMC/mapa.xml',
        name: 'Mapa',
      });
      window.wmc_001 = wmc_001;

      map.addLayers(wmc_001);

      const wmc_002 = new IDEE.layer.WMC({
        url: 'https://componentes.idee.es/estaticos/Datos/WMC/context_cdau_hibrido_25830_no_cache.xml',
        name: 'Híbrido',
      });
      window.wmc_002 = wmc_002;

      map.addLayers(wmc_002);
    });

    await page.waitForTimeout(5000);
    const selector = page.locator('select.m-wmcselector-select');
    await expect(selector).toBeVisible();
    const opciones = selector.locator('option');
    await expect(opciones).toHaveCount(2);
  });
});
