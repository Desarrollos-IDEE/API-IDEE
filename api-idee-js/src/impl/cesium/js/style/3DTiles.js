/**
 * @module IDEE/impl/style/3DTiles
 */
import {
  isNullOrEmpty, isBoolean, isArray, isObject,
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
 * Convierte un nombre de color en expresión Cesium3DTileStyle o devuelve la expresión tal cual.
 *
 * @function
 * @param {String} color Nombre o expresión de color.
 * @returns {String|undefined} Expresión para Cesium3DTileStyle.
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
 * Resuelve la opción color de fachada al valor de Cesium3DTileStyle.
 *
 * @function
 * @param {String|Mx.Tiles3DStyleColorConditions} color Color del estilo.
 * @returns {String|Object|undefined} color o { conditions } para Cesium.
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
 * @classdesc
 * Implementación Cesium del estilo 3D Tiles.
 * @api
 */
class Tiles3DStyle extends Style {
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
   * Actualiza las opciones del estilo.
   *
   * @public
   * @function
   * @param {Object} options Opciones del estilo.
   * @param {Object} vendorOptions Opciones de la biblioteca base.
   * @api stable
   */
  setOptions(options = {}, vendorOptions = {}) {
    this.options_ = { ...options, ...vendorOptions };
  }

  /**
   * Convierte las opciones al objeto de Cesium3DTileStyle.
   *
   * @public
   * @function
   * @returns {Object} Estilo para Cesium3DTileStyle.
   * @api stable
   */
  toCesiumStyle() {
    const cesiumStyle = {};
    const colorExpr = resolveTiles3DColorOption(this.options_.color);
    if (!isNullOrEmpty(colorExpr)) {
      cesiumStyle.color = colorExpr;
    }
    if (isBoolean(this.options_.show)) {
      cesiumStyle.show = this.options_.show;
    }
    return cesiumStyle;
  }
}

export default Tiles3DStyle;
