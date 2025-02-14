/**
 * @module M/impl/layer/Heatmap
 */
import * as dialog from 'M/dialog';
import { getValue } from 'M/i18n/language';
import OLLayerHeatmap from 'ol/layer/Heatmap';
import OLFeature from 'ol/Feature';
import OLStyle from 'ol/style/Style';
import OLStyleIcon from 'ol/style/Icon';
import Feature from 'M/feature/Feature';
import { clamp } from 'ol/math';
import Simple from '../style/Simple';
/**
 * @classdesc
 * Clase para crear mapas de calor con la API-CNIG.
 *
 * @api
 * @extends {ol.layer.Heatmap}
 */
class Heatmap extends OLLayerHeatmap {
  /**
   * Constructor principal de la clase. Crea una capa de mapa de calor
   * con parámetros especificados por el usuario.
   *
   * @constructor
   * @param {Object} options Parámetros para crear mapas de calor.
   * - weight
   * Propiedades de ol/layer/Heatmap:
   * - className: Un nombre de clase CSS para establecer en el elemento de capa.
   * - opacity: Opacidad de capa, por defecto 1.
   * - visible: Define si la capa es visible o no. Verdadero por defecto.
   * - extent: La extensión límite para la representación de capas.
   *   La capa no se representará fuera de esta extensión.
   * - zIndex: El índice z para la representación de capas.
   * - minResolution: La resolución mínima (inclusive) a la que esta capa será visible.
   * - maxResolution: La resolución máxima (exclusiva) por debajo de la cual esta capa será visible.
   * - minZoom: El nivel mínimo de zoom de vista (exclusivo) por
   * encima del cual esta capa será visible.
   * - maxZoom: El nivel máximo de zoom de vista (inclusive) en el que esta capa será visible.
   * - gradient: El degradado de color del mapa de calor, especificado
   *   como una matriz de cadenas de colores CSS.
   * - radius: Tamaño del radio en píxeles.
   * - blur: Tamaño de desenfoque en píxeles.
   * - properties: Propiedades observables arbitrarias. Se puede acceder con #get() y #set().
   * @api stable
   */
  constructor(options = {}) {
    super(options);

    const weight = options.weight ? options.weight : 'weight';
    let weightFunction;
    if (typeof weight === 'string') {
      let maxWeight = 1;
      const weights = this.getWeights(options);
      if (weights.length > 0) {
        maxWeight = weights.reduce((current, next) => Math.max(current, next));
        this.maxWeight_ = maxWeight;
        this.minWeight_ = weights.reduce((current, next) => Math.min(current, next));
        weightFunction = (feature) => {
          let value;
          if (feature instanceof OLFeature) {
            value = feature.get(weight);
          } else if (feature instanceof Feature) {
            value = feature.getAttribute(weight);
          }
          return parseFloat(value / maxWeight);
        };
      } else if (options.weight) {
        dialog.info(getValue('heatmap').features, getValue('heatmap').name);
      }
    } else {
      weightFunction = weight;
    }
    this.setStyle((feature, resolution) => {
      const weightParam = Simple.getValue(weightFunction, feature);
      const opacity = weightParam !== undefined ? clamp(weightParam, 0, 1) : 1;
      // cast to 8 bits
      const index = (255 * opacity) || 0;
      let style = this.styleCache_[index];
      if (!style) {
        style = [
          new OLStyle({
            image: new OLStyleIcon({
              opacity,
              src: this.circleImage_,
            }),
          }),
        ];
        this.styleCache_[index] = style;
      }
      return style;
    });
  }

  /**
   * Devuelve el peso mínimo.
   *
   * @public
   * @function
   * @returns {Number} Peso mínimo.
   * @api stable
   */
  getMinWeight() {
    return this.minWeight_;
  }

  /**
   * Devuelve el peso máximo.
   *
   * @public
   * @function
   * @returns {Number} Peso máximo.
   * @api stable
   */
  getMaxWeight() {
    return this.maxWeight_;
  }

  /**
   * Devuelve el peso.
   *
   * @public
   * @function
   * @param {Object} options Opciones con el peso.
   * @api stable
   */
  getWeights(options) {
    let weights = [];
    const source = this.getSource();
    if (source !== null) {
      const features = source.getFeatures();
      if (features.length > 0) {
        weights = features.map((feature) => feature.get(options.weight))
          .filter((weightVar) => weightVar != null);
      }
    }
    return weights;
  }
}

export default Heatmap;
