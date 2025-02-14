/* eslint-disable dot-notation,no-prototype-builtins,no-return-assign */
import colorchoropleth from 'templates/colorchoropleth';
import { Binding } from './binding';
import { getValue } from '../i18n/language';

// eslint-disable-next-line
export class ChoroplethBinding extends Binding {
  constructor(html, htmlParent, styleType, styleParams, layer) {
    super(html, htmlParent, styleType, styleParams, layer);
    this.compilePromise_.then(() => {
      this.addColorListener();
    });
  }

  setLayer(layer) {
    this.layer_ = layer;
    // this.setIntegerAttributes();
    return this;
  }

  setRanges() {
    const rangesButton = this.querySelector('[data-number-ranges]');
    const number = parseInt(rangesButton.value, 10);
    const rangesArray = [];

    for (let i = 1; i <= number; i += 1) {
      rangesArray.push({ number: i });
    }
    const parent = this.querySelector('[data-parent]');
    this.addTemplate('choroplethstyles.html', parent, { ranges: rangesArray });
  }

  addEventRangeListener() {
    const rangesButton = this.querySelector('[data-number-ranges]');
    rangesButton.addEventListener('input', this.setRanges.bind(this));
  }

  generateStyle() {
    const opts = this.generateOptions();
    const ranges = opts.ranges;
    const colors = opts.options.colors;
    let quantification = null;
    if (opts.quantification === 'ARITHMETIC_PROGRESSION') {
      quantification = M.style.quantification.ARITHMETIC_PROGRESSION;
    } else if (opts.quantification === 'EQUAL_INTERVAL') {
      quantification = M.style.quantification.EQUAL_INTERVAL;
    } else if (opts.quantification === 'GEOMETRIC_PROGRESSION') {
      quantification = M.style.quantification.GEOMETRIC_PROGRESSION;
    } else if (opts.quantification === 'MEDIA_SIGMA') {
      quantification = M.style.quantification.MEDIA_SIGMA;
    } else if (opts.quantification === 'JENKS') {
      quantification = M.style.quantification.JENKS;
    } else if (opts.quantification === 'QUANTILE') {
      quantification = M.style.quantification.QUANTILE;
    }
    let style = null;
    if (opts.attributeName !== '') {
      style = new M.style.Choropleth(opts.attributeName, colors, quantification(ranges));
    }
    return style;
  }

  addColors() {
    const rangesButton = this.querySelector('[data-number-ranges]');
    const number = parseInt(rangesButton.value, 10);
    const colorsInput = this.querySelectorAll('[data-array-options]');
    const numberColors = colorsInput.length;
    if (numberColors < number) {
      this.addColorTemplate(numberColors);
    } else {
      M.dialog.info(getValue('exception.moreColorsRanges'), getValue('exception.numberColors'));
    }
  }

  addColorTemplate(numberColors) {
    const parent = this.querySelector('[data-colors]');
    this.compileTemplate(colorchoropleth, {
      numbercolor: numberColors,
      color: '#ffff',
    }).then((html) => {
      parent.append(...html.children);
    });
  }

  addColorListener() {
    const addButton = this.querySelector('[data-add-color]');
    addButton.addEventListener('click', () => {
      this.addColors();
    });
  }

  /**
   * @function
   *
   */
  getOptionsTemplate() {
    let options = ChoroplethBinding.DEFAULT_OPTIONS_STYLE;
    if (this.style_ != null) {
      const auxChoroplethStyles = this.style_.getChoroplethStyles();
      let startColorVar = auxChoroplethStyles[0].get('fill.color');
      let endColorVar = auxChoroplethStyles.slice(-1)[0].get('fill.color');
      startColorVar = startColorVar || auxChoroplethStyles[0].get('stroke.color');
      endColorVar = endColorVar || auxChoroplethStyles.slice(-1)[0].get('stroke.color');

      options = {
        attribute: this.style_.getAttributeName(),
        ranges: auxChoroplethStyles.length,
        quantification: this.style_.getQuantification().name,
        startColor: startColorVar,
        endColor: endColorVar,
      };
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

ChoroplethBinding.DEFAULT_OPTIONS_STYLE = {
  attribute: '',
  quantification: 'JENKS',
  ranges: 4,
  startColor: '#F8FF25',
  endColor: '#4400FD',
};
