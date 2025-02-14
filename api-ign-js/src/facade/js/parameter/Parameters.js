/**
 * @module M/Parameters
 */
import {
  isUndefined, isArray, isNullOrEmpty, isObject, isString, getParameterValue,
} from '../util/Utils';
import Exception from '../exception/exception';
import { getValue } from '../i18n/language';

/**
 * Esta función analiza un parámetro de contenedor en un formato legible.
 * parámetro a API-CNIG y chequea posibles errores.
 * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
 * @public
 * @function
 * @param {string|Mx.parameters.Map} userParameters Parámetros.
 * @returns {Object} Contenedor.
 * @api
 */

export const parseContainer = (userParameters) => {
  let container;
  if (isString(userParameters)) {
    container = document.getElementById(userParameters);
  } else if (isObject(userParameters)) {
    if (!isNullOrEmpty(userParameters.id)) {
      container = document.getElementById(userParameters.id);
    } else if (!isNullOrEmpty(userParameters.container)) {
      container = parseContainer(userParameters.container);
    } else {
      Exception(getValue('exception').no_container);
    }
  } else {
    Exception(`El tipo del parámetro container no es válido: ${typeof userParameters}`);
  }
  if (isNullOrEmpty(container)) {
    Exception(getValue('exception').no_id_container);
  }
  return container;
};

/**
 * Esta función analiza un parámetro de capa en un formato legible.
 * parámetro a API-CNIG y chequea posibles errores.
 * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
 * @public
 * @function
 * @param {string|Mx.parameters.Map} parameter Parámetros.
 * @returns {string|Object|Array<string|Object>} Capas.
 * @api
 */
export const parseLayers = (parameter) => {
  let layers;

  if (isString(parameter)) {
    layers = getParameterValue('layers', parameter);
  } else if (isObject(parameter)) {
    layers = parameter.layers;
  } else {
    Exception(`El tipo del parámetro container no es válido: ${typeof parameter}`);
  }

  return layers;
};

/**
 * Esta función analiza un parámetro wmc en un formato legible
 * parámetro a API-CNIG y chequea posibles errores.
 * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
 * @public
 * @function
 * @param {string|Mx.parameters.Map} parameter Parámetros.
 * @returns {string|Object|Array<string|Object>} Capas.
 * @api
 */
export const parseWMC = (parameter) => {
  let wmc;

  if (isString(parameter)) {
    wmc = getParameterValue('wmc', parameter);
    if (isNullOrEmpty(wmc)) {
      wmc = getParameterValue('wmcfile', parameter);
    }
    if (isNullOrEmpty(wmc)) {
      wmc = getParameterValue('wmcfiles', parameter);
    }
  } else if (isObject(parameter)) {
    wmc = parameter.wmc;
    if (isNullOrEmpty(wmc)) {
      wmc = parameter.wmcfile;
    }
    if (isNullOrEmpty(wmc)) {
      wmc = parameter.wmcfiles;
    }
  } else {
    Exception(`El tipo del parámetro container no es válido: ${typeof parameter}`);
  }
  return wmc;
};

/**
 * Esta función analiza un parámetro wms en un formato legible
 * parámetro a API-CNIG y chequea posibles errores.
 * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
 * @public
 * @function
 * @param {string|Mx.parameters.Map} parameter Parámetros.
 * @returns {string|Object|Array<string|Object>} Capas.
 * @api
 */
export const parseWMS = (parameter) => {
  let wms;

  if (isString(parameter)) {
    wms = getParameterValue('wms', parameter);
  } else if (isObject(parameter)) {
    wms = parameter.wms;
  } else {
    Exception(`El tipo del parámetro container no es válido: ${typeof parameter}`);
  }
  return wms;
};
/**
 * Esta función analiza un parámetro wmts en un formato legible
 * parámetro a API-CNIG y chequea posibles errores.
 * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
 * @public
 * @function
 * @param {string|Mx.parameters.Map} parameter Parámetros.
 * @returns {string|Object|Array<string|Object>} Capas.
 * @api
 */
export const parseWMTS = (parameter) => {
  let wmts;

  if (isString(parameter)) {
    wmts = getParameterValue('wmts', parameter);
  } else if (isObject(parameter)) {
    wmts = parameter.wmts;
  } else {
    Exception(`El tipo del parámetro container no es válido: ${typeof parameter}`);
  }

  return wmts;
};

/**
 * Esta función analiza un parámetro kml en un formato legible
 * parámetro a API-CNIG y chequea posibles errores.
 * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
 * @public
 * @function
 * @param {string|Mx.parameters.Map} parameter Parámetros.
 * @returns {string|Object|Array<string|Object>} Capas.
 * @api
 */
export const parseKML = (parameter) => {
  let kml;

  if (isString(parameter)) {
    kml = getParameterValue('kml', parameter);
  } else if (isObject(parameter)) {
    kml = parameter.kml;
  } else {
    Exception(`El tipo del parámetro container no es válido: ${typeof parameter}`);
  }

  return kml;
};

/**
 * Esta función analiza un parámetro de control en un formato legible
 * parámetro a API-CNIG y chequea posibles errores.
 * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
 * @public
 * @function
 * @param {string|Mx.parameters.Map} parameter Parámetros.
 * @returns {string|Object|Array<string|Object>} Capas.
 * @api
 */
export const parseControls = (parameter) => {
  let controls;

  if (isString(parameter)) {
    controls = getParameterValue('controls', parameter);
  } else if (isObject(parameter)) {
    controls = parameter.controls;
  } else {
    Exception(`El tipo del parámetro controls no es válido: ${typeof parameter}`);
  }

  return controls;
};

/**
 * Esta función analiza un parámetro de control en un formato legible
 * parámetro a API-CNIG y chequea posibles errores.
 * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
 * @public
 * @function
 * @param {string|Mx.parameters.Map} parameter Parámetros.
 * @returns {string|Object|Array<string|Object>} Capas.
 * @api
 */
export const parseGetFeatureInfo = (parameter) => {
  let getFeatureInfo;

  if (isString(parameter)) {
    getFeatureInfo = getParameterValue('getfeatureinfo', parameter);
  } else if (isObject(parameter)) {
    getFeatureInfo = parameter.getfeatureinfo;
    if (!isUndefined(getFeatureInfo) && isNullOrEmpty(getFeatureInfo)) {
      getFeatureInfo = 'plain';
    }
  } else {
    Exception(`El tipo del parámetro controls no es válido: ${typeof parameter}`);
  }

  return getFeatureInfo;
};

/**
 * Esta función analiza un parámetro "maxExtent" en un formato legible
 * parámetro a API-CNIG y chequea posibles errores.
 * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
 * @public
 * @function
 * @param {string|Mx.parameters.Map} parameter Parámetros.
 * @returns {String|Array<String>|Array<Number>|Mx.Extent} "maxExtent".
 * @api
 */
export const parseMaxExtent = (parameter) => {
  let maxExtent;

  if (isString(parameter)) {
    maxExtent = getParameterValue('maxExtent', parameter);
    if (isNullOrEmpty(maxExtent)) {
      maxExtent = getParameterValue('maxextent', parameter);
    }
  } else if (isObject(parameter)) {
    maxExtent = parameter.maxExtent;
    if (isNullOrEmpty(maxExtent)) {
      maxExtent = parameter.maxextent;
    }
  } else {
    Exception(`El tipo del parámetro container no es válido: ${typeof parameter}`);
  }
  return maxExtent;
};

/**
 * Esta función analiza un parámetro "bbox" en un formato legible
 * parámetro a API-CNIG y chequea posibles errores.
 * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
 * @public
 * @function
 * @param {string|Mx.parameters.Map} parameter Parámetros.
 * @returns {String|Array<String>|Array<Number>|Mx.Extent} Devuelve el "bbox".
 * @api
 */
export const parseBbox = (parameter) => {
  let bbox;

  if (isString(parameter)) {
    bbox = getParameterValue('bbox', parameter);
  } else if (isObject(parameter)) {
    bbox = parameter.bbox;
  } else {
    Exception(`El tipo del parámetro container no es válido: ${typeof parameter}`);
  }

  return bbox;
};

/**
 * Esta función analiza un parámetro de zoom en un formato legible.
 * parámetro a API-CNIG y chequea posibles errores.
 * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
 * @public
 * @function
 * @param {string|Mx.parameters.Map} parameter Parámetros.
 * @returns {String|Array<String>|Array<Number>|Mx.Extent} zoom.
 * @api
 */
export const parseZoom = (parameter) => {
  let zoom;

  if (isString(parameter)) {
    zoom = getParameterValue('zoom', parameter);
  } else if (isObject(parameter)) {
    zoom = parameter.zoom;
  } else {
    Exception(`El tipo del parámetro zoom no es válido: ${typeof parameter}`);
  }

  return zoom;
};

/**
 * Esta función analiza un parámetro de zoom máximo en un formato legible.
 * parámetro a API-CNIG y chequea posibles errores.
 * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
 * @public
 * @function
 * @param {string|Mx.parameters.Map} parameter Parámetros.
 * @returns {String|Array<String>|Array<Number>|Mx.Extent} Zoom máximo.
 * established by the user
 * @api
 */
export const parseMaxZoom = (parameter) => {
  let maxZoom;

  if (isString(parameter)) {
    maxZoom = getParameterValue('maxZoom', parameter);
  } else if (isObject(parameter)) {
    maxZoom = parameter.maxZoom;
  } else {
    Exception(`El tipo del parámetro maxZoom no es válido: ${typeof parameter}`);
  }

  return maxZoom;
};

/**
 *  Esta función analiza un parámetro de zoom mínimo en un formato legible.
 * parámetro a API-CNIG y chequea posibles errores.
 * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
 * @public
 * @function
 * @param {string|Mx.parameters.Map} parameter Parámetros.
 * @returns {String|Array<String>|Array<Number>|Mx.Extent} Zoom mínimo.
 * @api
 */
export const parseMinZoom = (parameter) => {
  let minZoom;

  if (isString(parameter)) {
    minZoom = getParameterValue('minZoom', parameter);
  } else if (isObject(parameter)) {
    minZoom = parameter.minZoom;
  } else {
    Exception(`El tipo del parámetro minZoom no es válido: ${typeof parameter}`);
  }

  return minZoom;
};

/**
 * Esta función analiza un parámetro "center" en un formato legible.
 * parámetro a API-CNIG y chequea posibles errores.
 * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
 *
 * @public
 * @function
 * @param {string|Mx.parameters.Map} parameter Parámetros.
 * @returns {String|Array<String>|Array<Number>|Mx.Extent} Devuelve el centro.
 * @api
 */
export const parseCenter = (parameter) => {
  let center;

  if (isString(parameter)) {
    center = getParameterValue('center', parameter);
  } else if (isObject(parameter)) {
    center = parameter.center;
  } else {
    Exception(`El tipo del parámetro center no es válido: ${typeof parameter}`);
  }

  return center;
};

/**
 * Esta función analiza un parámetro de "ticket" en un formato legible.
 * parámetro a API-CNIG y chequea posibles errores.
 *
 * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
 *
 * @public
 * @function
 * @param {string|Mx.parameters.Map} parameter Parámetros.
 * @returns {String} Devuelve el "ticket".
 * @api
 */
export const parseTicket = (parameter) => {
  let ticket;

  if (isString(parameter)) {
    ticket = getParameterValue('ticket', parameter);
  } else if (isObject(parameter)) {
    ticket = parameter.ticket;
  } else {
    Exception(`El tipo del parámetro ticket no es válido: ${typeof parameter}`);
  }

  return ticket;
};

/**
 * Esta función analiza un parámetro de "zoomConstrains" en un formato legible.
 * parámetro a API-CNIG y chequea posibles errores.
 *
 * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
 *
 * @public
 * @function
 * @param {string|Mx.parameters.Map} parameter Parámetros.
 * @returns {String} Devuelve el "zoomConstrains".
 * @api
 */
export const parseZoomConstrains = (parameter) => {
  let zoomConstrains;

  if (isString(parameter)) {
    zoomConstrains = getParameterValue('zoomConstrains', parameter);
  } else if (isObject(parameter)) {
    zoomConstrains = parameter.zoomConstrains;
  } else {
    Exception(`El tipo del parámetro zoomConstrains no es válido: ${typeof parameter}`);
  }

  return zoomConstrains;
};

/**
 * Esta función analiza un parámetro de resolución en un formato legible.
 * parámetro a API-CNIG y chequea posibles errores.
 * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
 * @public
 * @function
 * @param {string|Mx.parameters.Map} parameter Parámetros.
 * @returns {String|Array<String>|Array<Number>} Devuelve las resoluciones.
 * @api
 */
export const parseResolutions = (parameter) => {
  let resolutions;

  if (isString(parameter)) {
    resolutions = getParameterValue('resolutions', parameter);
  } else if (isObject(parameter)) {
    resolutions = parameter.resolutions;
  } else {
    Exception(`El tipo del parámetro container no es válido: ${typeof parameter}`);
  }

  return resolutions;
};

/**
 * Esta función analiza un parámetro de proyección en un formato legible.
 * parámetro a API-CNIG y chequea posibles errores.
 * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
 * @public
 * @function
 * @param {string|Mx.parameters.Map} parameter Parámetros.
 * @returns {String|Array<String>|Array<Number>|Mx.Extent} Proyección.
 * @api
 */
export const parseProjection = (parameter) => {
  let projection;
  if (isString(parameter)) {
    projection = getParameterValue('projection', parameter);
  } else if (isObject(parameter)) {
    projection = parameter.projection;
  } else {
    Exception(`El tipo del parámetro container no es válido: ${typeof parameter}`);
  }

  return projection;
};

/**
 * Esta función analiza un parámetro de proyección en un formato legible.
 * parámetro a API-CNIG y chequea posibles errores.
 * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
 * @public
 * @function
 * @param {string|Mx.parameters.Map} parameter Parámetros.
 * @returns {String|Array<String>|Array<Number>|Mx.Extent} Devuelve el "label".
 * @api
 */
export const parseLabel = (parameter) => {
  let label;

  if (isString(parameter)) {
    label = getParameterValue('label', parameter);
  } else if (isObject(parameter)) {
    label = parameter.label;
  } else {
    Exception(`El tipo del parámetro container no es válido: ${typeof parameter}`);
  }

  return label;
};

/**
 * Esta función analiza un parámetro de "viewExtent" en un formato legible.
 * parámetro a API-CNIG y chequea posibles errores.
 *
 * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
 *
 * @public
 * @function
 * @param {string|Mx.parameters.Map} parameter Parámetros.
 * @returns {String} Devuelve el "viewExtent".
 * @api
 */
export const parseViewExtent = (parameter) => {
  let viewExtent;

  if (isString(parameter)) {
    viewExtent = getParameterValue('viewExtent', parameter);
  } else if (isObject(parameter)) {
    viewExtent = parameter.viewExtent;
  } else {
    Exception(`El tipo del parámetro viewExtent no es válido: ${typeof parameter}`);
  }

  if (!isNullOrEmpty(viewExtent) && !isArray(viewExtent)) {
    viewExtent = viewExtent.split(',').map(Number);
  }
  return viewExtent;
};

/**
 * @classdesc
 * Analiza y transforma los parámetros especificados por el usuario.
 * @property {Object} container Contenedor del mapa.
 * @property {Object} layers Capas del mapa.
 * @property {Object} wmc Servicio WMC.
 * @property {Object} wms Servicio WMS.
 * @property {Object} wmts Servicio WMTS.
 * @property {Object} kml Servicio KML.
 * @property {Object} controls Controles del mapa.
 * @property {Object} getfeatureinfo Parámetros de "getfeatureinfo".
 * @property {Object} maxExtent Extensión máxima del mapa.
 * @property {Object} bbox Extensión inicial del mapa.
 * @property {Number} zoom Zoom inicial del mapa.
 * @property {Number} minZoom Zoom mínimo del mapa.
 * @property {Object} center Centro inicial del mapa.
 * @property {Number} maxZoom Zoom máximo del mapa.
 * @property {String|Array<String>|Array<Number>} resolutions Resoluciones del mapa.
 * @property {Object} projection Proyección del mapa.
 * @property {Object} label Etiqueta del mapa.
 * @property {Object} ticket Ticket de autenticación.
 * @property {Object} zoomConstrains Valor para la constrain de zoom.
 * @property {Object} viewExtent Extent restringido de navegación para el mapa.
 * @api
 */
class Parameters {
  /**
   * Constructor principal de la clase.
   * @constructor
   * @param {string|Mx.parameters.Map} userParameters Parámetros:
   * - container: Contenedor del mapa.
   * - layers: Capas del mapa.
   * - wmc: Servicio WMC.
   * - wms: Servicio WMS.
   * - wmts: Servicio WMTS.
   * - kml: Servicio KML.
   * - controls: Controles del mapa.
   * - getfeatureinfo: Parámetros de "getfeatureinfo".
   * - maxExtent: Extensión máxima del mapa.
   * - bbox: Extensión inicial del mapa.
   * - zoom: Zoom inicial del mapa.
   * - minZoom: Zoom mínimo del mapa.
   * - center: Centro inicial del mapa.
   * - maxZoom: Zoom máximo del mapa.
   * - resolutions: Resoluciones del mapa.
   * - projection: Proyección del mapa.
   * - label: Etiqueta del mapa.
   * - ticket: Ticket de autenticación.
   * - zoomConstrains: Valor para la constrain de zoom.
   * - viewExtent Extent restringido de navegación para el mapa.
   * @api
   */
  constructor(userParameters) {
    if (isNullOrEmpty(userParameters)) {
      Exception(getValue('exception').no_param);
    }

    /**
     * @public
     * @type {Object}
     * @api
     */
    this.container = parseContainer(userParameters);

    /**
     * @public
     * @type {Object}
     * @api
     */
    this.layers = parseLayers(userParameters);

    /**
     * @public
     * @type {Object}
     * @api
     */
    this.wmc = parseWMC(userParameters);

    /**
     * @public
     * @type {Object}
     * @api
     */
    this.wms = parseWMS(userParameters);

    /**
     * @public
     * @type {Object}
     * @api
     */
    this.wmts = parseWMTS(userParameters);

    /**
     * @public
     * @type {Object}
     * @api
     */
    this.kml = parseKML(userParameters);

    /**
     * @public
     * @type {Object}
     * @api
     */
    this.controls = parseControls(userParameters);

    /**
     * @public
     * @type {Object}
     * @api
     */
    this.getfeatureinfo = parseGetFeatureInfo(userParameters);

    /**
     * @public
     * @type {Object}
     * @api
     */
    this.maxExtent = parseMaxExtent(userParameters);

    /**
     * @public
     * @type {Object}
     * @api
     */
    this.bbox = parseBbox(userParameters);

    /**
     * @public
     * @type {Number}
     * @api
     */
    this.zoom = parseZoom(userParameters);

    /**
     * @public
     * @type {Number}
     * @api
     */
    this.minZoom = parseMinZoom(userParameters);

    /**
     * @public
     * @type {Number}
     * @api
     */
    this.maxZoom = parseMaxZoom(userParameters);

    /**
     * @public
     * @type {Object}
     * @api
     */
    this.center = parseCenter(userParameters);

    /**
     * @public
     * @type {String|Array<String>|Array<Number>}
     * @api
     */
    this.resolutions = parseResolutions(userParameters);

    /**
     * @public
     * @type {Object}
     * @api
     */
    this.projection = parseProjection(userParameters);

    /**
     * @public
     * @type {Object}
     * @api
     */
    this.label = parseLabel(userParameters);

    /**
     * @public
     * @type {Object}
     * @api
     */
    this.ticket = parseTicket(userParameters);

    /**
     * @public
     * @type {Boolean}
     * @api
     */
    this.zoomConstrains = parseZoomConstrains(userParameters);

    /**
     * @public
     * @type {Array}
     * @api
     */
    this.viewExtent = parseViewExtent(userParameters);
  }
}

export default Parameters;
