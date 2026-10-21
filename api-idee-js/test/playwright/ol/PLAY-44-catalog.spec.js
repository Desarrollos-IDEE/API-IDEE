import { test, expect } from '@playwright/test';

const COLLECTION_ID = 'mosaico-landsat-1';
const ITEM_ID = '1972-1975';
const COLLECTION_BBOX = [
  -18.221080160839303,
  27.62650537240788,
  4.8568444785445655,
  43.88073491367543,
];

const STAC_URL = 'https://stac-gneis.idee.es';
const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': '*',
  'access-control-allow-methods': 'GET, POST, OPTIONS',
};
const ITEM = {
  type: 'Feature',
  stac_version: '1.0.0',
  id: ITEM_ID,
  collection: COLLECTION_ID,
  bbox: COLLECTION_BBOX,
  geometry: {
    type: 'Polygon',
    coordinates: [[[-18.2, 27.6], [4.8, 27.6], [4.8, 43.8], [-18.2, 43.8], [-18.2, 27.6]]],
  },
  properties: { 'eo:gsd': 60, platform: 'landsat-1', 'mosaic:reference_year': 1972 },
  links: [],
  assets: {},
};
const itemCollection = (features) => ({
  type: 'FeatureCollection', features, numberMatched: features.length, numberReturned: features.length,
});

/**
 * Catálogo STAC simulado (el servicio real no es estable desde el entorno de pruebas).
 * Solo devuelve resultados cuando la petición lleva lo que el cliente debe enviar.
 */
const mockCatalog = (page) => page.route(`${STAC_URL}/**`, (route) => {
  const request = route.request();
  const url = new URL(request.url());
  const json = (body, status = 200) => route.fulfill({
    status, headers: { ...CORS, 'content-type': 'application/json' }, body: JSON.stringify(body),
  });
  if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS });
  const path = url.pathname;
  if (path === '/collections') {
    return json({ collections: [{ id: COLLECTION_ID, type: 'Collection', links: [] }], links: [] });
  }
  if (path === `/collections/${COLLECTION_ID}/queryables`) {
    return json({
      type: 'object',
      properties: {
        'eo:gsd': { type: 'number' },
        platform: { type: 'string' },
        'mosaic:reference_year': { type: 'integer' },
      },
    });
  }
  if (path === `/collections/${COLLECTION_ID}/items`) return json(itemCollection([ITEM]));
  if (path === `/collections/${COLLECTION_ID}/items/${ITEM_ID}`) return json(ITEM);
  if (path === '/search' && request.method() === 'GET') {
    const bbox = (url.searchParams.get('bbox') || '').split(',').map(Number);
    const sameBbox = bbox.length === 4 && bbox.every((v, i) => Math.abs(v - COLLECTION_BBOX[i]) < 1e-9);
    return json(itemCollection(sameBbox ? [ITEM] : []));
  }
  if (path === '/search' && request.method() === 'POST') {
    const body = request.postDataJSON() || {};
    const forCollection = (body.collections || []).includes(COLLECTION_ID);
    const filtered = !!(body.query || body.filter);
    return json(itemCollection(forCollection && filtered ? [ITEM] : []));
  }
  return json({ detail: 'not found' }, 404);
});

test.describe('IDEE.spec.Catalog', () => {
  test.beforeEach(async ({ page }) => {
    await mockCatalog(page);
    await page.goto('/test/playwright/ol/basic-ol.html');
    await page.evaluate(() => {
      const catalog = new IDEE.stac.Catalog({
        url: 'https://stac-gneis.idee.es',
        public: true,
      });
      window.catalog = catalog;
    });
  });

  test('getCollections (public)', async ({ page }) => {
    const collections = await page.evaluate(async () => {
      return await catalog.getCollections();
    });
    await expect(collections.length).toBeGreaterThan(0);
    const ids = collections.map((collection) => collection.id);
    await expect(ids).toContain(COLLECTION_ID);
  });

  test('getQueryableFields (public)', async ({ page }) => {
    const fields = await page.evaluate(async (collectionId) => {
      return await catalog.getQueryableFields(collectionId);
    }, COLLECTION_ID);
    await expect(fields['eo:gsd']).toBeDefined();
    await expect(fields.platform).toBeDefined();
  });

  test('getItems (public)', async ({ page }) => {
    const items = await page.evaluate(async (collectionId) => {
      return await catalog.getItems(collectionId);
    }, COLLECTION_ID);
    const matched = items.numberMatched ?? items.context?.matched;
    await expect(matched).toBeGreaterThan(0);
  });

  test('getItem (public)', async ({ page }) => {
    const item = await page.evaluate(async ({ collectionId, itemId }) => {
      return await catalog.getItem(collectionId, itemId);
    }, { collectionId: COLLECTION_ID, itemId: ITEM_ID });
    await expect(item.id).toEqual(ITEM_ID);
  });

  test('getFilteredItems (public)', async ({ page }) => {
    const items = await page.evaluate(async ({ collectionId, bbox }) => {
      return await catalog.getFilteredItems(collectionId, { bbox });
    }, { collectionId: COLLECTION_ID, bbox: COLLECTION_BBOX });
    const matched = items.numberMatched ?? items.context?.matched;
    await expect(matched).toBeGreaterThan(0);
  });

  test('getFilteredItemsAdvanced (public - stac-query)', async ({ page }) => {
    const items = await page.evaluate(async (collectionId) => {
      const filter = {
        format: 'stac-query',
        filter: {
          'eo:gsd': { eq: 60 },
        },
        limit: 10,
      };
      return await catalog.getFilteredItemsAdvanced(collectionId, filter);
    }, COLLECTION_ID);
    const matched = items.numberMatched ?? items.context?.matched;
    await expect(matched).toBeGreaterThan(0);
  });

  test('getFilteredItemsAdvanced (public - cql-json)', async ({ page }) => {
    const filterBody = await page.evaluate(async (collectionId) => {
      return catalog.getFilterData(collectionId, {
        format: 'cql-json',
        filter: {
          op: 'and',
          args: [
            { op: '=', args: [{ property: 'eo:gsd' }, 60] },
            { op: '=', args: [{ property: 'platform' }, 'landsat-1'] },
          ],
        },
        limit: 10,
      });
    }, COLLECTION_ID);
    await expect(filterBody.filter_lang).toEqual('cql-json');
    await expect(filterBody.collections).toEqual([COLLECTION_ID]);
    await expect(filterBody.limit).toEqual(10);
  });

  test('getFilteredItemsAdvanced (public - cql2-json)', async ({ page }) => {
    const items = await page.evaluate(async (collectionId) => {
      const filter = {
        format: 'cql2-json',
        filter: {
          op: 'and',
          args: [
            { op: '=', args: [{ property: 'eo:gsd' }, 60] },
            { op: '=', args: [{ property: 'mosaic:reference_year' }, 1972] },
          ],
        },
        limit: 10,
      };
      return await catalog.getFilteredItemsAdvanced(collectionId, filter);
    }, COLLECTION_ID);
    const matched = items.numberMatched ?? items.context?.matched;
    await expect(matched).toBeGreaterThan(0);
  });
});
