import { test, expect } from '@playwright/test';

const COLLECTION_ID = 'mosaico-landsat-1';
const ITEM_ID = '1972-1975';
const COLLECTION_BBOX = [
  -18.221080160839303,
  27.62650537240788,
  4.8568444785445655,
  43.88073491367543,
];

test.describe('IDEE.spec.Catalog', () => {
  test.beforeEach(async ({ page }) => {
    // gneis no expone CORS; Playwright reenvía la petición desde Node sin restricción de origen.
    await page.route('**/gneis.desarrollo.guadaltel.es/**', async (route) => {
      const response = await route.fetch();
      await route.fulfill({ response });
    });

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
