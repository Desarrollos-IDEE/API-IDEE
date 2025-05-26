import { test, expect } from '@playwright/test';

test('Capa WMS - ADDED_TO_MAP', async ({ page }) => {
  let hasMessage = false;

  await page.goto('/test/playwright/ol/basic-ol.html');

  page.on('console', (msg) => {
    if (msg.type() === 'log' && msg.text() === 'Capa WMS añadida') {
      hasMessage = true;
    }
  });

  await page.evaluate(() => {
    const mapjs = IDEE.map({
      container: 'map',
    });
    window.mapjs = mapjs;
  });

  await page.evaluate(() => {
    const wms_001 = new IDEE.layer.WMS({
      url: 'http://www.ign.es/wms-inspire/unidades-administrativas?',
      name: 'AU.AdministrativeBoundary',
      legend: 'Límite administrativo',
    });

    wms_001.on(IDEE.evt.ADDED_TO_MAP, (facade) => {
      console.log('Capa WMS añadida');
    });

    window.mapjs.addLayers([wms_001]);
  });
  await page.waitForTimeout(5000);
  expect(hasMessage).toBe(true);
});
