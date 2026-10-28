/*
 * Proxy JSONP de la API REST simulado (el servidor de pruebas no tiene backend). Como el
 * real, descarga el documento pedido en el momento y lo devuelve con el formato de
 * `api-idee-rest` (ProxyResponse) que lee `Response.parseProxy`:
 * callback({ code, valid, error, content, headers }).
 */

/**
 * Texto de una respuesta respetando la codificación que declara el XML (algunos
 * contextos WMC son ISO-8859-1).
 * @param {Buffer} body Cuerpo de la respuesta.
 * @returns {String} Texto.
 */
const decode = (body) => {
  const declaration = body.subarray(0, 100).toString('latin1');
  return body.toString(/encoding="ISO-8859-1"/i.test(declaration) ? 'latin1' : 'utf8');
};

/**
 * Simula el proxy JSONP (`IDEE.config.PROXY_URL`) descargando el documento real.
 * @param {Page} page Página de Playwright.
 * @returns {Promise<Array<String>>} URL pedidas a través del proxy.
 */
export const mockProxy = async (page) => {
  const requested = [];
  await page.route('**/api/proxy?**', async (route) => {
    const url = new URL(route.request().url());
    const target = url.searchParams.get('url');
    const callback = url.searchParams.get('callback');
    requested.push(target);
    let response;
    try {
      const remote = await page.request.get(target, { timeout: 30000 });
      response = {
        code: remote.status(),
        valid: remote.ok(),
        error: !remote.ok(),
        content: decode(await remote.body()),
        headers: { 'Content-Type': remote.headers()['content-type'] || 'text/xml' },
      };
    } catch (error) {
      response = {
        code: 500, valid: false, error: true, content: String(error), headers: {},
      };
    }
    return route.fulfill({
      contentType: 'application/javascript',
      body: `${callback}(${JSON.stringify(response)});`,
    });
  });
  return requested;
};

export default mockProxy;
