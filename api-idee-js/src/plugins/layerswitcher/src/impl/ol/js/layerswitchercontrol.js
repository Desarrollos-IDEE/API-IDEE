/**
 * @module M/impl/control/LayerswitcherControl
 */
export default class LayerswitcherControl extends M.impl.Control {
  addTo(map, html) {
    this.facadeMap_ = map;
    super.addTo(map, html);
  }

  // Registra evento rendercomplete del mapa para renderizar el control
  registerEvent(map) {
    this.facadeMap_ = map;
    if (!M.utils.isNullOrEmpty(map)) {
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
    if (!M.utils.isNullOrEmpty(this.olMap) && !M.utils.isNullOrEmpty(this.fnRender)) {
      this.olMap.un('rendercomplete', this.fnRender);
      this.fnRender = null;
    }
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
