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

test('Probamos añadir controles y plugins desde API 2.0', async ({ page }) => {
  // La API REST (controles, plugins y sus ficheros) se simula: el servidor de pruebas no la tiene
  await mockRest(page);
  await page.goto('/test/playwright/ol/basic-ol.html');

  await page.evaluate(() => {
    window.mapjs = IDEE.map({
      container: 'map',
    });
  });

  // Hacer petición a la API para obtener los controles
  const apiAvailableControls = await page.evaluate(async () => {
    const res = await fetch(`${IDEE.config.API_IDEE_URL}api/actions/controls`);
    return res.json();
  });

  // Añadir los controles al mapa
  await page.evaluate((controlNames) => {
    window.mapjs.addControls(controlNames);
  }, apiAvailableControls);

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
    await page.evaluate((constructorStr) => {
      window.mapjs.addPlugin(eval(`new ${constructorStr}()`));
    }, pluginInfo.constructor);
  }

  // Verificar que todos los controles están en el mapa y no están repetidos
  const isControlListCorrect = await page.evaluate((controlNames) => {
    return controlNames.every(
      (name) => window.mapjs.getControls()
        .filter((c) => c.constructor.NAME === name).length === 1,
    );
  }, apiAvailableControls);

  // Verificar que todos los plugins están en el mapa y no están repetidos
  const isPluginListCorrect = await page.evaluate((pluginNames) => {
    return pluginNames.every(
      (name) => window.mapjs.getPlugins(name).length === 1,
    );
  }, pluginInfoList.map((p) => p.name));

  expect(isControlListCorrect).toBe(true);
  expect(isPluginListCorrect).toBe(true);
});
