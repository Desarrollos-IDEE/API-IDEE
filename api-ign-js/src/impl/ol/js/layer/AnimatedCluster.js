/**
 * @module M/impl/layer/AnimatedCluster
 */
import { isNullOrEmpty } from 'M/util/Utils';
import OLLayerVector from 'ol/layer/Vector';
import OLSourceVector from 'ol/source/Vector';
import OLGeomPoint from 'ol/geom/Point';
import { easeOut } from 'ol/easing';
import { buffer } from 'ol/extent';
import { getVectorContext } from 'ol/render';

/**
 * @classdesc
 * La capa se crea con un ol.source.Cluster como capas vectoriales de "cluster" estándar.
 *
 * @api
 * @extends {ol.layer.Vector}
 */
class AnimatedCluster extends OLLayerVector {
  /**
   * Constructor principal de la clase. Crea una capa "AnimatedCluster"
   * con parámetros especificados por el usuario.
   *
   * @constructor
   * @implements {M.impl.layer.Vector}
   * @param {Mx.parameters.LayerOptions} options Opciones personalizadas para esta capa.
   * - style: Estilo del "cluster".
   * - animationDuration: Duración de la animación, por defecto 700.
   * - animationMethod: Efecto de la animación, por defecto easeOut.
   * @api stable
   */
  constructor(options = {}) {
    super(options);

    /**
     * AnimatedCluster styleCluster_. Conjunto de estilo.
     */
    this.styleCluster_ = options.style;

    // super

    /**
     * AnimatedCluster oldCluster_. Fuente vectorial de Openlayers.
     */
    this.oldCluster_ = new OLSourceVector();

    /**
     * AnimatedCluster clusters_. Objetos geográficos del "cluster".
     */
    this.clusters_ = [];

    /**
     * AnimatedCluster animation_. Animación del "cluster", por defecto falso.
     */
    this.animation_ = {
      start: false,
    };

    this.set('animationDuration', typeof options.animationDuration === 'number' ? options.animationDuration : 700);
    this.set('animationMethod', options.animationMethod || easeOut);

    // Save cluster before change
    this.getSource().on('change', this.saveCluster_.bind(this));
    // Animate the cluster
    this.on('prerender', this.animate.bind(this));
    this.on('postrender', this.postanimate.bind(this));
    this.setStyle(options.style);
  }

  /**
   * Este método incluye el "cluster" al mapa.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @public
   * @function
   * @param {M.impl.Map} map Implementación del mapa.
   * @api stable
   */
  saveCluster_() {
    this.oldCluster_.clear();
    if (!this.get('animationDuration')) return;

    const olFeatures = this.getSource().getFeatures();
    if (olFeatures.length && olFeatures[0].get('features')) {
      this.oldCluster_.addFeatures(this.clusters_);
      this.clusters_ = olFeatures.slice(0);
      this.sourceChanged = true;
    }
  }

  /**
   * Este método devuelve los objetos geográficos del "cluster".
   *
   * @public
   * @function
   * @param {M.feature} feature Objetos geográficos.
   * @param {M.cluster} clusters Agrupaciones.
   * @return {Array<Feature>} Objetos geográficos del "cluster".
   * @api stable
   */
  static getClusterForFeature(feature, clusters) {
    return clusters.find((cluster) => {
      const clusterFeatures = cluster.get('features');
      let result;
      if (!isNullOrEmpty(clusterFeatures)) {
        result = clusterFeatures.find((clusterFeature) => clusterFeature === feature);
      }
      return result;
    });
  }

  /**
   * Animación del "cluster".
   *
   * @public
   * @function
   * @param {M.event} event Evento.
   * @api stable
   */
  animate(event) {
    const eventVariable = event;
    const duration = this.get('animationDuration');
    if (!duration) return;

    // Start a new animation, if change resolution and source has changed
    if (this.animation_.resolution !== eventVariable.frameState.viewState.resolution
        && this.sourceChanged) {
      const resolution = eventVariable.frameState.viewState.resolution;
      const extent = eventVariable.frameState.extent;
      this.animation_.reverse = this.animation_.resolution >= resolution;
      this.prepareAnimation_(extent, eventVariable.frameState.viewState.resolution);
      eventVariable.frameState.time = this.animation_.start;
    }

    const numClusters = this.animation_.clustersFrom.length;
    if (numClusters > 0 && numClusters <= 1000 && this.animation_.start) {
      const vectorContext = getVectorContext(eventVariable);
      let animationProgress = (eventVariable.frameState.time - this.animation_.start) / duration;

      // Animation ends
      if (animationProgress > 1) {
        this.animation_.start = false;
        animationProgress = 1;
      }
      animationProgress = this.get('animationMethod')(animationProgress);

      // Layer opacity
      eventVariable.context.save();
      eventVariable.context.globalAlpha = this.getOpacity();

      this.animation_.clustersFrom.forEach((cluster, i) => {
        const ptFrom = cluster.getGeometry().getCoordinates();
        const ptTo = this.animation_.clustersTo[i].getGeometry().getCoordinates();

        if (this.animation_.reverse) {
          ptFrom[0] = ptTo[0] + (animationProgress * (ptFrom[0] - ptTo[0]));
          ptFrom[1] = ptTo[1] + (animationProgress * (ptFrom[1] - ptTo[1]));
        } else {
          ptFrom[0] += animationProgress * (ptTo[0] - ptFrom[0]);
          ptFrom[1] += animationProgress * (ptTo[1] - ptFrom[1]);
        }
        // Draw feature
        const olStyles = this.getStyle()(cluster, eventVariable.frameState.viewState.resolution);
        const geo = new OLGeomPoint(ptFrom);
        if (!isNullOrEmpty(olStyles)) {
          olStyles.forEach((olStyle) => {
            const styleImage = olStyle.getImage();
            if (!isNullOrEmpty(styleImage)) {
              // TODO
              /* eslint-disable */
              if (styleImage.getOrigin() == null) {
                styleImage.origin_ = [];
              }
              if (styleImage.getAnchor() == null) {
                styleImage.normalizedAnchor_ = [];
              }
              if (styleImage.getSize() == null) {
                styleImage.size_ = [];
              }
            }
            vectorContext.setStyle(olStyle);
            vectorContext.drawGeometry(geo);
          });
        }
      });

      eventVariable.context.restore();
      // tell OL3 to continue postcompose animation
      eventVariable.frameState.animate = true;

      // PreventVariable layer drawing (clip with null rect)
      eventVariable.context.save();
      eventVariable.context.beginPath();
      eventVariable.context.rect(0, 0, 0, 0);
      eventVariable.context.clip();
      this.clip_ = true;
    } else { // too much to animate
      this.animation_.clustersFrom.length = 0;
      this.animation_.clustersTo.length = 0;
      this.animation_.start = false;
    }
  }

  /**
   * Este método prepara la animación.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * 
   * @public
   * @function
   * @param {Array<Number>} extent Extensión.
   * @param {Number} resolution Resolución.
   * @api stable
   */
  prepareAnimation_(extent, resolution) {
    this.animation_.clustersFrom = [];
    this.animation_.clustersTo = [];

    const extentBuff = buffer(extent, 100 * resolution);

    const oldClusters = this.oldCluster_.getFeaturesInExtent(extentBuff);
    const currentClusters = this.getSource().getFeaturesInExtent(extentBuff);

    const clustersFrom = this.animation_.reverse ? currentClusters : oldClusters;
    const clustersTo = this.animation_.reverse ? oldClusters : currentClusters;

    clustersFrom.forEach((clusterFrom) => {
      const clusterFeatures = clusterFrom.get('features');
      if (!isNullOrEmpty(clusterFeatures)) {
        const clusterTo = AnimatedCluster.getClusterForFeature(clusterFeatures[0], clustersTo);
        if (!isNullOrEmpty(clusterTo) && clusterTo !== false) {
          this.animation_.clustersFrom.push(clusterFrom);
          this.animation_.clustersTo.push(clusterTo);
        }
      }
    });

    // Save state
    this.animation_.resolution = resolution;
    this.sourceChanged = false;

    // Start animation from now
    this.animation_.start = (new Date()).getTime();
  }

  /**
   * Evento tras la animación.
   *
   * @public
   * @function
   * @param {M.event} e Evento tras la animación.
   * @api stable
   */
  postanimate(e) {
    if (this.clip_) {
      e.context.restore();
      this.clip_ = false;
    }
  }

  /**
   * Sobrescribe el estilo del "cluster".
   *
   * @public
   * @function
   * @param {M.style} style Nuevo estilo para aplicar.
   * @api stable
   */
  setStyle(style) {
    super.setStyle(this.styleCluster_);
  }
}

export default AnimatedCluster;
