/**
 * @module IDEE/control/ImplementationSwitcher
 */
import 'assets/css/controls/implementationswitcher';
import ImplementationSwitcherImpl from 'impl/control/ImplementationSwitcher';
import template from 'templates/implementationswitcher';
import myhelp from 'templates/implementationswitcherhelp';
import ControlBase from './Control';
import { compileSync as compileTemplate } from '../util/Template';
import Exception from '../exception/exception';
import { getValue } from '../i18n/language';
import {
  isUndefined, isNullOrEmpty, isObject,
  isBoolean,
} from '../util/Utils';
import * as Dialog from '../dialog';
import { getRegistry, captureState, restoreState } from '../util/ImplementationState';
import {
  activateImplementation,
  getImplementations,
  loadPlugins,
  toggleStylesheets,
} from '../util/ImplementationLoader';

/**
 * Evento de `window` que avisa del mapa nuevo tras cambiar de implementación.
 * `event.detail`: { map, implementation, previous }.
 * @const
 * @type {string}
 */
const CHANGE_EVENT = 'idee:implementationchange';

/**
 * @typedef {Object} module:IDEE/control/ImplementationSwitcher~Options
 * @api
 * @property {String} [position] Posición del control en el mapa.
 * @property {Boolean} [collapsible] Indica si el control es colapsable.
 * @property {Boolean} [collapsed] Indica si el control está colapsado.
 * @property {String} [tooltip] Texto del tooltip.
 * @property {Number} [order] Accesibilidad, z-index.
 * @property {Object} [vendorOptions] Opciones específicas para la implementación.
 */

/**
 * @classdesc
 * Agrega la herramienta de cambio de implementación (p. ej. OpenLayers ⇄ Cesium).
 *
 * Como ol-cesium, cada núcleo se carga una sola vez y se conserva: al volver a una
 * implementación no se recarga nada. En cada cambio se guarda un estado del mapa
 * independiente de la implementación (vista, capas, grupos, secciones, controles, plugins
 * con sus opciones, configuración e idioma) y se recrea el mapa con el núcleo de destino.
 * Lo que el destino no admite se conserva y se recupera al volver.
 *
 * Las implementaciones disponibles salen de `IDEE.config.implementationswitcher`:
 * `[{ id, type, title, js, css, plugins: { <nombre>: { js, css } } }]`. Sin `plugins`, los
 * ficheros de cada plugin se buscan en `${API_IDEE_URL}plugins/<nombre>/<nombre>.<type>.min.js`.
 *
 * Tras el cambio se lanza en `window` el evento `idee:implementationchange` con el mapa nuevo.
 *
 * @property {Boolean} [collapsible=true] Indica si el control es colapsable.
 * @property {Boolean} [collapsed=true] Indica si el control está colapsado.
 *
 * @api
 * @extends {IDEE.Control}
 */
class ImplementationSwitcher extends ControlBase {
  /**
   * Constructor principal de la clase.
   *
   * @constructor
   * @param {module:IDEE/control/ImplementationSwitcher~Options} options Opciones de configuración
   * para el control de fachada.
   * @example
   * const control = new IDEE.control.ImplementationSwitcher({
   *   position: 'left',
   *   tooltip: 'Cambiar implementación',
   *   order: 1,
   *   collapsible: true,
   * });
   * @api
   */
  constructor(options = {}) {
    if (isUndefined(ImplementationSwitcherImpl) || (isObject(ImplementationSwitcherImpl)
      && isNullOrEmpty(Object.keys(ImplementationSwitcherImpl)))) {
      Exception(getValue('exception').implementationswitcher_method);
    }

    const implementationSwitcherImpl = new ImplementationSwitcherImpl();

    super(ImplementationSwitcher.NAME, implementationSwitcherImpl, options);

    this.collapsible = isBoolean(options.collapsible) ? options.collapsible : true;

    this.collapsed = isBoolean(options.collapsed) ? options.collapsed : this.collapsible;

    this.switching_ = false;
  }

  /**
   * Implementaciones configuradas, marcando la del mapa actual.
   *
   * @public
   * @function
   * @param {IDEE.Map} map Mapa actual.
   * @returns {Array<Object>} Implementaciones.
   * @api
   */
  getImplementations(map) {
    const current = map ? map.getImplementation() : undefined;
    return getImplementations().map((implementation) => ({
      ...implementation,
      selected: implementation.type === current,
    }));
  }

  /**
   * Este método crea la vista del mapa especificado.
   *
   * @public
   * @function
   * @param {IDEE.Map} map Añade el control al mapa.
   * @returns {Promise} HTML generado, promesa.
   * @api
   */
  createView(map) {
    return new Promise((resolve) => {
      this.html = compileTemplate(template, {
        vars: {
          title: this.tooltip ?? getValue(ImplementationSwitcher.NAME).title,
          description: getValue(ImplementationSwitcher.NAME).description,
          implementations: this.getImplementations(map),
        },
      });

      this.listen(this.html);

      resolve(this.html);
    });
  }

  /**
   * Esta función agrega el detector de eventos en el desplegable de implementaciones.
   * @param {HTMLElement} html Elemento desplegable.
   * @function
   * @public
   * @api
   */
  listen(html) {
    html.querySelectorAll('select#m-implementationswitcher-select').forEach((element) => {
      element.addEventListener('change', (e) => {
        const implementation = this.getImplementations(this.map)[e.target.selectedIndex];
        this.switchTo(implementation).catch((error) => {
          // eslint-disable-next-line no-console
          console.error(error);
        });
      });
    });
  }

  /**
   * Cambia el mapa a otra implementación conservando su estado.
   *
   * @public
   * @function
   * @param {Object} implementation Entrada de `IDEE.config.implementationswitcher`.
   * @returns {Promise<IDEE.Map>} Mapa nuevo (el actual si no hay cambio).
   * @api
   */
  async switchTo(implementation) {
    const map = this.map;
    const previous = map.getImplementation();
    if (isNullOrEmpty(implementation) || implementation.type === previous || this.switching_) {
      return map;
    }
    this.switching_ = true;

    const registry = getRegistry();
    const source = window.IDEE;
    const message = `${getValue(ImplementationSwitcher.NAME).load_error} ${implementation.title || implementation.type}`;
    const fail = (error) => {
      // eslint-disable-next-line no-console
      console.error(error);
      window.IDEE = source;
      toggleStylesheets(registry, previous);
      Dialog.error(message, getValue(ImplementationSwitcher.NAME).title);
    };

    let state;
    let target;
    try {
      state = captureState(map);
      target = await activateImplementation(implementation);
      await loadPlugins(implementation, state.plugins);
    } catch (error) {
      fail(error);
      this.resetSelect_(previous);
      this.switching_ = false;
      return map;
    }

    const container = map.getFrameContainer();
    try {
      map.removePlugins(map.getPlugins());
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn(error);
    }
    try {
      map.destroy();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn(error);
    }

    let newMap;
    try {
      // Código del núcleo de destino: crea el mapa con sus propias clases
      newMap = target.control.ImplementationSwitcher.restoreState(state, container);
    } catch (error) {
      // Sin mapa en destino: se recupera el de origen
      fail(error);
      newMap = ImplementationSwitcher.restoreState(state, container);
    }

    this.switching_ = false;
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT, {
      detail: { map: newMap, implementation: newMap.getImplementation(), previous },
    }));
    return newMap;
  }

  /** Vuelve a marcar en el desplegable la implementación actual. @private */
  resetSelect_(type) {
    const select = this.html && this.html.querySelector('select#m-implementationswitcher-select');
    const index = this.getImplementations(this.map).findIndex((impl) => impl.type === type);
    if (select && index >= 0) select.selectedIndex = index;
  }

  /**
   * Captura el estado del mapa independiente de la implementación.
   *
   * @public
   * @function
   * @param {IDEE.Map} map Mapa.
   * @returns {Object} Estado.
   * @api
   */
  static captureState(map) {
    return captureState(map);
  }

  /**
   * Recrea un mapa a partir de un estado capturado, con el núcleo actual.
   *
   * @public
   * @function
   * @param {Object} state Estado capturado.
   * @param {HTMLElement} container Contenedor del mapa.
   * @returns {IDEE.Map} Mapa.
   * @api
   */
  static restoreState(state, container) {
    return restoreState(state, container);
  }

  /**
   * Obtiene la ayuda del control
   *
   * @function
   * @public
   * @api
  */
  getHelp() {
    const textHelp = getValue(ImplementationSwitcher.NAME).textHelp;
    return {
      title: ImplementationSwitcher.NAME,
      content: new Promise((success) => {
        const html = compileTemplate(myhelp, {
          vars: {
            urlImages: `${IDEE.config.STATIC_RESOURCES_URL}/imagenes/controles`,
            translations: {
              help1: textHelp.text1,
              help2: textHelp.text2,
            },
          },
        });
        success(html);
      }),
    };
  }

  equals(obj) {
    const equals = (obj instanceof ImplementationSwitcher);
    return equals;
  }
}

/**
 * Nombre del control.
 * @const
 * @type {string}
 * @public
 * @api
 */
ImplementationSwitcher.NAME = 'implementationswitcher';

/**
 * Evento de `window` que avisa del mapa nuevo tras cambiar de implementación.
 * @const
 * @type {string}
 * @public
 * @api
 */
ImplementationSwitcher.CHANGE_EVENT = CHANGE_EVENT;

export default ImplementationSwitcher;
