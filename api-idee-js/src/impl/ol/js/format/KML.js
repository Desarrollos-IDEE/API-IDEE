/**
 * @module M/impl/format/KML
 */
import { parse as parseXML } from 'ol/xml';
import { isNullOrEmpty, decodeHtml } from 'M/util/Utils';
import OLFormatKML from 'ol/format/KML';
import Icon from 'ol/style/Icon';

/**
 * @classdesc
 * Implementación del formateador KML.
 *
 * @property {Object} screenOverlay_ "Popup".
 * @property {bool} label_ Indica si incluye la opción "label".
 *
 * @api
 * @extends {ol.format.KML}
 */
class KML extends OLFormatKML {
  /**
   * Constructor principal de la clase. Formato de los objetos geográficos para
   * leer y escribir datos en formato KML.
   *
   * @constructor
   * @param {olx.format.KMLOptions} optOptions Opciones del formato KML.
   * - extractStyles: Extraer estilos del KML. Por defecto es verdadero.
   * - defaultStyle: Estilo por defecto. El estilo por defecto es el mismo que
   * el de Google Earth.
   * - writeStyles: Escribir estilos en el KML. Por defecto es verdadero.
   * - iconUrlFunction: Función que toma una URL como cadena y devuelve una URL
   * como cadena.
   * -label: Define si se muestra la etiqueta o no.Por defecto mostrará la etiqueta.
   * que contienen puntos. Por defecto es verdadero.
   * @api
   */
  constructor(optOptions = {}) {
    super({ showPointNames: optOptions.label, extractStyles: optOptions.extractStyles });

    /**
     * "Popup".
     * @private
     * @type {Object}
     */
    this.screenOverlay_ = null;
  }

  /**
   * Este método devuelve los objetos geográficos obtenidos de una fuente y los personaliza.
   *
   * @function
   * @param {Document|Element|Object|string} textResponse Respuesta que contiene los
   * objetos geográficos.
   * @param {Object} options Opciones.
   * - dataProjection: Proyección de los datos leídos.
   * - extent: Extensión de la tesela en unidades de mapa de la tesela leída.
   * - featureProjection: Proyección de las geometrías de los objetos geográficos creadas por el
   * lector de formato.
   * @returns {M.Feature} Objetos geográficos personalizados.
   * @public
   * @api
   */
  readCustomFeatures(textResponse, options) {
    const features = this.readFeatures(textResponse, options);
    const featuresModified = features.map((feature) => {
      const hasStyle = feature.getStyle();
      if (!isNullOrEmpty(hasStyle)) {
        let styles = hasStyle(feature);
        if (!Array.isArray(styles)) {
          styles = [styles];
        }
        styles.forEach((style) => {
          if (style.getImage() instanceof Icon) {
            const image = style.getImage();
            // error de CORS Impresión
            // image.getImage().removeAttribute('crossorigin');
            style.setImage(image);
          }
        });
      }
      feature.set('name', decodeHtml(feature.get('name')));
      return feature;
    });
    this.readScreenOverlay(textResponse);
    return featuresModified;
  }

  /**
   * Este método obtiene los atributos del "popup".
   *
   * @function
   * @param {string} textResponse Respuesta.
   * @public
   * @api
   */
  readScreenOverlay(textResponse) {
    // Attributes ScreenOverlay
    const screenOverlayAttr = 'ScreenOverlay';
    const iconAttr = 'Icon';
    const hrefAttr = 'href';
    const overlayXYAttr = 'overlayXY';
    const screenXYAttr = 'screenXY';
    const rotationXYAttr = 'rotationXY';
    const sizeAttr = 'size';
    const xUnitsAttr = 'xunits';
    const yUnitsAttr = 'yunits';

    const screenOverlay = parseXML(textResponse).querySelector(screenOverlayAttr);
    if (screenOverlay !== null) {
      const icon = screenOverlay.querySelector(iconAttr);

      // Icon src of ScreenOverlay
      const src = icon !== null
        ? icon.querySelector(hrefAttr).innerHTML
        : KML.DEFAULT_NO_IMAGE_STYLE;

      // overlayXY (offset)
      let overlayXY;
      let overlayXUnits;
      let overlayYUnits;
      const overlayXYElement = screenOverlay.querySelector(overlayXYAttr);
      if (overlayXYElement !== null) {
        const attributeX = parseFloat(overlayXYElement.getAttribute('x'));
        const attributeY = parseFloat(overlayXYElement.getAttribute('y'));
        overlayXY = [attributeX, attributeY];
        overlayXUnits = overlayXYElement.getAttribute(xUnitsAttr);
        overlayYUnits = overlayXYElement.getAttribute(yUnitsAttr);
      }

      // screenXY (anchor)
      let screenXY;
      let screenXUnits;
      let screenYUnits;
      const screenXYElement = screenOverlay.querySelector(screenXYAttr);
      if (screenXYElement !== null) {
        const attributeX = parseFloat(screenXYElement.getAttribute('x'));
        const attributeY = parseFloat(screenXYElement.getAttribute('y'));
        screenXY = [attributeX, attributeY];
        screenXUnits = screenXYElement.getAttribute(xUnitsAttr);
        screenYUnits = screenXYElement.getAttribute(yUnitsAttr);
      } else if (src === KML.DEFAULT_IMAGE_STYLE_SRC) {
        screenXY = KML.DEFAULT_IMAGE_STYLE_ANCHOR;
        screenXUnits = KML.DEFAULT_IMAGE_STYLE_ANCHOR_X_UNITS;
        screenYUnits = KML.DEFAULT_IMAGE_STYLE_ANCHOR_Y_UNITS;
      } else if (/^http:\/\/maps\.(?:google|gstatic)\.com\//.test(src)) {
        screenXY = [0.5, 0];
        screenXUnits = Icon.FRACTION;
        screenYUnits = Icon.FRACTION;
      }

      // rotation
      let rotationXY;
      let rotationXUnits;
      let rotationYUnits;
      const rotationElement = screenOverlay.querySelector(rotationXYAttr);
      if (rotationElement !== null) {
        const attributeX = parseFloat(rotationElement.getAttribute('x'));
        rotationXY = (Math.PI / 180) * (attributeX);
        rotationXUnits = rotationElement.getAttribute(xUnitsAttr);
        rotationYUnits = rotationElement.getAttribute(yUnitsAttr);
      }

      // size
      let size;
      let sizeXUnits;
      let sizeYUnits;
      const sizeElement = screenOverlay.querySelector(sizeAttr);
      if (sizeElement !== null) {
        const attributeX = parseFloat(sizeElement.getAttribute('x'));
        const attributeY = parseFloat(sizeElement.getAttribute('y'));
        size = [attributeX, attributeY];
        sizeXUnits = sizeElement.getAttribute(xUnitsAttr);
        sizeYUnits = sizeElement.getAttribute(yUnitsAttr);
      }

      this.screenOverlay_ = {
        screenXY,
        screenXUnits,
        screenYUnits,
        overlayXY,
        overlayXUnits,
        overlayYUnits,
        rotationXY,
        rotationXUnits,
        rotationYUnits,
        size,
        sizeXUnits,
        sizeYUnits,
        src,
      };
    }
  }

  /**
   * Este método devuelve el valor del objeto "screenOverlay_" pasado al
   * constructor.
   *
   * @function
   * @returns {Object} objeto "screenOverlay_" pasado al constructor.
   * @public
   * @api
   */
  getScreenOverlay() {
    return this.screenOverlay_;
  }
}

/**
 * Imagen por defecto.
 *
 * @see https://github.com/openlayers/openlayers/blob/v4.0.1/src/ol/format/kml.js#L223
 * @const
 * @type {string}
 * @api
 */
KML.DEFAULT_NO_IMAGE_STYLE = 'NO_IMAGE';

/**
 * URL de la imagen por defecto.
 *
 * @see https://github.com/openlayers/openlayers/blob/v4.0.1/src/ol/format/kml.js#L191
 * @const
 * @type {string}
 * @api
 */
KML.DEFAULT_IMAGE_STYLE_SRC = 'https://maps.google.com/mapfiles/kml/pushpin/ylw-pushpin.png';

/**
 * Anclaje de la imagen por defecto.
 *
 * @see https://github.com/openlayers/openlayers/blob/v4.0.1/src/ol/format/kml.js#L161
 * @const
 * @type {ol.Size}
 * @api
 */
KML.DEFAULT_IMAGE_STYLE_ANCHOR = [20, 2]; // FIXME maybe [8, 32] ?

/**
 * Unidades de X para la imagen por defecto.
 *
 * @see https://github.com/openlayers/openlayers/blob/v4.0.1/src/ol/format/kml.js#L168
 * @see https://github.com/openlayers/openlayers/blob/c7969f5255edd8cbe5ece89ab026fe0f6f69cef1/src/ol/style/Icon.js#L13C37-L13C52
 * @const
 * @type {ol.style.Icon}
 * @api
 */
KML.DEFAULT_IMAGE_STYLE_ANCHOR_X_UNITS = 'pixels';

/**
 * Unidades de Y para la imagen por defecto.
 *
 * @see https://github.com/openlayers/openlayers/blob/v4.0.1/src/ol/format/kml.js#L176
 * @see https://github.com/openlayers/openlayers/blob/c7969f5255edd8cbe5ece89ab026fe0f6f69cef1/src/ol/style/Icon.js#L13C37-L13C52
 * @const
 * @type {ol.style.Icon}
 * @api
 */
KML.DEFAULT_IMAGE_STYLE_ANCHOR_Y_UNITS = 'pixels';

export default KML;
