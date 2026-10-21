import { test, expect } from '@playwright/test';

test('Test plugin BackImgLayer', async ({ page }) => {
  // Sin esperar al evento load: depende de iconos y fuentes remotos que la prueba no necesita
  await page.goto('/src/plugins/backimglayer/test/playwright/ol/backimglayer-ol.html', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    window.mapjs = IDEE.map({
      container: 'mapjs',
    });
    window.mp = new IDEE.plugin.BackImgLayer();
    window.mapjs.addPlugin(window.mp);
  });
  const nPlugins = await page.evaluate(() => window.mapjs.getPlugins(window.mp.name).length);
  expect(nPlugins).toBe(1);
});
