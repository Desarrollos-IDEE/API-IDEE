/**
 * @module IDEE/impl/style/Choropleth
 */
import Thematic from './Thematic';
import { toRangesFlatStyle } from './FlatStyleTranslator';

/**
 * @classdesc
 * Implementación del estilo de coropletas.
 * @api
 * @extends {IDEE.impl.style.Thematic}
 */
class Choropleth extends Thematic {
  /**
   * Devuelve el estilo plano equivalente.
   *
   * @public
   * @function
   * @param {Object} definition Definición: attributeName, breakPoints, styles.
   * @param {Array<IDEE.Feature>} features Objetos geográficos de la capa.
   * @returns {Array<Object>|null} Reglas de estilo plano, o nulo.
   * @api
   */
  toFlatStyle({ attributeName, breakPoints, styles }, features) {
    const allNumbers = features.every((feature) => {
      const value = feature.getAttribute(attributeName);
      return value === null || value === undefined || typeof value === 'number';
    });
    if (!allNumbers || !breakPoints || breakPoints.length === 0) {
      return null;
    }
    const rulesByRange = breakPoints.map((breakPoint, i) => Thematic.toStyleRules(styles[i]));
    if (rulesByRange.includes(null)) {
      return null;
    }
    return toRangesFlatStyle(attributeName, breakPoints, rulesByRange);
  }

  /**
   * Devuelve el estilo del intervalo del objeto geográfico.
   *
   * @public
   * @function
   * @param {ol.Feature} olFeature Objeto geográfico de OpenLayers.
   * @returns {IDEE.Style|undefined} Estilo del intervalo.
   * @api
   */
  getFeatureStyle(olFeature) {
    const { attributeName, breakPoints, styles } = this.definition_;
    const value = olFeature.get(attributeName);
    const index = breakPoints.findIndex((breakPoint) => value <= breakPoint);
    return index === -1 ? undefined : styles[index];
  }
}

export default Choropleth;
