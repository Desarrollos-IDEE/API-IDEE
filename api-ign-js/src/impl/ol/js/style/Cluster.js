/**
 * @module M/impl/style/Cluster
 */
import { unByKey } from 'ol/Observable';
import { getCenter } from 'ol/extent';
import LayerVector from 'M/layer/Vector';
import OLSourceCluster from 'ol/source/Cluster';
import OLSourceVector from 'ol/source/Vector';
import * as OLeasing from 'ol/easing';
import OLFeature from 'ol/Feature';
import OLGeomPolygon from 'ol/geom/Polygon';
import OLGeomPoint from 'ol/geom/Point';
import Generic from 'M/style/Generic';
import FacadeCluster from 'M/style/Cluster';
import {
  isArray, isNullOrEmpty, isFunction, inverseColor, extendsObj,
} from 'M/util/Utils';
import * as EventType from 'M/event/eventtype';
import ClusteredFeature from 'M/feature/Clustered';
import Style from './Style';
import AnimatedCluster from '../layer/AnimatedCluster';
import SelectCluster from '../interaction/SelectedCluster';
import Centroid from './Centroid';
import Feature from '../feature/Feature';
import coordinatesConvexHull from '../util/convexhull';

/**
 * @classdesc
 * Crea un grupo de estilo
 * con parámetros especificados por el usuario.
 * @api
 * @namespace M.style.Cluster
 */

class Cluster extends Style {
  /**
   * @classdesc
   * Constructor principal de la clase.
   *
   * @constructor
   * @param {Object} options Parámetros de los estilos del "cluster".
   * - ranges: Matriz de objetos con el valor mínimo, el máximo y un M.style.Point.
   * - animated: Indica si se quiere animación o no al desplegar
   * el "cluster".
   * - hoverInteraction: Indica si se quiere mostrar el polígono que
   * engloba los elementos al situarse sobre el "cluster".
   * - selectInteraction: Indica si se quiere que al pinchar en un "cluster"
   * se abra el abanico de puntos o no, por defecto verdadero.
   * - displayAmount: Indica si se muestra el número de elementos
   * que componen el "cluster".
   * - maxFeaturesToSelect: Número máximo de elementos agrupados a partir de los cuales,
   * al hacer click, se hará zoom en lugar de desplegar el "cluster".
   * - distance: Distancia (en píxeles) de agrupación de elementos.
   * - label: Estilo opcional de la etiqueta de número de elementos de
   * todos los rangos, si se muestra.
   * @param {Object} optionsVendor Opciones que se pasarán a la librería base.
   * - animationDuration: Duración de la animación.
   * - animationMethod: Método que realiza la animación.
   * - distanceSelectFeatures: Distancia de selección de los objetos geográficos.
   * - convexHullStyle: Estilo de casco convexo.
   * @api stable
   */
  constructor(options, optionsVendor) {
    super({});

    /**
     *
     * @private
     * @type {M.layer.Vector}
     * @expose
     */
    this.convexHullLayer_ = null;

    /**
     *
     * @private
     * @type {ol.layer.Vector}
     * @expose
     */
    this.oldOL3Layer_ = null;

    /**
     *
     * @private
     * @type {Object}
     * @expose
     */
    this.optionsVendor_ = optionsVendor;

    /**
     *
     * @private
     * @type {Object}
     * @expose
     */
    this.options_ = options;

    /**
     *
     * @private
     * @type {AnimatedCluster}
     * @expose
     */
    this.clusterLayer_ = null;

    /**
     *
     * @private
     * @type {M.impl.interaction.SelectCluster}
     * @expose
     */
    this.selectClusterInteraction_ = null;

    /**
     *
     * @private
     * @type {ol.interaction.Hover}
     * @expose
     */
    this.hoverInteraction_ = null;
  }

  /**
   * Este método aplica estilo a la capa.
   * @public
   * @function
   * @param {M.layer.Vector} layer Capa.
   * @api stable
   */
  applyToLayer(layer, map) {
    this.layer_ = layer;
    this.options_ = this.updateLastRange_();
    if (!isNullOrEmpty(this.selectClusterInteraction_)) {
      this.selectClusterInteraction_.clear();
    }
    this.updateCanvas();
    const features = layer.getFeatures();
    if (features.length > 0) {
      this.clusterize_(features);
    } else {
      this.layer_.on(EventType.LOAD, this.clusterize_.bind(this), this);
    }
  }

  /**
   * Devuelve los grupos de estilos con interación.
   *
   * @function
   * @public
   * @return {Array<ol.interaction.SelectCluster>} Grupo de estilo con interación.
   * @api stable
   */
  get selectClusterInteraction() {
    return this.selectClusterInteraction_;
  }

  /**
   * Aplicar el clúster de estilo a la resolución de vector de capa.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @function
   * @public
   * @param {Array<Feature>} features Objetos geográficos.
   * @api stable
   * @export
   */
  clusterize_(features) {
    const olFeatures = features.map((f) => f.getImpl().getOLFeature());
    this.clusterLayer_ = new AnimatedCluster({
      name: 'Cluster',
      source: new OLSourceCluster({
        distance: this.options_.distance,
        geometryFunction(feature) {
          return new OLGeomPoint(getCenter(feature.getGeometry().getExtent()));
        },
        source: new OLSourceVector({
          features: olFeatures,
        }),
      }),
      animationDuration: this.optionsVendor_.animationDuration,
      style: this.clusterStyleFn_.bind(this),
      animationMethod: OLeasing[this.optionsVendor_.animationMethod],
    });
    if (this.options_.animated === false) {
      this.clusterLayer_.set('animationDuration', undefined);
    }
    this.clusterLayer_.setZIndex(99999);
    const ol3Layer = this.layer_.getImpl().getOL3Layer();
    if (!(ol3Layer instanceof AnimatedCluster)) {
      this.oldOL3Layer_ = ol3Layer;
    }
    this.clusterLayer_.setMaxResolution(this.oldOL3Layer_.getMaxResolution());
    this.clusterLayer_.setMinResolution(this.oldOL3Layer_.getMinResolution());
    this.layer_.getImpl().setOL3Layer(this.clusterLayer_);

    if (isNullOrEmpty(this.options_.ranges)) {
      this.options_.ranges = this.getDefaultRanges_();
      // this.options_.label.color = '#fff';
    }

    if (this.options_.hoverInteraction !== false) {
      this.addCoverInteraction_();
    }
    if (this.options_.selectInteraction !== false) {
      this.addSelectInteraction_();
    }
  }

  /**
   * Este método actualiza el rango del estilo.
   *
   * @function
   * @public
   * @param {Array<Object>} newRanges Nuevo rango.
   * @api stable
   */
  setRanges(newRanges) {
    if (isNullOrEmpty(newRanges)) {
      this.options_.ranges = this.getDefaultRanges_();
      // this.options_.label.color = '#fff';
    } else {
      this.options_.ranges = newRanges;
    }
  }

  /**
   * Este método actualiza el rango anterior.
   *
   * @function
   * @public
   * @return {object} Rango anterior.
   * @api stable
   */
  updateLastRange_() {
    const cloneOptions = extendsObj({}, this.options_);
    if (!isNullOrEmpty(this.options_) && !isNullOrEmpty(this.options_.ranges)) {
      let ranges = cloneOptions.ranges;
      if (ranges.length > 0) {
        ranges = ranges.sort((range, range2) => {
          const min = range.min;
          const min2 = range2.min;
          return min - min2;
        });
        const lastRange = ranges.pop();
        if (isNullOrEmpty(lastRange.max)) {
          const numFeatures = this.layer_.getFeatures().length;
          lastRange.max = numFeatures;
        }
        cloneOptions.ranges.push(lastRange);
      }
    }
    return cloneOptions;
  }

  /**
   * Este método de la clase actualiza el rango de la implementación.
   *
   * @function
   * @public
   * @param {number} min Valor mínimo.
   * @param {number} max Valor máximo.
   * @param {number} newRange Nuevo rango.
   * @param {M.layer.Vector} layer Capa.
   * @param {M.style.Cluster} cluster "cluster".
   * @return {M.style.Cluster} "cluster" actualizado.
   * @api stable
   */
  static updateRangeImpl(min, max, newRange, layer, cluster) {
    const element = cluster
      .getOptions().ranges.find((el) => (el.min === min && el.max === max)) || false;
    if (element) {
      element.style = newRange;
    }
    return element;
  }

  /**
   * Este método actualiza la animación.
   *
   * @function
   * @public
   * @param {boolean} animated Define si el "cluster" tendrá animación.
   * @param {M.layer.Vector} layer Capa.
   * @param {M.style.Cluster} Cluster "cluster".
   * @return {M.style.Cluster} "cluster" actualizado.
   * @api stable
   */

  setAnimated(animated, layer, cluster) {
    const clusterVariable = cluster;
    clusterVariable.getOptions().animated = animated;
    if (animated === false) {
      this.clusterLayer_.set('animationDuration', undefined);
    } else {
      this.clusterLayer_.set('animationDuration', this.optionsVendor_.animationDuration);
    }
    return this;
  }

  /**
   * Agrega la interación a la capa de los objetos geográficos que se ven en el "cluster".
   *
   * @function
   * @public
   * @api stable
   */
  addSelectInteraction() {
    this.addSelectInteraction_();
  }

  /**
   * Agrega la interación a la capa de los objetos geográficos que se ven en el "cluster".
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @function
   * @public
   * @api stable
   */
  addSelectInteraction_() {
    const map = this.layer_.getImpl().getMap();
    this.selectClusterInteraction_ = new SelectCluster({
      fLayer: this.layer_,
      map,
      maxFeaturesToSelect: this.options_.maxFeaturesToSelect,
      pointRadius: this.optionsVendor_.distanceSelectFeatures,
      animate: true,
      // style: this.clusterStyleFn_.bind(this),
      layers: [this.clusterLayer_],
    });
    this.selectClusterInteraction_.on('select', this.selectClusterFeature_.bind(this), this);
    map.getMapImpl().addInteraction(this.selectClusterInteraction_);
    map.getMapImpl().on('change:view', (evt) => this.selectClusterInteraction_.refreshViewEvents(evt));
  }

  /**
   * Elimina la interación a la capa de los objetos geográficos que se ven en el "cluster".
   *
   * @function
   * @public
   * @api stable
   */
  removeSelectInteraction() {
    this.removeSelectInteraction_();
  }

  /**
   * Elimina la interación a la capa de los objetos geográficos que se ven en el "cluster".
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @function
   * @public
   * @api stable
   */
  removeSelectInteraction_() {
    this.layer_.getImpl().getMap().getMapImpl().removeInteraction(this.selectClusterInteraction_);
  }

  /**
   * Añade la interación hober a la capa.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @function
   * @public
   * @param {Array<Features>} features
   * @param {M.evt.EventType} evt
   * @api stable
   */
  hoverFeatureFn_(features, evt) {
    if (!isNullOrEmpty(features)) {
      let hoveredFeatures = [];
      features.forEach((hoveredFeature) => {
        if (hoveredFeature instanceof ClusteredFeature) {
          hoveredFeatures = hoveredFeatures.concat(hoveredFeature.getAttribute('features'));
        } else {
          hoveredFeatures.push(hoveredFeature);
        }
      });

      const coordinates = hoveredFeatures
        .map((f) => f.getImpl().getOLFeature().getGeometry().getCoordinates());
      const convexHull = coordinatesConvexHull(coordinates);
      if (convexHull.length > 2) {
        const convexOlFeature = new OLFeature(new OLGeomPolygon([convexHull]));
        const convexFeature = Feature.olFeature2Facade(convexOlFeature);
        if (isNullOrEmpty(this.convexHullLayer_)) {
          this.convexHullLayer_ = new LayerVector({
            name: `cluster_cover_${this.layer_.name}`,
            extract: false,
          }, {
            displayInLayerSwitcher: false,
            style: new Generic({ polygon: this.optionsVendor_.convexHullStyle }),
          });
          this.convexHullLayer_.addFeatures(convexFeature);
          this.layer_.getImpl().getMap().addLayers(this.convexHullLayer_);
          this.layer_.getImpl().getMap().getMapImpl().getView()
            .on('change:resolution', this.clearConvexHull.bind(this), this);
          this.convexHullLayer_.setStyle(new Generic({
            polygon: this.optionsVendor_.convexHullStyle,
          }));
          this.convexHullLayer_.setZIndex(99990);
        } else {
          this.convexHullLayer_.removeFeatures(this.convexHullLayer_.getFeatures());
          this.convexHullLayer_.addFeatures(convexFeature);
        }
      }
    }
  }

  /**
   * Añade el evento cuando se sale del objeto geográfico.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @function
   * @public
   * @param {Array<Features>} features Objeto geográfico.
   * @param {M.evt.EventType} evt Evento.
   * @api stable
   */
  leaveFeatureFn_(features, evt) {
    if (!isNullOrEmpty(this.convexHullLayer_)) {
      this.convexHullLayer_.removeFeatures(this.convexHullLayer_.getFeatures());
    }
  }

  /**
   * Agregar interacción de portada y capa para ver la portada.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @function
   * @public
   * @api stable
   */
  addCoverInteraction_() {
    this.hoverKey_ = this.layer_.on(EventType.HOVER_FEATURES, this.hoverFeatureFn_.bind(this));
    this.leaveKey_ = this.layer_.on(EventType.LEAVE_FEATURES, this.leaveFeatureFn_.bind(this));
  }

  /**
   * Elimina interacción de portada y capa para ver la portada.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @function
   * @public
   * @api stable
   */
  removeCoverInteraction_() {
    this.layer_.unByKey(EventType.HOVER_FEATURES, this.hoverKey_);
    this.layer_.unByKey(EventType.LEAVE_FEATURES, this.leaveKey_);
  }

  /**
   * Agrega el estilo a los objetos geográficos ("cluster").
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @function
   * @public
   * @param {M.Feature} feature Objetos geográficos.
   * @param {float} resolution Resolución.
   * @param {M.impl.interaction.SelectCluster} selected Selección.
   * @return {object} Devuelve el estilo.
   * @api stable
   * @export
   */
  clusterStyleFn_(feature, resolution, selected) {
    let olStyle;
    const clusterOlFeatures = feature.get('features');
    if (!clusterOlFeatures) {
      return new Centroid();
    }
    const numFeatures = clusterOlFeatures.length;
    const range = this.options_.ranges
      .find((el) => (el.min <= numFeatures && el.max >= numFeatures));
    if (!isNullOrEmpty(range)) {
      let style = range.style.clone();
      if (!(style instanceof Generic)) {
        style = new Generic({ point: style.getOptions() });
      }
      if (selected) {
        style.set('point.fill.opacity', 0.33);
      } else if (this.options_.displayAmount) {
        style.set('point.label', this.options_.label);
        let labelColor = style.get('point.label.color');
        if (isNullOrEmpty(labelColor)) {
          const fillColor = style.get('point.fill.color');
          if (!isNullOrEmpty(fillColor)) {
            labelColor = inverseColor(fillColor);
          } else {
            labelColor = '#000';
          }
          style.set('point.label.color', labelColor);
        }
      }
      olStyle = style.getImpl().olStyleFn(feature, resolution);
    } else if (numFeatures === 1) {
      let clusterOlFeatureStyle = clusterOlFeatures[0].getStyle();
      if (!clusterOlFeatureStyle) {
        clusterOlFeatureStyle = this.oldOL3Layer_.getStyle();
      }
      olStyle = clusterOlFeatureStyle(clusterOlFeatures[0], resolution);
      if (!isArray(olStyle)) {
        olStyle = [olStyle];
      }
      olStyle[0].setGeometry(clusterOlFeatures[0].getGeometry());
    }
    return olStyle;
  }

  /**
   * Este método devuelve el rango del "cluster".
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @function
   * @public
   * @return {Array<Ranges>} Devuelve el rango del "cluster".
   * @api stable
   * @export
   */
  getDefaultRanges_() {
    const numFeatures = this.layer_.getFeatures().length;
    let breakpoint = Math.floor(numFeatures / 3);
    // min value is 3 in order to get valid clusters ranges
    breakpoint = Math.max(breakpoint, 3);
    const ranges = [{
      min: 2,
      max: breakpoint,
      style: new Generic({ point: FacadeCluster.RANGE_1_DEFAULT }),
    }, {
      min: breakpoint,
      max: breakpoint * 2,
      style: new Generic({ point: FacadeCluster.RANGE_2_DEFAULT }),
    }, {
      min: breakpoint * 2,
      max: numFeatures + 1,
      style: new Generic({ point: FacadeCluster.RANGE_3_DEFAULT }),
    }];
    this.options_.ranges = ranges;
    return ranges;
  }

  /**
   * Añade el evento de selección a los objetos geográficos.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @function
   * @public
   * @param {Object} evt Evento.
   * @api stable
   */
  selectClusterFeature_(evt) {
    this.clearConvexHull();
    // if (!isNullOrEmpty(evt.selected)) {
    //   let olFeatures = evt.selected[0].get('features');
    //   let features = olFeatures.map(M.impl.Feature.olFeature2Facade);
    //   this.layer_.fire(M.evt.SELECT_FEATURES, [features, evt]);
    // }
  }

  /**
   * Este método elimina el estilo de la capa.
   * @function
   * @public
   * @api stable
   */
  unapply() {
    if (!isNullOrEmpty(this.clusterLayer_)) {
      this.layer_.getImpl().setOL3Layer(this.oldOL3Layer_);
      this.oldOL3Layer_.setMaxResolution(this.clusterLayer_.getMaxResolution());
      this.oldOL3Layer_.setMinResolution(this.clusterLayer_.getMinResolution());
      this.removeCoverInteraction_();
      this.removeSelectInteraction_();
      this.clearConvexHull();
      this.deactivateChangeResolutionEvent();
      this.layer_.redraw();
      this.deactivateChangeEvent();
    } else if (!isNullOrEmpty(this.layer_)) {
      this.layer_.un(EventType.LOAD, this.clusterize_.bind(this), this);
    }
  }

  /**
   * Vuelve a nulo el parámetro "convexHullLayer_".
   * @public
   * @function
   * @api stable
   */
  clearConvexHull() {
    if (this.convexHullLayer_ !== null) {
      this.layer_.getImpl().getMap().removeLayers(this.convexHullLayer_);
      this.convexHullLayer_ = null;
    }
  }

  /**
   * Este método actualiza el "canvas".
   *
   * @public
   * @function
   * @param {HTMLCanvasElement} canvas Nuevo "canvas".
   * @api stable
   */
  updateCanvas() {}

  /**
   * Actica el cambio del evento.
   * @public
   * @function
   * @api stable
   */
  activateChangeEvent() {
    if (this.clusterLayer_ !== null) {
      const clusterSource = this.clusterLayer_.getSource();
      const callback = OLSourceCluster.prototype.refresh;
      clusterSource.getSource().on('change', callback);
    }
  }

  /**
   * Desactiva el cambio del evento.
   * @public
   * @param {object} canvas
   * @function
   * @api stable
   */
  deactivateChangeEvent() {
    if (this.clusterLayer_ !== null) {
      const clusterSource = this.clusterLayer_.getSource();
      const callback = OLSourceCluster.prototype.refresh;
      unByKey({
        bindTo: undefined,
        callOnce: false,
        listener: callback,
        target: clusterSource.getSource(),
        type: 'change',
      });
    }
  }

  /**
   * Desactiva el cambio de la resolución cuando se realiza la acción.
   * @public
   * @function
   * @api stable
   */
  deactivateChangeResolutionEvent() {
    if (!isNullOrEmpty(this.layer_) && !isNullOrEmpty(this.layer_.getImpl())) {
      const impl = this.layer_.getImpl();
      const map = impl.getMap();
      if (!isNullOrEmpty(map) && !isNullOrEmpty(map.getMapImpl())) {
        const olView = map.getMapImpl().getView();
        unByKey({
          type: 'change:resolution',
          bindTo: undefined,
          listener: this.clearConvexHull,
          target: olView,
          callOnce: false,
        });
      }
    }
  }

  /**
   * Desactiva el cambio de evento con un "callback".
   * @public
   * @param {object} callback "callback".
   * @param {object} callbackArguments Argumentos del callback.
   * @function
   * @api stable
   */
  deactivateTemporarilyChangeEvent(callback, callbackArguments) {
    this.deactivateChangeEvent();
    if (isFunction(callback)) {
      if (callbackArguments == null) {
        callback();
      } else {
        callback(...callbackArguments);
      }
    }
  }

  /**
   * Devuelve el "oldOL3Layer".
   * @public
   * @function
   * @return {object} "oldOL3Layer".
   * @api stable
   */
  get oldOL3Layer() {
    return this.oldOL3Layer_;
  }
}

export default Cluster;
