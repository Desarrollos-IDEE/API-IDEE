import { test, expect } from '@playwright/test';

test('Comprobamos que el bbox inicial es el especificado', async ({ page }) => {
  await page.goto('/test/playwright/ol/basic-ol.html');
  await page.evaluate(() => {
    const mapjs = IDEE.map({
      container: 'map',
      controls: ['scale*1'],
    });
    window.mapjs = mapjs;
  });
  await page.waitForFunction(() => window.mapjs.isFinished());

  await page.evaluate(() => {
    const lyProvincias = new IDEE.layer.WFS({
      url: 'https://hcsigc.juntadeandalucia.es/geoserver/wfs?',
      namespace: 'IECA',
      name: 'sigc_provincias_pob_centroides_1724756847583',
      legend: 'Provincias',
      geometry: 'POINT',
      extract: true,
    }, {
      minScale: 1000000,
      maxScale: 10000,
    });
    window.mapjs.addLayers(lyProvincias);
    window.lyProvincias = lyProvincias;
  });

  await page.evaluate(() => {
    const osm = new IDEE.layer.OSM({
      name: 'OSM',
      legend: 'OSM',
      url: 'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
    }, {
      minScale: 1000000,
      maxScale: 10000,
    });
    window.mapjs.addLayers(osm);
    window.osm = osm;
  });

  const minScaleWfs = await page.evaluate(() => window.lyProvincias.getMinScale());
  expect(minScaleWfs, 4).toEqual(1000000);

  const maxScaleWfs = await page.evaluate(() => window.lyProvincias.getMaxScale());
  expect(maxScaleWfs, 4).toEqual(10000);

  const minScaleOsm = await page.evaluate(() => window.osm.getMinScale());
  expect(minScaleOsm, 4).toEqual(1000000);

  const maxScaleOsm = await page.evaluate(() => window.osm.getMaxScale());
  expect(maxScaleOsm, 4).toEqual(10000);
});
