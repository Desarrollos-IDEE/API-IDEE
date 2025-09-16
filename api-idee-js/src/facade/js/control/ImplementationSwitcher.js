/**
 * @module IDEE/control/ImplementationSwitcher
 */
import 'assets/css/controls/implementationswitcher';
import ImplementationSwitcherImpl from 'impl/control/ImplementationSwitcher';
import template from 'templates/implementationswitcher';
import myhelp from 'templates/implementationswitcherhelp';
import { transform } from 'ol/proj';
import ControlBase from './Control';
import { compileSync as compileTemplate } from '../util/Template';
import Exception from '../exception/exception';
import { getValue } from '../i18n/language';
import { isUndefined, isNullOrEmpty, isObject } from '../util/Utils';

/**
 * @classdesc
 * Agrega la herramienta de cambio de implementación.
 *
 * @api
 * @extends {IDEE.Control}
 */
class ImplementationSwitcher extends ControlBase {
  constructor() {
    if (isUndefined(ImplementationSwitcherImpl) || (isObject(ImplementationSwitcherImpl)
        && isNullOrEmpty(Object.keys(ImplementationSwitcherImpl)))) {
      Exception(getValue('exception').implementationswitcher_method);
    }

    super(new ImplementationSwitcherImpl(), ImplementationSwitcher.NAME);

    if (!window.implementations) {
      window.implementations = IDEE.config.implementationswitcher;

      if (window.implementations?.length > 0) {
        window.implementations[0].selected = true;

        window.implementations = window.implementations.map((impl) => ({
          ...impl,
          epsg: impl.type === 'cesium' ? 'EPSG:4979' : impl.epsg,
        }));
      }
    }
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
  createView() {
    return new Promise((resolve) => {
      this.html = compileTemplate(template, {
        vars: {
          title: getValue('implementationswitcher').title,
          description: getValue('implementationswitcher').description,
          implementations: window.implementations,
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
        this.loadImplementation(window.implementations[e.target.selectedIndex]);
      });
    });
  }

  /**
   * Carga la implementación seleccionada
   *
   * @function
   * @public
   * @api
   */
  loadImplementation(implementation) {
    const API_IDEE_URL = IDEE.config.API_IDEE_URL;

    window.implementations.forEach((impl) => {
      // eslint-disable-next-line no-param-reassign
      delete impl.selected;

      const scripts = Array.from(document.querySelectorAll('script'))
        .filter((script) => script.src === `${API_IDEE_URL}${impl.js}`);

      if (scripts.length > 0) {
        scripts[0].remove();
      }

      const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
        .filter((style) => style.href === `${API_IDEE_URL}${impl.css}`);

      if (styles.length > 0) {
        styles[0].remove();
      }
    });

    // eslint-disable-next-line no-param-reassign
    implementation.selected = true;

    const configurations = Array.from(document.querySelectorAll('script'))
      .filter((configuration) => configuration.src === `${API_IDEE_URL}js/configuration.js`);

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = `${API_IDEE_URL}${implementation.js}`;
    script.onload = () => {
      if (configurations.length > 0) {
        fetch(`${API_IDEE_URL}js/configuration.js`)
          .then((response) => response.text())
          .then((scriptContent) => {
            // eslint-disable-next-line no-eval
            eval(scriptContent);

            this.loadMap(implementation);
          });
      } else {
        this.loadMap(implementation);
      }
    };
    document.body.appendChild(script);

    const style = document.createElement('link');
    style.type = 'text/css';
    style.href = `${API_IDEE_URL}${implementation.css}`;
    style.rel = 'stylesheet';
    document.head.appendChild(style);
  }

  loadMap(implementation) {
    const div = this.map_.getContainer().id === ''
      ? this.map_.getContainer().parentElement.parentElement : this.map_.getContainer();
    div.innerHTML = '';

    const center = [this.map_.getCenter().x, this.map_.getCenter().y];
    const sourceProjection = this.map_.getProjection().code;
    const destProjection = implementation.epsg;

    IDEE.map({
      container: div.id,
      zoom: this.map_.getZoom(),
      center: (typeof ol !== 'undefined' && ol !== null)
        ? ol.proj.transform(center, sourceProjection, destProjection)
        : transform(center, sourceProjection, destProjection),
      controls: Array.from(this.map_.getControls()).map((control) => control.name),
      plugins: this.map_.getPlugins(),
      layers: this.map_.getLayers(),
    });
  }

  /**
   * Obtiene la ayuda del control
   *
   * @function
   * @public
   * @api
  */
  getHelp() {
    const textHelp = getValue('implementationswitcher').textHelp;
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

export default ImplementationSwitcher;
