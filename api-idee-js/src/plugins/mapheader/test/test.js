import Mapheader from 'facade/mapheader';

// IDEE.language.setLang('en');
IDEE.language.setLang('es');

const map = IDEE.map({
  container: 'mapjs',
});

map.addControls(['scaleline', 'panzoombar']);

window.map = map;

// Configuración de ejemplo para API-IDEE
const config = {
  open: false,
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
      <div class="col-12 colorVerdeClaro   txtCenter  ">Organismo Autónomo Centro Nacional de Información Geográfica</div>      </div>
  </div>
</div>  
</div>  
</header>
  `,
  cssList: [
    'https://centrodedescargas.cnig.es/CentroDescargas/css/estilos-css-cnig-2024.css',
  ],
};

const mp = new Mapheader(config);

map.addPlugin(mp);

map.addPlugin(new IDEE.plugin.Layerswitcher({}));

map.addPlugin(new IDEE.plugin.Help({}));
