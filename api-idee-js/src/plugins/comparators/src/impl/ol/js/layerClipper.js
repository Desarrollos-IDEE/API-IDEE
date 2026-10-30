/**
 * @module IDEE/impl/control/layerClipper
 * Recorte de capas en los eventos prerender/postrender.
 */

const webglCanvases = new WeakMap();
const clipClassNames = new WeakMap();

let clipCount = 0;

/**
 * Indica si el contexto del evento es WebGL.
 * @param {RenderingContext} context Contexto del evento de renderizado.
 * @returns {boolean} Verdadero si es WebGL.
 */
const isWebGLContext = (context) => [window.WebGLRenderingContext, window.WebGL2RenderingContext]
  .some((ContextClass) => ContextClass && context instanceof ContextClass);

/**
 * Aísla la capa para que deje de compartir canvas con otras capas.
 * @param {ol.layer.Base} olLayer Capa de OpenLayers.
 */
const isolateCanvas = (olLayer) => {
  clipCount += 1;
  const clipClassName = `ol-layer-clip-${clipCount}`;
  const className = `${olLayer.getClassName()} ${clipClassName}`;
  // eslint-disable-next-line no-param-reassign
  olLayer.getClassName = () => className;
  clipClassNames.set(olLayer, clipClassName);
  olLayer.changed();
};

/**
 * Devuelve la capa a su clase original para que vuelva a compartir canvas.
 * @param {ol.layer.Base} olLayer Capa de OpenLayers.
 */
const releaseCanvas = (olLayer) => {
  if (clipClassNames.has(olLayer)) {
    // eslint-disable-next-line no-param-reassign
    delete olLayer.getClassName;
    clipClassNames.delete(olLayer);
    olLayer.changed();
  }
};

/**
 * Establece el recorte CSS de la capa WebGL.
 * @param {ol.render.Event} e Evento prerender.
 * @param {string} clipPath Valor CSS clip-path.
 */
const setWebGLClip = (e, clipPath) => {
  if (!clipClassNames.has(e.target)) {
    isolateCanvas(e.target);
    return;
  }
  const { canvas } = e.context;
  canvas.classList.add(clipClassNames.get(e.target));
  canvas.style.clipPath = clipPath;
  webglCanvases.set(e.target, canvas);
};

/**
 * Recorta la capa a un rectángulo en píxeles del mapa.
 * @param {ol.render.Event} e Evento prerender.
 * @param {Array<number>|null} rect Rectángulo en píxeles del mapa.
 */
export const clipRect = (e, rect) => {
  if (isWebGLContext(e.context)) {
    setWebGLClip(e, rect
      ? `polygon(${rect[0]}px ${rect[1]}px, ${rect[2]}px ${rect[1]}px, ${rect[2]}px ${rect[3]}px, ${rect[0]}px ${rect[3]}px)`
      : 'inset(100%)');
    return;
  }
  const ctx = e.context;
  ctx.save();
  ctx.beginPath();
  if (rect) {
    const corners = [[rect[0], rect[1]], [rect[0], rect[3]], [rect[2], rect[3]], [rect[2], rect[1]]]
      .map((pixel) => ol.render.getRenderPixel(e, pixel));
    ctx.moveTo(corners[0][0], corners[0][1]);
    corners.slice(1).forEach(([x, y]) => ctx.lineTo(x, y));
    ctx.closePath();
  }
  ctx.clip();
};

/**
 * Recorta la capa a un círculo en píxeles del mapa.
 * @param {ol.render.Event} e Evento prerender.
 * @param {Array<number>} center Centro en píxeles del mapa.
 * @param {number} radius Radio en píxeles.
 * @param {string} strokeStyle Color del borde.
 */
export const clipCircle = (e, center, radius, strokeStyle) => {
  if (isWebGLContext(e.context)) {
    setWebGLClip(e, `circle(${radius}px at ${center[0]}px ${center[1]}px)`);
    return;
  }
  const ctx = e.context;
  ctx.save();
  ctx.beginPath();
  ctx.arc(center[0], center[1], radius, 0, 2 * Math.PI);
  ctx.lineWidth = 3;
  ctx.strokeStyle = strokeStyle;
  ctx.stroke();
  ctx.clip();
};

/**
 * Restaura el contexto de la capa tras un recorte.
 * @param {ol.render.Event} e Evento postrender.
 */
export const restoreClip = (e) => {
  if (!isWebGLContext(e.context)) {
    e.context.restore();
  }
};

/**
 * Quita el recorte CSS de una capa WebGL al desactivar la comparación.
 * @param {ol.layer.Base} olLayer Capa de OpenLayers.
 */
export const resetClip = (olLayer) => {
  const canvas = webglCanvases.get(olLayer);
  if (canvas) {
    canvas.style.clipPath = '';
    canvas.classList.remove(clipClassNames.get(olLayer));
    webglCanvases.delete(olLayer);
  }
  releaseCanvas(olLayer);
};
