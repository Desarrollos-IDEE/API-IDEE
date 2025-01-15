/* eslint-disable max-len */
import ShareMap from 'facade/sharemap';

const map = M.map({
  container: 'mapjs',
  controls: ['scale*true', 'location', 'backgroundlayers'],
  center: [144112, 4839064],
  zoom: 7,
});
window.map = map;

// Layer para probar el URL/IFRAME con este incluido
const geoJSON = new M.layer.GeoJSON({
  name: 'cosas1_poligono',
  source: {
    type: 'FeatureCollection',
    crs: { type: 'name', properties: { name: 'urn:ogc:def:crs:OGC:1.3:CRS84' } },
    features: [
      { type: 'Feature', properties: { fecha_entero: 1950, fecha_fecha: '1950-01-01' }, geometry: { type: 'Polygon', coordinates: [[[-7.803961, 43.786743], [-9.241927, 43.167196], [-8.882436, 41.964781], [-6.590677, 41.819828], [0.584174, 40.716535], [1.632691, 41.214197], [3.010741, 41.730462], [3.205466, 42.486095], [-1.842394, 43.417953], [-1.842394, 43.417953], [-7.803961, 43.786743]]] } },
      { type: 'Feature', properties: { fecha_entero: 1955, fecha_fecha: '1955-01-01' }, geometry: { type: 'Polygon', coordinates: [[[-7.788982, 43.786743], [-9.226948, 43.167196], [-8.867457, 41.964781], [-8.70269, 41.135274], [-6.635614, 41.349271], [-2.965805, 40.739237], [0.134809, 40.180801], [1.647669, 41.214197], [3.02572, 41.730462], [3.220445, 42.486095], [-1.827415, 43.417953], [-1.827415, 43.417953], [-7.788982, 43.786743]]] } },
      { type: 'Feature', properties: { fecha_entero: 1960, fecha_fecha: '1960-01-01' }, geometry: { type: 'Polygon', coordinates: [[[-7.788982, 43.786743], [-9.226948, 43.167196], [-8.867457, 41.964781], [-8.70269, 41.135274], [-8.762605, 40.409295], [-4.224025, 40.203685], [-0.284597, 39.560014], [0.134809, 40.180801], [1.647669, 41.214197], [3.02572, 41.730462], [3.220445, 42.486095], [-1.827415, 43.417953], [-1.827415, 43.417953], [-7.788982, 43.786743]]] } },
      { type: 'Feature', properties: { fecha_entero: 1965, fecha_fecha: '1965-01-01' }, geometry: { type: 'Polygon', coordinates: [[[-7.788982, 43.786743], [-9.226948, 43.167196], [-8.867457, 41.964781], [-8.70269, 41.135274], [-9.032224, 39.663869], [-4.763262, 39.293901], [0.179746, 38.770311], [-0.284597, 39.560014], [0.134809, 40.180801], [1.647669, 41.214197], [3.02572, 41.730462], [3.220445, 42.486095], [-1.827415, 43.417953], [-1.827415, 43.417953], [-7.788982, 43.786743]]] } },
      { type: 'Feature', properties: { fecha_entero: 1970, fecha_fecha: '1970-01-01' }, geometry: { type: 'Polygon', coordinates: [[[-7.788982, 43.786743], [-9.226948, 43.167196], [-8.867457, 41.964781], [-8.70269, 41.135274], [-9.032224, 39.663869], [-9.451631, 38.781988], [-4.778241, 38.548076], [-0.778898, 37.628537], [0.179746, 38.770311], [-0.284597, 39.560014], [0.134809, 40.180801], [1.647669, 41.214197], [3.02572, 41.730462], [3.220445, 42.486095], [-1.827415, 43.417953], [-1.827415, 43.417953], [-7.788982, 43.786743]]] } },
      { type: 'Feature', properties: { fecha_entero: 1975, fecha_fecha: '1975-01-01' }, geometry: { type: 'Polygon', coordinates: [[[-7.788982, 43.786743], [-9.226948, 43.167196], [-8.867457, 41.964781], [-8.70269, 41.135274], [-9.032224, 39.663869], [-9.451631, 38.781988], [-8.777584, 38.325152], [-4.898072, 37.367093], [-2.126991, 36.733501], [-0.778898, 37.628537], [0.179746, 38.770311], [-0.284597, 39.560014], [0.134809, 40.180801], [1.647669, 41.214197], [3.02572, 41.730462], [3.220445, 42.486095], [-1.827415, 43.417953], [-1.827415, 43.417953], [-7.788982, 43.786743]]] } },
      { type: 'Feature', properties: { fecha_entero: 1980, fecha_fecha: '1980-01-01' }, geometry: { type: 'Polygon', coordinates: [[[-7.788982, 43.786743], [-9.226948, 43.167196], [-8.867457, 41.964781], [-8.70269, 41.135274], [-9.032224, 39.663869], [-9.451631, 38.781988], [-8.777584, 38.325152], [-8.95733, 37.033025], [-6.785402, 37.164442], [-4.478665, 36.685469], [-2.126991, 36.733501], [-0.778898, 37.628537], [0.179746, 38.770311], [-0.284597, 39.560014], [0.134809, 40.180801], [1.647669, 41.214197], [3.02572, 41.730462], [3.220445, 42.486095], [-1.827415, 43.417953], [-1.827415, 43.417953], [-7.788982, 43.786743]]] } },
      { type: 'Feature', properties: { fecha_entero: 1985, fecha_fecha: '1985-01-01' }, geometry: { type: 'Polygon', coordinates: [[[-7.788982, 43.786743], [-9.226948, 43.167196], [-8.867457, 41.964781], [-8.70269, 41.135274], [-9.032224, 39.663869], [-9.451631, 38.781988], [-8.777584, 38.325152], [-8.95733, 37.033025], [-6.785402, 37.164442], [-6.141313, 36.288055], [-5.826758, 35.997749], [-5.332457, 36.082533], [-4.478665, 36.685469], [-2.126991, 36.733501], [-0.778898, 37.628537], [0.179746, 38.770311], [-0.284597, 39.560014], [0.134809, 40.180801], [1.647669, 41.214197], [3.02572, 41.730462], [3.220445, 42.486095], [-1.827415, 43.417953], [-1.827415, 43.417953], [-7.788982, 43.786743]]] } },
    ],
  },
}); map.addLayers(geoJSON); // */

const mp = new ShareMap({
  position: 'BL', // 'TL' | 'TR' | 'BR' | 'BL'
  // title: 'TEST TITULO', // Texto título de compartir URL
  // copyBtn: 'TEST COPIAR BOTÓN', // Texto del botón de copiado de URL
  // text: 'TEST TEXTO', // Texto título de HTML embebido
  // copyBtnHtml: 'TEST HTML BOTÓN', // Texto del botón de copiado de HTML
  // btn: 'TEST BOTÓN', // Botón de cerrado con texto "OK"
  // tooltip: 'TEST TOOLTIP', // Mensaje del Tooltip que confirma que se ha copiado elementos
  baseUrl: 'https://componentes.cnig.es/api-core/',
  urlAPI: true, // Controla si baseUrl se tiene que usar o si se usa la URL actual.
  minimize: false, // Solo se usa si "urlAPI" esta puesto a true, cambia el formato de URL o HTML a copiar.
  shareLayer: true, // Solo se usa si "urlAPI" es false, incluye los layers presentes en URL o HTML si esta puesto a true
  filterLayers: [], // ['cosas1_poligono'], // Solo se usa si "shareLayer" es false o undefined, aplica filtro de layers para incluir solo los nombrados aquí en URL o HTML.
  overwriteStyles: true, // Controla si se aplica o no el estilo aportado en "styles".
  styles: {
    primaryColor: '#d39571', // Color del botón de abrir panel, la caja y sus botones internos.
    secondaryColor: '#fff', // Color de imagen dentro de botón de abrir panel y background del panel abierto
  },
  order: 1,
});

map.addPlugin(mp); window.mp = mp;

