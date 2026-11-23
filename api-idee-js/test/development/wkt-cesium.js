import { map as Mmap } from 'IDEE/api-idee';
import WKT from 'IDEE/format/WKT';
import Vector from 'IDEE/layer/Vector';

const mapjs = Mmap({
  container: 'map',
  center: [-4.5, 37.7],
  zoom: 6,
});
window.mapjs = mapjs;

const result = document.getElementById('result');
const log = (title, value) => {
  const text = typeof value === 'string' ? value : JSON.stringify(value);
  result.textContent += `${title}\n  ${text}\n\n`;
  // eslint-disable-next-line no-console
  console.log(title, value);
};

const format = new WKT();

// En Cesium las features se cargan de forma asíncrona: hay que esperar a que estén listas
const loaded = (...features) => Promise.all(features.flat().map((f) => f.getImpl().isLoadCesiumFeature_));

(async () => {

  // read: WKT -> Feature => Crea feature mediante read
  const feature = format.read('POLYGON ((-5 37, -4 37, -4 38, -5 38, -5 37))', { id: 'poligono' });
  window.feature = feature;
  await loaded(feature);
  log('read (id + geometría)', { id: feature.getId(), geometry: feature.getGeometry() });

  // read con reproyección: EPSG:3857 -> EPSG:4326 => Crea feature reproyectada
  const projected = format.read('POINT (-500000 4500000)', { dataProjection: 'EPSG:3857' });
  await loaded(projected);
  log('read con dataProjection EPSG:3857', projected.getGeometry());

  // readCollection: GEOMETRYCOLLECTION -> un Feature por geometría => Crea feature por geometría
  const features = format.readCollection(
    'GEOMETRYCOLLECTION (POINT (-6 37), LINESTRING (-6 36, -3 36))',
    { ids: ['punto', 'linea'] },
  );
  await loaded(features);
  log('readCollection', features.map((f) => `${f.getId()}: ${f.getGeometry().type}`));

  // write / writeCollection: Feature -> WKT
  log('write', format.write(feature));
  log('write (decimals: 1, EPSG:3857)', format.write(projected, { dataProjection: 'EPSG:3857', decimals: 1 }));
  log('writeCollection', format.writeCollection(features));

  // writeFeature: geometría GeoJSON -> WKT
  log('writeFeature', format.writeFeature({ type: 'MultiPoint', coordinates: [[-4, 37], [-3, 38]] }));

  // Se pintan las features leídas en el mapa
  const layer = new Vector({ name: 'wkt' });
  mapjs.addLayers(layer);
  layer.addFeatures([feature, ...features, projected]);
})();
