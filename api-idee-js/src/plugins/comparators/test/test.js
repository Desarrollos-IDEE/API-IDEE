import Comparators from 'facade/comparators';

// M.language.setLang('en');
M.language.setLang('es');
// M.proxy(false);


const map = M.map({
  container: 'mapjs',
  zoom: 5,
  bbox: [323020, 4126873, 374759, 4152013],
});
window.map = map;

const mpLayerswitcher = new M.plugin.Layerswitcher({
  collapsed: true,
  position: 'TR',
});

map.addPlugin(mpLayerswitcher);

/* // 
 const x = [
  'WMS*Americano 1956-1957*https://www.ign.es/wms/pnoa-historico*AMS_1956-1957',
  'WMS*Interministerial 1973-1986*https://www.ign.es/wms/pnoa-historico*Interministerial_1973-1986',
  'WMS*Nacional 1981-1986*https://www.ign.es/wms/pnoa-historico*NACIONAL_1981-1986',
  'WMS*OLISTAT*https://www.ign.es/wms/pnoa-historico*OLISTAT',
  'WMS*SIGPAC*https://www.ign.es/wms/pnoa-historico*SIGPAC',
  'WMS*PNOA 2004*https://www.ign.es/wms/pnoa-historico*pnoa2004',
  'WMS*PNOA 2005*https://www.ign.es/wms/pnoa-historico*pnoa2005',
  'WMS*PNOA 2007*https://www.ign.es/wms/pnoa-historico*pnoa2007',
  'WMS*PNOA 2006*https://www.ign.es/wms/pnoa-historico*pnoa2006',
  'WMS*PNOA 2008*https://www.ign.es/wms/pnoa-historico*pnoa2008',
  'WMS*PNOA 2009*https://www.ign.es/wms/pnoa-historico*pnoa2009',
  'WMS*PNOA 2010*https://www.ign.es/wms/pnoa-historico*pnoa2010',
  'WMS*PNOA 2011*https://www.ign.es/wms/pnoa-historico*pnoa2011',
  'WMS*PNOA 2012*https://www.ign.es/wms/pnoa-historico*pnoa2012',
  'WMS*PNOA 2013*https://www.ign.es/wms/pnoa-historico*pnoa2013',
  'WMS*PNOA 2014*https://www.ign.es/wms/pnoa-historico*pnoa2014',
  'WMS*PNOA 2015*https://www.ign.es/wms/pnoa-historico*pnoa2015',
  'WMS*PNOA 2016*https://www.ign.es/wms/pnoa-historico*pnoa2016',
  'WMS*PNOA 2017*https://www.ign.es/wms/pnoa-historico*pnoa2017',
  'WMS*PNOA 2018*https://www.ign.es/wms/pnoa-historico*pnoa2018',
];
const WMSObject = x.map((layer) => {
  const [type, legend, url, name, useCapabilities] = layer.split('*');
  return new M.layer.WMS({ // [type]
    url,
    name,
    legend,
    visibility: true,
    tiled: false,
    useCapabilities,
    displayInLayerSwitcher: true,
  });
});
map.addLayers(WMSObject); // */

/* // PRUEBA ?, 
const wmtsString = [
  'WMTS*https://www.ign.es/wmts/mapa-raster*MTN*GoogleMapsCompatible*Mapa MTN*image/jpeg',
  'WMTS*https://www.ign.es/wmts/primera-edicion-mtn?*mtn50-edicion1*GoogleMapsCompatible*MTN50 1Edi*image/jpeg',
  'WMTS*https://www.ign.es/wmts/mapa-raster*MTN_Fondo*GoogleMapsCompatible*MTN Fondo*image/jpeg',
  'WMTS*https://www.ign.es/wmts/pnoa-ma?*OI.OrthoimageCoverage*GoogleMapsCompatible*Imagen (PNOA)*image/jpeg',
];
const wmtsObject = wmtsString.map((layer) => {
  const [type, url, name, matrixSet, legend, format] = layer.split('*');
  return new M.layer.WMTS({ // [type]
    url,
    name,
    matrixSet,
    legend,
    transparent: false,
    displayInLayerSwitcher: false,
    queryable: false,
    visible: true,
    format,
  });
});
map.addLayers(wmtsObject); // Falta este addLayers para usarlo igual que WMSObject */

/* // PRUEBA 
// const objWMTSMapaSoloTextos = new M.layer.WMTS({
//  url: 'https://www.ign.es/wmts/mapa-raster', name: 'MTN_Fondo',
//  matrixSet: 'GoogleMapsCompatible', legend: 'MTN Fondo', transparent: true,
//  displayInLayerSwitcher: false, queryable: false, visible: true, format: 'image/jpeg',
// });
const objWMTSMapa = new M.layer.WMTS({
  url: 'https://www.ign.es/wmts/mapa-raster', name: 'MTN',
  matrixSet: 'GoogleMapsCompatible', legend: 'Mapa MTN', transparent: false,
  displayInLayerSwitcher: false, queryable: false, visible: true, format: 'image/jpeg',
});
const objWMTSLidar = new M.layer.WMTS({
  url: 'https://wmts-mapa-lidar.idee.es/lidar', name: 'EL.GridCoverageDSM',
  matrixSet: 'GoogleMapsCompatible', legend: 'Modelo Digital de Superficies LiDAR', transparent: true,
  displayInLayerSwitcher: false, queryable: false, visible: false, format: 'image/png',
});
const objWMTSsiose = new M.layer.WMTS({
  url: 'https://servicios.idee.es/wmts/ocupacion-suelo', name: 'LC.LandCoverSurfaces',
  matrixSet: 'GoogleMapsCompatible', legend: 'CORINE / SIOSE', transparent: false,
  displayInLayerSwitcher: false, queryable: false, visible: true, format: 'image/png',
});
const objWMTSMTN501Edi = new M.layer.WMTS({
  url: 'https://www.ign.es/wmts/primera-edicion-mtn?', name: 'mtn50-edicion1',
  matrixSet: 'GoogleMapsCompatible', legend: 'MTN50 1Edi', transparent: false,
  displayInLayerSwitcher: false, queryable: false, visible: true, format: 'image/jpeg',
});
const bkmp = new M.plugin.BackImgLayer({
  position: 'TR',
  layerId: 0,
  layerVisibility: true,
  collapsed: true,
  collapsible: true,
  columnsNumber: 4,
  layerOpts: [
    { // Mapa MTN
      id: 'MAPAMTN',
      preview: '',
      title: 'Mapa MTN',
      layers: [objWMTSMapa],
    },
    { // LiDAR
      id: 'lidar',
      preview: 'https://componentes.ign.es/api-core/plugins/backimglayer/images/svqlidar.png',
      title: 'LiDAR',
      layers: [objWMTSLidar],
    },
    // LiDAR Híbrido
    { // SIOSE
      id: 'SIOSE',
      preview: '',
      title: 'SIOSE',
      layers: [objWMTSsiose],
    },
    { //  MTN50 1Edi
      id: 'MTN501Edi',
      preview: '',
      title: 'MTN50 1Edi',
      layers: [objWMTSMTN501Edi],
    },
  ],
}); map.addPlugin(bkmp); window.bkmp = bkmp; // */

/* // PRUEBA ?,
const ocupacionSuelo = new M.layer.WMTS({
  url: 'https://wmts-mapa-lidar.idee.es/lidar',
  name: 'EL.GridCoverageDSM',
  legend: 'Modelo Digital de Superficies LiDAR',
  matrixSet: 'GoogleMapsCompatible',
  visibility: true,
  displayInLayerSwitcher: true,
}, {});
map.addLayers(ocupacionSuelo); // */

// PRUEBA 1 Para el funcionamiento de transparencia
 const SENTINELlistBaseLayersByString = [
  'WMS*Huellas Sentinel2*https://wms-satelites-historicos.idee.es/satelites-historicos*teselas_sentinel2_espanna*true',
  'WMS*Invierno 2022 falso color natural*https://wms-satelites-historicos.idee.es/satelites-historicos*SENTINEL.2022invierno_432-1184*true',
  'WMS*Invierno 2022 falso color infrarrojo*https://wms-satelites-historicos.idee.es/satelites-historicos*SENTINEL.2022invierno_843*true',
  'WMS*Filomena*https://wms-satelites-historicos.idee.es/satelites-historicos*Filomena*true',
  // 'WMS*Invierno 2021 falso color natural*https://wms-satelites-historicos.idee.es/satelites-historicos*SENTINEL.2021invierno_432-1184*true',
  // LOS SIGUIENTES ARRAYS NO PUEDEN SER USADOS DIRECTAMENTE, hay que extraer el la cadena de la capa a mano. Porque el "transformToStringLayers" solo puede trabajar con String o Object, el Array devuelve false.
  // ['Invierno 2021 falso color infrarrojo', '2021', 'WMS*Invierno 2021 falso color infrarrojo*https://wms-satelites-historicos.idee.es/satelites-historicos*SENTINEL.2021invierno_843*true'],
  // ['Verano 2021 falso color natural', '2021', 'WMS*Verano 2021 falso color natural*https://wms-satelites-historicos.idee.es/satelites-historicos*SENTINEL.2021verano_432-1184*true'],
  // ['Verano 2021 falso color infrarrojo', '2021', 'WMS*Verano 2021 falso color infrarrojo*https://wms-satelites-historicos.idee.es/satelites-historicos*SENTINEL.2021verano_843*true'],
  // ['Invierno 2020 falso color natural', '2020', 'WMS*Invierno 2020 falso color natural*https://wms-satelites-historicos.idee.es/satelites-historicos*SENTINEL.2020invierno_432-1184*true'],
  // ['Invierno 2020 falso color infrarrojo', '2020', 'WMS*Invierno 2020 falso color infrarrojo*https://wms-satelites-historicos.idee.es/satelites-historicos*SENTINEL.2020invierno_843*true'],
  // ['Verano 2020 falso color natural', '2020', 'WMS*Verano 2020 falso color natural*https://wms-satelites-historicos.idee.es/satelites-historicos*SENTINEL.2020verano_432-1184*true'],
  // ['Verano 2020 falso color infrarrojo', '2020', 'WMS*Verano 2020 falso color infrarrojo*https://wms-satelites-historicos.idee.es/satelites-historicos*SENTINEL.2020verano_843*true'],
  // ['Invierno 2019 falso color natural', '2019', 'WMS*Invierno 2019 falso color natural*https://wms-satelites-historicos.idee.es/satelites-historicos*SENTINEL.2019invierno_432-1184*true'],
  // ['Invierno 2019 falso color infrarrojo', '2019', 'WMS*Invierno 2019 falso color infrarrojo*https://wms-satelites-historicos.idee.es/satelites-historicos*SENTINEL.2019invierno_843*true'],
  // ['Verano 2019 falso color natural', '2019', 'WMS*Verano 2019 falso color natural*https://wms-satelites-historicos.idee.es/satelites-historicos*SENTINEL.2019verano_432-1184*true'],
  // ['Verano 2019 falso color infrarrojo', '2019', 'WMS*Verano 2019 falso color infrarrojo*https://wms-satelites-historicos.idee.es/satelites-historicos*SENTINEL.2019verano_843*true'],
  // ['Verano 2018 falso color natural', '2018', 'WMS*Verano 2018 falso color natural*https://wms-satelites-historicos.idee.es/satelites-historicos*SENTINEL.2018verano_432-1184*true'],
  // ['Verano 2018 falso color infrarrojo', '2018', 'WMS*Verano 2018 falso color infrarrojo*https://wms-satelites-historicos.idee.es/satelites-historicos*SENTINEL.2018verano_843*true'],
  // ['Huellas Spot5', '2005', 'WMS*Huellas Spot5*https://wms-satelites-historicos.idee.es/satelites-historicos*HuellasSpot5_espanna*true'],
  // ['2014. Pseudocolor natural', '2014', 'WMS*2014. Pseudocolor natural*https://wms-satelites-historicos.idee.es/satelites-historicos*SPOT.2014*true'],
  // ['2013. Pseudocolor natural', '2013', 'WMS*2013. Pseudocolor natural*https://wms-satelites-historicos.idee.es/satelites-historicos*SPOT.2013*true'],
  // ['2012. Pseudocolor natural', '2012', 'WMS*2012. Pseudocolor natural*https://wms-satelites-historicos.idee.es/satelites-historicos*SPOT.2012*true'],
  // ['2011. Pseudocolor natural', '2011', 'WMS*2011. Pseudocolor natural*https://wms-satelites-historicos.idee.es/satelites-historicos*SPOT.2011*true'],
  // ['2009. Pseudocolor natural', '2009', 'WMS*2009. Pseudocolor natural*https://wms-satelites-historicos.idee.es/satelites-historicos*SPOT.2009*true'],
  // ['2008. Pseudocolor natural', '2008', 'WMS*2008. Pseudocolor natural*https://wms-satelites-historicos.idee.es/satelites-historicos*SPOT.2008*true'],
  // ['2005. Pseudocolor natural', '2005', 'WMS*2005. Pseudocolor natural*https://wms-satelites-historicos.idee.es/satelites-historicos*SPOT.2005*true'],
  // ['Huellas Landsat8', '1971', 'WMS*Huellas Landsat8*https://wms-satelites-historicos.idee.es/satelites-historicos*Landsat_huellas_espanna*true'],
  // ['Landsat 8 2014. Color natural', '2014', 'WMS*Landsat 8 2014. Color natural*https://wms-satelites-historicos.idee.es/satelites-historicos*LANDSAT8.2014_432*true'],
  // ['Landsat 8 2014. Falso color infrarrojo', '2014', 'WMS*Landsat 8 2014. Falso color infrarrojo*https://wms-satelites-historicos.idee.es/satelites-historicos*LANDSAT8.2014_654*true'],
  // ['Landsat 5 TM 2006. Color natural', '2006', 'WMS*Landsat 5 TM 2006. Color natural*https://wms-satelites-historicos.idee.es/satelites-historicos*LANDSAT5.2006_321-543'],
  // ['Landsat 5 TM 2006. Falso color infrarrojo', '2006', 'WMS*Landsat 5 TM 2006. Falso color infrarrojo*https://wms-satelites-historicos.idee.es/satelites-historicos*LANDSAT5.2006_432*true'],
  // ['Landsat 5 TM 1986. Falso color infrarrojo', '1986', 'WMS*Landsat 5 TM 1986. Falso color infrarrojo*https://wms-satelites-historicos.idee.es/satelites-historicos*LANDSAT5.1986_432*true'],
  // ['Landsat 1 1971-1975. Color natural', '1971', 'WMS*Landsat 1 1971-1975. Color natural*https://wms-satelites-historicos.idee.es/satelites-historicos*LANDSAT1_544-574*true'],
  // ['Landsat 1 1971-1975. Falso color infrarrojo', '1971', 'WMS*Landsat 1 1971-1975. Falso color infrarrojo*https://wms-satelites-historicos.idee.es/satelites-historicos*LANDSAT1_654*true'],
  // ['Fondo', '2001', 'WMS*Fondo*https://wms-satelites-historicos.idee.es/satelites-historicos*fondo*true'],
]; // 40 capas */

// /* // Prueba 2, Para el funcionamiento de transparencia.
const capas = [
  'WMS*Landsat 5 TM 1996. Color natural*https://wms-satelites-historicos.idee.es/satelites-historicos*LANDSAT5.1996_321-543*true',
  'WMS*Landsat 5 TM 1996. Falso color infrarrojo*https://wms-satelites-historicos.idee.es/satelites-historicos*LANDSAT5.1996_432*true',
  'WMS*Landsat 5 TM 1991. Color natural*https://wms-satelites-historicos.idee.es/satelites-historicos*LANDSAT5.1991_321-543*true',
  'WMS*Landsat 5 TM 1991. Falso color infrarrojo*https://wms-satelites-historicos.idee.es/satelites-historicos*LANDSAT5.1991_432*true',
  'WMS*Landsat 5 TM 1986. Color natural*https://wms-satelites-historicos.idee.es/satelites-historicos*LANDSAT5.1986_321-543*true',
]; // */

const mp = new Comparators({
  position: 'TR',
  collapsed: false,
  collapsible: true,
  isDraggable: false,
  enabledDisplayInLayerSwitcher: false,
  // tooltip: 'Plugin Comparators', // Si se evita uso de opciones tooltip, se usa el archivo de traducción por defecto
  defaultCompareMode: 'mirrorPanelParams', 
  enabledKeyFunctions: true, 
  // lyrsMirrorMinZindex: 10, 
  transparencyParams: {
    radius: 100,
    maxRadius: 200,
    minRadius: 60,
    // tooltip: 'tooltipTransparency',
  },
  lyrcompareParams: {
    staticDivision: 1,
    defaultLyrA: 1,
    defaultLyrB: 2,
    defaultLyrC: 3,
    defaultLyrD: 0,
    opacityVal: 50,
    // tooltip: 'tooltipLyrCompare',
    defaultCompareViz: 2,
  },
  mirrorpanelParams: {
    showCursors: true,
    principalMap: true,
    enabledControlsPlugins: {
      map2: {
        controls: ['scale'],
        Layerswitcher: {
          position: 'TL',
        },
      },
    },
    enabledDisplayInLayerSwitcher: true,
    defaultCompareViz: 2,
    modeVizTypes: [0, 2, 3, 4],
    // tooltip: 'tooltipMirror',
  },
  windowsyncParams: {
    // tooltip: 'tooltipWindowsyncParams',
    controls: [
      'scale',
      'backgroundlayers',
      'panzoombar',
    ],
    plugins: [
      {
        name: 'Layerswitcher',
        params: {
          position: 'TL',
        },
      },
    ],
  },
  listLayers: SENTINELlistBaseLayersByString, // PRUEBA 1 Para el funcionamiento de transparencia
  // listLayers: capas, // PRUEBA 2 Para el funcionamiento de transparencia
});

map.addPlugin(mp);

window.mp = mp; // */
