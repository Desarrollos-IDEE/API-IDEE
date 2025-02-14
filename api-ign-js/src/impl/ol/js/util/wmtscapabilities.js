/* eslint-disable no-console */
/**
 * Este módulo contiene funciones para obtener la extensión de una capa WMTS.
 * @module M/impl/util/wmtscapabilities
 */
import WMTS from 'M/layer/WMTS';
import { isArray, isNullOrEmpty, isObject } from 'M/util/Utils';
import { get as getProj } from 'ol/proj';
import ImplUtils from './Utils';

/**
  * Este método calcula recursivamente la extensión de
  * una capa específica a partir de su 'GetCapabilities'.
  *
  * @function
  * @param {Mx.GetCapabilities} layer Lista de capas disponibles en el servicio.
  * @param {String} layerName  Nombre de la capa.
  * @param {String} code Código de la proyección.
  * @returns {Array<Number>} Extensión.
  * @public
  * @api
  */
const getExtentRecursive = (layer, layerName, code, defaultExtent) => {
  let extent = null;
  if (!isNullOrEmpty(layer)) {
    if (isArray(layer)) {
      for (let i = 0; i < layer.length && extent === null; i += 1) {
        extent = getExtentRecursive(layer[i], layerName, code, defaultExtent);
      }
    } else if (isObject(layer)) {
      // base case
      if (isNullOrEmpty(layerName) || (layer.Identifier === layerName)) {
        extent = layer.WGS84BoundingBox;
        if (!extent) {
          extent = defaultExtent;
        } else {
          const extentProj = getProj('EPSG:4326');
          const oldProj = getProj(code);
          extent = ImplUtils.transformExtent(extent, extentProj, oldProj);
        }
      }
    }
  }
  return extent;
};

/**
  * Este método obtiene las capas WMTS a partir de su 'GetCapabilities'.
  *
  * @function
  * @param {Mx.GetCapabilities} layer Lista de capas disponibles.
  * @param {String} urlService URL del WMTS.
  * @param {String} EPSGcode Código de la proyección.
  * @param {Mx.GetCapabilities} capabilities Metadatos sobre el servicio.
  * @returns {Array<M.Layer>} Capas WMTS.
  * @public
  * @api
  */
const getLayersRecursive = (layer, urlService, EPSGcode, capabilities) => {
  let layers = [];

  if (!isNullOrEmpty(layer.Layer)) {
    layers = getLayersRecursive(layer.Layer);
  } else if (isArray(layer)) {
    layer.forEach((layerElem) => {
      layers = layers.concat(getLayersRecursive(layerElem, urlService, EPSGcode, capabilities));
    });
  } else {
    const listMatrixSetCapabilities = layer.TileMatrixSetLink;
    let EPSGcodeToMatrixSet = EPSGcode;

    if (EPSGcode === 'EPSG:3857') {
      if (!listMatrixSetCapabilities.includes('EPSG:3857')) {
        EPSGcodeToMatrixSet = 'GoogleMapsCompatible';
      }
    }

    layers.push(new WMTS({
      url: urlService,
      name: layer.Identifier,
      matrixSet: EPSGcodeToMatrixSet,
      legend: !isNullOrEmpty(layer.Title) ? layer.Title : '',
    }, {}, {
      capabilitiesMetadata: {
        abstract: !isNullOrEmpty(layer.Abstract) ? layer.Abstract : '',
        attribution: !isNullOrEmpty(capabilities.ServiceProvider) ? capabilities.ServiceProvider : '',
        style: !isNullOrEmpty(layer.Style) ? layer.Style : '',
      },
    }));
  }
  return layers;
};

/**
  * Este método obtiene las capas WMTS a partir de su 'GetCapabilities'.
  *
  * @function
  * @param {Mx.GetCapabilities} capabilities Metadatos sobre el servicio.
  * @param {String} url URL del WMTS.
  * @param {String} EPSGcode Código de la proyección.
  * @returns {Array<M.Layer>} Capas WMTS.
  * @public
  * @example import { getLayers } from 'impl/util/wmtscapabilities';
  * @api
  */
export const getLayers = (capabilities, url, EPSGcode) => {
  return getLayersRecursive(capabilities.Contents.Layer, url, EPSGcode, capabilities);
};

/**
  * Este método calcula la extensión de una capa
  * específica a partir de su 'GetCapabilities'.
  *
  * @function
  * @param {Mx.GetCapabilities} parsedCapabilities Metadatos sobre el servicio.
  * @param {String} name Nombre de la capa.
  * @param {String} code Código de la proyección.
  * @returns {Array<Number>} Extensión.
  * @public
  * @example import getLayerExtent from 'impl/util/wmtscapabilities';
  * @api
  */
const getLayerExtent = (parsedCapabilities, name, code, defaultExtent) => {
  return getExtentRecursive(parsedCapabilities.Layer, name, code, defaultExtent);
};

export default getLayerExtent;
