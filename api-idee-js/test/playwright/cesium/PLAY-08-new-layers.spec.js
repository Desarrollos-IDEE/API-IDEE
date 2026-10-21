import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';
import path from 'path';
import { createGeoTIFF } from './fixtures/geotiff';
import { createGeoPackage } from '../ol/fixtures/geopackage';

/*
 * Tipos de capa que se han implementado en Cesium: GeoTIFF, MVT, MBTilesVector,
 * GeoPackageTile (vía GeoPackage) y WMC. Las teselas se generan en el navegador,
 * así que además de alta, visibilidad, opacidad, extensión y baja se comprueban
 * los píxeles que pinta cada proveedor. Red simulada.
 */
const PAGE = '/test/playwright/cesium/basic-cesium.html';
const MVT_HOST = 'https://mvt.cesium.test';
const WMC_HOST = 'https://wmc.cesium.test';
const CORS = { 'access-control-allow-origin': '*' };
const PNG_1PX = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
);
const FIXTURES = path.join(__dirname, '..', 'fixtures');
const POINT_PBF = readFileSync(path.join(FIXTURES, 'refresh', 'point.pbf'));
const WAIT = { timeout: 20000 };

/* GeoTIFF de 16 bits en EPSG:3857: mitad oeste 1000, mitad este 3000 y esquina NO sin datos */
const TIFF_BBOX = [-450000, 4900000, -350000, 5000000];
const tiffValues = () => {
  const values = new Uint16Array(16 * 16);
  for (let row = 0; row < 16; row += 1) {
    for (let col = 0; col < 16; col += 1) {
      let value = col < 8 ? 1000 : 3000;
      if (row < 4 && col < 4) value = 0;
      values[row * 16 + col] = value;
    }
  }
  return values;
};
const R = 6378137;
const toDegrees = ([x, y]) => [
  (x / R) * (180 / Math.PI),
  (2 * Math.atan(Math.exp(y / R)) - Math.PI / 2) * (180 / Math.PI),
];

/* Contexto WMC en EPSG:25830 con una capa suelta y otra en una sección */
const wmcLayer = (name, extension = '') => `<Layer queryable="1" hidden="0">
    <Server service="OGC:WMS" version="1.3.0">
      <OnlineResource xlink:type="simple" xlink:href="${WMC_HOST}/wms?"/>
    </Server>
    <Name>${name}</Name><Title>Título ${name}</Title>
    <FormatList><Format current="1">image/png</Format></FormatList>
    <Extension>
      <ol:transparent>true</ol:transparent>
      <ol:isBaseLayer>false</ol:isBaseLayer>
      <ol:displayInLayerSwitcher>true</ol:displayInLayerSwitcher>
      ${extension}
    </Extension>
  </Layer>`;
const WMC_EXTENT = [400000, 4400000, 500000, 4500000];
const WMC_CONTEXT = `<?xml version="1.0" encoding="UTF-8"?>
<ViewContext xmlns="http://www.opengis.net/context" xmlns:ol="http://openlayers.org/context"
  xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1.0" id="contexto">
  <General>
    <Window width="800" height="600"/>
    <BoundingBox SRS="EPSG:25830" minx="${WMC_EXTENT[0]}" miny="${WMC_EXTENT[1]}"
      maxx="${WMC_EXTENT[2]}" maxy="${WMC_EXTENT[3]}"/>
    <Title>Contexto de prueba</Title>
    <Extension>
      <ol:maxExtent minx="${WMC_EXTENT[0]}" miny="${WMC_EXTENT[1]}"
        maxx="${WMC_EXTENT[2]}" maxy="${WMC_EXTENT[3]}"/>
      <ol:group><ol:group id="sec1" title="Sección 1" orderInsideGroupDisplay="1"/></ol:group>
    </Extension>
  </General>
  <LayerList>
    ${wmcLayer('suelta')}
    ${wmcLayer('agrupada', `<ol:groupDisplayLayerSwitcher>sec1</ol:groupDisplayLayerSwitcher>
      <ol:orderInsideGroupDisplayLayerSwitcher>1</ol:orderInsideGroupDisplayLayerSwitcher>`)}
  </LayerList>
</ViewContext>`;

test.describe.configure({ timeout: 60000 });

test.describe('Capas nuevas en Cesium', () => {
  let mvtRequests;

  test.beforeEach(async ({ page }) => {
    mvtRequests = [];
    await page.route(`${MVT_HOST}/**`, (route) => {
      mvtRequests.push(route.request().url());
      return route.fulfill({
        status: 200, headers: CORS, contentType: 'application/x-protobuf', body: POINT_PBF,
      });
    });
    await page.route(`${WMC_HOST}/**`, (route) => {
      const url = route.request().url();
      if (url.endsWith('.xml')) {
        return route.fulfill({
          status: 200, headers: CORS, contentType: 'application/xml', body: WMC_CONTEXT,
        });
      }
      return route.fulfill({
        status: 200, headers: CORS, contentType: 'image/png', body: PNG_1PX,
      });
    });
    await page.route('**/fixtures/geotiff/proyectado.tif', (route) => route.fulfill({
      status: 200,
      contentType: 'image/tiff',
      body: createGeoTIFF({
        width: 16,
        height: 16,
        values: tiffValues(),
        bbox: TIFF_BBOX,
        epsg: 3857,
        nodata: 0,
        stats: [1000, 3000],
      }),
    }));
    await page.route('**/fixtures/geopackage/*.gpkg', async (route) => {
      const kind = path.basename(new URL(route.request().url()).pathname, '.gpkg');
      await route.fulfill({ body: await createGeoPackage(kind), contentType: 'application/geopackage+sqlite3' });
    });
    await page.goto(PAGE);
    await page.evaluate(() => {
      IDEE.config.baseLayer = [];
      IDEE.config.terrain.default = [];
      window.map = IDEE.map({
        container: 'map', controls: [], layers: [], center: [-3.7, 40.4], zoom: 6,
      });
      window.events = [];
      window.map.on(IDEE.evt.REMOVED_LAYER, (layers) => {
        [].concat(layers).forEach((l) => window.events.push(`removed:${l.name}`));
      });
      window.inViewer = (layer) => {
        const native = layer.getImpl().getLayer();
        return !!native && window.map.getMapImpl().imageryLayers.contains(native);
      };
      /* Píxeles RGBA de la tesela del proveedor de la capa que contiene cada punto (grados) */
      window.pixelsAt = async (layer, level, points) => {
        const provider = layer.getImpl().getLayer().imageryProvider;
        const { tilingScheme } = provider;
        return Promise.all(points.map(async ([lon, lat]) => {
          const position = Cesium.Cartographic.fromDegrees(lon, lat);
          const { x, y } = tilingScheme.positionToTileXY(position, level);
          const canvas = await provider.requestImage(x, y, level);
          const rect = tilingScheme.tileXYToRectangle(x, y, level);
          const px = Math.floor(((position.longitude - rect.west) / rect.width) * canvas.width);
          const py = Math.floor(((rect.north - position.latitude) / rect.height) * canvas.height);
          return Array.from(canvas.getContext('2d').getImageData(px, py, 1, 1).data);
        }));
      };
      /* Píxeles RGBA de una tesela concreta del proveedor */
      window.tilePixels = async (layer, [x, y, level], pixels) => {
        const provider = layer.getImpl().getLayer().imageryProvider;
        const canvas = await provider.requestImage(x, y, level);
        const context = canvas.getContext('2d');
        return pixels.map(([px, py]) => Array.from(context.getImageData(px, py, 1, 1).data));
      };
    });
  });

  test('GeoTIFF RGB por URL: alta, extensión, píxeles, visibilidad, opacidad y baja', async ({ page }) => {
    await page.evaluate(() => {
      window.layer = new IDEE.layer.GeoTIFF({
        url: '/test/playwright/fixtures/refresh/raster.tif', name: 'tif', legend: 'GeoTIFF',
      });
      window.layer.on(IDEE.evt.ADDED_TO_MAP, () => window.events.push('added'));
      window.layer.on(IDEE.evt.LOAD, () => window.events.push('load'));
      window.map.addLayers(window.layer);
    });
    await expect.poll(() => page.evaluate(() => window.inViewer(window.layer)), WAIT).toBe(true);
    const state = await page.evaluate(async () => ({
      events: window.events.slice(),
      extent: window.layer.getMaxExtent(),
      inMap: window.map.getLayers().includes(window.layer),
      geotiffs: window.map.getGeoTIFF().map((l) => l.name),
      bands: await window.layer.getBandCount(),
      roles: await window.layer.getBandRoles(),
      // Centro de la imagen (el fixture es rojo) y fuera de ella (transparente)
      pixels: await window.pixelsAt(window.layer, 0, [[0, 0], [10, 10]]),
    }));
    expect(state.events).toEqual(expect.arrayContaining(['added', 'load']));
    expect(state.extent).toEqual([-1, -1, 1, 1]);
    expect(state.inMap).toBe(true);
    expect(state.geotiffs).toEqual(['tif']);
    expect(state.bands).toBe(3);
    expect(state.roles).toBeNull();
    expect(state.pixels).toEqual([[255, 0, 0, 255], [0, 0, 0, 0]]);

    const after = await page.evaluate(() => {
      window.layer.setVisible(false);
      const hidden = window.layer.getImpl().getLayer().show;
      window.layer.setVisible(true);
      window.layer.setOpacity(0.4);
      const alpha = window.layer.getImpl().getLayer().alpha;
      const native = window.layer.getImpl().getLayer();
      window.map.removeLayers(window.layer);
      return {
        hidden,
        alpha,
        removed: !window.map.getMapImpl().imageryLayers.contains(native),
        geotiffs: window.map.getGeoTIFF().length,
        events: window.events,
      };
    });
    expect(after).toEqual({
      hidden: false, alpha: 0.4, removed: true, geotiffs: 0, events: expect.arrayContaining(['removed:tif']),
    });
  });

  test('GeoTIFF de 16 bits en EPSG:3857 desde un Blob: reproyección, normalización y nodata', async ({ page }) => {
    await page.evaluate(async () => {
      const blob = await (await window.fetch('/fixtures/geotiff/proyectado.tif')).blob();
      window.layer = new IDEE.layer.GeoTIFF({ blob, name: 'proyectado', legend: 'Proyectado' });
      window.map.addLayers(window.layer);
    });
    await expect.poll(() => page.evaluate(() => window.inViewer(window.layer)), WAIT).toBe(true);
    const west = toDegrees([-420000, 4950000]);
    const east = toDegrees([-370000, 4950000]);
    const nodata = toDegrees([-445000, 4995000]);
    const state = await page.evaluate(async (points) => ({
      extent: window.layer.getMaxExtent(),
      bands: await window.layer.getBandCount(),
      pixels: await window.pixelsAt(window.layer, 8, points),
    }), [west, east, nodata]);
    const expected = toDegrees(TIFF_BBOX.slice(0, 2)).concat(toDegrees(TIFF_BBOX.slice(2)));
    state.extent.forEach((value, i) => expect(value).toBeCloseTo(expected[i], 4));
    expect(state.bands).toBe(1);
    // Estadísticas GDAL 1000-3000: oeste negro, este blanco; la esquina sin datos, transparente
    expect(state.pixels).toEqual([[0, 0, 0, 255], [255, 255, 255, 255], [0, 0, 0, 0]]);
  });

  test('MVT: pide teselas, pinta con el estilo de la capa y lo repinta al cambiarlo', async ({ page }) => {
    await page.evaluate((host) => {
      window.layer = new IDEE.layer.MVT({
        url: `${host}/tiles/{z}/{x}/{y}.pbf`, name: 'mvt', legend: 'MVT de prueba',
      });
      window.layer.on(IDEE.evt.ADDED_TO_MAP, () => window.events.push('added'));
      window.layer.on(IDEE.evt.LOAD, () => window.events.push('load'));
      window.map.addLayers(window.layer);
    }, MVT_HOST);
    await expect.poll(() => page.evaluate(() => window.inViewer(window.layer)), WAIT).toBe(true);
    await expect.poll(() => mvtRequests.length, WAIT).toBeGreaterThan(0);
    expect(mvtRequests[0]).toMatch(/\/tiles\/\d+\/\d+\/\d+\.pbf$/);

    // El punto de point.pbf está en el centro de cada tesela
    const defaults = await page.evaluate(async () => ({
      events: window.events.slice(),
      mvts: window.map.getMVT().map((l) => l.name),
      style: !!window.layer.getStyle(),
      pixels: await window.tilePixels(window.layer, [0, 0, 1], [[128, 128], [10, 10]]),
    }));
    expect(defaults.events).toEqual(expect.arrayContaining(['added', 'load']));
    expect(defaults.mvts).toEqual(['mvt']);
    expect(defaults.style).toBe(true);
    // Estilo por defecto: relleno blanco al 60 % (Firefox redondea a 254 al premultiplicar el alfa)
    defaults.pixels[0].slice(0, 3).forEach((channel) => expect(channel).toBeGreaterThanOrEqual(250));
    expect(defaults.pixels[0][3]).toBeGreaterThan(140);
    expect(defaults.pixels[0][3]).toBeLessThan(165);
    expect(defaults.pixels[1]).toEqual([0, 0, 0, 0]);

    await page.evaluate(() => {
      window.before = window.layer.getImpl().getLayer();
      window.layer.setStyle(new IDEE.style.Generic({
        point: { fill: { color: '#ff0000', opacity: 1 }, radius: 10 },
      }));
    });
    // El repintado sustituye la capa de imágenes del visor
    await expect.poll(() => page.evaluate(() => window.layer.getImpl().getLayer() !== window.before
      && window.inViewer(window.layer)), WAIT).toBe(true);
    const styled = await page.evaluate(async () => ({
      pixels: await window.tilePixels(window.layer, [0, 0, 1], [[128, 128], [136, 128]]),
    }));
    expect(styled.pixels).toEqual([[255, 0, 0, 255], [255, 0, 0, 255]]);

    const after = await page.evaluate(() => {
      window.layer.setOpacity(0.3);
      window.layer.setVisible(false);
      const native = window.layer.getImpl().getLayer();
      const state = { alpha: native.alpha, show: native.show };
      window.map.removeLayers(window.layer);
      return { ...state, removed: !window.map.getMapImpl().imageryLayers.contains(native) };
    });
    expect(after).toEqual({ alpha: 0.3, show: false, removed: true });
  });

  test('MVT: el filtro de capas de la tesela', async ({ page }) => {
    const pixels = await page.evaluate(async (host) => {
      window.layer = new IDEE.layer.MVT({
        url: `${host}/tiles/{z}/{x}/{y}.pbf`, name: 'filtrada', layers: ['otra'],
      });
      window.map.addLayers(window.layer);
      return window.tilePixels(window.layer, [0, 0, 1], [[128, 128]]);
    }, MVT_HOST);
    expect(pixels).toEqual([[0, 0, 0, 0]]);
  });

  test('MBTilesVector: abre el MBTiles, limita niveles y extensión y pinta sus teselas', async ({ page }) => {
    await page.evaluate(() => {
      window.layer = new IDEE.layer.MBTilesVector({
        url: '/test/playwright/fixtures/refresh/vector.mbtiles', name: 'mbtv', legend: 'MBTilesVector',
      });
      window.layer.on(IDEE.evt.LOAD, () => window.events.push('load'));
      window.map.addLayers(window.layer);
    });
    await expect.poll(() => page.evaluate(() => window.inViewer(window.layer)), WAIT).toBe(true);
    const state = await page.evaluate(async () => {
      const provider = window.layer.getImpl().getLayer().imageryProvider;
      const rect = provider.rectangle;
      return {
        events: window.events.slice(),
        layers: window.map.getMBTilesVector().map((l) => l.name),
        maximumLevel: provider.maximumLevel,
        rectangle: [rect.west, rect.south, rect.east, rect.north].map((r) => Cesium.Math.toDegrees(r)),
        pixels: await window.tilePixels(window.layer, [1, 1, 2], [[128, 128], [10, 10]]),
      };
    });
    expect(state.events).toContain('load');
    expect(state.layers).toEqual(['mbtv']);
    expect(state.maximumLevel).toBe(3);
    // Los límites del MBTiles, recortados al esquema Web Mercator (±85,05º)
    [-180, -85.05, 180, 85.05].forEach((value, i) => expect(state.rectangle[i]).toBeCloseTo(value, 1));
    expect(state.pixels[0][3]).toBeGreaterThan(0);
    expect(state.pixels[1]).toEqual([0, 0, 0, 0]);

    const removed = await page.evaluate(() => {
      const native = window.layer.getImpl().getLayer();
      window.map.removeLayers(window.layer);
      return !window.map.getMapImpl().imageryLayers.contains(native);
    });
    expect(removed).toBe(true);
  });

  test('GeoPackage: sus teselas se añaden como GeoPackageTile y se quitan con el paquete', async ({ page }) => {
    const state = await page.evaluate(async () => {
      const response = await window.fetch('/fixtures/geopackage/mixed.gpkg');
      window.gpkg = new IDEE.layer.GeoPackage(response);
      const loaded = new Promise((resolve) => { window.gpkg.once(IDEE.evt.LOAD_LAYERS, resolve); });
      window.map.addLayers(window.gpkg);
      await loaded;
      const tiles = window.gpkg.getLayers().find((l) => l.type === 'GeoPackageTile');
      window.tiles = tiles;
      return {
        types: window.gpkg.getLayers().map((l) => l.type).sort(),
        attached: window.gpkg.getLayers().every((l) => window.map.getLayers().includes(l)),
        tileLayers: window.map.getGeoPackageTile().length,
        extent: await tiles.getImpl().getExtentFromProvider(),
      };
    });
    expect(state.types).toEqual(['GeoJSON', 'GeoPackageTile']);
    expect(state.attached).toBe(true);
    expect(state.tileLayers).toBe(1);
    expect(state.extent[0]).toBeCloseTo(-180, 4);
    expect(state.extent[2]).toBeCloseTo(180, 4);
    await expect.poll(() => page.evaluate(() => window.inViewer(window.tiles)), WAIT).toBe(true);
    // La tesela de nivel 0 del paquete se dibuja en el proveedor
    const tile = await page.evaluate(async () => {
      const provider = window.tiles.getImpl().getLayer().imageryProvider;
      const image = await provider.requestImage(0, 0, 0);
      return { width: image.width, height: image.height };
    });
    expect(tile.width).toBeGreaterThan(0);
    expect(tile.height).toBeGreaterThan(0);

    const after = await page.evaluate(() => {
      const native = window.tiles.getImpl().getLayer();
      window.map.removeGeoPackage(window.gpkg);
      return {
        removed: !window.map.getMapImpl().imageryLayers.contains(native),
        tileLayers: window.map.getGeoPackageTile().length,
      };
    });
    expect(after).toEqual({ removed: true, tileLayers: 0 });
  });

  test('WMC: carga el contexto, pasa su extensión a grados y añade capas y secciones', async ({ page }) => {
    await page.evaluate((host) => {
      IDEE.proxy(false);
      window.changes = 0;
      window.map.on(IDEE.evt.CHANGE_WMC, () => { window.changes += 1; });
      window.wmc = new IDEE.layer.WMC({ url: `${host}/contexto.xml`, name: 'contexto' });
      window.map.addWMC(window.wmc);
    }, WMC_HOST);
    await expect.poll(() => page.evaluate(() => window.wmc.isLoaded()), WAIT).toBe(true);
    const state = await page.evaluate(async () => ({
      selected: window.wmc.selected,
      changes: window.changes,
      wmcs: window.map.getWMC().map((l) => l.name),
      layers: window.wmc.layers.map((l) => l.name),
      sections: window.map.getSections().map((s) => s.idSection),
      wms: window.map.getWMS().map((l) => l.name).sort(),
      extent: window.wmc.getMaxExtent(),
      mapExtent: window.map.getMaxExtent(),
      // Con un contexto seleccionado, la extensión de sus capas es la del contexto
      layerExtent: await window.wmc.layers[0].calculateMaxExtent(),
    }));
    expect(state.selected).toBe(true);
    expect(state.changes).toBe(1);
    expect(state.wmcs).toEqual(['contexto']);
    expect(state.layers).toEqual(['suelta']);
    expect(state.sections).toEqual(['sec1']);
    expect(state.wms).toEqual(['agrupada', 'suelta']);
    // EPSG:25830 [400000, 4400000, 500000, 4500000] en grados
    [-4.16715, 39.74404, -3, 40.65086].forEach((value, i) => {
      expect(state.extent[i]).toBeCloseTo(value, 3);
    });
    expect(state.mapExtent).toEqual(state.extent);
    expect(state.layerExtent).toEqual(state.extent);
    await expect.poll(() => page.evaluate(() => window.map.getWMS()
      .every((l) => window.inViewer(l))), WAIT).toBe(true);

    // Un segundo contexto añade el selector; al elegirlo se sustituyen las capas
    await page.evaluate((host) => {
      window.otro = new IDEE.layer.WMC({ url: `${host}/otro.xml`, name: 'otro' });
      window.map.addWMC(window.otro);
    }, WMC_HOST);
    const select = page.locator('select.m-wmcselector-select');
    await expect(select).toHaveCount(1);
    await expect(select.locator('option')).toHaveCount(2);
    const firstLayers = await page.evaluate(() => window.wmc.layers.slice());
    await select.selectOption({ label: 'otro' });
    await expect.poll(() => page.evaluate(() => window.otro.isLoaded()), WAIT).toBe(true);
    const switched = await page.evaluate(() => ({
      selected: [window.wmc.selected, window.otro.selected],
      wms: window.map.getWMS().length,
      sections: window.map.getSections().length,
    }));
    expect(firstLayers.length).toBe(1);
    expect(switched).toEqual({ selected: [false, true], wms: 2, sections: 1 });

    const removed = await page.evaluate(() => {
      window.map.removeWMC(window.otro);
      return {
        wmcs: window.map.getWMC().map((l) => l.name),
        selected: window.wmc.selected,
      };
    });
    // Al quitar el seleccionado se selecciona el que queda
    expect(removed).toEqual({ wmcs: ['contexto'], selected: true });
    await expect.poll(() => page.evaluate(() => window.map.getWMS().length), WAIT).toBe(2);
    await expect(select).toHaveCount(0);
  });

  test('MapLibre no está disponible en Cesium', async ({ page }) => {
    const error = await page.evaluate(() => {
      try {
        // eslint-disable-next-line no-new
        new IDEE.layer.MapLibre({ name: 'maplibre', url: 'https://example.test/style.json' });
        return null;
      } catch (e) {
        return String(e.message || e);
      }
    });
    expect(error).not.toBeNull();
  });
});
