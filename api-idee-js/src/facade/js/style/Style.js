/**
 * @module M/Style
 */
import Base from '../Base';
import {
  isArray, isNullOrEmpty, isObject, extendsObj, stringifyFunctions,
} from '../util/Utils';
import * as EventType from '../event/eventtype';

/**
 * @classdesc
 * Clase principal que gestiona los estilos, de esta heredan
 * los estilos de los objetos geográficos, ...
 * @api
 * @extends {M.Base}
 */
class Style extends Base {
  /**
   * Constructor principal de la clase.
   * @constructor
   * @param {Object} options Opciones de la clase.
   * - icon (src): Ruta del icono.
   * @param {Object} impl Implementación.
   * @api
   */
  constructor(options, impl) {
    // call super constructor
    super(impl);

    /**
     * Opciones de usuario para este estilo.
     */
    this.options_ = options;

    /**
     * El elemento canva para dibujar el estilo
     * en un conmutador de capas.
     */
    this.canvas_ = document.createElement('canvas');

    /**
     * La promesa updateCanvas que gestiona la
     * solicitud asíncrona con iconos.
     */
    this.updateCanvasPromise_ = null;

    /**
     * Capa a la que se aplica este estilo.
     */
    this.layer_ = null;
  }

  /**
   * Devuelve el "canvas".
   * @public
   * @function
   * @return {HTMLCanvasElement} Elemento "canvas".
   * @api
   */
  get canvas() {
    return this.canvas_;
  }

  /**
   * Este método aplica los estilos a la capa.
   *
   * @public
   * @param {M.layer.Vector} layer Capa.
   * @function
   * @api
   */
  apply(layer) {
    this.layer_ = layer;
    this.getImpl().applyToLayer(layer);
    this.updateCanvas();
  }

  /**
   * Este método quita los estilos de la capa.
   *
   * @function
   * @protected
   * @param {M.layer.Vector} layer Capa.
   * @api
   */
  unapply(layer) {}

  /**
   * Este método devuelve los valores de los atributos indicados.
   *
   * @function
   * @public
   * @param {String} attribute Atributo para saber el valor.
   * @return {Object} Valor del attributo.
   */
  get(attribute) {
    let attrValue;
    attrValue = this.options_[attribute];
    if (isNullOrEmpty(attrValue)) {
      const attrPath = attribute.split('.');
      if (attrPath.length > 1) {
        attrValue = attrPath.reduce((obj, attr) => {
          let value;
          if (!isNullOrEmpty(obj)) {
            value = obj[attr];
            if (obj instanceof Style) {
              value = obj.get(attr);
            }
          }
          return value;
        }, this);
      }
    }
    return attrValue;
  }

  /**
   * Este método  establece el valor de la propiedad y aplica una nueva propiedad.
   *
   * @public
   * @param {String} property Propiedad para cambiar el valor.
   * @param {String} value Valor de la propiedad.
   * @return {M.Style} Devuelve this.
   * @function
   * @api
   */

  set(property, value) {
    const oldValue = this.get(property);
    Style.setValue(this.options_, property, value);
    if (!isNullOrEmpty(this.layer_)) {
      this.getImpl().updateFacadeOptions(this.options_);
    }
    if (!isNullOrEmpty(this.feature_)) {
      this.applyToFeature(this.feature_);
    }
    this.fire(EventType.CHANGE, [property, oldValue, value]);
    this.refresh();
    return this;
  }

  /**
   * Este método de la clase establece el valor de la propiedad.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @public
   * @param {Object} objPara Estilos.
   * @param {String} path Ruta de la propiedad.
   * @param {String} value Valor de la propiedad.
   * @function
   */
  static setValue(objPara, path, valueVar) {
    let value = valueVar;
    const obj = objPara;
    const keys = isArray(path) ? path : path.split('.');
    const keyLength = keys.length;
    const key = keys[0];
    if (keyLength === 1) { // base case
      if (isArray(value)) {
        value = [...value];
      } else if (isObject(value)) {
        value = { ...value };
      }
      obj[key] = value;
    } else if (keyLength > 1) { // recursive case
      if (isNullOrEmpty(obj[key])) {
        obj[key] = {};
      }
      Style.setValue(obj[key], keys.slice(1, keyLength), value);
    }
  }

  /**
   * Este método actualiza el estilo de la
   * capa.
   *
   * @public
   * @function
   * @param {Object} layer Capa.
   * @api
   */
  refresh(layer = null) {
    if (!isNullOrEmpty(layer)) {
      this.layer_ = layer;
    }
    if (!isNullOrEmpty(this.layer_)) {
      this.apply(this.layer_);
      this.updateCanvas();
      /** /if (!isNullOrEmpty(this.layer_.getImpl().getMap())) {
        const layerswitcher = this.layer_.getImpl().getMap().getControls('layerswitcher')[0];
        if (!isNullOrEmpty(layerswitcher)) {
          layerswitcher.render();
        }
      } */
    }
  }

  /**
   * Este método obtiene el estilo de opciones.
   *
   * @function
   * @public
   * @return {object}
   * @api
   */
  getOptions() {
    return this.options_;
  }

  /**
   * Este método transforma los datos de una url a canvas.
   *
   * @function
   * @public
   * @return {String} URL.
   */
  toImage() {
    let styleImgB64;

    if (isNullOrEmpty(this.updateCanvasPromise_)) {
      if (!isNullOrEmpty(this.options_.icon)
        && !isNullOrEmpty(this.options_.icon.src)) {
        const image = new Image();
        image.crossOrigin = 'Anonymous';
        const can = this.canvas_;
        image.onload = () => {
          const c = can;
          const ctx = c.getContext('2d');
          ctx.drawImage(this, 0, 0, 50, 50);
        };
        image.src = this.options_.icon.src;
        styleImgB64 = this.canvas_.toDataURL('png');
      } else {
        styleImgB64 = this.canvas_.toDataURL('png');
      }
    } else {
      styleImgB64 = this.updateCanvasPromise_.then(() => this.canvas_.toDataURL('png'));
    }

    return styleImgB64;
  }

  /**
   * Este método actualiza los estilos del canvas.
   *
   * @public
   * @function
   * @api
   */
  updateCanvas() {
    this.updateCanvasPromise_ = this.getImpl().updateCanvas(this.canvas_);
  }

  /**
   * Compara que esta clase sea igual a otro objeto.
   * @public
   * @function
   * @param {Object} Style Objeto que se quiere comparar.
   * @api
   */
  equals(style) {
    return (this.constructor === style.constructor);
  }

  /**
   * Este método clona los estilos.
   *
   * @public
   * @return {M.Style} Devuelve un "new Style".
   * @function
   * @api
   */
  clone() {
    const optsClone = {};
    extendsObj(optsClone, this.options_);
    const ImplClass = this.getImpl().constructor;
    const implClone = new ImplClass(optsClone);
    return new this.constructor(optsClone, implClone);
  }

  /**
   * Este método implementa el mecanismo para
   * generar el JSON de esta instancia.
   *
   * @public
   * @return {object}
   * @function
   * @api
   */
  toJSON() {
    const parameters = [stringifyFunctions(this.getOptions())];
    const deserializedMethod = this.getDeserializedMethod_();
    return { parameters, deserializedMethod };
  }

  /**
   * Serializa los estilos.
   *
   * @function
   * @return {String} Estilo serializado.
   * @api
   * @public
   */
  serialize() {
    return window.btoa(unescape(encodeURIComponent(JSON.stringify(this))));
  }

  /**
   * Este método de la clase devuelve la instancia de estilo de la serialización.
   * @function
   * @public
   * @param {string} serializedStyle Estilo serializado.
   * @return {M.Style}
   */
  static deserialize(encodedSerializedStyle) {
    const serializedStyle = decodeURIComponent(escape(window.atob(encodedSerializedStyle.replace(' ', '+'))));
    const { parameters, deserializedMethod } = JSON.parse(serializedStyle);
    /* eslint-disable */
    return (new Function("serializedParams", `return ${deserializedMethod}(serializedParams)`))(parameters);
    /* eslint-enable */
  }
}

export default Style;
