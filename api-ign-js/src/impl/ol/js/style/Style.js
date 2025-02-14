/**
 * @module M/impl/Style
 */
import { toContext as toContextRender } from 'ol/render';
/**
 * @classdesc
 * Clase principal que gestiona los estilos,
 * los estilos de los objetos geográficos, ...
 * @api
 */
class Style {
  /**
   * Constructor principal de la clase.
   * @constructor
   * @param {Object} options Opciones parametrizables.
   * @api stable
   */
  constructor(options = {}) {
    /**
     * Opciones de usuario para este estilo.
     * @private
     * @type {Object}
     */
    this.options_ = options;

    /**
     * Capa a la que se aplica este estilo.
     * @private
     * @type {M.layer.Vector}
     */
    this.layer_ = null;

    this.updateFacadeOptions(options);
  }

  /**
   * Este método aplica a la fachada las opciones de estilo de la implementación.
   * @public
   * @function
   * @param {Object} options Opciones parametrizables.
   * @api stable
   */
  updateFacadeOptions(options = {}) {}

  /**
   * Este método aplica estilos a la capa.
   * @public
   * @function
   * @param {M.layer.Vector} layer Capa.
   * @api stable
   */
  applyToLayer(layer) {
    this.layer_ = layer;
    layer.getFeatures().forEach(this.applyToFeature, this);
  }

  /**
   * Este método aplica los estilos a los objetos geográficos.
   *
   * @public
   * @function
   * @param {M.Feature} feature Objetos geográficos.
   * @api stable
   */
  applyToFeature(feature) {
    feature.getImpl().getOLFeature().setStyle(this.olStyleFn_);
  }

  /**
   * Este método actualiza el "canva".
   *
   * @public
   * @function
   * @param {HTMLCanvasElement} canvas "Canva".
   * @api stable
   */
  updateCanvas(canvas) {
    const canvasSize = Style.getCanvasSize();
    const vectorContext = toContextRender(canvas.getContext('2d'), {
      size: canvasSize,
    });
    vectorContext.setStyle(this.olStyleFn_()[0]);
    this.drawGeometryToCanvas(vectorContext);
  }

  /**
   * Este método dibuja la geometría en el "canvas".
   *
   * @public
   * @function
   * @param {Object} vectorContext Contexto del vector.
   * @api stable
   */
  drawGeometryToCanvas(vectorContext) {}

  /**
   * Esta función obtiene el tamaño del "canvas".
   *
   * @public
   * @function
   * @return {Array<number>} Tamaño del "canvas".
   * @api stable
   */
  static getCanvasSize() {
    return [100, 100];
  }

  /**
   * Este método clona el objeto resultante de la clase.
   *
   * @public
   * @function
   * @returns {Object} Clona el objeto "new Style".
   * @api stable
   */
  clone() {
    return new Style({ ...this.options_ });
  }
}

export default Style;
