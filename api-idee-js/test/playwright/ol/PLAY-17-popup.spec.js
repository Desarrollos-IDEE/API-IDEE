import { test, expect } from '@playwright/test';

test.describe('Popup', () => {
  let map;
  let hit = 0;
  test('Triggers de los eventos popup', async ({ page }) => {
    await page.goto('/test/playwright/ol/basic-ol.html');
    const res = await page.evaluate(async (hit) => {
      map = IDEE.map({ container: 'map' });
      window.map = map;
      map.on(IDEE.evt.POPUP_ADDED, () => {
        hit +=1;
      });
      map.on(IDEE.evt.POPUP_REMOVED, () => {
        hit +=1;
      });
      const popup = new IDEE.Popup();
      const featureTabOpts = {
        'icon': 'g-cartografia-pin',
        'title': 'popup',
        'content': 'Ventana de popup de prueba'
      };
      popup.on(IDEE.evt.POPUP_ADDED, () => {
        hit +=1;
      });
      popup.on(IDEE.evt.POPUP_REMOVED, () => {
        hit +=1;
      });
      popup.on(IDEE.evt.POPUP_ADDED_TAB, () => {
        hit +=1;
      });
      popup.on(IDEE.evt.POPUP_REMOVED_TAB, () => {
        hit +=1;
      });
      popup.addTab(featureTabOpts);
      map.addPopup(popup, [240829,4143088]);
      popup.removeTab(featureTabOpts);
      map.removePopup(popup);
      return hit;
    }, hit);
    hit = res;
    expect(hit).toBe(6);
  });
});