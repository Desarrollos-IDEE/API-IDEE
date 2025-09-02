import { test, expect } from '@playwright/test';

test.describe('IDEE.layer.Section', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/test/playwright/ol/basic-ol.html');
    await page.evaluate(() => {
      const map = IDEE.map({
        container: 'map',
        center: [-438581.6802781217, 4455610.713817699],
        zoom: 7,
      });
      window.map = map;
    });
  });

  test('Add section', async ({ page }) => {
    await page.evaluate(() => {
      const provincias = new IDEE.layer.GeoJSON({
        name: 'Provincias',
        url: 'https://hcsigc.juntadeandalucia.es/geoserver/wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=IECA:sigc_provincias_1724753768757&maxFeatures=50&outputFormat=application/json',
      });

      const campamentos = new IDEE.layer.GeoJSON({
        name: 'Campamentos',
        url: 'https://hcsigc.juntadeandalucia.es/geoserver/wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=IECA:sigc_campamentos_1724753464727&outputFormat=application/json',
      });

      const wms_001 = new IDEE.layer.WMS({
        url: 'https://www.ideandalucia.es/services/andalucia/wms?',
        name: '05_Red_Viaria',
        legend: 'Red Viaria',
        transparent: true,
        tiled: false,
      });

      const section_001 = new IDEE.layer.Section({
        idSection: 'id_section_1',
        title: 'Sección 1',
        zIndex: 1000,
        children: [provincias, campamentos, wms_001],
      });
      window.section_001 = section_001;
    });

    await page.evaluate(() => {
      return new Promise((resolve) => {
        window.section_001.on(IDEE.evt.ADDED_TO_MAP, () => {
          resolve();
        });
        window.map.addSections(window.section_001);
      });
    });
    await page.waitForTimeout(3000);
    const numLayers = await page.evaluate(() => { return window.map.getLayers().length; });
    await expect(numLayers).toEqual(5);
    await expect(page).toHaveScreenshot('snapshot.png', { maxDiffPixelRatio: 0.5 });
  });
});
