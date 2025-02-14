/**
 * @module M/impl/layer/Draw
 */
import Exception from 'M/exception/exception';
import { isArray, isNullOrEmpty, isFunction } from 'M/util/Utils';
import * as EventType from 'M/event/eventtype';
import OLLayerVector from 'ol/layer/Vector';
import OLSourceVector from 'ol/source/Vector';
import OLStyle from 'ol/style/Style';
import OLStyleFill from 'ol/style/Fill';
import OLStyleStroke from 'ol/style/Stroke';
import OLStyleCircle from 'ol/style/Circle';
import OLGeomPoint from 'ol/geom/Point';
import { getValue } from 'M/i18n/language';
import { get as getProj } from 'ol/proj';
import Layer from './Layer';
import FormatGeoJSON from '../format/GeoJSON';
import Map from '../Map';

/**
 * @classdesc
 * La capa se utiliza para la representación de entidades.
 *
 * @api
 * @extends {M.impl.layer.Layer}
 */
class Draw extends Layer {
  /**
   *  Constructor principal de la clase
   *
   * @constructor
   * @implements {M.impl.Layer}
   * @api stable
   */
  constructor() {
    super();

    /**
     * Draw geojsonFormatter_. Coordenada de entidad dibujada actualmente.
     */
    this.geojsonFormatter_ = new FormatGeoJSON();

    /**
     * Draw name. Nombre de la capa.
     */
    this.name = 'drawLayer';

    /**
     * Draw selectedFeatures_. Entidades seleccionadas para esta capa.
     */
    this.selectedFeatures_ = [];

    // calls the super constructor
  }

  /**
   * Este método incluye la capa al mapa.
   *
   * @public
   * @function
   * @param {M.impl.Map} map  Implementación del mapa.
   * @api stable
   */
  addTo(map) {
    this.map = map;
    this.fire(EventType.ADDED_TO_MAP);

    this.ol3Layer = new OLLayerVector({
      source: new OLSourceVector({}),
      style: new OLStyle({
        fill: new OLStyleFill({
          color: 'rgba(0, 158, 0, 0.1)',
        }),
        stroke: new OLStyleStroke({
          color: '#fcfcfc',
          width: 2,
        }),
        image: new OLStyleCircle({
          radius: 7,
          fill: new OLStyleFill({
            color: '#009E00',
          }),
          stroke: new OLStyleStroke({
            color: '#fcfcfc',
            width: 2,
          }),
        }),
      }),
      zIndex: Map.Z_INDEX.WFS + 999,
    });
    // sets its visibility if it is in range
    if (this.options.visibility !== false) {
      this.setVisible(this.inRange());
    }
    const olMap = this.map.getMapImpl();
    olMap.addLayer(this.ol3Layer);
  }

  /**
   * Este método se ejecuta al seleccionar un objeto geográfico.
   * @public
   * @function
   * @param {ol.Feature} feature Objetos geográficos de Openlayers.
   * @api stable
   */
  selectFeatures(features) {
    this.selectedFeatures_ = features;

    // TODO: manage multiples features
    if (isFunction(this.selectedFeatures_[0].click)) {
      this.selectedFeatures_[0].click();
    }
  }

  /**
   * Evento que se produce cuando se deja de hacer clic sobre
   * un objeto geográfico.
   *
   * @public
   * @function
   * @param {ol.Feature} feature Objetos geográficos de Openlayers.
   * @api stable
   */
  unselectFeatures() {
    if (this.selectedFeatures_.length > 0) {
      this.selectedFeatures_.length = 0;
      this.map.removePopup();
    }
  }

  /**
   * Dibuja un punto.
   *
   * @public
   * @function
   * @param {Object} pointsParam Parámetros del punto.
   * @api stable
   */
  drawPoints(pointsParam) {
    // checks if the param is null or empty
    let points = pointsParam;
    if (isNullOrEmpty(points)) {
      Exception(getValue('exception').no_point);
    }
    if (!isArray(points)) {
      points = [points];
    }
    const geojsons = this.pointsToGeoJSON_(points);
    this.drawGeoJSON(geojsons);
  }

  /**
   * Dibuja un GeoJSON.
   *
   * @public
   * @function
   * @param {Object} geojsonsParam Parámetros del GeoJSON.
   * @api stable
   */
  drawGeoJSON(geojsonsParam) {
    let geojsons = geojsonsParam;
    // checks if the param is null or empty
    if (isNullOrEmpty(geojsons)) {
      Exception(getValue('exception').no_geojson);
    }
    if (!isArray(geojsons)) {
      geojsons = [geojsons];
    }

    // gets the projection
    const projection = getProj(this.map.getProjection().code);

    let features = [];
    geojsons.forEach((geojson) => {
      const formattedFeatures = this.geojsonFormatter_.readFeatures(geojson, {
        dataProjection: projection,
      });
      features = features.concat(formattedFeatures);
    });

    this.ol3Layer.getSource().addFeatures(features);
  }

  /**
   * Dibuja los objetos geográficos.
   *
   * @public
   * @function
   * @param {Object} featuresParam Parámetros de los objetos geográficos.
   * @api stable
   */
  drawFeatures(featuresParam) {
    let features = featuresParam;
    // checks if the param is null or empty
    if (!isNullOrEmpty(features)) {
      if (!isArray(features)) {
        features = [features];
      }
      this.ol3Layer.getSource().addFeatures(features);
    }
  }

  /**
   * Elimina los objetos geográficos.
   *
   * @public
   * @function
   * @param {Object} featuresParam Parámetros de los objetos geográficos.
   * @api stable
   */
  removeFeatures(featuresParam) {
    let features = featuresParam;
    // checks if the param is null or empty
    if (!isNullOrEmpty(features)) {
      if (!isArray(features)) {
        features = [features];
      }
      const olSource = this.ol3Layer.getSource();

      features.forEach((feature) => {
        // try { // Eslint no-useless-catch fix
        olSource.removeFeature(feature);
        // } catch (err) { throw err; /* the feature does not exist in the source */}
      });
    }
  }

  /**
   * Devuelve los puntos de los objetos geográficos.
   *
   * @public
   * @function
   * @param {ol.Coordinate} coordinate Coordenadas.
   * @return {features} Devuelve los puntos de los objetos geográficos.
   * @api stable
   */
  getPoints(coordinate) {
    let features = [];
    const drawSource = this.ol3Layer.getSource();

    if (!isNullOrEmpty(coordinate)) {
      features = drawSource.getFeaturesAtCoordinate(coordinate);
    } else {
      features = drawSource.getFeatures();
    }

    return this.featuresToPoints_(features);
  }

  /**
   * Esta función destruye esta capa, limpiando el HTML
   * y anulando el registro de todos los eventos.
   *
   * @public
   * @function
   * @api stable
   */
  destroy() {
    const olMap = this.map.getMapImpl();

    if (!isNullOrEmpty(this.ol3Layer)) {
      olMap.removeLayer(this.ol3Layer);
      this.ol3Layer = null;
    }
    this.options = null;
    this.map = null;
  }

  /**
   * Esta función comprueba si un objeto es igual
   * a esta capa.
   *
   * @function
   * @param {Object} obj Objeto a comparar.
   * @returns {Boolean} Verdadero es igual, falso si no.
   * @api stable
   */
  equals(obj) {
    let equals = false;

    if (obj instanceof Draw) {
      equals = equals && (this.name === obj.name);
    }
    return equals;
  }

  /**
   * Transforma los puntos a GeoJSON.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   *
   * @public
   * @function
   * @param {Array<Point>} points Punto que se transforman a GeoJSON.
   * @return {Array<GeoJSON>} Devuelve los puntos en formato GeoJSON.
   * @api stable
   */
  pointsToGeoJSON_(points) {
    let geojsons = [];

    // gets the projection
    const projection = getProj(this.map.getProjection().code);

    geojsons = points.map((point) => {
      // properties
      const geojsonProperties = point.data;

      // geometry
      const pointGeom = new OLGeomPoint([point.x, point.y]);
      const geojsonGeom = this.geojsonFormatter_.writeGeometryObject(pointGeom, {
        dataProjection: projection,
      });

      // return geojson
      return {
        type: 'Feature',
        geometry: geojsonGeom,
        properties: geojsonProperties,
        click: point.click,
        showPopup: point.showPopup,
      };
    });

    return geojsons;
  }

  /**
   * Transformar Objetos geográficos a puntos.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   *
   * @public
   * @function
   * @param {Array<Point>} points Puntos que se transformaran en objetos geográficos.
   * @return {Array<Feature>} Devuelve los objetos geográficos en formato GeoJSON.
   * @api stable
   */
  featuresToPoints_(points) {
    const features = [];

    return features;
  }
}

export default Draw;
