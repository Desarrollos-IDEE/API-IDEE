/**
 * @module IDEE/impl/style/Tiles3D
 */
import {
  isNullOrEmpty, isBoolean, isArray, isObject, isUndefined,
} from 'IDEE/util/Utils';
import Style from './Style';

/**
 * Indica si una cadena es una expresión de estilo 3D Tiles (no un nombre simple).
 *
 * @function
 * @param {String} colorStr Cadena de color.
 * @returns {Boolean} Verdadero si es expresión.
 */
export const isTiles3DColorStyleExpression = (colorStr) => {
  const trimmed = colorStr.trim();
  if (trimmed.startsWith('color(') || trimmed.includes('${') || trimmed.includes('?')) {
    return true;
  }
  return false;
};

/**
 * Indica si una cadena es una expresión de visibilidad 3D Tiles.
 *
 * @function
 * @param {String} showStr Cadena show.
 * @returns {Boolean} Verdadero si es expresión.
 */
export const isTiles3DShowStyleExpression = (showStr) => {
  const trimmed = showStr.trim();
  if (trimmed.includes('${') || trimmed.includes('?') || /[<>]=?|===?|!==?/.test(trimmed)) {
    return true;
  }
  return false;
};

/**
 * Convierte un nombre de color en expresión de estilo 3D Tiles o devuelve la expresión tal cual.
 *
 * @function
 * @param {String} color Nombre o expresión de color.
 * @returns {String|undefined} Expresión de color.
 */
export const formatTiles3DColor = (color) => {
  if (isNullOrEmpty(color) || typeof color !== 'string') {
    return undefined;
  }
  const colorStr = color.trim();
  if (isTiles3DColorStyleExpression(colorStr)) {
    return colorStr;
  }
  return `color('${colorStr}')`;
};

/**
 * Normaliza el valor show de una condición para el estilo 3D Tiles.
 *
 * @function
 * @param {Boolean|String} value Valor de la condición.
 * @returns {Boolean|String} Valor del estilo.
 */
export const formatTiles3DShowConditionValue = (value) => {
  if (isBoolean(value)) {
    return value;
  }
  if (typeof value === 'string') {
    return value.trim();
  }
  return value;
};

/**
 * Resuelve la opción color de fachada al valor del estilo 3D Tiles.
 *
 * @function
 * @param {String|Mx.Tiles3DStyleColorConditions} color Color del estilo.
 * @returns {String|Object|undefined} color o { conditions }.
 */
export const resolveTiles3DColorOption = (color) => {
  if (isNullOrEmpty(color)) {
    return undefined;
  }
  if (isObject(color) && isArray(color.conditions)) {
    const conditions = color.conditions.map((condition) => {
      if (!isArray(condition) || condition.length < 2) {
        return condition;
      }
      const test = condition[0];
      const colorValue = condition[1];
      let resolvedColor = colorValue;
      if (typeof colorValue === 'string') {
        resolvedColor = formatTiles3DColor(colorValue);
      }
      return [test, resolvedColor];
    });
    return { conditions };
  }
  if (typeof color === 'string') {
    return formatTiles3DColor(color);
  }
  return undefined;
};

/**
 * Resuelve la opción show de fachada al valor del estilo 3D Tiles.
 *
 * @function
 * @param {Boolean|String|Mx.Tiles3DStyleShowConditions} show Visibilidad del estilo.
 * @returns {Boolean|String|Object|undefined} show para el visor.
 */
export const resolveTiles3DShowOption = (show) => {
  if (isUndefined(show) || show === null) {
    return undefined;
  }
  if (isBoolean(show)) {
    return show;
  }
  if (isObject(show) && isArray(show.conditions)) {
    const conditions = show.conditions.map((condition) => {
      if (!isArray(condition) || condition.length < 2) {
        return condition;
      }
      const test = condition[0];
      const showValue = condition[1];
      return [test, formatTiles3DShowConditionValue(showValue)];
    });
    return { conditions };
  }
  if (typeof show === 'string') {
    const showStr = show.trim();
    if (isTiles3DShowStyleExpression(showStr)) {
      return showStr;
    }
    if (showStr === 'true') {
      return true;
    }
    if (showStr === 'false') {
      return false;
    }
    return showStr;
  }
  return undefined;
};

/**
 * @classdesc
 * Implementación del estilo 3D Tiles.
 * @api
 */
class Tiles3D extends Style {
  /**
   * Constructor principal de la clase.
   *
   * @constructor
   * @param {Object} options Opciones del estilo.
   * @param {Object} vendorOptions Opciones de la biblioteca base.
   * @api stable
   */
  constructor(options = {}, vendorOptions = {}) {
    super(options);
    this.options_ = { ...options, ...vendorOptions };
  }

  /**
   * Convierte las opciones al objeto de estilo 3D Tiles del visor.
   *
   * @public
   * @function
   * @returns {Object} Estilo para el tileset.
   * @api stable
   */
  toCesiumStyle() {
    const cesiumStyle = {};
    const { options_ } = this;
    if (Object.hasOwn(options_, 'color')) {
      const colorExpr = resolveTiles3DColorOption(options_.color);
      if (!isNullOrEmpty(colorExpr)) {
        cesiumStyle.color = colorExpr;
      }
    }
    if (Object.hasOwn(options_, 'show')) {
      const showExpr = resolveTiles3DShowOption(options_.show);
      if (!isUndefined(showExpr)) {
        cesiumStyle.show = showExpr;
      }
    }
    return cesiumStyle;
  }
}

export default Tiles3D;
