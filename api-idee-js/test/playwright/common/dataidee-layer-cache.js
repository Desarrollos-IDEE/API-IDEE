import { test, expect } from '@playwright/test';

export default function registerDataIDEECacheLayerTests(pagePath) {
  [true, false].forEach((cache) => {
    test(`DataIDEE applies bbox responses to the native layer with cache=${cache}`, async ({ page }) => {
      const bboxA = [-6.2, 37.25, -5.85, 37.55];
      const bboxB = [-6.1, 37.3, -5.75, 37.6]; // Overlap does not make requests identical.
      const requestedBboxes = [];
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.route('https://dataidee-cache.test/**', (route) => {
        const bbox = new URL(route.request().url()).searchParams.get('bbox');
        requestedBboxes.push(bbox);
        return route.fulfill({
          contentType: 'application/geo+json',
          body: JSON.stringify({
            type: 'FeatureCollection',
            features: [{
              type: 'Feature',
              id: bbox === bboxA.join(',') ? 'zone-a' : 'zone-b',
              geometry: { type: 'Point', coordinates: [-6, 37.4] },
              properties: {},
            }],
          }),
        });
      });
      await page.goto(pagePath);
      await page.evaluate(({ enabled, bbox }) => {
        window.map = IDEE.map({ container: 'map' });
        window.cacheLayer = new IDEE.layer.DataIDEE({
          url: 'https://dataidee-cache.test/', name: 'places', bbox,
        }, { cache: enabled });
        window.cacheLayerLoads = 0;
        window.cacheLayerErrors = 0;
        window.cacheLayer.on('load', () => { window.cacheLayerLoads += 1; });
        window.cacheLayer.on('load:error', () => { window.cacheLayerErrors += 1; });
        window.map.addLayers(window.cacheLayer);
      }, { enabled: cache, bbox: bboxA });

      const expectApplied = async (id, loads) => {
        await expect.poll(() => page.evaluate(() => {
          const layer = window.cacheLayer;
          const native = layer.getImpl().getLayer();
          const nativeIds = native.getSource
            ? (native.getSource()?.getFeatures() || []).map((feature) => feature.getId())
            : native.entities.values.map((entity) => entity.id);
          return {
            facadeIds: layer.getFeatures().map((feature) => feature.getId()),
            nativeIds,
            loads: window.cacheLayerLoads,
            errors: window.cacheLayerErrors,
          };
        })).toEqual({
          facadeIds: [id], nativeIds: [id], loads, errors: 0,
        });
      };
      const reload = async (bbox, replaceSource = false) => {
        await page.evaluate(({ nextBbox, replace }) => {
          window.cacheLayer.bbox = nextBbox;
          // Exercise the layer's normal load/application path. Public refresh() forces network.
          // No loader calls, feature insertion or rendering are performed by this test.
          window.cacheLayer.getImpl().refresh(replace);
        }, { nextBbox: bbox, replace: replaceSource });
      };

      await expectApplied('zone-a', 1);
      await reload(bboxB);
      await expectApplied('zone-b', 2);
      await reload(bboxA, true);
      await expectApplied('zone-a', 3);
      await reload(bboxA);
      await expectApplied('zone-a', 4);
      expect(requestedBboxes).toEqual(cache
        ? [bboxA.join(','), bboxB.join(',')]
        : [bboxA.join(','), bboxB.join(','), bboxA.join(','), bboxA.join(',')]);

      await page.evaluate(() => window.cacheLayer.clearCache());
      await reload(bboxA);
      await expectApplied('zone-a', 5);
      expect(requestedBboxes).toHaveLength(cache ? 3 : 5);
      expect(errors).toEqual([]);
    });
  });
}
