import { getValue } from '../i18n/language';
import {
  Display, ErrorKey, GeoJSONType, Mode, Output, ResultKey,
} from './turftypes';

/** @typedef {import('./turftypes').TurfOperation} TurfOperation */

/**
 * Reemplaza las variables en un texto por sus valores.
 *
 * @param {String} text Texto con variables.
 * @param {Object} vars Valores de las variables.
 * @returns {String} Texto con las variables reemplazadas.
 */
const replaceVars = (text, vars) => Object.keys(vars)
  .reduce((acc, key) => acc.replace(`{${key}}`, vars[key]), text);

/**
 * @classdesc
 * Gestor de las operaciones de Turf.js: obtiene y valida los elementos de
 * entrada, ejecuta la operación y muestra el resultado.
 */
export default class TurfManager {
  /**
   * @constructor
   * @param {IDEE.Map} map Mapa.
   * @param {VectorsManagementControl} managementControl Control principal del plugin.
   * @param {Object} impl Implementación del control Turf.
   */
  constructor(map, managementControl, impl) {
    this.map_ = map;
    this.managementControl_ = managementControl;
    this.impl_ = impl;
    this.layer_ = null;
  }

  /**
   * Devuelve los elementos sobre los que se ejecuta la operación.
   *
   * @returns {Array<IDEE.Feature>|null}
   */
  getInputFeatures() {
    if (this.managementControl_.getSelection() === 'feature') {
      const selected = this.managementControl_.getSelectedFeatures();
      if (selected.length === 0) {
        IDEE.dialog.error(getValue('exception.featuresel'));
        return null;
      }
      return selected;
    }

    const features = this.layer_ ? this.layer_.getFeatures() : [];
    if (features.length === 0) {
      IDEE.dialog.error(getValue('exception.emptylayer'));
      return null;
    }
    return features;
  }

  /**
   * Comprueba que los elementos cumplen lo que necesita la operación.
   *
   * @param {TurfOperation} op Operación del catálogo.
   * @param {Object} fc FeatureCollection GeoJSON.
   * @returns {String|null} Mensaje de error o null si es válido.
   */
  static validate(op, fc) {
    const { min = 1, max, types } = op.input;
    const total = fc.features.length;

    if (max !== undefined && min === max && total !== min) {
      return replaceVars(getValue(`turf.exception.${ErrorKey.EXACT}`), { n: min });
    }
    if (total < min) {
      return replaceVars(getValue(`turf.exception.${ErrorKey.MIN}`), { n: min });
    }
    if (max !== undefined && total > max) {
      return replaceVars(getValue(`turf.exception.${ErrorKey.MAX}`), { n: max });
    }
    if (fc.features.some((f) => !f.geometry || !types.includes(f.geometry.type))) {
      return replaceVars(getValue(`turf.exception.${ErrorKey.TYPES}`), { types: types.join(', ') });
    }
    if (op.input.validate) {
      const errorKey = op.input.validate(fc);
      if (errorKey) {
        return getValue(`turf.exception.${errorKey}`);
      }
    }
    return null;
  }

  /**
   * Ejecuta una operación sobre los elementos de entrada y muestra el resultado.
   *
   * @param {TurfOperation} op Operación del catálogo.
   * @param {Object} params Valores del formulario de parámetros.
   */
  execute(op, params = {}) {
    if (TurfManager.isAvailable()) {
      const features = this.getInputFeatures();
      if (features !== null) {
        const fc = this.impl_.toGeoJSON(features);
        const error = TurfManager.validate(op, fc);
        if (error === null) {
          let result;
          try {
            result = op.mode === Mode.EACH
              ? fc.features.map((feature) => op.run(feature, params))
              : op.run(fc, params);
          } catch (e) {
            IDEE.toast.error(replaceVars(getValue(`turf.exception.${ErrorKey.ERROR}`), { msg: e.message }), null, 6000);
          }
          if (op.output === Output.GEOMETRY) {
            this.showGeometry(op, result);
          } else {
            TurfManager.showValue(op, result, params);
          }
        } else {
          IDEE.dialog.error(error, getValue(`turf.ops.${op.id}.name`));
        }
      }
    } else {
      IDEE.dialog.error(getValue(`turf.exception.${ErrorKey.NOT_LOADED}`));
    }
  }

  /**
   * Pinta en el mapa, en una capa nueva, las geometrías resultantes.
   *
   * @param {TurfOperation} op Operación del catálogo.
   * @param {Object|Array<Object>|null} result Resultado de Turf.
   */
  showGeometry(op, result) {
    const results = Array.isArray(result) ? result : [result];
    const geojsonFeatures = results
      .filter((r) => r)
      .flatMap((r) => (r.type === GeoJSONType.FEATURE_COLLECTION ? r.features : [r]))
      .filter((f) => f && f.geometry);

    if (geojsonFeatures.length !== 0) {
      const features = this.impl_.fromGeoJSON({
        type: GeoJSONType.FEATURE_COLLECTION,
        features: geojsonFeatures,
      });
      const opName = getValue(`turf.ops.${op.id}.name`);
      const index = this.getNextResultIndex_(op.id);
      const layer = new IDEE.layer.Vector({
        name: IDEE.utils.generateRandom(`turf_${op.id}_${index}_`),
        legend: `${getValue('turf.layerPrefix')} ${opName} (${index})`,
        extract: false,
        style: TurfManager.getResultStyle(),
      }, { displayInLayerSwitcher: true });
      this.map_.addLayers(layer);
      layer.addFeatures(features);

      IDEE.toast.success(replaceVars(getValue(`turf.results.${ResultKey.LAYER_CREATED}`), {
        layer: layer.legend || opName,
        n: features.length,
      }), null, 6000);
    } else {
      IDEE.toast.warning(getValue(`turf.exception.${ErrorKey.EMPTY}`), null, 6000);
    }
  }

  /**
   * Devuelve el siguiente número de orden para la capa de resultado de una
   * operación. Solo tiene en cuenta las capas creadas por Turf para esa
   * operación, que se identifican por su nombre interno
   * (turf_<operación>_<n>_<aleatorio>).
   *
   * @private
   * @param {String} opId Identificador de la operación.
   * @returns {Number} Mayor número existente más uno, o 1 si no hay ninguna.
   */
  getNextResultIndex_(opId) {
    const prefix = `turf_${opId}_`;
    const layers = this.map_.getLayers().concat(this.map_.getImpl().getAllLayerInGroup());
    const indexes = layers
      .filter((layer) => typeof layer.name === 'string' && layer.name.startsWith(prefix))
      .map((layer) => /^(\d+)_/.exec(layer.name.slice(prefix.length)))
      .filter((match) => match !== null)
      .map((match) => parseInt(match[1], 10));
    return indexes.length > 0 ? Math.max(...indexes) + 1 : 1;
  }

  /**
   * Define la capa sobre la que se ejecuta la operación.
   *
   * @param {IDEE.layer.Vector} layer Capa.
   */
  setLayer(layer) {
    this.layer_ = layer;
  }

  /**
   * Muestra un resultado que no es geometría en un toast o un diálogo.
   *
   * @param {TurfOperation} op Operación del catálogo.
   * @param {Object|Array<Object>|number|string|boolean|null} result Resultado de Turf.
   * @param {Object} params Valores del formulario de parámetros.
   */
  static showValue(op, result, params) {
    const opName = getValue(`turf.ops.${op.id}.name`);
    const text = op.format ? op.format(result, params) : String(result);
    if (op.display === Display.DIALOG) {
      IDEE.dialog.info(text, opName, undefined, { intelligence: false });
    } else {
      IDEE.toast.info(`${opName}: ${text}`, null, 6000);
    }
  }

  /**
   * Indica si Turf.js está cargado.
   *
   * @returns {Boolean}
   */
  static isAvailable() {
    return typeof turf !== 'undefined';
  }

  /**
   * Estilo de las capas de resultado, válido para cualquier tipo de geometría.
   *
   * @returns {IDEE.style.Generic}
   */
  static getResultStyle() {
    return new IDEE.style.Generic({
      point: {
        radius: 6,
        fill: { color: '#71a7d3', opacity: 0.9 },
        stroke: { color: '#ffffff', width: 1.5 },
      },
      line: {
        stroke: { color: '#71a7d3', width: 3 },
      },
      polygon: {
        fill: { color: '#71a7d3', opacity: 0.5 },
        stroke: { color: '#71a7d3', width: 2 },
      },
    });
  }
}
