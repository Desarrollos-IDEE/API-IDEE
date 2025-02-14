import { test, expect } from '@playwright/test';

test('Click attributions', async ({ page }) => {
  await page.goto('/test/end_to_end/ol/basic-ol.html');
  let mapjs;
  await page.evaluate(() => {
    mapjs = IDEE.map({
      container: 'map',
      controls: ['attributions'],
    });
  });
  await page.waitForFunction(() => mapjs.isFinished());
  const attributions = await page.locator('.m-attributions').first();
  await expect(attributions).toHaveClass(/collapsed/);
  await attributions.getByRole('button', { name: 'Plugin attributions' }).click();
  await page.waitForTimeout(1000);
  await expect(attributions).toHaveClass(/opened/);
  await attributions.getByRole('button', { name: 'Plugin attributions' }).click();
  await page.waitForTimeout(1000);
  await expect(attributions).toHaveClass(/collapsed/);
});
