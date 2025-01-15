/**
 * @module M/parameter/tms
 * @example import tmsParameter from 'M/parameter/tms';
 */
import {
  isArray, isNullOrEmpty, isObject, isString, normalize,
} from '../util/Utils';
import Exception from '../exception/exception';
import { TMS } from '../layer/Type';
import { getValue } from '../i18n/language';

/**
  * Expresión regular para capas TMS
  * @type {RegExp}
  * @public
  * @api
  */
const REGEXP_TMS = /TMS\*.*/;

/**
  * Este método obtiene el valor del parámetro
  * especificado por el usuario
  *
  * @function
  * @param {Object} param0 Opciones
  * - parameter: Parámetro
  * - attr: Nombre del atributo
  * - type: Tipo de dato
  * - separator: Separador. Por defecto '' (string vacío).
  * - normalized: Indica si el valor se debe
  * normalizar. Por defecto es falso.
  * @returns {String} Valor
  * @public
  * @api
  */
const getParameter = ({
  parameter,
  attr,
  type,
  separator,
  normalized = false,
}) => (regexp, position) => {
  let value;
  const parserType = {
    boolean: (param) => /^1|(true)$/i.test(param),
    string: (param) => param,
    int: (param) => Number.parseInt(param, 10),
    float: (param) => Number.parseFloat(param, 10),
    array_number: (param) => param.split(separator || '')
      .map((elem) => elem.trim())
      .map((n) => Number.parseFloat(n)),
  };
  if (isString(parameter) && regexp.test(parameter)) {
    const params = parameter.split('*');
    const param = params[position];
    if (!isNullOrEmpty(param)) {
      value = parserType[type](param);
    }
  } else if (isObject(parameter)) {
    value = parameter[attr];
  } else {
    Exception(`El parámetro no es de un tipo soportado: ${typeof parameter}`);
  }
  if (isString(value)) {
    value = value.trim();
  }
  if (normalized === true) {
    value = normalize(value);
  }
  return value;
};

/**
  * Convierte los parámetros especificados por el usuario de la capa tms
  * a un objeto
  *
  * @function
  * @param {String|Array} userParameters Parámetros especificados
  * @returns {Array<Object>} Lista de objetos a partir de los parámetros
  * especificados
  * @public
  * @api
  */
const tms = (userParameters) => {
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
    const type = TMS;
    const name = getParameter({
      parameter: userParam,
      type: 'string',
      attr: 'name',
    });
    const url = getParameter({
      parameter: userParam,
      type: 'string',
      attr: 'url',
    });
    const legend = getParameter({
      parameter: userParam,
      type: 'string',
      attr: 'legend',
    });
    const displayInLayerSwitcher = getParameter({
      parameter: userParam,
      type: 'boolean',
      attr: 'displayInLayerSwitcher',
    });
    let params;
    if (REGEXP_TMS.test(userParam) || isObject(userParam)) {
      params = {
        type,
        name: name(REGEXP_TMS, 3),
        url: url(REGEXP_TMS, 2),
        legend: legend(REGEXP_TMS, 1),
        displayInLayerSwitcher: displayInLayerSwitcher(REGEXP_TMS, 4),
      };
    }
    return params;
  });
  if (!isArray(userParameters)) {
    layers = layers[0];
  }
  return layers;
};
export default tms;
