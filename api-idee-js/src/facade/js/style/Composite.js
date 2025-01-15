/**
 * @module M/style/Composite
 */
import StyleBase from './Style';
import { isArray, isNullOrEmpty, styleComparator } from '../util/Utils';
// import StyleCluster from './Cluster';
// import StyleProportional from './Proportional';
/**
 * @classdesc
 * Clase que crea estilos compuestos.
 * @api
 * @extends {M.style}
 */
class Composite extends StyleBase {
  /**
   * Constructor principal de la clase.
   * @constructor
   * @param {Object} options Parámetros.
   * - Las opciones dependen de la clase estilo hija que lo llame
   * @param {Object} impl Implementación.
   * @api
   */
  constructor(options, impl) {
    // calls the super constructor
    super(options, impl);
    /**
     * Array of styles.
     * @type {Array<M.Style>}
     */
    this.styles_ = [];
  }

  /**
   * Este método aplica el estilo.
   *
   * @public
   * @param {M.layer.Vector} layer Capa.
   * @function
   * @api
   */
  apply(layer) {
    this.layer_ = layer;
    if (!isNullOrEmpty(layer)) {
      // const style = layer.getStyle();
      // this.oldStyle_ = style;
      this.updateInternal_(layer);
    }
  }

  /**
   * Este método añade el estilo.
   *
   * @public
   * @function
   * @param {M.style|Array<M.Style>} stylesParam Estilos.
   * @returns {M.style.Composite} Devuelve "this".
   * @api
   */
  add(stylesParam) {
    let styles = stylesParam;
    const layer = this.layer_;
    this.unapplyInternal(this.layer_);
    if (!isArray(styles)) {
      styles = [styles];
    }
    styles = styles.filter((style) => style.constructor !== this.constructor);
    styles.forEach((style) => {
      this.styles_ = this.styles_.filter((s) => s.constructor !== style.constructor);
    });
    this.styles_ = this.styles_.concat(styles);
    if (!isNullOrEmpty(layer)) {
      this.updateInternal_(layer);
    }
    return this;
  }

  /**
   * Este método elimina el estilo.
   *
   * @public
   * @function
   * @param {M.style|Array<M.Style>} stylesParam Estilo.
   * @api
   */
  remove(stylesParam) {
    let styles = stylesParam;
    const layer = this.layer_;
    if (!isArray(styles)) {
      styles = [styles];
    }
    if (!isNullOrEmpty(this.layer_)) {
      this.unapplyInternal(this.layer_);
    }
    this.styles_ = this.styles_.filter((style) => !styles.includes(style));
    layer.setStyle(this.oldStyle_, true);
    layer.setStyle(this);
  }

  /**
   * Este método devuelve el estilo.
   *
   * @function
   * @public
   * @return {Array<M.Style>} Estilo.
   * @api
   */
  getStyles() {
    return this.styles_;
  }

  /**
   * Este método devuelve el estilo antiguo.
   *
   * @function
   * @public
   * @return {M.Style} Estilo antiguo.
   * @api
   */
  getOldStyle() {
    return this.oldStyle_;
  }

  /**
   * Este método elimina el estilo añadido.
   * @function
   * @public
   * @api
   */
  clear() {
    this.remove(this.styles_);
  }

  /**
   * Este método añade el estilo de forma interna.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @function
   * @public
   * @param {M.layer.Vector} layer Capa.
   * @api
   */
  unapplyInternal(layer) {
    const styles = this.styles_.concat(this)
      .sort((style, style2) => styleComparator(style2, style));
    styles.forEach((style) => {
      if (style instanceof Composite) {
        style.unapplySoft(layer);
      }
    });
  }

  /**
   * Este método quita el estilo "soft".
   * @function
   * @public
   * @param {M.layer.Vector} layer Capa.
   * @api
   */
  unapplySoft(layer) {}

  /**
   * Desaplica el estilo de la capa.
   * @function
   * @public
   * @param {M.layer.Vector} layer Capa.
   * @api
   */
  unapply(layer) {
    this.unapplyInternal(layer);
    this.layer_ = null;
  }

  /**
   * Se actualiza el estilo la capa interna.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @function
   * @public
   * @param {M.layer.Vector} layer Capa.
   * @api
   */
  updateInternal_(layer) {
    const styles = this.styles_.concat(this)
      .sort((style, style2) => styleComparator(style, style2));
    styles.forEach((style) => {
      if (style instanceof Composite) {
        style.applyInternal(layer);
      } else if (style instanceof StyleBase) {
        style.apply(layer, true);
      }
    });
  }
}
export default Composite;
