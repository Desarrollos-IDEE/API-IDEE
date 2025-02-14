/**
 * @module M/impl/layer/MBTilesVector
 */
import { isNullOrEmpty, isFunction, extend } from 'M/util/Utils';
import { compileSync as compileTemplate } from 'M/util/Template';
import Popup from 'M/Popup';
import geojsonPopupTemplate from 'templates/geojson_popup';
import { get as getProj, transformExtent } from 'ol/proj';
// import { inflate } from 'pako';
import OLLayerTile from 'ol/layer/Tile';
import OLLayerVectorTile from 'ol/layer/VectorTile';
import OLSourceVectorTile from 'ol/source/VectorTile';
import TileGrid from 'ol/tilegrid/TileGrid';
import { getBottomLeft, getWidth } from 'ol/extent';
import TileProvider from 'M/provider/Tile';
import * as EventType from 'M/event/eventtype';
import MVT from 'ol/format/MVT';
import { getValue } from 'M/i18n/language';
// import Feature from 'ol/Feature';
import ImplMap from '../Map';
import Vector from './Vector';

/**
 * Tamaño de la tesela vectorial de MBTiles por defecto.
 *
 * @const
 * @public
 * @type {number}
 */
const DEFAULT_TILE_SIZE = 256;

/**
 * Este método calcula las resoluciones a partir de los
 * parámetros especificados.
 *
 * @function
 * @param {Mx.Extent} extent Extensión.
 * @param {number} tileSize Tamaño de la tesela vectorial.
 * @param {number} maxZoomLevel Nivel máximo de zoom.
 * @returns {Array<Number>} Resoluciones obtenidas.
 * @public
 * @api
 */
const generateResolutions = (extent, tileSize, maxZoomLevel) => {
  const width = getWidth(extent);
  const size = width / tileSize;
  const resolutions = new Array(maxZoomLevel);
  for (let z = 0; z < maxZoomLevel; z += 1) {
    resolutions[z] = size / (2 ** z);
  }
  return resolutions;
};

/**
 * @classdesc
 * Implementación de la capa MBTilesVector.
 *
 * @property {function} tileLoadFunction_ Función de carga de la tesela vectorial.
 * @property {string} url_ Url del fichero o servicio que genera el MBTilesVector.
 * @property {ArrayBuffer|Uint8Array|Response|File} source_ Fuente de la capa.
 * @property {File|String} style_ Define el estilo de la capa.
 * @property {number} tileSize_ Tamaño de la tesela vectorial.
 * @property {Mx.Extent} maxExtent_ La medida en que restringe la visualización a
 * una región específica.
 * @property {number} maxZoomLevel_ Zoom máximo aplicable a la capa.
 * @property {number} opacity_ Opacidad de capa.
 * @property {number} zIndex_ zIndex de la capa.
 * @property {boolean} visibility Define si la capa es visible o no.
 *
 * @api
 * @extends {M.impl.layer.Vector}
 */
class MBTilesVector extends Vector {
  /**
   * Constructor principal de la clase. Crea una capa de implementación MBTilesVector
   * con parámetros especificados por el usuario.
   *
   * @constructor
   * @param {String|Mx.parameters.MBTilesVector} userParameters Parámetros para la
   * construcción de la capa.
   * - name: Nombre de la capa.
   * - url: Url del fichero o servicio que genera el MBTilesVector.
   * - type: Tipo de la capa.
   * - maxExtent: La medida en que restringe la visualización a una región específica.
   * - legend: Indica el nombre que aparece en el árbol de contenidos, si lo hay.
   * - tileLoadFunction: Función de carga de la tesela vectorial proporcionada por el usuario.
   * - source: Fuente de la capa.
   * - tileSize: Tamaño de la tesela vectorial, por defecto 256.
   * - visibility: Define si la capa es visible o no. Verdadero por defecto.
   * @param {Mx.parameters.LayerOptions} options Opciones personalizadas para esta capa.
   * - opacity: Opacidad de capa, por defecto 1.
   * - style: Define el estilo de la capa.
   * - displayInLayerSwitcher: Indica si la capa se muestra en el selector de capas.
   * @param {Object} vendorOptions Opciones para la biblioteca base. Ejemplo vendorOptions:
   * <pre><code>
   * import OLSourceVectorTile from 'ol/source/VectorTile';
   * {
   *  opacity: 0.1,
   *  source: new OLSourceVector({
   *    url: '{z},{x},{y}',
   *    ...
   *  })
   * }
   * </code></pre>
   * @api
   */
  constructor(userParameters, options = {}, vendorOptions = {}) {
    // calls the super constructor
    super(options, vendorOptions);

    /**
     * MBTilesVector tileLoadFunction: Función de carga de la tesela
     * vectorial proporcionada por el usuario.
     */
    this.tileLoadFunction_ = userParameters.tileLoadFunction || null;

    /**
     * MBTilesVector url: Url del fichero o servicio que genera el MBTilesVector.
     */
    this.url_ = userParameters.url;

    /**
     * MBTilesVector source: Fuente de la capa.
     */
    this.source_ = userParameters.source;

    /**
     * MBTilesVector style: Define el estilo de la capa.
     */
    this.style_ = userParameters.style;

    /**
     * MBTilesVector tileSize: Tamaño de la tesela vectorial, por defecto 256.
     */
    this.tileSize_ = typeof userParameters.tileSize === 'number' ? userParameters.tileSize : DEFAULT_TILE_SIZE;

    /**
     * MBTilesVector maxExtent: Extensión de la capa.
     */
    this.maxExtent_ = userParameters.maxExtent || null;

    /**
     * MBTilesVector maxZoomLevel: Zoom máximo aplicable a la capa.
     */
    this.maxZoomLevel_ = typeof userParameters.maxZoomLevel === 'number' ? userParameters.maxZoomLevel : 0;

    /**
     * MBTilesVector opacity: Opacidad de capa.
     */
    this.opacity_ = typeof options.opacity === 'number' ? options.opacity : 1;

    /**
     * MBTilesVector zIndex: ZIndex de la capa.
     */
    this.zIndex_ = ImplMap.Z_INDEX.MBTilesVector;

    /**
     * MBTilesVector visibility: Visibilidad de la capa.
     */
    this.visibility = userParameters.visibility === false ? userParameters.visibility : true;
  }

  /**
   * Este método establece la visibilidad de la capa.
   *
   * @function
   * @param {boolean} visibility Verdadero para capa visible, falso no lo es.
   * @public
   * @api
   */
  setVisible(visibility) {
    this.visibility = visibility;
    if (!isNullOrEmpty(this.ol3Layer)) {
      this.ol3Layer.setVisible(visibility);
    }
  }

  /**
   * Este método establece el objeto de mapa de la capa.
   *
   * @function
   * @public
   * @param {M.Map} map Mapa.
   * @api
   */
  addTo(map, addLayer = true) {
    this.map = map;
    const { code } = this.map.getProjection();
    const projection = getProj(code);
    const extent = projection.getExtent();
    this.ol3Layer = new OLLayerVectorTile(extend({
      visible: this.visibility,
      opacity: this.opacity_,
      zIndex: this.zIndex_,
    }, this.vendorOptions_, true));
    if (!this.tileLoadFunction_ && isNullOrEmpty(this.vendorOptions_.source)) {
      this.fetchSource().then((tileProvider) => {
        tileProvider.getMaxZoomLevel().then((maxZoomLevel) => {
          if (!this.maxZoomLevel_) {
            this.maxZoomLevel_ = maxZoomLevel;
          }
          const resolutions = generateResolutions(extent, DEFAULT_TILE_SIZE, this.maxZoomLevel_);
          this.tileProvider_ = tileProvider;
          this.tileProvider_.getExtent().then((mbtilesExtent) => {
            let reprojectedExtent = mbtilesExtent;
            if (reprojectedExtent) {
              reprojectedExtent = transformExtent(mbtilesExtent, 'EPSG:4326', code);
            }
            this.tileProvider_.getFormat().then((format) => {
              this.createLayer({
                tileProvider,
                resolutions,
                extent: reprojectedExtent,
                sourceExtent: extent,
                projection,
                format,
              });

              this.ol3Layer.getSource().on('tileloaderror', (evt) => this.checkAllTilesLoaded_(evt));
              this.ol3Layer.getSource().on('tileloadend', (evt) => this.checkAllTilesLoaded_(evt));

              this.map.on(EventType.CHANGE_ZOOM, () => {
                if (this.map) {
                  const newZoom = this.map.getZoom();
                  if (this.lastZoom_ !== newZoom) {
                    this.features_.length = 0;
                    this.lastZoom_ = newZoom;
                  }
                }
              });
              this.ol3Layer.setMaxZoom(this.maxZoom);
              this.ol3Layer.setMinZoom(this.minZoom);
              if (addLayer) {
                this.map.getMapImpl().addLayer(this.ol3Layer);
              }
            });
          });
        });
      });
    } else {
      const resolutions = generateResolutions(extent, DEFAULT_TILE_SIZE, this.maxZoomLevel_ || 28);
      this.createLayer({
        resolutions,
        extent,
        sourceExtent: extent,
        projection,
      });

      this.ol3Layer
        .getSource().on('tileloaderror', (evt) => this.checkAllTilesLoaded_(evt));
      this.ol3Layer
        .getSource().on('tileloadend', (evt) => this.checkAllTilesLoaded_(evt));

      this.map.on(EventType.CHANGE_ZOOM, () => {
        if (this.map) {
          const newZoom = this.map.getZoom();
          if (this.lastZoom_ !== newZoom) {
            this.features_.length = 0;
            this.lastZoom_ = newZoom;
          }
        }
      });
      this.ol3Layer.setMaxZoom(this.maxZoom);
      this.ol3Layer.setMinZoom(this.minZoom);
      if (addLayer) {
        this.map.getMapImpl().addLayer(this.ol3Layer);
      }
    }
  }

  /**
   * Este método crea la capa de implementación de OL.
   *
   * @function
   * @param {object} opts Opciones para la capa.
   * @returns {ol.layer.TileLayer|ol.layer.VectorTile} Capa de implementación de OL.
   * @public
   * @api
   */
  createLayer(opts) {
    let tileLoadFn = this.loadVectorTileWithProvider;
    if (this.tileLoadFunction_) {
      tileLoadFn = this.loadVectorTile;
    }
    const mvtFormat = new MVT();
    this.ol3Layer.setSource(new OLSourceVectorTile({
      projection: opts.projection,
      url: '{z},{x},{y}',
      tileLoadFunction: (tile) => tileLoadFn(tile, mvtFormat, opts, this),
      tileGrid: new TileGrid({
        extent: opts.sourceExtent,
        origin: getBottomLeft(opts.sourceExtent),
        resolutions: opts.resolutions,
      }),
    }));

    this.ol3Layer.setExtent(this.maxExtent_ || opts.sourceExtent);
    return this.ol3Layer;
  }

  /**
   * Este método es la función personalizada de carga de la tesela
   * vectorial de TileLayer.
   *
   * @function
   * @param {ol.Tile} tile Tesela vectorial.
   * @param {ol.format.MVT} formatter Formateador.
   * @param {Object} opts Opciones.
   * @param {M.provider.Tile} target Proveedor de la tesela vectorial.
   * @public
   * @api
   */
  loadVectorTile(tile, formatter, opts, target) {
    tile.setState(1); // ol/TileState#LOADING
    tile.setLoader((extent, resolution, projection) => {
      const tileCoord = tile.getTileCoord();
      // eslint-disable-next-line
      target.tileLoadFunction_(tileCoord[0], tileCoord[1], -tileCoord[2] - 1).then((_vectorTile) => {
        if (_vectorTile) {
          try {
            const vectorTile = new Uint8Array(_vectorTile);
            const features = formatter.readFeatures(vectorTile, {
              extent,
              featureProjection: projection,
            });
            tile.setFeatures(features);
            tile.setState(2); // ol/TileState#LOADED
          } catch (e) {
            tile.setState(3); // ol/TileState#ERROR
          }
        } else {
          tile.setState(3); // ol/TileState#ERROR
        }
      });
    });
  }

  /**
   * Este método es la función personalizada de carga de la tesela
   * vectorial.
   *
   * @function
   * @param {ol.Tile} tile Tesela vectorial.
   * @param {ol.format.MVT} formatter Formateador.
   * @param {Object} opts Opciones.
   * @public
   * @api
   */
  loadVectorTileWithProvider(tile, formatter, opts) {
    tile.setState(1); // ol/TileState#LOADING
    tile.setLoader((extent, resolution, projection) => {
      const tileCoord = tile.getTileCoord();
      opts.tileProvider.getVectorTile([tileCoord[0], tileCoord[1], -tileCoord[2] - 1])
        .then((pbf) => {
          if (pbf) {
            const features = formatter.readFeatures(pbf, {
              extent,
              featureProjection: projection,
            });
            tile.setFeatures(features);
            tile.setState(2); // ol/TileState#LOADED
          } else {
            tile.setState(3); // ol/TileState#ERROR
          }
        });
    });
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
      if (this.tileProvider_) {
        resolve(this.tileProvider_);
      } else if (this.source_) {
        const tileProvider = new TileProvider(this.source_);
        resolve(tileProvider);
      } else if (this.url_) {
        window.fetch(this.url_).then((response) => {
          this.source = response;
          const tileProvider = new TileProvider(response);
          this.tileProvider_ = tileProvider;
          resolve(tileProvider);
        });
      } else {
        reject(new Error(getValue('exception').no_source));
      }
    });
  }

  /**
   * Este método ejecuta un objeto geográfico seleccionado.
   *
   * @function
   * @param {ol.features} features Objetos geográficos de Openlayers.
   * @param {Array} coord Coordenadas.
   * @param {Object} evt Eventos.
   * @api stable
   * @expose
   */
  selectFeatures(features, coord, evt) {
    if (this.extract === true) {
      const feature = features[0];
      // unselects previous features
      this.unselectFeatures();

      if (!isNullOrEmpty(feature)) {
        const clickFn = feature.getAttribute('vendor.mapea.click');
        if (isFunction(clickFn)) {
          clickFn(evt, feature);
        } else {
          const htmlAsText = compileTemplate(geojsonPopupTemplate, {
            vars: this.parseFeaturesForTemplate_(features),
            parseToHtml: false,
          });
          const featureTabOpts = {
            icon: 'g-cartografia-pin',
            title: this.name,
            content: htmlAsText,
          };
          let popup = this.map.getPopup();
          if (isNullOrEmpty(popup)) {
            popup = new Popup();
            popup.addTab(featureTabOpts);
            this.map.addPopup(popup, coord);
          } else {
            popup.addTab(featureTabOpts);
          }
        }
      }
    }
  }

  /**
   * Este método establece la clase de la fachada
   * de MBTilesVector.
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
   * @returns {Number} Mínima resolución.
   */
  getMinResolution() {}

  /**
   * Este método obtiene la máxima resolución de la capa.
   *
   * @function
   * @public
   * @api
   * @returns {Number} Máxima resolución.
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
    if (!isNullOrEmpty(this.ol3Layer)) {
      olMap.removeLayer(this.ol3Layer);
      this.ol3Layer = null;
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
    if (obj instanceof MBTilesVector) {
      equals = (this.name === obj.name);
      equals = equals && (this.extract === obj.extract);
    }
    return equals;
  }

  /**
   * Este método devuelve todos los objetos geográficos.
   *
   * @function
   * @public
   * @returns {Array<M.Feature>} Todos los objetos geográficos.
   * @api
   */
  getFeatures() {
    let features = [];
    if (this.ol3Layer) {
      const olSource = this.ol3Layer.getSource();
      const tileCache = olSource.tileCache;
      if (tileCache.getCount() === 0) {
        return features;
      }
      const z = Number(tileCache.peekFirstKey().split('/')[0]);
      tileCache.forEach((tile) => {
        if (tile.tileCoord[0] !== z || tile.getState() !== 2) {
          return;
        }
        const sourceTiles = tile.getSourceTiles();
        for (let i = 0, ii = sourceTiles.length; i < ii; i += 1) {
          const sourceTile = sourceTiles[i];
          const olFeatures = sourceTile.getFeatures();
          if (olFeatures) {
            features = features.concat(olFeatures);
          }
        }
      });
    }
    return features;
  }

  /**
   * Este método comprueba si están todas las teselas
   * vectoriales cargadas.
   *
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   *
   * @function
   * @param {ol.source.Tile.TileSourceEvent} evt Evento.
   * @public
   * @api
   */
  checkAllTilesLoaded_(evt) {
    const { code } = this.map.getProjection();
    const currTileCoord = evt.tile.getTileCoord();
    const olProjection = getProj(code);
    const tileCache = this.ol3Layer.getSource().getTileCacheForProjection(olProjection);
    const tileImages = tileCache.getValues();
    const loaded = tileImages.some((tile) => {
      const tileCoord = tile.getTileCoord();
      const tileState = tile.getState();
      const sameTile = (currTileCoord[0] === tileCoord[0]
        && currTileCoord[1] === tileCoord[1]
        && currTileCoord[2] === tileCoord[2]);
      const tileLoaded = sameTile || (tileState !== 1);
      return tileLoaded;
    });
    if (loaded && !this.loaded_) {
      this.loaded_ = true;
      this.facadeLayer_.fire(EventType.LOAD);
    }
  }

  /**
   * Este método devuelve una copia de la capa de esta instancia.
   *
   * @function
   * @returns {ol.layer.Tile} Copia de la capa.
   * @public
   * @api
   */
  cloneOLLayer() {
    let olLayer = null;
    if (this.ol3Layer != null) {
      const properties = this.ol3Layer.getProperties();
      olLayer = new OLLayerTile(properties);
    }
    return olLayer;
  }
}
export default MBTilesVector;
