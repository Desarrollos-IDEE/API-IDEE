/**
 * @module M/parameter
 * @example import parameter from 'M/parameter';
 */
import {
  isUndefined, isNull, isArray, isNullOrEmpty, isFunction, isObject, isString, isUrl, normalize,
} from '../util/Utils';
import Exception from '../exception/exception';
import * as LayerType from '../layer/Type';
import Layer from '../layer/Layer';
import { getValue } from '../i18n/language';

/**
 * Analiza el parámetro del centro de usuario especificado en un objeto.
 *
 * @public
 * @function
 * @param {String|Array<String>|Array<Number>|Mx.Center} centerParameterVar Parámetros
 * proporcionados por el usuario.
 * @returns {Mx.Center} Objeto con los parámetros del centro.
 * @throws {M.exception} Argumento no válido.
 */
export const center = (centerParameterVar) => {
  let centerParameter = centerParameterVar;
  const centerParam = {};
  // checks if the param is null or empty
  if (isNullOrEmpty(centerParameter)) {
    Exception(getValue('exception').no_center);
  }
  // string
  if (isString(centerParameter)) {
    centerParameter = normalize(centerParameter);
    if (/^-?\d+(\.\d+)?[,;]-?\d+(\.\d+)?([*](true|false))?$/i.test(centerParameter)) {
      const centerArray = centerParameter.split(/\*/);
      const coord = centerArray[0];
      const draw = centerArray[1];
      const coordArray = coord.split(/[,;]+/);
      if (coordArray.length === 2) {
        centerParam.x = Number.parseFloat(coordArray[0]);
        centerParam.y = Number.parseFloat(coordArray[1]);
      } else {
        Exception(getValue('exception').invalid_center_param);
      }
      centerParam.draw = /^1|(true)$/i.test(draw);
    } else {
      Exception(getValue('exception').invalid_center_param);
    }
  } else if (isArray(centerParameter)) {
    // array
    if ((centerParameter.length === 2) || (centerParameter.length === 3)) {
      if (isString(centerParameter[0])) {
        centerParameter[0] = Number.parseFloat(centerParameter[0]);
      }
      if (isString(centerParameter[1])) {
        centerParameter[1] = Number.parseFloat(centerParameter[1]);
      }
      centerParam.x = centerParameter[0];
      centerParam.y = centerParameter[1];
    } else {
      Exception(getValue('exception').invalid_center_param);
    }
  } else if (isObject(centerParameter)) {
    // object
    // x
    if (!isNull(centerParameter.x)) {
      if (isString(centerParameter.x)) {
        centerParameter.x = Number.parseFloat(centerParameter.x);
      }
      centerParam.x = centerParameter.x;
    } else {
      Exception(getValue('exception').invalid_center_param);
    }
    // y
    if (!isNull(centerParameter.y)) {
      if (isString(centerParameter.y)) {
        centerParameter.y = Number.parseFloat(centerParameter.y);
      }
      centerParam.y = centerParameter.y;
    } else {
      Exception(getValue('exception').invalid_center_param);
    }
    // draw
    if (!isNull(centerParameter.draw)) {
      centerParam.draw = /^true$/.test(centerParameter.draw);
    } else {
      centerParam.draw = false;
    }
  } else {
    // unknown
    Exception(`El parámetro no es de un tipo soportado: ${typeof maxExtentParameter}`);
  }

  if (Number.isNaN(centerParam.x) || Number.isNaN(centerParam.y)) {
    Exception(getValue('exception').invalid_center_param);
  }

  return centerParam;
};

const getParameters = (params) => {
  const [type, name, legend, url, visibility, transparent = false] = params.split(/\*/);
  const visibilidadBoolean = visibility === undefined ? undefined : visibility === 'true';
  return {
    type,
    name,
    legend,
    url,
    visibility: visibilidadBoolean,
    transparent: transparent === 'true',
  };
};

/**
 * Analiza el parámetro para obtener el tipo.
 * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
 *
 * @public
 * @function
 * @param {String|Object} parameter Parámetro.
 * @param {M.layer.Type} forcedType Tipo forzado.
 * @returns {M.layer.Type} Tipo de capa.
 * @throws {M.exception} Tipo de capa no soportado o no reconocido.
 * @api
 */
export const getType = (parameter, forcedType) => {
  let type;
  if (isString(parameter)) {
    if (/^\s*osm\s*$/i.test(parameter)) {
      type = LayerType.OSM;
    } else {
      const typeMatches = parameter.match(/^(\w+)\*.+$/);
      const typeGroup = parameter.match(/^LayerGroup/);
      if ((typeMatches && (typeMatches.length > 1))
        || (typeGroup && (typeGroup.length > 1))) {
        type = typeGroup !== null ? LayerType.parse(typeGroup[0]) : LayerType.parse(typeMatches[1]);
        if (isUndefined(type)) {
          Exception(`No se reconoce el tipo de capa ${typeMatches[1]}`);
        }
      }
      if (isUndefined(type) && !isNullOrEmpty(forcedType)) {
        type = forcedType;
      } else if (isUndefined(type)) {
        Exception(`No se reconoce el tipo de capa ${type}`);
      }
    }
  } else if (isObject(parameter)) {
    if (!isNullOrEmpty(parameter.type)) {
      type = LayerType.parse(parameter.type);
      if (isUndefined(type)) {
        Exception(`No se reconoce el tipo de capa ${type}`);
      }
    }
  } else {
    Exception(`El parámetro no es de un tipo soportado: ${typeof parameter}`);
  }

  if (!isNullOrEmpty(type) && !isNullOrEmpty(forcedType) && (type !== forcedType)) {
    Exception('El tipo de la capa ('.concat(type)
      .concat(') no era el esperado (').concat(forcedType).concat(')'));
  }

  if (isNullOrEmpty(type) && !isNullOrEmpty(forcedType)) {
    type = forcedType;
  }
  return type;
};

/**
 * Analiza el parámetro maxExtent del usuario especificado en un objeto.
 *
 * @param {String|Array<String>|Array<Number>|Mx.Extent} maxExtentParam Parámetro
 * maxExtent especificado.
 * @returns {Mx.Extent} Objeto con la extensión máxima.
 * @public
 * @function
 * @api
 * @throws {M.exception} Si el parámetro no es especificado o de tipo no soportado.
 */
export const maxExtent = (maxExtentParam) => {
  const maxExtentParameter = maxExtentParam;
  let maxExtentVar;
  if (!isNullOrEmpty(maxExtentParameter)) {
    maxExtentVar = {
      x: {},
      y: {},
    };

    // checks if the param is null or empty
    if (isNullOrEmpty(maxExtentParameter)) {
      Exception(getValue('exception').no_maxextent);
    }

    // string
    if (isString(maxExtentParameter)) {
      if (/^\s*-?\d+(\.\d+)?\s*[,;]\s*-?\d+(\.\d+)?\s*[,;]\s*-?\d+(\.\d+)?\s*[,;]\s*-?\d+(\.\d+)?$/.test(maxExtentParameter)) {
        const extentArray = maxExtentParameter.split(/[,;]+/);
        if (extentArray.length === 4) {
          maxExtentVar.x.min = Number.parseFloat(extentArray[0]);
          maxExtentVar.y.min = Number.parseFloat(extentArray[1]);
          maxExtentVar.x.max = Number.parseFloat(extentArray[2]);
          maxExtentVar.y.max = Number.parseFloat(extentArray[3]);
        } else {
          Exception(getValue('exception').invalid_maxextent_param);
        }
      } else {
        Exception(getValue('exception').invalid_maxextent_param);
      }
    } else if (isArray(maxExtentParameter)) {
      // array
      if (maxExtentParameter.length === 4) {
        if (isString(maxExtentParameter[0])) {
          maxExtentParameter[0] = Number.parseFloat(maxExtentParameter[0]);
        }
        if (isString(maxExtentParameter[1])) {
          maxExtentParameter[1] = Number.parseFloat(maxExtentParameter[1]);
        }
        if (isString(maxExtentParameter[2])) {
          maxExtentParameter[2] = Number.parseFloat(maxExtentParameter[2]);
        }
        if (isString(maxExtentParameter[3])) {
          maxExtentParameter[3] = Number.parseFloat(maxExtentParameter[3]);
        }
        maxExtentVar.x.min = maxExtentParameter[0];
        maxExtentVar.y.min = maxExtentParameter[1];
        maxExtentVar.x.max = maxExtentParameter[2];
        maxExtentVar.y.max = maxExtentParameter[3];
      } else {
        Exception(getValue('exception').invalid_maxextent_param);
      }
    } else if (isObject(maxExtentParameter)) {
      // object
      // x min
      if (!isNull(maxExtentParameter.left)) {
        if (isString(maxExtentParameter.left)) {
          maxExtentParameter.left = Number.parseFloat(maxExtentParameter.left);
        }
        maxExtentVar.x.min = maxExtentParameter.left;
      } else if (!isNull(maxExtentParameter.x.min)) {
        if (isString(maxExtentParameter.x.min)) {
          maxExtentParameter.x.min = Number.parseFloat(maxExtentParameter.x.min);
        }
        maxExtentVar.x.min = maxExtentParameter.x.min;
      } else {
        Exception(getValue('exception').invalid_maxextent_param);
      }
      // y min
      if (!isNull(maxExtentParameter.bottom)) {
        if (isString(maxExtentParameter.bottom)) {
          maxExtentParameter.bottom = Number.parseFloat(maxExtentParameter.bottom);
        }
        maxExtentVar.y.min = maxExtentParameter.bottom;
      } else if (!isNull(maxExtentParameter.y.min)) {
        if (isString(maxExtentParameter.y.min)) {
          maxExtentParameter.y.min = Number.parseFloat(maxExtentParameter.y.min);
        }
        maxExtentVar.y.min = maxExtentParameter.y.min;
      } else {
        Exception(getValue('exception').invalid_maxextent_param);
      }
      // x max
      if (!isNull(maxExtentParameter.right)) {
        if (isString(maxExtentParameter.right)) {
          maxExtentParameter.right = Number.parseFloat(maxExtentParameter.right);
        }
        maxExtentVar.x.max = maxExtentParameter.right;
      } else if (!isNull(maxExtentParameter.x.max)) {
        if (isString(maxExtentParameter.x.max)) {
          maxExtentParameter.x.max = Number.parseFloat(maxExtentParameter.x.max);
        }
        maxExtentVar.x.max = maxExtentParameter.x.max;
      } else {
        Exception(getValue('exception').invalid_maxextent_param);
      }
      // y max
      if (!isNull(maxExtentParameter.top)) {
        if (isString(maxExtentParameter.top)) {
          maxExtentParameter.top = Number.parseFloat(maxExtentParameter.top);
        }
        maxExtentVar.y.max = maxExtentParameter.top;
      } else if (!isNull(maxExtentParameter.y.max)) {
        if (isString(maxExtentParameter.y.max)) {
          maxExtentParameter.y.max = Number.parseFloat(maxExtentParameter.y.max);
        }
        maxExtentVar.y.max = maxExtentParameter.y.max;
      } else {
        Exception(getValue('exception').invalid_maxextent_param);
      }
    } else {
      // unknown
      Exception(`El parámetro no es de un tipo soportado: ${typeof maxExtentParameter}`);
    }

    if (Number.isNaN(maxExtentVar.x.min) || Number.isNaN(maxExtentVar.y.min)
      || Number.isNaN(maxExtentVar.x.max) || Number.isNaN(maxExtentVar.y.max)) {
      Exception(getValue('exception').invalid_maxextent_param);
    }
  }

  return maxExtentVar;
};

/**
 * Analiza el parámetro de proyección del usuario especificado en un objeto.
 *
 * @param {String|Mx.Projection} projectionParameter Parámetro de proyección
 * especificado.
 * @returns {Mx.Projection} Objeto de proyección.
 * @public
 * @function
 * @api
 * @throws {M.exception} Si el parámetro no es especificado o de tipo no soportado.
 */
export const projection = (projectionParameter) => {
  const projectionVar = {
    code: null,
    units: null,
  };

  // checks if the param is null or empty
  if (isNullOrEmpty(projectionParameter)) {
    Exception(getValue('exception').no_projection);
  }

  // string
  if (isString(projectionParameter)) {
    if (/^(EPSG:)?\d+\*((d(egrees)?)|(m(eters)?))$/i.test(projectionParameter)) {
      const projectionArray = projectionParameter.split(/\*/);
      projectionVar.code = projectionArray[0];
      projectionVar.units = normalize(projectionArray[1].substring(0, 1));
    } else {
      Exception(`El formato del parámetro projection no es correcto. </br>Se usará la proyección por defecto: ${M.config.DEFAULT_PROJ}`);
    }
  } else if (isObject(projectionParameter)) {
    // object
    // y max
    if (!isNull(projectionParameter.code)
      && !isNull(projectionParameter.units)) {
      projectionVar.code = projectionParameter.code;
      projectionVar.units = normalize(projectionParameter.units.substring(0, 1));
    } else {
      Exception(`El formato del parámetro projection no es correcto. </br>Se usará la proyección por defecto: ${M.config.DEFAULT_PROJ}`);
    }
  } else {
    // unknown
    Exception(`El parámetro no es de un tipo soportado: ${typeof projectionParameter}`);
  }

  if ((projectionVar.units !== 'm') && (projectionVar.units !== 'd')) {
    Exception(`La unidad "${projectionParameter.units}" del parámetro projection no es válida. Las disponibles son: "m" o "d"`);
  }

  return projectionVar;
};

/**
 * Analiza el parámetro de resoluciones de usuario especificado en una matriz.
 *
 * @param {String|Array<String>|Array<Number>} resolutionsParam Parámetro de
 * resoluciones especificado.
 * @returns {Array<Number>} Matriz de resoluciones.
 * @public
 * @function
 * @api
 * @throws {M.exception} Si el parámetro no es especificado o de tipo no soportado.
 */
export const resolutions = (resolutionsParam) => {
  let resolutionsParameter = resolutionsParam;
  let resolutionsVar = [];

  // checks if the param is null or empty
  if (isNullOrEmpty(resolutionsParameter)) {
    Exception(getValue('exception').no_resolutions);
  }

  // string
  if (isString(resolutionsParameter)) {
    if (/^\d+(\.\d+)?([,;]\d+(\.\d+)?)*$/.test(resolutionsParameter)) {
      resolutionsParameter = resolutionsParameter.split(/[,;]+/);
    } else {
      Exception(getValue('exception').invalid_resolutions_param);
    }
  }
  // array
  if (isArray(resolutionsParameter)) {
    resolutionsVar = resolutionsParameter.map((resolution) => {
      if (isString(resolution)) {
        return Number.parseFloat(resolution);
      }
      return resolution;
    });
  } else {
    // unknown
    Exception(`El parámetro no es de un tipo soportado: ${typeof resolutionsParameter}`);
  }

  let valid = true;
  for (let i = 0, len = resolutionsVar.length; i < len && valid; i += 1) {
    valid = !Number.isNaN(resolutionsVar[i]);
  }

  if (!valid) {
    Exception(getValue('exception').invalid_resolutions_param);
  }
  return resolutionsVar;
};

/**
 * Analiza el parámetro de zoom de usuario especificado en un número.
 *
 * @param {String|Number} zoomParam Parámetro de zoom especificado.
 * @returns {Number} Zoom.
 * @public
 * @function
 * @api
 * @throws {M.exception} Si el parámetro no es especificado o de tipo no soportado.
 */
export const zoom = (zoomParam) => {
  const zoomParameter = zoomParam;
  let zoomVar;

  // checks if the param is null or empty
  if (isNullOrEmpty(zoomParameter)) {
    Exception(getValue('exception').no_zoom);
  }

  // string
  if (isString(zoomParameter)) {
    zoomVar = Number.parseFloat(zoomParameter);
  } else if (typeof zoomParameter === 'number') {
    // number
    zoomVar = zoomParameter;
  } else {
    // unknown
    Exception(`El parámetro no es de un tipo soportado: ${typeof zoomParameter}`);
  }

  if (Number.isNaN(zoomVar)) {
    Exception(getValue('exception').invalid_zoom_param);
  }
  return zoomVar;
};

/**
 * Analiza el parámetro de zoom mínimo del usuario especificado en un número.
 *
 * @param {String|Number} minZoomParam Parámetro de zoom mínimo especificado.
 * @returns {Number} Mínimo nivel de zoom.
 * @public
 * @function
 * @api
 * @throws {M.exception} Si el parámetro no es especificado o de tipo no soportado.
 */
export const minZoom = (minZoomParam) => {
  const minZoomParameter = minZoomParam;
  let minZoomVar;

  // checks if the param is null or empty
  if (isNullOrEmpty(minZoomParameter)) {
    Exception(getValue('exception').no_zoom);
  }

  // string
  if (isString(minZoomParameter)) {
    minZoomVar = Number.parseInt(minZoomParameter, 10);
  } else if (typeof minZoomParameter === 'number') {
    // number
    minZoomVar = minZoomParameter;
  } else {
    // unknown
    Exception(`El parámetro no es de un tipo soportado: ${typeof minZoomParameter}`);
  }

  if (Number.isNaN(minZoomVar)) {
    Exception(getValue('exception').invalid_zoom_param);
  }
  return minZoomVar;
};

/**
 * Analiza el parámetro de zoom máximo del usuario especificado en un número.
 *
 * @param {String|Number} maxZoomParam Parámetro de zoom máximo especificado.
 * @returns {Number} Máximo nivel de zoom.
 * @public
 * @function
 * @api
 * @throws {M.exception} Si el parámetro no es especificado o de tipo no soportado.
 */
export const maxZoom = (maxZoomParam) => {
  const maxZoomParameter = maxZoomParam;
  let maxZoomVar;

  // checks if the param is null or empty
  if (isNullOrEmpty(maxZoomParameter)) {
    Exception(getValue('exception').no_zoom);
  }

  // string
  if (isString(maxZoomParameter)) {
    maxZoomVar = Number.parseInt(maxZoomParameter, 10);
  } else if (typeof maxZoomParameter === 'number') {
    // number
    maxZoomVar = maxZoomParameter;
  } else {
    // unknown
    Exception(`El parámetro no es de un tipo soportado: ${typeof maxZoomParameter}`);
  }

  if (Number.isNaN(maxZoomVar)) {
    Exception(getValue('exception').invalid_zoom_param);
  }
  return maxZoomVar;
};

/**
 * Analiza el parámetro de capas KML especificado y devuelve el nombre de la capa.
 * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
 *
 * @public
 * @function
 * @param {string} parameter Parámetro de capas KML especificado.
 * @returns {string} Nombre de la capa.
 * @api
 * @throws {M.exception} Si el parámetro no es de un tipo soportado.
 */
export const getNameKML = (parameter) => {
  let name;
  let params;
  if (isString(parameter)) {
    if (/^KML\*.+/i.test(parameter)) {
      // <KML>*<NAME>*<URL>(*<FILENAME>)?*<EXTRACT>
      if (/^KML\*[^*]+\*[^*]+(\*[^*]+)?(\*(true|false))?/i.test(parameter)) {
        params = parameter.split(/\*/);
        name = params[1].trim();
      }
    } else if (/^[^*]*\*[^*]+/.test(parameter)) {
      // <NAME>*<URL>(*<FILENAME>)?(*<EXTRACT>)?
      params = parameter.split(/\*/);
      name = params[0].trim();
    } else if (/^[^*]*/.test(parameter)) {
      // <NAME>(*<URL>(*<FILENAME>)?(*<EXTRACT>)?)? filtering
      params = parameter.split(/\*/);
      name = params[0].trim();
    }
  } else if (isObject(parameter) && !isNullOrEmpty(parameter.name)) {
    name = parameter.name.trim();
  } else if (!isObject(parameter)) {
    Exception(`El parámetro no es de un tipo soportado: ${typeof parameter}`);
  }

  if (isUrl(name) || /^(true|false)$/i.test(name)) {
    name = null;
  }
  return name;
};

/**
 * Analiza el parámetro de capas KML especificado y devuelve el "extract" de la capa.
 * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
 *
 * @public
 * @function
 * @param {String} parameter Parámetro de capas KML especificado.
 * @returns {Boolean|undefined} Valor del extract.
 * @api
 * @throws {M.exception} Si el parámetro no es de un tipo soportado.
 */
export const getExtractKML = (parameter) => {
  let extract;
  let params;
  if (isString(parameter)) {
    // <KML>*<NAME>*<URL>(*<FILENAME>)?*<EXTRACT>*<LABEL>*<VISIBILITY>
    if (/^KML\*[^*]+\*[^*]+(\*[^*]+)?(\*(true|false))?/i.test(parameter)) {
      params = parameter.split(/\*/);
      extract = params[params.length - 3].trim();
    } else if (/^[^*]+\*[^*]+\*(true|false)$/i.test(parameter)) {
      // <NAME>*<URL>*<EXTRACT>
      params = parameter.split(/\*/);
      extract = params[2].trim();
    } else if (/^[^*]+\*(true|false)$/i.test(parameter)) {
      // <URL>*<EXTRACT>
      params = parameter.split(/\*/);
      extract = params[1].trim();
    }
  } else if (isObject(parameter)) {
    extract = normalize(parameter.extract);
  } else {
    Exception(`El parámetro no es de un tipo soportado: ${typeof parameter}`);
  }

  if (!isNullOrEmpty(extract)) {
    extract = /^1|(true)$/i.test(extract);
  } else {
    extract = undefined;
  }
  return extract;
};

/**
 * Analiza el parámetro para mostrar o no la etiqueta.
 * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
 *
 * @public
 * @function
 * @param {string} parameter Parámetro que indica si mostrar o no
 * la etiqueta para la capa KML.
 * @returns {String} Devuelve la etiqueta de la capa.
 * @throws {M.exception} Si el parámetro no es de un tipo soportado.
 * @api
 */
export const getLabelKML = (parameter) => {
  let label;
  let params;
  if (isString(parameter)) {
    params = parameter.split(/\*/);
    label = params[params.length - 2].trim();
    label = label !== 'false';
  } else if (isObject(parameter)) {
    label = normalize(parameter.label);
  } else {
    Exception(`El parámetro no es de un tipo soportado: ${typeof parameter}`);
  }
  return label;
};

/**
 * Analiza el parámetro para obtener la visibilidad.
 * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
 *
 * @public
 * @function
 * @param {string} parameter Parámetro para obtener la visibilidad.
 * @returns {boolean} Visibilidad de la capa.
 * @throws {M.exception} Si el parámetro no es de un tipo soportado.
 * @api
 */
export const getVisibilityKML = (parameter) => {
  let visibility;
  let params;
  if (isString(parameter)) {
    params = parameter.split(/\*/);
    visibility = params[params.length - 1].trim();
    visibility = visibility !== 'false';
  } else if (isObject(parameter)) {
    visibility = normalize(parameter.visibility);
  } else {
    Exception(`El parámetro no es de un tipo soportado: ${typeof parameter}`);
  }
  return visibility;
};

/**
 * Analiza el parámetro para obtener la leyenda.
 * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
 *
 * @public
 * @function
 * @param {string} parameter Parámetro para obtener la leyenda.
 * @returns {string} Leyenda de la capa.
 * @throws {M.exception} Si el parámetro no es de un tipo soportado.
 * @api
 */
export const getLegendKML = (parameter) => {
  let legend;
  if (isObject(parameter)) {
    legend = parameter.legend;
  }
  return legend;
};

/**
 * Analiza el parámetro para obtener la URL del servicio.
 * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
 *
 * @public
 * @function
 * @param {string} parameter Parámetro para obtener la URL del
 * servicio.
 * @returns {string} URL del servicio.
 * @throws {M.exception} Si el parámetro no es de un tipo soportado.
 * @api
 */
export const getURLKML = (parameter) => {
  let url;
  if (isString(parameter)) {
    // v3 <KML>*<NAME>*<DIR>*<FILENAME>*<EXTRACT>
    if (/^KML\*[^*]+\*[^*]+\*[^*]+\.kml\*(true|false)$/i.test(parameter)) {
      const params = parameter.split(/\*/);
      url = params[2].concat(params[3]);
    } else {
      const urlMatches = parameter.match(/^([^*]*\*)*(https?:\/\/[^*]+)\*.*/i);
      if (urlMatches && (urlMatches.length > 2)) {
        url = urlMatches[2];
      }
    }
  } else if (isObject(parameter)) {
    url = parameter.url;
  } else {
    Exception(`El parámetro no es de un tipo soportado: ${typeof parameter}`);
  }
  return url;
};

/**
 * Transforma los parámetros KML de la capa de usuario especificada en un objeto.
 *
 * @param {string|Mx.parameters.Layer} userParamer Parámetros para la capa KML especificados
 * por el usuario.
 * @returns {Mx.parameters.KML|Array<Mx.parameters.KML>} Objeto con los parámetros de la
 * capa KML.
 * @public
 * @function
 * @api
 * @throws {M.exception} Si el parámetro no es especificado.
 */
export const kml = (userParamer) => {
  const userParameters = userParamer;
  let layersVar = [];

  // checks if the param is null or empty
  if (isNullOrEmpty(userParameters)) {
    Exception(getValue('exception').no_param);
  }

  // checks if the parameter is an array
  let userParametersArray = userParameters;
  if (!isArray(userParametersArray)) {
    userParametersArray = [userParametersArray];
  }

  layersVar = userParametersArray.map((userParam) => {
    const layerObj = {};

    // gets the layer type
    layerObj.type = LayerType.KML;

    // gets the name
    layerObj.name = getNameKML(userParam);

    // gets the URL
    layerObj.url = getURLKML(userParam);

    // gets the extract
    layerObj.extract = getExtractKML(userParam);

    // get the show option label
    layerObj.label = getLabelKML(userParam);

    // get the visibility option
    layerObj.visibility = getVisibilityKML(userParam);

    // get the legend option
    layerObj.legend = getLegendKML(userParam);

    return layerObj;
  });

  if (!isArray(userParameters)) {
    layersVar = layersVar[0];
  }

  return layersVar;
};

/**
 * Analiza el parámetro para obtener el nombre de la capa.
 * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
 *
 * @public
 * @function
 * @param {string|Mx.parameters.WFS} parameter Parámetro para obtener
 * el nombre de la capa WFS.
 * @returns {string} Nombre de la capa.
 * @throws {Mx.exception} Si el parámetro no es de un tipo soportado.
 * @api
 */
export const getNameWFS = (parameter) => {
  let name;
  let params;
  let namespaceName;
  if (isString(parameter)) {
    if (/^WFS(T)?\*.+/i.test(parameter)) {
      // <WFS(T)?>*(<TITLE>)?*<URL>*<NAMESPACE>:<NAME>
      if (/^WFS(T)?\*[^*]*\*[^*]+\*[^*]+:[^*]+/i.test(parameter) || /^[^*]*\*[^*]+:[^*]+/.test(parameter)) {
        params = parameter.split(/\*/);
        namespaceName = params[3].trim();
        name = namespaceName.split(':')[1];
      } else if (/^WFS(T)?\*[^*]*\*[^*]+[^*]+/i.test(parameter)) {
        // <WFS(T)?>*(<TITLE>)?*<URL>*<NAME>
        params = parameter.split(/\*/);
        name = params[3].trim();
      }
    } else if (/^[^*]*\*[^*]+:[^*]+/.test(parameter)) {
      // <URL>*<NAMESPACE>:<NAME>
      params = parameter.split(/\*/);
      namespaceName = params[1].trim();
      name = namespaceName.split(':')[1];
    }
  } else if (isObject(parameter) && !isNullOrEmpty(parameter.name)) {
    name = parameter.name.trim();
  } else if (!isObject(parameter)) {
    Exception(`El parámetro no es de un tipo soportado: ${typeof parameter}`);
  }

  if (isUrl(name) || /^(true|false)$/i.test(name)) {
    name = null;
  }
  return name;
};

/**
 * Analiza el parámetro para obtener la URL del servicio.
 * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
 *
 * @public
 * @function
 * @param {string|Mx.parameters.WFS} parameter Parámetro para obtener
 * la URL del servicio para la capa WFS.
 * @returns {string} URL del servicio.
 * @throws {M.exception} Si el parámetro no es de un tipo soportado.
 * @api
 */
export const getURLWFS = (parameter) => {
  let url;
  if (isString(parameter)) {
    const urlMatches = parameter.match(/^([^*]*\*)*(https?:\/\/[^*]+)([^*]*\*?)*$/i);
    if (urlMatches && (urlMatches.length > 2)) {
      url = urlMatches[2];
    }
  } else if (isObject(parameter)) {
    url = parameter.url;
  } else {
    Exception(`El parámetro no es de un tipo soportado: ${typeof parameter}`);
  }
  return url;
};

/**
 * Analiza el parámetro para obtener el espacio de nombres de la capa.
 * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
 *
 * @public
 * @function
 * @param {string|Mx.parameters.WFS} parameter Parámetro para obtener
 * el espacio de nombres de la capa WFS.
 * @returns {string} Espacio de nombres de la capa.
 * @throws {M.exception} Si el parámetro no es de un tipo soportado.
 * @api
 */
export const getNamespaceWFS = (parameter) => {
  let namespace;
  let params;
  let namespaceName;
  if (isString(parameter)) {
    if (/^WFS(T)?\*.+/i.test(parameter)) {
      // <WFS(T)?>*(<TITLE>)?*<URL>*<NAMESPACE>:<NAME>
      if (/^WFS(T)?\*[^*]*\*[^*]+\*[^*]+:[^*]+/i.test(parameter)) {
        params = parameter.split(/\*/);
        namespaceName = params[3].trim();
        namespace = namespaceName.split(':')[0];
      }
    } else if (/^[^*]*\*[^*]+:[^*]+/.test(parameter)) {
      // <URL>*<NAMESPACE>:<NAME>
      params = parameter.split(/\*/);
      namespaceName = params[1].trim();
      namespace = namespaceName.split(':')[0];
    }
  } else if (isObject(parameter) && !isNullOrEmpty(parameter.namespace)) {
    namespace = parameter.namespace.trim();
  } else if (!isObject(parameter)) {
    Exception(`El parámetro no es de un tipo soportado: ${typeof parameter}`);
  }

  if (isUrl(namespace) || /^(true|false)$/i.test(namespace)) {
    namespace = null;
  }
  return namespace;
};

/**
 * Analiza el parámetro para obtener la leyenda de la capa.
 * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
 *
 * @public
 * @function
 * @param {string|Mx.parameters.WFS} parameter Parámetro para obtener la leyenda
 * de la capa WFS.
 * @returns {string} Leyenda de la capa.
 * @throws {M.exception} Si el parámetro no es de un tipo soportado.
 * @api
 */
export const getLegendWFS = (parameter) => {
  let legend;
  let params;
  if (isString(parameter)) {
    // <WFS(T)?>*<TITLE>*<URL>...
    if (/^WFS(T)?\*[^*]/i.test(parameter)) {
      params = parameter.split(/\*/);
      legend = params[1].trim();
    } else if (/^[^*]+\*[^*]+:[^*]+\*[^*]+/.test(parameter)) {
      // <URL>*<NAMESPACE>:<NAME>*<TITLE>
      params = parameter.split(/\*/);
      legend = params[2].trim();
    }
  } else if (isObject(parameter) && !isNullOrEmpty(parameter.legend)) {
    legend = parameter.legend.trim();
  } else if (!isObject(parameter)) {
    Exception(`El parámetro no es de un tipo soportado: ${typeof parameter}`);
  }

  if (isUrl(legend) || /^(true|false)$/i.test(legend)) {
    legend = null;
  }
  return legend;
};

/**
 * Analiza el parámetro para obtener el filtro CQL.
 * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
 *
 * @public
 * @function
 * @param {string|Mx.parameters.WFS} parameter Parámetro para obtener el filtro
 * CQL de la capa WFS.
 * @returns {string} Filtro CQL.
 * @throws {M.exception} Si el parámetro no es de un tipo soportado.
 * @api
 */
export const getCQLWFS = (parameter) => {
  let cql;
  let params;
  if (isString(parameter)) {
    // URL*NAMESPACE:NAME*TITLE*CQL
    if (/^[^*]+\*[^*]+:[^*]+\*[^*]+\*[^*]+/i.test(parameter)) {
      params = parameter.split(/\*/);
      cql = params[3].trim();
    }
    // <WFS(T)?>*(<TITLE>)?*<URL>*<NAMESPACE>:<NAME>*<GEOM>*<ID>*<CQL>
    if (/^WFS(T)?\*[^*]*\*[^*]+\*[^*]+:[^*]+\*[^*]+\*[^*]*\*[^*]*/i.test(parameter)) {
      params = parameter.split(/\*/);
      cql = params[6].trim();
    }
  } else if ((isObject(parameter)
    && !isNullOrEmpty(parameter.cql)) || (!isNullOrEmpty(parameter.ecql))) {
    cql = parameter.cql ? parameter.cql.trim() : parameter.ecql.trim();
  } else if (!isObject(parameter)) {
    Exception(`El parámetro no es de un tipo soportado: ${typeof parameter}`);
  }

  if (/^(true|false)$/i.test(cql) || /^\d\.\d\.\d$/.test(cql)) {
    cql = undefined;
  }
  return cql;
};

/**
 * Analiza el parámetro para obtener la geometría de la capa.
 * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
 *
 * @public
 * @function
 * @param {string|Mx.parameters.WFS} parameter Parámetro para obtener la geometría
 * de la capa WFS.
 * @returns {string} Geometría de la capa.
 * @throws {M.exception} Si el parámetro no es de un tipo soportado.
 * @api
 */
export const getGeometryWFS = (parameter) => {
  let geometry;
  let params;
  if (isString(parameter)) {
    if (/^WFS(T)?\*.+/i.test(parameter)) {
      // <WFS(T)?>*(<TITLE>)?*<URL>*<NAMESPACE>:<NAME>*<GEOM>
      if (/^WFS(T)?\*[^*]*\*[^*]+\*[^*]+:[^*]+\*[^*]+/i.test(parameter)) {
        params = parameter.split(/\*/);
        geometry = params[4].trim();
      } else if (/^WFS(T)?\*[^*]*\*[^*][^*]+\*[^*]+/i.test(parameter)) {
        // <WFS(T)?>*(<TITLE>)?*<URL>*<NAME>*<GEOM>
        params = parameter.split(/\*/);
        geometry = params[4].trim();
      }
    }
  } else if (isObject(parameter) && !isNullOrEmpty(parameter.geometry)) {
    geometry = parameter.geometry.trim();
  } else if (!isObject(parameter)) {
    Exception(`El parámetro no es de un tipo soportado: ${typeof parameter}`);
  }

  if (isUrl(geometry) || /^(true|false)$/i.test(geometry)) {
    geometry = null;
  }
  return geometry;
};

/**
 * Analiza el parámetro para obtener los identificadores de la capa.
 * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
 *
 * @public
 * @function
 * @param {string|Mx.parameters.WFS} parameter Parámetro para obtener
 * los identificadores de la capa WFS.
 * @returns {Array<string>} Identificadores de la capa.
 * @throws {M.exception} Si el parámetro no es de un tipo soportado.
 * @api
 */
export const getIdsWFS = (parameter) => {
  let ids;
  let params;
  if (isString(parameter)) {
    if (/^WFS(T)?\*.+/i.test(parameter)) {
      // <WFS(T)?>*(<TITLE>)?*<URL>*<NAMESPACE>:<NAME>*<GEOM>*<FEATURE_ID1>-<FEATURE_ID2>...
      if (/^WFS(T)?\*[^*]*\*[^*]+\*[^*]+:[^*]+\*[^*]+\*(.-?)+$/i.test(parameter)) {
        params = parameter.split(/\*/);
        ids = params[5].trim().split('-');
      } else if (/^WFS(T)?\*[^*]*\*[^*]+\*[^*]+\*[^*]+\*(.-?)+$/i.test(parameter)) {
        // <WFS(T)?>*(<TITLE>)?*<URL>*<NAME>*<GEOM>*<FEATURE_ID1>-<FEATURE_ID2>...
        params = parameter.split(/\*/);
        ids = params[5].trim().split('-');
      }
    }
  } else if (isObject(parameter) && !isNullOrEmpty(parameter.ids)) {
    ids = parameter.ids;
  } else if (!isObject(parameter)) {
    Exception(`El parámetro no es de un tipo soportado: ${typeof parameter}`);
  }

  if (isUrl(ids)) {
    ids = null;
  }

  if (!isNullOrEmpty(ids) && !isArray(ids)) {
    ids = [ids];
  }
  return ids;
};

/**
 * Analiza el parámetro para obtener el estilo.
 * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
 *
 * @public
 * @function
 * @param {string|Mx.parameters.WFS} parameter Parámetro para obtener el estilo
 * de la capa WFS.
 * @returns {string} Estilo de la capa.
 * @throws {M.exception} Si el parámetro no es de un tipo soportado.
 * @api
 */
export const getStyleWFS = (parameter) => {
  let params;
  let style;

  if (isString(parameter)) {
    if (/^WFS(T)?\*.+/i.test(parameter)) {
      // <WFS(T)?>*(<TITLE>)?*<URL>*<NAMESPACE>:<NAME>*<GEOM>...
      // ...*<FEATURE_ID1>-<FEATURE_ID2>*<CQL>*<STYLE>...
      if (/^WFS(T)?\*[^*]*\*[^*]+\*[^*]+:[^*]+\*[^*]+\*[^*]*\*[^*]*\*[^*]*/i.test(parameter)) {
        params = parameter.split(/\*/);
        style = params[7].trim();
      }
    }
  } else if (isObject(parameter) && !isNullOrEmpty(parameter.style)) {
    style = parameter.style;
  } else if (!isObject(parameter)) {
    Exception(`El parámetro no es de un tipo soportado: ${typeof parameter}`);
  }
  return style;
};

/**
 * Analiza el parámetro para obtener la versión.
 * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
 *
 * @public
 * @function
 * @param {string|Mx.parameters.WFS} parameter Parámetro para obtener la
 * versión de la capa WFS.
 * @returns {string} Versión.
 * @throws {Exception} Si el parámetro no es de un tipo soportado.
 * @api
 */
export const getVersionWFS = (parameter) => {
  let version;
  if (isString(parameter)) {
    if (/(\d\.\d\.\d)$/.test(parameter)) {
      version = parameter.match(/\d\.\d\.\d$/)[0];
    }
  } else if (isObject(parameter)) {
    version = parameter.version;
  } else {
    Exception(`El parámetro no es de un tipo soportado: ${typeof parameter}`);
  }
  return version;
};

/**
 * Analiza el parámetro para obtener el "extract".
 * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
 *
 * @public
 * @function
 * @param {string|Mx.parameters.WFS} parameter Parámetro para obtener
 * el "extract" de la capa WFS.
 * @returns {boolean|Array<string>} Devuelve el valor del parámetro "extract".
 * @api
 */
export const getExtractWFS = (parameter) => {
  let extract;
  if (isObject(parameter)) {
    extract = normalize(parameter.extract);
  }

  if (!isNullOrEmpty(extract)) {
    extract = /^1|(true)$/i.test(extract);
  } else {
    extract = undefined;
  }

  return extract;
};

/**
 * Analiza el parámetro para obtener las opciones.
 * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
 *
 * @public
 * @function
 * @param {string|Mx.parameters.WFS} parameter Parámetro para
 * obtener las opciones de la capa WFS.
 * @returns {Mx.parameters.WFSOptions} Opciones de la capa WFS.
 * @throws {Exception} Si el parámetro no es de un tipo soportado.
 * @api
 */
export const getOptionsWFS = (parameter) => {
  let options;
  if (isString(parameter)) {
    // TODO ver como se pone el parámetro
  } else if (isObject(parameter)) {
    options = parameter.options;
  } else {
    Exception(`El parámetro no es de un tipo soportado: ${typeof parameter}`);
  }
  return options;
};

/**
 * Analiza los parámetros WFS de la capa de usuario especificada en un objeto.
 *
 * @param {string|Mx.parameters.WFS} userParameters Parámetros para la capa WFS
 * especificados por el usuario.
 * @returns {Mx.parameters.WFS|Array<Mx.parameters.WFS>} Parámetros de la capa WFS.
 * @public
 * @function
 * @api
 * @throws {M.exception} Si el parámetro no es especificado.
 */
export const wfs = (userParameters) => {
  let layers = [];

  // checks if the param is null or empty
  if (isNullOrEmpty(userParameters)) {
    Exception(getValue('exception').no_param);
  }

  // checks if the parameter is an array
  let userParametersArray = userParameters;
  if (!isArray(userParametersArray)) {
    userParametersArray = [userParametersArray];
  }

  layers = userParametersArray.map((userParam) => {
    const layerObj = {};

    // gets the layer type
    layerObj.type = LayerType.WFS;

    // gets the name
    layerObj.name = getNameWFS(userParam);

    // gets the URL
    layerObj.url = getURLWFS(userParam);

    // gets the name
    layerObj.namespace = getNamespaceWFS(userParam);

    // gets the legend
    layerObj.legend = getLegendWFS(userParam);

    // gets the CQL filter
    layerObj.cql = getCQLWFS(userParam);

    // gets the geometry
    layerObj.geometry = getGeometryWFS(userParam);

    // gets the ids
    layerObj.ids = getIdsWFS(userParam);

    // gets the version
    layerObj.version = getVersionWFS(userParam);

    // gets the extract
    layerObj.extract = getExtractWFS(userParam);

    // gets the styles
    layerObj.style = getStyleWFS(userParam);

    // gets the options
    layerObj.options = getOptionsWFS(userParam);

    // format specified by the user when create object WFS
    layerObj.outputFormat = userParameters.outputFormat;

    return layerObj;
  });

  if (!isArray(userParameters)) {
    layers = layers[0];
  }

  return layers;
};

/**
 * Analiza el parámetro para obtener la leyenda de la capa GeoJSON.
 * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
 *
 * @public
 * @function
 * @param {string|Mx.parameters.GeoJSON} parameter Parámetro para obtener
 * la leyenda de la capa GeoJSON.
 * @returns {string} Leyenda de la capa.
 * @throws {M.exception} Si el parámetro no es de un tipo soportado.
 * @api
 */
export const getLegendGeoJSON = (parameter) => {
  let legend;
  let params;
  if (isString(parameter)) {
    // <GeoJSON(T)?>*<TYPE>*<LEGEND>...
    if (/^GeoJSON(T)?\*[^*]/i.test(parameter)) {
      params = parameter.split(/\*/);
      legend = params[1].trim();
    } else if (/^[^*]+\*[^*]+:[^*]+\*[^*]+/.test(parameter)) {
      // <TYPE>*<LEGEND>...
      params = parameter.split(/\*/);
      legend = params[2].trim();
    }
  } else if (isObject(parameter) && !isNullOrEmpty(parameter.legend)) {
    legend = parameter.legend.trim();
  } else if (!isObject(parameter)) {
    Exception(`El parámetro no es de un tipo soportado: ${typeof parameter}`);
  }

  if (isUrl(legend) || /^(true|false)$/i.test(legend)) {
    legend = null;
  }
  return legend;
};

/**
 * Analiza el parámetro para obtener la URL del servicio GeoJSON.
 * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
 *
 * @public
 * @function
 * @param {string|Mx.parameters.GeoJSON} parameter Parámetro para obtener
 * la URL del servicio GeoJSON.
 * @returns {string} Devuelve el valor de la URL.
 * @throws {Exception} Si el parámetro no es de un tipo soportado.
 * @api
 */
export const getURLGeoJSON = (parameter) => {
  let url;
  if (isString(parameter)) {
    const urlMatches = parameter.match(/^([^*]*\*)*(https?:\/\/[^*]+)([^*]*\*?)*$/i);
    if (urlMatches && (urlMatches.length > 2)) {
      url = urlMatches[2];
    }
  } else if (isObject(parameter)) {
    url = parameter.url;
  } else {
    Exception(`El parámetro no es de un tipo soportado: ${typeof parameter}`);
  }
  return url;
};

/**
 * Analiza el parámetro para obtener la fuente de la capa GeoJSON.
 * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
 *
 * @public
 * @function
 * @param {string|Mx.parameters.GeoJSON} parameter Parámetro para obtener
 * la fuente de la capa GeoJSON.
 * @returns {string} Devuelve el valor de la fuente.
 * @throws {Exception} Si el parámetro no es de un tipo soportado.
 * @api
 */
export const getSourceGeoJSON = (parameter) => {
  let source;
  let params;

  if (isString(parameter)) {
    params = parameter.split(/\*/);
    if (/^GeoJSON\*[^*]+\*[^*]/i.test(parameter)) {
      const param = params[2];
      if (param.indexOf('http') === -1 && param.indexOf('https') === -1) {
        source = param;
      }
    }
  } else if (isObject(parameter)) {
    source = parameter.source;
  } else {
    Exception(`El parámetro no es de un tipo soportado: ${typeof parameter}`);
  }
  return source;
};

/**
 * Analiza el parámetro para obtener el "extract" de la capa GeoJSON.
 * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
 *
 * @public
 * @function
 * @param {string|Mx.parameters.GeoJSON} parameter Parámetro para obtener
 * el "extract" de la capa GeoJSON.
 * @returns {boolean|Array<string>} Devuelve el valor del parámetro "extract".
 * @throws {Exception} Si el parámetro no es de un tipo soportado.
 * @api
 */
export const getExtractGeoJSON = (parameter) => {
  let extract;
  let params;
  let hideParams;
  if (isString(parameter)) {
    // [TYPE]*[LEGEND]*[URL]*[EXTRACT/HIDE]*[STYLE]
    if (/^GeoJSON\*[^*]+\*[^*]+\*[^*]*(true|false)/i.test(parameter)) {
      params = parameter.split(/\*/);
      extract = params[3].trim();
    } else {
      params = parameter.split(/\*/);
      hideParams = params[3];
      if (!isNullOrEmpty(hideParams)) {
        extract = [hideParams];
      } else {
        extract = false;
      }
    }
  } else if (isObject(parameter)) {
    extract = normalize(parameter.extract);
  } else {
    Exception(`El parámetro no es de un tipo soportado: ${typeof parameter}`);
  }

  return extract;
};

/**
 * Analiza el parámetro para obtener el estilo de la capa GeoJSON.
 * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
 *
 * @public
 * @function
 * @param {string|Object|Mx.parameters.GeoJSON} parameter Parámetro para
 * obtener el estilo de la capa GeoJSON.
 * @returns {string} Estilo de la capa.
 * @api
 * @throws {Exception} Si el parámetro no es de un tipo soportado.
 */
export const getStyleGeoJSON = (parameter) => {
  let params;
  let style;

  if (isString(parameter)) {
    if (/^GeoJSON\*[^*]+\*[^*]+\*[^*]*(true|false)+\*[^*]/i.test(parameter)) {
      // [TYPE]*[LEGEND]*[URL]*[EXTRACT/HIDE]*[STYLE]
      if (/^GeoJSON(T)?\*[^*]*\*[^*]+\*[^*]+\*[^*]*/i.test(parameter)) {
        params = parameter.split(/\*/);
        style = params[4].trim();
      } else if (/^GeoJSON(T)?\*[^*]*\*[^*]+\*/i.test(parameter)) {
        params = parameter.split(/\*/);
        style = params[4].trim();
      }
    }
  } else if (isObject(parameter) && !isNullOrEmpty(parameter.style)) {
    style = parameter.style;
  } else if (!isObject(parameter)) {
    Exception(`El parámetro no es de un tipo soportado: ${typeof parameter}`);
  }
  return style;
};

/**
 * Analiza los parámetros para la capa GeoJSON especificados por el usuario.
 *
 * @param {string|Mx.parameters.GeoJSON} userParameters Parámetros para la capa GeoJSON
 * especificados por el usuario.
 * @returns {Mx.parameters.GeoJSON|Array<Mx.parameters.GeoJSON>} Parámetros de la capa
 * GeoJSON.
 * @public
 * @function
 * @api
 * @throws {M.exception} Si el parámetro no es especificado.
 */
export const geojson = (userParameters) => {
  let layers = [];

  // checks if the param is null or empty
  if (isNullOrEmpty(userParameters)) {
    Exception(getValue('exception').no_param);
  }

  // checks if the parameter is an array
  let userParametersArray = userParameters;
  if (!isArray(userParametersArray)) {
    userParametersArray = [userParametersArray];
  }

  layers = userParametersArray.map((userParam) => {
    const layerObj = {};

    // gets the layer type
    layerObj.type = LayerType.GeoJSON;

    // gets the name
    layerObj.name = getLegendGeoJSON(userParam);

    // get the legend
    layerObj.legend = getLegendGeoJSON(userParam);

    // gets the URL
    layerObj.url = getURLGeoJSON(userParam);

    // gets the source
    layerObj.source = getSourceGeoJSON(userParam);

    // gets the name
    layerObj.extract = getExtractGeoJSON(userParam);

    // gets the styles
    layerObj.style = getStyleGeoJSON(userParam);

    return layerObj;
  });

  if (!isArray(userParameters)) {
    layers = layers[0];
  }

  return layers;
};

/**
 * Esta función obtiene la URL de la capa MVT especificada por el usuario.
 * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
 *
 * @function
 * @public
 * @param {string|Mx.parameters.MVT} parameter Parámetro para obtener la
 * URL de la capa MVT.
 * @returns {string} URL de la capa.
 * @api
 * @throws {Exception} Si el parámetro no es de un tipo soportado.
 */
export const getURLMVT = (parameter) => {
  let url;
  if (isString(parameter)) {
    if (/^MVT\*.+/i.test(parameter)) {
      const urlMatches = parameter.match(/.*\*(https?:\/\/[^*]+).*/i);
      if (urlMatches && (urlMatches.length > 1)) {
        url = urlMatches[1];
      }
    }
  } else if (isObject(parameter) && !isNullOrEmpty(parameter.url)) {
    url = parameter.url.trim();
  } else if (!isObject(parameter)) {
    Exception(`El parámetro no es de un tipo soportado: ${typeof parameter}`);
  }
  return url;
};

/**
 * Esta función obtiene el nombre de la capa MVT especificado por el usuario.
 * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
 *
 * @function
 * @public
 * @param {string|Mx.parameters.MVT} parameter Parámetro para obtener el
 * nombre de la capa MVT.
 * @returns {string} Nombre de la capa.
 * @throws {Exception} Si el parámetro no es de un tipo soportado.
 * @api
 */
export const getNameMVT = (parameter) => {
  let name;
  if (isString(parameter)) {
    if (/^MVT\*.+/i.test(parameter)) {
      const urlMatches = parameter.match(/.*\*(https?:\/\/[^*]+)\*([^*]+)/i);
      if (urlMatches && (urlMatches.length > 2)) {
        name = urlMatches[2];
      }
    }
  } else if (isObject(parameter) && !isNullOrEmpty(parameter.name)) {
    name = parameter.name.trim();
  } else if (!isObject(parameter)) {
    Exception(`El parámetro no es de un tipo soportado: ${typeof parameter}`);
  }
  return name;
};

/**
 * Esta función obtiene la leyenda de la capa MVT especificado por el usuario.
 * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
 *
 * @function
 * @public
 * @param {string|Mx.parameters.MVT} parameter Parámetro para obtener la
 * leyenda de la capa MVT.
 * @returns {string} Leyenda de la capa.
 * @throws {Exception} Si el parámetro no es de un tipo soportado.
 * @api
 */
export const getLegendMVT = (parameter) => {
  let legend;
  if (isObject(parameter) && !isNullOrEmpty(parameter.legend)) {
    legend = parameter.legend.trim();
  }
  return legend;
};

/**
 * Analiza los parámetros especificados por el usuario para la capa MVT.
 *
 * @public
 * @function
 * @api
 * @param {string|Mx.parameters.MVT} userParameters Parámetros para la capa MVT.
 * @returns {Mx.parameters.MVT|Array<Mx.parameters.MVT>} Parámetros de la capa MVT.
 * @throws {M.exception} Si el parámetro no es especificado.
 */
export const mvt = (userParameters) => {
  let layers = [];

  // checks if the param is null or empty
  if (isNullOrEmpty(userParameters)) {
    Exception('No ha especificado ningún parámetro');
  }

  // checks if the parameter is an array
  let userParametersArray = userParameters;
  if (!isArray(userParametersArray)) {
    userParametersArray = [userParametersArray];
  }

  layers = userParametersArray.map((userParam) => {
    const layerObj = {};

    layerObj.type = LayerType.MVT;

    layerObj.name = getNameMVT(userParam);

    layerObj.legend = getLegendMVT(userParam);

    layerObj.url = getURLMVT(userParam);

    return layerObj;
  });

  if (!isArray(userParameters)) {
    layers = layers[0];
  }

  return layers;
};

/**
 * Analiza el parámetro para obtener el nombre de la capa WMS.
 *  - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
 *
 * @public
 * @function
 * @param {string|Mx.parameters.WMS} parameter Parámetro para obtener
 * el nombre de la capa WMS.
 * @returns {string} Nombre de la capa.
 * @throws {M.exception} Si el parámetro no es de un tipo soportado.
 * @api
 */
export const getNameWMS = (parameter) => {
  let name;
  let params;
  if (isString(parameter)) {
    if (/^WMS\*.+/i.test(parameter)) {
      // <WMS>*<TITLE>*<URL>*<NAME>
      if (/^WMS\*[^*]+\*[^*]+\*[^*]+/i.test(parameter)) {
        params = parameter.split(/\*/);
        name = params[3].trim();
      }
    } else if (/^[^*]*\*[^*]+/.test(parameter)) {
      // <URL>*<NAME>
      params = parameter.split(/\*/);
      name = params[1].trim();
    } else if (/^[^*]*/.test(parameter)) {
      // <NAME>
      params = parameter.split(/\*/);
      name = params[0].trim();
    }
  } else if (isObject(parameter) && !isNullOrEmpty(parameter.name)) {
    name = parameter.name.trim();
  } else if (!isObject(parameter)) {
    Exception(`El parámetro no es de un tipo soportado: ${typeof parameter}`);
  }

  if (isUrl(name) || /^(true|false)$/i.test(name)) {
    name = null;
  }
  return name;
};

/**
 * Analiza el parámetro para obtener la URL del servicio de la capa WMS.
 *  - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
 *
 * @public
 * @function
 * @param {string|Mx.parameters.WMS} parameter Parámetro para obtener la
 * URL del servicio de la capa WMS.
 * @returns {string} URL del servicio.
 * @throws {Exception} Si el parámetro no es de un tipo soportado.
 * @api
 */
export const getURLWMS = (parameter) => {
  let url;
  if (isString(parameter)) {
    const urlMatches = parameter.match(/^([^*]*\*)*(https?:\/\/[^*]+)([^*]*\*?)*$/i);
    if (urlMatches && (urlMatches.length > 2)) {
      url = urlMatches[2];
    }
  } else if (isObject(parameter)) {
    url = parameter.url;
  } else {
    Exception(`El parámetro no es de un tipo soportado: ${typeof parameter}`);
  }
  return url;
};

/**
 * Analiza el parámetro para obtener la leyenda de la capa WMS.
 * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
 *
 * @public
 * @function
 * @param {string|Mx.parameters.WMS} parameter Parámetro para obtener
 * la leyenda de la capa WMS.
 * @returns {string} Leyenda de la capa.
 * @throws {Exception} Si el parámetro no es de un tipo soportado.
 * @api
 */
export const getLegendWMS = (parameter) => {
  let legend;
  let params;
  if (isString(parameter)) {
    // <WMS>*<TITLE>
    if (/^WMS\*[^*]/i.test(parameter)) {
      params = parameter.split(/\*/);
      legend = params[1].trim();
    } else if (/^[^*]+\*[^*]+\*[^*]+/.test(parameter)) {
      // <URL>*<NAME>*<TITLE>
      params = parameter.split(/\*/);
      legend = params[2].trim();
    }
  } else if (isObject(parameter) && !isNullOrEmpty(parameter.legend)) {
    legend = parameter.legend.trim();
  } else if (!isObject(parameter)) {
    Exception(`El parámetro no es de un tipo soportado: ${typeof parameter}`);
  }

  if (isUrl(legend) || /^(true|false)$/i.test(legend)) {
    legend = null;
  }
  return legend;
};

/**
 * Analiza el parámetro para obtener la transparencia de la capa WMS.
 *  - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
 *
 * @public
 * @function
 * @param {string|Mx.parameters.WMS} parameter Parámetro para obtener la
 * transparencia de la capa WMS.
 * @returns {boolean} Transparencia.
 * @throws {Exception} Si el parámetro no es de un tipo soportado.
 * @api
 */
export const getTransparentWMS = (parameter) => {
  let transparent;
  let params;
  if (isString(parameter)) {
    // <WMS>*<NAME>*<URL>*<TITLE>*<TRANSPARENCE>
    if (/^WMS\*[^*]+\*[^*]+\*[^*]+\*(true|false)/i.test(parameter)) {
      params = parameter.split(/\*/);
      transparent = params[4].trim();
    } else if (/^WMS_FULL\*[^*]+(\*(true|false))?/i.test(parameter)) {
      // <WMS_FULL>*<URL>(*<TILED>)?
      params = parameter.split(/\*/);
      transparent = true;
    } else if (/^[^*]+\*[^*]+\*[^*]+\*(true|false)/i.test(parameter)) {
      // <URL>*<NAME>*<TITLE>*<TRANSPARENCE>
      params = parameter.split(/\*/);
      transparent = params[3].trim();
    } else if (/^[^*]+\*[^*]+\*(true|false)/i.test(parameter)) {
      // <URL>*<NAME>*<TRANSPARENCE>
      params = parameter.split(/\*/);
      transparent = params[2].trim();
    }
  } else if (isObject(parameter)) {
    transparent = normalize(parameter.transparent);
  } else {
    Exception(`El parámetro no es de un tipo soportado: ${typeof parameter}`);
  }
  if (!isNullOrEmpty(transparent)) {
    transparent = /^1|(true)$/i.test(transparent);
  }
  return transparent;
};

/**
 * Analiza el parámetro para obtener la tesela de la capa WMS.
 *  - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
 *
 * @public
 * @function
 * @param {string|Mx.parameters.WMS} parameter Parámetro para obtener la tesela de la
 * capa WMS.
 * @returns {boolean} Indica si la capa es teselada.
 * @throws {Exception} Si el parámetro no es de un tipo soportado.
 * @api
 */
export const getTiledWMS = (parameter) => {
  let tiled;
  let params;
  if (isString(parameter)) {
    // <WMS>*<NAME>*<URL>*<TITLE>*<TRANSPARENCE>*<TILED>
    if (/^WMS\*[^*]+\*[^*]+\*[^*]+\*(true|false)\*(true|false)/i.test(parameter)) {
      params = parameter.split(/\*/);
      tiled = params[5].trim();
    } else if (/^WMS\*[^*]+\*[^*]+\*[^*]+\*(true|false)/i.test(parameter)) {
      tiled = true;
    } else if (/^WMS_FULL\*[^*]+\*(true|false)/i.test(parameter)) {
      // <WMS_FULL>*<URL>*<TILED>
      params = parameter.split(/\*/);
      tiled = params[2].trim();
    } else if (/^[^*]+\*[^*]+\*[^*]+\*(true|false)\*(true|false)/i.test(parameter)) {
      // <URL>*<NAME>*<TITLE>*<TRANSPARENCE>*<TILED>
      params = parameter.split(/\*/);
    } else if (/^[^*]+\*[^*]+\*(true|false)\*(true|false)/i.test(parameter)) {
      // <URL>*<NAME>*<TRANSPARENCE>*<TILED>
      params = parameter.split(/\*/);
    }
  } else if (isObject(parameter)) {
    tiled = normalize(parameter.tiled);
  } else {
    Exception(`El parámetro no es de un tipo soportado: ${typeof parameter}`);
  }
  if (!isNullOrEmpty(tiled)) {
    tiled = /^1|(true)$/i.test(tiled);
  }
  return tiled;
};

/**
 * Analiza el parámetro para obtener la extensión máxima de la capa WMS.
 * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
 *
 * @public
 * @function
 * @param {string|Object|Mx.parameters.WMS} parameter Parámetro para
 * obtener la extensión máxima de la capa WMS.
 * @returns {array} Extensión máxima de la capa.
 * @throws {Exception} Si el parámetro no es de un tipo soportado.
 * @api
 */
export const getMaxExtentWMS = (parameter) => {
  let maxExtentParam;
  if (isString(parameter)) {
    // <WMS>*<LEGEND>*<URL>*<NAME>*<TRANSPARENCE>*<TILED>*<MAXEXTENT>
    if (/^WMS(\*[^*]*){6}$/i.test(parameter)) {
      const params = parameter.split(/\*/);
      maxExtentParam = params[6].trim();
      // <WMS_FULL>*<URL>*<TILED>*<MAXEXTENT>
    } else if (/^WMS_FULL(\*[^*]*){3}/i.test(parameter)) {
      const params = parameter.split(/\*/);
      maxExtentParam = params[3].trim();
    }
    if (!isNullOrEmpty(maxExtentParam)) {
      maxExtentParam = maxExtentParam.split(/[,;]+/);
    }
  } else if (isObject(parameter)) {
    maxExtentParam = parameter.maxExtent;
  } else {
    Exception(`El parámetro no es de un tipo soportado: ${typeof parameter}`);
  }
  if (!isNullOrEmpty(maxExtentParam) && maxExtentParam.length === 4) {
    if (isString(maxExtentParam[0])) {
      maxExtentParam[0] = Number.parseFloat(maxExtentParam[0]);
    }
    if (isString(maxExtentParam[1])) {
      maxExtentParam[1] = Number.parseFloat(maxExtentParam[1]);
    }
    if (isString(maxExtentParam[2])) {
      maxExtentParam[2] = Number.parseFloat(maxExtentParam[2]);
    }
    if (isString(maxExtentParam[3])) {
      maxExtentParam[3] = Number.parseFloat(maxExtentParam[3]);
    }
  } else if (!isNullOrEmpty(maxExtentParam)) {
    Exception(getValue('exception').invalid_maxextent_param);
  }

  return maxExtentParam;
};

/**
 * Analiza el parámetro para obtener la versión de la capa WMS.
 * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
 *
 * @public
 * @function
 * @param {string|Object|Mx.parameters.WMS} parameter Parámetro para
 * obtener la versión de la capa WMS.
 * @returns {string} Versión.
 * @throws {Exception} Si el parámetro no es de un tipo soportado.
 * @api
 */
export const getVersionWMS = (parameter) => {
  let version;
  if (isString(parameter)) {
    if (/(\d\.\d\.\d)$/.test(parameter)) {
      version = parameter.match(/\d\.\d\.\d$/)[0];
    }
  } else if (isObject(parameter)) {
    version = parameter.version;
  } else {
    Exception(`El parámetro no es de un tipo soportado: ${typeof parameter}`);
  }
  return version;
};

/**
 * Analiza el parámetro para obtener las opciones de la capa WMS.
 * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
 *
 * @public
 * @function
 * @param {string|Object|Mx.parameters.WMS} parameter Parámetro para
 * obtener las opciones de la capa WMS.
 * @returns {object} Opciones de la capa WMS.
 * @throws {Exception} Si el parámetro no es de un tipo soportado.
 * @api
 */
export const getOptionsWMS = (parameter) => {
  let options;
  if (isString(parameter)) {
    // TODO ver como se pone el parámetro
  } else if (isObject(parameter)) {
    options = parameter.options;
  } else {
    Exception(`El parámetro no es de un tipo soportado: ${typeof parameter}`);
  }
  return options;
};

/**
 * Analiza el parámetro para obtener las capas en el conjunto de capas WMS.
 * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
 *
 * @public
 * @function
 * @param {string|Object|Mx.parameters.WMS} parameter Parámetro para obtener
 * las capas en el conjunto de capas WMS.
 * @returns {string} Capas en el conjunto de capas.
 * @throws {Exception} Si el parámetro no es de un tipo soportado.
 * @api
 */
export const getDisplayInLayerSwitcherWMS = (parameter) => {
  let displayInLayerSwitcher;
  let params;
  if (isString(parameter)) {
    if (/^WMS\*[^*]+\*[^*]+\*[^*]+\*(true|false)\*(true|false)\*.*\*(\d\.\d\.\d)\*(true|false)/i.test(parameter)) {
      params = parameter.split(/\*/);
      displayInLayerSwitcher = params[8].trim();
    }
  } else if (isObject(parameter)) {
    displayInLayerSwitcher = normalize(parameter.displayInLayerSwitcher);
  } else {
    Exception(`El parámetro no es de un tipo soportado: ${typeof parameter}`);
  }
  if (!isNullOrEmpty(displayInLayerSwitcher)) {
    displayInLayerSwitcher = /^1|(true)$/i.test(displayInLayerSwitcher);
  }
  return displayInLayerSwitcher;
};

/**
 * Analiza el parámetro para obtener si la capa WMS es consultable.
 * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
 *
 * @public
 * @function
 * @param {string|Object|Mx.parameters.WMS} parameter Parámetro para
 * obtener si la capa WMS es consultable.
 * @returns {boolean} Devuelve verdadero si la capa es consultable.
 * @throws {Exception} Si el parámetro no es de un tipo soportado.
 * @api
 */
export const getQueryableWMS = (parameter) => {
  let queryable;
  let params;
  if (isString(parameter)) {
    if (/^WMS\*[^*]+\*[^*]+\*[^*]+\*(true|false)\*(true|false)\*.*\*(\d\.\d\.\d)\*(true|false)\*(true|false)/i.test(parameter)) {
      params = parameter.split(/\*/);
      queryable = params[9].trim();
    }
  } else if (isObject(parameter)) {
    queryable = normalize(parameter.queryable);
  } else {
    Exception(`El parámetro no es de un tipo soportado: ${typeof parameter}`);
  }
  if (!isNullOrEmpty(queryable)) {
    queryable = /^1|(true)$/i.test(queryable);
  }
  return queryable;
};

/**
 * Analiza el parámetro para obtener la visibilidad de la capa WMS.
 * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
 *
 * @public
 * @function
 * @param {string|Object|Mx.parameters.WMS} parameter Parámetro para
 * obtener la visibilidad de la capa WMS.
 * @returns {boolean} Visibilidad de la capa.
 * @throws {Exception} Si el parámetro no es de un tipo soportado.
 * @api
 */
export const getVisibilityWMS = (parameter) => {
  let visibility;
  let params;
  if (isString(parameter)) {
    if (/^WMS\*[^*]+\*[^*]+\*[^*]+\*(true|false)\*(true|false)\*.*\*(\d\.\d\.\d)\*(true|false)\*(true|false)\*(true|false)/i.test(parameter)) {
      params = parameter.split(/\*/);
      visibility = params[10].trim();
    }
  } else if (isObject(parameter)) {
    visibility = normalize(parameter.visibility);
  } else {
    Exception(`El parámetro no es de un tipo soportado: ${typeof parameter}`);
  }
  if (!isNullOrEmpty(visibility)) {
    visibility = /^1|(true)$/i.test(visibility);
  }
  return visibility;
};

/**
 * Analiza el parámetro para saber si hacer una petición al servicio GetCapabilities.
 * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
 * @public
 * @function
 * @param {string|object} parameter Parámetro de la capa.
 * @returns {boolean} Devuelve el valor de useCapabilities.
 * @throws {Exception} Si el parámetro no es de un tipo soportado.
 * @api
 */
export const getUseCapabilitiesWMS = (parameter) => {
  let useCapabilities;
  let params;
  if (isString(parameter)) {
    if (/^WMS\*[^*]+\*[^*]+\*[^*]+\*(true|false)\*(true|false)\*.*\*(\d\.\d\.\d)\*(true|false)\*(true|false)\*(true|false)\*(true|false)/i.test(parameter)) {
      params = parameter.split(/\*/);
      useCapabilities = params[11].trim();
    }
  } else if (isObject(parameter)) {
    useCapabilities = normalize(parameter.useCapabilities);
  } else {
    Exception(`El parámetro no es de un tipo soportado: ${typeof parameter}`);
  }
  if (!isNullOrEmpty(useCapabilities)) {
    useCapabilities = /^1|(true)$/i.test(useCapabilities);
  }

  if (isUndefined(useCapabilities)) {
    useCapabilities = true;
  }

  return useCapabilities;
};

/**
 * Analiza los parámetros WMS de la capa de usuario especificada en un objeto.
 *
 * @param {string|Mx.parameters.WMS} userParameters Parámetros para la capa WMS.
 * @returns {Mx.parameters.WMS|Array<Mx.parameters.WMS>} Parámetros de la capa WMS.
 * @public
 * @function
 * @throws {M.exception} Si el parámetro no es especificado.
 * @api
 */
export const wms = (userParameters) => {
  let layers = [];

  // checks if the param is null or empty
  if (isNullOrEmpty(userParameters)) {
    Exception(getValue('exception').no_param);
  }

  // checks if the parameter is an array
  let userParametersArray = userParameters;
  if (!isArray(userParametersArray)) {
    userParametersArray = [userParametersArray];
  }

  layers = userParametersArray.map((userParam) => {
    const type = LayerType.WMS;
    const name = getNameWMS(userParam);
    const url = getURLWMS(userParam);
    const legend = getLegendWMS(userParam);
    const transparent = getTransparentWMS(userParam);
    const tiled = getTiledWMS(userParam);
    const maxExtentWMS = getMaxExtentWMS(userParam);
    const version = getVersionWMS(userParam);
    const options = getOptionsWMS(userParam);
    const displayInLayerSwitcher = getDisplayInLayerSwitcherWMS(userParam);
    const queryable = getQueryableWMS(userParam);
    const visibility = getVisibilityWMS(userParam);
    const useCapabilities = getUseCapabilitiesWMS(userParam);

    return {
      type,
      name,
      url,
      legend,
      transparent,
      tiled,
      maxExtent: maxExtentWMS,
      version,
      displayInLayerSwitcher,
      queryable,
      visibility,
      options,
      useCapabilities,
    };
  });

  if (!isArray(userParameters)) {
    layers = layers[0];
  }

  return layers;
};

/**
 * Analiza el parámetro para obtener el nombre de la capa GeoTIFF.
 * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
 *
 * @public
 * @function
 * @param {string|Mx.parameters.GeoTIFF} parameter Parámetro para obtener
 * el nombre de la capa GeoTIFF.
 * @returns {string} Nombre de la capa.
 * @throws {Exception} Si el parámetro no es de un tipo soportado.
 * @api
 */
export const getNameGeoTIFF = (parameter) => {
  let name;
  let params;
  if (isString(parameter)) {
    params = parameter.split('*');
    if (params.length >= 4) {
      const value = params[3];
      name = isNullOrEmpty(value) ? undefined : value;
    }
  } else if (isObject(parameter) && !isNullOrEmpty(parameter.name)) {
    name = parameter.name.trim();
  } else if (!isObject(parameter)) {
    Exception(`El parámetro no es de un tipo soportado: ${typeof parameter}`);
  }

  return name;
};

/**
 * Analiza el parámetro para obtener la URL del servicio de la capa GeoTIFF.
 * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
 *
 * @public
 * @function
 * @param {string|Mx.parameters.GeoTIFF} parameter Parámetro para obtener la
 * URL del servicio de la capa GeoTIFF.
 * @returns {string} URL del servicio.
 * @throws {M.exception} Si el parámetro no es de un tipo soportado.
 * @api
 */
export const getURLGeoTIFF = (parameter) => {
  let url;
  let params;
  if (isString(parameter)) {
    params = parameter.split('*');
    if (params.length >= 3) {
      const value = params[2];
      url = isNullOrEmpty(value) ? undefined : value;
    }
  } else if (isObject(parameter) && !isNullOrEmpty(parameter.url)) {
    url = parameter.url.trim();
  } else if (!isObject(parameter)) {
    Exception(`El parámetro no es de un tipo soportado: ${typeof parameter}`);
  }

  return url;
};

/**
 * Analiza el parámetro para obtener la URL del servicio de la capa GeoTIFF.
 * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
 *
 * @public
 * @function
 * @param {string|Mx.parameters.GeoTIFF} parameter Parámetro para obtener la
 * URL del servicio de la capa GeoTIFF.
 * @returns {string} URL del servicio.
 * @throws {M.exception} Si el parámetro no es de un tipo soportado.
 * @api
 */
export const getBlobGeoTIFF = (parameter) => {
  let blob;
  if (isString(parameter)) {
    blob = null;
  } else if (isObject(parameter) && !isNullOrEmpty(parameter.blob)) {
    blob = parameter.blob.trim();
  } else if (!isObject(parameter)) {
    Exception(`El parámetro no es de un tipo soportado: ${typeof parameter}`);
  }

  return blob;
};

/**
 * Analiza el parámetro para obtener la proyeccion de la capa GeoTIFF.
 * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
 *
 * @public
 * @function
 * @param {string|Mx.parameters.GeoTIFF} parameter Parámetro para obtener
 * la proyeccion de la capa GeoTIFF.
 * @returns {string} Conjunto de matrices.
 * @throws {M.exception} Si el parámetro no es de un tipo soportado.
 * @api
 */
export const getProjectionGeoTIFF = (parameter) => {
  let projectionGeoTIFF;
  let params;
  if (isString(parameter)) {
    params = parameter.split('*');
    if (params.length >= 6) {
      const value = params[5];
      projectionGeoTIFF = isNullOrEmpty(value) ? undefined : value;
    }
  } else if (isObject(parameter) && !isNullOrEmpty(parameter.projection)) {
    projectionGeoTIFF = parameter.projection.trim();
  } else if (!isObject(parameter)) {
    Exception(`El parámetro no es de un tipo soportado: ${typeof parameter}`);
  }

  return projectionGeoTIFF;
};

/**
 * Analiza el parámetro para obtener la leyenda de la capa GeoTIFF.
 * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
 *
 * @public
 * @function
 * @param {string|Mx.parameters.GeoTIFF} parameter Parámetro para obtener
 * la leyenda de la capa GeoTIFF.
 * @returns {string} Leyenda de la capa.
 * @throws {M.exception} Si el parámetro no es de un tipo soportado.
 * @api
 */
export const getLegendGeoTIFF = (parameter) => {
  let legend;
  let params;
  if (isString(parameter)) {
    params = parameter.split('*');
    if (params.length >= 2) {
      const value = params[1];
      legend = isNullOrEmpty(value) ? undefined : value;
    }
  } else if (isObject(parameter) && !isNullOrEmpty(parameter.legend)) {
    legend = parameter.legend.trim();
  } else if (!isObject(parameter)) {
    Exception(`El parámetro no es de un tipo soportado: ${typeof parameter}`);
  }

  return legend;
};

/**
 * Analiza el parámetro para obtener la transparencia de la capa GeoTIFF.
 * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
 *
 * @public
 * @function
 * @param {string|Mx.parameters.GeoTIFF} parameter Parámetro para obtener
 * la transparencia de la capa GeoTIFF.
 * @returns {boolean} Devuelve verdadero si la capa es transparente, falso
 * si no.
 * @throws {M.exception} Si el parámetro no es de un tipo soportado.
 * @api
 */
export const getTransparentGeoTIFF = (parameter) => {
  let transparent;
  let params;
  if (isString(parameter)) {
    params = parameter.split('*');
    if (params.length >= 5) {
      const value = params[4];
      transparent = isNullOrEmpty(value) ? undefined : value;
    }
  } else if (isObject(parameter) && !isNullOrEmpty(parameter.transparent)) {
    transparent = parameter.transparent;
  } else if (!isObject(parameter)) {
    Exception(`El parámetro no es de un tipo soportado: ${typeof parameter}`);
  }
  if (!isNullOrEmpty(transparent)) {
    transparent = /^1|(true)$/i.test(transparent);
  }
  return transparent;
};

/**
 * Analiza los parámetros para obtener el conjunto de capas GeoTIFF.
 * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
 *
 * @public
 * @function
 * @param {string|Mx.parameters.GeoTIFF} parameter Parámetro para obtener
 * el conjunto de capas GeoTIFF.
 * @returns {string} Conjunto de capas.
 * @throws {M.exception} Si el parámetro no es de un tipo soportado.
 * @api
 */
export const getDisplayInLayerSwitcherGeoTIFF = (parameter) => {
  let displayInLayerSwitcher;
  let params;
  if (isString(parameter)) {
    params = parameter.split('*');
    if (params.length >= 7) {
      const value = params[6];
      displayInLayerSwitcher = isNullOrEmpty(value) ? undefined : value;
    }
  } else if (isObject(parameter) && !isNullOrEmpty(parameter.displayInLayerSwitcher)) {
    displayInLayerSwitcher = parameter.displayInLayerSwitcher;
  } else if (!isObject(parameter)) {
    Exception(`El parámetro no es de un tipo soportado: ${typeof parameter}`);
  }
  if (!isNullOrEmpty(displayInLayerSwitcher)) {
    displayInLayerSwitcher = /^1|(true)$/i.test(displayInLayerSwitcher);
  }
  return displayInLayerSwitcher;
};

/**
 * Analiza el parámetro para obtener la visibilidad de la capa GeoTIFF.
 * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
 *
 * @public
 * @function
 * @param {string|Mx.parameters.GeoTIFF} parameter Parámetro para obtener
 * la visibilidad de la capa GeoTIFF.
 * @returns {boolean} Visibilidad de la capa.
 * @throws {M.exception} Si el parámetro no es de un tipo soportado.
 * @api
 */
export const getVisibilityGeoTIFF = (parameter) => {
  let visibility;
  let params;
  if (isString(parameter)) {
    params = parameter.split('*');
    if (params.length >= 8) {
      const value = params[7];
      visibility = isNullOrEmpty(value) ? undefined : value;
    }
  } else if (isObject(parameter) && !isNullOrEmpty(parameter.visibility)) {
    visibility = parameter.visibility;
  } else if (!isObject(parameter)) {
    Exception(`El parámetro no es de un tipo soportado: ${typeof parameter}`);
  }
  if (!isNullOrEmpty(visibility)) {
    visibility = /^1|(true)$/i.test(visibility);
  }
  return visibility;
};

/**
 * Analiza el parámetro para obtener la normalización de los datos de la capa GeoTIFF.
 * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
 *
 * @public
 * @function
 * @param {string|Mx.parameters.GeoTIFF} parameter Parámetro para obtener
 * la normalización de la capa GeoTIFF.
 * @returns {boolean} Normalización de los datos.
 * @throws {M.exception} Si el parámetro no es de un tipo soportado.
 * @api
 */
export const getNormalizeGeoTIFF = (parameter) => {
  let normalizeParam;
  let params;
  if (isString(parameter)) {
    params = parameter.split('*');
    if (params.length >= 8) {
      const value = params[7];
      normalizeParam = isNullOrEmpty(value) ? undefined : value;
    }
  } else if (isObject(parameter) && !isNullOrEmpty(parameter.normalize)) {
    normalizeParam = parameter.normalize;
  } else if (!isObject(parameter)) {
    Exception(`El parámetro no es de un tipo soportado: ${typeof parameter}`);
  }
  return normalizeParam;
};

/**
 * Analiza el parámetro para obtener el nombre de la capa WMTS.
 * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
 *
 * @public
 * @function
 * @param {string|Mx.parameters.WMTS} parameter Parámetro para obtener
 * el nombre de la capa WMTS.
 * @returns {string} Nombre de la capa.
 * @throws {Exception} Si el parámetro no es de un tipo soportado.
 * @api
 */
export const getNameWMTS = (parameter) => {
  let name;
  let params;
  if (isString(parameter)) {
    if (/^WMTS\*.+/i.test(parameter)) {
      // <WMTS>*<URL>*<NAME>(*<MATRIXSET>*<TITLE>)?
      if (/^WMTS\*[^*]+\*[^*]+/i.test(parameter)) {
        params = parameter.split(/\*/);
        name = params[2].trim();
      }
    } else if (/^[^*]*\*[^*]+/.test(parameter)) {
      // <URL>*<NAME>
      params = parameter.split(/\*/);
      name = params[1].trim();
    }
  } else if (isObject(parameter) && !isNullOrEmpty(parameter.name)) {
    name = parameter.name.trim();
  } else if (!isObject(parameter)) {
    Exception(`El parámetro no es de un tipo soportado: ${typeof parameter}`);
  }

  if (isUrl(name) || /^(true|false)$/i.test(name)) {
    name = null;
  }
  return name;
};

/**
 * Analiza el parámetro para obtener la URL del servicio de la capa WMTS.
 * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
 *
 * @public
 * @function
 * @param {string|Mx.parameters.WMTS} parameter Parámetro para obtener la
 * URL del servicio de la capa WMTS.
 * @returns {string} URL del servicio.
 * @throws {M.exception} Si el parámetro no es de un tipo soportado.
 * @api
 */
export const getURLWMTS = (parameter) => {
  let url;
  if (isString(parameter)) {
    const urlMatches = parameter.match(/^([^*]*\*)*(https?:\/\/[^*]+)([^*]*\*?)*$/i);
    if (urlMatches && (urlMatches.length > 2)) {
      url = urlMatches[2];
    }
  } else if (isObject(parameter)) {
    url = parameter.url;
  } else {
    Exception(`El parámetro no es de un tipo soportado: ${typeof parameter}`);
  }
  return url;
};

/**
 * Analiza el parámetro para obtener el conjunto de matrices de la capa WMTS.
 * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
 *
 * @public
 * @function
 * @param {string|Mx.parameters.WMTS} parameter Parámetro para obtener el
 * conjunto de matrices de la capa WMTS.
 * @returns {string} Conjunto de matrices.
 * @throws {M.exception} Si el parámetro no es de un tipo soportado.
 * @api
 */
export const getMatrixSetWMTS = (parameter) => {
  let matrixSet;
  let params;
  if (isString(parameter)) {
    // <WMTS>*<URL>*<NAME>*<MATRIXSET>
    if (/^WMTS\*[^*]+\*[^*]+\*[^*]+/i.test(parameter)) {
      params = parameter.split(/\*/);
      matrixSet = params[3].trim();
    } else if (/^[^*]+\*[^*]+\*[^*]+/.test(parameter)) {
      // <URL>*<NAME>*<MATRIXSET>
      params = parameter.split(/\*/);
      matrixSet = params[2].trim();
    }
  } else if (isObject(parameter) && !isNullOrEmpty(parameter.matrixSet)) {
    matrixSet = parameter.matrixSet.trim();
  } else if (!isObject(parameter)) {
    Exception(`El parámetro no es de un tipo soportado: ${typeof parameter}`);
  }

  if (isUrl(matrixSet) || /^(true|false)$/i.test(matrixSet)) {
    matrixSet = null;
  }
  return matrixSet;
};

/**
 * Analiza el parámetro para obtener la leyenda de la capa WMTS.
 * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
 *
 * @public
 * @function
 * @param {string|Mx.parameters.WMTS} parameter Parámetro para obtener
 * la leyenda de la capa WMTS.
 * @returns {string} Leyenda de la capa.
 * @throws {M.exception} Si el parámetro no es de un tipo soportado.
 * @api
 */
export const getLegendWMTS = (parameter) => {
  let legend;
  let params;
  if (isString(parameter)) {
    if (/^WMTS\*.+/i.test(parameter)) {
      // <WMTS>*<URL>*<NAME>*<MATRIXSET>?*<TITLE>
      if (/^WMTS\*[^*]+\*[^*]+\*[^*]*\*[^*]+/i.test(parameter)) {
        params = parameter.split(/\*/);
        legend = params[4].trim();
      }
    } else if (/^[^*]+\*[^*]+\*[^*]*\*[^*]+/.test(parameter)) {
      // <URL>*<NAME>(*<MATRIXSET>)?*<TITLE>
      params = parameter.split(/\*/);
      legend = params[3].trim();
    }
  } else if (isObject(parameter) && !isNullOrEmpty(parameter.legend)) {
    legend = parameter.legend.trim();
  } else if (!isObject(parameter)) {
    Exception(`El parámetro no es de un tipo soportado: ${typeof parameter}`);
  }

  if (isUrl(legend) || /^(true|false)$/i.test(legend)) {
    legend = null;
  }
  return legend;
};

/**
 * Analiza el parámetro para obtener las opciones de la capa WMTS.
 * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
 *
 * @public
 * @function
 * @param {string|Mx.parameters.WMTS} parameter Parámetro de entrada para
 * obtener las opciones de la capa WMTS.
 * @returns {object} Devuelve las opciones de la capa.
 * @throws {M.exception} Si el parámetro no es de un tipo soportado.
 * @api
 */
export const getOptionsWMTS = (parameter) => {
  let options;
  if (isString(parameter)) {
    // TODO ver como se pone el parámetro
  } else if (isObject(parameter)) {
    options = parameter.options;
  } else {
    Exception(`El parámetro no es de un tipo soportado: ${typeof parameter}`);
  }
  return options;
};

/**
 * Analiza el parámetro para obtener la transparencia de la capa WMTS.
 * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
 *
 * @public
 * @function
 * @param {string|Mx.parameters.WMTS} parameter Parámetro para obtener
 * la transparencia de la capa WMTS.
 * @returns {boolean} Devuelve verdadero si la capa es transparente, falso
 * si no.
 * @throws {M.exception} Si el parámetro no es de un tipo soportado.
 * @api
 */
export const getTransparentWMTS = (parameter) => {
  let transparent;
  let params;
  if (isString(parameter)) {
    // <WMTS>*<URL>*<NAME>*<MATRIXSET>?*<TITLE>?*<TRANSPARENT>
    if (/^WMTS\*[^*]+\*[^*]+\*[^*]*\*[^*]*\*(true|false)/i.test(parameter)) {
      params = parameter.split(/\*/);
      transparent = params[5].trim();
    } else if (/^WMS_FULL\*[^*]+(\*(true|false))?/i.test(parameter)) {
      // <WMS_FULL>*<URL>(*<TILED>)?
      params = parameter.split(/\*/);
      transparent = true;
    } else if (/^[^*]+\*[^*]+\*[^*]+\*(true|false)/i.test(parameter)) {
      // <URL>*<NAME>*<TITLE>*<TRANSPARENCE>
      params = parameter.split(/\*/);
      transparent = params[3].trim();
    } else if (/^[^*]+\*[^*]+\*(true|false)/i.test(parameter)) {
      // <URL>*<NAME>*<TRANSPARENCE>
      params = parameter.split(/\*/);
      transparent = params[2].trim();
    }
  } else if (isObject(parameter)) {
    transparent = normalize(parameter.transparent);
  } else {
    Exception(`El parámetro no es de un tipo soportado: ${typeof parameter}`);
  }
  if (!isNullOrEmpty(transparent)) {
    transparent = /^1|(true)$/i.test(transparent);
  }
  return transparent;
};

/**
 * Analiza el parámetro para obtener el formato de la capa WMTS.
 * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
 *
 * @public
 * @function
 * @param {string|Mx.parameters.WMTS} parameter Parámetro para obtener
 * el formato de la capa WMTS.
 * @returns {string} Formato.
 * @throws {M.exception} Si el parámetro no es de un tipo soportado.
 * @api
 */
export const getFormatWMTS = (parameter) => {
  let format;
  let params;
  if (isString(parameter)) {
    if (/^WMTS\*[^*]+\*[^*]+\*[^*]*\*[^*]*\*(true|false)\*(image\/.*)/i.test(parameter)) {
      params = parameter.split(/\*/);
      format = params[6].trim();
    }
  } else if (isObject(parameter)) {
    format = normalize(parameter.format);
  } else {
    Exception(`El parámetro no es de un tipo soportado: ${typeof parameter}`);
  }

  return format;
};

/**
 * Analiza los parámetros para obtener el conjunto de capas WMTS.
 * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
 *
 * @public
 * @function
 * @param {string|Mx.parameters.WMTS} parameter Parámetro para obtener
 * el conjunto de capas WMTS.
 * @returns {string} Conjunto de capas.
 * @throws {M.exception} Si el parámetro no es de un tipo soportado.
 * @api
 */
export const getDisplayInLayerSwitcherWMTS = (parameter) => {
  let displayInLayerSwitcher;
  let params;
  if (isString(parameter)) {
    if (/^WMTS\*[^*]+\*[^*]+\*[^*]*\*[^*]*\*(true|false)\*(image\/.*)\*(true|false)/i.test(parameter)) {
      params = parameter.split(/\*/);
      displayInLayerSwitcher = params[7].trim();
    }
  } else if (isObject(parameter)) {
    displayInLayerSwitcher = normalize(parameter.displayInLayerSwitcher);
  } else {
    Exception(`El parámetro no es de un tipo soportado: ${typeof parameter}`);
  }
  if (!isNullOrEmpty(displayInLayerSwitcher)) {
    displayInLayerSwitcher = /^1|(true)$/i.test(displayInLayerSwitcher);
  }
  return displayInLayerSwitcher;
};

/**
 * Analiza el parámetro que indica si la capa WMTS es consultable.
 * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
 *
 * @public
 * @function
 * @param {string|Mx.parameters.WMTS} parameter Parámetro que indica
 * si la capa WMTS es consultable.
 * @returns {boolean} Verdadero si es consultable, falso si no.
 * @throws {M.exception} Si el parámetro no es de un tipo soportado.
 * @api
 */
export const getQueryableWMTS = (parameter) => {
  let queryable;
  let params;
  if (isString(parameter)) {
    if (/^WMTS\*[^*]+\*[^*]+\*[^*]*\*[^*]*\*(true|false)\*(image\/.*)\*(true|false)\*(true|false)/i.test(parameter)) {
      params = parameter.split(/\*/);
      queryable = params[8].trim();
    }
  } else if (isObject(parameter)) {
    queryable = normalize(parameter.queryable);
  } else {
    Exception(`El parámetro no es de un tipo soportado: ${typeof parameter}`);
  }
  if (!isNullOrEmpty(queryable)) {
    queryable = /^1|(true)$/i.test(queryable);
  }
  return queryable;
};

/**
 * Analiza el parámetro para obtener la visibilidad de la capa WMTS.
 * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
 *
 * @public
 * @function
 * @param {string|Mx.parameters.WMTS} parameter Parámetro para obtener
 * la visibilidad de la capa WMTS.
 * @returns {boolean} Visibilidad de la capa.
 * @throws {M.exception} Si el parámetro no es de un tipo soportado.
 * @api
 */
export const getVisibilityWMTS = (parameter) => {
  let visibility;
  let params;
  if (isString(parameter)) {
    if (/^WMTS\*[^*]+\*[^*]+\*[^*]*\*[^*]*\*(true|false)\*(image\/.*)\*(true|false)\*(true|false)\*(true|false)/i.test(parameter)) {
      params = parameter.split(/\*/);
      visibility = params[9].trim();
    }
  } else if (isObject(parameter)) {
    visibility = normalize(parameter.visibility);
  } else {
    Exception(`El parámetro no es de un tipo soportado: ${typeof parameter}`);
  }
  if (!isNullOrEmpty(visibility)) {
    visibility = /^1|(true)$/i.test(visibility);
  }
  return visibility;
};

export const getUseCapabilitiesWMTS = (parameter) => {
  let useCapabilities;
  let params;
  if (isString(parameter)) {
    if (/^WMTS\*[^*]+\*[^*]+\*[^*]*\*[^*]*\*(true|false)\*(image\/.*)\*(true|false)\*(true|false)\*(true|false)\*(true|false)/i.test(parameter)) {
      params = parameter.split(/\*/);
      useCapabilities = params[10].trim();
    }
  } else if (isObject(parameter)) {
    useCapabilities = normalize(parameter.useCapabilities);
  } else {
    Exception(`El parámetro no es de un tipo soportado: ${typeof parameter}`);
  }
  if (!isNullOrEmpty(useCapabilities)) {
    useCapabilities = /^1|(true)$/i.test(useCapabilities);
  }

  if (isUndefined(useCapabilities)) {
    useCapabilities = true;
  }

  return useCapabilities;
};

/**
 * Analiza los parámetros especificados por el usuario para la capa GeoTIFF.
 *
 * @param {string|Mx.parameters.GeoTIFF} userParameters Parámetros para la capa GeoTIFF.
 * @returns {Mx.parameters.GeoTIFF|Array<Mx.parameters.GeoTIFF>} Parámetros de la capa GeoTIFF.
 * @public
 * @function
 * @api
 */
export const geotiff = (userParameters) => {
  let layers = [];

  // checks if the param is null or empty
  if (isNullOrEmpty(userParameters)) {
    Exception(getValue('exception').no_param);
  }

  // checks if the parameter is an array
  let userParametersArray = userParameters;
  if (!isArray(userParametersArray)) {
    userParametersArray = [userParametersArray];
  }

  layers = userParametersArray.map((userParam) => {
    const layerObj = {};

    // gets the layer type
    layerObj.type = LayerType.GeoTIFF;

    // gets the legend
    layerObj.legend = getLegendGeoTIFF(userParam);

    // gets the URL
    layerObj.url = getURLGeoTIFF(userParam);

    // gets the blob
    layerObj.blob = getBlobGeoTIFF(userParam);

    // gets the name
    layerObj.name = getNameGeoTIFF(userParam);

    // gets transparent
    layerObj.transparent = getTransparentGeoTIFF(userParam);

    // gets the matrix set
    layerObj.projection = getProjectionGeoTIFF(userParam);

    // get displayInLayerSwitcher
    layerObj.displayInLayerSwitcher = getDisplayInLayerSwitcherGeoTIFF(userParam);

    // get visibility
    layerObj.visibility = getVisibilityGeoTIFF(userParam);

    // get normalize
    layerObj.normalize = getNormalizeGeoTIFF(userParam);

    layerObj.isBase = (layerObj.transparent === undefined)
      ? userParam.isBase
      : !layerObj.transparent;

    return layerObj;
  });

  if (!isArray(userParameters)) {
    layers = layers[0];
  }

  return layers;
};

export const maplibre = (userParameters) => {
  const params = userParameters;

  if (!isString(params)) {
    return userParameters;
  }

  const urlParams = params.split(/\*/);
  return {
    type: LayerType.MapLibre,
    legend: urlParams[1] || undefined,
    url: urlParams[2] || undefined,
    name: urlParams[3] || undefined,
    transparent: urlParams[4] === '' ? undefined : urlParams[4] === 'true',
    extract: urlParams[5] === '' ? undefined : urlParams[5] === 'true',
    visibility: urlParams[6] === '' ? undefined : urlParams[6] === 'true',
    displayInLayerSwitcher: urlParams[7] === '' ? true : urlParams[7] === 'true',
    disableBackgroundColor: urlParams[8] === '' ? undefined : urlParams[8] === 'true',
    style: urlParams[9] || undefined,
  };
};

const filterLayerGroupLayers = (data) => {
  // eslint-disable-next-line no-useless-escape
  const regex = /([^\[\],]+(?:\[[^\]]*\])?)/g;
  const matches = [];
  let match;

  // Recorremos todas las capas dentro del grupo
  // eslint-disable-next-line no-cond-assign
  while ((match = regex.exec(data)) !== null) {
    matches.push(match[1].trim());
  }

  return matches;
};

export const layergroup = (userParameters) => {
  let params = userParameters;

  if (!isString(params)) {
    params.type = LayerType.LayerGroup;
    return userParameters;
  }

  params = decodeURI(params);

  const urlParams = params.split(/\*/);
  const layers = filterLayerGroupLayers(params.substring(params.indexOf('[') + 1));

  return {
    type: LayerType.LayerGroup,
    name: urlParams[1] || undefined,
    legend: urlParams[2] || undefined,
    visibility: urlParams[3] === '' ? undefined : urlParams[3] === 'true',
    transparent: urlParams[4] === '' ? undefined : urlParams[4] === 'true',
    displayInLayerSwitcher: urlParams[5] === '' || (urlParams[5] !== 'true' && urlParams[5] !== 'false') ? true : urlParams[5] === 'true',
    layers,
  };
};

/**
 * Analiza el parámetro para obtener el nombre de la capa XYZ.
 * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
 *
 * @public
 * @function
 * @param {string|Mx.parameters.XYZ} parameter Parámetro para obtener
 * el nombre de la capa XYZ.
 * @returns {string} Nombre de la capa.
 * @throws {M.exception} Si el parámetro no es de un tipo soportado.
 * @api
 */
export const getNameXYZ = (parameter) => {
  let name;
  let params;
  if (isString(parameter)) {
    if (/^XYZ\*.+/i.test(parameter)) {
      // <KML>*<NAME>*<URL>(*<FILENAME>)?*<EXTRACT>
      if (/^XYZ\*[^*]+\*[^*]+(\*[^*]+)?(\*(true|false))?/i.test(parameter)) {
        params = parameter.split(/\*/);
        name = params[1].trim();
      }
    } else if (/^[^*]*\*[^*]+/.test(parameter)) {
      // <NAME>*<URL>(*<FILENAME>)?(*<EXTRACT>)?
      params = parameter.split(/\*/);
      name = params[0].trim();
    } else if (/^[^*]*/.test(parameter)) {
      // <NAME>(*<URL>(*<FILENAME>)?(*<EXTRACT>)?)? filtering
      params = parameter.split(/\*/);
      name = params[0].trim();
    }
  } else if (isObject(parameter) && !isNullOrEmpty(parameter.name)) {
    name = parameter.name.trim();
  } else if (!isObject(parameter)) {
    Exception(`El parámetro no es de un tipo soportado: ${typeof parameter}`);
  }

  if (isUrl(name) || /^(true|false)$/i.test(name)) {
    name = null;
  }
  return name;
};

/**
 * Analiza el parámetro para obtener la URL del servicio
 * funciona para capas XYZ y TMS.
 * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
 *
 * @public
 * @function
 * @param {string|Mx.parameters.XYZ|Mx.parameters.TMS} parameter Parámetro
 * para obtener la URL del servicio para capas XYZ y TMS.
 * @returns {string} URL del servicio.
 * @throws {M.exception} Si el parámetro no es de un tipo soportado.
 * @api
 */
export const getURLXYZSource = (parameter) => {
  let url;
  if (isString(parameter)) {
    const urlMatches = parameter.match(/^([^*]*\*)*(https?:\/\/[^*]+)([^*]*\*?)*$/i);
    if (urlMatches && (urlMatches.length > 2)) {
      url = urlMatches[2];
    }
  } else if (isObject(parameter)) {
    url = parameter.url;
  } else {
    Exception(`El parámetro no es de un tipo soportado: ${typeof parameter}`);
  }
  return url;
};

/**
 * Analiza el parámetro para obtener parámetros extra.
 * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
 *
 * @public
 * @function
 * @param {string|Object} parameter Parámetro para obtener parámetros extra.
 * @param {string} defaultValue Valor por defecto.
 * @param {number} position Posición del parámetro.
 * @param {string} nameVariable Nombre de la variable.
 * @returns {string} Valor del parámetro extra.
 * @throws {M.exception} Si el parámetro no es de un tipo soportado.
 * @api
 */
export const getExtraParameter = (parameter, defaultValue, position, nameVariable) => {
  let extraParam;
  let params;
  if (isString(parameter)) {
    params = parameter.split(/\*/);
    if (position + 3 <= params.length - 1) {
      extraParam = params[position + 3].trim();
      // eslint-disable-next-line no-restricted-globals
      if (isNaN(extraParam)) {
        if (extraParam.toLowerCase() === 'true' || extraParam.toLowerCase() === 'false') {
          extraParam = extraParam.toLowerCase() !== 'false';
        }
      } else {
        extraParam = Number(extraParam);
      }
    } else {
      extraParam = defaultValue;
    }
  } else if (isObject(parameter)) {
    if (nameVariable !== 'legend') {
      extraParam = normalize(parameter[nameVariable]);
    } else {
      extraParam = parameter[nameVariable];
    }
  } else {
    Exception(`El parámetro no es de un tipo soportado: ${typeof parameter}`);
  }
  return extraParam;
};

/**
 * Analiza los parámetros especificados por el usuario para la capa XYZ.
 *
 * @param {string|Mx.parameters.XYZ} userParamer Parámetros para la capa XYZ.
 * @returns {Mx.parameters.XYZ|Array<Mx.parameters.XYZ>} Parámetros de la capa XYZ.
 * @public
 * @function
 * @api
 * @throws {M.exception} Si el parámetro no es especificado.
 */
export const xyz = (userParamer) => {
  const userParameters = userParamer;
  let layersVar = [];

  // checks if the param is null or empty
  if (isNullOrEmpty(userParameters)) {
    Exception(getValue('exception').no_param);
  }

  // checks if the parameter is an array
  let userParametersArray = userParameters;
  if (!isArray(userParametersArray)) {
    userParametersArray = [userParametersArray];
  }

  layersVar = userParametersArray.map((userParam) => {
    const layerObj = {};

    // gets the layer type
    layerObj.type = LayerType.XYZ;

    // gets the name
    layerObj.name = getNameXYZ(userParam);

    // gets the URL
    layerObj.url = getURLXYZSource(userParam);

    // get the visibility option
    layerObj.visibility = getExtraParameter(userParam, 'true', 0, 'visibility');

    // gets transparent
    layerObj.transparent = getExtraParameter(userParam, 'true', 1, 'transparent');

    // get displayInLayerSwitcher
    layerObj.displayInLayerSwitcher = getExtraParameter(userParam, 'true', 2, 'displayInLayerSwitcher');

    // gets the legend
    layerObj.legend = getExtraParameter(userParam, layerObj.name, 3, 'legend') || layerObj.name;

    return layerObj;
  });

  if (!isArray(userParameters)) {
    layersVar = layersVar[0];
  }

  return layersVar;
};

/**
 * Analiza el parámetro para obtener el nombre de la capa TMS.
 * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
 *
 * @public
 * @function
 * @param {string|Mx.parameters.TMS} parameter Parámetro para obtener
 * el nombre de la capa TMS.
 * @returns {string} Nombre de la capa.
 * @throws {M.exception} Si el parámetro no es de un tipo soportado.
 * @api
 */
export const getNameTMS = (parameter) => {
  let name;
  let params;
  if (isString(parameter)) {
    if (/^TMS\*.+/i.test(parameter)) {
      // <KML>*<NAME>*<URL>(*<FILENAME>)?*<EXTRACT>
      if (/^TMS\*[^*]+\*[^*]+(\*[^*]+)?(\*(true|false))?/i.test(parameter)) {
        params = parameter.split(/\*/);
        name = params[1].trim();
      }
    } else if (/^[^*]*\*[^*]+/.test(parameter)) {
      // <NAME>*<URL>(*<FILENAME>)?(*<EXTRACT>)?
      params = parameter.split(/\*/);
      name = params[0].trim();
    } else if (/^[^*]*/.test(parameter)) {
      // <NAME>(*<URL>(*<FILENAME>)?(*<EXTRACT>)?)? filtering
      params = parameter.split(/\*/);
      name = params[0].trim();
    }
  } else if (isObject(parameter) && !isNullOrEmpty(parameter.name)) {
    name = parameter.name.trim();
  } else if (!isObject(parameter)) {
    Exception(`El parámetro no es de un tipo soportado: ${typeof parameter}`);
  }

  if (isUrl(name) || /^(true|false)$/i.test(name)) {
    name = null;
  }
  return name;
};

/**
 * Analiza los parámetros especificados por el usuario para la capa TMS.
 *
 * @param {string|Mx.parameters.TMS} userParameters Parámetros para la capa TMS.
 * @returns {Mx.parameters.TMS|Array<Mx.parameters.TMS>} Parámetros de la capa TMS.
 * @public
 * @function
 * @api
 */
export const tms = (userParamer) => {
  const userParameters = userParamer;
  let layersVar = [];

  // checks if the param is null or empty
  if (isNullOrEmpty(userParameters)) {
    Exception(getValue('exception').no_param);
  }

  // checks if the parameter is an array
  let userParametersArray = userParameters;
  if (!isArray(userParametersArray)) {
    userParametersArray = [userParametersArray];
  }

  layersVar = userParametersArray.map((userParam) => {
    const layerObj = {};

    // gets the layer type
    layerObj.type = LayerType.TMS;

    // gets the name
    layerObj.name = getNameTMS(userParam);

    // gets the URL
    layerObj.url = getURLXYZSource(userParam);

    // get the visibility option
    layerObj.visibility = getExtraParameter(userParam, 'true', 0, 'visibility');

    // gets transparent
    layerObj.transparent = getExtraParameter(userParam, 'true', 1, 'transparent');

    // get tileGridMaxZoom
    layerObj.tileGridMaxZoom = getExtraParameter(userParam, '17', 2, 'tileGridMaxZoom');

    // get displayInLayerSwitcher
    layerObj.displayInLayerSwitcher = getExtraParameter(userParam, 'true', 3, 'displayInLayerSwitcher');

    // gets the legend
    layerObj.legend = getExtraParameter(userParam, layerObj.name, 4, 'legend');

    // gets the crossOrigin
    layerObj.crossOrigin = getExtraParameter(userParam, undefined, 5, 'crossOrigin');

    // gets tileSize
    layerObj.tileSize = getExtraParameter(userParam, undefined, 6, 'tileSize');

    return layerObj;
  });

  if (!isArray(userParameters)) {
    layersVar = layersVar[0];
  }

  return layersVar;
};

/**
 * Analiza los parámetros especificados por el usuario para la capa WMTS.
 *
 * @param {string|Mx.parameters.WMTS} userParameters Parámetros para la capa WMTS.
 * @returns {Mx.parameters.WMTS|Array<Mx.parameters.WMTS>} Parámetros de la capa WMTS.
 * @public
 * @function
 * @api
 */
export const wmts = (userParameters) => {
  let layers = [];

  // checks if the param is null or empty
  if (isNullOrEmpty(userParameters)) {
    Exception(getValue('exception').no_param);
  }

  // checks if the parameter is an array
  let userParametersArray = userParameters;
  if (!isArray(userParametersArray)) {
    userParametersArray = [userParametersArray];
  }

  layers = userParametersArray.map((userParam) => {
    const layerObj = {};

    // gets the layer type
    layerObj.type = LayerType.WMTS;

    // gets the name
    layerObj.name = getNameWMTS(userParam);

    // gets the URL
    layerObj.url = getURLWMTS(userParam);

    // gets the matrix set
    layerObj.matrixSet = getMatrixSetWMTS(userParam);

    // gets the legend
    layerObj.legend = getLegendWMTS(userParam);

    // gets the options
    layerObj.options = getOptionsWMTS(userParam);

    // gets transparent
    layerObj.transparent = getTransparentWMTS(userParam);

    // get format
    layerObj.format = getFormatWMTS(userParam);

    // get displayInLayerSwitcher
    layerObj.displayInLayerSwitcher = getDisplayInLayerSwitcherWMTS(userParam);

    // get queryable
    layerObj.queryable = getQueryableWMTS(userParam);

    // get visibility
    layerObj.visibility = getVisibilityWMTS(userParam);

    // get visibility
    layerObj.useCapabilities = getUseCapabilitiesWMTS(userParam);

    return layerObj;
  });

  if (!isArray(userParameters)) {
    layers = layers[0];
  }

  return layers;
};

/**
 * Analiza el parámetro para obtener la leyenda de la capa MBTiles.
 *  - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
 *
 * @public
 * @function
 * @param {string|Mx.parameters.MBTiles} parameter Parámetro para obtener
 * la leyenda de la capa MBTile.
 * @returns {string} Leyenda de la capa.
 * @throws {M.exception} Si el parámetro no es de un tipo soportado.
 * @api
 */
export const getLegendMBTiles = (parameter) => {
  let legend;
  let params;
  if (isString(parameter)) {
    // <MBTiles>*<legend>
    params = parameter.split('*');
    if (params.length - 1 >= 1) {
      const value = params[1].trim();
      legend = isNullOrEmpty(value) ? undefined : value;
    }
  } else if (isObject(parameter) && !isNullOrEmpty(parameter.legend)) {
    legend = parameter.legend.trim();
  } else if (!isObject(parameter)) {
    Exception(`El parámetro no es de un tipo soportado: ${typeof parameter}`);
  }

  return legend;
};

/**
 * Analiza el parámetro para obtener la URL del servicio de la capa MBTiles.
 * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
 *
 * @public
 * @function
 * @param {string|Mx.parameters.MBTiles} parameter Parámetro para obtener la
 * URL del servicio de la capa MBTiles.
 * @returns {string} URL del servicio.
 * @throws {M.exception} Si el parámetro no es de un tipo soportado.
 * @api
 */
export const getURLMBTiles = (parameter) => {
  let url;
  if (isString(parameter)) {
    // <MBTiles>*<legend><URL>
    const urlMatches = parameter.match(/^([^*]*\*)*(https?:\/\/[^*]+)([^*]*\*?)*$/i);
    if (urlMatches && (urlMatches.length > 2)) {
      url = urlMatches[2];
    }
  } else if (isObject(parameter)) {
    url = parameter.url;
  } else {
    Exception(`El parámetro no es de un tipo soportado: ${typeof parameter}`);
  }
  return url;
};

/**
 * Analiza el parámetro para obtener la fuente de la capa MBTiles.
 * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
 *
 * @public
 * @function
 * @param {string|Mx.parameters.MBTiles} parameter Parámetro para obtener
 * la fuente de la capa MBTiles.
 * @returns {string} Fuente de la capa.
 * @api
 */
export const getSourceMBTiles = (parameter) => {
  let source;
  if (isObject(parameter)) {
    source = parameter.source;
  }
  return source;
};

/**
 * Analiza el parámetro para obtener la función de carga de la tesela
 * de la capa MBTiles.
 * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
 *
 * @public
 * @function
 * @param {string|Mx.parameters.MBTiles} parameter Parámetro para obtener
 * la función de carga de la tesela de la capa MBTiles.
 * @returns {Function} función de carga de la tesela.
 * @api
 */
export const getTileLoadFunctionMBTiles = (parameter) => {
  let tileLoadFunction;
  if (isObject(parameter)) {
    tileLoadFunction = parameter.tileLoadFunction;
  }
  return tileLoadFunction;
};

/**
 * Analiza el parámetro para obtener el nombre de la capa MBTiles.
 *  - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
 *
 * @public
 * @function
 * @param {string|Mx.parameters.MBTiles} parameter Parámetro para obtener
 * el nombre de la capa MBTiles.
 * @returns {string} Nombre de la capa.
 * @throws {M.exception} Si el parámetro no es de un tipo soportado.
 * @api
 */
export const getNameMBTiles = (parameter) => {
  let name;
  let params;
  if (isString(parameter)) {
    // <MBTiles>*<legend>*<URL>*<NAME>
    params = parameter.split('*');
    if (params.length - 1 >= 3) {
      const value = params[3].trim();
      name = isNullOrEmpty(value) ? undefined : value;
    } else if (/^[^*]*/.test(parameter)) {
      // <NAME>
      params = parameter.split(/\*/);
      name = params[0].trim();
    }
  } else if (isObject(parameter) && !isNullOrEmpty(parameter.name)) {
    name = parameter.name.trim();
  } else if (!isObject(parameter)) {
    Exception(`El parámetro no es de un tipo soportado: ${typeof parameter}`);
  }

  return name;
};

/**
 * Analiza el parámetro para obtener la transparencia de la capa MBTiles.
 *  - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
 *
 * @public
 * @function
 * @param {string|Mx.parameters.MBTiles} parameter Parámetro para obtener
 * la transparencia de la capa MBTiles.
 * @returns {boolean} Devuelve verdadero si es transparente, falso si no.
 * @throws {M.exception} Si el parámetro no es de un tipo soportado.
 * @api
 */
export const getTransparentMBTiles = (parameter) => {
  let transparent;
  let params;
  if (isString(parameter)) {
    // <MBTiles>*<legend>*<URL>*<NAME>*<transparent>
    params = parameter.split('*');
    if (params.length - 1 >= 4) {
      const value = params[4].trim();
      transparent = isNullOrEmpty(value) ? undefined : value;
    }
  } else if (isObject(parameter) && !isNullOrEmpty(parameter.transparent)) {
    transparent = parameter.transparent;
  } else if (!isObject(parameter)) {
    Exception(`El parámetro no es de un tipo soportado: ${typeof parameter}`);
  }

  return transparent;
};

/**
 * Analiza el parámetro para obtener si la capa MBTiles es visible.
 *  - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
 *
 * @public
 * @function
 * @param {string|Mx.parameters.MBTiles} parameter Parámetro para obtener
 * si la capa MBTiles es visible.
 * @returns {boolean} Devuelve verdadero si es visible, falso si no.
 * @throws {M.exception} Si el parámetro no es de un tipo soportado.
 * @api
 */
export const getVisibilityMBTiles = (parameter) => {
  let visibility;
  let params;
  if (isString(parameter)) {
    // <MBTiles>*<legend>*<URL>*<NAME>*<transparent>*<visibility>
    params = parameter.split('*');
    if (params.length - 1 >= 5) {
      const value = params[5].trim();
      if (!isNullOrEmpty(value)) {
        visibility = value !== 'false';
      } else {
        visibility = undefined;
      }
    }
  } else if (isObject(parameter) && !isNullOrEmpty(parameter.visibility)) {
    visibility = parameter.visibility;
  } else if (!isObject(parameter)) {
    Exception(`El parámetro no es de un tipo soportado: ${typeof parameter}`);
  }

  return visibility;
};

/**
 * Analiza el parámetro para obtener la opacidad de la capa MBTiles.
 *  - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
 *
 * @public
 * @function
 * @param {string|Mx.parameters.MBTiles} parameter Parámetro para obtener
 * la opacidad de la capa MBTiles.
 * @returns {number} Opacidad de la capa.
 * @throws {M.exception} Si el parámetro no es de un tipo soportado.
 * @api
 */
export const getOpacityMBTiles = (parameter) => {
  let opacity;
  let params;
  if (isString(parameter)) {
    // <MBTiles>*<legend>*<URL>*<NAME>*<transparent>*<visibility>*<opacity>
    params = parameter.split('*');
    if (params.length - 1 >= 6) {
      const value = params[6].trim();
      opacity = isNullOrEmpty(value) ? undefined : parseInt(value, 10);
    }
  } else if (isObject(parameter) && !isNullOrEmpty(parameter.opacity)) {
    opacity = parameter.opacity;
  } else if (!isObject(parameter)) {
    Exception(`El parámetro no es de un tipo soportado: ${typeof parameter}`);
  }

  return opacity;
};

/**
 * Analiza el parámetro para obtener el nivel máximo de la capa MBTiles.
 *  - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
 *
 * @public
 * @function
 * @param {string|Mx.parameters.MBTiles} parameter Parámetro para obtener
 * el nivel máximo de la capa MBTiles.
 * @returns {number} Nivel máximo de la capa.
 * @throws {M.exception} Si el parámetro no es de un tipo soportado.
 * @api
 */
export const getMaxZoomLevelMBTiles = (parameter) => {
  let maxZoomLevel;
  let params;
  if (isString(parameter)) {
    // <MBTiles>*<legend>*<URL>*<NAME>*<transparent>*<visibility>*<opacity>*<maxZoomLevel>
    params = parameter.split('*');
    if (params.length - 1 >= 7) {
      const value = params[7].trim();
      maxZoomLevel = isNullOrEmpty(value) ? undefined : parseInt(value, 10);
    }
  } else if (isObject(parameter) && !isNullOrEmpty(parameter.maxZoomLevel)) {
    maxZoomLevel = parameter.maxZoomLevel;
  } else if (!isObject(parameter)) {
    Exception(`El parámetro no es de un tipo soportado: ${typeof parameter}`);
  }

  return maxZoomLevel;
};

/**
 * Analiza el parámetro para obtener la máxima extensión de la capa MBTiles.
 *  - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
 *
 * @public
 * @function
 * @param {string|Mx.parameters.MBTiles} parameter Parámetro para obtener la
 * máxima extensión de la capa MBTiles.
 * @returns {Mx.Extent} Máxima extensión de la capa.
 * @throws {M.exception} Si el parámetro no es de un tipo soportado.
 * @api
 */
export const getMaxExtentMBTiles = (parameter) => {
  let extent;
  let params;
  if (isString(parameter)) {
    // <MBTiles>*<legend>*<URL>*<NAME>*<transparent>*<visibility>*<opacity>
    // *<maxZoomLevel>*<maxExtent>
    params = parameter.split('*');
    if (params.length - 1 >= 8) {
      let value = params[8].trim();
      if (!isNullOrEmpty(value)) {
        value = value.split(';');
        if (!isNullOrEmpty(value) && value.length === 4) {
          value = value.map((ext) => parseFloat(ext.trim()));
          extent = value;
        }
      } else {
        extent = undefined;
      }
    }
  } else if (isObject(parameter) && !isNullOrEmpty(parameter.maxExtent)) {
    extent = parameter.maxExtent;
  } else if (!isObject(parameter)) {
    Exception(`El parámetro no es de un tipo soportado: ${typeof parameter}`);
  }

  return extent;
};

/**
 * Analiza el parámetro para obtener el tamaño de la tesela.
 * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
 *
 * @public
 * @function
 * @param {string|Mx.parameters.MBTiles} parameter Parámetro para obtener el tamaño
 * de la tesela de la capa MBTiles.
 * @returns {Number} Tamaño de la tesela de la capa.
 * @throws {M.exception} Si el parámetro no es de un tipo soportado.
 * @api
 */
export const getTileSizeMBTiles = (parameter) => {
  let params;
  let tileSize;

  if (isString(parameter)) {
    // <MBTiles>*<legend>*<URL>*<NAME>*<transparent>*<visibility>*<opacity>
    // *<maxZoomLevel>*<maxExtent>*<tileSize>
    params = parameter.split('*');
    if (params.length - 1 >= 9) {
      const value = params[9].trim();
      tileSize = isNullOrEmpty(value) ? undefined : parseInt(value, 10);
    }
  } else if (isObject(parameter) && !isNullOrEmpty(parameter.tileSize)) {
    tileSize = parseInt(normalize(parameter.tileSize), 10);
  } else if (!isObject(parameter)) {
    Exception(`El parámetro no es de un tipo soportado: ${typeof parameter}`);
  }
  return tileSize;
};

/**
 * Analiza los parámetros especificados por el usuario para la capa MBTiles.
 *
 * @param {string|Mx.parameters.MBTiles} userParameters Parámetros para la capa
 * especificados por el usuario.
 * @returns {Mx.parameters.MBTiles|Array<Mx.parameters.MBTiles>} Parámetros de la
 * capa MBTiles.
 * @public
 * @function
 * @api
 * @throws {M.exception} Si el parámetro no es especificado.
 */
export const mbtiles = (userParameters) => {
  let layers = [];

  // checks if the param is null or empty
  if (isNullOrEmpty(userParameters)) {
    Exception(getValue('exception').no_param);
  }

  // checks if the parameter is an array
  let userParametersArray = userParameters;
  if (!isArray(userParametersArray)) {
    userParametersArray = [userParametersArray];
  }

  layers = userParametersArray.map((userParam) => {
    const layerObj = {};

    layerObj.type = LayerType.MBTiles;

    layerObj.legend = getLegendMBTiles(userParam);

    layerObj.url = getURLMBTiles(userParam);

    layerObj.source = getSourceMBTiles(userParam);

    layerObj.name = getNameMBTiles(userParam);

    layerObj.transparent = getTransparentMBTiles(userParam);

    layerObj.visibility = getVisibilityMBTiles(userParam);

    layerObj.opacity = getOpacityMBTiles(userParam);

    layerObj.maxZoomLevel = getMaxZoomLevelMBTiles(userParam);

    layerObj.maxExtent = getMaxExtentMBTiles(userParam);

    layerObj.tileLoadFunction = getTileLoadFunctionMBTiles(userParam);

    layerObj.tileSize = getTileSizeMBTiles(userParam);

    return layerObj;
  });

  if (!isArray(userParameters)) {
    layers = layers[0];
  }

  return layers;
};

/**
 * Analiza el parámetro para obtener la leyenda de la capa MBTilesVector.
 *  - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
 *
 * @public
 * @function
 * @param {string|Mx.parameters.MBTilesVector} parameter Parámetro para
 * obtener la leyenda de la capa MBTilesVector.
 * @returns {string} Leyenda de la capa.
 * @throws {M.exception} Si el parámetro no es de un tipo soportado.
 * @api
 */
export const getLegendMBTilesVector = (parameter) => {
  let legend;
  let params;
  if (isString(parameter)) {
    // <MBTilesVector>*<legend>
    params = parameter.split('*');
    if (params.length - 1 >= 1) {
      const value = params[1].trim();
      legend = isNullOrEmpty(value) ? undefined : value;
    }
  } else if (isObject(parameter) && !isNullOrEmpty(parameter.legend)) {
    legend = parameter.legend.trim();
  } else if (!isObject(parameter)) {
    Exception(`El parámetro no es de un tipo soportado: ${typeof parameter}`);
  }

  return legend;
};

/**
 * Analiza el parámetro para obtener la URL del servicio de la capa MBTilesVector.
 * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
 *
 * @public
 * @function
 * @param {string|Mx.parameters.MBTilesVector} parameter Parámetro para obtener
 * la URL del servicio de la capa MBTilesVector.
 * @returns {string} URL del servicio.
 * @throws {M.exception} Si el parámetro no es de un tipo soportado.
 * @api
 */
export const getURLMBTilesVector = (parameter) => {
  let url;
  if (isString(parameter)) {
    // <MBTilesVector>*<legend><URL>
    const urlMatches = parameter.match(/^([^*]*\*)*(https?:\/\/[^*]+)([^*]*\*?)*$/i);
    if (urlMatches && (urlMatches.length > 2)) {
      url = urlMatches[2];
    }
  } else if (isObject(parameter)) {
    url = parameter.url;
  } else {
    Exception(`El parámetro no es de un tipo soportado: ${typeof parameter}`);
  }
  return url;
};

/**
 * Analiza el parámetro para obtener la fuente de la capa MBTilesVector.
 * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
 *
 * @public
 * @function
 * @param {string|Mx.parameters.MBTilesVector} parameter Parámetro para
 * obtener la fuente de la capa MBTilesVector.
 * @returns {string} Fuente de la capa.
 * @api
 */
export const getSourceMBTilesVector = (parameter) => {
  let source;
  if (isObject(parameter)) {
    source = parameter.source;
  }
  return source;
};

/**
 * Analiza el parámetro para obtener la función de carga de la tesela
 * vectorial de la capa MBTilesVector.
 * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
 *
 * @public
 * @function
 * @param {string|Mx.parameters.MBTilesVector} parameter Parámetro para
 * obtener la función de carga de la tesela vectorial de la
 * capa MBTilesVector.
 * @returns {Function} Función de carga de la tesela vectorial.
 * @api
 */
export const getTileLoadFunctionMBTilesVector = (parameter) => {
  let tileLoadFunction;
  if (isObject(parameter)) {
    tileLoadFunction = parameter.tileLoadFunction;
  }
  return tileLoadFunction;
};

/**
 * Analiza el parámetro para obtener el nombre de la capa MBTilesVector.
 *  - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
 *
 * @public
 * @function
 * @param {string|Mx.parameters.MBTilesVector} parameter Parámetro para
 * obtener el nombre de la capa MBTilesVector.
 * @returns {string} Nombre de la capa.
 * @throws {M.exception} Si el parámetro no es de un tipo soportado.
 * @api
 */
export const getNameMBTilesVector = (parameter) => {
  let name;
  let params;
  if (isString(parameter)) {
    // <MBTilesVector>*<legend>*<URL>*<NAME>
    params = parameter.split('*');
    if (params.length - 1 >= 3) {
      const value = params[3].trim();
      name = isNullOrEmpty(value) ? undefined : value;
    } else if (/^[^*]*/.test(parameter)) {
      // <NAME>
      params = parameter.split(/\*/);
      name = params[0].trim();
    }
  } else if (isObject(parameter) && !isNullOrEmpty(parameter.name)) {
    name = parameter.name.trim();
  } else if (!isObject(parameter)) {
    Exception(`El parámetro no es de un tipo soportado: ${typeof parameter}`);
  }

  return name;
};

/**
 * Analiza el parámetro que indica si la capa MBTilesVector es visible.
 *  - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
 *
 * @public
 * @function
 * @param {string|Mx.parameters.MBTilesVector} parameter Parámetro que indica
 * si la capa MBTilesVector es visible.
 * @returns {boolean} Devuelve verdadero si la capa es visible, falso si no.
 * @throws {M.exception} Si el parámetro no es de un tipo soportado.
 * @api
 */
export const getVisibilityMBTilesVector = (parameter) => {
  let visibility;
  let params;
  if (isString(parameter)) {
    // <MBTilesVector>*<legend>*<URL>*<NAME>*<visibility>
    params = parameter.split('*');
    if (params.length - 1 >= 4) {
      const value = params[4].trim();
      if (!isNullOrEmpty(value)) {
        visibility = value !== 'false';
      } else {
        visibility = undefined;
      }
    }
  } else if (isObject(parameter) && !isNullOrEmpty(parameter.visibility)) {
    visibility = parameter.visibility;
  } else if (!isObject(parameter)) {
    Exception(`El parámetro no es de un tipo soportado: ${typeof parameter}`);
  }

  return visibility;
};

/**
 * Analiza el parámetro para obtener la máxima extensión de la capa MBTilesVector.
 *  - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
 * @public
 * @function
 * @param {string|Mx.parameters.MBTilesVector} parameter Parámetro para obtener
 * la máxima extensión de la capa MBTilesVector.
 * @returns {Mx.Extent} Máxima extensión de la capa.
 * @api
 */
export const getMaxExtentMBTilesVector = (parameter) => {
  let extent;
  if (isObject(parameter) && !isNullOrEmpty(parameter.maxExtent)) {
    extent = parameter.maxExtent;
  }

  return extent;
};

/**
 * Analiza el parámetro para obtener el tamaño de la tesela.
 * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
 *
 * @public
 * @function
 * @param {string|Mx.parameters.MBTilesVector} parameter Parámetro para obtener el tamaño
 * de la tesela de la capa MBTilesVector.
 * @returns {Number} Tamaño de la tesela de la capa.
 * @throws {M.exception} Si el parámetro no es de un tipo soportado.
 * @api
 */
export const getTileSizeMBTilesVector = (parameter) => {
  let params;
  let tileSize;

  if (isString(parameter)) {
    // <MBTilesVector>*<legend>*<URL>*<NAME>*<visibility>*<tileSize>
    params = parameter.split('*');
    if (params.length - 1 >= 5) {
      const value = params[5].trim();
      tileSize = isNullOrEmpty(value) ? undefined : parseInt(value, 10);
    }
  } else if (isObject(parameter) && !isNullOrEmpty(parameter.tileSize)) {
    tileSize = parseInt(normalize(parameter.tileSize), 10);
  } else if (!isObject(parameter)) {
    Exception(`El parámetro no es de un tipo soportado: ${typeof parameter}`);
  }
  return tileSize;
};

/**
 * Analiza el parámetro para obtener el estilo.
 * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
 *
 * @public
 * @function
 * @param {string|Mx.parameters.MBTilesVector} parameter Parámetro para obtener el estilo
 * de la capa MBTilesVector.
 * @returns {string} Estilo de la capa.
 * @throws {M.exception} Si el parámetro no es de un tipo soportado.
 * @api
 */
export const getStyleMBTilesVector = (parameter) => {
  let params;
  let style;

  if (isString(parameter)) {
    // <MBTilesVector>*<legend>*<URL>*<NAME>*<visibility>*<tileSize>*<style>
    params = parameter.split('*');
    if (params.length - 1 >= 6) {
      const value = params[6].trim();
      style = isNullOrEmpty(value) ? undefined : value;
    }
  } else if (isObject(parameter) && !isNullOrEmpty(parameter.style)) {
    style = parameter.style;
  } else if (!isObject(parameter)) {
    Exception(`El parámetro no es de un tipo soportado: ${typeof parameter}`);
  }
  return style;
};

/**
 * Analiza el parámetro de capas MBTilesVector especificado y devuelve el "extract" de la capa.
 *
 * @public
 * @function
 * @param {String} parameter Parámetro de capas MBTilesVector especificado.
 * @returns {Boolean|undefined} Valor del extract.
 * @api
 * @throws {M.exception} Si el parámetro no es de un tipo soportado.
 */
export const getExtractMBTilesVector = (parameter) => {
  let params;
  let extract;

  if (isString(parameter)) {
    params = parameter.split('*');
    if (params.length - 1 >= 7) {
      const value = params[7].trim();
      extract = isNullOrEmpty(value) ? undefined : value;
    }
  } else if (isObject(parameter) && !isNullOrEmpty(parameter.extract)) {
    extract = parameter.extract;
  } else if (!isObject(parameter)) {
    Exception(`El parámetro no es de un tipo soportado: ${typeof parameter}`);
  }
  return extract;
};

/**
 * Analiza los parámetros especificados por el usuario para la capa MBTilesVector.
 *
 * @param {string|Mx.parameters.MBTilesVector} userParameters Parámetros para la capa
 * MBTilesVector especificados por el usuario.
 * @returns {Mx.parameters.MBTilesVector|Array<Mx.parameters.MBTilesVector>} Parámetros
 * de la capa MBTilesVector.
 * @public
 * @function
 * @api
 * @throws {M.exception} Si el parámetro no es especificado.
 */
export const mbtilesvector = (userParameters) => {
  let layers = [];

  // checks if the param is null or empty
  if (isNullOrEmpty(userParameters)) {
    Exception(getValue('exception').no_param);
  }

  // checks if the parameter is an array
  let userParametersArray = userParameters;
  if (!isArray(userParametersArray)) {
    userParametersArray = [userParametersArray];
  }

  layers = userParametersArray.map((userParam) => {
    const layerObj = {};

    layerObj.type = LayerType.MBTilesVector;

    layerObj.legend = getLegendMBTilesVector(userParam);

    layerObj.url = getURLMBTilesVector(userParam);

    layerObj.source = getSourceMBTilesVector(userParam);

    layerObj.name = getNameMBTilesVector(userParam);

    layerObj.visibility = getVisibilityMBTilesVector(userParam);

    layerObj.tileSize = getTileSizeMBTilesVector(userParam);

    layerObj.maxExtent = getMaxExtentMBTilesVector(userParam);

    layerObj.tileLoadFunction = getTileLoadFunctionMBTilesVector(userParam);

    layerObj.style = getStyleMBTilesVector(userParam);

    layerObj.extract = getExtractMBTilesVector(userParam);

    return layerObj;
  });

  if (!isArray(userParameters)) {
    layers = layers[0];
  }

  return layers;
};

/**
 * Analiza el parámetro para obtener la leyenda de la capa.
 * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
 *
 * @public
 * @function
 * @param {string|Mx.parameters.OGCAPIFeatures} parameter Parámetro para obtener la leyenda
 * de la capa OGCAPIFeatures.
 * @returns {string} Leyenda de la capa.
 * @throws {M.exception} Si el parámetro no es de un tipo soportado.
 * @api
 */
const getLegendOGC = (parameter) => {
  let legend;
  let params;
  if (isString(parameter)) {
    params = parameter.split('*');
    if (params.length >= 1) {
      const value = params[1];
      legend = isNullOrEmpty(value) ? undefined : value;
    }
  } else if (isObject(parameter) && !isNullOrEmpty(parameter.legend)) {
    legend = parameter.legend.trim();
  } else if (!isObject(parameter)) {
    Exception(`El parámetro no es de un tipo soportado: ${typeof parameter}`);
  }

  return legend;
};

/**
 * Analiza el parámetro para obtener la URL del servicio.
 * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
 *
 * @public
 * @function
 * @param {string|Mx.parameters.OGCAPIFeatures} parameter Parámetro para obtener
 * la URL del servicio para la capa OGCAPIFeatures.
 * @returns {string} URL del servicio.
 * @throws {M.exception} Si el parámetro no es de un tipo soportado.
 * @api
 */
const getURLOGC = (parameter) => {
  let url;
  if (isString(parameter)) {
    const urlMatches = parameter.match(/^([^*]*\*)*(https?:\/\/[^*]+)([^*]*\*?)*$/i);
    if (urlMatches && (urlMatches.length > 2)) {
      url = urlMatches[2];
    }
  } else if (isObject(parameter)) {
    url = parameter.url;
  } else {
    Exception(`El parámetro no es de un tipo soportado: ${typeof parameter}`);
  }
  return url;
};

/**
 * Analiza el parámetro para obtener el nombre de la capa.
 * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
 *
 * @public
 * @function
 * @param {string|Mx.parameters.OGCAPIFeatures} parameter Parámetro para obtener
 * el nombre de la capa OGCAPIFeatures.
 * @returns {string} Nombre de la capa.
 * @throws {Mx.exception} Si el parámetro no es de un tipo soportado.
 * @api
 */
const getNameOGC = (parameter) => {
  let name;
  let params;
  if (isString(parameter)) {
    params = parameter.split('*');
    if (params.length >= 3) {
      const value = params[3];
      name = isNullOrEmpty(value) ? undefined : value;
    } else {
      name = params[0].trim();
    }
  } else if (isObject(parameter) && !isNullOrEmpty(parameter.name)) {
    name = parameter.name.trim();
  } else if (!isObject(parameter)) {
    Exception(`El parámetro no es de un tipo soportado: ${typeof parameter}`);
  }

  return name;
};

/**
 * Analiza el parámetro para obtener el límite de resultados de la capa.
 * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
 *
 * @public
 * @function
 * @param {string|Mx.parameters.OGCAPIFeatures} parameter Parámetro para obtener
 * el límite de resultados de la capa OGCAPIFeatures.
 * @returns {Number} Límite de resultados de la capa.
 * @throws {Mx.exception} Si el parámetro no es de un tipo soportado.
 * @api
 */
const getLimitOGC = (parameter) => {
  let limit;
  let params;
  if (isString(parameter)) {
    params = parameter.split('*');
    if (params.length >= 4) {
      const value = params[4];
      limit = isNullOrEmpty(value) ? undefined : parseInt(value, 10);
    }
  } else if (isObject(parameter)) {
    if (!isUndefined(parameter.limit)) {
      limit = parseInt(normalize(parameter.limit), 10);
    }
  } else {
    Exception(`El parámetro no es de un tipo soportado: ${typeof parameter}`);
  }
  return limit;
};

/**
 * Analiza el parámetro para obtener el bbox aplicado a los resultados de la capa.
 * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
 *
 * @public
 * @function
 * @param { string | Mx.parameters.OGCAPIFeatures } parameter Parámetro para
 * obtener el bbox aplicado a los resultados de la capa.
 * @returns {Array} Límite de resultados de la capa.
 * @throws {Mx.exception} Si el parámetro no es de un tipo soportado.
 * @api
 */
const getBboxOGC = (parameter) => {
  let bbox;
  let params;
  if (isString(parameter)) {
    params = parameter.split('*');
    if (params.length >= 5) {
      const value = params[5];
      bbox = isNullOrEmpty(value) ? undefined : value;
    }
  } else if (isObject(parameter)) {
    bbox = normalize(parameter.bbox);
  } else {
    Exception(`El parámetro no es de un tipo soportado: ${typeof parameter}`);
  }
  if (!isNullOrEmpty(bbox) && !isArray(bbox)) {
    bbox = bbox.split(';');
    bbox.forEach((elm, i) => {
      bbox[i] = parseFloat(elm);
    });
  }
  return bbox;
};

/**
 * Analiza el parámetro para obtener el filtro por id aplicado a la capa.
 * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
 *
 * @public
 * @function
 * @param { string | Mx.parameters.OGCAPIFeatures } parameter Parámetro para
 * obtener el filtro por id aplicado a la capa.
 * @returns {Number} Límite de resultados de la capa.
 * @throws {Mx.exception} Si el parámetro no es de un tipo soportado.
 * @api
 */
const getIdOGC = (parameter) => {
  let id;
  let params;
  if (isString(parameter)) {
    params = parameter.split('*');
    if (params.length >= 6) {
      const value = params[6];
      id = isNullOrEmpty(value) ? undefined : parseInt(value, 10);
    }
  } else if (isObject(parameter)) {
    id = parameter.id;
  } else {
    Exception(`El parámetro no es de un tipo soportado: ${typeof parameter}`);
  }
  return id;
};

/**
 * Analiza el parámetro para obtener el offset aplicado a la capa.
 * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
 *
 * @public
 * @function
 * @param { string | Mx.parameters.OGCAPIFeatures } parameter Parámetro para
 * obtener el offset aplicado a la capa.
 * @returns {Number} Offset de la capa.
 * @throws {Mx.exception} Si el parámetro no es de un tipo soportado.
 * @api
 */
const getOffsetOGC = (parameter) => {
  let offset;
  let params;
  if (isString(parameter)) {
    params = parameter.split('*');
    if (params.length >= 7) {
      const value = params[7];
      offset = isNullOrEmpty(value) ? undefined : parseInt(value, 10);
    }
  } else if (isObject(parameter)) {
    offset = normalize(parameter.offset);
  } else {
    Exception(`El parámetro no es de un tipo soportado: ${typeof parameter}`);
  }

  return offset;
};

/**
 * Analiza el parámetro para obtener el formato en el que solicita los resultados a la capa.
 * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
 *
 * @public
 * @function
 * @param { string | Mx.parameters.OGCAPIFeatures } parameter Parámetro para
 * obtener el formato en el que solicita los resultados a la capa.
 * @returns {String} Formato en el que solicita los resultados a la capa.
 * @throws {Mx.exception} Si el parámetro no es de un tipo soportado.
 * @api
 */
const getFormatOGC = (parameter) => {
  let format;
  let params;
  if (isString(parameter)) {
    params = parameter.split('*');
    if (params.length >= 8) {
      const value = params[8];
      format = isNullOrEmpty(value) ? undefined : value;
    }
  } else if (isObject(parameter)) {
    format = normalize(parameter.format);
  } else {
    Exception(`El parámetro no es de un tipo soportado: ${typeof parameter}`);
  }

  return format;
};

/**
 * Analiza el parámetro para obtener el estilo.
 * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
 *
 * @public
 * @function
 * @param {string|Mx.parameters.OGCAPIFeatures} parameter Parámetro para obtener el estilo
 * de la capa OGCAPIFeatures.
 * @returns {string} Estilo de la capa.
 * @throws {M.exception} Si el parámetro no es de un tipo soportado.
 * @api
 */
export const getStyleOGC = (parameter) => {
  let params;
  let style;

  if (isString(parameter)) {
    params = parameter.split('*');
    if (params.length >= 9) {
      const value = params[9];
      style = isNullOrEmpty(value) ? undefined : value;
    }
  } else if (isObject(parameter) && !isNullOrEmpty(parameter.style)) {
    style = parameter.style;
  } else if (!isObject(parameter)) {
    Exception(`El parámetro no es de un tipo soportado: ${typeof parameter}`);
  }
  return style;
};

/**
 * Analiza el parámetro para obtener los condicionales.
 * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
 *
 * @public
 * @function
 * @param {string|Mx.parameters.OGCAPIFeatures} parameter Parámetro para obtener los condicionales
 * de la capa OGCAPIFeatures.
 * @returns {string} Condicionales de la capa.
 * @throws {M.exception} Si el parámetro no es de un tipo soportado.
 * @api
 */
export const getConditionalOGC = (parameter) => {
  let conditional;
  if (isObject(parameter) && !isNullOrEmpty(parameter.conditional)) {
    conditional = parameter.conditional;
  }
  return conditional;
};

/**
 * Analiza el parámetro de capas OGCAPIFeatures especificado y devuelve el "extract" de la capa.
 *
 * @public
 * @function
 * @param {String} parameter Parámetro de capas OGCAPIFeatures especificado.
 * @returns {Boolean|undefined} Valor del extract.
 * @api
 * @throws {M.exception} Si el parámetro no es de un tipo soportado.
 */
export const getExtractOGC = (parameter) => {
  let params;
  let extract;

  if (isString(parameter)) {
    params = parameter.split('*');
    if (params.length >= 10) {
      const value = params[10];
      extract = isNullOrEmpty(value) ? undefined : value;
    }
  } else if (isObject(parameter) && !isNullOrEmpty(parameter.extract)) {
    extract = parameter.extract;
  } else if (!isObject(parameter)) {
    Exception(`El parámetro no es de un tipo soportado: ${typeof parameter}`);
  }
  return extract;
};

/**
 * Analiza los parámetros especificados por el usuario para la capa OGCAPIFeatures.
 *
 * @param {string|Mx.parameters.WMS} userParameters Parámetros para la capa OGCAPIFeatures.
 * @returns {Mx.parameters.WMS|Array<Mx.parameters.OGCAPIFeatures>} Parámetros de la capa
 * OGCAPIFeatures.
 * @public
 * @function
 * @throws {M.exception} Si el parámetro no es especificado.
 * @api
 */
export const ogcapifeatures = (userParameters) => {
  let layers = [];

  // checks if the param is null or empty
  if (isNullOrEmpty(userParameters)) {
    Exception(getValue('exception').no_param);
  }

  // checks if the parameter is an array
  let userParametersArray = userParameters;
  if (!isArray(userParametersArray)) {
    userParametersArray = [userParametersArray];
  }

  layers = userParametersArray.map((userParam) => {
    const type = LayerType.OGCAPIFeatures;
    const legend = getLegendOGC(userParam);
    const url = getURLOGC(userParam);
    const name = getNameOGC(userParam);
    const limit = getLimitOGC(userParam);
    const bbox = getBboxOGC(userParam);
    const format = getFormatOGC(userParam);
    const offset = getOffsetOGC(userParam);
    const id = getIdOGC(userParam);
    const style = getStyleOGC(userParam);
    const conditional = getConditionalOGC(userParam);
    const extract = getExtractOGC(userParam);

    return {
      type,
      legend,
      url,
      name,
      limit,
      bbox,
      format,
      offset,
      id,
      style,
      conditional,
      extract,
    };
  });

  if (!isArray(userParameters)) {
    layers = layers[0];
  }

  return layers;
};

const generic = (userParameters, type) => {
  const params = userParameters;

  if (!isString(params)) {
    return userParameters;
  }

  const urlParams = params.split(/\*/);
  return {
    type,
    // eslint-disable-next-line no-eval
    vendorOptions: eval(decodeURIComponent(escape(window.atob(urlParams[1])))) || undefined,
    name: urlParams[2] || undefined,
    legend: urlParams[3] || undefined,
    transparent: urlParams[4] || undefined,
    minZoom: urlParams[5] || undefined,
    maxZoom: urlParams[6] || undefined,
    displayInLayerSwitcher: urlParams[7] || undefined,
    visibility: urlParams[8] || undefined,
  };
};

const genericvector = (userParameters) => {
  return generic(userParameters, 'GenericVector');
};

const genericraster = (userParameters) => {
  return generic(userParameters, 'GenericRaster');
};

const osm = (userParameters) => {
  const params = userParameters;

  if (!isString(params)) {
    return {
      ...params,
      type: 'osm',
    };
  }

  return getParameters(params);
};

/**
 * Parámetros con los tipos de capa soportados.
 * @const
 * @type {object}
 * @public
 * @api
 */
const parameterFunction = {
  kml,
  wfs,
  osm,
  wms,
  geotiff,
  maplibre,
  layergroup,
  wmts,
  geojson,
  mvt,
  xyz,
  tms,
  mbtiles,
  mbtilesvector,
  ogcapifeatures,
  genericvector,
  genericraster,
};

/**
 * Analiza los parámetros de capa de usuario especificados en un objeto.
 *
 * @param {string|Mx.parameters.Layer} userParameters Parámetros para la capa.
 * @param {string} forcedType Fuerza el tipo de capa.
 * @returns {Mx.parameters.Layer|Array<Mx.parameters.Layer>} Capa.
 * @public
 * @function
 * @api
 */
export const layer = (userParameters, forcedType) => {
  let layers = [];

  // checks if the param is null or empty
  if (isNullOrEmpty(userParameters)) {
    Exception(getValue('exception').no_param);
  }

  // checks if the parameter is an array
  let userParametersArray = userParameters;
  if (!isArray(userParametersArray)) {
    userParametersArray = [userParametersArray];
  }

  layers = userParametersArray.map((userParam) => {
    let layerObj = null;
    if (userParam instanceof Layer) {
      layerObj = userParam;
    } else {
      // gets the layer type
      let type = getType(userParam, forcedType);
      type = normalize(type);

      if (isFunction(parameterFunction[type])) {
        layerObj = parameterFunction[type](userParam);
      } else {
        layerObj = userParam;
      }

      if (!isNullOrEmpty(userParam.isBase)) {
        layerObj.transparent = !userParam.isBase;
      }

      // wfs
      if (!isNullOrEmpty(userParam.transparent)) {
        layerObj.transparent = userParam.transparent;
      }

      if (!isNullOrEmpty(userParam.infoEventType)) {
        layerObj.infoEventType = userParam.infoEventType;
      }

      if (!isNullOrEmpty(userParam.attribution)) {
        layerObj.attribution = userParam.attribution;
      }

      // if (!isNullOrEmpty(userParam.isBase)) {
      //   layerObj.isBase = userParam.isBase;
      // } else if (userParam.name !== '__draw__') {
      //   layerObj.isBase = (userParam.transparent !== undefined) ?
      //     !userParam.transparent : false;
      // }

      // if (!isNullOrEmpty(userParam.minZoom)) {
      //   layerObj.minZoom = userParam.minZoom;
      // }

      // if (!isNullOrEmpty(userParam.maxZoom)) {
      //   layerObj.maxZoom = userParam.maxZoom;
      // }

      // // name
      // if (!isNullOrEmpty(userParam.name)) {
      //   layerObj.name = userParam.name;
      // }

      // // legend
      // if (!isNullOrEmpty(userParam.legend)) {
      //   layerObj.legend = userParam.legend;
      // }
    }

    return layerObj;
  });

  if (!isArray(userParameters)) {
    layers = layers[0];
  }

  return layers;
};

/**
 * Este comentario no se verá, es necesario incluir
 * una exportación por defecto para que el compilador
 * muestre las funciones.
 *
 * Esto se produce por al archivo normaliza-exports.js
 * @api stable
 */
export default {};
