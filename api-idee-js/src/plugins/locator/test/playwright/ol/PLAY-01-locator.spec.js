// eslint-disable-next-line import/no-extraneous-dependencies
import { test, expect } from '@playwright/test';

test('Test Plugin Locator', async ({ page }) => {
  await page.goto('/src/plugins/locator/test/playwright/ol/locator-ol.html', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    window.mapjs = IDEE.map({
      container: 'mapjs',
    });
    window.mp = new IDEE.plugin.Locator();
    window.mapjs.addPlugin(window.mp);
  });

  const isAddedToMap = await page.evaluate(() => {
    return window.mapjs.getPlugins(window.mp.name).length === 1;
  });

  expect(isAddedToMap).toBe(true);
});
