import { test, expect } from '@playwright/test';

test('Capa WMS - ADDED_TO_MAP', async ({ page }) => {
  let hasWarning = false;

  await page.goto('/test/playwright/ol/basic-ol.html');

  page.on('console', (message) => {
    if (message.type() === 'log' && message.text() === 'Capa WMS añadida') {
      hasWarning = true;
    }
  });

  let mapjs;
  await page.evaluate(() => {
    mapjs = IDEE.map({
      container: 'map',
    });
  });

  let wms_001;
  await page.evaluate(() => {
    wms_001 = new IDEE.layer.WMS({
      url: 'http://www.ign.es/wms-inspire/unidades-administrativas?',
      name: 'AU.AdministrativeBoundary',
      legend: 'Límite administrativo',
    });

    wms_001.on(IDEE.evt.ADDED_TO_MAP, () => {
      console.log('Capa WMS añadida');
    });
  });
  test.setTimeout(5_000);
  await page.evaluate(() => {
    mapjs.addLayers([wms_001]);
  });
  expect(hasWarning).toBe(true);
});
