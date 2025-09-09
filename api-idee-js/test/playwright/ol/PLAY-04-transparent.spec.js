import { test, expect } from '@playwright/test';

test('Parámetro transparent en capas WFS', async ({ page }) => {
  let hasWarning = false;

  await page.goto('/test/playwright/ol/basic-ol.html');

  const warning = await page.evaluate(() => {
    return IDEE.language.getValue('exception').transparent_deprecated;
  });

  page.on('console', (message) => {
    if (message.type() === 'warning' && message.text() === warning) {
      hasWarning = true;
    }
  });

  await page.evaluate(() => {
    const mapjs = IDEE.map({
      container: 'map',
    });
    window.mapjs = mapjs;
  });
  await page.waitForFunction(() => window.mapjs.isFinished());
  await page.evaluate(() => {
    lyProvincias = new IDEE.layer.WFS({
      url: 'https://hcsigc.juntadeandalucia.es/geoserver/wfs?',
      namespace: 'IECA',
      name: 'sigc_provincias_pob_centroides_1724756847583',
      legend: 'Provincias',
      geometry: 'POINT',
      extract: true,
      transparent: true,
    });
    window.mapjs.addLayers(lyProvincias);
  });
  expect(hasWarning).toBe(true);
});

test('Parámetro transparent en capas WMS', async ({ page }) => {
  let hasWarning = false;

  await page.goto('/test/playwright/ol/basic-ol.html');

  const warning = await page.evaluate(() => {
    return IDEE.language.getValue('exception').transparent_deprecated;
  });

  page.on('console', (message) => {
    if (message.type() === 'warning' && message.text() === warning) {
      hasWarning = true;
    }
  });

  await page.evaluate(() => {
    window.mapjs = IDEE.map({
      container: 'map',
    });
  });
  await page.waitForFunction(() => window.mapjs.isFinished());
  await page.evaluate(() => {
    const wms = new IDEE.layer.WMS({
      url: 'http://www.ign.es/wms-inspire/unidades-administrativas?',
      name: 'AU.AdministrativeUnit',
      legend: 'Capa WMS',
      transparent: true,
    });
    window.mapjs.addLayers(wms);
  });
  expect(hasWarning).toBe(true);
});
