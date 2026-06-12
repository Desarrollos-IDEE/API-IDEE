import { test, expect } from '@playwright/test';

test.describe('IDEE.layer.WMC', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/test/playwright/ol/basic-ol.html');
    await page.evaluate(() => {
      IDEE.proxy(true);
      const map = IDEE.map({
        container: 'map',
        projection: 'EPSG:25830*d',
      });
      window.map = map;
    });
  });

  test('Add layer', async ({ page }) => {
    await page.evaluate(() => {
      const wmc_001 = new IDEE.layer.WMC('callejero');
      window.wmc_001 = wmc_001;

      window.map.addWMC(wmc_001);
    });

    await page.waitForTimeout(5000);
    const numLayers = await page.evaluate(() => { return window.map.getLayers().length; });
    await expect(numLayers).toEqual(47);
  });

  test('Add two WMC', async ({ page }) => {
    await page.evaluate(() => {
      const wmc_001 = new IDEE.layer.WMC('callejero');
      window.wmc_001 = wmc_001;

      window.map.addWMC(wmc_001);

      const wmc_002 = new IDEE.layer.WMC('ortofoto');
      window.wmc_002 = wmc_002;

      window.map.addWMC(wmc_002);
    });

    await page.waitForTimeout(5000);
    const selector = page.locator('select.m-wmcselector-select');
    await expect(selector).toBeVisible();
    const opciones = selector.locator('option');
    await expect(opciones).toHaveCount(2);
  });
});
