/**
 * @module M/impl/Label
 */
import { compileSync as compileTemplate } from 'M/util/Template';
import FacadePopup from 'M/Popup';
import { isNullOrEmpty } from 'M/util/Utils';
import labelPopupTemplate from 'templates/label_popup';

/**
 * @classdesc
 * Implementación de la clase Label.
 *
 * @property {String} text_ Texto para mostrar.
 * @property {Array} coord_ Coordenadas donde mostrar el "popup".
 * @property {M.Popup} popup_ "Popup" para mostrar información.
 * @property {M.Map} facadeMap_ Mapa.
 * @property {Boolean} panMapIfOutOfView Indica si el mapa se desplaza o no.
 *
 * @api
 */
class Label {
  /**
   * Constructor principal de la clase. Crea un control Label.
   *
   * @constructor
   * @param {String} text Texto para mostrar.
   * @param {Array} coordOpts Coordenadas donde mostrar el "popup".
   * @param {Boolean} panMapIfOutOfView Indica si el mapa se desplaza o no.
   *
   * @api
   */
  constructor(text, coordOpts, panMapIfOutOfView) {
    /**
     * Texto para mostrar.
     * @private
     * @type {String}
     */
    this.text_ = text;

    /**
     * Coordenadas donde mostrar el "popup".
     * @private
     * @type {Array}
     */
    this.coord_ = [coordOpts.x, coordOpts.y];

    /**
     * "Popup" para mostrar información.
     * @private
     * @type {M.Popup}
     */
    this.popup_ = null;

    /**
     * Mapa.
     * @private
     * @type {M.Map}
     */
    this.facadeMap_ = null;

    /**
     * Indica si el mapa se desplaza o no.
     * @private
     * @type {Boolean}
     */
    this.panMapIfOutOfView = panMapIfOutOfView;
  }

  /**
   * Este método muestra un "popup" con información.
   *
   * @function
   * @param {M.Map} map Mapa donde mostrar el "popup".
   * @public
   * @api
   */
  show(map) {
    this.facadeMap_ = map;
    const htmlAsText = compileTemplate(labelPopupTemplate, {
      vars: {
        info: this.text_,
      },
      parseToHtml: false,
    });
    map.removePopup();
    this.popup_ = new FacadePopup({
      panMapIfOutOfView: this.panMapIfOutOfView,
    });
    this.popup_.addTab({
      icon: 'g-cartografia-comentarios',
      title: 'Información',
      content: htmlAsText,
    });
    map.addPopup(this.popup_, this.coord_);
  }

  /**
   * Este método oculta el "popup".
   *
   * @function
   * @public
   * @api
   */
  hide() {
    this.facadeMap_.removePopup();
  }

  /**
   * Este método devuelve el "popup" creado.
   *
   * @function
   * @returns {M.Popup} "Popup" creado.
   * @public
   * @api
   */
  getPopup() {
    return this.popup_;
  }

  /**
   * Este método devuelve las coordenadas del "popup" creado.
   *
   * @function
   * @returns {Array} Coordenadas del "popup".
   * @public
   * @api
   */
  getCoordinate() {
    let coord = this.coord;
    if (isNullOrEmpty(coord)) {
      coord = this.getPopup().getCoordinate();
    }
    return coord;
  }

  /**
   * Este método establece las coordenadas del "popup".
   *
   * @function
   * @param {Array} coord Coordenadas para el "popup".
   * @public
   * @api
   */
  setCoordinate(coord) {
    const popup = this.getPopup();
    if (!isNullOrEmpty(popup)) {
      popup.setCoordinate(coord);
    }
  }
}

export default Label;
