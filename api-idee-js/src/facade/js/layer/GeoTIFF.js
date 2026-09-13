/* eslint-disable no-console */
/**
 * @module IDEE/layer/GeoTIFF
 */
import GeoTIFFImpl from 'impl/layer/GeoTIFF';
import {
  isUndefined, isNullOrEmpty, isObject, isString,
} from '../util/Utils';
import Exception from '../exception/exception';
import LayerBase from './Layer';
import * as parameter from '../parameter/parameter';
import * as LayerType from './Type';
import { getValue } from '../i18n/language';
import * as EventType from '../event/eventtype';
import Style from '../style/Style';
import Raster from '../style/Raster';

/**
 * @classdesc
 * El formato ráster GeoTIFF aprovecha un formato de archivo independiente de plataforma (TIFF)
 * maduro añadiendo los metadatos necesarios para describir y utilizar
 * datos de imágenes geográficas.
 * Estos metadatos sirven para georreferenciar el archivo ráster, por lo que a demás de los datos,
 * el archivo contiene metadatos necesarios para su utilización.
 *
 * @property {String} idLayer Identificador de la capa.
 * @property {String} legend Nombre asociado en el árbol de contenido, si usamos uno.
 * @property {Boolean} transparent (deprecated) 'Falso' si es una capa base,
 * 'verdadero' en caso contrario.
 * @property {Number} minZoom Limitar el zoom mínimo.
 * @property {Number} maxZoom Limitar el zoom máximo.
 * @property {Object} options Capa de opciones GeoTIFF.
 * @property {Array<IDEE.style.Raster>} predefinedStyles Estilos predefinidos para la capa.
 *
 * @api
 * @extends {IDEE.Layer}
 */
class GeoTIFF extends LayerBase {
  /**
   * Constructor principal de la clase. Crea una capa GeoTIFF
   * con parámetros especificados por el usuario.
   * @constructor
   * @param {string|Mx.parameters.GeoTIFF} userParameters Parámetros para la
   * construcción de la capa.
   * - name: nombre de la capa.
   * - url: url del servicio.
   * - blob: url del blob.
   * - projection: SRS usado por la capa.
   * - legend: nombre asociado en el árbol de contenidos, si usamos uno.
   * - isBase: verdadero si es una capa base, falso en caso contrario.
   * - transparent (deprecated): Falso si es una capa base, verdadero en caso contrario.
   * - visibility: Verdadero si la capa es visible, falso si queremos que no lo sea.
   * - normalize: Normalización de los datos.
   * @param {Mx.parameters.LayerOptions} options Estas opciones se mandarán a
   * la implementación de la capa.
   * - visibility: Indica la visibilidad de la capa.
   * - convertToRGB: Convierte la compresion de la imagen a RGB, puede ser 'auto'|true|false,
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
   * - style: Estilo de las bandas
   * (IDEE.style.Raster u objeto con opciones que se envía a vendorOptions).
   * - predefinedStyles: Estilos predefinidos para la capa.
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
   * @api
   */
  constructor(userParameters, options = {}, vendorOptions = {}) {
    if (isUndefined(GeoTIFFImpl) || (isObject(GeoTIFFImpl)
      && isNullOrEmpty(Object.keys(GeoTIFFImpl)))) {
      Exception(getValue('exception').geotiff_method);
    }
    // checks if the param is null or empty
    if (isNullOrEmpty(userParameters)) {
      Exception(getValue('exception').no_param);
    }

    if (isString(userParameters) || !isUndefined(userParameters.transparent)) {
      // eslint-disable-next-line no-console
      console.warn(getValue('exception').transparent_deprecated);
    }

    if (!isNullOrEmpty(options.style)
      && !(options.style instanceof Style) && !(options.style instanceof Raster)) {
    // eslint-disable-next-line no-param-reassign
      vendorOptions.style = options.style;
      // eslint-disable-next-line no-param-reassign
      delete options.style;
    }

    // This Layer is of parameters.
    const parameters = parameter.layer(userParameters, LayerType.GeoTIFF);
    const optionsVar = {
      ...options,
      blob: parameters.blob,
      visibility: parameters.visibility,
      queryable: parameters.queryable,
      displayInLayerSwitcher: parameters.displayInLayerSwitcher,
      projection: parameters.projection,
      maxExtent: userParameters.maxExtent,
      normalize: isUndefined(parameters.normalize) ? options.normalize : parameters.normalize,
    };
    const impl = new GeoTIFFImpl(optionsVar, vendorOptions);
    // calls the super constructor
    super(parameters, impl);
    this.constructorParameters = { userParameters, options, vendorOptions };

    /**
     * GeoTIFF legend: Nombre asociado en el árbol de contenido, si usamos uno.
     */
    this.legend = parameters.legend;

    /**
     * GeoTIFF transparent: Falso si es una capa base, verdadero en caso contrario.
     */
    this.transparent = parameters.transparent;

    /**
     * GeoTIFF minZoom: Limitar el zoom mínimo.
     */
    this.minZoom = options.minZoom || Number.NEGATIVE_INFINITY;

    /**
     * GeoTIFF maxZoom: Limitar el zoom máximo.
     */
    this.maxZoom = options.maxZoom || Number.POSITIVE_INFINITY;

    /**
     * GeoTIFF options: Opciones GeoTIFF.
     */
    this.options = optionsVar;

    /**
     * @private
     * @type {IDEE.style.Raster|null}
     */
    this.style_ = null;

    /**
     * Estilos predefinidos para la capa.
     * @type {Array<IDEE.style.Raster>}
     * @api
     */
    this.predefinedStyles = isUndefined(options.predefinedStyles)
      ? []
      : options.predefinedStyles;

    if (!isNullOrEmpty(options.style)) {
      this.predefinedStyles.unshift(options.style);
      this.setStyle(options.style);
    }
  }

  /**
   * Este método establece el estilo en la capa.
   *
   * @function
   * @public
   * @param {IDEE.style.Raster|Object|String|null} styleParam Estilo ráster o sus opciones.
   * @api
   */
  setStyle(styleParam) {
    if (isNullOrEmpty(styleParam)) {
      this.clearStyle();
      return;
    }
    if (this.getImpl().isLoaded()) {
      this.applyStyle_(styleParam);
    } else {
      this.once(EventType.LOAD, () => {
        this.applyStyle_(styleParam);
      });
    }
  }

  /**
   * Aplica el estilo a la capa.
   *
   * @function
   * @public
   * @param {IDEE.style.Raster|Object|String} styleParam Estilo que se aplicará a la capa.
   * @api
   */
  applyStyle_(styleParam) {
    let style = styleParam;
    if (isString(style)) {
      style = Style.deserialize(style);
    } else if (!(style instanceof Style)) {
      if (!Raster.optionsHaveEffect(style)) {
        this.clearStyle();
        return;
      }
      style = new Raster(style);
    }
    if (style instanceof Style) {
      if (style instanceof Raster && !Raster.optionsHaveEffect(style.getOptions(), true)) {
        this.clearStyle();
        return;
      }
      if (this.style_ === style) {
        style.apply(this);
        this.fire(EventType.CHANGE_STYLE, [style, this]);
        return;
      }
      if (this.style_ instanceof Style) {
        this.style_.unapply(this);
      }
      style.apply(this);
      this.style_ = style;
      this.fire(EventType.CHANGE_STYLE, [style, this]);
    }
  }

  /**
   * Este método devuelve el estilo de la capa.
   *
   * @function
   * @public
   * @returns {IDEE.style.Raster|null} Estilo de la capa.
   * @api
   */
  getStyle() {
    return this.style_;
  }

  /**
   * Elimina el estilo de la capa.
   *
   * @function
   * @public
   * @api
   */
  clearStyle() {
    if (this.style_ instanceof Style) {
      this.style_.unapply(this);
      this.style_ = null;
      this.fire(EventType.CHANGE_STYLE, [null, this]);
    }
  }

  /**
   * Devuelve el legendURL.
   * Si la leyenda no fue definida por el usuario y la capa tiene un estilo Raster,
   * devuelve la imagen del canvas de la rampa.
   *
   * @function
   * @returns {string} URL de la leyenda o imagen base64 del canvas del estilo.
   * @api
   */
  getLegendURL() {
    let legendUrl = this.getImpl().getLegendURL();
    if (legendUrl.indexOf(LayerBase.LEGEND_DEFAULT) !== -1
      && legendUrl.indexOf(LayerBase.LEGEND_ERROR) === -1
      && this.style_ instanceof Raster
      && Raster.hasRamp(this.style_.getOptions(), true)) {
      legendUrl = this.style_.toImage();
    }
    return legendUrl;
  }

  /**
   * Obtiene roles espectrales solo desde COMMON_NAME de metadatos GDAL.
   * Si el GeoTIFF no declara COMMON_NAME, devuelve null.
   * Ejemplo: `{ red: 1, green: 2, blue: 3, nir: 4, swir: 5 }`.
   *
   * @function
   * @public
   * @returns {Promise<Object<string, number>|null>}
   * @api
   */
  getBandRoles() {
    const impl = this.getImpl();
    if (!impl || typeof impl.getBandRoles !== 'function') {
      return Promise.resolve(null);
    }
    return impl.getBandRoles();
  }

  /**
   * Obtiene los valores del ráster en un píxel de pantalla.
   * Delega en la implementación (OpenLayers WebGLTile#getData).
   *
   * @function
   * @public
   * @param {Array<number>} pixel Coordenadas de píxel [x, y] del mapa.
   * @returns {Uint8ClampedArray|Uint8Array|Float32Array|DataView|null}
   * Datos por banda en ese píxel, o null si no hay dato.
   * @api
   */
  getData(pixel) {
    const impl = this.getImpl();
    if (!impl || typeof impl.getData !== 'function') {
      return null;
    }
    return impl.getData(pixel);
  }

  /**
   * Devuelve las opciones de la capa.
   *
   * @function
   * @getter
   * @return {IDEE.layer.GeoTIFF.impl.options} Devuelve las opciones de la
   * implementación.
   * @api
   */
  get options() {
    return this.getImpl().options;
  }

  /**
   * Sobrescribe las opciones de la capa.
   *
   * @function
   * @setter
   * @param {Object} newOptions Nuevas opciones.
   * @api
   */
  set options(newOptions) {
    this.getImpl().options = newOptions;
  }

  /**
   * Devuelve la extensión de la capa.
   * @returns {Array} Devuelve la extensión de la capa.
   */
  getMaxExtent() {
    return this.getImpl().getMaxExtent();
  }

  /**
   * Este método comprueba si un objeto es igual
   * a esta capa.
   *
   * @function
   * @param {Object} obj Objeto a comparar.
   * @returns {Boolean} Valor verdadero es igual, falso no lo es.
   * @api
   */
  equals(obj) {
    let equals = false;
    if (obj instanceof GeoTIFF) {
      equals = (this.url === obj.url);
      equals = equals && (this.name === obj.name);
      equals = equals && (this.legend === obj.legend);
      equals = equals && (this.idLayer === obj.idLayer);
    }

    return equals;
  }
}

export default GeoTIFF;
