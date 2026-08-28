import { test, expect } from '@playwright/test';

test('Comprobamos que el rotation inicial es el especificado', async ({ page }) => {
  await page.goto('/test/playwright/ol/basic-ol.html');
  await page.evaluate(() => {
    const mapjs = IDEE.map({
      container: 'map',
      projection: 'EPSG:3857*m',
      zoom: 5,
      center: [-413228.4623444635, 4919525.828830231],
      rotation: 10,
    });
    window.mapjs = mapjs;
  });
  await page.waitForFunction(() => window.mapjs.isFinished());
  const rotation = await page.evaluate(() => window.mapjs.getRotation());
  expect(rotation).toBe(10);
});
