import { test, expect } from '@playwright/test';
import { prepareGeoPackagePage } from './fixtures/geopackage';

test.beforeEach(async ({ page }) => prepareGeoPackagePage(page));

test('GeoPackage: toGeoJSON con tableNames exporta solo las tablas vectoriales cargadas', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const complete = new IDEE.layer.GeoPackage({
      url: '/fixtures/geopackage/multivector.gpkg',
      name: 'multi',
    });
    const restricted = new IDEE.layer.GeoPackage({
      url: '/fixtures/geopackage/multivector.gpkg',
      name: 'multi',
      tableNames: ['routes'],
    });
    await Promise.all([complete.whenReady(), restricted.whenReady()]);
    const geojson = restricted.toGeoJSON();
    return {
      completeTables: complete.toGeoJSON().features.map(({ tableName }) => tableName).sort(),
      featureTables: restricted.getMetadata().featureTables.slice().sort(),
      layers: restricted.getLayers().map(({ name }) => name),
      tables: geojson.features.map(({ tableName }) => tableName),
      geometry: geojson.features[0].geometry,
      crs: geojson.crs,
    };
  });

  expect(result.completeTables).toEqual(['places', 'routes']);
  expect(result.featureTables).toEqual(['places', 'routes']);
  expect(result.layers).toEqual(['multi:routes']);
  expect(result.tables).toEqual(['routes']);
  expect(result.geometry).toEqual({ type: 'LineString', coordinates: [[0, 0], [1, 1]] });
  expect(result.crs).toEqual({ type: 'name', properties: { name: 'EPSG:4326' } });
});
