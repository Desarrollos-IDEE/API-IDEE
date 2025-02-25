import { test, expect } from '@playwright/test';

const TEST_BBOX = [450137.6602065728, 4079774.2048711563, 480763.617682564, 4100039.975169722];

test('Comprobamos que el bbox inicial es el especificado', async ({ page }) => {
  await page.goto('/test/playwright/ol/basic-ol.html');
  let mapjs;
  await page.evaluate((bbox) => {
    mapjs = IDEE.map({
      container: 'map',
      bbox,
    });
  }, TEST_BBOX);
  await page.waitForFunction(() => mapjs.isFinished());
  const bbox = await page.evaluate(() => mapjs.getBbox());
  expect(Math.abs(bbox.x.min - TEST_BBOX[0])).toBeLessThan(10000);
  expect(Math.abs(bbox.y.min - TEST_BBOX[1])).toBeLessThan(10000);
  expect(Math.abs(bbox.x.max - TEST_BBOX[2])).toBeLessThan(10000);
  expect(Math.abs(bbox.y.max - TEST_BBOX[3])).toBeLessThan(10000);
});
