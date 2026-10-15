/**
 * @module IDEE/impl/layer/DataIDEE
 */
import FormatGeoJSON from 'IDEE/format/GeoJSON';
import { isNullOrEmpty } from 'IDEE/util/Utils';
import * as EventType from 'IDEE/event/eventtype';
import ServiceDataIDEE from '../service/DataIDEE';
import JsonLoader from '../loader/DataIDEE';
import OGCAPIFeatures from './OGCAPIFeatures';

/**
 * OGC API Features JSON vector layer implementation.
 * @extends {IDEE.impl.layer.OGCAPIFeatures}
 * @api
 */
class DataIDEE extends OGCAPIFeatures {
  /**
   * Cambia el token de autenticación y recarga la capa si está en un mapa.
   * @param {String} token Token que se enviará como cabecera "Authorization: Bearer".
   * @public
   * @api
   */
  setToken(token) {
    const getFeature = { ...this.vendorOptions_.getFeature, token };
    if (isNullOrEmpty(token)) delete getFeature.token;
    this.vendorOptions_.getFeature = getFeature;
    if (this.map) this.refresh(true);
  }

  /**
   * Loads GeoJSON from the OGC API Features items endpoint into Cesium entities.
   * @param {Boolean} forceNewSource Replaces the current features when true.
   * @private
   */
  updateSource_(forceNewSource) {
    this.service_ = new ServiceDataIDEE({
      url: this.url,
      namespace: this.namespace,
      name: this.name,
      limit: this.limit,
      offset: this.offset,
      format: this.format,
      id: this.id,
      bbox: this.bbox,
      conditional: this.conditional,
      projection: this.map.getProjection(),
      getFeatureOutputFormat: this.options.getFeatureOutputFormat,
      describeFeatureTypeOutputFormat: this.options.describeFeatureTypeOutputFormat,
    }, this.vendorOptions_);
    this.formater_ = new FormatGeoJSON({
      defaultDataProjection: this.map.getProjection(),
      clampToGround: this.clampToGround,
    });
    this.loader_ = new JsonLoader(
      this.map,
      this.service_.getItemsUrl(),
      this.formater_,
      this.service_.getRequestHeaders(),
    );
    // El cargador se recrea en cada actualización: se reenvía su aviso de autorización.
    this.loader_.on(EventType.LOAD_UNAUTHORIZED, () => this.fire(EventType.LOAD_UNAUTHORIZED));

    const requestedLayer = this.cesiumLayer;
    this.requestFeatures_().then((features) => {
      if (!this.map || this.cesiumLayer !== requestedLayer) return;
      if (forceNewSource === true || isNullOrEmpty(this.cesiumLayer)) {
        this.loaded_ = true;
        this.facadeVector_.addFeatures(features);
      } else {
        this.facadeVector_.clear();
        this.loaded_ = true;
        this.facadeVector_.addFeatures(features);
      }
    });
  }
}

export default DataIDEE;
