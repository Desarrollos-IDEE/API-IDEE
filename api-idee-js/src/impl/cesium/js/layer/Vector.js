/**
 * @module IDEE/impl/layer/Vector
 */
import {
  isNullOrEmpty,
  isFunction,
  includes,
  isString,
  isUndefined,
} from 'IDEE/util/Utils';
import { compileSync as compileTemplate } from 'IDEE/util/Template';
import Popup from 'IDEE/Popup';
import geojsonPopupTemplate from 'templates/geojson_popup';
import * as EventType from 'IDEE/event/eventtype';
import Style from 'IDEE/style/Style';
import {
  BillboardGraphics,
  Color,
  CustomDataSource,
  GeoJsonDataSource,
  ImageMaterialProperty,
  PathGraphics,
  PointGraphics,
  PolylineGraphics,
  PolylineOutlineMaterialProperty,
} from 'cesium';
import { getValue } from 'IDEE/i18n/language';
import Layer from './Layer';
import ImplUtils from '../util/Utils';
import Feature from '../feature/Feature';

/**
 * @classdesc
 * Esta clase es la base de todas las capas de tipo vectorial,
 * de esta clase heredan todas las capas vectoriales del API-IDEE.
 *
 * @api
 * @extends {IDEE.impl.layer.Layer}
 */
class Vector extends Layer {
  /**
   * Constructor principal de la clase. Crea una capa vectorial
   * con parámetros especificados por el usuario.
   *
   * @constructor
   * @implements {IDEE.impl.Layer}
   * @param {Mx.parameters.LayerOptions} options Parámetros opcionales para la capa.
   * - style. Define el estilo de la capa.
   * - minZoom. Zoom mínimo aplicable a la capa.
   * - maxZoom. Zoom máximo aplicable a la capa.
   * - visibility. Define si la capa es visible o no. Verdadero por defecto.
   * - displayInLayerSwitcher. Indica si la capa se muestra en el selector de capas.
   * - opacity. Opacidad de capa, por defecto 1.
   * - maxExtent: La medida en que restringe la visualización a una región específica.
   * - height: Define la altura del objeto geográfico. Puede ser un número o una propiedad.
   *   Si se define la altura será constante para todos los puntos del objeto geográfico.
   *   Solo disponible para Cesium.
   * @param {Object} vendorOptions Opciones para la biblioteca base. Ejemplo vendorOptions:
   * <pre><code>
   * {}
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

    /**
     * Vector height. Define la altitud del objeto geográfico.
     * Puede ser un número o una propiedad del feature.
     */
    this.height = !isUndefined(options.height) ? options.height : undefined;

    // [WARN]
    // applyOLLayerSetStyleHook();

    /**
     * Layer opacity_. Opacidad de capa, por defecto undefined.
    */
    this.opacity_ = this.options.opacity;

    /**
     * clampToGround. Define si el objeto geográfico se debe ajustar
     * al suelo, por defecto falso.
     */
    this.clampToGround = options.clampToGround;

    /**
     * countFeatures_. Define el número de objetos geográficos de la capa.
     */
    this.countFeatures_ = 0;

    /**
     * countPromise_. Define el número de promesas completadas.
     */
    this.countPromise_ = 0;
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
    this.facadeVector_.userMaxExtent = null;
    this.map = map;
    map.on(EventType.CHANGE_PROJ, this.setProjection_.bind(this), this);
    this.cesiumLayer = new CustomDataSource(this.name);
    this.setVisible(this.visibility);
    const cesiumMap = this.map.getMapImpl();
    cesiumMap.dataSources.add(this.cesiumLayer);
    this.completeLoad_();
    this.fire(EventType.ADDED_TO_MAP);
  }

  /**
    * Este método devuelve la opacidad de esta capa.
    *
    * @function
    * @returns {Number} Opacidad (0, 1). Predeterminado 1.
    * @api stable
    * @expose
    */
  getOpacity() {
    const features = this.getFeatures(true);
    if (features.length > 0) {
      const feature = features[0];
      this.opacity_ = feature.getImpl().getFeatureOpacity();
    }
    return this.opacity_ || 1;
  }

  /**
   * Este método establece la opacidad de esta capa.
   *
   * @function
   * @param {Number} opacity Opacidad (0, 1). Predeterminado 1.
   * @param {Array<Cesium.Entity>} features Objetos geográficos
   * que cambiarán su opacidad. Opcional.
   * @api stable
   * @expose
   */
  setOpacity(opacity = 1, features = []) {
    let opacityParsed = opacity;
    if (!isNullOrEmpty(opacity) && isString(opacity)) {
      opacityParsed = Number(opacity);
    }
    this.opacity_ = opacityParsed;
    if (!isNullOrEmpty(this.getLayer())) {
      const f = !isNullOrEmpty(features) ? features : this.getLayer().entities.values;
      f.forEach((feature) => {
        const geometry = ImplUtils.getGeometryEntity(feature);
        if (geometry instanceof PointGraphics) {
          const currentColor = geometry.color.getValue();
          geometry.color = Color.fromAlpha(currentColor, opacityParsed);
          const currentOutlineColor = geometry.outlineColor.getValue();
          geometry.outlineColor = Color.fromAlpha(currentOutlineColor, opacityParsed);
        } else if (geometry instanceof BillboardGraphics) {
          geometry.color = new Color(1.0, 1.0, 1.0, opacity);
        } else if (!isNullOrEmpty(geometry)) {
          if (!(geometry instanceof PolylineGraphics) && !(geometry instanceof PathGraphics)
            && !(geometry instanceof BillboardGraphics)) {
            const currentOutlineColor = geometry.outlineColor.getValue();
            geometry.outlineColor = Color.fromAlpha(currentOutlineColor, opacityParsed);
          }

          const currentColor = geometry.material.getValue().color;
          if (!(geometry.material instanceof ImageMaterialProperty)
            && !(geometry.material instanceof PolylineOutlineMaterialProperty)) {
            geometry.material.color = Color.fromAlpha(currentColor, opacityParsed);
          } else if (geometry.material instanceof PolylineOutlineMaterialProperty) {
            geometry.material.color = Color.fromAlpha(currentColor, opacityParsed);
            const currentOutlineColor = geometry.material.outlineColor.getValue();
            geometry.material.outlineColor = Color.fromAlpha(currentOutlineColor, opacityParsed);
          } else {
            geometry.material.color = Color.fromAlpha(currentColor, opacityParsed);
          }
        }
      });
    }
  }

  /**
   * Este método devuelve el índice z de esta capa.
   *
   * @function
   * @return {Number} Índice de la capa.
   * @api stable
   * @expose
   */
  getZIndex() {
    if (!isNullOrEmpty(this.getLayer())) {
      this.zIndex_ = this.map.getMapImpl().dataSources.indexOf(this.getLayer());
    }
    return this.zIndex_;
  }

  /**
   * Este método establece el índice z de esta capa.
   *
   * @function
   * @param {Number} zIndex Índice de la capa.
   * @api stable
   * @expose
   */
  setZIndex(zIndex) {
    this.zIndex_ = zIndex;
    if (!isNullOrEmpty(this.getLayer())) {
      const cesiumMap = this.map.getMapImpl();
      // eslint-disable-next-line no-underscore-dangle
      if ((cesiumMap.dataSources._dataSources.length - 1) >= zIndex) {
        const oldIndex = cesiumMap.dataSources.indexOf(this.cesiumLayer);
        const difIndex = zIndex - oldIndex;
        for (let i = 0; i < Math.abs(difIndex); i += 1) {
          if (difIndex < 0) {
            cesiumMap.dataSources.lower(this.cesiumLayer);
          } else {
            cesiumMap.dataSources.raise(this.cesiumLayer);
          }
        }
        this.map.getLayers().forEach((layer) => {
          const layerImpl = layer.getImpl().getLayer();
          if (layerImpl instanceof CustomDataSource || layerImpl instanceof GeoJsonDataSource) {
            // eslint-disable-next-line
            layer.zindex_ = this.map.getMapImpl().dataSources.indexOf(layerImpl);
            // eslint-disable-next-line
            layer.isBase = false;
          }
        });
      } else {
        // eslint-disable-next-line no-console
        console.error(getValue('exception').index_error);
      }
    }
  }

  /**
   * Este método establece la capa Cesium.
   *
   * @function
   * @param {CustomDataSource|KMLDataSource|GeoJsonDataSource} layer Capa de Cesium.
   * @api stable
   * @expose
   */
  setLayer(layer) {
    const cesiumMap = this.map.getMapImpl();
    if (this.cesiumLayer !== layer) {
      this.facadeVector_.removeFeatures(this.facadeVector_.getFeatures());
      const oldzIndex = cesiumMap.dataSources.indexOf(this.cesiumLayer);
      cesiumMap.dataSources.remove(this.cesiumLayer);
      this.cesiumLayer = layer;
      const promise = cesiumMap.dataSources.add(layer);
      promise.then((l) => {
        const newzIndex = cesiumMap.dataSources.indexOf(l);
        const difIndex = oldzIndex - newzIndex;
        for (let i = 0; i < Math.abs(difIndex); i += 1) {
          if (difIndex < 0) {
            cesiumMap.dataSources.lower(l);
          } else {
            cesiumMap.dataSources.raise(l);
          }
        }
      });
    }
    return this;
  }

  /**
   * Este método actualiza la fuente de la capa.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @public
   * @function
   * @api stable
   */
  updateSource_() {
    this.redraw();
    this.completeLoad_();
  }

  /**
   * Este método devuelve si la capa es válida.
   *
   * @public
   * @function
   * @returns {Boolean} Verdadero si es válida, falso si no.
   * @api stable
   */
  isValidSource() {
    if (isNullOrEmpty(this.cesiumLayer)) {
      return false;
    }
    return true;
  }

  completeLoad_() {
    this.loaded_ = true;
    this.fire(EventType.LOAD, [this.features_]);
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
   * @param {Cesium.EntityCollection} feature Objetos geográficos de Cesium.
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
   * @param {Array<IDEE.feature>} features Objetos geográficos.
   * @param {Boolean} update Actualiza la capa.
   * @api stable
   */
  addFeatures(features, update) {
    if (!isNullOrEmpty(this.map)) {
      const cesiumMap = this.map.getMapImpl();
      const terrain = this.map.getTerrain();
      // eslint-disable-next-line no-underscore-dangle
      if (terrain.length === 1 && terrain[0].getImpl().isLoaded_
        && cesiumMap.scene.globe.tilesLoaded) {
        this.handlerAddFeatures_(features, update);
      } else if (terrain.length === 0 && cesiumMap.scene.globe.tilesLoaded) {
        this.handlerAddFeatures_(features, update);
      } else {
        this.tileLoadHandler = this.handlerAddFeatures_.bind(this, features, update);
        cesiumMap.scene.globe.tileLoadProgressEvent.addEventListener(this.tileLoadHandler);
      }
    } else {
      this.addFeatures_(features, update);
    }
  }

  /**
   * Este método añade los objetos geográficos cuando el mapa
   * y el terreno (si está añadido) estén cargados.
   *
   * @private
   * @function
   * @param {Array<M.feature>} features Objetos geográficos.
   * @param {Boolean} update Actualiza la capa.
   * @api
   */
  handlerAddFeatures_(features, update) {
    const cesiumMap = this.map.getMapImpl();
    if (cesiumMap.scene.globe.tilesLoaded) {
      this.addFeatures_(features, update);
    }
  }

  /**
   * Este método añade los objetos geográficos a la capa.
   *
   * @function
   * @private
   * @param {Array<M.feature>} features Objetos geográficos.
   * @param {Boolean} update Actualiza la capa.
   * @api stable
   */
  addFeatures_(features, update) {
    this.countFeatures_ += features.length;

    const promises = [];
    features.forEach((newFeature) => {
      // eslint-disable-next-line no-underscore-dangle
      promises.push(newFeature.getImpl().isLoadCesiumFeature_);
    });

    Promise.all(promises).then(() => {
      const styleLayer = this.facadeVector_.getStyle();
      const othersEntities = [];
      features.forEach((newFeature) => {
        this.countPromise_ += 1;
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
          } else if (this.opacity_) {
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

      if (this.countFeatures_ === this.countPromise_) {
        this.facadeVector_.fire(EventType.LOAD);
        this.countFeatures_ = 0;
        this.countPromise_ = 0;
      }

      if (update) {
        this.updateLayer_();
      }

      if (!isNullOrEmpty(this.tileLoadHandler)) {
        this.map.getMapImpl().scene.globe.tileLoadProgressEvent
          .removeEventListener(this.tileLoadHandler);
      }
    });
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
   * @param {IDEE.Filter} filter Filtro que se ejecuta.
   * @return {Array<IDEE.Feature>} Devuelve todos los objetos geográficos que coincidan.
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
   * @return {null|IDEE.feature} Objeto Geográfico - Devuelve el objeto geográfico con
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
   * @param {Array<IDEE.feature>} features Objetos geográficos que se eliminarán.
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
    const cesiumLayer = this.getLayer();
    if (!isNullOrEmpty(cesiumLayer)) {
      const cesiumFeatures = cesiumLayer.entities;
      // remove all entities from CustomDataSource
      cesiumFeatures.removeAll();

      const features = this.facadeVector_.getFeatures();
      features.forEach((feature) => {
        feature.getImpl().setHeightGeometry(this.height);
      });
      const entities = features.map(Feature.facade2Feature);
      entities.forEach((entity) => {
        cesiumLayer.entities.add(entity);
      });
    }
  }

  /**
   * Este método devuelve la extensión de todos los objetos geográficos
   * filtrados por un filtro determinado.
   *
   * @function
   * @param {boolean} skipFilter Indica si se filtrará por "skip".
   * @param {IDEE.Filter} filter Filtro que se ejecutará.
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
   * @param {Cesium.Entity} features Objeto geográfico de Cesium.
   * @param {Array} coord Coordenadas.
   * @param {Object} evt Eventos.
   * @api stable
   * @expose
   */
  selectFeatures(features, coord, evt) {
    if (this.extract === true) {
      const feature = features[0];
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
   * No disponible para Cesium.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   *
   * @public
   * @function
   * @param {Array<Number>} oldProj Proyecciones.
   * @param {Array<Number>} newProj Nueva proyección a aplicar.
   * @api stable
   */
  setProjection_(oldProj, newProj) {
    console.warn(getValue('exception').no_setprojection); // eslint-disable-line
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
   * Este método actualiza la capa.
   * @function
   * @api stable
   */
  refresh() {
    if (!isNullOrEmpty(this.getLayer())) {
      const cesiumMap = this.map.getMapImpl();
      const oldzIndex = cesiumMap.dataSources.indexOf(this.getLayer());
      cesiumMap.dataSources.remove(this.getLayer(), false);
      const promise = cesiumMap.dataSources.add(this.getLayer());
      promise.then((l) => {
        const newzIndex = cesiumMap.dataSources.indexOf(l);
        const difIndex = oldzIndex - newzIndex;
        for (let i = 0; i < Math.abs(difIndex); i += 1) {
          if (difIndex < 0) {
            cesiumMap.dataSources.lower(l);
          } else {
            cesiumMap.dataSources.raise(l);
          }
        }
      });
    }
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
    const cesiumMap = this.map.getMapImpl();
    if (!isNullOrEmpty(this.cesiumLayer)) {
      cesiumMap.dataSources.remove(this.cesiumLayer, true);
      this.cesiumLayer = null;
    }
    this.map = null;
  }

  /**
   * Este método establece el zoom mínimo de esta capa.
   * No disponible para Cesium.
   *
   * @function
   * @param {Number} zoom Zoom mínimo aplicable a la capa.
   * @api stable
   * @expose
   */
  setMinZoom(zoom) {
    // eslint-disable-next-line no-console
    console.warn(getValue('exception').setminzoom_method);
  }

  /**
   * Este método establece el zoom máximo de esta capa.
   * No disponible para Cesium.
   *
   * @function
   * @param {Number} zoom Zoom máximo aplicable a la capa.
   * @api stable
   * @expose
   */
  setMaxZoom(zoom) {
    // eslint-disable-next-line no-console
    console.warn(getValue('exception').setmaxzoom_method);
  }

  /**
   * Este método establece la extensión máxima de la capa.
   * No disponible para Cesium.
   *
   * @function
   * @param {Array<Number>} extent Extensión máxima.
   * @api stable
   * @expose
   */
  setMaxExtent(extent) {
    // eslint-disable-next-line no-console
    console.warn(getValue('exception').setmaxextent_method);
  }
}

export default Vector;
