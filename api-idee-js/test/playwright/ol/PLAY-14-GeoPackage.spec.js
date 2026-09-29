import { test, expect } from '@playwright/test';
import { prepareGeoPackagePage } from './fixtures/geopackage';

test('Capa GeoPackage', async ({ page }) => {
  await prepareGeoPackagePage(page);
  const result = await page.evaluate(async () => {
    const map = IDEE.map({ container: 'map', layers: [], controls: [] });
    const response = await window.fetch('/fixtures/geopackage/mixed.gpkg');
    const gpkg = new IDEE.layer.GeoPackage(response);
    let addedPackage = 0;
    let addedTiles = 0;
    map.on(IDEE.evt.ADDED_GEOPACKAGE, () => { addedPackage += 1; });
    map.on(IDEE.evt.ADDED_GEOPACKAGE_TILE, () => { addedTiles += 1; });
    const loaded = new Promise((resolve) => { gpkg.once(IDEE.evt.LOAD_LAYERS, resolve); });
    map.addGeoPackage(gpkg);
    await loaded;
    return {
      addedPackage,
      addedTiles,
      types: gpkg.getLayers().map((layer) => layer.type).sort(),
      attached: gpkg.getLayers().every((layer) => map.getLayers().includes(layer)),
    };
  });
  expect(result).toEqual({
    addedPackage: 1,
    addedTiles: 1,
    types: ['GeoJSON', 'GeoPackageTile'],
    attached: true,
  });
});
