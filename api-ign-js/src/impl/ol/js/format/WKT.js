/**
 * @module M/impl/format/WKT
 */
import MObject from 'M/Object';
import OLFormatWKT from 'ol/format/WKT';
import { get } from 'ol/proj';
import FeatureImpl from '../feature/Feature';
import GeoJSON from './GeoJSON';

/**
  * Opciones de la proyección.
  * @const
  * @public
  * @api
  */
const getOptsProjection = (options) => {
  const opts = {
    dataProjection: get(options.dataProjection),
    featureProjection: get(options.featureProjection),
  };
  return opts;
};

/**
  * @classdesc
  * Implementación del formateador WKT.
  *
  * @property {M.impl.format.GeoJSON} gjFormat_ Formato GeoJSON.
  * @property {ol.format.WKT} formatter_ Formato de geometría para leer y
  * escribir datos en formato WKT.
  *
  * @api
  * @extends {M.Object}
  */
class WKT extends MObject {
  /**
    * Constructor principal de la clase. Formato de los objetos geográficos para
    * leer y escribir datos en formato WKT.
    *
    * @constructor
    * @param {olx.format.WKTOptions} options Opciones del formato WKT.
    * @api
    */
  constructor(options = {}) {
    super(options);
    /**
      * Formato GeoJSON.
      * @type {M.impl.format.GeoJSON}
      * @private
      */
    this.gjFormat_ = new GeoJSON();
    /**
      * Formato de geometría para leer y escribir datos en formato WKT.
      * @type {ol.format.WKT}
      * @private
      */
    this.formatter_ = new OLFormatWKT({
      splitCollection: true,
      ...options,
    });
  }

  /**
    * Este método obtiene el formato de geometría.
    *
    * @function
    * @returns {Object|ol.format.WKT} Formateador.
    * @public
    * @api
    */
  getFormatter() {
    return this.formatter_;
  }

  /**
    * Este método obtiene un objeto geográfico del texto especificado.
    *
    * @function
    * @param {string} wkt Texto del que se obtiene el objeto geográfico.
    * @param {Object} options Opciones.
    * - dataProjection: Proyección de los datos leídos.
    * - featureProjection: Proyección de las geometrías de los objetos geográficos
    * creados por el lector de formato.
    * - extent: Extensión de la tesela en unidades de mapa de la tesela
    * leída
    * @returns {M.Feature} Objeto geográfico.
    * @public
    * @api
    */
  read(wkt, options = {}) {
    const opts = getOptsProjection(options);
    const { id } = options;
    const olFeature = this.formatter_.readFeatureFromText(wkt, opts);
    const mFeature = FeatureImpl.olFeature2Facade(olFeature);
    if (id != null) {
      mFeature.setId(id);
    }
    return mFeature;
  }

  /**
    * Este método obtiene los objetos geográficos del texto especificado
    *
    * @function
    * @param {string} wktCollection Texto del que se obtienen los objetos geográficos.
    * @param {Object} options Opciones.
    * - dataProjection: Proyección de los datos leídos.
    * - featureProjection: Proyección de las geometrías de los objetos geográficos
    * creados por el lector de formato.
    * - extent: Extensión de la tesela en unidades de mapa de la tesela
    * leída
    * @returns {Array<M.Feature>} Objetos geográficos.
    * @public
    * @api
    */
  readCollection(wktCollection, options = {}) {
    const opts = getOptsProjection(options);
    const { ids } = options;
    const olFeatures = this.formatter_.readFeaturesFromText(wktCollection, opts);
    const mFeatures = olFeatures.map((f) => FeatureImpl.olFeature2Facade(f));
    if (ids != null && ids.length === mFeatures.length) {
      mFeatures.forEach((mFeature, index) => mFeature.setId(ids[index]));
    }
    return mFeatures;
  }

  /**
    * Este método escribe un objeto geográfico en formato WKT.
    *
    * @function
    * @param {M.Feature} feature Objeto geográfico.
    * @param {Object} options Opciones.
    * - dataProjection: Proyección de los datos a escribir.
    * - featureProjection: Proyección de las geometrías del objeto geográfico
    * que serán serializadas por el escritor de formato.
    * - rightHanded: Indica si se sigue la regla de la mano derecha.
    * - decimals: Número máximo de decimales para las coordenadas.
    * @returns {string} Objeto geográfico en formato WKT.
    * @public
    * @api
    */
  write(feature, options = {}) {
    const opts = getOptsProjection(options);
    const olFeature = FeatureImpl.facade2OLFeature(feature);
    const wkt = this.formatter_.writeFeatureText(olFeature, opts);
    return wkt;
  }

  /**
    * Método auxiliar para las transformaciones y operaciones
    * geométricas que no se incorporaron en un principio en API-CNIG.
    *
    * @function
    * @param {Object} geometry Geometría que se desea transformar.
    * @returns {string} Geometría transformada en formato WKT.
    * @public
    * @api
    */
  writeFeature(geometry) {
    const olGeometry = this.gjFormat_.readGeometryFromObject(geometry);
    if (olGeometry.getType().toLowerCase() === 'point') {
      const pointCoord = olGeometry.getCoordinates();
      olGeometry.setCoordinates([pointCoord[0], pointCoord[1]]);
    }
    const wktGeom = this.formatter_.writeGeometryText(olGeometry);
    return wktGeom;
  }

  /**
    * Este método escribe los objetos geográficos en formato WKT.
    *
    * @function
    * @param {Array<M.Feature>} feature Objetos geográficos.
    * @param {Object} options Opciones.
    * - dataProjection: Proyección de los datos a escribir.
    * - featureProjection: Proyección de las geometrías del objeto geográfico
    * que serán serializadas por el escritor de formato.
    * - rightHanded: Indica si se sigue la regla de la mano derecha.
    * - decimals: Número máximo de decimales para las coordenadas.
    * @returns {string} Objetos geográficos en formato WKT
    * @public
    * @api
    */
  writeCollection(features, options = {}) {
    const opts = getOptsProjection(options);
    const olFeatures = features.map((f) => FeatureImpl.facade2OLFeature(f));
    const wkt = this.formatter_.writeFeaturesText(olFeatures, opts);
    return wkt;
  }
}

export default WKT;
