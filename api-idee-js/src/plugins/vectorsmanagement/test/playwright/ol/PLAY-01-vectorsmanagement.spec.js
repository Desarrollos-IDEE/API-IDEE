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

test('Iconos compartidos del núcleo (perfil y selección) con el estilo del plugin y perfil con los textos comunes', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error));
  await page.goto('/src/plugins/vectorsmanagement/test/playwright/ol/vectorsmanagement-ol.html', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    window.mapjs = IDEE.map({ container: 'mapjs' });
    const layer = new IDEE.layer.Vector({ name: 'lineas' });
    window.mapjs.addLayers(layer);
    layer.addFeatures([new IDEE.Feature('l', {
      type: 'Feature',
      geometry: { type: 'LineString', coordinates: [[-400000, 4900000], [-390000, 4910000]] },
      properties: {},
    })]);
    window.mp = new IDEE.plugin.VectorsManagement({ collapsed: false });
    window.mapjs.addPlugin(window.mp);
  });
  await page.locator('#m-vectorsmanagement-layer-selector').click();
  await page.locator('#m-vectorsmanagement-layer-selector-options span').first().click();
  await page.locator('#m-vectorsmanagement-analysis').click();
  const look = (selector) => page.evaluate((css) => {
    const element = document.querySelector(css);
    const before = window.getComputedStyle(element, '::before');
    return {
      className: element.className,
      mask: before.maskImage || before.webkitMaskImage,
      width: before.width,
      color: before.color,
      display: before.display,
    };
  }, selector);
  const profile = await look('#topographic-profile-btn');
  const buffer = await look('#buffer-btn');
  const selection = await look('#m-vectorsmanagement-selection');
  expect(profile.className).toBe('vectorsmanagement-icon-profile g-cartografia-perfil');
  expect(profile.mask).toContain('icons_cota/icn_perfil.svg');
  expect(selection.className).toBe('vectorsmanagement-icon-seleccionar g-cartografia-seleccionar');
  expect(selection.mask).toContain('icons_cota/icn_seleccion.svg');
  expect({ width: profile.width, color: profile.color, display: profile.display })
    .toEqual({ width: buffer.width, color: buffer.color, display: buffer.display });
  await page.locator('#buffer-btn').click();
  const bufferActive = await look('#buffer-btn');
  await page.locator('#topographic-profile-btn').click();
  const profileActive = await look('#topographic-profile-btn');
  expect(profileActive.className).toContain('activated');
  expect(profileActive.color).toBe(bufferActive.color);
  expect(profileActive.color).not.toBe(profile.color);

  const texts = await page.evaluate(() => ['es', 'en', 'ca'].map((lang) => {
    IDEE.language.setLang(lang);
    const common = IDEE.language.getValue('profile');
    const profil = new IDEE.impl.ol.js.ext.Profil({ draggable: true });
    const { element } = profil;
    const result = {
      lang,
      close: element.querySelector('.profile-close-button').title === common.close,
      download: element.querySelector('.profile-download-button').title === common.download,
      move: element.querySelector('.profile-move-button').title === common.move,
      zmin: element.querySelector('.track-info td').textContent.startsWith(common.info.zmin),
      partial: element.querySelector('.point-info td:nth-child(2)').textContent.startsWith(common.info.distanceP),
      pluginKeys: ['zmin', 'zmax', 'distanceT', 'distanceP', 'elevationGain', 'ytitle', 'xtitle']
        .filter((key) => IDEE.language.getTranslation(lang).vectorsmanagement[key] !== undefined),
    };
    return result;
  }));
  await page.evaluate(() => IDEE.language.setLang('es'));
  expect(texts).toEqual(['es', 'en', 'ca'].map((lang) => ({
    lang, close: true, download: true, move: true, zmin: true, partial: true, pluginKeys: [],
  })));
  expect(errors).toEqual([]);
});
