/** DataIDEE-only OGC API Features transaction client. */
export default class DataIDEETransactions {
  constructor({
    url, collection, parameters = {}, headers = {}, defaultProperties = {},
  }) {
    const base = new URL(url, window.location?.href || 'http://localhost/');
    ['bbox', 'limit', 'offset', 'f', 'filter', 'filter-lang', '_ideeRefresh']
      .forEach((key) => base.searchParams.delete(key));
    const collectionPath = `/collections/${encodeURIComponent(collection)}`;
    const itemsPath = `${collectionPath}/items`;
    if (base.pathname.endsWith(itemsPath)) base.pathname = base.pathname.slice(0, -'/items'.length);
    else if (!base.pathname.endsWith(collectionPath)) {
      base.pathname = `${base.pathname.replace(/\/+$/, '')}${collectionPath}`;
    }
    this.collectionUrl_ = base.href.replace(/\/$/, '');
    const readOnlyParameters = new Set([
      'bbox', 'limit', 'offset', 'f', 'filter', 'filter-lang', '_ieerefresh',
    ]);
    this.parameters_ = Object.fromEntries(Object.entries(parameters).filter(([key]) => (
      !readOnlyParameters.has(key.toLowerCase())
    )));
    this.headers_ = headers;
    this.defaultProperties_ = defaultProperties;
  }

  async request(url, options = {}) {
    const target = new URL(url, window.location?.href || 'http://localhost/');
    Object.entries(this.parameters_).forEach(([key, value]) => target.searchParams.set(key, value));
    const ticket = window.IDEE?.config?.TICKET;
    if (ticket && target.origin === new URL(this.collectionUrl_).origin) {
      target.searchParams.set('ticket', ticket);
    }
    const response = await window.fetch(target.href, {
      cache: 'no-store',
      ...options,
      headers: { Accept: 'application/geo+json, application/json', ...this.headers_, ...options.headers },
    });
    if (!response.ok) {
      const error = new Error(`DataIDEE transaction failed (HTTP ${response.status}).`);
      error.status = response.status;
      throw error;
    }
    return response;
  }

  async capabilities() {
    const [conformanceResponse, collectionResponse, queryables] = await Promise.all([
      this.request(`${this.collectionUrl_.split('/collections/')[0]}/conformance`),
      this.request(this.collectionUrl_),
      this.queryables(),
    ]);
    const [conformance, collection] = await Promise.all([
      conformanceResponse.json(), collectionResponse.json(),
    ]);
    const conforms = (conformance.conforms || []).join(' ').toLowerCase();
    const writable = collection.writable === true;
    return {
      create: writable && /create|transactions/.test(conforms),
      update: writable && /update|replace|transactions/.test(conforms),
      delete: writable && /delete|transactions/.test(conforms),
      updateMethod: /patch/.test(conforms) ? 'PATCH' : 'PUT',
      collection,
      queryables,
    };
  }

  async queryables() {
    try {
      const response = await this.request(`${this.collectionUrl_}/queryables`);
      return response.json();
    } catch (error) {
      if (error.status === 404) return null;
      throw error;
    }
  }

  getItemsUrl() { return `${this.collectionUrl_}/items`; }

  async getFeature(id) {
    const response = await this.request(`${this.collectionUrl_}/items/${encodeURIComponent(id)}`);
    return { feature: await response.json(), etag: response.headers.get('ETag') };
  }

  async create(feature) {
    const properties = { ...this.defaultProperties_, ...(feature.properties || {}) };
    Object.keys(properties).forEach((key) => {
      if (properties[key] === '') delete properties[key];
    });
    const payload = { ...feature, properties };
    const response = await this.request(`${this.collectionUrl_}/items`, {
      method: 'POST', headers: { 'Content-Type': 'application/geo+json' }, body: JSON.stringify(payload),
    });
    const location = response.headers.get('Location');
    const responseText = response.status === 204 ? '' : await response.text();
    let created = responseText ? JSON.parse(responseText) : null;
    if ((!created || (created.id === undefined && created.id !== 0)) && location) {
      const itemUrl = new URL(location, response.url);
      const collectionUrl = new URL(this.collectionUrl_);
      if (itemUrl.origin !== collectionUrl.origin
        || !itemUrl.pathname.startsWith(`${collectionUrl.pathname}/items/`)) {
        throw new Error('DataIDEE returned a Location outside the configured collection.');
      }
      const itemResponse = await this.request(itemUrl.href);
      created = await itemResponse.json();
    }
    return { feature: created, location };
  }

  async update(id, feature, etag, method) {
    const updateMethod = method || 'PATCH';
    const body = updateMethod === 'PATCH' ? { geometry: feature.geometry } : feature;
    const headers = { 'Content-Type': 'application/merge-patch+json' };
    if (updateMethod === 'PUT') headers['Content-Type'] = 'application/geo+json';
    if (etag && !/^W\//i.test(etag)) headers['If-Match'] = etag;
    const response = await this.request(`${this.collectionUrl_}/items/${encodeURIComponent(id)}`, {
      method: updateMethod, headers, body: JSON.stringify(body),
    });
    return response.status === 204 ? null : response.json();
  }

  async delete(id, etag) {
    const headers = {};
    if (etag && !/^W\//i.test(etag)) headers['If-Match'] = etag;
    await this.request(`${this.collectionUrl_}/items/${encodeURIComponent(id)}`, { method: 'DELETE', headers });
  }
}
