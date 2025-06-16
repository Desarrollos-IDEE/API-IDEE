/* eslint-disable no-console */
import { map as Mmap, version } from 'IDEE/api-idee';
//  import { CHANGE_ROTATION } from '../../src/facade/js/event/eventtype';

// eslint-disable-next-line no-unused-vars
const mapajs = Mmap({
  container: 'map',
  getfeatureinfo: 'plain',
  controls: ['location', 'attributions', 'rotate'],
  projection: 'EPSG:3857*m',
});

console.log(`Version: ${version}`);

/* mapajs.on(CHANGE_ROTATION, () => {
  console.log(`trigger - ${mapajs.getRotation()}`);
  console.log(`trigger - ${mapajs.getMapImpl().getView().getRotation()}`);
});

mapajs.setRotation(7);
console.log(mapajs.getRotation());
console.log(mapajs.getMapImpl().getView().getRotation()); */
