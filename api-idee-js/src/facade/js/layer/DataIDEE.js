/**
 * @module IDEE/layer/DataIDEE
 */
import DataIDEEImpl from 'impl/layer/DataIDEE';
import {
  isUndefined, isNullOrEmpty, isString, normalize, isObject,
} from '../util/Utils';
import Exception from '../exception/exception';
import Vector from './Vector';
import * as LayerType from './Type';
import * as parameter from '../parameter/parameter';
import { getValue } from '../i18n/language';
import * as EventType from '../event/eventtype';
import * as Dialog from '../dialog';
import RequestManager from '../../../impl/common/RequestManager';

/**
 * @classdesc
 * Capa DataIDEE de solo lectura para consultar entidades GeoJSON mediante OGC API Features.
 * Admite filtros CQL2 en texto o JSON a través de las opciones del proveedor.
 *
 * @property {String} idLayer Identificador de la capa.
 * @property {String} legend Indica el nombre que queremos que aparezca en el
 * árbol de contenidos, si lo hay.
 * @property {String} url URL del servicio.
 * @property {String} name Nombre de la capa en el servidor.
 * @property {Number} limit Límite de objetos geográficos a mostrar.
 * @property {Array<Number>} bbox Filtro geográfico fijo, ignorado cuando bboxStrategy está activo.
 * @property {String} format Formato solicitado. Si se omite, se usa el formato
 * predeterminado del servicio.
 * @property {Number} offset Determina desde que número comenzará a leer los objetos geográficos.
 * Ejemplo:
 * El parámetro offset tiene valor 10 con límite de 5 objetos geográficos, devolverá los 5 primeros
 * objetos geográficos desde número 10 de los resultados.
 * @property {Number} id Filtro por ID para un objeto geográfico.
 * @property {Array<IDEE.style>} predefinedStyles Estilos predefinidos para la capa.
 * @property {String} cql Filtro CQL heredado, enviado como parámetro filter.
 * @property {Object} conditional Declaración de filtros literales por atributos del objeto
 * geográfico.
 * @property {String} crs Definición de la proyección de los datos.
 * @property {String} geometry Tipo de geometría: POINT(Punto), MPOINT(Multiples puntos),
 * LINE(línea), MLINE(Multiples línes), POLYGON(Polígono), or MPOLYGON(Multiples polígonos).
 * @property {Object} opt Opciones de la capa.
 * @property {Boolean} extract Opcional. Activa la consulta haciendo
 * clic en el objeto geográfico. Por defecto, verdadero.
 * @property {Boolean} transparent (deprecated) Falso si es una capa base,
 * verdadero en caso contrario.
 * @property {Boolean} isBase Define si la capa es base.
 * @property {String} template Plantilla que se mostrará al consultar un objeto geográfico.
 *
 * @api
 * @extends {IDEE.layer.Vector}
 */
class DataIDEE extends Vector {
  /**
   * Constructor principal de la clase. Crea una capa DataIDEE
   * con parámetros especificados por el usuario.
   * @constructor
   * @param {string|Mx.parameters.DataIDEE} userParams Parámetros para la construcción de
   * la capa.
   * - legend: Indica el nombre que queremos que aparezca en el árbol de contenidos, si lo hay.
   * - url: URL del servicio.
   * - name: Nombre de la capa en el servidor.
   * - limit: Límite de objetos geográficos a mostrar.
   * - bbox: Filtro para mostrar los resultados en un bbox específico.
   * - format: Formato solicitado. Si se omite, se usa el formato predeterminado
   *   del servicio.
   * - offset: Determina desde que número comenzará a leer los objetos geográficos.Ejemplo:
   * El parámetro offset tiene valor 10 con límite de 5 objetos geográficos,
   * devolverá los 5 primeros objetos geográficos desde número 10 de los resultados.
   * - id: Filtro por ID para un objeto geográfico.
   * - conditional: Declaración de filtros literales por atributos del objeto geográfico.
   * - crs: Definición de la proyección de los datos.
   * - geometry: Tipo de geometría: POINT(Punto), MPOINT(Multiples puntos),
   * LINE(línea), MLINE(Multiples línes), POLYGON(Polígono), or MPOLYGON(Multiples polígonos).
   * - extract: Opcional, activa la consulta por clic en el objeto geográfico,
   * por defecto verdadero.
   * - maxExtent: La medida en que restringe la visualización a una región específica.
   * - isBase: Indica si la capa es base.
   * - transparent (deprecated): Falso si es una capa base, verdadero en caso contrario.
   * - template: (opcional) Plantilla que se mostrará al consultar un objeto geográfico.
   * @param {Mx.parameters.LayerOptions} options Estas opciones se mandarán a
   * la implementación de la capa.
   * - predefinedStyles: Estilos predefinidos para la capa.
   * - visibility: Define si la capa es visible o no. Verdadero por defecto.
   * - displayInLayerSwitcher: Indica si la capa se muestra en el selector de capas.
   * - minZoom: Zoom mínimo aplicable a la capa.
   * - maxZoom: Zoom máximo aplicable a la capa.
   * - minScale: Escala mínima.
   * - maxScale: Escala máxima.
   * - opacity: Opacidad de capa, por defecto 1.
   * - renderer: Renderizado ('canvas' | 'webgl'). Por defecto IDEE.config.WEBGL.
   * - height: Define la altura del objeto geográfico. Puede ser un número o una propiedad.
   *   Si se define la altura será constante para todos los puntos del objeto geográfico.
   *   Disponible para gemetrías poligonales.
   *   Solo disponible para Cesium.
   * - clampToGround: Define si el objeto geográfico se debe ajustar al suelo. Si las coordenadas
   *   son 3D, por defecto es falso, en caso contrario es verdadero.
   *   Solo disponible para Cesium.
   * - cache: false (predeterminado), true o { ttlMs, maxEntries, maxBytes }.
   *   Valores por defecto: 60000 ms, 32 entradas y 16777216 bytes estimados de texto.
   *   Cada instancia reutiliza únicamente peticiones con URL y contexto exactamente iguales.
   *   La caducidad comienza al validar la respuesta y no se prolonga con los accesos.
   * - bboxStrategy: Booleano, false por defecto. Consulta el bbox visible en CRS84
   *   al terminar el desplazamiento o zoom y al cambiar el tamaño del mapa.
   *   Sustituye las entidades anteriores tras una carga válida, sin acumular zonas.
   *   El bbox visible sustituye al parámetro bbox fijo. Solo admite consultas de colección.
   *   Compatible con caché exacta y throttling; no reutiliza por solapamiento espacial.
   *   Las fuentes externas vendorOpts.source mantienen su propia gestión.
   * - throttleMs: Intervalo mínimo entre inicios de peticiones; 0 lo desactiva.
   *   Durante la espera se conserva solo la última consulta pendiente.
   *   refresh() y refreshInterval descargan datos nuevos y renuevan la caché.
   * - editingLimits: límites de zona con pageSize, maxFeatures, maxCoordinates
   *   y maxBytes; por defecto 250, 1000, 100000 y 10485760.
   * - transactionParameters / transactionHeaders: valores para escrituras y
   *   comprobaciones de conflicto, independientes de los parámetros de lectura.
   * - dataideeDefaultProperties: propiedades no vacías que se añaden a las altas.
   * @param {Object} vendorOpts Opciones para la biblioteca base.
   * - filter: Expresión CQL2 en texto o un objeto CQL2 JSON. Una cadena usa
   *   cql2-text por defecto y un objeto usa cql2-json.
   * - filterLang: Lenguaje CQL2 explícito para filter (por ejemplo, cql2-text
   *   o cql2-json).
   * - cql: Alias heredado para enviar un filtro mediante el parámetro filter.
   * - getFeature: Parámetros adicionales de la petición de items. El token de
   *   autenticación (token) es opcional: las capas públicas no lo necesitan.
   * - tokenLocation: Ubicación del token: 'header' (predeterminado), que envía
   *   Authorization: Bearer <token>, o 'query', que lo envía como ?token=<token>.
   *   Si se rechaza (HTTP 401/403), la capa queda vacía y dispara LOAD_UNAUTHORIZED.
   * Ejemplo vendorOptions:
   * <pre><code>
   * {
   *   filter: { op: '=', args: [{ property: 'status' }, 'active'] },
   *   filterLang: 'cql2-json',
   *   getFeature: { token: tokenAutenticacion },
   *   // tokenLocation: 'query', // Alternativa de compatibilidad.
   * }
   * </code></pre>
   * @api
   */
  constructor(userParams, opt = {}, vendorOpts = {}) {
    // Comprueba si los parámetros son null or empty
    if (isNullOrEmpty(userParams)) {
      Exception(getValue('exception').no_param);
    }

    if (!isUndefined(userParams.transparent)) {
      // eslint-disable-next-line no-console
      console.warn(getValue('exception').transparent_deprecated);
    }

    // This layer is of parameters.
    const parameters = parameter.layer(userParams, LayerType.DataIDEE);

    const optionsVar = opt;
    if (optionsVar.bboxStrategy !== undefined && typeof optionsVar.bboxStrategy !== 'boolean') {
      throw new TypeError('DataIDEE bboxStrategy must be a boolean.');
    }
    if (optionsVar.bboxStrategy === true && !isNullOrEmpty(parameters.id)) {
      throw new TypeError('DataIDEE bboxStrategy requires a collection, without an item id.');
    }
    RequestManager.normalizeOptions({
      cache: optionsVar.cache,
      throttleMs: optionsVar.throttleMs,
    });

    if (typeof userParams !== 'string') {
      optionsVar.maxExtent = userParams.maxExtent;
    }

    // Comprueba si la implementación puede crear capas DataIDEE
    if (isUndefined(DataIDEEImpl) || (isObject(DataIDEEImpl)
      && isNullOrEmpty(Object.keys(DataIDEEImpl)))) {
      Exception(getValue('exception').OGCAPIFeatureslayer_method);
    }

    /**
     * Implementación
     * @public
     * @implements {IDEE.impl.layer.DataIDEE}
     * @type {IDEE.impl.layer.DataIDEE}
     */
    const impl = new DataIDEEImpl(optionsVar, vendorOpts);

    // Llama al contructor del que se extiende la clase
    super(parameters, optionsVar, undefined, impl);
    this.constructorParameters = { userParams, opt, vendorOpts };

    /**
     * DataIDEE legend: Indica el nombre que queremos
     * que aparezca en el árbol de contenidos, si lo hay.
     */
    this.legend = parameters.legend;

    /**
     * DataIDEE url: URL del servicio.
     */
    this.url = parameters.url;

    /**
     * DataIDEE name: Nombre de la capa en el servidor.
     */
    this.name = parameters.name;

    /**
     * DataIDEE limit: Límite de objetos geográficos a mostrar.
     */
    this.limit = parameters.limit;

    /**
     * DataIDEE bbox: Filtro para mostrar los resultados en un bbox específico.
     */
    this.bbox = parameters.bbox;

    /**
     * DataIDEE format: Formato de los objetos geográficos.
     */
    this.format = parameters.format;

    /**
     * DataIDEE offset: Determina desde que número comenzará a leer
     * los objetos geográficos.
     */
    this.offset = parameters.offset;

    /**
     * DataIDEE id: Filtro por ID para un objeto geográfico.
     */
    this.id = parameters.id;

    /**
     * DataIDEE extract: Activa la consulta al hacer clic sobre un objeto geográfico,
     * por defecto verdadero.
     */
    this.extract = parameters.extract === undefined ? true : parameters.extract;

    /**
     * DataIDEE cql: Declaración CQL para filtrar las características
     * (Sólo disponible para servicios en PostgreSQL).
     */
    this.cql = vendorOpts.cql;

    /**
     * DataIDEE conditional: Declaración de filtros literales por atributos del
     * objeto geográfico.
     */
    this.conditional = parameters.conditional;

    /**
     * DataIDEE crs: Definición de la proyección de los datos.
     */
    this.crs = parameters.crs;

    /**
     * DataIDEE geometry: Tipo de geometría.
     */
    this.geometry = parameters.geometry;

    /**
     * DataIDEE minZoom: Límite del zoom mínimo.
     * @public
     * @type {Number}
     */
    this.minZoom = optionsVar.minZoom || Number.NEGATIVE_INFINITY;

    /**
     * DataIDEE maxZoom: Límite del zoom máximo.
     * @public
     * @type {Number}
     */
    this.maxZoom = optionsVar.maxZoom || Number.POSITIVE_INFINITY;

    /**
     * DataIDEE opt: Opciones.
     */
    this.opt = opt;

    /**
     * Token del último aviso de acceso no autorizado.
     * @private
     * @type {String|null}
     */
    this.notifiedToken_ = null;

    impl.on(EventType.LOAD_UNAUTHORIZED, this.notifyUnauthorized_, this);
  }

  /**
   * Devuelve el nombre de la capa.
   * @function
   * @return {IDEE.layer.OGCAPIFeature.impl.name} Devuelve el nombre de la capa.
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
   * @return { IDEE.layer.OGCAPIFeature.impl.limit } Devuelve el límite de resultados.
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
   * @return { IDEE.layer.OGCAPIFeature.impl.bbox } Devuelve el rectángulo geográfico envolvente.
   * @api
   */
  get bbox() {
    return this.getImpl().bbox;
  }

  /**
   * Sobrescribe el rectángulo geográfico envolvente.
   * Se utiliza en la siguiente carga; asignarlo no inicia una petición.
   * refresh() solicita datos nuevos, omitiendo la caché almacenada.
   * Con bboxStrategy activo se utiliza siempre el bbox visible, no este filtro fijo.
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
   * @return { IDEE.layer.OGCAPIFeature.impl.format } Devuelve el formato aplicado.
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
   * @return { IDEE.layer.OGCAPIFeature.impl.offset } Devuelve el offset aplicado.
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
   * @return { IDEE.layer.OGCAPIFeature.impl.id } Devuelve el id aplicado.
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
   * @return {IDEE.layer.OGCAPIFeature.impl.conditional} Devuelve el conditional aplicado.
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
   * @param {IDEE.Style} styleParam Estilo que se aplicará a la capa.
   * @param {Boolean} applyToFeature Si el valor es verdadero se aplicará a los objetos geográficos,
   * falso no.
   * Por defecto, falso.
   * @param {IDEE.layer.DataIDEE.DEFAULT_OPTIONS_STYLE} defaultStyle Estilo por defecto,
   * se define en DataIDEE.js.
   * @api
   */
  setStyle(
    styleParam,
    applyToFeature = false,
    defaultStyle = DataIDEE.DEFAULT_OPTS_STYLE,
  ) {
    super.setStyle(styleParam, applyToFeature, defaultStyle);
  }

  /**
   * Fuerza una recarga de red y actualiza la caché tras una respuesta válida.
   * @public
   * @function
   * @api
   */
  refresh() {
    this.getImpl().refreshFresh();
    this.redraw();
  }

  /**
   * Invalida las respuestas guardadas de esta instancia sin hacer una petición.
   * @public
   * @function
   * @api
   */
  clearCache() {
    this.getImpl().clearCache();
  }

  /** Returns advertised DataIDEE transaction capabilities for this collection. */
  getEditingCapabilities() {
    return this.getEditingImpl_().getEditingCapabilities();
  }

  /** Loads a complete, bounded CRS84 work area and pauses DataIDEE refreshes. */
  beginEditing({ bbox }) {
    return this.getEditingImpl_().beginEditing({ bbox });
  }

  /** Returns the active editing session for generic editing controls. */
  getEditingSession() { return this.getEditingImpl_().getEditingSession(); }

  /** Releases the DataIDEE edit-session refresh lock. */
  endEditing(refresh = true) {
    return this.getEditingImpl_().endEditing(refresh);
  }

  /** Creates a GeoJSON feature in the configured collection. */
  createFeature(feature) {
    return this.getEditingImpl_().createFeature(feature);
  }

  /** Reads one feature for optimistic conflict detection during an explicit save. */
  getEditingFeature(id) {
    return this.getEditingImpl_().getEditingFeature(id);
  }

  /** Updates a GeoJSON feature, preserving the caller's properties. */
  updateFeature(id, feature, method, etag) {
    return this.getEditingImpl_().updateFeature(id, feature, method, etag);
  }

  /** Deletes one feature by its server identifier. */
  deleteFeature(id, etag) {
    return this.getEditingImpl_().deleteFeature(id, etag);
  }

  getEditingImpl_() {
    const impl = this.getImpl();
    if (typeof impl.getEditingCapabilities !== 'function') {
      throw new Error('DataIDEE spatial editing is only available in OpenLayers.');
    }
    return impl;
  }

  /**
   * Devuelve el token de autenticación de la capa, con independencia de dónde se envíe.
   *
   * @function
   * @returns {String|undefined} Token configurado en getFeature.token.
   * @api
   */
  getToken() {
    return this.getImpl().getToken();
  }

  /**
   * Cambia el token de autenticación y recarga la capa. Las respuestas
   * guardadas con el token anterior se descartan.
   *
   * @function
   * @param {String} token Nuevo token. Si es vacío, se elimina.
   * @api
   */
  setToken(token) {
    this.getImpl().setToken(token);
  }

  /**
   * Notifica que el servicio ha rechazado la petición de la capa (HTTP 401/403).
   * El aviso al usuario se muestra una única vez por token.
   * @private
   * @function
   */
  notifyUnauthorized_() {
    this.fire(EventType.LOAD_UNAUTHORIZED, [this]);
    const token = this.getToken() || '';
    if (this.notifiedToken_ !== token) {
      this.notifiedToken_ = token;
      Dialog.error(getValue('dialog').dataidee_unauthorized);
    }
  }

  /**
   * Devuelve el valor de la propiedad "extract". La propiedad "extract" tiene la
   * siguiente función: Activa la consulta al hacer clic en la característica,
   * por defecto verdadero.
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
   * siguiente función: Activa la consulta al hacer clic en la característica,
   * por defecto verdadero.
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
      this.getImpl().extract = true;
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
    if (obj instanceof DataIDEE) {
      equals = (this.url === obj.url);
      equals = equals && (this.name === obj.name);
      equals = equals && (this.legend === obj.legend);
      equals = equals && (this.limit === obj.limit);
      equals = equals && (this.format === obj.format);
      equals = equals && (this.offset === obj.offset);
      equals = equals && (this.id === obj.id);
      equals = equals && (this.extract === obj.extract);
      equals = equals && (this.idLayer === obj.idLayer);
      equals = equals && (this.template === obj.template);
    }
    return equals;
  }
}

/**
 * Parámetros predeterminados para las capas DataIDEE de estilo.
 * @const
 * @type {Object}
 * @public
 * @api
 */
DataIDEE.DEFAULT_PARAMS = {
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
 * Estilo predeterminado para capas DataIDEE.
 * @const
 * @type {Object}
 * @public
 * @api
 */
DataIDEE.DEFAULT_OPTS_STYLE = {
  point: {
    ...DataIDEE.DEFAULT_PARAMS,
    radius: 5,
  },
  line: {
    ...DataIDEE.DEFAULT_PARAMS,
  },
  polygon: {
    ...DataIDEE.DEFAULT_PARAMS,
  },
};

export default DataIDEE;
