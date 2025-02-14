/* eslint-disable dot-notation,no-return-assign,no-underscore-dangle */
import { Binding } from './binding';
import { getValue } from '../i18n/language';

// eslint-disable-next-line
export class FlowLineBinding extends Binding {
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
   * @returns {M.style.FlowLine}
   */
  generateStyle() {
    const opts = this.generateOptions();
    let style = null;
    if (opts) {
      style = new M.style.FlowLine({
        color: opts.color,
        color2: opts.color2,
        arrow: opts.arrow,
        width: opts.width,
        width2: opts.width2,
        arrowColor: opts.arrowColor,
        lineCap: opts.lineCap,
        offset0: opts.offset0,
        offset1: opts.offset1,
      });
    }
    return style;
  }

  /**
   * @function
   *
   */
  getOptionsTemplate() {
    let options = FlowLineBinding.DEFAULT_OPTIONS_STYLE;

    if (this.style_ != null) {
      const style = this.style_.options_;
      options = {
        color: style.color,
        color2: style.color2,
        arrow: style.arrow,
        arrowColor: style.arrowColor,
        width: style.width,
        width2: style.width2,
        lineCap: style.lineCap,
        offset0: style.offset0,
        offset1: style.offset1,
      };
      this.setSelected(true);
    }

    if (this.layer_ != null) {
      options['arrowlist'] = [{ name: 0 }, { name: -1 }, { name: 1 }, { name: 2 }];
      // eslint-disable-next-line no-param-reassign
      options['arrowlist'].forEach((ar) => ar['selected'] = options.arrow);
      options['linecap'] = FlowLineBinding.arrayDataToTemplate(options.lineCap, ['round', 'butt'], [getValue('rounded'), getValue('extreme')]);
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
}

FlowLineBinding.DEFAULT_OPTIONS_STYLE = {
  color: '#ff0000',
  color2: '#F8FF25',
  arrow: 0,
  width: 2,
  width2: 25,
  lineCap: 'butt',
  arrowColor: '#ff0000',
  offset0: 0,
  offset1: 0,
};
