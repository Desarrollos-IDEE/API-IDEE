import { test, expect } from '@playwright/test';

test('Test vectorsmanagement', async ({ page }) => {
  await page.goto('/src/plugins/vectorsmanagement/test/playwright/ol/vectorsmanagement-ol.html');
  await page.evaluate(() => {
    window.mapjs = IDEE.map({
      container: 'mapjs',
    });
      window.mp = new IDEE.plugin.VectorsManagement({
      position: 'BR'
    });
    window.mapjs.addPlugin(window.mp);
  });
  
  const nPlugins = await page.evaluate(() => window.mapjs.getPlugins().length);
  expect(nPlugins).toBe(1);
});
