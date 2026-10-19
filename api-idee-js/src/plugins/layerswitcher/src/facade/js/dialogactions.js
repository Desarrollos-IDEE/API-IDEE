/**
 * Acciones del pie del diálogo de información (div.m-button), junto al botón
 * "Cerrar". Sustituyen a los botones posicionados de forma absoluta dentro del
 * contenido del diálogo.
 */

const FOOTER = 'div.m-dialog.info div.m-button';
const ACTION_CLASS = 'm-layerswitcher-dialog-action';

/**
 * Selector del botón "Cerrar" del diálogo de información, que no confunde
 * las acciones añadidas al pie con el botón de cierre.
 */
export const CLOSE_BUTTON = `${FOOTER} > button:not(.${ACTION_CLASS})`;

/**
 * Quita del pie del diálogo las acciones añadidas.
 */
export const removeDialogActions = () => {
  document.querySelectorAll(`${FOOTER} > .${ACTION_CLASS}`).forEach((button) => button.remove());
};

/**
 * Muestra una acción en el pie del diálogo, delante del botón "Cerrar".
 * Sustituye a la acción que hubiera.
 *
 * @param {Object} options Opciones.
 * @param {String} options.id Identificador del botón.
 * @param {String} options.label Texto del botón.
 * @param {Function} options.onClick Función al pulsar el botón.
 * @param {Number} options.order Orden de tabulación.
 * @returns {HTMLButtonElement|null} Botón creado o null si no hay diálogo.
 */
export const setDialogAction = ({
  id, label, onClick, order = 0,
}) => {
  removeDialogActions();
  const footer = document.querySelector(FOOTER);
  if (footer === null) return null;

  const button = document.createElement('button');
  button.type = 'button';
  button.id = id;
  button.className = ACTION_CLASS;
  button.textContent = label;
  button.title = label;
  button.setAttribute('tabindex', order);
  button.addEventListener('click', onClick);
  footer.insertBefore(button, document.querySelector(CLOSE_BUTTON));
  return button;
};
