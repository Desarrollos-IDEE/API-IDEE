/**
 * Esta clase contiene funciones para la gestión de plantillas.
 * @module M/template
 * @example import template from 'M/template';
 */
import Handlebars from 'handlebars';
import { allowInsecurePrototypeAccess } from '@handlebars/allow-prototype-access';
import { get as remoteGet } from 'M/util/Remote';
import registerHelpers from './handlebarshelpers';
import {
  isUndefined, isNullOrEmpty, stringToHtml, extendsObj,
} from './Utils';

/**
 * Plantilla.
 * @const
 * @type {object}
 */
const templates = {};

/**
 * Compilación sincronizada con las variables especificadas
 *
 * @function
 * @param {string} templatePath Nombre de la plantilla.
 * @param {Mx.parameters.TemplateOptions} options Opciones de la plantilla.
 * @returns {HTMLElement} Devuelve la plantilla.
 * @api
 */
export const compileSync = (string, options) => {
  let template;
  let templateVars = {};
  let parseToHtml;
  if (!isUndefined(options)) {
    templateVars = extendsObj(templateVars, options.vars);
    parseToHtml = options.parseToHtml;
  }

  const insecureHandlebars = allowInsecurePrototypeAccess(Handlebars);
  registerHelpers(insecureHandlebars);
  const templateFn = insecureHandlebars.compile(string);
  const htmlText = templateFn(templateVars);
  if (parseToHtml !== false) {
    template = stringToHtml(htmlText);
  } else {
    template = htmlText;
  }
  return template;
};

/**
 * Esta función obtiene la URL completa de una plantilla
 * por su nombre.
 *
 * @function
 * @param {string} templatePath Nombre de la plantilla.
 * @returns {string} URL completa de la plantilla.
 * @api
 */
const getTemplateUrl = (templatePath) => {
  let templateUrl = null;
  if (!isNullOrEmpty(templatePath)) {
    templateUrl = M.config.API_IDEE_URL.concat(M.config.TEMPLATES_PATH);
    templateUrl = templateUrl.concat(templatePath);
  }
  return templateUrl;
};

/**
 * Esta función obtiene una función de plantilla de ayudantes personalidos o "Handlebars"
 * por su nombre.
 *
 * @function
 * @param {string} templatePath Nombre de la plantilla.
 * @returns {Promise} La promesa con la función del ayudantes personalidos o "Handlebars".
 * @api
 */
export const get = (templatePath, options) => {
  let scope;
  if (!isUndefined(options)) {
    scope = options.scope;
  }
  return (new Promise((success, fail) => {
    let templateFn = templates[templatePath];
    if (!isUndefined(templateFn)) {
      success.call(scope, templateFn);
    } else {
      let templateUrl = templatePath;
      if (!isUndefined(options) && options.jsonp === true) {
        templateUrl = getTemplateUrl(templatePath);
      }
      const useJsonp = (isNullOrEmpty(options) && (options.jsonp === true));
      remoteGet(templateUrl, null, {
        jsonp: useJsonp,
      }).then((response) => {
        const insecureHandlebars = allowInsecurePrototypeAccess(Handlebars);
        registerHelpers(insecureHandlebars);
        templateFn = insecureHandlebars.compile(response.text);
        templates[templatePath] = templateFn;
        success.call(scope, templateFn);
      });
    }
  }));
};

/**
 * Compilación asíncrona con las variables especificadas.
 *
 * @function
 * @param {string} templatePath Nombre de la plantilla.
 * @param {Mx.parameters.TemplateOptions} options Opciones de la plantilla.
 * @returns {Promise} Devuelve la plantilla HTML.
 * @api
 */
export const compile = (templatePath, options) => {
  let templateVars = {};
  let parseToHtml;
  let scope;
  if (!isUndefined(options)) {
    templateVars = extendsObj(templateVars, options.vars);
    parseToHtml = options.parseToHtml;
    scope = options.scope;
  }
  return (new Promise((success, fail) => {
    get(templatePath, options).then((templateFn) => {
      const htmlText = templateFn.call(null, templateVars);
      if (parseToHtml !== false) {
        success.call(scope, stringToHtml(htmlText));
      } else {
        success.call(scope, htmlText);
      }
    });
  }));
};

/**
 * Esta función agrega una plantilla precompilada en el
 * plantillas en caché.
 *
 * @function
 * @param {string} templatePath Nombre de la plantilla.
 * @param {function} templateFn Función de la plantilla precompilada.
 * @api stable
 */
export const add = (templatePath, templateFn) => {
  if (isUndefined(templates[templatePath])) {
    templates[templatePath] = templateFn;
  }
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
