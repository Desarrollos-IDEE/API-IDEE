/**
 * @module IDEE/impl/util/xml
 */

/**
 * Este método crea una función para añadir un array a la parte superior de la pila
 * de objetos.
 *
 * @param {function(this: T, Element, Array<*>): *} valueReader Lector del valor.
 * @param {T} [thisArg] El objeto que se utilizará como "this" en "valueReader".
 * @return {Parser} Parseador.
 * @template T
 */
export const makeArrayPusher = (valueReader, thisArg) => {
  return (
    /**
     * @param {Element} node Node.
     * @param {Array<*>} objectStack Object stack.
     */
    (node, objectStack) => {
      const value = valueReader.call(
        thisArg !== undefined ? thisArg : this,
        node,
        objectStack,
      );
      if (value !== undefined) {
        const array = /** @type {Array<*>} */ (
          objectStack[objectStack.length - 1]
        );
        array.push(value);
      }
    }
  );
};

/**
 * Este método crea una función para insertar propiedades de un objeto para agregarla
 * al objeto en la parte superior de la pila.
 *
 * @param {function(this: T, Element, Array<*>): *} valueReader Lector del valor.
 * @param {string} [property] Propiedad.
 * @param {T} [thisArg] El objeto que se utilizará como "this" en "valueReader".
 * @return {Parser} Parseador.
 * @template T
 */
export const makeObjectPropertyPusher = (valueReader, property, thisArg) => {
  return (
    /**
     * @param {Element} node Node.
     * @param {Array<*>} objectStack Object stack.
     */
    (node, objectStack) => {
      const value = valueReader.call(
        thisArg !== undefined ? thisArg : this,
        node,
        objectStack,
      );
      if (value !== undefined) {
        const object = /** @type {!Object} */ (
          objectStack[objectStack.length - 1]
        );
        const name = property !== undefined ? property : node.localName;
        let array;
        if (name in object) {
          array = object[name];
        } else {
          array = [];
          object[name] = array;
        }
        array.push(value);
      }
    }
  );
};

/**
 * Este método crea una función "setter" de una propiedad del objeto.
 *
 * @param {function(this: T, Element, Array<*>): *} valueReader Lector del valor.
 * @param {string} [property] Propiedad.
 * @param {T} [thisArg] El objeto que se utilizará como "this" en "valueReader".
 * @return {Parser} Parseador.
 * @template T
 */
export const makeObjectPropertySetter = (valueReader, property, thisArg) => {
  return (
    /**
     * @param {Element} node Node.
     * @param {Array<*>} objectStack Object stack.
     */
    (node, objectStack) => {
      const value = valueReader.call(
        thisArg !== undefined ? thisArg : this,
        node,
        objectStack,
      );
      if (value !== undefined) {
        const object = /** @type {!Object} */ (
          objectStack[objectStack.length - 1]
        );
        const name = property !== undefined ? property : node.localName;
        object[name] = value;
      }
    }
  );
};

/**
 * Este método crea una estructura de espacio de nombres, utilizando los mismos valores
 * para cada espacio de nombres. Esto se puede utilizar como punto de partida para parseadores
 * versionados, cuando solo unos pocos valores son específicos de la versión.
 *
 * @param {Array<string>} namespaceURIs Espacios de nombres.
 * @param {T} structure Estructura.
 * @param {Object<string, T>} [structureNS] Estructura de espacio de nombres para añadir.
 * @return {Object<string, T>} Estructura de espacio de nombres.
 * @template T
 */
export const makeStructureNS = (namespaceURIs, structure, structureNS) => {
  // eslint-disable-next-line no-param-reassign
  structureNS = structureNS !== undefined ? structureNS : {};
  let i;
  let ii;
  // eslint-disable-next-line no-plusplus
  for (i = 0, ii = namespaceURIs.length; i < ii; ++i) {
    // eslint-disable-next-line no-param-reassign
    structureNS[namespaceURIs[i]] = structure;
  }
  return structureNS;
};

/**
 * Este método analiza un nodo utilizando los parseadores y la pila de objetos.
 *
 * @param {Object<string, Object<string, Parser>>} parsersNS Parseadores por
 * espacio de nombres.
 * @param {Element} node Elemento "Node".
 * @param {Array<*>} objectStack Pila.
 * @param {*} [thisArg] El objeto para usar como "this".
 */
export const parseNode = (parsersNS, node, objectStack, thisArg) => {
  let n;
  for (n = node.firstElementChild; n; n = n.nextElementSibling) {
    const parsers = parsersNS[n.namespaceURI];
    if (parsers !== undefined) {
      const parser = parsers[n.localName];
      if (parser !== undefined) {
        parser.call(thisArg, n, objectStack);
      }
    }
  }
};

/**
 * Este método añade un objeto encima de la pila, parsea y devuelve el objeto extraído.
 *
 * @param {T} object Objecto.
 * @param {Object<string, Object<string, Parser>>} parsersNS Parseadores por
 * espacio de nombres.
 * @param {Element} node Elemento "Node".
 * @param {Array<*>} objectStack Pila.
 * @param {*} [thisArg] El objeto para usar como "this".
 * @return {T} Objecto.
 * @template T
 */
export const pushParseAndPop = (object, parsersNS, node, objectStack, thisArg) => {
  objectStack.push(object);
  parseNode(parsersNS, node, objectStack, thisArg);
  return /** @type {T} */ (objectStack.pop());
};

/**
 * Este método obtiene si un string es booleano o no.
 *
 * @param {string} string String.
 * @return {boolean|undefined} Booleano.
 */
export const readBooleanString = (string) => {
  const m = /^\s*(true|1)|(false|0)\s*$/.exec(string);
  if (m) {
    return m[1] !== undefined || false;
  }
  return undefined;
};

/**
 * Este método captura de forma recursiva todo el contenido de texto de los nodos
 * secundarios en una sola cadena.
 *
 * @param {Node} node Elemento "Node".
 * @param {boolean} normalizeWhitespace Indica si se normalizan los espacios en
 * blanco: eliminar todos los saltos de línea.
 * @param {Array<string>} accumulator Acumulador.
 * @private
 * @return {Array<string>} Acumulador.
 */
// eslint-disable-next-line no-underscore-dangle
export const getAllTextContent_ = (node, normalizeWhitespace, accumulator) => {
  if (
    node.nodeType === window.Node.CDATA_SECTION_NODE
    || node.nodeType === window.Node.TEXT_NODE
  ) {
    if (normalizeWhitespace) {
      accumulator.push(String(node.nodeValue).replace(/(\r\n|\r|\n)/g, ''));
    } else {
      accumulator.push(node.nodeValue);
    }
  } else {
    let n;
    for (n = node.firstChild; n; n = n.nextSibling) {
      getAllTextContent_(n, normalizeWhitespace, accumulator);
    }
  }
  return accumulator;
};

/**
 * Este método captura de forma recursiva todo el contenido de texto de los nodos
 * secundarios en una sola cadena.
 *
 * @param {Node} node Elemento "Node".
 * @param {boolean} normalizeWhitespace Indica si se normalizan los espacios en
 * blanco: eliminar todos los saltos de línea.
 * @return {string} Todo el contenido del texto.
 * @api
 */
export const getAllTextContent = (node, normalizeWhitespace) => {
  return getAllTextContent_(node, normalizeWhitespace, []).join('');
};

/**
 * Este método indica si una cadena de texto es decimal o no.
 *
 * @param {string} string String.
 * @return {number|undefined} Decimal.
 */
export const readDecimalString = (string) => {
  /* eslint-disable-next-line no-useless-escape */
  const m = /^\s*([+\-]?\d*\.?\d+(?:e[+\-]?\d+)?)\s*$/i.exec(string);
  if (m) {
    return parseFloat(m[1]);
  }
  return undefined;
};

/**
 * Este método obtiene un número decimal de un elemento "Node".
 *
 * @param {Node} node Elemento "Node".
 * @return {number|undefined} Decimal.
 */
export const readDecimal = (node) => {
  const s = getAllTextContent(node, false);
  return readDecimalString(s);
};

/**
 * Este método obtiene un entero no negativo de una cadena de texto.
 *
 * @param {string} string String.
 * @return {number|undefined} Entero no negativo.
 */
export const readNonNegativeIntegerString = (string) => {
  const m = /^\s*(\d+)\s*$/.exec(string);
  if (m) {
    return parseInt(m[1], 10);
  }
  return undefined;
};

/**
 * Este método obtiene un entero positivo de un elemento "Node".
 *
 * @param {Node} node Elemento "Node".
 * @return {number|undefined} Entero positivo.
 */
export const readPositiveInteger = (node) => {
  const s = getAllTextContent(node, false);
  return readNonNegativeIntegerString(s);
};

/**
 * Este método obtiene una cadena de texto de un elemento "Node".
 *
 * @param {Node} node Elemento "Node".
 * @return {string|undefined} String.
 */
export const readString = (node) => {
  return getAllTextContent(node, false).trim();
};

/**
 * Espacio de nombres.
 *
 * @const
 * @type {string}
 */
const NAMESPACE_URI = 'http://www.w3.org/1999/xlink';

/**
 * Este método obtiene el atributo "href" de un elemento "Node".
 *
 * @param {Element} node Elemento "Node".
 * @return {string|null} Propiedad "href".
 */
export const readHref = (node) => {
  return node.getAttributeNS(NAMESPACE_URI, 'href');
};

/**
 * Este método crea una extensión vacía.
 *
 * @return {Extent} Extensión vacía.
 * @api
 */
export const createEmpty = () => {
  return [Infinity, Infinity, -Infinity, -Infinity];
};

/**
 * Este método devuelve las coordenadas a partir de
 * la extensión dada por parámetro.
 *
 * @param {Extent} extent Extensión.
 * @param {Array<number>} coordinate Coordenadas.
 */
export const extendCoordinate = (extent, coordinate) => {
  if (coordinate[0] < extent[0]) {
    /* eslint-disable-next-line no-param-reassign */
    extent[0] = coordinate[0];
  }
  if (coordinate[0] > extent[2]) {
    /* eslint-disable-next-line no-param-reassign */
    extent[2] = coordinate[0];
  }
  if (coordinate[1] < extent[1]) {
    /* eslint-disable-next-line no-param-reassign */
    extent[1] = coordinate[1];
  }
  if (coordinate[1] > extent[3]) {
    /* eslint-disable-next-line no-param-reassign */
    extent[3] = coordinate[1];
  }
};

/**
 * Este método construye una extensión que incluye todas las coordenadas dadas.
 *
 * @param {Array<number>} coordinates Coordenadas.
 * @return {Extent} Extensión.
 * @api
 */
export const boundingExtent = (coordinates) => {
  const extent = createEmpty();
  // eslint-disable-next-line no-plusplus
  for (let i = 0, ii = coordinates.length; i < ii; ++i) {
    extendCoordinate(extent, coordinates[i]);
  }
  return extent;
};
