import { test, expect } from '@playwright/test';

test('Comprobamos intersect geometría con WFS', async ({ page }) => {
  await page.goto('/test/playwright/ol/basic-ol.html');
  let mapjs;
  await page.evaluate(() => {
    mapjs = IDEE.map({
      container: 'map',
      layers: ['OSM'],
      projection: 'EPSG:4326',
      zoom: 5,
      center: [-5.9326171875, 38.15002441406251],
    });
  });
  await page.waitForFunction(() => mapjs.isFinished());
  let lyMunicipios;
  await page.evaluate(() => {
    lyMunicipios = new IDEE.layer.OGCAPIFeatures({
      url: 'https://api-features.ign.es/collections/',
      name: 'administrativeunit',
      legend: 'AU Unidades administrativas',
      extract: true,
      conditional: { nameunit: 'Lepe' },
      limit: 30,
    });
    mapjs.addLayers(lyMunicipios);
  });

  const featuresCount = await page.evaluate(() => {
    return new Promise((resolve) => {
      lyMunicipios.on(IDEE.evt.LOAD, () => {
        const miGeometria = {
          'type': 'Polygon',
          'coordinates': [
            [
              [-7.551353395275297, 37.83827459850633],
              [-5.225846402130134, 37.59569127398093],
              [-5.809697536223998, 35.923581077760645],
              [-7.858122260237212, 37.642705220575095],
              [-7.551353395275297, 37.83827459850633],
            ],
          ],
        };
        const filter = IDEE.filter.spatial.INTERSECT(miGeometria);
        lyMunicipios.setFilter(filter);
        resolve(lyMunicipios.getFeatures().length);
      });
    });
  });
  expect(featuresCount).toEqual(1);
});
