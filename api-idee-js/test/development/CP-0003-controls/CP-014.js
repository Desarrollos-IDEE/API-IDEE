/* eslint-disable max-len */
/* eslint-disable no-unused-vars */
/* eslint-disable no-param-reassign */
/* eslint-disable no-use-before-define */
/* eslint-disable no-console */
import { map as Mmap } from 'IDEE/api-idee';
import Timeline from 'IDEE/control/Timeline';
import WMS from 'IDEE/layer/WMS';
import Vector from 'IDEE/layer/Vector';
import Feature from 'IDEE/feature/Feature';
import * as EventType from 'IDEE/event/eventtype';
import { setLang } from '../../../src/facade/js/i18n/language';

const urlParams = new URLSearchParams(window.location.search);
const ROUTES = {
  guadarrama: '/test/development/CP-0003-controls/fixtures/ruta-guadarrama.gpx',
  penalara: '/test/development/CP-0003-controls/fixtures/ruta-penalara.gpx',
};
const ROUTE_INTERVALS = [
  {
    id: 'guadarrama',
    init: '2021-06-05T08:00:00Z',
    end: '2021-06-05T13:20:00Z',
    layer: 'ruta_guadarrama',
    attributeParam: 'time',
  },
  {
    id: 'penalara',
    init: '2021-07-10T09:00:00Z',
    end: '2021-07-10T12:00:00Z',
    layer: 'ruta_penalara',
    attributeParam: 'time',
  },
];
const TRACK_EXAMPLES = {
  guadarrama: { layer: 'ruta_guadarrama', feature: 'trk-4' },
  variante: { layer: 'ruta_guadarrama', feature: 'trk-5' },
  waypoints: { layer: 'ruta_guadarrama', feature: ['wpt-0', 'wpt-1', 'wpt-2', 'wpt-3'] },
  penalara: { layer: 'ruta_penalara', feature: 'trk-4' },
  penalaraRte: { layer: 'ruta_penalara', feature: 'rte-3' },
  vectorPuntos: { layer: 'vector_sin_tiempo', feature: ['p1', 'p2', 'p3', 'p4', 'p5'] },
  vectorLinea: { layer: 'vector_sin_tiempo', feature: 'l1' },
};

const toMercator = ([lon, lat]) => [
  (lon * 20037508.34) / 180,
  ((Math.log(Math.tan(((90 + lat) * Math.PI) / 360)) / (Math.PI / 180)) * 20037508.34) / 180,
];

// base64 de UTF-8, como espera parseUrlParams (base64~).
const toBase64 = (value) => {
  let binary = '';
  new TextEncoder().encode(JSON.stringify(value)).forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return window.btoa(binary);
};

setLang(urlParams.get('language') || 'es');
// Modo manual por defecto: sin `demo`, `layers` ni `controls` (o con mode=manual).
const manual = urlParams.get('mode') === 'manual'
  || !['demo', 'layers', 'controls'].some((key) => urlParams.has(key));

/*
 * Modo de apertura
 * ----------------
 * Sin query string la página abre el modo manual: formulario con todas las opciones del
 * control (new Timeline(...)). El selector "Modo de apertura" de la fila de botones
 * cambia a los escenarios GET (?demo=relative|absolute|absoluteSimple|track|recorridos) y vuelve al
 * manual; conserva el parámetro `language`.
 *
 * Escenario GET (?demo=...)
 * -------------------------
 * Réplica del recorrido de api-idee-rest (BuilderWS.detectKeyValueLayers/Controls y
 * JSBuilder): `layers` y `controls` se separan por comas y cada entrada llega como cadena
 * a IDEE.map({ layers, controls }). El resto de parámetros (center, zoom, projection)
 * pasan como cadenas. Las cadenas las interpretan los parsers generales de la API
 * (parameter.gpx, buildControl, parseUrlParams con base64~): aquí no se crea ningún GPX
 * ni ningún Timeline.
 * : capas y control por parámetros GET reales (GPX), selector de capas por posición y filtrado temporal.

    npm start -- --name=CP-0003-controls/CP-014

Se ejecuta en `api-idee-js` o en cualquiera de sus subcarpetas, como `test/development`.
Abre `test/development/CP-0003-controls/CP-014.html` sin query string, en modo manual; los escenarios GET se eligen en "Modo de apertura".

**Arranque GET.** Con `?demo=...` y antes de cargar la API, la página navega con `location.replace()` a una URL GET real. Al crear el mapa, los parámetros ya están en `window.location.search`:

- `layers`:
  - `QUICK*Base_IGNBaseTodo_TMS`: base de referencia, externa y no elegible.
  - `GPX*gpx_nombre*…/CP-035.gpx*true*true`
  - `GPX*gpx_definicion*…/CP-035.gpx*true*true`

  Las dos GPX usan el fixture local `test/development/CP-0002-layers/fixtures/CP-035.gpx`.
- `controls`: `timeline*timelineType=relative;…;layerPosition=2;intervals=base64~…`, con tres intervalos:
  - `gpx_nombre`: referencia por nombre a una capa existente, con rango 2020-2021.
  - `GPX*gpx_definicion*…`: definición `*` de una capa existente, que se reutiliza; rango 2020.
  - `GPX*gpx_creada*…`: definición `*` que no está en `layers`; Timeline la crea al seleccionarla. Rango 2021.
- `center` y `zoom`.

`CP-014.js` hace lo mismo que api-idee-rest (BuilderWS): separa `layers` y `controls` por comas y pasa las cadenas a `IDEE.map`. El GPX lo crea el parser general (`parameter.gpx`) y el Timeline, `buildControl`. En el escenario GET no hay `new GPX` ni `new Timeline`.

**Qué se comprueba**

- **Selector:** ordenado por posición en el visualizador (`[1] gpx_definicion`, `[2] gpx_nombre`, `gpx_creada`).
- **Selección inicial:** `gpx_nombre` (`layerPosition=2`). Se activa y las demás capas referenciadas se ocultan.
- **Filtrado temporal por el atributo `time` del GPX:**
  - con 2020-2021 se ven 4 entidades;
  - con 2020, `wpt-0` y `rte-2`;
  - con 2021, `wpt-1` y `trk-3`.
- **Cambio de capa:** con el selector del control o con el botón "Seleccionar siguiente capa".
- **Navegación:** deslizadores, fechas (Enter o al salir del campo), retroceso, play/pausa, avance y selector de velocidad (pasos de un mes, `paramsDate=mos`; `speedDate=1` preselecciona ×2). En relative el inicio queda fijo y la reproducción amplía el fin.
- **Ciclo de vida:** "Retirar Timeline" restaura las capas y elimina la creada. "Volver a añadir el mismo Timeline" vuelve a añadir la misma instancia.

**Modalidades y URL propias**

- `?demo=absolute` y `?demo=absoluteSimple` aplican el mismo recorrido GET a las otras modalidades. En `absoluteSimple` cada paso muestra u oculta una GPX.
- `?demo=track`: `timelineType=track` con dos rutas GPX por GET (`ruta_guadarrama`, `ruta_penalara`). `layerPosition=2` elige `ruta_guadarrama` y su primera línea con fechas, `trk-4` (tres segmentos). Muestra: recorrido completo y realizado, marcador orientado, progreso, perfil sincronizado, capa y objeto (líneas, todos los puntos o los elegidos en el mapa), `speed=0.5`.
- `?demo=recorridos`: `relative` con las dos rutas (pasos de 10 min) y `track=base64~{"layer":"ruta_guadarrama","feature":"trk-4"}`: el recorrido complementario se sincroniza con el rango.
- Si la URL ya trae `layers` o `controls`, se respeta y no se redirige. `intervals` debe ir en base64, porque las comas del JSON se interpretarían como separadores.
- El modo manual (sin query string o `?mode=manual`) es el formulario programático, que usa `new Timeline(...)`: idioma, posición, orden, tooltip, título, colapsado, tipo (también `track`), `layerPosition`, `animation`, recorrido inicial `track` (GPX trk con y sin fechas, wpt, rte y una capa vectorial sin tiempos), intervalos (ejemplos WMS y GPX o JSON propio), `speed`/`speedDate`, `snapMode`, `paramsDate`, `stepValue`, tamaño, escala y `formatMove`. El mapa incluye las dos rutas GPX y la capa vectorial como fuentes de recorrido. "Eliminar control" lo retira y, pulsado de nuevo, lo crea con las opciones del formulario. No demuestra el recorrido GET.

**Depuración**

- En `window` están `mapa`, `timeline` (el control creado por GET) y `capasGPX`.
- `cp014.estado()` devuelve:
  - los parámetros GET, con los intervalos decodificados;
  - `builderParams`;
  - las capas por posición, con tipo, visibilidad y si son elegibles;
  - la capa seleccionada;
  - el rango (`timeline.date`) y la reproducción;
  - las entidades cargadas y visibles de cada GPX.

  El mismo estado aparece en el panel de la página y en la consola cada vez que cambia.
- La configuración de desarrollo (`eval-source-map`, recarga en caliente) permite depurar `src/facade/js/control/Timeline.js` en las DevTools.
 */

/*
 * CP-014 · Timeline por parámetros GET.
 *
 * `npm start -- --name=CP-0003-controls/CP-014` abre la página sin query string, en
 * modo manual. Con `?demo=...`, antes de crear el mapa se navega (location.replace) a
 * una URL GET real con
 * `layers` (dos GPX locales y una base de referencia) y `controls` (Timeline con
 * `intervals` en base64). Así, al crear el mapa, los parámetros están en
 * window.location.search y los interpretan los parsers generales de la API.
 *
 * No se redirige si la URL ya trae `layers` o `controls` (URL propia) ni en el modo
 * manual (sin `demo`). `demo` elige la modalidad: relative, absolute, absoluteSimple, track
 * o recorridos (relative con recorrido sincronizado).
 *
 * Devuelve true si redirige; en ese caso no debe crearse el mapa.
 */
const prepareTimelineGetDemo = () => {
  const params = new URLSearchParams(urlParams);
  document.documentElement.dataset.cp014 = manual ? 'manual' : 'get';
  if (manual || params.has('layers') || params.has('controls')) return false;

  const gpx = '/test/development/CP-0002-layers/fixtures/CP-035.gpx';
  const demo = ['relative', 'absolute', 'absoluteSimple', 'recorridos', 'track'].includes(params.get('demo'))
    ? params.get('demo') : 'relative';
  if (demo === 'recorridos' || demo === 'track') {
    params.set('demo', demo);
    params.set('layers', [
      'QUICK*Base_IGNBaseTodo_TMS',
      `GPX*ruta_guadarrama*${ROUTES.guadarrama}*true*true`,
      `GPX*ruta_penalara*${ROUTES.penalara}*true*true`,
    ].join(','));
    const common = ['collapsible=false', 'collapsed=false', 'position=right', 'sizeWidthDinamic=sizeWidthDinamic_medium'];
    const options = demo === 'track'
      ? ['timelineType=track', ...common, 'layerPosition=2', 'speed=0.5']
      : [
        'timelineType=relative',
        ...common,
        'layerPosition=2',
        'paramsDate=min',
        'stepValue=10',
        'speedDate=1',
        `intervals=base64~${toBase64(ROUTE_INTERVALS)}`,
        `track=base64~${toBase64(TRACK_EXAMPLES.guadarrama)}`,
      ];
    params.set('controls', `timeline*${options.join(';')}`);
    params.set('center', '-445835,4982151');
    params.set('zoom', '12');
    window.location.replace(`${window.location.pathname}?${params.toString()}${window.location.hash}`);
    return true;
  }

  // Capas del visualizador (orden del parámetro = orden de incorporación).
  // Posiciones resultantes (1 = superior): 1 gpx_definicion, 2 gpx_nombre, 3 base.
  const layers = [
    'QUICK*Base_IGNBaseTodo_TMS',
    `GPX*gpx_nombre*${gpx}*true*true`,
    `GPX*gpx_definicion*${gpx}*true*true`,
  ];

  // gpx_nombre: referencia por nombre a una capa existente.
  // gpx_definicion: definición "*" que coincide con una capa existente (se reutiliza).
  // gpx_creada: definición "*" que no está en `layers` (Timeline la crea).
  const intervals = demo === 'absoluteSimple' ? [
    ['GPX por nombre', '2020', 'gpx_nombre'],
    ['GPX por definición', '2021', `GPX*gpx_definicion*${gpx}*true*true`],
    ['GPX creada', '2022', `GPX*gpx_creada*${gpx}*true*true`],
  ] : [
    {
      id: 'por-nombre',
      init: '2020-01-01T00:00:00Z',
      end: '2021-12-31T23:59:59Z',
      layer: 'gpx_nombre',
      attributeParam: 'time',
    },
    {
      id: 'por-definicion',
      init: '2020-01-01T00:00:00Z',
      end: '2020-12-31T23:59:59Z',
      layer: `GPX*gpx_definicion*${gpx}*true*true`,
      attributeParam: 'time',
    },
    {
      id: 'creada',
      init: '2021-01-01T00:00:00Z',
      end: '2021-12-31T23:59:59Z',
      layer: `GPX*gpx_creada*${gpx}*true*true`,
      attributeParam: 'time',
    },
  ];

  const timelineOptions = [
    `timelineType=${demo}`,
    'collapsible=false',
    'collapsed=false',
    'position=right',
    'layerPosition=2',
    'sizeWidthDinamic=sizeWidthDinamic_medium',
    'paramsDate=mos',
    'stepValue=1',
    'speedDate=1',
    `intervals=base64~${toBase64(intervals)}`,
  ];

  params.set('demo', demo);
  params.set('layers', layers.join(','));
  params.set('controls', `timeline*${timelineOptions.join(';')}`);
  // Centro desplazado al este para que el panel (a la derecha) no tape el GPX.
  params.set('center', '-407000,4928393');
  params.set('zoom', '13');
  window.location.replace(`${window.location.pathname}?${params.toString()}${window.location.hash}`);
  return true;
};

const splitEntries = (value) => (value ?? '').split(',')
  .map((entry) => entry.trim())
  .filter((entry) => entry !== '');

const getMapParametersFromUrl = () => {
  const parameters = { container: 'map' };
  ['center', 'zoom', 'projection'].forEach((key) => {
    if (urlParams.has(key)) parameters[key] = urlParams.get(key);
  });
  const layers = splitEntries(urlParams.get('layers'));
  const controls = splitEntries(urlParams.get('controls'));
  if (layers.length > 0) parameters.layers = layers;
  if (controls.length > 0) parameters.controls = controls;
  return parameters;
};

const decodeBase64Utf8 = (text) => {
  const binary = window.atob(text);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder('utf-8').decode(bytes);
};

/*
 * Selector de escenario: marca el actual y, al cambiar, navega a ?demo=<modalidad> o a
 * ?mode=manual. En los escenarios GET, prepareTimelineGetDemo completa después la URL.
 */
const setupScenarioSelector = () => {
  const select = document.getElementById('cp014-scenario');
  const demo = urlParams.get('demo');
  if (manual) {
    select.value = 'manual';
  } else if (demo && [...select.options].some((option) => option.value === demo)) {
    select.value = demo;
  } else {
    const custom = document.createElement('option');
    custom.textContent = 'URL GET personalizada';
    custom.disabled = true;
    select.prepend(custom);
    select.selectedIndex = 0;
  }
  select.addEventListener('change', () => {
    const params = new URLSearchParams();
    if (select.value !== 'manual') params.set('demo', select.value);
    if (urlParams.has('language')) params.set('language', urlParams.get('language'));
    const query = params.toString();
    window.location.assign(`${window.location.pathname}${query ? `?${query}` : ''}`);
  });
};

// Solo para mostrarlas: abrevia la ruta del fixture GPX.
const shortenPath = (text) => text.replace(/\/test\/development\/CP-000[23]-[a-z]+\/fixtures\//g, '…/');

// Solo para mostrarlo: recorta el base64 de intervals.
const shortenControl = (control) => control
  .replace(/base64~([^;]+)/, (match, base64) => `base64~${base64.slice(0, 8)}… (${base64.length} car.)`);

// Solo para el diagnóstico: los intervalos tal y como viajan en la URL, una línea cada uno.
const decodeIntervalsParam = (controls) => controls.flatMap((control) => {
  const match = control.match(/intervals=base64~([^;]+)/);
  if (!match) return [];
  try {
    return JSON.parse(decodeBase64Utf8(match[1])).map((interval) => (Array.isArray(interval)
      ? interval.map((value) => shortenPath(`${value}`)).join(' · ')
      : `${interval.id} · ${shortenPath(`${interval.layer ?? interval.service}`)} · ${interval.init} → ${interval.end} · ${interval.attributeParam}`));
  } catch (error) {
    return [`No se pudo decodificar: ${error}`];
  }
});

// Orden del visualizador como lo muestra el LayerSwitcher (1 = capa superior).
const getViewerLayers = (mapa) => mapa.getLayers()
  .filter((layer) => layer.name !== '__draw__' && layer.displayInLayerSwitcher !== false)
  .map((layer, index) => ({ layer, index, zIndex: Number(layer.getZIndex()) || 0 }))
  .sort((a, b) => (b.zIndex - a.zIndex) || (b.index - a.index))
  .map(({ layer }) => layer);

const toISO = (time) => (Number.isFinite(time) && time !== 0 ? new Date(time).toISOString() : time);

const startGetScenario = () => {
  const parameters = getMapParametersFromUrl();
  const mapa = Mmap(parameters);
  const timeline = mapa.getControls(Timeline.NAME)[0];

  // Referencias para depurar desde la consola (obtenidas con la API pública).
  window.mapa = mapa;
  window.timeline = timeline;
  window.capasGPX = mapa.getGPX();

  // Velocidad elegida en el selector del panel y segundos por paso que usa la reproducción.
  const getSpeedText = (control) => {
    const option = control.getElement()?.querySelector('.m-timeline-speed')?.selectedOptions[0];
    const seconds = ['absoluteSimple', 'track'].includes(control.timelineType) ? control.speed : control.speedDate;
    return `${option?.textContent ?? '–'} (${Number(seconds)} s/paso)`;
  };

  // Estado compacto (una línea por elemento). El detalle completo está en window.mapa,
  // window.timeline y window.capasGPX.
  const describeTrack = (track) => {
    if (!track) return 'sin recorrido';
    const time = track.time !== null ? ` · ${new Date(track.time).toISOString()}` : '';
    return [
      `${track.label} (${track.kind}, ${track.timed ? 'temporal' : 'secuencial'})`,
      `paso ${track.step}/${track.steps}${time}`,
      `segmento ${track.segment === null ? '–' : track.segment + 1}`,
      `${Math.round(track.fraction * 100)} %`,
      track.synchronized ? 'sincronizado' : 'sin sincronizar',
    ].join(' · ');
  };

  const getState = () => {
    const timelineLayers = timeline ? timeline.getLayers() : [];
    // Opciones interpretadas por buildControl, solo las que vienen en `controls` y sin intervals.
    const controlsText = (parameters.controls ?? []).join(';');
    const getOptions = Object.fromEntries(Object.entries(timeline?.builderParams ?? {})
      .filter(([key]) => key !== 'intervals' && controlsText.includes(`${key}=`)));
    return {
      get: {
        layers: (parameters.layers ?? []).map(shortenPath),
        controls: (parameters.controls ?? []).map(shortenControl),
        intervals: decodeIntervalsParam(parameters.controls ?? []),
        vista: `${parameters.center ?? '-'} · zoom ${parameters.zoom ?? '-'}`,
      },
      timeline: timeline ? {
        opciones: JSON.stringify(getOptions),
        seleccionada: timeline.getSelectedLayer()?.name ?? null,
        rango: `${toISO(timeline.date.init)} → ${toISO(timeline.date.end)}`,
        reproduciendo: timeline.running !== false,
        velocidad: getSpeedText(timeline),
        movimiento: (timeline.formatMove === 'discrete' && 'inicio fijo') || 'ventana deslizante',
        recorrido: describeTrack(timeline.getTrack()),
      } : 'No hay Timeline en el mapa',
      selector: timeline ? timeline.getSelectableLayers().map((entry) => [
        entry.position ? `[${entry.position}]` : '[–]',
        entry.name,
        entry.selected ? '✓' : '',
      ].join(' ').trim()) : [],
      visualizador: getViewerLayers(mapa).map((layer, index) => [
        index + 1,
        layer.name,
        layer.type,
        layer.isVisible() ? 'visible' : 'oculta',
        timelineLayers.includes(layer) ? 'Timeline' : '',
        timeline?.isValidLayer(layer) ? 'elegible' : 'no elegible',
      ].filter((value) => value !== '').join(' · ')),
      gpx: mapa.getGPX().map((layer) => `${layer.name}: ${layer.getFeatures().length}/${layer.getFeatures(true).length} visibles`
        + ` (${layer.getFeatures().map((feature) => feature.getId()).join(', ')})`),
    };
  };

  // Texto del panel: una línea por elemento (la consola recibe el objeto).
  const formatState = (state) => {
    const list = (items) => items.map((item) => `  ${item}`);
    const t = state.timeline;
    return [
      `GET layers: ${state.get.layers.join(' | ')}`,
      `GET controls: ${state.get.controls.join(' | ')}`,
      `GET vista: ${state.get.vista}`,
      'Intervalos (base64 decodificado):',
      ...list(state.get.intervals),
      typeof t === 'string' ? t
        : `Timeline: ${t.seleccionada ?? 'sin capa'} · ${t.rango} · ${t.reproduciendo ? 'reproduciendo' : 'parado'} · ${t.velocidad} · ${t.movimiento}`,
      typeof t === 'string' ? '' : `  opciones GET: ${t.opciones}`,
      typeof t === 'string' ? '' : `  recorrido: ${t.recorrido}`,
      `Selector: ${state.selector.join(' | ')}`,
      'Visualizador (1 = superior):',
      ...list(state.visualizador),
      'GPX:',
      ...list(state.gpx),
    ].filter((line) => line !== '').join('\n');
  };

  const output = document.getElementById('cp014-diagnostics');
  let last = '';
  const render = (log = false) => {
    const state = getState();
    const text = formatState(state);
    output.textContent = text;
    if (log || text !== last) {
      console.groupCollapsed('[CP-014] Estado de Timeline');
      console.log(state);
      console.groupEnd();
    }
    last = text;
  };
  window.cp014 = { estado: getState, refrescar: () => render(true) };

  const scheduleRender = () => queueMicrotask(render);
  if (timeline) timeline.on(EventType.CHANGE, scheduleRender);
  mapa.on(EventType.ADDED_LAYER, (layers) => {
    [].concat(layers).forEach((layer) => layer?.on?.(EventType.LOAD, scheduleRender));
    scheduleRender();
  });
  mapa.on(EventType.REMOVED_LAYER, scheduleRender);
  mapa.getGPX().forEach((layer) => layer.on(EventType.LOAD, scheduleRender));
  // Respaldo para cambios sin evento (p. ej. visibilidad desde el LayerSwitcher).
  setInterval(render, 1500);

  document.getElementById('cp014-refresh').addEventListener('click', () => render(true));
  document.getElementById('cp014-next').addEventListener('click', () => {
    const entries = timeline.getSelectableLayers();
    const index = entries.findIndex((entry) => entry.selected);
    const next = entries[(index + 1) % entries.length];
    if (next) timeline.selectLayer(next.id);
  });
  document.getElementById('cp014-remove').addEventListener('click', () => {
    if (mapa.getControls(Timeline.NAME).length > 0) mapa.removeControls(timeline);
    scheduleRender();
  });
  document.getElementById('cp014-add').addEventListener('click', () => {
    if (mapa.getControls(Timeline.NAME).length === 0) mapa.addControls(timeline);
    scheduleRender();
  });
  render(true);
};

/*
 * Modo manual (por defecto)
 * -------------------------
 * Formulario programático: crea el Timeline con `new Timeline(...)` a partir de los
 * campos (los vacíos no se pasan y el control usa su valor por defecto) y lo recrea al
 * cambiar cualquiera. No demuestra el recorrido GET.
 */
const startManualScenario = () => {
  const map = Mmap({
    container: 'map',
    controls: ['rotate'],
    projection: 'EPSG:3857',
    center: [-445835, 4982151],
    zoom: 11,
  });
  window.mapa = map;

  map.addLayers([
    `GPX*ruta_guadarrama*${ROUTES.guadarrama}*true*true`,
    `GPX*ruta_penalara*${ROUTES.penalara}*true*true`,
  ]);
  const vectorLayer = new Vector({ name: 'vector_sin_tiempo', legend: 'Vector sin tiempos' });
  map.addLayers(vectorLayer);
  vectorLayer.addFeatures([
    [-4.035, 40.765], [-4.015, 40.772], [-3.995, 40.769], [-3.978, 40.776], [-3.962, 40.784],
  ].map((point, index) => new Feature(`p${index + 1}`, {
    type: 'Feature',
    geometry: { type: 'Point', coordinates: toMercator(point) },
    properties: { name: `Punto ${index + 1}` },
  })).concat(new Feature('l1', {
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates: [[-4.05, 40.745], [-4.03, 40.752], [-4.01, 40.748], [-3.99, 40.756], [-3.97, 40.751]]
        .map(toMercator),
    },
    properties: { name: 'Línea sin tiempos' },
  })));

  const create = (options) => {
    if (!map.hasControl(Timeline.NAME)) {
      const timeline = new Timeline(options);
      window.timeline = timeline;
      map.addControls(timeline);
    }
  };

  const remove = () => {
    const ctrls = map.getControls(Timeline.NAME);
    if (ctrls.length === 1) map.removeControls(ctrls);
  };

  const nacional1981Layer = new WMS({
    name: 'NACIONAL_1981-1986',
    legend: 'NACIONAL 1981-1986',
    url: 'https://www.ign.es/wms/pnoa-historico',
  });

  const olistatLayer = new WMS({
    name: 'OLISTAT',
    legend: 'OLISTAT',
    url: 'https://www.ign.es/wms/pnoa-historico',
  });

  const sigpacLayer = new WMS({
    name: 'SIGPAC',
    legend: 'SIGPAC',
    url: 'https://www.ign.es/wms/pnoa-historico',
  });

  const pnoa2004Layer = new WMS({
    name: 'pnoa2004',
    legend: 'PNOA 2004',
    url: 'https://www.ign.es/wms/pnoa-historico',
  });

  const pnoa2005Layer = new WMS({
    name: 'pnoa2005',
    legend: 'PNOA 2005',
    url: 'https://www.ign.es/wms/pnoa-historico',
  });

  const pnoa2006Layer = new WMS({
    name: 'pnoa2006',
    legend: 'PNOA 2006',
    url: 'https://www.ign.es/wms/pnoa-historico',
  });

  const pnoa2010Layer = new WMS({
    name: 'pnoa2010',
    legend: 'PNOA 2010',
    url: 'https://www.ign.es/wms/pnoa-historico',
  });

  const intervals = [
    {
      id: '1',
      init: '1981-01-01T00:00:00.000Z',
      end: '1986-12-31T23:59:59.999Z',
      layer: nacional1981Layer,
    },
    {
      id: '2',
      init: '1998-01-01T00:00:00.000Z',
      end: '1998-12-31T23:59:59.999Z',
      layer: olistatLayer,
    },
    {
      id: '3',
      init: '1998-01-01T00:00:00.000Z',
      end: '1998-12-31T23:59:59.999Z',
      layer: sigpacLayer,
    },
    {
      id: '4',
      init: '2004-01-01T00:00:00.000Z',
      end: '2004-12-31T23:59:59.999Z',
      layer: pnoa2004Layer,
    },
    {
      id: '5',
      init: '2005-01-01T00:00:00.000Z',
      end: '2005-12-31T23:59:59.999Z',
      layer: pnoa2005Layer,
    },
    {
      id: '6',
      init: '2006-01-01T00:00:00.000Z',
      end: '2006-12-31T23:59:59.999Z',
      layer: pnoa2006Layer,
    },
    {
      id: '7',
      init: '2010-01-01T00:00:00.000Z',
      end: '2010-12-31T23:59:59.999Z',
      layer: pnoa2010Layer,
    },
  ];

  const time = [
    {
      id: '1',
      init: '1990-05-12T23:39:58.767Z',
      end: '2015-05-29T20:22:26.001Z',
      layer: 'WMS*Eventos sísmicos*https://www.ign.es/wms-inspire/geofisica*NZ.ObservedEvent',
      attributeParam: 'date',
    },
    {
      id: '2',
      init: '1990-05-12T23:39:58.767Z',
      end: '2015-05-29T20:22:26.001Z',
      layer: 'WMS*Eventos sísmicos*https://www.ign.es/wms-inspire/geofisica*NZ.ObservedEvent',
      attributeParam: 'date',
      grupo: 'NZ.ObservedEvent - equalsTimeLine',
    },
  ];
  // GPX local (CP-035): wpt-0 y rte-2 tienen time en 2020; wpt-1 y trk-3, en 2021.
  // Timeline crea la capa a partir de la definición "*".
  const gpxIntervals = [{
    id: 'gpx',
    init: '2020-01-01T00:00:00Z',
    end: '2021-12-31T23:59:59Z',
    layer: 'GPX*gpx_cp035*/test/development/CP-0002-layers/fixtures/CP-035.gpx*true*true',
    attributeParam: 'time',
  }];
  const routeIntervals = ROUTE_INTERVALS.map((interval) => ({
    ...interval,
    layer: `GPX*${interval.layer}*${ROUTES[interval.id]}*true*true`,
  }));
  const dynamicExamples = { wms: time, gpx: gpxIntervals, rutas: routeIntervals };

  const field = (id) => document.getElementById(id);
  const value = (id) => field(id).value;
  const typeTimeLine = field('typeTimeLine');

  const changeTestFormsDisplay = (formValue = typeTimeLine) => {
    const group = { absoluteSimple: 'origin', track: 'trackmode' }[formValue.value] ?? 'dynamic';
    document.querySelectorAll('.origin, .dynamic, .trackmode').forEach((el) => {
      el.style.display = el.classList.contains(group) ? 'flex' : 'none';
    });
  };

  // Opciones del control a partir del formulario: los campos vacíos no se pasan y el
  // control aplica sus valores por defecto.
  const readOptions = () => {
    const options = { timelineType: typeTimeLine.value };
    const optional = {
      position: value('selectPosicion'),
      tooltip: value('inputTooltip'),
      title: value('inputTitle'),
    };
    Object.entries(optional).forEach(([key, text]) => {
      if (text !== '') options[key] = text;
    });
    ['selectCollapsible', 'selectCollapsed', 'selectAnimation'].forEach((id) => {
      if (value(id) !== '') options[field(id).name] = value(id) === 'true';
    });
    if (value('inputOrder') !== '') options.order = Number(value('inputOrder'));
    if (value('inputLayerPosition') !== '') options.layerPosition = Number(value('inputLayerPosition'));
    if (value('selectTrack') !== '') options.track = TRACK_EXAMPLES[value('selectTrack')];

    if (typeTimeLine.value === 'track') {
      if (Number(value('inputSpeed')) > 0) options.speed = Number(value('inputSpeed'));
      if (value('sizeWidthDinamic') !== '') options.sizeWidthDinamic = value('sizeWidthDinamic');
    } else if (typeTimeLine.value === 'absoluteSimple') {
      options.intervals = value('inputIntervals') !== '' ? value('inputIntervals') : intervals;
      if (Number(value('inputSpeed')) > 0) options.speed = Number(value('inputSpeed'));
      if (value('selectSnapMode') !== '') options.snapMode = value('selectSnapMode');
    } else {
      options.intervals = value('time') !== '' ? value('time') : dynamicExamples[value('selectTime')];
      if (Number(value('speedDate')) > 0) options.speedDate = Number(value('speedDate'));
      if (Number(value('stepValue')) > 0) options.stepValue = Number(value('stepValue'));
      ['paramsDate', 'sizeWidthDinamic', 'formatValueDinamic', 'formatMove'].forEach((id) => {
        const key = id === 'formatValueDinamic' ? 'formatValue' : field(id).name;
        if (value(id) !== '') options[key] = value(id);
      });
    }
    return options;
  };

  const removeButton = field('removeButton');
  const updateRemoveButton = () => {
    removeButton.textContent = map.hasControl(Timeline.NAME) ? 'Eliminar control' : 'Crear control';
  };

  const changeTest = () => {
    remove();
    create(readOptions());
    updateRemoveButton();
  };

  [
    'selectPosicion', 'inputIntervals', 'selectAnimation', 'inputSpeed', 'time', 'selectTime',
    'speedDate', 'paramsDate', 'stepValue', 'sizeWidthDinamic', 'formatValueDinamic', 'formatMove',
    'inputTooltip', 'inputTitle', 'selectCollapsible', 'selectCollapsed', 'inputOrder',
    'selectSnapMode', 'inputLayerPosition', 'selectTrack',
  ].forEach((id) => field(id).addEventListener('change', changeTest));

  field('selectIntervals').addEventListener('change', () => {
    field('inputIntervals').value = value('selectIntervals');
    changeTest();
  });

  field('selectTime').addEventListener('change', () => {
    if (value('selectTime') !== 'rutas') return;
    field('paramsDate').value = 'min';
    field('stepValue').value = '10';
    field('speedDate').value = '1';
    if (value('selectTrack') === '') field('selectTrack').value = 'guadarrama';
  }, true);

  typeTimeLine.addEventListener('change', (event) => {
    if (event.target) {
      changeTestFormsDisplay(event.target);
      changeTest();
    }
  });

  const selectLanguage = field('selectLanguage');
  selectLanguage.value = urlParams.get('language') || 'es';
  selectLanguage.addEventListener('change', () => {
    setLang(selectLanguage.value);
    changeTest();
  });

  removeButton.addEventListener('click', () => {
    if (map.hasControl(Timeline.NAME)) remove();
    else create(readOptions());
    updateRemoveButton();
  });

  changeTestFormsDisplay();
  create(readOptions());
  updateRemoveButton();
};

if (!prepareTimelineGetDemo()) {
  setupScenarioSelector();
  if (manual) startManualScenario();
  else startGetScenario();
}
