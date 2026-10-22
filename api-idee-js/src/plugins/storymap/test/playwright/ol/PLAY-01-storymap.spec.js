import { test, expect } from '@playwright/test';

test('Test plugin StoryMap', async ({ page }) => {
  await page.goto('/src/plugins/storymap/test/playwright/ol/storymap-ol.html', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    window.mapjs = IDEE.map({
      container: 'mapjs',
    });

    window.mp = new IDEE.plugin.StoryMap();
    window.mapjs.addPlugin(window.mp);
  });

  const nPlugins = await page.evaluate(() => window.mapjs.getPlugins(window.mp.name).length);
  expect(nPlugins).toBe(1);
});
