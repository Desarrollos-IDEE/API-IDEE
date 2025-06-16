import { map as Mmap } from 'IDEE/api-idee';
import Sections from 'IDEE/layer/Sections';
import GeoJSON from 'IDEE/layer/GeoJSON';
import WMS from 'IDEE/layer/WMS';
import LayerGroup from 'IDEE/layer/LayerGroup';

const mapa = Mmap({
  container: 'map',
  layers: ['WMTS*https://www.ign.es/wmts/pnoa-ma?*OI.OrthoimageCoverage*false'],
});
window.mapa = mapa;

const provincias = new GeoJSON({
  name: 'Provincias',
  url: 'https://hcsigc.juntadeandalucia.es/geoserver/wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=IECA:sigc_provincias_1724753768757&maxFeatures=50&outputFormat=application/json',
});
window.provincias = provincias;

const campamentos = new GeoJSON({
  name: 'Campamentos',
  url: 'https://hcsigc.juntadeandalucia.es/geoserver/wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=IECA:sigc_campamentos_1724753464727&outputFormat=application/json',
});
window.campamentos = campamentos;

const wms_001 = new WMS({
  url: 'https://www.ideandalucia.es/services/andalucia/wms?',
  name: '05_Red_Viaria',
  legend: 'Red Viaria',
  transparent: true,
  tiled: false,
});
window.wms_001 = wms_001;

const layer = new WMS({
  url: 'https://www.ign.es/wms-inspire/unidades-administrativas?',
  name: 'AU.AdministrativeBoundary',
  legend: 'Limite administrativo',
  tiled: false,
}, {});
window.layer = layer;

// mapa.addLayers(layer);

// const section_002 = new Sections({
//   title: 'Sección 2',
//   zIndex: 1003,
//   children: [layer],
//   // order: 0,
// });
// window.section_002 = section_002;

const section_001 = new Sections({
  idLayer: 'id_section_1',
  title: 'Sección 1',
  // collapsed: true,
  collapsed: false,
  zIndex: 1000,
  children: [provincias, campamentos, wms_001],
  // children: [provincias, campamentos, wms_001, layer],
  // children: [provincias, campamentos, section_002],
  // order: 1,
});
window.section_001 = section_001;

mapa.addSections([section_001]);

console.log('La agrupación ' + section_001.title + ' tiene ' + section_001.getChildren().length + ' capas hijas');

// mapa.addSections([section_001, section_002]);
