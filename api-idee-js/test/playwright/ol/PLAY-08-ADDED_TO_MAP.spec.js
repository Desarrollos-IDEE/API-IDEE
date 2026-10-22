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
    const wms001 = new IDEE.layer.WMS({
      url: 'http://www.ign.es/wms-inspire/unidades-administrativas?',
      name: 'AU.AdministrativeBoundary',
      legend: 'Límite administrativo',
    });
    window.wms001 = wms001;

    window.wms001.on(IDEE.evt.ADDED_TO_MAP, (facade) => {
      // eslint-disable-next-line no-console -- el test escucha este mensaje en la consola
      console.log('Capa WMS añadida');
    });
  });
  await page.evaluate(() => {
    return new Promise((resolve) => {
      window.wms001.on(IDEE.evt.ADDED_TO_MAP, () => {
        resolve();
      });
      window.mapjs.addLayers([window.wms001]);
    });
  });
  expect(hasMessage).toBe(true);
});
