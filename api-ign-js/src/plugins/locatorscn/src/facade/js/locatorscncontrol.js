/**
 * @module M/control/LocatorscnControl
 */

import template from '../../templates/locatorscn';
import LocatorscnImpl from '../../impl/ol/js/locatorscn';
import { getValue } from './i18n/language';
import IGNSearchLocatorscnControl from './ignsearchlocatorscncontrol';

export default class LocatorscnControl extends M.Control {
  /**
   * Main constructor of the class. Creates a PluginControl
   * control
   *
   * @constructor
   * @extends {M.Control}
   * @api
   */
  constructor(
    isDraggable,
    zoom,
    pointStyle,
    searchOptions,
    order,
    useProxy,
    statusProxy,
    position,
  ) {
    if (M.utils.isUndefined(LocatorscnImpl)) {
      M.exception(getValue('exception.impl'));
    }

    const impl = new LocatorscnImpl();
    super(impl, 'Locatorscn');

    /**
     * Indicates if the control ignsearchlocatorscn is added to the plugin
     * @private
     * @type {Boolean|Object}
     */
    this.searchOptions_ = searchOptions;

    /**
     * Option to allow the plugin to be draggable or not
     * @private
     * @type {Boolean}
     */
    this.isDraggable_ = isDraggable;

    /**
     * Zoom
     * @private
     * @type {Number}
     */
    this.zoom_ = zoom;

    /**
     * Type of icon to display when a punctual type result is found
     * @private
     * @type {string}
     */
    this.pointStyle_ = pointStyle;

    /**
     * Order of plugin
     * @public
     * @type {Number}
     */
    this.order = order;

    /**
     * Indicates if you want to use proxy in requests
     * @private
     * @type {Number}
     */
    this.useProxy = useProxy;

    /**
     * Stores the proxy state at plugin load time
     * @private
     * @type {Boolean}
     */
    this.statusProxy = statusProxy;

    /**
     * Position of the plugin
     *
     * @private
     * @type {String} TL | TR | BL | BR | TC
     */
    this.position = position || 'TR';

    /**
     * Control activated
     * @public
     * @type {Control}
     */
    this.control = null;
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
          showTitle: this.position !== 'TC',
          byParcelCadastre: this.byParcelCadastre_,
          byPlaceAddressPostal: this.searchOptions_,
          translations: {
            headertitle: getValue('tooltip'),
            ignsearch: getValue('ignsearch'),
          },
        },
      });
      this.html = html;
      if (this.searchOptions_) {
        // ignsearchlocatorscn
        this.ignsearchControl = new IGNSearchLocatorscnControl(
          this.map_,
          this.zoom_,
          this.pointStyle_,
          this.searchOptions_,
          this.useProxy,
          this.statusProxy,
          this.position,
        );
        this.on(M.evt.ADDED_TO_MAP, () => {
          this.ignsearchControl.initializateAddress(html);
          this.control = this.ignsearchControl;
          this.deactive(html, 'ignsearch');
          this.ignsearchControl.active(html);
          this.control = this.ignsearchControl;
        });
        this.ignsearchControl.on('ignsearchlocatorscn:entityFound', (extent) => {
          this.fire('ignsearchlocatorscn:entityFound', [extent]);
        });
      }
      if (this.isDraggable_) {
        M.utils.draggabillyPlugin(this.getPanel(), '#m-locatorscn-title');
      }
      this.accessibilityTab(html);
      success(html);
    });
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
    return control instanceof LocatorscnControl;
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
    const active = html.querySelector('#m-locatorscn-previews .activated');
    if (this.position === 'TC') {
      document.querySelector('.m-plugin-locatorscn').classList.remove('m-plugin-locatorscn-tc-withpanel');
      document.querySelector('.m-plugin-locatorscn').classList.add('m-plugin-locatorscn-tc');
    }
    if (active && !active.id.includes(control)) {
      this.control.clearResults();
      active.classList.remove('activated');
      const container = document.querySelector('#div-contenedor-locatorscn');
      if (this.position === 'TC' && container && container.children.length > 1) {
        container.removeChild(container.children[1]);
      } else if (container && container.children.length > 2) {
        container.removeChild(container.children[2]);
      }
    }
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
    if (!M.utils.isNullOrEmpty(this.ignsearchControl)) {
      this.ignsearchControl.destroy();
    }
  }
}
