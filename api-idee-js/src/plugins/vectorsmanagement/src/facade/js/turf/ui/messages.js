import { getValue } from '../../i18n/language';
import { OperationError } from '../turftypes';

/**
 * Reemplaza las variables {nombre} de un texto por sus valores.
 *
 * @param {String} text Texto con variables.
 * @param {Object} vars Valores de las variables.
 * @returns {String} Texto con las variables reemplazadas.
 */
export const fill = (text, vars = {}) => Object.keys(vars)
  .reduce((acc, key) => acc.split(`{${key}}`).join(vars[key]), text);

/**
 * Traduce un texto y reemplaza sus variables.
 *
 * @param {String} path Ruta de la traducción.
 * @param {Object} [vars] Valores de las variables.
 * @returns {String} Texto.
 */
export const translate = (path, vars) => fill(getValue(path), vars);

/**
 * Nombre de un papel de entrada en una operación.
 *
 * @param {LayerOperation} op Operación.
 * @param {InputRole} role Papel.
 * @returns {String} Nombre.
 */
export const roleLabel = (op, role) => getValue(`turf.ops.${op.id}.roles.${role}.label`);

/**
 * Motivo por el que una capa no se puede usar en una entrada.
 *
 * @param {LayerIssue} issue Motivo.
 * @param {Array<GeometryType>} [types] Tipos de geometría de la capa.
 * @returns {String} Texto.
 */
export const layerIssueText = (issue, types = []) => translate(`turf.layerIssues.${issue}`, {
  types: types.join(', '),
});

/**
 * Mensaje de un error de una operación de capas.
 *
 * @param {LayerOperation} op Operación.
 * @param {Error} error Error.
 * @returns {String} Mensaje.
 */
export const errorMessage = (op, error) => {
  if (!(error instanceof OperationError)) {
    return translate('turf.exception.error', { msg: error.message });
  }
  const vars = { ...error.vars };
  if (vars.role) vars.role = roleLabel(op, vars.role);
  if (vars.reason) vars.reason = layerIssueText(vars.reason, vars.types);
  if (vars.param) vars.param = getValue(`turf.params.${vars.param}`);
  return translate(`turf.exception.${error.key}`, vars);
};

/**
 * Texto con los elementos de entrada que no han generado resultado.
 *
 * @param {Array<{reason: SkipReason, count: Number, layer: String}>} skipped Omitidos.
 * @returns {String} Texto (vacío si no hay omitidos).
 */
export const skippedMessage = (skipped) => skipped
  .map(({ reason, count, layer }) => translate(`turf.skipReasons.${reason}`, { n: count, layer: layer || '' }))
  .join(' ');
