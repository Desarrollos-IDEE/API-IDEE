import { test, expect } from '@playwright/test';

test('Test sharemap', async ({ page }) => {
  await page.goto('/src/plugins/sharemap/test/playwright/ol/sharemap-ol.html');
  await page.evaluate(() => {
    window.mapjs = IDEE.map({
      container: 'mapjs',
    });
    window.mp = new IDEE.plugin.ShareMap({
      baseUrl: 'https://componentes.idee.es/api-idee/',
      urlAPI: true, // Controla si baseUrl se tiene que usar o si se usa la URL actual.
      minimize: false, // Solo se usa si "urlAPI" esta puesto a true, cambia el formato de URL o HTML a copiar.
      shareLayer: true, // Solo se usa si "urlAPI" es false, incluye los layers presentes en URL o HTML si esta puesto a true
      filterLayers: [], // ['cosas1_poligono'], // Solo se usa si "shareLayer" es false o undefined, aplica filtro de layers para incluir solo los nombrados aquí en URL o HTML.
      overwriteStyles: true, // Controla si se aplica o no el estilo aportado en "styles".
      styles: {
        primaryColor: '#d39571', // Color del botón de abrir panel, la caja y sus botones internos.
        secondaryColor: '#fff', // Color de imagen dentro de botón de abrir panel y background del panel abierto
      },
      order: 1,
    });
    window.mapjs.addPlugin(window.mp);
  });
  
  const nPlugins = await page.evaluate(() => window.mapjs.getPlugins().length);
  expect(nPlugins).toBe(1);
});
