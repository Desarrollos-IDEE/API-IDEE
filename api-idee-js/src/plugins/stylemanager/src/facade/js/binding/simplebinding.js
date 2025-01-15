/* eslint-disable dot-notation,no-prototype-builtins,quote-props */
import * as chroma from 'chroma-js';
import buttonoptions from 'templates/buttonoptions';
import { Binding } from './binding';
import { getValue } from '../i18n/language';

// eslint-disable-next-line
export class SimpleBinding extends Binding {
  constructor(html, htmlParent, styleType, styleParams, layer, controller) {
    super(html, htmlParent, styleType, styleParams, layer);
    this.controller_ = controller;
    this.compilePromise_.then(() => {
      this.infoListener();
    });
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

  /**
   * This function sets the geometry of binding class.
   * @function
   * @param {string}
   * @return {SimpleBinding}
   */
  setGeometry(geometry) {
    if (SimpleBinding.GEOMETRIES.includes(geometry)) {
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
    this.querySelectorAllForEach('[data-geometry]', (node) => node.classList.remove('m-hidden'));
    this.refreshOptionsButtons();
    this.addLabelPathListener();
  }

  /**
   * This function refresh the html options buttons template.
   * @function
   */
  refreshOptionsButtons() {
    const options = SimpleBinding.OPTIONS_POINT_SUBMENU;

    this.addOptionsButtons(options, () => {
      this.compatibleSectionListener('icon', 'form');
      this.compatibleSectionListener('form', 'icon');
    });
  }

  infoListener() {
    const infoButton = this.querySelector('[data-info]');
    infoButton.addEventListener('click', () => {
      M.dialog.info(getValue('infoURL'), getValue('info'));
    });
  }

  /**
   * This function sets the layer of a binding class.
   * @function
   */
  addOptionsButtons(options, callback = null) {
    const parentHtml = this.getParentTemplate().querySelector('[data-buttons-option]');
    this.hideAllOptionsSections();
    this.addTemplate(buttonoptions, parentHtml, {
      buttonsParams: options,
    }, () => {
      options.forEach((option) => {
        this.toggleCheckOptionSection(option.id);
        this.activateOptionSection(option.id);
        if (typeof callback === 'function') {
          callback();
        }
      });
      this.activateOptionsStyle();
      this.addEventCheckFromSubmenu();
    });
  }

  addEventCheckFromSubmenu() {
    this.querySelectorAllForEachParent('[data-buttons-option] input', (input) => {
      input.addEventListener('change', () => {
        this.controller_.selectPanel('stylesimple');
      });
    });
  }

  /**
   * This functions initialize the submenu view of each option of Style simple
   * @function
   */
  activateOptionsStyle() {
    const style = this.style_;
    let iconSelect = this.querySelector('#select-icon');
    iconSelect.replaceWith(iconSelect.cloneNode(true));
    iconSelect = this.querySelector('#select-icon');
    iconSelect.addEventListener('click', this.eventOpenIconSelector);
    const iconDialog = document.querySelector('.style-grid-container');
    iconDialog.addEventListener('click', this.eventSelectIcon);
    const familySelect = this.querySelector("[data-style-options='point.form.class']");
    familySelect.addEventListener('change', this.changeFamilyFont);
    const famSelector = this.querySelector(".style-col-2 > select[data-style-options = 'point.form.class']");
    const fmSIcon = famSelector.dataset.icon;
    if (fmSIcon !== '') {
      const fmSIconArray = fmSIcon.split('-');
      // eslint-disable-next-line
      const fam = fmSIconArray[0] == 'g' ? 'g-cartografia' : (fmSIconArray[0] == 'fa' ? 'fa' : '');
      famSelector.querySelector(`option[value="${fam}"]`).selected = true;
      famSelector.dispatchEvent(new window.Event('change'));
      document.querySelector('#select-icon').classList = (fam === 'fa' ? 'fa ' : '') + fmSIcon;
      document.querySelector(`.style-grid-item${fam === 'fa' ? '.fa' : ''}.${fmSIcon}`).classList.add('selected');
    }

    if (style != null && !(style instanceof M.style.FlowLine)) {
      const options = style.getOptions();
      if (options['point']['fill'] != null || options['line']['fill'] != null || options['polygon']['fill'] != null) {
        const valuesFillPoint = Object
          .values(options.point.fill).filter((value) => value !== undefined);
        const valuesFillLine = Object
          .values(options.line.fill).filter((value) => value !== undefined);
        const valuesFillPolygon = Object
          .values(options.polygon.fill).filter((value) => value !== undefined);
        if (valuesFillPoint.length > 0
          || valuesFillLine.length > 0 || valuesFillPolygon.length > 0) {
          this.checkOptionSection('fill');
        }
      }

      if (options['point']['stroke'] !== undefined || options['line']['stroke'] !== undefined || options['polygon']['stroke'] !== undefined) {
        this.checkOptionSection('stroke');
      }

      if (options['point']['label'] !== undefined) {
        this.checkOptionSection('label');
      }

      if (options['point']['icon'] !== undefined) {
        if (options['point']['icon'].hasOwnProperty('src')) {
          this.checkOptionSection('icon');
          this.disableOption('form');
        }

        if (options['point']['icon'].hasOwnProperty('form')) {
          this.checkOptionSection('form');
          this.disableOption('icon');
        }

        if (options['point']['icon'].hasOwnProperty('class')) {
          familySelect.value = options['point']['icon']['class'];
        }
      }
      if (options['polygon']['icon'] !== undefined) {
        if (options['polygon']['icon'].hasOwnProperty('src')) {
          this.checkOptionSection('icon');
          this.disableOption('form');
        }

        if (options['polygon']['icon'].hasOwnProperty('form')) {
          this.checkOptionSection('form');
          this.disableOption('icon');
        }

        if (options['polygon']['icon'].hasOwnProperty('class')) {
          familySelect.value = options['polygon']['icon']['class'];
        }
      }
      if (options['line']['icon'] !== undefined) {
        if (options['line']['icon'].hasOwnProperty('src')) {
          this.checkOptionSection('icon');
          this.disableOption('form');
        }

        if (options['line']['icon'].hasOwnProperty('form')) {
          this.checkOptionSection('form');
          this.disableOption('icon');
        }

        if (options['line']['icon'].hasOwnProperty('class')) {
          familySelect.value = options['line']['icon']['class'];
        }
      }
    }
  }

  /**
   * @function
   */
  eventOpenIconSelector(ev) {
    const iconDialog = document.querySelector('.style-grid-container');
    if (iconDialog.classList.toString() === 'style-grid-container active') { iconDialog.classList.remove('active'); } else { iconDialog.classList.add('active'); }
  }

  /**
   * @function
   */
  eventSelectIcon(ev) {
    if (!ev.target.classList.contains('selected') && ev.target.classList.contains('style-grid-item')) {
      const selected = document.querySelector('.style-grid-item.selected');
      if (selected) { selected.classList.remove('selected'); }
      ev.target.classList.add('selected');
      const iconSelected = ev.target.classList.toString().replace('selected', '').replace('style-grid-item', '').trim();
      document.querySelector("[data-style-options='point.form.class']").dataset.icon = iconSelected.replace('fa', '').trim();
      document.querySelector('#select-icon').classList = iconSelected;
    }
  }

  /**
   * @function
   */
  changeFamilyFont(ev) {
    if (ev.target.value === '') {
      document.querySelector('#select-icon').style.display = 'none';
      document.querySelector('.style-grid-container').classList.remove('active');
    } else {
      document.querySelector('#select-icon').style.display = 'inherit';
    }
    const childs = document.querySelectorAll('.style-grid-item');
    childs.forEach((elem) => {
      // eslint-disable-next-line no-param-reassign
      elem.style.display = 'none';
    });
    const childsSelected = document.querySelectorAll(`.style-grid-item[class*='${ev.target.value}']`);
    childsSelected.forEach((elem) => {
      // eslint-disable-next-line no-param-reassign
      elem.style.display = 'inherit';
    });
  }

  /**
   * This function sets the layer of a binding class.
   * @function
   */
  addLabelPathListener() {
    const pathCheckLine = this.querySelector('[data-style-options="line.label.path"]');
    pathCheckLine.addEventListener('change', () => {
      this.togglePathSection(!pathCheckLine.checked);
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
    const label = this.querySelectorParent(`[data-buttons-option] input[data-apply='${option}']+label`);
    const checkbox = this.querySelectorParent(`[data-buttons-option] input[data-apply='${option}']`);
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
      if (path === 'point.form.class' && value !== '') {
        value = this.querySelector("[data-style-options='point.form.class']").dataset.icon;
      }
      if (element.type === 'checkbox') {
        value = element.checked;
      }

      if (element.type === 'number') {
        value = parseFloat(value);
        if (Number.isNaN(value)) {
          value = 0;
        }
      }

      let isEmptyValue = false;
      const target = element.dataset['target'];
      if (target !== undefined) {
        const value1S = this.querySelector(`[data-target="${target}"]`).value;
        const value2S = this.querySelector(`[data-id="${target}"]`).value;
        isEmptyValue = (target === 'size' || target === 'anchor')
          && (!value1S && !value2S) && (parseFloat(value1S) !== 0
            && parseFloat(value2S) !== 0);
        let value2 = parseFloat(this.querySelector(`[data-id="${target}"]`).value);
        if (Number.isNaN(value2)) {
          value2 = 0;
        }
        value = [value, value2];
      }
      if (!isEmptyValue) {
        Binding.createObj(styleOpts['options'], path, value);
      }
    });

    this.querySelectorAllForEach('[data-apply]', (element) => {
      const opt = element.dataset['apply'];
      if (element.checked === false) {
        if (opt === 'point-svg') {
          Binding.createObj(styleOpts['options'], 'point.src.stroke', undefined);
          Binding.createObj(styleOpts['options'], 'point.src.fill', undefined);
        }
        Binding.createObj(styleOpts['options'], opt, undefined);
      }
    });

    const fontSizePoint = this.querySelector('[data-font-size-point]').value || 12;
    const fontFamilyPoint = this.querySelector('[data-font-family-point]').value;
    const fontPoint = `${fontSizePoint}px ${fontFamilyPoint}`;

    const fontSizePolygon = this.querySelector('[data-font-size-polygon]').value || 12;
    const fontFamilyPolygon = this.querySelector('[data-font-family-polygon]').value;
    const fontPolygon = `${fontSizePolygon}px ${fontFamilyPolygon}`;

    const fontSizeLine = this.querySelector('[data-font-size-line]').value || 12;
    const fontFamilyLine = this.querySelector('[data-font-family-line]').value;
    const fontLine = `${fontSizeLine}px ${fontFamilyLine}`;

    const icon = document.querySelector('[data-apply="icon"]');
    const iconOpts = icon !== null && icon.checked === true
      ? styleOpts['options']['point'].src
      : styleOpts['options']['point'].form;

    let labelOptPoint;
    if (styleOpts['options']['point']['label'] != null && styleOpts['options']['point']['label']['text'] != null) {
      labelOptPoint = styleOpts['options']['point']['label'];
    }
    let labelOptPolygon;
    if (styleOpts['options']['polygon']['label'] != null && styleOpts['options']['polygon']['label']['text'] != null) {
      labelOptPolygon = styleOpts['options']['polygon']['label'];
    }
    let labelOptLine;
    if (styleOpts['options']['line']['label'] != null && styleOpts['options']['line']['label']['text'] != null) {
      labelOptLine = styleOpts['options']['line']['label'];
    }

    styleOpts['options'] = {
      point: {
        fill: styleOpts['options']['point'].fill,
        stroke: styleOpts['options']['point'].stroke,
        label: labelOptPoint,
        icon: iconOpts,
        radius: styleOpts['options']['point'].radius,
      },
      line: {
        fill: styleOpts['options']['line'].fill,
        stroke: styleOpts['options']['line'].stroke,
        label: labelOptLine,
      },
      polygon: {
        fill: styleOpts['options']['polygon'].fill,
        stroke: styleOpts['options']['polygon'].stroke,
        label: labelOptPolygon,
      },
    };

    if (styleOpts['options']['point']['label'] !== undefined) {
      styleOpts['options']['point']['label']['font'] = fontPoint;
    }
    if (styleOpts['options']['polygon']['label'] !== undefined) {
      styleOpts['options']['polygon']['label']['font'] = fontPolygon;
    }
    if (styleOpts['options']['line']['label'] !== undefined) {
      styleOpts['options']['line']['label']['font'] = fontLine;
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
    styleOptsClone['options']['point']['fill'] = checkedFill === true ? styleOptsClone['options']['point']['fill'] : undefined;
    styleOptsClone['options']['point']['stroke'] = checkedStroke === true ? styleOptsClone['options']['point']['stroke'] : undefined;
    styleOptsClone['options']['point']['label'] = checkedLabel === true ? styleOptsClone['options']['point']['label'] : undefined;
    styleOptsClone['options']['point']['icon'] = checkedIcon === true || checkedForm === true ? styleOptsClone['options']['point']['icon'] : undefined;

    styleOptsClone['options']['line']['fill'] = checkedFill === true ? styleOptsClone['options']['line']['fill'] : undefined;
    styleOptsClone['options']['line']['stroke'] = checkedStroke === true ? styleOptsClone['options']['line']['stroke'] : undefined;
    styleOptsClone['options']['line']['label'] = checkedLabel === true ? styleOptsClone['options']['line']['label'] : undefined;
    styleOptsClone['options']['line']['icon'] = checkedIcon === true || checkedForm === true ? styleOptsClone['options']['line']['icon'] : undefined;

    styleOptsClone['options']['polygon']['fill'] = checkedFill === true ? styleOptsClone['options']['polygon']['fill'] : undefined;
    styleOptsClone['options']['polygon']['stroke'] = checkedStroke === true ? styleOptsClone['options']['polygon']['stroke'] : undefined;
    styleOptsClone['options']['polygon']['label'] = checkedLabel === true ? styleOptsClone['options']['polygon']['label'] : undefined;
    styleOptsClone['options']['polygon']['icon'] = checkedIcon === true || checkedForm === true ? styleOptsClone['options']['polygon']['icon'] : undefined;

    styleOptsClone['point'] = {
      fill: styleOptsClone['options']['point'].fill,
      radius: styleOptsClone['options']['point'].radius,
      stroke: styleOptsClone['options']['point'].stroke,
      label: styleOptsClone['options']['point'].label,
      icon: styleOptsClone['options']['point'].icon,
    };

    styleOptsClone['line'] = {
      fill: styleOptsClone['options']['line'].fill,
      stroke: styleOptsClone['options']['line'].stroke,
      label: styleOptsClone['options']['line'].label,
    };

    styleOptsClone['polygon'] = {
      fill: styleOptsClone['options']['polygon'].fill,
      stroke: styleOptsClone['options']['polygon'].stroke,
      label: styleOptsClone['options']['polygon'].label,
    };
    delete styleOptsClone['options'];

    return styleOptsClone;
  }

  /**
   * @function
   */
  isChecked(option) {
    let checked = false;
    const input = this.getParentTemplate().querySelector(`[data-buttons-option] input[data-apply='${option}'`);
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
    // let geometry = this.getGeometry();
    const styleOptions = this.generateOptions();
    return new M.style.Generic(styleOptions);
  }

  /**
   * This function adds the listener click event that shows the compatible sections buttons.
   * @param {string}
   * @param {string}
   */
  compatibleSectionListener(optionEnable, optionDisable) {
    const input = this.querySelectorParent(`[data-buttons-option] input[data-apply="${optionEnable}"]`);
    if (input != null) {
      input.addEventListener('change', () => {
        if (input.checked === true) {
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
    let options = SimpleBinding.DEFAULT_OPTIONS_STYLE;
    if (this.style_ != null) {
      options = M.utils.extends({}, this.style_.getOptions());
      options = M.utils.extends(options, SimpleBinding.DEFAULT_OPTIONS_STYLE);

      if (this.style_.get('polygon.fill.pattern') != null) {
        options['polygon']['patternfflag'] = true;
      }
      if (this.style_.get('polygon.stroke.pattern') != null) {
        options['polygon']['patternstflag'] = true;
      }
      if (this.style_.get('line.fill.pattern') != null) {
        options['line']['patternflag'] = true;
      }

      if (this.style_.get('point.icon') != null && this.style_.get('point.icon.src') != null
        && (this.style_.get('point.icon.fill') != null || this.style_.get('point.icon.stroke') != null)) {
        options['point']['svgflag'] = true;
      }
    }

    // transform color options to hex color for value inputs color

    options['point']['fill']['color'] = options['point']['fill']['color'].indexOf('rgba') >= 0 ? chroma(chroma(options['point']['fill']['color']).rgb()).hex() : chroma(options['point']['fill']['color']).hex();
    options['line']['fill']['color'] = options['line']['fill']['color'].indexOf('rgba') >= 0 ? chroma(chroma(options['line']['fill']['color']).rgb()).hex() : chroma(options['line']['fill']['color']).hex();
    options['polygon']['fill']['color'] = options['polygon']['fill']['color'].indexOf('rgba') >= 0 ? chroma(chroma(options['polygon']['fill']['color']).rgb()).hex() : chroma(options['polygon']['fill']['color']).hex();
    options['point']['stroke']['color'] = options['point']['stroke']['color'].indexOf('rgba') >= 0 ? chroma(chroma(options['point']['stroke']['color']).rgb()).hex() : chroma(options['point']['stroke']['color']).hex();
    options['line']['stroke']['color'] = options['line']['stroke']['color'].indexOf('rgba') >= 0 ? chroma(chroma(options['line']['stroke']['color']).rgb()).hex() : chroma(options['line']['stroke']['color']).hex();
    options['polygon']['stroke']['color'] = options['polygon']['stroke']['color'].indexOf('rgba') >= 0 ? chroma(chroma(options['polygon']['stroke']['color']).rgb()).hex() : chroma(options['polygon']['stroke']['color']).hex();
    options['polygon']['fill']['pattern']['color'] = chroma(options['polygon']['fill']['pattern']['color']).hex();
    options['polygon']['stroke']['pattern']['color'] = chroma(options['polygon']['stroke']['pattern']['color']).hex();
    options['point']['icon']['color'] = chroma(options['point']['icon']['color']).hex();
    options['line']['fill']['pattern']['color'] = chroma(options['polygon']['fill']['pattern']['color']).hex();
    // --

    const patternValids = Object.keys(M.style.pattern).filter((name) => name !== 'ICON' && name !== 'IMAGE');
    const alignValues = Object.values(M.style.align);
    const baselineValues = Object.values(M.style.baseline);
    const formValues = Object.values(M.style.form).filter((name) => name != null);
    const linejoins = [getValue('bevel'), getValue('miter'), getValue('rounded')];
    const linecapstrokes = [getValue('rounded'), getValue('extreme'), getValue('square')];
    const alings = [getValue('center'), getValue('justified'), getValue('left'), getValue('right')];

    // transform array options to data template option
    options['line']['patternlist'] = SimpleBinding.arrayDataToTemplate(options['line']['fill']['pattern']['name'], patternValids, patternValids);
    options['polygon']['patternflist'] = SimpleBinding.arrayDataToTemplate(options['polygon']['fill']['pattern']['name'], patternValids, patternValids);
    options['polygon']['patternstlist'] = SimpleBinding.arrayDataToTemplate(options['polygon']['stroke']['pattern']['name'], patternValids, patternValids);
    options['point']['linecapstroke'] = SimpleBinding.arrayDataToTemplate(options['point']['stroke']['linecap'], ['butt', 'square', 'round'], linecapstrokes);
    options['line']['linecapstroke'] = SimpleBinding.arrayDataToTemplate(options['line']['stroke']['linecap'], ['butt', 'square', 'round'], linecapstrokes);
    options['polygon']['linecapstroke'] = SimpleBinding.arrayDataToTemplate(options['polygon']['stroke']['linecap'], ['butt', 'square', 'round'], linecapstrokes);
    options['point']['linejoinstroke'] = SimpleBinding.arrayDataToTemplate(options['point']['stroke']['linejoin'], ['bevel', 'miter', 'round'], linejoins);
    options['line']['linejoinstroke'] = SimpleBinding.arrayDataToTemplate(options['line']['stroke']['linejoin'], ['bevel', 'miter', 'round'], linejoins);
    options['polygon']['linejoinstroke'] = SimpleBinding.arrayDataToTemplate(options['polygon']['stroke']['linejoin'], ['bevel', 'miter', 'round'], linejoins);
    options['point']['linecaplabelstroke'] = SimpleBinding.arrayDataToTemplate(options['point']['label']['stroke']['linecap'], ['butt', 'square', 'round'], linecapstrokes);
    options['line']['linecaplabelstroke'] = SimpleBinding.arrayDataToTemplate(options['line']['label']['stroke']['linecap'], ['butt', 'square', 'round'], linecapstrokes);
    options['polygon']['linecaplabelstroke'] = SimpleBinding.arrayDataToTemplate(options['polygon']['label']['stroke']['linecap'], ['butt', 'square', 'round'], linecapstrokes);
    options['point']['linejoinlabelstroke'] = SimpleBinding.arrayDataToTemplate(options['point']['label']['stroke']['linejoin'], ['bevel', 'miter', 'round'], linejoins);
    options['polygon']['linejoinlabelstroke'] = SimpleBinding.arrayDataToTemplate(options['polygon']['label']['stroke']['linejoin'], ['bevel', 'miter', 'round'], linejoins);
    options['line']['linejoinlabelstroke'] = SimpleBinding.arrayDataToTemplate(options['line']['label']['stroke']['linejoin'], ['bevel', 'miter', 'round'], linejoins);
    options['point']['alignlist'] = SimpleBinding.arrayDataToTemplate(options['point']['label']['align'], alignValues, alings);
    options['polygon']['alignlist'] = SimpleBinding.arrayDataToTemplate(options['polygon']['label']['align'], alignValues, alings);
    options['line']['alignlist'] = SimpleBinding.arrayDataToTemplate(options['line']['label']['align'], alignValues, alings);

    const baseLines = [getValue('alphabetical'), getValue('down'), getValue('hanging'), getValue('ideographic'), getValue('up')];

    options['point']['baselinelist'] = SimpleBinding.arrayDataToTemplate(options['point']['label']['baseline'], baselineValues, baseLines);
    options['polygon']['baselinelist'] = SimpleBinding.arrayDataToTemplate(options['polygon']['label']['baseline'], baselineValues, baseLines);
    options['line']['baselinelist'] = SimpleBinding.arrayDataToTemplate(options['line']['label']['baseline'], baselineValues, baseLines);

    options['point']['formlist'] = SimpleBinding.arrayDataToTemplate(options['point']['icon']['form'], formValues, formValues);
    if (this.layer_ != null) {
      const labelTextValues = Object.keys(this.getFeaturesAttributes());
      const labelTextSelectedPoint = options['point']['label'] != null ? options['point']['label']['text'] : '';
      const labelTextSelectedPolygon = options['polygon']['label'] != null ? options['polygon']['label']['text'] : '';
      const labelTextSelectedLine = options['line']['label'] != null ? options['line']['label']['text'] : '';

      options['point']['featuresAttr'] = SimpleBinding.arrayDataToTemplate(labelTextSelectedPoint, labelTextValues.map((name) => `{{${name}}}`), labelTextValues);
      options['polygon']['featuresAttr'] = SimpleBinding.arrayDataToTemplate(labelTextSelectedPolygon, labelTextValues.map((name) => `{{${name}}}`), labelTextValues);
      options['line']['featuresAttr'] = SimpleBinding.arrayDataToTemplate(labelTextSelectedLine, labelTextValues.map((name) => `{{${name}}}`), labelTextValues);
    }

    options['point']['label']['fontSize'] = options['point']['label']['font'].split(' ')[0].replace('px', '');
    options['point']['label']['font'] = options['point']['label']['font'].split(' ')[1];
    options['line']['label']['fontSize'] = options['line']['label']['font'].split(' ')[0].replace('px', '');
    options['line']['label']['font'] = options['line']['label']['font'].split(' ')[1];
    options['polygon']['label']['fontSize'] = options['polygon']['label']['font'].split(' ')[0].replace('px', '');
    options['polygon']['label']['font'] = options['polygon']['label']['font'].split(' ')[1];

    // icon SVG
    if (typeof options['point']['icon']['fill'] === 'string') {
      options['point']['icon']['fill'] = chroma(options['point']['icon']['fill']).hex();
      options['point']['src'] = {
        fill: { color: '#000000', opacity: 1 },
        stroke: { color: '#000000', width: 1 },
      };
    } else {
      options['point']['src'] = {
        fill: {
          color: chroma(options['point']['icon']['fill']['color']).hex() || '#000000',
          opacity: options['point']['icon']['fill']['opacity'] || 1,
        },
        stroke: {
          color: chroma(options['point']['icon']['stroke']['color']).hex() || '#000000',
          width: options['point']['icon']['stroke']['width'] || 1,
        },
      };
    }
    return options;
  }

  set imgId(id) {
    this.imgId_ = id;
  }

  get imgId() {
    return this.imgId_;
  }

  toggleDisplaySubmenu(flag) {
    const buttonOptions = this.getParentTemplate().querySelector('[data-buttons-option]');
    const funct = flag === true ? 'add' : 'remove';
    buttonOptions.classList[funct]('m-hidden');
  }

  /**
   * @function
   * @param {function}
   */
  refreshLegend(element, flag = false) {
    const id = this.imgId_;
    let style = this.generateStyle();
    if (flag === true) {
      style = this.style_;
    }
    if (style != null) {
      style = style.clone();
      if (style instanceof M.style.Point) {
        style.set('radius', SimpleBinding.RADIUS_OPTION);
        if (style.get('icon.radius') != null) {
          style.set('icon.radius', SimpleBinding.ICON_RADIUS_OPTION);
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
    const def = {
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
        text: '',
        font: '14px serif',
        align: 'center',
        baseline: 'top',
        rotate: false,
        rotation: 0,
        offset: [0, 0],
      },
      icon: {
        src: '',
        size: ['', ''],
        anchor: ['', ''],
        scale: 1,
        offset: [0, 0],
        rotate: false,
        rotation: 0,
        opacity: 1,
        form: 'CIRCLE',
        class: 'g-cartografia-info',
        fill: '#ffffff',
        color: '#e07e18',
      },
    };
    return {
      'point': M.utils.extends({}, def),
      'line': M.utils.extends({}, def),
      'polygon': M.utils.extends({}, def),
    };
  }
}
