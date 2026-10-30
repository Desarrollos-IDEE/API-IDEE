import { test, expect } from '@playwright/test';

test('Test Help', async ({ page }) => {
  await page.goto('/src/plugins/help/test/playwright/ol/help-ol.html');

  await page.waitForFunction(() => typeof IDEE !== 'undefined' && IDEE.plugin && IDEE.plugin.Help);

  await page.evaluate(() => {
    window.mapjs = IDEE.map({
      container: 'mapjs',
    });
    window.mp = new IDEE.plugin.Help({
      position: 'right',
      order: 0,
      tooltip: 'Obtener ayuda',
      extendInitialExtraContents: true,
      header: {
        images: [
          'https://www.ign.es/iberpix/static/media/logo.72e2e78b.png',
        ],
        title: 'Título definido por el usuario',
      },
      initialExtraContents: [
        {
          title: 'Apartado 1',
          content: '<div><h2 style="text-align: center; color: #fff; background-color: #364b5f; padding: 8px 10px;">Mi primer apartado</h2><div><p>Contenido extra definido por el usuario</p></div></div>',
        },
      ],
      finalExtraContents: [
        {
          title: 'Apartado final',
          content: '<div><h2 style="text-align: center; color: #fff; background-color: #364b5f; padding: 8px 10px;">Apartado final</h2><div><p>Contenido extra definido por el usuario</p></div></div>',
        },
      ],
    });
    window.mapjs.addPlugin(window.mp);
  });

  // Help crea el botón tras la petición async de controles
  await page.waitForFunction(() => window.mp && window.mp.button, null, { timeout: 15000 });

  const nPlugins = await page.evaluate(() => window.mapjs.getPlugins().length);
  expect(nPlugins).toBe(1);

  const hasButton = await page.evaluate(() => Boolean(window.mp.button));
  expect(hasButton).toBeTruthy();

  const headerTitle = await page.evaluate(() => window.mp.headerTitle);
  expect(headerTitle).toBe('Título definido por el usuario');

  const headerImages = await page.evaluate(() => window.mp.headerImages);
  expect(headerImages.length).toBe(1);
});

test('La ventana de ayuda recibe los tokens de diseño de la página', async ({ page }) => {
  await page.goto('/src/plugins/help/test/playwright/ol/help-ol.html');
  await page.waitForFunction(() => typeof IDEE !== 'undefined' && IDEE.plugin && IDEE.plugin.Help);

  await page.evaluate(() => {
    IDEE.config.token.ayuda = {
      color: { neutral_80: '#ff0000' },
      typography: { fontFamily: '"Courier New", monospace', fontSize: { heading_l: '40px' } },
    };
    IDEE.config.activeTOKEN = 'ayuda';
    window.mapjs = IDEE.map({ container: 'mapjs' });
    window.mp = new IDEE.plugin.Help({ position: 'right' });
    window.mapjs.addPlugin(window.mp);
  });
  await page.waitForFunction(() => window.mp && window.mp.button, null, { timeout: 15000 });

  // La ayuda se abre en un documento nuevo, fuera de la página del mapa. Se escribe con
  // document.write, así que Playwright no emite 'popup' hasta una navegación posterior:
  // se toma la referencia a la ventana desde la página que la abre.
  await page.evaluate(() => {
    const open = window.open.bind(window);
    window.open = (...args) => {
      window.helpWindow = open(...args);
      return window.helpWindow;
    };
    window.mp.control.showHelp();
  });
  await page.waitForFunction(() => window.helpWindow
    && window.helpWindow.document.querySelector('#m-help-header>h1'), null, { timeout: 15000 });
  const styles = await page.evaluate(() => {
    const help = window.helpWindow;
    const css = (selector) => help.getComputedStyle(help.document.querySelector(selector));
    return {
      variable: help.document.documentElement.style.getPropertyValue('--idee-font-size-heading-l').trim(),
      family: css('body').fontFamily,
      title: css('#m-help-header>h1').fontSize,
      header: css('#m-help-header').backgroundColor,
      button: css('.m-help-btn').fontSize,
    };
  });
  expect(styles.variable).toBe('40px');
  expect(styles.family).toContain('Courier New');
  expect(styles.title).toBe('40px');
  expect(styles.header).toBe('rgb(255, 0, 0)');
  // caption = body_m (16px por defecto) * 0.75
  expect(styles.button).toBe('12px');
  await page.evaluate(() => window.helpWindow.close());
});
