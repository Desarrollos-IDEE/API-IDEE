import { test, expect } from '@playwright/test';

test('Test Catalogmanager', async ({ page }) => {
  await page.goto('/src/plugins/catalogmanager/test/playwright/ol/catalogmanager-ol.html');
  await page.evaluate(() => {
    window.mapjs = IDEE.map({
      container: 'mapjs',
    });
    window.mp = new IDEE.plugin.Catalogmanager({
      position: 'TL',
    });
    window.mapjs.addPlugin(window.mp);
  });
  
  const nPlugins = await page.evaluate(() => window.mapjs.getPlugins().length);
  expect(nPlugins).toBe(1);
});
