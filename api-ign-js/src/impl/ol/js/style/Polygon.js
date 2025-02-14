/**
 * @module M/impl/style/Polygon
 */
import chroma from 'chroma-js';
import * as Baseline from 'M/style/Baseline';
import OLFeature from 'ol/Feature';
import * as Align from 'M/style/Align';
import OLStyleStroke from 'ol/style/Stroke';
import OLStyleText from 'ol/style/Text';
import OLGeomPolygon from 'ol/geom/Polygon';
import { isArray, isNullOrEmpty } from 'M/util/Utils';
import OLStyleIcon from 'ol/style/Icon';
import OLStyleFill from 'ol/style/Fill';
import { toContext as toContextRender } from 'ol/render';
import { getBottomLeft, getHeight, getWidth } from 'ol/extent';
import RenderFeature from 'ol/render/Feature';
import OLStyleFillPattern from '../ext/OLStyleFillPattern';
import OLStyleStrokePattern from '../ext/OLStyleStrokePattern';
import Simple from './Simple';
import Centroid from './Centroid';

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
   *
   * @public
   * @param {object} options Opciones.
   * @function
   * @return {Array<object>} Estilo de la fachada.
   * @api stable
   */
  updateFacadeOptions(options, vendorOptions) {
    const fnStyle = (feature) => {
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
      const style = new Centroid();
      if (!isNullOrEmpty(options.stroke) && !isNullOrEmpty(options.stroke.pattern)) {
        let fill;
        if (!isNullOrEmpty(options.stroke.color)) {
          const fillColorValue = Simple
            .getValue(options.stroke.color, featureVariable, this.layer_);
          if (!isNullOrEmpty(fillColorValue)) {
            let fillOpacityValue = Simple
              .getValue(options.stroke.opacity, featureVariable, this.layer_);
            if (!fillOpacityValue && fillOpacityValue !== 0) {
              fillOpacityValue = 1;
            }
            fill = new OLStyleFill({
              color: chroma(fillColorValue).alpha(fillOpacityValue).css(),
            });
          }
        }
        style.setStroke(new OLStyleStrokePattern({
          width: Simple.getValue(options.stroke.width, featureVariable, this.layer_),
          pattern: (Simple.getValue(options.stroke.pattern.name, featureVariable, this.layer_) || '').toLowerCase(),
          image: (Simple.getValue(options.stroke.pattern.name, featureVariable, this.layer_) === 'Image')
            ? new OLStyleIcon({
              src: Simple.getValue(options.stroke.pattern.src, featureVariable, this.layer_),
              crossOrigin: 'anonymous',
            })
            : undefined,
          color: !isNullOrEmpty(options.stroke.pattern.color) ? Simple.getValue(options.stroke.pattern.color, featureVariable, this.layer_) : 'rgba(0,0,0,1)',
          size: Simple.getValue(options.stroke.pattern.size, featureVariable, this.layer_),
          spacing: Simple.getValue(options.stroke.pattern.spacing, featureVariable, this.layer_),
          angle: Simple.getValue(options.stroke.pattern.rotation, featureVariable, this.layer_),
          scale: Simple.getValue(options.stroke.pattern.scale, featureVariable, this.layer_),
          offset: Simple.getValue(options.stroke.pattern.offset, featureVariable, this.layer_),
          fill,
          layer: this.layer_,
        }));
      } else if (!isNullOrEmpty(options.stroke)) {
        const strokeColorValue = Simple
          .getValue(options.stroke.color || '#000000', featureVariable, this.layer_);
        let strokeOpacityValue = Simple
          .getValue(options.stroke.opacity, featureVariable, this.layer_);
        if (!strokeOpacityValue && strokeOpacityValue !== 0) {
          strokeOpacityValue = 1;
        }
        style.setStroke(new OLStyleStroke({
          color: chroma(strokeColorValue).alpha(strokeOpacityValue).css(),
          width: Simple.getValue(options.stroke.width, featureVariable, this.layer_),
          lineDash: Simple.getValue(options.stroke.linedash, featureVariable, this.layer_),
          lineDashOffset: Simple.getValue(
            options.stroke.linedashoffset,
            featureVariable,
            this.layer_,
          ),
          lineCap: Simple.getValue(options.stroke.linecap, featureVariable, this.layer_),
          lineJoin: Simple.getValue(options.stroke.linejoin, featureVariable, this.layer_),
          miterLimit: Simple.getValue(options.stroke.miterlimit, featureVariable, this.layer_),
        }));
      }
      if (!isNullOrEmpty(options.label)) {
        const textLabel = Simple.getValue(options.label.text, featureVariable, this.layer_);
        const align = Simple.getValue(options.label.align, featureVariable, this.layer_);
        const baseline = Simple.getValue(options.label.baseline, featureVariable, this.layer_);
        const overflow = isNullOrEmpty(options.label.overflow, this.layer_)
          ? true
          : options.label.overflow;
        style.setText(new OLStyleText({
          font: Simple.getValue(options.label.font, featureVariable, this.layer_),
          rotateWithView: Simple.getValue(options.label.rotate, featureVariable, this.layer_),
          scale: Simple.getValue(options.label.scale, featureVariable, this.layer_),
          offsetX: Simple.getValue(options.label.offset
            ? options.label.offset[0]
            : undefined, featureVariable, this.layer_),
          offsetY: Simple.getValue(options.label.ofsset
            ? options.label.offset[1]
            : undefined, featureVariable, this.layer_),
          fill: new OLStyleFill({
            color: Simple.getValue(options.label.color || '#000000', featureVariable, this.layer_),
          }),
          textAlign: Object.values(Align).includes(align) ? align : 'center',
          textBaseline: Object.values(Baseline).includes(baseline) ? baseline : 'top',
          text: textLabel === undefined ? undefined : String(textLabel),
          rotation: Simple.getValue(options.label.rotation, featureVariable, this.layer_),
          overflow: Simple.getValue(overflow, featureVariable, this.layer_),
        }));
        if (!isNullOrEmpty(options.label.stroke)) {
          style.getText().setStroke(new OLStyleStroke({
            color: Simple.getValue(options.label.stroke.color, featureVariable, this.layer_),
            width: Simple.getValue(options.label.stroke.width, featureVariable, this.layer_),
            lineCap: Simple.getValue(options.label.stroke.linecap, featureVariable, this.layer_),
            lineJoin: Simple.getValue(options.label.stroke.linejoin, featureVariable, this.layer_),
            lineDash: Simple.getValue(options.label.stroke.linedash, featureVariable, this.layer_),
            lineDashOffset: Simple.getValue(
              options.label.stroke.linedashoffset,
              featureVariable,
              this.layer_,
            ),
            miterLimit: Simple.getValue(
              options.label.stroke.miterlimit,
              featureVariable,
              this.layer_,
            ),
          }));
        }
      }
      if (!isNullOrEmpty(options.fill)) {
        const fillColorValue = Simple.getValue(options.fill.color, featureVariable, this.layer_);
        let fill;
        if (!isNullOrEmpty(fillColorValue)) {
          let fillOpacityValue = Simple
            .getValue(options.fill.opacity, featureVariable, this.layer_);
          if (!fillOpacityValue && fillOpacityValue !== 0) {
            fillOpacityValue = 1;
          }
          fill = new OLStyleFill({
            color: chroma(fillColorValue).alpha(fillOpacityValue).css(),
          });
        }
        if (!isNullOrEmpty(options.fill.pattern)) {
          let color = 'rgba(0,0,0,1)';
          if (!isNullOrEmpty(options.fill.pattern.color)) {
            let opacity = Simple
              .getValue(options.fill.pattern.opacity, featureVariable, this.layer_) || 1;
            if (!opacity && opacity !== 0) {
              opacity = 1;
            }
            color = chroma(options.fill.pattern.color).alpha(opacity).css();
          }
          style.setFill(new OLStyleFillPattern({
            pattern: (Simple.getValue(options.fill.pattern.name, featureVariable, this.layer_) || '')
              .toLowerCase(),
            color,

            size: Simple.getValue(options.fill.pattern.size, featureVariable, this.layer_),
            spacing: Simple.getValue(options.fill.pattern.spacing, featureVariable, this.layer_),
            image: (Simple.getValue(options.fill.pattern.name, featureVariable, this.layer_) === 'Image')
              ? new OLStyleIcon({
                src: Simple.getValue(options.fill.pattern.src, featureVariable, this.layer_),
              })
              : undefined,
            angle: Simple.getValue(options.fill.pattern.rotation, featureVariable, this.layer_),
            scale: Simple.getValue(options.fill.pattern.scale, featureVariable, this.layer_),
            offset: Simple.getValue(options.fill.pattern.offset, featureVariable, this.layer_),
            fill,
            layer: this.layer_,
          }));
        } else {
          style.setFill(fill);
        }
      }
      if (options.renderer) {
        const fill = new OLStyleFill();
        const stroke = new OLStyleStroke({
          color: Simple.getValue(options.renderer.stroke.color, featureVariable, this.layer_),
          width: Simple.getValue(options.renderer.stroke.width, featureVariable, this.layer_),
        });
        const fn = (pixelCoordinates, state, a) => {
          const img = new Image();
          const property = Simple.getValue(options.renderer.property, featureVariable, this.layer_);
          const src = featureVariable.get(property).src
            ? featureVariable.get(property).src
            : featureVariable.get(property);
          img.onload = () => {
            featureVariable.set(property, img);
          };
          img.src = src;
          const context = state.context;
          const geometry = state.geometry.clone();
          geometry.setCoordinates(pixelCoordinates);
          const extent = geometry.getExtent();
          const width = getWidth(extent);
          const height = getHeight(extent);
          const flag = state.feature.get(property).src ? state.feature.get(property) : undefined;
          if (!flag || height < 1 || width < 1) {
            return;
          }
          context.save();
          const renderContext = toContextRender(context, {
            pixelRatio: 1,
          });
          renderContext.setFillStrokeStyle(fill, stroke);
          renderContext.drawGeometry(geometry);
          context.clip();
          const bottomLeft = getBottomLeft(extent);
          const left = bottomLeft[0];
          const bottom = bottomLeft[1];
          context.drawImage(flag, left, bottom, width, height);
          context.restore();
        };
        style.setRenderer(fn);
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
    const vectorContext = toContextRender(canvas.getContext('2d'), {
      size: canvasSize,
    });
    const applyStyle = this.olStyleFn_()[0];
    if (!isNullOrEmpty(applyStyle.getText())) {
      applyStyle.setText(null);
    }
    const stroke = applyStyle.getStroke();
    if (!isNullOrEmpty(stroke) && !isNullOrEmpty(stroke.getWidth())) {
      if (stroke.getWidth() > Polygon.DEFAULT_WIDTH_POLYGON) {
        applyStyle.getStroke().setWidth(Polygon.DEFAULT_WIDTH_POLYGON);
      }
    }

    vectorContext.setStyle(applyStyle);
    this.drawGeometryToCanvas(vectorContext);
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
    vectorContext.drawGeometry(new OLGeomPolygon([
      [
        [minW + 3, minH + 3],
        [maxW - 3, minH + 3],
        [maxW - 3, maxH - 3],
        [minW + 3, maxH - 3],
        [minW + 3, minH + 3],
      ],
    ]));
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
