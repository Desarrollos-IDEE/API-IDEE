import { test, expect } from '@playwright/test';

test('Capa WMS - tileLoadFunction', async ({ page }) => {
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
    const wms = new IDEE.layer.WMS(
      {
        url: 'https://www.ign.es/wms-inspire/unidades-administrativas',
        name: 'AU.AdministrativeBoundary',
        tiled: true,
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
    window.mapjs.addLayers([wms]);
  });
  await page.waitForTimeout(4000);
  expect(hasTileLog).toBe(true);
});
