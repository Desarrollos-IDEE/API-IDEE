/**
 * @module M/impl/format/KML
 */
import { decodeHtml } from 'M/util/Utils';
import {
  KmlDataSource,
} from 'cesium';

/**
 * @classdesc
 * Implementación del formateador KML.
 *
 * @property {Object} screenOverlay_ "Popup".
 * @property {bool} label_ Indica si incluye la opción "label".
 *
 * @api
 */
class KML {
  /**
   * Constructor principal de la clase. Formato de los objetos geográficos para
   * leer y escribir datos en formato KML.
   *
   * @constructor
   * @param {Object} optOptions Opciones del formato KML.
   * - extractStyles: Extraer estilos del KML. Por defecto es verdadero.
   * - label: Define si se muestra la etiqueta o no.Por defecto mostrará la etiqueta.
   * que contienen puntos. Por defecto es verdadero.
   * - screenOverlayContainer: Contenedor donde añadir la imagen del KML.
   * Por defecto, es el contenedor del mapa.
   * - clampToGround: Define si el objeto geográfico se debe ajustar al suelo.
   * Por defecto falso.
   * @api
   */
  constructor(optOptions = {}) {
    /**
     * Define si se muestra la etiqueta o no.
     * Por defecto mostrará la etiqueta que contienen puntos.
     * Por defecto es verdadero.
     */
    this.showPointNames_ = optOptions.label;

    /**
     * Extraer estilos del KML. Por defecto es verdadero.
     */
    this.extractStyles_ = optOptions.extractStyles;

    /**
     * Contenedor para el "Popup". Por defecto, es el
     * contenedor del mapa.
     * @private
     * @type {HTMLElement}
     */
    this.screenOverlayContainer_ = optOptions.screenOverlayContainer;

    /**
     * "Popup".
     * @private
     * @type {Object}
     */
    this.screenOverlay_ = null;

    /**
     * Define si el objeto geográfico se ajusta al suelo.
     * Por defecto falso.
     */
    this.clampToGround = optOptions.clampToGround;
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
    const kmlBlob = new Blob([textResponse], { type: 'application/vnd.google-earth.kml+xml' });
    const opt = {
      screenOverlayContainer: this.screenOverlayContainer_,
      clampToGround: this.clampToGround,
      ...options,
    };
    const promise = new KmlDataSource().load(kmlBlob, opt);
    return promise.then((dataSource) => {
      const entities = dataSource.entities.values;
      const featuresModified = entities.map((feature) => {
        // eslint-disable-next-line no-param-reassign
        feature.name = decodeHtml(feature.name);
        return feature;
      });
      this.readScreenOverlay(textResponse);

      return { features: featuresModified, extractStyles: this.extractStyles_ };
    });
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

    const overlay = new DOMParser().parseFromString(textResponse, 'application/xml');
    const screenOverlay = overlay ? overlay.querySelector(screenOverlayAttr) : null;
    if (screenOverlay !== null) {
      const icon = screenOverlay.querySelector(iconAttr);

      // Icon src of ScreenOverlay
      const src = icon !== null
        ? icon.querySelector(hrefAttr).innerHTML : KML.DEFAULT_NO_IMAGE_STYLE;

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
        screenXUnits = 'fraction';
        screenYUnits = 'fraction';
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
 * @const
 * @type {string}
 * @api
 */
KML.DEFAULT_NO_IMAGE_STYLE = 'NO_IMAGE';

/**
 * URL de la imagen por defecto.
 *
 * @const
 * @type {string}
 * @api
 */
KML.DEFAULT_IMAGE_STYLE_SRC = 'https://maps.google.com/mapfiles/kml/pushpin/ylw-pushpin.png';

/**
 * Anclaje de la imagen por defecto.
 *
 * @const
 * @type {Array<Number>}
 * @api
 */
KML.DEFAULT_IMAGE_STYLE_ANCHOR = [20, 2]; // FIXME maybe [8, 32] ?

/**
 * Unidades de X para la imagen por defecto.
 *
 * @const
 * @type {string}
 * @api
 */
KML.DEFAULT_IMAGE_STYLE_ANCHOR_X_UNITS = 'pixels';

/**
 * Unidades de Y para la imagen por defecto.
 *
 * @const
 * @type {string}
 * @api
 */
KML.DEFAULT_IMAGE_STYLE_ANCHOR_Y_UNITS = 'pixels';

export default KML;
