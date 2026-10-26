/** DataIDEE-only OGC API Features transaction client. */
const normalizedPath = (pathname) => pathname.split('/').map((part) => {
  try { return decodeURIComponent(part); } catch (error) { return part; }
}).join('/').replace(/\/$/, '');

export default class DataIDEETransactions {
  constructor({
    url,
    collection,
    parameters = {},
    headers = {},
    defaultProperties = {},
    getToken = () => undefined,
    tokenLocation = 'header',
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
    this.getToken_ = getToken;
    this.tokenLocation_ = tokenLocation;
  }

  async request(url, options = {}) {
    const target = new URL(url, window.location?.href || 'http://localhost/');
    Object.entries(this.parameters_).forEach(([key, value]) => target.searchParams.set(key, value));
    const ticket = window.IDEE?.config?.TICKET;
    if (ticket && target.origin === new URL(this.collectionUrl_).origin) {
      target.searchParams.set('ticket', ticket);
    }
    const token = this.getToken_();
    if (token && this.tokenLocation_ === 'query') target.searchParams.set('token', token);
    const response = await window.fetch(target.href, {
      cache: 'no-store',
      ...options,
      headers: {
        Accept: 'application/geo+json, application/json, application/schema+json, application/vnd.oai.openapi+json',
        ...this.headers_,
        ...options.headers,
        ...(token && this.tokenLocation_ !== 'query'
          ? { Authorization: `Bearer ${token}` } : {}),
      },
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
    const conformanceValues = conformance.conformsTo || conformance.conforms || [];
    const conforms = conformanceValues.join(' ').toLowerCase();
    const writable = collection.writable !== false;
    const collectionBase = new URL(this.collectionUrl_);
    const collectionRoot = `${collectionBase.origin}${collectionBase.pathname.split('/collections/')[0]}/`;
    let operations = null;
    try {
      const serviceResponse = await this.request(collectionRoot);
      const service = await serviceResponse.json();
      const descriptionLink = service.links?.find((link) => link.rel === 'service-desc');
      if (descriptionLink) {
        const descriptionUrl = new URL(descriptionLink.href, collectionRoot);
        if (descriptionUrl.origin !== collectionBase.origin) {
          throw new Error('DataIDEE service description escaped the configured origin.');
        }
        const response = await this.request(descriptionUrl.href);
        const document = await response.json();
        const collectionPath = new URL(this.collectionUrl_).pathname;
        const servicePath = new URL(collectionRoot).pathname.replace(/\/$/, '');
        const relativeCollectionPath = collectionPath.startsWith(`${servicePath}/`)
          ? collectionPath.slice(servicePath.length) : collectionPath;
        const itemsPath = Object.keys(document.paths || {}).find((path) => (
          [collectionPath, relativeCollectionPath].some((candidate) => (
            decodeURIComponent(path.replace(/\/$/, ''))
              === `${decodeURIComponent(candidate)}/items`
          ))
        ));
        const featurePath = Object.keys(document.paths || {}).find((path) => (
          [collectionPath, relativeCollectionPath].some((candidate) => (
            decodeURIComponent(path.replace(/\/$/, ''))
              === `${decodeURIComponent(candidate)}/items/{featureId}`
          ))
        ));
        operations = itemsPath ? {
          items: document.paths[itemsPath],
          feature: featurePath ? document.paths[featurePath] : {},
        } : null;
      }
    } catch (error) {
      if (error.status !== 404) throw error;
    }
    const methods = new Set(Object.keys(operations?.items || {})
      .map((method) => method.toUpperCase()));
    const featureMethods = new Set(Object.keys(operations?.feature || {})
      .map((method) => method.toUpperCase()));
    const queryablesResponse = queryables;
    let schemaResponse = null;
    try {
      schemaResponse = await this.request(`${this.collectionUrl_}/schema`);
    } catch (error) {
      if (error.status !== 404) throw error;
    }
    const schema = schemaResponse ? await schemaResponse.json() : null;
    const writableFromApi = operations !== null;
    const capability = (method, standard) => writable && (writableFromApi
      ? methods.has(method) : new RegExp(standard).test(conforms));
    return {
      create: capability('POST', 'create|transactions'),
      update: writable && (operations !== null
        ? featureMethods.has('PATCH') || featureMethods.has('PUT')
        : /update|replace|transactions/.test(conforms)),
      delete: writable && (operations !== null
        ? featureMethods.has('DELETE') : /delete|transactions/.test(conforms)),
      updateMethod: featureMethods.has('PATCH') || /patch/.test(conforms) ? 'PATCH' : 'PUT',
      collection,
      queryables: queryablesResponse,
      schema,
      geometryTypes: schema?.['x-ogc-geometry-types'] || (schema
        ? Object.values(schema.properties || {})
          .filter((property) => property['x-ogc-role'] === 'primary-geometry')
          .map((property) => property.format?.replace('geometry-', '')) : null),
      creationFields: schema ? Object.entries(schema.properties || {})
        .filter(([name, property]) => name !== 'id' && !property.readOnly
          && property['x-ogc-role'] !== 'primary-geometry')
        .map(([name, property]) => ({
          name,
          type: property.type || 'string',
          required: (schema.required || []).includes(name),
        })) : [],
      clientAssignedId: schema?.properties?.id?.readOnly !== true
        && schema?.properties?.id !== undefined,
      idType: schema?.properties?.id?.type || null,
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
        || !normalizedPath(itemUrl.pathname).startsWith(`${normalizedPath(collectionUrl.pathname)}/items/`)) {
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
