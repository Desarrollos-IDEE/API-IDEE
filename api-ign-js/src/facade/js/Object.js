/**
 * @module M/Object
 */
import EventsManager from './event/Manager';
import { isNullOrEmpty } from './util/Utils';

/**
 * @classdesc
 * Objeto principal API-CNIG. Esta clase crea un Objeto
 * que gestiona los eventos.
 * @apì
 */
class MObject {
  /**
   * Constructor principal de la clase.
   *
   * @constructor
   * @api
   */
  constructor() {
    /**
     * "Callback" para eventos gestionados por el
     * objeto de fachada.
     *
     * @private- Clase para manejar eventos.
     */
    this.eventsManager_ = new EventsManager();
  }

  /**
   * Establece "callback" cuando se carga la instancia.
   *
   * @public
   * @function
   * @param {M.eventType} eventType Evento "M.evt".
   * @param {Function} listener Función "callback".
   * @param {Object} optThis "Scope", valor de "this".
   * @api
   */
  on(eventType, listener, optThis) {
    return this.eventsManager_.add(eventType, listener, optThis);
  }

  /**
   * Establece "callback" cuando se carga la instancia.
   *
   * @public
   * @function
   * @param {M.eventType} eventType Evento "M.evt".
   * @param {Function} listener Función "callback".
   * @param {Object} optThis "Scope", valor de "this".
   * @api
   */
  once(eventType, listener, optThis) {
    return this.eventsManager_.add(eventType, listener, optThis, true);
  }

  /**
   * Establece "callback" cuando se carga la instancia.
   *
   * @public
   * @function
   * @param {M.eventType} eventType Event "M.evt".
   * @param {Function} listener Function "callback".
   * @param {Object} optThis "Scope", valor de "this".
   * @api
   */
  un(eventType, listener, optThis) {
    this.eventsManager_.remove(eventType, listener, optThis);
  }

  /**
   * Establece "callback" cuando se carga la instancia.
   *
   * @public
   * @function
   * @param {M.eventType} eventType Evento "M.evt".
   * @param {String} key "Key" del evento.
   * @api
   */
  unByKey(eventType, key) {
    this.eventsManager_.remove(eventType, key);
  }

  /**
   * Establece "callback" cuando se carga la instancia.
   *
   * @public
   * @function
   * @param {M.eventType} eventType Evento "M.evt".
   * @param {Array} argsParam Matriz de argumentos.
   * @api
   */
  fire(eventType, argsParam) {
    let args = argsParam;
    if (isNullOrEmpty(args)) {
      args = [this];
    }
    this.eventsManager_.fire(eventType, args);
  }
}

export default MObject;
