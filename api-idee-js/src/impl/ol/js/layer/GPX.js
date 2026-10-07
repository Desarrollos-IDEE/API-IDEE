/**
 * @module IDEE/impl/layer/GPX
 */
import GPXFormat from 'IDEE/format/GPX';
import { loadGPX } from 'IDEE/util/GPX';
import * as EventType from 'IDEE/event/eventtype';
import * as Dialog from 'IDEE/dialog';
import { escapeXSS } from 'IDEE/util/Utils';
import OLLayerVector from 'ol/layer/Vector';
import OLSourceVector from 'ol/source/Vector';
import GeoJSON from './GeoJSON';

/**
 * Carga GPX sobre los mecanismos vectoriales de OpenLayers.
 * La conversión GPX es común a ambos motores.
 * @extends {IDEE.impl.layer.GeoJSON}
 * @api
 */
class GPX extends GeoJSON {
  /**
   * @param {Object} parameters Parámetros.
   * @param {Object} options Opciones.
   */
  constructor(parameters, options, vendorOptions) {
    super(parameters, options, vendorOptions);
    this.gpxFormat_ = new GPXFormat(options);
    this.generation_ = 0;
    this.projectionListener_ = this.setProjection_.bind(this);
  }

  /**
   * Añade una fuente vacía y comienza la carga del GPX.
   * @api
   */
  addTo(map, addLayer = true) {
    this.map = map;
    this.loadFeaturesPromise_ = null;
    map.on(EventType.CHANGE_PROJ, this.projectionListener_, this);
    this.olLayer = new OLLayerVector({
      ...this.vendorOptions_,
      source: new OLSourceVector(),
      extent: this.maxExtent_,
      opacity: this.opacity_,
    });
    this.olLayer.setMaxZoom(this.maxZoom);
    this.olLayer.setMinZoom(this.minZoom);
    if (this.options.minScale !== undefined) this.setMinScale(this.options.minScale);
    if (this.options.maxScale !== undefined) this.setMaxScale(this.options.maxScale);
    if (addLayer) map.getMapImpl().addLayer(this.olLayer);
    this.setVisible(this.visibility);
    this.updateSource_();
    this.fire(EventType.ADDED_TO_MAP);
    this.facadeVector_.fire(EventType.ADDED_TO_MAP);
  }

  /**
   * Solicita y convierte el GPX; los errores se propagan a quien espera la carga.
   */
  requestFeatures_(force = false) {
    if (force || !this.loadFeaturesPromise_) {
      this.loadFeaturesPromise_ = loadGPX(this.source, this.url, force).then((xml) => (
        this.map ? this.gpxFormat_.read(xml, this.map.getProjection()) : []
      ));
    }
    return this.loadFeaturesPromise_;
  }

  /**
   * Sustituye las entidades tras una lectura correcta. Una respuesta antigua o recibida
   * después de retirar la capa nunca vuelve a incorporarse al mapa.
   * @returns {Promise<Array<IDEE.Feature>>} Entidades leídas.
   */
  updateSource_(force = false, isCurrent = () => true) {
    this.generation_ += 1;
    const generation = this.generation_;
    const layer = this.olLayer;
    const loading = this.requestFeatures_(force).then(async (features) => {
      if (!this.map || generation !== this.generation_ || !isCurrent()
        || layer !== this.olLayer) return features;
      const facade = this.facadeVector_;
      facade.removeFeatures(facade.getFeatures(true));
      this.loaded_ = true;
      facade.addFeatures(features, true);
      facade.resumeAutoRefresh();
      this.fire(EventType.LOAD, [features]);
      return features;
    });
    // Mantiene el rechazo disponible para refresh() sin rechazos no gestionados al añadir.
    loading.catch((error) => {
      if (this.map && generation === this.generation_) {
        Dialog.error(escapeXSS(String(error)));
      }
    });
    this.loading_ = loading;
    return loading;
  }

  /**
   * Recarga manteniendo los datos anteriores si falla la nueva lectura.
   * @api
   */
  refresh() {
    this.loadFeaturesPromise_ = null;
    return this.map ? this.updateSource_(true) : Promise.resolve([]);
  }

  /**
   * Respeta la pausa por ediciones y el ciclo de autorefresco del núcleo.
   */
  refreshSource(isCurrent = () => true) {
    const facade = this.facadeVector_;
    if (!this.map || !this.loaded_ || (this.source !== undefined && this.source !== null)
      || !this.isAutoRefreshRemoteURL(this.url) || facade.isAutoRefreshPaused()) return;
    return this.updateSource_(true, () => isCurrent() && !facade.isAutoRefreshPaused());
  }

  /**
   * Calcula la extensión una vez cargada la fuente, propagando sus errores.
   * @api
   */
  getFeaturesExtentPromise(skipFilter, filter) {
    const map = this.map;
    return this.loading_.then(() => (
      this.map === map && map ? this.getFeaturesExtent(skipFilter, filter) : null
    ));
  }

  /**
   * Retira la capa e invalida las peticiones pendientes.
   * @api
   */
  destroy() {
    this.generation_ += 1;
    this.loadFeaturesPromise_ = null;
    this.loaded_ = false;
    if (this.map) {
      this.map.un(EventType.CHANGE_PROJ, this.projectionListener_, this);
      this.unselectFeatures();
      super.destroy();
    }
  }
}

export default GPX;
