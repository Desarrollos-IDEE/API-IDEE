import { test, expect } from '@playwright/test';

test.describe('IDEE.impl.ol.js.projections', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/test/playwright/ol/basic-ol.html');

    await page.evaluate(() => {
      const map = IDEE.map({
        container: 'map',
        center: [-438581.6802781217, 4455610.713817699],
        projection: 'EPSG:3857',
      });

      window.map = map;
    });
  });

  test('Verificar cambio de proyección', async ({ page }) => {
    const initialProjection = await page.evaluate(() => {
      return window.map.getMapImpl().getView().getProjection().getCode();
    });
    await expect(initialProjection).toBe('EPSG:3857');

    await page.evaluate(() => {
      const newProjection = 'EPSG:4326';
      const center = ol.proj.transform(window.map.getMapImpl().getView().getCenter(), 'EPSG:3857', newProjection);

      window.map.setProjection(newProjection);
      window.map.setCenter(center);
    });

    await page.waitForTimeout(1000);

    const newProjection = await page.evaluate(() => {
      return window.map.getMapImpl().getView().getProjection().getCode();
    });
    await expect(newProjection).toBe('EPSG:4326');
  });
});
