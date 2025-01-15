/**
 * @module M/impl/format/DescribeFeatureTypeXML
 */
import OLFormatGML from 'ol/format/GML';

/**
  * @classdesc
  * Implementación del formateador GML.
  *
  * @api
  * @extends {ol.format.GML}
  */
class GML extends OLFormatGML {
  /**
    * Constructor principal de la clase. Formato de los objetos geográficos para
    * leer y escribir datos en formato GML.
    *
    * @constructor
    * @param {olx.format.GMLOptions} optOptions Opciones del formato GML.
    * - featureNS: Espacio de nombres de los objetos geográficos. Si no se define, se derivará
    * de GML.
    * - featureType: Tipo del objeto geográfico a analizar. Si es necesario configurar varios
    * tipos que provienen de diferentes espacios de nombres, "featureNS" será un objeto
    * con las claves como prefijos utilizados en las entradas del array 'featureType'.
    * - srsName: Usado al escribir geometrías.
    * - surface: Escribe gml:Surface en lugar de elementos "gml:Polygon". Esto también
    * afecta a los elementos en geometrías de varias partes. Por defecto es falso.
    * - curve: Escribe "gml:Curve" en lugar de elementos "gml:LineString". Esto también
    * afecta a los elementos en geometrías de varias partes. Por defecto es falso.
    * - multiCurve: Escribe "gml:MultiCurve" en lugar de "gml:MultiLineString".
    * Por defecto es verdadero.
    * - multiSurface: Escribe "gml:multiSurface" en lugar de "gml:MultiPolygon".
    * Por defecto es verdadero.
    * - schemaLocation: 'SchemaLocation' opcional para usar al escribir el GML,
    * esto anulará el predeterminado proporcionado.
    * - hasZ: Indica si las coordenadas tienen un valor Z. Por defecto es falso.
    * @api
    */
  constructor(optOptions = {}) {
    super(optOptions);
  }
}

export default GML;
