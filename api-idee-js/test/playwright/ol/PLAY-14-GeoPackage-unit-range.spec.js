import { test, expect } from '@playwright/test';
import { ByteSource } from '../../../src/facade/js/datasource/contracts';
import HttpRangeSource from '../../../src/facade/js/datasource/range/HttpRangeSource';
import { getValue } from '../../../src/facade/js/i18n/language';

const BLOCK = 4096;
const FILE = Uint8Array.from({ length: (5 * BLOCK) + 100 }, (_, index) => index % 251);
const slice = (offset, length) => Array.from(FILE.subarray(offset, offset + length));

const createServer = (bytes = FILE, { ranges = true, status, fail } = {}) => {
  const log = [];
  const fetch = async (url, init = {}) => {
    const header = init.headers?.Range;
    log.push(header);
    if (fail) {
      fail -= 1;
      throw new TypeError('Failed to fetch');
    }
    if (status) return new Response('error', { status });
    if (!ranges || !header) {
      return new Response(bytes, { status: 200, headers: { 'Content-Length': String(bytes.length) } });
    }
    const [, first, last] = /bytes=(\d+)-(\d+)/.exec(header);
    const start = Number(first);
    if (start >= bytes.length) return new Response(null, { status: 416 });
    const end = Math.min(Number(last), bytes.length - 1);
    return new Response(bytes.slice(start, end + 1), {
      status: 206,
      headers: { 'Content-Range': `bytes ${start}-${end}/${bytes.length}` },
    });
  };
  return { fetch, log };
};

test('rangos: implementa ByteSource y empieza pidiendo el primer bloque', async () => {
  const server = createServer();
  const source = new HttpRangeSource('/a.gpkg', { blockSize: BLOCK, fetch: server.fetch });

  expect(source).toBeInstanceOf(ByteSource);
  expect(Array.from(await source.read(10, 20))).toEqual(slice(10, 20));
  expect(server.log).toEqual([`bytes=0-${BLOCK - 1}`]);
  expect(source.isRangeSupported()).toBe(true);
  expect(source.getStats()).toEqual({ requests: 1, bytes: BLOCK });
});

test('rangos: los bloques contiguos que faltan se piden juntos y se reutilizan', async () => {
  const server = createServer();
  const source = new HttpRangeSource('/a.gpkg', { blockSize: BLOCK, fetch: server.fetch });

  expect(Array.from(await source.read((2 * BLOCK) + 5, (3 * BLOCK) + 10)))
    .toEqual(slice((2 * BLOCK) + 5, (3 * BLOCK) + 10));
  expect(server.log).toEqual([`bytes=0-${BLOCK - 1}`, `bytes=${2 * BLOCK}-${(5 * BLOCK) + BLOCK - 1}`]);

  await Promise.all([source.read(BLOCK, 10), source.read(BLOCK + 20, 10)]);
  expect(Array.from(await source.read(BLOCK + 3, 4))).toEqual(slice(BLOCK + 3, 4));
  expect(Array.from(await source.read(3 * BLOCK, 10))).toEqual(slice(3 * BLOCK, 10));
  expect(server.log).toHaveLength(3);
});

test('rangos: las lecturas simultáneas se agrupan en pocas peticiones', async () => {
  const server = createServer(Uint8Array.from({ length: 20 * BLOCK }, (_, index) => index % 7));
  const source = new HttpRangeSource('/a.gpkg', { blockSize: BLOCK, mergeGap: 2, fetch: server.fetch });
  await source.read(0, 1);

  await Promise.all([1, 3, 4, 10, 11, 15].map((block) => source.read(block * BLOCK, 10)));

  expect(server.log).toEqual([
    `bytes=0-${BLOCK - 1}`,
    `bytes=${BLOCK}-${(5 * BLOCK) - 1}`,
    `bytes=${10 * BLOCK}-${(12 * BLOCK) - 1}`,
    `bytes=${15 * BLOCK}-${(16 * BLOCK) - 1}`,
  ]);
  expect(Array.from(await source.read(2 * BLOCK, 3))).toEqual([2 * BLOCK % 7, (2 * BLOCK + 1) % 7, (2 * BLOCK + 2) % 7]);
  expect(server.log).toHaveLength(4);
});

test('rangos: si el servidor envía el fichero completo no se vuelve a pedir', async () => {
  const server = createServer(FILE, { ranges: false });
  const source = new HttpRangeSource('/a.gpkg', { blockSize: BLOCK, fetch: server.fetch });

  const [first, second] = await Promise.all([source.read(0, 16), source.read(4 * BLOCK, 16)]);

  expect(Array.from(first)).toEqual(slice(0, 16));
  expect(Array.from(second)).toEqual(slice(4 * BLOCK, 16));
  expect(source.isRangeSupported()).toBe(false);
  expect(Array.from(source.getFullBody())).toEqual(Array.from(FILE));
  expect(server.log).toHaveLength(1);
  expect(source.getStats().bytes).toBe(FILE.length);
});

test('rangos: al final del fichero devuelve los bytes disponibles', async () => {
  const server = createServer();
  const source = new HttpRangeSource('/a.gpkg', { blockSize: BLOCK, fetch: server.fetch });

  expect(Array.from(await source.read(FILE.length - 10, 50))).toEqual(slice(FILE.length - 10, 10));
  expect((await source.read(FILE.length + BLOCK, 10)).length).toBe(0);
  expect((await source.read(0, 0)).length).toBe(0);
});

test('rangos: errores de red, de estado y de tamaño con mensajes i18n', async () => {
  const messages = getValue('exception');
  const network = new HttpRangeSource('/a.gpkg', { fetch: createServer(FILE, { fail: 1 }).fetch });
  await expect(network.read(0, 1)).rejects.toBe(messages.geopackage_range_network);
  expect(Array.from(await network.read(0, 3))).toEqual(slice(0, 3));

  const failing = new HttpRangeSource('/a.gpkg', { fetch: createServer(FILE, { status: 500 }).fetch });
  await expect(failing.read(0, 1)).rejects.toBe(`${messages.geopackage_response} (500)`);

  const limited = new HttpRangeSource('/a.gpkg', {
    blockSize: BLOCK, maxBytes: 2 * BLOCK, fetch: createServer().fetch,
  });
  await limited.read(0, 1);
  await expect(limited.read(2 * BLOCK, 3 * BLOCK)).rejects.toBe(messages.geopackage_size);

  const complete = new HttpRangeSource('/a.gpkg', {
    maxBytes: 100, fetch: createServer(FILE, { ranges: false }).fetch,
  });
  await expect(complete.read(0, 1)).rejects.toBe(messages.geopackage_size);
});

test('rangos: se descartan los bloques menos usados y se pueden invalidar', async () => {
  const server = createServer();
  const source = new HttpRangeSource('/a.gpkg', {
    blockSize: BLOCK, maxCachedBlocks: 2, fetch: server.fetch,
  });

  await source.read(0, 1);
  await source.read(BLOCK, 1);
  await source.read(2 * BLOCK, 1);
  expect(server.log).toHaveLength(3);
  await source.read(0, 1);
  expect(server.log).toHaveLength(4);
  await source.read(2 * BLOCK, 1);
  expect(server.log).toHaveLength(4);

  source.invalidate();
  await source.read(2 * BLOCK, 1);
  expect(server.log).toHaveLength(5);
});

test('rangos: el tamaño de bloque se limita a valores razonables', async () => {
  const server = createServer();
  await new HttpRangeSource('/a.gpkg', { blockSize: 10, fetch: server.fetch }).read(0, 1);
  await new HttpRangeSource('/a.gpkg', { blockSize: 'x', fetch: server.fetch }).read(0, 1);
  expect(server.log).toEqual([`bytes=0-${BLOCK - 1}`, `bytes=0-${BLOCK - 1}`]);
});
