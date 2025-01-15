/* eslint-disable no-unused-vars,camelcase,max-len */
import { map as Mmap } from 'M/mapea';
import Polygon from 'M/style/Polygon';
import Generic from 'M/style/Generic';
import {
  TOP, BOTTOM, MIDDLE, ALPHABETIC, HANGING, IDEOGRAPHIC,
} from 'M/style/Baseline';
import { RIGHT, LEFT, CENTER } from 'M/style/Align';
import {
  BAN, BLAZON, BUBBLE, CIRCLE, LOZENGE, MARKER, NONE, SHIELD, SIGN, SQUARE, TRIANGLE,
} from 'M/style/Form';
import { vector_001 } from '../layers/vector/vector';

const mapa = Mmap({
  container: 'map',
  projection: 'EPSG:3857*m',
  bbox: [-1494620.1256278034, 3657488.0149567816, 853525.3832928112, 4764296.184526134],
});

// const estilo = new Generic();

const estiloPol = new Polygon({
  // Relleno del polígono
  fill: {
    // Color del borde. Hexadecimal, nominal
    color: '#6A0888',
    // Opacidad del relleno
    opacity: 1,
    // Patrón de relleno
    pattern: {
      // Nombre del patrón. // hatch(sombreado)|cross(cruz)|dot(punto)|circle(círculo)|square(cuadrado)|tile(mosaico)|
      // woven(tejido)|crosses(cruces)|caps(tapas)|nylon(nylon)|hexagon(hexágono)|cemetry(cementerio)|sand(arena)|
      // conglomerate(conglomerado)|gravel(grava)|brick(ladrillo)|dolomite(donomita)|coal(carbón)|breccia(brecha)|
      // clay(arcilla)|flooded(inundado)|chaos(caos)|grass(hierba)|swamp(pantano)|wave(ola)| vine(vid)|forest(bosque)|
      // scrub(matorral)|tree(árbol)|pine(pino)|pines(pinos)|rock(rock)|rocks(rocks)|IMAGE(Imagen)
      name: 'brick',
      // Escala del patrón
      scale: 2,
      // SOLO ICONO:
      // Si name tiene valor ICON
      // Tamaño del patrón
      // size: 5,
      // Separación del patrón
      spacing: 20,
      // Rotación del patrón
      rotation: 20,
      // Desplazamiento en pixeles
      offset: 21,
      // Color del patrón. Hexadecimal, nominal
      color: 'orange',
      // Clase fuente
      // class: 'g-cartografia-save', //no hace nada
      // si name tiene valor IMAGE
      // src: 'https://dev.w3.org/SVG/tools/svgweb/samples/svg-files/mozilla.svg', // ! problema de cors
    },
  },
  // borde del polígono
  stroke: {
    // Color del borde. Hexadecimal, nominal
    color: '#00F',
    // Ancho de la línea
    width: 30,
    // Patrón de distancias
    // linedash: [5, 10, 15],
    // Offset de fase
    // linedashoffset: 1,
    // Estilo de final de línea. round (borde redondeado)|square(borde cuadrado ligeramente alargado)|butt(borde cuadrado afilado)
    // linecap: 'butt',
    // Estilo de conexión de segmentos. miter(inglete)|round(redondo)|bevel(bisel)
    linejoin: 'miter', // no compatible con linedash
    // Tamaño máximo segmento de conexión
    miterlimit: 5, // no se aprecia cambio
    // Opacidad
    opacity: 1,
    // Patrón de línea
    pattern: {
      // Nombre del patrón. hatch|cross|dot|circle
      // square|tile|woven|crosses|caps|nylon|hexagon|cemetry
      // sand|conglomerate|gravel|brick|dolomite|coal|breccia
      // clay|flooded|chaos|grass|swamp|wave|vine|forest|scrub
      // tree|pine|pines|rock|rocks|IMAGE
      name: 'wave',
      // Tamaño del patrón
      size: 1,
      // Escalado del patrón
      scale: 2,
      // SOLO ICONO:
      // Si name tiene valor 'ICON'
      // Color del patrón
      color: '#FF0000',
      // Ángulo de rotación
      rotation: 0,
      // Desplazamiento del patrón
      // offset: 5,
      // Espacio
      spacing: 2,
      // Clase de la fuente
      // class: 'g-cartografia-save',
      // Si name tiene valor 'Image'
      // Url de la imagen para el patrón.
      // src: 'http://url_imagen',
    },
  },
  // etiqueta del polígono
  label: {
    // Texto etiqueta. fijo (texto fijo)|función(función JS que devuelve el valor)|atributo(atributo de la capa)
    text: 'Tres Tristes Tigres',
    // Fuente de la etiqueta
    font: 'bold 16px Courier New',
    // Escala de la etiqueta
    scale: 1,
    // Desplazamiento en píxeles
    // offset: [10, 0],
    // Color del texto
    color: '#000',
    // Halo del texto
    /* stroke: {
      // Color de la fuente. Hexadecimal, nominal
      color: '#FF0000' || 'red',
      // Grosor del halo
      width: 5,
      // Patrón de distancias
      linedash: [5, 5, 20],
      // Offset de fase
      linedashoffset: 1,
      // Estilo de final de línea. round|square|butt
      linecap: 'square',
      // Estilo de conexión de segmentos. miter|round|bevel
      linejoin: 'miter',
      // Tamaño máximo segmento de conexión
      miterlimit: 15,
    }, */
    // Rotación con dispositivo
    rotate: true,
    // Rotación de la etiqueta
    // rotation: 0.3,
    // Alineación horizontal. CENTER|LEFT|RIGHT
    // align: LEFT,
    // Altura de la etiqueta. TOP|BOTTOM|MIDDLE|
    // ALPHABETIC|HANGING|IDEOGRAPHIC
    // baseline: BOTTOM,
  },
});

// vector_001.setStyle(estilo);

vector_001.getFeatures().find((f) => f.getGeometry().type === 'Polygon').setStyle(estiloPol);

mapa.addLayers(vector_001);

window.mapa = mapa;
window.vectorLayer = vector_001;
