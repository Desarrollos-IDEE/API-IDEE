/**
 * @module IDEE/impl/service/DataIDEE
 */
import { addParameters, isNullOrEmpty } from 'IDEE/util/Utils';
import ServiceOGCAPIFeatures from './OGCAPIFeatures';

/**
 * Builds OGC API Features Core item URLs with paging, bbox and CQL2 filters.
 * @api
 */
class DataIDEE extends ServiceOGCAPIFeatures {
  /**
   * @param {Object} layerParameters Shared OGC API Features layer parameters.
   * @param {Object} [vendorOpts={}] Provider options. Supports `filter` as CQL2
   * text or JSON, optional `filterLang`, and `tokenLocation` (`header` by default
   * or `query`) for the optional `getFeature.token`.
   */
  constructor(layerParameters, vendorOpts = {}) {
    super(layerParameters, vendorOpts);
    this.filter_ = vendorOpts.filter;
    this.filterLang_ = vendorOpts.filterLang;
    this.tokenLocation_ = vendorOpts.tokenLocation || 'header';
  }

  /**
   * Creates the collection items URL, including configured filters and paging.
   * @returns {String} URL for the collection items or an individual item.
   */
  getItemsUrl() {
    const [basePath, existingQuery = ''] = this.url_.split('?');
    let pathUrl = basePath.replace(/\/+$/, '');
    if (!isNullOrEmpty(this.name_)) {
      if (!/\/collections$/i.test(pathUrl)) pathUrl += '/collections';
      pathUrl += `/${encodeURIComponent(this.name_)}/items`;
    }
    if (!isNullOrEmpty(this.id_)) pathUrl += `/${encodeURIComponent(this.id_)}`;

    const params = {};
    if (!isNullOrEmpty(this.format_)) params.f = this.format_;
    if (!isNullOrEmpty(this.limit_)) params.limit = this.limit_;
    if (!isNullOrEmpty(this.offset_)) params.offset = this.offset_;
    if (!isNullOrEmpty(this.bbox_)) params.bbox = this.bbox_;

    if (isNullOrEmpty(this.id_)) {
      if (!isNullOrEmpty(this.cql_)) params.filter = this.cql_;
      if (!isNullOrEmpty(this.filter_)) {
        params.filter = typeof this.filter_ === 'object'
          ? JSON.stringify(this.filter_) : this.filter_;
        params['filter-lang'] = this.filterLang_
          || (typeof this.filter_ === 'object' ? 'cql2-json' : 'cql2-text');
      }
      if (!isNullOrEmpty(this.conditional_)) {
        Object.keys(this.conditional_).forEach((key) => {
          params[key] = this.conditional_[key];
        });
      }
    }
    // El token es opcional: una capa pública no envía credenciales.
    const { token, ...getFeatureVendor } = this.getFeatureVendor_ || {};
    Object.assign(params, getFeatureVendor);
    if (this.tokenLocation_ === 'query' && !isNullOrEmpty(token)) params.token = token;

    let requestUrl = pathUrl;
    if (!isNullOrEmpty(existingQuery)) requestUrl += `?${existingQuery}`;
    if (Object.keys(params).length) requestUrl = addParameters(requestUrl, params);
    return requestUrl.replaceAll(' ', '%20');
  }

  /**
   * Returns the authentication headers for item requests.
   * @returns {Object} Request headers.
   */
  getRequestHeaders() {
    const token = this.getFeatureVendor_?.token;
    return this.tokenLocation_ === 'header' && !isNullOrEmpty(token)
      ? { Authorization: `Bearer ${token}` } : {};
  }
}

export default DataIDEE;
