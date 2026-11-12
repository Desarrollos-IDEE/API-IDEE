import { test, expect } from '@playwright/test';
import initSqlJs from 'sql.js';
import { readFileSync } from 'fs';
import { ByteSource } from '../../../src/facade/js/datasource/contracts';
import SqliteReader, {
  SqliteFormatError, parseCreateTable, readVarint, decodeRecord,
} from '../../../src/facade/js/datasource/sqlite/SqliteReader';
import { createGeoPackage } from './fixtures/geopackage';

class MemoryBytes extends ByteSource {
  constructor(bytes) {
    super();
    this.bytes = bytes;
    this.reads = 0;
  }

  read(offset, length) {
    this.reads += 1;
    return Promise.resolve(this.bytes.subarray(offset, offset + length));
  }
}

let SQL;
test.beforeAll(async () => {
  SQL = await initSqlJs({ wasmBinary: readFileSync(require.resolve('sql.js/dist/sql-wasm.wasm')) });
});

const query = (bytes, sql) => {
  const db = new SQL.Database(bytes);
  try {
    const [result] = db.exec(sql);
    return result ? result.values : [];
  } finally {
    db.close();
  }
};

const createLargeDatabase = () => {
  const db = new SQL.Database();
  db.run('PRAGMA page_size = 1024; VACUUM;');
  db.run(`CREATE TABLE items (
    id INTEGER PRIMARY KEY, name TEXT NOT NULL DEFAULT 'x', value REAL, data BLOB, big INTEGER
  )`);
  db.run('CREATE INDEX items_name_value ON items (name, value)');
  db.run('BEGIN');
  const insert = db.prepare('INSERT INTO items VALUES (?, ?, ?, ?, ?)');
  for (let id = 1; id <= 3000; id += 1) {
    const blob = id % 500 === 0
      ? Uint8Array.from({ length: 5000 + id }, (_, index) => (index * id) % 256)
      : Uint8Array.from([id % 256, (id >> 8) % 256]);
    insert.run([id * 2, `nombre ${id} ñ`, id / 3, blob, id % 7 === 0 ? -(2 ** 40) * id : id]);
  }
  insert.free();
  db.run('COMMIT');
  const bytes = db.export();
  db.close();
  return bytes;
};

test('sqlite: varints y registros', () => {
  expect(readVarint(Uint8Array.from([0x7f]), 0)).toEqual([127, 1]);
  expect(readVarint(Uint8Array.from([0x81, 0x00]), 0)).toEqual([128, 2]);
  expect(readVarint(Uint8Array.from([0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff]), 0))
    .toEqual([-1, 9]);
  expect(readVarint(Uint8Array.from([0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x01]), 0))
    .toEqual([1, 9]);
  expect(readVarint(Uint8Array.from([0x87, 0xff, 0xff, 0xff, 0x7f]), 0)).toEqual([2 ** 31 - 1, 5]);
  const record = Uint8Array.from([6, 0, 1, 8, 9, 17, 7, 0x41, 0x42]);
  expect(decodeRecord(record)).toEqual([null, 7, 0, 1, 'AB']);
});

test('sqlite: CREATE TABLE de GeoPackage y alias de rowid', () => {
  expect(parseCreateTable('CREATE TABLE "a b" ("fid" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, "geom" POINT, [name] TEXT(50) DEFAULT \'x,y\', `n` DOUBLE, UNIQUE (name))'))
    .toEqual([
      {
        name: 'fid', type: 'INTEGER', notNull: true, primaryKey: true, defaultValue: undefined, rowidAlias: true,
      },
      {
        name: 'geom', type: 'POINT', notNull: false, primaryKey: false, defaultValue: undefined, rowidAlias: false,
      },
      {
        name: 'name', type: 'TEXT(50)', notNull: false, primaryKey: false, defaultValue: '\'x,y\'', rowidAlias: false,
      },
      {
        name: 'n', type: 'DOUBLE', notNull: false, primaryKey: false, defaultValue: undefined, rowidAlias: false,
      },
    ]);
  const composite = parseCreateTable('CREATE TABLE t (a INTEGER, b INTEGER, PRIMARY KEY (a, b))');
  expect(composite.map(({ primaryKey, rowidAlias }) => [primaryKey, rowidAlias]))
    .toEqual([[true, false], [true, false]]);
  expect(parseCreateTable('CREATE TABLE t (id integer, PRIMARY KEY ("id"))')[0].rowidAlias).toBe(true);
  expect(parseCreateTable('CREATE TABLE t (id INT PRIMARY KEY)')[0].rowidAlias).toBe(false);
});

test('sqlite: lee las tablas del sistema GeoPackage igual que sql.js', async () => {
  const bytes = new Uint8Array(await createGeoPackage('metadata'));
  const reader = new SqliteReader(new MemoryBytes(bytes));

  const header = await reader.open();
  const contents = await reader.readAll('gpkg_contents');
  const tables = (await reader.getSchema()).filter(({ type }) => type === 'table').map(({ name }) => name);

  expect(header.pageSize).toBeGreaterThanOrEqual(512);
  expect(contents.map(Object.values))
    .toEqual(query(bytes, 'SELECT * FROM gpkg_contents ORDER BY rowid'));
  expect(tables).toEqual(expect.arrayContaining(['gpkg_contents', 'places', 'imagery', 'details']));
  expect(await reader.readAll('missing')).toEqual([]);
  const places = await reader.getTable('PLACES');
  expect(places).toMatchObject({ name: 'places', rowidColumn: 0 });
});

test('sqlite: B-trees de varios niveles, desbordamiento y búsquedas por rowid', async () => {
  const bytes = createLargeDatabase();
  const source = new MemoryBytes(bytes);
  const reader = new SqliteReader(source);
  const table = await reader.getTable('items');
  const expected = query(bytes, 'SELECT id, name, value, data, big FROM items ORDER BY id');

  const rows = await reader.scanTable(table.rootPage);
  const objects = rows.map(({ rowid, values }) => Object.values(SqliteReader.toObject(table, rowid, values)));
  expect(objects).toHaveLength(3000);
  expect(objects.map((row) => row.map((value) => (value instanceof Uint8Array ? Array.from(value) : value))))
    .toEqual(expected.map((row) => row.map((value) => (value instanceof Uint8Array ? Array.from(value) : value))));
  const scanReads = source.reads;

  source.reads = 0;
  const found = await reader.getRows(table.rootPage, [4000, 2, 6000, 3, 999999, 1000]);
  expect([...found.keys()].sort((a, b) => a - b)).toEqual([2, 1000, 4000, 6000]);
  expect(Array.from(found.get(1000)[3])).toEqual(Array.from(expected[499][3]));
  expect(source.reads).toBeLessThan(scanReads / 4);
});

test('sqlite: búsqueda por prefijo en un índice', async () => {
  const bytes = createLargeDatabase();
  const reader = new SqliteReader(new MemoryBytes(bytes));
  const index = (await reader.getSchema()).find(({ name }) => name === 'items_name_value');

  const entry = await reader.seekIndex(index.rootPage, ['nombre 1234 ñ']);
  expect(entry).toEqual(['nombre 1234 ñ', 1234 / 3, 2468]);
  expect(await reader.seekIndex(index.rootPage, ['nombre 1234 ñ', 1234 / 3])).toEqual(entry);
  expect(await reader.seekIndex(index.rootPage, ['no existe'])).toBeNull();
  expect(await reader.seekIndex(index.rootPage, ['zzz'])).toBeNull();
});

test('sqlite: ficheros no válidos o no admitidos se rechazan', async () => {
  const notSqlite = new SqliteReader(new MemoryBytes(new Uint8Array(200)));
  await expect(notSqlite.open()).rejects.toBeInstanceOf(SqliteFormatError);

  const db = new SQL.Database();
  db.run('CREATE TABLE w (a INTEGER, b TEXT, PRIMARY KEY (a)) WITHOUT ROWID');
  const withoutRowid = new SqliteReader(new MemoryBytes(db.export()));
  db.close();
  await expect(withoutRowid.getTable('w')).rejects.toThrow('tabla sin rowid');

  const bytes = createLargeDatabase();
  const reader = new SqliteReader(new MemoryBytes(bytes));
  const { rootPage } = await reader.getTable('items');
  const { pageSize } = await reader.open();
  const corrupted = bytes.slice();
  const header = (rootPage - 1) * pageSize;
  expect(corrupted[header]).toBe(5);
  new DataView(corrupted.buffer).setUint32(header + 8, rootPage);
  await expect(new SqliteReader(new MemoryBytes(corrupted)).scanTable(rootPage))
    .rejects.toThrow('ciclo');
});
