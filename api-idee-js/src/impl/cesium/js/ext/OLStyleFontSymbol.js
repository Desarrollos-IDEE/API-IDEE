/**
 * @module IDEE/impl/cesium/js/ext/CesiumStyleFontSymbol
 */

/* Copyright (c) 2015 Jean-Marc VIGLINO,
released under the CeCILL-B license (French BSD license)
(http://www.cecill.info/licences/Licence_CeCILL-B_V1-en.txt).
*/

/**
 * @classdesc
 * Agregar un estilo de marcador para usar con símbolos de objetos geográficos.
 * @api
 */
class CesiumStyleFontSymbol {
  /**
   * Crea un nuevo estilo de marcado.
   * @constructor
   * @param {Object} opt_options Opciones.
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
    if (options.stroke && options.stroke.width) {
      strokeWidth = options.stroke.width;
    }

    if (typeof options.opacity === 'number') {
      this.opacity_ = options.opacity;
    }
    this.pixelRatio_ = window.devicePixelRatio;
    this.color_ = options.color;
    this.fontSize_ = options.fontSize || 1;
    this.stroke_ = options.stroke;
    this.fill_ = options.fill;
    this.radius_ = (options.radius * this.pixelRatio_) - strokeWidth;
    this.form_ = options.form || 'none';
    this.gradient_ = options.gradient;
    this.offset_ = [options.offsetX ? options.offsetX : 0, options.offsetY ? options.offsetY : 0];
    this.size_ = 10;
    this.glyph_ = this.getGlyph(options.glyph) || '';
    this.displacement_ = options.displacement || 0;
    this.scaleArray_ = [options.scale, options.scale];

    this.canvas_ = null;

    this.renderMaker();
  }

  /**
   * Clona el estilo.
   *
   * @function
   * @return {FontSymbol} Clon del estilo.
   * @api
   */
  clone() {
    const g = new CesiumStyleFontSymbol({
      glyph: '',
      color: this.color_,
      fontSize: this.fontSize_,
      stroke: this.stroke_,
      fill: this.fill_,
      radius: this.radius_ + (this.stroke_ ? this.stroke_.width : 0),
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
   * Modifica el glyph.
   * @function
   * @param {String} glyph Glyph.
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
    CesiumStyleFontSymbol.defs.fonts[fontname] = thefont;
    Object.keys(glyphs).forEach((key) => {
      let g = glyphs[key];
      if (typeof g === 'string' && g.length === 1) {
        g = {
          char: g,
        };
      }
      CesiumStyleFontSymbol.defs.glyphs[key] = {
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
   * @return {Fill} Estilo de relleno.
   * @api
   */
  getFill() {
    return this.fill_;
  }

  /**
   * Devuelve el estilo de borde para el símbolo.
   * @function
   * @return {Stroke} Estilo de borde.
   * @api
   */
  getStroke() {
    return this.stroke_;
  }

  /**
   * Devuelve el estilo de borde para el símbolo.
   * @function
   * @param {string} name Nombre del símbolo.
   * @return {Stroke} Estilo de borde.
   * @api
   */
  getGlyph(name) {
    let glyph = this.glyph_;
    if (name) {
      glyph = CesiumStyleFontSymbol.defs.glyphs[name];
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
    Object.keys(CesiumStyleFontSymbol.defs.glyphs).forEach((key) => {
      if (CesiumStyleFontSymbol.defs.glyph[key] === this.glyph_) {
        glyphName = key;
      }
    });
    return glyphName;
  }

  /**
   * Devuelve el estilo de borde para el símbolo.
   * @function
   * @param {object} glyph Parámetro "Glyph".
   * @return {Stroke} Estilo de borde.
   * @api
   */
  getFontInfo(glyph) {
    return CesiumStyleFontSymbol.defs.fonts[glyph.font];
  }

  /**
   * Renderiza el símbolo.
   * @function
   * @api
   */
  renderMaker() {
    let strokeStyle;
    let strokeWidth = 0;

    if (this.stroke_) {
      strokeStyle = this.stroke_.color;
      strokeWidth = this.stroke_.width;
    }

    // no atlas manager is used, create a new canvas
    this.canvas = this.createImage(this.pixelRatio_);

    const renderOptions = {
      strokeStyle,
      strokeWidth,
      size: this.canvas.width,
    };

    // draw the circle on the canvas
    const context = this.canvas.getContext('2d');
    context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.drawMarker_(renderOptions, context, 0, 0);

    // Set Anchor
    const a = this.getAnchor();
    a[0] = (this.canvas.width / 2) - this.offset_[0];
    a[1] = (this.canvas.width / 2) - this.offset_[1];
  }

  /**
   * Dibuja el símbolo.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @public
   * @param {Object} renderOptions Opciones de renderizado.
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
    let pts;
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
      case 'shield':
        pts = [0.05, 0, 0.95, 0, 0.95, 0.8, 0.5, 1, 0.05, 0.8, 0.05, 0];
        transfo.posY = (0.45 * s) + w;
        this.drawPoints_(pts, context, s, w);
        break;
      case 'blazon':
        pts = [0.1, 0, 0.9, 0, 0.9, 0.8, 0.6, 0.8, 0.5, 1, 0.4, 0.8, 0.1, 0.8, 0.1, 0];
        transfo.fac = 0.8;
        transfo.posY = (0.4 * s) + w;
        this.drawPoints_(pts, context, s, w);
        break;
      case 'bookmark':
        pts = [0.05, 0, 0.95, 0, 0.95, 1, 0.5, 0.8, 0.05, 1, 0.05, 0];
        transfo.fac = 0.9;
        transfo.posY = (0.4 * s) + w;
        this.drawPoints_(pts, context, s, w);
        break;
      case 'hexagon':
        pts = [0.05, 0.2, 0.5, 0, 0.95, 0.2, 0.95, 0.8, 0.5, 1, 0.05, 0.8, 0.05, 0.2];
        transfo.fac = 0.9;
        transfo.posY = (0.5 * s) + w;
        this.drawPoints_(pts, context, s, w);
        break;
      case 'diamond':
        pts = [0.25, 0, 0.75, 0, 1, 0.2, 1, 0.4, 0.5, 1, 0, 0.4, 0, 0.2, 0.25, 0];
        transfo.fac = 0.75;
        transfo.posY = (0.35 * s) + w;
        this.drawPoints_(pts, context, s, w);
        break;
      case 'triangle':
        pts = [0, 0, 1, 0, 0.5, 1, 0, 0];
        transfo.fac = 0.6;
        transfo.posY = (0.3 * s) + w;
        this.drawPoints_(pts, context, s, w);
        break;
      case 'sign':
        pts = [0.5, 0.05, 1, 0.95, 0, 0.95, 0.5, 0.05];
        transfo.fac = 0.7;
        transfo.posY = (0.65 * s) + w;
        this.drawPoints_(pts, context, s, w);
        break;
      case 'lozenge':
        pts = [0.5, 0, 1, 0.5, 0.5, 1, 0, 0.5, 0.5, 0];
        transfo.fac = 0.7;
        this.drawPoints_(pts, context, s, w);
        break;
      default:
        pts = [0, 0, 1, 0, 1, 1, 0, 1, 0, 0];
        this.drawPoints_(pts, context, s, w);
        break;
    }

    context.closePath();
    return transfo;
  }

  /**
   * Dibuja los puntos de un simbolo en el contexto de dibujo.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @public
   * @param {Array<Number>} pts Puntos a dibujar.
   * @param {CanvasRenderingContext2D} context Contexto de dibujo.
   * @param {number} s Size del simbolo.
   * @param {number} w Width del simbolo.
   * @api
   */
  drawPoints_(pts, context, s, w) {
    for (let i = 0; i < pts.length; i += 2) {
      context.lineTo((pts[i] * s) + w, (pts[i + 1] * s) + w);
    }
  }

  /**
   * Dibuja el símbolo en el contexto de dibujo.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @public
   * @param {Object} renderOptions Opciones de renderizado.
   * @param {CanvasRenderingContext2D} context Contexto de dibujo.
   * @param {number} x El origen para el símbolo (x).
   * @param {number} y El origen para el símbolo (y).
   * @api
   */
  drawMarker_(renderOptions, contextParam, x, y) {
    const context = contextParam;
    let fcolor = this.fill_ ? this.fill_ : '#000';
    let scolor = this.stroke_ ? this.stroke_.color : '#000';
    if (this.form_ === 'none' && this.stroke_ && this.fill_) {
      scolor = this.fill_;
      fcolor = this.stroke_.color;
    }
    // reset transform
    context.setTransform(1, 0, 0, 1, 0, 0);

    // then move to (x, y)
    context.translate(x, y);

    const tr = this.drawPath_(renderOptions, context);

    if (this.fill_) {
      if (this.gradient_ && this.form_ !== 'none') {
        const grd = context.createLinearGradient(0, 0, renderOptions.size / 2, renderOptions.size);
        grd.addColorStop(1, fcolor);
        grd.addColorStop(0, scolor);
        context.fillStyle = grd;
      } else {
        context.fillStyle = fcolor;
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
      context.fillStyle = this.color_ || scolor;
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
   * Obtiene el canvas con el dibujo del símbolo.
   * @return {Canvas} Canvas.
   * @api
   */
  getImage() {
    return this.canvas;
  }

  /**
   * Crea el canvas donde se va a dibujar el símbolo.
   * @param {Number} pixelRatio pixel ratio de la pantalla
   * @return {Canvas} Canvas.
   * @api
   */
  createImage(pixelRatio) {
    let lineJoin = '';
    let strokeWidth = 0;
    let miterLimit = 0;

    if (this.stroke_) {
      lineJoin = this.stroke_.linejoin ? this.stroke_.linejoin : lineJoin;
      strokeWidth = this.stroke_.width ? this.stroke_.width : strokeWidth;
      miterLimit = this.stroke_.miterlimit ? this.stroke_.miterlimit : miterLimit;
    }

    const add = this.calculateLineJoinSize_(lineJoin, strokeWidth, miterLimit);
    this.size_ = Math.ceil(2 * (this.radius_ + 2 * add));
    const canvas = document.createElement('canvas');
    canvas.width = this.size_ * pixelRatio; // Ancho del canvas
    canvas.height = this.size_ * pixelRatio; // Alto del canvas
    return canvas;
  }

  /**
   * Obtiene el punto de anclaje en pixeles. El ancla determina el punto central
   * del símbolo.
   * @return {Array<number>} Anchor.
   * @api
   */
  getAnchor() {
    const size = this.size_;
    const displacement = this.displacement_;
    const scale = this.scaleArray_;
    return [
      size[0] / 2 - displacement[0] / scale[0],
      size[1] / 2 + displacement[1] / scale[1],
    ];
  }

  /**
   * Calcula el tamaño adicional del canvas necesario para el miter.
   * @param {string} lineJoin Line join
   * @param {number} strokeWidth Stroke width
   * @param {number} miterLimit Miter limit
   * @return {number} Tamaño adicional del canvas.
   * @private
   */
  calculateLineJoinSize_(lineJoin, strokeWidth, miterLimit) {
    if (strokeWidth === 0 || this.points_ === Infinity
      || (lineJoin !== 'bevel' && lineJoin !== 'miter')) {
      return strokeWidth;
    }
    const r1 = this.radius_;
    const points = this.radius2_ === undefined ? this.points_ : this.points_ * 2;
    const alpha = (2 * Math.PI) / points;
    const a = r1 * Math.sin(alpha);
    const b = Math.sqrt(r1 * r1 - a * a);
    const d = r1 - b;
    const e = Math.sqrt(a * a + d * d);
    const miterRatio = e / a;
    if (lineJoin === 'miter' && miterRatio <= miterLimit) {
      return miterRatio * strokeWidth;
    }

    const k = strokeWidth / 2 / miterRatio;
    const l = (strokeWidth / 2) * (d / e);
    const maxr = Math.sqrt((r1 + k) * (r1 + k) + l * l);
    const bevelAdd = maxr - r1;
    if (this.radius2_ === undefined || lineJoin === 'bevel') {
      return bevelAdd * 2;
    }
    // If outer miter is over the miter limit the inner miter may reach through the
    // center and be longer than the bevel, same calculation as above but swap r1 / r2.
    const aa = r1 * Math.sin(alpha);
    const bb = Math.sqrt(r1 * r1 - aa * aa);
    const dd = r1 - bb;
    const ee = Math.sqrt(aa * aa + dd * dd);
    const innerMiterRatio = ee / aa;
    if (innerMiterRatio <= miterLimit) {
      const innerLength = (innerMiterRatio * strokeWidth) / 2 - r1 - r1;
      return 2 * Math.max(bevelAdd, innerLength);
    }
    return bevelAdd * 2;
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
CesiumStyleFontSymbol.defs = {
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
CesiumStyleFontSymbol.addDefs({
  font: 'g-cartografia',
  name: 'g-cartografia',
  prefix: 'g-cartografia-',
}, {
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
  'g-cartografia-posicion3': {
    font: 'g-cartografia',
    code: 59661,
    name: 'posicion3',
    search: 'posicion3',
  },
  'g-cartografia-zoom-extension': {
    font: 'g-cartografia',
    code: 59662,
    name: 'zoom-extension',
    search: 'zoom-extension',
  },
  'g-cartografia-spinner': {
    font: 'g-cartografia',
    code: 59663,
    name: 'spinner',
    search: 'spinner',
  },
});

export default CesiumStyleFontSymbol;
