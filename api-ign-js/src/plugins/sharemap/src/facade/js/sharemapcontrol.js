/**
 * @module M/control/ShareMapControl
 */
import template from '../../templates/sharemap';
import modal from '../../templates/modal';
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
 * This function removes the html element from DOM.
 *
 * @function
 * @private
 */
const removeElement = (element) => {
  const parent = element.parentElement;
  parent.removeChild(element);
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
 * @classdesc
 * ShareMap mapea control.
 * This control allows current map state sharing via URL.
 */
export default class ShareMapControl extends M.Control {
  /**
   * @constructor
   * @extends {M.Control}
   * @api stable
   */
  constructor(options) {
    const impl = new M.impl.Control();
    super(impl, 'sharemap');
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
  }

  /**
   * This function creates the view
   *
   * @public
   * @function
   * @param {M.Map} map to add the control
   * @api
   */
  createView(map) {
    this.map_ = map;
    return new Promise((success, fail) => {
      const html = M.template.compileSync(template);
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
  activateModal() {
    const dialog = M.template.compileSync(modal, {
      vars: {
        title: this.title_,
        text: this.text_,
        btn: this.btn_,
        copyBtn: this.copyBtn_,
        copyBtnHtml: this.copyBtnHtml_,
        tooltip: this.tooltip_,
      },
    });

    this.accessibilityTab(dialog);

    if (this.overwriteStyles_ === true) {
      this.styles_.forEach((style) => {
        const element = dialog.querySelectorAll(style.id);
        element.forEach((elm) => {
          const changeElementStyle = elm;
          Object.keys(style.styles).forEach((key) => {
            changeElementStyle.style[key] = style.styles[key];
          });
        });
      });
    }

    const message = dialog.querySelector('#m-plugin-sharemap-message input');
    const html = dialog.querySelector('#m-plugin-sharemap-html input');

    const mapeaContainer = document.querySelector('div.m-mapea-container');
    const okButton = dialog.querySelector('#m-plugin-sharemap-button > button');
    okButton.addEventListener('click', () => {
      removeElement(dialog);
      document.querySelector('.m-sharemap-container').click();
      document.querySelector('#m-sharemap-geturl').focus();
    });

    const copyButton = dialog.querySelector('#m-plugin-sharemap-copybutton');
    const copyButtonHtml = dialog.querySelector('#m-plugin-sharemap-copybuttonhtml');

    const title = dialog.querySelector('#m-plugin-sharemap-title');
    copyButton.addEventListener('click', () => {
      copyURL(message);
      beginShade(title.querySelector('#m-plugin-sharemap-tooltip'));
    });

    copyButtonHtml.addEventListener('click', () => {
      copyURL(html);
      beginShade(title.querySelector('#m-plugin-sharemap-tooltip'));
    });

    this.buildURL(dialog).then(() => mapeaContainer.appendChild(dialog));
    this.buildHtml(dialog)
      .then(() => mapeaContainer.appendChild(dialog))
      .then(() => { title.focus(); title.click(); });
  }

  /**
   * This method builds the url to sharing.
   *
   * @public
   * @function
   */
  buildURL(html) {
    const input = html.querySelector('input');
    const twitter = html.querySelector('#twitter');
    const facebook = html.querySelector('#facebook');
    const pinterest = html.querySelector('#pinterest');
    return this.getControls().then((controls) => {
      let shareURL;
      if (this.urlAPI_) {
        const { x, y } = this.map_.getCenter();
        const { code, units } = this.map_.getProjection();
        shareURL = `${this.baseUrl_}?center=${x},${y}&zoom=${this.map_.getZoom()}`;
        if (!this.minimize_) {
          shareURL = shareURL.concat(`&controls=${controls}`).concat(`&${this.getPlugins()}`);
        } else {
          let newControls = controls.filter((c) => {
            return c !== undefined && c.indexOf('backgroundlayers') === -1;
          }).join(',');

          if (newControls.endsWith(',')) {
            newControls = newControls.slice(0, -1);
          }

          if (newControls.indexOf('scale') === -1 || (newControls.indexOf('scale') === newControls.indexOf('scaleline'))) {
            newControls = newControls.concat(',scale*true');
          }
          shareURL = shareURL.concat(`&controls=${newControls}`).concat('&plugins=toc,zoompanel,measurebar,mousesrs');
        }

        shareURL = this.getLayers().length > 0 ? shareURL.concat(`&layers=${this.getLayers()}`) : shareURL.concat('');
        shareURL = shareURL.concat(`&projection=${code}*${units}`);
        input.value = shareURL;
      } else {
        const { x, y } = this.map_.getCenter();
        const urlBaseVisor = (window.location.search) ? window.location.href.replace(window.location.search, '') : window.location.href;
        shareURL = `${urlBaseVisor}?center=${x},${y}&zoom=${this.map_.getZoom()}&srs=${this.map_.getProjection().code}`;
        let layers = [];

        if (this.shareLayer === true) {
          layers = this.getLayersInLayerswitcher();
        } else if (this.shareLayer === false) {
          layers = this.getLayersInfilterLayers();
        }

        shareURL = layers.length > 0 ? shareURL.concat(`&layers=${layers}`) : shareURL.concat('');
        if (!M.utils.isNullOrEmpty(M.config.MAP_VIEWER_LAYERS)) {
          if (layers.length > 0) {
            let includes = '';
            M.config.MAP_VIEWER_LAYERS.forEach((elm) => {
              if (layers.indexOf(elm) === -1) {
                includes = includes.concat(`,${elm}`);
              }
            });
            if (M.utils.isNullOrEmpty(includes)) {
              shareURL = `${shareURL},${M.config.MAP_VIEWER_LAYERS}`;
            }
          } else {
            shareURL = `${shareURL}&layers=${M.config.MAP_VIEWER_LAYERS}`;
          }
        }
        input.value = shareURL;
      }
      shareURL = encodeURI(shareURL);
      M.remote.get(`http://tinyurl.com/api-create.php?url=${shareURL}`).then((response) => {
        facebook.href = `http://www.facebook.com/sharer.php?u=${response.text}`;
        twitter.href = `https://twitter.com/intent/tweet?url=${response.text}`;
        pinterest.href = `https://www.pinterest.es/pin/create/button/?url=${response.text}`;
      });
    });
  }

  /**
   * This method builds the html.
   *
   * @public
   * @function
   */
  buildHtml(dialog) {
    const html = dialog.querySelector('#m-plugin-sharemap-html');
    const input = html.querySelector('input');
    return this.getControls().then((controls) => {
      let shareURL;
      if (this.urlAPI_) {
        const { x, y } = this.map_.getCenter();
        const { code, units } = this.map_.getProjection();
        shareURL = `${this.baseUrl_}?center=${x},${y}&zoom=${this.map_.getZoom()}`;
        if (!this.minimize_) {
          shareURL = shareURL.concat(`&controls=${controls}`).concat(`&${this.getPlugins()}`);
        } else {
          let newControls = controls.filter((c) => {
            return c !== undefined && c.indexOf('backgroundlayers') === -1;
          }).join(',');

          if (newControls.endsWith(',')) {
            newControls = newControls.slice(0, -1);
          }

          if (newControls.indexOf('scale') === -1 || (newControls.indexOf('scale') === newControls.indexOf('scaleline'))) {
            newControls = newControls.concat(',scale*true');
          }

          shareURL = shareURL.concat(`&controls=${newControls}`).concat('&plugins=toc,zoompanel,measurebar,mousesrs');
        }
        const layerParam = this.getLayers();
        shareURL = layerParam.length > 0 ? shareURL.concat(`&layers=${layerParam}`) : shareURL.concat('');
        shareURL = shareURL.concat(`&projection=${code}*${units}`);
      } else {
        const { x, y } = this.map_.getCenter();
        const urlBaseVisor = (window.location.search) ? window.location.href.replace(window.location.search, '') : window.location.href;
        shareURL = `${urlBaseVisor}?center=${x},${y}&zoom=${this.map_.getZoom()}`;
        let layers = [];

        if (this.shareLayer === true) {
          layers = this.getLayersInLayerswitcher();
        } else if (this.shareLayer === false) {
          layers = this.getLayersInfilterLayers();
        }

        shareURL = layers.length > 0 ? shareURL.concat(`&layers=${layers}`) : shareURL.concat('');
        if (!M.utils.isNullOrEmpty(M.config.MAP_VIEWER_LAYERS)) {
          if (layers.length > 0) {
            let includes = '';
            M.config.MAP_VIEWER_LAYERS.forEach((elm) => {
              if (layers.indexOf(elm) === -1) {
                includes = includes.concat(`,${elm}`);
              }
            });
            if (M.utils.isNullOrEmpty(includes)) {
              shareURL = `${shareURL},${M.config.MAP_VIEWER_LAYERS}`;
            }
          } else {
            shareURL = `${shareURL}&layers=${M.config.MAP_VIEWER_LAYERS}`;
          }
        }
        input.value = shareURL;
      }
      const embeddedHtml = `<iframe width="800" height="600" frameborder="0" style="border:0" src="${shareURL}"></iframe>`;
      input.value = embeddedHtml;
    });
  }

  /**
   * This methods gets the controls url parameters
   *
   * @public
   * @function
   */
  getControls() {
    const url = this.baseUrl_.match(/(.*[A-Za-z-0-9])/)[0];
    const controls = this.map_.getControls().map((control) => control.name);
    return new Promise((resolve) => {
      M.remote.get(`${url}/api/actions/controls`).then((response) => {
        const allowedControls = JSON.parse(response.text);
        const resolvedControls = controls.filter((control) => allowedControls.includes(control))
          .filter((c) => c !== 'backgroundlayers');
        if (resolvedControls.includes('mouse')) {
          const mouseControl = this.map_.getControls().find((c) => c.name === 'mouse');
          const { showProj } = mouseControl.getImpl();
          const index = resolvedControls.indexOf('mouse');
          resolvedControls[index] = showProj === true ? 'mouse*true' : 'mouse';
        }
        if (resolvedControls.includes('scale')) {
          const scaleControl = this.map_.getControls().find((c) => c.name === 'scale');
          const { exactScale } = scaleControl.getImpl();
          const index = resolvedControls.indexOf('scale');
          resolvedControls[index] = exactScale === true ? 'scale*true' : 'scale';
        }
        const backgroundlayers = this.map_.getControls().find((c) => c.name === 'backgroundlayers');
        let backgroundlayersAPI;
        if (!M.utils.isNullOrEmpty(backgroundlayers)) {
          const { visible, activeLayer } = backgroundlayers;
          if (typeof visible === 'boolean' && typeof activeLayer === 'number') {
            backgroundlayersAPI = `backgroundlayers*${activeLayer}*${visible}`;
          } else {
            backgroundlayersAPI = 'backgroundlayers';
          }
        }
        resolvedControls.push(backgroundlayersAPI);
        resolve(resolvedControls);
      });
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
      if (layer.name === 'attributions' && layer.type === 'KML') {
        res = res && false;
      }

      if (layer.displayInLayerSwitcher === false && layer.transparent === true) {
        res = res && false;
      }

      return res;
    });

    return layers.map((layer) => this.layerToParam(layer)).filter((param) => param != null);
  }

  /**
   * This method gets the externs layers parameters
   *
   * @public
   * @function
   */
  getLayersInLayerswitcher() {
    const layers = this.map_.getLayers().filter((layer) => {
      return layer.displayInLayerSwitcher === true && layer.transparent === true;
    });

    return layers.map((layer) => this.layerToParam(layer)).filter((param) => param != null);
  }

  /**
   * @public
   * @function
   */
  getLayersInfilterLayers() {
    const layers = this.map_.getLayers().filter((layer) => this.filterLayers.includes(layer.name));
    return layers.map((layer) => this.layerToParam(layer)).filter((param) => param != null);
  }

  /**
   * This function gets the url param from layer
   *
   * @public
   * @function
   */
  layerToParam(layer, parent = true) {
    let param;
    if (layer.name === 'osm') {
      param = layer.name;
    } else if (/mapbox/.test(layer.name)) {
      param = `MAPBOX.${layer.name}`;
    } else if (layer.type === 'WMS') {
      param = this.getWMS(layer);
    } else if (layer.type === 'WMTS') {
      param = this.getWMTS(layer);
    } else if (layer.type === 'KML') {
      param = this.getKML(layer);
    } else if (layer.type === 'WFS') {
      param = this.getWFS(layer);
    } else if (layer.type === 'GeoJSON') {
      param = this.getGeoJSON(layer);
    } else if (layer.type === 'Vector') {
      param = this.getVector(layer);
    } else if (layer.type === 'MVT') {
      param = this.getMVT(layer);
    } else if (layer.type === 'OGCAPIFeatures') {
      param = this.getOGCAPIFeatures(layer);
    } else if (layer.type === 'GeoTIFF') {
      param = this.getGeoTIFF(layer);
    } else if (layer.type === 'MapLibre') {
      param = this.getMapLibre(layer);
    } else if (layer.type === 'LayerGroup') {
      param = this.getLayerGroup(layer, parent);
    }
    return param;
  }

  /**
   * This methods gets the kml url parameters
   *
   * @public
   * @function
   */
  getKML(layer) {
    return `KML*${layer.name}*${layer.url}*${layer.extract}*${layer.label}*${layer.isVisible()}`;
  }

  /**
   * This method gets the geojson url parameter
   *
   * @public
   * @function
   */
  getGeoJSON(layer) {
    const source = !M.utils.isUndefined(layer.source)
      ? layer.serialize()
      : encodeURIComponent(layer.url);
    const style = (layer.getStyle()) ? layer.getStyle().serialize() : '';
    return `GeoJSON*${layer.name}*${source}*${layer.extract}*${style}`;
  }

  /**
   * This method gets the ogcApiFeatures url parameter
   *
   * @public
   * @function
   */
  getOGCAPIFeatures(layer) {
    const style = (layer.getStyle()) ? layer.getStyle().serialize() : '';
    return `OGCAPIFeatures*${layer.legend || layer.name}*${layer.url}*${layer.name}*${layer.limit || ''}*${layer.bbox || ''}*${layer.id || ''}*${layer.offset || ''}*${layer.format || ''}*${style}*${layer.extract || ''}`;
  }

  /**
   * This method gets the MapLibre url parameter
   *
   * @public
   * @function
   */
  getMapLibre(layer) {
    return `MapLibre*${layer.legend}*${layer.url}*${layer.name}*${layer.transparent || ''}*${layer.extract || ''}*${layer.visibility || ''}*${layer.displayInLayerSwitcher || ''}*${layer.disableBackgroundColor || ''}`;
  }

  /**
   * This method gets the geojson url parameter
   *
   * @public
   * @function
   */
  getVector(layer) {
    let source = Object.assign(layer.toGeoJSON());
    source.crs = {
      properties: {
        name: 'EPSG:4326',
      },
      type: 'name',
    };
    source = window.btoa(unescape(encodeURIComponent(JSON.stringify(source))));
    const style = (layer.getStyle()) ? layer.getStyle().serialize() : '';
    return `GeoJSON*${layer.name}*${source}**${style}`;
  }

  /**
   * This method gets the mvt url parameter
   *
   * @public
   * @function
   */
  getMVT(layer) {
    return `MVT*${layer.url}*${layer.name}*${layer.getProjection()}`;
  }

  /**
   * This method gets the wms url parameter
   *
   * @public
   * @function
   */
  getWMS(layer) {
    return `WMS*${this.normalizeString(layer.legend || layer.name)}*${layer.url}*${layer.name}*${layer.transparent}*${layer.tiled}*${layer.userMaxExtent || ''}*${layer.version}*${layer.displayInLayerSwitcher}*${layer.isQueryable()}*${layer.isVisible()}`;
  }

  /**
   * This method gets the geotiff url parameter
   *
   * @public
   * @function
   */
  getGeoTIFF(layer) {
    return `GeoTIFF*${layer.legend}*${layer.url}*${layer.name}*${layer.transparent}*${layer.projection || ''}*${layer.displayInLayerSwitcher}*${layer.isVisible()}`;
  }

  /**
   * This method gets the wfs url parameter
   *
   * @public
   * @function
   */
  getWFS(layer) {
    const style = layer.getStyle().serialize();
    return `WFS*${this.normalizeString(layer.legend || layer.name)}*${layer.url}*${layer.namespace}:${layer.name}:*${layer.geometry || ''}*${layer.ids || ''}*${layer.cql || ''}*${style || ''}`;
  }

  /**
   * This method gets the wmts url parameter
   *
   * @public
   * @function
   */
  getWMTS(layer) {
    const { code } = this.map_.getProjection();
    let legend = null;
    try {
      legend = layer.getLegend();
    } catch (err) {
      legend = layer.legend;
    }
    return `WMTS*${layer.url}*${layer.name}*${layer.matrixSet || code}*${this.normalizeString(legend)}*${layer.transparent}*${layer.options.format || 'image/png'}*${layer.displayInLayerSwitcher}*${layer.isQueryable()}*${layer.isVisible()}`;
  }

  getLayerGroup(group, parent) {
    let layers = group.getLayers();
    layers = layers.map((layer) => {
      if (this.layerToParam(layer, false) === undefined) {
        return null;
      }
      return `${this.layerToParam(layer, false)}`;
    })
      .filter((param) => param != null);
    return `LayerGroup*${group.name}*${this.normalizeString(group.legend)}*${group.isVisible()}*${group.transparent}*[${layers}]${parent ? '!' : ''}`;
  }

  // TO-DO
  // getGeneric(layer) {
  //   const ol3 = layer.getImpl().getOL3Layer();
  //   const ol3Source = ol3.getSource();
  //   const typeSource = layer.getImpl().getSourceType();
  //   const typeLayer = layer.getImpl().getLayerType();
  //   const typeFormat = layer.getImpl().getFormatType ? layer.getImpl().getFormatType() : false;

  //   const properties = ol3.getProperties();
  //   delete properties.source;

  //   const vendorOptions = `
  //     new ol.layer.${typeLayer}({
  //        source: new ol.source.${typeSource}({
  //         ${ol3Source.getParams ? `params:${JSON.stringify(ol3Source.getParams())},` : ''}
  //         url: ${ol3Source.getUrl ? ol3Source.getUrl() : ol3Source.getUrls()[0]},
  //         ${ol3Source.getLayer ? `layer: ${ol3Source.getLayer()},` : ''}
  //         ${ol3Source.getMatrixSet ? `matrixSet: ${ol3Source.getMatrixSet()},` : ''}
  //         ${ol3Source.getFormat ? `format: ${JSON.stringify(ol3Source.getFormat())},` : ''}
  //         ${ol3Source.getProjection ? `projection: ${ol3Source.getProjection()},` : ''}
  //         ${ol3Source.getTileGrid ? `tileGrid: ${ol3Source.getTileGrid()},` : ''}
  //         ${ol3Source.getStyle ? `style: ${ol3Source.getStyle()},` : ''}
  //         ${typeFormat ? `format: new ${typeFormat}(),` : ''}
  //        }),
  //        properties: ${JSON.stringify(properties)},
  //     })
  //   `;

  //   const {
  //     name = '',
  //     legend = '',
  //     transparent,
  //     minZoom,
  //     maxZoom,
  //     displayInLayerSwitcher = true,
  //     visibility = true,
  //   } = layer;

  //   return `Generic*${M.utils.encodeBase64(vendorOptions)}*${name}*${legend}
  // *${transparent}*${minZoom}*${maxZoom}*${displayInLayerSwitcher}*${visibility}`;
  // }

  /**
   * This method gets the plugins url parameter
   */
  getPlugins() {
    return this.map_.getPlugins().map((plugin) => {
      let newCurrent = '';
      if (M.utils.isFunction(plugin.getAPIRest)) {
        newCurrent = plugin.getAPIRest();
      }
      return newCurrent;
    }).join('&');
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
    return control instanceof ShareMapControl;
  }

  normalizeString(text) {
    let newText = text.replace(/,/g, '');
    newText = newText.replace(/\*/g, '');
    return newText;
  }

  accessibilityTab(html) {
    html.querySelectorAll('[tabindex="0"]').forEach((el) => el.setAttribute('tabindex', this.order));
  }
}
