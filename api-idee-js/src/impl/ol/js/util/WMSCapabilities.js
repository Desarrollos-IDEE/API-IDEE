/**
 * @module IDEE/impl/GetCapabilities
 */
import {
  isUndefined, isArray, isNullOrEmpty, isObject, isString,
} from 'IDEE/util/Utils';
import WMS from 'IDEE/layer/WMS';
import { get as getProjection } from 'ol/proj';
import ImplUtils from './Utils';

/**
  * @classdesc
  * Implementación de la clase GetCapabilities. Crea una capa WMS
  * con parámetros especificados por el usuario.
  *
  * @property {Object} capabilities_ Metadatos sobre WMS.
  * @property {Mx.Projection} projection_ Proyección.
  * @property {String} serviceUrl_ URL del WMS.
  *
  * @api
  */
class GetCapabilities {
  /**
    * Constructor principal de la clase. Crea una capa WMS
    * con parámetros especificados por el usuario.
    *
    * @constructor
    * @param {Object} capabilities Metadatos sobre WMS.
    * @param {String} serviceUrl URL del WMS.
    * @param {Mx.Projection} projection Proyección.
    * @api
    */
  constructor(capabilities, serviceUrl, projection) {
    /**
      * Metadatos sobre WMS.
      * @private
      * @type {Object}
      */
    this.capabilities_ = capabilities;

    /**
      * Proyección.
      * @private
      * @type {Mx.Projection}
      */
    this.projection_ = projection;

    /**
      * URL del WMS.
      * @private
      * @type {String}
      */
    this.serviceUrl_ = serviceUrl;

    /**
      * Flag para indicar si la extensión ya ha sido transformada.
      * @private
      * @type {Boolean}
      */
    this.extentAlreadyTransformed_ = false;
  }

  /**
    * Devuelve los metadatos sobre WMS.
    *
    * @function
    * @getter
    * @return {Object} Metadatos sobre el servicio.
    * @public
    * @api
    */
  get capabilities() {
    return this.capabilities_;
  }

  /**
    * Devuelve la proyección del WMS.
    *
    * @function
    * @getter
    * @return {Mx.Projection} Proyección del WMS.
    * @public
    * @api
    */
  get projection() {
    return this.projection_;
  }

  /**
    * Devuelve la URL del WMS.
    *
    * @function
    * @getter
    * @return {String} URL del WMS.
    * @public
    * @api
    */
  get serviceUrl() {
    return this.serviceUrl_;
  }

  /**
   * Este método calcula la extensión de una capa
   * específica a partir de su 'GetCapabilities'.
   *
   * @function
   * @param {String} layerName Nombre de la capa.
   * @param {String} projection Código de la proyección para transformar
   * la extensión devuelta en el método
   * @return {Array<Number>} Extensión.
   * @public
   * @api
   */
  getLayerExtent(layerName, projection) {
    const layer = this.capabilities_.Capability.Layer;
    const extent = this.getExtentRecursive_(layer, layerName, projection);
    return this.transformExtent(extent);
  }

  /**
   * Este método calcula recursivamente la extensión de
   * una capa específica a partir de su 'GetCapabilities'.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @function
   * @param {Mx.GetCapabilities} layer Lista de capas disponibles en el servicio.
   * @param {String} layerName Nombre de la capa.
   * @param { String } tgtProjection Código de la proyección para transformar la
   * extensión devuelta en el método
   * @return {Array<Number>} Extensión.
   * @public
   * @api
   */
  getExtentRecursive_(layer, layerName, tgtProjection) {
    let extent = null;
    let i;
    if (!isNullOrEmpty(layer)) {
      // array
      if (isArray(layer)) {
        for (i = 0; i < layer.length && extent === null; i += 1) {
          extent = this.getExtentRecursive_(layer[i], layerName, tgtProjection);
        }
      } else if (isObject(layer)) {
        // base case
        if (isNullOrEmpty(layerName) || (layer.Name === layerName)
          || (isString(layer.Name) && isString(layerName)
          && layer.Name.toLowerCase() === layerName.toLowerCase())) {
          const projection = tgtProjection || this.projection_.code;
          if (!isNullOrEmpty(layer.BoundingBox)) {
            const bboxSameProj = layer.BoundingBox.find((bbox) => bbox.crs === projection);
            if (!isNullOrEmpty(bboxSameProj)) {
              this.capabilitiesProj = bboxSameProj.crs;
              extent = bboxSameProj.extent;
            } else {
              const bbox = layer.BoundingBox[0];
              this.capabilitiesProj = bbox.crs;
              const projSrc = getProjection(bbox.crs) || getProjection(bbox.srs);
              const projDest = getProjection(projection);
              let bboxExtent = bbox.extent;
              if (this.isReversedAxisOrder_(bbox.crs, projSrc)) {
                bboxExtent = [bbox.extent[1], bbox.extent[0], bbox.extent[3], bbox.extent[2]];
              }
              extent = ImplUtils.transformExtent(bboxExtent, projSrc, projDest);
              this.extentAlreadyTransformed_ = true;
            }
          } else if (!isNullOrEmpty(layer.LatLonBoundingBox)) {
            const bbox = layer.LatLonBoundingBox[0];
            this.capabilitiesProj = 'EPSG:4326';
            const projSrc = getProjection('EPSG:4326');
            const projDest = getProjection(projection);
            extent = ImplUtils.transformExtent(bbox.extent, projSrc, projDest);
            this.extentAlreadyTransformed_ = true;
          }
        } else if (!isUndefined(layer.Layer)) {
          // recursive case
          extent = this.getExtentRecursive_(layer.Layer, layerName, tgtProjection);
        }
      }
    }
    return extent;
  }

  /**
   * Determina si el BoundingBox de un CRS en WMS 1.3.0 tiene el orden
   * de ejes invertido (lat/lon en lugar de lon/lat).
   *
   * En WMS 1.3.0, los CRS geográficos (como EPSG:4326, EPSG:4230, etc.)
   * definen su BoundingBox en orden (lat, lon), pero OL/proj4 internamente
   * usa (lon, lat). Se necesita intercambiar los ejes antes de transformar.
   *
   * @param {String} crsCode Código del CRS (e.g. 'EPSG:4230').
   * @param {ol.proj.Projection} proj Proyección de OL.
   * @return {Boolean} true si los ejes deben intercambiarse.
   * @private
   */
  isReversedAxisOrder_(crsCode, proj) {
    if (this.capabilities_.version !== '1.3.0' || !proj || isNullOrEmpty(crsCode)) {
      return false;
    }
    const crs = crsCode.toUpperCase();
    // CRS:84 usa orden lon/lat (e/n); no aplicar intercambio de ejes WMS 1.3.0
    if (crs === 'CRS:84' || crs === 'OGC:1.3:CRS84' || crs.includes('CRS84')) {
      return false;
    }
    const axisOrientation = proj.getAxisOrientation();
    if (axisOrientation && axisOrientation.substr(0, 2) === 'ne') {
      return true;
    }
    const units = proj.getUnits();
    if (units === 'd' || units === 'degrees' || units === 'degree') {
      return true;
    }
    return false;
  }

  /**
    * Este método obtiene las capas a partir de su 'GetCapabilities'.
    *
    * @function
    * @return {Array<IDEE.Layer>} Capas WMS.
    * @public
    * @api
    */
  getLayers() {
    const layer = this.capabilities_.Capability.Layer;
    const layers = this.getLayersRecursive_(layer);
    return layers;
  }

  /**
    * Este método obtiene las capas recursivamente
    * a partir de su 'GetCapabilities'.
    *
    * @function
    * @param {Mx.GetCapabilities} layer Lista de capas disponibles en el servicio.
    * @return {Array<IDEE.Layer>} Capas WMS.
    * @private
    * @api
    */
  getLayersRecursive_(layer) {
    let layers = [];
    if (!isNullOrEmpty(layer.Layer)) {
      layers = this.getLayersRecursive_(layer.Layer);
    } else if (isArray(layer)) {
      layer.forEach((layerElem) => {
        layers = layers.concat(this.getLayersRecursive_(layerElem));
      });
    } else { // base case
      let imageFormat = 'image/png';
      try {
        const formats = this.capabilities_.Capability.Request.GetMap.Format;
        if (formats.length === 1) {
          imageFormat = formats[0];
        }
      } catch (err) { /* Continue */ }
      layers.push(new WMS({
        url: this.serviceUrl_,
        name: layer.Name,
        legend: !isNullOrEmpty(layer.Title) ? layer.Title : '',
      }, { format: imageFormat }, {
        capabilitiesMetadata: {
          abstract: !isNullOrEmpty(layer.Abstract) ? layer.Abstract : '',
          attribution: !isNullOrEmpty(layer.Attribution) ? layer.Attribution : '',
          metadataURL: !isNullOrEmpty(layer.MetadataURL) ? layer.MetadataURL : '',
          style: !isNullOrEmpty(layer.Style) ? layer.Style : '',
        },
      }));
    }
    return layers;
  }

  /**
    * AJUSTE
    *
    * Contexto: Como se indica en OGC Web Map Services v1.3.0,
    * el rectángulo mínimo envolvente de capa
    * declarado en GetCapabilities debe definirse utilizando el orden de coordenadas establecido
    * en el CRS.
    * Por ejemplo, en el caso de EPSG:4326, el orden del rectángulo mínimo envolvente debe ser
    * (min_lat, min_long, max_lat, max_long). Este orden también debe usarse en la solicitud de
    * GetMap. Sin embargo, a partir de WMS 1.1.0, el orden de coordenadas siempre se especificó en
    * orden LongLat.
    *
    * Para mantener la compatibilidad para todos los clientes, OpenLayers cambia automáticamente el
    * orden en caso de usar un servicio v1.3.0. Esto entra en conflicto con nuestro
    * propio desarrollo,
    * dado que proporcionamos el rectángulo mínimo envolvente en el mismo orden que se declara
    * en GetCapabilities,
    * lo que resulta en una solicitud incorrecta al servicio enviando un CRS con el orden LatLong.
    *
    * @function
    * @param {Array<Number>} extent Extensión.
    * @return {Array<Number>} Transformación de la extensión especificada.
    * @public
    * @api
    */
  transformExtent(extent) {
    let result = extent;

    if (this.extentAlreadyTransformed_) {
      this.extentAlreadyTransformed_ = false;
      return result;
    }

    if (this.capabilities_.version === '1.3.0' && isString(this.capabilitiesProj)) {
      const crs = this.capabilitiesProj.toUpperCase();
      if (crs === 'CRS:84' || crs === 'OGC:1.3:CRS84' || crs.includes('CRS84')) {
        return result;
      }
      const proj = getProjection(this.capabilitiesProj);
      if (proj && Array.isArray(result)) {
        const axisOrientation = proj.getAxisOrientation();
        const units = proj.getUnits();
        const isReversed = (axisOrientation && axisOrientation.substr(0, 2) === 'ne')
          || units === 'd' || units === 'degrees' || units === 'degree';
        if (isReversed) {
          result = [extent[1], extent[0], extent[3], extent[2]];
        }
      }
    }
    return result;
  }
}

export default GetCapabilities;
