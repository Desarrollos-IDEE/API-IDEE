/**
 * @module M/control/GetFeatureInfo
 */
import 'assets/css/controls/getfeatureinfo';
import GetFeatureInfoImpl from 'impl/control/GetFeatureInfo';
import myhelp from 'templates/getfeatureinfohelp';
import ControlBase from './Control';
import { isUndefined } from '../util/Utils';
import Exception from '../exception/exception';
import { getValue } from '../i18n/language';
import { compileSync as compileTemplate } from '../util/Template';

/**
 * @classdesc
 * Agrega la herramienta de consulta de información de capas
 * WMS y WMTS a través de su servicio getFeatureInfo.
 *
 * @api
 * @extends {M.Control}
 */
class GetFeatureInfo extends ControlBase {
  /**
   * Constructor principal de la clase.
   *
   * @constructor
   * @param {Boolean} activated Define si esta activo.
   * @param {object} options Opciones del control.
   * - featureCount. Número de objetos geográficos, por defecto 10.
   * - buffer. Configuración del "buffer", por defecto 5.
   * @api
   */
  constructor(activated, options = {}) {
    // implementation of this control
    const impl = new GetFeatureInfoImpl(activated, options);
    // calls the super constructor
    super(impl, GetFeatureInfo.NAME);

    if (isUndefined(GetFeatureInfoImpl)) {
      Exception(getValue('exception').getfeatureinfo_method);
    }
  }

  /**
   * Este método crea la vista del mapa especificado.
   *
   * @public
   * @function
   * @param {M.Map} map Mapa.
   * @returns {Promise} Plantilla HTML.
   * @api
   */
  createView(map) {
    return '';
  }

  /**
   * Este método devuelve si el botón de activación
   * del control esta activado.
   *
   * @public
   * @function
   * @param {HTMLElement} element HTML del botón.
   * @returns {HTMLElement} HTML del botón.
   * @api
   * @export
   */
  getActivationButton(element) {
    return null;
  }

  /**
   * Obtiene la ayuda del control
   *
   * @function
   * @public
   * @api
  */
  getHelp() {
    const textHelp = getValue('getfeatureinfo').textHelp;
    return {
      title: GetFeatureInfo.NAME,
      content: new Promise((success) => {
        const html = compileTemplate(myhelp, {
          vars: {
            urlImages: `${M.config.MAPEA_URL}assets/images`,
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
    let equals = false;
    if (obj instanceof GetFeatureInfo) {
      equals = (this.name === obj.name);
    }
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
GetFeatureInfo.NAME = 'getfeatureinfo';

export default GetFeatureInfo;
