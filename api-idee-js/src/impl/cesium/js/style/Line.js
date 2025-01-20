/**
 * @module M/impl/style/Line
 */
import { isNullOrEmpty, extend } from 'M/util/Utils';
import * as Baseline from 'M/style/Baseline';
import * as Align from 'M/style/Align';
import {
  Cartesian2,
  Color,
  Entity,
  HorizontalOrigin,
  LabelGraphics,
  LabelStyle,
  PolylineOutlineMaterialProperty,
  VerticalOrigin,
} from 'cesium';
import Simple from './Simple';

/**
 * @classdesc
 * Crea un estilo de línea
 * con parámetros especificados por el usuario.
 * @api
 * @namespace M.impl.style.Line
 *
 */
class Line extends Simple {
  /**
   * Constructor principal de la clase.
   * @constructor
   * @param {Object} options Opciones de la clase.
   * - icon (src): Ruta del icono.
   * @implements {M.impl.style.Simple}
   * @api stable
   */
  constructor(options) {
    super(options);
    this.olStyleFn_ = this.updateFacadeOptions(options);
  }

  /**
   * Este método actualiza las opciones de la fachada
   * (patrón estructural como una capa de abstracción con un patrón de diseño).
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @public
   * @param {object} options Opciones.
   * @return {Array<object>} Estilo de la fachada.
   * @function
   * @api stable
   */
  updateFacadeOptions(options) {
    const fn = (feature) => {
      let featureVariable = feature;
      if (!(featureVariable instanceof Entity)) {
        featureVariable = this;
      }
      const stroke = options.stroke;
      const label = options.label;
      const style = { type: 'line' };
      let styleStroke = {};
      const getValue = Simple.getValue;
      if (!isNullOrEmpty(stroke)) {
        const strokeColorValue = getValue(stroke.color, featureVariable) || '#000000';
        let strokeOpacityValue = getValue(stroke.opacity, featureVariable);
        if (!strokeOpacityValue && strokeOpacityValue !== 0) {
          strokeOpacityValue = 1;
        }
        styleStroke = {
          material: new PolylineOutlineMaterialProperty({
            color: Color.fromCssColorString(strokeColorValue).withAlpha(strokeOpacityValue),
            outlineColor: Color.fromCssColorString(strokeColorValue).withAlpha(strokeOpacityValue),
            outlineWidth: getValue(stroke.width, featureVariable),
          }),
        };
        extend(style, styleStroke, true);
      }
      if (!isNullOrEmpty(label)) {
        const align = getValue(label.align, featureVariable);
        const baseline = Simple.getValue(options.label.baseline, featureVariable, this.layer_);
        const textPathConfig = {
          text: getValue(label.text, featureVariable) === undefined
            ? undefined : String(getValue(label.text, featureVariable)),
          font: getValue(label.font, featureVariable) || '10px sans-serif',
          fillColor: Color.fromCssColorString(getValue(label.color || '#000000', featureVariable)),
          verticalOrigin: Object.values(Baseline).includes(baseline)
            ? VerticalOrigin[baseline.toUpperCase()] : VerticalOrigin.TOP,
          horizontalOrigin: Object.values(Align).includes(align)
            ? HorizontalOrigin[align.toUpperCase()] : HorizontalOrigin.CENTER,
          scale: getValue(label.scale, featureVariable),
          pixelOffset: new Cartesian2(
            getValue(options.label.offset ? options.label.offset[0] : undefined, featureVariable),
            getValue(options.label.offset ? options.label.offset[1] : undefined, featureVariable),
          ),
          style: LabelStyle.FILL,
        };
        if (!isNullOrEmpty(label.stroke)) {
          extend(textPathConfig, {
            outlineColor: Color.fromCssColorString(getValue(label.stroke.color, featureVariable)),
            outlineWidth: getValue(label.stroke.width, featureVariable),
            style: LabelStyle.FILL_AND_OUTLINE,
          }, true);
        }
        style.label = new LabelGraphics(textPathConfig);
      }
      let fill = {};
      if (!isNullOrEmpty(options.fill)) {
        const fillColorValue = Simple.getValue(options.fill.color, featureVariable, this.layer_);
        const widthValue = Simple.getValue(options.fill.width, featureVariable, this.layer_);
        if (!isNullOrEmpty(fillColorValue)) {
          let fillOpacityValue = Simple.getValue(
            options.fill.opacity,
            featureVariable,
            this.layer_,
          );
          if (!fillOpacityValue && fillOpacityValue !== 0) {
            fillOpacityValue = 1;
          }
          if (!isNullOrEmpty(stroke)) {
            styleStroke.material.color = Color.fromCssColorString(fillColorValue)
              .withAlpha(fillOpacityValue);
            fill = {
              material: styleStroke.material,
              width: widthValue,
            };
          } else {
            fill = {
              material: Color.fromCssColorString(fillColorValue).withAlpha(fillOpacityValue),
              width: widthValue,
            };
          }
        }
        extend(style, fill, true);
      }
      return [style];
    };
    this.olStyleFn_ = fn;
    return fn;
  }

  /**
   * Este método aplica los estilos a la capa.
   * @public
   * @function
   * @param {M.layer.Vector} layer Capa.
   * @api stable
   */
  applyToLayer(layer) {
    super.applyToLayer(layer);
  }

  /**
   * Este método elimina los estilos de la capa.
   *
   * @function
   * @protected
   * @param {M.layer.Vector} layer Capa.
   * @api stable
   */
  unapply() {
  }

  /**
   * Este método dibuja la geometría en el "canvas".
   *
   * @public
   * @function
   * @param {Object} vectorContext Vector que se dibujará en el "canvas".
   * @param {Object} canvas "canvas".
   * @param {Object} style Estilo del vector.
   * @param {Number} stroke Tamaño del borde.
   * @api stable
   */
  drawGeometryToCanvas(vectorContext, canvas, style, stroke) {
    const x = Line.getCanvasSize()[0];
    const y = Line.getCanvasSize()[1];

    if (!isNullOrEmpty(style)) {
      if (style.hasStroke) {
        vectorContext.beginPath();
        vectorContext.moveTo(0 + stroke, 0 + stroke);
        vectorContext.lineTo((x / 3), (y / 2) - stroke);
        vectorContext.lineTo(((2 * x) / 3), 0 + (stroke));
        vectorContext.lineTo(x - stroke, (y / 2) - stroke);
        vectorContext.stroke();
      }

      vectorContext.beginPath();
      // eslint-disable-next-line no-param-reassign
      vectorContext.strokeStyle = style.color.toCssColorString();
      // eslint-disable-next-line no-param-reassign
      vectorContext.lineWidth = style.width;
      vectorContext.moveTo(0 + stroke, 0 + stroke);
      vectorContext.lineTo((x / 3), (y / 2) - stroke);
      vectorContext.lineTo(((2 * x) / 3), 0 + (stroke));
      vectorContext.lineTo(x - stroke, (y / 2) - stroke);
      vectorContext.stroke();
    }
  }

  /**
   * Este método actualiza el "canvas".
   *
   * @public
   * @function
   * @param {HTMLCanvasElement} canvas Nuevo "canvas".
   * @api stable
   */
  updateCanvas(canvas) {
    this.updateFacadeOptions(this.options_);
    const canvasSize = Line.getCanvasSize();
    // eslint-disable-next-line no-param-reassign
    canvas.width = canvasSize[0];
    // eslint-disable-next-line no-param-reassign
    canvas.height = canvasSize[1];
    const vectorContext = canvas.getContext('2d');
    let optionsStyle;
    const style = this.olStyleFn_()[0];
    let color;
    let widthStroke;
    if (!isNullOrEmpty(style) && !isNullOrEmpty(style.material)) {
      if (style.material instanceof Color) {
        color = style.material;
        optionsStyle = {
          hasStroke: false,
          color,
          width: 1,
        };
      } else if (style.material instanceof PolylineOutlineMaterialProperty) {
        color = style.material.getValue().color;
        if (!isNullOrEmpty(style.material.getValue().outlineWidth)) {
          widthStroke = style.material.getValue().outlineWidth;
          if (widthStroke > Line.DEFAULT_WIDTH_LINE) {
            widthStroke = Line.DEFAULT_WIDTH_LINE;
          }
        } else {
          widthStroke = Line.DEFAULT_WIDTH_LINE;
        }
        optionsStyle = {
          hasStroke: true,
          color,
          strokeColor: style.material.getValue().outlineColor,
          width: 1,
          widthStroke,
        };
      }
      if (!isNullOrEmpty(style.label)) {
        style.label = undefined;
      }
    }

    if (!isNullOrEmpty(optionsStyle) && optionsStyle.hasStroke) {
      vectorContext.strokeStyle = optionsStyle.strokeColor.toCssColorString();
      vectorContext.lineWidth = optionsStyle.widthStroke;
    }
    this.drawGeometryToCanvas(vectorContext, canvas, optionsStyle, 1);
  }

  /**
   * Este método devuelve el tamaño del "canvas".
   *
   * @public
   * @function
   * @returns {Array} Tamaño.
   * @api stable
   */
  static getCanvasSize() {
    return [25, 15];
  }
}

/**
 * Valores por defecto.
 *
 * @const
 * @type {Number}
 * @public
 * @api
 */
Line.DEFAULT_WIDTH_LINE = 3;

export default Line;
