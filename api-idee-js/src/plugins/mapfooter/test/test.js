import Mapfooter from 'facade/mapfooter';

// IDEE.language.setLang('en');
IDEE.language.setLang('es');

const ortofoto2016_color = new IDEE.layer.WMS({
  url: 'http://www.ideandalucia.es/wms/ortofoto2016?',
  name: 'ortofotografia_2016_rgb',
  legend: 'Ortofotografía Color 0,5 metros/pixel (Año 2016)',
  isBase: true,
  tiled: true,
}, {
  styles: 'default',
});

const pnoa = new IDEE.layer.WMS({
  url: 'https://www.ign.es/wms-inspire/pnoa-ma?',
  name: 'OI.OrthoimageCoverage',
  legend: 'PNOA',
  isBase: true,
  tiled: true,
}, {
  styles: 'default',
});

const map = IDEE.map({
  container: 'mapjs',
  // layers:[pnoa],
  // maxExtent: [100401, 3987100, 621273, 4288700],
});

map.addControls(['scaleline', 'panzoombar']);

const configAyuntamientoSevilla = {
  open: true,
  htmlCode: `<div class="col-12 col-m-12 displayInlineBlock txtCenter fontSize09em">
                <p class="marginBottom0">© Organismo Autónomo Centro Nacional de Información Geográfica (CNIG)</p>
                <div id="dirCnigPC" class="row paddingBottom1por">
                    <div class="col-12">
                    Calle General Ibáñez de Ibero, 3. 28003 - Madrid - España.   
                    </div>
                    <div class="col-12">
                        NIF: ES Q2817024I  - NIPO: 798-20-071-1 - DOI: 10.7419/162.09.2020
                    </div>
                </div>
                <div id="dirCnigMobile" class="row paddingBottom2por" style="display: none;">
                    <div class="col-12">
                        Calle General Ibáñez de Ibero, 3. 28003 - Madrid - España. 
                    </div>
                    <div class="col-12">
                        NIF: ES Q2817024I 
                    </div>
                    <div class="col-12">
                        NIPO: 798-20-071-1
                    </div>
                    <div class="col-12">
                        DOI: 10.7419/162.09.2020
                    </div>
                </div>
              </div>`,
  cssList: [
    'https://centrodedescargas.cnig.es/CentroDescargas/css/estilos-css-cnig-2024.css',
  ],
};

const mp = new Mapfooter(configAyuntamientoSevilla);

map.addPlugin(mp);

window.map = map;

map.addPlugin(new IDEE.plugin.Help({}));
