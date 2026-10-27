/* eslint-disable max-len,object-property-newline */
import Layerswitcher from 'facade/layerswitcher';

/**
 * Mapa + Layerswitcher para probar el orden z-index entre Section y LayerGroup.
 *
 * - Sección externa: Provincias (polígono) + Sección externa dos (Líneas WMS anidada).
 * - Grupo externo: Provincias (polígono) + Líneas (WMS).
 *
 * Solo se añade al mapa la sección raíz; la hija ya va anidada dentro.
 * Reordenar capas, sección y grupo en el layerswitcher para comprobar delante/detrás.
 */

if (IDEE.config.terrain) {
  IDEE.config.terrain.default = '';
}

const mapajs = IDEE.map({
  container: 'mapjs',
  center: { x: 414000, y: 4070000 },
  zoom: 8,
});

window.mapajs = mapajs;

const PROVINCIAS_GEOJSON_URL = 'https://hcsigc.juntadeandalucia.es/geoserver/wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=IECA:sigc_provincias_1724753768757&maxFeatures=50&outputFormat=application/json';

const styleProvinciasSeccion = new IDEE.style.Polygon({
  fill: {
    color: '#FFD54F',
    opacity: 0.45,
  },
  stroke: {
    color: '#F57C00',
    width: 3,
  },
});

// const styleProvinciasGrupo = new IDEE.style.Polygon({
//   fill: {
//     color: '#64B5F6',
//     opacity: 0.35,
//   },
//   stroke: {
//     color: '#1565C0',
//     width: 3,
//   },
// });

const provinciasSeccion = new IDEE.layer.GeoJSON({
  name: 'Provincias_seccion',
  legend: 'Provincias (sección)',
  url: PROVINCIAS_GEOJSON_URL,
}, {
  style: styleProvinciasSeccion,
});

const lineasSeccion = new IDEE.layer.WMS({
  url: 'https://www.ideandalucia.es/services/andalucia/wms?',
  name: '05_Red_Viaria',
  legend: 'Líneas (sección)',
  transparent: true,
  tiled: false,
});

const lineasSeccion2 = new IDEE.layer.WMS({
  url: 'https://www.ideandalucia.es/services/andalucia/wms?',
  name: '05_Red_Viaria',
  legend: 'Líneas (sección)',
  transparent: true,
  tiled: false,
});

// const provinciasGrupo = new IDEE.layer.GeoJSON({
//   name: 'Provincias_grupo',
//   legend: 'Provincias (grupo)',
//   url: PROVINCIAS_GEOJSON_URL,
// }, {
//   style: styleProvinciasGrupo,
// });

const lineasGrupo = new IDEE.layer.WMS({
  url: 'https://www.ideandalucia.es/services/andalucia/wms?',
  name: '03_Red_Hidrografica',
  legend: 'Líneas (grupo)',
  transparent: true,
  tiled: false,
});

const seccionExternaTres = new IDEE.layer.Section({
  idSection: 'seccion_externa_tres',
  title: 'Sección externa tres',
  collapsed: false,
  order: 2,
  children: [lineasSeccion2],
});

const seccionExternaDos = new IDEE.layer.Section({
  idSection: 'seccion_externa_dos',
  title: 'Sección externa dos',
  collapsed: false,
  order: 2,
  children: [seccionExternaTres],
});

const seccionExterna = new IDEE.layer.Section({
  idSection: 'seccion_externa',
  title: 'Sección externa',
  collapsed: false,
  order: 1,
  children: [provinciasSeccion, seccionExternaDos],
});

// const grupoExterno = new IDEE.layer.LayerGroup({
//   name: 'Grupo externo',
//   legend: 'Grupo externo',
//   layers: [provinciasGrupo, lineasGrupo],
// });

// Solo la sección raíz; seccionExterna_dos ya va anidada dentro.
mapajs.addSections(seccionExterna);
// mapajs.addLayerGroups(grupoExterno);

window.seccionExterna = seccionExterna;
window.seccionExterna_dos = seccionExternaDos;
window.seccionExternaTres = seccionExternaTres;
// window.grupoExterno = grupoExterno;
window.provinciasSeccion = provinciasSeccion;
window.lineasSeccion = lineasSeccion;
// window.provinciasGrupo = provinciasGrupo;
window.lineasGrupo = lineasGrupo;

mapajs.addPlugins(
  new Layerswitcher({
    collapsed: false,
    collapsible: true,
    isDraggable: true,
    position: 'TR',
    modeSelectLayers: 'eyes',
    tools: ['transparency', 'zoom', 'legend', 'information', 'style', 'delete'],
    isMoveLayers: true,
    https: true,
    http: true,
    showCatalog: true,
    useProxy: true,
    displayLabel: true,
    addLayers: true,
    statusLayers: true,
    // precharged: 'http://localhost:6123/test/precharged.json',
  }),
);
