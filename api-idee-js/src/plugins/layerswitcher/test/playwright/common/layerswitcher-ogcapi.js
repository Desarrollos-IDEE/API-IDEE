import { test, expect } from '@playwright/test';
import { PAGES, CENTER, configureEngine } from './helpers';

const ROOT = 'https://dataidee.test/api';
const STORAGE_KEY = 'idee.layerswitcher.ogcapi';
const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'Authorization, Content-Type, Accept',
  'access-control-allow-methods': 'GET, POST, OPTIONS',
};

const MODE_SELECT = '#m-layerswitcher-ogc-mode-select';
const AUTH_CONTAINER = '#m-layerswitcher-ogc-auth';
const AUTH_BUTTON = '#m-layerswitcher-ogc-auth button';
const LAYER_SELECT = '#m-layerswitcher-ogc-vectors-select';
const ADD_BUTTON = '#m-layerswitcher-ogc-select-button';

const jwt = (expiresInSeconds) => {
  const encode = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url');
  const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
  return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ sub: 'user', exp })}.signature`;
};

const collection = (id, title) => ({
  id,
  title,
  itemType: 'feature',
  links: [{ rel: 'items', type: 'application/geo+json', href: `${ROOT}/collections/${id}/items` }],
});

const featureCollection = {
  type: 'FeatureCollection',
  features: [{
    type: 'Feature',
    id: 1,
    geometry: { type: 'Point', coordinates: [-3.7, 40.4] },
    properties: { nombre: 'Farmacia' },
  }],
};

/** Rutas de la API de autenticación de DataIDEE (como el servicio real). */
const AUTH_API = '/api/auth-api/auth';

/**
 * Servicio OGC API Features DataIDEE simulado. Todo el token va en la cabecera
 * Authorization: responde 400 a los parámetros "f" y "token" en /items y solo lista
 * la colección privada si recibe la cabecera.
 *
 * Autenticación (con `login`): por defecto la API de DataIDEE del servicio real
 * (`/auth-api/auth/me`, `/login`, `GET /refresh` → { token }, `/logout`); con `legacy`,
 * el contrato anterior (`/auth/login` → { access_token, refresh_token }, `POST /auth/refresh`).
 * Con `publicCollections: false`, sin sesión no lista ninguna colección (como el servicio real).
 */
const mockService = async (page, {
  login = false, legacy = false, tokens = {}, loginDelay = 0, refreshOk = true, loginGate = null,
  publicCollections = true,
} = {}) => {
  const calls = [];
  const authPath = legacy ? '/api/auth' : AUTH_API;
  await page.route(`${ROOT}/**`, async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const authorization = request.headers().authorization;
    if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS });
    calls.push({
      method: request.method(), path: decodeURIComponent(url.pathname), url, authorization,
    });
    const json = (status, body) => route.fulfill({
      status, headers: { ...CORS, 'content-type': 'application/json' }, body: JSON.stringify(body),
    });

    if (url.pathname === `${AUTH_API}/me` && !legacy) {
      if (!login) return json(404, { status: 404 });
      return authorization ? json(200, { username: 'usuario' }) : json(401, { status: 401 });
    }
    if (url.pathname === `${authPath}/login`) {
      if (!login) return json(404, { status: 404 });
      if (request.method() !== 'POST') return json(405, { status: 405 });
      if (request.postDataJSON().password !== 'secret') return json(401, { status: 401 });
      await new Promise((resolve) => { setTimeout(resolve, loginDelay); });
      // El test puede retener la respuesta para comprobar los estados intermedios
      if (loginGate) await loginGate;
      return json(200, legacy
        ? { access_token: tokens.login, refresh_token: 'refresh-1', token_type: 'Bearer' }
        : { token: tokens.login, userId: 1 });
    }
    if (url.pathname === `${authPath}/refresh`) {
      if (!refreshOk) return json(401, { status: 401 });
      return json(200, legacy ? { access_token: tokens.refresh } : { token: tokens.refresh });
    }
    if (url.pathname === `${AUTH_API}/logout` && !legacy) {
      return route.fulfill({ status: 204, headers: CORS });
    }
    if (url.pathname === '/api/collections') {
      const collections = authorization || publicCollections
        ? [collection('local:farmacias', 'Farmacias'), collection('local:rutas', 'Rutas')] : [];
      if (authorization) collections.push(collection('local:privada', 'Privada'));
      return json(200, { links: [{ rel: 'self', href: `${ROOT}/collections` }], collections });
    }
    if (url.pathname.endsWith('/queryables')) return json(200, { properties: {} });
    if (url.pathname.endsWith('/items')) {
      if (url.searchParams.has('f') || url.searchParams.has('token')) {
        return json(400, { detail: 'unknown query parameter' });
      }
      return route.fulfill({
        status: 200,
        headers: { ...CORS, 'content-type': 'application/geo+json' },
        body: JSON.stringify(featureCollection),
      });
    }
    if (url.pathname.startsWith('/api/collections/')) {
      return json(200, { title: 'Colección', description: 'Descripción de prueba' });
    }
    return json(404, { status: 404 });
  });
  return calls;
};

/**
 * Abre la página de la implementación con un mapa sin capas remotas por defecto.
 * @param {Page} page Página de Playwright.
 * @param {String} impl 'ol' o 'cesium'.
 * @param {Function} setup Se ejecuta en la página antes de añadir el plugin.
 * @param {Object} arg Argumento de setup.
 */
const openMap = async (page, impl, setup = () => {}, arg = undefined) => {
  await page.goto(PAGES[impl]);
  await page.evaluate(({ center }) => {
    window.localStorage.clear();
    IDEE.config.baseLayer = [];
    if (IDEE.config.terrain) IDEE.config.terrain.default = [];
    window.mapjs = IDEE.map({
      container: 'mapjs', controls: [], layers: [], center, zoom: 6,
    });
  }, { center: CENTER[impl] });
  await page.evaluate(setup, arg);
  await page.evaluate(() => {
    window.mp = new IDEE.plugin.Layerswitcher({ collapsed: false, precharged: { services: [] } });
    window.mapjs.addPlugin(window.mp);
  });
};

const openService = async (page, impl, serviceUrl, storage) => {
  await openMap(page, impl, ({ key, value }) => {
    if (value) window.localStorage.setItem(key, JSON.stringify(value));
  }, { key: STORAGE_KEY, value: storage });
  await page.click('#layerswitcher-add-layer');
  await page.fill('#m-layerswitcher-addservices-search-input', serviceUrl);
  await page.press('#m-layerswitcher-addservices-search-input', 'Enter');
};

const readStorage = (page) => page
  .evaluate((key) => JSON.parse(window.localStorage.getItem(key) || '{}'), STORAGE_KEY);
const itemsCall = (calls, name) => calls.find((call) => call.path.endsWith(`/collections/${name}/items`));

const WMS_URL = 'https://wms.test/wms';
const FOOTER_BUTTONS = 'div.m-dialog.info div.m-button > button';
const wmsLayer = (name) => `
  <Layer queryable="1">
    <Name>${name}</Name><Title>${name}</Title><Abstract>Capa ${name}</Abstract>
    <CRS>EPSG:3857</CRS><CRS>EPSG:4326</CRS>
    <EX_GeographicBoundingBox>
      <westBoundLongitude>-10</westBoundLongitude><eastBoundLongitude>5</eastBoundLongitude>
      <southBoundLatitude>35</southBoundLatitude><northBoundLatitude>44</northBoundLatitude>
    </EX_GeographicBoundingBox>
    <BoundingBox CRS="EPSG:4326" minx="35" miny="-10" maxx="44" maxy="5"/>
  </Layer>`;
const WMS_CAPABILITIES = `<?xml version="1.0" encoding="UTF-8"?>
<WMS_Capabilities version="1.3.0" xmlns="http://www.opengis.net/wms" xmlns:xlink="http://www.w3.org/1999/xlink">
  <Service><Name>WMS</Name><Title>Servicio de prueba</Title><Abstract>Prueba</Abstract>
    <OnlineResource xlink:href="${WMS_URL}"/></Service>
  <Capability>
    <Request>
      <GetCapabilities><Format>text/xml</Format><DCPType><HTTP><Get><OnlineResource xlink:href="${WMS_URL}?"/></Get></HTTP></DCPType></GetCapabilities>
      <GetMap><Format>image/png</Format><DCPType><HTTP><Get><OnlineResource xlink:href="${WMS_URL}?"/></Get></HTTP></DCPType></GetMap>
    </Request>
    <Exception><Format>XML</Format></Exception>
    <Layer><Title>Raíz</Title><Abstract>Raíz</Abstract><CRS>EPSG:3857</CRS><CRS>EPSG:4326</CRS>
      ${wmsLayer('capa1')}${wmsLayer('capa2')}
    </Layer>
  </Capability>
</WMS_Capabilities>`;

const mockWMS = (page) => page.route(`${WMS_URL}**`, (route) => route.fulfill({
  status: 200,
  headers: { 'access-control-allow-origin': '*', 'content-type': 'text/xml' },
  body: WMS_CAPABILITIES,
}));

const searchService = async (page, serviceUrl) => {
  await page.fill('#m-layerswitcher-addservices-search-input', serviceUrl);
  await page.press('#m-layerswitcher-addservices-search-input', 'Enter');
};

/**
 * Añadir capas de servicios OGC API Features y DataIDEE (con autenticación) y de
 * resultados de capacidades, común a 2D y 3D.
 *
 * @param {String} impl 'ol' o 'cesium'.
 */
// eslint-disable-next-line import/prefer-default-export
export const registerOGCAPITests = (impl) => {
  test.describe(`Layerswitcher: OGC API y DataIDEE (${impl})`, () => {
    configureEngine(impl);

    test('Estándar: /collections/{id} preselecciona la colección y no envía "f" si el servicio no lo anuncia', async ({ page }) => {
      const calls = await mockService(page);
      await openService(page, impl, `${ROOT}/collections/local:rutas`);

      await expect(page.locator(MODE_SELECT)).toHaveValue('ogcapifeatures');
      await expect(page.locator(AUTH_CONTAINER)).toBeHidden();
      await expect(page.locator(LAYER_SELECT)).toHaveValue('local:rutas');

      await page.click(ADD_BUTTON);
      await expect.poll(() => itemsCall(calls, 'local:rutas')).toBeTruthy();
      expect(itemsCall(calls, 'local:rutas').url.searchParams.has('f')).toBe(false);
      expect(await page.evaluate(() => window.mapjs.getOGCAPIFeatures().map((l) => l.name))).toEqual(['local:rutas']);
    });

    test('DataIDEE sin login: oculta el candado y crea una capa DataIDEE sin "f" ni token', async ({ page }) => {
      const calls = await mockService(page, { login: false });
      await openService(page, impl, `${ROOT}/collections`);

      await page.selectOption(MODE_SELECT, 'dataidee');
      await expect.poll(() => calls.some((c) => c.path === `${AUTH_API}/me` && c.method === 'GET')).toBe(true);
      await expect(page.locator(AUTH_CONTAINER)).toBeHidden();
      await expect(page.locator(`${LAYER_SELECT} option[value]:not([value=""])`)).toHaveCount(2);

      await page.selectOption(LAYER_SELECT, 'local:farmacias');
      await page.click(ADD_BUTTON);
      await expect.poll(() => itemsCall(calls, 'local:farmacias')).toBeTruthy();
      const request = itemsCall(calls, 'local:farmacias');
      expect(request.url.searchParams.has('f')).toBe(false);
      expect(request.url.searchParams.has('token')).toBe(false);
      expect(request.authorization).toBeUndefined();
      expect(await page.evaluate(() => window.mapjs.getDataIDEE().map((l) => l.name))).toEqual(['local:farmacias']);
      expect((await readStorage(page))[ROOT].mode).toBe('dataidee');
    });

    test('DataIDEE sin colecciones visibles: «Comprobar» avisa y no falla', async ({ page }) => {
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await mockService(page, { login: true, publicCollections: false });
      await openService(page, impl, `${ROOT}/collections`, { [ROOT]: { mode: 'dataidee' } });

      await expect(page.locator(AUTH_BUTTON)).toHaveClass(/m-layerswitcher-auth-unlocked/);
      await expect(page.locator(`${LAYER_SELECT} option[value]:not([value=""])`)).toHaveCount(0);
      await page.click('#m-layerswitcher-ogcCContainer #m-layerswitcher-ogc-check-button');
      await expect(page.locator('div.m-dialog.error'))
        .toContainText('No se han encontrado capas en este servicio');
      expect(errors).toEqual([]);
    });

    test('DataIDEE con login: envía Bearer a colecciones, items y metadatos; cerrar sesión lo retira', async ({ page }) => {
      const token = jwt(3600);
      let releaseLogin;
      const loginGate = new Promise((resolve) => { releaseLogin = resolve; });
      const calls = await mockService(page, { login: true, tokens: { login: token }, loginGate });
      await openService(page, impl, `${ROOT}/collections`, { [ROOT]: { mode: 'dataidee' } });

      const lock = page.locator(AUTH_BUTTON);
      await expect(lock).toHaveClass(/m-layerswitcher-auth-unlocked/);
      await expect(page.locator(`${LAYER_SELECT} option[value]:not([value=""])`)).toHaveCount(2);

      await lock.click();
      await page.fill('#m-layerswitcher-auth-user', 'usuario');
      await page.fill('#m-layerswitcher-auth-password', 'secret');
      await page.click('.m-layerswitcher-auth-save');

      await expect(page.locator('.m-layerswitcher-auth-modal')).toHaveCount(0);
      await expect(lock).toHaveClass(/m-layerswitcher-auth-pending/);
      await expect(lock).toHaveClass(/m-layerswitcher-anim-water-drop/);
      await expect(lock).toBeDisabled();
      releaseLogin();
      await expect(lock).toHaveClass(/m-layerswitcher-auth-locked/);
      await expect(lock).toBeEnabled();

      // Login en la API de autenticación de DataIDEE: su respuesta ({ token }) no trae
      // refresh token
      expect(calls.some((c) => c.path === `${AUTH_API}/login` && c.method === 'POST')).toBe(true);
      await expect(page.locator(`${LAYER_SELECT} option[value="local:privada"]`)).toHaveCount(1);
      expect(calls.some((c) => c.path === '/api/collections' && c.authorization === `Bearer ${token}`)).toBe(true);
      expect((await readStorage(page))[ROOT].session).toEqual({ accessToken: token });

      await page.selectOption(LAYER_SELECT, 'local:privada');
      await page.click(ADD_BUTTON);
      await expect.poll(() => itemsCall(calls, 'local:privada')).toBeTruthy();
      // La capa DataIDEE envía el token en la cabecera, no como parámetro
      expect(itemsCall(calls, 'local:privada').authorization).toBe(`Bearer ${token}`);
      expect(itemsCall(calls, 'local:privada').url.searchParams.has('token')).toBe(false);
      expect(await page.evaluate(() => window.mapjs.getDataIDEE()[0].getToken())).toBe(token);

      // Cerrar sesión desde el candado cerrado: también se cierra en el servicio
      await page.click('#layerswitcher-add-layer');
      await page.fill('#m-layerswitcher-addservices-search-input', `${ROOT}/collections`);
      await page.press('#m-layerswitcher-addservices-search-input', 'Enter');
      await expect(page.locator(AUTH_BUTTON)).toHaveClass(/m-layerswitcher-auth-locked/);
      await page.click(AUTH_BUTTON);
      await expect(page.locator(AUTH_BUTTON)).toHaveClass(/m-layerswitcher-auth-unlocked/);
      await expect(page.locator(`${LAYER_SELECT} option[value="local:privada"]`)).toHaveCount(0);
      expect((await readStorage(page))[ROOT].session).toBeUndefined();
      expect(await page.evaluate(() => window.mapjs.getDataIDEE()[0].getToken())).toBeUndefined();
      await expect.poll(() => calls.find((c) => c.path === `${AUTH_API}/logout`)?.authorization)
        .toBe(`Bearer ${token}`);
    });

    test('DataIDEE autenticado envía Bearer también en queryables, conteo y metadatos', async ({ page }) => {
      const token = jwt(3600);
      const calls = await mockService(page, { login: true, tokens: { login: token } });
      await openService(page, impl, `${ROOT}/collections`, {
        [ROOT]: { mode: 'dataidee', session: { accessToken: token } },
      });

      await expect(page.locator(`${LAYER_SELECT} option[value="local:privada"]`)).toHaveCount(1);
      expect(calls.some((call) => call.path === '/api/collections'
        && call.authorization === `Bearer ${token}`)).toBe(true);
      await page.evaluate(async ({ root, authToken }) => {
        // eslint-disable-next-line no-underscore-dangle
        const mode = window.mp.controls[0].ogcModes_.dataidee;
        await mode.getQueryables(root, 'local:privada');
        await mode.countFeatures(root, { name: 'local:privada' });
        const { url, options } = mode.getLayerInfoRequest({
          url: `${root}/`, name: 'local:privada', getToken: () => authToken,
        });
        await IDEE.remote.get(url, null, options);
      }, { root: ROOT, authToken: token });

      expect(calls.find((call) => call.path.endsWith('/queryables')).authorization).toBe(`Bearer ${token}`);
      expect(calls.find((call) => call.path.endsWith('/collections/local:privada/items')).authorization)
        .toBe(`Bearer ${token}`);
      expect(calls.find((call) => call.path === '/api/collections/local:privada').authorization)
        .toBe(`Bearer ${token}`);
    });

    test('DataIDEE con el contrato anterior (/auth/login): detecta el login e inicia sesión', async ({ page }) => {
      const token = jwt(3600);
      const calls = await mockService(page, {
        login: true, legacy: true, tokens: { login: token },
      });
      await openService(page, impl, `${ROOT}/collections`, { [ROOT]: { mode: 'dataidee' } });

      const lock = page.locator(AUTH_BUTTON);
      await expect(lock).toHaveClass(/m-layerswitcher-auth-unlocked/);
      await lock.click();
      await page.fill('#m-layerswitcher-auth-user', 'usuario');
      await page.fill('#m-layerswitcher-auth-password', 'secret');
      await page.click('.m-layerswitcher-auth-save');
      await expect(lock).toHaveClass(/m-layerswitcher-auth-locked/);

      expect(calls.some((c) => c.path === '/api/auth/login' && c.method === 'POST')).toBe(true);
      await expect(page.locator(`${LAYER_SELECT} option[value="local:privada"]`)).toHaveCount(1);
      expect((await readStorage(page))[ROOT].session).toEqual({ accessToken: token, refreshToken: 'refresh-1' });
    });

    test('DataIDEE con credenciales incorrectas: el candado sigue abierto y se avisa al usuario', async ({ page }) => {
      await mockService(page, { login: true, tokens: { login: jwt(3600) } });
      await openService(page, impl, `${ROOT}/collections`, { [ROOT]: { mode: 'dataidee' } });

      await page.click(AUTH_BUTTON);
      await page.fill('#m-layerswitcher-auth-user', 'usuario');
      await page.fill('#m-layerswitcher-auth-password', 'otra');
      await page.click('.m-layerswitcher-auth-save');

      await expect(page.locator(AUTH_BUTTON)).toHaveClass(/m-layerswitcher-auth-unlocked/);
      await expect(page.locator('div.m-dialog.error')).toContainText('Usuario o contraseña incorrectos');
      expect((await readStorage(page))[ROOT].session).toBeUndefined();
    });

    test('DataIDEE con token caducado: se renueva antes de listar las colecciones', async ({ page }) => {
      const expired = jwt(-60);
      const refreshed = jwt(3600);
      const calls = await mockService(page, { login: true, tokens: { refresh: refreshed } });
      await openService(page, impl, `${ROOT}/collections`, {
        [ROOT]: { mode: 'dataidee', session: { accessToken: expired } },
      });

      await expect(page.locator(AUTH_BUTTON)).toHaveClass(/m-layerswitcher-auth-locked/);
      // La API de autenticación de DataIDEE renueva por GET con el token actual
      const refreshCall = calls.find((c) => c.path === `${AUTH_API}/refresh`);
      expect(refreshCall.method).toBe('GET');
      expect(refreshCall.authorization).toBe(`Bearer ${expired}`);
      await expect(page.locator(`${LAYER_SELECT} option[value="local:privada"]`)).toHaveCount(1);
      expect(calls.some((c) => c.path === '/api/collections' && c.authorization === `Bearer ${refreshed}`)).toBe(true);
      expect((await readStorage(page))[ROOT].session.accessToken).toBe(refreshed);
    });

    test('DataIDEE con renovación fallida: se cierra la sesión y se avisa al usuario', async ({ page }) => {
      await mockService(page, { login: true, refreshOk: false });
      await openService(page, impl, `${ROOT}/collections`, {
        [ROOT]: { mode: 'dataidee', session: { accessToken: jwt(-60) } },
      });

      await expect(page.locator(AUTH_BUTTON)).toHaveClass(/m-layerswitcher-auth-unlocked/);
      await expect(page.locator('div.m-dialog.error')).toContainText('La sesión del servicio ha caducado');
      expect((await readStorage(page))[ROOT].session).toBeUndefined();
    });

    test('Resultados de un servicio: «Añadir» va en el pie junto a «Cerrar» y se quita con una búsqueda nueva', async ({ page }) => {
      await mockWMS(page);
      await page.route('https://unreachable.test/**', (route) => route.abort());
      await openService(page, impl, WMS_URL);

      await expect(page.locator('#m-layerswitcher-all')).toBeVisible();
      await expect(page.locator(FOOTER_BUTTONS)).toHaveText(['Añadir', 'Cerrar']);
      // Sin grupos de capas en el mapa no se muestra el selector de grupo
      await expect(page.locator('.m-layerswitcher-groups-fields')).toHaveCount(0);

      // Una búsqueda nueva quita la acción; un servicio sin respuesta muestra un aviso claro
      await searchService(page, 'https://unreachable.test/collections');
      await expect(page.locator('div.m-dialog.error')).toContainText('No se ha podido acceder al servicio');
      await page.click('div.m-dialog.error div.m-button > button');
      await expect(page.locator(FOOTER_BUTTONS)).toHaveText(['Cerrar']);

      await searchService(page, WMS_URL);
      await page.check('#capa1');
      await page.click('#m-layerswitcher-addservices-add-btn');
      await expect(page.locator('div.m-dialog.info')).toHaveCount(0);
      expect(await page.evaluate(() => window.mapjs.getWMS().map((l) => l.name))).toEqual(['capa1']);
    });

    test('Selector de destino: siempre visible con «Añadir al mapa» y con los grupos del mapa si los hay', async ({ page }) => {
      const destination = page.locator('select.m-layerswitcher-groups-fields');
      await mockWMS(page);

      // Sin grupos: solo «Añadir al mapa», visible y habilitado
      await openMap(page, impl);
      await page.click('#layerswitcher-add-layer');
      await searchService(page, WMS_URL);
      await expect(destination).toBeVisible();
      await expect(destination).toBeEnabled();
      await expect(destination.locator('option')).toHaveText(['Añadir al mapa']);

      // Con un grupo: también el grupo
      await openMap(page, impl, () => {
        window.mapjs.addLayers(new IDEE.layer.LayerGroup({ name: 'grupo', legend: 'Grupo de prueba' }));
      });
      await page.click('#layerswitcher-add-layer');
      await searchService(page, WMS_URL);
      await expect(destination.locator('option')).toHaveText(['Añadir al mapa', 'Grupo de prueba']);
    });
  });
};
