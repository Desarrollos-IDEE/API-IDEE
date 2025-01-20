/**
 * @module M/impl/RenderFeature
 */

import FacadeRenderFeature from 'M/feature/RenderFeature';
import { isNullOrEmpty } from 'M/util/Utils';

/**
 * @classdesc
 * Crear un objeto geográfico renderizado.
 * @api
*/
class RenderFeature {
  /**
   * Contructor principal de la clase.
   * @constructor
   * @api
   */
  constructor() {
    /**
     * OL Objeto geográfico.
     * @private
     * @type {ol/render/Feature}
     */
    this.olFeature_ = null;
  }

  /**
   * Este método retorna el objeto geográfico de Openlayer.
   * @public
   * @function
   * @return {OLFeature} Retorna el objeto geográfico de Openlayer.
   * @api
   * @deprecated
   */
  getOLFeature() {
    return this.olFeature_;
  }

  /**
   * Este método retorna el objeto geográfico de Openlayer.
   * @public
   * @function
   * @return {OLFeature} Retorna el objeto geográfico de Openlayer.
   * @api
   */
  getFeature() {
    return this.olFeature_;
  }

  /**
   * Retorna de que tipo es el objeto geográfico.
   * @function
   * @public
   * @return {string} El tipo del objeto geográfico.
   * @api
   */
  getType() {
    return this.getFeature().getType();
  }

  /**
   * Este método sobrescribe el objeto geográfico de openlayers.
   * @public
   * @param {OLFeature} olFeature Nuevo objeto geográfico.
   * @function
   * @api
   * @deprecated
   */
  setOLFeature(olFeature) {
    if (!isNullOrEmpty(olFeature)) {
      this.olFeature_ = olFeature;
    }
  }

  /**
   * Este método sobrescribe el objeto geográfico de openlayers.
   * @public
   * @param {OLFeature} olFeature Nuevo objeto geográfico.
   * @function
   * @api
   */
  setFeature(olFeature) {
    if (!isNullOrEmpty(olFeature)) {
      this.olFeature_ = olFeature;
    }
  }

  /**
   * Este método retorna los atributos del objeto geográfico.
   * @public
   * @return {Object} Atributos del objeto geográfico.
   * @function
   * @api
   */
  getAttributes() {
    const properties = this.olFeature_.getProperties();
    return properties;
  }

  /**
   * Este método de la clase transforma "OLFeature" (Objeto geográfico de Openlayers)
   * a "M.Feature" (Objeto geográfico de API-IDEE).
   * @public
   * @function
   * @param {OLFeature} olFeature Objeto "OLFeature" (Objeto geográfico de Openlayers).
   * @param {boolean} canBeModified Define si se puede modificar.
   * @return {M.Feature} Retorna el objeto "M.Feature" (Objeto geográfico de API-IDEE).
   * @api
   * @deprecated
   */
  static olFeature2Facade(olFeature, canBeModified) {
    let facadeFeature = null;
    if (!isNullOrEmpty(olFeature)) {
      facadeFeature = new FacadeRenderFeature();
      facadeFeature.getImpl().setOLFeature(olFeature);
    }
    return facadeFeature;
  }

  /**
   * Este método de la clase transforma "OLFeature" (Objeto geográfico de Openlayers)
   * a "M.Feature" (Objeto geográfico de API-IDEE).
   * @public
   * @function
   * @param {OLFeature} olFeature Objeto "OLFeature" (Objeto geográfico de Openlayers).
   * @param {boolean} canBeModified Define si se puede modificar.
   * @return {M.Feature} Retorna el objeto "M.Feature" (Objeto geográfico de API-IDEE).
   * @api
   */
  static feature2Facade(olFeature, canBeModified) {
    let facadeFeature = null;
    if (!isNullOrEmpty(olFeature)) {
      facadeFeature = new FacadeRenderFeature();
      facadeFeature.getImpl().setFeature(olFeature);
    }
    return facadeFeature;
  }

  /**
   * Método de la clase transforma "M.Feature" (Objeto geográfico de API-IDEE)
   * a "OLFeature" (Objeto geográfico de Openlayers).
   * @public
   * @function
   * @param {M.Feature} facadeFeature Objeto "M.Feature" (Objeto geográfico de API-IDEE).
   * @return {OLFeature} Retorna el objeto "OLFeature" (Objeto geográfico de Openlayers).
   * @api
   * @deprecated
   */
  static facade2OLFeature(feature) {
    return feature.getImpl().getOLFeature();
  }

  /**
   * Método de la clase transforma "M.Feature" (Objeto geográfico de API-IDEE)
   * a "OLFeature" (Objeto geográfico de Openlayers).
   * @public
   * @function
   * @param {M.Feature} facadeFeature Objeto "M.Feature" (Objeto geográfico de API-IDEE).
   * @return {OLFeature} Retorna el objeto "OLFeature" (Objeto geográfico de Openlayers).
   * @api
   */
  static facade2Feature(feature) {
    return feature.getImpl().getFeature();
  }

  /**
   * Este método retorna el valor del atributo indicado.
   * @public
   * @function
   * @param {string} attribute Nombre del atributo.
   * @return  {string|number|object} Retorna el valor del atributo indicado.
   * @api
   */
  getAttribute(attribute) {
    return this.olFeature_.get(attribute);
  }

  /**
   * Este método establece el vector de la clase de la fachada.
   * @public
   * @function
   * @param {object} obj Vector de la fachada.
   * @api
   */
  setFacadeObj(obj) {
    this.facadeFeature_ = obj;
  }

  /**
   * Este método retorna el centroide del objeto geográfico.
   * @public
   * @function
   * @return {Array<number>} Retorna el centroide del objeto geográfico.
   * @api
   */
  getCentroid() {}
}

export default RenderFeature;
