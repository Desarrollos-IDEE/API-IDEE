/**
 * @module IDEE/impl/layer/Sections
 */
import MObject from 'IDEE/Object';

/**
 * @classdesc
 * Esta clase representa una sección de capas de cualquier tipo dentro de un mapa. Si la
 * sección ya está añadida al mapa, las capas añadidas a la sección se añadirán automáticamente
 * al mapa, y las capas eliminadas de la sección se eliminarán automáticamente del mapa.
 * Los elementos dentro de la sección son considerados como hijos de la sección.
 *
 * @property {string} idLayer_ Identificador de la sección.
 * @property {string} title_ Título de la sección.
 * @property {number} order_ Orden de visualización de la sección.
 * @property {number} zindex_ ZIndex de la sección.
 *
 * @api
 * @extends {IDEE.Object}
 */
class Sections extends MObject {
  /**
   * Constructor principal de la clase. Crea una nueva instancia de la
   * clase Sections con parametros específicados por el usuario.
   *
   * @constructor
   * @implements {IDEE.Object}
   * @param {string} idLayer Identificador de la sección.
   * @param {string} title Título de la sección.
   * @param {number} order Orden de visualización de la sección.
   * @api
   */
  constructor(idLayer, title, order) {
    super();

    /**
     * Identificador de la sección.
     * @private
     * @type {string}
     * @api
     */
    this.idLayer_ = idLayer;

    /**
     * Título de la sección.
     * @private
     * @type {string}
     * @api
     */
    this.title_ = title;

    /**
     * Orden de visualización de la sección.
     * @private
     * @type {number}
     * @api
     */
    this.order_ = order;

    /**
     * zIndex de la sección.
     * @private
     * @type {number}
     * @api
     */
    this.zindex_ = null;
  }
}

export default Sections;
