/**
 * @module M/Control
 */
import { isUndefined, isNullOrEmpty } from '../util/Utils';
import Exception from '../exception/exception';
import Base from '../Base';
import * as EventType from '../event/eventtype';
import { getValue } from '../i18n/language';

/**
 * @classdesc
 * Es la clase de la que heredan todos los controles.
 *
 * @property {Boolean} activated Define si el control esta activado, por defecto falso.
 * @property {String} name Nombre del control.
 *
 * @api
 * @extends {M.Base}
 */
class Control extends Base {
  /**
   * Constructor principal de la clase.
   *
   * @constructor
   * @api
   * @param {Object} implParam Opciones para generar el control.
   * @param {String} name Nombre del control.
   */
  constructor(implParam, name) {
    const impl = implParam;
    // calls the super constructor
    super(impl);

    // checks if the implementation can create WMC layers
    if (isUndefined(impl.addTo)) {
      Exception(getValue('exception').addto_method);
    }

    // checks if the implementation can create WMC layers
    if (isUndefined(impl.getElement)) {
      Exception(getValue('exception').getelement_method);
    }

    // checks if the implementation can create default controls
    if (isUndefined(impl.isByDefault)) {
      impl.isByDefault = true;
    }

    /**
     * Nombre del control.
     */
    this.name = name;

    /**
     * Declaración de variable.
     */
    this.map_ = null;

    /**
     * Declaración de variable.
     */
    this.element_ = null;

    /**
     * Declaración de variable.
     */
    this.activationBtn_ = null;

    /**
     * Define si el control esta activado, por defecto falso.
     */
    this.activated = false;

    /**
     * Declaración de variable.
     */
    this.panel_ = null;

    /**
     * Declaración de variable.
     */
    this.controls_ = null;
  }

  /**
   * Este método establece la implementación de este control.
   *
   * @public
   * @function
   * @param {M.Map} impl Implementación del mapa.
   * @api
   */
  setImpl(implParam) {
    const impl = implParam;
    // checks if the implementation can create WMC layers
    if (isUndefined(impl.addTo)) {
      Exception(getValue('exception').addto_method);
    }
    if (isUndefined(impl.getElement)) {
      Exception(getValue('exception').getelement_method);
    }
    // checks if the implementation can create default controls
    if (isUndefined(impl.isByDefault)) {
      impl.isByDefault = true;
    }
  }

  /**
   * Este método añade el control al mapa.
   *
   * @public
   * @function
   * @param {M.Map} map Mapa.
   * @api
   * @export
   */
  addTo(map) {
    this.map_ = map;
    const impl = this.getImpl();
    const view = this.createView(map);
    if (view instanceof Promise) { // the view is a promise
      view.then((html) => {
        this.manageActivation(html);
        impl.addTo(map, html);
        this.fire(EventType.ADDED_TO_MAP);
      });
    } else { // view is an HTML or text or null
      this.manageActivation(view);
      impl.addTo(map, view);
      this.fire(EventType.ADDED_TO_MAP);
    }
  }

  /**
   * Este método añade la vista al mapa.
   * @public
   * @function
   * @param {M.Map} map Mapa.
   * @api
   * @export
   */
  createView(map) {}

  /**
   * Este método maneja la activación del control.
   *
   * @public
   * @function
   * @param {HTMLElement} html HTML del control.
   * @api
   * @export
   */
  manageActivation(html) {
    this.element_ = html;
    this.activationBtn_ = this.getActivationButton(this.element_);
    if (!isNullOrEmpty(this.activationBtn_)) {
      this.activationBtn_.addEventListener('click', (evt) => {
        evt.preventDefault();
        if (!this.activated) {
          this.activate();
          this.activated = true;
        } else {
          this.deactivate();
          this.activated = false;
        }
      }, false);
    }
  }

  /**
   * Activación del botón.
   *
   * @public
   * @function
   * @param {HTMLElement} html HTML del botón.
   * @api
   * @export
   */
  getActivationButton(html) {}

  /**
   * Método que añade el evento "click".
   *
   * @public
   * @function
   * @api
   * @export
   */
  activate() {
    if (!isNullOrEmpty(this.element_)) {
      this.element_.classList.add('activated');
    }
    if (!isUndefined(this.getImpl().activate)) {
      this.getImpl().activate();
    }
    this.activated = true;
    this.fire(EventType.ACTIVATED);
  }

  /**
   * Método que elimina el evento "click".
   *
   * @public
   * @function
   * @api
   * @export
   */
  deactivate() {
    if (!isNullOrEmpty(this.element_)) {
      this.element_.classList.remove('activated');
    }
    if (!isUndefined(this.getImpl().deactivate)) {
      this.getImpl().deactivate();
    }
    this.activated = false;
    this.fire(EventType.DEACTIVATED);
  }

  /**
   * Este método devuelve todos los elementos de la implementación.
   *
   * @public
   * @function
   * @returns {Object} Devuelve los elementos extraidos de la implementación.
   * @api
   * @export
   */
  getElement() {
    return this.getImpl().getElement();
  }

  /**
   * Sobrescribe el panel del control.
   *
   * @public
   * @function
   * @param {M.ui.Panel} panel Panel.
   * @api
   * @export
   */
  setPanel(panel) {
    this.panel_ = panel;
  }

  /**
   * Devuelve el panel del control.
   *
   * @public
   * @function
   * @returns {M.ui.Panel} Panel.
   * @api
   * @export
   */
  getPanel() {
    return this.panel_;
  }

  /**
   * Elimina el control.
   *
   * @public
   * @function
   * @api
   * @export
   */
  destroy() {}
}

export default Control;
