/**
 * @module IDEE/control/TurfControl
 */
import TurfImplControl from 'impl/turfcontrol';
import template from '../../templates/turf';
import { getValue } from './i18n/language';
import { CATEGORIES, OPERATIONS, getOperation } from './turf/turfoperations';
import TurfManager from './turf/turfmanager';
import TurfParamsDialog from './turf/turfparamsdialog';

export default class TurfControl extends IDEE.Control {
  /**
  * @classdesc
  * Allows to execute operations of Turf.js on a vector layer.
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
    this.manager_ = new TurfManager(map, managementControl, impl);
    this.paramsDialog_ = new TurfParamsDialog(managementControl.order);
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
          ops: OPERATIONS.filter((op) => op.category === category).map((op) => ({
            id: op.id,
            name: getValue(`turf.ops.${op.id}.name`),
            title: op.params.length > 0
              ? `${getValue(`turf.ops.${op.id}.desc`)} ${getValue('turf.paramsTitle')}`
              : getValue(`turf.ops.${op.id}.desc`),
            hasParams: op.params.length > 0,
          })),
        })),
        translations: {
          hint: getValue('turf.hint'),
          hintParams: getValue('turf.hintParams'),
        },
      },
    });

    html.querySelector('#m-vectorsmanagement-controls').appendChild(this.template);
    this.template.querySelectorAll('button[data-op]').forEach((button) => {
      button.addEventListener('click', () => this.runOperation(button.dataset.op));
    });
    this.managementControl_.accessibilityTab(this.template);

    if (!TurfManager.isAvailable()) {
      IDEE.toast.error(getValue('turf.exception.notLoaded'), null, 6000);
    }
  }

  /**
   * Request operation params and executes it.
   *
   * @public
   * @function
   * @param {String} id operation id.
   * @api
   */
  runOperation(id) {
    const op = getOperation(id);
    if (op.params.length !== 0) {
      this.paramsDialog_.open(op).then((values) => {
        if (values !== null) {
          this.manager_.execute(op, values);
        }
      });
    } else {
      this.manager_.execute(op);
    }
  }

  /**
   * This function the layer selected in the layer selector.
   * @public
   * @function
   * @param {IDEE.layer.Vector} layer
   * @api
   */
  setLayer(layer) {
    this.manager_.setLayer(layer);
  }

  /**
   * This function destroys template
   *
   * @public
   * @function
   * @api
   */
  deactivate() {
    if (this.template) {
      this.template.remove();
      this.template = null;
    }
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
