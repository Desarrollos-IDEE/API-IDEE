/**
 * @module IDEE/impl/control/ImplementationSwitcher
 */
import { transform, transformExtent } from 'ol/proj';
import Control from './Control';

/**
 * Vista del mapa en EPSG:4326 (centro y encuadre) y su giro, para llevarlos a otra
 * implementación. Con el mapa girado se usa la extensión sin rotar (centro ± resolución ×
 * tamaño / 2): al aplicarla y girar de nuevo se ve lo mismo.
 *
 * @function
 * @param {IDEE.Map} map Mapa de fachada.
 * @returns {Object} { center: [lon, lat], bbox: [minx, miny, maxx, maxy], rotation: radianes };
 * center y bbox son null si el mapa aún no tiene vista.
 * @public
 */
export const getViewState = (map) => {
  const olMap = map.getMapImpl();
  const view = olMap.getView();
  const projection = view.getProjection();
  const center = view.getCenter();
  const resolution = view.getResolution();
  const size = olMap.getSize();
  let bbox = null;
  if (center && resolution && size) {
    const halfWidth = (resolution * size[0]) / 2;
    const halfHeight = (resolution * size[1]) / 2;
    bbox = transformExtent([
      center[0] - halfWidth, center[1] - halfHeight,
      center[0] + halfWidth, center[1] + halfHeight,
    ], projection, 'EPSG:4326');
  }
  return {
    center: center ? transform(center, projection, 'EPSG:4326') : null,
    bbox,
    rotation: view.getRotation() || 0,
  };
};

/**
 * Encuadre inicial del mapa que se va a crear, en su proyección.
 *
 * @function
 * @param {Object} viewState Vista guardada.
 * @param {String} projectionCode Código de la proyección del mapa.
 * @returns {Array<Number>} Encuadre en la proyección del mapa, o null.
 * @public
 */
export const toMapBbox = (viewState, projectionCode) => {
  if (!viewState || !viewState.bbox) return null;
  return transformExtent(viewState.bbox, 'EPSG:4326', projectionCode);
};

/**
 * Aplica al mapa recién creado la vista exacta: el centro y la resolución que abarca el ancho
 * del encuadre (en la proyección del mapa el encuadre en grados no es simétrico ni conserva la
 * proporción, así que ajustarse a él aleja de más), y el giro.
 *
 * @function
 * @param {IDEE.Map} map Mapa de fachada.
 * @param {Object} viewState Vista guardada.
 * @public
 */
export const applyViewState = (map, viewState) => {
  if (!viewState) return;
  const olMap = map.getMapImpl();
  const view = olMap.getView();
  const projection = view.getProjection();
  if (viewState.center) view.setCenter(transform(viewState.center, 'EPSG:4326', projection));
  const size = olMap.getSize();
  if (viewState.bbox && size && size[0] > 0) {
    const [minx, , maxx] = transformExtent(viewState.bbox, 'EPSG:4326', projection);
    view.setResolution((maxx - minx) / size[0]);
  }
  if (viewState.rotation) view.setRotation(viewState.rotation);
};

class ImplementationSwitcher extends Control {}

export default ImplementationSwitcher;
