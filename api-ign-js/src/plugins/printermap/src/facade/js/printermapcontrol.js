/**
 * @module M/control/PrinterMapControl
 */

import JsZip from 'jszip';
import { saveAs } from 'file-saver';
import PrinterMapControlImpl from '../../impl/ol/js/printermapcontrol';
import printermapHTML from '../../templates/printermap';
import { getValue } from './i18n/language';

export default class PrinterMapControl extends M.Control {
  /**
   * @classdesc
   * Main constructor of the class.
   *
   * @constructor
   * @extends {M.Control}
   * @api stable
   */
  constructor(
    serverUrl,
    printTemplateUrl,
    printTemplateGeoUrl,
    printStatusUrl,
    credits,
    georefActive,
    logoUrl,
    fototeca,
    headerLegend,
    filterTemplates,
    order,
  ) {
    const impl = new PrinterMapControlImpl();

    super(impl, PrinterMapControl.NAME);

    if (M.utils.isUndefined(PrinterMapControlImpl)) {
      M.exception(getValue('exception.impl'));
    }

    if (M.utils.isUndefined(PrinterMapControlImpl.prototype.encodeLayer)) {
      M.exception(getValue('exception.encode'));
    }

    /**
     * Mapfish server url
     * @private
     * @type {String}
     */
    this.serverUrl_ = serverUrl;

    /**
     * Mapfish template url
     * @private
     * @type {String}
     */
    this.printTemplateUrl_ = printTemplateUrl;

    /**
     * Mapfish template url for georef
     * @private
     * @type {String}
     */
    this.printTemplateGeoUrl_ = printTemplateGeoUrl;

    /**
     * Url for getting priting status
     * @private
     * @type {String}
     */
    this.printStatusUrl_ = printStatusUrl;

    /**
     * Credits text for template
     * @private
     * @type {String}
     */
    this.credits_ = credits;

    /**
     * Active or disable georeferenced image download
     * @private
     * @type {Boolean}
     */
    this.georefActive_ = georefActive;

    /**
     * Active or disable fototeca fixed description
     * @private
     * @type {Boolean}
     */
    this.fototeca_ = fototeca;

    /**
     * Map title
     * @private
     * @type {HTMLElement}
     */
    this.inputTitle_ = null;

    /**
     * Map description
     * @private
     * @type {HTMLElement}
     */
    this.areaDescription_ = null;

    /**
     * Layout
     * @private
     * @type {HTMLElement}
     */
    this.layout_ = null;

    /**
     * Map format to print
     * @private
     * @type {HTMLElement}
     */
    this.format_ = null;

    /**
     * Map projection to print
     * @private
     * @type {HTMLElement}
     */
    this.projection_ = null;

    /**
     * Map dpi to print
     * @private
     * @type {HTMLElement}
     */
    this.dpi_ = null;

    /**
     * Max map dpi to print
     * @private
     * @type {HTMLElement}
     */
    this.dpiMax_ = null;

    this.dpiGeo_ = 120;

    /**
     * Keep view boolean
     * @private
     * @type {HTMLElement}
     */
    this.keepView_ = null;

    /**
     * Georref image boolean
     * @private
     * @type {HTMLElement}
     */
    this.georef_ = null;

    /**
     * Mapfish params
     * @private
     * @type {String}
     */
    this.params_ = {
      layout: {
        outputFilename: 'mapa_${yyyy-MM-dd_hhmmss}',
      },
      pages: {
        clientLogo: '', // logo url
        creditos: getValue('credits'),
      },
      parameters: {
        logo: logoUrl,
        headerLegend,
      },
    };

    /**
     * Mapfish params for georef
     * @private
     * @type {String}
     */
    this.paramsGeo_ = {
      layout: {
        outputFilename: 'mapa_${yyyy-MM-dd_hhmmss}',
      },
      pages: {
        clientLogo: '', // logo url
        creditos: getValue('printInfo'),
      },
      parameters: {},
    };

    /**
     * Container of maps available for download
     * @private
     * @type {HTMLElement}
     */
    this.queueContainer_ = null;

    /**
     * Facade of the map
     * @private
     * @type {Promise}
     */
    this.capabilitiesPromise_ = null;

    /**
     * Mapfish options params
     * @private
     * @type {String}
     */
    this.options_ = {
      dpi: 150,
      keepView: true,
      format: 'pdf',
      legend: 'false',
      layout: 'A4 horizontal',
    };

    this.layoutOptions_ = [];
    this.dpisOptions_ = [];
    // this.outputFormats_ = ['pdf', 'png' /*, 'jpg'*/];
    this.outputFormats_ = ['pdf', 'png'];
    this.documentRead_ = document.createElement('img');
    this.canvas_ = document.createElement('canvas');
    this.proyectionsDefect_ = ['EPSG:25828', 'EPSG:25829', 'EPSG:25830', 'EPSG:25831', 'EPSG:3857', 'EPSG:4326', 'EPSG:4258'];
    this.filterTemplates_ = filterTemplates;

    this.order = order;
  }

  /**
   * This function checks when map printing is finished.
   * @param {String} url - Mapfish GET request url
   * @param {Function} callback - function that removes loading icon class.
   */
  getStatus(url, callback) {
    M.proxy(false);
    const param = new Date().getTime();
    M.remote.get(`${url}?timestamp=${param}`).then((response) => {
      const statusJson = JSON.parse(response.text);
      const { status } = statusJson;
      if (status === 'finished') {
        M.proxy(true);
        callback();
      } else if (status === 'error' || status === 'cancelled') {
        M.proxy(true);
        callback();
        if (statusJson.error.toLowerCase().indexOf('network is unreachable') > -1 || statusJson.error.toLowerCase().indexOf('illegalargument') > -1) {
          M.dialog.error(getValue('exception.tile'));
        } else {
          M.dialog.error(getValue('exception.error'));
        }

        this.queueContainer_.lastChild.remove();
      } else {
        M.proxy(true);
        setTimeout(() => this.getStatus(url, callback), 1000);
      }
    });
  }

  /**
   * This function creates the view to the specified map.
   *
   * @public
   * @function
   * @param {M.Map} map to add the control
   * @api stabletrue
   */
  createView(map) {
    // eslint-disable-next-line
    console.warn(getValue('exception.printermap_obsolete'));
    const promise = new Promise((success, fail) => {
      this.getCapabilities().then((capabilitiesParam) => {
        const capabilities = capabilitiesParam;
        let i = 0;
        let ilen;

        // default layout
        for (i = 0, ilen = capabilities.layouts.length; i < ilen; i += 1) {
          const layout = capabilities.layouts[i];
          if (layout.name === this.options_.layout) {
            layout.default = true;
            break;
          }
        }

        if (this.filterTemplates_.length > 0) {
          capabilities.layouts = capabilities.layouts.filter((l) => {
            return this.filterTemplates_.indexOf(l.name) > -1;
          });
        }

        // show only template names without 'jpg' on their names
        capabilities.layouts = capabilities.layouts.filter((l) => {
          return !l.name.endsWith('jpg');
        });

        capabilities.layouts.sort((a, b) => {
          let res = 0;
          if (a.name.indexOf('(Perfil') > -1 && b.name.indexOf('(Perfil') === -1) {
            res = 1;
          } else if (a.name.indexOf('(Perfil') === -1 && b.name.indexOf('(Perfil') > -1) {
            res = -1;
          } else if (a.name === b.name) {
            res = 0;
          } else {
            res = a.name > b.name ? 1 : -1;
          }

          return res;
        });

        this.layoutOptions_ = [].concat(capabilities.layouts.map((item) => {
          return item.name;
        }));

        capabilities.proyections = [];
        const proyectionsDefect = this.proyectionsDefect_;

        for (i = 0, ilen = proyectionsDefect.length; i < ilen; i += 1) {
          if (proyectionsDefect[i] !== null) {
            const proyection = proyectionsDefect[i];
            const object = { value: proyection };
            if (proyection === 'EPSG:4258') {
              object.default = true;
            }

            capabilities.proyections.push(object);
          }
        }

        capabilities.dpis = [];
        let attribute;
        // default dpi
        // recommended DPI list attribute search
        for (i = 0, ilen = capabilities.layouts[0].attributes.length; i < ilen; i += 1) {
          if (capabilities.layouts[0].attributes[i].clientInfo !== undefined) {
            attribute = capabilities.layouts[0].attributes[i];
            this.dpiMax_ = attribute.clientInfo.maxDPI;
          }
        }

        for (i = 1, ilen = attribute.clientInfo.dpiSuggestions.length; i < ilen; i += 1) {
          const dpi = attribute.clientInfo.dpiSuggestions[i];

          if (parseInt(dpi, 10) === this.options_.dpi) {
            dpi.default = true;
            break;
          }
          const object = { value: dpi };
          capabilities.dpis.push(object);
        }

        this.dpisOptions_ = [].concat(capabilities.dpis.map((item) => {
          return item.value;
        }));

        if (Array.isArray(capabilities.formats)) {
          this.outputFormats_ = capabilities.formats.filter((f) => {
            return f !== 'jpg';
          });
        }

        capabilities.format = this.outputFormats_.map((format) => {
          return {
            name: format,
            default: format === 'pdf',
          };
        });

        // keepView
        capabilities.keepView = this.options_.keepView;

        // georefActive
        capabilities.georefActive = this.georefActive_;

        // fototeca
        capabilities.fototeca = this.fototeca_;

        // translations
        capabilities.translations = {
          tooltip: getValue('tooltip'),
          title: getValue('title'),
          description: getValue('description'),
          layout: getValue('layout'),
          format: getValue('format'),
          projection: getValue('projection'),
          keep: getValue('keep'),
          geo: getValue('geo'),
          print: getValue('print'),
          delete: getValue('delete'),
          download: getValue('download'),
          minimize: getValue('minimize'),
          fototeca: getValue('fototeca'),
        };

        const html = M.template.compileSync(printermapHTML, {
          jsonp: true,
          vars: capabilities,
        });

        this.accessibilityTab(html);

        this.addEvents(html);
        success(html);
      });
    });
    return promise;
  }

  /**
   * This function adds event listeners.
   *
   * @public
   * @function
   * @param {M.Map} map to add the control
   * @api stable
   */
  addEvents(html) {
    this.element_ = html;
    this.inputTitle_ = this.element_.querySelector('.form div.title > input');
    this.areaDescription_ = this.element_.querySelector('.form div.description > textarea');
    const selectLayout = this.element_.querySelector('.form div.layout > select');
    selectLayout.addEventListener('change', (e) => {
      const layoutValue = selectLayout.value;
      this.setLayout({
        value: layoutValue,
        name: layoutValue,
      });
    });

    const layoutValue = selectLayout.value;
    this.setLayout({
      value: layoutValue,
      name: layoutValue,
    });

    const selectDpi = this.element_.querySelector('.form div.dpi > select');
    selectDpi.addEventListener('change', (e) => {
      const dpiValue = selectDpi.value;
      this.setDpi({
        value: dpiValue,
        name: dpiValue,
      });
    });

    const dpiValue = selectDpi.value;
    this.setDpi({
      value: dpiValue,
      name: dpiValue,
    });

    const selectFormat = this.element_.querySelector('.form div.format > select');
    selectFormat.addEventListener('change', (e) => {
      this.setFormat(selectFormat.value);
    });
    this.setFormat(selectFormat.value);

    const selectProjection = this.element_.querySelector('.form div.projection > select');
    if (this.georefActive_) {
      selectProjection.addEventListener('change', (e) => {
        const projectionValue = selectProjection.value;
        this.setProjection({
          value: projectionValue,
          name: projectionValue,
        });
      });
      const projectionValue = selectProjection.value;
      this.setProjection({
        value: projectionValue,
        name: projectionValue,
      });
    }

    const checkboxKeepView = this.element_.querySelector('.form div.keepview > input');
    checkboxKeepView.addEventListener('click', (e) => {
      this.setKeepView(checkboxKeepView.checked);
      if (checkboxKeepView.checked) {
        document.getElementById('dpi').disabled = true;
      } else {
        document.getElementById('dpi').disabled = false;
      }
    });
    this.setKeepView(checkboxKeepView.checked);

    const checkboxGeoref = this.element_.querySelector('.form div.georef > input');
    if (this.georefActive_) {
      checkboxGeoref.addEventListener('click', (e) => {
        this.setGeoref(checkboxGeoref.checked);
        if (checkboxGeoref.checked === true) {
          document.getElementById('description').disabled = true;
          document.getElementById('layout').disabled = true;
          document.getElementById('dpi').disabled = true;
          document.getElementById('format').disabled = true;
          document.getElementById('keepview').disabled = true;
          document.getElementById('projection').disabled = false;
          checkboxKeepView.checked = this.options_.keepView;
        } else {
          document.getElementById('description').disabled = false;
          document.getElementById('layout').disabled = false;
          document.getElementById('dpi').disabled = false;
          document.getElementById('format').disabled = false;
          document.getElementById('keepview').disabled = false;
          document.getElementById('projection').disabled = true;
        }
      });
      this.setGeoref(checkboxGeoref.checked);
    }

    const printBtn = this.element_.querySelector('.button > button.print');
    printBtn.addEventListener('click', this.printClick_.bind(this));
    const cleanBtn = this.element_.querySelector('.button > button.remove');
    cleanBtn.addEventListener('click', (event) => {
      event.preventDefault();
      // reset values
      this.inputTitle_.value = '';
      if (!this.fototeca_) {
        this.areaDescription_.value = '';
        document.getElementById('description').disabled = false;
      }

      selectLayout.value = this.layoutOptions_[0];
      selectDpi.value = this.dpisOptions_[0];
      selectFormat.value = this.options_.format;
      this.projection_ = 'EPSG:3857';
      checkboxKeepView.checked = this.options_.keepView;
      if (this.georefActive_) {
        checkboxGeoref.checked = this.options_.georef;
      }

      document.getElementById('layout').disabled = false;
      document.getElementById('dpi').disabled = false;
      document.getElementById('format').disabled = false;
      document.getElementById('keepview').disabled = false;
      if (this.georefActive_) {
        document.getElementById('projection').disabled = true;
      }

      // Create events and init
      const changeEvent = document.createEvent('HTMLEvents');
      changeEvent.initEvent('change');
      const clickEvent = document.createEvent('HTMLEvents');
      // Fire listeners
      clickEvent.initEvent('click');
      selectLayout.dispatchEvent(changeEvent);
      selectDpi.dispatchEvent(changeEvent);
      selectFormat.dispatchEvent(changeEvent);
      if (this.georefActive_) {
        selectProjection.dispatchEvent(changeEvent);
      }

      checkboxKeepView.dispatchEvent(clickEvent);
      Array.prototype.forEach.apply(this.queueContainer_.children, [(child) => {
        child.removeEventListener('click', this.downloadPrint);
      }, this]);

      this.queueContainer_.innerHTML = '';
    });

    this.queueContainer_ = this.element_.querySelector('.queue > ul.queue-container');
    M.utils.enableTouchScroll(this.queueContainer_);
    document.addEventListener('keydown', (evt) => {
      if (evt.key === 'Escape') {
        const elem = document.querySelector('.m-panel.m-printermap.opened');
        if (elem !== null) {
          elem.querySelector('button.m-panel-btn').click();
        }
      }
    });
  }

  /**
   * Sets layout
   *
   * @private
   * @function
   */
  setLayout(layout) {
    this.layout_ = layout;
  }

  /**
   * Sets format
   *
   * @private
   * @function
   */
  setFormat(format) {
    this.format_ = format;
  }

  /**
   * Sets projection
   *
   * @private
   * @function
   */
  setProjection(projection) {
    this.projection_ = projection;
  }

  /**
   * Sets dpi
   *
   * @private
   * @function
   */
  setDpi(dpi) {
    this.dpi_ = dpi;
  }

  /**
   * Sets keep view option
   *
   * @private
   * @function
   */
  setKeepView(keepView) {
    this.keepView_ = keepView;
  }

  /**
   * Sets georef image option
   *
   * @private
   * @function
   */
  setGeoref(georef) {
    this.georef_ = georef;
  }

  /**
   * This function prints on click
   *
   * @private
   * @function
   */
  printClick_(evt) {
    evt.preventDefault();
    let getPrintData;
    let printUrl;
    let download;
    if (this.georef_) {
      getPrintData = this.getPrintDataGeo();
      printUrl = this.printTemplateGeoUrl_;
    } else {
      getPrintData = this.getPrintData();
      printUrl = this.printTemplateUrl_;
      download = this.downloadPrint;
    }

    getPrintData.then((printData) => {
      if (this.georef_) {
        download = this.downloadGeoPrint.bind(this, printData.attributes.map.bbox);
      }

      let url = M.utils.concatUrlPaths([printUrl, `report.${printData.outputFormat}`]);
      const queueEl = this.createQueueElement();
      if (Array.prototype.slice.call(this.queueContainer_.childNodes).length > 0) {
        this.queueContainer_.insertBefore(queueEl, this.queueContainer_.firstChild);
      } else {
        this.queueContainer_.appendChild(queueEl);
      }

      queueEl.classList.add(PrinterMapControl.LOADING_CLASS);
      url = M.utils.addParameters(url, 'mapeaop=geoprint');
      const profilControl = this.map_.getMapImpl().getControls().getArray().filter((c) => {
        return c.element !== undefined && c.element.classList !== undefined && c.element.classList.contains('ol-profil');
      });

      if ((this.georef_ === null || !this.georef_) && profilControl.length > 0) {
        // eslint-disable-next-line no-param-reassign
        printData.attributes.profil = profilControl[0].getImage();
      }

      // FIXME: delete proxy deactivation and uncomment if/else when proxy is fixed on Mapea
      M.proxy(false);
      M.remote.post(url, printData).then((responseParam) => {
        let response = responseParam;
        const responseStatusURL = JSON.parse(response.text);
        const ref = responseStatusURL.ref;
        const statusURL = M.utils.concatUrlPaths([this.printStatusUrl_, `${ref}.json`]);
        this.getStatus(statusURL, () => queueEl.classList.remove(PrinterMapControl.LOADING_CLASS));

        // if (response.error !== true) { // withoud proxy, response.error === true
        let downloadUrl;
        try {
          response = JSON.parse(response.text);
          const imageUrl = response.downloadURL.substring(response.downloadURL.indexOf('/print'), response.downloadURL.length);
          downloadUrl = M.utils.concatUrlPaths([this.serverUrl_, imageUrl]);
          this.documentRead_.src = downloadUrl;
        } catch (err) {
          M.exception(err);
        }
        queueEl.setAttribute(PrinterMapControl.DOWNLOAD_ATTR_NAME, downloadUrl);
        queueEl.addEventListener('click', download);
        queueEl.addEventListener('keydown', ({ key }) => {
          if (key === 'Enter') download();
        });
        // } else {
        //   M.dialog.error('Se ha producido un error en la impresión.');
        // }
      });
      M.proxy(true);
    });
    if (!M.utils.isNullOrEmpty(this.getImpl().errors)) {
      M.toast.error(getValue('exception.error_layers') + this.getImpl().errors.join(', '), null, 6000);
      this.getImpl().errors = [];
    }
  }

  /**
   * Gets capabilities
   *
   * @public
   * @function
   * @param {M.Map} map to add the control
   * @api stable
   */
  getCapabilities() {
    if (M.utils.isNullOrEmpty(this.capabilitiesPromise_)) {
      this.capabilitiesPromise_ = new Promise((success, fail) => {
        const capabilitiesUrl = M.utils.concatUrlPaths([this.printTemplateUrl_, 'capabilities.json']);
        M.proxy(false);
        M.remote.get(capabilitiesUrl).then((response) => {
          let capabilities = {};
          try {
            capabilities = JSON.parse(response.text);
          } catch (err) {
            M.exception(err);
          }
          success(capabilities);
        });

        M.proxy(true);
      });
    }
    return this.capabilitiesPromise_;
  }

  /**
   * Converts decimal degrees coordinates to degrees, minutes, seconds
   * @public
   * @function
   * @param {String} coordinate - single coordinate (one of a pair)
   * @api
   */
  converterDecimalToDMS(coordinate) {
    let dms;
    let aux;
    const coord = coordinate.toString();
    const splittedCoord = coord.split('.');
    // Degrees
    dms = `${splittedCoord[0]}º `;
    // Minutes
    aux = `0.${splittedCoord[1]}`;
    aux *= 60;
    aux = aux.toString();
    aux = aux.split('.');
    dms = `${dms}${aux[0]}' `;
    // Seconds
    aux = `0.${aux[1]}`;
    aux *= 60;
    aux = aux.toString();
    aux = aux.split('.');
    dms = `${dms}${aux[0]}'' `;
    return dms;
  }

  /**
   * Converts original bbox coordinates to DMS coordinates.
   * @public
   * @function
   * @api
   * @param {Array<Object>} bbox - { x: {min, max}, y: {min, max} }
   */
  convertBboxToDMS(bbox) {
    const proj = this.map_.getProjection();
    let dmsBbox = bbox;
    if (proj.units === 'm') {
      const min = [bbox.x.min, bbox.y.min];
      const max = [bbox.x.max, bbox.y.max];
      const newMin = this.getImpl().reproject(proj.code, min);
      const newMax = this.getImpl().reproject(proj.code, max);
      dmsBbox = {
        x: {
          min: newMin[0],
          max: newMax[0],
        },
        y: {
          min: newMin[1],
          max: newMax[1],
        },
      };
    }

    dmsBbox = this.convertDecimalBoxToDMS(dmsBbox);
    return dmsBbox;
  }

  /**
   * Converts decimal coordinates Bbox to DMS coordinates Bbox.
   * @public
   * @function
   * @api
   * @param { Array < Object > } bbox - { x: { min, max }, y: { min, max } }
   */
  convertDecimalBoxToDMS(bbox) {
    return {
      x: {
        min: this.converterDecimalToDMS(bbox.x.min),
        max: this.converterDecimalToDMS(bbox.x.max),
      },
      y: {
        min: this.converterDecimalToDMS(bbox.y.min),
        max: this.converterDecimalToDMS(bbox.y.max),
      },
    };
  }

  /**
   * This function returns request JSON.
   *
   * @private
   * @function
   */
  getPrintData() {
    const title = this.inputTitle_.value;
    let description = this.areaDescription_.value;
    const credits = this.credits_;
    if (credits.length > 2) {
      if (description.length > 0) {
        description += ` - ${credits}`;
      } else {
        description += credits;
      }
    }

    const projection = this.map_.getProjection().code;
    const bbox = this.map_.getBbox();
    const dmsBbox = this.convertBboxToDMS(bbox);
    let layout = this.layout_.name;
    let dpi;
    if (!this.keepView_) {
      dpi = this.dpi_.value;
    } else {
      dpi = 120;
    }
    const outputFormat = this.format_;
    const parameters = this.params_.parameters;
    const attributionContainer = document.querySelector('#m-attributions-container>div>a');
    const attribution = attributionContainer !== null
      ? `${getValue('base')}: ${attributionContainer.innerHTML}`
      : '';

    if (outputFormat === 'jpg') {
      layout += ' jpg';
    }

    const date = new Date();
    const currentDate = ''.concat(date.getDate(), '/', date.getMonth() + 1, '/', date.getFullYear());
    let fileTitle = title.replace(' ', '');
    if (fileTitle.length <= 8) {
      fileTitle = fileTitle.concat('${yyyyMMddhhmmss}');
      this.params_.layout.outputFilename = fileTitle;
    } else {
      fileTitle = fileTitle.substring(0, 7).concat('${yyyyMMddhhmmss}');
      this.params_.layout.outputFilename = fileTitle;
    }

    const printData = M.utils.extend({
      layout,
      outputFormat,
      attributes: {
        title,
        description,
        attributionInfo: attribution,
        refsrs: this.turnProjIntoLegend(projection),
        printDate: currentDate,
        map: {
          dpi,
          projection,
          useAdjustBounds: true,
        },
        xCoordTopLeft: dmsBbox.y.max,
        yCoordTopLeft: dmsBbox.x.min,
        xCoordTopRight: dmsBbox.y.max,
        yCoordTopRight: dmsBbox.x.max,
        xCoordBotRight: dmsBbox.y.min,
        yCoordBotRight: dmsBbox.x.max,
        xCoordBotLeft: dmsBbox.y.min,
        yCoordBotLeft: dmsBbox.x.min,
      },
    }, this.params_.layout);

    return this.encodeLayers().then((encodedLayers) => {
      printData.attributes.map.layers = encodedLayers.filter((l) => M.utils.isObject(l));
      printData.attributes = Object.assign(printData.attributes, parameters);
      if (projection !== 'EPSG:3857' && this.map_.getLayers().some((layer) => (layer.type === M.layer.type.OSM || layer.type === M.layer.type.Mapbox))) {
        printData.attributes.map.projection = 'EPSG:3857';
      }

      printData.attributes.map.bbox = [bbox.x.min, bbox.y.min, bbox.x.max, bbox.y.max];
      if (projection !== 'EPSG:3857' && this.map_.getLayers().some((layer) => (layer.type === M.layer.type.OSM || layer.type === M.layer.type.Mapbox))) {
        printData.attributes.map.bbox = this.getImpl().transformExt(printData.attributes.map.bbox, projection, 'EPSG:3857');
      }

      return printData;
    });
  }

  /**
   * This function returns request JSON for georef image.
   *
   * @private
   * @function
   */
  getPrintDataGeo() {
    let projection;
    if (this.projection_.value === 'EPSG:4326' || this.projection_.value === 'EPSG:4258') {
      projection = this.map_.getProjection().code;
      this.projection_.value = projection;
    } else {
      projection = this.projection_.value;
    }

    const bbox = this.map_.getBbox();
    const width = this.map_.getMapImpl().getSize()[0];
    const height = this.map_.getMapImpl().getSize()[1];
    const layout = 'plain';
    // const dpi = this.dpiMax_;
    const dpi = this.dpiGeo_;
    const outputFormat = 'jpg';
    const parameters = this.paramsGeo_.parameters;
    const printData = M.utils.extend({
      layout,
      outputFormat,
      attributes: {
        map: {
          dpi,
          projection,
        },
      },
    }, this.paramsGeo_.layout);

    return this.encodeLayersGeo().then((encodeLayersGeo) => {
      const returnData = encodeLayersGeo;
      let encodedLayersModified = [];
      if (projection === 'EPSG:25830') {
        for (let i = 0; i < returnData.length; i += 1) {
          if (returnData[i].matrixSet != null) {
            const matrixSet = returnData[i].matrixSet.replace('GoogleMapsCompatible', 'EPSG:25830');
            returnData[i].matrixSet = matrixSet;
          }
          encodedLayersModified.push(returnData[i]);
        }
      } else {
        encodedLayersModified = encodeLayersGeo;
      }

      printData.attributes.map.layers = encodedLayersModified;
      printData.attributes = Object.assign(printData.attributes, parameters);
      printData.attributes.map.projection = projection;
      printData.attributes.map.dpi = dpi;
      printData.attributes.map.width = width;
      printData.attributes.map.height = height;
      printData.attributes.map.bbox = [bbox.x.min, bbox.y.min, bbox.x.max, bbox.y.max];
      if (this.map_.getProjection().code !== projection) {
        printData.attributes.map.bbox = this.getImpl().transformExt(
          printData.attributes.map.bbox,
          this.map_.getProjection().code,
          projection,
        );
      }

      return printData;
    });
  }

  /**
   * This function encodes layers.
   *
   * @private
   * @function
   */
  encodeLayers() {
    // Filters visible layers whose resolution is inside map resolutions range
    // and that doesn't have Cluster style.
    let layers = this.map_.getLayers().filter((layer) => {
      return (layer.isVisible() && layer.inRange() && layer.name !== 'cluster_cover' && layer.name !== 'selectLayer' && layer.name !== 'empty_layer');
    });

    if (this.map_.getZoom() === 20) {
      let contains = false;
      layers.forEach((l) => {
        if (l.url !== undefined && l.url === 'https://tms-pnoa-ma.idee.es/1.0.0/pnoa-ma/{z}/{x}/{-y}.jpeg') {
          contains = true;
        }
      });

      if (contains) {
        layers = layers.filter((l) => {
          return l.url !== 'https://tms-pnoa-ma.idee.es/1.0.0/pnoa-ma/{z}/{x}/{-y}.jpeg';
        });
      }
    } else if (this.map_.getZoom() < 20) {
      let contains = false;
      layers.forEach((l) => {
        if (l.url !== undefined && l.name !== undefined && l.url === 'https://www.ign.es/wmts/pnoa-ma?' && l.name === 'OI.OrthoimageCoverage') {
          contains = true;
        }
      });

      if (contains) {
        layers = layers.filter((l) => {
          return l.url !== 'https://www.ign.es/wmts/pnoa-ma?' && l.name !== 'OI.OrthoimageCoverage';
        });
      }
    }

    let numLayersToProc = layers.length;
    const otherLayers = this.getImpl().getParametrizedLayers('IMAGEN', layers);
    if (otherLayers.length > 0) {
      layers = layers.concat(otherLayers);
      numLayersToProc = layers.length;
    }

    layers = layers.sort((a, b) => {
      let res = 0;
      const zia = a.getZIndex() !== null ? a.getZIndex() : 0;
      const zib = b.getZIndex() !== null ? b.getZIndex() : 0;
      if (zia > zib) {
        res = 1;
      } else if (zia < zib) {
        res = -1;
      }

      return res;
    });

    return (new Promise((success, fail) => {
      const encodedLayers = [];
      layers.forEach((layer, index) => {
        this.getImpl().encodeLayer(layer).then((encodedLayer) => {
          if (!M.utils.isNullOrEmpty(encodedLayer)) {
            encodedLayers[index] = encodedLayer;
          }

          numLayersToProc -= 1;
          if (numLayersToProc === 0) {
            // Mapfish requires reverse order
            success(encodedLayers.reverse());
          }
        });
      });
    }));
  }

  /**
   * This function encodes layers for georef image.
   *
   * @private
   * @function
   */
  encodeLayersGeo() {
    // Filters WMS and WMTS visible layers whose resolution is inside map resolutions range
    // and that doesn't have Cluster style.
    let layers = this.map_.getLayers().filter((layer) => {
      return (layer.isVisible() && layer.inRange() && layer.name !== 'cluster_cover' && layer.name !== 'selectLayer' && layer.name !== 'empty_layer' && ['WMS', 'WMTS', 'TMS', 'XYZ'].indexOf(layer.type) > -1);
    });

    if (this.map_.getZoom() === 20) {
      let contains = false;
      layers.forEach((l) => {
        if (l.url !== undefined && l.url === 'https://tms-pnoa-ma.idee.es/1.0.0/pnoa-ma/{z}/{x}/{-y}.jpeg') {
          contains = true;
        }
      });

      if (contains) {
        layers = layers.filter((l) => {
          return l.url !== 'https://tms-pnoa-ma.idee.es/1.0.0/pnoa-ma/{z}/{x}/{-y}.jpeg';
        });
      }
    } else if (this.map_.getZoom() < 20) {
      let contains = false;
      layers.forEach((l) => {
        if (l.url !== undefined && l.name !== undefined && l.url === 'https://www.ign.es/wmts/pnoa-ma?' && l.name === 'OI.OrthoimageCoverage') {
          contains = true;
        }
      });

      if (contains) {
        layers = layers.filter((l) => {
          return l.url !== 'https://www.ign.es/wmts/pnoa-ma?' && l.name !== 'OI.OrthoimageCoverage';
        });
      }
    }

    const encodedLayersModified = [];
    if (this.projection_.value === 'EPSG:3857') {
      for (let i = 0; i < layers.length; i += 1) {
        if (layers[i].matrixSet != null) {
          const matrixSet = layers[i].matrixSet.replace(layers[i].matrixSet, 'GoogleMapsCompatible');
          const optsMatrixSet = layers[i].options.matrixSet.replace(layers[i].matrixSet, 'GoogleMapsCompatible');
          layers[i].matrixSet = matrixSet;
          layers[i].options.matrixSet = optsMatrixSet;
        }

        encodedLayersModified.push(layers[i]);
      }

      layers = encodedLayersModified;
    } else {
      for (let i = 0; i < layers.length; i += 1) {
        if (layers[i].matrixSet != null) {
          const matrixSet = layers[i].matrixSet
            .replace(layers[i].matrixSet, this.projection_.value);
          const optsMatrixSet = layers[i].options.matrixSet
            .replace(layers[i].matrixSet, this.projection_.value);
          layers[i].matrixSet = matrixSet;
          layers[i].options.matrixSet = optsMatrixSet;
        }

        encodedLayersModified.push(layers[i]);
      }

      layers = encodedLayersModified;
    }

    let numLayersToProc = layers.length;
    const otherLayers = this.getImpl().getParametrizedLayers('IMAGEN', layers);
    if (otherLayers.length > 0) {
      layers = layers.concat(otherLayers);
      numLayersToProc = layers.length;
    }

    layers = layers.sort((a, b) => {
      let res = 0;
      const zia = a.getZIndex() !== null ? a.getZIndex() : 0;
      const zib = b.getZIndex() !== null ? b.getZIndex() : 0;
      if (zia > zib) {
        res = 1;
      } else if (zia < zib) {
        res = -1;
      }

      return res;
    });

    return (new Promise((success, fail) => {
      const encodedLayers = [];
      layers.forEach((layer, index) => {
        this.getImpl().encodeLayer(layer).then((encodedLayer) => {
          if (!M.utils.isNullOrEmpty(encodedLayer)) {
            encodedLayers[index] = encodedLayer;
          }

          numLayersToProc -= 1;
          if (numLayersToProc === 0) {
            // Mapfish requires reverse order
            success(encodedLayers.reverse());
          }
        });
      });
    }));
  }

  /**
   * This function creates list element.
   *
   * @public
   * @function
   * @api stable
   */
  createQueueElement() {
    const queueElem = document.createElement('li');
    queueElem.setAttribute('tabindex', '0');
    let title = this.inputTitle_.value;
    if (M.utils.isNullOrEmpty(title)) {
      title = getValue('no_title');
    }
    queueElem.innerHTML = title;
    return queueElem;
  }

  /**
   * This function downloads printed map.
   *
   * @public
   * @function
   * @api stable
   */
  downloadPrint(event) {
    event.preventDefault();
    const downloadUrl = this.getAttribute(PrinterMapControl.DOWNLOAD_ATTR_NAME);
    if (!M.utils.isNullOrEmpty(downloadUrl)) {
      window.open(downloadUrl, '_blank');
    }
  }

  /**
   * This function downloads geo printed map.
   *
   * @public
   * @function
   * @api stable
   */
  downloadGeoPrint(bbox, event) {
    const base64image = this.getBase64Image(this.documentRead_.src);
    base64image.then((resolve) => {
      const size = this.map_.getMapImpl().getSize();
      const Px = (((bbox[2] - bbox[0]) / size[0]) * (72 / this.dpiGeo_)).toString();
      const GiroA = (0).toString();
      const GiroB = (0).toString();
      const Py = (-((bbox[3] - bbox[1]) / size[1]) * (72 / this.dpiGeo_)).toString();
      const Cx = (bbox[0] + (Px / 2)).toString();
      const Cy = (bbox[3] + (Py / 2)).toString();
      const f = new Date();
      const titulo = 'mapa_'.concat(f.getFullYear(), '-', f.getMonth() + 1, '-', f.getDay() + 1, '_', f.getHours(), f.getMinutes(), f.getSeconds());
      const zip = new JsZip();
      zip.file(titulo.concat('.jgw'), Px.concat('\n', GiroA, '\n', GiroB, '\n', Py, '\n', Cx, '\n', Cy));
      zip.file(titulo.concat('.jpg'), resolve, { base64: true });
      zip.generateAsync({ type: 'blob' }).then((content) => {
        saveAs(content, titulo.concat('.zip'));
      });
    }).catch((err) => {
      M.dialog.error(getValue('exception.imageError'));
    });
  }

  getBase64Image(imgUrl) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.setAttribute('crossorigin', 'anonymous');
      img.src = imgUrl;
      img.onload = function can() {
        this.canvas_ = document.createElement('canvas');
        this.canvas_.width = img.width;
        this.canvas_.height = img.height;
        const ctx = this.canvas_.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const dataURL = this.canvas_.toDataURL('image/jpeg', 1.0);
        resolve(dataURL.replace(/^data:image\/(png|jpeg);base64,/, ''));
      };

      img.onerror = function rej() {
        Promise.reject(new Error(getValue('exception.loaderror')));
      };
    });
  }

  /**
   *  Converts epsg code to projection name.
   * @public
   * @function
   * @param {String} projection - EPSG:xxxx
   * @api
   */
  turnProjIntoLegend(projection) {
    let projectionLegend;
    switch (projection) {
      case 'EPSG:4258':
        projectionLegend = 'EPSG:4258 (ETRS89)';
        break;
      case 'EPSG:4326':
        projectionLegend = 'EPSG:4326 (WGS84)';
        break;
      case 'EPSG:3857':
        projectionLegend = 'EPSG:3857 (WGS84)';
        break;
      case 'EPSG:25831':
        projectionLegend = `EPSG:25831 (UTM ${getValue('zone')} 31N)`;
        break;
      case 'EPSG:25830':
        projectionLegend = `EPSG:25830 (UTM ${getValue('zone')} 30N)`;
        break;
      case 'EPSG:25829':
        projectionLegend = `EPSG:25829 (UTM ${getValue('zone')} 29N)`;
        break;
      case 'EPSG:25828':
        projectionLegend = `EPSG:25828 (UTM ${getValue('zone')} 28N)`;
        break;
      default:
        projectionLegend = '';
    }
    return projectionLegend;
  }

  /**
   * This function checks if an object is equal to this control.
   *
   * @function
   * @api stable
   */
  equals(obj) {
    let equals = false;
    if (obj instanceof PrinterMapControl) {
      equals = (this.name === obj.name);
    }
    return equals;
  }

  accessibilityTab(html) {
    html.querySelectorAll('[tabindex="0"]').forEach((el) => el.setAttribute('tabindex', this.order));
  }
}

/**
 * Name for this controls
 * @const
 * @type {string}
 * @public
 * @api stable
 */
PrinterMapControl.NAME = 'printermapcontrol';

/**
 * M.template for this controls
 * @const
 * @type {string}
 * @public
 * @api stable
 */
PrinterMapControl.TEMPLATE = 'printermap.html';

/**
 * M.template for this controls
 * @const
 * @type {string}
 * @public
 * @api stable
 */
PrinterMapControl.LOADING_CLASS = 'printing';

/**
 * M.template for this controls
 * @const
 * @type {string}
 * @public
 * @api stable
 */
PrinterMapControl.DOWNLOAD_ATTR_NAME = 'data-donwload-url-print';
