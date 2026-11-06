/**
 * @module IDEE/impl/control/Timeline
 */
import OLFeature from 'ol/Feature';
import OLMultiLineString from 'ol/geom/MultiLineString';
import OLMultiPoint from 'ol/geom/MultiPoint';
import OLPoint from 'ol/geom/Point';
import OLLayerVector from 'ol/layer/Vector';
import OLSourceVector from 'ol/source/Vector';
import OLStyle from 'ol/style/Style';
import OLStyleStroke from 'ol/style/Stroke';
import OLStyleFill from 'ol/style/Fill';
import OLStyleCircle from 'ol/style/Circle';
import OLStyleRegularShape from 'ol/style/RegularShape';
import FilterFunction from 'IDEE/filter/Function';
import { isFunction, isNullOrEmpty } from 'IDEE/util/Utils';
import * as LayerType from 'IDEE/layer/Type';
import Profil from '../ext/Profil';
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
 * Tipos cuyas entidades (líneas o puntos) pueden formar un recorrido.
 * @const
 * @private
 */
const TRACK_SOURCE_TYPES = TEMPORAL_FILTER_TYPES.filter((type) => type !== LayerType.WMS);

/**
 * Capa OpenLayers propia del recorrido: completo (pendiente), tramo realizado, extremos
 * de cada segmento y marcador orientado según el sentido de avance. No forma parte de
 * las capas de la API, de modo que no aparece en el LayerSwitcher ni toca las capas de
 * origen.
 *
 * @private
 */
class TrackLayer {
  /**
   * @param {ol.Map} olMap Mapa OpenLayers.
   * @param {Array<Array<Array<Number>>>} segments Segmentos del recorrido completo.
   * @param {Object} colors Colores {primary, secondary}.
   */
  constructor(olMap, segments, colors) {
    this.olMap_ = olMap;
    this.full_ = new OLFeature(new OLMultiLineString(segments));
    this.full_.setStyle(new OLStyle({
      stroke: new OLStyleStroke({ color: colors.secondary, width: 3, lineDash: [8, 8] }),
    }));
    this.ends_ = new OLFeature(new OLMultiPoint(segments
      .flatMap((segment) => [segment[0], segment[segment.length - 1]])));
    this.ends_.setStyle(new OLStyle({
      image: new OLStyleCircle({
        radius: 4,
        fill: new OLStyleFill({ color: '#ffffff' }),
        stroke: new OLStyleStroke({ color: colors.secondary, width: 2 }),
      }),
    }));
    this.travelled_ = new OLFeature(new OLMultiLineString([]));
    this.travelled_.setStyle(new OLStyle({
      stroke: new OLStyleStroke({ color: colors.primary, width: 5 }),
    }));
    this.marker_ = new OLFeature();
    this.markerColors_ = colors;
    this.layer_ = new OLLayerVector({
      source: new OLSourceVector({
        features: [this.full_, this.ends_, this.travelled_, this.marker_],
      }),
      zIndex: Number.MAX_SAFE_INTEGER - 1,
      properties: { name: '__timeline_track__' },
    });
    olMap.addLayer(this.layer_);
  }

  /**
   * Estilo del marcador: flecha que apunta en el sentido de avance.
   * @param {Number|null} heading Ángulo en radianes (desde el este, antihorario).
   * @returns {ol.style.Style} Estilo.
   */
  markerStyle(heading) {
    const { primary, secondary } = this.markerColors_;
    const fill = new OLStyleFill({ color: primary });
    const stroke = new OLStyleStroke({ color: secondary, width: 2 });
    const image = Number.isFinite(heading)
      ? new OLStyleRegularShape({
        points: 3, radius: 11, fill, stroke, rotation: Math.PI / 2 - heading, rotateWithView: true,
      })
      : new OLStyleCircle({ radius: 8, fill, stroke });
    return new OLStyle({ image });
  }

  /**
   * Actualiza el tramo realizado y el marcador.
   * @param {Object} position Posición.
   * @param {Array<Number>|null} position.coordinate Posición actual o null para ocultarla.
   * @param {Array<Array<Array<Number>>>} position.travelled Tramo realizado por segmentos.
   * @param {Number|null} position.heading Sentido de avance.
   */
  update({ coordinate, travelled, heading }) {
    this.travelled_.setGeometry(new OLMultiLineString((travelled ?? [])
      .filter((part) => part.length > 1)));
    if (coordinate) {
      this.marker_.setGeometry(new OLPoint(coordinate));
      this.marker_.setStyle(this.markerStyle(heading));
    } else {
      this.marker_.setGeometry(undefined);
    }
  }

  /**
   * Retira la capa del mapa.
   */
  remove() {
    this.olMap_.removeLayer(this.layer_);
  }
}

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
 * - supportsTrackSource(layer): indica si las líneas o puntos de la capa pueden formar
 *   un recorrido.
 * - showTrack(segments, options): dibuja un recorrido completo, con sus segmentos.
 * - updateTrack(position): dibuja el tramo realizado y la posición actual.
 * - hideTrack(): retira el recorrido.
 * - supportsTopographicProfile(): indica si puede mostrar perfiles topográficos.
 * - showTopographicProfile(segments, options): muestra el perfil de unos segmentos de
 *   puntos [x, y, z].
 * - setTopographicProfilePosition(position): coloca el cursor del perfil abierto.
 * - hideTopographicProfile(): cierra el perfil.
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

    /**
     * Perfil topográfico abierto.
     * @private
     * @type {Profil|null}
     */
    this.profile_ = null;

    /**
     * Capa del cursor del perfil sobre el mapa.
     * @private
     * @type {ol.layer.Vector|null}
     */
    this.profileLayer_ = null;

    /**
     * Recorrido dibujado.
     * @private
     * @type {TrackLayer|null}
     */
    this.track_ = null;
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
   * @param {String} timelineType 'absoluteSimple', 'absolute', 'relative' o 'track'.
   * @returns {Boolean} Verdadero si la capa es compatible.
   * @api
   */
  supportsLayer(layer, timelineType) {
    const type = layer?.type;
    if (isNullOrEmpty(type)) return false;
    if (timelineType === 'absoluteSimple') {
      return TEMPORAL_FILTER_TYPES.includes(type) || DISCRETE_TYPES.includes(type);
    }
    if (timelineType === 'track') return this.supportsTrackSource(layer);
    return TEMPORAL_FILTER_TYPES.includes(type);
  }

  /**
   * Indica si las líneas o puntos de la capa pueden formar un recorrido: capas
   * vectoriales con entidades en memoria.
   *
   * @public
   * @function
   * @param {IDEE.layer.Layer|Object} layer Capa o descriptor con "type".
   * @returns {Boolean} Verdadero si la capa puede ser origen de un recorrido.
   * @api
   */
  supportsTrackSource(layer) {
    return TRACK_SOURCE_TYPES.includes(layer?.type);
  }

  /**
   * Dibuja un recorrido completo en una capa propia, sin unir sus segmentos. Sustituye
   * al anterior.
   *
   * @public
   * @function
   * @param {Array<Array<Array<Number>>>} segments Segmentos de coordenadas en la
   * proyección del mapa.
   * @param {Object} options Opciones.
   * @param {Object} options.colors Colores {primary, secondary}.
   * @returns {Boolean} Verdadero si se ha dibujado.
   * @api
   */
  showTrack(segments, { colors } = {}) {
    this.hideTrack();
    const olMap = this.facadeMap_?.getMapImpl();
    const parts = (segments ?? []).filter((segment) => segment.length > 0);
    if (isNullOrEmpty(olMap) || parts.length === 0) return false;
    this.track_ = new TrackLayer(olMap, parts, colors);
    return true;
  }

  /**
   * Dibuja el tramo realizado y la posición actual del recorrido.
   *
   * @public
   * @function
   * @param {Object} position Posición.
   * @param {Array<Number>|null} position.coordinate Posición actual o null para ocultarla.
   * @param {Array<Array<Array<Number>>>} position.travelled Tramo realizado por segmentos.
   * @param {Number|null} position.heading Sentido de avance en radianes.
   * @api
   */
  updateTrack(position) {
    this.track_?.update(position);
  }

  /**
   * Retira el recorrido del mapa.
   *
   * @public
   * @function
   * @api
   */
  hideTrack() {
    this.track_?.remove();
    this.track_ = null;
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
   * Indica si la implementación puede mostrar perfiles topográficos.
   *
   * @public
   * @function
   * @returns {Boolean} Verdadero en OpenLayers.
   * @api
   */
  supportsTopographicProfile() {
    return true;
  }

  /**
   * Muestra el perfil topográfico de unos segmentos en un panel sobre el mapa: la curva
   * se corta entre segmentos y la distancia no cuenta los huecos. Cierra el perfil
   * anterior. Los textos del panel salen de las traducciones "profile" de la API.
   *
   * @public
   * @function
   * @param {Array<Array<Array<Number>>>} segments Segmentos de puntos [x, y, z] en la
   * proyección del mapa.
   * @param {Object} options Opciones.
   * @param {String} [options.title] Título del panel.
   * @param {Object} [options.colors] Colores de la curva y del marcador {line, marker}.
   * @param {Function} [options.onClose] Se llama si el usuario cierra el panel.
   * @returns {Boolean} Verdadero si se ha mostrado.
   * @api
   */
  showTopographicProfile(segments, { title, colors, onClose } = {}) {
    this.hideTopographicProfile();
    const olMap = this.facadeMap_?.getMapImpl();
    const parts = (segments ?? []).filter((segment) => segment.length > 1);
    if (isNullOrEmpty(olMap) || parts.length === 0) return false;
    const source = new OLSourceVector();
    this.profileLayer_ = new OLLayerVector({ source, zIndex: Number.MAX_SAFE_INTEGER });
    olMap.addLayer(this.profileLayer_);
    this.profile_ = new Profil({
      title,
      colors,
      pointLayer: source,
      width: 400,
      height: 200,
      controlClassName: 'm-timeline-profile-panel',
      draggable: true,
      centered: true,
    });
    const closeButton = this.profile_.element.querySelector('.profile-close-button');
    closeButton?.classList.add('g-cartografia-cancelar');
    closeButton?.addEventListener('click', () => {
      this.hideTopographicProfile();
      if (isFunction(onClose)) onClose();
    });
    olMap.addControl(this.profile_);
    this.profile_.setGeometry(new OLFeature(new OLMultiLineString(parts)));
    this.profile_.show();
    return true;
  }

  /**
   * Coloca el cursor del perfil abierto a una fracción de la longitud de un segmento.
   *
   * @public
   * @function
   * @param {Object} position Posición.
   * @param {Number} position.segment Índice del segmento.
   * @param {Number} position.fraction Fracción del segmento, de 0 a 1.
   * @api
   */
  setTopographicProfilePosition({ segment, fraction } = {}) {
    if (this.profile_?.element.isConnected && Number.isInteger(segment)) {
      this.profile_.setPositionAt(segment, fraction);
    }
  }

  /**
   * Cierra el perfil topográfico y retira el cursor del mapa.
   *
   * @public
   * @function
   * @api
   */
  hideTopographicProfile() {
    const olMap = this.facadeMap_?.getMapImpl();
    if (this.profile_) {
      olMap?.removeControl(this.profile_);
      this.profile_.element.remove();
    }
    if (this.profileLayer_) olMap?.removeLayer(this.profileLayer_);
    this.profile_ = null;
    this.profileLayer_ = null;
  }

  /**
   * Elimina el control.
   *
   * @public
   * @function
   * @api
   */
  destroy() {
    this.hideTopographicProfile();
    this.hideTrack();
    this.originalFilters_.clear();
    super.destroy();
  }
}

export default Timeline;
