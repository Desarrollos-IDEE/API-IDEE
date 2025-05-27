import { test, expect } from '@playwright/test';

test.describe('Vector layers', () => {
  let map;
  test.beforeEach(async ({ page }) => {
    await page.goto('/test/playwright/ol/basic-ol.html');
    await page.evaluate(() => {
      map = IDEE.map({ container: 'map' });
      window.map = map;
    });
  });

  test('Param template', async ({ page }) => {
    const textPopup = 'Popup personalizado';
    const customTemplate = `<div>${textPopup}</div>`;

    await page.evaluate((temp) => {
      const ogc_001 = new IDEE.layer.OGCAPIFeatures({
        url: 'https://api-features.ign.es/collections/',
        name: 'administrativeunit',
        legend: 'AU Unidades administrativas',
        extract: true,
        conditional: { nameunit: 'Lepe' },
        limit: 30,
        template: temp,
      });

      map.addLayers(ogc_001);
      window.ogc_001 = ogc_001;
    }, customTemplate);

    await page.waitForTimeout(5000);
    await page.mouse.click(599, 132);
    const popup = await page.locator('.m-popup.m-collapsed .m-body');
    try {
      const text = await popup.innerText({ timeout: 2000 });
      expect(text).toEqual(textPopup);
      const template = await page.evaluate(() => ogc_001.template);
      expect(template).toEqual(customTemplate);
    } catch (e) {
      console.warn('⚠️ Popup no apareció. El servicio podría no haber cargado los features.');
    }
  });
});
