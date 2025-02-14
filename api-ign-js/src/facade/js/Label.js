/**
 * @module M/Label
 */
import LabelImpl from 'impl/Label';
import Base from './Base';

/**
 * @classdesc
 * Crea una etiqueta, proporciona una ventana emergente con
 * información específica.
 *
 * @api
 * @extends {M.facade.Base}
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
   * @extends {M.facade.Base}
   */
  constructor(text, coordOpts, panMapIfOutOfView) {
    // implementation of this control
    const impl = new LabelImpl(text, coordOpts, panMapIfOutOfView);

    // calls the super constructor
    super(impl);
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
   * @param {M.Map} map Fachada del objeto "map".
   * @api
   * @export
   */
  show(map) {
    this.getImpl().show(map);
  }

  /**
   * Este método devuelve la ventana emergente creada.
   * @public
   * @function
   * @returns {M.Popup} Ventana emergente creada.
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
    this.getImpl().coordinate = coord;
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
