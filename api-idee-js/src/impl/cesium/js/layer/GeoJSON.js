/**
 * @module IDEE/impl/layer/GeoJSON
 */
import ClusteredFeature from 'IDEE/feature/Clustered';
import { isNullOrEmpty, isObject, isFunction } from 'IDEE/util/Utils';
import * as EventType from 'IDEE/event/eventtype';
import Popup from 'IDEE/Popup';
import { compileSync as compileTemplate } from 'IDEE/util/Template';
import geojsonPopupTemplate from 'templates/geojson_popup';
import GeoJSONFormat from 'IDEE/format/GeoJSON';
import { GeoJsonDataSource, Math as CesiumMath } from 'cesium';
import Vector from './Vector';
import JSONPLoader from '../loader/JSONP';
import ImplUtils from '../util/Utils';
import dataIDEEBbox from '../../../common/DataIDEEBbox';

/**
 * @classdesc
 * GeoJSON, a pesar de no ser un estándar OGC (está en camino de convertirse en uno),
 * es un formato de intercambio de información geográfica muy extendido que, al igual que WFS,
 * permite que todos los elementos estén en el cliente.
 *
 * @api
 * @extends {IDEE.impl.layer.Vector}
 */
class GeoJSON extends Vector {
  /**
   * Constructor principal de la clase. Crea una capa GeoJSON
   * con parámetros especificados por el usuario.
   *
   * @constructor
   * @implements {IDEE.impl.layer.Vector}
   * @param {Object} parameters Parámetros de la fachada, la fachada se refiere a un patrón
   * estructural como una capa de abstracción con un patrón de diseño.
   * @param {Mx.parameters.LayerOptions} options Parámetros opcionales para la capa.
   * - hide. Atributos ocultos.
   * - show. Mostrar atributos.
   * - minZoom. Zoom mínimo aplicable a la capa.
   * - maxZoom. Zoom máximo aplicable a la capa.
   * - visibility. Define si la capa es visible o no. Verdadero por defecto.
   * - displayInLayerSwitcher. Indica si la capa se muestra en el selector de capas.
   * - opacity. Opacidad de capa, por defecto 1.
   * - displayInLayerSwitcher. Indica si la capa se muestra en el selector de capas.
   * - style. Define el estilo de la capa.
   * - maxExtent: La medida en que restringe la visualización a una región específica.
   * - height: Define la altura del objeto geográfico. Puede ser un número o una propiedad.
   *   Si se define la altura será constante para todos los puntos del objeto geográfico.
   * - clampToGround: Define si el objeto geográfico se debe ajustar al suelo. Si las coordenadas
   *   son 3D, por defecto es falso, en caso contrario es verdadero.
   * @param {Object} vendorOptions Opciones para la biblioteca base. Ejemplo vendorOptions:
   * <pre><code>
   * {}
   * </code></pre>
   * @api stable
   */
  constructor(parameters, options, vendorOptions) {
    // calls the super constructor
    super(options, vendorOptions);

    /**
     * GeoJSON popup_. Instancia del popup.
     */
    this.popup_ = null;

    /** Recarga interna de una tabla de un GeoPackage remoto. */
    this.refreshLoader_ = parameters.refreshLoader;

    /**
     * GeoJSON formater_. Determina el formato, "GeoJSONFormat".
     */
    this.formater_ = null;

    /**
     * GeoJSON loader_. Determina si la capa esta cargada, "JSONPLoader".
     */
    this.loader_ = null;

    /**
     * GeoJSON loadFeaturesPromise_. Carga los objetos geográficos, asincrono.
     */
    this.loadFeaturesPromise_ = null;

    /**
     * GeoJSON loaded_. Define si la capa esta cargada.
     */
    this.loaded_ = false;

    /** Carga completa de respaldo para fuentes GeoPackage configuradas como tiled. */
    this.fullLoader_ = parameters.fullLoader;

    /**
     * Carga por extensión visible (en grados) de las fuentes que la admiten, como GeoPackage.
     * @private
     * @type {Function}
     */
    this.bboxLoader_ = parameters.bboxLoader;

    /**
     * Identificadores de las entidades ya cargadas por extensión.
     * @private
     * @type {Set<String>}
     */
    this.loadedFeatureIds_ = new Set();

    /**
     * Extensiones ya pedidas; las contenidas en ellas no se vuelven a pedir.
     * @private
     * @type {Array<Array<Number>>}
     */
    this.loadedExtents_ = [];

    /**
     * Revisión de la carga por extensión; cambia al recargar o quitar la capa.
     * @private
     * @type {Number}
     */
    this.viewportRevision_ = 0;

    /**
     * Elimina los escuchadores de la cámara.
     * @private
     * @type {Function|null}
     */
    this.removeViewportListeners_ = null;

    /**
     * GeoJSON hiddenAttributes_. Atributos de la capa ocultos.
     */
    this.hiddenAttributes_ = [];
    if (!isNullOrEmpty(options.hide)) {
      this.hiddenAttributes_ = options.hide;
    }

    /**
     * GeoJSON showAttributes_. Atributos de la capa que serán representados.
     */
    this.showAttributes_ = [];
    if (!isNullOrEmpty(options.show)) {
      this.showAttributes_ = options.show;
    }
  }

  /**
   * Este método añade a la capa al mapa.
   *
   * @public
   * @function
   * @param {IDEE.impl.Map} map Mapa de la implementación.
   * @api stable
   */
  addTo(map) {
    if (this.refreshLoader_) {
      this.loaded_ = false;
      this.loadFeaturesPromise_ = null;
      this.facadeVector_.resetAutoRefresh();
    }
    this.facadeVector_.userMaxExtent = null;
    this.formater_ = new GeoJSONFormat({
      defaultDataProjection: map.getProjection(),
      clampToGround: this.clampToGround,
    });
    if (!isNullOrEmpty(this.url)) {
      this.loader_ = new JSONPLoader(map, this.url, this.formater_);
    }

    this.map = map;
    this.fireAddedToMap_();
    map.on(EventType.CHANGE_PROJ, this.setProjection_.bind(this), this);
    this.cesiumLayer = new GeoJsonDataSource(this.name);
    if (isFunction(this.bboxLoader_)) {
      this.listenViewport_(map);
    } else {
      this.updateSource_();
    }
    this.setVisible(this.visibility);
    const cesiumMap = this.map.getMapImpl();
    cesiumMap.dataSources.add(this.cesiumLayer);
    if (isFunction(this.bboxLoader_)) {
      this.loadViewport_();
    }
  }

  /**
   * Carga la extensión visible cada vez que la cámara se detiene o cambia el tamaño.
   * @private
   * @param {IDEE.Map} map Mapa.
   */
  listenViewport_(map) {
    this.removeViewportListeners_?.();
    this.viewportRevision_ += 1;
    this.loadedFeatureIds_ = new Set();
    this.loadedExtents_ = [];
    const native = map.getMapImpl();
    const removeMove = native.camera.moveEnd.addEventListener(() => this.loadViewport_());
    let size = `${native.canvas.clientWidth},${native.canvas.clientHeight}`;
    const removeResize = native.scene.postRender.addEventListener(() => {
      const nextSize = `${native.canvas.clientWidth},${native.canvas.clientHeight}`;
      if (nextSize !== size) {
        size = nextSize;
        this.loadViewport_();
      }
    });
    this.removeViewportListeners_ = () => {
      removeMove();
      removeResize();
    };
  }

  /**
   * Devuelve la extensión visible en grados; si cruza el antimeridiano, en dos partes.
   * @private
   * @returns {Array<Array<Number>>} Extensiones [oeste, sur, este, norte].
   */
  getVisibleExtents_() {
    if (!this.map) return [];
    const native = this.map.getMapImpl();
    if (!native.canvas.clientWidth || !native.canvas.clientHeight) return [];
    const rectangle = native.camera.computeViewRectangle(native.scene.globe.ellipsoid);
    if (!rectangle) return [];
    const bbox = dataIDEEBbox([
      rectangle.west, rectangle.south, rectangle.east, rectangle.north,
    ].map((angle) => CesiumMath.toDegrees(angle)));
    if (!bbox) return [];
    const [west, south, east, north] = bbox;
    return west > east ? [[west, south, 180, north], [-180, south, east, north]] : [bbox];
  }

  /**
   * Pide las entidades de las extensiones visibles que aún no se han pedido y añade
   * las que no estaban cargadas.
   * @private
   * @returns {Promise<void>} Finalización de la carga.
   */
  loadViewport_() {
    const contains = (outer, inner) => outer[0] <= inner[0] && outer[1] <= inner[1]
      && outer[2] >= inner[2] && outer[3] >= inner[3];
    const extents = this.getVisibleExtents_()
      .filter((extent) => !this.loadedExtents_.some((loaded) => contains(loaded, extent)));
    if (extents.length === 0) return Promise.resolve();
    this.loadedExtents_.push(...extents);
    const revision = this.viewportRevision_;
    const layer = this.cesiumLayer;
    const isCurrent = () => revision === this.viewportRevision_ && this.cesiumLayer === layer
      && !isNullOrEmpty(this.map);
    return Promise.all(extents.map((extent) => Promise.resolve()
      .then(() => this.bboxLoader_(extent, 'EPSG:4326'))
      .catch(() => {
        this.loadedExtents_ = this.loadedExtents_.filter((loaded) => loaded !== extent);
        return null;
      }))).then(async (sources) => {
      if (!isCurrent()) return;
      const read = sources.filter((source) => !isNullOrEmpty(source))
        .flatMap((source) => this.formater_.read(source, this.map.getProjection()));
      // eslint-disable-next-line no-underscore-dangle
      await Promise.all(read.map((feature) => feature.getImpl().isLoadCesiumFeature_));
      if (!isCurrent()) return;
      const features = read.filter((feature) => {
        const id = feature.getId();
        if (this.loadedFeatureIds_.has(id)) return false;
        this.loadedFeatureIds_.add(id);
        return true;
      });
      this.loaded_ = true;
      if (features.length > 0) {
        await this.addFeatures_(features, true, true);
      }
      if (!this.facadeVector_.isAutoRefreshPaused()) this.facadeVector_.resumeAutoRefresh();
      this.map?.getMapImpl().scene.requestRender();
    });
  }

  /** Recarga interna de GeoPackage; los GeoJSON habituales usan el refresco vectorial. */
  async refreshSource(isCurrent = () => true) {
    if (!this.refreshLoader_) return super.refreshSource(isCurrent);
    const layer = this.cesiumLayer;
    const facade = this.facadeVector_;
    if (!layer || !this.loaded_ || facade.isAutoRefreshPaused()) return undefined;
    const bbox = isFunction(this.bboxLoader_);
    const extents = bbox ? this.getVisibleExtents_() : [];
    let extent;
    if (extents.length === 1) {
      [extent] = extents;
    } else if (extents.length === 2) {
      extent = [-180, extents[0][1], 180, extents[0][3]];
    }
    return this.refreshLoader_(isCurrent, async (source) => {
      const features = this.formater_.read(source, this.map.getProjection());
      // eslint-disable-next-line no-underscore-dangle
      await Promise.all(features.map((feature) => feature.getImpl().isLoadCesiumFeature_));
      if (!isCurrent() || this.cesiumLayer !== layer || facade.isAutoRefreshPaused()) return false;
      facade.removeFeatures(facade.getFeatures(true));
      this.source = source;
      if (bbox) {
        this.viewportRevision_ += 1;
        this.loadedFeatureIds_ = new Set(features.map((feature) => feature.getId()));
        this.loadedExtents_ = extent ? [extent] : [[-180, -90, 180, 90]];
      }
      await this.addFeatures_(features, true, true);
      if (isCurrent()) facade.resumeAutoRefresh();
      this.map?.getMapImpl().scene.requestRender();
      return true;
    }, extent, extent ? 'EPSG:4326' : undefined);
  }

  /**
   * Este método refresca la capa.
   *
   * @public
   * @function
   * @param {String} source Nueva fuente, por defecto nulo.
   * @api stable
   */
  refresh(source = null) {
    const features = this.formater_.write(this.facadeVector_.getFeatures());
    const codeProjection = this.map.getProjection().code.split(':')[1];
    let newSource = {
      type: 'FeatureCollection',
      features,
      crs: {
        properties: {
          code: codeProjection,
        },
        type: 'EPSG',
      },
    };
    if (isObject(source)) {
      newSource = source;
    }
    // eslint-disable-next-line no-underscore-dangle
    this.loadFeaturesPromise_ = null;
    this.source = newSource;
    this.updateSource_();
  }

  /**
   * Este método devuelve la fuente de la capa.
   *
   * @public
   * @function
   * @param {String} source Nueva fuente.
   * @api stable
   */
  setSource(source) {
    this.source = source;
    if (!isNullOrEmpty(this.map)) {
      this.updateSource_();
    }
  }

  /**
   * Este método devuelve los objetos geográficos de manera asincrona.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @public
   * @function
   * @returns {IDEE.layer.GeoJSON.impl.loadFeaturesPromise_} Objetos geográficos, asíncrono.
   * @api
   */
  requestFeatures_() {
    if (isNullOrEmpty(this.loadFeaturesPromise_)) {
      this.loadFeaturesPromise_ = new Promise((resolve, reject) => {
        if (isFunction(this.bboxLoader_)) {
          resolve([]);
        } else if (isFunction(this.fullLoader_)) {
          Promise.resolve().then(() => this.fullLoader_()).then((source) => {
            resolve(this.formater_.read(source, this.map.getProjection()));
          }).catch(reject);
        } else if (this.source) {
          const features = this.formater_.read(this.source, this.map.getProjection());
          resolve(features);
        } else {
          this.loader_.getLoaderFn((features) => {
            resolve(features);
          })(null, null, this.map.getProjection());
        }
      });
    }
    return this.loadFeaturesPromise_;
  }

  /**
   * Este método actualiza la fuente de la capa.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @public
   * @function
   * @api
   */
  updateSource_() {
    const requestedLayer = this.cesiumLayer;
    this.requestFeatures_().then((features) => {
      if (!this.map || this.cesiumLayer !== requestedLayer) return;
      if (this.cesiumLayer) {
        this.facadeVector_.clear();
      }
      this.loaded_ = true;
      this.facadeVector_.addFeatures(features);
    });
  }

  /**
   * Este método devuelve la extensión de todos los objetos geográficos, se
   * le puede pasar un filtro. Asíncrono.
   *
   * @function
   * @param {boolean} skipFilter Indica si se filtra por el filtro "skip".
   * @param {IDEE.Filter} filter Filtro.
   * @return {Array<number>} Extensión de los objetos geográficos.
   * @api stable
   */
  getFeaturesExtentPromise(skipFilter, filter) {
    return new Promise((resolve) => {
      const codeProj = this.map.getProjection().code;
      if (this.isLoaded() === true) {
        const features = this.getFeatures(skipFilter, filter);
        const extent = ImplUtils.getFeaturesExtent(features, codeProj);
        resolve(extent);
      } else {
        this.requestFeatures_().then((features) => {
          this.once(EventType.LOAD, () => {
            const extent = ImplUtils.getFeaturesExtent(features, codeProj);
            resolve(extent);
          });
        });
      }
    });
  }

  /**
   * Evento que se ejecuta cuando se hace clic sobre un objeto geográfico.
   *
   * @public
   * @function
   * @param {Cesium.Entity} feature Objetos geográficos de Cesium.
   * @param {Array} coord Coordenadas.
   * @param {Object} evt Eventos.
   * @api stable
   */
  selectFeatures(features, coord, evt) {
    const feature = features[0];
    if (!(feature instanceof ClusteredFeature) && (this.extract === true)) {
      // unselects previous features
      this.unselectFeatures();

      if (!isNullOrEmpty(feature)) {
        const clickFn = feature.getAttribute('vendor.api_idee.click');
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
   * Este método destruye la capa y deja de escuchar la cámara.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   *
   * @public
   * @function
   * @api
   */
  destroy() {
    this.removeViewportListeners_?.();
    this.removeViewportListeners_ = null;
    this.viewportRevision_ += 1;
    super.destroy();
  }

  /**
   * Devuelve si la capa esta cargada o no.
   *
   * @function
   * @returns {Boolean} Verdadero se cargo falso si no.
   * @api stable
   */
  isLoaded() {
    return this.loaded_;
  }

  /**
   * Esta función comprueba si un objeto es igual
   * a esta capa.
   *
   * @function
   * @param {Object} obj Objeto a comparar.
   * @returns {Boolean} Verdadero es igual, falso si no.
   * @api stable
   */
  equals(obj) {
    let equals = false;

    if (obj instanceof GeoJSON) {
      equals = equals && (this.name === obj.name);
      equals = equals && (this.extract === obj.extract);
    }
    return equals;
  }
}

export default GeoJSON;
