import WMC from 'IDEE/layer/WMC';

export const wmc_001 = new WMC({
  url: 'https://componentes.idee.es/estaticos/Datos/WMC/satelite.xml',
  name: 'Satelite',
}, {
  displayInLayerSwitcher: true,
  // displayInLayerSwitcher: false,
});

export const wmc_002 = 'WMC*https://componentes.idee.es/estaticos/Datos/WMC/wmc_grupos.xml*Secciones';
