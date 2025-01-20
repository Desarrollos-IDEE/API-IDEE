/**
 * @module M/impl/format/CesiumXML
 */

/**
 * @classdesc
 * Implementación de la clase XML. Formato genérico para leer datos
 * XML sin funciones.
 *
 * @abstract
 * @api
 */
class XML {
  /**
   * Este método lee el documento fuente.
   *
   * @function
   * @param {Document|Element|string} source XML.
   * @return {Object|null} Objeto que representa la fuente.
   * @public
   * @api
   */
  read(source) {
    if (!source) {
      return null;
    }
    if (typeof source === 'string') {
      const doc = new DOMParser().parseFromString(source, 'application/xml');
      return this.readFromDocument(doc);
    }
    if ('documentElement' in source) {
      return this.readFromDocument(/** @type {Document} */ (source));
    }
    return this.readFromNode(/** @type {Element} */ (source));
  }

  /**
   * Este método obtiene un objeto basado en el documento dado por
   * parámetro.
   *
   * @function
   * @param {Document} doc Documento.
   * @return {Object|null} Objecto basado en el documento dado por
   * parámetro.
   * @public
   * @api
   */
  readFromDocument(doc) {
    for (let n = doc.firstChild; n; n = n.nextSibling) {
      if (n.nodeType === window.Node.ELEMENT_NODE) {
        return this.readFromNode(/** @type {Element} */ (n));
      }
    }
    return null;
  }

  /**
   * Este método obtiene un objeto basado en el elemento "Node" dado por
   * parámetro.
   *
   * @function
   * @abstract
   * @param {Element} node Elemento "Node".
   * @return {Object|null} Objecto basado en el elemento "Node" dado
   * por parámetro.
   * @public
   * @api
   */
  readFromNode(node) {
    throw new Error('Unimplemented abstract method.');
  }
}

export default XML;
