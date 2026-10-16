import { test, expect } from '@playwright/test';

import registerRequestManagerTests from '../common/request-manager.spec';
import registerDataIDEECacheLayerTests from '../common/dataidee-layer-cache';
import registerDataIDEEViewportTests from '../common/dataidee-viewport';

registerDataIDEECacheLayerTests('/test/playwright/cesium/basic-cesium.html');
registerDataIDEEViewportTests('/test/playwright/cesium/basic-cesium.html');

const geoJSON = {
  type: 'FeatureCollection',
  features: [{
    type: 'Feature',
    id: 'road-1',
    geometry: { type: 'Point', coordinates: [0, 0] },
    properties: { name: 'Main road' },
  }],
};

test('DataIDEE uses Core item paths and CQL2 with explicit GET in Cesium', async ({ page }) => {
  await page.route('https://ogc.test/**', (route) => route.fulfill({
    status: 200,
    contentType: 'application/geo+json',
    body: JSON.stringify(geoJSON),
  }));
  await page.goto('/test/playwright/cesium/basic-cesium.html');
  await page.evaluate(() => {
    window.map = IDEE.map({ container: 'map' });
  });

  const requestPromise = page.waitForRequest((request) => request.url().startsWith('https://ogc.test/'));
  await page.evaluate(() => {
    const layer = new IDEE.layer.DataIDEE({
      url: 'https://ogc.test/api',
      name: 'roads',
      limit: 4,
      offset: 2,
      bbox: [1, 2, 3, 4],
      format: 'json',
    }, {}, {
      filter: { op: '>', args: [{ property: 'population' }, 1000] },
    });
    window.ogcLayer = layer;
    window.map.addLayers(layer);
  });

  const request = await requestPromise;
  const url = new URL(request.url());
  expect(request.method()).toBe('GET');
  expect(url.pathname).toBe('/api/collections/roads/items');
  expect(url.searchParams.get('limit')).toBe('4');
  expect(url.searchParams.get('offset')).toBe('2');
  expect(url.searchParams.get('bbox')).toBe('1,2,3,4');
  expect(url.searchParams.get('f')).toBe('json');
  expect(url.searchParams.get('filter')).toBe(JSON.stringify({
    op: '>',
    args: [{ property: 'population' }, 1000],
  }));
  expect(url.searchParams.get('filter-lang')).toBe('cql2-json');
});

test('DataIDEE caches an exact request, invalidates it, and refreshes from the network in Cesium', async ({ page }) => {
  let requestCount = 0;
  await page.route('https://ogc.test/**', async (route) => {
    requestCount += 1;
    await route.fulfill({
      status: 200,
      contentType: 'application/geo+json',
      body: JSON.stringify(geoJSON),
    });
  });
  await page.goto('/test/playwright/cesium/basic-cesium.html');
  await page.evaluate(() => {
    window.map = IDEE.map({ container: 'map' });
  });
  await page.evaluate(() => {
    window.dataIdee = new IDEE.layer.DataIDEE({
      url: 'https://ogc.test/collections/', name: 'roads',
    }, { cache: { ttlMs: 60000 } });
    window.map.addLayers(window.dataIdee);
  });
  await page.waitForFunction(() => window.dataIdee.getFeatures().length === 1);
  await page.evaluate(async () => {
    // This implementation entry point observes the exact same request path as layer loading.
    // eslint-disable-next-line no-underscore-dangle
    await window.dataIdee.getImpl().requestFeatures_();
  });
  expect(requestCount).toBe(1);

  await page.evaluate(() => window.dataIdee.clearCache());
  await page.evaluate(async () => {
    // eslint-disable-next-line no-underscore-dangle
    await window.dataIdee.getImpl().requestFeatures_();
  });
  expect(requestCount).toBe(2);
  const refreshRequest = page.waitForRequest((request) => request.url().includes('_ideeRefresh='));
  await page.evaluate(() => window.dataIdee.refresh());
  await (await refreshRequest).response();
  expect(requestCount).toBe(3);
});

test('DataIDEE requests an individual feature by ID in Cesium', async ({ page }) => {
  await page.route('https://ogc.test/**', (route) => route.fulfill({
    status: 200,
    contentType: 'application/geo+json',
    body: JSON.stringify(geoJSON),
  }));
  await page.goto('/test/playwright/cesium/basic-cesium.html');
  await page.evaluate(() => {
    window.map = IDEE.map({ container: 'map' });
  });

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

test('DataIDEE omits format when the service uses its GeoJSON default in Cesium', async ({ page }) => {
  await page.route('https://ogc.test/**', (route) => route.fulfill({
    status: 200,
    contentType: 'application/geo+json',
    body: JSON.stringify(geoJSON),
  }));
  await page.goto('/test/playwright/cesium/basic-cesium.html');
  await page.evaluate(() => {
    window.map = IDEE.map({ container: 'map' });
  });

  const requestPromise = page.waitForRequest((request) => request.url().startsWith('https://ogc.test/'));
  await page.evaluate(() => {
    window.map.addLayers(new IDEE.layer.DataIDEE({
      url: 'https://ogc.test/data-idee-api',
      name: 'local:farmacias',
    }, {}, {
      filter: "nombre = 'Farmacia Andrade Iglesias Obdulia'",
      filterLang: 'cql2-text',
    }));
  });
  const url = new URL((await requestPromise).url());
  expect(url.pathname).toBe('/data-idee-api/collections/local%3Afarmacias/items');
  expect(url.searchParams.has('f')).toBe(false);
  expect(url.searchParams.get('filter')).toBe("nombre = 'Farmacia Andrade Iglesias Obdulia'");
  expect(url.searchParams.get('filter-lang')).toBe('cql2-text');
});

test('DataIDEE loads Cesium features and supports map add, get and remove methods', async ({ page }) => {
  await page.route('https://ogc.test/**', (route) => route.fulfill({
    status: 200,
    contentType: 'application/geo+json',
    body: JSON.stringify(geoJSON),
  }));
  await page.goto('/test/playwright/cesium/basic-cesium.html');
  await page.evaluate(() => {
    window.map = IDEE.map({ container: 'map' });
  });

  await page.evaluate(() => {
    window.ogcLayer = new IDEE.layer.DataIDEE({
      url: 'https://ogc.test/collections/',
      name: 'roads',
    });
    window.map.addDataIDEE(window.ogcLayer);
  });
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

registerRequestManagerTests('/test/playwright/cesium/basic-cesium.html');
