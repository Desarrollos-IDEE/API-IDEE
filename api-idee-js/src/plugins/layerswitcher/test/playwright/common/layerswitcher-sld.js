import { test, expect } from '@playwright/test';
import {
  TIMEOUT, configureEngine, mockTiles, openMap, layerRow,
  renderedStyle, readStyleSelector, applySelectedStyle,
  // openStyleSelector, chooseStyle,
} from './helpers';

/*
 * Botón de carga de estilos SLD de cada capa, común a 2D y 3D: SLD real publicado
 * por IDEE (GetStyles, se descarga al ejecutar la prueba), SLD con categorías en el
 * formato SE 1.1.0 que exporta QGIS, errores y avisos, y capas sin el botón.
 */
const EXAMPLES = 'http://localhost:8081/src/plugins/layerswitcher/test/styles';
// Desactivado temporalmente: depende del SLD real publicado en servicios.idee.es (recurso externo).
// const IDEE_SLD = 'https://servicios.idee.es/wms-inspire/hidrografia?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetStyles&LAYERS=HY.PhysicalWaters.Waterbodies';
const WMS_URL = 'https://wms-sld.layerswitcher.test/wms';
const CORS = { 'access-control-allow-origin': '*' };
const PNG_1PX = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
);
const WMS_CAPABILITIES = `<?xml version="1.0" encoding="UTF-8"?>
<WMS_Capabilities version="1.3.0" xmlns="http://www.opengis.net/wms" xmlns:xlink="http://www.w3.org/1999/xlink">
  <Service><Name>WMS</Name><Title>Servicio de prueba</Title></Service>
  <Capability>
    <Request>
      <GetCapabilities><Format>text/xml</Format><DCPType><HTTP><Get><OnlineResource xlink:href="${WMS_URL}?"/></Get></HTTP></DCPType></GetCapabilities>
      <GetMap><Format>image/png</Format><DCPType><HTTP><Get><OnlineResource xlink:href="${WMS_URL}?"/></Get></HTTP></DCPType></GetMap>
    </Request>
    <Exception><Format>XML</Format></Exception>
    <Layer><Title>Raíz</Title><CRS>EPSG:4326</CRS><CRS>EPSG:3857</CRS>
      <Layer queryable="1"><Name>rios</Name><Title>Ríos</Title></Layer>
    </Layer>
  </Capability>
</WMS_Capabilities>`;

const qgisRule = (value, color) => `<se:Rule>
  <se:Name>${value}</se:Name>
  <se:Description><se:Title>${value}</se:Title></se:Description>
  <ogc:Filter xmlns:ogc="http://www.opengis.net/ogc">
    <ogc:PropertyIsEqualTo><ogc:PropertyName>tipo</ogc:PropertyName><ogc:Literal>${value}</ogc:Literal></ogc:PropertyIsEqualTo>
  </ogc:Filter>
  <se:PolygonSymbolizer>
    <se:Fill><se:SvgParameter name="fill">${color}</se:SvgParameter></se:Fill>
    <se:Stroke>
      <se:SvgParameter name="stroke">#232323</se:SvgParameter>
      <se:SvgParameter name="stroke-width">1</se:SvgParameter>
      <se:SvgParameter name="stroke-linejoin">bevel</se:SvgParameter>
    </se:Stroke>
  </se:PolygonSymbolizer>
</se:Rule>`;
const QGIS_SLD = `<?xml version="1.0" encoding="UTF-8"?>
<StyledLayerDescriptor xmlns="http://www.opengis.net/sld" xmlns:ogc="http://www.opengis.net/ogc" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:se="http://www.opengis.net/se" version="1.1.0" xsi:schemaLocation="http://www.opengis.net/sld http://schemas.opengis.net/sld/1.1.0/StyledLayerDescriptor.xsd">
  <NamedLayer>
    <se:Name>zonas</se:Name>
    <UserStyle>
      <se:Name>zonas</se:Name>
      <se:FeatureTypeStyle>
        ${qgisRule('bosque', '#1b9e77')}${qgisRule('cultivo', '#d95f02')}${qgisRule('agua', '#7570b3')}
      </se:FeatureTypeStyle>
    </UserStyle>
  </NamedLayer>
</StyledLayerDescriptor>`;
const RASTER_SLD = `<StyledLayerDescriptor version="1.0.0" xmlns="http://www.opengis.net/sld">
  <NamedLayer><Name>mdt</Name><UserStyle><FeatureTypeStyle><Rule>
    <RasterSymbolizer><ColorMap><ColorMapEntry color="#000000" quantity="0"/></ColorMap></RasterSymbolizer>
  </Rule></FeatureTypeStyle></UserStyle></NamedLayer>
</StyledLayerDescriptor>`;
const FILTERS_SLD = `<StyledLayerDescriptor version="1.0.0" xmlns="http://www.opengis.net/sld" xmlns:ogc="http://www.opengis.net/ogc" xmlns:gml="http://www.opengis.net/gml">
  <NamedLayer><Name>zonas</Name><UserStyle><FeatureTypeStyle><Rule>
    <ogc:Filter><ogc:BBOX><ogc:PropertyName>geometry</ogc:PropertyName>
      <gml:Box><gml:coordinates>-10,35 5,44</gml:coordinates></gml:Box>
    </ogc:BBOX></ogc:Filter>
    <PolygonSymbolizer><Fill><CssParameter name="fill">#ff0000</CssParameter></Fill></PolygonSymbolizer>
  </Rule></FeatureTypeStyle></UserStyle></NamedLayer>
</StyledLayerDescriptor>`;
const fill = (color) => `<PolygonSymbolizer><Fill><CssParameter name="fill">${color}</CssParameter></Fill></PolygonSymbolizer>`;
const RULES_SLD = `<StyledLayerDescriptor version="1.0.0" xmlns="http://www.opengis.net/sld" xmlns:ogc="http://www.opengis.net/ogc">
  <NamedLayer><Name>zonas</Name><UserStyle><Name>reglas</Name><FeatureTypeStyle>
    <Rule><PolygonSymbolizer><Stroke><CssParameter name="stroke">#333333</CssParameter></Stroke></PolygonSymbolizer></Rule>
    <Rule><ogc:Filter><ogc:PropertyIsLike wildCard="%" singleChar="_" escape="\\">
      <ogc:PropertyName>nombre</ogc:PropertyName><ogc:Literal>Zona N%</ogc:Literal>
    </ogc:PropertyIsLike></ogc:Filter>${fill('#2e7d32')}</Rule>
    <Rule><ogc:Filter><ogc:And>
      <ogc:PropertyIsGreaterThan><ogc:PropertyName>area</ogc:PropertyName><ogc:Literal>5</ogc:Literal></ogc:PropertyIsGreaterThan>
      <ogc:Not><ogc:PropertyIsEqualTo><ogc:PropertyName>tipo</ogc:PropertyName><ogc:Literal>agua</ogc:Literal></ogc:PropertyIsEqualTo></ogc:Not>
    </ogc:And></ogc:Filter>${fill('#ef6c00')}</Rule>
    <Rule><ogc:Filter><ogc:PropertyIsBetween><ogc:PropertyName>area</ogc:PropertyName>
      <ogc:LowerBoundary><ogc:Literal>2</ogc:Literal></ogc:LowerBoundary><ogc:UpperBoundary><ogc:Literal>3</ogc:Literal></ogc:UpperBoundary>
    </ogc:PropertyIsBetween></ogc:Filter>
      <TextSymbolizer><Label><ogc:PropertyName>nombre</ogc:PropertyName></Label></TextSymbolizer></Rule>
    <Rule><ElseFilter/>${fill('#1565c0')}</Rule>
  </FeatureTypeStyle></UserStyle></NamedLayer>
</StyledLayerDescriptor>`;

const sldFile = (name, content) => ({
  name, mimeType: 'application/xml', buffer: Buffer.isBuffer(content) ? content : Buffer.from(content),
});

/**
 * Abre el diálogo de estilos de la capa si no lo está. Si el panel se vuelve a pintar
 * mientras se pulsa el botón (Cesium con poca CPU), el clic se repite.
 */
const openStyleDialog = (page, name, timeout) => expect(async () => {
  if (await page.locator('#m-layerswitcher-style').count() === 0) {
    await layerRow(page, name).locator('.m-layerswitcher-icons-style').click({ timeout: 2000 });
  }
  await expect(page.locator('#m-layerswitcher-style')).toHaveCount(1, { timeout: 2000 });
}).toPass({ timeout, intervals: [500, 1000, 2000] });

/** Abre el diálogo de estilos de la capa si no lo está, pulsa la carga SLD y elige el fichero. */
const uploadSLD = async (page, name, file, timeout = 40000) => {
  await openStyleDialog(page, name, timeout);
  const [chooser] = await Promise.all([
    page.waitForEvent('filechooser'),
    page.locator('#m-layerswitcher-style .m-layerswitcher-style-sld-button').click(),
  ]);
  await chooser.setFiles(file);
};

// Desactivado temporalmente: depende del SLD real publicado en servicios.idee.es (recurso externo).
// /**
//  * Descarga un SLD real. El servicio de IDEE a veces no responde: se reintenta.
//  *
//  * @param {Page} page Página de Playwright.
//  * @param {String} url URL del SLD.
//  * @returns {Promise<Buffer>} Contenido del SLD.
//  */
// const downloadSLD = async (page, url) => {
//   let lastError;
//   for (let attempt = 0; attempt < 4; attempt += 1) {
//     try {
//       // eslint-disable-next-line no-await-in-loop
//       const response = await page.request.get(url, { timeout: 15000 });
//       // eslint-disable-next-line no-await-in-loop
//       if (response.ok()) return await response.body();
//       lastError = new Error(`HTTP ${response.status()}`);
//     } catch (error) {
//       lastError = error;
//     }
//   }
//   throw lastError;
// };

const addZonas = (page) => page.evaluate((url) => {
  window.zonas = new IDEE.layer.GeoJSON({
    url, name: 'zonas', legend: 'Zonas', extract: true,
  });
  window.mapjs.addLayers(window.zonas);
}, `${EXAMPLES}/zonas.geojson`);

/**
 * Registra las pruebas de carga de estilos SLD.
 *
 * @param {String} impl 'ol' o 'cesium'.
 */
// eslint-disable-next-line import/prefer-default-export
export const registerSLDTests = (impl) => {
  test.describe(`Layerswitcher: carga de estilos SLD (${impl})`, () => {
    configureEngine(impl);
    test.describe.configure({ timeout: impl === 'cesium' ? 300000 : 60000 });
    const timeout = TIMEOUT[impl];

    test.beforeEach(async ({ page }) => {
      await mockTiles(page);
      await page.route(`${WMS_URL}**`, (route) => {
        if (/request=getcapabilities/i.test(route.request().url())) {
          return route.fulfill({
            status: 200, headers: CORS, contentType: 'text/xml', body: WMS_CAPABILITIES,
          });
        }
        return route.fulfill({
          status: 200, headers: CORS, contentType: 'image/png', body: PNG_1PX,
        });
      });
      await openMap(page, impl);
      await addZonas(page);
      await expect(layerRow(page, 'zonas').locator('.m-layerswitcher-icons-style')).toHaveCount(1, { timeout });
      await expect.poll(() => renderedStyle(page, impl, 'Zonas', 'Zona Centro'), { timeout }).not.toBeNull();
    });

    // Desactivado temporalmente: depende del SLD real publicado en servicios.idee.es (recurso externo).
    // test('SLD publicado por IDEE: aplica relleno y etiqueta, añade sus estilos y se recupera el anterior', async ({ page }) => {
    //   const sld = await downloadSLD(page, IDEE_SLD);
    //   const before = await renderedStyle(page, impl, 'Zonas', 'Zona Centro');
    //   await uploadSLD(page, 'zonas', sldFile('masas-de-agua.sld', sld));
    //   await expect(page.locator('.m-toast', { hasText: 'Pulsa «Cambiar» para aplicar «Estilo de masas de agua para WMS HI (SLD)»' }))
    //     .toHaveCount(1);
    //   expect((await renderedStyle(page, impl, 'Zonas', 'Zona Centro')).fill).toBe(before.fill);
    //   await applySelectedStyle(page);
    //
    //   await expect.poll(() => renderedStyle(page, impl, 'Zonas', 'Zona Centro'), { timeout })
    //     .toMatchObject({ fill: '#aed1ff', label: null });
    //   const warning = page.locator('.m-toast', { hasText: 'Del SLD se han omitido' });
    //   await expect(warning).toContainText('VendorOption');
    //   await expect(warning).not.toContainText('rangos de escala');
    //   await expect(page.locator('.m-toast', { hasText: 'no describe la capa' })).toHaveCount(0);
    //
    //   await page.evaluate(() => window.mapjs.setZoom(11));
    //   await expect.poll(() => page.evaluate(() => window.mapjs.getScale()), { timeout })
    //     .toBeLessThan(1000000);
    //   await expect.poll(() => renderedStyle(page, impl, 'Zonas', 'Zona Centro'), { timeout })
    //     .toMatchObject({ fill: '#aed1ff', label: 'Zona Centro' });
    //   await page.evaluate(() => window.mapjs.setZoom(6));
    //   await expect.poll(async () => (await renderedStyle(page, impl, 'Zonas', 'Zona Centro'))?.label, { timeout })
    //     .toBeNull();
    //
    //   const selector = await openStyleSelector(page, 'zonas');
    //   expect(selector.options.map((option) => option.label)).toEqual([
    //     'Estilo predeterminado',
    //     'Estilo de masas de agua para WMS HI (SLD)',
    //     'Estilo por defecto Inspire de Humedales (SLD)',
    //   ]);
    //   expect(selector.selected).toBe(selector.options[1].value);
    //   await chooseStyle(page, selector.options[2].value);
    //   await expect.poll(async () => (await renderedStyle(page, impl, 'Zonas', 'Zona Centro'))?.fill, { timeout })
    //     .toBe('#00cccc');
    //
    //   await openStyleSelector(page, 'zonas');
    //   await chooseStyle(page, '0');
    //   await expect.poll(async () => (await renderedStyle(page, impl, 'Zonas', 'Zona Centro'))?.fill, { timeout })
    //     .toBe(before.fill);
    // });

    test('SLD exportado desde QGIS (SE 1.1.0) con categorías por atributo', async ({ page }) => {
      const before = await renderedStyle(page, impl, 'Zonas', 'Zona Norte');
      await uploadSLD(page, 'zonas', sldFile('zonas-qgis.sld', QGIS_SLD));
      await expect(page.locator('.m-toast', { hasText: '«zonas (SLD)»' })).toHaveCount(1);
      await expect(page.locator('.m-toast', { hasText: 'polygon.stroke.linejoin' }))
        .toHaveCount(impl === 'cesium' ? 1 : 0);
      const selector = await readStyleSelector(page);
      expect(selector.options.map((option) => option.label))
        .toEqual(['Estilo predeterminado', 'zonas (SLD)']);
      expect(selector.selected).toBe(selector.options[1].value);
      const dialogNotice = page.locator('#m-layerswitcher-style .m-layerswitcher-style-notice');
      if (impl === 'cesium') {
        await expect(dialogNotice).toContainText('polygon.stroke.linejoin');
      } else {
        await expect(dialogNotice).toBeHidden();
      }
      expect(await renderedStyle(page, impl, 'Zonas', 'Zona Norte')).toEqual(before);
      expect(await page.evaluate(() => window.zonas.getStyle() instanceof IDEE.style.Category))
        .toBe(false);

      await applySelectedStyle(page);
      await expect.poll(async () => (await renderedStyle(page, impl, 'Zonas', 'Zona Norte'))?.fill, { timeout })
        .toBe('#1b9e77');
      expect((await renderedStyle(page, impl, 'Zonas', 'Zona Centro')).fill).toBe('#d95f02');
      expect((await renderedStyle(page, impl, 'Zonas', 'Zona Sur')).fill).toBe('#7570b3');
      expect(await page.evaluate(() => window.zonas.getStyle() instanceof IDEE.style.Category))
        .toBe(true);
    });

    test('SLD con reglas filtradas (PropertyIsLike, And, Not, comparaciones) y ElseFilter', async ({ page }) => {
      await uploadSLD(page, 'zonas', sldFile('reglas.sld', RULES_SLD));
      expect((await readStyleSelector(page)).options.map((option) => option.label))
        .toContain('reglas (SLD)');
      await applySelectedStyle(page);
      const expected = {
        'Zona Norte': {
          fill: '#2e7d32', stroke: '#333333', label: 'Zona Norte',
        },
        'Zona Centro': { fill: '#ef6c00', stroke: '#333333', label: null },
        'Zona Sur': { fill: '#1565c0', stroke: '#333333', label: null },
      };
      const check = async () => {
        // eslint-disable-next-line no-restricted-syntax
        for (const [name, style] of Object.entries(expected)) {
          // eslint-disable-next-line no-await-in-loop
          await expect.poll(() => renderedStyle(page, impl, 'Zonas', name), { timeout })
            .toMatchObject(style);
        }
      };
      await check();
      expect(await page.evaluate(() => {
        const style = window.zonas.getStyle();
        return [style instanceof IDEE.style.Generic, typeof style.getOptions().polygon.fill.color];
      })).toEqual([true, 'function']);
      await expect(page.locator('.m-toast', { hasText: 'Partes del SLD' })).toHaveCount(0);

      await page.evaluate(() => {
        const copy = IDEE.Style.deserialize(window.zonas.getStyle().serialize());
        window.zonas.clearStyle();
        window.zonas.setStyle(copy);
        window.restored = copy;
      });
      expect(await page.evaluate(() => window.zonas.getStyle() === window.restored)).toBe(true);
      await check();
    });

    test('errores: el estilo de la capa no cambia y se explica el motivo', async ({ page }) => {
      await page.evaluate(() => { window.initialStyle = window.zonas.getStyle(); });
      const cases = [
        [sldFile('roto.sld', '<StyledLayerDescriptor><NamedLayer>'), 'no es un XML válido'],
        [sldFile('documento.xml', '<?xml version="1.0"?><kml xmlns="http://www.opengis.net/kml/2.2"><Document/></kml>'), 'no es un documento SLD'],
        [sldFile('mdt.sld', RASTER_SLD), 'solo tiene simbolización ráster'],
        [sldFile('filtros.sld', FILTERS_SLD), 'no tiene ninguna regla compatible'],
        [sldFile('vacio.sld', ''), 'No se ha podido leer el fichero «vacio.sld»'],
        [sldFile('grande.sld', Buffer.alloc(6 * 1024 * 1024, 32)), 'supera el tamaño máximo de 5 MB'],
      ];
      // eslint-disable-next-line no-restricted-syntax
      for (const [file, message] of cases) {
        // eslint-disable-next-line no-await-in-loop
        await uploadSLD(page, 'zonas', file);
        const dialog = page.locator('div.m-dialog.error');
        // eslint-disable-next-line no-await-in-loop
        await expect(dialog).toContainText(message, { timeout });
        // eslint-disable-next-line no-await-in-loop
        await page.locator('div.m-dialog.error div.m-button > button').last().click();
        // eslint-disable-next-line no-await-in-loop
        await expect(dialog).toHaveCount(0);
        // eslint-disable-next-line no-await-in-loop
        expect(await page.evaluate(() => window.zonas.getStyle() === window.initialStyle))
          .toBe(true);
      }
      expect((await readStyleSelector(page)).options.map((option) => option.label))
        .toEqual(['Estilo predeterminado']);
    });

    test('la carga SLD está en el diálogo de estilos de las capas vectoriales con la herramienta sld', async ({ page }) => {
      const closeDialog = () => page.locator('div.m-dialog.info div.m-button > button').last().click();
      const replacePlugin = (tools) => page.evaluate((list) => {
        window.mapjs.removePlugins(window.mp);
        window.mp = new IDEE.plugin.Layerswitcher({
          collapsed: false, precharged: { services: [] }, tools: list,
        });
        window.mapjs.addPlugin(window.mp);
      }, tools);
      await page.evaluate((url) => {
        window.mapjs.addLayers(new IDEE.layer.WMS({ url: `${url}?`, name: 'rios', legend: 'Ríos' }));
      }, WMS_URL);
      await expect(layerRow(page, 'rios')).toHaveCount(1, { timeout });
      await expect(page.locator('.m-layerswitcher-icons-sld')).toHaveCount(0);
      await expect(layerRow(page, 'rios').locator('.m-layerswitcher-icons-style')).toHaveCount(0);
      await openStyleDialog(page, 'zonas', timeout);
      await expect(page.locator('#m-layerswitcher-style .m-layerswitcher-style-sld-button')).toHaveCount(1);
      await closeDialog();

      await replacePlugin(['transparency', 'style']);
      await expect(layerRow(page, 'zonas')).toHaveCount(1, { timeout });
      await expect(layerRow(page, 'zonas').locator('.m-layerswitcher-icons-style')).toHaveCount(0);

      await replacePlugin(['sld']);
      await expect(layerRow(page, 'zonas')).toHaveCount(1, { timeout });
      await openStyleDialog(page, 'zonas', timeout);
      await expect(page.locator('#m-layerswitcher-style .m-layerswitcher-style-sld-button')).toHaveCount(1);
      await closeDialog();
    });
  });
};
