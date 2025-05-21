import { test, expect } from '@playwright/test';

test.describe('GeoPackage Layer', () => {
  let map;
  test.beforeEach(async ({ page }) => {
    await page.goto('/test/playwright/ol/basic-ol.html');
    await page.evaluate(() => {
      map = IDEE.map({ container: 'map' });
      window.map = map;
    });
  });

  test('Add GeoPackage', async ({ page }) => {
    await page.evaluate(() => {
      window.fetch('/test/playwright/ol/PLAY-12-GeoPackage.spec.js-file/rivers.gpkg').then((response) => {
        const gpkg = new IDEE.layer.GeoPackage(response);

        map.addGeoPackage([gpkg]);
        window.gpkg = gpkg;
        const typeLayerVector = map.getLayers()[1].type;
        expect(typeLayerVector).toEqual('GeoJSON');
        const typeLayerTile = map.getLayers()[2].type;
        expect(typeLayerTile).toEqual('GeoPackageTile');
      });
    });
  });
});
