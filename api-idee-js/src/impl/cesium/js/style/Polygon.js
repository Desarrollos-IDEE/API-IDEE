/**
 * @module M/impl/style/Polygon
 */
import * as Baseline from 'M/style/Baseline';
import * as Align from 'M/style/Align';
import * as HeightReference from 'M/style/HeightReference';
import {
  isNullOrEmpty,
  extend,
  isUndefined,
  isString,
} from 'M/util/Utils';
import {
  Entity,
  Color,
  LabelGraphics,
  LabelStyle,
  Cartesian2,
  HorizontalOrigin,
  VerticalOrigin,
  HeightReference as CesiumHeightReference,
} from 'cesium';
import Simple from './Simple';

/**
 * @classdesc
 * @api
 * Crea el estilo de un polígono.
 */
class Polygon extends Simple {
  /**
   * Constructor principal de la clase.
   * @constructor
   * @param {Object} optionsParam Opciones que se pasarán a la implementación.
   * - stroke: Borde del polígono.
   *    - width: Tamaño.
   *    - pattern (name, src, color, size, spacing, rotation, scale, offset)
   *    - linedash: Línea rayada.
   *    - linejoin: Línea unidas.
   *    - linecap: Límite de la línea.
   * - label
   *    - rotate: Rotación.
   *    - offset: Desplazamiento.
   *    - stroke (color, width, linecap, linejoin, linedash)
   * - fill: Relleno.
   *    - color: Color.
   *    - opacity: Opacidad.
   *    - pattern (name, src, color, size, spacing, rotation, scale, offset)
   * - renderer: Renderizado.
   *     - property: Propiedades.
   *     - stoke (color y width).
   * - heightReference: Posición relativa al terreno. Solo tendrá efecto si el
   *   parámetro height de la capa tiene valor.
   * - perPositionHeight: Indica si se utiliza o no la altura dada en las coordenadas
   *   de la geometría.
   * - extrudedHeight: Extrusión del polígono.
   * - extrudedHeightReference: Posición relativa al terreno de la extrusión del
   *   polígono. Solo tendrá efecto si extrudedHeight tiene valor.
   * @api stable
   */
  constructor(options) {
    super(options);
    this.olStyleFn_ = this.updateFacadeOptions(options);
  }

  /**
   * Este método actualiza las opciones de la fachada
   * (patrón estructural como una capa de abstracción con un patrón de diseño).
   *
   * @public
   * @param {object} options Opciones.
   * @function
   * @return {Array<object>} Estilo de la fachada.
   * @api stable
   */
  updateFacadeOptions(options) {
    const fnStyle = (feature) => {
      let featureVariable = feature;
      if (!(featureVariable instanceof Entity)) {
        featureVariable = this;
      }
      const style = {
        type: 'polygon',
        label: undefined,
        outline: false,
        fill: false,
      };
      if (!isNullOrEmpty(options.perPositionHeight)) {
        const perPositionHeight = Simple.getValue(
          options.perPositionHeight,
          featureVariable,
          this.layer_,
        );
        extend(style, { perPositionHeight });
      }
      if (!isNullOrEmpty(options.heightReference)) {
        const heightReference = Simple.getValue(
          options.heightReference,
          featureVariable,
          this.layer_,
        );
        extend(style, {
          heightReference: Object.values(HeightReference).includes(heightReference)
            ? CesiumHeightReference[heightReference] : CesiumHeightReference.NONE,
        });
      }
      if (!isNullOrEmpty(options.extrudedHeight)) {
        const extrudedHeight = Simple
          .getValue(options.extrudedHeight, featureVariable, this.layer_);
        let extruded = extrudedHeight;

        if (featureVariable instanceof Entity && isString(extrudedHeight)
          && featureVariable.properties.hasProperty(extrudedHeight)) {
          extruded = featureVariable.properties[extrudedHeight];
        } else if (!isString(extrudedHeight)) {
          extruded = extrudedHeight;
        }
        extend(style, {
          extrudedHeight: extruded,
        }, true);
      }
      if (!isNullOrEmpty(options.extrudedHeightReference)) {
        const extrudedHeightReference = Simple.getValue(
          options.extrudedHeightReference,
          featureVariable,
          this.layer_,
        );
        extend(style, {
          extrudedHeightReference: Object.values(HeightReference).includes(extrudedHeightReference)
            ? CesiumHeightReference[extrudedHeightReference] : CesiumHeightReference.NONE,
        });
      }
      if (!isNullOrEmpty(options.stroke) && isNullOrEmpty(options.stroke.pattern)) {
        const strokeColorValue = Simple
          .getValue(options.stroke.color || '#000000', featureVariable, this.layer_);
        let strokeOpacityValue = Simple
          .getValue(options.stroke.opacity, featureVariable, this.layer_);
        if (!strokeOpacityValue && strokeOpacityValue !== 0) {
          strokeOpacityValue = 1;
        }
        extend(style, {
          outline: true,
          outlineColor: Color.fromCssColorString(strokeColorValue).withAlpha(strokeOpacityValue),
          outlineWidth: Simple.getValue(options.stroke.width, featureVariable, this.layer_),
        }, true);
      }
      if (!isNullOrEmpty(options.label)) {
        const textLabel = Simple.getValue(options.label.text, featureVariable, this.layer_);
        const align = Simple.getValue(options.label.align, featureVariable, this.layer_);
        const baseline = Simple.getValue(options.label.baseline, featureVariable, this.layer_);
        const labelOptionsStyle = {
          font: Simple.getValue(options.label.font, featureVariable, this.layer_) || '10px sans-serif',
          scale: Simple.getValue(options.label.scale, featureVariable, this.layer_),
          pixelOffset: new Cartesian2(
            Simple.getValue(options.label.offset ? options.label.offset[0] : undefined),
            Simple.getValue(options.label.offset ? options.label.offset[1] : undefined),
          ),
          fillColor: Color.fromCssColorString(
            Simple.getValue(options.label.color || '#000000', featureVariable, this.layer_),
          ),
          horizontalOrigin: Object.values(Align).includes(align)
            ? HorizontalOrigin[align.toUpperCase()] : HorizontalOrigin.CENTER,
          verticalOrigin: Object.values(Baseline).includes(baseline)
            ? VerticalOrigin[baseline.toUpperCase()] : VerticalOrigin.TOP,
          text: textLabel === undefined ? undefined : String(textLabel),
          style: LabelStyle.FILL,
        };
        if (!isNullOrEmpty(options.label.stroke)) {
          extend(labelOptionsStyle, {
            outlineColor: Color.fromCssColorString(
              Simple.getValue(options.label.stroke.color, featureVariable, this.layer_),
            ),
            outlineWidth: Simple.getValue(options.label.stroke.width, featureVariable, this.layer_),
            style: LabelStyle.FILL_AND_OUTLINE,
          }, true);
        }
        style.label = new LabelGraphics(labelOptionsStyle);
      }
      if (!isNullOrEmpty(options.fill)) {
        const fillColorValue = Simple.getValue(options.fill.color, featureVariable, this.layer_);
        let fill = {};
        if (!isNullOrEmpty(fillColorValue)) {
          let fillOpacityValue = Simple
            .getValue(options.fill.opacity, featureVariable, this.layer_);
          if (!fillOpacityValue && fillOpacityValue !== 0) {
            fillOpacityValue = 1;
          }
          fill = {
            fill: true,
            material: Color.fromCssColorString(fillColorValue).withAlpha(fillOpacityValue),
          };
        }
        extend(style, fill, true);
      }
      return [style];
    };
    this.olStyleFn_ = fnStyle;
    return fnStyle;
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
    const canvasSize = Polygon.getCanvasSize();
    // eslint-disable-next-line no-param-reassign
    canvas.width = canvasSize[0];
    // eslint-disable-next-line no-param-reassign
    canvas.height = canvasSize[1];

    const vectorContext = canvas.getContext('2d');
    const applyStyle = this.olStyleFn_()[0];
    if (!isUndefined(applyStyle.label)) {
      applyStyle.label = undefined;
    }
    const stroke = applyStyle.outline;
    if (stroke) {
      if (applyStyle.outlineWidth && applyStyle.outlineWidth > Polygon.DEFAULT_WIDTH_POLYGON) {
        applyStyle.outlineWidth = Polygon.DEFAULT_WIDTH_POLYGON;
      }
    }
    if (!isNullOrEmpty(applyStyle.material)) {
      vectorContext.fillStyle = applyStyle.material.toCssColorString();
    }
    if (applyStyle.outline) {
      vectorContext.strokeStyle = applyStyle.outlineColor.toCssColorString();
      vectorContext.lineWidth = applyStyle.outlineWidth;
    }

    this.drawGeometryToCanvas(vectorContext);
    vectorContext.fill();
    if (applyStyle.outline) { vectorContext.stroke(); }
  }

  /**
   * Este método dibuja la geometría en el "canvas".
   *
   * @public
   * @function
   * @param {Object} vectorContext Vector que se dibujará en el "canvas".
   * @api stable
   */
  drawGeometryToCanvas(vectorContext) {
    const canvasSize = Polygon.getCanvasSize();
    const maxW = Math.floor(canvasSize[0]);
    const maxH = Math.floor(canvasSize[1]);
    const minW = (canvasSize[0] - maxW);
    const minH = (canvasSize[1] - maxH);
    vectorContext.beginPath();
    vectorContext.moveTo(minW + 3, minH + 3);
    vectorContext.lineTo(maxW - 3, minH + 3);
    vectorContext.lineTo(maxW - 3, maxH - 3);
    vectorContext.lineTo(minW + 3, maxH - 3);
    vectorContext.closePath();
  }

  /**
   * Este método de la clase, devuelve el tamaño del "canvas".
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
Polygon.DEFAULT_WIDTH_POLYGON = 3;

export default Polygon;
