import { map as Mmap } from 'M/mapea';
// OKS
// import { vector_001 } from '../layers/vector/vector';
// import { wfs_001 } from '../layers/wfs/wfs';
// import { wfs_002 } from '../layers/wfs/wfs';
// import { geojson_001 } from '../layers/geojson/geojson';
// import { geojson_002 } from '../layers/geojson/geojson';
// import { kml_001 } from '../layers/kml/kml';
// import { kml_002 } from '../layers/kml/kml';
// import { mvt_001 } from '../layers/mvt/mvt';
// import { mvt_002 } from '../layers/mvt/mvt';
// import { ogcAPIFeatures_001 } from '../layers/ogcApiFeatures/ogcApiFeatures';
// import { ogcAPIFeatures_002 } from '../layers/ogcApiFeatures/ogcApiFeatures';
// import { mbtileVector_001 } from '../layers/mbTilesVector/mbTilesVector';
// import { mbtile_01 } from '../layers/mbtiles/mbtiles';
// import MBTiles from 'M/layer/MBTiles';
// import { osm } from '../layers/osm/osm';
// import { xyz_002 } from '../layers/xyz/xyz';
// import { tms_001 } from '../layers/tms/tms';
// import { wmts_001 } from '../layers/wmts/wmts';
// import { wmts_004 } from '../layers/wmts/wmts';
// import { wms_001 } from '../layers/wms/wms';
// import { wms_003 } from '../layers/wms/wms';

// import { generic_002 } from '../layers/generic/generic';
import { generic_001 } from '../layers/generic/generic';



const mapa = Mmap({
  container: 'map',
  projection: 'EPSG:3857*m',
  center: [-443273.10081370454, 4757481.749296248],
  zoom: 6,
  controls: ['panzoom'],
});

const zoomToLayer = () => {
  const extent = capa.getMaxExtent();
  mapa.setBbox(extent);
  console.log(extent);
}

setTimeout(() => {
  zoomToLayer();
}, "5000");

window.capa = generic_001;
mapa.addLayers(generic_001);


// window.fetch('./cabrera.mbtiles').then((response) => {
//   const mbtile = new MBTiles({
//     name: 'mbtiles',
//     legend: 'Capa MBTiles L',
//     source: response,
//   });
//   mapa.addLayers(mbtile);
//   window.capa = mbtile;
// }).catch((e) => {
//   throw e;
// });


window.mapa = mapa;
