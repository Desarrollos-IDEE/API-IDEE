/**
 * @module IDEE/control/SnapOptions
 */
import template from '../../templates/snapoptions';
import { getValue } from './i18n/language';

/**
 * Default snap options
 * @const
 * @type {Object}
 */
export const DEFAULT_SNAP_OPTIONS = {
  active: true,
  vertex: true,
  edge: true,
  intersection: false,
  pixelTolerance: 10,
  allLayers: false,
  guides: false,
};

/**
 * Tools whose interaction supports snap guides
 * @const
 * @type {Array<String>}
 */
const GUIDES_TOOLS = ['LineString', 'Polygon', 'Hole'];

/**
 * Parses snapping plugin parameter.
 * @function
 * @param {Boolean|Object|String} snapping snapping parameter
 * @return {Boolean|Object} false (disabled), true (default options) or snapping object
 * @api
 */
export const parseSnapping = (snapping) => {
  let value = snapping;
  if (typeof value === 'string') {
    const text = value.trim();
    if (text === '' || text === 'true' || text === 'false') {
      value = text !== 'false';
    } else {
      try {
        value = JSON.parse(text);
      } catch (e) {
        try {
          value = IDEE.utils.decodeBase64(text);
        } catch (err) {
          IDEE.dialog.error(getValue('exception.snapping'), 'VectorsManagement.snapping');
          value = true;
        }
      }
    }
  }
  return typeof value === 'boolean' || value instanceof Object ? value : true;
};

/**
 * Returns snap options from the parsed snapping parameter.
 * @function
 * @param {Boolean|Object} snapping snapping parameter
 * @return {Object} snap options
 * @api
 */
export const getSnapOptions = (snapping) => {
  if (snapping === false) {
    return { ...DEFAULT_SNAP_OPTIONS, active: false };
  }
  return { ...DEFAULT_SNAP_OPTIONS, ...(snapping instanceof Object ? snapping : {}), active: true };
};

/**
 * Returns the snap options that apply to the given tool
 * @function
 * @param {String} tool tool
 * @param {Object} snapOptions shared snap options object
 * @return {Object} snap options for the tool
 * @api
 */
export const getToolSnapOptions = (tool, snapOptions) => {
  return { ...snapOptions, guides: snapOptions.guides && GUIDES_TOOLS.includes(tool) };
};

/**
 * Renders snap options panel into container for the given tool.
 * @function
 * @param {HTMLElement} container panel container
 * @param {String} prefix ids prefix
 * @param {String} tool active tool
 * @param {Object} snapOptions shared snap options object
 * @param {Function} onChange callback executed on change
 * @api
 */
export const renderSnapOptions = (container, prefix, tool, snapOptions, onChange) => {
  const panel = IDEE.template.compileSync(template, {
    vars: {
      prefix,
      options: snapOptions,
      guidesAvailable: GUIDES_TOOLS.includes(tool),
      defaultPixelTolerance: DEFAULT_SNAP_OPTIONS.pixelTolerance,
      translations: {
        snapTitle: getValue('snapTitle'),
        snapActive: getValue('snapActive'),
        snapHelp: getValue('snapHelp'),
        snapTargetsTitle: getValue('snapTargetsTitle'),
        snapVertex: getValue('snapVertex'),
        snapVertexDesc: getValue('snapVertexDesc'),
        snapEdge: getValue('snapEdge'),
        snapEdgeDesc: getValue('snapEdgeDesc'),
        snapIntersection: getValue('snapIntersection'),
        snapIntersectionDesc: getValue('snapIntersectionDesc'),
        snapOptionsTitle: getValue('snapOptionsTitle'),
        snapAllLayers: getValue('snapAllLayers'),
        snapAllLayersDesc: getValue('snapAllLayersDesc'),
        snapGuides: getValue('snapGuides'),
        snapGuidesDesc: getValue('snapGuidesDesc'),
        snapGuidesUnavailable: getValue('snapGuidesUnavailable'),
        snapTolerance: getValue('snapTolerance'),
        snapToleranceDesc: getValue('snapToleranceDesc'),
      },
    },
  });

  panel.addEventListener('change', ({ target }) => {
    const option = target.dataset.snapOption;
    if (target.type === 'checkbox') {
      // eslint-disable-next-line no-param-reassign
      snapOptions[option] = target.checked;
    } else {
      const value = parseInt(target.value, 10);
      // eslint-disable-next-line no-param-reassign
      snapOptions[option] = value > 0 ? value : DEFAULT_SNAP_OPTIONS[option];
    }
    renderSnapOptions(container, prefix, tool, snapOptions, onChange);
    container.querySelector(`#${target.id}`).focus();
    onChange(getToolSnapOptions(tool, snapOptions));
  });

  container.replaceChildren(panel);
};
