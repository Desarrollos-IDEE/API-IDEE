// eslint-disable-next-line import/no-extraneous-dependencies
import { test, expect } from '@playwright/test';

test('Test Plugin VectorsManagement', async ({ page }) => {
  await page.goto('/src/plugins/vectorsmanagement/test/playwright/ol/vectorsmanagement-ol.html', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    window.mapjs = IDEE.map({
      container: 'mapjs',
    });
    window.mp = new IDEE.plugin.VectorsManagement();
    window.mapjs.addPlugin(window.mp);
  });

  const nPlugins = await page.evaluate(() => window.mapjs.getPlugins(window.mp.name).length);
  expect(nPlugins).toBe(1);
});
