/**
 * @module IDEE/control/SaveFeature
 */
import SaveFeatureImpl from 'impl/savefeature';
import savefeatureHTML from '../../templates/savefeature';
import { getValue } from './i18n/language';

class SaveFeature extends IDEE.Control {
  /**
   * @constructor
   * @param {Object|IDEE.layer.WFS} options opciones del control o capa legacy
   * @param {Object} proxy configuración proxy legacy
   * @api stable
   */
  constructor(options = {}, proxy = {}) {
    const controlOptions = options && options.layer
      ? options
      : { layer: options, proxy };

    if (IDEE.utils.isUndefined(SaveFeatureImpl)) {
      IDEE.exception(getValue('exception.impl_save'));
    }

    const impl = new SaveFeatureImpl(
      controlOptions.layer,
      controlOptions.proxy || {},
    );

    super(SaveFeature.NAME, impl, {
      tooltip: controlOptions.tooltip || getValue('save'),
      position: controlOptions.position,
      order: controlOptions.order,
    });

    this.facadeMap_ = null;
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
    this.facadeMap_ = map;
    this.element = IDEE.template.compileSync(savefeatureHTML, {
      jsonp: true,
      vars: {
        translations: {
          save: getValue('save'),
        },
      },
    });
    return this.element;
  }

  /**
   * Gestiona el click del botón de guardar.
   *
   * @public
   * @function
   * @param {HTMLElement} html HTML del control
   * @api stable
   */
  manageActivation(html) {
    const button = (html || this.element)
      .querySelector('button#m-button-savefeature');
    if (button) {
      button.addEventListener('click', this.saveFeature_.bind(this));
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
    return obj instanceof SaveFeature;
  }

  /**
   * Guarda los cambios.
   *
   * @public
   * @function
   * @param {Event} evt evento
   * @api stable
   */
  saveFeature_(evt) {
    evt.preventDefault();
    this.getImpl().saveFeature();
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

SaveFeature.NAME = 'savefeature';
SaveFeature.TEMPLATE = 'savefeature.html';

export default SaveFeature;
