/**
 * Este fichero contiene la clase Remote, utiliza AJAX (Asynchronous JavaScript and XML)
 * y JSONP (JSON with Padding)
 * son dos técnicas utilizadas para obtener y enviar datos desde y hacia
 * un servidor sin necesidad de recargar la página web completa.
 *
 * - AJAX permite realizar solicitudes asincrónicas al servidor desde el navegador web,
 * lo que significa que se pueden enviar y recibir datos sin tener que recargar la página completa.
 * Esto permite actualizar partes específicas de una página web sin afectar el resto de la página.
 *
 * - JSONP es una técnica que se utiliza para obtener datos de un servidor que se encuentra
 * en otro dominio diferente
 * al de la página web. JSONP utiliza una etiqueta de script para cargar datos desde
 * un servidor externo y
 * envolver los datos en una función de devolución de llamada. Esta técnica permite superar
 * la política de seguridad del
 * mismo origen del navegador, que restringe el acceso a recursos de otro dominio.
 * @module IDEE/remote
 * @api
 */

import {
  addParameters, generateRandom, isNullOrEmpty, isObject,
} from './Utils';
import { useproxy } from '../api-idee';
import Response from './Response';

/**
 * Métodos HTTP POST y GET
 * @const
 * @type {object}
 * @public
 * @api
 */
export const method = {
  GET: 'GET',
  POST: 'POST',
};

/**
 * Crea una etiqueta "script" para el proxy.
 *
 * @function
 * @param {String} proxyUrl URL del proxy.
 * @param {String} jsonpHandlerName Nombre del identificador.
 * @api
 */
export const createScriptTag = (proxyUrl, jsonpHandlerName, callback) => {
  const scriptTag = document.createElement('script');
  scriptTag.type = 'text/javascript';
  scriptTag.id = jsonpHandlerName;
  scriptTag.src = proxyUrl;
  scriptTag.setAttribute('async', '');
  scriptTag.onload = () => {
    if (callback) callback();
  };
  window.document.body.appendChild(scriptTag);
};

/**
 * Elimina la etiqueta "script" para el proxy.
 *
 * @function
 * @param {String} jsonpHandlerName Nombre del identificador.
 * @api
 */
const removeScriptTag = (jsonpHandlerName) => {
  const scriptTag = document.getElementById(jsonpHandlerName);
  scriptTag.parentNode.removeChild(scriptTag);
};

/**
 * Esta función maneja el proxy.
 *
 * @function
 * @param {String} url URL del proxy (IDEE.config.PROXY_URL).
 * @param {String} methodType Tipo de petición.
 * @returns {String} Devuelve el proxy.
 * @api
 */
const manageProxy = (url, methodType) => {
  // deafult GET
  let proxyUrl = IDEE.config.PROXY_URL;
  if (methodType === method.POST) {
    proxyUrl = IDEE.config.PROXY_POST_URL;
  }

  proxyUrl = addParameters(proxyUrl, {
    url,
  });

  return proxyUrl;
};

/**
 * Petición basada en JSONP.
 *
 * @function
 * @param {String} urlVar URL.
 * @param {String} data Parámetros.
 * @param {Object} options Opciones.
 * @returns {String} Devuelve la respuesta.
 * @api
 */
const jsonp = (urlVar, data, options) => {
  let url = urlVar;
  if (!isNullOrEmpty(data)) {
    url = addParameters(url, data);
  }

  if (useproxy) {
    url = manageProxy(url, method.GET);
  }

  // creates a random name to avoid clonflicts
  const jsonpHandlerName = generateRandom('apiIdee_jsonphandler_');
  url = addParameters(url, {
    callback: jsonpHandlerName,
  });

  const req = new Promise((success, fail) => {
    const userCallback = success;
    // get the promise of the script tag
    const scriptTagPromise = new Promise((scriptTagSuccess) => {
      window[jsonpHandlerName] = scriptTagSuccess;
    });
    /* when the script tag was executed remove
     * the handler and execute the callback
     */
    scriptTagPromise.then((proxyResponse) => {
      // remove the jsonp handler from global window
      delete window[jsonpHandlerName];

      // remove the script tag from the html
      removeScriptTag(jsonpHandlerName);

      const response = new Response();
      response.parseProxy(proxyResponse);

      userCallback(response);
    });
  });

  // creates the script tag
  createScriptTag(url, jsonpHandlerName);

  return req;
};

/**
 * Detecta si un error es de tipo CORS
 *
 * @function
 * @param {Object} xhr Objeto XMLHttpRequest.
 * @returns {Boolean} Verdadero si es error CORS.
 * @api
 */
const isCorsError = (xhr) => {
  // Error CORS típicamente tiene status 0 y no hay respuesta
  // También puede ocurrir cuando hay un error de red sin status
  return (xhr.status === 0 && xhr.responseText === '')
      || (xhr.status === 0 && !xhr.responseURL);
};

/**
 * Petición AJAX.
 *
 * @function
 * @param {String} urlVar URL.
 * @param {String} dataVar Parámetros.
 * @param {Object} methodType Tipo de petición.
 * @param {Boolean|String} useProxy true proxy siempre, 'conditional' si hay error CORS, false nunca
 * @param {Object} headers Headers de la petición.
 * @returns {Promise} Devuelve la respuesta.
 * @api
 */
const ajax = (urlVar, dataVar, methodType, useProxy, headers) => {
  let url = urlVar;
  let data = dataVar;

  let shouldUseProxy = false;
  if (useProxy === true) {
    shouldUseProxy = true;
  } else if (useProxy === 'conditional') {
    // Para modo condicional, primero intentamos sin proxy
    shouldUseProxy = false;
  } else if (useProxy === false) {
    shouldUseProxy = false;
  } else if (useProxy === null || useProxy === undefined) {
    shouldUseProxy = useproxy === true;
  }

  if (shouldUseProxy) {
    url = manageProxy(url, methodType);
  }

  // parses parameters to string
  if (isObject(data)) {
    if (methodType === method.GET) {
      url = addParameters(url, data);
    } else {
      data = JSON.stringify(data);
    }
  }

  return new Promise((success, fail) => {
    let xhr;
    if (window.XMLHttpRequest) {
      xhr = new XMLHttpRequest();
    } else if (window.ActiveXObject) {
      xhr = new ActiveXObject('Microsoft.XMLHTTP');
    }
    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4) {
        const response = new Response();
        response.parseXmlHttp(xhr);

        // Si es modo condicional y hay error CORS, reintentar con proxy
        if (useProxy === 'conditional' && !shouldUseProxy && isCorsError(xhr)) {
          let proxyUrl = urlVar;
          if (isObject(dataVar)) {
            if (methodType === method.GET) {
              proxyUrl = addParameters(proxyUrl, dataVar);
            }
          }
          proxyUrl = manageProxy(proxyUrl, methodType);

          let proxyXhr;
          if (window.XMLHttpRequest) {
            proxyXhr = new XMLHttpRequest();
          } else if (window.ActiveXObject) {
            proxyXhr = new ActiveXObject('Microsoft.XMLHTTP');
          }
          proxyXhr.onreadystatechange = () => {
            if (proxyXhr.readyState === 4) {
              const proxyResponse = new Response();
              proxyResponse.parseXmlHttp(proxyXhr);
              success(proxyResponse);
            }
          };
          proxyXhr.open(methodType, proxyUrl, true);
          if (methodType === method.POST && isObject(dataVar)) {
            proxyXhr.send(JSON.stringify(dataVar));
          } else {
            proxyXhr.send(dataVar);
          }
        } else {
          success(response);
        }
      }
    };
    xhr.onerror = () => {
      // Si es modo condicional y hay error de red, reintentar con proxy
      if (useProxy === 'conditional' && !shouldUseProxy) {
        let proxyUrl = urlVar;
        if (isObject(dataVar)) {
          if (methodType === method.GET) {
            proxyUrl = addParameters(proxyUrl, dataVar);
          }
        }
        proxyUrl = manageProxy(proxyUrl, methodType);

        let proxyXhr;
        if (window.XMLHttpRequest) {
          proxyXhr = new XMLHttpRequest();
        } else if (window.ActiveXObject) {
          proxyXhr = new ActiveXObject('Microsoft.XMLHTTP');
        }
        proxyXhr.onreadystatechange = () => {
          if (proxyXhr.readyState === 4) {
            const proxyResponse = new Response();
            proxyResponse.parseXmlHttp(proxyXhr);
            success(proxyResponse);
          }
        };
        proxyXhr.onerror = () => {
          fail(new Error('Request failed even with proxy'));
        };
        proxyXhr.open(methodType, proxyUrl, true);
        if (methodType === method.POST && isObject(dataVar)) {
          proxyXhr.send(JSON.stringify(dataVar));
        } else {
          proxyXhr.send(dataVar);
        }
      } else {
        fail(new Error('Request failed'));
      }
    };
    xhr.open(methodType, url, true);
    if (!isNullOrEmpty(headers)) {
      Object.keys(headers).forEach((header) => {
        xhr.setRequestHeader(header, headers[header]);
      });
    }
    xhr.send(data);
  });
};

/**
 * Esta función obtiene un recurso lanza un
 * Método HTTP GET y comprueba si la solicitud
 * está basado en AJAX o JSONP.
 *
 * @function
 * @param {string} newUrl URL.
 * @param {string} data Parámetros.
 * @param {Object} options Opciones.
 * @returns {Promise}
 * @api
 */
export const get = (url, data, options) => {
  let req;
  let newUrl = url;

  if (!isNullOrEmpty(options) && 'ticket' in options && (options.ticket === false)) {
    const indexTicket = newUrl.indexOf('ticket=');
    const endTicket = newUrl.indexOf('&', indexTicket);
    newUrl = newUrl.substring(newUrl, indexTicket) + newUrl.substring(endTicket, newUrl.length);
  }

  let useProxyValue = null;
  if (!isNullOrEmpty(options) && 'useProxy' in options) {
    useProxyValue = options.useProxy;
  } else {
    useProxyValue = useproxy;
  }

  let headers = null;
  if (!isNullOrEmpty(options) && 'headers' in options) {
    headers = options.headers;
  }

  const useJsonp = useProxyValue === true
    && (isNullOrEmpty(options) || options.jsonp !== false)
    && useProxyValue !== 'conditional';

  if (useJsonp) {
    req = jsonp(newUrl, data, options);
  } else {
    req = ajax(newUrl, data, method.GET, useProxyValue, headers);
  }

  return req;
};

/**
 * Esta función obtiene un recurso lanznado una petición
 * HTTP POST usando AJAX.
 *
 * @function
 * @param {string} url URL.
 * @param {Object} data Parámetros.
 * @param {Object} options Opciones.
 *
 * @returns {Promise} Respuesta.
 * @api
 */
export const post = (url, data, options) => {
  let useProxyValue = null;
  let headers = null;
  if (!isNullOrEmpty(options) && 'useProxy' in options) {
    useProxyValue = options.useProxy;
  } else {
    useProxyValue = useproxy;
  }
  if (!isNullOrEmpty(options) && 'headers' in options) {
    headers = options.headers;
  }
  return ajax(url, data, method.POST, useProxyValue, headers);
};

/**
 * Este comentario no se verá, es necesario incluir
 * una exportación por defecto para que el compilador
 * muestre las funciones.
 *
 * Esto se produce por al archivo normaliza-exports.js
 * @api stable
 */
export default {};
