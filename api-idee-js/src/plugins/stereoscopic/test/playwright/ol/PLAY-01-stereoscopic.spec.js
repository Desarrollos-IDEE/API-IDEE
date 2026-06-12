import { test, expect } from '@playwright/test';

test('Test stereoscopic', async ({ page }) => {
  await page.goto('/src/plugins/stereoscopic/test/playwright/ol/stereoscopic-ol.html');
  await page.evaluate(() => {
    window.mapjs = IDEE.map({
      container: 'mapjs',
    });
    window.mp = new IDEE.plugin.Stereoscopic({
      position: 'TL',
      collapsible: true,
      collapsed: false,
      orbitControls: false,
      anaglyphActive: true,
      defaultAnaglyphActive: true,
      maxMaginification: 50,
    });
    window.mapjs.addPlugin(window.mp);
  });
  
  const nPlugins = await page.evaluate(() => window.mapjs.getPlugins().length);
  expect(nPlugins).toBe(1);
});
