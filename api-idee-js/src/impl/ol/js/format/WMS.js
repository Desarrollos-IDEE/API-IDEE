/**
 * @module M/impl/format/WMSCapabilities
 */
import { isArray, isNullOrEmpty, isObject } from 'M/util/Utils';
import OLFormatWMSCapabilities from 'ol/format/WMSCapabilities';

/**
  * Nombre de los nodos para transmitir de padres a hijos.
  * @const
  * @type {Array<String>}
  * @public
  * @api
  */
const PROPAGATED_ELEMENTS = [
  'SRS',
  'BoundingBox',
  'ScaleHint',
  'LatLonBoundingBox',
];

/**
  * Este método devuelve verdadero si un nodo tiene un hijo
  * directo con un nombre igual al del parámetro "childName".
  *
  * @function
  * @param {Node} node Nodo.
  * @param {String} childName Nombre de un posible hijo.
  * @returns {Bool} Verdadero si un nodo tiene un hijo directo.
  * igual a "childName", en caso contrario es falso.
  * @public
  * @api
  */
const hasChild = (node, childName) => {
  const childNodes = Array.prototype.filter
    .call(node.children, (element) => element.tagName === childName);
  return childNodes.length > 0;
};

/**
  * Este método propaga del nodo principal al secundario todos los nodos
  * definidos en la constante "PROPAGATED_ELEMENTS".
  *
  * @function
  * @param {Node} parentNode Nodo padre.
  * @param {Node} nodeChild Nodo hijo.
  * @public
  * @api
  */
const propagateNodeLayer = (parentNode, nodeChild) => {
  if (parentNode !== null) {
    PROPAGATED_ELEMENTS.forEach((elementName) => {
      if (!hasChild(nodeChild, elementName)) {
        const nodes = Array.prototype.filter
          .call(parentNode.children, (element) => element.tagName === elementName);
        nodes.forEach((node) => {
          const cloneNode = node.cloneNode(true);
          nodeChild.appendChild(cloneNode);
        });
      }
    });
  }
};

/**
  * Este método devuelve un objeto donde cada clave es el nombre de una
  * capa del documento WMS y su valor es el nodo XML que la representa.
  *
  * @function
  * @param {Node} wmsNode Nodo WMS.
  * @param {Bool} isRoot Indica si el nodo WMS es elemento raíz. Por
  * defecto es verdadero.
  * @param {Object} rootObj Objeto.
  * @param {Node|null} parent Padre del nodo.
  * @returns {Object} Objeto con nombre de la capa como clave y nodo XML
  * como valor.
  * @public
  * @api
  */
const layerNodeToJSON = (wmsNode, isRoot = true, rootObj = {}, parent = null) => {
  let rootObjVar = rootObj;
  let node = wmsNode;
  if (isRoot === true && wmsNode !== null) {
    node = wmsNode.querySelector('Layer');
  }
  if (node !== null) {
    propagateNodeLayer(parent, node);
    const name = node.querySelector('Name').innerHTML;
    const children = node.children;
    Array.prototype.forEach.call(children, (child) => {
      if (child.tagName === 'Layer') {
        rootObjVar = layerNodeToJSON(child, false, rootObjVar, node);
      }
    });
    rootObjVar[name] = node;
  }
  return rootObjVar;
};

/**
  * Este método analiza el nodo personalizado SRS de WMS.
  *
  * @function
  * @param {Object} objLayer Objeto de la capa.
  * @param {Object} parsedLayerNodes Nodo de la capa.
  * @public
  * @api
  */
const parseSRS = (objLayer, parsedLayerNodes) => {
  const objLayerParam = objLayer;
  const nodeLayer = parsedLayerNodes[objLayerParam.Name];
  if (!isNullOrEmpty(nodeLayer)) {
    const SRS = nodeLayer.querySelector('SRS');
    if (SRS !== null) {
      const innerHTML = SRS.innerHTML;
      objLayerParam.SRS = [innerHTML];
    }
  } else if (isArray(objLayerParam.Layer)) {
    objLayerParam.Layer.forEach((objLayerChild) => parseSRS(objLayerChild, parsedLayerNodes));
  }
};

/**
  * Este método analiza el nodo personalizado "BoundingBox" y el atributo "SRS" de WMS
  *
  * @function
  * @param {Object} objLayer Objeto de la capa.
  * @param {Object} parsedLayerNodes Nodo de la capa.
  * @public
  * @api
  */
const parseBoundingBox = (objLayer, parsedLayerNodes) => {
  const nodeLayer = parsedLayerNodes[objLayer.Name];
  if (!isNullOrEmpty(nodeLayer)) {
    if (isArray(objLayer.BoundingBox)) {
      let bboxChilds = Array.prototype.map.call(nodeLayer.children, (element) => element);
      bboxChilds = bboxChilds.filter((element) => ['BoundingBox'].includes(element.tagName));

      objLayer.BoundingBox.forEach((objBbox, index) => {
        const objBboxParam = objBbox;
        if (objBboxParam.crs === null) {
          const bboxNode = bboxChilds[index];
          if (!isNullOrEmpty(bboxNode)) {
            const srs = bboxNode.getAttribute('SRS');
            if (!isNullOrEmpty(srs)) {
              objBboxParam.crs = srs;
            }
          }
        }
      });
    }
  } else if (isArray(objLayer.Layer)) {
    objLayer.Layer.forEach((objLayerChild) => parseBoundingBox(objLayerChild, parsedLayerNodes));
  }
};

/**
  * Este método analiza el nodo personalizado "ScaleHint" de WMS.
  *
  * @function
  * @param {Object} objLayer Objeto de la capa.
  * @param {Object} parsedLayerNodes Nodo de la capa.
  * @public
  * @api
  */
const parseScaleHint = (objLayer, parsedLayerNodes) => {
  const objLayerParam = objLayer;
  const nodeLayer = parsedLayerNodes[objLayer.Name];
  if (!isNullOrEmpty(nodeLayer)) {
    objLayerParam.ScaleHint = [];
    let scaleHints = Array.prototype.map.call(nodeLayer.children, (element) => element);
    scaleHints = scaleHints.filter((element) => element.tagName === 'ScaleHint');
    scaleHints.forEach((scaleHint) => {
      const minScale = parseFloat(scaleHint.getAttribute('min'));
      const maxScale = parseFloat(scaleHint.getAttribute('max'));
      const obj = {
        minScale,
        maxScale,
      };
      objLayerParam.ScaleHint.push(obj);
    });
  } else if (isArray(objLayer.Layer)) {
    objLayer.Layer.forEach((objLayerChild) => parseScaleHint(objLayerChild, parsedLayerNodes));
  }
};

/**
  * Este método analiza el nodo personalizado "LatLonBoundingBox" del WMS.
  *
  * @function
  * @param {Object} objLayer Objeto de la capa.
  * @param {Object} parsedLayerNodes Nodo de la capa.
  * @public
  * @api
  */
const parseLatLonBoundingBox = (objLayer, parsedLayerNodes) => {
  const objLayerParam = objLayer;
  const nodeLayer = parsedLayerNodes[objLayer.Name];
  if (!isNullOrEmpty(nodeLayer)) {
    objLayerParam.LatLonBoundingBox = [];
    let latLonBboxes = Array.prototype.map.call(nodeLayer.children, (element) => element);
    latLonBboxes = latLonBboxes.filter((element) => element.tagName === 'LatLonBoundingBox');
    latLonBboxes.forEach((latlonBbox) => {
      const extent = [
        parseFloat(latlonBbox.getAttribute('minx')),
        parseFloat(latlonBbox.getAttribute('miny')),
        parseFloat(latlonBbox.getAttribute('maxx')),
        parseFloat(latlonBbox.getAttribute('maxy')),
      ];
      const obj = {
        crs: 'EPSG:4326',
        extent,
      };
      objLayerParam.LatLonBoundingBox.push(obj);
    });
  } else if (isArray(objLayerParam.Layer)) {
    objLayerParam.Layer
      .forEach((objLayerChild) => parseLatLonBoundingBox(objLayerChild, parsedLayerNodes));
  }
};

/**
  * Este método reemplaza "BoundingBox" (si BoundingBox es nulo) por
  * 'LatLonBoundinBox' en la capa.
  *
  * @function
  * @param {Object} objLayer Objeto de la capa.
  * @param {Object} parsedLayerNodes Nodo de la capa.
  * @public
  * @api
  */
const replaceBoundingBox = (objLayer, parsedLayerNodes) => {
  const objLayerParam = objLayer;
  // replaces the BoundingBox by LatLonBoundinBox
  const latLonBoundingBoxProp = 'LatLonBoundingBox';
  const boundingBoxProp = 'BoundingBox';
  if (isNullOrEmpty(objLayerParam[boundingBoxProp])
    && !isNullOrEmpty(objLayerParam[latLonBoundingBoxProp])) {
    objLayerParam[boundingBoxProp] = objLayerParam[latLonBoundingBoxProp];
  }
};

/**
  * Este método reemplaza "maxScale" (si maxScale es nulo) por
  * 'ScaleHint' en la capa.
  *
  * @function
  * @param {Object} objLayer Objeto de la capa.
  * @param {Object} parsedLayerNodes Nodo de la capa.
  * @public
  * @api
  */
const replaceMaxScaleDenominator = (objLayer, parsedLayerNodes) => {
  const objLayerParam = objLayer;
  const maxScaleDenominatorProp = 'MaxScaleDenominator';
  if (isNullOrEmpty(objLayerParam[maxScaleDenominatorProp])
    && !isNullOrEmpty(objLayerParam.ScaleHint)) {
    objLayerParam[maxScaleDenominatorProp] = objLayerParam.ScaleHint[0].maxScale;
  }
};

/**
  * Este método reemplaza "minScale" (si minScale es nulo) por
  * "ScaleHint" en la capa.
  *
  * @function
  * @param {Object} objLayer Objeto de la capa.
  * @param {Object} parsedLayerNodes Nodo de la capa.
  * @public
  * @api
  */
const replaceMinScaleDenominator = (objLayer, parsedLayerNodes) => {
  const objLayerParam = objLayer;
  const minScaleDenominatorProp = 'MinScaleDenominator';
  if (isNullOrEmpty(objLayerParam[minScaleDenominatorProp])
    && !isNullOrEmpty(objLayerParam.ScaleHint)) {
    objLayerParam[minScaleDenominatorProp] = objLayerParam.ScaleHint[0].minScale;
  }
};

/**
  * Analizadores para aplicar al documento WMS.
  *
  * @const
  * @type {Array<Function>}
  * @public
  * @api
  */
const LAYER_PARSERS = [
  parseSRS,
  parseBoundingBox,
  parseScaleHint,
  parseLatLonBoundingBox,
  replaceBoundingBox,
  replaceMaxScaleDenominator,
  replaceMinScaleDenominator,
];

/**
  * Este método aplica todos los analizadores a una capa.
  *
  * @function
  * @param {Object} objLayer Objeto de la capa.
  * @param {Object} parsedLayerNodes Nodo de la capa.
  * @public
  * @api
  */
const parserLayerProps = (objLayer, parsedLayerNodes) => {
  LAYER_PARSERS.forEach((parser) => {
    parser(objLayer, parsedLayerNodes);
  });
};

/**
  * Este método aplica todos los analizadores a cada capa.
  *
  * @function
  * @param {Object} objLayer Objeto de la capa.
  * @param {Object} parsedLayerNodes Nodo de la capa.
  * @public
  * @api
  */
const parseLayersProps = (objLayer, parsedLayerNodes) => {
  if (isArray(objLayer)) {
    objLayer.forEach((layer) => {
      parseLayersProps(layer, parsedLayerNodes);
    });
  } else if (isObject(objLayer)) {
    parserLayerProps(objLayer, parsedLayerNodes);
    parseLayersProps(objLayer.Layer, parsedLayerNodes);
  }
};

/**
  * @classdesc
  * Implementación del formateador WMS.
  *
  * @api
  * @extends {ol.format.WMSCapabilities}
  */
class WMSCapabilities extends OLFormatWMSCapabilities {
  /**
    * Este método lee algunas propiedades personalizadas
    * que no siguen el estándar de las capas WMS.
    *
    * @function
    * @param {XMLDocument} wmsDocument XML de WMS.
    * @returns {Object} Capa.
    * @public
    * @api
    */
  customRead(wmsDocument) {
    const formatedWMS = this.read(wmsDocument);
    const parsedLayerNodes = layerNodeToJSON(wmsDocument);
    const capabilityObj = formatedWMS.Capability;
    if (!isNullOrEmpty(capabilityObj) && !isNullOrEmpty(capabilityObj.Layer)) {
      parseLayersProps(capabilityObj.Layer, parsedLayerNodes);
    }
    return formatedWMS;
  }
}

export default WMSCapabilities;
