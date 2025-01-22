/* eslint-disable no-console */
import SelectionDraw from 'facade/selectiondraw';

const map = IDEE.map({
  container: 'mapjs',
});
const mp = new SelectionDraw({
  projection: 'EPSG:4326',
});
mp.on('finished:draw', (feature) => {
  console.log(feature);
});
map.addPlugin(mp);
window.map = map;
