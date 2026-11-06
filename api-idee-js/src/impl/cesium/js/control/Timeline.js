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

  /**
   * Indica si las líneas o puntos de la capa pueden formar un recorrido.
   * No disponible para Cesium.
   *
   * @public
   * @function
   * @returns {Boolean} Falso en Cesium.
   * @api
   */
  supportsTrackSource() {
    return false;
  }

  /**
   * Dibuja un recorrido.
   * No disponible para Cesium.
   *
   * @public
   * @function
   * @returns {Boolean} Falso, no se dibuja ningún recorrido.
   * @api
   */
  showTrack() {
    return false;
  }

  /**
   * Dibuja el tramo realizado y la posición actual del recorrido.
   * No disponible para Cesium.
   *
   * @public
   * @function
   * @api
   */
  updateTrack() {}

  /**
   * Retira el recorrido.
   * No disponible para Cesium.
   *
   * @public
   * @function
   * @api
   */
  hideTrack() {}

  /**
   * Indica si la implementación puede mostrar perfiles topográficos.
   * No disponible para Cesium.
   *
   * @public
   * @function
   * @returns {Boolean} Falso en Cesium.
   * @api
   */
  supportsTopographicProfile() {
    return false;
  }

  /**
   * Muestra un perfil topográfico.
   * No disponible para Cesium.
   *
   * @public
   * @function
   * @returns {Boolean} Falso, no se muestra ningún perfil.
   * @api
   */
  showTopographicProfile() {
    return false;
  }

  /**
   * Coloca el cursor del perfil abierto.
   * No disponible para Cesium.
   *
   * @public
   * @function
   * @api
   */
  setTopographicProfilePosition() {}

  /**
   * Cierra el perfil topográfico.
   * No disponible para Cesium.
   *
   * @public
   * @function
   * @api
   */
  hideTopographicProfile() {}
}

export default Timeline;
