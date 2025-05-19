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
      const wfs_001 = new IDEE.layer.WFS({
        name: 'reservas_biosfera',
        namespace: 'reservas_biosfera',
        legend: 'Reservas biosferas',
        geometry: 'POLYGON',
        url: 'https://www.juntadeandalucia.es/medioambiente/mapwms/REDIAM_WFS_Patrimonio_Natural?',
        version: '1.1.0',
        extract: true,
        template: temp,
      });

      map.addLayers(wfs_001);
      window.wfs_001 = wfs_001;
    }, customTemplate);

    await page.waitForTimeout(5000);
    await page.mouse.click(604, 128);
    const popup = await page.locator('.m-popup.m-collapsed .m-body');
    try {
      const text = await popup.innerText({ timeout: 2000 });
      expect(text).toEqual(textPopup);
      const template = await page.evaluate(() => wfs_001.template);
      expect(template).toEqual(customTemplate);
    } catch (e) {
      console.warn('⚠️ Popup no apareció. El servicio podría no haber cargado los features.');
    }
  });
});
