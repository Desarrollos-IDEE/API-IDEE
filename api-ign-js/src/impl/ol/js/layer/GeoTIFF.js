/* eslint-disable no-underscore-dangle */
/**
 * @module M/impl/layer/GeoTIFF
 */
import {
  isUndefined, isNull, isNullOrEmpty, getResolutionFromScale, extend,
} from 'M/util/Utils';
import * as LayerType from 'M/layer/Type';
import * as EventType from 'M/event/eventtype';
import TileLayer from 'ol/layer/WebGLTile';
import GeoTIFFSource from 'ol/source/GeoTIFF';
import { get as getProj } from 'ol/proj';
import ImplMap from '../Map';
import LayerBase from './Layer';
import ImplUtils from '../util/Utils';

/**
 * @classdesc
 * El formato ráster GeoTIFF aprovecha un formato de archivo independiente de plataforma (TIFF)
 * maduro añadiendo metadatos necesarios para describir y utilizar datos de imágenes geográficas.
 * Estos metadatos sirven para georreferenciar el archivo ráster, por lo que a demás de los datos,
 * el archivo contiene metadatos necesarios para su utilización.
 *
 * @property {Object} options Opciones de la capa GeoTIFF.
* @property {Boolean} visibility Define si la capa es visible o no.
 * @property {Number} minZoom Limitar el zoom mínimo.
 * @property {Number} maxZoom Limitar el zoom máximo.
 * @property {Object} style Opciones de la capa GeoTIFF.
 *
 * @api
 * @extends {M.impl.layer.Layer}
 */
class GeoTIFF extends LayerBase {
  /**
   * Constructor principal de la clase. Crea una capa GeoTIFF
   * con parámetros especificados por el usuario.
   *
   * @constructor
   * @implements {M.impl.Layer}
   * @param {Mx.parameters.LayerOptions} options Parámetros opcionales para la capa.
   * - url: url del servicio.
   * - blob: url del blob.
   * - projection: SRS usado por la capa.
   * - legend: Nombre asociado en el árbol de contenidos, si usamos uno.
   * - transparent: Falso si es una capa base, verdadero en caso contrario.
   * - convertToRGB: Convierte la compresion de la imagen a RGB, puede ser 'auto', true o false,
   *   por defecto 'auto'.
   * - opacity: Opacidad de la capa de 0 a 1, por defecto 1.
   * - bands: Bandas a mostrar en forma de array y como numero, si el array esta vacio muestra todas
   *   por defecto [].
   * - nodata: Usado para sobreescribir el parametro nodata del dato original
   * - minZoom: Zoom mínimo aplicable a la capa.
   * - maxZoom: Zoom máximo aplicable a la capa.
   * - minScale: Escala mínima.
   * - maxScale: Escala máxima.
   * - minResolution: Resolución mínima.
   * - maxResolution: Resolución máxima.
   * - style: Estilo de las bandas.
   * - visibility: Verdadero si la capa es visible, falso si queremos que no lo sea.
   *   En este caso la capa sería detectado por los plugins de tablas de contenidos
   *   y aparecería como no visible.
   * - normalize: Normalización de los datos.
   * @param {Object} vendorOptions Opciones para la biblioteca base. Ejemplo vendorOptions:
   * <pre><code>
   * import OLSourceTileCOG from 'ol/source/TileCOG';
   * {
   *  opacity: 0.1,
   *  source: new OLSourceTileCOG({
   *    attributions: '',
   *    ...
   *  })
   * }
   * </code></pre>
   * @api stable
   */
  constructor(options = {}, vendorOptions = {}) {
    // calls the super constructor
    super(options, vendorOptions);

    /**
     * GeoTIFF facadeLayer_. Instancia de la fachada.
     */
    this.facadeLayer_ = null;

    /**
     * GeoTIFF options. Opciones de la capa.
     */
    this.options = options;

    /**
     * GeoTIFF displayInLayerSwitcher. Mostrar en el selector de capas.
     */
    this.displayInLayerSwitcher_ = true;

    /**
     * GeoTIFF resolutions_. Resoluciones de la capa.
     */
    this.resolutions_ = null;

    /**
     * GeoTIFF extentProj_. Proyección actual.
     */
    this.extentProj_ = null;

    /**
     * GeoTIFF opacity_. Opacidad entre 0 y 1. Por defecto 1.
     */
    this.opacity_ = this.options.opacity || 1;

    /**
     * GeoTIFF visibility. Indica la visibilidad de la capa.
     */
    if (this.options.visibility === false) {
      this.visibility = false;
    }

    /**
     * MBTiles maxExtent: Máxima extensión de la capa.
     */
    this.maxExtent_ = this.options.maxExtent || null;

    /**
     * GeoTIFF animated. Define si la capa está animada,
     * el valor predeterminado es falso.
     */
    if (isNullOrEmpty(this.options.animated)) {
      this.options.animated = false; // by default
    }

    /**
     * GeoTIFF style. Estilo de las bandas.
     */
    this.style = this.options.style || '';

    /**
     * GeoTIFF normalize. Normalización de los datos.
    */
    this.normalize = isUndefined(this.options.normalize) ? true : this.options.normalize;

    this.projection_ = this.options.projection;

    /**
     * GeoTIFF zIndex_. Índice de la capa, (+40).
     */
    this.zIndex_ = ImplMap.Z_INDEX[LayerType.GeoTIFF];

    /**
     * GeoTIFF convertToRGB_. .
     */
    this.convertToRGB_ = !isNullOrEmpty(options.convertToRGB) ? options.convertToRGB : 'auto';

    /**
     * GeoTIFF bands_. Bandas a renderizar.
     */
    this.bands_ = options.bands ? options.bands : [];

    /**
     * GeoTIFF nodata_. Bandas a renderizar.
     */
    this.nodata_ = options.nodata;

    /**
     * GeoTIFF minZoom. Zoom mínimo aplicable a la capa.
     */
    this.minZoom = options.minZoom || Number.NEGATIVE_INFINITY;

    /**
     * GeoTIFF maxZoom. Zoom máximo aplicable a la capa.
     */
    this.maxZoom = options.maxZoom || Number.POSITIVE_INFINITY;

    this.blob = options.blob;
  }

  /**
   * Este método establece la visibilidad de esta capa.
   *
   * @function
   * @param {Boolean} visibility Verdadero es visible, falso si no.
   * @api stable
   */
  setVisible(visibility) {
    this.visibility = visibility;
    // if this layer is base then it hides all base layers
    if ((visibility === true) && (this.transparent !== true)) {
      // hides all base layers
      this.map.getBaseLayers()
        .filter((layer) => !layer.equals(this.facadeLayer_) && layer.isVisible())
        .forEach((layer) => layer.setVisible(false));

      // set this layer visible
      if (!isNullOrEmpty(this.ol3Layer)) {
        this.ol3Layer.setVisible(visibility);
      }

      // updates resolutions and keep the zoom
      const oldZoom = this.map.getZoom();
      this.map.getImpl().updateResolutionsFromBaseLayer();
      if (!isNullOrEmpty(oldZoom)) {
        this.map.setZoom(oldZoom);
      }
    } else if (!isNullOrEmpty(this.ol3Layer)) {
      this.ol3Layer.setVisible(visibility);
    }
  }

  /**
   * Este método agrega la capa al mapa.
   *
   * @public
   * @function
   * @param {M.impl.Map} map Mapa de la implementación.
   * @api stable
   */
  addTo(map, addLayer = true) {
    this.map = map;
    this.addLayerToMap_ = addLayer;
    this.createOLLayer_(null);
    this.fire(EventType.ADDED_TO_MAP);
  }

  /**
   * Este método agrega esta capa como capa única.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   *
   * @public
   * @function
   * @api stable
   */
  createOLLayer_() {
    // calculates the resolutions from scales
    if (!isNull(this.options)
      && !isNull(this.options.minScale) && !isNull(this.options.maxScale)) {
      const units = this.map.getProjection().units;
      this.options.minResolution = getResolutionFromScale(this.options.minScale, units);
      this.options.maxResolution = getResolutionFromScale(this.options.maxScale, units);
    }

    if (this.blob) {
      window.fetch(this.blob).then((response) => {
        response.blob().then((blob) => {
          const source = this.createOLSourceBlob_(blob);
          this.createOLLayerBySource_(source);
        });
      });
    } else {
      const source = this.createOLSource_();
      this.createOLLayerBySource_(source);
    }
  }

  createOLLayerBySource_(source) {
    const zIndex = this.zIndex_;
    const properties = extend({
      opacity: this.opacity_,
      source,
      extent: this.maxExtent_,
      style: this.style,
      minResolution: this.options.minResolution,
      maxResolution: this.options.maxResolution,
    }, this.vendorOptions_, true);
    this.ol3Layer = new TileLayer(properties);

    if (this.addLayerToMap_) {
      this.map.getMapImpl().addLayer(this.ol3Layer);
    }

    this.fire(EventType.ADDED_TO_MAP);

    this.setVisible(this.visibility);

    // sets its z-index
    if (zIndex !== null) {
      this.setZIndex(zIndex);
    }
    // activates animation for base layers or animated parameters
    this.ol3Layer.setMaxZoom(this.maxZoom);
    this.ol3Layer.setMinZoom(this.minZoom);
  }

  /**
   * Este método obtiene la resolución mínima.
   *
   * @public
   * @function
   * @return {Number} Resolución mínima.
   * @api stable
   */
  getMinResolution() {
    return this.options.minResolution;
  }

  /**
   * Este método obtiene la resolución máxima para
   * este GeoTIFF.
   *
   *
   * @public
   * @function
   * @return {Number} Resolución Máxima.
   * @api stable
  */
  getMaxResolution() {
    return this.options.maxResolution;
  }

  /**
   * Este método crea la fuente ol para esta instancia.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @public
   * @function
   * @return {ol.source} Fuente de Openlayers.
   * @api
   */
  createOLSource_() {
    let olSource = this.vendorOptions_.source;
    if (isNullOrEmpty(this.vendorOptions_.source)) {
      const convertToRGB = this.convertToRGB_;
      const bands = this.bands_;
      const nodata = this.nodata_;
      const projectionGeoTIFF = this.options.projection;
      const sources = [
        {
          url: this.url,
          nodata,
        },
      ];
      if (bands.length !== 0) {
        sources.forEach((src) => {
          // eslint-disable-next-line no-param-reassign
          src.bands = bands;
        });
      }
      olSource = new GeoTIFFSource({
        sources,
        convertToRGB,
        projection: projectionGeoTIFF,
        normalize: this.normalize,
      });
    }
    return olSource;
  }

  createOLSourceBlob_(blob) {
    let olSource = this.vendorOptions_.source;
    if (isNullOrEmpty(this.vendorOptions_.source)) {
      const convertToRGB = this.convertToRGB_;
      const bands = this.bands_;
      const nodata = this.nodata_;
      const projectionGeoTIFF = this.options.projection;
      const sources = [
        {
          blob,
          nodata,
        },
      ];
      if (bands.length !== 0) {
        sources.forEach((src) => {
          // eslint-disable-next-line no-param-reassign
          src.bands = bands;
        });
      }
      olSource = new GeoTIFFSource({
        sources,
        convertToRGB,
        projection: projectionGeoTIFF,
        normalize: this.normalize,
      });
    }
    return olSource;
  }

  /**
   * Este método obtiene la extensión.
   *
   * @public
   * @function
   * @returns {Array<Number>} Extensión, asincrono.
   * @api stable
   */
  getMaxExtent() {
    const olProjection = getProj(this.map.getProjection().code);

    const olProperties = this.getOL3Layer().getProperties();
    if (olProperties.source.tileGrid) {
      this.extent_ = olProperties.source.getTileGrid().getExtent();
      this.extentProj_ = olProperties.source.projection.getCode();
      this.extent_ = ImplUtils.transformExtent(this.extent_, this.extentProj_, olProjection);
    } else {
      this.extent_ = olProjection.getExtent();
    }
    return this.extent_;
  }

  /**
   * Sobrescribe la extensión máxima de la capa.
   *
   * @public
   * @function
   * @param {maxExtent} maxExtent Extensión máxima.
   * @api stable
   */
  setMaxExtent(maxExtent) {
    this.getOL3Layer().setExtent(maxExtent);
    if (this.tiled === true) {
      let resolutions = this.map.getResolutions();
      if (isNullOrEmpty(resolutions) && !isNullOrEmpty(this.resolutions_)) {
        resolutions = this.resolutions_;
      }
      // gets the tileGrid
      if (!isNullOrEmpty(resolutions)) {
        const source = this.createOLSource_();
        this.ol3Layer.setSource(source);
      }
    }
  }

  /**
   * Devuelve la URL de la leyenda.
   *
   * @public
   * @function
   * @returns {String} URL de la leyenda.
   * @api stable
   */
  getLegendURL() {
    return this.legendUrl_;
  }

  /**
   * Sobrescribe la leyenda.
   *
   * @public
   * @function
   * @param {String} legendUrl URL de la leyenda.
   * @api stable
   */
  setLegendURL(legendUrl) {
    this.legendUrl_ = legendUrl;
  }

  /**
   * Este método actualiza el estado de este
   * capa.
   *
   * @public
   * @function
   * @api stable
   * @export
   */
  refresh() {
    const ol3Layer = this.getOL3Layer();
    if (!isNullOrEmpty(ol3Layer)) {
      ol3Layer.getSource().refresh();
    }
  }

  /**
   * Este método establece la clase de fachada GeoTIFF.
   * La fachada se refiere a
   * un patrón estructural como una capa de abstracción con un patrón de diseño.
   *
   * @function
   * @param {object} obj GeoTIFF de la fachada.
   * @api stable
   */
  setFacadeObj(obj) {
    this.facadeLayer_ = obj;
  }

  /**
   * Este método destruye esta capa, limpiando el HTML
   * y anulando el registro de todos los eventos.
   *
   * @public
   * @function
   * @api stable
   */
  destroy() {
    const olMap = this.map.getMapImpl();
    if (!isNullOrEmpty(this.ol3Layer)) {
      olMap.removeLayer(this.ol3Layer);
      this.ol3Layer = null;
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
   * @api stable
   */
  equals(obj) {
    let equals = false;
    if (obj instanceof GeoTIFF) {
      equals = (this.url === obj.url);
      equals = equals && (this.name === obj.name);
      equals = equals && (this.version === obj.version);
    }

    return equals;
  }
}

export default GeoTIFF;
