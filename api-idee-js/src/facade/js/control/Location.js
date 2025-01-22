/**
 * @module IDEE/control/Location
 */
import LocationImpl from 'impl/control/Location';
import locationTemplate from 'templates/location';
import myhelp from 'templates/locationhelp';
import 'assets/css/controls/location';
import { getValue } from '../i18n/language';
import ControlBase from './Control';
import { isUndefined, isNullOrEmpty, isObject } from '../util/Utils';
import Exception from '../exception/exception';
import { compileSync as compileTemplate } from '../util/Template';

/**
 * @classdesc
 * Localiza la posición del usuario en el mapa.
 *
 * @api
 * @extends {IDEE.Control}
 */
class Location extends ControlBase {
  /**
   * Constructor principal de la clase. Crea una ubicación
   * que permite al usuario localizar y dibujar su
   * posición en el mapa.
   *
   * @constructor
   * @param {Boolean} tracking Seguimiento de localización, por defecto verdadero.
   * @param {Boolean} highAccuracy Alta precisión del rastreo, por defecto falso.
   * @param {Object} vendorOptions  Opciones de proveedor para la biblioteca base,
   * por defecto objeto vacío. Estos valores no son "settable".
   * @api
   */
  constructor(tracking = true, highAccuracy = false, vendorOptions = {}) {
    if (isUndefined(LocationImpl) || (isObject(LocationImpl)
      && isNullOrEmpty(Object.keys(LocationImpl)))) {
      Exception(getValue('exception').location_method);
    }

    // implementation of this control
    const impl = new LocationImpl(tracking, highAccuracy, 60000, vendorOptions);

    // calls the super constructor
    super(impl, Location.NAME);
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
    return compileTemplate(locationTemplate, {
      vars: {
        title: getValue('location').title,
      },
    });
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
    return element.querySelector('button#m-location-button');
  }

  /**
   * Obtiene la ayuda del control
   *
   * @function
   * @public
   * @api
  */
  getHelp() {
    const textHelp = getValue('location').textHelp;
    return {
      title: Location.NAME,
      content: new Promise((success) => {
        const html = compileTemplate(myhelp, {
          vars: {
            urlImages: `${IDEE.config.API_IDEE_URL}assets/images`,
            translations: {
              help1: textHelp.text1,
              help2: textHelp.text2,
              help3: textHelp.text2,
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
    const equals = (obj instanceof Location);
    return equals;
  }

  /**
   * Sobrescribe el seguimiento de la localización.
   * @param {Object} tracking Seguimiento de la localización.
   * @public
   * @function
   * @api
   */
  setTracking(tracking) {
    this.getImpl().tracking = tracking;
  }
}

/**
 * Nombre para identificar este control.
 * @const
 * @type {string}
 * @public
 * @api
 */
Location.NAME = 'location';

export default Location;
