/* import { test, expect } from '@playwright/test';

test('Test WFSTControls v2', async ({ page }) => {
  await page.goto('/test/playwright/ol/wfstcontrols-ol.html');

  await page.evaluate(() => {
    window.mapjs = IDEE.map({
      container: 'mapjs',
    });

    const wfsLayer = new IDEE.layer.WFS({
      url: 'https://www.ign.es/wfs/redes-geodesicas?',
      legend: 'Red Geodésica Nacional por Técnicas Espaciales (REGENTE)',
      name: 'RED_REGENTE',
      geometry: 'POINT',
      extract: true,
    });

    window.mapjs.addWFS(wfsLayer);

    window.mp = new IDEE.plugin.WFSTControls({
      position: 'right',
      collapsed: true,
      order: 1,
      tooltip: 'Herramientas de edición',
      features: 'drawfeature,modifyfeature,deletefeature,editattribute',
      layername: 'RED_REGENTE',
      geometry: 'POINT',
      proxy: {
        status: true,
        disable: false,
      },
    });

    window.mapjs.addPlugin(window.mp);
  });

  const nPlugins = await page.evaluate(() => window.mapjs.getPlugins().length);
  // expect(nPlugins).toBe(1);
  expect(nPlugins).toBe(0); // Todavía no se ha implementado en esta version del API 2.0
}); */
