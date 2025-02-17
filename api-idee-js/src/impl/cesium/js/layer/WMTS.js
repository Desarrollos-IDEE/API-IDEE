/* eslint-disable max-len */
/**
 * @module IDEE/impl/layer/WMTS
 */
import {
  isNullOrEmpty,
  isNull,
  getWMTSGetCapabilitiesUrl,
  extend,
  addParameters,
  isArray,
} from 'IDEE/util/Utils';
import {
  Cartesian3,
  Cartographic,
  ImageryLayer,
  Rectangle,
  WebMapTileServiceImageryProvider,
  GeographicTilingScheme,
  Math as CesiumMath,
} from 'cesium';
import { get as getRemote } from 'IDEE/util/Remote';
import { getValue } from 'IDEE/i18n/language';
import * as EventType from 'IDEE/event/eventtype';
import CesiumFormatWMTSCapabilities from '../format/CesiumWMTSCapabilities';
import LayerBase from './Layer';
import getLayerExtent from '../util/wmtscapabilities';
import ImplUtils from '../util/Utils';

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
 * @extends {IDEE.impl.layer.Layer}
 */
class WMTS extends LayerBase {
  /**
   * Constructor principal de la clase. Crea una capa WMTS
   * con parámetros especificados por el usuario.
   *
   * @constructor
   * @implements {IDEE.impl.Layer}
   * @param {Mx.parameters.LayerOptions} options Parámetros opcionales para la capa.
   * - maxZoom: Zoom máximo aplicable a la capa.
   * - minZoom: Zoom mínimo aplicable a la capa.
   * - minScale: Escala mínima.
   * - maxScale: Escala máxima.
   * - minResolution: Resolución mínima.
   * - maxResolution: Resolución máxima.
   * - format: Formato.
   * - visibility: Define si la capa es visible o no. Verdadero por defecto.
   * - displayInLayerSwitcher: Indica si la capa se muestra en el selector de capas.
   * - opacity: Opacidad de capa, por defecto 1.
   * - maxExtent: La medida en que restringe la visualización a una región específica.
   * - tileMatrixLabels: Lista de identificadores en TileMatrix para usar en solicitudes WMTS,
   *   uno por nivel de TileMatrix.
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
      * WMTS tileMatrixLabels. Lista de identificadores en
      * TileMatrix para usar en solicitudes WMTS,
      * uno por nivel de TileMatrix.
      */
    this.tileMatrixLabels = options.tileMatrixLabels || undefined;

    /**
      * WMTS options. Custom options for this layer.
      */
    this.options = options;

    /**
      * WMTS useCapabilities. Indica si se usa el getCapabilities.
      */
    this.useCapabilities = options.useCapabilities !== false;

    this.maxExtent = options.maxExtent || null;

    this.optsPickFeatures = {
      x: null,
      y: null,
      level: null,
      longitude: null,
      latitude: null,
    };
  }

  /**
   * Este método añade la capa al mapa.
   *
   * @public
   * @function
   * @param {IDEE.impl.Map} map Mapa de la implementación.
   * @api stable
   */
  addTo(map) {
    this.map = map;
    this.fire(EventType.ADDED_TO_MAP);

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
      this.maxExtent = getLayerExtent(contents, this.name, this.map.getProjection().code, defaultExtent);
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
      // set this layer visible
      if (!isNullOrEmpty(this.cesiumLayer)) {
        this.cesiumLayer.show = visibility;
      }
    } else if (!isNullOrEmpty(this.cesiumLayer)) {
      this.cesiumLayer.show = visibility;
    }
  }

  /**
   * Este método agrega esta capa como capa única.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @public
   * @param {IDEE.layer.WMTS.impl.capabilitiesOptions} capabilitiesOptions Opciones metadatos.
   * @function
   * @api stable
   */
  addLayer_(capabilitiesOptions) {
    if (!isNullOrEmpty(this.map)) {
      const extent = this.facadeLayer_.getMaxExtent();
      // gets resolutions from defined min/max resolutions
      const capabilitiesOptionsVariable = capabilitiesOptions;
      capabilitiesOptionsVariable.url = this.url;
      capabilitiesOptionsVariable.format = this.options.format || capabilitiesOptions.format;
      if (capabilitiesOptionsVariable.tileMatrixSetID.includes('4326')) {
        capabilitiesOptionsVariable.tilingScheme = new GeographicTilingScheme();
      }
      if (!isNullOrEmpty(this.tileMatrixLabels)) {
        capabilitiesOptionsVariable.tileMatrixLabels = this.tileMatrixLabels;
      }

      const wmtsSource = new WebMapTileServiceImageryProvider(extend(capabilitiesOptionsVariable, {
        extent,
      }, true));

      this.activatePickFeatures(wmtsSource);

      this.facadeLayer_.setFormat(capabilitiesOptionsVariable.format);
      this.cesiumLayer = new ImageryLayer(wmtsSource, extend({
        show: this.visibility,
        rectangle: this.userMaxExtent
          ? Rectangle.fromDegrees(this.userMaxExtent[0], this.userMaxExtent[1], this.userMaxExtent[2], this.userMaxExtent[3])
          : undefined,
        alpha: this.opacity_,
        minimumTerrainLevel: this.minZoom,
        maximumTerrainLevel: this.maxZoom - 1,
      }, this.vendorOptions_, true));

      const zIndex = this.facadeLayer_.isBase ? 0 : null;
      this.map.getMapImpl().imageryLayers.add(this.cesiumLayer, zIndex);

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
      const extent = this.facadeLayer_.getMaxExtent();
      const format = (this.options.format) ? this.options.format : 'image/png';
      const matrixSet = this.matrixSet || 'GoogleMapsCompatible';
      const options = {};
      if (matrixSet.includes(':4326')) {
        options.tilingScheme = new GeographicTilingScheme();
      }
      if (!isNullOrEmpty(this.tileMatrixLabels)) {
        options.tileMatrixLabels = this.tileMatrixLabels;
      }

      const wmtsSource = new WebMapTileServiceImageryProvider(extend({
        url: this.url,
        layer: this.name,
        tileMatrixSetID: matrixSet,
        format,
        style: 'default',
      }, options, true));

      this.activatePickFeatures(wmtsSource);

      this.facadeLayer_.setFormat(format);
      this.cesiumLayer = new ImageryLayer(wmtsSource, extend({
        show: this.visibility,
        rectangle: extent
          ? Rectangle.fromDegrees(extent[0], extent[1], extent[2], extent[3])
          : undefined,
        alpha: this.opacity_,
        minimumTerrainLevel: this.minZoom,
        maximumTerrainLevel: this.maxZoom - 1,
      }, this.vendorOptions_, true));

      const zIndex = this.facadeLayer_.isBase ? 0 : null;
      this.map.getMapImpl().imageryLayers.add(this.cesiumLayer, zIndex);

      this.fire(EventType.ADDED_TO_MAP, this);
    }
  }

  /**
   * Almacena en optsPickFeatures donde el usuario realiza click.
   * Se usa principalmente para permitir consultar la capa.
   * @public
   * @function
   * @param {Object} source WebMapTileServiceImageryProvider.
   * @api stable
   */
  activatePickFeatures(source) {
    const sourceWMTS = source;
    sourceWMTS.pickFeatures = (x, y, level, longitude, latitude) => {
      this.optsPickFeatures = {
        x,
        y,
        level,
        longitude,
        latitude,
      };
    };
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
      capabilitiesLayer = capabilitiesLayer.filter((l) => l.Identifier === this.facadeLayer_.name)[0];
    }

    if (capabilitiesLayer.Style.length > 0 && capabilitiesLayer.Style[0].LegendURL !== undefined) {
      this.legendUrl_ = capabilitiesLayer.Style[0].LegendURL.replaceAll('&amp;', '&');
    }

    const abstract = !isNullOrEmpty(capabilitiesLayer.Abstract) ? capabilitiesLayer.Abstract : '';
    const style = !isNullOrEmpty(capabilitiesLayer.Style) ? capabilitiesLayer.Style : '';
    const extent = this.facadeLayer_.getMaxExtent();
    const attribution = !isNullOrEmpty(capabilities.ServiceProvider) ? capabilities.ServiceProvider : '';

    const capabilitiesOpts = ImplUtils.optionsFromCapabilities(capabilities, {
      layer: layerName,
      matrixSet,
      extent,
    });
    const capabilitiesMetadata = {
      abstract,
      attribution,
      style,
    };

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
        const getCapabilitiesUrl = getWMTSGetCapabilitiesUrl(this.url);
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
    return undefined;
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
    return undefined;
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
   * @param {Array} coordinate Coordenadas. La coordenada X Y del mosaico.
   * @param {Number} zoom Zoom. El nivel del mosaico.
   * @param {String} formatInfo Formato de la información.
   * @param {Array} longlat Longitud y latitud en la que se seleccionarán las características.
   * @returns {String} URL de la información de los objetos geográficos.
   * @api
   */
  getFeatureInfoUrl(coordinate, level, formatInfo, longlat) {
    const trc = this.getTileColTileRow(coordinate[0], coordinate[1], level);
    const coordPxl = this.getRelativeTileCoordInPixel_(coordinate[0], coordinate[1], level, longlat[0], longlat[1]);
    const service = 'WMTS';
    const request = 'GetFeatureInfo';
    const version = '1.0.0';
    const layer = this.name;
    const tilematrixset = this.matrixSet;
    const infoFormat = formatInfo;
    const tilecol = trc[0];
    const tilerow = trc[1];
    const I = coordPxl[0];
    const J = coordPxl[1];
    let tilematrix = level;
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
   * @param {Array} coordinate Coordenadas. La coordenada X Y del mosaico.
   * @param {Number} zoom Zoom. El nivel del mosaico.
   * @return {Array} Devuelve las columnas y las filas de la tesela.
   * @api
   */
  getTileColTileRow(x, y) {
    let tcr = null;
    if (!isNullOrEmpty(this.cesiumLayer)) {
      tcr = [x, y];
    }
    return tcr;
  }

  /**
   * Devuelve las coordenadas relativas de mosaico en píxeles.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @function
   * @param {Array} coordinate Coordenadas. La coordenada X Y del mosaico.
   * @param {Number} zoom Zoom. El nivel del mosaico.
   * @returns {Array} Devuelve las coordenadas en pixeles.
   * @public
   * @api
   */
  getRelativeTileCoordInPixel_(x, y, level, longitude, latitude) {
    let coordPixel;
    if (!isNullOrEmpty(this.cesiumLayer)) {
      const wmtsSource = this.cesiumLayer.imageryProvider;

      const tilingScheme = wmtsSource.tilingScheme;
      const rectangle = tilingScheme.tileXYToNativeRectangle(x, y, level);

      let projected;
      if (tilingScheme instanceof GeographicTilingScheme) {
        projected = new Cartesian3();
        projected.x = CesiumMath.toDegrees(longitude);
        projected.y = CesiumMath.toDegrees(latitude);
      } else {
        const cartographic = new Cartographic();
        cartographic.longitude = longitude;
        cartographic.latitude = latitude;
        projected = tilingScheme.projection.project(
          cartographic,
          new Cartesian3(),
        );
      }

      const i = ((wmtsSource.tileWidth * (projected.x - rectangle.west)) / rectangle.width) | 0;
      const j = ((wmtsSource.tileHeight * (rectangle.north - projected.y)) / rectangle.height) | 0;
      coordPixel = [i, j];
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
