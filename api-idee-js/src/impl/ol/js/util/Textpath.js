/**
 * @module IDEE/impl/util/TextPath
 */
import OLStyle from 'ol/style/Style';
import OLStyleText from 'ol/style/Text';

/**
  * @classdesc
  * Implementación de la clase TextPath.
  * @api
  */
class TextPath {
  /**
    * Método de representación. Dibuja texto a lo largo de la trayectoria
    *
    * @function
    * @see https://github.com/Viglino/ol3-ext/blob/gh-pages/style/settextpathstyle.js#L9
    * @param {string} text Texto a representar
    * @param {Array<Number>} path Trayectoria
    * @public
    * @api
    */
  static render(text, path) {
    // canvas context
    let newText = text;
    const ctx = this;

    let di = 0;
    let dpos = 0;
    let pos = 2;

    // gets dist between two points
    const dist2D = (x1, y1, x2, y2) => {
      const [dx, dy] = [x2 - x1, y2 - y1];
      return Math.sqrt((dx * dx) + (dy * dy));
    };

    const getPoint = (newPath, dl) => {
      if (!di || (dpos + di < dl)) {
        // we need to max the performance
        for (; pos < newPath.length;) {
          di = dist2D(newPath[pos - 2], newPath[pos - 1], newPath[pos], newPath[pos + 1]);
          if (dpos + di > dl) {
            break;
          }
          pos += 2;
          if (pos >= newPath.length) {
            break;
          }
          dpos += di;
        }
      }

      const dt = dl - dpos;

      if (pos >= newPath.length) {
        pos = newPath.length - 2;
      }

      const x = !dt
        ? newPath[pos - 2]
        : (newPath[pos - 2] + (((newPath[pos] - newPath[pos - 2]) * dt) / di));

      const y = !dt
        ? newPath[pos - 1]
        : (newPath[pos - 1] + (((newPath[pos + 1] - newPath[pos - 1]) * dt) / di));

      const a = Math.atan2(newPath[pos + 1] - newPath[pos - 1], newPath[pos] - newPath[pos - 2]);

      return [x, y, a];
    };

    let letterPadding = ctx.measureText(' ').width * 0.25;
    let start = 0;
    let d = 0;

    for (let i = 2; i < path.length; i += 2) {
      d += dist2D(path[i - 2], path[i - 1], path[i], path[i + 1]);
    }

    if (d < ctx.minWidth) {
      return;
    }
    let nbspace = newText.split(' ').length - 1;

    if (ctx.textOverflow !== 'visible' && (d < ctx.measureText(newText).width + ((newText.length - (1 + nbspace)) * letterPadding))) {
      const overflow = (ctx.textOverflow === 'ellipsis') ? '\u2026' : ctx.textOverflow;
      do {
        nbspace = newText.split(' ').length - 1;
        newText = newText.slice(0, newText.length - 1);
      } while (newText && d < ctx.measureText(newText + overflow).width
        + ((newText.length + (overflow.length - 1) + nbspace) * letterPadding));
      newText += overflow;
    }
    switch (ctx.textJustify || ctx.textAlign) {
      case true: // justify
      case 'center':
      case 'end':
      case 'right':
        if (ctx.textJustify) {
          start = 0;
          letterPadding = (d - ctx.measureText(newText).width) / (text.length - (1 + nbspace));
        } else {
          start = d - ctx.measureText(newText).width - ((newText.length + nbspace) * letterPadding);
          if (ctx.textAlign === 'center') {
            start /= 2;
          }
        }
        break;
      default:
        break;
    }
    for (let t = 0; t < newText.length; t += 1) {
      const letter = newText[t];
      const wl = ctx.measureText(letter).width;
      const p = getPoint(path, start + (wl / 2));
      ctx.save();
      ctx.textAlign = 'center';
      ctx.translate(p[0], p[1]);
      ctx.rotate(p[2]);
      if (ctx.lineWidth) {
        ctx.strokeText(letter, 0, 0);
      }
      ctx.fillText(letter, 0, 0);
      ctx.restore();
      start += wl + (letterPadding * (letter === ' ' ? 2 : 1));
    }
  }

  /**
    * Obtiene la trayectoria a partir de las coordenadas especificadas
    * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
    * @function
    * @param {Array<number>} c2p Array de coordenadas en píxeles
    * @param {Array<Array<number>>} coords Coordenadas
    * @param {boolean} readable Indica si se invierte la trayectoria
    * @return {Array<number>} Trayectoria
    * @public
    * @api
    */
  static getPath_(c2p, coords, readable) {
    const path1 = [];
    coords.forEach((coord) => {
      path1.push((c2p[0] * coord[0]) + (c2p[1] * coord[1]) + c2p[4]);
      path1.push((c2p[2] * coord[0]) + (c2p[3] * coord[1]) + c2p[5]);
    });
    // Revert line ?
    if (readable && path1[0] > path1[path1.length - 2]) {
      const path2 = [];
      for (let h = path1.length - 2; h >= 0; h -= 2) {
        path2.push(path1[h]);
        path2.push(path1[h + 1]);
      }
      return path2;
    }
    return path1;
  }

  /**
    * Este método añade un estilo de Openlayers en una función de estilo.
    *
    * @function
    * @param {object} style Estilo de Openlayers.
    * @return {function} Función de estilo.
    * @public
    * @api
    */
  static formatStyle(style) {
    let newStyle = style;
    if (newStyle == null) {
      return null;
    }

    let formattedStyle = null;
    if (typeof newStyle === 'undefined') {
      newStyle = [new OLStyle({
        text: new OLStyleText(),
      })];
    }
    if (typeof newStyle === 'function') {
      formattedStyle = newStyle;
    } else {
      formattedStyle = () => {
        return [newStyle];
      };
    }
    return formattedStyle;
  }

  /**
    * Dibuja el estilo del texto de la trayectoria si
    * la capa u objeto geográfico lo ha configurado.
    *
    * @function
    * @param {Object} ctx Contexto.
    * @param {Array<number>} coord2Pixel Array de coordenadas en píxeles.
    * @param {Object} textStyle Estilo del texto.
    * @param {Array<Array<number>>} coords Coordenadas.
    * @public
    * @api
    */
  static draw(ctx, coord2Pixel, textStyle, coords) {
    const path = this.getPath_(coord2Pixel, coords, textStyle.getRotateWithView());

    ctx.font = textStyle.getFont();
    ctx.textBaseline = textStyle.getTextBaseline();
    ctx.textAlign = textStyle.getTextAlign();

    ctx.lineWidth = textStyle.getStroke()
      ? (textStyle.getStroke().getWidth() || TextPath.DEFAULT.lineWidth)
      : TextPath.DEFAULT.lineWidth;

    ctx.strokeStyle = textStyle.getStroke()
      ? (textStyle.getStroke().getColor() || TextPath.DEFAULT.lineColor)
      : TextPath.DEFAULT.lineColor;

    ctx.fillStyle = textStyle.getFill()
      ? textStyle.getFill().getColor() || TextPath.DEFAULT.fillColor
      : TextPath.DEFAULT.fillColor;
    // New params
    ctx.textJustify = textStyle.getTextAlign() === 'justify';

    ctx.textOverflow = textStyle.getTextOverflow
      ? textStyle.getTextOverflow()
      : TextPath.DEFAULT.textOverflow;
    ctx.minWidth = textStyle.getMinWidth ? textStyle.getMinWidth() : TextPath.DEFAULT.minWidth;
    // Draw textpath
    if (typeof ctx.textPath === 'function') {
      ctx.textPath(textStyle.getText(), path);
    }

    ctx.restore();
  }
}

/**
  * Valores de estilos predeterminados.
  * @const
  * @type {object}
  * @public
  * @api
  */
TextPath.DEFAULT = {
  lineWidth: 0,
  lineColor: '#fff',
  fillColor: '#000',
  textOverflow: '',
  minWidth: 0,
};

export default TextPath;
