/**
 * @module M/impl/source/TileWMS
 */
import { isNullOrEmpty } from 'M/util/Utils';
import OLSourceTileWMS from 'ol/source/TileWMS';

/**
 * @classdesc
 * Fuente de capa para datos de teselas de servidores WMS.
 * @api
 */
class TileWMS extends OLSourceTileWMS {
  /**
   * @constructor
   * @extends {ol.source.TileImage}
   * @param {olx.source.TileWMSOptions=} opt_options Opciones.
   * - attributions: Atribuciones.
   * - attributionsCollapsible: Las atribuciones son plegables.
   * - cacheSize: Tamaño inicial de caché de teselas.
   * - crossOrigin: Atributo crossOrigin para las imágenes cargadas.
   * - interpolate: Valores interpolados al volver a muestrear.
   * - params: Parámetros de solicitud de WMS. Se requiere al menos un parámetro LAYERS.
   * - gutter: El tamaño en píxeles alrededor de los mosaicos de
   * imágenes que se ignorarán.
   * - hidpi: Utilice el valor ol/Map#pixelRatio cuando solicite la
   * imagen del servidor remoto.
   * - projection: Proyección. El valor predeterminado
   * es la proyección de la vista.
   * - reprojectionErrorThreshold: Error de reproyección máximo permitido (en píxeles).
   * - tileClass: Clase utilizada para crear instancias de mosaicos de imágenes.
   * El valor predeterminado es "ImageTile".
   * - tileGrid: La cuadrícula de teselas.
   * - tileLoadFunction: Cargar una imagen dada una URL.
   * - url: URL del servicio WMS.
   * - urls: URLs del servicio WMS.
   * - wrapX: El mosaico de imágenes se repetirá horizontalmente.
   * - transition: Transición de la opacidad entre las imágenes de teselas.
   * - zDirection: Dirección de la cuadrícula de teselas.
   * @api stable
   */

  constructor(optOptions = {}) {
    const options = optOptions;
    if (isNullOrEmpty(optOptions.tileLoadFunction)) {
      options.tileLoadFunction = TileWMS.tileLoadFunction;
    }
    super(options);
  }

  /**
   * Evento de cambio genérico. Se activa cuando se incrementa el contador de revisión.
   * @public
   * @function
   * @api stable
   */

  changed() {
    if (!isNullOrEmpty(this.tileCache)) {
      this.tileCache.clear();
    }
    // super changed
    super.changed();
  }

  /**
   * Carga de teselas de la fuente.
   * @public
   * @function
   * @param {ol.ImageTile} imageTile Tesela.
   * @param {string} src URL de la tesela.
   * @api stable
   */
  static tileLoadFunction(imageTileParam, src) {
    const imageTile = imageTileParam;
    imageTile.getImage().src = `${src}&_= ${this.revision_}`;
  }
}

export default TileWMS;
