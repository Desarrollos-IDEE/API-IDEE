/**
 * @module M/layer/MBTilesVector
 */
import MBTilesVectorImpl from 'impl/layer/MBTilesVector';
import RenderFeatureImpl from 'impl/feature/RenderFeature';
import Vector from './Vector';
import * as LayerType from './Type';
import {
  isUndefined, isNullOrEmpty, isString, normalize,
} from '../util/Utils';
import Exception from '../exception/exception';
import { getValue } from '../i18n/language';
import * as parameter from '../parameter/parameter';

/**
 * Modos posibles de MBTilesVector.
 * @public
 * @const
 * @type {Object}
 * @api
 */
export const mode = {
  RENDER: 'render',
  FEATURE: 'feature',
};

/**
 * @classdesc
 * MBTilesVector es un formato que permite agrupar múltiples capas
 * vectoriales en un contenedor SQLite.
 *
 * @property {Boolean} extract Opcional. Activa la consulta haciendo
 * clic en el objeto geográfico,
 *
 * @api
 * @extends {M.layer.Vector}
 */
class MBTilesVector extends Vector {
  /**
   * Constructor principal de la clase. Crea una capa MBTilesVector
   * con parámetros especificados por el usuario.
   *
   * @constructor
   * @param {String|Mx.parameters.MBTilesVector} userParameters Parámetros por la
   * construcción de la capa,
   * estos parámetros los proporciona el usuario.
   * - name: Nombre de la capa.
   * - url: Url del fichero o servicio que genera el MBTilesVector.
   * - type: Tipo de la capa.
   * - maxExtent: La medida en que restringe la visualización a una región específica.
   * - legend: Indica el nombre que aparece en el árbol de contenidos, si lo hay.
   * - tileLoadFunction: Función de carga de la tesela vectorial proporcionada por el usuario.
   * - source: Fuente de la capa.
   * - tileSize: Tamaño de la tesela vectorial, por defecto 256.
   * - visibility: Define si la capa es visible o no. Verdadero por defecto.
   * - extract: Opcional, activa la consulta por click en el objeto geográfico, por defecto falso.
   * @param {Mx.parameters.LayerOptions} options Estas opciones se mandarán a la implementación.
   * - opacity: Opacidad de capa, por defecto 1.
   * - style: Define el estilo de la capa.
   * - displayInLayerSwitcher: Indica si la capa se muestra en el selector de capas.
   * - predefinedStyles: Estilos predefinidos para la capa.
   * - minZoom. Zoom mínimo aplicable a la capa.
   * - maxZoom. Zoom máximo aplicable a la capa.
   * @param {Object} vendorOptions Opciones para la biblioteca base. Ejemplo vendorOptions:
   * <pre><code>
   * import OLSourceVectorTile from 'ol/source/VectorTile';
   * {
   *  opacity: 0.1,
   *  source: new OLSourceVector({
   *    url: '{z},{x},{y}',
   *    ...
   *  })
   * }
   * </code></pre>
   * @api
   */
  constructor(userParameters = {}, options = {}, vendorOptions = {}) {
    const parameters = parameter.layer(userParameters, LayerType.MBTilesVector);

    const optionsVar = options;

    if (typeof userParameters !== 'string') {
      optionsVar.maxExtent = userParameters.maxExtent;
    }

    /**
     * Implementación.
     * @public
     * @implements {M.impl.layer.MBTilesVector}
     * @type {M.impl.layer.MBTilesVector}
     */
    const impl = new MBTilesVectorImpl(parameters, optionsVar, vendorOptions);
    super(parameters, options, undefined, impl);
    if (isUndefined(MBTilesVectorImpl)) {
      Exception(getValue('exception').mbtilesvector_method);
    }

    /**
     * MBTilesVector minZoom: Límite del zoom mínimo.
     * @public
     * @type {Number}
     */
    this.minZoom = optionsVar.minZoom || Number.NEGATIVE_INFINITY;

    /**
     * MBTilesVector maxZoom: Límite del zoom máximo.
     * @public
     * @type {Number}
     */
    this.maxZoom = optionsVar.maxZoom || Number.POSITIVE_INFINITY;

    /**
     * MBTilesVector extract: Activa la consulta al hacer clic sobre un objeto geográfico,
     * por defecto falso.
     */
    this.extract = parameters.extract === undefined ? false : parameters.extract;
  }

  /**
   * Este método establece el estilo de la capa.
   *
   * @function
   * @param {M.Style|String} styleParam Estilo que se aplicará a la capa.
   * @param {bool} applyToFeature Si el valor es verdadero se aplicará a los objetos
   * geográficos, falso no. Por defecto, es falso.
   * @param {M.Style} defaultStyle Estilo por defecto, se define en MBTilesVector.js
   * @public
   * @api
   */
  setStyle(styleParam, applyToFeature = false, defaultStyle = MBTilesVector.DEFAULT_OPTIONS_STYLE) {
    super.setStyle(styleParam, applyToFeature, defaultStyle);
  }

  /**
   * Este método obtiene la proyección del mapa.
   *
   * @function
   * @returns {Mx.Projection} Proyección del mapa.
   * @public
   * @api
   */
  getProjection() {
    return this.getImpl().getProjection();
  }

  /**
   * Obtiene el tipo de geometría de la capa.
   *
   * @function
   * @public
   * @returns {string} Tipo de geometría de la capa.
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
   * Obtiene todos los objetos geográficos.
   *
   * @function
   * @public
   * @returns {Array<M.RenderFeature>} Objetos geográficos.
   * @api
   */
  getFeatures() {
    const features = this.getImpl().getFeatures();
    return features.map((olFeature) => RenderFeatureImpl.olFeature2Facade(olFeature));
  }

  /**
   * Devuelve el valor de la propiedad "extract". La propiedad "extract" tiene la
   * siguiente función: Activa la consulta al hacer clic en la característica, por defecto falso.
   *
   * @function
   * @getter
   * @returns {Boolean} Valor de la propiedad "extract".
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
   * @param {Boolean} newExtract Nuevo valor para sobreescribir la propiedad "extract".
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
   * @param {Object} obj Objeto a comparar.
   * @returns {Boolean} Valor verdadero es igual, falso no lo es.
   * @public
   * @api
   */
  equals(obj) {
    let equals = false;
    if (obj instanceof MBTilesVector) {
      equals = (this.url === obj.url);
      equals = equals && (this.source === obj.source);
      equals = equals && (this.legend === obj.legend);
      equals = equals && (this.name === obj.name);
      equals = equals && (this.options === obj.options);
      equals = equals && (this.extract === obj.extract);
      equals = equals && (this.predefinedStyles === obj.predefinedStyles);
    }
    return equals;
  }

  /**
   * Este método establece los filtros para la capa.
   *
   * @function
   * @public
   * @api
   */
  setFilter() {}

  /**
   * Este método añade objetos geográficos a la capa.
   *
   * @function
   * @public
   * @api
   */
  addFeatures() {}

  /**
   * Este método elimina objetos geográficos de la capa.
   *
   * @function
   * @public
   * @api
   */
  removeFeatures() {}

  /**
   * Este método refresca la capa.
   *
   * @function
   * @public
   * @api
   */
  refresh() {}

  /**
   * Este método vuelve a dibujar la capa.
   *
   * @function
   * @public
   * @api
   */
  redraw() {}

  /**
   * Este método convierte la capa a formato
   * GeoJSON.
   *
   * @function
   * @public
   * @api
   */
  toGeoJSON() {}
}

/**
 * Opciones de estilo por defecto para esta capa.
 *
 * @const
 * @type {Object}
 * @public
 * @api
 */
MBTilesVector.DEFAULT_PARAMS = {
  fill: {
    color: '#fff',
    opacity: 0.6,
  },
  stroke: {
    color: '#827ec5',
    width: 2,
  },
  radius: 5,
};

/**
 * Estilos por defecto de la capa MBTilesVector.
 *
 * @const
 * @type {Object}
 * @public
 * @api
 */
MBTilesVector.DEFAULT_OPTIONS_STYLE = {
  point: {
    ...MBTilesVector.DEFAULT_PARAMS,
  },
  line: {
    ...MBTilesVector.DEFAULT_PARAMS,
  },
  polygon: {
    ...MBTilesVector.DEFAULT_PARAMS,
  },
};
export default MBTilesVector;
