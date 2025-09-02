import { test, expect } from '@playwright/test';

test.describe('popup muentra nombre de capa', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/test/playwright/ol/basic-ol.html');
    await page.evaluate(() => {
      const map = IDEE.map({ container: 'map' });
      window.map = map;
    });
  });

  test('hacer click en feature', async ({ page }) => {
    await page.evaluate(() => {
      const capaPrueba = new IDEE.layer.Vector({
        name: 'capa de prueba',
        legend: 'feature que cubre Andalucía',
        maxExtent: [-837505.6678977766, 4299847.100283837, -181529.7548292378, 4682782.337478167],
      });
      window.capaPrueba = capaPrueba;

      const feature = new IDEE.Feature('feature', {
        'type': 'Feature',
        'id': 'feat',
        'geometry': {
          'type': 'Polygon',
          'coordinates': [
            [
              [-823956.2616231939, 4461352.875376061],
              [-837505.6678977766, 4516350.705291635],
              [-808458.3599768856, 4576579.783636103],
              [-771643.8862523035, 4608836.357204078],
              [-687492.6639833332, 4571101.314854147],
              [-561997.1693492862, 4682782.337478167],
              [-475273.4235641249, 4628499.248796947],
              [-307768.7779543288, 4654713.530840449],
              [-285712.2032697074, 4648887.247889223],
              [-219654.8931254116, 4560502.002194667],
              [-181529.7548292378, 4491263.446881511],
              [-243181.8131895841, 4399925.156992837],
              [-489765.1544743003, 4392575.873971259],
              [-624739.4559405643, 4299847.100283837],
            ],
          ],
        },
        'geometry_name': 'geometry',
        'properties': {
          'Comunidad Autonoma': 'Andalucía',
        },
      });
      window.feature = feature;

      window.map.on(IDEE.evt.ADDED_LAYER, () => {
        window.map.getMapImpl().on('rendercomplete', async () => {
          window.map.setBbox(window.capaPrueba.getMaxExtent());
        });
      });

      window.capaPrueba.addFeatures(window.feature);
      window.map.addLayers(window.capaPrueba);
    });

    await page.waitForTimeout(2000);
    await page.mouse.click(640, 360);
    const popup = await page.locator('.m-popup.m-collapsed .m-body');
    const text = await popup.innerText({ timeout: 2000 });
    expect(text).toContain('feature que cubre Andalucía');
  });
});
