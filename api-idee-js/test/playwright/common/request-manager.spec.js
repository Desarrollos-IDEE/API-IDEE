import { test, expect } from '@playwright/test';

function registerRequestManagerTests(pagePath) {
  test.describe('RequestManager genérico', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(pagePath);
      await page.evaluate(() => {
        const layer = new IDEE.layer.DataIDEE({ url: 'https://unused.test/', name: 'roads' });
        // Exercise the implementation bundled for this rendering engine without exporting it.
        // eslint-disable-next-line no-underscore-dangle
        window.RequestManager = layer.getImpl().requestManager_.constructor;
        window.makeManager = (options = {}) => new window.RequestManager(options);
      });
    });

    test('almacena tipos de resultado distintos y comparte operaciones idénticas', async ({ page }) => {
      const result = await page.evaluate(async () => {
        const manager = window.makeManager({ cache: true });
        const payload = new Uint8Array([1, 2, 3]);
        let calls = 0;
        const execute = async () => {
          calls += 1;
          return { value: payload, cacheable: true, bytes: payload.byteLength };
        };
        const first = manager.request({ key: 'bytes', execute });
        const second = manager.request({ key: 'bytes', execute });
        const sameOperation = first === second;
        const [a, b] = await Promise.all([first, second]);
        const cached = await manager.request({ key: 'bytes', execute });
        const json = { items: [{ id: 1 }] };
        const jsonResult = await manager.request({
          key: 'json',
          execute: async () => {
            calls += 1;
            return { value: json, cacheable: true, bytes: 16 };
          },
        });
        const cachedJson = await manager.request({
          key: 'json',
          execute: async () => { throw new Error('JSON cache missed'); },
        });
        return {
          sameOperation,
          calls,
          sameValue: a === b && b === cached,
          byteLength: cached.byteLength,
          sameJson: json === jsonResult && jsonResult === cachedJson,
          jsonItems: cachedJson.items.length,
        };
      });
      expect(result).toEqual({
        sameOperation: true,
        calls: 2,
        sameValue: true,
        byteLength: 3,
        sameJson: true,
        jsonItems: 1,
      });
    });

    test('usa la clave literal y mantiene cachés independientes por instancia', async ({ page }) => {
      const result = await page.evaluate(async () => {
        const first = window.makeManager({ cache: true });
        const second = window.makeManager({ cache: true });
        let calls = 0;
        const run = (manager, key) => manager.request({
          key,
          execute: async () => {
            calls += 1;
            return { value: calls, cacheable: true, bytes: 1 };
          },
        });
        const values = [await run(first, 'url?a=1&b=2'), await run(first, 'url?b=2&a=1')];
        await run(first, 'url?a=1&b=2');
        values.push(await run(second, 'url?a=1&b=2'));
        return { values, calls };
      });
      expect(result).toEqual({ values: [1, 2, 3], calls: 3 });
    });

    test('respeta TTL, tamaño, entradas y resultados no almacenables', async ({ page }) => {
      await page.clock.install();
      await page.clock.pauseAt(new Date(Date.now() + 1000));
      const result = await page.evaluate(async () => {
        const manager = window.makeManager({ cache: { ttlMs: 100, maxEntries: 1, maxBytes: 4 } });
        let calls = 0;
        const run = (key, options = {}) => manager.request({
          key,
          force: options.force || false,
          execute: async () => {
            calls += 1;
            return {
              value: calls,
              cacheable: options.cacheable !== false,
              bytes: options.bytes === undefined ? 2 : options.bytes,
            };
          },
        });
        const values = [
          await run('a'),
          await run('a'),
          await run('b'),
          await run('large', { bytes: 5 }),
          await run('a'),
          await run('a', { force: true, cacheable: false }),
          await run('a'),
        ];
        return { values, calls, storedBytes: manager.cacheBytes };
      });
      expect(result).toEqual({ values: [1, 1, 2, 3, 4, 5, 6], calls: 6, storedBytes: 2 });
    });

    test('expira desde el momento de almacenamiento', async ({ page }) => {
      await page.clock.install();
      // El tiempo real no avanza el reloj: solo runFor (márgenes de 1 ms en el TTL)
      await page.clock.pauseAt(new Date(Date.now() + 1000));
      const result = await page.evaluate(async () => {
        const manager = window.makeManager({ cache: { ttlMs: 100 } });
        let calls = 0;
        const execute = async () => {
          calls += 1;
          return { value: calls, cacheable: true, bytes: 1 };
        };
        const first = await manager.request({ key: 'ttl', execute });
        await manager.request({ key: 'ttl', execute });
        window.ttlManager = manager;
        window.ttlCalls = calls;
        return { first, calls };
      });
      expect(result.first).toBe(1);
      await page.clock.runFor(99);
      const stillCached = await page.evaluate(async () => {
        const value = await window.ttlManager.request({
          key: 'ttl',
          execute: async () => { throw new Error('unexpired cache missed'); },
        });
        return { value, calls: window.ttlCalls };
      });
      expect(stillCached).toEqual({ value: 1, calls: 1 });
      await page.clock.runFor(2);
      const expired = await page.evaluate(async () => {
        const value = await window.ttlManager.request({
          key: 'ttl',
          execute: async () => {
            window.ttlCalls += 1;
            return { value: window.ttlCalls, cacheable: true, bytes: 1 };
          },
        });
        return { value, calls: window.ttlCalls };
      });
      expect(expired).toEqual({ value: 2, calls: 2 });
    });

    /* Desactivado hasta que el endpoint DataIDEE esté maduro (hoy no hay un servicio real usable por CORS); reactivar entonces.
    test('el adaptador DataIDEE respeta no-store y no almacena GeoJSON inválido', async ({ page }) => {
      let noStoreCalls = 0;
      await page.route('https://cache-control.test/**', async (route) => {
        noStoreCalls += 1;
        await route.fulfill({
          status: 200,
          headers: { 'cache-control': 'no-store' },
          contentType: 'application/geo+json',
          body: JSON.stringify({ type: 'FeatureCollection', features: [] }),
        });
      });
      await page.evaluate(() => {
        window.map = IDEE.map({ container: 'map' });
      });
      const noStoreResponse = page.waitForResponse((response) => (
        response.url().startsWith('https://cache-control.test/')
      ));
      await page.evaluate(() => {
        window.noStoreLayer = new IDEE.layer.DataIDEE({
          url: 'https://cache-control.test/collections/', name: 'roads',
        }, { cache: true });
        window.map.addLayers(window.noStoreLayer);
      });
      await noStoreResponse;
      await page.waitForFunction(() => {
        // eslint-disable-next-line no-underscore-dangle
        return window.noStoreLayer.getImpl().requestManager_.inFlight.size === 0;
      });
      await page.evaluate(async () => {
        const implementation = window.noStoreLayer.getImpl();
        // eslint-disable-next-line no-underscore-dangle
        await implementation.requestFeatures_();
        // eslint-disable-next-line no-underscore-dangle
        await implementation.requestFeatures_();
      });
      expect(noStoreCalls).toBe(3);

      let invalidCalls = 0;
      await page.route('https://invalid-json.test/**', async (route) => {
        invalidCalls += 1;
        await route.fulfill({
          status: 200,
          contentType: 'application/geo+json',
          body: invalidCalls === 1 ? '{ invalid' : JSON.stringify({
            type: 'FeatureCollection', features: [],
          }),
        });
      });
      const invalidResponse = page.waitForResponse((response) => (
        response.url().startsWith('https://invalid-json.test/')
      ));
      await page.evaluate(() => {
        window.invalidLayer = new IDEE.layer.DataIDEE({
          url: 'https://invalid-json.test/collections/', name: 'roads',
        }, { cache: true });
        window.map.addLayers(window.invalidLayer);
      });
      await invalidResponse;
      await page.waitForFunction(() => {
        // eslint-disable-next-line no-underscore-dangle
        return window.invalidLayer.getImpl().requestManager_.inFlight.size === 0;
      });
      const result = await page.evaluate(async () => {
        const implementation = window.invalidLayer.getImpl();
        // eslint-disable-next-line no-underscore-dangle
        const firstValid = await implementation.requestFeatures_();
        // eslint-disable-next-line no-underscore-dangle
        const cached = await implementation.requestFeatures_();
        return { firstValid: firstValid.length, cached: cached.length };
      });
      expect(result).toEqual({ firstValid: 0, cached: 0 });
      expect(invalidCalls).toBe(2);
    });
    */

    test('la cola all conserva pendientes y latest ejecuta solo la última', async ({ page }) => {
      await page.clock.install();
      // El tiempo real no avanza el reloj: solo runFor (márgenes de 1 ms en el TTL)
      await page.clock.pauseAt(new Date(Date.now() + 1000));
      await page.evaluate(() => {
        window.allStarted = [];
        window.allTimes = [];
        const manager = window.makeManager({ throttleMs: 100 });
        const run = (key) => manager.request({
          key,
          execute: async () => {
            window.allStarted.push(key);
            window.allTimes.push(performance.now());
            return { value: key, cacheable: false, bytes: 0 };
          },
        });
        run('A');
        run('B').catch(() => {});
      });
      expect(await page.evaluate(() => window.allStarted)).toEqual(['A']);
      await page.clock.runFor(100);
      expect(await page.evaluate(() => window.allStarted)).toEqual(['A', 'B']);
      const elapsed = await page.evaluate(() => window.allTimes[1] - window.allTimes[0]);
      expect(elapsed).toBeGreaterThanOrEqual(100);

      await page.evaluate(() => {
        window.latestStarted = [];
        const manager = window.makeManager({ throttleMs: 100, pendingPolicy: 'latest' });
        const run = (key) => manager.request({
          key,
          execute: async () => {
            window.latestStarted.push(key);
            return { value: key, cacheable: false, bytes: 0 };
          },
        });
        run('A').catch(() => {});
      });
      expect(await page.evaluate(() => window.latestStarted)).toEqual(['A']);
      await page.evaluate(() => {
        window.latestStarted = [];
        window.latestManager = window.makeManager({ throttleMs: 100, pendingPolicy: 'latest' });
        const run = (key) => window.latestManager.request({
          key,
          execute: async () => {
            window.latestStarted.push(key);
            return { value: key, cacheable: false, bytes: 0 };
          },
        });
        run('A').catch(() => {});
        run('B').catch(() => {});
        run('C').catch(() => {});
      });
      await page.clock.runFor(100);
      expect(await page.evaluate(() => window.latestStarted)).toEqual(['A', 'C']);
    });

    test('agrupa refrescos y encola una sola actualización tras una petición normal', async ({ page }) => {
      const result = await page.evaluate(async () => {
        const manager = window.makeManager({ cache: true });
        let finishNormal;
        let calls = 0;
        const normal = manager.request({
          key: 'same',
          execute: () => new Promise((resolve) => {
            calls += 1;
            finishNormal = resolve;
          }),
        });
        await Promise.resolve();
        const executeFresh = async ({ force }) => {
          calls += 1;
          return { value: force, cacheable: true, bytes: 1 };
        };
        const freshA = manager.request({ key: 'same', force: true, execute: executeFresh });
        const freshB = manager.request({ key: 'same', force: true, execute: executeFresh });
        const grouped = freshA === freshB;
        finishNormal({ value: 'normal', cacheable: true, bytes: 1 });
        return {
          normal: await normal, fresh: await freshA, grouped, calls,
        };
      });
      expect(result).toEqual({
        normal: 'normal', fresh: true, grouped: true, calls: 2,
      });
    });

    test('clearCache impide reutilizar y almacenar resultados de generaciones anteriores', async ({ page }) => {
      const result = await page.evaluate(async () => {
        const manager = window.makeManager({ cache: true });
        let finish;
        let calls = 0;
        const old = manager.request({
          key: 'same',
          execute: () => {
            calls += 1;
            return new Promise((resolve) => { finish = resolve; });
          },
        });
        await Promise.resolve();
        manager.clearCache();
        const current = manager.request({
          key: 'same',
          execute: async () => {
            calls += 1;
            return { value: 'current', cacheable: true, bytes: 1 };
          },
        });
        finish({ value: 'old', cacheable: true, bytes: 1 });
        const oldValue = await old;
        const currentValue = await current;
        const cached = await manager.request({
          key: 'same',
          execute: async () => {
            calls += 1;
            return { value: 'wrong', cacheable: true, bytes: 1 };
          },
        });
        return {
          oldValue, currentValue, cached, calls,
        };
      });
      expect(result).toEqual({
        oldValue: 'old', currentValue: 'current', cached: 'current', calls: 2,
      });
    });

    test('dispose cancela las promesas activas y un error permite reintentar', async ({ page }) => {
      const result = await page.evaluate(async () => {
        const manager = window.makeManager({ cache: true });
        let finish;
        const pending = manager.request({ key: 'pending', execute: () => new Promise((resolve) => { finish = resolve; }) });
        const cancellation = pending.catch((error) => error.name);
        await Promise.resolve();
        manager.dispose();
        finish({ value: 'late', cacheable: true, bytes: 1 });
        const cancelled = await cancellation;
        const retryManager = window.makeManager({ cache: true });
        let calls = 0;
        await retryManager.request({
          key: 'retry',
          execute: async () => {
            calls += 1;
            if (calls === 1) throw new Error('offline');
            return { value: null, cacheable: true, bytes: 0 };
          },
        }).catch(() => {});
        const retried = await retryManager.request({
          key: 'retry',
          execute: async () => {
            calls += 1;
            return { value: null, cacheable: true, bytes: 0 };
          },
        });
        return { cancelled, retried, calls };
      });
      expect(result).toEqual({ cancelled: 'RequestCancelledError', retried: null, calls: 2 });
    });
  });
}

export default registerRequestManagerTests;
