import { test, expect } from '@playwright/test';

test('Test MouseSRS', async ({ page }) => {
  await page.goto('/src/plugins/mousesrs/test/playwright/ol/mousesrs-ol.html');
  await page.evaluate(() => {
    window.mapjs = IDEE.map({
      container: 'mapjs',
    });
    window.mp = new IDEE.plugin.MouseSRS({
      position: 'TL',
    });
    window.mapjs.addPlugin(window.mp);
  });
  
  const nPlugins = await page.evaluate(() => window.mapjs.getPlugins().length);
  expect(nPlugins).toBe(1);
});
