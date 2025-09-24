import { test, expect } from '@playwright/test';

test('Capa MVT - tileLoadFunction', async ({ page }) => {
  let hasTileLog = false;

  await page.goto('/test/playwright/ol/basic-ol.html');

  page.on('console', (message) => {
    if (message.type() === 'log' && message.text() === 'tile cargada') {
      hasTileLog = true;
    }
  });

  let mapjs;
  await page.evaluate(() => {
    mapjs = IDEE.map({
      container: 'map',
    });
  });

  let mvt;
  await page.evaluate(() => {
    mvt = new IDEE.layer.OSM({
    }, {
    }, {
      tileLoadFunction: (imageTile, src) => {
        // eslint-disable-next-line no-param-reassign
        imageTile.getImage().src = src;
        console.log('tile cargada');
      },
    });
    mapjs.addLayers([mvt]);
  });
  await page.waitForTimeout(4000);
  expect(hasTileLog).toBe(true);
});
