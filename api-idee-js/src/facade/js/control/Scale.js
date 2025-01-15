/**
 * @module M/control/Scale
 */
import 'assets/css/controls/scale';
import scaleTemplate from 'templates/scale';
import ScaleImpl from 'impl/control/Scale';
import myhelp from 'templates/scalehelp';
import ControlBase from './Control';
import { isUndefined, isNullOrEmpty, isObject } from '../util/Utils';
import Exception from '../exception/exception';
import { compileSync as compileTemplate } from '../util/Template';
import { getValue } from '../i18n/language';

/**
 * @classdesc
 * Agregar escala numérica.
 * @property {Number} order Orden que tendrá con respecto al
 * resto de plugins y controles por pantalla.
 *
 * @api
 * @extends {M.Control}
 */
class Scale extends ControlBase {
  /**
   * Constructor principal de la clase.
   *
   * @constructor
   * @param {Object} options Opciones del control.
   * - Order: Orden que tendrá con respecto al
   * resto de plugins y controles por pantalla.
   * - exactScale: Escala exacta.
   * @api
   */
  constructor(options = {}) {
    if (isUndefined(ScaleImpl) || (isObject(ScaleImpl) && isNullOrEmpty(Object.keys(ScaleImpl)))) {
      Exception(getValue('exception').scale_method);
    }

    // implementation of this control
    const impl = new ScaleImpl(options);

    // calls the super constructor
    super(impl, Scale.NAME);

    /**
     * Order: Orden que tendrá con respecto al
     * resto de plugins y controles por pantalla.
     */
    this.order = options.order;
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
    return compileTemplate(scaleTemplate, {
      vars: {
        title: getValue('scale').title,
        scale: getValue('scale').scale,
        level: getValue('scale').level,
        order: this.order,
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
    const textHelp = getValue('scale').textHelp;
    return {
      title: Scale.NAME,
      content: new Promise((success) => {
        const html = compileTemplate(myhelp, {
          vars: {
            urlImages: `${M.config.API_IDEE_URL}assets/images`,
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
    const equals = (obj instanceof Scale);
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
Scale.NAME = 'scale';

export default Scale;
