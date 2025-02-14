import stylemanager from 'templates/stylemanager';
import StyleManagerImplControl from 'impl/stylemanagerControl';
import selectlayer from 'templates/selectlayer';
import BindingController from './bindingcontroller';
import { getValue } from './i18n/language';

const LAYERS_PREVENT_PLUGINS = ['bufferLayer'];

export default class StyleManagerControl extends M.Control {
  /**
   * @classdesc
   * Main constructor of the class. Creates a PluginControl
   * control
   *
   * @constructor
   * @extends {M.Control}
   * @api stable
   */
  constructor(layer) {
    // 1. checks if the implementation can create PluginControl
    if (M.utils.isUndefined(StyleManagerImplControl)) {
      M.exception(getValue('impl'));
    }

    // 2. implementation of this control
    const impl = new StyleManagerImplControl();
    super(impl, 'StyleManager');
    this.layer_ = layer;
  }

  /**
   * This function creates the view
   *
   * @public
   * @function
   * @param {M.Map} map to add the control
   * @api stable
   */
  createView(map) {
    this.facadeMap_ = map;

    const filterLayersTyle = ['WFS', 'MVT', 'KML', 'GeoJSON', 'Vector'];
    const allLayers = map.getLayers().concat(map.getImpl().getAllLayerInGroup());
    const layers = allLayers.filter((layer) => filterLayersTyle.includes(layer.type) && layer.name !== 'selectLayer' && layer.name !== '__draw__');

    return new Promise((success, fail) => {
      const html = M.template.compileSync(stylemanager, {
        jsonp: true,
        vars: {
          layers,
          translations: {
            selectLayer: getValue('selectLayer'),
            applyStyle: getValue('applyStyle'),
            clearStyle: getValue('clearStyle'),
            generateSerialized: getValue('generateSerialized'),
            heatMap: getValue('heatMap'),
            category: getValue('category'),
            choropleths: getValue('choropleths'),
            proportional: getValue('proportional'),
            statistic: getValue('statistic'),
            flowLine: getValue('flowLine'),
          },
        },
      });
      const htmlSelect = html.querySelector('#m-stylemanager-select');
      const container = html.querySelector('.m-stylemanager-container-select');
      this.bindinController_ = new BindingController(container);
      this.addSelectListener(htmlSelect, html);
      this.subscribeAddedLayer(htmlSelect);
      this.addApplyBtnListener(html);
      this.addClearBtnListener(html);
      this.addSerializedBtnListener(html);
      this.renderOptionsLayerParam(htmlSelect, html, layers);
      success(html);
      this.loadFonts(html);
    });
  }

  /**
   * @public
   * @function
   * @param {HTMLElement} html to add the plugin
   * @api stable
   */
  renderOptionsLayerParam(htmlSelect, html, layers) {
    if (this.layer_ instanceof M.layer.Vector) {
      Promise.all(this.bindinController_.getAllCompilePromises()).then(() => {
        this.renderOptions(htmlSelect, html, this.layer_);
        const htmlRes = M.template.compileSync(selectlayer, {
          vars: {
            layers: layers.map((layer) => {
              return {
                name: layer.name,
                selected: this.layer_.name,
              };
            }),
          },
        });
        // eslint-disable-next-line no-param-reassign
        htmlSelect.innerHTML = htmlRes.innerHTML;
      });
    }
  }

  /**
   * @public
   * @function
   * @param {HTMLElement} html to add the plugin
   * @api stable
   */
  addOpenAttribute(html) {
    const containerSelect = html.querySelector('.m-stylemanager-container-select');
    containerSelect.setAttribute('open-select', '');
  }

  /**
   * @public
   * @function
   * @param {HTMLElement} html to add the plugin
   * @api stable
   */
  addApplyBtnListener(html) {
    const buttonApply = html.querySelector('[data-apply-style]');
    buttonApply.addEventListener('click', this.applyStyle.bind(this));
  }

  /**
   * @public
   * @function
   * @param {HTMLElement} html to add the plugin
   * @api stable
   */
  addSerializedBtnListener(html) {
    const buttonSerialized = html.querySelector('[data-serialized-style]');
    buttonSerialized.addEventListener('click', this.serializedStyle.bind(this));
  }

  /**
   * @public
   * @function
   * @param {HTMLElement} html to add the plugin
   * @api stable
   */
  addClearBtnListener(html) {
    const buttonClear = html.querySelector('[data-clear-style]');
    buttonClear.addEventListener('click', this.clearStyle.bind(this));
  }

  /**
   * @public
   * @function
   * @param {HTMLElement} html to add the plugin
   * @api stable
   */
  addSelectListener(htmlSelect, html) {
    htmlSelect.addEventListener('change', () => {
      this.renderOptions(htmlSelect, html);
    });
  }

  /**
   * @public
   * @function
   * @param {HTMLElement} html to add the plugin
   * @api stable
   */
  subscribeAddedLayer(htmlSelect) {
    this.facadeMap_.on(M.evt.ADDED_LAYER, (layers) => {
      if (Array.isArray(layers)) {
        layers.filter((layer) => ((layer instanceof M.layer.Vector && layer.type !== 'Generic') && layer
          instanceof M.layer.MBTilesVector === false && layer.name !== 'selectLayer')).forEach((layer) => this.addLayerOption(htmlSelect, layer.name));
      } else if (layers instanceof M.layer.Vector
        && !LAYERS_PREVENT_PLUGINS.includes(layers.name)
      ) {
        const layer = { ...layers };
        this.addLayerOption(htmlSelect, layer);
      }
    });
    this.facadeMap_.on(M.evt.REMOVED_LAYER, (layers) => {
      let l = layers;
      if (!Array.isArray(layers)) {
        l = [layers];
      }
      l.forEach((layer) => { this.removeLayerOption(htmlSelect, layer.name); });
    });
  }

  /**
   * @public
   * @function
   * @param {HTMLElement} html to add the plugin
   * @api stable
   */
  getActivationButton(html) {
    return html.querySelector('button.m-panel-btn');
  }

  /**
   * @function
   */
  addLayerOption(htmlSelect, name) {
    if (name !== 'cluster_cover') {
      if (this.isNotAdded(name, htmlSelect) === true) {
        const htmlOption = document.createElement('option');
        htmlOption.setAttribute('name', name);
        htmlOption.innerText = name;
        htmlSelect.add(htmlOption);
      }
    }
  }

  removeLayerOption(htmlSelect, name) {
    if (this.isNotAdded(name, htmlSelect) === false) {
      const htmlOption = Array.from(htmlSelect.options).find((option) => option.getAttribute('name') === name);
      htmlOption.remove();
    }
  }

  /**
   * @function
   */
  isNotAdded(layerName, htmlSelect) {
    const aChildren = [...htmlSelect.children];
    return !aChildren.some((o) => o.innerHTML === layerName);
  }

  /**
   * @public
   * @function
   * @param {HTMLElement} html to add the plugin
   * @api stable
   */
  renderOptions(htmlSelect, html, layer = null) {
    const layerName = htmlSelect.value;
    this.layer_ = this.getLayerByName(layerName);
    if (layer != null) {
      this.layer_ = layer;
    }
    if (this.layer_ instanceof M.layer.Vector) {
      const features = this.layer_.getFeatures();
      if (features.length === 0) {
        M.dialog.error(getValue('exception.layerNoFeaturesLoad'), 'Error');
        // eslint-disable-next-line no-param-reassign
        htmlSelect.selectedIndex = 0;
      } else {
        this.bindinController_.change(this.layer_);
        this.showBoxes(html);
        this.addOpenAttribute(html);
      }
    }
  }

  /**
   * @public
   * @function
   * @param {HTMLElement} html to add the plugin
   * @api stable
   */
  getLayerByName(layerName) {
    const map = this.facadeMap_;
    const filterLayersTyle = ['WFS', 'MVT', 'KML', 'GeoJSON', 'Vector'];
    const allLayers = map.getLayers().concat(map.getImpl().getAllLayerInGroup());
    const layers = allLayers.filter((layer) => filterLayersTyle.includes(layer.type) && layer.name !== 'selectLayer' && layer.name !== '__draw__');

    return layers.find((layer) => layer.name === layerName);
  }

  /**
   * @public
   * @function
   * @param {HTMLElement} html to add the plugin
   * @api stable
   */
  showBoxes(htmlParent) {
    htmlParent.querySelector('.m-boxes').classList.remove('m-hidden');
  }

  /**
   * @public
   * @function
   * @param {HTMLElement} html to add the plugin
   * @api stable
   */
  applyStyle() {
    if (this.layer_ instanceof M.layer.Vector) {
      this.clearStyle();
      const style = this.bindinController_.getStyle();
      if (this.layer_.type === 'Vector') {
        this.layer_.setStyle(style, true);
      } else {
        this.layer_.setStyle(style);
      }
    } else {
      M.dialog.info(getValue('exception.chooseLayer'), getValue('exception.choLayer'));
    }
  }

  /**
   * @public
   * @function
   * @api stable
   */
  serializedStyle() {
    if (this.layer_ instanceof M.layer.Vector) {
      const style = this.bindinController_.getStyle();
      const text = style.serialize();
      const p = document.createElement('input');
      p.value = text;
      document.body.appendChild(p);
      p.select();
      document.execCommand('copy');
      M.dialog.info(getValue('clipboard'), getValue('serializedStyle'));
      document.body.removeChild(p);
    } else {
      M.dialog.info(getValue('exception.chooseLayer'), getValue('exception.choLayer'));
    }
  }

  /**
   * @public
   * @function
   * @param {HTMLElement} html to add the plugin
   * @api stable
   */
  clearStyle() {
    if (this.layer_ instanceof M.layer.Vector) {
      this.layer_.setStyle(M.layer.Vector.DEFAULT_OPTIONS_STYLE);
    } else {
      M.dialog.info(getValue('exception.chooseLayer'), getValue('exception.choLayer'));
    }
  }

  /**
   * @function
   */
  loadFonts() {
    M.style.Font.addSymbol({
      font: 'FontAwesome',
      name: 'FontAwesome',
      copyright: 'SIL OFL 1.1',
      prefi: 'fa',
    }, {
      'fa-glass': '\uf000',
      'fa-music': '\uf001',
      'fa-search': '\uf002',
      'fa-envelope-o': '\uf003',
      'fa-heart': '\uf004',
      'fa-star': '\uf005',
      'fa-star-o': '\uf006',
      'fa-user': '\uf007',
      'fa-film': '\uf008',
      'fa-th-large': '\uf009',
      'fa-th': '\uf00a',
      'fa-th-list': '\uf00b',
      'fa-check': '\uf00c',
      'fa-remove': '\uf00d',
      'fa-close': '\uf00d',
      'fa-times': '\uf00d',
      'fa-search-plus': '\uf00e',
      'fa-search-minus': '\uf010',
      'fa-power-off': '\uf011',
      'fa-signal': '\uf012',
      'fa-gear': '\uf013',
      'fa-cog': '\uf013',
      'fa-trash-o': '\uf014',
      'fa-home': '\uf015',
      'fa-file-o': '\uf016',
      'fa-clock-o': '\uf017',
      'fa-road': '\uf018',
      'fa-download': '\uf019',
      'fa-arrow-circle-o-down': '\uf01a',
      'fa-arrow-circle-o-up': '\uf01b',
      'fa-inbox': '\uf01c',
      'fa-play-circle-o': '\uf01d',
      'fa-rotate-right': '\uf01e',
      'fa-repeat': '\uf01e',
      'fa-refresh': '\uf021',
      'fa-list-alt': '\uf022',
      'fa-lock': '\uf023',
      'fa-flag': '\uf024',
      'fa-headphones': '\uf025',
      'fa-volume-off': '\uf026',
      'fa-volume-down': '\uf027',
      'fa-volume-up': '\uf028',
      'fa-qrcode': '\uf029',
      'fa-barcode': '\uf02a',
      'fa-tag': '\uf02b',
      'fa-tags': '\uf02c',
      'fa-book': '\uf02d',
      'fa-bookmark': '\uf02e',
      'fa-print': '\uf02f',
      'fa-camera': '\uf030',
      'fa-font': '\uf031',
      'fa-bold': '\uf032',
      'fa-italic': '\uf033',
      'fa-text-height': '\uf034',
      'fa-text-width': '\uf035',
      'fa-align-left': '\uf036',
      'fa-align-center': '\uf037',
      'fa-align-right': '\uf038',
      'fa-align-justify': '\uf039',
      'fa-list': '\uf03a',
      'fa-dedent': '\uf03b',
      'fa-outdent': '\uf03b',
      'fa-indent': '\uf03c',
      'fa-video-camera': '\uf03d',
      'fa-photo': '\uf03e',
      'fa-image': '\uf03e',
      'fa-picture-o': '\uf03e',
      'fa-pencil': '\uf040',
      'fa-map-marker': '\uf041',
      'fa-adjust': '\uf042',
      'fa-tint': '\uf043',
      'fa-edit': '\uf044',
      'fa-pencil-square-o': '\uf044',
      'fa-share-square-o': '\uf045',
      'fa-check-square-o': '\uf046',
      'fa-arrows': '\uf047',
      'fa-step-backward': '\uf048',
      'fa-fast-backward': '\uf049',
      'fa-backward': '\uf04a',
      'fa-play': '\uf04b',
      'fa-pause': '\uf04c',
      'fa-stop': '\uf04d',
      'fa-forward': '\uf04e',
      'fa-fast-forward': '\uf050',
      'fa-step-forward': '\uf051',
      'fa-eject': '\uf052',
      'fa-chevron-left': '\uf053',
      'fa-chevron-right': '\uf054',
      'fa-plus-circle': '\uf055',
      'fa-minus-circle': '\uf056',
      'fa-times-circle': '\uf057',
      'fa-check-circle': '\uf058',
      'fa-question-circle': '\uf059',
      'fa-info-circle': '\uf05a',
      'fa-crosshairs': '\uf05b',
      'fa-times-circle-o': '\uf05c',
      'fa-check-circle-o': '\uf05d',
      'fa-ban': '\uf05e',
      'fa-arrow-left': '\uf060',
      'fa-arrow-right': '\uf061',
      'fa-arrow-up': '\uf062',
      'fa-arrow-down': '\uf063',
      'fa-mail-forward': '\uf064',
      'fa-share': '\uf064',
      'fa-expand': '\uf065',
      'fa-compress': '\uf066',
      'fa-plus': '\uf067',
      'fa-minus': '\uf068',
      'fa-asterisk': '\uf069',
      'fa-exclamation-circle': '\uf06a',
      'fa-gift': '\uf06b',
      'fa-leaf': '\uf06c',
      'fa-fire': '\uf06d',
      'fa-eye': '\uf06e',
      'fa-eye-slash': '\uf070',
      'fa-warning': '\uf071',
      'fa-exclamation-triangle': '\uf071',
      'fa-plane': '\uf072',
      'fa-calendar': '\uf073',
      'fa-random': '\uf074',
      'fa-comment': '\uf075',
      'fa-magnet': '\uf076',
      'fa-chevron-up': '\uf077',
      'fa-chevron-down': '\uf078',
      'fa-retweet': '\uf079',
      'fa-shopping-cart': '\uf07a',
      'fa-folder': '\uf07b',
      'fa-folder-open': '\uf07c',
      'fa-arrows-v': '\uf07d',
      'fa-arrows-h': '\uf07e',
      'fa-bar-t-o': '\uf080',
      'fa-bar-t': '\uf080',
      'fa-twitter-square': '\uf081',
      'fa-facebook-square': '\uf082',
      'fa-camera-retro': '\uf083',
      'fa-key': '\uf084',
      'fa-gears': '\uf085',
      'fa-cogs': '\uf085',
      'fa-comments': '\uf086',
    });
  }

  /**
   * This function compares controls
   *
   * @public
   * @function
   * @param {M.Control} control to compare
   * @api stable
   */
  equals(control) {
    return control instanceof StyleManagerControl;
  }
}
