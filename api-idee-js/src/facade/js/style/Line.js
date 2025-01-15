/**
 * @module M/style/Line
 */
import StyleLineImpl from 'impl/style/Line';
import Simple from './Simple';
import { isNull, extendsObj } from '../util/Utils';

/**
 * @classdesc
 * Crea un estilo de línea
 * con parámetros especificados por el usuario.
 * @api
 * @extends {M.style.Simple}
 */
class Line extends Simple {
  /**
   * Constructor principal de la clase.
   * @constructor
   * @param {options} optionsVar Parámetros de la implementación.
   * - stroke. Borde.
   *    - width: Ancho.
   *    - pattern: Propiedades ("name", "src", "color", "size", "spacing",
   * "rotation", "scale", "offset").
   *    - linedash: Línea de guión.
   *    - linejoin: Líneas unidas.
   *    - linecap: Límite de la línea.
   * - label: Etiqueta.
   *    - rotate: Rotación.
   *    - offset: Desplazamiento.
   *    - stroke: Borde, propiedades ("color", "width", "linecap", "linejoin", "linedash").
   * - fill: Color del relleno.
   *    - color: Color.
   *    - opacity: Opacidad.
   *    - pattern: Propiedades (name, src, color, size, spacing, rotation, scale, offset)
   * @param {Object} vendorOptions Opciones de proveedor para la biblioteca base.
   * @api
   */
  constructor(optionsVar, vendorOptions) {
    let options = optionsVar;
    if (vendorOptions) {
      options = {};
    } else {
      if (isNull(options) || Object.keys(options).length === 0) {
        options = Line.DEFAULT_NULL;
      }
      options = extendsObj({}, options);
    }

    const impl = new StyleLineImpl(options, vendorOptions);
    super(options, impl);
  }

  /**
   * Este método quita el estilo.
   *
   * @function
   * @protected
   * @param {M.layer.Vector} layer Capa.
   * @api
   */
  unapply(layer) {
    this.getImpl().unapply(layer);
  }

  /**
   * Deserializa el método M.style.Simple.deserialize.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @function
   * @public
   * @return {Function} Devuelve la función M.style.Simple.deserialize.
   * @api
   */
  getDeserializedMethod_() {
    return "((serializedParameters) => M.style.Simple.deserialize(serializedParameters, 'M.style.Line'))";
  }

  /**
   * Este método clona el estilo.
   *
   * @public
   * @return {M.style.Line} Devuelve un "new Line".
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
 * Estilo por defecto.
 * @const
 * @type {object}
 * @public
 * @api
 */
Line.DEFAULT_NULL = {
  fill: {
    color: 'rgba(255, 255, 255, 0.4)',
    opacity: 0.4,
  },
  stroke: {
    color: '#3399CC',
    width: 1.5,
  },
};

export default Line;
