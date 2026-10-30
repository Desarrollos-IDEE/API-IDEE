import { test, expect } from '@playwright/test';
import { mockProxy } from '../common/proxy';

test.describe('IDEE.layer.WMC', () => {
  let proxied;

  test.beforeEach(async ({ page }) => {
    // Los contextos se piden por el proxy de la API REST (no existe en el servidor de pruebas):
    // el proxy simulado descarga el WMC real
    proxied = await mockProxy(page);
    await page.goto('/test/playwright/ol/basic-ol.html');
    await page.evaluate(() => {
      IDEE.proxy(true);
      const map = IDEE.map({
        container: 'map',
        projection: 'EPSG:3857*m',
        center: [-527439.7561017586, 4554984.900936406],
        zoom: 8,
      });
      window.map = map;
    });
  });

  test('Add layer', async ({ page }) => {
    await page.evaluate(() => {
      const wmc001 = new IDEE.layer.WMC({
        url: `${IDEE.config.STATIC_RESOURCES_URL}/Datos/WMC/wmc_grupos.xml`,
        name: 'Secciones',
      });
      window.wmc001 = wmc001;

      window.map.addWMC(wmc001);
    });

    await expect.poll(() => proxied[0], { timeout: 45000 }).toMatchObject({ valid: true });
    await expect.poll(() => page.evaluate(() => window.map.getLayers().length), {
      timeout: 15000,
    }).toEqual(6);
  });

  test('Add two WMC', async ({ page }) => {
    await page.evaluate(() => {
      const wmc001 = new IDEE.layer.WMC({
        url: `${IDEE.config.STATIC_RESOURCES_URL}/Datos/WMC/satelite.xml`,
        name: 'Satelite',
      });
      window.wmc001 = wmc001;

      window.map.addWMC(wmc001);

      const wmc002 = new IDEE.layer.WMC({
        url: `${IDEE.config.STATIC_RESOURCES_URL}/Datos/WMC/context_cdau_hibrido_25830_no_cache.xml`,
        name: 'Híbrido',
      });
      window.wmc002 = wmc002;

      window.map.addWMC(wmc002);
    });

    const selector = page.locator('select.m-wmcselector-select');
    await expect(selector).toBeVisible();
    const opciones = selector.locator('option');
    await expect(opciones).toHaveCount(2);
  });
});
