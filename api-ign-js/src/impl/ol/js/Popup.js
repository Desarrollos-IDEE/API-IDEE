/**
 * @module M/impl/Popup
 */
import OLOverlay from 'ol/Overlay';
import { isNullOrEmpty, isFunction, enableTouchScroll } from 'M/util/Utils';
import FacadePopup from 'M/Popup';
import FacadeWindow from 'M/util/Window';

/**
 * @classdesc
 * Implementación de la clase "Popup"
 *
 * @property {Boolean} panMapIfOutOfView Indica si el mapa se desplaza o no.
 * @property {Object} ani_opts Opciones de animación.
 * @property {M.Map} facadeMap_ Mapa.
 * @property {ol.Coordinate} cachedAniPixel_
 *
 * @api
 * @extends {ol.Overlay}
 */
class Popup extends OLOverlay {
  /**
   * Constructor principal de la clase "Popup".
   *
   * @constructor
   * @param {Object} options Opciones del "Popup".
   * - icon: Icono del "Popup".
   * - title: Título del "Popup".
   * - content: Contenido del "Popup".
   * - listeners: Función 'listener'.
   * - panMapIfOutOfView: Indica si el mapa se desplaza o no.
   * - ani_opts: Opciones de animación. Puede constar de las siguientes propiedades:
   *            - "duration": Duración de la animación en milisegundos.
   *
   *            - "easing": El método de aceleración a usar.
   *
   * @api
   */
  constructor(options = {}) {
    super({
      className: window.matchMedia('(max-width: 768px)').matches
        ? 'ol-overlay-container ol-selectable unsetTransform' // to not blink from started location
        : undefined, // OLOverlay replacement of 'ol-overlay-container ' + CLASS_SELECTABLE
    });

    /**
     * Indica si el mapa se desplaza o no.
     * @type {Boolean}
     */
    this.panMapIfOutOfView = options.panMapIfOutOfView;
    if (this.panMapIfOutOfView === undefined) {
      this.panMapIfOutOfView = true;
    }

    /**
     * Opciones de animación.
     * @type {Object}
     */
    this.ani_opts = options.ani_opts;
    if (this.ani_opts === undefined) {
      this.ani_opts = {
        duration: 250,
      };
    }

    /**
     * Fachada del mapa a implementar.
     * @private
     * @type {M.Map}
     */
    this.facadeMap_ = null;

    /**
     *
     * @private
     * @type {ol.Coordinate}
     */
    this.cachedAniPixel_ = null;
  }

  /**
   * Este método añade el HTML del "Popup" al mapa.
   *
   * @function
   * @param {M.Map} map Mapa.
   * @param {String} html Cadena de HTML para mostrar dentro del "Popup".
   * @public
   * @api
   */
  addTo(map, html) {
    this.facadeMap_ = map;

    // container
    this.container = html;

    this.content = this.getContentFromContainer(html);

    // Apply workaround to enable scrolling of content div on touch devices
    enableTouchScroll(this.content);

    this.setElement(this.container);

    map.getMapImpl().addOverlay(this);
  }

  /**
   * Este método muestra el "Popup".
   *
   * @function
   * @param {ol.Coordinate} coord Coordenadas donde situar el "Popup".
   * @param {function} callback Función 'callback' de llamada para ejecutar.
   * @public
   * @api
   * @memberof module:M/impl/Popup#
   */
  show(coord, callback) {
    this.setPosition(coord);
    if (this.panMapIfOutOfView && !window.matchMedia('(max-width: 768px)').matches) {
      this.panIntoView(coord);
    }
    this.content.scrollTop = 0;
    if (isFunction(callback)) {
      callback();
    }
    return this;
  }

  /**
   * Este método centra el "Popup".
   *
   * @function
   * @param {M.Popup.status} status Estado del "Popup".
   * @param {ol.Coordinate} coord Coordenadas donde situar el "Popup".
   * @public
   * @api
   */
  centerByStatus(status, coord) {
    const resolution = this.getMap().getView().getResolution();
    const newCoord = [].concat(coord);
    if (status === FacadePopup.status.COLLAPSED) {
      newCoord[1] -= 0.1 * FacadeWindow.HEIGHT * resolution;
    } else if (status === FacadePopup.status.DEFAULT) {
      newCoord[1] -= 0.275 * FacadeWindow.HEIGHT * resolution;
    } else { // FULL state no effects
      return;
    }

    const featureCenter = this.facadeMap_.getFeatureCenter();
    this.facadeMap_.setCenter({
      x: newCoord[0],
      y: newCoord[1],
    });
    // if the center was drawn then draw it again
    if (!isNullOrEmpty(featureCenter)) {
      this.facadeMap_.drawFeatures([featureCenter]);
    }
  }

  /**
   * Este método obtiene el HTML del contenedor "m-body".
   *
   * @function
   * @param {Object} html HTML.
   * @returns {Object} Elemento HTML.
   * @public
   * @api
   */
  getContentFromContainer(html) {
    return html.querySelector('div.m-body');
  }

  /**
   * Este método mueve el mapa para que el "Popup" sea completamente
   * visible en el actual 'viewport' (si es necesario).
   *
   * @function
   * @param {ol.Coordinate} coord Coordenadas del "Popup".
   * @returns {Object} Centro del mapa.
   * @public
   * @api
   */
  panIntoView(coord) {
    // it waits for the previous animation in order to execute this
    this.panIntoSynchronizedAnim_().then(() => {
      const overlayMap = this.getMap();
      if (isNullOrEmpty(overlayMap)) return; // Comprueba si overlay fue borrado

      if (!overlayMap.getPixelFromCoordinate(coord)) {
        overlayMap.once('postrender', () => {
          this.centerPixelFromCoordinate_(coord, overlayMap);
        });
      } else {
        this.centerPixelFromCoordinate_(coord, overlayMap);
      }
    });

    return this.getMap().getView().getCenter();
  }

  /**
   * Este método centra el "Popup" en las coordenadas.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @function
   * @param {ol.Coordinate} coord Coordenadas del "Popup".
   * @param {ol.Map} overlayMap Mapa.
   * @public
   * @api
   */
  centerPixelFromCoordinate_(coord, overlayMap) {
    const popPx = overlayMap.getPixelFromCoordinate(coord);
    if (!isNullOrEmpty(popPx)) {
      this.isAnimating_ = true;
      popPx[0] = Math.round(popPx[0]);
      popPx[1] = Math.round(popPx[1]);
      // if (FacadeWindow.WIDTH > 768) {
      const popupElement = this.element.querySelector('.m-popup');
      const extraOffset = 20; // Avoids putting popup on map edge, on mobile set to 0 is better
      const popupWidth = popupElement.clientWidth + extraOffset; // 20;
      const tabHeight = 30; // 30px for non mobile tabs, on mobile set to 0 is better
      const popupHeight = popupElement.clientHeight + tabHeight + extraOffset;
      const mapSize = overlayMap.getSize();
      const center = overlayMap.getView().getCenter();
      const tailOffsetLeft = 60; // arrow at bottom 48+10+2=60px (left,img/2,border)
      const tailOffsetRight = popupWidth - tailOffsetLeft;
      const popOffsetY = this.getOffset()[1];
      const curPix = overlayMap.getPixelFromCoordinate(center);
      curPix[0] = Math.round(curPix[0]);
      curPix[1] = Math.round(curPix[1]);
      const newPx = curPix.slice();

      const fromRight = mapSize[0] - (popPx[0] + tailOffsetRight);
      if (fromRight < 0) {
        newPx[0] -= fromRight;
      } else {
        const fromLeft = (popPx[0] - tailOffsetLeft);
        if (fromLeft < 0) {
          newPx[0] += fromLeft;
        }
      }

      const fromTop = popPx[1] - (popupHeight + popOffsetY);
      if (fromTop < 0) {
        newPx[1] += fromTop;
      } else {
        const tailHeight = 20; // small arrow at the bottom, on mobile set to 0 is better
        const fromBottom = mapSize[1] - (popPx[1] + tailHeight) - popOffsetY;
        if (fromBottom < 0) {
          newPx[1] -= fromBottom;
        }
      }

      // if (this.ani && this.ani_opts) {
      if (!isNullOrEmpty(this.ani_opts) && isNullOrEmpty(this.ani_opts.source)
      && (newPx[0] !== curPix[0] || newPx[1] !== curPix[1])) {
        this.ani_opts.source = center;
        overlayMap.getView()
          .animate({ ...this.ani_opts, center: overlayMap.getCoordinateFromPixel(newPx) });
      }

      // The animation ended
      this.isAnimating_ = false;
    }
  }

  /**
   * Este método sincroniza las animaciones del "Popup".
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @function
   * @public
   * @api
   */
  panIntoSynchronizedAnim_() {
    return new Promise((success, fail) => {
      /* if the popup is animating then it waits for the animation
      in order to execute the next animation */
      if (this.isAnimating_ === true) {
        // gets the duration of the animation
        let aniDuration = 300;
        if (!isNullOrEmpty(this.ani_opts)) {
          aniDuration = this.ani_opts.duration;
        }
        setTimeout(success, aniDuration);
      } else {
        /* if there is not any animation then it starts
        a new one */
        success();
      }
    });
  }

  /**
   * Este método elimina el "Popup" del mapa.
   *
   * @function
   * @public
   * @api
   */
  hide() {
    this.facadeMap_.removePopup();
  }

  /**
   * Este método establece el texto del "Popup".
   *
   * @function
   * @param {Object} html Nuevo contenido para el "Popup".
   * @public
   * @api
   */
  setContainer(html) {
    this.setElement(html);
    this.content = this.getContentFromContainer(html);
    enableTouchScroll(this.content);
  }

  /**
   * Este método obtiene el contenido del "Popup".
   *
   * @function
   * @returns {String} Contenido del "Popup".
   * @public
   * @api
   */
  getContent() {
    return this.content;
  }
}
export default Popup;
