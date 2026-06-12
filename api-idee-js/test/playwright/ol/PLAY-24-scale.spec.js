import { test, expect } from '@playwright/test';

test.describe('IDEE.control.Scale', () => {
  const zooms = [4, 5, 6, 7];
  const ogcScales = [34942642, 17471321, 8735660, 4367830];
  const approxScales = [35000000, 17000000, 9000000, 4000000];

  const setZoomAndGetScale = async (page, zoomLevel) => {
    await page.evaluate(async (zoom) => {
      const zoomElement = document.querySelector('#m-level-number');
      zoomElement.textContent = zoom.toString();

      const event = new window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
      zoomElement.dispatchEvent(event);

      return new Promise((resolve) => {
        window.map.getMapImpl().getView().once('change:resolution', () => {
          resolve();
        });
      });
    }, zoomLevel);

    await page.waitForTimeout(5000);

    return page.evaluate(() => {
      const scaleText = document.querySelector('#m-scale-span').textContent;
      return parseInt(scaleText.replace(/\./g, ''), 10);
    });
  };

  test.describe('scale*true - escalas OGC exactas', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/test/playwright/ol/basic-ol.html');

      await page.evaluate(() => {
        const map = IDEE.map({
          container: 'map',
          center: [0, 0],
          controls: ['scale*true'],
        });
        window.map = map;
      });
    });

    for (let i = 0; i < zooms.length; i++) {
      const zoom = zooms[i];
      const expectedScale = ogcScales[i];

      test(`Zoom ${zoom} → escala esperada 1:${expectedScale.toLocaleString('es-ES')}`, async ({ page }) => {
        const finalScale = await setZoomAndGetScale(page, zoom);
        expect(finalScale).toBe(expectedScale);
      });
    }
  });

  test.describe('scale*false - escalas aproximadas', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/test/playwright/ol/basic-ol.html');

      await page.evaluate(() => {
        const map = IDEE.map({
          container: 'map',
          center: [0, 0],
          controls: ['scale*false'],
        });
        window.map = map;
      });
    });

    for (let i = 0; i < zooms.length; i++) {
      const zoom = zooms[i];
      const expectedScale = approxScales[i];

      test(`Zoom ${zoom} → escala esperada 1:${expectedScale.toLocaleString('es-ES')}`, async ({ page }) => {
        const finalScale = await setZoomAndGetScale(page, zoom);
        expect(finalScale).toBe(expectedScale);
      });
    }
  });
});
