/**
 * @module IDEE/impl/control/Rotate
 */
import {
  Cartesian3,
  Rectangle,
  Math as CesiumMath,
  Cartesian2,
  SceneMode,
  Transforms,
  defined,
  Matrix4,
  getTimestamp,
} from 'cesium';
import { isUndefined } from 'IDEE/util/Utils';
import Control from './Control';
import ImplUtils from '../util/Utils';

const oldTransformScratch = new Matrix4();
const newTransformScratch = new Matrix4();
const centerScratch = new Cartesian3();
const vectorScratch = new Cartesian2();

/**
 *  @classdesc
 *  Control de movimiento 3D.
 *  @api
 */
class Rotate extends Control {
  /**
   * Constructor principal de la clase.
   *
   * @constructor
   * @param {Object} options Opciones del control.
   * - viewInitial: Vista inicial.
   * - help: Indica si se muestra la ayuda al crear el control.
   * Por defecto, verdadero.
   * @api stable
   */
  constructor(options = {}) {
    super();

    this.viewInitial = options.viewInitial;
    this.showHelp = options.help;

    this.handleExteriorMouseDown = (e) => this.handleMouseDown('exterior', e);
    this.handleGiroscopioMouseDown = (e) => this.handleMouseDown('giroscopio', e);
    this.handleResetView = this.resetView.bind(this);
    this.handleClickHelp = this.handleClickHelp.bind(this);

    this.navigationLocked = false;
    this.isOrbiting = false;
    this.orbitMouseMoveFunction = undefined;
    this.orbitMouseUpFunction = undefined;
    this.orbitTickFunction = undefined;
    this.orbitLastTimestamp = 0;
    this.orbitFrame = undefined;
    this.orbitIsLook = false;
    this.orbitCursorAngle = 0;
    this.orbitCursorOpacity = 0.0;

    this.rotateMouseMoveFunction = undefined;
    this.rotateMouseUpFunction = undefined;
    this.isRotating = false;
    this.rotateInitialCursorAngle = undefined;
    this.rotateFrame = undefined;
    this.rotateIsLook = false;

    this.boundCloseHelp = this.closeHelp.bind(this);
    this.boundNotShowHelp = this.notShowHelp.bind(this);

    this.saveHeading = undefined;
    this.isInitial = true;

    if ('ontouchstart' in window && window.navigator.maxTouchPoints > 0) {
      this.useTouch = true;
    } else {
      this.useTouch = false;
    }
  }

  /**
   * Este método añade el control al mapa.
   *
   * @public
   * @function
   * @param {IDEE.Map} map Map.
   * @param {function} template Plantilla del control.
   * @api stable
   */
  addTo(map, element) {
    super.addTo(map, element);

    // panel
    this.panel = element;

    this.svgExterior = this.panel.querySelector('.m-rotate-exterior-svg');
    this.svgGiroscopio = this.panel.querySelector('.m-rotate-giroscopio-svg');
    this.heading = this.facadeMap_.getMapImpl().scene.camera.heading;

    if (!isUndefined(this.viewInitial)) {
      this.position = Rectangle.fromDegrees(
        this.viewInitial[0],
        this.viewInitial[1],
        this.viewInitial[2],
        this.viewInitial[3],
      );
    }

    this.saveHeading = () => {
      if (isUndefined(this.viewInitial) && this.isInitial) {
        this.position = Cartesian3.clone(this.facadeMap_.getMapImpl().scene.camera.position);
        this.isInitial = false;
      }
      this.heading = this.facadeMap_.getMapImpl().scene.camera.heading;
      this.svgExterior.style.transform = `rotate(${-this.heading}rad)`;
    };

    this._unsubcribeFromPostRender = this.facadeMap_.getMapImpl()
      .scene.postRender.addEventListener(this.saveHeading);

    // Registro eventos
    if (this.useTouch) {
      this.svgExterior.addEventListener('touchstart', this.handleExteriorMouseDown);
      this.svgGiroscopio.addEventListener('touchstart', this.handleGiroscopioMouseDown);
    } else {
      this.svgExterior.addEventListener('mousedown', this.handleExteriorMouseDown);
      this.svgGiroscopio.addEventListener('mousedown', this.handleGiroscopioMouseDown);
    }

    this.panel.querySelector('#m-rotate-giroscopio').addEventListener('dblclick', this.handleResetView);

    if (this.showHelp) {
      this.panel.querySelector('#m-rotate-help').addEventListener('click', this.handleClickHelp);
    }
  }

  /**
   * Manejador del evento "mousedown".
   *
   * @function
   * @public
   * @param {string} name Nombre del elemento pulsado.
   * @param {MouseEvent} e Evento.
   * @api
   */
  handleMouseDown(name, e) {
    e.stopPropagation();
    e.preventDefault();
    const clientX = this.useTouch && e.touches && e.touches.length > 0
      ? e.touches[0].clientX : e.clientX;
    const clientY = this.useTouch && e.touches && e.touches.length > 0
      ? e.touches[0].clientY : e.clientY;
    const compassElement = e.currentTarget;
    const compassRectangle = e.currentTarget.getBoundingClientRect();
    const center = new Cartesian2(
      (compassRectangle.right - compassRectangle.left) / 2.0,
      (compassRectangle.bottom - compassRectangle.top) / 2.0,
    );
    const clickLocation = new Cartesian2(
      clientX - compassRectangle.left,
      clientY - compassRectangle.top,
    );
    const vector = Cartesian2.subtract(clickLocation, center, new Cartesian2());

    if (name === 'giroscopio') {
      this.orbit(compassElement, vector);
    } else if (name === 'exterior') {
      this.rotate(compassElement, vector);
    } else {
      return true;
    }
  }

  /**
   * Función auxiliar que añade los eventos necesarios para inclinar
   * la vista al seleccionar el usuario el círculo interior y arrastrar
   * a cualquier lado.
   *
   * @function
   * @public
   * @param {HTMLElement} compassElement Elemento que disparó el evento.
   * @param {Cartesian2} cursorVector Vector desde el centro del elemento
   * hasta el punto de clic.
   * @api
   */
  orbit(compassElement, cursorVector) {
    const cesiumMap = this.facadeMap_.getMapImpl();
    const scene = cesiumMap.scene;
    const sscc = scene.screenSpaceCameraController;

    if (scene.mode === SceneMode.MORPHING || !sscc.enableInputs) {
      return;
    }

    // eslint-disable-next-line default-case
    switch (scene.mode) {
      case SceneMode.COLUMBUS_VIEW:
        if (sscc.enableLook) break;
        if (!sscc.enableTranslate || !sscc.enableTilt) return;
        break;
      case SceneMode.SCENE3D:
        if (sscc.enableLook) break;
        if (!sscc.enableTilt || !sscc.enableRotate) return;
        break;
      case SceneMode.SCENE2D:
        if (!sscc.enableTranslate) return;
        break;
    }

    if (this.useTouch) {
      document.removeEventListener('touchmove', this.orbitMouseMoveFunction, false);
      document.removeEventListener('touchend', this.orbitMouseUpFunction, false);
    } else {
      document.removeEventListener('mousemove', this.orbitMouseMoveFunction, false);
      document.removeEventListener('mouseup', this.orbitMouseUpFunction, false);
    }

    if (defined(this.orbitTickFunction)) {
      cesiumMap.clock.onTick.removeEventListener(this.orbitTickFunction);
    }

    this.orbitMouseMoveFunction = undefined;
    this.orbitMouseUpFunction = undefined;
    this.orbitTickFunction = undefined;

    this.isOrbiting = true;
    this.orbitLastTimestamp = getTimestamp();

    const camera = scene.camera;

    if (defined(cesiumMap.trackedEntity)) {
      this.orbitFrame = undefined;
      this.orbitIsLook = false;
    } else {
      const center = ImplUtils.getCameraFocus(cesiumMap, true, centerScratch);

      if (!defined(center)) {
        this.orbitFrame = Transforms.eastNorthUpToFixedFrame(
          camera.positionWC,
          scene.globe.ellipsoid,
          newTransformScratch,
        );
        this.orbitIsLook = true;
      } else {
        this.orbitFrame = Transforms.eastNorthUpToFixedFrame(
          center,
          scene.globe.ellipsoid,
          newTransformScratch,
        );
        this.orbitIsLook = false;
      }
    }

    this.orbitTickFunction = (e) => {
      const timestamp = getTimestamp();
      const deltaT = timestamp - this.orbitLastTimestamp;
      // eslint-disable-next-line no-mixed-operators
      const rate = (this.orbitCursorOpacity - 0.5) * 2.5 / 1000;
      const distance = deltaT * rate;

      const angle = this.orbitCursorAngle + CesiumMath.PI_OVER_TWO;
      const x = Math.cos(angle) * distance;
      const y = Math.sin(angle) * distance;

      let oldTransform;

      if (defined(this.orbitFrame)) {
        oldTransform = Matrix4.clone(camera.transform, oldTransformScratch);

        camera.lookAtTransform(this.orbitFrame);
      }

      if (scene.mode === SceneMode.SCENE2D) {
        camera.move(
          new Cartesian3(x, y, 0),
          Math.max(
            scene.canvas.clientWidth,
            scene.canvas.clientHeight,
          // eslint-disable-next-line no-mixed-operators
          ) / 100 * camera.positionCartographic.height * distance,
        );
      } else if (this.orbitIsLook) {
        camera.look(Cartesian3.UNIT_Z, -x);
        camera.look(camera.right, -y);
      } else {
        camera.rotateLeft(x);
        camera.rotateUp(y);
      }

      if (defined(this.orbitFrame)) {
        camera.lookAtTransform(oldTransform);
      }

      this.orbitLastTimestamp = timestamp;
    };

    const updateAngleAndOpacity = (vector, compassWidth) => {
      const angle = Math.atan2(-vector.y, vector.x);
      this.orbitCursorAngle = CesiumMath.zeroToTwoPi(angle - CesiumMath.PI_OVER_TWO);

      const distance = Cartesian2.magnitude(vector);
      const maxDistance = compassWidth / 2.0;
      const distanceFraction = Math.min(distance / maxDistance, 1.0);
      const easedOpacity = 0.5 * distanceFraction * distanceFraction + 0.5;
      this.orbitCursorOpacity = easedOpacity;
      this.panel.querySelector('.m-rotate-rotation-maker').style.transform = `rotate(-${this.orbitCursorAngle}rad)`;
      this.panel.querySelector('.m-rotate-rotation-maker').style.opacity = this.orbitCursorOpacity;
      this.panel.querySelector('.m-rotate-rotation-maker').style.display = 'block';
    };

    this.orbitMouseMoveFunction = (e) => {
      const clientX = this.useTouch && e.touches && e.touches.length > 0
        ? e.touches[0].clientX : e.clientX;
      const clientY = this.useTouch && e.touches && e.touches.length > 0
        ? e.touches[0].clientY : e.clientY;
      const compassRectangle = compassElement.getBoundingClientRect();
      const center = new Cartesian2(
        (compassRectangle.right - compassRectangle.left) / 2.0,
        (compassRectangle.bottom - compassRectangle.top) / 2.0,
      );
      const clickLocation = new Cartesian2(
        clientX - compassRectangle.left,
        clientY - compassRectangle.top,
      );
      const vector = Cartesian2.subtract(clickLocation, center, vectorScratch);
      updateAngleAndOpacity(vector, compassRectangle.width);
    };

    this.orbitMouseUpFunction = (e) => {
      this.isOrbiting = false;

      if (this.useTouch) {
        document.removeEventListener('touchmove', this.orbitMouseMoveFunction, false);
        document.removeEventListener('touchend', this.orbitMouseUpFunction, false);
      } else {
        document.removeEventListener('mousemove', this.orbitMouseMoveFunction, false);
        document.removeEventListener('mouseup', this.orbitMouseUpFunction, false);
      }

      if (defined(this.orbitTickFunction)) {
        cesiumMap.clock.onTick.removeEventListener(this.orbitTickFunction);
      }

      this.orbitMouseMoveFunction = undefined;
      this.orbitMouseUpFunction = undefined;
      this.orbitTickFunction = undefined;
      this.panel.querySelector('.m-rotate-rotation-maker').style.display = 'none';
    };

    if (this.useTouch) {
      document.addEventListener('touchmove', this.orbitMouseMoveFunction, false);
      document.addEventListener('touchend', this.orbitMouseUpFunction, false);
    } else {
      document.addEventListener('mousemove', this.orbitMouseMoveFunction, false);
      document.addEventListener('mouseup', this.orbitMouseUpFunction, false);
    }
    cesiumMap.clock.onTick.addEventListener(this.orbitTickFunction);

    updateAngleAndOpacity(cursorVector, compassElement.getBoundingClientRect().width);
  }

  /**
   * Función auxiliar que añade los eventos necesarios para girar
   * la vista al rotar el usuario el anillo exterior.
   *
   * @function
   * @public
   * @param {HTMLElement} compassElement Elemento que disparó el evento.
   * @param {Cartesian2} cursorVector Vector desde el centro del elemento
   * hasta el punto de clic.
   * @api
   */
  rotate(compassElement, cursorVector) {
    const cesiumMap = this.facadeMap_.getMapImpl();
    const scene = cesiumMap.scene;
    const camera = scene.camera;

    const sscc = scene.screenSpaceCameraController;
    if (scene.mode === SceneMode.MORPHING || scene.mode === SceneMode.SCENE2D
      || !sscc.enableInputs) {
      return;
    }

    if (!sscc.enableLook && (scene.mode === SceneMode.COLUMBUS_VIEW
      || (scene.mode === SceneMode.SCENE3D && !sscc.enableRotate))) {
      return;
    }

    if (this.useTouch) {
      document.removeEventListener('touchmove', this.rotateMouseMoveFunction, false);
      document.removeEventListener('touchend', this.rotateMouseUpFunction, false);
    } else {
      document.removeEventListener('mousemove', this.rotateMouseMoveFunction, false);
      document.removeEventListener('mouseup', this.rotateMouseUpFunction, false);
    }

    this.rotateMouseMoveFunction = undefined;
    this.rotateMouseUpFunction = undefined;

    this.isRotating = true;
    this.rotateInitialCursorAngle = Math.atan2(-cursorVector.y, cursorVector.x);

    if (defined(cesiumMap.trackedEntity)) {
      this.rotateFrame = undefined;
      this.rotateIsLook = false;
    } else {
      const viewCenter = ImplUtils.getCameraFocus(cesiumMap, true, centerScratch);

      if (!defined(viewCenter)
        || (scene.mode === SceneMode.COLUMBUS_VIEW && !sscc.enableLook && !sscc.enableTranslate)) {
        this.rotateFrame = Transforms.eastNorthUpToFixedFrame(
          camera.positionWC,
          scene.globe.ellipsoid,
          newTransformScratch,
        );
        this.rotateIsLook = true;
      } else {
        this.rotateFrame = Transforms.eastNorthUpToFixedFrame(
          viewCenter,
          scene.globe.ellipsoid,
          newTransformScratch,
        );
        this.rotateIsLook = false;
      }
    }

    let oldTransformAux;
    if (defined(this.rotateFrame)) {
      oldTransformAux = Matrix4.clone(camera.transform, oldTransformScratch);
      camera.lookAtTransform(this.rotateFrame);
    }

    this.rotateInitialCameraAngle = -camera.heading;

    if (defined(this.rotateFrame)) {
      camera.lookAtTransform(oldTransformAux);
    }

    this.rotateMouseMoveFunction = (e) => {
      const clientX = this.useTouch && e.touches && e.touches.length > 0
        ? e.touches[0].clientX : e.clientX;
      const clientY = this.useTouch && e.touches && e.touches.length > 0
        ? e.touches[0].clientY : e.clientY;
      const compassRectangle = compassElement.getBoundingClientRect();
      const center = new Cartesian2(
        (compassRectangle.right - compassRectangle.left) / 2.0,
        (compassRectangle.bottom - compassRectangle.top) / 2.0,
      );
      const clickLocation = new Cartesian2(
        clientX - compassRectangle.left,
        clientY - compassRectangle.top,
      );
      const vector = Cartesian2.subtract(clickLocation, center, vectorScratch);
      const angle = Math.atan2(-vector.y, vector.x);

      const angleDifference = angle - this.rotateInitialCursorAngle;
      const newCameraAngle = CesiumMath.zeroToTwoPi(
        this.rotateInitialCameraAngle - angleDifference,
      );

      let oldTransform;
      if (defined(this.rotateFrame)) {
        oldTransform = Matrix4.clone(camera.transform, oldTransformScratch);
        camera.lookAtTransform(this.rotateFrame);
      }

      const currentCameraAngle = -camera.heading;
      camera.rotateRight(newCameraAngle - currentCameraAngle);

      if (defined(this.rotateFrame)) {
        camera.lookAtTransform(oldTransform);
      }
    };

    this.rotateMouseUpFunction = (e) => {
      this.isRotating = false;
      if (this.useTouch) {
        document.removeEventListener('touchmove', this.rotateMouseMoveFunction, false);
        document.removeEventListener('touchend', this.rotateMouseUpFunction, false);
      } else {
        document.removeEventListener('mousemove', this.rotateMouseMoveFunction, false);
        document.removeEventListener('mouseup', this.rotateMouseUpFunction, false);
      }

      this.rotateMouseMoveFunction = undefined;
      this.rotateMouseUpFunction = undefined;
    };

    if (this.useTouch) {
      document.addEventListener('touchmove', this.rotateMouseMoveFunction, false);
      document.addEventListener('touchend', this.rotateMouseUpFunction, false);
    } else {
      document.addEventListener('mousemove', this.rotateMouseMoveFunction, false);
      document.addEventListener('mouseup', this.rotateMouseUpFunction, false);
    }
  }

  /**
   * Vuelve el mapa a la vista inicial.
   *
   * @public
   * @function
   * @api
   */
  resetView() {
    const cesiumMap = this.facadeMap_.getMapImpl();
    const scene = cesiumMap.scene;
    const camera = scene.camera;

    camera.flyTo({
      destination: this.position,
      duration: 0.5,
    });
  }

  /**
   * Activa la ayuda del control.
   *
   * @function
   * @public
   * @api
   */
  handleClickHelp() {
    const isOpen = this.panel.querySelector('.m-rotate-help-container').style.display
      && this.panel.querySelector('.m-rotate-help-container').style.display === 'block';

    if (!isOpen) {
      this.panel.querySelector('.m-rotate-help-container').style.display = 'block';
      this.panel.querySelector('.m-rotate-help-close').addEventListener('click', this.boundCloseHelp);
      this.panel.querySelector('#m-rotate-help-not-show-btn').addEventListener('click', this.boundNotShowHelp);
    }
  }

  /**
   * Cierra la ayuda del control.
   *
   * @function
   * @public
   * @api
   */
  closeHelp() {
    this.panel.querySelector('.m-rotate-help-close').removeEventListener('click', this.boundCloseHelp);
    this.panel.querySelector('#m-rotate-help-not-show-btn').removeEventListener('click', this.boundNotShowHelp);
    this.panel.querySelector('.m-rotate-help-container').style.display = 'none';
  }

  /**
   * Elimina la ayuda del control y no la vuelve a mostrar.
   *
   * @function
   * @public
   * @api
   */
  notShowHelp() {
    this.closeHelp();
    this.panel.querySelector('#m-rotate-help').removeEventListener('click', this.handleClickHelp);
    this.panel.querySelector('.m-rotate-help-button').style.display = 'none';
  }

  /**
   * Devuelve los elementos de la plantilla.
   *
   * @public
   * @function
   * @returns {HTMLElement} Elementos del control.
   * @api stable
   * @export
   */
  getElement() {
    return this.element;
  }

  /**
   * Esta función destruye este control y limpia el HTML.
   *
   * @public
   * @function
   * @api stable
   */
  destroy() {
    if (this.useTouch) {
      this.svgExterior.removeEventListener('touchstart', this.handleExteriorMouseDown);
      this.svgGiroscopio.removeEventListener('touchstart', this.handleGiroscopioMouseDown);
    } else {
      this.svgExterior.removeEventListener('mousedown', this.handleExteriorMouseDown);
      this.svgGiroscopio.removeEventListener('mousedown', this.handleGiroscopioMouseDown);
    }
    this.panel.querySelector('#m-rotate-giroscopio')
      .removeEventListener('dblclick', this.handleResetView);

    if (this.panel.querySelector('#m-rotate-help')) {
      this.notShowHelp();
    }

    if (this._unsubcribeFromPostRender) {
      this._unsubcribeFromPostRender();
      this._unsubcribeFromPostRender = undefined;
    }
    super.destroy();
  }
}

export default Rotate;
