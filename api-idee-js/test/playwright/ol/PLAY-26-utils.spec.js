import { test, expect } from '@playwright/test';

test.describe('IDEE.Utils', () => {
  let map;
  test('Las utilidades funcionan correctamente', async ({ page }) => {
    await page.goto('/test/playwright/ol/basic-ol.html');
    const res = await page.evaluate(async () => {
      map = IDEE.map({ container: 'map' });
      window.map = map;
      return IDEE.utils.isNullOrEmpty({});
    });
    expect(res).toBe(true);
  });
});
