/**
 * @module IDEE/impl/control/Attributions
 */
import Control from './Control';

/**
 * Eventos del mapa que puede pedir la fachada y su equivalente en Cesium.
 * @const
 * @type {Object}
 */
const CAMERA_EVENTS = {
  moveend: 'moveEnd',
};

/**
 * @classdesc
 * Implementación del control de atribuciones para Cesium. La fachada gestiona
 * el contenido; la implementación solo avisa cuando la cámara termina de moverse.
 *
 * @api
 * @extends {IDEE.impl.control.Control}
 */
class Attributions extends Control {
  /**
   * Constructor principal de la clase.
   *
   * @constructor
   * @param {Object} options Opciones del control.
   * @api
   */
  constructor(options = {}) {
    super(options);

    /**
     * Funciones para dar de baja los eventos registrados.
     * @private
     * @type {Array<Function>}
     */
    this.removeListeners_ = [];
  }

  /**
   * Registra un evento del mapa.
   *
   * @public
   * @function
   * @param {String} type Tipo de evento ('moveend').
   * @param {IDEE.Map} map Mapa.
   * @param {Function} callback Función que se ejecuta con el evento.
   * @api
   */
  registerEvent(type, map, callback) {
    const cameraEvent = CAMERA_EVENTS[type];
    if (cameraEvent) {
      const { camera } = map.getMapImpl();
      this.removeListeners_.push(camera[cameraEvent].addEventListener(() => callback()));
    }
  }

  /**
   * Destruye el control y da de baja sus eventos.
   *
   * @public
   * @function
   * @api
   */
  destroy() {
    this.removeListeners_.forEach((remove) => remove());
    this.removeListeners_ = [];
    super.destroy();
  }
}

export default Attributions;
