import { test, expect } from '@playwright/test';

test('Comprobamos que funciona styles en WMS', async ({ page }) => {
  await page.goto('/test/playwright/ol/basic-ol.html');
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
      url: 'https://www.ign.es/wms-inspire/unidades-administrativas',
      name: 'AU.AdministrativeBoundary',
      tiled: false,
      styles: 'LimitesRojo',
    });
  });
  await page.evaluate(() => {
    return new Promise((resolve) => {
      mapjs.on(IDEE.evt.ADDED_WMS, () => {
        resolve();
      });
      mapjs.addLayers(wms);
    });
  });
  await expect(page).toHaveScreenshot('snapshot.png');
});
