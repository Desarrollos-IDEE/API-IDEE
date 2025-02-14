/* eslint-disable no-console */
/**
 * @module M/impl/control/InfocoordinatesControl
 */
export default class InfocoordinatesControl extends M.impl.Control {
  /**
   * This function adds the control to the specified map
   *
   * @public
   * @function
   * @param {M.Map} map to add the plugin
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

  readAltitudeFromWCSservice(coord, srcMapa) {
    // 1.- transformo las coordenadas a EPSG4258 ya que el servicio WCS es en ese srs
    const coordinatesEPSG4528 = ol.proj.transform(coord, srcMapa, 'EPSG:4258');

    // 2.- me genero un bbox de las coordenadas
    const bbox = [
      [coordinatesEPSG4528[0], coordinatesEPSG4528[1]],
      [coordinatesEPSG4528[0] + 0.000001, coordinatesEPSG4528[1] + 0.000001],
    ];

    // 3.- lanzo el servicio y el método devolverá un texto que lo recogerá una promesa
    const PROFILE_URL = 'https://servicios.idee.es/wcs-inspire/mdt?request=GetCoverage&bbox=';
    const PROFILE_URL_SUFFIX = '&service=WCS&version=1.0.0&coverage=Elevacion4258_5&'
      + 'interpolationMethod=bilinear&crs=EPSG%3A4258&format=ArcGrid&width=2&height=2';
    const url = `${PROFILE_URL}${bbox}${PROFILE_URL_SUFFIX}`;
    return M.remote.get(url);
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
