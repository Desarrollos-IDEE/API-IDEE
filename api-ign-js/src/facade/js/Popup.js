/**
 * @module M/Popup
 */
import PopupImpl from 'impl/Popup';

import 'assets/css/popup';
import popupTemplate from 'templates/popup';
import {
  isUndefined, isNullOrEmpty, returnPositionHtmlElement, transfomContent,
} from './util/Utils';
import Base from './Base';
import { compileSync as compileTemplate } from './util/Template';
import * as EventType from './event/eventtype';
import MWindow from './util/Window';

/**
 * @classdesc
 * Crea una ventana
 * con parámetros especificados por el usuario.
 */
class Tab {
  /**
   * Constructor principal de la clase.
   * @constructor
   */
  constructor(options = {}) {
    /**
     * Icono.
     * @public
     * @type {String}
     */
    this.icon = options.icon;

    /**
     * Títulos.
     * @public
     * @type {String}
     */
    this.title = options.title;

    /**
     * Contenedor.
     * @public
     * @type {String}
     */
    this.content = options.content;

    const intelligence = isUndefined(options.intelligence)
      ? M.config.POPUP_INTELLIGENCE : options.intelligence;

    if (typeof intelligence === 'boolean' && intelligence) {
      this.content = transfomContent(this.content);
    }

    if (typeof intelligence === 'object' && intelligence.activate) {
      this.content = transfomContent(this.content, intelligence.sizes);
    }

    /**
     * Eventos.
     * @public
     * @type {Array<object>}
     */
    this.listeners = options.listeners || [];
  }
}

/**
 * @classdesc
 * Crea un "popup"
 * con parámetros especificados por el usuario.
 * @api
 */
class Popup extends Base {
  /**
   * Constructor principal de la clase.
   *
   * @constructor
   * @extends {M.facade.Base}
   * @api
   */
  constructor(options) {
    const impl = new PopupImpl(options);

    // calls the super constructor
    super(impl);

    /**
     * Coordenadas.
     * @private
     * @type {Array<Number>}
     */
    this.coord_ = null;

    /**
     * Ventanas.
     * @private
     * @type {Array<Popup.Tab>}
     */
    this.tabs_ = [];

    /**
     * Elementos de la ventana.
     * @private
     * @type {HTMLElement}
     */
    this.element_ = null;

    /**
     * Estatus de la ventana.
     * @private
     * @type {string}
     */
    this.status_ = Popup.status.COLLAPSED;
  }

  /**
   * Devuelve la ventana.
   * @public
   * @function
   * @api
   */
  getTabs() {
    return this.tabs_;
  }

  /**
   * Elimina la ventana.
   * @public
   * @function
   * @api
   */
  removeTab(tabToRemove) {
    this.tabs_ = this.tabs_.filter((tab) => tab.content !== tabToRemove.content);
    this.update();
  }

  /**
   * Añade la ventana.
   * @public
   * @function
   * @api
   */
  addTab(tabOptions) {
    let tab = tabOptions;
    if (!(tab instanceof Tab)) {
      tab = new Tab(tabOptions);
    }
    this.tabs_.push(tab);
    this.update();
  }

  /**
   * Añade el "popup" al mapa.
   * @public
   * @function
   * @api
   */
  addTo(map, coordinate) {
    this.map_ = map;
    if (isNullOrEmpty(this.element_)) {
      const html = compileTemplate(popupTemplate, {
        jsonp: true,
        vars: {
          tabs: this.tabs_,
        },
      });
      if (this.tabs_.length > 0) {
        this.element_ = html;
        this.addEvents(html);
        this.getImpl().addTo(map, html);
        this.show(coordinate);
      }
    } else {
      this.getImpl().addTo(map, this.element_);
      this.show(coordinate);
    }

    if (/Mobi|Android/i.test(window.navigator.userAgent) || MWindow.WIDTH <= M.config.MOBILE_WIDTH) {
      M.config.MOVE_MAP_EXTRACT = false;
    }

    if (M.config.MOVE_MAP_EXTRACT) {
      this.map_.getMapImpl()
        .getView()
        .animate({ zoom: this.map_.getZoom(), center: returnPositionHtmlElement('m-popup', this.map_), duration: 1000 });
    }
  }

  /**
   * Actualiza la ventana.
   * @public
   * @function
   * @api
   */
  update() {
    if (!isNullOrEmpty(this.map_)) {
      const html = compileTemplate(popupTemplate, {
        jsonp: true,
        vars: {
          tabs: this.tabs_,
        },
      });
      if (this.tabs_.length > 0) {
        this.element_ = html;
        this.addEventTabs(this.tabs_[0], html);
        this.addEvents(html);
        this.getImpl().setContainer(html);
        this.show(this.coord_);
      }
    }
  }

  /**
   * Muestra la ventana.
   * @public
   * @function
   * @api
   */
  show(coord) {
    this.coord_ = coord;
    this.getImpl().show(this.coord_, () => {
      this.fire(EventType.SHOW);
    });
  }

  /**
   * Oculta la ventana.
   * @public
   * @function
   * @api
   */
  hide(evt) {
    if (!isNullOrEmpty(evt)) {
      evt.preventDefault();
    }
    this.getImpl().hide();
  }

  /**
   * Este método se utiliza para moverse entre ventanas.
   * @public
   * @function
   * @api
   */
  switchTab(index) {
    if (this.tabs_.length > index) {
      const tab = this.tabs_[index];
      this.setContent_(tab.content);
      this.addEventTabs(tab, this.getContent());
      this.show(this.coord_);
    }
  }

  /**
   * Este método añade eventos a la ventana.
   *
   * @function
   * @public
   * @api
   */
  addEventTabs(tab, html) {
    const { listeners } = tab;
    listeners.forEach((listener) => {
      if (listener.all === true) {
        html.querySelectorAll(listener.selector).forEach((element) => {
          element.addEventListener(listener.type, (e) => listener.callback(e));
        });
      } else {
        html.querySelector(listener.selector)
          .addEventListener(listener.type, (e) => listener.callback(e));
      }
    });
  }

  /**
   * Modifica el contenedor del "popup".
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @public
   * @function
   */
  setContent_(content) {
    this.getContent().innerHTML = content;
  }

  /**
   * Devuelve el contenedor del "popup".
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @public
   * @function
   * @api
   * @return {HTMLElement} Contenedor del "popup".
   */
  getContent() {
    return this.getImpl().getContent();
  }

  /**
   * Añade los eventos al "popup".
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @public
   * @function
   * @api
   * @param {HTMLElement} htmlParam Contenedor del "popup".
   */
  addEvents(htmlParam) {
    const html = htmlParam;
    html.addEventListener('pointermove', (evt) => { evt.stopImmediatePropagation(); evt.preventDefault(); });
    // adds tabs events
    let touchstartY;
    const tabs = html.querySelectorAll('div.m-tab');
    Array.prototype.forEach.call(tabs, (tab) => {
      tab.addEventListener('click', (evt) => {
        evt.preventDefault();
        // 5px tolerance does not exist in click, only in touch
        // const touchendY = evt.clientY;
        // if ((evt.type === 'click') || (Math.abs(touchstartY - touchendY) < 5)) {
        // remove m-activated from all tabs
        Array.prototype.forEach.call(tabs, (addedTab) => {
          addedTab.classList.remove('m-activated');
        });
        tab.classList.add('m-activated');
        const index = tab.getAttribute('data-index');
        this.switchTab(index);
        // }
      });

      tab.addEventListener('touchend', (evt) => {
        evt.preventDefault();
        const touchendY = evt.changedTouches ? evt.changedTouches[0].clientY : evt.clientY;
        const auxCalc = Math.abs(touchstartY - touchendY);
        if (Number.isNaN(auxCalc) || auxCalc < 5) { // 5px tolerance
          // remove m-activated from all tabs
          Array.prototype.forEach.call(tabs, (addedTab) => {
            addedTab.classList.remove('m-activated');
          });
          tab.classList.add('m-activated');
          const index = tab.getAttribute('data-index');
          this.switchTab(index);
        }
      });
    });

    // adds close event
    const closeBtn = html.querySelector('a.m-popup-closer');
    closeBtn.addEventListener('click', this.hide.bind(this), false);
    closeBtn.addEventListener('touchend', this.hide.bind(this), false);
    // mobile events
    let headerElement = html.querySelector('div.m-tabs');
    if (isNullOrEmpty(headerElement)) {
      headerElement = html.querySelector('div.m-content > div.m-header');
    }
    if (!isNullOrEmpty(headerElement)) {
      let topPosition;
      headerElement.addEventListener('touchstart', (evt) => {
        evt.preventDefault();
        touchstartY = evt.touches[0].clientY;
        if (html.style.top) { // El caso de mover en default o menos de 10% de pantalla
          topPosition = Number.parseFloat(html.style.top);
        } else if (this.status_ === Popup.status.COLLAPSED) {
          topPosition = Math.ceil(0.9 * MWindow.HEIGHT);
        } else if (this.status_ === Popup.status.DEFAULT) {
          topPosition = Math.floor(0.45 * MWindow.HEIGHT);
        } else if (this.status_ === Popup.status.FULL) {
          topPosition = 0;
        }
        html.classList.add('m-no-animation');
      }, false);

      headerElement.addEventListener('touchmove', (evt) => {
        evt.preventDefault();
        this.touchY = evt.touches ? evt.touches[0].clientY : evt.clientY;
        const translatedPixels = this.touchY - touchstartY;
        html.style.top = `${topPosition + translatedPixels}px`;
      }, false);

      headerElement.addEventListener('touchend', (evt) => {
        evt.preventDefault();
        this.manageCollapsiblePopup_(touchstartY, this.touchY);
        this.touchY = undefined;
      }, false);

      const mediaQuery = window.matchMedia('(max-width: 768px)');
      setTimeout(() => this.manageTransform(mediaQuery, html), 10);
      mediaQuery.addEventListener('change', (e) => {
        this.manageTransform(e, html);
      });

      // CLICK EVENTS
      headerElement.addEventListener('mouseup', (evt) => {
        evt.preventDefault();

        // COLLAPSED --> DEFAULT
        if (this.tabs_.length <= 1
          || (this.status_ === Popup.status.COLLAPSED || evt.target.classList.contains('m-activated') || evt.target.parentElement.classList.contains('m-activated'))) {
          if (this.status_ === Popup.status.COLLAPSED) {
            this.setStatus_(Popup.status.DEFAULT);
          } else if (this.status_ === Popup.status.DEFAULT) {
            // DEFAULT --> FULL
            this.setStatus_(Popup.status.FULL);
          } else {
            this.setStatus_(Popup.status.COLLAPSED);
          }
        }
      });
    }
  }

  /**
   * Modifija el estado del "popup".
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @public
   * @function
   * @api
   * @param {string} status Estado del "popup".
   */
  setStatus_(status) {
    if (status !== this.status_) {
      this.element_.classList.remove(this.status_);
      this.status_ = status;
      this.element_.classList.add(this.status_);
      this.element_.style.top = '';
      this.element_.classList.remove('m-no-animation');
      // mobile center
      if (MWindow.WIDTH <= M.config.MOBILE_WIDTH) {
        this.getImpl().centerByStatus(status, this.coord_);
      }
    }
  }

  /**
   * Maneja el html del "popup".
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @public
   * @function
   * @api
   * @param {HTMLElement} html Contenedor del "popup".
   * @param {Event} e Evento.
   */
  manageTransform(e, html) {
    if (html && html.parentElement) {
      if (e.matches) {
        html.parentElement.classList.add('unsetTransform');
      } else {
        html.parentElement.classList.remove('unsetTransform');
      }
    }
  }

  /**
   * Maneja el tamaño del "popup".
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @public
   * @function
   * @api
   * @param {number} touchstartY Posición inicial del dedo.
   * @param {number} touchendY Posición final del dedo.
   */
  manageCollapsiblePopup_(touchstartY, touchendY) {
    const touchPerc = (touchendY * 100) / MWindow.HEIGHT;
    const distanceTouch = Math.abs(touchstartY - touchendY);
    const distanceTouchPerc = (distanceTouch * 100) / MWindow.HEIGHT;
    // 10% tolerance, (permits repeated movement of less than specified, looks wrong)
    if (distanceTouchPerc > 10) {
      /*
       * manages collapsing events depending on
       * the current position of the popup header and the direction
       *
       * These are the thresholds:
       *  _____________     ____________
       * |     0%      |       FULL
       * |-------------|
       * |             |
       * |     45%     |
       * |             | 2
       * |-------------|   ------------
       * |             | 1      DEFAULT
       * |             |
       * |             |
       * |-------------|   ------------
       * |     85%     |      COLLAPSED
       * |_____________|
       *
       */
      if (this.status_ === Popup.status.COLLAPSED) {
        // 2
        if (touchPerc < 45) {
          this.setStatus_(Popup.status.FULL);
        } else if (touchPerc < 85) {
          // 1
          this.setStatus_(Popup.status.DEFAULT);
        } else {
          this.setStatus_(Popup.status.COLLAPSED);
        }
      } else if (this.status_ === Popup.status.DEFAULT) {
        // 1
        if (touchPerc > 45) {
          this.setStatus_(Popup.status.COLLAPSED);
        } else if (touchPerc < 45) {
          // 2
          this.setStatus_(Popup.status.FULL);
        } else {
          this.setStatus_(Popup.status.DEFAULT);
        }
      } else if (this.status_ === Popup.status.FULL) {
        // 1
        if (touchPerc > 45) {
          this.setStatus_(Popup.status.COLLAPSED);
        } else if (touchPerc > 0) {
          // 2
          this.setStatus_(Popup.status.DEFAULT);
        } else {
          this.setStatus_(Popup.status.FULL);
        }
      }
    } else {
      this.setStatus_(this.status_);
    }
  }

  /**
   * Devuelve las coordenadas del "popup".
   * @public
   * @function
   * @api
   */
  getCoordinate() {
    return this.coord_;
  }

  /**
   * Modifica las coordenadas del "popup".
   * @public
   * @function
   * @api
   */
  setCoordinate(coord) {
    this.coord_ = coord;
    if (!isNullOrEmpty(this.element_)) {
      this.getImpl().show(coord);
    }
  }

  /**
   * Elimina el "popup".
   * @public
   * @function
   * @api
   */
  destroy() {
    this.tabs_.length = 0;
    this.coord_ = null;
    this.fire(EventType.DESTROY);
  }
}

/**
 * Estado del "popup".
 * @const
 * @type {object}
 * @public
 * @api
 */
Popup.status = {};

/**
 * Estado colapsado del "popup".
 * @const
 * @type {string}
 * @public
 * @api
 */
Popup.status.COLLAPSED = 'm-collapsed';

/**
 * Estado del "popup" por defecto.
 * @const
 * @type {string}
 * @public
 * @api
 */
Popup.status.DEFAULT = 'm-default';

/**
 * Estado completo del "popup".
 * @const
 * @type {string}
 * @public
 * @api
 */
Popup.status.FULL = 'm-full';

export default Popup;
