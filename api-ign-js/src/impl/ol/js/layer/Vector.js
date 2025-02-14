/**
 * @module M/impl/layer/Vector
 */
import { isNullOrEmpty, isFunction, includes } from 'M/util/Utils';
import { compileSync as compileTemplate } from 'M/util/Template';
import Popup from 'M/Popup';
import geojsonPopupTemplate from 'templates/geojson_popup';
import * as EventType from 'M/event/eventtype';
import Style from 'M/style/Style';
import { get as getProj } from 'ol/proj';
import OLLayerVector from 'ol/layer/Vector';
import OLSourceVector from 'ol/source/Vector';
// import OLSourceCluster from 'ol/source/Cluster';
import Layer from './Layer';
import ImplUtils from '../util/Utils';
import Feature from '../feature/Feature';

/**
 * @classdesc
 * Esta clase es la base de todas las capas de tipo vectorial,
 * de esta clase heredan todas las capas vectoriales del API-CNIG.
 *
 * @api
 * @extends {M.impl.layer.Layer}
 */
class Vector extends Layer {
  /**
   * Constructor principal de la clase. Crea una capa vectorial
   * con parámetros especificados por el usuario.
   *
   * @constructor
   * @implements {M.impl.Layer}
   * @param {Mx.parameters.LayerOptions} options Parámetros opcionales para la capa.
   * - style. Define el estilo de la capa.
   * - minZoom. Zoom mínimo aplicable a la capa.
   * - maxZoom. Zoom máximo aplicable a la capa.
   * - visibility. Define si la capa es visible o no. Verdadero por defecto.
   * - displayInLayerSwitcher. Indica si la capa se muestra en el selector de capas.
   * - opacity. Opacidad de capa, por defecto 1.
   * - maxExtent: La medida en que restringe la visualización a una región específica.
   * @param {Object} vendorOptions Opciones para la biblioteca base. Ejemplo vendorOptions:
   * <pre><code>
   * import OLSourceVector from 'ol/source/Vector';
   * {
   *  opacity: 0.1,
   *  source: new OLSourceVector({
   *    attributions: 'vector',
   *    ...
   *  })
   * }
   * </code></pre>
   * @api stable
   */
  constructor(options, vendorOptions) {
    super(options, vendorOptions);

    /**
     * Vector facadeVector_. Instancia de la fachada.
     */
    this.facadeVector_ = null;

    /**
     * Vector features_. Objetos geográficos de esta capa.
     */
    this.features_ = [];

    /**
     * Vector postComposeEvtKey_. "Key" tras el evento.
     */
    this.postComposeEvtKey_ = null;

    /**
     * Vector load_. Indica si la capa esta cargado o no.
     */
    this.load_ = false;

    /**
     * Vector loaded_. Indica si la capa esta cargado o no.
     */
    this.loaded_ = false;

    /**
     * Vector visibility. Define si la capa es visible o no.
     * Verdadero por defecto.
     */
    this.visibility = options.visibility !== false;

    this.maxExtent_ = options.maxExtent;

    // [WARN]
    // applyOLLayerSetStyleHook();
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
    this.ol3Layer = new OLLayerVector(this.vendorOptions_);
    this.updateSource_();
    if (this.opacity_) {
      this.setOpacity(this.opacity_);
    }
    this.setVisible(this.visibility);
    if (addLayer) {
      const olMap = this.map.getMapImpl();
      olMap.addLayer(this.ol3Layer);
    }

    this.ol3Layer.setMaxZoom(this.maxZoom);
    this.ol3Layer.setMinZoom(this.minZoom);
    this.ol3Layer.setExtent(this.maxExtent_);
  }

  /**
   * Este método actualiza la fuente de la capa.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @public
   * @function
   * @api stable
   */
  updateSource_() {
    if (isNullOrEmpty(this.vendorOptions_.source)) {
      if (isNullOrEmpty(this.ol3Layer.getSource())) {
        this.ol3Layer.setSource(new OLSourceVector());
      }
      this.redraw();
      this.loaded_ = true;
      this.fire(EventType.LOAD, [this.features_]);
    }
  }

  /**
   * Este método indica si la capa tiene rango.
   *
   * @function
   * @returns {Boolean} Verdadero.
   * @api stable
   * @expose
   */
  inRange() {
    // vectors are always in range
    return true;
  }

  /**
   * Pasa los objetos geográficos a la plantilla.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   *
   * @public
   * @function
   * @param {ol.Feature} feature Objetos geográficos de Openlayers.
   * @returns {Object} "FeaturesTemplate.features".
   * @api stable
   */
  parseFeaturesForTemplate_(features) {
    const featuresTemplate = {
      features: [],
    };

    features.forEach((feature) => {
      const featureTemplate = {
        id: feature.getId(),
        attributes: this.recursiveExtract_(feature.getAttributes()),
      };
      featuresTemplate.features.push(featureTemplate);
    });
    return featuresTemplate;
  }

  recursiveExtract_(properties, parentKey = '') {
    const attributes = [];

    const propertyKeys = Object.keys(properties);

    propertyKeys.forEach((key) => {
      let addAttribute = true;
      // adds the attribute just if it is not in
      // hiddenAttributes_ or it is in showAttributes_
      if (!isNullOrEmpty(this.showAttributes_)) {
        addAttribute = includes(this.showAttributes_, key);
      } else if (!isNullOrEmpty(this.hiddenAttributes_)) {
        addAttribute = !includes(this.hiddenAttributes_, key);
      }

      if ((typeof properties[key] === 'object' && properties[key]) && !Array.isArray(properties[key])) {
        const values = this.recursiveExtract_(properties[key], (parentKey) ? `${parentKey} | ${key}` : key);
        attributes.push(...values);
      } else if (addAttribute) { // No se añade si es null o undefined
        const fullKey = parentKey ? `${parentKey} | ${key}` : key;
        const filter = fullKey.split(' | ');
        attributes.push({
          key: (parentKey) ? `${filter[filter.length - 2]} | ${filter[filter.length - 1]}` : key,
          value: properties[key],
        });
      }
    });

    return attributes;
  }

  /**
   * Este método añade los objetos geográficos a la capa.
   *
   * @function
   * @public
   * @param {Array<M.feature>} features Objetos geográficos.
   * @param {Boolean} update Actualiza la capa.
   * @api stable
   */
  addFeatures(features, update) {
    features.forEach((newFeature) => {
      const feature = this.features_.find((feature2) => feature2.equals(newFeature));
      if (isNullOrEmpty(feature)) {
        this.features_.push(newFeature);
      }
    });
    if (update) {
      this.updateLayer_();
    }
    this.redraw();
  }

  /**
   * Este método añade los objetos geográficos a la capa y modifica su estilo.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @function
   * @public
   * @api stable
   */
  updateLayer_() {
    const style = this.facadeVector_.getStyle();
    if (!isNullOrEmpty(style)) {
      if (style instanceof Style) {
        this.facadeVector_.setStyle(style);
      } else {
        style.apply(this.facadeVector_);
      }
    }
  }

  /**
   * Este método devuelve todos los objetos geográficos, se le puede pasar un filtro.
   *
   * @function
   * @public
   * @param {boolean} skipFilter Indica el filtro.
   * @param {M.Filter} filter Filtro que se ejecuta.
   * @return {Array<M.Feature>} Devuelve todos los objetos geográficos que coincidan.
   * @api stable
   */
  getFeatures(skipFilter, filter) {
    let features = this.features_;
    if (!skipFilter) features = filter.execute(features);
    return features;
  }

  /**
   * Este método devuelve un objeto geográfico por su id.
   *
   * @function
   * @public
   * @param {string|number} id Identificador del objeto geográfico..
   * @return {null|M.feature} Objeto Geográfico - Devuelve el objeto geográfico con
   * ese id si se encuentra, en caso de que no se encuentre o no indique el id devuelve nulo.
   * @api stable
   */
  getFeatureById(id) {
    return this.features_.find((feature) => feature.getId() === id);
  }

  /**
   * Este método elimina todos los objetos geográficos indicado.
   *
   * @function
   * @public
   * @param {Array<M.feature>} features Objetos geográficos que se eliminarán.
   * @api stable
   */
  removeFeatures(features) {
    this.features_ = this.features_.filter((f) => !(features.includes(f)));
    this.redraw();
  }

  /**
   * Este método vuelve a dibujar la capa.
   *
   * @function
   * @public
   * @api stable
   */
  redraw() {
    const olLayer = this.getOL3Layer();
    if (!isNullOrEmpty(olLayer)) {
      const olSource = olLayer.getSource();
      /**  if (olSource instanceof OLSourceCluster) {
        olSource = olSource.getSource();
      } */
      // remove all features from ol vector
      const olFeatures = [...olSource.getFeatures()];
      olFeatures.forEach(olSource.removeFeature, olSource);

      const features = this.facadeVector_.getFeatures();
      olSource.addFeatures(features.map(Feature.facade2OLFeature));
    }
  }

  /**
   * Este método devuelve la extensión de todos los objetos geográficos
   * filtrados por un filtro determinado.
   *
   * @function
   * @param {boolean} skipFilter Indica si se filtrará por "skip".
   * @param {M.Filter} filter Filtro que se ejecutará.
   * @return {Array<number>} Devuelve los objetos geográficos.
   * @api stable
   */
  getFeaturesExtent(skipFilter, filter) {
    const features = this.getFeatures(skipFilter, filter);
    let extent = ImplUtils.getFeaturesExtent(features, this.map.getProjection().code);
    if (extent === null) {
      extent = this.map.getProjection().getExtent();
    }
    return extent;
  }

  /**
   * Este método ejecuta un objeto geográfico seleccionado.
   *
   * @function
   * @param {ol.features} features Objeto geográfico de Openlayers.
   * @param {Array} coord Coordenadas.
   * @param {Object} evt Eventos.
   * @api stable
   * @expose
   */
  selectFeatures(features, coord, evt) {
    if (this.extract === true) {
      const feature = features[0];
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
   * Maneja funciones de deselección de eventos.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @public
   * @function
   * @api stable
   */
  unselectFeatures() {
    // this.map.removePopup();
  }

  /**
   * Este método establece la clase de la fachada.
   * La fachada se refiere a
   * un patrón estructural como una capa de abstracción con un patrón de diseño.
   *
   * @function
   * @param {object} obj Patrón diseño para capas Vector.
   * @api stable
   */
  setFacadeObj(obj) {
    this.facadeVector_ = obj;
  }

  /**
   * Este método estable la proyección de la capa.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @public
   * @function
   * @param {Array<Number>} oldProj Proyecciones de Openlayers.
   * @param {Array<Number>} newProj Nueva proyección a aplicar.
   * @api stable
   */
  setProjection_(oldProj, newProj) {
    if (oldProj.code !== newProj.code) {
      const srcProj = getProj(oldProj.code);
      const dstProj = getProj(newProj.code);
      this.facadeVector_.getFeatures().forEach((feature) => feature.getImpl()
        .getOLFeature().getGeometry().transform(srcProj, dstProj));
    }
  }

  /**
   * Este método comprueba si un objeto es igual
   * a esta capa.
   *
   * @function
   * @param {object} obj Objeto a comparar.
   * @returns {Boolean} Verdadero es igual, falso si no.
   * @api stable
   */
  equals(obj) {
    let equals = false;
    if (obj instanceof Vector && this.constructor === obj.constructor) {
      equals = true;
    }
    return equals;
  }

  /**
   * Este método devuelve la extensión de todos los objetos geográficos, se
   * le puede pasar un filtro. Asíncrono.
   *
   * @function
   * @param {boolean} skipFilter Indica si se filtra por el filtro "skip".
   * @param {M.Filter} filter Filtro.
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
          const extent = ImplUtils.getFeaturesExtent(features, codeProj);
          resolve(extent);
        });
      }
    });
  }

  /**
   * Este método actualiza la capa.
   * @function
   * @api stable
   */
  refresh() {
    this.getOL3Layer().getSource().clear();
  }

  /**
   * Devuelve si la capa esta cargada o no.
   *
   * @function
   * @returns {Boolean} Verdadero cargada, falso si no.
   * @api stable
   */
  isLoaded() {
    return this.loaded_;
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
    this.map = null;
  }
}

export default Vector;
