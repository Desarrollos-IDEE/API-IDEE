import { test, expect } from '@playwright/test';

test('Test infocoordinates', async ({ page }) => {
  await page.goto('/src/plugins/infocoordinates/test/playwright/ol/infocoordinates-ol.html');
  await page.evaluate(() => {
    window.mapjs = IDEE.map({
      container: 'mapjs',
    });
    window.mp = new IDEE.plugin.Infocoordinates({
      position: 'TL',
      collapsed: true,
      collapsible: true,
      tooltip: 'Información de coordenadas',
      decimalGEOcoord: 12,
      decimalUTMcoord: 12,
      helpUrl: 'https://www.ign.es/',
      outputDownloadFormat: 'txt', // csv | txt
    });
    window.mapjs.addPlugin(window.mp);
  });
  
  const nPlugins = await page.evaluate(() => window.mapjs.getPlugins().length);
  expect(nPlugins).toBe(1);
});
