/**
 * @module IDEE/control/Panzoom
 */
import panzoomTemplate from 'templates/panzoom';
import myhelp from 'templates/panzoomhelp';
import PanzoomImpl from 'impl/control/Panzoom';
import ControlBase from './Control';
import { isUndefined, isNullOrEmpty, isObject } from '../util/Utils';
import Exception from '../exception/exception';
import { compileSync as compileTemplate } from '../util/Template';
import { getValue } from '../i18n/language';

/**
 * @classdesc
 * Agregue los botones '+' y '-' para acercar y alejar el mapa.
 *
 * @api
 * @extends {IDEE.Control}
 */
class Panzoom extends ControlBase {
  /**
   * Constructor principal de la clase.
   *
   * @constructor
   * @param {Object} vendorOptions Opciones de proveedor para la biblioteca base, estas opciones
   * se pasarán en formato objeto. Opciones disponibles:
   * - duration: Duración de la animación en milisegundos.
   * - className: Nombre de la clase CSS.
   * - zoomInClassName: Nombre de clase de CSS para el botón de acercamiento.
   * - zoomOutClassName: Nombre de clase de CSS para el botón de alejamiento.
   * - zoomInLabel: Etiqueta de texto que se usará para el botón de acercamiento.
   * - zoomOutLabel: Etiqueta de texto que se usará para el botón de alejamiento.
   * - zoomInTipLabel: Etiqueta de texto que se usará para la sugerencia del botón.
   * - zoomOutTipLabel: Etiqueta de texto que se usará para la sugerencia del botón.
   * - delta: El delta de zoom aplicado en cada clic.
   * - target: Especifique un objetivo si desea que el control se represente
   * fuera de la ventana gráfica del mapa.
   * @api
   */
  constructor(vendorOptions = {}) {
    if (isUndefined(PanzoomImpl) || (isObject(PanzoomImpl)
      && isNullOrEmpty(Object.keys(PanzoomImpl)))) {
      Exception(getValue('exception').panzoom_method);
    }

    // implementation of this control
    const impl = new PanzoomImpl(vendorOptions);

    // calls the super constructor
    super(impl, Panzoom.NAME);
  }

  /**
   * Esta función crea la vista del mapa especificado.
   *
   * @public
   * @function
   * @param {IDEE.Map} map Mapa
   * @returns {Promise} Plantilla HTML.
   * @api
   */
  createView(map) {
    return compileTemplate(panzoomTemplate);
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
    const equals = (obj instanceof Panzoom);
    return equals;
  }

  /**
   * Obtiene la ayuda del control
   *
   * @function
   * @public
   * @api
   */
  getHelp() {
    const textHelp = getValue('panzoom').textHelp;
    return {
      title: Panzoom.NAME,
      content: new Promise((success) => {
        const html = compileTemplate(myhelp, {
          vars: {
            urlImages: `${IDEE.config.API_IDEE_URL}assets/images`,
            translations: {
              help1: textHelp.text1,
            },
          },
        });
        success(html);
      }),
    };
  }
}

/**
 * Nombre para identificar este control.
 * @const
 * @type {string}
 * @public
 * @api
 */
Panzoom.NAME = 'panzoom';

export default Panzoom;
