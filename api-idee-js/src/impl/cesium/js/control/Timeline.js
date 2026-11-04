/**
 * @module IDEE/impl/control/Timeline
 */
import { getValue } from 'IDEE/i18n/language';
import Control from './Control';

/**
 * @classdesc
 * Hereda de {@link module:IDEE/impl/control/Control|Control}.
 * Adaptador Cesium del control de línea de tiempo.
 *
 * Cumple el mismo contrato que la implementación OpenLayers, pero la funcionalidad
 * temporal en 3D todavía no está disponible: isSupported() devuelve falso, ninguna
 * capa es compatible y no se aplican filtros. La fachada muestra un aviso en el panel.
 * Para incorporar el 3D basta con implementar estos métodos.
 *
 * @api
 * @extends {module:IDEE/impl/control/Control}
 */
class Timeline extends Control {
  /**
   * Indica si la implementación dispone de funcionalidad temporal.
   * No disponible para Cesium.
   *
   * @public
   * @function
   * @returns {Boolean} Falso en Cesium.
   * @api
   */
  isSupported() {
    return false;
  }

  /**
   * Indica si la capa puede utilizarse en la modalidad temporal indicada.
   * No disponible para Cesium.
   *
   * @public
   * @function
   * @returns {Boolean} Falso en Cesium.
   * @api
   */
  supportsLayer() {
    return false;
  }

  /**
   * Aplica un filtro temporal a la capa.
   * No disponible para Cesium.
   *
   * @public
   * @function
   * @returns {Boolean} Falso, no se aplica ningún filtro.
   * @api
   */
  applyTemporalFilter() {
    // eslint-disable-next-line no-console
    console.warn(getValue('exception').timeline_cesium);
    return false;
  }

  /**
   * Restaura el filtro previo de la capa.
   * No disponible para Cesium: no hay filtros que restaurar.
   *
   * @public
   * @function
   * @api
   */
  removeTemporalFilter() {}
}

export default Timeline;
