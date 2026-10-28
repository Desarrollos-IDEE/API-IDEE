/**
 * @module IDEE/control/Timeline
 */
import 'assets/css/fonts';
import 'assets/css/controls/timeline';
import timelineTemplate from 'templates/timeline';
import myhelp from 'templates/timelineHelp';
import timelineDinamicTemplate from 'templates/timelineDinamic';
import TimelineImpl from 'impl/control/Timeline';
import WMS from 'IDEE/layer/WMS';
import WMTS from 'IDEE/layer/WMTS';
import Vector from 'IDEE/layer/Vector';
import * as LayerType from 'IDEE/layer/Type';
import FilterFunction from 'IDEE/filter/Function';
import * as EventType from 'IDEE/event/eventtype';
import {
  isArray, isBoolean, isNullOrEmpty, isObject, isString, isUndefined,
} from '../util/Utils';
import Control from './Control';
import { getValue } from '../i18n/language';
import Exception from '../exception/exception';
import * as Position from '../ui/position';
import { compileSync } from '../util/Template';

const typesTimeline = ['absoluteSimple', 'absolute', 'relative'];
const EMPTY_LAYER_ID = '__timeline_empty_layer__';

/**
 * @typedef {Object} module:IDEE/control/Timeline~Options
 * @api
 * @property {Array|String} intervals Intervalos de tiempo. (obligatorio)
 * Puede ser un array de objetos con atributos [name, tag, service] o una cadena JSON.
 * Por defecto se utilizan intervalos de ejemplo con capas WMS del IGN.
 * @property {String} [position] Posición del control en el mapa.
 * @property {String} [tooltip] Texto del tooltip para el control.
 * @property {String} [title] Texto del título para el panel de este control.
 * Por defecto se asignará {@link tooltip}.
 * @property {Number} [order] Accesibilidad, z-index del control.
 * @property {Boolean} [collapsible] Indica si el control puede colapsarse.
 * @property {Boolean} [collapsed] Indica si el control está colapsado.
 * @property {Boolean} [animation] Indica si la línea de tiempo se anima automáticamente.
 * @property {Number} [speed] Velocidad de la animación en segundos (rango: 1-100).
 * @property {Number} [speedDate] Velocidad de la animación para timelines dinámicos.
 * @property {String} [paramsDate] Unidad de tiempo para los pasos (posibles valores:
 * 'sec', 'min', 'hrs', 'day', 'mos', 'yr').
 * @property {Number} [stepValue] Valor del paso para la navegación temporal.
 * @property {String} [snapMode] Activa el modo "snap" aproximación de la barra
 * de deslizamiento en caso de ser definido, puede tener los siguientes valores
 * 'bySpep', 'byStepIntersection'
 * @property {String} [sizeWidthDinamic] Ancho dinámico para el control.
 * Posibles valores: '', 'sizeWidthDinamic_medium' or 'sizeWidthDinamic_big'.
 * @property {String} [formatMove] Formato de movimiento: 'discrete' o 'continuous'.
 * @property {String} [formatValue] Formato de valores:
 * 'linear', 'logarithmic', 'exponential'.
 * @property {String} [timelineType] Tipo de timeline:
 * 'absoluteSimple', 'absolute', 'relative'.
 * @property {Object} [vendorOptions] Opciones específicas para la implementación.
 */

/**
 * @classdesc
 * Hereda de {@link module:IDEE/control/Control|Control}.
 * Control de línea de tiempo que permite visualizar y controlar datos temporales en el mapa.
 * Proporciona una interfaz para reproducir animaciones y navegar por diferentes
 * momentos en el tiempo.
 * Soporta diferentes tipos de timeline: absoluteSimple, absolute y relative.
 *
 * @property {Array|String} intervals Intervalos temporales.
 * Se admiten dos formatos:
 * Formato clásico:
 * [
 *   [name, tag, service]
 * ]
 *
 * Formato extendido:
 * [
 *   {
 *     id,
 *     init,
 *     end,
 *     layer,
 *     attributeParam,
 *     grupo,
 *     equalsTimeLine
 *   }
 * ]
 *
 * El formato extendido puede utilizarse para cualquier timelineType.
 * Se mantiene compatibilidad completa con el formato clásico.
 * @property {String} [position='left'] Posición del control en el mapa.
 * @property {Boolean} [collapsible=true] Indica si el control puede colapsarse.
 * @property {Boolean} [collapsed=true] Indica si el control está colapsado.
 * Depende de collapsible, solo se aplica si collapsible es true.
 * @property {String} [tooltip] Texto de información sobre la herramienta para el control.
 * Por defecto la traducción al idioma.
 * @property {String} [title] Texto del título para el panel de este control.
 * Por defecto se asignará {@link tooltip}.
 * @property {Number} [order=0] Accesibilidad, z-index del control.
 * @property {Boolean} [animation=true] Indica si la animación de la línea de tiempo está
 * activada (true) o desactivada (false).
 * @property {Number} [speed=1] Velocidad de reproducción de la animación en segundos,
 * con rango de 1 a 100.
 * @property {Number} [speedDate=2] Velocidad de la animación específica para timelines dinámicos.
 * @property {String} [paramsDate='yr'] Unidad de tiempo para los pasos de navegación
 * (posibles valores: 'sec', 'min', 'hrs', 'day', 'mos', 'yr').
 * @property {Number} [stepValue=1] Valor del paso para la navegación temporal,
 * determina el incremento en cada paso.
 * @property {String} [snapMode] Activa el modo "snap" aproximación de la barra
 * de deslizamiento en caso de ser definido, puede tener los siguientes valores
 * 'bySpep', 'byStepIntersection'
 * @property {String} [sizeWidthDinamic=''] Ancho dinámico para el control,
 * permite ajustar el tamaño basado en el contenido.
 * @property {String} [formatMove='continuous'] Formato de movimiento de la animación:
 * 'discrete' para movimientos discretos o 'continuous' para continuos.
 * @property {String} [formatValue='linear'] Formato de valores para la escala:
 * 'linear', 'logarithmic', 'exponential'.
 * @property {String} [timelineType=false] Tipo de timeline a utilizar:
 * 'absoluteSimple', 'absolute', 'relative'. Debe ser uno de los tipos soportados.
 * @property {Boolean} [running=false] Indica si la animación está actualmente ejecutándose.
 * @property {Object} [date] Objeto que contiene las fechas inicial y final para el timeline.
 * @property {Number} [date.init=0] Fecha inicial en formato timestamp.
 * @property {Number} [date.end=0] Fecha final en formato timestamp.
 * @property {Object} [allLayersDinamic] Configuración de capas dinámicas para timelines avanzados.
 * @property {Array} [allLayersDinamic.groupLayer=[]] Capas agrupadas para el timeline dinámico.
 * @property {Array} [allLayersDinamic.noGroupLayer=[]] Capas no agrupadas para el timeline
 * dinámico.
 *
 * @api
 * @extends {module:IDEE/control/Control}
 */
class Timeline extends Control {
  get translation() {
    return getValue('timeline');
  }

  /**
   * Constructor principal de la clase. This classs create one facade control
   * object which has an implementation Object
   *
   * @constructor
   * @param {module:IDEE/control/Timeline~Options} options Opciones del control.
   * @example
   * const control = new IDEE.control.Timeline({
   *  "timelineType": "absoluteSimple",
   *   "intervals": [
   *        [
   *            "NACIONAL 1981-1986",
   *            "1986",
   *            "WMS*NACIONAL_1981-1986*https://www.ign.es/wms/pnoa-historico*NACIONAL_1981-1986"
   *        ],
   *        [
   *            "OLISTAT",
   *            "1998",
   *            "WMS*OLISTAT*https://www.ign.es/wms/pnoa-historico*OLISTAT"
   *        ],
   *        [
   *            "SIGPAC",
   *            "2003",
   *            "WMS*SIGPAC*https://www.ign.es/wms/pnoa-historico*SIGPAC"
   *        ],
   *        [
   *            "PNOA 2004",
   *            "2004",
   *            "WMS*pnoa2004*https://www.ign.es/wms/pnoa-historico*pnoa2004"
   *        ],
   *        [
   *            "PNOA 2005",
   *            "2005",
   *            "WMS*pnoa2005*https://www.ign.es/wms/pnoa-historico*pnoa2005"
   *        ],
   *        [
   *            "PNOA 2006",
   *            "2006",
   *            "WMS*pnoa2006*https://www.ign.es/wms/pnoa-historico*pnoa2006"
   *        ],
   *        [
   *            "PNOA 2010",
   *            "2010",
   *            "WMS*pnoa2010*https://www.ign.es/wms/pnoa-historico*pnoa2010"
   *        ]
   *    ]
   * });
   * @api
   */
  constructor(options = {}) {
    if (isUndefined(TimelineImpl) || (isObject(TimelineImpl)
      && isNullOrEmpty(Object.keys(TimelineImpl)))) {
      Exception(getValue('exception').timeline_method);
    }

    // implementation of this control
    const impl = new TimelineImpl();

    // calls the super constructor
    super(Timeline.NAME, impl, options);

    /**
     * Animation of the timeline
     * Value: true / false
     * @type {boolean}
     */
    this.animation = options.animation;
    if (this.animation === undefined) this.animation = true;

    /**
    * Speed of animation
    * Value: 1 - 100
    * @type {number}
    */
    this.speed = parseFloat(options.speed) || 1;

    /**
     *@type { Number }
     */
    this.speedDate = (options.speedDate) ? options.speedDate : 2;

    /**
     *@type { String }
     */
    this.paramsDate = (options.paramsDate) ? options.paramsDate : 'yr';

    /**
     *@type { Number }
     */
    this.stepValue = (options.stepValue) ? options.stepValue : 1;

    /**
     *@type {'bySpep' | 'byStepIntersection'}
     */
    this.snapMode = options.snapMode === 'bySpep' || options.snapMode === 'byStepIntersection'
      ? options.snapMode
      : undefined;

    /**
     *@type { String }
     */
    this.sizeWidthDinamic = (options.sizeWidthDinamic) ? options.sizeWidthDinamic : '';

    /**
     *@type { String }
     */
    this.formatMove = (options.formatMove === 'discrete') ? 'discrete' : 'continuous';

    /**
     *@type { String }
     */
    this.formatValue = (options.formatValue) ? options.formatValue : 'linear';

    /**
     *@type { String }
     */
    this.timelineType = options.timelineType ?? false;

    /**
     * Intervals
     * Value: Array with each interval attributes [name, tag, service]
     * @property {String} intervals
     */
    this.intervals = [];
    this.intervalsGrouped = {};

    let rawIntervals = options.intervals;

    if (isString(rawIntervals)) {
      rawIntervals = JSON.parse(
        rawIntervals
          .replace(/!!/g, '[')
          .replace(/¡¡/g, ']')
          .replace(/\u00a0/g, ' '),
      );
    }

    if (isArray(rawIntervals)) {
      this.intervals = this.normalizeIntervals(rawIntervals);

      if (this.isDynamicTimeline()) {
        this.intervals = this.intervals.map((interval) => {
          const normalizedInterval = { ...interval };

          const [init, end] = this.transformTime_NumbToDate(
            normalizedInterval.init,
            normalizedInterval.end,
          );

          normalizedInterval.init = init;
          normalizedInterval.end = end;

          return normalizedInterval;
        });
      } else {
        this.intervalsGrouped = this.buildGroupIntervals(this.intervals);
      }
    }

    this.position = Position.isValid(options.position) ? options.position : Position.LEFT;

    this.tooltip = isString(options.tooltip) ? options.tooltip : this.translation.tooltip ?? '';

    this.title = isString(options.title) ? options.title : this.tooltip;

    this.collapsible = isBoolean(options.collapsible) ? options.collapsible : true;

    this.collapsed = (isBoolean(options.collapsed) && this.collapsible) ? options.collapsed : true;

    this.running = false;

    this.date = {
      init: 0,
      end: 0,
    };

    this.allLayersDinamic = {
      groupLayer: [],
      noGroupLayer: [],
    };
  }

  /**
  * This function creates the view
  *
  * @public
  * @function
  * @param {IDEE.Map} map to add the control
  * @returns {Promise} Plantilla HTML.
  * @api stable
  */
  createView(map) {
    return new Promise((success, fail) => {
      const isType = this.isDynamicTimeline();
      let step = 'any';
      if (this.snapMode === 'bySpep') {
        step = 1;
      } else if (this.snapMode === 'byStepIntersection') {
        step = 0.5;
      }
      const template = compileSync((isType) ? timelineDinamicTemplate : timelineTemplate, {
        vars: {
          translations: {
            title: this.title ?? this.translation.title,
            play: this.translation.play,
            initValue: this.translation.initValue,
            endValue: this.translation.endValue,
          },
          sizeWidthDinamic: this.sizeWidthDinamic,
          inputRange: {
            step,
          },
        },
      });
      this.setElement(template);

      if (isType) {
        this.createtimeLineDinamic();
        success(this.getElement());
      } else {
        const intervals = [];
        Object.entries(this.intervalsGrouped).forEach(([key, intervalsByYear], k) => {
          const interval = intervalsByYear.find((iByYear) => iByYear.selected);
          let layer;
          intervalsByYear.forEach((iByYear, i) => {
            const layerByYear = this.transformToLayers(iByYear.service);
            if (i === 0) layer = layerByYear;
            const copy = this.getMapLayer(layerByYear);
            if (copy !== undefined) {
              this.map.removeLayers(copy);
            }
            this.intervalsGrouped[key][i].layer = layerByYear;
            this.map.addLayers(layerByYear);
          });
          const iv = {
            number: k,
            name: interval.name,
            tag: interval.year,
            service: layer,
          };
          intervals.push(iv);
        });
        this.intervals = intervals;

        this.intervals.forEach((interval, k) => {
          const tag = document.createElement('div');
          if (k !== 0 && k !== this.intervals.length - 1 && k
            !== parseInt(this.intervals.length / 2, 10)) {
            tag.dataset.tag = '';
            tag.dataset.tag = '';
          } else {
            tag.dataset.tag = interval.tag;
          }
          this.getElement().querySelector('.slider-tags').append(tag);
        });
        this.getElement().querySelector('.div-m-timeline-panel').style.setProperty('--num', this.intervals.length);
        const slider = this.getElement().querySelector('#input-slider');
        slider.setAttribute('max', intervals.length - 1);
        slider.addEventListener('input', (e) => this.changeSlider(slider));
        slider.addEventListener('change', (e) => {
          this.getPlayTimeButton().classList.add('g-cartografia-control-siguiente');
          this.getPlayTimeButton().classList.remove('g-cartografia-control-pausa');
          document.querySelector('.div-m-timeline-slider').style.setProperty('--opacity', '0');
          clearTimeout(this.running);
          this.running = false;
        });
        const play = this.getElement().querySelector('#m-timeline-play');
        play.addEventListener('click', (e) => this.playTimeline(false));
        success(this.getElement());
      }
    });
  }

  /**
   * Este método añade el control al mapa.
   *
   * @public
   * @function
   * @param {IDEE.Map} map Mapa.
   * @api
   * @export
   */
  addTo(map) {
    if (!this.timelineType || !typesTimeline.includes(this.timelineType)) {
      throw new Error('Add correct typesTimeline, (absoluteSimple', 'absolute', 'relative)');
    }
    if (this.timelineType === 'absolute' || this.timelineType === 'relative') {
      this.intervals = this.intervals.filter(({ layer }) => {
        if (typeof layer === 'string') {
          return !layer.includes('GenericRaster') || !layer.includes('GenericVector');
        }

        return layer.type !== 'GenericRaster' || layer.type !== 'GenericVector';
      });
    } else {
      this.intervals = this.intervals.filter((layer) => {
        if (typeof layer === 'string') {
          return !layer.includes('GenericRaster') || !layer.includes('GenericVector');
        }

        return layer.type !== 'GenericRaster' || layer.type !== 'GenericVector';
      });
    }
    super.addTo(map);
  }

  /**
  * Indica si el timeline actual es dinámico.
  *
  * @private
  * @returns {Boolean}
  */
  isDynamicTimeline() {
    return ['absolute', 'relative'].includes(this.timelineType);
  }

  /**
  * Normaliza un intervalo para timelines dinámicos.
  *
  * @private
  * @param {Array|Object} interval Intervalo.
  * @param {Number} index Índice del intervalo.
  * @returns {Object}
  */
  normalizeDynamicInterval(interval, index) {
    if (isArray(interval)) {
      const [name, tag, service] = interval;

      return {
        id: `${index}`,
        init: this.normalizeInitDate(tag),
        end: this.normalizeEndDate(tag),
        layer: service,
        name,
      };
    }

    if (isObject(interval)) {
      return {
        ...interval,
        id: interval.id ?? `${index}`,
      };
    }

    return interval;
  }

  /**
  * Normaliza una fecha inicial.
  *
  * @private
  * @param {String|Number} value Valor temporal.
  * @returns {String|Number}
  */
  normalizeInitDate(value) {
    if (typeof value === 'number') {
      return new Date(value).toISOString();
    }

    if (typeof value === 'string' && /^\d{4}$/.test(value)) {
      return `${value}-01-01T00:00:00.000Z`;
    }

    return value;
  }

  /**
   * Normaliza una fecha final.
   *
   * @private
   * @param {String|Number} value Valor temporal.
   * @returns {String|Number}
   */
  normalizeEndDate(value) {
    if (typeof value === 'number') {
      return new Date(value).toISOString();
    }

    if (typeof value === 'string' && /^\d{4}$/.test(value)) {
      return `${value}-12-31T23:59:59.999Z`;
    }

    return value;
  }

  /**
  * Normaliza un intervalo para timelines simples.
  *
  * @private
  * @param {Array|Object} interval Intervalo.
  * @param {Number} index Índice del intervalo.
  * @returns {Array}
  */
  normalizeSimpleInterval(interval, index) {
    let normalizedInterval = interval;
    if (!isArray(interval) && isObject(interval)) {
      const {
        id,
        init,
        end,
        layer,
        name,
        tag,
      } = interval;
      normalizedInterval = [
        name ?? this.getLayerName(layer, id ?? `${index}`),
        tag ?? this.getIntervalTag(init, end),
        layer,
      ];
    }

    return normalizedInterval;
  }

  /**
  * Normaliza los intervalos recibidos manteniendo compatibilidad
  * con los formatos históricos y permitiendo el formato extendido
  * para todos los tipos de Timeline.
  *
  * @private
  * @param {Array} intervals Intervalos originales.
  * @returns {Array} Intervalos normalizados.
  */
  normalizeIntervals(intervals = []) {
    let normalizedInterval = [];
    if (isArray(intervals)) {
      if (this.isDynamicTimeline()) {
        normalizedInterval = intervals
          .map((interval, index) => this.normalizeDynamicInterval(interval, index));
      } else {
        normalizedInterval = intervals
          .map((interval, index) => this.normalizeSimpleInterval(interval, index));
      }
    }
    return normalizedInterval;
  }

  /**
  * Obtiene un nombre representativo para una capa.
  *
  * @private
  * @param {Object|String} layer Capa.
  * @param {String} fallback Valor alternativo.
  * @returns {String}
  */
  getLayerName(layer, fallback = '') {
    if (typeof layer === 'string') {
      if (layer.includes('*')) {
        const [, legend] = layer.split('*');
        return legend || fallback;
      }

      return layer;
    }

    return layer?.legend
      ?? layer?.name
      ?? layer?.getImpl?.()?.legend
      ?? fallback;
  }

  /**
  * Obtiene la etiqueta temporal de un intervalo.
  *
  * Para compatibilidad con absoluteSimple se utiliza preferentemente
  * el año final del intervalo.
  *
  * @private
  * @param {String|Number} init Fecha inicial.
  * @param {String|Number} end Fecha final.
  * @returns {String}
  */
  getIntervalTag(init, end) {
    const date = end ?? init;

    if (!date) {
      return '';
    }

    const parsedDate = new Date(date);

    if (!Number.isNaN(parsedDate.getTime())) {
      return `${parsedDate.getUTCFullYear()}`;
    }

    return `${date}`;
  }

  /**
  * Agrupa las capas por año.
  *
  * @private
  * @param {Array} intervals
  * @returns {Object}
  */
  buildGroupIntervals(intervals = []) {
    const intervalsGrouped = {};

    intervals.forEach((interval, i) => {
      const [name, year, service] = interval;

      if (isNullOrEmpty(intervalsGrouped[year])) intervalsGrouped[year] = [];

      intervalsGrouped[year].push({
        id: `${name}_${i}`,
        name,
        year,
        service,
        selected: intervalsGrouped[year].length === 0,
        originalInterval: interval,
      });
    });

    return intervalsGrouped;
  }

  /**
  * Renderiza las opciones del selector de capas dependiendo del paso
  *
  * @param {object} interval Intervalo afectado
  * @param {number} intervalIndex Índice del intervalo
  * @param {string} selectorClass Nombre de la clase del selector al que se apunta
  * @returns {void}
  */
  renderLayerSelector(
    interval,
    intervalIndex,
    selectorClass,
  ) {
    const year = interval.tag;
    /** @type {HTMLSelectElement} */
    const selector = this.getElement().querySelector(selectorClass);
    selector.innerHTML = '';
    if (this.animation || interval.name !== '') {
      selector.style.display = 'block';
      selector.style.visibility = 'visible';
    }

    const emptyOption = document.createElement('option');
    emptyOption.value = EMPTY_LAYER_ID;
    emptyOption.textContent = this.translation.none;
    emptyOption.selected = interval.service === null;
    selector.appendChild(emptyOption);

    this.intervalsGrouped[year].forEach((intervalGroup) => {
      const option = document.createElement('option');
      option.value = intervalGroup.id;
      option.textContent = intervalGroup.name;
      option.selected = intervalGroup.selected;
      selector.appendChild(option);
    });
    selector.disabled = typeof this.running === 'boolean' && this.running;

    selector.onchange = (evt) => {
      const { value: intervalGroupId } = evt.target;
      const intervalsByYear = this.intervalsGrouped[year];

      if (intervalGroupId === EMPTY_LAYER_ID) {
        intervalsByYear.forEach((intervalByYear) => {
          const mapLayer = this.getMapLayer(intervalByYear.layer);

          if (mapLayer) {
            mapLayer.setVisible(false);
          }

          // eslint-disable-next-line no-param-reassign
          intervalByYear.selected = false;
        });

        this.intervals[intervalIndex] = {
          ...this.intervals[intervalIndex],
          service: null,
          name: '',
        };

        return;
      }

      intervalsByYear.forEach((intervalByYear, layerIndex) => {
        const mapLayer = this.getMapLayer(intervalByYear.layer);
        const isSelected = intervalByYear.id === intervalGroupId;

        if (mapLayer) {
          mapLayer.setVisible(isSelected);
        }

        if (isSelected) {
          this.intervals[intervalIndex] = {
            ...this.intervals[intervalIndex],
            service: intervalByYear.layer,
            name: intervalByYear.name,
          };
        }

        this.intervalsGrouped[year][layerIndex].selected = isSelected;
      });
    };
  }

  /**
    * This function transform string to IDEE.Layer
    *
    * @public
    * @function
    * @api stable
    * @param {string | object}
    * @return {Boolean}
    */
  isValidLayer(layer) {
    return isObject(layer) && (layer.type === 'WMTS' || layer.type === 'WMS');
  }

  /**
   * Transform StringLayers to api-idee IDEE.Layer
   *
   * WMTS*http://www.ign.es/wmts/pnoa-ma?*OI.OrthoimageCoverage*EPSG:25830*PNOA
   * WMS*IGN*http://www.ign.es/wms-inspire/ign-base*IGNBaseTodo
   *
   * @public
   * @function
   * @api stable
   * @param {string}
   * @return {object}
   */
  transformToLayers(layer) {
    let newLayer = null;
    if (typeof layer === 'string') {
      if (layer.includes('*')) {
        // eslint-disable-next-line no-unused-vars
        const [serviceLayer, layerName, urlLayer, layerNameInternal] = layer.split('*');
        if (serviceLayer.toUpperCase() === 'WMS') {
          newLayer = new WMS({
            url: urlLayer,
            name: layerNameInternal,
          });
        } else if (serviceLayer.toUpperCase() === 'WMTS') {
          newLayer = new WMTS({
            url: urlLayer,
            name: layerNameInternal,
          });
        }
      } else {
        const layerByName = this.map.getLayers().find((l) => layer.includes(l.name));
        newLayer = this.isValidLayer(layerByName) ? layerByName : null;
      }
    } else if (layer instanceof Object) {
      if (this.isValidLayer(layer)) {
        newLayer = layer;
      } else {
        const layerByObject = this.map.getLayers().find((l) => (
          l === layer
          || l.name === layer.name
          || l.legend === layer.legend
        ));

        newLayer = this.isValidLayer(layerByObject)
          ? layerByObject
          : null;
      }
    }
    if (newLayer !== null) {
      newLayer.displayInLayerSwitcher = false;
      newLayer.setVisible(false);
    }
    return newLayer;
  }

  setIntervalLayerVisible(interval, visible) {
    if (interval?.service) {
      const layer = this.getMapLayer(interval.service);
      if (layer) {
        layer.setVisible(visible);
      }
    }
  }

  /** This function change layers and show layer name when slider moves
   *
   * @public
   * @function
   * @api stable
   */
  changeSlider(elem) {
    document.querySelector('.div-m-timeline-slider').style.setProperty('--opacity', '0');
    const left = (((elem.value - elem.min) / (elem.max - elem.min)) * ((256 - 20) - 5));
    document.querySelector('.div-m-timeline-slider').style.setProperty('--left', `${left}px`);
    if (this.animation) {
      document.querySelector('.m-timeline-button').style.display = 'block';
      document.querySelector('.m-timeline-button').style.visibility = 'visible';
    }
    const step = parseFloat(elem.value);
    this.intervals.forEach((interval) => {
      this.setIntervalLayerVisible(interval, false);
    });
    const entireStep = parseInt(step, 10);
    const entireInterval = this.intervals[entireStep];
    const entirreIntervalNextStep = entireStep + 1;
    const entireIntervalNext = this.intervals[entireStep + 1];
    this.getElement().querySelector('.m-timeline-names-next').style.display = 'none';
    this.renderLayerSelector(entireInterval, entireStep, '.m-timeline-names');
    if (step % 1 === 0) {
      document.querySelector('.div-m-timeline-slider').style.setProperty('--left', `${left + 20}px`);
      this.getMapLayer(this.intervals[step].service).setVisible(true);
      document.querySelector('.div-m-timeline-panel').style.setProperty('--valor', `"${this.intervals[step].tag}"`);
      if (this.intervals[step].tag !== '') {
        document.querySelector('.div-m-timeline-slider').style.setProperty('--opacity', '1');
      } else {
        document.querySelector('.div-m-timeline-slider').style.setProperty('--opacity', '0');
      }
    } else {
      this.setIntervalLayerVisible(entireInterval, true);
      this.setIntervalLayerVisible(entireIntervalNext, true);
      if (entireInterval.tag !== '' && entireIntervalNext.tag !== '') {
        document.querySelector('.div-m-timeline-slider').style.setProperty('--left', `${left}px`);
        document.querySelector('.div-m-timeline-slider').style.setProperty('--opacity', '1');
        document.querySelector('.div-m-timeline-panel').style.setProperty('--valor', `"${entireInterval.tag} - ${entireIntervalNext.tag}"`);
        this.renderLayerSelector(entireIntervalNext, entirreIntervalNextStep, '.m-timeline-names-next');
      } else if (entireInterval.tag === '' && entireIntervalNext.tag === '') {
        document.querySelector('.div-m-timeline-slider').style.setProperty('--opacity', '0');
      } else {
        document.querySelector('.div-m-timeline-slider').style.setProperty('--left', `${left + 20}px`);
        document.querySelector('.div-m-timeline-slider').style.setProperty('--opacity', '10');
        document.querySelector('.div-m-timeline-panel').style.setProperty('--valor', `"${entireInterval.tag}${entireIntervalNext.tag}"`);
        this.renderLayerSelector(entireIntervalNext, entirreIntervalNextStep, '.m-timeline-names-next');
      }
    }
  }

  /** This function search a layer in the map
   *
   * @public
   * @function
   * @api stable
   * @return {object}
   */
  getMapLayer(layerSearch) {
    return layerSearch ? this.map.getLayers()
      .find((layer) => layer.getImpl().legend === layerSearch.getImpl().legend) : undefined;
  }

  /** Returns the play button element used to init timeline process
   *
   * @public
   * @api stable
   * @function
   * @returns {HTMLButtonElement}
   */
  getPlayTimeButton() {
    return document.getElementById('m-timeline-play');
  }

  /** This function make the play animation
   *
   * @public
   * @function
   * @api stable
   * @return {void}
   */
  playTimeline(next) {
    const start = 0;
    const end = this.intervals.length - 1;
    const slider = document.querySelector('#input-slider');
    let step = parseInt(slider.value, 10);
    if (this.running) {
      this.getPlayTimeButton().classList.replace(
        'g-cartografia-control-pausa',
        'g-cartografia-control-siguiente',
      );
      clearTimeout(this.running);
    }
    if (!next) {
      if (step > start && step < end && this.running) {
        this.running = false;
        return;
      }
      if (step > end) {
        step = start;
      }
    }
    if (step >= end) {
      slider.value = 0;
      this.changeSlider(slider);
      return;
    }
    if (step < start) {
      step = start;
    }
    slider.value = parseFloat(slider.value) + 1;
    this.changeSlider(slider);
    this.getPlayTimeButton().classList.remove('g-cartografia-control-siguiente');
    this.getPlayTimeButton().classList.add('g-cartografia-control-pausa');
    this.running = setTimeout((e) => this.playTimeline(true), this.speed * 1000);
  }

  /**
   * This function remove the timeline layers
   *
   * @public
   * @function
   * @api stable
   */
  removeTimelineLayers() {
    clearInterval(this.running);
    this.intervals.forEach((interval) => {
      this.map.removeLayers(this.getMapLayer(interval.service));
    });
  }

  /**
   * Create TimeLine Dinamic
   *
   * @private
   * @function
   */
  createtimeLineDinamic() {
    this.createStepsTimeLine();
    this.createSelectorLayers();
    this.createInputDate();
  }

  /**
   * Create input date TimeLine Dinamic
   *
   * @private
   * @function
   */
  createInputDate() {
    const init = this.getElement().querySelector('#init');
    const end = this.getElement().querySelector('#end');

    init.value = this.date.init;
    end.value = this.date.end;

    ['focusout', 'keypress'].forEach((event) => {
      init.addEventListener(event, ({ target, key = false } = {}) => {
        if (event === 'focusout' || key === 'Enter') {
          const value = this.getValues_inputDate(target.value);
          const endValue = this.getValues_inputDate(end.value);
          this.changeDateLayer(new Date(target.value).getTime(), new Date(end.value).getTime());
          this.changeValueSlider(value, endValue);
        }
      });

      end.addEventListener(event, ({ target, key = false } = {}) => {
        if (event === 'focusout' || key === 'Enter') {
          const value = this.getValues_inputDate(target.value);
          const valueInit = this.getValues_inputDate(init.value);
          this.changeDateLayer(new Date(init.value).getTime(), new Date(target.value).getTime());
          this.changeValueSlider(valueInit, value);
        }
      });
    });
  }

  /**
   * Create selector layers TimeLine Dinamic
   *
   * @private
   * @function
   */
  createSelectorLayers() {
    const selectDinamic = this.getElement().querySelector('#selectDinamicLayer');
    this.intervals.forEach(({
      id, init, end, layer, grupo, attributeParam, equalsTimeLine = false,
    }) => {
      if (!equalsTimeLine) {
        // eslint-disable-next-line no-param-reassign
        equalsTimeLine = (this.timelineType === 'absolute');
      }

      const l = this.transformToLayersDinamic(
        { init, end },
        layer,
        id,
        attributeParam,
        equalsTimeLine,
      );
      if (grupo) {
        const layerGroup = this.allLayersDinamic.groupLayer.find(({ name }) => name === grupo);

        if (layerGroup) {
          const lastGroup = selectDinamic.querySelector(`#${grupo}`);

          const lastGroupInit = lastGroup.getAttribute('init');
          const lastGroupEnd = lastGroup.getAttribute('end');

          lastGroup.setAttribute('init', (new Date(lastGroupInit).getTime() < new Date(init).getTime()) ? lastGroupInit : init);
          lastGroup.setAttribute('end', (new Date(lastGroupEnd).getTime() > new Date(end).getTime()) ? lastGroupEnd : end);

          layerGroup.layers.push(l);
        } else {
          this.allLayersDinamic.groupLayer.push({
            name: grupo,
            layers: [l],
          });
          selectDinamic.innerHTML += `<option id="${grupo}" equalsTimeLine="${equalsTimeLine}" init="${init}" end="${end}" value="group">${grupo}</option>`;
        }
      } else {
        this.allLayersDinamic.noGroupLayer.push({
          name: l.name,
          layers: [l],
        });
        selectDinamic.innerHTML += `<option id="${id}" equalsTimeLine="${equalsTimeLine}" init="${init}" end="${end}" value="${id}">${l.name}</option>`;
      }
    });
    this.selectorEventLayer();
  }

  /**
   * Create steps TimeLine Dinamic
   *
   * @private
   * @function
  */
  createStepsTimeLine() {
    this.getElement().querySelector('#m-timelineDinamic-play').addEventListener('click', ({ target }) => {
      const active = target.classList.contains('active');
      if (!active) {
        const id = this.stepsTimeLineDinamic();
        target.classList.add('active');
        target.setAttribute('intervalID', id);
      } else {
        clearInterval(target.getAttribute('intervalID'));
        target.classList.remove('active');
      }
    });

    [this.getElement().querySelector('#m-timelineDinamic-back'), this.getElement().querySelector('#m-timelineDinamic-before')]
      .forEach((l) => {
        l.addEventListener('click', ({ target }) => {
          this.evtFormatMove(target.id);
        });
      });
  }

  /**
   * Search Layers Dinamic
   *
   * @private
   * @function
  */
  searchLayerDinamic(layer) {
    return this.intervals.find(({ id }) => layer.timelineId === id);
  }

  /**
   * Asigna a la capa el identificador del intervalo. En OGCAPIFeatures y
   * DataIDEE "id" es el filtro por objeto geográfico y no se sobrescribe.
   *
   * @private
   * @function
  */
  setTimelineId_(layer, id) {
    const target = layer;
    target.timelineId = id;
    if (![LayerType.OGCAPIFeatures, LayerType.DataIDEE].includes(target.type)) {
      target.id = id;
    }
  }

  /**
   * Return layers filter Date
   *
   * @private
   * @function
  */
  transformToLayersDinamic({ init, end }, layer, id, attributeParam, equalsTimeLine) {
    const layerAux = layer;
    if (!(layerAux instanceof Object)) {
      const [type, legend, url, name] = layerAux.split('*');
      const layerWMS = new WMS(
        {
          type, legend, url, name,
        },
        {
          params: {
            CQL_FILTER: (equalsTimeLine)
              ? `${attributeParam} = '${new Date(end).toISOString()}'`
              : `${attributeParam} DURING ${new Date(init).toISOString()}/${new Date(end).toISOString()}`,
          },
        },
      );
      this.setTimelineId_(layerWMS, id);
      layerWMS.layerTimeLine = true;
      layerWMS.attributeParam = attributeParam;
      layerWMS.equalsTimeLine = equalsTimeLine;
      return layerWMS;
    }
    if ((layerAux instanceof Vector)) {
      layerAux.layerTimeLine = true;
      this.setTimelineId_(layerAux, id);
      layerAux.attributeParam = attributeParam;
      layerAux.equalsTimeLine = equalsTimeLine;
      return layerAux;
    }
    // WMS
    layerAux.layerTimeLine = true;
    this.setTimelineId_(layerAux, id);
    layerAux.attributeParam = attributeParam;
    layerAux.equalsTimeLine = equalsTimeLine;
    return layerAux;
  }

  /**
   * Return Date Input Format
   *
   * @private
   * @function
  */
  getValues_inputDate(value) {
    const format = this.formatValue;
    const formatRevert = this.getReverseFormat(format);
    const dateToNumber = new Date(value).getTime();
    return this.getFormatValue(dateToNumber, formatRevert);
  }

  /**
   * Event to Selector Layer TimeLine Dinamic
   *
   * @private
   * @function
  */
  selectorEventLayer() {
    const selectDinamic = this.getElement().querySelector('#selectDinamicLayer');
    selectDinamic.addEventListener('change', ({ target }) => {
      this.removeLayers();

      if (target.selectedIndex === 0) {
        this.changeValueInputDate('Please choose an option', 'Please choose an option');
        this.sliderEventDinamic(0, 1);
        return;
      }

      const selected = target.children[target.selectedIndex];

      const init = selected.getAttribute('init');
      const end = selected.getAttribute('end');
      const equalsTimeLine = selected.getAttribute('equalsTimeLine');

      if (equalsTimeLine === 'true') {
        document.querySelector('#a').setAttribute('disabled', '');
        document.querySelector('#init').setAttribute('disabled', '');
      } else {
        document.querySelector('#a').removeAttribute('disabled');
        document.querySelector('#init').removeAttribute('disabled');
      }

      if (selected.value === 'group') {
        const layerGroup = this.allLayersDinamic.groupLayer
          .find(({ name }) => name === selected.id);
        this.map.addLayers(layerGroup.layers);
        this.changeVectorLayer(
          new Date(init).getTime(),
          new Date(end).getTime(),
          layerGroup.layers,
        );

        this.changeValueInputDate(init, end);
        this.sliderEventDinamic(new Date(init).getTime(), new Date(end).getTime());
      } else {
        const layerNoGroup = this.allLayersDinamic.noGroupLayer
          .find(({ layers }) => layers[0].timelineId === selected.id);

        this.map.addLayers(layerNoGroup.layers);
        this.changeVectorLayer(
          new Date(init).getTime(),
          new Date(end).getTime(),
          layerNoGroup.layers,
        );

        this.changeValueInputDate(init, end);
        this.sliderEventDinamic(
          new Date(init).getTime(),
          new Date(end).getTime(),
        );
      }
    });
  }

  /**
   * Get Layers used on TimeLine
   *
   * @private
   * @function
  */
  getLayers() {
    return this.map.getLayers().filter((l) => l.layerTimeLine === true);
  }

  /**
   * Remove Layer TimeLine Dinamic
   *
   * @private
   * @function
  */
  removeLayers() {
    this.map.removeLayers(this.getLayers());
  }

  /**
   * Event Slider TimeLine Dinamic
   *
   * @private
   * @function
  */
  sliderEventDinamic(init, end) {
    this.generateValueSlider(init, end);

    this.getElement().querySelector('.wrap #a').addEventListener('input', ({ target }) => {
      const inputvalue = Number(document.querySelector('.wrap #b').value);
      if (Number(target.value) >= inputvalue) {
        // eslint-disable-next-line no-param-reassign
        target.value = inputvalue;
        return;
      }

      const formatValue = this.formatValue;
      const valueInit = this.getFormatValue(Number(target.value), formatValue);
      const valueEnd = this.getFormatValue(Number(inputvalue), formatValue);

      this.changeDateLayer(valueInit, valueEnd);
      this.changeValueInputDate(
        new Date(valueInit).toISOString(),
        new Date(valueEnd).toISOString(),
      );
    });

    this.getElement().querySelector('.wrap #b').addEventListener('input', ({ target }) => {
      const inputvalue = Number(document.querySelector('.wrap #a').value);
      if (Number(target.value) <= inputvalue) {
        // eslint-disable-next-line no-param-reassign
        target.value = inputvalue;
        return;
      }

      const formatValue = this.formatValue;
      const valueEnd = this.getFormatValue(Number(target.value), formatValue);
      const valueInit = this.getFormatValue(Number(inputvalue), formatValue);

      this.changeDateLayer(valueInit, valueEnd);
      this.changeValueInputDate(
        new Date(valueInit).toISOString(),
        new Date(valueEnd).toISOString(),
      );
    });
  }

  /**
   * Generate Values Slider TimeLine Dinamic
   *
   * @private
   * @function
  */
  generateValueSlider(init, end) {
    const inputInit = this.getElement().querySelector('.wrap #a');
    const inputEnd = this.getElement().querySelector('.wrap #b');

    const dateInit = new Date(init).getTime();
    const dateEnd = new Date(end).getTime();

    inputInit.min = dateInit;
    inputInit.max = dateEnd;
    inputInit.value = dateInit;

    inputEnd.min = dateInit;
    inputEnd.max = dateEnd;
    inputEnd.value = dateEnd;
  }

  /**
   * Change Value Input Date TimeLine Dinamic
   *
   * @private
   * @function
  */
  changeValueInputDate(init, end) {
    this.getElement().querySelector('#init').value = init;
    this.getElement().querySelector('#end').value = end;
  }

  /**
   * Change Value Slider TimeLine Dinamic
   *
   * @private
   * @function
  */
  changeValueSlider(init, end) {
    const wrapInputs = this.getElement().querySelectorAll('.wrap input');
    wrapInputs[0].value = init;
    wrapInputs[1].value = end;
  }

  /**
   * Change Date Layer TimeLine Dinamic
   *
   * @private
   * @function
  */
  changeDateLayer(init, end) {
    const initValue = Number(init);
    const endValue = Number(end);

    const layersTimeLine = this.getLayers();
    this.removeLayers();

    layersTimeLine.forEach((l) => {
      if (l instanceof Vector) {
        l.on(EventType.LOAD, () => {
          const searhDinamic = this.searchLayerDinamic(l);
          const [vectorInitValue, vectorEndValue] = this
            .getGroupLimit(initValue, endValue, searhDinamic);

          const filter = new FilterFunction((f) => {
            const dateTime = f.getAttributes()[l.attributeParam];
            if (l.equalsTimeLine) {
              if (
                vectorEndValue === new Date(this.transformTime_NumbToDate(dateTime)[0]).getTime()
              ) {
                return f;
              }
            }

            if (
              vectorInitValue <= new Date(this.transformTime_NumbToDate(dateTime)[0]).getTime()
              && vectorEndValue >= new Date(this.transformTime_NumbToDate(dateTime)[0]).getTime()
            ) {
              return f;
            }
          });

          // eslint-disable-next-line no-param-reassign
          l.setFilter(filter);
        });
      } else {
        const searhDinamic = this.searchLayerDinamic(l);
        const [wmsInitValue, wmsEndValue] = this.getGroupLimit(initValue, endValue, searhDinamic);
        // eslint-disable-next-line no-param-reassign
        l.options.params.CQL_FILTER = (l.equalsTimeLine)
          ? `${l.attributeParam} = '${new Date(end).toISOString()}'`
          : `${l.attributeParam} DURING ${new Date(wmsInitValue).toISOString()}/${new Date(wmsEndValue).toISOString()}`;
      }
      this.map.addLayers(l);
    });
  }

  /**
   * Vector Layer Change Date TimeLine Dinamic
   *
   * @private
   * @function
  */
  changeVectorLayer(init, end, layers) {
    const vectorLayers = layers.filter((l) => l instanceof Vector);
    vectorLayers.forEach((l) => {
      l.on(EventType.LOAD, () => {
        const searhDinamic = this.searchLayerDinamic(l);
        const [vectorInitValue, vectorEndValue] = this.getGroupLimit(init, end, searhDinamic);

        const filter = new FilterFunction((f) => {
          const dateTime = f.getAttributes()[l.attributeParam];
          if (l.equalsTimeLine) {
            if (
              vectorEndValue === new Date(this.transformTime_NumbToDate(dateTime)[0]).getTime()
            ) {
              return f;
            }

            if (
              vectorInitValue <= new Date(this.transformTime_NumbToDate(dateTime)[0]).getTime()
              && vectorEndValue >= new Date(this.transformTime_NumbToDate(dateTime)[0]).getTime()
            ) {
              return f;
            }
          }
        });

        l.setFilter(filter);
      });
    });
  }

  /**
   * Continuous Event Back
   *
   * @private
   * @function
  */
  evtFormatMove(id) {
    if (this.getElement().querySelector('#selectDinamicLayer').value === '') {
      this.changeValueInputDate('Please choose an option', 'Please choose an option');
      this.sliderEventDinamic(0, 1);
      return;
    }

    const format = this.formatValue;
    const formatRevert = this.getReverseFormat(format);

    const [dateInit, dateEnd] = this.getValueDateInput().map((numberIntEnd, i) => {
      if (i === 0 && this.formatMove === 'discrete') {
        return numberIntEnd;
      }
      if (id === 'm-timelineDinamic-before') {
        const sliderMax = this.getValueSliderB().max;
        return this.getValueBeforeEvent(numberIntEnd, sliderMax);
      }
      const sliderMin = this.getValueSliderB().min;
      return this.getValueBackEvent(numberIntEnd, sliderMin);
    });

    this.changeValueInputDate(new Date(dateInit).toISOString(), new Date(dateEnd).toISOString());
    const [reverseInit, reverseEnd] = [dateInit, dateEnd]
      .map((n) => this.getFormatValue(n, formatRevert));

    this.changeDateLayer(dateInit, dateEnd);
    this.changeValueSlider(reverseInit, reverseEnd);
  }

  /**
   * Get Value Back Event
   *
   * @private
   * @function
  */
  getValueBackEvent(value, sliderMin) {
    return ((value - this.getStepValue()) <= sliderMin)
      ? sliderMin
      : value - this.getStepValue();
  }

  /**
   * Reverse Format TimeLine Dinamic
   *
   * @private
   * @function
  */
  getReverseFormat(format) {
    const formatValue = format;
    if (formatValue === 'logarithmic') return 'exponential';
    if (formatValue === 'exponential') return 'logarithmic';
    return 'linear';
  }

  /**
   * Before Event Get Values
   *
   * @private
   * @function
  */
  getValueBeforeEvent(number, sliderMax) {
    return ((number + this.getStepValue()) >= sliderMax)
      ? sliderMax
      : number + this.getStepValue();
  }

  /**
   * Get Value Date Input
   *
   * @private
   * @function
  */
  getValueDateInput() {
    const init = document.querySelector('#init').value;
    const end = document.querySelector('#end').value;
    return [new Date(init).getTime(), new Date(end).getTime()];
  }

  /**
   * Get Format Value
   *
   * @private
   * @function
  */
  getFormatValue(value, format) {
    const sliderMax = Number(document.querySelector('#b').max);
    const sliderMin = Number(document.querySelector('#b').min);

    const formatValue = format;
    if (formatValue === 'exponential') {
      return this.exponential(sliderMin, sliderMax, value);
    } if (formatValue === 'logarithmic') {
      return this.logarithmic(sliderMin, sliderMax, value);
    }
    return value;
  }

  /**
   * Get Value Slider B
   *
   * @private
   * @function
  */
  getValueSliderB() {
    return {
      min: Number(document.querySelector('#b').min),
      max: Number(document.querySelector('#b').max),
      value: Number(document.querySelector('#b').value),
    };
  }

  /**
   * Get Value Slider A
   *
   * @private
   * @function
  */
  getValueSliderA() {
    return {
      min: Number(document.querySelector('#a').min),
      max: Number(document.querySelector('#a').max),
      value: Number(document.querySelector('#a').value),
    };
  }

  /**
   * Step TimeLine Dinamic
   *
   * @private
   * @function
  */
  stepsTimeLineDinamic() {
    if (this.getElement().querySelector('#selectDinamicLayer').value === '') {
      this.changeValueInputDate('Please choose an option', 'Please choose an option');
      this.sliderEventDinamic(0, 1);
      return;
    }

    const speed = this.speedDate;

    const time = setInterval(() => {
      this.evtFormatMove('m-timelineDinamic-before');
    }, 1000 * speed);

    return time;
  }

  /**
   * Get Value Step
   *
   * @private
   * @function
  */
  getStepValue() {
    const date = this.paramsDate;
    switch (date) {
      case 'sec':
        return 1000 * this.stepValue;

      case 'min':
        return (1000 * 60) * this.stepValue;

      case 'hrs':
        return (1000 * 60 * 60) * this.stepValue;

      case 'day':
        return (1000 * 60 * 60 * 24) * this.stepValue;

      case 'mos':
        return (1000 * 60 * 60 * 24 * 30) * this.stepValue;

      case 'yr':
        return (1000 * 60 * 60 * 24 * 30 * 12) * this.stepValue;

      default:
        return 86400000; // day in ms
    }
  }

  /**
   * Get Limit Group
   *
   * @private
   * @function
  */
  getGroupLimit(init, end, userValues) {
    const initValue = (init <= new Date(userValues.init).getTime())
      ? new Date(userValues.init).getTime()
      : init;
    const endValues = (end >= new Date(userValues.end).getTime())
      ? new Date(userValues.end).getTime()
      : end;
    return [initValue, endValues];
  }

  /**
   * Transform Time/Number to Date
   *
   * @private
   * @function
  */
  transformTime_NumbToDate(init = 0, end = 0) {
    const initVal = (Number.isNaN(Number(init)))
      ? new Date(init).toISOString()
      : new Date(Number(init)).toISOString();
    const endVal = (Number.isNaN(Number(end)))
      ? new Date(end).toISOString()
      : new Date(Number(end)).toISOString();
    return [initVal, endVal];
  }

  /**
   * Logarithmic Formt
   *
   * @private
   * @function
  */
  logarithmic(min, max, val) {
    const [minv, , scale] = this.formatValueType(min, max);

    if (min > 0) {
      return Math.round(Math.exp(minv - min * scale + scale * val));
    }
    return Math.round(
      Math.exp(-min * scale) * (Math.exp(minv + scale * val)
        + min * Math.exp(min * scale) - Math.exp(min * scale)),
    );
  }

  /**
   * Type Format Value
   *
   * @private
   * @function
  */
  formatValueType(min, max) {
    const fristDate = min;
    const endDate = max;

    let minv = 0;
    let maxv = 0;

    if (fristDate > 0) {
      minv = Math.log(fristDate);
      maxv = Math.log(endDate);
    } else {
      minv = Math.log(1);
      maxv = Math.log(endDate + Math.abs(fristDate) + 1);
    }

    const scale = (maxv - minv) / (endDate - fristDate);
    return [minv, maxv, scale];
  }

  /**
   *  Exponentialformar
   *
   * @private
   * @function
  */
  exponential(min, max, val) {
    const [minv, , scale] = this.formatValueType(min, max);

    if (min > 0) {
      return Math.round((Math.log(val) - minv) / scale + min);
    }
    return Math.round((Math.log((val - min + 1)) - minv) / scale + min);
  }

  /**
   * This function compares controls
   *
   * @public
   * @function
   * @param {IDEE.Control} control to compare
   * @api stable
   * @return {Boolean}
   */
  equals(control) {
    return control instanceof Timeline;
  }

  /**
  * Obtiene la ayuda del control
  * Su construcción es similar a la del plugin, por ello se usa la misma plantilla
  *
  * @function
  * @public
  * @api
  */
  getHelp() {
    return {
      title: this.name,
      content: new Promise((success) => {
        const html = compileSync(myhelp, {
          vars: {
            urlImages: `${IDEE.config.STATIC_RESOURCES_URL}/imagenes/controles`,
            translations: {
              help1: this.translation.textHelp.help1,
              help2: this.translation.textHelp.help2,
              help3: this.translation.textHelp.help3,
              help4: this.translation.textHelp.help4,
              help5: this.translation.textHelp.help5,
            },
          },
        });
        success(html);
      }),
    };
  }

  /**
   * Elimina el control.
   *
   * @public
   * @function
   * @api
   * @export
   */
  destroy() {
    super.destroy();
    if (this.isDynamicTimeline()) {
      this.removeLayers();
    } else {
      this.removeTimelineLayers();
    }
    [this.impl_, this.panel_, this.map_, this.layers, this.radius] = [
      null, null, null, null, null,
    ];
  }
}

/**
 * Nombre para identificar este control.
 * @const
 * @type {string}
 * @public
 * @api
 */
Timeline.NAME = 'timeline';

export default Timeline;
