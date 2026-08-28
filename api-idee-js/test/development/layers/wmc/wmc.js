import WMC from 'IDEE/layer/WMC';

export const wmc_001 = new WMC({
  url: `${IDEE.config.STATIC_RESOURCES_URL}/Datos/WMC/satelite.xml`,
  name: 'Satelite',
  attribution: {
    name: 'WMC Satelite',
    description: 'Contexto Satélite',
    url: 'https://www.ign.es',
    contentAttributions: `${IDEE.config.STATIC_RESOURCES_URL}/Datos/reconocimientos/WMTS_PNOA_20170220/atribucionPNOA_Url.kml`,
    contentType: 'kml',
  },
}, {
  displayInLayerSwitcher: true,
  // displayInLayerSwitcher: false,
});

export const wmc_002 = `WMC*${IDEE.config.STATIC_RESOURCES_URL}/Datos/WMC/wmc_grupos.xml*Secciones`;
