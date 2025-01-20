/* eslint-disable no-underscore-dangle */
/**
 * @module M/impl/layer/MVT
 */
import OLSourceVectorTile from 'ol/source/VectorTile';
import OLLayerVectorTile from 'ol/layer/VectorTile';
import { compileSync as compileTemplate } from 'M/util/Template';
import geojsonPopupTemplate from 'templates/geojson_popup';
import Popup from 'M/Popup';
import { isNullOrEmpty, extend } from 'M/util/Utils';
import * as EventType from 'M/event/eventtype';
import TileEventType from 'ol/source/TileEventType';
import TileState from 'ol/TileState';
import MVTFormatter from 'ol/format/MVT';
import { get as getProj } from 'ol/proj';
import Feature from 'ol/Feature';
import RenderFeature from 'ol/render/Feature';
import { mode } from 'M/layer/MVT';
import Vector from './Vector';
import ImplUtils from '../util/Utils';

/**
 * @classdesc
 * Las capas de tipo Vector Tile ofrecen ciertas ventajas en algunos escenarios,
 * debido a su bajo peso y carga rápida,
 * ya que se sirven en forma de teselas que contienen la información vectorial
 * del área que delimitan.
 *
 * @api
 * @extends {M.impl.layer.Vector}
 */

class MVT extends Vector {
  /**
   * Constructor principal de la clase. Crea una capa MVT
   * con parámetros especificados por el usuario.
   *
   * @constructor
   * @implements {M.impl.layer.Vector}
   * @param {M.layer.MVT.parameters} parameters Opciones de la fachada, la fachada se refiere a
   * un patrón estructural como una capa de abstracción con un patrón de diseño.
   * @param {Mx.parameters.LayerOptions} options Parámetros opcionales para la capa.
   * - style: Define el estilo de la capa.
   * - minZoom. Zoom mínimo aplicable a la capa.
   * - maxZoom. Zoom máximo aplicable a la capa.
   * - visibility. Define si la capa es visible o no. Verdadero por defecto.
   * - displayInLayerSwitcher. Indica si la capa se muestra en el selector de capas.
   * - opacity. Opacidad de capa, por defecto 1.
   * - maxExtent: La medida en que restringe la visualización a una región específica.
   * @param {Object} vendorOptions Opciones para la biblioteca base. Ejemplo vendorOptions:
   *  <pre><code>
   * import OLSourceVector from 'ol/source/Vector';
   * {
   *  opacity: 0.1,
   *  source: new OLSourceVector({
   *    attributions: 'mvt',
   *    ...
   *  })
   * }
   * </code></pre>
   * @api
   */
  constructor(parameters, options, vendorOptions) {
    super(options, vendorOptions);
    /**
     * MVT formater_. Formato del objeto "MVTFormatter".
     */
    this.formater_ = null;

    /**
     * MVT popup_. Muestra el "popup".
     */
    this.popup_ = null;

    /**
     * MVT lastZoom_. Zoom anterior.
     */
    this.lastZoom_ = -1;

    /**
     * MVT projection_. Proyección de la capa.
     */
    this.projection_ = parameters.projection || 'EPSG:3857';

    /**
     * MVT features_. Objetos geográficos de la fuente de openlayers.
     */
    this.features_ = [];

    /**
     * MVT mode_. Modos de renderizado posible ("render" o "feature").
     */
    this.mode_ = parameters.mode;

    /**
     * MVT loaded_. Muestra si esta cargada la capa o no.
     */
    this.loaded_ = false;

    /**
     * MVT opacity_. Opacidad entre 0 y 1. Por defecto 1.
     */
    this.opacity_ = parameters.opacity || 1;

    /**
     * MVT visibility_. Indica si la capa es visible.
     */
    this.visibility_ = parameters.visibility !== false;

    /**
     * MVT layers_. Otras capas.
     */
    this.layers_ = parameters.layers;

    /**
     * MVT extract_.
     * Activa la consulta cuando se hace clic en un objeto geográfico,
     * por defecto falso.
     */
    this.extract = parameters.extract;
  }

  /**
   * Este metodo añade la capa al mapa.
   *
   * @public
   * @function
   * @param {M.impl.Map} map Mapa de la implementación.
   * @api
   */
  addTo(map, addLayer = true) {
    this.map = map;
    this.fire(EventType.ADDED_TO_MAP);
    if (this.layers_ !== undefined) {
      this.formater_ = new MVTFormatter({
        layers: this.layers_,
        featureClass: this.mode_ === mode.FEATURE ? Feature : RenderFeature,
      });
    } else {
      this.formater_ = new MVTFormatter({
        featureClass: this.mode_ === mode.FEATURE ? Feature : RenderFeature,
      });
    }

    const extent = this.maxExtent_ || this.facadeVector_.getMaxExtent();

    const source = new OLSourceVectorTile({
      format: this.formater_,
      url: this.url,
      projection: this.projection_,
    });

    // register events in order to fire the LOAD event
    source.on(TileEventType.TILELOADERROR, (evt) => this.checkAllTilesLoaded_(evt));
    // source.on(TileEventType.TILELOADEND, (evt) => this.checkAllTilesLoaded_(evt));

    this.ol3Layer = new OLLayerVectorTile(extend({
      source,
      extent,
    }, this.vendorOptions_, true));
    this.ol3Layer.setMaxZoom(this.maxZoom);
    this.ol3Layer.setMinZoom(this.minZoom);

    this.setOpacity(this.opacity_);
    this.setVisible(this.visibility_);

    if (addLayer) {
      this.map.getMapImpl().addLayer(this.ol3Layer);
    }

    // clear features when zoom changes
    this.map.on(EventType.CHANGE_ZOOM, () => {
      if (this.map) {
        const newZoom = this.map.getZoom();
        if (this.lastZoom_ !== newZoom) {
          this.features_.length = 0;
          this.lastZoom_ = newZoom;
        }
      }
    });

    this.map.on(EventType.MOVE, (e) => {
      if (this.map) {
        const selector = this.map.getContainer().parentElement.parentElement.id;
        document.getElementById(selector).style.cursor = 'inherit';
        this.map.getMapImpl().forEachFeatureAtPixel(e.pixel, (feature) => {
          if (feature) {
            document.getElementById(selector).style.cursor = 'pointer';
          }
        });
      }
    });

    setTimeout(() => {
      const allLayers = [...this.map.getImpl().getAllLayerInGroup(), ...this.map.getLayers()];
      const filtered = allLayers.filter((l) => {
        const checkLayers = l.getImpl().layers_ !== undefined
          ? l.getImpl().layers_ === this.layers_
          : true;
        return l.url === this.url && checkLayers && l.idLayer === this.facadeVector_.idLayer;
      });

      if (filtered.length > 0) {
        if (filtered[0].getStyle() !== null) {
          filtered[0].setStyle(filtered[0].getStyle());
        }
      }
    }, 10);
  }

  /**
   * Este método se ejecuta cuando se selecciona un objeto geográfico.
   * @public
   * @function
   * @param {ol.Feature} feature Objetos geográficos de Openlayers.
   * @param {Array} coord Coordenadas.
   * @param {Object} evt Eventos.
   * @api stable
   */
  selectFeatures(features, coord, evt) {
    if (this.extract === true) {
      const feature = features[0];
      this.unselectFeatures();
      if (!isNullOrEmpty(feature)) {
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

  /**
   * Evento que se activa cuando se termina de hacer clic sobre
   * un objeto geográfico.
   *
   * @public
   * @function
   * @api stable
   */
  unselectFeatures() {
    if (!isNullOrEmpty(this.popup_)) {
      this.popup_.hide();
      this.popup_ = null;
    }
  }

  /**
   * Este método destruye el "popup" MVT.
   *
   * @public
   * @function
   * @api stable
   */
  removePopup() {
    if (!isNullOrEmpty(this.popup_)) {
      if (this.popup_.getTabs().length > 1) {
        this.popup_.removeTab(this.tabPopup_);
      } else {
        this.map.removePopup();
      }
    }
  }

  /**
   * Este método devuelve todos los objetos geográficos, se puede filtrar.
   *
   * @function
   * @public
   * @param {boolean} skipFilter Indica si el filtro es de tipo "skip".
   * @param {M.Filter} filter Filtro que se ejecutará.
   * @return {Array<M.Feature>} Devuelve los objetos geográficos.
   * @api
   */
  getFeatures(skipFilter, filter) {
    let features = [];
    if (this.ol3Layer) {
      const olSource = this.ol3Layer.getSource();
      const tileCache = olSource.tileCache;
      if (tileCache.getCount() === 0) {
        return features;
      }
      const z = Number(tileCache.peekFirstKey().split('/')[0]);
      tileCache.forEach((tile) => {
        if (tile.tileCoord[0] !== z || tile.getState() !== TileState.LOADED) {
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
   * Este método devuelve un objeto geográfico por su id.
   *
   * @function
   * @public
   * @param {string|number} id Identificador del objeto geográfico..
   * @return {Array<M.feature>} Objeto Geográfico - Devuelve el objeto geográfico con
   * ese id si se encuentra, en caso de que no se encuentre o no indique el id devuelve array vacío.
   * @api stable
   */
  getFeatureById(id) {
    const features = [];
    if (this.ol3Layer) {
      const tileCache = this.ol3Layer.getSource().tileCache;
      const kk = tileCache.getCount();
      if (kk === 0) {
        return features;
      }
      const z = Number(tileCache.peekFirstKey().split('/')[0]);
      for (let k = 0; k < kk; k += 1) {
        const auxValue = tileCache.getValues()[k];
        if (auxValue.tileCoord[0] === z && auxValue.getState() === TileState.LOADED) {
          const sourceTiles = auxValue.getSourceTiles();
          for (let i = 0, ii = sourceTiles.length; i < ii; i += 1) {
            const olFeature = sourceTiles[i].getFeatures()
              .find((feature2) => feature2.getProperties().id === id); // feature2.getId()
            if (olFeature) {
              features.push(olFeature);
            }
          }
        }
      }
    }
    return features;
  }

  /**
   * Este método comprueba si la tesela esta cargada.
   *
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   *
   * @public
   * @function
   * @param {ol/source/Tile.TileSourceEvent} evt Evento.
   * @api stable
   */
  checkAllTilesLoaded_(evt) {
    const currTileCoord = evt.tile.getTileCoord();
    const olProjection = getProj(this.projection_);
    const tileCache = this.ol3Layer.getSource().getTileCacheForProjection(olProjection);
    const tileImages = tileCache.getValues();
    const loaded = tileImages.every((tile) => {
      const tileCoord = tile.getTileCoord();
      const tileState = tile.getState();
      const sameTile = (currTileCoord[0] === tileCoord[0]
        && currTileCoord[1] === tileCoord[1]
        && currTileCoord[2] === tileCoord[2]);
      const tileLoaded = sameTile || (tileState !== TileState.LOADING);
      return tileLoaded;
    });
    if (loaded && !this.loaded_) {
      this.loaded_ = true;
      this.facadeVector_.fire(EventType.LOAD);
    }
  }

  getFeaturesExtentPromise(skipFilter, filter) {
    return new Promise((resolve) => {
      const codeProj = this.map.getProjection().code;
      if (this.isLoaded() === true) {
        const features = this.getFeatures(skipFilter, filter);
        const extent = ImplUtils.getFeaturesExtent(features, codeProj);
        resolve(extent);
      } else {
        this.requestFeatures_().then((features) => {
          const extent = ImplUtils.getFeaturesExtent(features, codeProj);
          resolve(extent);
        });
      }
    });
  }

  /**
   * Devuelve la proyeccion de la capa.
   *
   * @public
   * @function
   * @returns {String} SRS de la capa.
   * @api stable
   */
  getProjection() {
    return this.projection_;
  }

  /**
   * Devuelve verdadero si la capa esta cargada.
   *
   * @function
   * @returns {Boolean} Verdadero.
   * @api stable
   */
  isLoaded() {
    return true;
  }

  /**
   * Este método comprueba si un objeto es igual
   * a esta capa.
   *
   * @public
   * @function
   * @param {Object} obj Objeto a comparar.
   * @returns {Boolean} Verdadero es igual, falso si no.
   * @api
   */
  equals(obj) {
    let equals = false;
    if (obj instanceof MVT) {
      equals = (this.url === obj.url);
      equals = equals && (this.name === obj.name);
      equals = equals && (this.extract === obj.extract);
    }

    return equals;
  }
}

export default MVT;
