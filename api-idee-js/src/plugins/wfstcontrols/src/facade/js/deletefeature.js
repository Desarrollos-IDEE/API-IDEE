/**
 * @module IDEE/control/DeleteFeature
 */
import DeleteFeatureImpl from 'impl/deletefeature';
import deletefeatureHTML from '../../templates/deletefeature.html';
import { getValue } from './i18n/language';

class DeleteFeature extends IDEE.Control {
  /**
   * @constructor
   * @param {Object|IDEE.layer.WFS} options opciones del control o capa legacy
   * @api stable
   */
  constructor(options = {}) {
    const controlOptions = options && options.layer ? options : { layer: options };

    if (IDEE.utils.isUndefined(DeleteFeatureImpl)) {
      IDEE.exception(getValue('exception.impl_delete'));
    }

    const impl = new DeleteFeatureImpl(controlOptions.layer);

    super(DeleteFeature.NAME, impl, {
      tooltip: controlOptions.tooltip || getValue('delete'),
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
    this.element = IDEE.template.compileSync(deletefeatureHTML, {
      jsonp: true,
      vars: {
        translations: {
          delete: getValue('delete'),
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
    return element.querySelector('button#m-button-deletefeature');
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
    return obj instanceof DeleteFeature;
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

DeleteFeature.NAME = 'deletefeature';
DeleteFeature.TEMPLATE = 'deletefeature.html';

export default DeleteFeature;
