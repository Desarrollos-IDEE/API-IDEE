import { test, expect } from '@playwright/test';

/** Espera a que el mapa termine de pintar (imagen del WMS incluida) antes de la captura. */
const rendered = (page) => page.evaluate(() => new Promise((resolve) => {
  const olMap = window.mapjs.getMapImpl();
  olMap.once('rendercomplete', () => resolve());
  olMap.render();
}));

test('Comprobamos que funciona styles en WMS', async ({ page }) => {
  await page.goto('/test/playwright/ol/basic-ol.html');
  await page.evaluate(() => {
    const mapjs = IDEE.map({
      container: 'map',
    });
    window.mapjs = mapjs;
  });
  await page.waitForFunction(() => window.mapjs.isFinished());
  await page.evaluate(() => {
    const wms = new IDEE.layer.WMS({
      url: 'https://www.ign.es/wms-inspire/unidades-administrativas',
      name: 'AU.AdministrativeBoundary',
      tiled: false,
      styles: 'LimitesRojo',
    });
    window.wms = wms;
  });

  await page.evaluate(() => {
    return new Promise((resolve) => {
      window.mapjs.on(IDEE.evt.ADDED_WMS, () => {
        resolve();
      });
      window.mapjs.addLayers(window.wms);
    });
  });
  await rendered(page);
  await expect(page).toHaveScreenshot('snapshot.png', { maxDiffPixelRatio: 0.5 });
});
