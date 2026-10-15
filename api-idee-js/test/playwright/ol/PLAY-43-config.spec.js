import { test, expect } from '@playwright/test';

test.describe('IDEE.config', () => {
  test('Comprobando los métodos get y set de IDEE.config', async ({ page }) => {
    await page.goto('/test/playwright/ol/basic-ol.html');

    // get
    const getTest = await page.evaluate(() => {
      return [
        IDEE.config.get('metadata.title'),
        IDEE.config.get(['metadata', 'author']),
        IDEE.config.get('metadata.noexiste'),
        IDEE.config.get('noexiste.a.b'),
      ];
    });
    expect.soft(getTest[0]).toBe('API-IDEE');
    expect.soft(getTest[1]).toBe('Instituto Geográfico Nacional');
    expect.soft(getTest[2]).toBeUndefined();
    expect.soft(getTest[3]).toBeUndefined();

    // set(path, value): reemplaza y crea los objetos intermedios
    const setPathTest = await page.evaluate(() => {
      IDEE.config.set('metadata.title', 'X').set('nuevo.a.b', 1);
      return [IDEE.config.get('metadata.title'), IDEE.config.get('nuevo.a.b')];
    });
    expect.soft(setPathTest[0]).toBe('X');
    expect.soft(setPathTest[1]).toBe(1);

    // set(object): combina en profundidad
    const setObjectTest = await page.evaluate(() => {
      IDEE.config.set({ metadata: { title: 'Y' } });
      return [IDEE.config.get('metadata.title'), IDEE.config.get('metadata.author')];
    });
    expect.soft(setObjectTest[0]).toBe('Y');
    expect.soft(setObjectTest[1]).toBe('Instituto Geográfico Nacional');

    // set(path, object): reemplaza el objeto entero
    const replaceTest = await page.evaluate(() => {
      IDEE.config.set('metadata', { title: 'Z' });
      return [IDEE.config.get('metadata.title'), IDEE.config.get('metadata.author')];
    });
    expect.soft(replaceTest[0]).toBe('Z');
    expect.soft(replaceTest[1]).toBeUndefined();

    // Nombres reservados
    const reservedTest = await page.evaluate(() => {
      const errors = [];
      try { IDEE.config.set('get', 1); } catch (e) { errors.push(e.message); }
      try { IDEE.config.set({ set: 1 }); } catch (e) { errors.push(e.message); }
      return errors;
    });
    expect.soft(reservedTest).toHaveLength(2);

    // Compatibilidad con el uso anterior
    const legacyTest = await page.evaluate(() => {
      IDEE.config('MAX_ZOOM', 18);
      return [IDEE.config.MAX_ZOOM, IDEE.config.get('MAX_ZOOM')];
    });
    expect.soft(legacyTest[0]).toBe(18);
    expect.soft(legacyTest[1]).toBe(18);
  });
});
