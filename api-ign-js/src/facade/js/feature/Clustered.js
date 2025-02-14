/**
 * @module M/ClusteredFeature
 */
import Feature from './Feature';
import { generateRandom } from '../util/Utils';

/**
 * @classdesc
 * Crea objetos geográficos agrupados.
 * @extends {M.Feature}
 * @api
 */
class Clustered extends Feature {
  /**
   * Constructor principal de la clase.
   *
   * @constructor
   * @param {Array<M.Feature>} features Array de objetos geográficos.
   * @param {Object} attributes Atributos.
   * @api
   */
  constructor(features, attributes) {
    super(generateRandom('_mapea_cluster_'));
    this.setAttributes(attributes);
    this.setAttribute('features', features);
  }
}
export default Clustered;
