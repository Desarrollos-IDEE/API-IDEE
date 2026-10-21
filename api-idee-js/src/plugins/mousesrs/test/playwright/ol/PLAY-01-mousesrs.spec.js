import { test, expect } from '@playwright/test';

test('Test plugin MouseSRS', async ({ page }) => {
  await page.goto('/src/plugins/mousesrs/test/playwright/ol/mousesrs-ol.html', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    window.mapjs = IDEE.map({
      container: 'mapjs',
    });
    window.mp = new IDEE.plugin.MouseSRS();
    window.mapjs.addPlugin(window.mp);
  });
  
  const nPlugins = await page.evaluate(() => window.mapjs.getPlugins(window.mp.name).length);
  expect(nPlugins).toBe(1);
});
