import { isUndefined } from 'M/util/Utils';
import Line from 'M/style/Line';
import TextPath from './Textpath';
import Path from '../style/Path';

/**
 * Método de evento posterior al renderizado.<br />
 * Maneja renderizados adicionales después del renderizado del
 * estilo ol predeterminado.<br />
 *
 * <b>AVISO</b> este método está vinculado a la capa vectorial,
 * por lo que el contexto utilizado dentro del método será
 * olLayer (this = olLayer)
 *
 * @see https://github.com/Viglino/ol3-ext/blob/gh-pages/style/settextpathstyle.js#L138
 * @function
 * @param {Object} e evento recibido con 'framestate'.
 * @public
 * @api
 */
const postRender = function postRender(e = null) {
  // add support for textpath
  if (isUndefined(window.CanvasRenderingContext2D.prototype.textPath)) {
    window.CanvasRenderingContext2D.prototype.textPath = TextPath.render;
  }

  // Prevent drawing at large resolution
  if (e.frameState.viewState.resolution > this.textPathMaxResolution_) return;

  const extent = e.frameState.extent;

  const ctx = e.context;
  ctx.save();
  ctx.scale(e.frameState.pixelRatio, e.frameState.pixelRatio);

  const sourceWithoutFeatures = this.getSource() != null
    && this.getSource().getFeatures().length === 0;
  if (!sourceWithoutFeatures) {
    // gets features in extent
    this.getSource().getFeaturesInExtent(extent).forEach((feature) => {
      const selectedStyle = feature.getStyle() != null ? feature.getStyle() : this.getStyle();
      let styles = typeof selectedStyle === 'function' ? selectedStyle(feature, e.frameState.viewState.resolution) : selectedStyle;
      if (!(styles instanceof Array)) {
        styles = [styles];
      }
      styles.forEach((style) => {
        let geom = (style instanceof Line
          ? style.getOptions().geometry
          : style.getGeometry()) || feature.getGeometry();
        let coords;
        if (typeof geom === 'function') {
          geom = geom(feature);
        }
        switch (geom.getType()) {
          case 'MultiLineString':
            coords = geom.getLineString(0).getCoordinates();
            break;
          default:
            coords = geom.getCoordinates();
        }

        // add support for textpath
        const textStyle = (style instanceof Line) ? style.getOptions().text : style.textPath;
        if (textStyle != null && textStyle instanceof Path) {
          TextPath.draw(ctx, e.frameState.coordinateToPixelTransform, textStyle, coords);
        }
      });
    });
    ctx.restore();
  }
};

export default postRender;
