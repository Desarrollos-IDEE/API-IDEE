/**
 * @module IDEE/impl/webgl/WebGLLayerProvider
 */
import OLLayerVector from 'ol/layer/Vector';
import OLLayerVectorTile from 'ol/layer/VectorTile';
import OLLayerTile from 'ol/layer/Tile';
import OLLayerWebGLVector from 'ol/layer/WebGLVector';
import OLLayerWebGLVectorTile from 'ol/layer/WebGLVectorTile';
import OLLayerWebGLTile from 'ol/layer/WebGLTile';
import OLSourceDataTile from 'ol/source/DataTile';
import * as RendererType from './RendererType';

const INITIAL_FLAT_STYLE = {
  'fill-color': 'rgba(255, 255, 255, 0.4)',
  'stroke-color': '#3399CC',
  'stroke-width': 1.25,
  'circle-radius': 5,
  'circle-fill-color': 'rgba(255, 255, 255, 0.4)',
  'circle-stroke-color': '#3399CC',
  'circle-stroke-width': 1.25,
};

/**
 * Libera el renderer de una capa WebGL cuando se elimina del mapa.
 * @param {ol.layer.Layer} olLayer Capa WebGL.
 * @returns {ol.layer.Layer} La misma capa.
 */
const releaseRendererOnRemove = (olLayer) => {
  olLayer.on('change:map', () => {
    if (!olLayer.getMapInternal()) {
      olLayer.clearRenderer();
    }
  });
  return olLayer;
};

/**
 * Crea una capa vectorial de OpenLayers.
 *
 * @function
 * @public
 * @param {Object} options Opciones de la capa de OpenLayers.
 * @param {string} renderer IDEE.impl.webgl.RendererType.
 * @returns {ol.layer.Vector|ol.layer.WebGLVector} Capa de OpenLayers.
 * @api
 */
export const createVectorLayer = (options, renderer) => {
  if (renderer === RendererType.WEBGL) {
    const olLayer = new OLLayerWebGLVector({ style: INITIAL_FLAT_STYLE, ...options });
    const { render } = olLayer;
    olLayer.render = (frameState, target) => (olLayer.getSource()
      ? render.call(olLayer, frameState, target) : null);
    olLayer.on('change:source', () => Promise.resolve().then(() => {
      if (!olLayer.disposed) {
        olLayer.clearRenderer();
        olLayer.changed();
      }
    }));
    return releaseRendererOnRemove(olLayer);
  }
  return new OLLayerVector(options);
};

/**
 * Crea una capa vectorial teselada de OpenLayers.
 *
 * @function
 * @public
 * @param {Object} options Opciones de la capa de OpenLayers.
 * @param {string} renderer IDEE.impl.webgl.RendererType.
 * @returns {ol.layer.VectorTile|ol.layer.WebGLVectorTile} Capa de OpenLayers.
 * @api
 */
export const createVectorTileLayer = (options, renderer) => {
  if (renderer === RendererType.WEBGL) {
    return releaseRendererOnRemove(new OLLayerWebGLVectorTile({
      style: INITIAL_FLAT_STYLE,
      ...options,
    }));
  }
  return new OLLayerVectorTile(options);
};

/**
 * Crea una capa ráster teselada de OpenLayers.
 *
 * @function
 * @public
 * @param {Object} options Opciones de la capa de OpenLayers.
 * @param {string} renderer IDEE.impl.webgl.RendererType.
 * @returns {ol.layer.Tile|ol.layer.WebGLTile} Capa de OpenLayers.
 * @api
 */
export const createTileLayer = (options, renderer) => {
  if (renderer === RendererType.WEBGL) {
    return releaseRendererOnRemove(new OLLayerWebGLTile(options));
  }
  return new OLLayerTile(options);
};

/**
 * Asigna un estilo plano a una capa WebGL.
 *
 * @function
 * @public
 * @param {ol.layer.WebGLVector|ol.layer.WebGLVectorTile} olLayer Capa WebGL.
 * @param {Array<Object>|Object} flatStyle Estilo plano.
 * @api
 */
export const setFlatStyle = (olLayer, flatStyle) => {
  Promise.resolve().then(() => {
    if (!olLayer.disposed) {
      olLayer.setStyle(flatStyle);
    }
  });
};

/**
 * Indica el renderer de una capa de OpenLayers ya creada.
 *
 * @function
 * @public
 * @param {ol.layer.Base} olLayer Capa de OpenLayers.
 * @returns {string} IDEE.impl.webgl.RendererType.
 * @api
 */
export const getLayerRenderer = (olLayer) => {
  const isWebGL = olLayer instanceof OLLayerWebGLVector
    || olLayer instanceof OLLayerWebGLVectorTile
    || olLayer instanceof OLLayerWebGLTile;
  return isWebGL ? RendererType.WEBGL : RendererType.CANVAS;
};

/**
 * Crea la capa Canvas equivalente a una capa WebGL.
 *
 * @function
 * @public
 * @param {ol.layer.Base} olLayer Capa WebGL de OpenLayers.
 * @returns {ol.layer.Base|null} Capa Canvas, o nulo si no tiene equivalente
 * @api
 */
export const createCanvasEquivalent = (olLayer) => {
  const source = olLayer.getSource();
  const options = {
    source,
    properties: olLayer.getProperties(),
    opacity: olLayer.getOpacity(),
    visible: olLayer.getVisible(),
    zIndex: olLayer.getZIndex(),
    extent: olLayer.getExtent(),
    minResolution: olLayer.getMinResolution(),
    maxResolution: olLayer.getMaxResolution(),
    minZoom: olLayer.getMinZoom(),
    maxZoom: olLayer.getMaxZoom(),
  };
  ['source', 'map', 'opacity', 'visible', 'zIndex', 'extent', 'minResolution',
    'maxResolution', 'minZoom', 'maxZoom'].forEach((key) => delete options.properties[key]);

  if (olLayer instanceof OLLayerWebGLVector) {
    return createVectorLayer(options, RendererType.CANVAS);
  }
  if (olLayer instanceof OLLayerWebGLVectorTile) {
    return createVectorTileLayer(options, RendererType.CANVAS);
  }
  if (olLayer instanceof OLLayerWebGLTile && !(source instanceof OLSourceDataTile)) {
    return createTileLayer(options, RendererType.CANVAS);
  }
  return null;
};
