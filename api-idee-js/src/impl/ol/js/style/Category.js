/**
 * @module IDEE/impl/style/Category
 */
import { isNullOrEmpty } from 'IDEE/util/Utils';
import Thematic from './Thematic';
import { toCategoryFlatStyle } from './FlatStyleTranslator';

const OTHER = 'other';

/**
 * @classdesc
 * Implementación del estilo por categorías.
 * @api
 * @extends {IDEE.impl.style.Thematic}
 */
class Category extends Thematic {
  /**
   * Devuelve el estilo plano equivalente.
   * Los valores del atributo deben ser todos números o todos cadenas.
   *
   * @public
   * @function
   * @param {Object} definition Definición: attributeName, styles.
   * @param {Array<IDEE.Feature>} features Objetos geográficos de la capa.
   * @returns {Array<Object>|null} Reglas de estilo plano, o nulo.
   * @api
   */
  toFlatStyle({ attributeName, styles }, features) {
    const types = new Set(features
      .map((feature) => feature.getAttribute(attributeName))
      .filter((value) => !isNullOrEmpty(value))
      .map((value) => typeof value));
    if (types.size > 1 || [...types].some((type) => type !== 'number' && type !== 'string')) {
      return null;
    }
    const numeric = types.has('number');
    const entries = [];
    const keys = Object.keys(styles).filter((key) => key !== OTHER);
    for (let i = 0; i < keys.length; i += 1) {
      const value = numeric ? Number(keys[i]) : keys[i];
      const rules = Thematic.toStyleRules(styles[keys[i]]);
      if (Number.isNaN(value) || rules === null) {
        return null;
      }
      entries.push({ value, rules });
    }
    const otherRules = isNullOrEmpty(styles[OTHER]) ? null : Thematic.toStyleRules(styles[OTHER]);
    if (!isNullOrEmpty(styles[OTHER]) && otherRules === null) {
      return null;
    }
    return toCategoryFlatStyle(attributeName, entries, otherRules);
  }

  /**
   * Devuelve el estilo de la categoría del objeto geográfico.
   *
   * @public
   * @function
   * @param {ol.Feature} olFeature Objeto geográfico de OpenLayers.
   * @returns {IDEE.Style|undefined} Estilo de la categoría.
   * @api
   */
  getFeatureStyle(olFeature) {
    const { attributeName, styles } = this.definition_;
    return styles[olFeature.get(attributeName)] || styles[OTHER];
  }
}

export default Category;
