/* eslint-disable max-len */
/* eslint-disable no-unused-vars */
/* eslint-disable no-param-reassign */
/* eslint-disable no-use-before-define */
/* eslint-disable no-console */
import { map as Mmap } from 'IDEE/api-idee';
import Timeline from 'IDEE/control/Timeline';
import WMS from 'IDEE/layer/WMS';
import * as EventType from 'IDEE/event/eventtype';
import { setLang } from '../../../src/facade/js/i18n/language';

const urlParams = new URLSearchParams(window.location.search);
setLang(urlParams.get('language') || 'es');
const manual = urlParams.get('mode') === 'manual';

/*
 * Escenario GET (por defecto)
 * ---------------------------
 * Réplica del recorrido de api-idee-rest (BuilderWS.detectKeyValueLayers/Controls y
 * JSBuilder): `layers` y `controls` se separan por comas y cada entrada llega como cadena
 * a IDEE.map({ layers, controls }). El resto de parámetros (center, zoom, projection)
 * pasan como cadenas. Las cadenas las interpretan los parsers generales de la API
 * (parameter.gpx, buildControl, parseUrlParams con base64~): aquí no se crea ningún GPX
 * ni ningún Timeline.
 * : capas y control por parámetros GET reales (GPX), selector de capas por posición y filtrado temporal.

    npm start -- --name=CP-0003-controls/CP-014

Se ejecuta en `api-idee-js` o en cualquiera de sus subcarpetas, como `test/development`.
Abre `test/development/CP-0003-controls/CP-014.html` sin query string.

**Arranque GET.** Antes de cargar la API, la página navega con `location.replace()` a una URL GET real. Al crear el mapa, los parámetros ya están en `window.location.search`:

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
- **Navegación:** deslizadores, fechas (Enter o al salir del campo), `<<`, `>>` y Play/Pausa (pasos de un mes, `paramsDate=mos`).
- **Ciclo de vida:** "Retirar Timeline" restaura las capas y elimina la creada. "Volver a añadir el mismo Timeline" vuelve a añadir la misma instancia.

**Modalidades y URL propias**

- `?demo=absolute` y `?demo=absoluteSimple` aplican el mismo recorrido GET a las otras modalidades. En `absoluteSimple` cada paso muestra u oculta una GPX.
- Si la URL ya trae `layers` o `controls`, se respeta y no se redirige. `intervals` debe ir en base64, porque las comas del JSON se interpretarían como separadores.
- `?mode=manual` es el formulario programático histórico, que usa `new Timeline(...)`. No demuestra el recorrido GET.

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
 * `npm start -- --name=CP-0003-controls/CP-014` abre la página sin query string.
 * Antes de crear el mapa se navega (location.replace) a una URL GET real con
 * `layers` (dos GPX locales y una base de referencia) y `controls` (Timeline con
 * `intervals` en base64). Así, al crear el mapa, los parámetros están en
 * window.location.search y los interpretan los parsers generales de la API.
 *
 * No se redirige si la URL ya trae `layers` o `controls` (URL manual) o con
 * `mode=manual` (formulario programático). `demo` elige la modalidad:
 * relative (por defecto), absolute o absoluteSimple.
 *
 * Devuelve true si redirige; en ese caso no debe crearse el mapa.
 */
const prepareTimelineGetDemo = () => {
  const params = new URLSearchParams(urlParams);
  document.documentElement.dataset.cp014 = manual ? 'manual' : 'get';
  if (manual || params.has('layers') || params.has('controls')) return false;

  const gpx = '/test/development/CP-0002-layers/fixtures/CP-035.gpx';
  const demo = ['relative', 'absolute', 'absoluteSimple'].includes(params.get('demo'))
    ? params.get('demo') : 'relative';

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

  // base64 de UTF-8, como espera parseUrlParams (base64~).
  const bytes = new TextEncoder().encode(JSON.stringify(intervals));
  let binary = '';
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });

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
    `intervals=base64~${window.btoa(binary)}`,
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
    const value = select.value === 'manual' ? 'mode=manual' : `demo=${select.value}`;
    window.location.assign(`${window.location.pathname}?${value}`);
  });
};

// Solo para mostrarlas: abrevia la ruta del fixture GPX.
const shortenPath = (text) => text.replace(/\/test\/development\/CP-0002-layers\/fixtures\//g, '…/');

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

  // Estado compacto (una línea por elemento). El detalle completo está en window.mapa,
  // window.timeline y window.capasGPX.
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
        : `Timeline: ${t.seleccionada ?? 'sin capa'} · ${t.rango} · ${t.reproduciendo ? 'reproduciendo' : 'parado'}`,
      typeof t === 'string' ? '' : `  opciones GET: ${t.opciones}`,
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
 * Modo manual (?mode=manual)
 * --------------------------
 * Formulario programático histórico: crea el Timeline con `new Timeline(...)`.
 * No demuestra el recorrido GET.
 */
const startManualScenario = () => {
  const map = Mmap({
    container: 'map',
    controls: ['rotate'],
    projection: 'EPSG:3857',
    center: [-467062.8225, 4683459.6216],
    zoom: 6,
  });
  window.mapa = map;

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

  const inputIntervals = document.getElementById('inputIntervals');
  const selectIntervals = document.getElementById('selectIntervals');
  const selectAnimation = document.getElementById('selectAnimation');
  const inputSpeed = document.getElementById('inputSpeed');
  const selectPosicion = document.getElementById('selectPosicion');
  const position = selectPosicion.options[selectPosicion.selectedIndex].value;
  const selectSnapMode = document.getElementById('selectSnapMode');
  const inputLayerPosition = document.getElementById('inputLayerPosition');

  const inputTooltip = document.getElementById('inputTooltip');
  const selectCollapsible = document.getElementById('selectCollapsible');
  const selectCollapsed = document.getElementById('selectCollapsed');
  const inputOrder = document.getElementById('inputOrder');

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
  const speedDate = 2;
  const paramsDate = 'yr';
  const stepValue = 5;
  const formatValue = 'logarithmic';
  const sizeWidthDinamic = 'sizeWidthDinamic_medium';
  const formatMove = 'continuous';
  const title = inputTooltip.value;

  // Type
  const typeTimeLine = document.getElementById('typeTimeLine');

  if (typeTimeLine.value === 'absoluteSimple') {
    create({
      timelineType: typeTimeLine.options[typeTimeLine.selectedIndex].value,
      position,
      intervals,
      title,
    });
  } else {
    create({
      timelineType: typeTimeLine.options[typeTimeLine.selectedIndex].value,
      intervals: time,
      speedDate,
      paramsDate,
      stepValue,
      formatMove,
      formatValue,
      sizeWidthDinamic,
      title,
    });
  }

  const changeTestFormsDisplay = (formValue = typeTimeLine) => {
    const isDynamic = formValue.value !== 'absoluteSimple';

    document.querySelectorAll('.dynamic').forEach((el) => {
      el.style.display = isDynamic ? 'flex' : 'none';
    });

    document.querySelectorAll('.origin').forEach((el) => {
      el.style.display = isDynamic ? 'none' : 'flex';
    });
  };

  // Dinamic
  const elementTime = document.getElementById('time');
  const elementSpeedDate = document.getElementById('speedDate');
  const elementParamsDate = document.getElementById('paramsDate');
  const elementStepValue = document.getElementById('stepValue');
  const elementSizeWidth = document.getElementById('sizeWidthDinamic');
  const elementFormatValue = document.getElementById('formatValueDinamic');
  const elementFormatMove = document.getElementById('formatMove');

  function changeTest() {
    remove();
    const options = {};

    const selectPosition = selectPosicion.options[selectPosicion.selectedIndex].value;
    if (selectPosition !== '') options.position = selectPosition;

    if (inputTooltip.value !== '') options.tooltip = inputTooltip.value;

    const collapsibleVal = selectCollapsible.value === 'true';
    if (selectCollapsible.value !== '') options.collapsible = collapsibleVal;

    const collapsed = selectCollapsed.options[selectCollapsed.selectedIndex].value;
    if (collapsed !== '') options.collapsed = (collapsed === 'true');

    if (inputOrder.value !== undefined) options.order = Number(inputOrder.value);

    if (inputLayerPosition.value !== '') options.layerPosition = Number(inputLayerPosition.value);

    options.timelineType = typeTimeLine.options[typeTimeLine.selectedIndex].value;

    if (typeTimeLine.value === 'absoluteSimple') {
      options.intervals = inputIntervals.value !== '' ? inputIntervals.value : intervals;
      const animation = selectAnimation.options[selectAnimation.selectedIndex].value;
      if (animation !== '') options.animation = animation === 'true';
      if (inputSpeed.value !== '') options.speed = Number(inputSpeed.value);
      const snapMode = selectSnapMode.options[selectSnapMode.selectedIndex].value;
      if (snapMode !== '') options.snapMode = snapMode;
    } else {
      options.intervals = elementTime.value !== '' ? elementTime.value : time;
      options.speedDate = elementSpeedDate.value >= 1 ? Number(elementSpeedDate.value) : 1;
      options.paramsDate = elementParamsDate.options[elementParamsDate.selectedIndex].value;
      options.stepValue = elementStepValue.value >= 1 ? Number(elementStepValue.value) : 1;
      options.sizeWidthDinamic = elementSizeWidth.options[elementSizeWidth.selectedIndex].value;
      options.formatValue = elementFormatValue.options[elementFormatValue.selectedIndex].value;
      options.formatMove = elementFormatMove.options[elementFormatMove.selectedIndex].value;
    }
    create(options);
  }

  [
    selectPosicion, inputIntervals, selectAnimation, inputSpeed,
    elementTime, elementSpeedDate, elementParamsDate, elementStepValue,
    elementSizeWidth, elementFormatValue, elementFormatMove,
    inputTooltip, selectCollapsible, selectCollapsed, inputOrder,
    selectSnapMode, inputLayerPosition,
  ].forEach((el) => { el.addEventListener('change', changeTest); });

  selectIntervals.addEventListener('change', () => {
    inputIntervals.value = selectIntervals.value;
    changeTest();
  });

  typeTimeLine.addEventListener('change', (event) => {
    if (event.target) {
      changeTestFormsDisplay(event.target);
      changeTest();
    }
  });

  changeTestFormsDisplay();

  const removeButton = document.getElementById('removeButton');
  removeButton.addEventListener('click', () => {
    remove();
  });
};

if (!prepareTimelineGetDemo()) {
  setupScenarioSelector();
  if (manual) startManualScenario();
  else startGetScenario();
}
