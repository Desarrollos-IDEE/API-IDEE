import { test, expect } from '@playwright/test';
import { ByteSource } from '../../../src/facade/js/datasource/contracts';
import SqliteReader, { SqliteFormatError } from '../../../src/facade/js/datasource/sqlite/SqliteReader';
import RTreeIndex, { decodeNode } from '../../../src/facade/js/datasource/sqlite/RTreeIndex';
import { createGdalGeoPackage } from './fixtures/geopackage';

class MemoryBytes extends ByteSource {
  constructor(bytes) {
    super();
    this.bytes = bytes;
  }

  read(offset, length) {
    return Promise.resolve(this.bytes.subarray(offset, offset + length));
  }
}

const POINTS = Array.from({ length: 3000 }, (_, index) => ({
  id: index + 1,
  x: (index % 100) * 1.2 - 60,
  y: Math.floor(index / 100) * 2 - 30,
}));

test('R*Tree: decodifica un nodo de GDAL', () => {
  const blob = Uint8Array.from(Buffer.from(
    '000000010000000000000001'
    + '3F8000003F8000004000000040000000',
    'hex',
  ));
  expect(decodeNode(blob)).toEqual({
    depth: 0,
    entries: [{
      id: 1, minX: 1, maxX: 1, minY: 2, maxY: 2,
    }],
  });
  expect(() => decodeNode(Uint8Array.from([0, 0, 0, 2, 0]))).toThrow(SqliteFormatError);
  expect(() => decodeNode(null)).toThrow(SqliteFormatError);
});

test('R*Tree: las búsquedas coinciden con la fuerza bruta y leen pocos nodos', async () => {
  const bytes = new Uint8Array(await createGdalGeoPackage(POINTS.map(({ id, x, y }) => ({
    type: 'Feature', properties: { n: id }, geometry: { type: 'Point', coordinates: [x, y] },
  }))));
  const reader = new SqliteReader(new MemoryBytes(bytes));
  const nodeTable = await reader.getTable('rtree_places_geom_node');
  const requested = [];
  const index = new RTreeIndex(async (numbers) => {
    requested.push(numbers.length);
    const rows = await reader.getRows(nodeTable.rootPage, numbers);
    return new Map([...rows].map(([number, values]) => [number, values[1]]));
  });

  const root = decodeNode((await reader.getRows(nodeTable.rootPage, [1])).get(1)[1]);
  expect(root.depth).toBeGreaterThan(0);
  const totalNodes = (await reader.scanTable(nodeTable.rootPage)).length;

  const extents = [[-10, -5, 10, 5], [-60, -30, 60, 30], [100, 50, 120, 60], [0.1, 0.1, 0.2, 0.2]];
  // eslint-disable-next-line no-restricted-syntax
  for (const [minX, minY, maxX, maxY] of extents) {
    requested.length = 0;
    // eslint-disable-next-line no-await-in-loop
    const ids = await index.search([minX, minY, maxX, maxY]);
    const expected = POINTS.filter(({ x, y }) => x >= minX - 1e-4 && x <= maxX + 1e-4
      && y >= minY - 1e-4 && y <= maxY + 1e-4).map(({ id }) => id);
    expect(ids).toEqual(expected);
    if (maxX - minX <= 20) {
      expect(requested.reduce((sum, count) => sum + count, 0)).toBeLessThan(totalNodes / 3);
      expect(requested.length).toBeLessThanOrEqual(root.depth + 1);
    }
  }
});

test('R*Tree: la búsqueda síncrona devuelve lo mismo que la asíncrona', async () => {
  const bytes = new Uint8Array(await createGdalGeoPackage(POINTS.map(({ id, x, y }) => ({
    type: 'Feature', properties: { n: id }, geometry: { type: 'Point', coordinates: [x, y] },
  }))));
  const reader = new SqliteReader(new MemoryBytes(bytes));
  const nodeTable = await reader.getTable('rtree_places_geom_node');
  const nodes = new Map((await reader.scanTable(nodeTable.rootPage))
    .map(({ rowid, values }) => [rowid, values[1]]));
  const pick = (numbers) => new Map(numbers.map((number) => [number, nodes.get(number)]));
  const extent = [-20, -10, 5, 8];

  const synchronous = new RTreeIndex(pick, { sync: true }).search(extent);
  const asynchronous = await new RTreeIndex((numbers) => Promise.resolve(pick(numbers))).search(extent);

  expect(Array.isArray(synchronous)).toBe(true);
  expect(synchronous).toEqual(asynchronous);
  expect(synchronous.length).toBeGreaterThan(0);
});
