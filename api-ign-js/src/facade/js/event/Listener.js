/**
 * @module M/evt/Listener
 */
import { isArray, isFunction, generateRandom } from '../util/Utils';

/**
  * @classdesc
  * Esta clase es la encargada de escuchar los evento.
  * @api
  */
class EventListener {
  /**
    * Constructor principal de la clase.
    * @constructor
    * @param {Function} listener Función "Callback" con el evento.
    * @param {Object} scope "Scope", Se asigna al evento usa el método "apply"
    * (Asignando explícitamente el objeto "this").
    * @param {Boolean} once Se produzca una vez, por defecto falso.
    * @api
    */
  constructor(listener, scope, once = false) {
    /**
      * Listener
      *
      * @private
      * @type {function}
      */
    this._listener = listener;

    /**
      * Scope
      *
      * @private
      * @type {Object}
      */
    this._scope = scope;

    /**
      * ID event, generate by random key
      *
      * @private
      * @type {String}
      */
    this.eventKey_ = generateRandom();

    /**
      * Once
      *
      * @private
      * @type {Boolean}
      */
    this.once_ = once;
  }

  /**
    * Disparador
    *
    * @public
    * @function
    * @param {Array} argsParam Argumento que se añadirá al "scope" del evento.
    * @api
    */
  fire(argsParam) {
    let args = argsParam;
    if (!isArray(args)) {
      args = [args];
    }
    this._listener.apply(this._scope, args);
  }

  /**
    * Devuelve el identificador del evento.
    *
    * @public
    * @function
    * @returns {M.EventListener.eventKey_} Identificador del evento.
    * @api
    */
  getEventKey() {
    return this.eventKey_;
  }

  /**
    * Devuelve si solo se ejecutará una vez.
    *
    * @public
    * @function
    * @returns {M.EventListener.once_} Devuelve el valor de la propiedad "once".
    * @api
    */
  isOnce() {
    return this.once_;
  }

  /**
    * Devuelve verdadero si el parámetro "listener" es una función y el "scope" tiene valor,
    * en caso contrario si el valor del identificador es igual a la función que
    * se le pasa por parámetros ("listener") devuelve verdadero.
    *
    * Si nada de esto se cumple devuelve falso.
    *
    * @public
    * @function
    * @param {Function} listener Función "Callback".
    * @param {Object} scope "Scope", Se asigna al evento usa el método "apply"
    * (Asignando explícitamente el objeto "this").
    * @returns {Boolean} Verdadero si el parámetro "listener" y el "scope" son correctos.
    * @api
    */
  has(listener, scope) {
    let has = false;
    if (isFunction(listener)) {
      has = this._listener === listener && this._scope === scope;
    } else {
      has = this.eventKey_ === listener;
    }
    return has;
  }
}

export default EventListener;
