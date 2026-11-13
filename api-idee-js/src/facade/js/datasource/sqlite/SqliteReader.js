/**
 * Lector de solo lectura del formato de fichero SQLite 3 sobre un origen de bytes
 * con acceso aleatorio. Lee únicamente las páginas necesarias.
 *
 * @module IDEE/datasource/sqlite/SqliteReader
 * @see https://www.sqlite.org/fileformat2.html
 */

/**
 * Cabecera de un fichero SQLite 3.
 * @const
 * @type {String}
 */
const MAGIC = 'SQLite format 3\u0000';

/**
 * Tipos de página B-tree.
 * @const
 * @type {Object<String, Number>}
 */
const PAGE = {
  INDEX_INTERIOR: 2, TABLE_INTERIOR: 5, INDEX_LEAF: 10, TABLE_LEAF: 13,
};

/**
 * Profundidad máxima admitida de un B-tree.
 * @const
 * @type {Number}
 */
const MAX_DEPTH = 32;

/**
 * Palabras que terminan el tipo declarado de una columna.
 * @const
 * @type {Array<String>}
 */
const CONSTRAINT_WORDS = [
  'CONSTRAINT', 'PRIMARY', 'NOT', 'NULL', 'UNIQUE', 'CHECK', 'DEFAULT', 'COLLATE',
  'REFERENCES', 'GENERATED', 'AS',
];

/**
 * Error de formato del fichero.
 */
export class SqliteFormatError extends Error {
  constructor(message) {
    super(`SQLite: ${message}`);
    this.name = 'SqliteFormatError';
  }
}

const fail = (message) => {
  throw new SqliteFormatError(message);
};

const decoder = new TextDecoder('utf-8');

/**
 * Lee un entero sin signo de varios bytes en orden big-endian.
 * @param {Uint8Array} bytes Bytes.
 * @param {Number} offset Posición.
 * @param {Number} length Número de bytes (máximo 6).
 * @returns {Number} Valor.
 */
const readUnsigned = (bytes, offset, length) => {
  let value = 0;
  for (let index = 0; index < length; index += 1) {
    value = (value * 256) + bytes[offset + index];
  }
  return value;
};

/**
 * Lee un entero con signo en complemento a dos (1 a 8 bytes). Los valores de 8 bytes
 * mayores que 2^53 pierden precisión.
 * @param {Uint8Array} bytes Bytes.
 * @param {Number} offset Posición.
 * @param {Number} length Número de bytes.
 * @returns {Number} Valor.
 */
const readSigned = (bytes, offset, length) => {
  if (length === 8) {
    const high = readUnsigned(bytes, offset, 4);
    const low = readUnsigned(bytes, offset + 4, 4);
    return ((high >= 2 ** 31 ? high - (2 ** 32) : high) * (2 ** 32)) + low;
  }
  const value = readUnsigned(bytes, offset, length);
  const limit = 2 ** ((length * 8) - 1);
  return value >= limit ? value - (limit * 2) : value;
};

/**
 * Lee un varint de SQLite (entero de 64 bits con signo en 1 a 9 bytes). Los valores
 * mayores que 2^53 pierden precisión.
 * @param {Uint8Array} bytes Bytes.
 * @param {Number} offset Posición.
 * @returns {Array<Number>} [valor, bytes leídos].
 */
export const readVarint = (bytes, offset) => {
  let high = 0;
  let low = 0;
  const push = (bits, chunk) => {
    const factor = 2 ** bits;
    high = ((high * factor) + Math.floor(low / (2 ** (32 - bits)))) % (2 ** 32);
    low = ((low * factor) % (2 ** 32)) + chunk;
  };
  for (let index = 0; index < 8; index += 1) {
    const byte = bytes[offset + index];
    if (byte === undefined) fail('varint truncado');
    push(7, byte & 0x7f);
    if ((byte & 0x80) === 0) {
      return [(high * (2 ** 32)) + low, index + 1];
    }
  }
  const last = bytes[offset + 8];
  if (last === undefined) fail('varint truncado');
  push(8, last);
  return [((high >= 2 ** 31 ? high - (2 ** 32) : high) * (2 ** 32)) + low, 9];
};

/**
 * Decodifica un registro de SQLite.
 * @param {Uint8Array} payload Contenido completo del registro.
 * @returns {Array<*>} Valores de las columnas.
 */
export const decodeRecord = (payload) => {
  const [headerSize, headerBytes] = readVarint(payload, 0);
  if (headerSize < headerBytes || headerSize > payload.length) fail('cabecera de registro no válida');
  const types = [];
  let position = headerBytes;
  while (position < headerSize) {
    const [type, read] = readVarint(payload, position);
    types.push(type);
    position += read;
  }
  let offset = headerSize;
  const SIZES = [0, 1, 2, 3, 4, 6, 8, 8, 0, 0];
  return types.map((type) => {
    let value;
    let size;
    if (type < 10) {
      size = SIZES[type];
      if (offset + size > payload.length) fail('registro truncado');
      if (type === 0) {
        value = null;
      } else if (type <= 6) {
        value = readSigned(payload, offset, size);
      } else if (type === 7) {
        value = new DataView(payload.buffer, payload.byteOffset + offset, 8).getFloat64(0);
      } else {
        value = type - 8;
      }
    } else if (type < 12) {
      fail('tipo de valor reservado');
    } else {
      size = Math.floor((type - (type % 2 === 0 ? 12 : 13)) / 2);
      if (offset + size > payload.length) fail('registro truncado');
      const content = payload.subarray(offset, offset + size);
      value = type % 2 === 0 ? content.slice() : decoder.decode(content);
    }
    offset += size;
    return value;
  });
};

/**
 * Divide una lista SQL por las comas de primer nivel.
 * @param {String} text Texto.
 * @returns {Array<String>} Partes.
 */
const splitTopLevel = (text) => {
  const parts = [];
  let depth = 0;
  let quote = null;
  let current = '';
  Array.from(text).forEach((char) => {
    if (quote) {
      if (char === quote) quote = null;
    } else if (char === '\'' || char === '"' || char === '`') {
      quote = char;
    } else if (char === '[') {
      quote = ']';
    } else if (char === '(') {
      depth += 1;
    } else if (char === ')') {
      depth -= 1;
    } else if (char === ',' && depth === 0) {
      parts.push(current);
      current = '';
      return;
    }
    current += char;
  });
  if (current.trim()) parts.push(current);
  return parts.map((part) => part.trim());
};

/**
 * Lee un identificador SQL al comienzo del texto.
 * @param {String} text Texto.
 * @returns {Array<String>} [identificador, resto].
 */
const readIdentifier = (text) => {
  const quotes = { '"': '"', '`': '`', '[': ']' };
  const close = quotes[text[0]];
  if (close) {
    let index = 1;
    let name = '';
    while (index < text.length) {
      if (text[index] === close && text[index + 1] === close && close !== ']') {
        name += close;
        index += 2;
      } else if (text[index] === close) {
        return [name, text.substring(index + 1).trim()];
      } else {
        name += text[index];
        index += 1;
      }
    }
    return [name, ''];
  }
  const match = /^([^\s(]+)\s*(.*)$/s.exec(text);
  return match ? [match[1], match[2]] : [text, ''];
};

/**
 * Analiza la sentencia CREATE TABLE de una tabla.
 * @param {String} sql Sentencia.
 * @returns {Array<Object>} Columnas: name, type, notNull, primaryKey, defaultValue,
 * rowidAlias.
 */
export const parseCreateTable = (sql) => {
  const start = sql.indexOf('(');
  const end = sql.lastIndexOf(')');
  if (start < 0 || end < start) fail('sentencia CREATE TABLE no válida');
  const definitions = splitTopLevel(sql.substring(start + 1, end));
  const columns = [];
  let tablePrimaryKey = null;
  definitions.forEach((definition) => {
    const upper = definition.toUpperCase();
    if (/^(CONSTRAINT\s+\S+\s+)?PRIMARY\s+KEY/.test(upper)) {
      const inner = definition.substring(definition.indexOf('(') + 1, definition.lastIndexOf(')'));
      tablePrimaryKey = splitTopLevel(inner).map((part) => readIdentifier(part)[0]);
      return;
    }
    if (/^(CONSTRAINT|UNIQUE|CHECK|FOREIGN)\b/.test(upper)) return;
    const [name, rest] = readIdentifier(definition);
    const words = rest.split(/\s+/).filter(Boolean);
    const typeWords = [];
    while (words.length > 0 && !CONSTRAINT_WORDS.includes(words[0].toUpperCase().replace(/\(.*/, ''))) {
      typeWords.push(words.shift());
    }
    const type = typeWords.join(' ');
    const constraints = words.join(' ');
    const constraintsUpper = constraints.toUpperCase();
    const defaultMatch = /\bDEFAULT\s+('(?:[^']|'')*'|\([^)]*\)|[^\s]+)/i.exec(constraints);
    columns.push({
      name,
      type,
      notNull: /\bNOT\s+NULL\b/.test(constraintsUpper),
      primaryKey: /\bPRIMARY\s+KEY\b/.test(constraintsUpper),
      defaultValue: defaultMatch ? defaultMatch[1] : undefined,
      descending: /\bPRIMARY\s+KEY\s+DESC\b/.test(constraintsUpper),
    });
  });
  if (tablePrimaryKey) {
    columns.forEach((column) => {
      if (tablePrimaryKey.includes(column.name)) Object.assign(column, { primaryKey: true });
    });
  }
  const primaryKeys = columns.filter((column) => column.primaryKey);
  return columns.map(({ descending, ...column }) => ({
    ...column,
    rowidAlias: primaryKeys.length === 1 && column.primaryKey && !descending
      && column.type.toUpperCase() === 'INTEGER',
  }));
};

/**
 * Compara valores de índice con el orden de SQLite (NULL < números < texto < BLOB).
 * @param {*} a Valor.
 * @param {*} b Valor.
 * @returns {Number} Negativo, cero o positivo.
 */
const compareValues = (a, b) => {
  const rank = (value) => {
    if (value === null) return 0;
    if (typeof value === 'number') return 1;
    if (typeof value === 'string') return 2;
    return 3;
  };
  const difference = rank(a) - rank(b);
  if (difference !== 0) return difference;
  if (a === null) return 0;
  if (rank(a) === 1) return a < b ? -1 : Number(a > b);
  if (rank(a) === 2) return a < b ? -1 : Number(a > b);
  const length = Math.min(a.length, b.length);
  for (let index = 0; index < length; index += 1) {
    if (a[index] !== b[index]) return a[index] - b[index];
  }
  return a.length - b.length;
};

/**
 * Lector de un fichero SQLite.
 */
class SqliteReader {
  /**
   * @param {ByteSource} source Origen de bytes.
   * @param {Object} [options] Opciones.
   * @param {Number} [options.maxPages=100000] Páginas que puede visitar una operación.
   */
  constructor(source, { maxPages = 100000 } = {}) {
    this.source_ = source;
    this.maxPages_ = maxPages;
    this.header_ = null;
    this.schema_ = null;
  }

  /**
   * Lee y valida la cabecera del fichero.
   * @returns {Promise<Object>} pageSize, usableSize, changeCounter, pageCount, writeVersion,
   * applicationId.
   */
  async open() {
    if (this.header_) return this.header_;
    const bytes = await this.source_.read(0, 100);
    if (bytes.length < 100 || decoder.decode(bytes.subarray(0, 16)) !== MAGIC) {
      fail('no es un fichero SQLite 3');
    }
    const rawPageSize = readUnsigned(bytes, 16, 2);
    const pageSize = rawPageSize === 1 ? 65536 : rawPageSize;
    if (pageSize < 512 || pageSize > 65536 || (pageSize & (pageSize - 1)) !== 0) {
      fail('tamaño de página no válido');
    }
    const reserved = bytes[20];
    if (bytes[21] !== 64 || bytes[22] !== 32 || bytes[23] !== 32) fail('fracciones de carga no válidas');
    const encoding = readUnsigned(bytes, 56, 4);
    if (encoding !== 0 && encoding !== 1) fail('codificación de texto no admitida');
    this.header_ = {
      pageSize,
      usableSize: pageSize - reserved,
      changeCounter: readUnsigned(bytes, 24, 4),
      pageCount: readUnsigned(bytes, 28, 4),
      writeVersion: bytes[18],
      applicationId: readUnsigned(bytes, 68, 4),
    };
    if (this.header_.usableSize < 480) fail('espacio reservado no válido');
    return this.header_;
  }

  /**
   * Lee y analiza una página B-tree.
   * @private
   * @param {Number} number Número de página (desde 1).
   * @returns {Promise<Object>} Página.
   */
  async readPage_(number) {
    const { pageSize, pageCount } = await this.open();
    if (!Number.isInteger(number) || number < 1 || (pageCount > 0 && number > pageCount * 4)) {
      fail(`página fuera del fichero (${number})`);
    }
    const bytes = await this.source_.read((number - 1) * pageSize, pageSize);
    if (bytes.length < pageSize) fail(`página incompleta (${number})`);
    const headerOffset = number === 1 ? 100 : 0;
    const type = bytes[headerOffset];
    if (!Object.values(PAGE).includes(type)) {
      fail(`tipo de página no válido (${number})`);
    }
    const interior = type === PAGE.INDEX_INTERIOR || type === PAGE.TABLE_INTERIOR;
    const cellCount = readUnsigned(bytes, headerOffset + 3, 2);
    const headerSize = interior ? 12 : 8;
    if (headerOffset + headerSize + (cellCount * 2) > pageSize) fail(`demasiadas celdas (${number})`);
    const pointers = Array.from({ length: cellCount }, (_, index) => {
      const pointer = readUnsigned(bytes, headerOffset + headerSize + (index * 2), 2);
      if (pointer < headerOffset + headerSize || pointer >= pageSize) {
        fail(`celda fuera de la página (${number})`);
      }
      return pointer;
    });
    return {
      number,
      type,
      interior,
      bytes,
      pointers,
      rightChild: interior ? readUnsigned(bytes, headerOffset + 8, 4) : null,
    };
  }

  /**
   * Devuelve el contenido completo de una celda, incluido el desbordamiento.
   * @private
   * @param {Object} page Página.
   * @param {Number} offset Comienzo de la carga en la página.
   * @param {Number} payloadSize Tamaño total de la carga.
   * @param {Boolean} index Indica si es una celda de índice.
   * @returns {Promise<Uint8Array>} Carga.
   */
  async readPayload_(page, offset, payloadSize, index) {
    const { usableSize } = this.header_;
    const maxLocal = index ? Math.floor(((usableSize - 12) * 64) / 255) - 23 : usableSize - 35;
    if (payloadSize <= maxLocal) {
      if (offset + payloadSize > page.bytes.length) fail('celda truncada');
      return page.bytes.subarray(offset, offset + payloadSize);
    }
    const minLocal = Math.floor(((usableSize - 12) * 32) / 255) - 23;
    const candidate = minLocal + ((payloadSize - minLocal) % (usableSize - 4));
    const local = candidate <= maxLocal ? candidate : minLocal;
    if (offset + local + 4 > page.bytes.length) fail('celda truncada');
    const payload = new Uint8Array(payloadSize);
    payload.set(page.bytes.subarray(offset, offset + local));
    let written = local;
    let next = readUnsigned(page.bytes, offset + local, 4);
    const visited = new Set();
    const { pageSize } = this.header_;
    while (written < payloadSize) {
      if (next === 0 || visited.has(next)) fail('cadena de desbordamiento no válida');
      visited.add(next);
      // eslint-disable-next-line no-await-in-loop
      const overflow = await this.source_.read((next - 1) * pageSize, pageSize);
      if (overflow.length < usableSize) fail('página de desbordamiento incompleta');
      const chunk = Math.min(usableSize - 4, payloadSize - written);
      payload.set(overflow.subarray(4, 4 + chunk), written);
      written += chunk;
      next = readUnsigned(overflow, 0, 4);
    }
    return payload;
  }

  /**
   * Lee una celda de una página de tabla.
   * @private
   * @param {Object} page Página.
   * @param {Number} pointer Posición de la celda.
   * @returns {Promise<Object>} { rowid } en interiores con child; { rowid, values } en hojas.
   */
  async readTableCell_(page, pointer) {
    if (page.interior) {
      const child = readUnsigned(page.bytes, pointer, 4);
      const [rowid] = readVarint(page.bytes, pointer + 4);
      return { child, rowid };
    }
    const [payloadSize, sizeBytes] = readVarint(page.bytes, pointer);
    const [rowid, rowidBytes] = readVarint(page.bytes, pointer + sizeBytes);
    const payload = await this.readPayload_(
      page,
      pointer + sizeBytes + rowidBytes,
      payloadSize,
      false,
    );
    return { rowid, values: decodeRecord(payload) };
  }

  /**
   * Lee una celda de una página de índice.
   * @private
   * @param {Object} page Página.
   * @param {Number} pointer Posición de la celda.
   * @returns {Promise<Object>} { child, key }.
   */
  async readIndexCell_(page, pointer) {
    let position = pointer;
    let child = null;
    if (page.interior) {
      child = readUnsigned(page.bytes, pointer, 4);
      position += 4;
    }
    const [payloadSize, sizeBytes] = readVarint(page.bytes, position);
    const payload = await this.readPayload_(page, position + sizeBytes, payloadSize, true);
    return { child, key: decodeRecord(payload) };
  }

  /**
   * Crea el control de páginas visitadas de una operación.
   * @private
   * @returns {function(Number): void} Registra una página.
   */
  createVisitGuard_() {
    const visited = new Set();
    return (number) => {
      if (visited.has(number)) fail(`ciclo en el B-tree (${number})`);
      visited.add(number);
      if (visited.size > this.maxPages_) fail('demasiadas páginas en una operación');
    };
  }

  /**
   * Recorre todas las filas de una tabla en orden de rowid.
   * @param {Number} rootPage Página raíz.
   * @returns {Promise<Array<Object>>} Filas { rowid, values }.
   */
  async scanTable(rootPage) {
    const visit = this.createVisitGuard_();
    const walk = async (number, depth) => {
      if (depth > MAX_DEPTH) fail('B-tree demasiado profundo');
      visit(number);
      const page = await this.readPage_(number);
      if (page.type !== PAGE.TABLE_LEAF && page.type !== PAGE.TABLE_INTERIOR) {
        fail(`la página ${number} no es de tabla`);
      }
      const cells = await Promise.all(page.pointers.map((pointer) => (
        this.readTableCell_(page, pointer)
      )));
      if (!page.interior) return cells;
      const children = await Promise.all([...cells.map(({ child }) => child), page.rightChild]
        .map((child) => walk(child, depth + 1)));
      return children.flat();
    };
    return walk(rootPage, 0);
  }

  /**
   * Busca varias filas por rowid, recorriendo solo las ramas necesarias.
   * @param {Number} rootPage Página raíz.
   * @param {Array<Number>} rowids Identificadores.
   * @returns {Promise<Map<Number, Array<*>>>} Valores por rowid encontrado.
   */
  async getRows(rootPage, rowids) {
    const wanted = [...new Set(rowids)].sort((a, b) => (a < b ? -1 : Number(a > b)));
    const found = new Map();
    const visit = this.createVisitGuard_();
    const walk = async (number, keys, depth) => {
      if (keys.length === 0) return;
      if (depth > MAX_DEPTH) fail('B-tree demasiado profundo');
      visit(number);
      const page = await this.readPage_(number);
      if (page.type !== PAGE.TABLE_LEAF && page.type !== PAGE.TABLE_INTERIOR) {
        fail(`la página ${number} no es de tabla`);
      }
      if (!page.interior) {
        const keySet = new Set(keys);
        await Promise.all(page.pointers.map(async (pointer) => {
          const [, sizeBytes] = readVarint(page.bytes, pointer);
          const [rowid] = readVarint(page.bytes, pointer + sizeBytes);
          if (keySet.has(rowid)) {
            const { values } = await this.readTableCell_(page, pointer);
            found.set(rowid, values);
          }
        }));
        return;
      }
      const cells = page.pointers.map((pointer) => ({
        child: readUnsigned(page.bytes, pointer, 4),
        rowid: readVarint(page.bytes, pointer + 4)[0],
      }));
      const groups = new Map();
      let cursor = 0;
      keys.forEach((key) => {
        while (cursor < cells.length && key > cells[cursor].rowid) cursor += 1;
        const child = cursor < cells.length ? cells[cursor].child : page.rightChild;
        if (!groups.has(child)) groups.set(child, []);
        groups.get(child).push(key);
      });
      await Promise.all([...groups.entries()].map(([child, childKeys]) => (
        walk(child, childKeys, depth + 1)
      )));
    };
    await walk(rootPage, wanted, 0);
    return found;
  }

  /**
   * Busca la primera entrada de un índice cuyas columnas iniciales coinciden con la clave.
   * @param {Number} rootPage Página raíz del índice.
   * @param {Array<*>} prefix Valores de las primeras columnas del índice.
   * @returns {Promise<Array<*>|null>} Entrada completa del índice (el rowid al final) o null.
   */
  async seekIndex(rootPage, prefix) {
    const visit = this.createVisitGuard_();
    const compare = (key) => {
      for (let index = 0; index < prefix.length; index += 1) {
        const difference = compareValues(key[index], prefix[index]);
        if (difference !== 0) return difference;
      }
      return 0;
    };
    const walk = async (number, depth) => {
      if (depth > MAX_DEPTH) fail('B-tree demasiado profundo');
      visit(number);
      const page = await this.readPage_(number);
      if (page.type !== PAGE.INDEX_LEAF && page.type !== PAGE.INDEX_INTERIOR) {
        fail(`la página ${number} no es de índice`);
      }
      const cells = await Promise.all(page.pointers.map((pointer) => (
        this.readIndexCell_(page, pointer)
      )));
      for (let index = 0; index < cells.length; index += 1) {
        const difference = compare(cells[index].key);
        if (difference >= 0) {
          if (page.interior) {
            // eslint-disable-next-line no-await-in-loop
            const inChild = await walk(cells[index].child, depth + 1);
            if (inChild) return inChild;
          }
          return difference === 0 ? cells[index].key : null;
        }
      }
      return page.interior ? walk(page.rightChild, depth + 1) : null;
    };
    return walk(rootPage, 0);
  }

  /**
   * Devuelve el esquema del fichero (tabla sqlite_schema).
   * @returns {Promise<Array<Object>>} Objetos: type, name, tableName, rootPage, sql.
   */
  async getSchema() {
    if (!this.schema_) {
      this.schema_ = this.scanTable(1).then((rows) => rows.map(({ values }) => ({
        type: values[0],
        name: values[1],
        tableName: values[2],
        rootPage: values[3],
        sql: values[4],
      })));
      this.schema_.catch(() => { this.schema_ = null; });
    }
    return this.schema_;
  }

  /**
   * Describe una tabla con rowid.
   * @param {String} name Nombre de la tabla.
   * @returns {Promise<Object|null>} name, rootPage, columns, rowidColumn; null si no existe.
   */
  async getTable(name) {
    const schema = await this.getSchema();
    const entry = schema.find((item) => item.type === 'table'
      && String(item.name).toLowerCase() === String(name).toLowerCase());
    if (!entry) return null;
    if (/\bWITHOUT\s+ROWID\b/i.test(entry.sql || '')) fail(`tabla sin rowid (${name})`);
    if (!entry.rootPage) fail(`tabla virtual (${name})`);
    const columns = parseCreateTable(entry.sql);
    return {
      name: entry.name,
      rootPage: entry.rootPage,
      columns,
      rowidColumn: columns.findIndex((column) => column.rowidAlias),
    };
  }

  /**
   * Convierte los valores de una fila en un objeto, con el rowid en su columna alias.
   * @param {Object} table Tabla descrita por getTable.
   * @param {Number} rowid Rowid.
   * @param {Array<*>} values Valores del registro.
   * @returns {Object} Fila por nombre de columna.
   */
  static toObject(table, rowid, values) {
    return Object.fromEntries(table.columns.map((column, index) => [
      column.name,
      index === table.rowidColumn ? rowid : (values[index] ?? null),
    ]));
  }

  /**
   * Lee todas las filas de una tabla como objetos.
   * @param {String} name Nombre de la tabla.
   * @returns {Promise<Array<Object>>} Filas; vacío si la tabla no existe.
   */
  async readAll(name) {
    const table = await this.getTable(name);
    if (!table) return [];
    const rows = await this.scanTable(table.rootPage);
    return rows.map(({ rowid, values }) => SqliteReader.toObject(table, rowid, values));
  }
}

export default SqliteReader;
