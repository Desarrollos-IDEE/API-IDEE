/**
 * @module IDEE/impl/Popup
 */
import {
  enableTouchScroll,
  isFunction,
  isNullOrEmpty,
} from 'IDEE/util/Utils';
import FacadePopup from 'IDEE/Popup';
import {
  Cartesian3,
  Cartographic,
  defined,
  sampleTerrainMostDetailed,
} from 'cesium';
import * as EventType from 'IDEE/event/eventtype';
import ImplUtils from './util/Utils';

/**
 * @classdesc
 * Implementación de la clase "Popup"
 *
 * @property {Boolean} panMapIfOutOfView Indica si el mapa se desplaza o no.
 * @property {Object} ani_opts Opciones de animación.
 * @property {IDEE.Map} facadeMap_ Mapa.
 * @property {Array<Number>} cachedAniPixel_
 *
 * @api
 */
class Popup {
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
      * @type {IDEE.Map}
      */
    this.facadeMap_ = null;

    /**
      *
      * @private
      * @type {Array<Number>}
      */
    this.cachedAniPixel_ = null;

    /**
     * Indica si ya ha finalizado el desplazamiento
     * del popup.
     * @private
     * @type {Boolean}
     */
    this.isFinishedPanInto_ = false;

    /**
     * Coordenadas del popup.
     *
     * @private
     * @type {Array<Number>}
     */
    this.coord_ = null;

    /**
     * Manejador para cambio de posición.
     *
     * @private
     * @type {Function}
     */
    this.handlerChangePosition_ = null;

    /**
     * Manejador para desplazamiento del popup.
     *
     * @private
     * @type {Function}
     */
    this.handlerPanIntoView_ = null;
  }

  /**
   * Este método añade el HTML del "Popup" al mapa.
   *
   * @function
   * @param {IDEE.Map} map Mapa.
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

    this.setElement_(this.container);
  }

  /**
   * Este método muestra el "Popup".
   *
   * @function
   * @param {Array<Number>} coord Coordenadas donde situar el "Popup".
   * @param {function} callback Función 'callback' de llamada para ejecutar.
   * @public
   * @api
   * @memberof module:IDEE/impl/Popup#
   */
  show(coord, callback) {
    this.setPosition_(coord);
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
   * @param {IDEE.Popup.status} status Estado del "Popup".
   * @param {Array<Number>} coord Coordenadas donde situar el "Popup".
   * @public
   * @api
   */
  centerByStatus(status, coord) {
    const overlayMap = this.facadeMap_.getMapImpl();

    const pixelCoor = ImplUtils.getPixelFromCoordinate(overlayMap, coord);
    let statusPopupValue = 0;
    if (status === FacadePopup.status.DEFAULT) {
      statusPopupValue = 0.275;
    }

    if (status === FacadePopup.status.COLLAPSED) {
      statusPopupValue = 0.1;
    }

    const coorYpixel = pixelCoor[1] + (pixelCoor[1] * statusPopupValue);

    const coordinates = ImplUtils.getCoordinateFromPixel(
      this.facadeMap_.getMapImpl(),
      [pixelCoor[0], coorYpixel],
    );

    this.facadeMap_.setCenter({
      x: coordinates[0],
      y: coordinates[1],
    });
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
   * @param {Array<Number>} coord Coordenadas del "Popup".
   * @returns {Object} Centro del mapa.
   * @public
   * @api
   */
  panIntoView(coord) {
    // it waits for the previous animation in order to execute this
    this.panIntoSynchronizedAnim_().then(() => {
      const overlayMap = this.facadeMap_.getMapImpl();
      if (isNullOrEmpty(overlayMap)) return; // Comprueba si overlay fue borrado

      if (!ImplUtils.getPixelFromCoordinate(overlayMap, coord)) {
        this.handlerPanIntoView_ = this.centerPixelFromCoordinate_.bind(this, coord, overlayMap);
        overlayMap.scene.postRender.addEventListener(this.handlerPanIntoView_);
      } else {
        this.centerPixelFromCoordinate_(coord, overlayMap);
      }
    });

    const center = this.facadeMap_.getCenter();
    return [center.x, center.y];
  }

  /**
   * Este método centra el "Popup" en las coordenadas.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @function
   * @param {Array<Number>} coord Coordenadas del "Popup".
   * @param {Cesium.Viewer} overlayMap Mapa.
   * @public
   * @api
   */
  centerPixelFromCoordinate_(coord, overlayMap) {
    const popPx = ImplUtils.getPixelFromCoordinate(overlayMap, coord);
    if (!isNullOrEmpty(popPx)) {
      this.isAnimating_ = true;
      popPx[0] = Math.round(popPx[0]);
      popPx[1] = Math.round(popPx[1]);
      // if (FacadeWindow.WIDTH > 768) {
      const popupElement = this.getElement_().querySelector('.m-popup');
      const extraOffset = 20; // Avoids putting popup on map edge, on mobile set to 0 is better
      const popupWidth = popupElement.clientWidth + extraOffset; // 20;
      const tabHeight = 30; // 30px for non mobile tabs, on mobile set to 0 is better
      const popupHeight = popupElement.clientHeight + tabHeight + extraOffset;
      // eslint-disable-next-line no-underscore-dangle
      const mapSize = [overlayMap.canvas.width, overlayMap.canvas.height];
      const center = this.facadeMap_.getCenter();
      const tailOffsetLeft = 60; // arrow at bottom 48+10+2=60px (left,img/2,border)
      const tailOffsetRight = popupWidth - tailOffsetLeft;
      const popOffsetY = 0;
      const curPix = ImplUtils.getPixelFromCoordinate(overlayMap, center);
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
        this.ani_opts.duration /= 1000;
        const coordinates = ImplUtils.getCoordinateFromPixel(overlayMap, newPx);
        if (coordinates) {
          overlayMap.camera.flyTo({
            ...this.ani_opts,
            destination: Cartesian3.fromDegrees(
              coordinates[0],
              coordinates[1],
              this.facadeMap_.getZoom(false, true),
            ),
          });
        }
      }

      // The animation ended
      this.isAnimating_ = false;
      this.isFinishedPanInto_ = true;

      if (this.handlerPanIntoView_) {
        overlayMap.scene.postRender.removeEventListener(this.handlerPanIntoView_);
      }
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
    this.setElement_(html);
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

  /**
   * Este método establece el centro del mapa en el popup.
   *
   * @function
   * @public
   * @api
   */
  setAnimationView() {}

  /**
   * Este método modifica el html del popup.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   *
   * @function
   * @param {String} html Cadena de HTML para mostrar dentro del "Popup".
   * @private
   * @api
   */
  setElement_(html) {
    if (this.container) {
      this.container.remove();
    }
    const divOverlay = document.createElement('div');
    divOverlay.appendChild(html);
    this.container = divOverlay;
    this.container.style.position = 'absolute';
    this.facadeMap_.getContainer().appendChild(divOverlay);
  }

  /**
   * Este método obtiene el elemento html del popup.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   *
   * @function
   * @private
   * @api
   */
  getElement_() {
    return this.container;
  }

  /**
   * Este método es un manejador para el cambio de la
   * posición del "popup".
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   *
   * @function
   * @param {Cartographic} coord Coordenadas donde se situará el "popup".
   * @private
   * @api
   */
  changePosition_(coord) {
    const cesiumMap = this.facadeMap_.getMapImpl();
    const cartesian = Cartesian3.fromRadians(
      coord.longitude,
      coord.latitude,
      coord.height,
    );
    const canvasPosition = cesiumMap.scene.cartesianToCanvasCoordinates(cartesian);
    if (defined(canvasPosition)) {
      this.container.style.top = `${canvasPosition.y}px`;
      this.container.style.left = `${canvasPosition.x}px`;
    }
  }

  /**
   * Este método modifica las coordenadas del popup.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   *
   * @function
   * @param {Array<number>} coord Coordenadas donde situar el "Popup".
   * @private
   * @api
   */
  setPosition_(coord) {
    this.coord_ = coord;
    let positions;
    if (coord.length > 2) {
      positions = Cartographic.fromDegrees(coord[0], coord[1], coord[2]);
      this.handlerChangePosition_ = this.changePosition_.bind(this, positions);
      this.facadeMap_.getMapImpl().scene.preRender
        .addEventListener(this.handlerChangePosition_);
    } else {
      positions = Cartographic.fromDegrees(coord[0], coord[1]);

      if (this.facadeMap_.getTerrain()[0]) {
        // Si terreno cargado
        if (this.facadeMap_.getTerrain()[0].getImpl()
          // eslint-disable-next-line no-underscore-dangle
          && this.facadeMap_.getTerrain()[0].getImpl().isLoaded_) {
          this.sampleTerrain(this.facadeMap_.getMapImpl().terrainProvider, [positions]);
        } else {
          this.facadeMap_.getTerrain()[0].getImpl().once(EventType.LOAD_TERRAIN, () => {
            this.sampleTerrain(this.facadeMap_.getMapImpl().terrainProvider, [positions]);
          });
        }
      } else {
        this.handlerChangePosition_ = this.changePosition_.bind(this, positions);
        this.facadeMap_.getMapImpl().scene.preRender
          .addEventListener(this.handlerChangePosition_);
      }
    }
  }

  /**
   * Método para obtener la altura del terreno en un punto.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   *
   * @param {Cesium.CesiumTerrainProvider} terrain Terreno.
   * @param {Array<Cesium.Cartographic>} positions Coordenadas cartográficas.
   */
  sampleTerrain(terrain, positions) {
    sampleTerrainMostDetailed(terrain, positions)
      .then((updatePositions) => {
        // eslint-disable-next-line no-param-reassign
        positions = updatePositions[0];
        this.handlerChangePosition_ = this.changePosition_.bind(this, positions);
        this.facadeMap_.getMapImpl().scene.preRender
          .addEventListener(this.handlerChangePosition_);
      });
  }

  /**
   * Este método elimina los eventos del popup.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   *
   * @function
   * @api
   */
  removePreRenderEvent_() {
    this.facadeMap_.getMapImpl().scene.preRender
      .removeEventListener(this.handlerChangePosition_);
  }
}
export default Popup;
