import { test, expect } from '@playwright/test';
import { prepareGeoPackagePage } from './fixtures/geopackage';
import { decodeRestLayer } from '../common/rest-layer';

test.beforeEach(async ({ page }) => prepareGeoPackagePage(page));

test('GeoPackage REST: getRestLayer reconstruye un paquete equivalente y es estable', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const map = IDEE.map({
      container: 'map', layers: [], controls: [], center: [0, 0], zoom: 2,
    });
    const loaded = (gpkg) => new Promise((resolve) => {
      gpkg.once(IDEE.evt.LOAD_LAYERS, () => resolve(gpkg));
    });
    const style = new IDEE.style.Generic({ point: { radius: 6, fill: { color: '#ff0000' } } });
    const original = new IDEE.layer.GeoPackage({
      url: '/fixtures/geopackage/mixed.gpkg',
      name: 'mixed',
      legend: 'Mixto',
      style,
      tables: { places: { opacity: 0.5 } },
    });
    const originalLoaded = loaded(original);
    map.addLayers(original);
    await originalLoaded;
    original.getLayer('places').setVisible(false);
    original.getLayer('imagery').setOpacity(0.3);

    const rest = original.getRestLayer();
    const restricted = original.getRestLayer(['places']);
    const childRest = original.getLayer('places').getRestLayer();
    const missing = original.getRestLayer(['unknown']);
    const describe = (gpkg) => ({
      name: gpkg.name,
      legend: gpkg.legend,
      layers: gpkg.getLayers().map((layer) => layer.name).sort(),
      placesVisible: gpkg.getLayer('places')?.isVisible(),
      placesOpacity: gpkg.getLayer('places')?.getOpacity(),
      placesStyle: gpkg.getLayer('places')?.getStyle()?.serialize(),
      imageryOpacity: gpkg.getLayer('imagery')?.getOpacity(),
    });
    const before = describe(original);
    map.removeGeoPackage(original);

    map.addLayers(rest);
    const restored = map.geopackages[map.geopackages.length - 1];
    await loaded(restored);
    const after = describe(restored);
    const restAgain = restored.getRestLayer();

    map.addLayers(restricted);
    const partial = map.geopackages[map.geopackages.length - 1];
    await loaded(partial);

    const local = new IDEE.layer.GeoPackage({ source: new Uint8Array([1]) });
    const legacy = new IDEE.layer.GeoPackage(new Uint8Array([1]));
    return {
      rest,
      restAgain,
      restricted,
      childRest,
      missing,
      before,
      after,
      partialLayers: partial.getLayers().map((layer) => layer.name),
      partialRest: partial.getRestLayer(),
      local: local.getRestLayer(),
      legacy: legacy.getRestLayer(),
    };
  });

  expect(result.rest).toMatch(/^GeoPackage\*url=http:\/\/localhost:8081\/fixtures\/geopackage\/mixed\.gpkg;name=mixed;legend=Mixto;options=/);
  expect(result.after).toEqual(result.before);
  expect(result.before).toMatchObject({
    name: 'mixed',
    legend: 'Mixto',
    layers: ['mixed:imagery', 'mixed:places'],
    placesVisible: false,
    placesOpacity: 0.5,
    imageryOpacity: 0.3,
  });
  expect(result.restAgain).toBe(result.rest);
  expect(result.childRest).toBe(result.restricted);
  expect(result.restricted).not.toBe(result.rest);
  expect(result.missing).toBeNull();
  expect(result.partialLayers).toEqual(['mixed:places']);
  expect(decodeRestLayer(result.partialRest)).toEqual(decodeRestLayer(result.restricted));
  const decoded = decodeRestLayer(result.rest);
  expect(decoded).toMatchObject({
    type: 'GeoPackage',
    url: 'http://localhost:8081/fixtures/geopackage/mixed.gpkg',
    name: 'mixed',
    legend: 'Mixto',
  });
  expect(typeof decoded.options.style).toBe('string');
  expect(decoded.options.tableNames).toBeUndefined();
  expect(decoded.options.tables.places).toMatchObject({
    name: 'mixed:places', legend: 'places', visibility: false, opacity: 0.5,
  });
  expect(decoded.options.tables.imagery).toMatchObject({
    name: 'mixed:imagery', legend: 'imagery', opacity: 0.3,
  });
  expect(decodeRestLayer(result.restricted).options.tableNames).toEqual(['places']);
  expect(Object.keys(decodeRestLayer(result.restricted).options.tables)).toEqual(['places']);
  expect(result.local).toBeNull();
  expect(result.legacy).toBeNull();
});
