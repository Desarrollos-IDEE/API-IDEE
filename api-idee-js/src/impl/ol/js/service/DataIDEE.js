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
   * text or JSON, optional `filterLang` to select the CQL2 encoding and
   * `getFeature.token`, sent as an `Authorization: Bearer` header.
   */
  constructor(layerParameters, vendorOpts = {}) {
    super(layerParameters, vendorOpts);
    this.filter_ = vendorOpts.filter;
    this.filterLang_ = vendorOpts.filterLang;
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
    // El token viaja en la cabecera Authorization, nunca en la URL.
    const getFeatureVendor = { ...this.getFeatureVendor_ };
    delete getFeatureVendor.token;
    Object.assign(params, getFeatureVendor);

    let requestUrl = pathUrl;
    if (!isNullOrEmpty(existingQuery)) requestUrl += `?${existingQuery}`;
    if (Object.keys(params).length) requestUrl = addParameters(requestUrl, params);
    return requestUrl.replaceAll(' ', '%20');
  }

  /**
   * Devuelve las cabeceras de las peticiones de la colección.
   * @returns {Object} Cabecera "Authorization: Bearer" si hay token o un objeto vacío.
   */
  getRequestHeaders() {
    const { token } = this.getFeatureVendor_;
    return isNullOrEmpty(token) ? {} : { Authorization: `Bearer ${token}` };
  }
}

export default DataIDEE;
