/**
 * @module IDEE/impl/provider/GeoTIFFImageryProvider
 */
import {
  GeographicTilingScheme,
  Math as CesiumMath,
  Rectangle,
  UrlTemplateImageryProvider,
} from 'cesium';
import { fromBlob, fromUrl } from 'geotiff';
import proj4 from 'proj4';

/**
 * Tamaño de las teselas generadas.
 * @const
 * @type {Number}
 */
const TILE_SIZE = 256;

/**
 * Divisiones de la malla de puntos que se reproyectan por tesela; el resto de
 * píxeles se interpolan dentro de cada celda.
 * @const
 * @type {Number}
 */
const GRID_STEPS = 16;

/**
 * Grados por píxel de una tesela de nivel 0 del esquema geográfico (180º / 256 px).
 * @const
 * @type {Number}
 */
const LEVEL0_DEGREES_PER_PIXEL = 180 / TILE_SIZE;

/**
 * Proyecciones cuyas coordenadas ya están en grados (sin reproyección).
 * @const
 * @type {Array<String>}
 */
const DEGREES_PROJECTIONS = ['EPSG:4326', 'EPSG:4258', 'EPSG:4979', 'CRS:84'];

/**
 * Interpretaciones fotométricas que se convierten a RGB con 'auto', como en OL.
 * @const
 * @type {Array<Number>}
 */
const AUTO_RGB_PHOTOMETRICS = [
  5, // CMYK
  6, // YCbCr
  8, // CIELab
  9, // ICCLab
];

/**
 * Código "definido por el usuario" de las claves geográficas del GeoTIFF.
 * @const
 * @type {Number}
 */
const USER_DEFINED = 32767;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

/**
 * @param {*} value Valor.
 * @returns {Boolean} Verdadero si es un número finito.
 */
const isNumber = (value) => typeof value === 'number' && Number.isFinite(value);

/**
 * @param {Array} value Lista.
 * @returns {Boolean} Verdadero si no es una lista con elementos.
 */
const isEmpty = (value) => !Array.isArray(value) || value.length === 0;

/**
 * Interpolación bilineal de una coordenada de la malla de una tesela.
 *
 * @param {Float64Array} grid Malla de coordenadas (x, y intercaladas).
 * @param {Number} size Puntos por lado de la malla.
 * @param {Number} i Columna de la celda.
 * @param {Number} j Fila de la celda.
 * @param {Number} fx Fracción horizontal dentro de la celda.
 * @param {Number} fy Fracción vertical dentro de la celda.
 * @param {Number} axis 0 para x, 1 para y.
 * @returns {Number} Coordenada interpolada.
 */
const interpolate = (grid, size, i, j, fx, fy, axis) => {
  const at = (ii, jj) => grid[(jj * size + ii) * 2 + axis];
  const top = at(i, j) * (1 - fx) + at(i + 1, j) * fx;
  const bottom = at(i, j + 1) * (1 - fx) + at(i + 1, j + 1) * fx;
  return top * (1 - fy) + bottom * fy;
};

/**
 * Valor máximo (o mínimo) del tipo de dato de una banda, como en OL.
 *
 * @param {TypedArray} array Datos de la banda.
 * @param {Boolean} max Verdadero para el máximo.
 * @returns {Number} Valor límite.
 */
const dataTypeLimit = (array, max) => {
  const limits = [
    [Int8Array, -128, 127], [Uint8Array, 0, 255], [Uint8ClampedArray, 0, 255],
    [Int16Array, -32768, 32767], [Uint16Array, 0, 65535],
    [Int32Array, -2147483648, 2147483647], [Uint32Array, 0, 4294967295],
  ];
  const limit = limits.find(([Type]) => array instanceof Type);
  if (limit) return max ? limit[2] : limit[1];
  return max ? 255 : 0;
};

/**
 * Código EPSG de las claves geográficas del GeoTIFF.
 *
 * @param {Object} geoKeys Claves geográficas.
 * @returns {String|null} Código EPSG.
 */
const codeFromGeoKeys = (geoKeys = {}) => {
  const projected = geoKeys.ProjectedCSTypeGeoKey;
  if (projected && projected !== USER_DEFINED) return `EPSG:${projected}`;
  const geographic = geoKeys.GeographicTypeGeoKey;
  if (geographic && geographic !== USER_DEFINED) return `EPSG:${geographic}`;
  return null;
};

/**
 * @classdesc
 * Proveedor de imágenes de Cesium para GeoTIFF y COG. Lee de cada imagen (o de
 * la vista general más adecuada) solo la ventana que cubre la tesela pedida, la
 * reproyecta con proj4 al esquema geográfico de Cesium y la pinta en un canvas:
 * RGB tal cual, bandas normalizadas (estadísticas GDAL o rango del tipo de dato,
 * como en OL) y transparencia para el valor "nodata".
 *
 * @api
 * @extends {Cesium.UrlTemplateImageryProvider}
 */
class GeoTIFFImageryProvider extends UrlTemplateImageryProvider {
  /**
   * Abre el GeoTIFF y crea el proveedor.
   *
   * @public
   * @function
   * @param {Object} options Opciones.
   * @param {String} [options.url] URL del GeoTIFF.
   * @param {Blob} [options.blob] Fichero GeoTIFF.
   * @param {String} [options.projection] Proyección del GeoTIFF (si no la declara).
   * @param {Array<Number>} [options.bands] Bandas a pintar (desde 1).
   * @param {Array<Number>} [options.min] Mínimos por banda para normalizar.
   * @param {Array<Number>} [options.max] Máximos por banda para normalizar.
   * @param {Number} [options.nodata] Valor sin datos.
   * @param {Boolean} [options.normalize=true] Normalizar las bandas a 0-255.
   * @param {Boolean|String} [options.convertToRGB='auto'] Convertir a RGB.
   * @param {Number} [options.cacheSize] Tamaño de caché de bloques.
   * @param {Number} [options.blockSize] Tamaño de bloque de las peticiones.
   * @returns {Promise<GeoTIFFImageryProvider>} Proveedor.
   * @api
   */
  static async fromSource(options) {
    const tiff = options.blob
      ? await fromBlob(options.blob)
      : await fromUrl(options.url, { cacheSize: options.cacheSize, blockSize: options.blockSize });
    const count = await tiff.getImageCount();
    const images = [];
    for (let i = 0; i < count; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      const image = await tiff.getImage(i);
      // eslint-disable-next-line no-bitwise
      const isMask = ((image.fileDirectory.NewSubfileType || 0) & 4) !== 0;
      if (!isMask) images.push(image);
    }
    const base = images[0];
    const projection = options.projection || codeFromGeoKeys(base.getGeoKeys()) || 'EPSG:4326';
    if (!DEGREES_PROJECTIONS.includes(projection.toUpperCase()) && !proj4.defs(projection)) {
      throw new Error(`GeoTIFF: proyección no soportada (${projection})`);
    }
    const provider = new GeoTIFFImageryProvider({
      ...options, tiff, images, projection,
    });
    await provider.initNormalization();
    return provider;
  }

  /**
   * Constructor principal de la clase. Usar {@link GeoTIFFImageryProvider.fromSource}.
   *
   * @constructor
   * @param {Object} options Opciones de fromSource más el GeoTIFF abierto.
   * @api
   */
  constructor(options) {
    const base = options.images[0];
    const bbox = base.getBoundingBox();
    const sourceProjection = options.projection;
    const inDegrees = DEGREES_PROJECTIONS.includes(sourceProjection.toUpperCase());
    const toDegrees = inDegrees
      ? (coord) => coord
      : (coord) => proj4(sourceProjection, 'EPSG:4326', coord);
    const extent = GeoTIFFImageryProvider.transformBbox(bbox, toDegrees);
    const degreesPerPixel = (extent[2] - extent[0]) / base.getWidth();
    const maximumLevel = Math.max(0, Math.ceil(Math.log2(LEVEL0_DEGREES_PER_PIXEL
      / degreesPerPixel)));

    super({
      // La URL no se usa: requestImage genera la tesela a partir del GeoTIFF
      url: 'geotiff://{z}/{x}/{y}',
      tilingScheme: new GeographicTilingScheme(),
      rectangle: Rectangle.fromDegrees(...extent),
      tileWidth: TILE_SIZE,
      tileHeight: TILE_SIZE,
      minimumLevel: 0,
      maximumLevel,
      hasAlphaChannel: true,
    });

    /**
     * GeoTIFF abierto.
     * @public
     * @type {GeoTIFF}
     */
    this.tiff = options.tiff;

    /**
     * Imagen principal y vistas generales (sin máscaras), de más a menos detalle.
     * @private
     * @type {Array<GeoTIFFImage>}
     */
    this.images_ = options.images;

    /**
     * Extensión del GeoTIFF en su proyección.
     * @private
     * @type {Array<Number>}
     */
    this.bbox_ = bbox;

    /**
     * Extensión del GeoTIFF en grados.
     * @public
     * @type {Array<Number>}
     */
    this.extent = extent;

    /**
     * Proyección del GeoTIFF.
     * @public
     * @type {String}
     */
    this.projection = sourceProjection;

    /**
     * Pasa de grados a la proyección del GeoTIFF.
     * @private
     * @type {Function}
     */
    this.toSource_ = inDegrees
      ? (coord) => coord
      : (coord) => proj4('EPSG:4326', sourceProjection, coord);

    const samplesPerPixel = base.getSamplesPerPixel();
    const useRGB = isEmpty(options.bands) && (options.convertToRGB === true
      || (options.convertToRGB !== false && samplesPerPixel === 3
        && AUTO_RGB_PHOTOMETRICS.includes(base.fileDirectory.PhotometricInterpretation)));

    /**
     * Lee las bandas convertidas a RGB (readRGB de geotiff).
     * @private
     * @type {Boolean}
     */
    this.useRGB_ = useRGB;

    /**
     * Índices (desde 0) de las bandas que se pintan (máximo 4).
     * @private
     * @type {Array<Number>}
     */
    this.samples_ = isEmpty(options.bands)
      ? [...Array(Math.min(samplesPerPixel, 4)).keys()]
      : options.bands.slice(0, 4).map((band) => band - 1);

    /**
     * Valor sin datos.
     * @private
     * @type {Number|null}
     */
    this.nodata_ = isNumber(options.nodata) ? options.nodata : base.getGDALNoData();

    /**
     * Normalizar las bandas a 0-255.
     * @private
     * @type {Boolean}
     */
    this.normalize_ = options.normalize !== false && !useRGB;

    this.userMin_ = options.min;
    this.userMax_ = options.max;

    /**
     * Ganancia y desplazamiento por banda para normalizar.
     * @private
     * @type {Array<Array<Number>>}
     */
    this.scales_ = [];
  }

  /**
   * Extensión en grados de una extensión en la proyección del GeoTIFF,
   * muestreando sus bordes para que la reproyección no recorte la imagen.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   *
   * @param {Array<Number>} bbox Extensión.
   * @param {Function} toDegrees Transformación a grados.
   * @returns {Array<Number>} Extensión en grados.
   */
  static transformBbox(bbox, toDegrees) {
    const [minX, minY, maxX, maxY] = bbox;
    const steps = 10;
    const points = [];
    for (let i = 0; i <= steps; i += 1) {
      const x = minX + ((maxX - minX) * i) / steps;
      const y = minY + ((maxY - minY) * i) / steps;
      points.push([x, minY], [x, maxY], [minX, y], [maxX, y]);
    }
    const degrees = points.map(toDegrees)
      .filter(([lon, lat]) => Number.isFinite(lon) && Number.isFinite(lat));
    return [
      clamp(Math.min(...degrees.map((p) => p[0])), -180, 180),
      clamp(Math.min(...degrees.map((p) => p[1])), -90, 90),
      clamp(Math.max(...degrees.map((p) => p[0])), -180, 180),
      clamp(Math.max(...degrees.map((p) => p[1])), -90, 90),
    ];
  }

  /**
   * Calcula la normalización de cada banda: valores del usuario, estadísticas
   * GDAL o, si no las hay, el rango del tipo de dato (como OL).
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   *
   * @returns {Promise} Se resuelve cuando se conocen las escalas.
   */
  async initNormalization() {
    if (!this.normalize_) return;
    const base = this.images_[0];
    // Una lectura mínima da el tipo de dato de cada banda
    const sample = await base.readRasters({ window: [0, 0, 1, 1], samples: this.samples_ });
    this.scales_ = this.samples_.map((sampleIndex, i) => {
      const stats = base.getGDALMetadata(sampleIndex) || {};
      const userMin = Array.isArray(this.userMin_) ? this.userMin_[sampleIndex] : this.userMin_;
      const userMax = Array.isArray(this.userMax_) ? this.userMax_[sampleIndex] : this.userMax_;
      let min = isNumber(userMin) ? userMin : parseFloat(stats.STATISTICS_MINIMUM);
      let max = isNumber(userMax) ? userMax : parseFloat(stats.STATISTICS_MAXIMUM);
      if (!Number.isFinite(min)) min = dataTypeLimit(sample[i], false);
      if (!Number.isFinite(max)) max = dataTypeLimit(sample[i], true);
      const gain = max === min ? 1 : 255 / (max - min);
      return [gain, -min * gain];
    });
  }

  /**
   * Genera la tesela pedida por Cesium.
   *
   * @public
   * @function
   * @param {Number} x Columna.
   * @param {Number} y Fila.
   * @param {Number} level Nivel.
   * @returns {Promise<HTMLCanvasElement>} Tesela.
   * @api
   */
  async requestImage(x, y, level) {
    const rectangle = this.tilingScheme.tileXYToRectangle(x, y, level);
    const west = CesiumMath.toDegrees(rectangle.west);
    const east = CesiumMath.toDegrees(rectangle.east);
    const south = CesiumMath.toDegrees(rectangle.south);
    const north = CesiumMath.toDegrees(rectangle.north);

    // Malla de coordenadas en la proyección del GeoTIFF
    const size = GRID_STEPS + 1;
    const grid = new Float64Array(size * size * 2);
    for (let j = 0; j < size; j += 1) {
      const lat = north - ((north - south) * j) / GRID_STEPS;
      for (let i = 0; i < size; i += 1) {
        const lon = west + ((east - west) * i) / GRID_STEPS;
        const [sx, sy] = this.toSource_([lon, lat]);
        grid[(j * size + i) * 2] = sx;
        grid[(j * size + i) * 2 + 1] = sy;
      }
    }

    const canvas = document.createElement('canvas');
    canvas.width = TILE_SIZE;
    canvas.height = TILE_SIZE;
    const tileWindow = this.getWindow_(grid);
    if (tileWindow === null) return canvas;

    const {
      image, x0, y0, width, height, resX, resY,
    } = tileWindow;
    const pixelWindow = [x0, y0, x0 + width, y0 + height];
    const bands = this.useRGB_
      ? await image.readRGB({ window: pixelWindow, interleave: false })
      : await image.readRasters({ window: pixelWindow, samples: this.samples_ });

    const context = canvas.getContext('2d');
    const output = context.createImageData(TILE_SIZE, TILE_SIZE);
    const [minX, , , maxY] = this.bbox_;
    for (let py = 0; py < TILE_SIZE; py += 1) {
      const v = ((py + 0.5) / TILE_SIZE) * GRID_STEPS;
      const j = Math.min(Math.floor(v), GRID_STEPS - 1);
      const fy = v - j;
      for (let px = 0; px < TILE_SIZE; px += 1) {
        const u = ((px + 0.5) / TILE_SIZE) * GRID_STEPS;
        const i = Math.min(Math.floor(u), GRID_STEPS - 1);
        const fx = u - i;
        const sx = interpolate(grid, size, i, j, fx, fy, 0);
        const sy = interpolate(grid, size, i, j, fx, fy, 1);
        const col = Math.floor((sx - minX) / resX) - x0;
        const row = Math.floor((maxY - sy) / resY) - y0;
        if (col >= 0 && row >= 0 && col < width && row < height) {
          this.writePixel_(output.data, (py * TILE_SIZE + px) * 4, bands, row * width + col);
        }
      }
    }
    context.putImageData(output, 0, 0);
    return canvas;
  }

  /**
   * Elige la vista general con el detalle justo para la tesela y la ventana de
   * píxeles que la cubre.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   *
   * @param {Float64Array} grid Malla de coordenadas de la tesela.
   * @returns {Object|null} Imagen, ventana y resolución, o null si no hay datos.
   */
  getWindow_(grid) {
    let minSX = Infinity;
    let minSY = Infinity;
    let maxSX = -Infinity;
    let maxSY = -Infinity;
    for (let k = 0; k < grid.length; k += 2) {
      if (Number.isFinite(grid[k]) && Number.isFinite(grid[k + 1])) {
        minSX = Math.min(minSX, grid[k]);
        maxSX = Math.max(maxSX, grid[k]);
        minSY = Math.min(minSY, grid[k + 1]);
        maxSY = Math.max(maxSY, grid[k + 1]);
      }
    }
    const [minX, minY, maxX, maxY] = this.bbox_;
    const outside = maxSX <= minX || minSX >= maxX || maxSY <= minY || minSY >= maxY;
    if (!Number.isFinite(minSX) || outside) {
      return null;
    }
    // La vista general menos detallada que aún tiene la resolución de la tesela
    const needed = (maxSX - minSX) / TILE_SIZE;
    const image = this.images_.reduce((best, candidate) => {
      const candidateRes = (maxX - minX) / candidate.getWidth();
      return candidateRes <= needed ? candidate : best;
    }, this.images_[0]);
    const imageWidth = image.getWidth();
    const imageHeight = image.getHeight();
    const resX = (maxX - minX) / imageWidth;
    const resY = (maxY - minY) / imageHeight;
    const x0 = clamp(Math.floor((minSX - minX) / resX), 0, imageWidth);
    const x1 = clamp(Math.ceil((maxSX - minX) / resX), 0, imageWidth);
    const y0 = clamp(Math.floor((maxY - maxSY) / resY), 0, imageHeight);
    const y1 = clamp(Math.ceil((maxY - minSY) / resY), 0, imageHeight);
    if (x1 <= x0 || y1 <= y0) return null;
    return {
      image, x0, y0, width: x1 - x0, height: y1 - y0, resX, resY,
    };
  }

  /**
   * Escribe un píxel RGBA a partir de las bandas leídas: 1 banda gris, 2 gris y
   * alfa, 3 RGB y 4 RGBA (como OL). El valor "nodata" queda transparente.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   *
   * @param {Uint8ClampedArray} data Píxeles de salida.
   * @param {Number} offset Posición del píxel de salida.
   * @param {Array<TypedArray>} bands Bandas leídas.
   * @param {Number} index Posición del píxel en la ventana.
   */
  writePixel_(data, offset, bands, index) {
    const out = data;
    const first = bands[0][index];
    if ((this.nodata_ !== null && first === this.nodata_) || Number.isNaN(first)) return;
    const value = (b) => {
      const raw = bands[b][index];
      if (!this.normalize_) return raw;
      const [gain, bias] = this.scales_[b];
      return gain * raw + bias;
    };
    if (bands.length >= 3) {
      out[offset] = value(0);
      out[offset + 1] = value(1);
      out[offset + 2] = value(2);
      out[offset + 3] = bands.length === 4 ? value(3) : 255;
    } else {
      const gray = value(0);
      out[offset] = gray;
      out[offset + 1] = gray;
      out[offset + 2] = gray;
      out[offset + 3] = bands.length === 2 ? value(1) : 255;
    }
  }

  /**
   * Número de bandas del GeoTIFF.
   *
   * @public
   * @function
   * @returns {Number} Bandas.
   * @api
   */
  getBandCount() {
    return this.images_[0].getSamplesPerPixel();
  }

  /**
   * Metadatos GDAL de una banda.
   *
   * @public
   * @function
   * @param {Number} sample Banda (desde 0).
   * @returns {Object|null} Metadatos.
   * @api
   */
  getGDALMetadata(sample) {
    return this.images_[0].getGDALMetadata(sample);
  }

  /**
   * Libera el GeoTIFF.
   *
   * @public
   * @function
   * @api
   */
  dispose() {
    if (this.tiff && typeof this.tiff.close === 'function') this.tiff.close();
    this.tiff = null;
  }
}

export default GeoTIFFImageryProvider;
