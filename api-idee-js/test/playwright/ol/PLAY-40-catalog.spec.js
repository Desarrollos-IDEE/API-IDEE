import { test, expect } from '@playwright/test';

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
        url: 'https://earth-search.aws.element84.com/v1',
        authUrl: 'https://gneis.desarrollo.guadaltel.es/o/custom-auth',
        public: true,
      });
      window.catalog = catalog;
    });
  });

  test('Authenticate', async ({ page }) => {
    const valid = await page.evaluate(async () => {
      return await catalog.authenticate('test@liferay.com', 'testt');
    });
    await expect(valid).toEqual(true);
  });

  test('getCollections (public)', async ({ page }) => {
    const collections = await page.evaluate(async () => {
      return await catalog.getCollections();
    });
    await expect(collections.length).toEqual(9);
  });

  test('getCollections (private)', async ({ page }) => {
    const collections = await page.evaluate(async () => {
      catalog.public = false;
      await catalog.authenticate('test@liferay.com', 'testt');
      return await catalog.getCollections();
    });
    await expect(collections.length).toEqual(7);
  });

  test('getQueryableFields (public)', async ({ page }) => {
    const fields = await page.evaluate(async () => {
      return await catalog.getQueryableFields('sentinel-2-pre-c1-l2a');
    });
    await expect(Object.keys(fields)[0]).toEqual('eo:cloud_cover');
  });

  test('getItems (public)', async ({ page }) => {
    const items = await page.evaluate(async () => {
      return await catalog.getItems('sentinel-2-pre-c1-l2a');
    });
    await expect(items.context.matched).toEqual(35018);
  });

  test('getItem (public)', async ({ page }) => {
    const item = await page.evaluate(async () => {
      return await catalog.getItem('sentinel-2-pre-c1-l2a', 'S2B_T21NYC_20221205T140704_L2A');
    });
    await expect(item.id).toEqual('S2B_T21NYC_20221205T140704_L2A');
  });

  test('getFilteredItems (public)', async ({ page }) => {
    const items = await page.evaluate(async () => {
      return await catalog.getFilteredItems('sentinel-2-pre-c1-l2a', { bbox: [-57.392670976770404, 1.5921784022647358, -51.7690820709282, 2.8857595465646]});
    });
    await expect(items.context.matched).toEqual(157);
  });

  test('getFilteredItemsAdvanced (public - stac-query)', async ({ page }) => {
    const items = await page.evaluate(async () => {
      const filter = {
        format: 'stac-query',
        filter: {
          'eo:cloud_cover': {lt: 20},
        },
        limit: 10,
      };
      return await catalog.getFilteredItemsAdvanced('sentinel-2-pre-c1-l2a', filter);
    });
    await expect(items.context.matched).toEqual(7381);
  });

  test('getFilteredItemsAdvanced (public - cql-json)', async ({ page }) => {
    const items = await page.evaluate(async () => {
      const filter = {
        format: 'cql-json',
        filter: {
          op: 'and',
          args: [
            { op: 'gt', args: [{ property: 'eo:cloud_cover' }, 90] },
            { op: 'gte', args: [{ property: 'datetime' }, '2024-01-01T00:00:00Z'] },
          ],
        },
        limit: 10,
      };
      return await catalog.getFilteredItemsAdvanced('sentinel-2-pre-c1-l2a', filter);
    });
    await expect(items.context.matched).toEqual(35018);
  });

  test('getFilteredItemsAdvanced (public - cql2-json)', async ({ page }) => {
    const items = await page.evaluate(async () => {
      const filter = {
        format: 'cql2-json',
        filter: {
          op: 'and',
          args: [
            { op: '<', args: [{ property: 'eo:cloud_cover' }, 20] },
            { op: '>=', args: [{ property: 'datetime' }, '2024-01-01T00:00:00Z'] },
          ],
        },
        limit: 10,
      };
      return await catalog.getFilteredItemsAdvanced('sentinel-2-pre-c1-l2a', filter);
    });
    await expect(items.context.matched).toEqual(35018);
  });
});
