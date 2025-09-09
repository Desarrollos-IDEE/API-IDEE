import { map as Mmap } from 'IDEE/api-idee';

import WMS from 'IDEE/layer/WMS';

const mapa = Mmap({container: 'map'});

const wms = new WMS({
  url: 'https://www.ideandalucia.es/wms/mdt_2016?',
})

mapa.addLayers(wms);

console.log(mapa.getLayers());

window.mapa = mapa;
