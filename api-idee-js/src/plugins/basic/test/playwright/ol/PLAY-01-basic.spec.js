import { test, expect } from '@playwright/test';

test('Plugin Test Basic', async ({ page }) => {
  // Sin esperar al evento load: depende de iconos y fuentes remotos que la prueba no necesita
  await page.goto('/src/plugins/basic/test/playwright/ol/basic-ol.html', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    window.mapjs = IDEE.map({
      container: 'mapjs',
    });
    window.mp = new IDEE.plugin.Basic({
      position: 'left',
    });
    window.mapjs.addPlugin(window.mp);
  });

  const nPlugins = await page.evaluate(() => window.mapjs.getPlugins().length);
  expect(nPlugins).toBe(1);
});
