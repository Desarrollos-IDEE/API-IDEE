/**
 * @module IDEE/control/GeorefimageControl
 */
import GeorefimageControlImpl from 'impl/georefimagecontrol';
import { transformExt } from 'impl/utils';
import georefimageHTML from '../../templates/georefimage';
import { getValue } from './i18n/language';
import {
  createWLD, createZipFile,
  generateTitle, getBase64Image, formatImageBase64, createLoadingSpinner,
  SELECTOR_LAYER_CANVAS, getLayerCanvases, getLayerCanvasOpacity,
} from './utils';
import { DPI_OPTIONS, GEOREFIMAGE_FORMATS } from '../../constants';

// ID ELEMENTS
const ID_TITLE = '#m-georefimage-title';
const ID_FORMAT_SELECT = '#m-georefimage-format';
const ID_PROJECTION = '#m-georefimage-projection';
const ID_WLD = '#m-georefimage-wld';
const ID_DPI = '#m-georefimage-dpi';
const ID_GEOREFIMAGE_PRINT_BUTTON = '#m-georefimage-print';

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
  constructor({ defaultDpiOptions }, map) {
    if (IDEE.utils.isUndefined(GeorefimageControlImpl)
      || (IDEE.utils.isObject(GeorefimageControlImpl)
      && IDEE.utils.isNullOrEmpty(Object.keys(GeorefimageControlImpl)))) {
      IDEE.exception('La implementación usada no puede crear controles Georefimage');
    }
    const impl = new GeorefimageControlImpl(map);
    super(GeorefimageControl.NAME, impl);
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
     * Opciones de DPI
     * @private
     * @type {Array<Number>}
     */
    this.dpisOptions_ = defaultDpiOptions || DPI_OPTIONS;

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
     * Elemento SVG de carga
     * @private
     * @type {HTMLElement}
     */
    this.loadingOverlay_ = null;
  }

  /**
   * Activa el control de impresión
   * @param {HTMLElement} html
   *
   * @private
   * @function
   * @api stable
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
            download: getValue('download'),
            image: getValue('image'),
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
   * Selecciona los elementos HTML del control
   * @param {HTMLElement} html
   *
   * @private
   * @function
   * @api stable
   */
  selectElementHTML(html) {
    this.elementTitle_ = html.querySelector(ID_TITLE);
    this.elementWld_ = html.querySelector(ID_WLD);
    this.elementCanvas_ = document.querySelector(SELECTOR_LAYER_CANVAS);
    this.elementProjection_ = html.querySelector(ID_PROJECTION);

    const printButton = html.querySelector(ID_GEOREFIMAGE_PRINT_BUTTON);
    if (printButton) {
      printButton.addEventListener('click', (evt) => {
        this.printClick(evt);
      });
    }
  }

  /**
   * Evento click del botón de descarga
   * @param {Event} evt
   *
   * @public
   * @function
   * @api stable
   */
  printClick(evt) {
    evt.preventDefault();
    this.downloadClient();
  }

  /**
   * Descarga el mapa en formato imagen con georreferenciación
   *
   * @private
   * @function
   * @api stable
   */
  downloadClient() {
    const format = document.querySelector(ID_FORMAT_SELECT).value;
    const dpi = Number(document.querySelector(ID_DPI).value);

    this.loadingOverlay_ = createLoadingSpinner();

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

      getLayerCanvases(map).forEach((layerCanvas) => {
        context.globalAlpha = getLayerCanvasOpacity(layerCanvas);
        const transform = layerCanvas.style.transform;

        if (transform) {
          const matrix = transform
            .match(/^matrix\(([^(]*)\)$/)[1]
            .split(',')
            .map(Number);
          context.setTransform(...matrix);
        }

        context.drawImage(layerCanvas, 0, 0, newWidth, newHeight);
      });

      map.setSize(originalSize);
      map.getView().setResolution(originalResolution);

      const base64image = canvas.toDataURL(`image/${format}`);
      this.downloadPrint(base64image);
    });

    map.setSize([newWidth, newHeight]);
    const scaling = Math.min(newWidth / originalSize[0], newHeight / originalSize[1]);
    map.getView().setResolution(originalResolution / scaling);
  }

  /**
   * Descarga el mapa en formato ZIP con la imagen y el WLD
   *
   * @public
   * @function
   * @api stable
   */
  downloadPrint(imgBase64) {
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

    const extension = '.wld';
    const files = (addWLD) ? [{
      name: titulo.concat(extension),
      data: createWLD(bbox, dpi, this.map_.getMapImpl().getSize(), null),
      base64: false,
    },
    fileIMG,
    ] : [fileIMG];

    createZipFile(files, TYPE_SAVE, titulo);

    if (this.loadingOverlay_) {
      this.loadingOverlay_.remove();
      this.loadingOverlay_ = null;
    }
  }

  /**
   * Desactiva el control
   *
   * @public
   * @function
   * @api
   */
  deactive() {
    this.template_.remove();

    // TO-DO [ ] ADD REMOVE BUTTON AND ALL OTHER EVENTS
    // TO-DO [ ] Deactivate download when changed the control
  }

  /**
   * Destruye este control
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
