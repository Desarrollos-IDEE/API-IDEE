/**
 * @module M/control/SelectionZoomControl
 */

// import template from 'templates/selectionzoom';
import template from '../../templates/selectionzoom';
import SelectionZoomImpl from '../../impl/ol/js/selectionzoomcontrol';
import { getValue } from './i18n/language';

// /**
//  * This parameter indicates the maximum base layers of plugin
//  *
//  * @type {number}
//  * @const
//  * @private
//  */
// const MAXIMUM_LAYERS = 5;

/**
 * This parameter indicates the maximum base layers of plugin
 *
 * @type {array}
 * @private
 */
let bboxbase = null;

/**
 * This parameter indicates the maximum base layers of plugin
 *
 * @type {number}
 * @private
 */
let zoombase = null;

/**
 * @classdesc
 * Background layers selector Mapea control.
 * This control puts a set of layers in the background of the map.
 */
export default class SelectionZoomControl extends M.Control {
  /**
   * @constructor
   * @extends {M.Control}
   * @api stable
   */
  constructor(
    map,
    ids,
    titles,
    previews,
    bboxs,
    zooms,
    centers,
    order,
    newparam,
  ) {
    const impl = new SelectionZoomImpl();
    super(impl, 'SelectionZoom');

    if (!newparam) {
      // eslint-disable-next-line no-console
      console.warn(getValue('exception.parameterizationDeprecated'));
    }

    // map.getBaseLayers().forEach((layer) => {
    //   layer.on(M.evt.LOAD, map.removeLayers(layer));
    // });
    this.layers = [];

    // Array<Object> => Object: { id, title, preview, Array<MapeaLayer>}
    // this.layers = layerOpts.slice(0, MAXIMUM_LAYERS);
    // const bboxArray = bbox];
    const idsArray = ids.split(',');
    const titlesArray = titles.split(',');
    const previewsArray = previews.split(',');
    const bboxArray = [];
    if (M.utils.isArray(bboxs)) {
      bboxs.forEach((item, index) => {
        bboxArray[index] = item.split(/[ ,]+/);
      });
    } else {
      let i = 0;
      bboxs.split(',').forEach((item, index) => {
        if (index % 4 === 0 && index > 0) {
          i += 1;
          bboxArray[i] = [];
        }

        if (index % 4 === 0 && index === 0) {
          bboxArray[i] = [];
        }

        bboxArray[i].push(item.trim());
      });
    }
    const zoomsArray = zooms.split(',');
    const centersArray = [];
    if (M.utils.isArray(centers)) {
      centers.forEach((item, index) => {
        centersArray[index] = item.split(/[ ,]+/);
      });
    }

    idsArray.forEach((baseLayer, idx) => {
      const mapeaLyrsObject = {
        id: idsArray[idx],
        title: titlesArray[idx],
        preview: previewsArray[idx],
        bbox: bboxArray[idx],
        zoom: zoomsArray[idx],
        center: centersArray[idx],
        isnewparam: newparam,
      };

      this.layers.push(mapeaLyrsObject);
    });

    this.flattedLayers = this.layers.reduce((current, next) => current.concat(next.layers), []);
    this.activeLayer = -1;
    this.order = order;
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
    this.map = map;
    return new Promise((success, fail) => {
      const html = M.template.compileSync(template, {
        vars: {
          layers: this.layers,
          translations: {
            headertitle: getValue('tooltip'),
          },
        },
      });

      this.html = html;
      this.accessibilityTab(html);
      this.listen(html);
      success(html);
    });
  }

  /**
   * This function adds layer bound to the button clicked
   * @public
   * @param {DOMEvent} e - click html event
   * @param {object} layersInfo - Layers options
   * @api
   */
  showBaseLayer(e, layersInfo, i) {
    const callback = this.handlerClickDesktop.bind(this);
    // if (window.innerWidth <= M.config.MOBILE_WIDTH) {
    //   callback = this.handlerClickMobile.bind(this);
    // }
    callback(e, layersInfo, i);
  }

  /**
   * This function manages the click event when the app is in desktop resolution
   *
   * @function
   * @public
   * @api
   * @param {Event} e
   * @param {} layersInfo
   * @param {} i
   */
  handlerClickDesktop(e, layersInfo, i) {
    const isActivated = e.currentTarget.parentElement
      .querySelector(`#m-selectionzoom-lyr-${layersInfo.id}`)
      .classList.contains('activeSelectionZoomDiv');

    e.currentTarget.parentElement.querySelectorAll('div[id^="m-selectionzoom-lyr-"]').forEach((imgContainer) => {
      if (imgContainer.classList.contains('activeSelectionZoomDiv')) {
        imgContainer.classList.remove('activeSelectionZoomDiv');
      }
    });

    const currentBbox = this.map.getBbox();

    if (bboxbase === null) {
      bboxbase = [currentBbox.x.min, currentBbox.x.max, currentBbox.y.min, currentBbox.y.max];
      zoombase = this.map.getZoom();
    }

    const nuevoBbox = {};
    nuevoBbox.x = {};
    nuevoBbox.y = {};

    if (!isActivated) {
      this.activeLayer = i;
      if (currentBbox) {
        e.currentTarget.parentElement
          .querySelector(`#m-selectionzoom-lyr-${layersInfo.id}`).classList.add('activeSelectionZoomDiv');
      }

      if (!M.utils.isNullOrEmpty(layersInfo.bbox)) {
        let BboxTransformXminYmax = [layersInfo.bbox[0], layersInfo.bbox[3]];
        let BboxTransformXmaxYmin = [];

        if (layersInfo.isnewparam) {
          BboxTransformXmaxYmin = [layersInfo.bbox[2], layersInfo.bbox[1]];
        } else {
          BboxTransformXmaxYmin = [layersInfo.bbox[1], layersInfo.bbox[2]];
        }
        BboxTransformXmaxYmin = this.getImpl().transform(
          BboxTransformXmaxYmin,
          'EPSG:3857',
          this.map_.getProjection().code,
        );
        BboxTransformXminYmax = this.getImpl().transform(
          BboxTransformXminYmax,
          'EPSG:3857',
          this.map_.getProjection().code,
        );

        nuevoBbox.x.min = BboxTransformXminYmax[0];
        nuevoBbox.x.max = BboxTransformXmaxYmin[0];

        nuevoBbox.y.min = BboxTransformXmaxYmin[1];
        nuevoBbox.y.max = BboxTransformXminYmax[1];

        this.map.setBbox(nuevoBbox);
        if (!layersInfo.isnewparam) {
          this.map.setZoom(layersInfo.zoom);
        }
      } else if (layersInfo.isnewparam && !M.utils.isNullOrEmpty(layersInfo.zoom)
        && !M.utils.isNullOrEmpty(layersInfo.center)) {
        this.map.setZoom(layersInfo.zoom);
        this.map.setCenter(layersInfo.center);
      } else if (layersInfo.isnewparam) {
        M.dialog.error(getValue('exception.formatMRE'));
      } else {
        M.dialog.error(getValue('exception.formatBBoxAndZoom'));
      }
    } else {
      nuevoBbox.x.min = bboxbase[0];
      nuevoBbox.x.max = bboxbase[1];

      nuevoBbox.y.min = bboxbase[2];
      nuevoBbox.y.max = bboxbase[3];

      this.map.setBbox(nuevoBbox);
      this.map.setZoom(zoombase);
    }

    this.fire('selectionzoom:activeChanges', [{ activeLayerId: this.activeLayer }]);
    document.querySelector('.m-panel.m-plugin-selectionzoom.opened > button.m-panel-btn').click();
  }

  /**
   * This function removes this.layers from Map.
   * @function
   * @public
   * @api
   */
  removeLayers() {
    this.map.removeLayers(this.flattedLayers);
    this.map.removeLayers(this.map.getBaseLayers());
  }

  /**
   * This function add the events listener to each button of the html
   * @param {HTMLElement} html
   * @function
   * @public
   * @api
   */
  listen(html) {
    html.querySelectorAll('div[id^="m-selectionzoom-lyr-"]')
      .forEach((b, i) => b.addEventListener('click', (e) => this.showBaseLayer(e, this.layers[i], i)));

    html.querySelectorAll('div[id^="m-selectionzoom-lyr-"]')
      .forEach((b, i) => b.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') this.showBaseLayer(e, this.layers[i], i);
      }));
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
    return control instanceof SelectionZoomControl;
  }

  accessibilityTab(html) {
    html.querySelectorAll('[tabindex="0"]').forEach((el) => el.setAttribute('tabindex', this.order));
  }
}
