import { map as Mmap } from 'IDEE/api-idee';
import WMC from 'IDEE/layer/WMC';
import WMS from 'IDEE/layer/WMS';

// const wms = new WMS({
//   url: 'https://www.ign.es/wms-inspire/unidades-administrativas?',
//   name: 'AU.AdministrativeBoundary',
//   legend: 'Limite administrativo',
// });

const mapa = Mmap({
  container: 'map',
  projection: 'EPSG:3857*m',
  // layers: [wms],
  // center: [-527439.7561017586, 4554984.900936406],
  // zoom: 9,
});

window.mapa = mapa;

/*
const wmc_001 = new WMC({
  url: 'https://componentes.idee.es/estaticos/Datos/WMC/satelite.xml',
  name: 'Híbrido',
  // legend: 'WMC Híbrido',
  // attribution: {
  //   name: 'WMC Híbrido',
  //   description: 'Mi WMC 1',
  //   url: 'https://www.ign.es',
  //   contentAttributions: 'https://componentes.idee.es/estaticos/Datos/reconocimientos/WMTS_PNOA_20170220/atribucionPNOA_Url.kml',
  //   contentType: 'kml',
  // },
  // maxExtent: [-696749.1338901073, 4436871.445496557, -498650.1083945522, 4534524.886326315],
  // visibility: false,
  // isBase: true,
}, {
  displayInLayerSwitcher: true,
  // displayInLayerSwitcher: false,
  // crossOrigin: 'anonymous',
  // minZoom: 10,
  // maxZoom: 10,
  // opacity: 0.3,
  // minScale: 1000000,
  // maxScale: 552000,
});

// mapa.addWMC(wmc_001);

const wmc_002 = new WMC({
  url: 'https://componentes.idee.es/estaticos/Datos/WMC/ortofoto2011cache.xml',
  name: 'Mapa',
  // legend: 'WMC Mapa',
  // attribution: {
  //   name: 'WMC Mapa',
  //   description: 'Mi WMC 2',
  //   url: 'https://www.ign.es',
  //   contentAttributions: 'https://componentes.idee.es/estaticos/Datos/reconocimientos/WMTS_PNOA_20170220/atribucionPNOA_Url.kml',
  //   contentType: 'kml',
  // },
  // maxExtent: [-696749.1338901073, 4436871.445496557, -498650.1083945522, 4534524.886326315],
  // visibility: false,
  // isBase: true,
}, {
  displayInLayerSwitcher: true,
  // displayInLayerSwitcher: false,
  // crossOrigin: 'anonymous',
  // minZoom: 10,
  // maxZoom: 10,
  // opacity: 0.3,
  // minScale: 1000000,
  // maxScale: 552000,
});

// mapa.addWMC(wmc_002);
*/