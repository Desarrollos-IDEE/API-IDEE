import {
  AreaUnit,
  FieldPolicy,
  HelpKey,
  LengthUnit,
  LinearUnit,
  OptionsKey,
  ParamName,
  ParamType,
} from '../turftypes';

/**
 * Parámetro de unidades de longitud.
 *
 * @param {Object} [options] Opciones.
 * @param {Boolean} [options.linear=false] true para excluir las unidades
 * angulares (grados y radianes).
 * @returns {TurfParam} Parámetro de tipo select.
 */
export const unitsParam = ({ linear = false } = {}) => Object.freeze({
  name: ParamName.UNITS,
  type: ParamType.SELECT,
  options: Object.values(linear ? LinearUnit : LengthUnit),
  optionsKey: OptionsKey.UNITS,
  default: LengthUnit.METERS,
});

/**
 * Parámetro de unidades de área.
 * @const
 * @type {TurfParam}
 */
export const AREA_UNITS_PARAM = Object.freeze({
  name: ParamName.AREA_UNITS,
  type: ParamType.SELECT,
  options: Object.values(AreaUnit),
  optionsKey: OptionsKey.AREA_UNITS,
  default: AreaUnit.METERS,
});

/**
 * Parámetro que añade a la salida la capa de origen de cada resultado
 * (columna capa_origen, una por papel que aporta campos).
 *
 * @param {Boolean} [defaultValue=false] Valor por defecto.
 * @returns {TurfParam} Parámetro de tipo checkbox.
 */
export const sourceLayerParam = (defaultValue = false) => Object.freeze({
  name: ParamName.SOURCE_LAYER,
  type: ParamType.CHECKBOX,
  default: defaultValue,
  help: HelpKey.SOURCE_LAYER,
});

/**
 * Parámetro con la forma de combinar los campos cuando varios elementos
 * forman un único resultado.
 *
 * @param {function(Object): Boolean} [when] Indica cuándo se combinan
 * elementos; por defecto, siempre.
 * @returns {TurfParam} Parámetro de tipo select.
 */
export const fieldPolicyParam = (when = undefined) => Object.freeze({
  name: ParamName.FIELD_POLICY,
  type: ParamType.SELECT,
  options: Object.values(FieldPolicy),
  optionsKey: OptionsKey.FIELD_POLICIES,
  default: FieldPolicy.DISTINCT,
  help: HelpKey.FIELD_POLICY,
  when,
});
