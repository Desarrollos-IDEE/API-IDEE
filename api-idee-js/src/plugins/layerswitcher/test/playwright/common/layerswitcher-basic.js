import { test, expect } from '@playwright/test';
import {
  TIMEOUT,
  configureEngine,
  mockTiles, openMap, addSampleLayers, layerRow, setOpacitySlider, getBbox,
} from './helpers';

/**
 * Funcionalidad básica del panel sobre las capas del mapa, común a 2D y 3D.
 *
 * @param {String} impl 'ol' o 'cesium'.
 */
// eslint-disable-next-line import/prefer-default-export
export const registerBasicTests = (impl) => {
  test.describe(`Layerswitcher: panel de capas (${impl})`, () => {
    configureEngine(impl);
    const timeout = TIMEOUT[impl];

    test.beforeEach(async ({ page }) => {
      await mockTiles(page);
      await openMap(page, impl);
      await addSampleLayers(page);
    });

    test('pinta las capas del mapa', async ({ page }) => {
      await expect(layerRow(page, 'puntos')).toHaveCount(1, { timeout });
      await expect(layerRow(page, 'teselas')).toHaveCount(1, { timeout });
      await expect(layerRow(page, 'puntos').locator('.m-layerswitcher-title-box')).toHaveText('Puntos');
    });

    test('el ojo oculta y muestra la capa', async ({ page }) => {
      const eye = layerRow(page, 'puntos').locator('[data-select-type="eye"]');
      await eye.click();
      await expect.poll(() => page
        .evaluate(() => window.puntos.isVisible()), { timeout }).toBe(false);
      await expect(layerRow(page, 'puntos').locator('[data-select-type="eye"]'))
        .toHaveClass(/g-cartografia-btn-layerswitcher-ocultar/, { timeout });
      await layerRow(page, 'puntos').locator('[data-select-type="eye"]').click();
      await expect.poll(() => page
        .evaluate(() => window.puntos.isVisible()), { timeout }).toBe(true);
    });

    test('la opacidad se aplica a la capa', async ({ page }) => {
      await expect(layerRow(page, 'teselas')).toHaveCount(1, { timeout });
      await setOpacitySlider(page, 'teselas', 0.3);
      await expect.poll(() => page.evaluate(() => window.teselas.getOpacity()), { timeout })
        .toBeCloseTo(0.3, 5);
    });

    test('renombra la capa', async ({ page }) => {
      await layerRow(page, 'puntos').locator('.m-layerswitcher-title-box').click();
      const input = page.locator('#layer-change-name input');
      await input.fill('Puntos renombrados');
      await page.locator('#layer-change-name button').click();
      await expect.poll(() => page.evaluate(() => window.puntos.legend), { timeout })
        .toBe('Puntos renombrados');
      await expect(layerRow(page, 'puntos').locator('.m-layerswitcher-title-box'))
        .toHaveText('Puntos renombrados', { timeout });
    });

    test('borra la capa del mapa', async ({ page }) => {
      await layerRow(page, 'puntos').locator('.g-cartografia-btn-layerswitcher-delete').click();
      await expect.poll(() => page.evaluate(() => window.mapjs.getLayers()
        .some((layer) => layer.name === 'puntos')), { timeout }).toBe(false);
      await expect(layerRow(page, 'puntos')).toHaveCount(0, { timeout });
      await expect(layerRow(page, 'teselas')).toHaveCount(1);
    });

    test('el zoom a la capa encuadra sus datos', async ({ page }) => {
      // Esperar a que la capa vectorial tenga sus objetos (Cesium tarda varios segundos)
      await expect.poll(() => page.evaluate(() => window.puntos.getFeatures().length), { timeout })
        .toBe(2);
      await layerRow(page, 'puntos').locator('.g-cartografia-btn-layerswitcher-target').click();
      // Los puntos están en torno a (2.15, 41.45): el centro de la vista debe acercarse a ellos
      await expect.poll(async () => {
        const [minx, miny, maxx, maxy] = await getBbox(page);
        return page.evaluate(({ cx, cy }) => {
          const projection = window.mapjs.getProjection().code;
          const [lon, lat] = projection === 'EPSG:3857'
            ? [cx / 111319.49079327357, (Math.atan(Math.exp(cy / 6378137)) * 360) / Math.PI - 90]
            : [cx, cy];
          return Math.abs(lon - 2.15) < 0.5 && Math.abs(lat - 41.45) < 0.5;
        }, { cx: (minx + maxx) / 2, cy: (miny + maxy) / 2 });
      }, { timeout }).toBe(true);
    });

    test('muestra y oculta todas las capas', async ({ page }) => {
      await expect(layerRow(page, 'puntos')).toHaveCount(1, { timeout });
      const toggleAll = page.locator('#layerswitcher-hide-show-all-layers');
      await toggleAll.click();
      await expect.poll(() => page
        .evaluate(() => [window.puntos.isVisible(), window.teselas.isVisible()]), { timeout })
        .toEqual([false, false]);
      await page.locator('#layerswitcher-hide-show-all-layers').click();
      await expect.poll(() => page
        .evaluate(() => [window.puntos.isVisible(), window.teselas.isVisible()]), { timeout })
        .toEqual([true, true]);
    });
  });

  test.describe(`Layerswitcher: modo radio (${impl})`, () => {
    configureEngine(impl);
    const timeout = TIMEOUT[impl];

    test('solo deja visible la capa seleccionada', async ({ page }) => {
      await mockTiles(page);
      await openMap(page, impl, { modeSelectLayers: 'radio' });
      await addSampleLayers(page);
      await layerRow(page, 'teselas').locator('input[data-select-type="radio"]').check();
      await expect.poll(() => page
        .evaluate(() => [window.puntos.isVisible(), window.teselas.isVisible()]), { timeout })
        .toEqual([false, true]);
      await layerRow(page, 'puntos').locator('input[data-select-type="radio"]').check();
      await expect.poll(() => page
        .evaluate(() => [window.puntos.isVisible(), window.teselas.isVisible()]), { timeout })
        .toEqual([true, false]);
    });
  });
};
