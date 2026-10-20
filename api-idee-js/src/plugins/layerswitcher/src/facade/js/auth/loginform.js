/**
 * Formulario de inicio de sesión superpuesto dentro del diálogo de servicios.
 * No usa IDEE.dialog para no apilar un segundo diálogo de información.
 */
import loginTemplate from '../../../templates/authlogin';
import { getValue } from '../i18n/language';

/**
 * Muestra el formulario y espera a que el usuario guarde o cancele.
 *
 * @param {HTMLElement} parent Elemento sobre el que se superpone el formulario.
 * @param {String} root Raíz del servicio, se muestra como referencia.
 * @returns {Promise<{username: String, password: String}|null>} Credenciales,
 * o null si se cancela.
 */
const showLoginForm = (parent, root) => new Promise((resolve) => {
  const modal = IDEE.template.compileSync(loginTemplate, {
    vars: {
      root,
      translations: {
        auth_login: getValue('auth_login'),
        auth_user: getValue('auth_user'),
        auth_password: getValue('auth_password'),
        auth_save: getValue('auth_save'),
        auth_cancel: getValue('auth_cancel'),
      },
    },
  });
  const form = modal.querySelector('form');
  const close = (result) => {
    modal.remove();
    resolve(result);
  };

  form.addEventListener('submit', (evt) => {
    evt.preventDefault();
    close({
      username: form.elements.username.value.trim(),
      password: form.elements.password.value,
    });
  });
  modal.querySelector('.m-layerswitcher-auth-cancel').addEventListener('click', () => close(null));
  modal.addEventListener('keydown', (evt) => {
    if (evt.key === 'Escape') {
      evt.stopPropagation();
      close(null);
    }
  });

  parent.appendChild(modal);
  form.elements.username.focus();
});

export default showLoginForm;
