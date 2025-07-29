import { test, expect } from '@playwright/test';

test.describe('IDEE.control.Scale', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/test/playwright/ol/basic-ol.html');
    
    await page.evaluate(() => {
      const map = IDEE.map({
        container: 'map',
        center: [-438581.6802781217, 4455610.713817699],
        controls: ['scale'],
      });

      window.map = map;
    });
  });
  
  test('Verificar escala al cambiar el nivel de zoom', async ({ page }) => {
    const zoomLevel = 7;
    const expectedScale = 2761266;

    await page.evaluate(async (zoom) => {
      const zoomElement = document.querySelector('#m-level-number');
      zoomElement.textContent = zoom.toString();

      const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
      zoomElement.dispatchEvent(event);

      return new Promise((resolve) => {
        window.map.getMapImpl().getView().once('change:resolution', () => {
          resolve();
        });
      });
    }, zoomLevel);
    
    await page.waitForTimeout(2000);
    const finalScale = await page.evaluate(() => {
      const scaleText = document.querySelector('#m-scale-span').textContent;
      return parseInt(scaleText.replace(/\./g, ''));
    });
    await expect(finalScale).toBe(expectedScale);
  });
});