/* Local in-memory OGC API Features service used by the editing example. */
const http = require('http');
const path = require('path');
const fs = require('fs');

const repositoryRoot = path.resolve(__dirname, '../../../../..');
const pluginRoot = path.resolve(__dirname, '../..');
const port = Number(process.env.DATAIDEE_DEMO_PORT || 8787);
const collections = new Map([
  ['demo', [
    {
      type: 'Feature', id: 0, properties: { name: 'Punto 0', category: 'demo' }, geometry: { type: 'Point', coordinates: [0, 0] },
    },
    {
      type: 'Feature', id: 2, properties: { name: 'Línea', category: 'demo' }, geometry: { type: 'LineString', coordinates: [[-1, -1], [0, 0], [1, 1]] },
    },
    {
      type: 'Feature', id: 3, properties: { name: 'Polígono con hueco', category: 'demo' }, geometry: { type: 'Polygon', coordinates: [[[-2, -2], [2, -2], [2, 2], [-2, 2], [-2, -2]], [[-0.5, -0.5], [0.5, -0.5], [0.5, 0.5], [-0.5, 0.5], [-0.5, -0.5]]] },
    },
    {
      type: 'Feature', id: 4, properties: { name: 'Multipunto', category: 'demo' }, geometry: { type: 'MultiPoint', coordinates: [[-1, 0], [1, 0]] },
    },
    {
      type: 'Feature', id: 5, properties: { name: 'Multipolígono', category: 'demo' }, geometry: { type: 'MultiPolygon', coordinates: [[[[-3, -1], [-2, -1], [-2, 0], [-3, 0], [-3, -1]]], [[[2, -1], [3, -1], [3, 0], [2, 0], [2, -1]]]] },
    },
  ]],
  ['readonly', [{
    type: 'Feature', id: 0, properties: { name: 'Solo lectura' }, geometry: { type: 'Point', coordinates: [0, 0] },
  }]],
  ['empty', []],
  ['conflict', [{
    type: 'Feature', id: 0, properties: { name: 'Estado inicial' }, geometry: { type: 'Point', coordinates: [0, 0] },
  }]],
  ['write-error', [{
    type: 'Feature', id: 0, properties: { name: 'Error controlado' }, geometry: { type: 'Point', coordinates: [0, 0] },
  }]],
  ['partial', [0, 2].map((id) => ({
    type: 'Feature', id, properties: { name: `Parcial ${id}` }, geometry: { type: 'Point', coordinates: [id / 100, 0] },
  }))],
  ['uncertain', []],
  ['dense', Array.from({ length: 1001 }, (_, id) => ({
    type: 'Feature', id, properties: { name: `Punto ${id}` }, geometry: { type: 'Point', coordinates: [id / 100000, 0] },
  }))],
  ['complex', [{
    type: 'Feature', id: 1, properties: { name: 'Línea compleja' }, geometry: { type: 'LineString', coordinates: Array.from({ length: 100001 }, (_, index) => [index / 100000, 0]) },
  }]],
]);

const sendJson = (response, status, value, headers = {}) => {
  response.writeHead(status, { 'Content-Type': 'application/geo+json', ...headers });
  response.end(JSON.stringify(value));
};

function initialDemoFeatures() {
  return [
    {
      type: 'Feature', id: 0, properties: { name: 'Punto 0', category: 'demo' }, geometry: { type: 'Point', coordinates: [0, 0] },
    },
    {
      type: 'Feature', id: 2, properties: { name: 'Línea', category: 'demo' }, geometry: { type: 'LineString', coordinates: [[-1, -1], [0, 0], [1, 1]] },
    },
    {
      type: 'Feature', id: 3, properties: { name: 'Polígono con hueco', category: 'demo' }, geometry: { type: 'Polygon', coordinates: [[[-2, -2], [2, -2], [2, 2], [-2, 2], [-2, -2]], [[-0.5, -0.5], [0.5, -0.5], [0.5, 0.5], [-0.5, 0.5], [-0.5, -0.5]]] },
    },
    {
      type: 'Feature', id: 4, properties: { name: 'Multipunto', category: 'demo' }, geometry: { type: 'MultiPoint', coordinates: [[-1, 0], [1, 0]] },
    },
    {
      type: 'Feature', id: 5, properties: { name: 'Multipolígono', category: 'demo' }, geometry: { type: 'MultiPolygon', coordinates: [[[[-3, -1], [-2, -1], [-2, 0], [-3, 0], [-3, -1]]], [[[2, -1], [3, -1], [3, 0], [2, 0], [2, -1]]]] },
    },
  ];
}

function resetCollections() {
  collections.set('demo', initialDemoFeatures());
  collections.set('readonly', [{
    type: 'Feature', id: 0, properties: { name: 'Solo lectura' },
    geometry: { type: 'Point', coordinates: [0, 0] },
  }]);
  collections.set('empty', []);
  collections.set('conflict', [{
    type: 'Feature', id: 0, properties: { name: 'Estado inicial' },
    geometry: { type: 'Point', coordinates: [0, 0] },
  }]);
  collections.set('write-error', [{
    type: 'Feature', id: 0, properties: { name: 'Error controlado' },
    geometry: { type: 'Point', coordinates: [0, 0] },
  }]);
  collections.set('partial', [0, 2].map((id) => ({
    type: 'Feature', id, properties: { name: `Parcial ${id}` },
    geometry: { type: 'Point', coordinates: [id / 100, 0] },
  })));
  collections.set('uncertain', []);
  collections.set('dense', Array.from({ length: 1001 }, (_, id) => ({
    type: 'Feature', id, properties: { name: `Punto ${id}` },
    geometry: { type: 'Point', coordinates: [id / 100000, 0] },
  })));
  collections.set('complex', [{
    type: 'Feature', id: 1, properties: { name: 'Línea compleja' },
    geometry: { type: 'LineString', coordinates: Array.from(
      { length: 100001 }, (_, index) => [index / 100000, 0],
    ) },
  }]);
}

function localApi(request, response, url) {
  const origin = request.headers.origin || `http://localhost:${port}`;
  response.setHeader('Access-Control-Allow-Origin', origin);
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, If-Match, Accept');
  response.setHeader('Access-Control-Expose-Headers', 'Location, ETag, Link');
  if (request.method === 'OPTIONS') {
    response.writeHead(204);
    response.end();
    return;
  }
  if (url.pathname === '/local/') {
    sendJson(response, 200, { links: [{ rel: 'service-desc', href: '/local/api' }] }, {
      'Content-Type': 'application/json',
    });
    return;
  }
  if (url.pathname === '/local/conformance') {
    sendJson(response, 200, {
      conformsTo: [
        'http://www.opengis.net/spec/ogcapi-common-5/1.0/conf/create-replace-delete',
        'http://www.opengis.net/spec/ogcapi-common-5/1.0/conf/update',
        'http://www.opengis.net/spec/ogcapi-features-4/1.0/conf/features',
      ],
    }, { 'Content-Type': 'application/json' });
    return;
  }
  if (url.pathname === '/local/api') {
    const paths = {};
    collections.forEach((features, name) => {
      paths[`/collections/${name}/items`] = { get: {}, post: {} };
      paths[`/collections/${name}/items/{featureId}`] = {
        get: {}, patch: {}, put: {}, delete: {},
      };
    });
    sendJson(response, 200, { paths }, { 'Content-Type': 'application/vnd.oai.openapi+json' });
    return;
  }
  if (request.method === 'POST' && url.pathname === '/local/reset') {
    resetCollections();
    sendJson(response, 200, { reset: true });
    return;
  }
  const match = url.pathname.match(/^\/local\/collections\/([^/]+)(?:\/(queryables|schema|items(?:\/(.+))?))?$/);
  if (!match) return sendJson(response, 404, { error: 'Unknown local collection.' });
  const [, rawName, endpoint, rawId] = match;
  const name = decodeURIComponent(rawName);
  const writable = name !== 'readonly';
  const features = collections.get(name);
  if (!features) return sendJson(response, 404, { error: 'Unknown local collection.' });
  if (endpoint === 'queryables') {
    return sendJson(response, 200, {
      properties: { name: { type: 'string' }, category: { type: 'string' } },
    }, { 'Content-Type': 'application/schema+json' });
  }
  if (endpoint === 'schema') {
    return sendJson(response, 200, {
      type: 'object',
      required: [],
      'x-ogc-geometry-types': [
        'point', 'multipoint', 'linestring', 'multilinestring', 'polygon', 'multipolygon',
      ],
      properties: {
        id: { type: 'integer', 'x-ogc-role': 'id', readOnly: true },
        geometry: { format: 'geometry-point', 'x-ogc-role': 'primary-geometry' },
        name: { type: 'string' },
        category: { type: 'string' },
      },
    }, { 'Content-Type': 'application/schema+json' });
  }
  if (!rawId && !url.pathname.endsWith('/items')) {
    return sendJson(response, 200, { id: name, writable }, { 'Content-Type': 'application/json' });
  }
  if (rawId) {
    const id = decodeURIComponent(rawId);
    const index = features.findIndex((feature) => String(feature.id) === id);
    if (request.method === 'GET') {
      if (index < 0) return sendJson(response, 404, {});
      const result = { ...features[index] };
      if (name === 'conflict') result.properties = { ...result.properties, name: 'Cambio remoto' };
      return sendJson(response, 200, result, { ETag: `"${features[index].id}-v1"` });
    }
    if (!writable) return sendJson(response, 403, { error: 'Read-only collection.' });
    if (index < 0) return sendJson(response, 404, {});
    if (request.headers['if-match'] && request.headers['if-match'] !== `"${id}-v1"`) {
      return sendJson(response, 412, { error: 'ETag conflict.' });
    }
    if (request.method === 'DELETE') {
      features.splice(index, 1);
      response.writeHead(204);
      return response.end();
    }
    let body = '';
    request.on('data', (chunk) => { body += chunk; });
    request.on('end', () => {
      const update = JSON.parse(body);
      if (name === 'partial' && id === '2') return sendJson(response, 422, { error: 'Controlled failure.' });
      if (request.method === 'PATCH') {
        features[index] = {
          ...features[index],
          ...update,
          properties: { ...features[index].properties, ...update.properties },
        };
      } else features[index] = update;
      features[index].id = Number.isNaN(Number(id)) ? id : Number(id);
      sendJson(response, 200, features[index], { ETag: `"${id}-v1"` });
    });
    return undefined;
  }
  if (request.method === 'POST') {
    if (!writable) return sendJson(response, 403, { error: 'Read-only collection.' });
    if (name === 'write-error') return sendJson(response, 422, { error: 'Controlled validation error.' });
    let body = '';
    request.on('data', (chunk) => { body += chunk; });
    request.on('end', () => {
      const feature = JSON.parse(body);
      const id = features.reduce((max, item) => Math.max(max, Number(item.id) || 0), -1) + 1;
      const created = { ...feature, id };
      features.push(created);
      if (name === 'uncertain') {
        response.destroy();
        return;
      }
      sendJson(response, 201, created, { Location: `/local/collections/${name}/items/${id}` });
    });
    return undefined;
  }
  const limit = Math.max(1, Number(url.searchParams.get('limit')) || 250);
  const offset = Math.max(0, Number(url.searchParams.get('offset')) || 0);
  const bboxValue = url.searchParams.get('bbox');
  const bbox = bboxValue ? bboxValue.split(',').map(Number) : null;
  const filtered = bbox?.length === 4 ? features.filter((feature) => {
    const coordinates = feature.geometry?.coordinates;
    const positions = (value) => {
      if (!Array.isArray(value)) return [];
      if (typeof value[0] === 'number' && typeof value[1] === 'number') return [value];
      return value.flatMap(positions);
    };
    const points = positions(coordinates);
    if (points.length === 0) return false;
    const extent = points.reduce((result, [x, y]) => [
      Math.min(result[0], x), Math.min(result[1], y),
      Math.max(result[2], x), Math.max(result[3], y),
    ], [Infinity, Infinity, -Infinity, -Infinity]);
    return extent[0] <= bbox[2] && extent[2] >= bbox[0]
      && extent[1] <= bbox[3] && extent[3] >= bbox[1];
  }) : features;
  const page = filtered.slice(offset, offset + limit);
  const nextUrl = new URL(`/local/collections/${name}/items`, `http://localhost:${port}`);
  url.searchParams.forEach((value, key) => {
    if (key !== 'offset') nextUrl.searchParams.set(key, value);
  });
  nextUrl.searchParams.set('offset', String(offset + limit));
  const links = offset + limit < filtered.length
    ? [{ rel: 'next', href: `${nextUrl.pathname}${nextUrl.search}` }]
    : [];
  return sendJson(response, 200, { type: 'FeatureCollection', features: page, links });
}

const assets = new Map([
  ['/', path.join(__dirname, 'index.html')],
  ['/teunesco.html', path.join(__dirname, 'teunesco.html')],
  ['/demo.js', path.join(__dirname, 'dataidee-demo.js')],
  ['/teunesco.js', path.join(__dirname, 'teunesco-demo.js')],
  ['/assets/apiidee.js', path.join(repositoryRoot, 'dist/js/apiidee-2.0.ol.min.js')],
  ['/assets/apiidee.css', path.join(repositoryRoot, 'dist/assets/css/apiidee-2.0.ol.min.css')],
  ['/assets/configuration.js', path.join(repositoryRoot, 'test/configuration_filtered.js')],
  ['/assets/vectorsmanagement.js', path.join(pluginRoot, 'dist/vectorsmanagement.ol.min.js')],
  ['/assets/vectorsmanagement.css', path.join(pluginRoot, 'dist/vectorsmanagement.ol.min.css')],
]);

http.createServer((request, response) => {
  const url = new URL(request.url, `http://localhost:${port}`);
  if (url.pathname.startsWith('/local/')) return localApi(request, response, url);
  const file = assets.get(url.pathname);
  if (!file || !fs.existsSync(file)) {
    response.writeHead(404);
    return response.end('Build the OpenLayers core and VectorsManagement plugin first.');
  }
  let contentType = 'text/html; charset=utf-8';
  if (file.endsWith('.js')) contentType = 'text/javascript';
  else if (file.endsWith('.css')) contentType = 'text/css';
  response.writeHead(200, { 'Content-Type': contentType, 'Cache-Control': 'no-store' });
  return fs.createReadStream(file).pipe(response);
}).listen(port, '127.0.0.1', () => {
  process.stdout.write(`DataIDEE editing demo: http://127.0.0.1:${port}\n`);
});
