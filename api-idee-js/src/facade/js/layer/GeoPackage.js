/**
 * @module IDEE/layer/GeoPackage
 */
import MObject from '../Object';
import Layer from './Layer';
import * as LayerType from './Type';
import GeoPackageTile from './GeoPackageTile';
import GeoJSON from './GeoJSON';
import {
  generateRandom, escapeXSS, addParameters, isNull, isUndefined, serializeUrlParams,
  isNullOrEmpty, isString, isBoolean,
} from '../util/Utils';
import * as EventType from '../event/eventtype';
import * as Dialog from '../dialog';
import Style from '../style/Style';
import Exception from '../exception/exception';
import { getValue } from '../i18n/language';
import { normalizeParameters, copyOptions } from '../datasource/geopackage/parameters';
import resolveTableOptions from '../datasource/geopackage/tableOptions';
import GeoPackageSerializer from '../datasource/geopackage/Serializer';
import GeoPackageLayerFactory from '../datasource/geopackage/LayerFactory';
import GeoPackageRefreshCoordinator from '../datasource/geopackage/RefreshCoordinator';
import {
  createDefaultStrategies, getTableStrategyName, getAccessName, createDefaultAccess,
  LOAD_STRATEGY_NAMES,
} from '../datasource/geopackage/strategies';

/**
 * Une extensiones [minX, minY, maxX, maxY] válidas.
 * @param {Array<Array<Number>>} extents Extensiones.
 * @returns {Array<Number>|null} Extensión que las contiene o null si no hay ninguna.
 */
const unionExtents = (extents) => {
  const valid = extents.filter((extent) => Array.isArray(extent) && extent.length === 4
    && extent.every(Number.isFinite));
  if (valid.length === 0) {
    return null;
  }
  return [
    Math.min(...valid.map((extent) => extent[0])),
    Math.min(...valid.map((extent) => extent[1])),
    Math.max(...valid.map((extent) => extent[2])),
    Math.max(...valid.map((extent) => extent[3])),
  ];
};

/**
 * @classdesc
 *
 * El formato Geopackage permite agrupar múltiples capas, tanto vectoriales como raster,
 * en un contenedor SQLite. Cada tabla se añade al mapa como una capa hija
 * (IDEE.layer.GeoJSON o IDEE.layer.GeoPackageTile) y el paquete ofrece la API común
 * de las capas: visibilidad, opacidad, z-index, extensión, zoom mínimo y máximo,
 * recarga (refresh, refreshInterval) y cadena REST.
 *
 * La carga se elige con loadStrategy:
 * - full: descarga el fichero y carga todas las entidades de cada tabla.
 * - bbox (equivale a tiled: true): descarga el fichero y carga las entidades de la
 *   extensión visible, usando el índice espacial R*Tree del fichero si existe.
 * - range: pide con rangos HTTP solo las partes del fichero que necesita (cabecera,
 *   índice espacial y filas de la extensión visible). El servidor debe admitir
 *   peticiones Range y, si es de otro origen, permitir la cabecera Range por CORS. Si
 *   no lo admite, o el fichero tiene geometrías curvas o teselas no alineadas con
 *   WebMercator, se descarga completo automáticamente.
 *
 * También puede declararse dentro de la propiedad layers de la configuración del mapa
 * o por la API-REST (GeoPackage*leyenda*url*nombre*loadStrategy):
 * <pre><code>
 * {
 *   type: 'GeoPackage',
 *   url: '/data/reference.gpkg',
 *   name: 'reference',
 *   loadStrategy: 'range',
 *   style: new IDEE.style.Generic({ point: { radius: 5 } }),
 *   tables: { places: { visibility: false } },
 * }
 * </code></pre>
 *
 * @property {String} idLayer Identificador de la capa.
 * @property {String} name Nombre del paquete.
 * @property {String} legend Leyenda del paquete.
 * @property {String} url URL del fichero completo, si se ha proporcionado.
 * @property {File|Response|ArrayBuffer|Uint8Array} source Fuente binaria, si se ha proporcionado.
 * @property {IDEE.layer.GeoPackageTile|IDEE.layer.GeoJSON} layers_ Capas de GeoPackage.
 * @property {IDEE.GeoPackageConnector} connector_ Conector.
 * @property {Object} options Opciones de la capa.
 * @property {Boolean} tiled Activa la carga vectorial por extensión visible.
 * @property {String} loadStrategy Estrategia de carga: full, bbox o range.
 * @property {Object|null} metadata Metadatos estructurados del GeoPackage.
 * @property {Object|null} properties Información estructurada y datos vectoriales del paquete.
 * @property {Boolean} loadedVectorLayers_ Determina si las capas vectoriales están cargadas.
 * @property {Boolean} loadedTileLayers_ Determina si las capas teseladas están cargadas.
 *
 * @api
 * @extends {IDEE.Object}
 */
class GeoPackage extends MObject {
  /**
   * Constructor principal de la clase. Crea una capa GeoPackage
   * con parámetros especificados por el usuario.
   *
   * @constructor
   * @param {Response|File|ArrayBuffer|Uint8Array|Object} data Fichero GeoPackage o parámetros.
   * - source: Fuente binaria. No se puede combinar con url.
   * - url: URL del fichero completo, descargado y procesado en el navegador.
   * - name: Nombre del paquete.
   * - legend: Leyenda del paquete.
   * La forma histórica con el fichero como primer argumento sigue siendo válida.
   * @param {Object} options Parámetros opcionales proporcionados por el usuario
   * para las capas vectoriales o ráster contenidas en el GeoPackage.
   * En la nueva firma contiene opciones comunes (style, opacity, visibility, etc.) y
   * tables, cuyas claves son los nombres de tabla y cuyos valores sobrescriben las comunes.
   * tiled activa la consulta de las tablas vectoriales según la extensión visible.
   * loadStrategy ('full', 'bbox' o 'range') elige cómo se lee el paquete y cómo cargan
   * sus tablas; un valor booleano de tiled en una tabla prevalece para esa tabla.
   * rangeBlockSize fija el tamaño en bytes de los bloques pedidos con 'range' (4096 por
   * defecto).
   * tile y vector mantienen las opciones de los proveedores, indexadas por tabla.
   * tableNames limita las tablas que se cargan (p. ej. al reconstruir una cadena REST).
   * No se modifican los objetos del llamador. Las instancias de estilo se conservan.
   * La firma histórica mantiene las opciones de tabla directamente en el segundo argumento:
   * <pre><code>
   * {
   *  id_capa_vectorial_en_geopackage: {
   *    extent,
   *    name,
   *    legend,
   *  },
   *  id_capa_raster_en_geopackage: {
   *    transparent,
   *    extent,
   *    name,
   *    legend,
   *  }
   * }
   * </code></pre>
   * @param {Object} [dependencies] Colaboradores, sustituibles en pruebas: access,
   * strategies, serializer y layerFactory.
   * @extends {IDEE.Object}
   * @api
   */
  constructor(data, options, dependencies = {}) {
    super({});
    const parameters = normalizeParameters(data, options);
    const {
      source, url, name, legend,
    } = parameters;
    const normalizedOptions = parameters.options;

    /**
     * Distingue los parámetros normalizados de la firma histórica con datos binarios.
     * @private
     * @type {Boolean}
     */
    this.legacyParameters_ = parameters.legacy;
    const sourceParameters = {
      source, url, name, legend,
    };
    this.constructorParameters = { data, options };

    /**
     * Serializador JSON y REST del paquete.
     * @private
     * @type {GeoPackageSerializer}
     */
    this.serializer_ = dependencies.serializer || new GeoPackageSerializer({
      type: LayerType.GeoPackage,
      isStyle: (value) => value instanceof Style,
      isRemoteURL: (value) => Layer.isAutoRefreshRemoteURL(value),
      toRestURL: (value) => Layer.toRestURL(value),
      serializeUrlParams,
    });

    /**
     * Factoría de las capas hijas.
     * @private
     * @type {GeoPackageLayerFactory}
     */
    this.layerFactory_ = dependencies.layerFactory || new GeoPackageLayerFactory({
      VectorLayer: GeoJSON,
      TileLayer: GeoPackageTile,
    });

    /**
     * Id de la capa.
     */
    this.idLayer = generateRandom(LayerType.GeoPackage, name || normalizedOptions.name).replace(/[^a-zA-Z0-9\-_]/g, '');

    /** Nombre, leyenda y origen del paquete, independientes de sus tablas. */
    this.name = name || normalizedOptions.name || this.idLayer;
    this.legend = legend === undefined ? this.name : legend;
    this.source = source;
    this.url = url;

    /** Metadatos estructurados disponibles tras completar whenReady(). */
    this.metadata = parameters.metadata;

    /** Información de las tablas, incluyendo los datos de las tablas vectoriales. */
    this.properties = parameters.properties;

    /**
     * Capas
     */
    this.layers_ = Object.create(null);

    /** Proveedores vectoriales, indexados por el nombre original de tabla. */
    this.vectorProviders_ = Object.create(null);

    /**
     * Recargas de las tablas; las simultáneas comparten una sola lectura del paquete.
     * @private
     * @type {GeoPackageRefreshCoordinator}
     */
    this.refreshCoordinator_ = new GeoPackageRefreshCoordinator({
      createReader: () => this.access_.createReader({
        url: addParameters(this.url, { _ideeRefresh: Date.now() }),
      }, { tile: this.options.tile, vector: this.options.vector }),
    });

    const { loadStrategy } = parameters;
    if (!isUndefined(loadStrategy) && !LOAD_STRATEGY_NAMES.includes(loadStrategy)) {
      Exception(getValue('exception').geopackage_load_strategy);
    }

    /**
     * Estrategia de carga del paquete: full, bbox o range.
     * @type {String}
     */
    this.loadStrategy = loadStrategy || (normalizedOptions.tiled === true ? 'bbox' : 'full');

    /**
     * Acceso al paquete.
     * @private
     * @type {PackageAccess}
     */
    this.access_ = dependencies.access || createDefaultAccess(getAccessName(this.loadStrategy), {
      blockSize: parameters.rangeBlockSize,
    });

    /**
     * Estrategias de carga de las tablas vectoriales.
     * @private
     * @type {LoadStrategyRegistry}
     */
    this.strategies_ = dependencies.strategies || createDefaultStrategies();

    /** Opciones propias del paquete, sin compartir objetos de configuración mutables. */
    this.options = normalizedOptions;
    this.tiled = this.options.tiled === true;
    this.tableOptions_ = parameters.tables;
    this.commonOptions_ = parameters.common;

    /**
     * Tablas que se cargan; null carga todas.
     * @private
     * @type {Array<String>|null}
     */
    this.tableNames_ = parameters.tableNames;

    /**
     * Conector
     */
    this.connector_ = this.access_.createReader(sourceParameters, parameters.providerOptions);

    /**
     * Estado de visualización asignado al paquete; se aplica también a las capas que
     * se crean después.
     * @private
     * @type {Object}
     */
    this.display_ = {};

    /**
     * Revisión de las recargas manuales; cambia al quitar las capas del mapa.
     * @private
     * @type {Number}
     */
    this.refreshRevision_ = 0;

    /**
     * Determina si las capas vectoriales están cargadas.
     */
    this.loadedVectorLayers_ = false;

    /**
     * Determina si las capas teseladas están cargadas.
     */
    this.loadedTileLayers_ = false;

    /**
     * Inicialización única de los proveedores y de las capas, independiente del mapa.
     * @private
     * @type {Promise<GeoPackage>}
     */
    this.readyPromise_ = Promise.all([
      this.connector_.getVectorProviders(),
      this.connector_.getTileProviders(),
      this.connector_.getMetadata(),
    ]).then(async ([vectorProviders, tileProviders, packageMetadata]) => {
      const initialSources = Object.create(null);
      await Promise.all(vectorProviders.map(async (provider) => {
        const tableName = provider.getTableName();
        const strategy = this.getTableStrategy_(tableName);
        await strategy.prepare(provider);
        if (this.isTableLoaded_(tableName)) {
          initialSources[tableName] = await strategy.getInitialSource(provider);
        }
      }));
      this.createLayers_(vectorProviders, tileProviders, packageMetadata, initialSources);
      this.metadata = copyOptions(packageMetadata);
      return this;
    });
    // Permite consultar whenReady después de un fallo sin generar rechazos no gestionados.
    this.readyPromise_.catch(() => undefined);
  }

  /**
   * Este método devuelve el identificador de la capa.
   *
   * @function
   * @returns {String} Devuelve el identificador de la capa.
   * @api
   */
  getId() {
    return this.idLayer;
  }

  /**
   * Devuelve el tipo de layer.
   *
   * @function
   * @getter
   * @returns {String} Tipo.
   * @api
   */
  get type() {
    return LayerType.GeoPackage;
  }

  /**
   * Combina opciones comunes y específicas sin modificar ninguna de las dos.
   * @private
   * @param {String} tableName Nombre original de la tabla.
   * @param {Boolean} raster Indica si se trata de una tabla de teselas.
   * @returns {Object} Opciones independientes para la capa hija.
   */
  getTableOptions_(tableName, raster = false) {
    return resolveTableOptions(tableName, {
      common: this.commonOptions_,
      tables: this.tableOptions_,
      legacy: this.legacyParameters_,
      packageName: this.name,
    }, raster);
  }

  /**
   * Devuelve las opciones con las que se crea la capa de una tabla, incluido el intervalo
   * de recarga asignado al paquete antes de crearla.
   * @private
   * @param {String} tableName Nombre original de la tabla.
   * @param {Boolean} raster Indica si se trata de una tabla de teselas.
   * @returns {Object} Opciones de la capa hija.
   */
  getChildOptions_(tableName, raster = false) {
    const options = this.getTableOptions_(tableName, raster);
    if (!isUndefined(this.display_.refreshInterval)) {
      options.refreshInterval = this.display_.refreshInterval;
    }
    return options;
  }

  /**
   * Devuelve la estrategia de carga de una tabla vectorial.
   * @private
   * @param {String} tableName Nombre original de la tabla.
   * @returns {LoadStrategy} Estrategia.
   */
  getTableStrategy_(tableName) {
    return this.strategies_.get(getTableStrategyName(
      this.getTableOptions_(tableName),
      this.loadStrategy,
    ));
  }

  /**
   * Indica si se crea la capa de una tabla (tableNames limita las tablas).
   * @private
   * @param {String} tableName Nombre original de la tabla.
   * @returns {Boolean} Verdadero si la tabla se carga.
   */
  isTableLoaded_(tableName) {
    return isNull(this.tableNames_) || this.tableNames_.includes(tableName);
  }

  /**
   * Construye todas las capas antes de publicar la colección del paquete.
   * @private
   * @param {Array} vectorProviders Proveedores vectoriales.
   * @param {Array} tileProviders Proveedores ráster.
   * @param {Object} metadata Metadatos estructurados del GeoPackage.
   * @param {Object<String, Object>} initialSources Colección inicial de cada tabla vectorial.
   */
  createLayers_(vectorProviders, tileProviders, metadata, initialSources) {
    const layers = Object.create(null);
    const tables = Object.create(null);
    const isLoaded = (provider) => this.isTableLoaded_(provider.getTableName());
    vectorProviders.filter(isLoaded).forEach((vectorProvider) => {
      const tableName = vectorProvider.getTableName();
      const options = this.getChildOptions_(tableName);
      const strategy = this.getTableStrategy_(tableName);
      const source = initialSources[tableName];
      this.vectorProviders_[tableName] = vectorProvider;
      layers[tableName] = this.layerFactory_.createVectorLayer(
        options,
        source,
        (isCurrent, apply, extent, projection) => (
          this.refreshTable_(tableName, false, isCurrent, apply, extent, projection)
        ),
        strategy.getLoaders(() => this.vectorProviders_[tableName]),
      );
      tables[tableName] = {
        type: 'features',
        metadata: copyOptions(metadata.tables[tableName]),
        data: source,
      };
    });
    tileProviders.filter(isLoaded).forEach((tileProvider) => {
      const tableName = tileProvider.getTableName();
      layers[tableName] = this.layerFactory_.createTileLayer(
        this.getChildOptions_(tableName, true),
        tileProvider,
        (isCurrent, apply) => this.refreshTable_(tableName, true, isCurrent, apply),
      );
      tables[tableName] = {
        type: 'tiles',
        metadata: copyOptions(metadata.tables[tableName]),
      };
    });
    metadata.attributeTables.forEach((tableName) => {
      tables[tableName] = {
        type: 'attributes',
        metadata: copyOptions(metadata.tables[tableName]),
      };
    });
    this.refreshCoordinator_.register(Object.keys(layers), this.connector_);
    Object.keys(layers).forEach((name) => {
      // eslint-disable-next-line no-underscore-dangle
      layers[name].setRestContainer_(this, name);
    });
    this.applyDisplay_(Object.values(layers));
    this.layers_ = layers;
    this.properties = { tables };
    this.loadedVectorLayers_ = true;
    this.loadedTileLayers_ = true;
  }

  /**
   * Recarga una tabla remota conservando las capas y compartiendo la descarga en curso.
   * Cada hija mantiene su intervalo, pausa por edición y comprobación de vigencia.
   * Las fuentes binarias/locales no tienen un origen remoto que volver a consultar.
   * @private
   */
  async refreshTable_(tableName, raster, isCurrent, apply, extent, projection) {
    if (!Layer.isAutoRefreshRemoteURL(this.url) || !isCurrent()) return;
    try {
      await this.refreshCoordinator_.refresh(tableName, isCurrent, async ({
        vectors, tiles, metadata,
      }) => {
        const provider = (raster ? tiles : vectors)
          .find((item) => item.getTableName() === tableName);
        // Un cambio de esquema no debe borrar una tabla ni las ediciones del usuario.
        if (!provider) throw new Error(`GeoPackage: ${tableName}`);
        const source = raster ? undefined
          : await this.getTableStrategy_(tableName).refresh(provider, extent, projection);
        if (!isCurrent() || !await apply(raster ? provider : source)) return false;
        if (!raster) this.vectorProviders_[tableName] = provider;
        this.metadata.tables[tableName] = copyOptions(metadata.tables[tableName]);
        this.properties.tables[tableName] = {
          type: raster ? 'tiles' : 'features',
          metadata: copyOptions(metadata.tables[tableName]),
          ...(raster ? {} : { data: source }),
        };
        return true;
      });
    } finally {
      this.connector_ = this.refreshCoordinator_.getCurrentReader();
    }
  }

  /**
   * Espera a que los proveedores y las capas hijas estén construidos.
   * No añade capas al mapa ni espera al renderizado de entidades o imágenes.
   * Devuelve siempre la misma promesa; los errores de lectura y construcción se propagan.
   * @public
   * @returns {Promise<GeoPackage>} Este paquete inicializado.
   * @api
   */
  whenReady() {
    return this.readyPromise_;
  }

  /**
   * Devuelve una copia de los metadatos estructurados del GeoPackage.
   * Debe invocarse después de que whenReady() haya finalizado.
   *
   * @function
   * @public
   * @returns {Object} Metadatos del contenedor y de sus tablas.
   * @api
   */
  getMetadata() {
    if (!this.loadedVectorLayers_ || !this.loadedTileLayers_) {
      Exception(getValue('exception').geopackage_not_ready);
    }
    return copyOptions(this.metadata);
  }

  /**
   * Devuelve una representación GeoJSON con todas las entidades de las tablas vectoriales.
   * El nombre original de la tabla se conserva en cada entidad mediante el miembro adicional
   * tableName, sin modificar sus propiedades. El CRS solo se incluye cuando es común a todas
   * las tablas exportadas.
   * Debe invocarse después de que whenReady() haya finalizado.
   *
   * @function
   * @public
   * @returns {Object} Colección GeoJSON con las entidades vectoriales del GeoPackage.
   * @api
   */
  toGeoJSON() {
    const metadata = this.getMetadata();
    const collections = metadata.featureTables
      .filter((tableName) => !isUndefined(this.vectorProviders_[tableName]))
      .map((tableName) => ({ tableName, data: this.getTableGeoJSON_(tableName) }));
    const crs = collections.length > 0 ? collections[0].data.crs : undefined;
    const commonCrs = crs && collections.every(({ data }) => (
      JSON.stringify(data.crs) === JSON.stringify(crs)
    ));
    return {
      type: 'FeatureCollection',
      ...(commonCrs ? { crs: copyOptions(crs) } : {}),
      features: collections.flatMap(({ tableName, data }) => data.features.map((feature) => ({
        ...copyOptions(feature),
        tableName,
      }))),
    };
  }

  /**
   * Devuelve las entidades de una tabla para toGeoJSON. Si el proveedor lee bajo demanda
   * (estrategia range), devuelve las entidades ya cargadas en la capa, en EPSG:4326.
   * @private
   * @param {String} tableName Nombre original de la tabla.
   * @returns {Object} Colección GeoJSON.
   */
  getTableGeoJSON_(tableName) {
    const provider = this.vectorProviders_[tableName];
    if (!provider.loadsOnDemand?.()) {
      return provider.getGeoJSON();
    }
    try {
      return this.layers_[tableName].toGeoJSON();
    } catch (error) {
      return { type: 'FeatureCollection', features: [] };
    }
  }

  /**
   * Exporta una configuración que puede utilizarse para crear otra instancia.
   * Conserva la referencia de una fuente binaria; una fuente local no puede persistirse
   * únicamente mediante JSON.stringify y debe volver a adjuntarse al restaurarla.
   * Debe invocarse después de que whenReady() haya finalizado.
   *
   * @function
   * @public
   * @returns {Object} Configuración y metadatos del GeoPackage.
   * @api
   */
  toJSON() {
    const metadata = this.getMetadata();
    return this.serializer_.toJSON({
      url: this.url,
      source: this.source,
      name: this.name,
      legend: this.legend,
      options: this.options,
      metadata,
      properties: this.properties,
    });
  }

  /**
   * Este método devuelve la cadena de carga REST del GeoPackage, con el estado
   * actual de sus tablas. Solo es representable si el fichero tiene URL remota.
   *
   * @function
   * @param {Array<String>} tableNames Tablas que se comparten; por defecto, todas.
   * @returns {String|null} Cadena REST; null si el fichero es local o no hay tablas.
   * @api
   */
  getRestLayer(tableNames) {
    return this.serializer_.getRestLayer({
      legacy: this.legacyParameters_,
      url: this.url,
      name: this.name,
      legend: this.legend,
      options: this.options,
      layers: this.layers_,
      tableNames: this.tableNames_,
    }, tableNames);
  }

  /**
   * Este método agrega la capa al mapa.
   *
   * @function
   * @param {M/Map} map
   * @param {Boolean} addLayer Añade las capas al mapa; falso cuando las gestiona un grupo.
   * @returns {Promise<GeoPackage>} Finalización de la adición, o rechazo de la carga.
   * @api
   */
  addTo(map, addLayer = true) {
    this.map_ = map;
    const addition = {};
    this.pendingAddition_ = addition;
    const loading = this.whenReady().then(() => {
      if (this.pendingAddition_ !== addition) return this;
      if (addLayer) {
        this.getLayers().forEach((layer) => map.addLayers(layer));
      }
      this.fire(EventType.LOAD_LAYERS, [this.layers_]);
      return this;
    });
    loading.catch((error) => {
      // Los grupos gestionan su propia promesa y muestran los errores de sus hijos.
      if (map && addLayer) Dialog.error(escapeXSS(String(error)));
    });
    this.fire(EventType.ADDED_TO_MAP);
    return loading;
  }

  /**
   * Este método obtiene las capas de GeoPackage.
   *
   * @function
   * @public
   * @return {Array<IDEE.layer.GeoPackageTile|IDEE.layer.GeoJSON>} Devuelve las capas añadidas
   * al GeoPackage.
   * @api
   */
  getLayers() {
    return Object.values(this.layers_);
  }

  /**
   * Este método obtiene la capa de GeoPackage por el nombre de la tabla.
   *
   * @function
   * @public
   * @param {string} tableName Nombre de la tabla.
   * @return {Null|M.layer.GeoPackageTile|M.layer.GeoJSON} Devuelve la capa de GeoPackage
   * con ese nombre de tabla, en caso contrario devuelve null.
   * @api
   */
  getLayer(tableName) {
    return this.layers_[tableName] || null;
  }

  /**
   * Este método elimina todas las capas de GeoPackage.
   *
   * @function
   * @public
   * @api
   */
  removeLayers() {
    this.pendingAddition_ = null;
    this.refreshRevision_ += 1;
    this.map_?.removeLayers(this.getLayers());
  }

  /**
   * Este método elimina la capa con el nombre de la tabla proporcionado por el usuario.
   *
   * @function
   * @public
   * @param {string} tableName Nombre de la tabla.
   * @api
   */
  removeLayer(tableName) {
    this.map_.removeLayers(this.getLayer(tableName));
  }

  /**
   * Aplica a las capas el estado de visualización asignado al paquete.
   * @private
   * @param {Array<IDEE.layer.GeoJSON|IDEE.layer.GeoPackageTile>} layers Capas.
   */
  applyDisplay_(layers) {
    const {
      visibility, opacity, minZoom, maxZoom,
    } = this.display_;
    layers.forEach((layer) => {
      if (!isUndefined(visibility)) layer.setVisible(visibility);
      if (!isUndefined(opacity)) layer.setOpacity(opacity);
      if (!isUndefined(minZoom)) layer.setMinZoom(minZoom);
      if (!isUndefined(maxZoom)) layer.setMaxZoom(maxZoom);
    });
    this.orderLayers_(layers);
  }

  /**
   * Asigna z-index consecutivos desde el del paquete, manteniendo el orden relativo
   * de las capas.
   * @private
   * @param {Array<IDEE.layer.GeoJSON|IDEE.layer.GeoPackageTile>} layers Capas.
   */
  orderLayers_(layers) {
    const { zIndex } = this.display_;
    if (isNullOrEmpty(zIndex)) return;
    const position = (layer, index) => [isNullOrEmpty(layer.getZIndex())
      ? Number.POSITIVE_INFINITY : layer.getZIndex(), index];
    layers.map((layer, index) => ({ layer, order: position(layer, index) }))
      .sort((a, b) => a.order[0] - b.order[0] || a.order[1] - b.order[1])
      .forEach(({ layer }, index) => layer.setZIndex(zIndex + index));
  }

  /**
   * Este método cambia la visibilidad de todas las capas del paquete, también de las
   * que se creen después, y lanza el evento LAYER_VISIBILITY_CHANGE del paquete.
   *
   * @function
   * @public
   * @param {Boolean|String} visibilityParam Verdadero visible, falso no visible.
   * @api
   */
  setVisible(visibilityParam) {
    if (isNullOrEmpty(visibilityParam)
      || (!isString(visibilityParam) && !isBoolean(visibilityParam))) {
      Exception(getValue('exception').visibility_param);
    }
    const visibility = /^1|(true)$/i.test(visibilityParam);
    this.display_.visibility = visibility;
    this.getLayers().forEach((layer) => layer.setVisible(visibility));
    this.fire(EventType.LAYER_VISIBILITY_CHANGE, [{ visibility, layer: this }, this]);
  }

  /**
   * Este método indica si el paquete es visible: lo es si alguna de sus capas lo es.
   * Antes de crear las capas devuelve la visibilidad asignada o la de las opciones.
   *
   * @function
   * @public
   * @returns {Boolean} Verdadero si es visible.
   * @api
   */
  isVisible() {
    const layers = this.getLayers();
    if (layers.length > 0) {
      return layers.some((layer) => layer.isVisible());
    }
    if (!isUndefined(this.display_.visibility)) {
      return this.display_.visibility;
    }
    return this.commonOptions_.visibility !== false;
  }

  /**
   * Este método cambia la opacidad de todas las capas del paquete, también de las que
   * se creen después.
   *
   * @function
   * @public
   * @param {Number|String} opacity Opacidad entre 0 y 1.
   * @api
   */
  setOpacity(opacity) {
    this.display_.opacity = opacity;
    this.getLayers().forEach((layer) => layer.setOpacity(opacity));
  }

  /**
   * Este método devuelve la opacidad asignada al paquete; por defecto, la de sus
   * opciones o 1.
   *
   * @function
   * @public
   * @returns {Number} Opacidad.
   * @api
   */
  getOpacity() {
    const opacity = isUndefined(this.display_.opacity)
      ? this.commonOptions_.opacity : this.display_.opacity;
    return isNullOrEmpty(opacity) ? 1 : Number(opacity);
  }

  /**
   * Este método asigna el z-index del paquete: sus capas reciben valores consecutivos
   * desde él, manteniendo su orden relativo. También se aplica a las capas que se creen
   * después.
   *
   * @function
   * @public
   * @param {Number} zIndex Z-index de la capa inferior del paquete.
   * @api
   */
  setZIndex(zIndex) {
    this.display_.zIndex = zIndex;
    this.orderLayers_(this.getLayers());
  }

  /**
   * Este método devuelve el z-index del paquete: el menor de sus capas o, si todavía no
   * tiene capas, el asignado.
   *
   * @function
   * @public
   * @returns {Number} Z-index.
   * @api
   */
  getZIndex() {
    const values = this.getLayers().map((layer) => layer.getZIndex())
      .filter((value) => !isNullOrEmpty(value));
    return values.length > 0 ? Math.min(...values) : this.display_.zIndex;
  }

  /**
   * Este método devuelve de forma síncrona la extensión máxima del paquete: la unión de
   * las extensiones disponibles de sus capas.
   *
   * @function
   * @public
   * @returns {Array<Number>|null} Extensión [minX, minY, maxX, maxY] o null si sus capas
   * todavía no la conocen.
   * @api
   */
  getMaxExtent() {
    return unionExtents(this.getLayers().map((layer) => {
      try {
        return layer.getMaxExtent();
      } catch (error) {
        return null;
      }
    }));
  }

  /**
   * Este método calcula la extensión máxima del paquete cuando sus capas están creadas:
   * la unión de las extensiones calculadas por sus capas.
   *
   * @function
   * @public
   * @returns {Promise<Array<Number>|null>} Extensión [minX, minY, maxX, maxY].
   * @api
   */
  calculateMaxExtent() {
    return this.whenReady()
      .then(() => Promise.all(this.getLayers().map((layer) => (
        Promise.resolve().then(() => layer.calculateMaxExtent()).catch(() => null)
      ))))
      .then(unionExtents);
  }

  /**
   * Este método asigna el zoom mínimo de todas las capas del paquete.
   *
   * @function
   * @public
   * @param {Number} zoom Zoom mínimo.
   * @api
   */
  setMinZoom(zoom) {
    this.display_.minZoom = zoom;
    this.getLayers().forEach((layer) => layer.setMinZoom(zoom));
  }

  /**
   * Este método devuelve el zoom mínimo asignado al paquete o el de sus opciones.
   *
   * @function
   * @public
   * @returns {Number} Zoom mínimo.
   * @api
   */
  getMinZoom() {
    const zoom = isUndefined(this.display_.minZoom)
      ? this.commonOptions_.minZoom : this.display_.minZoom;
    return zoom || Number.NEGATIVE_INFINITY;
  }

  /**
   * Este método asigna el zoom máximo de todas las capas del paquete.
   *
   * @function
   * @public
   * @param {Number} zoom Zoom máximo.
   * @api
   */
  setMaxZoom(zoom) {
    this.display_.maxZoom = zoom;
    this.getLayers().forEach((layer) => layer.setMaxZoom(zoom));
  }

  /**
   * Este método devuelve el zoom máximo asignado al paquete o el de sus opciones.
   *
   * @function
   * @public
   * @returns {Number} Zoom máximo.
   * @api
   */
  getMaxZoom() {
    const zoom = isUndefined(this.display_.maxZoom)
      ? this.commonOptions_.maxZoom : this.display_.maxZoom;
    return zoom || Number.POSITIVE_INFINITY;
  }

  /**
   * Este método vuelve a pedir los datos de todas las tablas. Un GeoPackage remoto se
   * descarga una sola vez para todas ellas; una fuente binaria no tiene origen que volver
   * a consultar. Las tablas con ediciones pendientes no se recargan.
   *
   * @function
   * @public
   * @returns {Promise<void>} Finalización de la recarga, o rechazo si no se puede aplicar
   * (p. ej. porque una tabla ya no existe en el fichero).
   * @api
   */
  refresh() {
    const revision = this.refreshRevision_;
    const isCurrent = () => revision === this.refreshRevision_;
    const refreshing = this.whenReady()
      .then(() => Promise.all(this.getLayers().map((layer) => (
        layer.getImpl().refreshSource?.(isCurrent)
      ))))
      .then(() => undefined);
    refreshing.catch(() => undefined);
    return refreshing;
  }

  /**
   * Este método cambia el intervalo de recarga automática de todas las capas del paquete,
   * también de las que se creen después. Un valor inválido, cero o undefined la desactiva.
   *
   * @function
   * @public
   * @param {Number|undefined} interval Intervalo en milisegundos.
   * @api
   */
  updateRefreshInterval(interval) {
    this.display_.refreshInterval = interval;
    this.getLayers().forEach((layer) => layer.updateRefreshInterval(interval));
  }

  /**
   * Este método comprueba si un objeto es igual
   * a esta capa.
   *
   * @function
   * @param {Object} obj Objeto a comparar.
   * @returns {Boolean} Valor verdadero es igual, falso no lo es.
   * @public
   * @api
   */
  equals(obj) {
    let equals = false;

    if (obj instanceof GeoPackage) {
      equals = this.idLayer === obj.idLayer;
    }

    return equals;
  }
}

export default GeoPackage;
