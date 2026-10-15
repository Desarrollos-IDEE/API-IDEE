/**
 * @module IDEE/impl/control/MouseSRSControl
 */
import ExtendedMouse from './extendedMouse';
import template from '../../../templates/srs';
import { getValue } from '../../../facade/js/i18n/language';

export default class MouseSRSControl extends IDEE.impl.Control {
  // eslint-disable-next-line max-len
  constructor(options = {}) {
    super(options);

    /**
     * Coordinates spatial reference system
     * @type { ProjectionLike } https://openlayers.org/en/latest/apidoc/module-ol_proj.html#~ProjectionLike
     * @private
     */
    this.srs = options.srs;

    /**
     * Label to show
     * @type {string}
     * @private
     */
    this.label = options.label;

    /**
     * Precision of coordinates
     * @private
     * @type {number}
     */
    this.precision = options.precision;

    /**
     * Number of decimal digits for geographic coordinates.
     * @private
     * @type {number}
     */
    this.geoDecimalDigits = options.geoDecimalDigits;

    /**
     * Number of decimal digits for UTM coordinates.
     * @private
     * @type {number}
     */
    this.utmDecimalDigits = options.utmDecimalDigits;

    /**
     * Tooltip
     * @private
     * @type {string}
     */
    this.tooltip = options.tooltip;

    /**
     * Activate viewing z value
     * @private
     * @type {boolean}
     */
    this.activeZ = options.activeZ;

    /**
     * URL to the help for the icon
     * @private
     * @type {string}
     */
    this.helpUrl = options.helpUrl;

    /**
     * Service to use for Z value
     * Values: wcs, ogc
     * @private
     * @type {string}
     */
    this.mode = options.mode;

    /**
     * Object of coverage services with their min and max zooms
     * @private
     * @type {Object}
     */
    this.coveragePrecissions = options.coveragePrecissions;

    /**
     * Order of the plugin
     * @private
     * @type {Number}
     */
    this.order = options.order;

    /**
     * Option to show the SRS of the selected EPSG
     * @private
     * @type {Boolean}
     */
    this.epsgFormat = options.epsgFormat;

    /**
     * Option that allows the EPSG selector modal to be draggable
     * @private
     * @type {boolean}
     */
    this.draggableDialog = options.draggableDialog;

    /**
     * Array of projections
     * @private
     * @type {Array<ProjectionLike>}
     * @default null
     */
    this.projections = null;
  }

  /**
   * This function adds the control to the specified map
   *
   *
   * @public
   * @function
   * @param {IDEE.Map} map to add the plugin
   * @param {HTMLElement} html of the plugin
   * @api
   */
  addTo(map, html) {
    super.addTo(map, html);
    this.auxMap_ = map;
    this.html_ = html;
    this.renderPlugin(map, html);
  }

  /**
   * Este método es el que busca Map.js para insertar el control en el DOM
   */
  getView() {
    // eslint-disable-next-line no-underscore-dangle
    return this.html_; // DEvolver el div#div-contenedor
  }

  async renderPlugin(map, html) {
    this.facadeMap_ = map;
    this.mousePositionControl = new ExtendedMouse({
      coordinateFormat: ol.coordinate.createStringXY(await this.getDecimalUnits()),
      projection: this.srs,
      label: (this.epsgFormat) ? this.formatEPSG(this.label) : this.label,
      placeholder: '',
      undefinedHTML: '',
      className: 'm-mouse-srs',
      target: this.html_,
      tooltip: this.tooltip,
      geoDecimalDigits: this.geoDecimalDigits,
      utmDecimalDigits: this.utmDecimalDigits,
      activeZ: this.activeZ,
      order: this.order,
      mode: this.mode,
      coveragePrecissions: this.coveragePrecissions,
    });

    map.getMapImpl().addControl(this.mousePositionControl);
    // super.addTo(map, html);
    this.mousePositionControl.initLoaderManager(map);
    document.querySelector('.m-mousesrs-container .m-mouse-srs').setAttribute('role', 'text ');
    document.querySelector('.m-mousesrs-container .m-mouse-srs').setAttribute('tabIndex', this.order);
    document.querySelector('.m-mousesrs-container .m-mouse-srs').addEventListener('click', this.openChangeSRS.bind(this, this.auxMap_, html));
    document.querySelector('.m-mousesrs-container .m-mouse-srs').addEventListener('keydown', ({ key }) => {
      if (key === 'Enter') this.openChangeSRS(this, this.auxMap_, html);
    });
  }

  openChangeSRS(map, html) {
    this.projections = IDEE.impl.ol.js.projections.getSupportedProjs();
    const content = IDEE.template.compileSync(template, {
      jsonp: true,
      parseToHtml: true,
      vars: {
        selected: this.srs,
        hasHelp: this.helpUrl !== undefined && IDEE.utils.isUrl(this.helpUrl),
        helpUrl: this.helpUrl,
        select_srs: getValue('select_srs'),
        choose_create_epsg: getValue('choose_create_epsg'),
        order: this.order,
        projections: this.projections,
      },
    });

    if (this.epsgFormat) {
      this.formatEPSGs(content);
    }
    IDEE.dialog.info(content.outerHTML, getValue('select_srs'), this.order);
    const input = document.querySelector('#m-mousesrs-epsg-selected');
    const listElem = document.getElementById('m-mousesrs-srs-selector');
    let isEditable = false;

    listElem.addEventListener('mousedown', (event) => {
      event.preventDefault();
    });

    input.addEventListener('focus', () => {
      if (!isEditable) {
        listElem.style.display = 'block';
        const list = document.querySelectorAll('#m-mousesrs-srs-selector li a');
        list.forEach((li) => {
          li.addEventListener('mousedown', (event) => {
            event.preventDefault();
            const value = event.target.getAttribute('value');
            if (value === 'default') {
              isEditable = true;
              input.removeAttribute('readonly');
              input.value = '';
              input.placeholder = getValue('placeholder_custom_epsg');
              listElem.style.display = 'none';
              input.focus();
            } else {
              input.value = value;
              this.changeSRS(map, html, value);
            }
          });
        });
      }
    });

    input.addEventListener('blur', () => {
      listElem.style.display = 'none';
      isEditable = false;
      if (!input.hasAttribute('readonly')) {
        input.setAttribute('readonly', 'readonly');
        input.value = this.srs;
      }
    });

    input.addEventListener('keyup', (event) => {
      if (isEditable && event.key === 'Enter') {
        isEditable = false;
        input.setAttribute('readonly', 'readonly');
        this.changeSRS(map, html);
      }
    });
    const button = document.querySelector('div.m-dialog.info div.m-button > button');
    button.innerHTML = getValue('close');

    button.addEventListener('click', () => {
      isEditable = false;
      if (!input.hasAttribute('readonly')) {
        input.setAttribute('readonly', 'readonly');
      }
    });
    if (this.draggableDialog) {
      IDEE.utils.draggabillyElement('.m-dialog .m-modal .m-content', '.m-dialog .m-modal .m-content .m-title');
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
    // Format IDEE.impl.ol.js.projections.getSupportedProjs()
    const supportedProjs = IDEE.impl.ol.js.projections.getSupportedProjs();

    // Find EPSG in supportedProjs
    const find = supportedProjs.find((p) => p.codes.includes(epsg));

    if (!find) return epsg;

    const { datum, proj } = find;
    const format = `${datum} - ${proj} `;

    return format;
  }

  changeSRS(map, html) {
    const select = document.querySelector('#m-mousesrs-epsg-selected');
    this.srs = select.value.startsWith('EPSG:') ? select.value : `EPSG:${select.value}`;
    this.label = select.value.startsWith('EPSG:') ? select.value : `EPSG:${select.value}`;
    this.facadeMap_.getMapImpl().removeControl(this.mousePositionControl);
    document.querySelector('div.m-api-idee-container div.m-dialog').remove();
    this.renderPlugin(map, html);
  }

  /**
   * Calculates desired decimal digits for coordinate format.
   * @private
   * @function
   */
  async getDecimalUnits() {
    let decimalDigits;
    if (!ol.proj.get(this.srs)) {
      if (!await IDEE.impl.ol.js.projections.ensureProjection(this.srs)) {
        this.srs = 'EPSG:4326';
        this.label = this.formatEPSG(this.srs);
        IDEE.dialog.error(`${getValue('exception.srs')} ${this.srs}`);
      }
    }
    // eslint-disable-next-line no-underscore-dangle
    const srsUnits = ol.proj.get(this.srs).units_;

    if (srsUnits === 'd' && this.geoDecimalDigits !== undefined) {
      decimalDigits = this.geoDecimalDigits;
    } else if (srsUnits === 'm' && this.utmDecimalDigits !== undefined) {
      decimalDigits = this.utmDecimalDigits;
    } else {
      decimalDigits = this.precision;
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
