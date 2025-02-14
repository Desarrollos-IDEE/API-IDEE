/**
 * @module M/impl/format/XML
 */
import { parse as olXMLParse } from 'ol/xml';
import { isString } from 'M/util/Utils';
import Exception from 'M/exception/exception';
import { getValue } from 'M/i18n/language';

/**
  * @classdesc
  * Implementación de la clase XML. Crea un formateador XML.
  *
  * @property {string} rootPrefix Prefijo en el nodo raíz que se asigna al
  * URI del espacio de nombres del contexto.
  * @property {Object} namespaces Mapeo de los alias de los espacios de
  * nombres a sus URIs.
  * @property {Mx.parameters.LayerOptions} options Opciones personalizadas para
  * este formateador.
  *
  * @api
  */
class XML {
  /**
    * Constructor principal de la clase. Crea un formateador XML.
    *
    * @constructor
    * @param {Mx.parameters.LayerOptions} options Opciones para este formateador.
    * @api
    */
  constructor(options = {}) {
    // super();
    /**
      * Prefijo en el nodo raíz que se asigna al
      * URI del espacio de nombres del contexto.
      * @public
      * @type {string}
      */
    this.rootPrefix = null;

    /**
      * Mapeo de los alias de los espacios de
      * nombres a sus URIs.
      * @public
      * @type {Object}
      */
    this.namespaces = {
      ol: 'http://openlayers.org/context',
      wmc: 'http://www.opengis.net/context',
      sld: 'http://www.opengis.net/sld',
      xlink: 'http://www.w3.org/1999/xlink',
      xsi: 'http://www.w3.org/2001/XMLSchema-instance',
      xsd: 'http://www.w3.org/2001/XMLSchema',
      ogc: 'http://www.opengis.net/ogc',
    };

    /**
      * Opciones personalizadas para este formateador.
      * @public
      * @type {Mx.parameters.LayerOptions}
      */
    this.options = options;
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
    let dataVariable = data;
    if (isString(data)) {
      dataVariable = olXMLParse(data);
    }

    if (dataVariable.nodeType !== 9) {
      Exception(getValue('exception').must_be_document);
    }

    const context = {};
    this.readRoot(context, dataVariable);
    return context;
  }

  /**
    * Este método lee el elemento raíz del esquema XML.
    *
    * @function
    * @param {Object} context Objeto.
    * @param {Element} node Nodo.
    * @public
    * @api
    */
  readRoot(context, node) {
    const contextVariable = context;
    const root = node.documentElement;
    this.rootPrefix = root.prefix;
    contextVariable.version = root.getAttribute('version');
    this.runChildNodes(contextVariable, root);
  }

  /**
    * Este método itera e invoca la función "read" sobre los
    * nodos hijos del elemento especificado.
    *
    * @function
    * @param {Object} obj Objeto.
    * @param {Element} node Nodo.
    * @public
    * @api
    */
  runChildNodes(obj, node) {
    const children = node.childNodes;
    let childNode;
    let processor;
    let prefix;
    let local;
    for (let i = 0, len = children.length; i < len; i += 1) {
      childNode = children[i];
      if (childNode.nodeType === 1) {
        prefix = this.getNamespacePrefix(childNode.namespaceURI);
        local = childNode.nodeName.split(':').pop();
        processor = this[`read${prefix}${local}`];
        if (processor) {
          processor.apply(this, [obj, childNode]);
        }
      }
    }
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
    let prefix = null;
    if (uri === null) {
      prefix = this.namespaces[this.defaultPrefix];
    } else {
      const keys = Object.keys(this.namespaces);
      for (let i = 0; i < keys.length; i += 1) {
        prefix = keys[i];
        if (this.namespaces[prefix] === uri) {
          break;
        }
      }
    }
    return prefix;
  }

  /**
    * Obtiene el valor del nodo de tipo  sección CDATA
    * junto al prefijo especificado. Si no encuentra una
    *  sección CDATA devuelve el prefijo especificado.
    *
    * @function
    * @param {Element} node Nodo de tipo sección CDATA.
    * @param {String} def Prefijo.
    * @return {String} Valor del nodo de tipo sección CDATA.
    * @public
    * @api
    */
  static getChildValue(node, def) {
    let value = def || '';
    if (node) {
      for (let child = node.firstChild; child; child = child.nextSibling) {
        switch (child.nodeType) {
          case 3: // text node
          case 4: // cdata section
            value += child.nodeValue;
            break;
          default:
        }
      }
    }
    return value;
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
    let attributeValue = '';
    if (node.getAttributeNS) {
      attributeValue = node.getAttributeNS(uri, name) || '';
    } else {
      const attributeNode = this.getAttributeNodeNS(node, uri, name);
      if (attributeNode) {
        attributeValue = attributeNode.nodeValue;
      }
    }
    return attributeValue;
  }
}

export default XML;
