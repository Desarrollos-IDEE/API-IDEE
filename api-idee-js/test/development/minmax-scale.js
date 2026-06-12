import { map as Mmap } from 'IDEE/api-idee';
import WFS from 'IDEE/layer/WFS';
import WMTS from 'IDEE/layer/WMTS';
// import WMC from 'IDEE/layer/WMC';
import Vector from 'IDEE/layer/Vector';
import GeoTIFF from 'IDEE/layer/GeoTIFF';
import TMS from 'IDEE/layer/TMS';
import OSM from 'IDEE/layer/OSM';
import OGCAPIFeatures from 'IDEE/layer/OGCAPIFeatures';
import MBTiles from 'IDEE/layer/MBTiles';
import MBTilesVector from 'IDEE/layer/MBTilesVector';
import MapLibre from 'IDEE/layer/MapLibre';
import MVT from 'IDEE/layer/MVT';
import KML from 'IDEE/layer/KML';
import GeoJSON from 'IDEE/layer/GeoJSON';
import WMS from 'IDEE/layer/WMS';

// import Feature from 'IDEE/Feature';

const mapjs = Mmap({
  container: 'map',
  controls: ['scale*1'],
});
window.mapjs = mapjs;

const wmts = new WMTS({
  legend: 'Capa WMTS',
  url: 'http://www.ign.es/wmts/pnoa-ma?',
  name: 'OI.OrthoimageCoverage',
  matrixSet: 'GoogleMapsCompatible',
  format: 'image/png',
}, {
  minScale: 1000000,
  maxScale: 19000000,
});

const tms = new TMS({
  url: 'https://tms-ign-base.idee.es/1.0.0/IGNBaseTodo/{z}/{x}/{-y}.jpeg',
  name: 'TMSBaseIGN',
}, {
  minScale: 1000000,
  maxScale: 19000000,
});

const osm = new OSM({
  name: 'OSM',
  legend: 'OSM',
  url: 'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',

}, {

  minScale: 1000000,
  maxScale: 19000000,
});

const ogcAPIFeatures = new OGCAPIFeatures({
  url: 'https://api-features.idee.es/collections/',
  name: 'falls',
  legend: 'Capa OGCAPIFeatures',
}, {
  minScale: 1000000,
  maxScale: 19000000,
});

const mbTiles = new MBTiles({
  name: 'Capa mbtiles',
  url: `${IDEE.config.STATIC_RESOURCES_URL}/Datos/mbtiles/cabrera.mbtiles`,
}, {
  minScale: 40000,
  maxScale: 160000,
});

const mapLibre = new MapLibre({
  name: 'Mapa Libre',
  url: 'https://vt-mapabase.idee.es/files/styles/mapaBase_scn_color1_CNIG.json',
}, {
  minScale: 800000,
  maxScale: 0,
});

const mvt = new MVT({
  url: 'https://vt-fedme.idee.es/vt.senderogr/{z}/{x}/{y}.pbf',
  // url: 'https://ahocevar.com/geoserver/gwc/service/tms/1.0.0/ne:ne_10m_admin_0_countries@EPSG%3A900913@pbf/{z}/{x}/{-y}.pbf',
  name: 'vectortile',
}, {
  minScale: 1000000,
  maxScale: 19000000,
});

const wms = new WMS({
  url: 'http://www.ideandalucia.es/wms/mta10v_2007?',
  name: 'Limites',
}, {
  minScale: 1000000,
  maxScale: 19000000,
});

const wfs = new WFS({
  url: 'https://www.ign.es/wfs/redes-geodesicas',
  name: 'RED_REGENTE',
  legend: 'Capa WFS',
}, {
  minScale: 1000000,
  maxScale: 19000000,
});

const kml = new KML({
  url: 'https://www.ign.es/web/resources/delegaciones/DelegacionesIGN-APICNIG.kml',
  // url: 'https://componentes-desarrollo.idee.es/files/kml/arbda_sing_se.kml',
  name: 'Capa KML',
}, {
  minScale: 1000000,
  maxScale: 19000000,
});

const geojson = new GeoJSON({
  name: 'capa geojson',
  source: {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'Point',
          coordinates: [
            -5.767822265625,
            37.47485808497102,
          ],
        },
      },
      {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'Point',
          coordinates: [
            -5.4052734375,
            37.52715361723378,
          ],
        },
      },
      {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'Point',
          coordinates: [
            -4.801025390625,
            37.88352498087131,
          ],
        },
      },
      {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'Point',
          coordinates: [
            -5.515136718749999,
            37.081475648860525,
          ],
        },
      },
      {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'Point',
          coordinates: [
            -4.9658203125,
            37.19533058280065,
          ],
        },
      },
      {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'Point',
          coordinates: [
            -3.6254882812499996,
            37.34395908944491,
          ],
        },
      },
      {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'Point',
          coordinates: [
            -3.80126953125,
            37.96152331396614,
          ],
        },
      },
      {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'Point',
          coordinates: [
            -4.515380859375,
            37.64903402157866,
          ],
        },
      },
    ],
  },
}, {
  minScale: 1000000,
  maxScale: 19000000,
});

const geojson2 = new GeoJSON({
  name: 'capaJson',
  source: {
    type: 'FeatureCollection',
    features: [{
      properties: {
        estado: 1,
        vendor: {
          api_idee: {},
        },
        sede: '/Sevilla/CHGCOR003-Oficina de la zona regable del Genil',
        tipo: 'ADSL',
        name: '/Sevilla/CHGCOR003-Oficina de la zona regable del Genil',
      },
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [-5.278075, 37.69374444444444],
      },
    }],
    crs: {
      properties: {
        name: 'EPSG:4326',
      },
      type: 'name',
    },
  },
}, {
  minScale: 1000000,
  maxScale: 19000000,
});

const layerGeoTIFF = new GeoTIFF({
  // url: 'https://sentinel-cogs.s3.us-west-2.amazonaws.com/sentinel-s2-l2a-cogs/36/Q/WD/2020/7/S2A_36QWD_20200701_0_L2A/TCI.tif',
  url: 'https://ftpcdd.cnig.es/Vuelos_2021/Vuelos_2021/catalunya_2021/Costa/01.VF/01.08_PNOA_2021_CAT_COSTA_22cm_VF_img8c_rgb_hu31/h50_0219_fot_002-0001_cog.tif',
  // url: 'http://ftpcdd.cnig.es/Vuelos_2015_2016/Vuelos_2015/Baleares/1.VF/1.08_PNOA_L6_2015_BAL_25cm_VF_img8c_rgb_hu31/h50_0697_fot_002-0026.tif',
  // url: 'http://ftpcdd.cnig.es/Vuelos_2022/Vuelos_2022/murcia_2022/01.VF/01.08_PNOA_2022_MUR_35cm_VF_img8c_rgb_hu30/h50_0932_fot_011-0034_cog.tif',
  // url: 'http://ftpcdd.cnig.es/PUBLICACION_CNIG_DATOS_VARIOS/MDT05/MDT05_ETRS89_HU30_ENTPNOA50/PNOA_MDT05_ETRS89_HU30_0685_LID.tif',
  name: 'Nombre geotiff',
  legend: 'Leyenda geotiff',
  transparent: true,
}, {
  minScale: 1000000,
  maxScale: 19000000,
});

mapjs.addLayers([wmts]);
mapjs.addLayers([tms]);
mapjs.addLayers([osm]);
mapjs.addLayers([ogcAPIFeatures]);
mapjs.addLayers([mbTiles]);
mapjs.addLayers([mapLibre]);
mapjs.addLayers([mvt]);
mapjs.addLayers([wms]);
mapjs.addLayers([wfs]);
mapjs.addLayers([kml]);
mapjs.addLayers([geojson]);
mapjs.addLayers([geojson2]);
mapjs.addLayers([layerGeoTIFF]);

setTimeout(() => {
  console.log('wmts', wmts.getMinScale());
  console.log('tms', tms.getMinScale());
  console.log('osm', osm.getMinScale());
  console.log('ogcAPIFeatures', ogcAPIFeatures.getMinScale());
  console.log('mbTiles', mbTiles.getMinScale());
  console.log('mapLibre', mapLibre.getMinScale());
  console.log('mvt', mvt.getMinScale());
  console.log('wms', wms.getMinScale());
  console.log('wfs', wfs.getMinScale());
  console.log('kml', kml.getMinScale());
  console.log('geojson', geojson.getMinScale());
  console.log('geojson2', geojson2.getMinScale());
  console.log('layerGeoTIFF', layerGeoTIFF.getMinScale());
}, 5000);
