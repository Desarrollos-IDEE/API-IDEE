/**
 * @module IDEE/style/Polygon
 */
import PolygonImpl from 'impl/style/Polygon';
import Simple from './Simple';
import { isNullOrEmpty, extendsObj } from '../util/Utils';

/**
 * @classdesc
 * Crea el estilo de un polígono.
 * @api
 * @extends {IDEE.style.Simple}
 */
class Polygon extends Simple {
  /**
   * Constructor principal de la clase.
   * @constructor
   * @param {Object} optionsParam Opciones que se pasarán a la implementación.
   * - stroke: Borde del polígono.
   *    - width: Tamaño.
   *    - pattern (name, src, color, size, spacing, rotation, scale, offset)
   *    - linedash: Línea rayada.
   *    - linejoin: Línea unidas.
   *    - linecap: Límite de la línea.
   * - label
   *    - rotate: Rotación.
   *    - offset: Desplazamiento.
   *    - stroke (color, width, linecap, linejoin, linedash)
   * - fill: Relleno.
   *    - color: Color.
   *    - opacity: Opacidad.
   *    - pattern (name, src, color, size, spacing, rotation, scale, offset)
   * - renderer: Renderizado.
   *     - property: Propiedades.
   *     - stoke (color y width).
   * - heightReference: Posición relativa al terreno. Solo tendrá efecto si el
   *   parámetro height de la capa tiene valor. Solo disponible para Cesium.
   * - perPositionHeight: Indica si se utiliza o no la altura dada en las coordenadas
   *   de la geometría. Solo disponible para Cesium.
   * - extrudedHeight: Extrusión del polígono. Solo disponible para Cesium.
   * - extrudedHeightReference: Posición relativa al terreno de la extrusión del
   *   polígono. Solo tendrá efecto si extrudedHeight tiene valor.
   *   Solo disponible para Cesium.
   * @param {Object} vendorOptions Opciones de proveedor para la biblioteca base.
   * @api
   */
  constructor(optionsParam = {}, vendorOptions = undefined) {
    let options = optionsParam;
    if (vendorOptions) {
      options = {};
    } else {
      if (isNullOrEmpty(options)) {
        options = Polygon.DEFAULT_NULL;
      }
      options = extendsObj({}, options);
    }

    const impl = new PolygonImpl(options, vendorOptions);
    super(options, impl);
  }

  /**
   * Deserializa el método IDEE.style.Simple.deserialize.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @function
   * @public
   * @return {Function} Devuelve la función IDEE.style.Simple.deserialize.
   * @api
   */
  getDeserializedMethod_() {
    return "((serializedParameters) => IDEE.style.Simple.deserialize(serializedParameters, 'IDEE.style.Polygon'))";
  }

  /**
   * Este método clona el estilo.
   *
   * @public
   * @return {IDEE.style.Polygon} Devuelve un "new Polygon".
   * @function
   * @api
   */
  clone() {
    const optsClone = {};
    extendsObj(optsClone, this.options_);
    return new this.constructor(optsClone);
  }
}

/**
 * Estilos por defecto.
 * @const
 * @type {object}
 * @public
 * @api
 */
Polygon.DEFAULT_NULL = {
  fill: {
    color: 'rgba(255, 255, 255, 0.4)',
    opacity: 0.4,
  },
  stroke: {
    color: '#3399CC',
    width: 1.5,
  },
};

export default Polygon;
