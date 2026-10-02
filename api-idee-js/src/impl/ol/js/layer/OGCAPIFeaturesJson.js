/**
 * @module IDEE/impl/layer/OGCAPIFeaturesJson
 */
import FormatGeoJSON from 'IDEE/format/GeoJSON';
import { isNullOrEmpty } from 'IDEE/util/Utils';
import * as EventType from 'IDEE/event/eventtype';
import OLSourceVector from 'ol/source/Vector';
import { get as getProj } from 'ol/proj';
import { all } from 'ol/loadingstrategy';
import ServiceOGCAPIFeaturesJson from '../service/OGCAPIFeaturesJson';
import LoaderOGCAPIFeaturesJson from '../loader/OGCAPIFeaturesJson';
import OGCAPIFeatures from './OGCAPIFeatures';

/**
 * OGC API Features JSON vector layer implementation.
 * @extends {IDEE.impl.layer.OGCAPIFeatures}
 * @api
 */
class OGCAPIFeaturesJson extends OGCAPIFeatures {
  updateSource_(forceNewSource) {
    if (!isNullOrEmpty(this.vendorOptions_.source)) return;

    this.service_ = new ServiceOGCAPIFeaturesJson({
      url: this.url,
      namespace: this.namespace,
      name: this.name,
      limit: this.limit,
      offset: this.offset,
      format: this.format || 'json',
      id: this.id,
      bbox: this.bbox,
      conditional: this.conditional,
      projection: this.map.getProjection(),
      getFeatureOutputFormat: this.options.getFeatureOutputFormat,
      describeFeatureTypeOutputFormat: this.options.describeFeatureTypeOutputFormat,
    }, this.vendorOptions_);
    this.formater_ = new FormatGeoJSON({
      defaultDataProjection: getProj(this.map.getProjection().code),
    });
    this.loader_ = new LoaderOGCAPIFeaturesJson(
      this.map,
      this.service_.getItemsUrl(),
      this.formater_,
    );

    const ol3LayerSource = this.olLayer.getSource();
    this.requestFeatures_().then((features) => {
      if (forceNewSource === true || isNullOrEmpty(ol3LayerSource)) {
        const newSource = new OLSourceVector({
          loader: () => {
            this.loaded_ = true;
            this.facadeVector_.addFeatures(features);
            this.fire(EventType.LOAD, [features]);
            this.facadeVector_.redraw();
          },
        });
        this.olLayer.setSource(newSource);
      } else {
        ol3LayerSource.set('format', this.formater_);
        ol3LayerSource.set('loader', this.loader_.getLoaderFn((features2) => {
          this.loaded_ = true;
          this.facadeVector_.addFeatures(features2);
          this.fire(EventType.LOAD, [features2]);
          this.facadeVector_.redraw();
        }));
        ol3LayerSource.set('strategy', all);
        ol3LayerSource.changed();
      }
    });
  }
}

export default OGCAPIFeaturesJson;
