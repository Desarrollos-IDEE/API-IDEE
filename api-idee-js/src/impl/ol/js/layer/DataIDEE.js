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
import DataIDEETransactions from '../../../common/DataIDEETransactions';
import { isUnauthorizedError } from '../../../common/DataIDEERequest';
import DataIDEEEditingSession from '../../../common/DataIDEEEditingSession';

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
    this.editing_ = false;
    this.preparingEditing_ = false;
    this.destroyed_ = false;
    this.readThrottleMs_ = options.throttleMs || 0;
    this.pendingReads_ = new Set();
    this.editingLimits_ = {
      pageSize: options.editingLimits?.pageSize || 250,
      maxFeatures: options.editingLimits?.maxFeatures || 1000,
      maxCoordinates: options.editingLimits?.maxCoordinates || 100000,
      maxBytes: options.editingLimits?.maxBytes || 10 * 1024 * 1024,
    };
    Object.entries(this.editingLimits_).forEach(([key, value]) => {
      if (!Number.isInteger(value) || value <= 0) {
        throw new TypeError(`DataIDEE editing limit '${key}' must be a positive integer.`);
      }
    });
    this.transactions_ = null;
    this.transactionCollectionUrl_ = null;
  }

  /**
   * Devuelve el token de autenticación de la capa. Es opcional: una capa
   * pública no tiene token.
   * @returns {String|undefined} Token configurado en getFeature.token.
   * @public
   * @api
   */
  getToken() {
    const token = this.vendorOptions_.getFeature?.token;
    return isNullOrEmpty(token) ? undefined : token;
  }

  /**
   * Cambia el token de autenticación, descarta la caché del token anterior
   * y recarga la capa si está en un mapa.
   * @param {String} token Nuevo token. Si es vacío, se elimina.
   * @public
   * @api
   */
  setToken(token) {
    const newToken = isNullOrEmpty(token) ? undefined : token;
    if (newToken === this.getToken()) return;
    const getFeature = { ...this.vendorOptions_.getFeature, token: newToken };
    if (newToken === undefined) delete getFeature.token;
    this.vendorOptions_.getFeature = getFeature;
    this.clearCache();
    if (this.map) this.refresh(true);
  }

  /**
   * Loads GeoJSON from the OGC API Features items endpoint into the vector source.
   * @param {Boolean} forceNewSource Replaces the existing source when true.
   * @private
   */
  updateSource_(forceNewSource, force = false, isCurrent = () => true) {
    if (this.editing_) return Promise.resolve();
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
      () => {
        if (this.editing_) return false;
        return !this.bboxStrategy_ || (this.map && this.olLayer === requestedLayer
        && viewport === this.viewportKey_(this.getVisibleBbox_()));
      },
      this.getToken() !== undefined,
      this.service_.getRequestHeaders(),
    );
    const loader = this.loader_;
    loader.on(EventType.LOAD_UNAUTHORIZED, (error) => {
      if (this.loader_ === loader) this.fire(EventType.LOAD_UNAUTHORIZED, [error]);
    });

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
    const request = this.loader_.loadFeatures(getProj(this.map.getProjection().code), force);
    this.pendingReads_.add(request);
    request.then(
      () => this.pendingReads_.delete(request),
      () => this.pendingReads_.delete(request),
    );
    return request;
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
    if (this.editing_) return Promise.resolve();
    return this.updateSource_(forceNewSource);
  }

  refreshFresh() {
    if (this.editing_) return Promise.resolve();
    return this.updateSource_(true, true);
  }

  async refreshSource(isCurrent = () => true) {
    if (this.editing_) return;
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
      const tokenRejected = isUnauthorizedError(error) && this.getToken() !== undefined;
      if (!(error instanceof RequestCancelledError) && !tokenRejected) {
        this.facadeVector_?.fire(EventType.LOAD_ERROR, [error]);
      }
      throw error;
    }
  }

  clearCache() {
    this.requestManager_.clearCache();
    this.requestedViewport_ = null;
  }

  getEditingCapabilities() {
    if (!isNullOrEmpty(this.vendorOptions_.source)) {
      return Promise.resolve({
        create: false, update: false, delete: false, externalSource: true,
      });
    }
    return this.getTransactions_().capabilities();
  }

  async beginEditing({ bbox }) {
    if (this.editing_ || this.preparingEditing_) {
      throw new Error('DataIDEE editing is already active or being prepared.');
    }
    if (!Array.isArray(bbox) || bbox.length !== 4 || !bbox.every(Number.isFinite)) {
      throw new TypeError('A valid CRS84 bbox is required to edit DataIDEE.');
    }
    if (bbox[0] < -180 || bbox[2] > 180 || bbox[1] < -90 || bbox[3] > 90
      || bbox[0] > bbox[2] || bbox[1] > bbox[3]) {
      throw new RangeError('The edit bbox must be a valid CRS84 area; zoom in and retry.');
    }
    this.preparingEditing_ = true;
    this.editing_ = true;
    this.requestRevision_ += 1;
    let capabilities;
    try {
      capabilities = await this.getEditingCapabilities();
      if (this.destroyed_ || !this.map) {
        throw new Error('The DataIDEE layer was removed during edit preparation.');
      }
      if (!capabilities.create && !capabilities.update && !capabilities.delete) {
        throw new Error('This DataIDEE collection is read-only.');
      }
    } catch (error) {
      this.editing_ = false;
      this.requestedViewport_ = null;
      this.preparingEditing_ = false;
      throw error;
    }
    this.preparingEditing_ = false;
    try {
      await Promise.allSettled([...this.pendingReads_]);
      const readService = new ServiceDataIDEE({
        url: this.url,
        namespace: this.namespace,
        name: this.name,
        limit: this.editingLimits_.pageSize,
        offset: 0,
        format: this.format,
        id: null,
        bbox,
        conditional: this.conditional,
        projection: this.map.getProjection(),
      }, this.vendorOptions_);
      const collectionUrl = readService.getItemsUrl();
      const seen = new Set();
      let nextUrl = new URL(collectionUrl, window.location?.href || 'http://localhost/');
      nextUrl.searchParams.set('bbox', bbox.join(','));
      nextUrl.searchParams.set('limit', String(this.editingLimits_.pageSize));
      const documents = [];
      let bytes = 0;
      let coordinates = 0;
      let lastPageStarted = 0;
      // Each validated next link determines the following page, so requests stay sequential.
      // eslint-disable-next-line no-await-in-loop
      while (nextUrl) {
        if (seen.has(nextUrl.href)) throw new Error('DataIDEE pagination contains a repeated link.');
        seen.add(nextUrl.href);
        const expectedCollection = new URL(collectionUrl);
        const normalizedPath = (pathname) => pathname.split('/').map((part) => {
          try { return decodeURIComponent(part); } catch (error) { return part; }
        }).join('/').replace(/\/$/, '');
        const expectedPath = normalizedPath(expectedCollection.pathname);
        const nextPath = normalizedPath(nextUrl.pathname);
        const validPath = nextPath === expectedPath || nextPath.startsWith(`${expectedPath}/`);
        if (nextUrl.origin !== expectedCollection.origin || !validPath) {
          throw new Error('DataIDEE pagination link escaped the collection.');
        }
        const pageUrl = new URL(nextUrl.href);
        const ticket = window.IDEE?.config?.TICKET;
        if (ticket) pageUrl.searchParams.set('ticket', ticket);
        const waitMs = Math.max(0, this.readThrottleMs_ - (Date.now() - lastPageStarted));
        if (waitMs > 0) {
          // Honor the configured read interval while following pages sequentially.
          // eslint-disable-next-line no-await-in-loop
          await new Promise((resolve) => {
            window.setTimeout(resolve, waitMs);
          });
        }
        lastPageStarted = Date.now();
        // eslint-disable-next-line no-await-in-loop
        const response = await window.fetch(pageUrl.href, {
          cache: 'no-store',
          headers: {
            Accept: 'application/geo+json, application/json',
            ...(this.getToken() ? { Authorization: `Bearer ${this.getToken()}` } : {}),
          },
        });
        if (!response.ok) throw new Error(`DataIDEE preparation failed (HTTP ${response.status}).`);
        // eslint-disable-next-line no-await-in-loop
        const text = await response.text();
        bytes += new Blob([text]).size;
        if (bytes > this.editingLimits_.maxBytes) {
          throw new Error('DataIDEE edit area exceeds the GeoJSON size limit; reduce the area.');
        }
        const page = JSON.parse(text);
        if (page.type !== 'FeatureCollection' || !Array.isArray(page.features)) {
          throw new Error('DataIDEE returned an incomplete page.');
        }
        documents.push(...page.features);
        if (documents.length > this.editingLimits_.maxFeatures) {
          throw new Error('DataIDEE edit area exceeds the feature limit; reduce the area.');
        }
        const count = (value) => {
          if (!Array.isArray(value)) return 0;
          if (typeof value[0] === 'number') return 1;
          return value.reduce((sum, part) => sum + count(part), 0);
        };
        const supportedGeometry = new Set([
          'Point', 'MultiPoint', 'LineString', 'MultiLineString', 'Polygon', 'MultiPolygon',
        ]);
        if (page.features.some((feature) => !supportedGeometry.has(feature.geometry?.type))) {
          throw new Error('DataIDEE edit area contains an unsupported or missing geometry type.');
        }
        const oversizedFeature = page.features.find((feature) => (
          count(feature.geometry?.coordinates) > this.editingLimits_.maxCoordinates
          || new Blob([JSON.stringify(feature)]).size > this.editingLimits_.maxBytes
        ));
        if (oversizedFeature) {
          throw new Error('One DataIDEE feature exceeds the edit budget. Zooming in will not '
            + 'reduce its vertex count; edit a simpler feature or ask for a larger limit.');
        }
        coordinates += page.features.reduce((sum, feature) => (
          sum + count(feature.geometry?.coordinates)
        ), 0);
        if (coordinates > this.editingLimits_.maxCoordinates) {
          throw new Error('DataIDEE edit area exceeds the coordinate limit; reduce the area '
            + 'or use simpler geometries.');
        }
        const next = page.links?.find((link) => link.rel === 'next')?.href;
        if (next) {
          nextUrl = new URL(next, nextUrl);
          const initialUrl = new URL(collectionUrl);
          const pageTarget = nextUrl;
          initialUrl.searchParams.forEach((value, key) => {
            if (!['offset', 'page'].includes(key)) pageTarget.searchParams.set(key, value);
          });
        } else nextUrl = null;
      }
      const features = this.formater_.read(JSON.stringify({ type: 'FeatureCollection', features: documents }), {
        featureProjection: getProj(this.map.getProjection().code),
      });
      if (features.some((feature) => feature.getId() === undefined || feature.getId() === null)) {
        throw new Error('DataIDEE returned an entity without a server identifier.');
      }
      this.facadeVector_.removeFeatures(this.facadeVector_.getFeatures(true));
      this.facadeVector_.addFeatures(features);
      const source = this.olLayer.getSource();
      this.loaded_ = true;
      const session = new DataIDEEEditingSession(this.facadeVector_, {
        features: source.getFeatures(),
        capabilities,
        format: new FormatGeoJSON(),
        projection: this.map.getMapImpl().getView().getProjection(),
        limits: { ...this.editingLimits_ },
        layerImpl: this,
        schema: capabilities.schema,
      });
      this.editingSession_ = session;
      return {
        features: source.getFeatures(),
        capabilities,
        bbox: bbox.slice(),
        limits: { ...this.editingLimits_ },
        session,
      };
    } catch (error) {
      this.editing_ = false;
      this.requestedViewport_ = null;
      throw error;
    }
  }

  endEditing(refresh = true) {
    this.editingSession_?.destroy();
    this.editingSession_ = null;
    this.editing_ = false;
    this.requestedViewport_ = null;
    this.requestRevision_ += 1;
    if (refresh && this.bboxStrategy_) return this.updateSource_(false, true);
    return Promise.resolve();
  }

  getEditingSession() { return this.editingSession_ || null; }

  getTransactions_() {
    const collectionUrl = `${this.url}/collections/${encodeURIComponent(this.name)}`;
    if (this.transactionCollectionUrl_ !== collectionUrl) {
      this.transactions_ = new DataIDEETransactions({
        url: this.url,
        collection: this.name,
        parameters: this.options.transactionParameters,
        headers: this.options.transactionHeaders,
        defaultProperties: this.options.dataideeDefaultProperties,
        getToken: () => this.getToken(),
        tokenLocation: this.vendorOptions_.tokenLocation,
      });
      this.transactionCollectionUrl_ = collectionUrl;
    }
    return this.transactions_;
  }

  createFeature(feature) { return this.getTransactions_().create(feature); }

  getEditingFeature(id) { return this.getTransactions_().getFeature(id); }

  updateFeature(id, feature, method, etag) {
    return this.getTransactions_().update(id, feature, etag, method);
  }

  deleteFeature(id, etag) { return this.getTransactions_().delete(id, etag); }

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
    if (this.editing_) return;
    if (this.map && this.viewportKey_(this.getVisibleBbox_()) !== this.requestedViewport_) {
      this.updateSource_(false);
    }
  }

  addTo(map, addLayer = true) {
    this.destroyed_ = false;
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
    this.destroyed_ = true;
    this.editingSession_?.destroy();
    this.editingSession_ = null;
    this.editing_ = false;
    this.preparingEditing_ = false;
    this.removeViewportListeners_?.();
    this.removeViewportListeners_ = null;
    this.requestedViewport_ = null;
    this.requestRevision_ += 1;
    this.requestManager_.dispose();
    super.destroy();
  }
}

export default DataIDEE;
