/**
 * @module M/impl/layer/KML
 */
import { compileSync as compileTemplate } from 'M/util/Template';
import { get as getProj } from 'ol/proj';
import popupKMLTemplate from 'templates/kml_popup';
import Popup from 'M/Popup';
import { isNullOrEmpty, extend } from 'M/util/Utils';
import * as EventType from 'M/event/eventtype';
import OLLayerVector from 'ol/layer/Vector';
import OLSourceVector from 'ol/source/Vector';
import Vector from './Vector';
import LoaderKML from '../loader/KML';
import FormatKML from '../format/KML';
import ImplUtils from '../util/Utils';

/**
 * @classdesc
 * KML (Keyhole Markup Language). Las capas KML pueden ser estáticas o dinámicas.
 *
 * @api
 * @extends {M.impl.layer.Vector}
 */
class KML extends Vector {
  /**
   * @classdesc
   * Constructor principal de la clase. Crea una capa KML
   * con parámetros especificados por el usuario.
   *
   * @constructor
   * @implements {M.impl.layer.Vector}
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
   * @param {Object} vendorOptions Opciones para la biblioteca base. Ejemplo vendorOptions:
   * <pre><code>
   * import OLSourceVector from 'ol/source/Vector';
   * {
   *  opacity: 0.1,
   *  source: new OLSourceVector({
   *    attributions: 'kml',
   *    ...
   *  })
   * }
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
    if (!isNullOrEmpty(this.ol3Layer)) {
      this.ol3Layer.setVisible(visibility);
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
   * @param {M.impl.Map} map Implementación del mapa.
   * @api stable
   */
  addTo(map, addLayer = true) {
    this.map = map;
    this.fire(EventType.ADDED_TO_MAP);
    map.on(EventType.CHANGE_PROJ, this.setProjection_.bind(this), this);
    this.formater_ = new FormatKML({
      label: this.label_,
      extractStyles: this.extractStyles_,
    });
    this.loader_ = new LoaderKML(this.map, this.url, this.formater_);
    this.ol3Layer = new OLLayerVector(extend({
      extent: this.maxExtent_,
      opacity: this.opacity_,
    }, this.vendorOptions_, true));
    this.updateSource_();
    // sets its visibility if it is in range
    // if (this.options.visibility !== false) {
    this.setVisible(this.visibility);
    // }
    // sets its z-index
    if (this.zIndex_ !== null) {
      this.setZIndex(this.zIndex_);
    }
    const olMap = this.map.getMapImpl();
    this.ol3Layer.setMaxZoom(this.maxZoom);
    this.ol3Layer.setMinZoom(this.minZoom);

    if (addLayer) {
      olMap.addLayer(this.ol3Layer);
    }
  }

  /**
   * Este método selecciona un objeto geográfico.
   * @public
   * @function
   * @param {ol.Feature} feature Objeto geográfico de Openlayers.
   * @api stable
   */
  selectFeatures(features, coord, evt) {
    if (this.extract === true) {
      // TODO: manage multiples features
      const feature = features[0];
      if (!isNullOrEmpty(feature)) {
        const featureName = feature.getAttribute('name');
        const featureDesc = feature.getAttribute('description');
        const featureCoord = feature.getImpl().getOLFeature().getGeometry().getFirstCoordinate();
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
    if (isNullOrEmpty(this.vendorOptions_.source)) {
      this.requestFeatures_().then((response) => {
        this.ol3Layer.setSource(new OLSourceVector({
          loader: () => {
            const screenOverlay = response.screenOverlay;
            // removes previous features
            this.facadeVector_.clear();
            this.facadeVector_.addFeatures(response.features);
            this.fire(EventType.LOAD, [response.features]);
            this.loaded_ = true;
            if (!isNullOrEmpty(screenOverlay)) {
              const screenOverLayImg = ImplUtils.addOverlayImage(screenOverlay, this.map);
              this.setScreenOverlayImg(screenOverLayImg);
            }
          },
        }));
        this.facadeVector_.addFeatures(response.features);
      });
    }
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
   * Este método destruye esta capa, limpiando el HTML
   * y anulando el registro de todos los eventos.
   *
   * @public
   * @function
   * @api stable
   */
  destroy() {
    const olMap = this.map.getMapImpl();

    if (!isNullOrEmpty(this.ol3Layer)) {
      olMap.removeLayer(this.ol3Layer);
      this.ol3Layer = null;
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
   * @param {M.Filter} filter Filtro que se ejecutará.
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
          const extent = ImplUtils.getFeaturesExtent(response.features, codeProj);
          resolve(extent);
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
   * @returns {M.layer.GeoJSON.impl.loadFeaturesPromise_} Devuelve los objetos geográficos
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
          getProj(this.map.getProjection().code),
          this.scaleLabel,
          this.layers,
          this.removeFolderChildren,
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
