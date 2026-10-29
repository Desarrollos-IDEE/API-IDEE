import { getValue } from '../../i18n/language';
import { GeoJSONType } from '../turftypes';
import { RESULT_NAME_PREFIX } from './layercatalog';

/**
 * Proyección en la que trabaja Turf.js.
 * @const
 * @type {String}
 */
export const TURF_PROJECTION = 'EPSG:4326';

/**
 * Elemento de una capa de resultado.
 * @typedef {Object} OutputFeature
 * @property {Object} geometry Geometría GeoJSON.
 * @property {Object} properties Propiedades.
 * @property {String} [projection=TURF_PROJECTION] Proyección de la geometría.
 */

/**
 * @classdesc
 * Crea las capas de resultado de Turf. La capa solo se añade al mapa cuando
 * todos sus elementos se han convertido; si algo falla después, se retira,
 * de modo que no quedan capas a medias. Los elementos reciben identificadores
 * nuevos para no repetir los de origen.
 */
export default class ResultLayerWriter {
  /**
   * @constructor
   * @param {IDEE.Map} map Mapa.
   * @param {{fromGeoJSON: function(Object, String): Array<IDEE.Feature>}} converter
   * Conversión de GeoJSON a elementos en la proyección del mapa.
   */
  constructor(map, converter) {
    this.map_ = map;
    this.converter_ = converter;
  }

  /**
   * Crea una capa de resultado con los elementos indicados.
   *
   * @param {OperationId} opId Operación que genera la capa.
   * @param {Array<OutputFeature>} features Elementos.
   * @param {String} [legend] Nombre visible; por defecto «Turf: <operación> (n)».
   * @returns {IDEE.layer.Vector|null} Capa o null si no hay elementos.
   */
  write(opId, features, legend) {
    if (features.length === 0) return null;
    const facadeFeatures = features.map(({ geometry, properties, projection }) => this.converter_
      .fromGeoJSON({
        type: GeoJSONType.FEATURE,
        id: IDEE.utils.generateRandom('turf_feature_'),
        geometry,
        properties,
      }, projection || TURF_PROJECTION)[0]);
    const index = this.getNextResultIndex(opId);
    const layer = new IDEE.layer.Vector({
      name: IDEE.utils.generateRandom(`${RESULT_NAME_PREFIX}${opId}_${index}_`),
      legend: legend || `${getValue('turf.layerPrefix')} ${getValue(`turf.ops.${opId}.name`)} (${index})`,
      extract: false,
    }, { displayInLayerSwitcher: true, style: ResultLayerWriter.getStyle() });
    try {
      this.map_.addLayers(layer);
      layer.addFeatures(facadeFeatures);
    } catch (e) {
      this.map_.removeLayers(layer);
      throw e;
    }
    return layer;
  }

  /**
   * Devuelve el siguiente número de orden para la capa de resultado de una
   * operación. Solo tiene en cuenta las capas creadas por Turf para esa
   * operación, que se identifican por su nombre interno
   * (turf_<operación>_<n>_<aleatorio>).
   *
   * @param {OperationId} opId Identificador de la operación.
   * @returns {Number} Mayor número existente más uno, o 1 si no hay ninguna.
   */
  getNextResultIndex(opId) {
    const prefix = `${RESULT_NAME_PREFIX}${opId}_`;
    const layers = this.map_.getLayers().concat(this.map_.getImpl().getAllLayerInGroup());
    const indexes = layers
      .filter((layer) => typeof layer.name === 'string' && layer.name.startsWith(prefix))
      .map((layer) => /^(\d+)_/.exec(layer.name.slice(prefix.length)))
      .filter((match) => match !== null)
      .map((match) => parseInt(match[1], 10));
    return indexes.length > 0 ? Math.max(...indexes) + 1 : 1;
  }

  /**
   * Estilo de las capas de resultado, válido para cualquier tipo de geometría.
   *
   * @returns {IDEE.style.Generic}
   */
  static getStyle() {
    return new IDEE.style.Generic({
      point: {
        radius: 6,
        fill: { color: '#71a7d3', opacity: 0.9 },
        stroke: { color: '#ffffff', width: 1.5 },
      },
      line: {
        stroke: { color: '#71a7d3', width: 3 },
      },
      polygon: {
        fill: { color: '#71a7d3', opacity: 0.5 },
        stroke: { color: '#71a7d3', width: 2 },
      },
    });
  }
}
