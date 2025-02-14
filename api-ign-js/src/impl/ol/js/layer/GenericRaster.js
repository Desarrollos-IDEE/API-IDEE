/**
 * @module M/impl/layer/GenericRaster
 */
import * as LayerType from 'M/layer/Type';
import { getValue } from 'M/i18n/language';
import {
  isUndefined, isNull, isNullOrEmpty, getWMSGetCapabilitiesUrl, getWMTSGetCapabilitiesUrl,
  getResolutionFromScale,
} from 'M/util/Utils';
import TileWMS from 'ol/source/TileWMS';
import ImageWMS from 'ol/source/ImageWMS';
import OLSourceWMTS from 'ol/source/WMTS';
import OLFormatWMTSCapabilities from 'ol/format/WMTSCapabilities';
import { get as getRemote } from 'M/util/Remote';
import { get as getProj } from 'ol/proj';

import LayerBase from './Layer';
import FormatWMS from '../format/WMS';
import GetCapabilities from '../util/WMSCapabilities';
import getLayerExtent from '../util/wmtscapabilities';

import ImplMap from '../Map';
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
   * - sldBody: Parámetros "ol.source.ImageWMS"
   * - minZoom: Zoom mínimo aplicable a la capa.
   * - maxZoom: Zoom máximo aplicable a la capa.
   * - queryable: Indica si la capa es consultable.
   * - minScale: Escala mínima.
   * - maxScale: Escala máxima.
   * - minResolution: Resolución mínima.
   * - maxResolution: Resolución máxima.
   * crossOrigin: Atributo crossOrigin para las imágenes cargadas.
   * @param {Object} vendorOptions Opciones para la biblioteca base. Ejemplo vendorOptions:
   * <pre><code>
   * import OLSourceTileWMS from 'ol/source/TileWMS';
   * {
   *  source: new OLSourceTileWMS({
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

    /**
     * WMS zIndex_. Índice de la capa, (+40).
     */
    this.zIndex_ = ImplMap.Z_INDEX[LayerType.GenericRaster];

    this.sldBody = options.sldBody;

    /**
     * WMS styles. Estilos de la capa.
     */
    this.styles = this.options.styles || '';

    this.style = vendorOptions.getStyle === undefined ? null : vendorOptions.getStyle().name;

    if (this.style !== 'createDefaultStyle' && vendorOptions.getStyle) {
      this.style = vendorOptions.getStyle();
    }

    /**
     * WMS format. Formato de la capa, por defecto image/png.
     */
    this.format = this.options.format;

    this.ol3Layer = vendorOptions;
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
  addTo(map, addLayer = true) {
    this.map = map;

    if (!isNullOrEmpty(this.visibility)) {
      this.ol3Layer.setVisible(this.visibility);
    }

    if (!isNullOrEmpty(this.maxZoom)) {
      this.ol3Layer.setMaxZoom(this.maxZoom);
    }

    if (!isNullOrEmpty(this.minZoom)) {
      this.ol3Layer.setMinZoom(this.minZoom);
    }

    if (!isNullOrEmpty(this.zIndex_)) {
      this.ol3Layer.setZIndex(this.zIndex_);
    }

    if (!isNullOrEmpty(this.visibility)) {
      this.ol3Layer.setVisible(this.visibility);
    }

    if (!isNullOrEmpty(this.sldBody)) {
      try {
        this.ol3Layer.getSource().updateParams({ SLD_BODY: this.sldBody });
      } catch (error) {
        const err = getValue('exception').sldBODYError
          .replace('[replace1]', this.name)
          .replace('[replace2]', this.ol3Layer.constructor.name);

        // eslint-disable-next-line no-console
        console.warn(err);
      }
    }

    if (!isNullOrEmpty(this.styles)) {
      try {
        this.ol3Layer.getSource().updateParams({ STYLES: this.styles });
      } catch (error) {
        const err = getValue('exception').styleError
          .replace('[replace1]', this.name)
          .replace('[replace2]', this.ol3Layer.constructor.name);

        // eslint-disable-next-line no-console
        console.warn(err);
      }
    }

    if (!isNullOrEmpty(this.format)) {
      try {
        this.ol3Layer.getSource().updateParams({ FORMAT: this.format });
      } catch (error) {
        const err = getValue('exception').formatError
          .replace('[replace1]', this.name)
          .replace('[replace2]', this.ol3Layer.constructor.name);

        // eslint-disable-next-line no-console
        console.warn(err);
      }
    }

    this.capabilities = this.getCapabilities(this.ol3Layer, map.getProjection());

    if (!isNullOrEmpty(this.maxExtent)) {
      this.ol3Layer.setExtent(this.maxExtent);
    } else if (
      this.ol3Layer.getSource() instanceof TileWMS
        || this.ol3Layer.getSource() instanceof ImageWMS) {
      if (this.ol3Layer.getExtent()) {
        this.maxExtent = this.ol3Layer.getExtent();
        this.ol3Layer.setExtent(this.maxExtent);
      } else {
        this.capabilities.then((capabilities) => {
          this.maxExtent = capabilities.getLayerExtent();
          this.ol3Layer.setExtent(this.maxExtent);
          // eslint-disable-next-line no-underscore-dangle
          this.facadeLayer_.maxExtent_ = this.maxExtent;
        });
      }
    } else if ((this.ol3Layer.getSource() instanceof OLSourceWMTS)) {
      const capabilities = this.getCapabilitiesWMTS_(this.ol3Layer);
      capabilities.then((c) => {
        this.maxExtent = this.getMaxExtentCapabilitiesWMTS_(c);
        this.ol3Layer.setExtent(this.maxExtent);
        // eslint-disable-next-line no-underscore-dangle
        this.facadeLayer_.maxExtent_ = this.maxExtent;
      });
    }

    if (!isUndefined(this.ol3Layer.getSource().getLegendUrl)) {
      this.legendUrl_ = this.ol3Layer.getSource().getLegendUrl();
    }
    this.ol3Layer.setOpacity(this.opacity_);
    this.ol3Layer.setVisible(this.visibility);

    // calculates the resolutions from scales
    if (!isNull(this.options)
      && !isNull(this.options.minScale) && !isNull(this.options.maxScale)) {
      const units = this.map.getProjection().units;
      this.options.minResolution = getResolutionFromScale(this.options.minScale, units);
      this.options.maxResolution = getResolutionFromScale(this.options.maxScale, units);
      this.ol3Layer.setMaxResolution(this.options.maxResolution);
      this.ol3Layer.setMinResolution(this.options.minResolution);
    } else if (!isNull(this.options)
      && !isNull(this.options.minResolution) && !isNull(this.options.maxResolution)) {
      this.ol3Layer.setMaxResolution(this.options.maxResolution);
      this.ol3Layer.setMinResolution(this.options.minResolution);
    }
    if (addLayer) {
      map.getMapImpl().addLayer(this.ol3Layer);
    }
  }

  /**
   * Este método devuelve el capabilities de la capa.
   * @param {M.layer.WMS} layerOl Capa de la que se quiere obtener el capabilities.
   * @param {string} projection Proyección del mapa.
   * @return {Promise} Promesa con el capabilities de la capa.
   */
  getCapabilities(layerOl, projection) {
    const olSource = layerOl.getSource();
    if (olSource instanceof TileWMS || olSource instanceof ImageWMS) {
      return this.getCapabilitiesWMS_(layerOl, projection);
    }
    return null;
  }

  /**
   * Este método devuelve el capabilities de la capa.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @param {M.layer.WMS} layerOl Capa de la que se quiere obtener el capabilities.
   * @param {string} projection Proyección del mapa.
   * @return {Promise} Promesa con el capabilities de la capa.
   * @api
   */
  getCapabilitiesWMS_(layerOl, projection) {
    const olSource = layerOl.getSource();
    const projectionCode = (olSource.getProjection())
      ? olSource.getProjection().getCode()
      : projection;

    const layerUrl = olSource.getUrl ? olSource.getUrl() : olSource.getUrls()[0];

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
          projectionCode,
        );
        success(getCapabilitiesUtils);
      });
    });
  }

  /**
   * Este método devuelve el capabilities de la capa.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @param {M.layer.WMS} layerOl Capa de la que se quiere obtener el capabilities.
   * @return {Promise} Promesa con el capabilities de la capa.
   * @api
   */
  getCapabilitiesWMTS_(layerOl) {
    const olSource = layerOl.getSource();

    const layerUrl = olSource.getUrls()[0];

    return new Promise((success, fail) => {
      const getCapabilitiesUrl = getWMTSGetCapabilitiesUrl(layerUrl);
      const parser = new OLFormatWMTSCapabilities();
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
              const layerText = response.text.split('Layer>').find((text) => text.indexOf(`Identifier>${name}<`) > -1);
              // eslint-disable-next-line no-param-reassign
              s.LegendURL = layerText.split('LegendURL')[1].split('xlink:href="')[1].split('"')[0];
            });
          });
        } catch (err) { /* Continue */ }
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
    if (!isNullOrEmpty(this.ol3Layer) && !isNullOrEmpty(this.ol3Layer.getSource)
      && !isNullOrEmpty(this.ol3Layer.getSource()) && !isNullOrEmpty(url)) {
      this.ol3Layer.getSource().setUrl(url);
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
    if (!isNullOrEmpty(this.ol3Layer) && !isNullOrEmpty(this.ol3Layer.getSource)
      && !isNullOrEmpty(this.ol3Layer.getSource())) {
      const source = this.ol3Layer.getSource();
      if (!isNullOrEmpty(source.getUrl)) {
        url = this.ol3Layer.getSource().getUrl();
      } else if (!isNullOrEmpty(source.getUrls)) {
        url = this.ol3Layer.getSource().getUrls();
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
    return this.ol3Layer.getMaxResolution();
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
    return this.ol3Layer.getMinResolution();
  }

  /**
   * Este método actualiza la capa.
   * @function
   * @api stable
   */
  refresh() {
    this.ol3Layer.getSource().refresh();
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
    let extent = this.ol3Layer.getExtent();
    if (isUndefined(extent)) {
      const tilegrid = this.ol3Layer.getSource().getTileGrid;
      if (!isUndefined(tilegrid)) {
        extent = this.ol3Layer.getSource().getTileGrid().getExtent();
        const extentProj = this.ol3Layer.getSource().getProjection().getCode();
        extent = ImplUtils
          .transformExtent(extent, extentProj, getProj(this.map.getProjection().code));
      } else {
        extent = this.ol3Layer.getSource().getImageExtent();
      }
    }
    return extent;
  }

  /**
   * Establece la extensión máxima de la capa.
   * @function
   * @param {Array<Number>} extent Extensión máxima.
   * @api stable
   */
  setMaxExtent(extent) {
    return this.ol3Layer.setExtent(extent);
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
      this.ol3Layer.getSource().updateParams({ VERSION: newVersion });
    } catch (error) {
      const err = getValue('exception').versionError
        .replace('[replace1]', this.name)
        .replace('[replace2]', this.ol3Layer.constructor.name);

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
    const olMap = this.map.getMapImpl();
    if (!isNullOrEmpty(this.ol3Layer)) {
      olMap.removeLayer(this.ol3Layer);
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
