import { test, expect } from '@playwright/test';

test('Test MaxExtZoom', async ({ page }) => {
  await page.goto('/src/plugins/maxextzoom/test/playwright/ol/maxextzoom-ol.html');
  await page.evaluate(() => {
    window.mapjs = IDEE.map({
      container: 'mapjs',
    });
    window.mp = new IDEE.plugin.MaxExtZoom({
      position: 'TL',
    });
    window.mapjs.addPlugin(window.mp);
  });
  
  const nPlugins = await page.evaluate(() => window.mapjs.getPlugins().length);
  expect(nPlugins).toBe(1);
});
