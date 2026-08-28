import { test, expect } from '@playwright/test';

test('Test Mapheader', async ({ page }) => {
  await page.goto('/src/plugins/mapheader/test/playwright/ol/mapheader-ol.html');
  await page.evaluate(() => {
    const config = {
      open: true,
      htmlCode: `
    <header>
    <div id="header-pc">
      <div class="col-12">
        <div class="col-3 marginTop20px">
          <a href="https://www.ign.es" target="_blank" title="Instituto Geográfico Nacional y O. A. Centro Nacional de Información Geográfica">
          <img src="https://centrodedescargas.cnig.es/CentroDescargas/imgCdD/escudoInstitucional.png" alt="Instituto Geográfico Nacional y O. A. Centro Nacional de Información Geográfica" class="img-fluid imgMinisterio "></a>
        </div>
        <div class="col-6 col-m-12 marginTop20px">
          <div class="col-12 txtCenter"><a href="https://centrodedescargas.cnig.es/CentroDescargas/home" class="txtSupCdDCabenlace" title="Centro de Descargas">Centro de Descargas</a></div>
          <div class="marginTop10px col-12 colorVerdeClaro   txtCenter paddingBottom10px ">Instituto Geográfico Nacional</div>
          <div class="col-12 colorVerdeClaro   txtCenter  ">Organismo Autónomo Centro Nacional de Información Geográfica</div>
        </div>
      </div>
    </div>  
    </div>  
    
      
    </header>
      `,
      cssList: [
        'https://centrodedescargas.cnig.es/CentroDescargas/css/estilos-css-cnig-2024.css',
      ],
    };

    window.mapjs = IDEE.map({
      container: 'mapjs',
    });
    window.mp = new IDEE.plugin.Mapheader(config);
    window.mapjs.addPlugin(window.mp);
  });
  
  const nPlugins = await page.evaluate(() => window.mapjs.getPlugins().length);
  expect(nPlugins).toBe(1);
});
