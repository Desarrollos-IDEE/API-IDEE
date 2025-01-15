/**
 * Este fichero contiene métodos para ayudar a "Handlebars".
 * @module M/handlebarshelpers
 * @example import handlebarshelpers from 'M/handlebarshelpers';
 */

import { getTextFromHtml } from './Utils';

/**
 * Esta función incluye métodos para ayudar a "Handlebars".
 * https://handlebarsjs.com/
 * @function
 * @param {Object} insecureHandlebars "Handlebars".
 * @api
 */
const helpers = (insecureHandlebars) => {
  /**
   * Ayudantes para "Handlebars" que compara si el
   * el primer argumento es mayor que el segundo.
   *
   * @function
   * @param {Object} arg1 Primer argumento.
   * @param {Object} arg2 Segundo argumento.
   * @param {Object} options Opciones.
   *
   * @returns {Object} Lo invierte si es falso.
   */
  insecureHandlebars.registerHelper('gt', function gt(arg1, arg2, options) {
    if (arg1 > arg2) {
      return options.fn(this);
    }
    return options.inverse(this);
  });

  /**
   * Ayudantes para "Handlebars" que compara si el
   * el primer argumento es menos que el segundo.
   *
   * @function
   * @param {Object} arg1 Primer argumento.
   * @param {Object} arg2 Segundo argumento.
   * @param {Object} options Opciones.
   *
   * @returns {Object} Lo invierte si es falso.
   */
  insecureHandlebars.registerHelper('lt', function lt(arg1, arg2, options) {
    if (arg1 < arg2) {
      return options.fn(this);
    }
    return options.inverse(this);
  });

  /**
   * Ayudantes para "Handlebars" que compara si el
   * el primer argumento es igual que el segundo.
   *
   * @function
   * @param {Object} arg1 Primer argumento.
   * @param {Object} arg2 Segundo argumento.
   * @param {Object} options Opciones.
   *
   * @returns {Object} Lo invierte si es falso.
   */
  insecureHandlebars.registerHelper('eq', function eq(arg1, arg2, options) {
    if (Object.equals(arg1, arg2)) {
      return options.fn(this);
    }
    return options.inverse(this);
  });

  /**
   * Ayudantes para "Handlebars" para eliminar espacios en blanco.
   *
   * @function
   * @param {Object} arg1 Primer argumento.
   * @param {Object} options Opciones.
   *
   * @returns {Object} Lo invierte si es falso.
   */
  insecureHandlebars.registerHelper('oneword', function oneword(arg1, options) {
    if (!/\s/g.test(getTextFromHtml(arg1))) {
      return options.fn(this);
    }
    return options.inverse(this);
  });

  /**
   * Ayudantes para "Handlebars", devuelve una direción y su tipo.
   *
   * @function
   * @param {Object} type Tipo (Municipio, provincia o comunidad autonoma).
   * @param {Object} address Dirección.
   * @param {Object} id Identificador.
   * @param {Object} municipality Municipio.
   * @param {Object} cps CPS.
   *
   * @returns {HTMLElement} Devuelve un elemento "li" con los parámetros.
   */
  insecureHandlebars.registerHelper('printType', (type, address, id, municipality, cps) => {
    let line = `<li id=${id}><span id="info">${address}</span>`;
    // add following lines if asked to show entity type again
    // (but not if type's portal, callejero or Codpost)
    if (type === 'Municipio' || type === 'provincia' || type === 'comunidad autonoma' || cps === true) {
      line += ` (${type})`;
    }
    if (municipality !== undefined) {
      line += ` en ${municipality}`;
    }
    return line;
  });

  /**
   * Ayudantes para "Handlebars", formatea la ruta.
   *
   * @function
   * @param {Object} options Opciones.
   *
   * @returns {String} Ruta.
   */
  insecureHandlebars.registerHelper('pattern', (options) => {
    let output = '';
    options.data.root.fields.forEach((field) => {
      if (!field.isFormatter) return;
      if (field.typeparam === undefined) return;
      const symbolPattern = field.typeparam;
      const numRepeat = field.value;
      for (let i = 0; i < numRepeat; i += 1) {
        output += symbolPattern;
      }
    });
    return output;
  });

  /**
   * Ayudantes para "Handlebars", formatea la cadena.
   *
   * @function
   * @param {Object} item Opciones.
   *
   * @returns {String} Cadena formateada.
   */
  insecureHandlebars.registerHelper('formatterStr', (item) => {
    let symbolPattern = '';
    let numRepeat = 0;
    let output = '';
    numRepeat = item.value;
    symbolPattern = item.typeparam;
    for (let i = 0; i < numRepeat; i += 1) {
      output += symbolPattern;
    }
    return output;
  });

  /**
   * Ayudantes para "Handlebars", si los primeros parámetros son iguales, te
   * devuelve la inversa de las opciones.
   *
   * @function
   * @param {Object} v1 Valor 1.
   * @param {Object} v2 Valor 2.
   * @param {Object} options Opciones.
   *
   * @returns {String} Verdadero, inversa.
   */
  insecureHandlebars.registerHelper('ifCond', (v1, v2, options) => {
    return v1 === v2 ? options.fn(this) : options.inverse(this);
  });

  /**
   * Ayudantes para "Handlebars", suma dos argumentos.
   *
   * @function
   * @param {Number} n1 Número 1.
   * @param {Number} n1 Número 2.
   *
   * @returns {Number} Resultado de la suma.
   */
  insecureHandlebars.registerHelper('sum', (n1, n2) => {
    return n1 + n2;
  });

  /**
   * Ayudantes para "Handlebars", condición inversa con dos argumentos.
   *
   * @function
   * @param {Number} arg1 Número 1.
   * @param {Number} arg2 Número 2.
   *
   * @returns {Number} Resultado de la suma.
   */
  insecureHandlebars.registerHelper('neq', (arg1, arg2, options) => {
    if (!Object.equals(arg1, arg2)) {
      return options.fn(this);
    }
    return options.inverse(this);
  });

  /**
   * Ayudantes para "Handlebars", condición inversa.
   *
   * @function
   * @param {Number} arg1 Argumento 1.
   * @param {Object} options Opciones.
   *
   * @returns {Number} Si el argumento 1 es "falsy" devuelve la inversa.
   */
  insecureHandlebars.registerHelper('unless', (arg1, options) => {
    if (!arg1) {
      return options.fn(this);
    }
    return options.inverse(this);
  });

  /**
   * Ayudantes para "Handlebars", devuelve la posición de una matriz.
   *
   * @function
   * @param {Number} index Indice.
   * @param {Array} array Array.
   *
   * @returns {*} Devuelve el valor de un array.
   */
  insecureHandlebars.registerHelper('get', (index, array) => {
    return array[index];
  });

  /**
   *  Ayudantes para "Handlebars", transforma una cadena a mayúsculas.
   *
   * @function
   * @param {String} string Cadena.
   *
   * @returns {String} Cadena en mayúsculas.
   */
  insecureHandlebars.registerHelper('uppercase', (string) => {
    return string.toUpperCase();
  });

  /**
   *  Ayudantes para "Handlebars", transforma una cadena a minúsculas.
   *
   * @function
   * @param {String} string Cadena.
   *
   * @returns {String} Cadena en mayúsculas.
   */
  insecureHandlebars.registerHelper('lowercase', (string) => {
    return string.toLowerCase();
  });
};

export default helpers;
