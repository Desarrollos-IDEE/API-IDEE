import { map as Mmap, proxy } from 'IDEE/api-idee';
import WMC from 'IDEE/layer/WMC';
import WMS from 'IDEE/layer/WMS';
import { ADDED_WMC, CHANGE_WMC } from 'IDEE/event/eventtype';

// proxy(true);
// IDEE.config('PROXY_URL', 'https://mapea4-sigc.juntadeandalucia.es/mapea/api/proxy');

const wms = new WMS({
  url: 'https://www.ign.es/wms-inspire/unidades-administrativas?',
  name: 'AU.AdministrativeBoundary',
  legend: 'Limite administrativo',
});

const mapa = Mmap({
  container: 'map',
  // projection: 'EPSG:3857*m',
  projection: 'EPSG:25830*m',
  layers: [wms],
  // wmc: ['WMC*https://componentes.idee.es/estaticos/Datos/WMC/satelite.xml*Satelite', 'WMC*https://componentes.idee.es/estaticos/Datos/WMC/wmc_grupos.xml*Secciones'],
  // wmcfiles: ['WMC*https://componentes.idee.es/estaticos/Datos/WMC/wmc_grupos.xml*Secciones'],
});
window.mapa = mapa;

mapa.on(ADDED_WMC, (capa) => {
  console.log('ADDED_WMC');
  console.log(capa);
});

mapa.on(CHANGE_WMC, (capa) => {
  console.log('CHANGE_WMC');
  console.log(capa);
});

const wmc_001 = new WMC({
  url: 'https://componentes.idee.es/estaticos/Datos/WMC/satelite.xml',
  name: 'Satelite',
  attribution: {
    name: 'WMC Satelite',
    description: 'Mi WMC 1',
    url: 'https://www.ign.es',
    contentAttributions: 'https://componentes.idee.es/estaticos/Datos/reconocimientos/WMTS_PNOA_20170220/atribucionPNOA_Url.kml',
    contentType: 'kml',
  },
  // isBase: true,
  // isBase: false,
}, {
  // displayInLayerSwitcher: true,
  displayInLayerSwitcher: false,
  // crossOrigin: 'anonymous',
  // minZoom: 10,
  // maxZoom: 10,
  // minScale: 1000000,
  // maxScale: 552000,
});
window.wmc_001 = wmc_001;
mapa.addWMC(wmc_001);

const wmc_002 = new WMC({
  url: 'https://componentes.idee.es/estaticos/Datos/WMC/mapa.xml',
  name: 'Mapa',
  // attribution: {
  //   name: 'WMC Mapa',
  //   description: 'Mi WMC 2',
  //   url: 'https://www.ign.es',
  //   contentAttributions: 'https://componentes.idee.es/estaticos/Datos/reconocimientos/WMTS_PNOA_20170220/atribucionPNOA_Url.kml',
  //   contentType: 'kml',
  // },
  // isBase: true,
  // isBase: false,
}, {
  displayInLayerSwitcher: true,
  // displayInLayerSwitcher: false,
});
window.wmc_002 = wmc_002;
// mapa.addWMC(wmc_002);

const wmc_003 = new WMC({
  url: 'https://componentes.idee.es/estaticos/Datos/WMC/wmc_grupos.xml',
  name: 'Secciones',
  attribution: {
    name: 'WMC Secciones',
    description: 'Mi WMC 3',
    url: 'https://www.ign.es',
    contentAttributions: 'https://componentes.idee.es/estaticos/Datos/reconocimientos/WMTS_PNOA_20170220/atribucionPNOA_Url.kml',
    contentType: 'kml',
  },
  // isBase: true,
  // isBase: false,
}, {
  displayInLayerSwitcher: true,
  // displayInLayerSwitcher: false,
});
window.wmc_003 = wmc_003;
// mapa.addWMC(wmc_003);
