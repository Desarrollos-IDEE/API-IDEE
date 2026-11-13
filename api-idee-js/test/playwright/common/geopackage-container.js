import { test, expect } from '@playwright/test';
import { createGeoPackage, prepareGeoPackagePage } from '../ol/fixtures/geopackage';

const serveVersions = async (page, version) => {
  const state = { version, requests: [] };
  await page.route(/\/fixtures\/refresh\/data\.gpkg/, async (route) => {
    state.requests.push(new URL(route.request().url()));
    await route.fulfill({
      body: await createGeoPackage(state.version),
      contentType: 'application/geopackage+sqlite3',
    });
  });
  return state;
};

/**
 * Pruebas de la API transversal del contenedor GeoPackage, comunes a OL y Cesium.
 * @param {String} engine 'ol' o 'cesium'.
 */
export default function registerGeoPackageContainerTests(engine) {
  test.describe(`GeoPackage como contenedor (${engine})`, () => {
    test.beforeEach(async ({ page }) => {
      await prepareGeoPackagePage(page, { engine });
      await page.evaluate(() => {
        window.map = IDEE.map({
          container: 'map', layers: [], controls: [], center: [0, 0], zoom: 2,
        });
        window.addPackage = async (gpkg) => {
          const loaded = new Promise((resolve) => { gpkg.once(IDEE.evt.LOAD_LAYERS, resolve); });
          window.map.addLayers(gpkg);
          await loaded;
          return gpkg;
        };
        window.childState = (gpkg) => gpkg.getLayers()
          .map((layer) => [layer.name, layer.isVisible(), layer.getOpacity()])
          .sort(([a], [b]) => a.localeCompare(b));
      });
    });

    test('visibilidad y opacidad asignadas antes de crear las capas se aplican a todas', async ({ page }) => {
      const result = await page.evaluate(async () => {
        const gpkg = new IDEE.layer.GeoPackage({ url: '/fixtures/geopackage/mixed.gpkg', name: 'm' });
        const events = [];
        gpkg.on(IDEE.evt.LAYER_VISIBILITY_CHANGE, (event, layer) => {
          events.push([event.visibility, event.layer === gpkg, layer === gpkg]);
        });
        gpkg.setVisible(false);
        gpkg.setOpacity(0.4);
        const before = { visible: gpkg.isVisible(), opacity: gpkg.getOpacity() };
        await window.addPackage(gpkg);
        return {
          before,
          events,
          children: window.childState(gpkg),
          after: { visible: gpkg.isVisible(), opacity: gpkg.getOpacity() },
        };
      });

      expect(result.before).toEqual({ visible: false, opacity: 0.4 });
      expect(result.events).toEqual([[false, true, true]]);
      expect(result.children).toEqual([['m:imagery', false, 0.4], ['m:places', false, 0.4]]);
      expect(result.after).toEqual({ visible: false, opacity: 0.4 });
    });

    test('una vez cargado delega en sus capas y es visible si alguna lo es', async ({ page }) => {
      const result = await page.evaluate(async () => {
        const gpkg = await window.addPackage(new IDEE.layer.GeoPackage({
          url: '/fixtures/geopackage/mixed.gpkg', name: 'm',
        }));
        const states = [gpkg.isVisible()];
        gpkg.getLayer('places').setVisible(false);
        states.push(gpkg.isVisible());
        gpkg.getLayer('imagery').setVisible(false);
        states.push(gpkg.isVisible());
        gpkg.setVisible('true');
        states.push(gpkg.isVisible());
        gpkg.setOpacity('0.3');
        let invalid;
        try {
          gpkg.setVisible(5);
        } catch (error) {
          invalid = String(error);
        }
        return {
          states,
          invalid,
          visibilityError: IDEE.language.getValue('exception').visibility_param,
          children: window.childState(gpkg),
          opacity: gpkg.getOpacity(),
        };
      });

      expect(result.states).toEqual([true, true, false, true]);
      expect(result.invalid).toBe(result.visibilityError);
      expect(result.children).toEqual([['m:imagery', true, 0.3], ['m:places', true, 0.3]]);
      expect(result.opacity).toBe(0.3);
    });

    test('las opciones comunes de visibilidad y opacidad definen el estado inicial', async ({ page }) => {
      const result = await page.evaluate(async () => {
        const gpkg = new IDEE.layer.GeoPackage({
          url: '/fixtures/geopackage/mixed.gpkg', name: 'm', visibility: false, opacity: 0.5,
        });
        const before = { visible: gpkg.isVisible(), opacity: gpkg.getOpacity() };
        await window.addPackage(gpkg);
        return { before, children: window.childState(gpkg), visible: gpkg.isVisible() };
      });

      expect(result.before).toEqual({ visible: false, opacity: 0.5 });
      expect(result.children).toEqual([['m:imagery', false, 0.5], ['m:places', false, 0.5]]);
      expect(result.visible).toBe(false);
    });

    test('z-index: las capas reciben valores consecutivos desde el del paquete', async ({ page }) => {
      const result = await page.evaluate(async () => {
        const gpkg = new IDEE.layer.GeoPackage({ url: '/fixtures/geopackage/mixed.gpkg', name: 'm' });
        const zIndexes = () => gpkg.getLayers().map((layer) => [layer.name, layer.getZIndex()])
          .sort(([, a], [, b]) => a - b);
        gpkg.setZIndex(100);
        const before = gpkg.getZIndex();
        await window.addPackage(gpkg);
        const added = zIndexes();
        gpkg.getLayer('places').setZIndex(500);
        gpkg.setZIndex(10);
        return {
          before, added, reordered: zIndexes(), zIndex: gpkg.getZIndex(),
        };
      });

      expect(result.before).toBe(100);
      expect(result.added).toEqual([['m:imagery', 100], ['m:places', 101]]);
      expect(result.reordered).toEqual([['m:imagery', 10], ['m:places', 11]]);
      expect(result.zIndex).toBe(10);
    });

    test('orden de dibujo: las teselas quedan debajo de las capas vectoriales', async ({ page }) => {
      await page.evaluate(async () => {
        window.alone = await window.addPackage(new IDEE.layer.GeoPackage({
          url: '/fixtures/geopackage/mixed.gpkg', name: 'suelto',
        }));
        window.grouped = new IDEE.layer.GeoPackage({
          url: '/fixtures/geopackage/mixed.gpkg', name: 'agrupado',
        });
        window.group = new IDEE.layer.LayerGroup({ name: 'grupo', legend: 'Grupo', layers: [] });
        window.map.addLayers(window.group);
        window.group.addLayers(window.grouped);
      });
      await expect.poll(() => page.evaluate(() => window.group.getLayers().length)).toBe(2);

      const result = await page.evaluate(() => {
        const zIndexes = (gpkg) => Object.fromEntries(gpkg.getLayers()
          .map((layer) => [layer.name, layer.getZIndex()]));
        return {
          names: window.alone.getLayers().map((layer) => layer.name),
          alone: zIndexes(window.alone),
          grouped: zIndexes(window.grouped),
        };
      });

      expect(result.names).toEqual(['suelto:places', 'suelto:imagery']);
      expect(result.alone['suelto:imagery']).toBeLessThan(result.alone['suelto:places']);
      expect(result.grouped['agrupado:imagery']).toBeLessThan(result.grouped['agrupado:places']);
    });

    test('extensión: une las extensiones de sus capas y respeta la del usuario', async ({ page }) => {
      const result = await page.evaluate(async () => {
        const gpkg = new IDEE.layer.GeoPackage({ url: '/fixtures/geopackage/mixed.gpkg', name: 'm' });
        const pending = gpkg.getMaxExtent();
        await window.addPackage(gpkg);
        const children = await Promise.all(gpkg.getLayers().map((layer) => layer.calculateMaxExtent()));
        const calculated = await gpkg.calculateMaxExtent();
        const user = await window.addPackage(new IDEE.layer.GeoPackage({
          url: '/fixtures/geopackage/vector.gpkg', name: 'u', maxExtent: [0, 0, 10, 10],
        }));
        return {
          pending,
          children,
          calculated,
          synchronous: gpkg.getMaxExtent(),
          user: user.getMaxExtent(),
          userChild: user.getLayer('places').getMaxExtent(),
          userCalculated: await user.calculateMaxExtent(),
          userChildCalculated: await user.getLayer('places').calculateMaxExtent(),
        };
      });

      const known = result.children.filter((extent) => extent !== null);
      expect(known.length).toBeGreaterThan(0);
      const union = [
        Math.min(...known.map((extent) => extent[0])),
        Math.min(...known.map((extent) => extent[1])),
        Math.max(...known.map((extent) => extent[2])),
        Math.max(...known.map((extent) => extent[3])),
      ];
      expect(result.pending).toBeNull();
      expect(result.calculated).toEqual(union);
      expect(result.synchronous).toEqual(union);
      expect(result.user).toEqual(result.userChild);
      expect(result.userCalculated).toEqual(result.userChildCalculated);
      if (engine === 'ol') {
        expect(result.user).toEqual([0, 0, 10, 10]);
        expect(result.userCalculated).toEqual([0, 0, 10, 10]);
      }
    });

    test('zoom mínimo y máximo: opciones, valores previos y cambios posteriores', async ({ page }) => {
      const result = await page.evaluate(async () => {
        const gpkg = new IDEE.layer.GeoPackage({
          url: '/fixtures/geopackage/mixed.gpkg', name: 'm', minZoom: 3,
        });
        const initial = [gpkg.getMinZoom(), gpkg.getMaxZoom()];
        gpkg.setMaxZoom(12);
        await window.addPackage(gpkg);
        const loaded = gpkg.getLayers().map((layer) => [layer.getMinZoom(), layer.getMaxZoom()]);
        gpkg.setMinZoom(4);
        return {
          initial,
          loaded,
          changed: gpkg.getLayers().map((layer) => [layer.getMinZoom(), layer.getMaxZoom()]),
          container: [gpkg.getMinZoom(), gpkg.getMaxZoom()],
          unset: [new IDEE.layer.GeoPackage({ url: '/x.gpkg' }).getMinZoom(),
            new IDEE.layer.GeoPackage({ url: '/x.gpkg' }).getMaxZoom()],
        };
      });

      expect(result.initial).toEqual([3, Number.POSITIVE_INFINITY]);
      expect(result.loaded).toEqual([[3, 12], [3, 12]]);
      expect(result.changed).toEqual([[4, 12], [4, 12]]);
      expect(result.container).toEqual([4, 12]);
      expect(result.unset).toEqual([Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY]);
    });

    test('refresh(): recarga todas las tablas remotas con una sola descarga', async ({ page }) => {
      const state = await serveVersions(page, 'multivector');
      await page.evaluate(async () => {
        window.gpkg = await window.addPackage(new IDEE.layer.GeoPackage({
          url: '/fixtures/refresh/data.gpkg', name: 'r',
        }));
      });
      const counts = () => page.evaluate(() => ['places', 'routes']
        .map((name) => window.gpkg.getLayer(name).getFeatures().length));
      await expect.poll(counts).toEqual([1, 1]);

      state.version = 'multibbox';
      expect(await page.evaluate(() => window.gpkg.refresh())).toBeUndefined();
      expect(state.requests).toHaveLength(2);
      expect(state.requests[1].searchParams.has('_ideeRefresh')).toBe(true);
      await expect.poll(counts).toEqual([3, 1]);

      state.version = 'raster';
      const failure = await page.evaluate(() => window.gpkg.refresh().then(() => 'ok', String));
      expect(failure).toContain('GeoPackage:');
      expect(await counts()).toEqual([3, 1]);

      await page.evaluate(() => window.map.removeGeoPackage(window.gpkg));
      await page.evaluate(() => window.gpkg.refresh());
      expect(state.requests).toHaveLength(3);
    });

    test('refresh(): una fuente binaria no vuelve a descargar nada', async ({ page }) => {
      const state = await serveVersions(page, 'vector');
      await page.evaluate(async () => {
        const response = await fetch('/fixtures/refresh/data.gpkg');
        window.gpkg = await window.addPackage(new IDEE.layer.GeoPackage({ source: response }));
      });
      const count = () => page.evaluate(() => window.gpkg.getLayer('places').getFeatures().length);
      await expect.poll(count).toBe(1);

      state.version = 'bbox';
      await page.evaluate(() => window.gpkg.refresh());
      expect(state.requests).toHaveLength(1);
      expect(await count()).toBe(1);
    });

    test('intervalo de recarga: opción del paquete, cambio y valor previo a las capas', async ({ page }) => {
      await serveVersions(page, 'mixed');
      const result = await page.evaluate(async () => {
        const intervals = (gpkg) => gpkg.getLayers().map((layer) => layer.getAutoRefreshInterval());
        const configured = await window.addPackage(new IDEE.layer.GeoPackage({
          url: '/fixtures/refresh/data.gpkg', name: 'a', refreshInterval: 60000,
        }));
        const fromOptions = intervals(configured);
        configured.updateRefreshInterval(120000);
        const updated = intervals(configured);
        const pending = new IDEE.layer.GeoPackage({ url: '/fixtures/refresh/data.gpkg', name: 'b' });
        pending.updateRefreshInterval(90000);
        await window.addPackage(pending);
        const result = { fromOptions, updated, pending: intervals(pending) };
        window.map.removeGeoPackage(configured);
        window.map.removeGeoPackage(pending);
        return result;
      });

      expect(result.fromOptions).toEqual([60000, 60000]);
      expect(result.updated).toEqual([120000, 120000]);
      expect(result.pending).toEqual([90000, 90000]);
    });

    test('intervalo de recarga: el paquete se vuelve a descargar periódicamente', async ({ page }) => {
      const state = await serveVersions(page, 'vector');
      await page.evaluate(async () => {
        window.gpkg = await window.addPackage(new IDEE.layer.GeoPackage({
          url: '/fixtures/refresh/data.gpkg', name: 'p', refreshInterval: 300,
        }));
      });
      await expect.poll(() => page.evaluate(() => window.gpkg.getLayer('places').getFeatures().length))
        .toBe(1);
      state.version = 'bbox';
      await expect.poll(
        () => page.evaluate(() => window.gpkg.getLayer('places').getFeatures().length),
        { timeout: 20000 },
      ).toBe(3);
      expect(state.requests.length).toBeGreaterThanOrEqual(2);
      expect(state.requests[1].searchParams.has('_ideeRefresh')).toBe(true);
      await page.evaluate(() => window.map.removeGeoPackage(window.gpkg));
    });
  });
}
