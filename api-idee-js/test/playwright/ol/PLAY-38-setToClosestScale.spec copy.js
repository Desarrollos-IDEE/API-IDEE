import { test, expect } from '@playwright/test';

test('Probamos setToClosestScale', async ({ page }) => {
  await page.goto('/test/playwright/ol/basic-ol.html');

  await page.evaluate(() => {
    const mapjs = IDEE.map({
      container: 'map',
    });
    window.mapjs = mapjs;
  });

  const scale = 32465992.016955;
  await page.evaluate(() => { window.mapjs.setToClosestScale(32465992.016955); });
  const exactScale = await page.evaluate(() => window.mapjs.getExactScale());
  expect(exactScale === Math.trunc(scale)).toBe(true);
});
