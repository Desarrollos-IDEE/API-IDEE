import { test, expect } from '@playwright/test';

test('Comprobamos que el bbox inicial es el especificado', async ({ page }) => {
  await page.goto('http://localhost:8081/test/development/basic.html');
  const zoomInButton = page.locator('#map div.ol-overlaycontainer-stopevent button.ol-zoom-in');
  for (let i = 0; i < 3; i += 1) {
    await zoomInButton.click();
    await page.waitForTimeout(750);
  }
  const prevBbox = await page.evaluate(() => map.getBbox());

  // Abrir el selector de capas y cambiar la capa base
  await page.locator('.m-panel.m-layerswitcher.collapsed').click();
  await page.waitForTimeout(750);

  const baseLayerToggle = page.locator('div#m-layerswitcher-panel li.group div.layer-base span.m-check.g-cartografia-check4');
  await baseLayerToggle.click();
  await page.waitForTimeout(750);

  // Obtener bbox después de cambiar la capa base
  const newBbox = await page.evaluate(() => map.getBbox());
  expect(newBbox).toEqual(prevBbox);

  // Cambiar la capa base otra vez
  await baseLayerToggle.click();
  await page.waitForTimeout(750);

  // Obtener bbox después del segundo cambio de capa base
  const finalBbox = await page.evaluate(() => map.getBbox());
  expect(finalBbox).toEqual(prevBbox);
});
