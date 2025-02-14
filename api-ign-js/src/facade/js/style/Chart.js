/**
 * @module M/style/Chart
 */
import ChartImpl from 'impl/style/Chart';
import StyleFeature from './Feature';
import ChartVariable from '../chart/Variable';
import * as ChartTypes from '../chart/types';
import {
  isArray, isNullOrEmpty, extendsObj, stringifyFunctions, defineFunctionFromString,
} from '../util/Utils';

/**
 * @classdesc
 * Crea un estilo de gráfico
 * con parámetros especificados por el usuario.
 * @api
 * @extends {M.style.Feature}
 */
class Chart extends StyleFeature {
  /**
   * Constructor principal de la clase.
   *
   * @constructor
   * @param {Mx.ChartOptions} optsVar Opciones de la clase.
   *  - type: El tipo de gráfico.
   *  - radius: Si el tipo de gráfico es 'barra', escriba este campo
   *           limitará la altura máxima de la barra
   *  - offsetX: Desplazamiento del eje x del gráfico.
   *  - offsetY: Desplazamiento del eje y del gráfico.
   *  - stroke.
   *      - color: El color del trazo del gráfico.
   *      - width: El ancho del trazo del gráfico.
   *  - fill3DColor: El color de relleno del cilindro PIE_3D
   *  - scheme: Color del esquema.
   *  - rotateWithView: Determinar si el simbolizador rota con el mapa.
   *  - variables: Valores de la clase.
   * @api
   */
  constructor(optsVar = {}) {
    const options = optsVar;
    const variables = options.variables || null;

    // vars parsing
    if (!Object.values(ChartTypes.types).includes(options.type)) {
      options.type = Chart.DEFAULT.type;
    }
    if (!isNullOrEmpty(variables)) {
      if (variables instanceof Array) {
        options.variables = variables
          .filter((variable) => variable != null).map((variable) => Chart.formatVariable(variable));
      } else if (typeof variables === 'string' || typeof variables === 'object') {
        options.variables = [Chart.formatVariable(variables)];
      } else {
        options.variables = [];
      }
    }

    // scheme parsing
    // if scheme is null we will set the default theme
    if (isNullOrEmpty(options.scheme)) {
      options.scheme = Chart.DEFAULT.scheme;
      // if is a string we will check if its custom (take values from variables) or a existing theme
    } else if (typeof options.scheme === 'string') {
      // NOTICE THAT } else if (options.scheme instanceof String) { WONT BE TRUE
      const someNotNull = options.variables.some((variable) => variable.fillColor != null);
      if (options.scheme === ChartTypes.schemes.Custom && someNotNull) {
        options.scheme = options.variables
          .map((variable) => (variable.fillColor ? variable.fillColor : ''));
      } else {
        options.scheme = ChartTypes.schemes[options.scheme] || Chart.DEFAULT.scheme;
      }
      // if is an array of string we will set it directly
    } else if (!(options.scheme instanceof Array && options.scheme.every((el) => typeof el === 'string'))) {
      options.scheme = Chart.DEFAULT.scheme;
    }

    const impl = new ChartImpl(options);
    // calls the super constructor
    super(options, impl);
  }

  /**
   * Método de la clase, define el formato de la variable "chart" creado con "new Chart".
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @param {Chart.Variable|string|object} variableOb Valores.
   * @public
   * @function
   * @return {Chart.Variable} Variable.
   * @api
   */
  static formatVariable(variableOb) {
    if (variableOb == null) {
      return null;
    }
    if (variableOb instanceof ChartVariable) {
      return variableOb;
    }
    let constructorOptions;
    if (typeof variableOb === 'string') {
      constructorOptions = {
        attribute: variableOb,
      };
    } else {
      constructorOptions = variableOb;
    }
    return new ChartVariable(constructorOptions);
  }

  /**
   * Este método actualiza el "canvas".
   *
   * @function
   * @public
   * @api
   */
  updateCanvas() {
    if (!(isNullOrEmpty(this.getImpl()) && isNullOrEmpty(this.canvas_))) {
      this.getImpl().updateCanvas(this.canvas_);
    }
  }

  /**
   * Este método añade el estilo a los objetos geográficos y
   * acualiza el "canvas".
   *
   * @function
   * @public
   * @param {Object} layer Capa.
   * @api
   */
  apply(layer) {
    this.layer_ = layer;
    layer.getFeatures().forEach((feature) => feature.setStyle(this.clone()));
    this.updateCanvas();
  }

  /**
   * Este método devuelve el orden del estilo.
   * @constant
   * @public
   * @return {number} Orden del estilo.
   * @api
   */
  get ORDER() {
    return 1;
  }

  /**
   * Este método crea un objeto con los parámetros y los valores desearializados.
   *
   * @public
   * @return {Object} Parámetros y los valores desearializados.
   * @function
   * @api
   */
  toJSON() {
    const options = this.getOptions();
    const serializedOptions = {
      type: options.type,
      radius: options.radius,
      donutRadio: options.donutRadio,
      offsetX: options.offsetX,
      offsetY: options.offsetY,
      stroke: isNullOrEmpty(options.stroke) ? undefined : extendsObj({}, options.stroke),
      fill3DColor: options.fill3DColor,
      scheme: isArray(options.scheme) ? [...options.scheme] : options.scheme,
      label: isNullOrEmpty(options.label) ? undefined : extendsObj({}, options.label),
      rotateWithView: options.rotateWithView,
      variables: options.variables.map((variable) => {
        let label;
        if (!isNullOrEmpty(variable.label)) {
          label = extendsObj({}, variable.label);
          label = stringifyFunctions(label);
        }
        return {
          attribute: variable.attribute,
          legend: variable.legend,
          fill: variable.fillColor,
          label,
        };
      }),
    };

    const parameters = [serializedOptions];
    const deserializedMethod = 'M.style.Chart.deserialize';
    return { parameters, deserializedMethod };
  }

  /**
   * Este método de la clase deserializa el estilo.
   * @function
   * @public
   * @param {Array} serializedOptions Estilos.
   * @return {M.style.Simple} "new M.style.Chart".
   */
  static deserialize([serializedOptions]) {
    const options = serializedOptions;
    options.variables = serializedOptions.variables
      .map((variableOpt) => new ChartVariable(defineFunctionFromString(variableOpt)));
    /* eslint-disable */
    const styleFn = new Function(['options'], `return new M.style.Chart(options)`);
    /* eslint-enable */
    return styleFn(options);
  }
}

/**
 * Valores por defecto.
 *
 * @const
 * @type {object}
 * @public
 * @api
 */
Chart.DEFAULT = {
  shadow3dColor: '#369',
  type: ChartTypes.types.PIE,
  scheme: ChartTypes.schemes.Classic,
  radius: 20,
  donutRatio: 0.5,
  offsetX: 0,
  offsetY: 0,
  animationStep: 1,
};

export default Chart;
