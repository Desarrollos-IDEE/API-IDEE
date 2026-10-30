import {
  Category,
  GeometryGroup,
  InputRole,
  InputScope,
  NoticeKey,
  OperationId,
  Output,
} from '../turftypes';
import { ALL_SCOPES, inputRole, mixesDimensions } from './common';
import { sourceLayerParam } from './params';

/**
 * Copia de un elemento, con su geometría original y sus campos.
 *
 * @param {InputFeature} feature Elemento de entrada.
 * @returns {ProvenanceRecord} Resultado.
 */
const copyOf = (feature) => ({
  keepGeometryOf: InputRole.INPUT, sources: { [InputRole.INPUT]: [feature] },
});

/**
 * Aviso si la capa resultante mezclará puntos, líneas y polígonos.
 *
 * @param {Object<InputRole, RoleMeta>} meta Resumen de las entradas.
 * @returns {Array<NoticeKey>} Avisos.
 */
const mixedNotice = (meta) => (mixesDimensions(meta[InputRole.INPUT].types)
  ? [NoticeKey.MIXED_DIMENSIONS] : []);

/**
 * Reunir o extraer entidades: copia en una capa nueva, sin modificar sus
 * geometrías, las entidades elegidas de una o varias capas (todas, solo las
 * seleccionadas, una de ellas o un resultado anterior).
 * @const
 * @type {LayerOperation}
 */
export const mergeFeatures = Object.freeze({
  id: OperationId.MERGE_FEATURES,
  category: Category.EXTRACTION,
  output: Output.GEOMETRY,
  inputs: [inputRole(GeometryGroup.ANY)],
  params: [sourceLayerParam(true)],
  attributeRoles: () => [InputRole.INPUT],
  notices: mixedNotice,
  execute: ({ inputs }) => ({ records: inputs[InputRole.INPUT].map(copyOf) }),
});

/**
 * Excluir entidades: copia las entidades de entrada salvo las que también
 * están en la entrada de exclusión. Compara la identidad de las entidades
 * (capa y posición), no su geometría.
 * @const
 * @type {LayerOperation}
 */
export const excludeFeatures = Object.freeze({
  id: OperationId.EXCLUDE_FEATURES,
  category: Category.EXTRACTION,
  output: Output.GEOMETRY,
  inputs: [
    inputRole(GeometryGroup.ANY, { defaultScope: InputScope.ALL }),
    {
      role: InputRole.EXCLUDE,
      types: GeometryGroup.ANY,
      scopes: ALL_SCOPES,
      defaultScope: InputScope.SELECTION,
    },
  ],
  params: [sourceLayerParam()],
  attributeRoles: () => [InputRole.INPUT],
  notices: mixedNotice,
  execute: ({ inputs }) => {
    const excluded = new Set(inputs[InputRole.EXCLUDE].map((feature) => feature.uid));
    return {
      records: inputs[InputRole.INPUT].filter((feature) => !excluded.has(feature.uid)).map(copyOf),
    };
  },
});
