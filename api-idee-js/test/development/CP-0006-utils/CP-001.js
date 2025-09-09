import { map as Mmap } from "IDEE/api-idee";
import Popup from "IDEE/Popup";
import { get as remoteGet } from 'IDEE/util/Remote';

var oriPopupInteligence = IDEE.config.POPUP_INTELLIGENCE;
IDEE.config.POPUP_INTELLIGENCE = false;
IDEE.config.POPUP_INTELLIGENCE = oriPopupInteligence;

const mapa = Mmap({
  container: "map",
  projection: "EPSG:3857",
});

window.mapa = mapa;

// featureTabOpts_1
fetch(
  "https://www.ign.es/wms-inspire/redes-geodesicas?REQUEST=GetFeatureInfo&QUERY_LAYERS=RED_NAP&SERVICE=WMS&VERSION=1.3.0&FORMAT=image%2Fpng&STYLES=&TRANSPARENT=true&LAYERS=RED_NAP&INFO_FORMAT=text%2Fhtml&FEATURE_COUNT=99&BUFFER=10&I=162&J=144&WIDTH=256&HEIGHT=256&CRS=EPSG%3A3857&BBOX=-105424.18397026835%2C4798176.869357052%2C62046.32778822584%2C4965647.381115546"
)
  .then((response) => {
    if (!response.ok) {
      throw new Error("Error en la petición: " + response.statusText);
    }
    return response.text();
  })
  .then((html) => {
    console.log(html);
    // Creamos un objeto Tab (pestaña)
    const featureTabOpts_1 = {
      icon: "g-cartografia-pin", // icono para mostrar en la pestaña
      title: "Título de la pestaña", // título de la pestaña
      content: html, // contenido para mostrar
    };
    // Creamos el Popup
    var popup = new Popup();
    // Añadimos la pestaña al popup
    popup.addTab(featureTabOpts_1);
    // Finalmente se añade al mapa, especificando las coordenadas
    mapa.addPopup(popup, [240829, 4143088]);
  });

// featureTabOpts_2
// remoteGet(
//     "https://www.ign.es/wms-inspire/unidades-administrativas?QUERY_LAYERS=AU.AdministrativeBoundary&REQUEST=GetFeatureInfo&SERVICE=WMS&VERSION=1.3.0&FORMAT=image/png&STYLES=&TRANSPARENT=true&LAYERS=AU.AdministrativeBoundary&INFO_FORMAT=text/html&FEATURE_COUNT=99&BUFFER=10&I=50&J=50&WIDTH=101&HEIGHT=101&CRS=EPSG:3857&BBOX=-462665.40390169236,4936584.317271484,-454945.2640448896,4944304.457128286",
//     {}
//   )
//   .then(function (res) {
//     // Creamos un objeto Tab (pestaña)
//     const featureTabOpts_2 = {
//       icon: "g-cartografia-pin", // icono para mostrar en la pestaña
//       title: "Título de la pestaña", // título de la pestaña
//       content: res.text, // contenido para mostrar
//     };
//     // Creamos el Popup
//     var popup = new Popup();
//     // Añadimos la pestaña al popup
//     popup.addTab(featureTabOpts_2);
//     // Finalmente se añade al mapa, especificando las coordenadas
//     mapa.addPopup(popup, [240829, 4143088]);
//   });
