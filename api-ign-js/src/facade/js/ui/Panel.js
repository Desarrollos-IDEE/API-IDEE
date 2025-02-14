/**
 * @module M/ui/Panel
 */
import 'assets/css/panel';
import panelTemplate from 'templates/panel';
import * as Position from './position';
import {
  isArray, isNullOrEmpty, isString, includes,
} from '../util/Utils';
import MObject from '../Object';
import * as EventType from '../event/eventtype';
import ControlBase from '../control/Control';
import { compileSync as compileTemplate } from '../util/Template';

/**
 * @classdesc
 * Esta clase se encarga de general el panel de los plugins.
 * @property {String} name Nombre del panel.
 * @property {String} position Posición del panel.
 *
 * @api
 */
class Panel extends MObject {
  /**
   * Constructor principal de la clase.
   * @constructor
   * @param {string} name Nombre del panel.
   * @param {Mx.parameters.Panel} options Opciones del panel.
   * - collapsible: Indica si el panel se puede colapsar.
   * - position: Posición del panel.
   *   - BL: ".m-bottom.m-left".
   *   - BR: ".m-bottom.m-right".
   *   - TL: ".m-top.m-left".
   *   - TR: ".m-top.m-right".
   * - collapsed: Indica si el panel aparece por defecto colapsado o no.
   * - multiActivation: Si el panel puede estar activado o no.
   * - className: Clase CSS del panel.
   * - collapsedButtonClass: Clase CSS del botón del panel.
   * - tooltip: Información sobre la herramienta.
   * - order: Orden del panel respecto a los otros paneles y su posición.
   * @extends {M.Object}
   * @api
   */
  constructor(name, options = {}) {
    // calls the super constructor
    super();

    /**
     * @type {string}
     * @api
     * @expose
     */
    this.name = name;

    /**
     * @private
     * @type {M.Map}
     * @expose
     */
    this._map = null;

    /**
     * @private
     * @type {array}
     * @expose
     */
    this._controls = [];

    /**
     * @private
     * @type {HTMLElement}
     * @expose
     */
    this._buttonPanel = null;

    /**
     * @private
     * @type {boolean}
     * @expose
     */
    this._collapsible = false;
    if (!isNullOrEmpty(options.collapsible)) {
      this._collapsible = options.collapsible;
    }

    /**
     * @type {Position}
     * @api
     * @expose
     */
    this.position = Position.TL;
    if (!isNullOrEmpty(options.position)) {
      this.position = options.position;
    }

    /**
     * @private
     * @type {boolean}
     * @expose
     */
    this._collapsed = this._collapsible;
    if (!isNullOrEmpty(options.collapsed)) {
      this._collapsed = (options.collapsed && (this._collapsible === true));
    }

    /**
     * @private
     * @type {boolean}
     * @expose
     */
    this._multiActivation = false;
    if (!isNullOrEmpty(options.multiActivation)) {
      this._multiActivation = options.multiActivation;
    }

    /**
     * @private
     * @type {string}
     * @expose
     */
    this._className = null;
    if (!isNullOrEmpty(options.className)) {
      this._className = options.className;
    }

    /**
     * @private
     * @type {string}
     * @expose
     */
    this._collapsedButtonClass = null;
    if (!isNullOrEmpty(options.collapsedButtonClass)) {
      this._collapsedButtonClass = options.collapsedButtonClass;
    } else if ((this.position === Position.TL) || (this.position === Position.BL)) {
      this._collapsedButtonClass = 'g-cartografia-flecha-derecha';
    } else if ((this.position === Position.TR) || (this.position === Position.BR)) {
      this._collapsedButtonClass = 'g-cartografia-flecha-izquierda';
    }

    /**
     * @private
     * @type {string}
     * @expose
     */
    this._openedButtonClass = null;
    if (!isNullOrEmpty(options.openedButtonClass)) {
      this._openedButtonClass = options.openedButtonClass;
    } else if ((this.position === Position.TL) || (this.position === Position.BL)) {
      this._openedButtonClass = 'g-cartografia-flecha-izquierda';
    } else if ((this.position === Position.TR) || (this.position === Position.BR)) {
      this._openedButtonClass = 'g-cartografia-flecha-derecha';
    }

    /**
     * @private
     * @type {HTMLElement}
     * @expose
     */
    this._element = null;

    /**
     * @private
     * @type {HTMLElement}
     * @expose
     */
    this._areaContainer = null;

    /**
     * @private
     * @type {HTMLElement}
     * @expose
     */
    this._controlsContainer = null;

    /**
     * @private
     * @type {String}
     * @expose
     */
    this._tooltip = null;
    if (!isNullOrEmpty(options.tooltip)) {
      this._tooltip = options.tooltip;
    }

    /**
     * @private
     * @type {Number}
     * @expose
     */
    if (!isNullOrEmpty(options.order)) {
      this._order = options.order;
    }
  }

  /**
   * Este método elimina el panel.
   *
   * @public
   * @function
   * @api
   */
  destroy() {
    if (this._element != null) {
      this._areaContainer.removeChild(this._element);
    }
    this._controlsContainer = null;
  }

  /**
   * Este método añade el panel al mapa.
   *
   * @public
   * @function
   * @param {M.map} map Mapa.
   * @param {HTMLElement} areaContainer Elemento contenedor.
   * @api
   */
  addTo(map, areaContainer) {
    this._map = map;
    this._areaContainer = areaContainer;
    const html = compileTemplate(panelTemplate);
    const button = html.querySelector('.m-panel-btn');
    button.setAttribute('type', 'button');

    this._element = html;

    // Accessibility
    button.setAttribute('role', 'button');
    button.setAttribute('aria-label', `Plugin ${this.name}`);

    if (this._order) {
      this._element.style.setProperty('order', this._order, 'important');
      // this._element.setAttribute('tabIndex', this._order);
      button.setAttribute('tabIndex', this._order);
    } else {
      button.setAttribute('tabIndex', '300');
      // this._element.style.setProperty('order', 100, 'important');
    }

    this._tabAccessibility();

    if (!isNullOrEmpty(this._tooltip)) {
      this._element.setAttribute('title', this._tooltip);
    }
    this._buttonPanel = html.querySelector('button.m-panel-btn');
    if (!isNullOrEmpty(this._className)) {
      this._className.split(/\s+/).forEach((className) => {
        html.classList.add(className);
      });
    }

    if (this._collapsed === true) {
      this.collapse();
    } else {
      this.open();
    }

    if (this._collapsible !== true) {
      html.classList.add('no-collapsible');
    }

    this._controlsContainer = html.querySelector('div.m-panel-controls');
    areaContainer.appendChild(html);

    this._buttonPanel.addEventListener('click', (evt) => {
      evt.preventDefault();
      if (this._collapsed === false) {
        this.collapse();
      } else {
        this.open();
      }
    });

    this.addControls(this._controls);
    this.fire(EventType.ADDED_TO_MAP, html);
  }

  /**
   * Este método proporciona tab al panel.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @public
   * @function
   * @api
   */
  _tabAccessibility() {
    document.body.addEventListener('keyup', ({ key, target }) => {
      if (key === 'Tab') {
        if (document.querySelector('.focusStyle')) {
          document.querySelector('.focusStyle').classList.remove('focusStyle');
        }
        target.classList.add('focusStyle');
      }
    });

    document.body.addEventListener('click', () => {
      if (document.querySelector('.focusStyle')) {
        document.querySelector('.focusStyle').classList.remove('focusStyle');
      }
    });
  }

  /**
   * Este método proporciona el evento de cerrar el panel.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @public
   * @function
   * @api
   */
  _collapse(html) {
    html.classList.remove('opened');
    this._buttonPanel.classList.remove(this._openedButtonClass);
    html.classList.add('collapsed');
    this._buttonPanel.classList.add(this._collapsedButtonClass);
    this._collapsed = true;
    this.fire(EventType.HIDE);
  }

  /**
   * Este método proporciona el evento de abrir el panel.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @public
   * @function
   * @api
   */
  _open(html) {
    html.classList.remove('collapsed');
    this._buttonPanel.classList.remove(this._collapsedButtonClass);
    html.classList.add('opened');
    this._buttonPanel.classList.add(this._openedButtonClass);
    this._collapsed = false;
    this.fire(EventType.SHOW);
  }

  /**
   * Este método abre el panel.
   *
   * @public
   * @function
   * @api
   */
  open() {
    this._open(this._element);
  }

  /**
   * Este método cierra el panel.
   *
   * @public
   * @function
   * @api
   */
  collapse() {
    this._collapse(this._element);
  }

  /**
   * Este método devuelve el control del panel.
   *
   * @public
   * @function
   * @return {array<M.Control>} Control.
   * @api
   */
  getControls(filter) {
    if (!filter) {
      return this._controls;
    }

    let filterArray = null;
    let filterControl = null;

    if (!Array.isArray(filter)) {
      filterArray = [filter];
    }

    if (typeof filterArray[0] === 'object') {
      filterControl = Object.values(...filterArray);
    }

    return this._controls.filter(({ name }) => {
      if (filterControl) {
        return filterControl.includes(name);
      }
      return true;
    });
  }

  /**
   * Este método añade un control al panel.
   *
   * @public
   * @function
   * @param {array<M.Control>} controlsParam Control.
   * @api
   */
  addControls(controlsParam) {
    this.contador = 0;
    let controls = controlsParam;
    if (!isNullOrEmpty(controls)) {
      if (!isArray(controls)) {
        controls = [controls];
      }
      controls.forEach((control, i) => {
        if (control instanceof ControlBase) {
          if (!this.hasControl(control)) {
            this._controls.push(control);
            control.setPanel(this);
            control.on(EventType.DESTROY, this._removeControl.bind(this), this);
          }
          if (!isNullOrEmpty(this._controlsContainer)) {
            control.on(EventType.ADDED_TO_MAP, this._moveControlView.bind(this), this);
            this._map.addControls(control);
          }
          control.on(EventType.ACTIVATED, this._manageActivation.bind(this), this);
        }
        control.on(EventType.ADDED_TO_MAP, () => {
          // eslint-disable-next-line no-underscore-dangle
          // control.element_.setAttribute('role', 'button');

          // eslint-disable-next-line no-underscore-dangle
          // control.element_.setAttribute('tabIndex', 0);

          // eslint-disable-next-line no-underscore-dangle
          // console.log(control.element_);
        });
      });
    }
  }

  /**
   * Este método te devuelve verdadero si a un control le pertenece este panel.
   *
   * @public
   * @function
   * @param {array<M.Control>} controlParam Control.
   * @returns {Boolean} Verdadero pertenece, falso no.
   *
   * @api
   */
  hasControl(controlParam) {
    let hasControl = false;
    if (!isNullOrEmpty(controlParam)) {
      if (isString(controlParam)) {
        hasControl = this._controls.some((control) => control.name === controlParam);
      } else if (controlParam instanceof ControlBase) {
        hasControl = includes(this._controls, controlParam);
      }
    }
    return hasControl;
  }

  /**
   * Este método elimina los controles del panel.
   *
   * @public
   * @function
   * @param {array<M.Control>} controlsParam Control.
   * @api
   */
  removeControls(controlsParam) {
    let controls = controlsParam;
    if (!isNullOrEmpty(controls)) {
      if (!isArray(controls)) {
        controls = [controls];
      }
      controls.forEach((controlParam) => {
        const control = controlParam;
        if ((control instanceof ControlBase) && this.hasControl(control)) {
          this._controls = this._controls.filter((control2) => !control.equals(control2));
          control.setPanel(null);
        }
      }, this);
      // if this panel hasn't any controls then it's removed
      // from the map
      if (this._controls.length === 0) {
        this._map.removePanel(this);
      }
    }
  }

  /**
   * Este método elimina los controles del panel.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @public
   * @function
   * @param {array<M.Control>} controls Control.
   * @api
   */
  _removeControl(controlsParam) {
    const controls = this._map.controls(controlsParam);
    controls.forEach((control) => {
      const index = this._controls.indexOf(control);
      if (index !== -1) {
        this._controls.splice(index, 1);
      }
    });
  }

  /**
   * Este método elimina una clase en el panel.
   *
   * @public
   * @function
   * @param {String} className Nombre de la clase.
   * @api
   */
  removeClassName(className) {
    if (!isNullOrEmpty(this._element)) {
      this._element.classList.remove(className);
    } else {
      this._className = this._className.replace(new RegExp(`s* ${className} s*`), '');
    }
  }

  /**
   * Este método añade una clase al panel.
   *
   * @public
   * @function
   * @param {String} className Nombre de la clase.
   * @api
   */
  addClassName(className) {
    if (!isNullOrEmpty(this._element)) {
      this._element.classList.add(className);
    } else {
      this._className = this._className.concat(' ').concat(className);
    }
  }

  /**
   * Este método modifica la vista del control.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @public
   * @function
   * @param {array<M.Control>} controls Control.
   * @api
   */
  _moveControlView(control) {
    const controlElem = control.getElement();
    if (!isNullOrEmpty(this._controlsContainer)) {
      this._controlsContainer.appendChild(controlElem);
    }
    control.fire(EventType.ADDED_TO_PANEL);
  }

  /**
   * Este método maneja la activación del botón.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @public
   * @function
   * @param {array<M.Control>} controls Control.
   * @api
   */
  _manageActivation(control) {
    if (this._multiActivation !== true) {
      this._controls.forEach((panelControl) => {
        if (!panelControl.equals(control) && panelControl.activated) {
          panelControl.deactivate();
        }
      });
    }
  }

  /**
   * Este método devuelve verdadero si es igual,
   * falso si no.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @public
   * @function
   * @param {Object} Objeto Objeto.
   * @api
   */
  equals(obj) {
    let equals = false;
    if (obj instanceof Panel) {
      equals = (obj.name === this.name);
    }
    return equals;
  }

  /**
   * Este método devuelve la plantilla.
   *
   * @public
   * @function
   * @api
   * @returns {HTMLElement} Plantilla.
   */
  getTemplatePanel() {
    return this._element;
  }

  /**
   * Este método devuelve el botón del panel.
   *
   * @public
   * @function
   * @api
   * @returns {HTMLElement} Elemento botón.
   */
  getButtonPanel() {
    return this._buttonPanel;
  }

  /**
   * Este método devuelve verdadero si el
   * panel esta colapsado.
   *
   * @public
   * @function
   * @api
   * @returns {Boolean} Devuelve verdadero si el
   * panel esta colapsado.
   */
  isCollapsed() {
    return this._collapsed;
  }

  /**
   * Este método devuelve el contenedor.
   *
   * @public
   * @function
   * @api
   * @returns {HTMLElement} Contenedor.
   */
  getControlsContainer() {
    return this._controlsContainer;
  }
}

export default Panel;
