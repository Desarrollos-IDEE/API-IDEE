/* eslint-disable max-len,object-property-newline */
import Layerswitcher from 'facade/layerswitcher';

// M.language.setLang('en');

const map = M.map({
  container: 'mapjs',
  controls: ['scale', 'attributions'],
  center: { x: -528863.345515127, y: 4514194.232367303 },
  zoom: 9,
});
window.map = map;

const PRECHARGED = {
  services: [{
    type: 'WMS', name: 'Camino de Santiago',
    url: 'https://www.ign.es/wms-inspire/camino-santiago',
  }, {
    type: 'WMS', name: 'Redes Geodésicas',
    url: 'https://www.ign.es/wms-inspire/redes-geodesicas',
  }, {
    type: 'WMS', name: 'Planimetrías',
    url: 'https://www.ign.es/wms/minutas-cartograficas',
  }, {
    type: 'MapLibre', name: 'Mapa Libre', legend: 'Mapa Libre',
    url: 'https://vt-mapabase.idee.es/files/styles/mapaBase_scn_color1_CNIG.json',
  }],
  groups: [{
    name: 'Cartografía',
    services: [{
      type: 'WMTS', name: 'Mapas',
      url: 'https://www.ign.es/wmts/mapa-raster?',
    }, {
      type: 'WMTS', name: 'Callejero ',
      url: 'https://www.ign.es/wmts/ign-base?',
    }, {
      type: 'WMTS', name: 'Primera edición MTN y Minutas de 1910-1970',
      url: 'https://www.ign.es/wmts/primera-edicion-mtn?',
    }, {
      type: 'WMS', name: 'Planimetrías (1870 y 1950)',
      url: 'https://www.ign.es/wms/minutas-cartograficas?',
    }, {
      type: 'WMTS', name: 'Planos de Madrid (1622 - 1960)',
      url: 'https://www.ign.es/wmts/planos?',
    }, {
      type: 'WMS', name: 'Hojas kilométricas (Madrid - 1860)',
      url: 'https://www.ign.es/wms/hojas-kilometricas?',
    }, {
      type: 'WMS', name: 'Cuadrículas Mapa Topográfico Nacional',
      url: 'https://www.ign.es/wms-inspire/cuadriculas?',
    }],
  },
  {
    name: 'Imágenes',
    services: [{
      type: 'WMTS', name: 'Ortofotos máxima actualidad PNOA',
      url: 'https://www.ign.es/wmts/pnoa-ma?',
    }, {
      type: 'WMS', name: 'Ortofotos históricas y PNOA anual',
      url: 'https://www.ign.es/wms/pnoa-historico?',
    }, {
      type: 'WMS', name: 'Ortofotos provisionales PNOA',
      url: 'https://wms-pnoa.idee.es/pnoa-provisionales?',
    }, {
      type: 'WMS', name: 'Mosaicos de satélite',
      url: 'https://wms-satelites-historicos.idee.es/satelites-historicos?',
    }, {
      type: 'WMS', name: 'Fototeca (Consulta de fotogramas históricos y PNOA)',
      url: 'https://wms-fototeca.idee.es/fototeca?',
    }],
  },
  {
    name: 'Información geográfica de referencia y temática',
    services: [{
      type: 'WMS', name: 'Catastro ',
      url: 'http://ovc.catastro.meh.es/Cartografia/WMS/ServidorWMS.aspx?',
    }, {
      type: 'WMS', name: 'Unidades administrativas',
      url: ' https://www.ign.es/wms-inspire/unidades-administrativas?',
    }, {
      type: 'WMS', name: 'Nombres geográficos (Nomenclátor Geográfico Básico NGBE)',
      url: 'https://www.ign.es/wms-inspire/ngbe?',
    }, {
      type: 'WMS', name: 'Redes de transporte',
      url: 'https://servicios.idee.es/wms-inspire/transportes?',
    }, {
      type: 'WMS', name: 'Hidrografía ',
      url: 'https://servicios.idee.es/wms-inspire/hidrografia?',
    }, {
      type: 'WMS', name: 'Direcciones y códigos postales',
      url: 'https://www.cartociudad.es/wms-inspire/direcciones-ccpp?',
    }, {
      type: 'WMTS', name: 'Ocupación del suelo (Corine y SIOSE)',
      url: 'https://servicios.idee.es/wmts/ocupacion-suelo?',
    }, {
      type: 'WMS', name: 'Ocupación del suelo Histórico (Corine y SIOSE)',
      url: 'https://servicios.idee.es/wms-inspire/ocupacion-suelo-historico?',
    }, {
      type: 'WMS', name: 'Copernicus Land Monitoring Service',
      url: 'https://servicios.idee.es/wms/copernicus-landservice-spain?',
    }, {
      type: 'WMS', name: 'Información sísmica (terremotos)',
      url: 'https://www.ign.es/wms-inspire/geofisica?',
    }, {
      type: 'WMS', name: 'Red de vigilancia volcánica',
      url: 'https://wms-volcanologia.ign.es/volcanologia?',
    }, {
      type: 'WMS', name: 'Redes geodésicas',
      url: 'https://www.ign.es/wms-inspire/redes-geodesicas?',
    }],
  },
  {
    name: 'Modelos digitales de elevaciones',
    services: [{
      type: 'WMTS', name: 'Modelo Digital de Superficies (Sombreado superficies y consulta de elevaciones edificios y vegetación)',
      url: 'https://wmts-mapa-lidar.idee.es/lidar?',
    }, {
      type: 'WMTS', name: 'Modelo Digital del Terreno (Sombreado terreno y consulta de altitudes)',
      url: 'https://servicios.idee.es/wmts/mdt?',
      white_list: ['EL.ElevationGridCoverage'],
    }, {
      type: 'WMS', name: 'Curvas de nivel y puntos acotados',
      url: 'https://servicios.idee.es/wms-inspire/mdt?',
      white_list: ['EL.ContourLine', 'EL.SpotElevation'],
    }],
  }],
};

const mp2 = new M.plugin.Vectors({}); map.addPlugin(mp2);

// M.proxy(false);
// Todas las CAPAS que se tienen que probar

/* / Capa GeoJson 1
const capaGeoJSON = new M.layer.GeoJSON({
  name: 'Capa GeoJSON',
  legend: 'Capa GeoJSON',
  url: 'http://geostematicos-sigc.juntadeandalucia.es/geoserver/tematicos/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=tematicos:Provincias&maxFeatures=50&outputFormat=application%2Fjson',
  extract: true,
});
map.addLayers(capaGeoJSON); window.capaGeoJSON = capaGeoJSON; // */

/* / Reemplazo de capa GeoJson 1
map.getMapImpl().on('moveend', () => {
  map.removeLayers([capaGeoJSON]);
  capaGeoJSON = new M.layer.GeoJSON({
    name: 'Capa GeoJSON',
    legend: 'Capa GeoJSON',
    url: 'http://localhost:6123/test/features.json',
    // url: 'http://geostematicos-sigc.juntadeandalucia.es/geoserver/tematicos/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=tematicos:Provincias&maxFeatures=50&outputFormat=application%2Fjson',
    extract: true,
  });
  map.addLayers(capaGeoJSON); window.capaGeoJSON = capaGeoJSON;
}); // */

/* / Capa GeoJson 2
const capaGeoJSON2 = new M.layer.GeoJSON({
  name: 'capaJson',
  source: {
    type: 'FeatureCollection',
    features: [{
      properties: {
        estado: 1,
        vendor: {
          mapea: {},
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
});
map.addLayers(capaGeoJSON2); window.capaGeoJSON2 = capaGeoJSON2; // */

/* / Capa OSM 1
const capaOSM = new M.layer.OSM({
  name: 'Capa OSM',
  legend: 'Capa OSM',
  transparent: true,
  url: 'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
  matrixSet: 'EPSG:3857',
});
map.addLayers(capaOSM); window.capaOSM = capaOSM; // */

/* / Capa KML
const capaKML = new M.layer.KML({
  url: 'https://www.ign.es/web/resources/delegaciones/delegacionesIGN.kml',
  name: 'Capa KML',
  legend: 'Capa KML',
  extract: true,
});
map.addLayers(capaKML); window.capaKML = capaKML; // */

/* / Capa MVT
const capaMVT = new M.layer.MVT({ // No visible en zooms 0-7, saltan errores 404
  url: 'https://www.ign.es/web/resources/mapa-base-xyz/vt/{z}/{x}/{y}.pbf',
  layers: ['provincia_pol', 'camino_lin'], // Se reduce lag por demaciados elementos al solo coger estos
  name: 'Capa MVT',
  legend: 'Capa MVT',
  projection: 'EPSG:3857',
  extract: true,
});
map.addLayers(capaMVT); window.capaMVT = capaMVT; // */

/* / Capa OGCAPIFeatures
const capaOGCAPIFeatures = new M.layer.OGCAPIFeatures({
  url: 'https://api-features.idee.es/collections/', name: 'falls',
  legend: 'Capa OGCAPIFeatures L',
  limit: 20,
}, {
  predefinedStyles: [
    new M.style.Point({
      // name: 'Negro',
      fill: { color: 'black', width: 3, opacity: 1 },
      radius: 5,
    }),
    new M.style.Point({
      name: 'Amarillo',
      fill: { color: 'yellow', width: 3, opacity: 1 },
      radius: 5,
    }),
  ],
  style: new M.style.Point({
    // name: 'Rojo',
    fill: { color: 'red', width: 3, opacity: 1 },
    radius: 15,
  }),
});
map.addLayers(capaOGCAPIFeatures); window.capaOGCAPIFeatures = capaOGCAPIFeatures; // */

/* / Capa TMS
const capaTMS = new M.layer.TMS({
  url: 'https://tms-mapa-raster.ign.es/1.0.0/mapa-raster/{z}/{x}/{-y}.jpeg',
  name: 'Capa TMS',
  legend: 'Capa TMS L',
  projection: 'EPSG:3857',
});
map.addLayers(capaTMS); window.capaTMS = capaTMS; // */

/* / Capa Vector
const capaVector = new M.layer.Vector({ name: 'capaVector', legend: 'vector legend' });
const feature = new M.Feature('localizacion', {
  type: 'Feature',
  properties: { text: 'prueba' },
  geometry: { type: 'Point', coordinates: [-458757.1288, 4795217.2530] },
  // geometry: { type: 'LineString', coordinates: [[-458757, 4795217], [-458758, 4795218]] },
});
capaVector.addFeatures(feature);
map.addLayers(capaVector); window.capaVector = capaVector; // */

/* / Capas WFS 1
const capaWFS = new M.layer.WFS({
  url: 'http://geostematicos-sigc.juntadeandalucia.es/geoserver/tematicos/ows?',
  namespace: 'tematicos',
  name: 'Provincias',
  legend: 'Capa WFS l',
  geometry: 'MPOLYGON',
});
map.addLayers(capaWFS); window.capaWFS = capaWFS; // */
/* / Capas WFS 2
const capaWFS2 = new M.layer.WFS({
  url: 'http://geostematicos-sigc.juntadeandalucia.es/geoserver/tematicos/ows?',
  namespace: 'tematicos',
  name: 'Municipios',
  legend: 'capaWFS2',
  geometry: 'MPOLYGON',
});
map.addWFS(capaWFS2); // */

/* / Capas WMS 1 Se usa la misma dirrecion que en "WMS 2", termina reemplazandolo
const capaWMS = new M.layer.WMS({
  url: 'https://www.ign.es/wms-inspire/unidades-administrativas?',
  name: 'AU.AdministrativeUnit', legend: 'capaWMS1',
  visibility: true
});
map.addLayers(capaWMS); window.capaWMS = capaWMS; // */

/* / Capas WMS 2
const capaWMS2 = new M.layer.WMS({
  url: 'https://www.ign.es/wms-inspire/unidades-administrativas?',
  name: 'AU.AdministrativeUnit', legend: 'capaWMS2',
  tiled: false, transparent: true,
}, {
  maxScale: 14000000, minScale: 3000000
});
capaWMS2.setZIndex(99);
map.addWMS(capaWMS2); window.capaWMS2 = capaWMS2; // */

/* / Capas WMS 3
const capaWMS3 = new M.layer.WMS({
  url: 'http://geostematicos-sigc.juntadeandalucia.es/geoserver/tematicos/wms?',
  name: 'provincias_pob', legend: 'capaWMS3',
  tiled: false, transparent: true,
});
map.addWMS(capaWMS3); window.capaWMS3 = capaWMS3; // */

/* / Capas WMTS
const capaWMTS = new M.layer.WMTS({
  url: 'https://servicios.idee.es/wmts/ocupacion-suelo',
  name: 'LC.LandCoverSurfaces',
  legend: 'LC.LandCoverSurfaces l',
  matrixSet: 'GoogleMapsCompatible',
  format: 'image/png',
});
map.addLayers(capaWMTS); window.capaWMTS = capaWMTS; // */

/* / Capas XYZ
const capaXYZ = new M.layer.XYZ({
  url: 'https://www.ign.es/web/catalogo-cartoteca/resources/webmaps/data/cresques/{z}/{x}/{y}.jpg',
  name: 'Capa XYZ',
  legend: 'Capa XYZ l',
  projection: 'EPSG:3857',
},{
  crossOrigin: false
});
map.addLayers(capaXYZ); window.capaXYZ = capaXYZ; // */

/* / Capa GenericRaster
const generic_001 = new M.layer.GenericRaster({}, {}, new ol.layer.Image({
  source: new ol.source.ImageWMS({
    url: 'http://geostematicos-sigc.juntadeandalucia.es/geoserver/tematicos/wms?',
    params: { LAYERS: 'tematicos:Municipios' },
  }),
}));
map.addLayers(generic_001); window.generic_001 = generic_001; // */

/* / Capa GenericVector
const generic_002 = new M.layer.GenericVector({}, {}, new ol.layer.Vector({
  source: new ol.source.Vector({
    format: new ol.format.GeoJSON(),
    url: 'https://geostematicos-sigc.juntadeandalucia.es/geoserver/tematicos/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=tematicos:Provincias&maxFeatures=50&outputFormat=application%2Fjson',
    strategy: ol.loadingstrategy.bbox,
  }),
}));
map.addLayers(generic_002); window.generic_002 = generic_002; // */

/* / Capa MBTiles fetch
window.fetch('./cabrera.mbtiles').then((response) => {
  if (response.status != 404) {
    const mbtile1 = new M.layer.MBTiles({
      name: 'mbtiles', legend: 'Capa MBTiles L',
      source: response,
    });
    map.addLayers(mbtile1); window.mbtile1 = mbtile1;
  } else console.error("Archivo cabrera.mbtiles no presente en directorio test");
}).catch((e) => { throw e; }); // */

/* / Capa MBTiles
const mbtile2 = new M.layer.MBTiles({
  name: 'mbtilesLoadFunction',
  legend: 'Capa personalizada MBTiles',
  tileLoadFunction: (z, x, y) => {
    return new Promise((resolve) => {
      if (z > 4) {
        resolve('https://cdn-icons-png.flaticon.com/512/4616/4616040.png');
      } else {
        resolve('https://cdn.icon-icons.com/icons2/2444/PNG/512/location_map_pin_direction_icon_148665.png');
      }
    });
  },
});
map.addLayers(mbtile2); window.mbtile2 = mbtile2; // */

/* / Capa MBTilesVector fetch
window.fetch('./countries.mbtiles').then((response) => {
  if (response.status != 404) {
    const mbtilesvector = new M.layer.MBTilesVector({
      name: 'mbtiles_vector',
      legend: 'Capa MBTilesVector L',
      source: response,
      // maxZoomLevel: 5,
    });
    map.addLayers(mbtilesvector); window.mbtilesvector = mbtilesvector;
  } else console.error("Archivo countries.mbtiles no presente en directorio test");
}).catch((e) => { throw e; }); // */

/* / Capa MBTilesVector
const mbtileVector = new M.layer.MBTilesVector({
  name: 'mbtilesvector',
  legend: 'Capa personalizada MBTilesVector',
  tileLoadFunction: (z, x, y) => {
    return new Promise((resolve) => {
      window.fetch(`https://ahocevar.com/geoserver/gwc/service/tms/1.0.0/ne:ne_10m_admin_0_countries@EPSG%3A900913@pbf/${z}/${x}/${y}.pbf`).then((response) => {
        resolve(response.arrayBuffer());
      });
    });
  },
});
map.addLayers(mbtileVector); window.mbtileVector = mbtileVector; // */

/* / Capa GeoTIFF
const geotiff = new M.layer.GeoTIFF({
  url: 'http://ftpcdd.cnig.es/Vuelos_2021/Vuelos_2021/catalunya_2021/Costa/01.VF/01.08_PNOA_2021_CAT_COSTA_22cm_VF_img8c_rgb_hu31/h50_0219_fot_002-0001_cog.tif',
  name: 'Nombre geotiff',
  legend: 'Leyenda geotiff',
  transparent: true,
}, {
  convertToRGB: 'auto', nodata: 0, // Pone transparente el color negro del background
});
map.addLayers(geotiff); window.geotiff = geotiff; // */
// Capa GeoTIFF con strings
// map.addGeoTIFF('GeoTIFF*LEG_GeoTIFF*http://ftpcdd.cnig.es/Vuelos_2021/Vuelos_2021/catalunya_2021/Costa/01.VF/01.08_PNOA_2021_CAT_COSTA_22cm_VF_img8c_rgb_hu31/h50_0219_fot_002-0001_cog.tif*NOM_GeoTIFF*true**true*true');
// map.addLayers('GeoTIFF*LEG_GeoTIFF*http://ftpcdd.cnig.es/Vuelos_2021/Vuelos_2021/catalunya_2021/Costa/01.VF/01.08_PNOA_2021_CAT_COSTA_22cm_VF_img8c_rgb_hu31/h50_0219_fot_002-0001_cog.tif*NOM_GeoTIFF*true**false*true'); // false for not in layerswitcher
// */

/* / Capa MapLibre
const mapLibre = new M.layer.MapLibre({
  name: 'Mapa Libre', legend: 'Mapa Libre',
  url: 'https://vt-mapabase.idee.es/files/styles/mapaBase_scn_color1_CNIG.json',
  extract: true,
  disableBackgroundColor: false,
});
map.addLayers(mapLibre); window.mapLibre = mapLibre; // */

/* / Plugin TOC
const mp3 = new M.plugin.TOC({
  collapsed: false, collapsible: true, position: 'TL',
  isDraggable: false, modeSelectLayers: 'eyes',
});
map.addPlugin(mp3);window.mp3 = mp3; // */

const mp1 = new Layerswitcher({
  collapsed: false,
  collapsible: true,
  isDraggable: true,
  position: 'TL', // TL | TR | BR | BL
  tooltip: 'Tooltip de Gestor de Capas',
  modeSelectLayers: 'eyes', // eyes | radio
  // tools: [],
  tools: ['transparency', 'zoom', 'legend', 'information', 'style', 'delete'],
  isMoveLayers: true,
  precharged: PRECHARGED,
  https: true, // solo afectan al añadido de layerSwitcher
  http: true, // solo afectan al añadido de layerSwitcher
  showCatalog: true, // Añade pequeño boton de Binoculares al lado de buscar de capas a añadir.
  useProxy: true,
  displayLabel: true, // Muestra tipo de capa como WSF, TMS, GeoJSON ...
  addLayers: true,
  statusLayers: true, // Solo se muestra si modeSelectLayers es 'eyes'
  order: 1,
  useAttributions: true,
});
map.addPlugin(mp1);
window.mp1 = mp1;

// Para pruebas locales, lanzar Tomcat del proyecto y usar "http://localhost:8080" en vez de "https://mapea-lite.desarrollo.guadaltel.es"
