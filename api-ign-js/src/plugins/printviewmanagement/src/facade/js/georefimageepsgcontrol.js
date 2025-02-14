/**
 * @module M/control/GeorefImageEpsgControl
 */
import Georefimage2ControlImpl from '../../impl/ol/js/georefimageepsgcontrol';
import { adjustExtentForSquarePixels, reproject } from '../../impl/ol/js/utils';
import georefimage2HTML from '../../templates/georefimageepsg';
import { getValue } from './i18n/language';
import {
  getQueueContainer, innerQueueElement, removeLoadQueueElement, createWLD, createZipFile,
  generateTitle, getBase64Image,
} from './utils';

// DEFAULTS PARAMS
const FILE_EXTENSION_GEO = '.wld'; // .jgw
const FILE_EXTENSION_IMG = '.jpg';
const TYPE_SAVE = '.zip';

export default class GeorefImageEpsgControl extends M.Control {
  /**
    * @classdesc
    * Main constructor of the class.
    *
    * @constructor
    * @extends {M.Control}
    * @api stable
    */
  constructor({ order, layers }, map) {
    const impl = new Georefimage2ControlImpl(map);
    super(impl, 'georefimage2control');
    this.map_ = map;
    if (M.utils.isUndefined(Georefimage2ControlImpl)) {
      M.exception(getValue('exception.impl'));
    }

    this.layers_ = layers || [
      {
        url: 'http://www.ign.es/wms-inspire/mapa-raster?',
        name: 'mtn_rasterizado',
        format: 'image/jpeg',
        legend: 'Mapa ETRS89 UTM',
      },
      {
        url: 'http://www.ign.es/wms-inspire/pnoa-ma?',
        name: 'OI.OrthoimageCoverage',
        format: 'image/jpeg',
        legend: 'Imagen (PNOA) ETRS89 UTM',
      },
    ];

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

    this.documentRead_ = document.createElement('img');
    this.canvas_ = document.createElement('canvas');
    this.canceled = false;

    this.order = order >= -1 ? order : null;
  }

  active(html) {
    this.html_ = html;
    const button = this.html_.querySelector('#m-printviewmanagement-georefImageEpsg');

    const template = new Promise((resolve, reject) => {
      this.template_ = M.template.compileSync(georefimage2HTML, {
        jsonp: true,
        vars: {
          translations: {
            selectLayer: getValue('selectLayer'),
            nameTitle: getValue('title_list'),
          },
          layers: this.layers_,
        },
      });
      resolve(this.template_);
    });

    template.then((t) => {
      if (!button.classList.contains('activated')) {
        this.html_.querySelector('#m-printviewmanagement-controls').appendChild(t);
      } else {
        document.querySelector('.m-georefimageepsg-container').remove();
      }
      button.classList.toggle('activated');
    });

    this.accessibilityTab(html);
  }

  /**
    * This function prints on click
    *
    * @private
    * @function
    */
  printClick(evt) { // Se llama desde printviewmanagementcontrol
    evt.preventDefault();

    // La del mapa, hacer un getProjection si se cambia
    const DEFAULT_EPSG = this.map_.getProjection().code;
    const ID_IMG_EPSG = '#m-georefimageepsg-select';

    // get value select option id m-georefimageepsg-select
    const value = this.template_.querySelector(ID_IMG_EPSG).selectedIndex;

    const {
      url, name, format, EPSG: epsg, version, legend,
    } = this.layers_[value];

    let title = legend || name;
    const dateNow = new Date();
    const date = dateNow.toLocaleDateString().replaceAll('/', '');
    const hour = dateNow.toLocaleTimeString().replaceAll(':', '');

    title = `${title}_${date}_${hour}`;

    this.queueEl = innerQueueElement(
      this.html_,
      false,
      title,
    );

    this.canceled = false;

    // Bbox Mapa
    const mapBbox = this.map_.getBbox();
    // Size
    const size = this.map_.getMapImpl().getSize();

    // Ext WLD
    let extWLD = [];

    if (epsg) {
      const projection = epsg;
      let ext = false;
      if (DEFAULT_EPSG === projection) {
        ext = M.utils.ObjectToArrayExtent(mapBbox, DEFAULT_EPSG);
        extWLD = ext;
      } else if (version === '1.1.1' || version === '1.1.0') {
        const transformBbox = [mapBbox.x.min, mapBbox.y.min, mapBbox.x.max, mapBbox.y.max];
        ext = ol.proj.transformExtent(transformBbox, DEFAULT_EPSG, projection);

        extWLD = adjustExtentForSquarePixels(ext, size);
      } else {
        const transformBbox = M.utils.ObjectToArrayExtent(mapBbox, DEFAULT_EPSG);
        ext = ol.proj.transformExtent(transformBbox, DEFAULT_EPSG, projection);
        extWLD = adjustExtentForSquarePixels(ext, size);
        ext = this.transformExtentOL(ext, projection);
      }

      const extString = ext.join(',');

      const urlLayer = this.generateURLLayer_(
        url,
        projection,
        size,
        extString,
        format,
        name,
        version,
      );
      this.downloadPrint(urlLayer, extWLD, true, title);
    } else {
      const projection = this.getUTMZoneProjection();

      const v = this.map_.getMapImpl().getView();
      let ext = v.calculateExtent(size);

      ext = ol.proj.transformExtent(ext, DEFAULT_EPSG, projection);
      ext = adjustExtentForSquarePixels(ext, size);

      const urlLayer = this.generateURLLayer_(url, projection, size, ext, format, name, version);
      this.downloadPrint(urlLayer, ext, false, title);
    }
  }

  transformExtentOL(extent, projection) {
    const { def } = M.impl.ol.js.projections.getSupportedProjs()
      .find((proj) => proj.codes.includes(projection));
    const typeCoordinates = def.includes('+proj=longlat');

    if (typeCoordinates) {
      return [extent[1], extent[0], extent[3], extent[2]];
    }

    return extent;
  }

  generateURLLayer_(url, projection, size, bbox, format, name, version = '1.3.0') {
    let urlLayer = url;
    const coord = (version === '1.1.1' || version === '1.1.0') ? 'SRS' : 'CRS';
    urlLayer += `SERVICE=WMS&VERSION=${version}&REQUEST=GetMap&${coord}=${projection}&WIDTH=${size[0]}&HEIGHT=${size[1]}`;
    urlLayer += `&BBOX=${bbox}&FORMAT=${format}&TRANSPARENT=true&STYLES=default`;
    urlLayer += `&LAYERS=${name}`;
    return urlLayer;
  }

  getUTMZoneProjection() {
    let res = this.map_.getProjection().code;
    const mapCenter = [this.map_.getCenter().x, this.map_.getCenter().y];
    const center = reproject(this.map_.getProjection().code, mapCenter);
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
  downloadPrint(url, bbox, epsgUser, title = '') {
    const imageUrl = url !== null ? url : this.documentRead_.src;
    const dpi = this.dpi_;

    const base64image = getBase64Image(imageUrl);
    if (!this.canceled) {
      base64image.then((resolve) => {
        if (!this.canceled) {
          // GET TITLE
          const titulo = generateTitle(title);

          // CONTENT ZIP
          const files = [{
            name: titulo.concat(FILE_EXTENSION_GEO),
            // EPSG:3857 -> bbox
            data: createWLD(bbox, dpi, this.map_.getMapImpl().getSize(), epsgUser, this.map_, 'server'),
            base64: false,
          },
          {
            name: titulo.concat(FILE_EXTENSION_IMG),
            data: resolve,
            base64: true,
          },
          ];

          // CREATE ZIP
          const zipEvent = (evt) => {
            if (evt.key === undefined || evt.key === 'Enter' || evt.key === ' ') {
              createZipFile(files, TYPE_SAVE, titulo);
            }
          };

          // Enter event create zip
          this.queueEl.addEventListener('click', zipEvent);
          this.queueEl.addEventListener('keydown', zipEvent);

          // REMOVE QUEUE ELEMENT
          removeLoadQueueElement(this.queueEl);
        }
      }).catch((err) => {
        getQueueContainer(this.html_).lastChild.remove();
        M.dialog.error(getValue('exception.imageError'));
      });
    } else {
      getQueueContainer(this.html_).lastChild.remove();
    }
  }

  /**
    * This function checks if an object is equal to this control.
    *
    * @function
    * @api stable
    */
  equals(obj) {
    let equals = false;
    if (obj instanceof GeorefImageEpsgControl) {
      equals = (this.name === obj.name);
    }

    return equals;
  }

  accessibilityTab(html) {
    html.querySelectorAll('[tabindex="0"]').forEach((el) => el.setAttribute('tabindex', this.order));
  }

  deactive() {
    this.template_.remove();
    // TO-DO ADD BUTTON REMOVE AND ALL EVENTS
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
