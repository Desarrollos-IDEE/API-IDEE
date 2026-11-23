import { test, expect } from '@playwright/test';

test.describe('IDEE.format.WKT', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/test/playwright/cesium/basic-cesium.html');
    await page.evaluate(() => {
      window.format = new IDEE.format.WKT();
      // En Cesium las features se cargan de forma asíncrona: hay que esperar a que estén listas
      window.loaded = (...features) => Promise.all(
        features.flat().map((f) => f.getImpl().isLoadCesiumFeature_),
      );
    });
  });

  test('read: WKT -> Feature', async ({ page }) => {
    const { id, geometry } = await page.evaluate(async () => {
      const feature = format.read('POLYGON ((-5 37, -4 37, -4 38, -5 38, -5 37))', { id: 'poligono' });
      await loaded(feature);
      return { id: feature.getId(), geometry: feature.getGeometry() };
    });
    expect(id).toBe('poligono');
    expect(geometry.type).toBe('Polygon');
    expect(geometry.coordinates[0]).toHaveLength(5);
  });

  test('read con dataProjection EPSG:3857', async ({ page }) => {
    const geometry = await page.evaluate(async () => {
      const feature = format.read('POINT (-500000 4500000)', { dataProjection: 'EPSG:3857' });
      await loaded(feature);
      return feature.getGeometry();
    });
    expect(geometry.type).toBe('Point');
    expect(geometry.coordinates[0]).toBeCloseTo(-4.4915, 3);
    expect(geometry.coordinates[1]).toBeCloseTo(37.4356, 3);
  });

  test('readCollection: GEOMETRYCOLLECTION -> una feature por geometría', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const features = format.readCollection(
        'GEOMETRYCOLLECTION (POINT (-6 37), LINESTRING (-6 36, -3 36))',
        { ids: ['punto', 'linea'] },
      );
      await loaded(features);
      return features.map((f) => ({ id: f.getId(), type: f.getGeometry().type }));
    });
    expect(result).toEqual([
      { id: 'punto', type: 'Point' },
      { id: 'linea', type: 'LineString' },
    ]);
  });

  test('write: Feature -> WKT', async ({ page }) => {
    const wkt = await page.evaluate(async () => {
      const feature = format.read('POLYGON ((-5 37, -4 37, -4 38, -5 38, -5 37))');
      await loaded(feature);
      return format.write(feature, { decimals: 6 });
    });
    expect(wkt).toBe('POLYGON((-5 37,-4 37,-4 38,-5 38,-5 37))');
  });

  test('write con decimals y dataProjection', async ({ page }) => {
    const wkt = await page.evaluate(async () => {
      const feature = format.read('POINT (-500000 4500000)', { dataProjection: 'EPSG:3857' });
      await loaded(feature);
      return format.write(feature, { dataProjection: 'EPSG:3857', decimals: 1 });
    });
    expect(wkt).toBe('POINT(-500000 4500000)');
  });

  test('writeCollection: features -> GEOMETRYCOLLECTION', async ({ page }) => {
    const wkt = await page.evaluate(async () => {
      const features = format.readCollection('GEOMETRYCOLLECTION (POINT (-6 37), LINESTRING (-6 36, -3 36))');
      await loaded(features);
      return format.writeCollection(features, { decimals: 6 });
    });
    expect(wkt).toBe('GEOMETRYCOLLECTION(POINT(-6 37),LINESTRING(-6 36,-3 36))');
  });

  test('writeFeature: geometría GeoJSON -> WKT', async ({ page }) => {
    const wkt = await page.evaluate(() => (
      format.writeFeature({ type: 'MultiPoint', coordinates: [[-4, 37], [-3, 38]] })
    ));
    expect(wkt).toBe('MULTIPOINT((-4 37),(-3 38))');
  });
});
