import { test, expect } from '@playwright/test';

/**
 * Acciones del pie del diálogo (IDEE.dialog.addAction y relacionados). El
 * diálogo es de fachada, así que el comportamiento es el mismo en 2D y 3D.
 *
 * @param {String} pagePath Página de prueba de la implementación.
 */
export default (pagePath) => {
  test.describe('IDEE.dialog: acciones del pie', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(pagePath);
      await page.evaluate(() => {
        IDEE.config.baseLayer = [];
        if (IDEE.config.terrain) IDEE.config.terrain.default = [];
        window.map = IDEE.map({ container: 'map', controls: [], layers: [] });
      });
    });

    test('el diálogo de siempre no cambia: un botón OK que lo cierra', async ({ page }) => {
      const returned = await page.evaluate(() => {
        const dialog = IDEE.dialog.info('Mensaje', 'Título');
        return dialog instanceof window.HTMLElement && dialog.classList.contains('m-dialog');
      });
      expect(returned).toBe(true);
      await expect(page.locator('div.m-dialog.info div.m-button > button')).toHaveCount(1);
      await page.locator('div.m-dialog.info div.m-button > button').click();
      await expect(page.locator('div.m-dialog')).toHaveCount(0);
    });

    test('añade, sustituye y quita acciones delante del botón de cierre', async ({ page }) => {
      await page.evaluate(() => {
        window.clicks = [];
        IDEE.dialog.info('Mensaje', 'Título');
        IDEE.dialog.addAction({ id: 'accion-a', label: 'A', onClick: () => window.clicks.push('a') });
        IDEE.dialog.addAction({ id: 'accion-b', label: 'B', onClick: () => window.clicks.push('b') });
        // Mismo id: sustituye a la anterior
        IDEE.dialog.addAction({ id: 'accion-a', label: 'A2', onClick: () => window.clicks.push('a2') });
      });
      const footer = page.locator('div.m-dialog div.m-button > button');
      await expect(footer).toHaveText(['B', 'A2', 'OK']);
      await expect(page.locator('#accion-a')).toHaveClass(/m-dialog-action/);

      await page.locator('#accion-a').click();
      await page.locator('#accion-b').click();
      expect(await page.evaluate(() => window.clicks)).toEqual(['a2', 'b']);
      // Las acciones no cierran el diálogo
      await expect(page.locator('div.m-dialog')).toHaveCount(1);

      await page.evaluate(() => IDEE.dialog.removeAction('accion-b'));
      await expect(footer).toHaveText(['A2', 'OK']);
      await page.evaluate(() => IDEE.dialog.removeActions());
      await expect(footer).toHaveText(['OK']);
    });

    test('getCloseButton devuelve el OK y no las acciones', async ({ page }) => {
      const text = await page.evaluate(() => {
        IDEE.dialog.info('Mensaje', 'Título');
        IDEE.dialog.addAction({ id: 'accion', label: 'Acción' });
        const close = IDEE.dialog.getCloseButton();
        close.textContent = 'Cerrar';
        return close.classList.contains('m-dialog-action');
      });
      expect(text).toBe(false);
      await expect(page.locator('div.m-dialog div.m-button > button')).toHaveText(['Acción', 'Cerrar']);
    });

    test('configuration.actions crea las acciones con el diálogo', async ({ page }) => {
      const tabindex = await page.evaluate(() => {
        IDEE.dialog.success('Mensaje', 'Título', 120, {
          actions: [
            { id: 'guardar', label: 'Guardar', title: 'Guardar cambios' },
            { id: 'deshacer', label: 'Deshacer', order: 7 },
          ],
        });
        return [
          document.querySelector('#guardar').getAttribute('tabindex'),
          document.querySelector('#deshacer').getAttribute('tabindex'),
        ];
      });
      // Sin order hereda el tabindex del diálogo
      expect(tabindex).toEqual(['120', '7']);
      await expect(page.locator('#guardar')).toHaveAttribute('title', 'Guardar cambios');
      await expect(page.locator('div.m-dialog.success div.m-button > button'))
        .toHaveText(['Guardar', 'Deshacer', 'OK']);
    });

    test('actúa sobre el diálogo indicado cuando hay varios abiertos', async ({ page }) => {
      await page.evaluate(() => {
        window.infoDialog = IDEE.dialog.info('Primero', 'Info');
        IDEE.dialog.error('Segundo', 'Error');
        // Por defecto, el último abierto (el de error)
        IDEE.dialog.addAction({ id: 'en-error', label: 'E' });
        // Por elemento o por selector
        IDEE.dialog.addAction({ id: 'en-info', label: 'I' }, window.infoDialog);
        IDEE.dialog.addAction({ id: 'en-info-selector', label: 'S' }, 'div.m-dialog.info');
      });
      await expect(page.locator('div.m-dialog.error div.m-button > button')).toHaveText(['E', 'OK']);
      await expect(page.locator('div.m-dialog.info div.m-button > button')).toHaveText(['I', 'S', 'OK']);

      await page.evaluate(() => IDEE.dialog.removeActions('div.m-dialog.info'));
      await expect(page.locator('div.m-dialog.info div.m-button > button')).toHaveText(['OK']);
      await expect(page.locator('div.m-dialog.error div.m-button > button')).toHaveText(['E', 'OK']);
    });

    test('sin diálogo abierto no hace nada', async ({ page }) => {
      const result = await page.evaluate(() => {
        IDEE.dialog.removeActions();
        IDEE.dialog.removeAction('nada');
        return [IDEE.dialog.addAction({ id: 'x', label: 'X' }), IDEE.dialog.getCloseButton()];
      });
      expect(result).toEqual([null, null]);
    });
  });
};
