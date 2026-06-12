import { test, expect } from '@playwright/test';

test('Test locatorscn', async ({ page }) => {
  await page.goto('/src/plugins/locatorscn/test/playwright/ol/locatorscn-ol.html');
  await page.evaluate(() => {
    window.mapjs = IDEE.map({
      container: 'mapjs',
    });
    window.mp = new IDEE.plugin.Locatorscn({
      collapsible: true,
      collapsed: true,
      isDraggable: true,
      position: 'TC', // TL | TR | BL | BR | TC
      tooltip: 'EJEMPLO DE TOOLTIP',
      zoom: 16,
      pointStyle: 'pinRojo', // 'pinAzul'|'pinRojo'|'pinMorado' Otros string causan que sea estilo deafult de API_IGN.
      //
      searchOptions: { // https://gzllpz.github.io/prueba2/api/informacion_general/
        reverse: true, // Activa la opcion de escoger punto
        resultVisibility: true, // Permite generado de features de la busqueda
        addendum: 'iderioja',
        size: 15,
        layers: 'address,street,venue',
        radius: 200,
        urlAutocomplete: 'https://geocoder.larioja.org/v1/autocomplete', // Search with text input // https://gzllpz.github.io/prueba2/api/autocompletar/#filtros
        urlReverse: 'https://geocoder.larioja.org/v1/reverse', // Search with Coordinate // https://gzllpz.github.io/prueba2/api/geocodificacion_inversa/
        sources: '', // 'cnig' | 'dgcat' | 'ieca' | 'ign' | 'cnig,ign' | etc (default is all) // cnig	Centro Nacional de Información Geográfica (CNIG) // dgcat	Dirección General del Catastro // ieca	Instituto de Estadística y Cartografía de Andalucía (IECA) // ign	Instituto Geográfico Nacional (IGN)
        peliasCoords: [-273618, 5224405], // 
      }, // */
      useProxy: true,
      order: 1,
    });
    window.mapjs.addPlugin(window.mp);
  });
  
  const nPlugins = await page.evaluate(() => window.mapjs.getPlugins().length);
  expect(nPlugins).toBe(1);
});
