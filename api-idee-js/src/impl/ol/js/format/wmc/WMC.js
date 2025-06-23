/**
 * @module IDEE/impl/format/WMC
 */
import Exception from 'IDEE/exception/exception';
import { getValue } from 'IDEE/i18n/language';
import { normalize } from 'IDEE/util/Utils';
import XML from '../XML';
import WMC110 from './WMC110';

/**
 * @classdesc
 * Formateador de capas WMC.
 *
 * @property {string} version Versión de WMC.
 * @property {ol.format.XML} parser Analizador de WMC.
 *
 * @api
 * @extends {IDEE.impl.format.XML}
 */
class WMC extends XML {
  /**
   * Constructor principal de la clase. Crea un formateador WMC.
   *
   * @constructor
   * @param {Mx.parameters.LayerOptions} options Parámetros opcionales para este formateador.
   * - projection: Proyección del WMC.
   * @api
   */
  constructor(options = {}) {
    super(options);

    /**
     * WMC version. Indica la versión del WMC.
     *
     * @public
     * @type {string}
     */
    this.version = null;

    /**
     * WMC parser. Analizador de una versión
     * específica de WMC.
     *
     * @public
     * @type {ol.format.XML}
     */
    this.parser = null;
  }

  /**
   * Este método obtiene el objeto WMC de un documento WMC.
   *
   * @public
   * @function
   * @param {Document} data Documento.
   * @return {Object} WMC.
   * @api
   */
  readFromDocument(data) {
    if (data.nodeType !== 9) {
      Exception(getValue('exception').must_be_document);
    }

    const root = data.documentElement;
    this.version = root.getAttribute('version');
    if (!this.version) {
      this.version = WMC.DEFAULT_VERSION;
    }

    const parserVersion = 'v'.concat(normalize(this.version).replace(/\./g, ''));
    this.parser = new WMC[parserVersion](this.options);

    const context = this.parser.read(data);

    return context;
  }
}

/**
 * Versión por defecto.
 * @constant
 * @api
 */
WMC.v110 = WMC110;
WMC.DEFAULT_VERSION = '1.1.0';

export default WMC;
