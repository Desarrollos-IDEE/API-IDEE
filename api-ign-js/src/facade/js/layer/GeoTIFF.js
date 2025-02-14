/* eslint-disable no-console */
/**
 * @module M/layer/GeoTIFF
 */
import GeoTIFFImpl from 'impl/layer/GeoTIFF';
import {
  isUndefined, isNullOrEmpty,
} from '../util/Utils';
import Exception from '../exception/exception';
import LayerBase from './Layer';
import * as parameter from '../parameter/parameter';
import * as LayerType from './Type';
import { getValue } from '../i18n/language';

/**
 * @classdesc
 * El formato ráster GeoTIFF aprovecha un formato de archivo independiente de plataforma (TIFF)
 * maduro añadiendo los metadatos necesarios para describir y utilizar
 * datos de imágenes geográficas.
 * Estos metadatos sirven para georreferenciar el archivo ráster, por lo que a demás de los datos,
 * el archivo contiene metadatos necesarios para su utilización.
 *
 * @property {String} legend Nombre asociado en el árbol de contenido, si usamos uno.
 * @property {Boolean} transparent 'Falso' si es una capa base, 'verdadero' en caso contrario.
 * @property {Number} minZoom Limitar el zoom mínimo.
 * @property {Number} maxZoom Limitar el zoom máximo.
 * @property {Object} options Capa de opciones GeoTIFF.
 *
 * @api
 * @extends {M.Layer}
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
   * - style: Estilo de las bandas.
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
    if (isUndefined(GeoTIFFImpl)) {
      Exception(getValue('exception').geotiff_method);
    }
    // checks if the param is null or empty
    if (isNullOrEmpty(userParameters)) {
      Exception(getValue('exception').no_param);
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
      normalize: parameters.normalize,
    };
    const impl = new GeoTIFFImpl(optionsVar, vendorOptions);
    // calls the super constructor
    super(parameters, impl);

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
  }

  /**
   * Devuelve el tipo de layer, GeoTIFF.
   *
   * @function
   * @getter
   * @returns {String} Tipo GeoTIFF.
   * @api
   */
  get type() {
    return LayerType.GeoTIFF;
  }

  /**
   * Sobrescribe el tipo de capa.
   *
   * @function
   * @setter
   * @param {String} newType Nuevo tipo.
   * @api
   */
  set type(newType) {
    if (!isUndefined(newType)
      && !isNullOrEmpty(newType) && (newType !== LayerType.GeoTIFF)) {
      Exception('El tipo de capa debe ser \''.concat(LayerType.GeoTIFF).concat('\' pero se ha especificado \'').concat(newType).concat('\''));
    }
  }

  /**
   * Devuelve las opciones de la capa.
   *
   * @function
   * @getter
   * @return {M.layer.GeoTIFF.impl.options} Devuelve las opciones de la
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
    }

    return equals;
  }
}

export default GeoTIFF;
