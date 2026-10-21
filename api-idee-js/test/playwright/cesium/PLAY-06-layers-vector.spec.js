import { test, expect } from '@playwright/test';

/*
 * Capas vectoriales y 3D en Cesium: alta, objetos geográficos, visibilidad,
 * opacidad, extensión y baja; y carga de ficheros con IDEE.loadFiles.
 * Los servicios se simulan y los ficheros son fixtures locales.
 */
const PAGE = '/test/playwright/cesium/basic-cesium.html';
const HOST = 'https://vector.cesium.test';
const CORS = { 'access-control-allow-origin': '*' };
const WAIT = { timeout: 25000 };

const FEATURES = {
  type: 'FeatureCollection',
  features: [
    { type: 'Feature', id: 'p1', geometry: { type: 'Point', coordinates: [-3.7, 40.4] }, properties: { nombre: 'Uno' } },
    { type: 'Feature', id: 'p2', geometry: { type: 'Point', coordinates: [-3.6, 40.5] }, properties: { nombre: 'Dos' } },
  ],
};
const DESCRIBE_FEATURE_TYPE = `<?xml version="1.0" encoding="UTF-8"?>
<xsd:schema xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:gml="http://www.opengis.net/gml" xmlns:prueba="http://prueba" targetNamespace="http://prueba" elementFormDefault="qualified">
  <xsd:complexType name="puntosType"><xsd:complexContent><xsd:extension base="gml:AbstractFeatureType"><xsd:sequence>
    <xsd:element name="nombre" type="xsd:string"/><xsd:element name="the_geom" type="gml:PointPropertyType"/>
  </xsd:sequence></xsd:extension></xsd:complexContent></xsd:complexType>
  <xsd:element name="puntos" type="prueba:puntosType" substitutionGroup="gml:_Feature"/>
</xsd:schema>`;
// Teselas 3D sin contenido: válidas para Cesium y sin descargas adicionales
const TILESET = {
  asset: { version: '1.0' },
  geometricError: 100,
  root: {
    boundingVolume: { region: [-0.0657, 0.7049, -0.0644, 0.7058, 0, 100] },
    geometricError: 0,
    refine: 'ADD',
  },
};
const TERRAIN = {
  tilejson: '2.1.0',
  format: 'quantized-mesh-1.0',
  version: '1.0.0',
  scheme: 'tms',
  tiles: ['{z}/{x}/{y}.terrain'],
  available: [[{
    startX: 0, startY: 0, endX: 1, endY: 0,
  }]],
};

const mockServer = (page) => page.route(`${HOST}/**`, (route) => {
  const url = route.request().url();
  const json = (body) => route.fulfill({
    status: 200, headers: CORS, contentType: 'application/json', body: JSON.stringify(body),
  });
  if (/describefeaturetype/i.test(url)) {
    return route.fulfill({
      status: 200, headers: CORS, contentType: 'text/xml', body: DESCRIBE_FEATURE_TYPE,
    });
  }
  if (url.includes('/tileset.json')) return json(TILESET);
  if (url.includes('/layer.json')) return json(TERRAIN);
  if (url.endsWith('.terrain')) return route.fulfill({ status: 404, headers: CORS, body: '' });
  return json(FEATURES);
});

/** Crea en la página una capa del tipo indicado. */
const createLayer = (page, type) => page.evaluate(({ layerType, host }) => {
  const factories = {
    Vector: () => {
      const layer = new IDEE.layer.Vector({ name: 'vector', legend: 'Vector' });
      layer.addFeatures([new IDEE.Feature('v1', {
        type: 'Feature', geometry: { type: 'Point', coordinates: [-3.7, 40.4] }, properties: {},
      })]);
      return layer;
    },
    GeoJSON: () => new IDEE.layer.GeoJSON({ name: 'geojson', url: `${host}/datos.geojson` }),
    KML: () => new IDEE.layer.KML({
      name: 'kml', url: '/test/playwright/fixtures/kmz/basic.kml', extract: false,
    }),
    KMZ: () => new IDEE.layer.KMZ({
      name: 'kmz', url: '/test/playwright/fixtures/kmz/basic.kmz', extract: false,
    }),
    GPX: () => new IDEE.layer.GPX({
      name: 'gpx', url: '/test/development/CP-0002-layers/fixtures/CP-035.gpx',
    }),
    WFS: () => new IDEE.layer.WFS({
      url: `${host}/wfs?`, namespace: 'prueba', name: 'puntos', geometry: 'POINT', extract: false,
    }),
    OGCAPIFeatures: () => new IDEE.layer.OGCAPIFeatures({
      url: `${host}/ogc/collections/`, name: 'puntos', legend: 'OGC API',
    }),
    GenericVector: () => {
      const source = new Cesium.CustomDataSource('generica');
      source.entities.add({
        id: 'g1',
        position: Cesium.Cartesian3.fromDegrees(-3.7, 40.4),
        point: { pixelSize: 8 },
      });
      return new IDEE.layer.GenericVector({ name: 'generica', legend: 'Genérica' }, {}, source);
    },
  };
  window.events = [];
  const layer = factories[layerType]();
  window.layer = layer;
  layer.on(IDEE.evt.ADDED_TO_MAP, () => window.events.push('added'));
  window.map.addLayers(layer);
}, { layerType: type, host: HOST });

/** Datos de la capa en el visor. */
const dataSourceState = (page) => page.evaluate(() => {
  const native = window.layer.getImpl().getLayer();
  return {
    inViewer: !!native && window.map.getMapImpl().dataSources.contains(native),
    show: native ? native.show : undefined,
    visible: window.layer.isVisible(),
  };
});

test.describe.configure({ timeout: 90000 });

test.describe('Capas vectoriales y 3D en Cesium', () => {
  test.beforeEach(async ({ page }) => {
    await mockServer(page);
    await page.goto(PAGE);
    await page.evaluate(() => {
      IDEE.config.baseLayer = [];
      IDEE.config.terrain.default = [];
      window.map = IDEE.map({
        container: 'map', controls: [], layers: [], center: [-3.7, 40.4], zoom: 9,
      });
    });
  });

  ['Vector', 'GeoJSON', 'KML', 'KMZ', 'GPX', 'WFS', 'OGCAPIFeatures', 'GenericVector'].forEach((type) => {
    test(`${type}: alta, objetos, visibilidad, opacidad, extensión y baja`, async ({ page }) => {
      await createLayer(page, type);
      await expect.poll(() => page.evaluate(() => window.events.includes('added')), WAIT).toBe(true);
      await expect.poll(async () => (await dataSourceState(page)).inViewer, WAIT).toBe(true);
      await expect.poll(() => page.evaluate(() => window.layer.getFeatures().length), WAIT)
        .toBeGreaterThan(0);

      await page.evaluate(() => window.layer.setVisible(false));
      expect(await dataSourceState(page)).toMatchObject({ show: false, visible: false });
      await page.evaluate(() => window.layer.setVisible(true));
      expect(await dataSourceState(page)).toMatchObject({ show: true, visible: true });

      await page.evaluate(() => window.layer.setOpacity(0.4));
      expect(await page.evaluate(() => window.layer.getOpacity())).toBeCloseTo(0.4, 5);

      // Todos los datos de prueba están en la península, en grados. GenericVector
      // calcula la extensión del usuario: la de sus datos es getMaxExtent()
      const [minx, miny, maxx, maxy] = await page.evaluate(() => (window.layer.type === 'GenericVector'
        ? window.layer.getMaxExtent() : window.layer.calculateMaxExtent()));
      expect(minx).toBeGreaterThan(-10);
      expect(maxx).toBeLessThan(5);
      expect(miny).toBeGreaterThan(35);
      expect(maxy).toBeLessThan(44);

      await page.evaluate(() => window.map.removeLayers(window.layer));
      expect((await dataSourceState(page)).inViewer).toBe(false);
      expect(await page.evaluate(() => window.map.getLayers().includes(window.layer))).toBe(false);
    });
  });

  test('Tiles3D: alta, visibilidad, extensión y baja', async ({ page }) => {
    await page.evaluate((host) => {
      window.events = [];
      window.layer = new IDEE.layer.Tiles3D({ url: `${host}/3d/tileset.json`, name: 'teselas3d' });
      window.layer.on(IDEE.evt.ADDED_TO_MAP, () => window.events.push('added'));
      window.map.addLayers(window.layer);
    }, HOST);
    await expect.poll(() => page.evaluate(() => window.events.includes('added')), WAIT).toBe(true);
    const inScene = () => page.evaluate(() => window.map.getMapImpl().scene.primitives
      .contains(window.layer.getImpl().getLayer()));
    expect(await inScene()).toBe(true);
    await page.evaluate(() => window.layer.setVisible(false));
    expect(await page.evaluate(() => window.layer.getImpl().getLayer().show)).toBe(false);
    const extent = await page.evaluate(() => window.layer.getMaxExtent());
    expect(extent).toBeTruthy();
    await page.evaluate(() => window.map.removeLayers(window.layer));
    expect(await page.evaluate(() => window.map.getLayers().includes(window.layer))).toBe(false);
  });

  test('Terrain: alta, ocultar vuelve al elipsoide y baja', async ({ page }) => {
    await page.evaluate((host) => {
      window.events = [];
      window.layer = new IDEE.layer.Terrain({ url: `${host}/terreno/`, name: 'terreno' });
      window.layer.on(IDEE.evt.ADDED_TO_MAP, () => window.events.push('added'));
      window.map.addLayers(window.layer);
    }, HOST);
    await expect.poll(() => page.evaluate(() => window.events.includes('added')), WAIT).toBe(true);
    // Los nombres de clase están minificados: se compara con las clases de Cesium
    const provider = () => page.evaluate(() => {
      const { terrainProvider } = window.map.getMapImpl();
      if (terrainProvider instanceof Cesium.CesiumTerrainProvider) return 'CesiumTerrainProvider';
      if (terrainProvider instanceof Cesium.EllipsoidTerrainProvider) return 'EllipsoidTerrainProvider';
      return 'otro';
    });
    expect(await provider()).toBe('CesiumTerrainProvider');
    await page.evaluate(() => window.layer.setVisible(false));
    expect(await provider()).toBe('EllipsoidTerrainProvider');
    await page.evaluate(() => window.map.removeLayers(window.layer));
    expect(await page.evaluate(() => window.map.getLayers().includes(window.layer))).toBe(false);
  });

  [
    ['geojson', JSON.stringify(FEATURES), 2],
    ['kml', null, 1],
    ['gpx', null, 3],
  ].forEach(([ext, inline, minFeatures]) => {
    test(`IDEE.loadFiles carga un fichero ${ext} como capa vectorial`, async ({ page }) => {
      const files = {
        kml: '/test/playwright/fixtures/kmz/basic.kml',
        gpx: '/test/development/CP-0002-layers/fixtures/CP-035.gpx',
      };
      await page.evaluate(async ({ fileExt, text, path }) => {
        const source = text || await (await fetch(path)).text();
        await IDEE.loadFiles.loadFeaturesFromSource(window.map, source, `fichero_${fileExt}`, fileExt);
      }, { fileExt: ext, text: inline, path: files[ext] });
      const layerName = `fichero_${ext}`;
      await expect.poll(() => page.evaluate((name) => {
        const layer = window.map.getLayers().find((l) => l.name === name);
        return layer ? layer.getFeatures().length : 0;
      }, layerName), WAIT).toBeGreaterThanOrEqual(minFeatures);
      // Los objetos llegan en grados (en la península)
      const [lon, lat] = await page.evaluate((name) => {
        const first = (coords) => (typeof coords[0] === 'number' ? coords : first(coords[0]));
        return first(window.map.getLayers().find((l) => l.name === name)
          .getFeatures()[0].getGeometry().coordinates);
      }, layerName);
      expect(lon).toBeGreaterThan(-10);
      expect(lon).toBeLessThan(5);
      expect(lat).toBeGreaterThan(35);
      expect(lat).toBeLessThan(44);
      expect(await page.locator('div.m-dialog.error').count()).toBe(0);
    });
  });
});
