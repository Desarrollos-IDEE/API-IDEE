/**
 * @module M/impl/OLChart
 */

import OLStyleRegularShape from 'ol/style/RegularShape';
import OLStyleFill from 'ol/style/Fill';
import { asString as colorAsString } from 'ol/color';
import Chart from 'M/style/Chart';
import * as chartTypes from 'M/chart/types';
import { isNullOrEmpty } from 'M/util/Utils';

/**
 * @classdesc
 * Estilo de gráfico para características vectoriales.
 *
 * @extends {ol.style.RegularShape}
 */
class OLChart extends OLStyleRegularShape {
  /**
   * Constructor principal de la clase. Crea un estilo de gráfico.
   * @constructor
   * @param {olx.style.FontSymbolOptions=} options Opciones:
   *  - type: El tipo de gráfico.
   *  - radius: Radio del gráfico.
   *  - rotation: Determinar si el simbolizador rota con el mapa.
   *  - snapToPixel: Determinar si el simbolizador debe ajustarse a un píxel.
   *  - stroke: Estilo del borde.
   *  - colors: Variedad de colores como cadena.
   *  - offsetX: Desplazamiento del eje x del gráfico.
   *  - offsetY: Desplazamiento del eje y del gráfico.
   *  - animation: Paso en una secuencia de animación [0,1].
   *  - variables: Las variables del gráfico.
   *  - donutRatio: La relación de tipo 'donut' del gráfico.
   *  - data: Datos del gráfico.
   *  - fill3DColor: El color de relleno.
   *  - displacement: Modifica el anchor.
   * @api
   */
  constructor(options = {}) {
    const strokeWidth = !isNullOrEmpty(options.stroke) ? options.stroke.getWidth() : 0;

    /**
     * Desplazamientos del eje del gráfico.
     * @private
     * @type {Array<number>}
     */
    const auxOffset = [
      options.offsetX ? options.offsetX : 0,
      options.offsetY ? options.offsetY : 0,
    ];

    // super call
    super({
      radius: (typeof options.radius === 'number' ? options.radius : 0) + strokeWidth,
      fill: new OLStyleFill({
        color: [0, 0, 0],
      }),
      rotation: (typeof options.rotation === 'number' ? options.rotation : 0),
      snapToPixel: (typeof options.snapToPixel === 'boolean' ? options.snapToPixel : false),
      displacement: auxOffset,
    });

    if (options.scale) {
      this.setScale(options.scale);
    }

    /**
     * Las variables del gráfico.
     * @private
     * @type {object|M.style.chart.Variable|string|Array<string>|Array<M.style.chart.Variable>}
     */
    this.variables_ = options.variables || [];

    /**
     * Estilo del borde.
     * @private
     * @type {ol.style.Stroke}
     */
    this.stroke_ = options.stroke || null;

    /**
     * Radio del gráfico.
     * @private
     * @type {number}
     */
    this.radius_ = options.radius || 0;

    /**
     * Relación de tipo de gráfico 'donut'.
     * @private
     * @type {number}
     */
    this.donutRatio_ = options.donutRatio || 0;

    /**
     * Tipo de gráfico.
     * @private
     * @type {string}
     */
    this.type_ = options.type || null;

    /**
     * Desplazamientos del eje del gráfico.
     * @private
     * @type {Array<number>}
     */
    this.offset_ = auxOffset;

    /**
     * Configuración de animación.
     * @private
     * @type {object}
     */
    this.animation_ = {
      animate: typeof options.animation === 'number',
      step: (typeof options.animation === 'number') ? options.animation : Chart.DEFAULT.animationStep,
    };

    /**
     * Datos del gráfico.
     * @private
     * @type {Array<number>}
     */
    this.data_ = options.data || null;

    /**
     * Colores.
     * @private
     * @type {Array<string>}
     */
    this.colors_ = options.scheme instanceof Array ? options.scheme : [];

    /**
     * Color de relleno.
     * @private
     * @type {string}
     */
    this.fill3DColor_ = options.fill3DColor || '#000';

    /**
     * Determina si el gráfico rota con el mapa.
     * @private
     * @type {bool}
     */
    this.rotateWithView_ = options.rotateWithView || false;

    // call to render and updated the ol.style.image canvas
    this.renderChart_();
  }

  /**
   * Clona el gráfico.
   * @public
   * @function
   * @returns {ol.chart}
   * @api stable
   */
  clone() {
    const newInstance = new OLChart({
      type: this.type_,
      radius: this.radius_,
      colors: this.colors_,
      rotation: this.getRotation(),
      scale: this.getScale(),
      // data: this.getData(),
      donutRatio: this.donutRatio_,
      data: this.data_,
      stroke: this.stroke_,
      scheme: this.colors_,
      offsetX: this.offset_[0],
      offsetY: this.offset_[1],
      animation: this.animation_,
      fill3DColor: this.fill3DColor_,
      rotateWithView: this.rotateWithView_,
    });
    newInstance.setScale(this.getScale());
    newInstance.setOpacity(this.getOpacity());
    return newInstance;
  }

  /**
   * Devuelve los datos del gráfico.
   * @public
   * @function
   * @returns {Object}
   * @api stable
   */
  get data() {
    return this.data_;
  }

  /**
   * Sobreescritura los datos del gráfico.
   * @public
   * @function
   * @param {Object} data Datos del gráfico.
   * @api stable
   */
  set data(data) {
    this.data_ = data;
    this.renderChart_();
  }

  /**
   * Devuelve el radio del gráfico.
   * @public
   * @function
   * @returns {number}
   * @api stable
   */
  get radius() {
    return this.radius_;
  }

  /**
   * Sobrescribe el radio del gráfico.
   * @public
   * @function
   * @param {number} radius Radio del gráfico.
   * @api stable
   */
  set radius(radius) {
    this.radius_ = radius;
    this.renderChart_();
  }

  /**
   * Sobrescribe de tipos de relación de donut y radio.
   * @public
   * @function
   * @param {number} radius Radio del gráfico.
   * @param {number} ratio Relación de donut.
   * @api stable
   */
  setRadius(radius, ratio) {
    this.donutRatio_ = ratio || this.donutRatio_;
    this.radius = radius;
  }

  /**
   * Establece el paso de animación.
   * @public
   * @function
   * @param {number} step Paso de animación.
   * @api stable
   */
  setAnimation(step) {
    if (step === false) {
      if (this.animation_.animate === false) {
        return;
      }
      this.animation_.animate = false;
    } else {
      if (this.animation_.step === step) {
        return;
      }
      this.animation_.animate = true;
      this.animation_.step = step;
    }
    this.renderChart_();
  }

  /**
   * Suma de verificación.
   * @public
   * @function
   * @returns {string} Suma de verificación.
   * @api stable
   */
  getChecksum() {
    let fillChecksum;
    const strokeChecksum = (this.stroke_ !== null) ? this.stroke_.getChecksum() : '-';
    const recalculate = (this.checksums_ === null)
      || (strokeChecksum !== this.checksums_[1])
      || (fillChecksum !== this.checksums_[2])
      || (this.radius_ !== this.checksums_[3])
      || (this.data_.join('|') !== this.checksums_[4]);

    if (recalculate) {
      const radiusCheck = this.radius_ ? this.radius_.toString() : '-';
      const checksum = `c${strokeChecksum}${fillChecksum}${radiusCheck}${this.data_.join('|')}`;
      this.checksums_ = [checksum, strokeChecksum, fillChecksum, this.radius_, this.data_.join('|')];
    }
    return this.checksums_[0];
  }

  /**
   * Representa el gráfico.
   * Este método es una devolución de llamada de evento
   * de poscomposición de capa.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @function
   * @public
   */
  renderChart_(atlasManager) {
    switch (this.type_) {
      case chartTypes.types.DONUT:
      case chartTypes.types.PIE_3D:
      case chartTypes.types.PIE:
        this.renderCircleChart();
        break;
      default:
        this.renderBarChart();
        break;
    }
  }

  /**
   * Este método dibuja el gráfico de barras.
   * @public
   * @function
   * @api stable
   */
  renderBarChart() {
    const canvas = this.getImage(1);
    const context = canvas.getContext('2d');
    let strokeStyle;
    let strokeWidth = 0;
    const step = this.animation_.animate ? this.animation_.step : 1;
    if (this.stroke_) {
      strokeStyle = colorAsString(this.stroke_.getColor());
      strokeWidth = this.stroke_.getWidth();
    }
    const max = Math.max.apply(null, this.data_) || 0;
    const start = Math.min(5, (2 * this.radius_) / this.data_.length);
    const border = canvas.width - (strokeWidth || 0);
    let x;
    let x0 = ((this.data_.length * start) / 2) - start;
    if (strokeStyle) {
      context.strokeStyle = strokeStyle;
      context.lineWidth = strokeWidth;
    }
    this.data_.forEach((data, i) => { // .sort((num, numNext) => num - numNext)
      context.beginPath();
      context.fillStyle = this.colors_[i];
      x = x0 - start;
      const height = (data / max) * 2 * this.radius_ * step;
      context.rect(-border / 2, x0, height, start);
      context.closePath();
      context.fill();
      if (strokeStyle) {
        context.stroke();
      }
      x0 = x;
    });
  }

  /**
   * Este método dibuja el gráfico circular: "pie", "pie3d" y "donut".
   * @function
   * @public
   * @api stable
   */
  renderCircleChart() {
    let strokeStyle;
    let strokeWidth = 0;

    if (this.stroke_) {
      strokeStyle = colorAsString(this.stroke_.getColor());
      strokeWidth = this.stroke_.getWidth();
    }

    const canvas = this.getImage(1);
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.lineJoin = 'round';

    let sum = 0;
    if (!isNullOrEmpty(this.data_) && this.data_.length > 0) {
      sum = this.data_.reduce((tot, curr) => tot + curr);
    }
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.translate(0, 0);

    const step = this.animation_.animate ? this.animation_.step : 1;
    const angle0 = Math.PI * (step - 1.5);
    const center = canvas.width / 2;
    if (strokeStyle) {
      context.strokeStyle = strokeStyle;
      context.lineWidth = strokeWidth;
    }
    context.save();
    if (this.type_ === chartTypes.types.PIE_3D) {
      this.drawPie3D(context, angle0, center, step, strokeStyle, sum);
    } else if (this.type_ === chartTypes.types.DONUT) {
      this.drawDonut(context, angle0, center, step, strokeStyle, strokeWidth, sum);
    } else {
      this.drawPie(context, angle0, center, step, strokeStyle, sum);
    }
    context.restore();
  }

  /**
   * Este método dibuja el gráfico de anillos.
   * @function
   * @public
   * @param {CanvasRenderingContext2D} contextParam Contexto del canvas.
   * @param {number} angle0Param Ángulo inicial.
   * @param {number} center Centro del gráfico.
   * @param {number} step Paso de la animación.
   * @param {string} strokeStyle Estilo del borde.
   * @param {number} strokeWidth Ancho del borde.
   * @param {number} sum Suma de los datos.
   *
   * @api stable
   */
  drawDonut(contextParam, angle0Param, center, step, strokeStyle, strokeWidth, sum) {
    const context = contextParam;
    context.save();
    context.beginPath();
    context.rect(0, 0, 2 * center, 2 * center);
    context.arc(center, center, this.radius_ * step * this.donutRatio_, 0, 2 * Math.PI);
    context.clip('evenodd');
    const angle0 = this.drawPie(context, angle0Param, center, step, strokeStyle, sum);
    context.restore();
    context.beginPath();
    context.strokeStyle = strokeStyle;
    context.lineWidth = strokeWidth;
    const r = this.radius_;
    context.arc(center, center, r * step * this.donutRatio_, Math.PI * (step - 1.5), angle0);
    if (strokeStyle) {
      context.stroke();
    }
  }

  /**
   * Este método dibuja el gráfico circular 3D.
   * @function
   * @public
   * @param {CanvasRenderingContext2D} contextParam Contexto del "canvas".
   * @param {number} angle0Param Ángulo inicial.
   * @param {number} center Centro del gráfico.
   * @param {number} step Paso de la animación.
   * @param {string} strokeStyle Estilo del borde.
   * @param {number} sum Suma de los datos.
   * @api stable
   */
  drawPie3D(contextParam, angle0Param, center, step, strokeStyle, sum) {
    const context = contextParam;
    context.translate(0, center * 0.3);
    context.scale(1, 0.7);
    context.beginPath();
    context.fillStyle = this.fill3DColor_;
    context.arc(center, center * 1.4, this.radius_ * step, 0, 2 * Math.PI);
    context.fill();
    if (strokeStyle) {
      context.stroke();
    }
    this.drawPie(contextParam, angle0Param, center, step, strokeStyle, sum);
  }

  /**
   * Esta función dibuja el gráfico circular.
   * @function
   * @public
   * @param {CanvasRenderingContext2D} contextParam Contexto del "canvas".
   * @param {number} angle0Param Ángulo inicial.
   * @param {number} center Centro del gráfico.
   * @param {number} step Paso de la animación.
   * @param {string} strokeStyle Estilo del borde.
   * @param {number} sum Suma de los datos.
   * @api stable
   * @returns {number} Devuelve el ángulo final.
   */
  drawPie(contextParam, angle0Param, center, step, strokeStyle, sum) {
    let angle;
    let angle0 = angle0Param;
    const context = contextParam;
    this.data_.forEach((data, i) => {
      context.beginPath();
      context.moveTo(center, center);
      context.fillStyle = this.colors_[i % this.colors_.length];
      angle = angle0 + ((2 * Math.PI * data) / (sum * step));
      context.arc(center, center, this.radius_ * step, angle0, angle);
      context.closePath();
      context.fill();
      if (strokeStyle) {
        context.stroke();
      }
      angle0 = angle;
    });
    return angle0;
  }
}

export default OLChart;
