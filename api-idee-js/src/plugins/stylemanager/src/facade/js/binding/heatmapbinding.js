/* eslint-disable dot-notation,no-prototype-builtins,no-return-assign */
import * as chroma from 'chroma-js';
import { Binding } from './binding';
import * as htmlgradient from '../../../templates/gradientheatmap';
import { getValue } from '../i18n/language';

// eslint-disable-next-line
export class HeatmapBinding extends Binding {
  constructor(html, htmlParent, styleType, styleParams, layer) {
    super(html, htmlParent, styleType, styleParams, layer);
    this.style_ = null;
    this.compilePromise_.then(() => {
      this.removeGradientListener();
      this.addGradientListener();
    });
    this.numberAddedColors_ = 6;
  }

  /**
   * This function sets the layer of a binding class.
   * @function
   * @param {M.layer.Vector}
   * @returns {Binding}
   */
  setLayer(layer) {
    this.layer_ = layer;
    this.style_ = null;
    // this.setIntegerAttributes();
    return this;
  }

  /**
   * This function adds the event listener to remove gradient color option.
   * @function
   */
  removeGradientListener() {
    this.querySelectorAllForEach('.m-removable-input-color .m-close', (element) => {
      element.addEventListener('click', () => {
        const rootElement = element.parentElement.parentElement;
        rootElement.removeChild(element.parentElement);
        this.numberAddedColors_ -= 1;
      });
    });
  }

  /**
   * This function adds the event listener to add gradient color option.
   * @function
   */
  addGradientListener() {
    const parent = this.querySelector("[data-parent='gradient']");
    this.querySelector('[data-add]').addEventListener('click', () => {
      this.compileTemplate(htmlgradient, {}).then((htmlg) => {
        if (this.numberAddedColors_ < HeatmapBinding.MAX_NUMBER_COLORS) {
          parent.appendChild(htmlg);
          this.setRandomColor(htmlg);
          htmlg.querySelector('.m-close').addEventListener('click', () => {
            const rootElement = htmlg.parentElement;
            rootElement.removeChild(htmlg);
            this.numberAddedColors_ -= 1;
          });
          this.numberAddedColors_ += 1;
        } else {
          M.dialog.info(getValue('exception.numberColorAllowed'), getValue('exception.information'));
        }
      });
    });
  }

  /**
   * @function
   */
  setRandomColor(html) {
    const inputColor = html.querySelector('input');
    const randomColor = chroma.random().hex();
    inputColor.value = randomColor;
  }

  /**
   * This function generates the heatmap style.
   * @function
   * @returns {M.style.Heatmap}
   */
  generateStyle() {
    const opts = this.generateOptions();
    const style = new M.style.Heatmap(opts.attributeName, opts.options);
    return style;
  }

  /**
   * @function
   *
   */
  getOptionsTemplate() {
    const options = HeatmapBinding.DEFAULT_OPTIONS_STYLE;
    if (this.style_ != null) {
      options['attribute'] = this.style_.getAttributeName();
      options['radius'] = this.style_.getRadius();
      options['blur'] = this.style_.getBlurSize();
      options['gradient'] = this.style_.getGradient().map((el) => chroma(el).hex());
    }
    if (this.layer_ != null) {
      options['attributes'] = this.getAttributes();
      // eslint-disable-next-line no-param-reassign
      options['attributes'].forEach((attribute) => attribute['selected'] = options.attribute);
    }
    return options;
  }

  /**
   * @function
   */
  getAttributes() {
    const attributeNames = this.filterAttributesFeature('number').map((element) => {
      return { name: element };
    });
    return attributeNames;
  }
}

/**
 * @const
 */
HeatmapBinding.DEFAULT_OPTIONS_STYLE = {
  attribute: '',
  gradient: ['#0000ff', '#00ffff', '#00ff00', '#ffff00', '#ffb619', '#ff0000'],
  blur: 12,
  radius: 22,
};

/**
 * @const
 */
HeatmapBinding.MAX_NUMBER_COLORS = 30;
