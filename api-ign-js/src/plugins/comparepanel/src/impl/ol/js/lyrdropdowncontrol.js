/**
 * @module M/impl/control/LyrdropdownControl
 */

// import LayerdropInteraction from 'impl/LayerdropInteraction';

export default class LyrdropdownControl extends M.impl.Control {
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
    /* const olMap = map.getMapImpl();
    olMap.getInteractions().forEach((interaction) => {
      if (interaction instanceof ol.interaction.DoubleClickZoom) {
        this.dblClickInteraction_ = interaction;
      }
    }); */

    this.map = map;
    this.olMap = map.getMapImpl();
    // super addTo - don't delete
    super.addTo(map, html);
  }

  /**
   * Effects on the layer
   *
   * @public
   * @function
   * @param { M.Layer } layer layer to which to assign an effect
   * @api stable
   */
  setLayer(lyrA) {
    lyrA.setVisible(true);
    // lyrA.setZIndex(4500);
    // e2m: Important control number interactions this.olMap.interactions.array_
    // this.olMap.addLayer(lyrA);
    // const olMap = map.getMapImpl();

    // e2m:Recorrer las interacciones cargadas
    /* this.olMap.getInteractions().forEach((interaction) => {
      console.log(interaction);
    });
    console.log('Número de interacciones:' + this.olMap.interactions.array_.length); */

    /*
    this.layerdropInteraction_ = new LayerdropInteraction({
      lyrA,
    });

    this.olMap.addInteraction(this.layerdropInteraction_);
    */
  }

  /**
   * Set layer
   *
   * @public
   * @function
   * @param { M.layer } layer layer to assign effect
   * @api stable
   */
  addLayer(layer) {
    // this.layerdropInteraction_.addLayer(layer.getImpl().getOL3Layer());
  }

  /**
   * Remove effects
   *
   * @public
   * @function
   * @api stable
   */
  removeEffects() {
    // this.olMap.removeInteraction(this.layerdropInteraction_);
  }

  /**
   * Remove layer
   *
   * @public
   * @function
   * @param { M.layer } layer to remove
   * @api stable
   */
  removeLayer(layer) {
    // this.layerdropInteraction_.removeLayer(layer.getImpl().getOL3Layer());
  }
}
