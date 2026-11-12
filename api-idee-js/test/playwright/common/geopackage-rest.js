import { test, expect } from '@playwright/test';
import { prepareGeoPackagePage } from '../ol/fixtures/geopackage';
import { decodeRestLayer } from './rest-layer';

/**
 * Pruebas de la carga de GeoPackage por la API-REST (?layers=), comunes a OL y Cesium.
 * @param {String} engine 'ol' o 'cesium'.
 */
export default function registerGeoPackageRestTests(engine) {
  test.describe(`GeoPackage por API-REST (${engine})`, () => {
    test.beforeEach(async ({ page }) => {
      await prepareGeoPackagePage(page, { engine });
      await page.evaluate(() => {
        window.mapWith = async (layers) => {
          window.map = IDEE.map({
            container: 'map', controls: [], center: [0, 0], zoom: 2, layers,
          });
          await Promise.all(window.map.geopackages.map((gpkg) => gpkg.whenReady()));
          await new Promise((resolve) => { setTimeout(resolve, 0); });
          return window.map.geopackages;
        };
        window.describe = (gpkg) => ({
          name: gpkg.name,
          legend: gpkg.legend,
          url: gpkg.url,
          loadStrategy: gpkg.loadStrategy,
          layers: gpkg.getLayers().map((layer) => layer.name).sort(),
          attached: gpkg.getLayers().every((layer) => window.map.getLayers().includes(layer)),
        });
      });
    });

    test('formato posicional: GeoPackage*leyenda*url*nombre*loadStrategy', async ({ page }) => {
      const result = await page.evaluate(async () => {
        const [full, partial] = await window.mapWith([
          'GeoPackage*Lugares*/fixtures/geopackage/mixed.gpkg*mixto*bbox',
          'GeoPackage**/fixtures/geopackage/vector.gpkg*v',
        ]);
        return {
          full: window.describe(full),
          partial: window.describe(partial),
          rest: full.getRestLayer(),
        };
      });

      expect(result.full).toEqual({
        name: 'mixto',
        legend: 'Lugares',
        url: '/fixtures/geopackage/mixed.gpkg',
        loadStrategy: 'bbox',
        layers: ['mixto:imagery', 'mixto:places'],
        attached: true,
      });
      expect(result.partial).toMatchObject({
        name: 'v', legend: 'v', loadStrategy: 'full', layers: ['v:places'], attached: true,
      });
      expect(decodeRestLayer(result.rest)).toMatchObject({
        type: 'GeoPackage', name: 'mixto', legend: 'Lugares', options: { loadStrategy: 'bbox' },
      });
    });

    test('formato con nombre: la cadena de getRestLayer reconstruye el paquete', async ({ page }) => {
      const result = await page.evaluate(async () => {
        const original = new IDEE.layer.GeoPackage({
          url: '/fixtures/geopackage/multivector.gpkg',
          name: 'm',
          loadStrategy: 'range',
          tables: { routes: { opacity: 0.4, visibility: false } },
        });
        window.map = IDEE.map({
          container: 'map', controls: [], center: [0, 0], zoom: 2, layers: [],
        });
        const loaded = new Promise((resolve) => { original.once(IDEE.evt.LOAD_LAYERS, resolve); });
        window.map.addLayers(original);
        await loaded;
        const rest = original.getRestLayer();
        window.map.destroy();
        const [restored] = await window.mapWith([rest]);
        return {
          rest,
          restored: window.describe(restored),
          routes: [restored.getLayer('routes').isVisible(), restored.getLayer('routes').getOpacity()],
          same: restored.getRestLayer() === rest,
        };
      });

      expect(decodeRestLayer(result.rest).options).toMatchObject({
        loadStrategy: 'range',
        tables: { routes: { opacity: 0.4, visibility: false } },
      });
      expect(result.restored).toMatchObject({
        name: 'm', loadStrategy: 'range', layers: ['m:places', 'm:routes'], attached: true,
      });
      expect(result.routes).toEqual([false, 0.4]);
      expect(result.same).toBe(true);
    });

    test('un GeoPackage dentro de un grupo aporta una sola cadena REST', async ({ page }) => {
      await page.evaluate(async () => {
        window.map = IDEE.map({
          container: 'map', controls: [], center: [0, 0], zoom: 2, layers: [],
        });
        window.gpkg = new IDEE.layer.GeoPackage({
          url: '/fixtures/geopackage/multivector.gpkg', name: 'm',
        });
        window.group = new IDEE.layer.LayerGroup({ name: 'g', legend: 'Grupo', layers: [window.gpkg] });
        window.map.addLayers(window.group);
      });
      await expect.poll(() => page.evaluate(() => window.group.getLayers().length)).toBe(2);
      const rest = await page.evaluate(() => ({
        group: window.group.getRestLayer(),
        container: window.gpkg.getRestLayer(),
        entries: IDEE.Layer.getRestLayers(window.gpkg.getLayers())
          .map(({ layers, rest: value }) => [layers.length, value]),
      }));

      const { layers } = decodeRestLayer(rest.group);
      expect(layers.filter((layer) => layer.startsWith('GeoPackage*'))).toEqual([rest.container]);
      expect(rest.entries).toEqual([[2, rest.container]]);
    });
  });
}
