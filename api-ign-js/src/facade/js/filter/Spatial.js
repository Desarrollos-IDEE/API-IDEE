/**
 * @module M/filter/Spatial
 */
import FilterFunction from './Function';
import { isNullOrEmpty } from '../util/Utils';

/**
  * @classdesc
  * Crea un filtro para todos los objetos geográficos
  * de "Spatial".
  * @extends {M.filter.Function}
  * @api
  */
class Spatial extends FilterFunction {
  /**
    * Constructor principal de la clase.
    * @constructor
    * @param {function} Function Función filtro.
    * @param {object} options Opciones.
    * @api
    */
  constructor(FunctionParam, options) {
    const filterFunction = (feature, index) => {
      let geometry = null;
      if (!isNullOrEmpty(feature)) {
        geometry = feature.getGeometry();
      }
      return FunctionParam(geometry, index);
    };
    super(filterFunction, options);
  }
}

export default Spatial;
