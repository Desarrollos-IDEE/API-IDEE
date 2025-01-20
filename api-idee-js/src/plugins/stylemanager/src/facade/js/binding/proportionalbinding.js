/* eslint-disable dot-notation,no-prototype-builtins,no-return-assign,no-underscore-dangle */
import { getValue } from '../i18n/language';

import { Binding } from './binding';

// eslint-disable-next-line
export class ProportionalBinding extends Binding {
  /**
   * This function sets the attribute layer to the binding.
   * @function
   * @param {M.layer.Vector}
   */
  setLayer(layer) {
    this.layer_ = layer;
    // this.setIntegerAttributes();
    return this;
  }

  /**
   * This function generates the cluster style from GUI Options.
   *
   * @function
   * @returns {M.style.Cluster}
   */
  generateStyle() {
    const opts = this.generateOptions();
    let style = null;
    if (opts.attributeName !== '') {
      const scaledName = opts.scaledName === 'flannery' ? { flannery: true } : { flannery: false };
      style = new M.style.Proportional(
        opts.attributeName,
        opts.minRadius,
        opts.maxRadius,
        null,
        null,
        scaledName,
      );
    }
    return style;
  }

  /**
   * @function
   *
   */
  getOptionsTemplate() {
    let options = ProportionalBinding.DEFAULT_OPTIONS_STYLE;
    if (this.style_ != null) {
      const pfunction = this.style_.options_ && this.style_.options_.flannery === true ? 'flannery' : 'absolute';
      options = {
        attributeName: this.style_.getAttributeName(),
        minRadius: this.style_.getMinRadius(),
        maxRadius: this.style_.getMaxRadius(),
        proportionalFunction: pfunction,
      };
      this.setSelected(true);
    }
    if (this.layer_ != null) {
      options['attributes'] = this.getAttributes();
      // eslint-disable-next-line no-param-reassign
      options['attributes'].forEach((attribute) => attribute['selected'] = options.attributeName);
      options['functions'] = ProportionalBinding.arrayDataToTemplate(
        options.proportionalFunction,
        ['absolute', 'flannery'],
        [getValue('absolute'), 'Flannery'],
      );
    }
    return options;
  }

  /**
   * @function
   */
  static arrayDataToTemplate(selected, arrayId, arrayName) {
    return arrayId.map((id, index) => {
      return {
        id,
        name: arrayName[index],
        selected,
      };
    });
  }

  /**
   * @function
   */
  getAttributes() {
    const attributeNames = this.filterAttributesFeature('number').map((element) => {
      return {
        name: element,
      };
    });
    return attributeNames;
  }
}

ProportionalBinding.DEFAULT_OPTIONS_STYLE = {
  attributeName: '',
  minRadius: 12,
  maxRadius: 25,
  proportionalFunction: 'absolute',
};
