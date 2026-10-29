import { getValue } from '../../i18n/language';
import { Display, ResultKey, ValueType } from '../turftypes';

/**
 * Formatea un número con el idioma de la API (máximo 3 decimales).
 *
 * @param {Number} value Número.
 * @returns {String} Número formateado.
 */
const formatNumber = (value) => value.toLocaleString(IDEE.language.getLang(), {
  maximumFractionDigits: 3,
});

/**
 * Tabla HTML con la extensión [minX, minY, maxX, maxY].
 *
 * @param {Array<Number>} bbox Extensión.
 * @returns {String} HTML de la tabla.
 */
const formatBbox = ([minX, minY, maxX, maxY]) => `<table class="m-vectorsmanagement-turf-result">
        <tr><th>${getValue(`turf.results.${ResultKey.MIN_X}`)}</th><td>${minX}</td></tr>
        <tr><th>${getValue(`turf.results.${ResultKey.MIN_Y}`)}</th><td>${minY}</td></tr>
        <tr><th>${getValue(`turf.results.${ResultKey.MAX_X}`)}</th><td>${maxX}</td></tr>
        <tr><th>${getValue(`turf.results.${ResultKey.MAX_Y}`)}</th><td>${maxY}</td></tr>
      </table>`;

/**
 * Texto de cada tipo de valor, a partir del valor y de los parámetros con
 * que se ha calculado (sus unidades).
 * @const
 * @type {Object<ValueType, function(*, Object): String>}
 */
const FORMATS = Object.freeze({
  [ValueType.AREA]: (value, p) => `${formatNumber(value)} ${getValue(`turf.areaUnitsShort.${p.areaUnits}`)}`,
  [ValueType.LENGTH]: (value, p) => `${formatNumber(value)} ${getValue(`turf.unitsShort.${p.units}`)}`,
  [ValueType.BBOX]: formatBbox,
  [ValueType.BOOLEAN]: (value) => getValue(`turf.results.${value ? ResultKey.YES : ResultKey.NO}`),
});

/**
 * Texto de un resultado de tipo valor.
 *
 * @param {LayerOperation} op Operación (Output.VALUE).
 * @param {*} value Valor.
 * @param {Object} params Parámetros con que se ha calculado.
 * @returns {String} Texto.
 */
export const formatValue = (op, value, params) => FORMATS[op.valueType](value, params);

/**
 * Muestra un resultado de tipo valor en un toast o en un diálogo.
 *
 * @param {LayerOperation} op Operación (Output.VALUE).
 * @param {*} value Valor.
 * @param {Object} params Parámetros con que se ha calculado.
 * @param {String} [extra] Texto que se añade (p. ej. los elementos omitidos).
 */
export const showValue = (op, value, params, extra = '') => {
  const opName = getValue(`turf.ops.${op.id}.name`);
  const text = formatValue(op, value, params);
  if (op.display === Display.DIALOG) {
    IDEE.dialog.info(extra ? `${text}<p>${extra}</p>` : text, opName, undefined, { intelligence: false });
  } else {
    IDEE.toast.info(`${opName}: ${text} ${extra}`.trim(), null, 6000);
  }
};
