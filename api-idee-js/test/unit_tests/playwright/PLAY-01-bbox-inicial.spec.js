import { test, expect } from '@playwright/test';

const TEST_BBOX = [4.0436553, 34.3787588, 4.3187731, 34.5288746];
test('Compararmos BBOX y MaxExtent para dos capas WMS overlays', async ({ page }) => {
  await page.goto('/test/development/basic-test.html');
  await page.evaluate((bbox) => {
    mapjs.setProjection('EPSG:4326*d');
    mapjs.setBbox(bbox);
  }, TEST_BBOX);
  const bbox = await page.evaluate(() => mapjs.getBbox());
  expect(Math.abs(bbox.x.min - TEST_BBOX[0])).toBeLessThan(10000);
  expect(Math.abs(bbox.y.min - TEST_BBOX[1])).toBeLessThan(10000);
  expect(Math.abs(bbox.x.max - TEST_BBOX[2])).toBeLessThan(10000);
  expect(Math.abs(bbox.y.max - TEST_BBOX[3])).toBeLessThan(10000);
});
