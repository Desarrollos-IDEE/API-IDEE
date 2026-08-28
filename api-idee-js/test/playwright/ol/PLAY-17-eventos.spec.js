import { test, expect } from '@playwright/test';

test.describe('Eventos', () => {
  test('Triggers de los eventos', async ({ page }) => {
    let hitROT = 0;

    await page.goto('/test/playwright/ol/basic-ol.html');

    page.on('console', (msg) => {
      if (msg.type() === 'log' && msg.text().includes('Rotation: ')) {
        hitROT += 1;
      }
    });

    const res = await page.evaluate(async () => {
      let hitPOP = 0;
      let hitREM = 0;
      const map = IDEE.map({ container: 'map' });
      window.map = map;
      // Eventos POPUP trigger mapa
      map.on(IDEE.evt.POPUP_ADDED, () => {
        hitPOP += 1;
      });
      map.on(IDEE.evt.POPUP_REMOVED, () => {
        hitPOP += 1;
      });
      // Evento ROTATION
      map.on(IDEE.evt.CHANGE_ROTATION, (rot) => {
        console.log(`Rotation: ${rot}`);
      });
      const popup = new IDEE.Popup();
      const featureTabOpts = {
        'icon': 'g-cartografia-pin',
        'title': 'popup',
        'content': 'Ventana de popup de prueba',
      };
      const provincias = new IDEE.layer.GeoJSON({
        name: 'Provincias',
        url: 'https://www.ideandalucia.es/services/CDAV_01_limites_administrativos/wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=CDAV_01_limites_administrativos:cav_01_g13_01_Provincia&maxFeatures=50&outputFormat=application%2Fjson',
        extract: false,
      });
      map.addLayers([provincias]);
      // Evento REMOVED_FROM_MAP
      provincias.on(IDEE.evt.REMOVED_FROM_MAP, () => {
        hitREM += 1;
      });
      // Eventos POPUP trigger popup
      popup.on(IDEE.evt.POPUP_ADDED, () => {
        hitPOP += 1;
      });
      popup.on(IDEE.evt.POPUP_REMOVED, () => {
        hitPOP += 1;
      });
      popup.on(IDEE.evt.POPUP_ADDED_TAB, () => {
        hitPOP += 1;
      });
      popup.on(IDEE.evt.POPUP_REMOVED_TAB, () => {
        hitPOP += 1;
      });
      popup.addTab(featureTabOpts);
      map.addPopup(popup, [240829, 4143088]);
      popup.removeTab(featureTabOpts);
      map.removePopup(popup);
      map.setRotation(10);
      map.removeLayers([provincias]);
      return [hitPOP, hitREM];
    });
    expect(res[0]).toBe(6);// Eventos POPUP
    await page.waitForTimeout(1000);
    expect(hitROT).toBe(1);// Evento ROTATION
    expect(res[1]).toBe(1);// Evento REMOVED_FROM_MAP
  });
});
