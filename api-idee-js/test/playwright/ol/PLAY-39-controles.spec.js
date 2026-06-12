import { test, expect } from '@playwright/test';

test('Probamos añadir controles desde API', async ({ page }) => {
  await page.goto('/test/playwright/ol/basic-ol.html');

  await page.evaluate(() => {
    const mapjs = IDEE.map({
      container: 'map',
    });
    window.mapjs = mapjs;
  });

  // Hacer petición a la API para obtener los controles
  const response = await page.evaluate(async () => {
    const res = await fetch(`${IDEE.config.API_IDEE_URL}api/actions/controls`);
    return await res.json();
  });

  // Añadir los controles al mapa
  await page.evaluate((controls) => {
    window.mapjs.addControls(controls);
  }, response);

  // Verificar que el número de controles coincide con el array de la petición
  const controlsLength = await page.evaluate(() => {
    return window.mapjs.getControls().length;
  });

  expect(controlsLength).toBe(response.length);
});
