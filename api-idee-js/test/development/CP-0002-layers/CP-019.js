/* eslint-disable max-len,object-property-newline,no-underscore-dangle */
import { Image, Vector as VectorLayer } from 'ol/layer';
import ImageWMS from 'ol/source/ImageWMS';
import VectorSource from 'ol/source/Vector';
import { Fill, Stroke, Style } from 'ol/style';
import { bbox as bboxStrategy } from 'ol/loadingstrategy';
import { map as Mmap } from 'M/mapea';
import Generic from 'M/style/Generic';
import { default as OlGeoJSON } from 'ol/format/GeoJSON';

// Capas Vectoriales
import Vector from 'M/layer/Vector';
import GeoJSON from 'M/layer/GeoJSON';
import WFS from 'M/layer/WFS';
import KML from 'M/layer/KML';
import MVT from 'M/layer/MVT'; // Mode 'feature' y 'render'
import OGCAPIFeatures from 'M/layer/OGCAPIFeatures';
import MBTilesVector from 'M/layer/MBTilesVector';
import GenericVector from 'M/layer/GenericVector';

// Capas Rasters
import TMS from 'M/layer/TMS';
import WMS from 'M/layer/WMS';
import WMTS from 'M/layer/WMTS';
import XYZ from 'M/layer/XYZ';
import OSM from 'M/layer/OSM';
import MBTiles from 'M/layer/MBTiles';
import GeoTIFF from 'M/layer/GeoTIFF';
import MapLibre from 'M/layer/MapLibre';
import GenericRaster from 'M/layer/GenericRaster';

const mapa = Mmap({
  container: 'map',
  center: [-443273.10081370454, 4757481.749296248],
  zoom: 6,
});
window.mapa = mapa;

// Parámetros default
const defaultParam1 = { minZoom: 1, maxZoom: 15 };
// TODO: input de valores customizados en la WEB
// const defaultParam1 = { minZoom: 0, maxZoom: 12 }; // PRUEBA minZoom COMO CERO
// const defaultParam1 = { minZoom: 4, maxZoom: 0 }; // PRUEBA maxZoom COMO CERO
// const defaultParam1 = { minZoom: 2, maxZoom: 14 }; // PRUEBA DE IGUAL PARÁMETROS defaultParam1 === defaultParam2
const defaultParam2 = { minZoom: 2, maxZoom: 14 };
const defaultParam3 = { minZoom: 3, maxZoom: 13 };
const pruebaSet = { minZoom: 5, maxZoom: 11 };
const pruebaImplSet = { minZoom: 6, maxZoom: 10 };
const minMaxZoomKeyCount = Object.keys(defaultParam1).length;

const defaultTileGridMaxZoom1 = { tileGridMaxZoom: 7 };
const defaultTileGridMaxZoom2 = { tileGridMaxZoom: 8 };
const defaultTileGridMaxZoom3 = { tileGridMaxZoom: 9 };
const TileGridMaxKeyCount = Object.keys(defaultTileGridMaxZoom1).length;

const headerList = ['Capa', 'minZoom', 'impl.minZoom', 'maxZoom', 'impl.maxZoom', 'tileGridMaxZoom'];

// Parámetros re-utilizados
let allParameters; let commonList;

// Checkboxes para escoger al cual parámetro se añade minZoom y maxZoom.
const emptyObject = {};
const param1config = document.getElementById('param1config'); const param2config = document.getElementById('param2config'); const param3config = document.getElementById('param3config');
let applyParam1 = emptyObject; param1config.checked = false; param1config.labels[0].innerText = `1º Param ${defaultParam1.minZoom} ${defaultParam1.maxZoom}`; param1config.addEventListener('change', (inp) => { applyParam1 = inp.target.checked ? defaultParam1 : emptyObject; });
let applyParam2 = emptyObject; param2config.checked = false; param2config.labels[0].innerText = `2º Param ${defaultParam2.minZoom} ${defaultParam2.maxZoom}`; param2config.addEventListener('change', (inp) => { applyParam2 = inp.target.checked ? defaultParam2 : emptyObject; });
let applyParam3 = emptyObject; param3config.checked = false; param3config.labels[0].innerText = `3º Param ${defaultParam3.minZoom} ${defaultParam3.maxZoom}`; param3config.addEventListener('change', (inp) => { applyParam3 = inp.target.checked ? defaultParam3 : emptyObject; });

// Radio para escoger al cual parámetro se añade tileGridMaxZoom.
const TileGrid1config = document.getElementById('noTileGrid'); TileGrid1config.checked = true;
const TileGrid2config = document.getElementById('7TileGrid'); let applyTileGrid1 = emptyObject; TileGrid2config.checked = false; TileGrid2config.labels[0].innerText = `1º Zoom ${defaultTileGridMaxZoom1.tileGridMaxZoom}`;
const TileGrid3config = document.getElementById('8TileGrid'); let applyTileGrid2 = emptyObject; TileGrid3config.checked = false; TileGrid3config.labels[0].innerText = `2º Zoom ${defaultTileGridMaxZoom2.tileGridMaxZoom}`;
const TileGrid4config = document.getElementById('9TileGrid'); let applyTileGrid3 = emptyObject; TileGrid4config.checked = false; TileGrid4config.labels[0].innerText = `3º Zoom ${defaultTileGridMaxZoom3.tileGridMaxZoom}`;
const radioEvent = (evt) => {
  if (evt.target.checked) {
    const type = Number.parseInt(evt.target.value, 10);
    if (type === 2) { applyTileGrid1 = defaultTileGridMaxZoom1; } else { applyTileGrid1 = emptyObject; }
    if (type === 3) { applyTileGrid2 = defaultTileGridMaxZoom2; } else { applyTileGrid2 = emptyObject; }
    if (type === 4) { applyTileGrid3 = defaultTileGridMaxZoom3; } else { applyTileGrid3 = emptyObject; }
  }
};
TileGrid1config.addEventListener('change', radioEvent); TileGrid2config.addEventListener('change', radioEvent); TileGrid3config.addEventListener('change', radioEvent); TileGrid4config.addEventListener('change', radioEvent);

// Preparar panel de pruebas con tabla
const popupDePruebas = document.getElementById('popup_de_test').classList;
document.getElementById('abrir_test').addEventListener('click', () => { popupDePruebas.value = 'active'; });
document.getElementById('cerrar_test').addEventListener('click', () => { popupDePruebas.value = 'notactive'; });
const testTableBody = document.getElementById('t_t_body');

// Funciones
const refreshTableContent = () => {
  // Añadir a tabla todas las capas
  commonList.forEach((l) => {
    const layerRow = document.createElement('tr');
    const naming = l.type + (l.mode || '');
    const currentParameters = allParameters[naming];

    // Capa
    const Capa = document.createElement('td');
    Capa.innerText = naming;
    layerRow.append(Capa);

    // minZoom
    const minZoom = document.createElement('td');
    minZoom.innerText = l.getMinZoom();
    layerRow.append(minZoom);
    // impl.minZoom
    const implMinZoom = document.createElement('td');
    implMinZoom.innerText = l.impl_.getMinZoom();
    layerRow.append(implMinZoom);
    if (minZoom.innerText === implMinZoom.innerText) {
      minZoom.classList.add('okZoom');
      implMinZoom.classList.add('okZoom');
    } else {
      minZoom.classList.add('errZoom');
      implMinZoom.classList.add('errZoom');
    }
    if (currentParameters[0].minZoom && Number.parseInt(minZoom.innerText, 10) !== currentParameters[0].minZoom) { minZoom.classList.add('warningZoom'); minZoom.setAttribute('title', `Tiene que ser ${currentParameters[0].minZoom}`); }
    if (currentParameters[1].minZoom && Number.parseInt(implMinZoom.innerText, 10) !== currentParameters[1].minZoom) { implMinZoom.classList.add('warningZoom'); implMinZoom.setAttribute('title', `Tiene que ser ${currentParameters[1].minZoom}`); }

    // maxZoom
    const maxZoom = document.createElement('td');
    maxZoom.innerText = l.getMaxZoom();
    layerRow.append(maxZoom);
    // impl.maxZoom
    const implMaxZoom = document.createElement('td');
    implMaxZoom.innerText = l.impl_.getMaxZoom();
    layerRow.append(implMaxZoom);
    if (maxZoom.innerText === implMaxZoom.innerText) {
      maxZoom.classList.add('okZoom');
      implMaxZoom.classList.add('okZoom');
    } else {
      maxZoom.classList.add('errZoom');
      implMaxZoom.classList.add('errZoom');
    }
    if (currentParameters[0].maxZoom && Number.parseInt(maxZoom.innerText, 10) !== currentParameters[0].maxZoom) { maxZoom.classList.add('warningZoom'); maxZoom.setAttribute('title', `Tiene que ser ${currentParameters[0].maxZoom}`); }
    if (currentParameters[1].maxZoom && Number.parseInt(implMaxZoom.innerText, 10) !== currentParameters[1].maxZoom) { implMaxZoom.classList.add('warningZoom'); implMaxZoom.setAttribute('title', `Tiene que ser ${currentParameters[1].maxZoom}`); }

    // tileGridMaxZoom
    const tileGridMaxZoom = document.createElement('td');
    tileGridMaxZoom.innerText = `${l.tileGridMaxZoom} ${l.impl_.tileGridMaxZoom}`;
    layerRow.append(tileGridMaxZoom);
    if (l.tileGridMaxZoom === l.impl_.tileGridMaxZoom) {
      tileGridMaxZoom.classList.add('okZoom');
    } else {
      tileGridMaxZoom.classList.add('errZoom');
    }

    testTableBody.append(layerRow);
  });
};
window.refreshTableContent = refreshTableContent;

const generateHeadertable = () => {
  const tableHeader = document.createElement('tr');
  headerList.forEach((n) => {
    const auxColumn = document.createElement('th');
    auxColumn.innerText = n;
    tableHeader.append(auxColumn);
  });
  testTableBody.append(tableHeader);
};

const generateLayersTable = () => {
  // --- CAPAS VECTORIALES ---
  // Capa Vector
  const vector1 = {
    name: 'capaVectorial', legend: 'Capa Vector',
    ...applyParam1, // minZoom, maxZoom
    ...applyTileGrid1,
  };
  const vector2 = {
    ...applyParam2, // minZoom, maxZoom
    ...applyTileGrid2,
  };
  const vector3 = { ...applyParam3, ...applyTileGrid3 };
  const VectorParam = [vector1, vector2, vector3];
  const vector0 = new Vector(vector1, vector2, vector3); // */

  // Capa GeoJSON
  const geojson1 = {
    name: 'Municipios',
    url: 'http://geostematicos-sigc.juntadeandalucia.es/geoserver/tematicos/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=tematicos:Municipios&maxFeatures=50&outputFormat=application/json',
    extract: true,
    ...applyParam1, // minZoom, maxZoom
    ...applyTileGrid1,
  };
  const geojson2 = {
    ...applyParam2, // minZoom, maxZoom
    ...applyTileGrid2,
  };
  const geojson3 = { ...applyParam3, ...applyTileGrid3 };
  const GeoJSONParam = [geojson1, geojson2, geojson3];
  const geojson0 = new GeoJSON(geojson1, geojson2, geojson3); // */

  // Capa WFS
  const wfs1 = {
    name: 'provincias_pob', legend: 'Provincias',
    url: 'http://geostematicos-sigc.juntadeandalucia.es/geoserver/tematicos/ows?',
    namespace: 'tematicos',
    geometry: 'MPOLYGON',
    ...applyParam1, // minZoom, maxZoom // NEVER USED
    ...applyTileGrid1,
  };
  const wfs2 = {
    ...applyParam2, // minZoom, maxZoom
    ...applyTileGrid2,
  };
  const wfs3 = { ...applyParam3, ...applyTileGrid3 };
  const WFSParam = [wfs1, wfs2, wfs3];
  const wfs0 = new WFS(wfs1, wfs2, wfs3); // */

  // Capa KML
  const kml1 = {
    name: 'capaKML',
    url: 'https://componentes.cnig.es/api-core/files/attributions/WMTS_PNOA_20170220/atribucionPNOA_Url.kml',
    extract: true,
    visibility: true,
    ...applyParam1, // minZoom, maxZoom // NEVER USED
    ...applyTileGrid1,
  };
  const kml2 = {
    ...applyParam2, // minZoom, maxZoom
    ...applyTileGrid2,
  };
  const kml3 = { ...applyParam3, ...applyTileGrid3 };
  const KMLParam = [kml1, kml2, kml3];
  const kml0 = new KML(kml1, kml2, kml3); // */

  // Capa MVT Feature
  const mvtFeature1 = { // Mode 'feature'
    name: 'sendero_gr',
    url: 'https://vt-fedme.idee.es/vt.senderogr/{z}/{x}/{y}.pbf',
    mode: 'feature',
    extract: true,
    ...applyParam1, // minZoom, maxZoom
    ...applyTileGrid1,
  };
  const mvtFeature2 = {
    ...applyParam2, // minZoom, maxZoom
    ...applyTileGrid2,
  };
  const mvtFeature3 = { ...applyParam3, ...applyTileGrid3 };
  const MVTfeatureParam = [mvtFeature1, mvtFeature2, mvtFeature3];
  const mvtFeature0 = new MVT(mvtFeature1, mvtFeature2, mvtFeature3); // */

  // Capa MVT Render
  const mvtRender1 = { // Mode 'render'
    name: 'sendero_gr',
    url: 'https://vt-fedme.idee.es/vt.senderogr/{z}/{x}/{y}.pbf',
    mode: 'render',
    extract: true,
    infoEventType: 'click',
    ...applyParam1, // minZoom, maxZoom
    ...applyTileGrid1,
  };
  const mvtRender2 = {
    ...applyParam2, // minZoom, maxZoom
    ...applyTileGrid2,
    style: new Generic({
      point: { radius: 10, fill: { color: 'blue' } },
      polygon: { fill: { color: 'red' } },
      line: { stroke: { color: 'black' } },
    }),
  };
  const mvtRender3 = { ...applyParam3, ...applyTileGrid3 };
  const MVTrenderParam = [mvtRender1, mvtRender2, mvtRender3];
  const mvtRender0 = new MVT(mvtRender1, mvtRender2, mvtRender3); // */

  // Capa OGCAPIFeatures
  const ogcAPIFeatures1 = {
    name: 'falls', legend: 'Capa OGCAPIFeatures',
    url: 'https://api-features.idee.es/collections/',
    extract: true,
    ...applyParam1, // minZoom, maxZoom // NEVER USED
    ...applyTileGrid1,
  };
  const ogcAPIFeatures2 = {
    ...applyParam2, // minZoom, maxZoom
    ...applyTileGrid2,
  };
  const ogcAPIFeatures3 = { ...applyParam3, ...applyTileGrid3 };
  const OGCAPIFeaturesParam = [ogcAPIFeatures1, ogcAPIFeatures2, ogcAPIFeatures3];
  const ogcAPIFeatures0 = new OGCAPIFeatures(ogcAPIFeatures1, ogcAPIFeatures2, ogcAPIFeatures3); // */

  // Capa MBTilesVector // Muchos console
  const mbtileVector1 = {
    name: 'mbtilesvector', legend: 'Capa personalizada MBTilesVector',
    extract: true,
    tileLoadFunction: (z, x, y) => {
      return new Promise((resolve) => {
        fetch(`https://ahocevar.com/geoserver/gwc/service/tms/1.0.0/ne:ne_10m_admin_0_countries@EPSG%3A900913@pbf/${z}/${x}/${y}.pbf`).then((response) => {
          resolve(response.arrayBuffer());
        });
      });
    },
    ...applyParam1, // minZoom, maxZoom // NEVER USED
    ...applyTileGrid1,
  };
  const mbtileVector2 = {
    ...applyParam2, // minZoom, maxZoom
    ...applyTileGrid2,
  };
  const mbtileVector3 = { ...applyParam3, ...applyTileGrid3 };
  const MBTilesVectorParam = [mbtileVector1, mbtileVector2, mbtileVector3];
  const mbtileVector0 = new MBTilesVector(mbtileVector1, mbtileVector2, mbtileVector3); // */

  // Capa GenericVector
  const genericVector1 = {
    name: 'Prueba GenericVector', legend: 'capaGenericVector',
    ...applyParam1, // minZoom, maxZoom
    ...applyTileGrid1,
  };
  const genericVector2 = {
    ...applyParam2, // minZoom, maxZoom
    ...applyTileGrid2,
  };
  const genericVector3 = new VectorLayer({
    source: new VectorSource({
      format: new OlGeoJSON(),
      url: 'https://geostematicos-sigc.juntadeandalucia.es/geoserver/tematicos/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=tematicos:Provincias&maxFeatures=50&outputFormat=application%2Fjson',
      strategy: bboxStrategy,
    }),
    style: new Style({
      fill: new Fill({ color: 'rgba(255, 0, 0, 0.5)' }), // Relleno rojo semi-transparente
      stroke: new Stroke({ color: 'rgba(255, 0, 0, 1)', width: 2 }), // Borde rojo con ancho
    }),
  });
  if (minMaxZoomKeyCount === Object.keys(applyParam3).length) { // ...applyParam3
    genericVector3.minZoom = applyParam3.minZoom;
    genericVector3.maxZoom = applyParam3.maxZoom;
  }
  if (TileGridMaxKeyCount === Object.keys(applyTileGrid3).length) { // ...applyTileGrid3
    genericVector3.tileGridMaxZoom = applyTileGrid3.tileGridMaxZoom;
  }
  const GenericVectorParam = [genericVector1, genericVector2, genericVector3];
  const genericVector0 = new GenericVector(genericVector1, genericVector2, genericVector3); // */

  // --- CAPAS RASTERS ---
  // Capa TMS
  const tms1 = {
    name: 'TMSBaseIGN', legend: 'Capa TMS',
    url: 'https://tms-ign-base.ign.es/1.0.0/IGNBaseTodo/{z}/{x}/{-y}.jpeg',
    projection: 'EPSG:3857',
    transparent: false,
    crossOrigin: 'anonymous',
    // tileGridMaxZoom: 10, // Afecta minZoom y maxZoom.
    ...applyParam1, // minZoom, maxZoom // NEVER USED
    ...applyTileGrid1,
  };
  const tms2 = {
    ...applyParam2, // minZoom, maxZoom
    ...applyTileGrid2,
  };
  const tms3 = { ...applyParam3, ...applyTileGrid3 };
  const TMSParam = [tms1, tms2, tms3];
  const tms0 = new TMS(tms1, tms2, tms3); // */

  // Capa WMS
  const wms1 = {
    name: 'tematicos:Municipios', legend: 'Capa WMS',
    url: 'http://geostematicos-sigc.juntadeandalucia.es/geoserver/tematicos/wms?',
    ...applyParam1, // minZoom, maxZoom // NEVER USED
    ...applyTileGrid1,
  };
  const wms2 = {
    ...applyParam2, // minZoom, maxZoom
    ...applyTileGrid2,
  };
  const wms3 = { ...applyParam3, ...applyTileGrid3 };
  const WMSParam = [wms1, wms2, wms3];
  const wms0 = new WMS(wms1, wms2, wms3); // */

  // Capa WMTS
  const wmts1 = {
    name: 'EL.GridCoverageDSM', legend: 'Modelo Digital de Superficies LiDAR',
    url: 'https://wmts-mapa-lidar.idee.es/lidar',
    matrixSet: 'GoogleMapsCompatible',
    ...applyParam1, // minZoom, maxZoom
    ...applyTileGrid1,
  };
  const wmts2 = {
    ...applyParam2, // minZoom, maxZoom
    ...applyTileGrid2,
  };
  const wmts3 = { ...applyParam3, ...applyTileGrid3 };
  const WMTSParam = [wmts1, wmts2, wmts3];
  const wmts0 = new WMTS(wmts1, wmts2, wmts3); // */

  // Capa XYZ // Muchos console
  const xyz1 = {
    name: 'AtlasDeCresques', legend: 'Leyenda XYZ',
    url: 'https://www.ign.es/web/catalogo-cartoteca/resources/webmaps/data/cresques/{z}/{x}/{y}.jpg',
    projection: 'EPSG:3857',
    maxExtent: [-1259872.4694101033, 4359275.566199489, -85799.71494979598, 4620384.454821652],
    // tileGridMaxZoom: 5,
    ...applyParam1, // minZoom, maxZoom // NEVER USED
    ...applyTileGrid1,
  };
  const xyz2 = {
    ...applyParam2, // minZoom, maxZoom
    ...applyTileGrid2,
  };
  const xyz3 = { ...applyParam3, ...applyTileGrid3 };
  const XYZParam = [xyz1, xyz2, xyz3];
  const xyz0 = new XYZ(xyz1, xyz2, xyz3); // */

  // Capa OSM
  const osm1 = {
    name: 'OSM', legend: 'OSM',
    url: 'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
    matrixSet: 'EPSG:3857',
    transparent: true,
    visibility: true,
    ...applyParam1, // minZoom, maxZoom
    ...applyTileGrid1,
  };
  const osm2 = {
    ...applyParam2, // minZoom, maxZoom // NEVER USED
    ...applyTileGrid2,
  };
  const osm3 = { ...applyParam3, ...applyTileGrid3 };
  const OSMParam = [osm1, osm2, osm3];
  const osm0 = new OSM(osm1, osm2, osm3); // */

  // Capa MBTiles
  const mbtile1 = {
    name: 'mbtilesLoadFunction', legend: 'Capa personalizada MBTiles',
    tileLoadFunction: (z, x, y) => {
      return new Promise((resolve) => {
        if (z > 4) {
          resolve('https://cdn-icons-png.flaticon.com/512/4616/4616040.png');
        } else {
          resolve('https://cdn.icon-icons.com/icons2/2444/PNG/512/location_map_pin_direction_icon_148665.png');
        }
      });
    },
    visibility: true,
    ...applyParam1, // minZoom, maxZoom // NEVER USED
    ...applyTileGrid1,
  };
  const mbtile2 = {
    ...applyParam2, // minZoom, maxZoom
    ...applyTileGrid2,
  };
  const mbtile3 = { ...applyParam3, ...applyTileGrid3 };
  const MBTilesParam = [mbtile1, mbtile2, mbtile3];
  const mbtile0 = new MBTiles(mbtile1, mbtile2, mbtile3); // */

  // Capa GenericRaster
  const genericRaster1 = {
    name: 'Nombre de prueba', legend: 'capaGenericRaster',
    ...applyParam1, // minZoom, maxZoom
    ...applyTileGrid1,
  };
  const genericRaster2 = {
    ...applyParam2, // minZoom, maxZoom
    ...applyTileGrid2,
    visibility: true,
    displayInLayerSwitcher: true,
    opacity: 0.5,
    queryable: true,
  };
  const genericRaster3 = new Image({
    source: new ImageWMS({ url: 'http://geostematicos-sigc.juntadeandalucia.es/geoserver/tematicos/wms?', params: { LAYERS: 'tematicos:Municipios' }, legend: 'Capa WMS' }),
  });
  if (minMaxZoomKeyCount === Object.keys(applyParam3).length) { // ...applyParam3
    genericRaster3.minZoom = applyParam3.minZoom;
    genericRaster3.maxZoom = applyParam3.maxZoom;
  }
  if (TileGridMaxKeyCount === Object.keys(applyTileGrid3).length) { // ...applyTileGrid3
    genericRaster3.tileGridMaxZoom = applyTileGrid3.tileGridMaxZoom;
  }
  const GenericRasterParam = [genericRaster1, genericRaster2, genericRaster3];
  const genericRaster0 = new GenericRaster(genericRaster1, genericRaster2, genericRaster3);

  // Capa GeoTIFF
  const geotiff1 = {
    name: 'Nombre geotiff', legend: 'Leyenda geotiff',
    url: 'http://ftpcdd.cnig.es/Vuelos_2021/Vuelos_2021/catalunya_2021/Costa/01.VF/01.08_PNOA_2021_CAT_COSTA_22cm_VF_img8c_rgb_hu31/h50_0219_fot_002-0001_cog.tif',
    ...applyParam1, // minZoom, maxZoom // NEVER USED
    ...applyTileGrid1,
  };
  const geotiff2 = {
    ...applyParam2, // minZoom, maxZoom
    ...applyTileGrid2,
    nodata: 0,
    styles: { gamma: 0.5 },
  };
  const geotiff3 = { ...applyParam3, ...applyTileGrid3 };
  const GeoTIFFParam = [geotiff1, geotiff2, geotiff3];
  const geotiff0 = new GeoTIFF(geotiff1, geotiff2, geotiff3); // */

  // Capa MapLibre // Muchos console
  const maplibre1 = {
    name: 'Mapa Libre', legend: 'Mapa Libre',
    url: 'https://vt-mapabase.idee.es/files/styles/mapaBase_scn_color1_CNIG.json',
    extract: true,
    disableBackgroundColor: false,
    ...applyParam1, // minZoom, maxZoom
    ...applyTileGrid1,
  };
  const maplibre2 = {
    ...applyParam2, // minZoom, maxZoom
    ...applyTileGrid2,
  };
  const maplibre3 = { ...applyParam3, ...applyTileGrid3 };
  const MapLibreParam = [maplibre1, maplibre2, maplibre3];
  const maplibre0 = new MapLibre(maplibre1, maplibre2, maplibre3); // */

  // Lista de capas
  const capasVectoriales = [vector0, geojson0, wfs0, kml0, mvtFeature0, mvtRender0, ogcAPIFeatures0, mbtileVector0, genericVector0];
  const capasRasters = [tms0, wms0, wmts0, xyz0, osm0, mbtile0, genericRaster0, geotiff0, maplibre0];
  mapa.addLayers(capasVectoriales);
  mapa.addLayers(capasRasters);
  commonList = capasVectoriales.concat(capasRasters);
  window.commonList = commonList;

  allParameters = {
    Vector: VectorParam, GeoJSON: GeoJSONParam, WFS: WFSParam, KML: KMLParam,
    MVTfeature: MVTfeatureParam, MVTrender: MVTrenderParam,
    OGCAPIFeatures: OGCAPIFeaturesParam, MBTilesVector: MBTilesVectorParam, GenericVector: GenericVectorParam,
    TMS: TMSParam, WMS: WMSParam, WMTS: WMTSParam, XYZ: XYZParam, OSM: OSMParam,
    MBTiles: MBTilesParam, GenericRaster: GenericRasterParam, GeoTIFF: GeoTIFFParam, MapLibre: MapLibreParam,
  };
  window.allParameters = allParameters;

  refreshTableContent();
};

const clearTable = () => {
  testTableBody.innerHTML = '';
  generateHeadertable();
};

const refreshTest = () => {
  clearTable();
  mapa.removeLayers(commonList);
  setTimeout(() => {
    generateLayersTable();
  }, 1000);
};

const testSetCommands = () => {
  commonList.forEach((l) => {
    l.setMinZoom(pruebaSet.minZoom);
    l.setMaxZoom(pruebaSet.maxZoom);
  });
  clearTable();
  refreshTableContent();
};

const testImplSetCommands = () => {
  commonList.forEach((l) => {
    l.impl_.setMinZoom(pruebaImplSet.minZoom);
    l.impl_.setMaxZoom(pruebaImplSet.maxZoom);
  });
  clearTable();
  refreshTableContent();
};

// Creado inicial de esta WEB
generateHeadertable();
generateLayersTable();

// Botones de pruebas
document.getElementById('refresh_test').addEventListener('click', () => { refreshTest(); });
document.getElementById('set_test').addEventListener('click', () => { testSetCommands(); });
document.getElementById('implset_test').addEventListener('click', () => { testImplSetCommands(); });

// PRUEBAS DEL ARREGLOS (+-)INFINITY

// POSITIVOS Resultado del estudio

// (El comportamiento es el esperado) TMS y XYZ parece que solo pueden aceptar "tileGridMaxZoom" en el primer parámetro, las demás capas o parámetros de aplicado no hacen nada.
// (El comportamiento es el esperado) Introducir minZoom y maxZoom al tercer parámetro no parece tener efecto ninguno.

// NEGATIVOS Resultado del estudio

// Al aplicar en el primer parámetro:
// Solo la capa OSM aplica este a todos los niveles(facade y impl),
// La capa WMTS solo lo aplica a impl,
// Las capas MapLibre, GenericRaster, GenericVector, MVTrender, MVTfeature, GeoJSON y Vector solo lo aplican al facade.
// Las capas WFS, KML, OGCAPIFeatures, MBTilesVector, MBTiles, GeoTIFF, XYZ, WMS y TMS no aplican el parámetro a ningún lado.

// Al aplicar en el segundo parámetro:
// Las capas GeoTIFF, GenericRaster, XYZ, WMS, TMS y GenericVector aplican bien estos valores(facade y impl)
// Las capas WFS, KML, OGCAPIFeatures, MBTilesVector, MBTiles, WMTS, MapLibre, MVTrender, MVTfeature, GeoJSON y Vector solo lo aplican al impl.
// La capa OSM no aplica ningún cambio.

// Al aplicar en ambos parámetros(Iguales):
// Las capas WFS, KML, OGCAPIFeatures, MBTilesVector, MBTiles y WMTS solo los aplican al impl.
// Las demás capas muestran todos los valores bien.(Este parece ser el porcentaje más alto de estos valores bien aplicados)

// 1 - Funcionamiento correcto (1 capa) si se aplica sobre parámetro 1 a la capa OSM.
// 2 - Funcionamiento correcto (6 capas) si se aplica sobre parámetro 2 a las capas GeoTIFF, GenericRaster, XYZ, WMS, TMS y GenericVector.
// 3 - Funcionamiento correcto (5 capas) si se aplica a ambos parámetros a las capas MapLibre, MVTrender, MVTfeature, GeoJSON y Vector.
// 4 - Funcionamiento a medias (6 capas) si se aplica sobre parámetro 2 para las capas WFS, KML, OGCAPIFeatures, MBTilesVector, MBTiles y WMTS(también valido el primero) para verlas en solo parámetro 2.
