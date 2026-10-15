import { map as Mmap } from 'IDEE/api-idee';
import GeoPackage from 'IDEE/layer/GeoPackage';
import Generic from 'IDEE/style/Generic';
import { LOAD } from 'IDEE/event/eventtype';

const DATA_URL = '/test/development/CP-0002-layers/data/geopackage-mixed.gpkg';
const map = Mmap({
  container: 'map', layers: [], controls: [], center: [0, 0], zoom: 5,
});
const tiledInput = document.getElementById('tiled');
const status = document.getElementById('status');
let currentPackage;
let loadSequence = 0;

const placeStyle = new Generic({
  point: {
    radius: 10,
    fill: { color: '#00a6d6' },
    stroke: { color: '#003f5c', width: 3 },
  },
});

const updateStatus = (layer, tiled) => {
  const names = layer.getFeatures().map((feature) => feature.getAttribute('title')).sort();
  status.dataset.error = 'false';
  status.textContent = `${tiled ? 'Tiled/BBOX' : 'Carga completa'}: ${names.length} entidades cargadas${names.length ? ` (${names.join(', ')})` : ''}. El ráster imagery está activo.`;
};

const loadPackage = async () => {
  loadSequence += 1;
  const sequence = loadSequence;
  const tiled = tiledInput.checked;
  tiledInput.disabled = true;
  status.dataset.error = 'false';
  status.textContent = `Creando GeoPackage en modo ${tiled ? 'tiled/BBOX' : 'completo'}…`;
  try {
    if (currentPackage) map.removeGeoPackage(currentPackage);
    const gpkg = new GeoPackage({
      url: DATA_URL,
      name: 'mixed-demo',
      legend: 'GeoPackage mixto',
      tiled,
    }, {
      tables: {
        places: { legend: 'Lugares', style: placeStyle },
        imagery: { legend: 'Tesela ráster', opacity: 0.45 },
      },
    });
    await gpkg.whenReady();
    if (sequence !== loadSequence) return;
    const places = gpkg.getLayer('places');
    places.on(LOAD, () => updateStatus(places, tiled));
    currentPackage = gpkg;
    map.addGeoPackage(gpkg);
    window.geopackage = gpkg;
  } catch (error) {
    status.dataset.error = 'true';
    status.textContent = `Error: ${error.message || String(error)}`;
  } finally {
    if (sequence === loadSequence) tiledInput.disabled = false;
  }
};

tiledInput.addEventListener('change', loadPackage);
document.querySelectorAll('[data-center]').forEach((button) => {
  button.addEventListener('click', () => {
    const center = button.dataset.center.split(',').map(Number);
    map.setCenter(center);
  });
});

window.map = map;
loadPackage();
