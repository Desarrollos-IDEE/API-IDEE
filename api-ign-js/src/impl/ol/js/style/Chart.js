/**
 * @module M/impl/style/Chart
 */
import { isNullOrEmpty, isObject } from 'M/util/Utils';
import * as Align from 'M/style/Align';
import FacadeChart from 'M/style/Chart';
import OLFeature from 'ol/Feature';
import OLStyleStroke from 'ol/style/Stroke';
import OLGeomPoint from 'ol/geom/Point';
import OLStyleText from 'ol/style/Text';
import OLStyleFill from 'ol/style/Fill';
import OLStyle from 'ol/style/Style';
// import OLStyleIcon from 'ol/style/Icon';
import * as Baseline from 'M/style/Baseline';
import OLChart from '../olchart/OLChart';
import StyleCentroid from './Centroid';
import Feature from './Feature';
import Simple from './Simple';
import Utils from '../util/Utils';

/**
 * "Hook" para asignar objetos.
 * Fusiona la matriz de objetos de origen en el objeto de destino.
 * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
 * @function
 * @param {object} targetVar Objetivo
 * @param {object|Array<object>} sourceObs Matriz con la fuente.
 * @return {object} Objeto resultante.
 * @public
 * @api
 */
export const extend = (targetVar, ...sourceObs) => {
  const target = targetVar;
  if (target == null) { // TypeError if undefined or null
    throw new TypeError('Cannot convert undefined or null to object');
  }

  const to = Object(target);
  sourceObs.filter((source) => source != null).forEach((source) => Object.keys(source)
    .forEach((sourceKey) => {
      if (Object.prototype.hasOwnProperty.call(source, sourceKey)
        && !Object.prototype.hasOwnProperty.call(target, sourceKey)) {
        target[sourceKey] = source[sourceKey];
      }
    }));
  return to;
};

/**
 * Esta función devuelve el "label.text" de los objetos geográficos.
 * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
 * @function
 * @param {object} label Texto para "Style.Simple".
 * @param {object} feature Objeto geográfico.
 * @param {object} styleOptions Estilo para el label.
 * @param {object} dataValue Valor para el label.
 * @return {object} Texto resultante.
 * @public
 * @api
 */
export const getTextData = (label, feature, styleOptions, dataValue) => {
  let text;
  if (typeof label.text === 'function') {
    text = label.text(dataValue, styleOptions.data, feature);
  } else {
    text = `${Simple.getValue(label.text, feature)}` || '';
  }
  text = text === '0' ? '' : text;
  return text;
};

/**
 * Esta función genera el gráfico de barras con opciones.
 * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
 * @function
 * @param {Array} stylesParam Parámetros para poner estilos.
 * @param {object} styleOptions Opciones para poner estilos.
 * @param {object} feature Objetos geográficos.
 * @return {object} Gráfico de barras.
 * @public
 * @api
 */
export const generateTextBarChart = (stylesParam, styleOptions, feature) => {
  // let height = 0;
  let acumSum = null;
  const variables = styleOptions.variables;
  const auxCondition = variables.length === styleOptions.data.length;
  const textSpacing = 6;
  const styles = stylesParam.concat(styleOptions.data.map((dataValue, i) => {
    const variable = auxCondition ? variables[i] : variables[0];
    if (!variable.label) {
      return null;
    }
    const label = variable.label || {};
    const text = getTextData(label, feature, styleOptions, dataValue);
    const font = Simple.getValue(label.font, feature);
    const fontCondition = /^([1-9])[0-9]*px ./.test(font);
    const sizeFont = fontCondition ? Number.parseInt(font, 10) : 12;
    const fontAndSpace = sizeFont + textSpacing;
    if (isNullOrEmpty(acumSum)) {
      acumSum = styleOptions.radius - textSpacing;
    } else {
      acumSum -= fontAndSpace;
    }
    // height += fontAndSpace;
    const offsetX = styleOptions.offsetX - (styleOptions.radius + textSpacing) || 0;
    return new StyleCentroid({
      text: new OLStyleText({
        text: typeof text === 'string' ? `${text}` : '',
        offsetX,
        offsetY: acumSum - styleOptions.offsetY || 0,
        textAlign: 'end',
        textBaseline: 'middle',
        rotateWithView: false,
        stroke: label.stroke ? new OLStyleStroke({
          color: Simple.getValue(label.stroke.color, feature) || '#000',
          width: Simple.getValue(label.stroke.width, feature) || 1,
        }) : undefined,
        font: fontCondition ? font : `${sizeFont}px ${font}`,
        scale: typeof label.scale === 'number' ? Simple.getValue(label.scale, feature) : undefined,
        fill: new OLStyleFill({
          color: Simple.getValue(label.fill, feature) || '#000',
        }),
      }),
    });
  }));
  const filteredStyles = styles.filter((style) => style != null);
  /* / Old transparent white background for text area
  height = Math.max(height, 1);
  const anchorX = styleOptions.offsetX - styleOptions.radius;
  const anchorY = -styleOptions.offsetY + styleOptions.radius;
  const style0Width = styles[0].getImage().getImage().width / 2;
  const backgroundText = new OLStyleIcon(({
    anchor: [anchorX, anchorY],
    anchorOrigin: 'bottom-right',
    offsetOrigin: 'bottom-left',
    anchorXUnits: 'pixels',
    anchorYUnits: 'pixels',
    rotateWithView: false,
    src: `data:image/svg+xml;base64,${window.btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="${stylesParam[0].getImage()
      .getImage().width / 2}" height="${height}"><rect width="${style0Width}" height="${height
    }" fill="rgba(255, 255, 255, 0.75)" stroke-width="0" stroke="rgba(0, 0, 0, 0.34)"/></svg>`)}`,
    size: [style0Width, height],
  }));
  filteredStyles.push(new OLStyle({
    image: backgroundText,
  })); // */
  return filteredStyles;
};

/**
 * Esta función genera el gráfico circular con opciones.
 * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
 * @function
 * @param {Array} stylesParam Parámetros para poner estilos.
 * @param {object} styleOptions Opciones para poner estilos.
 * @param {object} feature Objetos geográficos.
 * @return {object} Gráfico circular.
 * @public
 * @api
 */
export const generateTextCircleChart = (stylesParam, styleOptions, feature) => {
  let acumSum = 0;
  const data = styleOptions.data;
  const sum = data.reduce((tot, curr) => tot + curr);
  const variables = styleOptions.variables;
  const auxCondition = variables.length === data.length;
  const styles = stylesParam.concat(data.map((dataValue, i) => {
    const variable = auxCondition ? variables[i] : variables[0];
    if (!variable.label) {
      return null;
    }
    const label = variable.label || {};
    const radius = label.radius ? label.radius : styleOptions.radius;
    const angle = (((((2 * acumSum) + dataValue) / sum)) - 0.5) * Math.PI; // 0.5 is 90º offset
    acumSum += dataValue;
    const radiusIncrement = typeof label.radiusIncrement === 'number' ? label.radiusIncrement : 3;
    let textAlign = typeof label.textAlign === 'function' ? label.textAlign(angle) : null;
    if (isNullOrEmpty(textAlign)) {
      textAlign = label.textAlign || (angle < Math.PI / 2 ? 'left' : 'right');
    }
    const text = getTextData(label, feature, styleOptions, dataValue);
    const font = Simple.getValue(label.font, feature);
    const olFill = new OLStyleFill({
      color: Simple.getValue(label.fill, feature) || '#000',
    });
    const arcPositionX = typeof label.offsetX === 'number'
      ? Simple.getValue(label.offsetX, feature)
      : Math.cos(angle) * (radius + radiusIncrement) + styleOptions.offsetX || 0;
    const arcPositionY = typeof label.offsetY === 'number'
      ? Simple.getValue(label.offsetY, feature)
      : Math.sin(angle) * (radius + radiusIncrement) - styleOptions.offsetY || 0;
    const olText = new OLStyleText({
      text: typeof text === 'string' ? `${text}` : '',
      offsetX: arcPositionX,
      offsetY: arcPositionY,
      textAlign: Simple.getValue(textAlign, feature),
      textBaseline: Simple.getValue(label.textBaseline, feature) || 'middle',
      stroke: label.stroke ? new OLStyleStroke({
        color: Simple.getValue(label.stroke.color, feature) || '#000',
        width: Simple.getValue(label.stroke.width, feature) || 1,
      }) : undefined,
      font: /^([1-9])[0-9]*px ./.test(font) ? font : `12px ${font}`,
      scale: typeof label.scale === 'number' ? Simple.getValue(label.scale, feature) : undefined,
      fill: olFill,
    });
    return new StyleCentroid({
      text: olText,
    });
  }));
  const filteredStyles = styles.filter((style) => style != null);
  return filteredStyles;
};

/**
 * Esta función agrega el texto de estilo a la matriz de estilos.
 * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
 * @function
 * @param {Array} options Opciones.
 * @param {object} styles Estilos.
 * @param {object} feature Objetos geográficos.
 * @return {object} Gráfico circular.
 * @public
 */
export const addTextChart = (options, styles, feature) => {
  if (!isNullOrEmpty(options.label)) {
    const styleLabel = new OLStyle();
    const textLabel = Simple.getValue(options.label.text, feature);
    const align = Simple.getValue(options.label.align, feature);
    const baseline = Simple.getValue(options.label.baseline, feature);
    const offsetX = options.label.offset ? options.label.offset[0] : undefined;
    const offsetY = options.label.offset ? options.label.offset[1] : undefined;
    const fill = new OLStyleFill({
      color: Simple.getValue(options.label.color || '#000000', feature),
    });
    const labelText = new OLStyleText({
      font: Simple.getValue(options.label.font, feature),
      rotateWithView: Simple.getValue(options.label.rotate, feature),
      scale: Simple.getValue(options.label.scale, feature),
      offsetX: Simple.getValue(offsetX, feature),
      offsetY: Simple.getValue(offsetY, feature),
      fill,
      textAlign: Object.values(Align).includes(align) ? align : 'center',
      textBaseline: Object.values(Baseline).includes(baseline) ? baseline : 'top',
      text: textLabel === undefined ? undefined : String(textLabel),
      rotation: Simple.getValue(options.label.rotation, feature),
    });
    if (!isNullOrEmpty(options.label.stroke)) {
      labelText.setStroke(new OLStyleStroke({
        color: Simple.getValue(options.label.stroke.color, feature),
        width: Simple.getValue(options.label.stroke.width, feature),
        lineCap: Simple.getValue(options.label.stroke.linecap, feature),
        lineJoin: Simple.getValue(options.label.stroke.linejoin, feature),
        lineDash: Simple.getValue(options.label.stroke.linedash, feature),
        lineDashOffset: Simple.getValue(options.label.stroke.linedashoffset, feature),
        miterLimit: Simple.getValue(options.label.stroke.miterlimit, feature),
      }));
    }
    styleLabel.setText(labelText);
    styles.push(styleLabel);
  }
};

/**
 * @classdesc
 * Implementación de Openlayers del gráfico de estilo.
 * @api
 */
class Chart extends Feature {
  /**
  * Constructor principal de la clase.
  * @constructor
  * @param {Mx.ChartOptions} options. Opciones de la clase.
  *  - type: El tipo de gráfico.
  *  - radius: El radio del grafíco circular. Si el tipo de gráfico es 'barra',
  * escriba este campo limitando la altura máxima de la barra.
  *  - offsetX: Desplazamiento del eje x del gráfico.
  *  - offsetY: Desplazamiento del eje y del gráfico.
  *  - stroke.
  *      - color: El color del trazo del gráfico.
  *      - width: El ancho del trazo del gráfico.
  *  - fill3DColor: El color de relleno del cilindro PIE_3D
  *  - scheme: Color del esquema.
  *  - rotateWithView: Determinar si el simbolizador rota con el mapa.
  *  - variables: Valores de la clase.
  *
  * @implements {M.impl.style.Simple}
  * @api
  */
  constructor(options = {}) {
    // merge default values
    extend(options, FacadeChart.DEFAULT);
    super(options);

    /**
     * Variables de estilo.
     * @private
     * @type {Array<M.style.chart.Variable>}
     */
    this.variables_ = options.variables || [];

    /**
     * Esquema de colores
     * @private
     * @type {Array<string>}
     */
    this.colorsScheme_ = options.scheme || [];
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
    if (!isNullOrEmpty(canvas)) {
      const context = canvas.getContext('2d');
      this.drawGeometryToCanvas(context);
    }
  }

  /**
   * Este método dibuja la geometría en el "canvas".
   *
   * @public
   * @function
   * @param {Object} vectorContext Vector que se dibujará en el "canvas".
   * @api stable
   */
  drawGeometryToCanvas(contextVar) {
    const context = contextVar;
    if (!isNullOrEmpty(context) && !isNullOrEmpty(context.canvas)) {
      const fixedProps = Chart.CANVAS_PROPS.fixedProps;
      const width = Chart.CANVAS_PROPS.width;
      context.canvas.setAttribute('width', width);
      context.width = width;
      const drawStackActions = []; // canvas fn draw stack
      const percentages = {};
      Object.keys(Chart.CANVAS_PROPS.percentages).forEach((key) => {
        percentages[key] = width * (Chart.CANVAS_PROPS.percentages[key] / 100);
      });
      // initial x, y content padding
      let [x0, y0] = [percentages.left_right_content, fixedProps.top_content];
      const wrapText = (contextParam, initialPosition, text, maxWidth, lineHeight) => {
        const words = text.split(' ');
        let line = '';
        const x = initialPosition[0];
        let y = initialPosition[1];
        drawStackActions.push(((options) => {
          const buildCtx = options.context;
          buildCtx.font = `${options.fontSize}px ${options.fontFamily}`;
          buildCtx.strokeStyle = options.strokeColor;
          buildCtx.strokeWidth = options.strokeWidth;
          buildCtx.fillStyle = options.textColor;
        }).bind(this, {
          context,
          fontSize: fixedProps.font_size,
          fontFamily: fixedProps.font_family,
          strokeColor: fixedProps.text_stroke_color,
          strokeWidth: fixedProps.text_stroke_width,
          textColor: fixedProps.text_color,
        }));
        words.forEach((word, i) => {
          const metrics = context.measureText(`${line + word}`);
          if (metrics.width > maxWidth && i > 0) {
            drawStackActions.push(((buildCtx, lineVar, xVar, yVar) => {
              buildCtx.strokeText(lineVar, xVar, yVar);
              buildCtx.fillText(lineVar, xVar, yVar);
            }).bind(this, context, line, x, y));
            line = `${word} `;
            y += lineHeight;
          } else {
            line = `${line + word} `;
          }
        });
        drawStackActions.push(((buildCtx, lineVar, xVar, yVar) => {
          buildCtx.strokeText(lineVar, xVar, yVar);
          buildCtx.fillText(lineVar, xVar, yVar);
        }).bind(this, context, line, x, y));
        return [x, y];
      };
      const drawVariable = (initialPosition, text, color) => {
        let [x, y] = initialPosition;
        y += fixedProps.item_top_margin;
        drawStackActions.push(((options) => {
          const buildCtx = options.context;
          buildCtx.beginPath();
          buildCtx.strokeStyle = options.strokeColor;
          buildCtx.lineWidth = options.width;
          buildCtx.fillStyle = options.color;
          buildCtx.rect(options.x, options.y, options.rectSize, options.rectSize);
          buildCtx.closePath();
          buildCtx.stroke();
          buildCtx.fill();
        }).bind(this, {
          context,
          strokeColor: '#000',
          width: fixedProps.rect_border_width,
          color,
          x,
          y,
          rectSize: fixedProps.rect_size,
        }));
        x += percentages.item_side_margin + fixedProps.rect_size;
        y += (fixedProps.rect_size / 1.5);
        // y coord plus bottom padding
        const tmpImageY = y + fixedProps.item_top_margin;
        const textWidth = percentages.max_text_width;
        const textHeight = percentages.max_text_line_height;
        const textPosition = wrapText(context, [x, y], text, textWidth, textHeight);
        return [textPosition[0], (textPosition[1] > tmpImageY ? textPosition[1] : tmpImageY)];
      };
      this.variables_.forEach((variable, i) => {
        const label = !isNullOrEmpty(variable.legend) ? variable.legend : variable.attribute;
        const color = !isNullOrEmpty(variable.fillColor)
          ? variable.fillColor
          : (this.colorsScheme_[i % this.colorsScheme_.length] || this.colorsScheme_[0]);
        [x0, y0] = drawVariable([x0, y0], label, color);
        x0 = percentages.left_right_content;
      });
      y0 += fixedProps.top_content;
      context.canvas.setAttribute('height', y0);
      context.save();
      drawStackActions.forEach((drawAction) => drawAction());
      context.restore();
    }
  }

  /**
   * Este método actualiza las opciones de la fachada
   * (patrón estructural como una capa de abstracción con un patrón de diseño).
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @public
   * @param {object} optionsVar Opciones.
   * @function
   * @return {object} Opciones actualizadas.
   * @api stable
   */
  updateFacadeOptions(optionsVar) {
    const options = optionsVar;
    options.rotateWithView = false;

    this.olStyleFn_ = (featureVar, resolutionVar) => {
      let feature = featureVar;
      if (!(feature instanceof OLFeature)) {
        feature = this;
      }
      const styleOptions = this.formatDataRecursively_(options, feature);
      let data = [];
      // let variables = this.variables_.map
      this.variables_.forEach((variable) => {
        let featureData = feature.get(variable.attribute);
        // TODO revisar
        featureData = parseFloat(featureData);
        data = data.concat(featureData instanceof Array
          ? featureData
          : [featureData]).filter((fData) => fData != null);
      });

      if (data.length === 0) {
        throw new Error('cannot draw an empty data chart');
      }

      styleOptions.data = data;

      if (!isNullOrEmpty(options.stroke)) {
        styleOptions.stroke = new OLStyleStroke(options.stroke);
      }

      let styles = [new StyleCentroid({
        geometry: (olFeature) => {
          const center = Utils.getCentroid(olFeature.getGeometry());
          const centroidGeometry = new OLGeomPoint(center);
          return centroidGeometry;
        },
        image: new OLChart(styleOptions),
      })];

      if (styleOptions.type !== 'bar') {
        if (options.variables.length === 1 || options.variables.length === data.length) {
          styles = styles.concat(generateTextCircleChart(styles, styleOptions, feature));
        }
      } else if (styleOptions.type === 'bar') {
        styles = styles.concat(generateTextBarChart(styles, styleOptions, feature));
      }
      addTextChart(styleOptions, styles, feature);
      return styles;
    };
  }

  /**
   * Este método aplica estilo a la capa.
   * @public
   * @function
   * @param {M.layer.Vector} layer Capa.
   * @api stable
   */
  applyToLayer(layer) {
    // in this case, the style only must be applied to features, never to the layer
    layer.getFeatures().forEach(this.applyToFeature, this);
  }

  /**
   * Este método aplica estilo a los objetos geográficos.
   * @public
   * @function
   * @param {Object} feature Objeto geográfico.
   * @api stable
   */
  applyToFeature(feature) {
    const featureCtx = feature.getImpl().getOLFeature();
    featureCtx.setStyle(this.olStyleFn_);
  }

  /**
   * Convierte un solo objeto en un objeto de valores de características extraídos.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @param {object} options Objeto de opciones sin analizar.
   * @param {OLFeature} feature Objeto geográfico de Openlayers.
   * @return {object} Opciones analizadas con rutas reemplazadas con
   * valores de características.
   * @function
   * @public
   * @api stable
   */
  formatDataRecursively_(options, feature) {
    return Object.keys(options).reduce((tot, curr, i) => {
      let ob = tot;
      if (typeof tot !== 'object') {
        ob = {};
        if (typeof options[tot] !== 'object') {
          this.setVal(ob, options, tot, feature);
        }
      }
      this.setVal(ob, options, curr);
      return ob;
    });
  }

  /**
   * Método que modifica los valores de un objeto geográfico.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @param {object} ob Objeto.
   * @param {Array} opts Opciones.
   * @param {String} key "Key" del objeto.
   * @param {OLFeature} feature Objeto geográfico de Openlayers.
   * @return {object} Opciones analizadas con rutas reemplazadas con
   * valores de características.
   * @function
   * @public
   * @api stable
   */
  setVal(ob, opts, key, feature) {
    const obParam = ob;
    obParam[key] = Simple.getValue(opts[key], feature);
    if (isObject(opts[key]) && !(opts[key] instanceof Array)) {
      obParam[key] = this.formatDataRecursively_(opts[key], feature);
    }
  }
}

/**
 * Radio máximo del "canvas".
 * @const
 * @type {number}
 * @public
 * @api stable
 */
Chart.CANVAS_PROPS = {
  width: 200, // px
  percentages: {
    left_right_content: 5, // %
    item_side_margin: 5, // %
    max_text_width: 70, // %
  },
  fixedProps: {
    rect_border_width: 2,
    font_size: 10, // px
    font_family: 'sans-serif',
    text_stroke_color: '#fff',
    text_stroke_width: 1,
    text_color: '#000',
    top_content: 10, // px
    item_top_margin: 10, // px
    text_line_height: 15, // px
    rect_size: 15, // px
  },
};

export default Chart;
