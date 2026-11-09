/**
 * @module IDEE/control/ShareMapControl
 */
import QRCode from 'qrcode';
import template from '../../templates/sharemap';
import modal from '../../templates/modal';
import { getValue } from './i18n/language';

/**
 * Implementation used by the REST API when the url does not define one.
 *
 * @const
 * @private
 */
const DEFAULT_IMPLEMENTATION = 'ol';

/**
 * Quiet zone of the QR code, in modules.
 *
 * @const
 * @private
 */
const QR_MARGIN = 4;

/**
 * Size of each module of the QR code.
 *
 * @const
 * @private
 */
const QR_MODULE_SIZE = 3;

/**
 * This function adds the animation shade class.
 *
 * @function
 * @private
 */
const beginShade = (element) => {
  if (element.classList.contains('m-plugin-sharemap-shade')) {
    element.classList.remove('m-plugin-sharemap-shade');
  } else {
    element.classList.add('m-plugin-sharemap-shade');
    setTimeout(() => {
      element.classList.remove('m-plugin-sharemap-shade');
    }, 2000); // animationDuration 2s
  }
};

/**
 * This function copies the textr input in clipboard
 *
 * @function
 * @private
 */
const copyURL = (input) => {
  const inputVar = input;
  inputVar.disabled = false;
  inputVar.select();
  document.execCommand('copy');
  inputVar.disabled = true;
  document.getSelection().removeAllRanges();
};

/**
 * This function encodes a value for a URL parameter, keeping readable
 * the characters used by the REST syntax that URLs accept unencoded.
 *
 * @function
 * @private
 */
const encodeParam = (value) => encodeURIComponent(value)
  .replace(/%(3A|2F|3F|3D|2C|3B|40|24)/gi, (match) => decodeURIComponent(match));

/**
 * This function builds the query of a url from its parameters.
 *
 * @function
 * @private
 * @param {Array<Array>} params Parameters: [key] or [key, value|Array<value>].
 * @returns {string} Query.
 */
const toQuery = (params) => params
  .filter((param) => param.length === 1 || !IDEE.utils.isNullOrEmpty(param[1]))
  .map(([key, value]) => (value === undefined ? key : `${key}=${[].concat(value).map(encodeParam).join(',')}`))
  .join('&');

/**
 * This function draws the QR code of a text as SVG markup.
 *
 * @function
 * @private
 * @param {string} text Text to encode.
 * @param {string} errorCorrectionLevel Error correction level.
 * @returns {Promise<string>} SVG markup.
 */
const toQRSvg = (text, errorCorrectionLevel) => QRCode.toString(text, {
  type: 'svg', errorCorrectionLevel, margin: QR_MARGIN,
});

/**
 * This function creates the QR code of a text: its SVG and, over its center, the image.
 *
 * @function
 * @private
 * @param {string} text Text to encode.
 * @param {string} title Accessible title of the QR code.
 * @param {string} [image] Url of the image.
 * @returns {Promise<Array<Element>|null>} SVG of the QR code and image; null if the text
 * does not fit in a QR code.
 */
const createQR = (text, title, image) => ['H', 'Q', 'M']
  .reduce((svg, level) => svg.catch(() => toQRSvg(text, level)), Promise.reject())
  .then((svg) => ({ svg, withImage: !IDEE.utils.isNullOrEmpty(image) }))
  .catch(() => toQRSvg(text, 'L').then((svg) => ({ svg, withImage: false })))
  .then(({ svg, withImage }) => {
    const element = IDEE.utils.stringToHtml(svg);
    element.setAttribute('role', 'img');
    element.style.width = `max(260px, ${element.viewBox.baseVal.width * QR_MODULE_SIZE}px)`;
    element.insertAdjacentHTML('afterbegin', `<title>${IDEE.utils.escapeXSS(title)}</title>`);
    return withImage
      ? [element, IDEE.utils.stringToHtml(`<img src="${IDEE.utils.escapeXSS(image)}" alt="">`)]
      : [element];
  }, () => null);

/**
 * @classdesc
 * ShareMap api-idee control.
 * This control allows current map state sharing via URL.
 */
export default class ShareMapControl extends IDEE.Control {
  /**
   * @constructor
   * @extends {IDEE.Control}
   * @api stable
   */
  constructor(options) {
    const impl = new IDEE.impl.Control();
    super('sharemap', impl);
    /**
     * Base url of the shared map
     *
     * @private
     * @type {URLLike}
     */
    this.baseUrl_ = options.baseUrl;

    /**
     * Title of the modal
     *
     * @private
     * @type {string}
     */
    this.title_ = options.title;

    /**
     * Text
     *
     * @private
     * @type {string}
     */
    this.text_ = options.text;

    /**
     * Text of the button
     *
     * @private
     * @type {string}
     */
    this.btn_ = options.btn;

    /**
     * Text of the copy button
     *
     * @private
     * @type {string}
     */
    this.copyBtn_ = options.copyBtn;

    /**
     * Text of the copy html button
     *
     * @private
     * @type {string}
     */
    this.copyBtnHtml_ = options.copyBtnHtml;

    /**
     * Primary color of the html view  (hexadecimal format).
     *
     * @private
     * @type {string}
     */
    this.primaryColor_ = options.primaryColor || '#71a7d3';

    /**
     * Secondary color of the html view  (hexadecimal format).
     *
     * @private
     * @type {string}
     */
    this.secondaryColor_ = options.secondaryColor || '#fff';

    /**
     * Classes jss
     *
     * @private
     * @type {object}
     */
    this.styles_ = [
      {
        id: '.m-plugin-sharemap-content button',
        styles: {
          backgroundColor: `${this.primaryColor_} `,
          color: `${this.secondaryColor_} `,
        },
      },
      {
        id: '#m-plugin-sharemap-content',
        styles: {
          backgroundColor: `${this.secondaryColor_} `,
          border: `1px solid ${this.primaryColor_} `,
          boxShadow: `0 2px 4px ${this.primaryColor_}, 0 -1px 0px ${this.primaryColor_} `,
        },
      },
      {
        id: '.m-plugin-sharemap-content span',
        styles: {
          color: `${this.primaryColor_} `,
        },
      },
      {
        id: '.m-plugin-sharemap-dialog div.m-plugin-sharemap-social',
        styles: {
          borderBottom: `${this.primaryColor_} 1px solid `,
        },
      },
      {
        id: '#m-plugin-sharemap-social a svg',
        styles: {
          color: `${this.primaryColor_} `,
        },
      },
      {
        id: 'm-sharemap-geturl',
        styles: {
          backgroundColor: this.primaryColor_,
          color: this.secondaryColor_,
        },
      },
    ];

    /**
     * Styles in js will be overwritten
     *
     * @private
     * @type {bool}
     */
    this.overwriteStyles_ = options.overwriteStyles || false;

    /**
     * Generate minimized url
     *
     * @private
     * @type {bool}
     */
    this.minimize_ = options.minimize || false;

    /**
     * Tooltip information for copy action
     *
     * @private
     * @type {string}
     */
    this.tooltip_ = options.tooltip || '¡Copiado!';

    /**
     * URL API or URL Visor (false visor (default), true API)
     *
     * @private
     * @type {bool}
     */
    this.urlAPI_ = options.urlAPI || false;

    this.order = options.order;
    /**
     * Layers to show in popup
     *
     * @private
     * @type {Array}
     */
    this.filterLayers = options.filterLayers;

    /** Select all layers or not
      * @private
      * @type {Boolean}
      */
    this.shareLayer = options.shareLayer;

    /**
     * Url of the image over the center of the QR code
     *
     * @private
     * @type {string}
     */
    this.qrImage_ = options.qrImage;

    /**
     * Layers already warned as not shareable
     *
     * @private
     * @type {WeakSet}
     */
    this.unsharedLayers_ = new WeakSet();
  }

  /**
   * This function creates the view
   *
   * @public
   * @function
   * @param {IDEE.Map} map to add the control
   * @api
   */
  createView(map) {
    this.map_ = map;
    return new Promise((success, fail) => {
      const html = IDEE.template.compileSync(template);
      const button = html.querySelector('button');
      button.setAttribute('tabindex', this.order);
      button.setAttribute('aria-label', 'Plugin Sharemap');

      if (this.overwriteStyles_ === true) {
        const [mButtonStyle] = this.styles_.filter(({ id }) => id === button.id);
        button.style.backgroundColor = mButtonStyle.styles.backgroundColor;
        button.style.color = mButtonStyle.styles.color;
        button.style.border = mButtonStyle.styles.border;
      }
      this.accessibilityTab(html);
      this.addEvents(html);
      success(html);
    });
  }

  /**
   * This function adds the event to the view html
   *
   * @public
   * @param html - HTML template of the view
   * @api
   */
  addEvents(html) {
    html.querySelector('#m-sharemap-geturl').addEventListener('click', () => {
      if (!document.querySelector('#m-plugin-sharemap-title')) {
        this.activateModal();
      }
    });
  }

  /**
   * This function adds modal view to html
   *
   * @public
   * @param html - HTML template of the view
   * @api
   */
  activateModal(onClose) {
    const content = IDEE.template.compileSync(modal, {
      jsonp: true,
      parseToHtml: false,
      vars: {
        title: this.title_,
        text: this.text_,
        btn: this.btn_,
        copyBtn: this.copyBtn_,
        copyBtnHtml: this.copyBtnHtml_,
        tooltip: this.tooltip_,
        qrTitle: getValue('qr.title'),
      },
    });

    IDEE.dialog.info(content, getValue('modalTitle'), this.order);

    const dialogEl = document.querySelector('.m-dialog:last-of-type');
    const dialogContainer = dialogEl.querySelector('.m-message');

    dialogEl.classList.add('m-dialog-sharemap');
    this.accessibilityTab(dialogEl);

    if (this.overwriteStyles_ === true) {
      this.styles_.forEach((style) => {
        const elements = dialogContainer.querySelectorAll(style.id);
        elements.forEach((elm) => {
          const changeElementStyle = elm;
          Object.keys(style.styles).forEach((key) => {
            changeElementStyle.style[key] = style.styles[key];
          });
        });
      });
    }

    const message = dialogContainer.querySelector('#m-plugin-sharemap-message input');
    const html = dialogContainer.querySelector('#m-plugin-sharemap-html input');

    const okButton = dialogContainer.querySelector('#m-plugin-sharemap-button > button');
    okButton.addEventListener('click', () => {
      IDEE.dialog.remove();
      if (typeof onClose === 'function') {
        onClose();
      } else {
        document.querySelector('.m-sharemap-container').click();
        document.querySelector('#m-sharemap-geturl').focus();
      }
    });

    const copyButton = dialogContainer.querySelector('#m-plugin-sharemap-copybutton');
    const copyButtonHtml = dialogContainer.querySelector('#m-plugin-sharemap-copybuttonhtml');

    const title = dialogContainer.querySelector('#m-plugin-sharemap-title');
    copyButton.addEventListener('click', () => {
      copyURL(message);
      beginShade(title.querySelector('#m-plugin-sharemap-tooltip'));
    });

    copyButtonHtml.addEventListener('click', () => {
      copyURL(html);
      beginShade(title.querySelector('#m-plugin-sharemap-tooltip'));
    });

    const shareURL = this.getShareURL();
    this.buildURL(dialogContainer, shareURL);
    this.buildQR(dialogContainer, shareURL);
    this.buildHtml(dialogContainer, shareURL).then(() => { title.focus(); title.click(); });
  }

  /**
   * This method builds the url to share the current view of the map.
   *
   * @public
   * @function
   * @returns {Promise<string>} Url to share.
   */
  getShareURL() {
    return this.getControls().then((controls) => {
      const { x, y } = this.map_.getCenter();
      const params = [['center', `${x},${y}`], ['zoom', this.map_.getZoom()]];
      let url;
      if (this.urlAPI_) {
        url = this.baseUrl_;
        params.push(['bgcolorcontainer', this.map_.getBGColorContainer()]);
        if (!this.minimize_) {
          params.push(['controls', controls], ...this.getPlugins());
        } else {
          const minimized = controls.filter((control) => !control.startsWith('backgroundlayers'));
          if (!minimized.some((control) => control.split('*')[0] === 'scale')) {
            minimized.push('scale*exactScale=true');
          }
          params.push(['controls', minimized], ['plugins', ['layerswitcher', 'mousesrs']]);
        }
        const { code, units } = this.map_.getProjection();
        params.push(['layers', this.getLayers()], this.getBaseLayerParam_(), ['projection', `${code}*${units}`]);
      } else {
        url = (window.location.search) ? window.location.href.replace(window.location.search, '') : window.location.href;
        params.push(['srs', this.map_.getProjection().code], ['bgcolorcontainer', this.map_.getBGColorContainer()]);
        let layers = [];
        if (this.shareLayer === true) {
          layers = this.getLayersInLayerswitcher();
        } else if (this.shareLayer === false) {
          layers = this.getLayersInfilterLayers();
        }
        if (layers.length === 0 && !IDEE.utils.isNullOrEmpty(IDEE.config.MAP_VIEWER_LAYERS)) {
          layers = IDEE.config.MAP_VIEWER_LAYERS;
        }
        params.push(['layers', layers], this.getBaseLayerParam_());
      }
      const implementation = this.map_.getImplementation();
      if (implementation !== DEFAULT_IMPLEMENTATION) {
        params.push(['implementation', implementation]);
      }
      return `${url}?${toQuery(params)}`;
    });
  }

  /**
   * This method builds the url to sharing.
   *
   * @public
   * @function
   * @param {HTMLElement} html Dialog.
   * @param {Promise<string>} [shareURL] Url to share.
   */
  buildURL(html, shareURL = this.getShareURL()) {
    const input = html.querySelector('input');
    const twitter = html.querySelector('#twitter');
    const facebook = html.querySelector('#facebook');
    const pinterest = html.querySelector('#pinterest');
    return shareURL.then((url) => {
      input.value = url;
      const encodedURL = encodeURIComponent(url);
      facebook.addEventListener('click', () => window.open(`http://www.facebook.com/sharer.php?u=${encodedURL}`, '_blank'));
      twitter.addEventListener('click', () => window.open(`https://twitter.com/intent/tweet?url=${encodedURL}`, '_blank'));
      pinterest.addEventListener('click', () => window.open(`https://www.pinterest.es/pin/create/button/?url=${encodedURL}`, '_blank'));
    });
  }

  /**
   * This method builds the html.
   *
   * @public
   * @function
   * @param {HTMLElement} dialog Dialog.
   * @param {Promise<string>} [shareURL] Url to share.
   */
  buildHtml(dialog, shareURL = this.getShareURL()) {
    const input = dialog.querySelector('#m-plugin-sharemap-html input');
    return shareURL.then((url) => {
      input.value = `<iframe width="800" height="600" frameborder="0" style="border:0" src="${url}"></iframe>`;
    });
  }

  /**
   * This method builds the QR code of the url to share, with the image of the
   * "qrImage" option.
   *
   * @public
   * @function
   * @param {HTMLElement} dialog Dialog.
   * @param {Promise<string>} [shareURL] Url to share.
   */
  buildQR(dialog, shareURL = this.getShareURL()) {
    const container = dialog.querySelector('#m-plugin-sharemap-qr');
    return shareURL.then((url) => createQR(url, getValue('qr.alt'), this.qrImage_))
      .then((qr) => container.replaceChildren(...(qr || [IDEE.utils.stringToHtml(`<p role="status">${IDEE.utils.escapeXSS(getValue('exception.tooLong'))}</p>`)])));
  }

  /**
   * This methods gets the controls url parameters
   *
   * @public
   * @function
   * @returns {Promise<Array<string>>} REST parameters of the controls.
   */
  getControls() {
    if (!this.allowedControlsPromise_) {
      const url = this.baseUrl_.match(/(.*[A-Za-z-0-9])/)[0];
      this.allowedControlsPromise_ = IDEE.remote.get(`${url}/api/actions/controls`)
        .then((response) => JSON.parse(response.text))
        .catch(() => {
          IDEE.toast.error(getValue('exception.baseUrl'));
          return null;
        });
    }
    return this.allowedControlsPromise_.then((allowedControls) => {
      if (allowedControls === null) {
        return [];
      }
      const controls = this.map_.getControls();
      const resolvedControls = controls
        .filter(({ name }) => name !== 'backgroundlayers' && allowedControls.includes(name))
        .map(({ name, options }) => (name === 'scale' && options.exactScale === true ? 'scale*exactScale=true' : name));
      const backgroundlayers = controls.find(({ name }) => name === 'backgroundlayers');
      if (!IDEE.utils.isNullOrEmpty(backgroundlayers)) {
        const { visible, activeLayer } = backgroundlayers;
        resolvedControls.push(typeof visible === 'boolean' && typeof activeLayer === 'number'
          ? `backgroundlayers*layerIndex=${activeLayer};visible=${visible}`
          : 'backgroundlayers');
      }
      return resolvedControls;
    });
  }

  /**
   * This method gets the layers parameters
   *
   * @public
   * @function
   */
  getLayers() {
    if (this.shareLayer === false) {
      return this.getLayersInfilterLayers();
    }
    const layers = this.map_.getLayers().filter((layer) => {
      let res = layer.name !== '__draw__' && layer.name !== 'selectionLayer';
      if (layer.name === 'attributions' && (layer.type === 'KML' || layer.type === 'KMZ')) {
        res = res && false;
      }

      if (layer.displayInLayerSwitcher === false && layer.isBase === false) {
        res = res && false;
      }

      return res;
    });

    return this.layersToParams_(layers);
  }

  /**
   * This method gets the externs layers parameters
   *
   * @public
   * @function
   */
  getLayersInLayerswitcher() {
    const layers = this.map_.getLayers().filter((layer) => {
      return layer.displayInLayerSwitcher === true && layer.isBase === false;
    });

    return this.layersToParams_(layers);
  }

  /**
   * @public
   * @function
   */
  getLayersInfilterLayers() {
    const layers = this.map_.getLayers().filter((layer) => this.filterLayers.includes(layer.name));
    return this.layersToParams_(layers);
  }

  /**
   * This function gets the url param from layer. Each layer provides
   * its own REST serialization; non representable layers return null.
   *
   * @public
   * @function
   */
  layerToParam(layer) {
    const param = IDEE.utils.isFunction(layer.getRestLayer) ? layer.getRestLayer() : null;
    if (IDEE.utils.isNullOrEmpty(param) && !this.unsharedLayers_.has(layer)) {
      this.unsharedLayers_.add(layer);
      const name = IDEE.utils.escapeXSS(String(layer.legend || layer.name || layer.type));
      IDEE.toast.warning(getValue('exception.unsharedLayer').replace('{layer}', name));
    }
    return param;
  }

  /**
   * This function gets the url params from layers, without repeated params
   * (e.g. the WMS layers of a WMC share the WMC param).
   *
   * @private
   * @function
   */
  layersToParams_(layers) {
    const baseLayer = this.map_.getRestBaseLayer();
    const background = IDEE.utils.isNullOrEmpty(baseLayer) ? [] : this.map_.getActiveBaseLayers();
    const params = layers.filter((layer) => !background.includes(layer))
      .map((layer) => this.layerToParam(layer)).filter((param) => param != null);
    return [...new Set(params)];
  }

  /**
   * This method gets the base layer url parameter (the active background of the map);
   * its value is empty if the background cannot be shared through REST.
   *
   * @private
   * @function
   * @returns {Array<string>} Parameter [key, value].
   */
  getBaseLayerParam_() {
    return ['baselayer', this.map_.getRestBaseLayer()];
  }

  /**
   * This method gets the url parameters of the plugins from their API REST.
   *
   * @public
   * @function
   * @returns {Array<Array<string>>} Parameters [name, params] or [name].
   */
  getPlugins() {
    return this.map_.getPlugins()
      .filter((plugin) => IDEE.utils.isFunction(plugin.getAPIRest))
      .map((plugin) => {
        const [name, ...params] = plugin.getAPIRest().split('=');
        const value = params.join('=');
        return value === '' ? [name] : [name, value];
      });
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
    return control instanceof ShareMapControl;
  }

  accessibilityTab(html) {
    html.querySelectorAll('[tabindex="0"]').forEach((el) => el.setAttribute('tabindex', this.order));
  }
}
