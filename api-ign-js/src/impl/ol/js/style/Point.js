/**
 * @module M/impl/style/Point
 */
import {
  isUndefined, isArray, isNullOrEmpty, addParameters, concatUrlPaths, isDynamic, drawDynamicStyle,
  modifySVG,
} from 'M/util/Utils'; // from '../../../../facade/js/util/Utils';
import chroma from 'chroma-js';
import OLStyleImage from 'ol/style/Image';
import OLFeature from 'ol/Feature';
import * as Align from 'M/style/Align';
import * as Baseline from 'M/style/Baseline';
import OLStyleFill from 'ol/style/Fill';
import OLGeomPoint from 'ol/geom/Point';
import OLGeomMultiPoint from 'ol/geom/MultiPoint';
import OLStyleStroke from 'ol/style/Stroke';
import OLGeomCircle from 'ol/geom/Circle';
import OLStyleText from 'ol/style/Text';
import OLStyleIcon from 'ol/style/Icon';
import { toContext as toContextRender } from 'ol/render';
import RenderFeature from 'ol/render/Feature';
import OLStyleFontsSymbol from '../ext/OLStyleFontSymbol';
import Simple from './Simple';
import Utils from '../util/Utils';
import Centroid from './Centroid';
import PointFontSymbol from '../point/FontSymbol';
import PointIcon from '../point/Icon';
import PointCircle from '../point/Circle';

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
      const auxOlStyleFn = this.olStyleFn_();
      let styleImg = auxOlStyleFn[1] && auxOlStyleFn[1].getImage
        ? auxOlStyleFn[1].getImage()
        : undefined;
      if (styleImg instanceof OLStyleImage) {
        // see https://github.com/openlayers/openlayers/blob/master/src/ol/style/regularshape.js#L205
        if (styleImg instanceof PointFontSymbol) {
          const imageCanvas = styleImg.getImage();
          if (imageCanvas != null && imageCanvas) {
            image = imageCanvas.toDataURL();
          }
        } else if (styleImg instanceof PointIcon) {
          // let canvasSize = this.getCanvasSize(styleImg);
          // canvasSize[0] / size[0]) * size[0]
          // let [size, scale] = [styleImg.getSize(), styleImg.getScale()];
          // ctx.drawImage(styleImg.getImage(), 0, 0, ctx.canvas.height, ctx.canvas.width);
          if (!isNullOrEmpty(styleImg)) {
            image = styleImg.getSrc();
            if (!image.startsWith(window.location.origin)) {
              const proxyImageURL = concatUrlPaths([M.config.PROXY_URL, '/image']);
              image = addParameters(proxyImageURL, {
                url: image,
              });
            }
          }
        }
      } else {
        styleImg = auxOlStyleFn[0] && auxOlStyleFn[0].getImage ? auxOlStyleFn[0].getImage() : null;
        if (styleImg != null) {
          if (styleImg.getStroke() != null) {
            if (styleImg.getStroke().getWidth() > Point.DEFAULT_WIDTH_POINT) {
              styleImg.getStroke().setWidth(Point.DEFAULT_WIDTH_POINT);
            }
            styleImg.render();
          }
          const imageCanvas = styleImg.getImage();
          if (imageCanvas != null) {
            image = imageCanvas.toDataURL();
          }
        }
      }
    }
    return image;
  }

  /**
   * Este método regenera el feature OpenLayers
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @public
   * @param {object} olFeature Feature OpenLayers.
   * @function
   * @api stable
   */
  geometryCoordFunc_(olFeature) {
    if (olFeature.getGeometry().getType() === 'MultiPoint' || (olFeature.getGeometry().getType() === 'Point' && olFeature instanceof RenderFeature)) {
      if (olFeature instanceof RenderFeature) {
        const coodOriginal = olFeature.getFlatCoordinates();
        const coordinates = [];
        const splt = 2;
        for (let i = 0; i < coodOriginal.length; i += splt) {
          coordinates.push(coodOriginal.slice(i, i + splt));
        }
        return new OLGeomMultiPoint(coordinates);
      }
      return new OLGeomMultiPoint(olFeature.getGeometry().getCoordinates());
    }
    const center = Utils.getCentroid(olFeature.getGeometry());
    return new OLGeomPoint(center);
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
  updateFacadeOptions(options, vendorOptions) {
    this.olStyleFn_ = (feature) => {
      if (vendorOptions) {
        if (isArray(vendorOptions)) {
          return vendorOptions;
        }
        return [vendorOptions];
      }

      let featureVariable = feature;
      if (!(featureVariable instanceof OLFeature || feature instanceof RenderFeature)) {
        featureVariable = this;
      }

      const style = new Centroid({
        zIndex: Simple.getValue(options.zindex, featureVariable, this.layer_),
        geometry: this.geometryCoordFunc_,
      });

      const styleIcon = new Centroid({
        zIndex: Simple.getValue(options.zindex, featureVariable, this.layer_),
        geometry: this.geometryCoordFunc_,
      });

      let fill;
      if (!isNullOrEmpty(options.fill)) {
        const fillColorValue = Simple.getValue(options.fill.color, featureVariable, this.layer_);
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
      }
      let stroke;
      if (!isNullOrEmpty(options.stroke)) {
        const strokeColorValue = Simple
          .getValue(options.stroke.color, featureVariable, this.layer_);
        if (!isNullOrEmpty(strokeColorValue)) {
          let strokeOpacityValue = Simple
            .getValue(options.stroke.opacity, featureVariable, this.layer_);
          if (!strokeOpacityValue && strokeOpacityValue !== 0) {
            strokeOpacityValue = 1;
          }
          const { linedashoffset } = options.stroke;
          stroke = new OLStyleStroke({
            color: chroma(strokeColorValue).alpha(strokeOpacityValue).css(),
            width: Simple.getValue(options.stroke.width, featureVariable, this.layer_),
            lineDash: Simple.getValue(options.stroke.linedash, featureVariable, this.layer_),
            lineDashOffset: Simple.getValue(linedashoffset, featureVariable, this.layer_),
            lineCap: Simple.getValue(options.stroke.linecap, featureVariable, this.layer_),
            lineJoin: Simple.getValue(options.stroke.linejoin, featureVariable, this.layer_),
            miterLimit: Simple.getValue(options.stroke.miterlimit, featureVariable, this.layer_),
          });
        }
      }
      if (!isNullOrEmpty(options.label)) {
        const textLabel = Simple.getValue(options.label.text, featureVariable, this.layer_);
        const align = Simple.getValue(options.label.align, featureVariable, this.layer_);
        const baseline = Simple.getValue(options.label.baseline, featureVariable, this.layer_);
        const labelText = new OLStyleText({
          font: Simple.getValue(options.label.font, featureVariable, this.layer_),
          rotateWithView: Simple.getValue(options.label.rotate, featureVariable, this.layer_),
          scale: Simple.getValue(options.label.scale, featureVariable, this.layer_),
          offsetX: Simple.getValue(options.label.offset
            ? options.label.offset[0]
            : undefined, featureVariable, this.layer_),
          offsetY: Simple.getValue(options.label.offset
            ? options.label.offset[1]
            : undefined, featureVariable, this.layer_),
          fill: new OLStyleFill({
            color: Simple.getValue(options.label.color || '#000000', featureVariable, this.layer_),
          }),
          textAlign: Object.values(Align).includes(align) ? align : 'center',
          textBaseline: Object.values(Baseline).includes(baseline) ? baseline : 'top',
          text: textLabel === undefined ? undefined : String(textLabel),
          rotation: Simple.getValue(options.label.rotation, featureVariable, this.layer_),
        });
        if (!isNullOrEmpty(options.label.stroke)) {
          const { miterlimit, linedashoffset } = options.label.stroke;
          labelText.setStroke(new OLStyleStroke({
            color: Simple.getValue(options.label.stroke.color, featureVariable, this.layer_),
            width: Simple.getValue(options.label.stroke.width, featureVariable, this.layer_),
            lineCap: Simple.getValue(options.label.stroke.linecap, featureVariable, this.layer_),
            lineJoin: Simple.getValue(options.label.stroke.linejoin, featureVariable, this.layer_),
            lineDash: Simple.getValue(options.label.stroke.linedash, featureVariable, this.layer_),
            lineDashOffset: Simple.getValue(linedashoffset, featureVariable, this.layer_),
            miterLimit: Simple.getValue(miterlimit, featureVariable, this.layer_),
          }));
        }
        style.setText(labelText);
      }

      let radius = Simple.getValue(options.radius, featureVariable, this.layer_);
      if (isArray(options.radius)) {
        const func = (f, map) => {
          const auxZoom = map.getZoom();
          let col = options.radius.find((element) => element.zoom === auxZoom);
          if (isUndefined(col)) {
            col = options.radius.find((element) => element.zoom === 'default');
          }
          return col ? col.value : 5;
        };
        radius = Simple.getValue(func, featureVariable, this.layer_);
      }

      style.setImage(new PointCircle({
        fill,
        stroke,
        radius,
      }));
      if (!isNullOrEmpty(options.icon)) {
        if (!isNullOrEmpty(options.icon.src)) {
          styleIcon.setImage(new PointIcon({
            anchor: Simple.getValue(options.icon.anchor, featureVariable, this.layer_),
            anchorXUnits: Simple.getValue(options.icon.anchorxunits, featureVariable, this.layer_),
            anchorYUnits: Simple.getValue(options.icon.anchoryunits, featureVariable, this.layer_),
            src: Simple.getValue(options.icon.src, featureVariable, this.layer_),
            opacity: Simple.getValue(options.icon.opacity, featureVariable, this.layer_),
            scale: Simple.getValue(options.icon.scale, featureVariable, this.layer_),
            rotation: Simple.getValue(options.icon.rotation, featureVariable, this.layer_),
            rotateWithView: Simple.getValue(options.icon.rotate, featureVariable, this.layer_),
            offsetOrigin: Simple.getValue(options.icon.offsetorigin, featureVariable, this.layer_),
            offset: Simple.getValue(options.icon.offset, featureVariable, this.layer_),
            crossOrigin: Simple.getValue(options.icon.crossorigin, featureVariable, this.layer_),
            anchorOrigin: Simple.getValue(options.icon.anchororigin, featureVariable, this.layer_),
            size: Simple.getValue(options.icon.size, featureVariable, this.layer_),
          }));
        } else if (!isNullOrEmpty(options.icon.form)) {
          styleIcon.setImage(new PointFontSymbol({
            form: isNullOrEmpty(Simple.getValue(options.icon.form, featureVariable, this.layer_)) ? '' : Simple.getValue(options.icon.form, featureVariable, this.layer_).toLowerCase(),
            gradient: Simple.getValue(options.icon.gradient, featureVariable, this.layer_),
            glyph: Simple.getValue(options.icon.class, featureVariable, this.layer_),
            fontSize: Simple.getValue(options.icon.fontsize, featureVariable, this.layer_),
            radius: Simple.getValue(options.icon.radius, featureVariable, this.layer_),
            rotation: Simple.getValue(options.icon.rotation, featureVariable, this.layer_),
            rotateWithView: Simple.getValue(options.icon.rotate, featureVariable, this.layer_),
            fill: new OLStyleFill({
              color: Simple.getValue(options.icon.fill !== undefined ? options.icon.fill : '#FFFFFF', featureVariable, this.layer_),
            }),
            stroke: options.icon.color ? new OLStyleStroke({
              color: Simple.getValue(options.icon.color, featureVariable, this.layer_),
              width: 1,
            }) : undefined,
            opacity: Simple.getValue(options.icon.opacity, featureVariable, this.layer_),
            offset: Simple.getValue(options.icon.offset, featureVariable, this.layer_),
            // color: ¿No enviado?
          }));
        }
      }
      return [style, styleIcon];
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
  drawGeometryToCanvas(vectorContext, auxOlStyle) {
    const auxOlStyleFn = auxOlStyle || this.olStyleFn_();
    if (auxOlStyleFn[1].getImage() instanceof OLStyleFontsSymbol) {
      vectorContext.drawGeometry(new OLGeomPoint([10, 10]));
    } else {
      const auxCanvasSize = this.getCanvasSize(auxOlStyleFn[1].getImage());
      vectorContext.drawCircle(new OLGeomCircle([auxCanvasSize[0] / 2,
        auxCanvasSize[1] / 2,
      ], this.getRadius_(auxOlStyleFn[0].getImage())));
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
    if (options.icon && (options.icon.fill || options.icon.stroke) && options.icon.src
      && typeof options.icon.src === 'string' && options.icon.src.endsWith('.svg')) {
      modifySVG(options.icon.src, options).then(() => {
        this.updateCanvas(canvas);
      });
    } else {
      this.updateFacadeOptions(options);
      if (!isDynamic(options)) {
        const auxOlStyleFn = this.olStyleFn_();
        const oneExist = !isNullOrEmpty(auxOlStyleFn[1]); // Should always exist
        const canvasSize = this.getCanvasSize(oneExist
          ? auxOlStyleFn[1].getImage()
          : undefined);
        const vectorContext = toContextRender(canvas.getContext('2d'), {
          size: canvasSize,
        });
        let applyStyle = auxOlStyleFn[0];
        if (!isNullOrEmpty(applyStyle.getText())) {
          applyStyle.setText(null);
        }
        if (oneExist && auxOlStyleFn[1].getImage() instanceof OLStyleFontsSymbol) {
          applyStyle = auxOlStyleFn[1];
        }
        const stroke = applyStyle.getImage().getStroke();
        if (!isNullOrEmpty(stroke) && !isNullOrEmpty(stroke.getWidth())) {
          stroke.setWidth(3);
        }
        vectorContext.setStyle(applyStyle);
        this.drawGeometryToCanvas(vectorContext, auxOlStyleFn);
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
  getCanvasSize(defaultImage) {
    const image = defaultImage || this.olStyleFn_()[1].getImage();
    let size;
    if (image instanceof OLStyleFontsSymbol) {
      size = [90, 90];
    } else {
      const radius = (this.getRadius_(image) * 2) + 4;
      size = [radius, radius];
    }
    return size;
  }

  /**
   * Este método devuelve el radio de una imagen.
   *
   * @public
   * @function
   * @param {object} image OLStyleIcon (ol/style/Icon) o OLStyleFontsSymbol (ol/style/RegularShape).
   * @api stable
   */
  getRadius_(image) {
    let r;
    if (image instanceof OLStyleIcon) {
      r = 25;
    } else if (image instanceof OLStyleFontsSymbol) {
      r = image.getRadius();
    } else {
      r = this.olStyleFn_()[0].getImage().getRadius();
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
  const defs = OLStyleFontsSymbol.defs.fonts;
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
  const glyphs = OLStyleFontsSymbol.defs.glyphs;
  Object.entries(glyphs).forEach((elm) => {
    if (elm[1].font === name) {
      icons.push(elm[0]);
    }
  });
  return icons;
};

export default Point;
