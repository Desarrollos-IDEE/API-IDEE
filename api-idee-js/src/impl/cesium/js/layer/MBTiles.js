/**
 * @module IDEE/impl/layer/MBTiles
 */
import { isNullOrEmpty, extend } from 'IDEE/util/Utils';
import {
  getValue,
} from 'IDEE/i18n/language';
import {
  ImageryLayer,
  Rectangle,
} from 'cesium';
import Layer from './Layer';
import MBTileImageryProvider from '../provider/MBTileImageryProvider';
import ImplUtils from '../util/Utils';

/**
 * @classdesc
 * Implementación de la capa MBTiles.
 *
 * @property {function} tileLoadFunction_ Función de carga de la tesela vectorial.
 * @property {string} url_ URL del fichero o servicio que genera el MBTiles.
 * @property {ArrayBuffer|Uint8Array|Response|File} source_ Fuente de la capa.
 * @property {Mx.Extent} maxExtent_ La medida en que restringe la visualización
 * a una región específica.
 * @property {number} maxZoomLevel_ Zoom máximo aplicable a la capa.
 * @property {number} opacity_ Opacidad de capa.
 * @property {number} zIndex_ zIndex de la capa.
 * @property {boolean} visibility Define si la capa es visible o no.
 *
 * @api
 * @extends {IDEE.impl.Layer}
 */
class MBTiles extends Layer {
  /**
   * Constructor principal de la clase. Crea una capa de implementación MBTiles
   * con parámetros especificados por el usuario.
   *
   * @constructor
   * @param {String|Mx.parameters.MBTiles} userParameters Parámetros para
   * la construcción de la capa.
   * - name: Nombre de la capa en la leyenda.
   * - url: Url del fichero o servicio que genera el MBTiles.
   * - type: Tipo de la capa.
   * - transparent (deprecated): Falso si es una capa base, verdadero en caso contrario.
   * - maxExtent: La medida en que restringe la visualización a una región específica.
   * - legend: Indica el nombre que aparece en el árbol de contenidos, si lo hay.
   * - tileLoadFunction: Función de carga de la tesela proporcionada por el usuario.
   * - source: Fuente de la capa.
   * - tileSize: Tamaño de la tesela, por defecto 256.  NO SE USA
   * - visibility: Define si la capa es visible o no. Verdadero por defecto.
   * - opacity: Opacidad de capa, por defecto 1.
   * @param {Mx.parameters.LayerOptions} options Opciones personalizadas para esta capa.
   * - displayInLayerSwitcher: Indica si la capa se muestra en el selector de capas.
   * -  CrossOrigin: Atributo crossOrigin para las imágenes cargadas.
   * @param {Object} vendorOptions Opciones para la biblioteca base. Ejemplo vendorOptions:
   * <pre><code>
   * import { Rectangle } from 'cesium';
   * {
   *  alpha: 0.5,
   *  show: true,
   *  rectangle: Rectangle.fromDegrees(-8.31, -5.69, 5.35, 8.07),
   *  ...
   * }
   * </code></pre>
   * @api
   */
  constructor(userParameters, options = {}, vendorOptions = {}) {
    // calls the super constructor
    super(options, vendorOptions);

    /**
     * MBTiles tileLoadFunction: Función de carga de la tesela proporcionada por el usuario.
     */
    this.tileLoadFunction_ = userParameters.tileLoadFunction;

    /**
     * MBTiles url: Url del fichero o servicio que genera el MBTiles.
     */
    this.url_ = userParameters.url || '';

    /**
     * MBTiles source: Fuente de la capa.
     */
    this.source_ = userParameters.source;

    /**
     * MBTiles maxExtent: Máxima extensión de la capa.
     */
    this.maxExtent_ = userParameters.maxExtent || null;

    /**
     * MBTiles opacity: Opacidad de la capa.
     */
    this.opacity_ = typeof userParameters.opacity === 'number' ? userParameters.opacity : 1;

    /**
     * MBTiles visibility: Visibilidad de la capa.
     */
    this.visibility = userParameters.visibility === false ? userParameters.visibility : true;

    this.tileSize_ = userParameters.tileSize || 256;

    /**
     *  CrossOrigin: Atributo crossOrigin para las imágenes cargadas.
     */
    this.crossOrigin = (options.crossOrigin === null || options.crossOrigin === false) ? undefined : 'anonymous';
  }

  /**
   * Este método establece la visibilidad de esta capa.
   *
   * @public
   * @function
   * @param {Boolean} visibility Verdadero es visible, falso si no.
   * @api
   */
  setVisible(visibility) {
    this.visibility = visibility;
    // if this layer is base then it hides all base layers
    if ((visibility === true) && (this.isBase !== false)) {
      // set this layer visible
      if (!isNullOrEmpty(this.cesiumLayer)) {
        this.cesiumLayer.show = visibility;
      }
    } else if (!isNullOrEmpty(this.cesiumLayer)) {
      this.cesiumLayer.show = visibility;
    }
  }

  /**
   * Devuelve la extensión de la capa.
   * @returns {Array} Devuelve la extensión de la capa.
   */
  getMaxExtent() {
    // eslint-disable-next-line no-underscore-dangle
    if (!this.maxExtent_ || this.facadeLayer_.isReset_) {
      this.maxExtent_ = this.map.getProjection().getExtent();
    }
    return this.maxExtent_;
  }

  /**
   * Este método añade la capa al mapa de la implementación.
   *
   * @public
   * @function
   * @param {IDEE.impl.Map} map Mapa de la implementación.
   * @api
   */
  addTo(map) {
    this.map = map;
    const extent = this.maxExtent_ || [-180, -90, 180, 90];

    const optCesiumLayer = extend({
      minimumTerrainLevel: this.minZoom,
      maximumTerrainLevel: this.maxZoom - 1,
      rectangle: Rectangle.fromDegrees(extent[0], extent[1], extent[2], extent[3]),
      alpha: this.opacity_,
      show: this.visibility,
    }, this.vendorOptions_, true);
    if (!this.tileLoadFunction_) {
      this.fetchSource().then((provider) => {
        provider.getExtent().then((tileExtent) => {
          if (!this.maxExtent_ && !this.vendorOptions_.rectangle) {
            this.maxExtent_ = this.maxExtent_ || tileExtent;
            optCesiumLayer.rectangle = Rectangle.fromDegrees(
              this.maxExtent_[0], // + 0.0001,
              this.maxExtent_[1], // - 0.0001,
              this.maxExtent_[2], // + 0.0001,
              this.maxExtent_[3], // - 0.0001,
            );
          }
          this.createCesiumLayer_(optCesiumLayer, provider);
        });
      });
    } else {
      this.createCesiumLayer_(optCesiumLayer, this.addProvider_());
    }
  }

  /**
   * Este método crea el layer de Cesium.
   *- ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   *
   * @public
   * @function
   * @param {Object} optCesiumLayer Opciones para el constructor de la capa de Cesium.
   * @param {MBTileImageryProvider} provider Proveedor de Cesium
   * @api
   */
  createCesiumLayer_(optCesiumLayer, provider) {
    this.cesiumLayer = new ImageryLayer(
      provider,
      optCesiumLayer,
    );
    const zIndex = this.facadeLayer_.isBase ? 0 : null;
    this.map.getMapImpl().imageryLayers.add(this.cesiumLayer, zIndex);
  }

  /**
   * Este método busca la fuente de la capa.
   *
   * @function
   * @returns {Object} Promesa con el resultado de la
   * búsqueda de la fuente.
   * @public
   * @api
   */
  fetchSource() {
    return new Promise((resolve, reject) => {
      if (this.source_) {
        const tileProvider = this.addProvider_();
        resolve(tileProvider);
      } else if (this.url) {
        window.fetch(this.url).then((response) => {
          this.source_ = response;
          const tileProvider = this.addProvider_();
          resolve(tileProvider);
        });
      } else {
        reject(new Error(getValue('exception').no_source));
      }
    });
  }

  /**
   * Este método obtiene el proveedor de Cesium para añadir la capa.
   *- ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @public
   * @function
   * @returns {TileLoadFunctionImagineryProvider} Proveedor de la capa.
   * @api
   */
  addProvider_() {
    const url = this.url;
    return new MBTileImageryProvider({
      tileLoadFunction: this.tileLoadFunction_,
      source: this.source_,
    }, {
      url,
      tileWidth: this.tileSize_,
      tileHeight: this.tileSize_,
    });
  }

  /**
   * Este método establece la máxima extensión de la capa.
   *
   * @function
   * @param {Mx.Extent} maxExtent Máxima extensión.
   * @public
   * @api
   */
  setMaxExtent(maxExtent) {
    this.maxExtent_ = maxExtent;
    const rectangle = ImplUtils.convertExtentToRectangle(maxExtent);
    if (!isNullOrEmpty(this.cesiumLayer) && this.cesiumLayer.rectangle) {
      // eslint-disable-next-line no-underscore-dangle
      this.cesiumLayer._rectangle = rectangle;

      const index = this.map.getMapImpl().imageryLayers.indexOf(this.getLayer());
      this.map.getMapImpl().imageryLayers.remove(this.getLayer(), false);
      this.map.getMapImpl().imageryLayers.add(this.getLayer(), index);
    }
  }

  /**
   * Este método establece la clase de la fachada
   * de MBTiles.
   *
   * @function
   * @param {Object} obj Objeto a establecer como fachada.
   * @public
   * @api
   */
  setFacadeObj(obj) {
    this.facadeLayer_ = obj;
  }

  /**
   * Este método destruye esta capa, limpiando el HTML
   * y anulando el registro de todos los eventos.
   *
   * @public
   * @function
   * @api
   */
  destroy() {
    const cesiumMap = this.map.getMapImpl();
    if (!isNullOrEmpty(this.cesiumLayer)) {
      cesiumMap.imageryLayers.remove(this.cesiumLayer);
      this.cesiumLayer = null;
    }
    this.map = null;
  }

  /**
   * Este método comprueba si un objeto es igual
   * a esta capa.
   *
   * @function
   * @param {Object} obj Objeto a comparar.
   * @returns {Boolean} Verdadero es igual, falso si no.
   * @api
   */
  equals(obj) {
    let equals = false;
    if (obj instanceof MBTiles) {
      equals = (this.name === obj.name);
    }
    return equals;
  }
}
export default MBTiles;
