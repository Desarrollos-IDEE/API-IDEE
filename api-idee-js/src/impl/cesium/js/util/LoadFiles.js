/**
 * @module IDEE/impl/loadFiles
 */
import GeoJSON from 'ol/format/GeoJSON';
import FacadeFeature from 'IDEE/feature/Feature';
import { isNullOrEmpty } from 'IDEE/util/Utils';
// Los lectores de formatos (KML, GPX, GML, GeoJSON) son los de OpenLayers,
// que no dependen del mapa: se reutilizan y solo cambia la conversión a
// objetos geográficos de fachada y el encuadre del mapa.
import OLLoadFiles from '../../../ol/js/util/LoadFiles';

/**
 * Proyección en la que se leen los ficheros: Cesium trabaja en grados
 * (EPSG:4979), que para los lectores de OpenLayers equivale a EPSG:4326.
 * @param {String} projection Proyección del mapa.
 * @returns {String} Proyección para los lectores.
 */
const toReaderProjection = (projection) => {
  return isNullOrEmpty(projection) || projection === 'EPSG:4979' ? 'EPSG:4326' : projection;
};

/**
 * Margen en grados para encuadrar un único punto.
 * @const
 * @type {Number}
 */
const POINT_MARGIN = 0.01;

/**
 * Extensión en grados de un conjunto de objetos geográficos de fachada.
 * @param {Array<IDEE.Feature>} features Objetos geográficos.
 * @returns {Array<Number>|null} [minLon, minLat, maxLon, maxLat] o null.
 */
const getFeaturesExtent = (features) => {
  const extent = [Infinity, Infinity, -Infinity, -Infinity];
  const visit = (coordinates) => {
    if (typeof coordinates[0] === 'number') {
      extent[0] = Math.min(extent[0], coordinates[0]);
      extent[1] = Math.min(extent[1], coordinates[1]);
      extent[2] = Math.max(extent[2], coordinates[0]);
      extent[3] = Math.max(extent[3], coordinates[1]);
    } else {
      coordinates.forEach(visit);
    }
  };
  features.forEach((feature) => {
    const geometry = feature.getGeometry();
    if (!isNullOrEmpty(geometry) && !isNullOrEmpty(geometry.coordinates)) {
      visit(geometry.coordinates);
    }
  });
  return extent[0] === Infinity ? null : extent;
};

/**
 * @classdesc
 * Funciones para la carga de ficheros en el mapa Cesium.
 *
 * @api
 */
class LoadFiles extends OLLoadFiles {
  /**
   * Proyección en la que se leen los ficheros: Cesium trabaja en grados.
   * @public
   * @function
   * @returns {String} Código de la proyección.
   */
  static getFileProjection() {
    return 'EPSG:4326';
  }

  /**
   * Centra el mapa en los objetos geográficos.
   * @public
   * @function
   * @param {Array<IDEE.Feature>} features Objetos geográficos.
   * @param {IDEE.Map} map Mapa.
   */
  static centerFeatures(features, map) {
    const extent = getFeaturesExtent(features);
    if (isNullOrEmpty(extent)) return;
    if (extent[0] === extent[2] && extent[1] === extent[3]) {
      extent[0] -= POINT_MARGIN;
      extent[1] -= POINT_MARGIN;
      extent[2] += POINT_MARGIN;
      extent[3] += POINT_MARGIN;
    }
    this.fitMapToExtent(map, extent);
  }

  /**
   * Encuadra el mapa en una extensión en grados.
   * @param {IDEE.Map} map Mapa.
   * @param {Array<Number>} extent Extensión [minLon, minLat, maxLon, maxLat].
   */
  static fitMapToExtent(map, extent) {
    map.getImpl().flyTo(extent, { duration: 0.5 });
  }

  /**
   * Los objetos geográficos de Cesium creados desde GeoJSON terminan de
   * construirse de forma asíncrona: los lectores devuelven una promesa que se
   * resuelve cuando están listos (la fachada la espera con await).
   * @param {Array<IDEE.Feature>} features Objetos geográficos.
   * @returns {Promise<Array<IDEE.Feature>>} Objetos geográficos listos.
   */
  static whenReady(features) {
    // eslint-disable-next-line no-underscore-dangle
    return Promise.all(features.map((feature) => feature.getImpl().isLoadCesiumFeature_))
      .then(() => features);
  }

  static loadGeoJSONLayer(source, projection) {
    const features = new GeoJSON()
      .readFeatures(source, { featureProjection: toReaderProjection(projection) });
    return this.whenReady(this.featuresToFacade(features));
  }

  static loadAllInGeoJSONLayer(sources, projection) {
    return Promise.all(sources.map((source) => this.loadGeoJSONLayer(source, projection)))
      .then((featureLists) => featureLists.flat());
  }

  static loadGPXLayer(source, projection) {
    return this.whenReady(super.loadGPXLayer(source, toReaderProjection(projection)));
  }

  static loadGMLLayer(source, projection) {
    return this.whenReady(super.loadGMLLayer(source, toReaderProjection(projection)));
  }

  static loadKMLLayer(source, projection, extractStyles) {
    return this.whenReady(
      super.loadKMLLayer(source, toReaderProjection(projection), extractStyles),
    );
  }

  /**
   * Convierte objetos geográficos de OpenLayers (de los lectores) en objetos
   * geográficos de fachada con implementación Cesium.
   * @public
   * @function
   * @param {Array<ol.Feature>} implFeatures Objetos geográficos leídos.
   * @returns {Array<IDEE.Feature>} Objetos geográficos de fachada.
   */
  static featuresToFacade(implFeatures) {
    const format = new GeoJSON();
    return implFeatures
      .filter((feature) => !isNullOrEmpty(feature.getGeometry()))
      .map((feature) => {
        const geojson = format.writeFeatureObject(feature);
        return new FacadeFeature(feature.getId(), geojson);
      });
  }
}

export default LoadFiles;
