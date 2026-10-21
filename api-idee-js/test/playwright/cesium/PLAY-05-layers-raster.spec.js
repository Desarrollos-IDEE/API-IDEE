import { test, expect } from '@playwright/test';

/*
 * Capas ráster en Cesium: alta, visibilidad, opacidad, extensión, leyenda,
 * estilos y baja. Los servicios se simulan para no depender de la red.
 */
const PAGE = '/test/playwright/cesium/basic-cesium.html';
const HOST = 'https://raster.cesium.test';
const CORS = { 'access-control-allow-origin': '*' };
const PNG_1PX = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
);
const WAIT = { timeout: 20000 };

const BBOX = `<EX_GeographicBoundingBox>
  <westBoundLongitude>-10</westBoundLongitude><eastBoundLongitude>5</eastBoundLongitude>
  <southBoundLatitude>35</southBoundLatitude><northBoundLatitude>44</northBoundLatitude>
</EX_GeographicBoundingBox>`;
const style = (name) => `<Style><Name>${name}</Name><Title>${name}</Title>
  <LegendURL width="20" height="20"><Format>image/png</Format>
    <OnlineResource xmlns:xlink="http://www.w3.org/1999/xlink" xlink:type="simple" xlink:href="${HOST}/${name}.png"/>
  </LegendURL></Style>`;
const WMS_CAPABILITIES = `<?xml version="1.0" encoding="UTF-8"?>
<WMS_Capabilities version="1.3.0" xmlns="http://www.opengis.net/wms" xmlns:xlink="http://www.w3.org/1999/xlink">
  <Service><Name>WMS</Name><Title>Servicio de prueba</Title></Service>
  <Capability>
    <Request>
      <GetCapabilities><Format>text/xml</Format><DCPType><HTTP><Get><OnlineResource xlink:href="${HOST}/wms?"/></Get></HTTP></DCPType></GetCapabilities>
      <GetMap><Format>image/png</Format><DCPType><HTTP><Get><OnlineResource xlink:href="${HOST}/wms?"/></Get></HTTP></DCPType></GetMap>
    </Request>
    <Exception><Format>XML</Format></Exception>
    <Layer><Title>Raíz</Title><CRS>EPSG:4326</CRS><CRS>EPSG:3857</CRS>${BBOX}
      <Layer queryable="1"><Name>capa</Name><Title>Capa de prueba</Title><Abstract>Resumen</Abstract>${BBOX}
        ${style('estilo1')}${style('estilo2')}
      </Layer>
    </Layer>
  </Capability>
</WMS_Capabilities>`;

/** Simula el servidor y guarda las URL pedidas. */
const mockServer = async (page) => {
  const requests = [];
  await page.route(`${HOST}/**`, (route) => {
    const url = route.request().url();
    requests.push(url);
    if (/request=getcapabilities/i.test(url)) {
      return route.fulfill({
        status: 200, headers: CORS, contentType: 'text/xml', body: WMS_CAPABILITIES,
      });
    }
    return route.fulfill({
      status: 200, headers: CORS, contentType: 'image/png', body: PNG_1PX,
    });
  });
  return requests;
};

/** Datos de una capa ráster en el visor. */
const imageryState = (page, name) => page.evaluate((layerName) => {
  const layer = window.map.getLayers().find((l) => l.name === layerName);
  const native = layer.getImpl().getLayer();
  return {
    inViewer: window.map.getMapImpl().imageryLayers.contains(native),
    show: native.show,
    alpha: native.alpha,
    visible: layer.isVisible(),
    opacity: layer.getOpacity(),
  };
}, name);

const RASTER_TYPES = ['WMS', 'WMTS', 'XYZ', 'TMS', 'OSM', 'MBTiles'];

/** Crea en la página una capa ráster del tipo indicado. */
const createLayer = (page, type) => page.evaluate(({ layerType, host }) => {
  const factories = {
    WMS: () => new IDEE.layer.WMS({
      url: `${host}/wms?`, name: 'capa', legend: 'WMS de prueba', tiled: true,
    }),
    WMTS: () => new IDEE.layer.WMTS({
      url: `${host}/wmts?`,
      name: 'teselas',
      legend: 'WMTS de prueba',
      matrixSet: 'GoogleMapsCompatible',
      format: 'image/png',
      useCapabilities: false,
    }),
    XYZ: () => new IDEE.layer.XYZ({
      url: `${host}/xyz/{z}/{x}/{y}.png`, name: 'xyz', legend: 'XYZ de prueba', transparent: true,
    }),
    TMS: () => new IDEE.layer.TMS({
      url: `${host}/tms/{z}/{x}/{-y}.png`, name: 'tms', legend: 'TMS de prueba', transparent: true,
    }),
    OSM: () => new IDEE.layer.OSM({
      url: `${host}/osm/{z}/{x}/{y}.png`, name: 'osm', legend: 'OSM de prueba', transparent: true,
    }),
    MBTiles: () => new IDEE.layer.MBTiles({
      url: '/test/playwright/fixtures/refresh/raster.mbtiles',
      name: 'mbtiles',
      legend: 'MBTiles de prueba',
      transparent: true,
    }),
  };
  window.events = [];
  const layer = factories[layerType]();
  window.layer = layer;
  layer.on(IDEE.evt.ADDED_TO_MAP, () => window.events.push('added'));
  window.map.on(IDEE.evt.REMOVED_LAYER, () => window.events.push('removed'));
  window.map.addLayers(layer);
  return layer.name;
}, { layerType: type, host: HOST });

test.describe.configure({ timeout: 60000 });

test.describe('Capas ráster en Cesium', () => {
  let requests;

  test.beforeEach(async ({ page }) => {
    requests = await mockServer(page);
    await page.goto(PAGE);
    await page.evaluate(() => {
      IDEE.config.baseLayer = [];
      IDEE.config.terrain.default = [];
      window.map = IDEE.map({
        container: 'map', controls: [], layers: [], center: [-3.7, 40.4], zoom: 6,
      });
    });
  });

  RASTER_TYPES.forEach((type) => {
    test(`${type}: alta, visibilidad, opacidad, extensión, leyenda y baja`, async ({ page }) => {
      const name = await createLayer(page, type);

      await expect.poll(() => page.evaluate(() => window.events.includes('added')), WAIT).toBe(true);
      await expect.poll(async () => (await imageryState(page, name)).inViewer, WAIT).toBe(true);

      await page.evaluate(() => window.layer.setVisible(false));
      expect(await imageryState(page, name)).toMatchObject({ show: false, visible: false });
      await page.evaluate(() => window.layer.setVisible(true));
      await page.evaluate(() => window.layer.setOpacity(0.4));
      expect(await imageryState(page, name)).toMatchObject({ show: true, alpha: 0.4, opacity: 0.4 });

      const extentAndLegend = await page.evaluate(async () => ({
        extent: await window.layer.calculateMaxExtent(),
        legend: window.layer.getLegendURL(),
      }));
      expect(extentAndLegend.extent).toBeTruthy();
      expect(typeof extentAndLegend.legend).toBe('string');

      await page.evaluate(() => window.map.removeLayers(window.layer));
      expect(await page.evaluate(() => window.map.getLayers().some((l) => l === window.layer)))
        .toBe(false);
      expect(await page.evaluate(() => window.events.includes('removed'))).toBe(true);
    });
  });

  test('WMS: extensión y estilos de las capacidades; setStyles cambia STYLES en caliente', async ({ page }) => {
    await page.evaluate((host) => {
      window.layer = new IDEE.layer.WMS({
        url: `${host}/wms?`, name: 'capa', legend: 'WMS de prueba', tiled: true,
      });
      window.map.addLayers(window.layer);
    }, HOST);
    await expect.poll(() => page.evaluate(() => {
      const native = window.layer.getImpl().getLayer();
      return !!native && window.map.getMapImpl().imageryLayers.contains(native);
    }), WAIT).toBe(true);

    const extent = await page.evaluate(() => window.layer.calculateMaxExtent());
    expect(extent.map(Math.round)).toEqual([-10, 35, 5, 44]);
    expect(await page.evaluate(() => window.layer.capabilitiesMetadata.style.map((s) => s.Name)))
      .toEqual(['estilo1', 'estilo2']);

    await page.evaluate(() => window.layer.setStyles('estilo2'));
    await expect.poll(() => requests.some((url) => /[?&]styles=estilo2(&|$)/i.test(url)), WAIT)
      .toBe(true);
    expect(await page.evaluate(() => window.layer.getLegendURL())).toBe(`${HOST}/estilo2.png`);
    // Sigue siendo la misma capa del mapa, con su visibilidad y opacidad
    expect(await page.evaluate(() => window.map.getMapImpl().imageryLayers
      .contains(window.layer.getImpl().getLayer()))).toBe(true);
  });
});
