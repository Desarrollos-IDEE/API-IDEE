/**
 * Botón de candado para iniciar o cerrar sesión en un servicio DataIDEE.
 *
 * Estados:
 * - hidden: el servicio no ofrece /auth/login.
 * - unlocked: candado abierto, sin token. Al pulsar abre el formulario de login.
 * - pending: consulta en curso. Deshabilitado y con animación de onda.
 * - locked: candado cerrado, con token. Al pulsar cierra la sesión.
 */
import {
  AUTH_HIDDEN, AUTH_UNLOCKED, AUTH_PENDING, AUTH_LOCKED,
} from './authmanager';
import { AuthError } from './authclient';
import showLoginForm from './loginform';
import { getValue } from '../i18n/language';

const BASE_CLASS = 'm-layerswitcher-auth-btn';
const STATE_CLASSES = {
  [AUTH_UNLOCKED]: 'm-layerswitcher-auth-unlocked',
  [AUTH_PENDING]: 'm-layerswitcher-auth-pending m-layerswitcher-anim-water-drop',
  [AUTH_LOCKED]: 'm-layerswitcher-auth-locked',
};
// Iconos genéricos publicados en el fonts.css del núcleo
const ICON_OPEN = 'g-cartografia-candado';
const ICON_CLOSED = 'g-cartografia-candado-cerrado';
const STATE_ICONS = {
  [AUTH_UNLOCKED]: ICON_OPEN,
  [AUTH_PENDING]: ICON_OPEN,
  [AUTH_LOCKED]: ICON_CLOSED,
};
const STATE_TITLES = {
  [AUTH_UNLOCKED]: 'auth_unlocked_title',
  [AUTH_PENDING]: 'auth_pending',
  [AUTH_LOCKED]: 'auth_locked_title',
};
const BAD_CREDENTIALS_CODES = [400, 401, 403];

export default class AuthButton {
  /**
   * @param {Object} options Opciones.
   * @param {HTMLElement} options.container Contenedor del botón.
   * @param {HTMLElement} options.formParent Elemento sobre el que se muestra el login.
   * @param {DataIDEEAuthManager} options.manager Gestor de sesiones.
   * @param {String} options.root Raíz del servicio.
   * @param {Number} options.order Orden de tabulación de los diálogos.
   */
  constructor({
    container, formParent, manager, root, order,
  }) {
    this.container_ = container;
    this.formParent_ = formParent;
    this.manager_ = manager;
    this.root_ = root;
    this.order_ = order;
    this.state_ = AUTH_HIDDEN;
    this.button_ = null;
  }

  /**
   * Crea el botón en el contenedor.
   */
  render() {
    this.button_ = document.createElement('button');
    this.button_.type = 'button';
    this.button_.setAttribute('tabindex', '0');
    this.button_.addEventListener('click', () => this.onClick_());
    this.container_.innerHTML = '';
    this.container_.appendChild(this.button_);
    this.setState(AUTH_PENDING);
  }

  /**
   * Calcula el estado del servicio: comprueba el token guardado (refrescándolo
   * si ha caducado) o si el servicio tiene /auth/login.
   * @returns {Promise<String>} Estado final.
   */
  refresh() {
    const hadSession = !!this.manager_.getToken(this.root_);
    this.setState(AUTH_PENDING);
    return this.manager_.resolve(this.root_).then((state) => {
      this.setState(state);
      if (hadSession && state !== AUTH_LOCKED) {
        IDEE.dialog.error(getValue('exception.auth_refresh_failed'), undefined, this.order_);
      }
      return state;
    });
  }

  /**
   * @param {String} state Estado del botón.
   */
  setState(state) {
    this.state_ = state;
    if (!this.button_) return;
    const isHidden = state === AUTH_HIDDEN;
    this.container_.style.display = isHidden ? 'none' : '';
    this.button_.className = ['secondary', STATE_ICONS[state], BASE_CLASS, STATE_CLASSES[state]]
      .filter(Boolean).join(' ');
    this.button_.disabled = state === AUTH_PENDING;
    this.button_.setAttribute('aria-busy', String(state === AUTH_PENDING));
    if (!isHidden) {
      const title = getValue(STATE_TITLES[state]);
      this.button_.title = title;
      this.button_.setAttribute('aria-label', title);
    }
  }

  /**
   * @returns {String} Estado actual.
   */
  getState() {
    return this.state_;
  }

  onClick_() {
    if (this.state_ === AUTH_UNLOCKED) {
      this.login_();
    } else if (this.state_ === AUTH_LOCKED) {
      this.manager_.logout(this.root_);
      this.setState(AUTH_UNLOCKED);
    }
  }

  async login_() {
    const credentials = await showLoginForm(this.formParent_, this.root_);
    if (!credentials) return;
    this.setState(AUTH_PENDING);
    try {
      await this.manager_.login(this.root_, credentials.username, credentials.password);
      this.setState(AUTH_LOCKED);
    } catch (err) {
      this.setState(AUTH_UNLOCKED);
      const badCredentials = err instanceof AuthError && BAD_CREDENTIALS_CODES.includes(err.code);
      IDEE.dialog.error(getValue(badCredentials ? 'exception.auth_failed' : 'exception.auth_unavailable'), undefined, this.order_);
    }
    if (this.button_?.isConnected) this.button_.focus();
  }
}
