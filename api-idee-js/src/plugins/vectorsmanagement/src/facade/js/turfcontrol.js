/**
 * @module IDEE/control/TurfControl
 */
import TurfImplControl from 'impl/turfcontrol';
import template from '../../templates/turf';
import { getValue } from './i18n/language';
import { CATEGORIES, OPERATIONS, getOperation } from './turf/turfoperations';
import LayerOperationRunner from './turf/layeroperationrunner';
import InputResolver from './turf/layers/inputresolver';
import LayerCatalog from './turf/layers/layercatalog';
import ResultLayerWriter from './turf/layers/resultlayers';
import SelectionRegistry from './turf/layers/selectionregistry';
import { isTurfAvailable } from './turf/operations/common';
import { Output, ResultKey } from './turf/turftypes';
import { showCatalogHelp } from './turf/ui/helpdialog';
import OperationForm from './turf/ui/operationform';
import SelectionSummary from './turf/ui/selectionsummary';
import { errorMessage, skippedMessage, translate } from './turf/ui/messages';
import { showValue } from './turf/ui/valueview';

export default class TurfControl extends IDEE.Control {
  /**
  * @classdesc
  * Allows to execute operations of Turf.js on vector layers.
  *
  * @constructor
  * @extends {IDEE.Control}
  * @api stable
  */
  constructor(map, managementControl) {
    if (IDEE.utils.isUndefined(TurfImplControl) || (IDEE.utils.isObject(TurfImplControl)
      && IDEE.utils.isNullOrEmpty(Object.keys(TurfImplControl)))) {
      IDEE.exception(getValue('exception.impl_turfcontrol'));
    }

    const impl = new TurfImplControl(map);
    super('Turf', impl);

    impl.facadeControl = this;

    this.map_ = map;
    this.managementControl_ = managementControl;
    this.template = null;
    this.selections_ = new SelectionRegistry();
    this.catalog_ = new LayerCatalog(() => managementControl.getAllLayers());
    this.runner_ = new LayerOperationRunner({
      map,
      catalog: this.catalog_,
      selections: this.selections_,
      resolver: new InputResolver(this.catalog_, this.selections_, impl),
      writer: new ResultLayerWriter(map, impl),
      isAvailable: isTurfAvailable,
    });
    this.form_ = new OperationForm({
      runner: this.runner_,
      catalog: this.catalog_,
      selections: this.selections_,
      order: managementControl.order,
      getActiveLayer: () => managementControl.selectedLayer || null,
      isSelecting: () => managementControl.getSelection() === 'feature',
      onRun: (op, config) => this.runLayerOperation(op.id, config),
      onClose: () => this.showCatalog_(),
    });
    this.summary_ = new SelectionSummary({
      selections: this.selections_,
      isVisible: (snapshot) => managementControl.selectedLayer === snapshot.layer
        && managementControl.getSelection() === 'feature',
      order: managementControl.order,
    });
    this.refreshView_ = () => this.refreshView();
    this.unsubscribeSelections_ = this.selections_.onChange(this.refreshView_);
  }

  /**
   * This functions active control
   *
   * @public
   * @function
   * @param {Node} html
   * @api
   */
  active(html) {
    this.template = IDEE.template.compileSync(template, {
      vars: {
        categories: CATEGORIES.map((category) => ({
          name: getValue(`turf.categories.${category}`),
          desc: getValue(`turf.categoriesDesc.${category}`),
          ops: OPERATIONS.filter((op) => op.category === category).map((op) => ({
            id: op.id,
            name: getValue(`turf.ops.${op.id}.name`),
            title: getValue(`turf.ops.${op.id}.desc`),
          })),
        })).filter((category) => category.ops.length > 0),
        translations: {
          title: getValue('turf.title'),
          help: getValue('turf.help.button'),
          selections: getValue('turf.selections.title'),
        },
      },
    });

    html.querySelector('#m-vectorsmanagement-controls').appendChild(this.template);
    this.template.querySelectorAll('button[data-op]').forEach((button) => {
      button.addEventListener('click', () => this.runOperation(button.dataset.op));
    });
    this.template.querySelector('button[data-action="turf-help"]')
      .addEventListener('click', () => showCatalogHelp(this.managementControl_.order));
    this.managementControl_.accessibilityTab(this.template);
    this.map_.on(IDEE.evt.ADDED_LAYER, this.refreshView_);
    this.map_.on(IDEE.evt.REMOVED_LAYER, this.refreshView_);
    this.refreshView();

    if (!isTurfAvailable()) {
      IDEE.toast.error(getValue('turf.exception.notLoaded'), null, 6000);
    }
  }

  /**
   * Opens the form of an operation in the panel.
   *
   * @public
   * @function
   * @param {String} id operation id.
   * @api
   */
  runOperation(id) {
    const op = getOperation(id);
    if (!op || !this.template) return;
    const container = this.template.querySelector('.m-vectorsmanagement-turf-opform-container');
    this.template.querySelector('.m-vectorsmanagement-turf-catalog').hidden = true;
    container.hidden = false;
    this.form_.open(op, container);
  }

  /**
   * Executes an operation and shows its result: the new layer or the
   * calculated value. It doesn't need the panel to be open.
   *
   * @public
   * @function
   * @param {String} id operation id.
   * @param {Object} config inputs (layer and scope by role), params,
   * attributes and output name. See LayerOperationConfig.
   * @returns {Object} { layer, count, skipped } (operations that create a
   * layer), { value, skipped } (operations that calculate a value) or
   * { error } if it fails.
   * @api
   */
  runLayerOperation(id, config) {
    const op = getOperation(id);
    if (!op) {
      throw new Error(`VectorsManagement Turf: ${id} is not an operation`);
    }
    const opName = getValue(`turf.ops.${op.id}.name`);
    this.selections_.prune(this.catalog_.getLayers());
    let result;
    try {
      result = this.runner_.run(op, config);
    } catch (error) {
      IDEE.dialog.error(errorMessage(op, error), opName);
      return { error };
    }
    const skipped = skippedMessage(result.skipped);
    if (op.output === Output.VALUE) {
      showValue(op, result.value, result.params, skipped);
    } else if (result.layer === null) {
      IDEE.toast.warning(`${getValue(`turf.results.${ResultKey.EMPTY_RESULT}`)} ${skipped}`.trim(), null, 6000);
    } else {
      const created = translate(`turf.results.${ResultKey.FEATURES_CREATED}`, {
        layer: result.layer.legend, n: result.count,
      });
      IDEE.toast.success(`${created} ${skipped}`.trim(), null, 6000);
    }
    return result;
  }

  /**
   * Saves the features selected in the active layer of the plugin as that
   * layer's selection for Turf. It ignores changes outside the selection
   * tool (e.g. features added by the creation tool).
   *
   * @public
   * @function
   * @api
   */
  onSelectionChange() {
    try {
      const layer = this.managementControl_.selectedLayer;
      if (layer && this.managementControl_.getSelection() === 'feature') {
        this.selections_.capture(layer, [...this.managementControl_.getSelectedFeatures()]);
      }
    } catch (e) {
      // La selección de Turf nunca debe interrumpir la del plugin.
      // eslint-disable-next-line no-console
      console.warn('VectorsManagement Turf:', e);
    }
  }

  /**
   * Refreshes the selections summary and the open form.
   *
   * @public
   * @function
   * @api
   */
  refreshView() {
    if (!this.template) return;
    this.selections_.prune(this.catalog_.getLayers());
    this.summary_.render(this.template.querySelector('.m-vectorsmanagement-turf-selections'));
    this.form_.render();
  }

  /**
   * This function the layer selected in the layer selector.
   * @public
   * @function
   * @param {IDEE.layer.Vector} layer
   * @api
   */
  // eslint-disable-next-line no-unused-vars
  setLayer(layer) {
    // Las operaciones eligen sus capas en el formulario; la capa activa solo
    // cambia sus valores por defecto y el resumen de selecciones.
    this.refreshView();
  }

  /**
   * Returns the selections saved for Turf.
   *
   * @public
   * @function
   * @returns {Array<Object>} Saved selections ({ layer, entries, capturedAt }).
   * @api
   */
  getSavedSelections() {
    return this.selections_.list();
  }

  /**
   * This function destroys template
   *
   * @public
   * @function
   * @api
   */
  deactivate() {
    this.map_.un(IDEE.evt.ADDED_LAYER, this.refreshView_);
    this.map_.un(IDEE.evt.REMOVED_LAYER, this.refreshView_);
    this.form_.close();
    if (this.template) {
      this.template.remove();
      this.template = null;
    }
  }

  /**
   * This function destroys the control and its saved selections.
   *
   * @public
   * @function
   * @api
   */
  destroy() {
    this.deactivate();
    this.unsubscribeSelections_();
    this.selections_.clear();
  }

  /**
   * Closes the form and shows the operations catalog.
   *
   * @private
   */
  showCatalog_() {
    this.form_.close();
    if (!this.template) return;
    this.template.querySelector('.m-vectorsmanagement-turf-opform-container').hidden = true;
    const catalog = this.template.querySelector('.m-vectorsmanagement-turf-catalog');
    catalog.hidden = false;
    const first = catalog.querySelector('summary');
    if (first) first.focus();
  }

  /**
   * This function compares controls
   *
   * @public
   * @function
   * @param {IDEE.Control} control to compare
   * @api
   */
  equals(control) {
    return control instanceof TurfControl;
  }
}
