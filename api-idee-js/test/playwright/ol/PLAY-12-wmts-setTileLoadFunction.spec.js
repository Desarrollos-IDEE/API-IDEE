import { test, expect } from '@playwright/test';

test('Capa WMTS - tileLoadFunction', async ({ page }) => {
  let hasTileLog = false;

  await page.goto('/test/playwright/ol/basic-ol.html');

  page.on('console', (message) => {
    if (message.type() === 'log' && message.text() === 'tile cargada') {
      hasTileLog = true;
    }
  });

  await page.evaluate(() => {
    const mapjs = IDEE.map({
      container: 'map',
    });
    window.mapjs = mapjs;
  });

  await page.evaluate(() => {
    const wms = new IDEE.layer.WMTS(
      {
        url: 'https://wmts-mapa-lidar.idee.es/lidar',
        name: 'EL.GridCoverageDSM',
        legend: 'Modelo Digital de Superficies LiDAR',
        matrixSet: 'GoogleMapsCompatible',
      },
      {
      },
      {
        tileLoadFunction: (imageTile, src) => {
          // eslint-disable-next-line no-param-reassign
          imageTile.getImage().src = src;
          console.log('tile cargada');
        },
      },
    );
    window.wms = wms;
    window.mapjs.addLayers([window.wms]);
  });
  await page.waitForTimeout(4000);
  expect(hasTileLog).toBe(true);
});
