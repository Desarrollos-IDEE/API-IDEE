/* eslint-disable */
/**
 * @module M/impl/format/OWS
 */
import XML from './CesiumXML';
import {
  makeObjectPropertyPusher,
  makeObjectPropertySetter,
  makeStructureNS,
  pushParseAndPop,
  readHref,
  readString,
} from '../util/xml';

/**
 * Colección de espacios de nombres identificados por una URI.
 * @public
 * @const
 * @type {Array<null|string>}
 */
const NAMESPACE_URIS = [null, 'http://www.opengis.net/ows/1.1'];

/**
 * Formateadores utilizados para obtener los objetos "ServiceIdentification",
 * "ServiceProvider" y "OperationsMetadata".
 * @public
 * @const
 */
const PARSERS = makeStructureNS(NAMESPACE_URIS, {
  ServiceIdentification: makeObjectPropertySetter(readServiceIdentification),
  ServiceProvider: makeObjectPropertySetter(readServiceProvider),
  OperationsMetadata: makeObjectPropertySetter(readOperationsMetadata),
});

/**
 * @classdesc
 * Implementación de la clase OWS.
 *
 * @api
 * @extends {M.impl.format.CesiumXML}
 */
class OWS extends XML {
  /**
   * Constructor principal de la clase.
   *
   * @constructor
   * @api
   */
  constructor() {
    super();
  }

  /**
   * Este método obtiene un objeto basado en el elemento "Node"
   * dado por parámetro.
   *
   * @param {Element} node Elemento "Node".
   * @return {Object|null} Objeto.
   * @public
   * @api
   */
  readFromNode(node) {
    const owsObject = pushParseAndPop({}, PARSERS, node, []);
    return owsObject || null;
  }
}

/**
 * Formateadores utilizados para obtener los objetos correspondientes
 * del objeto "Address".
 *
 * @public
 * @const
 */
const ADDRESS_PARSERS = makeStructureNS(NAMESPACE_URIS, {
  DeliveryPoint: makeObjectPropertySetter(readString),
  City: makeObjectPropertySetter(readString),
  AdministrativeArea: makeObjectPropertySetter(readString),
  PostalCode: makeObjectPropertySetter(readString),
  Country: makeObjectPropertySetter(readString),
  ElectronicMailAddress: makeObjectPropertySetter(readString),
});

/**
 * Formateadores utilizados para obtener los objetos correspondientes
 * del objeto "Allowed values".
 *
 * @public
 * @const
 */
const ALLOWED_VALUES_PARSERS = makeStructureNS(NAMESPACE_URIS, {
  Value: makeObjectPropertyPusher(readValue),
});

/**
 * Formateadores utilizados para obtener los objetos correspondientes
 * del objeto "Constraint".
 *
 * @public
 * @const
 */
const CONSTRAINT_PARSERS = makeStructureNS(NAMESPACE_URIS, {
  AllowedValues: makeObjectPropertySetter(readAllowedValues),
});

/**
 * Formateadores utilizados para obtener los objetos correspondientes
 * del objeto "Contact Info".
 *
 * @public
 * @const
 */
const CONTACT_INFO_PARSERS = makeStructureNS(NAMESPACE_URIS, {
  Phone: makeObjectPropertySetter(readPhone),
  Address: makeObjectPropertySetter(readAddress),
});

/**
 * Formateadores utilizados para obtener los objetos correspondientes
 * del objeto "DCP".
 *
 * @public
 * @const
 */
const DCP_PARSERS = makeStructureNS(NAMESPACE_URIS, {
  HTTP: makeObjectPropertySetter(readHttp),
});

/**
 * Formateadores utilizados para obtener los objetos correspondientes
 * del objeto "HTTP".
 *
 * @public
 * @const
 */
const HTTP_PARSERS = makeStructureNS(NAMESPACE_URIS, {
  Get: makeObjectPropertyPusher(readGet),
  Post: undefined, // TODO
});

/**
 * Formateadores utilizados para obtener los objetos correspondientes
 * del objeto "Operation".
 *
 * @public
 * @const
 */
const OPERATION_PARSERS = makeStructureNS(NAMESPACE_URIS, {
  DCP: makeObjectPropertySetter(readDcp),
});

/**
 * Formateadores utilizados para obtener los objetos correspondientes
 * del objeto "Operations metadata".
 *
 * @public
 * @const
 */
const OPERATIONS_METADATA_PARSERS = makeStructureNS(NAMESPACE_URIS, {
  Operation: readOperation,
});

/**
 * Formateadores utilizados para obtener los objetos correspondientes
 * del objeto "Phone".
 *
 * @public
 * @const
 */
const PHONE_PARSERS = makeStructureNS(NAMESPACE_URIS, {
  Voice: makeObjectPropertySetter(readString),
  Facsimile: makeObjectPropertySetter(readString),
});

/**
 * Formateadores utilizados para obtener los objetos correspondientes
 * del objeto "Request Method".
 *
 * @public
 * @const
 */
const REQUEST_METHOD_PARSERS = makeStructureNS(NAMESPACE_URIS, {
  Constraint: makeObjectPropertyPusher(readConstraint),
});

/**
 * Formateadores utilizados para obtener los objetos correspondientes
 * del objeto "Service Contact".
 *
 * @public
 * @const
 */
const SERVICE_CONTACT_PARSERS = makeStructureNS(NAMESPACE_URIS, {
  IndividualName: makeObjectPropertySetter(readString),
  PositionName: makeObjectPropertySetter(readString),
  ContactInfo: makeObjectPropertySetter(readContactInfo),
});

/**
 * Formateadores utilizados para obtener los objetos correspondientes
 * del objeto "Service Identification".
 *
 * @public
 * @const
 */
const SERVICE_IDENTIFICATION_PARSERS = makeStructureNS(NAMESPACE_URIS, {
  Abstract: makeObjectPropertySetter(readString),
  AccessConstraints: makeObjectPropertySetter(readString),
  Fees: makeObjectPropertySetter(readString),
  Title: makeObjectPropertySetter(readString),
  ServiceTypeVersion: makeObjectPropertySetter(readString),
  ServiceType: makeObjectPropertySetter(readString),
});

/**
 * Formateadores utilizados para obtener los objetos correspondientes del
 * objeto "Service Provider".
 *
 * @public
 * @const
 */
const SERVICE_PROVIDER_PARSERS = makeStructureNS(NAMESPACE_URIS, {
  ProviderName: makeObjectPropertySetter(readString),
  ProviderSite: makeObjectPropertySetter(readHref),
  ServiceContact: makeObjectPropertySetter(readServiceContact),
});

/**
 * Este método obtiene el objeto "Address" de un elemento "Node".
 *
 * @param {Element} node Elemento "Node".
 * @param {Array<*>} objectStack Objeto.
 * @return {Object|undefined} Objeto "Address".
 * @public
 * @api
 */
function readAddress(node, objectStack) {
  return pushParseAndPop({}, ADDRESS_PARSERS, node, objectStack);
}

/**
 * Este método obtiene el objeto "Allowed Values" de un elemento "Node".
 *
 * @param {Element} node Elemento "Node".
 * @param {Array<*>} objectStack Objeto.
 * @return {Object|undefined} Objeto "Allowed Values".
 * @public
 * @api
 */
function readAllowedValues(node, objectStack) {
  return pushParseAndPop({}, ALLOWED_VALUES_PARSERS, node, objectStack);
}

/**
 * Este método obtiene el objeto "Constraint" de un elemento "Node".
 *
 * @param {Element} node Elemento "Node".
 * @param {Array<*>} objectStack Objeto.
 * @return {Object|undefined} Objeto "Constraint".
 * @public
 * @api
 */
function readConstraint(node, objectStack) {
  const name = node.getAttribute('name');
  if (!name) {
    return undefined;
  }
  return pushParseAndPop({ name }, CONSTRAINT_PARSERS, node, objectStack);
}

/**
 * Este método obtiene el objeto "Contact Info" de un elemento "Node".
 *
 * @param {Element} node Elemento "Node".
 * @param {Array<*>} objectStack Objeto.
 * @return {Object|undefined} Objeto "Contact Info".
 * @public
 * @api
 */
function readContactInfo(node, objectStack) {
  return pushParseAndPop({}, CONTACT_INFO_PARSERS, node, objectStack);
}

/**
 * Este método obtiene el objeto "DCP" de un elemento "Node".
 *
 * @param {Element} node Elemento "Node".
 * @param {Array<*>} objectStack Objeto.
 * @return {Object|undefined} Objeto "DCP".
 * @public
 * @api
 */
function readDcp(node, objectStack) {
  return pushParseAndPop({}, DCP_PARSERS, node, objectStack);
}

/**
 * Este método obtiene el objeto "GET" de un elemento "Node".
 *
 * @param {Element} node Elemento "Node".
 * @param {Array<*>} objectStack Objeto.
 * @return {Object|undefined} Objeto "GET".
 * @public
 * @api
 */
function readGet(node, objectStack) {
  const href = readHref(node);
  if (!href) {
    return undefined;
  }
  return pushParseAndPop(
    { href },
    REQUEST_METHOD_PARSERS,
    node,
    objectStack,
  );
}

/**
 * Este método obtiene el objeto "HTTP" de un elemento "Node".
 *
 * @param {Element} node Elemento "Node".
 * @param {Array<*>} objectStack Objeto.
 * @return {Object|undefined} Objeto "HTTP".
 * @public
 * @api
 */
function readHttp(node, objectStack) {
  return pushParseAndPop({}, HTTP_PARSERS, node, objectStack);
}

/**
 * Este método obtiene el objeto "Operation" de un elemento "Node".
 *
 * @param {Element} node Elemento "Node".
 * @param {Array<*>} objectStack Objeto.
 * @return {Object|undefined} Objeto "Operation".
 * @public
 * @api
 */
function readOperation(node, objectStack) {
  const name = node.getAttribute('name');
  const value = pushParseAndPop({}, OPERATION_PARSERS, node, objectStack);
  if (!value) {
    return undefined;
  }
  const object = /** @type {Object} */ (objectStack[objectStack.length - 1]);
  object[name] = value;
}

/**
 * Este método obtiene el objeto "Operations Metadata" de un elemento "Node".
 *
 * @param {Element} node Elemento "Node".
 * @param {Array<*>} objectStack Objeto.
 * @return {Object|undefined} Objeto "Operations Metadata".
 * @public
 * @api
 */
function readOperationsMetadata(node, objectStack) {
  return pushParseAndPop({}, OPERATIONS_METADATA_PARSERS, node, objectStack);
}

/**
 * Este método obtiene el objeto "Phone" de un elemento "Node".
 *
 * @param {Element} node Elemento "Node".
 * @param {Array<*>} objectStack Objeto.
 * @return {Object|undefined} Objeto "Phone".
 * @public
 * @api
 */
function readPhone(node, objectStack) {
  return pushParseAndPop({}, PHONE_PARSERS, node, objectStack);
}

/**
 * Este método obtiene el objeto "Service Identification" de un elemento "Node".
 *
 * @param {Element} node Elemento "Node".
 * @param {Array<*>} objectStack Objeto.
 * @return {Object|undefined} Objeto "Service Identification".
 * @public
 * @api
 */
function readServiceIdentification(node, objectStack) {
  return pushParseAndPop({}, SERVICE_IDENTIFICATION_PARSERS, node, objectStack);
}

/**
 * Este método obtiene el objeto "Service Contact" de un elemento "Node".
 *
 * @param {Element} node Elemento "Node".
 * @param {Array<*>} objectStack Objeto.
 * @return {Object|undefined} Objeto "Service Contact".
 * @public
 * @api
 */
function readServiceContact(node, objectStack) {
  return pushParseAndPop({}, SERVICE_CONTACT_PARSERS, node, objectStack);
}

/**
 * Este método obtiene el objeto "Service Provider" de un elemento "Node".
 *
 * @param {Element} node Elemento "Node".
 * @param {Array<*>} objectStack Objeto.
 * @return {Object|undefined} Objeto "Service Provider".
 * @public
 * @api
 */
function readServiceProvider(node, objectStack) {
  return pushParseAndPop({}, SERVICE_PROVIDER_PARSERS, node, objectStack);
}

/**
 * Este método obtiene el valor de un elemento "Node".
 *
 * @param {Node} node Elemento "Node".
 * @param {Array<*>} objectStack Objeto.
 * @return {string|undefined} Valor obtenido.
 * @public
 * @api
 */
function readValue(node, objectStack) {
  return readString(node);
}

export default OWS;
