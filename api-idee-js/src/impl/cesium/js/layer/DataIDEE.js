/**
 * @module IDEE/impl/layer/DataIDEE
 */
import { Math as CesiumMath } from 'cesium';
import FormatGeoJSON from 'IDEE/format/GeoJSON';
import * as EventType from 'IDEE/event/eventtype';
import { isNullOrEmpty } from 'IDEE/util/Utils';
import ServiceDataIDEE from '../service/DataIDEE';
import JsonLoader from '../loader/DataIDEE';
import OGCAPIFeatures from './OGCAPIFeatures';
import ImplUtils from '../util/Utils';
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
   * Loads GeoJSON from the OGC API Features items endpoint into Cesium entities.
   * @param {Boolean} forceNewSource Replaces the current features when true.
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
      defaultDataProjection: this.map.getProjection(),
      clampToGround: this.clampToGround,
    });
    const requestedLayer = this.cesiumLayer;
    this.loader_ = new JsonLoader(
      this.map,
      this.service_.getItemsUrl(),
      this.formater_,
      this.requestManager_,
      () => !this.bboxStrategy_ || (this.map && this.cesiumLayer === requestedLayer
        && viewport === this.viewportKey_(this.getVisibleBbox_())),
    );

    return this.requestFeatures_(force).then(async (features) => {
      if (!this.map || this.cesiumLayer !== requestedLayer
        || revision !== this.requestRevision_ || !isCurrent()) return;
      if (this.bboxStrategy_ && viewport !== this.viewportKey_(this.getVisibleBbox_())) {
        this.requestedViewport_ = null;
        return;
      }
      if (this.bboxStrategy_) {
        this.facadeVector_.removeFeatures(this.facadeVector_.getFeatures(true));
        this.loaded_ = true;
        // All native entities are ready: avoid leaving insertions queued on terrain events.
        await this.addFeatures_(features, true, true);
        this.facadeVector_.resumeAutoRefresh();
        this.map?.getMapImpl().scene.requestRender();
      } else if (forceNewSource === true || isNullOrEmpty(this.cesiumLayer)) {
        if (forceNewSource === true) {
          this.facadeVector_.removeFeatures(this.facadeVector_.getFeatures(true));
        }
        this.loaded_ = true;
        this.facadeVector_.addFeatures(features);
      } else {
        this.facadeVector_.clear();
        this.loaded_ = true;
        this.facadeVector_.addFeatures(features);
      }
    }).catch((error) => {
      if (revision === this.requestRevision_) this.requestedViewport_ = null;
      if (!(error instanceof RequestCancelledError)
        && this.map && this.cesiumLayer === requestedLayer
        && revision === this.requestRevision_ && isCurrent()
        && (!this.bboxStrategy_ || viewport === this.viewportKey_(this.getVisibleBbox_()))) {
        this.facadeVector_.fire(EventType.LOAD_ERROR, [error]);
      }
    });
  }

  requestFeatures_(force = false) {
    if (!this.loader_) return Promise.resolve([]);
    return this.loader_.loadFeatures(this.map.getProjection(), force);
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
    if (!native.canvas.clientWidth || !native.canvas.clientHeight) return null;
    const rectangle = native.camera.computeViewRectangle(native.scene.globe.ellipsoid);
    if (!rectangle) return null;
    return dataIDEEBbox([
      rectangle.west, rectangle.south, rectangle.east, rectangle.north,
    ].map((angle) => CesiumMath.toDegrees(angle)));
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
      const removeMove = native.camera.moveEnd.addEventListener(() => this.loadViewport_());
      let size = `${native.canvas.clientWidth},${native.canvas.clientHeight}`;
      const removeResize = native.scene.postRender.addEventListener(() => {
        const nextSize = `${native.canvas.clientWidth},${native.canvas.clientHeight}`;
        if (nextSize !== size) {
          size = nextSize;
          this.loadViewport_();
        }
      });
      this.removeViewportListeners_ = () => { removeMove(); removeResize(); };
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
