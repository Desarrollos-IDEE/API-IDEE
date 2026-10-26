import { test, expect } from '@playwright/test';

/*
 * Contenedores de herramientas del mapa de fachada (arriba, paneles de plugins,
 * columnas de botones, esquinas centrales y abajo): el contenido de uno no debe
 * cambiar el tamaño de los demás. Solo las columnas de botones crecen con su propio
 * contenido, a costa del panel central.
 */
const CONTAINERS = {
  up: '.m-api-idee-up-panel',
  leftPanel: '.m-api-idee-left-panel',
  rightPanel: '.m-api-idee-right-panel',
  leftButtons: '.m-api-idee-left-buttons',
  rightButtons: '.m-api-idee-right-buttons',
  down: '.m-api-idee-down-panel',
  topLeft: '.m-api-idee-center-panel-top-left',
  topRight: '.m-api-idee-center-panel-top-right',
  bottomLeft: '.m-api-idee-center-panel-bottom-left',
  bottomRight: '.m-api-idee-center-panel-bottom-right',
};
const CORNERS = ['topLeft', 'topRight', 'bottomLeft', 'bottomRight'];
const BUTTONS = [['leftButtons', 'rightButtons'], ['rightButtons', 'leftButtons']];
const CONTENT_CLASS = 'tool-panels-test-content';
const RIGID_WIDTH = 200;

/** Ancho y alto de cada contenedor. */
const measure = (page) => page.evaluate((containers) => Object.fromEntries(Object
  .entries(containers).map(([key, selector]) => {
    const { width, height } = document.querySelector(selector).getBoundingClientRect();
    return [key, { width: Math.round(width), height: Math.round(height) }];
  })), CONTAINERS);

/**
 * Añade contenido a un contenedor, mide todos y lo quita.
 * - Flexible: fila con salto de línea, en una sola línea mucho más ancha que el mapa.
 * - Rígido: bloque de ancho fijo, como un panel abierto.
 * @returns {Promise<Object>} Tamaños antes y después de añadir el contenido.
 */
const measureWithContent = async (page, key, rigid = false) => {
  const before = await measure(page);
  await page.evaluate(({ selector, className, rigidWidth }) => {
    const content = document.createElement('div');
    content.className = className;
    if (rigidWidth) {
      content.style.cssText = `width:${rigidWidth}px;height:30px;flex:none`;
    } else {
      content.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px';
      content.innerHTML = Array.from({ length: 12 }, (_, i) => `<span style="white-space:nowrap">Elemento de prueba ${i}</span>`).join('');
    }
    document.querySelector(selector).appendChild(content);
  }, { selector: CONTAINERS[key], className: CONTENT_CLASS, rigidWidth: rigid ? RIGID_WIDTH : 0 });
  const after = await measure(page);
  await page.evaluate((className) => document.querySelectorAll(`.${className}`)
    .forEach((element) => element.remove()), CONTENT_CLASS);
  return { before, after };
};

/** Comprueba que los contenedores indicados conservan su ancho y su alto. */
const expectUnchanged = ({ before, after }, keys) => keys.forEach((key) => {
  expect.soft(after[key], `tamaño de ${key}`).toEqual(before[key]);
});

function registerToolPanelsTests(pagePath) {
  test.describe('Contenedores de herramientas del mapa', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(pagePath, { waitUntil: 'domcontentloaded' });
      await page.evaluate(() => {
        IDEE.config.baseLayer = [];
        if (IDEE.config.terrain) IDEE.config.terrain.default = [];
        window.map = IDEE.map({ container: 'map', controls: [], layers: [] });
        // Sin la transición de la rejilla, para medir el tamaño final
        document.querySelector('.m-api-idee-tool-panels-container').classList.add('is-resizing');
      });
    });

    test('el contenido de un contenedor no cambia el tamaño de los demás', async ({ page }) => {
      const sources = Object.keys(CONTAINERS).filter((key) => !key.endsWith('Buttons'));
      await sources.reduce((previous, source) => previous.then(() => test.step(source, async () => {
        const sizes = await measureWithContent(page, source);
        expectUnchanged(sizes, Object.keys(CONTAINERS).filter((key) => key !== source));
      })), Promise.resolve());
    });

    test('las columnas de botones crecen con su propio contenido sin afectar al resto', async ({ page }) => {
      await BUTTONS.reduce((previous, [source, opposite]) => previous
        .then(() => test.step(source, async () => {
          const sizes = await measureWithContent(page, source, true);
          expect.soft(sizes.after[source].width, `ancho de ${source}`)
            .toBeGreaterThanOrEqual(RIGID_WIDTH);
          expectUnchanged(sizes, [opposite, 'up', 'down', 'leftPanel', 'rightPanel']);
          // El panel central cede el ancho, pero sus esquinas siguen visibles y con su alto
          CORNERS.forEach((corner) => {
            expect.soft(sizes.after[corner].width, `ancho de ${corner}`).toBeGreaterThan(0);
            expect.soft(sizes.after[corner].height, `alto de ${corner}`)
              .toBe(sizes.before[corner].height);
          });
        })), Promise.resolve());
    });
  });
}

export default registerToolPanelsTests;
