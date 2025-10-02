import { test, expect } from '@playwright/test';

test('Click help', async ({ page }) => {
  await page.goto('/src/plugins/help/test/playwright/ol/help-ol.html');
  let mp;
  await page.evaluate(() => {
    window.mapjs = IDEE.map({
      container: 'mapjs',
    });
    mp = new IDEE.plugin.Help({
      position: 'BL',
      tooltip: 'Obtener ayuda',
      images: [
        'https://www.ign.es/iberpix/static/media/logo.72e2e78b.png',
      ],
      title: 'Título definido por el usuario',
      extendInitialExtraContents: true,
      initialExtraContents: [
        { title: 'Apartado 1', content: '<div><h2 style="text-align: center; color: #fff; background-color: #364b5f; padding: 8px 10px;">Mi primer apartado</h2><div><p>Contenido extra definido por el usuario</p></div></div>' },
      ],
      finalExtraContents: [
        { title: 'Apartado final', content: '<div><h2 style="text-align: center; color: #fff; background-color: #364b5f; padding: 8px 10px;">Apartado final</h2><div><p>Contenido extra definido por el usuario</p></div></div>' },
      ],
    });
  });
  await page.waitForFunction(() => window.mapjs.isFinished());

  await page.evaluate(() => {
    window.mapjs.addPlugin(mp);
  });

  await page.waitForSelector('.m-plugin-help');
  const help = await page.locator('.m-plugin-help').first();
  await expect(help).toBeDefined();
  await expect(help).toHaveClass(/no-collapsible/);
  await page.waitForTimeout(1000);
});
