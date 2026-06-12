/**
 * @module IDEE/impl/format/DescribeFeatureTypeXML
 */
import OLFormatGML from 'ol/format/GML';
import * as Dialog from 'IDEE/dialog';
import { isNullOrEmpty } from 'IDEE/util/Utils';
import XML from '../XML';

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

    /**
     * XML handler
     * @public
     * @type {IDEE.impl.format.XML}
     */
    this.xmlHandler = new XML(optOptions);
    this.xmlHandler.readRoot = this.readRoot;
    this.xmlHandler.readogcServiceException = this.readogcServiceException;
    this.xmlHandler.readxsdschema = this.readxsdschema;
    this.xmlHandler.readxsdimport = this.readxsdimport;
    this.xmlHandler.readxsdcomplexType = this.readxsdcomplexType;
    this.xmlHandler.readxsdcomplexContent = this.readxsdcomplexContent;
    this.xmlHandler.readxsdextension = this.readxsdextension;
    this.xmlHandler.readxsdsequence = this.readxsdsequence;
    this.xmlHandler.readxsdelement = this.readxsdelement;

    /**
     * FeatureType index
     * @private
     * @type {number}
     */
    this.featureTypeIdx_ = 0;

    /**
     * flag to indicate if a FeatureType is being read
     * @private
     * @type {boolean}
     */
    this.readingFeatureType = false;

    /**
     * flag to indicate if service responded with
     * an exception
     * @private
     * @type {boolean}
     */
    this.serviceException_ = false;
  }

  /**
    * Este método obtiene un objeto basado en el XML dado.
    *
    * @function
    * @param {String | Document} data XML.
    * @returns {Object} Objeto basado en los elementos y
    * atributos del XML.
    * @public
    * @api
    */
  read(data) {
    return this.xmlHandler.read(data);
  }

  /**
    * Procesa el nodo raíz del esquema o del informe de excepción y
    * prepara el contexto inicial para el parseo de tipos.
    *
    * @ppublic
    * @function
    * @param {Object} context Contexto de parseo mutable usado por el manejador XML.
    * @param {Document} node Documento XML completo recibido.
    * @api
    */
  readRoot(context, node) {
    const root = node.documentElement;

    if (/ServiceExceptionReport/i.test(root.localName)) {
      this.serviceException_ = true;
    } else {
      this.rootPrefix = root.prefix;
      const contextVar = context;
      contextVar.elementFormDefault = root.getAttribute('elementFormDefault');
      contextVar.targetNamespace = root.getAttribute('targetNamespace');
      contextVar.targetPrefix = root.getAttribute('targetPrefix');
      contextVar.featureTypes = [];
    }
    this.runChildNodes(context, root);
  }

  /**
    * Este método itera e invoca la función "read" sobre los
    * nodos hijos del elemento especificado.
    *
    * @function
    * @param {Object} obj Objeto de contexto a rellenar durante el recorrido.
    * @param {Element} node Nodo cuyo arbol de hijos se recorre.
    * @public
    * @api
    */
  runChildNodes(obj, node) {
    this.xmlHandler.runChildNodes(obj, node);
  }

  /**
    * Obtiene el prefijo del espacio de nombres para un
    * uri determinado del objeto "namespaces".
    *
    * @function
    * @param {String} uri URI del objeto "namespaces".
    * @return {String} Un prefijo de espacio de nombres o nulo si
    * no se encuentra ninguno.
    * @public
    * @api
    */
  getNamespacePrefix(uri) {
    return this.xmlHandler.getNamespacePrefix(uri);
  }

  /**
    * Obtiene el valor del nodo de tipo  sección CDATA
    * junto al prefijo especificado. Si no encuentra una
    *  sección CDATA devuelve el prefijo especificado.
    *
    * @function
    * @param {Element} node Nodo de tipo sección CDATA.
    * @param {String} def Prefijo por defecto si no se encuentra el valor.
    * @return {String} Valor del nodo de tipo sección CDATA.
    * @public
    * @api
    */
  static getChildValue(node, def) {
    return this.xmlHandler.getChildValue(node, def);
  }

  /**
    * Obtiene un valor de atributo dado el URI del espacio de nombres y
    * el nombre local.
    *
    * @function
    * @param {Element} node Nodo en el que buscar un atributo.
    * @param {String} uri URI de espacio de nombres.
    * @param {String} name Nombre local del atributo (sin el prefijo).
    * @return {String} Un valor de atributo o una cadena vacía si no
    * se encuentra ninguno.
    * @public
    * @api
    */
  getAttributeNS(node, uri, name) {
    return this.xmlHandler.getAttributeNS(node, uri, name);
  }

  /**
    * Notifica un error cuando el servicio DescribeFeatureType devuelve una excepción.
    *
    * @private
    * @function
    * @param {Object} context Contexto de parseo (no se modifica).
    * @param {Document} node Nodo que contiene el mensaje de error.
    * @api
    */
  readogcServiceException(context, node) {
    Dialog.error(`Error en el DescribeFeatureType: ${node.textContent.trim()} `);
  }

  /**
    * Procesa el elemento principal xsd:schema y continúa con sus hijos.
    *
    * @private
    * @function
    * @param {Object} context Contexto de parseo.
    * @param {Document} node Nodo xsd:schema.
    * @api
    */
  readxsdschema(context, node) {
    this.runChildNodes(context, node);
  }

  /**
   * Maneja un nodo xsd:import. Actualmente no requiere procesamiento adicional.
   *
   * @private
   * @function
   * @param {Object} context Contexto de parseo.
   * @param {Document} node Nodo xsd:import.
   * @return {void}
   * @api
   */
  readxsdimport(context, node) {
    // none
  }

  /**
   * Inicia la definición de un tipo complejo, marcando que se está leyendo un FeatureType.
   *
   * @private
   * @function
   * @param {Object} context Contexto donde se acumulan los FeatureTypes.
   * @param {Document} node Nodo xsd:complexType.
   * @return {void}
   * @api
   */
  readxsdcomplexType(context, node) {
    this.readingFeatureType = true;
    context.featureTypes.push({
      properties: [],
    });
    this.runChildNodes(context, node);
    this.readingFeatureType = false;
  }

  /**
    * Procesa el contenido complejo de un tipo, sin modificar el contexto directamente.
    *
    * @private
    * @function
    * @param {Object} context Contexto de parseo.
    * @param {Document} node Nodo xsd:complexContent.
    * @api
    */
  readxsdcomplexContent(context, node) {
    this.runChildNodes(context, node);
  }

  /**
    * Procesa una extensión de tipo dentro de un xsd:complexContent.
    *
    * @private
    * @function
    * @param {Object} context Contexto de parseo.
    * @param {Document} node Nodo xsd:extension.
    * @api
    */
  readxsdextension(context, node) {
    this.runChildNodes(context, node);
  }

  /**
    * Procesa la secuencia de elementos de un tipo complejo.
    *
    * @private
    * @function
    * @param {Object} context Contexto de parseo.
    * @param {Document} node Nodo xsd:sequence.
    * @api
    */
  readxsdsequence(context, node) {
    this.runChildNodes(context, node);
  }

  /**
    * Procesa cada elemento de la secuencia, diferenciando entre la definición del
    * tipo y las propiedades de cada FeatureType.
    *
    * @private
    * @function
    * @param {Object} context Contexto con la colección de FeatureTypes.
    * @param {Document} node Nodo xsd:element que define un atributo o el nombre del tipo.
    * @api
    */
  readxsdelement(context, node) {
    if (isNullOrEmpty(this.featureTypeIdx_)) {
      this.featureTypeIdx_ = 0;
    }
    if (this.readingFeatureType === true) {
      context.featureTypes[this.featureTypeIdx_].properties.push({
        name: node.getAttribute('name'),
        maxOccurs: node.getAttribute('maxOccurs'),
        minOccurs: node.getAttribute('minOccurs'),
        nillable: node.getAttribute('nillable'),
        type: node.getAttribute('type'),
        localType: node.getAttribute('type').replace(/^\w+:/g, ''),
      });
    } else {
      const contextVar = context;
      contextVar.featureTypes[this.featureTypeIdx_].typeName = node.getAttribute('name');
      this.featureTypeIdx_ += 1;
    }
  }
}

export default GML;
