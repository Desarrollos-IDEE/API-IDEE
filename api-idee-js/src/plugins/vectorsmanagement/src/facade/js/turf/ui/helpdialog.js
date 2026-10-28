import template from '../../../../templates/turfhelp';
import { getValue } from '../../i18n/language';
import { CATEGORIES, OPERATIONS } from '../turfoperations';
import { OperationKind } from '../turftypes';
import { roleLabel } from './messages';

/**
 * Sección del modal de ayuda.
 * @typedef {Object} HelpSection
 * @property {String} title Título.
 * @property {String} [icon] Clase del icono del título.
 * @property {Array<{text: String, icon: (String|undefined)}>} [paragraphs] Párrafos.
 * @property {Array<{label: String, text: String}>} [items] Lista de términos.
 */

/**
 * Muestra un modal de ayuda con el mismo formato que la ayuda del plugin.
 *
 * @param {String} title Título del modal.
 * @param {Array<HelpSection>} sections Secciones.
 * @param {Number} order Orden de tabulación.
 */
const showHelp = (title, sections, order) => {
  const message = IDEE.template.compileSync(template, {
    parseToHtml: false,
    vars: { sections: sections.map((section) => ({ paragraphs: [], items: [], ...section })) },
  });
  IDEE.dialog.info(message, title, order, { intelligence: false });
};

/**
 * Categorías del panel que contienen operaciones del tipo indicado, con su
 * descripción.
 *
 * @param {OperationKind} kind Tipo de operación.
 * @returns {Array<{label: String, text: String}>} Categorías.
 */
const categoriesOf = (kind) => CATEGORIES
  .filter((category) => OPERATIONS.some((op) => op.category === category && op.kind === kind))
  .map((category) => ({
    label: getValue(`turf.categories.${category}`),
    text: getValue(`turf.categoriesDesc.${category}`),
  }));

/**
 * Muestra la ayuda general del panel Turf: tipos de operaciones, sus
 * categorías y las selecciones guardadas.
 *
 * @param {Number} order Orden de tabulación.
 */
export const showCatalogHelp = (order) => showHelp(getValue('turf.title'), [
  {
    title: getValue('turf.help.layerOpsTitle'),
    paragraphs: [{ text: getValue('turf.help.layerOps') }],
    items: categoriesOf(OperationKind.LAYERS),
  },
  {
    title: getValue('turf.help.collectionOpsTitle'),
    paragraphs: [
      { text: getValue('turf.help.collectionOps') },
      { text: getValue('turf.hintParams'), icon: 'vectorsmanagement-icon-libro' },
    ],
    items: categoriesOf(OperationKind.COLLECTION),
  },
  {
    title: getValue('turf.help.selectionsTitle'),
    icon: 'vectorsmanagement-icon-seleccionar',
    paragraphs: [{ text: getValue('turf.help.selections') }],
  },
], order);

/**
 * Muestra la ayuda de una operación de capas: qué hace, el papel de cada
 * entrada, sus parámetros y, si tiene columnas agregadas, la capa resultante.
 *
 * @param {LayerOperation} op Operación.
 * @param {Number} order Orden de tabulación.
 */
export const showOperationHelp = (op, order) => {
  const params = op.params.filter((param) => param.help).map((param) => ({
    label: getValue(`turf.params.${param.name}`),
    text: getValue(`turf.paramsHelp.${param.help}`),
  }));
  const sections = [
    { title: getValue('turf.help.what'), paragraphs: [{ text: getValue(`turf.ops.${op.id}.desc`) }] },
    {
      title: getValue('turf.help.inputs'),
      items: op.inputs.map(({ role }) => ({
        label: roleLabel(op, role),
        text: getValue(`turf.ops.${op.id}.roles.${role}.help`),
      })),
    },
  ];
  if (params.length > 0) sections.push({ title: getValue('turf.help.params'), items: params });
  if (op.aggregates) {
    sections.push({
      title: getValue('turf.help.output'),
      paragraphs: [{ text: getValue(`turf.ops.${op.id}.aggregatesNote`) }],
    });
  }
  showHelp(getValue(`turf.ops.${op.id}.name`), sections, order);
};
