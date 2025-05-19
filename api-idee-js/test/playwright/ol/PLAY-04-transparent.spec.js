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

  let mapjs;
  await page.evaluate(() => {
    mapjs = IDEE.map({
      container: 'map',
    });
  });
  await page.waitForFunction(() => mapjs.isFinished());
  let lyProvincias;
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
    mapjs.addLayers(lyProvincias);
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

  let mapjs;
  await page.evaluate(() => {
    mapjs = IDEE.map({
      container: 'map',
    });
  });
  await page.waitForFunction(() => mapjs.isFinished());
  let wms;
  await page.evaluate(() => {
    wms = new IDEE.layer.WMS({
      url: 'http://www.ign.es/wms-inspire/unidades-administrativas?',
      name: 'AU.AdministrativeUnit',
      legend: 'Capa WMS',
      transparent: true,
    });
    mapjs.addLayers(wms);
  });
  expect(hasWarning).toBe(true);
});
