import { map as Mmap } from 'IDEE/api-idee';
import GeoPackage from 'IDEE/layer/GeoPackage';
import Generic from 'IDEE/style/Generic';

const mapa = Mmap({
  container: 'map', layers: [], controls: [], center: [0, 0], zoom: 2,
});
window.map = mapa;
window.geopackages = [];

const form = document.getElementById('geopackage-form');
const inputs = document.getElementById('inputs');
const sourceKind = document.getElementById('source-kind');
const fileInput = document.getElementById('source-file');
const urlInput = document.getElementById('source-url');
const status = document.getElementById('status');
let loading = false;

/** Alterna fuentes sin borrar los datos introducidos. */
const updateSource = () => {
  const local = sourceKind.value === 'file';
  document.getElementById('file-field').hidden = !local;
  document.getElementById('url-field').hidden = local;
  fileInput.disabled = !local;
  fileInput.required = local;
  urlInput.disabled = local;
  urlInput.required = !local;
};

/** Valida registros JSON y convierte los estilos sin ejecutar código del usuario. */
const readTables = () => {
  const tables = JSON.parse(document.getElementById('table-options').value, (key, value) => {
    if (['__proto__', 'constructor', 'prototype'].includes(key)) {
      throw new Error(`La clave ${key} no está admitida en este formulario.`);
    }
    return value;
  });
  const isRecord = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
  if (!isRecord(tables)) throw new Error('Las opciones por tabla deben ser un objeto JSON.');
  return Object.fromEntries(Object.entries(tables).map(([table, options]) => {
    if (!isRecord(options)) throw new Error('Cada tabla debe contener un objeto de opciones.');
    if (options.opacity !== undefined && (typeof options.opacity !== 'number'
      || options.opacity < 0 || options.opacity > 1)) {
      throw new Error('La opacidad por tabla debe ser un número entre 0 y 1.');
    }
    if (options.visibility !== undefined && typeof options.visibility !== 'boolean') {
      throw new Error('La visibilidad por tabla debe ser true o false.');
    }
    const normalized = { ...options };
    if (options.style !== undefined) {
      if (!isRecord(options.style)) throw new Error('El estilo debe ser un objeto de IDEE.style.Generic.');
      // La conversión solo afecta al JSON recién leído, no al texto del formulario.
      normalized.style = new Generic(options.style);
    }
    return [table, normalized];
  }));
};

sourceKind.addEventListener('change', updateSource);
form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (loading || !form.reportValidity()) return;
  status.dataset.error = 'false';
  try {
    const parameters = {
      name: document.getElementById('package-name').value.trim(),
      legend: document.getElementById('package-legend').value,
    };
    if (!parameters.name) throw new Error('Introduce un nombre de paquete.');
    if (sourceKind.value === 'file') {
      [parameters.source] = fileInput.files;
      if (!parameters.source) throw new Error('Selecciona un archivo GeoPackage.');
    } else {
      const url = new URL(urlInput.value.trim(), window.location.href);
      if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
        throw new Error('Utiliza una URL HTTP(S) sin credenciales.');
      }
      parameters.url = url.href;
    }
    const options = {
      opacity: document.getElementById('opacity').valueAsNumber,
      visibility: document.getElementById('visibility').checked,
      tables: readTables(),
    };
    loading = true;
    inputs.disabled = true;
    form.setAttribute('aria-busy', 'true');
    status.textContent = 'Cargando el fichero y construyendo las capas…';
    const gpkg = new GeoPackage(parameters, options);
    await gpkg.whenReady();
    mapa.addGeoPackage(gpkg);
    window.geopackages.push(gpkg);
    const item = document.createElement('li');
    const layers = gpkg.getLayers();
    item.textContent = `${gpkg.name}: ${layers.length} tablas. ${layers.map((layer) => `${layer.name} (${layer.type})`).join('; ')}`;
    document.getElementById('empty-state')?.remove();
    document.getElementById('packages').appendChild(item);
    status.textContent = 'Paquete inicializado y enviado al mapa. whenReady() no espera al renderizado.';
  } catch (error) {
    status.dataset.error = 'true';
    status.textContent = `Error: ${error.message || String(error)}`;
  } finally {
    loading = false;
    inputs.disabled = false;
    form.removeAttribute('aria-busy');
    updateSource();
  }
});

inputs.disabled = false;
updateSource();
status.textContent = 'Selecciona un archivo o una URL para comenzar.';
