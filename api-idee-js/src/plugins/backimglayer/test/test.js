/* eslint-disable no-unused-vars,max-len */
import BackImgLayer from "facade/backimglayer";

IDEE.language.setLang("es");
// IDEE.language.setLang('en');

// const wmstTestLayer0 = new IDEE.layer.WMTS({url: 'https://www.ign.es/wmts/pnoa-ma?', name: 'OI.OrthoimageCoverage', matrixSet: 'GoogleMapsCompatible', legend: 'Imagen', transparent: true, displayInLayerSwitcher: false, queryable: false, visible: true, format: 'image/jpeg', minZoom: 5, maxZoom: 10}); // NO BASE
// const wmstTestLayer0 = new IDEE.layer.WMTS({url: 'https://www.ign.es/wmts/pnoa-ma?', name: 'OI.OrthoimageCoverage', matrixSet: 'GoogleMapsCompatible', legend: 'Imagen', transparent: false, displayInLayerSwitcher: false, queryable: false, visible: true, format: 'image/jpeg', minZoom: 5, maxZoom: 10}); // BASE
const map = IDEE.map({
  container: "mapjs",
  controls: ["scale"],
  center: [-458756.9690741142, 4682774.665868655],
  layers: ["OSM"], // [wmstTestLayer0], // Este layer OSM o wmstTestLayer se quitan al añadir el plugin, si son layer base, en este caso si fue configurado como transparente false. Parece ser por map.getBaseLayers().forEach((layer) => {layer.on(IDEE.evt.LOAD, map.removeLayers(layer));});.
  zoom: 6,
});

// Variables necesarias para las pruebas.
const wmtsLayer1 =
  "WMTS*https://www.ign.es/wmts/ign-base?*IGNBaseTodo*GoogleMapsCompatible*Mapa IGN*false*image/jpeg*false*false*true";
const wmtsLayer2 =
  "WMTS*https://www.ign.es/wmts/pnoa-ma?*OI.OrthoimageCoverage*GoogleMapsCompatible*Imagen (PNOA)*false*image/png*false*false*true";
const wmtsLayer3 =
  "WMTS*https://www.ign.es/wmts/ign-base?*IGNBaseOrto*GoogleMapsCompatible*Mapa IGN*true*image/jpeg*false*false*true";
// const old_restLayer4= 'WMTSasteriscohttps://www.ign.es/wmts/ign-base?asteriscoIGNBaseTodoasteriscoGoogleMapsCompatibleasteriscoMapa IGNasteriscofalseasteriscoimage/jpegasteriscofalseasteriscofalseasteriscotrue,WMTSasteriscohttps://www.ign.es/wmts/pnoa-ma?asteriscoOI.OrthoimageCoverageasteriscoGoogleMapsCompatibleasteriscoImagen (PNOA)asteriscofalseasteriscoimage/pngasteriscofalseasteriscofalseasteriscotruesumarWMTSasteriscohttps://www.ign.es/wmts/ign-base?asteriscoIGNBaseOrtoasteriscoGoogleMapsCompatibleasteriscoMapa IGNasteriscotrueasteriscoimage/jpegasteriscofalseasteriscofalseasteriscotrue'; // Los 'asterisco' no se usan, se debería de ser hecho con '*'
const restLayer4 =
  "WMTS*https://www.ign.es/wmts/ign-base?*IGNBaseTodo*GoogleMapsCompatible*Mapa IGN*false*image/jpeg*false*false*true,WMTS*https://www.ign.es/wmts/pnoa-ma?*OI.OrthoimageCoverage*GoogleMapsCompatible*Imagen (PNOA)*false*image/png*false*false*truesumarWMTS*https://www.ign.es/wmts/ign-base?*IGNBaseOrto*GoogleMapsCompatible*Mapa IGN*true*image/jpeg*false*false*true";
const pwImg1 = "../src/facade/assets/images/svqimagen.png";
const pwImg2 = "https://www.ign.es/iberpix/static/media/raster.c7a904f3.png";
const pwImg3 = "../src/facade/assets/images/svqmapa.png";
const pwImg4 = "../src/facade/assets/images/svqhibrid.png";

// const i = new IDEE.plugin.Information({}); map.addPlugin(i);

const mp = new BackImgLayer({
  // position: 'BL', // 'TL' | 'TR' | 'BR' | 'BL'
  collapsed: false, // true,
  collapsible: true,
  tooltip:
    'Tooltip de texto "Capas de fondo" que aparece al hacer hover sobre él.',
  layerVisibility: false,
  columnsNumber: 3,
  empty: false,
  layerId: 0,
  /* / PRUEBA 1 // Cuando no se pasa layerOpts, se usan los parámetros ids, titles, previews y layers
  position: 'TL',
  ids: 'mapa,hibrido',
  titles: 'Mapa,Hibrido',
  previews: pwImg1 + ',' + pwImg3,
  layers: wmtsLayer1 + ',' + wmtsLayer2,
  // */

  /* / PRUEBA 2
  position: 'TR',
  columnsNumber: 3,
  //ids: ['mapa', 'hibrido'],
  ids: 'mapa,hibrido',
  // titles: ['Mapa', 'Hibrido'],
  titles: 'Mapa,Hibrido',
  // previews: [pwImg3, pwImg4],
  previews: pwImg3+','+pwImg4,
  // layers: [wmtsLayer1, wmtsLayer2 + '+' + wmtsLayer3],
  // layers: wmtsLayer1+','+wmtsLayer2 + '+' + wmtsLayer3,
  layers: wmtsLayer1+','+wmtsLayer2 + 'sumar' + wmtsLayer3,
  // ids: 'mapa,hibrido,orto', titles: 'Mapa,Hibrido,Orto', layers: wmtsLayer1+','+wmtsLayer2 + ',' + wmtsLayer3,
  // layers: wmtsLayer1 + ',' + wmtsLayer2,
  // */

 // PRUEBA 3
  position: 'TR',
  layerOpts: [
     {
              id: 'raster',
              preview: pwImg1,
              title: 'Mapa',
              layers: [
                new IDEE.layer.WMTS({
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
              id: 'imagen',
              preview: pwImg2,
              title: 'Imagen',
              layers: [
                new IDEE.layer.XYZ({
                  url: 'https://tms-pnoa-ma.idee.es/1.0.0/pnoa-ma/{z}/{x}/{-y}.jpeg',
                  name: 'PNOA-MA',
                  legend: 'Imagen',
                  projection: 'EPSG:3857',
                  transparent: false,
                  displayInLayerSwitcher: false,
                  queryable: false,
                  visible: true,
                  maxZoom: 19,
                }),
                new IDEE.layer.WMTS({
                  url: 'https://www.ign.es/wmts/pnoa-ma?',
                  name: 'OI.OrthoimageCoverage',
                  matrixSet: 'GoogleMapsCompatible',
                  legend: 'Imagen',
                  transparent: true,
                  displayInLayerSwitcher: false,
                  queryable: false,
                  visible: true,
                  format: 'image/jpeg',
                  minZoom: 19,
                }),
              ],
            },
            {
              id: 'mapa',
              preview: pwImg3,
              title: 'Callejero',
              layers: [
                new IDEE.layer.WMTS({
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
            {
              id: 'hibrido',
              title: 'Híbrido',
              preview: pwImg4,
              layers: [
                new IDEE.layer.XYZ({
                  url: 'https://tms-pnoa-ma.idee.es/1.0.0/pnoa-ma/{z}/{x}/{-y}.jpeg',
                  name: 'PNOA-MA',
                  legend: 'Imagen',
                  projection: 'EPSG:3857',
                  transparent: false,
                  displayInLayerSwitcher: false,
                  queryable: false,
                  visible: true,
                  maxZoom: 19,
                }),
                new IDEE.layer.WMTS({
                  url: 'https://www.ign.es/wmts/pnoa-ma?',
                  name: 'OI.OrthoimageCoverage',
                  matrixSet: 'GoogleMapsCompatible',
                  legend: 'Imagen',
                  transparent: true,
                  displayInLayerSwitcher: false,
                  queryable: false,
                  visible: true,
                  format: 'image/jpeg',
                  minZoom: 19,
                }),
                new IDEE.layer.WMTS({
                  url: 'https://www.ign.es/wmts/ign-base?',
                  name: 'IGNBaseOrto',
                  matrixSet: 'GoogleMapsCompatible',
                  legend: 'Topónimos',
                  transparent: true,
                  displayInLayerSwitcher: false,
                  queryable: false,
                  visible: true,
                  format: 'image/png',
                }),
              ],
            },
            {
              id: 'lidar',
              preview: 'https://componentes.idee.es/estaticos/imagenes/pre_visualizacion/lidar.png',
              title: 'LiDAR',
              layers: [
                new IDEE.layer.WMTS({
                  url: 'https://wmts-mapa-lidar.idee.es/lidar?',
                  name: 'EL.GridCoverageDSM',
                  legend: 'LiDAR',
                  matrixSet: 'GoogleMapsCompatible',
                  transparent: false,
                  displayInLayerSwitcher: false,
                  queryable: false,
                  visible: true,
                  format: 'image/png',
                }),
              ],
            },
            {
              id: 'ocupacion-suelo',
              preview: 'https://componentes.idee.es/estaticos/imagenes/pre_visualizacion/ocupacion_suelo.png',
              title: 'Ocupación',
              layers: [
                new IDEE.layer.WMTS({
                  url: 'https://servicios.idee.es/wmts/ocupacion-suelo?',
                  name: 'LC.LandCoverSurfaces',
                  legend: 'Ocupación',
                  matrixSet: 'GoogleMapsCompatible',
                  transparent: false,
                  displayInLayerSwitcher: false,
                  queryable: false,
                  visible: true,
                  format: 'image/png',
                }),
              ],
            },
            {
              id: 'historicos',
              preview: 'https://componentes.idee.es/estaticos/imagenes/pre_visualizacion/historicos.png',
              title: 'Históricos',
              layers: [
                new IDEE.layer.WMTS({
                  url: 'https://www.ign.es/wmts/primera-edicion-mtn?',
                  name: 'mtn50-edicion1',
                  legend: 'Históricos',
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

  /* / PRUEBA 4
  position: 'TL',
  ids: 'mapa,hibrido',
  titles: 'Mapa,Hibrido',
  previews: pwImg3 + ',' + pwImg4,
  layers: restLayer4,
  // */
});

map.addPlugin(mp);
window.mp = mp;
window.BackImgLayer = BackImgLayer;

window.map = map;
