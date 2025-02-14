/**
 * @module IDEE/impl/style/Simple
 */
import { isNullOrEmpty, isFunction, extendsObj } from 'IDEE/util/Utils';
import { Entity } from 'cesium';
import * as EventType from 'IDEE/event/eventtype';
import ImplUtils from '../util/Utils';
import Style from './Style';
import Feature from '../feature/Feature';

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
   * @api stable
   */
  constructor(options = {}) {
    super(options);
    this.updateFacadeOptions(options);
  }

  /**
   * Este método obtiene la función de estilo de Cesium
   * de la Implementación.
   * @public
   * @function
   * @returns {Object} Implementación de Cesium.
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
    if (!isNullOrEmpty(layer)) {
      if (layer.type === 'KML') {
        if (!isNullOrEmpty(layer.options) && layer.options.extractStyles === false) {
          layer.getFeatures().forEach(this.applyToFeature, this);
        }
      } else {
        layer.getFeatures().forEach(this.applyToFeature, this);
      }
    }
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
    // eslint-disable-next-line no-underscore-dangle
    feature.getImpl().isLoadCesiumFeature_.then(() => {
      const cesiumFeature = feature.getImpl().getFeature();
      if (!isNullOrEmpty(this.olStyleFn_)) {
        const styles = this.olStyleFn_(cesiumFeature);
        styles.forEach((style) => {
          const {
            type,
            label,
            icon,
            ...props
          } = style;
          let cesiumType;

          if (type === 'line') cesiumType = 'polyline';
          else cesiumType = type;

          if (!isNullOrEmpty(cesiumFeature[cesiumType])) {
            if (!isNullOrEmpty(label)) {
              cesiumFeature.label = label;
              cesiumFeature.label.disableDepthTestDistance = Number.POSITIVE_INFINITY;
              if (type !== 'point') {
                cesiumFeature.position = ImplUtils.getCenter(cesiumFeature[cesiumType]);
              }
            } else {
              cesiumFeature.label = undefined;
            }
            if (!isNullOrEmpty(icon)) {
              cesiumFeature.billboard = icon;
              cesiumFeature.billboard.disableDepthTestDistance = Number.POSITIVE_INFINITY;
            // eslint-disable-next-line no-underscore-dangle
            } else if (!feature.getImpl().hasPropertyIcon_) {
              cesiumFeature.billboard = undefined;
            }
            cesiumFeature[cesiumType] = Object.assign(cesiumFeature[cesiumType], props);
            // eslint-disable-next-line no-underscore-dangle, no-param-reassign
            feature.getImpl().hasPropertyIcon_ = false;
            feature.fire(EventType.COMPLETED_CHANGE_STYLE_FEATURE);
          }
        });
      }
    });
  }

  /**
   * Este método de la clase obtiene el valor de la función con la que coincide la tecla
   * el parámetro "attr"
   * @public
   * @function
   * @param {string|number|function} attr Atributo o función.
   * @param {Entity} cesiumFeature Objeto geográfico de Cesium.
   * @param {IDEE.layer.Vector} layer Capas.
   * @api stable
   */
  static getValue(attr, cesiumFeature, layer) {
    if (isNullOrEmpty(attr)) return undefined;
    let attrFeature = attr;
    if (isFunction(attr)) {
      if (cesiumFeature instanceof Entity) { // || olFeature instanceof RenderFeature
        const feature = Feature.feature2Facade(cesiumFeature, false);
        attrFeature = attr(feature, isNullOrEmpty(layer) ? undefined : layer.getImpl().getMap());
        if (isNullOrEmpty(attrFeature)) return undefined;
      } else {
        return undefined;
      }
    } else if (templateRegexp.test(attr)) {
      if (cesiumFeature instanceof Entity) { // || olFeature instanceof RenderFeature
        const feature = Feature.feature2Facade(cesiumFeature, false);
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
