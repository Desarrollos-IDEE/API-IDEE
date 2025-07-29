import { test, expect } from '@playwright/test';

test.describe('Eventos', () => {
  let map;
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
      map = IDEE.map({ container: 'map' });
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
      return [hitPOP];
    });
    expect(res[0]).toBe(6);// Eventos POPUP
    await page.waitForTimeout(1000);
    expect(hitROT).toBe(1);// Evento ROTATION
  });
});
