/**
 * @module IDEE/Layer
 */
import Exception from '../exception/exception';
import * as parserParameter from '../parameter/parameter';
import Base from '../Base';
import {
  isUndefined, isBoolean, isArray, isNullOrEmpty, isFunction, isObject, isString,
  normalize, generateRandom,
} from '../util/Utils';
import { getValue } from '../i18n/language';
import * as EventType from '../event/eventtype';

/**
 * @classdesc
 * De esta clase heredadan todas las capas base.
 *
 * @property {string} idLayer Identificador de la capa.
 * @property {string} type Tipo de la capa.
 * @property {string} url URL del servicio.
 * @property {string} name Nombre de la capa.
 * @property {Boolean} transparent (deprecated) Falso si es una capa base,
 * verdadero en caso contrario.
 * @property {Array<Number>} userMaxExtent MaxExtent proporcionado por el usuario, la medida en que
 * restringe la visualización a una región específica.
 * @property {string} legend Indica el nombre que queremos que aparezca en el árbol
 * de contenidos, si lo hay.
 * @property {Boolean} isBase Define si la capa es base.
 * @property {IDEE.layer.Section} section_ Indica si la capa pertenece a una sección.
 *
 * @api
 * @extends {IDEE.Base}
 */
class LayerBase extends Base {
  /**
   * Constructor principal de la clase. Crea una capa
   * con parámetros especificados por el usuario.
   * @constructor
   * @extends {IDEE.facade.Base}
   * @param {string|Mx.parameters.Layer} userParameters Parámetros proporcionados por el usuario.
   * - attribution: Atribución de la capa.
   * - name: Nombre de la capa.
   * - isBase: Indica si la capa es base.
   * - transparent (deprecated): Falso si es una capa base, verdadero en caso contrario.
   * - maxExtent: La medida en que restringe la visualización a una región específica.
   * - legend: Nombre asociado en el árbol de contenidos, si usamos uno.
   * - minZoom. Zoom mínimo aplicable a la capa.
   * - maxZoom. Zoom máximo aplicable a la capa.
   * - url: url del servicio.
   * @param {Object} impl Implementación.
   * @api
   */
  constructor(userParameters, impl) {
    // calls the super constructor
    super(impl);

    // This layer is of parameters.
    const parameter = parserParameter.layer(userParameters);

    /**
     * attribution: Atribución de la capa.
     */
    this.attribution = userParameters.attribution;

    /**
     * Layer type: Tipo de la capa.
     */
    this._type = parameter.type;

    /**
     * Layer url: URL del servicio.
     */
    this.url = parameter.url;

    /**
     * Layer name: Nombre de la capa.
     */
    this.name = parameter.name;

    /**
     * Layer transparent:
     * Falso si es una capa base, verdadero en caso contrario.
     */
    this.transparent = true;
    if (!isNullOrEmpty(parameter.transparent)) {
      this.transparent = parameter.transparent;
    } else if (!isNullOrEmpty(userParameters.isBase)) {
      this.transparent = !userParameters.isBase;
    }

    /**
     * Layer isBase:
     * Verdadero si es una capa base, falso en caso contrario.
     */
    this.isBase = !this.transparent;

    /**
     * Layer maxExtent_:
     * La medida en que restringe la visualización a una región específica.
     */
    this.maxExtent_ = null;

    /**
     * Layer zindex_: z-index de la capa.
     */
    this.zindex_ = null;

    /**
     * Layer map_: Mapa (IDEE.map).
     */
    this.map_ = null;

    /**
     * Layer userMaxExtent:
     * MaxExtent proporcionado por el usuario, la medida en que
     * restringe la visualización a una región específica.
     */
    this.userMaxExtent = parameter.maxExtent || userParameters.maxExtent;

    /**
     * Layer Legend:
     * Indica el nombre que queremos que aparezca en el árbol de contenidos, si lo hay.
     */
    this.legend = parameter.legend;

    /**
     * Zoom mínimo aplicable a la capa.
     */
    this.minZoom = parameter.minZoom || Number.NEGATIVE_INFINITY;

    /**
     * Zoom máximo aplicable a la capa.
     */
    this.maxZoom = parameter.maxZoom || Number.POSITIVE_INFINITY;

    this.idLayer = generateRandom(parameter.type, parameter.name).replace(/[^a-zA-Z0-9\-_]/g, '');

    /**
     * Indica si la extensión máxima se ha restablecido.
     * @private
     */
    this.isReset_ = false;

    /**
     * Sección de la capa.
     *
     * @private
     * @type {IDEE.layer.Section}
     * @api
     */
    this.section_ = null;
  }

  /**
   * Devuelve el tipo de layer.
   *
   * @function
   * @getter
   * @returns {String} Tipo.
   * @api
   */
  get type() {
    return this._type;
  }

  /**
   * Sobrescribe el tipo de capa.
   *
   * @function
   * @setter
   * @param {String} newType Nuevo tipo.
   * @api
   */
  set type(newType) {
    if (!isUndefined(newType)
      && !isNullOrEmpty(newType) && (newType !== this._type)) {
      Exception('El tipo de capa debe ser \''
        .concat(this._type)
        .concat('\' pero se ha especificado \'').concat(newType).concat('\''));
    }
  }

  /**
   * Devuelve la leyenda de la capa.
   * La Leyenda indica el nombre que queremos que aparezca en el árbol de contenidos, si lo hay.
   *
   * @function
   * @getter
   * @return {IDEE.layer.GeoTIFF.impl.legend} Leyenda de la capa.
   * @api
   */
  get legend() {
    return this.getImpl().legend;
  }

  /**
   * Sobrescribe la leyenda de la capa.
   * La Leyenda indica el nombre que queremos que aparezca en el árbol de contenidos, si lo hay.
   *
   * @function
   * @setter
   * @param {String} newLegend Nueva leyenda.
   * @api
   */
  set legend(newLegend) {
    if (isNullOrEmpty(newLegend)) {
      this.getImpl().legend = this.name;
    } else {
      this.getImpl().legend = newLegend;
    }
  }

  /**
   * Devuelve la leyenda de la capa.
   * Indica el nombre que queremos que aparezca en el árbol de contenidos, si lo hay.
   * @function
   * @public
   * @returns {IDEE.layer.impl.legend} Leyenda.
   * @api
   */
  getLegend() {
    return this.getImpl().legend;
  }

  /**
   * Sobrescribe la leyenda de la capa.
   * Indica el nombre que queremos que aparezca en el árbol de contenidos, si lo hay.
   * @function
   * @public
   * @param {String} newLegend Nueva leyenda.
   * @api
   */
  setLegend(newLegend) {
    this.legend = newLegend;
    this.getImpl().legend = newLegend;
  }

  /**
   * Devuelve la url del servicio.
   *
   * @function
   * @getter
   * @public
   * @returns {IDEE.layer.impl.url} URL del servicio.
   * @api
   */
  get url() {
    return this.getImpl().url;
  }

  /**
   * Modifica la url del servicio.
   * @function
   * @setter
   * @public
   * @param {String} newUrl Nueva URL.
   * @api
   */
  set url(newUrl) {
    this.getImpl().url = newUrl;
  }

  /**
   * Nombre de la capa.
   * @function
   * @getter
   * @public
   * @returns {IDEE.layer.impl.name}
   * @api
   */
  get name() {
    return this.getImpl().name;
  }

  /**
   * Sobrescribe el nombre de la capa.
   * @function
   * @setter
   * @public
   * @param {String} newName Nuevo nombre de la capa.
   * @api
   */
  set name(newName) {
    let newNamep = newName;
    if (isUndefined(newName)) {
      const randomNumber = Math.floor(Math.random() * 9000) + 1000;
      newNamep = `layer_${randomNumber}`;
    }
    this.getImpl().name = newNamep;
  }

  /**
   * Devuelve el valor de la propiedad "isBase" de la capa.
   * @function
   * @getter
   * @public
   * @returns {IDEE.layer.impl.transparent} Valor de la propiedad "isBase".
   * @api
   */
  get isBase() {
    return this.getImpl().isBase;
  }

  /**
   * Sobrescribe el valor de la propiedad "isBase".
   * @function
   * @setter
   * @public
   * @param {Boolean} newIsBase  Nuevo valor para la propiedad "isBase".
   * @api
   */
  set isBase(newIsBase) {
    if (!isNullOrEmpty(newIsBase)) {
      if (isString(newIsBase)) {
        this.getImpl().isBase = newIsBase === 'true';
        this.transparent = newIsBase !== 'true';
      } else {
        this.transparent = !newIsBase;
        this.getImpl().isBase = newIsBase;
      }
    } else {
      this.getImpl().isBase = false;
      this.transparent = true;
    }
  }

  /**
   * Devuelve el valor de la propiedad "transparent" de la capa.
   * @function
   * @getter
   * @public
   * @returns {IDEE.layer.impl.transparent} Valor de la propiedad "transparent".
   * @api
   * @deprecated
   */
  get transparent() {
    return this.getImpl().transparent;
  }

  /**
   * Sobrescribe el valor de la propiedad "transparent".
   * @function
   * @setter
   * @public
   * @param {Boolean} newTransparent  Nuevo valor para la propiedad "transparent".
   * @api
   * @deprecated
   */
  set transparent(newTransparent) {
    if (!isNullOrEmpty(newTransparent)) {
      if (isString(newTransparent)) {
        this.getImpl().transparent = (normalize(newTransparent) === 'true');
      } else {
        this.getImpl().transparent = newTransparent;
      }
    } else {
      this.getImpl().transparent = true;
    }
  }

  /**
   * Devuelve verdadero si la capa estará en el "DisplayInLayerSwitcher".
   * @function
   * @getter
   * @public
   * @returns {IDEE.layer.impl.displayInLayerSwitcher} Verdadero si esta en el
   * "DisplayInLayerSwitcher", falso si no.
   * @api
   */
  get displayInLayerSwitcher() {
    return this.getImpl().displayInLayerSwitcher;
  }

  /**
   * Sobrescribe la propiedad "displayInLayerSwitcher" de la capa.
   * @function
   * @setter
   * @public
   * @param {Boolean} newDisplayInLayerSwitcher Verdadero si esta en el
   * "DisplayInLayerSwitcher", falso si no.
   * @api
   */
  set displayInLayerSwitcher(newDisplayInLayerSwitcher) {
    if (!isNullOrEmpty(newDisplayInLayerSwitcher)) {
      if (isString(newDisplayInLayerSwitcher)) {
        this.getImpl().displayInLayerSwitcher = (normalize(newDisplayInLayerSwitcher) === 'true');
      } else {
        this.getImpl().displayInLayerSwitcher = newDisplayInLayerSwitcher;
      }
    } else {
      this.getImpl().displayInLayerSwitcher = true;
    }
  }

  /**
   * Este método devuelve el identificador de la capa.
   *
   * @function
   * @returns {String} Devuelve el identificador de la capa.
   * @api
   */
  getId() {
    return this.idLayer;
  }

  /**
   * Este método establece el identificador de la capa.
   *
   * @function
   * @param {String} newID Nuevo identificador para la capa.
   * @api
   */
  setId(newID) {
    if (!isNullOrEmpty(this.map_)) {
      const findId = this.map_.getLayers().find((layer) => {
        let result = null;
        if (layer.constructor.name === 'WMC') {
          result = layer.layers.find((layerwmc) => {
            return layerwmc.idLayer === newID;
          });
        } else {
          result = layer.idLayer === newID;
        }
        return result;
      });
      if (isUndefined(findId)) {
        this.map_.getFeatureHandler().changeNamePrevs(this.idLayer, newID);
        this.idLayer = newID;
      } else {
        Exception(getValue('exception').id_exists);
      }
    }
  }

  /**
   * Este método calcula la extensión máxima de esta capa.
   *
   * @function
   * @returns {IDEE.layer.maxExtent} Devuelve la extensión máxima de esta capa.
   * @api
   */
  getMaxExtent() {
    let maxExtent = this.userMaxExtent; // 1
    if (isNullOrEmpty(maxExtent)) {
      maxExtent = this.map_.userMaxExtent; // 2
      if (isNullOrEmpty(maxExtent)) {
        maxExtent = this.map_.getProjection().getExtent(); // 3
      }
    }
    return maxExtent;
  }

  /**
   * Este método calcula la extensión máxima de esta capa.
   *
   * @function
   * @returns {IDEE.layer.maxExtent} Devuelve una promesa, con la extensión máxima de esta capa.
   * @api
   */
  calculateMaxExtent() {
    return new Promise((resolve) => { resolve(this.getMaxExtent()); });
  }

  /**
   * Este método cambia la extensión máxima de la capa.
   *
   * @function
   * @param {String} maxExtent Nuevo valor para el "MaxExtent".
   * @api
   * @export
   */
  setMaxExtent(maxExtent) {
    this.userMaxExtent = maxExtent;
    if (!isArray(maxExtent) && isObject(maxExtent)) {
      this.userMaxExtent = [
        maxExtent.x.min,
        maxExtent.y.min,
        maxExtent.x.max,
        maxExtent.y.max,
      ];
    }
    if (isFunction(this.getImpl().setMaxExtent)) {
      if (isNullOrEmpty(maxExtent)) {
        this.resetMaxExtent();
      } else {
        this.getImpl().setMaxExtent(maxExtent);
      }
    }
  }

  /**
   * Este método restablece la extensión máxima de la capa.
   * @function
   * @api
   */
  resetMaxExtent() {
    this.userMaxExtent = null;
    this.isReset_ = true;
    this.calculateMaxExtent().then((maxExtent) => {
      if (isFunction(this.getImpl().setMaxExtent)) {
        this.getImpl().setMaxExtent(maxExtent);
      }
      this.isReset_ = false;
    });
  }

  /**
   * La instancia del mapa de la fachada.
   *
   * @function
   * @public
   * @param {IDEE.map} map Instancia del mapa creado con la fachada.
   * @api
   * @export
   */
  setMap(map) {
    this.map_ = map;
  }

  /**
   * Este método devuelve la sección de esta capa, si la tiene.
   *
   * @public
   * @function
   * @returns {IDEE.layer.Section} Sección de la capa.
   * @api
   */
  getSection() {
    return this.section_;
  }

  /**
   * Este método añade la capa dentro de una sección. Una capa solo puede
   * estar dentro de una sección a la vez.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   *
   * @function
   * @param {IDEE.layer.Section} section Sección a la que se añadirá la capa.
   * @api
   */
  setSection_(section) {
    this.section_ = section;
  }

  /**
   * Este método indica si la capa es visible.
   *
   * @function
   * @return {Boolean} Devuelve si la capa es visible o no.
   * @api
   * @export
   */
  isVisible() {
    // checks if the implementation can manage this method
    if (isUndefined(this.getImpl().isVisible)) {
      Exception(getValue('exception').isvisible_method);
    }

    return this.getImpl().isVisible();
  }

  /**
   * Este método indica si la capa es consultable.
   *
   * @function
   * @return {Boolean} Devuelve si la capa es consultable.
   * @api
   * @export
   */
  isQueryable() {
    // checks if the implementation can manage this method
    if (isUndefined(this.getImpl().isQueryable)) {
      Exception(getValue('exception').isqueryable_method);
    }

    return this.getImpl().isQueryable();
  }

  /**
   * Este método Sobrescribe la propiedad "visibility" de la capa.
   *
   * @function
   * @param {Boolean} visibilityParam Verdadero visible, falso no visible.
   * @api
   * @export
   */
  setVisible(visibilityParam) {
    let visibility = visibilityParam;
    // checks if the param is null or empty
    if (isNullOrEmpty(visibility)) {
      Exception(getValue('exception').visibility_param);
    }

    // checks if the param is boolean or string
    if (!isString(visibility) && !isBoolean(visibility)) {
      Exception(getValue('exception').visibility_param);
    }

    // checks if the implementation can manage this method
    if (isUndefined(this.getImpl().setVisible)) {
      Exception(getValue('exception').setvisible_method);
    }

    visibility = /^1|(true)$/i.test(visibility);

    this.getImpl().setVisible(visibility);

    this.fire(EventType.LAYER_VISIBILITY_CHANGE, [{ visibility, layer: this }, this]);
  }

  /**
   * Este método indica si la capa está dentro del rango.
   *
   * @function
   * @returns {IDEE.layer.impl.inRange} Devuelve si la capa está dentro del rango.
   * @api
   * @export
   */
  inRange() {
    // checks if the implementation can manage this method
    if (isUndefined(this.getImpl().inRange)) {
      Exception(getValue('exception').inrage_method);
    }

    return this.getImpl().inRange();
  }

  /**
   * Devuelve la URL de la leyenda.
   *
   * @function
   * @returns {IDEE.layer.impl.getLegendURL} URL de la leyenda.
   * @api
   */
  getLegendURL() {
    return this.getImpl().getLegendURL();
  }

  /**
   * Sobrescribe la url de la leyenda.
   *
   * @function
   * @param {String} legendUrlParam Nueva URL.
   * @api
   */
  setLegendURL(legendUrlParam) {
    let legendUrl = legendUrlParam;
    if (isNullOrEmpty(legendUrl)) {
      legendUrl = LayerBase.LEGEND_DEFAULT;
    }
    this.getImpl().setLegendURL(legendUrl);
  }

  /**
   * Este método obtiene el índice z de esta capa.
   *
   * @function
   * @returns {Number} Devuelve el z-index.
   * @api
   */
  getZIndex() {
    return this.zindex_;
  }

  /**
   * Este método establece el z-index para esta capa.
   *
   * @function
   * @param {Number} zIndex Nuevo z-index.
   * @api
   */
  setZIndex(zIndex) {
    let newZIndex = zIndex;
    const rootGroup = this.getImpl().rootGroup;
    if (rootGroup) {
      // Si pertenece a un grupo se comprueba que no se salga de
      // los límites superior e inferior de zindex
      if (zIndex >= rootGroup.getZIndex()) {
        newZIndex = rootGroup.getZIndex() - 1;
      } else if (zIndex <= rootGroup.getZIndex() - rootGroup.getTotalLayers()) {
        newZIndex = rootGroup.getZIndex() - rootGroup.getTotalLayers() + 1;
      }
    }
    this.zindex_ = newZIndex;
    this.getImpl().setZIndex(newZIndex);
  }

  /**
   * Esta función devuelve el valor de la escala mínima para esta capa.
   *
   * @function
   * @returns {Number} Devuelve el valor de la escala mínima.
   * @api
   */
  getMinScale() {
    return this.getImpl().getMinScale();
  }

  /**
   * Esta función establece el valor de la escala mínima para esta capa.
   *
   * @function
   * @param {Number} minScale Nueva escala mínima.
   * @api
   */
  setMinScale(minScale) {
    this.getImpl().setMinScale(minScale);
  }

  /**
   * Esta función devuelve el valor de la escala máxima para esta capa.
   *
   * @function
   * @returns {Number} Devuelve el valor de la escala máxima.
   * @api
   */
  getMaxScale() {
    return this.getImpl().getMaxScale();
  }

  /**
   * Esta función establece el valor de la escala máxima para esta capa.
   *
   * @function
   * @param {Number} maxScale Nueva escala máxima.
   * @api
   */
  setMaxScale(maxScale) {
    this.getImpl().setMaxScale(maxScale);
  }

  /**
   * Este método devuelve el mínimo zoom aplicable a la capa.
   *
   * @function
   * @returns {Number} Zoom mínimo.
   * @api
   */
  getMinZoom() {
    return this.minZoom;
  }

  /**
   * Este método Sobrescribe el mínimo zoom aplicable a la capa.
   *
   * @function
   * @param {Number} zoom Nuevo zoom mínimo.
   * @api
   */
  setMinZoom(zoom) {
    this.minZoom = zoom;
    this.getImpl().setMinZoom(zoom);
  }

  /**
   * Este método devuelve el zoom máximo aplicable a la capa.
   *
   * @function
   * @return {Number} Nuevo zoom.
   * @api
   */
  getMaxZoom() {
    return this.maxZoom;
  }

  /**
   * Este método Sobrescribe el zoom máximo aplicable a la capa.
   *
   * @function
   * @param {Number} zoom Nuevo zoom.
   * @api
   */
  setMaxZoom(zoom) {
    this.maxZoom = zoom;
    this.getImpl().setMaxZoom(zoom);
  }

  /**
   * Este método obtiene la opacidad de esta capa.
   *
   * @function
   * @returns {Number} Opacidad de la capa.
   * @api
   */
  getOpacity() {
    return this.getImpl().getOpacity();
  }

  /**
   * Sobrescribe la opacidad de la capa.
   *
   * @function
   * @param {Number} opacity Opacidad de la capa.
   * @api
   */
  setOpacity(opacity) {
    this.getImpl().setOpacity(opacity);
  }

  getAttribution() {
    return this.attribution;
  }

  /**
   * Este método actualiza el estado de este capa.
   *
   * @function
   * @api
   * @export
   */
  refresh() {
    // checks if the implementation can manage this method
    if (!isUndefined(this.getImpl().refresh) && isFunction(this.getImpl().refresh)) {
      this.getImpl().refresh();
    }
  }

  /**
   * Este método genera automáticamente un nombre para esta capa.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @public
   * @function
   * @export
   * @api
   */
  generateName_() {
    this.name = generateRandom('layer_', '_'.concat(this.type));
  }
}

/**
 * Imagen PNG para la leyenda predeterminada.
 * @const
 * @type {String}
 * @public
 * @api
 */
LayerBase.LEGEND_DEFAULT = 'https://componentes.idee.es/estaticos/imagenes/leyenda/legend-default.png';

/**
 * Imagen de error PNG para la leyenda predeterminada.
 * @const
 * @type {String}
 * @public
 * @api
 */
LayerBase.LEGEND_ERROR = 'https://componentes.idee.es/estaticos/imagenes/leyenda/legend-error.png';

export default LayerBase;
