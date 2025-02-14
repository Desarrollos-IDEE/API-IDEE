/**
 * @module M/layer/OGCAPIFeatures
 */
import OGCAPIFeaturesImpl from 'impl/layer/OGCAPIFeatures';
import {
  isUndefined, isNullOrEmpty, isString, normalize,
} from '../util/Utils';
import Exception from '../exception/exception';
import Vector from './Vector';
import * as LayerType from './Type';
import * as parameter from '../parameter/parameter';
import { getValue } from '../i18n/language';

/**
 * @classdesc
 * OGCAPIFeatures(OGC API - Features) es un estándar que ofrece la
 * capacidad de crear, modificar y consultar datos
 * espaciales en la Web y especifica requisitos y recomendaciones para las API que desean seguir una
 * forma estándar de compartir datos de entidades.
 *
 * @property {String} legend Indica el nombre que queremos que aparezca en el
 * árbol de contenidos, si lo hay.
 * @property {String} url URL del servicio.
 * @property {String} name Nombre de la capa en el servidor.
 * @property {Number} limit Límite de objetos geográficos a mostrar.
 * @property {Array<Number>} bbox Filtro para mostrar los resultados en un bbox específico.
 * @property {String} format Formato de los objetos geográficos.
 * @property {Number} offset Determina desde que número comenzará a leer los objetos geográficos.
 * Ejemplo:
 * El parámetro offset tiene valor 10 con límite de 5 objetos geográficos, devolverá los 5 primeros
 * objetos geográficos desde número 10 de los resultados.
 * @property {Number} id Filtro por ID para un objeto geográfico.
 * @property {Array<M.style>} predefinedStyles Estilos predefinidos para la capa.
 * @property {String} cql Declaración CQL para filtrar las características
 * (Sólo disponible para servicios en PostgreSQL).
 * @property {Object} conditional Declaración de filtros literales por atributos del objeto
 * geográfico.
 * @property {String} crs Definición de la proyección de los datos.
 * @property {String} geometry Tipo de geometría: POINT(Punto), MPOINT(Multiples puntos),
 * LINE(línea), MLINE(Multiples línes), POLYGON(Polígono), or MPOLYGON(Multiples polígonos).
 * @property {Object} opt Opciones de la capa.
 * @property {Boolean} extract Opcional. Activa la consulta haciendo
 * clic en el objeto geográfico.
 *
 * @api
 * @extends {M.layer.Vector}
 */
class OGCAPIFeatures extends Vector {
  /**
   * Constructor principal de la clase. Crea una capa OGCAPIFeatures
   * con parámetros especificados por el usuario.
   * @constructor
   * @param {string|Mx.parameters.OGCAPIFeatures} userParams Parámetros para la construcción de
   * la capa.
   * - legend: Indica el nombre que queremos que aparezca en el árbol de contenidos, si lo hay.
   * - url: URL del servicio.
   * - name: Nombre de la capa en el servidor.
   * - limit: Límite de objetos geográficos a mostrar.
   * - bbox: Filtro para mostrar los resultados en un bbox específico.
   * - format: Formato de los objetos geográficos.
   * - offset: Determina desde que número comenzará a leer los objetos geográficos.Ejemplo:
   * El parámetro offset tiene valor 10 con límite de 5 objetos geográficos,
   * devolverá los 5 primeros objetos geográficos desde número 10 de los resultados.
   * - id: Filtro por ID para un objeto geográfico.
   * - conditional: Declaración de filtros literales por atributos del objeto geográfico.
   * - crs: Definición de la proyección de los datos.
   * - geometry: Tipo de geometría: POINT(Punto), MPOINT(Multiples puntos),
   * LINE(línea), MLINE(Multiples línes), POLYGON(Polígono), or MPOLYGON(Multiples polígonos).
   * - extract: Opcional, activa la consulta por click en el objeto geográfico, por defecto falso.
   * - maxExtent: La medida en que restringe la visualización a una región específica.
   * @param {Mx.parameters.LayerOptions} options Estas opciones se mandarán a
   * la implementación de la capa.
   * - predefinedStyles: Estilos predefinidos para la capa.
   * - visibility: Define si la capa es visible o no. Verdadero por defecto.
   * - displayInLayerSwitcher: Indica si la capa se muestra en el selector de capas.
   * - minZoom: Zoom mínimo aplicable a la capa.
   * - maxZoom: Zoom máximo aplicable a la capa.
   * - opacity: Opacidad de capa, por defecto 1.
   * @param {Object} vendorOpts Opciones para la biblioteca base.
   * -cql: Declaración CQL para filtrar las características
   * (Sólo disponible para servicios en PostgreSQL).
   * Ejemplo vendorOptions:
   * <pre><code>
   * import OLSourceVector from 'ol/source/Vector';
   * {
   *   cql: 'id IN (3,5)',
   * }
   * </code></pre>
   * @api
   */
  constructor(userParams, opt = {}, vendorOpts = {}) {
    // This layer is of parameters.
    const parameters = parameter.layer(userParams, LayerType.OGCAPIFeatures);

    const optionsVar = opt;

    if (typeof userParams !== 'string') {
      optionsVar.maxExtent = userParams.maxExtent;
    }
    /**
     * Implementación
     * @public
     * @implements {M.impl.layer.OGCAPIFeatures}
     * @type {M.impl.layer.OGCAPIFeatures}
     */
    const impl = new OGCAPIFeaturesImpl(optionsVar, vendorOpts);

    // Llama al contructor del que se extiende la clase
    super(parameters, optionsVar, undefined, impl);

    // Comprueba si la implementación puede crear capas OGCAPIFeatures
    if (isUndefined(OGCAPIFeaturesImpl)) {
      Exception(getValue('exception').OGCAPIFeatureslayer_method);
    }

    // Comprueba si los parámetros son null or empty
    if (isNullOrEmpty(userParams)) {
      Exception(getValue('exception').no_param);
    }

    /**
     * OGCAPIFeatures legend: Indica el nombre que queremos
     * que aparezca en el árbol de contenidos, si lo hay.
     */
    this.legend = parameters.legend;

    /**
     * OGCAPIFeatures url: URL del servicio.
     */
    this.url = parameters.url;

    /**
     * OGCAPIFeatures name: Nombre de la capa en el servidor.
     */
    this.name = parameters.name;

    /**
     * OGCAPIFeatures limit: Límite de objetos geográficos a mostrar.
     */
    this.limit = parameters.limit;

    /**
     * OGCAPIFeatures bbox: Filtro para mostrar los resultados en un bbox específico.
     */
    this.bbox = parameters.bbox;

    /**
     * OGCAPIFeatures format: Formato de los objetos geográficos.
     */
    this.format = parameters.format;

    /**
     * OGCAPIFeatures offset: Determina desde que número comenzará a leer los objetos geográficos.
     */
    this.offset = parameters.offset;

    /**
     * OGCAPIFeatures id: Filtro por ID para un objeto geográfico.
     */
    this.id = parameters.id;

    /**
     * OGCAPIFeatures extract: Activa la consulta al hacer clic sobre un objeto geográfico,
     * por defecto falso.
     */
    this.extract = parameters.extract === undefined ? false : parameters.extract;

    /**
     * OGCAPIFeatures cql: Declaración CQL para filtrar las características
     * (Sólo disponible para servicios en PostgreSQL).
     */
    this.cql = vendorOpts.cql;

    /**
     * OGCAPIFeatures conditional: Declaración de filtros literales por atributos del
     * objeto geográfico.
     */
    this.conditional = parameters.conditional;

    /**
     * OGCAPIFeatures crs: Definición de la proyección de los datos.
     */
    this.crs = parameters.crs;

    /**
     * OGCAPIFeatures geometry: Tipo de geometría.
     */
    this.geometry = parameters.geometry;

    /**
     * OGCAPIFeatures minZoom: Límite del zoom mínimo.
     * @public
     * @type {Number}
     */
    this.minZoom = optionsVar.minZoom || Number.NEGATIVE_INFINITY;

    /**
     * OGCAPIFeatures maxZoom: Límite del zoom máximo.
     * @public
     * @type {Number}
     */
    this.maxZoom = optionsVar.maxZoom || Number.POSITIVE_INFINITY;

    /**
     * OGCAPIFeatures opt: Opciones.
     */
    this.opt = opt;
  }

  /**
   * Devuelve el nombre de la capa.
   * @function
   * @return {M.layer.OGCAPIFeature.impl.name} Devuelve el nombre de la capa.
   * @api
   */
  get name() {
    return this.getImpl().name;
  }

  /**
   * Sobrescribe el nombre.
   * @function
   * @param {String} newName Nuevo nombre.
   * @api
   */
  set name(newName) {
    if (isNullOrEmpty(newName)) {
      this.getImpl().name = this.name;
    } else {
      this.getImpl().name = newName;
    }
  }

  /**
   * Devuelve el límite de resultados.
   * @function
   * @return { M.layer.OGCAPIFeature.impl.limit } Devuelve el límite de resultados.
   * @api
   */
  get limit() {
    return this.getImpl().limit;
  }

  /**
   * Sobrescribe el límite.
   * @function
   * @param {Number} newLimit Nuevo límite.
   * @api
   */
  set limit(newLimit) {
    if (isNullOrEmpty(newLimit)) {
      this.getImpl().limit = this.limit;
    } else {
      this.getImpl().limit = newLimit;
    }
  }

  /**
   * Devuelve el rectángulo geográfico envolvente.
   * @function
   * @return { M.layer.OGCAPIFeature.impl.bbox } Devuelve el rectángulo geográfico envolvente.
   * @api
   */
  get bbox() {
    return this.getImpl().bbox;
  }

  /**
   * Sobrescribe el rectángulo geográfico envolvente.
   * @function
   * @param {Array} newBbox Nuevo bbox.
   * @api
   */
  set bbox(newBbox) {
    if (isNullOrEmpty(newBbox)) {
      this.getImpl().bbox = this.bbox;
    } else {
      this.getImpl().bbox = newBbox;
    }
  }

  /**
   * Devuelve el formato aplicado.
   * @function
   * @return { M.layer.OGCAPIFeature.impl.format } Devuelve el formato aplicado.
   * @api
   */
  get format() {
    return this.getImpl().format;
  }

  /**
   * Sobrescribe el formato.
   * @function
   * @param {String} newFormat Nuevo formato.
   * @api
   */
  set format(newFormat) {
    if (isNullOrEmpty(newFormat)) {
      this.getImpl().format = this.format;
    }
    this.getImpl().format = newFormat;
  }

  /**
   * Devuelve el offset aplicado.
   * @function
   * @return { M.layer.OGCAPIFeature.impl.offset } Devuelve el offset aplicado.
   * @api
   */
  get offset() {
    return this.getImpl().offset;
  }

  /**
   * Sobrescribe el offset.
   * @function
   * @param {String} newOffset Nuevo offset.
   * @api
   */
  set offset(newOffset) {
    if (isNullOrEmpty(newOffset)) {
      this.getImpl().offset = this.offset;
    } else {
      this.getImpl().offset = newOffset;
    }
  }

  /**
   * Devuelve el id aplicado.
   * @function
   * @return { M.layer.OGCAPIFeature.impl.id } Devuelve el id aplicado.
   * @api
   */
  get id() {
    return this.getImpl().id;
  }

  /**
   * Sobrescribe el id.
   * @function
   * @param {Number} newId Nuevo id.
   * @api
   */
  set id(newId) {
    if (isNullOrEmpty(newId)) {
      this.getImpl().id = this.id;
    } else {
      this.getImpl().id = newId;
    }
  }

  /**
   * Devuelve el condicional aplicado.
   * @function
   * @return {M.layer.OGCAPIFeature.impl.conditional} Devuelve el conditional aplicado.
   * @api
   */
  get conditional() {
    return this.getImpl().conditional;
  }

  /**
   * Sobrescribe el condicional.
   * @function
   * @param {String} newConditional Nuevo condicional.
   * @api
   */
  set conditional(newConditional) {
    if (isNullOrEmpty(newConditional)) {
      this.getImpl().conditional = this.conditional;
    } else {
      this.getImpl().conditional = newConditional;
    }
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
   * @param {M.layer.OGCAPIFeatures.DEFAULT_OPTIONS_STYLE} defaultStyle Estilo por defecto,
   * se define en OGCAPIFeatures.js.
   * @api
   */
  setStyle(styleParam, applyToFeature = false, defaultStyle = OGCAPIFeatures.DEFAULT_OPTS_STYLE) {
    super.setStyle(styleParam, applyToFeature, defaultStyle);
  }

  /**
   * Devuelve el valor de la propiedad "extract". La propiedad "extract" tiene la
   * siguiente función: Activa la consulta al hacer clic en la característica, por defecto falso.
   *
   * @function
   * @getter
   * @returns {Boolean} Valor de la propiedad "extract".
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
    if (obj instanceof OGCAPIFeatures) {
      equals = (this.url === obj.url);
      equals = equals && (this.name === obj.name);
      equals = equals && (this.legend === obj.legend);
      equals = equals && (this.limit === obj.limit);
      equals = equals && (this.format === obj.format);
      equals = equals && (this.offset === obj.offset);
      equals = equals && (this.bbox === obj.bbox);
      equals = equals && (this.id === obj.id);
      equals = equals && (this.extract === obj.extract);
      equals = equals && (this.predefinedStyles === obj.predefinedStyles);
    }
    return equals;
  }
}

/**
 * Parámetros predeterminados para las capas OGCAPIFeatures de estilo.
 * @const
 * @type {Object}
 * @public
 * @api
 */
OGCAPIFeatures.DEFAULT_PARAMS = {
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
 * Estilo predeterminado para capas OGCAPIFeatures.
 * @const
 * @type {Object}
 * @public
 * @api
 */
OGCAPIFeatures.DEFAULT_OPTS_STYLE = {
  point: {
    ...OGCAPIFeatures.DEFAULT_PARAMS,
    radius: 5,
  },
  line: {
    ...OGCAPIFeatures.DEFAULT_PARAMS,
  },
  polygon: {
    ...OGCAPIFeatures.DEFAULT_PARAMS,
  },
};

export default OGCAPIFeatures;
