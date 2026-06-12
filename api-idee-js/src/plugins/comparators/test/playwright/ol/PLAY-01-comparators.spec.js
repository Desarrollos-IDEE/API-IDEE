import { test, expect } from '@playwright/test';

test('Test Comparators', async ({ page }) => {
  await page.goto('/src/plugins/comparators/test/playwright/ol/comparators-ol.html');
  await page.evaluate(() => {
    window.mapjs = IDEE.map({
      container: 'mapjs',
    });
    window.mp = new IDEE.plugin.Comparators({
      position: 'TL',
    });
    window.mapjs.addPlugin(window.mp);
  });
  
  const nPlugins = await page.evaluate(() => window.mapjs.getPlugins().length);
  expect(nPlugins).toBe(1);
});
