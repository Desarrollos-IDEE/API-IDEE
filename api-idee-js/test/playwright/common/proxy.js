/*
 * Proxy JSONP de la API REST simulado (el servidor de pruebas no tiene backend). Como el
 * real, descarga el documento pedido en el momento y lo devuelve con el formato de
 * `api-idee-rest` (ProxyResponse) que lee `Response.parseProxy`:
 * callback({ code, valid, error, content, headers }).
 */

/**
 * Descarga el documento desde el navegador, por la misma red que el resto de recursos
 * de las pruebas (en Jenkins el navegador sale a internet y Node no). Respeta la
 * codificación que declara el XML (algunos contextos WMC son ISO-8859-1).
 * @param {Page} page Página de Playwright.
 * @param {String} target URL del documento.
 * @returns {Promise<Object>} Respuesta del proxy.
 */
const downloadInPage = (page, target) => page.evaluate(async (url) => {
  const remote = await fetch(url);
  const body = new Uint8Array(await remote.arrayBuffer());
  const declaration = new TextDecoder('latin1').decode(body.subarray(0, 100));
  const encoding = /encoding="ISO-8859-1"/i.test(declaration) ? 'latin1' : 'utf-8';
  return {
    code: remote.status,
    valid: remote.ok,
    error: !remote.ok,
    content: new TextDecoder(encoding).decode(body),
    headers: { 'Content-Type': remote.headers.get('content-type') || 'text/xml' },
  };
}, target);

/**
 * Texto de una respuesta respetando la codificación que declara el XML.
 * @param {Buffer} body Cuerpo de la respuesta.
 * @returns {String} Texto.
 */
const decode = (body) => {
  const declaration = body.subarray(0, 100).toString('latin1');
  return body.toString(/encoding="ISO-8859-1"/i.test(declaration) ? 'latin1' : 'utf8');
};

/**
 * Descarga el documento desde Node, para los servidores que no permiten CORS.
 * @param {Page} page Página de Playwright.
 * @param {String} target URL del documento.
 * @returns {Promise<Object>} Respuesta del proxy.
 */
const downloadInNode = async (page, target) => {
  const remote = await page.request.get(target, { timeout: 30000 });
  return {
    code: remote.status(),
    valid: remote.ok(),
    error: !remote.ok(),
    content: decode(await remote.body()),
    headers: { 'Content-Type': remote.headers()['content-type'] || 'text/xml' },
  };
};

/**
 * Simula el proxy JSONP (`IDEE.config.PROXY_URL`) descargando el documento real.
 * @param {Page} page Página de Playwright.
 * @returns {Promise<Array<Object>>} Peticiones atendidas por el proxy, en orden:
 * { url, code, valid, error }, con el motivo del fallo en `error` si no se pudo descargar.
 */
export const mockProxy = async (page) => {
  const requested = [];
  await page.route('**/api/proxy?**', async (route) => {
    const url = new URL(route.request().url());
    const target = url.searchParams.get('url');
    const callback = url.searchParams.get('callback');
    let response;
    try {
      response = await downloadInPage(page, target);
    } catch (pageError) {
      try {
        response = await downloadInNode(page, target);
      } catch (nodeError) {
        response = {
          code: 500, valid: false, error: true, content: `${pageError}\n${nodeError}`, headers: {},
        };
      }
    }
    requested.push({
      url: target,
      code: response.code,
      valid: response.valid,
      error: response.valid ? false : response.content.slice(0, 500),
    });
    return route.fulfill({
      contentType: 'application/javascript',
      body: `${callback}(${JSON.stringify(response)});`,
    });
  });
  return requested;
};

export default mockProxy;
