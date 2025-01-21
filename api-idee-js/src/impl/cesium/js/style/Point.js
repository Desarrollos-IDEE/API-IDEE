/**
 * @module IDEE/impl/style/Point
 */
import {
  isNullOrEmpty,
  concatUrlPaths,
  addParameters,
  isDynamic,
  drawDynamicStyle,
  isArray,
  extend,
} from 'IDEE/util/Utils';
import * as Align from 'IDEE/style/Align';
import * as Baseline from 'IDEE/style/Baseline';
import * as HeightReference from 'IDEE/style/HeightReference';
import {
  BillboardGraphics,
  BoundingRectangle,
  Cartesian2,
  Color,
  Entity,
  HorizontalOrigin,
  LabelGraphics,
  LabelStyle,
  VerticalOrigin,
  HeightReference as CesiumHeightReference,
} from 'cesium';
import Simple from './Simple';
import PointFontSymbol from '../point/FontSymbol';
import { isUndefined, modifySVG } from '../../../../facade/js/util/Utils';

/**
 * @classdesc
 * Crea el estilo de un punto.
 * @api
 */

class Point extends Simple {
  /**
   * Este método devuelve el "canvas" en formato imagen.
   *
   * @function
   * @public
   * @return {String} "Canvas".
   * @api stable
   */
  toImage(canvas) {
    let image = null;
    const options = {
      fill: this.options_.fill,
      stroke: this.options_.stroke,
      icon: this.options_.icon,
    };
    if (isDynamic(options) === true) {
      image = drawDynamicStyle(canvas);
    } else {
      if (isNullOrEmpty(this.olStyleFn_)) {
        return null;
      }
      let style = this.olStyleFn_()[0].icon;
      if (style instanceof BillboardGraphics) {
        if (style.type === 'PointFontSymbol') {
          const imageCanvas = style.image.getValue();
          if (imageCanvas != null && imageCanvas) {
            image = imageCanvas.toDataURL();
          }
        } else {
          const imageStyle = style.image;
          if (!isNullOrEmpty(imageStyle)) {
            image = imageStyle.getValue();
            if (!image.startsWith(window.location.origin)) {
              const proxyImageURL = concatUrlPaths([IDEE.config.PROXY_URL, '/image']);
              image = addParameters(proxyImageURL, {
                url: image,
              });
            }
          }
        }
      } else {
        style = this.olStyleFn_()[0];
        if (style.outlineWidth > Point.DEFAULT_WIDTH_POINT) {
          style.outlineWidth = Point.DEFAULT_WIDTH_POINT;
        }
        const ctx = canvas.getContext('2d');
        if (!isNullOrEmpty(style.color)) {
          ctx.fillStyle = style.color.toCssColorString();
        }
        if (!isNullOrEmpty(style.outlineColor)) {
          ctx.strokeStyle = style.outlineColor.toCssColorString();
        }
        ctx.lineWidth = style.outlineWidth;
        ctx.beginPath();
        ctx.arc(
          this.getCanvasSize()[0] / 2,
          this.getCanvasSize()[1] / 2,
          this.getRadius_(),
          0,
          2 * Math.PI,
        );
        ctx.fill();
        ctx.stroke();
        image = canvas.toDataURL();
      }
    }
    return image;
  }

  /**
   * Este método actualiza las opciones de la fachada
   * (patrón estructural como una capa de abstracción con un patrón de diseño).
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @public
   * @param {object} options Opciones.
   * @function
   * @api stable
   */
  updateFacadeOptions(options) {
    this.olStyleFn_ = (feature) => {
      let featureVariable = feature;
      if (!(featureVariable instanceof Entity)) {
        featureVariable = this;
      }

      const style = { type: 'point', icon: undefined };

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

      let fill = { color: Color.TRANSPARENT };
      if (!isNullOrEmpty(options.fill)) {
        const fillColorValue = Simple.getValue(options.fill.color, featureVariable, this.layer_);
        let fillOpacityValue = Simple.getValue(options.fill.opacity, featureVariable, this.layer_);
        if (!fillOpacityValue && fillOpacityValue !== 0) {
          fillOpacityValue = 1;
        }
        if (!isNullOrEmpty(fillColorValue)) {
          fill = {
            color: Color.fromCssColorString(fillColorValue).withAlpha(fillOpacityValue),
          };
        }
      }
      let stroke = { outlineColor: Color.TRANSPARENT, outlineWidth: undefined };
      if (!isNullOrEmpty(options.stroke)) {
        const strokeColorValue = Simple
          .getValue(options.stroke.color, featureVariable, this.layer_);
        let strokeOpacityValue = Simple
          .getValue(options.stroke.opacity, featureVariable, this.layer_);
        if (!strokeOpacityValue && strokeOpacityValue !== 0) {
          strokeOpacityValue = 1;
        }
        if (!isNullOrEmpty(strokeColorValue)) {
          stroke = {
            outlineColor: Color.fromCssColorString(strokeColorValue).withAlpha(strokeOpacityValue),
            outlineWidth: Simple.getValue(options.stroke.width, featureVariable, this.layer_),
          };
        }
      }
      if (!isNullOrEmpty(options.label)) {
        const textLabel = Simple.getValue(options.label.text, featureVariable, this.layer_);
        const align = Simple.getValue(options.label.align, featureVariable, this.layer_);
        const baseline = Simple.getValue(options.label.baseline, featureVariable, this.layer_);
        const labelText = {
          font: Simple.getValue(options.label.font, featureVariable, this.layer_) || '10px sans-serif',
          scale: Simple.getValue(options.label.scale, featureVariable, this.layer_),
          pixelOffset: new Cartesian2(
            Simple.getValue(options.label.offset
              ? options.label.offset[0] : undefined, featureVariable, this.layer_),
            Simple.getValue(options.label.offset
              ? options.label.offset[1] : undefined, featureVariable, this.layer_),
          ),
          fillColor: Color.fromCssColorString(
            Simple.getValue(options.label.color || '#000000', featureVariable, this.layer_),
          ),
          verticalOrigin: Object.values(Baseline).includes(baseline)
            ? VerticalOrigin[baseline.toUpperCase()] : VerticalOrigin.TOP,
          horizontalOrigin: Object.values(Align).includes(align)
            ? HorizontalOrigin[align.toUpperCase()] : HorizontalOrigin.CENTER,
          text: textLabel === undefined ? undefined : String(textLabel),
          style: LabelStyle.FILL,
        };
        if (!isNullOrEmpty(options.label.stroke)) {
          // const { miterlimit, linedashoffset } = options.label.stroke;
          extend(labelText, {
            outlineColor: Color.fromCssColorString(
              Simple.getValue(options.label.stroke.color, featureVariable, this.layer_) || '#000000',
            ),
            outlineWidth: Simple.getValue(options.label.stroke.width, featureVariable, this.layer_)
              || undefined,
            style: LabelStyle.FILL_AND_OUTLINE,
          }, true);
        }
        style.label = new LabelGraphics(labelText);
      }

      let radius = Simple.getValue(options.radius, featureVariable, this.layer_);
      if (isArray(options.radius)) {
        const func = (f, map) => {
          let col = options.radius.find((element) => element.zoom === map.getZoom());
          if (isUndefined(col)) {
            col = options.radius.find((element) => element.zoom === 'default');
          }
          return col ? col.value : 5;
        };
        radius = Simple.getValue(func, featureVariable, this.layer_);
      }
      style.pixelSize = radius;

      if (!isNullOrEmpty(options.icon)) {
        const anchorOptions = ['bottom-left', 'bottom-right', 'top-left', 'top-right', 'center-left'];
        let anchorOrigin = options.icon.anchororigin
          && anchorOptions.includes(options.icon.anchororigin)
          ? options.icon.anchororigin : 'top-left';
        anchorOrigin = Simple.getValue(anchorOrigin, featureVariable, this.layer_).split('-');

        const baseline = anchorOrigin[0] === 'top' ? 'bottom' : 'top';
        const align = anchorOrigin[1] === 'left' ? 'right' : 'left';

        if (!isNullOrEmpty(options.icon.src)) {
          style.icon = new BillboardGraphics({
            image: Simple.getValue(options.icon.src, featureVariable, this.layer_),
            scale: Simple.getValue(options.icon.scale, featureVariable, this.layer_),
            rotation: Simple.getValue(
              options.icon.rotation ? -Number(options.icon.rotation) : 0,
              featureVariable,
              this.layer_,
            ),
            pixelOffset: new Cartesian2(
              Simple.getValue(options.icon.anchor
                ? options.icon.anchor[1] : undefined, featureVariable, this.layer_),
              Simple.getValue(options.icon.anchor
                ? options.icon.anchor[0] : undefined, featureVariable, this.layer_),
            ),
            color: new Color(
              1.0,
              1.0,
              1.0,
              Simple.getValue(options.icon.opacity || 1, featureVariable, this.layer_),
            ),
            sizeInMeters: false,
            verticalOrigin: Object.values(Baseline).includes(baseline) && options.icon.anchor
              ? VerticalOrigin[baseline.toUpperCase()] : VerticalOrigin.CENTER,
            horizontalOrigin: Object.values(Align).includes(align) && options.icon.anchor
              ? HorizontalOrigin[align.toUpperCase()] : HorizontalOrigin.CENTER,
            imageSubRegion: !isNullOrEmpty(options.icon.offset) && !isNullOrEmpty(options.icon.size)
              ? new BoundingRectangle(
                Simple.getValue(options.icon.offset
                  ? options.icon.offset[0] : undefined, featureVariable, this.layer_),
                Simple.getValue(options.icon.offset
                  ? options.icon.offset[1] : undefined, featureVariable, this.layer_),
                Simple.getValue(options.icon.size
                  ? options.icon.size[0] : undefined, featureVariable, this.layer_),
                Simple.getValue(options.icon.size
                  ? options.icon.size[1] : undefined, featureVariable, this.layer_),
              ) : undefined,
          });
          style.icon.type = 'Image';
        } else if (!isNullOrEmpty(options.icon.form)) {
          const fontSymbol = new PointFontSymbol({
            form: isNullOrEmpty(Simple.getValue(options.icon.form, featureVariable, this.layer_)) ? '' : Simple.getValue(options.icon.form, featureVariable, this.layer_).toLowerCase(),
            gradient: Simple.getValue(options.icon.gradient, featureVariable, this.layer_),
            glyph: Simple.getValue(options.icon.class, featureVariable, this.layer_),
            fontSize: Simple.getValue(options.icon.fontsize, featureVariable, this.layer_),
            radius: Simple.getValue(options.icon.radius, featureVariable, this.layer_),
            // rotation: Simple.getValue(options.icon.rotation, featureVariable, this.layer_),
            // rotateWithView: Simple.getValue(options.icon.rotate, featureVariable, this.layer_),
            fill: Simple.getValue(options.icon.fill !== undefined ? options.icon.fill : '#FFFFFF', featureVariable, this.layer_),
            stroke: options.icon.color ? {
              color: Simple.getValue(options.icon.color, featureVariable, this.layer_),
              width: 1,
            } : undefined,
            // opacity: Simple.getValue(options.icon.opacity, featureVariable, this.layer_),
            offset: Simple.getValue(options.icon.offset, featureVariable, this.layer_),
          });
          const canvas = fontSymbol.getImage();
          style.icon = new BillboardGraphics({
            image: canvas,
            scale: Simple.getValue(options.icon.scale, featureVariable, this.layer_),
            sizeInMeters: false,
            rotation: Simple.getValue(
              options.icon.rotation ? -Number(options.icon.rotation) : 0,
              featureVariable,
              this.layer_,
            ),
            pixelOffset: new Cartesian2(
              Simple.getValue(options.icon.anchor
                ? options.icon.anchor[1] : undefined, featureVariable, this.layer_),
              Simple.getValue(options.icon.anchor
                ? options.icon.anchor[0] : undefined, featureVariable, this.layer_),
            ),
            color: new Color(
              1.0,
              1.0,
              1.0,
              Simple.getValue(options.icon.opacity || 1, featureVariable, this.layer_),
            ),
            verticalOrigin: Object.values(Baseline).includes(baseline) && options.icon.anchor
              ? VerticalOrigin[baseline.toUpperCase()] : VerticalOrigin.CENTER,
            horizontalOrigin: Object.values(Align).includes(align) && options.icon.anchor
              ? HorizontalOrigin[align.toUpperCase()] : HorizontalOrigin.CENTER,
            imageSubRegion: !isNullOrEmpty(options.icon.offset) && !isNullOrEmpty(canvas)
              ? new BoundingRectangle(
                Simple.getValue(options.icon.offset
                  ? options.icon.offset[0] : undefined, featureVariable, this.layer_),
                Simple.getValue(options.icon.offset
                  ? options.icon.offset[1] : undefined, featureVariable, this.layer_),
                Simple.getValue(canvas.height
                  ? canvas.height : undefined, featureVariable, this.layer_),
                Simple.getValue(canvas.width
                  ? canvas.width : undefined, featureVariable, this.layer_),
              ) : undefined,
          });
          style.icon.type = 'PointFontSymbol';
        }
      }

      extend(style, {
        ...fill,
        ...stroke,
      });
      return [style];
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
  drawGeometryToCanvas(vectorContext) {
    if (this.olStyleFn_()[0].icon && this.olStyleFn_()[0].icon.type === 'PointFontSymbol') {
      vectorContext.beginPath();
      vectorContext.arc(10, 10, 5, 0, 2 * Math.PI);
      vectorContext.fill();
      vectorContext.stroke();
    } else {
      vectorContext.beginPath();
      vectorContext.arc(
        this.getCanvasSize()[0] / 2,
        this.getCanvasSize()[1] / 2,
        this.getRadius_(),
        0,
        2 * Math.PI,
      );
      vectorContext.fill();
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
    let options = this.options_;
    if (options.point) {
      options = options.point;
    }
    if (options.icon && options.icon.src && typeof options.icon.src === 'string' && options.icon.src.endsWith('.svg')
      && (options.icon.fill || options.icon.stroke)) {
      modifySVG(options.icon.src, options).then(() => {
        this.updateCanvas(canvas);
      });
    } else {
      this.updateFacadeOptions(options);
      if (!isDynamic(options)) {
        const canvasSize = this.getCanvasSize();
        // eslint-disable-next-line no-param-reassign
        canvas.width = canvasSize[0];
        // eslint-disable-next-line no-param-reassign
        canvas.height = canvasSize[1];

        const vectorContext = canvas.getContext('2d');
        let applyStyle = this.olStyleFn_()[0];
        if (!isNullOrEmpty(applyStyle.label)) {
          applyStyle.label = undefined;
        }
        if (!isNullOrEmpty(this.olStyleFn_()[0])
          && this.olStyleFn_()[0].icon instanceof BillboardGraphics) {
          applyStyle = this.olStyleFn_()[0];
        }
        const stroke = applyStyle.outline;
        if (!isNullOrEmpty(stroke) && !isNullOrEmpty(applyStyle.outlineWidth)) {
          applyStyle.outlineWidth = 3;
        }
        if (!isNullOrEmpty(applyStyle.color)) {
          vectorContext.fillStyle = applyStyle.color.toCssColorString();
        }
        if (!isNullOrEmpty(applyStyle.outlineColor)) {
          vectorContext.strokeStyle = applyStyle.outlineColor.toCssColorString();
        }
        if (!isNullOrEmpty(applyStyle.outlineWidth)) {
          vectorContext.lineWidth = applyStyle.outlineWidth;
        }

        this.drawGeometryToCanvas(vectorContext);
      }
    }
  }

  /**
   * Este método devuelve el tamaño del "canvas".
   *
   * @public
   * @function
   * @returns {Array} Tamaño.
   * @api stable
   */
  getCanvasSize() {
    const image = this.olStyleFn_()[0].icon;
    let size;
    if (image && image.type === 'PointFontSymbol') {
      size = [90, 90];
    } else {
      const radius = this.getRadius_(image);
      size = [(radius * 2) + 4, (radius * 2) + 4];
    }
    return size;
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

/**
 * Valores por defecto.
 *
 * @const
 * @type {Number}
 * @public
 * @api
 */
Point.DEFAULT_WIDTH_POINT = 3;

/**
 * Esta función devuelve los nombres de las fuentes disponibles.
 * @function
 * @returns {Array} Fuentes.
 * @api
 */
Point.getFonts = () => {
  const fonts = [];
  const defs = PointFontSymbol.defs.fonts;
  Object.keys(defs).forEach((font) => {
    fonts.push(font);
  });
  return fonts;
};

/**
 * Esta función devuelve los iconos disponibles para una fuente.
 * @function
 * @api
 * @param { name } name Nombre del icono.
 */
Point.getFontsIcons = (name) => {
  const icons = [];
  const glyphs = PointFontSymbol.defs.glyphs;
  Object.entries(glyphs).forEach((elm) => {
    if (elm[1].font === name) {
      icons.push(elm[0]);
    }
  });
  return icons;
};

export default Point;
