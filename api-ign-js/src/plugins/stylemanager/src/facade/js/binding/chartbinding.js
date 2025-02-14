/* eslint-disable dot-notation,no-prototype-builtins */
import variablechart from 'templates/variablechart';
import paginationchart from 'templates/paginationchart';
import attributeschart from 'templates/attributeschart';
import { Binding } from './binding';
import { getValue } from '../i18n/language';

// eslint-disable-next-line
export class ChartBinding extends Binding {
  constructor(html, htmlParent, styleType, styleParams, layer) {
    super(html, htmlParent, styleType, styleParams, layer);
    this.variables_ = [];
    if (styleParams != null) {
      this.variables_ = styleParams.getOptions().variables.map((variable) => variable.attribute);
    }
    this.compilePromise_.then(() => {
      this.addKeyEnterListener();
      this.addRenderCompatibleListener();
      this.addAttributeListener();
      this.refreshVariables();
    });
  }

  setLayer(layer) {
    this.layer_ = layer;
    this.renderAttributes();
    return this;
  }

  /**
   * @function
   * @param {string}
   */
  addAttribute(attr) {
    this.variables_.push(attr);
  }

  /**
   * @function
   * @param {string}
   */
  removeAttribute(attr) {
    this.variables_ = this.variables_.filter((attr2) => attr2 !== attr);
  }

  addAttributeFromParamenter(attribute) {
    this.addAttribute(attribute);
    this.addVariableTemplate(attribute);
    this.refreshPagination();
  }

  /**
   * @function
   */
  addAttributeFromInput() {
    const inputAttribute = this.querySelector('[data-attribute]');
    const attribute = inputAttribute.value;
    if (attribute !== '') {
      if (this.variables_.includes(attribute)) {
        M.dialog.info(getValue('exception.attributeAdded'), getValue('exception.repeatedVariable'));
      } else {
        const allowedAttrs = this.layer_.getFeatures()[0].getAttributes();
        if (allowedAttrs.hasOwnProperty(attribute)) {
          this.addAttributeFromParamenter(attribute);
        } else {
          M.dialog.info(getValue('exception.variableName'), getValue('exception.incorrectName'));
        }
      }
    } else {
      M.dialog.info(getValue('exception.emptyString'), getValue('exception.emptyVariable'));
    }
  }

  /**
   * @function
   */
  removeAttributeFromInput() {
    const inputAttribute = this.querySelector('[data-attribute]');
    const attribute = inputAttribute.value;
    this.removeAttribute(attribute);
  }

  /**
   * @function
   */
  addAttributeListener() {
    const button = this.querySelector('[data-add]');
    button.addEventListener('click', () => {
      this.addAttributeFromInput();
    });
  }

  /**
   * @function
   */
  addKeyEnterListener() {
    const inputElement = this.querySelector('[data-attribute]');
    inputElement.addEventListener('keydown', this.keyEnterListener());
  }

  /**
   * @function
   */
  keyEnterListener() {
    return (evt) => {
      if (evt.key === 'Enter') {
        this.addAttributeFromInput();
      }
    };
  }

  /**
   * @function
   */
  addVariableTemplate(attribute) {
    const parent = this.querySelector('[data-variables]');
    let variables = [];
    let variable;
    let legend = ChartBinding.DEFAULT_OPTIONS_VARIABLE.legend;
    let label = ChartBinding.DEFAULT_OPTIONS_VARIABLE.label;
    if (this.style_ != null) {
      variables = this.style_.getOptions().variables;
    }
    if (variables.length !== 0) {
      variable = variables.find((vari) => vari.attribute === attribute);
      if (variable != null) {
        legend = variable.legend;
        label = variable.label;
      }
    }
    this.compileTemplate(variablechart, {
      attribute,
      legend,
      label,
    }).then((html) => {
      parent.append(...html.children);
      const removeElement = this.querySelector(`[data-remove="${attribute}"]`);
      if (removeElement != null) {
        this.addRemoveVarSectionListener(removeElement);
        this.addLabelOptionListener(attribute);
      }
    });
  }

  /**
   * @function
   */
  removeVariableTemplate(selector) {
    const parent = this.querySelector('.m-chart-variables');
    this.querySelectorAllForEach(`.m-chart-variables [data-delete="${selector}"]`, (element) => {
      parent.removeChild(element);
    });
  }

  /**
   * @function
   */
  removeVariableSection(attr) {
    this.removeAttribute(attr);
    this.removeVariableTemplate(attr);
    this.refreshPagination();
  }

  /**
   * @function
   */
  refreshVariables() {
    const variables = [...this.variables_];
    variables.forEach((variable) => {
      this.removeVariableSection(variable);
      this.addAttributeFromParamenter(variable);
    });
  }

  /**
   * @function
   */
  addRemoveVarSectionListener(element) {
    element.addEventListener('click', this.removeVarSectionListener(element).bind(this));
  }

  /**
   * @function
   */
  removeVarSectionListener(element) {
    const attribute = element.dataset['remove'];
    return () => {
      this.removeVariableSection(attribute);
    };
  }

  /**
   * @function
   */
  refreshPagination() {
    const options = this.variables_.map((attribute, index) => {
      const option = {
        attribute,
        number: index + 1,
      };
      return option;
    });

    const parent = this.querySelector('[data-pagination]');
    this.compileTemplate(paginationchart, {
      ranges: options,
    }).then((html) => {
      parent.innerHTML = html.innerHTML;
      this.addClickPagerListener();
      const firstAttr = this.variables_.slice(-1)[0];
      if (firstAttr != null) {
        this.showVariableSection(firstAttr)();
      }
    });
  }

  /**
   * @function
   */
  addClickPagerListener() {
    this.querySelectorAllForEach('[data-page-selector]', (element) => {
      const selector = element.dataset['pageSelector'];
      element.addEventListener('click', this.showVariableSection(selector).bind(this));
    });
  }

  /**
   * @function
   */
  clickPagerListener(selector) {
    this.querySelectorAllForEach('[data-target]', (element) => {
      element.classList.add('m-hidden');
    });

    this.querySelectorAllForEach(`[data-target="${selector}"]`, (element) => {
      element.classList.remove('m-hidden');
    });
  }

  /**
   * @function
   */
  activePageListener(selector) {
    this.querySelectorAllForEach('[data-page-selector]', (element2) => {
      element2.classList.remove('m-page-active');
    });
    const element = this.querySelector(`[data-page-selector="${selector}"]`);
    if (element != null) {
      element.classList.add('m-page-active');
    }
  }

  /**
   * @function
   */
  showVariableSection(selector) {
    return () => {
      this.clickPagerListener(selector);
      this.activePageListener(selector);
    };
  }

  /**
   * @function
   */
  renderCompatibleOpts(type) {
    this.querySelectorAllForEach('[data-type]', (element) => {
      const types = element.dataset['type'].split(',');
      if (!types.includes(type)) {
        element.classList.add('m-hidden');
      } else {
        element.classList.remove('m-hidden');
      }
    });
  }

  /**
   * @function
   */
  renderCompatibleListener() {
    const selectElement = this.querySelector("[data-style-options='type']");
    const selectType = selectElement.selectedOptions[0].value;
    this.renderCompatibleOpts(selectType);
  }

  /**
   * @function
   */
  addRenderCompatibleListener() {
    const selectElement = this.querySelector("[data-style-options='type']");
    selectElement.addEventListener('change', this.renderCompatibleListener.bind(this));
  }

  /**
   * @function
   */
  renderAttributes() {
    const attributes = this.layer_.getFeatures()[0].getAttributes();
    let keys = Object.keys(attributes);
    keys = keys.filter((key) => {
      return !Number.isNaN(parseFloat(attributes[key]));
    });

    this.compileTemplate(attributeschart, {
      attributes: keys,
    }).then((html) => {
      this.querySelector('[data-attribute]').innerHTML = html.innerHTML;
    });
  }

  /**
   * @function
   */
  toggleLabelOptions(name) {}

  /**
   * @function
   */
  addLabelOptionListener(name) {
    const checkbox = this.querySelector(`[data-variable-option="${name}.labelshow"]`);
    checkbox.addEventListener('change', () => {
      this.toggleLabelOptions(name);
    });
  }

  /**
   * @function
   */
  generateVariableOptions() {
    const obj = {};

    this.querySelectorAllForEach('input[data-variable-option]', (element) => {
      const path = element.dataset['variableOption'];
      let value = element.value;
      if (element.type === 'number') {
        value = parseFloat(value);
      }

      if (element.type === 'checkbox') {
        value = element.checked;
      }
      Binding.createObj(obj, path, value);
    });

    let optVars = this.variables_.map((attribute) => {
      obj[attribute]['attribute'] = attribute;

      return obj[attribute];
    });

    optVars = optVars.map((option) => {
      // options text label, show the % of data
      if (option.labelshow === true) {
        // eslint-disable-next-line no-param-reassign
        option['label']['text'] = (value, values) => {
          return `${Math.round((value / (values.reduce((tot, curr) => tot + curr))) * 100)}%`;
        };
      } else {
        // eslint-disable-next-line no-param-reassign
        option['label'] = undefined;
      }
      return option;
    });

    return optVars;
  }

  /**
   * @function
   */
  generateStyle() {
    const options = this.generateOptions().options;
    const varsOpts = this.generateVariableOptions();
    const scheme = M.style.chart.schemes[options.scheme];

    const style = new M.style.Chart({
      type: options.type,
      scheme,
      radius: options.radius,
      donutRadio: options.donutRadius,
      offsetX: options.offsetX,
      offsetY: options.offsetY,
      variables: varsOpts.length === 0 ? [new M.style.chart.Variable({
        attribute: 'default',
      })] : varsOpts,
      fill3DColor: options.fill3DColor,
    });

    return style;
  }

  /**
   * @function
   *
   */
  getOptionsTemplate() {
    let options = ChartBinding.DEFAULT_OPTIONS_STYLE;
    if (this.style_ != null) {
      options = this.style_.getOptions();
      options['scheme'] = this.getSchemeName();
      // parse variable options
    }
    return options;
  }

  /**
   * @function
   */
  getSchemeName() {
    const arrayEquals = (array, array2) => {
      let include = false;
      let include2 = false;
      if (array instanceof Array && array2 instanceof Array) {
        include = array.every((element, index) => element === array2[index]);
        include2 = array2.every((element, index) => element === array[index]);
      }
      return include && include2;
    };
    let nameAux = '';
    if (this.style_ != null) {
      const scheme = this.style_.getOptions()['scheme'];
      const schemesChart = M.style.chart.schemes;
      nameAux = Object.keys(schemesChart).find((name) => arrayEquals(scheme, schemesChart[name]));
    }
    return nameAux;
  }
}

/**
 * @const
 */
ChartBinding.DEFAULT_OPTIONS_STYLE = {
  donutRatio: 4,
  fill3DColor: '#ff00f0',
  offsetX: 0,
  offsetY: 0,
  radius: 12,
  rotateWithView: false,
  scheme: ['#ffa500', 'blue', 'red', 'green', 'cyan', 'magenta', 'yellow', '#0f0'],
  type: 'pie',
};

/**
 * @const
 */
ChartBinding.DEFAULT_OPTIONS_VARIABLE = {
  legend: 'Ejemplo de leyenda',
  label: {
    fill: '#ff0000',
    scale: 1,
    text: (value, values) => {
      return `${Math.round((value / (values.reduce((tot, curr) => tot + curr))) * 100)}%`;
    },
    radiusIncrement: 2,
    stroke: {
      color: '#000000',
      width: 1,
    },
  },
};
