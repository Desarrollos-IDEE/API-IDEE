/**
 * @module M/impl/ol/js/ext/OLStyleFontSymbol
 */

import OLStyleRegularShape from 'ol/style/RegularShape';
import { asString as colorAsString } from 'ol/color';

/* Copyright (c) 2015 Jean-Marc VIGLINO,
released under the CeCILL-B license (French BSD license)
(http://www.cecill.info/licences/Licence_CeCILL-B_V1-en.txt).
*/

/**
 * @classdesc
 * Agregar un estilo de marcador para usar con símbolos de objetos geográficos.
 * @extends {ol.style.RegularShape}
 * @implements {ol.structs.IHasChecksum}
 * @api
 */
class OLStyleFontSymbol extends OLStyleRegularShape {
  /**
   * Crea un nuevo estilo de marcado.
   * @constructor
   * @param {olx.style.FontSymbolOptions=} opt_options Opciones.
   * - radius. Radio del marcador.
   * - fill. Color de relleno.
   * - rotation. Rotación en radianes (0 radianes = norte).
   * - rotateWithView. Rotar con la vista.
   * - color. Color del símbolo.
   * - fontSize. Tamaño de la fuente.
   * - stroke. Color del borde.
   * - gradient. Si se debe usar un gradiente.
   * - glyph. Símbolo a usar.
   * - offsetX. Desplazamiento horizontal del símbolo.
   * - offsetY. Desplazamiento vertical del símbolo.
   * - form. Forma del símbolo.
   * @api
   */
  constructor(options = {}) {
    let strokeWidth = 0;
    if (options.stroke) {
      strokeWidth = options.stroke.getWidth();
    }
    super({
      radius: options.radius,
      fill: options.fill,
      rotation: options.rotation,
      rotateWithView: options.rotateWithView,
    });

    if (typeof options.opacity === 'number') this.setOpacity(options.opacity);
    this.pixelRatio_ = window.devicePixelRatio;
    this.color_ = options.color;
    this.fontSize_ = options.fontSize || 1;
    this.stroke_ = options.stroke;
    this.fill_ = options.fill;
    this.radius_ = (options.radius * this.pixelRatio_) - strokeWidth;
    this.form_ = options.form || 'none';
    this.gradient_ = options.gradient;
    this.offset_ = [options.offsetX ? options.offsetX : 0, options.offsetY ? options.offsetY : 0];

    this.glyph_ = this.getGlyph(options.glyph) || '';

    this.renderMaker();
  }

  /**
   * Clona el estilo.
   *
   * @function
   * @return {ol.style.FontSymbol} Clon del estilo.
   * @api
   */
  clone() {
    const g = new OLStyleFontSymbol({
      glyph: '',
      color: this.color_,
      fontSize: this.fontSize_,
      stroke: this.stroke_,
      fill: this.fill_,
      radius: this.radius_ + (this.stroke_ ? this.stroke_.getWidth() : 0),
      form: this.form_,
      gradient: this.gradient_,
      offsetX: this.offset_[0],
      offsetY: this.offset_[1],
      opacity: this.getOpacity(),
      rotation: this.getRotation(),
      rotateWithView: this.getRotateWithView(),
    });
    g.setScale(this.getScale());
    g.setGlyph(this.getGlyph());
    g.renderMaker();
    return g;
  }

  /**
   * Modifica el color del símbolo.
   * @function
   * @param {ol.Color} color Color del símbolo.
   * @api
   */
  setGlyph(glyph) {
    this.glyph_ = glyph;
  }

  /**
   * Función estática: agregar nuevas definiciones de fuente.
   * @function
   * @param {string|object} font Nombre de la fuente o definición de la fuente.
   * @param {object} glyphs Definición de los símbolos.
   * @api
   */
  static addDefs(font, glyphs) {
    let thefont = font;
    if (typeof font === 'string') {
      thefont = {
        font,
        name: font,
        copyright: '',
      };
    }
    if (!thefont.font || typeof thefont.font !== 'string') {
      throw new Error('bad font def');
    }
    const fontname = thefont.font;
    OLStyleFontSymbol.defs.fonts[fontname] = thefont;
    Object.keys(glyphs).forEach((key) => {
      let g = glyphs[key];
      if (typeof g === 'string' && g.length === 1) {
        g = {
          char: g,
        };
      }
      OLStyleFontSymbol.defs.glyphs[key] = {
        font: thefont.font,
        char: g.char || `${String.fromCharCode(g.code)}` || '',
        theme: g.theme || thefont.name,
        name: g.name || key,
        search: g.search || '',
      };
    });
  }

  /**
   * Devuelve el estilo de relleno para el símbolo.
   * @function
   * @return {ol.style.Fill} Estilo de relleno.
   * @api
   */
  getFill() {
    return this.fill_;
  }

  /**
   * Devuelve el estilo de borde para el símbolo.
   * @function
   * @return {ol.style.Stroke} Estilo de borde.
   * @api
   */
  getStroke() {
    return this.stroke_;
  }

  /**
   * Devuelve el estilo de borde para el símbolo.
   * @function
   * @param {string} name Nombre del símbolo.
   * @return {ol.style.Stroke} Estilo de borde.
   * @api
   */
  getGlyph(name) {
    let glyph = this.glyph_;
    if (name) {
      glyph = OLStyleFontSymbol.defs.glyphs[name];
      glyph = glyph || {
        font: 'none',
        char: name.charAt(0),
        theme: 'none',
        name: 'none',
        search: '',
      };
    }
    return glyph;
  }

  /**
   * Devuelve el nombre del símbolo.
   * @function
   * @return {string} Nombre del símbolo.
   * @api
   */
  getGlyphName() {
    let glyphName = '';
    Object.keys(OLStyleFontSymbol.defs.glyphs).forEach((key) => {
      if (OLStyleFontSymbol.defs.glyph[key] === this.glyph_) {
        glyphName = key;
      }
    });
    return glyphName;
  }

  /**
   * Devuelve el estilo de borde para el símbolo.
   * @function
   * @param {object} glyph Parámetro "Glyph".
   * @return {ol.style.Stroke} Estilo de borde.
   * @api
   */
  getFontInfo(glyph) {
    return OLStyleFontSymbol.defs.fonts[glyph.font];
  }

  /**
   * Renderiza el símbolo.
   * @function
   * @param {ol.AtlasManager} atlasManager Gestiona la creación de atlas de imágenes.
   * @api
   */
  renderMaker(atlasManager) {
    let strokeStyle;
    let strokeWidth = 0;

    if (this.stroke_) {
      strokeStyle = colorAsString(this.stroke_.getColor());
      strokeWidth = this.stroke_.getWidth();
    }

    // no atlas manager is used, create a new canvas
    const canvas = this.getImage(this.pixelRatio_);

    const renderOptions = {
      strokeStyle,
      strokeWidth,
      size: canvas.width,
    };

    // draw the circle on the canvas
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
    this.drawMarker_(renderOptions, context, 0, 0);

    // Set Anchor
    const a = this.getAnchor();
    a[0] = (canvas.width / 2) - this.offset_[0];
    a[1] = (canvas.width / 2) - this.offset_[1];
  }

  /**
   * Dibuja el símbolo.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @public
   * @param {ol.style.FontSymbol.RenderOptions} renderOptions Opciones de renderizado.
   * @param {CanvasRenderingContext2D} context Contexto del "canvas".
   * @return {Number} Tamaño del símbolo.
   * @api
   */
  drawPath_(renderOptions, contextParam) {
    const context = contextParam;
    const s = (2 * this.radius_) + renderOptions.strokeWidth + 1;
    const w = renderOptions.strokeWidth / 2;
    const c = renderOptions.size / 2;
    // Transfo to place the glyph at the right place
    let transfo = {
      fac: 1,
      posX: renderOptions.size / 2,
      posY: renderOptions.size / 2,
    };
    context.lineJoin = 'round';
    context.beginPath();

    // Draw the path with the form
    const pi = Math.PI;
    switch (this.form_) {
      case 'none':
        transfo.fac = 1;
        // const pi = Math.PI;
        break;
      case 'circle':
      case 'ban':
        context.arc(c, c, s / 2, 0, 2 * Math.PI, true);
        break;
      case 'poi':
        context.arc(c, c - (0.4 * this.radius_), 0.6 * this.radius_, 0.15 * pi, 0.85 * pi, true);
        context.lineTo(c - (0.89 * 0.05 * s), ((0.95 + (0.45 * 0.05)) * s) + w);
        context.arc(c, (0.95 * s) + w, 0.05 * s, 0.85 * Math.PI, 0.15 * Math.PI, true);
        transfo = {
          fac: 0.45,
          posX: c,
          posY: c - (0.35 * this.radius_),
        };
        break;
      case 'bubble':
        context.arc(c, c - (0.2 * this.radius_), 0.8 * this.radius_, 0.4 * pi, 0.6 * pi, true);
        context.lineTo((0.5 * s) + w, s + w);
        transfo = {
          fac: 0.7,
          posX: c,
          posY: c - (0.2 * this.radius_),
        };
        break;
      case 'marker':
        context.arc(c, c - (0.2 * this.radius_), 0.8 * this.radius_, 0.25 * pi, 0.75 * pi, true);
        context.lineTo((0.5 * s) + w, s + w);
        transfo = {
          fac: 0.7,
          posX: c,
          posY: c - (0.2 * this.radius_),
        };

        break;
      case 'coma':
        context.moveTo(c + (0.8 * this.radius_), c - (0.2 * this.radius_));
        context.quadraticCurveTo((0.95 * s) + w, (0.75 * s) + w, (0.5 * s) + w, s + w);
        context.arc(c, c - (0.2 * this.radius_), 0.8 * this.radius_, 0.45 * pi, 0, false);
        transfo = {
          fac: 0.7,
          posX: c,
          posY: c - (0.2 * this.radius_),
        };
        break;
      default:
        let pts;
        switch (this.form_) {
          case 'shield':
            pts = [0.05, 0, 0.95, 0, 0.95, 0.8, 0.5, 1, 0.05, 0.8, 0.05, 0];
            transfo.posY = (0.45 * s) + w;
            break;
          case 'blazon':
            pts = [0.1, 0, 0.9, 0, 0.9, 0.8, 0.6, 0.8, 0.5, 1, 0.4, 0.8, 0.1, 0.8, 0.1, 0];
            transfo.fac = 0.8;
            transfo.posY = (0.4 * s) + w;
            break;
          case 'bookmark':
            pts = [0.05, 0, 0.95, 0, 0.95, 1, 0.5, 0.8, 0.05, 1, 0.05, 0];
            transfo.fac = 0.9;
            transfo.posY = (0.4 * s) + w;
            break;
          case 'hexagon':
            pts = [0.05, 0.2, 0.5, 0, 0.95, 0.2, 0.95, 0.8, 0.5, 1, 0.05, 0.8, 0.05, 0.2];
            transfo.fac = 0.9;
            transfo.posY = (0.5 * s) + w;
            break;
          case 'diamond':
            pts = [0.25, 0, 0.75, 0, 1, 0.2, 1, 0.4, 0.5, 1, 0, 0.4, 0, 0.2, 0.25, 0];
            transfo.fac = 0.75;
            transfo.posY = (0.35 * s) + w;
            break;
          case 'triangle':
            pts = [0, 0, 1, 0, 0.5, 1, 0, 0];
            transfo.fac = 0.6;
            transfo.posY = (0.3 * s) + w;
            break;
          case 'sign':
            pts = [0.5, 0.05, 1, 0.95, 0, 0.95, 0.5, 0.05];
            transfo.fac = 0.7;
            transfo.posY = (0.65 * s) + w;
            break;
          case 'lozenge':
            pts = [0.5, 0, 1, 0.5, 0.5, 1, 0, 0.5, 0.5, 0];
            transfo.fac = 0.7;
            break;
          default:
            pts = [0, 0, 1, 0, 1, 1, 0, 1, 0, 0];
            break;
        }
        for (let i = 0; i < pts.length; i += 2) {
          context.lineTo((pts[i] * s) + w, (pts[i + 1] * s) + w);
        }
    }

    context.closePath();
    return transfo;
  }

  /**
   * Dibuja el símbolo en el contexto de dibujo.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @public
   * @param {ol.style.FontSymbol.RenderOptions} renderOptions Opciones de renderizado.
   * @param {CanvasRenderingContext2D} context Contexto de dibujo.
   * @param {number} x El origen para el símbolo (x).
   * @param {number} y El origen para el símbolo (y).
   * @api
   */
  drawMarker_(renderOptions, contextParam, x, y) {
    const context = contextParam;
    let fcolor = this.fill_ ? this.fill_.getColor() : '#000';
    let scolor = this.stroke_ ? this.stroke_.getColor() : '#000';
    if (this.form_ === 'none' && this.stroke_ && this.fill_) {
      scolor = this.fill_.getColor();
      fcolor = this.stroke_.getColor();
    }
    // reset transform
    context.setTransform(1, 0, 0, 1, 0, 0);

    // then move to (x, y)
    context.translate(x, y);

    const tr = this.drawPath_(renderOptions, context);

    if (this.fill_) {
      if (this.gradient_ && this.form_ !== 'none') {
        const grd = context.createLinearGradient(0, 0, renderOptions.size / 2, renderOptions.size);
        grd.addColorStop(1, colorAsString(fcolor));
        grd.addColorStop(0, colorAsString(scolor));
        context.fillStyle = grd;
      } else {
        context.fillStyle = colorAsString(fcolor);
      }
      context.fill();
    }
    if (this.stroke_ && renderOptions.strokeWidth) {
      context.strokeStyle = renderOptions.strokeStyle;
      context.lineWidth = renderOptions.strokeWidth;
      context.stroke();
    }

    // Draw the symbol
    if (this.glyph_.char) {
      context.font = `${(2 * tr.fac * (this.radius_) * this.fontSize_)}px ${this.glyph_.font}`;
      context.strokeStyle = context.fillStyle;
      context.lineWidth = renderOptions.strokeWidth * (this.form_ === 'none' ? 2 : 1);
      context.fillStyle = colorAsString(this.color_ || scolor);
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      const t = this.glyph_.char;
      if (renderOptions.strokeWidth && scolor !== 'transparent') context.strokeText(t, tr.posX, tr.posY);
      context.fillText(t, tr.posX, tr.posY);
    }

    if (this.form_ === 'ban' && this.stroke_ && renderOptions.strokeWidth) {
      context.strokeStyle = renderOptions.strokeStyle;
      context.lineWidth = renderOptions.strokeWidth;
      const r = this.radius_ + renderOptions.strokeWidth;
      const d = this.radius_ * Math.cos(Math.PI / 4);
      context.moveTo(r + d, r - d);
      context.lineTo(r - d, r + d);
      context.stroke();
    }
  }

  /**
   * Este método devuelve el "checksum" del símbolo.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @public
   * @function
   * @return {string} El "checksum".
   * @api
   */
  getChecksum() {
    const strokeChecksum = (this.stroke_ !== null)
      ? this.stroke_.getChecksum()
      : '-';
    const fillChecksum = (this.fill_ !== null)
      ? this.fill_.getChecksum()
      : '-';

    const recalculate = (this.checksums_ === null)
      || (strokeChecksum !== this.checksums_[1]
        || fillChecksum !== this.checksums_[2]
        || this.radius_ !== this.checksums_[3]
        || `${this.form_}-${this.glyphs_ !== this.checksums_[4]}`);

    if (recalculate) {
      /* eslint-disable*/
      const checksum = 'c' + strokeChecksum + fillChecksum +
        ((this.radius_ !== void 0) ? this.radius_.toString() : '-') +
        this.form_ + '-' + this.glyphs_;
      /* eslint-enable */
      this.checksums_ = [checksum, strokeChecksum, fillChecksum, this.radius_, `${this.form_}-${this.glyphs_}`];
    }
    return this.checksums_[0];
  }
}

/**
 * Fuentes por defecto.
 * Para "fonts" admite (name y copyright) y "glyphs" (name, theme, search y char).
 * @public
 * @type {Object}
 * @const
 * @api
 */
OLStyleFontSymbol.defs = {
  fonts: {},
  glyphs: {},
};

/**
 * Añade una nueva fuente de símbolos.
 * @public
 * @function
 * @param {Object} Object Definición de la fuente.
 * @param {Object} Object Nombre de la fuente.
 */
OLStyleFontSymbol.addDefs({
  font: 'g-cartografia',
  name: 'g-cartografia',
  prefix: 'g-cartografia-',
}, {
  'g-cartografia-spinner': {
    font: 'g-cartografia',
    code: 59663,
    name: 'spinner',
    search: 'spinner',
  },
  'g-cartografia-posicion3': {
    font: 'g-cartografia',
    code: 59661,
    name: 'posicion3',
    search: 'posicion3',
  },
  'g-cartografia-brujula-norte': {
    font: 'g-cartografia',
    code: 59648,
    name: 'brujula-norte',
    search: 'brujula-norte',
  },
  'g-cartografia-capas2': {
    font: 'g-cartografia',
    code: 59649,
    name: 'capas2',
    search: 'capas2',
  },
  'g-cartografia-comentarios': {
    font: 'g-cartografia',
    code: 59650,
    name: 'comentarios',
    search: 'comentarios',
  },
  'g-cartografia-escala3': {
    font: 'g-cartografia',
    code: 59651,
    name: 'escala3',
    search: 'escala3',
  },
  'g-cartografia-flecha': {
    font: 'g-cartografia',
    code: 59652,
    name: 'flecha',
    search: 'flecha',
  },
  'g-cartografia-flecha-abajo': {
    font: 'g-cartografia',
    code: 59653,
    name: 'flecha-abajo',
    search: 'flecha-abajo',
  },
  'g-cartografia-flecha-arriba': {
    font: 'g-cartografia',
    code: 59654,
    name: 'flecha-arriba',
    search: 'flecha-arriba',
  },
  'g-cartografia-flecha-derecha': {
    font: 'g-cartografia',
    code: 59655,
    name: 'flecha-derecha',
    search: 'flecha-derecha',
  },
  'g-cartografia-flecha-izquierda': {
    font: 'g-cartografia',
    code: 59656,
    name: 'flecha-izquierda',
    search: 'flecha-izquierda',
  },
  'g-cartografia-gps2': {
    font: 'g-cartografia',
    code: 59657,
    name: 'gps2',
    search: 'gps2',
  },
  'g-cartografia-info': {
    font: 'g-cartografia',
    code: 59658,
    name: 'info',
    search: 'info',
  },
  'g-cartografia-papelera': {
    font: 'g-cartografia',
    code: 59659,
    name: 'papelera',
    search: 'papelera',
  },
  'g-cartografia-pin': {
    font: 'g-cartografia',
    code: 59660,
    name: 'pin',
    search: 'pin',
  },
  'g-cartografia-zoom-extension': {
    font: 'g-cartografia',
    code: 59662,
    name: 'zoom-extension',
    search: 'zoom-extension',
  },
});

export default OLStyleFontSymbol;
