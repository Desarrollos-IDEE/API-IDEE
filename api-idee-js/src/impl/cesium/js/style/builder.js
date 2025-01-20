/**
 * @module M/impl/style/builder
 */
import {
  isNullOrEmpty,
  // isFunction,
  isString,
  isUndefined,
  extend,
} from 'M/util/Utils';
import * as Align from 'M/style/Align';
import * as Baseline from 'M/style/Baseline';
import * as HeightReference from 'M/style/HeightReference';
import {
  BillboardGraphics,
  BoundingRectangle,
  Cartesian2,
  Color,
  Entity,
  GridMaterialProperty,
  HorizontalOrigin,
  ImageMaterialProperty,
  LabelGraphics,
  LabelStyle,
  PolylineOutlineMaterialProperty,
  VerticalOrigin,
  HeightReference as CesiumHeightReference,
} from 'cesium';
import PointFontSymbol from '../point/FontSymbol';
import Simple from './Simple';

/**
 * Esta función devuelve el relleno.
 * @public
 * @function
 *
 * @param {Object} options Opciones ("color" y "opacity").
 * @param {Object} featureVariable Objetos geográficos.
 * @param {Object} layer Capa.
 *
 * @return {Object} Devuelve el relleno.
 * @api stable
 */
export const getFill = (options, featureVariable, layer) => {
  let fill = { fill: false };
  if (!isNullOrEmpty(options.fill)) {
    const fillColorValue = Simple.getValue(options.fill.color, featureVariable, layer);
    let fillOpacityValue = Simple.getValue(options.fill.opacity, featureVariable, layer);
    if (!fillOpacityValue && fillOpacityValue !== 0) {
      fillOpacityValue = 1;
    }
    if (!isNullOrEmpty(fillColorValue)) {
      fill = {
        fill: true,
        material: Color.fromCssColorString(fillColorValue).withAlpha(fillOpacityValue),
      };
    }
  }
  return fill;
};

/**
 * Esta función devuelve el relleno de la línea con stroke.
 * @public
 * @function
 *
 * @param {Object} options Opciones ("color" y "opacity").
 * @param {Object} featureVariable Objetos geográficos.
 * @param {Object} layer Capa.
 *
 * @return {Object} Devuelve el relleno.
 * @api stable
 */
export const getLineFill = (options, featureVariable, layer, stroke) => {
  let fill;
  if (!isNullOrEmpty(options.fill)) {
    const fillColorValue = Simple.getValue(options.fill.color, featureVariable, layer);
    let fillOpacityValue = Simple.getValue(options.fill.opacity, featureVariable, layer);
    if (!fillOpacityValue && fillOpacityValue !== 0) {
      fillOpacityValue = 1;
    }
    const widthValue = Simple.getValue(options.fill.width, featureVariable, layer);

    if (!isNullOrEmpty(fillColorValue)) {
      let material = Color.fromCssColorString(fillColorValue).withAlpha(fillOpacityValue);
      if (!isNullOrEmpty(stroke) && !isUndefined(stroke)) {
        // eslint-disable-next-line no-param-reassign
        stroke.material.color = Color.fromCssColorString(fillColorValue)
          .withAlpha(fillOpacityValue);
        material = stroke.material;
      }
      fill = {
        material,
        width: widthValue,
      };
    }
  }
  return fill;
};

/**
 * Esta función devuelve el borde.
 *
 * @public
 * @function
 *
 * @param {Object} options Opciones ("color", "opacity", "width",
 * "lineDash", "lineDashOffset", "lineCap", "lineJoin" y "miterLimit").
 * @param {Object} featureVariable Objetos geográficos.
 * @param {Object} layer Capas.
 *
 * @return {Object} Devuelve el borde.
 * @api stable
 */
export const getStroke = (options, featureVariable, layer) => {
  let stroke = { outlineColor: Color.TRANSPARENT, outlineWidth: undefined };
  if (!isNullOrEmpty(options.stroke)) {
    const strokeColorValue = Simple.getValue(options.stroke.color, featureVariable, layer);
    let strokeOpacityValue = Simple.getValue(options.stroke.opacity, featureVariable, layer);
    if (!strokeOpacityValue && strokeOpacityValue !== 0) {
      strokeOpacityValue = 1;
    }
    if (!isNullOrEmpty(strokeColorValue)) {
      stroke = {
        outlineColor: Color.fromCssColorString(strokeColorValue).withAlpha(strokeOpacityValue),
        outlineWidth: Simple.getValue(options.stroke.width, featureVariable, layer) || 1,
      };
      if (!isUndefined(featureVariable.polygon)) {
        stroke.outline = true;
      }
    }
  }
  return stroke;
};

/**
 * Esta función devuelve el patrón del borde.
 *
 * @public
 * @function
 *
 * @param {Object} options Opciones ("color", "opacity", "width",
 * "size", "spacing", "image", "angle", "scale",
 * "offset" y "fill").
 * @param {Object} featureVariable Objetos geográficos.
 * @param {Object} layer Capas.
 *
 * @return {Object} Devuelve el borde.
 * @api stable
 */
export const getStrokePatern = (options, featureVariable, layer) => {
  return null;
};

/**
 * Esta función devuelve la etiqueta.
 *
 * @public
 * @function
 *
 * @param {Object} options Opciones ("text", "align", "baseline",
 * "font", "rotateWithView", "scale", "offsetX", "offsetY",
 * "fill", "textAlign", "textBaseline", "text" y "rotation").
 * @param {Object} featureVariable Objetos geográficos.
 * @param {Object} layer Capas.
 *
 * @return {Object} Devuelve la etiqueta.
 * @api stable
 */
export const getLabel = (options, featureVariable, layer) => {
  const DEFAULT_LABEL_COLOR = '#000';
  const DEFAULT_ALIGN = HorizontalOrigin.CENTER;
  const DEFAULT_BASELINE = VerticalOrigin.TOP;

  let label = {};
  if (options.label) {
    let labelText = {};
    const textLabel = Simple.getValue(options.label.text, featureVariable, layer);
    const align = Simple.getValue(options.label.align, featureVariable, layer);
    const baseline = Simple.getValue(options.label.baseline, featureVariable, layer);
    labelText = {
      font: Simple.getValue(options.label.font, featureVariable, layer) || '10px sans-serif',
      scale: Simple.getValue(options.label.scale, featureVariable, layer),
      pixelOffset: new Cartesian2(
        Simple.getValue(
          options.label.offset ? options.label.offset[0] : undefined,
          featureVariable,
          layer,
        ),
        Simple.getValue(
          options.label.offset ? options.label.offset[1] : undefined,
          featureVariable,
          layer,
        ),
      ),
      fillColor: Color.fromCssColorString(Simple.getValue(
        options.label.color || DEFAULT_LABEL_COLOR,
        featureVariable,
        layer,
      )),
      horizontalOrigin: Object.values(Align).includes(align)
        ? HorizontalOrigin[align.toUpperCase()] : DEFAULT_ALIGN,
      verticalOrigin: Object.values(Baseline).includes(baseline)
        ? VerticalOrigin[baseline.toUpperCase()] : DEFAULT_BASELINE,
      text: textLabel === undefined ? undefined : String(textLabel),
      style: LabelStyle.FILL,
    };
    if (!isNullOrEmpty(options.label.stroke)) {
      extend(labelText, {
        outlineColor: Color.fromCssColorString(
          Simple.getValue(options.label.stroke.color, featureVariable, layer) || '#000000',
        ),
        outlineWidth: Simple.getValue(options.label.stroke.width, featureVariable, layer) || 1,
        style: LabelStyle.FILL_AND_OUTLINE,
      }, true);
    }
    label = { label: new LabelGraphics(labelText) };
    label.label.disableDepthTestDistance = Number.POSITIVE_INFINITY;
  }
  return label;
};

/**
 * Esta función devuelve el icono.
 * @public
 * @const
 * @type {Object}
 * @api stable
 */
export const iconCache = {};

/**
 * Esta función devuelve el icono.
 *
 * @public
 * @function
 *
 * @param {Object} options Opciones ("anchor", "anchorXUnits", "anchorYUnits",
 * "src", "opacity", "scale", "rotation", "rotateWithView",
 * "snapToPixel", "offsetOrigin", "offset", "crossOrigin", "anchorOrigin"
 * y "size").
 * @param {Object} featureVariable Objetos geográficos.
 * @param {Object} layer Capas.
 *
 * @return {Object} Devuelve el icono.
 * @api stable
 */
export const getIconSrc = (options, featureVariable, layer) => {
  const anchor = Simple.getValue(options.icon.anchor, featureVariable, layer);
  const anchorXUnits = Simple.getValue(options.icon.anchorxunits, featureVariable, layer);
  const anchorYUnits = Simple.getValue(options.icon.anchoryunits, featureVariable, layer);
  const src = Simple.getValue(options.icon.src, featureVariable, layer);
  const opacity = Simple.getValue(options.icon.opacity, featureVariable, layer);
  const scale = Simple.getValue(options.icon.scale, featureVariable, layer);
  const rotation = Simple.getValue(options.icon.rotation, featureVariable, layer);
  const rotateWithView = Simple.getValue(options.icon.rotate, featureVariable, layer);
  const snapToPixel = Simple.getValue(options.icon.snaptopixel, featureVariable, layer);
  const offsetOrigin = Simple.getValue(options.icon.offsetorigin, featureVariable, layer);
  const offset = Simple.getValue(options.icon.offset, featureVariable, layer);
  const crossOrigin = Simple.getValue(options.icon.crossorigin, featureVariable, layer);
  const anchorOrigin = Simple.getValue(options.icon.anchororigin, featureVariable, layer);
  const size = Simple.getValue(options.icon.size, featureVariable, layer);

  const index = src + anchor + anchorXUnits + anchorYUnits + opacity
    + scale + rotation + rotateWithView + snapToPixel
    + offsetOrigin + offset + crossOrigin + anchorOrigin + anchorOrigin + size;
  let styleIcon = iconCache[index];

  if (!styleIcon) {
    const anchorOptions = ['bottom-left', 'bottom-right', 'top-left', 'top-right', 'center-left'];
    let origin = options.icon.anchororigin
      && anchorOptions.includes(options.icon.anchororigin)
      ? options.icon.anchororigin : 'top-left';
    origin = Simple.getValue(origin, featureVariable, layer).split('-');

    const baseline = origin[0] === 'top' ? 'bottom' : 'top';
    const align = origin[1] === 'left' ? 'right' : 'left';

    styleIcon = new BillboardGraphics({
      image: Simple.getValue(options.icon.src, featureVariable, layer),
      color: new Color(
        1.0,
        1.0,
        1.0,
        Simple.getValue(options.icon.opacity || 1, featureVariable, layer),
      ),
      scale: Simple.getValue(options.icon.scale, featureVariable, layer),
      rotation: Simple.getValue(
        options.icon.rotation ? -Number(options.icon.rotation) : 0,
        featureVariable,
        layer,
      ),
      imageSubRegion: !isNullOrEmpty(options.icon.offset) && !isNullOrEmpty(options.icon.size)
        ? new BoundingRectangle(
          Simple.getValue(options.icon.offset
            ? options.icon.offset[0] : undefined, featureVariable, layer),
          Simple.getValue(options.icon.offset
            ? options.icon.offset[1] : undefined, featureVariable, layer),
          Simple.getValue(options.icon.size
            ? options.icon.size[0] : undefined, featureVariable, layer),
          Simple.getValue(options.icon.size
            ? options.icon.size[1] : undefined, featureVariable, layer),
        ) : undefined,
      pixelOffset: new Cartesian2(
        Simple.getValue(options.icon.anchor
          ? options.icon.anchor[1] : undefined, featureVariable, layer),
        Simple.getValue(options.icon.anchor
          ? options.icon.anchor[0] : undefined, featureVariable, layer),
      ),
      verticalOrigin: Object.values(Baseline).includes(baseline) && options.icon.anchor
        ? VerticalOrigin[baseline.toUpperCase()] : VerticalOrigin.CENTER,
      horizontalOrigin: Object.values(Align).includes(align) && options.icon.anchor
        ? HorizontalOrigin[align.toUpperCase()] : HorizontalOrigin.CENTER,
      sizeInMeters: false,
    });
    iconCache[index] = styleIcon;
  }

  styleIcon.type = 'Image';
  return styleIcon;
};

/**
 * Esta función devuelve la forma del icono.
 *
 * @public
 * @function
 *
 * @param {Object} options Opciones ("form", "gradient", "glyph",
 * "fontSize", "radius", "rotation", "rotateWithView", "offsetX",
 * "offsetY", "fill", "stroke", "anchor", "anchorXUnits",
 * "anchorYUnits", "src", "opacity", "scale", "snapToPixel", "offsetOrigin",
 * "offset", "crossOrigin", "anchorOrigin" y "size").
 * @param {Object} featureVariable Objetos geográficos.
 * @param {Object} layer Capas.
 *
 * @return {Object} Devuelve la forma del icono.
 * @api stable
 */
export const getIconForm = (options, featureVariable, layer) => {
  const anchorOptions = ['bottom-left', 'bottom-right', 'top-left', 'top-right', 'center-left'];
  let anchorOrigin = options.icon.anchororigin
    && anchorOptions.includes(options.icon.anchororigin)
    ? options.icon.anchororigin : 'top-left';
  anchorOrigin = Simple.getValue(anchorOrigin, featureVariable, layer).split('-');

  const baseline = anchorOrigin[0] === 'top' ? 'bottom' : 'top';
  const align = anchorOrigin[1] === 'left' ? 'right' : 'left';

  const styleForm = new PointFontSymbol({
    form: isNullOrEmpty(Simple.getValue(options.icon.form, featureVariable, layer))
      ? '' : Simple.getValue(options.icon.form, featureVariable, layer).toLowerCase(),
    gradient: Simple.getValue(options.icon.gradient, featureVariable, layer),
    glyph: Simple.getValue(options.icon.class, featureVariable, layer),
    fontSize: Simple.getValue(options.icon.fontsize, featureVariable, layer),
    radius: Simple.getValue(options.icon.radius, featureVariable, layer),
    fill: Simple.getValue(options.icon.fill !== undefined ? options.icon.fill : '#FFFFFF', featureVariable, layer),
    stroke: options.icon.color ? {
      color: Simple.getValue(options.icon.color, featureVariable, layer),
      width: 1,
    } : undefined,
    offset: Simple.getValue(options.icon.offset, featureVariable, layer),
  });

  const canvas = styleForm.getImage();

  const styleIcon = new BillboardGraphics({
    image: canvas,
    scale: Simple.getValue(options.icon.scale, featureVariable, layer),
    sizeInMeters: false,
    rotation: Simple.getValue(
      options.icon.rotation ? -Number(options.icon.rotation) : 0,
      featureVariable,
      layer,
    ),
    pixelOffset: new Cartesian2(
      Simple.getValue(options.icon.anchor
        ? options.icon.anchor[1] : undefined, featureVariable, layer),
      Simple.getValue(options.icon.anchor
        ? options.icon.anchor[0] : undefined, featureVariable, layer),
    ),
    color: new Color(
      1.0,
      1.0,
      1.0,
      Simple.getValue(options.icon.opacity || 1, featureVariable, layer),
    ),
    verticalOrigin: Object.values(Baseline).includes(baseline) && options.icon.anchor
      ? VerticalOrigin[baseline.toUpperCase()] : VerticalOrigin.CENTER,
    horizontalOrigin: Object.values(Align).includes(align) && options.icon.anchor
      ? HorizontalOrigin[align.toUpperCase()] : HorizontalOrigin.CENTER,
    imageSubRegion: !isNullOrEmpty(options.icon.offset) && !isNullOrEmpty(canvas)
      ? new BoundingRectangle(
        Simple.getValue(options.icon.offset
          ? options.icon.offset[0] : undefined, featureVariable, layer),
        Simple.getValue(options.icon.offset
          ? options.icon.offset[1] : undefined, featureVariable, layer),
        Simple.getValue(canvas.height
          ? canvas.height : undefined, featureVariable, layer),
        Simple.getValue(canvas.width
          ? canvas.width : undefined, featureVariable, layer),
      ) : undefined,
  });
  styleIcon.type = 'PointFontSymbol';
  return styleIcon;
};

/**
 * Esta función devuelve el relleno.
 *
 * @public
 * @function
 *
 * @param {Object} options Opciones ("color", "width", "size",
 * "spacing", "image", "angle", "scale", "offset" y
 * "fill").
 * @param {Object} featureVariable Objetos geográficos.
 * @param {Object} layer Capas.
 *
 * @return {Object} Devuelve el relleno.
 * @api stable
 */
export const getFillPatern = (options, featureVariable, layer, fill) => {
  let color = 'rgba(0,0,0,1)';
  if (!isNullOrEmpty(options.fill.pattern.color)) {
    let opacity = Simple.getValue(options.fill.pattern.opacity, featureVariable, layer) || 1;
    if (!opacity && opacity !== 0) {
      opacity = 1;
    }
    color = Color.fromCssColorString(options.fill.pattern.color).withAlpha(opacity);
  }
  let style = {};

  const rotation = Simple.getValue(options.fill.pattern.rotation, featureVariable, layer);
  const pattern = (Simple.getValue(options.fill.pattern.name, featureVariable, layer) || '')
    .toLowerCase();

  if (pattern === 'image') {
    style = {
      stRotation: rotation,
      material: new ImageMaterialProperty({
        image: Simple.getValue(options.fill.pattern.src, featureVariable, layer),
        color,
      }),
    };
  } else if (fill.type !== 'line') {
    style = {
      stRotation: rotation,
      material: new GridMaterialProperty({
        color,
        lineThickness: new Cartesian2(
          Simple.getValue(options.fill.pattern.size, featureVariable, layer),
          Simple.getValue(options.fill.pattern.size, featureVariable, layer),
        ),
        lineOffset: new Cartesian2(
          Simple.getValue(options.fill.pattern.offset, featureVariable, layer),
          Simple.getValue(options.fill.pattern.offset, featureVariable, layer),
        ),
      }),
    };
  }
  return style;
};

/**
 * Esta función devuelve el trazo de la línea.
 *
 * @public
 * @function
 *
 * @param {Object} options Opciones ("color", "opacity" y "width").
 * @param {Object} featureVariable Objetos geográficos.
 * @param {Object} layer Capas.
 *
 * @return {Object} Devuelve el trazo de la línea.
 * @api stable
 */
export const getLineStroke = (options, featureVariable, layer) => {
  let lineStroke;
  if (!isNullOrEmpty(options.stroke)) {
    const strokeColorValue = Simple.getValue(options.stroke.color, featureVariable, layer);
    let strokeOpacityValue = Simple.getValue(options.stroke.opacity, featureVariable, layer);
    if (!strokeOpacityValue && strokeOpacityValue !== 0) {
      strokeOpacityValue = 1;
    }
    const widthValue = Simple.getValue(options.stroke.width, featureVariable, layer);
    if (!isNullOrEmpty(strokeColorValue)) {
      lineStroke = {
        material: new PolylineOutlineMaterialProperty({
          color: Color.fromCssColorString(strokeColorValue).withAlpha(strokeOpacityValue),
          outlineColor: Color.fromCssColorString(strokeColorValue).withAlpha(strokeOpacityValue),
          outlineWidth: widthValue || 1,
        }),
        width: widthValue,
      };
    }
  }
  return lineStroke;
};

/**
 * Esta función devuelve el texto de la línea.
 *
 * @public
 * @function
 *
 * @param {Object} options Opciones ("color", "width", "lineCap",
 * "lineJoin", "lineDash", "lineDashOffset" y "miterLimit").
 * @param {Object} featureVariable Objetos geográficos.
 * @param {Object} layer Capas.
 *
 * @return {Object} Devuelve el texto de la línea.
 * @api stable
 */
export const getLineText = (options, featureVariable, layer) => {
  const { label } = options;
  const LABEL_FILL_COLOR = '#000';
  const DEFAULT_ALIGN = HorizontalOrigin.CENTER;
  const DEFAULT_BASELINE = VerticalOrigin.TOP;

  let textPathStyle = {};
  if (!isNullOrEmpty(label)) {
    let labelText = {};
    const textLabel = Simple.getValue(label.text, featureVariable, layer);
    const align = Simple.getValue(label.align, featureVariable, layer);
    const baseline = Simple.getValue(label.baseline, featureVariable, layer);
    labelText = {
      text: textLabel === undefined ? undefined : String(textLabel),
      style: LabelStyle.FILL,
      font: Simple.getValue(label.font, featureVariable, layer) || '10px sans-serif',
      fillColor: Color.fromCssColorString(Simple.getValue(
        label.color || LABEL_FILL_COLOR,
        featureVariable,
        layer,
      )),
      horizontalOrigin: Object.values(Align).includes(align)
        ? HorizontalOrigin[align.toUpperCase()] : DEFAULT_ALIGN,
      verticalOrigin: Object.values(Baseline).includes(baseline)
        ? VerticalOrigin[baseline.toUpperCase()] : DEFAULT_BASELINE,
      scale: Simple.getValue(label.scale, featureVariable, layer),
      pixelOffset: new Cartesian2(
        Simple.getValue(options.label.offset
          ? options.label.offset[0] : undefined, featureVariable, layer),
        Simple.getValue(options.label.offset
          ? options.label.offset[1] : undefined, featureVariable, layer),
      ),
    };
    if (!isNullOrEmpty(label.stroke)) {
      extend(labelText, {
        outlineColor: Color.fromCssColorString(
          Simple.getValue(label.stroke.color, featureVariable, layer) || '#000000',
        ),
        outlineWidth: Simple.getValue(label.stroke.width, featureVariable, layer) || 1,
        style: LabelStyle.FILL_AND_OUTLINE,
      }, true);
    }
    textPathStyle = { label: new LabelGraphics(labelText) };
    label.disableDepthTestDistance = Number.POSITIVE_INFINITY;
  }
  return textPathStyle;
};

/**
 * Esta función devuelve verdadero si se utiliza la altura dada en las coordenadas
 * de la geometría, en caso contrario devuelve falso.
 *
 * @public
 * @function
 *
 * @param {Object} options Opciones.
 * @param {Object} featureVariable Objetos geográficos.
 * @param {Object} layer Capas.
 *
 * @return {Object} Objeto que indica si se utiliza o no la altura de las coordenadas
 * del polígono.
 * @api stable
 */
export const getPerPositionHeight = (options, featureVariable, layer) => {
  const opt = {};
  if (!isNullOrEmpty(options.perPositionHeight)) {
    const perPositionHeight = Simple.getValue(options.perPositionHeight, featureVariable, layer);
    opt.perPositionHeight = perPositionHeight;
  }
  return opt;
};

/**
 * Esta función devuelve la posición relativa al terreno.
 * Solo tendrá efecto si el parámetro height de la capa tiene valor.
 *
 * @public
 * @function
 *
 * @param {Object} options Opciones.
 * @param {Object} featureVariable Objetos geográficos.
 * @param {Object} layer Capas.
 *
 * @return {Object} Objeto que indica la posición relativa al terreno.
 * @api stable
 */
export const getHeightReference = (options, featureVariable, layer) => {
  const opt = { };
  if (!isNullOrEmpty(options.heightReference)) {
    const heightReference = Simple.getValue(
      options.heightReference,
      featureVariable,
      layer,
    );
    opt.heightReference = Object.values(HeightReference).includes(heightReference)
      ? CesiumHeightReference[heightReference] : CesiumHeightReference.NONE;
  }
  return opt;
};

/**
 * Esta función devuelve la extrusión del polígono.
 * Solo disponible para Cesium.
 *
 * @public
 * @function
 *
 * @param {Object} options Opciones.
 * @param {Object} featureVariable Objetos geográficos.
 * @param {Object} layer Capas.
 *
 * @return {Object} Devuelve la extrusión del polígono
 * @api stable
 */
export const getExtrudedHeight = (options, featureVariable, layer) => {
  const extruded = { };
  if (!isNullOrEmpty(options.extrudedHeight)) {
    const extrudedHeight = Simple.getValue(options.extrudedHeight, featureVariable, layer);

    if (featureVariable instanceof Entity && isString(extrudedHeight)
      && featureVariable.properties.hasProperty(extrudedHeight)) {
      extruded.extrudedHeight = featureVariable.properties[extrudedHeight];
    } else if (!isString(extrudedHeight)) {
      extruded.extrudedHeight = extrudedHeight;
    }
  }
  return extruded;
};

/**
 * Esta función devuelve la posición relativa al terreno de la extrusión del polígono.
 * Solo tendrá efecto si extrudedHeight tiene valor.
 *
 * @public
 * @function
 *
 * @param {Object} options Opciones.
 * @param {Object} featureVariable Objetos geográficos.
 * @param {Object} layer Capas.
 *
 * @return {Object} Objeto que indica la posición relativa al terreno de la extrusión del polígono.
 * @api stable
 */
export const getExtrudedHeightReference = (options, featureVariable, layer) => {
  const opt = { };
  if (!isNullOrEmpty(options.extrudedHeightReference)) {
    const extrudedHeightReference = Simple.getValue(
      options.extrudedHeightReference,
      featureVariable,
      layer,
    );
    opt.extrudedHeightReference = Object.values(HeightReference).includes(extrudedHeightReference)
      ? CesiumHeightReference[extrudedHeightReference] : CesiumHeightReference.NONE;
  }
  return opt;
};

/**
 * Esta función devuelve el estilo del punto.
 *
 * @public
 * @function
 *
 * @param {Object} options Opciones ("radius", "snapToPixel", "src",
 * "form", "label" y "heightReference").
 * @param {Object} featureVariable Objetos geográficos.
 * @param {Object} layer Capas.
 *
 * @return {Array} Devuelve el estilo del punto.
 * @api stable
 */
export const getPointStyle = (options, featureVariable, layer) => {
  const optionsVar = options || {};
  const heightReference = getHeightReference(optionsVar, featureVariable, layer);
  let fill = { color: Color.TRANSPARENT };
  if (!isNullOrEmpty(options.fill)) {
    const fillColorValue = Simple.getValue(options.fill.color, featureVariable, layer);
    let fillOpacityValue = Simple.getValue(options.fill.opacity, featureVariable, layer);
    if (!fillOpacityValue && fillOpacityValue !== 0) {
      fillOpacityValue = 1;
    }
    if (!isNullOrEmpty(fillColorValue)) {
      fill = {
        color: Color.fromCssColorString(fillColorValue).withAlpha(fillOpacityValue),
      };
    }
  }
  const stroke = getStroke(optionsVar, featureVariable, layer);
  const label = getLabel(optionsVar, featureVariable, layer);
  const pointStyle = {
    type: 'point',
    pixelSize: Simple.getValue(optionsVar.radius, featureVariable, layer) || 5,
  };

  if (!isNullOrEmpty(optionsVar.icon)) {
    let icon;

    const src = Simple.getValue(optionsVar.icon.src, featureVariable, layer);
    if (!isNullOrEmpty(src)) {
      icon = getIconSrc(optionsVar, featureVariable, layer);
      pointStyle.icon = icon;
    } else if (!isNullOrEmpty(optionsVar.icon.form)) {
      icon = getIconForm(optionsVar, featureVariable, layer);
      pointStyle.icon = icon;
    }
  }

  extend(pointStyle, {
    ...heightReference,
    ...fill,
    ...stroke,
    ...label,
  }, true);

  return [pointStyle];
};

/**
 * Esta función devuelve el estilo de la línea.
 *
 * @public
 * @function
 *
 * @param {Object} options Opciones ("fill").
 * @param {Object} featureVariable Objetos geográficos.
 * @param {Object} layer Capas.
 *
 * @return {Array} Devuelve el estilo de la línea.
 * @api stable
 */
export const getLineStyle = (options, featureVariable, layer) => {
  const optionsVar = options || {};

  const style = { type: 'line' };
  const stroke = getLineStroke(optionsVar, featureVariable, layer);
  const fill = getLineFill(optionsVar, featureVariable, layer, stroke);
  if (optionsVar.fill && !isNullOrEmpty(optionsVar.fill.pattern)) {
    fill.type = 'line';
    extend(fill, getFillPatern(optionsVar, featureVariable, layer, fill), true);
  }
  const label = getLineText(optionsVar, featureVariable, layer);

  if (!isNullOrEmpty(optionsVar.label)) {
    extend(style, {
      ...label,
    }, true);
  }

  extend(style, {
    ...stroke,
    ...fill,
  }, true);

  return [style];
};

/**
 * Esta función devuelve el estilo del polígono.
 *
 * @public
 * @function
 *
 * @param {Object} options Opciones ("fill", "stroke", "label", "extrudedHeight",
 * "extrudedHeightReference", "heightReference" y "perPositionHeight").
 * @param {Object} featureVariable Objetos geográficos.
 * @param {Object} layer Capas.
 *
 * @return {Array} Devuelve el estilo del polígono.
 * @api stable
 */
export const getPolygonStyle = (options, featureVariable, layer) => {
  const optionsVar = options || {};

  const style = { type: 'polygon' };
  const perPositionHeight = getPerPositionHeight(optionsVar, featureVariable, layer);
  const heightReference = getHeightReference(optionsVar, featureVariable, layer);
  const extrudedHeight = getExtrudedHeight(optionsVar, featureVariable, layer);
  const extrudedHeightReference = getExtrudedHeightReference(optionsVar, featureVariable, layer);
  const stroke = getStroke(optionsVar, featureVariable, layer);
  // if (optionsVar.stroke && !isNullOrEmpty(optionsVar.stroke.pattern)) {
  //   stroke = getStrokePatern(optionsVar, featureVariable, layer);
  // }
  const fill = getFill(optionsVar, featureVariable, layer);
  const label = getLabel(optionsVar, featureVariable, layer);

  // if (optionsVar.fill && !isNullOrEmpty(optionsVar.fill.pattern)) {
  //   fill = getFillPatern(optionsVar, featureVariable, layer, fill);
  // }

  extend(style, {
    ...perPositionHeight,
    ...heightReference,
    ...extrudedHeight,
    ...extrudedHeightReference,
    ...stroke,
    ...fill,
    ...label,
  }, true);

  return [style];
};

/**
 * Este comentario no se verá, es necesario incluir
 * una exportación por defecto para que el compilador
 * muestre las funciones.
 *
 * Esto se produce por al archivo normaliza-exports.js
 * @api stable
 */
export default {};
