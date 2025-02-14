/**
 * @module M/Plugin
 */
import Base from './Base';
import { isUndefined, isNullOrEmpty } from './util/Utils';
import Exception from './exception/exception';
import * as EventType from './event/eventtype';
import { getValue } from './i18n/language';

/**
 * @classdesc
 * Esta clase crea los métodos necesarios para añadir los plugins al mapa.
 * @extends {M.facade.Base}
 * @api
 */
class Plugin extends Base {
  /**
   * Este método añade el plugin al mapa.
   *
   * @public
   * @function
   * @param {Object} map Añade el plugin al mapa.
   * @api
   */
  addTo(map) {
    // checks if the parameter is null or empty
    if (isNullOrEmpty(map)) {
      Exception(getValue('exception').no_map);
    }

    // checks if the implementation can add itself into the map
    const impl = this.getImpl();
    if (isUndefined(impl.addTo)) {
      Exception(getValue('exception').addto_method);
    }

    const view = this.createView(map);
    // checks if the view is a promise
    if (view instanceof Promise) {
      view.then((html) => {
        impl.addTo(map, html);
        // executes load callback
        this.fire(EventType.ADDED_TO_MAP);
      });
    } else { // view is an HTML or text
      impl.addTo(map, view);
      // executes load callback
      this.fire(EventType.ADDED_TO_MAP);
    }
  }

  /**
   * Añade la vista al mapa.
   * @public
   * @function
   * @param {M.Map} map Añade la vista al mapa.
   * @api
   */
  createView(map) {}

  /**
   * Devuelve los plugins.
   * @public
   * @function
   * @param {Array} controls Devuelve los plugins.
   * @api
   */
  getControls() {}
}

export default Plugin;
