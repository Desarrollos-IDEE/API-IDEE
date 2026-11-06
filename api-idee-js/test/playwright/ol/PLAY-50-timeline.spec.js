/* eslint-disable max-len */
import { test, expect } from '@playwright/test';
import { routePng } from '../common/mocks';

/*
 * Control Timeline (OpenLayers): conservación de atributos, selector de capas por
 * posición en el visualizador, definiciones "TIPO*..." en intervals (GPX, WMS, WMTS,
 * KML...) para las tres modalidades, recorrido GET (layers + controls con intervals en
 * base64), filtrado temporal GPX por "time" y ciclo de vida.
 *
 * El GPX es el fixture local de CP-035: wpt-0 y rte-2 tienen time en 2020 y wpt-1 y
 * trk-3 en 2021.
 */
const GPX = '/test/development/CP-0002-layers/fixtures/CP-035.gpx';
const ROUTES = {
  guadarrama: '/test/development/CP-0003-controls/fixtures/ruta-guadarrama.gpx',
  penalara: '/test/development/CP-0003-controls/fixtures/ruta-penalara.gpx',
};
const ROUTE_INTERVALS = [
  {
    id: 'guadarrama', init: '2021-06-05T08:00:00Z', end: '2021-06-05T13:20:00Z', layer: 'ruta_guadarrama', attributeParam: 'time',
  },
  {
    id: 'penalara', init: '2021-07-10T09:00:00Z', end: '2021-07-10T12:00:00Z', layer: 'ruta_penalara', attributeParam: 'time',
  },
];

const encodeIntervals = (intervals) => Buffer.from(JSON.stringify(intervals), 'utf-8').toString('base64');

const RANGE_INTERVALS = [
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
    layer: `GPX*gpx_definicion*${GPX}*true*true`,
    attributeParam: 'time',
  },
  {
    id: 'creada',
    init: '2021-01-01T00:00:00Z',
    end: '2021-12-31T23:59:59Z',
    layer: `GPX*gpx_creada*${GPX}*true*true`,
    attributeParam: 'time',
  },
];

// Lo que api-idee-rest pasa a IDEE.map para ?layers=...&controls=...
const getParameters = (timelineType, intervals, extra = '') => ({
  layers: [`GPX*gpx_nombre*${GPX}*true*true`, `GPX*gpx_definicion*${GPX}*true*true`],
  controls: [`timeline*timelineType=${timelineType};collapsible=false;collapsed=false${extra};intervals=base64~${encodeIntervals(intervals)}`],
});

const openPage = async (page) => {
  const errors = [];
  const warnings = [];
  page.on('pageerror', (error) => errors.push(error));
  page.on('console', (message) => {
    if (message.type() === 'warning') warnings.push(message.text());
  });
  // Solo las imágenes de los servicios del IGN; las capacidades se descargan reales.
  await routePng(page, (url) => /ign\.es/.test(url.hostname)
    && /request=(getmap|gettile)/i.test(url.search));
  await page.goto('/test/playwright/ol/basic-ol.html');
  await page.evaluate(() => {
    window.whenTimeline = (map) => new Promise((resolve) => {
      const check = () => {
        const timeline = map.getControls('timeline')[0];
        if (timeline && timeline.getElement()?.isConnected) resolve(timeline);
        else setTimeout(check, 50);
      };
      check();
    });
    window.whenGPXLoaded = (map) => new Promise((resolve) => {
      const check = () => {
        if (map.getGPX().every((layer) => layer.getFeatures(true).length > 0)) resolve();
        else setTimeout(check, 50);
      };
      check();
    });
  });
  return { errors, warnings };
};

const createGetMap = async (page, timelineType, intervals, extra) => page.evaluate(async (params) => {
  window.map = IDEE.map({
    container: 'map', center: [-412305, 4926696], zoom: 13, ...params,
  });
  window.timeline = await window.whenTimeline(window.map);
  await window.whenGPXLoaded(window.map);
  return window.map.getGPX().length;
}, getParameters(timelineType, intervals, extra));

const watchFeatureHandler = (page) => page.evaluate(() => {
  const handler = window.map.getFeatureHandler();
  let active = true;
  handler.on(IDEE.evt.ACTIVATED, () => { active = true; });
  handler.on(IDEE.evt.DEACTIVATED, () => { active = false; });
  handler.isActive = () => active;
});

const clickCoordinate = async (page, coordinate) => {
  const [x, y] = await page.evaluate((coord) => {
    const olMap = window.map.getMapImpl();
    const pixel = olMap.getPixelFromCoordinate(coord);
    const rect = olMap.getTargetElement().getBoundingClientRect();
    return [pixel[0] + rect.left, pixel[1] + rect.top];
  }, coordinate);
  await page.mouse.click(x, y);
};

const setRange = (page, init, end) => page.evaluate(([from, to]) => {
  const element = window.timeline.getElement();
  [['.m-timeline-date-init', from], ['.m-timeline-date-end', to]].forEach(([selector, value]) => {
    const input = element.querySelector(selector);
    input.value = value;
    input.dispatchEvent(new Event('focusout'));
  });
}, [init, end]);

const ROUTE_LAYERS = [`GPX*ruta_guadarrama*${ROUTES.guadarrama}*true*true`, `GPX*ruta_penalara*${ROUTES.penalara}*true*true`];

const createTrackMap = (page, controls = 'timeline*timelineType=track;collapsible=false;collapsed=false;layerPosition=2') => page.evaluate(async (params) => {
  window.map = IDEE.map({
    container: 'map', center: [-445835, 4982151], zoom: 12, ...params,
  });
  window.timeline = await window.whenTimeline(window.map);
  await window.whenGPXLoaded(window.map);
  await new Promise((resolve) => {
    const check = () => (window.timeline.getTrack() ? resolve() : setTimeout(check, 50));
    check();
  });
}, { layers: ROUTE_LAYERS, controls: [controls] });

const addTimeline = (page, options) => page.evaluate(async (config) => {
  window.map.addControls(new IDEE.control.Timeline({ collapsible: false, collapsed: false, ...config }));
  window.timeline = await window.whenTimeline(window.map);
}, options);

const openRoutesMap = (page) => page.evaluate(async (layers) => {
  window.map = IDEE.map({
    container: 'map', center: [-445835, 4982151], zoom: 12, layers,
  });
  await window.whenGPXLoaded(window.map);
}, ROUTE_LAYERS);

const trackOf = (page) => page.evaluate(() => {
  const track = window.timeline.getTrack();
  return track ? { ...track, layer: track.layer.name } : null;
});

const trackDom = (page) => page.evaluate(() => {
  const tools = window.timeline.getElement().querySelector('.m-timeline-track-tools');
  if (!tools) return null;
  const query = (selector) => tools.querySelector(selector);
  const progress = query('.m-timeline-track-progress');
  const warning = query('.m-timeline-track-warning');
  const expanded = query('.m-timeline-track-message');
  return {
    hidden: tools.hidden,
    layers: [...query('.m-timeline-track-layer').options].map((option) => option.textContent),
    layer: query('.m-timeline-track-layer').selectedOptions[0]?.textContent ?? null,
    features: [...query('.m-timeline-track-feature').options]
      .map((option) => `${option.parentElement.label}: ${option.textContent}`),
    featuresHidden: query('.m-timeline-track-feature').hidden,
    feature: query('.m-timeline-track-feature').value,
    pick: query('.m-timeline-track-pick').getAttribute('aria-pressed'),
    profile: query('.m-timeline-profile-button').hidden ? null : query('.m-timeline-profile-button').getAttribute('aria-pressed'),
    progress: query('.m-timeline-track-progress-row').hidden ? null : {
      max: Number(progress.max), value: Number(progress.value), disabled: progress.disabled,
    },
    status: query('.m-timeline-track-status').textContent,
    message: warning.hidden ? '' : warning.title,
    warning: {
      icon: warning.classList.contains('g-cartografia-warning'),
      label: warning.getAttribute('aria-label'),
      expanded: warning.getAttribute('aria-expanded'),
      text: expanded.checkVisibility() ? expanded.textContent : null,
    },
  };
});

const olTrack = (page) => page.evaluate(() => {
  const layer = window.map.getMapImpl().getLayers().getArray()
    .find((item) => item.get('name') === '__timeline_track__');
  if (!layer) return null;
  const [full, ends, travelled, marker] = layer.getSource().getFeatures();
  return {
    full: full.getGeometry().getCoordinates(),
    ends: ends.getGeometry().getCoordinates(),
    travelled: travelled.getGeometry().getCoordinates(),
    marker: marker.getGeometry()?.getCoordinates() ?? null,
    style: {
      travelled: travelled.getStyle().getStroke().getColor(),
      full: full.getStyle().getStroke().getColor(),
      dashed: Boolean(full.getStyle().getStroke().getLineDash()),
      marker: marker.getStyle()?.getImage?.()?.getFill().getColor() ?? null,
    },
  };
});

const routeSegments = (page, name) => page.evaluate((featureName) => {
  const feature = window.map.getGPX().flatMap((layer) => layer.getFeatures(true))
    .find((f) => f.getAttribute('name') === featureName);
  const { type, coordinates } = feature.getGeometry();
  const parts = type === 'MultiLineString' ? coordinates : [coordinates];
  return parts.map((part) => part.map(([x, y]) => [x, y]));
}, name);

const chooseValue = (page, selector, value) => page.evaluate(([css, option]) => {
  const element = window.timeline.getElement().querySelector(css);
  element.value = option;
  element.dispatchEvent(new Event(element.tagName === 'INPUT' ? 'input' : 'change'));
}, [selector, value]);

const clickAction = (page, name, times = 1) => page.evaluate(([button, count]) => {
  for (let i = 0; i < count; i += 1) {
    window.timeline.getElement().querySelector(`[data-timeline-action="${button}"]`).click();
  }
}, [name, times]);

const mockElevation = async (page, { status = 200, noData = false, hold = null } = {}) => {
  const requests = [];
  await page.route('**/processes/elevationProfile/execution', async (route) => {
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'content-type',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
    };
    if (route.request().method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers });
      return;
    }
    const body = JSON.parse(route.request().postData());
    requests.push(body.inputs);
    if (hold) await hold(requests.length);
    const values = noData ? null : JSON.parse(body.inputs.geom).features
      .map(({ geometry }, index) => [...geometry.coordinates, 600 + index * 10]);
    await route.fulfill({
      status, headers, contentType: 'application/json', body: JSON.stringify({ values }),
    }).catch(() => {});
  });
  return requests;
};

const profilePanel = (page) => page.evaluate(() => {
  const element = document.querySelector('.ol-profil.m-timeline-profile-panel');
  return element ? {
    title: element.querySelector('p').textContent,
    bar: parseFloat(element.querySelector('.ol-profilbar').style.left),
    distance: element.querySelector('.point-info .dist').textContent,
  } : null;
});

const getState = (page) => page.evaluate(() => ({
  selected: window.timeline.getSelectedLayer()?.name ?? null,
  selectable: window.timeline.getSelectableLayers()
    .map((entry) => ({ id: entry.id, name: entry.name, position: entry.position })),
  gpx: window.map.getGPX().map((layer) => ({
    name: layer.name,
    visible: layer.isVisible(),
    total: layer.getFeatures(true).length,
    shown: layer.getFeatures().map((feature) => feature.getId()).sort(),
  })),
}));

test.describe('IDEE.control.Timeline (OpenLayers)', () => {
  test('conserva nombres, valores iniciales, tipos y accesibilidad de los atributos', async ({ page }) => {
    await openPage(page);
    const result = await page.evaluate(() => {
      const t = new IDEE.control.Timeline({
        timelineType: 'absoluteSimple',
        intervals: [['A', '2004', 'WMS*A*https://www.ign.es/wms/pnoa-historico*pnoa2004'],
          ['B', '2004', 'WMS*B*https://www.ign.es/wms/pnoa-historico*pnoa2005']],
      });
      const keys = Object.keys(t);
      const historic = ['map', 'parentPlugin', 'parentContainer', 'name', 'tooltip', 'svgPath', 'position',
        'order', 'controls', 'panel_', 'element', 'activationBtn', 'activated', 'options',
        'animation', 'speed', 'speedDate', 'paramsDate', 'stepValue', 'snapMode', 'sizeWidthDinamic',
        'formatMove', 'formatValue', 'timelineType', 'intervals', 'intervalsGrouped', 'title',
        'collapsible', 'collapsed', 'running', 'date', 'allLayersDinamic'];
      const indexes = historic.map((key) => keys.indexOf(key));
      t.running = 1234;
      const assigned = t.running;
      t.running = false;
      const dynamic = new IDEE.control.Timeline({
        timelineType: 'relative',
        speed: '3',
        collapsible: false,
        collapsed: false,
        layerPosition: '2',
        intervals: [{
          init: '2020', end: '2021', service: 'gpx', attributeParam: 'time',
        }, ['X', '2019', 'gpx'], ['Y', 'serie', 'gpx', '2018', '2019']],
      });
      return {
        missing: historic.filter((key) => !keys.includes(key)),
        ordered: indexes.every((index, i) => i === 0 || index > indexes[i - 1]),
        values: {
          animation: t.animation,
          speed: t.speed,
          speedDate: t.speedDate,
          paramsDate: t.paramsDate,
          stepValue: t.stepValue,
          snapMode: t.snapMode,
          sizeWidthDinamic: t.sizeWidthDinamic,
          formatMove: t.formatMove,
          formatValue: t.formatValue,
          timelineType: t.timelineType,
          position: t.position,
          tooltip: t.tooltip,
          title: t.title,
          collapsible: t.collapsible,
          collapsed: t.collapsed,
          running: t.running,
          date: t.date,
          allLayersDinamic: t.allLayersDinamic,
          layerPosition: t.layerPosition,
          name: t.name,
          NAME: IDEE.control.Timeline.NAME,
          translationTitle: t.translation.title,
        },
        intervals: t.intervals,
        groupKeys: Object.keys(t.intervalsGrouped),
        group: t.intervalsGrouped['2004'].map(({
          id, name, year, selected, originalInterval,
        }) => ({
          id, name, year, selected, originalInterval: Array.isArray(originalInterval),
        })),
        assigned,
        afterFalse: t.running,
        runningEnumerable: Object.getOwnPropertyDescriptor(t, 'running').enumerable,
        dynamic: {
          speed: dynamic.speed,
          collapsed: dynamic.collapsed,
          layerPosition: dynamic.layerPosition,
          intervals: dynamic.intervals,
          noLayerProps: !('timelineId' in dynamic),
        },
      };
    });
    expect(result.missing).toEqual([]);
    expect(result.ordered).toBe(true);
    expect(result.values).toEqual({
      animation: true,
      speed: 1,
      speedDate: 2,
      paramsDate: 'yr',
      stepValue: 1,
      snapMode: undefined,
      sizeWidthDinamic: '',
      formatMove: 'continuous',
      formatValue: 'linear',
      timelineType: 'absoluteSimple',
      position: 'left',
      tooltip: '',
      title: '',
      collapsible: true,
      collapsed: true,
      running: false,
      date: { init: 0, end: 0 },
      allLayersDinamic: { groupLayer: [], noGroupLayer: [] },
      layerPosition: undefined,
      name: 'timeline',
      NAME: 'timeline',
      translationTitle: 'Línea de tiempo',
    });
    expect(result.intervals).toEqual([
      ['A', '2004', 'WMS*A*https://www.ign.es/wms/pnoa-historico*pnoa2004'],
      ['B', '2004', 'WMS*B*https://www.ign.es/wms/pnoa-historico*pnoa2005'],
    ]);
    expect(result.groupKeys).toEqual(['2004']);
    expect(result.group).toEqual([
      {
        id: 'A_0', name: 'A', year: '2004', selected: true, originalInterval: true,
      },
      {
        id: 'B_1', name: 'B', year: '2004', selected: false, originalInterval: true,
      },
    ]);
    expect(result.assigned).toBe(1234);
    expect(result.afterFalse).toBe(false);
    expect(result.runningEnumerable).toBe(true);
    expect(result.dynamic.speed).toBe(3);
    expect(result.dynamic.collapsed).toBe(true);
    expect(result.dynamic.layerPosition).toBe(2);
    expect(result.dynamic.intervals).toEqual([
      {
        id: '0',
        init: '2020-01-01T00:00:00.000Z',
        end: '2021-12-31T23:59:59.999Z',
        service: 'gpx',
        layer: 'gpx',
        attributeParam: 'time',
      },
      {
        id: '1',
        init: '2019-01-01T00:00:00.000Z',
        end: '2019-12-31T23:59:59.999Z',
        layer: 'gpx',
        name: 'X',
      },
      {
        id: '2',
        init: '2018-01-01T00:00:00.000Z',
        end: '2019-12-31T23:59:59.999Z',
        layer: 'gpx',
        name: 'Y',
      },
    ]);
  });

  test('GET: GPX por layers y Timeline por controls; selección por posición sin duplicar capas', async ({ page }) => {
    const { errors } = await openPage(page);
    const gpxCount = await createGetMap(page, 'relative', RANGE_INTERVALS, ';layerPosition=2');
    expect(gpxCount).toBe(2);
    const state = await getState(page);
    expect(state.selectable).toEqual([
      { id: 'por-definicion', name: 'gpx_definicion', position: 1 },
      { id: 'por-nombre', name: 'gpx_nombre', position: 2 },
      { id: 'creada', name: 'gpx_creada', position: null },
    ]);
    expect(state.selected).toBe('gpx_nombre');
    expect(state.gpx).toEqual([
      {
        name: 'gpx_nombre', visible: true, total: 4, shown: ['rte-2', 'trk-3', 'wpt-0', 'wpt-1'],
      },
      {
        name: 'gpx_definicion', visible: false, total: 4, shown: ['rte-2', 'trk-3', 'wpt-0', 'wpt-1'],
      },
    ]);
    const info = await page.evaluate(() => {
      const t = window.timeline;
      const select = t.getElement().querySelector('.m-timeline-layer-select');
      return {
        builderParams: Object.keys(t.builderParams).sort(),
        options: [...select.options].map((option) => option.textContent),
        value: select.value,
        layerProps: window.map.getGPX().some((layer) => 'timelineId' in layer || 'layerTimeLine' in layer),
        ids: [...t.getElement().querySelectorAll('[id]')].map((element) => element.id),
      };
    });
    expect(info.builderParams).toEqual(expect.arrayContaining(['collapsed', 'collapsible', 'intervals', 'layerPosition', 'timelineType']));
    expect(info.options).toEqual(['Ninguna', '[1] gpx_definicion', '[2] gpx_nombre', 'gpx_creada']);
    expect(info.value).toBe('interval:por-nombre');
    expect(info.layerProps).toBe(false);
    expect(info.ids.every((id) => id.startsWith('m-timeline-'))).toBe(true);
    expect(errors).toEqual([]);
  });

  test('GET sin layerPosition: se activa la capa compatible superior', async ({ page }) => {
    await openPage(page);
    await createGetMap(page, 'relative', RANGE_INTERVALS);
    const state = await getState(page);
    expect(state.selected).toBe('gpx_definicion');
    expect(state.gpx.map(({ name, visible, shown }) => [name, visible, shown])).toEqual([
      ['gpx_nombre', false, ['rte-2', 'trk-3', 'wpt-0', 'wpt-1']],
      ['gpx_definicion', true, ['rte-2', 'wpt-0']],
    ]);
  });

  test('relative: filtra el GPX por time al cambiar el rango y la selección', async ({ page }) => {
    const { errors } = await openPage(page);
    await createGetMap(page, 'relative', RANGE_INTERVALS, ';layerPosition=2');
    const shown = () => page.evaluate(() => window.timeline.getSelectedLayer()
      .getFeatures().map((feature) => feature.getId()).sort());
    expect(await shown()).toEqual(['rte-2', 'trk-3', 'wpt-0', 'wpt-1']);

    await page.evaluate(() => {
      const input = window.timeline.getElement().querySelector('.m-timeline-date-init');
      input.value = '2020-06-01T00:00:00Z';
      input.dispatchEvent(new Event('focusout'));
    });
    expect(await shown()).toEqual(['trk-3', 'wpt-1']);
    expect(await page.evaluate(() => window.timeline.date.init)).toBe(Date.parse('2020-06-01T00:00:00Z'));

    await page.evaluate(() => {
      const input = window.timeline.getElement().querySelector('.m-timeline-date-end');
      input.value = '2020-12-31T00:00:00Z';
      input.dispatchEvent(new Event('focusout'));
    });
    expect(await shown()).toEqual([]);

    // Cambio de selección: la capa anterior recupera su filtro y se oculta.
    expect(await page.evaluate(() => window.timeline.selectLayer('por-definicion'))).toBe(true);
    const state = await getState(page);
    expect(state.selected).toBe('gpx_definicion');
    expect(state.gpx).toEqual([
      {
        name: 'gpx_nombre', visible: false, total: 4, shown: ['rte-2', 'trk-3', 'wpt-0', 'wpt-1'],
      },
      {
        name: 'gpx_definicion', visible: true, total: 4, shown: ['rte-2', 'wpt-0'],
      },
    ]);

    // Selección por posición en el visualizador.
    expect(await page.evaluate(() => window.timeline.selectLayer(2))).toBe(true);
    expect((await getState(page)).selected).toBe('gpx_nombre');
    expect(errors).toEqual([]);
  });

  test('definición "*" que no existe: Timeline crea la capa y la retira al destruirse', async ({ page }) => {
    await openPage(page);
    await createGetMap(page, 'relative', RANGE_INTERVALS, ';layerPosition=2');
    await page.evaluate(() => window.timeline.selectLayer('creada'));
    await page.waitForFunction(() => window.map.getGPX().length === 3
      && window.map.getGPX()[2].getFeatures(true).length > 0);
    const state = await getState(page);
    expect(state.selected).toBe('gpx_creada');
    expect(state.gpx.map(({ name, visible, shown }) => [name, visible, shown])).toEqual([
      ['gpx_nombre', false, ['rte-2', 'trk-3', 'wpt-0', 'wpt-1']],
      ['gpx_definicion', false, ['rte-2', 'trk-3', 'wpt-0', 'wpt-1']],
      ['gpx_creada', true, ['trk-3', 'wpt-1']],
    ]);

    const after = await page.evaluate(() => {
      window.map.removeControls(window.timeline);
      return {
        running: window.timeline.running,
        gpx: window.map.getGPX().map((layer) => ({
          name: layer.name,
          visible: layer.isVisible(),
          filter: layer.getFilter() ?? null,
          shown: layer.getFeatures().length,
        })),
      };
    });
    expect(after.running).toBe(false);
    expect(after.gpx).toEqual([
      {
        name: 'gpx_nombre', visible: true, filter: null, shown: 4,
      },
      {
        name: 'gpx_definicion', visible: true, filter: null, shown: 4,
      },
    ]);
  });

  test('absolute: igualdad forzada, fecha inicial desactivada y rango vectorial', async ({ page }) => {
    await openPage(page);
    await createGetMap(page, 'absolute', RANGE_INTERVALS, ';layerPosition=2');
    const result = await page.evaluate(() => {
      const element = window.timeline.getElement();
      return {
        initDisabled: element.querySelector('.m-timeline-date-init').disabled,
        rangeDisabled: element.querySelector('.m-timeline-range-init').disabled,
        shown: window.timeline.getSelectedLayer().getFeatures().length,
      };
    });
    expect(result).toEqual({ initDisabled: true, rangeDisabled: true, shown: 4 });
    await page.evaluate(() => {
      const input = window.timeline.getElement().querySelector('.m-timeline-date-end');
      input.value = '2020-12-31T00:00:00Z';
      input.dispatchEvent(new Event('focusout'));
    });
    expect(await page.evaluate(() => window.timeline.getSelectedLayer().getFeatures()
      .map((feature) => feature.getId()).sort())).toEqual(['rte-2', 'wpt-0']);
  });

  test('absoluteSimple: GPX por nombre y por definición "*" se muestran y ocultan por paso', async ({ page }) => {
    const { errors } = await openPage(page);
    await createGetMap(page, 'absoluteSimple', [
      ['GPX por nombre', '2020', 'gpx_nombre'],
      ['GPX por definición', '2021', `GPX*gpx_definicion*${GPX}*true*true`],
      ['GPX creada', '2022', `GPX*gpx_creada*${GPX}*true*false`],
    ], ';layerPosition=1');
    const visibility = () => page.evaluate(() => window.map.getGPX()
      .map((layer) => [layer.name, layer.isVisible(), layer.displayInLayerSwitcher]));
    const result = await page.evaluate(() => window.timeline.intervals.map((interval) => ({
      number: interval.number, name: interval.name, tag: interval.tag, layer: interval.service?.name,
    })));
    expect(result).toEqual([
      {
        number: 0, name: 'GPX por nombre', tag: '2020', layer: 'gpx_nombre',
      },
      {
        number: 1, name: 'GPX por definición', tag: '2021', layer: 'gpx_definicion',
      },
      {
        number: 2, name: 'GPX creada', tag: '2022', layer: 'gpx_creada',
      },
    ]);
    // layerPosition=1 es gpx_definicion (la superior), así que empieza en el paso 1.
    expect(await visibility()).toEqual([
      ['gpx_nombre', false, true],
      ['gpx_definicion', true, true],
      ['gpx_creada', false, false],
    ]);
    await page.evaluate(() => {
      const slider = window.timeline.getElement().querySelector('.m-timeline-slider-input');
      slider.value = 2;
      window.timeline.changeSlider(slider);
    });
    expect(await visibility()).toEqual([
      ['gpx_nombre', false, true],
      ['gpx_definicion', false, true],
      ['gpx_creada', true, false],
    ]);
    expect(await page.evaluate(() => window.timeline.selectLayer('GPX por nombre_0'))).toBe(true);
    expect((await visibility())[0]).toEqual(['gpx_nombre', true, true]);

    // Reproducción y destrucción: se paran los temporizadores y se restauran las capas.
    const lifecycle = await page.evaluate(() => {
      window.timeline.playTimeline(false);
      const playing = window.timeline.running !== false;
      window.map.removeControls(window.timeline);
      return {
        playing,
        running: window.timeline.running,
        gpx: window.map.getGPX().map((layer) => [layer.name, layer.isVisible()]),
      };
    });
    expect(lifecycle).toEqual({
      playing: true,
      running: false,
      gpx: [['gpx_nombre', true], ['gpx_definicion', true]],
    });
    expect(errors).toEqual([]);
  });

  test('absoluteSimple histórico: WMS por cadena (también con !! y ¡¡) y WMTS en ambos órdenes', async ({ page }) => {
    const { errors } = await openPage(page);
    const result = await page.evaluate(async () => {
      const intervals = '!!!!"PNOA 2004","2004","WMS*PNOA 2004*https://www.ign.es/wms/pnoa-historico*pnoa2004"¡¡,!!"PNOA 2005","2005","WMS*PNOA 2005*https://www.ign.es/wms/pnoa-historico*pnoa2005"¡¡¡¡';
      window.map = IDEE.map({ container: 'map', controls: [] });
      window.timeline = new IDEE.control.Timeline({ timelineType: 'absoluteSimple', intervals });
      window.map.addControls(window.timeline);
      await window.whenTimeline(window.map);
      const t = window.timeline;
      const steps = t.intervals.map((interval) => ({
        number: interval.number,
        tag: interval.tag,
        type: interval.service.type,
        name: interval.service.name,
        legend: interval.service.legend,
        visible: interval.service.isVisible(),
        displayInLayerSwitcher: interval.service.displayInLayerSwitcher,
      }));
      const describe = (layer) => (layer ? {
        type: layer.type, name: layer.name, url: layer.url, legend: layer.legend,
      } : null);
      return {
        steps,
        wmtsApi: describe(t.transformToLayers('WMTS*https://www.ign.es/wmts/pnoa-ma?*OI.OrthoimageCoverage*GoogleMapsCompatible*PNOA')),
        wmtsHistoric: describe(t.transformToLayers('WMTS*PNOA*https://www.ign.es/wmts/pnoa-ma?*OI.OrthoimageCoverage')),
        wms: describe(t.transformToLayers('WMS*IGN*https://www.ign.es/wms-inspire/ign-base*IGNBaseTodo')),
        validWMS: t.isValidLayer({ type: 'WMS' }),
        validWMTS: t.isValidLayer({ type: 'WMTS' }),
        validGPX: t.isValidLayer({ type: 'GPX' }),
        validGroup: t.isValidLayer({ type: 'LayerGroup' }),
        mapLayer: t.getMapLayer(t.intervals[0].service) === t.intervals[0].service,
      };
    });
    expect(result.steps).toEqual([
      {
        number: 0, tag: '2004', type: 'WMS', name: 'pnoa2004', legend: 'PNOA 2004', visible: true, displayInLayerSwitcher: false,
      },
      {
        number: 1, tag: '2005', type: 'WMS', name: 'pnoa2005', legend: 'PNOA 2005', visible: false, displayInLayerSwitcher: false,
      },
    ]);
    expect(result.wmtsApi).toMatchObject({ type: 'WMTS', name: 'OI.OrthoimageCoverage', legend: 'PNOA' });
    expect(result.wmtsApi.url).toContain('https://www.ign.es/wmts/pnoa-ma');
    expect(result.wmtsHistoric).toMatchObject({ type: 'WMTS', name: 'OI.OrthoimageCoverage' });
    expect(result.wmtsHistoric.url).toContain('https://www.ign.es/wmts/pnoa-ma');
    expect(result.wms).toMatchObject({ type: 'WMS', name: 'IGNBaseTodo', legend: 'IGN' });
    expect([result.validWMS, result.validWMTS, result.validGPX, result.validGroup])
      .toEqual([true, true, true, false]);
    expect(result.mapLayer).toBe(true);
    expect(errors).toEqual([]);
  });

  test('relative: WMS por definición filtra con CQL; WMTS es incompatible y se descarta con aviso', async ({ page }) => {
    const { errors, warnings } = await openPage(page);
    const result = await page.evaluate(async () => {
      window.map = IDEE.map({ container: 'map', controls: [] });
      window.timeline = new IDEE.control.Timeline({
        timelineType: 'relative',
        intervals: [
          {
            id: 'sismos',
            init: '2000-01-01T00:00:00Z',
            end: '2001-12-31T23:59:59Z',
            layer: 'WMS*Eventos sísmicos*https://www.ign.es/wms-inspire/geofisica*NZ.ObservedEvent',
            attributeParam: 'date',
          },
          {
            id: 'ortofoto',
            init: '2000-01-01T00:00:00Z',
            end: '2001-12-31T23:59:59Z',
            layer: 'WMTS*https://www.ign.es/wmts/pnoa-ma?*OI.OrthoimageCoverage*GoogleMapsCompatible*PNOA',
            attributeParam: 'date',
          },
        ],
      });
      window.map.addControls(window.timeline);
      await window.whenTimeline(window.map);
      const layer = window.timeline.getSelectedLayer();
      const initial = layer.cql;
      const input = window.timeline.getElement().querySelector('.m-timeline-date-init');
      input.value = '2001-01-01T00:00:00Z';
      input.dispatchEvent(new Event('focusout'));
      const changed = layer.cql;
      window.map.removeControls(window.timeline);
      return {
        selectable: window.timeline.getSelectableLayers().map((entry) => entry.id),
        type: layer.type,
        initial,
        changed,
        inMapAfterDestroy: window.map.getWMS().length,
      };
    });
    expect(result.type).toBe('WMS');
    expect(result.initial).toBe('date DURING 2000-01-01T00:00:00.000Z/2001-12-31T23:59:59.000Z');
    expect(result.changed).toBe('date DURING 2001-01-01T00:00:00.000Z/2001-12-31T23:59:59.000Z');
    expect(result.inMapAfterDestroy).toBe(0);
    expect(warnings.some((text) => text.includes('WMTS') && text.includes('relative'))).toBe(true);
    expect(errors).toEqual([]);
  });

  test('KML por definición "*": pasos en absoluteSimple y exclusión sin atributo temporal en relative', async ({ page }) => {
    const { errors } = await openPage(page);
    const result = await page.evaluate(async () => {
      const kml = `KML*kml_local*${window.location.origin}/test/playwright/fixtures/kmz/basic.kml*true`;
      window.map = IDEE.map({ container: 'map', controls: [], layers: [kml] });
      const simple = new IDEE.control.Timeline({
        timelineType: 'absoluteSimple',
        intervals: [['KML', '2020', kml]],
      });
      window.map.addControls(simple);
      await window.whenTimeline(window.map);
      const kmlLayer = window.map.getKML()[0];
      await new Promise((resolve) => {
        const check = () => (kmlLayer.getFeatures(true).length > 0 ? resolve() : setTimeout(check, 50));
        check();
      });
      const simpleState = {
        sameLayer: simple.intervals[0].service === kmlLayer,
        visible: kmlLayer.isVisible(),
        kmlCount: window.map.getKML().length,
      };
      window.map.removeControls(simple);

      const relative = new IDEE.control.Timeline({
        timelineType: 'relative',
        intervals: [{
          id: 'kml', init: '2020-01-01T00:00:00Z', end: '2020-12-31T23:59:59Z', layer: kml, attributeParam: 'time',
        }],
      });
      window.map.addControls(relative);
      await window.whenTimeline(window.map);
      return {
        simpleState,
        relative: {
          selected: relative.getSelectedLayer() === kmlLayer,
          total: kmlLayer.getFeatures(true).length,
          shown: kmlLayer.getFeatures().length,
        },
      };
    });
    expect(result.simpleState).toEqual({ sameLayer: true, visible: true, kmlCount: 1 });
    expect(result.relative.selected).toBe(true);
    expect(result.relative.total).toBeGreaterThan(0);
    expect(result.relative.shown).toBe(0);
    expect(errors).toEqual([]);
  });

  test('configuración {type: "GPX"} e instancia GPX existente (CP-035); la capa previa no se elimina', async ({ page }) => {
    const { errors } = await openPage(page);
    const result = await page.evaluate(async (gpx) => {
      window.map = IDEE.map({
        container: 'map', controls: [], layers: [{ type: 'GPX', name: 'CP-035 GPX', url: gpx }],
      });
      const capa = window.map.getGPX()[0];
      window.timeline = new IDEE.control.Timeline({
        timelineType: 'relative',
        intervals: [
          {
            id: 'gpx', init: '2020-01-01T00:00:00Z', end: '2020-12-31T23:59:59Z', layer: capa, attributeParam: 'time',
          },
          {
            id: 'objeto', init: '2021-01-01T00:00:00Z', end: '2021-12-31T23:59:59Z', layer: { type: 'GPX', name: 'gpx_objeto', url: gpx }, attributeParam: 'time',
          },
        ],
      });
      window.map.addControls(window.timeline);
      await window.whenTimeline(window.map);
      await window.whenGPXLoaded(window.map);
      const instance = capa.getFeatures().map((feature) => feature.getId()).sort();
      window.timeline.selectLayer('objeto');
      await window.whenGPXLoaded(window.map);
      const created = window.map.getGPX().map((layer) => layer.name);
      const objectShown = window.timeline.getSelectedLayer().getFeatures().map((feature) => feature.getId()).sort();
      window.map.removeControls(window.timeline);
      return {
        instance,
        created,
        objectShown,
        after: window.map.getGPX().map((layer) => [layer.name, layer.isVisible(), layer.getFeatures().length]),
      };
    }, GPX);
    expect(result.instance).toEqual(['rte-2', 'wpt-0']);
    expect(result.created).toEqual(['CP-035 GPX', 'gpx_objeto']);
    expect(result.objectShown).toEqual(['trk-3', 'wpt-1']);
    expect(result.after).toEqual([['CP-035 GPX', true, 4]]);
    expect(errors).toEqual([]);
  });

  test('retirar y volver a añadir el mismo control; eventos CHANGE y temporizadores dinámicos', async ({ page }) => {
    const { errors } = await openPage(page);
    await createGetMap(page, 'relative', RANGE_INTERVALS, ';layerPosition=2');
    const result = await page.evaluate(async () => {
      const t = window.timeline;
      const events = [];
      t.on('change', (state) => events.push(state.reason));
      t.selectLayer('por-definicion');
      t.getElement().querySelector('.m-timelineDinamic-play').click();
      const playing = t.running !== false;
      window.map.removeControls(t);
      const removed = { running: t.running, controls: window.map.getControls('timeline').length };
      window.map.addControls(t);
      await window.whenTimeline(window.map);
      return {
        events,
        playing,
        removed,
        readded: {
          selected: t.getSelectedLayer()?.name,
          noticeHidden: t.getElement().querySelector('.m-timeline-notice').hidden,
          entries: t.getSelectableLayers().length,
          groups: t.allLayersDinamic.noGroupLayer.length,
        },
      };
    });
    expect(result.events).toEqual(expect.arrayContaining(['layer', 'range', 'play']));
    expect(result.playing).toBe(true);
    expect(result.removed).toEqual({ running: false, controls: 0 });
    expect(result.readded).toEqual({
      selected: 'gpx_definicion', noticeHidden: true, entries: 3, groups: 3,
    });
    expect(errors).toEqual([]);
  });

  test('dos mapas con Timeline no comparten estado ni identificadores DOM', async ({ page }) => {
    const { errors } = await openPage(page);
    const result = await page.evaluate(async (params) => {
      const second = document.createElement('div');
      second.id = 'map2';
      second.style.height = '300px';
      document.body.appendChild(second);
      const mapA = IDEE.map({ container: 'map', ...params });
      const mapB = IDEE.map({ container: 'map2', ...params });
      const [a, b] = await Promise.all([window.whenTimeline(mapA), window.whenTimeline(mapB)]);
      await Promise.all([window.whenGPXLoaded(mapA), window.whenGPXLoaded(mapB)]);
      a.selectLayer('por-definicion');
      const idsA = [...a.getElement().querySelectorAll('[id]')].map((element) => element.id);
      const idsB = [...b.getElement().querySelectorAll('[id]')].map((element) => element.id);
      return {
        a: a.getSelectedLayer().name,
        b: b.getSelectedLayer().name,
        sharedIds: idsA.filter((id) => idsB.includes(id)),
        bVisible: mapB.getGPX().map((layer) => layer.isVisible()),
      };
    }, getParameters('relative', RANGE_INTERVALS, ';layerPosition=2'));
    expect(result).toEqual({
      a: 'gpx_definicion',
      b: 'gpx_nombre',
      sharedIds: [],
      bVisible: [true, false],
    });
    expect(errors).toEqual([]);
  });

  test('base64 en GET conserva todos los campos de las definiciones "*"', async ({ page }) => {
    await openPage(page);
    const result = await page.evaluate(async (params) => {
      window.map = IDEE.map({ container: 'map', ...params });
      window.timeline = await window.whenTimeline(window.map);
      return {
        reference: window.timeline.intervals[0].layer,
        name: window.timeline.getSelectableLayers()[0].name,
      };
    }, {
      controls: [`timeline*timelineType=relative;intervals=base64~${encodeIntervals([{
        id: 'oculta', init: '2020-01-01T00:00:00Z', end: '2021-12-31T23:59:59Z', layer: `GPX*Ruta con espacios y tildes ñ*${GPX}*true*false`, attributeParam: 'time',
      }])}`],
    });
    expect(result.reference).toBe(`GPX*Ruta con espacios y tildes ñ*${GPX}*true*false`);
    expect(result.name).toBe('Ruta con espacios y tildes ñ');
  });
  test('formatMove por defecto: inicio fijo en relative y ventana deslizante en el resto', async ({ page }) => {
    await openPage(page);
    const result = await page.evaluate(() => {
      const formatMove = (options) => new IDEE.control.Timeline({ intervals: [], ...options }).formatMove;
      return {
        relative: formatMove({ timelineType: 'relative' }),
        relativeContinuous: formatMove({ timelineType: 'relative', formatMove: 'continuous' }),
        relativeInvalid: formatMove({ timelineType: 'relative', formatMove: 'otro' }),
        absolute: formatMove({ timelineType: 'absolute' }),
        absoluteDiscrete: formatMove({ timelineType: 'absolute', formatMove: 'discrete' }),
        absoluteSimple: formatMove({ timelineType: 'absoluteSimple' }),
      };
    });
    expect(result).toEqual({
      relative: 'discrete',
      relativeContinuous: 'continuous',
      relativeInvalid: 'discrete',
      absolute: 'continuous',
      absoluteDiscrete: 'discrete',
      absoluteSimple: 'continuous',
    });
  });

  test('relative: límite inferior fijo; retroceso, avance y play solo mueven el fin', async ({ page }) => {
    const { errors } = await openPage(page);
    await createGetMap(page, 'relative', RANGE_INTERVALS, ';layerPosition=2;paramsDate=mos;stepValue=6;speedDate=0.05');
    const INIT = Date.parse('2020-01-01T00:00:00Z');
    const END = Date.parse('2021-12-31T23:59:59Z');
    const STEP = 6 * 30 * 86400000;
    const ALL = ['rte-2', 'trk-3', 'wpt-0', 'wpt-1'];
    const FIRST_YEAR = ['rte-2', 'wpt-0'];
    const click = (action) => page.evaluate((name) => {
      const t = window.timeline;
      t.getElement().querySelector(`[data-timeline-action="${name}"]`).click();
      return {
        init: t.date.init,
        end: t.date.end,
        shown: t.getSelectedLayer().getFeatures().map((feature) => feature.getId()).sort(),
      };
    }, action);

    expect(await click('back')).toEqual({ init: INIT, end: END - STEP, shown: ALL });
    expect(await click('back')).toEqual({ init: INIT, end: END - 2 * STEP, shown: ALL });
    expect(await click('back')).toEqual({ init: INIT, end: END - 3 * STEP, shown: FIRST_YEAR });
    expect(await click('back')).toEqual({ init: INIT, end: END - 4 * STEP, shown: FIRST_YEAR });
    // El fin nunca queda por debajo del inicio.
    expect(await click('back')).toEqual({ init: INIT, end: INIT, shown: [] });
    expect(await click('back')).toEqual({ init: INIT, end: INIT, shown: [] });
    expect(await click('forward')).toEqual({ init: INIT, end: INIT + STEP, shown: FIRST_YEAR });

    // Play: avanza un paso en el acto y sigue hasta el final, donde se detiene.
    await page.evaluate(() => {
      window.ranges = [];
      window.timeline.on('change', ({ reason, date }) => {
        if (reason === 'range') window.ranges.push(date);
      });
      window.timeline.getPlayTimeButton().click();
    });
    expect(await page.evaluate(() => window.timeline.running !== false)).toBe(true);
    await page.waitForFunction(() => window.timeline.running === false);
    const played = await page.evaluate(() => ({
      ranges: window.ranges,
      icon: window.timeline.getPlayTimeButton().classList.contains('g-cartografia-control-siguiente'),
      title: window.timeline.getPlayTimeButton().title === IDEE.language.getValue('timeline').play,
      shown: window.timeline.getSelectedLayer().getFeatures().length,
    }));
    expect(played.ranges.map(({ init }) => init).every((init) => init === INIT)).toBe(true);
    expect(played.ranges.map(({ end }) => end)).toEqual([INIT + 2 * STEP, INIT + 3 * STEP, INIT + 4 * STEP, END]);
    expect(played).toEqual(expect.objectContaining({ icon: true, title: true, shown: 4 }));

    // Play desde el final vuelve a empezar; un segundo clic lo pausa.
    const replay = await page.evaluate(() => {
      const t = window.timeline;
      t.speedDate = 10;
      t.getPlayTimeButton().click();
      const state = { running: t.running !== false, end: t.date.end, paused: t.getPlayTimeButton().classList.contains('g-cartografia-control-pausa') };
      t.getPlayTimeButton().click();
      return { ...state, afterPause: t.running };
    });
    expect(replay).toEqual({
      running: true, end: INIT + STEP, paused: true, afterPause: false,
    });
    expect(errors).toEqual([]);
  });

  test('relative con formatMove continuous: la ventana avanza y retrocede con ancho constante', async ({ page }) => {
    const { errors } = await openPage(page);
    await createGetMap(page, 'relative', RANGE_INTERVALS, ';layerPosition=2;formatMove=continuous;paramsDate=mos;stepValue=6');
    const INIT = Date.parse('2020-01-01T00:00:00Z');
    const END = Date.parse('2021-12-31T23:59:59Z');
    const WIDTH = Date.parse('2020-07-01T00:00:00Z') - INIT;
    const result = await page.evaluate(() => {
      const t = window.timeline;
      const input = t.getElement().querySelector('.m-timeline-date-end');
      input.value = '2020-07-01T00:00:00Z';
      input.dispatchEvent(new Event('focusout'));
      const move = (action) => {
        const ranges = [];
        for (let i = 0; i < 6; i += 1) {
          t.getElement().querySelector(`[data-timeline-action="${action}"]`).click();
          ranges.push({ ...t.date });
        }
        return ranges;
      };
      return { forward: move('forward'), back: move('back') };
    });
    expect(result.forward.every(({ init, end }) => end - init === WIDTH)).toBe(true);
    expect(result.back.every(({ init, end }) => end - init === WIDTH)).toBe(true);
    expect(result.forward.at(-1).end).toBe(END);
    expect(result.forward.at(-2).end).toBe(END);
    expect(result.back.at(-1).init).toBe(INIT);
    expect(errors).toEqual([]);
  });

  test('absoluteSimple: retroceso, avance y play/pausa recorren los pasos y se detienen en el último', async ({ page }) => {
    const { errors } = await openPage(page);
    await createGetMap(page, 'absoluteSimple', [
      ['GPX por nombre', '2020', 'gpx_nombre'],
      ['GPX por definición', '2021', `GPX*gpx_definicion*${GPX}*true*true`],
      ['GPX creada', '2022', `GPX*gpx_creada*${GPX}*true*false`],
    ], ';layerPosition=1;speed=0.05');
    const click = (action) => page.evaluate((name) => {
      const t = window.timeline;
      t.getElement().querySelector(`[data-timeline-action="${name}"]`).click();
      return [
        Number(t.getElement().querySelector('.m-timeline-slider-input').value),
        window.map.getGPX().filter((layer) => layer.isVisible()).map((layer) => layer.name),
      ];
    }, action);
    expect(await click('back')).toEqual([0, ['gpx_nombre']]);
    expect(await click('back')).toEqual([0, ['gpx_nombre']]);
    expect(await click('forward')).toEqual([1, ['gpx_definicion']]);
    expect(await click('forward')).toEqual([2, ['gpx_creada']]);
    expect(await click('forward')).toEqual([2, ['gpx_creada']]);

    // Play en el último paso vuelve al primero; durante la reproducción los selectores
    // de capa están desactivados.
    const playing = await page.evaluate(() => {
      const t = window.timeline;
      t.getPlayTimeButton().click();
      const button = t.getPlayTimeButton();
      return {
        step: Number(t.getElement().querySelector('.m-timeline-slider-input').value),
        running: t.running !== false,
        icon: button.classList.contains('g-cartografia-control-pausa'),
        title: button.title === IDEE.language.getValue('timeline').pause,
        label: button.getAttribute('aria-label') === button.title,
        selectorDisabled: t.getElement().querySelector('.m-timeline-names').disabled,
      };
    });
    expect(playing).toEqual({
      step: 0, running: true, icon: true, title: true, label: true, selectorDisabled: true,
    });
    await page.waitForFunction(() => window.timeline.running === false);
    const stopped = await page.evaluate(() => {
      const t = window.timeline;
      return {
        step: Number(t.getElement().querySelector('.m-timeline-slider-input').value),
        icon: t.getPlayTimeButton().classList.contains('g-cartografia-control-siguiente'),
        title: t.getPlayTimeButton().title === IDEE.language.getValue('timeline').play,
        selectorDisabled: t.getElement().querySelector('.m-timeline-names').disabled,
      };
    });
    expect(stopped).toEqual({
      step: 2, icon: true, title: true, selectorDisabled: false,
    });

    // Avanzar durante la reproducción la pausa.
    const forwarded = await page.evaluate(() => {
      const t = window.timeline;
      t.speed = 10;
      t.playTimeline(false);
      t.getElement().querySelector('[data-timeline-action="forward"]').click();
      return {
        step: Number(t.getElement().querySelector('.m-timeline-slider-input').value),
        running: t.running,
      };
    });
    expect(forwarded).toEqual({ step: 1, running: false });
    expect(errors).toEqual([]);
  });

  test('selector de velocidad: ×1 por defecto y velocidad configurada preseleccionada o añadida', async ({ page }) => {
    const { errors } = await openPage(page);
    await createGetMap(page, 'relative', RANGE_INTERVALS, ';layerPosition=2');
    const result = await page.evaluate(async (intervals) => {
      const simple = [['A', '2020', 'gpx_nombre'], ['B', '2021', 'gpx_definicion']];
      const add = async (options) => {
        window.map.removeControls(window.map.getControls('timeline'));
        const t = options instanceof IDEE.control.Timeline ? options : new IDEE.control.Timeline({
          collapsible: false, collapsed: false, ...options,
        });
        window.map.addControls(t);
        await window.whenTimeline(window.map);
        return t;
      };
      const read = (t) => {
        const select = t.getElement().querySelector('.m-timeline-speed');
        return {
          values: [...select.options].map((option) => option.value),
          texts: [...select.options].map((option) => option.textContent),
          titles: [...select.options].map((option) => option.title),
          selected: select.value,
        };
      };
      const relative = { timelineType: 'relative', intervals };
      const byDefault = read(await add(relative));
      const four = read(await add({ ...relative, speedDate: 4 }));
      const three = await add({ ...relative, speedDate: 3 });
      const threeState = read(three);
      const events = [];
      three.on('change', ({ reason }) => events.push(reason));
      const select = three.getElement().querySelector('.m-timeline-speed');
      select.value = '2';
      select.dispatchEvent(new Event('change'));
      const changed = { speedDate: three.speedDate, events: [...events] };
      // El control conserva la velocidad elegida al volver a añadirse.
      const readded = read(await add(three));
      const simpleDefault = read(await add({ timelineType: 'absoluteSimple', intervals: simple }));
      const simpleFour = read(await add({ timelineType: 'absoluteSimple', intervals: simple, speed: 0.25 }));
      return {
        byDefault, four, threeState, changed, readded, simpleDefault, simpleFour,
      };
    }, RANGE_INTERVALS);
    expect(result.byDefault).toEqual({
      values: ['0.5', '1', '2', '3', '5'],
      texts: ['×0,5', '×1', '×2', '×3', '×5'],
      titles: ['4 s por paso', '2 s por paso', '1 s por paso', '0,67 s por paso', '0,4 s por paso'],
      selected: '1',
    });
    expect(result.four.values).toEqual(['0.5', '1', '2', '3', '5']);
    expect(result.four.selected).toBe('0.5');
    expect(result.threeState).toEqual({
      values: ['0.5', '0.67', '1', '2', '3', '5'],
      texts: ['×0,5', '×0,67', '×1', '×2', '×3', '×5'],
      titles: ['4 s por paso', '3 s por paso', '2 s por paso', '1 s por paso', '0,67 s por paso', '0,4 s por paso'],
      selected: '0.67',
    });
    expect(result.changed).toEqual({ speedDate: 1, events: ['speed'] });
    expect(result.readded.values).toEqual(['0.5', '1', '2', '3', '5']);
    expect(result.readded.selected).toBe('2');
    expect(result.simpleDefault.titles).toEqual(['2 s por paso', '1 s por paso', '0,5 s por paso', '0,33 s por paso', '0,2 s por paso']);
    expect(result.simpleDefault.selected).toBe('1');
    expect(result.simpleFour.values).toEqual(['0.5', '1', '2', '3', '4', '5']);
    expect(result.simpleFour.selected).toBe('4');
    expect(errors).toEqual([]);
  });

  test('velocidad: el cambio se aplica en el siguiente paso sin cortar la reproducción', async ({ page }) => {
    const { errors } = await openPage(page);
    await createGetMap(page, 'relative', RANGE_INTERVALS, ';layerPosition=2;paramsDate=mos;stepValue=1;speedDate=0.04');
    const result = await page.evaluate(async () => {
      const t = window.timeline;
      const delays = [];
      const original = window.setTimeout;
      window.setTimeout = (callback, delay, ...rest) => {
        delays.push(delay);
        return original(callback, delay, ...rest);
      };
      try {
        t.getPlayTimeButton().click();
        const select = t.getElement().querySelector('.m-timeline-speed');
        select.value = '3';
        select.dispatchEvent(new Event('change'));
        await new Promise((resolve) => {
          t.on('change', ({ reason }) => {
            if (reason === 'range') resolve();
          });
        });
        const state = {
          speedDate: t.speedDate,
          running: t.running !== false,
          delays: delays.filter((delay) => Math.abs(delay - 40) < 1e-6 || Math.abs(delay - 2000 / 3) < 1e-6)
            .map(Math.round),
        };
        t.playTimeline(false);
        return state;
      } finally {
        window.setTimeout = original;
      }
    });
    expect(result).toEqual({ speedDate: 2 / 3, running: true, delays: [40, 667] });
    expect(errors).toEqual([]);
  });

  test('animation=false oculta play/pausa y la velocidad y mantiene avance y retroceso', async ({ page }) => {
    const { errors } = await openPage(page);
    await createGetMap(page, 'absoluteSimple', [
      ['GPX por nombre', '2020', 'gpx_nombre'],
      ['GPX por definición', '2021', `GPX*gpx_definicion*${GPX}*true*true`],
    ], ';animation=false');
    const visible = () => page.evaluate(() => {
      const element = window.map.getControls('timeline')[0].getElement();
      const shown = (selector) => window.getComputedStyle(element.querySelector(selector)).display !== 'none';
      return {
        back: shown('[data-timeline-action="back"]'),
        play: shown('[data-timeline-action="play"]'),
        forward: shown('[data-timeline-action="forward"]'),
        speed: shown('.m-timeline-speed'),
      };
    });
    expect(await visible()).toEqual({
      back: true, play: false, forward: true, speed: false,
    });
    await page.evaluate(async (intervals) => {
      window.map.removeControls(window.map.getControls('timeline'));
      window.map.addControls(new IDEE.control.Timeline({
        timelineType: 'relative', animation: false, collapsible: false, collapsed: false, intervals,
      }));
      await window.whenTimeline(window.map);
    }, RANGE_INTERVALS);
    expect(await visible()).toEqual({
      back: true, play: false, forward: true, speed: false,
    });
    expect(errors).toEqual([]);
  });

  test('iconos de icons_cota y textos traducidos (es, en, ca) en los tres modos', async ({ page }) => {
    const { errors } = await openPage(page);
    await createGetMap(page, 'relative', RANGE_INTERVALS);
    const mismatches = await page.evaluate(async (intervals) => {
      const simple = [['A', '2020', 'gpx_nombre'], ['B', '2021', 'gpx_definicion'], ['C', '2022', 'gpx_nombre']];
      const icon = (element) => {
        const style = window.getComputedStyle(element, '::before');
        return style.maskImage || style.webkitMaskImage;
      };
      const errorsFound = [];
      const check = (condition, message) => {
        if (!condition) errorsFound.push(message);
      };
      /* eslint-disable no-restricted-syntax, no-await-in-loop */
      for (const lang of ['es', 'en', 'ca']) {
        IDEE.language.setLang(lang);
        const text = IDEE.language.getValue('timeline');
        for (const timelineType of ['absoluteSimple', 'absolute', 'relative']) {
          const where = `${lang}/${timelineType}`;
          window.map.removeControls(window.map.getControls('timeline'));
          const t = new IDEE.control.Timeline({
            timelineType,
            collapsible: false,
            collapsed: false,
            intervals: timelineType === 'absoluteSimple' ? simple : intervals,
          });
          window.map.addControls(t);
          await window.whenTimeline(window.map);
          const element = t.getElement();
          const [back, play, forward] = ['back', 'play', 'forward']
            .map((action) => element.querySelector(`[data-timeline-action="${action}"]`));
          const speed = element.querySelector('.m-timeline-speed');
          const group = element.querySelector('.m-timeline-transport');
          [[back, text.previous, 'icn_chevron'], [play, text.play, 'icn_play'], [forward, text.next, 'icn_chevron']]
            .forEach(([button, label, svg]) => {
              check(button.title === label && button.getAttribute('aria-label') === label, `${where}: texto de ${button.dataset.timelineAction}`);
              check(button.textContent.trim() === '', `${where}: ${button.dataset.timelineAction} con texto visible`);
              check(icon(button).includes(`icons_cota/${svg}.svg`), `${where}: icono de ${button.dataset.timelineAction} (${icon(button)})`);
            });
          check(speed.title === text.speed && speed.getAttribute('aria-label') === text.speed, `${where}: texto de la velocidad`);
          check(speed.options[1].title === text.speed_option.replace('{seconds}', timelineType === 'absoluteSimple' ? '1' : '2'), `${where}: opción de velocidad`);
          check(group.getAttribute('aria-label') === text.playback, `${where}: grupo`);
          play.click();
          check(play.title === text.pause && play.getAttribute('aria-label') === text.pause, `${where}: texto de pausa`);
          check(icon(play).includes('icons_cota/icn_pausa.svg'), `${where}: icono de pausa (${icon(play)})`);
          play.click();
          check(t.running === false, `${where}: pausa`);
        }
      }
      /* eslint-enable no-restricted-syntax, no-await-in-loop */
      IDEE.language.setLang('es');
      return errorsFound;
    }, RANGE_INTERVALS);
    expect(mismatches).toEqual([]);
    expect(errors).toEqual([]);
  });
  test('modelo de recorrido: líneas, segmentos, puntos, fechas no válidas y coordenadas no válidas', async ({ page }) => {
    const { errors } = await openPage(page);
    await createTrackMap(page);
    const result = await page.evaluate(() => {
      // eslint-disable-next-line no-underscore-dangle
      const TrackPath = window.timeline.track_.getPath().constructor;
      const feature = (geometry, properties = {}) => ({
        getGeometry: () => geometry,
        getAttribute: (key) => properties[key],
      });
      const line = (coordinates, properties) => feature({ type: 'LineString', coordinates }, properties);
      const multi = (coordinates, properties) => feature({ type: 'MultiLineString', coordinates }, properties);
      const point = (coordinates, properties) => feature({ type: 'Point', coordinates }, properties);
      const context = { key: 'k', label: 'L', layer: null };
      const summary = (path) => ({
        size: path.size,
        timed: path.timed,
        issue: path.timeIssue,
        length: path.length,
        segments: path.segments.map((samples) => samples
          .map(({
            coordinate, index, segment, offset, time,
          }) => [...coordinate, index, segment, offset, time])),
      });
      const t = (minute) => `2021-06-05T08:${String(minute).padStart(2, '0')}:00Z`;
      const ms = (minute) => Date.parse(t(minute));
      const timesIssue = (coordTimes) => TrackPath.fromLine(line([[0, 0], [1, 0], [2, 0]], { coordTimes }), context).timeIssue;
      const order = (features) => TrackPath.fromPoints(features, { ...context, kind: 'points' });
      return {
        line: summary(TrackPath.fromLine(line([[0, 0, 1200], [3, 4, 1210], [3, 10, 1220]], { coordTimes: [t(0), t(1), t(2)] }), context)),
        multi: summary(TrackPath.fromLine(multi([[[0, 0], [0, 5], [Number.NaN, 1], null]], { coordTimes: null }), context)),
        segments: summary(TrackPath.fromLine(multi([[[0, 0], [0, 5]], [], [[100, 0], [100, 10]]]), context)),
        multiTimes: summary(TrackPath.fromLine(multi([[[0, 0], [0, 5]], [[100, 0], [100, 10]]], { coordTimes: [[t(0), t(5)], [t(20), t(30)]] }), context)),
        mismatch: timesIssue([t(0), t(1)]),
        invalid: timesIssue([t(0), 'no es una fecha', t(2)]),
        incomplete: timesIssue([t(0), null, t(2)]),
        unordered: timesIssue([t(0), t(10), t(5)]),
        timedPoints: summary(order([point([1, 1], { time: t(10) }), point([2, 2], { time: t(0) }), point([3, 3], { time: t(20) })])),
        untimedPoints: summary(order([point([3, 3]), point([1, 1]), point([2, 2])])),
        partialPoints: summary(order([point([3, 3], { time: t(10) }), point([1, 1]), point([2, 2], { time: t(0) })])),
        invalidPoints: summary(order([point([Number.NaN, 1]), point(null), point([5, 5])])),
        empty: summary(TrackPath.fromLine(line([]), context)),
        missing: summary(TrackPath.fromLine(feature(null), context)),
        ms: [ms(0), ms(1), ms(2), ms(5), ms(20), ms(30), ms(10)],
      };
    });
    const [m0, m1, m2, m5, m20, m30, m10] = result.ms;
    expect(result.line).toEqual({
      size: 3, timed: true, issue: null, length: 11, segments: [[[0, 0, 0, 0, 0, m0], [3, 4, 1, 0, 5, m1], [3, 10, 2, 0, 11, m2]]],
    });
    expect(result.multi).toEqual({
      size: 2, timed: false, issue: null, length: 5, segments: [[[0, 0, 0, 0, 0, null], [0, 5, 1, 0, 5, null]]],
    });
    expect(result.segments).toEqual({
      size: 4,
      timed: false,
      issue: null,
      length: 15,
      segments: [[[0, 0, 0, 0, 0, null], [0, 5, 1, 0, 5, null]], [[100, 0, 2, 1, 0, null], [100, 10, 3, 1, 10, null]]],
    });
    expect(result.multiTimes).toEqual(expect.objectContaining({
      timed: true, issue: null, length: 15, segments: [[[0, 0, 0, 0, 0, m0], [0, 5, 1, 0, 5, m5]], [[100, 0, 2, 1, 0, m20], [100, 10, 3, 1, 10, m30]]],
    }));
    expect([result.mismatch, result.invalid, result.incomplete, result.unordered])
      .toEqual(['mismatch', 'invalid', 'incomplete', 'unordered']);
    expect(result.timedPoints.segments[0].map(([x, y, , , , time]) => [x, y, time]))
      .toEqual([[2, 2, m0], [1, 1, m10], [3, 3, m20]]);
    expect(result.untimedPoints).toEqual(expect.objectContaining({ timed: false, issue: null }));
    expect(result.untimedPoints.segments[0].map(([x, y]) => [x, y])).toEqual([[3, 3], [1, 1], [2, 2]]);
    expect(result.partialPoints).toEqual(expect.objectContaining({ timed: false, issue: 'incomplete' }));
    expect(result.partialPoints.segments[0].map(([x, y, , , , time]) => [x, y, time])).toEqual([[3, 3, null], [1, 1, null], [2, 2, null]]);
    expect(result.invalidPoints).toEqual(expect.objectContaining({ size: 1, segments: [[[5, 5, 0, 0, 0, null]]] }));
    expect(result.empty).toEqual({
      size: 0, timed: false, issue: null, length: 0, segments: [],
    });
    expect(result.missing.size).toBe(0);
    expect(errors).toEqual([]);
  });

  test('modelo de reproducción: posición temporal sin cruzar huecos entre segmentos y posición secuencial', async ({ page }) => {
    const { errors } = await openPage(page);
    await createTrackMap(page);
    const result = await page.evaluate(() => {
      // eslint-disable-next-line no-underscore-dangle
      const { track_: track } = window.timeline;
      const TrackPath = track.getPath().constructor;
      const TrackPlayback = track.getPlayback().constructor;
      const geometry = { type: 'MultiLineString', coordinates: [[[0, 0], [10, 0], [10, 10]], [[50, 0], [60, 0]]] };
      const build = (properties) => TrackPath.fromLine({
        getGeometry: () => geometry,
        getAttribute: (key) => properties[key],
      }, { key: 'k', label: 'L', layer: null });
      const timed = new TrackPlayback(build({ coordTimes: [[1000, 11000, 21000], [41000, 51000]] }));
      const sequential = new TrackPlayback(build({}));
      const view = (position) => position && {
        state: position.state,
        coordinate: position.coordinate,
        segment: position.segment,
        segmentFraction: position.segmentFraction,
        fraction: position.fraction,
        heading: position.heading,
        travelled: position.travelled.filter((part) => part.length > 0),
      };
      const moves = [];
      for (let i = 0; i < 5; i += 1) moves.push(timed.stepForward());
      const atEnd = timed.isAtEnd();
      const back = timed.stepBackward();
      const rewind = timed.rewind();
      const afterRewind = timed.step;
      timed.seek(10);
      const clampedHigh = timed.step;
      timed.seek(-3);
      const clampedLow = timed.step;
      return {
        steps: timed.steps,
        interval: timed.interval,
        stepTime: timed.timeAtStep(2),
        stepInGap: view(timed.positionAtStep(2)),
        inside: view(timed.positionAtTime(6000)),
        gap: view(timed.positionAtTime(31000)),
        second: view(timed.positionAtTime(46000)),
        window: view(timed.positionAtTime(46000, 16000)),
        before: view(timed.positionAtTime(500)),
        after: view(timed.positionAtTime(99999)),
        moves,
        atEnd,
        back,
        rewind,
        afterRewind,
        clampedHigh,
        clampedLow,
        sequentialSteps: sequential.steps,
        sequentialTime: sequential.positionAtTime(6000),
        sequential: view(sequential.positionAtSample(3)),
        sequentialEnd: view(sequential.positionAtSample(4)),
      };
    });
    expect(result.steps).toBe(4);
    expect(result.interval).toBe(12500);
    expect(result.stepTime).toBe(26000);
    expect(result.stepInGap).toEqual(expect.objectContaining({ coordinate: [10, 10], segment: 0, segmentFraction: 1 }));
    expect(result.inside).toEqual({
      state: 'inside', coordinate: [5, 0], segment: 0, segmentFraction: 0.25, fraction: 0.1, heading: 0, travelled: [[[0, 0], [5, 0]]],
    });
    expect(result.gap).toEqual({
      state: 'inside', coordinate: [10, 10], segment: 0, segmentFraction: 1, fraction: 0.6, heading: Math.PI / 2, travelled: [[[0, 0], [10, 0], [10, 10]]],
    });
    expect(result.second).toEqual({
      state: 'inside',
      coordinate: [55, 0],
      segment: 1,
      segmentFraction: 0.5,
      fraction: 0.9,
      heading: 0,
      travelled: [[[0, 0], [10, 0], [10, 10]], [[50, 0], [55, 0]]],
    });
    expect(result.window.travelled).toEqual([[[10, 5], [10, 10]], [[50, 0], [55, 0]]]);
    expect(result.before).toEqual(expect.objectContaining({ state: 'before', coordinate: null, travelled: [] }));
    expect(result.after).toEqual(expect.objectContaining({ state: 'end', coordinate: [60, 0], fraction: 1 }));
    expect(result.moves).toEqual([true, true, true, true, false]);
    expect([result.atEnd, result.back, result.rewind, result.afterRewind]).toEqual([true, true, true, 0]);
    expect([result.clampedHigh, result.clampedLow]).toEqual([4, 0]);
    expect(result.sequentialSteps).toBe(4);
    expect(result.sequentialTime).toBeNull();
    expect(result.sequential).toEqual({
      state: 'inside', coordinate: [50, 0], segment: 1, segmentFraction: 0, fraction: 0.75, heading: 0, travelled: [[[0, 0], [10, 0], [10, 10]], [[50, 0]]],
    });
    expect(result.sequentialEnd).toEqual(expect.objectContaining({ state: 'end', coordinate: [60, 0], fraction: 1 }));
    expect(errors).toEqual([]);
  });

  test('track: GPX por GET con layerPosition, selector de capa y objeto y recorrido temporal por segmentos', async ({ page }) => {
    const { errors } = await openPage(page);
    await createTrackMap(page);
    await page.evaluate(() => {
      window.changes = [];
      window.timeline.on(IDEE.evt.CHANGE, ({ reason, track }) => window.changes.push([reason, track?.step ?? null]));
    });
    const segments = await routeSegments(page, 'Ruta Cercedilla - Bola del Mundo');
    expect(segments.map((segment) => segment.length)).toEqual([6, 8, 6]);
    expect(await trackOf(page)).toEqual(expect.objectContaining({
      layer: 'ruta_guadarrama',
      key: 'line:trk-4',
      label: 'Ruta Cercedilla - Bola del Mundo',
      kind: 'line',
      timed: true,
      synchronized: false,
      step: 0,
      steps: 19,
      segment: 0,
      fraction: 0,
      time: Date.parse('2021-06-05T08:00:00Z'),
      coordinate: segments[0][0],
    }));
    const dom = await trackDom(page);
    expect(dom).toEqual(expect.objectContaining({
      hidden: false,
      layers: ['[1] ruta_penalara', '[2] ruta_guadarrama'],
      layer: '[2] ruta_guadarrama',
      features: [
        'Líneas: Ruta Cercedilla - Bola del Mundo',
        'Líneas: Variante sin horario: Puerto de Navacerrada - Siete Picos',
        'Recorrido por puntos: Todos los puntos de la capa (4)',
      ],
      featuresHidden: false,
      feature: 'line:trk-4',
      pick: 'false',
      profile: 'false',
      progress: { max: 19, value: 0, disabled: false },
      message: '',
    }));
    expect(dom.status).toMatch(/\(00:00:00 de 05:05:00\) · Segmento 1 de 3$/);
    expect(dom.status).not.toContain('%');
    expect(await page.evaluate(() => window.timeline.getSelectableLayers()
      .map(({ id, position, selected }) => [id, position, selected])))
      .toEqual([['ruta_penalara', 1, false], ['ruta_guadarrama', 2, true]]);
    expect(await page.evaluate(() => window.timeline.getSelectedLayer().name)).toBe('ruta_guadarrama');

    const drawn = await olTrack(page);
    expect(drawn.full).toEqual(segments);
    expect(drawn.ends).toEqual(segments.flatMap((segment) => [segment[0], segment[segment.length - 1]]));
    expect(drawn.marker).toEqual(segments[0][0]);
    expect(drawn.style).toEqual(await page.evaluate(() => {
      const css = window.getComputedStyle(document.documentElement);
      const primary = css.getPropertyValue('--idee-color-primary').trim();
      const secondary = css.getPropertyValue('--idee-color-primary-dark').trim();
      return {
        travelled: primary, full: secondary, dashed: true, marker: primary,
      };
    }));

    await clickAction(page, 'forward', 7);
    const moved = await trackOf(page);
    expect(moved).toEqual(expect.objectContaining({ step: 7, segment: 1 }));
    const after = await olTrack(page);
    expect(after.travelled).toHaveLength(2);
    expect(after.travelled[0]).toEqual(segments[0]);
    expect(after.travelled[1].slice(0, 3)).toEqual(segments[1].slice(0, 3));
    expect(after.travelled[1]).toHaveLength(4);
    expect(after.marker).toEqual(after.travelled[1][3]);
    expect((await trackDom(page)).status).toContain('Segmento 2 de 3');

    await clickAction(page, 'back');
    expect((await trackOf(page)).step).toBe(6);

    await chooseValue(page, '.m-timeline-track-layer', '0');
    expect(await trackOf(page)).toEqual(expect.objectContaining({
      layer: 'ruta_penalara', key: 'line:trk-4', step: 0, steps: 9, timed: true,
    }));
    expect((await trackDom(page)).features).toEqual([
      'Líneas: Ruta alternativa sin horario: Cotos - Laguna Grande',
      'Líneas: Ruta Cotos - Peñalara - Laguna Grande',
      'Recorrido por puntos: Todos los puntos de la capa (3)',
    ]);
    await chooseValue(page, '.m-timeline-track-feature', 'line:rte-3');
    expect(await trackOf(page)).toEqual(expect.objectContaining({
      key: 'line:rte-3', timed: false, steps: 4, time: null,
    }));
    expect(await trackDom(page)).toEqual(expect.objectContaining({ status: 'Posición 1 de 5', message: '' }));
    expect(await page.evaluate(() => [...window.timeline.getElement().querySelectorAll('.m-timeline-speed option')]
      .map((option) => option.title).slice(0, 2))).toEqual(['2 s por posición', '1 s por posición']);

    expect(await page.evaluate(() => window.timeline.selectLayer(2))).toBe(true);
    expect(await trackOf(page)).toEqual(expect.objectContaining({ layer: 'ruta_guadarrama', key: 'line:trk-4' }));
    expect(await page.evaluate(() => window.changes.map(([reason]) => reason)))
      .toEqual(['position', 'position', 'position', 'position', 'position', 'position', 'position', 'position', 'track', 'track', 'track']);
    expect(errors).toEqual([]);
  });

  test('track: el transporte común reproduce, pausa, reanuda, cambia la velocidad, termina y vuelve a empezar', async ({ page }) => {
    const { errors } = await openPage(page);
    await createTrackMap(page, 'timeline*timelineType=track;collapsible=false;collapsed=false;layerPosition=2;speed=0.05');
    const step = async () => (await trackOf(page)).step;
    await clickAction(page, 'play');
    expect(await page.evaluate(() => window.timeline.running !== false)).toBe(true);
    await expect.poll(step).toBeGreaterThan(1);
    await clickAction(page, 'play');
    expect(await page.evaluate(() => window.timeline.running)).toBe(false);
    const paused = await trackOf(page);
    await page.waitForTimeout(300);
    expect(await trackOf(page)).toEqual(paused);

    await clickAction(page, 'play');
    await expect.poll(step).toBeGreaterThan(paused.step);
    await chooseValue(page, '.m-timeline-speed', '5');
    expect(await page.evaluate(() => ({ speed: window.timeline.speed, running: window.timeline.running !== false })))
      .toEqual({ speed: 0.2, running: true });
    await page.waitForFunction(() => window.timeline.running === false, null, { timeout: 15000 });
    expect(await trackOf(page)).toEqual(expect.objectContaining({ step: 19, fraction: 1 }));
    expect(await page.evaluate(() => window.timeline.getElement().querySelector('[data-timeline-action="play"]').title))
      .toBe('Iniciar');

    await clickAction(page, 'play');
    expect(await step()).toBeLessThan(19);
    await clickAction(page, 'play');

    await chooseValue(page, '.m-timeline-track-progress', '10');
    expect(await trackOf(page)).toEqual(expect.objectContaining({ step: 10 }));
    await clickAction(page, 'forward');
    expect(await step()).toBe(11);
    await clickAction(page, 'back');
    await clickAction(page, 'back');
    expect(await step()).toBe(9);
    expect((await trackDom(page)).progress).toEqual({ max: 19, value: 9, disabled: false });
    expect(errors).toEqual([]);
  });

  test('track: recorridos por puntos (con fechas, sin fechas o incompletas) y elección de líneas y puntos en el mapa', async ({ page }) => {
    const { errors } = await openPage(page);
    const points = {
      p1: [-447000, 4984000],
      p2: [-446000, 4984500],
      p3: [-445000, 4984200],
      q1: [-447500, 4980000],
      q2: [-446500, 4980400],
      q3: [-445500, 4980100],
      r1: [-443000, 4982000],
      r2: [-442500, 4982500],
    };
    await page.evaluate(async (coords) => {
      window.map = IDEE.map({ container: 'map', center: [-445500, 4982000], zoom: 14 });
      const vector = (name, features) => {
        const layer = new IDEE.layer.Vector({ name });
        window.map.addLayers(layer);
        layer.addFeatures(features.map(([id, geometry, properties]) => new IDEE.Feature(id, { type: 'Feature', geometry, properties })));
        return layer;
      };
      vector('puntos', [
        ['p1', { type: 'Point', coordinates: coords.p1 }, { name: 'P1', time: '2021-06-05T10:00:00Z' }],
        ['p2', { type: 'Point', coordinates: coords.p2 }, { name: 'P2', time: '2021-06-05T09:00:00Z' }],
        ['p3', { type: 'Point', coordinates: coords.p3 }, { name: 'P3', time: '2021-06-05T11:00:00Z' }],
      ]);
      vector('sin_tiempo', [
        ['q1', { type: 'Point', coordinates: coords.q1 }, { name: 'Q1' }],
        ['q2', { type: 'Point', coordinates: coords.q2 }, { name: 'Q2' }],
        ['q3', { type: 'Point', coordinates: coords.q3 }, { name: 'Q3' }],
        ['l1', { type: 'LineString', coordinates: [[-448000, 4982000], [-447000, 4982300], [-446000, 4981800]] }, {}],
      ]);
      vector('parcial', [
        ['r1', { type: 'Point', coordinates: coords.r1 }, { time: '2021-06-05T09:00:00Z' }],
        ['r2', { type: 'Point', coordinates: coords.r2 }, {}],
      ]);
      window.map.addControls(new IDEE.control.Timeline({
        timelineType: 'track', collapsible: false, collapsed: false, position: 'right', track: { layer: 'puntos' },
      }));
      window.timeline = await window.whenTimeline(window.map);
    }, points);
    expect(await trackOf(page)).toEqual(expect.objectContaining({
      layer: 'puntos', key: 'points', kind: 'points', timed: true, steps: 2,
    }));
    expect((await olTrack(page)).full).toEqual([[points.p2, points.p1, points.p3]]);
    expect(await trackDom(page)).toEqual(expect.objectContaining({
      features: ['Recorrido por puntos: Todos los puntos de la capa (3)'], featuresHidden: true,
    }));

    expect(await page.evaluate(() => window.timeline.selectTrack({ layer: 'parcial' }))).toBe(true);
    expect(await trackOf(page)).toEqual(expect.objectContaining({ layer: 'parcial', timed: false, steps: 1 }));
    expect(await trackDom(page)).toEqual(expect.objectContaining({
      message: 'Los tiempos del recorrido están incompletos o no son válidos: se recorre en el orden de sus puntos.',
      status: 'Posición 1 de 2',
    }));
    expect((await olTrack(page)).full).toEqual([[points.r1, points.r2]]);

    expect(await page.evaluate(() => window.timeline.selectTrack({ layer: 'sin_tiempo' }))).toBe(true);
    expect(await trackOf(page)).toEqual(expect.objectContaining({
      layer: 'sin_tiempo', key: 'line:l1', kind: 'line', label: 'Recorrido 1', timed: false,
    }));
    expect((await trackDom(page)).features).toEqual(['Líneas: Recorrido 1', 'Recorrido por puntos: Todos los puntos de la capa (3)']);
    expect(await page.evaluate(() => window.timeline.selectTrack({ layer: 'sin_tiempo', feature: ['q3', 'q1'] }))).toBe(true);
    expect(await trackOf(page)).toEqual(expect.objectContaining({ key: 'picked', kind: 'picked', steps: 1 }));
    expect((await olTrack(page)).full).toEqual([[points.q1, points.q3]]);

    await watchFeatureHandler(page);
    await page.evaluate(() => window.timeline.selectTrack({ layer: 'sin_tiempo' }));
    await page.evaluate(() => window.timeline.getElement().querySelector('.m-timeline-track-pick').click());
    expect(await page.evaluate(() => ({
      pressed: window.timeline.getElement().querySelector('.m-timeline-track-pick').getAttribute('aria-pressed'),
      picking: window.map.getContainer().classList.contains('m-timeline-picking'),
      notice: window.timeline.getElement().querySelector('.m-timeline-notice').textContent,
      handler: window.map.getFeatureHandler().isActive(),
    }))).toEqual({
      pressed: 'true',
      picking: true,
      notice: 'Haz clic en una línea, o en los puntos que formarán el recorrido (Esc para terminar).',
      handler: false,
    });
    await clickCoordinate(page, points.q3);
    await expect.poll(() => trackOf(page).then((track) => track.key)).toBe('picked');
    await clickCoordinate(page, points.q1);
    await expect.poll(() => olTrack(page).then(({ full }) => full)).toEqual([[points.q1, points.q3]]);
    expect(await trackDom(page)).toEqual(expect.objectContaining({
      pick: 'true',
      feature: 'picked',
      features: ['Líneas: Recorrido 1', 'Recorrido por puntos: Todos los puntos de la capa (3)', 'Recorrido por puntos: Puntos elegidos en el mapa (2)'],
    }));
    await clickCoordinate(page, points.q3);
    await expect.poll(() => olTrack(page).then(({ full }) => full)).toEqual([[points.q1]]);
    await clickCoordinate(page, [-447000, 4982300]);
    await expect.poll(() => trackOf(page).then((track) => track.key)).toBe('line:l1');
    expect(await page.evaluate(() => ({
      handler: window.map.getFeatureHandler().isActive(),
      picking: window.map.getContainer().classList.contains('m-timeline-picking'),
      popup: document.querySelector('.m-popup') !== null,
      pressed: window.timeline.getElement().querySelector('.m-timeline-track-pick').getAttribute('aria-pressed'),
    }))).toEqual({
      handler: true, picking: false, popup: false, pressed: 'false',
    });

    await page.evaluate(() => window.timeline.getElement().querySelector('.m-timeline-track-pick').click());
    await page.keyboard.press('Escape');
    expect(await page.evaluate(() => window.map.getContainer().classList.contains('m-timeline-picking'))).toBe(false);
    await clickCoordinate(page, points.p1);
    expect((await trackOf(page)).key).toBe('line:l1');
    expect(errors).toEqual([]);
  });

  test('track: sin capas con recorridos, capa sin líneas ni puntos y capa GPX añadida después', async ({ page }) => {
    const { errors } = await openPage(page);
    await page.evaluate(async () => {
      window.map = IDEE.map({ container: 'map', center: [-445835, 4982151], zoom: 12 });
      window.map.addControls(new IDEE.control.Timeline({ timelineType: 'track', collapsible: false, collapsed: false }));
      window.timeline = await window.whenTimeline(window.map);
    });
    expect(await trackOf(page)).toBeNull();
    expect(await trackDom(page)).toEqual(expect.objectContaining({
      hidden: false, layers: ['Sin recorrido'], progress: null, profile: null, message: 'No hay capas con líneas o puntos que recorrer.',
    }));
    await clickAction(page, 'play');
    expect(await page.evaluate(() => window.timeline.running)).toBe(false);

    await page.evaluate(() => {
      const layer = new IDEE.layer.Vector({ name: 'poligonos' });
      window.map.addLayers(layer);
      layer.addFeatures([new IDEE.Feature('a', {
        type: 'Feature',
        geometry: { type: 'Polygon', coordinates: [[[-446000, 4982000], [-445000, 4982000], [-445000, 4983000], [-446000, 4982000]]] },
        properties: {},
      })]);
    });
    expect((await trackDom(page)).layers).toEqual(['Sin recorrido']);
    expect(await page.evaluate(() => window.timeline.selectTrack({ layer: 'poligonos' }))).toBe(false);
    expect(await trackDom(page)).toEqual(expect.objectContaining({
      layers: ['[1] poligonos'], progress: null, message: 'La capa no tiene líneas ni puntos válidos.',
    }));
    expect(await page.evaluate(() => window.timeline.selectTrack(null))).toBe(false);
    expect((await trackDom(page)).layers).toEqual(['Sin recorrido']);

    await page.evaluate((url) => window.map.addLayers(`GPX*ruta_penalara*${url}*true*true`), ROUTES.penalara);
    await expect.poll(() => trackOf(page).then((track) => track?.key ?? null)).toBe('line:trk-4');
    expect(await trackDom(page)).toEqual(expect.objectContaining({ layers: ['[1] ruta_penalara'], message: '' }));
    await page.evaluate(() => window.map.removeLayers(window.map.getGPX()));
    expect(await trackOf(page)).toBeNull();
    expect(await olTrack(page)).toBeNull();
    expect((await trackDom(page)).message).toBe('No hay capas con líneas o puntos que recorrer.');
    expect(errors).toEqual([]);
  });

  test('absoluteSimple: el recorrido complementario se mantiene mientras se recorren las capas, sin sincronizarse', async ({ page }) => {
    const { errors } = await openPage(page);
    await openRoutesMap(page);
    await addTimeline(page, {
      timelineType: 'absoluteSimple',
      speed: 0.05,
      intervals: [['Guadarrama', '2021', 'ruta_guadarrama'], ['Peñalara', '2022', 'ruta_penalara']],
      track: { layer: 'ruta_guadarrama', feature: 'trk-4' },
    });
    expect(await trackOf(page)).toEqual(expect.objectContaining({
      layer: 'ruta_guadarrama', key: 'line:trk-4', timed: true, synchronized: false, step: 0,
    }));
    const complementary = 'Sin tiempos compatibles con la línea de tiempo: el recorrido se muestra como información complementaria.';
    expect(await trackDom(page)).toEqual(expect.objectContaining({
      layers: ['Sin recorrido', '[1] ruta_penalara', '[2] ruta_guadarrama'],
      progress: { max: 19, value: 0, disabled: false },
      message: complementary,
      warning: {
        icon: true, label: complementary, expanded: 'false', text: null,
      },
    }));
    const warningButton = page.locator('.m-timeline-track-warning');
    const warningText = page.locator('.m-timeline-track-message');
    const card = page.locator('.m-control-timeline');
    const cardBox = await card.boundingBox();
    await expect(warningText).toBeHidden();
    await warningButton.click();
    await expect(warningText).toBeVisible();
    expect((await trackDom(page)).warning).toEqual({
      icon: true, label: complementary, expanded: 'true', text: complementary,
    });
    expect(await card.boundingBox()).toEqual(cardBox);
    const placement = await page.evaluate(() => {
      const button = document.querySelector('.m-timeline-track-warning').getBoundingClientRect();
      const popup = document.querySelector('.m-timeline-track-message');
      const box = popup.getBoundingClientRect();
      const { clientWidth, clientHeight } = document.documentElement;
      return {
        popover: popup.matches(':popover-open'),
        rightAligned: Math.abs(box.right - button.right) <= 1,
        anchored: box.top >= button.bottom || box.bottom <= button.top,
        inViewport: box.left >= 0 && box.top >= 0 && box.right <= clientWidth && box.bottom <= clientHeight,
      };
    });
    expect(placement).toEqual({
      popover: true, rightAligned: true, anchored: true, inViewport: true,
    });
    await warningButton.click();
    await expect(warningText).toBeHidden();
    expect((await trackDom(page)).warning.expanded).toBe('false');
    await warningButton.click();
    await expect(warningText).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(warningText).toBeHidden();
    expect((await trackDom(page)).warning.expanded).toBe('false');
    await warningButton.click();
    await expect(warningText).toBeVisible();
    await page.locator('.m-control-timeline .m-timeline-title').click();
    await expect(warningText).toBeHidden();
    expect((await trackDom(page)).warning.expanded).toBe('false');
    await clickAction(page, 'forward');
    expect(await page.evaluate(() => ({
      selected: window.timeline.getSelectedLayer().name,
      guadarrama: window.map.getGPX().find((layer) => layer.name === 'ruta_guadarrama').isVisible(),
    }))).toEqual({ selected: 'ruta_penalara', guadarrama: false });
    expect((await trackOf(page)).step).toBe(0);
    expect((await olTrack(page)).full).toHaveLength(3);

    await chooseValue(page, '.m-timeline-track-progress', '5');
    expect((await trackOf(page)).step).toBe(5);
    expect(await page.evaluate(() => window.timeline.getSelectedLayer().name)).toBe('ruta_penalara');

    await clickAction(page, 'back');
    await clickAction(page, 'play');
    await page.waitForFunction(() => window.timeline.running === false);
    expect(await page.evaluate(() => window.timeline.getSelectedLayer().name)).toBe('ruta_penalara');
    expect((await trackOf(page)).step).toBe(5);

    await warningButton.click();
    await expect(warningText).toBeVisible();
    await chooseValue(page, '.m-timeline-track-layer', '');
    expect(await trackOf(page)).toBeNull();
    expect(await olTrack(page)).toBeNull();
    expect((await trackDom(page)).progress).toBeNull();
    await expect(warningText).toBeHidden();
    await expect(warningButton).toBeHidden();
    expect((await trackDom(page)).warning.expanded).toBe('false');

    await chooseValue(page, '.m-timeline-track-layer', '1');
    await warningButton.click();
    await expect(warningText).toBeVisible();
    await page.evaluate(() => {
      window.map.removeControls(window.timeline);
      window.dispatchEvent(new Event('resize'));
      window.dispatchEvent(new Event('scroll'));
    });
    expect(await page.evaluate(() => document.querySelectorAll(':popover-open').length)).toBe(0);
    await expect(warningText).toHaveCount(0);
    expect(errors).toEqual([]);
  });

  test('absolute: el filtro temporal se mantiene y el marcador sigue el instante al avanzar, retroceder y cambiar la fecha', async ({ page }) => {
    const { errors } = await openPage(page);
    await openRoutesMap(page);
    await addTimeline(page, {
      timelineType: 'absolute',
      paramsDate: 'min',
      stepValue: 30,
      intervals: [{
        id: 'guadarrama', init: '2021-06-05T07:00:00Z', end: '2021-06-05T13:20:00Z', layer: 'ruta_guadarrama', attributeParam: 'time',
      }],
      track: { layer: 'ruta_guadarrama', feature: 'trk-4' },
    });
    const sync = () => page.evaluate(() => ({
      end: window.timeline.date.end,
      time: window.timeline.getTrack().time,
      synchronized: window.timeline.getTrack().synchronized,
      filtered: window.map.getGPX().find((layer) => layer.name === 'ruta_guadarrama').getFilter() !== null,
    }));
    const endTime = Date.parse('2021-06-05T13:05:00Z');
    expect(await sync()).toEqual({
      end: Date.parse('2021-06-05T13:20:00Z'), time: endTime, synchronized: true, filtered: true,
    });
    expect((await trackDom(page)).message).toBe('Sincronizado con la línea de tiempo.');
    expect((await trackDom(page)).progress).toEqual({ max: 19, value: 19, disabled: true });

    await setRange(page, '2021-06-05T07:00:00Z', '2021-06-05T07:30:00Z');
    expect(await trackDom(page)).toEqual(expect.objectContaining({
      message: expect.stringMatching(/^El recorrido empieza el .*2021.*08:00:00/),
      status: '',
    }));
    expect((await olTrack(page)).marker).toBeNull();

    await setRange(page, '2021-06-05T08:00:00Z', '2021-06-05T09:30:00Z');
    let state = await sync();
    expect(state.time).toBe(state.end);
    expect(state.end).toBe(Date.parse('2021-06-05T09:30:00Z'));
    expect((await trackOf(page)).segment).toBe(1);

    await clickAction(page, 'forward');
    state = await sync();
    expect(state.end).toBe(Date.parse('2021-06-05T10:00:00Z'));
    expect(state.time).toBe(state.end);
    await clickAction(page, 'back');
    state = await sync();
    expect(state.end).toBe(Date.parse('2021-06-05T09:30:00Z'));
    expect(state.time).toBe(state.end);
    expect(await page.evaluate(() => window.timeline.getElement().querySelector('.m-timeline-date-init').disabled)).toBe(true);
    expect(errors).toEqual([]);
  });

  test('relative: el inicio fijo se conserva; el recorrido se sincroniza con el rango o queda complementario si no se solapa', async ({ page }) => {
    const { errors } = await openPage(page);
    await openRoutesMap(page);
    await addTimeline(page, {
      timelineType: 'relative',
      layerPosition: 2,
      paramsDate: 'min',
      stepValue: 30,
      intervals: ROUTE_INTERVALS,
      track: { layer: 'ruta_guadarrama', feature: 'trk-4' },
    });
    const init = Date.parse('2021-06-05T08:00:00Z');
    expect(await page.evaluate(() => ({ ...window.timeline.date })))
      .toEqual({ init, end: Date.parse('2021-06-05T13:20:00Z') });
    await clickAction(page, 'back');
    await clickAction(page, 'back');
    const date = await page.evaluate(() => ({ ...window.timeline.date }));
    expect(date).toEqual({ init, end: Date.parse('2021-06-05T12:20:00Z') });
    expect(await trackOf(page)).toEqual(expect.objectContaining({ synchronized: true, time: date.end, segment: 2 }));

    await setRange(page, '2021-06-05T09:30:00Z', '2021-06-05T10:00:00Z');
    const travelled = (await olTrack(page)).travelled;
    const segments = await routeSegments(page, 'Ruta Cercedilla - Bola del Mundo');
    expect(travelled).toHaveLength(1);
    expect(travelled[0]).toHaveLength(3);
    expect(travelled[0][1]).toEqual(segments[1][2]);
    expect((await trackOf(page)).time).toBe(Date.parse('2021-06-05T10:00:00Z'));

    expect(await page.evaluate(() => window.timeline.selectTrack({ layer: 'ruta_penalara', feature: 'trk-4' }))).toBe(true);
    expect(await trackOf(page)).toEqual(expect.objectContaining({ layer: 'ruta_penalara', synchronized: false }));
    expect(await trackDom(page)).toEqual(expect.objectContaining({
      message: 'Sin tiempos compatibles con la línea de tiempo: el recorrido se muestra como información complementaria.',
      progress: { max: 9, value: 0, disabled: false },
    }));
    expect(await page.evaluate(() => window.timeline.selectLayer('penalara'))).toBe(true);
    expect(await trackOf(page)).toEqual(expect.objectContaining({ synchronized: true, time: Date.parse('2021-07-10T12:00:00Z') }));
    expect((await trackDom(page)).message).toBe('Sincronizado con la línea de tiempo.');
    expect(errors).toEqual([]);
  });

  test('perfil: una petición por segmento, cursor sincronizado al avanzar, retroceder y buscar, y recarga al cambiar de recorrido', async ({ page }) => {
    const { errors } = await openPage(page);
    const requests = await mockElevation(page);
    await createTrackMap(page);
    await page.evaluate(() => window.timeline.getElement().querySelector('.m-timeline-profile-button').click());
    await page.waitForSelector('.ol-profil.m-timeline-profile-panel');
    expect(requests.map(({ crs, geom }) => [crs, JSON.parse(geom).features.length])).toEqual([[3857, 6], [3857, 8], [3857, 6]]);
    requests.forEach(({ distance }) => {
      expect(distance).toBeGreaterThanOrEqual(10);
      expect(distance).toBeLessThanOrEqual(1000);
    });
    expect(await page.evaluate(() => {
      // eslint-disable-next-line no-underscore-dangle
      const { tab_: points } = window.timeline.getImpl().profile_;
      return [...new Set(points.map((point) => point[5]))];
    })).toEqual([0, 1, 2]);
    expect((await trackDom(page)).profile).toBe('true');
    const start = await profilePanel(page);
    expect(start.title).toBe('Perfil topográfico: Ruta Cercedilla - Bola del Mundo');

    await clickAction(page, 'forward', 7);
    const forward = await profilePanel(page);
    expect(forward.bar).toBeGreaterThan(start.bar);
    await clickAction(page, 'back', 4);
    const back = await profilePanel(page);
    expect(back.bar).toBeLessThan(forward.bar);
    expect(back.bar).toBeGreaterThan(start.bar);
    await chooseValue(page, '.m-timeline-track-progress', '19');
    const end = await profilePanel(page);
    expect(end.bar).toBeGreaterThan(forward.bar);
    await chooseValue(page, '.m-timeline-track-progress', '0');
    expect((await profilePanel(page)).bar).toBe(start.bar);

    await chooseValue(page, '.m-timeline-track-layer', '0');
    await expect.poll(() => profilePanel(page).then((panel) => panel?.title ?? null))
      .toBe('Perfil topográfico: Ruta Cotos - Peñalara - Laguna Grande');
    expect(requests).toHaveLength(4);

    await page.evaluate(() => document.querySelector('.ol-profil.m-timeline-profile-panel .profile-close-button').click());
    expect(await profilePanel(page)).toBeNull();
    expect((await trackDom(page)).profile).toBe('false');

    await page.evaluate(() => window.timeline.getElement().querySelector('.m-timeline-profile-button').click());
    await page.waitForSelector('.ol-profil.m-timeline-profile-panel');
    const before = await page.evaluate(() => window.map.getMapImpl().getLayers().getLength());
    await page.evaluate(() => window.map.removeControls(window.timeline));
    expect(await profilePanel(page)).toBeNull();
    expect(await olTrack(page)).toBeNull();
    expect(await page.evaluate(() => window.map.getMapImpl().getLayers().getLength())).toBe(before - 2);
    expect(errors).toEqual([]);
  });

  test('perfil: sin datos de altitud, error del servicio, respuesta obsoleta y destrucción con la petición pendiente', async ({ page }) => {
    const { errors } = await openPage(page);
    await mockElevation(page, { noData: true });
    await createTrackMap(page);
    const clickProfile = () => page.evaluate(() => window.timeline.getElement().querySelector('.m-timeline-profile-button').click());
    await clickProfile();
    await expect.poll(() => trackDom(page).then(({ message }) => message))
      .toBe('No hay datos de altitud para este recorrido.');
    expect(await profilePanel(page)).toBeNull();
    expect((await trackDom(page)).profile).toBe('false');

    await page.unroute('**/processes/elevationProfile/execution');
    await mockElevation(page, { status: 500 });
    await clickProfile();
    await page.waitForSelector('.m-toast');
    const toastText = await page.evaluate(() => {
      const toast = document.querySelector('.m-toast');
      const text = toast.textContent.trim();
      toast.style.display = 'none';
      return text;
    });
    expect(toastText).toContain('No se han podido consultar los datos de altitud.');
    expect((await trackDom(page)).message).toBe('No se han podido consultar los datos de altitud.');
    expect(await profilePanel(page)).toBeNull();

    await page.unroute('**/processes/elevationProfile/execution');
    let release;
    const gate = new Promise((resolve) => { release = resolve; });
    await mockElevation(page, { hold: (count) => (count === 1 ? gate : null) });
    await chooseValue(page, '.m-timeline-track-layer', '0');
    await chooseValue(page, '.m-timeline-track-feature', 'line:rte-3');
    await clickProfile();
    expect((await trackDom(page)).message).toBe('Consultando los datos de altitud…');
    await chooseValue(page, '.m-timeline-track-feature', 'line:trk-4');
    await expect.poll(() => profilePanel(page).then((panel) => panel?.title ?? null))
      .toBe('Perfil topográfico: Ruta Cotos - Peñalara - Laguna Grande');
    release();
    await page.waitForTimeout(300);
    expect((await profilePanel(page)).title).toBe('Perfil topográfico: Ruta Cotos - Peñalara - Laguna Grande');

    await page.evaluate(() => document.querySelector('.ol-profil.m-timeline-profile-panel .profile-close-button').click());
    await page.unroute('**/processes/elevationProfile/execution');
    let releaseLast;
    const last = new Promise((resolve) => { releaseLast = resolve; });
    await mockElevation(page, { hold: () => last });
    await clickProfile();
    await page.evaluate(() => window.map.removeControls(window.timeline));
    releaseLast();
    await page.waitForTimeout(300);
    expect(await profilePanel(page)).toBeNull();
    expect(errors).toEqual([]);
  });

  test('recorridos: textos traducidos (es, en, ca), iconos compartidos de icons_cota y perfil con los textos comunes', async ({ page }) => {
    const { errors } = await openPage(page);
    await mockElevation(page);
    await openRoutesMap(page);
    const mismatches = await page.evaluate(async () => {
      const found = [];
      const check = (condition, message) => { if (!condition) found.push(message); };
      const icon = (element) => {
        const style = window.getComputedStyle(element, '::before');
        return style.maskImage || style.webkitMaskImage;
      };
      const wait = (fn) => new Promise((resolve) => {
        const poll = () => (fn() ? resolve() : setTimeout(poll, 50));
        poll();
      });
      const keys = (lang) => {
        const translation = IDEE.language.getTranslation(lang);
        return [
          ...Object.keys(translation.timeline).filter((key) => key.startsWith('track') || key.startsWith('speed_option')),
          ...Object.keys(translation.profile).map((key) => `profile.${key}`),
          ...Object.keys(translation.profile.info).map((key) => `profile.info.${key}`),
          translation.timeline.textHelp.help6 ? 'help6' : '',
        ].sort();
      };
      check(JSON.stringify(keys('es')) === JSON.stringify(keys('en')) && JSON.stringify(keys('es')) === JSON.stringify(keys('ca')), 'mismas claves en es, en y ca');
      /* eslint-disable no-restricted-syntax, no-await-in-loop */
      for (const lang of ['es', 'en', 'ca']) {
        IDEE.language.setLang(lang);
        const text = IDEE.language.getValue('timeline');
        const profileText = IDEE.language.getValue('profile');
        if (window.map.getControls('timeline').length > 0) window.map.removeControls(window.map.getControls('timeline'));
        window.timeline = new IDEE.control.Timeline({
          timelineType: 'track', collapsible: false, collapsed: false, track: { layer: 'ruta_guadarrama', feature: 'trk-4' },
        });
        window.map.addControls(window.timeline);
        await window.whenTimeline(window.map);
        await wait(() => window.timeline.getTrack());
        const element = window.timeline.getElement();
        const query = (selector) => element.querySelector(selector);
        const labelled = (selector, value, name) => {
          const node = query(selector);
          check(node.title === value && node.getAttribute('aria-label') === value, `${lang}: ${name}`);
        };
        check(query('.m-timeline-track-tools').getAttribute('aria-label') === text.track, `${lang}: grupo`);
        labelled('.m-timeline-track-layer', text.track_layer, 'capa');
        labelled('.m-timeline-track-feature', text.track_feature, 'objeto');
        labelled('.m-timeline-track-pick', text.track_pick, 'elegir');
        labelled('.m-timeline-profile-button', text.track_profile, 'perfil');
        labelled('.m-timeline-track-progress', text.track_progress, 'progreso');
        const groups = [...query('.m-timeline-track-feature').querySelectorAll('optgroup')].map((group) => group.label);
        check(JSON.stringify(groups) === JSON.stringify([text.track_group_lines, text.track_group_points]), `${lang}: grupos de objetos`);
        check([...query('.m-timeline-track-feature').options].pop().textContent === text.track_points_all.replace('{count}', '4'), `${lang}: todos los puntos`);
        check(query('.m-timeline-track-status').textContent.includes(text.track_segment.replace('{index}', '1').replace('{total}', '3')), `${lang}: segmento`);
        const seconds = (1).toLocaleString(lang);
        check(query('.m-timeline-speed').options[1].title === text.speed_option_track_time.replace('{seconds}', seconds).replace('{interval}', '00:16:03'), `${lang}: velocidad (${query('.m-timeline-speed').options[1].title})`);
        check(icon(query('.m-timeline-track-pick')).includes('icons_cota/icn_seleccion.svg'), `${lang}: icono elegir`);
        check(icon(query('.m-timeline-profile-button')).includes('icons_cota/icn_perfil.svg'), `${lang}: icono perfil`);
        query('.m-timeline-profile-button').click();
        await wait(() => document.querySelector('.ol-profil.m-timeline-profile-panel'));
        const panel = document.querySelector('.ol-profil.m-timeline-profile-panel');
        check(panel.querySelector('p').textContent.startsWith(`${profileText.title}: `), `${lang}: título del panel`);
        check(panel.querySelector('.profile-close-button').title === profileText.close, `${lang}: cerrar`);
        check(panel.querySelector('.profile-move-button').title === profileText.move, `${lang}: mover`);
        check(panel.querySelector('.profile-download-button').title === profileText.download, `${lang}: descargar`);
        check(panel.querySelector('.track-info td').textContent.startsWith(profileText.info.zmin), `${lang}: altitud mínima`);
        check(icon(panel.querySelector('.profile-close-button')).includes('icons_cota/icn_cruz.svg'), `${lang}: icono cerrar`);
        window.map.removeControls(window.timeline);
        window.map.addControls(new IDEE.control.Timeline({
          timelineType: 'relative',
          collapsible: false,
          collapsed: false,
          intervals: [{
            id: 'g', init: '2021-06-05T08:00:00Z', end: '2021-06-05T13:20:00Z', layer: 'ruta_guadarrama', attributeParam: 'time',
          }],
          track: { layer: 'ruta_guadarrama', feature: 'trk-5' },
        }));
        window.timeline = await window.whenTimeline(window.map);
        await wait(() => window.timeline.getTrack());
        const relative = window.timeline.getElement();
        const warning = relative.querySelector('.m-timeline-track-warning');
        check(!warning.hidden && warning.title === text.track_complementary && warning.getAttribute('aria-label') === text.track_complementary, `${lang}: complementario`);
        check(relative.querySelector('.m-timeline-track-layer').options[0].textContent === text.track_none, `${lang}: sin recorrido`);
        const status = relative.querySelector('.m-timeline-track-status').textContent;
        check(status.startsWith(text.track_position.replace('{index}', '1').replace('{total}', '4')) && !status.includes('%'), `${lang}: posición`);
        check(window.timeline.getHelp().title !== undefined, `${lang}: ayuda`);
      }
      /* eslint-enable no-restricted-syntax, no-await-in-loop */
      IDEE.language.setLang('es');
      return found;
    });
    expect(mismatches).toEqual([]);
    expect(errors).toEqual([]);
  });

  test('ciclo de vida: destruir durante la reproducción, capa de origen creada por "track" y capas del usuario intactas', async ({ page }) => {
    const { errors } = await openPage(page);
    await createTrackMap(page, 'timeline*timelineType=track;collapsible=false;collapsed=false;layerPosition=2;speed=0.05');
    await clickAction(page, 'play');
    await expect.poll(() => trackOf(page).then(({ step }) => step)).toBeGreaterThan(0);
    const before = await page.evaluate(() => window.map.getGPX().map((layer) => [layer.name, layer.isVisible()]));
    await page.evaluate(() => window.map.removeControls(window.timeline));
    await page.waitForTimeout(200);
    expect(await page.evaluate(() => window.timeline.running)).toBe(false);
    expect(await olTrack(page)).toBeNull();
    expect(await page.evaluate(() => window.map.getGPX().map((layer) => [layer.name, layer.isVisible()]))).toEqual(before);

    await page.evaluate(async (url) => {
      window.map.addControls(new IDEE.control.Timeline({
        timelineType: 'relative',
        collapsible: false,
        collapsed: false,
        intervals: [{
          id: 'g', init: '2021-06-05T08:00:00Z', end: '2021-06-05T13:20:00Z', layer: 'ruta_guadarrama', attributeParam: 'time',
        }],
        track: { layer: `GPX*ruta_creada*${url}*true*true` },
      }));
      window.timeline = await window.whenTimeline(window.map);
    }, ROUTES.penalara);
    await expect.poll(() => trackOf(page).then((track) => track?.layer ?? null)).toBe('ruta_creada');
    expect(await page.evaluate(() => window.map.getGPX().map((layer) => layer.name))).toEqual(['ruta_guadarrama', 'ruta_penalara', 'ruta_creada']);
    await page.evaluate(() => window.map.removeControls(window.timeline));
    expect(await page.evaluate(() => window.map.getGPX().map((layer) => layer.name))).toEqual(['ruta_guadarrama', 'ruta_penalara']);
    expect(await olTrack(page)).toBeNull();
    expect(errors).toEqual([]);
  });
});
