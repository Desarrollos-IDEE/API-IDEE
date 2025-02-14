/**
 * @module M/control/Georefimage2Control
 */

import JsZip from 'jszip';
import { saveAs } from 'file-saver';
import Georefimage2ControlImpl from '../../impl/ol/js/georefimage2control';
import georefimage2HTML from '../../templates/georefimage2';
import { getValue } from './i18n/language';

const TIMEOUT = 90;

export default class Georefimage2Control extends M.Control {
  /**
   * @classdesc
   * Main constructor of the class.
   *
   * @constructor
   * @extends {M.Control}
   * @api stable
   */
  constructor(serverUrl, printTemplateUrl, printStatusUrl, order) {
    const impl = new Georefimage2ControlImpl();
    super(impl, 'georefimage2control');
    if (M.utils.isUndefined(Georefimage2ControlImpl)) {
      M.exception(getValue('exception.impl'));
    }

    if (M.utils.isUndefined(Georefimage2ControlImpl.prototype.encodeLayer)) {
      M.exception(getValue('exception.encode_method'));
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
     * Url for getting priting status
     * @private
     * @type {String}
     */
    this.printStatusUrl_ = printStatusUrl;

    /**
     * Layout
     * @private
     * @type {HTMLElement}
     */
    this.layout_ = 'A4 horizontal jpg';

    /**
     * Map format to print
     * @private
     * @type {HTMLElement}
     */
    this.format_ = 'jpg';

    /**
     * Map dpi to print
     * @private
     * @type {HTMLElement}
     */
    this.dpi_ = 72;

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
        clientLogo: '',
        creditos: getValue('printInfo'),
      },
      parameters: {},
    };

    /**
     * Mapfish options params
     * @private
     * @type {String}
     */
    this.options_ = {
      legend: 'false',
      forceScale: false,
      dpi: this.dpi_,
      format: this.format_,
      layout: this.layout_,
    };

    this.documentRead_ = document.createElement('img');
    this.canvas_ = document.createElement('canvas');
    this.canceled = false;
    this.time = new Date().getTime();

    this.order = order;
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
    console.warn(getValue('exception.georefimage2_obsolete'));
    this.map_ = map;
    return new Promise((success, fail) => {
      const html = M.template.compileSync(georefimage2HTML, {
        jsonp: true,
        vars: {
          translations: {
            referenced: getValue('referenced'),
            downImg: getValue('downImg'),
            map: getValue('map'),
            pnoa: getValue('pnoa'),
            screen: getValue('screen'),
          },
        },
      });

      this.accessibilityTab(html);

      this.element_ = html;
      const printBtn = this.element_.querySelector('.button > button.print');
      printBtn.addEventListener('click', this.openModalPrint.bind(this));
      success(html);
    });
  }

  openModalPrint() {
    const content = `<div tabindex="0">${getValue('download_modal')}</div>`;
    M.dialog.info(content, getValue('use_license'));
    setTimeout(() => {
      document.querySelector('div.m-dialog.info > div.m-modal > div.m-content').style.maxWidth = '300px';
      document.querySelector('div.m-mapea-container div.m-dialog div.m-title').style.backgroundColor = '#71a7d3';
      const button = document.querySelector('div.m-dialog.info div.m-button > button');
      const newButton = document.createElement('button');
      button.setAttribute('tabindex', '0');
      newButton.setAttribute('tabindex', '0');
      button.innerHTML = getValue('cancel');
      newButton.innerHTML = getValue('accept');
      button.style.width = '85px';
      newButton.style.width = '85px';
      button.style.backgroundColor = '#71a7d3';
      newButton.style.backgroundColor = '#71a7d3';
      newButton.style.marginLeft = '1rem';
      document.querySelector('div.m-dialog.info > div.m-modal > div.m-content div.m-message > div').style.margin = '0.5rem';
      document.querySelector('div.m-dialog.info div.m-button').appendChild(newButton);
      newButton.addEventListener('click', this.printClick_.bind(this));
    }, 10);
  }

  /**
   * This function prints on click
   *
   * @private
   * @function
   */
  printClick_(evt) {
    evt.preventDefault();
    this.canceled = false;
    this.time = new Date().getTime();
    document.querySelector('div.m-mapea-container div.m-dialog div.m-title span').innerHTML = 'Información';
    document.querySelector('div.m-dialog.info > div.m-modal > div.m-content div.m-message').innerHTML = '';
    document.querySelector('div.m-dialog.info div.m-button button:nth-child(2)').remove();
    document.querySelector('div.m-dialog.info div.m-button button').addEventListener('click', (e) => {
      e.preventDefault();
      this.canceled = true;
      document.querySelector('div.m-mapea-container div.m-dialog').remove();
    });

    const content = `<div class="m-georefimage2-loading"><p>${getValue('generating')}...</p><span class="icon-spinner" /></div>`;
    document.querySelector('div.m-dialog.info > div.m-modal > div.m-content div.m-message').innerHTML = content;
    let printOption = 'map';
    if (document.querySelector('#m-georefimage2-image').checked) {
      printOption = 'image';
    } else if (document.querySelector('#m-georefimage2-screen').checked) {
      printOption = 'screen';
    }

    if (printOption === 'screen') {
      this.getPrintData().then((printData) => {
        let printUrl = M.utils.concatUrlPaths([this.printTemplateUrl_, `report.${printData.outputFormat}`]);
        printUrl = M.utils.addParameters(printUrl, 'mapeaop=geoprint');
        M.proxy(false);
        M.remote.post(printUrl, printData).then((responseParam) => {
          let response = responseParam;
          const responseStatusURL = JSON.parse(response.text);
          const ref = responseStatusURL.ref;
          const statusURL = M.utils.concatUrlPaths([this.printStatusUrl_, `${ref}.json`]);
          this.getStatus(statusURL, this.downloadPrint.bind(
            this,
            null,
            printData.attributes.map.bbox,
          ));

          let downloadUrl;
          try {
            response = JSON.parse(response.text);
            if (this.serverUrl_.endsWith('/geoprint')) {
              const url = this.serverUrl_.substring(0, this.serverUrl_.lastIndexOf('/geoprint'));
              downloadUrl = M.utils.concatUrlPaths([url, response.downloadURL]);
            } else {
              downloadUrl = M.utils.concatUrlPaths([this.serverUrl_, response.downloadURL]);
            }
            this.documentRead_.src = downloadUrl;
          } catch (err) {
            M.exception(err);
          }
        });

        M.proxy(true);
      });
    } else {
      const projection = this.getUTMZoneProjection();
      // let bbox = this.map_.getBbox();
      // bbox = [bbox.x.min, bbox.y.min, bbox.x.max, bbox.y.max];
      // bbox = this.getImpl().transformExt(bbox, this.map_.getProjection().code, projection);
      const size = this.map_.getMapImpl().getSize();

      const v = this.map_.getMapImpl().getView();
      let ext = v.calculateExtent(size);
      ext = ol.proj.transformExtent(ext, 'EPSG:3857', projection);
      const f = (ext[2] - ext[0]) / size[0];
      ext[3] = ext[1] + (f * size[1]);
      const bbox = ext;
      let url = 'http://www.ign.es/wms-inspire/mapa-raster?';
      if (printOption === 'image') {
        url = 'http://www.ign.es/wms-inspire/pnoa-ma?';
      }

      url += `SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&SRS=${projection}&CRS=${projection}&WIDTH=${size[0]}&HEIGHT=${size[1]}`;
      url += `&BBOX=${bbox}&FORMAT=image/jpeg&TRANSPARENT=true&STYLES=default`;
      if (printOption === 'image') {
        url += '&LAYERS=OI.OrthoimageCoverage';
      } else {
        url += '&LAYERS=mtn_rasterizado';
      }

      this.downloadPrint(url, bbox);
    }
  }

  /**
   * This function checks when map printing is finished.
   * @param {String} url - Mapfish GET request url
   * @param {Function} callback - function that removes loading icon class.
   */
  getStatus(url, callback) {
    M.proxy(false);
    const newUrl = `${url}?timestamp=${new Date().getTime()}`;
    const time = new Date().getTime();
    if (time - (TIMEOUT * 1000) <= this.time) {
      M.remote.get(newUrl).then((response) => {
        M.proxy(true);
        const statusJson = JSON.parse(response.text);
        const { status } = statusJson;
        if (status === 'finished') {
          callback();
        } else if (status === 'error' || status === 'cancelled') {
          callback();
          if (statusJson.error.toLowerCase().indexOf('network is unreachable') > -1 || statusJson.error.toLowerCase().indexOf('illegalargument') > -1) {
            M.dialog.error(getValue('exception.teselaError'), 'Error');
          } else {
            M.dialog.error(getValue('exception.printError'), 'Error');
          }
        } else {
          setTimeout(() => this.getStatus(url, callback), 1000);
        }
      }).catch((err) => {
        M.proxy(true);
      });
    } else {
      document.querySelector('div.m-mapea-container div.m-dialog').remove();
      M.dialog.error(getValue('exception.imageError'));
    }
  }

  /**
   * This function returns request JSON.
   *
   * @private
   * @function
   */
  getPrintData() {
    const projection = this.map_.getProjection().code;
    const bbox = this.map_.getBbox();
    const width = this.map_.getMapImpl().getSize()[0];
    const height = this.map_.getMapImpl().getSize()[1];
    const parameters = this.params_.parameters;
    const printData = M.utils.extend({
      layout: 'plain',
      outputFormat: this.format_,
      attributes: {
        map: {
          dpi: 120,
          projection,
        },
      },
    }, this.params_.layout);

    return this.encodeLayers().then((encodedLayers) => {
      const returnData = encodedLayers;
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
        encodedLayersModified = encodedLayers;
      }

      printData.attributes.map.layers = encodedLayersModified;
      printData.attributes = Object.assign(printData.attributes, parameters);
      printData.attributes.map.projection = projection;
      printData.attributes.map.dpi = 120;
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
    const projection = 'EPSG:3857';
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
    if (projection === 'EPSG:3857') {
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
            .replace(layers[i].matrixSet, projection);
          const optsMatrixSet = layers[i].options.matrixSet
            .replace(layers[i].matrixSet, projection);
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

  getUTMZoneProjection() {
    let res = this.map_.getProjection().code;
    const mapCenter = [this.map_.getCenter().x, this.map_.getCenter().y];
    const center = this.getImpl().reproject(this.map_.getProjection().code, mapCenter);
    if (center[0] < -12 && center[0] >= -20) {
      res = 'EPSG:25828';
    } else if (center[0] < -6 && center[0] >= -12) {
      res = 'EPSG:25829';
    } else if (center[0] < 0 && center[0] >= -6) {
      res = 'EPSG:25830';
    } else if (center[0] <= 6 && center[0] >= 0) {
      res = 'EPSG:25831';
    }

    return res;
  }

  /**
   * This function downloads printed map.
   *
   * @public
   * @function
   * @api stable
   */
  downloadPrint(url, bbox) {
    let printOption = 'map';
    if (document.querySelector('#m-georefimage2-image').checked) {
      printOption = 'image';
    } else if (document.querySelector('#m-georefimage2-screen').checked) {
      printOption = 'screen';
    }
    const imageUrl = url !== null ? url : this.documentRead_.src;
    const dpi = printOption === 'screen' ? 120 : this.dpi_;
    const base64image = this.getBase64Image(imageUrl);
    if (!this.canceled) {
      base64image.then((resolve) => {
        if (!this.canceled) {
          const size = this.map_.getMapImpl().getSize();
          const Px = (((bbox[2] - bbox[0]) / size[0]) * (72 / dpi)).toString();
          const GiroA = (0).toString();
          const GiroB = (0).toString();
          const Py = (-((bbox[3] - bbox[1]) / size[1]) * (72 / dpi)).toString();
          const Cx = (bbox[0] + (Px / 2)).toString();
          const Cy = (bbox[3] + (Py / 2)).toString();
          const f = new Date();
          const titulo = 'mapa_'.concat(f.getFullYear(), '-', f.getMonth() + 1, '-', f.getDay() + 1, '_', f.getHours(), f.getMinutes(), f.getSeconds());
          const zip = new JsZip();
          zip.file(titulo.concat('.jgw'), Px.concat('\n', GiroA, '\n', GiroB, '\n', Py, '\n', Cx, '\n', Cy));
          zip.file(titulo.concat('.jpg'), resolve, { base64: true });
          zip.generateAsync({ type: 'blob' }).then((content) => {
            saveAs(content, titulo.concat('.zip'));
            document.querySelector('div.m-mapea-container div.m-dialog').remove();
          });
        }
      }).catch((err) => {
        M.dialog.error(getValue('exception.imageError'));
      });
    }
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
        M.dialog.error(getValue('exception.imageError'));
      };
    });
  }

  /**
   * This function checks if an object is equal to this control.
   *
   * @function
   * @api stable
   */
  equals(obj) {
    let equals = false;
    if (obj instanceof Georefimage2Control) {
      equals = (this.name === obj.name);
    }

    return equals;
  }

  accessibilityTab(html) {
    html.querySelectorAll('[tabindex="0"]').forEach((el) => el.setAttribute('tabindex', this.order));
  }
}
