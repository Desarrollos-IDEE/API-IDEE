import { test, expect } from '@playwright/test';

test('Test viewmanagement', async ({ page }) => {
  await page.goto('/src/plugins/viewmanagement/test/playwright/ol/viewmanagement-ol.html');
  await page.evaluate(() => {
    window.mapjs = IDEE.map({
      container: 'mapjs',
    });
    window.mp = new IDEE.plugin.ViewManagement({
      position: 'TL',
    });
    window.mapjs.addPlugin(window.mp);
  });
  
  const nPlugins = await page.evaluate(() => window.mapjs.getPlugins().length);
  expect(nPlugins).toBe(1);
});
