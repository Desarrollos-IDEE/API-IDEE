/**
 * @module M/impl/layer/WMTS
 */
import {
  isNull, isArray, isNullOrEmpty, addParameters, getWMTSGetCapabilitiesUrl, getResolutionFromScale,
  extend,
} from 'M/util/Utils';
import { default as OLSourceWMTS } from 'ol/source/WMTS';
import OLFormatWMTSCapabilities from 'ol/format/WMTSCapabilities';
import OLTileGridWMTS from 'ol/tilegrid/WMTS';
import { getBottomLeft, getTopLeft, getWidth } from 'ol/extent';
import { get as getRemote } from 'M/util/Remote';
import * as EventType from 'M/event/eventtype';
import { get as getProj } from 'ol/proj';
import OLLayerTile from 'ol/layer/Tile';
import { optionsFromCapabilities } from 'patches';
import LayerBase from './Layer';
import getLayerExtent from '../util/wmtscapabilities';
/**
 * @classdesc
 * WMTS (Web Map Tile Service) es un estándar OGC para servir información geográfica
 * en forma de teselas pregeneradas en resoluciones específicas.
 *
 *
 * @property {Number} minZoom Zoom mínimo aplicable a la capa.
 * @property {Number} maxZoom Zoom máximo aplicable a la capa.
 * @property {Object} options Opciones personalizadas para esta capa.
 *
 * @api
 * @extends {M.impl.layer.Layer}
 */
class WMTS extends LayerBase {
  /**
   * Constructor principal de la clase. Crea una capa WMTS
   * con parámetros especificados por el usuario.
   *
   * @constructor
   * @implements {M.impl.Layer}
   * @param {Mx.parameters.LayerOptions} options Parámetros opcionales para la capa.
   * - maxZoom: Zoom máximo aplicable a la capa.
   * - minZoom: Zoom mínimo aplicable a la capa.
   * - minScale: Escala mínima.
   * - maxScale: Escala máxima.
   * - minResolution: Resolucción mínima.
   * - maxResolution: Resolucción máxima.
   * - format: Formato.
   * - visibility: Define si la capa es visible o no. Verdadero por defecto.
   * - displayInLayerSwitcher: Indica si la capa se muestra en el selector de capas.
   * - crossOrigin: Atributo crossOrigin para las imágenes cargadas
   * - opacity: Opacidad de capa, por defecto 1.
   * - maxExtent: La medida en que restringe la visualización a una región específica.
   * @param {Object} vendorOptions Opciones para la biblioteca base. Ejemplo vendorOptions:
   * <pre><code>
   * import { default as OLSourceWMTS } from 'ol/source/WMTS';
   * {
   *  opacity: 0.1,
   *  source: new OLSourceWMTS({
   *    attributions: 'wmts',
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
     * WMTS facadeLayer_. The facade layer instance.
     */
    this.facadeLayer_ = null;

    /**
     * WMTS capabilitiesOptionsPromise. Options from the GetCapabilities.
     */
    this.capabilitiesOptionsPromise = null;

    /**
     * WMTS getCapabilitiesPromise_. Options from the GetCapabilities.
     */
    this.getCapabilitiesPromise_ = null;

    /**
     * WMTS minZoom. Minimum zoom applicable to the layer.
     */
    this.minZoom = options.minZoom || Number.NEGATIVE_INFINITY;

    /**
     * WMTS maxZoom. Maximum zoom applicable to the layer.
     */
    this.maxZoom = options.maxZoom || Number.POSITIVE_INFINITY;

    /**
     * WMTS options. Custom options for this layer.
     */
    this.options = options;

    /**
     * WMS useCapabilities. Indica si se usa el getCapabilities.
     */
    this.useCapabilities = options.useCapabilities !== false;

    /**
     * CrossOrigin. Atributo crossOrigin para las imágenes cargadas
     */
    this.crossOrigin = (options.crossOrigin === null || options.crossOrigin === false) ? undefined : 'anonymous';

    this.maxExtent = options.maxExtent || null;
  }

  /**
   * Este método añade la capa al mapa.
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

    if (!isNullOrEmpty(this.vendorOptions_.source)) {
      this.name = this.vendorOptions_.source.getLayer();
    }

    // calculates the resolutions from scales
    if (!isNull(this.options)
      && !isNull(this.options.minScale) && !isNull(this.options.maxScale)) {
      const units = this.map.getMapImpl().getView().getProjection().getUnits();
      this.options.minResolution = getResolutionFromScale(this.options.minScale, units);
      this.options.maxResolution = getResolutionFromScale(this.options.maxScale, units);
    }

    this.ol3Layer = new OLLayerTile(extend({
      visible: this.visibility,
      minResolution: this.options.minResolution,
      maxResolution: this.options.maxResolution,
      extent: this.userMaxExtent,
      opacity: this.opacity_,
    }, this.vendorOptions_, true));

    if (this.useCapabilities) {
      this.capabilitiesOptionsPromise = this.getCapabilitiesOptions_();

      this.capabilitiesOptionsPromise
        .then((capabilities) => {
          this.getWGS84BoundingBoxCapabilities_(capabilities);
          // filter current layer capabilities
          const capabilitiesOptions = this.getFilterCapabilities_(capabilities);
          // adds layer from capabilities
          this.addLayer_(capabilitiesOptions);
        });
    } else {
      this.addLayerNotCapabilities_();
    }
  }

  /**
   * Este devuelve el WGS84BoundingBox de las capabilities.
   * @param {Object} capabilities Capabilities de la capa.
   * @returns  {Object} WGS84BoundingBox de las capabilities.
   */
  getWGS84BoundingBoxCapabilities_(capabilities) {
    const contents = capabilities.Contents;
    const defaultExtent = this.map.getMaxExtent();

    if (!isNull(contents)) {
      this.maxExtent = getLayerExtent(contents, this.name, this.map
        .getProjection().code, defaultExtent);
    }
    return this.maxExtent;
  }

  /**
   * Devuelve la extensión máxima de la capa.
   * @returns {Array} Extensión máxima.
   */
  getMaxExtent() {
    if (!this.maxExtent) {
      this.maxExtent = this.map.getMaxExtent();
    }
    return this.maxExtent;
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
    if (isNullOrEmpty(this.vendorOptions_.source)) {
      const extent = this.facadeLayer_.getMaxExtent();
      const projection = getProj(this.map.getProjection().code);
      this.getCapabilities().then((capabilities) => {
        // gets matrix
        const matrixSet = capabilities.getMatrixSet(this.name);
        const matrixIds = capabilities.getMatrixIds(this.name);

        // gets format
        const format = capabilities.getFormat(this.name);

        const newSource = new OLSourceWMTS({
          crossOrigin: this.crossOrigin,
          url: this.url,
          layer: this.name,
          matrixSet,
          format,
          projection,
          tileGrid: new OLTileGridWMTS({
            origin: getBottomLeft(extent),
            resolutions,
            matrixIds,
          }),
          extent,
        });
        this.ol3Layer.setSource(newSource);
      });
    }
  }

  /**
   * Este método establece la visibilidad de esta capa.
   *
   * @function
   * @param {Boolean} visibility Verdadero es visibilidad, falso si no.
   * @api stable
   */
  setVisible(visibility) {
    this.visibility = visibility;
    // if this layer is base then it hides all base layers
    if ((visibility === true) && (this.isBase === true)) {
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
   * Este método agrega esta capa como capa única.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @public
   * @param {M.layer.WMTS.impl.capabilitiesOptions} capabilitiesOptions Opciones metadatos.
   * @function
   * @api stable
   */
  addLayer_(capabilitiesOptions) {
    if (!isNullOrEmpty(this.map)) {
      const extent = this.facadeLayer_.getMaxExtent();
      // gets resolutions from defined min/max resolutions
      const capabilitiesOptionsVariable = capabilitiesOptions;
      capabilitiesOptionsVariable.format = this.options.format || capabilitiesOptions.format;
      let wmtsSource = this.vendorOptions_.source;
      if (isNullOrEmpty(this.vendorOptions_.source)) {
        const options = extend(capabilitiesOptionsVariable, {
          extent,
          crossOrigin: this.crossOrigin,
        }, true);
        wmtsSource = new OLSourceWMTS(options);
      }
      this.facadeLayer_.setFormat(capabilitiesOptionsVariable.format);
      this.ol3Layer.setSource(wmtsSource);

      // keeps z-index values before ol resets
      const zIndex = this.zIndex_;

      if (this.addLayerToMap_) {
        this.map.getMapImpl().addLayer(this.ol3Layer);
      }

      this.ol3Layer.setMaxZoom(this.maxZoom);
      this.ol3Layer.setMinZoom(this.minZoom);

      // sets its z-index
      if (zIndex !== null) {
        this.setZIndex(zIndex);
      }

      // activates animation always for WMTS layers
      this.ol3Layer.set('animated', true);
      this.fire(EventType.ADDED_TO_MAP, this);
    }
  }

  /**
   * Este método agrega esta capa sin usar capabilidades.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @public
   * @function
   * @api stable
   */
  addLayerNotCapabilities_() {
    if (!isNullOrEmpty(this.map)) {
      const format = (this.options.format) ? this.options.format : 'image/png';
      let wmtsSource = this.vendorOptions_.source;
      if (isNullOrEmpty(this.vendorOptions_.source)) {
        const size = getWidth(this.map.getProjection().getExtent()) / 256;
        const resolutions = new Array(19);
        const matrixIds = new Array(19);
        // eslint-disable-next-line no-plusplus
        for (let z = 0; z < 19; ++z) {
          // generate resolutions and matrixIds arrays for this WMTS
          // eslint-disable-next-line no-restricted-properties
          resolutions[z] = size / (2 ** z);
          matrixIds[z] = z;
        }

        const tileGrid = new OLTileGridWMTS({
          origin: getTopLeft(this.map.getProjection().getExtent()),
          resolutions,
          matrixIds,
        });
        wmtsSource = new OLSourceWMTS({
          attributions: ' https://www.ign.es/',
          url: this.url,
          layer: this.name,
          matrixSet: this.matrixSet,
          format,
          projection: getProj(this.map.getProjection().code),
          tileGrid,
        });
      }
      this.facadeLayer_.setFormat(format);
      this.ol3Layer.setSource(wmtsSource);

      // keeps z-index values before ol resets
      const zIndex = this.zIndex_;
      this.map.getMapImpl().addLayer(this.ol3Layer);
      setTimeout(() => {
        this.ol3Layer.setMaxZoom(this.maxZoom);
        this.ol3Layer.setMinZoom(this.minZoom);
      }, 500);

      // sets its z-index
      if (zIndex !== null) {
        this.setZIndex(zIndex);
      }

      // activates animation always for WMTS layers
      this.ol3Layer.set('animated', true);
      this.fire(EventType.ADDED_TO_MAP, this);
    }
  }

  /**
   * Este método establece la extensión máxima para la capa de Openlayers.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @public
   * @param {Mx.Extent} maxExtent Extencisón máxima.
   * @function
   * @api stable
   */
  setMaxExtent(maxExtent) {
    this.getOL3Layer().setExtent(maxExtent);
  }

  /**
   * Este método devuelve las opciones filtradas de los metadatos
   * de un servicio WMTS para la capa actual.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @public
   * @function
   * @param {Object} capabilities Metadatos.
   * @returns {Object} Metadatos filtrados.
   * @api stable
   */
  getFilterCapabilities_(capabilities) {
    const layerName = this.name;
    let matrixSet = this.matrixSet;
    if (isNullOrEmpty(matrixSet)) {
      /* if no matrix set was specified then
        it supposes the matrix set has the name
        of the projection
        */
      matrixSet = this.map.getProjection().code;
    }
    let capabilitiesLayer = capabilities.Contents.Layer;
    if (isArray(capabilitiesLayer)) {
      capabilitiesLayer = capabilitiesLayer.find((l) => l.Identifier === layerName);
    }

    if (capabilitiesLayer.Style.length > 0 && capabilitiesLayer.Style[0].LegendURL !== undefined) {
      this.legendUrl_ = capabilitiesLayer.Style[0].LegendURL.replaceAll('&amp;', '&');
    }

    const abstract = !isNullOrEmpty(capabilitiesLayer.Abstract) ? capabilitiesLayer.Abstract : '';
    const style = !isNullOrEmpty(capabilitiesLayer.Style) ? capabilitiesLayer.Style : '';
    const extent = this.facadeLayer_.getMaxExtent();
    const attribution = !isNullOrEmpty(capabilities.ServiceProvider) ? capabilities.ServiceProvider : '';

    const capabilitiesOpts = optionsFromCapabilities(capabilities, {
      layer: layerName,
      matrixSet,
      extent,
    });
    const capabilitiesMetadata = {
      abstract,
      attribution,
      style,
    };
    capabilitiesOpts.tileGrid.extent = extent;
    if (this.facadeLayer_.capabilitiesMetadata === undefined) {
      this.facadeLayer_.capabilitiesMetadata = capabilitiesMetadata;
    }
    return capabilitiesOpts;
  }

  /**
   * Este método devuelve las opciones de los metadatos
   * de un servicio WMTS.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @public
   * @function
   * @returns {capabilitiesOptionsPromise} Opciones metadatos.
   * @api stable
   */
  getCapabilitiesOptions_() {
    if (isNullOrEmpty(this.capabilitiesOptionsPromise)) {
      const capabilitiesInfo = this.map.collectionCapabilities.find((cap) => {
        return cap.url === this.url;
      }) || {};

      if (capabilitiesInfo.capabilities) {
        this.capabilitiesOptionsPromise = capabilitiesInfo.capabilities;
      } else {
        this.capabilitiesOptionsPromise = this.getCapabilities().then((capabilities) => {
          return capabilities;
        });
        capabilitiesInfo.capabilities = this.capabilitiesOptionsPromise;
      }
    }
    return this.capabilitiesOptionsPromise;
  }

  /**
   * Este método devuelve los metadatos
   * de un servicio WMTS.
   *
   * @public
   * @function
   * @returns {capabilitiesOptionsPromise} Metadatos.
   * @api stable
   */
  getCapabilities() {
    if (isNullOrEmpty(this.getCapabilitiesPromise_)) {
      this.getCapabilitiesPromise_ = new Promise((success, fail) => {
        let url = this.url;
        if (this.vendorOptions_.source) {
          url = this.vendorOptions_.source.getUrls()[0];
        }
        const getCapabilitiesUrl = getWMTSGetCapabilitiesUrl(url);
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
    return this.getCapabilitiesPromise_;
  }

  /**
   * Este método obtiene la resolución mínima para
   * este WMTS.
   *
   * @public
   * @function
   * @return {minResolution} Resolución Mínima.
   * @api stable
   */
  getMinResolution() {
    return this.options.minResolution;
  }

  /**
   * Este método obtiene la resolución máxima para
   * este WMTS.
   *
   * @public
   * @function
   * @returns {maxResolution} Resolución Máxima.
   * @api stable
   */
  getMaxResolution() {
    return this.options.maxResolution;
  }

  /**
   * Este método establece la clase de fachada WMTS.
   * La fachada se refiere a
   * un patrón estructural como una capa de abstracción con un patrón de diseño.
   *
   * @function
   * @param {object} obj Capa de la fachada.
   * @api stable
   */
  setFacadeObj(obj) {
    this.facadeLayer_ = obj;
  }

  /**
   * Este método indica si la capa es consultable.
   *
   * @function
   * @returns {Boolean} Verdadera es consultable, falsa si no.
   * @api stable
   * @expose
   */
  isQueryable() {
    return this.options.queryable !== false;
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

    if (obj instanceof WMTS) {
      equals = (this.url === obj.url);
      equals = equals && (this.name === obj.name);
      equals = equals && (this.matrixSet === obj.matrixSet);
    }

    return equals;
  }

  /**
   * Devuelve la url con información de los objetos geográficos.
   *
   * @function
   * @public
   * @param {Array} coordinate Coordenadas.
   * @param {Number} zoom Zoom.
   * @param {String} formatInfo Formato de la información.
   * @returns {String} URL de la información de los objetos geográficos.
   * @api
   */
  getFeatureInfoUrl(coordinate, zoom, formatInfo) {
    const tcr = this.getTileColTileRow(coordinate, zoom);
    const coordPxl = this.getRelativeTileCoordInPixel_(coordinate, zoom);
    const service = 'WMTS';
    const request = 'GetFeatureInfo';
    const version = '1.0.0';
    const layer = this.name;
    const tilematrixset = this.matrixSet;
    const infoFormat = formatInfo;
    const tilecol = tcr[0];
    const tilerow = tcr[1];
    const I = coordPxl[0];
    const J = coordPxl[1];
    let tilematrix = zoom;
    if (this.matrixSet.indexOf(':4326') > -1) {
      tilematrix = `${this.matrixSet}:${tilematrix}`;
    }

    const url = addParameters(this.url, {
      service,
      request,
      version,
      layer,
      tilematrixset,
      tilematrix,
      tilerow,
      tilecol,
      J,
      I,
      infoFormat,
    });
    return url;
  }

  /**
   * Devuelve las columnas y las filas de la tesela.
   *
   * @public
   * @function
   * @param {Array} coordinate Coordenadas.
   * @param {Number} zoom Zoom.
   * @return {Array} Devuelve las columnas y las filas de la tesela.
   * @api
   */
  getTileColTileRow(coordinate, zoom) {
    let tcr = null;
    if (!isNullOrEmpty(this.ol3Layer)) {
      const source = this.ol3Layer.getSource();
      if (!isNullOrEmpty(source)) {
        const { tileGrid } = source;
        tcr = tileGrid.getTileCoordForCoordAndZ(coordinate, zoom);
        // tcr[2] = -tcr[2] - 1;
      }
    }
    return tcr.slice(1);
  }

  /**
   * Devuelve las coordenadas relativas de mosaico en píxeles.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @function
   * @param {Array} coordinate Coordenadas.
   * @param {Number} zoom Zoom.
   * @returns {Array} Devuelve las coordenadas en pixeles.
   * @public
   * @api
   */
  getRelativeTileCoordInPixel_(coordinate, zoom) {
    let coordPixel;
    if (!isNullOrEmpty(this.ol3Layer)) {
      const source = this.ol3Layer.getSource();
      if (!isNullOrEmpty(source)) {
        const { tileGrid } = source;
        const tileCoord = tileGrid.getTileCoordForCoordAndZ(coordinate, zoom);
        const tileExtent = tileGrid.getTileCoordExtent(tileCoord, []);
        const tileResolution = tileGrid.getResolution(tileCoord[0]);
        const x = Math.floor((coordinate[0] - tileExtent[0]) / tileResolution);
        const y = Math.floor((tileExtent[3] - coordinate[1]) / tileResolution);
        coordPixel = [x, y];
      }
    }
    return coordPixel;
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
   * Sobrescribir la url de la leyenda.
   *
   * @public
   * @function
   * @param {String} legendUrl Nueva URL.
   * @api stable
   */
  setLegendURL(legendUrl) {
    this.legendUrl_ = legendUrl;
  }
}

export default WMTS;
