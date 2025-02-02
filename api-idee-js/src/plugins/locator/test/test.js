import Locator from 'facade/locator';

IDEE.language.setLang('es');
// IDEE.language.setLang('en');

IDEE.proxy(false);

const map = IDEE.map({
  container: 'mapjs',
  zoom: 5,
  maxZoom: 20,
  minZoom: 4,
  center: [-467062.8225, 4783459.6216],
});
window.map = map;

const mp = new Locator({
  useProxy: false,
  byPlaceAddressPostal: {
    // maxResults: 5,
    // noProcess: 'poblacion', // 'municipio' | 'poblacion' | 'toponimo' | 'callejero' | 'municipio,poblacion' | 'municipio,provincia,comunidad%20autonoma,poblacion,toponimo,expendeduria,ngbe,callejero,carretera,portal' | etc
    countryCode: 'es',
    reverse: true, // Añadir o no la opción de escoger punto del mapa en el buscado
    resultVisibility: true,
    // urlCandidates: 'http://www.cartociudad.es/geocoder/api/geocoder/candidatesJsonp',
    // urlFind: 'http://www.cartociudad.es/geocoder/api/geocoder/findJsonp',
    urlReverse: 'http://www.cartociudad.es/geocoder/api/geocoder/reverseGeocode',
    // geocoderCoords: [-5.741757, 41.512058], // Muestra popup con información de este punto, desaparece instantáneamente si esta "requestStreet" puesto.
    // requestStreet: 'https://www.cartociudad.es/geocoder/api/geocoder/findJsonp?q=Sevilla&type=provincia&tip_via=null&id=41&portal=null&extension=null',
  },
  byParcelCadastre: true,
  byCoordinates: true,
});

map.addPlugin(mp);
window.mp = mp;

map.addPlugin(new IDEE.plugin.Vectors({ position: 'TL' }));
map.addPlugin(new IDEE.plugin.Layerswitcher({ position: 'TR' }));


mp.on("infocatastro:locationCentered", (data) => {
  window.alert(`zoom: ${data.zoom}
  center: ${data.center[0].toFixed(2)}, ${data.center[1].toFixed(2)}`);
});

mp.on("xylocator:locationCentered", (data) => {
  window.alert(`zoom: ${data.zoom}
  center: ${data.center[0].toFixed(2)}, ${data.center[1].toFixed(2)}`);
  console.log(data);
});

mp.on("ignsearchlocator:entityFound", (extent) => {
  // eslint-disable-next-line no-alert
  window.alert("Encontrado");
});

