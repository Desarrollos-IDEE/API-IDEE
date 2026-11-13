import { test, expect } from '@playwright/test';
import { LayerSerializer } from '../../../src/facade/js/datasource/contracts';
import GeoPackageSerializer from '../../../src/facade/js/datasource/geopackage/Serializer';

class FakeStyle {
  constructor(id) {
    this.id = id;
  }

  serialize() {
    return `style:${this.id}`;
  }
}

const createSerializer = () => new GeoPackageSerializer({
  type: 'GeoPackage',
  isStyle: (value) => value instanceof FakeStyle,
  isRemoteURL: (url) => typeof url === 'string' && url.startsWith('http'),
  toRestURL: (url) => `${url}#rest`,
  serializeUrlParams: (params) => JSON.stringify(params),
});

const createChild = (state) => ({
  name: state.name,
  legend: state.legend,
  displayInLayerSwitcher: true,
  getRestParameters_: () => ({ name: state.name, url: 'ignored', minZoom: undefined }),
  getRestVectorParameters_: state.style ? () => ({ style: state.style }) : undefined,
  isVisible: () => state.visible,
  getOpacity: () => {
    if (state.opacity === undefined) throw new Error('sin implementación');
    return state.opacity;
  },
});

const parse = (rest) => JSON.parse(rest.substring('GeoPackage*'.length));

test('serializador: implementa LayerSerializer', () => {
  expect(createSerializer()).toBeInstanceOf(LayerSerializer);
});

test('serializador: las instancias de estilo se serializan a cualquier profundidad', () => {
  const style = new FakeStyle('a');
  expect(createSerializer().getSerializableOptions({
    style, tables: { places: { style: new FakeStyle('b') } }, list: [style], value: 1,
  })).toEqual({
    style: 'style:a', tables: { places: { style: 'style:b' } }, list: ['style:a'], value: 1,
  });
});

test('serializador: toJSON conserva url o fuente y copia propiedades', () => {
  const serializer = createSerializer();
  const properties = { tables: { places: { type: 'features' } } };
  const remote = serializer.toJSON({
    url: 'http://a/b.gpkg',
    source: 'unused',
    name: 'n',
    legend: 'l',
    options: { style: new FakeStyle('a') },
    metadata: { m: 1 },
    properties,
  });
  const source = new Uint8Array([1]);
  const local = serializer.toJSON({
    source, name: 'n', legend: 'n', options: {}, metadata: {}, properties: null,
  });

  expect(remote).toEqual({
    type: 'GeoPackage',
    url: 'http://a/b.gpkg',
    name: 'n',
    legend: 'l',
    options: { style: 'style:a' },
    metadata: { m: 1 },
    properties,
  });
  expect(remote.properties).not.toBe(properties);
  expect(local.source).toBe(source);
  expect('url' in local).toBe(false);
});

test('serializador: getRestLayer combina opciones del paquete y estado de cada tabla', () => {
  const pack = {
    legacy: false,
    url: 'http://a/b.gpkg',
    name: 'pkg',
    legend: 'pkg',
    options: { style: new FakeStyle('a'), tables: { places: { opacity: 0.9, extra: true } } },
    layers: {
      places: createChild({
        name: 'pkg:places', legend: 'places', visible: false, opacity: 0.5, style: 'style:c',
      }),
      imagery: createChild({ name: 'pkg:imagery', legend: 'imagery', visible: true }),
    },
    tableNames: null,
  };

  const rest = createSerializer().getRestLayer(pack);

  expect(rest.startsWith('GeoPackage*')).toBe(true);
  expect(parse(rest)).toEqual({
    url: 'http://a/b.gpkg#rest',
    name: 'pkg',
    options: {
      style: 'style:a',
      tables: {
        places: {
          opacity: 0.5,
          extra: true,
          name: 'pkg:places',
          legend: 'places',
          visibility: false,
          style: 'style:c',
          displayInLayerSwitcher: true,
        },
        imagery: {
          name: 'pkg:imagery', legend: 'imagery', visibility: true, displayInLayerSwitcher: true,
        },
      },
    },
  });
  expect(pack.options.tables.places).toEqual({ opacity: 0.9, extra: true });
});

test('serializador: getRestLayer restringe tablas y devuelve null si no es representable', () => {
  const serializer = createSerializer();
  const pack = {
    legacy: false,
    url: 'http://a/b.gpkg',
    name: 'pkg',
    legend: 'Paquete',
    options: {},
    layers: { places: createChild({ name: 'pkg:places', legend: 'places', visible: true }) },
    tableNames: null,
  };

  expect(parse(serializer.getRestLayer(pack, ['places', 'missing'])).options.tableNames).toEqual(['places']);
  expect(parse(serializer.getRestLayer(pack)).legend).toBe('Paquete');
  expect(parse(serializer.getRestLayer({ ...pack, tableNames: ['places'] })).options.tableNames)
    .toEqual(['places']);
  expect(serializer.getRestLayer(pack, ['missing'])).toBeNull();
  expect(serializer.getRestLayer({ ...pack, legacy: true })).toBeNull();
  expect(serializer.getRestLayer({ ...pack, url: undefined })).toBeNull();
  expect(serializer.getRestLayer({ ...pack, url: 'blob:local' })).toBeNull();
});
