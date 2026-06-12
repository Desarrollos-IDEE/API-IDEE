import { test, expect } from '@playwright/test';

test('Test WFSTControls', async ({ page }) => {
  await page.goto('/src/plugins/wfstcontrols/test/playwright/ol/wfstcontrols-ol.html');
  await page.evaluate(() => {
    window.mapjs = IDEE.map({
      container: 'mapjs',
    });

    const wfsLayer = new IDEE.layer.WFS({
      url: 'https://www.ign.es/wfs/redes-geodesicas?',
      legend: 'Red Geodésica Nacional por Técnicas Espaciales (REGENTE)',
      name: 'RED_REGENTE',
      geometry: 'POINT',
      extract: true
    });
    window.mapjs.addWFS(wfsLayer);

    window.mp = new IDEE.plugin.WFSTControls({
      features: 'drawfeature,modifyfeature,deletefeature,editattribute',
      proxy: {}
    });
    window.mapjs.addPlugin(window.mp);
  });
  
  const nPlugins = await page.evaluate(() => window.mapjs.getPlugins().length);
  expect(nPlugins).toBe(1);
});
