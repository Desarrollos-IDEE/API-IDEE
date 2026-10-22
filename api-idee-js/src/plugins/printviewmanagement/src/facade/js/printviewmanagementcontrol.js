/**
 * @module IDEE/control/PrintViewManagementControl
 */
import PrintViewManagementImpl from 'impl/printviewmanagement';
import template from '../../templates/printviewmanagement';
import { getValue } from './i18n/language';
import PrinterMapControl from './printermapcontrol';
import GeorefImageEpsgControl from './georefimageepsgcontrol';
import GeorefimageControl from './georefimagecontrol';

export default class PrintViewManagementControl extends IDEE.Control {
  /**
   * Main constructor of the class. Creates a PluginControl
   * control
   *
   * @constructor
   * @extends {IDEE.Control}
   * @api
   */
  constructor({
    georefImageEpsg, georefImage, printermap, order,
    defaultOpenControl,
  }) {
    if (IDEE.utils.isUndefined(PrintViewManagementImpl)
      || (IDEE.utils.isObject(PrintViewManagementImpl)
        && IDEE.utils.isNullOrEmpty(Object.keys(PrintViewManagementImpl)))) {
      IDEE.exception(getValue('exception.impl'));
    }

    const impl = new PrintViewManagementImpl();
    super('PrintViewManagement', impl);

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

    this.tooltipGeorefImage_ = georefImage.tooltip || getValue('georeferenced_img');

    /**
    * Indicates if the control printermap is added to the plugin
    * @private
    * @type {Boolean}
     */
    this.printermap_ = printermap;

    this.tooltipPrintermap_ = printermap.tooltip || getValue('map_printing');

    this.defaultOpenControl = defaultOpenControl;
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
      const html = IDEE.template.compileSync(template, {
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

      this.accessibilityTab(html);
      this.selectElementHTML();
      this.addEvent();
      this.defaultOpenControl_(html);
      success(html);
    });
  }

  selectElementHTML() {
    // IDs
    const ID_PRINT_BUTTON = '#m-printviewmanagement-print';

    // Elements
    this.elementPrintButton_ = this.html.querySelector(ID_PRINT_BUTTON);
  }

  addEvent() {
    // ADD EVENT PRINT - Only if the button exists (for backward compatibility)
    if (this.elementPrintButton_) {
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
    }

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
      this.deactive(html, 'printermap');
      this.printerMapControl.active(html);
    }

    if (this.defaultOpenControl === 2 && this.georefImage_) {
      this.deactive(html, 'georefImage');
      this.georefImageControl.active(html);
    }

    if (this.defaultOpenControl === 3 && this.georefImageEpsg_) {
      this.deactive(html, 'georefImageEpsg');
      this.georefImageEpsgControl.active(html);
    }
  }

  /**
   * This function compares controls
   *
   * @public
   * @function
   * @param {IDEE.Control} control to compare
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
      this.deactive(html, 'georefImageEpsg');
      this.georefImageEpsgControl.active(html);
    });
  }

  addPrinterMapControl(html) {
    this.printerMapControl = new PrinterMapControl(
      this.printermap_,
      this.map_,
    );
    html.querySelector('#m-printviewmanagement-printermap').addEventListener('click', () => {
      this.deactive(html, 'printermap');
      this.printerMapControl.active(html);
    });
  }

  addGeorefImageControl(html) {
    this.georefImageControl = new GeorefimageControl(
      this.georefImage_,
      this.map_,
    );
    html.querySelector('#m-printviewmanagement-georefImage').addEventListener('click', () => {
      this.deactive(html, 'georefImage');
      this.georefImageControl.active(html);
    });
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
    if (!IDEE.utils.isNullOrEmpty(this.georefImageControl)) {
      this.georefImageControl.destroy();
    }
    if (!IDEE.utils.isNullOrEmpty(this.printerMapControl)) {
      this.printerMapControl.destroy();
    }
  }
}
