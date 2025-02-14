/**
 * @module M/impl/style/Heatmap
 */
import OLLayerHeatmap from 'ol/layer/Heatmap';
import OLSourceVector from 'ol/source/Vector';
import { isNullOrEmpty, extendsObj } from 'M/util/Utils';
import Style from './Style';
import HeatmapLayer from '../layer/Heatmap';

/**
 * @classdesc
 * Crea un mapa con estilos de calor
 * con parámetros especificados por el usuario.
 * @api
 */

class Heatmap extends Style {
  /**
   * @classdesc
   * Constructor principal de la clase.
   *
   * @constructor
   * @param {Object} options Opciones del estilo.
   * - gradient. Degradado.
   * - blur. Difuminar.
   * - radius. Radio
   * - opacity. Opacidad.
   * - weight. Peso.
   * @api stable
   */
  constructor(attribute, options, vendorOptions) {
    super({});

    /**
     * @private
     * @type {OLLayerHeatmap}
     */
    this.heatmapLayer_ = null;
    /**
     * @private
     * @type {string}
     */
    this.attribute_ = attribute;

    /**
     * @private
     * @type {object}
     */
    this.opt_options_ = extendsObj(options, vendorOptions);

    this.opt_options_.zIndex = 999999;
    /**
     * @private
     * @type {ol.layer.Vector}
     *
     */
    this.oldOLLayer_ = null;
  }

  /**
   * Este método aplica el estilo a la capa especificada.
   * @function
   * @public
   * @param {M.layer.Vector} layer Capa.
   * @api stable
   */
  applyToLayer(layer) {
    this.layer_ = layer;
    if (!isNullOrEmpty(layer)) {
      const ol3Layer = this.layer_.getImpl().getOL3Layer();
      if (!(ol3Layer instanceof OLLayerHeatmap)) {
        this.oldOLLayer_ = ol3Layer;
      }
      const features = this.layer_.getFeatures();
      const olFeatures = features.map((f) => f.getImpl().getOLFeature());
      olFeatures.forEach((f) => f.setStyle(null));
      this.createHeatmapLayer_(olFeatures);
      this.layer_.getImpl().setOL3Layer(this.heatmapLayer_);
    }
  }

  /**
   * Este método elimina el estilo de la capa.
   * @function
   * @public
   * @param {M.layer} layer Capa.
   * @api stable
   */
  unapply(layer) {
    if (!isNullOrEmpty(this.oldOLLayer_)) {
      this.layer_.getImpl().setOL3Layer(this.oldOLLayer_);
      this.layer_.redraw();
      this.layer_ = null;
      this.oldOLLayer_ = null;
      this.heatmapLayer_ = null;
    }
  }

  /**
   * Este método crea un mapa de calor.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @function
   * @public
   * @param {ol.features} olFeatures Objetos geográficos de OpenLayers.
   * @api stable
   */
  createHeatmapLayer_(olFeatures) {
    this.opt_options_.source = new OLSourceVector({
      features: olFeatures,
    });
    this.heatmapLayer_ = new HeatmapLayer(this.opt_options_);
  }

  /**
   * Este método modifica las opciones.
   * @public
   * @param {object} options_ Opciones.
   * @param {object} vendorOptions Opciones de la librería base.
   * @function
   * @api stable
   */
  setOptions(options, vendorOptions) {
    this.opt_options_ = extendsObj(options, vendorOptions);
  }

  /**
   * Este método devuelve el peso mínimo del mapa de calor.
   * @public
   * @function
   * @return {number} Peso mínimo.
   * @api stable
   */
  getMinWeight() {
    return this.heatmapLayer_.getMinWeight();
  }

  /**
   * Este método devuelve el peso máximo del mapa de calor.
   * @public
   * @function
   * @return {number} Peso máximo.
   * @api stable
   */
  getMaxWeight() {
    return this.heatmapLayer_.getMaxWeight();
  }
}

export default Heatmap;
