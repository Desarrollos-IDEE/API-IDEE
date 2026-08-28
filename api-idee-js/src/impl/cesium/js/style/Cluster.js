/**
 * @module IDEE/impl/style/Cluster
 */
import LayerVector from 'IDEE/layer/Vector';
import Generic from 'IDEE/style/Generic';
import FacadeCluster from 'IDEE/style/Cluster';
import {
  isNullOrEmpty, extendsObj, inverseColor,
  // isFunction,
} from 'IDEE/util/Utils';
import * as EventType from 'IDEE/event/eventtype';
import ClusteredFeature from 'IDEE/feature/Clustered';
import {
  Cartesian3,
  Color,
  CustomDataSource,
  Entity,
  HorizontalOrigin,
  LabelStyle,
  PointGraphics,
  PolygonGraphics,
  PolygonHierarchy,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  VerticalOrigin,
} from 'cesium';
import { getValue } from 'IDEE/i18n/language';
import Style from './Style';
import Utils from '../util/Utils';
import Feature from '../feature/Feature';
import coordinatesConvexHull from '../util/convexhull';
import SelectCluster from '../interaction/SelectedCluster';

/**
 * @classdesc
 * Crea un grupo de estilo
 * con parámetros especificados por el usuario.
 * @api
 * @namespace IDEE.style.Cluster
 */

class Cluster extends Style {
  /**
   * @classdesc
   * Constructor principal de la clase.
   *
   * @constructor
   * @param {Object} options Parámetros de los estilos del "cluster".
   * - ranges: Matriz de objetos con el valor mínimo, el máximo y un IDEE.style.Point.
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
   * - distanceSelectFeatures: Distancia de selección de los objetos geográficos.
   * - convexHullStyle: Estilo de casco convexo.
   * @api stable
   */
  constructor(options, optionsVendor) {
    super({});

    /**
     *
     * @private
     * @type {IDEE.layer.Vector}
     * @expose
     */
    this.convexHullLayer_ = null;

    /**
     *
     * @private
     * @type {Cesium.CustomDataSource}
     * @expose
     */
    this.oldLayer_ = null;

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
     * @type {Cesium.CustomDataSource}
     * @expose
     */
    this.clusterLayer_ = null;

    /**
     *
     * @private
     * @type {IDEE.impl.interaction.SelectCluster}
     * @expose
     */
    this.selectClusterInteraction_ = null;

    /**
     *
     * @private
     * @type {IDEE.impl.interaction.Hover}
     * @expose
     */
    this.hoverInteraction_ = null;

    /**
     * @private
     * @type {function}
     * @expose
     */
    this.boundOnClusterEvent_ = null;
  }

  /**
   * Este método aplica estilo a la capa.
   * @public
   * @function
   * @param {IDEE.layer.Vector} layer Capa.
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
   * @return {Array<IDEE.impl.interaction.SelectCluster>} Grupo de estilo con interación.
   * @api stable
   */
  get selectClusterInteraction() {
    return this.selectClusterInteraction_;
  }

  /**
   * Evento que se genera cuando se muestra un nuevo clúster.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   *
   * @function
   * @private
   * @param {Array<Entity>} clusteredEntities Objetos geográficos de Cesium
   * contenidos en el clúster.
   * @param {Object} cluster Objeto que contiene las primitivas "Billboard", "Label"
   * y "Point" que representan el clúster de los objetos geográficos.
   * @api
   */
  onClusterEvent_(clusteredEntities, cluster) {
    const cesiumCluster = cluster;
    const clusterAux = new Entity({
      point: new PointGraphics({
        pixelSize: cluster.point.pixelSize,
      }),
      postition: cluster.point.position,
      properties: {
        features: clusteredEntities,
      },
    });
    // eslint-disable-next-line no-underscore-dangle
    clusterAux._features = clusteredEntities;
    const style = this.clusterStyleFn_(clusterAux);
    this.setPropertiesCluster_(cesiumCluster, style);
  }

  /**
   * Este método establece los valores de las propiedades de estilo del clúster
   * en Cesium.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   *
   * @function
   * @private
   * @param {Object} clusterF Objeto que contiene las primitivas "Billboard", "Label"
   * y "Point" que representan el clúster de los objetos geográficos.
   * @param {Object} style Estilo.
   * @api
   */
  setPropertiesCluster_(clusterF, style) {
    const cluster = clusterF;
    if (!isNullOrEmpty(style) && !isNullOrEmpty(cluster)) {
      const styleF = style[0];
      cluster.billboard.show = false;
      if (!isNullOrEmpty(styleF.icon)) {
        cluster.billboard.show = true;
        Object.assign(cluster.billboard, {
          image: styleF.icon.image.getValue(),
          color: styleF.icon.color.getValue(),
          scale: styleF.icon.scale ? styleF.icon.scale.getValue() : 1,
          rotation: styleF.icon.rotation.getValue(),
          imageSubRegion: styleF.icon.imageSubRegion
            ? styleF.icon.imageSubRegion.getValue() : undefined,
          pixelOffset: styleF.icon.pixelOffset.getValue(),
          verticalOrigin: styleF.icon.verticalOrigin.getValue() || VerticalOrigin.CENTER,
          horizontalOrigin: styleF.icon.horizontalOrigin.getValue() || HorizontalOrigin.CENTER,
          sizeInMeters: false,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        });
      }
      cluster.point.show = true;
      cluster.point.color = styleF.color;
      cluster.point.outlineColor = styleF.outlineColor;
      cluster.point.outlineWidth = styleF.outlineWidth;
      cluster.point.pixelSize = styleF.pixelSize;
      cluster.label.show = false;
      if (!isNullOrEmpty(styleF.label)) {
        cluster.label.show = true;
        Object.assign(cluster.label, {
          font: styleF.label.font,
          scale: styleF.label.scale,
          pixelOffset: styleF.label.pixelOffset.getValue(),
          fillColor: styleF.label.fillColor.getValue(),
          horizontalOrigin: styleF.label.horizontalOrigin.getValue() || HorizontalOrigin.CENTER,
          verticalOrigin: styleF.label.verticalOrigin.getValue() || VerticalOrigin.CENTER,
          style: LabelStyle.FILL_AND_OUTLINE,
          outlineColor: styleF.label.outlineColor ? styleF.label.outlineColor : Color.WHITE,
          outlineWidth: styleF.label.outlineWidth ? styleF.label.outlineWidth : 1,
          disableDepthTestDistance: styleF.label.disableDepthTestDistance
            ? styleF.label.disableDepthTestDistance.getValue() : undefined,
        });
      }
    } else if (isNullOrEmpty(style)) {
      cluster.billboard.show = false;
      cluster.point.show = false;
      cluster.label.show = false;
    }
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
    const cesiumFeatures = features.map((f) => f.getImpl().getFeature());
    this.clusterLayer_ = new CustomDataSource('Cluster');
    this.clusterLayer_.clustering.enabled = true;
    this.clusterLayer_.clustering.pixelRange = this.options_.distance;
    cesiumFeatures.forEach((entity) => this.clusterLayer_.entities.add(entity));

    const cesiumLayer = this.layer_.getImpl().getLayer();
    if (!(cesiumLayer instanceof CustomDataSource && cesiumLayer.clustering.enabled)) {
      this.oldLayer_ = cesiumLayer;
    }
    this.layer_.getImpl().setLayer(this.clusterLayer_);

    if (isNullOrEmpty(this.options_.ranges)) {
      this.options_.ranges = this.getDefaultRanges_();
    }

    if (this.options_.hoverInteraction !== false) {
      this.addCoverInteraction_();
    }
    if (this.options_.selectInteraction !== false) {
      this.addSelectInteraction_();
    }

    this.boundOnClusterEvent_ = this.onClusterEvent_.bind(this);
    this.clusterLayer_.clustering.clusterEvent.addEventListener(this.boundOnClusterEvent_);
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
   * @param {IDEE.layer.Vector} layer Capa.
   * @param {IDEE.style.Cluster} cluster "cluster".
   * @return {IDEE.style.Cluster} "cluster" actualizado.
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
   * No disponible para Cesium.
   *
   * @function
   * @public
   * @param {boolean} animated Define si el "cluster" tendrá animación.
   * @param {IDEE.layer.Vector} layer Capa.
   * @param {IDEE.style.Cluster} Cluster "cluster".
   * @return {IDEE.style.Cluster} "cluster" actualizado.
   * @api stable
   */

  setAnimated(animated, layer, cluster) {
    // eslint-disable-next-line no-console
    console.warn(getValue('exception').animated_method);
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
      layers: [this.clusterLayer_],
    });
    this.handleSelectEvent = new ScreenSpaceEventHandler(map.getMapImpl().scene.canvas);
    this.handleSelectEvent.setInputAction((click) => {
      this.selectClusterFeature_();
      this.selectClusterInteraction_.selectCluster(click);
      // Guardar posición de la cámara al desplegar el cluster
      this.lastCameraPosition_ = Cartesian3.clone(map.getMapImpl().camera.position);
    }, ScreenSpaceEventType.LEFT_CLICK);

    this.onCameraMoveStart_ = () => {
      // Solo limpiar si la cámara se ha movido significativamente
      const currentPosition = map.getMapImpl().camera.position;
      const threshold = 1.0; // Umbral en metros para considerar movimiento significativo
      if (isNullOrEmpty(this.lastCameraPosition_)
        || Cartesian3.distance(currentPosition, this.lastCameraPosition_) > threshold) {
        this.selectClusterFeature_();
        this.selectClusterInteraction_.refreshViewEvents();
        this.lastCameraPosition_ = null;
      }
    };
    map.getMapImpl().camera.moveStart.addEventListener(this.onCameraMoveStart_);
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
    if (this.handleSelectEvent) {
      this.handleSelectEvent.removeInputAction(ScreenSpaceEventType.LEFT_CLICK);
      this.handleSelectEvent.destroy();
      this.handleSelectEvent = undefined;
    }

    if (!isNullOrEmpty(this.selectClusterInteraction_)) {
      this.selectClusterInteraction_.clear();
      this.layer_.getImpl().getMap().getMapImpl().camera.moveStart
        .removeEventListener(this.onCameraMoveStart_);
    }
  }

  /**
   * Añade la interación hober a la capa.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @function
   * @public
   * @param {Array<Features>} features
   * @param {IDEE.evt.EventType} evt
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
        .map((f) => Utils.getCoordinateEntity(f.getImpl().getFeature()));
      // hoveredFeatures.forEach((f) => {
      //   this.layer_.getImpl().getMap().getMapImpl().entities.add(f.getImpl().getFeature());
      // });
      let convexHull = coordinatesConvexHull(coordinates);
      if (convexHull.length > 2) {
        convexHull = convexHull.map((c) => Cartesian3.fromDegrees(c[0], c[1], c[2]));
        const convexCesiumFeature = new Entity({
          polygon: new PolygonGraphics({
            hierarchy: new PolygonHierarchy(convexHull),
          }),
        });
        const convexFeature = Feature.feature2Facade(convexCesiumFeature);
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
          this.convexHullLayer_.setStyle(new Generic({
            polygon: this.optionsVendor_.convexHullStyle,
          }));
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
   * @param {IDEE.evt.EventType} evt Evento.
   * @api stable
   */
  leaveFeatureFn_(features, evt) {
    if (!isNullOrEmpty(this.convexHullLayer_)) {
      this.convexHullLayer_.removeFeatures(this.convexHullLayer_.getFeatures());
    }
    // this.layer_.getImpl().getMap().getMapImpl().entities.removeAll();
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
   * @param {IDEE.Feature} feature Objetos geográficos.
   * @param {float} resolution Resolución.
   * @param {IDEE.impl.interaction.SelectCluster} selected Selección.
   * @return {object} Devuelve el estilo.
   * @api stable
   * @export
   */
  clusterStyleFn_(feature, resolution, selected) {
    let cesiumStyle;
    // eslint-disable-next-line no-underscore-dangle
    const clusterCesiumFeatures = feature._features;
    if (!clusterCesiumFeatures) {
      return new PointGraphics();
    }
    const numFeatures = clusterCesiumFeatures.length;
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
      cesiumStyle = style.getImpl().olStyleFn(feature);
    } else if (numFeatures === 1) {
      // No debe entrar ya que Cesium no considera como cluster un único feature
      // let clusterCesiumFeatureStyle = clusterCesiumFeatures[0].getStyle();
      // if (!clusterCesiumFeatureStyle) {
      //   clusterCesiumFeatureStyle = this.oldLayer_.getStyle();
      // }
      // cesiumStyle = clusterCesiumFeatureStyle(clusterCesiumFeatures[0], resolution);
      // if (!isArray(cesiumStyle)) {
      //   cesiumStyle = [cesiumStyle];
      // }
      // cesiumStyle[0].setGeometry(clusterCesiumFeatures[0].getGeometry());
    }
    return cesiumStyle;
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
  }

  /**
   * Este método elimina el estilo de la capa.
   * @function
   * @public
   * @api stable
   */
  unapply() {
    if (!isNullOrEmpty(this.clusterLayer_)) {
      this.clusterLayer_.clustering.clusterEvent.removeEventListener(this.boundOnClusterEvent_);
      this.layer_.getImpl().getLayer().clustering.enabled = false;
      // this.layer_.getImpl().setLayer(this.oldLayer_);
      this.removeCoverInteraction_();
      this.removeSelectInteraction_();
      this.clearConvexHull();
      // this.deactivateChangeResolutionEvent();
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
   * Activa el cambio del evento.
   * @public
   * @function
   * @api stable
   */
  activateChangeEvent() {
    // Nota: En Cesium lo realiza automáticamente
    // if (this.clusterLayer_ !== null) {
    //   const clusterSource = this.clusterLayer_.getSource();
    //   const callback = OLSourceCluster.prototype.refresh;
    //   clusterSource.getSource().on('change', callback);
    // }
  }

  /**
   * Desactiva el cambio del evento.
   * @public
   * @param {object} canvas
   * @function
   * @api stable
   */
  deactivateChangeEvent() {
    // Nota: En Cesium no es necesario activar el evento
    // if (this.clusterLayer_ !== null) {
    //   const clusterSource = this.clusterLayer_.getSource();
    //   const callback = OLSourceCluster.prototype.refresh;
    //   unByKey({
    //     bindTo: undefined,
    //     callOnce: false,
    //     listener: callback,
    //     target: clusterSource.getSource(),
    //     type: 'change',
    //   });
    // }
  }

  /**
   * Desactiva el cambio de la resolución cuando se realiza la acción.
   * @public
   * @function
   * @api stable
   */
  deactivateChangeResolutionEvent() {
    // eslint-disable-next-line no-console
    console.warn(getValue('exception').deactivatechangeresolution_method);
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
    // this.deactivateChangeEvent();
    // if (isFunction(callback)) {
    //   if (callbackArguments == null) {
    //     callback();
    //   } else {
    //     callback(...callbackArguments);
    //   }
    // }
  }

  /**
   * Devuelve el "oldLayer".
   * @public
   * @function
   * @return {object} "oldLayer".
   * @api stable
   */
  get oldLayer() {
    return this.oldLayer_;
  }
}

export default Cluster;
