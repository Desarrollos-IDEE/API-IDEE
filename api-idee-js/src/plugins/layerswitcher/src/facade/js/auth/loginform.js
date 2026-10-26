/**
 * Formulario de inicio de sesión superpuesto dentro del diálogo de servicios.
 * No usa IDEE.dialog para no apilar un segundo diálogo de información.
 *
 * Admite usuario y contraseña o un token de acceso. "Guardar" solo se habilita
 * cuando hay usuario y contraseña o un token válido (JWT sin caducar); mientras
 * tanto solo se puede cancelar.
 */
import loginTemplate from '../../../templates/authlogin';
import { getValue } from '../i18n/language';
import { checkToken } from './jwt';

const STATUS_CLASSES = ['m-layerswitcher-auth-token-ok', 'm-layerswitcher-auth-token-error'];

const formatDate = (time) => new Date(time).toLocaleString(undefined, {
  dateStyle: 'short', timeStyle: 'short',
});

/**
 * Mensaje sobre el token introducido.
 * @param {Object} result Resultado de checkToken.
 * @returns {String} Mensaje.
 */
const tokenMessage = (result) => {
  if (result.reason === 'format') return getValue('auth_token_invalid');
  if (result.reason === 'expired') {
    return `${getValue('auth_token_expired')} (${formatDate(result.expiresAt)})`;
  }
  return Number.isFinite(result.expiresAt)
    ? `${getValue('auth_token_valid_until')} ${formatDate(result.expiresAt)}`
    : getValue('auth_token_no_expiration');
};

/**
 * Muestra el formulario y espera a que el usuario guarde o cancele.
 *
 * @param {HTMLElement} parent Elemento sobre el que se superpone el formulario.
 * @param {String} root Raíz del servicio, se muestra como referencia.
 * @returns {Promise<{username: String, password: String}|{token: String}|null>}
 * Credenciales o token, o null si se cancela.
 */
const showLoginForm = (parent, root) => new Promise((resolve) => {
  const modal = IDEE.template.compileSync(loginTemplate, {
    vars: {
      root,
      translations: {
        auth_login: getValue('auth_login'),
        auth_user: getValue('auth_user'),
        auth_password: getValue('auth_password'),
        auth_or: getValue('auth_or'),
        auth_token: getValue('auth_token'),
        auth_save: getValue('auth_save'),
        auth_cancel: getValue('auth_cancel'),
      },
    },
  });
  const form = modal.querySelector('form');
  const { username, password, token } = form.elements;
  const save = modal.querySelector('.m-layerswitcher-auth-save');
  const status = modal.querySelector('.m-layerswitcher-auth-token-status');
  const close = (result) => {
    modal.remove();
    resolve(result);
  };

  // Con algo en el token, se usa el token: usuario y contraseña se deshabilitan
  const validate = () => {
    const tokenValue = token.value.trim();
    username.disabled = tokenValue !== '';
    password.disabled = tokenValue !== '';
    status.classList.remove(...STATUS_CLASSES);
    if (tokenValue === '') {
      status.textContent = '';
      save.disabled = username.value.trim() === '' || password.value === '';
      return;
    }
    const result = checkToken(tokenValue);
    status.textContent = tokenMessage(result);
    status.classList.add(result.valid ? STATUS_CLASSES[0] : STATUS_CLASSES[1]);
    save.disabled = !result.valid;
  };
  form.addEventListener('input', validate);

  form.addEventListener('submit', (evt) => {
    evt.preventDefault();
    if (save.disabled) return;
    const tokenValue = token.value.trim();
    close(tokenValue !== ''
      ? { token: tokenValue }
      : { username: username.value.trim(), password: password.value });
  });
  modal.querySelector('.m-layerswitcher-auth-cancel').addEventListener('click', () => close(null));
  modal.addEventListener('keydown', (evt) => {
    if (evt.key === 'Escape') {
      evt.stopPropagation();
      close(null);
    }
  });

  parent.appendChild(modal);
  validate();
  username.focus();
});

export default showLoginForm;
