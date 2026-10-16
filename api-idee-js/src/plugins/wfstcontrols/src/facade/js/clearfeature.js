/**
 * @module IDEE/control/ClearFeature
 */
import ClearFeatureImpl from 'impl/clearfeature';
import ClearFeatureHTML from '../../templates/clearfeature.html';
import { getValue } from './i18n/language';

class ClearFeature extends IDEE.Control {
  /**
   * @constructor
   * @param {Object|IDEE.layer.WFS} options opciones del control o capa legacy
   * @api stable
   */
  constructor(options = {}) {
    const controlOptions = options && options.layer ? options : { layer: options };

    if (IDEE.utils.isUndefined(ClearFeatureImpl)) {
      IDEE.exception(getValue('exception.impl_clear'));
    }

    const impl = new ClearFeatureImpl(controlOptions.layer);

    super(ClearFeature.NAME, impl, {
      tooltip: controlOptions.tooltip || getValue('clear'),
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
    this.element = IDEE.template.compileSync(ClearFeatureHTML, {
      jsonp: true,
      vars: {
        translations: {
          clear: getValue('clear'),
        },
      },
    });
    return this.element;
  }

  /**
   * Gestiona el click del botón de limpiar.
   *
   * @public
   * @function
   * @param {HTMLElement} element HTML del control
   * @api stable
   */
  manageActivation(element) {
    const activationBtn = (element || this.element)
      .querySelector('button#m-button-clearfeature');
    if (activationBtn) {
      activationBtn.addEventListener('click', this.clear_.bind(this));
    }
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
    return obj instanceof ClearFeature;
  }

  /**
   * Limpia cambios no guardados.
   *
   * @private
   * @function
   * @param {Event} evt evento
   */
  clear_(evt) {
    evt.preventDefault();
    this.getImpl().clear();
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

ClearFeature.NAME = 'clearfeature';
ClearFeature.TEMPLATE = 'clearfeature.html';

export default ClearFeature;
