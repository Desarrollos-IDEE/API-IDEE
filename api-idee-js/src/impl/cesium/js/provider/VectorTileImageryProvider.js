/**
 * @module IDEE/impl/provider/VectorTileImageryProvider
 */
import { UrlTemplateImageryProvider, WebMercatorTilingScheme } from 'cesium';
import MVTFormat from 'ol/format/MVT';
import RenderFeature from 'ol/render/Feature';

/**
 * Tamaño de las teselas generadas.
 * @const
 * @type {Number}
 */
const TILE_SIZE = 256;

/**
 * Plantilla de atributo de los estilos de IDEE ("{{atributo}}").
 * @const
 * @type {RegExp}
 */
const TEMPLATE = /^\{\{([^}]+)\}\}$/;

/**
 * Orden de pintado: polígonos, después líneas y encima puntos.
 * @const
 * @type {Object}
 */
const KIND_BY_TYPE = {
  Polygon: 'polygon',
  MultiPolygon: 'polygon',
  LineString: 'line',
  MultiLineString: 'line',
  Point: 'point',
  MultiPoint: 'point',
};

/**
 * Objeto mínimo con la interfaz de un objeto geográfico de fachada, para los
 * estilos definidos con funciones.
 *
 * @param {RenderFeature} feature Objeto geográfico de la tesela.
 * @returns {Object} Objeto con getAttribute, getAttributes, getId y getType.
 */
const facadeLike = (feature) => {
  const properties = feature.getProperties();
  return {
    getAttribute: (name) => properties[name],
    getAttributes: () => properties,
    getId: () => feature.getId(),
    getType: () => feature.getType(),
  };
};

/**
 * Valor de una propiedad de estilo: constante, plantilla "{{atributo}}" o función.
 *
 * @param {*} value Valor del estilo.
 * @param {RenderFeature} feature Objeto geográfico.
 * @returns {*} Valor resuelto.
 */
const resolve = (value, feature) => {
  if (typeof value === 'function') return value(facadeLike(feature));
  if (typeof value === 'string' && TEMPLATE.test(value)) {
    return feature.getProperties()[value.replace(TEMPLATE, '$1').trim()];
  }
  return value;
};

/**
 * @classdesc
 * Proveedor de imágenes de Cesium para teselas vectoriales (MVT). Decodifica cada
 * tesela con el formato MVT de OpenLayers y la pinta en un canvas con el estilo
 * genérico de la capa (relleno, trazo y radio de punto). Las teselas se obtienen
 * con la función "getTileData" (servicio XYZ o MBTiles).
 *
 * @api
 * @extends {Cesium.UrlTemplateImageryProvider}
 */
class VectorTileImageryProvider extends UrlTemplateImageryProvider {
  /**
   * Constructor principal de la clase.
   *
   * @constructor
   * @param {Object} options Opciones.
   * @param {Function} options.getTileData (x, y, z) => Promise con los bytes de la
   * tesela XYZ, o null si está vacía.
   * @param {Function} options.getStyle Devuelve las opciones del estilo de la capa.
   * @param {Array<String>} [options.layers] Capas de la tesela que se pintan.
   * @param {Function} [options.onTile] Se llama al terminar cada tesela.
   * @api
   */
  constructor({
    getTileData, getStyle, layers, onTile, ...options
  }) {
    super({
      // La URL no se usa: requestImage obtiene la tesela de getTileData
      url: 'mvt://{z}/{x}/{y}',
      tilingScheme: new WebMercatorTilingScheme(),
      tileWidth: TILE_SIZE,
      tileHeight: TILE_SIZE,
      hasAlphaChannel: true,
      ...options,
    });
    this.getTileData_ = getTileData;
    this.getStyle_ = getStyle;
    this.onTile_ = onTile;
    this.format_ = new MVTFormat({
      featureClass: RenderFeature,
      ...(Array.isArray(layers) && layers.length > 0 ? { layers } : {}),
    });
  }

  /**
   * Genera la tesela pedida por Cesium. Si el servicio falla se rechaza para que
   * Cesium use la tesela del nivel superior.
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
    const canvas = document.createElement('canvas');
    canvas.width = TILE_SIZE;
    canvas.height = TILE_SIZE;
    try {
      const data = await this.getTileData_(x, y, level);
      if (data && data.byteLength > 0) {
        const features = this.format_.readFeatures(data, { extent: [0, 0, TILE_SIZE, TILE_SIZE] });
        this.drawFeatures_(canvas.getContext('2d'), features);
      }
    } finally {
      if (typeof this.onTile_ === 'function') this.onTile_();
    }
    return canvas;
  }

  /**
   * Pinta los objetos geográficos de una tesela.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   *
   * @param {CanvasRenderingContext2D} context Contexto del canvas.
   * @param {Array<RenderFeature>} features Objetos geográficos.
   */
  drawFeatures_(context, features) {
    const styleOptions = this.getStyle_() || {};
    ['polygon', 'line', 'point'].forEach((kind) => {
      const style = styleOptions[kind] || styleOptions;
      features.filter((feature) => KIND_BY_TYPE[feature.getType()] === kind)
        .forEach((feature) => this.drawFeature_(context, feature, kind, style));
    });
  }

  /**
   * Pinta un objeto geográfico. Las coordenadas ya vienen en píxeles de la tesela
   * con el eje Y hacia arriba.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   *
   * @param {CanvasRenderingContext2D} context Contexto del canvas.
   * @param {RenderFeature} feature Objeto geográfico.
   * @param {String} kind 'polygon', 'line' o 'point'.
   * @param {Object} style Opciones de estilo para ese tipo de geometría.
   */
  drawFeature_(context, feature, kind, style) {
    const ctx = context;
    const coordinates = feature.getFlatCoordinates();
    const ends = feature.getEnds();
    const fill = style.fill || {};
    const stroke = style.stroke || {};
    const fillColor = resolve(fill.color, feature);
    const strokeColor = resolve(stroke.color, feature);
    const strokeWidth = Number(resolve(stroke.width, feature)) || 1;
    ctx.save();
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = resolve(stroke.linecap, feature) || 'round';
    ctx.lineJoin = resolve(stroke.linejoin, feature) || 'round';
    const lineDash = resolve(stroke.linedash, feature);
    if (Array.isArray(lineDash)) ctx.setLineDash(lineDash);

    const doFill = () => {
      if (!fillColor) return;
      ctx.fillStyle = fillColor;
      ctx.globalAlpha = Number(resolve(fill.opacity, feature) ?? 1);
      ctx.fill('evenodd');
    };
    const doStroke = () => {
      if (!strokeColor) return;
      ctx.strokeStyle = strokeColor;
      ctx.globalAlpha = Number(resolve(stroke.opacity, feature) ?? 1);
      ctx.stroke();
    };
    const point = (i) => [coordinates[i], TILE_SIZE - coordinates[i + 1]];

    if (kind === 'point') {
      const radius = Number(resolve(style.radius, feature)) || 5;
      for (let i = 0; i < coordinates.length; i += 2) {
        const [px, py] = point(i);
        ctx.beginPath();
        ctx.arc(px, py, radius, 0, 2 * Math.PI);
        doFill();
        doStroke();
      }
    } else {
      ctx.beginPath();
      let start = 0;
      ends.forEach((end) => {
        for (let i = start; i < end; i += 2) {
          const [px, py] = point(i);
          if (i === start) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        if (kind === 'polygon') ctx.closePath();
        start = end;
      });
      if (kind === 'polygon') doFill();
      doStroke();
    }
    ctx.restore();
  }
}

export default VectorTileImageryProvider;
