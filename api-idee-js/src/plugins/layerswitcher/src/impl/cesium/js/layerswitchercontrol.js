/**
 * @module IDEE/impl/control/LayerswitcherControl
 */

// Espera para agrupar en un único repintado los eventos seguidos del visor
const RENDER_DELAY = 250;

// Tipos de capa que no se pueden mostrar sobre el globo
const UNSUPPORTED_TYPES = ['maplibre'];

export default class LayerswitcherControl extends IDEE.impl.Control {
  addTo(map, html) {
    this.facadeMap_ = map;
    super.addTo(map, html);
  }

  /**
   * Repinta el control cuando cambia la vista o las capas del visor (equivale al
   * "rendercomplete" de OpenLayers): al terminar de mover la cámara (capas fuera de
   * rango) y al cambiar las colecciones de imágenes y fuentes de datos. La carga de
   * teselas no repinta: no cambia el panel y lo rehacía sin parar mientras carga el globo.
   * @public
   * @function
   * @param {IDEE.Map} map Mapa.
   */
  registerEvent(map) {
    this.removeRenderComplete();
    this.facadeMap_ = map;
    if (IDEE.utils.isNullOrEmpty(map)) return;
    const viewer = map.getMapImpl();
    const schedule = () => {
      clearTimeout(this.renderTimeout_);
      this.renderTimeout_ = setTimeout(() => this.renderControl(), RENDER_DELAY);
    };
    this.fnRender = schedule;
    const { imageryLayers, dataSources } = viewer;
    this.removers_ = [
      viewer.camera.moveEnd.addEventListener(schedule),
      imageryLayers.layerAdded.addEventListener(schedule),
      imageryLayers.layerRemoved.addEventListener(schedule),
      imageryLayers.layerMoved.addEventListener(schedule),
      imageryLayers.layerShownOrHidden.addEventListener(schedule),
      dataSources.dataSourceAdded.addEventListener(schedule),
      dataSources.dataSourceRemoved.addEventListener(schedule),
      dataSources.dataSourceMoved.addEventListener(schedule),
    ];
  }

  // Renderiza el control
  renderControl() {
    if (!IDEE.utils.isNullOrEmpty(this.fnRender)) this.facadeControl.render();
  }

  // Elimina las suscripciones al visor
  removeRenderComplete() {
    (this.removers_ || []).forEach((remove) => remove());
    this.removers_ = [];
    clearTimeout(this.renderTimeout_);
    this.fnRender = null;
  }

  // Indica si el control se repinta con los cambios del visor
  isRenderEventRegistered() {
    return !IDEE.utils.isNullOrEmpty(this.fnRender);
  }

  /**
   * Encuadre actual del mapa en EPSG:4326 (Cesium ya lo da en grados).
   * @public
   * @function
   * @param {IDEE.Map} map Mapa.
   * @returns {Array<Number>|null} [minX, minY, maxX, maxY].
   */
  getBbox4326(map) {
    const bbox = map.getBbox();
    if (IDEE.utils.isNullOrEmpty(bbox)) return null;
    return [bbox.x.min, bbox.y.min, bbox.x.max, bbox.y.max];
  }

  // Las capas WMTS se piden en Web Mercator (o GoogleMapsCompatible), que Cesium pinta
  getCapabilitiesProjectionCode() {
    return 'EPSG:3857';
  }

  // MapLibre necesita su propio motor sincronizado con la cámara: no está disponible en 3D
  isLayerTypeSupported(type) {
    return !UNSUPPORTED_TYPES.includes(String(type).toLowerCase());
  }

  /**
   * Herramientas no disponibles para una capa en Cesium.
   * @public
   * @function
   * @param {IDEE.Layer} layer Capa.
   * @returns {Object} { transparency, style, zoom } a false si no están disponibles.
   */
  getLayerToolsSupport(layer) {
    if (layer.type === 'Terrain') return { transparency: false, style: false, zoom: false };
    // El estilo ráster de IDEE no está implementado en Cesium
    if (layer.type === 'GeoTIFF') return { style: false };
    return {};
  }

  /**
   * Encuadra las capas que no tienen extensión en grados (teselas 3D).
   * @public
   * @function
   * @param {IDEE.Map} map Mapa.
   * @param {IDEE.Layer} layer Capa.
   * @returns {Boolean} Verdadero si la ha encuadrado.
   */
  zoomToLayer(map, layer) {
    if (layer.type !== 'Tiles3D') return false;
    const tileset = layer.getImpl().getLayer();
    if (IDEE.utils.isNullOrEmpty(tileset)) return false;
    map.getMapImpl().flyTo(tileset, { duration: 0.5 });
    return true;
  }

  // Se llama cuando se destruye el control
  destroy() {
    this.removeRenderComplete();
  }
}
