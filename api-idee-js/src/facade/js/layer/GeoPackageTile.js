/**
 * @module IDEE/layer/GeoPackageTile
 */
import GeoPackageTileImpl from 'impl/layer/GeoPackageTile';
import LayerBase from './Layer';
import * as LayerType from './Type';
import {
  isUndefined, isObject, isNullOrEmpty, isFunction,
} from '../util/Utils';
import Exception from '../exception/exception';
import { getValue } from '../i18n/language';

/**
 * @classdesc
 * Las capas GeoPackageTiles representan capas ráster en formato GeoPackage, donde las teselas
 * están organizadas por niveles de zoom dentro de un contenedor SQLite.
 *
 * @property {Object} attribution Atribución de la capa.
 * @property {string} type Tipo de la capa.
 * @property {string} name Nombre de la capa.
 * @property {Boolean} transparent (deprecated) Falso si es una capa base,
 * verdadero en caso contrario.
 * @property {Boolean} isBase Define si la capa es base.
 * @property {Array<Number>} userMaxExtent MaxExtent proporcionado por el usuario, la medida en que
 * restringe la visualización a una región específica.
 * @property {string} legend Indica el nombre que queremos que aparezca en el árbol
 * de contenidos, si lo hay.
 * @property {Number} minZoom Zoom mínimo aplicable a la capa.
 * @property {Number} maxZoom Zoom máximo aplicable a la capa.
 * @property {string} idLayer Identificador de la capa.
 *
 * @api
 * @extends {IDEE.layer}
 */
class GeoPackageTile extends LayerBase {
  /**
   * Constructor principal de la clase. Crea una capa GeoPackageTile
   * con parámetros especificados por el usuario.
   *
   * @constructor
   * @param {string|Mx.parameters.GeoPackageTile} userParameters Parámetros proporcionados
   * por el usuario.
   * - attribution: Atribución de la capa.
   * - name: Nombre de la capa.
   * - isBase: Indica si la capa es base.
   * - transparent (deprecated): Falso si es una capa base, verdadero en caso contrario.
   * - legend: Nombre asociado en el árbol de contenidos, si usamos uno.
   * - tileLoadFunction: Función de carga de tiles.
   * - opacity: Opacidad de capa, por defecto 1.
   * - visibility: Define si la capa es visible o no. Verdadero por defecto.
   * - extent: La medida en que restringe la visualización a una región específica.
   * - minZoom: Zoom mínimo aplicable a la capa.
   * - maxZoom: Zoom máximo aplicable a la capa.
   * @param {IDEE.TileProvider} provider Proveedor de teselas para una capa ráster
   * en un archivo GeoPackage.
   * @api
   */
  constructor(userParameters, provider) {
    // checks if the implementation can create GeoPackageTile
    if (isUndefined(GeoPackageTileImpl) || (isObject(GeoPackageTileImpl)
      && isNullOrEmpty(Object.keys(GeoPackageTileImpl)))) {
      Exception(getValue('exception').geopackagetile_method);
    }

    const parameters = userParameters;
    parameters.type = !parameters.type ? LayerType.GeoPackageTile : parameters.type;

    const impl = new GeoPackageTileImpl(userParameters, provider);

    // calls the super constructor
    super(userParameters, impl);
  }

  /**
   * Este método calcula la extensión máxima de esta capa.
   *
   * @function
   * @param {Function} callbackFn Función "callback" opcional.
   * @returns {Array<number>} Devuelve la extensión máxima.
   * @api
   */
  getMaxExtent(callbackFn) {
    let maxExtent;
    if (isNullOrEmpty(this.userMaxExtent)) {
      this.getImpl().getExtentFromProvider().then((gpkgExtent) => {
        if (isNullOrEmpty(gpkgExtent)) {
          if (isNullOrEmpty(this.map_.userMaxExtent)) {
            const projMaxExtent = this.map_.getProjection().getExtent();
            this.maxExtent_ = projMaxExtent;
          } else {
            this.maxExtent_ = this.map_.userMaxExtent;
            maxExtent = this.maxExtent_;
          }
        } else {
          this.maxExtent_ = gpkgExtent;
        }
        if (isFunction(callbackFn)) {
          callbackFn(this.maxExtent_);
        }
      });
    } else {
      maxExtent = this.userMaxExtent;
    }
    if (!isNullOrEmpty(maxExtent) && isFunction(callbackFn)) {
      callbackFn(maxExtent);
    } else if (isNullOrEmpty(maxExtent)) {
      maxExtent = this.maxExtent_;
    }
    return maxExtent;
  }

  /**
   * Este método calcula la extensión máxima de esta capa.
   *
   * Versión asíncrona de getMaxExtent.
   * @function
   * @returns {Promise} Devuelve una promesa con el maxExtent de la capa.
   * @api
   */
  calculateMaxExtent() {
    return new Promise((resolve) => { this.getMaxExtent(resolve); });
  }

  /**
   * Este método comprueba si un objeto es igual
   * a esta capa.
   *
   * @function
   * @public
   * @param {Object} obj Objeto a comparar.
   * @returns {Boolean} Valor verdadero es igual, falso no lo es.
   * @api
   */
  equals(obj) {
    let equals = false;
    if (obj instanceof GeoPackageTile) {
      equals = this.name === obj.name;
      equals = equals && (this.idLayer === obj.idLayer);
    }
    return equals;
  }
}

export default GeoPackageTile;
