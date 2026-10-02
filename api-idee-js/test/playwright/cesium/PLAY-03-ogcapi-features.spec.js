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

test('OGCAPIFeaturesJson uses Core item paths and CQL2 with explicit GET in Cesium', async ({ page }) => {
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
    const layer = new IDEE.layer.OGCAPIFeaturesJson({
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

test('OGCAPIFeaturesJson requests an individual feature by ID in Cesium', async ({ page }) => {
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
    window.map.addLayers(new IDEE.layer.OGCAPIFeaturesJson({
      url: 'https://ogc.test/collections/',
      name: 'roads',
      id: 'road-1',
    }));
  });
  const request = await requestPromise;
  expect(request.method()).toBe('GET');
  expect(new URL(request.url()).pathname).toBe('/collections/roads/items/road-1');
});
