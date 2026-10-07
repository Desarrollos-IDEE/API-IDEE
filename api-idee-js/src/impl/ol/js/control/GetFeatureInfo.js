/**
 * @module IDEE/impl/control/GetFeatureInfo
 */
import OLFormatWFS from 'ol/format/WFS';
import { unByKey } from 'ol/Observable';
import WMTS from 'ol/source/WMTS';
import TileWMS from 'ol/source/TileWMS';
import ImageWMS from 'ol/source/ImageWMS';
import * as dialog from 'IDEE/dialog';
import getfeatureinfoPopupTemplate from 'templates/getfeatureinfo_popup';
import getfeatureinfoLayers from 'templates/getfeatureinfo_layers';
import Popup from 'IDEE/Popup';
import { get as getRemote } from 'IDEE/util/Remote';
import { compileSync as compileTemplate } from 'IDEE/util/Template';
import {
  isNullOrEmpty, beautifyAttribute, addParameters, isString, rgbaToHex,
} from 'IDEE/util/Utils';
import { getValue } from 'IDEE/i18n/language';
import * as LayerType from 'IDEE/layer/Type';
import Control from './Control';

/**
 * Zoom mínimo por defecto para consultar elevación Terrain-RGB en XYZ.
 * @constant
 * @type {number}
 */
const XYZ_ELEVATION_QUERY_MIN_ZOOM = 15;

/**
 * Decodifica elevación (m) según codificación MapTiler Terrain RGB / MDT IDEE.
 *
 * @function
 * @param {number} red Componente rojo (0-255).
 * @param {number} green Componente verde (0-255).
 * @param {number} blue Componente azul (0-255).
 * @returns {number} Elevación en metros.
 */
const decodeTerrainRgbElevation = (red, green, blue) => {
  const encoded = (red * 65536) + (green * 256) + blue;
  return -10000 + (encoded * 0.1);
};

/**
 * Opciones de visualización GetFeatureInfo para extract XYZ.
 * En elevation se admite `elevation` (zoom mínimo por defecto 15) o `elevation:16`.
 *
 * @function
 * @param {boolean|string|undefined} extract Valor de extract de la capa XYZ.
 * @returns {{
 *   showTiles: boolean,
 *   showColors: boolean,
 *   showElevation: boolean,
 *   elevationQueryMinZoom: number
 * }}
 */
const getXyzExtractDisplayOptions = (extract) => {
  const tilesAndColors = {
    showTiles: true,
    showColors: true,
    showElevation: false,
    elevationQueryMinZoom: XYZ_ELEVATION_QUERY_MIN_ZOOM,
  };

  if (extract === true) {
    return tilesAndColors;
  }
  if (isString(extract)) {
    const trimmed = extract.trim();
    if (trimmed === '' || /^(true|1)$/i.test(trimmed)) {
      return tilesAndColors;
    }
    const parts = trimmed.split(/[,;\s]+/)
      .map((part) => part.trim().toLowerCase())
      .filter((part) => !isNullOrEmpty(part));
    let showElevation = false;
    let elevationQueryMinZoom = XYZ_ELEVATION_QUERY_MIN_ZOOM;
    parts.forEach((part) => {
      if (part === 'elevation') {
        showElevation = true;
        return;
      }
      const elevationMatch = part.match(/^elevation[=:](\d+)$/);
      if (isNullOrEmpty(elevationMatch)) {
        return;
      }
      showElevation = true;
      const zoom = Number.parseInt(elevationMatch[1], 10);
      if (!Number.isNaN(zoom)) {
        elevationQueryMinZoom = zoom;
      }
    });
    return {
      showTiles: parts.includes('tiles'),
      showColors: parts.includes('colors'),
      showElevation,
      elevationQueryMinZoom,
    };
  }
  return tilesAndColors;
};

/**
 * @classdesc
 * Agrega la herramienta de consulta de información de capas WMS, WMTS, GeoTIFF, XYZ y TMS.
 * @property {Array} userFormats Formato de respuesta.
 * @property {Number} buffer  Área de influencia, valor por defecto 5.
 * @api
 */
class GetFeatureInfo extends Control {
  /**
   * Constructor principal de la clase.
   *
   * @constructor
   * @param {Boolean} activated Activa o no el control.
   * @param {Object} options Opciones del control.
   * - featureCount. Número de objetos geográficos, por defecto 10.
   * - buffer. Configuración del área de influencia, por defecto 5.
   * @extends {IDEE.impl.Control}
   * @api stable
   */
  constructor(activated, options) {
    super();

    /**
     * Formato de respuesta.
     * @type {array<string>}
     * @api
     */
    this.userFormats = ['text/html', 'text/plain', 'application/vnd.ogc.gml'];

    this.featureCount = options.featureCount;
    if (isNullOrEmpty(this.featureCount)) {
      this.featureCount = 10;
    }

    /**
     * Área de influencia.
     */
    this.buffer = options.buffer || 5;
    this.element = document.createElement('div');
    this.activated = activated;
    this.currentFormat = 0;
  }

  /**
   * Este método añade el control al mapa.
   *
   * @public
   * @function
   * @param {IDEE.Map} map Mapa.
   * @param {function} template Plantilla del control.
   * @api stable
   * @export
   */
  addTo(map, element) {
    const olControls = map.getMapImpl().getControls().getArray();
    const hasControl = olControls.some((control) => control instanceof GetFeatureInfo);
    if (hasControl === false) {
      this.facadeMap_ = map;
      map.getMapImpl().addControl(this);
      this.addOnClickEvent_();
    }
  }

  /**
   * Este método elimina el evento con un solo clic en el mapa especificado.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   *
   * @public
   * @function
   * @api stable
   */
  deleteOnClickEvent_() {
    unByKey(this.clickEventKey_);
  }

  /**
   * Este método agrega el evento "singleclick" al mapa especificado.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @public
   * @function
   * @api stable
   */
  addOnClickEvent_() {
    const olMap = this.facadeMap_.getMapImpl();
    if (this.activated === true) {
      this.clickEventKey_ = olMap.on('singleclick', (e) => this.buildUrl_(dialog, e));
    }
  }

  /**
   * Este método crea la URL de consulta y muestra los resultados.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @public
   * @function
   * @param {ol.MapBrowserPointerEvent} evt Evento de punto del navegador.
   * @param {IDEE.dialog} dialogParam Dialogo.
   * @api stable
   */
  buildUrl_(dialogParam, evt) {
    this.evt = evt;
    const olMap = this.facadeMap_.getMapImpl();
    const [urlsWMTS, urlsWMS] = this.buildGenericInfoURL();

    const allLayers = [...this.facadeMap_.getImpl().getAllLayerInGroup(),
      ...this.facadeMap_.getLayers()];

    const wms = [];
    const wmts = [];
    const geotiff = [];
    const xyz = [];
    allLayers.forEach((layer) => {
      if (layer.type === 'WMS') {
        wms.push(layer);
      } else if (layer.type === 'WMTS') {
        wmts.push(layer);
      } else if (layer.type === 'GeoTIFF') {
        geotiff.push(layer);
      } else if (layer.type === 'XYZ' || layer.type === 'TMS') {
        xyz.push(layer);
      }
    });

    const wmsInfoURLS = this.buildWMSInfoURL([...wms, ...urlsWMS]);
    const wmtsInfoURLS = this.buildWMTSInfoURL([...wmts, ...urlsWMTS]);
    const geotiffInfos = this.buildGeoTIFFInfo(geotiff, evt);
    const layerNamesUrls = [...wmtsInfoURLS, ...wmsInfoURLS]
      .filter((layer) => !isNullOrEmpty(layer));

    this.buildXYZInfo(xyz, evt).then((xyzInfos) => {
      const clientLayerInfos = [...geotiffInfos, ...xyzInfos];
      if (layerNamesUrls.length > 0 || clientLayerInfos.length > 0) {
        this.showInfoFromURL_(layerNamesUrls, evt.coordinate, olMap, clientLayerInfos);
      } else {
        dialogParam.info('No existen capas consultables');
      }
    }).catch((err) => {
      // eslint-disable-next-line no-console
      console.error(err);
      if (layerNamesUrls.length > 0 || geotiffInfos.length > 0) {
        this.showInfoFromURL_(layerNamesUrls, evt.coordinate, olMap, geotiffInfos);
      } else {
        dialogParam.info('No existen capas consultables');
      }
    });
  }

  /**
   * Obtiene la información de capas GeoTIFF con extract activo en el píxel clicado.
   *
   * @function
   * @param {Array<IDEE.layer.GeoTIFF>} geotiffLayers Capas GeoTIFF.
   * @returns {Array<{formatedInfo: string, layerName: string}>} Información formateada por capa.
   * @api stable
   */
  buildGeoTIFFInfo(geotiffLayers, evt) {
    const pixel = evt.pixel;
    const infos = [];

    geotiffLayers.forEach((layer) => {
      if (!layer.isVisible() || !layer.extract) {
        return;
      }
      const data = layer.getData(pixel);
      if (isNullOrEmpty(data) || data.length === 0) {
        return;
      }
      const formatedInfo = GetFeatureInfo.formatGeoTIFFInfo(data, layer);
      infos.push({
        formatedInfo,
        layerName: layer.legend || layer.name,
      });
    });

    return infos;
  }

  /**
   * Obtiene la información de capas XYZ/TMS con extract activo en el píxel clicado.
   * Con elevación, si el zoom del mapa es menor que el mínimo de consulta, lee la
   * tesela a ese zoom (p. ej. 15) en lugar del píxel renderizado.
   *
   * @function
   * @param {Array<IDEE.layer.XYZ|IDEE.layer.TMS>} xyzLayers Capas XYZ o TMS.
   * @param {ol.MapBrowserEvent} evt Evento de clic en el mapa.
   * @returns {Promise<Array<{formatedInfo: string, layerName: string}>>}
   * Información formateada por capa.
   * @api stable
   */
  async buildXYZInfo(xyzLayers, evt) {
    const pixel = evt.pixel;
    const coordinate = evt.coordinate;
    const layerResults = await Promise.all(xyzLayers.map(async (layer) => {
      if (!layer.isVisible() || layer.extract === false) {
        return null;
      }
      const displayOptions = getXyzExtractDisplayOptions(layer.extract);
      let tileIndex = null;
      let data = null;
      const useElevationQuery = layer.type === LayerType.XYZ
        && displayOptions.showElevation
        && typeof layer.getFeatureInfoPixelData === 'function';
      if (useElevationQuery) {
        const pixelData = await layer.getFeatureInfoPixelData(
          coordinate,
          pixel,
          displayOptions.elevationQueryMinZoom,
        );
        if (!isNullOrEmpty(pixelData)) {
          tileIndex = pixelData.tileIndex;
          data = pixelData.data;
        }
      } else {
        tileIndex = layer.getTileIndexAtCoordinate(coordinate);
        data = layer.getData(pixel);
      }
      if (isNullOrEmpty(tileIndex) && isNullOrEmpty(data)) {
        return null;
      }
      return {
        formatedInfo: GetFeatureInfo.formatXYZInfo(tileIndex, data, layer),
        layerName: layer.legend || layer.name,
      };
    }));

    return layerResults.filter((info) => !isNullOrEmpty(info));
  }

  /**
   * Formatea índice de tesela y color de píxel de una capa XYZ como tabla HTML.
   *
   * @public
   * @function
   * @param {{z: number, x: number, y: number}|null} tileIndex Índice de tesela z/x/y.
   * @param {Uint8ClampedArray|Uint8Array|Float32Array|DataView|null} data Color RGBA del píxel.
   * @param {IDEE.layer.XYZ|IDEE.layer.TMS|null} layer Capa XYZ/TMS.
   * @returns {string} HTML con la información de la tesela y el color.
   * @api stable
   */
  static formatXYZInfo(tileIndex, data, layer) {
    const gfi = getValue('getfeatureinfo');
    let displayOptions = {
      showTiles: true,
      showColors: true,
      showElevation: false,
    };
    if (!isNullOrEmpty(layer) && layer.type === LayerType.XYZ) {
      displayOptions = getXyzExtractDisplayOptions(layer.extract);
    }
    const hasPixelData = !isNullOrEmpty(data) && data.length >= 3;
    let html = '<div class=\'divinfo\'>';
    html += '<table class=\'api-idee-table\'><tbody>';

    if (displayOptions.showTiles && !isNullOrEmpty(tileIndex)) {
      html += '<tr><td class="key"><b>';
      html += beautifyAttribute(gfi.tile_z);
      html += '</b></td><td class="value">';
      html += tileIndex.z;
      html += '</td></tr>';
      html += '<tr><td class="key"><b>';
      html += beautifyAttribute(gfi.tile_x);
      html += '</b></td><td class="value">';
      html += tileIndex.x;
      html += '</td></tr>';
      html += '<tr><td class="key"><b>';
      html += beautifyAttribute(gfi.tile_y);
      html += '</b></td><td class="value">';
      html += tileIndex.y;
      html += '</td></tr>';
    }

    if (hasPixelData) {
      const red = data[0];
      const green = data[1];
      const blue = data[2];
      let alpha = 255;
      if (data.length > 3) {
        alpha = data[3];
      }
      if (displayOptions.showElevation) {
        const isTransparent = alpha === 0;
        if (isTransparent) {
          html += '<tr><td class="value" colspan="2">';
          html += gfi.elevation_nodata;
          html += '</td></tr>';
        } else {
          const elevation = decodeTerrainRgbElevation(red, green, blue);
          html += '<tr><td class="key"><b>';
          html += beautifyAttribute(gfi.elevation);
          html += '</b></td><td class="value">';
          html += elevation.toFixed(1);
          html += ' ';
          html += gfi.elevation_unit;
          html += '</td></tr>';
        }
      }
      if (displayOptions.showColors) {
        html = GetFeatureInfo.appendXyzPixelColorRows(html, data, gfi);
      }
    } else if (displayOptions.showColors || displayOptions.showElevation) {
      html += '<tr><td class="value" colspan="2">';
      html += gfi.pixel_unavailable;
      html += '</td></tr>';
    } else if (displayOptions.showTiles && isNullOrEmpty(tileIndex)) {
      html += '<tr><td class="value" colspan="2">';
      html += gfi.pixel_unavailable;
      html += '</td></tr>';
    }

    html += '</tbody></table></div>';
    return html;
  }

  /**
   * Añade filas RGBA/hex de un píxel XYZ/TMS a una tabla HTML parcial.
   *
   * @private
   * @function
   * @param {string} html HTML parcial.
   * @param {Uint8ClampedArray|Uint8Array|Float32Array|DataView} data Color RGBA del píxel.
   * @param {Object} gfi Traducciones getfeatureinfo.
   * @returns {string} HTML con filas de color añadidas.
   * @api stable
   */
  static appendXyzPixelColorRows(html, data, gfi) {
    let htmlVar = html;
    const red = data[0];
    const green = data[1];
    const blue = data[2];
    let alpha = 255;
    if (data.length > 3) {
      alpha = data[3];
    }
    const hex = rgbaToHex(`rgba(${red}, ${green}, ${blue}, ${alpha / 255})`);

    htmlVar += '<tr><td class="key"><b>';
    htmlVar += beautifyAttribute(gfi.red);
    htmlVar += '</b></td><td class="value">';
    htmlVar += red;
    htmlVar += '</td></tr>';
    htmlVar += '<tr><td class="key"><b>';
    htmlVar += beautifyAttribute(gfi.green);
    htmlVar += '</b></td><td class="value">';
    htmlVar += green;
    htmlVar += '</td></tr>';
    htmlVar += '<tr><td class="key"><b>';
    htmlVar += beautifyAttribute(gfi.blue);
    htmlVar += '</b></td><td class="value">';
    htmlVar += blue;
    htmlVar += '</td></tr>';
    htmlVar += '<tr><td class="key"><b>';
    htmlVar += beautifyAttribute(gfi.alpha);
    htmlVar += '</b></td><td class="value">';
    htmlVar += alpha;
    htmlVar += '</td></tr>';
    htmlVar += '<tr><td class="key"><b>';
    htmlVar += beautifyAttribute(gfi.hex);
    htmlVar += '</b></td><td class="value">';
    htmlVar += hex;
    htmlVar += '</td></tr>';
    return htmlVar;
  }

  /**
   * Etiqueta legible de una banda GeoTIFF según roles GDAL en metadatos.
   *
   * @private
   * @function
   * @param {string|null} role Rol espectral (red, green, …).
   * @param {number} bandIndex Índice de banda (1-based).
   * @param {Object} gfi Traducciones getfeatureinfo.
   * @returns {string} Etiqueta para el usuario.
   * @api stable
   */
  static getGeoTIFFBandLabel(role, bandIndex, gfi) {
    if (!isNullOrEmpty(role)) {
      if (role === 'red') {
        return gfi.red;
      }
      if (role === 'green') {
        return gfi.green;
      }
      if (role === 'blue') {
        return gfi.blue;
      }
      if (role === 'nir') {
        return gfi.nir;
      }
      if (role === 'swir') {
        return gfi.swir;
      }
    }
    return `${gfi.band} ${bandIndex}`;
  }

  /**
   * Formatea un valor de banda para mostrarlo en el popup.
   *
   * @private
   * @function
   * @param {number} value Valor numérico de la banda.
   * @returns {string|number}
   * @api stable
   */
  static formatGeoTIFFBandValue(value) {
    if (typeof value !== 'number') {
      return value;
    }
    if (Number.isInteger(value)) {
      return value;
    }
    return value.toFixed(4);
  }

  /**
   * Obtiene canales RGB(A) del píxel para resumen de color.
   *
   * @private
   * @function
   * @param {TypedArray|Array<number>} data Valores por banda.
   * @param {Object<string, number>|null} bandRoles Roles espectrales.
   * @returns {{red: number, green: number, blue: number, alpha: number}|null}
   * @api stable
   */
  static getGeoTIFFRgbChannels(data, bandRoles) {
    if (isNullOrEmpty(bandRoles) || !bandRoles.red || !bandRoles.green || !bandRoles.blue) {
      return null;
    }
    const red = data[bandRoles.red - 1];
    const green = data[bandRoles.green - 1];
    const blue = data[bandRoles.blue - 1];
    const alpha = 255;
    return {
      red,
      green,
      blue,
      alpha,
    };
  }

  /**
   * Añade fila de color hexadecimal derivado de RGB(A) en consulta GeoTIFF.
   *
   * @private
   * @function
   * @param {string} html HTML parcial.
   * @param {number} red Canal rojo.
   * @param {number} green Canal verde.
   * @param {number} blue Canal azul.
   * @param {number} alpha Canal alfa.
   * @param {Object} gfi Traducciones getfeatureinfo.
   * @returns {string}
   * @api stable
   */
  static appendGeoTIFFHexRow(html, red, green, blue, alpha, gfi) {
    let htmlVar = html;
    const hex = rgbaToHex(`rgba(${red}, ${green}, ${blue}, ${alpha / 255})`);
    htmlVar += '<tr><td class="key"><b>';
    htmlVar += beautifyAttribute(gfi.hex);
    htmlVar += '</b></td><td class="value">';
    htmlVar += hex;
    htmlVar += '</td></tr>';
    return htmlVar;
  }

  /**
   * Formatea los valores de banda de un GeoTIFF como tabla HTML.
   *
   * @public
   * @function
   * @param {TypedArray|Array<number>} data Valores por banda del píxel.
   * @param {IDEE.layer.GeoTIFF} layer Capa GeoTIFF.
   * @returns {string} HTML con la información de bandas.
   * @api stable
   */
  static formatGeoTIFFInfo(data, layer) {
    const gfi = getValue('getfeatureinfo');
    const impl = layer.getImpl();
    let bandRoles = null;
    if (impl) {
      bandRoles = impl.getCachedBandRoles();
    }
    const roleByBandIndex = {};
    if (bandRoles) {
      Object.keys(bandRoles).forEach((role) => {
        roleByBandIndex[bandRoles[role]] = role;
      });
    }

    let html = '<div class=\'divinfo\'>';
    html += '<table class=\'api-idee-table\'><tbody>';
    html += '<tr><td class="value" colspan="2">';
    html += gfi.geotiff_intro;
    html += '</td></tr>';

    for (let i = 0; i < data.length; i += 1) {
      const bandIndex = i + 1;
      const role = roleByBandIndex[bandIndex];
      const label = GetFeatureInfo.getGeoTIFFBandLabel(role, bandIndex, gfi);
      const value = GetFeatureInfo.formatGeoTIFFBandValue(data[i]);
      html += '<tr><td class="key"><b>';
      html += beautifyAttribute(label);
      html += '</b></td><td class="value">';
      html += value;
      html += '</td></tr>';
    }

    const rgbChannels = GetFeatureInfo.getGeoTIFFRgbChannels(data, bandRoles);
    if (!isNullOrEmpty(rgbChannels)) {
      html = GetFeatureInfo.appendGeoTIFFHexRow(
        html,
        rgbChannels.red,
        rgbChannels.green,
        rgbChannels.blue,
        rgbChannels.alpha,
        gfi,
      );
    }

    html += '</tbody></table></div>';
    return html;
  }

  buildGenericInfoURL() {
    const allLayers = [...this.facadeMap_.getImpl().getAllLayerInGroup(),
      ...this.facadeMap_.getLayers()];
    const layersGeneric = allLayers.filter((layer) => layer.type === 'GenericRaster');
    const urlsWMTS = [];
    const urlsWMS = [];
    layersGeneric.forEach((layer) => {
      if (layer.getImpl().getLayer().getSource() instanceof WMTS) {
        urlsWMTS.push(layer);
      } else if (layer.getImpl().getLayer().getSource() instanceof TileWMS
      || layer.getImpl().getLayer().getSource() instanceof ImageWMS) {
        urlsWMS.push(layer);
      }
    });
    return [urlsWMTS, urlsWMS];
  }

  /**
   * Devuelve un objeto con la leyenda o el nombre de la capa y la url.
   * @function
   * @public
   * @returns {Object} Objeto con la leyenda o el nombre de la capa y la url.
   * @api
   */
  buildWMSInfoURL(wmsLayers) {
    const olMap = this.facadeMap_.getMapImpl();
    const viewResolution = olMap.getView().getResolution();
    const srs = this.facadeMap_.getProjection().code;

    return wmsLayers.map((layer) => {
      const olLayer = layer.getImpl().getLayer();
      let param;
      if (layer.isVisible() && layer.isQueryable() && !isNullOrEmpty(olLayer)) {
        param = {};
        const getFeatureInfoParams = {
          INFO_FORMAT: this.userFormats[this.currentFormat],
          FEATURE_COUNT: this.featureCount,
        };
        const regexBuffer = /buffer/i;
        const source = olLayer.getSource();
        const coord = this.evt.coordinate;
        if (!regexBuffer.test(layer.url)) {
          getFeatureInfoParams.BUFFER = this.buffer;
        }

        let url = source.getFeatureInfoUrl(coord, viewResolution, srs, getFeatureInfoParams);
        if (isString(IDEE.config.TICKET)) {
          url = addParameters(url, { ticket: IDEE.config.TICKET });
        }
        param = { layer: layer.legend || layer.name, url };
      }
      return param;
    });
  }

  /**
   * Devuelve un objeto con la leyenda o el nombre de la capa y la url.
   * @function
   * @public
   * @returns {Object} Objeto con la leyenda o el nombre de la capa y la url.
   * @api
   */
  buildWMTSInfoURL(wmtsLayers) {
    return wmtsLayers.map((layer) => {
      let param;
      if (layer.isVisible() && layer.isQueryable()) {
        param = {};
        const infoFormat = this.userFormats[this.currentFormat];
        const coord = this.evt.coordinate;
        const roundedZoom = Math.round(this.facadeMap_.getZoom());
        const url = layer.getFeatureInfoUrl(coord, roundedZoom, infoFormat);
        param = { layer: layer.legend || layer.name, url };
      }
      return param;
    });
  }

  /**
   * Este método especifica si la información es válida.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @param {string} info Información.
   * @param {string} formato Formato.
   * @returns {boolean} Verdadero si la información es válida.
   * @public
   * @function
   * @api stable
   */
  static insert(info, formato) {
    let res = false;
    switch (formato) {
      case 'text/html':
        // ex
        const infoContainer = document.createElement('div');
        infoContainer.innerHTML = info;
        // content
        let content = '';
        Array.prototype.forEach.call(infoContainer.querySelectorAll('body'), (element) => {
          content += element.innerHTML.trim();
        });
        Array.prototype.forEach.call(infoContainer.querySelectorAll('div'), (element) => {
          content += element.innerHTML.trim();
        });
        Array.prototype.forEach.call(infoContainer.querySelectorAll('table'), (element) => {
          content += element.innerHTML.trim();
        });
        Array.prototype.forEach.call(infoContainer.querySelectorAll('b'), (element) => {
          content += element.innerHTML.trim();
        });
        Array.prototype.forEach.call(infoContainer.querySelectorAll('span'), (element) => {
          content += element.innerHTML.trim();
        });
        Array.prototype.forEach.call(infoContainer.querySelectorAll('input'), (element) => {
          content += element.innerHTML.trim();
        });
        Array.prototype.forEach.call(infoContainer.querySelectorAll('a'), (element) => {
          content += element.innerHTML.trim();
        });
        Array.prototype.forEach.call(infoContainer.querySelectorAll('img'), (element) => {
          content += element.innerHTML.trim();
        });
        Array.prototype.forEach.call(infoContainer.querySelectorAll('p'), (element) => {
          content += element.innerHTML.trim();
        });
        Array.prototype.forEach.call(infoContainer.querySelectorAll('ul'), (element) => {
          content += element.innerHTML.trim();
        });
        Array.prototype.forEach.call(infoContainer.querySelectorAll('li'), (element) => {
          content += element.innerHTML.trim();
        });

        if ((content.length > 0) && !/WMS\s+server\s+error/i.test(info)) {
          res = true;
        }
        break;

      case 'application/vnd.ogc.gml': // ol.format.GML (http://openlayers.org/en/v3.9.0/apidoc/ol.format.GML.html)
        const formater = new OLFormatWFS();
        const features = formater.readFeatures(info);
        res = (features.length > 0);
        break;

      case 'text/plain': // exp reg
        if (!/returned\s+no\s+results/i.test(info) && !/features\s+were\s+found/i.test(info) && !/:$/i.test(info)) {
          res = true;
        }
        break;
      default:
    }
    return res;
  }

  /**
   * Este método formatea la respuesta.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @param {string} info Información para formatear
   * @param {string} formato Formato específico.
   * @param {string} layername Nombre de la capa.
   * @returns {string} Información formateada.
   * @public
   * @function
   * @api stable
   */
  formatInfo(info, formato, layerName) {
    let formatedInfo = null;
    switch (formato) {
      case 'text/html': // ex
        formatedInfo = info;
        break;
      case 'application/vnd.ogc.gml': // ol.format.GML (http://openlayers.org/en/v3.9.0/apidoc/ol.format.GML.html)
        // let formater = new ol.format.GML();
        // let feature = formater.readFeatures(info)[0];
        const formater = new OLFormatWFS();
        const features = formater.readFeatures(info);
        formatedInfo = '';
        features.forEach((feature) => {
          const attr = feature.getKeys();
          formatedInfo += '<div class=\'divinfo\'>';
          formatedInfo += `<table class='api-idee-table'><tbody><tr><td class='header' colspan='3'>' ${beautifyAttribute(layerName)} '</td></tr>'`;
          for (let i = 0, ilen = attr.length; i < ilen; i += 1) {
            const attrName = attr[i];
            const attrValue = feature.get(attrName);

            formatedInfo += '<tr><td class="key"><b>';
            formatedInfo += beautifyAttribute(attrName);
            formatedInfo += '</b></td><td class="value">';
            formatedInfo += attrValue;
            formatedInfo += '</td></tr>';
          }
          formatedInfo += '</tbody></table></div>';
        });
        break;
      case 'text/plain': // exp reg
        if (GetFeatureInfo.regExs.gsResponse.test(info)) {
          formatedInfo = this.txtToHtmlGeoserver(info, layerName);
        } else {
          formatedInfo = this.txtToHtmlMapserver(info, layerName);
        }
        break;
      default:
    }
    return formatedInfo;
  }

  /**
   * Este método indica si el formato es aceptado por la capa - Formato específico text/html.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   *
   * @param {string} info Información para formatear.
   * @param {string} formato Formato específico.
   * @returns {boolean} Indica si el formato es aceptado por la capa.
   * @public
   * @function
   * @api stable
   */
  static unsupportedFormat(info, formato) {
    let unsupported = false;
    if (formato === 'text/html') {
      unsupported = GetFeatureInfo.regExs.msUnsupportedFormat.test(info);
    }
    return unsupported;
  }

  /**
   * Esta función devuelve información formateada. Geoservidor específico.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   *
   * @public
   * @function
   * @param {string} info Información para formatear.
   * @param {string} layername Nombre de la capa.
   * @returns {string} Información formateada.
   * @api stable
   */
  txtToHtmlGeoserver(info, layerName) {
    // get layer name from the header
    // let layerName = info.replace(/[\w\s\S]*\:(\w*)\'\:[\s\S\w]*/i, "$1");
    // remove header
    let infoVar = info;

    infoVar = infoVar.replace(/[\w\s\S]*':/i, '');

    infoVar = infoVar.replace(/---(-*)(n+)---(-*)/g, '#newfeature#');

    const attrValuesString = infoVar.split('\n');

    let html = '<div class=\'divinfo\'>';

    // build the table
    html += `<table class='api-idee-table'><tbody><tr><td class='header' colspan='3'>${beautifyAttribute(layerName)}</td></tr>`;

    for (let i = 0, ilen = attrValuesString.length; i < ilen; i += 1) {
      const attrValueString = attrValuesString[i].trim();
      if (attrValueString.indexOf('=') !== -1) {
        const attrValue = attrValueString.split('=');
        const attr = attrValue[0].trim();
        let value = '-';
        if (attrValue.length > 1) {
          value = attrValue[1].trim();
          if (value.length === 0 || value === 'null') {
            value = '-';
          }
        }

        if (GetFeatureInfo.regExs.gsGeometry.test(attr) === false) {
          html += '<tr><td class="key"><b>';
          html += beautifyAttribute(attr);
          html += '</b></td><td class="value">';
          html += value;
          html += '</td></tr>';
        }
      } else if (GetFeatureInfo.regExs.gsNewFeature.test(attrValueString)) {
        // set new header
        html += `<tr><td class="header" colspan="3">${beautifyAttribute(layerName)}</td></tr>`;
      }
    }

    html += '</tbody></table></div>';

    return html;
  }

  /**
   * Esta función devuelve información formateada. Servidor de mapas específico.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @public
   * @function
   * @param {string} info Información para formatear.
   * @returns {string} Información formateada.
   * @api
   */
  txtToHtmlMapserver(info) {
    let infoVar = info;
    // remove header
    infoVar = infoVar.replace(/[\w\s\S]*(layer)/i, '$1');

    // get layer name
    const layerName = infoVar.replace(/layer(\s*)'(\w+)'[\w\s\S]*/i, '$2');

    // remove layer name
    infoVar = infoVar.replace(/layer(\s*)'(\w+)'([\w\s\S]*)/i, '$3');

    // remove feature number
    infoVar = infoVar.replace(/feature(\s*)(\w*)(\s*)(:)([\w\s\S]*)/i, '$5');

    // remove simple quotes
    infoVar = infoVar.replace(/'/g, '');

    // replace the equal (=) with (;)
    infoVar = infoVar.replace(/=/g, ';');

    const attrValuesString = infoVar.split('\n');

    let html = '';
    const htmlHeader = `<table class='api-idee-table'><tbody><tr><td class='header' colspan='3'>${beautifyAttribute(layerName)}</td></tr>`;

    for (let i = 0, ilen = attrValuesString.length; i < ilen; i += 1) {
      const attrValueString = attrValuesString[i].trim();
      const nextAttrValueString = attrValuesString[i] ? attrValuesString[i].trim() : '';

      const attrValue = attrValueString.split(';');
      const attr = attrValue[0].trim();
      let value = '-';
      if (attrValue.length > 1) {
        value = attrValue[1].trim();
        if (value.length === 0) {
          value = '-';
        }
      }

      if (attr.length > 0) {
        if (GetFeatureInfo.regExs.msNewFeature.test(attr)) {
          if ((nextAttrValueString.length > 0)
            && !GetFeatureInfo.regExs.msNewFeature.test(nextAttrValueString)) {
            // set new header
            html += `<tr><td class='header' colspan='3'>${beautifyAttribute(layerName)}</td><td></td></tr>`;
          }
        } else {
          html += '<tr><td class="key"><b>';
          html += beautifyAttribute(attr);
          html += '</b></td><td class="value">';
          html += value;
          html += '</td></tr>';
        }
      }
    }

    if (html.length > 0) {
      html = `${htmlHeader + html}</tbody></table>`;
    }

    return html;
  }

  /**
   * Este método muestra información en una ventana emergente.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @public
   * @function
   * @param {array<object>} layerNamesUrls Capas consultadas
   * @param {array} coordinate Posición de las coordenadas al hacer clic.
   * @param {olMap} olMap Mapa.
   * @param {Array<{formatedInfo: string, layerName: string}>} clientLayerInfos
   * Información ya calculada en cliente (GeoTIFF, XYZ, etc.).
   * @api
   */
  showInfoFromURL_(layerNamesUrls, coordinate, olMap, clientLayerInfos = []) {
    const infos = clientLayerInfos.map((item) => ({
      formatedInfo: item.formatedInfo,
      layerName: item.layerName,
    }));
    const formato = this.userFormats[this.currentFormat];

    if (layerNamesUrls.length === 0) {
      this.renderGetFeatureInfoPopup_(infos, coordinate, null);
      this.popup_ = this.facadeMap_.getPopup();
      return;
    }

    const htmlAsText = compileTemplate(getfeatureinfoPopupTemplate, {
      vars: {
        info: GetFeatureInfo.LOADING_MESSAGE,
      },
      parseToHtml: false,
    });

    let contFull = 0;
    const loadingInfoTab = {
      icon: 'g-cartografia-info',
      title: GetFeatureInfo.POPUP_TITLE,
      content: htmlAsText,
    };
    let popup = this.facadeMap_.getPopup();

    if (isNullOrEmpty(popup)) {
      popup = new Popup();
      popup.addTab(loadingInfoTab);
      this.facadeMap_.addPopup(popup, coordinate);
    } else {
      const hasExternalContent = popup
        .getTabs().some((tab) => tab.title !== GetFeatureInfo.POPUP_TITLE);
      if (!hasExternalContent) {
        this.facadeMap_.removePopup();
        popup = new Popup();
        popup.addTab(loadingInfoTab);
        this.facadeMap_.addPopup(popup, coordinate);
      } else {
        popup.addTab(loadingInfoTab);
      }
    }
    layerNamesUrls.forEach((layerNameUrl) => {
      const url = layerNameUrl.url;
      const layerName = layerNameUrl.layer;
      getRemote(url).then((response) => {
        popup = this.facadeMap_.getPopup();
        if (response.code === 200 && response.error === false) {
          const info = response.text;
          if (GetFeatureInfo.insert(info, formato) === true) {
            const formatedInfo = this.formatInfo(info, formato, layerName);
            infos.push({ formatedInfo, layerName });
          } else if (GetFeatureInfo.unsupportedFormat(info, formato)) {
            if (this.currentFormat > 2) {
              infos.push({
                formatedInfo: getValue('getfeatureinfo').any_format,
                layerName,
              });
            } else {
              this.currentFormat += 1;
              this.buildUrl_(dialog, this.evt);
              return;
            }
          }
        }
        contFull += 1;
        if (layerNamesUrls.length === contFull && !isNullOrEmpty(popup)) {
          this.renderGetFeatureInfoPopup_(infos, coordinate, loadingInfoTab);
        }
      });
    });
    this.popup_ = popup;
  }

  /**
   * Muestra el popup de GetFeatureInfo con la información recopilada.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   *
   * @private
   * @function
   * @param {Array<{formatedInfo: string, layerName: string}>} infos Información por capa.
   * @param {Array<number>} coordinate Coordenadas del clic.
   * @param {Object|null} loadingInfoTab Pestaña de carga a eliminar, si existe.
   * @api stable
   */
  renderGetFeatureInfoPopup_(infos, coordinate, loadingInfoTab) {
    let popup = this.facadeMap_.getPopup();
    let isNewPopup = false;
    if (isNullOrEmpty(popup)) {
      popup = new Popup();
      isNewPopup = true;
    } else if (!isNullOrEmpty(loadingInfoTab)) {
      popup.removeTab(loadingInfoTab);
    }

    if (infos.length === 0) {
      popup.addTab({
        icon: 'g-cartografia-info',
        title: GetFeatureInfo.POPUP_TITLE,
        content: getValue('getfeatureinfo').no_info,
      });
      if (isNewPopup) {
        this.facadeMap_.addPopup(popup, coordinate);
      }
      return;
    }

    const popupContent = compileTemplate(getfeatureinfoLayers, {
      vars: {
        layers: infos,
        info_of: getValue('getfeatureinfo').info_of,
      },
      parseToHtml: false,
    });
    const parsedContent = popupContent.replace(/(.*)(<a href=.*)(>.*<\/a.*)/g, '$1$2 target="_blank"$3');
    popup.addTab({
      icon: 'g-cartografia-info',
      title: GetFeatureInfo.POPUP_TITLE,
      content: parsedContent,
      listeners: [{
        selector: '.m-getfeatureinfo-content-info div.m-arrow-right',
        all: true,
        type: 'click',
        callback: (e) => this.toogleSection(e),
      }],
    });
    if (isNewPopup) {
      this.facadeMap_.addPopup(popup, coordinate);
    }
  }

  /**
   * Este método manejan el comportamiento de cierre/apertura de las secciones.
   *
   * @public
   * @function
   * @param {Event} e Evento.
   * @api
   */
  toogleSection(e) {
    const { target } = e;
    const { parentElement } = target.parentElement;
    const content = parentElement.querySelector('.m-getfeatureinfo-content-info-body');
    if (content.classList.contains('m-content-collapsed')) {
      content.classList.remove('m-content-collapsed');
      target.classList.remove('m-arrow-right');
      target.classList.add('m-arrow-down');
      const coordinates = this.popup_.getCoordinate();
      if (!isNullOrEmpty(this.popup_.getImpl().panIntoView)) {
        this.popup_.getImpl().panIntoView(coordinates);
      }
    } else {
      content.classList.add('m-content-collapsed');
      target.classList.add('m-arrow-right');
      target.classList.remove('m-arrow-down');
    }
  }
}

/**
 * Cargando mensaje.
 * @const
 * @type {string}
 * @public
 * @api
 */
GetFeatureInfo.LOADING_MESSAGE = 'Obteniendo información...';

/**
 * Título para la ventana emergente.
 * @const
 * @type {string}
 * @public
 * @api
 */
GetFeatureInfo.POPUP_TITLE = getValue('getfeatureinfo').info;

/**
 * Expresiones regulares de GetFeatureInfo.
 * @type {object}
 * @public
 * @api
 */
GetFeatureInfo.regExs = {
  gsResponse: /^results[\w\s\S]*'http:/i,
  msNewFeature: /feature(\s*)(\w+)(\s*):/i,
  gsNewFeature: /#newfeature#/,
  gsGeometry: /geom$/i,
  msGeometry: /boundedby$/i,
  msUnsupportedFormat: /error(.*)unsupported(.*)info_format/i,
};

export default GetFeatureInfo;
