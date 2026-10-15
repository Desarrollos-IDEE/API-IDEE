import { test, expect } from '@playwright/test';
import { prepareGeoPackagePage } from './fixtures/geopackage';

test.beforeEach(async ({ page }) => prepareGeoPackagePage(page));

test('GeoPackage: se crea desde la configuración JSON del mapa con su estilo', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const layerConfig = JSON.parse(JSON.stringify({
      type: 'GeoPackage',
      url: '/fixtures/geopackage/mixed.gpkg',
      name: 'reference',
      legend: 'Reference data',
      opacity: 0.8,
      visibility: false,
      style: {
        point: { radius: 7, fill: { color: '#ff0000' } },
      },
      tables: {
        places: {
          legend: 'Places',
          opacity: 0.4,
          style: {
            point: { radius: 4, fill: { color: '#0000ff' } },
          },
        },
        imagery: { visibility: true },
      },
    }));
    const originalConfig = JSON.stringify(layerConfig);
    const map = IDEE.map({
      container: 'map', layers: [layerConfig], controls: [], center: [0, 0], zoom: 2,
    });
    const geoPackage = map.geopackages[0];
    await geoPackage.whenReady();
    const vector = geoPackage.getLayer('places');
    const raster = geoPackage.getLayer('imagery');
    const { style } = vector.options;
    return {
      package: {
        count: map.geopackages.length,
        name: geoPackage.name,
        legend: geoPackage.legend,
      },
      vector: {
        name: vector.name,
        legend: vector.legend,
        opacity: vector.getOpacity(),
        visible: vector.isVisible(),
        radius: style.point.radius,
        color: style.point.fill.color,
      },
      raster: {
        name: raster.name,
        opacity: raster.getOpacity(),
        visible: raster.isVisible(),
      },
      unchanged: JSON.stringify(layerConfig) === originalConfig,
    };
  });

  expect(result).toEqual({
    package: { count: 1, name: 'reference', legend: 'Reference data' },
    vector: {
      name: 'reference:places',
      legend: 'Places',
      opacity: 0.4,
      visible: false,
      radius: 4,
      color: '#0000ff',
    },
    raster: {
      name: 'reference:imagery',
      opacity: 0.8,
      visible: true,
    },
    unchanged: true,
  });
});

test('GeoPackage: admite opciones anidadas al crearse con addLayers', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const map = IDEE.map({ container: 'map', layers: [], controls: [] });
    map.addLayers({
      type: 'GeoPackage',
      url: '/fixtures/geopackage/vector.gpkg',
      name: 'nested',
      options: {
        opacity: 0,
        visibility: false,
        style: { point: { radius: 3, fill: { color: '#00ff00' } } },
      },
    });
    const geoPackage = map.geopackages[0];
    await geoPackage.whenReady();
    const layer = geoPackage.getLayer('places');
    return {
      opacity: layer.getOpacity(),
      visible: layer.isVisible(),
      radius: layer.options.style.point.radius,
    };
  });

  expect(result).toEqual({ opacity: 0, visible: false, radius: 3 });
});

test('GeoPackage: expone metadatos estructurados sin compartir el estado interno', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const gpkg = new IDEE.layer.GeoPackage({
      url: '/fixtures/geopackage/metadata.gpkg',
      name: 'metadata-demo',
    });
    let pendingError;
    try {
      gpkg.getMetadata();
    } catch (error) {
      pendingError = String(error);
    }
    await gpkg.whenReady();
    const metadata = gpkg.getMetadata();
    metadata.featureTables.push('changed');
    metadata.tables.places.description = 'changed';
    const current = gpkg.getMetadata();
    return {
      pendingError,
      publicProperty: gpkg.metadata,
      properties: gpkg.properties,
      featureTables: current.featureTables,
      tileTables: current.tileTables,
      attributeTables: current.attributeTables,
      feature: current.tables.places,
      tile: current.tables.imagery,
      attribute: current.tables.details,
      extensions: current.extensions,
      metadata: current.metadata,
      references: current.metadataReferences,
    };
  });

  expect(result.pendingError).toContain('capa');
  expect(result.publicProperty.featureTables).toEqual(['places']);
  expect(result.properties.tables.places).toMatchObject({
    type: 'features',
    data: {
      type: 'FeatureCollection',
      features: [{ properties: { id: 1, title: 'Origen' } }],
    },
  });
  expect(result.properties.tables.imagery).toMatchObject({ type: 'tiles' });
  expect(result.properties.tables.imagery.data).toBeUndefined();
  expect(result.properties.tables.details).toMatchObject({ type: 'attributes' });
  expect(result.featureTables).toEqual(['places']);
  expect(result.tileTables).toEqual(['imagery']);
  expect(result.attributeTables).toEqual(['details']);
  expect(result.feature).toMatchObject({
    tableName: 'places',
    type: 'features',
    identifier: 'places',
    count: 1,
    bounds: [0, 0, 0, 0],
    srs: { organization: 'EPSG', id: 4326 },
    geometry: {
      column: 'geom', type: 'POINT', z: 0, m: 0,
    },
  });
  expect(result.feature.columns.map(({ name, dataType }) => ({ name, dataType }))).toEqual([
    { name: 'id', dataType: 'INTEGER' },
    { name: 'geom', dataType: 'BLOB' },
    { name: 'title', dataType: 'TEXT' },
  ]);
  expect(result.tile).toMatchObject({
    tableName: 'imagery',
    type: 'tiles',
    count: 1,
    tileMatrixSet: {
      srsId: 3857,
      bounds: [-20037508.342789244, -20037508.342789244,
        20037508.342789244, 20037508.342789244],
    },
    tileMatrices: [{
      zoomLevel: 0,
      matrixWidth: 1,
      matrixHeight: 1,
      tileWidth: 1,
      tileHeight: 1,
      pixelXSize: 40075016.68557849,
      pixelYSize: 40075016.68557849,
    }],
  });
  expect(result.attribute).toMatchObject({
    tableName: 'details', type: 'attributes', identifier: 'Details', count: 1, srs: null,
  });
  expect(result.extensions).toEqual([{
    tableName: 'places',
    columnName: 'geom',
    name: 'example_geometry',
    definition: 'https://example.test/geometry',
    scope: 'read-write',
  }]);
  expect(result.metadata).toEqual([{
    id: 1,
    scope: 'dataset',
    standardUri: 'https://example.test/standard',
    mimeType: 'application/json',
    value: '{"title":"Demo"}',
  }]);
  expect(result.references).toEqual([{
    scope: 'table',
    tableName: 'places',
    columnName: null,
    rowId: null,
    timestamp: '2020-01-03T00:00:00.000Z',
    metadataId: 1,
    parentMetadataId: null,
  }]);
});

test('GeoPackage: toJSON permite reconstruir una instancia desde una URL', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const style = new IDEE.style.Generic({
      point: { radius: 6, fill: { color: '#ff0000' } },
    });
    const original = new IDEE.layer.GeoPackage({
      url: '/fixtures/geopackage/mixed.gpkg',
      name: 'reference',
      legend: 'Reference data',
    }, {
      opacity: 0,
      visibility: false,
      style,
      tables: { places: { legend: 'Places' } },
    });
    let pendingError;
    try {
      original.toJSON();
    } catch (error) {
      pendingError = String(error);
    }
    await original.whenReady();
    const config = original.toJSON();
    const parsed = JSON.parse(JSON.stringify(config));
    const restored = new IDEE.layer.GeoPackage(parsed);
    await restored.whenReady();
    return {
      pendingError,
      config,
      restored: {
        name: restored.name,
        legend: restored.legend,
        opacity: restored.getLayer('places').getOpacity(),
        visibility: restored.getLayer('places').isVisible(),
        tableLegend: restored.getLayer('places').legend,
        style: restored.getLayer('places').options.style,
        tables: restored.getMetadata().featureTables,
        metadataOption: restored.options.metadata,
        propertiesOption: restored.options.properties,
      },
    };
  });

  expect(result.pendingError).toContain('capa');
  expect(result.config).toMatchObject({
    type: 'GeoPackage',
    url: '/fixtures/geopackage/mixed.gpkg',
    name: 'reference',
    legend: 'Reference data',
    options: {
      opacity: 0,
      visibility: false,
      tables: { places: { legend: 'Places' } },
    },
    metadata: { featureTables: ['places'], tileTables: ['imagery'] },
    properties: {
      tables: {
        places: {
          type: 'features',
          data: {
            type: 'FeatureCollection',
            features: [{ properties: { id: 1, title: 'Origen' } }],
          },
        },
        imagery: { type: 'tiles' },
      },
    },
  });
  expect(typeof result.config.options.style).toBe('string');
  expect(result.restored).toMatchObject({
    name: 'reference',
    legend: 'Reference data',
    opacity: 0,
    visibility: false,
    tableLegend: 'Places',
    tables: ['places'],
  });
  expect(typeof result.restored.style).toBe('string');
  expect(result.restored.metadataOption).toBeUndefined();
  expect(result.restored.propertiesOption).toBeUndefined();
});

test('GeoPackage: toJSON conserva la referencia de una fuente binaria', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const source = new Uint8Array(await (await fetch('/fixtures/geopackage/vector.gpkg')).arrayBuffer());
    const original = new IDEE.layer.GeoPackage({ source, name: 'local' });
    await original.whenReady();
    const config = original.toJSON();
    const restored = new IDEE.layer.GeoPackage(config);
    await restored.whenReady();
    return {
      sameSource: config.source === source,
      name: restored.name,
      tables: restored.getMetadata().featureTables,
    };
  });

  expect(result).toEqual({ sameSource: true, name: 'local', tables: ['places'] });
});

test('GeoPackage: toGeoJSON exporta únicamente las tablas vectoriales', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const gpkg = new IDEE.layer.GeoPackage({
      url: '/fixtures/geopackage/mixed.gpkg',
      name: 'mixed',
    });
    let pendingError;
    try {
      gpkg.toGeoJSON();
    } catch (error) {
      pendingError = String(error);
    }
    await gpkg.whenReady();
    const geojson = gpkg.toGeoJSON();
    geojson.features[0].properties.title = 'Modificado';
    return {
      pendingError,
      geojson,
      currentTitle: gpkg.toGeoJSON().features[0].properties.title,
    };
  });

  expect(result.pendingError).toContain('capa');
  expect(result.geojson).toEqual({
    type: 'FeatureCollection',
    crs: {
      type: 'name',
      properties: { name: 'EPSG:4326' },
    },
    features: [{
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [0, 0] },
      properties: { id: 1, title: 'Modificado' },
      tableName: 'places',
    }],
  });
  expect(result.currentTitle).toBe('Origen');
});

test('GeoPackage: toGeoJSON devuelve una colección vacía si no hay tablas vectoriales', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const gpkg = new IDEE.layer.GeoPackage({ url: '/fixtures/geopackage/raster.gpkg' });
    await gpkg.whenReady();
    return gpkg.toGeoJSON();
  });

  expect(result).toEqual({ type: 'FeatureCollection', features: [] });
});

test('GeoPackage: tiled consulta el índice espacial por la extensión solicitada', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const gpkg = new IDEE.layer.GeoPackage({
      url: '/fixtures/geopackage/bbox.gpkg',
      tiled: true,
    });
    await gpkg.whenReady();
    const { bboxLoader } = gpkg.getLayer('places').constructorParameters.parameters;
    return {
      center: bboxLoader([-1000000, -1000000, 1000000, 1000000], 'EPSG:3857'),
      east: bboxLoader([
        10000000, -1000000, 12000000, 1000000,
      ], 'EPSG:3857'),
      tiled: gpkg.tiled,
      initialData: gpkg.properties.tables.places.data.features.length,
      serialized: gpkg.toJSON().options.tiled,
      exported: gpkg.toGeoJSON().features.length,
    };
  });

  expect(result.center.features.map(({ properties }) => properties.title)).toEqual(['Origen']);
  expect(result.east.features.map(({ properties }) => properties.title)).toEqual(['Este']);
  expect(result.tiled).toBe(true);
  expect(result.initialData).toBe(0);
  expect(result.serialized).toBe(true);
  expect(result.exported).toBe(3);
});

test('GeoPackage: tiled carga nuevas entidades al cambiar el BBOX visible', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const map = IDEE.map({
      container: 'map', layers: [], controls: [], center: [0, 0], zoom: 5,
    });
    const gpkg = new IDEE.layer.GeoPackage({
      url: '/fixtures/geopackage/bbox.gpkg',
      tiled: true,
    });
    await gpkg.whenReady();
    const layer = gpkg.getLayer('places');
    const waitForTitle = (title) => new Promise((resolve) => {
      const check = () => {
        if (layer.getFeatures().some((feature) => feature.getAttribute('title') === title)) {
          resolve();
        } else {
          layer.once(IDEE.evt.LOAD, check);
        }
      };
      check();
    });
    const initialLoad = waitForTitle('Origen');
    await gpkg.addTo(map);
    await initialLoad;
    const initial = layer.getFeatures().map((feature) => feature.getAttribute('title')).sort();
    const eastLoad = waitForTitle('Este');
    map.getImpl().getMapImpl().getView().setCenter([11131949.079327358, 0]);
    await eastLoad;
    return {
      initial,
      loaded: layer.getFeatures().map((feature) => feature.getAttribute('title')).sort(),
    };
  });

  expect(result.initial).toEqual(['Origen']);
  expect(result.loaded).toEqual(['Este', 'Origen']);
});
