/**
 * Proveedor de una tabla de teselas de un GeoPackage leído por rangos.
 *
 * @module IDEE/datasource/geopackage/RangeTileProvider
 */
import AbstractProvider from '../../provider/AbstractProvider';
import { RangeUnsupportedError } from './errors';

/**
 * Semieje de la proyección WebMercator (EPSG:3857).
 * @const
 * @type {Number}
 */
const WEB_MERCATOR = 20037508.342789244;

/**
 * Tipos MIME de las imágenes de teselas por su firma.
 * @param {Uint8Array} bytes Imagen.
 * @returns {String} Tipo MIME.
 */
const imageType = (bytes) => {
  if (bytes[0] === 0xff && bytes[1] === 0xd8) return 'image/jpeg';
  if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[8] === 0x57 && bytes[9] === 0x45) {
    return 'image/webp';
  }
  return 'image/png';
};

/**
 * Codifica bytes en base64.
 * @param {Uint8Array} bytes Bytes.
 * @returns {String} Base64.
 */
const toBase64 = (bytes) => {
  let binary = '';
  for (let index = 0; index < bytes.length; index += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
  }
  return btoa(binary);
};

/**
 * Lee teselas de una matriz alineada con la rejilla WebMercator: la tesela XYZ (x, y, z)
 * es la fila (zoom_level = z, tile_column = x, tile_row = y), que se busca en el índice
 * único de la tabla sin descargar el resto del fichero.
 */
class RangeTileProvider extends AbstractProvider {
  /**
   * @param {Object} pack Paquete por rangos.
   * @param {String} tableName Tabla.
   * @param {Object} options Opciones del proveedor.
   * @param {Object} context Contexto de lectura.
   * @param {SqliteReader} context.reader Lector SQLite.
   * @param {Object} context.table Tabla descrita por SqliteReader.getTable.
   * @param {Number} context.indexRoot Página raíz del índice (zoom, columna, fila).
   * @param {Object} context.tileMatrixSet Fila de gpkg_tile_matrix_set.
   * @param {Array<Number>} context.zooms Niveles de zoom disponibles.
   */
  constructor(pack, tableName, options, {
    reader, table, indexRoot, tileMatrixSet, zooms,
  }) {
    super(pack, tableName, options);
    this.reader_ = reader;
    this.table_ = table;
    this.indexRoot_ = indexRoot;
    this.tileMatrixSet_ = tileMatrixSet;
    this.zooms_ = zooms;
    this.dataColumn_ = table.columns.findIndex(({ name }) => name === 'tile_data');
    this.pendingTiles_ = new Set();
  }

  /**
   * Devuelve la tesela XYZ como URL de datos o undefined si no existe.
   * @param {Number} x Columna.
   * @param {Number} y Fila.
   * @param {Number} z Zoom.
   * @returns {Promise<String|undefined>} Imagen.
   */
  getTile(x, y, z) {
    const request = (async () => {
      if (!this.zooms_.includes(z)) return undefined;
      const entry = await this.reader_.seekIndex(this.indexRoot_, [z, x, y]);
      if (!entry) return undefined;
      const rowid = entry[entry.length - 1];
      const rows = await this.reader_.getRows(this.table_.rootPage, [rowid]);
      const data = rows.get(rowid)?.[this.dataColumn_];
      if (!(data instanceof Uint8Array) || data.length === 0) return undefined;
      return `data:${imageType(data)};base64,${toBase64(data)}`;
    })();
    this.pendingTiles_.add(request);
    const settled = () => this.pendingTiles_.delete(request);
    request.then(settled, settled);
    return request;
  }

  whenIdle() {
    return Promise.allSettled([...this.pendingTiles_]);
  }

  getExtent() {
    const set = this.tileMatrixSet_;
    return [set.min_x, set.min_y, set.max_x, set.max_y];
  }

  getProjection() {
    return `EPSG:${this.tileMatrixSet_.srs_id}`;
  }

  getMinZoom() {
    return Math.min(...this.zooms_);
  }

  getMaxZoom() {
    return Math.max(...this.zooms_);
  }
}

/**
 * Crea el proveedor de una tabla de teselas si su matriz está alineada con WebMercator y
 * tiene el índice único estándar; si no, el paquete debe descargarse completo.
 * @param {Object} context Tabla, matrices, lector y opciones (ver RangeGeoPackage).
 * @returns {Promise<RangeTileProvider>} Proveedor.
 */
export const createRangeTileProvider = async ({
  pack, reader, name, table, tileMatrixSet, tileMatrices, options,
}) => {
  const near = (a, b) => Math.abs(a - b) <= 1e-3;
  const aligned = tileMatrixSet && tileMatrixSet.srs_id === 3857
    && near(tileMatrixSet.min_x, -WEB_MERCATOR) && near(tileMatrixSet.max_x, WEB_MERCATOR)
    && near(tileMatrixSet.min_y, -WEB_MERCATOR) && near(tileMatrixSet.max_y, WEB_MERCATOR)
    && tileMatrices.length > 0
    && tileMatrices.every((matrix) => matrix.matrix_width === 2 ** matrix.zoom_level
      && matrix.matrix_height === 2 ** matrix.zoom_level);
  if (!aligned) {
    throw new RangeUnsupportedError(`matriz de teselas no alineada con WebMercator (${name})`);
  }
  const schema = await reader.getSchema();
  const index = schema.find((item) => item.type === 'index'
    && String(item.tableName).toLowerCase() === String(name).toLowerCase()
    && /^sqlite_autoindex_/.test(item.name) && item.rootPage);
  if (!index) {
    throw new RangeUnsupportedError(`tabla de teselas sin índice único (${name})`);
  }
  return new RangeTileProvider(pack, name, options, {
    reader,
    table,
    indexRoot: index.rootPage,
    tileMatrixSet,
    zooms: tileMatrices.map(({ zoom_level: zoom }) => zoom),
  });
};

export default RangeTileProvider;
