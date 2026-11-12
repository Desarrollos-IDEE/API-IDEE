import { test, expect } from '@playwright/test';
import { PackageReader, GeometryLinearizer } from '../../../src/facade/js/datasource/contracts';
import GeoPackageProviderFactory from '../../../src/facade/js/datasource/geopackage/ProviderFactory';
import CurveLinearizer from '../../../src/facade/js/datasource/geopackage/CurveLinearizer';
import GeoPackageConnector from '../../../src/facade/js/connector/GeoPackageConnector';

class FakeProvider {
  constructor(pack, name, options) {
    this.pack = pack;
    this.name = name;
    this.options = options;
  }

  getTableName() {
    return this.name;
  }

  setLinearGeometries(geometries) {
    this.geometries = geometries;
  }
}

const fakePack = (types) => ({
  getFeatureDao: (name) => ({
    geometryColumns: { geometry_type_name: types[name], column_name: 'geom' },
    table: { getIdColumn: () => ({ name: 'fid' }) },
  }),
});

test('proveedores: se crea uno por tabla con sus opciones', () => {
  class FakeTile extends FakeProvider {}
  const factory = new GeoPackageProviderFactory({ VectorProvider: FakeProvider, TileProvider: FakeTile });
  const pack = {};

  const { vectorProviders, tileProviders } = factory.createProviders(
    pack,
    { features: ['places', 'roads'], tiles: ['imagery'] },
    { vector: { places: { a: 1 } }, tile: { imagery: { tileSize: 512 } } },
  );

  expect(vectorProviders.map(({ name, options }) => [name, options]))
    .toEqual([['places', { a: 1 }], ['roads', undefined]]);
  expect(tileProviders).toHaveLength(1);
  expect(tileProviders[0]).toBeInstanceOf(FakeTile);
  expect(tileProviders[0].options).toEqual({ tileSize: 512 });
  expect(vectorProviders[0].pack).toBe(pack);
  expect(factory.createProviders(pack, { features: [], tiles: [] }))
    .toEqual({ vectorProviders: [], tileProviders: [] });
});

test('curvas: sin tablas curvas no se invoca la conversión', async () => {
  const calls = [];
  const linearizer = new CurveLinearizer({ linearize: (...args) => { calls.push(args); } });

  await linearizer.apply(fakePack({ places: 'POINT' }), new Uint8Array(1), ['places'], []);

  expect(linearizer).toBeInstanceOf(GeometryLinearizer);
  expect(calls).toHaveLength(0);
});

test('curvas: las tablas curvas se convierten y sus proveedores reciben las geometrías', async () => {
  const bytes = new Uint8Array(1);
  const calls = [];
  const arcs = new Map([[7, { type: 'LineString', coordinates: [[0, 0], [1, 1]] }]]);
  const linearizer = new CurveLinearizer({
    linearize: (...args) => {
      calls.push(args);
      return Promise.resolve(new Map([['arcs', arcs]]));
    },
  });
  const providers = ['places', 'arcs', 'labels'].map((name) => new FakeProvider({}, name));

  await linearizer.apply(
    fakePack({ places: 'POINT', arcs: 'CircularString', labels: 'COMPOUNDCURVE' }),
    bytes,
    ['places', 'arcs', 'labels'],
    providers,
  );

  expect(calls).toEqual([[bytes, [
    { name: 'arcs', idColumn: 'fid', geometryColumn: 'geom' },
    { name: 'labels', idColumn: 'fid', geometryColumn: 'geom' },
  ]]]);
  expect(providers.map(({ geometries }) => geometries)).toEqual([undefined, arcs, undefined]);
});

const createDoubles = () => {
  const log = [];
  const pack = {
    getTables: () => ({ features: ['places'], tiles: ['imagery'], attributes: [] }),
  };
  return {
    log,
    pack,
    dependencies: {
      database: {
        open: (bytes) => {
          log.push(['open', Array.from(bytes)]);
          return Promise.resolve(pack);
        },
        close: (value) => log.push(['close', value === pack]),
      },
      providerFactory: {
        createProviders: (value, tables, options) => {
          log.push(['providers', tables.features, options]);
          return { vectorProviders: ['vector'], tileProviders: ['tile'] };
        },
      },
      linearizer: {
        apply: (value, bytes, features, providers) => {
          log.push(['curves', features, providers]);
          return Promise.resolve();
        },
      },
      metadataReader: () => {
        log.push(['metadata']);
        return { featureTables: ['places'] };
      },
    },
  };
};

test('conector: orquesta lectura, apertura, proveedores, curvas y metadatos', async () => {
  const { log, dependencies } = createDoubles();
  const connector = new GeoPackageConnector(
    Uint8Array.from([5]),
    { vector: { places: { a: 1 } } },
    dependencies,
  );

  expect(connector).toBeInstanceOf(PackageReader);
  expect(await connector.getVectorProviders()).toEqual(['vector']);
  expect(await connector.getTileProviders()).toEqual(['tile']);
  expect(await connector.getMetadata()).toEqual({ featureTables: ['places'] });
  expect(log).toEqual([
    ['open', [5]],
    ['providers', ['places'], { vector: { places: { a: 1 } }, tile: {} }],
    ['curves', ['places'], ['vector']],
    ['metadata'],
  ]);
});

test('conector: un fallo tras abrir la base de datos la cierra y rechaza la carga', async () => {
  const { log, dependencies } = createDoubles();
  dependencies.linearizer.apply = () => Promise.reject(new Error('GDAL'));
  const connector = new GeoPackageConnector(Uint8Array.from([5]), {}, dependencies);

  await expect(connector.getVectorProviders()).rejects.toThrow('GDAL');
  expect(log.at(-1)).toEqual(['close', true]);
});
