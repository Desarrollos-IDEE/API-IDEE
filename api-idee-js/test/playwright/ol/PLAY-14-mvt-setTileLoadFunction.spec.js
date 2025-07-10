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
    mvt = new IDEE.layer.MVT({
      url: 'https://vt-fedme.idee.es/vt.senderogr/{z}/{x}/{y}.pbf',
      // url: 'https://ahocevar.com/geoserver/gwc/service/tms/1.0.0/ne:ne_10m_admin_0_countries@EPSG%3A900913@pbf/{z}/{x}/{-y}.pbf',
      name: 'vectortile',
    }, {
    }, {
      tileLoadFunction: async (tile, url) => {
        console.log('tile cargada');
        tile.setLoader((extent, resolution, projection) => {
          fetch(url).then((response) => {
            response.arrayBuffer().then((data) => {
              const format = tile.getFormat(); // ol/format/MVT configured as source format
              const features = format.readFeatures(data, {
                extent,
                featureProjection: projection,
              });
              tile.setFeatures(features);
            });
          });
        });
      },
    });
    mapjs.addLayers([mvt]);
  });
  await page.waitForTimeout(4000);
  expect(hasTileLog).toBe(true);
});
