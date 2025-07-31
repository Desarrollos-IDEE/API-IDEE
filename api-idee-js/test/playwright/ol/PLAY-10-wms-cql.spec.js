import { test, expect } from '@playwright/test';

test('Comprobamos que funciona cql en WMS', async ({ page }) => {
  await page.goto('/test/playwright/ol/basic-ol.html');
  await page.evaluate(() => {
    const mapjs = IDEE.map({
      container: 'map',
    });
    window.mapjs = mapjs;
  });
  await page.waitForFunction(() => window.mapjs.isFinished());
  await page.evaluate(() => {
    const wms = new IDEE.layer.WMS(
      {
        url: 'https://www.ign.es/wms-inspire/unidades-administrativas',
        name: 'AU.AdministrativeBoundary',
        tiled: false,
      },
      {
      },
      {
        cql: "name_boundary LIKE '%Aragón%'",
      },
    );
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
  await expect(page).toHaveScreenshot('snapshot-aragon.png', { maxDiffPixelRatio: 0.5 });
  await page.waitForTimeout(2000);
  await page.evaluate(() => {
    window.wms.cql = "name_boundary LIKE '%Galicia%'";
  });
  await expect(page).toHaveScreenshot('snapshot-galicia.png', { maxDiffPixelRatio: 0.5 });
});
