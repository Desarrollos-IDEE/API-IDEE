import { test, expect } from '@playwright/test';

/**
 * Páginas de prueba con el núcleo y el plugin compilados en local para cada
 * implementación (npm run build:ol-core / build:cesium-core y npm run build
 * en el plugin).
 */
export const PAGES = {
  ol: '/src/plugins/layerswitcher/test/playwright/ol/layerswitcher-ol.html',
  cesium: '/src/plugins/layerswitcher/test/playwright/cesium/layerswitcher-cesium.html',
};

/**
 * Tiempo máximo de espera de las aserciones. En Cesium los objetos vectoriales se
 * insertan cuando el globo ha cargado sus teselas, que en navegadores sin GPU va a
 * pocos fotogramas por segundo (más de 10 s con dos navegadores en paralelo).
 */
export const TIMEOUT = { ol: 10000, cesium: 40000 };

/** Centro inicial: en 3D (EPSG:4979) va en grados. */
export const CENTER = { ol: [-411884, 4927603], cesium: [-3.7, 40.4] };

/** Servidor de teselas simulado para las capas ráster de prueba. */
export const TILES_URL = 'https://tiles.layerswitcher.test';

const CORS = { 'access-control-allow-origin': '*' };
const PNG_1PX = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
);

/**
 * Ajusta el tiempo de los tests a la implementación.
 *
 * @param {String} impl 'ol' o 'cesium'.
 */
export const configureEngine = (impl) => {
  test.describe.configure({ timeout: impl === 'cesium' ? 120000 : 45000 });
};

/**
 * Responde a cualquier petición de teselas de TILES_URL con un PNG de 1 píxel.
 *
 * @param {Page} page Página de Playwright.
 */
export const mockTiles = async (page) => {
  await page.route(`${TILES_URL}/**`, (route) => route.fulfill({
    status: 200, headers: CORS, contentType: 'image/png', body: PNG_1PX,
  }));
};

/**
 * Abre la página de la implementación, crea un mapa sin capa base ni terreno
 * (sin red) y añade el plugin abierto.
 *
 * @param {Page} page Página de Playwright.
 * @param {String} impl 'ol' o 'cesium'.
 * @param {Object} pluginOptions Opciones adicionales del plugin.
 */
export const openMap = async (page, impl, pluginOptions = {}) => {
  await page.goto(PAGES[impl]);
  await page.evaluate(({ options, center }) => {
    IDEE.config.baseLayer = [];
    if (IDEE.config.terrain) IDEE.config.terrain.default = [];
    window.mapjs = IDEE.map({
      container: 'mapjs', controls: [], layers: [], center, zoom: 6,
    });
    window.mp = new IDEE.plugin.Layerswitcher({
      collapsed: false, precharged: { services: [] }, ...options,
    });
    window.mapjs.addPlugin(window.mp);
  }, { options: pluginOptions, center: CENTER[impl] });
  expect(await page.evaluate(() => window.mapjs.getImplementation())).toBe(impl);
};

/**
 * Añade al mapa una capa vectorial con datos en línea ("puntos") y una capa
 * ráster XYZ con teselas simuladas ("teselas").
 *
 * @param {Page} page Página de Playwright.
 */
export const addSampleLayers = async (page) => {
  await page.evaluate((tilesUrl) => {
    window.puntos = new IDEE.layer.GeoJSON({
      name: 'puntos',
      legend: 'Puntos',
      source: {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature', id: 'a', geometry: { type: 'Point', coordinates: [2.1, 41.4] }, properties: { nombre: 'A' },
          },
          {
            type: 'Feature', id: 'b', geometry: { type: 'Point', coordinates: [2.2, 41.5] }, properties: { nombre: 'B' },
          },
        ],
      },
    });
    window.teselas = new IDEE.layer.XYZ({
      url: `${tilesUrl}/{z}/{x}/{y}.png`,
      name: 'teselas',
      legend: 'Teselas',
      transparent: true,
    });
    window.mapjs.addLayers([window.puntos, window.teselas]);
  }, TILES_URL);
};

/**
 * Fila del panel de una capa por su nombre.
 *
 * @param {Page} page Página de Playwright.
 * @param {String} name Nombre de la capa.
 * @returns {Locator} Fila de la capa.
 */
export const layerRow = (page, name) => page.locator(`#layerswitcher-layers li[data-layer-name="${name}"]`);

/**
 * Cambia la opacidad desde el control deslizante de una capa.
 *
 * @param {Page} page Página de Playwright.
 * @param {String} name Nombre de la capa.
 * @param {Number} value Opacidad entre 0 y 1.
 */
export const setOpacitySlider = async (page, name, value) => {
  await layerRow(page, name).locator('input.layerswitcher-transparency').evaluate((input, v) => {
    const slider = input;
    slider.value = String(v);
    slider.dispatchEvent(new Event('input', { bubbles: true }));
  }, value);
};

/**
 * Extensión visible del mapa en grados o en unidades del mapa.
 *
 * @param {Page} page Página de Playwright.
 * @returns {Promise<Array<Number>>} [minx, miny, maxx, maxy].
 */
export const getBbox = (page) => page.evaluate(() => {
  const bbox = window.mapjs.getBbox();
  return [bbox.x.min, bbox.y.min, bbox.x.max, bbox.y.max];
});
