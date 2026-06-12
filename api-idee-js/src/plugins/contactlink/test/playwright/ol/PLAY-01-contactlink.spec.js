import { test, expect } from '@playwright/test';

test('Test contactlink', async ({ page }) => {
  await page.goto('/src/plugins/contactlink/test/playwright/ol/contactlink-ol.html');
  await page.evaluate(() => {
    window.mapjs = IDEE.map({
      container: 'mapjs',
    });
    window.mp = new IDEE.plugin.ContactLink({
      position: 'BL', // TR, BR, TL, BL
      collapsed: false,
      collapsible: false, // false, 
      descargascnig: 'http://centrodedescargas.cnig.es/CentroDescargas/index.jsp',
      pnoa: 'https://www.ign.es/web/comparador_pnoa/index.html',
      visualizador3d: 'https://visualizadores.ign.es/estereoscopico/',
      fototeca: 'https://fototeca.cnig.es/',
      twitter: 'https://twitter.com/IGNSpain', 
      instagram: 'https://www.instagram.com/ignspain/',
      facebook: 'https://www.facebook.com/IGNSpain/',
      pinterest: 'https://www.pinterest.es/IGNSpain/',
      youtube: 'https://www.youtube.com/user/IGNSpain',
      mail: 'mailto:consulta@cnig.es',
      tooltip: 'Contacta con nosotros',
      // order: 1, //
    });
    window.mapjs.addPlugin(window.mp);
  });
  
  const nPlugins = await page.evaluate(() => window.mapjs.getPlugins().length);
  expect(nPlugins).toBe(1);
});
