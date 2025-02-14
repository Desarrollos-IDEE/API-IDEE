import { map } from 'M/mapea';
import { info } from 'M/dialog';
import MBTilesVector from 'M/layer/MBTilesVector';

const bbox = {
  x: { max: 37752.77805046586, min:-1127147.533015621},
  y: { max: 4827108.713010305, min:4246798.794269246}
}

const mapjs = map({
  container: 'map',
  bbox: bbox,
  zoom: 7,
  maxZoom: 20,
});

function load() {
  const input = document.querySelector('#file-input');
    const files = Array.from(input.files);
    const layersFile = files.find(f => f.name === 'layers.mbtiles');
    const styleFile = files.find(f => f.name === 'style.json');

    if(layersFile && styleFile) {

      const vectorLayer = new MBTilesVector({
        name: layersFile.name,
        legend: layersFile.name,
        source: layersFile,
        style: styleFile
      });
      mapjs.addLayers(vectorLayer);

    } else {
      info('No se cargaron los ficheros necesarios.');
    }

}

document.body.onload = () => document.querySelector('#load-button').addEventListener('click', load);

window.map = mapjs;