/**
 * @module M/RenderFeature
 */
import RenderFeatureImpl from 'impl/feature/RenderFeature';
import Base from '../Base';
import { isNullOrEmpty, generateRandom } from '../util/Utils';

/**
 * @classdesc
 * Crea un objeto geográfico de renderizado.
 * @extends {M.facade.Base}
 * @api
 */
class RenderFeature extends Base {
  /**
   * Constructor principal de la clase.
   * @constructor
   * @api
   */
  constructor() {
    /**
     * Implementación de la clase.
     * @public
     * @type {M.impl.Feature}
     */
    const impl = new RenderFeatureImpl();
    super(impl);

    /**
     * Identificador del objeto geográfico.
     * @private
     * @type {string}
     * @api
     */
    this.id_ = generateRandom('mapea', 'render_feature');
  }

  /**
   * Este método retorna el identificador
   * del objeto geográfico.
   *
   * @public
   * @function
   * @return {string} Identificador del objeto geográfico.
   * @api
   */
  getId() {
    return this.id_;
  }

  /**
   * Este método retorna la geometría del objeto geográfico.
   *
   * @public
   * @function
   * @return {object} Geometría del objeto geográfico.
   * @api
   */
  getGeometry() {
    return null;
  }

  /**
   * Este método retorna los atributos de los objetos geográficos.
   *
   * @public
   * @function
   * @return {Object} Atributos del objeto geográfico.
   * @api
   */
  getAttributes() {
    return this.getImpl().getAttributes();
  }

  /**
   * Retorna el tipo de la geometría del objeto geográfico.
   *
   * @function
   * @public
   * @return {string} Tipo de la geometría del objeto geográfico.
   * @api
   */
  getType() {
    return this.getImpl().getType();
  }

  /**
   * Este método retorna el valor del atributo indicado.
   *
   * @public
   * @function
   * @param {string} attribute Nombre del atributo.
   * @return  {string|number|object} Retorna el valor del atributo indicado.
   * @api
   */
  getAttribute(attribute) {
    let attrValue;

    attrValue = this.getImpl().getAttribute(attribute);
    if (isNullOrEmpty(attrValue)) {
      // we look up the attribute by its path. Example: getAttribute('foo.bar.attr')
      // --> return feature.properties.foo.bar.attr value
      const attrPath = attribute.split('.');
      if (attrPath.length > 1) {
        attrValue = attrPath.reduce((obj, attr) => {
          let attrParam;
          if (!isNullOrEmpty(obj)) {
            if (obj instanceof RenderFeature) {
              attrParam = obj.getAttribute(attr);
            } else {
              attrParam = obj[attr];
            }
          }
          return attrParam;
        }, this);
      }
    }
    return attrValue;
  }

  /**
   * Este método retorna si dos objetos geográficos son iguales.
   * @public
   * @function
   * @param {M.Feature} feature Objeto geográfico.
   * @return {bool} Retorna el resultado de comparar los dos objetos geográficos.
   * @api
   */
  equals(feature) {
    return this.getId() === feature.getId();
  }
}

export default RenderFeature;
