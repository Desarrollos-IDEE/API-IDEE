/**
 * @module M/impl/format/DescribeFeatureType
 */
import { isGeometryType } from 'M/util/Utils';

/**
  * @classdesc
  * Crea una capa WFS con parámetros especificados por el usuario.
  *
  * @property {String} typeName_ Nombre del "FeatureType".
  * @property {String} outputFormat_ Formato de salida.
  * @property {M.Projection} projection_ Proyección.
  *
  * @api
  */
class DescribeFeatureType {
  /**
    * @classdesc
    * Constructor principal de la clase. Crea una capa WFS con parámetros
    * especificados por el usuario.
    *
    * @constructor
    * @param {String} typeName Nombre del "FeatureType".
    * @param {String} outputFormat Formato de salida.
    * @param {M.Projection} projection Proyección.
    * @api
    */
  constructor(typeName, outputFormat, projection) {
    /**
      * Nombre del "FeatureType".
      * @private
      * @type {String}
      */
    this.typeName_ = typeName;

    /**
      * Formato de salida.
      * @private
      * @type {String}
      */
    this.outputFormat_ = outputFormat;

    /**
      * Proyección.
      * @private
      * @type {M.Projection}
      */
    this.projection_ = projection;
  }

  /**
    * Este método obtiene el 'FeatureType' que coincida
    * con los parámetros especificados.
    *
    * @function
    * @param {Object} response Respuesta a la solicitud "DescribeFeatureType".
    * @returns {Object} "FeatureType".
    * @public
    * @api
    */
  read(response) {
    const describeFeatureType = {};

    let describeFeatureTypeResponse;
    if (/json/gi.test(this.outputFormat_)) {
      // eslint-disable-next-line no-useless-catch
      try {
        describeFeatureTypeResponse = JSON.parse(response.text);
      } catch (err) {
        throw err;
      }
    }

    if (!describeFeatureTypeResponse) {
      describeFeatureTypeResponse = this.gmlFormatter_.read(response.text);
    }

    describeFeatureType.featureNS = describeFeatureTypeResponse.targetNamespace;
    describeFeatureType.featurePrefix = describeFeatureTypeResponse.targetPrefix;

    describeFeatureTypeResponse.featureTypes.some((featureType) => {
      if (featureType.typeName === this.typeName_) {
        describeFeatureType.properties = featureType.properties;
        describeFeatureType.properties.some((prop) => {
          if (isGeometryType(prop.localType)) {
            describeFeatureType.geometryName = prop.name;
          }
          return isGeometryType(prop.localType);
        });
      }
      return featureType.typeName === this.typeName_;
    });
    return describeFeatureType;
  }
}

export default DescribeFeatureType;
