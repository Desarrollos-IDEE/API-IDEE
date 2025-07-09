import WMC from 'IDEE/layer/WMC';

export const wmc_001 = new WMC({
  url: 'https://componentes.idee.es/estaticos/Datos/WMC/satelite.xml',
  name: 'Satelite',
  attribution: {
    name: 'WMC Satelite',
    description: 'Contexto Satélite',
    url: 'https://www.ign.es',
    contentAttributions: 'https://componentes.idee.es/estaticos/Datos/reconocimientos/WMTS_PNOA_20170220/atribucionPNOA_Url.kml',
    contentType: 'kml',
  },
}, {
  displayInLayerSwitcher: true,
  // displayInLayerSwitcher: false,
});

export const wmc_002 = 'WMC*https://componentes.idee.es/estaticos/Datos/WMC/wmc_grupos.xml*Secciones';
