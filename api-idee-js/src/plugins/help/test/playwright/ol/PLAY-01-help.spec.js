import { test, expect } from '@playwright/test';

test('Test Help', async ({ page }) => {
  await page.goto('/src/plugins/help/test/playwright/ol/help-ol.html');

  await page.waitForFunction(() => typeof IDEE !== 'undefined' && IDEE.plugin && IDEE.plugin.Help);

  await page.evaluate(() => {
    window.mapjs = IDEE.map({
      container: 'mapjs',
    });
    window.mp = new IDEE.plugin.Help({
      position: 'right',
      order: 0,
      tooltip: 'Obtener ayuda',
      extendInitialExtraContents: true,
      header: {
        images: [
          'https://www.ign.es/iberpix/static/media/logo.72e2e78b.png',
        ],
        title: 'Título definido por el usuario',
      },
      initialExtraContents: [
        {
          title: 'Apartado 1',
          content: '<div><h2 style="text-align: center; color: #fff; background-color: #364b5f; padding: 8px 10px;">Mi primer apartado</h2><div><p>Contenido extra definido por el usuario</p></div></div>',
        },
      ],
      finalExtraContents: [
        {
          title: 'Apartado final',
          content: '<div><h2 style="text-align: center; color: #fff; background-color: #364b5f; padding: 8px 10px;">Apartado final</h2><div><p>Contenido extra definido por el usuario</p></div></div>',
        },
      ],
    });
    window.mapjs.addPlugin(window.mp);
  });

  // Help crea el botón tras la petición async de controles
  await page.waitForFunction(() => window.mp && window.mp.button, null, { timeout: 15000 });

  const nPlugins = await page.evaluate(() => window.mapjs.getPlugins().length);
  expect(nPlugins).toBe(1);

  const hasButton = await page.evaluate(() => Boolean(window.mp.button));
  expect(hasButton).toBeTruthy();

  const headerTitle = await page.evaluate(() => window.mp.headerTitle);
  expect(headerTitle).toBe('Título definido por el usuario');

  const headerImages = await page.evaluate(() => window.mp.headerImages);
  expect(headerImages.length).toBe(1);
});
