import { test, expect } from '@playwright/test';
import {
  TIMEOUT, TILES_URL, configureEngine, mockTiles, openMap, addSampleLayers, layerRow,
} from './helpers';

/*
 * Herramientas y submenús del layerswitcher comunes a 2D y 3D: repintado según el
 * panel, grupos, búsqueda de servicios por URL (capacidades WMS simuladas), cambio
 * de estilo y aviso de tipos de capa no disponibles en la implementación.
 */
const WMS_URL = 'https://wms.layerswitcher.test/wms';
const CORS = { 'access-control-allow-origin': '*' };
const PNG_1PX = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
);
const BBOX = `<EX_GeographicBoundingBox>
  <westBoundLongitude>-10</westBoundLongitude><eastBoundLongitude>5</eastBoundLongitude>
  <southBoundLatitude>35</southBoundLatitude><northBoundLatitude>44</northBoundLatitude>
</EX_GeographicBoundingBox>`;
const style = (name) => `<Style><Name>${name}</Name><Title>Estilo ${name}</Title>
  <LegendURL width="20" height="20"><Format>image/png</Format>
    <OnlineResource xmlns:xlink="http://www.w3.org/1999/xlink" xlink:type="simple" xlink:href="${WMS_URL}/${name}.png"/>
  </LegendURL></Style>`;
const WMS_CAPABILITIES = `<?xml version="1.0" encoding="UTF-8"?>
<WMS_Capabilities version="1.3.0" xmlns="http://www.opengis.net/wms" xmlns:xlink="http://www.w3.org/1999/xlink">
  <Service><Name>WMS</Name><Title>Servicio de prueba</Title><Abstract>Servicio simulado</Abstract></Service>
  <Capability>
    <Request>
      <GetCapabilities><Format>text/xml</Format><DCPType><HTTP><Get><OnlineResource xlink:href="${WMS_URL}?"/></Get></HTTP></DCPType></GetCapabilities>
      <GetMap><Format>image/png</Format><DCPType><HTTP><Get><OnlineResource xlink:href="${WMS_URL}?"/></Get></HTTP></DCPType></GetMap>
    </Request>
    <Exception><Format>XML</Format></Exception>
    <Layer><Title>Raíz</Title><CRS>EPSG:4326</CRS><CRS>EPSG:3857</CRS>${BBOX}
      <Layer queryable="1"><Name>rios</Name><Title>Ríos</Title><Abstract>Red hidrográfica</Abstract>${BBOX}
        ${style('estilo1')}${style('estilo2')}
      </Layer>
      <Layer queryable="1"><Name>embalses</Name><Title>Embalses</Title><Abstract>Láminas de agua</Abstract>${BBOX}</Layer>
    </Layer>
  </Capability>
</WMS_Capabilities>`;

/**
 * Servicio WMS simulado: capacidades con dos capas (una con dos estilos) y PNG para
 * el resto de peticiones.
 * @param {Page} page Página de Playwright.
 * @returns {Promise<Array<String>>} URL pedidas.
 */
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

/** Abre el diálogo de añadir capas y busca una URL. */
const searchService = async (page, url) => {
  await page.locator('#layerswitcher-add-layer').click();
  const input = page.locator('#m-layerswitcher-addservices-search-input');
  await input.fill(url);
  await input.press('Enter');
};

/**
 * Registra las pruebas de herramientas y submenús.
 *
 * @param {String} impl 'ol' o 'cesium'.
 */
// eslint-disable-next-line import/prefer-default-export
export const registerToolsTests = (impl) => {
  test.describe(`Layerswitcher: herramientas y submenús (${impl})`, () => {
    configureEngine(impl);
    const timeout = TIMEOUT[impl];

    test.beforeEach(async ({ page }) => {
      await mockTiles(page);
    });

    test('solo se repinta con el panel abierto y se pone al día al abrirlo', async ({ page }) => {
      await openMap(page, impl);
      await addSampleLayers(page);
      await expect(layerRow(page, 'puntos')).toHaveCount(1, { timeout });
      expect(await page.evaluate(() => window.mp.controls[0].getImpl().isRenderEventRegistered()))
        .toBe(true);

      await page.evaluate(() => window.mp.panel.collapse());
      expect(await page.evaluate(() => window.mp.controls[0].getImpl().isRenderEventRegistered()))
        .toBe(false);
      await page.evaluate((tilesUrl) => {
        window.mapjs.addLayers(new IDEE.layer.XYZ({
          url: `${tilesUrl}/nueva/{z}/{x}/{y}.png`, name: 'nueva', legend: 'Nueva', transparent: true,
        }));
      }, TILES_URL);
      // Cerrado no se repinta
      await page.waitForTimeout(1000);
      await expect(layerRow(page, 'nueva')).toHaveCount(0);

      await page.evaluate(() => window.mp.panel.open());
      await expect(layerRow(page, 'nueva')).toHaveCount(1, { timeout });
      expect(await page.evaluate(() => window.mp.controls[0].getImpl().isRenderEventRegistered()))
        .toBe(true);
    });

    test('borra una capa de dentro de un grupo', async ({ page }) => {
      await openMap(page, impl);
      await page.evaluate((tilesUrl) => {
        const xyz = (name) => new IDEE.layer.XYZ({
          url: `${tilesUrl}/${name}/{z}/{x}/{y}.png`, name, legend: name, transparent: true,
        });
        window.grupo = new IDEE.layer.LayerGroup({
          name: 'grupo', legend: 'Grupo', layers: [xyz('hija1'), xyz('hija2')],
        });
        window.mapjs.addLayers(window.grupo);
      }, TILES_URL);
      await expect(layerRow(page, 'hija1')).toHaveCount(1, { timeout });
      await layerRow(page, 'hija1').locator('.g-cartografia-btn-layerswitcher-delete').click();
      await expect.poll(() => page
        .evaluate(() => window.grupo.getLayers().map((l) => l.name)), { timeout })
        .toEqual(['hija2']);
      await expect(layerRow(page, 'hija1')).toHaveCount(0, { timeout });
      await expect(layerRow(page, 'hija2')).toHaveCount(1);
    });

    test('añade una capa XYZ por URL dentro de un grupo', async ({ page }) => {
      await openMap(page, impl);
      await page.evaluate(() => {
        window.grupo = new IDEE.layer.LayerGroup({ name: 'grupo', legend: 'Grupo', layers: [] });
        window.mapjs.addLayers(window.grupo);
      });
      await searchService(page, `${TILES_URL}/porurl/{z}/{x}/{y}.png`);
      const groupSelect = page.locator('select.m-layerswitcher-groups-fields');
      await expect(groupSelect).toHaveCount(1, { timeout });
      // El valor de cada grupo es su identificador agnóstico de la implementación
      const groupId = await page.evaluate(() => window.grupo.idLayer);
      await groupSelect.selectOption(groupId);
      await page.fill('#m-layerswitcher-layer-legend', 'Por URL');
      await page.locator('#m-layerswitcher-layer-button').click();
      await expect.poll(() => page.evaluate(() => window.grupo.getLayers()
        .map((l) => [l.type, l.legend])), { timeout }).toEqual([['XYZ', 'Por URL']]);
    });

    test('lista las capas de las capacidades WMS, añade una y le cambia el estilo', async ({ page }) => {
      const requests = await mockWMS(page);
      await openMap(page, impl);
      await searchService(page, WMS_URL);
      const results = page.locator('#m-layerswitcher-addservices-results #m-layerswitcher-all tbody input');
      await expect(results).toHaveCount(2, { timeout });
      await expect(page.locator('#m-layerswitcher-addservices-results label[for="rios"]'))
        .toHaveAttribute('title', 'Red hidrográfica');
      await page.locator('#m-layerswitcher-addservices-results input#rios').check();
      await page.locator('#m-layerswitcher-addservices-add-btn').click();
      await expect.poll(() => page
        .evaluate(() => window.mapjs.getWMS().map((l) => l.name)), { timeout })
        .toEqual(['rios']);
      await expect(layerRow(page, 'rios')).toHaveCount(1, { timeout });

      // Herramienta de estilo: los estilos vienen de las capacidades
      await layerRow(page, 'rios').locator('.m-layerswitcher-icons-style').click();
      await page.selectOption('#m-layerswitcher-style-select', 'estilo2');
      await page.locator('#m-layerswitcher-style button').click();
      await expect.poll(() => page
        .evaluate(() => window.mapjs.getWMS()[0].getLegendURL()), { timeout })
        .toBe(`${WMS_URL}/estilo2.png`);
      await expect.poll(() => requests.some((url) => /[?&]styles=estilo2(&|$)/i.test(url)), { timeout })
        .toBe(true);
    });

    test('avisa de los tipos de capa que no admite la implementación', async ({ page }) => {
      await page.route('https://styles.layerswitcher.test/**', (route) => route.fulfill({
        status: 200,
        headers: CORS,
        contentType: 'application/json',
        body: JSON.stringify({ version: 8, sources: {}, layers: [] }),
      }));
      await openMap(page, impl);
      // 2D: las teselas 3D solo existen en Cesium; 3D: MapLibre no se puede mostrar sobre el globo
      const url = impl === 'ol'
        ? 'https://tiles3d.layerswitcher.test/tileset.json'
        : 'https://styles.layerswitcher.test/style.json';
      const text = impl === 'ol' ? 'solo está disponible en el mapa 3D' : 'no está disponible en el mapa 3D';
      const before = await page.evaluate(() => window.mapjs.getLayers().length);
      await searchService(page, url);
      await expect(page.locator('div.m-dialog', { hasText: text })).toHaveCount(1, { timeout });
      expect(await page.evaluate(() => window.mapjs.getLayers().length)).toBe(before);
    });
  });
};
