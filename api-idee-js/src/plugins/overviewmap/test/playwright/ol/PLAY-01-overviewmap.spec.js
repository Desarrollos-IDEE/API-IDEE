import { test, expect } from '@playwright/test';

test('Test OverviewMap', async ({ page }) => {
  await page.goto('/src/plugins/overviewmap/test/playwright/ol/overviewmap-ol.html');
  await page.evaluate(() => {
    window.mapjs = IDEE.map({
      container: 'mapjs',
    });
    window.mp = new IDEE.plugin.OverviewMap({
      position: 'TL',
    });
    window.mapjs.addPlugin(window.mp);
  });
  
  const nPlugins = await page.evaluate(() => window.mapjs.getPlugins().length);
  expect(nPlugins).toBe(1);
});
