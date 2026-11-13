import Layerswitcher from 'facade/layerswitcher';

IDEE.language.setLang('es');
IDEE.config('MAX_FILE_SIZE_MB', 40);

window.IDEE.plugin.Layerswitcher = Layerswitcher;

let map = null;

const createMap = (is3D = IDEE.impl.Map.prototype.getImplementation() === 'cesium') => {
  map = IDEE.map({
    container: 'mapjs',
    zoom: 5,
    center: is3D ? [-4.1957, 39.4] : [-467062.8225, 4783459.6216],
    controls: ['location', 'implementationswitcher'],
    ...(is3D ? {} : { maxZoom: 20, minZoom: 2 }),
  });
  window.map = map;

  // const capaGeoJSON = new IDEE.layer.GeoJSON({
  //   name: 'Capa GeoJSON',
  //   url: 'https://www.ign.es/resources/geodesia/GNSS/SPTR_geo.json',
  //   extract: false,
  // });

  // map.addLayers(capaGeoJSON);

  const capaWMS = new IDEE.layer.WMS({
    url: 'https://www.ign.es/wms-inspire/unidades-administrativas?',
    name: 'AU.AdministrativeUnit',
    legend: 'Capa WMS',
  });

  map.addLayers(capaWMS);
};

const FIXTURES = `${window.location.origin}/api-idee-test`;
const STYLE_EXAMPLES = new URL('styles/', window.location.href).href;
const SAMPLE_LAYERS = [
  {
    label: 'Masas de agua (GeoJSON local, para el SLD de IDEE)',
    create: () => new IDEE.layer.GeoJSON({
      url: `${STYLE_EXAMPLES}masas-agua.geojson`,
      name: 'masas_agua',
      legend: 'Masas de agua de ejemplo',
      extract: true,
    }),
  },
  {
    label: 'Municipios del IGN (OGC API Features, para el SLD del IGN)',
    create: () => new IDEE.layer.OGCAPIFeatures({
      url: 'https://api-features.ign.es/collections/',
      name: 'administrativeunit',
      legend: 'Municipios (OGC API IGN)',
      limit: 200,
      bbox: [-4.0, 40.2, -3.4, 40.7],
      conditional: { nationallevelname: 'Municipio' },
    }),
  },
  {
    label: 'Zonas (GeoJSON local, estilos y SLD)',
    create: () => new IDEE.layer.GeoJSON({
      url: `${STYLE_EXAMPLES}zonas.geojson`,
      name: 'zonas',
      legend: 'Zonas de ejemplo',
      extract: true,
    }),
  },
  {
    label: 'WMS',
    create: () => new IDEE.layer.WMS({
      url: 'https://www.ign.es/wms-inspire/camino-santiago?',
      name: 'camino_frances',
      legend: 'Camino Francés (WMS)',
    }),
  },
  {
    label: 'WMTS',
    create: () => new IDEE.layer.WMTS({
      url: 'https://www.ign.es/wmts/ign-base?',
      name: 'IGNBaseTodo',
      legend: 'IGN Base (WMTS)',
      matrixSet: 'GoogleMapsCompatible',
      format: 'image/jpeg',
    }),
  },
  {
    label: 'XYZ',
    create: () => new IDEE.layer.XYZ({
      url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      name: 'OSM (XYZ)',
      legend: 'OpenStreetMap (XYZ)',
      transparent: true,
    }),
  },
  { label: 'TMS', create: () => 'QUICK*RelieveSombreado_TMS' },
  { label: 'MVT', create: () => 'QUICK*ViasVerdes_MVT' },
  {
    label: 'KML',
    create: () => new IDEE.layer.KML({
      url: 'https://www.ign.es/web/resources/delegaciones/delegacionesIGN.kml',
      name: 'Delegaciones IGN',
      extract: false,
    }),
  },
  {
    label: 'GeoTIFF',
    create: () => new IDEE.layer.GeoTIFF({
      url: `${FIXTURES}/playwright/fixtures/refresh/raster.tif`,
      name: 'GeoTIFF de prueba',
    }),
  },
  {
    label: 'MBTiles',
    create: () => new IDEE.layer.MBTiles({
      url: `${FIXTURES}/playwright/fixtures/refresh/raster.mbtiles`,
      name: 'MBTiles de prueba',
      legend: 'MBTiles de prueba',
    }),
  },
  {
    label: 'MBTilesVector',
    create: () => new IDEE.layer.MBTilesVector({
      url: `${FIXTURES}/playwright/fixtures/refresh/vector.mbtiles`,
      name: 'MBTilesVector de prueba',
      legend: 'MBTilesVector de prueba',
    }),
  },
  {
    label: 'GeoPackage (ríos, con CORS)',
    create: () => new IDEE.layer.GeoPackage({
      url: 'https://raw.githubusercontent.com/ngageoint/geopackage-js/master/test/fixtures/rivers.gpkg',
      name: 'rivers',
      legend: 'Ríos (GeoPackage)',
      tables: { TILESosmds: { visibility: false } },
    }),
  },
  {
    label: 'Grupo de capas',
    create: () => new IDEE.layer.LayerGroup({
      name: 'grupo_ejemplo',
      legend: 'Grupo de ejemplo',
      layers: [
        new IDEE.layer.WMS({
          url: 'https://www.ign.es/wms-inspire/unidades-administrativas?',
          name: 'AU.AdministrativeBoundary',
          legend: 'Límites (grupo)',
        }),
        new IDEE.layer.GeoJSON({
          name: 'GNSS (grupo)',
          url: 'https://www.ign.es/resources/geodesia/GNSS/SPTR_geo.json',
          extract: false,
        }),
      ],
    }),
  },
  {
    label: 'Sección',
    add: () => map.addSections(new IDEE.layer.Section({
      title: 'Sección de ejemplo',
      children: [
        new IDEE.layer.WMS({
          url: 'https://www.ign.es/wms-inspire/hidrografia?',
          name: 'HY.PhysicalWaters.Waterbodies',
          legend: 'Hidrografía (sección)',
        }),
      ],
    })),
  },
  { label: 'MapLibre', only: 'ol', create: () => 'QUICK*BTN_Completa_MapLibre' },
  {
    label: 'Tiles3D',
    only: 'cesium',
    create: () => new IDEE.layer.Tiles3D({
      url: 'https://raw.githubusercontent.com/CesiumGS/3d-tiles-samples/main/1.0/TilesetWithDiscreteLOD/tileset.json',
      name: 'Tiles3D de ejemplo',
      legend: 'Tiles3D de ejemplo',
    }),
  },
  { label: 'Terrain', only: 'cesium', create: () => 'QUICK*MDT_TERRAIN' },
];

const selectSampleLayer = document.getElementById('selectSampleLayer');
const fillSampleLayers = () => {
  Array.from(selectSampleLayer.options).slice(1).forEach((option) => option.remove());
  SAMPLE_LAYERS
    .filter((sample) => !sample.only || sample.only === map.getImplementation())
    .forEach((sample) => {
      const option = document.createElement('option');
      option.value = sample.label;
      option.textContent = sample.label;
      selectSampleLayer.appendChild(option);
    });
};
selectSampleLayer.addEventListener('change', () => {
  const sample = SAMPLE_LAYERS.find((s) => s.label === selectSampleLayer.value);
  selectSampleLayer.value = '';
  if (!sample) return;
  try {
    if (sample.add) {
      sample.add();
    } else {
      map.addLayers(sample.create());
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`No se pudo añadir la capa ${sample.label}`, error);
    IDEE.dialog.error(`No se pudo añadir la capa ${sample.label}: ${error.message || error}`);
  }
});

const SAMPLE_SLDS = [
  {
    label: 'IDEE: masas de agua (hidrografía)',
    file: 'idee-masas-de-agua.sld',
    url: 'https://servicios.idee.es/wms-inspire/hidrografia?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetStyles&LAYERS=HY.PhysicalWaters.Waterbodies',
  },
  {
    label: 'IGN: unidades administrativas',
    file: 'ign-unidades-administrativas.sld',
    url: 'https://www.ign.es/wms-inspire/unidades-administrativas?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetStyles&LAYERS=AU.AdministrativeUnit',
  },
];

const SLD_DOWNLOAD_TIMEOUT = 20000;

const selectSampleSld = document.getElementById('selectSampleSld');
SAMPLE_SLDS.forEach((sample) => {
  const option = document.createElement('option');
  option.value = sample.label;
  option.textContent = sample.label;
  selectSampleSld.appendChild(option);
});
selectSampleSld.addEventListener('change', () => {
  const sample = SAMPLE_SLDS.find((s) => s.label === selectSampleSld.value);
  selectSampleSld.value = '';
  if (!sample) return;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SLD_DOWNLOAD_TIMEOUT);
  window.fetch(sample.url, { signal: controller.signal })
    .then((response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.text();
    })
    .catch((error) => {
      if (error.name === 'AbortError') {
        throw new Error(`el servicio no ha respondido en ${SLD_DOWNLOAD_TIMEOUT / 1000} s`);
      }
      throw error;
    })
    .finally(() => clearTimeout(timeout))
    .then((text) => {
      if (!text.includes('StyledLayerDescriptor')) {
        throw new Error('el servicio no ha devuelto un documento SLD');
      }
      const href = URL.createObjectURL(new Blob([text], { type: 'application/vnd.ogc.sld+xml' }));
      const link = document.createElement('a');
      link.href = href;
      link.download = sample.file;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(href), 1000);
    })
    .catch((error) => {
      // eslint-disable-next-line no-console
      console.error(`No se pudo descargar el SLD ${sample.label}`, error);
      IDEE.dialog.error(`No se pudo descargar el SLD ${sample.label}: ${error.message || error}`);
    });
});

let mp = null;

const createPlugin = (options) => {
  mp = new IDEE.plugin.Layerswitcher(options);
  window.mp = mp;
  map.addPlugin(mp);
};

const removePlugin = () => {
  if (mp) map.removePlugins(mp);
};

window.addEventListener('idee:implementationchange', ({ detail }) => {
  map = detail.map;
  window.map = map;
  mp = map.getPlugins().find((plugin) => plugin.name === 'layerswitcher') || null;
  window.mp = mp;
  fillSampleLayers();
});

const removeButton = document.getElementById('removeButton');
removeButton.addEventListener('click', () => { removePlugin(); });

const selectPosition = document.getElementById('selectPosition');
const selectCollapsed = document.getElementById('selectCollapsed');
const inputTooltip = document.getElementById('inputTooltip');
const inputOrder = document.getElementById('inputOrder');
const selectAdd = document.getElementById('selectAddLayers');
const selectStatus = document.getElementById('selectStatusLayers');
const inputTools = document.getElementById('inputTools');
const selectMoveLayer = document.getElementById('isMoveLayers');
const selectModeSelectLayers = document.getElementById('modeSelectLayers');
const inputPrecharged = document.getElementById('inputPrecharged');
const selectHttp = document.getElementById('isHttp');
const selectHttps = document.getElementById('isHttps');
const selectShowCatalog = document.getElementById('isShowCatalog');
const selectProxy = document.getElementById('selectProxy');
const selectDisplay = document.getElementById('selectDisplay');
const selectUseAttributions = document.getElementById('selectUseAttributions');

const boolVal = (select, defaultVal = true) => {
  const v = select.options[select.selectedIndex].value;
  if (v === '') return defaultVal;
  return v === 'true';
};

const updatePlugin = () => {
  const options = {};
  options.position = selectPosition.options[selectPosition.selectedIndex].value;
  options.collapsed = selectCollapsed.options[selectCollapsed.selectedIndex].value === '' || selectCollapsed.options[selectCollapsed.selectedIndex].value === 'true';
  options.order = Number(inputOrder.value);
  options.addLayers = boolVal(selectAdd, true);
  options.statusLayers = boolVal(selectStatus, true);
  options.tooltip = inputTooltip.value || '';
  options.tools = inputTools.value !== '' ? inputTools.value.split(', ') : [];
  options.isMoveLayers = boolVal(selectMoveLayer, false);
  options.modeSelectLayers = selectModeSelectLayers.options[selectModeSelectLayers.selectedIndex].value || 'eyes';
  const prechargedOption = [...document.querySelectorAll('#prechargedSug option')]
    .find((option) => option.value === inputPrecharged.value);
  if (prechargedOption) {
    inputPrecharged.value = prechargedOption.dataset.relative
      ? new URL(prechargedOption.dataset.precharged, window.location.href).href
      : prechargedOption.dataset.precharged;
  }
  options.precharged = inputPrecharged.value.trim() || undefined;
  options.http = boolVal(selectHttp, true);
  options.https = boolVal(selectHttps, true);
  options.showCatalog = boolVal(selectShowCatalog, false);
  options.useProxy = boolVal(selectProxy, true);
  options.displayLabel = boolVal(selectDisplay, false);
  options.useAttributions = boolVal(selectUseAttributions, false);

  removePlugin();
  createPlugin(options);
};

[
  selectPosition,
  selectCollapsed,
  inputOrder,
  inputTooltip,
  selectAdd,
  selectStatus,
  inputTools,
  selectMoveLayer,
  selectModeSelectLayers,
  inputPrecharged,
  selectHttp,
  selectHttps,
  selectShowCatalog,
  selectProxy,
  selectDisplay,
  selectUseAttributions,
].forEach((ctrl) => {
  ctrl.addEventListener('change', updatePlugin);
});

createMap();
fillSampleLayers();
updatePlugin();

/**
 * Este código puede alternanr la inicialización de un mapa en
 * 3d/2d manualmente, actualmente está deshabilitado por no ser
 * necesario
 */
// IDEE.loadImplementation('cesium')
//   .then(() => import('facade/layerswitcher'))
//   .then(({ default: Layerswitcher }) => {
//     window.IDEE.plugin.Layerswitcher = Layerswitcher;
//     createMap();
//     fillSampleLayers();
//     updatePlugin();
//   });
