/**
 * @module IDEE/impl/style/FlatStyleTranslator
 */
import chroma from 'chroma-js';
import { isNullOrEmpty, isFunction, isArray } from 'IDEE/util/Utils';

const templateRegexp = /^\{\{([^}]+)\}\}$/;

/**
 * Error interno: la opción no tiene equivalente en el estilo plano de WebGL.
 */
class UntranslatableError extends Error {}

/**
 * Indica si el valor es una plantilla de atributo.
 * @param {*} value Valor.
 * @returns {boolean} Verdadero si es una plantilla.
 */
const isTemplate = (value) => typeof value === 'string' && templateRegexp.test(value);

/**
 * Traduce un valor de opción a literal o expresión.
 * @param {*} value Valor de la opción.
 * @returns {*} Valor del estilo plano o indefinido.
 */
const toValue = (value) => {
  if (isNullOrEmpty(value)) {
    return undefined;
  }
  if (isFunction(value)) {
    throw new UntranslatableError();
  }
  if (isTemplate(value)) {
    return ['get', value.replace(templateRegexp, '$1')];
  }
  if (isArray(value) && value.some((v) => isFunction(v) || isTemplate(v))) {
    throw new UntranslatableError();
  }
  return value;
};

/**
 * Traduce color y opacidad con la misma semántica que el estilo Canvas.
 * @param {*} colorOption Color.
 * @param {*} opacityOption Opacidad.
 * @returns {Array|undefined} Color o expresión de color.
 */
const toColor = (colorOption, opacityOption) => {
  const color = toValue(colorOption);
  if (color === undefined) {
    return undefined;
  }
  const opacity = toValue(opacityOption);
  const isColorExpression = isArray(color) && color[0] === 'get';
  const isOpacityExpression = isArray(opacity) && opacity[0] === 'get';
  if (isColorExpression) {
    if (opacity !== undefined && opacity !== 1) {
      throw new UntranslatableError();
    }
    return color;
  }
  try {
    if (isOpacityExpression) {
      return ['color', ...chroma(color).rgb(), opacity];
    }
    return chroma(color).alpha(opacity === undefined ? 1 : opacity).rgba();
  } catch (err) {
    throw new UntranslatableError();
  }
};

/**
 * Añade al estilo las propiedades definidas.
 * @param {Object} style Estilo plano.
 * @param {Object} properties Propiedades a añadir.
 * @returns {Object} Estilo plano.
 */
const assignDefined = (style, properties) => {
  Object.keys(properties).forEach((key) => {
    if (properties[key] !== undefined) {
      // eslint-disable-next-line no-param-reassign
      style[key] = properties[key];
    }
  });
  return style;
};

/**
 * Comprueba las opciones que solo se pueden dibujar con Canvas.
 * @param {Object} options Opciones del bloque de geometría.
 */
const checkCanvasOnlyOptions = (options) => {
  if (!isNullOrEmpty(options.label) || !isNullOrEmpty(options.renderer)
    || !isNullOrEmpty(options.fill?.pattern) || !isNullOrEmpty(options.stroke?.pattern)) {
    throw new UntranslatableError();
  }
};

/**
 * Traduce un trazo a propiedades de tipo Stroke.
 * @param {Object} stroke Opciones del trazo.
 * @returns {Object|undefined} Estilo plano del trazo.
 */
const toStroke = (stroke) => {
  if (isNullOrEmpty(stroke)) {
    return undefined;
  }
  const color = toColor(stroke.color, stroke.opacity);
  if (color === undefined) {
    return undefined;
  }
  return assignDefined({ 'stroke-color': color }, {
    'stroke-width': toValue(stroke.width) ?? 1,
    'stroke-line-dash': toValue(stroke.linedash),
    'stroke-line-dash-offset': toValue(stroke.linedashoffset),
    'stroke-line-cap': toValue(stroke.linecap),
    'stroke-line-join': toValue(stroke.linejoin),
    'stroke-miter-limit': toValue(stroke.miterlimit),
  });
};

/**
 * Traduce un icono con imagen  a propiedades de tipo icon.
 * @param {Object} icon Opciones del icono.
 * @returns {Object} Estilo plano del icono.
 */
const toIcon = (icon) => {
  if (isNullOrEmpty(icon.src) || !isNullOrEmpty(icon.offset)) {
    throw new UntranslatableError();
  }
  return assignDefined({ 'icon-src': toValue(icon.src) }, {
    'icon-opacity': toValue(icon.opacity),
    'icon-scale': toValue(icon.scale),
    'icon-rotation': toValue(icon.rotation),
    'icon-rotate-with-view': toValue(icon.rotate),
    'icon-anchor': toValue(icon.anchor),
    'icon-anchor-x-units': toValue(icon.anchorxunits),
    'icon-anchor-y-units': toValue(icon.anchoryunits),
    'icon-anchor-origin': toValue(icon.anchororigin),
    'icon-size': toValue(icon.size),
  });
};

/**
 * Traduce el bloque de punto.
 * @param {Object} options Opciones del punto.
 * @returns {Array<Object>} Estilos planos.
 */
const toPointStyles = (options) => {
  checkCanvasOnlyOptions(options);
  const styles = [];
  const radius = toValue(options.radius);
  const fill = isNullOrEmpty(options.fill)
    ? undefined : toColor(options.fill.color, options.fill.opacity);
  const stroke = toStroke(options.stroke);
  if (radius !== undefined && (fill !== undefined || stroke !== undefined)) {
    styles.push(assignDefined({ 'circle-radius': radius }, {
      'circle-fill-color': fill,
      'circle-stroke-color': stroke?.['stroke-color'],
      'circle-stroke-width': stroke?.['stroke-width'],
    }));
  }
  if (!isNullOrEmpty(options.icon)) {
    styles.push(toIcon(options.icon));
  }
  return styles;
};

/**
 * Traduce el bloque de línea.
 * @param {Object} options Opciones de la línea.
 * @returns {Array<Object>} Estilos planos.
 */
const toLineStyles = (options) => {
  checkCanvasOnlyOptions(options);
  const styles = [];
  const stroke = toStroke(options.stroke);
  if (stroke !== undefined) {
    styles.push(stroke);
  }
  if (!isNullOrEmpty(options.fill)) {
    const color = toColor(options.fill.color, options.fill.opacity);
    if (color !== undefined) {
      styles.push(assignDefined({ 'stroke-color': color }, {
        'stroke-width': toValue(options.fill.width) ?? 1,
      }));
    }
  }
  return styles;
};

/**
 * Traduce el bloque de polígono.
 * @param {Object} options Opciones del polígono.
 * @returns {Array<Object>} Estilos planos.
 */
const toPolygonStyles = (options) => {
  checkCanvasOnlyOptions(options);
  const style = assignDefined({}, {
    'fill-color': isNullOrEmpty(options.fill)
      ? undefined : toColor(options.fill.color, options.fill.opacity),
    ...toStroke(options.stroke),
  });
  return Object.keys(style).length > 0 ? [style] : [];
};

/**
 * Traductores por tipo de geometría simplificado.
 * @const
 * @type {Object}
 */
const RULES_BY_GEOMETRY = [
  { key: 'point', geometryType: 'Point', translate: toPointStyles },
  { key: 'line', geometryType: 'LineString', translate: toLineStyles },
  { key: 'polygon', geometryType: 'Polygon', translate: toPolygonStyles },
];

/**
 * Este método traduce las opciones de un estilo genérico
 * a reglas de estilo plano de OpenLayers.
 *
 * @function
 * @public
 * @param {Object} options Opciones del estilo IDEE.style.Generic.
 * @returns {Array<Object>|null} Reglas de estilo plano, o nulo si alguna opción
 * @api
 */
export const toGenericFlatStyle = (options = {}) => {
  try {
    const rules = [];
    RULES_BY_GEOMETRY.forEach(({ key, geometryType, translate }) => {
      if (!isNullOrEmpty(options[key])) {
        const style = translate(options[key]);
        if (style.length > 0) {
          rules.push({ filter: ['==', ['geometry-type'], geometryType], style });
        }
      }
    });
    return rules.length > 0 ? rules : null;
  } catch (err) {
    if (err instanceof UntranslatableError) {
      return null;
    }
    throw err;
  }
};

/**
 * Añade un filtro a cada regla de estilo plano.
 * @param {Array<Object>} rules Reglas de estilo plano.
 * @param {Array} filter Filtro a añadir.
 * @returns {Array<Object>} Reglas filtradas.
 */
const withFilter = (rules, filter) => rules.map((rule) => ({
  ...rule,
  filter: rule.filter ? ['all', filter, rule.filter] : filter,
}));

/**
 * Este método construye las reglas de un estilo por categorías.
 *
 * @function
 * @public
 * @param {string} attributeName Atributo de la categoría.
 * @param {Array<{value: (string|number), rules: Array<Object>}>} entries Reglas por valor.
 * @param {Array<Object>|null} otherRules Reglas para el resto de valores.
 * @returns {Array<Object>} Reglas de estilo plano.
 * @api
 */
export const toCategoryFlatStyle = (attributeName, entries, otherRules) => {
  const attribute = ['get', attributeName];
  const rules = entries.flatMap(({ value, rules: valueRules }) => withFilter(valueRules, ['==', attribute, value]));
  if (!isNullOrEmpty(otherRules)) {
    const notListed = ['all', ...entries.map(({ value }) => ['!=', attribute, value])];
    rules.push(...withFilter(otherRules, entries.length > 0 ? notListed : true));
  }
  return rules;
};

/**
 * Este método construye las reglas de un estilo por intervalos.
 *
 * @function
 * @public
 * @param {string} attributeName Atributo numérico.
 * @param {Array<number>} breakPoints Puntos de corte ascendentes.
 * @param {Array<Array<Object>>} rulesByRange Reglas de cada intervalo.
 * @returns {Array<Object>} Reglas de estilo plano.
 * @api
 */
export const toRangesFlatStyle = (attributeName, breakPoints, rulesByRange) => {
  const attribute = ['get', attributeName];
  return breakPoints.flatMap((breakPoint, i) => {
    const upTo = ['<=', attribute, breakPoint];
    const filter = i === 0 ? upTo : ['all', ['>', attribute, breakPoints[i - 1]], upTo];
    return withFilter(rulesByRange[i], filter);
  });
};

export default toGenericFlatStyle;
