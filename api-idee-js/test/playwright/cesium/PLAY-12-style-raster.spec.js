import { test, expect } from '@playwright/test';
import { createGeoTIFF } from './fixtures/geotiff';

/*
 * IDEE.style.Raster en Cesium: el proveedor del GeoTIFF pinta cada píxel con la
 * rampa, las paradas, los canales, el valor sin datos y los filtros de color del
 * estilo (mismos cálculos que el estilo WebGL de OpenLayers). GeoTIFF sintético de
 * 16 bits en EPSG:3857: mitad oeste 1000, mitad este 3000 (estadísticas GDAL
 * 1000-3000, normalizados a 0 y 1) y esquina NO sin datos.
 */
const PAGE = '/test/playwright/cesium/basic-cesium.html';
const WAIT = { timeout: 20000 };
const TIFF_BBOX = [-450000, 4900000, -350000, 5000000];
const R = 6378137;
const toDegrees = ([x, y]) => [
  (x / R) * (180 / Math.PI),
  (2 * Math.atan(Math.exp(y / R)) - Math.PI / 2) * (180 / Math.PI),
];
const WEST = toDegrees([-420000, 4950000]);
const EAST = toDegrees([-370000, 4950000]);
const NODATA = toDegrees([-445000, 4995000]);

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

const applyStyle = (page, options) => page.evaluate(async (styleOptions) => {
  const before = window.layer.getImpl().getLayer();
  window.layer.setStyle(styleOptions === null ? null : new IDEE.style.Raster(styleOptions));
  const started = Date.now();
  while (window.layer.getImpl().getLayer() === before && Date.now() - started < 15000) {
    // eslint-disable-next-line no-await-in-loop
    await new Promise((resolve) => { setTimeout(resolve, 50); });
  }
  return window.pixelsAt(window.layer, 8, [window.WEST, window.EAST, window.NODATA]);
}, options);

test.describe('IDEE.style.Raster en Cesium', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(60000);
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
    await page.goto(PAGE);
    await page.evaluate(([west, east, nodata]) => {
      IDEE.config.baseLayer = [];
      IDEE.config.terrain.default = [];
      window.WEST = west;
      window.EAST = east;
      window.NODATA = nodata;
      window.map = IDEE.map({
        container: 'map', controls: [], layers: [], center: [-3.7, 40.4], zoom: 6,
      });
      window.inViewer = (layer) => {
        const native = layer.getImpl().getLayer();
        return !!native && window.map.getMapImpl().imageryLayers.contains(native);
      };
      window.pixelsAt = async (layer, level, points) => {
        const provider = layer.getImpl().getLayer().imageryProvider;
        const { tilingScheme } = provider;
        return Promise.all(points.map(async ([lon, lat]) => {
          const position = window.Cesium.Cartographic.fromDegrees(lon, lat);
          const { x, y } = tilingScheme.positionToTileXY(position, level);
          const canvas = await provider.requestImage(x, y, level);
          const rect = tilingScheme.tileXYToRectangle(x, y, level);
          const px = Math.floor(((position.longitude - rect.west) / rect.width) * canvas.width);
          const py = Math.floor(((rect.north - position.latitude) / rect.height) * canvas.height);
          return Array.from(canvas.getContext('2d').getImageData(px, py, 1, 1).data);
        }));
      };
    }, [WEST, EAST, NODATA]);
  });

  test('crea el estilo con las mismas opciones, getters y serialización que en 2D', async ({ page }) => {
    const result = await page.evaluate(() => {
      const { Raster } = IDEE.style;
      const filterStyle = new Raster({
        saturation: -1, gamma: 0.6, contrast: 0.4, name: 'Filtros',
      });
      filterStyle.setBrightness(0.35);
      filterStyle.setExposure(0.3);
      const ndviStyle = new Raster({
        formula: Raster.FORMULA.NDVI,
        bands: Raster.DEFAULT_NDVI.bands,
        min: Raster.DEFAULT_NDVI.min,
        max: Raster.DEFAULT_NDVI.max,
        ramp: Raster.DEFAULT_NDVI.ramp,
      });
      const restored = IDEE.Style.deserialize(filterStyle.serialize());
      return {
        isRaster: filterStyle instanceof Raster,
        filters: [filterStyle.getSaturation(), filterStyle.getGamma(), filterStyle.getContrast(),
          filterStyle.getBrightness(), filterStyle.getExposure()],
        ndvi: [ndviStyle.getFormula(), ndviStyle.getMin(), ndviStyle.getMax(),
          ndviStyle.getOptions().bands],
        restored: [restored instanceof Raster, restored.getGamma(), restored.getSaturation(),
          restored.get('name')],
      };
    });
    expect(result).toEqual({
      isRaster: true,
      filters: [-1, 0.6, 0.4, 0.35, 0.3],
      ndvi: ['ndvi', -1, 1, [2, 1]],
      restored: [true, 0.6, -1, 'Filtros'],
    });
  });

  test('pinta la rampa y las paradas con los valores normalizados y respeta el sin datos', async ({ page }) => {
    await page.evaluate(async () => {
      const blob = await (await window.fetch('/fixtures/geotiff/proyectado.tif')).blob();
      window.layer = new IDEE.layer.GeoTIFF({ blob, name: 'proyectado', legend: 'Proyectado' });
      window.map.addLayers(window.layer);
    });
    await expect.poll(() => page.evaluate(() => window.inViewer(window.layer)), WAIT).toBe(true);

    expect(await applyStyle(page, { bands: 1, ramp: ['#0000ff', '#ff0000'] }))
      .toEqual([[0, 0, 255, 255], [255, 0, 0, 255], [0, 0, 0, 0]]);

    expect(await applyStyle(page, {
      bands: 1, ramp: ['#0000ff', '#00ff00', '#ff0000'], stops: [1000, 1500, 3000],
    })).toEqual([[0, 0, 255, 255], [255, 0, 0, 255], [0, 0, 0, 0]]);

    expect(await applyStyle(page, {
      bands: 1, ramp: ['#0000ff', '#ff0000'], nodata: 1000,
    })).toEqual([[0, 0, 0, 0], [255, 0, 0, 255], [0, 0, 0, 0]]);

    const legend = await page.evaluate(() => window.layer.getLegendURL());
    expect(legend).toMatch(/^data:image\/png;base64,/);
  });

  test('canales, filtros de color y quitar el estilo restaura el pintado original', async ({ page }) => {
    await page.evaluate(async () => {
      const blob = await (await window.fetch('/fixtures/geotiff/proyectado.tif')).blob();
      window.layer = new IDEE.layer.GeoTIFF({ blob, name: 'proyectado', legend: 'Proyectado' });
      window.map.addLayers(window.layer);
    });
    await expect.poll(() => page.evaluate(() => window.inViewer(window.layer)), WAIT).toBe(true);
    const tiff = await page.evaluate(() => {
      window.tiff = window.layer.getImpl().getLayer().imageryProvider.tiff;
      return !!window.tiff;
    });
    expect(tiff).toBe(true);

    expect(await applyStyle(page, { bands: [1, 0, 0] }))
      .toEqual([[0, 0, 0, 255], [255, 0, 0, 255], [0, 0, 0, 0]]);

    expect(await applyStyle(page, { bands: [1, 1, 1], brightness: 0.5 }))
      .toEqual([[128, 128, 128, 255], [255, 255, 255, 255], [0, 0, 0, 0]]);

    expect(await applyStyle(page, {
      bands: 1, ramp: ['#000000', '#ffffff'], gamma: 0.5, contrast: 0.2,
    })).toEqual([[0, 0, 0, 255], [255, 255, 255, 255], [0, 0, 0, 0]]);

    const sameTiff = await page.evaluate(() => window.layer.getImpl().getLayer()
      .imageryProvider.tiff === window.tiff);
    expect(sameTiff).toBe(true);

    expect(await applyStyle(page, null))
      .toEqual([[0, 0, 0, 255], [255, 255, 255, 255], [0, 0, 0, 0]]);
  });
});
