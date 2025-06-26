import { test, expect } from '@playwright/test';

test.describe('Popup', () => {
  let map;
  test('Añadir y eliminar multiples popup', async ({ page }) => {
    await page.goto('/test/playwright/ol/basic-ol.html');
    const res = await page.evaluate(async () => {
      let hit = 0;
      map = IDEE.map({ container: 'map' });
      window.map = map;
      map.on(IDEE.evt.POPUP_ADDED, () => {
        hit += 1;
      });
      map.on(IDEE.evt.POPUP_REMOVED, () => {
        hit -= 1;
      });
      const popup = new IDEE.Popup();
      const popup2 = new IDEE.Popup();
      const popup3 = new IDEE.Popup();
      const popup4 = new IDEE.Popup();
      const featureTabOpts = {
        'icon': 'g-cartografia-pin',
        'title': 'popup',
        'content': 'Ventana de popup de prueba',
      };
      popup.addTab(featureTabOpts);
      popup2.addTab(featureTabOpts);
      popup3.addTab(featureTabOpts);
      popup4.addTab(featureTabOpts);
      map.addPopup(popup, [240892, 4143880]);
      map.addPopup(popup2, [240892, 4143880]);
      const hitTest1 = hit;
      map.addPopup(popup3, [240892, 4143880], false);
      const hitTest2 = hit;
      map.addPopup(popup4, [240892, 4143880]);
      const hitTest3 = hit;
      // eslint-disable-next-line max-len
      map.addPopup([popup, popup2, popup3], [[240892, 4143880], [240892, 4143880], [240892, 4143880]], false);
      const hitTest4 = hit;
      map.removePopup();
      return [hitTest1, hitTest2, hitTest3, hitTest4, hit];
    });
    expect(res[0], 'Funcionamiento estandard').toBe(1);
    expect(res[1], 'appPopup permite multiples popups').toBe(2);
    expect(res[2], 'appPopup elimina los popups anteriores').toBe(1);
    expect(res[3], 'appPopup añade multiples popups').toBe(4);
    expect(res[4], 'removePopups elimina todos los popups').toBe(0);
  });
});
