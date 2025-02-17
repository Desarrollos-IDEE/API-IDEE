/**
 * @module IDEE/impl/layer/KML
 */
import { compileSync as compileTemplate } from 'IDEE/util/Template';
import popupKMLTemplate from 'templates/kml_popup';
import Popup from 'IDEE/Popup';
import { isNullOrEmpty } from 'IDEE/util/Utils';
import * as EventType from 'IDEE/event/eventtype';
import { KmlDataSource } from 'cesium';
import Vector from './Vector';
import LoaderKML from '../loader/KML';
import FormatKML from '../format/KML';
import ImplUtils from '../util/Utils';
import Feature from '../feature/Feature';

/**
 * @classdesc
 * KML (Keyhole Markup Language). Las capas KML pueden ser estáticas o dinámicas.
 *
 * @api
 * @extends {IDEE.impl.layer.Vector}
 */
class KML extends Vector {
  /**
   * @classdesc
   * Constructor principal de la clase. Crea una capa KML
   * con parámetros especificados por el usuario.
   *
   * @constructor
   * @implements {IDEE.impl.layer.Vector}
   * @param {Mx.parameters.LayerOptions} options Opciones personalizadas para esta capa.
   * - label: Define si se muestra la etiqueta o no. Por defecto mostrará la etiqueta.
   * - visibility: Define si la capa es visible o no.
   * - style: Define el estilo de la capa.
   * - minZoom. Zoom mínimo aplicable a la capa.
   * - maxZoom. Zoom máximo aplicable a la capa.
   * - displayInLayerSwitcher. Indica si la capa se muestra en el selector de capas.
   * - opacity. Opacidad de capa, por defecto 1.
   * - scaleLabel. Escala de la etiqueta.
   * - layers. Permite filtrar el fichero KML por nombre de carpetas.
   * - removeFolderChildren: Permite no mostrar las
   * carpetas descendientes de las carpetas filtradas. Por defecto: true.
   * - maxExtent: La medida en que restringe la visualización a una región específica.
   * - height: Define la altura del objeto geográfico. Puede ser un número o una propiedad.
   *   Si se define la altura será constante para todos los puntos del objeto geográfico.
   * - clampToGround: Define si el objeto geográfico se debe ajustar al suelo. Si las coordenadas
   *   son 3D, por defecto es falso, en caso contrario es verdadero.
   * @param {Object} vendorOptions Opciones para la biblioteca base. Ejemplo vendorOptions:
   * <pre><code>
   * </code></pre>
   * @api stable
   */
  constructor(options, vendorOptions) {
    // calls the super constructor
    super(options, vendorOptions);

    /**
    * KML popup_. Muestra el popup.
    */
    this.popup_ = null;

    /**
    * KML tabPopup_. Ventana del popup.
    */
    this.tabPopup_ = null;

    /**
    * KML loadFeaturesPromise_. Carga los objetos geográficos de forma asincrona.
    */
    this.loadFeaturesPromise_ = null;

    /**
    * KML screenOverlayImg_. Etiqueta de imagen para la superposición de pantalla.
    */
    this.screenOverlayImg_ = null;

    /**
    * KML label_. Determina si muestra la etiqueta o no.
    */
    this.label_ = options.label;

    /**
    * KML extractStyles_. Extraer estilos del KML. Por defecto es verdadero.
    */
    this.extractStyles_ = options.extractStyles;

    /**
    * KML Visibility. Define si la capa es visible o no. Verdadero por defecto.
    */
    this.visibility = options.visibility == null ? true : options.visibility;

    /**
    * KML scaleLabel. Define la escala de la etiqueta.
    */
    this.scaleLabel = options.scaleLabel;

    /**
    * KML layers. Permite filtrar el fichero KML por nombre de carpetas.
    */
    this.layers = options.layers;

    /**
    * KML removeFolderChildren. Permite no mostrar las
    * carpetas descendientes de las carpetas filtradas.
    */
    this.removeFolderChildren = options.removeFolderChildren;
  }

  /**
   * Este método sobrescribe la visilibidad de la capa.
   *
   * @function
   * @param {Boolean} visibility Define si la capa es visible o no.
   * Verdadero por defecto.
   * @api stable
   */
  setVisible(visibility) {
    this.visibility = visibility;

    // layer
    if (!isNullOrEmpty(this.cesiumLayer)) {
      this.cesiumLayer.show = visibility;
    }

    // screen overlay
    if (!isNullOrEmpty(this.screenOverlayImg_)) {
      let display = 'none';
      if (visibility === true) {
        display = 'inherit';
      }
      this.screenOverlayImg_.style[display] = display;
    }
  }

  /**
   * Este método añade la capa al mapa.
   *
   * @public
   * @function
   * @param {IDEE.impl.Map} map Implementación del mapa.
   * @api stable
   */
  addTo(map) {
    this.map = map;
    this.fire(EventType.ADDED_TO_MAP);
    map.on(EventType.CHANGE_PROJ, this.setProjection_.bind(this), this);
    this.facadeVector_.userMaxExtent = null;
    const screenOverlayContainer = !isNullOrEmpty(this.vendorOptions_)
      && this.vendorOptions_.screenOverlayContainer
      ? this.vendorOptions_.screenOverlayContainer : this.map.getMapImpl().container;
    this.formater_ = new FormatKML({
      label: this.label_,
      extractStyles: this.extractStyles_,
      screenOverlayContainer,
      clampToGround: this.clampToGround,
    });
    this.loader_ = new LoaderKML(this.map, this.url, this.formater_);
    this.cesiumLayer = new KmlDataSource(this.vendorOptions_);
    this.updateSource_();
    this.setVisible(this.visibility);
    const cesiumMap = this.map.getMapImpl();
    cesiumMap.dataSources.add(this.cesiumLayer);
  }

  /**
   * Este método selecciona un objeto geográfico.
   * @public
   * @function
   * @param {Cesium.Entity} feature Objeto geográfico de Cesium.
   * @api stable
   */
  selectFeatures(features, coord, evt) {
    // TODO: manage multiples features
    const feature = features[0];
    if (this.extract === true) {
      if (!isNullOrEmpty(feature)) {
        const featureName = feature.getAttribute('name');
        const featureDesc = feature.getAttribute('description');
        const featureCoordCesium = ImplUtils.getCoordinateEntity(feature.getImpl().getFeature());
        const featureCoord = featureCoordCesium
          ? ImplUtils.getFirstCoordinates(featureCoordCesium) : null;
        const htmlAsText = compileTemplate(popupKMLTemplate, {
          vars: {
            name: featureName,
            desc: featureDesc,
          },
          parseToHtml: false,
        });
        this.tabPopup_ = {
          icon: 'g-cartografia-comentarios',
          title: featureName,
          content: htmlAsText,
        };

        const popup = this.map.getPopup();

        if (isNullOrEmpty(popup)) {
          this.popup_ = new Popup();
          this.popup_.addTab(this.tabPopup_);
          this.map.addPopup(this.popup_, featureCoord);
        } else {
          popup.addTab(this.tabPopup_);
        }
      }
    }
  }

  /**
   * Evento que se produce cuando se deja de hacer clic sobre
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
   * Este método sobrescribe la fuente de la capa.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   *
   * @public
   * @function
   * @api stable
   */
  updateSource_() {
    this.requestFeatures_().then((response) => {
      if (this.cesiumLayer) {
        const screenOverlay = response.screenOverlay;
        // removes previous features
        this.facadeVector_.clear();
        this.facadeVector_.addFeatures(response.features);
        this.loaded_ = true;
        if (!isNullOrEmpty(screenOverlay)) {
          const screenOverLayImg = ImplUtils.addOverlayImage(
            screenOverlay,
            this.map,
            this.cesiumLayer,
          );
          this.setScreenOverlayImg(screenOverLayImg);
        }
      } else {
        this.facadeVector_.addFeatures(response.features);
        this.loaded_ = true;
      }
    });
  }

  /**
   * Establece la imagen de superposición de pantalla para este archivo KML.
   *
   * @public
   * @function
   * @param {HTMLElement} screenOverlayImg Imagen de superposición de pantalla.
   * @api stable
   */
  setScreenOverlayImg(screenOverlayImg) {
    this.screenOverlayImg_ = screenOverlayImg;
  }

  /**
   * Este método añade los objetos geográficos a la capa.
   *
   * @function
   * @private
   * @param {Array<IDEE.feature>} features Objetos geográficos.
   * @param {Boolean} update Actualiza la capa.
   * @api stable
   */
  addFeatures_(features, update) {
    const promises = [];
    features.forEach((newFeature) => {
      // eslint-disable-next-line no-underscore-dangle
      promises.push(newFeature.getImpl().isLoadCesiumFeature_);
    });

    Promise.all(promises).then(() => {
      const styleLayer = this.facadeVector_.getStyle();
      const othersEntities = [];
      features.forEach((newFeature) => {
        const feature = this.features_.find((feature2) => feature2.equals(newFeature));
        if (isNullOrEmpty(feature)) {
          if (newFeature.getImpl().othersEntities) {
            othersEntities.push(...newFeature.getImpl().othersEntities);
          }
          this.features_.push(newFeature);
          const featureStyle = newFeature.getStyle();

          const implFeature = newFeature.getImpl();
          implFeature.referenceFacadeLayer = this.facadeVector_;

          // Modificar altura
          implFeature.setHeightGeometry(this.height);

          const entity = Feature.facade2Feature(newFeature);

          if (isNullOrEmpty(featureStyle)) {
            if (newFeature.getAttribute('vendor.api_idee.icon')) {
              // eslint-disable-next-line no-underscore-dangle, no-param-reassign
              newFeature.getImpl().hasPropertyIcon_ = true;
            }
            newFeature.setStyle(styleLayer);
          }

          if (this.opacity_) {
            this.setOpacity(this.opacity_, [entity]);
          }

          if (isNullOrEmpty(this.getLayer())) {
            this.on(EventType.ADDED_TO_MAP, () => {
              this.getLayer().entities.add(entity);
            });
          } else {
            this.getLayer().entities.add(entity);
          }

          newFeature.on(EventType.COMPLETED_CHANGE_STYLE_FEATURE, () => {
            if (this.opacity_) {
              // Modificar opacidad
              this.setOpacity(this.opacity_, [entity]);
            }
          });

          const othersFacadeEntities = [];
          othersEntities.forEach((e) => {
            othersFacadeEntities.push(Feature.feature2Facade(e));
          });
          this.facadeVector_.addFeatures(othersFacadeEntities);
        }
      });

      if (update) {
        this.updateLayer_();
      }

      if (!isNullOrEmpty(this.tileLoadHandler)) {
        this.map.getMapImpl().scene.globe.tileLoadProgressEvent
          .removeEventListener(this.tileLoadHandler);
      }

      this.fire(EventType.LOAD, [this.features_]);
    });
  }

  /**
   * Este método destruye esta capa, limpiando el HTML
   * y anulando el registro de todos los eventos.
   *
   * @public
   * @function
   * @api stable
   */
  destroy() {
    const cesiumMap = this.map.getMapImpl();
    if (!isNullOrEmpty(this.cesiumLayer)) {
      cesiumMap.dataSources.remove(this.cesiumLayer, true);
      this.cesiumLayer = null;
    }

    this.removePopup();
    this.options = null;
    this.map = null;
  }

  /**
   * Este método destruye el KML del popup.
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
   * Este método devuelve la extensión de todos los objetos geográficos, se le puede
   * pasar un filtro. Este método es asincrono.
   *
   * @function
   * @param {boolean} skipFilter Indica si se utilizará el filtro de tipo "skip".
   * @param {IDEE.Filter} filter Filtro que se ejecutará.
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
        this.requestFeatures_().then((response) => {
          this.once(EventType.LOAD, () => {
            const extent = ImplUtils.getFeaturesExtent(response.features, codeProj);
            resolve(extent);
          });
        });
      }
    });
  }

  /**
   * Petición de objetos geográficos.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   *
   * @public
   * @function
   * @returns {IDEE.layer.GeoJSON.impl.loadFeaturesPromise_} Devuelve los objetos geográficos
   * tras realizar la petición, asincrono.
   * @api stable
   */
  requestFeatures_() {
    if (isNullOrEmpty(this.loadFeaturesPromise_)) {
      this.loadFeaturesPromise_ = new Promise((resolve) => {
        this.loader_.getLoaderFn((features) => {
          resolve(features);
        })(
          null,
          null,
          this.map.getProjection(),
          this.scaleLabel,
          this.layers,
          this.removeFolderChildren,
          this.label_,
          this.clampToGround,
        );
      });
    }
    return this.loadFeaturesPromise_;
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

    if (obj instanceof KML) {
      equals = (this.url === obj.url);
      equals = equals && (this.name === obj.name);
      equals = equals && (this.extract === obj.extract);
    }
    return equals;
  }
}

export default KML;
