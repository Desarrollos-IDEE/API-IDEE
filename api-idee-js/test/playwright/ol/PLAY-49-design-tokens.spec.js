import { test, expect } from '@playwright/test';

/*
 * Tokens de diseño (IDEE.config.token / activeTOKEN): generación de las variables
 * --idee-* en <html> y su consumo en los estilos de la API.
 * Los tokens se aplican en el constructor del mapa, así que cada prueba los
 * configura antes de IDEE.map(). No depende de la red: el mapa no tiene capas
 * y no se comprueba la descarga de fuentes.
 */
const PAGE = '/test/playwright/ol/basic-ol.html';

/** Crea el mapa tras añadir los temas indicados y activar uno. */
const createMap = (page, { tokens, active } = {}) => page.evaluate(({ t, a }) => {
  IDEE.config.baseLayer = [];
  if (t) Object.assign(IDEE.config.token, t);
  if (a) IDEE.config.activeTOKEN = a;
  window.map = IDEE.map({ container: 'map', controls: [], layers: [] });
}, { t: tokens, a: active });

/** Marcado de prueba con las reglas de la API que se quieren comprobar. */
const PROBE = `
  <button id="probe-button">Botón</button>
  <button id="probe-secondary" class="secondary">Secundario</button>
  <button id="probe-disabled" disabled>Deshabilitado</button>
  <button id="probe-activated" class="activated">Activo</button>
  <input id="probe-input" type="text" value="texto">
  <input id="probe-radio" type="radio">
  <div id="probe-pill" class="m-control m-scale-container"></div>
  <div id="probe-container" class="m-rotate-help-container"></div>
  <div class="m-control-panel"><div class="m-controls-panel">
    <div id="probe-important" class="m-mouse-position">x</div>
  </div></div>`;

/** Añade el marcado de prueba dentro del contenedor del mapa. */
const probe = (page) => page.evaluate((html) => {
  const wrapper = document.createElement('div');
  wrapper.innerHTML = html;
  document.querySelector('.m-api-idee-container').appendChild(wrapper);
}, PROBE);

/** Valor inline de una variable en <html> (lo que escribe tokens.js). */
const cssVar = (page, name) => page.evaluate(
  (n) => document.documentElement.style.getPropertyValue(n).trim(),
  name,
);

/** Tamaño en px que resuelve una variable de tamaño tipográfico. */
const resolvedSize = (page, name) => page.evaluate((n) => {
  const element = document.createElement('span');
  element.style.fontSize = `var(${n})`;
  document.body.appendChild(element);
  const size = window.getComputedStyle(element).fontSize;
  element.remove();
  return size;
}, name);

const RADIUS = 'border-top-left-radius';

test.describe('Tokens de diseño (ol)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(PAGE);
  });

  test('el tema cnig por defecto aplica sus colores, su escala y la forma por defecto', async ({ page }) => {
    await createMap(page);
    await probe(page);
    expect(await cssVar(page, '--idee-color-primary')).toBe('#71a7d3');
    expect(await cssVar(page, '--idee-font-size-body-m')).toBe('16px');
    const button = page.locator('#probe-button');
    await expect(button).toHaveCSS('background-color', 'rgb(113, 167, 211)');
    await expect(button).toHaveCSS('font-size', '14px');
    await expect(button).toHaveCSS('font-family', /Roboto/);
    await expect(button).toHaveCSS(RADIUS, '4px');
  });

  test('fontFamily se aplica al contenedor, a los controles y a los diálogos', async ({ page }) => {
    await createMap(page, {
      tokens: { courier: { typography: { fontFamily: '"Courier New", monospace' } } },
      active: 'courier',
    });
    await probe(page);
    await page.evaluate(() => IDEE.dialog.info('Mensaje', 'Título'));
    expect(await cssVar(page, '--idee-font-family')).toBe('"Courier New", monospace');
    const selectors = ['.m-api-idee-container', '#probe-button', '#probe-input',
      '.m-dialog div.m-message', '.m-dialog div.m-title'];
    await Promise.all(selectors.map((s) => expect(page.locator(s).first()).toHaveCSS('font-family', /Courier New/)));
  });

  test('body_m y heading_l se aplican y el resto de la escala se deriva de ellos', async ({ page }) => {
    await createMap(page, {
      tokens: { escala: { typography: { fontSize: { body_m: '20px', heading_l: '40px' } } } },
      active: 'escala',
    });
    await probe(page);
    await page.evaluate(() => IDEE.dialog.info('Mensaje', 'Título'));
    await expect(page.locator('#probe-input')).toHaveCSS('font-size', '20px');
    await expect(page.locator('.m-dialog div.m-message')).toHaveCSS('font-size', '20px');
    // body_s = body_m * 0.875 (contenedor y botones)
    await expect(page.locator('.m-api-idee-container')).toHaveCSS('font-size', '17.5px');
    await expect(page.locator('#probe-button')).toHaveCSS('font-size', '17.5px');
    // caption = body_m * 0.75
    await expect(page.locator('#probe-important')).toHaveCSS('font-size', '15px');
    expect(await resolvedSize(page, '--idee-font-size-heading-l')).toBe('40px');
    // heading_m = heading_l * 0.75
    expect(await resolvedSize(page, '--idee-font-size-heading-m')).toBe('30px');
  });

  test('un tamaño definido en el token prevalece sobre el derivado', async ({ page }) => {
    await createMap(page, {
      tokens: { explicito: { typography: { fontSize: { body_m: '20px', caption: '11px' } } } },
      active: 'explicito',
    });
    expect(await resolvedSize(page, '--idee-font-size-caption')).toBe('11px');
    expect(await resolvedSize(page, '--idee-font-size-body-s')).toBe('17.5px');
  });

  test('borderRadius y boxShadow controlan los componentes; círculos y píldoras se conservan', async ({ page }) => {
    await createMap(page, {
      tokens: { forma: { shape: { borderRadius: '8px', boxShadow: '0 0 0 3px rgb(255, 0, 0)' } } },
      active: 'forma',
    });
    await probe(page);
    await page.evaluate(() => IDEE.dialog.info('Mensaje', 'Título'));
    const content = page.locator('.m-dialog>div.m-modal>div.m-content');
    await expect(page.locator('#probe-button')).toHaveCSS(RADIUS, '8px');
    await expect(page.locator('#probe-input')).toHaveCSS(RADIUS, '8px');
    await expect(content).toHaveCSS(RADIUS, '8px');
    // Contenedores: el doble del radio
    await expect(page.locator('#probe-container')).toHaveCSS(RADIUS, '16px');
    // Geometrías que no siguen al token
    await expect(page.locator('#probe-radio')).toHaveCSS(RADIUS, '50%');
    await expect(page.locator('#probe-pill')).toHaveCSS(RADIUS, '20px');
    await expect(content).toHaveCSS('box-shadow', /rgb\(255, 0, 0\)/);
  });

  test('borderRadius 0px deja los componentes con esquinas rectas', async ({ page }) => {
    await createMap(page, {
      tokens: { recto: { shape: { borderRadius: '0px' } } },
      active: 'recto',
    });
    await probe(page);
    await expect(page.locator('#probe-button')).toHaveCSS(RADIUS, '0px');
    await expect(page.locator('#probe-container')).toHaveCSS(RADIUS, '0px');
    await expect(page.locator('#probe-radio')).toHaveCSS(RADIUS, '50%');
  });

  test('un tema parcial conserva los valores por defecto del resto de tokens', async ({ page }) => {
    await createMap(page, {
      tokens: { parcial: { typography: { fontFamily: 'serif' } } },
      active: 'parcial',
    });
    await probe(page);
    const button = page.locator('#probe-button');
    await expect(button).toHaveCSS('font-family', 'serif');
    await expect(button).toHaveCSS('font-size', '14px');
    await expect(button).toHaveCSS(RADIUS, '4px');
    await expect(button).toHaveCSS('background-color', 'rgb(113, 167, 211)');
    await expect(page.locator('#probe-input')).toHaveCSS('font-size', '16px');
  });

  test('valores vacíos o nulos no generan variables inválidas', async ({ page }) => {
    await createMap(page, {
      tokens: {
        vacio: {
          color: { primary: '', links: null },
          typography: { fontFamily: '   ', fontSize: { body_m: null, heading_l: {} } },
          shape: { borderRadius: '', boxShadow: null },
        },
      },
      active: 'vacio',
    });
    await probe(page);
    const style = await page.evaluate(() => document.documentElement.getAttribute('style') || '');
    expect(style).not.toContain('--idee-');
    expect(style).not.toMatch(/undefined|null|object/);
    await expect(page.locator('#probe-button')).toHaveCSS('font-size', '14px');
    await expect(page.locator('#probe-button')).toHaveCSS(RADIUS, '4px');
  });

  test('los valores por defecto del CSS coinciden con el tema cnig', async ({ page }) => {
    // Con un tema inexistente no se escribe ninguna variable: actúan los valores de @layer base
    await createMap(page, { active: 'tema-inexistente' });
    const style = await page.evaluate(() => document.documentElement.getAttribute('style') || '');
    expect(style).not.toContain('--idee-');
    const differences = await page.evaluate(() => {
      const { cnig } = IDEE.config.token;
      const resolve = (prop, value) => {
        const element = document.createElement('span');
        document.body.appendChild(element);
        element.style.setProperty(prop, value);
        const resolved = window.getComputedStyle(element).getPropertyValue(prop);
        element.remove();
        return resolved;
      };
      const suffix = (key) => key.replace(/_/g, '-');
      const groups = [
        ['color', '--idee-color-', cnig.color],
        ['font-size', '--idee-font-size-', cnig.typography.fontSize],
        ['font-weight', '--idee-font-weight-', cnig.typography.fontWeight],
      ];
      const result = [];
      groups.forEach(([prop, prefix, values]) => {
        Object.entries(values).forEach(([key, value]) => {
          const name = `${prefix}${suffix(key)}`;
          if (resolve(prop, `var(${name})`) !== resolve(prop, String(value))) result.push(name);
        });
      });
      if (resolve('font-family', 'var(--idee-font-family)') !== resolve('font-family', cnig.typography.fontFamily)) {
        result.push('--idee-font-family');
      }
      return result;
    });
    expect(differences).toEqual([]);
  });

  test('el CSS de quien consume la API sustituye valores por defecto, pero no los del token', async ({ page }) => {
    await page.addStyleTag({ content: ':root { --idee-font-size-body-m: 22px; --idee-font-family: fantasy; }' });
    await createMap(page, {
      tokens: { familia: { typography: { fontFamily: 'serif' } } },
      active: 'familia',
    });
    await probe(page);
    await expect(page.locator('#probe-input')).toHaveCSS('font-size', '22px');
    await expect(page.locator('#probe-input')).toHaveCSS('font-family', 'serif');
  });

  test('al crear un mapa con otro tema se eliminan las variables del anterior', async ({ page }) => {
    await createMap(page, {
      tokens: {
        completo: { typography: { fontSize: { body_m: '20px' } }, shape: { borderRadius: '8px' } },
        soloFamilia: { typography: { fontFamily: 'serif' } },
      },
      active: 'completo',
    });
    expect(await cssVar(page, '--idee-shape-border-radius')).toBe('8px');
    await page.evaluate(() => {
      const container = document.createElement('div');
      container.id = 'map2';
      container.style.height = '200px';
      document.body.appendChild(container);
      IDEE.config.activeTOKEN = 'soloFamilia';
      window.map2 = IDEE.map({ container: 'map2', controls: [], layers: [] });
    });
    expect(await cssVar(page, '--idee-shape-border-radius')).toBe('');
    expect(await cssVar(page, '--idee-font-size-body-m')).toBe('');
    expect(await cssVar(page, '--idee-font-family')).toBe('serif');
  });

  test('los tokens de color se aplican a los componentes', async ({ page }) => {
    await createMap(page, {
      tokens: { rojo: { color: { primary: '#ff0000' } } },
      active: 'rojo',
    });
    await probe(page);
    expect(await cssVar(page, '--idee-color-primary')).toBe('#ff0000');
    await expect(page.locator('#probe-button')).toHaveCSS('background-color', 'rgb(255, 0, 0)');
  });

  test('variantes, estados y reglas con !important siguen los tokens', async ({ page }) => {
    await createMap(page, {
      tokens: {
        cascada: {
          typography: { fontFamily: '"Courier New", monospace', fontSize: { body_m: '20px' } },
          shape: { borderRadius: '8px' },
        },
      },
      active: 'cascada',
    });
    await probe(page);
    await expect(page.locator('#probe-secondary')).toHaveCSS(RADIUS, '8px');
    await expect(page.locator('#probe-secondary')).toHaveCSS('font-size', '17.5px');
    await expect(page.locator('#probe-disabled')).toHaveCSS(RADIUS, '8px');
    // button.activated comparte regla con button:hover
    await expect(page.locator('#probe-activated')).toHaveCSS(RADIUS, '8px');
    // .m-control-panel .m-mouse-position declara la tipografía con !important
    await expect(page.locator('#probe-important')).toHaveCSS('font-family', /Courier New/);
    await expect(page.locator('#probe-important')).toHaveCSS('font-size', '15px');
  });

  test('las variables llegan a elementos montados fuera del contenedor del mapa', async ({ page }) => {
    await createMap(page, {
      tokens: { fuera: { typography: { fontSize: { body_m: '20px' } }, shape: { borderRadius: '8px' } } },
      active: 'fuera',
    });
    await page.evaluate(() => {
      const element = document.createElement('div');
      element.id = 'probe-outside';
      element.style.fontSize = 'var(--idee-font-size-body-m)';
      element.style.borderRadius = 'var(--idee-shape-border-radius)';
      document.body.appendChild(element);
    });
    await expect(page.locator('#probe-outside')).toHaveCSS('font-size', '20px');
    await expect(page.locator('#probe-outside')).toHaveCSS(RADIUS, '8px');
  });
});
