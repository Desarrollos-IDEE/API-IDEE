/**
 * @module M/layer/Vector
 */
import VectorImpl from 'impl/layer/Vector';
import { geojsonTo4326 } from 'impl/util/Utils';
import projAPI from 'impl/projections';
import {
  isUndefined, isArray, isNullOrEmpty, isString, normalize, modifySVG,
} from '../util/Utils';
import Exception from '../exception/exception';
import LayerBase from './Layer';
import * as LayerType from './Type';
import * as dialog from '../dialog';
import Style from '../style/Style';
import FilterBase from '../filter/Base';
import StyleCluster from '../style/Cluster';
import * as EventType from '../event/eventtype';
import { getValue } from '../i18n/language';
import Generic from '../style/Generic';

/**
 * @classdesc
 * Esta clase es la base de todas las capas de tipo vectorial,
 * de esta clase heredan todas las capas vectoriales del API-CNIG.
 *
 * @extends {M.Layer}
 * @property {Number} minZoom Zoom mínimo.
 * @property {Number} maxZoom Zoom máximo.
 * @property {Array} predefinedStyles Estilos prefefinidos.
 *
 * @api
 * @extends {M.layer}
 */
class Vector extends LayerBase {
  /**
   * Constructor principal de la clase. Crea una capa vectorial
   * con parámetros especificados por el usuario.
   *
   * @constructor
   * @param {Mx.parameters.Layer} parameters Parámetros para la construcción de la capa.
   * - name: Nombre de la capa en la leyenda.
   * - type: Tipo de la capa.
   * - maxExtent: La medida en que restringe la visualización a una región específica.
   * - legend: Indica el nombre que queremos que aparezca en el árbol de contenidos, si lo hay.
   * @param {Mx.parameters.LayerOptions} options  Estas opciones se mandarán a
   * la implementación de la capa.
   * - style. Define el estilo de la capa.
   * - minZoom. Zoom mínimo aplicable a la capa.
   * - maxZoom. Zoom máximo aplicable a la capa.
   * - visibility. Define si la capa es visible o no. Verdadero por defecto.
   * - displayInLayerSwitcher. Indica si la capa se muestra en el selector de capas.
   * - opacity. Opacidad de capa, por defecto 1.
   * - predefinedStyles: Estilos predefinidos para la capa.
   * @param {Object} implParam Valores de la implementación por defecto.
   * @param {Object} vendorOptions Opciones para la biblioteca base. Ejemplo vendorOptions:
   * <pre><code>
   * import OLSourceVector from 'ol/source/Vector';
   * {
   *  opacity: 0.1,
   *  source: new OLSourceVector({
   *    attributions: 'vector',
   *    ...
   *  })
   * }
   * </code></pre>
   * @api
   */
  constructor(parameters = {}, options = {}, vendorOptions = {}, implParam = undefined) {
    const optns = parameters;
    optns.type = !parameters.type ? LayerType.Vector : parameters.type;

    const optionsVars = options;

    if (typeof parameters !== 'string') {
      optionsVars.maxExtent = (parameters.maxExtent) ? parameters.maxExtent : options.maxExtent;
      optns.maxExtent = optionsVars.maxExtent;
    }

    // calls the super constructor
    let impl;
    if (implParam) {
      impl = implParam;
    } else {
      // checks if the implementation can create Vector
      if (isUndefined(VectorImpl)) {
        Exception(getValue('exception').vectorlayer_method);
      }
      impl = new VectorImpl(optionsVars, vendorOptions);
    }
    super(optns, impl);

    /**
     * Vector style_. Estilo de la capa.
     * @private
     * @type {M.style}
     * @api
     */
    this.style_ = null;

    /**
     * Vector filter_. Para filtar los objetos geográficos
     * de las capas vectoriales.
     */
    this.filter_ = null;

    /**
     * Vector minzoom. Zoom mínimo.
     */
    this.minZoom = optionsVars.minZoom || Number.NEGATIVE_INFINITY; // || optns.minZoom

    /**
     * Vector maxzoom. Zoom máximo.
     */
    this.maxZoom = optionsVars.maxZoom || Number.POSITIVE_INFINITY; // || optns.maxZoom

    /**
     * infoEventType. Tipo de evento para mostrar la info de una feature.
     */
    this.infoEventType = optns.infoEventType || 'click';

    /**
      * Vector extract: Opcional, activa la consulta
      * haciendo clic en el objeto geográfico, por defecto falso.
    */
    this.extract = optns.extract === undefined ? false : optns.extract;

    /**
     * predefinedStyles: Estilos predefinidos para la capa.
     */
    this.predefinedStyles = isUndefined(options.predefinedStyles)
      ? []
      : options.predefinedStyles;

    const defaultOptionsStyle = !isUndefined(this.constructor.DEFAULT_OPTS_STYLE)
      ? this.constructor.DEFAULT_OPTS_STYLE
      : this.constructor.DEFAULT_OPTIONS_STYLE;

    if (isUndefined(options.style) && defaultOptionsStyle) {
      this.predefinedStyles.unshift(new Generic(defaultOptionsStyle));
    } else if (isUndefined(options.style)) {
      this.predefinedStyles.unshift(new Generic(Vector.DEFAULT_OPTIONS_STYLE));
    } else {
      this.predefinedStyles.unshift(options.style);
    }

    this.setStyle(options.style);

    impl.on(EventType.LOAD, (features) => this.fire(EventType.LOAD, [features]));
  }

  /**
   * Este método devuelve el valor de la propiedad filter, esta
   * propiedad se utiliza para filtrar los objeto geográfico.
   *
   * @function
   * @public
   * @return {M.Filter} Devuelve el filtro.
   * @api
   */
  getFilter() {
    return this.filter_;
  }

  /**
   * Este método elimina el valor de la propiedad "filter",
   * lo pone a nulo.
   *
   * @function
   * @public
   * @api
   */
  removeFilter() {
    this.setFilter(null);
  }

  /**
   * Este método incluye objetos geográficos a la capa.
   *
   * @function
   * @public
   * @param {Array<M.feature>} features Objetos geográficos que
   * se incluirán a la capa.
   * @param {Boolean} update Verdadero se vuelve a cargar la capa,
   * falso no la vuelve a cargar.
   * @api
   */
  addFeatures(featuresParam, update = false) {
    let features = featuresParam;
    if (!isNullOrEmpty(features)) {
      if (!isArray(features)) {
        features = [features];
      }
      this.getImpl().addFeatures(features, update);
    }
  }

  /**
   * Este método devuelve todos los objetos geográficos o discrimina por el filtro.
   *
   * @function
   * @public
   * @param {Boolean} applyFilter Indica si se ejecuta filtro.
   * @return {Array<M.Feature>} Devuelve todos los objetos geográficos o discriminando por
   * el filtro.
   * @api
   */
  getFeatures(skipFilterParam) {
    let skipFilter = skipFilterParam;
    if (isNullOrEmpty(this.getFilter())) skipFilter = true;
    return this.getImpl().getFeatures(skipFilter, this.filter_);
  }

  /**
   * Devuelve el objeto geográfico con el id pasado por parámetros.
   *
   * @function
   * @public
   * @param {String|Number} id - Id objeto geográfico.
   * @return {Null|M.feature} objeto geográfico: devuelve el objeto geográfico con esa
   * identificación si se encuentra,
   * en caso de que no se encuentre o no indique el id devuelve nulo.
   * @api
   */
  getFeatureById(id) {
    let feature = null;
    if (!isNullOrEmpty(id)) {
      feature = this.getImpl().getFeatureById(id);
    } else {
      dialog.error(getValue('dialog').id_feature);
    }
    return feature;
  }

  /**
   * Elimina el objeto geográfico indicado por parámetro.
   *
   * @function
   * @public
   * @param {Array<M.feature>} features El objeto geográfico que se eliminará.
   * @api
   */
  removeFeatures(featuresParam) {
    let features = featuresParam;
    if (!isArray(features)) {
      features = [features];
    }
    this.getImpl().removeFeatures(features);
  }

  /**
   * Este método elimina todos los objetos geográficos.
   *
   * @function
   * @public
   * @api
   */
  clear() {
    this.removeFilter();
    this.removeFeatures(this.getFeatures(true));
  }

  /**
   * Este método recarga la capa.
   *
   * @function
   * @public
   * @api
   */
  refresh() {
    this.getImpl().refresh(true);
    this.redraw();
  }

  /**
   * Este método redibuja la capa.
   *
   * @function
   * @public
   * @api
   */
  redraw() {
    this.getImpl().redraw();
  }

  /**
   * Este método devuelve la extensión de todos los objetos geográficos o discrimina por el filtro.
   *
   * @function
   * @param {Boolean} applyFilter Indica si se ejecuta filtro.
   * @return {Array<number>} Alcance de las objetos geográficos.
   * @api
   */
  getFeaturesExtent(skipFilterParam) {
    return this.getImpl().getFeaturesExtent(true, this.filter_);
  }

  /**
   * Devuelve el valor de la propiedad "extract". La propiedad "extract" tiene la
   * siguiente función: Activa la consulta al hacer clic en la característica, por defecto falso.
   *
   * @function
   * @getter
   * @return {Boolean} Valor de la propiedad "extract".
   * @api
   */
  get extract() {
    return this.getImpl().extract;
  }

  /**
     * Sobrescribe el valor de la propiedad "extract". La propiedad "extract" tiene la
     * siguiente función: Activa la consulta al hacer clic en la característica, por defecto falso.
     *
     * @function
     * @setter
     * @param {Boolean|String} newExtract Nuevo valor para sobreescribir la propiedad "extract".
     * @api
  */
  set extract(newExtract) {
    if (!isNullOrEmpty(newExtract)) {
      if (isString(newExtract)) {
        this.getImpl().extract = (normalize(newExtract) === 'true');
      } else {
        this.getImpl().extract = newExtract;
      }
    } else {
      this.getImpl().extract = false;
    }
  }

  /**
   * Este método comprueba si un objeto es igual
   * a esta capa.
   *
   * @function
   * @public
   * @param {Object} obj Objeto a comparar.
   * @returns {Boolean} Valor verdadero es igual, falso no lo es.
   * @api
   */
  equals(obj) {
    let equals = false;
    if (obj instanceof Vector) {
      equals = this.name === obj.name;
    }
    return equals;
  }

  /**
   * Este método establece el estilo en capa.
   *
   * @function
   * @public
   * @param {M.Style} style Estilo que se aplicará a la capa.
   * @param {Boolean} applyToFeature Si el valor es verdadero se aplicará a los
   * objetos geográficos, falso no.
   * Por defecto, falso.
   * @param {M.layer.Vector.DEFAULT_OPTIONS_STYLE} defaultStyle Estilo por defecto,
   * se define en Vector.js.
   * @api
   */
  setStyle(style, applyToFeature = false, defaultStyle = Vector.DEFAULT_OPTIONS_STYLE) {
    if (this.getImpl().isLoaded()) {
      if (isNullOrEmpty(this.getStyle())) {
        this.applyStyle_(defaultStyle, applyToFeature);
      }
      if (!isNullOrEmpty(style)) {
        this.applyStyle_(style, applyToFeature);
      }
    } else {
      this.once(EventType.LOAD, () => {
        if (isNullOrEmpty(this.getStyle())) {
          this.applyStyle_(defaultStyle, applyToFeature);
        }
        if (!isNullOrEmpty(style)) {
          this.applyStyle_(style, applyToFeature);
        }
      });
    }
  }

  /**
   * La forma en que se aplica el estilo a la capa.
   *
   * @function
   * @public
   * @param {Object} styleParam Estilo que se aplicará a la capa.
   * @param {Boolean} applyToFeature Indica si se aplicará el estilo a los objetos geográficos.
   * @api
   */
  applyStyle_(styleParam, applyToFeature) {
    let style = styleParam;
    if (isString(style)) {
      style = Style.deserialize(style);
    } else if (!(style instanceof Style)) {
      style = new Generic(style);
    }
    if (style instanceof Style) {
      let options = style.getOptions();
      if (options.point) {
        options = options.point;
      }
      if (options.icon && (options.icon.fill || options.icon.stroke) && options.icon.src
        && typeof options.icon.src === 'string' && options.icon.src.endsWith('.svg')) {
        modifySVG(options.icon.src, options).then((resp) => {
          options.icon.src = resp;
          this.applyStyle_(styleParam, applyToFeature);
        });
      } else if (style instanceof Style) {
        if (this.style_ instanceof Style) {
          this.style_.unapply(this);
        }
        style.apply(this, applyToFeature);
        this.style_ = style;
        this.fire(EventType.CHANGE_STYLE, [style, this]);
      }
    }
    this.fire(EventType.CHANGE_STYLE, [style, this]);
  }

  /**
   * Este método devuelve el estilo de la capa.
   *
   * @function
   * @public
   * @returns {M.layer.Vector.style}
   * @api
   */
  getStyle() {
    return this.style_;
  }

  /**
   * Elimina el estilo de la capa y de los objetos geográficos.
   *
   * @function
   * @public
   * @api
   */
  clearStyle() {
    this.setStyle(null);
    this.getFeatures().forEach((feature) => feature.clearStyle());
  }

  /**
   * Devuelve el legendURL.
   *
   * @function
   * @returns {M.layer.Vector.legendUrl} Devuelve el legendURL.
   * @api
   */
  getLegendURL() {
    let legendUrl = this.getImpl().getLegendURL();
    if (legendUrl.indexOf(LayerBase.LEGEND_DEFAULT) !== -1
      && legendUrl.indexOf(LayerBase.LEGEND_ERROR) === -1 && this.style_ instanceof Style) {
      legendUrl = this.style_.toImage();
    }
    return legendUrl;
  }

  /**
   * Obtiene el tipo de geometría de la capa.
   * Tipo de geometría: POINT (Punto), MPOINT (Multiples puntos), LINE (línea),
   * MLINE (Multiples línes), POLYGON (Polígono), or MPOLYGON (Multiples polígonos).
   * @function
   * @public
   * @param {M.layer.Vector} layer Capa vectorial.
   * @return {String} Tipo de geometría de la capa.
   * @api
   */
  getGeometryType() {
    let geometry = null;
    if (!isNullOrEmpty(this.getFeatures())) {
      const firstFeature = this.getFeatures()[0];
      if (!isNullOrEmpty(firstFeature) && !isNullOrEmpty(firstFeature.getGeometry())) {
        geometry = firstFeature.getGeometry().type;
      }
    }
    return geometry;
  }

  /**
   * Este método indica la extensión máxima de la capa.
   *
   * @function
   * @returns {M.layer.Vector.impl.getFeaturesExtent} Devuelve la extensión de
   * los objeto geográfico.
   * @api
   */
  getMaxExtent() {
    return this.getFeaturesExtent();
  }

  /**
   * Este método indica la extensión máxima de la capa.
   *
   * @function
   * @returns {M.layer.Vector.impl.getFeaturesExtentPromise} Devuelve la extensión de
   * los objetos geográficos.
   * @api
   */
  calculateMaxExtent() {
    return this.getImpl().getFeaturesExtentPromise(true, this.filter_);
  }

  /**
   * Sobrescribe el filtro de la capa.
   *
   * @function
   * @public
   * @param {M.Filter} filter Filtro para configurar.
   * @api
   */
  setFilter(filter) {
    if (isNullOrEmpty(filter) || (filter instanceof FilterBase)) {
      this.filter_ = filter;
      const style = this.style_;
      if (style instanceof StyleCluster) {
        // deactivate change cluster event
        style.getImpl().deactivateChangeEvent();
      }
      this.redraw();
      if (style instanceof StyleCluster) {
        // activate change cluster event
        style.getImpl().activateChangeEvent();

        // Se refresca el estilo para actualizar los cambios del filtro
        // ya que al haber activado el evento change de source cluster tras aplicar el filter
        // no se actualiza automaticamente
        style.refresh();
      }
    } else {
      dialog.error(getValue('dialog').vector_filter);
    }
  }

  /**
   * Este método obtiene la representación GeoJSON de la capa.
   * @function
   * @returns {Object} Devuelve un objeto, tipo 'FeatureCollection' con
   * los objetos geográficos.
   * @api
   */
  toGeoJSON() {
    const code = this.map_.getProjection().code;
    const featuresAsJSON = this.getFeatures().map((feature) => feature.getGeoJSON());
    const projection = projAPI.getSupportedProjs()
      .find((proj) => proj.codes.includes('EPSG:4326'));
    return {
      type: 'FeatureCollection',
      crs: {
        type: 'name',
        properties: {
          name: projection.codes[projection.codes.length - 2],
        },
      },
      features: geojsonTo4326(featuresAsJSON, code),
    };
  }
}

/**
 * Parámetros predeterminados.
 * @const
 * @type {Object}
 * @public
 * @api
 */
Vector.DEFAULT_PARAMS = {
  fill: {
    color: 'rgba(255, 255, 255, 0.4)',
    opacity: 0.4,
  },
  stroke: {
    color: '#3399CC',
    width: 1.5,
  },
};

/**
 * Estilos predeterminados.
 * @const
 * @type {Object}
 * @public
 * @api
 */
Vector.DEFAULT_OPTIONS_STYLE = {
  point: {
    ...Vector.DEFAULT_PARAMS,
    radius: 5,
  },
  line: {
    ...Vector.DEFAULT_PARAMS,
  },
  polygon: {
    ...Vector.DEFAULT_PARAMS,
  },
};

export default Vector;
