/**
 * @module IDEE/control/Timeline
 */
import 'assets/css/fonts';
import 'assets/css/controls/timeline';
import timelineTemplate from 'templates/timeline';
import myhelp from 'templates/timelineHelp';
import timelineDinamicTemplate from 'templates/timelineDinamic';
import TimelineImpl from 'impl/control/Timeline';
import Layer from 'IDEE/layer/Layer';
import * as EventType from 'IDEE/event/eventtype';
import {
  isArray, isBoolean, isFunction, isNullOrEmpty, isObject, isString, isUndefined, isUrl,
} from '../util/Utils';
import Control from './Control';
import { getLang, getValue } from '../i18n/language';
import Exception from '../exception/exception';
import * as Position from '../ui/position';
import { compileSync } from '../util/Template';
import * as parameter from '../parameter/parameter';
import { buildLayer } from '../builder/builder';

const typesTimeline = ['absoluteSimple', 'absolute', 'relative'];
const EMPTY_LAYER_ID = '__timeline_empty_layer__';

/**
 * Segundos por paso por defecto ("speed" en absoluteSimple y "speedDate" en absolute y
 * relative). Equivalen a ×1 en el selector de velocidad.
 * @const
 * @private
 */
const DEFAULT_SPEED = 1;
const DEFAULT_SPEED_DATE = 2;

/**
 * Multiplicadores estándar del selector de velocidad.
 * @const
 * @private
 */
const SPEED_FACTORS = [0.5, 1, 2, 3, 5];

/**
 * Capas internas del mapa que nunca forman parte del visualizador para Timeline.
 * @const
 * @private
 */
const INTERNAL_LAYER_NAMES = ['__draw__'];

/**
 * Contador de instancias para generar identificadores DOM únicos.
 * @private
 */
let instanceCounter = 0;

/**
 * Muestra un aviso en la consola.
 * @private
 * @param {String} message Mensaje.
 */
const warn = (message) => {
  // eslint-disable-next-line no-console
  console.warn(message);
};

/**
 * Sustituye los marcadores {clave} de un texto.
 * @private
 * @param {String} text Texto con marcadores.
 * @param {Object} values Valores por clave.
 * @returns {String} Texto resultante.
 */
const formatText = (text, values) => Object.keys(values)
  .reduce((result, key) => result.replace(`{${key}}`, values[key]), text ?? '');

/**
 * Convierte un instante en milisegundos a ISO 8601 (UTC).
 * @private
 * @param {Number} time Milisegundos.
 * @returns {String} Fecha ISO.
 */
const toISO = (time) => new Date(time).toISOString();

/**
 * Describe una referencia de capa para los avisos.
 * @private
 * @param {*} reference Referencia.
 * @returns {String} Descripción.
 */
const describeReference = (reference) => {
  if (isString(reference)) return reference;
  if (reference instanceof Layer) return reference.name;
  if (isObject(reference)) return reference.name ?? reference.legend ?? JSON.stringify(reference);
  return `${reference}`;
};

/**
 * @classdesc
 * Utilidades temporales puras de Timeline: normalización de fechas, conversión a
 * milisegundos, pasos de navegación y escalas de los deslizadores.
 *
 * @private
 */
class TimelineDates {
  /**
   * Normaliza una fecha inicial. Un año "YYYY" pasa al 1 de enero (UTC)
   * y un número, a ISO.
   * @param {String|Number} value Valor temporal.
   * @returns {String|Number} Fecha normalizada.
   */
  static normalizeInitDate(value) {
    if (typeof value === 'number') {
      return new Date(value).toISOString();
    }
    if (typeof value === 'string' && /^\d{4}$/.test(value)) {
      return `${value}-01-01T00:00:00.000Z`;
    }
    return value;
  }

  /**
   * Normaliza una fecha final. Un año "YYYY" pasa al 31 de diciembre (UTC)
   * y un número, a ISO.
   * @param {String|Number} value Valor temporal.
   * @returns {String|Number} Fecha normalizada.
   */
  static normalizeEndDate(value) {
    if (typeof value === 'number') {
      return new Date(value).toISOString();
    }
    if (typeof value === 'string' && /^\d{4}$/.test(value)) {
      return `${value}-12-31T23:59:59.999Z`;
    }
    return value;
  }

  /**
   * Convierte un valor temporal en milisegundos. Admite fechas ISO/UTC, objetos Date,
   * timestamps en milisegundos (número o cadena numérica) y años "YYYY" (UTC).
   * @param {*} value Valor temporal.
   * @returns {Number} Milisegundos o NaN si el valor falta o no es válido.
   */
  static toTimestamp(value) {
    if (value instanceof Date) return value.getTime();
    if (typeof value === 'number') return Number.isFinite(value) ? value : NaN;
    if (!isString(value) || value.trim() === '') return NaN;
    const text = value.trim();
    if (/^\d{4}$/.test(text)) return Date.UTC(Number(text), 0, 1);
    if (/^-?\d+(\.\d+)?$/.test(text)) return Number(text);
    return new Date(text).getTime();
  }

  /**
   * Convierte fechas o milisegundos a ISO.
   * @param {String|Number} init Fecha inicial.
   * @param {String|Number} end Fecha final.
   * @returns {Array<String>} Fechas ISO [inicio, fin].
   */
  static transformTimeNumbToDate(init = 0, end = 0) {
    const initVal = (Number.isNaN(Number(init)))
      ? new Date(init).toISOString()
      : new Date(Number(init)).toISOString();
    const endVal = (Number.isNaN(Number(end)))
      ? new Date(end).toISOString()
      : new Date(Number(end)).toISOString();
    return [initVal, endVal];
  }

  /**
   * Devuelve el paso de navegación en milisegundos.
   * @param {String} paramsDate Unidad ('sec', 'min', 'hrs', 'day', 'mos', 'yr').
   * @param {Number} stepValue Número de unidades por paso.
   * @returns {Number} Milisegundos.
   */
  static getStepValue(paramsDate, stepValue) {
    switch (paramsDate) {
      case 'sec':
        return 1000 * stepValue;
      case 'min':
        return (1000 * 60) * stepValue;
      case 'hrs':
        return (1000 * 60 * 60) * stepValue;
      case 'day':
        return (1000 * 60 * 60 * 24) * stepValue;
      case 'mos':
        return (1000 * 60 * 60 * 24 * 30) * stepValue;
      case 'yr':
        return (1000 * 60 * 60 * 24 * 30 * 12) * stepValue;
      default:
        return 86400000; // day in ms
    }
  }

  /**
   * Ajusta un rango a los límites de un intervalo.
   * @param {Number} init Inicio en milisegundos.
   * @param {Number} end Fin en milisegundos.
   * @param {Object} userValues Intervalo con init y end.
   * @returns {Array<Number>} Rango ajustado.
   */
  static getGroupLimit(init, end, userValues) {
    const initValue = (init <= new Date(userValues.init).getTime())
      ? new Date(userValues.init).getTime()
      : init;
    const endValues = (end >= new Date(userValues.end).getTime())
      ? new Date(userValues.end).getTime()
      : end;
    return [initValue, endValues];
  }

  /**
   * Devuelve la escala inversa.
   * @param {String} format Escala.
   * @returns {String} Escala inversa.
   */
  static getReverseFormat(format) {
    if (format === 'logarithmic') return 'exponential';
    if (format === 'exponential') return 'logarithmic';
    return 'linear';
  }

  /**
   * Calcula los parámetros de las escalas logarítmica y exponencial.
   * @param {Number} min Mínimo.
   * @param {Number} max Máximo.
   * @returns {Array<Number>} [minv, maxv, scale].
   */
  static formatValueType(min, max) {
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
   * Escala logarítmica.
   * @param {Number} min Mínimo.
   * @param {Number} max Máximo.
   * @param {Number} val Valor.
   * @returns {Number} Valor escalado.
   */
  static logarithmic(min, max, val) {
    const [minv, , scale] = TimelineDates.formatValueType(min, max);

    if (min > 0) {
      return Math.round(Math.exp(minv - min * scale + scale * val));
    }
    return Math.round(
      Math.exp(-min * scale) * (Math.exp(minv + scale * val)
        + min * Math.exp(min * scale) - Math.exp(min * scale)),
    );
  }

  /**
   * Escala exponencial.
   * @param {Number} min Mínimo.
   * @param {Number} max Máximo.
   * @param {Number} val Valor.
   * @returns {Number} Valor escalado.
   */
  static exponential(min, max, val) {
    const [minv, , scale] = TimelineDates.formatValueType(min, max);

    if (min > 0) {
      return Math.round((Math.log(val) - minv) / scale + min);
    }
    return Math.round((Math.log((val - min + 1)) - minv) / scale + min);
  }

  /**
   * Aplica una escala a un valor del deslizador.
   * @param {Number} value Valor.
   * @param {String} format Escala ('linear', 'logarithmic', 'exponential').
   * @param {Number} min Mínimo del deslizador.
   * @param {Number} max Máximo del deslizador.
   * @returns {Number} Valor escalado.
   */
  static getFormatValue(value, format, min, max) {
    if (format === 'exponential') {
      return TimelineDates.exponential(min, max, value);
    }
    if (format === 'logarithmic') {
      return TimelineDates.logarithmic(min, max, value);
    }
    return value;
  }
}

/**
 * @classdesc
 * Filtro temporal independiente del motor cartográfico. Las implementaciones lo
 * aplican con matches(feature) en capas vectoriales y con toCQL() en WMS.
 *
 * @private
 */
class TemporalFilter {
  /**
   * @param {Object} options Opciones.
   * @param {Number} options.init Inicio en milisegundos.
   * @param {Number} options.end Fin en milisegundos.
   * @param {String} options.attributeParam Atributo temporal.
   * @param {Boolean} [options.equalsTimeLine=false] Filtro de igualdad (WMS).
   * @param {Number} [options.cqlEnd] Fin usado en el filtro de igualdad CQL.
   */
  constructor({
    init, end, attributeParam, equalsTimeLine = false, cqlEnd = end,
  }) {
    this.init = init;
    this.end = end;
    this.attributeParam = attributeParam;
    this.equalsTimeLine = equalsTimeLine;
    this.cqlEnd = cqlEnd;
  }

  /**
   * Indica si una entidad está dentro del rango [init, end]. Un valor temporal
   * ausente o no válido excluye la entidad.
   * @param {IDEE.Feature} feature Entidad.
   * @returns {Boolean} Verdadero si la entidad cumple el filtro.
   */
  matches(feature) {
    if (isNullOrEmpty(this.attributeParam) || !isFunction(feature?.getAttribute)) return false;
    const time = TimelineDates.toTimestamp(feature.getAttribute(this.attributeParam));
    return !Number.isNaN(time) && this.init <= time && time <= this.end;
  }

  /**
   * Devuelve el filtro CQL equivalente.
   * @returns {String} Filtro CQL.
   */
  toCQL() {
    if (this.equalsTimeLine) {
      return `${this.attributeParam} = '${toISO(this.cqlEnd)}'`;
    }
    return `${this.attributeParam} DURING ${toISO(this.init)}/${toISO(this.end)}`;
  }
}

/**
 * @classdesc
 * Temporizadores de reproducción. Se detienen solos si el control ya no está en el
 * documento (por ejemplo, tras destruir el mapa).
 *
 * @private
 */
class TimelinePlayer {
  /**
   * @param {Function} isAlive Devuelve si el control sigue en el documento.
   */
  constructor(isAlive) {
    this.handle_ = null;
    this.isAlive_ = isAlive;
    this.generation_ = 0;
  }

  /**
   * Identificador del temporizador activo.
   * @returns {Number|null} Identificador.
   */
  get handle() {
    return this.handle_;
  }

  /**
   * Indica si hay una reproducción en curso.
   * @returns {Boolean} Verdadero si hay temporizador activo.
   */
  isRunning() {
    return this.handle_ !== null;
  }

  /**
   * Repite un paso mientras devuelva verdadero. El retardo se lee antes de cada paso,
   * así que un cambio de velocidad se aplica en el siguiente sin cortar la reproducción.
   * Durante el paso la reproducción sigue en curso.
   * @param {Function} tick Paso; devuelve falso para terminar.
   * @param {Function} getDelay Devuelve el retardo en milisegundos.
   */
  loop(tick, getDelay) {
    this.stop();
    const generation = this.generation_;
    const next = () => {
      this.handle_ = setTimeout(() => {
        if (generation !== this.generation_) return;
        if (this.isAlive_() && tick()) {
          if (generation === this.generation_) next();
        } else if (generation === this.generation_) {
          this.handle_ = null;
        }
      }, getDelay());
    };
    next();
  }

  /**
   * Adopta un temporizador creado fuera (compatibilidad con la asignación de "running").
   * @param {Number} handle Identificador.
   */
  adopt(handle) {
    this.stop();
    this.handle_ = handle;
  }

  /**
   * Detiene la reproducción.
   */
  stop() {
    this.generation_ += 1;
    if (this.handle_ !== null) {
      clearTimeout(this.handle_);
      clearInterval(this.handle_);
    }
    this.handle_ = null;
  }
}

/**
 * @classdesc
 * Opciones del selector de velocidad. Cada opción es un multiplicador de la velocidad
 * por defecto del modo (×1) con sus segundos por paso. La velocidad configurada
 * ("speed" o "speedDate") se preselecciona y, si su multiplicador no está entre los
 * estándar, se inserta en su lugar.
 *
 * @private
 */
class TimelineSpeed {
  /**
   * @param {Number} base Segundos por paso de ×1.
   * @param {Number|String} seconds Segundos por paso configurados.
   */
  constructor(base, seconds) {
    const configured = Number(seconds) > 0 ? Number(seconds) : base;
    const factor = TimelineSpeed.round(base / configured);
    this.options_ = SPEED_FACTORS.map((value) => ({ factor: value, seconds: base / value }));
    let selected = this.options_.find((option) => option.factor === factor);
    if (selected) {
      selected.seconds = configured;
    } else {
      selected = { factor, seconds: configured };
      this.options_.push(selected);
      this.options_.sort((a, b) => a.factor - b.factor);
    }
    this.selected_ = selected;
  }

  /**
   * Redondea un multiplicador a dos decimales.
   * @param {Number} value Valor.
   * @returns {Number} Valor redondeado.
   */
  static round(value) {
    return Math.round(value * 100) / 100;
  }

  /**
   * Número con el separador decimal del idioma.
   * @param {Number} value Valor.
   * @param {String} lang Idioma.
   * @returns {String} Texto.
   */
  static formatNumber(value, lang) {
    return value.toLocaleString(lang, { maximumFractionDigits: 2 });
  }

  /**
   * Opciones en orden ascendente.
   * @returns {Array<Object>} [{factor, seconds}].
   */
  get options() {
    return this.options_;
  }

  /**
   * Opción seleccionada.
   * @returns {Object} {factor, seconds}.
   */
  get selected() {
    return this.selected_;
  }

  /**
   * Selecciona la opción de un multiplicador.
   * @param {Number|String} factor Multiplicador.
   * @returns {Object|null} Opción seleccionada o null si no existe.
   */
  select(factor) {
    const option = this.options_.find((item) => item.factor === Number(factor));
    if (option) this.selected_ = option;
    return option ?? null;
  }
}

/**
 * @classdesc
 * Movimiento del rango con límite inferior fijo y superior móvil (formatMove
 * "discrete", por defecto en relative): avanzar y retroceder solo mueven el fin, que
 * nunca queda por debajo del inicio.
 *
 * @private
 */
class FixedStartMotion {
  /**
   * @param {Object} range Rango {init, end} en milisegundos.
   * @param {Object} limits Límites {min, max, step} en milisegundos.
   * @returns {Object|null} Nuevo rango o null si no hay movimiento.
   */
  forward({ init, end }, { max, step }) {
    return end < max ? { init, end: Math.min(end + step, max) } : null;
  }

  /**
   * @param {Object} range Rango {init, end} en milisegundos.
   * @param {Object} limits Límites {min, max, step} en milisegundos.
   * @returns {Object|null} Nuevo rango o null si no hay movimiento.
   */
  backward({ init, end }, { step }) {
    return end > init ? { init, end: Math.max(end - step, init) } : null;
  }

  /**
   * Primer estado de la reproducción: el fin, un paso después del inicio.
   * @param {Object} range Rango {init, end} en milisegundos.
   * @param {Object} limits Límites {min, max, step} en milisegundos.
   * @returns {Object} Nuevo rango.
   */
  rewind({ init }, { max, step }) {
    return { init, end: Math.min(init + step, max) };
  }
}

/**
 * @classdesc
 * Movimiento del rango como ventana deslizante (formatMove "continuous"): avanzar y
 * retroceder desplazan los dos límites y conservan el ancho hasta llegar al extremo.
 *
 * @private
 */
class SlidingWindowMotion {
  /**
   * @param {Object} range Rango {init, end} en milisegundos.
   * @param {Object} limits Límites {min, max, step} en milisegundos.
   * @returns {Object|null} Nuevo rango o null si no hay movimiento.
   */
  forward({ init, end }, { max, step }) {
    const shift = Math.min(step, max - end);
    return shift > 0 ? { init: init + shift, end: end + shift } : null;
  }

  /**
   * @param {Object} range Rango {init, end} en milisegundos.
   * @param {Object} limits Límites {min, max, step} en milisegundos.
   * @returns {Object|null} Nuevo rango o null si no hay movimiento.
   */
  backward({ init, end }, { min, step }) {
    const shift = Math.min(step, init - min);
    return shift > 0 ? { init: init - shift, end: end - shift } : null;
  }

  /**
   * Primer estado de la reproducción: la ventana al principio. Si ocupa todo el
   * rango, su ancho pasa a ser un paso.
   * @param {Object} range Rango {init, end} en milisegundos.
   * @param {Object} limits Límites {min, max, step} en milisegundos.
   * @returns {Object} Nuevo rango.
   */
  rewind({ init, end }, { min, max, step }) {
    const width = end - init > 0 && end - init < max - min ? end - init : Math.min(step, max - min);
    return { init: min, end: min + width };
  }
}

/**
 * Estrategias de movimiento del rango por formatMove.
 * @const
 * @private
 */
const RANGE_MOTIONS = {
  discrete: new FixedStartMotion(),
  continuous: new SlidingWindowMotion(),
};

/**
 * @classdesc
 * Capas que utiliza Timeline: orden y posición en el visualizador, resolución de
 * definiciones (mecanismo general de la API) y referencias a capas existentes,
 * compatibilidad (consultada a la implementación), propiedad y restauración.
 *
 * Una capa "prestada" ya estaba en el mapa: nunca se añade ni se retira, y al
 * liberarla recupera su visibilidad. Una capa "propia" la crea Timeline, que la añade
 * y la retira. Las relaciones se guardan aquí; nunca se escriben en las capas.
 *
 * @private
 */
class TimelineLayers {
  /**
   * @param {IDEE.control.Timeline} host Control.
   */
  constructor(host) {
    this.host_ = host;
    this.states_ = new Map();
    this.updating_ = false;
    this.listenedMap_ = null;
    this.onLayersAdded_ = null;
    this.onLayersRemoved_ = null;
  }

  /**
   * Interpreta una definición de capa (cadena "TIPO*..." o configuración con "type")
   * con el mecanismo general de la API (buildLayer y parameter.layer).
   * El formato WMTS histórico de Timeline (WMTS*leyenda*url*nombre) se reordena
   * al formato de la API.
   * @param {String|Object} definition Definición.
   * @returns {Object|null} {normalized, params} o null si no es válida.
   */
  static parseDefinition(definition) {
    let normalized = definition;
    if (isString(normalized)) {
      normalized = TimelineLayers.adaptHistoricWMTS(normalized.trim());
    }
    try {
      normalized = buildLayer(normalized);
      const params = parameter.layer(normalized);
      const type = params?.type ?? parameter.getType(normalized);
      if (isNullOrEmpty(type)) return null;
      return { normalized, params: { ...params, type } };
    } catch (error) {
      return null;
    }
  }

  /**
   * Reordena el formato histórico WMTS*leyenda*url*nombre a WMTS*url*nombre.
   * @param {String} definition Definición.
   * @returns {String} Definición en el formato de la API.
   */
  static adaptHistoricWMTS(definition) {
    const parts = definition.split('*');
    if (parts[0].toUpperCase() === 'WMTS' && parts.length >= 4
      && !isUrl(parts[1]) && isUrl(parts[2])) {
      return ['WMTS', parts[2], parts[3]].join('*');
    }
    return definition;
  }

  /**
   * Compara dos URL ignorando separadores finales y resolviendo las relativas.
   * @param {String} a URL.
   * @param {String} b URL.
   * @returns {Boolean} Verdadero si son la misma.
   */
  static sameUrl(a, b) {
    if (isNullOrEmpty(a) || isNullOrEmpty(b)) return isNullOrEmpty(a) && isNullOrEmpty(b);
    const normalize = (url) => {
      let text = `${url}`;
      try {
        text = new URL(text, window.location.href).href;
      } catch (error) {
        // URL no resoluble: se compara el texto
      }
      return text.replace(/[?&/]+$/, '');
    };
    return normalize(a) === normalize(b);
  }

  /**
   * Mapa del control.
   * @returns {IDEE.Map} Mapa.
   */
  get map() {
    return this.host_.map;
  }

  /**
   * Implementación del control.
   * @returns {Object} Implementación.
   */
  getImpl() {
    return this.host_.getImpl();
  }

  /**
   * Indica si la implementación dispone de funcionalidad temporal.
   * @returns {Boolean} Verdadero si está disponible.
   */
  isSupported() {
    const impl = this.getImpl();
    return isFunction(impl?.isSupported) && impl.isSupported() === true;
  }

  /**
   * Indica si la capa (o un descriptor con "type") es compatible con la modalidad.
   * @param {IDEE.layer.Layer|Object} layer Capa.
   * @returns {Boolean} Verdadero si es compatible.
   */
  isEligible(layer) {
    const impl = this.getImpl();
    return !isNullOrEmpty(layer) && isFunction(impl?.supportsLayer)
      && impl.supportsLayer(layer, this.host_.timelineType) === true;
  }

  /**
   * Avisa de que una capa no es compatible con la modalidad.
   * @param {IDEE.layer.Layer|Object} layer Capa o descriptor.
   */
  warnIncompatible(layer) {
    warn(formatText(getValue('timeline').incompatible_layer, {
      layer: layer?.name ?? '',
      type: layer?.type ?? '',
      mode: this.host_.timelineType,
    }));
  }

  /**
   * Capas del mapa, sin las internas.
   * @returns {Array<IDEE.layer.Layer>} Capas.
   */
  mapLayers() {
    const layers = this.map?.getLayers?.() ?? [];
    return layers.filter((layer) => !INTERNAL_LAYER_NAMES.includes(layer.name));
  }

  /**
   * Capas del visualizador de arriba abajo, como las muestra el LayerSwitcher:
   * zIndex descendente; a igual zIndex, la añadida después primero. Se excluyen las
   * capas con displayInLayerSwitcher a falso.
   * @returns {Array<IDEE.layer.Layer>} Capas ordenadas.
   */
  viewerLayers() {
    return this.mapLayers()
      .filter((layer) => layer.displayInLayerSwitcher !== false)
      .map((layer, index) => ({ layer, index, zIndex: Number(layer.getZIndex?.()) || 0 }))
      .sort((a, b) => (b.zIndex - a.zIndex) || (b.index - a.index))
      .map(({ layer }) => layer);
  }

  /**
   * Posición de la capa en el visualizador (base 1, 1 = capa superior).
   * @param {IDEE.layer.Layer} layer Capa.
   * @returns {Number|null} Posición o null si no está en el visualizador.
   */
  positionOf(layer) {
    const index = this.viewerLayers().indexOf(layer);
    return index === -1 ? null : index + 1;
  }

  /**
   * Capa en una posición del visualizador (base 1, 1 = capa superior).
   * @param {Number} position Posición.
   * @returns {IDEE.layer.Layer|null} Capa.
   */
  layerAt(position) {
    const value = Number(position);
    if (!Number.isInteger(value) || value < 1) return null;
    return this.viewerLayers()[value - 1] ?? null;
  }

  /**
   * Ordena capas según el visualizador; las que no están en él van al final.
   * @param {Array<IDEE.layer.Layer>} layers Capas.
   * @returns {Array<IDEE.layer.Layer>} Capas ordenadas.
   */
  sortByViewer(layers) {
    const order = this.viewerLayers();
    const rank = (layer) => {
      const index = order.indexOf(layer);
      return index === -1 ? Number.MAX_SAFE_INTEGER : index;
    };
    return [...layers].sort((a, b) => rank(a) - rank(b));
  }

  /**
   * Indica si la capa está en el mapa.
   * @param {IDEE.layer.Layer} layer Capa.
   * @returns {Boolean} Verdadero si está.
   */
  inMap(layer) {
    return !isNullOrEmpty(layer) && this.mapLayers().includes(layer);
  }

  /**
   * Indica si la capa la ha creado Timeline.
   * @param {IDEE.layer.Layer} layer Capa.
   * @returns {Boolean} Verdadero si es propia.
   */
  isOwned(layer) {
    return this.states_.get(layer)?.owned === true;
  }

  /**
   * Indica si Timeline utiliza la capa.
   * @param {IDEE.layer.Layer} layer Capa.
   * @returns {Boolean} Verdadero si está registrada.
   */
  has(layer) {
    return this.states_.has(layer);
  }

  /**
   * Registra una capa y guarda su estado original.
   * @param {IDEE.layer.Layer} layer Capa.
   * @param {Boolean} owned Creada por Timeline.
   * @returns {IDEE.layer.Layer} Capa.
   */
  register(layer, owned) {
    if (!this.states_.has(layer)) {
      let visible = true;
      try {
        visible = layer.isVisible();
      } catch (error) {
        visible = true;
      }
      this.states_.set(layer, {
        owned,
        visible,
        displayInLayerSwitcher: layer.displayInLayerSwitcher,
      });
    }
    return layer;
  }

  /**
   * Olvida una capa que todavía no se ha modificado (por ejemplo, incompatible).
   * @param {IDEE.layer.Layer} layer Capa.
   */
  forget(layer) {
    this.states_.delete(layer);
  }

  /**
   * Resuelve una capa a partir de una instancia, una definición "TIPO*..." o una
   * configuración con "type" (mecanismo general de la API), o una referencia por
   * nombre/leyenda a una capa existente.
   * @param {*} reference Capa, definición o referencia.
   * @param {Object} [options] Opciones.
   * @param {Boolean} [options.legacyName=false] Admite la coincidencia parcial histórica.
   * @param {Boolean} [options.quiet=false] No avisa si no se encuentra.
   * @returns {IDEE.layer.Layer|null} Capa.
   */
  resolve(reference, { legacyName = false, quiet = false } = {}) {
    if (isNullOrEmpty(reference)) return null;
    let layer = null;
    let warned = false;
    if (reference instanceof Layer) {
      const owned = this.states_.has(reference)
        ? this.isOwned(reference) : !this.inMap(reference);
      layer = this.register(reference, owned);
    } else if (isString(reference) && !reference.includes('*')) {
      layer = this.findByName(reference, legacyName);
      if (layer) this.register(layer, false);
    } else if (isString(reference) || !isNullOrEmpty(reference.type)) {
      const parsed = TimelineLayers.parseDefinition(reference);
      if (parsed) {
        layer = this.findExisting(parsed.params);
        if (layer) {
          this.register(layer, false);
        } else if (!this.isEligible(parsed.params)) {
          this.warnIncompatible(parsed.params);
          warned = true;
        } else {
          layer = this.create(parsed.normalized);
        }
      }
    } else if (isObject(reference)) {
      layer = this.findByObject(reference);
      if (layer) this.register(layer, false);
    }
    if (isNullOrEmpty(layer) && !quiet && !warned) {
      warn(formatText(getValue('timeline').layer_not_found, {
        layer: describeReference(reference),
      }));
    }
    return layer ?? null;
  }

  /**
   * Crea una capa con el constructor general de la API (Map#getLayerByString).
   * @param {String|Object} definition Definición normalizada.
   * @returns {IDEE.layer.Layer|null} Capa propia.
   */
  create(definition) {
    let layer = null;
    try {
      layer = this.map.getLayerByString(definition);
    } catch (error) {
      layer = null;
    }
    return layer ? this.register(layer, true) : null;
  }

  /**
   * Busca una capa existente (no propia) equivalente a una definición:
   * mismo tipo, nombre y URL. Entre varias se prefiere la de la misma leyenda
   * y, después, la superior en el visualizador.
   * @param {Object} params Parámetros de la definición.
   * @returns {IDEE.layer.Layer|null} Capa.
   */
  findExisting(params) {
    const candidates = this.mapLayers().filter((layer) => !this.isOwned(layer)
      && layer.type === params.type
      && (isNullOrEmpty(params.name) || layer.name === params.name)
      && (isNullOrEmpty(params.url) || TimelineLayers.sameUrl(layer.url, params.url)));
    if (candidates.length === 0) return null;
    const ordered = this.sortByViewer(candidates);
    return ordered.find((layer) => !isNullOrEmpty(params.legend)
      && layer.legend === params.legend) ?? ordered[0];
  }

  /**
   * Busca una capa existente por nombre y, si no, por leyenda. Con legacyName admite
   * la coincidencia parcial histórica (la referencia contiene el nombre de la capa).
   * @param {String} name Nombre o leyenda.
   * @param {Boolean} legacyName Coincidencia parcial.
   * @returns {IDEE.layer.Layer|null} Capa.
   */
  findByName(name, legacyName) {
    const candidates = this.sortByViewer(this.mapLayers()
      .filter((layer) => !this.isOwned(layer)));
    let layer = candidates.find((l) => l.name === name)
      ?? candidates.find((l) => l.legend === name);
    if (!layer && legacyName) {
      layer = candidates.find((l) => !isNullOrEmpty(l.name) && name.includes(l.name));
      if (layer) {
        warn(formatText(getValue('timeline').legacy_reference, {
          reference: name,
          layer: layer.name,
        }));
      }
    }
    return layer ?? null;
  }

  /**
   * Busca una capa existente equivalente a un objeto sin tipo (nombre o leyenda).
   * @param {Object} object Objeto.
   * @returns {IDEE.layer.Layer|null} Capa.
   */
  findByObject(object) {
    return this.sortByViewer(this.mapLayers()).find((layer) => layer === object
      || (!isNullOrEmpty(object.name) && layer.name === object.name)
      || (!isNullOrEmpty(object.legend) && layer.legend === object.legend)) ?? null;
  }

  /**
   * Busca una capa del mapa por identidad y, si no, por leyenda.
   * @param {IDEE.layer.Layer} layerSearch Capa.
   * @returns {IDEE.layer.Layer|undefined} Capa del mapa.
   */
  findInMap(layerSearch) {
    if (isNullOrEmpty(layerSearch)) return undefined;
    const layers = this.mapLayers();
    return layers.find((layer) => layer === layerSearch)
      ?? layers.find((layer) => !isNullOrEmpty(layerSearch.legend)
        && layer.legend === layerSearch.legend);
  }

  /**
   * Prepara una capa como paso de absoluteSimple: oculta y, si es propia, fuera del
   * LayerSwitcher (comportamiento histórico).
   * @param {IDEE.layer.Layer} layer Capa.
   */
  prepareStep(layer) {
    if (this.isOwned(layer)) {
      // eslint-disable-next-line no-param-reassign
      layer.displayInLayerSwitcher = false;
    }
    this.setVisible(layer, false);
  }

  /**
   * Añade al mapa una capa propia que no esté en él.
   * @param {IDEE.layer.Layer} layer Capa.
   */
  attach(layer) {
    if (this.isOwned(layer) && this.map && !this.inMap(layer)) {
      this.silently(() => this.map.addLayers(layer));
    }
  }

  /**
   * Retira del mapa una capa propia.
   * @param {IDEE.layer.Layer} layer Capa.
   */
  detach(layer) {
    if (this.isOwned(layer) && this.map && this.inMap(layer)) {
      this.silently(() => this.map.removeLayers(layer));
    }
  }

  /**
   * Cambia la visibilidad de una capa si es necesario.
   * @param {IDEE.layer.Layer} layer Capa.
   * @param {Boolean} visible Visibilidad.
   */
  setVisible(layer, visible) {
    if (isNullOrEmpty(layer)) return;
    try {
      if (layer.isVisible() !== visible) layer.setVisible(visible);
    } catch (error) {
      layer.setVisible(visible);
    }
  }

  /**
   * Aplica un filtro temporal mediante la implementación.
   * @param {IDEE.layer.Layer} layer Capa.
   * @param {TemporalFilter} temporalFilter Filtro.
   * @returns {Boolean} Verdadero si se ha aplicado.
   */
  applyFilter(layer, temporalFilter) {
    const impl = this.getImpl();
    return isFunction(impl?.applyTemporalFilter)
      && impl.applyTemporalFilter(layer, temporalFilter) === true;
  }

  /**
   * Restaura el filtro previo de una capa mediante la implementación.
   * @param {IDEE.layer.Layer} layer Capa.
   */
  clearFilter(layer) {
    const impl = this.getImpl();
    if (isFunction(impl?.removeTemporalFilter)) impl.removeTemporalFilter(layer);
  }

  /**
   * Ejecuta una operación sobre el mapa sin reaccionar a sus eventos de capas.
   * @param {Function} operation Operación.
   */
  silently(operation) {
    this.updating_ = true;
    try {
      operation();
    } finally {
      this.updating_ = false;
    }
  }

  /**
   * Capas que Timeline utiliza y están en el mapa.
   * @returns {Array<IDEE.layer.Layer>} Capas.
   */
  getActiveLayers() {
    return [...this.states_.keys()].filter((layer) => this.inMap(layer));
  }

  /**
   * Libera todas las capas: restaura filtros, retira las propias y devuelve a las
   * prestadas su visibilidad y su displayInLayerSwitcher originales.
   */
  releaseAll() {
    this.states_.forEach((state, layer) => {
      this.clearFilter(layer);
      if (state.owned) {
        this.detach(layer);
      } else {
        this.setVisible(layer, state.visible);
        if (layer.displayInLayerSwitcher !== state.displayInLayerSwitcher) {
          // eslint-disable-next-line no-param-reassign
          layer.displayInLayerSwitcher = state.displayInLayerSwitcher;
        }
      }
    });
    this.states_.clear();
  }

  /**
   * Escucha las capas que se añaden o retiran del mapa. Ignora las operaciones del
   * propio Timeline y las que solo afectan a capas propias.
   * @param {Function} callback Recibe (capas, añadidas).
   */
  listen(callback) {
    this.unlisten();
    const { map } = this;
    if (isNullOrEmpty(map)) return;
    const notify = (payload, added) => {
      if (this.updating_) return;
      const layers = [].concat(payload ?? []).filter((layer) => layer instanceof Layer);
      if (layers.length > 0 && layers.every((layer) => this.isOwned(layer))) return;
      callback(layers, added);
    };
    this.onLayersAdded_ = (payload) => notify(payload, true);
    this.onLayersRemoved_ = (payload) => notify(payload, false);
    map.on(EventType.ADDED_LAYER, this.onLayersAdded_, this);
    map.on(EventType.REMOVED_LAYER, this.onLayersRemoved_, this);
    this.listenedMap_ = map;
  }

  /**
   * Deja de escuchar el mapa.
   */
  unlisten() {
    if (this.listenedMap_) {
      this.listenedMap_.un(EventType.ADDED_LAYER, this.onLayersAdded_, this);
      this.listenedMap_.un(EventType.REMOVED_LAYER, this.onLayersRemoved_, this);
    }
    this.listenedMap_ = null;
    this.onLayersAdded_ = null;
    this.onLayersRemoved_ = null;
  }
}

/**
 * @classdesc
 * Interpretación y normalización de la opción "intervals": cadena JSON (con los
 * sustitutos históricos !! y ¡¡), formato clásico [name, tag, service] y formato
 * extendido {id, init, end, layer|service, attributeParam, grupo, equalsTimeLine}.
 *
 * @private
 */
class TimelineIntervals {
  /**
   * Interpreta la opción intervals.
   * @param {Array|String} rawIntervals Intervalos.
   * @returns {Array|undefined} Intervalos o undefined si no se indicaron.
   */
  static parse(rawIntervals) {
    if (!isString(rawIntervals)) return rawIntervals;
    try {
      return JSON.parse(
        rawIntervals
          .replace(/!!/g, '[')
          .replace(/¡¡/g, ']')
          .replace(/\u00a0/g, ' '),
      );
    } catch (error) {
      warn(getValue('timeline').intervals_error);
      return [];
    }
  }

  /**
   * Devuelve la definición o referencia de capa de un intervalo extendido.
   * "service" es alias de "layer".
   * @param {Object} interval Intervalo.
   * @returns {*} Capa, definición o referencia.
   */
  static getReference(interval) {
    return interval?.layer ?? interval?.service;
  }

  /**
   * Normaliza los intervalos según el tipo de timeline.
   * @param {Array} intervals Intervalos originales.
   * @param {Boolean} dynamic Timeline absolute/relative.
   * @returns {Array} Intervalos normalizados.
   */
  static normalize(intervals, dynamic) {
    if (!isArray(intervals)) return [];
    if (dynamic) {
      return intervals.map((interval, index) => TimelineIntervals
        .normalizeDynamic(interval, index));
    }
    return intervals.map((interval, index) => TimelineIntervals
      .normalizeSimple(interval, index));
  }

  /**
   * Normaliza un intervalo para timelines dinámicos. El formato posicional admite
   * [name, tag, service] y [name, tag, service, init, end] (documentado en la API REST);
   * sin init/end se usa tag.
   * @param {Array|Object} interval Intervalo.
   * @param {Number} index Índice.
   * @returns {Object} Intervalo extendido.
   */
  static normalizeDynamic(interval, index) {
    if (isArray(interval)) {
      const [name, tag, service, init, end] = interval;
      return {
        id: `${index}`,
        init: TimelineDates.normalizeInitDate(init ?? tag),
        end: TimelineDates.normalizeEndDate(end ?? tag),
        layer: service,
        name,
      };
    }

    if (isObject(interval)) {
      const normalized = {
        ...interval,
        id: interval.id ?? `${index}`,
      };
      if (isUndefined(normalized.layer) && !isUndefined(interval.service)) {
        normalized.layer = interval.service;
      }
      if (!isUndefined(interval.init)) {
        normalized.init = TimelineDates.normalizeInitDate(interval.init);
      }
      if (!isUndefined(interval.end)) {
        normalized.end = TimelineDates.normalizeEndDate(interval.end);
      }
      return normalized;
    }

    return interval;
  }

  /**
   * Normaliza un intervalo para timelines absoluteSimple.
   * @param {Array|Object} interval Intervalo.
   * @param {Number} index Índice.
   * @returns {Array} Intervalo clásico [name, tag, service].
   */
  static normalizeSimple(interval, index) {
    if (!isArray(interval) && isObject(interval)) {
      const {
        id, init, end, name, tag,
      } = interval;
      const layer = TimelineIntervals.getReference(interval);
      return [
        name ?? TimelineIntervals.getLayerName(layer, id ?? `${index}`),
        tag ?? TimelineIntervals.getIntervalTag(init, end),
        layer,
      ];
    }
    return interval;
  }

  /**
   * Convierte init y end de los intervalos dinámicos a ISO. Los intervalos con fechas
   * no válidas se descartan con un aviso.
   * @param {Array<Object>} intervals Intervalos extendidos.
   * @returns {Array<Object>} Intervalos con fechas ISO.
   */
  static toDynamicDates(intervals) {
    return intervals.map((interval) => {
      try {
        const [init, end] = TimelineDates.transformTimeNumbToDate(interval.init, interval.end);
        return { ...interval, init, end };
      } catch (error) {
        warn(`${getValue('timeline').intervals_error}: ${interval?.id}`);
        return null;
      }
    }).filter((interval) => interval !== null);
  }

  /**
   * Agrupa las capas por año (absoluteSimple).
   * @param {Array} intervals Intervalos clásicos.
   * @returns {Object} Intervalos agrupados por año.
   */
  static buildGroups(intervals = []) {
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
   * Obtiene la etiqueta temporal (año final) de un intervalo.
   * @param {String|Number} init Fecha inicial.
   * @param {String|Number} end Fecha final.
   * @returns {String} Etiqueta.
   */
  static getIntervalTag(init, end) {
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
   * Obtiene un nombre representativo para una capa, definición o referencia.
   * @param {Object|String} layer Capa.
   * @param {String} fallback Valor alternativo.
   * @returns {String} Nombre.
   */
  static getLayerName(layer, fallback = '') {
    if (isString(layer)) {
      if (layer.includes('*')) {
        const params = TimelineLayers.parseDefinition(layer)?.params;
        return params?.legend || params?.name || layer.split('*')[1] || fallback;
      }
      return layer;
    }

    return layer?.legend ?? layer?.name ?? fallback;
  }
}

/**
 * @classdesc
 * Controles de reproducción del panel: retroceso, play/pausa, avance y velocidad.
 * Lleva el bucle de reproducción y el estado de los botones; el movimiento lo hace el
 * modo, que implementa speedProperty, speedBase, canPlay(), stepForward(),
 * stepBackward(), isAtEnd(), rewind() y onPlaybackChange(playing).
 *
 * Play desde el final vuelve a empezar; si no, avanza un paso en el acto. Después
 * avanza un paso cada host[speedProperty] segundos y se detiene en el último estado.
 *
 * @private
 */
class TimelineTransport {
  /**
   * @param {IDEE.control.Timeline} host Control (configuración, traducciones y elemento).
   * @param {SimpleTimelineMode|DynamicTimelineMode} mode Modo.
   * @param {Object} context Colaboradores.
   * @param {TimelinePlayer} context.player Reproductor.
   * @param {Function} context.fireChange Notifica un cambio de estado.
   */
  constructor(host, mode, context) {
    this.host_ = host;
    this.mode_ = mode;
    this.player_ = context.player;
    this.fireChange_ = context.fireChange;
    this.speed_ = new TimelineSpeed(mode.speedBase, host[mode.speedProperty]);
  }

  /**
   * Busca un elemento dentro del control.
   * @param {String} selector Selector CSS.
   * @returns {HTMLElement|null} Elemento.
   */
  query(selector) {
    return this.host_.getElement()?.querySelector(selector) ?? null;
  }

  /**
   * Botón de play/pausa.
   * @returns {HTMLButtonElement|null} Botón.
   */
  get playButton() {
    return this.query('[data-timeline-action="play"]');
  }

  /**
   * Selector de velocidad.
   * @returns {HTMLSelectElement|null} Selector.
   */
  get speedSelect() {
    return this.query('.m-timeline-speed');
  }

  /**
   * Enlaza los botones, pinta el selector de velocidad y aplica "animation": con
   * false se ocultan play/pausa y la velocidad, y quedan avance y retroceso.
   */
  bind() {
    const actions = {
      back: () => this.step(false),
      play: () => this.toggle(),
      forward: () => this.step(true),
    };
    this.host_.getElement().querySelectorAll('[data-timeline-action]').forEach((button) => {
      button.addEventListener('click', () => actions[button.dataset.timelineAction]?.());
    });
    this.renderSpeed();
    const animated = this.host_.animation !== false;
    [this.playButton, this.speedSelect].forEach((element) => {
      // eslint-disable-next-line no-param-reassign
      if (element) element.hidden = !animated;
    });
    this.setPlaying(false);
  }

  /**
   * Pinta las opciones de velocidad con la configurada seleccionada.
   */
  renderSpeed() {
    const select = this.speedSelect;
    if (!select) return;
    const lang = getLang();
    const { translation } = this.host_;
    select.textContent = '';
    this.speed_.options.forEach((option) => {
      const element = document.createElement('option');
      element.value = String(option.factor);
      element.textContent = `×${TimelineSpeed.formatNumber(option.factor, lang)}`;
      element.title = formatText(translation.speed_option, {
        seconds: TimelineSpeed.formatNumber(option.seconds, lang),
      });
      element.selected = option === this.speed_.selected;
      select.appendChild(element);
    });
    select.addEventListener('change', () => this.setSpeed(select.value));
  }

  /**
   * Aplica una velocidad: escribe sus segundos por paso en el control y la siguiente
   * pausa de la reproducción ya la usa.
   * @param {Number|String} factor Multiplicador.
   */
  setSpeed(factor) {
    const option = this.speed_.select(factor);
    if (!option) return;
    this.host_[this.mode_.speedProperty] = option.seconds;
    this.fireChange_('speed');
  }

  /**
   * Indica si hay una reproducción en curso.
   * @returns {Boolean} Verdadero si se reproduce.
   */
  isPlaying() {
    return this.player_.isRunning();
  }

  /**
   * Reproduce o pausa.
   */
  toggle() {
    if (this.isPlaying()) this.pause();
    else this.play();
  }

  /**
   * Inicia la reproducción.
   * @returns {Boolean} Verdadero si se ha iniciado.
   */
  play() {
    if (this.isPlaying() || !this.mode_.canPlay()) return false;
    const moved = this.mode_.isAtEnd() ? this.mode_.rewind() : this.mode_.stepForward();
    if (!moved) return false;
    this.player_.loop(() => this.tick(), () => this.getDelay());
    this.setPlaying(true);
    this.fireChange_('play');
    return true;
  }

  /**
   * Paso de la reproducción: avanza o, si ya está en el final, la detiene.
   * @returns {Boolean} Verdadero si la reproducción continúa.
   */
  tick() {
    if (!this.mode_.isAtEnd() && this.mode_.stepForward()) return true;
    this.pause();
    return false;
  }

  /**
   * Detiene la reproducción.
   * @returns {Boolean} Verdadero si estaba en curso.
   */
  pause() {
    if (!this.isPlaying()) return false;
    this.player_.stop();
    this.setPlaying(false);
    this.fireChange_('play');
    return true;
  }

  /**
   * Avanza o retrocede un paso; antes pausa la reproducción.
   * @param {Boolean} forward Verdadero para avanzar.
   * @returns {Boolean} Verdadero si se ha movido.
   */
  step(forward) {
    this.pause();
    return forward ? this.mode_.stepForward() : this.mode_.stepBackward();
  }

  /**
   * Retardo entre pasos en milisegundos.
   * @returns {Number} Milisegundos.
   */
  getDelay() {
    const seconds = Number(this.host_[this.mode_.speedProperty]);
    return (seconds > 0 ? seconds : this.mode_.speedBase) * 1000;
  }

  /**
   * Refleja el estado en el botón de play/pausa: icono, título y etiqueta traducidos.
   * @param {Boolean} playing Reproduciendo.
   */
  setPlaying(playing) {
    const button = this.playButton;
    if (button) {
      const text = playing ? this.host_.translation.pause : this.host_.translation.play;
      button.classList.toggle('g-cartografia-control-pausa', playing);
      button.classList.toggle('g-cartografia-control-siguiente', !playing);
      button.title = text;
      button.setAttribute('aria-label', text);
    }
    this.mode_.onPlaybackChange(playing);
  }

  /**
   * Activa o desactiva todos los controles de reproducción.
   * @param {Boolean} disabled Desactivados.
   */
  setDisabled(disabled) {
    this.host_.getElement().querySelectorAll('[data-timeline-action], .m-timeline-speed')
      .forEach((element) => {
        // eslint-disable-next-line no-param-reassign
        element.disabled = disabled;
      });
  }
}

/**
 * @classdesc
 * Estrategia de interfaz y comportamiento de timelineType "absoluteSimple": cada paso
 * del deslizador muestra las capas de un año (selector por paso) y oculta el resto.
 * Mantiene los atributos "intervals" e "intervalsGrouped" del control.
 *
 * @private
 */
class SimpleTimelineMode {
  /**
   * @param {IDEE.control.Timeline} host Control (atributos públicos de estado y
   * configuración, y su elemento DOM).
   * @param {Object} context Colaboradores del control.
   * @param {TimelineLayers} context.layers Capas del control.
   * @param {TimelinePlayer} context.player Reproductor.
   * @param {Function} context.showNotice Muestra un aviso en el panel.
   * @param {Function} context.hideNotice Oculta el aviso.
   * @param {Function} context.fireChange Notifica un cambio de estado.
   * @param {Function} context.pausePlayback Pausa la reproducción.
   * @param {Function} [context.getPreviousKey] Clave de la selección previa.
   */
  constructor(host, context) {
    this.host_ = host;
    this.context_ = context;
    this.layers_ = context.layers;
    this.player_ = context.player;
    /**
     * Atributo del control con los segundos por paso y su valor para ×1.
     * @type {String}
     */
    this.speedProperty = 'speed';
    this.speedBase = DEFAULT_SPEED;
  }

  /**
   * Capas del control.
   * @returns {TimelineLayers} Capas.
   */
  get layers() {
    return this.layers_;
  }

  /**
   * Busca un elemento dentro del control.
   * @param {String} selector Selector CSS.
   * @returns {HTMLElement|null} Elemento.
   */
  query(selector) {
    return this.host_.getElement()?.querySelector(selector) ?? null;
  }

  /**
   * Deslizador del control.
   * @returns {HTMLInputElement} Deslizador.
   */
  get slider() {
    return this.query('.m-timeline-slider-input');
  }

  /**
   * Construye la vista, resuelve las capas y activa el paso por defecto.
   */
  build() {
    const host = this.host_;
    this.resolveGroups();
    host.intervals = this.buildSteps();
    this.renderTags();

    const { slider } = this;
    slider.setAttribute('max', host.intervals.length - 1);
    slider.addEventListener('input', () => host.changeSlider(slider));
    slider.addEventListener('change', () => {
      this.query('.div-m-timeline-slider').style.setProperty('--opacity', '0');
      this.context_.pausePlayback();
    });

    if (!this.hasLayers()) this.context_.showNotice(host.translation.no_layers);
    slider.value = this.getDefaultStep();
    host.changeSlider(slider);
    this.layers.listen((layers, added) => this.onMapChange(added));
  }

  /**
   * Resuelve la capa de cada elemento de intervalsGrouped.
   * @param {Boolean} [quiet=false] Sin avisos (reintentos).
   * @returns {Boolean} Verdadero si alguna capa nueva se ha resuelto.
   */
  resolveGroups(quiet = false) {
    let changed = false;
    Object.values(this.host_.intervalsGrouped).forEach((intervalsByYear) => {
      intervalsByYear.forEach((iByYear) => {
        if (quiet && !isNullOrEmpty(iByYear.layer)) return;
        const layer = this.resolveStepLayer(iByYear, quiet);
        if (!isNullOrEmpty(layer)) changed = true;
        // eslint-disable-next-line no-param-reassign
        iByYear.layer = layer;
      });
    });
    return changed;
  }

  /**
   * Resuelve, comprueba y prepara la capa de un elemento.
   * @param {Object} iByYear Elemento de intervalsGrouped.
   * @param {Boolean} quiet Sin avisos.
   * @returns {IDEE.layer.Layer|null} Capa.
   */
  resolveStepLayer(iByYear, quiet) {
    const layer = this.layers.resolve(iByYear.service, { legacyName: true, quiet });
    if (isNullOrEmpty(layer)) return null;
    if (!this.layers.isEligible(layer)) {
      this.layers.warnIncompatible(layer);
      this.layers.forget(layer);
      return null;
    }
    this.layers.prepareStep(layer);
    this.layers.attach(layer);
    return layer;
  }

  /**
   * Pasos del deslizador a partir de intervalsGrouped.
   * @returns {Array<Object>} [{number, name, tag, service}].
   */
  buildSteps() {
    return Object.values(this.host_.intervalsGrouped).map((intervalsByYear, k) => {
      const interval = intervalsByYear.find((iByYear) => iByYear.selected) ?? intervalsByYear[0];
      return {
        number: k,
        name: interval.name,
        tag: interval.year,
        service: interval.layer ?? null,
      };
    });
  }

  /**
   * Indica si algún paso tiene capa.
   * @returns {Boolean} Verdadero si hay capas.
   */
  hasLayers() {
    return Object.values(this.host_.intervalsGrouped)
      .some((group) => group.some((iByYear) => !isNullOrEmpty(iByYear.layer)));
  }

  /**
   * Pinta las etiquetas del deslizador (primera, central y última).
   */
  renderTags() {
    const { intervals } = this.host_;
    const tags = this.query('.slider-tags');
    tags.textContent = '';
    intervals.forEach((interval, k) => {
      const tag = document.createElement('div');
      if (k !== 0 && k !== intervals.length - 1 && k
        !== parseInt(intervals.length / 2, 10)) {
        tag.dataset.tag = '';
      } else {
        tag.dataset.tag = interval.tag;
      }
      tags.append(tag);
    });
    this.query('.div-m-timeline-panel').style.setProperty('--num', intervals.length);
  }

  /**
   * Paso inicial: el que contiene la capa de layerPosition o, si no, el primero.
   * @returns {Number} Índice del paso.
   */
  getDefaultStep() {
    const { layerPosition } = this.host_;
    if (isNullOrEmpty(layerPosition)) return 0;
    const target = this.layers.layerAt(layerPosition);
    const groups = Object.values(this.host_.intervalsGrouped);
    const index = target
      ? groups.findIndex((group) => group.some((iByYear) => iByYear.layer === target))
      : -1;
    if (index === -1) {
      warn(formatText(this.host_.translation.invalid_layer_position, {
        position: layerPosition,
      }));
      return 0;
    }
    this.selectInGroup(index, target);
    return index;
  }

  /**
   * Selecciona una capa dentro del grupo de un paso.
   * @param {Number} stepIndex Paso.
   * @param {IDEE.layer.Layer} layer Capa.
   */
  selectInGroup(stepIndex, layer) {
    const host = this.host_;
    const group = Object.values(host.intervalsGrouped)[stepIndex];
    if (!group) return;
    group.forEach((iByYear) => {
      // eslint-disable-next-line no-param-reassign
      iByYear.selected = iByYear.layer === layer;
    });
    const selected = group.find((iByYear) => iByYear.selected);
    if (selected && host.intervals[stepIndex]) {
      host.intervals[stepIndex] = {
        ...host.intervals[stepIndex],
        service: selected.layer,
        name: selected.name,
      };
    }
  }

  /**
   * Muestra u oculta la capa de un paso.
   * @param {Object} interval Paso.
   * @param {Boolean} visible Visibilidad.
   */
  setIntervalLayerVisible(interval, visible) {
    if (interval?.service) {
      this.layers.setVisible(interval.service, visible);
    }
  }

  /**
   * Cambia las capas y la etiqueta al mover el deslizador.
   * @param {HTMLInputElement} elem Deslizador.
   */
  changeSlider(elem) {
    const host = this.host_;
    const sliderBox = this.query('.div-m-timeline-slider');
    const panel = this.query('.div-m-timeline-panel');
    if (!sliderBox || !panel) return;
    sliderBox.style.setProperty('--opacity', '0');
    const min = Number(elem.min);
    const max = Number(elem.max);
    const ratio = max > min ? (elem.value - min) / (max - min) : 0;
    const left = ratio * ((256 - 20) - 5);
    sliderBox.style.setProperty('--left', `${left}px`);
    const step = parseFloat(elem.value);
    host.intervals.forEach((interval) => {
      this.setIntervalLayerVisible(interval, false);
    });
    const entireStep = parseInt(step, 10);
    const entireInterval = host.intervals[entireStep];
    const entirreIntervalNextStep = entireStep + 1;
    const entireIntervalNext = host.intervals[entirreIntervalNextStep];
    this.query('.m-timeline-names-next').style.display = 'none';
    if (!entireInterval) return;
    this.renderLayerSelector(entireInterval, entireStep, '.m-timeline-names');
    if (step % 1 === 0 || !entireIntervalNext) {
      sliderBox.style.setProperty('--left', `${left + 20}px`);
      this.setIntervalLayerVisible(entireInterval, true);
      panel.style.setProperty('--valor', `"${entireInterval.tag}"`);
      sliderBox.style.setProperty('--opacity', entireInterval.tag !== '' ? '1' : '0');
    } else {
      this.setIntervalLayerVisible(entireInterval, true);
      this.setIntervalLayerVisible(entireIntervalNext, true);
      if (entireInterval.tag !== '' && entireIntervalNext.tag !== '') {
        sliderBox.style.setProperty('--left', `${left}px`);
        sliderBox.style.setProperty('--opacity', '1');
        panel.style.setProperty('--valor', `"${entireInterval.tag} - ${entireIntervalNext.tag}"`);
        this.renderLayerSelector(entireIntervalNext, entirreIntervalNextStep, '.m-timeline-names-next');
      } else if (entireInterval.tag === '' && entireIntervalNext.tag === '') {
        sliderBox.style.setProperty('--opacity', '0');
      } else {
        sliderBox.style.setProperty('--left', `${left + 20}px`);
        sliderBox.style.setProperty('--opacity', '10');
        panel.style.setProperty('--valor', `"${entireInterval.tag}${entireIntervalNext.tag}"`);
        this.renderLayerSelector(entireIntervalNext, entirreIntervalNextStep, '.m-timeline-names-next');
      }
    }
    this.context_.fireChange('step');
  }

  /**
   * Pinta el selector de capas de un paso (capas del mismo año).
   * @param {Object} interval Paso.
   * @param {Number} intervalIndex Índice del paso.
   * @param {String} selectorClass Selector del elemento select.
   */
  renderLayerSelector(interval, intervalIndex, selectorClass) {
    const host = this.host_;
    const year = interval.tag;
    /** @type {HTMLSelectElement} */
    const selector = this.query(selectorClass);
    selector.textContent = '';
    if (host.animation || interval.name !== '') {
      selector.style.display = 'block';
      selector.style.visibility = 'visible';
    }

    const emptyOption = document.createElement('option');
    emptyOption.value = EMPTY_LAYER_ID;
    emptyOption.textContent = host.translation.none;
    emptyOption.selected = interval.service === null;
    selector.appendChild(emptyOption);

    (host.intervalsGrouped[year] ?? []).forEach((intervalGroup) => {
      if (isNullOrEmpty(intervalGroup.layer)) return;
      const option = document.createElement('option');
      const position = this.layers.positionOf(intervalGroup.layer);
      option.value = intervalGroup.id;
      option.textContent = position ? `[${position}] ${intervalGroup.name}` : intervalGroup.name;
      option.selected = intervalGroup.selected && interval.service !== null;
      selector.appendChild(option);
    });
    selector.disabled = this.player_.isRunning();

    selector.onchange = (evt) => {
      const { value: intervalGroupId } = evt.target;
      const intervalsByYear = host.intervalsGrouped[year];

      if (intervalGroupId === EMPTY_LAYER_ID) {
        intervalsByYear.forEach((intervalByYear) => {
          this.layers.setVisible(intervalByYear.layer, false);
          // eslint-disable-next-line no-param-reassign
          intervalByYear.selected = false;
        });

        host.intervals[intervalIndex] = {
          ...host.intervals[intervalIndex],
          service: null,
          name: '',
        };
        this.context_.fireChange('layer');
        return;
      }

      intervalsByYear.forEach((intervalByYear, layerIndex) => {
        const isSelected = intervalByYear.id === intervalGroupId;
        this.layers.setVisible(intervalByYear.layer, isSelected);

        if (isSelected) {
          host.intervals[intervalIndex] = {
            ...host.intervals[intervalIndex],
            service: intervalByYear.layer,
            name: intervalByYear.name,
          };
        }

        host.intervalsGrouped[year][layerIndex].selected = isSelected;
      });
      this.context_.fireChange('layer');
    };
  }

  /**
   * Indica si hay pasos que reproducir.
   * @returns {Boolean} Verdadero si hay más de un paso.
   */
  canPlay() {
    return this.host_.intervals.length > 1;
  }

  /**
   * Mueve el deslizador al paso entero siguiente o anterior.
   * @param {Number} offset 1 (avanzar) o -1 (retroceder).
   * @returns {Boolean} Verdadero si se ha movido.
   */
  moveStep(offset) {
    const { slider } = this;
    if (!slider) return false;
    const value = parseFloat(slider.value);
    const target = offset > 0
      ? Math.min(Math.floor(value) + 1, Number(slider.max))
      : Math.max(Math.ceil(value) - 1, Number(slider.min));
    if (target === value) return false;
    slider.value = target;
    this.host_.changeSlider(slider);
    return true;
  }

  /**
   * Avanza un paso.
   * @returns {Boolean} Verdadero si se ha movido.
   */
  stepForward() {
    return this.moveStep(1);
  }

  /**
   * Retrocede un paso.
   * @returns {Boolean} Verdadero si se ha movido.
   */
  stepBackward() {
    return this.moveStep(-1);
  }

  /**
   * Indica si el deslizador está en el último paso.
   * @returns {Boolean} Verdadero en el último paso.
   */
  isAtEnd() {
    const { slider } = this;
    return !slider || parseFloat(slider.value) >= Number(slider.max);
  }

  /**
   * Vuelve al primer paso.
   * @returns {Boolean} Verdadero si se ha movido.
   */
  rewind() {
    const { slider } = this;
    if (!slider) return false;
    slider.value = slider.min;
    this.host_.changeSlider(slider);
    return true;
  }

  /**
   * Durante la reproducción los selectores de capa quedan desactivados.
   * @param {Boolean} playing Reproduciendo.
   */
  onPlaybackChange(playing) {
    ['.m-timeline-names', '.m-timeline-names-next'].forEach((selector) => {
      const element = this.query(selector);
      if (element) element.disabled = playing;
    });
  }

  /**
   * Elementos seleccionables en el orden de los pasos.
   * @returns {Array<Object>} Elementos.
   */
  getSelectable() {
    const current = parseInt(this.slider?.value ?? 0, 10);
    return Object.values(this.host_.intervalsGrouped).flatMap((group, step) => group
      .filter((iByYear) => !isNullOrEmpty(iByYear.layer))
      .map((iByYear) => ({
        id: iByYear.id,
        name: iByYear.name,
        tag: iByYear.year,
        step,
        layers: [iByYear.layer],
        position: this.layers.positionOf(iByYear.layer),
        selected: step === current && this.host_.intervals[step]?.service === iByYear.layer,
      })));
  }

  /**
   * Capa del paso actual.
   * @returns {IDEE.layer.Layer|null} Capa.
   */
  getSelectedLayer() {
    const current = parseInt(this.slider?.value ?? 0, 10);
    return this.host_.intervals[current]?.service ?? null;
  }

  /**
   * Selecciona el paso y la capa indicados.
   * @param {String|Number|IDEE.layer.Layer} reference Id, posición o capa.
   * @returns {Boolean} Verdadero si se ha seleccionado.
   */
  select(reference) {
    const target = typeof reference === 'number' ? this.layers.layerAt(reference) : reference;
    const item = this.getSelectable().find((entry) => entry.id === target
      || entry.layers[0] === target || entry.name === target);
    if (!item || !this.slider) return false;
    this.selectInGroup(item.step, item.layers[0]);
    this.slider.value = item.step;
    this.host_.changeSlider(this.slider);
    return true;
  }

  /**
   * Resuelve referencias pendientes cuando se añaden capas al mapa.
   * @param {Boolean} added Capas añadidas.
   */
  onMapChange(added) {
    if (!added || !this.resolveGroups(true)) return;
    const host = this.host_;
    host.intervals = this.buildSteps();
    this.context_.hideNotice();
    if (this.slider) host.changeSlider(this.slider);
  }

  /**
   * Vista sin funcionalidad temporal (implementación no soportada).
   */
  renderUnsupported() {
    this.context_.showNotice(this.host_.translation.not_supported);
    [this.slider, this.query('.m-timeline-names'), this.query('.m-timeline-names-next')]
      .forEach((element) => {
        if (element) element.setAttribute('disabled', '');
      });
  }
}

/**
 * @classdesc
 * Estrategia de interfaz y comportamiento de timelineType "absolute" y "relative":
 * selector de capas ordenado por su posición en el visualizador con una capa activa
 * por defecto, doble deslizador, fechas y reproducción. Mantiene los atributos
 * "allLayersDinamic" y "date" del control.
 *
 * @private
 */
class DynamicTimelineMode {
  /**
   * @param {IDEE.control.Timeline} host Control (atributos públicos de estado y
   * configuración, y su elemento DOM).
   * @param {Object} context Colaboradores del control.
   * @param {TimelineLayers} context.layers Capas del control.
   * @param {TimelinePlayer} context.player Reproductor.
   * @param {Function} context.showNotice Muestra un aviso en el panel.
   * @param {Function} context.hideNotice Oculta el aviso.
   * @param {Function} context.fireChange Notifica un cambio de estado.
   * @param {Function} context.pausePlayback Pausa la reproducción.
   * @param {Function} [context.getPreviousKey] Clave de la selección previa.
   */
  constructor(host, context) {
    this.host_ = host;
    this.context_ = context;
    this.layers_ = context.layers;
    this.player_ = context.player;
    /**
     * Atributo del control con los segundos por paso y su valor para ×1.
     * @type {String}
     */
    this.speedProperty = 'speedDate';
    this.speedBase = DEFAULT_SPEED_DATE;
    this.entries_ = new Map();
    this.order_ = [];
    this.pending_ = [];
    this.selected_ = null;
  }

  /**
   * Capas del control.
   * @returns {TimelineLayers} Capas.
   */
  get layers() {
    return this.layers_;
  }

  /**
   * Busca un elemento dentro del control.
   * @param {String} selector Selector CSS.
   * @returns {HTMLElement|null} Elemento.
   */
  query(selector) {
    return this.host_.getElement()?.querySelector(selector) ?? null;
  }

  /**
   * Construye la vista, resuelve las capas y activa la capa por defecto.
   */
  build() {
    const host = this.host_;
    this.collectEntries();
    this.bindControls();
    this.hideReferenced(null);
    this.changeValueInputDate(host.date.init, host.date.end);
    this.renderSelector();
    const entry = this.getDefaultEntry();
    if (entry) {
      this.select(entry.key);
    } else {
      this.context_.showNotice(host.translation.no_layers);
      this.select(null);
    }
    this.layers.listen((layers, added) => this.onMapChange(added));
  }

  /**
   * Construye las entradas del selector y allLayersDinamic.
   */
  collectEntries() {
    const { allLayersDinamic, intervals } = this.host_;
    allLayersDinamic.groupLayer.length = 0;
    allLayersDinamic.noGroupLayer.length = 0;
    this.entries_.clear();
    this.order_ = [];
    this.pending_ = [];
    intervals.forEach((interval) => this.addInterval(interval, false));
  }

  /**
   * Añade un intervalo a una entrada (individual o de grupo).
   * @param {Object} interval Intervalo extendido.
   * @param {Boolean} quiet Sin avisos de capa no encontrada.
   * @returns {Boolean} Verdadero si se ha añadido.
   */
  addInterval(interval, quiet) {
    const host = this.host_;
    const equalsTimeLine = interval.equalsTimeLine || host.timelineType === 'absolute';
    const layer = this.layers.resolve(interval.layer, { quiet });
    if (isNullOrEmpty(layer)) {
      this.pending_.push(interval);
      return false;
    }
    if (!this.layers.isEligible(layer)) {
      this.layers.warnIncompatible(layer);
      if (!this.isUsed(layer)) this.layers.forget(layer);
      return false;
    }
    if (isNullOrEmpty(interval.attributeParam) && !quiet) {
      warn(formatText(host.translation.missing_attribute, { id: interval.id }));
    }
    const member = {
      interval,
      layer,
      attributeParam: interval.attributeParam,
      equalsTimeLine,
    };
    const { allLayersDinamic } = host;
    if (interval.grupo) {
      const key = `group:${interval.grupo}`;
      const entry = this.entries_.get(key);
      if (entry) {
        entry.members.push(member);
        if (new Date(interval.init).getTime() < new Date(entry.init).getTime()) {
          entry.init = interval.init;
        }
        if (new Date(interval.end).getTime() > new Date(entry.end).getTime()) {
          entry.end = interval.end;
        }
        allLayersDinamic.groupLayer.find(({ name }) => name === interval.grupo)
          .layers.push(layer);
      } else {
        this.addEntry({
          key,
          id: interval.grupo,
          name: interval.grupo,
          group: true,
          init: interval.init,
          end: interval.end,
          equalsTimeLine,
          members: [member],
        });
        allLayersDinamic.groupLayer.push({ name: interval.grupo, layers: [layer] });
      }
    } else {
      let key = `interval:${interval.id}`;
      if (this.entries_.has(key)) key = `${key}:${this.order_.length}`;
      this.addEntry({
        key,
        id: interval.id,
        name: layer.name,
        group: false,
        init: interval.init,
        end: interval.end,
        equalsTimeLine,
        members: [member],
      });
      allLayersDinamic.noGroupLayer.push({ name: layer.name, layers: [layer] });
    }
    return true;
  }

  /**
   * Registra una entrada.
   * @param {Object} entry Entrada.
   */
  addEntry(entry) {
    this.entries_.set(entry.key, entry);
    this.order_.push(entry.key);
  }

  /**
   * Indica si alguna entrada utiliza la capa.
   * @param {IDEE.layer.Layer} layer Capa.
   * @returns {Boolean} Verdadero si se utiliza.
   */
  isUsed(layer) {
    return [...this.entries_.values()]
      .some((entry) => entry.members.some((member) => member.layer === layer));
  }

  /**
   * Enlaza una sola vez los eventos del selector, los deslizadores y las fechas. Los
   * botones de reproducción los enlaza TimelineTransport.
   */
  bindControls() {
    const select = this.query('.m-timeline-layer-select');
    select.addEventListener('change', ({ target }) => this.select(target.value || null));
    select.addEventListener('focus', () => this.renderSelector());

    const rangeInit = this.query('.m-timeline-range-init');
    const rangeEnd = this.query('.m-timeline-range-end');
    rangeInit.addEventListener('input', ({ target }) => {
      this.context_.pausePlayback();
      const endValue = Number(rangeEnd.value);
      if (Number(target.value) >= endValue) {
        // eslint-disable-next-line no-param-reassign
        target.value = endValue;
        return;
      }
      this.onRangeInput(Number(target.value), endValue);
    });
    rangeEnd.addEventListener('input', ({ target }) => {
      this.context_.pausePlayback();
      const initValue = Number(rangeInit.value);
      if (Number(target.value) <= initValue) {
        // eslint-disable-next-line no-param-reassign
        target.value = initValue;
        return;
      }
      this.onRangeInput(initValue, Number(target.value));
    });

    [this.query('.m-timeline-date-init'), this.query('.m-timeline-date-end')].forEach((input) => {
      ['focusout', 'keypress'].forEach((event) => {
        input.addEventListener(event, ({ key = false } = {}) => {
          if (event === 'focusout' || key === 'Enter') this.onDateInput();
        });
      });
    });
    this.player_.stop();
  }

  /**
   * Aplica el rango de los deslizadores.
   * @param {Number} initSlider Valor del deslizador inicial.
   * @param {Number} endSlider Valor del deslizador final.
   */
  onRangeInput(initSlider, endSlider) {
    const { formatValue } = this.host_;
    const valueInit = this.getFormatValue(initSlider, formatValue);
    const valueEnd = this.getFormatValue(endSlider, formatValue);
    this.applyRange(valueInit, valueEnd);
    this.changeValueInputDate(toISO(valueInit), toISO(valueEnd));
  }

  /**
   * Aplica las fechas escritas en los campos de texto.
   */
  onDateInput() {
    if (!this.selected_) return;
    const [init, end] = this.getValueDateInput();
    if (Number.isNaN(init) || Number.isNaN(end)) return;
    if (init !== this.host_.date.init || end !== this.host_.date.end) {
      this.context_.pausePlayback();
    }
    this.applyRange(init, end);
    this.changeValueSlider(this.getValuesInputDate(init), this.getValuesInputDate(end));
  }

  /**
   * Estrategia de movimiento del rango según formatMove.
   * @returns {FixedStartMotion|SlidingWindowMotion} Estrategia.
   */
  get motion() {
    return RANGE_MOTIONS[this.host_.formatMove] ?? RANGE_MOTIONS.continuous;
  }

  /**
   * Indica si hay una entrada que reproducir; si no, pide elegir una.
   * @returns {Boolean} Verdadero si hay entrada seleccionada.
   */
  canPlay() {
    if (this.selected_) return true;
    this.showChooseOption();
    return false;
  }

  /**
   * Mueve el rango con la estrategia de formatMove y el paso de paramsDate y
   * stepValue, dentro de los límites de la entrada.
   * @param {String} operation 'forward', 'backward' o 'rewind'.
   * @returns {Boolean} Verdadero si se ha movido.
   */
  moveRange(operation) {
    const host = this.host_;
    if (!this.canPlay()) return false;
    const [init, end] = this.getValueDateInput();
    if (Number.isNaN(init) || Number.isNaN(end)) return false;
    const { min, max } = this.getValueSliderB();
    const step = TimelineDates.getStepValue(host.paramsDate, host.stepValue);
    const range = this.motion[operation]({ init, end }, { min, max, step });
    if (!range) return false;
    this.setRange(range.init, range.end);
    return true;
  }

  /**
   * Aplica un rango a las capas, las fechas y los deslizadores.
   * @param {Number} init Inicio en milisegundos.
   * @param {Number} end Fin en milisegundos.
   */
  setRange(init, end) {
    const formatRevert = TimelineDates.getReverseFormat(this.host_.formatValue);
    this.changeValueInputDate(toISO(init), toISO(end));
    this.applyRange(init, end);
    this.changeValueSlider(...[init, end].map((n) => this.getFormatValue(n, formatRevert)));
  }

  /**
   * Avanza un paso.
   * @returns {Boolean} Verdadero si se ha movido.
   */
  stepForward() {
    return this.moveRange('forward');
  }

  /**
   * Retrocede un paso.
   * @returns {Boolean} Verdadero si se ha movido.
   */
  stepBackward() {
    return this.moveRange('backward');
  }

  /**
   * Vuelve al primer estado de la reproducción.
   * @returns {Boolean} Verdadero si se ha movido.
   */
  rewind() {
    return this.moveRange('rewind');
  }

  /**
   * Indica si el fin del rango está en el final de la entrada.
   * @returns {Boolean} Verdadero en el final.
   */
  isAtEnd() {
    if (!this.selected_) return false;
    const [, end] = this.getValueDateInput();
    return !(end < this.getValueSliderB().max);
  }

  /**
   * Sin efecto: el selector de capas sigue disponible y elegir otra pausa.
   */
  onPlaybackChange() {}

  /**
   * Selecciona una entrada: desactiva la anterior, oculta el resto de capas
   * referenciadas, activa sus capas y aplica su rango completo.
   * @param {String|null} key Clave de la entrada o null para ninguna.
   * @returns {Boolean} Verdadero si hay entrada seleccionada.
   */
  select(key) {
    const host = this.host_;
    const entry = isNullOrEmpty(key) ? null : (this.entries_.get(key) ?? null);
    if (entry !== this.selected_) this.context_.pausePlayback();
    if (this.selected_ && this.selected_ !== entry) this.deactivate(this.selected_);
    this.selected_ = entry;
    const select = this.query('.m-timeline-layer-select');
    if (select) select.value = entry ? entry.key : '';

    if (!entry) {
      this.showChooseOption();
      host.date.init = 0;
      host.date.end = 0;
      this.context_.fireChange('layer');
      return false;
    }

    this.setInitDisabled(entry.equalsTimeLine);
    this.hideReferenced(entry);
    entry.members.forEach(({ layer }) => {
      this.layers.attach(layer);
      this.layers.setVisible(layer, true);
    });

    const init = new Date(entry.init).getTime();
    const end = new Date(entry.end).getTime();
    this.changeValueInputDate(toISO(init), toISO(end));
    this.generateValueSlider(init, end);
    this.applyRange(init, end);
    this.context_.fireChange('layer');
    return true;
  }

  /**
   * Desactiva una entrada: restaura los filtros, retira las capas propias y oculta
   * las prestadas.
   * @param {Object} entry Entrada.
   */
  deactivate(entry) {
    entry.members.forEach(({ layer }) => {
      this.layers.clearFilter(layer);
      if (this.layers.isOwned(layer)) {
        this.layers.detach(layer);
      } else {
        this.layers.setVisible(layer, false);
      }
    });
  }

  /**
   * Oculta (o retira, si son propias) las capas referenciadas que no pertenecen a la
   * entrada indicada.
   * @param {Object|null} except Entrada que se mantiene.
   */
  hideReferenced(except) {
    const keep = except ? except.members.map(({ layer }) => layer) : [];
    this.entries_.forEach((entry) => {
      entry.members.forEach(({ layer }) => {
        if (keep.includes(layer)) return;
        if (this.layers.isOwned(layer)) {
          this.layers.detach(layer);
        } else {
          this.layers.setVisible(layer, false);
        }
      });
    });
  }

  /**
   * Aplica un rango a las capas de la entrada seleccionada. Cada intervalo ajusta el
   * rango a sus propios límites.
   * @param {Number} init Inicio en milisegundos.
   * @param {Number} end Fin en milisegundos.
   */
  applyRange(init, end) {
    const host = this.host_;
    host.date.init = init;
    host.date.end = end;
    if (this.selected_) {
      this.selected_.members.forEach(({
        interval, layer, attributeParam, equalsTimeLine,
      }) => {
        const [memberInit, memberEnd] = TimelineDates.getGroupLimit(init, end, interval);
        this.layers.applyFilter(layer, new TemporalFilter({
          init: memberInit,
          end: memberEnd,
          attributeParam,
          equalsTimeLine,
          cqlEnd: end,
        }));
      });
    }
    this.context_.fireChange('range');
  }

  /**
   * Entradas ordenadas por la posición de sus capas en el visualizador (de arriba
   * abajo); las capas propias, que no están en él, van al final.
   * @returns {Array<Object>} Entradas.
   */
  orderedEntries() {
    const rank = (entry) => Math.min(...entry.members.map(({ layer }) => (
      this.layers.isOwned(layer) ? Infinity : (this.layers.positionOf(layer) ?? Infinity))));
    return this.order_
      .map((key, index) => {
        const entry = this.entries_.get(key);
        return { entry, index, rank: rank(entry) };
      })
      .sort((a, b) => (a.rank - b.rank) || (a.index - b.index))
      .map(({ entry }) => entry);
  }

  /**
   * Texto de una entrada con la posición de su capa en el visualizador.
   * @param {Object} entry Entrada.
   * @returns {String} Texto.
   */
  getLabel(entry) {
    const positions = entry.members
      .map(({ layer }) => this.layers.positionOf(layer))
      .filter((position) => position !== null);
    return positions.length > 0 ? `[${Math.min(...positions)}] ${entry.name}` : entry.name;
  }

  /**
   * Pinta el selector de capas.
   */
  renderSelector() {
    const select = this.query('.m-timeline-layer-select');
    if (!select) return;
    select.textContent = '';
    const empty = document.createElement('option');
    empty.value = '';
    empty.textContent = this.host_.translation.none;
    select.appendChild(empty);
    this.orderedEntries().forEach((entry) => {
      const option = document.createElement('option');
      option.value = entry.key;
      option.textContent = this.getLabel(entry);
      select.appendChild(option);
    });
    select.value = this.selected_ ? this.selected_.key : '';
  }

  /**
   * Entrada por defecto: selección previa válida, capa de layerPosition o primera
   * entrada en el orden del visualizador.
   * @returns {Object|null} Entrada.
   */
  getDefaultEntry() {
    const host = this.host_;
    const ordered = this.orderedEntries();
    if (ordered.length === 0) return null;
    const previous = this.entries_.get(this.context_.getPreviousKey());
    if (previous) return previous;
    if (!isNullOrEmpty(host.layerPosition)) {
      const target = this.layers.layerAt(host.layerPosition);
      const entry = target
        ? ordered.find((e) => e.members.some(({ layer }) => layer === target))
        : undefined;
      if (entry) return entry;
      warn(formatText(host.translation.invalid_layer_position, {
        position: host.layerPosition,
      }));
    }
    return ordered[0];
  }

  /**
   * Reacciona a capas añadidas o retiradas del mapa. Al añadir, resuelve las
   * referencias pendientes y, si no hay selección, aplica la selección por defecto.
   * Al retirar es pasivo: solo actualiza la vista y el estado.
   * @param {Boolean} added Capas añadidas.
   */
  onMapChange(added) {
    const host = this.host_;
    if (added && this.pending_.length > 0) {
      const pending = this.pending_;
      this.pending_ = [];
      pending.forEach((interval) => this.addInterval(interval, true));
      this.hideReferenced(this.selected_);
    }
    if (!added && this.selected_
      && this.selected_.members.some(({ layer }) => !this.layers.isOwned(layer)
        && !this.layers.inMap(layer))) {
      this.context_.pausePlayback();
      this.selected_.members.forEach(({ layer }) => this.layers.clearFilter(layer));
      this.selected_ = null;
      this.showChooseOption();
      host.date.init = 0;
      host.date.end = 0;
      this.context_.fireChange('layer');
    }
    this.renderSelector();
    if (added && !this.selected_) {
      const entry = this.getDefaultEntry();
      if (entry) {
        this.context_.hideNotice();
        this.select(entry.key);
      }
    }
  }

  /**
   * Entradas seleccionables en el orden del selector.
   * @returns {Array<Object>} Entradas.
   */
  getSelectable() {
    return this.orderedEntries().map((entry) => ({
      id: entry.id,
      key: entry.key,
      name: entry.name,
      group: entry.group,
      init: entry.init,
      end: entry.end,
      layers: entry.members.map(({ layer }) => layer),
      position: entry.members
        .map(({ layer }) => this.layers.positionOf(layer))
        .filter((position) => position !== null)
        .reduce((min, position) => Math.min(min, position), Infinity),
      selected: entry === this.selected_,
    })).map((entry) => ({
      ...entry,
      position: Number.isFinite(entry.position) ? entry.position : null,
    }));
  }

  /**
   * Clave de la entrada seleccionada.
   * @returns {String|null} Clave.
   */
  getSelectedKey() {
    return this.selected_?.key ?? null;
  }

  /**
   * Capa activa (la primera de la entrada seleccionada).
   * @returns {IDEE.layer.Layer|null} Capa.
   */
  getSelectedLayer() {
    return this.selected_?.members[0]?.layer ?? null;
  }

  /**
   * Selecciona una entrada por clave, id del intervalo, nombre, posición o capa.
   * @param {String|Number|IDEE.layer.Layer} reference Referencia.
   * @returns {Boolean} Verdadero si se ha seleccionado.
   */
  selectReference(reference) {
    const target = typeof reference === 'number' ? this.layers.layerAt(reference) : reference;
    const entries = this.orderedEntries();
    const entry = entries.find((e) => e.key === target)
      ?? entries.find((e) => e.id === target || e.name === target)
      ?? entries.find((e) => e.members.some(({ layer }) => layer === target));
    if (!entry) return false;
    this.context_.hideNotice();
    return this.select(entry.key);
  }

  /**
   * Activa o desactiva el deslizador y el campo de fecha inicial (equalsTimeLine).
   * @param {Boolean} disabled Desactivado.
   */
  setInitDisabled(disabled) {
    [this.query('.m-timeline-range-init'), this.query('.m-timeline-date-init')]
      .forEach((element) => {
        if (disabled) element.setAttribute('disabled', '');
        else element.removeAttribute('disabled');
      });
  }

  /**
   * Muestra el texto "selecciona una opción" y reinicia los deslizadores.
   */
  showChooseOption() {
    const text = this.host_.translation.choose_option;
    this.changeValueInputDate(text, text);
    this.generateValueSlider(0, 1);
  }

  /**
   * Fija los límites y valores de los deslizadores.
   * @param {Number} init Inicio.
   * @param {Number} end Fin.
   */
  generateValueSlider(init, end) {
    const inputInit = this.query('.m-timeline-range-init');
    const inputEnd = this.query('.m-timeline-range-end');

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
   * Escribe las fechas en los campos de texto.
   * @param {String|Number} init Inicio.
   * @param {String|Number} end Fin.
   */
  changeValueInputDate(init, end) {
    this.query('.m-timeline-date-init').value = init;
    this.query('.m-timeline-date-end').value = end;
  }

  /**
   * Fija los valores de los deslizadores.
   * @param {Number} init Inicio.
   * @param {Number} end Fin.
   */
  changeValueSlider(init, end) {
    this.query('.m-timeline-range-init').value = init;
    this.query('.m-timeline-range-end').value = end;
  }

  /**
   * Fechas de los campos de texto en milisegundos.
   * @returns {Array<Number>} [inicio, fin].
   */
  getValueDateInput() {
    return [
      TimelineDates.toTimestamp(this.query('.m-timeline-date-init').value),
      TimelineDates.toTimestamp(this.query('.m-timeline-date-end').value),
    ];
  }

  /**
   * Límites y valor del deslizador final.
   * @returns {Object} {min, max, value}.
   */
  getValueSliderB() {
    const input = this.query('.m-timeline-range-end');
    return {
      min: Number(input.min),
      max: Number(input.max),
      value: Number(input.value),
    };
  }

  /**
   * Aplica la escala del deslizador a un valor.
   * @param {Number} value Valor.
   * @param {String} format Escala.
   * @returns {Number} Valor escalado.
   */
  getFormatValue(value, format) {
    const { min, max } = this.getValueSliderB();
    return TimelineDates.getFormatValue(value, format, min, max);
  }

  /**
   * Valor del deslizador para una fecha (escala inversa).
   * @param {Number} time Milisegundos.
   * @returns {Number} Valor del deslizador.
   */
  getValuesInputDate(time) {
    return this.getFormatValue(time, TimelineDates.getReverseFormat(this.host_.formatValue));
  }

  /**
   * Vista sin funcionalidad temporal (implementación no soportada).
   */
  renderUnsupported() {
    this.context_.showNotice(this.host_.translation.not_supported);
    this.renderSelector();
    this.host_.getElement().querySelectorAll('input, select, button').forEach((element) => {
      element.setAttribute('disabled', '');
    });
  }
}

/**
 * @typedef {Object} module:IDEE/control/Timeline~Options
 * @api
 * @property {String} timelineType Tipo de línea de tiempo (obligatorio):
 * 'absoluteSimple', 'absolute' o 'relative'.
 * @property {Array|String} intervals Intervalos (obligatorio). Array o cadena JSON; por
 * GET, en base64 (`intervals=base64~...`). Cada intervalo puede ser clásico
 * `[name, tag, service]` o extendido `{id, init, end, layer, attributeParam, grupo,
 * equalsTimeLine}`, en cualquier timelineType; "service" es un alias de "layer".
 * "layer" admite una capa de la API, una configuración con "type", una definición
 * "TIPO*..." (GPX, WMS, WMTS, KML, GeoJSON...), que se interpreta con el mecanismo
 * general de la API, o el nombre o la leyenda de una capa del visualizador.
 * @property {Number} [layerPosition] Posición en el visualizador de la capa que se activa
 * por defecto. Base 1 y contada desde arriba, como la lista del LayerSwitcher
 * (1 = capa superior). Si no se indica, o no hay una capa compatible en esa posición,
 * se activa la primera capa compatible en el orden del visualizador.
 * No confundir con "position", que es la posición del panel.
 * @property {String} [position] Posición del panel en el mapa. Por defecto, 'left'.
 * @property {String} [tooltip] Texto del tooltip del control.
 * @property {String} [title] Título del panel. Por defecto, el tooltip.
 * @property {Number} [order] Accesibilidad, z-index del control.
 * @property {Boolean} [collapsible] Indica si el panel puede colapsarse. Por defecto, true.
 * @property {Boolean} [collapsed] Indica si el panel empieza colapsado. Por defecto, true.
 * @property {Boolean} [animation] Muestra el botón de play/pausa y el selector de
 * velocidad. Por defecto, true; con false solo quedan avance y retroceso.
 * @property {Number} [speed] Segundos por paso de la reproducción en absoluteSimple.
 * Por defecto, 1 (×1 en el selector de velocidad).
 * @property {Number} [speedDate] Segundos por paso de la reproducción en absolute y
 * relative. Por defecto, 2 (×1 en el selector de velocidad).
 * @property {String} [paramsDate] Unidad del paso en absolute y relative: 'sec', 'min',
 * 'hrs', 'day', 'mos' o 'yr'. Por defecto, 'yr'.
 * @property {Number} [stepValue] Número de unidades de "paramsDate" por paso.
 * Por defecto, 1.
 * @property {String} [formatMove] Movimiento del rango al reproducir, avanzar o
 * retroceder en absolute y relative: 'discrete' (límite inferior fijo y superior
 * móvil; por defecto en relative) o 'continuous' (ventana deslizante, se mueven los
 * dos límites; por defecto en absolute).
 * @property {String} [formatValue] Escala de los deslizadores en absolute y relative:
 * 'linear', 'logarithmic' o 'exponential'. Por defecto, 'linear'.
 * @property {String} [snapMode] Ajuste del deslizador de absoluteSimple: 'bySpep' (a cada
 * paso) o 'byStepIntersection' (a cada paso y a mitad de paso, donde se ven las capas
 * de los dos pasos). Sin valor, el deslizador es continuo.
 * @property {String} [sizeWidthDinamic] Ancho del panel en absolute y relative: ''
 * (por defecto), 'sizeWidthDinamic_medium' o 'sizeWidthDinamic_big'.
 * @property {Object} [vendorOptions] Opciones específicas para la implementación.
 */

/**
 * @classdesc
 * Hereda de {@link module:IDEE/control/Control|Control}.
 * Control de línea de tiempo: muestra la evolución temporal de capas del mapa y permite
 * reproducirla. Se añade con `map.addControls` o por GET
 * (`controls=timeline*timelineType=...;intervals=base64~...`).
 *
 * Tipos de línea de tiempo ("timelineType"):
 * - **absoluteSimple**: cada paso del deslizador muestra la capa de un año (con un
 *   selector si hay varias del mismo año) y oculta las demás.
 * - **absolute**: filtra las capas por un instante, el fin del rango; la fecha inicial
 *   no se edita.
 * - **relative**: filtra las capas por el rango [inicio, fin]. Por defecto el límite
 *   inferior queda fijo y la reproducción, el avance y el retroceso mueven el superior
 *   ("formatMove" 'discrete'); con 'continuous' se mueven los dos.
 *
 * Controles de reproducción, en todos los tipos: retroceso, play/pausa, avance y
 * selector de velocidad (×0,5, ×1, ×2, ×3 y ×5; ×1 es el valor por defecto de "speed"
 * o "speedDate"). La velocidad configurada queda seleccionada y, si no es una de esas,
 * se añade en su lugar. Elegir otra velocidad actualiza "speed" o "speedDate" y se
 * aplica en el siguiente paso. La reproducción se detiene en el último paso y play
 * vuelve a empezar desde el principio. Mover el deslizador o las fechas, o cambiar de
 * capa, la pausa. Los textos se traducen con el idioma de la API.
 *
 * Capas: en absolute y relative el selector las ordena por su posición en el
 * visualizador y activa la de "layerPosition" o, si no, la primera compatible. Una capa
 * que ya está en el visualizador se reutiliza y recupera su visibilidad al destruir el
 * control; si no existe, Timeline la crea y la retira al destruirse. Compatibilidad en
 * OpenLayers: absoluteSimple muestra u oculta WMS, WMTS, XYZ, TMS, OSM, MBTiles, MVT,
 * MBTilesVector, GeoTIFF, MapLibre, GeoPackageTile y las capas vectoriales; absolute y
 * relative filtran WMS (CQL) y las capas vectoriales con entidades en memoria (GPX, KML,
 * KMZ, GeoJSON, WFS, OGCAPIFeatures, DataIDEE, Vector) por "attributeParam". Las capas
 * incompatibles se descartan con un aviso.
 *
 * La fachada no depende del motor cartográfico: la implementación decide la
 * compatibilidad de las capas y aplica los filtros temporales. En Cesium la
 * funcionalidad temporal todavía no está disponible: el panel lo indica y los controles
 * quedan desactivados.
 *
 * Cada cambio de capa, rango, paso, reproducción o velocidad lanza el evento
 * `IDEE.evt.CHANGE` con `{reason, timelineType, selectedLayer, date, running}`, donde
 * "reason" es 'layer', 'range', 'step', 'play' o 'speed'.
 *
 * @property {String|Boolean} timelineType Tipo de línea de tiempo: 'absoluteSimple',
 * 'absolute' o 'relative' (false si no se ha indicado; es obligatorio para añadir el
 * control al mapa).
 * @property {Array} intervals Intervalos normalizados. En absoluteSimple, tras añadir el
 * control, son los pasos del deslizador `{number, name, tag, service}`; en absolute y
 * relative, `{id, init, end, layer, attributeParam, grupo, equalsTimeLine}` con las
 * fechas en ISO 8601.
 * @property {Object} intervalsGrouped Intervalos de absoluteSimple agrupados por año.
 * @property {Number} [layerPosition] Posición en el visualizador (base 1, 1 = capa
 * superior) de la capa activada por defecto.
 * @property {String} [position='left'] Posición del panel en el mapa.
 * @property {String} [tooltip] Texto del tooltip. Por defecto, la traducción del idioma.
 * @property {String} [title] Título del panel. Por defecto, el tooltip.
 * @property {Boolean} [collapsible=true] Indica si el panel puede colapsarse.
 * @property {Boolean} [collapsed=true] Indica si el panel está colapsado. Solo se aplica
 * si collapsible es true.
 * @property {Boolean} [animation=true] Indica si se muestran play/pausa y el selector de
 * velocidad.
 * @property {Number} [speed=1] Segundos por paso de la reproducción en absoluteSimple.
 * @property {Number} [speedDate=2] Segundos por paso de la reproducción en absolute y
 * relative.
 * @property {String} [paramsDate='yr'] Unidad del paso en absolute y relative: 'sec',
 * 'min', 'hrs', 'day', 'mos' o 'yr'.
 * @property {Number} [stepValue=1] Número de unidades de "paramsDate" por paso.
 * @property {String} [formatMove] Movimiento del rango en absolute y relative:
 * 'discrete' (límite inferior fijo y superior móvil; por defecto en relative) o
 * 'continuous' (se mueven los dos límites; por defecto en el resto).
 * @property {String} [formatValue='linear'] Escala de los deslizadores: 'linear',
 * 'logarithmic' o 'exponential'.
 * @property {String} [snapMode] Ajuste del deslizador de absoluteSimple: 'bySpep' o
 * 'byStepIntersection'. Sin valor, el deslizador es continuo.
 * @property {String} [sizeWidthDinamic=''] Ancho del panel en absolute y relative: '',
 * 'sizeWidthDinamic_medium' o 'sizeWidthDinamic_big'.
 * @property {Boolean|Number} [running=false] Identificador del temporizador de la
 * reproducción en curso o false si no hay reproducción. Asignar false la detiene.
 * @property {Object} [date] Rango activo en absolute y relative, en milisegundos.
 * @property {Number} [date.init=0] Inicio del rango.
 * @property {Number} [date.end=0] Fin del rango.
 * @property {Object} [allLayersDinamic] Capas de absolute y relative.
 * @property {Array} [allLayersDinamic.groupLayer=[]] Capas agrupadas ({name, layers}).
 * @property {Array} [allLayersDinamic.noGroupLayer=[]] Capas no agrupadas ({name, layers}).
 *
 * @api
 * @extends {module:IDEE/control/Control}
 */
class Timeline extends Control {
  get translation() {
    return getValue('timeline');
  }

  /**
   * Constructor principal de la clase. Crea un control de línea de tiempo de fachada con
   * su implementación (OpenLayers o Cesium).
   *
   * @constructor
   * @param {module:IDEE/control/Timeline~Options} options Opciones del control.
   * @example
   * // absoluteSimple: una capa WMS histórica por año, 2 s por paso (×0,5).
   * const control = new IDEE.control.Timeline({
   *   timelineType: 'absoluteSimple',
   *   speed: 2,
   *   intervals: [
   *     ['NACIONAL 1981-1986', '1986', 'WMS*NACIONAL_1981-1986*https://www.ign.es/wms/pnoa-historico*NACIONAL_1981-1986'],
   *     ['OLISTAT', '1998', 'WMS*OLISTAT*https://www.ign.es/wms/pnoa-historico*OLISTAT'],
   *     ['SIGPAC', '2003', 'WMS*SIGPAC*https://www.ign.es/wms/pnoa-historico*SIGPAC'],
   *     ['PNOA 2004', '2004', 'WMS*pnoa2004*https://www.ign.es/wms/pnoa-historico*pnoa2004'],
   *     ['PNOA 2010', '2010', 'WMS*pnoa2010*https://www.ign.es/wms/pnoa-historico*pnoa2010'],
   *   ],
   * });
   * map.addControls(control);
   * @example
   * // relative: GPX filtrado por su atributo "time". El inicio queda fijo y cada paso
   * // (un mes) amplía el fin; 1 s por paso (×2 en el selector de velocidad).
   * // La capa puede venir por GET (layers=GPX*rutas*https://servidor/rutas.gpx) y
   * // referenciarse por su nombre o con su definición "*".
   * const control = new IDEE.control.Timeline({
   *   timelineType: 'relative',
   *   layerPosition: 1,
   *   paramsDate: 'mos',
   *   speedDate: 1,
   *   intervals: [{
   *     id: 'rutas',
   *     init: '2020-01-01T00:00:00Z',
   *     end: '2021-12-31T23:59:59Z',
   *     layer: 'GPX*rutas*https://servidor/rutas.gpx',
   *     attributeParam: 'time',
   *   }],
   * });
   * control.on(IDEE.evt.CHANGE, ({ reason, date }) => console.log(reason, date));
   * map.addControls(control);
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

    instanceCounter += 1;

    /**
     * Prefijo de los identificadores DOM de esta instancia.
     * @private
     * @type {String}
     */
    this.uid_ = `m-timeline-${instanceCounter}`;

    /**
     * Temporizadores de reproducción.
     * @private
     * @type {TimelinePlayer}
     */
    this.player_ = new TimelinePlayer(() => this.getElement()?.isConnected === true);

    /**
     * Capas utilizadas por el control.
     * @private
     * @type {TimelineLayers}
     */
    this.layers_ = new TimelineLayers(this);

    /**
     * Estrategia del tipo de timeline (se crea en createView).
     * @private
     * @type {SimpleTimelineMode|DynamicTimelineMode|null}
     */
    this.mode_ = null;

    /**
     * Controles de reproducción (se crean en createView).
     * @private
     * @type {TimelineTransport|null}
     */
    this.transport_ = null;

    /**
     * Clave de la última entrada seleccionada en timelines dinámicos.
     * @private
     * @type {String|null}
     */
    this.selectedKey_ = null;

    /**
     * Animation of the timeline
     * Value: true / false
     * @type {boolean}
     */
    this.animation = options.animation;
    if (this.animation === undefined) this.animation = true;

    /**
    * Segundos por paso de la reproducción en absoluteSimple (×1 = 1 s).
    * El selector de velocidad lo actualiza.
    * @type {number}
    */
    this.speed = parseFloat(options.speed) || DEFAULT_SPEED;

    /**
     * Segundos por paso de la reproducción en absolute y relative (×1 = 2 s).
     * El selector de velocidad lo actualiza.
     *@type { Number }
     */
    this.speedDate = (options.speedDate) ? options.speedDate : DEFAULT_SPEED_DATE;

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
     * Movimiento del rango al reproducir, avanzar o retroceder: 'discrete' (límite
     * inferior fijo y superior móvil, por defecto en relative) o 'continuous'
     * (ventana deslizante, por defecto en absolute).
     *@type { String }
     */
    this.formatMove = ['discrete', 'continuous'].includes(options.formatMove)
      ? options.formatMove
      : (options.timelineType === 'relative' && 'discrete') || 'continuous';

    /**
     *@type { String }
     */
    this.formatValue = (options.formatValue) ? options.formatValue : 'linear';

    /**
     *@type { String }
     */
    this.timelineType = options.timelineType ?? false;

    /**
     * Posición (base 1, 1 = capa superior) en el visualizador de la capa activada por
     * defecto. undefined: primera capa compatible.
     * @type {Number|undefined}
     */
    this.layerPosition = Number.isInteger(Number(options.layerPosition))
      && Number(options.layerPosition) > 0 && !isBoolean(options.layerPosition)
      ? Number(options.layerPosition)
      : undefined;

    /**
     * Intervals
     * Value: Array with each interval attributes [name, tag, service]
     * @property {String} intervals
     */
    this.intervals = [];
    this.intervalsGrouped = {};

    const rawIntervals = TimelineIntervals.parse(options.intervals);

    if (isArray(rawIntervals)) {
      this.intervals = TimelineIntervals.normalize(rawIntervals, this.isDynamicTimeline());

      if (this.isDynamicTimeline()) {
        this.intervals = TimelineIntervals.toDynamicDates(this.intervals);
      } else {
        this.intervalsGrouped = TimelineIntervals.buildGroups(this.intervals);
      }
    }

    this.position = Position.isValid(options.position) ? options.position : Position.LEFT;

    this.tooltip = isString(options.tooltip) ? options.tooltip : this.translation.tooltip ?? '';

    this.title = isString(options.title) ? options.title : this.tooltip;

    this.collapsible = isBoolean(options.collapsible) ? options.collapsible : true;

    this.collapsed = (isBoolean(options.collapsed) && this.collapsible) ? options.collapsed : true;

    /**
     * Identificador del temporizador de reproducción o false.
     * Propiedad propia y enumerable (como antes), delegada en el reproductor.
     * @type {Number|Boolean}
     */
    Object.defineProperty(this, 'running', {
      configurable: true,
      enumerable: true,
      get: () => (this.player_.isRunning() ? this.player_.handle : false),
      set: (value) => {
        if (value === false || isNullOrEmpty(value)) this.player_.stop();
        else this.player_.adopt(value);
      },
    });
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
   * Crea la vista del control: la plantilla del tipo de línea de tiempo, el
   * comportamiento del tipo y los controles de reproducción.
   *
   * @public
   * @function
   * @param {IDEE.Map} map Mapa al que se añade el control.
   * @returns {Promise} Plantilla HTML.
   * @api stable
   */
  createView(map) {
    return new Promise((success) => {
      const dynamic = this.isDynamicTimeline();
      let step = 'any';
      if (this.snapMode === 'bySpep') {
        step = 1;
      } else if (this.snapMode === 'byStepIntersection') {
        step = 0.5;
      }
      const template = compileSync((dynamic) ? timelineDinamicTemplate : timelineTemplate, {
        vars: {
          translations: {
            title: this.title || this.translation.title,
            play: this.translation.play,
            playback: this.translation.playback,
            previous: this.translation.previous,
            next: this.translation.next,
            speed: this.translation.speed,
            initValue: this.translation.initValue,
            endValue: this.translation.endValue,
          },
          ids: {
            init: `${this.uid_}-init`,
            end: `${this.uid_}-end`,
          },
          sizeWidthDinamic: this.sizeWidthDinamic,
          inputRange: {
            step,
          },
        },
      });
      this.setElement(template);

      const context = {
        layers: this.layers_,
        player: this.player_,
        showNotice: (text) => this.showNotice_(text),
        hideNotice: () => this.hideNotice_(),
        fireChange: (reason) => this.fireChange_(reason),
        getPreviousKey: () => this.selectedKey_,
        pausePlayback: () => this.transport_?.pause(),
      };
      this.mode_ = dynamic
        ? new DynamicTimelineMode(this, context)
        : new SimpleTimelineMode(this, context);
      this.transport_ = new TimelineTransport(this, this.mode_, {
        player: this.player_,
        fireChange: context.fireChange,
      });
      if (this.layers_.isSupported()) {
        this.mode_.build();
        this.transport_.bind();
      } else {
        this.mode_.renderUnsupported();
        this.transport_.bind();
        this.transport_.setDisabled(true);
      }
      success(this.getElement());
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
   * Indica si la capa es compatible con la modalidad del timeline en la implementación
   * actual (en OpenLayers, en absoluteSimple, WMS y WMTS siguen siéndolo).
   *
   * @public
   * @function
   * @api stable
   * @param {IDEE.layer.Layer|Object} layer Capa o configuración con "type".
   * @return {Boolean} Verdadero si es compatible.
   */
  isValidLayer(layer) {
    return isObject(layer) && this.layers_.isEligible(layer);
  }

  /**
   * Resuelve una capa para absoluteSimple: instancia, configuración con "type",
   * definición REST "TIPO*..." (mecanismo general de la API; también GPX, KML, etc.)
   * o nombre/leyenda de una capa existente. Si ya existe en el visualizador se
   * reutiliza. La capa queda oculta y, si la crea Timeline, fuera del LayerSwitcher.
   *
   * WMTS*http://www.ign.es/wmts/pnoa-ma?*OI.OrthoimageCoverage*EPSG:25830*PNOA
   * WMS*IGN*http://www.ign.es/wms-inspire/ign-base*IGNBaseTodo
   * GPX*rutas*https://servidor/rutas.gpx*true*true
   *
   * @public
   * @function
   * @api stable
   * @param {string|object} layer Capa, definición o referencia.
   * @return {object} Capa o null si no se encuentra o no es compatible.
   */
  transformToLayers(layer) {
    const newLayer = this.layers_.resolve(layer, { legacyName: true });
    if (isNullOrEmpty(newLayer)) return null;
    if (!this.layers_.isEligible(newLayer)) {
      this.layers_.warnIncompatible(newLayer);
      this.layers_.forget(newLayer);
      return null;
    }
    this.layers_.prepareStep(newLayer);
    return newLayer;
  }

  /**
   * Muestra u oculta la capa de un paso de absoluteSimple.
   *
   * @public
   * @function
   * @param {Object} interval Paso ({service}).
   * @param {Boolean} visible Visibilidad.
   */
  setIntervalLayerVisible(interval, visible) {
    if (interval?.service) {
      this.layers_.setVisible(interval.service, visible);
    }
  }

  /**
   * Aplica la posición del deslizador de absoluteSimple: muestra la capa del paso (o
   * las de los dos pasos contiguos en una posición intermedia), su etiqueta y su
   * selector de capas.
   *
   * @public
   * @function
   * @param {HTMLInputElement} elem Deslizador.
   * @api stable
   */
  changeSlider(elem) {
    if (this.mode_ instanceof SimpleTimelineMode) {
      this.mode_.changeSlider(elem);
    }
  }

  /**
   * Busca en el mapa una capa: la misma instancia o, si no, una con la misma leyenda.
   *
   * @public
   * @function
   * @param {IDEE.layer.Layer} layerSearch Capa.
   * @api stable
   * @return {IDEE.layer.Layer|undefined} Capa del mapa.
   */
  getMapLayer(layerSearch) {
    return this.layers_.findInMap(layerSearch);
  }

  /**
   * Devuelve el botón de play/pausa (en cualquier timelineType).
   *
   * @public
   * @api stable
   * @function
   * @returns {HTMLElement} Botón o null si el control no tiene vista.
   */
  getPlayTimeButton() {
    return this.getElement()?.querySelector('[data-timeline-action="play"]') ?? null;
  }

  /**
   * Reproduce o pausa la línea de tiempo, como el botón de play/pausa. Con next a true
   * da un paso de la reproducción: avanza o, si ya está en el último, la detiene.
   *
   * @public
   * @function
   * @param {Boolean} next Paso de la reproducción en lugar de reproducir o pausar.
   * @api stable
   * @return {void}
   */
  playTimeline(next) {
    if (!this.transport_ || !this.layers_.isSupported()) return;
    if (next) this.transport_.tick();
    else this.transport_.toggle();
  }

  /**
   * Detiene la reproducción, retira las capas creadas por Timeline y restaura las capas
   * del visualizador que utilizaba.
   *
   * @public
   * @function
   * @api stable
   */
  removeTimelineLayers() {
    this.transport_?.pause();
    this.player_.stop();
    this.layers_.releaseAll();
  }

  /**
   * Capas que utiliza el timeline y están en el mapa.
   *
   * @public
   * @function
   * @returns {Array<IDEE.layer.Layer>} Capas.
   * @api
   */
  getLayers() {
    return this.layers_.getActiveLayers();
  }

  /**
   * Libera las capas del timeline (equivale a removeTimelineLayers).
   *
   * @public
   * @function
   * @api
   */
  removeLayers() {
    this.removeTimelineLayers();
  }

  /**
   * Devuelve las capas que pueden seleccionarse, en el orden del selector.
   * En absolute y relative el orden es el del visualizador (de arriba abajo).
   *
   * @public
   * @function
   * @returns {Array<Object>} [{id, name, layers, position, selected, ...}].
   * @api
   */
  getSelectableLayers() {
    return this.mode_ && this.layers_.isSupported() ? this.mode_.getSelectable() : [];
  }

  /**
   * Devuelve la capa activa del timeline.
   *
   * @public
   * @function
   * @returns {IDEE.layer.Layer|null} Capa.
   * @api
   */
  getSelectedLayer() {
    return this.mode_ && this.layers_.isSupported() ? this.mode_.getSelectedLayer() : null;
  }

  /**
   * Selecciona y activa una capa del timeline.
   *
   * @public
   * @function
   * @param {String|Number|IDEE.layer.Layer} reference Id del intervalo (o grupo),
   * posición en el visualizador (base 1, 1 = capa superior) o capa.
   * @returns {Boolean} Verdadero si se ha seleccionado.
   * @api
   */
  selectLayer(reference) {
    if (!this.mode_ || !this.layers_.isSupported()) return false;
    if (this.mode_ instanceof DynamicTimelineMode) return this.mode_.selectReference(reference);
    return this.mode_.select(reference);
  }

  /**
   * Muestra un aviso en el panel.
   *
   * @private
   * @param {String} text Texto.
   */
  showNotice_(text) {
    const notice = this.getElement()?.querySelector('.m-timeline-notice');
    if (notice) {
      notice.textContent = text;
      notice.hidden = false;
    }
  }

  /**
   * Oculta el aviso del panel.
   *
   * @private
   */
  hideNotice_() {
    const notice = this.getElement()?.querySelector('.m-timeline-notice');
    if (notice) notice.hidden = true;
  }

  /**
   * Notifica un cambio de estado (capa, rango, paso, reproducción o velocidad) con el
   * evento EventType.CHANGE.
   *
   * @private
   * @param {String} reason Motivo: 'layer', 'range', 'step', 'play' o 'speed'.
   */
  fireChange_(reason) {
    if (this.mode_ instanceof DynamicTimelineMode) {
      this.selectedKey_ = this.mode_.getSelectedKey() ?? this.selectedKey_;
    }
    this.fire(EventType.CHANGE, [{
      reason,
      timelineType: this.timelineType,
      selectedLayer: this.getSelectedLayer(),
      date: { ...this.date },
      running: this.running,
    }]);
  }

  /**
   * Compara controles: cualquier Timeline es igual a otro, de modo que el mapa solo
   * admite uno.
   *
   * @public
   * @function
   * @param {IDEE.Control} control Control que se compara.
   * @api stable
   * @return {Boolean} Verdadero si es un Timeline.
   */
  equals(control) {
    return control instanceof Timeline;
  }

  /**
   * Obtiene la ayuda del control. Se construye como la de los plugins, con la misma
   * plantilla.
   *
   * @function
   * @public
   * @returns {Object} Ayuda: {title, content}, donde content es una promesa con el HTML.
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
   * Elimina el control: detiene la reproducción, deja de escuchar el mapa, retira las
   * capas creadas por Timeline y restaura las capas del visualizador que utilizaba.
   * La implementación se conserva para poder volver a añadir el control.
   *
   * @public
   * @function
   * @api
   * @export
   */
  destroy() {
    this.player_.stop();
    this.layers_.unlisten();
    this.layers_.releaseAll();
    this.mode_ = null;
    this.transport_ = null;
    const element = this.getElement();
    if (element) element.remove();
    if (this.parentContainer) super.destroy();
    this.panel_ = null;
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
