import { map as Mmap } from 'IDEE/api-idee';

const mapjs = Mmap({
  container: 'map',
  controls: ['scale*1'],
});
window.mapjs = mapjs;

mapjs.addLayers([
  'WMS*Municipios*http://www.ideandalucia.es/wms/dea100_divisiones_administrativas?*terminos_municipales*true*true,WMS*Mapa*http://www.ideandalucia.es/services/andalucia/wms?*00_Mapa_Andalucia*true*false',
]);
