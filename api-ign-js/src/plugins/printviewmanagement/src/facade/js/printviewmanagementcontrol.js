/**
 * @module M/control/PrintViewManagementControl
 */

import template from '../../templates/printviewmanagement';
import PrintViewManagementImpl from '../../impl/ol/js/printviewmanagement';
import { getValue } from './i18n/language';
import PrinterMapControl from './printermapcontrol';
import GeorefImageEpsgControl from './georefimageepsgcontrol';
import GeorefimageControl from './georefimagecontrol';

import { removeQueueElements } from './utils';

export default class PrintViewManagementControl extends M.Control {
  /**
   * Main constructor of the class. Creates a PluginControl
   * control
   *
   * @constructor
   * @extends {M.Control}
   * @api
   */
  constructor({
    isDraggable, georefImageEpsg, georefImage, printermap, order, map,
    serverUrl, printStatusUrl, defaultOpenControl, useProxy, statusProxy,
  }) {
    if (M.utils.isUndefined(PrintViewManagementImpl)) {
      M.exception(getValue('exception.impl'));
    }

    const impl = new PrintViewManagementImpl();
    super(impl, 'PrintViewManagement');
    /**
     * Option to allow the plugin to be draggable or not
     * @private
     * @type {Boolean}
     */
    this.isDraggable_ = isDraggable;

    /**
     * Order of plugin
     * @public
     * @type {Number}
     */
    this.order = order;

    /**
      @private *
      @type { string }
      * @type { string }
      */
    this.tooltipGeorefImageEpsg_ = georefImageEpsg.tooltip || getValue('tooltip_georefimageepsg');

    /**
     * Indicates if the control georefImageEpsg is added to the plugin
     * @private
     * @type {Boolean|Array<Object>}
     */
    this.georefImageEpsg_ = georefImageEpsg;

    /**
    * Indicates if the control georefImage is added to the plugin
    * @private
    * @type {Boolean}
    */
    this.georefImage_ = georefImage;
    if (this.georefImage_ instanceof Object) {
      this.georefImage_.serverUrl = serverUrl;
      this.georefImage_.printStatusUrl = printStatusUrl;
    }

    this.tooltipGeorefImage_ = georefImage.tooltip || getValue('georeferenced_img');

    /**
    * Indicates if the control printermap is added to the plugin
    * @private
    * @type {Boolean}
     */
    this.printermap_ = printermap;
    if (this.printermap_ instanceof Object) {
      this.printermap_.serverUrl = serverUrl;
      this.printermap_.printStatusUrl = printStatusUrl;
    }

    this.tooltipPrintermap_ = printermap.tooltip || getValue('map_printing');

    this.defaultOpenControl = defaultOpenControl;

    this.statusProxy = statusProxy;

    this.useProxy = useProxy;
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
      const html = M.template.compileSync(template, {
        vars: {
          georefImageEpsg: !!this.georefImageEpsg_,
          georefImage: !!this.georefImage_,
          printermap: !!this.printermap_,
          translations: {
            headertitle: getValue('tooltip'),
            tooltipGeorefImageEpsg: this.tooltipGeorefImageEpsg_,
            georefImage: this.tooltipGeorefImage_,
            printermap: this.tooltipPrintermap_,
            downImg: getValue('downImg'),
            delete: getValue('delete'),
          },
        },
      });

      this.html = html;

      if (this.georefImageEpsg_) { this.addGeorefImageEpsgControl(html); }

      if (this.georefImage_) { this.addGeorefImageControl(html); }

      if (this.printermap_) { this.addPrinterMapControl(html); }

      if (this.isDraggable_) { M.utils.draggabillyPlugin(this.getPanel(), '#m-printviewmanagement-title'); }

      this.accessibilityTab(html);
      this.selectElementHTML();
      this.addEvent();
      this.defaultOpenControl_(html);
      success(html);
    });
  }

  selectElementHTML() {
    // IDs
    const ID_REMOVE_BUTTON = '#m-printviewmanagement-remove';
    const ID_PRINT_BUTTON = '#m-printviewmanagement-print';

    // Elements
    this.elementRemoveButton_ = this.html.querySelector(ID_REMOVE_BUTTON);
    this.elementPrintButton_ = this.html.querySelector(ID_PRINT_BUTTON);
  }

  addEvent() {
    // ADD EVENT REMOVE
    // TO-DO EVITAR PETICIONES ? Problem CORE
    this.elementRemoveButton_.addEventListener('click', () => removeQueueElements(this.html));

    // ADD EVENT PRINT
    this.elementPrintButton_.addEventListener('click', (evt) => {
      const active = this.getControlActive(this.html);

      if (active) {
        if (active.id === 'm-printviewmanagement-georefImage') {
          this.georefImageControl.printClick(evt);
        }

        if (active.id === 'm-printviewmanagement-georefImageEpsg') {
          this.georefImageEpsgControl.printClick(evt);
        }

        if (active.id === 'm-printviewmanagement-printermap') {
          this.printerMapControl.printClick(evt);
        }
      }
    });

    document.addEventListener('keydown', (evt) => {
      if (evt.key === 'Escape') {
        const elem = document.querySelector('.m-panel.m-plugin-printviewmanagement.opened');
        if (elem !== null) {
          elem.querySelector('button.m-panel-btn').click();
        }
      }
    });
  }

  defaultOpenControl_(html) {
    if (this.defaultOpenControl === 1 && this.printermap_) {
      this.showDownloadButton('printermap');
      this.deactive(html, 'printermap');
      this.printerMapControl.active(html);
    }

    if (this.defaultOpenControl === 2 && this.georefImage_) {
      this.showDownloadButton('georefImage');
      this.deactive(html, 'georefImage');
      this.georefImageControl.active(html);
    }

    if (this.defaultOpenControl === 3 && this.georefImageEpsg_) {
      this.showDownloadButton('georefImageEpsg');
      this.deactive(html, 'georefImageEpsg');
      this.georefImageEpsgControl.active(html);
    }
  }

  /**
   * This function compares controls
   *
   * @public
   * @function
   * @param {M.Control} control to compare
   * @api
   */
  equals(control) {
    return control instanceof PrintViewManagementControl;
  }

  addGeorefImageEpsgControl(html) {
    this.georefImageEpsgControl = new GeorefImageEpsgControl(
      this.georefImageEpsg_,
      this.map_,
    );
    html.querySelector('#m-printviewmanagement-georefImageEpsg').addEventListener('click', () => {
      this.showDownloadButton('georefImageEpsg');
      this.deactive(html, 'georefImageEpsg');
      this.georefImageEpsgControl.active(html);
    });
  }

  addPrinterMapControl(html) {
    this.printerMapControl = new PrinterMapControl(
      this.printermap_,
      this.map_,
      this.statusProxy,
      this.useProxy,
    );
    html.querySelector('#m-printviewmanagement-printermap').addEventListener('click', () => {
      this.showDownloadButton('printermap');
      this.deactive(html, 'printermap');
      this.printerMapControl.active(html);
    });
  }

  addGeorefImageControl(html) {
    this.georefImageControl = new GeorefimageControl(
      this.georefImage_,
      this.map_,
      this.statusProxy,
      this.useProxy,
    );
    html.querySelector('#m-printviewmanagement-georefImage').addEventListener('click', () => {
      this.showDownloadButton('georefImage');
      this.deactive(html, 'georefImage');
      this.georefImageControl.active(html);
    });
  }

  showDownloadButton(type) {
    const ID_DOWNLOAD_BUTTON = '#m-georefimage-download-button';
    this.elementDownloadButton_ = this.html.querySelector(ID_DOWNLOAD_BUTTON);
    const elementDownloadButtonDW = this.html.querySelector(`${ID_DOWNLOAD_BUTTON} > button`);

    const display = this.elementDownloadButton_.style.display;
    if (display === 'none') {
      this.elementDownloadButton_.style.display = 'flex';
    }

    if (type === 'printermap') {
      elementDownloadButtonDW.title = getValue('downMap');
      elementDownloadButtonDW.innerHTML = getValue('downMap');
    } else {
      elementDownloadButtonDW.title = getValue('downImg');
      elementDownloadButtonDW.innerHTML = getValue('downImg');
    }
  }

  hidemDownloadButton() {
    const ID_DOWNLOAD_BUTTON = '#m-georefimage-download-button';
    this.elementDownloadButton_ = this.html.querySelector(ID_DOWNLOAD_BUTTON);

    const display = this.elementDownloadButton_.style.display;
    if (display === 'flex') {
      this.elementDownloadButton_.style.display = 'none';
    }
  }

  /**
   * This function deactivates the activated control
   * before activating another
   *
   * @public
   * @function
   * @param {Node} html
   * @param {String} control
   * @api
   */
  deactive(html, control) {
    const active = this.getControlActive(html);
    if (!active) { return; } // TO-DO NO SALE ?¿

    if (active && active.id !== `m-printviewmanagement-${control}`) {
      if (active.id === 'm-printviewmanagement-georefImage') {
        this.georefImageControl.deactive();
      }

      if (active.id === 'm-printviewmanagement-georefImageEpsg') {
        this.georefImageEpsgControl.deactive();
      }

      if (active.id === 'm-printviewmanagement-printermap') {
        this.printerMapControl.deactive();
      }

      active.classList.remove('activated');
      // const container = document.querySelector('#div-contenedor-printviewmanagement');
      // if (container && container.children.length > 2) {
      //   container.removeChild(container.children[2]);
      // }
    } else if (active.id === `m-printviewmanagement-${control}`) {
      this.hidemDownloadButton();
    }
  }

  getControlActive(html) {
    return html.querySelector('#m-printviewmanagement-previews .activated') || false;
  }

  /**
   * This function changes number of tabindex
   *
   * @public
   * @function
   * @param {Node} html
   * @api
   */
  accessibilityTab(html) {
    html.querySelectorAll('[tabindex="0"]').forEach((el) => el.setAttribute('tabindex', this.order));
  }

  /**
   * This function destroys controls inside this control
   *
   * @public
   * @function
   * @api
   */
  destroy() {
    if (!M.utils.isNullOrEmpty(this.georefImageControl)) {
      this.georefImageControl.destroy();
    }
    if (!M.utils.isNullOrEmpty(this.printerMapControl)) {
      this.printerMapControl.destroy();
    }
  }
}
