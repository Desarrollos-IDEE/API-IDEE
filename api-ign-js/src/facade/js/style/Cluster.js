/**
 * @module M/style/Cluster
 */
import ClusterImpl from 'impl/style/Cluster';
import Style from './Style';
import Composite from './Composite';
import {
  isNullOrEmpty, extendsObj, stringifyFunctions, defineFunctionFromString,
} from '../util/Utils';

/**
 * @classdesc
 * Crea un grupo de estilo
 * con parámetros especificados por el usuario.
 * @api
 * @extends {M.style.Composite}
 */
class Cluster extends Composite {
  /**
   * Constructor principal de la clase.
   * @constructor
   * @extends {M.Style}
   * @param {object} options Parámetros de los estilos del "cluster".
   * - ranges: Matriz de objetos con el valor mínimo, el máximo y un M.style.Point.
   * - animated: Indica si se quiere animación o no al desplegar
   * el "cluster".
   * - hoverInteraction: Indica si se quiere mostrar el polígono que
   * engloba los elementos al situarse sobre el "cluster".
   * - selectInteraction: Indica si se quiere que al pinchar en un "cluster"
   * se abra el abanico de puntos o no, por defecto verdadero.
   * - displayAmount: Indica si se muestra el número de elementos
   * que componen el "cluster".
   * - maxFeaturesToSelect: Número máximo de elementos agrupados a partir de los cuales,
   * al hacer click, se hará zoom en lugar de desplegar el "cluster".
   * - distance: Distancia (en píxeles) de agrupación de elementos.
   * - label: Estilo opcional de la etiqueta de número de elementos de
   * todos los rangos, si se muestra.
   * @param {object} optsVendor Opciones que se pasarán a la librería base.
   * - animationDuration: Duración de la animación.
   * - animationMethod: Método que realiza la animación.
   * - distanceSelectFeatures: Distancia de selección de los objetos geográficos.
   * - convexHullStyle: Estilo de casco convexo.
   * @api
   */
  constructor(options = {}, optsVendor = {}) {
    const impl = new ClusterImpl(options, optsVendor);

    // calls the super constructor
    super(options, impl);

    extendsObj(options, Cluster.DEFAULT);
    extendsObj(optsVendor, Cluster.DEFAULT_VENDOR);

    /**
     * @private
     * @type {Object}
     */
    this.optsVendor_ = optsVendor;

    /**
     * @private
     * @type {Object}
     */
    this.oldStyle_ = null;
  }

  /**
   * Añade los estilos "cluster" a la capa.
   * @public
   * @param {M.layer} layer Capa.
   * @function
   * @api
   */
  apply(layer) {
    super.apply(layer);
    const style = layer.getStyle();
    this.oldStyle_ = style instanceof Cluster ? style.getOldStyle() : style;
  }

  /**
   * Quita los estilos de la capa utilizando el método heredado.
   * @public
   * @param {M.layer} layer Capa.
   * @function
   * @api
   */
  unapplySoft(layer) {
    this.getImpl().unapply();
  }

  /**
   * Añade los estilos utilizando el método heredado.
   * @public
   * @param {Object} styles Estilos.
   * @function
   * @api
   */
  add(styles) {
    if (!isNullOrEmpty(this.layer_)) {
      this.unapplySoft(this.layer_);
    }
    return super.add(styles);
  }

  /**
   * Aplica los estilos a la capas internas.
   *
   * @function
   * @public
   * @param {M.layer.Vector} layer Capas.
   * @api
   */
  applyInternal(layer) {
    this.layer_ = layer;
    this.getImpl().applyToLayer(layer);
    this.updateCanvas();
  }

  /**
   * Devuelve los estilos antiguos.
   * @function
   * @public
   * @return {M.Style} Estilos.
   * @api
   */
  getOldStyle() {
    return this.oldStyle_;
  }

  /**
   * Devuelve el rango.
   *
   * @function
   * @public
   * @return {Array<Object>} Rango.
   * @api
   */
  getRanges() {
    return this.options_.ranges;
  }

  /**
   * Devuelve las opciones del "cluster".
   * @function
   * @public
   * @return {object} Optiones del "cluster".
   * @api
   */
  getOptions() {
    return this.options_;
  }

  /**
   * Modifica el rango.
   *
   * @function
   * @public
   * @param {Array<Object>} newRanges Nuevo rango.
   * @return {Cluster} Devuelve "this" (objeto de la clase).
   * @api
   */
  setRanges(newRanges) {
    this.getImpl().ranges = newRanges;
    this.unapply(this.layer_);
    this.layer_.style = this;
    return this;
  }

  /**
   * Este método devuelve el rango.
   *
   * @function
   * @public
   * @param {number} min Valor mínimo del intervalo.
   * @param {number} max Valor máximo del intervalo.
   * @return {Object} Devuelve el rango.
   * @api
   */
  getRange(min, max) {
    return this.options_.ranges.find((el) => (el.min === min && el.max === max));
  }

  /**
   * Este método actualiza el rango.
   *
   * @function
   * @public
   * @param {number} min Valor mínimo del intervalo.
   * @param {number} max Valor máximo del intervalo.
   * @param {number} newRange Nuevo rango.
   * @return {Cluster} Devuelve "this" (objeto de la clase).
   * @api
   */
  updateRange(min, max, newRange) {
    ClusterImpl.updateRangeImpl(min, max, newRange, this.layer_, this);
    this.unapply(this.layer_);
    this.layer_.style = this;
    return this;
  }

  /**
   * Este método añade la animación.
   *
   * @function
   * @public
   * @param {boolean} animated Define si tendrá animación.
   * @return {Cluster}
   * @api
   */
  setAnimated(animated) {
    return this.getImpl().setAnimated(animated, this.layer_, this);
  }

  /**
   * Define si es posible la animación.
   *
   * @function
   * @public
   * @return {boolean} Define si es posible la animación.
   * @api
   */
  isAnimated() {
    return this.options_.animated;
  }

  /**
   * Este método transforma un "canvas" a base64.
   *
   * @function
   * @protected
   * @return {String} Base64.
   */
  toImage() {
    let base64Img;
    if (this.oldStyle_ instanceof Style) {
      base64Img = this.oldStyle_.toImage();
    } else {
      base64Img = super.toImage();
    }
    return base64Img;
  }

  /**
   * Este método actualiza los estilos de la capa.
   *
   * @public
   * @function
   * @api
   */
  refresh() {
    if (!isNullOrEmpty(this.layer_)) {
      const layer = this.layer_;
      this.unapply(this.layer_);
      this.apply(layer);
      this.updateCanvas();
    }
  }

  /**
   * Define el orden del estilo, 4.
   * @constant
   * @public
   * @api
   */
  get ORDER() {
    return 4;
  }

  /**
   * Agregue la interacción y la capa seleccionadas para ver las características del clúster.
   *
   * @public
   * @function
   * @api
   */
  addSelectInteraction() {
    this.getImpl().addSelectInteraction();
  }

  /**
   * Eliminar la interacción y la capa seleccionadas para ver las características del clúster.
   *
   * @public
   * @function
   * @api
   */
  removeSelectInteraction() {
    this.getImpl().removeSelectInteraction();
  }

  /**
   * Esta función implementa el mecanismo para
   * generar el JSON de esta instancia.
   *
   * @public
   * @return {object} Devuelve parámetros y el método para deserializar.
   * @function
   * @api
   */
  toJSON() {
    let options = extendsObj({}, this.getOptions());
    options.ranges = this.getRanges().map((r) => {
      const range = extendsObj({}, r);
      range.style = r.style.serialize();
      return range;
    });
    options = stringifyFunctions(options);
    let optsVendor = extendsObj({}, this.optsVendor_);
    optsVendor = stringifyFunctions(optsVendor);
    const compStyles = this.getStyles().map((style) => style.serialize());

    const parameters = [options, optsVendor, compStyles];
    const deserializedMethod = 'M.style.Cluster.deserialize';
    return { parameters, deserializedMethod };
  }

  /**
   * Esta método de la clase devuelve la instancia de estilo de la serialización.
   * @function
   * @public
   * @param {Array} parametrers Parámetros para deserializar
   * ("serializedOptions", "serializedVendor", "serializedCompStyles").
   * @return {M.style.Cluster} Devuelve el estilo del "cluster" deserializado.
   */
  static deserialize([serializedOptions, serializedVendor, serializedCompStyles]) {
    let options = serializedOptions;
    options.ranges.forEach((r) => {
      const range = r;
      range.style = Style.deserialize(r.style);
    });
    options = defineFunctionFromString(serializedOptions);
    const vendors = defineFunctionFromString(serializedVendor);
    /* eslint-disable */
    const styleFn = new Function(['options', 'optsVendor'], `return new M.style.Cluster(options, optsVendor)`);
    /* eslint-enable */
    const deserializedStyle = styleFn(options, vendors);

    const compStyles = serializedCompStyles.map((serializedStyle) => Style
      .deserialize(serializedStyle));
    deserializedStyle.add(compStyles);

    return deserializedStyle;
  }
}

/**
 * Estilos por defecto del "cluster".
 * @const
 * @type {object}
 * @public
 * @api
 */
Cluster.DEFAULT = {
  ranges: [],
  hoverInteraction: true,
  displayAmount: true,
  selectInteraction: true,
  distance: 60,
  animated: true,
  maxFeaturesToSelect: 15,
  label: {
    text: (feature) => {
      let text;
      const cluseterFeatures = feature.getAttribute('features');
      if (cluseterFeatures.length) {
        text = cluseterFeatures.length.toString();
      }
      return text;
    },
    color: '#fff',
    font: 'bold 15px Arial',
    baseline: 'middle',
    align: 'center',
  },
};

/**
 * Estilos por defecto del "vendor".
 * @const
 * @type {object}
 * @public
 * @api
 */
Cluster.DEFAULT_VENDOR = {
  animationDuration: 250,
  animationMethod: 'linear',
  distanceSelectFeatures: 15,
  convexHullStyle: {
    fill: {
      color: '#fff',
      opacity: 0.25,
    },
    stroke: {
      // color: '#425f82'
      color: '#7b98bc',
    },
  },
};

/**
 * Estilo por defecto del rango 1.
 * @const
 * @type {object}
 * @public
 * @api
 */
Cluster.RANGE_1_DEFAULT = {
  fill: {
    color: '#81c89a',
  },
  stroke: {
    color: '#6eb988',
    width: 3,
  },
  radius: 15,
};

/**
 * Estilo por defecto del rango 2.
 * @const
 * @type {object}
 * @public
 * @api
 */
Cluster.RANGE_2_DEFAULT = {
  fill: {
    color: '#85b9d2',
  },
  stroke: {
    color: '#6da4be',
    width: 3,
  },
  radius: 20,
};

/**
 * Estilo por defecto del rango 3.
 * @const
 * @type {object}
 * @public
 * @api
 */
Cluster.RANGE_3_DEFAULT = {
  fill: {
    color: '#938fcf',
  },
  stroke: {
    color: '#827ec5',
    width: 3,
  },
  radius: 25,
};

export default Cluster;
