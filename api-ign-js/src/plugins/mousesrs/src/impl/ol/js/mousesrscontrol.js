/**
 * @module M/impl/control/MouseSRSControl
 */
import ExtendedMouse from './extendedMouse';
import template from '../../../templates/srs';
import { getValue } from '../../../facade/js/i18n/language';

export default class MouseSRSControl extends M.impl.Control {
  // eslint-disable-next-line max-len
  constructor(srs, label, precision, geoDecimalDigits, utmDecimalDigits, tooltip, activeZ, helpUrl, mode, coveragePrecissions, order, draggableDialog, epsgFormat) {
    super();

    /**
     * Coordinates spatial reference system
     *
     * @type { ProjectionLike } https://openlayers.org/en/latest/apidoc/module-ol_proj.html#~ProjectionLike
     * @private
     */
    this.srs_ = srs;

    /**
     * Label to show
     *
     * @type {string}
     * @private
     */
    this.label_ = label;

    /**
     * Precision of coordinates
     *
     * @private
     * @type {number}
     */
    this.precision_ = precision;

    /**
     * Number of decimal digits for geographic coordinates.
     * @private
     * @type {number}
     */
    this.geoDecimalDigits = geoDecimalDigits;

    /**
     * Number of decimal digits for UTM coordinates.
     * @private
     * @type {number}
     */
    this.utmDecimalDigits = utmDecimalDigits;

    /**
     * Tooltip
     *
     * @private
     * @type {string}
     */
    this.tooltip = tooltip;

    /**
     * Activate viewing z value
     * @private
     * @type {boolean}
     */
    this.activeZ = activeZ;

    /**
     * URL to the help for the icon
     * @private
     * @type {string}
     */
    this.helpUrl = helpUrl;

    /**
     * Service to use for Z value
     * Values: wcs, ogc
     * @private
     * @type {string}
     */
    this.mode_ = mode;

    this.coveragePrecissions_ = coveragePrecissions;

    this.order = order;

    this.epsgFormat = epsgFormat;

    this.draggableDialog = draggableDialog;
  }

  /**
   * This function adds the control to the specified map
   *
   *
   * @public
   * @function
   * @param {M.Map} map to add the plugin
   * @param {HTMLElement} html of the plugin
   * @api
   */
  addTo(map, html) {
    this.auxMap_ = map;
    this.html_ = html;
    this.renderPlugin(map, html);
  }

  renderPlugin(map, html) {
    this.facadeMap_ = map;
    this.mousePositionControl = new ExtendedMouse({
      coordinateFormat: ol.coordinate.createStringXY(this.getDecimalUnits()), // this.precision_),
      projection: this.srs_,
      label: (this.epsgFormat) ? this.formatEPSG(this.label_) : this.label_,
      placeholder: '',
      undefinedHTML: '',
      className: 'm-mouse-srs',
      target: this.html_,
      tooltip: this.tooltip,
      geoDecimalDigits: this.geoDecimalDigits,
      utmDecimalDigits: this.utmDecimalDigits,
      activeZ: this.activeZ,
      order: this.order,
      mode: this.mode_,
      coveragePrecissions: this.coveragePrecissions_,
    });

    map.getMapImpl().addControl(this.mousePositionControl);
    super.addTo(map, html);
    setTimeout(() => {
      this.mousePositionControl.initLoaderManager(map);
      document.querySelector('.m-mousesrs-container .m-mouse-srs').setAttribute('role', 'text ');
      document.querySelector('.m-mousesrs-container .m-mouse-srs').setAttribute('tabIndex', this.order);
      document.querySelector('.m-mousesrs-container .m-mouse-srs').addEventListener('click', this.openChangeSRS.bind(this, this.auxMap_, html));
      document.querySelector('.m-mousesrs-container .m-mouse-srs').addEventListener('keydown', ({ key }) => {
        if (key === 'Enter') this.openChangeSRS(this, this.auxMap_, html);
      });
    }, 1000);
  }

  openChangeSRS(map, html) {
    const content = M.template.compileSync(template, {
      jsonp: true,
      parseToHtml: true,
      vars: {
        selected: this.srs_,
        hasHelp: this.helpUrl !== undefined && M.utils.isUrl(this.helpUrl),
        helpUrl: this.helpUrl,
        select_srs: getValue('select_srs'),
        order: this.order,
      },
    });

    if (this.epsgFormat) {
      this.formatEPSGs(content);
    }
    M.dialog.info(content.outerHTML, getValue('select_srs'), this.order);
    setTimeout(() => {
      document.querySelector('.m-dialog>div.m-modal>div.m-content').style.minWidth = '260px';
      document.querySelector('#m-mousesrs-srs-selector').addEventListener('change', this.changeSRS.bind(this, map, html));
      document.querySelector('div.m-mapea-container div.m-dialog div.m-title').style.backgroundColor = '#71a7d3';
      const button = document.querySelector('div.m-dialog.info div.m-button > button');
      button.innerHTML = getValue('close');
      button.style.width = '75px';
      button.style.backgroundColor = '#71a7d3';
    }, 10);
    if (this.draggableDialog) {
      M.utils.draggabillyElement('.m-dialog .m-modal .m-content', '.m-dialog .m-modal .m-content .m-title');
    }
    document.addEventListener('keydown', (evt) => {
      if (evt.key === 'Escape') {
        const btn = document.querySelector('.m-dialog .m-content .m-button > button');
        if (btn !== null) {
          btn.click();
        }
      }
    });
  }

  formatEPSGs(html) {
    // GET EPSG of Selectors
    const query = [...html.querySelectorAll('select option')];

    query.forEach((option) => {
      // eslint-disable-next-line no-param-reassign
      option.innerText = this.formatEPSG(option.value);
    });
  }

  formatEPSG(epsg) {
    // Format M.impl.ol.js.projections.getSupportedProjs()
    const supportedProjs = M.impl.ol.js.projections.getSupportedProjs();

    // Find EPSG in supportedProjs
    const find = supportedProjs.find((p) => p.codes.includes(epsg));

    if (!find) return epsg;

    const { datum, proj } = find;
    const format = `${datum} - ${proj} `;

    return format;
  }

  changeSRS(map, html) {
    const select = document.querySelector('#m-mousesrs-srs-selector');
    this.srs_ = select.options[select.selectedIndex].value;
    this.label_ = select.options[select.selectedIndex].text;
    this.facadeMap_.getMapImpl().removeControl(this.mousePositionControl);
    document.querySelector('div.m-mapea-container div.m-dialog').remove();
    this.renderPlugin(map, html);
  }

  /**
   * Calculates desired decimal digits for coordinate format.
   * @private
   * @function
   */
  getDecimalUnits() {
    let decimalDigits;
    let srsUnits;
    try {
      // eslint-disable-next-line no-underscore-dangle
      srsUnits = ol.proj.get(this.srs_).units_;
    } catch (e) {
      M.dialog.error(getValue('exception.srs'));
      // eslint-disable-next-line no-underscore-dangle
      srsUnits = ol.proj.get('EPSG:4326').units_;
      this.srs_ = 'EPSG:4326';
    }

    if (srsUnits === 'd' && this.geoDecimalDigits !== undefined) {
      decimalDigits = this.geoDecimalDigits;
    } else if (srsUnits === 'm' && this.utmDecimalDigits !== undefined) {
      decimalDigits = this.utmDecimalDigits;
    } else {
      decimalDigits = this.precision_;
    }
    return decimalDigits;
  }

  /**
   * This function destroys this control, cleaning the HTML
   * and unregistering all events
   *
   * @public
   * @function
   * @api
   * @export
   */
  destroy() {
    this.mousePositionControl.destroy();
    this.facadeMap_.getMapImpl().removeControl(this);
    this.facadeMap_ = null;
  }
}
