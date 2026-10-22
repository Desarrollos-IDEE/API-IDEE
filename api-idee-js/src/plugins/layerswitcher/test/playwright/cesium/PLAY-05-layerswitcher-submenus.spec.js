import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';
import path from 'path';
import {
  TIMEOUT, configureEngine, mockTiles, openMap, layerRow,
} from '../common/helpers';
// Generador de GeoPackage compartido con los tests del núcleo
// eslint-disable-next-line import/no-relative-packages
import { createGeoPackage } from '../../../../../../test/playwright/ol/fixtures/geopackage';

/*
 * Submenús de añadir capas en 3D (Cesium): búsqueda por URL de teselas 3D, terreno,
 * MVT, GeoTIFF y GeoJSON, y subida de ficheros (GeoJSON y GeoPackage). La red se simula.
 */
const HOST = 'https://servicios.layerswitcher.test';
const CORS = { 'access-control-allow-origin': '*' };
const FIXTURES = path.join(__dirname, '..', '..', '..', '..', '..', '..', 'test', 'playwright', 'fixtures');
const POINT_PBF = readFileSync(path.join(FIXTURES, 'refresh', 'point.pbf'));
// Teselas 3D sin contenido y terreno sin teselas: válidos para Cesium sin descargas adicionales
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
const FEATURES = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature', id: 'p1', geometry: { type: 'Point', coordinates: [-3.7, 40.4] }, properties: { nombre: 'Uno' },
    },
    {
      type: 'Feature', id: 'p2', geometry: { type: 'Point', coordinates: [-3.6, 40.5] }, properties: { nombre: 'Dos' },
    },
  ],
};

const mockServices = (page) => page.route(`${HOST}/**`, (route) => {
  const url = new URL(route.request().url());
  const json = (body, status = 200) => route.fulfill({
    status, headers: CORS, contentType: 'application/json', body: JSON.stringify(body),
  });
  if (url.pathname.endsWith('/tileset.json')) return json(TILESET);
  if (url.pathname.endsWith('/layer.json')) return json(TERRAIN);
  if (url.pathname.endsWith('.terrain')) return route.fulfill({ status: 404, headers: CORS, body: '' });
  if (url.pathname.endsWith('/metadata.json')) {
    return json({ json: JSON.stringify({ vector_layers: [{ id: 'points' }] }) });
  }
  if (url.pathname.endsWith('.pbf')) {
    return route.fulfill({
      status: 200, headers: CORS, contentType: 'application/x-protobuf', body: POINT_PBF,
    });
  }
  if (url.pathname.endsWith('.geojson')) return json(FEATURES);
  return json({ detail: 'not found' }, 404);
});

/** Busca una URL en el diálogo de añadir capas. */
const searchService = async (page, url) => {
  await page.locator('#layerswitcher-add-layer').click();
  const input = page.locator('#m-layerswitcher-addservices-search-input');
  await input.fill(url);
  await input.press('Enter');
};

/** Pone la leyenda en el modal de capa y la añade. */
const addFromModal = async (page, legend) => {
  await page.fill('#m-layerswitcher-layer-legend', legend);
  await page.locator('#m-layerswitcher-layer-button').click();
};

test.describe('Layerswitcher: submenús de añadir capas (cesium)', () => {
  configureEngine('cesium');
  const timeout = TIMEOUT.cesium;

  test.beforeEach(async ({ page }) => {
    await mockTiles(page);
    await mockServices(page);
    await openMap(page, 'cesium');
  });

  test('teselas 3D por tileset.json: se añaden y el zoom vuela hasta ellas', async ({ page }) => {
    await searchService(page, `${HOST}/edificios/tileset.json`);
    await addFromModal(page, 'Edificios');
    await expect.poll(() => page.evaluate(() => window.mapjs.getTiles3D()
      .map((l) => [l.legend, l.url])), { timeout })
      .toEqual([['Edificios', `${HOST}/edificios/tileset.json`]]);
    const name = await page.evaluate(() => window.mapjs.getTiles3D()[0].name);
    await expect(layerRow(page, name)).toHaveCount(1, { timeout });
    await expect.poll(() => page.evaluate(() => !!window
      .mapjs.getTiles3D()[0].getImpl().getLayer()), { timeout })
      .toBe(true);
    // La región del tileset está en torno a (-3.73, 40.41): se aleja la vista y se encuadra
    await page.evaluate(() => window.mapjs.setCenter({ x: 2, y: 45 }));
    await layerRow(page, name).locator('.g-cartografia-btn-layerswitcher-target').click();
    await expect.poll(async () => {
      const center = await page.evaluate(() => window.mapjs.getCenter());
      return Math.abs(center.x + 3.73) < 0.5 && Math.abs(center.y - 40.41) < 0.5;
    }, { timeout }).toBe(true);
  });

  test('terreno por layer.json: se añade sin herramienta de opacidad ni zoom', async ({ page }) => {
    await searchService(page, `${HOST}/terreno/layer.json`);
    await addFromModal(page, 'Terreno');
    await expect.poll(() => page.evaluate(() => window.mapjs.getTerrain()
      .map((l) => [l.legend, l.url])), { timeout })
      .toEqual([['Terreno', `${HOST}/terreno/`]]);
    const row = await page.evaluate(() => window.mapjs.getTerrain()[0].name);
    const tools = await page.evaluate(() => window.mp.controls[0].getImpl()
      .getLayerToolsSupport(window.mapjs.getTerrain()[0]));
    expect(tools).toEqual({ transparency: false, style: false, zoom: false });
    if (await layerRow(page, row).count() > 0) {
      await expect(layerRow(page, row).locator('input.layerswitcher-transparency')).toHaveCount(0);
      await expect(layerRow(page, row).locator('.g-cartografia-btn-layerswitcher-target')).toHaveCount(0);
    }
  });

  test('MVT por URL: lee las capas de metadata.json y añade las elegidas', async ({ page }) => {
    await searchService(page, `${HOST}/vt/{z}/{x}/{y}.pbf`);
    const layerCheck = page.locator('#m-layerswitcher-addservices-results input#points');
    await expect(layerCheck).toHaveCount(1, { timeout });
    await layerCheck.check();
    await addFromModal(page, 'Teselas vectoriales');
    await expect.poll(() => page.evaluate(() => window.mapjs.getMVT()
      // eslint-disable-next-line no-underscore-dangle -- capas MVT pedidas (sin getter público)
      .map((l) => [l.legend, l.getImpl().layers_])), { timeout })
      .toEqual([['Teselas vectoriales', ['points']]]);
    await expect.poll(() => page.evaluate(() => {
      const native = window.mapjs.getMVT()[0].getImpl().getLayer();
      return !!native && window.mapjs.getMapImpl().imageryLayers.contains(native);
    }), { timeout }).toBe(true);
  });

  test('GeoTIFF por URL: se añade sin herramienta de estilo', async ({ page }) => {
    // Servido por el servidor de pruebas: geotiff lee el fichero por rangos de bytes (206)
    await searchService(page, 'http://localhost:8081/test/playwright/fixtures/refresh/raster.tif');
    await addFromModal(page, 'Ráster');
    await expect.poll(() => page.evaluate(() => window.mapjs.getGeoTIFF()
      .map((l) => [l.legend, l.getMaxExtent()])), { timeout })
      .toEqual([['Ráster', [-1, -1, 1, 1]]]);
    const name = await page.evaluate(() => window.mapjs.getGeoTIFF()[0].name);
    await expect(layerRow(page, name)).toHaveCount(1, { timeout });
    await expect(layerRow(page, name).locator('.m-layerswitcher-icons-style')).toHaveCount(0);
    expect(await page.evaluate(() => window.mp.controls[0].getImpl()
      .getLayerToolsSupport(window.mapjs.getGeoTIFF()[0]))).toEqual({ style: false });
  });

  test('GeoJSON por URL', async ({ page }) => {
    await searchService(page, `${HOST}/datos/puntos.geojson`);
    await addFromModal(page, 'Puntos');
    await expect.poll(() => page.evaluate(() => window.mapjs.getGeoJSON()
      .map((l) => [l.legend, l.getFeatures().length])), { timeout })
      .toEqual([['Puntos', 2]]);
  });

  test('sube un fichero GeoJSON', async ({ page }) => {
    await page.locator('#layerswitcher-add-layer').click();
    await page.locator('#m-layerswitcher-addservices-file-input').setInputFiles({
      name: 'subido.geojson', mimeType: 'application/geo+json', buffer: Buffer.from(JSON.stringify(FEATURES)),
    });
    await expect.poll(() => page.evaluate(() => window.mapjs.getLayers()
      .filter((l) => l.name === 'subido').map((l) => l.getFeatures().length)), { timeout })
      .toEqual([2]);
    await expect(layerRow(page, 'subido')).toHaveCount(1, { timeout });
  });

  test('sube un GeoPackage con teselas y objetos', async ({ page }) => {
    await page.route('**/sql-wasm.wasm', (route) => route.fulfill({
      path: require.resolve('sql.js/dist/sql-wasm.wasm'), contentType: 'application/wasm',
    }));
    await page.locator('#layerswitcher-add-layer').click();
    await page.locator('#m-layerswitcher-addservices-file-input').setInputFiles({
      name: 'paquete.gpkg', mimeType: 'application/geopackage+sqlite3', buffer: await createGeoPackage('mixed'),
    });
    await expect.poll(() => page.evaluate(() => window.mapjs.getLayers()
      .filter((l) => l.name.startsWith('paquete:')).map((l) => l.type).sort()), { timeout })
      .toEqual(['GeoJSON', 'GeoPackageTile']);
    await expect.poll(() => page.evaluate(() => {
      const tiles = window.mapjs.getGeoPackageTile()[0];
      const native = tiles && tiles.getImpl().getLayer();
      return !!native && window.mapjs.getMapImpl().imageryLayers.contains(native);
    }), { timeout }).toBe(true);
  });
});
