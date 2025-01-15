import IGNSearchLocator from 'facade/ignsearchlocator';

// M.language.setLang('en');

const map = M.map({
  container: 'mapjs',
  controls: ['scale'],
});

const mp = new IGNSearchLocator({
  servicesToSearch: 'gn',
  searchPosition: 'geocoder,nomenclator',
  maxResults: 10,
  collapsed: true,
  collapsible: true,
  position: 'TL',
  reverse: false,
  cadastre: false,
  searchCoordinatesXYZ: false,
  locationID: 'ES.IGN.NGBE.2805347',
  requestStreet: 'https://www.cartociudad.es/geocoder/api/geocoder/findJsonp?q=Sevilla&type=provincia&tip_via=null&id=41&portal=null&extension=null',
  // geocoderCoords: [-5.741757, 41.512058]
  // urlCandidates: 'http://visores-cnig-gestion-publico.desarrollo.guadaltel.es/geocoder/api/geocoder/candidatesJsonp',
  // urlFind: 'http://visores-cnig-gestion-publico.desarrollo.guadaltel.es/geocoder/api/geocoder/findJsonp',
  // urlReverse: 'http://visores-cnig-gestion-publico.desarrollo.guadaltel.es/geocoder/api/geocoder/reverseGeocode',
  // urlCandidates: 'http://servicios-de-busqueda-publico.desarrollo.guadaltel.es/geocoder/api/geocoder/candidatesJsonp',
  // urlFind: 'http://servicios-de-busqueda-publico.desarrollo.guadaltel.es/geocoder/api/geocoder/findJsonp',
  // urlReverse: 'http://servicios-de-busqueda-publico.desarrollo.guadaltel.es/geocoder/api/geocoder/reverseGeocode',
});

// map.removeControls('panzoom');

map.addPlugin(mp);

window.map = map;
