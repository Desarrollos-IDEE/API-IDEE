import Comparators from 'facade/comparators';

M.language.setLang('es');
// M.proxy(false);

const map = M.map({
  container: 'mapjs',
  zoom: 5,
  bbox: [323020, 4126873, 374759, 4152013],
});

// ! ViewManagement
/*
const viewmanagement = {
  name: 'ViewManagement',
  params: {},
};
*/

// ! TimeLine
/*
const terremotosText = 'WMS*Eventos sísmicos*https://www.ign.es/wms-inspire/geofisica*NZ.ObservedEvent';

const timeline = {
  name: 'Timeline',
  params: {
    timelineType: 'absolute',
    intervals: [
      {
        id: '1',
        init: '1918-05-12T23:39:58.767Z',
        end: '2021-01-16T12:47:07.530Z',
        layer: terremotosText,
        attributeParam: 'date',
      },
    ],
  },
};
*/

// ! StyleManager
/*
const wfs = new M.layer.WFS({
  url: 'http://geostematicos-sigc.juntadeandalucia.es/geoserver/tematicos/ows?',
  namespace: 'tematicos',
  name: 'Provincias',
  legend: 'Provincias',
  geometry: 'MPOLYGON',
});

map.addWFS(wfs);

const stylemanager = {
  name: 'StyleManager',
  params: {},
};
*/

// ! QueryAttributes
/*
const queryattributes = {
  name: 'QueryAttributes',
  params: {},
};
*/

// ! Modal
/*
const modal = {
  name: 'Modal',
  params: {},
};
*/

// ! OverviewMap
/*
const overviewmap = {
  name: 'OverviewMap',
  params: {},
};
*/

// ! Mousesrs
/*
const mousesrs = {
  name: 'MouseSRS',
  params: {},
};
*/

// ! Locator
/*
const locator = {
  name: 'Locator',
  params: {},
};
*/

// ! Information
/*
const information = {
  name: 'Information',
  params: {},
};
*/

// ! Infocoordinates
/*
const infocoordinates = {
  name: 'Infocoordinates',
  params: {},
};
*/

// ! Incicarto
/*
const incicarto = {
  name: 'Incicarto',
  params: {},
};
*/

// ! Contactlink
/*
const contactlink = {
  name: 'ContactLink',
  params: {},
};
*/

// ! Layerswitcher
/*
const layerswitcher = {
  name: 'Layerswitcher',
  params: {},
};
*/

// ! Backimglayer
/*
const backimglayer = {
  name: 'BackImgLayer',
  params: {
    ids: 'mapa,pnoa',
    titles: 'Mapa, PNOA',
    layers: 'WMTS*https://www.ign.es/wmts/ign-base?*IGNBaseTodo*GoogleMapsCompatible*Mapa IGN*false*image/jpeg*false*false*true,WMTS*http://www.ign.es/wmts/pnoa-ma?*OI.OrthoimageCoverage*EPSG:3857*PNOA',
  },
};
*/

// ! ShareMap
/*
const shareMap = {
  name: 'ShareMap',
  params: {},
};
*/

const mp = new Comparators({
  position: 'TR',
  collapsed: false,
  collapsible: true,
  isDraggable: true,
  transparencyParams: false,
  lyrcompareParams: false,
  mirrorpanelParams: false,
  windowsyncParams: {
    controls: [
      // 'scale',
      // 'backgroundlayers',
      // 'getfeatureinfo',
      // 'location',
      // 'panzoom',
      // 'panzoombar',
      // 'rotate',
      // 'scaleline',
      // 'attributions',
    ],
    plugins: [
      // viewmanagement,
      // layerswitcher,
      // shareMap,
      // timeline,
      // stylemanager,
      // queryattributes,
      // modal,
      // overviewmap,
      // mousesrs,
      // locator,
      // information,
      // infocoordinates,
      // incicarto,
      // contactlink,
      // backimglayer,
    ],
  },
});

map.addPlugin(mp);
window.map = map;
