import { test, expect } from '@playwright/test';

test('Test Modal', async ({ page }) => {
  await page.goto('/src/plugins/locator/test/playwright/ol/locator-ol.html');
  await page.evaluate(() => {
    window.mapjs = IDEE.map({
      container: 'mapjs',
    });
    window.mp = new IDEE.plugin.Locator({
      position: 'TL',
    });
    window.mapjs.addPlugin(window.mp);
  });
  
  const nPlugins = await page.evaluate(() => window.mapjs.getPlugins().length);
  expect(nPlugins).toBe(1);
});
