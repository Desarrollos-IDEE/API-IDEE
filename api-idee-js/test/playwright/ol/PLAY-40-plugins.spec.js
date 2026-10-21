import { test, expect } from '@playwright/test';
import { mockRest } from '../common/rest';

const REFACTOR_PLUGINS = [
  'vectormanagement',
  'incicarto',
  'printviewmanagement',
  'infocoordinates',
  'selectionzoom',
  'modal',
  'comparators',
  'contactlink',
  'storymap',
  'mousesrs',
  'locatorscn',
  'sharemap',
  'backimglayer',
  'viewmanagement',
  'basic',
  'locator',
  'layerswitcher',
  'stylemanager',
];

test('Probamos añadir plugins desde API 2.0', async ({ page }) => {
  // La API REST (controles, plugins y sus ficheros) se simula: el servidor de pruebas no la tiene
  await mockRest(page);
  await page.goto('/test/playwright/ol/basic-ol.html');

  await page.evaluate(() => {
    window.mapjs = IDEE.map({
      container: 'map',
    });
  });

  // Hacer petición a la API para obtener los plugins filtrados con su info
  const pluginInfoList = await page.evaluate(async (refactorPlugins) => {
    const res = await fetch(`${IDEE.config.API_IDEE_URL}api/actions/plugins`);
    const allPlugins = await res.json();
    const filtered = allPlugins.filter((name) => refactorPlugins.includes(name));
    return Promise.all(filtered.map(async (name) => {
      const apiRes = await fetch(`${IDEE.config.API_IDEE_URL}plugins/${name}/api.json`);
      const apiJson = await apiRes.json();
      return {
        name,
        constructor: apiJson.constructor,
        scriptUrl: `${IDEE.config.API_IDEE_URL}plugins/${name}/${apiJson.files.ol.scripts[0]}`,
      };
    }));
  }, REFACTOR_PLUGINS);

  // Añadir los plugins al mapa
  for (const pluginInfo of pluginInfoList) {
    await page.addScriptTag({ url: pluginInfo.scriptUrl });
    const addResult = await page.evaluate((constructorStr) => {
      window.mapjs.addPlugin(eval(`new ${constructorStr}()`));
    }, pluginInfo.constructor);
  }

  // Verificar que todos los plugins cargados están en el mapa y no están repetidos
  const pluginResults = await page.evaluate((pluginNames) => {
    return pluginNames.map((name) => ({
      name,
      count: window.mapjs.getPlugins(name).length,
    }));
  }, pluginInfoList.map((p) => p.name));

  const isPluginListCorrect = pluginResults.every(({ count }) => count === 1);
  expect(isPluginListCorrect).toBe(true);
});
