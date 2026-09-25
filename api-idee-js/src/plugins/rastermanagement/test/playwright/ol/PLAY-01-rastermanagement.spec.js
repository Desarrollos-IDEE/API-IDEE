import { test, expect } from '@playwright/test';

test('Test rastermanagement', async ({ page }) => {
  await page.goto('/src/plugins/rastermanagement/test/playwright/ol/rastermanagement-ol.html');
  await page.evaluate(() => {
    window.mapjs = IDEE.map({
      container: 'mapjs',
    });
    window.mp = new IDEE.plugin.RasterManagement({
      position: 'BL',
      collapsed: false,
      collapsible: false,
      tooltip: 'Gestión estilos ráster',
    });
    window.mapjs.addPlugin(window.mp);
  });

  const nPlugins = await page.evaluate(() => window.mapjs.getPlugins().length);
  expect(nPlugins).toBe(1);
});
