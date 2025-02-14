/**
 * @module M/parameter/mbtilesvector
 * @example import mbtilesVectorParameter from 'M/parameter/mbtilesvector';
 */
import {
  isArray, isNullOrEmpty, isObject, isString, normalize,
} from '../util/Utils';
import Exception from '../exception/exception';
import { getValue } from '../i18n/language';

/**
 * Expresión regular para el parámetro de capa vectorial MBTiles.
 * @const
 * @type {RegExp}
 * @public
 * @api
 */
const REGEXP_MBTILES = /MBTiles\*. */;

/**
 * Esta función devuelve el valor del parámetro.
 * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
 * @function
 * @public
 * @param {string|object} parameter Parámetro.
 * @param {string} attr Atributo del parámetro.
 * @param {string} type Tipo de dato del parámetro.
 * @param {string} separator Separador de los valores del array.
 * @param {boolean} normalized Indica si el parámetro está normalizado.
 * @return {function} Devuelve el valor del parámetro.
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
 * Crea un objeto de tipo mbtilesvector a partir de los parámetros del usuario.
 *
 * @function
 * @public
 * @param {string|object} userParameters Parámetros de la capa.
 * @return {object} Capa.
 * @api
 */
const mbtilesvector = (userParameters) => {
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
    const type = 'MBTilesVector';
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
    let params;
    if (REGEXP_MBTILES.test(userParam) || isObject(userParam)) {
      params = {
        type,
        name: name(REGEXP_MBTILES, 3),
        url: url(REGEXP_MBTILES, 2),
        legend: legend(REGEXP_MBTILES, 1),
      };
    }
    return params;
  });
  if (!isArray(userParameters)) {
    layers = layers[0];
  }
  return layers;
};

export default mbtilesvector;
