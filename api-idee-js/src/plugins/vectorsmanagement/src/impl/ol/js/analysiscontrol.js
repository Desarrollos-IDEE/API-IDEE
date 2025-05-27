/**
 * @module IDEE/impl/control/Analysiscontrol
 */

import Profil from './profilcontrol';
import { getValue } from '../../../facade/js/i18n/language';

const WGS84 = 'EPSG:4326';
const MERCATOR = 'EPSG:900913';
const ELEVATION_PROCESS_URL = 'https://api-processes.idee.es/processes/getElevation/execution';
const ELEVATION_PROFILE_PROCESS_URL = 'https://api-processes.idee.es/processes/elevationProfile/execution';
const NO_DATA_VALUE = -9999;
const { measurements } = require('../../../../../../geoprocesses');

export default class Analysiscontrol extends IDEE.impl.Control {
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
      * @type {IDEE.Map}
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

    this.arrayXYZ = null;
  }

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
    super.addTo(map, html);

    /**
     * Facade map
     * @private
     * @type {IDEE.map}
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
   * @param {IDEE.Feature} mFeature
   */
  getApiIdeeFeatureClone(mFeature) {
    // eslint-disable-next-line no-underscore-dangle
    const implFeatureClone = mFeature.getImpl().olFeature_.clone();
    const emphasis = IDEE.impl.Feature.feature2Facade(implFeatureClone);
    return emphasis;
  }

  /**
   * Calculate line or polygon topographic profile
   * @public
   * @function
   * @api
   * @param {IDEE.Feature} feature
   */
  calculateProfile(id, feature, show = true) {
    const altitudes = [];
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

    let altitudeFromElevationProfileProcess;
    const promesa = new Promise((success) => {
      altitudeFromElevationProfileProcess = this
        .readAltitudeFromElevationProfileProcess(coordinates, this.facadeMap_.getProjection().code.split(':')[1]);
      success(altitudeFromElevationProfileProcess);
    });

    // IDEE.proxy(false);
    promesa.then((response) => {
      // IDEE.proxy(true);
      document.querySelector('#vectorsmanagement-analysis-btn').style.display = 'block';
      document.querySelector('#vectorsmanagement-analysis-div').innerHTML = '';
      document.querySelector('#vectorsmanagement-analysis-div').style.height = '0';

      if (response && response !== NO_DATA_VALUE) {
        response.forEach((resp) => {
          altitudes.push([resp[0], resp[1], Number(parseFloat(resp[2]).toFixed(2))]);
        });
        if (show) {
          this.showProfile(altitudes);
        }
        this.arrayXYZ = altitudes;
        this.calculate3DLength(id);
      }
    }).catch(() => {
      console.warning('Error reading elevation profile'); // eslint-disable-line no-console
      // IDEE.proxy(true)
    });
  }

  /**
   * Calculate point altitude
   * @public
   * @function
   * @api
   * @param {IDEE.Feature} feature
   */
  calculatePoint(feature) {
    const coordinates = feature.getGeometry().coordinates;

    const pointXYZ = {
      map: {
        coordinates,
        projection: this.facadeMap_.getProjection().code,
      },
      geographic: {
        coordinates: ol.proj.transform(
          coordinates,
          this.facadeMap_.getProjection().code,
          WGS84,
        ),
        projection: WGS84,
      },
    };

    let altitudeFromElevationProcess;
    const promesa = new Promise((success) => {
      altitudeFromElevationProcess = this
        .readAltitudeFromElevationProcess(coordinates, this.facadeMap_.getProjection().code.split(':')[1]);
      success(altitudeFromElevationProcess);
    });

    // IDEE.proxy(false);
    promesa.then((response) => {
      // IDEE.proxy(true);
      document.querySelector('#vectorsmanagement-analysis-btn').style.display = 'block';
      document.querySelector('#vectorsmanagement-analysis-div').innerHTML = '';
      document.querySelector('#vectorsmanagement-analysis-div').style.height = '0';
      if (response && response !== NO_DATA_VALUE) {
        altitudeFromElevationProcess = parseFloat(response).toFixed(2).replace('.', ',');
        pointXYZ.altitude = altitudeFromElevationProcess;
        this.facadeControl.showPointProfile(pointXYZ);
      }
    }).catch(() => {
      console.warning('Error reading elevation profile'); // eslint-disable-line no-console
      // IDEE.proxy(true)
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
        distance: getValue('distanceT'),
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
    return feature.getImpl().getFeature().getGeometry().getCoordinates();
  }

  /**
     * Gets feature length
     * @public
     * @function
     * @api
     */
  getFeatureLength(feature) {
    return feature.getImpl().getFeature().getGeometry().getLength();
  }

  /**
     * Gets feature area
     * @public
     * @function
     * @api
     */
  getFeatureArea(feature) {
    return feature.getImpl().getFeature().getGeometry().getArea();
  }

  getGeometryLength(geometry) {
    let length = 0;
    const codeProj = this.facadeMap_.getProjection().code;
    const unitsProj = this.facadeMap_.getProjection().units;
    if (codeProj === 'EPSG:3857') {
      length = ol.sphere.getLength(geometry);
    } else if (unitsProj === 'd') {
      const coordinates = geometry.getCoordinates();
      for (let i = 0; i < coordinates.length - 1; i += 1) {
        length += ol.sphere.getDistance(ol.proj.transform(coordinates[i], codeProj, 'EPSG:4326'), ol.proj.transform(coordinates[i + 1], codeProj, 'EPSG:4326'));
      }
    } else {
      length = geometry.getLength();
    }

    return length;
  }

  calculate3DLength(elem) {
    const $td = elem;
    const points = this.arrayXYZ;
    let length = 0;
    for (let i = 0; i < points.length - 1; i += 1) {
      const a = points[i];
      const b = points[i + 1];

      if (a.toString() !== b.toString()) {
        const aWGS84 = ol.proj.transform(a, this.facadeMap_.getProjection().code, WGS84);
        const bWGS84 = ol.proj.transform(b, this.facadeMap_.getProjection().code, WGS84);

        const distance = measurements.calculateDistance(aWGS84[1], aWGS84[0], bWGS84[1], bWGS84[0]);
        const elevDiff = Math.abs(points[i][2] - points[i + 1][2]);

        length += Math.sqrt((distance * distance) + (elevDiff * elevDiff));
      }
    }

    let m = `${((length / 1000).toFixed(2)).replace('.', ',')} km`;
    if (length < 1000) {
      m = `${((length).toFixed(2)).replace('.', ',')} m`;
    }

    $td.innerHTML = `${m}`;
  }

  calculateFeatureLengthEllipsoidal(feature) {
    let length = 0;
    const coordinates = feature.getImpl().getOLFeature().getGeometry().getCoordinates();

    for (let i = 0; i < coordinates.length - 1; i += 1) {
      const a = coordinates[i];
      const b = coordinates[i + 1];

      if (a.toString() !== b.toString()) {
        const aWGS84 = ol.proj.transform(a, this.facadeMap_.getProjection().code, WGS84);
        const bWGS84 = ol.proj.transform(b, this.facadeMap_.getProjection().code, WGS84);

        length += measurements.calculateDistance(aWGS84[1], aWGS84[0], bWGS84[1], bWGS84[0]);
      }
    }

    return length;
  }

  get3DLength(id, feature) {
    this.calculateProfile(id, feature, false);
  }

  getAreaGeoJSON(features) {
    const geoFormat = new IDEE.impl.format.GeoJSON();
    const src = this.facadeMap_.getProjection().code;
    return features.map((featureFacade) => {
      const feature = featureFacade.getImpl().getFeature();

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

  readAltitudeFromElevationProfileProcess(coordinates, srcMapa) {
    let features = '';
    coordinates.forEach((element) => {
      features += `,{"geometry": { "type": "Point", "coordinates": [${element[0]},${element[1]}] } }`;
    });
    features = features.substring(1);
    return new Promise((resolve) => {
      fetch(ELEVATION_PROFILE_PROCESS_URL, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          'inputs': {
            'crs': parseInt(srcMapa, 10),
            'distance': 1000,
            'geom': `{ "type": "FeatureCollection", "features": [${features}] }`,
            'withCoord': true,
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
            resolve(response.values);
          }
        })
        .catch(() => {
          IDEE.toast.error(getValue('exception.query_profile'), 6000);
          resolve(undefined);
        });
    });
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
}
