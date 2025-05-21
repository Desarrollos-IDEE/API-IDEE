/**
 * @module IDEE/layer/GeoPackage
 */
import GeoPackageProvider from '../connector/GeoPackageConnector';
import MObject from '../Object';
import * as LayerType from './Type';
import GeoPackageTile from './GeoPackageTile';
import GeoJSON from './GeoJSON';
import { generateRandom, extend } from '../util/Utils';
import * as EventType from '../event/eventtype';

/**
 * @classdesc
 *
 * El formato Geopackage permite agrupar múltiples capas, tanto vectoriales como raster,
 * en un contenedor SQLite.
 *
 * @property {String} idLayer Identificador de la capa.
 * @property {IDEE.layer.GeoPackageTile|IDEE.layer.GeoJSON} layers_ Capas de GeoPackage.
 * @property {IDEE.GeoPackageConnector} connector_ Conector.
 * @property {Object} options Opciones de la capa.
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
   * @param {Response|File|Unit8Array} data Fichero que contiene la información
   * de geopackage (.gkpg).
   * @param {Object} options Parámetros opcionales proporcionados por el usuario
   * para las capas vectoriales o ráster contenidas en el GeoPackage.
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
  constructor(data, options = {}) {
    super({});

    /**
     * Id de la capa.
     */
    this.idLayer = generateRandom(LayerType.GeoPackage, options.name).replace(/[^a-zA-Z0-9\-_]/g, '');

    /**
     * Capas
     */
    this.layers_ = {};

    /**
     * Conector
     */
    this.connector_ = new GeoPackageProvider(data, options);

    /**
     * Opciones
     */
    this.options = options;

    /**
     * Determina si las capas vectoriales están cargadas.
     */
    this.loadedVectorLayers_ = false;

    /**
     * Determina si las capas teseladas están cargadas.
     */
    this.loadedTileLayers_ = false;
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
   * Este método agrega la capa al mapa.
   *
   * @function
   * @param {M/Map} map
   * @api
   */
  addTo(map) {
    this.map_ = map;
    this.connector_.getVectorProviders().then((vectorProviders) => {
      vectorProviders.forEach((vectorProvider) => {
        const geojson = vectorProvider.getGeoJSON();
        const tableName = vectorProvider.getTableName();
        const optsExt = extend(this.options[tableName] || {}, { name: tableName });
        const vectorLayer = new GeoJSON({
          ...optsExt,
          source: geojson,
        });

        this.layers_[tableName] = vectorLayer;
        map.addLayers(vectorLayer);
      });

      this.loadedVectorLayers_ = true;
      if (this.loadedTileLayers_) {
        this.fire(EventType.LOAD_LAYERS, [this.layers_]);
      }
    });

    this.connector_.getTileProviders().then((tileProviders) => {
      tileProviders.forEach((tileProvider) => {
        const tableName = tileProvider.getTableName();
        const optsExt = extend(this.options[tableName] || {}, {
          name: tableName,
          legend: tableName,
        });
        const tileLayer = new GeoPackageTile(optsExt, tileProvider);

        this.layers_[tableName] = tileLayer;
        map.addLayers(tileLayer);
      });
      this.loadedTileLayers_ = true;

      if (this.loadedVectorLayers_) {
        this.fire(EventType.LOAD_LAYERS, [this.layers_]);
      }
    });

    this.fire(EventType.ADDED_TO_MAP);
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
