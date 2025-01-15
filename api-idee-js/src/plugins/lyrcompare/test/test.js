//import LyrCompare from 'facade/lyrcompare';
//import ShareMap from '../../sharemap/src/facade/js/sharemap';

// Código mínimo para arrancar el mapa
const map = M.map({
  container: 'mapjs',
  center: {
    x: -667143.31,
    y: 4493011.77,
  },
  zoom: 8,
});

// Prueba básica del plugin LyrCompare
const pluginLyrCompare = new M.plugin.LyrCompare({
  position: 'TL',
  layers: [
    'WMTS*https://www.ign.es/wmts/mapa-raster?*MTN*GoogleMapsCompatible*MTN*true*image/jpeg*false*false*true',
    'WMTS*https://www.ign.es/wmts/pnoa-ma?*OI.OrthoimageCoverage*GoogleMapsCompatible*imagen*false*image/jpeg*false*false*true',
    'WMTS*https://www.ign.es/wmts/ign-base?*IGNBaseOrto*GoogleMapsCompatible*Callejero*true*image/png*false*false*true',
    'WMTS*https://www.ign.es/wmts/ign-base?*IGNBaseTodo*GoogleMapsCompatible*base*false*image/jpeg*false*false*true',
  ],
  collapsed: false,
  collapsible: true,
  tooltip: "Comparador de capas",
  staticDivision: 1,
  opacityVal: 100,
  comparisonMode: 1,
  defaultLyrA: 0,
  defaultLyrB: 1,
  defaultLyrC: 2,
  defaultLyrD: 3,
});
map.addPlugin(pluginLyrCompare);

M.language.setLang('es'); //Español
//M.language.setLang('en');//Inglés

/***************************
 *     Otras pruebas       *
 **************************/

/*const map = M.map({
  container: 'mapjs',
  center: {
    x: -667143.31,
    y: 4493011.77,
    draw: true //Dibuja un punto en el lugar de la coordenada
  },
  controls: ['scale', 'location'],
  //projection: "EPSG:25830*m",
  projection: "EPSG:3857*m",
  zoom: 15,

  //Ojo, si añado esta capa sin TOC, se ve siempre y no se muestran capas base
  //layers: ["WMTS*http://www.ign.es/wmts/pnoa-ma?*OI.OrthoimageCoverage*EPSG:25830*PNOA"],
});*/

//Añado un BackImageLayer para ver el comportamiento.
//Código para configurar el BackImgLayer
/*const mpBIL = new M.plugin.BackImgLayer({
  position: 'TR',
  collapsible: true,
  collapsed: true,
  layerId: 0,
  layerVisibility: true,
  layerOpts: [{
      id: 'mapa',
      preview: 'http://componentes.ign.es/api-core/plugins/backimglayer/images/svqmapa.png',
      title: 'Mapa',
      layers: [new M.layer.WMTS({
        url: 'http://www.ign.es/wmts/ign-base?',
        name: 'IGNBaseTodo',
        legend: 'Mapa IGN',
        matrixSet: 'GoogleMapsCompatible',
        transparent: false,
        displayInLayerSwitcher: false,
        queryable: false,
        visible: true,
        format: 'image/jpeg',
      })],
    },
    {
      id: 'imagen',
      title: 'Imagen',
      preview: 'http://componentes.ign.es/api-core/plugins/backimglayer/images/svqimagen.png',
      layers: [new M.layer.WMTS({
        url: 'http://www.ign.es/wmts/pnoa-ma?',
        name: 'OI.OrthoimageCoverage',
        legend: 'Imagen (PNOA)',
        matrixSet: 'GoogleMapsCompatible',
        transparent: false,
        displayInLayerSwitcher: false,
        queryable: false,
        visible: true,
        format: 'image/jpeg',
      })],
    },
    {
      id: 'hibrido',
      title: 'Híbrido',
      preview: 'http://componentes.ign.es/api-core/plugins/backimglayer/images/svqhibrid.png',
      layers: [new M.layer.WMTS({
          url: 'http://www.ign.es/wmts/pnoa-ma?',
          name: 'OI.OrthoimageCoverage',
          legend: 'Imagen (PNOA)',
          matrixSet: 'GoogleMapsCompatible',
          transparent: true,
          displayInLayerSwitcher: false,
          queryable: false,
          visible: true,
          format: 'image/png',
        }),
        new M.layer.WMTS({
          url: 'http://www.ign.es/wmts/ign-base?',
          name: 'IGNBaseOrto',
          matrixSet: 'GoogleMapsCompatible',
          legend: 'Mapa IGN',
          transparent: false,
          displayInLayerSwitcher: false,
          queryable: false,
          visible: true,
          format: 'image/png',
        })
      ],
    },
    {
      id: 'lidar',
      preview: 'http://componentes.ign.es/api-core/plugins/backimglayer/images/svqlidar.png',
      title: 'LIDAR',
      layers: [new M.layer.WMTS({
        url: 'https://wmts-mapa-lidar.idee.es/lidar?',
        name: 'EL.GridCoverageDSM',
        legend: 'Modelo Digital de Superficies LiDAR',
        matrixSet: 'GoogleMapsCompatible',
        transparent: false,
        displayInLayerSwitcher: false,
        queryable: false,
        visible: true,
        format: 'image/png',
      })],
    },
  ],
});

map.addPlugin(mpBIL);*/

// 1 WMS por url
// const pluginTransparency = new Transparency({
//   position: 'TL',
//   layers: ['WMS*IGN*http://www.ign.es/wms-inspire/ign-base*IGNBaseTodo'],
//   collapsible: false
// });

// 2 WMTS por url
// const pluginTransparency = new Transparency({
//   position: 'TL',
//   layers: ['WMTS*IGN*http://www.ideandalucia.es/geowebcache/service/wmts*toporaster'],
//   collapsible: false
// });

// 3 WMS y WMTS como objetos
/*let wmtsToporaster = new M.layer.WMTS({
  url: "http://www.ideandalucia.es/geowebcache/service/wmts",
  name: "toporaster",
  matrixSet: "EPSG:25830",
  legend: "Toporaster"
}, {
  format: 'image/png'
});
map.addWMTS(wmtsToporaster);*/

/*
const wms = new M.layer.WMS({
  url: 'http://www.ign.es/wms-inspire/unidades-administrativas?',
  name: 'AU.AdministrativeBoundary',
  legend: 'Limite administrativo',
  tiled: false,
}, {});
map.addWMS(wms);
*/

/*let wmtsMinutasMTN50 = new M.layer.WMTS({
  url: "http://www.ign.es/wmts/primera-edicion-mtn",
  name: "catastrones",
  //matrixSet: "EPSG:25830",
  matrixSet: "GoogleMapsCompatible",
  legend: "Minutas MTN50"
}, {
  format: 'image/jpeg'
});
map.addWMTS(wmtsMinutasMTN50);*/

/*let wmtsMTN501edi = new M.layer.WMTS({
  url: "http://www.ign.es/wmts/primera-edicion-mtn",
  name: "mtn50-edicion1",
  //matrixSet: "EPSG:25830",
  matrixSet: "GoogleMapsCompatible",
  legend: "Primera edición MTN50"
}, {
  format: 'image/jpeg'
});
map.addWMTS(wmtsMTN501edi);*/

/*let wmtsMTN251edi = new M.layer.WMTS({
  url: "http://www.ign.es/wmts/primera-edicion-mtn",
  name: "mtn25-edicion1",
  //matrixSet: "EPSG:25830",
  matrixSet: "GoogleMapsCompatible",
  legend: "Primera edición MTN25"
}, {
  format: 'image/jpeg'
});
map.addWMTS(wmtsMTN251edi);*/

/*let wmtsLidar = new M.layer.WMTS({
  url: "http://wmts-mapa-lidar.idee.es/lidar",
  name: "EL.GridCoverageDSM",
  matrixSet: "GoogleMapsCompatible",
  legend: "LiDAR"
}, {
  format: 'image/png'
});
map.addWMTS(wmtsLidar);*/

/*let wmtsSIOSE = new M.layer.WMTS({
  url: "http://servicios.idee.es/wmts/ocupacion-suelo",
  name: "LC.LandCoverSurfaces",
  matrixSet: "GoogleMapsCompatible",
  legend: "SIOSE"
}, {
  format: 'image/jpeg'
});
map.addWMTS(wmtsSIOSE);*/

// 4 WMS y WMTS por nombres
/*const pluginLyrCompare = new LyrCompare({
  position: 'TL',dist
  layers: [
    //wmtsMTN251edi, wmtsMTN501edi, wmtsToporaster, wmtsMinutasMTN50, wmtsLidar, wmtsSIOSE,
    'WMS*SIGPAC*https://www.ign.es/wms/pnoa-historico*SIGPAC',
    'WMS*OLISTAT*https://www.ign.es/wms/pnoa-historico*OLISTAT',
    'WMS*Nacional_1981-1986*https://www.ign.es/wms/pnoa-historico*Nacional_1981-1986',
    'WMS*Interministerial_1973-1986*https://www.ign.es/wms/pnoa-historico*Interministerial_1973-1986',
    'WMS*AMS_1956-1957*https://www.ign.es/wms/pnoa-historico*AMS_1956-1957'
  ],
  //layers: ['mtn50-edicion1','toporaster', 'AU.AdministrativeBoundary'], //Podemos añadir capas al plugin por el valor del atributo name o por el objeto que las contiene
  collapsible: true,
  collapsed: false,
  staticDivision: 1,
  opacityVal: 100,
  comparisonMode: 0,
  defaultLyrA: 1, //Número de capa A que arranca por defecto. Valores 1...nº de capas
  defaultLyrB: 2, //Número de capa B que arranca por defecto. Valores 1...nº de capas
  defaultLyrC: 3, //Número de capa C que arranca por defecto. Valores 1...nº de capas
  defaultLyrD: 4, //Número de capa D que arranca por defecto. Valores 1...nº de capas
});

map.addPlugin(pluginLyrCompare);*/

//window.map = map;