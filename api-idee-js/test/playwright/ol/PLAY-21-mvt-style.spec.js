import { test, expect } from '@playwright/test';

test.describe('IDEE.layer.MVT', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/test/playwright/ol/basic-ol.html');
    await page.evaluate(() => {
      const map = IDEE.map({
        container: 'map',
        center: [-516514.279416561, 4874194.031273619],
        zoom: 5,
      });
      window.map = map;
    });
  });

  test('Parameter style with mode: feature', async ({ page }) => {
    await page.evaluate(() => {
      const line = new IDEE.style.Line({
        fill: {
          color: 'red',
          opacity: 0.7,
        },
        stroke: {
          color: '#000',
          width: 0.5,
        },
      });
      window.line = line;

      const mvt = new IDEE.layer.MVT({
        url: 'https://vt-fedme.idee.es/vt.senderogr/{z}/{x}/{y}.pbf',
        name: 'sendero_gr',
        mode: 'feature',
      }, {
        style: line,
      });
      window.map.addLayers(mvt);
    });
    await page.waitForTimeout(5000);
    await expect(page).toHaveScreenshot('snapshot-feature.png', {maxDiffPixelRatio: 0.5});
  });

  test('Parameter style with mode: render', async ({ page }) => {
    await page.evaluate(() => {
      const line = new IDEE.style.Line({
        fill: {
          color: 'blue',
          opacity: 0.7,
        },
        stroke: {
          color: '#000',
          width: 0.5,
        },
      });
      window.line = line;

      const mvt = new IDEE.layer.MVT({
        url: 'https://vt-fedme.idee.es/vt.senderogr/{z}/{x}/{y}.pbf',
        name: 'sendero_gr',
        mode: 'render',
      }, {
        style: line,
      });
      window.map.addLayers(mvt);
    });
    await page.waitForTimeout(5000);
    await expect(page).toHaveScreenshot('snapshot-render.png', {maxDiffPixelRatio: 0.5});
  });
});
