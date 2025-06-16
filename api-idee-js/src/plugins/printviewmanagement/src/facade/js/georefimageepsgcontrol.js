/**
 * @module IDEE/control/GeorefImageEpsgControl
 */
import Georefimage2ControlImpl from 'impl/georefimageepsgcontrol';
import { adjustExtentForSquarePixels, reproject } from 'impl/utils';
import georefimage2HTML from '../../templates/georefimageepsg';
import { getValue } from './i18n/language';
import {
  innerQueueElement, removeLoadQueueElement, createWLD, createZipFile,
  generateTitle,
} from './utils';
import { DPI_OPTIONS, GEOREFIMAGEEPSG_FORMAT } from '../../constants';

// DEFAULTS PARAMS
const FILE_EXTENSION_GEO = '.wld'; // .jgw
const FILE_EXTENSION_IMG = '.'.concat(GEOREFIMAGEEPSG_FORMAT);
const TYPE_SAVE = '.zip';

export default class GeorefImageEpsgControl extends IDEE.Control {
  /**
    * @classdesc
    * Constructor de la clase de tercer control de impresión
    *
    * @constructor
    * @extends {IDEE.Control}
    * @api stable
    */
  constructor({ order, layers }, map) {
    if (IDEE.utils.isUndefined(Georefimage2ControlImpl)
      || (IDEE.utils.isObject(Georefimage2ControlImpl)
      && IDEE.utils.isNullOrEmpty(Object.keys(Georefimage2ControlImpl)))) {
      IDEE.exception(getValue('exception.impl'));
    }
    const impl = new Georefimage2ControlImpl(map);
    super(impl, 'georefimage2control');

    /**
     * Instancia del mapa
     * @private
     * @type {IDEE.Map}
     */
    this.map_ = map;

    /**
     * Capas a elegir para imprimir
     * @private
     * @type {Array.<Object>}
     */
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
      * Formato de la imagen a descargar
      * @private
      * @type {HTMLElement}
      */
    this.format_ = GEOREFIMAGEEPSG_FORMAT;

    /**
      * Opciones de DPI a elegir
      * @private
      * @type {HTMLElement}
      */
    this.dpisOptions_ = DPI_OPTIONS;

    /**
     * Imagen por defecto a descargar si no hay ninguna capa seleccionada
     * @private
     * @type {HTMLElement}
     */
    this.documentRead_ = document.createElement('img');

    /**
     * Orden para mostrar los elementos
     * @private
     * @type {number}
     */
    this.order = order >= -1 ? order : null;
  }

  /**
   * Función que activa el control
   * @param {*} html
   */
  active(html) {
    this.html_ = html;
    const button = this.html_.querySelector('#m-printviewmanagement-georefImageEpsg');

    const template = new Promise((resolve, reject) => {
      this.template_ = IDEE.template.compileSync(georefimage2HTML, {
        jsonp: true,
        vars: {
          dpis: this.dpisOptions_,
          translations: {
            selectLayer: getValue('selectLayer'),
            selectDpi: getValue('selectDPI'),
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
    * Imprimer la imagen georreferenciada con EPSG seleccionado.
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
      title,
      this.elementQueueContainer_,
    );

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
        ext = IDEE.utils.ObjectToArrayExtent(mapBbox, DEFAULT_EPSG);
        extWLD = ext;
      } else if (version === '1.1.1' || version === '1.1.0') {
        const transformBbox = [mapBbox.x.min, mapBbox.y.min, mapBbox.x.max, mapBbox.y.max];
        ext = ol.proj.transformExtent(transformBbox, DEFAULT_EPSG, projection);

        extWLD = adjustExtentForSquarePixels(ext, size);
      } else {
        const transformBbox = IDEE.utils.ObjectToArrayExtent(mapBbox, DEFAULT_EPSG);
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

  /**
   * Transforma la extensión de coordenadas de OpenLayers
   * @param {*} extent Extensión de coordenadas a transformar
   * @param {*} projection Proyección a la que se quiere transformar
   * @returns Extensión transformada
   */
  transformExtentOL(extent, projection) {
    const { def } = IDEE.impl.ol.js.projections.getSupportedProjs()
      .find((proj) => proj.codes.includes(projection));
    const typeCoordinates = def.includes('+proj=longlat');

    if (typeCoordinates) {
      return [extent[1], extent[0], extent[3], extent[2]];
    }

    return extent;
  }

  /**
   * Genera la URL de la capa WMS para descargar la imagen georreferenciada.
   * @param {*} url URL del servicio WMS
   * @param {*} projection Proyección a utilizar
   * @param {*} size Alto y ancho de la imagen
   * @param {*} bbox Extensión de la imagen en coordenadas
   * @param {*} format Formato de la imagen
   * @param {*} name Nombre de la capa
   * @param {*} version versión del servicio WMS
   * @returns
   */
  generateURLLayer_(url, projection, size, bbox, format, name, version = '1.3.0') {
    let urlLayer = url;
    const coord = (version === '1.1.1' || version === '1.1.0') ? 'SRS' : 'CRS';
    urlLayer += `SERVICE=WMS&VERSION=${version}&REQUEST=GetMap&${coord}=${projection}&WIDTH=${size[0]}&HEIGHT=${size[1]}`;
    urlLayer += `&BBOX=${bbox}&FORMAT=${format}&TRANSPARENT=true&STYLES=default`;
    urlLayer += `&LAYERS=${name}`;
    return urlLayer;
  }

  /**
   * Determina la proyección UTM en función de la ubicación del centro del mapa.
   * @returns {string} Código de la proyección UTM correspondiente.
   */
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
    * Descarga la imagen georreferenciada con DPI seleccionado.
    *
    * @param {string} url URL de la imagen a descargar.
    * @param {Array} bbox Extensión de la imagen en coordenadas.
    * @param {boolean} epsgUser Indica si se utiliza EPSG del usuario.
    * @param {string} title Título de la imagen a descargar.
    * @public
    * @function
    * @api stable
    */
  downloadPrint(url, bbox, epsgUser, title = '') {
    const imageUrl = url !== null ? url : this.documentRead_.src;
    const dpi = Number(this.template_.querySelector('#m-georefimageepsg-dpi').value);
    const format = this.format_;
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
      map.setSize(originalSize);
      map.getView().setResolution(originalResolution);

      let zipEvent;
      const layerImage = new Image();
      layerImage.crossOrigin = 'anonymous';
      layerImage.onload = () => {
        context.setTransform(1, 0, 0, 1, 0, 0);
        context.globalAlpha = 1;
        context.drawImage(layerImage, 0, 0, newWidth, newHeight);

        canvas.toBlob((blob) => {
          const titulo = generateTitle(title);
          const reader = new window.FileReader();

          reader.onloadend = () => {
            const files = [{
              name: titulo.concat(FILE_EXTENSION_GEO),
              data: createWLD(bbox, dpi, [newWidth, newHeight], epsgUser),
              base64: false,
            }, {
              name: titulo.concat(FILE_EXTENSION_IMG),
              data: reader.result,
              base64: false,
              binary: true,
            }];

            zipEvent = (evt) => {
              if (!evt.key || evt.key === 'Enter' || evt.key === ' ') {
                createZipFile(files, TYPE_SAVE, titulo);
              }
            };
            this.queueEl.addEventListener('click', zipEvent);
            this.queueEl.addEventListener('keydown', zipEvent);
          };
          reader.readAsArrayBuffer(blob);
        }, `image/${format}`);
      };
      layerImage.src = imageUrl;
      removeLoadQueueElement(this.queueEl);
    });
    map.setSize([newWidth, newHeight]);
    const scaling = Math.min(newWidth / originalSize[0], newHeight / originalSize[1]);
    map.getView().setResolution(originalResolution / scaling);
  }

  /**
    * Comprueba si el objeto es igual a este control.
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

  /**
   * Inicializa la accesibilidad del control.
   * @param {*} html
   */
  accessibilityTab(html) {
    html.querySelectorAll('[tabindex="0"]').forEach((el) => el.setAttribute('tabindex', this.order));
  }

  /**
   * Desactiva el control y elimina su plantilla.
   */
  deactive() {
    this.template_.remove();
    // TO-DO ADD BUTTON REMOVE AND ALL EVENTS
  }

  /**
   * Destruye el control
   *
   * @public
   * @function
   * @api
   */
  destroy() {}
}
