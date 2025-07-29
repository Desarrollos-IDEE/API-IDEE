/**
 * @module IDEE/impl/layer/GeoPackageTile
 */
import {
  isNullOrEmpty,
} from 'IDEE/util/Utils';
import { DEFAULT_WHITE_TILE } from 'IDEE/provider/Tile';
import * as EventType from 'IDEE/event/eventtype';
import OLLayerTile from 'ol/layer/Tile';
import XYZSource from 'ol/source/XYZ';
import { get as getProj } from 'ol/proj';
import ImplMap from '../Map';
import Layer from './Layer';

/**
 * @classdesc
 * Las capas GeoPackageTiles representan capas ráster en formato GeoPackage, donde las teselas
 * están organizadas por niveles de zoom dentro de un contenedor SQLite.
 *
 * @property {Function} tileLoadFunction Función de carga de tiles.
 * @property {IDEE.layer.maxExtent} maxExtent_ La medida en que restringe la visualización
 * a una región específica.
 * @property {Number} opacity_ Opacidad de la capa.
 * @property {Number} zIndex_ Índice z de la capa.
 * @property {Boolean} visibility Visibilidad de la capa.
 * @property {Array<number>} extent_ Extensión de la capa.
 * @property {Number} minZoom_ Mínimo zoom de la capa.
 * @property {Number} maxZoom_ Máximo zoom de la capa.
 * @property {IDEE.provider.GeoPackageTileProvider} provider Proveedor de la capa.
 *
 * @api
 * @extends {IDEE.impl.layer.Layer}
 */
class GeoPackageTile extends Layer {
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
   * - maxExtent: La medida en que restringe la visualización a una región específica.
   * - minZoom: Zoom mínimo aplicable a la capa.
   * - maxZoom: Zoom máximo aplicable a la capa.
   * - displayInLayerSwitcher: Indica si la capa se muestra en el selector de capas.
   * - tileGridMaxZoom: Zoom máximo de cuadrícula de la tesela.
   * @param {IDEE.TileProvider} provider Proveedor de teselas para una capa ráster
   * en un archivo GeoPackage.
   *
   * @api
   */
  constructor(userParameters, provider) {
    // calls the super constructor
    super({}, {});

    /**
     * Función de carga de tiles.
     */
    this.tileLoadFunction = userParameters.tileLoadFunction || null;

    /**
      * Máxima extensión de la capa.
      */
    this.maxExtent_ = userParameters.maxExtent || null;

    /**
      * Opacidad
      */
    this.opacity_ = typeof userParameters.opacity === 'number' ? userParameters.opacity : 1;

    /**
      * Índice z de la capa.
      */
    this.zIndex_ = typeof userParameters.zIndex === 'number' ? userParameters.zIndex : ImplMap.Z_INDEX.GeoPackageTile;

    /**
      * Visibilidad de la capa.
      */
    this.visibility = userParameters.visibility === false ? userParameters.visibility : true;

    /**
      * Extensión de la capa.
      */
    this.extent_ = userParameters.extent || null;

    /**
      * Mínimo zoom de la capa.
      */
    this.minZoom_ = userParameters.minZoom || null;

    /**
      * Máximo zoom de la capa.
      */
    this.maxZoom_ = userParameters.maxZoom || null;

    /**
      * Proveedor
      */
    this.provider = provider;
  }

  /**
   * Este método establece la visibilidad de esta capa.
   *
   * @function
   * @param {Boolean} visibility Verdadero es visible, falso si no.
   * @api stable
   */
  setVisible(visibility) {
    this.visibility = visibility;
    // if this layer is base then it hides all base layers
    if ((visibility === true) && (this.isBase !== false)) {
      // hides all base layers
      this.map.getBaseLayers().forEach((layer) => {
        if (!layer.equals(this.facadeLayer_) && layer.isVisible()) {
          layer.setVisible(false);
        }
      });

      // set this layer visible
      if (!isNullOrEmpty(this.olLayer)) {
        this.olLayer.setVisible(visibility);
      }

      // updates resolutions and keep the bbox
      const oldZoom = this.map.getZoom();
      this.map.getImpl().updateResolutionsFromBaseLayer();
      if (!isNullOrEmpty(oldZoom)) {
        this.map.setZoom(oldZoom);
      }
    } else if (!isNullOrEmpty(this.olLayer)) {
      this.olLayer.setVisible(visibility);
    }
  }

  /**
   * Este método agrega la capa al mapa.
   *
   * @public
   * @function
   * @param {IDEE.impl.Map} map Mapa de la implementación.
   * @api stable
   */
  addTo(map, addLayer = true) {
    let tileLoadFn = this.loadTileWithProvider;
    if (this.tileLoadFunction) {
      tileLoadFn = this.loadTile;
    }

    this.map = map;
    const { code } = this.map.getProjection();
    const projection = getProj(code);
    const extent = this.extent_ || this.provider.getExtent();
    const minZoom = this.minZoom_ || this.provider.getMinZoom();
    const maxZoom = this.maxZoom_ || this.provider.getMaxZoom();

    this.olLayer = new OLLayerTile({
      visible: this.visibility,
      opacity: this.opacity_,
      zIndex: this.zIndex_,
      extent,
      source: new XYZSource({
        wrapX: false,
        minZoom,
        maxZoom,
        projection,
        tileUrlFunction: (coord) => `{${coord[2]}},{${coord[0]}},{${coord[1]}}`,
        tileLoadFunction: (tile) => tileLoadFn(tile, this),
      }),
    });

    if (addLayer) {
      this.map.getMapImpl().addLayer(this.olLayer);
      this.facadeLayer_?.fire(EventType.ADDED_TO_MAP);
    }
  }

  /**
   * Este método carga la imagen de la tesela desde las coordenadas x, y, z.
   *
   * @param {ol.Tile} tile Tesela.
   * @param {IDEE.provider.Tile} target Proveedor que devuelve una promesa con la URL de la imagen.
   *
   * @public
   * @function
   * @api
   */
  loadTileWithProvider(tile, target) {
    const imgTile = tile;
    const [z, x, y] = tile.getTileCoord();
    target.provider.getTile(x, y, z).then((imgSrc) => {
      imgTile.getImage().src = imgSrc;
    });
  }

  /**
   * Este método es la función personalizada de carga de la tesela.
   *
   * @param {ol.Tile} tile Tesela.
   * @param {IDEE.provider.Tile} target Proveedor de la tesela.
   *
   * @public
   * @function
   * @api
   */
  loadTile(tile, target) {
    const imgTile = tile;
    const [z, x, y] = tile.getTileCoord();
    target.tileLoadFunction(x, y, z).then((tileSrc) => {
      if (tileSrc) {
        imgTile.getImage().src = tileSrc;
      } else {
        imgTile.getImage().src = DEFAULT_WHITE_TILE;
      }
    });
  }

  /**
   * Este método establece la clase de la fachada
   * de GeoPackageTile.
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
   * Este método obtiene la mínima resolución de la capa.
   *
   * @function
   * @public
   * @api
   * @returns {number} Mínima resolución.
   */
  getMinResolution() {}

  /**
   * Este método obtiene la máxima resolución de la capa.
   *
   * @function
   * @public
   * @api
   * @returns {number} Máxima resolución.
   */
  getMaxResolution() {}

  /**
   * Este método destruye esta capa, limpiando
   * el HTML y desregistrando todos los eventos.
   *
   * @public
   * @function
   * @api
   */
  destroy() {
    const olMap = this.map.getMapImpl();
    if (!isNullOrEmpty(this.olLayer)) {
      olMap.removeLayer(this.olLayer);
      this.olLayer = null;
    }
    this.map = null;
  }

  /**
   * Este método comprueba si un objeto es igual
   * a esta capa.
   *
   * @function
   * @param {Object} obj Objeto a comparar.
   * @returns {Boolean} Valor verdadero es igual, falso no lo es.
   * @public
   * @api
   */
  equals(obj) {
    let equals = false;
    if (obj instanceof GeoPackageTile) {
      equals = (this.name === obj.name);
    }
    return equals;
  }

  /**
   * Este método devuelve la extensión de la capa.
   *
   * @function
   * @return {Promise<array<number>>} Extensión de la capa.
   * @public
   * @api
   */
  getExtentFromProvider() {
    return new Promise((resolve) => {
      const extent = this.provider.getExtent();
      resolve(extent);
    });
  }
}

export default GeoPackageTile;
