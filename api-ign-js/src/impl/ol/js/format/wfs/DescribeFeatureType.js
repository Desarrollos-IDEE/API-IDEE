/**
 * @module M/impl/format/DescribeFeatureType
 */
import { isGeometryType } from 'M/util/Utils';
import DescribeFeatureTypeXML from './DescribeFeatureTypeXML';

/**
  * @classdesc
  * Crea una capa WFS con parámetros especificados por el usuario.
  *
  * @property {String} typeName_ Nombre del "FeatureType".
  * @property {String} outputFormat_ Formato de salida.
  * @property {M.Projection} projection_ Proyección.
  * @property {ol.format.GML2 | ol.format.GML3} gmlFormatter_ Formateador GML.
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

    /**
      * Formateador GML.
      * @private
      * @type {ol.format.GML2 | ol.format.GML3}
      */
    this.gmlFormatter_ = new DescribeFeatureTypeXML({
      outputFormat,
      featureType: typeName,
      srsName: this.projection_.code,
    });
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
      describeFeatureTypeResponse = JSON.parse(response.text);
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
            return true;
          }
          return false;
        });
        return true;
      }
      return false;
    });
    return describeFeatureType;
  }
}

export default DescribeFeatureType;
