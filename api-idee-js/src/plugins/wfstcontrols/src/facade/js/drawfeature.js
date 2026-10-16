/**
 * @module IDEE/control/DrawFeature
 */
import DrawFeatureImpl from 'impl/drawfeature';
import drawfeatureHTML from '../../templates/drawfeature';
import { getValue } from './i18n/language';

class DrawFeature extends IDEE.Control {
  /**
   * @constructor
   * @param {Object|IDEE.layer.WFS} options opciones del control o capa legacy
   * @api stable
   */
  constructor(options = {}) {
    const controlOptions = options && options.layer ? options : { layer: options };

    if (IDEE.utils.isUndefined(DrawFeatureImpl)) {
      IDEE.exception(getValue('exception.impl_draw'));
    }

    const impl = new DrawFeatureImpl(controlOptions.layer);

    super(DrawFeature.NAME, impl, {
      tooltip: controlOptions.tooltip || getValue('draw'),
      position: controlOptions.position,
      order: controlOptions.order,
    });
  }

  /**
   * Crea la vista del control.
   *
   * @public
   * @function
   * @param {IDEE.Map} map mapa
   * @returns {HTMLElement} HTML
   * @api stable
   */
  createView(map) {
    this.map_ = map;
    this.element = IDEE.template.compileSync(drawfeatureHTML, {
      jsonp: true,
      vars: {
        translations: {
          draw: getValue('draw'),
        },
      },
    });
    return this.element;
  }

  /**
   * Devuelve el botón de activación.
   *
   * @public
   * @function
   * @param {HTMLElement} element HTML del control
   * @returns {HTMLElement} botón
   * @api stable
   */
  getActivationButton(element) {
    return element.querySelector('button#m-button-drawfeature');
  }

  /**
   * Compara controles.
   *
   * @public
   * @function
   * @param {*} obj objeto
   * @returns {boolean} igualdad
   * @api stable
   */
  equals(obj) {
    return obj instanceof DrawFeature;
  }

  /**
   * Cambia la capa del control.
   *
   * @public
   * @function
   * @param {IDEE.layer.WFS} layer capa
   * @api stable
   */
  setLayer(layer) {
    this.getImpl().setLayer(layer);
  }
}

DrawFeature.NAME = 'drawfeature';
DrawFeature.TEMPLATE = 'drawfeature.html';

export default DrawFeature;
