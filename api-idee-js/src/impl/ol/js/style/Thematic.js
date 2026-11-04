/**
 * @module IDEE/impl/style/Thematic
 */
import { isNullOrEmpty } from 'IDEE/util/Utils';
import { setFlatStyle } from '../webgl/WebGLLayerProvider';

/**
 * @classdesc
 * Base de las implementaciones de estilos temáticos.
 * @api
 */
class Thematic {
  /**
   * Constructor principal de la clase.
   * @constructor
   * @param {Object} options Opciones del estilo.
   * @api
   */
  constructor(options = {}) {
    this.options_ = options;
    this.definition_ = null;
  }

  /**
   * Las opciones del estilo temático no generan estilos de OpenLayers propios.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @public
   * @function
   * @api
   */
  updateFacadeOptions() {}

  /**
   * Este método aplica el estilo temático a nivel de capa si la capa es WebGL.
   *
   * @public
   * @function
   * @param {IDEE.layer.Vector} layer Capa.
   * @param {Object} definition Definición temática.
   * @returns {boolean} Verdadero si se ha aplicado a la capa; falso si la fachada
   * debe asignar el estilo a cada objeto geográfico.
   * @api
   */
  applyToLayer(layer, definition) {
    this.definition_ = definition;
    const layerImpl = layer.getImpl();
    if (!layerImpl.isWebGL?.() || definition.composed) {
      return false;
    }
    const flatStyle = this.toFlatStyle(definition, layer.getFeatures());
    if (isNullOrEmpty(flatStyle)) {
      layerImpl.useCanvasRenderer('webgl_fallback_style');
      return false;
    }
    setFlatStyle(layerImpl.getLayer(), flatStyle);
    return true;
  }

  /**
   * Este método devuelve el estilo plano equivalente. Lo implementa cada estilo.
   *
   * @public
   * @function
   * @param {Object} definition Definición temática.
   * @param {Array<IDEE.Feature>} features Objetos geográficos de la capa.
   * @returns {Array<Object>|null} Reglas de estilo plano, o nulo.
   * @api
   */
  toFlatStyle(definition, features) {
    return null;
  }

  /**
   * Este método devuelve el estilo de la fachada que corresponde a un objeto
   * geográfico.
   *
   * @public
   * @function
   * @param {ol.Feature} olFeature Objeto geográfico de OpenLayers.
   * @returns {IDEE.Style|undefined} Estilo del objeto geográfico.
   * @api
   */
  getFeatureStyle(olFeature) {
    return undefined;
  }

  /**
   * Función de estilo Canvas equivalente.
   *
   * @public
   * @function
   * @returns {Function|undefined} Función de estilo de OpenLayers.
   * @api
   */
  get olStyleFn() {
    if (isNullOrEmpty(this.definition_)) {
      return undefined;
    }
    return (olFeature, resolution) => {
      if (isNullOrEmpty(olFeature)) {
        return undefined;
      }
      const style = this.getFeatureStyle(olFeature);
      return style?.getImpl().olStyleFn?.(olFeature, resolution);
    };
  }

  /**
   * Devuelve las reglas planas de un estilo de la fachada, o nulo.
   * @param {IDEE.Style} style Estilo de la fachada.
   * @returns {Array<Object>|null} Reglas de estilo plano.
   */
  static toStyleRules(style) {
    return style?.getImpl?.().toFlatStyle?.() ?? null;
  }
}

export default Thematic;
