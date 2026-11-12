import { test, expect } from '@playwright/test';
import {
  normalizeParameters, copyOptions, isPlainRecord,
} from '../../../src/facade/js/datasource/geopackage/parameters';
import resolveTableOptions from '../../../src/facade/js/datasource/geopackage/tableOptions';

class FakeStyle {}

test('parámetros: la firma nueva mezcla opciones planas, anidadas y del segundo argumento', () => {
  const style = new FakeStyle();
  const data = {
    type: 'GeoPackage',
    url: '/data.gpkg',
    name: 'pkg',
    legend: 'Paquete',
    opacity: 0.5,
    options: { visibility: false, tables: { places: { opacity: 0.2 } } },
  };
  const options = { style, tile: { places: { tileSize: 512 } }, tableNames: ['places'] };
  const snapshot = JSON.stringify({ data, options });

  const result = normalizeParameters(data, options);

  expect(result).toMatchObject({
    legacy: false,
    url: '/data.gpkg',
    name: 'pkg',
    legend: 'Paquete',
    metadata: null,
    properties: null,
    common: { opacity: 0.5, visibility: false, style },
    tables: { places: { opacity: 0.2 } },
    providerOptions: { tile: { places: { tileSize: 512 } }, vector: undefined },
    tableNames: ['places'],
  });
  expect(result.options).toEqual({
    opacity: 0.5,
    visibility: false,
    tables: { places: { opacity: 0.2 } },
    style,
    tile: { places: { tileSize: 512 } },
    tableNames: ['places'],
  });
  expect(result.common.style).toBe(style);
  expect(result.options.tables).not.toBe(data.options.tables);
  expect(JSON.stringify({ data, options })).toBe(snapshot);
});

test('parámetros: la firma histórica usa el segundo argumento como opciones por tabla', () => {
  const bytes = new Uint8Array([1, 2, 3]);
  const tables = { places: { name: 'Lugares' } };

  const result = normalizeParameters(bytes, tables);

  expect(result.legacy).toBe(true);
  expect(result.source).toBe(bytes);
  expect(result.common).toEqual({});
  expect(result.tables).toEqual(tables);
  expect(result.tables).not.toBe(tables);
  expect(result.tableNames).toBeNull();
  expect(normalizeParameters(undefined).legacy).toBe(true);
});

test('parámetros: tableNames solo se admite como array en la firma nueva', () => {
  expect(normalizeParameters({ url: '/a.gpkg', tableNames: 'places' }).tableNames).toBeNull();
  expect(normalizeParameters(new ArrayBuffer(1), { tableNames: ['places'] }).tableNames).toBeNull();
});

test('parámetros: metadatos y propiedades se copian', () => {
  const metadata = { tables: { places: { count: 1 } } };
  const result = normalizeParameters({ url: '/a.gpkg', metadata, properties: { tables: {} } });

  expect(result.metadata).toEqual(metadata);
  expect(result.metadata.tables).not.toBe(metadata.tables);
  expect(result.properties).toEqual({ tables: {} });
});

test('parámetros: copyOptions copia registros y arrays y conserva instancias', () => {
  const style = new FakeStyle();
  const record = Object.create(null);
  record.value = [{ style }];
  const copy = copyOptions(record);

  expect(copy).not.toBe(record);
  expect(copy.value).not.toBe(record.value);
  expect(copy.value[0]).not.toBe(record.value[0]);
  expect(copy.value[0].style).toBe(style);
  expect(isPlainRecord(record)).toBe(true);
  expect(isPlainRecord(style)).toBe(false);
  expect(isPlainRecord(null)).toBe(false);
});

test('opciones por tabla: las de tabla sobrescriben a las comunes y se resuelven nombre y leyenda', () => {
  const context = {
    common: { opacity: 0.5, visibility: false },
    tables: { places: { opacity: 0.2, legend: 'Lugares' } },
    legacy: false,
    packageName: 'pkg',
  };

  expect(resolveTableOptions('places', context)).toEqual({
    opacity: 0.2, visibility: false, legend: 'Lugares', name: 'pkg:places',
  });
  expect(resolveTableOptions('imagery', context, true)).toEqual({
    opacity: 0.5, visibility: false, name: 'pkg:imagery', legend: 'imagery',
  });
  expect(context.tables.places).toEqual({ opacity: 0.2, legend: 'Lugares' });
});

test('opciones por tabla: la firma histórica usa el nombre de tabla y solo da leyenda al ráster', () => {
  const context = {
    common: {}, tables: { toString: { name: 'heredada' } }, legacy: true, packageName: 'pkg',
  };

  expect(resolveTableOptions('places', context)).toEqual({ name: 'places' });
  expect(resolveTableOptions('imagery', context, true)).toEqual({ name: 'imagery', legend: 'imagery' });
  expect(resolveTableOptions('hasOwnProperty', { ...context, tables: {} })).toEqual({ name: 'hasOwnProperty' });
});
