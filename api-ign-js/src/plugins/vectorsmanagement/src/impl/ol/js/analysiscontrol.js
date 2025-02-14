/**
 * @module M/impl/control/Analysiscontrol
 */

import Profil from './profilcontrol';
import { getValue } from '../../../facade/js/i18n/language';

const WGS84 = 'EPSG:4326';
const MERCATOR = 'EPSG:900913';
const PROFILE_URL = 'https://servicios.idee.es/wcs-inspire/mdt?request=GetCoverage&bbox=';
const PROFILE_URL_SUFFIX = '&service=WCS&version=1.0.0&coverage=Elevacion4258_5&'
  + 'interpolationMethod=bilinear&crs=EPSG%3A4258&format=ArcGrid&width=2&height=2';
const NO_DATA_VALUE = 'NODATA_value -9999.000';

const formatNumber = (x, decimals) => {
  const pow = 10 ** decimals;
  let num = Math.round(x * pow) / pow;
  num = num.toString().replace('.', ',');
  if (decimals > 2) {
    num = `${num.split(',')[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.')},${num.split(',')[1]}`;
  } else {
    num.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  return num;
};

export default class Analysiscontrol extends M.impl.Control {
  /**
  * @classdesc
  * Main constructor of the measure conrol.
  *
  * @constructor
  * @extends {ol.control.Control}
  * @api stable
  */
  constructor(map) {
    super();
    /**
      * Facade of the map
      * @private
      * @type {M.Map}
      */
    this.facadeMap_ = map;
    this.source_ = new ol.source.Vector({ wrapX: false });
    this.vector_ = new ol.layer.Vector({
      source: this.source_,
      style: this.style_,
      name: 'capatopo',
    });

    this.vector_.setZIndex(1000000);
    this.facadeMap_.getMapImpl().addLayer(this.vector_);

    this.distance_ = 30;

    this.arrayXZY = null;
  }

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
    super.addTo(map, html);

    /**
     * Facade map
     * @private
     * @type {M.map}
     */
    this.facadeMap_ = map;

    /**
     * OL vector source for draw interactions.
     * @private
     * @type {*} - OpenLayers vector source
     */
    this.olLayer_ = undefined;
  }

  /**
   * This function set the OL layer selected for management
   *
   * @public
   * @function
   * @api stable
   * @param {ol.layer} olLayer
   */
  setOLLayer(olLayer) {
    this.olLayer_ = olLayer;
  }

  /**
   * Creates feature clone.
   * @public
   * @function
   * @api
   * @param {M.Feature} mFeature
   */
  getMapeaFeatureClone(mFeature) {
    // eslint-disable-next-line no-underscore-dangle
    const implFeatureClone = mFeature.getImpl().olFeature_.clone();
    const emphasis = M.impl.Feature.olFeature2Facade(implFeatureClone);
    return emphasis;
  }

  /**
   * Calculate line or polygon topographic profile
   * @public
   * @function
   * @api
   * @param {M.Feature} feature
   */
  calculateProfile(feature, show = true) {
    let coordinates = [];
    if (feature.getGeometry().type === 'MultiLineString') {
      feature.getGeometry().coordinates.forEach((path) => {
        coordinates = coordinates.concat(path);
      });
    } else if (feature.getGeometry().type === 'Polygon') {
      coordinates = [].concat(feature.getGeometry().coordinates[0]);
      coordinates.pop();
    } else if (feature.getGeometry().type === 'MultiPolygon') {
      const polygonsCoords = [].concat(...feature.getGeometry().coordinates.map((c) => c[0]));
      coordinates = polygonsCoords;
    } else {
      coordinates = [].concat(feature.getGeometry().coordinates);
    }

    let pointsCoord = '';
    for (let i = 1; i < coordinates.length; i += 1) {
      pointsCoord = pointsCoord.concat(this.findNewPoints(coordinates[i - 1], coordinates[i]));
    }

    let pointsBbox = pointsCoord.split('|');
    while (pointsBbox.length > 150) {
      pointsBbox = pointsBbox.filter((elem, i) => {
        return i % 2 === 0;
      });
    }

    const altitudes = [];
    const promises = [];
    pointsBbox = pointsBbox.filter((elem) => {
      return elem !== '' && elem.trim().length > 3;
    });

    M.proxy(false);
    pointsBbox.forEach((bbox) => {
      const url = `${PROFILE_URL}${bbox}${PROFILE_URL_SUFFIX}`;
      promises.push(M.remote.get(url));
    });

    const codeProj = this.facadeMap_.getProjection().code;

    this.arrayXZY = Promise.all(promises).then((responses) => {
      M.proxy(true);
      responses.forEach((response) => {
        let alt = 0;
        const responseText = response.text.split(NO_DATA_VALUE).join('');
        if (responseText.indexOf('dy') > -1) {
          alt = responseText.split('dy')[1].split(' ').filter((item) => {
            return item !== '';
          })[1];
        } else if (responseText.indexOf('cellsize') > -1) {
          alt = responseText.split('cellsize')[1].split(' ').filter((item) => {
            return item !== '';
          })[1];
        }

        altitudes.push(parseFloat(alt));
      });

      const arrayXZY = [];
      altitudes.forEach((data, index) => {
        const points = pointsBbox[index].split(',');
        const center = ol.extent.getCenter([parseFloat(points[0]), parseFloat(points[1]),
          parseFloat(points[2]), parseFloat(points[3]),
        ]);
        arrayXZY.push([center[0], center[1], data]);
      });

      let arrayXZY2 = arrayXZY.map((coord) => {
        return ol.proj.transform(coord, 'EPSG:4326', codeProj);
      });

      arrayXZY2 = arrayXZY2.filter((item) => {
        return item[2] > 0;
      });

      if (show) {
        this.showProfile(arrayXZY2);
      }

      return arrayXZY2;
    }).catch((err) => {
      M.proxy(true);
      // document.querySelector('.m-vectors .m-vectors-loading-container').innerHTML = '';
      M.dialog.error(getValue('exception.query_profile'), 'Error');
    });
  }

  /**
   * Calculate point altitude
   * @public
   * @function
   * @api
   * @param {M.Feature} feature
   */
  calculatePoint(feature) {
    const pointXYZ = {
      map: {
        coordinates: feature.getGeometry().coordinates,
        projection: this.facadeMap_.getProjection().code,
      },
      geographic: {
        coordinates: ol.proj.transform(
          feature.getGeometry().coordinates,
          this.facadeMap_.getProjection().code,
          WGS84,
        ),
        projection: WGS84,
      },
    };
    // Se aumenta un poco las coordenadas para que el servicio calcule bien la altura
    const bbox = `${pointXYZ.geographic.coordinates[0]},${pointXYZ.geographic.coordinates[1]},${pointXYZ.geographic.coordinates[0] + 0.00001},${pointXYZ.geographic.coordinates[1] + 0.000001}`;

    M.proxy(false);
    const url = `${PROFILE_URL}${bbox}${PROFILE_URL_SUFFIX}`;

    M.remote.get(url).then((response) => {
      M.proxy(true);
      let alt = 0;
      const responseText = response.text.split(NO_DATA_VALUE).join('');
      if (responseText.indexOf('dy') > -1) {
        alt = responseText.split('dy')[1].split(' ').filter((item) => {
          return item !== '';
        })[1];
      } else if (responseText.indexOf('cellsize') > -1) {
        alt = responseText.split('cellsize')[1].split(' ').filter((item) => {
          return item !== '';
        })[1];
      }
      pointXYZ.altitude = alt;
      this.facadeControl.showPointProfile(pointXYZ);
    }).catch((err) => {
      M.proxy(true);
      M.dialog.error(getValue('exception.query_profile'), 'Error');
    });
  }

  /**
   * Show topographic profile window
   * @public
   * @function
   * @api
   * @param {Array} coord
   */
  showProfile(coord) {
    const lineString = new ol.geom.LineString(coord);
    const feature = new ol.Feature({
      geometry: lineString,
      name: 'Line',
    });

    this.pt = new ol.Feature(new ol.geom.Point([0, 0]));
    const profil = new Profil({
      info: {
        zmin: getValue('zmin'),
        zmax: getValue('zmax'),
        altitude: getValue('altitude'),
        distance: getValue('distance'),
        ytitle: getValue('ytitle'),
        xtitle: getValue('xtitle'),
        altitudeUnits: 'm',
        distanceUnitsM: 'm',
        distanceUnitsKM: 'km',
      },
      projection: this.facadeMap_.getProjection().code,
      map: this.facadeMap_.getMapImpl(),
      title: getValue('analysisProfile'),
      pointLayer: this.source_,
      width: 400,
      height: 200,
    });

    this.facadeMap_.getMapImpl().addControl(profil);
    const drawPoint = (e) => {
      if (!this.pt) return;
      if (e.type === 'over') {
        this.pt.setGeometry(new ol.geom.Point(e.coord));
        this.pt.setStyle([new ol.style.Style({
          image: new ol.style.Circle({
            radius: 7,
            fill: new ol.style.Fill({
              color: '#ff0000',
            }),
          }),
        })]);
      } else {
        this.pt.setStyle([]);
      }
    };

    profil.setGeometry(feature);
    this.pt.setStyle([]);
    this.source_.addFeature(this.pt);
    profil.on(['over', 'out'], (e) => {
      if (e.type === 'over') profil.popup(`${e.coord[2]} m`);
      drawPoint(e);
    });

    profil.show();
    // document.querySelector('.m-vectors .m-vectors-loading-container').innerHTML = '';
  }

  /**
   * Calculate middle points
   * @public
   * @function
   * @api
   * @param {Array} originPoint point coordinates
   * @param {Array} destPoint point coordinates
   */
  findNewPoints(originPoint, destPoint) {
    const srs = this.facadeMap_.getProjection().code;
    const oriMete = ol.proj.transform(originPoint, srs, MERCATOR);
    const destMete = ol.proj.transform(destPoint, srs, MERCATOR);
    const angle = this.getAngleBetweenPoints(oriMete, destMete);
    const distance = this.getDistBetweenPoints(originPoint, destPoint);
    let addX;
    let addY;
    let res;
    let points = '';
    if (distance >= 50) {
      const distPoint = (distance / this.distance_ > this.distance_)
        ? distance / this.distance_ : this.distance_;
      for (let i = 0; i <= distance / distPoint; i += 1) {
        if (angle >= 0 && angle <= 90) {
          [addX, addY] = [1, 1];
        } else if (angle >= 90) {
          [addX, addY] = [-1, 1];
        } else if (angle <= 0 && angle >= -90) {
          [addX, addY] = [1, -1];
        } else {
          [addX, addY] = [-1, -1];
        }

        const nPA = [(Math.cos((angle * Math.PI) / 180) * (distPoint * i)) + oriMete[0],
          (Math.sin((angle * Math.PI) / 180) * (distPoint * i)) + oriMete[1],
        ];
        const nPB = [(Math.cos((angle * Math.PI) / 180) * ((distPoint * i) + addX)) + oriMete[0],
          (Math.sin((angle * Math.PI) / 180) * ((distPoint * i) + addY)) + oriMete[1],
        ];
        const coord1 = (ol.proj.transform(nPA, MERCATOR, WGS84));
        const coord2 = (ol.proj.transform(nPB, MERCATOR, WGS84));
        points += `${coord1},${coord2}|`;
      }

      res = points;
    } else {
      const distPoint = (distance / this.distance_ > this.distance_)
        ? distance / this.distance_ : this.distance_;
      if (angle >= 0 && angle <= 90) {
        [addX, addY] = [1, 1];
      } else if (angle >= 90) {
        [addX, addY] = [-1, 1];
      } else if (angle <= 0 && angle >= -90) {
        [addX, addY] = [1, -1];
      } else {
        [addX, addY] = [-1, -1];
      }

      const nPA = [(Math.cos((angle * Math.PI) / 180) * distPoint) + oriMete[0],
        (Math.sin((angle * Math.PI) / 180) * distPoint) + oriMete[1],
      ];
      const nPB = [(Math.cos((angle * Math.PI) / 180) * (distPoint + addX)) + oriMete[0],
        (Math.sin((angle * Math.PI) / 180) * (distPoint + addY)) + oriMete[1],
      ];
      const coord1 = (ol.proj.transform(nPA, MERCATOR, WGS84));
      const coord2 = (ol.proj.transform(nPB, MERCATOR, WGS84));
      res = `${coord1},${coord2}|`;
    }

    return res;
  }

  /**
   * Calculate points distance
   * @public
   * @function
   * @api
   * @param {Array} firstPoint point coordinates
   * @param {Array} secondPoint point coordinates
   */
  getDistBetweenPoints(firstPoint, secondPoint) {
    const srs = this.facadeMap_.getProjection().code;
    const line = new ol.geom.LineString([ol.proj.transform(firstPoint, srs, MERCATOR),
      ol.proj.transform(secondPoint, srs, MERCATOR),
    ]);
    return line.getLength();
  }

  /**
   * Calculate points angle
   * @public
   * @function
   * @api
   * @param {Array} firstPoint point coordinates
   * @param {Array} secondPoint point coordinates
   */
  getAngleBetweenPoints(firstPoint, secondPoint) {
    const p1 = { x: firstPoint[0], y: firstPoint[1] };
    const p2 = { x: secondPoint[0], y: secondPoint[1] };
    return (Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180) / Math.PI;
  }

  /**
   * Set feature style
   * @public
   * @function
   * @api
   * @param {String} color
   * @param {ol.Feature} olFeature
   */
  setStyle(color, olFeature) {
    if (olFeature) {
      olFeature.setStyle(this.createStyle(color));
    }
  }

  /**
   * Create ol style
   * @public
   * @function
   * @api
   * @param {String} color
   */
  createStyle(color) {
    return new ol.style.Style({
      fill: new ol.style.Fill({ color: color.replace(')', ', 0.2)') }),
      stroke: new ol.style.Stroke({ color, width: 3 }),
      image: new ol.style.Circle({
        radius: 7,
        fill: new ol.style.Fill({ color }),
      }),
    });
  }

  /**
   * Gets coordinates of current feature.
   * @public
   * @function
   * @api
   */
  getFeatureCoordinates(feature) {
    return feature.getImpl().getOLFeature().getGeometry().getCoordinates();
  }

  /**
     * Gets feature length
     * @public
     * @function
     * @api
     */
  getFeatureLength(feature) {
    return feature.getImpl().getOLFeature().getGeometry().getLength();
  }

  /**
     * Gets feature area
     * @public
     * @function
     * @api
     */
  getFeatureArea(feature) {
    return feature.getImpl().getOLFeature().getGeometry().getArea();
  }

  getGeometryLength(geometry) {
    let length = 0;
    const codeProj = this.facadeMap_.getProjection().code;
    const unitsProj = this.facadeMap_.getProjection().units;
    if (codeProj === 'EPSG:3857') {
      length = ol.sphere.getLength(geometry);
    } else if (unitsProj === 'd') {
      const coordinates = geometry.getCoordinates();
      for (let i = 0, ii = coordinates.length - 1; i < ii; i += 1) {
        length += ol.sphere.getDistance(ol.proj.transform(coordinates[i], codeProj, 'EPSG:4326'), ol.proj.transform(coordinates[i + 1], codeProj, 'EPSG:4326'));
      }
    } else {
      length = geometry.getLength();
    }

    return length;
  }

  calculate3DLength(promiseArray, flatLength, elem) {
    const $td = elem;
    promiseArray
      .then((points) => {
        let length = 0;
        for (let i = 0, ii = points.length - 1; i < ii; i += 1) {
          const geom = new ol.geom.LineString([points[i], points[i + 1]]);
          const distance = this.getGeometryLength(geom);
          const elevDiff = Math.abs(points[i][2] - points[i + 1][2]);
          length += Math.sqrt((distance * distance) + (elevDiff * elevDiff));
        }

        if (length < flatLength) {
          length = flatLength + ((flatLength - length) / 2);
        }

        let m = `${formatNumber(length / 1000, 2)}km`;
        if (length < 1000) {
          m = `${formatNumber(length, 0)}m`;
        }

        $td.innerHTML = `3D: ${m}`;
      })
      .catch((err) => {
        $td.innerHTML = '-';
        M.dialog.error(getValue('try_again'));
      });
  }

  get3DLength(id, feature) {
    const elem = document.querySelector(`${id}`);
    const flatLength = this.getFeatureLength(feature);
    this.calculateProfile(feature, false);
    this.calculate3DLength(this.arrayXZY, flatLength, elem);
  }

  getAreaGeoJSON(features) {
    const geoFormat = new M.impl.format.GeoJSON();
    const src = this.facadeMap_.getProjection().code;
    return features.map((featureFacade) => {
      const feature = featureFacade.getImpl().getOLFeature();

      const area = ol.sphere.getArea(feature.getGeometry());
      feature.getGeometry().transform(src, 'EPSG:3857');
      const featureJSON = geoFormat.writeFeatureObject(feature);
      featureJSON.properties = {
        area: {
          km: area / (10 ** 6),
          m: area,
        },
      };

      return featureJSON;
    });
  }
}
