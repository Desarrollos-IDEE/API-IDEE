import { map as Mmap } from 'M/mapea';

import { tms_001 } from '../layers/tms/tms';
import { wms_001 } from '../layers/wms/wms';
import { wmts_001 } from '../layers/wmts/wmts';
import { xyz_001 } from '../layers/xyz/xyz';
import { osm } from '../layers/osm/osm';
import { mbtile_01 } from '../layers/mbtiles/mbtiles';

import { vector_001 } from '../layers/vector/vector';
import { wfs_001 } from '../layers/wfs/wfs';
import { geojson_001 } from '../layers/geojson/geojson';
import { kml_001 } from '../layers/kml/kml';
import { mvt_001 } from '../layers/mvt/mvt'; // Mode 'feature'
// import { mvt_003 } from '../layers/mvt/mvt'; // Mode 'render'
import { ogcAPIFeatures_001 } from '../layers/ogcApiFeatures/ogcApiFeatures';


const mapa = Mmap({
    container: 'map',
    projection: 'EPSG:3857*m',
    center: [-443273.10081370454, 4757481.749296248],
    zoom: 6,
});

const layers = [
    tms_001,
    wms_001,
    wmts_001,
    xyz_001,
    osm,
    //-
    mbtile_01,
    vector_001,
    wfs_001,
    geojson_001,
    kml_001,
    mvt_001,
    // mvt_003,
    ogcAPIFeatures_001,
]

mapa.addLayers(layers);

console.log('-> AllLayers', layers)
console.log('-> getLayers', mapa.getLayers())
console.log('-> getBaseLayers', mapa.getBaseLayers())


window.mapa = mapa;
// window.tms = tms_001;
// window.wms = wms_001;
// window.wmts = wmts_001;
// window.xyz = xyz_001;
// window.osm = osm;
// window.mbtile = mbtile_01;
