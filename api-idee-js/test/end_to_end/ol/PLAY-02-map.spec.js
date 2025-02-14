import { test, expect } from '@playwright/test';

test.describe('IDEE.map', () => {
  test.describe('constructor', () => {
    let map;
    test.beforeEach(async ({ page }) => {
      await page.goto('/test/end_to_end/ol/basic-ol.html');
      await page.evaluate(() => {
        map = IDEE.map({ container: 'map' });
      });
    });

    test('Creates a new map', async ({ page }) => {
      const isInstance = await page.evaluate(() => map instanceof IDEE.Map);
      expect(isInstance).toBe(true);
    });

    test('Destroys the map', async ({ page }) => {
      await page.evaluate(() => map.destroy());
      const mapImpl = await page.evaluate(() => map.getMapImpl());
      expect(mapImpl).toBeNull();
    });

    test.describe('Param center', () => {
      test('Center array type', async ({ page }) => {
        await page.evaluate(() => {
          map = IDEE.map({ container: 'map', center: [0, 0] });
        });
        const center = await page.evaluate(() => map.getCenter());
        expect(center).toEqual({ x: 0, y: 0 });
      });

      test('Center string type', async ({ page }) => {
        await page.evaluate(() => {
          map = IDEE.map({ container: 'map', center: '0,0' });
        });
        const center = await page.evaluate(() => map.getCenter());
        expect(center).toEqual({ x: 0, y: 0 });
      });

      test('Center object type', async ({ page }) => {
        await page.evaluate(() => {
          map = IDEE.map({ container: 'map', center: { x: 0, y: 0 } });
        });
        const center = await page.evaluate(() => map.getCenter());
        expect(center).toEqual({ x: 0, y: 0 });
      });

      test('Set center array type', async ({ page }) => {
        await page.evaluate(() => map.setCenter([0, 0]));
        const center = await page.evaluate(() => map.getCenter());
        expect(center).toEqual({ x: 0, y: 0 });
      });

      test('Set center string type', async ({ page }) => {
        await page.evaluate(() => map.setCenter('0,0'));
        const center = await page.evaluate(() => map.getCenter());
        expect(center).toEqual({ x: 0, y: 0 });
      });

      test('Set center object type', async ({ page }) => {
        await page.evaluate(() => map.setCenter({ x: 0, y: 0 }));
        const center = await page.evaluate(() => map.getCenter());
        expect(center).toEqual({ x: 0, y: 0 });
      });
    });
  });
});
