import { test, expect } from '@playwright/test';
import { SourceReader } from '../../../src/facade/js/datasource/contracts';
import {
  readSource, UrlSourceReader, ResponseSourceReader, FileSourceReader, DEFAULT_SOURCE_READERS,
} from '../../../src/facade/js/datasource/geopackage/sourceReaders';
import { getValue } from '../../../src/facade/js/i18n/language';

const SOURCE_ERROR = getValue('exception').geopackage_source;
const RESPONSE_ERROR = getValue('exception').geopackage_response;

test('orígenes: los lectores predeterminados implementan SourceReader', () => {
  DEFAULT_SOURCE_READERS.forEach((reader) => expect(reader).toBeInstanceOf(SourceReader));
});

test('orígenes: los bytes se copian, incluidas las vistas parciales', async () => {
  const buffer = Uint8Array.from([9, 1, 2, 3, 9]).buffer;
  const view = new Uint8Array(buffer, 1, 3);

  const fromBuffer = await readSource(buffer);
  const fromView = await readSource({ source: view });

  expect(Array.from(fromBuffer)).toEqual([9, 1, 2, 3, 9]);
  expect(Array.from(fromView)).toEqual([1, 2, 3]);
  expect(fromView.buffer).not.toBe(buffer);
});

test('orígenes: lee respuestas correctas y rechaza las erróneas con su estado', async () => {
  expect(Array.from(await readSource(new Response(Uint8Array.from([4, 5]))))).toEqual([4, 5]);
  await expect(readSource(new Response('x', { status: 404 })))
    .rejects.toBe(`${RESPONSE_ERROR} (404)`);
});

test('orígenes: lee ficheros locales', async () => {
  const file = new File([Uint8Array.from([7, 8])], 'data.gpkg');
  expect(Array.from(await readSource({ source: file }))).toEqual([7, 8]);
});

test('orígenes: una URL se descarga con la función inyectada y se lee la respuesta', async () => {
  const requested = [];
  const readers = [
    new UrlSourceReader({
      fetch: (url) => {
        requested.push(url);
        return Promise.resolve(new Response(Uint8Array.from([6])));
      },
    }),
    new ResponseSourceReader(),
    new FileSourceReader(),
  ];

  expect(Array.from(await readSource({ url: '/data.gpkg' }, readers))).toEqual([6]);
  expect(requested).toEqual(['/data.gpkg']);
});

test('orígenes: una URL bloqueada por CORS o por la red da un mensaje i18n', async () => {
  const failing = (error) => [
    new UrlSourceReader({ fetch: () => Promise.reject(error) }),
    new ResponseSourceReader(),
    new FileSourceReader(),
  ];
  const other = new Error('otro');

  await expect(readSource({ url: 'https://a/b.gpkg' }, failing(new TypeError('Failed to fetch'))))
    .rejects.toBe(getValue('exception').geopackage_network);
  await expect(readSource({ url: 'https://a/b.gpkg' }, failing(other))).rejects.toBe(other);
});

test('orígenes: parámetros y valores no válidos se rechazan', async () => {
  const invalid = [
    {}, { url: '/a.gpkg', source: new ArrayBuffer(1) }, { url: '' }, { url: '  ' }, { url: 5 },
    new ArrayBuffer(0), new Uint8Array(0), 'data.gpkg', null, undefined, { source: 'texto' },
    { source: { url: '/a.gpkg' } }, Object.assign(Object.create(null), { url: '/a.gpkg' }),
  ];
  await Promise.all(invalid.map((value) => expect(readSource(value)).rejects.toBe(SOURCE_ERROR)));
});

test('orígenes: un lector nuevo se añade sin modificar los existentes', async () => {
  class TextSourceReader extends SourceReader {
    canRead(input) {
      return typeof input === 'string' && input.startsWith('bytes:');
    }

    read(input) {
      return Uint8Array.from(input.substring(6).split(','), Number);
    }
  }

  const readers = [...DEFAULT_SOURCE_READERS, new TextSourceReader()];
  expect(Array.from(await readSource('bytes:1,2', readers))).toEqual([1, 2]);
});
