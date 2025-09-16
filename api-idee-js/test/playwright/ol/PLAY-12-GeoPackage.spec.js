import { test, expect } from '@playwright/test';

test('Capa GeoPackage', async ({ page }) => {
  let addGeoPackage = false;
  let addGeoPackageTile = false;

  await page.goto('/test/playwright/ol/basic-ol.html');

  page.on('console', (msg) => {
    if (msg.type() === 'log' && msg.text() === 'Capa GeoPackage añadida') {
      addGeoPackage = true;
    }

    if (msg.type() === 'log'
      && msg.text() === 'Capa GeoPackageTile añadida') {
      addGeoPackageTile = true;
    }
  });

  await page.evaluate(() => {
    const mapjs = IDEE.map({
      container: 'map',
    });
    window.mapjs = mapjs;
  });

  await page.evaluate(() => {
    window.fetch(`${IDEE.config.STATIC_RESOURCES_URL}/Datos/gpkg/rivers.gpkg`).then((response) => {
      const gpkg = new IDEE.layer.GeoPackage(response);

      window.mapjs.on(IDEE.evt.ADDED_GEOPACKAGE, () => {
        console.log('Capa GeoPackage añadida');
      });

      window.mapjs.on(IDEE.evt.ADDED_GEOPACKAGE_TILE, () => {
        console.log('Capa GeoPackageTile añadida');
      });

      window.mapjs.addGeoPackage([gpkg]);
    });
  });
  await page.waitForTimeout(5000);
  expect(addGeoPackage).toBe(true);
  expect(addGeoPackageTile).toBe(true);
  const typeLayerVector = await page.evaluate(() => window.mapjs.getLayers()[1].type);
  expect(typeLayerVector).toEqual('GeoJSON');
  const typeLayerTile = await page.evaluate(() => window.mapjs.getLayers()[2].type);
  expect(typeLayerTile).toEqual('GeoPackageTile');
});
