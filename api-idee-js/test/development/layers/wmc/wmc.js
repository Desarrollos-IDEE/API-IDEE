import WMC from 'IDEE/layer/WMC';

export const wmc_001 = new WMC({
  url: 'https://componentes.idee.es/estaticos/Datos/WMC/mapa.xml',
  name: 'Mapa',
  // legend: 'WMC Mapa',
  // attribution: {
  //   name: 'WMC',
  //   description: 'Mi WMC',
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

export const wmc_002 = 'WMC*https://componentes.idee.es/estaticos/Datos/WMC/context_cdau_hibrido_25830_no_cache.xml*Hibrido';
