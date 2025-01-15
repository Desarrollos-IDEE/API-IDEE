import { map as Mmap } from 'M/mapea';
// import { vector_001 } from '../layers/vector/vector';
// import { wfs_001 } from '../layers/wfs/wfs';
// import { geojson_001 } from '../layers/geojson/geojson';
// import { kml_001 } from '../layers/kml/kml';
import { mvt_001 } from '../layers/mvt/mvt';
// import { ogcAPIFeatures_001 } from '../layers/ogcApiFeatures/ogcApiFeatures';
// import { mbtileVector_001 } from '../layers/mbTilesVector/mbTilesVector';
import { generic_002 } from '../layers/generic/generic';

// ---

// import { tms_001 } from '../layers/tms/tms';
// import { wms_001 } from '../layers/wms/wms';
// import { wmts_001 } from '../layers/wmts/wmts';
// import { xyz_001 } from '../layers/xyz/xyz';
// import { osm } from '../layers/osm/osm';
// import { mbtile_01 } from '../layers/mbtiles/mbtiles';
import { generic_001 } from '../layers/generic/generic';



const mapa = Mmap({
  container: 'map',
  projection: 'EPSG:3857*m',
  center: [-443273.10081370454, 4757481.749296248],
  zoom: 6,
});


// [-] KML
// mapa.addLayers(kml_001)
// console.log(kml_001.getMaxExtent())
// setTimeout(() => {
//   kml_001.setMaxExtent([-1259872.4694101033, 4359275.566199489, -85799.71494979598, 4620384.454821652])
// }, 5000);

// [-] MVT
mapa.addLayers(mvt_001)
// console.log(mvt_001.getMaxExtent())
// setTimeout(() => {
//     mvt_001.setMaxExtent([-1259872.4694101033, 4359275.566199489, -85799.71494979598, 4620384.454821652])
// }, 5000);

// [-] WFS
// mapa.addLayers(wfs_001)
// console.log(wfs_001.getMaxExtent())
// setTimeout(() => {
//     wfs_001.setMaxExtent([-1259872.4694101033, 4359275.566199489, -85799.71494979598, 4620384.454821652])
// }, 5000);

// [-] Vector
// mapa.addLayers(vector_001)
// console.log(vector_001.getMaxExtent())
// setTimeout(() => {
//     vector_001.setMaxExtent([-1259872.4694101033, 4359275.566199489, -85799.71494979598, 4620384.454821652])
// }, 5000);

// [-] GeoJSON
// mapa.addLayers(geojson_001)
// console.log(geojson_001.getMaxExtent())
// setTimeout(() => {
//     geojson_001.setMaxExtent([-1259872.4694101033, 4359275.566199489, -85799.71494979598, 4620384.454821652])
// }, 5000);

// [-] mbtilesvector
// mapa.addLayers(mbtileVector_001)
// console.log(mbtileVector_001.getMaxExtent())
// setTimeout(() => {
//   mbtileVector_001.setMaxExtent([-1259872.4694101033, 4359275.566199489, -85799.71494979598, 4620384.454821652])
// }, 5000);

// [-] OGCAPI
// mapa.addLayers(ogcAPIFeatures_001)
// console.log(ogcAPIFeatures_001.getMaxExtent())
// setTimeout(() => {
//     ogcAPIFeatures_001.setMaxExtent([-1259872.4694101033, 4359275.566199489, -85799.71494979598, 4620384.454821652])
// }, 5000);

// [-] GenericVector
// mapa.addLayers(generic_002)
// console.log(generic_002.getMaxExtent())
// setTimeout(() => {
//     generic_002.setMaxExtent([-1259872.4694101033, 4359275.566199489, -85799.71494979598, 4620384.454821652])
// }, 5000);

// [-] GenericRaster
// mapa.addLayers(generic_001)
// console.log(generic_001.getMaxExtent())
// setTimeout(() => {
//   generic_001.setMaxExtent([-1259872.4694101033, 4359275.566199489, -85799.71494979598, 4620384.454821652])
// }, 5000);

// [-] WMS
// mapa.addLayers(wms_001)

// [-] WMTS
// mapa.addLayers(wmts_001)
// console.log(osm.getMaxExtent())
// setTimeout(() => {
//     osm.setMaxExtent([-1259872.4694101033, 4359275.566199489, -85799.71494979598, 4620384.454821652])
// }, 5000);


// [-] TMS
// mapa.addLayers(tms_001)
// console.log(tms_001.getMaxExtent())
// setTimeout(() => {
//   tms_001.setMaxExtent([-1259872.4694101033, 4359275.566199489, -85799.71494979598, 4620384.454821652])
// }, 5000);

// [-] XYZ
// mapa.addLayers(xyz_001)
// console.log(xyz_001.getMaxExtent())
// setTimeout(() => {
//   xyz_001.setMaxExtent([-1259872.4694101033, 4359275.566199489, -85799.71494979598, 4620384.454821652])
// }, 5000);

// [-] OSM
// mapa.addLayers(osm)
// console.log(osm.getMaxExtent())
// setTimeout(() => {
//     osm.setMaxExtent([-1259872.4694101033, 4359275.566199489, -85799.71494979598, 4620384.454821652])
// }, 5000);

// [-] MBTILES
// mapa.addLayers(mbtile_01)
// console.log(mbtile_01.getMaxExtent())
// setTimeout(() => {
//     mbtile_01.setMaxExtent([-1259872.4694101033, 4359275.566199489, -85799.71494979598, 4620384.454821652])
// }, 5000);

window.mapa = mapa;
