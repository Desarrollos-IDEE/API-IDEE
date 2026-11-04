// eslint-disable-next-line import/no-extraneous-dependencies
import { test, expect } from '@playwright/test';

test('Test Plugin VectorsManagement', async ({ page }) => {
  await page.goto('/src/plugins/vectorsmanagement/test/playwright/ol/vectorsmanagement-ol.html', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    window.mapjs = IDEE.map({
      container: 'mapjs',
    });
    window.mp = new IDEE.plugin.VectorsManagement();
    window.mapjs.addPlugin(window.mp);
  });

  const nPlugins = await page.evaluate(() => window.mapjs.getPlugins(window.mp.name).length);
  expect(nPlugins).toBe(1);
});

test('El perfil de punto, montado en document.body, usa los tokens de diseño', async ({ page }) => {
  await page.goto('/src/plugins/vectorsmanagement/test/playwright/ol/vectorsmanagement-ol.html', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    IDEE.config.token.perfil = {
      typography: { fontFamily: '"Courier New", monospace', fontSize: { body_m: '20px' } },
      shape: { borderRadius: '8px' },
    };
    IDEE.config.activeTOKEN = 'perfil';
    window.mapjs = IDEE.map({ container: 'mapjs' });
    window.mp = new IDEE.plugin.VectorsManagement();
    window.mapjs.addPlugin(window.mp);
    // Estructura de templates/pointprofile.html, que analysiscontrol.js añade a document.body
    const profile = document.createElement('div');
    profile.id = 'vectorsmanagement-point-profile-container';
    profile.innerHTML = '<p class="popup-title">Perfil</p><div><p id="profile-text">Altitud</p></div>';
    document.body.appendChild(profile);
  });

  const styles = await page.evaluate(() => {
    const css = (selector) => window.getComputedStyle(document.querySelector(selector));
    return {
      outside: !document.querySelector('.m-api-idee-container #vectorsmanagement-point-profile-container'),
      family: css('#profile-text').fontFamily,
      size: css('#profile-text').fontSize,
      radius: css('#vectorsmanagement-point-profile-container .popup-title').borderTopLeftRadius,
    };
  });
  expect(styles.outside).toBe(true);
  expect(styles.family).toContain('Courier New');
  // body_s = body_m * 0.875
  expect(styles.size).toBe('17.5px');
  expect(styles.radius).toBe('8px');
});
