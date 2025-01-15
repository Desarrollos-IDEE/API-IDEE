/**
 * @module M/impl/format/WMTSCapabilities
 */
import { isNullOrEmpty } from 'M/util/Utils';
import { optionsFromCapabilities } from 'ol/source/WMTS';
import OLFormatWMTSCapabilities from 'ol/format/WMTSCapabilities';

/**
  * @classdesc
  * Implementación del formateador WMTS.
  *
  * @property {ol.format.WMTSCapabilities} parser Formato para leer datos de capacidades WMTS.
  * @property {ol.format.WMTSCapabilitiesOptions} capabilities Capacidades del WMTS.
  *
  * @api
  */
class WMTSCapabilities {
  /**
    * Constructor principal de la clase. Crea un formateador WMTS.
    *
    * @constructor
    * @param {Mx.parameters.LayerOptions} options Opciones personalizadas para
    * este formateador.
    * @api
    */
  constructor(options = {}) {
    /**
      * Formato para leer datos de capacidades WMTS.
      * @public
      * @type {ol.format.XML}
      */
    this.parser = new OLFormatWMTSCapabilities();

    /**
      * Capacidades del WMTS.
      * @public
      * @type {Mx.WMTSGetCapabilities}
      */
    this.capabilities = null;
  }

  /**
    * Este método obtiene las capacidades del WMTS.
    *
    * @function
    * @param {Document|Element|string} capabilities XML.
    * @returns {Object} Objeto "ol.source.WMTS.optionsFromCapabilities".
    * @public
    * @api
    */
  read(capabilities) {
    this.capabilities = this.parser.read(capabilities);
    return this;
  }

  /**
    * Este método devuelve el conjunto de matrices del WMTS.
    *
    * @function
    * @param {String} layerName Nombre de la capa.
    * @param {String} srid SRID (Identificador de Referencia Espacial).
    * @returns {String} Nombre del conjunto de matrices.
    * @public
    * @api
    */
  getMatrixSet(layerName, srid) {
    let matrixSet;
    for (let i = 0; i < this.capabilities.Contents.Layer.length
        && matrixSet === undefined; i += 1) {
      const layer = this.capabilities.Contents.Layer[i];
      if (layer.Identifier === layerName) {
        if (!isNullOrEmpty(srid)) {
          // gets the matrixSet by the SRID
          matrixSet = layer.TileMatrixSetLink.find((matrixSetLink) => {
            return matrixSetLink.contains(srid);
          });
        }
        if (matrixSet === undefined) {
          matrixSet = layer.TileMatrixSetLink[0].TileMatrixSet;
        }
      }
    }
    return matrixSet;
  }

  /**
    * Este método obtiene una lista con los identificadores de la matriz.
    *
    * @function
    * @param {String} layerName Nombre de la capa.
    * @param {String} srid SRID (Identificador de Referencia Espacial).
    * @returns {Array<String>} Identificadores de la matriz.
    * @public
    * @api
    */
  getMatrixIds(layerName, srid) {
    let matrixIds = [];
    const matrixSet = this.getMatrixSet(layerName, srid);
    const tileMatrixSet = this.capabilities.Contents.TileMatrixSet.find((tMatrixSet) => {
      return tMatrixSet.Identifier === matrixSet;
    });
    if (tileMatrixSet != null && tileMatrixSet.length > 0) {
      matrixIds = tileMatrixSet.TileMatrix.map((tileMatrix) => tileMatrix.Identifier);
    }
    return matrixIds;
  }

  /**
    * Este método devuelve el formato del WMTS.
    *
    * @function
    * @param {String} layer Nombre de la capa.
    * @returns {String} Formato de la capa.
    * @public
    * @api
    */
  getFormat(layerName) {
    let format;
    const layer = this.capabilities.Contents.Layer.find((l) => l.Identifier === layerName);
    if (layer != null) {
      format = layer.Format[0];
    }
    return format;
  }

  /**
    * Este método obtiene las opciones de las capacidades del WMTS.
    *
    * @function
    * @param {String} layerName Nombre de la capa.
    * @param {Object} matrixSet Identificador del conjunto de matrices.
    * @returns {Object} Objeto de opciones de origen WMTS o nulo si no se
    * encontró la capa.
    * @public
    * @api
    */
  getOptionsFromCapabilities(layerName, matrixSet) {
    const options = optionsFromCapabilities(this.capabilities, {
      layer: layerName,
      matrixSet,
    });

    return options;
  }
}

export default WMTSCapabilities;
