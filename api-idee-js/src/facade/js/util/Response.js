/**
 * @module M/remote/Response
 */

/**
 * @classdesc
 * Respuesta para solicitudes de proxy.
 * @property {String} text Respuesta.
 * @property {XML} xml Respuesta XML.
 * @property {Object} headers Cabecera.
 * @property {boolean} error Respuesta error.
 * @property {Number} code Respuesta código.
 * @api
 */
class Response {
  /**
   * Constructor principal de la clase.
   * @constructor
   * @extends {M.Object}
   * @param {Object} xmlHttpResponse Respuesta del proxy.
   * @api
   */
  constructor(xmlHttpResponse) {
    /**
     * @type {string}
     * @api
     */
    this.text = null;

    /**
     * @type {XML}
     * @api
     */
    this.xml = null;

    /**
     * @type {Object}
     * @api
     */
    this.headers = {};

    /**
     * @type {boolean}
     * @api
     */
    this.error = false;

    /**
     * @type {Number}
     * @api
     */
    this.code = 0;
  }

  /**
   * Esta función analiza una respuesta XmlHttp
   * de una solicitud AJAX.
   *
   * @function
   * @param {Object} xmlHttpResponse Respuesta.
   * @api
   */
  parseXmlHttp(xmlHttpResponse) {
    this.text = xmlHttpResponse.responseText;
    this.xml = xmlHttpResponse.responseXML;
    this.code = xmlHttpResponse.status;
    this.error = (xmlHttpResponse.statusText !== 'OK');

    let headers = xmlHttpResponse.getAllResponseHeaders();
    headers = headers.split('\n');
    headers.forEach((head) => {
      let headParameter = head;
      headParameter = headParameter.trim();
      const headName = headParameter.replace(/^([^:]+):(.+)$/, '$1').trim();
      const headValue = headParameter.replace(/^([^:]+):(.+)$/, '$2').trim();
      if (headName !== '') {
        this.headers[headName] = headValue;
      }
    });
  }

  /**
   * Esta función analiza una respuesta XmlHttp
   * de una solicitud AJAX del proxy.
   *
   * @function
   * @param {Object} proxyResponse Respuesta del proxy.
   * @api
   */
  parseProxy(proxyResponse) {
    this.code = proxyResponse.code;
    this.error = proxyResponse.error;

    // adds content
    if ((this.code === 200) && (this.error !== true)) {
      this.text = proxyResponse.content.trim();
      try {
        // it uses DOMParser for html responses
        // google XML parser in other case
        const contentType = proxyResponse.headers['Content-Type'];
        if ((typeof DOMParser !== 'undefined') && /text\/html/i.test(contentType)) {
          this.xml = (new DOMParser()).parseFromString(this.text, 'text/html');
        } else if (/xml/i.test(contentType)) { // it avoids responses that aren't xml format
          this.xml = (new DOMParser()).parseFromString(this.text, 'text/xml');
        }
      } catch (err) {
        this.xml = null;
        this.error = true;
      }
    }

    // adds headers
    Object.keys(proxyResponse.headers).forEach((head) => {
      this.headers[head] = proxyResponse.headers[head];
    });
  }
}

export default Response;
