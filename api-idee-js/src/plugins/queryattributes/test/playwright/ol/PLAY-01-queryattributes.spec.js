import { test, expect } from '@playwright/test';

test('Test QueryAttributes', async ({ page }) => {
  await page.goto('/src/plugins/queryattributes/test/playwright/ol/queryattributes-ol.html');
  await page.evaluate(() => {
    window.mapjs = IDEE.map({
      container: 'mapjs',
    });
    window.mp = new IDEE.plugin.QueryAttributes({
      position: 'TL',
    });
    window.mapjs.addPlugin(window.mp);
  });
  
  const nPlugins = await page.evaluate(() => window.mapjs.getPlugins().length);
  expect(nPlugins).toBe(1);
});
