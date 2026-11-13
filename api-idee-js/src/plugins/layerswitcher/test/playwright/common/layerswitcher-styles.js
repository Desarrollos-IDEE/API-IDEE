import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';
import path from 'path';
import {
  TIMEOUT, configureEngine, mockTiles, openMap, addSampleLayers, layerRow,
  renderedStyle, openStyleSelector, chooseStyle, addFromCatalog,
} from './helpers';

/*
 * Estilos predefinidos por capa del catálogo precargado (precharged) comunes a 2D y
 * 3D: ejemplo local de test/styles, estilos de cada capa de un servicio (layers),
 * estilos del servicio (styles), estilos WMS publicados, tipos de capa vectoriales
 * y ráster, y propiedades que la implementación no puede representar.
 */
const SERVER = 'http://localhost:8081';
const EXAMPLES = `${SERVER}/src/plugins/layerswitcher/test/styles`;
const EXAMPLE = `${EXAMPLES}/precharged-styles.json`;
const HOST = 'https://datos-estilos.layerswitcher.test';
const WMS_URL = 'https://wms-estilos.layerswitcher.test/wms';
const CORS = { 'access-control-allow-origin': '*' };
const PNG_1PX = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
);
const FIXTURES = path.join(__dirname, '..', '..', '..', '..', '..', '..', 'test', 'playwright', 'fixtures');
const POINT_PBF = readFileSync(path.join(FIXTURES, 'refresh', 'point.pbf'));

const VERDE = 'rgba(46, 125, 50, 0.6)';
const NARANJA = 'rgba(239, 108, 0, 0.6)';
const AZUL = 'rgba(21, 101, 192, 0.5)';
const ROJO = 'rgba(198, 40, 40, 0.2)';
const MORADO = '#6a1b9a';
const AMARILLO = '#f9a825';

const BBOX = `<EX_GeographicBoundingBox>
  <westBoundLongitude>-10</westBoundLongitude><eastBoundLongitude>5</eastBoundLongitude>
  <southBoundLatitude>35</southBoundLatitude><northBoundLatitude>44</northBoundLatitude>
</EX_GeographicBoundingBox>`;
const wmsStyle = (name) => `<Style><Name>${name}</Name><Title>Estilo ${name}</Title>
  <LegendURL width="20" height="20"><Format>image/png</Format>
    <OnlineResource xmlns:xlink="http://www.w3.org/1999/xlink" xlink:type="simple" xlink:href="${WMS_URL}/${name}.png"/>
  </LegendURL></Style>`;
const wmsLayer = (name, title, styles) => `<Layer queryable="1"><Name>${name}</Name><Title>${title}</Title>${BBOX}
  ${styles.map(wmsStyle).join('')}</Layer>`;
const WMS_CAPABILITIES = `<?xml version="1.0" encoding="UTF-8"?>
<WMS_Capabilities version="1.3.0" xmlns="http://www.opengis.net/wms" xmlns:xlink="http://www.w3.org/1999/xlink">
  <Service><Name>WMS</Name><Title>Hidrografía por capas</Title></Service>
  <Capability>
    <Request>
      <GetCapabilities><Format>text/xml</Format><DCPType><HTTP><Get><OnlineResource xlink:href="${WMS_URL}?"/></Get></HTTP></DCPType></GetCapabilities>
      <GetMap><Format>image/png</Format><DCPType><HTTP><Get><OnlineResource xlink:href="${WMS_URL}?"/></Get></HTTP></DCPType></GetMap>
    </Request>
    <Exception><Format>XML</Format></Exception>
    <Layer><Title>Raíz</Title><CRS>EPSG:4326</CRS><CRS>EPSG:3857</CRS>${BBOX}
      ${wmsLayer('rios', 'Ríos', ['estilo1', 'estilo2', 'estilo3'])}
      ${wmsLayer('embalses', 'Embalses', ['lamina', 'contorno'])}
      ${wmsLayer('canales', 'Canales', ['estilo1'])}
    </Layer>
  </Capability>
</WMS_Capabilities>`;

const DESCRIBE_FEATURE_TYPE = `<?xml version="1.0" encoding="UTF-8"?>
<xsd:schema xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:gml="http://www.opengis.net/gml" xmlns:prueba="http://prueba" targetNamespace="http://prueba" elementFormDefault="qualified">
  <xsd:complexType name="puntosType"><xsd:complexContent><xsd:extension base="gml:AbstractFeatureType"><xsd:sequence>
    <xsd:element name="nombre" type="xsd:string"/><xsd:element name="the_geom" type="gml:PointPropertyType"/>
  </xsd:sequence></xsd:extension></xsd:complexContent></xsd:complexType>
  <xsd:element name="puntos" type="prueba:puntosType" substitutionGroup="gml:_Feature"/>
</xsd:schema>`;
const FEATURES = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature', id: 'p1', geometry: { type: 'Point', coordinates: [-3.7, 40.4] }, properties: { nombre: 'Uno' },
    },
    {
      type: 'Feature', id: 'p2', geometry: { type: 'Point', coordinates: [-3.6, 40.5] }, properties: { nombre: 'Dos' },
    },
  ],
};
const pointStyle = (name, color) => ({
  name, point: { radius: 6, fill: { color, opacity: 1 }, stroke: { color: '#ffffff', width: 1 } },
});

const mockWMS = async (page) => {
  const requests = [];
  await page.route(`${WMS_URL}**`, (route) => {
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

const mockData = (page) => page.route(`${HOST}/**`, (route) => {
  const url = route.request().url();
  if (/describefeaturetype/i.test(url)) {
    return route.fulfill({
      status: 200, headers: CORS, contentType: 'text/xml', body: DESCRIBE_FEATURE_TYPE,
    });
  }
  if (url.includes('.pbf')) {
    return route.fulfill({
      status: 200, headers: CORS, contentType: 'application/x-protobuf', body: POINT_PBF,
    });
  }
  return route.fulfill({
    status: 200, headers: CORS, contentType: 'application/json', body: JSON.stringify(FEATURES),
  });
});

const styleRequested = (requests, layer, style) => requests.some((url) => new RegExp(`[?&]layers=${layer}(&|$)`, 'i').test(url)
  && new RegExp(`[?&]styles=${style}(&|$)`, 'i').test(url));

const waitPrecharged = (page, count, timeout) => expect.poll(() => page.evaluate(
  () => (window.mp.precharged?.services || []).length,
), { timeout }).toBe(count);

/** Añade las capas marcadas de un servicio WMS del listado de servicios precargados. */
const addWMSFromCatalog = async (page, service, layers, timeout) => {
  await page.locator('#layerswitcher-add-layer').click();
  await page.locator('#m-layerswitcher-addservices-list-btn').click();
  await page.locator('#m-layerswitcher-addservices-suggestions .m-layerswitcher-suggestion', { hasText: service }).click();
  const results = page.locator('#m-layerswitcher-addservices-results #m-layerswitcher-all tbody input');
  await expect(results).not.toHaveCount(0, { timeout });
  const listed = await results.evaluateAll((inputs) => inputs.map((input) => input.id));
  // eslint-disable-next-line no-restricted-syntax
  for (const name of layers) {
    // eslint-disable-next-line no-await-in-loop
    await page.locator(`#m-layerswitcher-addservices-results input#${name}`).check();
  }
  await page.locator('#m-layerswitcher-addservices-add-btn').click();
  return listed;
};

/**
 * Registra las pruebas de estilos predefinidos por capa.
 *
 * @param {String} impl 'ol' o 'cesium'.
 */
// eslint-disable-next-line import/prefer-default-export
export const registerStylesTests = (impl) => {
  test.describe(`Layerswitcher: estilos predefinidos por capa (${impl})`, () => {
    configureEngine(impl);
    test.describe.configure({ timeout: impl === 'cesium' ? 300000 : 60000 });
    const timeout = TIMEOUT[impl];

    test.beforeEach(async ({ page }) => {
      await mockTiles(page);
      await mockData(page);
    });

    test('ejemplo local: aplica el primer estilo configurado, lista todos y recupera cualquiera', async ({ page }) => {
      await openMap(page, impl, { precharged: EXAMPLE });
      await waitPrecharged(page, 2, timeout);
      expect(await page.evaluate(() => window.mp.precharged.services.map((s) => s.url)))
        .toEqual([`${EXAMPLES}/zonas.geojson`, `${EXAMPLES}/rutas.geojson`]);
      await addFromCatalog(page, 'Zonas de ejemplo', 'Zonas', timeout);

      await expect.poll(() => renderedStyle(page, impl, 'Zonas', 'Zona Centro'), { timeout })
        .toEqual({
          fill: VERDE, stroke: '#1b5e20', width: 1, label: null,
        });

      const selector = await openStyleSelector(page, 'Zonas');
      expect(selector.options.map((option) => option.label))
        .toEqual(['Verde', 'Naranja', 'Azul serializado', 'Rojo discontinuo']);
      expect(selector.selected).toBe('0');

      await chooseStyle(page, '1');
      await expect.poll(async () => (await renderedStyle(page, impl, 'Zonas', 'Zona Centro'))?.fill, { timeout })
        .toBe(NARANJA);

      await openStyleSelector(page, 'Zonas');
      await chooseStyle(page, '2');
      await expect.poll(async () => (await renderedStyle(page, impl, 'Zonas', 'Zona Centro'))?.fill, { timeout })
        .toBe(AZUL);
      expect(await page.evaluate(() => {
        const layer = window.mapjs.getLayers().find((l) => l.legend === 'Zonas');
        const restored = IDEE.Style.deserialize(layer.getStyle().serialize());
        return [restored instanceof IDEE.style.Generic, restored.get('name'), restored.get('polygon.fill.color')];
      })).toEqual([true, 'Azul serializado', '#1565c0']);

      await openStyleSelector(page, 'Zonas');
      await chooseStyle(page, '3');
      await expect.poll(async () => (await renderedStyle(page, impl, 'Zonas', 'Zona Centro'))?.fill, { timeout })
        .toBe(ROJO);

      expect((await openStyleSelector(page, 'Zonas')).selected).toBe('3');
      await chooseStyle(page, '0');
      await expect.poll(async () => (await renderedStyle(page, impl, 'Zonas', 'Zona Centro'))?.fill, { timeout })
        .toBe(VERDE);
      expect(await page.evaluate(() => {
        const layer = window.mapjs.getLayers().find((l) => l.legend === 'Zonas');
        const [config] = window.mp.precharged.services[0].styles;
        return {
          first: layer.getStyle() === layer.predefinedStyles[0],
          count: layer.predefinedStyles.length,
          configUntouched: config.point === undefined && config.name === 'Verde',
        };
      })).toEqual({ first: true, count: 4, configUntouched: true });
    });

    test('dos capas: cada una tiene sus estilos y cambiar los de una no cambia la otra', async ({ page }) => {
      await openMap(page, impl, { precharged: EXAMPLE });
      await waitPrecharged(page, 2, timeout);
      await addFromCatalog(page, 'Zonas de ejemplo', 'Zonas', timeout);
      await addFromCatalog(page, 'Rutas de ejemplo', 'Rutas', timeout);
      await expect.poll(async () => (await renderedStyle(page, impl, 'Rutas', 'Ruta Atlántica'))?.stroke, { timeout })
        .toBe(MORADO);
      await expect.poll(async () => (await renderedStyle(page, impl, 'Zonas', 'Zona Norte'))?.fill, { timeout })
        .toBe(VERDE);

      expect((await openStyleSelector(page, 'Rutas')).options.map((option) => option.label))
        .toEqual(['Rutas moradas', 'Rutas amarillas']);
      await chooseStyle(page, '1');
      await expect.poll(async () => (await renderedStyle(page, impl, 'Rutas', 'Madrid'))?.fill, { timeout })
        .toBe(AMARILLO);
      expect((await renderedStyle(page, impl, 'Rutas', 'Ruta Atlántica')).stroke).toBe(AMARILLO);
      expect((await renderedStyle(page, impl, 'Zonas', 'Zona Norte')).fill).toBe(VERDE);

      await openStyleSelector(page, 'Zonas');
      await chooseStyle(page, '1');
      await expect.poll(async () => (await renderedStyle(page, impl, 'Zonas', 'Zona Norte'))?.fill, { timeout })
        .toBe(NARANJA);
      expect((await renderedStyle(page, impl, 'Rutas', 'Ruta Atlántica')).stroke).toBe(AMARILLO);
      expect((await openStyleSelector(page, 'Rutas')).selected).toBe('1');
    });

    test('WMS: cada capa del servicio usa sus estilos (layers), solo los publicados, y la leyenda', async ({ page }) => {
      const requests = await mockWMS(page);
      await openMap(page, impl, {
        precharged: {
          services: [{
            type: 'WMS',
            name: 'Hidrografía por capas',
            url: `${WMS_URL}?`,
            white_list: ['rios', 'embalses'],
            layers: [
              { name: 'rios', styles: ['estilo2', 'estilo1', 'inexistente'] },
              { name: 'embalses', styles: ['contorno', 'lamina'] },
            ],
          }],
        },
      });
      const listed = await addWMSFromCatalog(page, 'Hidrografía por capas', ['rios', 'embalses'], timeout);
      expect(listed.sort()).toEqual(['embalses', 'rios']);
      await expect.poll(() => page.evaluate(() => window.mapjs.getWMS()
        .map((l) => [l.name, l.getStyles()]).sort()), { timeout })
        .toEqual([['embalses', 'contorno'], ['rios', 'estilo2']]);
      expect(await page.evaluate(() => window.mapjs.getWMS()
        .map((l) => [l.name, l.getLegendURL()]).sort()))
        .toEqual([['embalses', `${WMS_URL}/contorno.png`], ['rios', `${WMS_URL}/estilo2.png`]]);
      await expect.poll(() => styleRequested(requests, 'rios', 'estilo2'), { timeout }).toBe(true);

      const selector = await openStyleSelector(page, 'rios');
      expect(selector.options.map((option) => [option.value, option.label]))
        .toEqual([['estilo2', 'Estilo estilo2'], ['estilo1', 'Estilo estilo1']]);
      expect(selector.selected).toBe('estilo2');
      await chooseStyle(page, 'estilo1');
      await expect.poll(() => page.evaluate(() => window.mapjs.getWMS()
        .find((l) => l.name === 'rios').getLegendURL()), { timeout }).toBe(`${WMS_URL}/estilo1.png`);
      await expect.poll(() => styleRequested(requests, 'rios', 'estilo1'), { timeout }).toBe(true);
      expect(await page.evaluate(() => window.mapjs.getWMS()
        .find((l) => l.name === 'embalses').getStyles())).toBe('contorno');

      const other = await openStyleSelector(page, 'embalses');
      expect(other.options.map((option) => option.value)).toEqual(['contorno', 'lamina']);
      expect(other.selected).toBe('contorno');
    });

    test('compatibilidad: estilos del servicio (styles) y capas sin estilos configurados', async ({ page }) => {
      await mockWMS(page);
      await openMap(page, impl, {
        precharged: {
          services: [{
            type: 'WMS', name: 'Hidrografía sin capas', url: `${WMS_URL}?`, styles: ['estilo2', 'estilo1'],
          }],
        },
      });
      await addWMSFromCatalog(page, 'Hidrografía sin capas', ['rios', 'embalses'], timeout);
      await expect.poll(() => page.evaluate(() => window.mapjs.getWMS()
        .map((l) => [l.name, l.getStyles() || '']).sort()), { timeout })
        .toEqual([['embalses', ''], ['rios', 'estilo2']]);
      expect((await openStyleSelector(page, 'rios')).options.map((option) => option.value))
        .toEqual(['estilo2', 'estilo1']);
      await expect(page.locator('#m-layerswitcher-style .m-layerswitcher-style-sld-button'))
        .toHaveCount(0);
      await page.locator('div.m-dialog.info div.m-button > button').last().click();
      const published = await openStyleSelector(page, 'embalses');
      expect(published.options.map((option) => option.value)).toEqual(['lamina', 'contorno']);
      expect(published.selected).toBe('lamina');
      await page.locator('div.m-dialog.info div.m-button > button').last().click();

      await addSampleLayers(page, { raster: false });
      await expect(layerRow(page, 'puntos')).toHaveCount(1, { timeout });
      expect(await page.evaluate(() => window.puntos.predefinedStyles.length)).toBe(1);
      const single = await openStyleSelector(page, 'puntos');
      expect(single.options).toHaveLength(1);
      await expect(page.locator('#m-layerswitcher-style .m-layerswitcher-style-sld-button'))
        .toHaveCount(1);
      await page.locator('div.m-dialog.info div.m-button > button').last().click();
    });

    test('WFS y OGC API Features: estilos de cada capa por su identificador en el servicio', async ({ page }) => {
      await openMap(page, impl, {
        precharged: {
          services: [{
            type: 'WFS',
            name: 'WFS de prueba',
            url: `${HOST}/wfs`,
            layers: [{ name: 'prueba:puntos', styles: [pointStyle('Rojos', '#ff0000'), pointStyle('Azules', '#0000ff')] }],
          }, {
            type: 'OGCAPIFeatures',
            name: 'OGC API de prueba',
            url: `${HOST}/ogc`,
            layers: [
              { name: 'otra', styles: [pointStyle('Negros', '#000000')] },
              { name: 'puntos', styles: [pointStyle('Verdes', '#008000'), pointStyle('Naranjas', '#ff8000')] },
            ],
          }],
        },
      });
      await page.evaluate((host) => {
        const control = window.mp.controls[0];
        control.addLayer({
          existingLayer: new IDEE.layer.WFS({
            url: `${host}/wfs?`, namespace: 'prueba', name: 'puntos', legend: 'WFS puntos', geometry: 'POINT', extract: false,
          }),
        });
        control.addLayer({
          existingLayer: new IDEE.layer.OGCAPIFeatures({
            url: `${host}/ogc/collections/`, name: 'puntos', legend: 'OGC puntos',
          }),
        });
      }, HOST);
      await expect.poll(async () => (await renderedStyle(page, impl, 'WFS puntos', 'Uno'))?.fill, { timeout })
        .toBe('#ff0000');
      await expect.poll(async () => (await renderedStyle(page, impl, 'OGC puntos', 'Uno'))?.fill, { timeout })
        .toBe('#008000');

      const wfsRow = page.locator('#layerswitcher-layers li', { hasText: 'WFS puntos' });
      expect((await openStyleSelector(page, wfsRow)).options.map((option) => option.label))
        .toEqual(['Rojos', 'Azules']);
      await chooseStyle(page, '1');
      await expect.poll(async () => (await renderedStyle(page, impl, 'WFS puntos', 'Dos'))?.fill, { timeout })
        .toBe('#0000ff');
      expect((await renderedStyle(page, impl, 'OGC puntos', 'Dos')).fill).toBe('#008000');

      const ogcRow = page.locator('#layerswitcher-layers li', { hasText: 'OGC puntos' });
      expect((await openStyleSelector(page, ogcRow)).options.map((option) => option.label))
        .toEqual(['Verdes', 'Naranjas']);
    });

    test('KML y MVT: estilos del servicio en lugar de los propios', async ({ page }) => {
      const kmlUrl = `${SERVER}/test/playwright/fixtures/kmz/basic.kml`;
      await openMap(page, impl, {
        precharged: {
          services: [{
            type: 'KML',
            name: 'KML de prueba',
            url: kmlUrl,
            styles: [pointStyle('Morado', MORADO), pointStyle('Amarillo', AMARILLO)],
          }, {
            type: 'MVT',
            name: 'MVT de prueba',
            url: `${HOST}/teselas/{z}/{x}/{y}.pbf`,
            styles: [
              { name: 'Rojo', point: { radius: 10, fill: { color: '#ff0000', opacity: 1 } } },
              { name: 'Azul', point: { radius: 10, fill: { color: '#0000ff', opacity: 1 } } },
            ],
          }],
        },
      });
      await addFromCatalog(page, 'KML de prueba', 'KML', timeout);
      await expect.poll(async () => (await renderedStyle(page, impl, 'KML', 'Primero'))?.fill, { timeout })
        .toBe(MORADO);
      expect(await page.evaluate(() => window.mapjs.getKML()[0].options.extractStyles)).toBe(false);
      await openStyleSelector(page, page.locator('#layerswitcher-layers li', { hasText: 'KML' }));
      await chooseStyle(page, '1');
      await expect.poll(async () => (await renderedStyle(page, impl, 'KML', 'Primero'))?.fill, { timeout })
        .toBe(AMARILLO);

      await page.evaluate((host) => {
        window.mvt = new IDEE.layer.MVT({
          url: `${host}/teselas/{z}/{x}/{y}.pbf`, name: 'teselas', legend: 'Teselas',
        });
        window.mp.controls[0].addLayer({ existingLayer: window.mvt });
      }, HOST);
      await expect.poll(() => page.evaluate(() => window.mvt.getStyle()?.get('name')), { timeout }).toBe('Rojo');
      const drawn = (engine) => page.evaluate(async (implementation) => {
        if (implementation === 'ol') {
          // eslint-disable-next-line no-underscore-dangle
          const olStyleFn = window.mvt.getStyle().getImpl().olStyleFn_;
          return window.mvt.getImpl().getLayer().getStyle() === olStyleFn
            ? window.mvt.getStyle().get('name') : null;
        }
        const provider = window.mvt.getImpl().getLayer()?.imageryProvider;
        if (!provider) return null;
        const canvas = await provider.requestImage(0, 0, 1);
        return Array.from(canvas.getContext('2d').getImageData(128, 128, 1, 1).data).join(',');
      }, engine);
      await expect.poll(() => drawn(impl), { timeout }).toBe(impl === 'ol' ? 'Rojo' : '255,0,0,255');
      await openStyleSelector(page, 'teselas');
      await chooseStyle(page, '1');
      await expect.poll(() => drawn(impl), { timeout }).toBe(impl === 'ol' ? 'Azul' : '0,0,255,255');
    });

    test('GeoTIFF: estilos ráster del servicio en 2D y en 3D', async ({ page }) => {
      const tifUrl = `${SERVER}/test/playwright/fixtures/refresh/raster.tif`;
      await openMap(page, impl, {
        precharged: {
          services: [{
            type: 'GeoTIFF',
            name: 'GeoTIFF de prueba',
            url: tifUrl,
            styles: [{ name: 'Solo rojo', bands: [1, 0, 0] }, { name: 'Solo azul', bands: [0, 0, 3] }],
          }],
        },
      });
      await addFromCatalog(page, 'GeoTIFF de prueba', 'Ráster', timeout);
      await expect.poll(() => page.evaluate(() => window.mapjs.getGeoTIFF()[0]?.getStyle()?.get('name')), { timeout })
        .toBe('Solo rojo');
      const drawn = () => page.evaluate(async (implementation) => {
        const layer = window.mapjs.getGeoTIFF()[0];
        if (implementation === 'ol') {
          return JSON.stringify(layer.getImpl().style?.color || null);
        }
        const provider = layer.getImpl().getLayer()?.imageryProvider;
        // eslint-disable-next-line no-underscore-dangle
        if (!provider?.renderer_) return null;
        const position = window.Cesium.Cartographic.fromDegrees(0.1, 0.1);
        const { x, y } = provider.tilingScheme.positionToTileXY(position, 6);
        const rect = provider.tilingScheme.tileXYToRectangle(x, y, 6);
        const canvas = await provider.requestImage(x, y, 6);
        const px = Math.floor(((position.longitude - rect.west) / rect.width) * canvas.width);
        const py = Math.floor(((rect.north - position.latitude) / rect.height) * canvas.height);
        return Array.from(canvas.getContext('2d').getImageData(px, py, 1, 1).data).join(',');
      }, impl);
      const channels = (value) => value.split(',').map(Number);
      if (impl === 'ol') {
        await expect.poll(drawn, { timeout }).toContain('["band",1],0,0');
      } else {
        await expect.poll(async () => {
          const value = await drawn();
          if (!value) return false;
          const [, g, b, a] = channels(value);
          return g === 0 && b === 0 && a === 255;
        }, { timeout }).toBe(true);
      }
      const name = await page.evaluate(() => window.mapjs.getGeoTIFF()[0].name);
      const selector = await openStyleSelector(page, name);
      expect(selector.options.map((option) => option.label)).toEqual(['Solo rojo', 'Solo azul']);
      await chooseStyle(page, '1');
      if (impl === 'ol') {
        await expect.poll(drawn, { timeout }).toContain('0,0,["band",3]');
      } else {
        await expect.poll(async () => {
          const value = await drawn();
          if (!value) return false;
          const [r, g, , a] = channels(value);
          return r === 0 && g === 0 && a === 255;
        }, { timeout }).toBe(true);
      }
    });

    test('propiedades que la implementación no puede dibujar: aviso en el selector y el estilo se aplica', async ({ page }) => {
      await openMap(page, impl, { precharged: EXAMPLE });
      await waitPrecharged(page, 2, timeout);
      await addFromCatalog(page, 'Zonas de ejemplo', 'Zonas', timeout);
      await expect.poll(async () => (await renderedStyle(page, impl, 'Zonas', 'Zona Sur'))?.fill, { timeout })
        .toBe(VERDE);
      const selector = await openStyleSelector(page, 'Zonas');
      const unsupported = Object.fromEntries(selector.options
        .map((option) => [option.label, option.unsupported]));
      expect(unsupported).toEqual({
        Verde: '',
        Naranja: '',
        'Azul serializado': '',
        'Rojo discontinuo': impl === 'cesium' ? 'polygon.stroke.linedash' : '',
      });
      const notice = page.locator('#m-layerswitcher-style .m-layerswitcher-style-notice');
      await expect(notice).toBeHidden();
      await page.selectOption('#m-layerswitcher-style-select', '3');
      if (impl === 'cesium') {
        await expect(notice).toBeVisible();
        await expect(notice).toContainText('polygon.stroke.linedash');
      } else {
        await expect(notice).toBeHidden();
      }
      await page.locator('#m-layerswitcher-style .m-layerswitcher-style-change-button').click();
      await expect.poll(async () => (await renderedStyle(page, impl, 'Zonas', 'Zona Sur'))?.fill, { timeout })
        .toBe(ROJO);
      expect(await page.evaluate(() => window.mapjs.getLayers().find((l) => l.legend === 'Zonas')
        .getUnsupportedStyleProperties(window.mapjs.getLayers().find((l) => l.legend === 'Zonas').getStyle())))
        .toEqual(impl === 'cesium' ? ['polygon.stroke.linedash'] : []);
    });
  });
};
