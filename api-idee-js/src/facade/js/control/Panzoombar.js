/**
 * @module M/control/Panzoombar
 */
import panzoombarTemplate from 'templates/panzoombar';
import myhelp from 'templates/panzoombarhelp';
import PanzoombarImpl from 'impl/control/Panzoombar';
import ControlBase from './Control';
import { isUndefined, isNullOrEmpty, isObject } from '../util/Utils';
import Exception from '../exception/exception';
import { compileSync as compileTemplate } from '../util/Template';
import { getValue } from '../i18n/language';

/**
 * @classdesc
 * Añade una barra de desplazamiento para acercar/alejar el mapa.
 *
 * @api
 * @extends {M.Control}
 */
class Panzoombar extends ControlBase {
  /**
   * Constructor principal de la clase.
   *
   * @constructor
   * @param {Object} vendorOptions Opciones de proveedor para la biblioteca base, estas opciones
   * se pasarán en formato objeto. Opciones disponibles:
   * - className: Nombre de la clase CSS.
   * - duration: Duración de la animación en milisegundos.
   * - render: Función llamada cuando se debe volver
   * a representar el control.
   * Esto se llama en una devolución de llamada de requestAnimationFrame.
   * @api
   */
  constructor(vendorOptions = {}) {
    if (isUndefined(PanzoombarImpl) || (isObject(PanzoombarImpl)
      && isNullOrEmpty(Object.keys(PanzoombarImpl)))) {
      Exception(getValue('exception').panzoombar_method);
    }

    // implementation of this control
    const impl = new PanzoombarImpl(vendorOptions);

    // calls the super constructor
    super(impl, Panzoombar.NAME);
  }

  /**
   * Esta función crea la vista del mapa especificado.
   *
   * @public
   * @function
   * @param {M.Map} map Mapa
   * @returns {Promise} Plantilla HTML.
   * @api
   */
  createView(map) {
    return compileTemplate(panzoombarTemplate);
  }

  /**
   * Obtiene la ayuda del control
   *
   * @function
   * @public
   * @api
  */
  getHelp() {
    const textHelp = getValue('panzoombar').textHelp;
    return {
      title: Panzoombar.NAME,
      content: new Promise((success) => {
        const html = compileTemplate(myhelp, {
          vars: {
            urlImages: `${M.config.API_IDEE_URL}assets/images`,
            translations: {
              help1: textHelp.text1,
            },
          },
        });
        success(html);
      }),
    };
  }

  /**
   * Esta función comprueba si un objeto es igual
   * a este control.
   *
   * @public
   * @function
   * @param {*} obj Objeto a comparar.
   * @returns {boolean} Iguales devuelve verdadero, falso si no son iguales.
   * @api
   */
  equals(obj) {
    const equals = (obj instanceof Panzoombar);
    return equals;
  }
}

/**
 * Nombre para identificar este control.
 * @const
 * @type {string}
 * @public
 * @api
 */
Panzoombar.NAME = 'panzoombar';

export default Panzoombar;
