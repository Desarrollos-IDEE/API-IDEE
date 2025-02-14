import Vectors from 'facade/vectors';

const map = M.map({
  container: 'mapjs',
  controls: ['scale'],
  center: {
    x: -528863.345515127,
    y: 4514194.232367303,
  },
  zoom: 9,
  /* layers: [
    //'WMTS*http://www.ideandalucia.es/geowebcache/service/wmts?*toporaster*SIG-C:25830*WMTS*false',
    //'WFS*CampamentosCampamentosCampamentosCampamentos*http://geostematicos-sigc.juntadeandalucia.es/geoserver/sepim/ows*sepim:campamentos*POINT***eyJwYXJhbWV0ZXJzIjpbeyJpY29uIjp7ImZvcm0iOiJDSVJDTEUiLCJjbGFzcyI6ImctY2FydG9ncmFmaWEtYmFuZGVyYSIsImZvbnRzaXplIjowLjUsInJhZGl1cyI6MTUsImZpbGwiOiJ3aGl0ZSJ9LCJyYWRpdXMiOjV9XSwiZGVzZXJpYWxpemVkTWV0aG9kIjoiKChzZXJpYWxpemVkUGFyYW1ldGVycykgPT4gTS5zdHlsZS5TaW1wbGUuZGVzZXJpYWxpemUoc2VyaWFsaXplZFBhcmFtZXRlcnMsICdNLnN0eWxlLlBvaW50JykpIn0',
  ], */
});

const precharged = [
  {
    name: 'Hidrografía',
    url: 'https://servicios.idee.es/wfs-inspire/hidrografia?',
  },
  {
    name: 'Límites administrativos',
    url: 'https://www.ign.es/wfs-inspire/unidades-administrativas?',
  },
];

const mp = new Vectors({
  collapsed: true,
  collapsible: true,
  position: 'TR',
  wfszoom: 12,
  // precharged,
});

const mp2 = new M.plugin.Infocoordinates({
  position: 'TR',
  decimalGEOcoord: 4,
  decimalUTMcoord: 4,
});

const mp3 = new M.plugin.Information({
  position: 'TR',
  buffer: 100,
});

const mp4 = new M.plugin.MeasureBar({ position: 'TR' });

const provincias = new M.layer.WFS({
  url: 'http://geostematicos-sigc.juntadeandalucia.es/geoserver/tematicos/ows?',
  namespace: 'tematicos',
  name: 'Provincias',
  legend: 'Provincias',
  geometry: 'MPOLYGON',
});

const viales = new M.layer.WFS({
  url: 'http://g-gis-online-lab.desarrollo.guadaltel.es/geoserver/ggiscloud_root/wms?',
  namespace: 'ggiscloud_root',
  name: 'a1585302352391_viales_almeria',
  legend: 'Viales',
  geometry: 'LINE',
});

// map.addWFS(provincias);
// map.addWFS(viales);
map.addPlugin(mp);
// map.addPlugin(mp2);
// map.addPlugin(mp3);
// map.addPlugin(mp4);
// map.addPlugin(new M.plugin.MeasureBar({ position: 'TR' }));
map.addPlugin(new M.plugin.BackImgLayer({
  position: 'TR',
  layerId: 0,
  layerVisibility: true,
  collapsed: true,
  collapsible: true,
  columnsNumber: 4,
  empty: true,
  layerOpts: [
    {
      id: 'imagen',
      preview: '',
      title: 'Imagen',
      layers: [
        new M.layer.XYZ({
          url: 'https://tms-pnoa-ma.idee.es/1.0.0/pnoa-ma/{z}/{x}/{-y}.jpeg',
          name: 'PNOA-MA',
          legend: 'Imagen',
          projection: 'EPSG:3857',
          transparent: false,
          displayInLayerSwitcher: false,
          queryable: false,
          visible: true,
          tileGridMaxZoom: 19,
        }),
      ],
    },
    {
      id: 'raster',
      preview: '',
      title: 'Mapa',
      layers: [
        new M.layer.WMTS({
          url: 'https://www.ign.es/wmts/mapa-raster?',
          name: 'MTN',
          legend: 'Mapa',
          matrixSet: 'GoogleMapsCompatible',
          transparent: false,
          displayInLayerSwitcher: false,
          queryable: false,
          visible: true,
          format: 'image/jpeg',
        }),
      ],
    },
    {
      id: 'mapa',
      preview: '',
      title: 'Callejero',
      layers: [
        new M.layer.WMTS({
          url: 'https://www.ign.es/wmts/ign-base?',
          name: 'IGNBaseTodo',
          legend: 'Callejero',
          matrixSet: 'GoogleMapsCompatible',
          transparent: false,
          displayInLayerSwitcher: false,
          queryable: false,
          visible: true,
          format: 'image/jpeg',
        }),
      ],
    },
  ],
}));
window.map = map;
