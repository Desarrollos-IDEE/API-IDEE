/**
 * @module M/impl/handler/Feature
 */
import ClusteredFeature from 'M/feature/Clustered';
import Cluster from 'M/style/Cluster';
import { isNullOrEmpty } from 'M/util/Utils';
import RenderFeature from 'ol/render/Feature';
import olFeature from 'ol/Feature';
import { containsXY } from 'ol/extent';

import AnimatedCluster from '../layer/AnimatedCluster';
import RenderFeatureImpl from '../feature/RenderFeature';
import FeatureImpl from '../feature/Feature';

/**
 * Este método añade el evento click a los objetos geográficos.
 * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
 * @public
 * @function
 * @param {ol.feature} feature Objeto geográfico.
 * @param {ol.layer} layer Capa del objeto geográfico.
 * @api
 */
export const getFacadeFeature = (feature, layer) => {
  let mFeature;
  const featureId = feature.getId();
  if (!isNullOrEmpty(featureId)) {
    mFeature = layer.getFeatureById(featureId);
  }
  if (isNullOrEmpty(mFeature)) {
    if (feature instanceof RenderFeature) {
      mFeature = RenderFeatureImpl.olFeature2Facade(feature);
    } else if (feature instanceof olFeature) {
      mFeature = FeatureImpl.olFeature2Facade(feature);
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
   * @param {ol.Map} options Opciones del objeto geográfico.
   * @api stable
   */
  constructor(options = {}) {
    /**
     * Mapa de OpenLayers.
     * @private
     * @type {M.impl.Map}
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
   * Este método añade el mapa al mapa de Openlayers.
   *
   * @public
   * @function
   * @param {M.Map} map Mapa de API-CNIG.
   * @api stable
   */
  addTo(map) {
    this.map_ = map;
  }

  /**
   * Este método devuelve los objetos geográficos de una capa.
   *
   * @public
   * @param {ol.MapBrowserEvent} evt Evento del mapa.
   * @param {M.layer} layer Capa.
   * @function
   * @returns {Array<M.Feature>} Lista de objetos geográficos.
   * @api stable
   */
  getFeaturesByLayer(evt, layer) {
    const features = [];
    const olLayer = !isNullOrEmpty(layer) && layer.isVisible()
      ? layer.getImpl().getOL3Layer() : null;

    if (!isNullOrEmpty(olLayer)) {
      const userMaxExtent = layer.userMaxExtent;
      this.map_.getMapImpl().forEachFeatureAtPixel(evt.pixel, (feature, layerFrom) => {
        if (userMaxExtent && !this.handleFeatureInExtent(userMaxExtent, evt.pixel)) {
          return;
        }
        if ((layerFrom instanceof AnimatedCluster) && !isNullOrEmpty(feature.get('features'))) {
          const clusteredFeatures = feature.get('features').map((f) => getFacadeFeature(f, layer));
          if (clusteredFeatures.length === 1) {
            features.push(clusteredFeatures[0]);
          } else {
            let styleCluster = layer.getStyle();
            if (!(styleCluster instanceof Cluster)) {
              styleCluster = styleCluster.getStyles().find((style) => style instanceof Cluster);
            }
            features.push(new ClusteredFeature(clusteredFeatures, {
              ranges: styleCluster.getRanges(),
              hoverInteraction: styleCluster.getOptions().hoverInteraction,
              maxFeaturesToSelect: styleCluster.getOptions().maxFeaturesToSelect,
              distance: styleCluster.getOptions().distance,
            }));
          }
        } else if (!Object.prototype.hasOwnProperty.call(feature.getProperties(), 'selectclusterlink')) {
          features.push(getFacadeFeature(feature, layer));
        }
      }, {
        layerFilter: (l) => {
          if (l === olLayer) return true;
          const auxstyle = layer.getStyle();
          return (auxstyle instanceof Cluster
            && auxstyle.getOptions().selectInteraction
            && auxstyle.getImpl().selectClusterInteraction.getLayer() === l);
        },
      });
    }
    return features;
  }

  handleFeatureInExtent(userMaxExtent, pixel) {
    const coordinate = this.map_.getMapImpl().getCoordinateFromPixel(pixel);
    return containsXY(userMaxExtent, coordinate[0], coordinate[1]);
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
    const viewport = this.map_.getMapImpl().getViewport();

    if (viewport.style.cursor !== 'pointer') {
      this.defaultCursor_ = viewport.style.cursor;
    }
    viewport.style.cursor = 'pointer';

    const features = this.map_.getMapImpl().getFeaturesAtPixel(pixel);
    if (features.length > 0) {
      this.map_.getMapImpl().getTargetElement().style.cursor = 'pointer';
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
    this.map_.getMapImpl().getViewport().style.cursor = this.defaultCursor_;

    const features = this.map_.getMapImpl().getFeaturesAtPixel(pixel);
    if (features.length === 0) {
      this.map_.getMapImpl().getTargetElement().style.cursor = this.defaultCursor_;
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
    this.map_.un('click', this.onMapClick_, this);
    this.map_ = null;
  }
}

export default Feature;
