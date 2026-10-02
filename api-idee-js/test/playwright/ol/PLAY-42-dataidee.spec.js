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
