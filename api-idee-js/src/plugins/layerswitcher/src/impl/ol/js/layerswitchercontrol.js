/**
 * @module IDEE/impl/control/LayerswitcherControl
 */
export default class LayerswitcherControl extends IDEE.impl.Control {
  addTo(map, html) {
    this.facadeMap_ = map;
    super.addTo(map, html);
  }

  // Registra evento rendercomplete del mapa para renderizar el control
  registerEvent(map) {
    this.facadeMap_ = map;
    if (!IDEE.utils.isNullOrEmpty(map)) {
      this.fnRender = this.renderControl.bind(this);
      this.olMap = map.getMapImpl();
      this.olMap.on('rendercomplete', this.fnRender);
    }
  }

  // Renderiza el control
  renderControl() {
    this.facadeControl.render();
  }

  // Elimina evento rendercomplete del mapa
  removeRenderComplete() {
    if (!IDEE.utils.isNullOrEmpty(this.olMap) && !IDEE.utils.isNullOrEmpty(this.fnRender)) {
      this.olMap.un('rendercomplete', this.fnRender);
      this.fnRender = null;
    }
  }

  // Indica si el control se repinta al terminar de pintarse el mapa
  isRenderEventRegistered() {
    return !IDEE.utils.isNullOrEmpty(this.fnRender);
  }

  /**
   * Encuadre actual del mapa en EPSG:4326.
   * @public
   * @function
   * @param {IDEE.Map} map Mapa.
   * @returns {Array<Number>|null} [minX, minY, maxX, maxY].
   */
  getBbox4326(map) {
    const bbox = map.getBbox();
    if (IDEE.utils.isNullOrEmpty(bbox)) return null;
    const { code } = map.getProjection();
    const min = this.getTransformedCoordinates(code, [bbox.x.min, bbox.y.min]);
    const max = this.getTransformedCoordinates(code, [bbox.x.max, bbox.y.max]);
    return [min[0], min[1], max[0], max[1]];
  }

  // Proyección con la que se leen las capas de las capacidades WMS y WMTS
  getCapabilitiesProjectionCode(map) {
    return map.getProjection().code;
  }

  // Las teselas 3D y el terreno solo existen en la implementación de Cesium
  isLayerTypeSupported(type) {
    return !['tiles3d', 'terrain'].includes(String(type).toLowerCase());
  }

  // Herramientas no disponibles para la capa (ninguna en OpenLayers)
  getLayerToolsSupport() {
    return {};
  }

  // El encuadre de la capa lo resuelve la fachada con su extensión
  zoomToLayer() {
    return false;
  }

  /**
   * Transforms x,y coordinates to 4326 on coordinates array.
   * @public
   * @function
   * @api
   * @param {String} codeProjection
   * @param {Array<Number>} oldCoordinates
   */
  getTransformedCoordinates(codeProjection, oldCoordinates) {
    const transformFunction = ol.proj.getTransform(codeProjection, 'EPSG:4326');
    return this.getFullCoordinates(
      oldCoordinates,
      transformFunction(this.getXY(oldCoordinates)),
    );
  }

  /**
   * Substitutes x, y coordinates on coordinate set (x, y, altitude...)
   */
  getFullCoordinates(oldCoordinates, newXY) {
    const newCoordinates = oldCoordinates;
    newCoordinates[0] = newXY[0];
    newCoordinates[1] = newXY[1];
    return newCoordinates;
  }

  /**
   * Given a coordinate set (x, y, altitude?), returns [x,y].
   */
  getXY(coordinatesSet) {
    const coordinateCopy = [];
    for (let i = 0; i < coordinatesSet.length; i += 1) coordinateCopy.push(coordinatesSet[i]);
    while (coordinateCopy.length > 2) coordinateCopy.pop();
    return coordinateCopy;
  }

  // Se llama cuando se destruye el control para eliminar el evento rendercomplete
  destroy() {
    this.removeRenderComplete();
  }
}
