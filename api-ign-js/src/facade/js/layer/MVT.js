/**
 * @module M/layer/MVT
 */
import MVTTileImpl from 'impl/layer/MVT';
import RenderFeatureImpl from 'impl/feature/RenderFeature';
import FeatureImpl from 'impl/feature/Feature';
import Vector from './Vector';
import {
  isUndefined, isNullOrEmpty, isString, normalize,
} from '../util/Utils';
import Exception from '../exception/exception';
import * as dialog from '../dialog';
import { MVT as MVTType } from './Type';
import * as parameter from '../parameter/parameter';
import { getValue } from '../i18n/language';

/**
 * Posibles modos para la capa MVT.
 * @const
 * @public
 * @api
 */
export const mode = {
  RENDER: 'render',
  FEATURE: 'feature',
};

/**
 * @classdesc
 * Las capas de tipo Vector Tile ofrecen ciertas ventajas en algunos escenarios,
 * debido a su bajo peso y carga rápida,
 * ya que se sirven en forma de teselas que contienen la información vectorial
 * del área que delimitan.
 *
 * @property {Boolean} extract Activa la consulta al hacer clic sobre un objeto geográfico,
 * por defecto falso.
 *
 * @api
 * @extends {M.layer.Vector}
 */
class MVT extends Vector {
  /**
   * Constructor principal de la clase. Crea una capa MVT
   * con parámetros especificados por el usuario.
   *
   * @constructor
   * @param {string|Mx.parameters.MVT} parameters Parámetros para la construcción de la capa.
   * - url: Url del servicio que devuelve los tiles vectoriales.
   * - name: Nombre de la capa, debe ser único en el mapa.
   * - projection: SRS usado por la capa.
   * - opacity: Opacidad de la capa (0-1), por defecto 1.
   * - visibility: Verdadero si la capa es visible, falso si queremos que no lo sea.
   *   En este caso la capa sería detectado por los plugins de tablas de
   *   contenidos y aparecería como no visible.
   * - mode: Modo de renderizado de la capa. Valores posibles: 'renderizar' | 'característica'.
   * - extract: Opcional Activa la consulta por click en el objeto geográfico, por defecto falso.
   * - type: Tipo de la capa.
   * - maxExtent: La medida en que restringe la visualización a una región específica.
   * @param {Mx.parameters.LayerOptions} options Estas opciones se mandarán a
   * la implementación de la capa.
   * - style: Define el estilo de la capa.
   * - minZoom. Zoom mínimo aplicable a la capa.
   * - maxZoom. Zoom máximo aplicable a la capa.
   * - visibility. Define si la capa es visible o no. Verdadero por defecto.
   * - displayInLayerSwitcher. Indica si la capa se muestra en el selector de capas.
   * - predefinedStyles: Estilos predefinidos para la capa.
   * @param {Object} implParam Valores de la implementación por defecto,
   * se pasa un objeto implementación MVT.
   * @param {Object} vendorOptions Opciones para la biblioteca base. Ejemplo vendorOptions:
   * <pre><code>
   * import OLSourceVector from 'ol/source/Vector';
   * {
   *  opacity: 0.1,
   *  source: new OLSourceVector({
   *    attributions: 'mvt',
   *    ...
   *  })
   * }
   * </code></pre>
   * @api
   */
  constructor(parameters = {}, options = {}, vendorOptions = {}, implParam = undefined) {
    let opts = parameter.layer(parameters, MVTType);
    const optionsVar = options;
    if (typeof parameters !== 'string') {
      opts = { ...opts, ...parameters };
      optionsVar.maxExtent = parameters.maxExtent;
    }

    const impl = implParam || new MVTTileImpl(opts, optionsVar, vendorOptions);
    super(opts, optionsVar, undefined, impl);

    if (isUndefined(MVTTileImpl)) {
      Exception('La implementación usada no puede crear capas MVT');
    }

    /**
     * MVT minZoom: Límite del zoom mínimo.
     * @public
     * @type {Number}
     */
    this.minZoom = optionsVar.minZoom || Number.NEGATIVE_INFINITY;

    /**
     * MVT maxZoom: Límite del zoom máximo.
     * @public
     * @type {Number}
     */
    this.maxZoom = optionsVar.maxZoom || Number.POSITIVE_INFINITY;

    /**
     * extract: Optional Activa la consulta al hacer clic sobre un objeto geográfico,
     * por defecto falso.
     */
    this.extract = opts.extract === undefined ? false : opts.extract;

    this.mode = opts.mode || mode.RENDER;
  }

  /**
   * Devuelve el valor de la propiedad "extract". La propiedad "extract"
   * activa la consulta al hacer clic sobre un objeto geográfico, por defecto falso.
   * @function
   * @return {M.layer.MVT.impl.extract} Devuelve valor del "extract".
   * @api
   */
  get extract() {
    return this.getImpl().extract;
  }

  /**
   * Sobrescribe el valor de la propiedad "extract". La propiedad "extract"
   * activa la consulta al hacer clic sobre un objeto geográfico, por defecto falso.
   * @function
   * @param {Boolean} newExtract Nuevo valor para el "extract".
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
   * Este método establece el estilo en capa.
   *
   * @function
   * @public
   * @param {M.Style} styleParam Estilos que proporciona el usuario.
   * @param {Boolean} applyToFeature Verdadero el estilo se aplicará a los objetos geográficos,
   * por defecto falso.
   * @param {M.layer.MVT.DEFAULT_OPTIONS_STYLE} defaultStyle Estilos por defecto de la capa.
   * @api
   */
  setStyle(styleParam, applyToFeature = false, defaultStyle = MVT.DEFAULT_OPTIONS_STYLE) {
    super.setStyle(styleParam, applyToFeature, defaultStyle);
  }

  /**
   * Este método obtiene la proyección del mapa.
   *
   * @function
   * @public
   * @returns {M.layer.MVT.impl.getProjection} Devuelve la proyección.
   * @api
   */
  getProjection() {
    return this.getImpl().getProjection();
  }

  /**
   * Obtiene el tipo de geometría de la capa.
   * Tipo de geometría: POINT (Punto), MPOINT (Multiples puntos), LINE (línea),
   * MLINE (Multiples línes), POLYGON (Polígono), or MPOLYGON (Multiples polígonos).
   * @function
   * @public
   * @return {String} Tipo de geometría de la capa.
   * @api
   */
  getGeometryType() {
    let geometry = null;
    const features = this.getFeatures();
    if (!isNullOrEmpty(features)) {
      const firstFeature = features[0];
      if (!isNullOrEmpty(firstFeature)) {
        geometry = firstFeature.getType();
      }
    }
    return geometry;
  }

  /**
   * Devuelve todos los objetos geográficos de la capa.
   *
   * @function
   * @public
   * @return {Array<M.RenderFeature>} Devuelve un array con los objetos geográficos.
   * @api
   */
  getFeatures() {
    const features = this.getImpl().getFeatures();
    return features.map((olFeature) => {
      if (this.mode === mode.RENDER) {
        return RenderFeatureImpl.olFeature2Facade(olFeature);
      }
      if (this.mode === mode.FEATURE) {
        return FeatureImpl.olFeature2Facade(olFeature, undefined, this.getProjection());
      }
      return null;
    });
  }

  /**
   * Devuelve el objeto geográfico con el id pasado por parámetros.
   *
   * @function
   * @public
   * @param {String|Number} id - Id objeto geográfico.
   * @return {Null|Array<M.RenderFeature>} objeto geográfico: devuelve el objeto geográfico con esa
   * identificación si se encuentra, en caso de que no se encuentre o no indique el id
   * devuelve array vacío.
   * @api
   */
  getFeatureById(id) {
    if (isNullOrEmpty(id)) {
      dialog.error(getValue('dialog').id_feature);
      return null;
    }
    const features = this.getImpl().getFeatureById(id);
    features.map((olFeature) => {
      if (this.mode === mode.RENDER) {
        return RenderFeatureImpl.olFeature2Facade(olFeature);
      }
      if (this.mode === mode.FEATURE) {
        return FeatureImpl
          .olFeature2Facade(olFeature, undefined, this.getProjection());
      }
      return null;
    });
    return features;
  }

  /**
   * Devuelve el valor de la propiedad filter.
   *
   * @function
   * @public
   * @api
   */
  getFilter() {}

  /**
   * Modifica el filtro.
   *
   * @function
   * @public
   * @api
   */
  setFilter() {}

  /**
   * Elimina valor de la propiedad "filter".
   *
   * @function
   * @public
   * @api
   */
  removeFilter() {}

  /**
   * Añade objeto geográficos.
   *
   * @function
   * @public
   * @api
   */
  addFeatures() {}

  /**
   * Elimina objeto geográficos.
   *
   * @function
   * @public
   * @api
   */
  removeFeatures() {}

  /**
   * Recarga la capa.
   *
   * @function
   * @public
   * @api
   */
  refresh() {}

  /**
   * Este método redibuja la capa.
   *
   * @function
   * @public
   * @api
   */
  redraw() {}

  /**
   * Transforma la capa en un GeoJSON.
   *
   * @function
   * @public
   * @api
   */
  toGeoJSON() {}
}

/**
 *Estilos por defecto de la capa.
 * @const
 * @type {Object}
 * @public
 * @api
 */
MVT.DEFAULT_PARAMS_STYLE = {
  fill: {
    color: '#fff',
    opacity: 0.6,
  },
  stroke: {
    color: '#827ec5',
    width: 2,
  },
};

/**
 * Opciones por defecto de la capa.
 *
 * @const
 * @type {Object}
 * @public
 * @api
 */
MVT.DEFAULT_OPTIONS_STYLE = {
  point: {
    ...MVT.DEFAULT_PARAMS_STYLE,
    radius: 5,
  },
  line: {
    ...MVT.DEFAULT_PARAMS_STYLE,
  },
  polygon: {
    ...MVT.DEFAULT_PARAMS_STYLE,
  },
};

export default MVT;
