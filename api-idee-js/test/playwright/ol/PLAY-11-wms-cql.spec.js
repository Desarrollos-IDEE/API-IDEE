import { test, expect } from '@playwright/test';

const WMS_URL = 'https://wms-cql.test/wms';
const PNG_1PX = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
);
const CAPABILITIES = `<?xml version="1.0" encoding="UTF-8"?>
<WMS_Capabilities version="1.3.0" xmlns="http://www.opengis.net/wms" xmlns:xlink="http://www.w3.org/1999/xlink">
  <Service><Name>WMS</Name><Title>Servicio de prueba</Title></Service>
  <Capability>
    <Request>
      <GetCapabilities><Format>text/xml</Format><DCPType><HTTP><Get><OnlineResource xlink:href="${WMS_URL}?"/></Get></HTTP></DCPType></GetCapabilities>
      <GetMap><Format>image/png</Format><DCPType><HTTP><Get><OnlineResource xlink:href="${WMS_URL}?"/></Get></HTTP></DCPType></GetMap>
    </Request>
    <Exception><Format>XML</Format></Exception>
    <Layer><Title>Raíz</Title><CRS>EPSG:4326</CRS><CRS>EPSG:3857</CRS>
      <EX_GeographicBoundingBox><westBoundLongitude>-10</westBoundLongitude><eastBoundLongitude>5</eastBoundLongitude><southBoundLatitude>35</southBoundLatitude><northBoundLatitude>44</northBoundLatitude></EX_GeographicBoundingBox>
      <Layer queryable="1"><Name>limites</Name><Title>Límites</Title></Layer>
    </Layer>
  </Capability>
</WMS_Capabilities>`;

test('cql en WMS: se puede asignar antes de que exista la fuente y se usa al crearla', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const getMap = [];
  let releaseCapabilities;
  const capabilitiesReady = new Promise((resolve) => { releaseCapabilities = resolve; });
  await page.route(`${WMS_URL}**`, async (route) => {
    const url = new URL(route.request().url());
    const params = Object.fromEntries([...url.searchParams].map(([key, value]) => [key.toUpperCase(), value]));
    const headers = { 'access-control-allow-origin': '*' };
    if (/getcapabilities/i.test(params.REQUEST)) {
      await capabilitiesReady;
      return route.fulfill({
        status: 200, headers, contentType: 'text/xml', body: CAPABILITIES,
      });
    }
    if (/getmap/i.test(params.REQUEST)) getMap.push(params.CQL_FILTER);
    return route.fulfill({
      status: 200, headers, contentType: 'image/png', body: PNG_1PX,
    });
  });
  await page.goto('/test/playwright/ol/basic-ol.html');

  const before = await page.evaluate((url) => {
    window.mapjs = IDEE.map({
      container: 'map', layers: [], controls: [], center: [-411884, 4927603], zoom: 6,
    });
    window.wms = new IDEE.layer.WMS({ url, name: 'limites', tiled: false });
    window.mapjs.addLayers(window.wms);
    window.wms.cql = "nombre LIKE '%Aragón%'";
    window.wms.cql = "nombre LIKE '%Galicia%'";
    return {
      layer: Boolean(window.wms.getImpl().getLayer()),
      source: Boolean(window.wms.getImpl().getLayer()?.getSource()),
      cql: window.wms.cql,
    };
  }, WMS_URL);
  expect(before).toEqual({ layer: true, source: false, cql: "nombre LIKE '%Galicia%'" });

  releaseCapabilities();
  await expect.poll(() => getMap.length, { timeout: 15000 }).toBeGreaterThan(0);
  expect(getMap.every((cql) => cql === "nombre LIKE '%Galicia%'")).toBe(true);

  const requested = getMap.length;
  await page.evaluate(() => { window.wms.cql = "nombre LIKE '%Murcia%'"; });
  await expect.poll(() => getMap.slice(requested), { timeout: 15000 })
    .toContain("nombre LIKE '%Murcia%'");
  expect(errors).toEqual([]);
});

// Desactivado temporalmente: depende del WMS real de www.ign.es y de capturas de pantalla.
//
// /** Espera a que el mapa termine de pintar (imagen del WMS incluida) antes de la captura. */
// const rendered = (page) => page.evaluate(() => new Promise((resolve) => {
//   const olMap = window.mapjs.getMapImpl();
//   olMap.once('rendercomplete', () => resolve());
//   olMap.render();
// }));
//
// test('Comprobamos que funciona cql en WMS', async ({ page }) => {
//   await page.goto('/test/playwright/ol/basic-ol.html');
//   await page.evaluate(() => {
//     const mapjs = IDEE.map({
//       container: 'map',
//     });
//     window.mapjs = mapjs;
//   });
//   await page.waitForFunction(() => window.mapjs.isFinished());
//   await page.evaluate(() => {
//     const wms = new IDEE.layer.WMS(
//       {
//         url: 'https://www.ign.es/wms-inspire/unidades-administrativas',
//         name: 'AU.AdministrativeBoundary',
//         tiled: false,
//       },
//       {
//       },
//       {
//         cql: "name_boundary LIKE '%Aragón%'",
//       },
//     );
//     window.wms = wms;
//   });
//   await page.evaluate(() => {
//     return new Promise((resolve) => {
//       window.mapjs.on(IDEE.evt.ADDED_WMS, () => {
//         resolve();
//       });
//       window.mapjs.addLayers(window.wms);
//     });
//   });
//   await rendered(page);
//   await expect(page).toHaveScreenshot('snapshot-aragon.png', { maxDiffPixelRatio: 0.5 });
//   await page.evaluate(() => {
//     window.wms.cql = "name_boundary LIKE '%Galicia%'";
//   });
//   await rendered(page);
//   await expect(page).toHaveScreenshot('snapshot-galicia.png', { maxDiffPixelRatio: 0.5 });
// });
