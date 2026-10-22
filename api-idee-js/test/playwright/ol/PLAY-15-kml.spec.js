import { test, expect } from '@playwright/test';

test.describe('IDEE.layer.KML', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/test/playwright/ol/basic-ol.html');
    await page.evaluate(() => {
      const map = IDEE.map({
        container: 'map',
        center: [-516514.279416561, 4874194.031273619],
        zoom: 7,
      });
      window.map = map;
    });
  });

  test.describe('Method setURL', () => {
    test('Change URL', async ({ page }) => {
      await page.evaluate(() => {
        const kml001 = new IDEE.layer.KML({
          url: 'https://www.ign.es/web/resources/delegaciones/delegacionesIGN.kml',
          name: 'Delegaciones-IGN',
          legend: 'Delegaciones IGN',
        });
        window.kml001 = kml001;
        window.map.addLayers(kml001);
      });

      await page.waitForTimeout(5000);
      await page.evaluate(() => window.kml001.setURL('https://componentes.idee.es/estaticos/Datos/KML/las_huertas_n1.kml'));
      const urlKML = await page.evaluate(() => window.kml001.url);
      expect(urlKML).toEqual('https://componentes.idee.es/estaticos/Datos/KML/las_huertas_n1.kml');
    });
  });
});
