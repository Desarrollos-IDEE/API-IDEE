/**
 * @module IDEE/impl/control/Timeline
 */
import FilterFunction from 'IDEE/filter/Function';
import { isNullOrEmpty } from 'IDEE/util/Utils';
import * as LayerType from 'IDEE/layer/Type';
import Control from './Control';

/**
 * Tipos que OpenLayers sabe filtrar por tiempo: WMS mediante CQL y las capas
 * vectoriales con entidades en memoria mediante filtros de la API.
 * MVT y MBTilesVector no se incluyen porque su setFilter no tiene efecto.
 * @const
 * @private
 */
const TEMPORAL_FILTER_TYPES = [
  LayerType.WMS,
  LayerType.GPX,
  LayerType.KML,
  LayerType.KMZ,
  LayerType.GeoJSON,
  LayerType.WFS,
  LayerType.OGCAPIFeatures,
  LayerType.DataIDEE,
  LayerType.Vector,
];

/**
 * Tipos que solo pueden mostrarse u ocultarse por paso (timeline absoluteSimple).
 * @const
 * @private
 */
const DISCRETE_TYPES = [
  LayerType.WMTS,
  LayerType.XYZ,
  LayerType.TMS,
  LayerType.OSM,
  LayerType.MBTiles,
  LayerType.MVT,
  LayerType.MBTilesVector,
  LayerType.GeoTIFF,
  LayerType.MapLibre,
  LayerType.GeoPackageTile,
];

/**
 * Fija el CQL_FILTER de una capa WMS. El origen OpenLayers de un WMS recién añadido
 * se crea de forma asíncrona (tras leer sus capacidades): mientras no existe, el CQL
 * queda guardado en la capa y se aplica al crear el origen.
 * @private
 * @param {IDEE.layer.WMS} layer Capa WMS.
 * @param {String} cql Filtro CQL.
 */
const setWMSCql = (layer, cql) => {
  const olLayer = layer.getImpl().getLayer();
  if (!isNullOrEmpty(olLayer) && isNullOrEmpty(olLayer.getSource())) {
    // El setter guarda el valor antes de actualizar el origen, que todavía no existe.
    try {
      // eslint-disable-next-line no-param-reassign
      layer.cql = cql;
    } catch (error) {
      // Se aplicará al crear el origen.
    }
    return;
  }
  // eslint-disable-next-line no-param-reassign
  layer.cql = cql;
};

/**
 * @classdesc
 * Hereda de {@link module:IDEE/impl/control/Control|Control}.
 * Adaptador OpenLayers del control de línea de tiempo.
 *
 * Contrato que la fachada espera de cualquier implementación de Timeline:
 * - isSupported(): indica si el motor dispone de funcionalidad temporal.
 * - supportsLayer(layer, timelineType): indica si la capa (o un descriptor con "type")
 *   puede utilizarse en la modalidad indicada.
 * - applyTemporalFilter(layer, temporalFilter): aplica el filtro temporal a la capa.
 * - removeTemporalFilter(layer): restaura el estado de filtrado previo de la capa.
 *
 * @api
 * @extends {module:IDEE/impl/control/Control}
 */
class Timeline extends Control {
  /**
   * Constructor principal de la clase.
   *
   * @constructor
   * @api
   */
  constructor() {
    super();

    /**
     * Filtros o CQL que tenían las capas antes de aplicar el filtro temporal.
     * @private
     * @type {Map<IDEE.layer.Layer, Object>}
     */
    this.originalFilters_ = new Map();
  }

  /**
   * Este método añade el control al mapa.
   *
   * @public
   * @function
   * @param {IDEE.Map} map Mapa.
   * @param {HTMLElement} template Plantilla del control.
   * @api stable
   */
  addTo(map, template) {
    super.addTo(map, template);
  }

  /**
   * Indica si la implementación dispone de funcionalidad temporal.
   *
   * @public
   * @function
   * @returns {Boolean} Verdadero en OpenLayers.
   * @api
   */
  isSupported() {
    return true;
  }

  /**
   * Indica si la capa puede utilizarse en la modalidad temporal indicada.
   *
   * @public
   * @function
   * @param {IDEE.layer.Layer|Object} layer Capa o descriptor con "type".
   * @param {String} timelineType 'absoluteSimple', 'absolute' o 'relative'.
   * @returns {Boolean} Verdadero si la capa es compatible.
   * @api
   */
  supportsLayer(layer, timelineType) {
    const type = layer?.type;
    if (isNullOrEmpty(type)) return false;
    if (timelineType === 'absoluteSimple') {
      return TEMPORAL_FILTER_TYPES.includes(type) || DISCRETE_TYPES.includes(type);
    }
    return TEMPORAL_FILTER_TYPES.includes(type);
  }

  /**
   * Aplica un filtro temporal a la capa, combinándolo con el filtro previo.
   * WMS utiliza el parámetro CQL_FILTER; las capas vectoriales, un filtro de función.
   *
   * @public
   * @function
   * @param {IDEE.layer.Layer} layer Capa.
   * @param {Object} temporalFilter Filtro con los métodos matches(feature) y toCQL().
   * @returns {Boolean} Verdadero si se ha aplicado.
   * @api
   */
  applyTemporalFilter(layer, temporalFilter) {
    if (!TEMPORAL_FILTER_TYPES.includes(layer?.type)) return false;
    if (layer.type === LayerType.WMS) {
      if (!this.originalFilters_.has(layer)) {
        this.originalFilters_.set(layer, {
          cql: layer.cql,
          paramsCql: layer.options?.params?.CQL_FILTER,
        });
      }
      const { cql, paramsCql } = this.originalFilters_.get(layer);
      const original = cql ?? paramsCql;
      const temporal = temporalFilter.toCQL();
      setWMSCql(layer, isNullOrEmpty(original) ? temporal : `(${original}) AND (${temporal})`);
      return true;
    }
    if (!this.originalFilters_.has(layer)) {
      this.originalFilters_.set(layer, { filter: layer.getFilter() });
    }
    const { filter } = this.originalFilters_.get(layer);
    layer.setFilter(new FilterFunction((feature) => temporalFilter.matches(feature)
      && (isNullOrEmpty(filter) || filter.execute([feature]).length > 0)));
    return true;
  }

  /**
   * Restaura el filtro que tenía la capa antes del filtro temporal.
   *
   * @public
   * @function
   * @param {IDEE.layer.Layer} layer Capa.
   * @api
   */
  removeTemporalFilter(layer) {
    if (!this.originalFilters_.has(layer)) return;
    const original = this.originalFilters_.get(layer);
    this.originalFilters_.delete(layer);
    if (layer.type === LayerType.WMS) {
      setWMSCql(layer, original.cql ?? original.paramsCql);
    } else {
      layer.setFilter(original.filter ?? null);
    }
  }

  /**
   * Elimina el control.
   *
   * @public
   * @function
   * @api
   */
  destroy() {
    this.originalFilters_.clear();
    super.destroy();
  }
}

export default Timeline;
