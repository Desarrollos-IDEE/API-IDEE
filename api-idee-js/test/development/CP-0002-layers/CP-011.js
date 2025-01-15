import { map as Mmap } from 'M/mapea';
import { tms_001 } from '../layers/tms/tms';
import { tms_002 } from '../layers/tms/tms';
import { wms_001 } from '../layers/wms/wms';
import { wms_002 } from '../layers/wms/wms';
import { wmts_001 } from '../layers/wmts/wmts';
import { wmts_002 } from '../layers/wmts/wmts';
import { xyz_001 } from '../layers/xyz/xyz';
import { xyz_002 } from '../layers/xyz/xyz';
import { osm } from '../layers/osm/osm';
import { osm_002 } from '../layers/osm/osm';
import { osm_003 } from '../layers/osm/osm';
import { mbtile_01 } from '../layers/mbtiles/mbtiles';
import { generic_002 } from '../layers/generic/generic';


const mapa = Mmap({
  container: 'map',
  projection: 'EPSG:3857*m',
  center: [-443273.10081370454, 4757481.749296248],
  zoom: 6,
  layers: [generic_002],
  controls: ['panzoom'],
});

const checkIsStatusLayer = (zIndex, baseLayers, transparent, isBase) => {
  console.log('1. Según el zindex:')
  if (zIndex === 0) {
    console.log('CAPA BASE');
  } else {
    console.log('CAPA NO BASE');
  }

  console.log('2. Según el getBaseLayers:')
  if (baseLayers.length === 0) {
    console.log('CAPA NO BASE');
  } else {
    console.log('CAPA BASE');
  }

  console.log('3. Según el transparent:')
  if (transparent === true) {
    console.log('CAPA NO BASE');
  } else {
    console.log('CAPA BASE');
  }

  console.log('4. Según el isBase:')
  if (isBase === true) {
    console.log('CAPA BASE');
  } else {
    console.log('CAPA NO BASE');
  }
}

setTimeout(() => {
  checkIsStatusLayer(mapa.getLayers()[0].zindex_, mapa.getBaseLayers(), mapa.getLayers()[0].transparent, mapa.getLayers()[0].isBase);
}, "3000");



window.mapa = mapa;
