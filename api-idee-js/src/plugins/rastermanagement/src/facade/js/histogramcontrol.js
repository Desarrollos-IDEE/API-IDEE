import {
  Chart,
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from 'chart.js';
import template from 'templates/histograms';
import HistogramControlImpl from 'impl/histogramcontrol';
import { getValue } from './i18n/language';
import {
  computeBandStats,
  createCalcHistogramRequest,
  getHistogramChartSeries,
} from './util/calchistogramservice';

Chart.register(
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
);

/**
 * Control de histogramas y estadísticas descriptivas de la capa seleccionada.
 */
export default class HistogramControl {
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
     * @private
     * @type {Array<object>}
     */
    this.bandHistograms_ = [];

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

    /**
     * Instancia Chart.js del histograma.
     * @private
     * @type {Chart|null}
     */
    this.chart_ = null;

    /**
     * Modo de ámbito: full | polygon | line
     * @private
     * @type {string}
     */
    this.geomMode_ = 'full';

    /**
     * GeoJSON seleccionado para enviar como geom.
     * @private
     * @type {object|null}
     */
    this.geom_ = null;

    /**
     * Feature de punto dibujado (muestreo local).
     * @private
     * @type {IDEE.Feature|null}
     */
    this.pointFeature_ = null;

    /**
     * Capa vectorial temporal de dibujo.
     * @private
     * @type {IDEE.layer.Vector|null}
     */
    this.drawLayer_ = null;

    /**
     * Implementación específica de la librería de mapas.
     * @private
     * @type {IDEE.impl.control.HistogramControl}
     */
    this.impl_ = new HistogramControlImpl();
  }

  /**
   * Inicializa la interfaz dentro del contenedor de histogramas.
   *
   * @param {HTMLElement} html Plantilla principal del control.
   */
  init(html) {
    const container = html.querySelector('#m-rastermanagement-histograms-container');
    const content = IDEE.template.compileSync(template, {
      vars: {
        selectLayerHint: getValue('histogramSelectLayer'),
        histogramCalculate: getValue('histogramCalculate'),
        histogramCancel: getValue('histogramCancel'),
        histogramLoading: getValue('histogramLoading'),
        histogramChart: getValue('histogramChart'),
        histogramScope: getValue('histogramScope'),
        histogramScopeFull: getValue('histogramScopeFull'),
        histogramDrawPoint: getValue('histogramDrawPoint'),
        histogramDrawPolygon: getValue('histogramDrawPolygon'),
        histogramDrawLine: getValue('histogramDrawLine'),
        histogramClearGeom: getValue('histogramClearGeom'),
        histogramDistance: getValue('histogramDistance'),
        histogramDistancePlaceholder: getValue('histogramDistancePlaceholder'),
        histogramPointValues: getValue('histogramPointValues'),
        band: getValue('band'),
        descriptiveStats: getValue('descriptiveStats'),
        statPixels: getValue('statPixels'),
        statMin: getValue('statMin'),
        statMax: getValue('statMax'),
        statMean: getValue('statMean'),
        statMedian: getValue('statMedian'),
        statStdDev: getValue('statStdDev'),
        statPercentile25: getValue('statPercentile25'),
        statPercentile75: getValue('statPercentile75'),
      },
    });
    container.innerHTML = '';
    container.appendChild(content);
    this.root_ = content;

    const bandSelect = this.root_.querySelector('#m-rastermanagement-histogram-band');
    bandSelect.addEventListener('change', () => {
      this.renderSelectedBandStats_();
    });

    const calculateBtn = this.root_.querySelector('#m-rastermanagement-histogram-calculate');
    calculateBtn.addEventListener('click', () => {
      this.load();
    });

    const cancelBtn = this.root_.querySelector('#m-rastermanagement-histogram-cancel');
    cancelBtn.addEventListener('click', () => {
      this.cancelCalculation_();
    });

    const modeButtons = this.root_.querySelectorAll('.m-rastermanagement-histogram-mode');
    modeButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        this.setGeomMode_(btn.dataset.mode);
      });
    });

    const clearGeomBtn = this.root_.querySelector('#m-rastermanagement-histogram-clear-geom');
    clearGeomBtn.addEventListener('click', () => {
      this.clearGeometry_(true);
    });

    this.loadIfVisible();
  }

  /**
   * Actualiza la vista de histogramas si la pestaña está visible,
   * sin lanzar el cálculo automáticamente.
   */
  loadIfVisible() {
    if (!this.isActive_()) {
      this.stopDrawing_();
      return;
    }
    this.resetView_();
  }

  /**
   * Solicita el histograma de la capa seleccionada.
   */
  load() {
    if (!this.root_ || this.isLoading_) {
      return;
    }

    this.cancelPendingRequest_();
    this.destroyChart_();
    this.bandHistograms_ = [];

    const layer = this.parentControl_.selectedLayer;
    if (!layer) {
      this.showState_('empty');
      return;
    }

    const urlRaster = layer.url;
    if (IDEE.utils.isNullOrEmpty(urlRaster)) {
      this.showError_(getValue('histogramNoUrl'));
      return;
    }

    if (this.geomMode_ !== 'full' && IDEE.utils.isNullOrEmpty(this.geom_)) {
      this.showError_(getValue('histogramNeedGeom'));
      return;
    }

    if (this.geomMode_ === 'point') {
      this.loadPointValues_();
      return;
    }

    const requestOptions = {};
    if (!IDEE.utils.isNullOrEmpty(this.geom_)) {
      requestOptions.geom = this.geom_;
    }
    if (this.geomMode_ === 'line') {
      const distance = this.getDistanceValue_();
      if (distance !== null) {
        requestOptions.distance = distance;
      }
    }

    const requestId = this.requestId_ + 1;
    this.requestId_ = requestId;
    this.isLoading_ = true;
    this.showState_('loading');

    const request = createCalcHistogramRequest(
      urlRaster,
      this.parentControl_.calcHistogramUrl,
      requestOptions,
    );
    this.activeRequest_ = request;

    request.promise
      .then((bandHistograms) => {
        if (requestId !== this.requestId_) {
          return;
        }
        this.isLoading_ = false;
        this.activeRequest_ = null;
        if (!bandHistograms.length) {
          this.showError_(getValue('histogramEmpty'));
          return;
        }
        this.bandHistograms_ = bandHistograms;
        this.populateBandSelector_();
        this.showState_('content');
        this.showPointResult_(false);
        this.renderSelectedBandStats_();
      })
      .catch((err) => {
        if (requestId !== this.requestId_) {
          return;
        }
        this.isLoading_ = false;
        this.activeRequest_ = null;
        // eslint-disable-next-line no-console
        console.error(err);
        this.showError_(getValue('histogramError'));
      });
  }

  /**
   * Cancela el cálculo en curso y vuelve al estado inicial.
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
    this.destroyChart_();
    this.bandHistograms_ = [];

    const layer = this.parentControl_.selectedLayer;
    if (!layer) {
      this.showState_('empty');
      return;
    }
    this.showState_('idle');
  }

  /**
   * Restablece la vista sin calcular.
   *
   * @private
   * @function
   */
  resetView_() {
    this.cancelPendingRequest_();
    this.isLoading_ = false;
    this.destroyChart_();
    this.bandHistograms_ = [];
    this.clearGeometry_(true);

    const layer = this.parentControl_.selectedLayer;
    if (!layer) {
      this.showState_('empty');
      return;
    }
    this.showState_('idle');
  }

  /**
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
   * Cambia el modo de ámbito del histograma.
   *
   * @private
   * @function
   * @param {string} mode full | polygon | line
   */
  setGeomMode_(mode) {
    this.geomMode_ = mode;
    const modeButtons = this.root_.querySelectorAll('.m-rastermanagement-histogram-mode');
    modeButtons.forEach((btn) => {
      if (btn.dataset.mode === mode) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    this.updateDistanceRow_();

    if (mode === 'full') {
      this.clearGeometry_(false);
      return;
    }
    if (mode === 'point') {
      this.startDrawing_('Point');
      return;
    }
    if (mode === 'polygon') {
      this.startDrawing_('Polygon');
      return;
    }
    if (mode === 'line') {
      this.startDrawing_('LineString');
    }
  }

  /**
   * Muestra u oculta el campo distance según el modo.
   *
   * @private
   * @function
   */
  updateDistanceRow_() {
    const distanceRow = this.root_.querySelector('#m-rastermanagement-histogram-distance-row');
    if (this.geomMode_ === 'line') {
      distanceRow.classList.remove('hidden');
      return;
    }
    distanceRow.classList.add('hidden');
  }

  /**
   * Lee la distancia de muestreo del input.
   *
   * @private
   * @function
   * @returns {number|null}
   */
  getDistanceValue_() {
    const input = this.root_.querySelector('#m-rastermanagement-histogram-distance');
    if (!input || IDEE.utils.isNullOrEmpty(input.value)) {
      return null;
    }
    const value = Number(input.value);
    if (!IDEE.utils.isNumber(value) || value <= 0) {
      return null;
    }
    return value;
  }

  /**
   * Inicia el dibujo de una geometría en el mapa.
   *
   * @private
   * @function
   * @param {string} type Polygon | LineString
   */
  startDrawing_(type) {
    if (!this.impl_.isDrawAvailable()) {
      this.showError_(getValue('histogramDrawUnavailable'));
      this.setGeomMode_('full');
      return;
    }

    this.clearGeometry_(false);
    this.ensureDrawLayer_();
    this.stopDrawing_();

    const map = this.parentControl_.map;
    this.impl_.startDraw(map, this.drawLayer_, type, (facadeFeature) => {
      this.drawLayer_.clear();
      this.drawLayer_.addFeatures([facadeFeature]);
      this.pointFeature_ = facadeFeature;
      this.geom_ = this.drawLayer_.toGeoJSON();
      this.stopDrawing_();
    });
  }

  /**
   * Obtiene los valores del ráster en el punto dibujado.
   *
   * @private
   * @function
   */
  loadPointValues_() {
    const layer = this.parentControl_.selectedLayer;
    if (!layer || typeof layer.getData !== 'function') {
      this.showError_(getValue('histogramDrawUnavailable'));
      return;
    }

    const map = this.parentControl_.map;
    let feature = this.pointFeature_;
    if (!feature && this.drawLayer_) {
      const features = this.drawLayer_.getFeatures();
      if (features.length > 0) {
        feature = features[0];
        this.pointFeature_ = feature;
      }
    }
    if (!feature) {
      this.showError_(getValue('histogramNeedGeom'));
      return;
    }

    const geometry = feature.getGeometry();
    if (!geometry || geometry.type !== 'Point' || !geometry.coordinates) {
      this.showError_(getValue('histogramNeedGeom'));
      return;
    }

    const data = this.impl_.getRasterDataAtCoordinate(map, layer, geometry.coordinates);
    if (!data || data.length === 0) {
      this.showError_(getValue('histogramPointNoData'));
      return;
    }

    const values = [];
    const attributes = {};
    for (let i = 0; i < data.length; i += 1) {
      const bandValue = data[i];
      values.push(bandValue);
      attributes[`band_${i + 1}`] = bandValue;
    }
    feature.setAttributes(attributes);

    this.destroyChart_();
    this.bandHistograms_ = [];
    this.renderPointValues_(values);
    this.showState_('content');
    this.showPointResult_(true);
  }

  /**
   * Muestra u oculta el resultado de punto frente al histograma.
   *
   * @private
   * @function
   * @param {boolean} isPointResult true para mostrar valores de punto.
   */
  showPointResult_(isPointResult) {
    const pointResult = this.root_.querySelector('#m-rastermanagement-histogram-point-result');
    const chartSection = this.root_.querySelector('#m-rastermanagement-histogram-chart-section');
    const bandRow = this.root_.querySelector('#m-rastermanagement-histogram-band-row');
    if (isPointResult) {
      pointResult.classList.remove('hidden');
      chartSection.classList.add('hidden');
      bandRow.classList.add('hidden');
      return;
    }
    pointResult.classList.add('hidden');
    chartSection.classList.remove('hidden');
  }

  /**
   * Pinta los valores de banda del punto muestreado.
   *
   * @private
   * @function
   * @param {Array<number>} values Valores por banda.
   */
  renderPointValues_(values) {
    const container = this.root_.querySelector('#m-rastermanagement-histogram-point-values');
    container.innerHTML = '';
    for (let i = 0; i < values.length; i += 1) {
      const item = document.createElement('div');
      item.className = 'm-rastermanagement-histogram-point-value';

      const numberEl = document.createElement('span');
      numberEl.className = 'm-rastermanagement-histogram-point-value-number';
      numberEl.innerText = this.formatNumber_(values[i], 2);

      const labelEl = document.createElement('span');
      labelEl.className = 'm-rastermanagement-histogram-point-value-label';
      labelEl.innerText = `${getValue('histogramPointBand')} ${i + 1}`;

      item.appendChild(numberEl);
      item.appendChild(labelEl);
      container.appendChild(item);
    }
  }

  /**
   * Crea la capa vectorial de dibujo si no existe.
   *
   * @private
   * @function
   */
  ensureDrawLayer_() {
    if (this.drawLayer_) {
      return;
    }
    this.drawLayer_ = new IDEE.layer.Vector({
      name: 'rastermanagement_histogram_geom',
      legend: 'Histogram geometry',
      extract: false,
    });
    this.drawLayer_.displayInLayerSwitcher = false;
    this.parentControl_.map.addLayers(this.drawLayer_);
  }

  /**
   * Detiene la interacción de dibujo activa.
   *
   * @private
   * @function
   */
  stopDrawing_() {
    const map = this.parentControl_.map;
    this.impl_.stopDraw(map);
  }

  /**
   * Elimina la geometría dibujada.
   *
   * @private
   * @function
   * @param {boolean} resetMode Si true, vuelve al modo "toda la capa".
   */
  clearGeometry_(resetMode) {
    this.stopDrawing_();
    this.geom_ = null;
    this.pointFeature_ = null;
    if (this.drawLayer_) {
      this.drawLayer_.clear();
    }
    if (resetMode) {
      this.geomMode_ = 'full';
      if (this.root_) {
        const modeButtons = this.root_.querySelectorAll('.m-rastermanagement-histogram-mode');
        modeButtons.forEach((btn) => {
          if (btn.dataset.mode === 'full') {
            btn.classList.add('active');
          } else {
            btn.classList.remove('active');
          }
        });
        const distanceInput = this.root_.querySelector('#m-rastermanagement-histogram-distance');
        if (distanceInput) {
          distanceInput.value = '';
        }
        this.updateDistanceRow_();
      }
    }
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

    const histogramsTab = html.querySelector('#m-rastermanagement-histograms-tab');
    return histogramsTab.classList.contains('active');
  }

  /**
   * @private
   * @function
   * @param {'empty'|'idle'|'loading'|'content'|'error'} state Estado visible.
   * @param {string} [errorMessage] Mensaje de error opcional.
   */
  showState_(state, errorMessage) {
    const emptyEl = this.root_.querySelector('#m-rastermanagement-histogram-empty');
    const actionsEl = this.root_.querySelector('#m-rastermanagement-histogram-actions');
    const loadingRow = this.root_.querySelector('#m-rastermanagement-histogram-loading-row');
    const errorEl = this.root_.querySelector('#m-rastermanagement-histogram-error');
    const contentEl = this.root_.querySelector('#m-rastermanagement-histogram-content');

    emptyEl.classList.add('hidden');
    actionsEl.classList.add('hidden');
    loadingRow.classList.add('hidden');
    errorEl.classList.add('hidden');
    contentEl.classList.add('hidden');

    if (state === 'empty') {
      emptyEl.classList.remove('hidden');
    } else if (state === 'idle') {
      actionsEl.classList.remove('hidden');
    } else if (state === 'loading') {
      loadingRow.classList.remove('hidden');
    } else if (state === 'content') {
      contentEl.classList.remove('hidden');
      actionsEl.classList.remove('hidden');
    } else if (state === 'error') {
      errorEl.innerText = errorMessage;
      errorEl.classList.remove('hidden');
      actionsEl.classList.remove('hidden');
    }
  }

  /**
   * @private
   * @function
   * @param {string} message Mensaje de error.
   */
  showError_(message) {
    this.destroyChart_();
    this.showState_('error', message);
  }

  /**
   * @private
   * @function
   */
  populateBandSelector_() {
    const bandRow = this.root_.querySelector('#m-rastermanagement-histogram-band-row');
    const bandSelect = this.root_.querySelector('#m-rastermanagement-histogram-band');

    while (bandSelect.firstChild) {
      bandSelect.removeChild(bandSelect.firstChild);
    }

    this.bandHistograms_.forEach((bandHistogram) => {
      const option = document.createElement('option');
      option.value = String(bandHistogram.band);
      option.innerText = `${getValue('band')} ${bandHistogram.band}`;
      bandSelect.appendChild(option);
    });

    if (this.bandHistograms_.length > 1) {
      bandRow.classList.remove('hidden');
    } else {
      bandRow.classList.add('hidden');
    }
  }

  /**
   * @private
   * @function
   */
  renderSelectedBandStats_() {
    const bandSelect = this.root_.querySelector('#m-rastermanagement-histogram-band');
    const selectedBand = Number(bandSelect.value);
    let bandHistogram = this.bandHistograms_[0];
    for (let i = 0; i < this.bandHistograms_.length; i += 1) {
      if (this.bandHistograms_[i].band === selectedBand) {
        bandHistogram = this.bandHistograms_[i];
        break;
      }
    }

    const stats = computeBandStats(bandHistogram);
    if (!stats) {
      this.showError_(getValue('histogramEmpty'));
      return;
    }

    this.setStatValue_('pixels', stats.pixels, 0);
    this.setStatValue_('min', stats.min, 0);
    this.setStatValue_('max', stats.max, 0);
    this.setStatValue_('mean', stats.mean, 1);
    this.setStatValue_('median', stats.median, 1);
    this.setStatValue_('stddev', stats.stdDev, 1);
    this.setStatValue_('p25', stats.percentile25, 1);
    this.setStatValue_('p75', stats.percentile75, 1);
    this.renderChart_(bandHistogram);
  }

  /**
   * Dibuja o actualiza la gráfica del histograma.
   *
   * @private
   * @function
   * @param {object} bandHistogram Datos de histograma de la banda.
   */
  renderChart_(bandHistogram) {
    const series = getHistogramChartSeries(bandHistogram);
    if (!series) {
      this.destroyChart_();
      return;
    }

    const canvas = this.root_.querySelector('#m-rastermanagement-histogram-chart');
    if (!canvas) {
      return;
    }

    const labels = [];
    for (let i = 0; i < series.labels.length; i += 1) {
      labels.push(this.formatNumber_(series.labels[i], 1));
    }

    if (this.chart_) {
      this.chart_.data.labels = labels;
      this.chart_.data.datasets[0].data = series.counts;
      this.chart_.update();
      return;
    }

    this.chart_ = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: getValue('statPixels'),
          data: series.counts,
          backgroundColor: 'rgba(113, 167, 211, 0.75)',
          borderColor: '#71a7d3',
          borderWidth: 1,
          borderSkipped: false,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            callbacks: {
              title(tooltipItems) {
                if (!tooltipItems.length) {
                  return '';
                }
                return tooltipItems[0].label;
              },
            },
          },
        },
        scales: {
          x: {
            title: {
              display: true,
              text: getValue('histogramAxisX'),
            },
            ticks: {
              maxRotation: 0,
              autoSkip: true,
              maxTicksLimit: 8,
            },
            grid: {
              display: false,
            },
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: getValue('histogramAxisY'),
            },
            ticks: {
              precision: 0,
            },
          },
        },
      },
    });
  }

  /**
   * Destruye la instancia de Chart.js si existe.
   *
   * @private
   * @function
   */
  destroyChart_() {
    if (!this.chart_) {
      return;
    }
    this.chart_.destroy();
    this.chart_ = null;
  }

  /**
   * @private
   * @function
   * @param {string} statId Identificador del valor estadístico.
   * @param {number} value Valor numérico.
   * @param {number} decimals Decimales a mostrar.
   */
  setStatValue_(statId, value, decimals) {
    const statEl = this.root_.querySelector(`#m-rastermanagement-histogram-stat-${statId}`);
    if (!IDEE.utils.isNumber(value) || Number.isNaN(value)) {
      statEl.innerText = '-';
      return;
    }
    statEl.innerText = this.formatNumber_(value, decimals);
  }

  /**
   * @private
   * @function
   * @param {number} value Valor numérico.
   * @param {number} decimals Decimales a mostrar.
   * @returns {string}
   */
  formatNumber_(value, decimals) {
    let lang = 'es-ES';
    if (IDEE.language.getLang() === 'en') {
      lang = 'en-US';
    }
    return value.toLocaleString(lang, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }
}
