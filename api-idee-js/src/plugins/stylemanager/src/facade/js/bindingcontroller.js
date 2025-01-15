/* eslint-disable dot-notation,no-prototype-builtins,no-param-reassign,no-return-assign */
import stylesimple from 'templates/stylesimple';
import styleproportional from 'templates/styleproportional';
import stylecluster from 'templates/stylecluster';
import stylechoropleth from 'templates/stylechoropleth';
import stylecategory from 'templates/stylecategory';
import styleheatmap from 'templates/styleheatmap';
import stylechart from 'templates/stylechart';
import styleflowline from 'templates/styleflowline';
import { SimpleBinding } from './binding/simplebinding';
import { ProportionalBinding } from './binding/proportionalbinding';
import { ClusterBinding } from './binding/clusterbinding';
import { HeatmapBinding } from './binding/heatmapbinding';
import { ChoroplethBinding } from './binding/choroplethbinding';
import { CategoryBinding } from './binding/categorybinding';
import { ChartBinding } from './binding/chartbinding';
import { getValue } from './i18n/language';
import { FlowLineBinding } from './binding/flowlinebinding';

export default class BindingController {
  constructor(htmlParent) {
    this.layer_ = null;
    this.activePanel_ = null;
    this.selectedPanels_ = [];
    this.html_ = htmlParent;
    this.renderViews(null);
  }

  getStyles(layer, styleType) {
    let styleBinding = null;
    if (layer != null) {
      const style = layer.getStyle();

      if (style instanceof styleType) {
        styleBinding = style;
      } else if (style instanceof M.style.Composite) {
        const styles = style.getStyles();
        styleBinding = styles.find((styleEl) => styleEl instanceof styleType);
      }
    }
    return styleBinding;
  }

  renderViews(layer) {
    this.bindings_ = {};
    this.bindings_['stylesimple'] = new SimpleBinding(stylesimple, this.html_, 'stylesimple', this.getStyles(layer, M.style.Simple), layer, this);
    this.bindings_['styleproportional'] = new ProportionalBinding(styleproportional, this.html_, 'styleproportional', this.getStyles(layer, M.style.Proportional), layer);
    this.bindings_['stylecluster'] = new ClusterBinding(stylecluster, this.html_, 'stylecluster', this.getStyles(layer, M.style.Cluster), layer);
    this.bindings_['stylechoropleth'] = new ChoroplethBinding(stylechoropleth, this.html_, 'stylechoropleth', this.getStyles(layer, M.style.Choropleth), layer);
    this.bindings_['styleheatmap'] = new HeatmapBinding(styleheatmap, this.html_, 'styleheatmap', this.getStyles(layer, M.style.Heatmap), layer);
    this.bindings_['stylechart'] = new ChartBinding(stylechart, this.html_, 'stylechart', this.getStyles(layer, M.style.Chart), layer);
    this.bindings_['stylecategory'] = new CategoryBinding(stylecategory, this.html_, 'stylecategory', this.getStyles(layer, M.style.Category), layer, this);
    this.bindings_['styleflowline'] = new FlowLineBinding(styleflowline, this.html_, 'styleflowline', this.getStyles(layer, M.style.FlowLine), layer);

    this.bindings_['stylesimple'].getCompilePromise().then(() => {
      this.addSelectOnChangeListener();
      this.addEventSubtitle();
    });
    this.allCompilePromises_ = this.getBindings().map((binding) => binding.getCompilePromise());
  }

  getAllCompilePromises() {
    return this.allCompilePromises_;
  }

  renderViewsPromise() {
    const promises = Object.values(this.bindings_).map((binding) => binding.getCompilePromise());
    return Promise.all(promises);
  }

  destroyViews() {
    Object.values(this.bindings_).forEach((binding) => binding.destroy());
  }

  /**
   * @function
   */
  getActivePanel() {
    return this.activePanel_;
  }

  /**
   * @function
   */
  setActivePanel(style) {
    Object.values(this.bindings_).forEach((binding) => binding.setActivated(false));
    this.activePanel_ = this.bindings_[style];
    this.activePanel_.setActivated(true);
    if (style === 'stylesimple') {
      this.bindings_['stylesimple'].toggleDisplaySubmenu(false);
    } else {
      this.bindings_['stylesimple'].toggleDisplaySubmenu(true);
    }
  }

  /**
   * @function
   */
  getSelectedPanels() {
    return this.selectedPanels_.map((selected) => this.bindings_[selected]);
  }

  /**
   * @function
   */
  addSelectedPanel(style) {
    if (!this.selectedPanels_.includes(style)) {
      this.selectedPanels_.push(style);
      this.bindings_[style].setSelected(true);
    }
  }

  selectPanel(style) {
    this.html_.querySelector(`[data-checkbox='${style}']`).checked = true;
    this.addSelectedPanel(style);
  }

  /**
   * @function
   */
  removeSelectedPanel(style) {
    this.selectedPanels_ = this.selectedPanels_.filter((style2) => style2 !== style);
    this.bindings_[style].setSelected(false);
  }

  /**
   * @function
   */
  disablePanel(style) {
    const binding = this.bindings_[style];
    if (binding != null) {
      binding.setDisabled(true);
    }
  }

  /**
   * @function
   */
  enablePanel(style) {
    const binding = this.bindings_[style];
    if (binding != null) {
      binding.setDisabled(false);
    }
  }

  /**
   * @function
   */
  setGeometry(geometry) {
    this.geometry_ = geometry;
  }

  /**
   * @function
   */
  getGeometry() {
    return this.geometry_;
  }

  /**
   * @function
   */
  change(layer) {
    this.destroyViews();
    this.renderViews(layer);

    this.renderViewsPromise().then(() => {
      this.setLayer(layer);
      this.resetOptions();
      this.setCompatiblePanels();
      this.initBindings(layer);
    });
  }

  /**
   * @function
   */
  setLayer(layer) {
    if (this.layer_ === null) {
      this.addActiveListener();
      this.addSelectListener();
    }
    this.layer_ = layer;

    // for (let feature of layer.getFeatures()) {
    let type;

    //   // Establece correspondencia entre tipo de feature y tipo de geometria
    if (layer.type === 'MVT') {
      type = 'generic';
    } else {
      switch (layer.getFeatures()[0].getGeometry().type) {
        case 'Point':
        case 'MultiPoint':
          type = 'point';
          break;
        case 'LineString':
        case 'MultiLineString':
          type = 'line';
          break;
        case 'Polygon':
        case 'MultiPolygon':
          type = 'polygon';
          break;
        default:
          M.dialog.error(getValue('exception.geomNotSupported'), 'Error');
      }
    }

    //   // Establece la geometria
    //   this.setGeometry(type);

    //   // Entro si tengo una lista de puntos o que contiene puntos
    //   if (type == "point") {
    //     break;
    //   }

    this.setGeometry(type);

    // }

    // this.setGeometry("generic");
  }

  /**
   * @function
   */
  getKeysBindings() {
    return Object.keys(this.bindings_);
  }

  /**
   * @function
   */
  getBindings() {
    return Object.values(this.bindings_);
  }

  /**
   * @function
   */
  deactivateAll() {
    this.getBindings().forEach((binding) => binding.setActivated(false));
    this.activePanel_ = null;
  }

  /**
   * @function
   */
  unselectAll() {
    this.getBindings().forEach((binding) => binding.setSelected(false));
    this.selectedPanels_ = [];
  }

  /**
   * @function
   */
  enableAll() {
    this.getKeysBindings().forEach((binding) => this.enablePanel(binding));
  }

  /**
   * @function
   */
  disableAll() {
    this.getKeysBindings().forEach((binding) => this.disablePanel(binding));
  }

  /**
   * @function
   */
  bindLayer(binding) {
    this.bindings_[binding].setLayer(this.layer_);
    this.bindings_[binding].setDisabled(false);
  }

  /**
   * @function
   */
  resetOptions() {
    this.deactivateAll();
    this.unselectAll();
  }

  /**
   * @function
   */
  initBindings(layer) {
    this.bindings_['stylesimple'].setGeometry(this.geometry_).setLayer(this.layer_);
    const styles = [layer.getStyle()];
    if (styles[0] instanceof M.style.Composite) {
      styles.push(...styles[0].getStyles());
    }
    const styleNames = styles.map((style) => BindingController.parseStyleToName(style));
    styleNames.forEach((style) => {
      this.showCompatiblePanel(style);
      this.activeLastSelected(style);
    });
  }

  /**
   * @function
   */
  setCompatiblePanels() {
    const styles = BindingController.GEOMETRY_COMPATIBLE_OPTIONS[this.geometry_];
    this.getKeysBindings().forEach((binding) => {
      if (styles.includes(binding)) {
        this.bindLayer(binding);
      } else {
        this.disablePanel(binding);
      }
    });
    this.deactivateAll();
  }

  /**
   * @function
   */
  setCompatibleStylePanels(style) {
    this.disableAll();
    this.getCompatibles().forEach((style2) => {
      if (this.compatibleGeometry(style2)) {
        this.enablePanel(style2);
      }
    });
    this.selectedPanels_.forEach((styleEl) => {
      this.bindings_[styleEl].setSelected(true);
    });
  }

  /**
   * @function
   */
  showActivePanel(style) {
    this.deactivateAll();
    this.setActivePanel(style);
  }

  /**
   * @function
   */
  activeLastSelected(style) {
    let lastSelected = this.selectedPanels_.slice(-1)[0];
    if (lastSelected === undefined) {
      lastSelected = style;
    }
    this.showActivePanel(lastSelected);
  }

  /**
   * @function
   */
  showCompatiblePanel(style) {
    if (this.selectedPanels_.includes(style)) {
      this.removeSelectedPanel(style);
    } else {
      this.addSelectedPanel(style);
    }
    this.setCompatibleStylePanels(style);
  }

  /**
   * @function
   */
  addActiveListener() {
    this.getKeysBindings().forEach((binding) => {
      const bindingStyle = this.bindings_[binding];
      const selectButton = bindingStyle.getSelectButton();
      const activeButton = bindingStyle.getActivateButton();
      const label = this.html_.querySelector(`[data-flap='${binding}']+label`);
      label.addEventListener('click', () => {
        if (selectButton.disabled === false) {
          const style = activeButton.dataset.flap;
          this.toggleDisplaySubmenu(style !== 'stylesimple');
          this.showActivePanel(style);
        }
      });
    });
  }

  /**
   * @function
   */
  addSelectListener() {
    this.getKeysBindings().forEach((binding) => {
      const bindingStyle = this.bindings_[binding];
      const selectButton = bindingStyle.getSelectButton();
      selectButton.addEventListener('change', () => {
        const style = selectButton.dataset.checkbox;
        this.toggleDisplaySubmenu(style !== 'stylesimple');
        this.showCompatiblePanel(style);
        this.activeLastSelected(style);
      });
    });
  }

  /**
   * @function
   */
  getStyle() {
    let style;
    if (this.getSelectedPanels().length === 0) {
      M.dialog.info(getValue('exception.chooseStyle'), getValue('exception.choStyle'));
    } else if (this.getSelectedPanels().length === 1) {
      style = this.getSelectedPanels()[0].generateStyle();
    } else {
      const mainStyle = this.getMainStyle();
      const styles = this.getIndividualStyles();
      mainStyle.add(styles);
      style = mainStyle;
    }
    return style;
  }

  /**
   * @function
   */
  getMainStyle() {
    return this.getSelectedPanels().map((binding) => binding.generateStyle())
      .find((style) => style instanceof M.style.Composite);
  }

  /**
   * @function
   */
  getIndividualStyles() {
    const mainStyle = this.getMainStyle();
    return this.getSelectedPanels()
      .filter((style) => style != null)
      .map((binding) => binding.generateStyle()).filter((style) => !style.equals(mainStyle));
  }

  /**
   * @function
   */
  getCompatibles() {
    const compatibles = ['stylesimple', 'stylecluster', 'stylechart', 'styleproportional', 'stylecategory', 'stylechoropleth', 'styleheatmap', 'styleflowline'];
    return compatibles.filter((style) => this.isCompatibleAll(this.selectedPanels_, style));
  }

  toggleDisplaySubmenu(flag) {
    this.bindings_['stylesimple'].toggleDisplaySubmenu(flag);
  }

  /**
   * @function
   */
  isCompatible(style, style2) {
    return BindingController.STYLE_COMPATIBLE_OPTIONS[style].includes(style2);
  }

  /**
   * @function
   */
  isCompatibleAll(styles, style) {
    let isCompatible = true;
    styles.forEach((style2) => {
      if (!this.isCompatible(style2, style)) {
        isCompatible = false;
      }
    });
    return isCompatible;
  }

  /**
   * @function
   */
  compatibleGeometry(style) {
    return BindingController.GEOMETRY_COMPATIBLE_OPTIONS[this.geometry_].includes(style);
  }

  /**
   * @function
   */
  addSelectOnChangeListener() {
    this.bindings_['stylesimple'].querySelectorAllForEach('*', (element) => {
      element.addEventListener('click', () => {
        this.addSelectedPanel('stylesimple');
      });
    });
  }

  /**
   * @function
   */
  addEventSubtitle() {
    this.bindings_['stylesimple'].querySelectorAllForEach('.subtitle', (element) => {
      element.addEventListener('click', (e) => {
        const clss = e.currentTarget.nextElementSibling.classList.value;
        if (clss === 'content-row-hidden') {
          e.currentTarget.nextElementSibling.classList.add('content-row-show');
          e.currentTarget.nextElementSibling.classList.remove('content-row-hidden');
          e.currentTarget.firstElementChild.classList.remove('g-cartografia-flecha-abajo');
          e.currentTarget.firstElementChild.classList.add('g-cartografia-flecha-arriba');
        } else {
          e.currentTarget.nextElementSibling.classList.remove('content-row-show');
          e.currentTarget.nextElementSibling.classList.add('content-row-hidden');
          e.currentTarget.firstElementChild.classList.add('g-cartografia-flecha-abajo');
          e.currentTarget.firstElementChild.classList.remove('g-cartografia-flecha-arriba');
        }
      });
    });
  }

  /**
   * @const
   * @static
   */
  static get STYLE_COMPATIBLE_OPTIONS() {
    return {
      stylesimple: ['styleproportional', 'stylecluster', 'stylesimple'],
      styleproportional: ['stylesimple', 'stylecluster', 'stylechart', 'styleproportional', 'stylecategory', 'stylechoropleth'],
      stylechoropleth: ['styleproportional', 'stylecluster', 'stylechoropleth'],
      stylecategory: ['styleproportional', 'stylecluster', 'stylecategory'],
      stylecluster: ['stylesimple', 'stylechart', 'styleproportional', 'stylecategory', 'stylechoropleth', 'stylecluster'],
      styleheatmap: ['styleheatmap'],
      stylechart: ['stylecluster', 'styleproportional', 'stylechart'],
      styleflowline: ['styleflowline'],
    };
  }

  /**
   * @const
   * @static
   */
  static get GEOMETRY_COMPATIBLE_OPTIONS() {
    return {
      generic: ['stylesimple'],
      point: ['styleproportional', 'stylecluster', 'stylechoropleth', 'stylecategory',
        'styleheatmap', 'stylechart', 'stylesimple',
      ],
      line: ['stylechoropleth', 'stylecategory', 'styleflowline', 'stylesimple'],
      polygon: ['stylechoropleth', 'stylecategory', 'stylesimple', 'styleproportional'],
    };
  }

  /**
   * @function
   * @static
   */
  static parseStyleToName(style) {
    let name = '';
    if (style instanceof M.style.FlowLine) {
      name = 'styleflowline';
    } else if (style instanceof M.style.Simple) {
      name = 'stylesimple';
    } else if (style instanceof M.style.Cluster) {
      name = 'stylecluster';
    } else if (style instanceof M.style.Heatmap) {
      name = 'styleheatmap';
    } else if (style instanceof M.style.Choropleth) {
      name = 'stylechoropleth';
    } else if (style instanceof M.style.Category) {
      name = 'stylecategory';
    } else if (style instanceof M.style.Chart) {
      name = 'stylechart';
    } else if (style instanceof M.style.Proportional) {
      name = 'styleproportional';
    }
    return name;
  }
}
