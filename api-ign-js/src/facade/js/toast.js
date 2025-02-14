/**
 * Este modulo contiene las funciones para mostrar un toast.
 * @module M/toast
 */
import 'assets/css/toast';
import toastTemplate from 'templates/toast';
import { compileSync as compileTemplate } from './util/Template';
import { getValue } from './i18n/language';

/**
 * Eliminar el "toast" padre.
 * @public
 * @function
 * @param {HTMLElement} element Elimina el elemento html.
 * @api
 */
export const removeElement = (element) => {
  const parent = element.parentElement;
  parent.removeChild(element);
  if (!parent.children || parent.children.length === 0) {
    parent.remove();
  }
};

/**
 * Elimina el elemento "Toast"
 * @public
 * @function
 * @api
 */
export const remove = () => {
  const toasts = document.querySelector('div.m-toasts-container');
  if (toasts) {
    toasts.remove();
  }
};

/**
 * Esta función genera la plantilla del "toast".
 * @public
 * @function
 * @param {String} message Contenido que se mostrará.
 * @param {String} severity Tipo de modal.
 * @param {String} icon Icono para mostrar.
 * @param {Number} order "tabindex" de los elementos del "toast", por defecto 300.
 * @param {NUmber} time Tiempo de aparición del "toast", por defecto 4000 (4 segundos).
 * @api
 */
export const show = (message, severity, icon, order = 300, time = 4000) => {
  const vars = {
    message,
    severity,
    icon,
    order,
    translations: {
      close: getValue('toast').close,
    },
  };
  const html = compileTemplate(toastTemplate, {
    vars,
  });

  // append new toast
  const mapeaContainer = document.querySelector('div.m-mapea-container');
  let toastContainer = document.querySelector('div.m-toasts-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.classList.add('m-toasts-container');
    mapeaContainer.appendChild(toastContainer);
  }

  // close in 4 seconds
  const duration = setTimeout(() => {
    removeElement(html);
  }, time);

  // adds listener to close the toast
  const closeButton = html.querySelector('button.m-toast-button');
  closeButton.addEventListener('click', () => {
    removeElement(html);
    clearTimeout(duration);
  });
  toastContainer.appendChild(html);
};

/**
 * Genera el "toast" de tipo "info".
 *
 * @public
 * @function
 * @param {String} message Mensaje que se mostrará.
 * @param { Number } order "tabIndex" de los elementos del HTML.
 * @param {Number} time Tiempo de aparición del "toast".
 * @api
 */
export const info = (message, order, time) => {
  return show(message, 'info', 'g-cartografia-info', order, time);
};

/**
 * Genera el "toast" de tipo "error".
 *
 * @public
 * @function
 * @param {String} message Mensaje que se mostrará.
 * @param {Number} order "tabIndex" de los elementos del HTML.
 * @param {Number} time Tiempo de aparición del "toast".
 * @api
 */
export const error = (message, order, time) => {
  return show(message, 'error', 'g-cartografia-notification', order, time);
};

/**
 * Genera el "toast" de tipo "warning".
 *
 * @public
 * @function
 * @param {String} message Mensaje que se mostrará.
 * @param {Number} order "tabIndex" de los elementos del HTML.
 * @param {Number} time Tiempo de aparición del "toast".
 * @api
 */
export const warning = (message, order, time) => {
  return show(message, 'warning', 'g-cartografia-warning', order, time);
};

/**
 * Genera el "toast" de tipo "sucess".
 *
 * @public
 * @function
 * @param {String} message Mensaje que se mostrará.
 * @param {Number} order "tabIndex" de los elementos del HTML.
 * @param {Number} time Tiempo de aparición del "toast".
 * @api
 */
export const success = (message, order, time) => {
  return show(message, 'success', 'g-cartografia-check', order, time);
};

export default {};
