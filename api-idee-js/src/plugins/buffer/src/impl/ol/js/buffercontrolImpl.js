/**
 * @module M/impl/control/BufferControl
 */
export default class BufferControl extends M.impl.Control {
  /**
   * This function adds the control to the specified map
   *
   * @public
   * @function
   * @param {M.Map} map to add the plugin
   * @param {HTMLElement} html of the plugin
   * @api stable
   */
  addTo(map, html) {
    // obtengo la interacción por defecto del dblclick para manejarla
    const olMap = map.getMapImpl();
    olMap.getInteractions().forEach((interaction) => {
      if (interaction instanceof ol.interaction.DoubleClickZoom) {
        this.dblClickInteraction_ = interaction;
      }
    });

    // super addTo - don't delete
    super.addTo(map, html);
  }

  // Add your own functions
  activateClick(map) {
    // desactivo el zoom al dobleclick
    this.dblClickInteraction_.setActive(false);

    // añado un listener al evento dblclick
    const olMap = map.getMapImpl();
    olMap.on('dblclick', (evt) => {
      // disparo un custom event con las coordenadas del dobleclick
      const customEvt = new CustomEvent('mapclicked', {
        detail: evt.coordinate,
        bubbles: true,
      });
      map.getContainer().dispatchEvent(customEvt);
    });
  }

  deactivateClick(map) {
    // activo el zoom al dobleclick
    this.dblClickInteraction_.setActive(true);

    // elimino el listener del evento
    map.getMapImpl().removeEventListener('dblclick');
  }

  /**
   * This function checks if an interaction is
   * an instance of Draw or Modify
   */
  isInteractionInstanceOfDrawOrModify(interaction) {
    if (interaction instanceof ol.interaction.Draw
        || interaction instanceof ol.interaction.Modify) {
      return true;
    }
    return false;
  }

  /**
   * This function creates a new ol.interaction.Draw object
   * @param {*} features
   * @param {*} type
   */
  createNewDrawInteraction(olFeature, type) {
    return new ol.interaction.Draw({
      features: olFeature,
      type,
    });
  }

  /**
   * This function creates a new ol.interaction.Modify object
   * @param {*} features
   */
  createNewModifyInteraction(olLayer) {
    return new ol.interaction.Modify({
      source: olLayer.getSource(),
      deleteCondition: (event) => {
        return ol.events.condition.shiftKeyOnly(event)
          && ol.events.condition.singleClick(event);
      },
    });
  }

  removeInteraction(interaction) {
    if (interaction instanceof ol.interaction.Draw
        || interaction instanceof ol.interaction.Modify) {
      this.facadeMap_.getMapImpl().removeInteraction(interaction);
    }
  }

  setStyle(color, olFeature) {
    if (olFeature) {
      olFeature.setStyle(this.createStyle(color));
    }
  }

  createStyle(color) {
    return new ol.style.Style({
      fill: new ol.style.Fill({ color: color.replace(')', ', 0.2)') }),
      stroke: new ol.style.Stroke({ color, width: 3 }),
      image: new ol.style.Circle({
        radius: 7,
        fill: new ol.style.Fill({ color }),
      }),
    });
  }
}
