import { test, expect } from '@playwright/test';

test('Test Layerswitcher', async ({ page }) => {
  await page.goto('/src/plugins/layerswitcher/test/playwright/ol/layerswitcher-ol.html');
  await page.evaluate(() => {
    window.mapjs = IDEE.map({
      container: 'mapjs',
    });
    window.mp = new IDEE.plugin.Layerswitcher({
      position: 'TR', // TL | TR | BL | BR
      collapsed: true,
      collapsible: true,
    });
    window.mapjs.addPlugin(window.mp);
  });
  
  const nPlugins = await page.evaluate(() => window.mapjs.getPlugins().length);
  expect(nPlugins).toBe(1);
});
