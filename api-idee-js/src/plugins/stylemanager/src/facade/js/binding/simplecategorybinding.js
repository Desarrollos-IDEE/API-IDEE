/* eslint-disable dot-notation,no-prototype-builtins */
import * as chroma from 'chroma-js';
import { getValue } from '../i18n/language';
import { Binding } from './binding';

// eslint-disable-next-line
export class SimpleCategoryBinding extends Binding {
  constructor(html, htmlParent, styleType, styleParams, layer, binding) {
    super(html, htmlParent, styleType, styleParams, layer);
    this.fill_ = false;
    this.stroke_ = false;
    this.label_ = false;
    this.form_ = false;
    this.icon_ = false;
    if (styleParams != null) {
      this.fill_ = styleParams.getOptions().fill !== undefined;
      this.stroke_ = styleParams.getOptions().stroke !== undefined;
      this.label_ = styleParams.getOptions().label !== undefined;
      this.icon_ = styleParams.get('icon.src') !== undefined;
      this.form_ = styleParams.get('icon.form') !== undefined;
    }

    this.binding_ = binding;
  }

  /**
   * This function sets the layer of a binding class.
   * @function
   * @param {M.layer.Vector}
   * @returns {Binding}
   */
  setLayer(layer, refresh = true) {
    this.layer_ = layer;
    if (refresh === true) {
      this.refreshTemplate();
    }
    return this;
  }

  getOptions() {
    return {
      fill: this.fill_,
      stroke: this.stroke_,
      label: this.label_,
      form: this.form_,
      icon: this.icon_,
    };
  }

  /**
   * This function sets the geometry of binding class.
   * @function
   * @param {string}
   * @return {SimpleCategoryBinding}
   */
  setGeometry(geometry) {
    if (SimpleCategoryBinding.GEOMETRIES.includes(geometry)) {
      this.geometry_ = geometry;
    } else {
      this.geometry_ = 'point';
    }
    return this;
  }

  /**
   * This function sets the geometry of binding class.
   * @function
   * @return {string}
   */
  getGeometry() {
    return this.geometry_;
  }

  /**
   * This function refresh the html template.
   * @function
   */
  refreshTemplate() {
    const geometry = this.getGeometry();
    const hiddenGeometries = SimpleCategoryBinding
      .GEOMETRIES.filter((section) => section !== geometry);
    hiddenGeometries.push('pattern');
    hiddenGeometries.forEach((geo) => {
      if ((geometry === 'point' && geo === 'pattern') || geo !== 'pattern') {
        this.querySelectorAllForEach(`[data-geometry="${geo}"]`, (node) => node.classList.add('m-hidden'));
      }
    });
    this.querySelectorAllForEach(`[data-geometry="${geometry}"]`, (node) => node.classList.remove('m-hidden'));
    this.addLabelPathListener();
  }

  /**
   * This functions initialize the submenu view of each option of Style simple
   * @function
   */
  activateOptionsStyle() {
    const style = this.style_;
    if (style != null) {
      const options = style.getOptions();
      if (options['fill'] != null) {
        const valuesFill = Object.values(options.fill).filter((value) => value !== undefined);
        if (valuesFill.length > 0) {
          this.checkOptionSection('fill');
        }
      }

      if (options['stroke'] !== undefined) {
        this.checkOptionSection('stroke');
      }

      if (options['label'] !== undefined) {
        this.checkOptionSection('label');
      }

      if (options['icon'] !== undefined) {
        if (options['icon'].hasOwnProperty('src')) {
          this.checkOptionSection('icon');
          this.disableOption('form');
        }

        if (options['icon'].hasOwnProperty('form')) {
          this.checkOptionSection('form');
          this.disableOption('icon');
        }
      }
    }
  }

  showCompatibleSections() {
    this.binding_.enableOption('form');
    this.binding_.enableOption('icon');
    if (this.icon_ === true) {
      this.binding_.disableOption('form');
    }

    if (this.form_ === true) {
      this.binding_.disableOption('icon');
    }
  }

  /**
   * This function sets the layer of a binding class.
   * @function
   */
  addLabelPathListener() {
    const pathCheck = this.querySelector("[data-style-options='label.path']");
    pathCheck.addEventListener('change', () => {
      this.togglePathSection(!pathCheck.checked);
    });
  }

  /**
   * @function
   */
  togglePathSection(flag) {
    this.querySelectorAllForEach('[data-textpath]', (element) => {
      // eslint-disable-next-line no-param-reassign
      element.disabled = flag === true ? flag : false;
    });
  }

  /**
   * This function sets the layer of a binding class.
   * @function
   * @param {M.layer.Vector}
   * @returns {Binding}
   */
  toggleCheckOptionSection(option) {
    const clickable = this.getParentTemplate().querySelector(`[data-buttons-option] input[data-apply='${option}']`);
    clickable.addEventListener('change', (event) => {
      this.toggleCheckOptSectionListener(option, event);
    });
  }

  /**
   * @function
   */
  toggleCheckOptSectionListener(option, event) {
    if (event.target.checked === true) {
      this.activateOption(option);
    }
  }

  /**
   * @function
   */
  checkOptionSection(option) {
    const inputSection = this.getParentTemplate().querySelector(`[data-buttons-option] input[data-apply='${option}']`);
    this.activateOption(option);
    inputSection.checked = true;
  }

  /**
   * This function sets the layer of a binding class.
   * @function
   * @param {M.layer.Vector}
   * @returns {Binding}
   */
  activateOptionSection(option) {
    const clickable = this.getParentTemplate().querySelector(`[data-buttons-option] [data-label='${option}']`);
    clickable.addEventListener('click', () => {
      this.activateOption(option);
    });
  }

  /**
   * This function sets the layer of a binding class.
   * @function
   * @param {M.layer.Vector}
   * @returns {Binding}
   */
  activateOption(option) {
    const label = this.querySelectorParent(`[data-buttons-option] input[data-apply="${option}"]+label`);
    const checkbox = this.querySelectorParent(`[data-buttons-option] input[data-apply="${option}"]`);
    if (checkbox != null && checkbox.disabled === false) {
      this.activateLabel(label);
      this.displaySectionOption(option);
    }
  }

  /**
   * This function sets the layer of a binding class.
   * @function
   * @param {M.layer.Vector}
   * @returns {Binding}
   */
  activateLabel(label) {
    this.querySelectorAllForEachParent('[data-selector]', (element) => {
      element.classList.remove('check-active');
      element.classList.add('check-selected');
    });
    label.classList.add('check-active');
    label.classList.remove('check-selected');
  }

  /**
   * This function sets the layer of a binding class.
   * @function
   * @param {M.layer.Vector}
   * @returns {Binding}
   */
  displaySectionOption(option) {
    this.hideAllOptionsSections();
    this.showOptionSection(option);
  }

  /**
   * This function generates the style simple options.
   * @return {object}
   */
  generateOptions() {
    const styleOpts = {};
    styleOpts['options'] = {};

    this.querySelectorAllForEach('[data-style-options]', (element) => {
      const path = element.dataset['styleOptions'];
      let value = element.value;
      if (element.type === 'checkbox') {
        value = element.checked;
      }

      if (element.type === 'number') {
        value = parseFloat(value);
        if (Number.isNaN(value)) {
          value = 0;
        }
      }

      const target = element.dataset['target'];
      if (target !== undefined) {
        let value2 = parseFloat(this.querySelector(`[data-id='${target}']`).value);
        if (Number.isNaN(value2)) {
          value2 = 0;
        }
        value = [value, value2];
      }
      Binding.createObj(styleOpts['options'], path, value);
    });

    this.querySelectorAllForEach('[data-apply]', (element) => {
      const opt = element.dataset['apply'];
      if (element.checked === false) {
        Binding.createObj(styleOpts['options'], opt, undefined);
      }
    });

    const fontSize = this.querySelector('[data-font-size]').value || 12;
    const fontFamily = this.querySelector('[data-font-family]').value;

    const font = `${fontSize}px ${fontFamily}`;

    const iconOpts = this.icon === true ? styleOpts['options'].src : styleOpts['options'].form;

    let labelOpt;
    if (styleOpts['options']['label'] != null && styleOpts['options']['label']['text'] != null) {
      labelOpt = styleOpts['options']['label'];
    }

    styleOpts['options'] = {
      fill: styleOpts['options'].fill,
      stroke: styleOpts['options'].stroke,
      label: labelOpt,
      icon: iconOpts,
      radius: styleOpts['options'].radius,
    };

    if (this.getGeometry() === 'line') {
      styleOpts['options'] = {
        fill: styleOpts['options'].fill,
        stroke: styleOpts['options'].stroke,
        label: styleOpts['options'].label,
      };

      delete styleOpts['options']['fill']['pattern'];
      if (Object.keys(styleOpts['options']['fill']).length === 0) {
        delete styleOpts['options']['fill'];
      }
    }

    if (this.getGeometry() === 'polygon') {
      styleOpts['options'] = {
        fill: styleOpts['options'].fill,
        stroke: styleOpts['options'].stroke,
        label: styleOpts['options'].label,
      };
    }

    if (styleOpts['options']['label'] !== undefined) {
      styleOpts['options']['label']['font'] = font;
    }

    return this.processOptions(styleOpts);
  }

  /**
   * This function process de style generate options
   * @function
   */
  processOptions(styleOpts) {
    const styleOptsClone = M.utils.extends({}, styleOpts);
    const checkedFill = this.isChecked('fill');
    const checkedStroke = this.isChecked('stroke');
    const checkedLabel = this.isChecked('label');
    const checkedIcon = this.isChecked('icon');
    const checkedForm = this.isChecked('form');
    styleOptsClone['options']['fill'] = checkedFill === true ? styleOptsClone['options']['fill'] : undefined;
    styleOptsClone['options']['stroke'] = checkedStroke === true ? styleOptsClone['options']['stroke'] : undefined;
    styleOptsClone['options']['label'] = checkedLabel === true ? styleOptsClone['options']['label'] : undefined;
    styleOptsClone['options']['icon'] = checkedIcon === true || checkedForm === true ? styleOptsClone['options']['icon'] : undefined;
    return styleOptsClone;
  }

  /**
   * @function
   */
  isChecked(option) {
    let checked = false;
    const input = this.getParentTemplate().parentElement.querySelector(`[data-buttons-option-category] input[data-apply='${option}'`);
    if (input != null) {
      checked = input.checked;
    }
    return checked;
  }

  /**
   * This function generates the style simple.
   * @return {M.style.Simple}
   */
  generateStyle() {
    let style;
    const geometry = this.getGeometry();
    const styleOptions = this.generateOptions().options;

    switch (geometry) {
      case 'point':
        style = new M.style.Point(styleOptions);
        break;
      case 'line':
        style = new M.style.Line(styleOptions);
        break;
      case 'polygon':
        style = new M.style.Polygon(styleOptions);
        break;

      default:
        M.dialog.error(getValue('exception.geomNotSupported'), 'Error');
    }

    return style;
  }

  /**
   * This function adds the listener click event that shows the compatible sections buttons.
   * @param {string}
   * @param {string}
   */
  compatibleSectionListener(optionEnable, optionDisable) {
    const clickable = this.querySelectorParent(`[data-buttons-option] input[data-apply="${optionEnable}"]+label`);
    const input = this.querySelectorParent(`[data-buttons-option] input[data-apply="${optionEnable}"]`);
    if (clickable != null) {
      clickable.addEventListener('click', () => {
        if (input.checked === false) {
          this.disableOption(optionDisable);
        } else {
          this.enableOption(optionDisable);
        }
      });
    }
  }

  /**
   * This function disable a button options passed by paramenter.
   * @function
   * @param {string}
   */
  disableOption(option) {
    const input = this.getParentTemplate().querySelector(`[data-buttons-option] input[data-apply="${option}"]`);
    const clickable = this.getParentTemplate().querySelector(`[data-buttons-option] input[data-apply="${option}"]+label`);
    this.hideOptionSection(option);
    clickable.classList.add('check-inactive');
    clickable.classList.add('check-selected');
    clickable.classList.remove('m-option-active');
    input.disabled = true;
    input.checked = false;
  }

  /**
   * This function enable a button options passed by paramenter.
   * @function
   * @param {string}
   */
  enableOption(option) {
    const input = this.getParentTemplate().querySelector(`[data-buttons-option] input[data-apply="${option}"]`);
    const clickable = this.getParentTemplate().querySelector(`[data-buttons-option] input[data-apply="${option}"]+label`);
    clickable.classList.remove('check-inactive');
    input.disabled = false;
  }

  /**
   * @function
   *
   */
  getOptionsTemplate() {
    let options = SimpleCategoryBinding.DEFAULT_OPTIONS_STYLE;
    if (this.style_ != null) {
      if (this.style_.get('fill.pattern') != null) {
        options['patternflag'] = true;
      }
      options = M.utils.extends({}, this.style_.getOptions());
      options = M.utils.extends(options, SimpleCategoryBinding.DEFAULT_OPTIONS_STYLE);
    }

    // transform color options to hex color for value inputs color
    options['fill']['color'] = chroma(options['fill']['color']).hex();
    options['stroke']['color'] = chroma(options['stroke']['color']).hex();
    options['label']['fill']['color'] = chroma(options['label']['fill']['color']).hex();
    options['label']['stroke']['color'] = options['label']['stroke']['color'] === 'no-color' ? 'no-color' : chroma(options['label']['stroke']['color']).hex();
    options['fill']['pattern']['color'] = chroma(options['fill']['pattern']['color']).hex();
    options['icon']['fill'] = chroma(options['icon']['fill']).hex();
    options['icon']['gradientcolor'] = chroma(options['icon']['gradientcolor']).hex();
    // --

    const patternValids = Object.keys(M.style.pattern).filter((name) => name !== 'ICON' && name !== 'IMAGE');
    const alignValues = Object.values(M.style.align);
    const baselineValues = Object.values(M.style.baseline);
    const formValues = Object.values(M.style.form).filter((name) => name != null);
    const linejoins = [getValue('bevel'), getValue('miter'), getValue('rounded')];
    const linecapstrokes = [getValue('rounded'), getValue('extreme'), getValue('square')];

    // transform array options to data template option
    options['patternlist'] = SimpleCategoryBinding.arrayDataToTemplate(options['fill']['pattern']['name'], patternValids, patternValids);
    options['linecapstroke'] = SimpleCategoryBinding.arrayDataToTemplate(options['stroke']['linecap'], ['butt', 'square', 'round'], linecapstrokes);
    options['linejoinstroke'] = SimpleCategoryBinding.arrayDataToTemplate(options['stroke']['linejoin'], ['bevel', 'miter', 'round'], linejoins);
    options['linecaplabelstroke'] = SimpleCategoryBinding.arrayDataToTemplate(options['label']['stroke']['linecap'], ['butt', 'square', 'round'], linecapstrokes);
    options['linejoinlabelstroke'] = SimpleCategoryBinding.arrayDataToTemplate(options['label']['stroke']['linejoin'], ['bevel', 'miter', 'round'], linejoins);
    options['alignlist'] = SimpleCategoryBinding.arrayDataToTemplate(options['label']['align'], alignValues, alignValues);
    options['baselinelist'] = SimpleCategoryBinding.arrayDataToTemplate(options['label']['baseline'], baselineValues, baselineValues);
    options['formlist'] = SimpleCategoryBinding.arrayDataToTemplate(options['icon']['form'], formValues, formValues);
    if (this.layer_ != null) {
      const labelTextValues = Object.keys(this.getFeaturesAttributes());
      const labelTextSelected = options['label'] != null ? options['label']['text'] : '';
      options['featuresAttr'] = SimpleCategoryBinding.arrayDataToTemplate(labelTextSelected, labelTextValues.map((name) => `{{${name}}}`), labelTextValues);
    }
    return options;
  }

  set imgId(id) {
    this.imgId_ = id;
  }

  get imgId() {
    return this.imgId_;
  }

  set fill(bool) {
    this.fill_ = bool;
  }

  set stroke(bool) {
    this.stroke_ = bool;
  }

  set label(bool) {
    this.label_ = bool;
  }

  set form(bool) {
    this.form_ = bool;
  }

  set icon(bool) {
    this.icon_ = bool;
  }

  get fill() {
    return this.fill_;
  }

  get stroke() {
    return this.stroke_;
  }

  get label() {
    return this.label_;
  }

  get form() {
    return this.form_;
  }

  get icon() {
    return this.icon_;
  }

  toggleDisplaySubmenu(flag) {
    const buttonOptions = this.getParentTemplate().querySelector('[data-buttons-option]');
    const funct = flag === true ? 'add' : 'remove';
    buttonOptions.classList[funct]('m-hidden');
  }

  addLegendListener() {
    this.querySelectorAllForEach('input,select,div.m-boxes', (element) => {
      if (element instanceof window.HTMLDivElement) {
        element.addEventListener('click', () => {
          this.refreshLegend(element);
        });
      } else if (element instanceof window.HTMLSelectElement) {
        element.addEventListener('change', () => {
          this.refreshLegend(element);
        });
      } else {
        element.addEventListener('input', () => {
          this.refreshLegend(element);
        });
      }
    });
  }

  /**
   * @function
   * @param {function}
   */
  refreshLegend(element, flag) {
    const id = this.imgId_;
    let style = this.generateStyle();
    if (flag === true) {
      style = this.style_;
    }
    if (style != null) {
      this.style_ = style;
      style = style.clone();
      if (style instanceof M.style.Point) {
        style.set('radius', SimpleCategoryBinding.RADIUS_OPTION);
        if (style.get('icon.radius') != null) {
          style.set('icon.radius', SimpleCategoryBinding.ICON_RADIUS_OPTION);
        }
      }
      const img = this.htmlParent_.querySelector(`img[id='img-${id}']`);
      style.updateCanvas();
      const dataURL = style.toImage();
      if (img != null) {
        img.src = dataURL;
      }
    }
  }

  /**
   * TODO
   * @const
   */
  static get RADIUS_OPTION() {
    return 10;
  }

  /**
   * TODO
   * @const
   */
  static get ICON_RADIUS_OPTION() {
    return 10;
  }

  get style() {
    return this.style_;
  }

  /**
   * TODO
   * @const
   */
  static get OPTIONS_POINT_SUBMENU() {
    return [{
      id: 'fill',
      name: getValue('fill'),
    }, {
      id: 'stroke',
      name: getValue('stroke'),
    }, {
      id: 'label',
      name: getValue('labelText'),
    }, {
      id: 'icon',
      name: getValue('icon'),
    }, {
      id: 'form',
      name: getValue('font'),
    }];
  }

  /**
   * TODO
   * @const
   */
  static get OPTIONS_SUBMENU() {
    return [{
      id: 'fill',
      name: getValue('fill'),
    }, {
      id: 'stroke',
      name: getValue('stroke'),
    }, {
      id: 'label',
      name: getValue('labelText'),
    }];
  }

  /**
   * Array of allowed geometries.
   * @const {Array<string>}
   */
  static get GEOMETRIES() {
    return ['point', 'line', 'polygon'];
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
   * @const
   */
  static get DEFAULT_OPTIONS_STYLE() {
    return {
      radius: 10,
      fill: {
        color: '#e5008a',
        opacity: 1,
        width: 2,
        pattern: {
          color: 'red',
          name: 'HATCH',
          size: 1,
          spacing: 2,
          scale: 3,
          offset: 5,
          rotation: 0,
        },
      },
      stroke: {
        color: '#000000',
        opacity: 1,
        width: 2,
        linedash: [0, 0],
        linedashoffset: 0,
        linecap: 'none',
        linejoin: 'none',
      },
      label: {
        fill: {
          color: '#ff0000',
        },
        stroke: {
          color: 'no-color',
          width: 2,
          linedash: [0, 0],
          linedashoffset: 0,
          linecap: 'none',
          linejoin: 'none',
        },
        scale: 2,
        text: 'Texto de prueba',
        font: '14px serif',
        align: 'center',
        baseline: 'top',
        rotate: false,
        rotation: 0,
        offset: [0, 0],
      },
      icon: {
        src: '',
        size: [40, 40],
        anchor: [0, 0],
        scale: 1,
        offset: [0, 0],
        rotation: 0,
        opacity: 1,
        form: 'CIRCLE',
        fill: '#ffffff',
        gradientcolor: '#e07e18',
      },
    };
  }
}
