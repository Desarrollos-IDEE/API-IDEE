import { test, expect } from '@playwright/test';

test('Test plugin SelectionZoom', async ({ page }) => {
  await page.goto('/src/plugins/selectionzoom/test/playwright/ol/selectionzoom-ol.html', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    window.mapjs = IDEE.map({
      container: 'mapjs',
    });
    window.mp = new IDEE.plugin.SelectionZoom();
    window.mapjs.addPlugin(window.mp);
  });

  const nPlugins = await page.evaluate(() => window.mapjs.getPlugins(window.mp.name).length);
  expect(nPlugins).toBe(1);
});
