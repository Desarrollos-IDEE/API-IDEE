/**
 * @module IDEE/impl/control/HistogramControl
 */

/**
 * Implementación OpenLayers del muestreo y dibujo de histogramas.
 */
export default class HistogramControl {
  constructor() {
    /**
     * Interacción de dibujo activa.
     * @private
     * @type {ol.interaction.Draw|null}
     */
    this.drawInteraction_ = null;
  }

  /**
   * Indica si el dibujo está disponible en este mapa.
   *
   * @public
   * @function
   * @returns {boolean}
   * @api
   */
  isDrawAvailable() {
    return typeof ol !== 'undefined'
      && !!ol.interaction
      && !!ol.interaction.Draw;
  }

  /**
   * Inicia el dibujo de una geometría.
   *
   * @public
   * @function
   * @param {IDEE.Map} map Mapa.
   * @param {IDEE.layer.Vector} vectorLayer Capa de dibujo.
   * @param {string} type Polygon | LineString | Point
   * @param {Function} onDrawEnd Callback con el feature de fachada.
   * @api
   */
  startDraw(map, vectorLayer, type, onDrawEnd) {
    if (!this.isDrawAvailable() || !map || !vectorLayer) {
      return;
    }

    this.stopDraw(map);

    const olMap = map.getMapImpl();
    const olLayer = vectorLayer.getImpl().getLayer();
    const source = olLayer.getSource();

    this.drawInteraction_ = new ol.interaction.Draw({
      source,
      type,
    });

    this.drawInteraction_.on('drawend', (evt) => {
      window.setTimeout(() => {
        const facadeFeature = IDEE.impl.Feature.olFeature2Facade(evt.feature);
        onDrawEnd(facadeFeature);
      }, 0);
    });

    olMap.addInteraction(this.drawInteraction_);
  }

  /**
   * Detiene la interacción de dibujo activa.
   *
   * @public
   * @function
   * @param {IDEE.Map} map Mapa.
   * @api
   */
  stopDraw(map) {
    if (!this.drawInteraction_) {
      return;
    }
    if (map && typeof map.getMapImpl === 'function') {
      map.getMapImpl().removeInteraction(this.drawInteraction_);
    }
    this.drawInteraction_ = null;
  }

  /**
   * Obtiene los valores de banda del ráster en una coordenada del mapa.
   *
   * @public
   * @function
   * @param {IDEE.Map} map Mapa.
   * @param {IDEE.layer.GeoTIFF} layer Capa ráster.
   * @param {Array<number>} coordinates Coordenada del mapa.
   * @returns {TypedArray|Array<number>|null}
   * @api
   */
  getRasterDataAtCoordinate(map, layer, coordinates) {
    if (!map || !layer || typeof layer.getData !== 'function') {
      return null;
    }
    const olMap = map.getMapImpl();
    if (!olMap || typeof olMap.getPixelFromCoordinate !== 'function') {
      return null;
    }
    const pixel = olMap.getPixelFromCoordinate(coordinates);
    return layer.getData(pixel);
  }
}
