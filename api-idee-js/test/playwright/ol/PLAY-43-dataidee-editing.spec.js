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
    } else if (path === '/collections/places') {
      await route.fulfill({ json: { id: 'places', writable: true } });
    } else if (path.endsWith('/items')) {
      itemReads.push(requestUrl.href);
      await route.fulfill({ json: requestUrl.searchParams.has('offset') ? pageTwo : pageOne });
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
  expect(count).toBe(2);
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
      await route.fulfill({ json: requestUrl.searchParams.has('offset') ? pageTwo : pageOne });
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
