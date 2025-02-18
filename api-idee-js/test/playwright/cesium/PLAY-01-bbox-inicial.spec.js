import { test, expect } from '@playwright/test';

const TEST_BBOX = [4.0436553, 34.3787588, 4.3187731, 34.5288746];

test('Comprobamos que el bbox inicial es el especificado', async ({ page }) => {
  await page.goto('/test/playwright/cesium/basic-cesium.html');
  let mapjs;
  await page.evaluate((bbox) => {
    mapjs = IDEE.map({
      container: 'map',
      bbox,
    });
  }, TEST_BBOX);
  const bbox = await page.evaluate(() => mapjs.getBbox());
  expect(Math.abs(bbox.x.min - TEST_BBOX[0])).toBeLessThan(1);
  expect(Math.abs(bbox.y.min - TEST_BBOX[1])).toBeLessThan(1);
  expect(Math.abs(bbox.x.max - TEST_BBOX[2])).toBeLessThan(1);
  expect(Math.abs(bbox.y.max - TEST_BBOX[3])).toBeLessThan(1);
});
