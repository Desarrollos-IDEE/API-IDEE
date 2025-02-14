/* eslint-disable max-len */
import OverviewMap from 'facade/overviewmap';

M.language.setLang('es');
// M.language.setLang('en');

const map = M.map({
  center: [-467062.8225, 4783459.6216],
  container: 'mapjs',
  layers: ['WMTS*http://www.ign.es/wmts/ign-base?*IGNBaseTodo*GoogleMapsCompatible*Mapa IGN*false*image/jpeg*false*false*true'],
  zoom: 5,
});
window.map = map;

const mp = new OverviewMap({
  position: 'BR', // TL | TR | BL | BR
  collapsed: false,
  collapsible: true,
  fixed: true,
  zoom: 4,
  baseLayer: 'WMTS*http://www.ign.es/wmts/ign-base?*IGNBaseTodo*GoogleMapsCompatible*Mapa IGN*false*image/jpeg*false*false*true',
  // baseLayer: 'WMS*PNOA 2017*https://www.ign.es/wms/pnoa-historico?*PNOA2017*true*true',
  // tooltip: 'OverviewMap tooltip TEST',
  // order: 1,

  // Parámetros internos
  // toggleDelay: 1000, // default 1000, Responsable de setTimeout implementado al abrir/cerrar del panel
  // collapsedButtonClass: 'overviewmap-mundo', // default 'overviewmap-mundo', Determina la clase que añade el icono del panel, si no existe termina vacío
  // openedButtonClass: 'g-cartografia-flecha-derecha', // default 'g-cartografia-flecha-derecha' o 'g-cartografia-flecha-izquierda' depende de "position", es la clase que aplica el icono de cerrado, con su posición y borde apropiados
});

map.addPlugin(mp); window.mp = mp;
