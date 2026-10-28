import { test, expect } from '@playwright/test';

const pageOne = {
  type: 'FeatureCollection',
  features: [{
    type: 'Feature',
    id: 0,
    properties: { name: 'first' },
    geometry: { type: 'Point', coordinates: [0, 0] },
  }],
  links: [{ rel: 'next', href: 'items?offset=1' }],
};
const pageTwo = {
  type: 'FeatureCollection',
  features: [{
    type: 'Feature',
    id: 2,
    properties: { name: 'second' },
    geometry: { type: 'Point', coordinates: [1, 1] },
  }],
  links: [],
};

test('DataIDEE prepares every page, fixes the edit bbox and suppresses reads while editing', async ({ page }) => {
  const itemReads = [];
  await page.route('**/edit-api/**', async (route) => {
    const requestUrl = new URL(route.request().url());
    const path = requestUrl.pathname;
    if (path.endsWith('/conformance')) {
      await route.fulfill({ json: { conforms: ['create', 'update', 'patch', 'delete'] } });
    } else if (path.endsWith('/queryables')) {
      await route.fulfill({ json: { properties: { name: { type: 'string' } } } });
    } else if (path.endsWith('/collections/places')) {
      await route.fulfill({ json: { id: 'places', writable: true } });
    } else if (path.endsWith('/items')) {
      itemReads.push(requestUrl.href);
      await route.fulfill({ json: Number(requestUrl.searchParams.get('offset')) > 0 ? pageTwo : pageOne });
    } else {
      await route.fulfill({ status: 404 });
    }
  });
  await page.goto('/test/playwright/ol/basic-ol.html');
  await page.evaluate(() => {
    window.map = IDEE.map({ container: 'map' });
  });
  await page.waitForFunction(() => window.map.isFinished());
  await page.evaluate(() => {
    window.editLayer = new IDEE.layer.DataIDEE({
      url: `${window.location.origin}/edit-api`, name: 'places', limit: 10,
    }, { bboxStrategy: true, editingLimits: { pageSize: 1, maxFeatures: 4 } });
    window.map.addLayers(window.editLayer);
  });
  await page.waitForFunction(() => window.editLayer.getFeatures().length === 1);
  const count = await page.evaluate(async () => {
    const prepared = await window.editLayer.beginEditing({ bbox: [-2, -2, 2, 2] });
    window.editPrepared = prepared;
    return prepared.features.length;
  });
  expect(count, JSON.stringify(itemReads)).toBe(2);
  const editRequests = itemReads.length;
  expect(editRequests).toBeGreaterThanOrEqual(3);
  await page.evaluate(() => {
    window.map.getMapImpl().getView().setCenter([100000, 100000]);
    window.editLayer.refresh();
    window.editLayer.clearCache();
    return new Promise((resolve) => {
      window.requestAnimationFrame(() => window.requestAnimationFrame(resolve));
    });
  });
  await page.waitForLoadState('networkidle');
  expect(itemReads).toHaveLength(editRequests);
  await page.evaluate(() => window.editLayer.endEditing());
});

test('DataIDEE rejects an oversized edit area without replacing loaded features', async ({ page }) => {
  await page.route('**/edit-limit-api/**', async (route) => {
    const requestUrl = new URL(route.request().url());
    if (requestUrl.pathname.endsWith('/conformance')) {
      await route.fulfill({ json: { conforms: ['create'] } });
    } else if (requestUrl.pathname.endsWith('/queryables')) {
      await route.fulfill({ json: { properties: {} } });
    } else if (requestUrl.pathname.endsWith('/collections/places')) {
      await route.fulfill({ json: { id: 'places', writable: true } });
    } else {
      await route.fulfill({ json: Number(requestUrl.searchParams.get('offset')) > 0 ? pageTwo : pageOne });
    }
  });
  await page.goto('/test/playwright/ol/basic-ol.html');
  await page.evaluate(() => {
    window.map = IDEE.map({ container: 'map' });
  });
  await page.waitForFunction(() => window.map.isFinished());
  await page.evaluate(() => {
    window.limitLayer = new IDEE.layer.DataIDEE({
      url: `${window.location.origin}/edit-limit-api`, name: 'places', limit: 10,
    }, { editingLimits: { pageSize: 1, maxFeatures: 1 } });
    window.map.addLayers(window.limitLayer);
  });
  await page.waitForFunction(() => window.limitLayer.getFeatures().length === 1);
  await page.waitForFunction(() => window.limitLayer.getFeatures().length === 1);
  const before = await page.evaluate(() => window.limitLayer.getFeatures().length);
  const error = await page.evaluate(async () => {
    try {
      await window.limitLayer.beginEditing({ bbox: [-2, -2, 2, 2] });
      return '';
    } catch (exception) {
      return exception.message;
    }
  });
  expect(error).toContain('feature limit');
  expect(await page.evaluate(() => window.limitLayer.getFeatures().length)).toBe(before);
});

test('DataIDEE editing authenticates service metadata, pages and writes with the current token', async ({ page }) => {
  const requests = [];
  const features = new Map([
    ['5', {
      type: 'Feature',
      id: 5,
      properties: { nombre: 'Antes', category: 'field' },
      geometry: { type: 'Point', coordinates: [0, 0] },
    }],
  ]);
  await page.route('**/protected-api/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    requests.push({
      path: url.pathname,
      method: request.method(),
      auth: request.headers().authorization,
    });
    if (request.headers().authorization !== 'Bearer second-token') {
      await route.fulfill({ status: 401, json: { error: 'Unauthorized' } });
      return;
    }
    if (url.pathname.endsWith('/conformance')) {
      await route.fulfill({ json: { conformsTo: ['http://www.opengis.net/spec/ogcapi-features-4/1.0/conf/features'] } });
    } else if (url.pathname.endsWith('/collections/externa:puntos')
      || url.pathname.endsWith('/collections/externa%3Apuntos')) {
      await route.fulfill({ json: { id: 'externa:puntos' } });
    } else if (url.pathname.endsWith('/queryables')) {
      await route.fulfill({ json: { properties: { nombre: { type: 'string' } } } });
    } else if (url.pathname.endsWith('/schema')) {
      await route.fulfill({
        json: {
          type: 'object',
          required: ['nombre'],
          properties: {
            id: { type: 'integer', readOnly: true },
            geometry: { format: 'geometry-point', 'x-ogc-role': 'primary-geometry' },
            nombre: { type: 'string' },
          },
        },
      });
    } else if (url.pathname.endsWith('/items/5')) {
      if (request.method() === 'PATCH') {
        const patchBody = request.postDataJSON();
        const current = features.get('5');
        features.set('5', { ...current, ...patchBody, properties: { ...current.properties, ...patchBody.properties } });
        await route.fulfill({ json: features.get('5') });
      } else if (request.method() === 'GET') {
        await route.fulfill({ json: features.get('5'), headers: { ETag: '"5-v1"' } });
      } else await route.fulfill({ status: 204 });
    } else if (url.pathname.endsWith('/items')) {
      if (request.method() === 'POST') {
        const created = { ...request.postDataJSON(), id: 6 };
        features.set('6', created);
        await route.fulfill({ status: 201, headers: { Location: `${url.pathname}/6` }, body: '' });
      } else {
        await route.fulfill({ json: { type: 'FeatureCollection', features: [...features.values()], links: [] } });
      }
    } else if (url.pathname.endsWith('/items/6')) {
      await route.fulfill({ json: features.get('6') });
    } else if (url.pathname === '/protected-api/') {
      await route.fulfill({ json: { links: [{ rel: 'service-desc', href: '/protected-api/api' }] } });
    } else if (url.pathname.endsWith('/api')) {
      await route.fulfill({
        json: {
          paths: {
            '/collections/externa:puntos/items': { get: {}, post: {} },
            '/collections/externa:puntos/items/{featureId}': { get: {}, patch: {}, delete: {} },
          },
        },
      });
    } else await route.fulfill({ status: 404 });
  });
  await page.goto('/test/playwright/ol/basic-ol.html');
  await page.evaluate(() => { window.map = IDEE.map({ container: 'map' }); });
  await page.waitForFunction(() => window.map.isFinished());
  const initialRead = page.waitForResponse((response) => (
    response.url().includes('/protected-api/')
    && response.url().includes('/items')
    && response.request().headers().authorization === 'Bearer first-token'
  ));
  await page.evaluate(() => {
    window.protectedLayer = new IDEE.layer.DataIDEE({
      url: `${window.location.origin}/protected-api`, name: 'externa:puntos',
    }, {}, { getFeature: { token: 'first-token' }, tokenLocation: 'header' });
    window.map.addLayers(window.protectedLayer);
  });
  await initialRead;
  await page.evaluate(() => window.protectedLayer.setToken('second-token'));
  await page.waitForFunction(() => window.protectedLayer.getFeatures().length === 1);
  requests.length = 0;
  const capabilities = await page.evaluate(() => window.protectedLayer.getEditingCapabilities());
  expect(capabilities).toMatchObject({
    create: true, update: true, delete: true, geometryTypes: ['point'],
  });
  expect(capabilities.creationFields).toContainEqual({ name: 'nombre', type: 'string', required: true });
  const prepared = await page.evaluate(() => window.protectedLayer.beginEditing({
    bbox: [-2, -2, 2, 2],
  }));
  expect(prepared.features).toHaveLength(1);
  await page.evaluate(async () => {
    await window.protectedLayer.createFeature({
      type: 'Feature',
      properties: { nombre: 'Nueva' },
      geometry: { type: 'Point', coordinates: [1, 1] },
    });
    await window.protectedLayer.updateFeature(5, {
      type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: [2, 2] },
    }, 'PATCH', '"5-v1"');
    window.protectedLayer.endEditing(false);
  });
  expect(requests.some(({ path }) => path.endsWith('/api'))).toBeTruthy();
  expect(requests.filter(({ method }) => method === 'GET').every(({ auth }) => auth === 'Bearer second-token')).toBeTruthy();
  expect(requests.some(({ method, path }) => method === 'POST' && path.endsWith('/items'))).toBeTruthy();
  expect(requests.some(({ method, path }) => method === 'PATCH' && path.endsWith('/items/5'))).toBeTruthy();
  ['conformance', 'queryables', 'schema', '/api', '/items/6'].forEach((suffix) => {
    expect(requests.some(({ path }) => path.endsWith(suffix)), suffix).toBeTruthy();
  });
  expect(features.get('5').properties).toEqual({ nombre: 'Antes', category: 'field' });
});
