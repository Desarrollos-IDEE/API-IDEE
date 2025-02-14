/**
 * @module M/layer/GeoJSON
 */
import GeoJSONImpl from 'impl/layer/GeoJSON';
import LayerVector from './Vector';
import { GeoJSON as GeoJSONType } from './Type';
import {
  isUndefined, isArray, isNullOrEmpty, isString, normalize,
} from '../util/Utils';
import Exception from '../exception/exception';
import { getValue } from '../i18n/language';

/**
 * @classdesc
 * GeoJSON, a pesar de no ser un estándar OGC (está en camino de convertirse en uno),
 * es un formato de intercambio de información geográfica muy extendido que, al igual que WFS,
 * permite que todos los elementos estén en el cliente.
 *
 * @property {String} url Url del archivo o servicio que genera el GeoJSON.
 * @property {String} name Nombre de la capa, identificador.
 * @property {Object} source Fuente GeoJSON.
 * @property {Boolean} extract Activa la consulta al hacer clic sobre un objeto geográfico,
 * por defecto falso.
 * @property {Object} options Opciones GeoJSON.
 * @param {Object} vendorOptions Opciones para la biblioteca base. Ejemplo vendorOptions:
 * <pre><code>
 * import OLSourceVector from 'ol/source/Vector';
 * {
 *  opacity: 0.1,
 *  source: new OLSourceVector({
 *    attributions: 'geojson',
 *    ...
 *  })
 * }
 * </code></pre>
 * @api
 * @extends {M.layer.Vector}
 */
class GeoJSON extends LayerVector {
  /**
   * Constructor principal de la clase. Crea una capa GeoJSON
   * con parámetros especificados por el usuario.
   *
   * @constructor
   * @param {String|Mx.parameters.GeoJSON} parameters Parámetros para la construcción de la capa,
   * estos parámetros los proporciona el usuario.
   * - name: Nombre de la capa en la leyenda.
   * - url: Url del fichero o servicio que genera el GeoJSON.
   * - extract: Opcional, activa la consulta por click en el objeto geográfico, por defecto falso.
   * - source: Fuente de la capa.
   * - type: Tipo de la capa.
   * - maxExtent: La medida en que restringe la visualización a una región específica.
   * - legend: Indica el nombre que queremos que aparezca en el árbol de contenidos, si lo hay.
   * @param {Mx.parameters.LayerOptions} options Estas opciones se mandarán a la implementación.
   * - hide: Atributos ocultos.
   * - show: Mostrar atributos.
   * - minZoom: Zoom mínimo aplicable a la capa.
   * - maxZoom: Zoom máximo aplicable a la capa.
   * - visibility: Define si la capa es visible o no. Verdadero por defecto.
   * - displayInLayerSwitcher: Indica si la capa se muestra en el selector de capas.
   * - opacity: Opacidad de capa, por defecto 1.
   * - style: Define el estilo de la capa.
   * - predefinedStyles: Estilos predefinidos para la capa.
   * @api
   */
  constructor(parameters = {}, options = {}, vendorOptions = {}) {
    const optionsVar = options;

    if (typeof parameters !== 'string') {
      optionsVar.maxExtent = parameters.maxExtent;
    }

    /**
     * Implementación
     * @public
     * @implements {M.impl.layer.GeoJSON}
     * @type {M.impl.layer.GeoJSON}
     */
    const impl = new GeoJSONImpl(parameters, optionsVar, vendorOptions);

    const opts = parameters;
    opts.type = GeoJSONType;

    // Llama al contructor del que se extiende la clase
    super(opts, optionsVar, undefined, impl);

    // Comprueba si la implementación puede crear capas GeoJSON
    if (isUndefined(GeoJSONImpl)) {
      Exception(getValue('exception').geojsonlayer_method);
    }

    // Comprueba si los parámetros son null or empty
    if (isNullOrEmpty(parameters)) {
      Exception(getValue('exception').no_param);
    }

    if (isString(parameters)) {
      this.url = parameters;
    } else if (isArray(parameters)) {
      this.source = parameters;
    } else {
      /**
       * GeoJSON url: Url del archivo o servicio que genera el GeoJSON.
       */
      this.url = parameters.url;

      /**
       * GeoJSON name: Nombre de la capa.
       */
      this.name = parameters.name;

      /**
       * GeoJSON Fuente de la capa.
       */
      this.source = parameters.source;
      if (isString(this.source)) {
        this.source = this.deserialize(this.source);
      }

      /**
       * GeoJSON extract: Opcional, activa la consulta
       * haciendo clic en el objeto geográfico, por defecto falso.
       */
      this.extract = parameters.extract === undefined ? false : parameters.extract;

      /**
       * GeoJSON crs: Sistema de Referencia de Coordenadas.
       * @public
       * @type {Object}
       * @api
       */
      if (!isNullOrEmpty(parameters.crs)) {
        if (isNullOrEmpty(this.source)) {
          this.source = {
            type: 'FeatureCollection',
            features: [],
          };
        }
        this.source.crs = {
          type: 'EPSG',
          properties: {
            code: parameters.crs,
          },
        };
      }
    }

    /**
     * GeoJSON minZoom: Límite del zoom mínimo.
     * @public
     * @type {Number}
     */
    this.minZoom = optionsVar.minZoom || Number.NEGATIVE_INFINITY;

    /**
     * GeoJSON maxZoom: Límite del zoom máximo.
     * @public
     * @type {Number}
     */
    this.maxZoom = optionsVar.maxZoom || Number.POSITIVE_INFINITY;

    /**
     * GeoJSON options: Opciones que se mandan a la implementación.
     */
    this.options = options;
  }

  /**
   * Devuelve la fuente del GeoJSON.
   *
   * @function
   * @getter
   * @return {Object} Fuente del GeoJSON.
   * @api
   */
  get source() {
    return this.getImpl().source;
  }

  /**
   * Sobrescribe la fuente de la capa.
   *
   * @function
   * @setter
   * @param {Object} newSource Nueva fuente para la capa de tipo GeoJSON.
   * @api
   */
  set source(newSource) {
    this.getImpl().source = newSource;
  }

  /**
   * Devuelve el valor de la propiedad "extract". La propiedad "extract" tiene la
   * siguiente función: Activa la consulta al hacer clic en la característica, por defecto falso.
   *
   * @function
   * @getter
   * @return {Boolean} Valor de la propiedad "extract".
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
   * @param {Boolean|String} newExtract Nuevo valor para sobreescribir la propiedad "extract".
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

    if (obj instanceof GeoJSON) {
      equals = this.name === obj.name;
      equals = equals && (this.extract === obj.extract);
      // equals = equals && (this.predefinedStyles === obj.predefinedStyles);
    }

    return equals;
  }

  /**
   * Este método sobrescribe la fuente del GeoJSON.
   *
   * @function
   * @param {Object} source Nueva fuente.
   * @api
   */
  setSource(source) {
    this.source = source;
    this.getImpl().refresh(source);
  }

  /**
   * Este método establece el estilo en capa.
   *
   * @function
   * @public
   * @param {M.Style|String} styleParam Estilo que se aplicará a la capa.
   * @param {bool} applyToFeature Si el valor es verdadero se aplicará a los objetos geográficos,
   * falso no.
   * Por defecto, falso.
   * @param {M.layer.GeoJSON.DEFAULT_OPTIONS_STYLE} defaultStyle Estilo por defecto,
   * se define en GeoJSON.js.
   * @api
   */
  setStyle(styleParam, applyToFeature = false, defaultStyle = GeoJSON.DEFAULT_OPTIONS_STYLE) {
    super.setStyle(styleParam, applyToFeature, defaultStyle);
  }

  /**
   * Este método serializa la fuente del GeoJSON.
   *
   * @function
   * @return {String} Devuelve la fuente serializada, utiliza "encodeURIComponent".
   * @api
   * @public
   */
  serialize() {
    return window.btoa(unescape(encodeURIComponent(JSON.stringify(this.source))));
  }

  /**
   * Este método deserializa la fuente, utiliza "decodeURIComponent".
   *
   * @function
   * @param {String} encodedSerialized Fuente serializada.
   * @return {String} Devuelve la fuente deserializada.
   * @api
   * @public
   */
  deserialize(encodedSerialized) {
    const source = JSON.parse(decodeURIComponent(escape(window.atob(encodedSerialized.replace(' ', '+')))));
    return source;
  }
}

/**
 * Estilos por defecto del GeoJSON.
 * @type {Object}
 * @public
 * @api
 */
GeoJSON.DEFAULT_PARAMS = {
  fill: {
    color: 'rgba(255, 255, 255, 0.4)',
    opacity: 0.4,
  },
  stroke: {
    color: '#3399CC',
    width: 1.5,
  },
};

/**
 * Parámetros por defecto del GeoJSON.
 * @type {Object}
 * @public
 * @api
 */
GeoJSON.DEFAULT_OPTIONS_STYLE = {
  point: {
    ...GeoJSON.DEFAULT_PARAMS,
    radius: 5,
  },
  line: {
    ...GeoJSON.DEFAULT_PARAMS,
  },
  polygon: {
    ...GeoJSON.DEFAULT_PARAMS,
  },
};

export default GeoJSON;
