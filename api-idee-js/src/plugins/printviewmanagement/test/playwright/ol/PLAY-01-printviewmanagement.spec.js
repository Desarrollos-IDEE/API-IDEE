import { test, expect } from '@playwright/test';

test('Test PrintViewManagement', async ({ page }) => {
  await page.goto('/src/plugins/printviewmanagement/test/playwright/ol/printviewmanagement-ol.html');
  await page.evaluate(() => {
    window.mapjs = IDEE.map({
      container: 'mapjs',
    });
    window.mp = new IDEE.plugin.PrintViewManagement({
      position: 'TL',
    });
    window.mapjs.addPlugin(window.mp);
  });
  
  const nPlugins = await page.evaluate(() => window.mapjs.getPlugins().length);
  expect(nPlugins).toBe(1);
});
