import { map as Mmap } from 'IDEE/api-idee';
import GeoPackage from 'IDEE/layer/GeoPackage';

const map = Mmap({
  container: 'map', layers: [], controls: [], center: [0, 0], zoom: 1,
});
const status = document.getElementById('status');
const gpkg = new GeoPackage({
  url: '/test/development/CP-0002-layers/data/geopackage-raster.gpkg',
  name: 'raster-demo',
  legend: 'GeoPackage solo ráster',
}, {
  tables: {
    imagery: { legend: 'Cuadrícula azul de demostración', opacity: 0.8 },
  },
});

gpkg.whenReady().then(() => {
  map.addGeoPackage(gpkg);
  status.textContent = 'Cargada la tabla ráster imagery con opacidad 0,8.';
}).catch((error) => {
  status.dataset.error = 'true';
  status.textContent = `Error: ${error.message || String(error)}`;
});

window.map = map;
window.geopackage = gpkg;
