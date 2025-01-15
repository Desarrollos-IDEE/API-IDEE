/**
 * @module M/impl/control/GetFeatureInfo
 */
import OLFormatWFS from 'ol/format/WFS';
import { unByKey } from 'ol/Observable';
import WMTS from 'ol/source/WMTS';
import TileWMS from 'ol/source/TileWMS';
import ImageWMS from 'ol/source/ImageWMS';
import * as dialog from 'M/dialog';
import getfeatureinfoPopupTemplate from 'templates/getfeatureinfo_popup';
import getfeatureinfoLayers from 'templates/getfeatureinfo_layers';
import Popup from 'M/Popup';
import { get as getRemote } from 'M/util/Remote';
import { compileSync as compileTemplate } from 'M/util/Template';
import { isNullOrEmpty, beautifyAttribute } from 'M/util/Utils';
import { getValue } from 'M/i18n/language';
import Control from './Control';

/**
 * @classdesc
 * Agrega la herramienta de consulta de información de capas WMS y WMTS.
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
   * @extends {M.impl.Control}
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
   * @param {M.Map} map Mapa.
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
   * @param {M.dialog} dialogParam Dialogo.
   * @api stable
   */
  buildUrl_(dialogParam, evt) {
    this.evt = evt;
    const olMap = this.facadeMap_.getMapImpl();
    const [urlsWMTS, urlsWMS] = this.buildGenericInfoURL();

    const allLayers = [...this.facadeMap_.getImpl().getAllLayerInGroup(),
      ...this.facadeMap_.getLayers()];

    const wms = allLayers.filter((layer) => layer.type === 'WMS');
    const wmts = allLayers.filter((layer) => layer.type === 'WMTS');

    const wmsInfoURLS = this.buildWMSInfoURL([...wms, ...urlsWMS]);
    const wmtsInfoURLS = this.buildWMTSInfoURL([...wmts, ...urlsWMTS]);

    const layerNamesUrls = [...wmtsInfoURLS, ...wmsInfoURLS]
      .filter((layer) => !isNullOrEmpty(layer));
    if (layerNamesUrls.length > 0) {
      this.showInfoFromURL_(layerNamesUrls, evt.coordinate, olMap);
    } else {
      dialogParam.info('No existen capas consultables');
    }
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

        const url = source.getFeatureInfoUrl(coord, viewResolution, srs, getFeatureInfoParams);
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
        const url = layer.getFeatureInfoUrl(coord, this.facadeMap_.getZoom(), infoFormat);
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
   * @api
   */
  showInfoFromURL_(layerNamesUrls, coordinate, olMap) {
    const htmlAsText = compileTemplate(getfeatureinfoPopupTemplate, {
      vars: {
        info: GetFeatureInfo.LOADING_MESSAGE,
      },
      parseToHtml: false,
    });

    const infos = [];
    const formato = this.userFormats[this.currentFormat];
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
          popup.removeTab(loadingInfoTab);
          if (infos.length === 0) {
            popup.addTab({
              icon: 'g-cartografia-info',
              title: GetFeatureInfo.POPUP_TITLE,
              content: getValue('getfeatureinfo').no_info,
            });
          } else {
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
          }
        }
      });
    });
    this.popup_ = popup;
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
