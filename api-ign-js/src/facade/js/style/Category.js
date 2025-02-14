/**
 * @module M/style/Category
 */
import StyleBase from './Style';
import Composite from './Composite';
import {
  isArray, isNullOrEmpty, extendsObj, getImageSize, stringifyFunctions, defineFunctionFromString,
} from '../util/Utils';
import Exception from '../exception/exception';
import StyleProportional from './Proportional';
import StyleCluster from './Cluster';
import Utils from './utils';
import { getValue } from '../i18n/language';

/**
 * @classdesc
 * Crea un estilo de categoría
 * con parámetros especificados por el usuario.
 * @api
 * @extends {M.style.Composite}
 */
class Category extends Composite {
  /**
   * Constructor principal de la clase.
   *
   * @constructor
   * @param {String} attributeName Nombre del atributo de la categoría.
   * @param {object} categoryStyles Un objeto que relaciona categoría con un estilo.
   * @param {object} options Parámetros.
   * - icon
   *    - src: Ruta.
   * @api
   */
  constructor(attributeName, categoryStyles, options = {}) {
    super(options, {});
    if (isNullOrEmpty(attributeName)) {
      Exception(getValue('exception').no_attr_name);
    }

    /**
     * Nombre del atributo de la categoría.
     */
    this.attributeName_ = attributeName;

    /**
     * Un objeto que relaciona categoría con un estilo.
     */
    this.categoryStyles_ = categoryStyles;
  }

  /**
   * Este método devuelve el orden del estilo.
   * @public
   * @function
   * @returns {Number} Devuelve el orden del estilo.
   * @api
   */
  get ORDER() {
    return 2;
  }

  /**
   * Este método aplica el objeto categoría a la capa especificada.
   *
   * @function
   * @public
   * @param {M.layer.Vector} layer Capa especificada.
   * @api
   */
  applyInternal(layer) {
    this.layer_ = layer;
    this.update_();
  }

  /**
   * Este método devuelve el "AttributeName".
   *
   * @function
   * @public
   * @returns {String} Nombre del atributo.
   * @api
   */
  getAttributeName() {
    return this.attributeName_;
  }

  /**
   * Este método establece el "AttributeName" definido por el usuario.
   *
   * @function
   * @public
   * @param {String} attributeName Nuevo "AttributeName".
   * @returns {M.style.Category} Categoría ("this").
   * @api
   */
  setAttributeName(attributeName) {
    this.attributeName_ = attributeName;
    this.update_();
    this.refresh();
    return this;
  }

  /**
   * Este método devuelve una matriz con las diferentes categorías.
   *
   * @function
   * @public
   * @returns {Array<String>} Estilo de la categoría.
   * @api
   */
  getCategories() {
    return this.categoryStyles_;
  }

  /**
   * Este método establece las categorías.
   *
   * @function
   * @public
   * @param {Map<String,M.style>} categories Nombre de la categoría.
   * @return {M.style.Category} Categoría.
   * @api
   */
  setCategories(categories) {
    this.categoryStyles_ = categories;
    this.update_();
    this.refresh();
    return this;
  }

  /**
   * Este método devuelve el estilo de una categoría específica definida por el usuario.
   *
   * @function
   * @public
   * @param {String} string Nombre de la categoría.
   * @returns {M.style} Estilo de la categoría.
   * @api
   */
  getStyleForCategory(category) {
    return this.categoryStyles_[category];
  }

  /**
   * Este método establece el estilo de una categoría específica definida por el usuario.
   *
   * @function
   * @public
   * @param {String} category Nombre de la categoría.
   * @param {M.style.Simple} style Nuevo estilo.
   * @returns {M.style.Category} Categoría.
   * @api
   */
  setStyleForCategory(category, style) {
    this.categoryStyles_[category] = style;
    this.update_();
    this.refresh();
    return this;
  }

  /**
   * Este método actualiza el "canvas" de estilo.
   *
   * @function
   * @public
   * @api
   */
  updateCanvas() {
    const canvasImages = [];
    this.updateCanvasPromise_ = new Promise((success, fail) => {
      this.loadCanvasImages_(0, canvasImages, success);
    });
  }

  /**
   * Cargue el estilo de imagen del "canva".
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @function
   * @public
   * @param {Number} currentIndex Número.
   * @param {HTMLCanvasElement} canvasImages "Canvas".
   * @param {Function} callbackFn "callbackFn".
   * @api
   */
  loadCanvasImages_(currentIndex, canvasImages, callbackFn) {
    const categories = this.getCategories();
    const categoryNames = Object.keys(categories);

    // base case
    if (currentIndex === categoryNames.length) {
      this.drawGeometryToCanvas(canvasImages, callbackFn);
    } else {
      // recursive case
      const category = categoryNames[currentIndex];
      const style = this.getStyleForCategory(category);
      const image = new Image();
      image.crossOrigin = 'Anonymous';
      image.onload = () => {
        canvasImages.push({
          image,
          categoryName: category,
        });
        this.loadCanvasImages_((currentIndex + 1), canvasImages, callbackFn);
      };
      image.onerror = () => {
        canvasImages.push({
          categoryName: category,
        });
        this.loadCanvasImages_((currentIndex + 1), canvasImages, callbackFn);
      };
      style.updateCanvas();
      if (style.get('icon.src')) {
        getImageSize(style.get('icon.src')).then((img) => {
          image.width = style.get('icon.scale') ? img.width * style.get('icon.scale') : img.width;
          image.height = style.get('icon.scale') ? img.height * style.get('icon.scale') : img.height;
          style.toImage().then((data) => {
            image.src = data;
          });
        });
      } else {
        const src = style.toImage();
        if (src instanceof Promise) {
          src.then((data) => {
            image.src = data;
          });
        } else {
          image.src = src;
        }
      }
    }
  }

  /**
   * Dibuja la geometría en el estilo de "canva".
   *
   * @function
   * @public
   * @param {HTMLCanvasElement} canvasImages "Canva"
   * @param {Function} callbackFn "callbackFn".
   * @api
   */
  drawGeometryToCanvas(canvasImages, callbackFn) {
    const heights = canvasImages.map((canvasImage) => canvasImage.image.height);
    const widths = canvasImages.map((canvasImage) => canvasImage.image.width);

    const vectorContext = this.canvas_.getContext('2d');
    vectorContext.canvas.height = heights.reduce((acc, h) => acc + h + 5);
    vectorContext.textBaseline = 'middle';

    const maxWidth = Math.max.apply(widths, widths);
    canvasImages.forEach((canvasImage, index) => {
      const image = canvasImage.image;
      const categoryName = canvasImage.categoryName;
      let coordinateY = 0;
      const prevHeights = heights.slice(0, index);
      if (!isNullOrEmpty(prevHeights)) {
        coordinateY = prevHeights.reduce((acc, h) => acc + h + 5);
        coordinateY += 5;
      }
      let imageHeight = 0;
      if (!isNullOrEmpty(image)) {
        imageHeight = image.height;
        const calculateWidth = (maxWidth - image.width) / 2;
        vectorContext.drawImage(image, calculateWidth, coordinateY, image.width, image.height);
      }
      vectorContext.fillText(categoryName, maxWidth + 5, coordinateY + (imageHeight / 2));
    });

    callbackFn();
  }

  /**
   * Este método actualiza el estilo.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @function
   * @public
   * @api
   */
  update_() {
    if (!isNullOrEmpty(this.layer_)) {
      if (isNullOrEmpty(this.categoryStyles_) || Object.keys(this.categoryStyles_).length === 0) {
        this.categoryStyles_ = this.generateRandomCategories_();
      }
      const styleOther = this.categoryStyles_.other;
      this.layer_.getFeatures().forEach((feature) => {
        const value = feature.getAttribute(this.attributeName_);
        const style = this.categoryStyles_[value];
        if (!isNullOrEmpty(style)) {
          feature.setStyle(style);
        } else if (!isNullOrEmpty(styleOther)) {
          feature.setStyle(styleOther);
        }
      });
      this.updateCanvas();
    }
  }

  /**
   * Este método agrega estilos.
   *
   * @public
   * @function
   * @param {M.style|Array<M.Style>} styles Estilos.
   * @returns {M.style.Composite} Estilo de la clase padre.
   * @api
   */
  add(stylesParam) {
    let styles = stylesParam;
    if (!isArray(styles)) {
      styles = [styles];
    }
    styles = styles.filter((style) => {
      return style instanceof StyleCluster || style instanceof StyleProportional;
    });
    return super.add(styles);
  }

  /**
   * Este método genera una categoría aleatoria.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @function
   * @public
   * @return {object} Categorías aleatoria.
   * @api
   */
  generateRandomCategories_() {
    const categories = {};
    if (!isNullOrEmpty(this.layer_)) {
      this.layer_.getFeatures().forEach((feature) => {
        const value = feature.getAttribute(this.attributeName_);
        if (!Object.prototype.hasOwnProperty.call(categories, value)) {
          categories[value] = Utils.generateRandomGenericStyle({
            radius: Category.RANDOM_RADIUS_OPTION,
            strokeColor: Category.RANDOM_STROKE_COLOR_OPTION,
            strokeWidth: Category.RANDOM_STROKE_WIDTH_OPTION,
          });
        }
      });
    }
    return categories;
  }

  /**
   * Este método implementa el mecanismo para
   * generar el JSON de esta instancia.
   *
   * @public
   * @return {object} Devuelve los parámetros de la clase y
   * la deserialización.
   * @function
   * @api
   */
  toJSON() {
    const attributeName = this.getAttributeName();
    const categoryStyles = this.getCategories();
    const serializedCategoryStyles = {};
    Object.keys(categoryStyles).forEach((category) => {
      serializedCategoryStyles[category] = categoryStyles[category].serialize();
    });
    let options = extendsObj({}, this.getOptions());
    options = stringifyFunctions(options);
    const compStyles = this.getStyles().map((style) => style.serialize());

    const parameters = [attributeName, serializedCategoryStyles, options, compStyles];
    const deserializedMethod = 'M.style.Category.deserialize';
    return { parameters, deserializedMethod };
  }

  /**
   * Este método de la clase devuelve la instancia de estilo de la serialización.
   * @function
   * @public
   * @param {Array} parametrers - parameters to deserialize and create
   * the instance
   * @return {M.style.Category} Devuelve la instancia deserializada.
   */
  static deserialize([serializedAttributeName, serializedCategoryStyles,
    serializedOptions, serializedCompStyles,
  ]) {
    const attributeName = serializedAttributeName;
    const categoryStyles = serializedCategoryStyles;
    Object.keys(serializedCategoryStyles).forEach((category) => {
      categoryStyles[category] = StyleBase.deserialize(serializedCategoryStyles[category]);
    });
    const options = defineFunctionFromString(serializedOptions);
    /* eslint-disable */
    const styleFn = new Function(['attributeName', 'categoryStyles', 'options'], `return new M.style.Category(attributeName, categoryStyles, options)`);
    /* eslint-enable */
    const deserializedStyle = styleFn(attributeName, categoryStyles, options);

    const compStyles = serializedCompStyles.map((serializedStyle) => StyleBase
      .deserialize(serializedStyle));
    deserializedStyle.add(compStyles);

    return deserializedStyle;
  }
}

/**
 * Esta constante define el radio del estilo de categoría aleatoria.
 * @const
 * @type {number}
 * @public
 * @api
 */
Category.RANDOM_RADIUS_OPTION = 10;

/**
 * Esta constante define el ancho del trazo del estilo de categoría aleatoria.
 * @const
 * @type {number}
 * @public
 * @api
 */
Category.RANDOM_STROKE_WIDTH_OPTION = 1;

/**
 * Esta constante define el color del trazo del estilo de categoría aleatoria.
 * @const
 * @public
 * @type {string}
 * @api
 */
Category.RANDOM_STROKE_COLOR_OPTION = 'black';

export default Category;
