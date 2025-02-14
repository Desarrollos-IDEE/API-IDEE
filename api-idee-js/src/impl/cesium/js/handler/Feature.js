/**
 * @module IDEE/impl/handler/Feature
 */
// import ClusteredFeature from 'IDEE/feature/Clustered';
// import Cluster from 'IDEE/style/Cluster';
import { isNullOrEmpty } from 'IDEE/util/Utils';
// import RenderFeature from 'ol/render/Feature';
import {
  Cesium3DTilePointFeature,
  Cesium3DTileFeature,
  Entity,
  ScreenSpaceEventType,
} from 'cesium';
import FeatureFacade from 'IDEE/feature/Feature';

// import AnimatedCluster from '../layer/AnimatedCluster';
// import RenderFeatureImpl from '../feature/RenderFeature';
// import RenderFeatureImpl from '../feature/RenderFeature';
import FeatureImpl from '../feature/Feature';
import ImplUtils from '../util/Utils';

/**
 * Este método añade el evento click a los objetos geográficos.
 * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
 * @public
 * @function
 * @param {Cesium.Entity} feature Objeto geográfico.
 * @param {Cesium.DataSource} layer Capa del objeto geográfico.
 * @api
 */
export const getFacadeFeature = (feature, layer) => {
  let mFeature;
  const featureId = feature.id;
  if (!isNullOrEmpty(featureId)) {
    mFeature = layer.getFeatureById(featureId);
  }
  if (isNullOrEmpty(mFeature)) {
    if (feature instanceof Entity) {
      mFeature = FeatureImpl.feature2Facade(feature);
    }
  }
  return mFeature;
};

/**
 * @classdesc
 * Esta clase añade los eventos necesarios para la gestión de los objetos geográficos.
 * @api
 */
class Feature {
  /**
   * Constructor principal de la clase.
   * @constructor
   * @param {cesium.Map} options Opciones del objeto geográfico.
   * @api stable
   */
  constructor(options = {}) {
    /**
     * Mapa de Cesium.
     * @private
     * @type {IDEE.impl.Map}
     */
    this.map_ = null;

    /**
     * Cursor por defecto.
     * @private
     * @type {String}
     * @expose
     */
    this.defaultCursor_ = undefined;
  }

  /**
   * Este método añade el mapa al mapa de Cesium.
   *
   * @public
   * @function
   * @param {IDEE.Map} map Mapa de API-IDEE.
   * @api stable
   */
  addTo(map) {
    this.map_ = map;
  }

  /**
   * Este método devuelve los objetos geográficos de una capa.
   *
   * @public
   * @param {Cesium.ScreenSpaceEventHandler.PositionedEvent} evt Evento del mapa.
   * @param {IDEE.layer} layer Capa.
   * @function
   * @returns {Array<IDEE.Feature>} Lista de objetos geográficos.
   * @api stable
   */
  getFeaturesByLayer(evt, layer) {
    const features = [];
    const cesiumLayer = !isNullOrEmpty(layer) && layer.isVisible()
      ? layer.getImpl().getLayer() : null;

    if (!isNullOrEmpty(cesiumLayer)) {
      const userMaxExtent = layer.userMaxExtent;
      const pickedObjects = this.map_.getMapImpl().scene.drillPick(evt.pixel);
      const featuresAtPixel = pickedObjects.filter(
        (obj, index, self) => index === self.findIndex((t) => t.id === obj.id),
      );
      featuresAtPixel.forEach((feature) => {
        if (userMaxExtent && !this.handleFeatureInExtent(userMaxExtent, evt.pixel)) {
          return;
        }
        if (feature.id && feature.id.entityCollection.owner === cesiumLayer) {
          // if ((layerFrom instanceof AnimatedCluster)
          //  && !isNullOrEmpty(feature.get('features'))) {
          //   const clusteredFeatures = feature.get('features')
          // .map((f) => getFacadeFeature(f, layer));
          //   if (clusteredFeatures.length === 1) {
          //     features.push(clusteredFeatures[0]);
          //   } else {
          //     let styleCluster = layer.getStyle();
          //     if (!(styleCluster instanceof Cluster)) {
          //       styleCluster = styleCluster.getStyles()
          // .find((style) => style instanceof Cluster);
          //     }
          //     features.push(new ClusteredFeature(clusteredFeatures, {
          //       ranges: styleCluster.getRanges(),
          //       hoverInteraction: styleCluster.getOptions().hoverInteraction,
          //       maxFeaturesToSelect: styleCluster.getOptions().maxFeaturesToSelect,
          //       distance: styleCluster.getOptions().distance,
          //     }));
          //   }
          // } else
          if (!feature.id.properties || !feature.id.properties.hasProperty('selectclusterlink')) {
            features.push(getFacadeFeature(feature.id, layer));
          }
        } else if ((feature instanceof Cesium3DTileFeature
          || feature instanceof Cesium3DTilePointFeature)
          && feature.tileset === cesiumLayer) {
          // eslint-disable-next-line no-underscore-dangle
          const feature3d = new FeatureFacade(feature._batchId);
          const propertyIds = feature.getPropertyIds();
          const propertiesFeature = {};
          propertyIds.forEach((propId) => {
            propertiesFeature[propId] = feature.getProperty(propId);
          });
          feature3d.setAttributes(propertiesFeature);
          features.push(feature3d);
        }
        // if (cesiumLayer.entities.id === feature.id.entityCollection.id) {
        //   features.push(getFacadeFeature(feature.id, layer));
        // }
      });
    }
    return features;
  }

  containsXY(extent, x, y) {
    return extent[0] <= x && x <= extent[2] && extent[1] <= y && y <= extent[3];
  }

  handleFeatureInExtent(userMaxExtent, pixel) {
    if (this.map_.getMapImpl()) {
      const coordinate = ImplUtils.getCoordinateFromPixel(this.map_.getMapImpl(), pixel);
      return this.containsXY(userMaxExtent, coordinate[0], coordinate[1]);
    }
    return null;
  }

  /**
   * Este método añade el cursor "pointer" a los objetos geográficos.
   *
   * @public
   * @function
   * @api stable
   * @export
   */
  addCursorPointer({ pixel }) {
    const viewport = this.map_.getMapImpl().container;

    if (viewport.style.cursor !== 'pointer') {
      this.defaultCursor_ = viewport.style.cursor;
    }
    viewport.style.cursor = 'pointer';

    const feature = this.map_.getMapImpl().scene.pick(pixel);
    if (feature) {
      // eslint-disable-next-line no-underscore-dangle
      this.map_.getMapImpl()._element.style.cursor = 'pointer';
    }
  }

  /**
   * Este método elimina el cursor "pointer" a los objetos geográficos.
   *
   * @public
   * @function
   * @api stable
   * @export
   */
  removeCursorPointer({ pixel }) {
    this.map_.getMapImpl().container.style.cursor = this.defaultCursor_;

    const feature = this.map_.getMapImpl().scene.pick(pixel);
    if (!feature) {
      // eslint-disable-next-line no-underscore-dangle
      this.map_.getMapImpl()._element.style.cursor = this.defaultCursor_;
    }
  }

  /**
   * Este método elimina la capa y los eventos asociados.
   *
   * @public
   * @function
   * @api stable
   */
  destroy() {
    // unlisten event
    this.map_.screenSpaceEventHandler.removeInputAction(ScreenSpaceEventType.LEFT_CLICK);
    this.map_ = null;
  }
}

export default Feature;
