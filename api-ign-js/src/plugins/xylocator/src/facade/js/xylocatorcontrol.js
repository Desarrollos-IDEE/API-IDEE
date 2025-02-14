/**
 * @module M/control/XYLocatorControl
 */

import XYLocatorImplControl from '../../impl/ol/js/xylocatorcontrol';
import template from '../../templates/xylocator';
import projections from '../../templates/options';
import { getValue } from './i18n/language';

/**
 * @classdesc
 * XYLocator Mapea control.
 * This control centers map on given coordinates.
 */
export default class XYLocatorControl extends M.Control {
  /**
   * @constructor
   * @extends {M.Control}
   * @api
   */
  constructor(options) {
    if (M.utils.isUndefined(XYLocatorImplControl)) {
      M.exception(getValue('exception.impl'));
    }
    const impl = new XYLocatorImplControl();
    super(impl, 'XYLocator');

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
    this.zoom = options.zoom;
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
    // eslint-disable-next-line
    console.warn(getValue('exception.xylocator_obsolete'));
    return new Promise((success, fail) => {
      const html = M.template.compileSync(template, {
        vars: {
          translations: {
            title: getValue('title'),
            srs: getValue('srs'),
            longitude: getValue('longitude'),
            latitude: getValue('latitude'),
            locate: getValue('locate'),
            clean: getValue('clean'),
            east: getValue('east'),
            west: getValue('west'),
            north: getValue('north'),
            south: getValue('south'),
          },
        },
      });

      this.template_ = html;
      const compiledOptions = M.template.compileSync(projections, {
        vars: {
          projections: this.projections,
          translations: {
            geographic: getValue('geographic'),
            zone: getValue('zone'),
            dms: getValue('dms'),
            dd: getValue('dd'),
          },
        },
      });
      this.template_.querySelector('#m-xylocator-coordinatesSystem').appendChild(compiledOptions);
      this.template_.querySelector('button#m-xylocator-limpiar').addEventListener('click', () => this.clear_());
      this.template_.querySelector('select#m-xylocator-srs').addEventListener('change', (evt) => this.manageInputs_(evt));
      this.template_.querySelector('button#m-xylocator-loc').addEventListener('click', (evt) => this.calculate_(evt));
      this.map = map;
      success(html);
    });
  }

  /**
   * This function gets activation button
   *
   * @public
   * @function
   * @param {HTML} html of control
   * @api
   */
  getActivationButton(html) {
    return html.querySelector('.m-xylocator button');
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
    return control instanceof XYLocatorControl;
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
    const x = coords[0];
    const y = coords[1];
    const xFloat = parseFloat(x);
    const yFloat = parseFloat(y);
    this.map.removeLayers(this.coordinatesLayer);
    if (!Number.isNaN(xFloat) && !Number.isNaN(yFloat)) {
      this.map.setCenter(`${xFloat},${yFloat}*false`);
      this.map.setZoom(this.zoom);
      this.fire('xylocator:locationCentered', [{
        zoom: this.zoom,
        center: [xFloat, yFloat],
      }]);

      this.coordinatesLayer = new M.layer.Vector({
        name: getValue('coordinateresult'),
      }, { displayInLayerSwitcher: false });

      const feature = new M.Feature('localizacion', {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'Point',
          coordinates: [xFloat, yFloat],
        },
      });

      this.coordinatesLayer.addFeatures([feature]);
      this.coordinatesLayer.setStyle(new M.style.Point({
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
      }));
      this.map.addLayers(this.coordinatesLayer);
    } else {
      M.dialog.error(getValue('exception.wrong_coords'), 'Error');
    }
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
    if (selectedOption.getAttribute('data-units') === 'd') {
      const divToHidden1 = document.querySelector('div#m-xylocator-utm');
      divToHidden1.style.display = 'none';
      const divToHidden2 = document.querySelector('div#m-xylocator-dms');
      divToHidden2.style.display = 'none';
      const divToShow = document.querySelector('div#m-xylocator-latlon');
      divToShow.style.display = 'block';
    } else if (selectedOption.getAttribute('data-units') === 'dms') {
      const divToHidden1 = document.querySelector('div#m-xylocator-utm');
      divToHidden1.style.display = 'none';
      const divToHidden2 = document.querySelector('div#m-xylocator-latlon');
      divToHidden2.style.display = 'none';
      const divToShow = document.querySelector('div#m-xylocator-dms');
      divToShow.style.display = 'block';
    } else {
      const divToHidden1 = document.querySelector('div#m-xylocator-latlon');
      divToHidden1.style.display = 'none';
      const divToHidden2 = document.querySelector('div#m-xylocator-dms');
      divToHidden2.style.display = 'none';
      const divToShow = document.querySelector('div#m-xylocator-utm');
      divToShow.style.display = 'block';
    }
  }

  /**
   * This function transforms coordinates to map SRS
   *
   * @public
   * @function
   * @param {DOMEvent} evt - event
   * @api
   */
  calculate_(evt) {
    try {
      const selectTarget = document.querySelector('select#m-xylocator-srs');
      const selectedOption = selectTarget.options[selectTarget.selectedIndex];
      const origin = selectedOption.value;
      let x = -1;
      let y = -1;
      if (selectedOption.getAttribute('data-units') === 'd') {
        try {
          const xString = document.querySelector('div#m-xylocator-latlon input#LON').value.replace(',', '.');
          const yString = document.querySelector('div#m-xylocator-latlon input#LAT').value.replace(',', '.');
          x = parseFloat(xString);
          y = parseFloat(yString);
          const coordinatesTransform = this.getImpl().reproject(origin, [x, y]);
          this.locator_(coordinatesTransform);
        } catch (ex) {
          M.dialog.error(getValue('exception.transforming'), 'Error');
        }
      } else if (selectedOption.getAttribute('data-units') === 'dms') {
        const hhLon = document.querySelector('div#m-xylocator-dms input#LONHH').value;
        const mmLon = document.querySelector('div#m-xylocator-dms input#LONMM').value;
        const ssLon = document.querySelector('div#m-xylocator-dms input#LONSS').value;
        const dirLon = document.querySelector('div#m-xylocator-dms input[name="LONDIR"]:checked').value;
        const hhLat = document.querySelector('div#m-xylocator-dms input#LATHH').value;
        const mmLat = document.querySelector('div#m-xylocator-dms input#LATMM').value;
        const ssLat = document.querySelector('div#m-xylocator-dms input#LATSS').value;
        const dirLat = document.querySelector('div#m-xylocator-dms input[name="LATDIR"]:checked').value;

        if (this.checkDegreeValue_(mmLon) && this.checkDegreeValue_(ssLon)
          && this.checkDegreeValue_(mmLat) && this.checkDegreeValue_(ssLat)
          && parseFloat(hhLon) >= 0 && parseFloat(hhLon) <= 180
          && parseFloat(hhLat) >= 0 && parseFloat(hhLat) <= 180) {
          try {
            x = parseFloat(hhLon) + (parseFloat(mmLon) / 60) + (parseFloat(ssLon) / 3600);
            y = parseFloat(hhLat) + (parseFloat(mmLat) / 60) + (parseFloat(ssLat) / 3600);
            if (dirLon !== 'east' && x !== 0) {
              x = -x;
            }

            if (dirLat !== 'north' && y !== 0) {
              y = -y;
            }

            const coordinatesTransform = this.getImpl().reproject(origin, [x, y]);
            this.locator_(coordinatesTransform);
          } catch (ex) {
            M.dialog.error(getValue('exception.transforming'), 'Error');
          }
        } else {
          M.dialog.error(getValue('exception.wrong_values'), 'Error');
        }
      } else {
        try {
          const xString = document.querySelector('div#m-xylocator-utm input#UTM-X').value.replace(',', '.');
          const yString = document.querySelector('div#m-xylocator-utm input#UTM-Y').value.replace(',', '.');
          x = parseFloat(xString);
          y = parseFloat(yString);
          const coordinatesTransform = this.getImpl().reproject(origin, [x, y]);
          this.locator_(coordinatesTransform);
        } catch (ex) {
          M.dialog.error(getValue('exception.transforming'), 'Error');
        }
      }
    } catch (ex) {
      M.dialog.error(getValue('exception.wrong_coords'), 'Error');
      throw ex;
    }
  }

  /**
   * This function clears input values
   *
   * @private
   * @function
   */
  clear_() {
    this.template_.querySelector('input#UTM-X').value = '';
    this.template_.querySelector('input#UTM-Y').value = '';
    this.template_.querySelector('input#LON').value = '';
    this.template_.querySelector('input#LAT').value = '';
    this.template_.querySelector('input#LONHH').value = 0;
    this.template_.querySelector('input#LONMM').value = 0;
    this.template_.querySelector('input#LONSS').value = 0;
    this.template_.querySelector('input#LATHH').value = 0;
    this.template_.querySelector('input#LATMM').value = 0;
    this.template_.querySelector('input#LATSS').value = 0;
    this.map.removeLayers(this.coordinatesLayer);
  }

  /**
   * This function checks degree value
   *
   * @public
   * @function
   * @param {String} num
   * @api
   */
  checkDegreeValue_(num) {
    return parseFloat(num) >= 0 && parseFloat(num) < 60;
  }
}
