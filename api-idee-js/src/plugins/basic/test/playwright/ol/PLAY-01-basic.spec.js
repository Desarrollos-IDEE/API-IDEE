import { test, expect } from '@playwright/test';

test('Test Basic', async ({ page }) => {
  await page.goto('/src/plugins/basic/test/playwright/ol/basic-ol.html');
  await page.evaluate(() => {
    window.mapjs = IDEE.map({
      container: 'mapjs',
    });
    window.mp = new IDEE.plugin.Basic({
      position: 'TL',
    });
    window.mapjs.addPlugin(window.mp);
  });
  
  const nPlugins = await page.evaluate(() => window.mapjs.getPlugins().length);
  expect(nPlugins).toBe(1);
});
