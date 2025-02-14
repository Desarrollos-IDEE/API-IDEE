/**
 * @module M/impl/style/Line
 */
import { isArray, isNullOrEmpty, isFunction } from 'M/util/Utils';
import OLFeature from 'ol/Feature';
import OLStyleStroke from 'ol/style/Stroke';
import OLStyleFill from 'ol/style/Fill';
import { unByKey } from 'ol/Observable';
import { toContext as toContextRender } from 'ol/render';
import OLGeomLineString from 'ol/geom/LineString';
import OLStyleIcon from 'ol/style/Icon';
import RenderFeature from 'ol/render/Feature';
import chroma from 'chroma-js';
import OLStyleStrokePattern from '../ext/OLStyleStrokePattern';
import Centroid from './Centroid';
import Path from './Path';
import Simple from './Simple';
import postRender from '../util/render';
import '../ext/cspline';

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
   * @param {Object} vendorOptions Opciones de proveedor para la biblioteca base.
   * @api stable
   */
  constructor(options, vendorOptions) {
    super(options);
    let auxVendorOptions;
    if (vendorOptions) {
      if (isArray(vendorOptions)) {
        auxVendorOptions = vendorOptions;
      } else {
        auxVendorOptions = [vendorOptions];
      }
    }
    this.olStyleFn_ = this.updateFacadeOptions(options, auxVendorOptions);
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
  updateFacadeOptions(options, vendorOptions) {
    const fn = (feature) => {
      if (vendorOptions) {
        // #FIX_ST_VE_OP no esta diseñado de tal forma que solo se use una vez vendorOptions,
        // aquí seguirá enviando el vendorOptions como resultado ya que solo se define a
        // través de la styleFuntion. Por lo que se intenta arreglar de esta manera.
        // this.olStyleFn_ = this.updateFacadeOptions(options);
        return vendorOptions;
      }
      let featureVariable = feature;
      if (!(featureVariable instanceof OLFeature || feature instanceof RenderFeature)) {
        featureVariable = this;
      }
      const stroke = options.stroke;
      const label = options.label;
      // const fill = options.fill;
      const style = new Centroid();
      const styleStroke = new Centroid();
      const getValue = Simple.getValue;
      if (!isNullOrEmpty(stroke)) {
        const strokeColorValue = getValue(stroke.color, featureVariable) || '#000000';
        let strokeOpacityValue = getValue(stroke.opacity, featureVariable);
        if (!strokeOpacityValue && strokeOpacityValue !== 0) {
          strokeOpacityValue = 1;
        }
        style.setStroke(new OLStyleStroke({
          color: chroma(strokeColorValue).alpha(strokeOpacityValue).css(),
          width: getValue(stroke.width, featureVariable),
          lineDash: getValue(stroke.linedash, featureVariable),
          lineDashOffset: getValue(stroke.linedashoffset, featureVariable),
          lineCap: getValue(stroke.linecap, featureVariable),
          lineJoin: getValue(stroke.linejoin, featureVariable),
          miterLimit: getValue(stroke.miterlimit, featureVariable),
        }));
      }
      if (!isNullOrEmpty(label)) {
        const textPathConfig = {
          text: getValue(label.text, featureVariable) === undefined
            ? undefined
            : String(getValue(label.text, featureVariable)),
          font: getValue(label.font, featureVariable),
          fill: new OLStyleFill({
            color: getValue(label.color || '#000000', featureVariable),
          }),
          textBaseline: (getValue(label.baseline, featureVariable) || '').toLowerCase(),
          textAlign: getValue(label.align, featureVariable),
          scale: getValue(label.scale, featureVariable),
          rotateWithView: getValue(label.rotate, featureVariable) || false,
          overflow: getValue(label.textoverflow, featureVariable) || false,
          minWidth: getValue(label.minwidth, featureVariable) || 0,
          geometry: getValue(label.geometry, featureVariable),
          offsetX: getValue(options.label.offset
            ? options.label.offset[0]
            : undefined, featureVariable),
          offsetY: getValue(options.label.offset
            ? options.label.offset[1]
            : undefined, featureVariable),
        };
        const textPathStyle = new Path(textPathConfig);
        if (!isNullOrEmpty(label.stroke)) {
          textPathStyle.setStroke(new OLStyleStroke({
            color: getValue(label.stroke.color, featureVariable),
            width: getValue(label.stroke.width, featureVariable),
            lineCap: getValue(label.stroke.linecap, featureVariable),
            lineJoin: getValue(label.stroke.linejoin, featureVariable),
            lineDash: getValue(label.stroke.linedash, featureVariable),
            lineDashOffset: getValue(label.stroke.linedashoffset, featureVariable),
            miterLimit: getValue(label.stroke.miterlimit, featureVariable),
          }));
        }
        const applyPath = getValue(label.path, featureVariable);
        // we will use a flag into de options object to set pathstyle or ol.text style
        if (typeof applyPath === 'boolean' && applyPath) {
          style.textPath = textPathStyle;
          if (!isNullOrEmpty(label.smooth) && label.smooth === true
            && isFunction(featureVariable.getGeometry)) {
            style.setGeometry(featureVariable.getGeometry().cspline());
          }
          textPathStyle.setPlacement('line');
        }
        style.setText(textPathStyle);
      }
      let fill;
      if (!isNullOrEmpty(options.fill)) {
        const fillColorValue = Simple.getValue(options.fill.color, featureVariable, this.layer_);
        const widthValue = Simple.getValue(options.fill.width, featureVariable, this.layer_);
        if (!isNullOrEmpty(fillColorValue)) {
          let fillOpacityValue = Simple
            .getValue(options.fill.opacity, featureVariable, this.layer_);
          if (!fillOpacityValue && fillOpacityValue !== 0) {
            fillOpacityValue = 1;
          }
          fill = new OLStyleStroke({
            color: chroma(fillColorValue).alpha(fillOpacityValue).css(),
            width: widthValue,
          });
        }

        if (!isNullOrEmpty(options.fill.pattern)) {
          const color = isNullOrEmpty(options.fill.pattern.color)
            ? 'rgba(0,0,0,1)'
            : Simple.getValue(options.fill.pattern.color, featureVariable, this.layer_);

          fill = new OLStyleStrokePattern({
            pattern: (Simple.getValue(options.fill.pattern.name, featureVariable, this.layer_) || '').toLowerCase(),
            image: (Simple.getValue(options.fill.pattern.name, featureVariable, this.layer_) === 'Image')
              ? new OLStyleIcon({
                src: Simple.getValue(options.fill.pattern.src, featureVariable, this.layer_),
                crossOrigin: 'anonymous',
              })
              : undefined,
            color,
            width: widthValue,
            size: Simple.getValue(options.fill.pattern.size, featureVariable, this.layer_),
            spacing: Simple.getValue(options.fill.pattern.spacing, featureVariable, this.layer_),
            angle: Simple.getValue(options.fill.pattern.rotation, featureVariable, this.layer_),
            scale: Simple.getValue(options.fill.pattern.scale, featureVariable, this.layer_),
            offset: Simple.getValue(options.fill.pattern.offset, featureVariable, this.layer_),
            fill,
            layer: this.layer_,
          });
        }
      }
      styleStroke.setStroke(fill);
      return [style, styleStroke];
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

    const olLayer = layer.getImpl().getOL3Layer();
    if (!isNullOrEmpty(olLayer)) {
      this.postComposeEvtKey_ = olLayer.on('postcompose', postRender, olLayer);
    }
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
    unByKey(this.postComposeEvtKey_);
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
    const convasSize = Line.getCanvasSize();
    let x = convasSize[0];
    let y = convasSize[1];
    vectorContext.drawGeometry(new OLGeomLineString([
      [0 + (stroke / 2), 0 + (stroke / 2)],
      [(x / 3), (y / 2) - (stroke / 2)],
      [(2 * x) / 3, 0 + (stroke / 2)],
      [x - (stroke / 2), (y / 2) - (stroke / 2)],
    ]));
    if (!isNullOrEmpty(style)) {
      const width = style.width;
      const ctx = canvas.getContext('2d');
      ctx.lineWidth = style.width;
      x = canvas.width;
      y = canvas.height;
      ctx.strokeStyle = style.color;
      ctx.beginPath();
      ctx.lineTo(0 + width, 0 + width);
      ctx.lineTo((x / 3), (y / 2) - width);
      ctx.lineTo(((2 * x) / 3), 0 + (width));
      ctx.lineTo(x - width, (y / 2) - width);
      ctx.stroke();
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
    const vectorContext = toContextRender(canvas.getContext('2d'), {
      size: canvasSize,
    });
    let optionsStyle;
    const auxOlStyleFn = this.olStyleFn_();
    const style = auxOlStyleFn[1];
    if (!isNullOrEmpty(style) && !isNullOrEmpty(style.getStroke())) {
      optionsStyle = {
        color: style.getStroke().getColor(),
        width: 1,
      };
    }
    const applyStyle = auxOlStyleFn[0];
    if (!isNullOrEmpty(applyStyle.getText())) {
      applyStyle.setText(null);
    }
    const stroke = applyStyle.getStroke();
    let width;
    if (!isNullOrEmpty(stroke)) {
      if (!isNullOrEmpty(stroke.getWidth())) {
        width = stroke.getWidth();
        if (stroke.getWidth() > Line.DEFAULT_WIDTH_LINE) {
          width = Line.DEFAULT_WIDTH_LINE;
        }
      } else {
        width = 1;
      }
      optionsStyle = {
        color: applyStyle.getStroke().getColor(),
        width,
      };
      applyStyle.getStroke().setWidth(width);
      vectorContext.setStyle(applyStyle);
    }
    this.drawGeometryToCanvas(vectorContext, canvas, optionsStyle, width);
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
