/**
 * @module IDEE/control/StylesControl
 */

import StylesControlImpl from 'impl/stylescontrol';
import template from '../../templates/styles';
import { getValue } from './i18n/language';

const FILTER_DEFAULTS = {
  saturation: 0,
  gamma: 1,
  brightness: 0,
  contrast: 0,
  exposure: 0,
};

/**
 * Identificadores de índices espectrales
 * @constant
 * @type {Array<string>}
 */
const SPECTRAL_INDICES = ['ndvi', 'ndwi', 'nbr'];

/**
 * Modos de rampa de color
 * @constant
 * @type {Array<string>}
 */
const COLOR_RAMP_MODES = ['monoband', 'mean'];

/**
 * Bandas por defecto para el modo media
 * @constant
 * @type {Array<number>}
 */
const MEAN_DEFAULT_BANDS = [1, 2, 3];

/**
 * Identificadores de bandas por índice
 * @constant
 * @type {object}
 */
const INDEX_BAND_IDS = {
  ndvi: ['nir', 'red'],
  ndwi: ['green', 'nir'],
  nbr: ['nir', 'swir'],
};

/**
 * Valores por defecto de combinaciones RGB
 * @constant
 * @type {object}
 */
const RGB_DEFAULTS = {
  bands: [1, 2, 3],
  nodata: 0,
};

export default class StylesControl extends IDEE.Control {
  /**
   * @param {IDEE.control.RasterManagementControl} parentControl Control padre.
   * @param {IDEE.Map} map Mapa asociado.
   */
  constructor(parentControl, map) {
    if (IDEE.utils.isUndefined(StylesControlImpl)
      || (IDEE.utils.isObject(StylesControlImpl)
      && IDEE.utils.isNullOrEmpty(Object.keys(StylesControlImpl)))) {
      IDEE.exception(getValue('exception.impl'));
    }
    const impl = new StylesControlImpl(map);
    super(impl, StylesControl.NAME);
    this.parentControl_ = parentControl;
    this.map_ = map;
    this.template_ = null;
    this.activated_ = false;
    this.bandRolesRequestId_ = 0;
    this.updatingRampStops_ = false;
  }

  get html() {
    return this.parentControl_.html;
  }

  get map() {
    return this.parentControl_.map;
  }

  get selectedLayer() {
    return this.parentControl_.selectedLayer;
  }

  /**
   * Compila variables de plantilla para la sección Estilos.
   * @returns {object}
   */
  getTemplateVars() {
    const ndviDefaults = IDEE.style.Raster.DEFAULT_NDVI;
    const ndwiDefaults = IDEE.style.Raster.DEFAULT_NDWI;
    const nbrDefaults = IDEE.style.Raster.DEFAULT_NBR;
    const rasterDefaults = IDEE.style.Raster.DEFAULT_OPTIONS;
    const interpolationBase = rasterDefaults.interpolationBase;
    return {
      stylesSelectLayer: getValue('stylesSelectLayer'),
      colorRamps: getValue('colorRamps'),
      monoband: getValue('monoband'),
      bandsMean: getValue('bandsMean'),
      band: getValue('band'),
      bands: getValue('bands'),
      addBand: getValue('addBand'),
      removeBand: getValue('removeBand'),
      spectralIndices: getValue('spectralIndices'),
      rgbCombinations: getValue('rgbCombinations'),
      basic: getValue('basic'),
      basicHint: getValue('basicHint'),
      rgbSubtitle: getValue('rgbSubtitle'),
      rgbHint: getValue('rgbHint'),
      bandChannelR: getValue('bandChannelR'),
      bandChannelG: getValue('bandChannelG'),
      bandChannelB: getValue('bandChannelB'),
      ndvi: getValue('ndvi'),
      ndwi: getValue('ndwi'),
      nbr: getValue('nbr'),
      ndviTooltip: getValue('ndviTooltip'),
      ndwiTooltip: getValue('ndwiTooltip'),
      nbrTooltip: getValue('nbrTooltip'),
      bandChannelBTooltip: getValue('bandChannelBTooltip'),
      bandNirTooltip: getValue('bandNirTooltip'),
      bandSwirTooltip: getValue('bandSwirTooltip'),
      filters: getValue('filters'),
      saturation: getValue('saturation'),
      gamma: getValue('gamma'),
      brightness: getValue('brightness'),
      contrast: getValue('contrast'),
      exposure: getValue('exposure'),
      bandNir: getValue('bandNir'),
      bandRed: getValue('bandRed'),
      bandGreen: getValue('bandGreen'),
      bandBlue: getValue('bandBlue'),
      bandSwir: getValue('bandSwir'),
      min: getValue('min'),
      max: getValue('max'),
      ramp: getValue('ramp'),
      interpolation: getValue('interpolation'),
      interpolationLinear: getValue('interpolationLinear'),
      interpolationExponential: getValue('interpolationExponential'),
      interpolationBase: getValue('interpolationBase'),
      nodata: getValue('nodata'),
      nodataOptional: getValue('nodataOptional'),
      addColor: getValue('addColor'),
      removeColor: getValue('removeColor'),
      rampStop: getValue('rampStop'),
      defaults: FILTER_DEFAULTS,
      basicDefaults: { band: rasterDefaults.bands },
      rampDefaults: {
        band: rasterDefaults.bands,
        meanBands: MEAN_DEFAULT_BANDS,
        min: rasterDefaults.min,
        max: rasterDefaults.max,
        ramp: rasterDefaults.ramp,
        interpolationBase,
      },
      ndviDefaults: {
        nir: ndviDefaults.bands[0],
        red: ndviDefaults.bands[1],
        min: ndviDefaults.min,
        max: ndviDefaults.max,
        ramp: ndviDefaults.ramp,
        interpolationBase,
      },
      ndwiDefaults: {
        green: ndwiDefaults.bands[0],
        nir: ndwiDefaults.bands[1],
        min: ndwiDefaults.min,
        max: ndwiDefaults.max,
        ramp: ndwiDefaults.ramp,
        interpolationBase,
      },
      nbrDefaults: {
        nir: nbrDefaults.bands[0],
        swir: nbrDefaults.bands[1],
        min: nbrDefaults.min,
        max: nbrDefaults.max,
        ramp: nbrDefaults.ramp,
        interpolationBase,
      },
      rgbDefaults: {
        r: RGB_DEFAULTS.bands[0],
        g: RGB_DEFAULTS.bands[1],
        b: RGB_DEFAULTS.bands[2],
        nodata: RGB_DEFAULTS.nodata,
      },
    };
  }

  /**
   * Activa la sección Estilos.
   * @param {HTMLElement} html Plantilla principal.
   */
  active(html) {
    this.html_ = html;
    const container = html.querySelector('#m-rastermanagement-styles-section');
    if (!this.activated_) {
      const content = IDEE.template.compileSync(template, {
        vars: this.getTemplateVars(),
      });
      container.appendChild(content);
      this.template_ = content;
      this.addTabEvents(html);
      this.addIndexEvents(html);
      this.addRampModeEvents(html);
      this.addFilterEvents(html);
      this.addSpectralIndexEvents(html);
      this.addColorRampEvents(html);
      this.activated_ = true;
    }
    container.classList.remove('hidden');
    this.updateEditorVisibility();
  }

  /**
   * Desactiva la sección Estilos.
   */
  deactive() {
    if (!this.html_) {
      return;
    }
    const container = this.html_.querySelector('#m-rastermanagement-styles-section');
    if (container) {
      container.classList.add('hidden');
    }
    this.updateEditorVisibility();
  }

  /**
   * Notifica cambio de capa seleccionada.
   */
  onLayerSelected() {
    this.updateEditorVisibility();
    this.loadSelectedLayerStyle();
  }

  equals(control) {
    return control instanceof StylesControl;
  }

  destroy() {}

  /**
   * Ajusta tabindex de elementos dinámicos para accesibilidad.
   *
   * @private
   * @function
   * @param {HTMLElement} html Plantilla del control
   */
  accessibilityTab(html) {
    html.querySelectorAll('[tabindex="0"]').forEach((el) => {
      el.setAttribute('tabindex', this.parentControl_.order);
    });
  }

  addTabEvents(html) {
    const tabsContainer = html.querySelector('#m-rastermanagement-tabs');
    tabsContainer.addEventListener('click', (evt) => this.toggleTabs(evt));
  }

  /**
   * Añade los eventos de cambio de pestaña en la sección Geoprocesos.
   *
   * @private
   * @function
   * @param {HTMLElement} html Plantilla del control
   */

  addIndexEvents(html) {
    const indicesContainer = html.querySelector('#m-rastermanagement-indices');
    indicesContainer.addEventListener('click', (evt) => this.toggleIndices(evt));
  }

  /**
   * Añade los eventos de selección de modos de rampa
   *
   * @private
   * @function
   * @param {HTMLElement} html Plantilla del control
   */

  addRampModeEvents(html) {
    const rampsContainer = html.querySelector('#m-rastermanagement-ramps');
    rampsContainer.addEventListener('click', (evt) => this.toggleRampModes(evt));
  }

  /**
   * Añade los eventos de los formularios de índices espectrales
   *
   * @private
   * @function
   * @param {HTMLElement} html Plantilla del control
   */

  addSpectralIndexEvents(html) {
    SPECTRAL_INDICES.forEach((index) => {
      const interpolationSelect = html.querySelector(`#m-rastermanagement-${index}-interpolation`);
      const addColorBtn = html.querySelector(`#m-rastermanagement-${index}-add-color`);
      const rampContainer = html.querySelector(`#m-rastermanagement-${index}-ramp`);
      const minInput = html.querySelector(`#m-rastermanagement-${index}-min`);
      const maxInput = html.querySelector(`#m-rastermanagement-${index}-max`);
      interpolationSelect.addEventListener('change', () => this.toggleIndexInterpolationBase(index));
      addColorBtn.addEventListener('click', () => this.addIndexRampColor(index));
      rampContainer.addEventListener('click', (evt) => this.onIndexRampClick(evt, index));
      rampContainer.addEventListener('change', (evt) => {
        if (evt.target.classList.contains('m-rastermanagement-ramp-value')) {
          this.onIndexRampStopChange(index);
        }
      });
      minInput.addEventListener('change', () => this.onIndexRampMinMaxChange(index));
      maxInput.addEventListener('change', () => this.onIndexRampMinMaxChange(index));
      this.updateIndexRampRemoveButtons(index);
      this.updateIndexRampValueLabels(index);
    });
  }

  /**
   * Añade los eventos de los formularios de rampas de color
   *
   * @private
   * @function
   * @param {HTMLElement} html Plantilla del control
   */

  addColorRampEvents(html) {
    COLOR_RAMP_MODES.forEach((mode) => {
      const interpolationSelect = html.querySelector(`#m-rastermanagement-${mode}-interpolation`);
      const addColorBtn = html.querySelector(`#m-rastermanagement-${mode}-add-color`);
      const rampContainer = html.querySelector(`#m-rastermanagement-${mode}-ramp`);
      const minInput = html.querySelector(`#m-rastermanagement-${mode}-min`);
      const maxInput = html.querySelector(`#m-rastermanagement-${mode}-max`);
      interpolationSelect.addEventListener('change', () => this.toggleIndexInterpolationBase(mode));
      addColorBtn.addEventListener('click', () => this.addIndexRampColor(mode));
      rampContainer.addEventListener('click', (evt) => this.onIndexRampClick(evt, mode));
      rampContainer.addEventListener('change', (evt) => {
        if (evt.target.classList.contains('m-rastermanagement-ramp-value')) {
          this.onIndexRampStopChange(mode);
        }
      });
      minInput.addEventListener('change', () => this.onIndexRampMinMaxChange(mode));
      maxInput.addEventListener('change', () => this.onIndexRampMinMaxChange(mode));
      this.updateIndexRampRemoveButtons(mode);
      this.updateIndexRampValueLabels(mode);
    });

    const addBandBtn = html.querySelector('#m-rastermanagement-mean-add-band');
    const bandsContainer = html.querySelector('#m-rastermanagement-mean-bands');
    addBandBtn.addEventListener('click', () => this.addMeanBand());
    bandsContainer.addEventListener('click', (evt) => this.onMeanBandsClick(evt));
    this.updateMeanBandRemoveButtons();
  }

  /**
   * Obtiene los valores por defecto del índice indicado
   *
   * @private
   * @function
   * @param {string} index Identificador del índice
   * @returns {object}
   */

  getIndexDefaults(index) {
    if (index === 'ndwi') {
      return IDEE.style.Raster.DEFAULT_NDWI;
    }
    if (index === 'nbr') {
      return IDEE.style.Raster.DEFAULT_NBR;
    }
    return IDEE.style.Raster.DEFAULT_NDVI;
  }

  /**
   * Obtiene la fórmula del índice indicado
   *
   * @private
   * @function
   * @param {string} index Identificador del índice
   * @returns {string}
   */

  getIndexFormula(index) {
    if (index === 'ndwi') {
      return IDEE.style.Raster.FORMULA.NDWI;
    }
    if (index === 'nbr') {
      return IDEE.style.Raster.FORMULA.NBR;
    }
    return IDEE.style.Raster.FORMULA.NDVI;
  }

  /**
   * Gestiona los clics en la rampa de un índice (eliminar color)
   *
   * @private
   * @function
   * @param {Event} evt Evento de clic
   * @param {string} index Identificador del índice
   */

  onIndexRampClick(evt, index) {
    const removeBtn = evt.target.closest('.m-rastermanagement-ramp-remove');
    if (!removeBtn) {
      return;
    }
    this.removeIndexRampColor(index, removeBtn);
  }

  /**
   * Añade un color a la rampa de un índice
   *
   * @private
   * @function
   * @param {string} index Identificador del índice
   */

  addIndexRampColor(index) {
    const rampContainer = this.html.querySelector(`#m-rastermanagement-${index}-ramp`);
    const colorInputs = rampContainer.querySelectorAll('.m-rastermanagement-ramp-color');
    let color = '#018571';
    if (colorInputs.length > 0) {
      color = colorInputs[colorInputs.length - 1].value;
    }
    rampContainer.appendChild(this.createIndexRampItem(color));
    this.updateIndexRampRemoveButtons(index);
    this.updateIndexRampValueLabels(index);
    this.accessibilityTab(this.html);
    if (this.selectedLayer) {
      this.applyStyle();
    }
  }

  /**
   * Elimina un color de la rampa de un índice
   *
   * @private
   * @function
   * @param {string} index Identificador del índice
   * @param {HTMLElement} removeBtn Botón de eliminar
   */

  removeIndexRampColor(index, removeBtn) {
    const rampContainer = this.html.querySelector(`#m-rastermanagement-${index}-ramp`);
    const items = rampContainer.querySelectorAll('.m-rastermanagement-ramp-item');
    if (items.length <= 2) {
      IDEE.toast.warning(getValue('exception.invalidRamp'), null, 6000);
      return;
    }
    const item = removeBtn.closest('.m-rastermanagement-ramp-item');
    if (item) {
      item.remove();
    }
    this.updateIndexRampRemoveButtons(index);
    this.updateIndexRampValueLabels(index);
    if (this.selectedLayer) {
      this.applyStyle();
    }
  }

  /**
   * Crea un elemento de color de rampa
   *
   * @private
   * @function
   * @param {string} color Color hexadecimal
   * @returns {HTMLElement}
   */

  createIndexRampItem(color) {
    const item = document.createElement('div');
    item.className = 'm-rastermanagement-ramp-item';

    const swatch = document.createElement('div');
    swatch.className = 'm-rastermanagement-ramp-swatch';

    const colorInput = document.createElement('input');
    colorInput.type = 'color';
    colorInput.className = 'm-rastermanagement-ramp-color';
    colorInput.value = color;
    colorInput.setAttribute('tabindex', '0');
    colorInput.setAttribute('aria-label', getValue('ramp'));

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'm-rastermanagement-ramp-remove';
    removeBtn.title = getValue('removeColor');
    removeBtn.setAttribute('aria-label', getValue('removeColor'));
    removeBtn.setAttribute('tabindex', '0');
    removeBtn.textContent = '−';

    const valueInput = document.createElement('input');
    valueInput.type = 'number';
    valueInput.className = 'm-rastermanagement-ramp-value';
    valueInput.step = 'any';
    valueInput.setAttribute('tabindex', '0');
    valueInput.setAttribute('aria-label', getValue('rampStop'));

    swatch.appendChild(colorInput);
    swatch.appendChild(removeBtn);
    item.appendChild(swatch);
    item.appendChild(valueInput);
    return item;
  }

  /**
   * Formatea un valor de parada de la rampa para mostrarlo en la UI
   *
   * @private
   * @function
   * @param {number} value Valor numérico
   * @returns {string}
   */

  formatRampStopValue(value) {
    if (!Number.isFinite(value)) {
      return '';
    }
    const rounded = Math.round(value * 10000) / 10000;
    return String(rounded);
  }

  /**
   * Calcula los valores de parada de la rampa entre min y max
   *
   * @private
   * @function
   * @param {number} min Valor mínimo
   * @param {number} max Valor máximo
   * @param {number} count Número de colores
   * @returns {Array<number>}
   */

  getRampStopValues(min, max, count) {
    if (count < 2 || !Number.isFinite(min) || !Number.isFinite(max)) {
      return [];
    }
    const step = (max - min) / (count - 1);
    const stops = [];
    for (let i = 0; i < count; i += 1) {
      stops.push(min + (step * i));
    }
    return stops;
  }

  /**
   * Lee los valores de parada editables de una rampa
   *
   * @private
   * @function
   * @param {string} index Identificador del índice o modo
   * @returns {Array<number>|null}
   */

  getIndexRampStops(index) {
    const rampContainer = this.html.querySelector(`#m-rastermanagement-${index}-ramp`);
    if (!rampContainer) {
      return null;
    }
    const valueInputs = rampContainer.querySelectorAll('.m-rastermanagement-ramp-value');
    const stops = [];
    let hasInvalid = false;
    valueInputs.forEach((input) => {
      const value = parseFloat(input.value);
      if (Number.isNaN(value)) {
        hasInvalid = true;
        return;
      }
      stops.push(value);
    });
    if (hasInvalid || stops.length < 2) {
      return null;
    }
    for (let i = 1; i < stops.length; i += 1) {
      if (stops[i] < stops[i - 1]) {
        return null;
      }
    }
    return stops;
  }

  /**
   * Actualiza los valores de parada de la rampa desde min/max
   *
   * @private
   * @function
   * @param {string} index Identificador del índice o modo
   * @param {Array<number>} [stopsParam] Paradas concretas (opcional)
   */

  updateIndexRampValueLabels(index, stopsParam) {
    const rampContainer = this.html.querySelector(`#m-rastermanagement-${index}-ramp`);
    if (!rampContainer) {
      return;
    }
    const items = rampContainer.querySelectorAll('.m-rastermanagement-ramp-item');
    let stops = stopsParam;
    if (!IDEE.utils.isArray(stops) || stops.length !== items.length) {
      const minInput = this.html.querySelector(`#m-rastermanagement-${index}-min`);
      const maxInput = this.html.querySelector(`#m-rastermanagement-${index}-max`);
      const min = parseFloat(minInput.value);
      const max = parseFloat(maxInput.value);
      stops = this.getRampStopValues(min, max, items.length);
    }

    this.updatingRampStops_ = true;
    items.forEach((item, itemIndex) => {
      let valueInput = item.querySelector('.m-rastermanagement-ramp-value');
      if (!valueInput) {
        valueInput = document.createElement('input');
        valueInput.type = 'number';
        valueInput.className = 'm-rastermanagement-ramp-value';
        valueInput.step = 'any';
        valueInput.setAttribute('tabindex', '0');
        valueInput.setAttribute('aria-label', getValue('rampStop'));
        item.appendChild(valueInput);
      }
      let stopValue = '';
      if (stops.length > itemIndex) {
        stopValue = this.formatRampStopValue(stops[itemIndex]);
      }
      valueInput.value = stopValue;
      const colorInput = item.querySelector('.m-rastermanagement-ramp-color');
      if (colorInput) {
        colorInput.setAttribute('aria-label', `${getValue('ramp')}: ${stopValue}`);
      }
    });
    this.updatingRampStops_ = false;
  }

  /**
   * Gestiona la edición de un valor de parada de la rampa
   *
   * @private
   * @function
   * @param {string} index Identificador del índice o modo
   */

  onIndexRampStopChange(index) {
    if (this.updatingRampStops_) {
      return;
    }
    const stops = this.getIndexRampStops(index);
    if (!stops) {
      IDEE.toast.warning(getValue('exception.invalidRampStops'), null, 6000);
      return;
    }
    this.updatingRampStops_ = true;
    this.html.querySelector(`#m-rastermanagement-${index}-min`).value = this.formatRampStopValue(stops[0]);
    this.html.querySelector(`#m-rastermanagement-${index}-max`).value = this.formatRampStopValue(stops[stops.length - 1]);
    this.updatingRampStops_ = false;
    if (this.selectedLayer) {
      this.applyStyle();
    }
  }

  /**
   * Regenera las paradas de la rampa al cambiar min o max
   *
   * @private
   * @function
   * @param {string} index Identificador del índice o modo
   */

  onIndexRampMinMaxChange(index) {
    if (this.updatingRampStops_) {
      return;
    }
    this.updateIndexRampValueLabels(index);
    if (this.selectedLayer) {
      this.applyStyle();
    }
  }

  /**
   * Reconstruye la rampa de un índice con los colores indicados
   *
   * @private
   * @function
   * @param {string} index Identificador del índice
   * @param {Array<string>} colors Colores de la rampa
   * @param {Array<number>} [stops] Valores de parada (opcional)
   */

  renderIndexRamp(index, colors, stops) {
    const rampContainer = this.html.querySelector(`#m-rastermanagement-${index}-ramp`);
    rampContainer.innerHTML = '';
    colors.forEach((color) => {
      rampContainer.appendChild(this.createIndexRampItem(color));
    });
    this.updateIndexRampRemoveButtons(index);
    this.updateIndexRampValueLabels(index, stops);
    this.accessibilityTab(this.html);
  }

  /**
   * Actualiza el estado de los botones de eliminar color de la rampa
   *
   * @private
   * @function
   * @param {string} index Identificador del índice
   */

  updateIndexRampRemoveButtons(index) {
    const rampContainer = this.html.querySelector(`#m-rastermanagement-${index}-ramp`);
    const items = rampContainer.querySelectorAll('.m-rastermanagement-ramp-item');
    const canRemove = items.length > 2;
    items.forEach((item) => {
      const removeBtn = item.querySelector('.m-rastermanagement-ramp-remove');
      removeBtn.disabled = !canRemove;
    });
  }

  /**
   * Muestra u oculta la base de interpolación de un índice
   *
   * @private
   * @function
   * @param {string} index Identificador del índice
   */

  toggleIndexInterpolationBase(index) {
    const interpolationSelect = this.html.querySelector(`#m-rastermanagement-${index}-interpolation`);
    const baseControl = this.html.querySelector(`.m-rastermanagement-${index}-base-control`);
    if (interpolationSelect.value === 'exponential') {
      baseControl.classList.remove('hidden');
    } else {
      baseControl.classList.add('hidden');
    }
  }

  /**
   * Indica si la pestaña de índices espectrales está activa
   *
   * @private
   * @function
   * @returns {boolean}
   */

  isSpectralIndicesTabActive() {
    const tab = this.html.querySelector('#m-rastermanagement-spectralindices-tab');
    return tab.classList.contains('active');
  }

  /**
   * Devuelve el índice espectral activo
   *
   * @private
   * @function
   * @returns {string|null}
   */

  getActiveSpectralIndex() {
    for (let i = 0; i < SPECTRAL_INDICES.length; i += 1) {
      const index = SPECTRAL_INDICES[i];
      const button = this.html.querySelector(`#m-rastermanagement-${index}-index`);
      if (button.classList.contains('active')) {
        return index;
      }
    }
    return null;
  }

  /**
   * Cambia el índice espectral activo
   *
   * @private
   * @function
   * @param {Event} evt Evento de clic en un índice
   */

  toggleIndices(evt) {
    evt.stopPropagation();
    let index = evt.target;
    if (!index.classList.contains('m-rastermanagement-index')) {
      index = index.closest('.m-rastermanagement-index');
    }
    if (!index) {
      return;
    }

    const indices = index.parentNode.children;
    for (let i = 0; i < indices.length; i += 1) {
      const child = indices.item(i);
      child.classList.remove('active');
      child.setAttribute('aria-selected', 'false');
    }
    index.classList.add('active');
    index.setAttribute('aria-selected', 'true');

    const indicesContent = this.html.querySelector('#m-rastermanagement-indices-contents').children;
    for (let i = 0; i < indicesContent.length; i += 1) {
      const child = indicesContent.item(i);
      if (child.id !== `${index.id}-content`) {
        child.classList.add('hidden');
      } else if (child.classList.contains('hidden')) {
        child.classList.remove('hidden');
      }
    }
  }

  /**
   * Cambia el modo de rampa de color activo
   *
   * @private
   * @function
   * @param {Event} evt Evento de clic en un modo
   */

  toggleRampModes(evt) {
    evt.stopPropagation();
    let mode = evt.target;
    if (!mode.classList.contains('m-rastermanagement-index')) {
      mode = mode.closest('.m-rastermanagement-index');
    }
    if (!mode) {
      return;
    }

    const modes = mode.parentNode.children;
    for (let i = 0; i < modes.length; i += 1) {
      const child = modes.item(i);
      child.classList.remove('active');
      child.setAttribute('aria-selected', 'false');
    }
    mode.classList.add('active');
    mode.setAttribute('aria-selected', 'true');

    const modesContent = this.html.querySelector('#m-rastermanagement-ramps-contents').children;
    for (let i = 0; i < modesContent.length; i += 1) {
      const child = modesContent.item(i);
      if (child.id !== `${mode.id}-content`) {
        child.classList.add('hidden');
      } else if (child.classList.contains('hidden')) {
        child.classList.remove('hidden');
      }
    }
  }

  /**
   * Indica si la pestaña de rampas de color está activa
   *
   * @private
   * @function
   * @returns {boolean}
   */

  isColorRampsTabActive() {
    const tab = this.html.querySelector('#m-rastermanagement-colorramps-tab');
    return tab.classList.contains('active');
  }

  /**
   * Devuelve el modo de rampa de color activo
   *
   * @private
   * @function
   * @returns {string|null}
   */

  getActiveColorRampMode() {
    for (let i = 0; i < COLOR_RAMP_MODES.length; i += 1) {
      const mode = COLOR_RAMP_MODES[i];
      const button = this.html.querySelector(`#m-rastermanagement-${mode}-mode`);
      if (button.classList.contains('active')) {
        return mode;
      }
    }
    return null;
  }

  /**
   * Indica si la pestaña de combinaciones RGB está activa
   *
   * @private
   * @function
   * @returns {boolean}
   */

  isRgbCombinationsTabActive() {
    const tab = this.html.querySelector('#m-rastermanagement-rgbcombinations-tab');
    return tab.classList.contains('active');
  }

  /**
   * Indica si la pestaña básica está activa
   *
   * @private
   * @function
   * @returns {boolean}
   */

  isBasicTabActive() {
    const tab = this.html.querySelector('#m-rastermanagement-basic-tab');
    return tab.classList.contains('active');
  }

  /**
   * Gestiona los clics en la lista de bandas del modo media
   *
   * @private
   * @function
   * @param {Event} evt Evento de clic
   */

  onMeanBandsClick(evt) {
    const removeBtn = evt.target.closest('.m-rastermanagement-band-remove');
    if (!removeBtn) {
      return;
    }
    this.removeMeanBand(removeBtn);
  }

  /**
   * Añade una banda al modo media
   *
   * @private
   * @function
   */

  addMeanBand() {
    const bandsContainer = this.html.querySelector('#m-rastermanagement-mean-bands');
    const bandInputs = bandsContainer.querySelectorAll('.m-rastermanagement-mean-band');
    let bandValue = 1;
    if (bandInputs.length > 0) {
      const lastValue = parseInt(bandInputs[bandInputs.length - 1].value, 10);
      if (!Number.isNaN(lastValue) && lastValue >= 1) {
        bandValue = lastValue + 1;
      }
    }
    bandsContainer.appendChild(this.createMeanBandItem(bandValue));
    this.updateMeanBandRemoveButtons();
    this.accessibilityTab(this.html);
  }

  /**
   * Elimina una banda del modo media
   *
   * @private
   * @function
   * @param {HTMLElement} removeBtn Botón de eliminar
   */

  removeMeanBand(removeBtn) {
    const bandsContainer = this.html.querySelector('#m-rastermanagement-mean-bands');
    const items = bandsContainer.querySelectorAll('.m-rastermanagement-band-item');
    if (items.length <= 2) {
      IDEE.toast.warning(getValue('exception.invalidMeanBands'), null, 6000);
      return;
    }
    const item = removeBtn.closest('.m-rastermanagement-band-item');
    if (item) {
      item.remove();
    }
    this.updateMeanBandRemoveButtons();
  }

  /**
   * Crea un elemento de banda para el modo media
   *
   * @private
   * @function
   * @param {number} bandValue Número de banda
   * @returns {HTMLElement}
   */

  createMeanBandItem(bandValue) {
    const item = document.createElement('div');
    item.className = 'm-rastermanagement-band-item';

    const bandInput = document.createElement('input');
    bandInput.type = 'number';
    bandInput.className = 'm-rastermanagement-mean-band';
    bandInput.name = 'mean-band';
    bandInput.min = '1';
    bandInput.step = '1';
    bandInput.value = bandValue;
    bandInput.setAttribute('tabindex', '0');
    bandInput.setAttribute('aria-label', getValue('band'));

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'm-rastermanagement-band-remove';
    removeBtn.title = getValue('removeBand');
    removeBtn.setAttribute('aria-label', getValue('removeBand'));
    removeBtn.setAttribute('tabindex', '0');
    removeBtn.textContent = '−';

    item.appendChild(bandInput);
    item.appendChild(removeBtn);
    return item;
  }

  /**
   * Actualiza el estado de los botones de eliminar banda del modo media
   *
   * @private
   * @function
   */

  updateMeanBandRemoveButtons() {
    const bandsContainer = this.html.querySelector('#m-rastermanagement-mean-bands');
    const items = bandsContainer.querySelectorAll('.m-rastermanagement-band-item');
    const canRemove = items.length > 2;
    items.forEach((item) => {
      const removeBtn = item.querySelector('.m-rastermanagement-band-remove');
      removeBtn.disabled = !canRemove;
    });
  }

  /**
   * Reconstruye las bandas del modo media
   *
   * @private
   * @function
   * @param {Array<number>} bands Números de banda
   */

  renderMeanBands(bands) {
    const bandsContainer = this.html.querySelector('#m-rastermanagement-mean-bands');
    bandsContainer.innerHTML = '';
    bands.forEach((band) => {
      bandsContainer.appendChild(this.createMeanBandItem(band));
    });
    this.updateMeanBandRemoveButtons();
    this.accessibilityTab(this.html);
  }

  /**
   * Añade los eventos del selector de capas y de los botones de estilo
   *
   * @private
   * @function
   * @param {HTMLElement} html Plantilla del control
   */

  addFilterEvents(html) {
    const filterIds = ['saturation', 'gamma', 'brightness', 'contrast', 'exposure'];
    filterIds.forEach((id) => {
      const input = html.querySelector(`#m-rastermanagement-${id}`);
      input.addEventListener('input', () => this.updateFilterValue(id));
    });

    const gammaInput = html.querySelector('#m-rastermanagement-gamma');
    gammaInput.addEventListener('input', () => this.clampGammaInput());
    gammaInput.addEventListener('change', () => this.validateGammaInput());
    this.updateAllFilterValues();
  }

  /**
   * Corrige valores negativos de gamma mientras se escribe
   *
   * @private
   * @function
   */

  clampGammaInput() {
    const gammaInput = this.html.querySelector('#m-rastermanagement-gamma');
    if (gammaInput.value === '') {
      return;
    }
    const value = parseFloat(gammaInput.value);
    if (!Number.isNaN(value) && value < 0) {
      gammaInput.value = 0;
    }
  }

  /**
   * Valida el input de gamma al confirmar el valor
   *
   * @private
   * @function
   */

  validateGammaInput() {
    const gammaInput = this.html.querySelector('#m-rastermanagement-gamma');
    const value = parseFloat(gammaInput.value);
    if (Number.isNaN(value) || gammaInput.value === '') {
      gammaInput.value = FILTER_DEFAULTS.gamma;
      return;
    }
    if (value < 0) {
      gammaInput.value = 0;
    }
  }

  /**
   * Actualiza el valor visible junto a la etiqueta del filtro
   *
   * @private
   * @function
   * @param {string} id Identificador del filtro
   */

  updateFilterValue(id) {
    const input = this.html.querySelector(`#m-rastermanagement-${id}`);
    const valueLabel = this.html.querySelector(`#m-rastermanagement-${id}-value`);
    if (valueLabel) {
      valueLabel.textContent = input.value;
    }
    this.updateRangeProgress(input);
  }

  /**
   * Sincroniza el relleno azul del range con el valor actual (Chrome/WebKit)
   *
   * @private
   * @function
   * @param {HTMLInputElement} input Input de tipo range
   */

  updateRangeProgress(input) {
    if (!input || input.type !== 'range') {
      return;
    }
    const min = parseFloat(input.min);
    const max = parseFloat(input.max);
    const value = parseFloat(input.value);
    const range = max - min;
    let percent = 0;
    if (range !== 0) {
      percent = ((value - min) / range) * 100;
    }
    input.style.setProperty('--range-progress', `${percent}%`);
  }

  /**
   * Actualiza todos los valores visibles de los filtros
   *
   * @private
   * @function
   */

  updateAllFilterValues() {
    const filterIds = ['saturation', 'gamma', 'brightness', 'contrast', 'exposure'];
    filterIds.forEach((id) => this.updateFilterValue(id));
  }

  /**
   * Muestra u oculta las opciones de edición según haya capa seleccionada.
   *
   * @public
   * @function
   */
  updateEditorVisibility() {
    if (!this.html) {
      return;
    }
    const editor = this.html.querySelector('#m-rastermanagement-editor');
    const emptyMessage = this.html.querySelector('#m-rastermanagement-styles-empty');
    const applyBtn = this.html.querySelector('#m-rastermanagement-apply');
    const clearBtn = this.html.querySelector('#m-rastermanagement-clear');
    const copyBtn = this.html.querySelector('#m-rastermanagement-copy');
    const hasLayer = !IDEE.utils.isNullOrEmpty(this.selectedLayer);
    const isStylesSection = this.parentControl_.isStylesSectionActive();

    if (hasLayer && isStylesSection) {
      editor.classList.remove('hidden');
      emptyMessage.classList.add('hidden');
      applyBtn.classList.remove('hidden');
      clearBtn.classList.remove('hidden');
      copyBtn.classList.remove('hidden');
    } else {
      editor.classList.add('hidden');
      applyBtn.classList.add('hidden');
      clearBtn.classList.add('hidden');
      copyBtn.classList.add('hidden');
      if (isStylesSection && !hasLayer) {
        emptyMessage.classList.remove('hidden');
      } else {
        emptyMessage.classList.add('hidden');
      }
    }
  }

  /**
   * Gestiona la selección de una capa GeoTIFF en el selector
   *
   * @public
   * @function
   * @api stable
   */

  loadSelectedLayerStyle() {
    if (!this.selectedLayer) {
      return;
    }

    const style = this.selectedLayer.getStyle();
    if (style instanceof IDEE.style.Raster) {
      this.populateFormFromStyle(style);
      return;
    }

    this.resetFormToDefaults();
    this.suggestBandsFromSelectedLayer();
  }

  /**
   * Restaura filtros y formularios a los valores por defecto
   *
   * @private
   * @function
   */

  resetFormToDefaults() {
    this.html.querySelector('#m-rastermanagement-saturation').value = FILTER_DEFAULTS.saturation;
    this.html.querySelector('#m-rastermanagement-gamma').value = FILTER_DEFAULTS.gamma;
    this.html.querySelector('#m-rastermanagement-brightness').value = FILTER_DEFAULTS.brightness;
    this.html.querySelector('#m-rastermanagement-contrast').value = FILTER_DEFAULTS.contrast;
    this.html.querySelector('#m-rastermanagement-exposure').value = FILTER_DEFAULTS.exposure;
    this.updateAllFilterValues();
    this.resetAllIndexForms();
    this.resetAllColorRampForms();
    this.resetRgbCombinationForm();
    this.resetBasicForm();
    this.activatePanelSelection(
      this.html.querySelector('#m-rastermanagement-colorramps-tab'),
    );
    this.activatePanelSelection(
      this.html.querySelector('#m-rastermanagement-monoband-mode'),
    );
    this.activatePanelSelection(
      this.html.querySelector('#m-rastermanagement-ndvi-index'),
    );
  }

  /**
   * Rellena el formulario a partir de un estilo Raster
   *
   * @private
   * @function
   * @param {IDEE.style.Raster} style Estilo Raster
   */

  populateFormFromStyle(style) {
    const options = style.getOptions();
    this.resetFormToDefaults();
    this.populateFiltersFromOptions(options);

    if (!IDEE.utils.isNullOrEmpty(options.formula)
      && SPECTRAL_INDICES.indexOf(options.formula) !== -1) {
      this.activatePanelSelection(
        this.html.querySelector('#m-rastermanagement-spectralindices-tab'),
      );
      this.activatePanelSelection(
        this.html.querySelector(`#m-rastermanagement-${options.formula}-index`),
      );
      this.populateIndexFormFromOptions(options.formula, options);
      return;
    }

    if (IDEE.style.Raster.hasRamp(options, true)) {
      this.activatePanelSelection(
        this.html.querySelector('#m-rastermanagement-colorramps-tab'),
      );
      const bands = options.bands;
      if (IDEE.utils.isArray(bands) && bands.length >= 2) {
        this.activatePanelSelection(
          this.html.querySelector('#m-rastermanagement-mean-mode'),
        );
        this.populateColorRampFormFromOptions('mean', options);
      } else {
        this.activatePanelSelection(
          this.html.querySelector('#m-rastermanagement-monoband-mode'),
        );
        this.populateColorRampFormFromOptions('monoband', options);
      }
      return;
    }

    if (IDEE.utils.isArray(options.bands) && options.bands.length === 3) {
      this.activatePanelSelection(
        this.html.querySelector('#m-rastermanagement-rgbcombinations-tab'),
      );
      this.populateRgbFormFromOptions(options);
      return;
    }

    this.activatePanelSelection(
      this.html.querySelector('#m-rastermanagement-basic-tab'),
    );
    this.populateBasicFormFromOptions(options);
  }

  /**
   * Activa un botón/pestaña y muestra su contenido asociado
   *
   * @private
   * @function
   * @param {HTMLElement} activeElement Elemento a activar
   */

  activatePanelSelection(activeElement) {
    if (!activeElement || !activeElement.parentNode) {
      return;
    }

    const siblings = activeElement.parentNode.children;
    for (let i = 0; i < siblings.length; i += 1) {
      const child = siblings.item(i);
      child.classList.remove('active');
      child.setAttribute('aria-selected', 'false');
    }
    activeElement.classList.add('active');
    activeElement.setAttribute('aria-selected', 'true');

    const contentsContainer = activeElement.parentNode.nextElementSibling;
    if (!contentsContainer) {
      return;
    }

    const contentId = `${activeElement.id}-content`;
    const contents = contentsContainer.children;
    for (let i = 0; i < contents.length; i += 1) {
      const child = contents.item(i);
      if (child.id !== contentId) {
        child.classList.add('hidden');
      } else {
        child.classList.remove('hidden');
      }
    }
  }

  /**
   * Rellena los filtros desde opciones de estilo
   *
   * @private
   * @function
   * @param {object} options Opciones del estilo Raster
   */

  populateFiltersFromOptions(options) {
    let saturation = FILTER_DEFAULTS.saturation;
    if (!IDEE.utils.isNullOrEmpty(options.saturation) || options.saturation === 0) {
      saturation = options.saturation;
    }
    let gamma = FILTER_DEFAULTS.gamma;
    if (!IDEE.utils.isNullOrEmpty(options.gamma) || options.gamma === 0) {
      gamma = options.gamma;
    }
    let brightness = FILTER_DEFAULTS.brightness;
    if (!IDEE.utils.isNullOrEmpty(options.brightness) || options.brightness === 0) {
      brightness = options.brightness;
    }
    let contrast = FILTER_DEFAULTS.contrast;
    if (!IDEE.utils.isNullOrEmpty(options.contrast) || options.contrast === 0) {
      contrast = options.contrast;
    }
    let exposure = FILTER_DEFAULTS.exposure;
    if (!IDEE.utils.isNullOrEmpty(options.exposure) || options.exposure === 0) {
      exposure = options.exposure;
    }

    this.html.querySelector('#m-rastermanagement-saturation').value = saturation;
    this.html.querySelector('#m-rastermanagement-gamma').value = gamma;
    this.html.querySelector('#m-rastermanagement-brightness').value = brightness;
    this.html.querySelector('#m-rastermanagement-contrast').value = contrast;
    this.html.querySelector('#m-rastermanagement-exposure').value = exposure;
    this.updateAllFilterValues();
  }

  /**
   * Rellena el formulario de un índice espectral desde opciones de estilo
   *
   * @private
   * @function
   * @param {string} index Identificador del índice
   * @param {object} options Opciones del estilo Raster
   */

  populateIndexFormFromOptions(index, options) {
    const defaults = this.getIndexDefaults(index);
    const bandIds = INDEX_BAND_IDS[index];
    let band1 = defaults.bands[0];
    let band2 = defaults.bands[1];
    if (IDEE.utils.isArray(options.bands) && options.bands.length === 2) {
      band1 = options.bands[0];
      band2 = options.bands[1];
    }
    this.html.querySelector(`#m-rastermanagement-${index}-${bandIds[0]}`).value = band1;
    this.html.querySelector(`#m-rastermanagement-${index}-${bandIds[1]}`).value = band2;

    let min = defaults.min;
    if (!IDEE.utils.isNullOrEmpty(options.min) || options.min === 0) {
      min = options.min;
    }
    let max = defaults.max;
    if (!IDEE.utils.isNullOrEmpty(options.max) || options.max === 0) {
      max = options.max;
    }
    this.html.querySelector(`#m-rastermanagement-${index}-min`).value = min;
    this.html.querySelector(`#m-rastermanagement-${index}-max`).value = max;

    let interpolation = IDEE.style.Raster.DEFAULT_OPTIONS.interpolation;
    if (!IDEE.utils.isNullOrEmpty(options.interpolation)) {
      interpolation = options.interpolation;
    }
    this.html.querySelector(`#m-rastermanagement-${index}-interpolation`).value = interpolation;

    let interpolationBase = IDEE.style.Raster.DEFAULT_OPTIONS.interpolationBase;
    if (!IDEE.utils.isNullOrEmpty(options.interpolationBase)
      || options.interpolationBase === 0) {
      interpolationBase = options.interpolationBase;
    }
    this.html.querySelector(`#m-rastermanagement-${index}-interpolation-base`).value = interpolationBase;
    this.toggleIndexInterpolationBase(index);

    const nodataInput = this.html.querySelector(`#m-rastermanagement-${index}-nodata`);
    if (!IDEE.utils.isNullOrEmpty(options.nodata) || options.nodata === 0) {
      nodataInput.value = options.nodata;
    } else {
      nodataInput.value = '';
    }

    let ramp = defaults.ramp;
    if (IDEE.utils.isArray(options.ramp) && options.ramp.length >= 2) {
      ramp = options.ramp;
    }
    let stops = null;
    if (IDEE.utils.isArray(options.stops) && options.stops.length === ramp.length) {
      stops = options.stops;
    }
    this.renderIndexRamp(index, ramp, stops);
  }

  /**
   * Rellena el formulario de rampa de color desde opciones de estilo
   *
   * @private
   * @function
   * @param {string} mode Modo de rampa (monoband | mean)
   * @param {object} options Opciones del estilo Raster
   */

  populateColorRampFormFromOptions(mode, options) {
    const defaults = IDEE.style.Raster.DEFAULT_OPTIONS;

    if (mode === 'monoband') {
      let band = defaults.bands;
      if (!IDEE.utils.isNullOrEmpty(options.bands) || options.bands === 0) {
        if (IDEE.utils.isArray(options.bands)) {
          band = options.bands[0];
        } else {
          band = options.bands;
        }
      }
      this.html.querySelector('#m-rastermanagement-monoband-band').value = band;
    } else {
      let meanBands = MEAN_DEFAULT_BANDS;
      if (IDEE.utils.isArray(options.bands) && options.bands.length >= 2) {
        meanBands = options.bands;
      }
      this.renderMeanBands(meanBands);
    }

    let min = defaults.min;
    if (!IDEE.utils.isNullOrEmpty(options.min) || options.min === 0) {
      min = options.min;
    }
    let max = defaults.max;
    if (!IDEE.utils.isNullOrEmpty(options.max) || options.max === 0) {
      max = options.max;
    }
    this.html.querySelector(`#m-rastermanagement-${mode}-min`).value = min;
    this.html.querySelector(`#m-rastermanagement-${mode}-max`).value = max;

    let interpolation = defaults.interpolation;
    if (!IDEE.utils.isNullOrEmpty(options.interpolation)) {
      interpolation = options.interpolation;
    }
    this.html.querySelector(`#m-rastermanagement-${mode}-interpolation`).value = interpolation;

    let interpolationBase = defaults.interpolationBase;
    if (!IDEE.utils.isNullOrEmpty(options.interpolationBase)
      || options.interpolationBase === 0) {
      interpolationBase = options.interpolationBase;
    }
    this.html.querySelector(`#m-rastermanagement-${mode}-interpolation-base`).value = interpolationBase;
    this.toggleIndexInterpolationBase(mode);

    const nodataInput = this.html.querySelector(`#m-rastermanagement-${mode}-nodata`);
    if (!IDEE.utils.isNullOrEmpty(options.nodata) || options.nodata === 0) {
      nodataInput.value = options.nodata;
    } else {
      nodataInput.value = '';
    }

    let ramp = defaults.ramp;
    if (IDEE.utils.isArray(options.ramp) && options.ramp.length >= 2) {
      ramp = options.ramp;
    }
    let stops = null;
    if (IDEE.utils.isArray(options.stops) && options.stops.length === ramp.length) {
      stops = options.stops;
    }
    this.renderIndexRamp(mode, ramp, stops);
  }

  /**
   * Rellena el formulario de combinación RGB desde opciones de estilo
   *
   * @private
   * @function
   * @param {object} options Opciones del estilo Raster
   */

  populateRgbFormFromOptions(options) {
    let bands = RGB_DEFAULTS.bands;
    if (IDEE.utils.isArray(options.bands) && options.bands.length === 3) {
      bands = options.bands;
    }
    this.html.querySelector('#m-rastermanagement-rgb-r').value = bands[0];
    this.html.querySelector('#m-rastermanagement-rgb-g').value = bands[1];
    this.html.querySelector('#m-rastermanagement-rgb-b').value = bands[2];

    const nodataInput = this.html.querySelector('#m-rastermanagement-rgb-nodata');
    if (!IDEE.utils.isNullOrEmpty(options.nodata) || options.nodata === 0) {
      nodataInput.value = options.nodata;
    } else {
      nodataInput.value = RGB_DEFAULTS.nodata;
    }
  }

  /**
   * Rellena el formulario básico desde opciones de estilo
   *
   * @private
   * @function
   * @param {object} options Opciones del estilo Raster
   */

  populateBasicFormFromOptions(options) {
    let band = IDEE.style.Raster.DEFAULT_OPTIONS.bands;
    if (!IDEE.utils.isNullOrEmpty(options.bands) || options.bands === 0) {
      if (IDEE.utils.isArray(options.bands)) {
        band = options.bands[0];
      } else {
        band = options.bands;
      }
    }
    this.html.querySelector('#m-rastermanagement-basic-band').value = band;

    const nodataInput = this.html.querySelector('#m-rastermanagement-basic-nodata');
    if (!IDEE.utils.isNullOrEmpty(options.nodata) || options.nodata === 0) {
      nodataInput.value = options.nodata;
    } else {
      nodataInput.value = '';
    }
  }

  /**
   * Sugiere bandas de índices a partir de metadatos GDAL de la capa
   *
   * @private
   * @function
   */

  suggestBandsFromSelectedLayer() {
    this.bandRolesRequestId_ += 1;
    const requestId = this.bandRolesRequestId_;
    const layer = this.selectedLayer;

    if (!layer || typeof layer.getBandRoles !== 'function') {
      return;
    }

    const applyRoles = (roles) => {
      if (requestId !== this.bandRolesRequestId_) {
        return;
      }
      if (this.selectedLayer !== layer) {
        return;
      }
      if (!roles) {
        return;
      }
      this.applySuggestedBandRoles(roles);
    };

    layer.getBandRoles().then((roles) => {
      if (roles) {
        applyRoles(roles);
        return;
      }
      // La capa puede no estar lista aún: reintentar al LOAD
      if (typeof layer.once === 'function') {
        layer.once(IDEE.evt.LOAD, () => {
          if (requestId !== this.bandRolesRequestId_) {
            return;
          }
          layer.getBandRoles().then(applyRoles).catch((err) => {
            // eslint-disable-next-line no-console
            console.error(err);
          });
        });
      }
    }).catch((err) => {
      // eslint-disable-next-line no-console
      console.error(err);
    });
  }

  /**
   * Rellena los formularios de índices con los roles detectados
   *
   * @private
   * @function
   * @param {Object<string, number>} roles Mapa rol → banda (1-based)
   */

  applySuggestedBandRoles(roles) {
    SPECTRAL_INDICES.forEach((index) => {
      const bandIds = INDEX_BAND_IDS[index];
      bandIds.forEach((role) => {
        const bandNumber = roles[role];
        if (!bandNumber) {
          return;
        }
        const input = this.html.querySelector(`#m-rastermanagement-${index}-${role}`);
        if (input) {
          input.value = bandNumber;
        }
      });
    });

    if (roles.red && roles.green && roles.blue) {
      this.html.querySelector('#m-rastermanagement-rgb-r').value = roles.red;
      this.html.querySelector('#m-rastermanagement-rgb-g').value = roles.green;
      this.html.querySelector('#m-rastermanagement-rgb-b').value = roles.blue;
      return;
    }

    if (roles.nir && roles.red && roles.green) {
      this.html.querySelector('#m-rastermanagement-rgb-r').value = roles.nir;
      this.html.querySelector('#m-rastermanagement-rgb-g').value = roles.red;
      this.html.querySelector('#m-rastermanagement-rgb-b').value = roles.green;
      return;
    }

    if (roles.red) {
      this.html.querySelector('#m-rastermanagement-rgb-r').value = roles.red;
    }
    if (roles.green) {
      this.html.querySelector('#m-rastermanagement-rgb-g').value = roles.green;
    }
    if (roles.blue) {
      this.html.querySelector('#m-rastermanagement-rgb-b').value = roles.blue;
    }
  }

  /**
   * Obtiene los valores actuales de los filtros desde la UI
   *
   * @private
   * @function
   * @returns {object}
   */

  getFilterValues() {
    let gamma = parseFloat(this.html.querySelector('#m-rastermanagement-gamma').value);
    if (Number.isNaN(gamma) || gamma < 0) {
      gamma = FILTER_DEFAULTS.gamma;
    }

    return {
      saturation: parseFloat(this.html.querySelector('#m-rastermanagement-saturation').value),
      gamma,
      brightness: parseFloat(this.html.querySelector('#m-rastermanagement-brightness').value),
      contrast: parseFloat(this.html.querySelector('#m-rastermanagement-contrast').value),
      exposure: parseFloat(this.html.querySelector('#m-rastermanagement-exposure').value),
    };
  }

  /**
   * Obtiene las opciones de un índice espectral desde el formulario
   *
   * @private
   * @function
   * @param {string} index Identificador del índice
   * @returns {object|null}
   */

  getIndexOptions(index) {
    const bandIds = INDEX_BAND_IDS[index];
    const band1 = parseInt(this.html.querySelector(`#m-rastermanagement-${index}-${bandIds[0]}`).value, 10);
    const band2 = parseInt(this.html.querySelector(`#m-rastermanagement-${index}-${bandIds[1]}`).value, 10);

    if (Number.isNaN(band1) || Number.isNaN(band2) || band1 < 1 || band2 < 1) {
      IDEE.toast.warning(getValue('exception.invalidIndexBands'), null, 6000);
      return null;
    }

    const interpolation = this.html.querySelector(`#m-rastermanagement-${index}-interpolation`).value;
    const rampInputs = this.html.querySelectorAll(`#m-rastermanagement-${index}-ramp .m-rastermanagement-ramp-color`);
    const ramp = [];
    rampInputs.forEach((input) => {
      ramp.push(input.value);
    });

    if (ramp.length < 2) {
      IDEE.toast.warning(getValue('exception.invalidRamp'), null, 6000);
      return null;
    }

    const stops = this.getIndexRampStops(index);
    if (!stops || stops.length !== ramp.length) {
      IDEE.toast.warning(getValue('exception.invalidRampStops'), null, 6000);
      return null;
    }

    const options = {
      formula: this.getIndexFormula(index),
      bands: [band1, band2],
      min: stops[0],
      max: stops[stops.length - 1],
      ramp,
      stops,
      interpolation,
    };

    if (interpolation === 'exponential') {
      let interpolationBase = parseFloat(this.html.querySelector(`#m-rastermanagement-${index}-interpolation-base`).value);
      if (Number.isNaN(interpolationBase)) {
        interpolationBase = IDEE.style.Raster.DEFAULT_OPTIONS.interpolationBase;
      }
      options.interpolationBase = interpolationBase;
    }

    const nodataInput = this.html.querySelector(`#m-rastermanagement-${index}-nodata`).value;
    if (nodataInput !== '') {
      const nodata = parseFloat(nodataInput);
      if (!Number.isNaN(nodata)) {
        options.nodata = nodata;
      }
    }

    return options;
  }

  /**
   * Obtiene las opciones de rampa de color desde el formulario activo
   *
   * @private
   * @function
   * @param {string} mode Modo de rampa (monoband | mean)
   * @returns {object|null}
   */

  getColorRampOptions(mode) {
    const defaults = IDEE.style.Raster.DEFAULT_OPTIONS;
    let bands = null;

    if (mode === 'monoband') {
      const band = parseInt(this.html.querySelector('#m-rastermanagement-monoband-band').value, 10);
      if (Number.isNaN(band) || band < 1) {
        IDEE.toast.warning(getValue('exception.invalidRampBands'), null, 6000);
        return null;
      }
      bands = band;
    } else {
      const bandInputs = this.html.querySelectorAll('#m-rastermanagement-mean-bands .m-rastermanagement-mean-band');
      const meanBands = [];
      let hasInvalidBand = false;
      bandInputs.forEach((input) => {
        const band = parseInt(input.value, 10);
        if (Number.isNaN(band) || band < 1) {
          hasInvalidBand = true;
          return;
        }
        meanBands.push(band);
      });
      if (hasInvalidBand || meanBands.length < 2) {
        IDEE.toast.warning(getValue('exception.invalidMeanBands'), null, 6000);
        return null;
      }
      bands = meanBands;
    }

    const interpolation = this.html.querySelector(`#m-rastermanagement-${mode}-interpolation`).value;
    const rampInputs = this.html.querySelectorAll(`#m-rastermanagement-${mode}-ramp .m-rastermanagement-ramp-color`);
    const ramp = [];
    rampInputs.forEach((input) => {
      ramp.push(input.value);
    });

    if (ramp.length < 2) {
      IDEE.toast.warning(getValue('exception.invalidRamp'), null, 6000);
      return null;
    }

    const stops = this.getIndexRampStops(mode);
    if (!stops || stops.length !== ramp.length) {
      IDEE.toast.warning(getValue('exception.invalidRampStops'), null, 6000);
      return null;
    }

    const options = {
      bands,
      min: stops[0],
      max: stops[stops.length - 1],
      ramp,
      stops,
      interpolation,
    };

    if (interpolation === 'exponential') {
      let interpolationBase = parseFloat(this.html.querySelector(`#m-rastermanagement-${mode}-interpolation-base`).value);
      if (Number.isNaN(interpolationBase)) {
        interpolationBase = defaults.interpolationBase;
      }
      options.interpolationBase = interpolationBase;
    }

    const nodataInput = this.html.querySelector(`#m-rastermanagement-${mode}-nodata`).value;
    if (nodataInput !== '') {
      const nodata = parseFloat(nodataInput);
      if (!Number.isNaN(nodata)) {
        options.nodata = nodata;
      }
    }

    return options;
  }

  /**
   * Restaura el formulario de un índice a los valores por defecto
   *
   * @private
   * @function
   * @param {string} index Identificador del índice
   */

  resetIndexForm(index) {
    const defaults = this.getIndexDefaults(index);
    const bandIds = INDEX_BAND_IDS[index];
    this.html.querySelector(`#m-rastermanagement-${index}-${bandIds[0]}`).value = defaults.bands[0];
    this.html.querySelector(`#m-rastermanagement-${index}-${bandIds[1]}`).value = defaults.bands[1];
    this.html.querySelector(`#m-rastermanagement-${index}-min`).value = defaults.min;
    this.html.querySelector(`#m-rastermanagement-${index}-max`).value = defaults.max;
    this.html.querySelector(`#m-rastermanagement-${index}-interpolation`).value = 'linear';
    this.html.querySelector(`#m-rastermanagement-${index}-interpolation-base`).value = IDEE.style.Raster.DEFAULT_OPTIONS.interpolationBase;
    this.html.querySelector(`#m-rastermanagement-${index}-nodata`).value = '';
    this.toggleIndexInterpolationBase(index);
    this.renderIndexRamp(index, defaults.ramp);
  }

  /**
   * Restaura todos los formularios de índices espectrales
   *
   * @private
   * @function
   */

  resetAllIndexForms() {
    SPECTRAL_INDICES.forEach((index) => this.resetIndexForm(index));
  }

  /**
   * Restaura el formulario de un modo de rampa a los valores por defecto
   *
   * @private
   * @function
   * @param {string} mode Modo de rampa
   */

  resetColorRampForm(mode) {
    const defaults = IDEE.style.Raster.DEFAULT_OPTIONS;
    if (mode === 'monoband') {
      this.html.querySelector('#m-rastermanagement-monoband-band').value = defaults.bands;
    } else {
      this.renderMeanBands(MEAN_DEFAULT_BANDS);
    }
    this.html.querySelector(`#m-rastermanagement-${mode}-min`).value = defaults.min;
    this.html.querySelector(`#m-rastermanagement-${mode}-max`).value = defaults.max;
    this.html.querySelector(`#m-rastermanagement-${mode}-interpolation`).value = 'linear';
    this.html.querySelector(`#m-rastermanagement-${mode}-interpolation-base`).value = defaults.interpolationBase;
    this.html.querySelector(`#m-rastermanagement-${mode}-nodata`).value = '';
    this.toggleIndexInterpolationBase(mode);
    this.renderIndexRamp(mode, defaults.ramp);
  }

  /**
   * Restaura todos los formularios de rampas de color
   *
   * @private
   * @function
   */

  resetAllColorRampForms() {
    COLOR_RAMP_MODES.forEach((mode) => this.resetColorRampForm(mode));
  }

  /**
   * Obtiene las opciones de una combinación RGB desde el formulario
   *
   * @private
   * @function
   * @returns {object|null}
   */

  getRgbCombinationOptions() {
    const channelIds = ['r', 'g', 'b'];
    const bands = [];
    let hasInvalidBand = false;

    channelIds.forEach((channel) => {
      const band = parseInt(this.html.querySelector(`#m-rastermanagement-rgb-${channel}`).value, 10);
      if (Number.isNaN(band) || band < 0) {
        hasInvalidBand = true;
        return;
      }
      bands.push(band);
    });

    if (hasInvalidBand || bands.length !== 3) {
      IDEE.toast.warning(getValue('exception.invalidRgbBands'), null, 6000);
      return null;
    }

    const hasActiveBand = bands.some((band) => band > 0);
    if (!hasActiveBand) {
      IDEE.toast.warning(getValue('exception.invalidRgbBands'), null, 6000);
      return null;
    }

    const options = {
      bands,
    };

    const nodataInput = this.html.querySelector('#m-rastermanagement-rgb-nodata').value;
    if (nodataInput !== '') {
      const nodata = parseFloat(nodataInput);
      if (!Number.isNaN(nodata)) {
        options.nodata = nodata;
      }
    } else {
      options.nodata = RGB_DEFAULTS.nodata;
    }

    return options;
  }

  /**
   * Restaura el formulario de combinación RGB a los valores por defecto
   *
   * @private
   * @function
   */

  resetRgbCombinationForm() {
    this.html.querySelector('#m-rastermanagement-rgb-r').value = RGB_DEFAULTS.bands[0];
    this.html.querySelector('#m-rastermanagement-rgb-g').value = RGB_DEFAULTS.bands[1];
    this.html.querySelector('#m-rastermanagement-rgb-b').value = RGB_DEFAULTS.bands[2];
    this.html.querySelector('#m-rastermanagement-rgb-nodata').value = RGB_DEFAULTS.nodata;
  }

  /**
   * Obtiene las opciones del modo básico (filtros / nodata sin rampa)
   *
   * @private
   * @function
   * @returns {object|null}
   */

  getBasicOptions() {
    const options = {};
    const nodataInput = this.html.querySelector('#m-rastermanagement-basic-nodata').value;
    const bandInput = this.html.querySelector('#m-rastermanagement-basic-band').value;

    if (nodataInput !== '') {
      const nodata = parseFloat(nodataInput);
      if (Number.isNaN(nodata)) {
        IDEE.toast.warning(getValue('exception.invalidBasicOptions'), null, 6000);
        return null;
      }
      options.nodata = nodata;

      let band = IDEE.style.Raster.DEFAULT_OPTIONS.bands;
      if (bandInput !== '') {
        band = parseInt(bandInput, 10);
        if (Number.isNaN(band) || band < 1) {
          IDEE.toast.warning(getValue('exception.invalidBasicBand'), null, 6000);
          return null;
        }
      }
      options.bands = band;
    }

    return options;
  }

  /**
   * Restaura el formulario del modo básico
   *
   * @private
   * @function
   */

  resetBasicForm() {
    this.html.querySelector('#m-rastermanagement-basic-band').value = IDEE.style.Raster.DEFAULT_OPTIONS.bands;
    this.html.querySelector('#m-rastermanagement-basic-nodata').value = '';
  }

  /**
   * Aplica el estilo Raster a la capa seleccionada
   *
   * @public
   * @function
   * @api stable
   */

  applyStyle() {
    if (!this.selectedLayer) {
      IDEE.toast.warning(getValue('exception.selectLayer'), null, 6000);
      return;
    }

    const filters = this.getFilterValues();
    const activeIndex = this.getActiveSpectralIndex();
    const activeRampMode = this.getActiveColorRampMode();

    if (this.isSpectralIndicesTabActive() && activeIndex) {
      const indexOptions = this.getIndexOptions(activeIndex);
      if (!indexOptions) {
        return;
      }
      this.selectedLayer.setStyle(new IDEE.style.Raster({
        ...indexOptions,
        ...filters,
      }));
      return;
    }

    if (this.isColorRampsTabActive() && activeRampMode) {
      const rampOptions = this.getColorRampOptions(activeRampMode);
      if (!rampOptions) {
        return;
      }
      this.selectedLayer.setStyle(new IDEE.style.Raster({
        ...rampOptions,
        ...filters,
      }));
      return;
    }

    if (this.isRgbCombinationsTabActive()) {
      const rgbOptions = this.getRgbCombinationOptions();
      if (!rgbOptions) {
        return;
      }
      this.selectedLayer.setStyle(new IDEE.style.Raster({
        ...rgbOptions,
        ...filters,
      }));
      return;
    }

    if (this.isBasicTabActive()) {
      const basicOptions = this.getBasicOptions();
      if (!basicOptions) {
        return;
      }
      const options = {
        ...basicOptions,
        ...filters,
      };
      if (!IDEE.style.Raster.optionsHaveEffect(options)) {
        IDEE.toast.warning(getValue('exception.invalidBasicOptions'), null, 6000);
        return;
      }
      this.selectedLayer.setStyle(new IDEE.style.Raster(options));
      return;
    }

    const currentStyle = this.selectedLayer.getStyle();
    let options = { ...filters };

    if (currentStyle instanceof IDEE.style.Raster) {
      options = {
        ...currentStyle.getOptions(),
        ...filters,
      };
    }

    this.selectedLayer.setStyle(new IDEE.style.Raster(options));
  }

  /**
   * Elimina el estilo de la capa seleccionada
   *
   * @public
   * @function
   * @api stable
   */

  clearStyle() {
    if (!this.selectedLayer) {
      IDEE.toast.warning(getValue('exception.selectLayer'), null, 6000);
      return;
    }

    this.selectedLayer.clearStyle();
    this.resetFormToDefaults();
    this.suggestBandsFromSelectedLayer();
  }

  /**
   * Copia el estilo serializado de la capa seleccionada al portapapeles
   *
   * @public
   * @function
   * @api stable
   */

  copySerializedStyle() {
    if (!this.selectedLayer) {
      IDEE.toast.warning(getValue('exception.selectLayer'), null, 6000);
      return;
    }

    const style = this.selectedLayer.getStyle();
    if (!(style instanceof IDEE.style.Raster)) {
      IDEE.toast.warning(getValue('exception.noStyle'), null, 6000);
      return;
    }

    const text = style.serialize();
    const input = document.createElement('input');
    input.value = text;
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    document.body.removeChild(input);
    IDEE.dialog.info(getValue('clipboard'), getValue('serializedStyle'));
  }

  /**
   * Cambia la pestaña activa
   *
   * @private
   * @function
   * @param {Event} evt Evento de clic en una pestaña
   */

  toggleTabs(evt) {
    evt.stopPropagation();
    const tab = evt.target;
    if (!tab.classList.contains('m-rastermanagement-tab')) {
      return;
    }

    const tabs = tab.parentNode.children;
    for (let i = 0; i < tabs.length; i += 1) {
      const child = tabs.item(i);
      child.classList.remove('active');
      child.setAttribute('aria-selected', 'false');
    }
    tab.classList.add('active');
    tab.setAttribute('aria-selected', 'true');

    const tabsContent = this.html.querySelector('#m-rastermanagement-tabs-contents').children;
    for (let i = 0; i < tabsContent.length; i += 1) {
      const child = tabsContent.item(i);
      if (child.id !== `${tab.id}-content`) {
        child.classList.add('hidden');
      } else if (child.classList.contains('hidden')) {
        child.classList.remove('hidden');
      }
    }
  }
}

/**
 * Identificador del control.
 * @const
 * @type {string}
 * @public
 * @api stable
 */
StylesControl.NAME = 'StylesControl';
