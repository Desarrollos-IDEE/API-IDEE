/* eslint-disable max-len */
import StyleManager from 'facade/stylemanager';

// M.language.setLang('en');

const map = M.map({
  container: 'mapjs',
  center: [-454900, 4740300],
  zoom: 6,
});
window.map = map;

const lines = new M.layer.GeoJSON({
  name: 'lines',
  source: {
    type: 'FeatureCollection',
    features: [{
      type: 'Feature',
      properties: { alumnos: 400, colegios: 2 },
      geometry: {
        type: 'LineString',
        coordinates: [
          [-3.8452148437499996, 37.93553306183642],
          [-1.669921875, 38.42777351132902],
          [-3.27392578125, 37.1165261849112],
        ],
      },
    },
    {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: [
          [-2.724609375, 37.92686760148135],
          [-4.427490234375, 37.16031654673677],
        ],
      },
    },
    {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: [
          [-1.636962890625, 38.71123253895224],
          [-5.020751953125, 38.91668153637508],
        ],
      },
    },
    {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: [
          [-1.669921875, 38.57393751557591],
          [-4.647216796875, 37.90953361677018],
        ],
      },
    },
    {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: [
          [-1.395263671875, 38.42777351132902],
          [-2.109375, 37.18657859524883],
          [-3.482666015625, 36.78289206199065],
          [-4.68017578125, 36.85325222344018],
        ],
      },
    },
    ],
  },
// }, { style: new M.style.FlowLine({ color: '#ff0000', color2: '#F8FF25', arrow: 1, width: 20, width2: 25, lineCap: 'round', arrowColor: '#ff0000', offset0: 0, offset1: 0 }) // Estilo en generado de capa.
});

// Conjunto de todos los layers a probar
const points = new M.layer.GeoJSON({
  name: 'points',
  source: {
    type: 'FeatureCollection',
    features: [{
      type: 'Feature',
      properties: { alumnos: 399, colegios: 10 },
      geometry: { type: 'Point', coordinates: [-5.398185534463248, 37.45730370790821] },
    },
    {
      type: 'Feature',
      properties: { alumnos: 325, colegios: 11 },
      geometry: { type: 'Point', coordinates: [-5.5957414385034285, 37.31260205119489] },
    },
    {
      type: 'Feature',
      properties: { alumnos: 58, colegios: 13 },
      geometry: { type: 'Point', coordinates: [-5.7166812740555235, 36.842966167382926] },
    },
    {
      type: 'Feature',
      properties: { alumnos: 301, colegios: 15 },
      geometry: { type: 'Point', coordinates: [-5.1615553374241925, 37.090035553089585] },
    },
    {
      type: 'Feature',
      properties: { alumnos: 235, colegios: 15 },
      geometry: { type: 'Point', coordinates: [-5.448482673516814, 37.656815271705675] },
    },
    {
      type: 'Feature',
      properties: { alumnos: 148, colegios: 8 },
      geometry: { type: 'Point', coordinates: [-5.950581923428585, 36.78131955383965] },
    },
    {
      type: 'Feature',
      properties: { alumnos: 85, colegios: 13 },
      geometry: { type: 'Point', coordinates: [-5.090627618815714, 36.74307850736811] },
    },
    {
      type: 'Feature',
      properties: { alumnos: 173, colegios: 8 },
      geometry: { type: 'Point', coordinates: [-5.3702750172379385, 36.871880421172484] },
    },
    {
      type: 'Feature',
      properties: { alumnos: 253, colegios: 4 },
      geometry: { type: 'Point', coordinates: [-5.085955495848571, 36.698061955621164] },
    },
    {
      type: 'Feature',
      properties: { alumnos: 121, colegios: 18 },
      geometry: { type: 'Point', coordinates: [-5.09342433102585, 37.45469867093221] },
    },
    {
      type: 'Feature',
      properties: { alumnos: 253, colegios: 7 },
      geometry: { type: 'Point', coordinates: [-5.146250009752628, 37.29130849330829] },
    },
    {
      type: 'Feature',
      properties: { alumnos: 178, colegios: 3 },
      geometry: { type: 'Point', coordinates: [-5.669729396428465, 37.099180667986964] },
    },
    {
      type: 'Feature',
      properties: { alumnos: 290, colegios: 4 },
      geometry: { type: 'Point', coordinates: [-5.5723815844666715, 36.758350955763966] },
    },
    {
      type: 'Feature',
      properties: { alumnos: 97, colegios: 6 },
      geometry: { type: 'Point', coordinates: [-5.229523950015954, 36.95796800321581] },
    },
    {
      type: 'Feature',
      properties: { alumnos: 244, colegios: 6 },
      geometry: { type: 'Point', coordinates: [-5.824364867422735, 37.216618748057286] },
    },
    {
      type: 'Feature',
      properties: { alumnos: 114, colegios: 4 },
      geometry: { type: 'Point', coordinates: [-5.120464756843248, 37.80990261768569] },
    },
    {
      type: 'Feature',
      properties: { alumnos: 202, colegios: 7 },
      geometry: { type: 'Point', coordinates: [-5.881586033526422, 36.5099796770505] },
    },
    {
      type: 'Feature',
      properties: { alumnos: 306, colegios: 14 },
      geometry: { type: 'Point', coordinates: [-5.9479918420390145, 37.329438353921034] },
    },
    {
      type: 'Feature',
      properties: { alumnos: 52, colegios: 4 },
      geometry: { type: 'Point', coordinates: [-5.357277747563661, 37.86010185361898] },
    },
    {
      type: 'Feature',
      properties: { alumnos: 229, colegios: 7 },
      geometry: { type: 'Point', coordinates: [-5.2033881213822735, 37.51081093834673] },
    },
    {
      type: 'Feature',
      properties: { alumnos: 58, colegios: 17 },
      geometry: { type: 'Point', coordinates: [-5.368209186061417, 36.56019913705545] },
    },
    {
      type: 'Feature',
      properties: { alumnos: 114, colegios: 15 },
      geometry: { type: 'Point', coordinates: [-5.790633864763912, 36.84518455840279] },
    },
    {
      type: 'Feature',
      properties: { alumnos: 84, colegios: 8 },
      geometry: { type: 'Point', coordinates: [-5.106275306740548, 37.97616841301806] },
    },
    {
      type: 'Feature',
      properties: { alumnos: 283, colegios: 15 },
      geometry: { type: 'Point', coordinates: [-5.377606351771481, 37.16996250256708] },
    },
    {
      type: 'Feature',
      properties: { alumnos: 226, colegios: 16 },
      geometry: { type: 'Point', coordinates: [-5.192077231736873, 36.810582602906365] },
    },
    {
      type: 'Feature',
      properties: { alumnos: 111, colegios: 2 },
      geometry: { type: 'Point', coordinates: [-5.312952324615357, 37.688244218696724] },
    },
    {
      type: 'Feature',
      properties: { alumnos: 276, colegios: 13 },
      geometry: { type: 'Point', coordinates: [-5.267177704056467, 37.14433931256324] },
    },
    {
      type: 'Feature',
      properties: { alumnos: 140, colegios: 5 },
      geometry: { type: 'Point', coordinates: [-5.9000515263464255, 37.07848053272649] },
    },
    {
      type: 'Feature',
      properties: { alumnos: 131, colegios: 12 },
      geometry: { type: 'Point', coordinates: [-5.9763123852212665, 36.94121200493808] },
    },
    {
      type: 'Feature',
      properties: { alumnos: 58, colegios: 2 },
      geometry: { type: 'Point', coordinates: [-5.119846140677662, 37.049177992518054] },
    },
    {
      type: 'Feature',
      properties: { alumnos: 62, colegios: 3 },
      geometry: { type: 'Point', coordinates: [-5.415054798069191, 37.32562655729647] },
    },
    {
      type: 'Feature',
      properties: { alumnos: 344, colegios: 8 },
      geometry: { type: 'Point', coordinates: [-5.633271660894013, 37.56687719110893] },
    },
    {
      type: 'Feature',
      properties: { alumnos: 166, colegios: 14 },
      geometry: { type: 'Point', coordinates: [-5.627568858786239, 36.88766959599923] },
    },
    {
      type: 'Feature',
      properties: { alumnos: 78, colegios: 6 },
      geometry: { type: 'Point', coordinates: [-5.110787164934307, 36.88864450578582] },
    },
    {
      type: 'Feature',
      properties: { alumnos: 281, colegios: 8 },
      geometry: { type: 'Point', coordinates: [-5.442189514796764, 37.983118868608685] },
    },
    {
      type: 'Feature',
      properties: { alumnos: 74, colegios: 8 },
      geometry: { type: 'Point', coordinates: [-5.364491979422597, 37.76589897110641] },
    },
    {
      type: 'Feature',
      properties: { alumnos: 141, colegios: 13 },
      geometry: { type: 'Point', coordinates: [-5.982592607453279, 36.74558390628279] },
    },
    {
      type: 'Feature',
      properties: { alumnos: 259, colegios: 19 },
      geometry: { type: 'Point', coordinates: [-5.332563335974404, 37.590623503816715] },
    },
    {
      type: 'Feature',
      properties: { alumnos: 255, colegios: 10 },
      geometry: { type: 'Point', coordinates: [-5.665724890211363, 37.787289402072744] },
    },
    {
      type: 'Feature',
      properties: { alumnos: 102, colegios: 3 },
      geometry: { type: 'Point', coordinates: [-5.410819235335401, 36.93888718048877] },
    },
    {
      type: 'Feature',
      properties: { alumnos: 228, colegios: 8 },
      geometry: { type: 'Point', coordinates: [-5.696200334741402, 37.89454141881721] },
    },
    {
      type: 'Feature',
      properties: { alumnos: 137, colegios: 16 },
      geometry: { type: 'Point', coordinates: [-5.451135493107085, 37.06737436892989] },
    },
    {
      type: 'Feature',
      properties: { alumnos: 83, colegios: 3 },
      geometry: { type: 'Point', coordinates: [-5.828101590876895, 37.75870882636568] },
    },
    {
      type: 'Feature',
      properties: { alumnos: 83, colegios: 14 },
      geometry: { type: 'Point', coordinates: [-5.213841852401093, 37.3849199467344] },
    },
    {
      type: 'Feature',
      properties: { alumnos: 397, colegios: 10 },
      geometry: { type: 'Point', coordinates: [-5.162462140288094, 36.98375757145731] },
    },
    {
      type: 'Feature',
      properties: { alumnos: 245, colegios: 16 },
      geometry: { type: 'Point', coordinates: [-5.769687871441968, 36.7485448221363] },
    },
    {
      type: 'Feature',
      properties: { alumnos: 167, colegios: 12 },
      geometry: { type: 'Point', coordinates: [-5.8064289999100644, 37.353129615247276] },
    },
    {
      type: 'Feature',
      properties: { alumnos: 106, colegios: 9 },
      geometry: { type: 'Point', coordinates: [-5.18130512935752, 36.91825972785444] },
    },
    {
      type: 'Feature',
      properties: { alumnos: 98, colegios: 3 },
      geometry: { type: 'Point', coordinates: [-5.606446965482102, 36.84820535288928] },
    },
    {
      type: 'Feature',
      properties: { alumnos: 201, colegios: 19 },
      geometry: { type: 'Point', coordinates: [-5.268869643647613, 37.48692113860303] },
    }],
  },
});

const polygons = new M.layer.GeoJSON({
  name: 'polygons',
  source: {
    type: 'FeatureCollection',
    features: [{ // Tres tipos de features
      type: 'Feature',
      properties: { alumnos: 400, colegios: 2 },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-5.5810546875, 40.713955826286046],
          [-6.734619140625, 40.153686857794035],
          [-6.383056640625, 39.78321267821705],
          [-6.8994140625, 39.47860556892209],
          [-6.492919921875, 39.39375459224348],
          [-5.833740234375, 39.38526381099774],
          [-5.33935546875, 39.78321267821705],
          [-5.5810546875, 40.713955826286046],
        ]],
      },
    },
    {
      type: 'Feature',
      properties: { alumnos: 400, colegios: 2 },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-3.2080078125, 40.6723059714534],
          [-4.515380859375, 41.12074559016745],
          [-4.625244140625, 40.01078714046552],
          [-3.779296875, 39.715638134796336],
          [-4.603271484375, 39.26628442213066],
          [-4.4384765625, 39.00211029922515],
          [-3.834228515625, 38.98503278695909],
          [-2.669677734375, 39.605688178320804],
          [-2.35107421875, 40.22082997283287],
          [-3.2080078125, 40.6723059714534],
        ]],
      },
    },
    {
      type: 'Feature',
      properties: { alumnos: 400, colegios: 2 },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-6.50390625, 41.43449030894922],
          [-7.536621093749999, 40.871987756697415],
          [-7.448730468749999, 40.027614437486655],
          [-6.50390625, 41.43449030894922],
        ]],
      },
    },
    {
      type: 'Feature',
      properties: { alumnos: 400, colegios: 2 },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-8.536376953125, 39.46164364205549],
          [-8.67919921875, 37.53586597792038],
          [-7.404785156249999, 38.75408327579141],
          [-7.943115234375001, 39.631076770083666],
          [-8.536376953125, 39.46164364205549],
        ]],
      },
    },
    {
      type: 'Feature',
      properties: { alumnos: 400, colegios: 2 },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-6.921386718749999, 38.47939467327645],
          [-7.921142578125, 37.23032838760387],
          [-6.976318359375, 36.1822249804225],
          [-6.6796875, 37.49229399862877],
          [-6.383056640625, 36.81808022778526],
          [-5.899658203125, 37.996162679728116],
          [-6.943359374999999, 37.779398571318765],
          [-6.921386718749999, 38.47939467327645],
        ]],
      },
    }],
  },
});

const generic = new M.layer.GeoJSON({
  name: 'generic',
  source: {
    type: 'FeatureCollection',
    features: [{
      type: 'Feature',
      properties: { alumnos: 4, colegios: 4 },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-7.021386718749999, 38.07939467327645],
          [-9.021142578125, 36.03032838760387],
          [-7.143359374999999, 35.179398571318764],
          [-6.121386718749999, 37.17939467327645],
        ]],
      },
    },
    {
      type: 'Feature',
      properties: { alumnos: 400, colegios: 2 },
      geometry: { type: 'Point', coordinates: [-4.113134765624999, 37.14869658591038] },
    },
    {
      type: 'Feature',
      properties: { alumnos: 100, colegios: 100 },
      geometry: {
        type: 'LineString',
        coordinates: [
          [-3.1452148437499994, 37.13553306183642],
          [-1.169921875, 38.12777351132902],
          [-3.17392578125, 37.1165261849112],
        ],
      },
    }],
  },
});
map.addLayers([points, lines, polygons, generic]);
window.points = points; window.lines = lines;
window.polygons = polygons; window.generic = generic;
// */

/* / Estilo de lines
const estiloflow = new M.style.FlowLine({
  color: '#ff0000',
  color2: '#F8FF25',
  arrow: 1,
  width: 10,
  width2: 25,
  lineCap: 'round',
  arrowColor: '#ff0000',
  offset0: 0,
  offset1: 0,
});
lines.setStyle(estiloflow); // */
// map.addLayers([lines]); window.lines = lines;

/* / Layer WFS1
const wfs1 = new M.layer.WFS({
  url: 'http://geostematicos-sigc.juntadeandalucia.es/geoserver/tematicos/ows?',
  namespace: 'tematicos',
  name: 'Provincias',
  legend: 'Provincias',
  geometry: 'MPOLYGON',
});
map.addWFS(wfs1); window.wfs1 = wfs1; // */

/* / Layer WFS2
const wfs2 = new M.layer.WFS({
  url: 'http://geostematicos-sigc.juntadeandalucia.es/geoserver/sepim/ows?',
  namespace: 'sepim',
  name: 'campamentos',
  legend: 'Campamentos',
  geometry: 'Point',
});
map.addWFS(wfs2); window.wfs2 = wfs2;

const estilo2 = new M.style.Point({
  radius: 5,
  fill: {
    color: 'green',
    opacity: 0.5,
  },
  stroke: {
    color: '#FF0000',
  },
});

wfs2.setStyle(estilo2); // */

/* / Estilado de WF2
const estilo = new M.style.Point({
  // fill: { color: "#67af13", opacity: 0.4 },
  icon: {
    class: 'fa-heart',
    color: '#e07e18',
    fill: '#ffffff',
    // fontsize: 0,
    form: 'CIRCLE',
    gradient: false,
    offset: [0, 0],
    opacity: 1,
    radius: 20,
    rotate: false,
    rotation: 0,
    // crossOrigin: 'anonymous'
  },
  label: undefined,
  radius: 5,
});
wfs2.setStyle(estilo); // */

/* / Layer WFS3 (CAUSA LAG POR SER MUCHAS LINEAS, se recomienda tener apagado el inpector hasta que finalize de cargar)
const wfs3 = new M.layer.WFS({
  url: 'http://www.ideandalucia.es/services/DERA_g3_hidrografia/wfs',
  namespace: 'DERA_g3_hidrografia',
  name: 'g03_08_Conduccion',
  legend: 'Rios',
  geometry: 'LINE',
});
map.addWFS(wfs3); window.wfs3 = wfs3; // */

/* / Capa de municipios
const layerMunicipio = new M.layer.WFS({
  url: 'http://geostematicos-sigc.juntadeandalucia.es/geoserver/tematicos/ows?',
  namespace: 'tematicos',
  name: 'ind_mun_simp',
  legend: 'Municipios SIM',
  geometry: 'MPOLYGON',
});
map.addLayers([layerMunicipio]); window.layerMunicipio = layerMunicipio; // */

const mp = new StyleManager({
  position: 'TL', // 'TL' | 'TR' | 'BR' | 'BL'
  collapsible: true,
  collapsed: true,
  // tooltip: 'TEST TOOLTIP StyleManager',

  // Seleccion de la capa default que ya estará seleccionada en el inicio.
  // layer: wfs2, // Capas presentes en este test.js points | lines | polygons | generic | wfs1 | wfs2 | wfs3 | layerMunicipio
});
map.addPlugin(mp); window.mp = mp;
