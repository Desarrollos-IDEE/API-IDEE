/**
 * Esta clase contiene funciones para la gestión de plantillas.
 * @module IDEE/template
 * @example import template from 'IDEE/template';
 */
import Handlebars from 'handlebars';
import {
  isUndefined, stringToHtml, extendsObj,
} from './Utils';
import './handlebarshelpers';

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

  const templateFn = Handlebars.compile(string);
  const htmlText = templateFn(templateVars);
  if (parseToHtml !== false) {
    template = stringToHtml(htmlText);
  } else {
    template = htmlText;
  }
  return template;
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
