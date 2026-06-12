import { test, expect } from '@playwright/test';

test('Test Magnify', async ({ page }) => {
  await page.goto('/src/plugins/magnify/test/playwright/ol/magnify-ol.html');
  await page.evaluate(() => {
    window.mapjs = IDEE.map({
      container: 'mapjs',
      projection: 'EPSG:25830',
      layers: ['OSM'],
    });

    const wmts = new IDEE.layer.WMTS({
      url: "http://www.ign.es/wmts/pnoa-ma",
      name: "OI.OrthoimageCoverage",
      matrixSet: "EPSG:25830",
      legend: "PNOA"
    }, {
      format: 'image/png'
    });
    
    mapjs.addLayers([wmts]);

    window.mp = new IDEE.plugin.Magnify({
      position: 'TL',
      zoomMax: 19,
      zoom: 5,
      layers: 'OI.OrthoimageCoverage'
    });
    window.mapjs.addPlugin(window.mp);
  });
  
  const nPlugins = await page.evaluate(() => window.mapjs.getPlugins().length);
  expect(nPlugins).toBe(1);
});