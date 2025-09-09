import { test, expect } from '@playwright/test';

test('Click attributions', async ({ page }) => {
  await page.goto('/test/playwright/ol/basic-ol.html');
  await page.evaluate(() => {
    const mapjs = IDEE.map({
      container: 'map',
      controls: ['attributions'],
    });
    window.mapjs = mapjs;
  });
  await page.waitForFunction(() => window.mapjs.isFinished());
  const attributions = await page.locator('.m-attributions').first();
  await expect(attributions).toHaveClass(/collapsed/);
  await attributions.getByRole('button', { name: 'Plugin attributions' }).click();
  await page.waitForTimeout(1000);
  await expect(attributions).toHaveClass(/opened/);
  await attributions.getByRole('button', { name: 'Plugin attributions' }).click();
  await page.waitForTimeout(1000);
  await expect(attributions).toHaveClass(/collapsed/);
});
