import { test, expect } from '@playwright/test';

export default function registerDataIDEEViewportTests(pagePath) {
  // En Cesium las entidades se insertan cuando el globo ha cargado: sin capas remotas por defecto
  const cesium = pagePath.includes('/cesium/');
  const payload = (id) => ({
    type: 'FeatureCollection',
    features: [{
      type: 'Feature',
      id,
      geometry: { type: 'Point', coordinates: [-6, 37.4] },
      properties: {},
    }],
  });
  const setup = async (page, options = {}, controlledClock = false) => {
    await page.goto(pagePath);
    await page.evaluate((isCesium) => {
      if (isCesium) {
        IDEE.config.baseLayer = [];
        IDEE.config.terrain.default = [];
      }
      window.map = IDEE.map({ container: 'map' });
      window.moveView = (offset, zoom = 0, notify = false) => {
        const native = window.map.getMapImpl();
        if (native.getView) {
          native.getView().setCenter([-670000 + offset * 10000, 4495000]);
          native.getView().setZoom(11 + zoom);
          if (notify) native.dispatchEvent('moveend');
        } else {
          const camera = native.camera;
          camera.setView({
            destination: camera.position.constructor.fromDegrees(
              -6 + offset * 0.1,
              37.4,
              50000 / (2 ** zoom),
            ),
            orientation: { heading: 0, pitch: -Math.PI / 2, roll: 0 },
          });
          if (notify) camera.moveEnd.raiseEvent();
        }
      };
    }, cesium);
    await page.waitForFunction(() => !window.map.getMapImpl().getView || window.map.isFinished());
    await page.evaluate(() => window.moveView(0));
    if (controlledClock) await page.clock.install();
    await page.evaluate((opts) => {
      window.viewportLoads = 0;
      window.viewportErrors = 0;
      window.viewportLayer = new IDEE.layer.DataIDEE({
        url: 'https://viewport.test/', name: 'places', bbox: [1, 2, 3, 4],
      }, { bboxStrategy: true, cache: true, ...opts });
      window.viewportLayer.on('load', () => { window.viewportLoads += 1; });
      window.viewportLayer.on('load:error', () => { window.viewportErrors += 1; });
      window.map.addLayers(window.viewportLayer);
    }, options);
  };
  const applied = async (page, ids) => {
    await expect.poll(() => page.evaluate(() => {
      const layer = window.viewportLayer;
      const native = layer.getImpl().getLayer();
      return {
        facade: layer.getFeatures().map((feature) => feature.getId()),
        native: native.getSource
          ? (native.getSource()?.getFeatures() || []).map((feature) => feature.getId())
          : native.entities.values.map((entity) => entity.id),
      };
    }), { timeout: 20000 }).toEqual({ facade: ids, native: ids });
  };
  const move = (page, offset, zoom = 0, notify = false) => (
    page.evaluate((args) => window.moveView(...args), [offset, zoom, notify])
  );

  [true, false].forEach((cache) => {
    test(`DataIDEE viewport follows real pan and zoom with cache=${cache}`, async ({ page }) => {
      const urls = [];
      await page.route('https://viewport.test/**', (route) => {
        urls.push(route.request().url());
        return route.fulfill({ json: payload(`response-${urls.length}`) });
      });
      await setup(page, { cache });
      await applied(page, ['response-1']);
      const firstBbox = new URL(urls[0]).searchParams.get('bbox').split(',').map(Number);
      expect(firstBbox[0]).toBeLessThan(-6);
      expect(firstBbox[2]).toBeGreaterThan(-6);
      expect(firstBbox[1]).toBeGreaterThan(30);
      expect(firstBbox[3]).toBeLessThan(45);
      await move(page, 1);
      await applied(page, ['response-2']);
      await move(page, 1, 1); // A contained extent must still replace the active zone.
      await applied(page, ['response-3']);
      await move(page, 0);
      await applied(page, [cache ? 'response-1' : 'response-4']);
      expect(urls).toHaveLength(cache ? 3 : 4);
      expect(new Set(urls.slice(0, 3)).size).toBe(3);
      if (!cache) expect(urls[3]).toBe(urls[0]);
      await page.setViewportSize({ width: 1000, height: 700 });
      await applied(page, [`response-${cache ? 4 : 5}`]);
    });
  });

  test('DataIDEE viewport option is opt-in and validated', async ({ page }) => {
    const urls = [];
    await page.route('https://viewport.test/**', (route) => {
      urls.push(route.request().url());
      return route.fulfill({ json: payload('fixed') });
    });
    await setup(page, { bboxStrategy: false }, true);
    await applied(page, ['fixed']);
    await page.clock.pauseAt(new Date(Date.now() + 1000));
    await move(page, 2, 1, true);
    await page.clock.runFor(1000);
    expect(urls).toHaveLength(1);
    expect(new URL(urls[0]).searchParams.get('bbox')).toBe('1,2,3,4');
    const invalid = await page.evaluate(() => ['true', 1, null].map((bboxStrategy) => {
      try {
        const layer = new IDEE.layer.DataIDEE({ url: 'https://viewport.test/', name: 'places' }, { bboxStrategy });
        return layer === null;
      } catch (error) { return error instanceof TypeError; }
    }));
    expect(invalid).toEqual([true, true, true]);
  });

  test('DataIDEE viewport throttles to the latest zone and ignores late responses', async ({ page }) => {
    const requests = [];
    let held;
    await page.route('https://viewport.test/**', (route) => {
      requests.push(route.request().url());
      if (requests.length === 2) { held = route; return undefined; }
      return route.fulfill({ json: payload(`response-${requests.length}`) });
    });
    await setup(page, { throttleMs: 300 }, true);
    await applied(page, ['response-1']);
    await page.clock.pauseAt(new Date(Date.now() + 1000));
    await page.clock.runFor(300);
    await move(page, 1, 0, true);
    await expect.poll(() => requests.length).toBe(2);
    await move(page, 2, 0, true);
    await move(page, 3, 0, true);
    await page.clock.runFor(299);
    expect(requests).toHaveLength(2);
    await page.clock.runFor(1);
    await applied(page, ['response-3']);
    await held.fulfill({ json: payload('obsolete') });
    await page.clock.runFor(50);
    await applied(page, ['response-3']);
    await move(page, 0, 0, true);
    await applied(page, ['response-1']);
    expect(requests).toHaveLength(3);
    expect(await page.evaluate(() => window.viewportErrors)).toBe(0);
  });

  test('DataIDEE viewport refreshes the current zone manually and periodically', async ({ page }) => {
    const requests = [];
    await page.route('https://viewport.test/**', (route) => {
      requests.push(new URL(route.request().url()));
      return route.fulfill({ json: payload(`response-${requests.length}`) });
    });
    await setup(page, {}, true);
    await applied(page, ['response-1']);
    // Con el reloj controlado, el fin de movimiento se notifica como en el resto de pruebas
    await move(page, 1, 0, true);
    await applied(page, ['response-2']);
    await page.evaluate(() => { window.viewportLayer.refresh(); window.viewportLayer.refresh(); });
    await applied(page, ['response-3']);
    expect(requests[2].searchParams.has('_ideeRefresh')).toBe(true);
    expect(requests[2].searchParams.get('bbox')).toBe(requests[1].searchParams.get('bbox'));
    await page.clock.pauseAt(new Date(Date.now() + 1000));
    expect(await page.evaluate(() => window.viewportLayer.isAutoRefreshPaused())).toBe(false);
    await page.evaluate(() => window.viewportLayer.startAutoRefresh(1000));
    await page.clock.runFor(1000);
    await expect.poll(() => requests.length).toBe(4);
    expect(await page.evaluate(() => window.viewportLayer.isAutoRefreshPaused())).toBe(false);
    await applied(page, ['response-4']);
    await page.evaluate(() => window.viewportLayer.stopAutoRefresh());
    expect(requests[3].searchParams.has('_ideeRefresh')).toBe(true);
    await move(page, 0, 0, true);
    await applied(page, ['response-1']);
    await move(page, 1, 0, true);
    await applied(page, ['response-4']);
    expect(requests).toHaveLength(4);
  });

  test('DataIDEE viewport retains data on failure, accepts empty results and retries', async ({ page }) => {
    let count = 0;
    await page.route('https://viewport.test/**', (route) => {
      count += 1;
      if (count === 2) return route.fulfill({ status: 500, body: 'failed' });
      if (count === 3) return route.fulfill({ json: { type: 'FeatureCollection', features: [] } });
      return route.fulfill({ json: payload(`response-${count}`) });
    });
    await setup(page);
    await applied(page, ['response-1']);
    await move(page, 1);
    await expect.poll(() => page.evaluate(() => window.viewportErrors)).toBe(1);
    await applied(page, ['response-1']);
    await page.evaluate(() => window.viewportLayer.refresh());
    await expect.poll(() => page.evaluate(() => window.viewportLoads)).toBe(2);
    await applied(page, []);
    await move(page, 0);
    await applied(page, ['response-1']);
    await move(page, 1);
    await applied(page, []);
    expect(count).toBe(3);
  });

  test('DataIDEE viewport cancels queued work on removal and starts clean on reinsertion', async ({ page }) => {
    let count = 0;
    await page.route('https://viewport.test/**', (route) => {
      count += 1;
      return route.fulfill({ json: payload(`response-${count}`) });
    });
    await setup(page, { throttleMs: 10000 }, true);
    await applied(page, ['response-1']);
    await page.clock.pauseAt(new Date(Date.now() + 1000));
    await move(page, 1, 0, true);
    await page.evaluate(() => window.map.removeLayers(window.viewportLayer));
    await move(page, 2, 0, true);
    await page.clock.fastForward(20000);
    expect(count).toBe(1);
    await page.evaluate(() => window.map.addLayers(window.viewportLayer));
    await applied(page, ['response-2']);
    expect(count).toBe(2);
  });

  test('DataIDEE viewport ignores responses from a removed layer after reinsertion', async ({ page }) => {
    let count = 0;
    let held;
    await page.route('https://viewport.test/**', (route) => {
      count += 1;
      if (count === 2) { held = route; return undefined; }
      return route.fulfill({ json: payload(`response-${count}`) });
    });
    await setup(page);
    await applied(page, ['response-1']);
    await move(page, 1);
    await expect.poll(() => Boolean(held)).toBe(true);
    await page.evaluate(() => {
      window.map.removeLayers(window.viewportLayer);
      window.map.addLayers(window.viewportLayer);
    });
    await applied(page, ['response-3']);
    const response = page.waitForResponse(held.request().url());
    await held.fulfill({ json: payload('removed') });
    await (await response).finished();
    await applied(page, ['response-3']);
    await move(page, 0);
    await applied(page, ['response-4']);
    await move(page, 1);
    await applied(page, ['response-3']);
    expect(count).toBe(4);
    expect(await page.evaluate(() => window.viewportErrors)).toBe(0);
  });
}
