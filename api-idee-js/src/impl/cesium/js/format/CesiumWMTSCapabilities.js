/* eslint-disable */
/**
 * @module M/impl/format/WMTSCapabilities
 */
import OWS from './CesiumOWS';
import XML from './CesiumXML';
import {
  makeArrayPusher,
  makeObjectPropertyPusher,
  makeObjectPropertySetter,
  makeStructureNS,
  pushParseAndPop,
  readDecimal,
  readPositiveInteger,
  readString,
  readHref,
  boundingExtent,
} from '../util/xml';

/**
 * Colección de espacios de nombres identificados por una URI.
 * @public
 * @const
 * @type {Array<null|string>}
 */
const NAMESPACE_URIS = [null, 'http://www.opengis.net/wmts/1.0'];

/**
 * Colección de espacios de nombres identificados por una URI de OWS.
 * @public
 * @const
 * @type {Array<null|string>}
 */
const OWS_NAMESPACE_URIS = [null, 'http://www.opengis.net/ows/1.1'];

/**
 * Formateadores utilizados para obtener los objetos "Contents"
 * de la petición "GetCapabilities".
 * @public
 * @const
 */
const PARSERS = makeStructureNS(NAMESPACE_URIS, {
  Contents: makeObjectPropertySetter(readContents),
});

/**
 * @classdesc
 * Implementación de la clase WMTSCapabilities. Formato para obtener los datos
 * de la petición "GetCapabilities" de las capas WMTS.
 *
 * @api
 * @extends {M.impl.format.CesiumXML}
 */
class WMTSCapabilities extends XML {
  /**
   * Constructor principal de la clase. Crea un formateador para obtener los datos
   * de la petición "GetCapabilities" de las capas WMTS.
   *
   * @constructor
   * @api
   */
  constructor() {
    super();

    /**
     * Formateador OWS
     * @type {OWS}
     * @private
     */
    this.owsParser_ = new OWS();
  }

  /**
   * Este método obtiene un objeto basado en el elemento "Node" 
   * dado por parámetro.
   *
   * @const
   * @param {Element} node Elemento "Node".
   * @return {Object|null} Objeto basado en el elemento "Node"
   * dado por parámetro.
   * @public
   * @api
   */
  readFromNode(node) {
    let version = node.getAttribute('version');
    if (version) {
      version = version.trim();
    }
    let WMTSCapabilityObject = this.owsParser_.readFromNode(node);
    if (!WMTSCapabilityObject) {
      return null;
    }
    WMTSCapabilityObject.version = version;
    WMTSCapabilityObject = pushParseAndPop(
      WMTSCapabilityObject,
      PARSERS,
      node,
      [],
    );
    return WMTSCapabilityObject || null;
  }
}

/**
 * Formateadores utilizados para obtener los objetos correspondientes
 * del objeto "Contents" de la petición "GetCapabilities".
 * @public
 * @const
 */
const CONTENTS_PARSERS = makeStructureNS(NAMESPACE_URIS, {
  Layer: makeObjectPropertyPusher(readLayer),
  TileMatrixSet: makeObjectPropertyPusher(readTileMatrixSet),
});

/**
 * Formateadores utilizados para obtener los objetos correspondientes
 * del objeto "Layer" de la petición "GetCapabilities".
 * @public
 * @const
 */
const LAYER_PARSERS = makeStructureNS(
  NAMESPACE_URIS,
  {
    Style: makeObjectPropertyPusher(readStyle),
    Format: makeObjectPropertyPusher(readString),
    TileMatrixSetLink: makeObjectPropertyPusher(readTileMatrixSetLink),
    Dimension: makeObjectPropertyPusher(readDimensions),
    ResourceURL: makeObjectPropertyPusher(readResourceUrl),
  },
  makeStructureNS(OWS_NAMESPACE_URIS, {
    Title: makeObjectPropertySetter(readString),
    Abstract: makeObjectPropertySetter(readString),
    WGS84BoundingBox: makeObjectPropertySetter(readBoundingBox),
    BoundingBox: makeObjectPropertyPusher(readBoundingBoxWithCrs),
    Identifier: makeObjectPropertySetter(readString),
  }),
);

/**
 * Formateadores utilizados para obtener los objetos correspondientes
 * del objeto "Style" de la petición "GetCapabilities".
 * @public
 * @const
 */
const STYLE_PARSERS = makeStructureNS(
  NAMESPACE_URIS,
  {
    LegendURL: makeObjectPropertyPusher(readLegendUrl),
  },
  makeStructureNS(OWS_NAMESPACE_URIS, {
    Title: makeObjectPropertySetter(readString),
    Identifier: makeObjectPropertySetter(readString),
  }),
);

/**
 * Formateadores utilizados para obtener los objetos correspondientes
 * del objeto "TileMatrixSetLinks" de la petición "GetCapabilities".
 * @public
 * @const
 */
const TMS_LINKS_PARSERS = makeStructureNS(NAMESPACE_URIS, {
  TileMatrixSet: makeObjectPropertySetter(readString),
  TileMatrixSetLimits: makeObjectPropertySetter(readTileMatrixLimitsList),
});

/**
 * Formateadores utilizados para obtener los objetos correspondientes
 * del objeto "TileMatrixSetLimitsList" de la petición "GetCapabilities".
 * @public
 * @const
 */
const TMS_LIMITS_LIST_PARSERS = makeStructureNS(NAMESPACE_URIS, {
  TileMatrixLimits: makeArrayPusher(readTileMatrixLimits),
});

/**
 * Formateadores utilizados para obtener los objetos correspondientes
 * del objeto "TileMatrixSetLimits" de la petición "GetCapabilities".
 * @public
 * @const
 */
const TMS_LIMITS_PARSERS = makeStructureNS(NAMESPACE_URIS, {
  TileMatrix: makeObjectPropertySetter(readString),
  MinTileRow: makeObjectPropertySetter(readPositiveInteger),
  MaxTileRow: makeObjectPropertySetter(readPositiveInteger),
  MinTileCol: makeObjectPropertySetter(readPositiveInteger),
  MaxTileCol: makeObjectPropertySetter(readPositiveInteger),
});

/**
 * Formateadores utilizados para obtener los objetos correspondientes
 * del objeto "Dimension" de la petición "GetCapabilities".
 * @public
 * @const
 */
const DIMENSION_PARSERS = makeStructureNS(
  NAMESPACE_URIS,
  {
    Default: makeObjectPropertySetter(readString),
    Value: makeObjectPropertyPusher(readString),
  },
  makeStructureNS(OWS_NAMESPACE_URIS, {
    Identifier: makeObjectPropertySetter(readString),
  }),
);

/**
 * Formateadores utilizados para obtener los objetos correspondientes
 * del objeto "WGS84 BBOX" de la petición "GetCapabilities".
 * @public
 * @const
 */
const WGS84_BBOX_READERS = makeStructureNS(OWS_NAMESPACE_URIS, {
  LowerCorner: makeArrayPusher(readCoordinates),
  UpperCorner: makeArrayPusher(readCoordinates),
});

/**
 * Formateadores utilizados para obtener los objetos correspondientes
 * del objeto "TileMatrixSet" de la petición "GetCapabilities".
 * @public
 * @const
 */
const TMS_PARSERS = makeStructureNS(
  NAMESPACE_URIS,
  {
    WellKnownScaleSet: makeObjectPropertySetter(readString),
    TileMatrix: makeObjectPropertyPusher(readTileMatrix),
  },
  makeStructureNS(OWS_NAMESPACE_URIS, {
    SupportedCRS: makeObjectPropertySetter(readString),
    Identifier: makeObjectPropertySetter(readString),
    BoundingBox: makeObjectPropertySetter(readBoundingBox),
  }),
);

/**
 * Formateadores utilizados para obtener los objetos correspondientes
 * del objeto "Matrix" de la petición "GetCapabilities".
 * @public
 * @const
 */
const TM_PARSERS = makeStructureNS(
  NAMESPACE_URIS,
  {
    TopLeftCorner: makeObjectPropertySetter(readCoordinates),
    ScaleDenominator: makeObjectPropertySetter(readDecimal),
    TileWidth: makeObjectPropertySetter(readPositiveInteger),
    TileHeight: makeObjectPropertySetter(readPositiveInteger),
    MatrixWidth: makeObjectPropertySetter(readPositiveInteger),
    MatrixHeight: makeObjectPropertySetter(readPositiveInteger),
  },
  makeStructureNS(OWS_NAMESPACE_URIS, {
    Identifier: makeObjectPropertySetter(readString),
  }),
);

/**
 * Este método obtiene el objeto "Contents" de un elemento "Node".
 *
 * @param {Element} node Elemento "Node".
 * @param {Array<*>} objectStack Objeto.
 * @return {Object|undefined} Objeto "Contents".
 * @public
 * @api
 */
function readContents(node, objectStack) {
  return pushParseAndPop({}, CONTENTS_PARSERS, node, objectStack);
}

/**
 * Este método obtiene el objeto "Layer" de un elemento "Node".
 *
 * @param {Element} node Elemento "Node".
 * @param {Array<*>} objectStack Objeto.
 * @return {Object|undefined} Objeto "Layers".
 * @public
 * @api
 */
function readLayer(node, objectStack) {
  return pushParseAndPop({}, LAYER_PARSERS, node, objectStack);
}

/**
 * Este método obtiene el objeto "TileMatrixSet" de un elemento "Node".
 *
 * @param {Element} node Elemento "Node".
 * @param {Array<*>} objectStack Objeto.
 * @return {Object|undefined} Objeto "Tile Matrix Set".
 * @public
 * @api
 */
function readTileMatrixSet(node, objectStack) {
  return pushParseAndPop({}, TMS_PARSERS, node, objectStack);
}

/**
 * Este método obtiene el objeto "Style" de un elemento "Node".
 *
 * @param {Element} node Elemento "Node".
 * @param {Array<*>} objectStack Objeto.
 * @return {Object|undefined} Objeto "Style".
 * @public
 * @api
 */
function readStyle(node, objectStack) {
  const style = pushParseAndPop({}, STYLE_PARSERS, node, objectStack);
  if (!style) {
    return undefined;
  }
  const isDefault = node.getAttribute('isDefault') === 'true';
  style.isDefault = isDefault;
  return style;
}

/**
 * Este método obtiene el objeto "Tile Matrix Set Link" de un
 * elemento "Node".
 *
 * @param {Element} node Elemento "Node".
 * @param {Array<*>} objectStack Objeto.
 * @return {Object|undefined} Objeto "Tile Matrix Set Link".
 * @public
 * @api
 */
function readTileMatrixSetLink(node, objectStack) {
  return pushParseAndPop({}, TMS_LINKS_PARSERS, node, objectStack);
}

/**
 * Este método obtiene el objeto "Dimension" de un elemento "Node".
 *
 * @param {Element} node Elemento "Node".
 * @param {Array<*>} objectStack Objeto.
 * @return {Object|undefined} Objeto "Dimension".
 * @public
 * @api
 */
function readDimensions(node, objectStack) {
  return pushParseAndPop({}, DIMENSION_PARSERS, node, objectStack);
}

/**
 * Este método obtiene el objeto "Resource URL" de un elemento "Node".
 *
 * @param {Element} node Elemento "Node".
 * @param {Array<*>} objectStack Objeto.
 * @return {Object|undefined} Objeto "Resource URL".
 * @public
 * @api
 */
function readResourceUrl(node, objectStack) {
  const format = node.getAttribute('format');
  const template = node.getAttribute('template');
  const resourceType = node.getAttribute('resourceType');
  const resource = {};
  if (format) {
    resource.format = format;
  }
  if (template) {
    resource.template = template;
  }
  if (resourceType) {
    resource.resourceType = resourceType;
  }
  return resource;
}

/**
 * Este método obtiene el objeto "Bbox" de un elemento "Node".
 *
 * @param {Element} node Elemento "Node".
 * @param {Array<*>} objectStack Objeto.
 * @return {Object|undefined} Objeto "BBox".
 * @public
 * @api
 */
function readBoundingBox(node, objectStack) {
  const coordinates = pushParseAndPop(
    [],
    WGS84_BBOX_READERS,
    node,
    objectStack,
  );
  if (coordinates.length !== 2) {
    return undefined;
  }
  return boundingExtent(coordinates);
}

/**
 * Este método obtiene el objeto "Bbox" con el atributo "CRS" de
 * un elemento "Node".
 *
 * @param {Element} node Elemento "Node".
 * @param {Array<*>} objectStack Objeto.
 * @return {Object|undefined} Objeto "BBox" con CRS.
 * @public
 * @api
 */
function readBoundingBoxWithCrs(node, objectStack) {
  const crs = node.getAttribute('crs');
  const coordinates = pushParseAndPop(
    [],
    WGS84_BBOX_READERS,
    node,
    objectStack,
  );
  if (coordinates.length !== 2) {
    return undefined;
  }
  return { extent: boundingExtent(coordinates), crs };
}

/**
 * Este método obtiene el objeto "Legend URL" de un elemento
 * "Node".
 *
 * @param {Element} node Elemento "Node".
 * @param {Array<*>} objectStack Objeto.
 * @return {Object|undefined} Objeto "Legend URL".
 * @public
 * @api
 */
function readLegendUrl(node, objectStack) {
  const legend = {};
  legend.format = node.getAttribute('format');
  legend.href = readHref(node);
  return legend;
}

/**
 * Este método obtiene el objeto "Coordinates" de un elemento "Node".
 *
 * @param {Node} node Elemento "Node".
 * @param {Array<*>} objectStack Objeto.
 * @return {Object|undefined} Objeto "Coordinates".
 * @public
 * @api
 */
function readCoordinates(node, objectStack) {
  const coordinates = readString(node).split(/\s+/);
  if (!coordinates || coordinates.length !== 2) {
    return undefined;
  }
  const x = +coordinates[0];
  const y = +coordinates[1];
  if (Number.isNaN(x) || Number.isNaN(y)) {
    return undefined;
  }
  return [x, y];
}

/**
 * Este método obtiene el objeto "TileMatrix" de un elemento "Node".
 *
 * @param {Element} node Elemento "Node".
 * @param {Array<*>} objectStack Objeto.
 * @return {Object|undefined} Objeto "TileMatrix".
 * @public
 * @api
 */
function readTileMatrix(node, objectStack) {
  return pushParseAndPop({}, TM_PARSERS, node, objectStack);
}

/**
 * Este método obtiene el objeto "TileMatrixSetLimits" de un elemento
 * "Node".
 *
 * @param {Element} node Elemento "Node".
 * @param {Array<*>} objectStack Objeto.
 * @return {Object|undefined} Objeto "TileMatrixSetLimits".
 * @public
 * @api
 */
function readTileMatrixLimitsList(node, objectStack) {
  return pushParseAndPop([], TMS_LIMITS_LIST_PARSERS, node, objectStack);
}

/**
 * Este método obtiene el array "TileMatrixLimits" de un elemento "Node".
 *
 * @param {Element} node Elemento "Node".
 * @param {Array<*>} objectStack Objeto.
 * @return {Array|undefined} Array "TileMatrixLimits".
 * @public
 * @api
 */
function readTileMatrixLimits(node, objectStack) {
  return pushParseAndPop({}, TMS_LIMITS_PARSERS, node, objectStack);
}

export default WMTSCapabilities;
