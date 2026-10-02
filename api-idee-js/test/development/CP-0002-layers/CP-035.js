import { map as createMap, proxy } from 'IDEE/api-idee';
import FilterFunction from 'IDEE/filter/Function';
import Style from 'IDEE/style/Style';
import Generic from 'IDEE/style/Generic';
import Timeline from 'IDEE/control/Timeline';

proxy(false);
IDEE.config('baseLayer', []);
IDEE.config('terrain', { default: [] });
IDEE.config('CESIUM_URL', new URL('/cesium/', window.location.href).href);
const style = {
  point: { radius: 7, fill: { color: '#d04020' }, stroke: { color: '#ffffff', width: 2 } },
  line: { stroke: { color: '#005a9c', width: 4 } },
};
const configuration = {
  container: 'map',
  center: [-412305, 4926696],
  zoom: 13,
  controls: [],
  layers: [{
    type: 'GPX',
    name: 'CP-035 GPX',
    url: '/test/development/CP-0002-layers/fixtures/CP-035.gpx',
    style,
  }],
};
const mapa = createMap(JSON.parse(JSON.stringify(configuration)));
const capa = mapa.getGPX()[0];
window.mapa = mapa;
window.capa = capa;
const cesium = !!mapa.getMapImpl().scene;
const requestedTimeline = new URLSearchParams(window.location.search).get('timeline') === 'true';
const useTimeline = requestedTimeline && !cesium;
const temporalMode = document.getElementById('temporal-mode');
temporalMode.value = useTimeline ? 'timeline' : 'manual';
temporalMode.querySelector('option[value=timeline]').disabled = cesium;
temporalMode.onchange = () => {
  const url = new URL(window.location.href);
  url.searchParams.set('timeline', String(temporalMode.value === 'timeline'));
  window.location.assign(url.href);
};
document.getElementById('timeline-help').textContent = cesium
  ? 'Timeline no está implementado en Cesium en esta rama. Los estilos y el filtro manual sí se prueban aquí.'
  : 'Para probar el control real, elige Timeline y selecciona CP-035 GPX en su panel. '
    + 'Usa sus fechas de inicio y fin (ISO UTC) o sus barras; el selector de años solo prueba un filtro manual.';
if (useTimeline) {
  ['year', 'file', 'toggle', 'management'].forEach((id) => {
    document.getElementById(id).disabled = true;
  });
}
const status = document.getElementById('status');
const showStatus = () => {
  status.textContent = JSON.stringify({
    motor: cesium ? 'Cesium' : 'OpenLayers',
    temporal: useTimeline ? 'Timeline real' : 'Filtro manual',
    estiloIDEE: capa.getStyle() instanceof Style,
    estilo: document.getElementById('style').value,
    parametrosEstilo: capa.getStyle().getOptions(),
    gestion: document.getElementById('management').value,
    total: capa.getFeatures(true).length,
    visibles: capa.getFeatures().length,
    entidades: capa.getFeatures(true).map((feature) => ({
      id: feature.getId(),
      geometria: feature.getGeometry().type,
      atributos: feature.getAttributes(),
    })),
  }, null, 2);
};
// Timeline aplica su filtro en otros listeners LOAD del mismo evento.
capa.on('load', () => queueMicrotask(showStatus));
document.getElementById('reload').onclick = () => capa.refresh().then(showStatus);
document.getElementById('style').onchange = (event) => {
  const params = event.target.value === 'instance' ? {
    point: { radius: 11, fill: { color: '#16a34a' }, stroke: { color: '#ffffff', width: 2 } },
    line: { stroke: { color: '#c026d3', width: 6 } },
  } : JSON.parse(JSON.stringify(style));
  capa.setStyle(event.target.value === 'instance' ? new Generic(params) : params);
  showStatus();
};
if (useTimeline) {
  const timeline = new Timeline({
    timelineType: 'relative',
    animation: false,
    collapsible: false,
    collapsed: false,
    position: 'right',
    title: 'GPX: fechas del ejemplo',
    speedDate: 1,
    intervals: [{
      id: 'gpx',
      init: '2020-01-01T00:00:00Z',
      end: '2021-12-31T23:59:59Z',
      layer: capa,
      attributeParam: 'time',
    }],
  });
  window.timeline = timeline;
  mapa.addControls(timeline);
}
document.getElementById('toggle').onclick = () => {
  const useGPXMethods = document.getElementById('management').value === 'gpx';
  if (mapa.getGPX(capa).length > 0) {
    if (useGPXMethods) mapa.removeGPX(capa);
    else mapa.removeLayers(capa);
  } else if (useGPXMethods) mapa.addGPX(capa);
  else mapa.addLayers(capa);
};
document.getElementById('management').onchange = showStatus;
document.getElementById('year').onchange = (event) => {
  const year = event.target.value;
  if (!year) capa.removeFilter();
  else {
    capa.setFilter(new FilterFunction((feature) => (
      feature.getAttribute('time')?.startsWith(year)
    )));
  }
  showStatus();
};
document.getElementById('file').onchange = (event) => {
  const file = event.target.files[0];
  if (file) capa.setSource(file).then(showStatus);
};
