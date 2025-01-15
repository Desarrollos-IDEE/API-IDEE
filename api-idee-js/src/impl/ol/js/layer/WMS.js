/* eslint-disable no-underscore-dangle */
/**
 * @module M/impl/layer/WMS
 */
import OLSourceImageWMS from 'ol/source/ImageWMS';
import {
  isNull, isArray, isNullOrEmpty, addParameters, getWMSGetCapabilitiesUrl, fillResolutions,
  getResolutionFromScale, generateResolutionsFromExtent, concatUrlPaths, extend,
} from 'M/util/Utils';
import FacadeLayerBase from 'M/layer/Layer';
import * as LayerType from 'M/layer/Type';
import { get as getRemote } from 'M/util/Remote';
import * as EventType from 'M/event/eventtype';
import OLLayerTile from 'ol/layer/Tile';
import OLLayerImage from 'ol/layer/Image';
import { get as getProj } from 'ol/proj';
import OLTileGrid from 'ol/tilegrid/TileGrid';
import { getBottomLeft } from 'ol/extent';
import ImplUtils from '../util/Utils';
import ImplMap from '../Map';
import LayerBase from './Layer';
import GetCapabilities from '../util/WMSCapabilities';
import FormatWMS from '../format/WMS';
import TileWMS from '../source/TileWMS';
import ImageWMS from '../source/ImageWMS';

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
   * - animated: Define si la capa está animada,
   * el valor predeterminado es falso.
   * - format: Formato de la capa, por defecto image/png.
   * - styles: Estilos de la capa.
   * - sldBody: Parámetros "ol.source.ImageWMS"
   * - minZoom: Zoom mínimo aplicable a la capa.
   * - maxZoom: Zoom máximo aplicable a la capa.
   * - minScale: Escala mínima.
   * - maxScale: Escala máxima.
   * - minResolution: Resolución mínima.
   * - maxResolution: Resolución máxima.
   * - ratio: determina el tamaño de las solicitudes de las imágenes. 1 significa que tienen el
   * tamaño de la ventana, 2 significa que tienen el doble del tamaño de la ventana,
   * y así sucesivamente. Debe ser 1 o superior. Por defecto es 1.
   * crossOrigin: Atributo crossOrigin para las imágenes cargadas.
   * - isWMSfull: establece si la capa es WMS_FULL.
   * @param {Object} vendorOptions Opciones para la biblioteca base. Ejemplo vendorOptions:
   * <pre><code>
   * import OLSourceTileWMS from 'ol/source/TileWMS';
   * {
   *  opacity: 0.1,
   *  source: new OLSourceTileWMS({
   *    attributions: 'wms',
   *    ...
   *  })
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
     * WMS animated. Define si la capa está animada,
     * el valor predeterminado es falso.
     */
    if (isNullOrEmpty(this.options.animated)) {
      this.options.animated = false; // by default
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
     * WMS sldBody. Parámetros "ol.source.ImageWMS"
     */
    this.sldBody = options.sldBody;

    /**
     * WMS zIndex_. Índice de la capa, (+40).
     */
    this.zIndex_ = ImplMap.Z_INDEX[LayerType.WMS];

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
     * WMS ratio. Tamaño de las solicitudes de las imágenes.
     */
    this.ratio = options.ratio || 1;
    if (options.ratio < 1) {
      // eslint-disable-next-line no-console
      console.error('El ratio debe ser 1 o superior');
    }

    /**
     * CrossOrigin. Atributo crossOrigin para las imágenes cargadas.
     */
    this.crossOrigin = (options.crossOrigin === null || options.crossOrigin === false) ? undefined : 'anonymous';

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
      // hides all base layers
      this.map.getBaseLayers()
        .filter((layer) => !layer.equals(this.facadeLayer_) && layer.isVisible())
        .forEach((layer) => layer.setVisible(false));

      // set this layer visible
      if (!isNullOrEmpty(this.ol3Layer)) {
        this.ol3Layer.setVisible(visibility);
      }

      // updates resolutions and keep the zoom
      const oldZoom = this.map.getZoom();
      this.map.getImpl().updateResolutionsFromBaseLayer();
      if (!isNullOrEmpty(oldZoom)) {
        this.map.setZoom(oldZoom);
      }
    } else if (!isNullOrEmpty(this.ol3Layer)) {
      this.ol3Layer.setVisible(visibility);
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
  addTo(map, addLayer = true) {
    this.addLayerToMap_ = addLayer;
    this.map = map;
    this.fire(EventType.ADDED_TO_MAP);

    // calculates the resolutions from scales
    if (!isNull(this.options)
      && !isNull(this.options.minScale) && !isNull(this.options.maxScale)) {
      const units = this.map.getProjection().units;
      this.options.minResolution = getResolutionFromScale(this.options.minScale, units);
      this.options.maxResolution = getResolutionFromScale(this.options.maxScale, units);
    }

    if (this.tiled === true) {
      this.ol3Layer = new OLLayerTile(this.paramsOLLayers());
    } else {
      this.ol3Layer = new OLLayerImage(this.paramsOLLayers());
    }

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

  paramsOLLayers() {
    return extend({
      visible: this.visibility && (this.options.visibility !== false),
      minResolution: this.options.minResolution,
      maxResolution: this.options.maxResolution,
      opacity: this.opacity_,
      zIndex: this.zIndex_,
    }, this.vendorOptions_, true);
  }

  /**
   * Este método establece las resoluciones para esta capa.
   *
   * @public
   * @function
   * @param {Array<Number>} resolutions Nuevas resoluciones a aplicar.
   * @api stable
   */
  setResolutions(resolutions) {
    this.resolutions_ = resolutions;
    this.facadeLayer_.calculateMaxExtent().then((extent) => {
      if (!isNullOrEmpty(this.ol3Layer)) {
        const minResolution = this.options.minResolution;
        const maxResolution = this.options.maxResolution;
        const source = this.createOLSource_(resolutions, minResolution, maxResolution, extent);
        this.ol3Layer.setSource(source);
        this.ol3Layer.setExtent(extent);
      }
    });
  }

  /**
   * Este método agrega esta capa como capa única.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   *
   * @public
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
        const formatCapabilities = this.formatCapabilities_(capabilitiesLayer, selff);
        this.addCapabilitiesMetadata(formatCapabilities);
      }
      this.addCapabilitiesMetadata(capabilitiesLayer);

      if (isNullOrEmpty(extent)) {
        extent = this.facadeLayer_.calculateMaxExtentWithCapabilities(capabilities);
        this.facadeLayer_.maxExtent_ = extent;
      }
    }

    const minResolution = this.options.minResolution;
    const maxResolution = this.options.maxResolution;
    const zIndex = this.zIndex_;
    let resolutions = this.map.getResolutions();
    if (isNullOrEmpty(resolutions) && !isNullOrEmpty(this.resolutions_)) {
      resolutions = this.resolutions_;
    } else if (isNullOrEmpty(resolutions)) {
      // generates the resolution
      const zoomLevels = this.getNumZoomLevels();
      const size = this.map.getMapImpl().getSize();
      const units = this.map.getProjection().units;
      if (!isNullOrEmpty(minResolution) && !isNullOrEmpty(maxResolution)) {
        resolutions = fillResolutions(minResolution, maxResolution, zoomLevels);
      } else {
        resolutions = generateResolutionsFromExtent(extent, size, zoomLevels, units);
      }
    }

    const source = this.createOLSource_(resolutions, minResolution, maxResolution, extent);
    this.ol3Layer.setSource(source);

    if (this.addLayerToMap_) {
      this.map.getMapImpl().addLayer(this.ol3Layer);
    }

    this.setVisible(this.visibility);

    // sets its z-index
    if (zIndex !== null) {
      this.setZIndex(zIndex);
    }
    // sets the resolutions
    if (this.resolutions_ !== null) {
      this.setResolutions(this.resolutions_);
    }
    // activates animation for base layers or animated parameters
    const animated = ((this.transparent === false) || (this.options.animated === true));
    this.ol3Layer.set('animated', animated);
    this.ol3Layer.setMaxZoom(this.maxZoom);
    this.ol3Layer.setMinZoom(this.minZoom);
  }

  // Devuelve un capabilities formateado en el caso
  // de que sea un array
  formatCapabilities_(capabilites, selff) {
    let capabilitiesLayer = capabilites;
    for (let i = 0, ilen = capabilitiesLayer.length; i < ilen; i += 1) {
      if (capabilitiesLayer[i] !== undefined && capabilitiesLayer[i].Name !== undefined
        && (capabilitiesLayer[i].Name.toUpperCase() === selff.facadeLayer_.name.toUpperCase()
          || (capabilitiesLayer[i].Identifier !== undefined
            && capabilitiesLayer[i].Identifier.includes(selff.facadeLayer_.name)))) {
        capabilitiesLayer = capabilitiesLayer[i];

        try {
          this.legendUrl_ = capabilitiesLayer.Style[0].LegendURL[0].OnlineResource;
          // this.legendUrl_ = capabilitiesLayer.Style
          // .find((s) => s.Name === this.styles).LegendURL[0].OnlineResource;
        } catch (err) { /* Continue */ }
      } else if (capabilitiesLayer[i] !== undefined && capabilitiesLayer[i].Layer !== undefined) {
        if (capabilitiesLayer[i].Layer.some((l) => l.Name === selff.facadeLayer_.name)) {
          capabilitiesLayer = capabilitiesLayer[i].Layer
            .find((l) => l.Name === selff.facadeLayer_.name);
          try {
            this.legendUrl_ = capabilitiesLayer.Style[0].LegendURL[0].OnlineResource;
            // this.legendUrl_ = capabilitiesLayer.Style
            // .find((s) => s.Name === this.styles).LegendURL[0].OnlineResource;
          } catch (err) { /* Continue */ }
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
   * @param {Array<Number>} resolutions Resolución
   * @param {Number} minResolution Resolución máxima.
   * @param {Number} maxResolution Resolución mínima.
   * @param {Array} extent Extensión.
   * @return {ol.source} Fuente de Openlayers.
   * @api
   */
  createOLSource_(resolutions, minResolution, maxResolution, extent) {
    let olSource = this.vendorOptions_.source;
    if (isNullOrEmpty(this.vendorOptions_.source)) {
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

      const opacity = this.opacity_;
      const zIndex = this.zIndex_;
      if (this.tiled === true) {
        const tileGrid = (this.useCapabilities)
          ? new OLTileGrid({ resolutions, extent, origin: getBottomLeft(extent) })
          : false;
        olSource = new TileWMS({
          crossOrigin: this.crossOrigin, // crossOrigin inicial
          url: this.url,
          params: layerParams,
          tileGrid,
          extent,
          minResolution,
          maxResolution,
          opacity,
          zIndex,
        });
      } else {
        olSource = new ImageWMS({
          crossOrigin: this.crossOrigin, // crossOrigin inicial
          url: this.url,
          params: layerParams,
          // resolutions,
          extent,
          minResolution,
          maxResolution,
          opacity,
          zIndex,
          ratio: this.ratio,
        });
      }
    }
    return olSource;
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
    const olProjection = getProj(this.map.getProjection().code);

    // creates the promise
    this.extentPromise = new Promise((success, fail) => {
      if (!isNullOrEmpty(this.extent_)) {
        this.extent_ = ImplUtils.transformExtent(this.extent_, this.extentProj_, olProjection);
        this.extentProj_ = olProjection;
        success(this.extent_);
      } else {
        this.getCapabilities().then((getCapabilities) => {
          this.extent_ = getCapabilities.getLayerExtent(this.name);
          this.extentProj_ = olProjection;
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
    return this.options.minResolution;
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
    return this.options.maxResolution;
  }

  /**
   * Actualiza la resolución mínima y máxima de la capa.
   *
   * @public
   * @function
   * @param {ol.Projection} projection Proyección del mapa.
   * @api stable
   */
  updateMinMaxResolution(projection) {
    if (!isNullOrEmpty(this.options.minResolution)) {
      this.options.minResolution = getResolutionFromScale(this.options.minScale, projection.units);
      this.ol3Layer.setMinResolution(this.options.minResolution);
    }

    if (!isNullOrEmpty(this.options.maxResolution)) {
      this.options.maxResolution = getResolutionFromScale(this.options.maxScale, projection.units);
      this.ol3Layer.setMaxResolution(this.options.maxResolution);
    }
  }

  /**
   * Sobrescribe la extensión máxima de la capa.
   *
   * @public
   * @function
   * @param {maxExtent} maxExtent Extensión máxima.
   * @api stable
   */
  setMaxExtent(maxExtent) {
    // maxExtentPromise.then((maxExtent) => {
    const minResolution = this.options.minResolution;
    const maxResolution = this.options.maxResolution;
    this.getLayer().setExtent(maxExtent);
    if (this.tiled === true) {
      let resolutions = this.map.getResolutions();
      if (isNullOrEmpty(resolutions) && !isNullOrEmpty(this.resolutions_)) {
        resolutions = this.resolutions_;
      }
      // gets the tileGrid
      if (!isNullOrEmpty(resolutions)) {
        const source = this.createOLSource_(resolutions, minResolution, maxResolution, maxExtent);
        this.ol3Layer.setSource(source);
      }
    }
    // });
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
   * @return {M.layer.WMS.impl} Capa WMS.
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
    const vendorSource = this.vendorOptions_.source;
    let url = this.url;
    if (vendorSource) {
      url = vendorSource instanceof OLSourceImageWMS
        ? vendorSource.getUrl() : vendorSource.getUrls()[0];
    }
    const capabilitiesInfo = this.map.collectionCapabilities.find((cap) => {
      return cap.url === url;
    }) || { capabilities: false };

    if (capabilitiesInfo.capabilities) {
      this.getCapabilitiesPromise = capabilitiesInfo.capabilities;
    } else if (isNullOrEmpty(this.getCapabilitiesPromise)) {
      const layerUrl = url;
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
    const ol3Layer = this.getLayer();
    if (!isNullOrEmpty(ol3Layer)) {
      ol3Layer.getSource().changed();
    }
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
    const olMap = this.map.getMapImpl();
    if (!isNullOrEmpty(this.ol3Layer)) {
      olMap.removeLayer(this.ol3Layer);
      this.ol3Layer = null;
    }
    if (!isNullOrEmpty(this.layers)) {
      this.layers.map(this.map.removeLayers, this.map);
      this.layers.length = 0;
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
