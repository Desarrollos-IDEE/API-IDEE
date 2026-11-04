/**
 * @module IDEE/impl/style/Simple
 */
import OLFeature from 'ol/Feature';
import RenderFeature from 'ol/render/Feature';
import { isNullOrEmpty, isFunction, extendsObj } from 'IDEE/util/Utils';
import Style from './Style';
import Feature from '../feature/Feature';
import { setFlatStyle } from '../webgl/WebGLLayerProvider';

const templateRegexp = /^\{\{([^}]+)\}\}$/;

/**
 * @classdesc
 * Esta clase genera estilos simples.
 * @api
 * @namespace IDEE.impl.style.Simple
 */
class Simple extends Style {
  /**
   * Constructor principal de la clase.
   * @constructor
   * @param {Object} options Opciones de la clase.
   * - icon (src): Ruta del icono.
   * @param {Object} vendorOptions Opciones de proveedor para la biblioteca base.
   * @api stable
   */
  constructor(options = {}, vendorOptions = undefined) {
    super(options);
    this.vendorOptions = vendorOptions;
    this.updateFacadeOptions(options, vendorOptions);
  }

  /**
   * Este método obtiene la función de estilo de Openlayer
   * de la Implementación.
   * @public
   * @function
   * @returns {Object} Implementación de Openlayers.
   * @api stable
   */
  get olStyleFn() {
    return this.olStyleFn_;
  }

  /**
   * Este método aplica los estilos a la capa.
   * @public
   * @function
   * @param {IDEE.layer.Vector} layer Capa.
   * @api stable
   */
  applyToLayer(layer) {
    this.layer_ = layer;
    const layerImpl = layer.getImpl();
    if (layerImpl.isWebGL?.()) {
      const flatStyle = this.toFlatStyle();
      if (!isNullOrEmpty(flatStyle)) {
        setFlatStyle(layerImpl.getLayer(), flatStyle);
        return;
      }
      layerImpl.useCanvasRenderer('webgl_fallback_style');
    }
    // we will apply the style on the ol3 layer
    const olLayer = layerImpl.getLayer();
    if (!isNullOrEmpty(olLayer)) {
      olLayer.setStyle(this.olStyleFn_);
      // layer.getFeatures().forEach(this.applyToFeature, this);
    }
  }

  /**
   * Devuelve el estilo plano (WebGL) equivalente al estilo.
   *
   * @public
   * @function
   * @returns {Array<Object>|Object|null} Estilo plano de OpenLayers, o nulo.
   * @api
   */
  toFlatStyle() {
    return null;
  }

  /**
   * Este método aplica los estilos a los objetos geográficos.
   *
   * @public
   * @param {IDEE.Feature} feature Objetos geográficos.
   * @function
   * @api stable
   */
  applyToFeature(feature) {
    feature.getImpl().getFeature().setStyle(this.olStyleFn_);
  }

  /**
   * Este método de la clase obtiene el valor de la función con la que coincide la tecla
   * el parámetro "attr"
   * @public
   * @function
   * @param {string|number|function} attr Atributo o función.
   * @param {ol.Feature} olFeature Objeto geográfico de OpenLayers.
   * @param {IDEE.layer.Vector} layer Capas.
   * @api stable
   */
  static getValue(attr, olFeature, layer) {
    if (isNullOrEmpty(attr)) return undefined;
    let attrFeature = attr;
    if (isFunction(attr)) {
      if (olFeature instanceof OLFeature || olFeature instanceof RenderFeature) {
        const feature = Feature.feature2Facade(olFeature, false);
        attrFeature = attr(feature, isNullOrEmpty(layer) ? undefined : layer.getImpl().getMap());
        if (isNullOrEmpty(attrFeature)) return undefined;
      } else {
        return undefined;
      }
    } else if (templateRegexp.test(attr)) {
      if (olFeature instanceof OLFeature || olFeature instanceof RenderFeature) {
        const feature = Feature.feature2Facade(olFeature, false);
        const keyFeature = attr.replace(templateRegexp, '$1');
        attrFeature = feature.getAttribute(keyFeature);
        if (isNullOrEmpty(attrFeature)) return undefined;
      } else {
        return undefined;
      }
    }
    return attrFeature;
  }

  /**
   * Este método clona el estilo.
   *
   * @public
   * @return {IDEE.style.Simple} Devuelve un "new Simple".
   * @function
   * @api
   */
  clone() {
    const optsClone = {};
    extendsObj(optsClone, this.options_);
    return new this.constructor(optsClone);
  }
}

export default Simple;
