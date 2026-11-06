/**
 * @module IDEE/impl/control/Analysiscontrol
 */

import { cloneFeature } from './featureutils';
import { getValue } from '../../../facade/js/i18n/language';

const WGS84 = 'EPSG:4326';
const MERCATOR = 'EPSG:900913';
const ELEVATION_PROCESS_URL = 'https://api-processes.idee.es/processes/getElevation/execution';
const ELEVATION_PROFILE_DISTANCE = 1000;
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

    /**
     * Topographic profile shown
     * @private
     * @type {IDEE.impl.ol.js.ext.Profil}
     */
    this.profil_ = null;
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
  }

  /**
   * Calculate line or polygon topographic profile
   * @public
   * @function
   * @api
   * @param {IDEE.Feature} feature
   * @returns {Promise<Array|undefined>} profile coordinates [x, y, altitude],
   */
  calculateProfile(feature) {
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

    const crs = this.facadeMap_.getProjection().code.split(':')[1];
    return IDEE.elevation.getProfile(coordinates, crs, { distance: ELEVATION_PROFILE_DISTANCE })
      .catch(() => {
        IDEE.toast.error(getValue('exception.query_profile'), 6000);
        return undefined;
      })
      .then((response) => {
        if (!response) {
          return undefined;
        }
        return response.map((resp) => [resp[0], resp[1], Number(parseFloat(resp[2]).toFixed(2))]);
      });
  }

  /**
   * Calculate point altitude
   * @public
   * @function
   * @api
   * @param {IDEE.Feature} feature
   * @returns {Promise<Object|undefined>} point coordinates in map and geographic
   * projections with its altitude in meters.
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

    return this
      .readAltitudeFromElevationProcess(coordinates, this.facadeMap_.getProjection().code.split(':')[1])
      .then((response) => {
        if (!response || response === NO_DATA_VALUE) {
          return undefined;
        }
        pointXYZ.altitude = parseFloat(response);
        return pointXYZ;
      });
  }

  /**
   * Show topographic profile window, replacing the shown one
   * @public
   * @function
   * @api
   * @param {Array} coord
   * @param {Array<String>|String} graphs
   */
  showProfile(coord, graphs) {
    this.closeProfile();
    const lineString = new ol.geom.LineString(coord);
    const feature = new ol.Feature({
      geometry: lineString,
      name: 'Line',
    });

    const profil = new IDEE.impl.ol.js.ext.Profil({
      graphs,
      title: getValue('analysisProfile'),
      pointLayer: this.source_,
      width: 400,
      height: 200,
      controlClassName: 'ol-control-vector',
      downloadClassName: 'vectorsmanagement-icon-descargar',
      draggable: true,
      centered: true,
      chart: {
        margin: {
          top: 25, left: 55, bottom: 45, right: 25,
        },
        fontSize: 12,
        titleFontSize: 14,
        lineWidth: 5,
      },
    });

    this.facadeMap_.getMapImpl().addControl(profil);
    profil.setGeometry(feature);
    profil.show();
    this.profil_ = profil;
    // document.querySelector('.m-vectors .m-vectors-loading-container').innerHTML = '';
  }

  /**
   * Closes the topographic profile window, if any
   * @public
   * @function
   * @api
   */
  closeProfile() {
    if (this.profil_) {
      this.profil_.close();
      this.profil_ = null;
    }
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
    const codeProj = this.facadeMap_.getProjection().code;
    const geometry = feature.getImpl().getFeature().getGeometry();
    return ol.sphere.getArea(geometry, { projection: codeProj });
  }

  getGeometryLength(geometry) {
    let length = 0;
    const codeProj = this.facadeMap_.getProjection().code;
    const unitsProj = this.facadeMap_.getProjection().units;
    if (codeProj === 'EPSG:3857') {
      length = ol.sphere.getLength(geometry);
    } else if (['d', 'degrees'].includes(unitsProj)) {
      const coordinates = geometry.getCoordinates();
      for (let i = 0; i < coordinates.length - 1; i += 1) {
        length += ol.sphere.getDistance(ol.proj.transform(coordinates[i], codeProj, 'EPSG:4326'), ol.proj.transform(coordinates[i + 1], codeProj, 'EPSG:4326'));
      }
    } else {
      length = geometry.getLength();
    }

    return length;
  }

  /**
   * Calculates the 3D length of a topographic profile
   * @public
   * @function
   * @api
   * @param {Array} points profile coordinates [x, y, altitude]
   * @returns {Number} length in meters
   */
  get3DLength(points) {
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

    return length;
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

  getAreaGeoJSON(features) {
    const geoFormat = new IDEE.impl.format.GeoJSON();
    const src = this.facadeMap_.getProjection().code;
    return features.map((featureFacade) => {
      const feature = featureFacade.getImpl().getFeature();

      const area = ol.sphere.getArea(feature.getGeometry(), { projection: src });
      feature.getGeometry().transform(src, 'EPSG:3857');
      const featureJSON = geoFormat.writeFeatureObject(feature);
      featureJSON.properties = {
        area: {
          km2: area / (10 ** 6),
          m2: area,
        },
      };

      return featureJSON;
    });
  }

  /**
   * Creates a buffer feature of a feature.
   * @public
   * @function
   * @api
   * @param {IDEE.Feature} feature
   * @param {Number} distance buffer distance in meters
   * @param {*} parentId identifier of the layer of the feature
   * @returns {IDEE.Feature} buffer feature
   */
  createBufferFeature(feature, distance, parentId) {
    const projection = this.facadeMap_.getProjection().code;
    const olFeature = cloneFeature(feature).getImpl().getFeature();
    this.setStyle('rgba(113, 167, 211)', olFeature);
    const format = new ol.format.GeoJSON();
    olFeature.getGeometry().transform(projection, 'EPSG:4326');
    const turfGeom = format.writeFeatureObject(olFeature);
    const buffered = turf.buffer(turfGeom, parseInt(distance, 10), { units: 'meters' });
    olFeature.setGeometry(format.readFeature(buffered).getGeometry().transform('EPSG:4326', projection));
    olFeature.set('parentID', parentId);
    return IDEE.impl.Feature.feature2Facade(olFeature);
  }

  /**
   * Gets the identifier of a layer
   * @public
   * @function
   * @api
   * @param {IDEE.layer.Vector} layer
   * @returns {*} layer identifier
   */
  getLayerId(layer) {
    return layer.getImpl().getLayer().ol_uid;
  }

  /**
   * Gets the identifier of the layer a buffer feature was created from
   * @public
   * @function
   * @api
   * @param {IDEE.Feature} feature buffer feature
   * @returns {*} layer identifier
   */
  getParentId(feature) {
    return feature.getImpl().getFeature().get('parentID');
  }

  /**
   * Gets the description of a supported projection
   * @public
   * @function
   * @api
   * @param {String} code projection code
   * @returns {Object} projection description (codes, units, datum, proj)
   */
  getProjectionInfo(code) {
    return IDEE.impl.ol.js.projections.getSupportedProjs()
      .filter((p) => p.codes.includes(code))[0];
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
