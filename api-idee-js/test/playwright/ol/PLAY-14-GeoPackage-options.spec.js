import { test, expect } from '@playwright/test';
import { prepareGeoPackagePage } from './fixtures/geopackage';

test.beforeEach(async ({ page }) => prepareGeoPackagePage(page));

test('GeoPackage: opciones comunes, sobrescrituras y configuración inmutable', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const style = new IDEE.style.Point({ radius: 7, fill: { color: 'red' } });
    const tableStyle = new IDEE.style.Point({ radius: 4, fill: { color: 'blue' } });
    const parameters = Object.freeze({
      url: '/fixtures/geopackage/mixed.gpkg', name: 'sample', legend: 'Paquete',
    });
    const predefinedStyles = Object.freeze([style]);
    const options = Object.freeze({
      opacity: 0.8,
      visibility: false,
      displayInLayerSwitcher: false,
      style,
      predefinedStyles,
      tile: Object.freeze({ imagery: Object.freeze({ width: 128, height: 64 }) }),
      tables: Object.freeze({
        places: Object.freeze({ style: tableStyle, opacity: 0, legend: 'Lugares' }),
        imagery: Object.freeze({ visibility: true }),
      }),
    });
    const gpkg = new IDEE.layer.GeoPackage(parameters, options);
    await gpkg.addTo(null, false);
    const vector = gpkg.getLayer('places');
    const raster = gpkg.getLayer('imagery');
    return {
      packageName: gpkg.name,
      packageLegend: gpkg.legend,
      vector: {
        name: vector.name,
        legend: vector.legend,
        opacity: vector.getOpacity(),
        visible: vector.isVisible(),
        display: vector.displayInLayerSwitcher,
        style: vector.options.style === tableStyle,
      },
      raster: {
        name: raster.name,
        opacity: raster.getOpacity(),
        visible: raster.isVisible(),
        display: raster.displayInLayerSwitcher,
        provider: raster.getImpl().provider.getOptions(),
      },
      unchanged: predefinedStyles.length === 1 && predefinedStyles[0] === style
        && Object.keys(options.tables.places).length === 3
        && !Object.prototype.hasOwnProperty.call(parameters, 'type'),
    };
  });
  expect(result).toEqual({
    packageName: 'sample',
    packageLegend: 'Paquete',
    vector: {
      name: 'sample:places',
      legend: 'Lugares',
      opacity: 0,
      visible: false,
      display: false,
      style: true,
    },
    raster: {
      name: 'sample:imagery',
      opacity: 0.8,
      visible: true,
      display: false,
      provider: { width: 128, height: 64 },
    },
    unchanged: true,
  });
});

test('GeoPackage: opciones históricas no mutan el llamador y conservan nombres', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const file = new File([await (await window.fetch('/fixtures/geopackage/mixed.gpkg')).arrayBuffer()], 'sample.gpkg');
    const options = Object.freeze({
      places: Object.freeze({ name: 'custom', opacity: 0, visibility: false }),
      imagery: Object.freeze({ opacity: 0, displayInLayerSwitcher: false }),
    });
    const gpkg = new IDEE.layer.GeoPackage(file, options);
    await gpkg.addTo(null, false);
    const vector = gpkg.getLayer('places');
    const raster = gpkg.getLayer('imagery');
    return {
      source: gpkg.source === file,
      vector: [vector.name, vector.getOpacity(), vector.isVisible()],
      raster: [raster.name, raster.getOpacity(), raster.displayInLayerSwitcher],
      missing: gpkg.getLayer('missing'),
      unchanged: Object.keys(options.imagery),
    };
  });
  expect(result).toEqual({
    source: true,
    vector: ['custom', 0, false],
    raster: ['imagery', 0, false],
    missing: null,
    unchanged: ['opacity', 'displayInLayerSwitcher'],
  });
});

test('GeoPackage: los valores cero y false llegan a las capas OpenLayers', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const map = IDEE.map({ container: 'map', layers: [], controls: [] });
    const gpkg = new IDEE.layer.GeoPackage({ url: '/fixtures/geopackage/mixed.gpkg' }, {
      opacity: 0, visibility: false,
    });
    await gpkg.addTo(map);
    return gpkg.getLayers().map((layer) => ({
      type: layer.type,
      opacity: layer.getImpl().getLayer().getOpacity(),
      visible: layer.getImpl().getLayer().getVisible(),
    }));
  });
  expect(result).toEqual([
    { type: 'GeoJSON', opacity: 0, visible: false },
    { type: 'GeoPackageTile', opacity: 0, visible: false },
  ]);
});

test('GeoPackage: el estilo se aplica cuando se cargan las entidades', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const map = IDEE.map({
      container: 'map', layers: [], controls: [], center: [0, 0], zoom: 2,
    });
    const style = new IDEE.style.Generic({ point: { radius: 7, fill: { color: 'red' } } });
    const gpkg = new IDEE.layer.GeoPackage({ url: '/fixtures/geopackage/vector.gpkg' }, { style });
    await gpkg.addTo(map);
    const layer = gpkg.getLayer('places');
    if (!layer.getImpl().isLoaded()) {
      await new Promise((resolve) => { layer.once(IDEE.evt.LOAD, resolve); });
    }
    return {
      style: layer.getStyle() === style,
      count: layer.getFeatures().length,
      coordinates: layer.getFeatures()[0].getGeometry().coordinates,
    };
  });
  expect(result.style).toBe(true);
  expect(result.count).toBe(1);
  result.coordinates.forEach((coordinate) => expect(coordinate).toBeCloseTo(0, 6));
});

test('GeoPackage: conserva opciones de ambos proveedores', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const connector = new IDEE.GeoPackageConnector({ url: '/fixtures/geopackage/mixed.gpkg' }, {
      vector: { places: { custom: 'vector' } },
      tile: { imagery: { width: 128, height: 64 } },
    });
    const [vectors, tiles] = await Promise.all([
      connector.getVectorProviders(), connector.getTileProviders(),
    ]);
    return [vectors[0].getOptions(), tiles[0].getOptions()];
  });
  expect(result).toEqual([{ custom: 'vector' }, { width: 128, height: 64 }]);
});
