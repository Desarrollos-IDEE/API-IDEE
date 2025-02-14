import { map, proxy } from 'M/mapea';
import KML from 'M/layer/KML';



proxy(false); // Desactiva el proxy para poder usar KML local



const mapjs = map({
  container: 'map',
  controls: ['scaleline', 'panzoombar', 'location', 'getfeatureinfo', 'rotate', 'backgroundlayers'],
  bbox: [-741439.1743662109, 4456431.623082354, -599801.3609537793, 4517428.371653925]
});

const kml = new KML({
  url: 'https://www.ign.es/web/resources/delegaciones/DelegacionesIGN-APICNIG.kml',
  name: "capaKML",
  extract: true,
  layers: ['Layer__0', 'Layer__1'] 
}); 
mapjs.addKML(kml);


// const LayerKml = new KML({
//   url: 'http://localhost:8080/test/development/layers/kmlFeatures.kml',
//   name: 'features',
//   extract: true
// }, {
//   //scaleLabel: 3
// });

// LayerKml.on(LOAD, () => {
//   // e = LayerKml.getFeatures()[0].getImpl().getOLFeature().getStyle()(LayerKml.getFeatures()[0].getImpl().getOLFeature());
//   // console.log(e)
//   const f = LayerKml.getFeatures()[0].getImpl().getOLFeature();
//   console.log(f.getStyle()(f).getText().getOffsetX());
// });

// mapjs.addKML(LayerKml);

window.mapjs = mapjs;

// window.Layer = LayerKml;
