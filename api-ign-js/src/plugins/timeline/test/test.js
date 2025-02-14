/* eslint-disable max-len */
import Timeline from 'facade/timeline';

M.language.setLang('es');

const map = M.map({
  container: 'mapjs',
  controls: ['getfeatureinfo'],
});
window.map = map;

// Primera capa de pruebas GeoJson
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
}); // */

/* / Segunda capa de pruebas GeoJson
const geoJSON = new M.layer.GeoJSON({
  name: 'cosas2_puntos',
  source: {
    crs: { type: 'name', properties: { name: 'urn:ogc:def:crs:OGC:1.3:CRS84' } },
    type: 'FeatureCollection',
    features: [
      { type: 'Feature', properties: { fecha_entero: 18, fecha_fecha: '1918-01-01' }, geometry: { type: 'Point', coordinates: [0.43147, 40.77744] } },
      { type: 'Feature', properties: { fecha_entero: 19, fecha_fecha: '1919-01-01' }, geometry: { type: 'Point', coordinates: [0.49178, 41.45333] } },
      { type: 'Feature', properties: { fecha_entero: 20, fecha_fecha: '1920-01-01' }, geometry: { type: 'Point', coordinates: [-4.64971, 37.52856] } },
      { type: 'Feature', properties: { fecha_entero: 21, fecha_fecha: '1921-01-01' }, geometry: { type: 'Point', coordinates: [-8.90845, 37.83312] } },
      { type: 'Feature', properties: { fecha_entero: 22, fecha_fecha: '1922-01-01' }, geometry: { type: 'Point', coordinates: [0.56357, 38.78313] } },
      { type: 'Feature', properties: { fecha_entero: 23, fecha_fecha: '1923-01-01' }, geometry: { type: 'Point', coordinates: [-6.44021, 37.8981] } },
      { type: 'Feature', properties: { fecha_entero: 24, fecha_fecha: '1924-01-01' }, geometry: { type: 'Point', coordinates: [-4.48122, 38.36074] } },
      { type: 'Feature', properties: { fecha_entero: 25, fecha_fecha: '1925-01-01' }, geometry: { type: 'Point', coordinates: [-3.59297, 37.77205] } },
      { type: 'Feature', properties: { fecha_entero: 26, fecha_fecha: '1926-01-01' }, geometry: { type: 'Point', coordinates: [-7.91509, 42.07642] } },
      { type: 'Feature', properties: { fecha_entero: 27, fecha_fecha: '1927-01-01' }, geometry: { type: 'Point', coordinates: [-2.53718, 39.05952] } },
      { type: 'Feature', properties: { fecha_entero: 28, fecha_fecha: '1928-01-01' }, geometry: { type: 'Point', coordinates: [-1.9647, 37.66484] } },
      { type: 'Feature', properties: { fecha_entero: 29, fecha_fecha: '1929-01-01' }, geometry: { type: 'Point', coordinates: [-7.94964, 39.3414] } },
      { type: 'Feature', properties: { fecha_entero: 30, fecha_fecha: '1930-01-01' }, geometry: { type: 'Point', coordinates: [-2.47662, 40.50277] } },
      { type: 'Feature', properties: { fecha_entero: 31, fecha_fecha: '1931-01-01' }, geometry: { type: 'Point', coordinates: [-1.17539, 39.53216] } },
      { type: 'Feature', properties: { fecha_entero: 32, fecha_fecha: '1932-01-01' }, geometry: { type: 'Point', coordinates: [-6.78563, 42.15966] } },
      { type: 'Feature', properties: { fecha_entero: 33, fecha_fecha: '1933-01-01' }, geometry: { type: 'Point', coordinates: [-3.19374, 41.4353] } },
      { type: 'Feature', properties: { fecha_entero: 34, fecha_fecha: '1934-01-01' }, geometry: { type: 'Point', coordinates: [-1.73101, 41.65682] } },
      { type: 'Feature', properties: { fecha_entero: 35, fecha_fecha: '1935-01-01' }, geometry: { type: 'Point', coordinates: [0.91529, 39.17767] } },
      { type: 'Feature', properties: { fecha_entero: 36, fecha_fecha: '1936-01-01' }, geometry: { type: 'Point', coordinates: [-0.21126, 40.16443] } },
      { type: 'Feature', properties: { fecha_entero: 37, fecha_fecha: '1937-01-01' }, geometry: { type: 'Point', coordinates: [-1.11499, 41.97198] } },
      { type: 'Feature', properties: { fecha_entero: 38, fecha_fecha: '1938-01-01' }, geometry: { type: 'Point', coordinates: [-8.22813, 38.23449] } },
      { type: 'Feature', properties: { fecha_entero: 39, fecha_fecha: '1939-01-01' }, geometry: { type: 'Point', coordinates: [-8.7548, 38.39007] } },
      { type: 'Feature', properties: { fecha_entero: 40, fecha_fecha: '1940-01-01' }, geometry: { type: 'Point', coordinates: [-5.7924, 38.22489] } },
      { type: 'Feature', properties: { fecha_entero: 41, fecha_fecha: '1941-01-01' }, geometry: { type: 'Point', coordinates: [-5.11927, 40.96734] } },
      { type: 'Feature', properties: { fecha_entero: 42, fecha_fecha: '1942-01-01' }, geometry: { type: 'Point', coordinates: [-7.76086, 38.44714] } },
      { type: 'Feature', properties: { fecha_entero: 43, fecha_fecha: '1943-01-01' }, geometry: { type: 'Point', coordinates: [-3.09344, 42.08127] } },
      { type: 'Feature', properties: { fecha_entero: 44, fecha_fecha: '1944-01-01' }, geometry: { type: 'Point', coordinates: [-5.7493, 42.30861] } },
      { type: 'Feature', properties: { fecha_entero: 45, fecha_fecha: '1945-01-01' }, geometry: { type: 'Point', coordinates: [-0.23365, 40.69604] } },
      { type: 'Feature', properties: { fecha_entero: 46, fecha_fecha: '1946-01-01' }, geometry: { type: 'Point', coordinates: [-5.05156, 38.01299] } },
      { type: 'Feature', properties: { fecha_entero: 47, fecha_fecha: '1947-01-01' }, geometry: { type: 'Point', coordinates: [-0.38042, 41.4589] } },
      { type: 'Feature', properties: { fecha_entero: 48, fecha_fecha: '1948-01-01' }, geometry: { type: 'Point', coordinates: [-5.87828, 39.27907] } },
      { type: 'Feature', properties: { fecha_entero: 49, fecha_fecha: '1949-01-01' }, geometry: { type: 'Point', coordinates: [-8.95698, 39.05368] } },
      { type: 'Feature', properties: { fecha_entero: 50, fecha_fecha: '1950-01-01' }, geometry: { type: 'Point', coordinates: [-7.89541, 37.84761] } },
      { type: 'Feature', properties: { fecha_entero: 51, fecha_fecha: '1951-01-01' }, geometry: { type: 'Point', coordinates: [-2.18693, 41.33444] } },
      { type: 'Feature', properties: { fecha_entero: 52, fecha_fecha: '1952-01-01' }, geometry: { type: 'Point', coordinates: [-1.79967, 38.15187] } },
      { type: 'Feature', properties: { fecha_entero: 53, fecha_fecha: '1953-01-01' }, geometry: { type: 'Point', coordinates: [-7.30916, 38.03582] } },
      { type: 'Feature', properties: { fecha_entero: 54, fecha_fecha: '1954-01-01' }, geometry: { type: 'Point', coordinates: [-1.95486, 38.75409] } },
      { type: 'Feature', properties: { fecha_entero: 55, fecha_fecha: '1955-01-01' }, geometry: { type: 'Point', coordinates: [-6.249, 39.6153] } },
      { type: 'Feature', properties: { fecha_entero: 56, fecha_fecha: '1956-01-01' }, geometry: { type: 'Point', coordinates: [-2.5832, 37.52415] } },
      { type: 'Feature', properties: { fecha_entero: 57, fecha_fecha: '1957-01-01' }, geometry: { type: 'Point', coordinates: [-6.53399, 40.41925] } },
      { type: 'Feature', properties: { fecha_entero: 58, fecha_fecha: '1958-01-01' }, geometry: { type: 'Point', coordinates: [-1.23615, 41.47251] } },
      { type: 'Feature', properties: { fecha_entero: 59, fecha_fecha: '1959-01-01' }, geometry: { type: 'Point', coordinates: [-0.1464, 38.38785] } },
      { type: 'Feature', properties: { fecha_entero: 60, fecha_fecha: '1960-01-01' }, geometry: { type: 'Point', coordinates: [-8.80788, 41.47256] } },
      { type: 'Feature', properties: { fecha_entero: 61, fecha_fecha: '1961-01-01' }, geometry: { type: 'Point', coordinates: [-3.06393, 39.28739] } },
      { type: 'Feature', properties: { fecha_entero: 62, fecha_fecha: '1962-01-01' }, geometry: { type: 'Point', coordinates: [-8.77333, 40.60393] } },
      { type: 'Feature', properties: { fecha_entero: 63, fecha_fecha: '1963-01-01' }, geometry: { type: 'Point', coordinates: [-0.15578, 42.22891] } },
      { type: 'Feature', properties: { fecha_entero: 64, fecha_fecha: '1964-01-01' }, geometry: { type: 'Point', coordinates: [-6.73979, 39.79907] } },
      { type: 'Feature', properties: { fecha_entero: 65, fecha_fecha: '1965-01-01' }, geometry: { type: 'Point', coordinates: [-1.45362, 39.99113] } },
      { type: 'Feature', properties: { fecha_entero: 66, fecha_fecha: '1966-01-01' }, geometry: { type: 'Point', coordinates: [0.8716, 40.17059] } },
      { type: 'Feature', properties: { fecha_entero: 67, fecha_fecha: '1967-01-01' }, geometry: { type: 'Point', coordinates: [-6.79429, 39.12696] } },
      { type: 'Feature', properties: { fecha_entero: 68, fecha_fecha: '1968-01-01' }, geometry: { type: 'Point', coordinates: [-1.85855, 39.33434] } },
      { type: 'Feature', properties: { fecha_entero: 69, fecha_fecha: '1969-01-01' }, geometry: { type: 'Point', coordinates: [0.02974, 39.7102] } },
      { type: 'Feature', properties: { fecha_entero: 70, fecha_fecha: '1970-01-01' }, geometry: { type: 'Point', coordinates: [-7.29086, 40.17781] } },
      { type: 'Feature', properties: { fecha_entero: 71, fecha_fecha: '1971-01-01' }, geometry: { type: 'Point', coordinates: [-4.88459, 38.71553] } },
      { type: 'Feature', properties: { fecha_entero: 72, fecha_fecha: '1972-01-01' }, geometry: { type: 'Point', coordinates: [-0.95104, 40.19314] } },
      { type: 'Feature', properties: { fecha_entero: 73, fecha_fecha: '1973-01-01' }, geometry: { type: 'Point', coordinates: [-3.72131, 39.86116] } },
      { type: 'Feature', properties: { fecha_entero: 74, fecha_fecha: '1974-01-01' }, geometry: { type: 'Point', coordinates: [-0.84222, 38.2533] } },
      { type: 'Feature', properties: { fecha_entero: 75, fecha_fecha: '1975-01-01' }, geometry: { type: 'Point', coordinates: [-3.94563, 40.84113] } },
      { type: 'Feature', properties: { fecha_entero: 76, fecha_fecha: '1976-01-01' }, geometry: { type: 'Point', coordinates: [-3.16239, 39.90149] } },
      { type: 'Feature', properties: { fecha_entero: 77, fecha_fecha: '1977-01-01' }, geometry: { type: 'Point', coordinates: [-0.76326, 41.06446] } },
      { type: 'Feature', properties: { fecha_entero: 78, fecha_fecha: '1978-01-01' }, geometry: { type: 'Point', coordinates: [-3.9424, 41.67652] } },
      { type: 'Feature', properties: { fecha_entero: 79, fecha_fecha: '1979-01-01' }, geometry: { type: 'Point', coordinates: [-4.68311, 39.5216] } },
      { type: 'Feature', properties: { fecha_entero: 80, fecha_fecha: '1980-01-01' }, geometry: { type: 'Point', coordinates: [-5.32655, 38.46196] } },
      { type: 'Feature', properties: { fecha_entero: 81, fecha_fecha: '1981-01-01' }, geometry: { type: 'Point', coordinates: [-5.8622, 40.77066] } },
      { type: 'Feature', properties: { fecha_entero: 82, fecha_fecha: '1982-01-01' }, geometry: { type: 'Point', coordinates: [-2.50172, 41.86821] } },
      { type: 'Feature', properties: { fecha_entero: 83, fecha_fecha: '1983-01-01' }, geometry: { type: 'Point', coordinates: [-8.50449, 41.92415] } },
      { type: 'Feature', properties: { fecha_entero: 84, fecha_fecha: '1984-01-01' }, geometry: { type: 'Point', coordinates: [0.88681, 38.16029] } },
      { type: 'Feature', properties: { fecha_entero: 85, fecha_fecha: '1985-01-01' }, geometry: { type: 'Point', coordinates: [-4.27471, 39.17792] } },
      { type: 'Feature', properties: { fecha_entero: 86, fecha_fecha: '1986-01-01' }, geometry: { type: 'Point', coordinates: [-6.31435, 41.94887] } },
      { type: 'Feature', properties: { fecha_entero: 87, fecha_fecha: '1987-01-01' }, geometry: { type: 'Point', coordinates: [-4.52405, 40.32604] } },
      { type: 'Feature', properties: { fecha_entero: 88, fecha_fecha: '1988-01-01' }, geometry: { type: 'Point', coordinates: [-3.33349, 40.61926] } },
      { type: 'Feature', properties: { fecha_entero: 89, fecha_fecha: '1989-01-01' }, geometry: { type: 'Point', coordinates: [-5.78118, 41.50048] } },
      { type: 'Feature', properties: { fecha_entero: 90, fecha_fecha: '1990-01-01' }, geometry: { type: 'Point', coordinates: [-2.66157, 41.061] } },
      { type: 'Feature', properties: { fecha_entero: 91, fecha_fecha: '1991-01-01' }, geometry: { type: 'Point', coordinates: [-8.11554, 39.87554] } },
      { type: 'Feature', properties: { fecha_entero: 92, fecha_fecha: '1992-01-01' }, geometry: { type: 'Point', coordinates: [-7.70305, 40.5684] } },
      { type: 'Feature', properties: { fecha_entero: 93, fecha_fecha: '1993-01-01' }, geometry: { type: 'Point', coordinates: [-8.22188, 41.34962] } },
      { type: 'Feature', properties: { fecha_entero: 94, fecha_fecha: '1994-01-01' }, geometry: { type: 'Point', coordinates: [-1.32322, 38.82273] } },
      { type: 'Feature', properties: { fecha_entero: 95, fecha_fecha: '1995-01-01' }, geometry: { type: 'Point', coordinates: [-3.63605, 42.24514] } },
      { type: 'Feature', properties: { fecha_entero: 96, fecha_fecha: '1996-01-01' }, geometry: { type: 'Point', coordinates: [-5.02789, 40.29007] } },
      { type: 'Feature', properties: { fecha_entero: 97, fecha_fecha: '1997-01-01' }, geometry: { type: 'Point', coordinates: [-1.22493, 37.84488] } },
      { type: 'Feature', properties: { fecha_entero: 98, fecha_fecha: '1998-01-01' }, geometry: { type: 'Point', coordinates: [-3.94224, 38.33276] } },
      { type: 'Feature', properties: { fecha_entero: 99, fecha_fecha: '1999-01-01' }, geometry: { type: 'Point', coordinates: [-6.28222, 38.57709] } },
      { type: 'Feature', properties: { fecha_entero: 90, fecha_fecha: '1990-01-01' }, geometry: { type: 'Point', coordinates: [-1.48893, 40.75496] } },
      { type: 'Feature', properties: { fecha_entero: 10, fecha_fecha: '1910-01-01' }, geometry: { type: 'Point', coordinates: [-5.08997, 39.20226] } },
      { type: 'Feature', properties: { fecha_entero: 20, fecha_fecha: '1920-01-01' }, geometry: { type: 'Point', coordinates: [-0.47309, 39.08059] } },
      { type: 'Feature', properties: { fecha_entero: 30, fecha_fecha: '1930-01-01' }, geometry: { type: 'Point', coordinates: [-8.86933, 40.04769] } },
      { type: 'Feature', properties: { fecha_entero: 40, fecha_fecha: '1940-01-01' }, geometry: { type: 'Point', coordinates: [-2.38317, 38.30195] } },
      { type: 'Feature', properties: { fecha_entero: 50, fecha_fecha: '1950-01-01' }, geometry: { type: 'Point', coordinates: [-4.9631, 41.92101] } },
      { type: 'Feature', properties: { fecha_entero: 60, fecha_fecha: '1960-01-01' }, geometry: { type: 'Point', coordinates: [0.34185, 38.09237] } },
      { type: 'Feature', properties: { fecha_entero: 70, fecha_fecha: '1970-01-01' }, geometry: { type: 'Point', coordinates: [0.64041, 42.0481] } },
      { type: 'Feature', properties: { fecha_entero: 80, fecha_fecha: '1980-01-01' }, geometry: { type: 'Point', coordinates: [-7.27835, 39.65084] } },
      { type: 'Feature', properties: { fecha_entero: 19, fecha_fecha: '1919-01-01' }, geometry: { type: 'Point', coordinates: [-3.22883, 38.77946] } },
      { type: 'Feature', properties: { fecha_entero: 10, fecha_fecha: '1910-01-01' }, geometry: { type: 'Point', coordinates: [-7.27621, 38.92962] } },
      { type: 'Feature', properties: { fecha_entero: 11, fecha_fecha: '1911-01-01' }, geometry: { type: 'Point', coordinates: [-6.58137, 41.13532] } },
      { type: 'Feature', properties: { fecha_entero: 12, fecha_fecha: '1912-01-01' }, geometry: { type: 'Point', coordinates: [-0.20171, 37.52444] } },
      { type: 'Feature', properties: { fecha_entero: 13, fecha_fecha: '1913-01-01' }, geometry: { type: 'Point', coordinates: [-7.31988, 42.06888] } },
      { type: 'Feature', properties: { fecha_entero: 14, fecha_fecha: '1914-01-01' }, geometry: { type: 'Point', coordinates: [-5.69175, 39.92122] } },
      { type: 'Feature', properties: { fecha_entero: 15, fecha_fecha: '1915-01-01' }, geometry: { type: 'Point', coordinates: [-7.65505, 41.19699] } },
      { type: 'Feature', properties: { fecha_entero: 16, fecha_fecha: '1916-01-01' }, geometry: { type: 'Point', coordinates: [-2.64069, 39.75083] } },
      { type: 'Feature', properties: { fecha_entero: 17, fecha_fecha: '1917-01-01' }, geometry: { type: 'Point', coordinates: [-2.11522, 39.90811] } },
    ],
  },
}); // */

// Plugin test 'absolute' o 'relative'
const terremotosText = 'WMS*Eventos sísmicos*https://www.ign.es/wms-inspire/geofisica*NZ.ObservedEvent'; // Al ser definido con string, crea este layer automáticamente cada vez que se usa.
// const terremotosText = new M.layer.WMS('WMS*Eventos sísmicos*https://www.ign.es/wms-inspire/geofisica*NZ.ObservedEvent');
// map.addLayers([geoJSON]);
const pluginTimeline = new Timeline({
  position: 'TR', // 'TL' | 'TR' | 'BR' | 'BL'
  intervals: [
    {
      id: '1',
      init: '1900-05-12T23:39:58.767Z',
      end: '1986-05-29T20:22:26.001Z',
      layer: geoJSON,
      grupo: 'vectorWMS_GRUPO',
      attributeParam: 'fecha_fecha',
    },
    {
      id: '2',
      init: '1918-05-12T23:39:58.767Z',
      end: '1951-01-16T12:47:07.530Z',
      layer: terremotosText, // Al usarse en varias instancias se tiene que hacer con String para no dar error de reemplazo de id del mismo objeto.
      grupo: 'vectorWMS_GRUPO',
      attributeParam: 'date',
    },
    {
      id: '3',
      init: '1900-05-12T23:39:58.767Z',
      end: '1421412427530',
      layer: terremotosText,
      attributeParam: 'date',
      // equalsTimeLine: true // Por defecto es false, pero si se pone a true, el input de inicio "#a" ahora se quita cuando se escoge esta capa, impidiendo modificado de valor de inicio de "timelineType:'relative'".
    },
    {
      id: '4',
      init: '1910-05-12T23:39:58.767Z',
      end: 1421412427530,
      layer: terremotosText, // Vuelve a crear este mismo layer pero con id 4, aunque el "2" y "3" ya existen, ya que son diferentes copias.
      attributeParam: 'date',
    },
  ],
  // intervals: undefined, // interumpe funcionamiento
  // intervals: [], // getAPIRest() "timeline=TR*!!!¡¡*!false*!1"
  animation: false, // No hace nada con timelineType: 'absolute' | 'relative'
  speed: 1,
  // tooltip: 'TEST TOOLTIP Timeline',
  speedDate: 2,
  paramsDate: 'yr', // 'sec' | 'min' | 'hrs' | 'day' | 'mos' | 'yr'
  stepValue: 5,
  sizeWidthDinamic: 'sizeWidthDinamic_medium', // '' | 'sizeWidthDinamic_medium' | 'sizeWidthDinamic_big'
  formatMove: 'discrete', // 'discrete'(Al mover el slider con el play, solo mueve el final) | 'continuous' (Mueve también el inicial pero solo si no es "timelineType: 'absolute'")
  formatValue: 'exponential', // 'logarithmic' | 'exponential' | 'linear'/false
  timelineType: 'absolute', // 'absolute'(SOLO FIN) | 'relative'(INICIO y FIN) | 'absoluteSimple'(Otro aspecto, ver en "pluginTimeline" de abajo) | false/undefined/others
}); // */

/* / Origin format del plugin parte de "absoluteSimple"
const intervals = '[["NACIONAL 1981-1986","1986","WMS*NACIONAL_1981-1986*https://www.ign.es/wms/pnoa-historico*NACIONAL_1981-1986"],["OLISTAT","1998","WMS*OLISTAT*https://www.ign.es/wms/pnoa-historico*OLISTAT"],["SIGPAC","2003","WMS*SIGPAC*https://www.ign.es/wms/pnoa-historico*SIGPAC"],["PNOA 2004","2004","WMS*pnoa2004*https://www.ign.es/wms/pnoa-historico*pnoa2004"],["PNOA 2005","2005","WMS*pnoa2005*https://www.ign.es/wms/pnoa-historico*pnoa2005"],["PNOA 2006","2006","WMS*pnoa2006*https://www.ign.es/wms/pnoa-historico*pnoa2006"],["PNOA 2010","2010","WMS*pnoa2010*https://www.ign.es/wms/pnoa-historico*pnoa2010"]]';
const pluginTimeline = new Timeline({
  position: 'TR', // 'TL' | 'TR' | 'BR' | 'BL'
  intervals,
  timelineType: 'absoluteSimple', // OBLIGATORIO
  animation: false, // Activa o desactiva el botón de play, solamente en "absoluteSimple"
}); // */

map.addPlugin(pluginTimeline); window.mp = pluginTimeline;
