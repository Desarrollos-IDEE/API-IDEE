/**
 * @module M/layer/WFS
 */
import WFSImpl from 'impl/layer/WFS';
import {
  isUndefined, isNullOrEmpty, isString, normalize,
} from '../util/Utils';
import Exception from '../exception/exception';
import Vector from './Vector';
import * as LayerType from './Type';
import * as parameter from '../parameter/parameter';
import { parse } from '../geom/Geom';
import { getValue } from '../i18n/language';

/**
 * @classdesc
 * WFS (Web Feature Service) es un estándar OGC para la transferencia de información geográfica,
 * donde los elementos o características geográficas se transmiten en su totalidad al cliente.
 *
 * @property {String} namespace Espacio de trabajo asociado a la capa.
 * @property {String} legend Indica el nombre que queremos que aparezca en el
 * árbol de contenidos, si lo hay.
 * @property {String} cql Declaración CQL para filtrar las características.
 * El método setCQL(cadena_cql) refresca la capa aplicando el
 * nuevo predicado CQL que recibe.
 * @property {String} geometry Tipo de geometría: POINT (Punto), MPOINT (Multiples puntos),
 * LINE (línea), MLINE (Multiples línes), POLYGON (Polígono), or MPOLYGON (Multiples polígonos).
 * @property {String} ids Identificadores por los que queremos filtrar los objeto geográfico.
 * @property {String} version Versión del estándar a utilizar. El valor predeterminado es 1.0.0.
 * @property {Boolean} extract Activa la consulta al hacer clic en la característica,
 * por defecto falso.
 * @property {Object} options Opciones de WFS.
 *
 * @api
 * @extends {M.layer.Vector}
 */
class WFS extends Vector {
  /**
   * Constructor principal de la clase. Crea una capa WFS
   * con parámetros especificados por el usuario.
   * @constructor
   * @param {string|Mx.parameters.WFS} userParams Parámetros para la construcción de la capa.
   * - url: Url del servicio WFS.
   * - namespace: Espacio de trabajo asociado a la capa.
   * - name: Nombre de la capa en el servidor.
   * - legend: Indica el nombre que queremos que aparezca en el árbol de contenidos, si lo hay.
   * - geometry: Tipo de geometría: POINT (Punto), MPOINT (Multiples puntos), LINE (línea),
   * MLINE (Multiples línes), POLYGON (Polígono), or MPOLYGON (Multiples polígonos).
   * - ids: Opcional - identificadores por los que queremos filtrar los objetos geográficos.
   * - cql: Opcional - Sentencia CQL para filtrar los objetos geográficos.
   *  El método setCQL(cadena_cql) refresca la capa aplicando el nuevo predicado CQL que reciba.
   * - version: Opcional - Versión del estandar a usar. Por defecto es 1.0.0.
   * - extract: Opcional Activa la consulta por clic en el objeto geográfico, por defecto falso.
   * - type: Tipo de la capa.
   * - maxExtent: La medida en que restringe la visualización a una región específica.
   * - legend: Indica el nombre que queremos que aparezca en el árbol de contenidos, si lo hay.
   * @param {Mx.parameters.LayerOptions} options Estas opciones se mandarán a
   * la implementación de la capa.
   * - style: Define el estilo de la capa.
   * - getFeatureOutputFormat: Formato de los objetos geográficos, por defecto 'application/json'.
   * - describeFeatureTypeOutputFormat: Describe el formato de salida de los objetos geográficos.
   * - vendor: Proveedor.
   * - minZoom: Zoom mínimo aplicable a la capa.
   * - maxZoom: Zoom máximo aplicable a la capa.
   * - visibility: Define si la capa es visible o no. Verdadero por defecto.
   * - displayInLayerSwitcher: Indica si la capa se muestra en el selector de capas.
   * - opacity: Opacidad de capa, por defecto 1.
   * - predefinedStyles: Estilos predefinidos para la capa.
   * @param {M.WFSImpl} impl Implementación por defecto.
   * @param {Object} vendorOpts Opciones para la biblioteca base. Ejemplo vendorOptions:
   * <pre><code>
   * import OLSourceVector from 'ol/source/Vector';
   * {
   *  opacity: 0.1,
   *  source: new OLSourceVector({
   *    attributions: 'wfs',
   *    ...
   *  })
   * }
   * </code></pre>
   * @api
   */
  constructor(userParams = {}, options = {}, vendorOpts = {}, implParam = undefined) {
    // This layer is of parameters.
    const parameters = parameter.layer(userParams, LayerType.WFS);

    const optionsVar = options;

    if (typeof userParams !== 'string') {
      optionsVar.maxExtent = userParams.maxExtent;
    }

    const impl = implParam || new WFSImpl(optionsVar, vendorOpts);

    // calls the super constructor
    super(parameters, optionsVar, undefined, impl);

    // checks if the implementation can create WFS layers.
    if (isUndefined(WFSImpl)) {
      Exception(getValue('exception').wfslayer_method);
    }

    // checks if the param is null or empty.
    if (isNullOrEmpty(userParams)) {
      Exception(getValue('exception').no_param);
    }

    /**
     * WFS namespace: Espacio de trabajo asociado con la capa.
     */
    this.namespace = parameters.namespace;

    /**
     * WFS legend: Indica el nombre que queremos que aparezca en el árbol de contenidos, si lo hay.
     */
    this.legend = parameters.legend;

    /**
     * WFS cql: Opcional: instrucción CQL para filtrar.
     * El método setCQL(cadena_cql) refresca la capa aplicando el
     * nuevo predicado CQL que recibe.
     */
    this.cql = parameters.cql;

    /**
     * WFS geometry.
     * Tipo de geometría: POINT (Punto), MPOINT (Multiples puntos), LINE (línea),
     * MLINE (Multiples línes), POLYGON (Polígono), or MPOLYGON (Multiples polígonos).
     */
    this.geometry = parameters.geometry;

    /**
     * WFS ids: Opcional, identificadores por los que queremos filtrar los objetos geográficos.
     */
    this.ids = parameters.ids;

    /**
     * WFS version: Opcional, versión del estándar a utilizar. El valor predeterminado es 1.0.0.
     */
    this.version = parameters.version;

    /**
     * WFS extract: Opcional, activa la consulta haciendo clic en un objeto geográfico,
     * por defecto falso.
     */
    this.extract = parameters.extract === undefined ? false : parameters.extract;

    /**
     * WFS minZoom: Límite del zoom mínimo.
     * @public
     * @type {Number}
     */
    this.minZoom = optionsVar.minZoom || Number.NEGATIVE_INFINITY;

    /**
     * WFS maxZoom: Límite del zoom máximo.
     * @public
     * @type {Number}
     */
    this.maxZoom = optionsVar.maxZoom || Number.POSITIVE_INFINITY;

    /**
     * options: Opciones WFS.
     */
    this.options = options;
  }

  /**
   * Devuelve el valor de la propiedad "extract".
   * Activa la consulta haciendo clic en el objeto geográfico, por defecto falso.
   * @function
   * @return {M.layer.WFS.impl.extract} Devuelve el valor de la propiedad "extract".
   * @api
   */
  get extract() {
    return this.getImpl().extract;
  }

  /**
   * Sobrescribe el valor de la propiedad "extract".
   * Activa la consulta haciendo clic en el objeto geográfico, por defecto falso.
   * @function
   * @param {Boolean} newExtract Nuevo valor de la propiedad""extract".
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
   * Devuelve el "namespace" de la capa.
   * @function
   * @return {M.layer.WFS.impl.namespace} Devuelve el "namespace".
   * @api
   */
  get namespace() {
    return this.getImpl().namespace;
  }

  /**
   * Sobrescribe el "namespace" de la capa.
   * @function
   * @param {String} newNamespace Nuevo "namespace".
   * @api
   */
  set namespace(newNamespace) {
    this.getImpl().namespace = newNamespace;
  }

  /**
   * Devuelve el CQL de la capa.
   * @function
   * @return {M.layer.WFS.impl.cql}  Devuelve el CQL.
   * @api
   */
  get cql() {
    return this.getImpl().cql;
  }

  /**
   * Sobrescribe el cql de la capa.
   * @function
   * @param {String} newCQL Nuevo CQL.
   * @api
   */
  set cql(newCQL) {
    this.getImpl().cql = newCQL;
  }

  /**
   * Devuelve la geometría de la capa WFS.
   * @function
   * @return {M.layer.WFS.impl.geometry} Devuelve la geometría.
   * @api
   */
  get geometry() {
    return this.getImpl().geometry;
  }

  /**
   * Sobrescribe la geometría.
   * @function
   * @param {Array} newGeometry Nueva geometría.
   * @api
   */
  set geometry(newGeometry) {
    if (!isNullOrEmpty(newGeometry)) {
      const parsedGeom = parse(newGeometry);
      if (isNullOrEmpty(parsedGeom)) {
        Exception(`El tipo de capa WFS <b>${newGeometry}</b> no se reconoce. Los tipos disponibles son: POINT, LINE, POLYGON, MPOINT, MLINE, MPOLYGON`);
      }
      this.getImpl().geometry = parsedGeom;
    }
  }

  /**
   * Devuelve los ids de la capa.
   * @function
   * @return {M.layer.WFS.impl.ids} Devuelve los ids.
   * @api
   */
  get ids() {
    return this.getImpl().ids;
  }

  /**
   * Sobrescribe los ids de la capa.
   * @function
   * @param {Array} newIds Nuevos ids.
   * @api
   */
  set ids(newIds) {
    if (isNullOrEmpty(newIds)) {
      this.getImpl().ids = this.ids;
    } else {
      this.getImpl().ids = newIds;
    }
  }

  /**
   * Devuelve la versión de la capa.
   * @function
   * @return {M.layer.WFS.impl.ids} Devuelve la versión.
   * @api
   */
  get version() {
    return this.getImpl().version;
  }

  /**
   * Sobrescribe la versión de la capa.
   * @function
   * @param {Array} newVersion Nueva versión.
   * @api
   */
  set version(newVersion) {
    if (!isNullOrEmpty(newVersion)) {
      this.getImpl().version = newVersion;
    } else {
      this.getImpl().version = '1.0.0'; // default value
    }
  }

  /**
   * Este método Sobrescribe el filtro CQL.
   * @function
   * @param {String} newCQLparam Nuevo filtro CQL.
   * @api
   */
  setCQL(newCQLparam) {
    let newCQL = newCQLparam;
    this.getImpl().getDescribeFeatureType().then((describeFeatureType) => {
      if (!isNullOrEmpty(newCQL)) {
        const geometryName = describeFeatureType.geometryName;
        // if exist, replace {{geometryName}} with the value geometryName
        newCQL = newCQL.replace(/{{geometryName}}/g, geometryName);
      }
      if (this.getImpl().cql !== newCQL) {
        this.getImpl().setCQL(newCQL);
      }
    });
  }

  /**
   * Este método establece el estilo en capa.
   *
   * @function
   * @public
   * @param {M.Style} styleParam Estilo que se aplicará a la capa.
   * @param {Boolean} applyToFeature Si el valor es verdadero se aplicará a los objetos geográficos,
   * falso no.
   * Por defecto, falso.
   * @param {M.layer.WFS.DEFAULT_OPTIONS_STYLE} defaultStyle Estilo por defecto,
   * se define en WFS.js.
   * @api
   */
  setStyle(styleParam, applyToFeature = false, defaultStyle = WFS.DEFAULT_OPTIONS_STYLE) {
    super.setStyle(styleParam, applyToFeature, defaultStyle);
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

    if (obj instanceof WFS) {
      equals = (this.url === obj.url);
      equals = equals && (this.namespace === obj.namespace);
      equals = equals && (this.name === obj.name);
      equals = equals && (this.ids === obj.ids);
      equals = equals && (this.cql === obj.cql);
      equals = equals && (this.version === obj.version);
      equals = equals && (this.extract === obj.extract);
      equals = equals && (this.predefinedStyles === obj.predefinedStyles);
    }

    return equals;
  }
}

/**
 * Parámetros predeterminados para las capas WFS de estilo.
 * @const
 * @type {Object}
 * @public
 * @api
 */
WFS.DEFAULT_PARAMS = {
  fill: {
    color: 'rgba(103, 175, 19, 0.2)',
    opacity: 0.4,
  },
  stroke: {
    color: '#67af13',
    width: 1,
  },
};

/**
 * Estilo predeterminado para capas WFS.
 * @const
 * @type {Object}
 * @public
 * @api
 */
WFS.DEFAULT_OPTIONS_STYLE = {
  point: {
    ...WFS.DEFAULT_PARAMS,
    radius: 5,
  },
  line: {
    ...WFS.DEFAULT_PARAMS,
  },
  polygon: {
    ...WFS.DEFAULT_PARAMS,
  },
};

export default WFS;
