/**
 * Este modulo contiene las funciones para mostrar un modal.
 * @module IDEE/dialog
 */
import 'assets/css/dialog';
import dialogTemplate from 'templates/dialog';
import { isUndefined, isNullOrEmpty, transfomContent } from './util/Utils';
import { compileSync as compileTemplate } from './util/Template';
import { getValue } from './i18n/language';

/**
 * Selector de los diálogos.
 * @const
 * @type {string}
 */
const DIALOG_SELECTOR = 'div.m-dialog';

/**
 * Selector del pie de botones del diálogo.
 * @const
 * @type {string}
 */
const FOOTER_SELECTOR = 'div.m-button';

/**
 * Clase de los botones de acción añadidos al pie del diálogo.
 * @const
 * @type {string}
 */
const ACTION_CLASS = 'm-dialog-action';

/**
 * Devuelve el diálogo indicado o, si no se indica, el último abierto.
 *
 * @function
 * @param {HTMLElement|String} dialog Diálogo o selector CSS de diálogos.
 * @returns {HTMLElement|null} Diálogo o null si no hay ninguno.
 */
const getDialog = (dialog) => {
  if (dialog instanceof window.HTMLElement) {
    return dialog.closest(DIALOG_SELECTOR);
  }
  const dialogs = document.querySelectorAll(isNullOrEmpty(dialog) ? DIALOG_SELECTOR : dialog);
  return dialogs.length > 0 ? dialogs[dialogs.length - 1] : null;
};

/**
 * Eliminar el modal padre.
 * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
 * @public
 * @function
 * @param {HTMLElement} element Elimina el elemento html.
 * @api
 */
export const removeElement = (element) => {
  const parent = element.parentElement;
  parent.removeChild(element);
};

/**
 * Elimina el elemento "Dialog"
 * @public
 * @function
 * @api
 */
export const remove = () => {
  const dialogs = document.querySelectorAll('div.m-dialog');
  Array.prototype.forEach.call(dialogs, (dialog) => {
    const parent = dialog.parentElement;
    parent.removeChild(dialog);
  });
};

/**
 * Devuelve el botón de cierre ("OK") del diálogo, sin confundirlo con las
 * acciones añadidas con addAction.
 *
 * @public
 * @function
 * @param {HTMLElement|String} dialog Diálogo o selector CSS de diálogos.
 * Por defecto, el último diálogo abierto.
 * @returns {HTMLButtonElement|null} Botón de cierre o null si no hay diálogo.
 * @api
 */
export const getCloseButton = (dialog) => {
  const element = getDialog(dialog);
  if (element === null) return null;
  return element.querySelector(`${FOOTER_SELECTOR} > button:not(.${ACTION_CLASS})`);
};

/**
 * Elimina del pie del diálogo la acción con el identificador indicado.
 *
 * @public
 * @function
 * @param {String} id Identificador del botón de la acción.
 * @param {HTMLElement|String} dialog Diálogo o selector CSS de diálogos.
 * Por defecto, el último diálogo abierto.
 * @api
 */
export const removeAction = (id, dialog) => {
  const element = getDialog(dialog);
  if (element === null) return;
  element.querySelectorAll(`${FOOTER_SELECTOR} > .${ACTION_CLASS}`).forEach((button) => {
    if (button.id === id) button.remove();
  });
};

/**
 * Elimina del pie del diálogo todas las acciones añadidas con addAction.
 *
 * @public
 * @function
 * @param {HTMLElement|String} dialog Diálogo o selector CSS de diálogos.
 * Por defecto, el último diálogo abierto.
 * @api
 */
export const removeActions = (dialog) => {
  const element = getDialog(dialog);
  if (element === null) return;
  element.querySelectorAll(`${FOOTER_SELECTOR} > .${ACTION_CLASS}`)
    .forEach((button) => button.remove());
};

/**
 * Añade una acción (botón) al pie del diálogo, delante del botón de cierre.
 * Si ya hay una acción con el mismo identificador, la sustituye.
 *
 * @public
 * @function
 * @param {Object} options Opciones de la acción.
 * - id: Identificador del botón.
 * - label: Texto del botón.
 * - onClick: Función al pulsar el botón. Recibe el evento y el diálogo.
 * - order: "tabindex" del botón. Por defecto, el del botón de cierre.
 * - className: Clases CSS adicionales.
 * - title: Texto de ayuda. Por defecto, el texto del botón.
 * @param {HTMLElement|String} dialog Diálogo o selector CSS de diálogos.
 * Por defecto, el último diálogo abierto.
 * @returns {HTMLButtonElement|null} Botón creado o null si no hay diálogo.
 * @api
 */
export const addAction = ({
  id, label, onClick, order, className, title,
} = {}, dialog = undefined) => {
  const element = getDialog(dialog);
  if (element === null) return null;
  const footer = element.querySelector(FOOTER_SELECTOR);
  if (footer === null) return null;
  if (!isNullOrEmpty(id)) removeAction(id, element);

  const closeButton = getCloseButton(element);
  const button = document.createElement('button');
  button.type = 'button';
  if (!isNullOrEmpty(id)) button.id = id;
  button.className = isNullOrEmpty(className) ? ACTION_CLASS : `${ACTION_CLASS} ${className}`;
  button.textContent = label;
  button.title = isNullOrEmpty(title) ? label : title;
  const tabindex = isUndefined(order) ? closeButton?.getAttribute('tabindex') : order;
  if (!isNullOrEmpty(tabindex)) button.setAttribute('tabindex', tabindex);
  if (typeof onClick === 'function') {
    button.addEventListener('click', (evt) => onClick(evt, element));
  }
  footer.insertBefore(button, closeButton);
  return button;
};

/**
 * Esta función genera la plantilla del modal.
 * @public
 * @function
 * @param {String} message Contenido que se mostrará.
 * @param {String} title Título del modal.
 * @param {String} severity Tipo de modal.
 * @param {Number} order "tabindex" de los elementos del modal, por defecto 300.
 * @param {Object} configuration Configuración para el dialog.
 * - intelligence: Adapta el contenido multimedia del mensaje.
 * - actions: Acciones (botones) que se añaden al pie del diálogo con addAction.
 * @returns {HTMLElement} Diálogo creado.
 * @api
 */
export const show = (message, title, severity, order = 300, configuration = {}) => {
  const vars = {
    message,
    title,
    severity,
    order,
  };

  const intelligence = isUndefined(configuration.intelligence)
    ? IDEE.config.DIALOG_INTELLIGENCE : configuration.intelligence;

  if (typeof intelligence === 'object' && intelligence.activate) {
    vars.message = transfomContent(message, intelligence.sizes);
  }

  if (typeof intelligence === 'boolean' && intelligence) {
    vars.message = transfomContent(message);
  }

  const html = compileTemplate(dialogTemplate, {
    vars,
  });

  // append new dialog
  const apiIdeeContainer = document.querySelector('div.m-api-idee-container');

  // adds listener to close the dialog
  const okButton = html.querySelector('div.m-button > button');
  okButton.addEventListener('click', (evt) => removeElement(html));
  apiIdeeContainer.appendChild(html);

  if (Array.isArray(configuration.actions)) {
    configuration.actions.forEach((action) => addAction(action, html));
  }
  return html;
};

/**
 * Genera el modal de tipo "info".
 *
 * @public
 * @function
 * @param {String} message Mensaje que se mostrará.
 * @param {String} titleParam Título del dialogo.
 * @param {Number} order "tabIndex" de los elementos del HTML.
 * @param {Object} configuration Configuración para el dialog.
 * @returns {HTMLElement} Diálogo creado.
 * @api
 */
export const info = (message, titleParam, order, configuration = {}) => {
  let title = titleParam;
  if (isNullOrEmpty(title)) {
    title = getValue('dialog').info;
  }
  return show(message, title, 'info', order, configuration);
};

/**
 * Genera el modal de tipo "error".
 *
 * @public
 * @function
 * @param {String} message Mensaje que se mostrará.
 * @param {String} title Título del dialogo.
 * @param {Number} order "tabIndex" de los elementos del HTML.
 * @param {Object} configuration Configuración para el dialog.
 * @returns {HTMLElement} Diálogo creado.
 * @api
 */
export const error = (message, titleParam, order, configuration = {}) => {
  let title = titleParam;
  if (isNullOrEmpty(title)) {
    title = getValue('dialog').error;
  }
  return show(message, title, 'error', order, configuration);
};

/**
 * Genera el modal de tipo "success".
 *
 * @public
 * @function
 * @param {String} message Mensaje que se mostrará.
 * @param {String} title Título del dialogo.
 * @param {Number} order "tabIndex" de los elementos del HTML.
 * @param {Object} configuration Configuración para el dialog
 * @returns {HTMLElement} Diálogo creado.
 * @api
 */
export const success = (message, titleParam, order, configuration = {}) => {
  let title = titleParam;
  if (isNullOrEmpty(title)) {
    title = getValue('dialog').success;
  }
  return show(message, title, 'success', order, configuration);
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
