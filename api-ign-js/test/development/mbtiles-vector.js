import { map } from 'M/mapea';
import { info } from 'M/dialog';
import MBTilesVector from 'M/layer/MBTilesVector';

const bbox = {
  x: { max: 37752.77805046586, min:-1127147.533015621},
  y: { max: 4827108.713010305, min:4246798.794269246}
}

const mapjs = map({
  container: 'map',
  bbox: bbox
});

function load() {
  const input = document.querySelector('#file-input');
  if (input.files.length > 0) {
    const file = input.files[0];
    const vectorLayer = new MBTilesVector({
      name: file.name,
      legend: file.name,
      source: file,
    });
    mapjs.addLayers(vectorLayer);
  } else {
    info('No hay fichero adjuntado.');
  }
}

document.body.onload = () => document.querySelector('#load-button').addEventListener('click', load);

window.map = mapjs;