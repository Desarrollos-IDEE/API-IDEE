/**
 * @module IDEE/impl/layer/DataIDEE
 */
import FormatGeoJSON from 'IDEE/format/GeoJSON';
import { isNullOrEmpty } from 'IDEE/util/Utils';
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
    );

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
