import Transparency from 'facade/transparency';
import ShareMap from '../../sharemap/src/facade/js/sharemap';

M.language.setLang('en');

const map = M.map({
  container: 'mapjs',
  controls: ['panzoom', 'scale*true'],
});

const wfs = new M.layer.WFS({
  url: "http://geostematicos-sigc.juntadeandalucia.es/geoserver/tematicos/ows?",
  namespace: "tematicos",
  name: "Provincias",
  legend: "Provincias",
  geometry: 'MPOLYGON',
});

//map.addWFS(wfs);

// 1 WMS por url
const pluginTransparency = new Transparency({
  position: 'TR',
  layers: ['WMS*hil*http://www.ign.es/wms-inspire/unidades-administrativas?*AU.AdministrativeBoundary', 'WMTS*http://www.ign.es/wmts/pnoa-ma?*OI.OrthoimageCoverage*GoogleMapsCompatible*PNOA', 'WMTS*http://servicios.idee.es/wmts/ocupacion-suelo?*LC.LandCoverSurfaces*GoogleMapsCompatible*usoSuelo'],
  radius: ""
});

// 2 WMTS por url
// const pluginTransparency = new Transparency({
//   position: 'TL',
//   layers: ['WMTS*http://www.ideandalucia.es/geowebcache/service/wmts*toporaster'],
//   collapsible: false
// });

// WMS y WMTS  por url
// const pluginTransparency = new Transparency({
//   position: 'TL',
//   layers: ['WMS*hil*http://www.ign.es/wms-inspire/unidades-administrativas?*AU.AdministrativeBoundary'],
//   collapsible: false
// });

// WMS*hil*http://www.ign.es/wms-inspire/unidades-administrativas?*AU.AdministrativeBoundary
// WMS*Redes*http://www.ideandalucia.es/wms/mta400v_2008?*Redes_energeticas
// WMS*http://www.ideandalucia.es/wms/mdt_2016?*modelo_digital_terreno_2016_color

// WMTS*http://www.ign.es/wmts/pnoa-ma?*OI.OrthoimageCoverage*GoogleMapsCompatible*PNOA
// WMTS*http://www.ign.es/wmts/mapa-raster?*MTN*GoogleMapsCompatible*mtn
// WMTS*http://servicios.idee.es/wmts/ocupacion-suelo?*LC.LandCoverSurfaces*GoogleMapsCompatible*usoSuelo

// 3 WMS y WMTS como objetos
// let wmts = new M.layer.WMTS({
//   url: "http://www.ideandalucia.es/geowebcache/service/wmts",
//   name: "toporaster",
//   matrixSet: "EPSG:25830",
//   legend: "Toporaster"
// }, {
//   format: 'image/png'
// });
// map.addWMTS(wmts);

// const wms = new M.layer.WMS({
//   url: 'http://www.ign.es/wms-inspire/unidades-administrativas?',
//   name: 'AU.AdministrativeBoundary',
//   legend: 'Limite administrativo',
//   tiled: false,
// }, {});

// map.addWMS(wms);

// const pluginTransparency = new Transparency({
//   position: 'TL',
//   layers: [wmts, wms],
//   collapsible: false
// });

// 4 WMS y WMTS por nombres
// const pluginTransparency = new Transparency({
//   position: 'TL',
//   layers: ['AU.AdministrativeBoundary'],
//   collapsible: false
// });

// Prueba integración con Share Map
const shareMap = new ShareMap({
  baseUrl: 'http://localhost:8080/api-core/',
  position: 'BR',
})

// const mp6 = new M.plugin.ZoomExtent();

// const mp7 = new M.plugin.XYLocator({
//   position: 'TL',
// });

map.addPlugin(shareMap);
// map.addPlugin(mp6);

map.addPlugin(pluginTransparency);
// map.addPlugin(mp7);
window.map = map;
