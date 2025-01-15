/**
 * @module M/impl/OLStyleStrokePattern
 */

/**
 * Copyright (c) 2018 Jean-Marc VIGLINO,
 * released under the CeCILL-B license (French BSD license)
 * (http://www.cecill.info/licences/Licence_CeCILL-B_V1-en.txt).
 */
import { DEVICE_PIXEL_RATIO as hasDEVICEPIXELRATIO } from 'ol/has';
import OLStyleStroke from 'ol/style/Stroke';
import { asString as olColorAsString } from 'ol/color';
import OLStyleFillPattern from './OLStyleFillPattern';

/**
 * @classdesc
 * Estilo de trazo con patrón.
 * @extends {ol.style.Fill}
 * @implements {ol.structs.IHasChecksum}
 * @api
 */
class OLStyleStrokePattern extends OLStyleStroke {
  /**
   * @constructor
   * @param {any} options Opciones del estilo.
   * - image: un patrón de imagen, la imagen debe estar precargada.
   * - opacity: opacidad con patrón de imagen, por defecto 1.
   * - color: color del patrón.
   * - fill: color de relleno (fondo).
   * - offset: desplazamiento del patrón para el patrón ("hash","dot","circle","cross").
   * - size: tamaño de línea para el patrón ("hash","dot","circle","cross")
   * - spacing: espaciado para el patrón ("hash","dot","circle","cross").
   * - angle: ángulo para el patrón "hash", verdadero para 45deg (dot, circle y cross).
   * - scale: escala del patrón.
   * @api
   */
  constructor(options = {}) {
    super(options);

    let pattern;
    let i;
    const canvas = document.createElement('canvas');
    this.canvas_ = document.createElement('canvas');
    const scale = Number(options.scale) > 0 ? Number(options.scale) : 1;
    const ratio = scale * hasDEVICEPIXELRATIO || hasDEVICEPIXELRATIO;

    const ctx = canvas.getContext('2d');

    if (options.image) {
      options.image.load();

      const img = options.image.getImage();
      if (img.width) {
        canvas.width = Math.round(img.width * ratio);
        canvas.height = Math.round(img.height * ratio);
        ctx.globalAlpha = typeof (options.opacity) === 'number' ? options.opacity : 1;
        ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, canvas.width, canvas.height);
        pattern = ctx.createPattern(canvas, 'repeat');
      } else {
        const self = this;
        pattern = [0, 0, 0, 0];
        img.onload = () => {
          canvas.width = Math.round(img.width * ratio);
          canvas.height = Math.round(img.height * ratio);
          ctx.globalAlpha = typeof (options.opacity) === 'number' ? options.opacity : 1;
          ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, canvas.width, canvas.height);
          pattern = ctx.createPattern(canvas, 'repeat');
          self.setColor(pattern);
          if (options.layer) {
            options.layer.refresh();
          }
        };
      }
    } else {
      const pat = this.getPattern_(options);
      canvas.width = Math.round(pat.width * ratio);
      canvas.height = Math.round(pat.height * ratio);
      ctx.beginPath();
      if (options.fill) {
        ctx.fillStyle = olColorAsString(options.fill.getColor());
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      ctx.scale(ratio, ratio);
      ctx.lineCap = 'round';
      ctx.lineWidth = pat.stroke || 1;

      ctx.fillStyle = olColorAsString(options.color || '#000');
      ctx.strokeStyle = olColorAsString(options.color || '#000');
      if (pat.circles) {
        for (i = 0; i < pat.circles.length; i += 1) {
          const ci = pat.circles[i];
          ctx.beginPath();
          ctx.arc(ci[0], ci[1], ci[2], 0, 2 * Math.PI);
          if (pat.fill) {
            ctx.fill();
          }
          if (pat.stroke) {
            ctx.stroke();
          }
        }
      }
      if (!pat.repeat) {
        pat.repeat = [
          [0, 0],
        ];
      }

      if (pat.char) {
        ctx.font = `${pat.font || (pat.width)} px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        if (pat.angle) {
          ctx.fillText(pat.char, pat.width / 4, pat.height / 4);
          ctx.fillText(pat.char, (5 * pat.width) / 4, (5 * pat.height) / 4);
          ctx.fillText(pat.char, pat.width / 4, (5 * pat.height) / 4);
          ctx.fillText(pat.char, (5 * pat.width) / 4, pat.height / 4);

          ctx.fillText(pat.char, (3 * pat.width) / 4, (3 * pat.height) / 4);
          ctx.fillText(pat.char, -pat.width / 4, -pat.height / 4);
          ctx.fillText(pat.char, (3 * pat.width) / 4, -pat.height / 4);
          ctx.fillText(pat.char, -pat.width / 4, (3 * pat.height) / 4);
        } else {
          ctx.fillText(pat.char, pat.width / 2, pat.height / 2);
        }
      }

      if (pat.lines) {
        for (i = 0; i < pat.lines.length; i += 1) {
          for (let r = 0; r < pat.repeat.length; r += 1) {
            const li = pat.lines[i];
            ctx.beginPath();
            ctx.moveTo(li[0] + pat.repeat[r][0], li[1] + pat.repeat[r][1]);
            for (let k = 2; k < li.length; k += 2) {
              ctx.lineTo(li[k] + pat.repeat[r][0], li[k + 1] + pat.repeat[r][1]);
            }
            if (pat.fill) {
              ctx.fill();
            }
            if (pat.stroke) {
              ctx.stroke();
            }
            ctx.save();
            ctx.strokeStyle = 'red';
            ctx.strokeWidth = 0.1;
            // ctx.strokeRect(0,0,canvas.width,canvas.height);
            ctx.restore();
          }
        }
      }
      pattern = ctx.createPattern(canvas, 'repeat');
      if (options.offset) {
        let offset = options.offset;
        if (typeof (offset) === 'number') {
          offset = [offset, offset];
        }
        if (offset instanceof Array) {
          const dx = Math.round((offset[0] * ratio));
          const dy = Math.round((offset[1] * ratio));
          // New pattern
          ctx.scale(1 / ratio, 1 / ratio);
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.translate(dx, dy);
          ctx.fillStyle = pattern;
          ctx.fillRect(-dx, -dy, canvas.width, canvas.height);
          pattern = ctx.createPattern(canvas, 'repeat');
        }
      }
    }

    this.setColor(pattern);
  }

  /**
   * Este método es llamado por el constructor de la clase padre,
   * clona el estilo y asigna el "canvas".
   * @function
   * @return {ol.style.StrokePattern} Clon del estilo.
   * @api
   */
  clone() {
    const s = super.clone();
    // eslint-disable-next-line no-underscore-dangle
    s.canvas_ = this.canvas_;
    return s;
  }

  /**
   * Este método devuelve la imagen del "canvas".
   * @function
   * @return {canvas} Imagen del "canvas".
   * @api
   */
  getImage() {
    return this.canvas_;
  }

  /**
   * Este método devuelve el color del estilo.
   * @function
   * @param {olx.style.FillPatternOption} options Opciones del estilo.
   * @return {ol.style.FillPattern} Color del estilo.
   * @api
   */
  getPattern_(options) {
    const pat = OLStyleFillPattern.patterns[options.pattern] || OLStyleFillPattern.patterns.dot;
    let d = Math.round(options.spacing) || 10;
    let size;
    // let d2 = Math.round(d/2)+0.5;
    switch (options.pattern) {
      case 'dot':
      case 'circle': {
        size = options.size === 0 ? 0 : options.size / 2 || 2;
        if (!options.angle) {
          pat.width = d;
          pat.height = d;
          pat.circles = [
            [d / 2, d / 2, size],
          ];
          if (options.pattern === 'circle') {
            pat.circles = pat.circles.concat([
              [(d / 2) + d, d / 2, size],
              [(d / 2) - d, d / 2, size],
              [d / 2, (d / 2) + d, size],
              [d / 2, (d / 2) - d, size],
              [(d / 2) + d, (d / 2) + d, size],
              [(d / 2) + d, (d / 2) - d, size],
              [(d / 2) - d, (d / 2) + d, size],
              [(d / 2) - d, (d / 2) - d, size],
            ]);
          }
        } else {
          d = Math.round(d * 1.4);
          pat.width = Math.round(d * 1.4);
          pat.height = Math.round(d * 1.4);
          pat.circles = [
            [d / 4, d / 4, size],
            [(3 * d) / 4, (3 * d) / 4, size],
          ];
          if (options.pattern === 'circle') {
            pat.circles = pat.circles.concat([
              [(d / 4) + d, d / 4, size],
              [d / 4, (d / 4) + d, size],
              [((3 * d) / 4) - d, (3 * d) / 4, size],
              [(3 * d) / 4, ((3 * d) / 4) - d, size],
              [(d / 4) + d, (d / 4) + d, size],
              [((3 * d) / 4) - d, ((3 * d) / 4) - d, size],
            ]);
          }
        }
        break;
      }
      case 'tile':
      case 'square': {
        size = options.size === 0 ? 0 : options.size / 2 || 2;
        if (!options.angle) {
          pat.width = d;
          pat.height = d;
          pat.lines = [
            [(d / 2) - size, (d / 2) - size, (d / 2) + size, (d / 2) - size,
              (d / 2) + size, (d / 2) + size, (d / 2) - size, (d / 2) + size,
              (d / 2) - size, (d / 2) - size,
            ],
          ];
        } else {
          pat.width = d;
          pat.height = d;
          // size *= Math.sqrt(2);
          pat.lines = [
            [(d / 2) - size, d / 2, d / 2, (d / 2) - size,
              (d / 2) + size, d / 2, d / 2, (d / 2) + size, (d / 2) - size, d / 2,
            ],
          ];
        }
        if (options.pattern === 'square') {
          pat.repeat = [
            [0, 0],
            [0, d],
            [d, 0],
            [0, -d],
            [-d, 0],
            [-d, -d],
            [d, d],
            [-d, d],
            [d, -d],
          ];
        }
        break;
      }
      case 'cross': { // Limit angle to 0 | 45
        if (options.angle) {
          // eslint-disable-next-line no-param-reassign
          options.angle = 45;
        }
      }
      // fallthrough
      case 'hatch': {
        let a = Math.round(((options.angle || 0) - 90) % 360);
        if (a > 180) {
          a -= 360;
        }
        a *= Math.PI / 180;
        const cos = Math.cos(a);
        const sin = Math.sin(a);
        if (Math.abs(sin) < 0.0001) {
          pat.width = d;
          pat.height = d;
          pat.lines = [
            [0, 0.5, d, 0.5],
          ];
          pat.repeat = [
            [0, 0],
            [0, d],
          ];
        } else if (Math.abs(cos) < 0.0001) {
          pat.width = d;
          pat.height = d;
          pat.lines = [
            [0.5, 0, 0.5, d],
          ];
          pat.repeat = [
            [0, 0],
            [d, 0],
          ];
          if (options.pattern === 'cross') {
            pat.lines.push([0, 0.5, d, 0.5]);
            pat.repeat.push([0, d]);
          }
        } else {
          const w = Math.round(Math.abs(d / sin)) || 1;
          pat.width = Math.round(Math.abs(d / sin)) || 1;
          const h = Math.round(Math.abs(d / cos)) || 1;
          pat.height = Math.round(Math.abs(d / cos)) || 1;
          if (options.pattern === 'cross') {
            pat.lines = [
              [-w, -h, 2 * w, 2 * h],
              [2 * w, -h, -w, 2 * h],
            ];
            pat.repeat = [
              [0, 0],
            ];
          } else if (cos * sin > 0) {
            pat.lines = [
              [-w, -h, 2 * w, 2 * h],
            ];
            pat.repeat = [
              [0, 0],
              [w, 0],
              [0, h],
            ];
          } else {
            pat.lines = [
              [2 * w, -h, -w, 2 * h],
            ];
            pat.repeat = [
              [0, 0],
              [-w, 0],
              [0, h],
            ];
          }
        }
        pat.stroke = options.size === 0 ? 0 : options.size || 4;
        break;
      }
      default: {
        break;
      }
    }
    return pat;
  }
}

export default OLStyleStrokePattern;
