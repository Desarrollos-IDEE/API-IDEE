import { test, expect } from '@playwright/test';

test('Test plugin Layerswitcher', async ({ page }) => {
  await page.goto('/src/plugins/layerswitcher/test/playwright/ol/layerswitcher-ol.html', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    window.mapjs = IDEE.map({
      container: 'mapjs',
    });
    window.mp = new IDEE.plugin.Layerswitcher();
    window.mapjs.addPlugin(window.mp);
  });

  const nPlugins = await page.evaluate(() => window.mapjs.getPlugins(window.mp.name).length);
  expect(nPlugins).toBe(1);
});
