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
        const kml_001 = new IDEE.layer.KML({
          url: 'https://componentes.idee.es/estaticos/Datos/KML/arbda_sing_se.kml',
          name: 'arbda_sing_se',
          legend: 'arbda_sing Sevilla',
        });
        window.kml_001 = kml_001;
        window.map.addLayers(kml_001);
      });

      await page.waitForTimeout(5000);
      await page.evaluate(() => window.kml_001.setURL('https://componentes.idee.es/estaticos/Datos/KML/las_huertas_n1.kml'));
      const urlKML = await page.evaluate(() => window.kml_001.url);
      expect(urlKML).toEqual('https://componentes.idee.es/estaticos/Datos/KML/las_huertas_n1.kml');
    });
  });
});
