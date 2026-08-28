/**
 * @module IDEE/impl/interaction/SelectCluster
 */

import {
  BoundingSphere,
  Cartesian3,
  Color,
  CustomDataSource,
  defined,
  Entity,
  Matrix4,
  Transforms,
} from 'cesium';
import { isArray, isNullOrEmpty } from 'IDEE/util/Utils';
import Utils from '../util/Utils';

/**
 * @classdesc
 * Esta clase permite seleccionar agrupaciones de puntos.
 * @api
 */
class SelectCluster {
  /**
   * Constructor principal de la clase.
   *
   * @constructor
   * @param {Object} optionsParam Parametros opcionales:
   * - map: Mapa sobre el que se va a aplicar la interacción.
   * - pointRadius: Radio de los puntos que se van a dibujar.
   * - maxFeaturesToSelect: Número máximo de objetos geográficos que se van a seleccionar.
   * - fLayer: Capa vectorial sobre la que se va a aplicar la interacción.
   * - layers: Capas cluster sobre la que se va a aplicar la interacción.
   * @api
   */
  constructor(optionsParam = {}) {
    const options = optionsParam;
    const overlayLayer = new CustomDataSource('Cluster overlay');
    optionsParam.layers.push(overlayLayer);

    options.filter = (f, l) => {
      if (!l && f.get('selectclusterlink')) return false;
      return true;
    };

    this.map = options.map;
    this.pointRadius = options.pointRadius || 12;
    this.circleMaxObjects = 10;
    this.selectCluster_ = (options.selectCluster !== false);
    this.maxFeaturesToSelect = options.maxFeaturesToSelect;
    this.facadeLayer_ = options.fLayer;
    this.filter_ = options.filter;
    // Create a new overlay layer for
    this.overlayLayer_ = overlayLayer;

    this.map.getMapImpl().dataSources.add(this.overlayLayer_);
  }

  /**
   * Este método se encarga de eliminar los eventos de la interacción.
   *
   * @public
   * @function
   * @api
   */
  clear() {
    if (defined(this.overlayLayer_)) {
      if (this.map.getMapImpl().dataSources.contains(this.overlayLayer_)) {
        this.map.getMapImpl().dataSources.remove(this.overlayLayer_, true);
      }
      this.overlayLayer_.entities.removeAll();
    }
  }

  /**
   * Este método devuelve la capa vectorial sobre la que se aplica la interacción.
   *
   * @public
   * @function
   * @returns {IDEE.layer.Vector} Capa vectorial sobre la que se aplica la interacción.
   * @api
   */
  getLayer() {
    return this.overlayLayer_;
  }

  /**
   * Este método se encarga de recargar los eventos de la interacción.
   *
   * @public
   * @function
   * @api
   */
  refreshViewEvents() {
    this.clear();
    this.map.getMapImpl().dataSources.add(this.overlayLayer_);
  }

  /**
   * Este método se encarga de seleccionar los "clusters".
   *
   * @public
   * @function
   * @param {Cesium.ScreenSpaceEventHandler} e Evento de selección.
   * @api
   */
  selectCluster(e) {
    const pickedObject = this.map.getMapImpl().scene.pick(e.position);
    if (!pickedObject) {
      this.clear();
      return;
    }

    const cluster = pickedObject.id;
    if (!cluster || !isArray(cluster) || cluster.length === 1) {
      return;
    }

    if (!cluster || cluster.length > this.maxFeaturesToSelect) {
      if (this.facadeLayer_.getImpl().getNumZoomLevels() - this.map.getZoom() !== 1) {
        const extend = Utils.getFeaturesExtent(cluster, this.map.getProjection().code);
        this.map.setBbox(extend);
        return;
      }
    }

    this.overlayLayer_.entities.removeAll();

    const centerCartesian = pickedObject.primitive.position;
    const bs = new BoundingSphere(centerCartesian, 1.0);
    const metersPerPixel = this.map.getMapImpl().camera.getPixelSize(
      bs,
      this.map.getMapImpl().scene.canvas.width,
      this.map.getMapImpl().scene.canvas.height,
    );
    const radiusInMeters = metersPerPixel * this.pointRadius * (0.5 + (cluster.length / 4));

    this.drawFeaturesAndLinsInCircle_(cluster, radiusInMeters, centerCartesian);
  }

  /**
   * Este método se encarga de dibujar los objetos geográficos y los enlaces.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   *
   * @private
   * @param {Array<Cesium.Entity>} cluster Objeto geográfico que forma el "cluster".
   * @param {number} radiusInMeters Radio en metros.
   * @param {Cesium.Cartesian3} center Centro en coordenadas cartesianas del "cluster".
   * @function
   * @api
   */
  drawFeaturesAndLinsInCircle_(cluster, radiusInMeters, center) {
    const max = Math.min(cluster.length, 10);
    for (let i = 0; i < max; i += 1) {
      let a = (2 * Math.PI) * (i / max);
      if (max === 2 || max === 4) a += Math.PI / 4;

      const xOffset = radiusInMeters * Math.cos(a);
      const yOffset = radiusInMeters * Math.sin(a);
      const offset = new Cartesian3(xOffset, yOffset, 0);
      const transform = Transforms.eastNorthUpToFixedFrame(center);
      const newPoint = Matrix4.multiplyByPoint(
        transform,
        offset,
        new Cartesian3(),
      );
      this.drawAnimatedFeatureAndLink_(cluster[i], center, newPoint);
    }
  }

  /**
   * Este método se encarga de dibujar los objetos geográficos y los enlaces.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @public
   * @param {Cesium.Entity} clusterFeature Objeto geográfico que forma el "cluster".
   * @param {Cesium.Cartesian3} center Centro en coordenadas cartesianas del "cluster".
   * @param {Cesium.Cartesian3} newPoint Nuevo punto.
   * @function
   * @api
   */
  drawAnimatedFeatureAndLink_(clusterFeature, center, newPoint) {
    const cf = new Entity();
    cf.properties = { ...clusterFeature.properties };

    // eslint-disable-next-line no-underscore-dangle
    cf._id = clusterFeature.id;

    if (!isNullOrEmpty(clusterFeature.point)) {
      cf.point = clusterFeature.point.clone();
      cf.position = newPoint;
    } else if (!isNullOrEmpty(clusterFeature.billboard)) {
      cf.billboard = clusterFeature.billboard.clone();
      cf.position = newPoint;
    }
    this.overlayLayer_.entities.add(cf);

    const lk = new Entity();
    lk.polyline = {
      positions: [center, newPoint],
      width: 2,
      material: Color.fromCssColorString('#7b98bc'),
    };
    lk.addProperty('selectclusterlink', true);
    this.overlayLayer_.entities.add(lk);
  }
}

export default SelectCluster;
