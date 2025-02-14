import QueryAttributes from 'facade/queryattributes';

M.language.setLang('es'); // Español
// M.language.setLang('en'); // Inglés

const map = M.map({
  container: 'mapjs',
  // controls: ['panzoom','panzoombar', 'scale*true', 'scaleline', 'rotate', 'location','backgroundlayers'], //getfeatureinfo: este control es un poco coñazo, siempre está buscando información al hacer clic en el mapa.
  // controls: ['panzoom', 'scale*true', 'scaleline', 'rotate', 'location', 'backgroundlayers', 'getfeatureinfo'],
  minZoom: 4, maxZoom: 20, zoom: 10,
  projection: 'EPSG:3857*m',
  center: {
    x: -409000, y: 4930000,
    // x: -712300, y: 4310700,
    draw: false, // Dibuja un punto en el lugar de la coordenada
  },
});
window.map = map;

// Capa vertex de GeoJSON
const COLORES_PROVINCIA = {
  2: 'olive', 5: 'green', 6: 'blue', 9: 'navy',
  10: 'springgreeen', 13: 'lightsalmon',
  16: 'steelblue', 19: 'orangered', 28: 'red',
  40: 'plum', 42: 'lime', 45: 'gold',
  47: 'emerald', 50: 'turquoise',
};
const estiloPoint = new M.style.Point({
  icon: {
    // e2m: En la propiedad form se decide que forma adopta el icon de las preconfiguradas
    // Valores: BAN|BLAZON|BUBBLE|CIRCLE|LOZENGE|MARKER|NONE|SHIELD|SIGN|SQUARE|TRIANGLE

    // Este es el punto. En vez de igualar el valor de la propiedad a unos de los valores, lo igualamos a una función anónima que pasa como parámetros el feature y el mapa
    // Con el elemento (feature) puedo acceder a los atributos que tiene el geoJSON. La forma la determina el propietario de la estación.
    // Como valor devuelto por el return es la clase de Mapea que representa a la forma: M.style.form.TRIANGLE para el triángulo y M.style.form.CIRCLE para el cí­rculo
    form: function(feature,map) {
      return M.style.form.CIRCLE;
    },
    // e2m: luego sigo definiendo el resto de propiedades comunes a todos los sí­mbolos
    radius: function(feature,map) {
      return 5;
    },
    rotation: 3.14159, // Giro el icono 180 en radianes
    rotate: false, // Activar rotación con dispositivo
    offset: function(feature,map) {
      return [0,0]
    }, // Desplazamiento en pixeles en los ejes X, Y con respecto a su posición según la coordenada
    color: '#3e77f7', // No es el color del sí­mbolo, sino de un pequeño borde que ayuda al contraste con el mapa62, 119, 247
    fill: function(feature,map) {
      let colorPunto;
      const colorProvincia = COLORES_PROVINCIA[feature.getAttribute('codprov')] || 'green';
      colorPunto = colorProvincia;
      return colorPunto;
    }, // Color de relleno
    gradientcolor: '#3e77f7', // Color del borde
    gradient: function(feature,map) {
      return false;
    }, // Degradado entre color de borde e interior
    opacity: 1, // Transparencia. 0(transparente). 1(opaco).
    snaptopixel: true,
  },
});
const vertex = new M.layer.GeoJSON({
  name: 'vertices',
  // url: 'https://projects.develmap.com/attributestable/roivertexcenter.geojson',
  url: 'https://projects.develmap.com/attributestable/roivertexcenterred.geojson',
  extract: true, // Con esta propiedad sale el popup standard con las propiedades
});
//vertex.setStyle(estiloPoint);// Asociamos a la capa el estilo definido
map.addLayers(vertex); // */

// Capa WFS
const campamentos = new M.layer.WFS({
  url: 'http://geostematicos-sigc.juntadeandalucia.es/geoserver/sepim/ows?',
  name: 'campamentos', legend: 'Campamentos',
  namespace: 'sepim',
  geometry: 'POINT',
}, {
  getFeatureOutputFormat: 'json',
  describeFeatureTypeOutputFormat: 'json',
});
map.addWFS(campamentos); // */

const mp = new QueryAttributes({
  collapsible: true,
  collapsed: true, // 1
  position: 'TL', // 'TL' | 'TR' | 'BR' | 'BL'
  tooltip: 'TEST TOOLTIP Consulta de atributos',
  refreshBBOXFilterOnPanning: true, // true | false
  //
  configuration: {
    layer: 'vertices', // 'vertices' | 'PRUEBA_VACIA' // Si no existe se queda vacío el popup del plugin
    pk: 'id', // Parece ser una columna oculta de ID
    initialSort: { name: 'nombre', dir: 'asc' },
    columns: [
      { name: 'id', alias: 'Identificador', visible: false, searchable: false, showpanelinfo: true, align: 'right', type: 'string'},
      { name: 'nombre', alias: 'Nombre Vértice', visible: true, searchable: true, showpanelinfo: true, align: 'left', type: 'string'},
      { name: 'urlficha', alias: 'URL PDF Ficha', visible: true, searchable: false, showpanelinfo: true, align: 'left', type: 'linkURL', typeparam:'Ficha vértice'},
      { name: 'imagemtn50', alias: 'Imagen Hoja MTN50', visible: true, searchable: false, showpanelinfo: true, align: 'left', type: 'image'},
      // { name: 'xutmetrs89', alias: 'Coordenada X (UTM ETRS89)', visible: false, searchable: false, showpanelinfo: false, align: 'left', type: 'string'},
      // { name: 'yutmetrs89', alias: 'Coordenada Y (UTM ETRS89)', visible: false, searchable: false, showpanelinfo: false, align: 'left', type: 'string'},
      // { name: 'lat', alias: 'Latitud', visible: false, searchable: false, showpanelinfo: true, align: 'left', type: 'string'},
      // { name: 'lng', alias: 'Longitud', visible: false, searchable: false, showpanelinfo: true, align: 'left', type: 'string'},
      // { name: 'horto', alias: 'Altitud Ortométrica', visible: false, searchable: false, showpanelinfo: true, align: 'left', type: 'string'},
      // { name: 'calidad', alias: 'Calidad señal', visible: true, searchable: false, showpanelinfo: true, align: 'left', type: 'formatter', typeparam:'*'},
      // { name: 'nivel', alias: 'Vida útil', visible: true, searchable: false, showpanelinfo: true, align: 'left', type: 'percentage' },
      // { name: 'urlcdd', alias: 'URL Centro Descargas', visible: true, searchable: false, showpanelinfo: true, align: 'left', type: 'buttonURL', typeparam:'Acceso CdD' },
      // { name: 'hojamtn50', alias: 'Hoja MTN50', visible: false, searchable: false, showpanelinfo: true, align: 'right', type: 'string' },
      // { name: 'summary', alias: 'Localización', visible: false, searchable: false, showpanelinfo: true, align: 'left', type: 'string'},
      // { name: 'description', alias: 'Descripción completa', visible: false, searchable: true, showpanelinfo: true, align: 'left', type: 'string'},
      // { name: 'pertenencia', alias: 'Pertenencia', visible: false, searchable: true, showpanelinfo: true, align: 'left', type: 'string' },
      // { name: 'municipio', alias: 'Ayuntamiento', visible: false, searchable: true, showpanelinfo: true, align: 'left', type: 'string'},
      // { name: 'codigoine', alias: 'Municipio', visible: false, searchable: true, showpanelinfo: true, align: 'left', type: 'string'},
      // { name: 'codprov', alias: 'Provincia', visible: false, searchable: false, showpanelinfo: false, align: 'left', type: 'string'},
      // { name: 'codauto', alias: 'Autonomía', visible: false, searchable: false, showpanelinfo: false, align: 'left', type: 'string'},
    ],
  }, // */
  filters: true, // true | false // 
});

map.addPlugin(mp); window.mp = mp;
