/**
 * @module IDEE/style/FlowLine
 */
import StyleFlowLineImpl from 'impl/style/FlowLine';
import Simple from './Simple';
import {
  isNullOrEmpty, extendsObj, isObject, isUndefined,
} from '../util/Utils';
import Exception from '../exception/exception';
import { getValue } from '../i18n/language';

/**
 * @classdesc
 * Crea un estilo de línea de flujo
 * con parámetros especificados por el usuario.
 * @api
 * @extends {IDEE.style.Simple}
 */
class FlowLine extends Simple {
  /**
   * Constructor principal de la clase.
   * @constructor
   * @param {options} userParameters Parámetros.
   * - color: Color.
   * - arrowColor: Color de la flecha.
   * - width: Ancho.
   * - arrow: Flecha.
   * - lineCap: Linea.
   * - offset: Fuera del conjunto.
   * @api
   */
  constructor(optionsVar) {
    let options = optionsVar;
    if (isNullOrEmpty(options)) {
      options = FlowLine.DEFAULT_NULL;
    }
    options = extendsObj({}, options);

    if (isUndefined(StyleFlowLineImpl) || (isObject(StyleFlowLineImpl)
      && isNullOrEmpty(Object.keys(StyleFlowLineImpl)))) {
      Exception(getValue('exception').flowline_method);
    }
    const impl = new StyleFlowLineImpl(options);
    super(options, impl);
  }

  /**
   * Este método elimina el estilo.
   *
   * @function
   * @protected
   * @param {IDEE.layer.Vector} layer Capa.
   * @api
   */
  unapply(layer) {
    this.getImpl().unapply(layer);
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
    return "((serializedParameters) => IDEE.style.Simple.deserialize(serializedParameters, 'IDEE.style.FlowLine'))";
  }
}

/**
 * Estilo por defecto.
 * @const
 * @type {object}
 * @public
 * @api
 */
FlowLine.DEFAULT_NULL = {
  color: 'red',
  color2: 'yellow',
  arrowColor: '',
  width: 2,
  width2: 25,
  arrow: 0,
  lineCap: 'butt',
};

export default FlowLine;
