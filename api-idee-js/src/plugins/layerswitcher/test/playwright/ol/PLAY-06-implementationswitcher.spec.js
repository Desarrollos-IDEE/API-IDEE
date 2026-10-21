import { test, expect } from '@playwright/test';
import {
  TIMEOUT, mockTiles, openMap, addSampleLayers, layerRow,
} from '../common/helpers';

/*
 * El plugin pasa de 2D a 3D y vuelve con el ImplementationSwitcher: se recrea con el
 * bundle de cada implementación conservando sus opciones y pinta las capas del mapa.
 */
const DIST = '/src/plugins/layerswitcher/dist';
const IMPLEMENTATIONS = [
  {
    id: 'OL',
    type: 'ol',
    title: 'OpenLayers',
    js: '/dist/js/apiidee.ol.min.js',
    css: '/dist/assets/css/apiidee.ol.min.css',
    plugins: {
      layerswitcher: { js: `${DIST}/layerswitcher.ol.min.js`, css: `${DIST}/layerswitcher.ol.min.css` },
    },
  },
  {
    id: 'CS',
    type: 'cesium',
    title: 'Cesium',
    js: '/dist/js/apiidee.cesium.min.js',
    css: '/dist/assets/css/apiidee.cesium.min.css',
    plugins: {
      layerswitcher: { js: `${DIST}/layerswitcher.cesium.min.js`, css: `${DIST}/layerswitcher.cesium.min.css` },
    },
  },
];

test.describe.configure({ timeout: 180000 });

/** Estado del plugin en el mapa actual. */
const pluginState = (page) => page.evaluate(() => {
  const plugin = window.mapjs.getPlugins().find((p) => p.name === 'layerswitcher');
  return {
    implementation: window.mapjs.getImplementation(),
    modeSelectLayers: plugin && plugin.options.modeSelectLayers,
  };
});

test('Layerswitcher: conserva el plugin y sus opciones al pasar a 3D y volver a 2D', async ({ page }) => {
  await mockTiles(page);
  await openMap(page, 'ol', { modeSelectLayers: 'radio' });
  await addSampleLayers(page);
  await page.evaluate((implementations) => {
    IDEE.config('implementationswitcher', implementations);
    window.changes = 0;
    window.addEventListener('idee:implementationchange', ({ detail }) => {
      window.mapjs = detail.map;
      window.changes += 1;
    });
    window.mapjs.addControls(new IDEE.control.ImplementationSwitcher({ collapsed: false }));
  }, IMPLEMENTATIONS);
  await expect(layerRow(page, 'puntos')).toHaveCount(1, { timeout: TIMEOUT.ol });

  const select = page.locator('select#m-implementationswitcher-select');
  await select.selectOption({ index: 1 });
  await expect.poll(() => page.evaluate(() => window.changes), { timeout: 60000 }).toBe(1);
  expect(await pluginState(page)).toEqual({ implementation: 'cesium', modeSelectLayers: 'radio' });
  await expect(layerRow(page, 'puntos')).toHaveCount(1, { timeout: TIMEOUT.cesium });
  await expect(layerRow(page, 'teselas').locator('input[data-select-type="radio"]'))
    .toHaveCount(1, { timeout: TIMEOUT.cesium });

  await select.selectOption({ index: 0 });
  await expect.poll(() => page.evaluate(() => window.changes), { timeout: 60000 }).toBe(2);
  expect(await pluginState(page)).toEqual({ implementation: 'ol', modeSelectLayers: 'radio' });
  await expect(layerRow(page, 'puntos')).toHaveCount(1, { timeout: TIMEOUT.ol });
  await expect(layerRow(page, 'teselas').locator('input[data-select-type="radio"]'))
    .toHaveCount(1, { timeout: TIMEOUT.ol });
});
