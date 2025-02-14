const COLORES_PROVINCIA = {
  2:'olive',
  5:'green',
  6:'blue',
  9:'navy',
  10:'springgreeen',
  13:'lightsalmon',
  16:'steelblue',
  19:'orangered',
  28:'red',
  40:'plum',
  42:'lime',
  45:'gold',
  47:'emerald',
  50:'turquoise',
}

/**
 * Creamos el objeto Mapa.APICNIG
 */
const map = M.map({
  container: 'mapjs',
  controls: ['panzoom','panzoombar', 'scale*true', 'scaleline', 'rotate', 'location','backgroundlayers'], //getfeatureinfo: este control es un poco coñazo, siempre está buscando información al hacer clic en el mapa.
  // controls: ['panzoom', 'scale*true', 'scaleline', 'rotate', 'location', 'backgroundlayers', 'getfeatureinfo'],
  zoom: 10 ,  //6
  maxZoom: 20,
  minZoom: 4,
  projection: "EPSG:3857*m",
  center: {
      x: -409000, // -712300,
      y: 4930000, // 4310700,
      draw: false  // Dibuja un punto en el lugar de la coordenada
  },
});

/**
 * e2m:
 * Configuración del plugin
 */
 const mp = new M.plugin.QueryAttributes({
  position: 'TL',
  collapsed: true,
  collapsible: true,
  filters: true,
  refreshBBOXFilterOnPanning: true,
  configuration: {
    layer: 'vertices',
    pk: 'id',
    initialSort: { name: 'nombre', dir: 'asc' },
    columns: [
      { name: 'id', alias: 'Identificador', visible: false, searchable: false, showpanelinfo: true, align: 'right', type: 'string'},
      { name: 'nombre', alias: 'Nombre Vértice', visible: true, searchable: true, showpanelinfo: true, align: 'left', type: 'string'},
      { name: 'xutmetrs89', alias: 'Coordenada X (UTM ETRS89)', visible: false, searchable: false, showpanelinfo: false, align: 'left', type: 'string'},
      { name: 'yutmetrs89', alias: 'Coordenada Y (UTM ETRS89)', visible: false, searchable: false, showpanelinfo: false, align: 'left', type: 'string'},
      { name: 'lat', alias: 'Latitud', visible: false, searchable: false, showpanelinfo: true, align: 'left', type: 'string'},
      { name: 'lng', alias: 'Longitud', visible: false, searchable: false, showpanelinfo: true, align: 'left', type: 'string'},
      { name: 'horto', alias: 'Altitud Ortométrica', visible: false, searchable: false, showpanelinfo: true, align: 'left', type: 'string'},
      { name: 'calidad', alias: 'Calidad señal', visible: true, searchable: false, showpanelinfo: true, align: 'left', type: 'formatter', typeparam:'⭐️'},
      { name: 'nivel', alias: 'Vida útil', visible: true, searchable: false, showpanelinfo: true, align: 'left', type: 'percentage' },
      { name: 'urlficha', alias: 'URL PDF Ficha', visible: true, searchable: false, showpanelinfo: true, align: 'left', type: 'linkURL', typeparam:'📝 Ficha vértice' },
      { name: 'urlcdd', alias: 'URL Centro Descargas', visible: true, searchable: false, showpanelinfo: true, align: 'left', type: 'buttonURL', typeparam:'🔗 Acceso CdD' },
      { name: 'hojamtn50', alias: 'Hoja MTN50', visible: false, searchable: false, showpanelinfo: true, align: 'right', type: 'string' },
      { name: 'summary', alias: 'Localización', visible: false, searchable: false, showpanelinfo: true, align: 'left', type: 'string'},
      { name: 'imagemtn50', alias: 'Imagen Hoja MTN50', visible: true, searchable: false, showpanelinfo: true, align: 'left', type: 'image'},
      { name: 'description', alias: 'Descripción completa', visible: false, searchable: true, showpanelinfo: true, align: 'left', type: 'string'},
      { name: 'pertenencia', alias: 'Pertenencia', visible: false, searchable: true, showpanelinfo: true, align: 'left', type: 'string' },
      { name: 'municipio', alias: 'Ayuntamiento', visible: false, searchable: true, showpanelinfo: true, align: 'left', type: 'string'},
      { name: 'codigoine', alias: 'Municipio', visible: false, searchable: true, showpanelinfo: true, align: 'left', type: 'string'},
      { name: 'codprov', alias: 'Provincia', visible: false, searchable: false, showpanelinfo: false, align: 'left', type: 'string'},
      { name: 'codauto', alias: 'Autonomía', visible: false, searchable: false, showpanelinfo: false, align: 'left', type: 'string'},
    ],
  }
});

// Capa de prueba
const campamentos = new M.layer.WFS({
  url: "http://geostematicos-sigc.juntadeandalucia.es/geoserver/sepim/ows?",
  namespace: "sepim",
  name: "campamentos",
  legend: "Campamentos",
  geometry: 'POINT',
}, {
  getFeatureOutputFormat: 'json',
  describeFeatureTypeOutputFormat: 'json'
});
map.addWFS(campamentos);

// Capa on los vértices geodésicos
const vertex = new M.layer.GeoJSON({
  name: 'vertices',
  url: 'https://projects.develmap.com/apicnig-plugins/attributestable/roivertexcenterred.geojson',
  extract: true, // Con esta propiedad sale el popup standard con las propiedades
});

// Definimos unas reglas de estilo para aplicar a la capa de vértices
let estiloPoint = new M.style.Point({
  icon: {
          /**
           * e2m: En la propiedad form se decide quÃ© forma adopta el icon de las preconfiguradas
           * Valores: BAN|BLAZON|BUBBLE|CIRCLE|LOZENGE|MARKER|NONE|SHIELD|SIGN|SQUARE|TRIANGLE
           */
          /**
           * Este es el punto. En vez de igualar el valor de la propiedad a unos de los valores, lo igualamos a una funciÃ³n anÃ³nima que pasa como como parÃ¡metros el feature y el mapa
           * Con el elemento (feature) puedo acceder a los atributos que tiene el geoJSON. La forma la determina el propietario de la estaciÃ³n.
           * Como valor devuelto por el return es la clase de Mapea que representa a la forma: M.style.form.TRIANGLE para el triÃ¡ngulo y M.style.form.CIRCLE para el cÃ­rculo
           */
          form: function(feature,map) {
                  return M.style.form.CIRCLE;
          },
          //e2m: luego sigo definiendo el resto de propiedades comunes a todos los sÃ­mbolos
          radius: function(feature,map) {
                                  return 5;//5

          },
          rotation: 3.14159,            // Giro el icono 180 en radianes
          rotate: false,                // Activar rotacion con dispositivo
          offset: function(feature,map) {
              return [0,0]
          },               // Desplazamiento en pixeles en los ejes X, Y con respecto a su posiciÃ³n segÃºn la coordenada
          color: '#3e77f7',               // No es el color del sÃ­mbolo, sino de un pequeÃ±o borde que ayuda al contraste con el mapa62, 119, 247
          fill: function(feature,map) {
                              let colorPunto;
                              const colorProvincia = COLORES_PROVINCIA[feature.getAttribute('codprov')] || 'green';
                              colorPunto = colorProvincia;
                              return colorPunto;
          },  // Color de relleno
          gradientcolor:  '#3e77f7',       // Color del borde
          gradient:  function(feature,map) {
                                  return false;
                  },               // Degradado entre color de borde e interior
          opacity: 1,              // Transparencia. 0(transparente). 1(opaco).
          snaptopixel: true,
  },
});

vertex.setStyle(estiloPoint);// Asociamos a la capa el estilo definido

map.addLayers(vertex);

map.addPlugin(mp);

// Este plugin con la información de coordenadas nos ayudará
const plugMouse = new M.plugin.MouseSRS({
  tooltip: "Muestra coordenadas",
  srs: "EPSG:4326",
  label: "WGS84",
  precision: 4,
  geoDecimalDigits: 3,
  utmDecimalDigits: 2,
  activeZ: false
});
map.addPlugin(plugMouse);
