import { map as Mmap } from 'IDEE/api-idee';
import KML from 'IDEE/layer/KML';
import GeoPackage from 'IDEE/layer/GeoPackage';
import LayerGroup from 'IDEE/layer/LayerGroup';
import GeoPackageTile from 'IDEE/layer/GeoPackageTile';
import WMS from 'IDEE/layer/WMS';

const mapajs = Mmap({
  container: 'map',
});
window.map = mapajs;

fetch('https://componentes.idee.es/estaticos/Datos/gpkg/rivers.gpkg').then((data) => {
  const gpkg2 = new GeoPackage(data);
  const wms_001 = new WMS({
    url: 'https://www.ign.es/wms-inspire/unidades-administrativas?',
    name: 'AU.AdministrativeUnit',
  });
  const delegaciones = new KML({
    url: 'https://www.ign.es/web/resources/delegaciones/DelegacionesIGN-APICNIG.kml',
    name: 'capaKML',
    extract: true,
  });
  const subLayerGroup = new LayerGroup({
    name: 'Grupo de capas 2',
    legend: 'Grupo de capas LEGEND 2',
    layers: [gpkg2, delegaciones],
  });

  mapajs.addLayers(subLayerGroup);

  mapajs.addLayers(wms_001);
});

// fetch('https://componentes.idee.es/estaticos/Datos/gpkg/rivers.gpkg').then((data) => {
//   const gpkg = new GeoPackage(data, {
//     rivers_tiles: {
//       attribution: {
//         name: 'GeoPackage Tile',
//         description: 'Description Prueba',
//         url: 'https://www.ign.es',
//         contentAttributions: 'https://componentes.idee.es/estaticos/Datos/reconocimientos/WMTS_PNOA_20170220/atribucionPNOA_Url.kml',
//         contentType: 'kml',
//       },
//       name: 'Geopackage Raster',
//       legend: 'Rivers Tiles',
//       // isBase: true,
//       isBase: false,
//       // maxExtent: [422343.0181535501, 4728925.523527809, 3488933.8294125344, 7233614.06637646],
//       // displayInLayerSwitcher: true,
//       displayInLayerSwitcher: false,
//       // tileLoadFunction: (z, x, y) => {
//       //   return new Promise((resolve) => {
//       //     if (z >= 3 && x > 5 && x < 22 && y < 6) {
//       //       resolve('https://cdn-icons-png.flaticon.com/512/4616/4616040.png');
//       //     } else {
//       //       resolve('');
//       //     }
//       //   });
//       // opacity: 0.3,
//       // visibility: false,
//       visibility: true,
//       // minZoom: 7,
//       // maxZoom: 10,
//     },
//     rivers: {
//       attribution: {
//         name: 'GeoPackage Vector',
//         description: 'Description Prueba',
//         url: 'https://www.ign.es',
//         contentAttributions: 'https://componentes.idee.es/estaticos/Datos/reconocimientos/WMTS_PNOA_20170220/atribucionPNOA_Url.kml',
//         contentType: 'kml',
//       },
//       //name: 'GeoPackage GeoJSON',
//       legend: 'GeoPackage Vector',
//       // isBase: true,
//       isBase: false,
//       // extract: false,
//       extract: true,
//       infoEventType: 'click',
//       // infoEventType: 'hover',
//       // template: '<div>Template personalizado</div>',
//       // maxExtent: [422343.0181535501, 4728925.523527809, 3488933.8294125344, 7233614.06637646],
//     },
//   });
//   mapajs.addGeoPackage(gpkg);
//   window.gpkg1 = gpkg;
// });
