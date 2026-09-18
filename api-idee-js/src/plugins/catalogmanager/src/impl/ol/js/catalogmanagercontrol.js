/**
 * @module IDEE/impl/control/CatalogmanagerControl
 */

/**
 * @classdesc
 * Implementación OpenLayers del control Catalogmanager. Gestiona las interacciones
 * del mapa necesarias para los filtros espaciales (zoom por caja, selección de
 * geometrías) y la selección de ítems STAC representados como capas vectoriales.
 *
 * @extends {IDEE.impl.Control}
 * @api stable
 */
export default class CatalogmanagerControl extends IDEE.impl.Control {
  /**
   * Añade el control al mapa
   *
   * @public
   * @function
   * @param {IDEE.Map} map Mapa donde se añadirá el plugin
   * @param {HTMLElement} html HTML del plugin
   * @api stable
   */
  addTo(map, html) {
    super.addTo(map, html);
  }

  /**
   * Crea e inicializa todas las interacciones del mapa asociadas al control
   *
   * @public
   * @function
   * @param {IDEE.Map} map Mapa asociado al control
   * @param {IDEE.control.CatalogmanagerControl} facadeControl Control de fachada
   */
  createAllInteractions(map, facadeControl) {
    this.facadeControl_ = facadeControl;
    this.facadeMap_ = map;
    this.createDrawExtentInteraction();
    this.createSelectGeometryInteraction();
  }

  /**
   * Crea la interacción de dibujo de extensión mediante arrastre (DragZoom)
   *
   * @private
   * @function
   */
  createDrawExtentInteraction() {
    this.dragBox = new ol.interaction.DragZoom({
      condition: () => true,
    });
    this.dragBox.on('boxend', (evt) => this.onBoxEnd(evt));
    this.dragBox.setActive(false);
    this.facadeMap_.getMapImpl().addInteraction(this.dragBox);
  }

  /**
   * Crea la interacción de selección de geometrías de capas de referencia
   *
   * @private
   * @function
   */
  createSelectGeometryInteraction() {
    this.selectGeometry = new ol.interaction.Select({
      style: null,
    });
    this.selectGeometry.on('select', (evt) => this.onSelectGeometry(evt));
    this.selectGeometry.setActive(false);
    this.facadeMap_.getMapImpl().addInteraction(this.selectGeometry);
  }

  /**
   * Crea la interacción de selección de ítems STAC en capas vectoriales
   *
   * @private
   * @function
   */
  createSelectItemInteraction() {
    this.selectItem = new ol.interaction.Select({
      style: null,
      layers: this.olLayers_,
    });
    this.selectItem.on('select', (evt) => this.onSelectItem(evt));
    this.facadeMap_.getMapImpl().addInteraction(this.selectItem);
  }

  /**
   * Crea la interacción de hover de ítems STAC en capas vectoriales
   *
   * @private
   * @function
   */
  createHoverItemInteraction() {
    this.hoverItem = new ol.interaction.Select({
      style: null,
      layers: this.olLayers_,
      condition: ol.events.condition.pointerMove,
      toggleCondition: ol.events.condition.never,
    });
    this.hoverItem.on('select', (evt) => this.onHoverItem(evt));
    this.facadeMap_.getMapImpl().addInteraction(this.hoverItem);
  }

  /**
   * Añade una capa a la interacción de selección de ítems, creándola si no existe
   *
   * @public
   * @function
   * @param {ol.layer.Layer} olLayer Capa OpenLayers a incluir en la selección
   */
  addLayerToSelectItem(olLayer) {
    if (!this.selectItem && !this.hoverItem) {
      this.olLayers_ = [olLayer];
      this.createSelectItemInteraction();
      this.createHoverItemInteraction();
    } else {
      this.olLayers_[0] = olLayer;
    }
  }

  /**
   * Activa la interacción de dibujo de extensión por arrastre
   *
   * @public
   * @function
   */
  activateDrawExtent() {
    this.dragBox.setActive(true);
  }

  /**
   * Desactiva la interacción de dibujo de extensión por arrastre
   *
   * @public
   * @function
   */
  deactivateDrawExtent() {
    this.dragBox.setActive(false);
  }

  /**
   * Activa la interacción de selección de geometrías de referencia
   *
   * @public
   * @function
   */
  activateSelectGeometry() {
    this.selectGeometry.setActive(true);
  }

  /**
   * Desactiva la interacción de selección de geometrías de referencia
   *
   * @public
   * @function
   */
  deactivateSelectGeometry() {
    this.selectGeometry.setActive(false);
  }

  /**
   * Desactiva todas las interacciones espaciales del control
   *
   * @public
   * @function
   */
  deactivateAllInteractions() {
    this.deactivateDrawExtent();
    this.deactivateSelectGeometry();
  }

  /**
   * Gestiona el fin del dibujo de extensión y aplica el filtro espacial
   *
   * @private
   * @function
   * @param {ol.interaction.DragBoxEvent} evt Evento boxend de DragZoom
   */
  onBoxEnd(evt) {
    const geom = this.dragBox.getGeometry();
    const extent = geom.getExtent();
    this.facadeControl_.drawBoxExtent(geom.getCoordinates());
    this.facadeControl_.setSpatialFilterByExtent(this.transformExtent(extent, this.facadeMap_.getProjection().code, 'EPSG:4326'));
  }

  /**
   * Gestiona la selección de un ítem STAC en el mapa
   *
   * @private
   * @function
   * @param {ol.interaction.SelectEvent} evt Evento select de la interacción
   */
  onSelectItem(evt) {
    const features = this.selectItem.getFeatures();
    const featuresArray = features.getArray();
    if (featuresArray.length === 0) {
      return;
    }
    const itemId = featuresArray[0].getId();
    features.clear();
    this.facadeControl_.onItemSelect(itemId);
  }

  /**
   * Gestiona el hover de un ítem STAC en el mapa
   *
   * @private
   * @function
   * @param {ol.interaction.SelectEvent} evt Evento select de la interacción
   */
  onHoverItem(evt) {
    const features = this.hoverItem.getFeatures();
    const featuresArray = features.getArray();
    if (featuresArray.length === 0) {
      return;
    }
    const itemId = featuresArray[0].getId();
    features.clear();
    this.facadeControl_.onItemHover(itemId);
  }

  /**
   * Gestiona la selección de una geometría de referencia y aplica el filtro espacial
   *
   * @private
   * @function
   * @param {ol.interaction.SelectEvent} evt Evento select de la interacción
   */
  onSelectGeometry(evt) {
    const features = this.selectGeometry.getFeatures().getArray();
    if (features.length === 0) {
      return;
    }
    const popup = this.facadeMap_.getPopup();
    if (popup) {
      this.facadeMap_.removePopup(popup);
    }
    const geom = features[0].getGeometry();
    this.facadeControl_.setSpatialFilterByExtent(this.transformExtent(geom.getExtent(), this.facadeMap_.getProjection().code, 'EPSG:4326'));
  }

  /**
   * Transforma una extensión entre sistemas de referencia
   *
   * @public
   * @function
   * @param {Array<number>} extent Extensión [minX, minY, maxX, maxY]
   * @param {string} orig Código EPSG de origen
   * @param {string} dest Código EPSG de destino
   * @returns {Array<number>} Extensión transformada
   */
  transformExtent(extent, orig, dest) {
    return ol.proj.transformExtent(extent, orig, dest);
  }
}
