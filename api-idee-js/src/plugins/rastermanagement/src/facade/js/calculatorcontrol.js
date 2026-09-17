import template from 'templates/calculator';
import { getValue } from './i18n/language';
import {
  PREDEFINED_OPERATIONS,
  createRasterCalculatorRequest,
  resolvePredefinedExpression,
} from './util/rastercalculatorservice';

/**
 * Control de calculadora ráster de la capa seleccionada.
 */
export default class CalculatorControl {
  /**
   * @param {IDEE.control.RasterManagementControl} parentControl Control principal.
   */
  constructor(parentControl) {
    /**
     * @private
     * @type {IDEE.control.RasterManagementControl}
     */
    this.parentControl_ = parentControl;

    /**
     * @private
     * @type {HTMLElement|null}
     */
    this.root_ = null;

    /**
     * Operación predefinida activa.
     * @private
     * @type {object|null}
     */
    this.activeOperation_ = null;

    /**
     * @private
     * @type {number}
     */
    this.requestId_ = 0;

    /**
     * Petición activa con método abort().
     * @private
     * @type {{ promise: Promise, abort: Function }|null}
     */
    this.activeRequest_ = null;

    /**
     * @private
     * @type {boolean}
     */
    this.isLoading_ = false;
  }

  /**
   * Inicializa la interfaz dentro del contenedor de la calculadora.
   *
   * @param {HTMLElement} html Plantilla principal del control.
   */
  init(html) {
    const container = html.querySelector('#m-rastermanagement-calculator-container');
    const predefinedOps = PREDEFINED_OPERATIONS.map((op) => {
      const label = getValue(op.labelKey);
      let tooltip = label;
      if (op.tooltipKey) {
        tooltip = getValue(op.tooltipKey);
      }
      return {
        id: op.id,
        label,
        tooltip,
      };
    });

    const content = IDEE.template.compileSync(template, {
      vars: {
        selectLayerHint: getValue('calculatorSelectLayer'),
        calculatorHint: getValue('calculatorHint'),
        predefinedOpsLabel: getValue('predefinedOps'),
        expression: getValue('expression'),
        expressionPlaceholder: getValue('expressionPlaceholder'),
        expressionSyntax: getValue('expressionSyntax'),
        outputName: getValue('outputName'),
        defaultOutputName: getValue('defaultOutputName'),
        calculate: getValue('calculate'),
        cancel: getValue('cancel'),
        loading: getValue('calculatorLoading'),
        predefinedOps,
      },
    });
    container.innerHTML = '';
    container.appendChild(content);
    this.root_ = content;
    this.addEvents_();
    this.loadIfVisible();
  }

  /**
   * Actualiza la vista de la calculadora si la pestaña está visible.
   */
  loadIfVisible() {
    if (!this.isActive_()) {
      return;
    }
    this.refreshView_();
  }

  /**
   * Registra los eventos de la calculadora.
   *
   * @private
   * @function
   */
  addEvents_() {
    const opsContainer = this.root_.querySelector('#m-rastermanagement-calculator-ops');
    opsContainer.addEventListener('click', (evt) => this.onPredefinedOpClick_(evt));

    const runBtn = this.root_.querySelector('#m-rastermanagement-calculator-run');
    runBtn.addEventListener('click', () => this.runCalculation_());

    const cancelBtn = this.root_.querySelector('#m-rastermanagement-calculator-cancel');
    cancelBtn.addEventListener('click', () => this.cancelCalculation_());
  }

  /**
   * Restablece la vista de la calculadora.
   *
   * @private
   * @function
   */
  refreshView_() {
    if (!this.root_) {
      return;
    }
    if (this.isLoading_) {
      return;
    }

    const layer = this.parentControl_.selectedLayer;
    if (!layer) {
      this.showState_('empty');
      return;
    }
    this.showState_('idle');
  }

  /**
   * Gestiona la selección de una operación predefinida.
   *
   * @private
   * @function
   * @param {Event} evt Evento de clic
   */
  onPredefinedOpClick_(evt) {
    const button = evt.target.closest('.m-rastermanagement-calculator-op');
    if (!button) {
      return;
    }

    const opId = button.dataset.opId;
    const operation = PREDEFINED_OPERATIONS.find((op) => op.id === opId);
    if (!operation) {
      return;
    }

    this.activeOperation_ = operation;
    this.renderOperationParams_(operation);
    this.setActiveOpButton_(button);

    const bandValues = this.getBandValuesFromForm_(operation);
    const expression = resolvePredefinedExpression(operation, bandValues);
    this.root_.querySelector('#m-rastermanagement-calculator-expression').value = expression;
  }

  /**
   * Marca el botón de operación predefinida activo.
   *
   * @private
   * @function
   * @param {HTMLElement} activeButton Botón activo
   */
  setActiveOpButton_(activeButton) {
    const buttons = this.root_.querySelectorAll('.m-rastermanagement-calculator-op');
    buttons.forEach((btn) => {
      btn.classList.remove('active');
      btn.setAttribute('aria-selected', 'false');
    });
    activeButton.classList.add('active');
    activeButton.setAttribute('aria-selected', 'true');
  }

  /**
   * Renderiza los parámetros de banda de una operación predefinida.
   *
   * @private
   * @function
   * @param {object} operation Operación predefinida
   */
  renderOperationParams_(operation) {
    const paramsContainer = this.root_.querySelector('#m-rastermanagement-calculator-params');
    const paramsGrid = this.root_.querySelector('#m-rastermanagement-calculator-params-grid');
    paramsGrid.innerHTML = '';

    operation.params.forEach((param) => {
      const control = document.createElement('div');
      control.className = 'm-rastermanagement-filter-control';

      const labelText = getValue(param.labelKey);
      let tooltip = labelText;
      if (param.tooltipKey) {
        tooltip = getValue(param.tooltipKey);
      }

      const label = document.createElement('label');
      label.setAttribute('for', `m-rastermanagement-calculator-param-${param.id}`);
      label.textContent = labelText;
      if (param.tooltipKey) {
        label.title = tooltip;
        label.setAttribute('aria-label', tooltip);
      }

      const input = document.createElement('input');
      input.type = 'number';
      input.min = '1';
      input.step = '1';
      input.id = `m-rastermanagement-calculator-param-${param.id}`;
      input.className = 'm-rastermanagement-calculator-param';
      input.dataset.paramId = param.id;
      input.value = param.defaultBand;
      input.setAttribute('tabindex', '0');
      input.setAttribute('aria-label', labelText);
      input.addEventListener('change', () => this.onParamChange_());

      control.appendChild(label);
      control.appendChild(input);
      paramsGrid.appendChild(control);
    });

    paramsContainer.classList.remove('hidden');
  }

  /**
   * Actualiza la expresión al cambiar parámetros de banda.
   *
   * @private
   * @function
   */
  onParamChange_() {
    if (!this.activeOperation_) {
      return;
    }
    const bandValues = this.getBandValuesFromForm_(this.activeOperation_);
    const expression = resolvePredefinedExpression(this.activeOperation_, bandValues);
    this.root_.querySelector('#m-rastermanagement-calculator-expression').value = expression;
  }

  /**
   * Lee los valores de banda del formulario de parámetros.
   *
   * @private
   * @function
   * @param {object} operation Operación predefinida
   * @returns {Object<string, number>}
   */
  getBandValuesFromForm_(operation) {
    const bandValues = {};
    operation.params.forEach((param) => {
      const input = this.root_.querySelector(`#m-rastermanagement-calculator-param-${param.id}`);
      if (input) {
        bandValues[param.id] = parseInt(input.value, 10);
      }
    });
    return bandValues;
  }

  /**
   * Ejecuta el cálculo ráster y añade el resultado al mapa.
   *
   * @private
   * @function
   */
  runCalculation_() {
    if (!this.root_ || this.isLoading_) {
      return;
    }

    const layer = this.parentControl_.selectedLayer;
    if (!layer) {
      this.showState_('empty');
      IDEE.toast.warning(getValue('exception.selectLayer'), null, 6000);
      return;
    }

    const urlRaster = layer.url;
    if (IDEE.utils.isNullOrEmpty(urlRaster)) {
      this.showError_(getValue('layerNoUrl'));
      return;
    }

    const expressionInput = this.root_.querySelector('#m-rastermanagement-calculator-expression');
    const outputInput = this.root_.querySelector('#m-rastermanagement-calculator-output');
    const expression = expressionInput.value.trim();
    let outputName = outputInput.value.trim();

    if (!expression) {
      IDEE.toast.warning(getValue('exception.emptyExpression'), null, 6000);
      return;
    }

    if (!outputName) {
      outputName = getValue('defaultOutputName');
    }

    this.cancelPendingRequest_();
    const requestId = this.requestId_ + 1;
    this.requestId_ = requestId;
    this.isLoading_ = true;
    this.showState_('loading');

    const request = createRasterCalculatorRequest(
      urlRaster,
      expression,
      this.parentControl_.rasterCalculatorUrl,
    );
    this.activeRequest_ = request;

    request.promise
      .then((result) => {
        if (requestId !== this.requestId_) {
          return;
        }
        this.isLoading_ = false;
        this.activeRequest_ = null;
        this.addResultLayer_(result.resultsUrl, outputName);
        this.showState_('idle');
        IDEE.toast.success(getValue('calculatorSuccess'), null, 6000);
      })
      .catch((err) => {
        if (requestId !== this.requestId_) {
          return;
        }
        this.isLoading_ = false;
        this.activeRequest_ = null;
        if (err && err.message === 'CANCELLED') {
          this.showState_('idle');
          return;
        }
        // eslint-disable-next-line no-console
        console.error(err);
        let message = getValue('exception.calculatorFailed');
        if (err && err.message === 'JOB_TIMEOUT') {
          message = getValue('exception.calculatorTimeout');
        } else if (err && !IDEE.utils.isNullOrEmpty(err.message)
          && err.message !== 'JOB_FAILED'
          && err.message.indexOf('HTTP ') !== 0) {
          message = `${message}: ${err.message}`;
        }
        this.showError_(message);
      });
  }

  /**
   * Añade al mapa la capa GeoTIFF resultante.
   *
   * @private
   * @function
   * @param {string} resultsUrl URL del GeoTIFF de resultado.
   * @param {string} outputName Nombre de la capa.
   */
  addResultLayer_(resultsUrl, outputName) {
    const safeName = outputName.replace(/[^a-zA-Z0-9_-]/g, '_');
    const newLayer = new IDEE.layer.GeoTIFF({
      url: resultsUrl,
      name: safeName,
      legend: outputName,
    }, {
      normalize: true,
    });
    this.parentControl_.map.addLayers(newLayer);
    this.parentControl_.refreshLayers();
  }

  /**
   * Cancela el cálculo en curso.
   *
   * @private
   * @function
   */
  cancelCalculation_() {
    if (!this.isLoading_) {
      return;
    }
    this.cancelPendingRequest_();
    this.isLoading_ = false;
    this.refreshView_();
  }

  /**
   * Cancela la petición pendiente.
   *
   * @private
   * @function
   */
  cancelPendingRequest_() {
    this.requestId_ += 1;
    if (this.activeRequest_) {
      this.activeRequest_.abort();
      this.activeRequest_ = null;
    }
  }

  /**
   * Muestra u oculta los bloques de la vista según el estado.
   *
   * @private
   * @function
   * @param {string} state empty | idle | loading | error
   */
  showState_(state) {
    const emptyEl = this.root_.querySelector('#m-rastermanagement-calculator-empty');
    const formEl = this.root_.querySelector('#m-rastermanagement-calculator-form');
    const loadingRow = this.root_.querySelector('#m-rastermanagement-calculator-loading-row');
    const errorEl = this.root_.querySelector('#m-rastermanagement-calculator-error');

    emptyEl.classList.add('hidden');
    formEl.classList.add('hidden');
    loadingRow.classList.add('hidden');
    errorEl.classList.add('hidden');
    errorEl.innerText = '';

    if (state === 'empty') {
      emptyEl.classList.remove('hidden');
      return;
    }
    if (state === 'loading') {
      loadingRow.classList.remove('hidden');
      return;
    }
    if (state === 'error') {
      formEl.classList.remove('hidden');
      errorEl.classList.remove('hidden');
      return;
    }
    formEl.classList.remove('hidden');
  }

  /**
   * Muestra un mensaje de error.
   *
   * @private
   * @function
   * @param {string} message Texto del error.
   */
  showError_(message) {
    this.showState_('error');
    const errorEl = this.root_.querySelector('#m-rastermanagement-calculator-error');
    errorEl.innerText = message;
  }

  /**
   * @private
   * @function
   * @returns {boolean}
   */
  isActive_() {
    const html = this.parentControl_.html;
    if (!html) {
      return false;
    }

    const geoprocessSection = html.querySelector('#m-rastermanagement-geoprocess-section');
    if (geoprocessSection.classList.contains('hidden')) {
      return false;
    }

    const calculatorTab = html.querySelector('#m-rastermanagement-calculator-tab');
    return calculatorTab.classList.contains('active');
  }
}
