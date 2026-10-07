/**
 * @module IDEE/impl/layer/XYZ
 */
import {
  isNullOrEmpty, extend, getZDirectionFunction,
} from 'IDEE/util/Utils';
import OLTileLayer from 'ol/layer/Tile';
import { get as getProj, transform } from 'ol/proj';
import XYZSource from 'ol/source/XYZ';
import * as LayerType from '../../../../facade/js/layer/Type';
import Layer from './Layer';
import ImplMap from '../Map';

/**
 * Zoom mínimo por defecto para consultar elevación Terrain-RGB.
 * @constant
 * @type {number}
 */
const ELEVATION_QUERY_MIN_ZOOM = 15;

/**
 * @classdesc
 * Las capas XYZ son servicios de información geográfica en forma de mosaicos.
 * Cada mosaico representa una combinación de tres parámetros.
 * Las capas XYZ tienen la siguiente estructura.
 *
 * https://URL/{z}/{x}/{y}.jpg
 *
 * Donde {z} especifica el nivel de zoom, {x} el número de columna y {y} el número de fila.
 *
 * @property {String} url Url del servicio XYZ.
 * @property {Boolean} visibility Define si la capa es visible o no.
 * @property {Number} minZoom Limitar el zoom mínimo.
 * @property {Number} maxZoom Limitar el zoom máximo.
 * @property {Number} tileGridMaxZoom Zoom máximo de la tesela en forma de rejilla.
 * @property {Boolean} displayInLayerSwitcher Mostrar en el selector de capas.
 *
 * @api
 * @extends {IDEE.impl.layer.Vector}
 */
class XYZ extends Layer {
  /**
   * Constructor principal de la clase. Crea una capa XYZ
   * con parámetros especificados por el usuario.
   *
   * @constructor
   * @param {Mx.parameters.XYZ} userParameters Parámetros para la construcción de la capa.
   * - attribution: Atribución de la capa.
   * - name: Nombre de la capa.
   * - isBase: Indica si la capa es base.
   * - transparent (deprecated): Falso si es una capa base, verdadero en caso contrario.
   * - maxExtent: La medida en que restringe la visualización a una región específica.
   * - legend: Nombre asociado en el árbol de contenidos, si usamos uno.
   * - visibility: Indica si la capa estará por defecto visible o no.
   * - displayInLayerSwitcher: Indica si la capa se muestra en el selector de capas.
   * - url: URL del servicio XYZ.
   * - type: Tipo de la capa.
   * - tileGridMaxZoom: Zoom máximo de cuadrícula de mosaico.
   * - tileSize: Tamaño de la tesela
   * @param {Mx.parameters.LayerOptions} options Parámetros opcionales para la capa.
   * - displayInLayerSwitcher: Indica si la capa se muestra en el selector de capas.
   * - opacity: Opacidad de capa, por defecto 1.
   * - minZoom: Zoom mínimo aplicable a la capa.
   * - maxZoom: Zoom máximo aplicable a la capa.
   * - minScale: Escala mínima.
   * - maxScale: Escala máxima.
   * - crossOrigin: Atributo crossOrigin para las imágenes cargadas.
   * @param {Object} vendorOptions Opciones para la biblioteca base. Ejemplo vendorOptions:
   * <pre><code>
   * import XYZSource from 'ol/source/XYZ';
   * {
   *  opacity: 0.1,
   *  source: new XYZSource({
   *    attributions: 'xyz',
   *    ...
   *  })
   * }
   * </code></pre>
   * @api stable
   */
  constructor(userParameters, options = {}, vendorOptions = {}) {
    super(options, vendorOptions);

    /**
     * XYZ url.
     * La URL de origen de la capa xyz.
     */
    this.url = userParameters.url;

    /**
     * XYZ tileSize_.
     * Tamaño de la tesela, por defecto 256.
     */
    this.tileSize_ = typeof userParameters.tileSize === 'number' ? userParameters.tileSize : 256;

    /**
     * XYZ opacity_.
     * Opacidad de la capa.
     */
    this.opacity_ = typeof options.opacity === 'number' ? options.opacity : 1;

    /**
     * XYZ zIndex_.
     * zIndex de la capa.
     */
    this.zIndex_ = ImplMap.Z_INDEX[LayerType.XYZ];

    /**
     * XYZ visibility.
     * Define si la capa es visible o no.
     */
    this.visibility = userParameters.visibility === false ? userParameters.visibility : true;

    /**
     * XYZ minZoom.
     * Zoom mínimo aplicable a la capa.
     */
    this.minZoom = options.minZoom || Number.NEGATIVE_INFINITY;

    /**
     * XYZ maxZoom.
     * Zoom máximo aplicable a la capa.
     */
    this.maxZoom = options.maxZoom || Number.POSITIVE_INFINITY;

    /**
     * XYZ tileGridMaxZoom.
     * Zoom máximo de la tesela en forma de rejilla.
     */
    this.tileGridMaxZoom = userParameters.tileGridMaxZoom;

    /**
     * XYZ zDirection.
     * Función de dirección Z para la carga de teselas.
     */
    this.zDirection = vendorOptions?.zDirection || getZDirectionFunction();

    /**
     * XYZ displayInLayerSwitcher:
     * Mostrar en el selector de capas.
     */
    this.displayInLayerSwitcher = userParameters.displayInLayerSwitcher !== false;

    /**
     * CrossOrigin: Atributo crossOrigin para las imágenes cargadas.
     */
    this.crossOrigin = (options.crossOrigin === null || options.crossOrigin === false) ? undefined : 'anonymous';
  }

  /**
   * Este método establece la visibilidad de esta capa.
   *
   * @public
   * @function
   * @param {Boolean} visibility Verdadero es visible, falso si no.
   * @api
   */
  setVisible(visibility) {
    this.visibility = visibility;
    // if this layer is base then it hides all base layers
    if ((visibility === true) && (this.isBase !== false)) {
      // set this layer visible
      if (!isNullOrEmpty(this.olLayer)) {
        this.olLayer.setVisible(visibility);
      }

      this.map.getImpl().updateResolutionsFromBaseLayer();
    } else if (!isNullOrEmpty(this.olLayer)) {
      this.olLayer.setVisible(visibility);
    }
  }

  /**
   * Este método añade la capa al mapa de la implementación.
   *
   * @public
   * @function
   * @param {IDEE.impl.Map} map Mapa de la implementación.
   * @api
   */
  addTo(map, addLayer = true) {
    this.map = map;
    const projection = getProj('EPSG:3857');
    const extent = projection.getExtent();
    this.olLayer = new OLTileLayer(extend({
      visible: this.visibility,
      opacity: this.opacity_,
      zIndex: this.zIndex_,
      extent: this.userMaxExtent || extent,
    }, this.vendorOptions_, true));

    if (!isNullOrEmpty(this.options.minScale)) this.setMinScale(this.options.minScale);
    if (!isNullOrEmpty(this.options.maxScale)) this.setMaxScale(this.options.maxScale);

    if (addLayer) {
      this.map.getMapImpl().addLayer(this.olLayer);
    }
    let source = this.vendorOptions_.source;
    if (isNullOrEmpty(source)) {
      source = new XYZSource({
        projection,
        url: this.url,
        tileSize: this.getTileSize(),
        crossOrigin: this.crossOrigin,
        zDirection: this.zDirection,
        interpolate: false,
      });
    }
    this.olLayer.setSource(source);
    if (this.tileGridMaxZoom !== undefined && this.tileGridMaxZoom > 0) {
      this.olLayer.getSource().tileGrid.maxZoom = this.tileGridMaxZoom;
    } else {
      this.olLayer.setMaxZoom(this.maxZoom);
      this.olLayer.setMinZoom(this.minZoom);
    }
  }

  /**
   * Este método modifica la url de la tesela.
   *
   * @public
   * @function
   * @param {String} tileUrlFunction Nueva URL tesela.
   * @api
   */
  setTileUrlFunction(tileUrlFunction) {
    this.olLayer.getSource().setTileUrlFunction(tileUrlFunction);
  }

  /**
   * Este método devuelve la url de la tesela actual.
   *
   * @public
   * @function
   * @returns {IDEE.layer.XYZ.impl.ol3Layer.getSource.getTileUrlFunction} URL tesela.
   * @api
   */
  getTileUrlFunction() {
    this.olLayer.getSource().getTileUrlFunction();
  }

  /**
   * Este método devuelve el tamaño de la tesela de la capa.
   *
   * @public
   * @function
   * @return {IDEE.layer.XYZ.impl.tileSize_}  Tamaño de la tesela.
   * @api
   */
  getTileSize() {
    return this.tileSize_;
  }

  /**
   * Este método destruye esta capa, limpiando el HTML
   * y anulando el registro de todos los eventos.
   *
   * @public
   * @function
   * @api
   */
  destroy() {
    const olMap = this.map.getMapImpl();
    if (!isNullOrEmpty(this.olLayer)) {
      olMap.removeLayer(this.olLayer);
      this.olLayer = null;
    }
    this.map = null;
  }

  /**
   * Este método comprueba si un objeto es igual
   * a esta capa.
   *
   * @function
   * @param {Object} obj Objeto a comparar.
   * @returns {Boolean} Verdadero es igual, falso si no.
   * @api
   */
  equals(obj) {
    let equals = false;
    if (obj instanceof XYZ) {
      equals = (this.name === obj.name);
    }
    return equals;
  }

  /**
   * Índice y de tesela como en la petición HTTP ({y} o {-y} en la plantilla URL).
   *
   * @private
   * @function
   * @param {number} tileCoordRow Componente y de tileCoord [z, x, y].
   * @param {number} z Nivel de zoom de la tesela.
   * @returns {number} Valor y sustituido en la URL.
   */
  getTileYForUrlTemplate_(tileCoordRow, z) {
    if (!isNullOrEmpty(this.url) && this.url.indexOf('{-y}') >= 0) {
      if (tileCoordRow < 0) {
        return (-tileCoordRow) - 1;
      }
      // Hay que invertir la fila respecto al zoom
      return ((1 << z) - 1) - tileCoordRow;
    }
    return tileCoordRow;
  }

  /**
   * Obtiene z/x/y de tesela como en la URL ({y} o {-y} según la plantilla).
   *
   * @public
   * @function
   * @param {Array<number>} coordinate Coordenadas en la proyección del mapa.
   * @param {number} [zoom] Nivel de zoom de tesela; si se omite, el de la vista.
   * @returns {{z: number, x: number, y: number}|null} Índice z/x/y o null.
   * @api
   */
  getTileIndexAtCoordinate(coordinate, zoom) {
    const context = this.getTileQueryContext_(coordinate);
    if (isNullOrEmpty(context)) {
      return null;
    }
    let z = zoom;
    if (z === undefined || z === null) {
      z = context.mapZoom;
    }
    const tileCoord = context.tileGrid.getTileCoordForCoordAndZ(context.coord, z);
    if (isNullOrEmpty(tileCoord)) {
      return null;
    }
    return {
      z: tileCoord[0],
      x: tileCoord[1],
      y: this.getTileYForUrlTemplate_(tileCoord[2], tileCoord[0]),
    };
  }

  /**
   * Contexto de proyección/teselas para una coordenada del mapa.
   *
   * @private
   * @function
   * @param {Array<number>} coordinate Coordenadas en la proyección del mapa.
   * @returns {Object|null} Contexto o null si no está disponible.
   */
  getTileQueryContext_(coordinate) {
    if (isNullOrEmpty(this.olLayer) || isNullOrEmpty(this.map)) {
      return null;
    }
    const olMap = this.map.getMapImpl();
    const view = olMap.getView();
    const source = this.olLayer.getSource();
    if (isNullOrEmpty(source)) {
      return null;
    }
    const tileGrid = source.getTileGrid();
    if (isNullOrEmpty(tileGrid)) {
      return null;
    }
    const resolution = view.getResolution();
    if (isNullOrEmpty(resolution)) {
      return null;
    }
    const viewProj = view.getProjection();
    const sourceProj = source.getProjection() || viewProj;
    let coord = coordinate;
    if (viewProj.getCode() !== sourceProj.getCode()) {
      coord = transform(coordinate, viewProj, sourceProj);
    }
    const mapZoom = tileGrid.getZForResolution(resolution, this.zDirection);
    return {
      source,
      tileGrid,
      sourceProj,
      coord,
      mapZoom,
    };
  }

  /**
   * Obtiene los componentes de color del píxel renderizado de la capa.
   *
   * @public
   * @function
   * @param {Array<number>} pixel Coordenadas de píxel [x, y] del mapa.
   * @returns {Uint8ClampedArray|Uint8Array|Float32Array|DataView|null} Datos del píxel.
   * @api
   */
  getData(pixel) {
    if (!this.olLayer || typeof this.olLayer.getData !== 'function') {
      return null;
    }
    return this.olLayer.getData(pixel);
  }

  /**
   * Índice de tesela y color de píxel para GetFeatureInfo con elevación.
   * Si el zoom de la vista es menor que el mínimo de consulta, lee la tesela
   * a ese zoom (p. ej. 15); si no, usa el píxel renderizado del mapa.
   *
   * @public
   * @function
   * @param {Array<number>} coordinate Coordenadas del clic.
   * @param {Array<number>} mapPixel Coordenadas de píxel [x, y] del mapa.
   * @param {number} [minQueryZoom] Zoom mínimo de tesela para la consulta.
   * @returns {Promise<{tileIndex: Object|null, data: Uint8ClampedArray|null}|null>}
   * @api
   */
  async getFeatureInfoPixelData(coordinate, mapPixel, minQueryZoom) {
    const context = this.getTileQueryContext_(coordinate);
    if (isNullOrEmpty(context)) {
      return null;
    }
    const maxZoom = context.tileGrid.getMaxZoom();
    const queryZoom = this.resolveElevationQueryZoom_(
      context.mapZoom,
      maxZoom,
      minQueryZoom,
    );
    if (queryZoom === context.mapZoom) {
      return {
        tileIndex: this.getTileIndexAtCoordinate(coordinate),
        data: this.getData(mapPixel),
      };
    }
    return this.sampleTilePixelAtCoordinate_(coordinate, queryZoom, context);
  }

  /**
   * Resuelve el zoom de tesela para consultar elevación.
   * Si el zoom del mapa es menor que el mínimo, usa el mínimo; nunca supera maxZoom.
   *
   * @private
   * @function
   * @param {number} mapZoom Zoom de tesela de la vista.
   * @param {number} maxZoom Zoom máximo de la cuadrícula.
   * @param {number} [minQueryZoom] Zoom mínimo de consulta.
   * @returns {number} Zoom de tesela a usar.
   */
  resolveElevationQueryZoom_(mapZoom, maxZoom, minQueryZoom) {
    let minZoom = ELEVATION_QUERY_MIN_ZOOM;
    if (typeof minQueryZoom === 'number' && !Number.isNaN(minQueryZoom)) {
      minZoom = minQueryZoom;
    }
    let queryZoom = mapZoom;
    if (mapZoom < minZoom) {
      queryZoom = minZoom;
    }
    if (queryZoom > maxZoom) {
      queryZoom = maxZoom;
    }
    return queryZoom;
  }

  /**
   * Carga una imagen de tesela por URL.
   *
   * @private
   * @function
   * @param {string} url URL de la tesela.
   * @returns {Promise<HTMLImageElement|null>} Imagen o null si falla.
   */
  loadTileImage_(url) {
    return new Promise((resolve) => {
      if (isNullOrEmpty(url)) {
        resolve(null);
        return;
      }
      const img = new Image();
      if (!isNullOrEmpty(this.crossOrigin)) {
        img.crossOrigin = this.crossOrigin;
      }
      img.onload = () => {
        resolve(img);
      };
      img.onerror = () => {
        resolve(null);
      };
      img.src = url;
    });
  }

  /**
   * Muestrea el RGBA del píxel de una tesela concreta en una coordenada.
   *
   * @private
   * @function
   * @param {Array<number>} coordinate Coordenadas del mapa.
   * @param {number} queryZoom Zoom de tesela a consultar.
   * @param {Object} context Contexto de getTileQueryContext_.
   * @returns {Promise<{tileIndex: Object|null, data: Uint8ClampedArray|null}>}
   */
  async sampleTilePixelAtCoordinate_(coordinate, queryZoom, context) {
    const tileIndex = this.getTileIndexAtCoordinate(coordinate, queryZoom);
    const tileCoord = context.tileGrid.getTileCoordForCoordAndZ(context.coord, queryZoom);
    if (isNullOrEmpty(tileCoord)) {
      return {
        tileIndex,
        data: null,
      };
    }
    const tileUrlFunction = context.source.getTileUrlFunction();
    if (typeof tileUrlFunction !== 'function') {
      return {
        tileIndex,
        data: null,
      };
    }
    const url = tileUrlFunction.call(context.source, tileCoord, 1, context.sourceProj);
    const img = await this.loadTileImage_(url);
    if (isNullOrEmpty(img)) {
      return {
        tileIndex,
        data: null,
      };
    }
    const extent = context.tileGrid.getTileCoordExtent(tileCoord);
    const imgWidth = img.naturalWidth || img.width;
    const imgHeight = img.naturalHeight || img.height;
    if (imgWidth <= 0 || imgHeight <= 0) {
      return {
        tileIndex,
        data: null,
      };
    }
    const extentWidth = extent[2] - extent[0];
    const extentHeight = extent[3] - extent[1];
    // Dónde cae el clic dentro de esa tesela
    let px = Math.floor(((context.coord[0] - extent[0]) / extentWidth) * imgWidth);
    let py = Math.floor(((extent[3] - context.coord[1]) / extentHeight) * imgHeight);
    if (px < 0) {
      px = 0;
    }
    if (py < 0) {
      py = 0;
    }
    if (px >= imgWidth) {
      px = imgWidth - 1;
    }
    if (py >= imgHeight) {
      py = imgHeight - 1;
    }
    const canvas = document.createElement('canvas');
    canvas.width = imgWidth;
    canvas.height = imgHeight;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (isNullOrEmpty(ctx)) {
      return {
        tileIndex,
        data: null,
      };
    }
    ctx.drawImage(img, 0, 0);
    const imageData = ctx.getImageData(px, py, 1, 1);
    return {
      tileIndex,
      data: imageData.data,
    };
  }
}
export default XYZ;
