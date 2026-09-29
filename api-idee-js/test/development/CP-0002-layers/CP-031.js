import { map as Mmap } from 'IDEE/api-idee';
import GeoPackage from 'IDEE/layer/GeoPackage';
import Generic from 'IDEE/style/Generic';

const map = Mmap({
  container: 'map', layers: [], controls: [], center: [-350000, 4850000], zoom: 5,
});
const status = document.getElementById('status');
const gpkg = new GeoPackage({
  url: '/test/development/CP-0002-layers/data/geopackage-vector.gpkg',
  name: 'vector-demo',
  legend: 'GeoPackage solo vectorial',
}, {
  tables: {
    cities: {
      legend: 'Ciudades',
      style: new Generic({
        point: {
          radius: 9,
          fill: { color: '#e63946' },
          stroke: { color: '#7a0019', width: 3 },
        },
      }),
    },
    routes: {
      legend: 'Rutas',
      style: new Generic({
        line: { stroke: { color: '#6f2dbd', width: 5, linedash: [10, 8] } },
      }),
    },
    areas: {
      legend: 'Áreas',
      style: new Generic({
        polygon: {
          fill: { color: '#52b788', opacity: 0.55 },
          stroke: { color: '#176b3a', width: 3 },
        },
      }),
    },
  },
});

gpkg.whenReady().then(() => {
  map.addGeoPackage(gpkg);
  status.textContent = 'Cargadas cities, routes y areas con estilos específicos.';
}).catch((error) => {
  status.dataset.error = 'true';
  status.textContent = `Error: ${error.message || String(error)}`;
});

window.map = map;
window.geopackage = gpkg;
