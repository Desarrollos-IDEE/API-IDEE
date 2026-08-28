import { map as Mmap } from 'IDEE/api-idee';
import WFS from 'IDEE/layer/WFS';
import Cluster from 'IDEE/style/Cluster';
import Generic from 'IDEE/style/Generic';
import GeoJSON from 'IDEE/layer/GeoJSON';

const mapa = Mmap({
  container: 'map',
  center: [-4.955234548683441, 37.91842330548027],
  zoom: 9,
});
window.mapa = mapa;

const campamentos = new WFS({
  url: 'https://hcsigc.juntadeandalucia.es/geoserver/wfs',
  namespace: 'IECA',
  name: 'sigc_campamentos_1724753464727',
  geometry: 'POINT',
  version: '1.0.0',
});

const campamentos_3d = new GeoJSON({
  name: "Campamentos",
  namespace: "sepim",
  name: "campamentos",
  geometry: 'POINT',
  source: {
    "type": "FeatureCollection",
    "features": [
      {
          "type": "Feature",
          "id": "temp_1683030643320.1683030649431",
          "geometry": {
              "type": "Point",
              "coordinates": [
                  -3.7174792324049335,
                  40.36960529907216,
                  605.698
              ]
          },
          "properties": {}
      },
      {
          "type": "Feature",
          "id": "temp_1683030643320.1683030650527",
          "geometry": {
              "type": "Point",
              "coordinates": [
                  -3.7160844837171894,
                  40.37318546296558,
                  593.704
              ]
          },
          "properties": {}
      },
      {
          "type": "Feature",
          "id": "temp_1683030643320.1683030653600",
          "geometry": {
              "type": "Point",
              "coordinates": [
                  -3.7137026821119647,
                  40.369033109133,
                  603.705
              ]
          },
          "properties": {}
      },
      {
          "type": "Feature",
          "id": "temp_1683030643320.1683030654504",
          "geometry": {
              "type": "Point",
              "coordinates": [
                  -3.717693809126125,
                  40.36759443868107,
                  604.885
              ]
          },
          "properties": {}
      },
      {
          "type": "Feature",
          "id": "temp_1683030643320.1683030655207",
          "geometry": {
              "type": "Point",
              "coordinates": [
                  -3.7157840763075214,
                  40.3658124065673,
                  602.39
              ]
          },
          "properties": {}
      },
      {
          "type": "Feature",
          "id": "temp_1683030643320.1683030655824",
          "geometry": {
              "type": "Point",
              "coordinates": [
                  -3.711943152998195,
                  40.3720901818765,
                  593.189
              ]
          },
          "properties": {}
      },
      {
          "type": "Feature",
          "id": "temp_1683030643320.1683030656312",
          "geometry": {
              "type": "Point",
              "coordinates": [
                  -3.7149043117506366,
                  40.37140357868341,
                  598.951
              ]
          },
          "properties": {}
      },
      {
          "type": "Feature",
          "id": "temp_1683030643320.1683030656872",
          "geometry": {
              "type": "Point",
              "coordinates": [
                  -3.7084455524427753,
                  40.368379171825495,
                  597.665
              ]
          },
          "properties": {}
      },
      {
          "type": "Feature",
          "id": "temp_1683030643320.1683030657752",
          "geometry": {
              "type": "Point",
              "coordinates": [
                  -3.7127156291944843,
                  40.366613509402015,
                  601.958
              ]
          },
          "properties": {}
      },
      {
          "type": "Feature",
          "id": "temp_1683030643320.1683030658384",
          "geometry": {
              "type": "Point",
              "coordinates": [
                  -3.711127761457668,
                  40.36473335504678,
                  596.795
              ]
          },
          "properties": {}
      },
      {
          "type": "Feature",
          "id": "temp_1683030643320.1683030658880",
          "geometry": {
              "type": "Point",
              "coordinates": [
                  -3.7018151317579604,
                  40.366973185128614,
                  588.819
              ]
          },
          "properties": {}
      },
      {
          "type": "Feature",
          "id": "temp_1683030643320.1683030659295",
          "geometry": {
              "type": "Point",
              "coordinates": [
                  -3.7056345973951674,
                  40.37045540086862,
                  594.899
              ]
          },
          "properties": {}
      },
      {
          "type": "Feature",
          "id": "temp_1683030643320.1683030659755",
          "geometry": {
              "type": "Point",
              "coordinates": [
                  -3.707093719099269,
                  40.36502764353824,
                  592.651
              ]
          },
          "properties": {}
      },
      {
          "type": "Feature",
          "id": "temp_1683030643320.1683030660184",
          "geometry": {
              "type": "Point",
              "coordinates": [
                  -3.709475520704494,
                  40.37086409983843,
                  596.233
              ]
          },
          "properties": {}
      },
      {
          "type": "Feature",
          "id": "temp_1683030643320.1683030660568",
          "geometry": {
              "type": "Point",
              "coordinates": [
                  -3.7109561000807143,
                  40.368706141272355,
                  600.798
              ]
          },
          "properties": {}
      },
      {
          "type": "Feature",
          "id": "temp_1683030643320.1683030661448",
          "geometry": {
              "type": "Point",
              "coordinates": [
                  -3.703703406904445,
                  40.367545392556195,
                  590.971
              ]
          },
          "properties": {}
      },
      {
          "type": "Feature",
          "id": "temp_1683030643320.1683030662344",
          "geometry": {
              "type": "Point",
              "coordinates": [
                  -3.7014503513319355,
                  40.37133818753827,
                  588.605
              ]
          },
          "properties": {}
      },
      {
          "type": "Feature",
          "id": "temp_1683030643320.1683030662992",
          "geometry": {
              "type": "Point",
              "coordinates": [
                  -3.6986179386122084,
                  40.36690778968472,
                  595.535
              ]
          },
          "properties": {}
      }
    ]
  },
  extract: false
});

mapa.addLayers(campamentos);
// mapa.addLayers(campamentos_3d);

// Example #1: Se aplica un cluster por defecto
// campamentos.setStyle(new Cluster());
// campamentos_3d.setStyle(new Cluster());

// Example #2: Se aplica un clúster personalizado
const estilo = new Generic({
  point: {
    radius: 10,
    fill: {
      color: 'red',
    },
  },
});

const clusterOptions = {
  ranges: [{
    min: 2,
    max: 4,
    style: new Generic({
      point: {
        stroke: {
          color: '#5789aa',
        },
        fill: {
          color: '#99ccff',
        },
        radius: 20,
      },
    }),
  }, {
    min: 5,
    max: 9,
    style: new Generic({
      point: {
        stroke: {
          color: '#5789aa',
        },
        fill: {
          color: '#3399ff',
        },
        radius: 30,
      },
    }),
  },
  ],
  // animated: true, // En Cesium siempre está activado
  hoverInteraction: true,
  // hoverInteraction: false,
  // displayAmount: false,
  displayAmount: true,
  selectInteraction: true,
  // selectInteraction: false,
  distance: 80,
  maxFeaturesToSelect: 6,
  label: {
    font: 'bold 15px Comic Sans MS',
    color: 'red',
  },
};

const optionsVendor = {
  // distanceSelectFeatures: 5000,
  convexHullStyle: {
    fill: {
      color: '#000000',
      opacity: 0.5,
    },
    stroke: {
      color: '#000000',
      width: 1,
    },
  },
};

// const styleCluster = new Cluster(clusterOptions);
const styleCluster = new Cluster(clusterOptions, optionsVendor);
campamentos.setStyle(estilo);
campamentos.setStyle(styleCluster);
// campamentos_3d.setStyle(styleCluster);
