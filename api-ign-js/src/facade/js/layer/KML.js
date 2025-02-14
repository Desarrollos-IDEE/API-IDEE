/**
 * @module M/layer/KML
 */
import KMLImpl from 'impl/layer/KML';
import LayerVector from './Vector';
import {
  isUndefined, isNullOrEmpty, isString, normalize,
} from '../util/Utils';
import Exception from '../exception/exception';
import * as LayerType from './Type';
import * as parameter from '../parameter/parameter';
import { getValue } from '../i18n/language';

/**
 * @classdesc
 * KML (Keyhole Markup Language).
 *
 * @property {Boolean} extract Opcional. Activa la consulta haciendo clic en el objeto geográfico,
 * por defecto falso.
 * @property {Object} options Parámetros de la capa.
 * @property {String} label Etiqueta de la capa.
 *
 * @api
 * @extends {M.layer.Vector}
 */
class KML extends LayerVector {
  /**
   * Constructor principal de la clase. Crea una capa KML
   * con parámetros especificados por el usuario.
   *
   * @constructor
   * @param {string|Mx.parameters.KML} userParameters Parámetros especificados por el usuario.
   * - url: Url del fichero o servicio -> https://www.ign.es/web/resources/delegaciones/delegacionesIGN.kml
   * - name: Nombre de la capa que aparecerá en la leyenda -> Delegaciones IGN
   * - extract: Opcional, activa la consulta por click en el objeto geográfico, por defecto falso.
   * - type: Tipo de la capa.
   * - maxExtent: La medida en que restringe la visualización a una región específica.
   * - legend: Indica el nombre que queremos que aparezca en el árbol de contenidos, si lo hay.
   * - label: Define si se muestra la etiqueta o no. Por defecto mostrará la etiqueta.
   * - layers: Permite filtrar el fichero KML por nombre de carpetas.
   * - removeFolderChildren: Permite no mostrar las
   * carpetas descendientes de las carpetas filtradas. Por defecto: true.
   * @param {Mx.parameters.LayerOptions} options Parámetros que se pasarán a la implementación.
   * - visibility: Define si la capa es visible o no.
   * - style: Define el estilo de la capa.
   * - minZoom. Zoom mínimo aplicable a la capa.
   * - maxZoom. Zoom máximo aplicable a la capa.
   * - displayInLayerSwitcher. Indica si la capa se muestra en el selector de capas.
   * - opacity. Opacidad de capa, por defecto 1.
   * - scaleLabel. Escala de la etiqueta.
   * - extractStyles: Extraer estilos del KML.Por defecto es verdadero.
   * - predefinedStyles: Estilos predefinidos para la capa.
   * @param {Object} vendorOptions Opciones para la biblioteca base. Ejemplo vendorOptions:
   * <pre><code>
   * import OLSourceVector from 'ol/source/Vector';
   * {
   *  opacity: 0.1,
   *  source: new OLSourceVector({
   *    attributions: 'kml',
   *    ...
   *  })
   * }
   * </code></pre>
   * @api
   */
  constructor(userParameters = {}, options = {}, vendorOptions = {}) {
    const parameters = parameter.layer(userParameters, LayerType.KML);
    const optionsVar = options;

    optionsVar.label = parameters.label;
    optionsVar.visibility = parameters.visibility;
    optionsVar.layers = userParameters.layers || undefined;
    optionsVar.removeFolderChildren = isUndefined(userParameters.removeFolderChildren)
      ? true
      : userParameters.removeFolderChildren;

    if (typeof userParameters !== 'string') {
      optionsVar.maxExtent = userParameters.maxExtent;
    }

    /**
     * Implementación de la capa.
     * @public
     * @implements {M.layer.KML}
     * @type {M.layer.KML}
     */
    const impl = new KMLImpl(optionsVar, vendorOptions);

    // calls the super constructor
    super(parameters, options, undefined, impl);

    // checks if the implementation can create KML layers
    if (isUndefined(KMLImpl)) {
      Exception(getValue('exception').kmllayer_method);
    }

    // checks if the param is null or empty
    if (isNullOrEmpty(userParameters)) {
      Exception(getValue('exception').no_param);
    }

    /**
     * KML extract: Activa la consulta al hacer clic sobre un objeto geográfico,
     * por defecto falso.
     */
    this.extract = parameters.extract === undefined ? false : parameters.extract;

    /**
     * KML options: Optiones que se mandan a la implementación.
     */
    this.options = options;

    /**
     * KML label. Etiqueta de la capa KML.
     */
    this.label = parameters.label;

    /**
     * KML layers: Permite filtrar el fichero KML por nombre de carpetas.
     * @type {Array<String>}
     */
    this.layers = optionsVar.layers;

    /**
     * KML minZoom: Límite del zoom mínimo.
     * @public
     * @type {Number}
     */
    this.minZoom = optionsVar.minZoom || Number.NEGATIVE_INFINITY;

    /**
     * KML maxZoom: Límite del zoom máximo.
     * @public
     * @type {Number}
     */
    this.maxZoom = optionsVar.maxZoom || Number.POSITIVE_INFINITY;

    /**
     * KML removeFolderChildren: Permite no mostrar las
     * carpetas descendientes de las carpetas filtradas.
     * @type {Array<String>}
     */
    this.removeFolderChildren = optionsVar.removeFolderChildren;
  }

  /**
   * Devuelve el valor de la propiedad "extract". La propiedad "extract" tiene la
   * siguiente función: Activa la consulta al hacer clic en la característica, por defecto falso.
   *
   * @function
   * @getter
   * @returns {M.LayerType.KML} Valor de la propiedad "extract".
   * @api
   */
  get extract() {
    return this.getImpl().extract;
  }

  /**
   * Sobrescribe el valor de la propiedad "extract". La propiedad "extract" tiene la
   * siguiente función: Activa la consulta al hacer clic en la característica, por defecto falso.
   *
   * @function
   * @setter
   * @param {Boolean} newExtract Nuevo valor para sobreescribir la propiedad "extract".
   * @api
   */
  set extract(newExtract) {
    if (!isNullOrEmpty(newExtract)) {
      if (isString(newExtract)) {
        this.getImpl().extract = (normalize(newExtract) === 'true');
      } else {
        this.getImpl().extract = newExtract;
      }
    } else {
      this.getImpl().extract = false;
    }
  }

  /**
   * Devuelve las opciones que se mandan a la implementación.
   * @function
   * @getter
   * @returns {M.layer.KML.impl.options} Opciones de la capa KML.
   * @api
   */
  get options() {
    return this.getImpl().options;
  }

  /**
   * Sobrescribe las opciones de la capa KML.
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

    if (obj instanceof KML) {
      equals = (this.url === obj.url);
      equals = equals && (this.name === obj.name);
      equals = equals && (this.extract === obj.extract);
      equals = equals && (this.predefinedStyles === obj.predefinedStyles);
    }

    return equals;
  }
}

export default KML;
