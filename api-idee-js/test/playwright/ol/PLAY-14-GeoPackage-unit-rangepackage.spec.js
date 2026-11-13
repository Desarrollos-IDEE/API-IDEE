import { test, expect } from '@playwright/test';
import initSqlJs from 'sql.js';
import { readFileSync } from 'fs';
import { ByteSource, PackageReader } from '../../../src/facade/js/datasource/contracts';
import RangeGeoPackage, { RangeUnsupportedError } from '../../../src/facade/js/datasource/geopackage/RangeGeoPackage';
import RangeTileProvider from '../../../src/facade/js/datasource/geopackage/RangeTileProvider';
import { createGdalGeoPackage, createGeoPackage } from './fixtures/geopackage';

class MemoryBytes extends ByteSource {
  constructor(bytes) {
    super();
    this.bytes = bytes;
    this.read_ = 0;
    this.disposed = false;
  }

  read(offset, length) {
    const chunk = this.bytes.subarray(offset, offset + length);
    this.read_ += chunk.length;
    return Promise.resolve(chunk);
  }

  dispose() {
    this.disposed = true;
  }
}

const POINTS = Array.from({ length: 3000 }, (_, index) => ({
  id: index + 1,
  x: (index % 100) * 1.2 - 60,
  y: Math.floor(index / 100) * 2 - 30,
}));

let gdalBytes;
test.beforeAll(async () => {
  gdalBytes = new Uint8Array(await createGdalGeoPackage(POINTS.map(({ id, x, y }) => ({
    type: 'Feature',
    properties: { n: id, title: `Punto ${id} ñ`, description: 'x'.repeat(200) },
    geometry: { type: 'Point', coordinates: [x, y] },
  }))));
});

const inside = ([minX, minY, maxX, maxY]) => POINTS
  .filter(({ x, y }) => x >= minX && x <= maxX && y >= minY && y <= maxY).map(({ id }) => id);

test('GeoPackage por rangos: consulta por extensión con el índice y lectura completa', async () => {
  const source = new MemoryBytes(gdalBytes);
  const pack = new RangeGeoPackage(source);
  const [provider] = await pack.getVectorProviders();

  expect(pack).toBeInstanceOf(PackageReader);
  expect(provider.getTableName()).toBe('places');
  expect(provider.hasSpatialIndex()).toBe(true);
  expect(await provider.prepareForBoundingBox()).toBe(true);
  expect(provider.getEmptyGeoJSON()).toEqual({
    type: 'FeatureCollection', features: [], crs: { type: 'name', properties: { name: 'EPSG:4326' } },
  });

  const before = source.read_;
  const extent = [-10.5, -5.5, 10.5, 5.5];
  const result = await provider.getGeoJSONByBoundingBox(extent, 'EPSG:4326');
  expect(result.features.map(({ id }) => Number(id))).toEqual(inside(extent));
  expect(result.features[0]).toMatchObject({
    type: 'Feature',
    geometry: { type: 'Point' },
    properties: { fid: Number(result.features[0].id), title: expect.stringMatching(/^Punto \d+ ñ$/) },
  });
  expect(result.features[0].properties.geom).toBeUndefined();
  expect(source.read_ - before).toBeLessThan(gdalBytes.length / 5);

  const all = await provider.getGeoJSON();
  expect(all.features).toHaveLength(3000);
  expect(all.features[0].id).toBeUndefined();
});

test('GeoPackage por rangos: la extensión se transforma desde la proyección del mapa', async () => {
  const [provider] = await new RangeGeoPackage(new MemoryBytes(gdalBytes)).getVectorProviders();
  const degrees = [-10.5, -5.5, 10.5, 5.5];
  const meters = [-1168854.65, -613257.27, 1168854.65, 613257.27];

  const projected = await provider.getGeoJSONByBoundingBox(meters, 'EPSG:3857');
  expect(projected.features.map(({ id }) => Number(id))).toEqual(inside(degrees));
});

test('GeoPackage por rangos: metadatos estructurados', async () => {
  const pack = new RangeGeoPackage(new MemoryBytes(gdalBytes));
  const metadata = await pack.getMetadata();

  expect(metadata).toMatchObject({
    applicationId: 0x47504B47,
    featureTables: ['places'],
    tileTables: [],
    attributeTables: [],
  });
  expect(metadata.tables.places).toMatchObject({
    tableName: 'places',
    type: 'features',
    count: 3000,
    srs: { id: 4326, organization: 'EPSG' },
    geometry: { column: 'geom', type: 'POINT' },
  });
  expect(metadata.tables.places.columns.map(({ name, dataType, primaryKey }) => [name, dataType, primaryKey]))
    .toEqual([['fid', 'INTEGER', true], ['geom', 'POINT', false], ['n', 'MEDIUMINT', false],
      ['title', 'TEXT', false], ['description', 'TEXT', false]]);
  expect(metadata.extensions).toEqual([expect.objectContaining({ name: 'gpkg_rtree_index' })]);

  pack.dispose();
});

test('GeoPackage por rangos: sin índice espacial recorre la tabla y filtra', async () => {
  const pack = new RangeGeoPackage(new MemoryBytes(new Uint8Array(await createGeoPackage('bbox'))));
  const [provider] = await pack.getVectorProviders();

  expect(provider.hasSpatialIndex()).toBe(false);
  const east = await provider.getGeoJSONByBoundingBox([90, -1, 110, 1], 'EPSG:4326');
  expect(east.features.map(({ properties }) => properties.title)).toEqual(['Este']);
  expect(east.features[0].id).toBe('2');
  expect((await pack.getMetadata()).tables.places.count).toBeNull();
});

test('GeoPackage por rangos: curvas, teselas y ficheros que no son GeoPackage no se admiten', async () => {
  const curves = new RangeGeoPackage(new MemoryBytes(new Uint8Array(await createGeoPackage('curves'))));
  await expect(curves.getMetadata()).rejects.toThrow('geometrías curvas');
  await expect(curves.getMetadata()).rejects.toBeInstanceOf(RangeUnsupportedError);

  const mixed = new RangeGeoPackage(
    new MemoryBytes(new Uint8Array(await createGeoPackage('mixed'))),
    {},
    { createTileProvider: null },
  );
  await expect(mixed.getVectorProviders()).rejects.toThrow('tablas de teselas');

  const SQL = await initSqlJs({ wasmBinary: readFileSync(require.resolve('sql.js/dist/sql-wasm.wasm')) });
  const db = new SQL.Database();
  db.run('CREATE TABLE t (a INTEGER)');
  const plain = new RangeGeoPackage(new MemoryBytes(db.export()));
  db.close();
  await expect(plain.getMetadata()).rejects.toBeInstanceOf(RangeUnsupportedError);
});

const PNG_1PX = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aV1kAAAAASUVORK5CYII=';

test('GeoPackage por rangos: teselas de una matriz alineada con WebMercator', async () => {
  const pack = new RangeGeoPackage(new MemoryBytes(new Uint8Array(await createGeoPackage('mixed'))));
  const [tiles] = await pack.getTileProviders();
  const [vector] = await pack.getVectorProviders();

  expect(tiles).toBeInstanceOf(RangeTileProvider);
  expect(tiles.getTableName()).toBe('imagery');
  expect(tiles.getProjection()).toBe('EPSG:3857');
  expect(tiles.getExtent()[0]).toBeCloseTo(-20037508.342789244, 3);
  expect([tiles.getMinZoom(), tiles.getMaxZoom()]).toEqual([0, 0]);
  expect(await tiles.getTile(0, 0, 0)).toBe(`data:image/png;base64,${PNG_1PX}`);
  expect(await tiles.getTile(1, 0, 0)).toBeUndefined();
  expect(await tiles.getTile(0, 0, 1)).toBeUndefined();
  expect(await tiles.whenIdle()).toEqual([]);
  expect(vector.getTableName()).toBe('places');
  expect((await pack.getMetadata()).tables.imagery.tileMatrices)
    .toEqual([expect.objectContaining({ zoomLevel: 0, matrixWidth: 1 })]);
});

test('GeoPackage por rangos: una matriz no alineada con WebMercator no se admite', async () => {
  const SQL = await initSqlJs({ wasmBinary: readFileSync(require.resolve('sql.js/dist/sql-wasm.wasm')) });
  const db = new SQL.Database(new Uint8Array(await createGeoPackage('raster')));
  db.run("UPDATE gpkg_tile_matrix_set SET srs_id = 4326, min_x = -180, max_x = 180, min_y = -90, max_y = 90");
  const pack = new RangeGeoPackage(new MemoryBytes(db.export()));
  db.close();
  await expect(pack.getTileProviders()).rejects.toThrow('no alineada con WebMercator');
});
