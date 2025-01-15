/**
 * @module M/evt/EventsManager
 */
import { isNullOrEmpty, isFunction } from '../util/Utils';
import EventListener from './Listener';

/**
  * @classdesc
  * Esta clase crea los métodos necesarios para
  * poder manejar los eventos.
  * @api
  */
class EventsManager {
  /**
    * Constructor principal de la clase.
    * @constructor
    * @api
    */
  constructor() {
    /**
      * Eventos.
      *
      * @private
      * @type {Object}
      */
    this.events_ = {};
  }

  /**
    * Este método añade un evento.
    *
    * @public
    * @function
    * @param {String} eventType Tipo de evento.
    * @param {function} listener Función "Callback".
    * @param {Object} optThis "Scope", Se asigna al evento usa el método "apply"
    * (Asignando explícitamente el objeto "this").
    * @param {Boolean} once Define si solo se activa una vez, por defecto falso.
    * @returns {M.eventKey} Identificador del evento.
    * @api
    */
  add(eventType, listener, optThis, once = false) {
    let eventKey;
    if (!isNullOrEmpty(eventType) && isFunction(listener)) {
      if (isNullOrEmpty(this.events_[eventType])) {
        this.events_[eventType] = [];
      }
      if (this.indexOf(eventType, listener, optThis) === -1) {
        const EventsManagerListener = new EventListener(listener, optThis, once);
        this.events_[eventType].push(EventsManagerListener);
        eventKey = EventsManagerListener.getEventKey();
      }
    }
    return eventKey;
  }

  /**
    * Este método elimina el evento.
    *
    * @public
    * @function
    * @param {String} eventType Tipo de evento.
    * @param {function} listener Función "Callback".
    * @param {Object} optThis "Scope", Se asigna al evento usa el método "apply"
    * (Asignando explícitamente el objeto "this").
    * @api
    */
  remove(eventType, listener, optThis) {
    const listeners = this.events_[eventType];
    if (!isNullOrEmpty(listeners)) {
      const index = this.indexOf(eventType, listener, optThis);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
    * Este método elimina el identificador del evento.
    *
    * @public
    * @function
    * @param {String} eventType Tipo de evento.
    * @param {Number} key Identificador del evento.
    * @api
    */
  removeByKey(eventType, key) {
    const listeners = this.events_[eventType];
    if (!isNullOrEmpty(listeners)) {
      const index = listeners.map((listener, index2) => {
        let i = -1;
        if (listener.getEventKey() === key) {
          i = index2;
        }
        return i;
      });
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
    * Este método dispara el evento.
    *
    * @public
    * @function
    * @param {String} eventType Tipo de evento.
    * @param {Array} args Argumentos.
    * @api
    */
  fire(eventType, args) {
    const EventsManagerListeners = [].concat(this.events_[eventType]);
    if (!isNullOrEmpty(EventsManagerListeners)) {
      EventsManagerListeners.forEach((EventManagerListener) => {
        EventManagerListener.fire(args);
        if (EventManagerListener.isOnce() === true) {
          this.remove(eventType, EventManagerListener.getEventKey());
        }
      });
    }
  }

  /**
    * Este método añade indice a los eventos.
    *
    * @public
    * @function
    * @param {String} eventType Tipo de evento.
    * @param {function} listener Función "Callback".
    * @param {Object} optThis "Scope", Se asigna al evento usa el método "apply"
    * (Asignando explícitamente el objeto "this").
    * @returns {Number} Indice del evento.
    * @api
    */
  indexOf(eventType, listener, optThis) {
    let index = -1;
    const evtListeners = this.events_[eventType];
    if (!isNullOrEmpty(evtListeners)) {
      for (let i = 0, ilen = evtListeners.length; i < ilen; i += 1) {
        if (evtListeners[i].has(listener, optThis)) {
          index = i;
          break;
        }
      }
    }
    return index;
  }
}

export default EventsManager;
