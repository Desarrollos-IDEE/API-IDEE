/**
 * @module IDEE/control/GeorefimageControl
 */
import GeorefimageControlImpl from 'impl/georefimagecontrol';
import { reproject, transformExt } from 'impl/utils';
import georefimageHTML from '../../templates/georefimage';
import { getValue } from './i18n/language';
import {
  innerQueueElement, removeLoadQueueElement, createWLD, createZipFile,
  generateTitle, getBase64Image, formatImageBase64,
} from './utils';
import { DPI_OPTIONS, GEOREFIMAGE_FORMATS } from '../../constants';
// ID ELEMENTS
const ID_TITLE = '#m-georefimage-title';
const ID_FORMAT_SELECT = '#m-georefimage-format';
const ID_PROJECTION = '#m-georefimage-projection';
const ID_WLD = '#m-georefimage-wld';
const ID_DPI = '#m-georefimage-dpi';

// SELECTOR CANVAS
const SELECTOR_CANVAS = '.ol-layer canvas';

// DEFAULTS PARAMS
const TYPE_SAVE = '.zip';

export default class GeorefimageControl extends IDEE.Control {
  /**
   * @classdesc
   * Constructor de la clase del segundo control de impresión
   *
   * @constructor
   * @extends {IDEE.Control}
   * @api stable
   */
  constructor(map, statusProxy, useProxy) {
    if (IDEE.utils.isUndefined(GeorefimageControlImpl)
      || (IDEE.utils.isObject(GeorefimageControlImpl)
      && IDEE.utils.isNullOrEmpty(Object.keys(GeorefimageControlImpl)))) {
      IDEE.exception('La implementación usada no puede crear controles Georefimage');
    }
    const impl = new GeorefimageControlImpl(map);
    super(impl, GeorefimageControl.NAME);
    this.map_ = map;

    if (IDEE.utils.isUndefined(GeorefimageControlImpl.prototype.encodeLayer)) {
      IDEE.exception('La implementación usada no posee el método encodeLayer');
    }

    /**
     * Titulo del mapa
     * @private
     * @type {HTMLElement}
     */
    this.elementTitle_ = null;

    /**
     * Descripción del mapa
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
     * Formato de impresión
     * @private
     * @type {HTMLElement}
     */
    this.format_ = null;

    /**
     * Poryección del mapa
     * @private
     * @type {HTMLElement}
     */
    this.projection_ = null;

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
      dpi: 150,
      forceScale: false,
      format: 'jpg',
      legend: 'false',
      layout: 'A4 horizontal jpg',
    };

    /**
     * Opciones de DPI
     * @private
     * @type {Array<Number>}
     */
    this.dpisOptions_ = DPI_OPTIONS;

    /**
     * Formatos de salida de la imagen
     * @private
     * @type {Array<String>}
     */
    this.outputFormats_ = GEOREFIMAGE_FORMATS;

    /**
     * Imagen que se va a imprimir
     * @private
     * @type {HTMLElement}
     */
    this.documentRead_ = document.createElement('img');

    /**
     *  Estado del proxy
     * @private
     * @type {String}
     */
    this.statusProxy = statusProxy;

    /**
     * Estado del uso del proxy
     * @private
     * @type {Boolean}
     */
    this.useProxy = useProxy;
  }

  /**
   * This function checks when map printing is finished.
   * @param {String} url - Mapfish GET request url
   * @param {Function} callback - function that removes loading icon class.
   */
  getStatus(url, callback, queueEl) {
    // IDEE.proxy(this.useProxy);
    const newUrl = `${url}?timestamp=${new Date().getTime()}`;
    IDEE.remote.get(newUrl).then((response) => {
      if (response.code === 404) {
        throw new Error('Error 404');
      }

      const statusJson = response.text ? JSON.parse(response.text) : 'error';
      const { status } = statusJson;
      if (status === 'finished') {
        callback(queueEl);
      } else if (status === 'error' || status === 'cancelled') {
        callback(queueEl);
        if (statusJson.error.toLowerCase().indexOf('network is unreachable') > -1 || statusJson.error.toLowerCase().indexOf('illegalargument') > -1) {
          IDEE.toast.error(getValue('exception.teselaError'), 6000);
        } else {
          IDEE.toast.error(getValue('exception.printError'), 6000);
        }
      } else {
        setTimeout(() => this.getStatus(url, callback, queueEl), 1000);
      }
    }).catch((err) => {
      callback(queueEl);
      queueEl.remove();
      IDEE.dialog.error(getValue('exception.error_download_image'));
    });
    // IDEE.proxy(this.statusProxy);
  }

  /**
   * Activa el control de impresión
   * @param {*} html
   */
  active(html) {
    this.html_ = html;
    const button = this.html_.querySelector('#m-printviewmanagement-georefImage');
    const promise = new Promise((success, fail) => {
      const template = IDEE.template.compileSync(georefimageHTML, {
        jsonp: true,
        vars: {
          dpis: this.dpisOptions_,
          formats: this.outputFormats_,
          translations: {
            referenced: getValue('referenced'),
            projection: getValue('projection'),
            down: getValue('down'),
            title: getValue('title'),
            georefimageWld: getValue('georefimageWld'),
            selectDpi: getValue('selectDPI'),
            format: getValue('format'),
            nameTitle: getValue('title_view'),
          },
        },
      });
      this.template_ = template;
      success(template);
    });
    promise.then((t) => {
      const proj = IDEE.impl.ol.js.projections.getSupportedProjs().find(({ codes }) => {
        return codes.includes(this.map_.getProjection().code);
      });

      const projFormat = `${proj.datum} - ${proj.proj.toUpperCase()} (${proj.codes[0]})`;

      this.projection_ = this.map_.getProjection().code;
      this.projectionFormat_ = projFormat;
      this.selectElementHTML(t);
      this.elementProjection_.innerHTML = this.projectionFormat_;

      if (!button.classList.contains('activated')) {
        this.html_.querySelector('#m-printviewmanagement-controls').appendChild(t);
      } else {
        document.querySelector('.m-georefimage-container').remove();
      }
      button.classList.toggle('activated');
    });
  }

  /**
   * Inicializa los elementos del control de impresión
   * @param {*} html
   */
  selectElementHTML(html) {
    this.elementTitle_ = html.querySelector(ID_TITLE);
    this.elementWld_ = html.querySelector(ID_WLD);
    this.elementCanvas_ = document.querySelector(SELECTOR_CANVAS);
    this.elementProjection_ = html.querySelector(ID_PROJECTION);
  }

  /**
   * Ejectua la acción de impresión al hacer click en el botón
   *
   * @private
   * @function
   */
  printClick(evt) {
    evt.preventDefault();
    this.downloadClient();
  }

  /**
   * Descarga el mapa usando el DPI seleccionado y el formato elegido.
   */
  downloadClient() {
    const title = document.querySelector(ID_TITLE);
    const format = document.querySelector(ID_FORMAT_SELECT).value;
    const dpi = Number(document.querySelector(ID_DPI).value);

    const queueEl = innerQueueElement(
      this.html_,
      title,
      this.elementQueueContainer_,
    );

    const map = this.map_.getMapImpl();
    const originalSize = map.getSize();
    const originalResolution = map.getView().getResolution();

    const scaleFactor = dpi / 72;
    const newWidth = Math.round(originalSize[0] * scaleFactor);
    const newHeight = Math.round(originalSize[1] * scaleFactor);

    map.once('rendercomplete', () => {
      const canvas = document.createElement('canvas');
      canvas.width = newWidth;
      canvas.height = newHeight;
      const context = canvas.getContext('2d');

      Array.prototype.forEach.call(
        document.querySelectorAll('.ol-layer canvas'),
        (layerCanvas) => {
          if (layerCanvas.width > 0) {
            const opacity = layerCanvas.parentNode.style.opacity || '1';
            context.globalAlpha = Number(opacity);
            const transform = layerCanvas.style.transform;

            if (transform) {
              const matrix = transform
                .match(/^matrix\(([^(]*)\)$/)[1]
                .split(',')
                .map(Number);
              context.setTransform(...matrix);
            }

            context.drawImage(layerCanvas, 0, 0, newWidth, newHeight);
          }
        },
      );

      map.setSize(originalSize);
      map.getView().setResolution(originalResolution);

      const base64image = canvas.toDataURL(`image/${format}`);
      this.downloadPrint(queueEl, base64image);
      removeLoadQueueElement(queueEl);
    });

    map.setSize([newWidth, newHeight]);
    const scaling = Math.min(newWidth / originalSize[0], newHeight / originalSize[1]);
    map.getView().setResolution(originalResolution / scaling);
  }

  /**
   * Obtiene el contenido de una URL como un DOM
   * @param {*} url - URL de la que se quiere obtener el contenido
   * @returns
   */
  getSourceAsDOM(url) {
    const xmlhttp = new XMLHttpRequest();
    xmlhttp.open('GET', url, true);
    xmlhttp.send();
    const parser = new DOMParser();
    const parser2 = parser.parseFromString(xmlhttp.responseText, 'text/html');
    return parser2;
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
      const newMin = reproject(proj.code, min);
      const newMax = reproject(proj.code, max);
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
   * Descarga el mapa en formato ZIP con la imagen y el WLD
   *
   * @public
   * @function
   * @api stable
   */
  downloadPrint(queueEl, imgBase64) {
    const formatImage = document.querySelector(ID_FORMAT_SELECT).value;
    const title = document.querySelector(ID_TITLE).value;
    const dpi = document.querySelector(ID_DPI).value;
    const code = this.map_.getProjection().code;
    const addWLD = this.elementWld_.checked;
    const base64image = (imgBase64) ? formatImageBase64(imgBase64) : getBase64Image(
      this.documentRead_.src,
      formatImage,
    );

    let bbox = [
      this.map_.getBbox().x.min,
      this.map_.getBbox().y.min,
      this.map_.getBbox().x.max,
      this.map_.getBbox().y.max,
    ];
    bbox = transformExt(bbox, code, this.projection_);

    const titulo = generateTitle(title);
    const fileIMG = {
      name: titulo.concat(`.${formatImage === 'jpeg' ? 'jpg' : formatImage}`),
      data: base64image,
      base64: true,
    };

    const extension = formatImage === 'jpeg' ? '.jgw' : '.pgw';
    const files = (addWLD) ? [{
      name: titulo.concat(extension),
      data: createWLD(bbox, dpi, this.map_.getMapImpl().getSize(), null),
      base64: false,
    },
    fileIMG,
    ] : [fileIMG];

    const zipEvent = (evt) => {
      if (evt.key === undefined || evt.key === 'Enter' || evt.key === ' ') {
        createZipFile(files, TYPE_SAVE, titulo);
      }
    };

    queueEl.addEventListener('click', zipEvent);
    queueEl.addEventListener('keydown', zipEvent);
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
        projectionLegend = 'ETRS89 (4258)';
        break;
      case 'EPSG:4326':
        projectionLegend = 'WGS84 (4326)';
        break;
      case 'EPSG:3857':
        projectionLegend = 'WGS84 (3857)';
        break;
      case 'EPSG:25831':
        projectionLegend = 'UTM zone 31N (25831)';
        break;
      case 'EPSG:25830':
        projectionLegend = 'UTM zone 30N (25830)';
        break;
      case 'EPSG:25829':
        projectionLegend = 'UTM zone 29N (25829)';
        break;
      case 'EPSG:25828':
        projectionLegend = 'UTM zone 28N (25828)';
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
    if (obj instanceof GeorefimageControl) {
      equals = (this.name === obj.name);
    }

    return equals;
  }

  deactive() {
    this.template_.remove();

    // TO-DO [ ] ADD REMOVE BUTTON AND ALL OTHER EVENTS
    // TO-DO [ ] Deactivate download when changed the control
  }

  /**
   * This function destroys this control
   *
   * @public
   * @function
   * @api
   */
  destroy() {}
}

/**
 * Name for this controls
 * @const
 * @type {string}
 * @public
 * @api stable
 */
GeorefimageControl.NAME = 'georefimagecontrol';

/**
 * IDEE.template for this controls
 * @const
 * @type {string}
 * @public
 * @api stable
 */
GeorefimageControl.TEMPLATE = 'georefimage.html';

/**
 * IDEE.template for this controls
 * @const
 * @type {string}
 * @public
 * @api stable
 */
GeorefimageControl.LOADING_CLASS = 'printing';

/**
 * IDEE.template for this controls
 * @const
 * @type {string}
 * @public
 * @api stable
 */
GeorefimageControl.DOWNLOAD_ATTR_NAME = 'data-donwload-url-print';

/**
 * IDEE.template for this controls
 * @const
 * @type {string}
 * @public
 * @api stable
 */
GeorefimageControl.NO_TITLE = '(Sin titulo)';
