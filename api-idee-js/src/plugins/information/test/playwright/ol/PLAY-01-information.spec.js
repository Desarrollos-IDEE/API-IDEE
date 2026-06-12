import { test, expect } from '@playwright/test';

test('Test Information', async ({ page }) => {
  await page.goto('/src/plugins/information/test/playwright/ol/information-ol.html');
  await page.evaluate(() => {
    window.mapjs = IDEE.map({
      container: 'mapjs',
    });
    window.mp = new IDEE.plugin.Information({
      position: 'TR', // TL | TR | BL | BR
      buffer: 100,
      opened: 'all', // 'one' | 'all' | 'closed'
      featureCount: 3, // 10, 
      format: 'text/html', //  'text/html' como default || ('text/plain'|'plain') | ('application/vnd.ogc.gml'|'gml')
      outputDownloadFormat: 'csv',
    });
    window.mapjs.addPlugin(window.mp);
  });
  
  const nPlugins = await page.evaluate(() => window.mapjs.getPlugins().length);
  expect(nPlugins).toBe(1);
});
