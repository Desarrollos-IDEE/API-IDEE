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

  let osm;
  await page.evaluate(() => {
    osm = new IDEE.layer.OSM({
    }, {
    }, {
      tileLoadFunction: (imageTile, src) => {
        // eslint-disable-next-line no-param-reassign
        imageTile.getImage().src = src;
        console.log('tile cargada');
      },
    });
    window.osm = osm;
  });
  await page.evaluate(() => {
    return new Promise((resolve) => {
      window.osm.on(IDEE.evt.ADDED_TO_MAP, () => {
        resolve();
      });
      window.mapjs.addLayers([window.osm]);
    });
  });
  await page.waitForTimeout(2000);
  expect(hasTileLog).toBe(true);
});
