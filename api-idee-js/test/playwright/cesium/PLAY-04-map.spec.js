import { test, expect } from '@playwright/test';
import { routePng } from '../common/mocks';

/*
 * Mapa Cesium: ciclo de vida, encuadres, extensiones, orden de capas y eventos.
 * Las teselas se simulan para no depender de la red.
 */
const PAGE = '/test/playwright/cesium/basic-cesium.html';
const TILES = 'https://tiles.cesium.test';
const WAIT = { timeout: 20000 };

test.describe.configure({ timeout: 60000 });

test.describe('IDEE.Map en Cesium', () => {
  test.beforeEach(async ({ page }) => {
    await routePng(page, `${TILES}/**`);
    await page.goto(PAGE);
    await page.evaluate(() => {
      IDEE.config.baseLayer = [];
      IDEE.config.terrain.default = [];
      window.completed = 0;
      window.map = IDEE.map({
        container: 'map', controls: [], layers: [], center: [-3.7, 40.4], zoom: 6,
      });
      window.map.on(IDEE.evt.COMPLETED, () => { window.completed += 1; });
    });
  });

  test('se crea en EPSG:4979 y notifica COMPLETED', async ({ page }) => {
    expect(await page.evaluate(() => window.map.getImplementation())).toBe('cesium');
    expect(await page.evaluate(() => window.map.getProjection().code)).toBe('EPSG:4979');
    await expect.poll(() => page.evaluate(() => window.completed), WAIT).toBeGreaterThan(0);
    expect(await page.evaluate(() => window.map.isFinished())).toBe(true);
  });

  test('setBbox y getBbox trabajan en grados', async ({ page }) => {
    const bbox = await page.evaluate(() => {
      window.map.setBbox([-4, 39, -3, 40]);
      const { x, y } = window.map.getBbox();
      return [x.min, y.min, x.max, y.max];
    });
    const [minx, miny, maxx, maxy] = bbox;
    expect(minx).toBeLessThanOrEqual(-3.9);
    expect(miny).toBeLessThanOrEqual(39.1);
    expect(maxx).toBeGreaterThanOrEqual(-3.1);
    expect(maxy).toBeGreaterThanOrEqual(39.9);
  });

  test('getBbox no falla con la cámara mirando al cielo', async ({ page }) => {
    const result = await page.evaluate(() => {
      window.map.setBbox([-4, 39, -3, 40]);
      const before = window.map.getBbox();
      const { camera } = window.map.getMapImpl();
      const pitch = window.Cesium.Math.toRadians(30);
      camera.setView({ orientation: { heading: 0, pitch, roll: 0 } });
      const visible = camera.computeViewRectangle();
      const after = window.map.getBbox();
      return { sky: visible === undefined, same: JSON.stringify(after) === JSON.stringify(before) };
    });
    expect(result.sky).toBe(true);
    expect(result.same).toBe(true);
  });

  test('las extensiones máximas no lanzan excepción', async ({ page }) => {
    const result = await page.evaluate(() => {
      const facadeExtent = window.map.getMaxExtent();
      const implExtent = window.map.getImpl().getMaxExtent();
      window.map.getImpl().setMaxExtent([-10, 35, 5, 44], false);
      const limited = window.map.getImpl().getMaxExtent();
      window.map.getImpl().setMaxExtent(null);
      const reset = window.map.getImpl().getMaxExtent();
      return {
        facadeExtent, implExtent, limited, reset,
      };
    });
    expect(result.facadeExtent).toBeTruthy();
    expect(result.implExtent.map(Math.round)).toEqual([-180, -90, 180, 90]);
    expect(result.limited.map(Math.round)).toEqual([-10, 35, 5, 44]);
    expect(result.reset.map(Math.round)).toEqual([-180, -90, 180, 90]);
  });

  test('las capas reciben ADDED_TO_MAP y z-index por defecto como en OL', async ({ page }) => {
    await page.evaluate((tiles) => {
      window.added = [];
      ['a', 'b'].forEach((name) => {
        const layer = new IDEE.layer.XYZ({ url: `${tiles}/${name}/{z}/{x}/{y}.png`, name, transparent: true });
        layer.on(IDEE.evt.ADDED_TO_MAP, () => window.added.push(name));
        window[name] = layer;
      });
      window.puntos = new IDEE.layer.GeoJSON({
        name: 'puntos',
        source: { type: 'FeatureCollection', features: [{ type: 'Feature', geometry: { type: 'Point', coordinates: [-3.7, 40.4] }, properties: {} }] },
      });
      window.puntos.on(IDEE.evt.ADDED_TO_MAP, () => window.added.push('puntos'));
      window.map.addLayers([window.a, window.b, window.puntos]);
    }, TILES);
    await expect.poll(() => page.evaluate(() => window.added.slice().sort()), WAIT)
      .toEqual(['a', 'b', 'puntos']);
    const state = await page.evaluate(() => ({
      zIndexes: [window.a.getZIndex(), window.b.getZIndex()],
      // La única capa ráster no pasa a ser capa base por su posición
      transparent: [window.a.transparent, window.b.transparent],
      base: window.map.getBaseLayers().map((l) => l.name),
    }));
    expect(state.zIndexes[0]).toBeGreaterThan(40);
    expect(state.zIndexes[1]).toBeGreaterThan(state.zIndexes[0]);
    expect(state.transparent).toEqual([true, true]);
    expect(state.base).toEqual([]);
  });

  test('el z-index ordena la colección de imágenes', async ({ page }) => {
    const order = await page.evaluate((tiles) => {
      const layers = ['a', 'b', 'c'].map((name) => new IDEE.layer.XYZ({
        url: `${tiles}/${name}/{z}/{x}/{y}.png`, name, transparent: true,
      }));
      window.map.addLayers(layers);
      const names = () => {
        const { imageryLayers } = window.map.getMapImpl();
        const result = [];
        for (let i = 0; i < imageryLayers.length; i += 1) {
          const native = imageryLayers.get(i);
          const layer = layers.find((l) => l.getImpl().getLayer() === native);
          if (layer) result.push(layer.name);
        }
        return result;
      };
      const initial = names();
      // Un z-index mayor que el número de capas es válido: es una clave de orden
      layers[0].setZIndex(500);
      const raised = names();
      layers[2].setZIndex(1);
      const lowered = names();
      return {
        initial, raised, lowered, zIndex: layers[0].getZIndex(),
      };
    }, TILES);
    expect(order.initial).toEqual(['a', 'b', 'c']);
    expect(order.raised).toEqual(['b', 'c', 'a']);
    expect(order.lowered).toEqual(['c', 'b', 'a']);
    expect(order.zIndex).toBe(500);
  });

  test('inRange depende del zoom del mapa', async ({ page }) => {
    const inRange = await page.evaluate((tiles) => {
      const near = new IDEE.layer.XYZ({
        url: `${tiles}/near/{z}/{x}/{y}.png`, name: 'near', transparent: true,
      }, { minZoom: 10 });
      const any = new IDEE.layer.XYZ({ url: `${tiles}/any/{z}/{x}/{y}.png`, name: 'any', transparent: true });
      window.map.addLayers([near, any]);
      window.map.setZoom(6);
      const at6 = [near.inRange(), any.inRange()];
      window.map.setZoom(12);
      const at12 = [near.inRange(), any.inRange()];
      return { at6, at12 };
    }, TILES);
    expect(inRange.at6).toEqual([false, true]);
    expect(inRange.at12).toEqual([true, true]);
  });

  test('la rueda del ratón emite MOVE', async ({ page }) => {
    await page.evaluate(() => {
      window.moves = 0;
      window.map.on(IDEE.evt.MOVE, () => { window.moves += 1; });
    });
    const box = await page.locator('#map canvas').first().boundingBox();
    // Fuera del centro exacto: con la vista cenital, el zoom hacia el cursor de Cesium
    // calcula un eje de giro nulo en el centro (NaN en Firefox y el render se detiene)
    await page.mouse.move(box.x + box.width / 2 + 150, box.y + box.height / 2 + 80);
    await page.mouse.wheel(0, -200);
    await expect.poll(() => page.evaluate(() => window.moves), WAIT).toBeGreaterThan(0);
  });
});
