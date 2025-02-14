import { map as Mmap } from 'M/mapea';

import WMS from 'M/layer/WMS';

const mapa = Mmap({container: 'map'});

const wms = new WMS({
  url: 'https://www.ideandalucia.es/wms/mdt_2016?',
})

mapa.addLayers(wms);

console.log(mapa.getLayers());

window.mapa = mapa;
