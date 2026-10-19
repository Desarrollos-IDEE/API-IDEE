import { test, expect } from '@playwright/test';

const ROOT = 'https://dataidee-auth.test';
const CORS = { 'access-control-allow-origin': '*' };

// Sin token la colección es pública salvo que se indique lo contrario.
const routeService = async (page, { validTokens = [], publicAccess = true } = {}) => {
  const tokens = [];
  await page.route(`${ROOT}/**`, (route) => {
    const token = new URL(route.request().url()).searchParams.get('token');
    tokens.push(token);
    const authorized = token === null ? publicAccess : validTokens.includes(token);
    if (!authorized) {
      return route.fulfill({
        status: 401, headers: CORS, contentType: 'application/json', body: '{"status":401}',
      });
    }
    return route.fulfill({
      headers: CORS,
      contentType: 'application/geo+json',
      body: JSON.stringify({
        type: 'FeatureCollection',
        features: [{
          type: 'Feature',
          id: token || 'public',
          geometry: { type: 'Point', coordinates: [-6, 37.4] },
          properties: {},
        }],
      }),
    });
  });
  return tokens;
};

const addAuthLayer = (page, pagePath, vendorOptions, options = {}) => page.goto(pagePath)
  .then(() => page.evaluate(({ vendor, opts, root }) => {
    window.map = IDEE.map({ container: 'map' });
    window.authLayer = new IDEE.layer.DataIDEE({ url: `${root}/`, name: 'places' }, opts, vendor);
    window.authEvents = { unauthorized: 0, errors: 0 };
    window.authLayer.on(IDEE.evt.LOAD_UNAUTHORIZED, () => { window.authEvents.unauthorized += 1; });
    window.authLayer.on(IDEE.evt.LOAD_ERROR, () => { window.authEvents.errors += 1; });
    window.map.addLayers(window.authLayer);
  }, { vendor: vendorOptions, opts: options, root: ROOT }));

const unauthorizedEvents = (page) => page.evaluate(() => window.authEvents.unauthorized);

const featureIds = (page) => page.evaluate(() => window.authLayer.getFeatures()
  .map((feature) => feature.getId()));

// Cesium tarda varios segundos en crear las entidades en Chromium y WebKit.
const LOAD_TIMEOUT = { timeout: 20000 };

const waitForIds = (page, ids) => expect.poll(() => featureIds(page), LOAD_TIMEOUT).toEqual(ids);

// Solo estos tests amplían su tiempo máximo, sin afectar al resto del fichero.
const authTest = (title, body) => test(title, async ({ page }) => {
  test.setTimeout(60000);
  await body({ page });
});

export default function registerDataIDEEAuthTests(pagePath) {
  authTest('DataIDEE without token is public and does not send an empty token', async ({ page }) => {
    const tokens = await routeService(page);
    await addAuthLayer(page, pagePath, { getFeature: { token: '' } });
    await waitForIds(page, ['public']);
    expect(tokens).toEqual([null]);
    expect(await page.evaluate(() => window.authLayer.getToken())).toBeUndefined();
  });

  authTest('DataIDEE without token keeps a 401 as a load error, not as an auth failure', async ({ page }) => {
    await routeService(page, { publicAccess: false });
    await addAuthLayer(page, pagePath, {});
    await expect.poll(() => page.evaluate(() => window.authEvents.errors), LOAD_TIMEOUT).toBe(1);
    expect(await page.evaluate(() => window.authEvents.unauthorized)).toBe(0);
    await expect(page.locator('div.m-dialog.error')).toHaveCount(0);
  });

  authTest('DataIDEE sends getFeature.token as the token parameter, also from object literals', async ({ page }) => {
    const tokens = await routeService(page, { validTokens: ['token-1', 'token-2'] });
    await addAuthLayer(page, pagePath, { getFeature: { token: 'token-1' } });
    await waitForIds(page, ['token-1']);
    expect(await page.evaluate(() => window.authLayer.getToken())).toBe('token-1');

    await page.evaluate((root) => {
      window.map.addLayers({
        type: 'DataIDEE',
        url: `${root}/`,
        name: 'literal',
        vendorOptions: { getFeature: { token: 'token-2' } },
      });
    }, ROOT);
    await expect.poll(() => tokens, LOAD_TIMEOUT).toContain('token-2');
  });

  authTest('DataIDEE setToken reloads with the new token, skips the previous cache and clone keeps it', async ({ page }) => {
    const tokens = await routeService(page, { validTokens: ['a', 'b'] });
    await addAuthLayer(page, pagePath, { getFeature: { token: 'a' } }, { cache: true });
    await waitForIds(page, ['a']);

    await page.evaluate(() => window.authLayer.setToken('b'));
    await waitForIds(page, ['b']);
    await page.evaluate(() => window.authLayer.setToken('a'));
    await waitForIds(page, ['a']);
    // La caché del primer token se descarta: vuelve a pedirse a la red.
    expect(tokens.lastIndexOf('a')).toBeGreaterThan(tokens.indexOf('b'));
    expect(await page.evaluate(() => window.authLayer.clone().getToken())).toBe('a');

    await page.evaluate(() => window.authLayer.setToken(''));
    await waitForIds(page, ['public']);
    expect(tokens.at(-1)).toBeNull();
  });

  authTest('DataIDEE rejected token empties the layer, warns once and recovers with a new token', async ({ page }) => {
    await routeService(page, { validTokens: ['fresh'] });
    await addAuthLayer(page, pagePath, { getFeature: { token: 'expired' } });
    await expect.poll(() => unauthorizedEvents(page), LOAD_TIMEOUT).toBe(1);
    expect(await featureIds(page)).toEqual([]);
    expect(await page.evaluate(() => window.authEvents.errors)).toBe(0);
    await expect(page.locator('div.m-dialog.error')).toHaveCount(1);

    await page.evaluate(() => window.authLayer.refresh());
    await expect.poll(() => unauthorizedEvents(page), LOAD_TIMEOUT).toBe(2);
    await expect(page.locator('div.m-dialog.error')).toHaveCount(1);

    await page.evaluate(() => window.authLayer.setToken('fresh'));
    await waitForIds(page, ['fresh']);
    expect(await page.evaluate(() => window.authEvents.errors)).toBe(0);
  });

  authTest('DataIDEE auto-refresh keeps the features when the token is rejected', async ({ page }) => {
    const validTokens = ['valid'];
    await routeService(page, { validTokens });
    await addAuthLayer(page, pagePath, { getFeature: { token: 'valid' } });
    await waitForIds(page, ['valid']);

    validTokens.length = 0;
    const result = await page.evaluate(() => window.authLayer.getImpl().refreshSource()
      .then(() => 'resolved', () => 'rejected'));
    expect(result).toBe('rejected');
    expect(await featureIds(page)).toEqual(['valid']);
    expect(await page.evaluate(() => window.authEvents)).toEqual({ unauthorized: 1, errors: 0 });
  });
}
