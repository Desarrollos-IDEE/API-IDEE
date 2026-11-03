/* eslint-disable max-len */
import { test, expect } from '@playwright/test';

/*
 * Timeline en Cesium: la funcionalidad temporal 3D todavía no está implementada.
 * Se comprueba que el control se construye sin errores, que la implementación cumple
 * el contrato declarando "no soportado", que el panel lo indica y que no toca las
 * capas del visualizador (GPX incorporado por GET).
 */
const PAGE = '/test/playwright/cesium/basic-cesium.html';
const GPX = '/test/development/CP-0002-layers/fixtures/CP-035.gpx';
const WAIT = { timeout: 20000 };

const encodeIntervals = (intervals) => Buffer.from(JSON.stringify(intervals), 'utf-8').toString('base64');

const INTERVALS = [{
  id: 'gpx', init: '2020-01-01T00:00:00Z', end: '2020-12-31T23:59:59Z', layer: 'gpx_get', attributeParam: 'time',
}];

const openMap = async (page, timelineType, intervals) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error));
  await page.goto(PAGE);
  await page.evaluate((params) => {
    IDEE.config.baseLayer = [];
    IDEE.config.terrain.default = [];
    window.map = IDEE.map({
      container: 'map', center: [-3.7, 40.4], zoom: 9, ...params,
    });
  }, {
    layers: [`GPX*gpx_get*${GPX}*true*true`],
    controls: [`timeline*timelineType=${timelineType};collapsible=false;collapsed=false;intervals=base64~${encodeIntervals(intervals)}`],
  });
  await expect.poll(() => page.evaluate(() => window.map.getControls('timeline')[0]?.getElement()?.isConnected === true), WAIT).toBe(true);
  await expect.poll(() => page.evaluate(() => window.map.getGPX()[0].getFeatures(true).length), WAIT).toBeGreaterThan(0);
  return errors;
};

test.describe('IDEE.control.Timeline (Cesium)', () => {
  test('relative: se construye, cumple el contrato como "no soportado" y no toca las capas', async ({ page }) => {
    test.setTimeout(60000);
    const errors = await openMap(page, 'relative', INTERVALS);
    const result = await page.evaluate(() => {
      const timeline = window.map.getControls('timeline')[0];
      const impl = timeline.getImpl();
      const layer = window.map.getGPX()[0];
      const notice = timeline.getElement().querySelector('.m-timeline-notice');
      const state = {
        contract: ['isSupported', 'supportsLayer', 'applyTemporalFilter', 'removeTemporalFilter']
          .map((method) => typeof impl[method]),
        isSupported: impl.isSupported(),
        supportsGPX: impl.supportsLayer(layer, 'relative'),
        applied: impl.applyTemporalFilter(layer, {}),
        implExported: typeof IDEE.impl.control.Timeline,
        notice: { hidden: notice.hidden, text: notice.textContent },
        disabled: [...timeline.getElement().querySelectorAll('input, select, button')].every((element) => element.disabled),
        selectable: timeline.getSelectableLayers(),
        selected: timeline.getSelectedLayer(),
        select: timeline.selectLayer('gpx'),
        layer: {
          visible: layer.isVisible(),
          filter: layer.getFilter() ?? null,
          shown: layer.getFeatures().length,
          total: layer.getFeatures(true).length,
        },
        gpxCount: window.map.getGPX().length,
      };
      window.map.removeControls(timeline);
      state.afterDestroy = {
        controls: window.map.getControls('timeline').length,
        gpxCount: window.map.getGPX().length,
        visible: layer.isVisible(),
      };
      return state;
    });
    expect(result.contract).toEqual(['function', 'function', 'function', 'function']);
    expect(result.isSupported).toBe(false);
    expect(result.supportsGPX).toBe(false);
    expect(result.applied).toBe(false);
    expect(result.implExported).toBe('function');
    expect(result.notice.hidden).toBe(false);
    expect(result.notice.text).toContain('3D');
    expect(result.disabled).toBe(true);
    expect(result.selectable).toEqual([]);
    expect(result.selected).toBe(null);
    expect(result.select).toBe(false);
    expect(result.layer.visible).toBe(true);
    expect(result.layer.filter).toBe(null);
    expect(result.layer.shown).toBe(result.layer.total);
    expect(result.gpxCount).toBe(1);
    expect(result.afterDestroy).toEqual({ controls: 0, gpxCount: 1, visible: true });
    expect(errors).toEqual([]);
  });

  test('absoluteSimple: se construye con el aviso y sin crear capas', async ({ page }) => {
    test.setTimeout(60000);
    const errors = await openMap(page, 'absoluteSimple', [
      ['GPX', '2020', 'gpx_get'],
      ['Otra', '2021', `GPX*gpx_otra*${GPX}*true*true`],
    ]);
    const result = await page.evaluate(() => {
      const timeline = window.map.getControls('timeline')[0];
      return {
        notice: !timeline.getElement().querySelector('.m-timeline-notice').hidden,
        gpx: window.map.getGPX().map((layer) => [layer.name, layer.isVisible()]),
        valid: timeline.isValidLayer(window.map.getGPX()[0]),
      };
    });
    expect(result).toEqual({ notice: true, gpx: [['gpx_get', true]], valid: false });
    expect(errors).toEqual([]);
  });
});
