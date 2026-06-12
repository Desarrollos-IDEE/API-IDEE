import { test, expect } from '@playwright/test';

test('Test Incicarto', async ({ page }) => {
  await page.goto('/src/plugins/incicarto/test/playwright/ol/incicarto-ol.html');
  await page.evaluate(() => {
    window.mapjs = IDEE.map({
      container: 'mapjs',
    });
      window.mp = new IDEE.plugin.Incicarto({
      position: 'BR'
    });
    window.mapjs.addPlugin(window.mp);
  });
  
  const nPlugins = await page.evaluate(() => window.mapjs.getPlugins().length);
  expect(nPlugins).toBe(1);
});
