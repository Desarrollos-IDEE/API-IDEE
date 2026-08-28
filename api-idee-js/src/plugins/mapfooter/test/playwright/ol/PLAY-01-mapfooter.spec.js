import { test, expect } from '@playwright/test';

test('Test Mapfooter', async ({ page }) => {
  await page.goto('/src/plugins/mapfooter/test/playwright/ol/mapfooter-ol.html');
  await page.evaluate(() => {
    const configAyuntamientoSevilla = {
      open: true,
      htmlCode: '<footer id="portal-footer-wrapper" class="text-white"> <div class="container" id="portal-footer"> <div class=" portalFooter__row"> <div id="footer-newsletter" class=""> </div> <div class="row bb-1-white bt-1-white border-semi py-4"> <div class="groupActionsRRSS col-xs-12 col-sm-12 hidden-print"> <div id="footer-actions" class=" mb-4 mb-md-0"><nav id="site-actions" class="footerMenu text-center"> <ul id="portal-site_actions" class="list-unstyled text-left h4-size mb-md-0"> <li> <a class="text-white" href="https://www.sevilla.org/"><span>Inicio</span></a> </li> <li> <a class="text-white" href="https://www.sevilla.org/declaracion-de-accesibilidad"><span>Accesibilidad</span></a> </li> <li> <a class="text-white" href="https://www.sevilla.org/sitemap"><span>Mapa Web</span></a> </li> <li> <a class="text-white" href="https://www.sevilla.org/aviso-legal"><span>Aviso legal</span></a> </li> <li> <a class="text-white" href="https://www.sevilla.org/politica-de-privacidad"><span>Polí­tica de privacidad</span></a> </li> </ul> </nav></div> <section id="footer-contact" class=" px-3 mb-4 mb-md-0 ml-md-3"> <h2 class="my-md-0 text-regular mr-2 h4-size">Redes Sociales:</h2> <div id="social-icons"> <ul class="list-unstyled mb-0"> <li class="visible-inline-block ml-1"> <a class="rounded-icon" target="_blank" rel="noopener" href="https://es-es.facebook.com/AyuntamientodeSevilla/" title="Facebook"> <span aria-hidden="true" class="picto-facebook"></span> <span class="sr-only">Facebook</span> </a> </li> <li class="visible-inline-block ml-1"> <a class="rounded-icon" target="_blank" rel="noopener" href="https://twitter.com/ayto_sevilla" title="Twitter"> <span aria-hidden="true" class="picto-twitter"></span> <span class="sr-only">Twitter</span> </a> </li> <li class="visible-inline-block ml-1"> <a class="rounded-icon" target="_blank" rel="noopener" href="https://www.instagraIDEE.com/ayto_sevilla" title="Instagram"> <span aria-hidden="true" class="picto-instagram"></span> <span class="sr-only">Instagram</span> </a> </li> <li class="visible-inline-block ml-1"> <a class="rounded-icon" target="_blank" rel="noopener" href="https://www.youtube.com/user/AyuntamientoSevilla" title="YouTube"> <span class="picto-youtube-play" aria-hidden="true"></span> <span class="sr-only">YouTube</span> </a> </li> </ul></div> </section> </div> </div> </div> </div> <div id="portal-contact" class="mt-4"> <div class="container"> <div class="row"> <div class="col-xs-12 col-sm-12"> <p id="contactInfo" class=" text-center">Ayuntamiento de Sevilla. Plaza Nueva, 1 - C.P. 41001 | Teléfono <a class="text-white" href="tel:+34010">010</a> - <a class="text-white" href="tel:+34955010010">955 010 010</a> <!-- | <a class="text-white" href="mailto:webmaster@sevilla.org">webmaster@sevilla.org</a>--></p> <p class="text-center small opacity-66 mb-5 mb-sm-3">Proyecto desarrollado por <a class="text-white" target="_blank" href="https://www.semic.es/" rel="noopener">SEMIC</a> - <a class="text-white" href="https://www.ecityclic.com/es" target="_blank" rel="noopener">eCityclic</a></p> </div> </div> </div> </div> <div id="portal-footer-default" class="container"> <div class="row"><div class="col-xs-12"></div></div> </div> </footer>',
      cssList: [
        'https://www.sevilla.org/++theme++aysevilla/styles/build/plonetheme.aysevilla.min.css'
      ]
    }

    window.mapjs = IDEE.map({
      container: 'mapjs',
    });
    window.mp = new IDEE.plugin.Mapfooter(configAyuntamientoSevilla);
    window.mapjs.addPlugin(window.mp);
  });
  
  const nPlugins = await page.evaluate(() => window.mapjs.getPlugins().length);
  expect(nPlugins).toBe(1);
});