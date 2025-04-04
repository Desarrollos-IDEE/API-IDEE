/* eslint-disable no-console */
/**
 * @module IDEE/impl/control/InfocoordinatesControl
 */

import { getValue } from '../../../facade/js/i18n/language';

const ELEVATION_PROCESS_URL = 'https://api-processes.idee.es/processes/getElevation/execution';

export default class InfocoordinatesControl extends IDEE.impl.Control {
  /**
   * This function adds the control to the specified map
   *
   * @public
   * @function
   * @param {IDEE.Map} map to add the plugin
   * @param {HTMLElement} html of the plugin
   * @api stable
   */
  addTo(map, html) {
    this.facadeMap_ = map;
    super.addTo(map, html);
  }

  getCoordinates(feature, SRStarget, formatGMS, decimalGEOcoord, decimalUTMcoord) {
    const NODATA = '--';
    const numPoint = feature.getId();
    const coordinatesFeature = feature.getAttribute('coordinates');
    const SRSfeature = feature.getAttribute('EPSGcode');
    const coordinatesGEOoutput = ol.proj.transform(coordinatesFeature, SRSfeature, 'EPSG:4326');
    const datum = this.datumCalc(SRStarget);
    let res = {
      'NumPoint': numPoint,
      'projectionGEO': {
        'code': NODATA,
        'coordinatesGEO': {
          'longitude': NODATA,
          'latitude': NODATA,
        },
      },
      'projectionUTM': {
        'code': NODATA,
        'datum': NODATA,
        'coordinatesUTM': {
          'coordX': NODATA,
          'coordY': NODATA,
        },
      },
    };

    if (SRStarget != null) {
      const coordinatesUTMoutput = ol.proj.transform(coordinatesFeature, SRSfeature, SRStarget);
      res = {
        'NumPoint': numPoint,
        'projectionGEO': {
          'code': SRStarget,
          'coordinatesGEO': {
            'longitude': coordinatesGEOoutput[0].toFixed(decimalGEOcoord),
            'latitude': coordinatesGEOoutput[1].toFixed(decimalGEOcoord),
          },
        },
        'projectionUTM': {
          'code': SRStarget,
          'datum': datum,
          'coordinatesUTM': {
            'coordX': coordinatesUTMoutput[0].toFixed(decimalUTMcoord),
            'coordY': coordinatesUTMoutput[1].toFixed(decimalUTMcoord),
          },
        },
      };

      if (formatGMS === true) {
        const coordinateGGMMSS = ol.coordinate.toStringHDMS(coordinatesGEOoutput, 2);
        res.projectionGEO.coordinatesGEO.latitude = coordinateGGMMSS.substr(0, 17);
        res.projectionGEO.coordinatesGEO.longitude = coordinateGGMMSS.substr(17);
      }
    }

    return res;
  }

  datumCalc(srs) {
    let datum = 'ETRS89';
    if (srs.indexOf('3857') > -1) {
      datum = 'WGS84';
    } else if (srs.indexOf('4083') > -1) {
      datum = 'REGCAN95';
    }

    return datum;
  }

  readAltitudeFromElevationProcess(coordinates, srcMapa) {
    return new Promise((resolve) => {
      fetch(ELEVATION_PROCESS_URL, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          'inputs': {
            'crs': parseInt(srcMapa, 10),
            'geom': `{ "type": "Feature", "geometry": { "type": "Point", "coordinates": [${coordinates[0]}, ${coordinates[1]}] } }`,
          },
        }),
      })
        .then((response) => {
          if (!response.ok) {
            IDEE.toast.error(getValue('exception.query_profile'), 6000);
            return undefined;
          }
          return response.json();
        })
        .then((response) => {
          if (!response) {
            resolve(undefined);
          } else {
            resolve(response.values[0]);
          }
        })
        .catch(() => {
          IDEE.toast.error(getValue('exception.query_profile'), 6000);
          resolve(undefined);
        });
    });
  }

  transform(box, code, currProj) {
    return ol.proj.transform(box, code, currProj);
  }

  transformExt(box, code, currProj) {
    return ol.proj.transformExtent(box, code, currProj);
  }

  activateClick(map) {
    // desactivo el zoom al dobleclick
    this.dblClickInteraction_.setActive(false);

    // añado un listener al evento dblclick
    const olMap = map.getMapImpl();
    olMap.on('dblclick', (evt) => {
      // disparo un custom event con las coordenadas del dobleclick
      const customEvt = new CustomEvent('mapclicked', {
        detail: evt.coordinate,
        bubbles: true,
      });
      map.getContainer().dispatchEvent(customEvt);
    });
  }

  deactivateClick(map) {
    // activo el zoom al dobleclick
    this.dblClickInteraction_.setActive(true);

    // elimino el listener del evento
    map.getMapImpl().removeEventListener('dblclick');
  }
}
