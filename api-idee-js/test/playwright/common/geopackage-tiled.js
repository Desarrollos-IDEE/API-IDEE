import { test, expect } from '@playwright/test';
import { createGdalGeoPackage, createGeoPackage, prepareGeoPackagePage } from '../ol/fixtures/geopackage';

const LARGE_POINTS = [];
for (let column = 0; column <= 200; column += 1) {
  for (let row = 0; row <= 100; row += 1) {
    LARGE_POINTS.push([-10 + (column * 0.1), 30 + (row * 0.3)]);
  }
}

let largePackage;
const getLargePackage = () => {
  if (!largePackage) {
    largePackage = createGdalGeoPackage(LARGE_POINTS.map(([x, y], index) => ({
      type: 'Feature',
      properties: { title: `Punto ${index}`, description: 'd'.repeat(250) },
      geometry: { type: 'Point', coordinates: [x, y] },
    })));
  }
  return largePackage;
};

/**
 * Sirve un fichero con o sin soporte de rangos HTTP y anota peticiones y bytes.
 */
const serveFile = async (page, pattern, data, { ranges = true } = {}) => {
  const bytes = Buffer.from(data);
  const state = { requests: [], bytes: 0 };
  await page.route(pattern, async (route) => {
    const header = route.request().headers().range;
    state.requests.push(header || null);
    const match = ranges && header ? /bytes=(\d+)-(\d*)/.exec(header) : null;
    if (!match) {
      state.bytes += bytes.length;
      await route.fulfill({
        status: 200,
        body: bytes,
        headers: { 'Content-Type': 'application/geopackage+sqlite3', 'Content-Length': String(bytes.length) },
      });
      return;
    }
    const start = Number(match[1]);
    const end = Math.min(match[2] ? Number(match[2]) : bytes.length - 1, bytes.length - 1);
    if (start >= bytes.length) {
      await route.fulfill({ status: 416, headers: { 'Content-Range': `bytes */${bytes.length}` } });
      return;
    }
    const body = bytes.subarray(start, end + 1);
    state.bytes += body.length;
    await route.fulfill({
      status: 206,
      body,
      headers: {
        'Content-Type': 'application/geopackage+sqlite3',
        'Content-Range': `bytes ${start}-${end}/${bytes.length}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': String(body.length),
      },
    });
  });
  return state;
};

/**
 * Pruebas de la carga por extensión visible de GeoPackage, comunes a OL y Cesium.
 * @param {String} engine 'ol' o 'cesium'.
 */
export default function registerGeoPackageTiledTests(engine) {
  test.describe(`GeoPackage con carga por extensión (${engine})`, () => {
    test.beforeEach(async ({ page }) => {
      await prepareGeoPackagePage(page, { engine });
      await page.evaluate(() => {
        window.map = IDEE.map({
          container: 'map', layers: [], controls: [], center: [0, 0], zoom: 5,
        });
        window.moveTo = (lon, lat, zoom = 5) => {
          const native = window.map.getMapImpl();
          if (native.getView) {
            const x = (lon * 20037508.342789244) / 180;
            const y = ((Math.log(Math.tan(((90 + lat) * Math.PI) / 360)) / (Math.PI / 180))
              * 20037508.342789244) / 180;
            native.getView().setCenter([x, y]);
            native.getView().setZoom(zoom);
          } else {
            const { camera } = native;
            camera.setView({
              destination: camera.position.constructor.fromDegrees(
                lon,
                lat,
                3000000 / (2 ** (zoom - 5)),
              ),
              orientation: { heading: 0, pitch: -Math.PI / 2, roll: 0 },
            });
            camera.moveEnd.raiseEvent();
          }
        };
        window.titles = (layer) => layer.getFeatures()
          .map((feature) => feature.getAttribute('title')).sort();
      });
    });

    test('solo carga las entidades visibles y las acumula al mover la vista', async ({ page }) => {
      await page.evaluate(async () => {
        window.moveTo(0, 0);
        const gpkg = new IDEE.layer.GeoPackage({
          url: '/fixtures/geopackage/bbox.gpkg', name: 'b', tiled: true,
        });
        const loaded = new Promise((resolve) => { gpkg.once(IDEE.evt.LOAD_LAYERS, resolve); });
        window.map.addLayers(gpkg);
        await loaded;
        window.places = gpkg.getLayer('places');
      });
      const titles = () => page.evaluate(() => window.titles(window.places));

      await expect.poll(titles, { timeout: 20000 }).toEqual(['Origen']);
      await page.evaluate(() => window.moveTo(100, 0));
      await expect.poll(titles, { timeout: 20000 }).toEqual(['Este', 'Origen']);
      await page.evaluate(() => window.moveTo(0, 0));
      await page.waitForTimeout(500);
      expect(await titles()).toEqual(['Este', 'Origen']);
    });

    test('una recarga pide la extensión visible al fichero nuevo', async ({ page }) => {
      const state = { version: 'vector', requests: 0 };
      await page.route(/\/fixtures\/refresh\/data\.gpkg/, async (route) => {
        state.requests += 1;
        await route.fulfill({
          body: await createGeoPackage(state.version),
          contentType: 'application/geopackage+sqlite3',
        });
      });
      await page.evaluate(async () => {
        window.moveTo(0, 0);
        window.gpkg = new IDEE.layer.GeoPackage({
          url: '/fixtures/refresh/data.gpkg', name: 'r', tiled: true,
        });
        const loaded = new Promise((resolve) => { window.gpkg.once(IDEE.evt.LOAD_LAYERS, resolve); });
        window.map.addLayers(window.gpkg);
        await loaded;
        window.places = window.gpkg.getLayer('places');
      });
      const titles = () => page.evaluate(() => window.titles(window.places));
      await expect.poll(titles, { timeout: 20000 }).toEqual(['Origen']);

      state.version = 'bbox';
      await page.evaluate(() => window.gpkg.refresh());
      expect(state.requests).toBe(2);
      await expect.poll(titles, { timeout: 20000 }).toEqual(['Origen']);
      await page.evaluate(() => window.moveTo(100, 0));
      await expect.poll(titles, { timeout: 20000 }).toEqual(['Este', 'Origen']);
      expect(state.requests).toBe(2);
    });

    const addRangePackage = (page, url, options = {}) => page.evaluate(async ([source, extra]) => {
      window.moveTo(0, 45, 9);
      window.gpkg = new IDEE.layer.GeoPackage({
        url: source, name: 'r', loadStrategy: 'range', ...extra,
      });
      const loaded = new Promise((resolve) => { window.gpkg.once(IDEE.evt.LOAD_LAYERS, resolve); });
      window.map.addLayers(window.gpkg);
      await loaded;
      window.places = window.gpkg.getLayer('places');
    }, [url, options]);
    const loadedPoints = (page) => page.evaluate(() => window.places.getFeatures()
      .map((feature) => feature.getAttribute('title')));

    test('range: un BBOX pequeño de un GeoPackage grande solo pide una parte del fichero', async ({ page }) => {
      const bytes = await getLargePackage();
      const state = await serveFile(page, '**/fixtures/range/large.gpkg*', bytes);
      await addRangePackage(page, '/fixtures/range/large.gpkg');

      await expect.poll(async () => (await loadedPoints(page)).length, { timeout: 30000 })
        .toBeGreaterThan(0);
      const titles = await loadedPoints(page);
      expect(titles.length).toBeLessThan(LARGE_POINTS.length / 10);
      expect(new Set(titles).size).toBe(titles.length);
      expect(state.requests.length).toBeGreaterThan(1);
      expect(state.requests.every((header) => /^bytes=\d+-\d+$/.test(header))).toBe(true);
      expect(state.bytes).toBeLessThan(bytes.length / 10);
      const summary = await page.evaluate(() => ({
        strategy: window.gpkg.loadStrategy,
        metadata: window.gpkg.getMetadata().tables.places.count,
        json: window.gpkg.toJSON().options.loadStrategy,
        exported: window.gpkg.toGeoJSON().features.length,
      }));
      expect(summary).toEqual({
        strategy: 'range', metadata: LARGE_POINTS.length, json: 'range', exported: titles.length,
      });
    });

    test('range: si el servidor no admite rangos se descarga una sola vez', async ({ page }) => {
      const bytes = await getLargePackage();
      const state = await serveFile(page, '**/fixtures/range-off/large.gpkg*', bytes, { ranges: false });
      await addRangePackage(page, '/fixtures/range-off/large.gpkg');

      await expect.poll(async () => (await loadedPoints(page)).length, { timeout: 30000 })
        .toBeGreaterThan(0);
      expect(state.requests).toHaveLength(1);
      expect(state.bytes).toBe(bytes.length);
      expect((await loadedPoints(page)).length).toBeLessThan(LARGE_POINTS.length / 10);
    });

    test('range: sin índice espacial recorre la tabla por rangos y filtra la extensión', async ({ page }) => {
      const bytes = new Uint8Array(await createGeoPackage('bbox'));
      const state = await serveFile(page, '**/fixtures/range/bbox.gpkg*', bytes);
      await page.evaluate(() => window.moveTo(0, 0));
      await page.evaluate(async () => {
        window.gpkg = new IDEE.layer.GeoPackage({
          url: '/fixtures/range/bbox.gpkg', name: 'b', loadStrategy: 'range',
        });
        const loaded = new Promise((resolve) => { window.gpkg.once(IDEE.evt.LOAD_LAYERS, resolve); });
        window.map.addLayers(window.gpkg);
        await loaded;
        window.places = window.gpkg.getLayer('places');
      });

      await expect.poll(() => page.evaluate(() => window.titles(window.places)), { timeout: 20000 })
        .toEqual(['Origen']);
      expect(state.requests.every((header) => header !== null)).toBe(true);
    });

    test('range: el parámetro se serializa y un valor no válido se rechaza', async ({ page }) => {
      const result = await page.evaluate(() => {
        const gpkg = new IDEE.layer.GeoPackage({
          url: '/fixtures/range/x.gpkg', loadStrategy: 'range', rangeBlockSize: 16384,
        });
        let invalid;
        try {
          // eslint-disable-next-line no-new
          new IDEE.layer.GeoPackage({ url: '/x.gpkg', loadStrategy: 'tiles' });
        } catch (error) {
          invalid = String(error);
        }
        return {
          strategy: gpkg.loadStrategy,
          tiled: new IDEE.layer.GeoPackage({ url: '/x.gpkg', tiled: true }).loadStrategy,
          full: new IDEE.layer.GeoPackage({ url: '/x.gpkg' }).loadStrategy,
          options: gpkg.options,
          invalid,
          message: IDEE.language.getValue('exception').geopackage_load_strategy,
        };
      });

      expect(result).toMatchObject({
        strategy: 'range',
        tiled: 'bbox',
        full: 'full',
        options: { loadStrategy: 'range', rangeBlockSize: 16384 },
      });
      expect(result.invalid).toBe(result.message);
    });

    test('bbox: en modo descarga reutiliza el R*Tree del fichero', async ({ page }) => {
      const bytes = await getLargePackage();
      await serveFile(page, '**/fixtures/download/large.gpkg*', bytes, { ranges: false });
      const extent = [-1.05, 44.05, 1.05, 45.95];
      const result = await page.evaluate(async (bounds) => {
        const gpkg = new IDEE.layer.GeoPackage({
          url: '/fixtures/download/large.gpkg', name: 'd', loadStrategy: 'bbox',
        });
        await gpkg.whenReady();
        const { bboxLoader } = gpkg.getLayer('places').constructorParameters.parameters;
        const collection = bboxLoader(bounds, 'EPSG:4326');
        return {
          synchronous: Array.isArray(collection.features),
          titles: collection.features.map(({ properties }) => properties.title),
          ids: collection.features.every(({ id }) => typeof id === 'string'),
        };
      }, extent);

      const expected = LARGE_POINTS.map(([x, y], index) => [x, y, `Punto ${index}`])
        .filter(([x, y]) => x >= extent[0] && x <= extent[2] && y >= extent[1] && y <= extent[3])
        .map(([, , title]) => title);
      expect(result.synchronous).toBe(true);
      expect(result.ids).toBe(true);
      expect(result.titles.sort()).toEqual(expected.sort());
    });
  });
}
