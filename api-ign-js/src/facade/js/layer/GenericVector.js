/**
 * @module M/layer/GenericVector
 */
import GenericVectorImpl from 'impl/layer/GenericVector';
import Utils from 'impl/util/Utils';
import {
  isUndefined, isArray, isNullOrEmpty, isFunction, isObject, isString, normalize,
} from '../util/Utils';
import Exception from '../exception/exception';
import Vector from './Vector';
import { getValue } from '../i18n/language';
import * as EventType from '../event/eventtype';
import * as parameter from '../parameter/parameter';
import * as LayerType from './Type';
import Generic from '../style/Generic';

/**
 * @classdesc
 * GenericVector permite añadir cualquier tipo de capa vector.
 *
 * @property {String} name Nombre de la capa, identificador.
 * @property {Boolean} extract Activa la consulta al hacer clic sobre un objeto geográfico,
 * por defecto falso.
 * @property {Array} ids Identificadores por los que queremos filtrar los objetos geográficos.
 * @property {String} cql Sentencia CQL para filtrar los objetos geográficos.
 * @property {Object} options Opciones GenericVector.
 *
 * @api
 * @extends {M.layer.Vector}
 */
class GenericVector extends Vector {
  /**
   * Constructor principal de la clase.
   * @constructor
   * @param {string|Mx.parameters.WMS} userParameters Parámetros para la construcción de la capa.
   * - name: nombre de la capa.
   * - legend: Nombre asociado en el árbol de contenidos, si usamos uno.
   * - transparent: Falso si es una capa base, verdadero en caso contrario.
   * - extract: Opcional, activa la consulta por click en el objeto geográfico, por defecto falso.
   * - infoEventType: Define si consultar la capa con un clic o con "hover".
   * - maxExtent: La medida en que restringe la visualización a una región específica.
   * - isBase: Indica si la capa es base.
   * - ids: Opcional - identificadores por los que queremos filtrar los objetos geográficos.
   * - cql: Opcional - Sentencia CQL para filtrar los objetos geográficos.
   *  El método setCQL(cadena_cql) refresca la capa aplicando el nuevo predicado CQL que reciba.
   * @param {Mx.parameters.LayerOptions} options Estas opciones se mandarán a
   * la implementación de la capa.
   * - visibility: Indica la visibilidad de la capa.
   * - format: Formato de la capa, por defecto image/png.
   * - styles: Estilos de la capa.
   * - minZoom: Zoom mínimo aplicable a la capa.
   * - maxZoom: Zoom máximo aplicable a la capa.
   * - queryable: Indica si la capa es consultable.
   * - minScale: Escala mínima.
   * - maxScale: Escala máxima.
   * - minResolution: Resolución mínima.
   * - maxResolution: Resolución máxima.
   * @param {Object} vendorOptions Opciones para la biblioteca base. Ejemplo vendorOptions:
   * <pre><code>
   * import Vector from 'ol/source/Vector';
   * {
   *  source: new Vector({
   *    ...
   *  })
   * }
   * </code></pre>
   * @api
   */
  constructor(userParameters = {}, options = {}, vendorOptions = {}) {
    let params = { ...userParameters, ...options };
    delete params.minZoom;
    delete params.maxZoom;
    const opts = options;
    let vOptions = vendorOptions;

    if (typeof userParameters === 'string') {
      params = parameter.layer(userParameters, LayerType.GenericVector);
      vOptions = params.vendorOptions;
    } else if (!isNullOrEmpty(userParameters)) {
      params.type = LayerType.GenericVector;
    }

    if (params.name) {
      opts.name = params.name;
    } else if (vOptions) {
      opts.name = Utils.addFacadeName(params.name, vOptions);
      params.name = params.name || opts.name;
    }

    if (params.legend) {
      opts.legend = params.legend;
    } else if (vOptions) {
      opts.legend = Utils.addFacadeLegend(vOptions) || params.name;
      params.legend = params.legend || opts.legend;
    }

    params.infoEventType = userParameters.infoEventType || 'click';
    opts.userMaxExtent = params.maxExtent || opts.userMaxExtent;

    // checks if the implementation can create Generic layers
    if (isUndefined(GenericVectorImpl)) {
      Exception(getValue('exception').generic_method);
    }

    const impl = new GenericVectorImpl(options, vOptions, 'vector');

    // calls the super constructor
    super(params, options, undefined, impl);

    if (!isNullOrEmpty(impl) && isFunction(impl.setFacadeObj)) {
      impl.setFacadeObj(this);
    }

    this.sourceType = impl.sourceType;

    // -- WFS --
    this.ids = userParameters.ids;

    this.version = params.version;

    /**
     * WFS cql: Opcional: instrucción CQL para filtrar.
     * El método setCQL(cadena_cql) refresca la capa aplicando el
     * nuevo predicado CQL que recibe.
     */
    this.cql = params.cql;

    if (isNullOrEmpty(this.namespace)) {
      if (isNullOrEmpty(userParameters.namespace)) {
        this.namespace = undefined;
      } else {
        this.namespace = userParameters.namespace;
      }
    }

    /**
     * extract: Opcional, activa la consulta
     * haciendo clic en el objeto geográfico, por defecto falso.
     */
    this.extract = userParameters.extract === undefined ? false : userParameters.extract;

    this.styleFacade = params.style;
  }

  /**
  * Este método devuelve extensión máxima de esta capa.
  *
  * @function
  * @param {Boolean} isSource Extent de la biblioteca base o no, por defecto verdadero.
  * @returns {Array} Devuelve la extensión máxima de esta capa.
  * @api
  */
  getMaxExtent(isSource = true) {
    let extent = !isSource ? this.maxExtent_ : this.getImpl().getMaxExtent();
    if (isUndefined(extent) || isNullOrEmpty(extent)) {
      extent = this.map_.getProjection().getExtent();
    }
    return extent;
  }

  /**
    * Este método calcula la extensión máxima de esta capa.
    *
    * @function
    * @returns {M.layer.maxExtent} Devuelve una promesa, con la extensión máxima de esta capa.
    * @api
    */
  calculateMaxExtent() {
    return new Promise((resolve) => { resolve(this.getMaxExtent(false)); });
  }

  /**
    * Este método cambia la extensión máxima de la capa.
    *
    * @function
    * @param {Array|Object} maxExtent Nuevo valor para el "MaxExtent".
    * @api
    * @export
    */
  setMaxExtent(maxExtent) {
    let extent = maxExtent;
    if (!isArray(maxExtent) && isObject(maxExtent)) {
      extent = [
        maxExtent.x.min,
        maxExtent.y.min,
        maxExtent.x.max,
        maxExtent.y.max,
      ];
    }
    this.getImpl().setMaxExtent(extent);
  }

  /**
   * Devuelve la url del servicio.
   *
   * @function
   * @getter
   * @public
   * @returns {String} URL del servicio.
   * @api
   */
  get url() {
    return this.getImpl().getURLService();
  }

  /**
   * Modifica la url del servicio.
   * @function
   * @setter
   * @public
   * @param {String} newUrl Nueva URL.
   * @api
   */
  set url(newUrl) {
    this.getImpl().setURLService(newUrl);
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
   * Devuelve la versión del servicio, por defecto es 1.3.0.
   *
   * @function
   * @getter
   * @return {M.layer.GenericVector.impl.version} Versión del servicio.
   * @api
   */
  get version() {
    return this.getImpl().version;
  }

  /**
   * Sobrescribe la versión del servicio, por defecto es 1.3.0.
   *
   * @function
   * @setter
   * @param {String} newVersion Nueva versión del servicio.
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
   * Este método devuelve el estilo de la capa.
   *
   * @function
   * @public
   * @returns {M.layer.Vector.style}
   * @api
   */
  getStyle() {
    if (this.styleFacade) {
      return this.style_;
    }
    return new Generic(this.constructor.DEFAULT_OPTIONS_STYLE);
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
    if (obj instanceof GenericVector) {
      equals = (this.legend === obj.legend);
      equals = equals && (this.url === obj.url);
      equals = equals && (this.name === obj.name);
      equals = equals && (this.cql === obj.cql);
    }

    return equals;
  }

  /**
   * Este método incluye objetos geográficos a la capa.
   *
   * @function
   * @public
   * @param {Array<M.feature>} features Objetos geográficos que
   * se incluirán a la capa.
   * @param {Boolean} update Verdadero se vuelve a cargar la capa,
   * falso no la vuelve a cargar.
   * @api
   */
  addFeatures(featuresParam, update = false) {
    let features = featuresParam;
    if (!isNullOrEmpty(features)) {
      if (!isArray(features)) {
        features = [features];
      }
      if (this.getImpl().isLoaded()) {
        this.getImpl().addFeatures(features, update);
      } else {
        this.getImpl().on(EventType.LOAD, () => {
          this.getImpl().addFeatures(features, update);
        });
      }
    }
  }
}

export default GenericVector;
