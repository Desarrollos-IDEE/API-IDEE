import template from '../../../../templates/turfhelp';
import { getValue } from '../../i18n/language';
import { CATEGORIES, OPERATIONS } from '../turfoperations';
import { InputScope, Output } from '../turftypes';
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
 * Muestra la ayuda general del panel Turf: las categorías de operaciones,
 * qué entidades se pueden usar en cada entrada y las selecciones guardadas.
 *
 * @param {Number} order Orden de tabulación.
 */
export const showCatalogHelp = (order) => showHelp(getValue('turf.title'), [
  {
    title: getValue('turf.help.opsTitle'),
    paragraphs: [{ text: getValue('turf.help.ops') }],
    items: CATEGORIES.filter((category) => OPERATIONS.some((op) => op.category === category))
      .map((category) => ({
        label: getValue(`turf.categories.${category}`),
        text: getValue(`turf.categoriesDesc.${category}`),
      })),
  },
  {
    title: getValue('turf.help.scopesTitle'),
    items: Object.values(InputScope).map((scope) => ({
      label: getValue(`turf.scopes.${scope}`),
      text: getValue(`turf.help.scopes.${scope}`),
    })),
  },
  {
    title: getValue('turf.help.selectionsTitle'),
    icon: 'vectorsmanagement-icon-seleccionar',
    paragraphs: [{ text: getValue('turf.help.selections') }],
  },
], order);

/**
 * Muestra la ayuda de una operación: qué hace, el papel de cada entrada,
 * sus parámetros y qué produce.
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
  const output = [getValue(op.output === Output.VALUE ? 'turf.help.valueOutput' : 'turf.help.layerOutput')];
  if (op.combines) output.push(getValue('turf.help.combinedOutput'));
  sections.push({
    title: getValue('turf.help.output'),
    paragraphs: output.map((text) => ({ text })),
  });
  showHelp(getValue(`turf.ops.${op.id}.name`), sections, order);
};
