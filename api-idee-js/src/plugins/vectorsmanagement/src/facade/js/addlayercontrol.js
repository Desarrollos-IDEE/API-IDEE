/**
 * @module IDEE/control/AddLayer
 */
import { getValue } from './i18n/language';

/**
 * @classdesc
 * Add layer api-idee control.
 * This control can create vector layers.
 */
export default class AddLayerControl extends IDEE.Control {
  /**
   * @classdesc
   * Main constructor of the class. Creates a PluginControl
   * control
   *
   * @constructor
   * @extends {IDEE.Control}
   * @api stable
   */
  constructor(map) {
    const impl = new IDEE.impl.Control();
    super('Help', impl);

    this.map_ = map;
  }

  /**
   * This functions active control
   *
   * @public
   * @function
   * @param {Node} html
   * @api
   */
  active(html) {
    this.layerBtnClick();
  }

  /**
   * This function show a modal to set name and legend of the new layer.
   *
   * @public
   * @function
   * @api stable
   */
  layerBtnClick() {
    this.showLayerDialog();
  }

  /**
   * This function show a modal to set name and legend of the new layer.
   *
   * @public
   * @function
   * @api stable
   */
  showLayerDialog() {
    IDEE.dialog.info(
      `<div 
        id="chooseLayerName" 
        style="display: flex; flex-direction: column; align-items: flex-start; justify-content: space-between; row-gap: .5rem;"
      >
        <label 
          for="layer-name" 
          style="width: 93px;"
        >
          ${getValue('layerName')}
        </label>
        <input 
          type="text" 
          id="layer-name"
          style="width: 98%"
        >
      </div>
      `,
      getValue('title_new_layer'),
    );

    const colorPrimary = 'var(--idee-color-primary)';
    const dialog = document.querySelector('.m-dialog > div.m-modal > div.m-content');
    dialog.style.minWidth = '15rem';

    const title = dialog.querySelector('.m-modal .m-title');
    title.style.height = '41px';

    const btnContainerSubmmit = dialog.querySelector('.m-button');

    const footerSubmmit = document.createElement('footer');
    footerSubmmit.style.display = 'flex';
    footerSubmmit.style.flexDirection = 'row';
    footerSubmmit.style.alignItems = 'center';
    footerSubmmit.style.justifyContent = 'flex-end';
    footerSubmmit.style.columnGap = '.5rem';

    btnContainerSubmmit.appendChild(footerSubmmit);

    const btnSuccess = document.querySelector('.m-button button');
    btnSuccess.style.type = 'button';
    btnSuccess.style.width = '4.5rem';
    btnSuccess.parentNode.removeChild(btnSuccess);

    const btnCancel = document.createElement('button');
    btnCancel.type = 'button';
    btnCancel.width = '4.5rem';
    btnCancel.innerHTML = getValue('cancel');
    btnCancel.style.color = colorPrimary;
    btnCancel.style.backgroundColor = 'white';

    footerSubmmit.appendChild(btnSuccess);
    footerSubmmit.appendChild(btnCancel);

    const inputName = document.querySelector('div.m-modal input#layer-name');
    btnSuccess.addEventListener('click', () => {
      this.addLayer(inputName.value);
      IDEE.toast.info(getValue('creationLayer_done'), null, 6000);
      const layerSelector = document.querySelector('#m-vectorsmanagement-layer-selector');
      layerSelector.classList.remove('disabled');
      const changeEvent = new CustomEvent('selectLayer', {
        detail: { selected: layerSelector.children[1].firstChild },
        bubbles: true,
      });
      layerSelector.dispatchEvent(changeEvent);
    });

    btnCancel.addEventListener('click', () => {
      const modal = document.querySelector('.m-dialog');
      const parent = modal.parentNode;
      parent.removeChild(modal);
      this.deactivate();
    });
  }

  /**
   * This function create a layer, add to map and deactivate
   *
   * @public
   * @function
   * @param {String} name
   * @param {String} legend
   * @api stable
   */
  addLayer(name) {
    const newVector = new IDEE.layer.Vector({
      name: name || `vector_${Math.floor(Math.random() * 9000) + 1000}`,
      legend: name || `Vector_${Math.floor(Math.random() * 9000) + 1000}`,
    });
    this.map_.addLayers(newVector);
    this.deactivate();
  }

  /**
   * This function destroys this control
   *
   * @public
   * @function
   * @api stable
   */
  destroy() { }

  /**
   * This function is called on the control activation
   *
   * @public
   * @function
   * @api stable
   */
  activate() {
    super.activate();
  }

  /**
   * This function is called on the control deactivation
   *
   * @public
   * @function
   * @api stable
   */
  deactivate() {
    document.querySelector('#layerdrawing')?.classList.remove('activated');
  }

  /**
   * This function compares controls
   *
   * @public
   * @function
   * @param {IDEE.Control} control to compare
   * @api stable
   */
  equals(control) {
    // eslint-disable-next-line no-undef
    return control instanceof AddLayerControl;
  }
}
