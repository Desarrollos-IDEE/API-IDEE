import FullTOC from 'facade/fulltoc';

// M.language.setLang('en');

const map = M.map({
  container: 'mapjs',
  controls: ['scale'],
  center: {
    x: -528863.345515127,
    y: 4514194.232367303,
  },
  zoom: 9,
  layers: ['TMS*TMSBaseIGN*https://tms-ign-base.idee.es/1.0.0/IGNBaseTodo/{z}/{x}/{-y}.jpeg*true*true'],
});

const capa = new M.layer.OGCAPIFeatures({
  url: 'http://ignsolarguadaltel.desarrollo.guadaltel.es/collections/',
  name: 'rutas',
  extract: true,
});

map.addLayers(capa);

const precharged = {
  groups: [{
      name: 'IGN',
      services: [{
          name: 'Unidades administrativas',
          type: 'WMS',
          url: 'https://www.ign.es/wms-inspire/unidades-administrativas?',
          white_list: ['AU.AdministrativeBoundary'],
        },
        {
          name: 'Nombres geográficos',
          type: 'WMS',
          url: 'https://www.ign.es/wms-inspire/ngbe?',
        },
        {
          name: 'Redes geodésicas',
          type: 'WMS',
          url: 'https://www.ign.es/wms-inspire/redes-geodesicas?',
        },
        {
          name: 'Cuadrículas cartográficas',
          type: 'WMS',
          url: 'https://www.ign.es/wms-inspire/cuadriculas?',
          white_list: ['Grid-REGCAN95-lonlat-50k', 'Grid-ETRS89-lonlat-50k', 'Grid-ETRS89-lonlat-25k', 'Grid-REGCAN95-lonlat-25k', 'Grid-25k-extendida'],
        },
        {
          name: 'Información sísmica y volcánica',
          type: 'WMS',
          url: 'https://www.ign.es/wms-inspire/geofisica?',
        },
        {
          name: 'Fototeca',
          type: 'WMS',
          url: 'https://wms-fototeca.idee.es/fototeca?',
        },
        {
          name: 'Camino de Santiago',
          type: 'WMS',
          url: 'https://www.ign.es/wms-inspire/camino-santiago?',
        },
      ],
    },
    {
      name: 'IGN. Cartografía histórica',
      services: [{
          name: 'Planos de Madrid (1622 - 1960)',
          type: 'WMS',
          url: 'https://www.ign.es/wms/planos?',
        },
        {
          name: 'Hojas kilométricas (Madrid - 1860)',
          type: 'WMS',
          url: 'https://www.ign.es/wms/hojas-kilometricas?',
        },
        {
          name: 'Planimetrías',
          type: 'WMS',
          url: 'https://www.ign.es/wms/minutas-cartograficas?',
        },
        {
          name: 'Primera edición de los Mapas Topográficos Nacionales',
          type: 'WMS',
          url: 'https://www.ign.es/wms/primera-edicion-mtn?',
        },
      ],
    },
    {
      name: 'Sistema Cartográfico Nacional',
      services: [{
          name: 'PNOA. Ortofotos máxima actualidad',
          type: 'WMS',
          url: 'https://www.ign.es/wms-inspire/pnoa-ma?',
        },
        {
          name: 'PNOA. Ortofotos históricas',
          type: 'WMS',
          url: 'https://www.ign.es/wms/pnoa-historico?',
        },
        {
          name: 'Ocupación del suelo',
          type: 'WMS',
          url: 'https://servicios.idee.es/wms-inspire/ocupacion-suelo?',
        },
        {
          name: 'Ocupación del suelo. Histórico',
          type: 'WMS',
          url: 'https://servicios.idee.es/wms-inspire/ocupacion-suelo-historico?',
        },
        {
          name: 'Información Geográfica de Referencia. Transportes',
          type: 'WMS',
          url: 'https://servicios.idee.es/wms-inspire/transportes?',
        },
        {
          name: 'Información Geográfica de Referencia. Hidrografía',
          type: 'WMS',
          url: 'https://servicios.idee.es/wms-inspire/hidrografia?',
        },
        {
          name: 'Direcciones y códigos postales',
          type: 'WMS',
          url: 'https://www.cartociudad.es/wms-inspire/direcciones-ccpp?',
        },
        {
          name: 'Modelos digitales del terreno',
          type: 'WMS',
          url: 'https://servicios.idee.es/wms-inspire/mdt?',
        },
        {
          name: 'Copernicus Land Monitoring Service',
          type: 'WMS',
          url: 'https://servicios.idee.es/wms/copernicus-landservice-spain?',
        },
      ],
    },
    {
      name: 'Capas de fondo',
      services: [{
          name: 'Mapa',
          type: 'WMTS',
          url: 'https://www.ign.es/wmts/mapa-raster?',
        },
        {
          name: 'Imagen',
          type: 'WMTS',
          url: 'https://www.ign.es/wmts/pnoa-ma?',
        },
        {
          name: 'Callejero',
          type: 'WMTS',
          url: 'https://www.ign.es/wmts/ign-base?',
        },
        {
          name: 'Relieve',
          type: 'WMTS',
          url: 'https://wmts-mapa-lidar.idee.es/lidar?',
        },
        {
          name: 'Ocupación del suelo',
          type: 'WMTS',
          url: 'https://servicios.idee.es/wmts/ocupacion-suelo?',
        },
        {
          name: 'Mapas Históricos',
          type: 'WMTS',
          url: 'https://www.ign.es/wmts/primera-edicion-mtn',
        },
      ],
    },
    {
      name: 'Capas vectoriales',
      services: [{
        name: 'Colecciones del Sistema Cartográfico Nacional',
        type: 'OGCAFPIFeatures',
        url: 'https://api-features.idee.es/',
      }, ],
    },
  ],
  services: [{
    name: 'Catastro',
    type: 'WMS',
    url: 'http://ovc.catastro.meh.es/Cartografia/WMS/ServidorWMS.aspx?',
  }],
};

const mp = new FullTOC({
  collapsed: false,
  position: 'TR',
  https: true,
  http: true,
  // precharged,
  // precharged: {},
  codsi: true,
  order: 1,
});

window.mp = mp;
window.FullTOC = FullTOC;

map.addPlugin(mp);
const layerUA = new M.layer.WMS({
  url: 'https://www.ign.es/wms-inspire/unidades-administrativas?',
  name: 'AU.AdministrativeUnit',
  legend: 'Unidad administrativa',
  tiled: false,
}, {});
const layerinicial = new M.layer.WMS({
  url: 'https://www.ign.es/wms-inspire/unidades-administrativas?',
  name: 'AU.AdministrativeBoundary',
  legend: 'Limite administrativo',
  tiled: false,
}, {
  visibility: false,
});

const ocupacionSuelo = new M.layer.WMTS({
  url: 'http://wmts-mapa-lidar.idee.es/lidar',
  name: 'EL.GridCoverageDSM',
  legend: 'Modelo Digital de Superficies LiDAR',
  matrixSet: 'GoogleMapsCompatible',
}, {
  visibility: false,
});

const layer5 = new M.layer.WMS({
  url: 'https://servicios.ine.es/WMS/WMS_INE_SECCIONES_G01/MapServer/WMSServer?',
  name: 'Secciones2021',
  legend: 'Secciones censales',
  version: '1.3.0',
  tiled: false,
  visibility: true,
}, {});

// map.addLayers([layer5]);

map.addPlugin(new M.plugin.Information({
  position: 'TR',
}));

/* const xyz = new M.layer.XYZ({
  url: 'https://tms-pnoa-ma.idee.es/1.0.0/pnoa-ma/{z}/{x}/{-y}.jpeg',
  name: 'PNOA-MA',
  legend: 'Imagen',
  projection: 'EPSG:3857',
  transparent: true,
  displayInLayerSwitcher: false,
  queryable: false,
  visible: true,
  tileGridMaxZoom: 19,
}); */

/* map.addLayers(layerUA);
map.addLayers(layerinicial);
map.addLayers(ocupacionSuelo); */

// map.addLayers(xyz);

/* const terremotos = new M.layer.WMS({
  url: 'https://www.ign.es/wms-inspire/geofisica',
  name: 'NZ.ObservedEvent',
  legend: 'terremotos 3',
  visibility: true,
  tiled: true,
},{ params: { CQL_FILTER: 'magnitud>3' } }
);

map.addLayers(terremotos); */

window.map = map;
