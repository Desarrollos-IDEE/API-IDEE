/**
 * @module IDEE/Label
 */
import LabelImpl from 'impl/Label';
import Base from './Base';
import {
  isArray,
  isObject,
  isString,
} from './util/Utils';

/**
 * @classdesc
 * Crea una etiqueta, proporciona una ventana emergente con
 * información específica.
 *
 * @api
 * @extends {IDEE.facade.Base}
 */
class Label extends Base {
  /**
   * Constructor principal de la clase.
   *
   * @constructor
   * @param {String} text Texto a mostrar.
   * @param {Array} coordOpts Disparador de la ventana emergente.
   * @param {Boolean} panMapIfOutOfView Define si el mapa esta fuera de la vista.
   *
   * @api
   * @extends {IDEE.facade.Base}
   */
  constructor(text, coordOpts, panMapIfOutOfView) {
    // implementation of this control
    const impl = new LabelImpl(text, coordOpts, panMapIfOutOfView);

    // calls the super constructor
    super(impl);

    this.text = text;

    let coord;
    if (isString(coordOpts)) {
      coord = coordOpts.split(',');
    }
    if (isArray(coord) || isArray(coordOpts)) {
      coord = {
        x: coord && coord[0] ? coord[0] : coordOpts[0],
        y: coord && coord[1] ? coord[1] : coordOpts[1],
      };
    } else if (isObject(coordOpts)) {
      coord = coordOpts;
    }
    this.coord = coord;
  }

  /**
   * Este método elimina la ventana emergente.
   *
   * @public
   * @function
   * @api
   * @export
   */
  hide() {
    this.getImpl().hide();
  }

  /**
   * Este método muestra la ventana emergente.
   *
   * @public
   * @function
   * @param {IDEE.Map} map Fachada del objeto "map".
   * @param { Boolean } removePrevious - elimina labels anteriores.
   * @api
   * @export
   */
  show(map, removePrevious) {
    this.getImpl().show(map, removePrevious);
  }

  /**
   * Este método devuelve la ventana emergente creada.
   * @public
   * @function
   * @returns {IDEE.Popup} Ventana emergente creada.
   * @api
   * @export
   */
  getPopup() {
    return this.getImpl().getPopup();
  }

  /**
   * Este método devuelve las coordenadas.
   * @public
   * @function
   * @returns {Array} Devuelve las coordenadas.
   * @api
   */
  getCoordinate() {
    return this.getImpl().getCoordinate();
  }

  /**
   * Este método sobrescribe las coordenadas.
   * @public
   * @function
   * @param {Array} coord Coordenadas.
   * @api
   */
  setCoordinate(coord) {
    this.getImpl().setCoordinate(coord);
  }
}

/**
 * Nombre de la plantilla.
 * @const
 * @type {string}
 * @public
 * @api
 */
Label.POPUP_TEMPLATE = 'label_popup.html';

export default Label;
