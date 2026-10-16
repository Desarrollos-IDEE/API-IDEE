/**
 * @module IDEE/control/EditAttribute
 */
import EditAttributeImpl from 'impl/editattribute';
import editattributeHTML from '../../templates/editattribute';
import { getValue } from './i18n/language';

class EditAttribute extends IDEE.Control {
  /**
   * @constructor
   * @param {Object|IDEE.layer.WFS} options opciones del control o capa legacy
   * @api stable
   */
  constructor(options = {}) {
    const controlOptions = options && options.layer ? options : { layer: options };

    if (IDEE.utils.isUndefined(EditAttributeImpl)) {
      IDEE.exception(getValue('exception.impl_edit'));
    }

    const impl = new EditAttributeImpl(controlOptions.layer);

    super(EditAttribute.NAME, impl, {
      tooltip: controlOptions.tooltip || getValue('edit'),
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
    this.element = IDEE.template.compileSync(editattributeHTML, {
      jsonp: true,
      vars: {
        translations: {
          edit: getValue('edit'),
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
    return element.querySelector('button#m-button-editattribute');
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
    return obj instanceof EditAttribute;
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

EditAttribute.NAME = 'editattribute';
EditAttribute.TEMPLATE = 'editattribute.html';

export const POPUP_TITLE = 'Editattribute';
export const TEMPLATE_POPUP = 'editattribute_popup.html';

export default EditAttribute;
