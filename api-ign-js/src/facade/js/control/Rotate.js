/**
 * @module M/control/Rotate
 */
import 'assets/css/controls/rotate';
import RotateImpl from 'impl/control/Rotate';
import template from 'templates/rotate';
import myhelp from 'templates/rotatehelp';
import ControlBase from './Control';
import { compileSync as compileTemplate } from '../util/Template';
import { isUndefined } from '../util/Utils';
import Exception from '../exception/exception';
import { getValue } from '../i18n/language';

/**
 * @classdesc
 * Agrega la funcionalidad para rotar el mapa para que el norte esté arriba.
 *
 * @api
 * @extends {M.Control}
 */
class Rotate extends ControlBase {
  /**
   * Constructor principal de la clase.
   *
   * @constructor
   * @param {String} format Formato de respuesta.
   * @api
   */
  constructor() {
    if (isUndefined(RotateImpl)) {
      Exception('La implementación usada no puede crear controles Rotate');
    }

    // implementation of this control
    const impl = new RotateImpl();

    // calls the super constructor
    super(impl, Rotate.NAME);
  }

  /**
   * Este método crea la vista del mapa especificado.
   *
   * @public
   * @function
   * @param {M.Map} map Añade el control al mapa.
   * @returns {Promise} HTML generado, promesa.
   * @api
   */
  createView(map) {
    return compileTemplate(template, {
      vars: {
        title: getValue('rotate').title,
      },
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
    const textHelp = getValue('rotate').textHelp;
    return {
      title: Rotate.NAME,
      content: new Promise((success) => {
        const html = compileTemplate(myhelp, {
          vars: {
            urlImages: `${M.config.MAPEA_URL}assets/images`,
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

  /**
   * Este método comprueba si un objeto es igual
   * a este control.
   *
   * @function
   * @param {Object} obj Objeto a comparar.
   * @returns {Boolean} Verdadero es igual, falso si no.
   * @api
   */
  equals(obj) {
    const equals = (obj instanceof Rotate);
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
Rotate.NAME = 'rotate';

export default Rotate;
