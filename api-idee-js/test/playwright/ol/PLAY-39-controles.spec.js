/* eslint-disable no-console */
import { test, expect } from '@playwright/test';
import { mockRest } from '../common/rest';

test('Probamos añadir controles desde API 2.0', async ({ page }) => {
  // La API REST (controles, plugins y sus ficheros) se simula: el servidor de pruebas no la tiene
  await mockRest(page);
  await page.goto('/test/playwright/ol/basic-ol.html');

  await page.evaluate(() => {
    const mapjs = IDEE.map({
      container: 'map',
    });
    window.mapjs = mapjs;
  });

  // Hacer petición a la API para obtener los controles
  const apiAvaliableControls = await page.evaluate(async () => {
    const res = await fetch(`${IDEE.config.API_IDEE_URL}api/actions/controls`);
    return await res.json();
  });

  // Añadir los controles al mapa
  await page.evaluate((controlNames) => {
    window.mapjs.addControls(controlNames);
  }, apiAvaliableControls);

  // Verificar que todos los controles cargados están ahora en el mapa y no están repetidos.
  const isControlListCorrect = await page.evaluate((controlNames) => {
    return controlNames.every(
      (controlName) => window.mapjs.getControls()
        .filter((mapControl) => mapControl.constructor.NAME === controlName).length === 1,
    );
  }, apiAvaliableControls);

  expect(isControlListCorrect).toBe(true);
});
