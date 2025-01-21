/**
 * @module IDEE/impl/style/Generic
 */
import {
  isFunction,
  isUndefined,
  isDynamic,
  drawDynamicStyle,
  isNullOrEmpty,
} from 'IDEE/util/Utils';
import {
  BillboardGraphics,
  Color,
  Entity,
  PolylineOutlineMaterialProperty,
} from 'cesium';
import Simple from './Simple';
import { getLineStyle, getPointStyle, getPolygonStyle } from './builder';
import ImplUtils from '../util/Utils';

/**
 * Objetos con los tipos de geometrías.
 * @const
 * @type {object}
 */
const GETTER_BY_GEOM = {
  Point: (...args) => getPointStyle(args[0].point, args[1], args[2]),
  LineString: (...args) => getLineStyle(args[0].line, args[1], args[2]),
  Polygon: (...args) => getPolygonStyle(args[0].polygon, args[1], args[2]),
};

/**
 * @classdesc
 * Crea un estilo genérico.
 * @api
 */
class Generic extends Simple {
  /**
   * Constructor principal de la clase.
   * @constructor
   * @param {Object} optionsVar Opciones del estilo.
   * - Point. Punto.
   * - Polygon. Polígono.
   * - Line. Linea.
   * @api stable
   */
  constructor(options = {}) {
    super(options);

    /**
     * @private
     * @type {object}
     */
    this.styles_ = {};
  }

  /**
   * Este método devuelve el "canvas" en formato imagen.
   *
   * @function
   * @public
   * @return {String} "Url del Canvas".
   * @api stable
   */
  toImage() {
    const imgSize = 30;
    let loadImagePoint = null;
    let loadImagePoly = null;
    let loadImageLine = null;
    const dinamic = drawDynamicStyle();
    const promises = [];

    // Point image
    if (!isUndefined(this.options_.point)) {
      loadImagePoint = (d) => new Promise((resolve, reject) => {
        const img = new Image();

        // onload / onerror
        img.onload = () => resolve(img);
        img.onerror = reject;

        // img
        img.width = imgSize;
        img.height = imgSize;

        if (isDynamic(this.options_.point) === true) {
          img.src = d;
        } else {
          const getterPoint = GETTER_BY_GEOM.Point;
          const stylesPoint = getterPoint(this.options_, this, this.layer_)[0];
          const canvasSize = [25, 15];
          const canvasPOI = document.createElement('canvas');
          const ctx = canvasPOI.getContext('2d');
          if (!isNullOrEmpty(stylesPoint.color)) {
            ctx.fillStyle = stylesPoint.color.toCssColorString();
          }
          if (!isNullOrEmpty(stylesPoint.outlineColor)) {
            ctx.strokeStyle = stylesPoint.outlineColor.toCssColorString();
          }
          ctx.lineWidth = stylesPoint.outlineWidth;
          ctx.beginPath();
          ctx.arc(
            canvasSize[0] / 2,
            canvasSize[1] / 2,
            5,
            0,
            2 * Math.PI,
          );
          ctx.fill();
          ctx.stroke();
          img.src = canvasPOI.toDataURL();
        }
      });
      promises.push(loadImagePoint(dinamic));
    }

    // Polygon image
    if (!isUndefined(this.options_.polygon)) {
      loadImagePoly = (d) => new Promise((resolve, reject) => {
        const img = new Image();

        // onload / onerror
        img.onload = () => resolve(img);
        img.onerror = reject;

        // img

        if (isDynamic(this.options_.polygon) === true) {
          img.src = d;
          img.width = imgSize;
          img.height = imgSize;
        } else {
          const getterPolygon = GETTER_BY_GEOM.Polygon;
          const stylesPolygon = getterPolygon(this.options_, this, this.layer_);
          const canvasPO = document.createElement('canvas');
          canvasPO.width = imgSize;
          canvasPO.height = imgSize;
          const ctxPO = canvasPO.getContext('2d');
          ctxPO.fillStyle = stylesPolygon[0].material.toCssColorString();
          ctxPO.strokeStyle = stylesPolygon[0].outlineColor.toCssColorString();
          ctxPO.lineWidth = stylesPolygon[0].outlineWidth;
          const canvasSize = [25, 15];
          const maxW = Math.floor(canvasSize[0]);
          const maxH = Math.floor(canvasSize[1]);
          const minW = (canvasSize[0] - maxW);
          const minH = (canvasSize[1] - maxH);
          ctxPO.beginPath();
          ctxPO.moveTo(minW + 3, minH + 3);
          ctxPO.lineTo(maxW - 3, minH + 3);
          ctxPO.lineTo(maxW - 3, maxH - 3);
          ctxPO.lineTo(minW + 3, maxH - 3);
          ctxPO.closePath();
          ctxPO.fill();
          ctxPO.stroke();
          img.src = canvasPO.toDataURL();
        }
      });
      promises.push(loadImagePoly(dinamic));
    }

    // Line image
    if (!isUndefined(this.options_.line)) {
      loadImageLine = (d) => new Promise((resolve, reject) => {
        const img = new Image();

        // onload / onerror
        img.onload = () => resolve(img);
        img.onerror = reject;

        // img
        if (isDynamic(this.options_.line) === true) {
          img.src = d;
          img.width = 30;
          img.height = 30;
        } else {
          const getterLine = GETTER_BY_GEOM.LineString;
          const stylesLine = getterLine(this.options_, this, this.layer_)[0];
          const canvasLI = document.createElement('canvas');
          canvasLI.width = 30;
          canvasLI.height = 30;
          const ctxLI = canvasLI.getContext('2d');
          const x = 25;
          const y = 15;
          let color;
          const stroke = 1;
          let optionsStyle;
          if (!isNullOrEmpty(stylesLine.material)) {
            if (stylesLine.material instanceof Color) {
              color = stylesLine.material;
              optionsStyle = {
                hasStroke: false,
                color,
                width: 1,
              };
            } else if (stylesLine.material instanceof PolylineOutlineMaterialProperty) {
              color = stylesLine.material.getValue().color;
              optionsStyle = {
                hasStroke: true,
                color,
                strokeColor: stylesLine.material.getValue().outlineColor,
                width: 1,
                widthStroke: stylesLine.material.getValue().outlineWidth || 1.5,
              };
              ctxLI.strokeStyle = optionsStyle.strokeColor.toCssColorString();
              ctxLI.lineWidth = optionsStyle.widthStroke;
            }
          }
          if (!isUndefined(optionsStyle)) {
            if (optionsStyle.hasStroke) {
              ctxLI.beginPath();
              ctxLI.moveTo(0 + stroke, 0 + stroke);
              ctxLI.lineTo((x / 3), (y / 2) - stroke);
              ctxLI.lineTo(((2 * x) / 3), 0 + (stroke));
              ctxLI.lineTo(x - stroke, (y / 2) - stroke);
              ctxLI.stroke();
            }
            ctxLI.beginPath();
            ctxLI.strokeStyle = optionsStyle.color.toCssColorString();
            ctxLI.lineWidth = optionsStyle.width;
            ctxLI.moveTo(0 + stroke, 0 + stroke);
            ctxLI.lineTo((x / 3), (y / 2) - stroke);
            ctxLI.lineTo(((2 * x) / 3), 0 + (stroke));
            ctxLI.lineTo(x - stroke, (y / 2) - stroke);
            ctxLI.stroke();
          }
          img.src = canvasLI.toDataURL();
        }
      });
      promises.push(loadImageLine(dinamic));
    }

    // Canvas / Context
    const canvasGL = document.createElement('canvas');
    canvasGL.width = 200;
    canvasGL.height = 50;
    const ctxGL = canvasGL.getContext('2d');

    const positions = [0, 60, 120];
    let cont = 0;

    // Loading images
    return Promise.all(promises).then((values) => {
      values.forEach((image) => {
        ctxGL.drawImage(image, positions[cont], 0);
        cont += 1;
      });
      return canvasGL.toDataURL();
    });
  }

  /**
   * Este método actualiza las opciones de la fachada
   * (patrón estructural como una capa de abstracción con un patrón de diseño).
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @public
   * @param {object} options Opciones.
   * @return {object} Devuelve los estilos actualizados.
   * @function
   * @api stable
   */
  updateFacadeOptions(options) {
    this.olStyleFn_ = (feature) => {
      const idFeature = JSON.stringify(feature.id);
      let styles = [];
      this.styles_ = [];
      let featureVariable = feature;
      if (!(featureVariable instanceof Entity)) {
        featureVariable = this;
      } else {
        const type = ImplUtils.getGeometryType(featureVariable);
        const getter = GETTER_BY_GEOM[type];

        if (isFunction(getter)) {
          styles = getter(options, featureVariable, this.layer_);
          this.styles_[idFeature] = styles;
        }
      }
      return styles;
    };
  }

  /**
   * Este método dibuja la geometría en el "canvas".
   *
   * @public
   * @function
   * @param {Object} vectorContext Vector que se dibujará en el "canvas".
   * @api stable
   */
  drawGeometryToCanvas(vectorContext) {}

  /**
   * Este método actualiza el "canvas".
   *
   * @public
   * @function
   * @param {HTMLCanvasElement} canvas Nuevo "canvas".
   * @api stable
   */
  updateCanvas(canvas) {}

  /**
   * Este método devuelve el tamaño del "canvas".
   *
   * @public
   * @function
   * @returns {Array} Tamaño.
   * @api stable
   */
  getCanvasSize() {
    return 0;
  }

  /**
   * Este método devuelve el radio de una imagen.
   *
   * @public
   * @function
   * @param {object} image icono.
   * @api stable
   */
  getRadius_(image) {
    let r;
    if (image instanceof BillboardGraphics) {
      if (image.type === 'Image') {
        r = 25;
      } else if (image.type === 'PointFontSymbol') {
        const imageCanvas = image.image.getValue();
        r = Math.min(imageCanvas.width, imageCanvas.height) / 2;
      }
    } else {
      r = this.olStyleFn_()[0].pixelSize;
    }

    return r;
  }
}

export default Generic;
