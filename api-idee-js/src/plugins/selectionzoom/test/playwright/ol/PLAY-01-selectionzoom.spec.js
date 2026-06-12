import { test, expect } from '@playwright/test';

test('Test SelectionZoom', async ({ page }) => {
  await page.goto('/src/plugins/selectionzoom/test/playwright/ol/selectionzoom-ol.html');
  await page.evaluate(() => {
    window.mapjs = IDEE.map({
      container: 'mapjs',
    });
    window.mp = new IDEE.plugin.SelectionZoom({
      position: 'TL',
    });
    window.mapjs.addPlugin(window.mp);
  });
  
  const nPlugins = await page.evaluate(() => window.mapjs.getPlugins().length);
  expect(nPlugins).toBe(1);
});
