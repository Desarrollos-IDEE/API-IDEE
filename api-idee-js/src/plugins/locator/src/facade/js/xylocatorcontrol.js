/**
 * @module IDEE/control/XYLocatorControl
 */

import template from 'templates/xylocator';
import XYLocatorImpl from 'impl/xylocatorcontrol';
import { getValue } from './i18n/language';

export default class XYLocatorControl extends IDEE.Control {
  /**
   * Main constructor of the class. Creates a PluginControl
   * control
   *
   * @constructor
   * @extends {IDEE.Control}
   * @api
   */
  constructor(map, zoom, pointStyle, options, positionPlugin) {
    if (IDEE.utils.isUndefined(XYLocatorImpl) || (IDEE.utils.isObject(XYLocatorImpl)
      && IDEE.utils.isNullOrEmpty(Object.keys(XYLocatorImpl)))) {
      IDEE.exception(getValue('exception.impl_xylocator'));
    }
    const impl = new XYLocatorImpl(map);
    super(impl, 'XYLocatorImpl');

    /**
     * Projections options
     *
     * @private
     * @type {Array<object>} - {code: ..., title: ..., units: m | d}
     */
    this.projections = options.projections;

    /**
     * Zoom
     *
     * @private
     * @type {number}
     */
    this.zoom = zoom;

    /**
     * Type of icon to display when a punctual type result is found
     * @private
     * @type {string}
     */
    this.pointStyle = pointStyle;

    /**
     * Help
     *
     * @private
     * @type {string}
     */
    this.help = options.help;

    /**
     * Map
     */
    this.map = map;

    /**
     * Position plugin
     * @private
     * @type {String}
     */
    this.positionPlugin = positionPlugin;
  }

  /**
   * This function active control
   *
   * @public
   * @function
   * @param {Node} html
   * @api
   */
  active(html) {
    this.html_ = html;
    const xylocatoractive = this.html_.querySelector('#m-locator-xylocator').classList.contains('activated');
    this.deactive();
    if (!xylocatoractive) {
      if (this.positionPlugin === 'TC') {
        document.querySelector('.m-plugin-locator').classList.remove('m-plugin-locator-tc');
        document.querySelector('.m-plugin-locator').classList.add('m-plugin-locator-tc-withpanel');
      }
      this.html_.querySelector('#m-locator-xylocator').classList.add('activated');
      const panel = IDEE.template.compileSync(template, {
        vars: {
          hasHelp: !IDEE.utils.isUndefined(this.help) && IDEE.utils.isUrl(this.help),
          helpUrl: this.help,
          projections: this.projections,
          translations: {
            srs: getValue('srs'),
            longitude: getValue('longitude'),
            latitude: getValue('latitude'),
            locate: getValue('locate'),
            clean: getValue('clean'),
            east: getValue('east'),
            west: getValue('west'),
            north: getValue('north'),
            south: getValue('south'),
            geographic: getValue('geographic'),
            zone: getValue('zone'),
            dms: getValue('dms'),
            dd: getValue('dd'),
          },
        },
      });
      document.querySelector('#div-contenedor-locator').appendChild(panel);
      this.html_.querySelector('button#m-xylocator-limpiar').addEventListener('click', () => this.clearResults());
      this.html_.querySelector('select#m-xylocator-srs').addEventListener('change', (evt) => this.manageInputs_(evt));
      this.html_.querySelector('button#m-xylocator-loc').addEventListener('click', (evt) => this.calculate_());
    }
  }

  /**
   * This function deactive control
   *
   * @public
   * @function
   * @api
   */
  deactive() {
    this.html_.querySelector('#m-locator-xylocator').classList.remove('activated');
    const panel = this.html_.querySelector('#m-xylocator-panel');
    if (panel) {
      this.clearResults();
      document.querySelector('#div-contenedor-locator').removeChild(panel);
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
    return control instanceof XYLocatorControl;
  }

  /**
   * This function clears input values
   *
   * @private
   * @function
   */
  clearResults() {
    this.html_.querySelector('input#UTM-X').value = '';
    this.html_.querySelector('input#UTM-Y').value = '';
    this.html_.querySelector('input#LON').value = '';
    this.html_.querySelector('input#LAT').value = '';
    this.html_.querySelector('input#LONHH').value = 0;
    this.html_.querySelector('input#LONMM').value = 0;
    this.html_.querySelector('input#LONSS').value = 0;
    this.html_.querySelector('input#LATHH').value = 0;
    this.html_.querySelector('input#LATMM').value = 0;
    this.html_.querySelector('input#LATSS').value = 0;
    this.map.removeLayers(this.coordinatesLayer);
  }

  /**
   * This function changes input label depending on SRS
   *
   * @private
   * @function
   * @param {DOMEvent} evt - event
   */
  manageInputs_(evt) {
    const selectTarget = evt.target;
    const selectedOption = selectTarget.options[selectTarget.selectedIndex];
    this.html_.querySelector('div#m-xylocator-utm').style.display = 'none';
    this.html_.querySelector('div#m-xylocator-dms').style.display = 'none';
    this.html_.querySelector('div#m-xylocator-latlon').style.display = 'none';

    if (selectedOption.getAttribute('data-units') === 'd') {
      this.html_.querySelector('div#m-xylocator-latlon').style.display = 'block';
    } else if (selectedOption.getAttribute('data-units') === 'dms') {
      this.html_.querySelector('div#m-xylocator-dms').style.display = 'block';
    } else {
      this.html_.querySelector('div#m-xylocator-utm').style.display = 'block';
    }
  }

  /**
   * This function transforms coordinates to map SRS
   *
   * @public
   * @function
   * @api
   */
  calculate_() {
    try {
      const selectTarget = this.html_.querySelector('select#m-xylocator-srs');
      const selectedOption = selectTarget.options[selectTarget.selectedIndex];
      const origin = selectedOption.value;
      const unit = selectedOption.getAttribute('data-units');
      let x = -1;
      let y = -1;
      let selectors;
      if (unit !== 'dms') {
        selectors = unit === 'd' ? ['input#LON', 'input#LAT'] : ['input#UTM-X', 'input#UTM-Y'];
        const xString = this.html_.querySelector(selectors[0]).value.replace(',', '.');
        const yString = this.html_.querySelector(selectors[1]).value.replace(',', '.');
        x = parseFloat(xString);
        y = parseFloat(yString);
      } else {
        const hhLon = this.html_.querySelector('input#LONHH').value;
        const mmLon = this.html_.querySelector('input#LONMM').value;
        const ssLon = this.html_.querySelector('input#LONSS').value;
        const dirLon = this.html_.querySelector('input[name="LONDIR"]:checked').value;
        const hhLat = this.html_.querySelector('input#LATHH').value;
        const mmLat = this.html_.querySelector('input#LATMM').value;
        const ssLat = this.html_.querySelector('input#LATSS').value;
        const dirLat = this.html_.querySelector('input[name="LATDIR"]:checked').value;

        if (this.checkDegreeValue_(mmLon) && this.checkDegreeValue_(ssLon)
          && this.checkDegreeValue_(mmLat)
          && this.checkDegreeValue_(ssLat) && parseFloat(hhLon) >= 0
          && parseFloat(hhLon) <= 180 && parseFloat(hhLat) >= 0 && parseFloat(hhLat) <= 180) {
          x = parseFloat(hhLon) + (parseFloat(mmLon) / 60) + (parseFloat(ssLon) / 3600);
          y = parseFloat(hhLat) + (parseFloat(mmLat) / 60) + (parseFloat(ssLat) / 3600);

          if (dirLon !== 'east' && x !== 0) {
            x = -x;
          }

          if (dirLat !== 'north' && y !== 0) {
            y = -y;
          }
        } else {
          IDEE.dialog.error(getValue('exception.wrong_values'), 'Error');
        }
      }
      try {
        const coordinatesTransform = this.getImpl().reproject(origin, [x, y]);
        this.locator_(coordinatesTransform);
      } catch (ex) {
        IDEE.dialog.error(getValue('exception.transforming'), 'Error');
      }
    } catch (ex) {
      IDEE.dialog.error(getValue('exception.wrong_coords'), 'Error');
      throw ex;
    }
  }

  /**
   * This function centers the map on given point
   *
   * @public
   * @function
   * @param coords - coordinates writen by user
   * @api
   */
  locator_(coords) {
    const x = parseFloat(coords[0]);
    const y = parseFloat(coords[1]);
    this.map.removeLayers(this.coordinatesLayer);
    if (!Number.isNaN(x) && !Number.isNaN(y)) {
      this.map.setCenter(`${x},${y}*false`);
      this.map.setZoom(this.zoom);

      this.fire('xylocator:locationCentered', [{
        zoom: this.zoom,
        center: [x, y],
      }]);

      this.coordinatesLayer = new IDEE.layer.Vector({
        name: 'coordinatexylocator',
      }, { displayInLayerSwitcher: false });

      const feature = new IDEE.Feature('localizacion', {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'Point',
          coordinates: [x, y],
        },
      });

      this.coordinatesLayer.addFeatures([feature]);
      this.createGeometryStyles();
      this.map.addLayers(this.coordinatesLayer);
    } else {
      IDEE.dialog.error(getValue('exception.wrong_coords'), 'Error');
    }
  }

  /**
   * This function creates the style of the geometry according
   * to the user parameter
   *
   * @function
   * @public
   * @api
   */
  createGeometryStyles() {
    let style = {
      radius: 8,
      fill: {
        color: '#f00',
        opacity: 0.5,
      },
      stroke: {
        color: '#f00',
        opacity: 1,
        width: 3,
      },
    };

    if (this.pointStyle === 'pinAzul') {
      style = {
        radius: 5,
        icon: {
          src: IDEE.utils.concatUrlPaths([IDEE.config.THEME_URL, '/img/marker.svg']),
          scale: 1.4,
          fill: {
            color: '#71a7d3',
          },
          stroke: {
            width: 30,
            color: 'white',
          },
          anchor: [0.5, 1],
        },
      };
    } else if (this.pointStyle === 'pinRojo') {
      style = {
        radius: 5,
        icon: {
          src: IDEE.utils.concatUrlPaths([IDEE.config.THEME_URL, '/img/pinign.svg']),
        },
      };
    } else if (this.pointStyle === 'pinMorado') {
      style = {
        radius: 5,
        icon: {
          src: IDEE.utils.concatUrlPaths([IDEE.config.THEME_URL, '/img/m-pin-24.svg']),
        },
      };
    }
    this.coordinatesLayer.setStyle(new IDEE.style.Point(style));
  }

  /**
   * This function checks degree value
   *
   * @public
   * @function
   * @param {String} num
   * @returns {boolean} True if value is greater than 60
   * @api
   */
  checkDegreeValue_(num) {
    return parseFloat(num) >= 0 && parseFloat(num) < 60;
  }

  /**
   * This function destroys this control
   *
   * @public
   * @function
   * @api
   */
  destroy() {
    this.map.removeLayers(this.coordinatesLayer);
  }
}
