import { test, expect } from '@playwright/test';

const geoJSON = {
  type: 'FeatureCollection',
  features: [{
    type: 'Feature',
    id: 'road-1',
    geometry: { type: 'Point', coordinates: [0, 0] },
    properties: { name: 'Main road' },
  }],
};

test('OGCAPIFeatures keeps the previous GetFeatureUrl request by default', async ({ page }) => {
  await page.route('https://ogc.test/**', (route) => route.fulfill({
    status: 200,
    contentType: 'application/geo+json',
    body: JSON.stringify(geoJSON),
  }));
  await page.goto('/test/playwright/ol/basic-ol.html');
  await page.evaluate(() => {
    window.map = IDEE.map({ container: 'map' });
  });
  await page.waitForFunction(() => window.map.isFinished());

  const requestPromise = page.waitForRequest((request) => request.url().startsWith('https://ogc.test/'));
  await page.evaluate(() => {
    window.map.addLayers(new IDEE.layer.OGCAPIFeatures({
      url: 'https://ogc.test/',
      name: 'roads',
      limit: 4,
    }, {}, { cql: "name = 'Main road'" }));
  });

  const request = await requestPromise;
  expect(request.method()).toBe('GET');
  expect(new URL(request.url()).pathname).toBe('/roads/items');
  expect(new URL(request.url()).searchParams.get('limit')).toBe('4');
  expect(new URL(request.url()).searchParams.get('filter')).toBe("name = 'Main road'");
  expect(new URL(request.url()).searchParams.has('filter-lang')).toBe(false);
});

test('DataIDEE preserves the shared public configuration and performs filtered GET requests', async ({ page }) => {
  await page.route('https://ogc.test/**', (route) => route.fulfill({
    status: 200,
    contentType: 'application/geo+json',
    body: JSON.stringify(geoJSON),
  }));
  await page.goto('/test/playwright/ol/basic-ol.html');
  await page.evaluate(() => {
    window.map = IDEE.map({ container: 'map' });
  });
  await page.waitForFunction(() => window.map.isFinished());

  const requestPromise = page.waitForRequest((request) => request.url().startsWith('https://ogc.test/'));
  const api = await page.evaluate(() => {
    const layer = new IDEE.layer.DataIDEE({
      url: 'https://ogc.test/collections/',
      name: 'roads',
      legend: 'Roads',
      limit: 4,
      offset: 2,
      bbox: [1, 2, 3, 4],
      format: 'json',
      extract: false,
      template: '<div>{name}</div>',
    }, { opacity: 0.8 }, {
      filter: "name = 'Main road'",
      filterLang: 'cql2-text',
    });
    window.ogcLayer = layer;
    window.map.addLayers(layer);
    return {
      name: layer.name,
      url: layer.url,
      legend: layer.legend,
      limit: layer.limit,
      offset: layer.offset,
      bbox: layer.bbox,
      format: layer.format,
      extract: layer.extract,
      template: layer.template,
      equalsMethod: typeof layer.equals,
      setStyleMethod: typeof layer.setStyle,
    };
  });

  const request = await requestPromise;
  const url = new URL(request.url());
  expect(request.method()).toBe('GET');
  expect(url.pathname).toBe('/collections/roads/items');
  expect(url.searchParams.get('limit')).toBe('4');
  expect(url.searchParams.get('offset')).toBe('2');
  expect(url.searchParams.get('bbox')).toBe('1,2,3,4');
  expect(url.searchParams.get('f')).toBe('json');
  expect(url.searchParams.get('filter')).toBe("name = 'Main road'");
  expect(url.searchParams.get('filter-lang')).toBe('cql2-text');
  expect(api).toEqual({
    name: 'roads',
    url: 'https://ogc.test/collections/',
    legend: 'Roads',
    limit: 4,
    offset: 2,
    bbox: [1, 2, 3, 4],
    format: 'json',
    extract: false,
    template: '<div>{name}</div>',
    equalsMethod: 'function',
    setStyleMethod: 'function',
  });
});

test('DataIDEE requests an individual feature by ID', async ({ page }) => {
  await page.route('https://ogc.test/**', (route) => route.fulfill({
    status: 200,
    contentType: 'application/geo+json',
    body: JSON.stringify(geoJSON),
  }));
  await page.goto('/test/playwright/ol/basic-ol.html');
  await page.evaluate(() => {
    window.map = IDEE.map({ container: 'map' });
  });
  await page.waitForFunction(() => window.map.isFinished());

  const requestPromise = page.waitForRequest((request) => request.url().startsWith('https://ogc.test/'));
  await page.evaluate(() => {
    window.map.addLayers(new IDEE.layer.DataIDEE({
      url: 'https://ogc.test/collections/',
      name: 'roads',
      id: 'road-1',
    }));
  });
  const request = await requestPromise;
  expect(request.method()).toBe('GET');
  expect(new URL(request.url()).pathname).toBe('/collections/roads/items/road-1');
});

test('DataIDEE omits the format parameter when the service uses its GeoJSON default', async ({ page }) => {
  await page.route('https://ogc.test/**', (route) => route.fulfill({
    status: 200,
    contentType: 'application/geo+json',
    body: JSON.stringify(geoJSON),
  }));
  await page.goto('/test/playwright/ol/basic-ol.html');
  await page.evaluate(() => {
    window.map = IDEE.map({ container: 'map' });
  });
  await page.waitForFunction(() => window.map.isFinished());

  const requestPromise = page.waitForRequest((request) => request.url().startsWith('https://ogc.test/'));
  await page.evaluate(() => {
    window.map.addLayers(new IDEE.layer.DataIDEE({
      url: 'https://ogc.test/data-idee-api',
      name: 'local:eurovelo_rutas',
      limit: 10,
    }, {}, {
      filter: "etapa = 'Etapa 4'",
      filterLang: 'cql2-text',
    }));
  });
  const url = new URL((await requestPromise).url());
  expect(url.pathname).toBe('/data-idee-api/collections/local%3Aeurovelo_rutas/items');
  expect(url.searchParams.has('f')).toBe(false);
  expect(url.searchParams.get('filter')).toBe("etapa = 'Etapa 4'");
  expect(url.searchParams.get('filter-lang')).toBe('cql2-text');
});

test('DataIDEE keeps the existing CQL vendor option usable', async ({ page }) => {
  await page.route('https://ogc.test/**', (route) => route.fulfill({
    status: 200,
    contentType: 'application/geo+json',
    body: JSON.stringify(geoJSON),
  }));
  await page.goto('/test/playwright/ol/basic-ol.html');
  await page.evaluate(() => {
    window.map = IDEE.map({ container: 'map' });
  });
  await page.waitForFunction(() => window.map.isFinished());

  const requestPromise = page.waitForRequest((request) => request.url().startsWith('https://ogc.test/'));
  await page.evaluate(() => {
    window.map.addLayers(new IDEE.layer.DataIDEE({
      url: 'https://ogc.test/collections/',
      name: 'roads',
    }, {}, { cql: "name = 'Main road'" }));
  });
  const request = await requestPromise;
  const url = new URL(request.url());
  expect(request.method()).toBe('GET');
  expect(url.searchParams.get('filter')).toBe("name = 'Main road'");
  expect(url.searchParams.has('filter-lang')).toBe(false);
});

test('DataIDEE loads features and supports map add, get and remove methods', async ({ page }) => {
  await page.route('https://ogc.test/**', (route) => route.fulfill({
    status: 200,
    contentType: 'application/geo+json',
    body: JSON.stringify(geoJSON),
  }));
  await page.goto('/test/playwright/ol/basic-ol.html');
  await page.evaluate(() => {
    window.map = IDEE.map({ container: 'map' });
  });
  await page.waitForFunction(() => window.map.isFinished());
  await page.evaluate(() => window.map.setCenter([0, 0]));

  const layersAfterAdd = await page.evaluate(() => {
    window.ogcLayer = new IDEE.layer.DataIDEE({
      url: 'https://ogc.test/collections/',
      name: 'roads',
    });
    window.map.addDataIDEE(window.ogcLayer);
    return window.map.getDataIDEE().length;
  });
  expect(layersAfterAdd).toBe(1);
  await page.waitForFunction(() => window.ogcLayer.getFeatures().length === 1);

  const state = await page.evaluate(() => {
    const featuresLoaded = window.ogcLayer.getFeatures().length;
    const layerWasFound = window.map.getDataIDEE('roads')[0] === window.ogcLayer;
    window.map.removeDataIDEE('roads');
    return {
      featuresLoaded,
      layerWasFound,
      layersAfterRemoval: window.map.getDataIDEE().length,
    };
  });
  expect(state).toEqual({ featuresLoaded: 1, layerWasFound: true, layersAfterRemoval: 0 });
});

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'Authorization',
  'access-control-allow-methods': 'GET, OPTIONS',
};

const routeDataIDEE = (page, handler) => page.route('https://ogc.test/**', (route) => {
  if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS });
  return handler(route);
});

const fulfillGeoJSON = (route) => route.fulfill({
  status: 200,
  headers: { ...CORS, 'content-type': 'application/geo+json' },
  body: JSON.stringify(geoJSON),
});

const openBasicMap = async (page) => {
  await page.goto('/test/playwright/ol/basic-ol.html');
  await page.evaluate(() => {
    window.map = IDEE.map({ container: 'map' });
  });
  await page.waitForFunction(() => window.map.isFinished());
};

const isItemsRequest = (request) => request.url().startsWith('https://ogc.test/') && request.method() === 'GET';

test('DataIDEE sends getFeature.token as an Authorization Bearer header and never in the URL', async ({ page }) => {
  await routeDataIDEE(page, fulfillGeoJSON);
  await openBasicMap(page);

  const requestPromise = page.waitForRequest(isItemsRequest);
  await page.evaluate(() => {
    window.map.addLayers(new IDEE.layer.DataIDEE({
      url: 'https://ogc.test/data-idee-api',
      name: 'roads',
      limit: 5,
    }, {}, { getFeature: { token: 'token-1' } }));
  });
  const request = await requestPromise;
  const url = new URL(request.url());
  expect(request.headers().authorization).toBe('Bearer token-1');
  expect(url.searchParams.has('token')).toBe(false);
  expect(url.searchParams.get('limit')).toBe('5');
});

test('DataIDEE setToken reloads the layer with the new token and clone keeps it', async ({ page }) => {
  await routeDataIDEE(page, fulfillGeoJSON);
  await openBasicMap(page);

  await page.evaluate(() => {
    window.ogcLayer = new IDEE.layer.DataIDEE({ url: 'https://ogc.test/data-idee-api', name: 'roads' });
    window.map.addLayers(window.ogcLayer);
  });
  await page.waitForFunction(() => window.ogcLayer.getFeatures().length === 1);

  const requestPromise = page.waitForRequest((request) => isItemsRequest(request)
    && request.headers().authorization === 'Bearer token-2');
  await page.evaluate(() => window.ogcLayer.setToken('token-2'));
  await requestPromise;

  const tokens = await page.evaluate(() => ({
    token: window.ogcLayer.getToken(),
    cloned: window.ogcLayer.clone().getToken(),
  }));
  expect(tokens).toEqual({ token: 'token-2', cloned: 'token-2' });
});

test('DataIDEE fires LOAD_UNAUTHORIZED on 401 and warns the user only once', async ({ page }) => {
  await routeDataIDEE(page, (route) => route.fulfill({
    status: 401,
    headers: { ...CORS, 'content-type': 'application/json' },
    body: '{"status":401}',
  }));
  await openBasicMap(page);

  await page.evaluate(() => {
    window.unauthorizedEvents = 0;
    window.ogcLayer = new IDEE.layer.DataIDEE(
      { url: 'https://ogc.test/data-idee-api', name: 'roads' },
      {},
      { getFeature: { token: 'expired' } },
    );
    window.ogcLayer.on(IDEE.evt.LOAD_UNAUTHORIZED, () => { window.unauthorizedEvents += 1; });
    window.map.addLayers(window.ogcLayer);
  });
  await page.waitForFunction(() => window.unauthorizedEvents === 1);
  await expect(page.locator('div.m-dialog.error')).toHaveCount(1);

  await page.evaluate(() => window.ogcLayer.refresh());
  await page.waitForFunction(() => window.unauthorizedEvents === 2);
  await expect(page.locator('div.m-dialog.error')).toHaveCount(1);
});

test('DataIDEE object literals keep vendorOptions when added to the map', async ({ page }) => {
  await routeDataIDEE(page, fulfillGeoJSON);
  await openBasicMap(page);

  const requestPromise = page.waitForRequest(isItemsRequest);
  await page.evaluate(() => {
    window.map.addLayers({
      type: 'DataIDEE',
      url: 'https://ogc.test/data-idee-api',
      name: 'roads',
      vendorOptions: { getFeature: { token: 'token-3' } },
    });
  });
  expect((await requestPromise).headers().authorization).toBe('Bearer token-3');
});
