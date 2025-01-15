/**
 * @module M/impl/layer/WMS
 */
import {
  isNullOrEmpty,
  addParameters,
  concatUrlPaths,
  getWMSGetCapabilitiesUrl,
  extend,
  isArray,
} from 'M/util/Utils';
import FacadeLayerBase from 'M/layer/Layer';
import { get as getRemote } from 'M/util/Remote';
import * as EventType from 'M/event/eventtype';
import { ImageryLayer, Rectangle, WebMapServiceImageryProvider } from 'cesium';
import { getValue } from 'M/i18n/language';
import LayerBase from './Layer';
import GetCapabilities from '../util/WMSCapabilities';
import FormatWMS from '../format/WMS';
import ImplUtils from '../util/Utils';

/**
 * @classdesc
 * WMS devuelve un mapa en formato imagen de un conjunto capas ráster o vectoriales.
 * Permitiendo las personalización de las capas mediante estilos. Se trata de un mapa dínamico.
 *
 * @property {Object} options Opciones de la capa WMS.
 * @property {Array<M.layer.WMS>} layers Intancia de WMS con metadatos.
 *
 * @api
 * @extends {M.impl.layer.Layer}
 */
class WMS extends LayerBase {
  /**
   * Constructor principal de la clase. Crea una capa WMS
   * con parámetros especificados por el usuario.
   *
   * @constructor
   * @implements {M.impl.Layer}
   * @param {Mx.parameters.LayerOptions} options Parámetros opcionales para la capa.
   * - opacity: Opacidad de capa, por defecto 1.
   * - singleTile: Indica si la tesela es única o no.
   * - format: Formato de la capa, por defecto image/png.
   * - styles: Estilos de la capa.
   * - sldBody: Parámetros "Cesium.WebMapServiceImageryProvider"
   * - minZoom: Zoom mínimo aplicable a la capa.
   * - maxZoom: Zoom máximo aplicable a la capa.
   * - isWMSfull: establece si la capa es WMS_FULL.
   * @param {Object} vendorOptions Opciones para la biblioteca base. Ejemplo vendorOptions:
   * <pre><code>
   * import { Rectangle } from 'cesium';
   * {
   *  alpha: 0.5,
   *  show: true,
   *  rectangle: Rectangle.fromDegrees(-5, -5, 5, 5),
   *  ...
   * }
   * </code></pre>
   * @api stable
   */
  constructor(options = {}, vendorOptions = {}) {
    // calls the super constructor
    super(options, vendorOptions);

    /**
     * WMS facadeLayer_. Instancia de la fachada.
     */
    this.facadeLayer_ = null;

    /**
     * WMS options. Opciones de la capa.
     */
    this.options = options;

    /**
      * WMS name layers. Capas.
      */
    this.layers = [];

    /**
     * WMS displayInLayerSwitcher. Mostrar en el selector de capas.
     */
    this.displayInLayerSwitcher_ = true;

    /**
     * WMS getCapabilitiesPromise. Metadatos, promesa.
     */
    this.getCapabilitiesPromise = null;

    /**
     * WMS extentPromise. Extensión de la capa, promesa.
     */
    this.extentPromise = null;

    /**
     * WMS extent. Extensión de la capa que se obtuvo del servicio getCapabilities.
     */
    this.extent = null;

    /**
     * WMS resolutions_. Resoluciones de la capa.
     */
    this.resolutions_ = null;

    /**
     * WMS extentProj_. Proyección actual.
     */
    this.extentProj_ = null;

    /**
     * WMS visibility. Indica la visibilidad de la capa.
     */
    if (this.options.visibility === false) {
      this.visibility = false;
    }

    /**
     * WMS tiled. Indica si la tesela es única o no.
     */
    if (isNullOrEmpty(this.tiled)) {
      this.tiled = (this.options.singleTile !== true);
    }

    /**
     * WMS numZoomLevels. Número de niveles de zoom.
     */
    if (isNullOrEmpty(this.options.numZoomLevels)) {
      this.options.numZoomLevels = 20; // by default
    }

    /**
     * WMS format. Formato de la capa, por defecto image/png.
     */
    this.format = isNullOrEmpty(this.options.format) ? 'image/png' : this.options.format;

    /**
      * WMS styles. Estilos de la capa.
      */
    this.styles = this.options.styles || '';

    /**
      * WMS sldBody. Parámetros "Cesium.WebMapServiceImageryProvider"
      */
    this.sldBody = options.sldBody;

    /**
     * WMS minZoom. Zoom mínimo aplicable a la capa.
     */
    this.minZoom = options.minZoom || Number.NEGATIVE_INFINITY;

    /**
      * WMS maxZoom. Zoom máximo aplicable a la capa.
      */
    this.maxZoom = options.maxZoom || Number.POSITIVE_INFINITY;

    /**
      * WMS useCapabilities. Indica si se usa el getCapabilities.
      */
    this.useCapabilities = options.useCapabilities !== false;

    /**
     * isWMSfull. Determina si es WMS_FULL.
    */
    this.isWMSfull = options.isWMSfull;
  }

  /**
   * Este método establece la visibilidad de esta capa.
   *
   * @function
   * @param {Boolean} visibility Verdadero es visible, falso si no.
   * @api stable
   */
  setVisible(visibility) {
    this.visibility = visibility;
    // if this layer is base then it hides all base layers
    if ((visibility === true) && (this.transparent !== true)) {
      // set this layer visible
      if (!isNullOrEmpty(this.cesiumLayer)) {
        this.cesiumLayer.show = visibility;
      }
    } else if (!isNullOrEmpty(this.cesiumLayer)) {
      this.cesiumLayer.show = visibility;
    }
  }

  /**
   * Este método indica si la capa es consultable.
   *
   * @function
   * @returns {Boolean} Verdadero es consultable, falso si no.
   * @api stable
   * @expose
   */
  isQueryable() {
    return (this.options.queryable !== false);
  }

  /**
   * Este método agrega la capa al mapa.
   *
   * @public
   * @function
   * @param {M.impl.Map} map Mapa de la implementación.
   * @api stable
   */
  addTo(map) {
    this.map = map;
    this.fire(EventType.ADDED_TO_MAP);

    if (this.useCapabilities || this.isWMSfull) {
      // just one WMS layer and useCapabilities
      this.getCapabilities().then((capabilities) => {
        this.addSingleLayer_(capabilities);
      });
    } else {
      // just one WMS layer
      this.addSingleLayer_(null);
    }

    if (!this.isWMSfull
      && this.legendUrl_ === concatUrlPaths([M.config.THEME_URL, FacadeLayerBase.LEGEND_DEFAULT])) {
      this.legendUrl_ = addParameters(this.url, {
        SERVICE: 'WMS',
        VERSION: this.version,
        REQUEST: 'GetLegendGraphic',
        LAYER: this.name,
        FORMAT: 'image/png',
        // EXCEPTIONS: 'image/png',
      });
    }
  }

  /**
   * Este método establece las resoluciones para esta capa.
   * No disponible para Cesium.
   *
   * @public
   * @function
   * @param {Array<Number>} resolutions Nuevas resoluciones a aplicar.
   * @api stable
   */
  setResolutions(resolutions) {
    // eslint-disable-next-line no-console
    console.warn(getValue('exception').no_setresolutionslayer);
  }

  /**
   * Este método agrega esta capa como capa única.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   *
   * @public
   * @param {Object} capabilities Metadatos de la capa
   * @function
   * @api stable
   */
  addSingleLayer_(capabilities) {
    const selff = this;
    let extent = this.facadeLayer_.userMaxExtent;
    if (capabilities) {
      const capabilitiesLayer = capabilities.capabilities.Capability.Layer.Layer;
      if (isArray(capabilitiesLayer)) {
        if (this.isWMSfull) {
          capabilitiesLayer.forEach(({ Name }) => {
            this.layers.push(Name);
          });
        }
        this.layers = this.layers.toString();
        const formatCapabilities = this.formatCapabilities_(capabilitiesLayer, selff);
        this.addCapabilitiesMetadata(formatCapabilities);
      }
      this.addCapabilitiesMetadata(capabilitiesLayer);

      if (isNullOrEmpty(extent)) {
        extent = this.facadeLayer_.calculateMaxExtentWithCapabilities(capabilities);
        // eslint-disable-next-line no-underscore-dangle
        this.facadeLayer_.maxExtent_ = extent;
      }
    }

    const opacity = this.opacity_;
    const visible = this.visibility && (this.options.visibility !== false);
    const source = this.createCesiumSource_();
    if (isNullOrEmpty(extent)) {
      extent = this.map.getProjection().getExtent();
    }

    this.cesiumLayer = new ImageryLayer(
      source,
      extend({
        show: visible,
        minimumTerrainLevel: this.minZoom,
        maximumTerrainLevel: this.maxZoom - 1,
        rectangle: Rectangle.fromDegrees(extent[0], extent[1], extent[2], extent[3]),
        alpha: opacity || 1,
      }, this.vendorOptions_, true),
    );

    const zIndex = this.facadeLayer_.isBase ? 0 : null;
    this.map.getMapImpl().imageryLayers.add(this.cesiumLayer, zIndex);

    this.setVisible(this.visibility);
  }

  // Devuelve un capabilities formateado en el caso
  // de que sea un array
  formatCapabilities_(capabilites, selff) {
    let capabilitiesLayer = capabilites;
    for (let i = 0, ilen = capabilitiesLayer.length; i < ilen; i += 1) {
      if (capabilitiesLayer[i] !== undefined && capabilitiesLayer[i].Name !== undefined
        // eslint-disable-next-line no-underscore-dangle
        && capabilitiesLayer[i].Name === selff.facadeLayer_.name) {
        capabilitiesLayer = capabilitiesLayer[i];

        try {
          this.legendUrl_ = capabilitiesLayer.Style[0].LegendURL[0].OnlineResource;
          /* eslint-disable no-empty */
        } catch (err) {}
      } else if (capabilitiesLayer[i] !== undefined && capabilitiesLayer[i].Layer !== undefined) {
        if (capabilitiesLayer[i].Layer
          // eslint-disable-next-line no-underscore-dangle
          .filter((l) => l.Name === selff.facadeLayer_.name)[0] !== undefined) {
          capabilitiesLayer = capabilitiesLayer[i].Layer
            // eslint-disable-next-line no-underscore-dangle
            .filter((l) => l.Name === selff.facadeLayer_.name)[0];
          try {
            this.legendUrl_ = capabilitiesLayer.Style[0].LegendURL[0].OnlineResource;
            /* eslint-disable no-empty */
          } catch (err) {}
        }
      }
    }

    return capabilitiesLayer;
  }

  /**
   * Este método agrega metadatos.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   *
   * @public
   * @function
   * @param {Object} capabilitiesLayer Metadatos de la capa.
   * @api stable
   */
  addCapabilitiesMetadata(capabilitiesLayer) {
    const abstract = !isNullOrEmpty(capabilitiesLayer.Abstract) ? capabilitiesLayer.Abstract : '';
    const attribution = !isNullOrEmpty(capabilitiesLayer.Attribution) ? capabilitiesLayer.Attribution : '';
    const metadataURL = !isNullOrEmpty(capabilitiesLayer.MetadataURL) ? capabilitiesLayer.MetadataURL : '';
    const style = !isNullOrEmpty(capabilitiesLayer.Style) ? capabilitiesLayer.Style : '';

    const capabilitiesMetadata = {
      abstract,
      attribution,
      metadataURL,
      style,
    };
    if (this.facadeLayer_.capabilitiesMetadata === undefined) {
      this.facadeLayer_.capabilitiesMetadata = capabilitiesMetadata;
    }
  }

  /**
   * Este método crea la fuente ol para esta instancia.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @public
   * @function
   * @return {cesium.ImageryProvider} Proveedor de Cesium.
   * @api
   */
  createCesiumSource_() {
    const layerParams = {
      LAYERS: isNullOrEmpty(this.layers) ? this.name : this.layers,
      VERSION: this.version,
      TRANSPARENT: this.transparent,
      FORMAT: this.format,
      STYLES: this.styles,
    };

    if (this.version !== '1.3.0') {
      layerParams.TILED = this.tiled;
    }

    if (!isNullOrEmpty(this.sldBody)) {
      layerParams.SLD_BODY = this.sldBody;
    }

    if (!isNullOrEmpty(this.options.params)) {
      Object.keys(this.options.params).forEach((key) => {
        layerParams[key.toUpperCase()] = this.options.params[key];
      });
    }

    if (this.tiled !== true) {
      // eslint-disable-next-line no-console
      console.warn(getValue('exception').no_notiled);
    }

    const cesiumSource = new WebMapServiceImageryProvider({
      url: this.url,
      layers: this.name,
      parameters: layerParams,
      enablePickFeatures: false,
    });

    return cesiumSource;
  }

  /**
   * Este método obtiene la extensión.
   *
   * @public
   * @function
   * @returns {Array<Number>} Extensión, asincrono.
   * @api stable
   */
  getExtent() {
    const cesiumProjection = this.map.getProjection().code;
    this.extentPromise = new Promise((success, fail) => {
      if (!isNullOrEmpty(this.extent_)) {
        this.extent_ = ImplUtils.transformExtent(this.extent_, this.extentProj_, cesiumProjection);
        this.extentProj_ = cesiumProjection;
        success(this.extent_);
      } else {
        this.getCapabilities().then((getCapabilities) => {
          this.extent_ = getCapabilities.getLayerExtent(this.name);
          this.extentProj_ = cesiumProjection;
          success(this.extent_);
        });
      }
    });
    return this.extentPromise;
  }

  /**
   * Este método obtiene la resolución mínima.
   *
   * @public
   * @function
   * @return {Number} Resolución mínima.
   * @api stable
   */
  getMinResolution() {
    return undefined;
  }

  /**
   * Este método obtiene la resolución máxima para
   * este WMS.
   *
   *
   * @public
   * @function
   * @return {Number} Resolución Máxima.
   * @api stable
   */
  getMaxResolution() {
    return undefined;
  }

  /**
   * Actualiza la resolución mínima y máxima de la capa.
   * No disponible para Cesium.
   *
   * @public
   * @function
   * @param {*} projection Proyección del mapa.
   * @api stable
   */
  updateMinMaxResolution(projection) {
    // eslint-disable-next-line no-console
    console.warn(getValue('exception').no_updateminmaxresolution);
  }

  /**
   * Este método obtiene el número de niveles de zoom
   * disponibles para la capa WMS.
   *
   * @public
   * @function
   * @returns {Number} Número de niveles de zoom.
   * @api stable
   */
  getNumZoomLevels() {
    return this.options.numZoomLevels;
  }

  /**
   * Devuelve las capas WMS.
   *
   * @public
   * @function
   * @return {String} Capa WMS.
   * @api stable
   */
  getLayers() {
    return this.layers;
  }

  /**
   * Devuelve los metadatos, asincrono.
   *
   * @public
   * @function
   * @returns {capabilities} Metadatos.
   * @api stable
   */
  getCapabilities() {
    const capabilitiesInfo = this.map.collectionCapabilities.find((cap) => {
      return cap.url === this.url;
    }) || { capabilities: false };

    if (capabilitiesInfo.capabilities) {
      this.getCapabilitiesPromise = capabilitiesInfo.capabilities;
    } else if (isNullOrEmpty(this.getCapabilitiesPromise)) {
      const layerUrl = this.url;
      const layerVersion = this.version;
      const projection = this.map.getProjection();
      this.getCapabilitiesPromise = new Promise((success, fail) => {
        // gest the capabilities URL
        const wmsGetCapabilitiesUrl = getWMSGetCapabilitiesUrl(layerUrl, layerVersion);
        // gets the getCapabilities response
        getRemote(wmsGetCapabilitiesUrl).then((response) => {
          const getCapabilitiesDocument = response.xml;
          const getCapabilitiesParser = new FormatWMS();
          const getCapabilities = getCapabilitiesParser.customRead(getCapabilitiesDocument);
          const getCapabilitiesUtils = new GetCapabilities(getCapabilities, layerUrl, projection);
          success(getCapabilitiesUtils);
        });
      });
      capabilitiesInfo.capabilities = this.getCapabilitiesPromise;
    }

    return this.getCapabilitiesPromise;
  }

  /**
   * Devuelve la URL de la leyenda.
   *
   * @public
   * @function
   * @returns {String} URL de la leyenda.
   * @api stable
   */
  getLegendURL() {
    return this.legendUrl_;
  }

  /**
   * Sobrescribe la leyenda.
   *
   * @public
   * @function
   * @param {String} legendUrl URL de la leyenda.
   * @api stable
   */
  setLegendURL(legendUrl) {
    this.legendUrl_ = legendUrl;
  }

  /**
   * Este método actualiza el estado de este
   * capa.
   *
   * @public
   * @function
   * @api stable
   * @export
   */
  refresh() {
    const index = this.map.getMapImpl().imageryLayers.indexOf(this.getLayer());
    this.map.getMapImpl().imageryLayers.remove(this.getLayer(), false);
    this.map.getMapImpl().imageryLayers.add(this.getLayer(), index);
  }

  /**
   * Devuelve la extensión de los metadatos.
   *
   * @public
   * @function
   * @param {capabilities} capabilities Metadatos WMS.
   * @returns {Array<Number>} WMS Extensión.
   * @api stable
   */
  getExtentFromCapabilities(capabilities) {
    const name = this.facadeLayer_.name;
    const extent = capabilities.getLayerExtent(name) ? capabilities.getLayerExtent(name) : [];
    return extent;
  }

  /**
   * Este método establece la clase de fachada WMS.
   * La fachada se refiere a
   * un patrón estructural como una capa de abstracción con un patrón de diseño.
   *
   * @function
   * @param {object} obj WMS de la fachada.
   * @api stable
   */
  setFacadeObj(obj) {
    this.facadeLayer_ = obj;
  }

  /**
   * Este método destruye esta capa, limpiando el HTML
   * y anulando el registro de todos los eventos.
   *
   * @public
   * @function
   * @api stable
   */
  destroy() {
    const cesiumMap = this.map.getMapImpl();
    if (!isNullOrEmpty(this.cesiumLayer)) {
      cesiumMap.imageryLayers.remove(this.cesiumLayer);
      this.cesiumLayer = null;
    }
    this.map = null;
  }

  /**
   * Este método comprueba si un objeto es igual
   * a esta capa.
   *
   * @function
   * @param {Object} obj Objeto a comparar.
   * @returns {Boolean} Verdadero es igual, falso si no.
   * @api stable
   */
  equals(obj) {
    let equals = false;
    if (obj instanceof WMS) {
      equals = (this.url === obj.url);
      equals = equals && (this.name === obj.name);
      equals = equals && (this.version === obj.version);
    }

    return equals;
  }
}

/**
 * WMS LEGEND_IMAGE.
 *
 * Imagen de la leyenda por defecto.
 *
 * @public
 * @const
 * @type {string | null}
 * @api stable
 */
WMS.LEGEND_IMAGE = null;

export default WMS;
