/**
 * @module M/impl/layer/GenericRaster
 */
import { getValue } from 'M/i18n/language';
import {
  isNullOrEmpty,
  isNull,
  getWMSGetCapabilitiesUrl,
  getWMTSGetCapabilitiesUrl,
  extend,
} from 'M/util/Utils';
import {
  WebMapServiceImageryProvider,
  WebMapTileServiceImageryProvider,
} from 'cesium';
import { get as getRemote } from 'M/util/Remote';

import LayerBase from './Layer';
import FormatWMS from '../format/WMS';
import GetCapabilities from '../util/WMSCapabilities';
import getLayerExtent from '../util/wmtscapabilities';
import CesiumFormatWMTSCapabilities from '../format/CesiumWMTSCapabilities';

import ImplUtils from '../util/Utils';

/**
 * @classdesc
 * GenericRaster permite añadir cualquier tipo de capa raster definida con la librería base.
 * @api
 * @extends {M.impl.layer.Layer}
 */
class GenericRaster extends LayerBase {
  /**
   * Constructor principal de la clase.
   *
   * @constructor
   * @param {Mx.parameters.LayerOptions} options Estas opciones se mandarán a
   * la implementación de la capa.
   * - version: Versión GenericRaster.
   * - displayInLayerSwitcher: Indica si la capa se muestra en el selector de capas.
   * - visibility: Indica la visibilidad de la capa.
   * - opacity: Opacidad de capa, por defecto 1.
   * - format: Formato de la capa, por defecto image/png.
   * - styles: Estilos de la capa.
   * - sldBody: Parámetros "Cesium.WebMapServiceImageryProvider"
   * - minZoom: Zoom mínimo aplicable a la capa.
   * - maxZoom: Zoom máximo aplicable a la capa.
   * - queryable: Indica si la capa es consultable.
   * - minScale: Escala mínima.
   * - maxScale: Escala máxima.
   * - minResolution: Resolución mínima.
   * - maxResolution: Resolución máxima.
   * @param {Object} vendorOptions Opciones para la biblioteca base. Ejemplo vendorOptions:
   * <pre><code>
   * import { ImageryLayer, TileMapServiceImageryProvider } from 'cesium';
   * {
   *  new ImageryLayer(new TileMapServiceImageryProvider({
   *    ...
   *  })
   * }
   * </code></pre>
   * @api
   */
  constructor(options = {}, vendorOptions = {}) {
    // calls the super constructor
    super(options, vendorOptions);
    this.options = options;

    /**
    * Layer map. La instancia del mapa.
    */
    this.map = null;

    this.sldBody = options.sldBody;

    /**
     * WMS styles. Estilos de la capa.
     */
    this.styles = this.options.styles || '';

    /**
     * WMS format. Formato de la capa, por defecto image/png.
     */
    this.format = this.options.format;

    this.cesiumLayer = vendorOptions;
    this.maxExtent = options.userMaxExtent || [];
    this.ids = options.ids;
    this.version = options.version;
    this.legend = options.legend;
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

    if (!isNullOrEmpty(this.visibility)) {
      this.cesiumLayer.show = this.visibility;
    }

    if (!isNullOrEmpty(this.maxZoom)) {
      // eslint-disable-next-line no-underscore-dangle
      this.cesiumLayer._maximumTerrainLevel = this.maxZoom - 1;
    }

    if (!isNullOrEmpty(this.minZoom)) {
      // eslint-disable-next-line no-underscore-dangle
      this.cesiumLayer._minimumTerrainLevel = this.minZoom;
    }

    if (!isNullOrEmpty(this.visibility)) {
      this.cesiumLayer.show = this.visibility;
    }

    if (!isNullOrEmpty(this.sldBody)) {
      try {
        // eslint-disable-next-line no-underscore-dangle
        this.cesiumLayer.imageryProvider._tileProvider._resource._queryParameters = extend(
          { sld_body: this.sldBody },
          // eslint-disable-next-line no-underscore-dangle
          this.cesiumLayer.imageryProvider._tileProvider._resource._queryParameters,
          false,
        );
      } catch (error) {
        const err = getValue('exception').sldBODYError
          .replace('[replace1]', this.name)
          .replace('[replace2]', this.cesiumLayer.constructor.name);

        // eslint-disable-next-line no-console
        console.warn(err);
      }
    }

    if (!isNullOrEmpty(this.styles)) {
      try {
        // eslint-disable-next-line no-underscore-dangle
        this.cesiumLayer.imageryProvider._tileProvider._resource._queryParameters = extend(
          { styles: this.styles },
          // eslint-disable-next-line no-underscore-dangle
          this.cesiumLayer.imageryProvider._tileProvider._resource._queryParameters,
          false,
        );
      } catch (error) {
        const err = getValue('exception').styleError
          .replace('[replace1]', this.name)
          .replace('[replace2]', this.cesiumLayer.constructor.name);

        // eslint-disable-next-line no-console
        console.warn(err);
      }
    }

    if (!isNullOrEmpty(this.format)) {
      try {
        // eslint-disable-next-line no-underscore-dangle
        this.cesiumLayer.imageryProvider._tileProvider._resource._queryParameters = extend(
          { format: this.format },
          // eslint-disable-next-line no-underscore-dangle
          this.cesiumLayer.imageryProvider._tileProvider._resource._queryParameters,
          false,
        );
      } catch (error) {
        const err = getValue('exception').formatError
          .replace('[replace1]', this.name)
          .replace('[replace2]', this.cesiumLayer.constructor.name);

        // eslint-disable-next-line no-console
        console.warn(err);
      }
    }

    this.capabilities = this.getCapabilities(this.cesiumLayer, map.getProjection());

    if (!isNullOrEmpty(this.maxExtent)) {
      // eslint-disable-next-line no-underscore-dangle
      this.cesiumLayer._rectangle = ImplUtils.convertExtentToRectangle(this.maxExtent);
    } else if (this.cesiumLayer.imageryProvider instanceof WebMapServiceImageryProvider) {
      if (this.cesiumLayer.rectangle) {
        this.maxExtent = ImplUtils.convertRectangleToExtent(this.cesiumLayer.rectangle);
      } else {
        this.capabilities.then((capabilities) => {
          this.maxExtent = capabilities.getLayerExtent();
          // eslint-disable-next-line no-underscore-dangle
          this.cesiumLayer._rectangle = ImplUtils.convertExtentToRectangle(this.maxExtent);
          // eslint-disable-next-line no-underscore-dangle
          this.facadeLayer_.maxExtent_ = this.maxExtent;
        });
      }
    } else if (this.cesiumLayer.imageryProvider instanceof WebMapTileServiceImageryProvider) {
      const capabilities = this.getCapabilitiesWMTS_(this.cesiumLayer);
      capabilities.then((c) => {
        this.maxExtent = this.getMaxExtentCapabilitiesWMTS_(c);
        // eslint-disable-next-line no-underscore-dangle
        this.cesiumLayer._rectangle = ImplUtils.convertExtentToRectangle(this.maxExtent);
        // eslint-disable-next-line no-underscore-dangle
        this.facadeLayer_.maxExtent_ = this.maxExtent;
      });
    }

    this.cesiumLayer.alpha = this.opacity_;
    this.cesiumLayer.show = this.visibility;

    const zIndex = this.facadeLayer_.isBase ? 0 : null;
    map.getMapImpl().imageryLayers.add(this.cesiumLayer, zIndex);
  }

  /**
   * Este método devuelve el capabilities de la capa.
   * @param {M.layer.WMS} layerCesium Capa de la que se quiere obtener el capabilities.
   * @param {string} projection Proyección del mapa.
   * @return {Promise} Promesa con el capabilities de la capa.
   */
  getCapabilities(layerCesium, projection) {
    const cesiumSource = layerCesium.imageryProvider;
    if (cesiumSource instanceof WebMapServiceImageryProvider) {
      return this.getCapabilitiesWMS_(layerCesium, projection);
    }
    return null;
  }

  /**
   * Este método devuelve el capabilities de la capa.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @param {M.layer.WMS} layerCesium Capa de la que se quiere obtener el capabilities.
   * @param {string} projection Proyección del mapa.
   * @return {Promise} Promesa con el capabilities de la capa.
   * @api
   */
  getCapabilitiesWMS_(layerCesium, projection) {
    const cesiumSource = layerCesium.imageryProvider;

    const layerUrl = cesiumSource.url;

    // serverUrl, version
    return new Promise((success, fail) => {
      const url = getWMSGetCapabilitiesUrl(layerUrl, this.version);
      getRemote(url).then((response) => {
        const getCapabilitiesDocument = response.xml;
        const getCapabilitiesParser = new FormatWMS();
        const getCapabilities = getCapabilitiesParser.customRead(getCapabilitiesDocument);

        const getCapabilitiesUtils = new GetCapabilities(
          getCapabilities,
          layerUrl,
          projection,
        );
        success(getCapabilitiesUtils);
      });
    });
  }

  /**
   * Este método devuelve el capabilities de la capa.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @param {M.layer.WMS} layerCesium Capa de la que se quiere obtener el capabilities.
   * @return {Promise} Promesa con el capabilities de la capa.
   * @api
   */
  getCapabilitiesWMTS_(layerCesium) {
    const cesiumSource = layerCesium.imageryProvider;
    const layerUrl = cesiumSource.url;

    return new Promise((success, fail) => {
      const getCapabilitiesUrl = getWMTSGetCapabilitiesUrl(layerUrl);
      const parser = new CesiumFormatWMTSCapabilities();
      getRemote(getCapabilitiesUrl).then((response) => {
        let getCapabilitiesDocument = response.xml;
        const elementTag = getCapabilitiesDocument.getElementsByTagName('ows:Style');
        if (elementTag.length > 0) {
          const xmlToString = new XMLSerializer().serializeToString(getCapabilitiesDocument);
          const text = xmlToString.replaceAll('ows:Style', 'Style');
          getCapabilitiesDocument = new DOMParser().parseFromString(text, 'text/xml');
        }
        const parsedCapabilities = parser.read(getCapabilitiesDocument);
        try {
          parsedCapabilities.Contents.Layer.forEach((l) => {
            const name = l.Identifier;
            l.Style.forEach((s) => {
              const layerText = response.text.split('Layer>').filter((text) => text.indexOf(`Identifier>${name}<`) > -1)[0];
              /* eslint-disable no-param-reassign */
              s.LegendURL = layerText.split('LegendURL')[1].split('xlink:href="')[1].split('"')[0];
            });
          });
          /* eslint-disable no-empty */
        } catch (err) {}
        success.call(this, parsedCapabilities);
      });
    });
  }

  /**
   * Este método devuelve el extent de la capa.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @param {Object} capabilities Capabilities de la capa.
   * @return {Array<number>} Extent de la capa.
   * @api
   */
  getMaxExtentCapabilitiesWMTS_(capabilities) {
    const contents = capabilities.Contents;
    const defaultExtent = this.map.getMaxExtent();

    if (!isNull(contents)) {
      return getLayerExtent(contents, this.name, this.map.getProjection().code, defaultExtent);
    }
    return defaultExtent;
  }

  /**
   * Este método modifica la URL del servicio.
   *
   * @function
   * @param {String} URL del servicio.
   * @api
   */
  setURLService(url) {
    if (!isNullOrEmpty(this.cesiumLayer) && !isNullOrEmpty(this.cesiumLayer.imageryProvider)
      && !isNullOrEmpty(url)) {
      url = url.replace('{-z}', '{reverseZ}');
      url = url.replace('{-x}', '{reverseX}');
      url = url.replace('{-y}', '{reverseY}');
      if (this.cesiumLayer.imageryProvider instanceof WebMapServiceImageryProvider
        || this.cesiumLayer.imageryProvider instanceof WebMapTileServiceImageryProvider) {
        // eslint-disable-next-line no-underscore-dangle
        this.cesiumLayer.imageryProvider._tileProvider._resource._url = url;
      } else {
        // eslint-disable-next-line no-underscore-dangle
        this.cesiumLayer.imageryProvider._resource._url = url;
      }
    }
  }

  /**
   * Este método obtiene la URL del servicio.
   *
   * @function
   * @returns {String} URL del servicio
   * @api
   */
  getURLService() {
    let url = '';
    if (!isNullOrEmpty(this.cesiumLayer) && !isNullOrEmpty(this.cesiumLayer.imageryProvider)) {
      const source = this.cesiumLayer.imageryProvider;
      if (!isNullOrEmpty(source.url)) {
        url = this.cesiumLayer.imageryProvider.url;
      }
    }
    return url;
  }

  /**
   * Este método establece la clase de la fachada
   * de MBTiles.
   *
   * @function
   * @param {Object} obj Objeto a establecer como fachada.
   * @public
   * @api
   */
  setFacadeObj(obj) {
    this.facadeLayer_ = obj;
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
   * Este método actualiza la capa.
   * @function
   * @api stable
   */
  refresh() {
    const index = this.map.getMapImpl().imageryLayers.indexOf(this.getLayer());
    this.map.getMapImpl().imageryLayers.remove(this.getLayer(), false);
    this.map.getMapImpl().imageryLayers.add(this.getLayer(), index);
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
   * Establece la URL de la leyenda.
   * @function
   * @param {String} newLegend URL de la leyenda.
   * @api stable
   */
  setLegendURL(newLegend) {
    if (!isNullOrEmpty(newLegend)) {
      this.legendUrl_ = newLegend;
    }
  }

  /**
   * Devuelve la extensión máxima de la capa.
   * @function
   * @returns {Array<Number>} Extensión máxima.
   * @api stable
   */
  getMaxExtent() {
    return ImplUtils.convertRectangleToExtent(this.cesiumLayer.getImageryRectangle());
  }

  /**
   * Establece la extensión máxima de la capa.
   * @function
   * @param {Array<Number>} extent Extensión máxima.
   * @api stable
   */
  setMaxExtent(extent) {
    const rectangle = ImplUtils.convertExtentToRectangle(extent);
    if (!isNullOrEmpty(this.cesiumLayer) && this.cesiumLayer.rectangle) {
      // eslint-disable-next-line no-underscore-dangle
      this.cesiumLayer._rectangle = rectangle;

      const index = this.map.getMapImpl().imageryLayers.indexOf(this.getLayer());
      this.map.getMapImpl().imageryLayers.remove(this.getLayer(), false);
      this.map.getMapImpl().imageryLayers.add(this.getLayer(), index);
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
   * Este método establece la versión de la capa.
   * @function
   * @param {String} newVersion Nueva versión de la capa.
   * @api stable
   */
  setVersion(newVersion) {
    this.version = newVersion;
    try {
      // eslint-disable-next-line no-underscore-dangle
      this.cesiumLayer.imageryProvider._tileProvider._resource._queryParameters = extend(
        { version: newVersion },
        // eslint-disable-next-line no-underscore-dangle
        this.cesiumLayer.imageryProvider._tileProvider._resource._queryParameters,
        false,
      );
    } catch (error) {
      const err = getValue('exception').versionError
        .replace('[replace1]', this.name)
        .replace('[replace2]', this.cesiumLayer.constructor.name);

      // eslint-disable-next-line no-console
      console.warn(err);
    }
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
    }
    this.map = null;
  }

  /**
   * Este método devuelve si dos capas con iguales.
   * @param {Object} Capa con la que se quiere comparar.
   * @return {boolean} Devuelve true si las capas son iguales.
   * @api
   */
  equals(obj) {
    let equals = false;
    if (obj instanceof GenericRaster) {
      equals = (this.url === obj.url);
      equals = equals && (this.name === obj.name);
      equals = equals && (this.version === obj.version);
    }

    return equals;
  }
}

export default GenericRaster;
