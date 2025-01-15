/**
 * @module M/impl/source/ImageWMS
 */
import OLSourceImageWMS from 'ol/source/ImageWMS';

/**
 * @classdesc
 * Fuente para servidores WMS que proporcionan imágenes únicas sin procesar.
 * @api
 */
class ImageWMS extends OLSourceImageWMS {
  /**
   * @constructor
   * @fires ol.source.ImageEvent
   * @extends {ol.source.Image}
   * @param {olx.source.ImageWMSOptions=} optOptions Opciones:
   * - attributions: Atribuciones
   * - crossOrigin: atributo crossOrigin para las imágenes cargadas.
   * Tenga en cuenta que debe proporcionar un valor "crossOrigin" si desea acceder a
   * los datos de píxeles con el renderizador de Canvas.
   * - hidpi: Utilice el valor ol/Map#pixelRatio cuando solicite la
   * imagen del servidor remoto.
   * - serverType: El tipo de servidor WMS remoto: mapserver, geoserver, carmentaserver o qgis.
   * Solo es necesario si hidpi es verdadero.
   * - imageLoadFunction: Cargar una imagen dada una URL.
   * - params: Parámetros de solicitud de WMS. Se requiere al menos un parámetro LAYERS.
   * - projection: Proyección. El valor predeterminado es la proyección de la vista.
   * - ratio: 1 significa que las solicitudes de imágenes tienen el
   * tamaño de la ventana gráfica del mapa, 2 significa el doble
   * del ancho y la altura de la ventana gráfica del mapa, y así sucesivamente.
   * - resolutions: Resoluciones. Si se especifica, las solicitudes se realizarán
   * solo para estas resoluciones.
   * - url: URL del servicio WMS.
   * @api stable
   */
  constructor(optOptions = {}) {
    const options = optOptions;

    super(options);
    this.imageLoadFunction_ = options.imageLoadFunction || this.imageLoadFunction;
  }

  /**
   * Evento de cambio genérico. Se activa cuando se incrementa el contador de revisión.
   * @public
   * @function
   * @api stable
   */
  changed() {
    // super changed
    super.changed();
  }

  /**
   * Carga de imagen de la fuente.
   * @public
   * @function
   * @param {ol.Image} image Imagen.
   * @param {string} src URL de la imagen.
   * @api stable
   */
  imageLoadFunction(image, src) {
    const imageVariable = image;
    imageVariable.getImage().src = `${src}&_=${this.revision_}`;
  }
}

export default ImageWMS;
