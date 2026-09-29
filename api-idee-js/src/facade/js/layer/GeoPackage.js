/**
 * @module IDEE/layer/GeoPackage
 */
import GeoPackageProvider from '../connector/GeoPackageConnector';
import MObject from '../Object';
import * as LayerType from './Type';
import GeoPackageTile from './GeoPackageTile';
import GeoJSON from './GeoJSON';
import { generateRandom, escapeXSS } from '../util/Utils';
import * as EventType from '../event/eventtype';
import * as Dialog from '../dialog';
import Style from '../style/Style';
import Exception from '../exception/exception';
import { getValue } from '../i18n/language';

/**
 * @classdesc
 *
 * El formato Geopackage permite agrupar múltiples capas, tanto vectoriales como raster,
 * en un contenedor SQLite.
 * También puede declararse dentro de la propiedad layers de la configuración del mapa:
 * <pre><code>
 * {
 *   type: 'GeoPackage',
 *   url: '/data/reference.gpkg',
 *   name: 'reference',
 *   tiled: true,
 *   style: { point: { radius: 5 } },
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
   * tiled activa la consulta de las tablas vectoriales según la extensión visible en OpenLayers.
   * tile y vector mantienen las opciones de los proveedores, indexadas por tabla.
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
   * @extends {IDEE.Object}
   * @api
   */
  constructor(data, options) {
    super({});
    const receivedOptions = options || {};

    /**
     * Distingue los parámetros normalizados de la firma histórica con datos binarios.
     * @private
     * @type {Boolean}
     */
    this.legacyParameters_ = !data || Object.getPrototypeOf(data) !== Object.prototype;
    const parameters = this.legacyParameters_ ? { source: data } : { ...data };
    const {
      source, url, name, legend, metadata, properties, options: nestedOptions = {},
    } = parameters;
    const flatOptions = { ...parameters };
    ['type', 'source', 'url', 'name', 'legend', 'metadata', 'properties', 'options']
      .forEach((property) => delete flatOptions[property]);
    const normalizedOptions = this.legacyParameters_ ? receivedOptions : {
      ...flatOptions,
      ...nestedOptions,
      ...receivedOptions,
    };
    const sourceParameters = {
      source, url, name, legend,
    };
    this.constructorParameters = { data, options };

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
    this.metadata = metadata ? this.copyOptions_(metadata) : null;

    /** Información de las tablas, incluyendo los datos de las tablas vectoriales. */
    this.properties = properties ? this.copyOptions_(properties) : null;

    /**
     * Capas
     */
    this.layers_ = Object.create(null);

    /** Proveedores vectoriales, indexados por el nombre original de tabla. */
    this.vectorProviders_ = Object.create(null);

    /** Opciones propias del paquete, sin compartir objetos de configuración mutables. */
    this.options = this.copyOptions_(normalizedOptions);
    this.tiled = this.options.tiled === true;
    const {
      tables = {}, tile, vector, ...commonOptions
    } = this.options;
    this.tableOptions_ = this.legacyParameters_ ? this.options : tables;
    this.commonOptions_ = this.legacyParameters_ ? {} : commonOptions;

    /**
     * Conector
     */
    this.connector_ = new GeoPackageProvider(sourceParameters, { tile, vector });

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
      await Promise.all(vectorProviders.map((provider) => (
        this.getTableOptions_(provider.getTableName()).tiled === true
          ? provider.prepareForBoundingBox() : undefined
      )));
      this.createLayers_(vectorProviders, tileProviders, packageMetadata);
      this.metadata = this.copyOptions_(packageMetadata);
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
   * Copia registros y arrays de configuración, conservando instancias de estilos y fuentes.
   * @private
   * @param {*} value Valor de configuración.
   * @returns {*} Copia del valor o la instancia original si no es un registro/array.
   */
  copyOptions_(value) {
    if (Array.isArray(value)) {
      return value.map((item) => this.copyOptions_(item));
    }
    if (value && (Object.getPrototypeOf(value) === Object.prototype
      || Object.getPrototypeOf(value) === null)) {
      return Object.fromEntries(Object.entries(value)
        .map(([key, item]) => [key, this.copyOptions_(item)]));
    }
    return value;
  }

  /**
   * Combina opciones comunes y específicas sin modificar ninguna de las dos.
   * @private
   * @param {String} tableName Nombre original de la tabla.
   * @param {Boolean} raster Indica si se trata de una tabla de teselas.
   * @returns {Object} Opciones independientes para la capa hija.
   */
  getTableOptions_(tableName, raster = false) {
    const options = this.copyOptions_({
      ...this.commonOptions_,
      ...(Object.prototype.hasOwnProperty.call(this.tableOptions_, tableName)
        ? this.tableOptions_[tableName] : {}),
    });
    if (options.name === undefined) {
      options.name = this.legacyParameters_ ? tableName : `${this.name}:${tableName}`;
    }
    if (options.legend === undefined && (raster || !this.legacyParameters_)) {
      options.legend = tableName;
    }
    return options;
  }

  /**
   * Construye todas las capas antes de publicar la colección del paquete.
   * @private
   * @param {Array} vectorProviders Proveedores vectoriales.
   * @param {Array} tileProviders Proveedores ráster.
   * @param {Object} metadata Metadatos estructurados del GeoPackage.
   */
  createLayers_(vectorProviders, tileProviders, metadata) {
    const layers = Object.create(null);
    const tables = Object.create(null);
    vectorProviders.forEach((vectorProvider) => {
      const tableName = vectorProvider.getTableName();
      const options = this.getTableOptions_(tableName);
      const tiled = options.tiled === true;
      const source = tiled ? vectorProvider.getEmptyGeoJSON() : vectorProvider.getGeoJSON();
      this.vectorProviders_[tableName] = vectorProvider;
      layers[tableName] = new GeoJSON({
        ...options,
        source,
        ...(tiled ? {
          bboxLoader: (extent, projection) => (
            vectorProvider.getGeoJSONByBoundingBox(extent, projection)
          ),
          fullLoader: () => vectorProvider.getGeoJSON(),
        } : {}),
      }, this.copyOptions_(options));
      tables[tableName] = {
        type: 'features',
        metadata: this.copyOptions_(metadata.tables[tableName]),
        data: source,
      };
    });
    tileProviders.forEach((tileProvider) => {
      const tableName = tileProvider.getTableName();
      layers[tableName] = new GeoPackageTile(this.getTableOptions_(tableName, true), tileProvider);
      tables[tableName] = {
        type: 'tiles',
        metadata: this.copyOptions_(metadata.tables[tableName]),
      };
    });
    metadata.attributeTables.forEach((tableName) => {
      tables[tableName] = {
        type: 'attributes',
        metadata: this.copyOptions_(metadata.tables[tableName]),
      };
    });
    this.layers_ = layers;
    this.properties = { tables };
    this.loadedVectorLayers_ = true;
    this.loadedTileLayers_ = true;
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
    return this.copyOptions_(this.metadata);
  }

  /**
   * Prepara opciones para que las instancias de estilo puedan reconstruirse desde JSON.
   * @private
   * @param {*} value Valor de configuración.
   * @returns {*} Valor serializable y reutilizable por el constructor.
   */
  getSerializableOptions_(value) {
    if (value instanceof Style) {
      return value.serialize();
    }
    if (Array.isArray(value)) {
      return value.map((item) => this.getSerializableOptions_(item));
    }
    if (value && (Object.getPrototypeOf(value) === Object.prototype
      || Object.getPrototypeOf(value) === null)) {
      return Object.fromEntries(Object.entries(value)
        .map(([key, item]) => [key, this.getSerializableOptions_(item)]));
    }
    return value;
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
    const collections = metadata.featureTables.map((tableName) => ({
      tableName,
      data: this.vectorProviders_[tableName].getGeoJSON(),
    }));
    const crs = collections.length > 0 ? collections[0].data.crs : undefined;
    const commonCrs = crs && collections.every(({ data }) => (
      JSON.stringify(data.crs) === JSON.stringify(crs)
    ));
    return {
      type: 'FeatureCollection',
      ...(commonCrs ? { crs: this.copyOptions_(crs) } : {}),
      features: collections.flatMap(({ tableName, data }) => data.features.map((feature) => ({
        ...this.copyOptions_(feature),
        tableName,
      }))),
    };
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
    return {
      type: LayerType.GeoPackage,
      ...(this.url === undefined ? { source: this.source } : { url: this.url }),
      name: this.name,
      legend: this.legend,
      options: this.getSerializableOptions_(this.options),
      metadata,
      properties: this.copyOptions_(this.properties),
    };
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
    const loading = this.whenReady().then(() => {
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
    this.map_.removeLayers(this.getLayers());
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
