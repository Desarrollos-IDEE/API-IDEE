/* eslint-disable */
/**
 * @module IDEE/impl/format/CesiumWMSCapabilities
 */
import XML from './CesiumXML';
import {
  makeArrayPusher,
  makeObjectPropertyPusher,
  makeObjectPropertySetter,
  makeStructureNS,
  pushParseAndPop,
  readBooleanString,
  readDecimal,
  readDecimalString,
  readNonNegativeIntegerString,
  readPositiveInteger,
  readString,
  readHref,
} from '../util/xml';

/**
 * Colección de espacios de nombres identificados por una URI.
 * @public
 * @const
 * @type {Array<null|string>}
 */
const NAMESPACE_URIS = [null, 'http://www.opengis.net/wms'];

/**
 * Formateadores utilizados para obtener los objetos "Service" y
 * "Capability" de la petición "GetCapabilities".
 * @public
 * @const
 */
const PARSERS = makeStructureNS(NAMESPACE_URIS, {
  Service: makeObjectPropertySetter(readService),
  Capability: makeObjectPropertySetter(readCapability),
});

/**
 * Formateadores utilizados para obtener los objetos "Request",
 * "Exception" y "Layer" del objeto "Capability".
 * @public
 * @const
 */
const CAPABILITY_PARSERS = makeStructureNS(NAMESPACE_URIS, {
  Request: makeObjectPropertySetter(readRequest),
  Exception: makeObjectPropertySetter(readException),
  Layer: makeObjectPropertySetter(readCapabilityLayer),
});

/**
 * @classdesc
 * Implementación de la clase WMSCapabilities. Formato para obtener los datos
 * de la petición "GetCapabilities" de las capas WMS.
 *
 * @api
 * @extends {IDEE.impl.format.CesiumXML}
 */
class WMSCapabilities extends XML {
  /**
   * Constructor principal de la clase. Crea un formateador para obtener los datos
   * de la petición "GetCapabilities" de las capas WMS.
   *
   * @constructor
   * @api
   */
  constructor() {
    super();

    /**
     * Versión de la petición "GetCapabilities".
     * @public
     * @type {string|undefined}
     */
    this.version = undefined;
  }

  /**
   * Este método obtiene un objeto basado en el elemento "Node" 
   * dado por parámetro.
   *
   * @const
   * @param {Element} node Elemento "Node".
   * @return {Object|null} Objecto basado en el elemento "Node"
   * dado por parámetro.
   * @public
   * @api
   */
  readFromNode(node) {
    this.version = node.getAttribute('version').trim();
    const wmsCapabilityObject = pushParseAndPop(
      {
        version: this.version,
      },
      PARSERS,
      node,
      [],
    );
    return wmsCapabilityObject || null;
  }
}

/**
 * Formateadores utilizados para obtener los objetos correspondientes
 * del objeto "Service" de la petición "GetCapabilities".
 * @public
 * @const
 */
const SERVICE_PARSERS = makeStructureNS(NAMESPACE_URIS, {
  Name: makeObjectPropertySetter(readString),
  Title: makeObjectPropertySetter(readString),
  Abstract: makeObjectPropertySetter(readString),
  KeywordList: makeObjectPropertySetter(readKeywordList),
  OnlineResource: makeObjectPropertySetter(readHref),
  ContactInformation: makeObjectPropertySetter(readContactInformation),
  Fees: makeObjectPropertySetter(readString),
  AccessConstraints: makeObjectPropertySetter(readString),
  LayerLimit: makeObjectPropertySetter(readPositiveInteger),
  MaxWidth: makeObjectPropertySetter(readPositiveInteger),
  MaxHeight: makeObjectPropertySetter(readPositiveInteger),
});

/**
 * Formateadores utilizados para obtener los objetos correspondientes
 * del objeto "Contact Information" de la petición "GetCapabilities".
 * @public
 * @const
 */
const CONTACT_INFORMATION_PARSERS = makeStructureNS(NAMESPACE_URIS, {
  ContactPersonPrimary: makeObjectPropertySetter(readContactPersonPrimary),
  ContactPosition: makeObjectPropertySetter(readString),
  ContactAddress: makeObjectPropertySetter(readContactAddress),
  ContactVoiceTelephone: makeObjectPropertySetter(readString),
  ContactFacsimileTelephone: makeObjectPropertySetter(readString),
  ContactElectronicMailAddress: makeObjectPropertySetter(readString),
});

/**
 * Formateadores utilizados para obtener los objetos correspondientes
 * del objeto "Contact Person" de la petición "GetCapabilities".
 * @public
 * @const
 */
const CONTACT_PERSON_PARSERS = makeStructureNS(NAMESPACE_URIS, {
  ContactPerson: makeObjectPropertySetter(readString),
  ContactOrganization: makeObjectPropertySetter(readString),
});

/**
 * Formateadores utilizados para obtener los objetos correspondientes
 * del objeto "Contact Address" de la petición "GetCapabilities".
 * @public
 * @const
 */
const CONTACT_ADDRESS_PARSERS = makeStructureNS(NAMESPACE_URIS, {
  AddressType: makeObjectPropertySetter(readString),
  Address: makeObjectPropertySetter(readString),
  City: makeObjectPropertySetter(readString),
  StateOrProvince: makeObjectPropertySetter(readString),
  PostCode: makeObjectPropertySetter(readString),
  Country: makeObjectPropertySetter(readString),
});

/**
 * Formateadores utilizados para obtener el objeto "Format"
 * de "Exception" de la petición "GetCapabilities".
 * @public
 * @const
 */
const EXCEPTION_PARSERS = makeStructureNS(NAMESPACE_URIS, {
  Format: makeArrayPusher(readString),
});

/**
 * Formateadores utilizados para obtener los objetos correspondientes
 * del objeto "Layer" de la petición "GetCapabilities".
 * @public
 * @const
 */
const LAYER_PARSERS = makeStructureNS(NAMESPACE_URIS, {
  Name: makeObjectPropertySetter(readString),
  Title: makeObjectPropertySetter(readString),
  Abstract: makeObjectPropertySetter(readString),
  KeywordList: makeObjectPropertySetter(readKeywordList),
  CRS: makeObjectPropertyPusher(readString),
  EX_GeographicBoundingBox: makeObjectPropertySetter(
    readEXGeographicBoundingBox,
  ),
  BoundingBox: makeObjectPropertyPusher(readBoundingBox),
  Dimension: makeObjectPropertyPusher(readDimension),
  Attribution: makeObjectPropertySetter(readAttribution),
  AuthorityURL: makeObjectPropertyPusher(readAuthorityURL),
  Identifier: makeObjectPropertyPusher(readString),
  MetadataURL: makeObjectPropertyPusher(readMetadataURL),
  DataURL: makeObjectPropertyPusher(readFormatOnlineresource),
  FeatureListURL: makeObjectPropertyPusher(readFormatOnlineresource),
  Style: makeObjectPropertyPusher(readStyle),
  MinScaleDenominator: makeObjectPropertySetter(readDecimal),
  MaxScaleDenominator: makeObjectPropertySetter(readDecimal),
  Layer: makeObjectPropertyPusher(readLayer),
});

/**
 * Formateadores utilizados para obtener los objetos correspondientes
 * del objeto "Attribution" de la petición "GetCapabilities".
 * @public
 * @const
 */
const ATTRIBUTION_PARSERS = makeStructureNS(NAMESPACE_URIS, {
  Title: makeObjectPropertySetter(readString),
  OnlineResource: makeObjectPropertySetter(readHref),
  LogoURL: makeObjectPropertySetter(readSizedFormatOnlineresource),
});

/**
 * Formateadores utilizados para obtener los objetos correspondientes
 * del objeto "Ex Geographic Bounding Box" de la petición "GetCapabilities".
 * @public
 * @const
 */
const EX_GEOGRAPHIC_BOUNDING_BOX_PARSERS = makeStructureNS(NAMESPACE_URIS, {
  westBoundLongitude: makeObjectPropertySetter(readDecimal),
  eastBoundLongitude: makeObjectPropertySetter(readDecimal),
  southBoundLatitude: makeObjectPropertySetter(readDecimal),
  northBoundLatitude: makeObjectPropertySetter(readDecimal),
});

/**
 * Formateadores utilizados para obtener los objetos correspondientes
 * del objeto "Request" de la petición "GetCapabilities".
 * @public
 * @const
 */
const REQUEST_PARSERS = makeStructureNS(NAMESPACE_URIS, {
  GetCapabilities: makeObjectPropertySetter(readOperationType),
  GetMap: makeObjectPropertySetter(readOperationType),
  GetFeatureInfo: makeObjectPropertySetter(readOperationType),
});

/**
 * Formateadores utilizados para obtener los objetos correspondientes
 * del objeto "Contact Person" de la petición "GetCapabilities".
 * @public
 * @const
 */
const OPERATIONTYPE_PARSERS = makeStructureNS(NAMESPACE_URIS, {
  Format: makeObjectPropertyPusher(readString),
  DCPType: makeObjectPropertyPusher(readDCPType),
});

/**
 * Formateadores utilizados para obtener los objetos correspondientes
 * del objeto "DCP Type" de la petición "GetCapabilities".
 * @public
 * @const
 */
const DCPTYPE_PARSERS = makeStructureNS(NAMESPACE_URIS, {
  HTTP: makeObjectPropertySetter(readHTTP),
});

/**
 * Formateadores utilizados para obtener los objetos correspondientes
 * del objeto "HTTP" de la petición "GetCapabilities".
 * @public
 * @const
 */
const HTTP_PARSERS = makeStructureNS(NAMESPACE_URIS, {
  Get: makeObjectPropertySetter(readFormatOnlineresource),
  Post: makeObjectPropertySetter(readFormatOnlineresource),
});

/**
 * Formateadores utilizados para obtener los objetos correspondientes
 * del objeto "Style" de la petición "GetCapabilities".
 * @public
 * @const
 */
const STYLE_PARSERS = makeStructureNS(NAMESPACE_URIS, {
  Name: makeObjectPropertySetter(readString),
  Title: makeObjectPropertySetter(readString),
  Abstract: makeObjectPropertySetter(readString),
  LegendURL: makeObjectPropertyPusher(readSizedFormatOnlineresource),
  StyleSheetURL: makeObjectPropertySetter(readFormatOnlineresource),
  StyleURL: makeObjectPropertySetter(readFormatOnlineresource),
});

/**
 * Formateadores utilizados para obtener los objetos correspondientes
 * del objeto "Format Online Resource" de la petición "GetCapabilities".
 * @public
 * @const
 */
const FORMAT_ONLINERESOURCE_PARSERS = makeStructureNS(NAMESPACE_URIS, {
  Format: makeObjectPropertySetter(readString),
  OnlineResource: makeObjectPropertySetter(readHref),
});

/**
 * Formateadores utilizados para obtener los objetos correspondientes
 * del objeto "Keyword" de la petición "GetCapabilities".
 * @public
 * @const
 */
const KEYWORDLIST_PARSERS = makeStructureNS(NAMESPACE_URIS, {
  Keyword: makeArrayPusher(readString),
});

/**
 * Este método obtiene el objeto "Attribution" de un elemento "Node".
 *
 * @param {Element} node Elemento "Node".
 * @param {Array<*>} objectStack Objecto.
 * @return {Object|undefined} Objeto "Attribution".
 * @public
 * @api
 */
function readAttribution(node, objectStack) {
  return pushParseAndPop({}, ATTRIBUTION_PARSERS, node, objectStack);
}

/**
 * Este método obtiene el objeto "Bounding Box" de un elemento "Node".
 *
 * @param {Element} node Elemento "Node".
 * @param {Array<*>} objectStack Objecto.
 * @return {Object} Objeto "Bounding Box".
 * @public
 * @api
 */
function readBoundingBox(node, objectStack) {
  const extent = [
    readDecimalString(node.getAttribute('minx')),
    readDecimalString(node.getAttribute('miny')),
    readDecimalString(node.getAttribute('maxx')),
    readDecimalString(node.getAttribute('maxy')),
  ];

  const resolutions = [
    readDecimalString(node.getAttribute('resx')),
    readDecimalString(node.getAttribute('resy')),
  ];

  return {
    crs: node.getAttribute('CRS'),
    extent,
    res: resolutions,
  };
}

/**
 * Este método obtiene el objeto "Ex Geographic Bounding Box" de 
 * un elemento "Node".
 *
 * @param {Element} node Elemento "Node".
 * @param {Array<*>} objectStack Objecto.
 * @return {Object} Objeto "Bounding Box".
 * @public
 * @api
 */
function readEXGeographicBoundingBox(node, objectStack) {
  const geographicBoundingBox = pushParseAndPop(
    {},
    EX_GEOGRAPHIC_BOUNDING_BOX_PARSERS,
    node,
    objectStack,
  );
  if (!geographicBoundingBox) {
    return undefined;
  }
  const westBoundLongitude =
    /** @type {number|undefined} */
    (geographicBoundingBox.westBoundLongitude);
  const southBoundLatitude =
    /** @type {number|undefined} */
    (geographicBoundingBox.southBoundLatitude);
  const eastBoundLongitude =
    /** @type {number|undefined} */
    (geographicBoundingBox.eastBoundLongitude);
  const northBoundLatitude =
    /** @type {number|undefined} */
    (geographicBoundingBox.northBoundLatitude);
  if (
    westBoundLongitude === undefined
    || southBoundLatitude === undefined
    || eastBoundLongitude === undefined
    || northBoundLatitude === undefined
  ) {
    return undefined;
  }
  return [
    westBoundLongitude,
    southBoundLatitude,
    eastBoundLongitude,
    northBoundLatitude,
  ];
}

/**
 * Este método obtiene el objeto "Capability" de un elemento "Node".
 *
 * @param {Element} node Elemento "Node".
 * @param {Array<*>} objectStack Objecto.
 * @return {Object|undefined} Objeto "Capability".
 * @public
 * @api
 */
function readCapability(node, objectStack) {
  return pushParseAndPop({}, CAPABILITY_PARSERS, node, objectStack);
}

/**
 * Este método obtiene el objeto "Service" de un elemento "Node".
 *
 * @param {Element} node Elemento "Node".
 * @param {Array<*>} objectStack Objecto.
 * @return {Object|undefined} Objeto "Service".
 * @public
 * @api
 */
function readService(node, objectStack) {
  return pushParseAndPop({}, SERVICE_PARSERS, node, objectStack);
}

/**
 * Este método obtiene el objeto "Contact Information" de un
 * elemento "Node".
 *
 * @param {Element} node Elemento "Node".
 * @param {Array<*>} objectStack Objecto.
 * @return {Object|undefined} Objeto "Contact Information".
 * @public
 * @api
 */
function readContactInformation(node, objectStack) {
  return pushParseAndPop({}, CONTACT_INFORMATION_PARSERS, node, objectStack);
}

/**
 * Este método obtiene el objeto "Contact Person" de un elemento "Node".
 *
 * @param {Element} node Elemento "Node".
 * @param {Array<*>} objectStack Objecto.
 * @return {Object|undefined} Objeto "Contact Person".
 * @public
 * @api
 */
function readContactPersonPrimary(node, objectStack) {
  return pushParseAndPop({}, CONTACT_PERSON_PARSERS, node, objectStack);
}

/**
 * Este método obtiene el objeto "Contact Address" de un elemento "Node".
 *
 * @param {Element} node Elemento "Node".
 * @param {Array<*>} objectStack Objecto.
 * @return {Object|undefined} Objeto "Contact Address".
 * @public
 * @api
 */
function readContactAddress(node, objectStack) {
  return pushParseAndPop({}, CONTACT_ADDRESS_PARSERS, node, objectStack);
}

/**
 * Este método obtiene el array de "Format" de un elemento "Node".
 *
 * @param {Element} node Elemento "Node".
 * @param {Array<*>} objectStack Objecto.
 * @return {Array<string>|undefined} Array "Format".
 * @public
 * @api
 */
function readException(node, objectStack) {
  return pushParseAndPop([], EXCEPTION_PARSERS, node, objectStack);
}

/**
 * Este método obtiene la capa de un elemento "Node".
 *
 * @param {Element} node Elemento "Node".
 * @param {Array<*>} objectStack Objecto.
 * @return {Object|undefined} Capa.
 * @public
 * @api
 */
function readCapabilityLayer(node, objectStack) {
  const layerObject = pushParseAndPop({}, LAYER_PARSERS, node, objectStack);

  if (layerObject.Layer === undefined) {
    return Object.assign(layerObject, readLayer(node, objectStack));
  }

  return layerObject;
}

/**
 * Este método obtiene la capa de un elemento "Node".
 *
 * @param {Element} node Elemento "Node".
 * @param {Array<*>} objectStack Objecto.
 * @return {Object|undefined} Capa.
 * @public
 * @api
 */
function readLayer(node, objectStack) {
  const parentLayerObject = /**  @type {!Object<string,*>} */ (
    objectStack[objectStack.length - 1]
  );

  const layerObject = pushParseAndPop({}, LAYER_PARSERS, node, objectStack);

  if (!layerObject) {
    return undefined;
  }
  let queryable = readBooleanString(node.getAttribute('queryable'));
  if (queryable === undefined) {
    queryable = parentLayerObject.queryable;
  }
  layerObject.queryable = queryable !== undefined ? queryable : false;

  let cascaded = readNonNegativeIntegerString(node.getAttribute('cascaded'));
  if (cascaded === undefined) {
    cascaded = parentLayerObject.cascaded;
  }
  layerObject.cascaded = cascaded;

  let opaque = readBooleanString(node.getAttribute('opaque'));
  if (opaque === undefined) {
    opaque = parentLayerObject.opaque;
  }
  layerObject.opaque = opaque !== undefined ? opaque : false;

  let noSubsets = readBooleanString(node.getAttribute('noSubsets'));
  if (noSubsets === undefined) {
    noSubsets = parentLayerObject.noSubsets;
  }
  layerObject.noSubsets = noSubsets !== undefined ? noSubsets : false;

  let fixedWidth = readDecimalString(node.getAttribute('fixedWidth'));
  if (!fixedWidth) {
    fixedWidth = parentLayerObject.fixedWidth;
  }
  layerObject.fixedWidth = fixedWidth;

  let fixedHeight = readDecimalString(node.getAttribute('fixedHeight'));
  if (!fixedHeight) {
    fixedHeight = parentLayerObject.fixedHeight;
  }
  layerObject.fixedHeight = fixedHeight;

  // See 7.2.4.8
  const addKeys = ['Style', 'CRS', 'AuthorityURL'];
  addKeys.forEach((key) => {
    if (key in parentLayerObject) {
      const childValue = layerObject[key] || [];
      layerObject[key] = childValue.concat(parentLayerObject[key]);
    }
  });

  const replaceKeys = [
    'EX_GeographicBoundingBox',
    'BoundingBox',
    'Dimension',
    'Attribution',
    'MinScaleDenominator',
    'MaxScaleDenominator',
  ];
  replaceKeys.forEach((key) => {
    if (!(key in layerObject)) {
      const parentValue = parentLayerObject[key];
      layerObject[key] = parentValue;
    }
  });

  return layerObject;
}

/**
 * Este método obtiene el objeto "Dimension" de un elemento "Node".
 *
 * @param {Element} node Elemento "Node".
 * @param {Array<*>} objectStack Objecto.
 * @return {Object} Dimension.
 * @public
 * @api
 */
function readDimension(node, objectStack) {
  const dimensionObject = {
    name: node.getAttribute('name'),
    units: node.getAttribute('units'),
    unitSymbol: node.getAttribute('unitSymbol'),
    default: node.getAttribute('default'),
    multipleValues: readBooleanString(node.getAttribute('multipleValues')),
    nearestValue: readBooleanString(node.getAttribute('nearestValue')),
    current: readBooleanString(node.getAttribute('current')),
    values: readString(node),
  };
  return dimensionObject;
}

/**
 * Este método obtiene el objeto "Online Resource" de un elemento "Node". 
 *
 * @param {Element} node Elemento "Node".
 * @param {Array<*>} objectStack Objecto.
 * @return {Object|undefined} Objeto "Online Resource".
 * @public
 * @api
 */
function readFormatOnlineresource(node, objectStack) {
  return pushParseAndPop({}, FORMAT_ONLINERESOURCE_PARSERS, node, objectStack);
}

/**
 * Este método obtiene el objeto "Request" de un elemento "Node".
 *
 * @param {Element} node Elemento "Node".
 * @param {Array<*>} objectStack Objecto.
 * @return {Object|undefined} Objeto "Request".
 * @public
 * @api
 */
function readRequest(node, objectStack) {
  return pushParseAndPop({}, REQUEST_PARSERS, node, objectStack);
}

/**
 * Este método obtiene el objeto "DCP Type" de un elemento "Node".
 *
 * @param {Element} node Elemento "Node".
 * @param {Array<*>} objectStack Objecto.
 * @return {Object|undefined} Objeto "DCP Type".
 * @public
 * @api
 */
function readDCPType(node, objectStack) {
  return pushParseAndPop({}, DCPTYPE_PARSERS, node, objectStack);
}

/**
 * Este método obtiene el objeto "HTTP" de un elemento "Node". 
 *
 * @param {Element} node Elemento "Node".
 * @param {Array<*>} objectStack Objecto.
 * @return {Object|undefined} Objeto "HTTP".
 * @public
 * @api
 */
function readHTTP(node, objectStack) {
  return pushParseAndPop({}, HTTP_PARSERS, node, objectStack);
}

/**
 * Este método obtiene el objeto "Operation Type" de un elemento "Node". 
 *
 * @param {Element} node Elemento "Node".
 * @param {Array<*>} objectStack Objecto.
 * @return {Object|undefined} Objeto "Operation Type".
 * @public
 * @api
 */
function readOperationType(node, objectStack) {
  return pushParseAndPop({}, OPERATIONTYPE_PARSERS, node, objectStack);
}

/**
 * Este método obtiene el objeto "Online Resource" de un elemento "Node".
 *
 * @param {Element} node Elemento "Node".
 * @param {Array<*>} objectStack Objecto.
 * @return {Object|undefined} Objeto "Online Resource".
 * @public
 * @api
 */
function readSizedFormatOnlineresource(node, objectStack) {
  const formatOnlineresource = readFormatOnlineresource(node, objectStack);
  if (formatOnlineresource) {
    const size = [
      readNonNegativeIntegerString(node.getAttribute('width')),
      readNonNegativeIntegerString(node.getAttribute('height')),
    ];
    formatOnlineresource.size = size;
    return formatOnlineresource;
  }
  return undefined;
}

/**
 * Este método obtiene el objeto "Authority URL" de un elemento "Node". 
 *
 * @param {Element} node Elemento "Node".
 * @param {Array<*>} objectStack Objecto.
 * @return {Object|undefined} Objeto "Authority URL".
 * @public
 * @api
 */
function readAuthorityURL(node, objectStack) {
  const authorityObject = readFormatOnlineresource(node, objectStack);
  if (authorityObject) {
    authorityObject.name = node.getAttribute('name');
    return authorityObject;
  }
  return undefined;
}

/**
 * Este método obtiene el objeto "Metadata URL" de un elemento "Node".
 * 
 * @param {Element} node Elemento "Node".
 * @param {Array<*>} objectStack Objecto.
 * @return {Object|undefined} Objeto "Metadata URL"
 * @public
 * @api
 */
function readMetadataURL(node, objectStack) {
  const metadataObject = readFormatOnlineresource(node, objectStack);
  if (metadataObject) {
    metadataObject.type = node.getAttribute('type');
    return metadataObject;
  }
  return undefined;
}

/**
 * Este método obtiene el objeto "Style" de un elemento "Node".
 *
 * @param {Element} node Elemento "Node".
 * @param {Array<*>} objectStack Objecto.
 * @return {Object|undefined} Objeto "Style".
 * @public
 * @api
 */
function readStyle(node, objectStack) {
  return pushParseAndPop({}, STYLE_PARSERS, node, objectStack);
}

/**
 * Este método obtiene el listado de "Keyword" de un elemento "Node".
 * 
 * @const
 * @param {Element} node Elemento "Node".
 * @param {Array<*>} objectStack Objecto.
 * @return {Array<string>|undefined} Listado de "Keyword".
 * @public
 * @api
 */
function readKeywordList(node, objectStack) {
  return pushParseAndPop([], KEYWORDLIST_PARSERS, node, objectStack);
}

export default WMSCapabilities;
