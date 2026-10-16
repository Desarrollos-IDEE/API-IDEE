/**
 * @module IDEE/control/ModifyFeature
 */
import ModifyFeatureImpl from 'impl/modifyfeature';
import modifyfeatureHTML from '../../templates/modifyfeature';
import { getValue } from './i18n/language';

class ModifyFeature extends IDEE.Control {
  /**
   * @constructor
   * @param {Object|IDEE.layer.WFS} options opciones del control o capa legacy
   * @api stable
   */
  constructor(options = {}) {
    const controlOptions = options && options.layer ? options : { layer: options };

    if (IDEE.utils.isUndefined(ModifyFeatureImpl)) {
      IDEE.exception(getValue('exception.impl_modify'));
    }

    const impl = new ModifyFeatureImpl(controlOptions.layer);

    super(ModifyFeature.NAME, impl, {
      tooltip: controlOptions.tooltip || getValue('modify'),
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
    this.element = IDEE.template.compileSync(modifyfeatureHTML, {
      jsonp: true,
      vars: {
        translations: {
          modify: getValue('modify'),
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
    return element.querySelector('button#m-button-modifyfeature');
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
    return obj instanceof ModifyFeature;
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

ModifyFeature.NAME = 'modifyfeature';
ModifyFeature.TEMPLATE = 'modifyfeature.html';

export default ModifyFeature;
