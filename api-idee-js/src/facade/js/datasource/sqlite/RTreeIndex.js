/**
 * Consulta de un índice espacial R*Tree de SQLite leyendo sus nodos como datos, sin el
 * módulo rtree. Es el índice de la extensión gpkg_rtree_index de GeoPackage.
 *
 * @module IDEE/datasource/sqlite/RTreeIndex
 * @see https://www.sqlite.org/rtree.html
 */
import { SqliteFormatError } from './SqliteReader';

/**
 * Bytes de cada entrada de un nodo bidimensional: id de 64 bits y 4 float32.
 * @const
 * @type {Number}
 */
const ENTRY_SIZE = 24;

/**
 * Profundidad máxima admitida.
 * @const
 * @type {Number}
 */
const MAX_DEPTH = 40;

/**
 * Decodifica el blob de un nodo (tabla <rtree>_node).
 * @param {Uint8Array} blob Contenido del nodo.
 * @returns {{depth: Number, entries: Array<Object>}} Profundidad (solo en la raíz) y
 * entradas { id, minX, maxX, minY, maxY }.
 */
export const decodeNode = (blob) => {
  if (!(blob instanceof Uint8Array) || blob.length < 4) {
    throw new SqliteFormatError('nodo de R*Tree no válido');
  }
  const view = new DataView(blob.buffer, blob.byteOffset, blob.byteLength);
  const count = view.getUint16(2);
  if (4 + (count * ENTRY_SIZE) > blob.length) {
    throw new SqliteFormatError('nodo de R*Tree truncado');
  }
  const entries = Array.from({ length: count }, (_, index) => {
    const offset = 4 + (index * ENTRY_SIZE);
    const high = view.getInt32(offset);
    const low = view.getUint32(offset + 4);
    return {
      id: (high * (2 ** 32)) + low,
      minX: view.getFloat32(offset + 8),
      maxX: view.getFloat32(offset + 12),
      minY: view.getFloat32(offset + 16),
      maxY: view.getFloat32(offset + 20),
    };
  });
  return { depth: view.getUint16(0), entries };
};

/**
 * Busca identificadores en un R*Tree bidimensional. Los nodos de cada nivel se piden
 * juntos para que el lector pueda agrupar las lecturas. La lectura de nodos puede ser
 * asíncrona (rangos HTTP) o síncrona (base de datos en memoria).
 */
class RTreeIndex {
  /**
   * @param {function(Array<Number>): (Map<Number, Uint8Array>|Promise<Map<Number, Uint8Array>>)}
   * readNodes Lee los blobs de los nodos indicados (columna data de la tabla <rtree>_node).
   * @param {Object} [options] Opciones.
   * @param {Number} [options.maxNodes=200000] Nodos que puede visitar una búsqueda.
   * @param {Boolean} [options.sync=false] readNodes es síncrona y search devuelve el resultado
   * directamente.
   */
  constructor(readNodes, { maxNodes = 200000, sync = false } = {}) {
    this.readNodes_ = readNodes;
    this.maxNodes_ = maxNodes;
    this.sync_ = sync;
  }

  /**
   * Devuelve los identificadores cuyo rectángulo interseca la extensión.
   * @param {Array<Number>} extent [minX, minY, maxX, maxY] en la SRS de la tabla.
   * @returns {Array<Number>|Promise<Array<Number>>} Identificadores ordenados; una promesa
   * si la lectura de nodos es asíncrona.
   */
  search(extent) {
    const walker = this.walk_(extent);
    let step = walker.next();
    if (this.sync_) {
      while (!step.done) {
        step = walker.next(this.readNodes_(step.value));
      }
      return step.value;
    }
    const run = async () => {
      while (!step.done) {
        // eslint-disable-next-line no-await-in-loop
        step = walker.next(await this.readNodes_(step.value));
      }
      return step.value;
    };
    return run();
  }

  /**
   * Recorre el árbol por niveles: entrega los nodos que necesita y recibe sus blobs.
   * @private
   * @param {Array<Number>} extent Extensión.
   * @returns {Generator} Recorrido.
   */
  * walk_([minX, minY, maxX, maxY]) {
    const intersects = (entry) => entry.minX <= maxX && entry.maxX >= minX
      && entry.minY <= maxY && entry.maxY >= minY;
    const visited = new Set([1]);
    const root = (yield [1]).get(1);
    if (!root) return [];
    const { depth } = decodeNode(root);
    if (depth > MAX_DEPTH) throw new SqliteFormatError('R*Tree demasiado profundo');
    let level = [root];
    for (let current = depth; current > 0; current -= 1) {
      const children = level.flatMap((blob) => decodeNode(blob).entries.filter(intersects))
        .map(({ id }) => id);
      children.forEach((child) => {
        if (visited.has(child)) throw new SqliteFormatError('ciclo en el R*Tree');
        visited.add(child);
      });
      if (visited.size > this.maxNodes_) throw new SqliteFormatError('R*Tree demasiado grande');
      if (children.length === 0) return [];
      const nodes = yield children;
      level = children.map((child) => {
        const blob = nodes.get(child);
        if (!blob) throw new SqliteFormatError(`nodo de R*Tree inexistente (${child})`);
        return blob;
      });
    }
    return level.flatMap((blob) => decodeNode(blob).entries.filter(intersects))
      .map(({ id }) => id)
      .sort((a, b) => a - b);
  }
}

export default RTreeIndex;
