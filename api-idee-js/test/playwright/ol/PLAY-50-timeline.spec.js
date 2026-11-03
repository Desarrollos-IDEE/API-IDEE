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
});
