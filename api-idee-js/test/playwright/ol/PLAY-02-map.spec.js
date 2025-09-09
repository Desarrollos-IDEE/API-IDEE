import { test, expect } from '@playwright/test';

test.describe('IDEE.map', () => {
  test.describe('constructor', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/test/playwright/ol/basic-ol.html');
      await page.evaluate(() => {
        const map = IDEE.map({ container: 'map', bgColorContainer: 'red' });
        window.map = map;
      });
    });

    test('Creates a new map', async ({ page }) => {
      const isInstance = await page.evaluate(() => window.map instanceof IDEE.Map);
      expect(isInstance).toBe(true);
    });

    test('Destroys the map', async ({ page }) => {
      await page.evaluate(() => window.map.destroy());
      const mapImpl = await page.evaluate(() => window.map.getMapImpl());
      expect(mapImpl).toBeNull();
    });

    test.describe('Param bgColorContainer', () => {
      test('Map background color', async ({ page }) => {
        const changeColor = await page.evaluate(() => window.map.getContainer().closest('.m-api-idee-container').style.backgroundColor === 'red');
        expect(changeColor).toBe(true);
      });
    });

    test.describe('Param center', () => {
      test('Center array type', async ({ page }) => {
        await page.evaluate(() => {
          window.map = IDEE.map({ container: 'map', center: [0, 0] });
        });
        const center = await page.evaluate(() => window.map.getCenter());
        expect(center).toEqual({ x: 0, y: 0 });
      });

      test('Center string type', async ({ page }) => {
        await page.evaluate(() => {
          window.map = IDEE.map({ container: 'map', center: '0,0' });
        });
        const center = await page.evaluate(() => window.map.getCenter());
        expect(center).toEqual({ x: 0, y: 0 });
      });

      test('Center object type', async ({ page }) => {
        await page.evaluate(() => {
          window.map = IDEE.map({ container: 'map', center: { x: 0, y: 0 } });
        });
        const center = await page.evaluate(() => window.map.getCenter());
        expect(center).toEqual({ x: 0, y: 0 });
      });

      test('Set center array type', async ({ page }) => {
        await page.evaluate(() => window.map.setCenter([0, 0]));
        const center = await page.evaluate(() => window.map.getCenter());
        expect(center).toEqual({ x: 0, y: 0 });
      });

      test('Set center string type', async ({ page }) => {
        await page.evaluate(() => window.map.setCenter('0,0'));
        const center = await page.evaluate(() => window.map.getCenter());
        expect(center).toEqual({ x: 0, y: 0 });
      });

      test('Set center object type', async ({ page }) => {
        await page.evaluate(() => window.map.setCenter({ x: 0, y: 0 }));
        const center = await page.evaluate(() => window.map.getCenter());
        expect(center).toEqual({ x: 0, y: 0 });
      });
    });
  });

  test.describe('configuration', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/test/playwright/ol/basic-ol.html');

      // MAX Y MIN ZOOM
      await page.evaluate(() => IDEE.config.MAX_ZOOM = 19);
      await page.evaluate(() => IDEE.config.MIN_ZOOM = 10);

      await page.evaluate(() => {
        window.map = IDEE.map({ container: 'map' });
      });
    });

    test('MAX y MIN Zoom', async ({ page }) => {
      // Por defecto, tiene valor
      const maxZoom = await page.evaluate(() => IDEE.config.MAX_ZOOM);
      const minZoom = await page.evaluate(() => IDEE.config.MIN_ZOOM);
      expect(true).toBe(minZoom <= maxZoom);
      expect(true).toBe(maxZoom <= 28);
      expect(true).toBe(minZoom >= 0);

      // Se comprueba que se aplica al mapa
      const maxZoomMap = await page.evaluate(() => window.map.getMaxZoom());
      const minZoomMap = await page.evaluate(() => window.map.getMinZoom());

      expect(maxZoom).toBe(maxZoomMap);
      expect(minZoom).toBe(minZoomMap);

      // Modificación del zoom
      await page.evaluate(() => window.map.setZoom(4));
      const currentZoom = await page.evaluate(() => window.map.getZoom());
      expect(currentZoom).toBe(minZoom);
    });
  });
});
