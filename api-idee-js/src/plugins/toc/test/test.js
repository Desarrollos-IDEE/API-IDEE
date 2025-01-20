import TOC from 'facade/toc';

M.language.setLang('es');

const map = M.map({
  container: 'mapjs',
  layers: ['TMS*TMSBaseIGN*https://tms-ign-base.idee.es/1.0.0/IGNBaseTodo/{z}/{x}/{-y}.jpeg*true*false'],
});

const mp = new TOC({
  collapsed: false,
  collapsible: false,
  position: 'BR',
});

map.addPlugin(mp);
map.addPlugin(new M.plugin.Attributions({ mode: 1, scale: 10000 }));

const layerUA = new M.layer.WMS({
  url: 'https://www.ign.es/wms-inspire/unidades-administrativas?',
  name: 'AU.AdministrativeUnit',
  legend: 'Unidad administrativa',
  tiled: false,
}, {});
const layerinicial = new M.layer.WMS({
  url: 'https://www.ign.es/wms-inspire/unidades-administrativas?',
  name: 'AU.AdministrativeBoundary',
  legend: 'Limite administrativo',
  tiled: false,
}, {
  visibility: false,
});

// const ocupacionSuelo = new M.layer.WMTS({
//   url: 'http://wmts-mapa-lidar.idee.es/lidar',
//   name: 'EL.GridCoverageDSM',
//   legend: 'Modelo Digital de Superficies LiDAR',
//   matrixSet: 'GoogleMapsCompatible',
// }, {
//   visibility: false,
// });
//map.addLayers(layerUA);
//map.addLayers(layerinicial);
// map.addLayers(ocupacionSuelo);

const capaMVT = new M.layer.MVT({
  url: 'https://a.api.tomtom.com/traffic/map/4/tile/flow/relative/{z}/{x}/{y}.pbf?key=sATA9OwG11zrMKQcCxR3eSEjj2n8Jsrg&1637324528580',
  legend: 'MVT',
  name: 'MVTLayer',
  visibility: true,
});

const estilo = new M.style.Line({
  fill: {
    color: 'yellow',
    width: 1,
  },
  stroke: {
    color: 'red',
    width: 5,
  },
});

capaMVT.setStyle(estilo);

map.addLayers(capaMVT);

//map.refresh();

window.map = map;
