import Layerswitcher from 'facade/layerswitcher';

IDEE.language.setLang('es');

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
const SAMPLE_LAYERS = [
  {
    label: 'WMS',
    create: () => new IDEE.layer.WMS({
      url: 'https://www.ign.es/wms-inspire/camino-santiago?',
      name: 'PS.ProtectedSite',
      legend: 'Camino de Santiago (WMS)',
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
    label: 'GeoPackage',
    create: () => new IDEE.layer.GeoPackage({
      url: `${FIXTURES}/development/CP-0002-layers/data/geopackage-mixed.gpkg`,
      name: 'GeoPackage de prueba',
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
  if (prechargedOption) inputPrecharged.value = prechargedOption.dataset.precharged;
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
