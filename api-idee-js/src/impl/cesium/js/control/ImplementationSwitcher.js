/**
 * @module IDEE/impl/control/ImplementationSwitcher
 */
import {
  Cartesian2,
  Cartesian3,
  Cartographic,
  Math as CesiumMath,
} from 'cesium';
import Control from './Control';

const METERS_PER_DEGREE = 111320;

const clampBbox = ([minx, miny, maxx, maxy]) => [
  Math.max(minx, -180), Math.max(miny, -90), Math.min(maxx, 180), Math.min(maxy, 90),
];

/**
 * Vista del mapa en EPSG:4326 (centro y encuadre) y su giro (heading de la cámara cambiado
 * de signo, como el giro de OpenLayers), para llevarlos a otra implementación.
 * El centro es el punto del suelo en el centro de la pantalla y el encuadre, el que ocuparía
 * la pantalla en vista cenital alrededor de ese punto (también con la cámara inclinada).
 *
 * @function
 * @param {IDEE.Map} map Mapa de fachada.
 * @returns {Object} { center: [lon, lat], bbox: [minx, miny, maxx, maxy], rotation: radianes }
 * @public
 */
export const getViewState = (map) => {
  const { camera, scene } = map.getMapImpl();
  const { canvas } = scene;
  const rotation = CesiumMath.negativePiToPi(-camera.heading);
  const pixel = new Cartesian2(canvas.clientWidth / 2, canvas.clientHeight / 2);
  const ray = camera.getPickRay(pixel);
  let position = ray ? scene.globe.pick(ray, scene) : undefined;
  if (!position) position = camera.pickEllipsoid(pixel, scene.globe.ellipsoid);

  // La escala es la de la pantalla sobre el punto del centro (distancia de la cámara y campo
  // de visión): computeViewRectangle devuelve todo el globo visible, no lo que ocupa la pantalla
  let bbox = null;
  let center = null;
  if (position) {
    const { longitude, latitude } = Cartographic.fromCartesian(position);
    center = [CesiumMath.toDegrees(longitude), CesiumMath.toDegrees(latitude)];
    // El fov de Cesium es el del lado mayor del lienzo
    const distance = Cartesian3.distance(camera.positionWC, position);
    const fov = camera.frustum.fov || CesiumMath.PI_OVER_THREE;
    const aspect = (canvas.clientWidth / canvas.clientHeight) || 1;
    const halfLarge = distance * Math.tan(fov / 2);
    const halfWidth = aspect >= 1 ? halfLarge : halfLarge * aspect;
    const halfHeight = aspect >= 1 ? halfLarge / aspect : halfLarge;
    const deltaLat = halfHeight / METERS_PER_DEGREE;
    const deltaLon = halfWidth / (METERS_PER_DEGREE * Math.max(Math.cos(latitude), 0.01));
    bbox = [
      center[0] - deltaLon, center[1] - deltaLat, center[0] + deltaLon, center[1] + deltaLat,
    ];
  }
  if (bbox === null) {
    const { x, y } = map.getBbox();
    bbox = [x.min, y.min, x.max, y.max];
  }
  if (center === null) center = [(bbox[0] + bbox[2]) / 2, (bbox[1] + bbox[3]) / 2];

  return { center, bbox: clampBbox(bbox), rotation };
};

/**
 * Encuadre inicial del mapa en grados: el tamaño del encuadre guardado, centrado en el
 * centro guardado (el encuadre en grados de una vista Mercator no es simétrico).
 *
 * @function
 * @param {Object} viewState Vista guardada.
 * @returns {Array<Number>} Encuadre en grados, o null.
 * @public
 */
export const toMapBbox = (viewState) => {
  if (!viewState || !viewState.bbox) return null;
  const { bbox, center } = viewState;
  if (!center) return clampBbox(bbox);
  const halfLon = (bbox[2] - bbox[0]) / 2;
  const halfLat = (bbox[3] - bbox[1]) / 2;
  return clampBbox([
    center[0] - halfLon, center[1] - halfLat, center[0] + halfLon, center[1] + halfLat,
  ]);
};

/**
 * Aplica al mapa recién creado la vista guardada: cámara cenital sobre el centro, a la altura
 * con la que la pantalla abarca el ancho del encuadre (la inversa de getViewState), y el giro
 * como heading. `setView` con un rectángulo grande no deja la cámara sobre su centro.
 *
 * @function
 * @param {IDEE.Map} map Mapa de fachada.
 * @param {Object} viewState Vista guardada.
 * @public
 */
export const applyViewState = (map, viewState) => {
  if (!viewState || !viewState.bbox) return;
  const { camera, scene } = map.getMapImpl();
  const { canvas } = scene;
  const { bbox } = viewState;
  const [lon, lat] = viewState.center || [(bbox[0] + bbox[2]) / 2, (bbox[1] + bbox[3]) / 2];
  const cosLat = Math.max(Math.cos(CesiumMath.toRadians(lat)), 0.01);
  const halfWidth = ((bbox[2] - bbox[0]) / 2) * METERS_PER_DEGREE * cosLat;
  const fov = camera.frustum.fov || CesiumMath.PI_OVER_THREE;
  const aspect = (canvas.clientWidth / canvas.clientHeight) || 1;
  const tanHalfWidth = aspect >= 1 ? Math.tan(fov / 2) : Math.tan(fov / 2) * aspect;
  camera.setView({
    destination: Cartesian3.fromDegrees(lon, lat, halfWidth / tanHalfWidth),
    orientation: {
      heading: CesiumMath.zeroToTwoPi(-(viewState.rotation || 0)),
      pitch: -CesiumMath.PI_OVER_TWO,
      roll: 0,
    },
  });
};

class ImplementationSwitcher extends Control {}

export default ImplementationSwitcher;
