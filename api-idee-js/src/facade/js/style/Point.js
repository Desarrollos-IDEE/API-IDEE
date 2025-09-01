/**
 * @module IDEE/style/Point
 */
import StylePointImpl from 'impl/style/Point';
import Simple from './Simple';
import {
  isNullOrEmpty, extendsObj, isArray,
} from '../util/Utils';

/**
 * @classdesc
 * Crea un punto de estilo.
 * @api
 * @extends {IDEE.style.Simple}
 */
class Point extends Simple {
  /**
   * Constructor principal de la clase.
   * @constructor
   * @param {Object} optionsVar Opciones de los estilos.
   * - fill: Color de fondo.
   * - stroke: Color del borde.
   * - icon: URL.
   * - heightReference: Posición relativa al terreno. Solo disponible para Cesium.
   * @param {Object} vendorOptions Opciones de proveedor para la biblioteca base.
   * @api
   */
  constructor(optionsVar, vendorOptions) {
    let options = optionsVar;
    let vendorOpts = vendorOptions;
    if (!isNullOrEmpty(vendorOpts)) {
      options = extendsObj({}, Point.DEFAULT);
    } else {
      vendorOpts = null;
      if (isNullOrEmpty(options)) {
        options = Point.DEFAULT_NULL;
      } else {
        options = extendsObj(options, Point.DEFAULT);
      }
      options = extendsObj({}, options);
    }

    const impl = new StylePointImpl(options, vendorOpts);
    super(options, impl);
  }

  /**
   * Transforma el "canvas" a imagen.
   *
   * @function
   * @public
   * @returns {Object} Devuelve la imagen del "canvas".
   * @api
   */
  toImage() {
    return this.getImpl().toImage(this.canvas_);
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
    return "((serializedParameters) => IDEE.style.Simple.deserialize(serializedParameters, 'IDEE.style.Point'))";
  }

  /**
   * Este método clona el estilo.
   *
   * @public
   * @return {IDEE.style.Point} Devuelve un "new Point".
   * @function
   * @api
   */
  clone() {
    const optsClone = {};
    let vendorOptsClone = {};
    const vendorOpts = this.getImpl().vendorOptions;
    extendsObj(optsClone, this.options_);
    if (!isNullOrEmpty(vendorOpts)) {
      if (isArray(vendorOpts)) {
        vendorOptsClone = vendorOpts.map((vo) => vo.clone());
      } else {
        vendorOptsClone = vendorOpts.clone();
      }
    }
    return new this.constructor(optsClone, vendorOptsClone);
  }
}

/**
 * Radio por defecto, 5.
 * @const
 * @type {object}
 * @public
 * @api
 */
Point.DEFAULT = {
  radius: 5,
};

/**
 * Valores por defecto.
 * @const
 * @type {object}
 * @public
 * @api
 */
Point.DEFAULT_NULL = {
  fill: {
    color: 'rgba(255, 255, 255, 0.4)',
    opacity: 0.4,
  },
  stroke: {
    color: '#3399CC',
    width: 1.5,
  },
  radius: 5,
};

/**
 * Este método devuelve el nombre de las fuentes disponibles.
 * @function
 * @public
 * @return {Object} Devuelve la fuentes.
 * @api
 */
Point.getFonts = () => {
  return StylePointImpl.getFonts();
};

/**
 * Este método devuelve los iconos disponibles para una fuente.
 * @function
 * @api
 * @public
 * @param { String } name Nombre de la fuente.
 * @return {Object} Devuelve la fuente.
 */
Point.getFontsIcons = (name) => {
  return StylePointImpl.getFontsIcons(name);
};

export default Point;
