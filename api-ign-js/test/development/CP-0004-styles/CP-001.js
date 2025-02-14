/* eslint-disable spaced-comment,no-loop-func,object-property-newline,no-param-reassign,no-proto,no-console,no-plusplus,object-curly-newline,max-len,camelcase */
import { map as Mmap } from 'M/mapea';
import Feature from 'M/feature/Feature';
import Point from 'M/style/Point';
import Line from 'M/style/Line';
import Polygon from 'M/style/Polygon';
import Generic from 'M/style/Generic';
import {
  TOP, BOTTOM, MIDDLE, ALPHABETIC, HANGING, IDEOGRAPHIC,
} from 'M/style/Baseline';
import { RIGHT, LEFT, CENTER } from 'M/style/Align';
import {
  BAN, BLAZON, BUBBLE, CIRCLE, LOZENGE, MARKER, NONE, SHIELD, SIGN, SQUARE, TRIANGLE,
} from 'M/style/Form';
import { info } from 'M/dialog';
import OLStyle from 'ol/style/Style';
import OLStyleFill from 'ol/style/Fill';
import OLStyleStroke from 'ol/style/Stroke';
import CircleStyle from 'ol/style/Circle';
import OLStyleIcon from 'ol/style/Icon';
import OLStyleRegularShape from 'ol/style/RegularShape';
import Centroid from '../../../src/impl/ol/js/style/Centroid';
import { vector_001 } from '../layers/vector/vector';

const capaPrueba = vector_001;
window.M.style = { Point, Line, Polygon, Generic };
window.ol = { style: { Style: OLStyle, Centroid, Fill: OLStyleFill, Stroke: OLStyleStroke, Circle: CircleStyle, Icon: OLStyleIcon, RegularShape: OLStyleRegularShape } };

// START Pruebas con pointVendor
const pointVendor = undefined; // Sin vendorOptions
// Ejemplo estilo con API_CNIG:{ "radius": 25, "fill": { "color": "blue", "opacity": 0.5 }, "stroke": { "color": "#F54700", "width": 5, "linedash": [ 10, 10 ], "linedashoffset": 5, "linecap": "butt" }, "label": {} }
// const pointVendor = new OLStyle({ image: new CircleStyle({ radius: 25, fill: new OLStyleFill({ color: '#0000ff88' }), stroke: new OLStyleStroke({ color: '#F54700', width: 5, lineDash: [10, 10], lineDashOffset: 5, lineCap: 'butt' }) }) });
// Ejemplo con Array
// const pointVendor = [new OLStyle({ image: new CircleStyle({ radius: 25, fill: new OLStyleFill({ color: '#0000ff88' }), stroke: new OLStyleStroke({ color: '#F54700', width: 5, lineDash: [10, 10], lineDashOffset: 5, lineCap: 'butt' }) }) }), new OLStyle({ image: new CircleStyle({ radius: 7, fill: new OLStyleFill({ color: '#00ff00' }), stroke: new OLStyleStroke({ color: '#888800', width: 3, lineDash: [5, 5] }) }) })];

// Pruebas en consola
// var consoleTestPoint = new M.style.Point({ 'radius': 25, 'fill': { 'color': 'blue', 'opacity': 0.5 }, 'stroke': { 'color': '#F54700', 'width': 5, 'linedash': [10, 10], 'linedashoffset': 5, 'linecap': 'butt' }, 'label': {} }); window.mapa.getLayers()[1].setStyle(consoleTestPoint);
// var consoleTestPoint = new M.style.Point(undefined, new ol.style.Style({ image: new ol.style.Circle({ radius: 25, fill: new ol.style.Fill({ color: '#0000ff88' }), stroke: new ol.style.Stroke({ color: '#F54700', width: 5, lineDash: [10, 10], lineDashOffset: 5, lineCap: 'butt' }) }) })); window.mapa.getLayers()[1].setStyle(consoleTestPoint);
// var consoleTestPoint = new M.style.Point(undefined, [new ol.style.Style({ image: new ol.style.Circle({ radius: 25, fill: new ol.style.Fill({ color: '#0000ff88' }), stroke: new ol.style.Stroke({ color: '#F54700', width: 5, lineDash: [10, 10], lineDashOffset: 5, lineCap: 'butt' }) }) }), new ol.style.Style({ image: new ol.style.Circle({ radius: 7, fill: new ol.style.Fill({ color: '#00ff00' }), stroke: new ol.style.Stroke({ color: '#888800', width: 3, lineDash: [5, 5] }) }) })]); window.mapa.getLayers()[1].setStyle(consoleTestPoint);

// Prueba de ambos parámetros solo en consola
// var consoleTestPoint = new M.style.Point({ 'radius': 8, 'fill': { 'color': 'Black' }, 'stroke': { 'color': 'Black', 'width': 5, 'linedash': [10, 10] } }, new ol.style.Style({ image: new ol.style.Circle({ radius: 7, fill: new ol.style.Fill({ color: '#00ff00' }), stroke: new ol.style.Stroke({ color: '#888800', width: 3, lineDash: [5, 5] }) }) })); window.mapa.getLayers()[1].setStyle(consoleTestPoint);

// Pruebas de set (Si el vendorOptions esta presente es reemplazado)
// var sVSet = window.mapa.getLayers()[1].getStyle(); sVSet.set('radius', '10'); sVSet.set('fill.color', 'red'); sVSet.set('stroke.color', 'yellow'); sVSet.set('stroke.width', '5');

//Pruebas antiguas (NO NORMALIZADAS PARA ENTENDER BIEN)
// Color in classOLStyleIcon never used // var pointICONVendor = new M.style.Point({ radius: 12 }, new ol.style.Style({ radius: 10, fill: new ol.style.Fill({ color: 'blue' }), stroke: new ol.style.Stroke({ color: 'red', width: 7 }), image: new ol.style.Icon({ anchor: [1, 2], anchorOrigin: 'top-left', anchorXUnits: 'fraction', anchorYUnits: 'fraction', crossOrigin: null, src: 'https://avatars.githubusercontent.com/u/50570110?v=4', offset: [3, 4], offsetOrigin: 'top-left', size: [50, 150], opacity: 0.9, scale: 1, rotation: 0.5, rotateWithView: false }) })); console.log(pointICONVendor); window.mapa.getLayers()[1].setStyle(pointICONVendor);
// const pointVendor = new OLStyle({ radius: 10, fill: new OLStyleFill({ color: 'blue' }), stroke: new OLStyleStroke({ color: 'red', width: 7 }), image: new OLStyleIcon({ anchor: [1, 2], anchorOrigin: 'top-left', anchorXUnits: 'fraction', anchorYUnits: 'fraction', crossOrigin: null, src: 'https://avatars.githubusercontent.com/u/50570110?v=4', offset: [3, 4], offsetOrigin: 'top-left', size: [50, 150], opacity: 0.9, scale: 1, rotation: 0.5, rotateWithView: false }) });
// var rgFont = new ol.style.RegularShape({ radius: 30, fill: 'blue', rotation: 0.6, rotateWithView: false });rgFont.setOpacity(0.8);rgFont.color_ = 'red'; rgFont.fontSize_ = 17; rgFont.stroke_ = new ol.style.Stroke({ color: 'green', width: 7 }); rgFont.fill_ = new ol.style.Fill({ color: 'blue' }); rgFont.radius_ = 20; rgFont.form_ = 'bubble'; rgFont.gradient_ = true; rgFont.offset_ = [0.5, 0.5]; rgFont.glyph_ = 'g-cartografia-alerta'; var pointFONTVendor = new M.style.Point({ radius: 12 }, new ol.style.Style({ radius: 10, fill: new ol.style.Fill({ color: 'blue' }), stroke: new ol.style.Stroke({ color: 'red', width: 7 }), image: rgFont })); console.log(pointFONTVendor); window.mapa.getLayers()[1].setStyle(pointFONTVendor);
// eslint-disable-next-line no-underscore-dangle
// const pointVendor = { const rgFont = new OLStyleRegularShape({ radius: 30, fill: 'blue', rotation: 0.6, rotateWithView: false }); rgFont.setOpacity(0.8); rgFont.color_ = 'red'; rgFont.fontSize_ = 17; rgFont.stroke_ = new OLStyleStroke({ color: 'green', width: 7 }); rgFont.fill_ = new OLStyleFill({ color: 'blue' }); rgFont.radius_ = 20; rgFont.form_ = 'bubble'; rgFont.gradient_ = true; rgFont.offset_ = [0.5, 0.5]; rgFont.glyph_ = 'g-cartografia-alerta'; const pointFONTVendor = new OLStyle({ radius: 10, fill: new OLStyleFill({ color: 'blue' }), stroke: new OLStyleStroke({ color: 'red', width: 7 }), image: rgFont }); return pointFONTVendor; };

// FIN Pruebas con pointVendor

// START Pruebas con lineVendor
const lineVendor = undefined; // Sin vendorOptions
// Ejemplo estilo con API_CNIG: { "fill": { "color": "red", "opacity": 1 }, "stroke": { "color": "#F54700", "width": 20, "linedash": [ 5, 5, 20 ], "linedashoffset": 5, "linecap": "butt", "linejoin": "miter", "opacity": 0.5 }, "label": {} }
// const lineVendor = [new OLStyle({ fill: new OLStyleFill({ color: 'red', opacity: 1 }), stroke: new OLStyleStroke({ color: '#F54700', width: 20, lineDash: [5, 5, 20], lineDashOffset: 5, lineCap: 'butt', lineJoin: 'miter', opacity: 0.5 }) })];
// Ejemplo con Array
// const lineVendor = [new OLStyle({ stroke: new OLStyleStroke({ color: 'blue', width: 3 }) }), new OLStyle({ stroke: new OLStyleStroke({ color: 'red', width: 6, lineDash: [20, 8], lineCap: 'butt' }) })];

// Pruebas en consola
// var consoleTestLine = new M.style.Line({ 'fill': { 'color': 'red', 'opacity': 1 }, 'stroke': { 'color': '#F54700', 'width': 20, 'linedash': [5, 5, 20], 'linedashoffset': 5, 'linecap': 'butt', 'linejoin': 'miter', 'opacity': 0.5 }, 'label': {} }); window.mapa.getLayers()[1].setStyle(consoleTestLine);
// var consoleTestLine = new M.style.Line(undefined, [new ol.style.Style({ fill: new ol.style.Fill({ color: 'red', opacity: 1 }), stroke: new ol.style.Stroke({ color: '#F54700', width: 20, lineDash: [5, 5, 20], lineDashOffset: 5, lineCap: 'butt', lineJoin: 'miter', opacity: 0.5 }) })]); window.mapa.getLayers()[1].setStyle(consoleTestLine);
// var consoleTestLine = new M.style.Line(undefined, [new ol.style.Style({ stroke: new ol.style.Stroke({ color: 'blue', width: 3 }) }), new ol.style.Style({ stroke: new ol.style.Stroke({ color: 'red', width: 6, lineDash: [20, 8], lineCap: 'butt' }) })]); window.mapa.getLayers()[1].setStyle(consoleTestLine);

// Prueba de ambos parámetros solo en consola
// var consoleTestLine = new M.style.Line({ 'fill': { 'color': 'black', 'opacity': 1 }, 'stroke': { 'color': 'black', 'width': 20, 'linedash': [5, 5, 20], 'linedashoffset': 5, 'linecap': 'butt', 'linejoin': 'miter', 'opacity': 0.5 }, 'label': {} }, [new ol.style.Style({ fill: new ol.style.Fill({ color: 'red', opacity: 1 }), stroke: new ol.style.Stroke({ color: '#F54700', width: 20, lineDash: [5, 5, 20], lineDashOffset: 5, lineCap: 'butt', lineJoin: 'miter', opacity: 0.5 }) })]); window.mapa.getLayers()[1].setStyle(consoleTestLine);

// Pruebas de set (Si el vendorOptions esta presente es reemplazado)
// var sVSet = window.mapa.getLayers()[1].getStyle(); sVSet.set('stroke.color', 'yellow'); sVSet.set('stroke.width', '5');

// FIN Pruebas con lineVendor

// START Pruebas con polygonVendor
const polygonVendor = undefined; // Sin vendorOptions
// Ejemplo estilo con API_CNIG: { "fill": { "color": "red", "opacity": 1 }, "stroke": { "color": "#F54700", "width": 20, "linedash": [ 5, 5, 20 ], "linedashoffset": 5, "linecap": "butt", "linejoin": "miter", "opacity": 0.5 }, "label": {} }
// (El width de 20 se ignora por Polygon.DEFAULT_WIDTH_POLYGON de updateCanvas)
// const polygonVendor = [new OLStyle({ fill: new OLStyleFill({ color: 'red', opacity: 1 }), stroke: new OLStyleStroke({ color: '#F54700', width: 20, lineDash: [5, 5, 20], lineDashOffset: 5, lineCap: 'butt', lineJoin: 'miter', opacity: 0.5 }) })];
// Ejemplo con Array
// const polygonVendor = [new OLStyle({ stroke: new OLStyleStroke({ color: 'red', width: 3, lineDash: [20, 8], lineCap: 'butt' }) }), new OLStyle({ stroke: new OLStyleStroke({ color: 'blue', width: 1 }) })];

// Pruebas en consola
// var consoleTestPolygon = new M.style.Polygon({ 'fill': { 'color': 'red', 'opacity': 1 }, 'stroke': { 'color': '#F54700', 'width': 20, 'linedash': [5, 5, 20], 'linedashoffset': 5, 'linecap': 'butt', 'linejoin': 'miter', 'opacity': 0.5 }, 'label': {} }); window.mapa.getLayers()[1].setStyle(consoleTestPolygon);
// var consoleTestPolygon = new M.style.Polygon(undefined, [new ol.style.Style({ fill: new ol.style.Fill({ color: 'red', opacity: 1 }), stroke: new ol.style.Stroke({ color: '#F54700', width: 20, lineDash: [5, 5, 20], lineDashOffset: 5, lineCap: 'butt', lineJoin: 'miter', opacity: 0.5 }) })]); window.mapa.getLayers()[1].setStyle(consoleTestPolygon);
// var consoleTestPolygon = new M.style.Polygon(undefined, [new ol.style.Style({ stroke: new ol.style.Stroke({ color: 'red', width: 3, lineDash: [20, 8], lineCap: 'butt' }) }), new ol.style.Style({ stroke: new ol.style.Stroke({ color: 'blue', width: 1 }) })]); window.mapa.getLayers()[1].setStyle(consoleTestPolygon);

// Prueba de ambos parámetros solo en consola
// var consoleTestPolygon = new M.style.Line({ 'fill': { 'color': 'black', 'opacity': 1 }, 'stroke': { 'color': 'black', 'width': 20, 'linedash': [5, 5, 20], 'linedashoffset': 5, 'linecap': 'butt', 'linejoin': 'miter', 'opacity': 0.5 }, 'label': {} }, [new ol.style.Style({ fill: new ol.style.Fill({ color: 'red', opacity: 1 }), stroke: new ol.style.Stroke({ color: '#F54700', width: 20, lineDash: [5, 5, 20], lineDashOffset: 5, lineCap: 'butt', lineJoin: 'miter', opacity: 0.5 }) })]); window.mapa.getLayers()[1].setStyle(consoleTestPolygon);

// Pruebas de set (Si el vendorOptions esta presente es reemplazado)
// var sVSet = window.mapa.getLayers()[1].getStyle(); sVSet.set('fill.color', 'red'); sVSet.set('stroke.color', 'yellow'); sVSet.set('stroke.width', '5');

// FIN Pruebas con polygonVendor

const mapa = Mmap({
  container: 'map',
  projection: 'EPSG:3857*m',
  bbox: [-662541.2130577073, 4348884.724285094, -589161.665903938, 4383472.479584137], // punto
  // bbox: [-310002.719495043, 4005086.440611637, -212316.19734658775, 4047432.554281625], // linea
  // bbox: [167553.43719930138, 3994732.042590404, 350849.43102715403, 4100215.141623947], // poligono
});
window.mapa = mapa;

// label prioriza sobre icon

// Estilo de Punto
// const estilo = new Point({
//     // Radio del punto. Numérico
//     radius: 50,
//     // Relleno
//     fill: {
//       color: 'blue',
//       //opacity: 1,
//     },
//     // Borde exterior
//     stroke: {
//       color: 'red',
//       // Grosor en pixeles
//       width: 6,
//       // Patrón de distancias
//       linedash: [5, 5, 20],
//       // Offset de fase
//       //linedashoffset: 30,
//       // Estilo de final de línea. round (borde redondeado)|square(borde cuadrado ligeramente alargado)|butt(borde cuadrado afilado)
//       linecap: 'butt', // solo aplica cuando hay linedash
//       // Estilo de conexión de segmentos. miter(inglete)|round(redondo)|bevel(bisel)
//       //linejoin: 'miter', //no se aprecia cambio por no haber conexion en un punto
//       // Tamaño máximo segmento de conexión
//       // miterlimit: 15, //no se aprecia cambio
//       // Opacidad
//       // opacity: 0.3,
//     },
//     // Etiquetado
//     /*label: {
//       // Texto a escribir
//       text: 'Etiqueta',
//       // Fuente y características
//       font: 'bold 30px Comic Sans MS',
//       // Color de la fuente. Hexadecimal, nominal
//       color: '#FF0000' || 'red',
//       // Debe o no rotar con la pantalla
//       rotate: false,
//       // Factor de escala de la fuente
//       //scale: 0.5,
//       // Desplazamiento en pixeles
//       //offset: [10, 20],
//       // Halo de la fuente
//       stroke: {
//         // Color de relleno del halo. Hexadecimal, nominal
//         color: 'black' || '#FFF000',
//         // Grosor en píxeles del halo
//         width: 5,
//         // Patrón de distancias de la línea
//         linedash: [5, 5, 20],
//         // Offset de fase
//         //linedashoffset: 5,
//         // Estilo de final de línea. round (borde redondeado)|square(borde cuadrado ligeramente alargado)|butt(borde cuadrado afilado)
//         //linecap: 'butt',
//         // Estilo de conexión de segmentos. miter(inglete)|round(redondo)|bevel(bisel)
//         //linejoin: 'round',
//         // Tamaño máximo segmento de conexión
//         //miterlimit: 15,
//       },
//       // Rotación de la etiqueta
//       //rotation: 0.5,
//       // Alineación. RIGHT|LEFT|CENTER
//       align: CENTER,
//       // Altura de la etiqueta. TOP|BOTTOM|MIDDLE|
//       // ALPHABETIC|HANGING|IDEOGRAPHIC
//       baseline: BOTTOM, // ALPHABETIC ~= BOTTOM ~= IDEOGRAPHIC | HANGING === TOP
//     },*/
//     // Icono tipo imagen
//     /*icon: {
//       // Url de la imagen
//       src: 'https://dev.w3.org/SVG/tools/svgweb/samples/svg-files/mozilla.svg',
//       // Rotación de la imagen
//       //rotation: 0.5,
//       // Factor de escala
//       //scale: 0.2,
//       // Transparencia del icono. 0(transparente)|1(opaco)
//       //opacity: 0.8,
//       // Desplazamiento respecto al punto
//       //anchor: [2, 2],
//       // Ubicación inicial de la coordenada respecto al icono
//       //anchororigin: 'bottom-right',
//       // Unidades de desplazamiento de anchor. fraction | pixel
//       //anchorxunits: 'pixel',
//       //anchoryunits: 'pixel',
//       // Rotación con dispositivo
//       //rotate: true,
//       // Offset permite recortar la imagen
//       // Punto de referencia para el corte. bottom-left/right|top-left/right
//       //offsetorigin: 'top-left',
//       // Píxeles a mover el punto de referencia en cada eje
//       //offset: [20, 0],
//       // Píxeles a recortar desde el offset en cada eje
//       //size: [300, 300],
//       // null||'Anonymous'(permite la descarga no autenticada de la imagen de origen cruzado)
//       crossorigin: 'Anonymus',
//       // Renderizado. true(nítido)|false(desenfoque)
//       //snaptopixel: false, //no se aprecia diferencia
//       // Relleno del SVG
//       fill: {
//         // Color de relleno. Hexadecimal, nominal
//         color: 'grey',
//         // Transparencia. 0(transparente)|1(opaco)
//         //opacity: 0.5,
//       },
//       // Halo del SVG
//       stroke: {
//         // Hexadecimal, nominal
//         color: 'white',
//         // Tamaño
//         width: 2,
//       },
//     },*/
//     // Icono tipo FontSymbol
//     /*icon: {
//       // Forma del fontsymbol.
//       // BAN(cículo)|BLAZON(diálogo cuadrado)|BUBBLE(diálogo redondo)|CIRCLE(círculo)|LOZENGE(diamante)|MARKER(diálogo redondeado)
//       // NONE(ninguno)|SHIELD(escudo)|SIGN(triángulo)|SQUARE(cuadrado)|TRIANGLE(triángulo invertido)
//       form: TRIANGLE,
//       // Clase fuente
//       //class: 'g-cartografia-alerta',
//       // Tamaño de la fuente
//       //fontsize: 0.5,
//       // Tamaño
//       radius: 20,
//       // Giro del icono en radianes
//       rotation: 3.14,
//       // Activar rotación con dispositivo
//       //rotate: false,
//       // Desplazamiento en píxeles en los ejes x,y
//       //offset: [0, 0],
//       // Hexadecimal, nominal
//       color: '006CFF' || 'blue',
//       // Color de relleno. Hexadecimal, nominal
//       fill: '#8A0829' || 'red',
//       // Color del borde. Hexadecimal, nominal
//       //gradientcolor: '#088A85' || 'blue',
//       // Degradado entre color de borde e interior
//       //gradient: true,
//       // Transparencia. 0(transparente)|1(opaco)
//       //opacity: 0.5,
//     },*/
// });

// Estilo de Linea
// const estilo = new Line({
//   // Relleno de la línea
//   fill: {
//     // Color de relleno. Hexadecimal, nominal
//     color: 'green',
//     // Grosor de la linea
//     //width: 30,
//     // Transparencia. 0(transparente)|1(opaca)
//     //opacity: 0.5,
//     // Patrones para la línea
//     /*pattern: {
//       // Nombre del patrón. hatch(sombreado)|cross(cruz)|dot(punto)|circle(círculo)|square(cuadrado)|tile(mosaico)
//       // woven(tejido)|crosses(cruces)|caps(tapas)|nylon(nylon)|hexagon(hexágono)|cemetry(cementerio)|sand(arena)|conglomerate(conglomerado)|gravel(grava)
//       // brick(ladrillo)|dolomite(donomita)|coal(carbón)|breccia(brecha)|clay(arcilla)|flooded(inundado)|chaos(caos)|grass(hierba)|swamp(pantano)|wave(ola)
//       // vine(vid)|forest(bosque)|scrub(matorral)|tree(árbol)|pine(pino)|pines(pinos)|rock(rock)|rocks(rocks)|Image(Imagen)
//       name: 'brick',
//       // Tamaño del patrón
//       size: 5,
//       // Escalado del patrón
//       //scale: 3,
//       // SOLO ICONO:
//       // Si name tiene valor 'ICON'
//       // Color del patrón.Hexadecimal, nominal
//       color: '#FF0000' || 'red',
//       // Ángulo de rotación
//       //rotation: 90, // ! no hace nada con patron que no es imagen
//       // Desplazamiento del patrón
//       //offset: 5,
//       // Espacio
//       //spacing: 2,
//       // Clase fuente
//       //class: 'g-cartografia-save',
//       // Si name tiene valor Image
//       // Url de la imagen para el patrón.
//       //src: 'https://dev.w3.org/SVG/tools/svgweb/samples/svg-files/mozilla.svg', // ! problema de cors
//     }*/
//   },
//   // borde exterior de la línea
//   stroke: {
//     // Color del borde exterior. Hexadecimal, nominal
//     color: 'red',
//     // Grosor del borde, superior al de fill para su correcta visualización ya que si no quedaría por debajo del relleno
//     width: 20,
//     // Patrón de distancias
//     linedash: [10, 15],
//     // Offset de fase
//     //linedashoffset: 45,
//     // Estilo de final de línea. round (borde redondeado)|square(borde cuadrado ligeramente alargado)|butt(borde cuadrado afilado)
//     linecap: 'butt',
//     // Estilo de conexión de segmentos. miter(inglete)|round(redondo)|bisel(bisel)
//     linejoin: 'bevel', //no compatible con linedash
//     // Tamaño máximo segmento de conexión
//     //miterlimit: 5, //no se aprecia diferencia
//     // Opacidad
//     opacity: 1,
//   },
//   // etiquetado de la línea
//   label: {
//     // Texto o función de etiquetado
//     text: 'Tres Tristes Tigres',
//     // Fuente de etiquetado
//     font: 'bold 50px Comic Sans MS',
//     // Escalado a aplicar
//     //scale: 0.5,
//     // Desplazamiento de etiquetado en píxeles
//     offset: [20, 30],
//     // Color de la etiqueta. Hexadecimal, nominal
//     color: 'black',
//     // Halo de la etiqueta
//     stroke: {
//       // Color del halo. Hexadecimal, nominal
//       color: '#C8FE2E',
//       // Grosor del halo
//       width: 3,
//       // Patrón de distancias
//       //linedash: [5, 5],
//       // Offset de fase
//       //linedashoffset: 10,
//       // Estilo de final de línea. round (borde redondeado)|square(borde cuadrado ligeramente alargado)|butt(borde cuadrado afilado)
//       linecap: 'butt',
//       // Estilo de conexión de segmentos. miter(inglete)|round(redondo)|bevel(bisel)
//       linejoin: 'round',
//       // Tamaño máximo segmento de conexión
//       //miterlimit: 15, //no se aprecia diferencia
//     },
//     // Rotación con dispositivo
//     //rotate: false,
//     // Ángulo de rotación
//     //rotation: 0.5,
//     // Alineación. RIGHT|LEFT|CENTER
//     //align: LEFT,
//     // Altura de la etiqueta. TOP|BOTTOM|MIDDLE|
//     // ALPHABETIC | HANGING | IDEOGRAPHIC
//     //baseline: TOP,
//     // Efecto listo
//     //smooth: true,
//     // Desbordamiento de texto ellipsis|hidden|visible
//     //textoverflow: 'hidden',
//     // Propiedad que define el ancho minimo de un elemento
//     //minwidth: 60,
//     // Seguimiento de la geometría. IMPORTANTE: puede afectar seriamente al rendimiento si está activado
//     //path: true,
//   }
// });

// Estilo de Polígono
// const estilo = new Polygon({
//   //Relleno del polígono
//   fill: {
//     // Color del borde. Hexadecimal, nominal
//     color: '#6A0888',
//     // Opacidad del relleno
//     opacity: 1,
//     // Patrón de relleno
//     pattern: {
//       // Nombre del patrón. // hatch(sombreado)|cross(cruz)|dot(punto)|circle(círculo)|square(cuadrado)|tile(mosaico)|
//       // woven(tejido)|crosses(cruces)|caps(tapas)|nylon(nylon)|hexagon(hexágono)|cemetry(cementerio)|sand(arena)|
//       // conglomerate(conglomerado)|gravel(grava)|brick(ladrillo)|dolomite(donomita)|coal(carbón)|breccia(brecha)|
//       // clay(arcilla)|flooded(inundado)|chaos(caos)|grass(hierba)|swamp(pantano)|wave(ola)| vine(vid)|forest(bosque)|
//       // scrub(matorral)|tree(árbol)|pine(pino)|pines(pinos)|rock(rock)|rocks(rocks)|IMAGE(Imagen)
//       name: 'brick',
//       // Escala del patrón
//       scale: 2,
//       // SOLO ICONO:
//       // Si name tiene valor ICON
//       // Tamaño del patrón
//       //size: 5,
//       // Separación del patrón
//       spacing: 20,
//       // Rotación del patrón
//       rotation: 20,
//       // Desplazamiento en pixeles
//       offset: 21,
//       // Color del patrón. Hexadecimal, nominal
//       color: 'orange',
//       // Clase fuente
//       //class: 'g-cartografia-save', //no se aprecia diferencia
//       // si name tiene valor IMAGE
//       //src: 'https://dev.w3.org/SVG/tools/svgweb/samples/svg-files/mozilla.svg', // ! problema de cors
//     }
//   },
//   // borde del polígono
//   stroke: {
//     // Color del borde. Hexadecimal, nominal
//     color: '#00F',
//     // Ancho de la línea
//     width: 30,
//     // Patrón de distancias
//     //linedash: [5, 10, 15],
//     // Offset de fase
//     //linedashoffset: 1,
//     // Estilo de final de línea. round (borde redondeado)|square(borde cuadrado ligeramente alargado)|butt(borde cuadrado afilado)
//     //linecap: 'butt',
//     // Estilo de conexión de segmentos. miter(inglete)|round(redondo)|bevel(bisel)
//     linejoin: 'miter', // no compatible con linedash
//     // Tamaño máximo segmento de conexión
//     miterlimit: 5, //no se aprecia diferencia
//     // Opacidad
//     opacity: 1,
//     // Patrón de línea
//     pattern: {
//       // Nombre del patrón. hatch|cross|dot|circle
//       // square|tile|woven|crosses|caps|nylon|hexagon|cemetry
//       // sand|conglomerate|gravel|brick|dolomite|coal|breccia
//       // clay|flooded|chaos|grass|swamp|wave|vine|forest|scrub
//       // tree|pine|pines|rock|rocks|IMAGE
//       name: 'wave',
//       // Tamaño del patrón
//       size: 1,
//       // Escalado del patrón
//       scale: 2,
//       // SOLO ICONO:
//       // Si name tiene valor 'ICON'
//       // Color del patrón
//       color: '#FF0000',
//       // Ángulo de rotación
//       rotation: 0,
//       // Desplazamiento del patrón
//       //offset: 5,
//       // Espacio
//       spacing: 2,
//       // Clase de la fuente
//       //class: 'g-cartografia-save',
//       // Si name tiene valor 'Image'
//       // Url de la imagen para el patrón.
//       //src: 'https://dev.w3.org/SVG/tools/svgweb/samples/svg-files/mozilla.svg',
//     }
//   },
//   //etiqueta del polígono
//   label: {
//     // Texto etiqueta. fijo (texto fijo)|función(función JS que devuelve el valor)|atributo(atributo de la capa)
//     text: 'Tres Tristes Tigres',
//     // Fuente de la etiqueta
//     font: 'bold 16px Courier New',
//     // Escala de la etiqueta
//     scale: 1,
//     // Desplazamiento en píxeles
//     //offset: [10, 0],
//     // Color del texto
//     color: '#000',
//     // Halo del texto
//     /*stroke: {
//       // Color de la fuente. Hexadecimal, nominal
//       color: '#FF0000' || 'red',
//       // Grosor del halo
//       width: 5,
//       // Patrón de distancias
//       linedash: [5, 5, 20],
//       // Offset de fase
//       linedashoffset: 1,
//       // Estilo de final de línea. round|square|butt
//       linecap: 'square',
//       // Estilo de conexión de segmentos. miter|round|bevel
//       linejoin: 'miter',
//       // Tamaño máximo segmento de conexión
//       miterlimit: 15,
//     },*/
//     // Rotación con dispositivo
//     rotate: true,
//     // Rotación de la etiqueta
//     //rotation: 0.3,
//     // Alineación horizontal. CENTER|LEFT|RIGHT
//     //align: LEFT,
//     // Altura de la etiqueta. TOP|BOTTOM|MIDDLE|
//     // ALPHABETIC|HANGING|IDEOGRAPHIC
//     //baseline: BOTTOM,
//   }
// });

// capaPrueba.setStyle(estilo);

const pointFeature = new Feature('featurePrueba001', {
  type: 'Feature',
  id: 'prueba_pol_wfst.1986',
  geometry: {
    type: 'Point',
    coordinates: [-626051.84, 4365196.20],
    geometry_name: 'geometry',
    properties: {
      cod_ine_municipio: '41091',
      cod_ine_provincia: '-',
      area: 1234,
      perimetro: 345,
      cod_ine_comunidad: '-',
      nombre: 'feature1',
      nom_provincia: 'Cádiz',
      alias: 'f1',
      nom_ccaa: 'Andalucía',
    },
  },
});

const lineFeature = new Feature('featurePrueba002', {
  type: 'Feature',
  id: 'prueba_pol_wfst.1987',
  geometry: {
    type: 'LineString',
    coordinates: [
      [-232910.00600234355, 4033901.3328427672],
      [-290293.77947248437, 4019678.0840030923],
      [-290293.77947248437, 4033901.3328427672],
    ],
    geometry_name: 'geometry',
    properties: {
      cod_ine_municipio: '41091',
      cod_ine_provincia: '-',
      area: 1234,
      perimetro: 345,
      cod_ine_comunidad: '-',
      nombre: 'feature2',
      nom_provincia: 'Cádiz',
      alias: 'f2',
      nom_ccaa: 'Andalucía',
    },
  },
});

const polFeature = new Feature('featurePrueba003', {
  type: 'Feature',
  id: 'prueba_pol_wfst.1985',
  geometry: {
    type: 'Polygon',
    coordinates: [[
      [263770.72265536943, 4085361.4590256726],
      [230910.00600234355, 4031901.3328427672],
      [288293.77947248437, 4017678.0840030923],
      [263770.72265536943, 4085361.4590256726],
    ]],
  },
  geometry_name: 'geometry',
  properties: {
    cod_ine_municipio: '41091',
    cod_ine_provincia: '-',
    area: 1234,
    perimetro: 345,
    cod_ine_comunidad: '-',
    nombre: 'feature3',
    nom_provincia: 'Cádiz',
    alias: 'f3',
    nom_ccaa: 'Andalucía',
  },
});
mapa.addLayers(capaPrueba); window.capaPrueba = capaPrueba;

////////////////////////////////
////// OPCIONES DE ESTILO //////
////////////////////////////////
const popupDePruebas = window.document.getElementById('popup_de_test');
const abrirPopup = window.document.getElementById('abrir_test');
abrirPopup.addEventListener('click', () => { popupDePruebas.className = 'active'; });

const cerrarPopup = window.document.getElementById('cerrar_test');
cerrarPopup.addEventListener('click', () => { popupDePruebas.className = 'notactive'; });

let estilo = new Point(Point.DEFAULT);
let styleType = null;

const styleOptions = {
  point: [
    { id: 'fill.color', texto: 'fill color', valores: ['#F54700', 'blue'], indexValor: 0 },
    { id: 'radius', texto: 'radius', valores: [5, 15, 25], indexValor: 0 },
    { id: 'fill.opacity', texto: 'fill opacity', valores: [1, 0.5, 0.2], indexValor: 0 },
    { id: 'stroke.color', texto: 'stroke color', valores: ['#F54700', 'blue'], indexValor: 0 },
    { id: 'stroke.width', texto: 'stroke width', valores: [5, 10, 20], indexValor: 0 },
    { id: 'stroke.linedash', texto: 'stroke linedash', valores: [[5, 5, 20], [10, 10]], indexValor: 0 },
    { id: 'stroke.linedashoffset', texto: 'stroke linedashoffset', valores: [5, 10, 15], indexValor: 0 },
    { id: 'stroke.linecap', texto: 'stroke linecap', valores: ['square', 'round', 'butt'], indexValor: 0 },
    { id: 'stroke.linejoin', texto: 'stroke linejoin', valores: ['miter', 'round', 'bevel'], indexValor: 0 },
    { id: 'stroke.miterlimit', texto: 'stroke miterlimit', valores: [5, 10, 15], indexValor: 0 },
    { id: 'stroke.opacity', texto: 'stroke opacity', valores: [1, 0.5, 0.2], indexValor: 0 },
    { id: 'label.rotation', texto: 'label rotation', valores: [0.5, 0.8], indexValor: 0 },
    { id: 'label.text', texto: 'label text', valores: ['etiqueta', 'texto'], indexValor: 0 },
    { id: 'label.font', texto: 'label font', valores: ['bold 19px Comic Sans MS', 'bold 40px Courier New'], indexValor: 0 },
    { id: 'label.color', texto: 'label color', valores: ['black', '#0f0'], indexValor: 0 },
    { id: 'label.rotate', texto: 'label rotate', valores: [true, false], indexValor: 0 },
    { id: 'label.scale', texto: 'label scale', valores: [2, 3, 1], indexValor: 0 },
    { id: 'label.align', texto: 'label align', valores: [RIGHT, LEFT, CENTER], indexValor: 0 },
    { id: 'label.baseline', texto: 'label baseline', valores: [TOP, BOTTOM, MIDDLE, ALPHABETIC, HANGING, IDEOGRAPHIC], indexValor: 0 },
    { id: 'label.offset', texto: 'label offset', valores: [[20, 20], [0, 20], [20, 0]], indexValor: 0 },
    { id: 'label.stroke.color', texto: 'label stroke color', valores: ['#F54700', 'blue'], indexValor: 0 },
    { id: 'label.stroke.width', texto: 'label stroke width', valores: [10, 5], indexValor: 0 },
    { id: 'label.stroke.linedash', texto: 'label stroke linedash', valores: [[5, 5, 20], [10, 10]], indexValor: 0 },
    { id: 'label.stroke.linedashoffset', texto: 'label stroke linedashoffset', valores: [5, 10, 15], indexValor: 0 },
    { id: 'label.stroke.linecap', texto: 'label stroke linecap', valores: ['square', 'round', 'butt'], indexValor: 0 },
    { id: 'label.stroke.linejoin', texto: 'label stroke linejoin', valores: ['miter', 'round', 'bevel'], indexValor: 0 },
    { id: 'label.stroke.miterlimit', texto: 'label stroke miterlimit', valores: [5, 10, 15], indexValor: 0 },
    // ICONO IMAGEN
    { id: 'icon.src', texto: 'icon src (img)', valores: ['https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/SVG_logo.svg/1024px-SVG_logo.svg.png'], indexValor: 0 },
    { id: 'icon.crossorigin', texto: 'icon crossorigin (img)', valores: ['anonymus'], indexValor: 0 },
    { id: 'icon.rotation', texto: 'icon rotation (img y fontsymbol)', valores: [0.5, 0.8], indexValor: 0 },
    { id: 'icon.scale', texto: 'icon scale (img)', valores: [0.5, 0.2, 1.5], indexValor: 0 },
    { id: 'icon.opacity', texto: 'icon opacity (img y fontsymbol)', valores: [1, 0.5, 0.2], indexValor: 0 },
    { id: 'icon.anchor', texto: 'icon anchor (img)', valores: [[0.5, 1.9], [15, 15]], indexValor: 0 },
    { id: 'icon.anchorOrigin', texto: 'icon anchororigin (img)', valores: ['top-left', 'top-right', 'bottom-left', 'bottom-right'], indexValor: 0 },
    { id: 'icon.anchorxunits', texto: 'icon anchorxunits (img)', valores: ['fraction', 'pixel'], indexValor: 0 },
    { id: 'icon.anchoryunits', texto: 'icon anchoryunits (img)', valores: ['fraction', 'pixel'], indexValor: 0 },
    { id: 'icon.rotate', texto: 'icon rotate (img y fontsymbol)', valores: [true, false], indexValor: 0 },
    { id: 'icon.offsetOrigin', texto: 'icon offsetorigin (img)', valores: ['top-left', 'top-right', 'bottom-left', 'bottom-right'], indexValor: 0 },
    { id: 'icon.offset', texto: 'icon offset (img y fontsymbol)', valores: [[20, 20], [0, 20], [20, 0]], indexValor: 0 },
    { id: 'icon.size', texto: 'icon size (img)', valores: [[5, 15], [10, 10], [15, 15]], indexValor: 0 },
    { id: 'icon.snaptopixel', texto: 'icon snaptopixel (img)', valores: [true, false], indexValor: 0 },
    { id: 'icon.fill.color', texto: 'icon fill color (img)', valores: ['#F54700', 'red'], indexValor: 0 },
    { id: 'icon.fill.opacity', texto: 'icon fill opacity (img)', valores: [1, 0.5, 0.2], indexValor: 0 },
    { id: 'icon.stroke.color', texto: 'icon stroke color (img)', valores: ['#F54700', 'red'], indexValor: 0 },
    { id: 'icon.stroke.width', texto: 'icon stroke width (img)', valores: [3, 10, 20], indexValor: 0 },
    // ICONO FONTSYMBOL
    { id: 'icon.form', texto: 'icon form (fontsymbol)', valores: [BAN, BLAZON, BUBBLE, CIRCLE, LOZENGE, MARKER, NONE, SHIELD, SIGN, SQUARE, TRIANGLE], indexValor: 0 },
    { id: 'icon.class', texto: 'icon class (fontsymbol)', valores: ['g-cartografia-alerta'], indexValor: 0 },
    { id: 'icon.fontsize', texto: 'icon fontsize (fontsymbol)', valores: [0.5, 1, 1.5], indexValor: 0 },
    { id: 'icon.radius', texto: 'icon radius (fontsymbol)', valores: [3, 10, 20], indexValor: 0 },
    { id: 'icon.color', texto: 'icon color (fontsymbol)', valores: ['#F54700', 'red'], indexValor: 0 },
    { id: 'icon.fill', texto: 'icon fill (fontsymbol)', valores: ['#F54700', 'red'], indexValor: 0 },
    { id: 'icon.gradientcolor', texto: 'icon gradientcolor (fontsymbol)', valores: ['#F54700', 'red'], indexValor: 0 },
    { id: 'icon.gradient', texto: 'icon gradient (fontsymbol)', valores: [true, false], indexValor: 0 },
  ],
  line: [
    { id: 'fill.color', texto: 'fill color', valores: ['#F54700', 'red'], indexValor: 0 },
    { id: 'fill.width', texto: 'fill width', valores: [3, 10, 20], indexValor: 0 },
    { id: 'fill.opacity', texto: 'fill opacity', valores: [1, 0.5, 0.2], indexValor: 0 },
    { id: 'stroke.color', texto: 'stroke color', valores: ['#F54700', 'blue'], indexValor: 0 },
    { id: 'stroke.width', texto: 'stroke width', valores: [5, 10, 20], indexValor: 0 },
    { id: 'stroke.linedash', texto: 'stroke linedash', valores: [[5, 5, 20], [10, 10]], indexValor: 0 },
    { id: 'stroke.linedashoffset', texto: 'stroke linedashoffset', valores: [5, 10, 15], indexValor: 0 },
    { id: 'stroke.linecap', texto: 'stroke linecap', valores: ['square', 'round', 'butt'], indexValor: 0 },
    { id: 'stroke.linejoin', texto: 'stroke linejoin', valores: ['miter', 'round', 'bevel'], indexValor: 0 },
    { id: 'stroke.miterlimit', texto: 'stroke miterlimit', valores: [5, 10, 15], indexValor: 0 },
    { id: 'stroke.opacity', texto: 'stroke opacity', valores: [1, 0.5, 0.2], indexValor: 0 },
    { id: 'label.rotation', texto: 'label rotation', valores: [0.5, 0.8], indexValor: 0 },
    { id: 'label.text', texto: 'label text', valores: ['etiqueta', 'texto'], indexValor: 0 },
    { id: 'label.textoverflow', texto: 'label textoverflow', valores: ['ellipsis', 'hidden', 'visible'], indexValor: 0 },
    { id: 'label.font', texto: 'label font', valores: ['bold 19px Comic Sans MS', 'bold 40px Courier New'], indexValor: 0 },
    { id: 'label.color', texto: 'label color', valores: ['black', '#0f0'], indexValor: 0 },
    { id: 'label.rotate', texto: 'label rotate', valores: [true, false], indexValor: 0 },
    { id: 'label.scale', texto: 'label scale', valores: [2, 3, 1], indexValor: 0 },
    { id: 'label.align', texto: 'label align', valores: [RIGHT, LEFT, CENTER], indexValor: 0 },
    { id: 'label.baseline', texto: 'label baseline', valores: [TOP, BOTTOM, MIDDLE, ALPHABETIC, HANGING, IDEOGRAPHIC], indexValor: 0 },
    { id: 'label.path', texto: 'label path', valores: [true, false], indexValor: 0 },
    { id: 'label.smooth', texto: 'label smooth', valores: [true, false], indexValor: 0 },
    { id: 'label.offset', texto: 'label offset', valores: [[20, 20], [0, 20], [20, 0]], indexValor: 0 },
    { id: 'label.minwidth', texto: 'label minwidth', valores: [3, 5, 10, 20], indexValor: 0 },
    { id: 'label.stroke.color', texto: 'label stroke color', valores: ['#F54700', 'blue'], indexValor: 0 },
    { id: 'label.stroke.width', texto: 'label stroke width', valores: [10, 5], indexValor: 0 },
    { id: 'label.stroke.linedash', texto: 'label stroke linedash', valores: [[5, 5, 20], [10, 10]], indexValor: 0 },
    { id: 'label.stroke.linedashoffset', texto: 'label stroke linedashoffset', valores: [5, 10, 15], indexValor: 0 },
    { id: 'label.stroke.linecap', texto: 'label stroke linecap', valores: ['square', 'round', 'butt'], indexValor: 0 },
    { id: 'label.stroke.linejoin', texto: 'label stroke linejoin', valores: ['miter', 'round', 'bevel'], indexValor: 0 },
    { id: 'label.stroke.miterlimit', texto: 'label stroke miterlimit', valores: [5, 10, 15], indexValor: 0 },
    { id: 'pattern.name', texto: 'pattern name', valores: ['hatch', 'cross', 'dot', 'circle', 'square', 'tile', 'woven', 'crosses', 'caps', 'nylon', 'hexagon', 'cemetry', 'sand', 'conglomerate', 'gravel',
      'brick', 'dolomite', 'coal', 'breccia', 'clay', 'flooded', 'chaos', 'grass', 'swamp', 'wave', 'vine', 'forest', 'scrub', 'tree', 'pine', 'pines', 'rock', 'rocks', 'Image'], indexValor: 0 },
    { id: 'pattern.size', texto: 'pattern size', valores: [5, 10, 15], indexValor: 0 },
    { id: 'pattern.scale', texto: 'pattern scale', valores: [2, 3], indexValor: 0 },
    { id: 'pattern.color', texto: 'pattern color', valores: ['#F54700', 'blue'], indexValor: 0 },
    { id: 'pattern.rotation', texto: 'pattern rotation', valores: [10, 30], indexValor: 0 },
    { id: 'pattern.offset', texto: 'pattern offset', valores: [5, 15], indexValor: 0 },
    { id: 'pattern.spacing', texto: 'pattern spacing', valores: [2, 5, 10], indexValor: 0 },
    { id: 'pattern.class', texto: 'pattern class', valores: ['g-cartografia-save', 'g-cartografia-alert'], indexValor: 0 },
    { id: 'pattern.src', texto: 'pattern src', valores: ['https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/SVG_logo.svg/1024px-SVG_logo.svg.png'], indexValor: 0 },
  ],
  polygon: [
    { id: 'fill.color', texto: 'fill color', valores: ['#F54700', 'red'], indexValor: 0 },
    { id: 'fill.opacity', texto: 'fill opacity', valores: [1, 0.5, 0.2], indexValor: 0 },
    { id: 'fill.pattern.name', texto: 'fill pattern name', valores: ['hatch', 'cross', 'dot', 'circle', 'square', 'tile', 'woven', 'crosses', 'caps', 'nylon', 'hexagon', 'cemetry', 'sand', 'conglomerate', 'gravel',
      'brick', 'dolomite', 'coal', 'breccia', 'clay', 'flooded', 'chaos', 'grass', 'swamp', 'wave', 'vine', 'forest', 'scrub', 'tree', 'pine', 'pines', 'rock', 'rocks', 'Image'], indexValor: 0 },
    { id: 'fill.pattern.size', texto: 'fill pattern size', valores: [5, 10, 15], indexValor: 0 },
    { id: 'fill.pattern.scale', texto: 'fill pattern scale', valores: [2, 3], indexValor: 0 },
    { id: 'fill.pattern.color', texto: 'fill pattern color', valores: ['#F54700', 'blue'], indexValor: 0 },
    { id: 'fill.pattern.rotation', texto: 'fill pattern rotation', valores: [10, 30], indexValor: 0 },
    { id: 'fill pattern.spacing', texto: 'fill pattern spacing', valores: [2, 5, 10], indexValor: 0 },
    { id: 'fill.pattern.offset', texto: 'pattern offset', valores: [5, 15], indexValor: 0 },
    { id: 'fill.pattern.class', texto: 'fill pattern class', valores: ['g-cartografia-save', 'g-cartografia-alert'], indexValor: 0 },
    { id: 'fill.pattern.src', texto: 'fill pattern src', valores: ['https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/SVG_logo.svg/1024px-SVG_logo.svg.png'], indexValor: 0 },
    { id: 'stroke.color', texto: 'stroke color', valores: ['#F54700', 'blue'], indexValor: 0 },
    { id: 'stroke.width', texto: 'stroke width', valores: [5, 10, 20], indexValor: 0 },
    { id: 'stroke.linedash', texto: 'stroke linedash', valores: [[5, 5, 20], [10, 10]], indexValor: 0 },
    { id: 'stroke.linedashoffset', texto: 'stroke linedashoffset', valores: [5, 10, 15], indexValor: 0 },
    { id: 'stroke.linecap', texto: 'stroke linecap', valores: ['square', 'round', 'butt'], indexValor: 0 },
    { id: 'stroke.linejoin', texto: 'stroke linejoin', valores: ['miter', 'round', 'bevel'], indexValor: 0 },
    { id: 'stroke.miterlimit', texto: 'stroke miterlimit', valores: [5, 10, 15], indexValor: 0 },
    { id: 'stroke.opacity', texto: 'stroke opacity', valores: [1, 0.5, 0.2], indexValor: 0 },
    { id: 'label.rotation', texto: 'label rotation', valores: [0.5, 0.8], indexValor: 0 },
    { id: 'label.text', texto: 'label text', valores: ['etiqueta', 'texto'], indexValor: 0 },
    { id: 'label.textoverflow', texto: 'label textoverflow', valores: ['ellipsis', 'hidden', 'visible'], indexValor: 0 },
    { id: 'label.font', texto: 'label font', valores: ['bold 19px Comic Sans MS', 'bold 40px Courier New'], indexValor: 0 },
    { id: 'label.color', texto: 'label color', valores: ['black', '#0f0'], indexValor: 0 },
    { id: 'label.rotate', texto: 'label rotate', valores: [true, false], indexValor: 0 },
    { id: 'label.scale', texto: 'label scale', valores: [2, 3, 1], indexValor: 0 },
    { id: 'label.align', texto: 'label align', valores: [RIGHT, LEFT, CENTER], indexValor: 0 },
    { id: 'label.baseline', texto: 'label baseline', valores: [TOP, BOTTOM, MIDDLE, ALPHABETIC, HANGING, IDEOGRAPHIC], indexValor: 0 },
    { id: 'label.path', texto: 'label path', valores: [true, false], indexValor: 0 },
    { id: 'label.smooth', texto: 'label smooth', valores: [true, false], indexValor: 0 },
    { id: 'label.offset', texto: 'label offset', valores: [[20, 20], [0, 20], [20, 0]], indexValor: 0 },
    { id: 'label.minwidth', texto: 'label minwidth', valores: [3, 5, 10, 20], indexValor: 0 },
    { id: 'label.stroke.color', texto: 'label stroke color', valores: ['#F54700', 'blue'], indexValor: 0 },
    { id: 'label.stroke.width', texto: 'label stroke width', valores: [10, 5], indexValor: 0 },
    { id: 'label.stroke.linedash', texto: 'label stroke linedash', valores: [[5, 5, 20], [10, 10]], indexValor: 0 },
    { id: 'label.stroke.linedashoffset', texto: 'label stroke linedashoffset', valores: [5, 10, 15], indexValor: 0 },
    { id: 'label.stroke.linecap', texto: 'label stroke linecap', valores: ['square', 'round', 'butt'], indexValor: 0 },
    { id: 'label.stroke.linejoin', texto: 'label stroke linejoin', valores: ['miter', 'round', 'bevel'], indexValor: 0 },
    { id: 'label.stroke.miterlimit', texto: 'label stroke miterlimit', valores: [5, 10, 15], indexValor: 0 },
    { id: 'pattern.name', texto: 'pattern name', valores: ['hatch', 'cross', 'dot', 'circle', 'square', 'tile', 'woven', 'crosses', 'caps', 'nylon', 'hexagon', 'cemetry', 'sand', 'conglomerate', 'gravel',
      'brick', 'dolomite', 'coal', 'breccia', 'clay', 'flooded', 'chaos', 'grass', 'swamp', 'wave', 'vine', 'forest', 'scrub', 'tree', 'pine', 'pines', 'rock', 'rocks', 'Image'], indexValor: 0 },
    { id: 'pattern.size', texto: 'pattern size', valores: [5, 10, 15], indexValor: 0 },
    { id: 'pattern.scale', texto: 'pattern scale', valores: [2, 3], indexValor: 0 },
    { id: 'pattern.color', texto: 'pattern color', valores: ['#F54700', 'blue'], indexValor: 0 },
    { id: 'pattern.rotation', texto: 'pattern rotation', valores: [10, 30], indexValor: 0 },
    { id: 'pattern.offset', texto: 'pattern offset', valores: [5, 15], indexValor: 0 },
    { id: 'pattern.spacing', texto: 'pattern spacing', valores: [2, 5, 10], indexValor: 0 },
    { id: 'pattern.class', texto: 'pattern class', valores: ['g-cartografia-save', 'g-cartografia-alert'], indexValor: 0 },
    { id: 'pattern.src', texto: 'pattern src', valores: ['https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/SVG_logo.svg/1024px-SVG_logo.svg.png'], indexValor: 0 },
  ],
};

const getDefaultStyleOptions = (type) => {
  if (type === 'point') {
    return Point.DEFAULT;
  }
  if (type === 'line') {
    return Line.DEFAULT;
  }
  if (type === 'polygon') {
    return Polygon.DEFAULT;
  }
  return {};
};

const activateStyleTypeBtn = (idBtn) => {
  const buttons = window.document.querySelectorAll('.styleType>button');
  buttons.forEach((b) => {
    b.classList.remove('activeButton');
    if (b.id === idBtn) {
      b.classList.add('activeButton');
    }
  });
};

const showTestSections = () => {
  const testSections = window.document.getElementById('test_sections');
  testSections.classList.remove('hidden');
};

const setStyle = (type, options) => {
  capaPrueba.removeFeatures(capaPrueba.getFeatures());
  if (type === 'point') {
    capaPrueba.addFeatures(pointFeature);
    estilo = new Point(options, pointVendor);
    const bbox = [-662541.2130577073, 4348884.724285094, -589161.665903938, 4383472.479584137];
    mapa.setBbox(bbox);
  } else if (type === 'line') {
    capaPrueba.addFeatures(lineFeature);
    estilo = new Line(options, lineVendor);
    const bbox = [-398669.6723058473, 3973097.5442742878, -105151.48369077049, 4111448.5654704566];
    mapa.setBbox(bbox);
  } else if (type === 'polygon') {
    capaPrueba.addFeatures(polFeature);
    estilo = new Polygon(options, polygonVendor);
    const bbox = [167553.43719930138, 3994732.042590404, 350849.43102715403, 4100215.141623947];
    mapa.setBbox(bbox);
  }
  capaPrueba.setStyle(estilo);
};

const styleOptionsDiv = window.document.getElementsByClassName('styleOptions')[0];
const refreshStyleOptions = (type) => {
  const options = styleOptions[type];
  while (styleOptionsDiv.firstChild) {
    styleOptionsDiv.removeChild(styleOptionsDiv.firstChild);
  }
  for (let i = 0; i < options.length; i++) {
    const btn = document.createElement('button');
    btn.innerText = options[i].texto;
    btn.id = options[i].id;
    styleOptionsDiv.appendChild(btn);
  }
};

const styleTypeEvent = (evt) => {
  const idTarget = evt.target.id;
  if (idTarget) {
    styleType = idTarget;
    activateStyleTypeBtn(idTarget);
    refreshStyleOptions(idTarget);
    setStyle(idTarget, getDefaultStyleOptions(idTarget));
    showTestSections();
  }
};
const styleTypeDiv = window.document.getElementsByClassName('styleType')[0];
styleTypeDiv.addEventListener('click', (evt) => styleTypeEvent(evt));

const refreshStyle = (evt) => {
  const idBtn = evt.target.id;
  if (idBtn) {
    const btnOpt = styleOptions[styleType].find((o) => o.id === idBtn);
    const index = btnOpt.indexValor;
    let newIndex = 0;
    if (index < btnOpt.valores.length) {
      if (!evt.target.classList.contains('activeButton')) {
        evt.target.classList.add('activeButton');
      }
      const valor = btnOpt.valores[index];
      estilo.set(idBtn, valor);
      console.log(`${idBtn} = ${valor}`);
      newIndex = btnOpt.indexValor + 1;
    } else {
      evt.target.classList.remove('activeButton');
      estilo.set(idBtn, undefined);
    }
    btnOpt.indexValor = newIndex;
  }
};
styleOptionsDiv.addEventListener('click', (evt) => refreshStyle(evt));

const showStyleDialog = () => {
  const options = estilo.getOptions();
  const jsonFormateado = JSON.stringify(options, null, 2);
  console.log(options);
  info(jsonFormateado);
};
const showStyleBtn = window.document.getElementById('showStyleOptions');
showStyleBtn.addEventListener('click', () => showStyleDialog());

///////////////////////
////// FUNCIONES //////
///////////////////////
const noParam = window.document.getElementsByClassName('noParameters')[0];
const getWithParam = window.document.getElementsByClassName('getWithParameters')[0];
const setParam = window.document.getElementsByClassName('setFunctions')[0];
const otherParam = window.document.getElementsByClassName('otherFunctions')[0];

const checkFunctionArguments = (func) => {
  let hasArguments = false;
  const functString = func.toString().split('\n').splice(0, 2);
  if (functString[0]) {
    hasArguments = functString[0].substring(functString[0].indexOf('(') + 1, functString[0].indexOf(')')).trim().length !== 0 || functString[0].includes('arguments.length');
  }
  if (!hasArguments && functString[1]) {
    hasArguments = functString[1].includes('arguments.length') || functString[1].includes('[native code]');
  }
  return hasArguments;
};

// Función de escritura al Console del Browser
const showResult = (button, format, result) => {
  const complete = button.innerText + (format ? `_${format}` : '');
  if (result instanceof Promise) {
    const resultArray = [];
    result.then((success) => {
      console.log(`PROMISE_SUCCESS:${complete}`, success);
      resultArray.push(success);
      button.className = 'okButton';
    }, (error) => {
      console.log(`PROMISE_ERROR_THEN:${complete}`, error);
      resultArray.push(error);
      button.className = 'errorButton';
    }).catch((error) => {
      console.log(`PROMISE_ERROR_CATCH:${complete}`, error);
      resultArray.push(error);
      button.className = 'errorButton';
    });
    return resultArray;
  }
  button.className = 'okButton';
  console.log(complete, result);
  return result;
};

const initTestFunctions = () => {
  // Guardar todos los __proto__ del Objeto "estilo", usando ... para traerse elementos de estos objetos a un objeto común con el que se trabajará
  const objectWithAllFunctions = {
    ...Object.getOwnPropertyDescriptors(estilo.__proto__),
    ...Object.getOwnPropertyDescriptors(estilo.__proto__.__proto__),
    ...Object.getOwnPropertyDescriptors(estilo.__proto__.__proto__.__proto__),
    ...Object.getOwnPropertyDescriptors(estilo.__proto__.__proto__.__proto__.__proto__),
  };

  // Creado Array para manejar más adelante el objectWithAllFunctions y ordenado de este sin funciones de "constructor" y "destroy"
  const listOfAllFunctions = Object.keys(objectWithAllFunctions).sort();
  listOfAllFunctions.remove('constructor');
  listOfAllFunctions.remove('destroy');
  listOfAllFunctions.remove('equals');

  if (listOfAllFunctions && listOfAllFunctions.length > 0) { // Confirmar que existen funciones que se quieren probar
    // const eventsFuncArray = []; const eventsKeyArray = [];

    for (let i = 0; i < listOfAllFunctions.length; i++) { // Comenzar a generar botones del HTML
      const auxName = listOfAllFunctions[i]; // Nombre de Función

      if (objectWithAllFunctions[auxName].value && objectWithAllFunctions[auxName].value instanceof Function) { // Comprobar que es una función y no un objeto
        // El botón de esta función
        const auxButton = document.createElement('button');
        auxButton.innerText = auxName;
        let appendTo;
        let parameterTest;

        if (objectWithAllFunctions[auxName].value && !checkFunctionArguments(objectWithAllFunctions[auxName].value)) {
          // ---------------------------------FUNCIONES SIN PARÁMETROS---------------------------------
          parameterTest = () => { // singeParameterTest
            showResult(auxButton, undefined, estilo[auxName]());
          };
          appendTo = noParam;
        } else if (auxName.startsWith('get')) {
          // ---------------------------------FUNCIONES GET---------------------------------
          parameterTest = () => { // getParameterTest
            if (auxName === 'get') {
              showResult(auxButton, 'fill.color', estilo[auxName]('fill.color'));
            }
          };
          appendTo = getWithParam;
        } else if (auxName.startsWith('set')) {
          // ---------------------------------FUNCIONES SET---------------------------------
          parameterTest = () => { // setParameterTest
            if (auxName === 'set') {
              showResult(auxButton, 'fill.color', estilo[auxName]('fill.color', 'pink'));
            }
          };
          appendTo = setParam;
        } else {
          // ---------------------------------OTRAS FUNCIONES---------------------------------
          parameterTest = () => { // otherParameterTest
            if (auxName === 'apply') {
              showResult(auxButton, null, estilo[auxName](capaPrueba));
            } else if (auxName === 'applyToFeature') {
              const feature = capaPrueba.getFeatures()[0];
              showResult(auxButton, null, estilo[auxName](feature));
            } else if (auxName === 'refresh') {
              showResult(auxButton, null, estilo[auxName]());
            } else if (auxName === 'unapply') {
              showResult(auxButton, null, estilo[auxName](capaPrueba));
            } else {
              console.error('NOT_PREPARED_FUNCTION_TEST_FOR_OTHER:', auxName);
            }
          };
          appendTo = otherParam;
        }

        // Asignado del botón con el evento apropiado
        auxButton.addEventListener('click', () => {
          auxButton.className = '';
          try {
            parameterTest();
          } catch (error) {
            auxButton.className = 'errorButton';
            throw error;
          }
        });
        appendTo.append(auxButton);
      }
    }
  }

  window.listOfAllFunctions = listOfAllFunctions; // Para tener acceso a toda la lista de funciones.
};

initTestFunctions();

/* / Pruebas con la leyenda de Layerswitcher(SIN EXITO, probar con localhost en el propio plugin)
const pluginLayerswitcher = new M.plugin.Layerswitcher({
  collapsed: false,
  collapsible: true,
  isDraggable: true,
  position: 'TL',
  tooltip: 'Tooltip de Gestor de Capas',
  modeSelectLayers: 'eyes',
  tools: ['transparency', 'zoom', 'legend', 'information', 'style', 'delete'],
});
mapa.addPlugin(pluginLayerswitcher);
window.pluginLayerswitcher = pluginLayerswitcher; // */

//////////////////////////
// ERRORES develop y ol //
//////////////////////////
/*
+ applyToFeature --> Cannot read properties of null (reading 'getOptions')  //El feature no tiene estilo
*/
