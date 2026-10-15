/**
 * @module IDEE/impl/layer/DataIDEE
 */
import FormatGeoJSON from 'IDEE/format/GeoJSON';
import { isNullOrEmpty } from 'IDEE/util/Utils';
import * as EventType from 'IDEE/event/eventtype';
import OLSourceVector from 'ol/source/Vector';
import { get as getProj, transformExtent } from 'ol/proj';
import ServiceDataIDEE from '../service/DataIDEE';
import LoaderDataIDEE from '../loader/DataIDEE';
import ImplUtils from '../util/Utils';
import OGCAPIFeatures from './OGCAPIFeatures';
import dataIDEEBbox from '../../../common/DataIDEEBbox';
import RequestManager, { RequestCancelledError } from '../../../common/RequestManager';

/**
 * OGC API Features JSON vector layer implementation.
 * @extends {IDEE.impl.layer.OGCAPIFeatures}
 * @api
 */
class DataIDEE extends OGCAPIFeatures {
  constructor(options = {}, vendorOptions = {}) {
    super(options, vendorOptions);
    this.requestManagerOptions_ = {
      cache: options.cache,
      throttleMs: options.throttleMs,
      pendingPolicy: 'latest',
    };
    this.requestManager_ = new RequestManager(this.requestManagerOptions_);
    this.requestRevision_ = 0;
    this.bboxStrategy_ = options.bboxStrategy === true && isNullOrEmpty(vendorOptions.source);
    this.requestedViewport_ = null;
    this.removeViewportListeners_ = null;
  }

  /**
   * Loads GeoJSON from the OGC API Features items endpoint into the vector source.
   * @param {Boolean} forceNewSource Replaces the existing source when true.
   * @private
   */
  updateSource_(forceNewSource, force = false, isCurrent = () => true) {
    if (!isNullOrEmpty(this.vendorOptions_.source)) return Promise.resolve();
    this.requestRevision_ += 1;
    const revision = this.requestRevision_;

    const bbox = this.bboxStrategy_ ? this.getVisibleBbox_() : this.bbox;
    const viewport = this.bboxStrategy_ ? this.viewportKey_(bbox) : null;
    this.requestedViewport_ = viewport;
    if (this.bboxStrategy_ && !bbox) return Promise.resolve();

    this.service_ = new ServiceDataIDEE({
      url: this.url,
      namespace: this.namespace,
      name: this.name,
      limit: this.limit,
      offset: this.offset,
      format: this.format,
      id: this.id,
      bbox,
      conditional: this.conditional,
      projection: this.map.getProjection(),
      getFeatureOutputFormat: this.options.getFeatureOutputFormat,
      describeFeatureTypeOutputFormat: this.options.describeFeatureTypeOutputFormat,
    }, this.vendorOptions_);
    this.formater_ = new FormatGeoJSON({
      defaultDataProjection: getProj(this.map.getProjection().code),
    });
    const requestedLayer = this.olLayer;
    this.loader_ = new LoaderDataIDEE(
      this.map,
      this.service_.getItemsUrl(),
      this.formater_,
      this.requestManager_,
      () => !this.bboxStrategy_ || (this.map && this.olLayer === requestedLayer
        && viewport === this.viewportKey_(this.getVisibleBbox_())),
    );

    const ol3LayerSource = this.olLayer.getSource();
    return this.requestFeatures_(force).then((features) => {
      if (!this.map || this.olLayer !== requestedLayer
        || revision !== this.requestRevision_ || !isCurrent()) return;
      if (this.bboxStrategy_ && viewport !== this.viewportKey_(this.getVisibleBbox_())) {
        this.requestedViewport_ = null;
        return;
      }
      if (this.bboxStrategy_) {
        if (!this.olLayer.getSource()) this.olLayer.setSource(new OLSourceVector());
        this.facadeVector_.removeFeatures(this.facadeVector_.getFeatures(true));
        this.loaded_ = true;
        this.facadeVector_.addFeatures(features);
        this.facadeVector_.resumeAutoRefresh();
        this.fire(EventType.LOAD, [features]);
        this.facadeVector_.redraw();
      } else if (forceNewSource === true || isNullOrEmpty(ol3LayerSource)) {
        if (forceNewSource === true) {
          this.facadeVector_.removeFeatures(this.facadeVector_.getFeatures(true));
        }
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
        this.facadeVector_.removeFeatures(this.facadeVector_.getFeatures(true));
        this.loaded_ = true;
        this.facadeVector_.addFeatures(features);
        this.fire(EventType.LOAD, [features]);
        this.facadeVector_.redraw();
      }
    }).catch((error) => {
      if (revision === this.requestRevision_) this.requestedViewport_ = null;
      if (!(error instanceof RequestCancelledError)
        && this.map && this.olLayer === requestedLayer
        && revision === this.requestRevision_ && isCurrent()
        && (!this.bboxStrategy_ || viewport === this.viewportKey_(this.getVisibleBbox_()))) {
        this.facadeVector_.fire(EventType.LOAD_ERROR, [error]);
      }
    });
  }

  requestFeatures_(force = false) {
    if (!this.loader_) return Promise.resolve([]);
    return this.loader_.loadFeatures(getProj(this.map.getProjection().code), force);
  }

  getFeaturesExtentPromise(skipFilter, filter) {
    const codeProjection = this.map.getProjection().code;
    if (this.isLoaded()) {
      const features = this.getFeatures(skipFilter, filter);
      return Promise.resolve(ImplUtils.getFeaturesExtent(features, codeProjection));
    }
    return this.requestFeatures_().then((features) => (
      ImplUtils.getFeaturesExtent(features, codeProjection)
    ));
  }

  refresh(forceNewSource) {
    return this.updateSource_(forceNewSource);
  }

  refreshFresh() {
    return this.updateSource_(true, true);
  }

  async refreshSource(isCurrent = () => true) {
    if (this.bboxStrategy_) {
      if (!this.map || !this.loaded_ || this.facadeVector_.isAutoRefreshPaused()) return;
      await this.updateSource_(false, true, () => (
        isCurrent() && !this.facadeVector_.isAutoRefreshPaused()
      ));
      return;
    }
    const revision = this.requestRevision_;
    try {
      return await super.refreshSource(() => isCurrent() && revision === this.requestRevision_);
    } catch (error) {
      if (!(error instanceof RequestCancelledError)) {
        this.facadeVector_?.fire(EventType.LOAD_ERROR, [error]);
      }
      throw error;
    }
  }

  clearCache() {
    this.requestManager_.clearCache();
    this.requestedViewport_ = null;
  }

  getVisibleBbox_() {
    if (!this.map) return null;
    const native = this.map.getMapImpl();
    const size = native.getSize();
    if (!size || size[0] <= 0 || size[1] <= 0) return null;
    const view = native.getView();
    return dataIDEEBbox(transformExtent(view.calculateExtent(size), view.getProjection(), 'EPSG:4326'));
  }

  viewportKey_(bbox) {
    return JSON.stringify([this.map?.getProjection().code, bbox]);
  }

  // Native sources retain covered extents, but this layer replaces its active zone.
  // Let the request manager decide exact reuse instead of skipping contained viewports.
  loadViewport_() {
    if (this.map && this.viewportKey_(this.getVisibleBbox_()) !== this.requestedViewport_) {
      this.updateSource_(false);
    }
  }

  addTo(map, addLayer = true) {
    if (this.requestManager_.disposed) {
      this.requestManager_ = new RequestManager(this.requestManagerOptions_);
    }
    super.addTo(map, addLayer);
    if (this.bboxStrategy_) {
      const native = map.getMapImpl();
      const onViewChange = () => this.loadViewport_();
      native.on('moveend', onViewChange);
      native.on('change:size', onViewChange);
      this.removeViewportListeners_ = () => {
        native.un('moveend', onViewChange);
        native.un('change:size', onViewChange);
      };
    }
  }

  destroy() {
    this.removeViewportListeners_?.();
    this.removeViewportListeners_ = null;
    this.requestedViewport_ = null;
    this.requestRevision_ += 1;
    this.requestManager_.dispose();
    super.destroy();
  }
}

export default DataIDEE;
