import { test, expect } from '@playwright/test';

const PAGE = '/src/plugins/layerswitcher/test/playwright/ol/layerswitcher-dataidee-ol.html';
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

/**
 * Servicio OGC API Features DataIDEE simulado. Como el servicio real, responde
 * 400 a parámetros no declarados en /items (f, token) y solo lista la colección
 * privada si recibe la cabecera Authorization.
 */
const mockService = async (page, {
  login = false, tokens = {}, loginDelay = 0, refreshOk = true,
} = {}) => {
  const calls = [];
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

    if (url.pathname === '/api/auth/login') {
      if (!login) return json(404, { status: 404 });
      if (request.method() !== 'POST') return json(405, { status: 405 });
      if (request.postDataJSON().password !== 'secret') return json(401, { status: 401 });
      await new Promise((resolve) => { setTimeout(resolve, loginDelay); });
      return json(200, { access_token: tokens.login, refresh_token: 'refresh-1', token_type: 'Bearer' });
    }
    if (url.pathname === '/api/auth/refresh') {
      return refreshOk ? json(200, { access_token: tokens.refresh }) : json(401, { status: 401 });
    }
    if (url.pathname === '/api/collections') {
      const collections = [collection('local:farmacias', 'Farmacias'), collection('local:rutas', 'Rutas')];
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

const openService = async (page, serviceUrl, storage) => {
  await page.goto(PAGE);
  await page.evaluate(({ key, value }) => {
    window.localStorage.clear();
    if (value) window.localStorage.setItem(key, JSON.stringify(value));
    window.mapjs = IDEE.map({ container: 'mapjs', controls: [], layers: [] });
    window.mp = new IDEE.plugin.Layerswitcher({ collapsed: false, precharged: { services: [] } });
    window.mapjs.addPlugin(window.mp);
  }, { key: STORAGE_KEY, value: storage });
  await page.click('#layerswitcher-add-layer');
  await page.fill('#m-layerswitcher-addservices-search-input', serviceUrl);
  await page.press('#m-layerswitcher-addservices-search-input', 'Enter');
};

const readStorage = (page) => page.evaluate((key) => JSON.parse(window.localStorage.getItem(key) || '{}'), STORAGE_KEY);
const itemsCall = (calls, name) => calls.find((call) => call.path.endsWith(`/collections/${name}/items`));

test('Estándar: /collections/{id} preselecciona la colección y no envía "f" si el servicio no lo anuncia', async ({ page }) => {
  const calls = await mockService(page);
  await openService(page, `${ROOT}/collections/local:rutas`);

  await expect(page.locator(MODE_SELECT)).toHaveValue('ogcapifeatures');
  await expect(page.locator(AUTH_CONTAINER)).toBeHidden();
  await expect(page.locator(LAYER_SELECT)).toHaveValue('local:rutas');

  await page.click(ADD_BUTTON);
  await expect.poll(() => itemsCall(calls, 'local:rutas')).toBeTruthy();
  expect(itemsCall(calls, 'local:rutas').url.searchParams.has('f')).toBe(false);
  expect(await page.evaluate(() => window.mapjs.getOGCAPIFeatures().map((l) => l.name))).toEqual(['local:rutas']);
});

test('DataIDEE sin /auth/login: oculta el candado y crea una capa DataIDEE sin "f" ni token', async ({ page }) => {
  const calls = await mockService(page, { login: false });
  await openService(page, `${ROOT}/collections`);

  await page.selectOption(MODE_SELECT, 'dataidee');
  await expect.poll(() => calls.some((c) => c.path === '/api/auth/login' && c.method === 'GET')).toBe(true);
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

test('DataIDEE con login: envía Bearer a colecciones, items y metadatos; cerrar sesión lo retira', async ({ page }) => {
  const token = jwt(3600);
  const calls = await mockService(page, { login: true, tokens: { login: token }, loginDelay: 800 });
  await openService(page, `${ROOT}/collections`, { [ROOT]: { mode: 'dataidee' } });

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
  await expect(lock).toHaveClass(/m-layerswitcher-auth-locked/);
  await expect(lock).toBeEnabled();

  await expect(page.locator(`${LAYER_SELECT} option[value="local:privada"]`)).toHaveCount(1);
  expect(calls.some((c) => c.path === '/api/collections' && c.authorization === `Bearer ${token}`)).toBe(true);
  expect((await readStorage(page))[ROOT].session).toEqual({ accessToken: token, refreshToken: 'refresh-1' });

  await page.selectOption(LAYER_SELECT, 'local:privada');
  await page.click(ADD_BUTTON);
  await expect.poll(() => itemsCall(calls, 'local:privada')).toBeTruthy();
  expect(itemsCall(calls, 'local:privada').authorization).toBe(`Bearer ${token}`);
  expect(itemsCall(calls, 'local:privada').url.searchParams.has('token')).toBe(false);
  expect(await page.evaluate(() => window.mapjs.getDataIDEE()[0].getToken())).toBe(token);

  // Cerrar sesión desde el candado cerrado
  await page.click('#layerswitcher-add-layer');
  await page.fill('#m-layerswitcher-addservices-search-input', `${ROOT}/collections`);
  await page.press('#m-layerswitcher-addservices-search-input', 'Enter');
  await expect(page.locator(AUTH_BUTTON)).toHaveClass(/m-layerswitcher-auth-locked/);
  await page.click(AUTH_BUTTON);
  await expect(page.locator(AUTH_BUTTON)).toHaveClass(/m-layerswitcher-auth-unlocked/);
  await expect(page.locator(`${LAYER_SELECT} option[value="local:privada"]`)).toHaveCount(0);
  expect((await readStorage(page))[ROOT].session).toBeUndefined();
  expect(await page.evaluate(() => window.mapjs.getDataIDEE()[0].getToken())).toBeUndefined();
});

test('DataIDEE autenticado envía Bearer también en queryables, conteo y metadatos', async ({ page }) => {
  const token = jwt(3600);
  const calls = await mockService(page, { login: true, tokens: { login: token } });
  await openService(page, `${ROOT}/collections`, {
    [ROOT]: { mode: 'dataidee', session: { accessToken: token, refreshToken: 'refresh-1' } },
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

test('DataIDEE con credenciales incorrectas: el candado sigue abierto y se avisa al usuario', async ({ page }) => {
  await mockService(page, { login: true, tokens: { login: jwt(3600) } });
  await openService(page, `${ROOT}/collections`, { [ROOT]: { mode: 'dataidee' } });

  await page.click(AUTH_BUTTON);
  await page.fill('#m-layerswitcher-auth-user', 'usuario');
  await page.fill('#m-layerswitcher-auth-password', 'otra');
  await page.click('.m-layerswitcher-auth-save');

  await expect(page.locator(AUTH_BUTTON)).toHaveClass(/m-layerswitcher-auth-unlocked/);
  await expect(page.locator('div.m-dialog.error')).toContainText('Usuario o contraseña incorrectos');
  expect((await readStorage(page))[ROOT].session).toBeUndefined();
});

test('DataIDEE con token caducado: se refresca antes de listar las colecciones', async ({ page }) => {
  const expired = jwt(-60);
  const refreshed = jwt(3600);
  const calls = await mockService(page, { login: true, tokens: { refresh: refreshed } });
  await openService(page, `${ROOT}/collections`, {
    [ROOT]: { mode: 'dataidee', session: { accessToken: expired, refreshToken: 'refresh-1' } },
  });

  await expect(page.locator(AUTH_BUTTON)).toHaveClass(/m-layerswitcher-auth-locked/);
  const refreshCall = calls.find((c) => c.path === '/api/auth/refresh');
  expect(refreshCall.authorization).toBe(`Bearer ${expired}`);
  await expect(page.locator(`${LAYER_SELECT} option[value="local:privada"]`)).toHaveCount(1);
  expect(calls.some((c) => c.path === '/api/collections' && c.authorization === `Bearer ${refreshed}`)).toBe(true);
  expect((await readStorage(page))[ROOT].session.accessToken).toBe(refreshed);
});

test('DataIDEE con refresh fallido: se cierra la sesión y se avisa al usuario', async ({ page }) => {
  await mockService(page, { login: true, refreshOk: false });
  await openService(page, `${ROOT}/collections`, {
    [ROOT]: { mode: 'dataidee', session: { accessToken: jwt(-60), refreshToken: 'refresh-1' } },
  });

  await expect(page.locator(AUTH_BUTTON)).toHaveClass(/m-layerswitcher-auth-unlocked/);
  await expect(page.locator('div.m-dialog.error')).toContainText('La sesión del servicio ha caducado');
  expect((await readStorage(page))[ROOT].session).toBeUndefined();
});

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

test('Resultados de un servicio: «Añadir» va en el pie junto a «Cerrar» y se quita con una búsqueda nueva', async ({ page }) => {
  await mockWMS(page);
  await page.route('https://unreachable.test/**', (route) => route.abort());
  await openService(page, WMS_URL);

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

test('Selector de grupo: solo aparece si el mapa tiene grupos de capas', async ({ page }) => {
  await mockWMS(page);
  await page.goto(PAGE);
  await page.evaluate(() => {
    window.localStorage.clear();
    window.mapjs = IDEE.map({ container: 'mapjs', controls: [], layers: [] });
    window.mapjs.addLayers(new IDEE.layer.LayerGroup({ name: 'grupo', legend: 'Grupo de prueba' }));
    window.mp = new IDEE.plugin.Layerswitcher({ collapsed: false, precharged: { services: [] } });
    window.mapjs.addPlugin(window.mp);
  });
  await page.click('#layerswitcher-add-layer');
  await searchService(page, WMS_URL);

  await expect(page.locator('.m-layerswitcher-groups-fields option')).toHaveText(['Añadir al mapa', 'Grupo de prueba']);
});
