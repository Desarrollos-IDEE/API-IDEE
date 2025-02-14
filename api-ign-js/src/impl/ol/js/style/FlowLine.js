/**
 * @module M/impl/style/FlowLine
 */
import { isNullOrEmpty } from 'M/util/Utils';
import OLFeature from 'ol/Feature';
import { unByKey } from 'ol/Observable';
import { toContext as toContextRender } from 'ol/render';
import RenderFeature from 'ol/render/Feature';
import Simple from './Simple';
import postRender from '../util/render';
import OLStyleFlowLine from '../ext/OLStyleFlowLine';
import '../ext/cspline';
/**
 * @classdesc
 * Crea un estilo de línea de flujo
 * con parámetros especificados por el usuario.
 * @api
 * @namespace M.impl.style.FlowLine
 *
 */
class FlowLine extends Simple {
  /**
   * Constructor principal de la clase.
   * @constructor
   * @implements {M.impl.style.Simple}
   * @param {object} options Opciones de estilo:
   * - color: Color de la línea.
   * - color2: Color de la línea 2.
   * - arrowColor: Color de la flecha.
   * - width: Ancho de la línea.
   * - width2: Ancho de la línea 2.
   * - arrow: Si tiene flecha.
   * - lineCap: Tipo de línea.
   * - offset0: Desplazamiento de la línea.
   * - offset1: Desplazamiento de la línea 2.
   * @api stable
   */
  constructor(options) {
    super(options);
    this.olStyleFn_ = this.updateFacadeOptions(options);
  }

  /**
   * Este método actualiza las opciones de la fachada
   * (patrón estructural como una capa de abstracción con un patrón de diseño).
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @public
   * @param {object} options Opciones.
   * @function
   * @return {Array<object>} Estilo de la fachada.
   * @api stable
   */
  updateFacadeOptions(options) {
    return (feature) => {
      let featureVariable = feature;
      if (!(featureVariable instanceof OLFeature || feature instanceof RenderFeature)) {
        featureVariable = this;
      }
      const flow = options;
      const flowStyle = new OLStyleFlowLine();
      const getValue = Simple.getValue;
      if (!isNullOrEmpty(flow)) {
        flowStyle.setColor(getValue(flow.color, featureVariable));
        flowStyle.setColor2(getValue(flow.color2, featureVariable));
        flowStyle.setArrowColor(getValue(flow.arrowColor, featureVariable));
        flowStyle.setWidth(getValue(flow.width, featureVariable));
        flowStyle.setWidth2(getValue(flow.width2, featureVariable));
        flowStyle.setArrow(getValue(flow.arrow, featureVariable));
        flowStyle.setLineCap(getValue(flow.lineCap, featureVariable));
        flowStyle.setOffset(getValue(flow.offset0, featureVariable), 0);
        flowStyle.setOffset(getValue(flow.offset1, featureVariable), 1);
      }
      return [flowStyle];
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
    super.applyToLayer(layer);

    const olLayer = layer.getImpl().getOL3Layer();
    if (!isNullOrEmpty(olLayer)) {
      this.postComposeEvtKey_ = olLayer.on('postcompose', postRender, olLayer);
    }
  }

  /**
   * Este método elimina el estilo de la capa.
   * @function
   * @public
   * @api stable
   */
  unapply() {
    unByKey(this.postComposeEvtKey_);
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
    this.updateFacadeOptions(this.options_);
    const canvasSize = FlowLine.getCanvasSize();
    const vectorContext = toContextRender(canvas.getContext('2d'), {
      size: canvasSize,
    });
    const applyStyle = this.olStyleFn_()[0];
    vectorContext.setStyle(applyStyle);
  }

  /**
   * Este método devuelve el tamaño del "canvas".
   *
   * @public
   * @function
   * @returns {Array} Tamaño.
   * @api stable
   */
  static getCanvasSize() {
    return [25, 15];
  }
}
export default FlowLine;
