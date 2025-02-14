/**
 * @module M/impl/control/Lyrcomparecontrol
 */
import LyrcompareInteraction from 'impl/lyrcompareinteraction';

export default class Lyrcomparecontrol extends M.impl.Control {
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
    // super addTo - don't delete
    this.map = map;
    this.olMap = map.getMapImpl();
    // super.addTo(map, html);
  }

  /**
   * Effects on the layer
   *
   * @public
   * @function
   * @param { M.Layer } layer layer to which to assign an effect
   * @param { Number } opacityVal nivel de opacidad
   * @api stable
   */
  effectSelectedCurtain(lyrA, lyrB, lyrC, lyrD, opacityVal, staticDivision, comparisonMode) {
    if (lyrA === null && lyrB === null) {
      return;
    }

    lyrA.setVisible(true);
    lyrB.setVisible(true);
    this.transparentInteraction_ = new LyrcompareInteraction({
      opacityVal,
      lyrA,
      lyrB,
      lyrC,
      lyrD,
    });

    this.olMap.addInteraction(this.transparentInteraction_);
    this.setOpacity(opacityVal);
    this.setComparisonMode(comparisonMode);
    this.setStaticDivision(staticDivision);
  }

  /**
   * Layer visibility
   *
   * @public
   * @function
   * @param { Number } opacityVal opacidad de las capas
   * @api stable
   */
  setVisibilityLayersCD() {
    if (this.transparentInteraction_ !== undefined) {
      this.transparentInteraction_.setVisibilityLayersCD();
    }
  }

  /**
   * Layers opacity
   *
   * @public
   * @function
   * @param { Number } opacityVal opacidad de las capas
   * @api stable
   */
  setOpacity(opacityVal) {
    if (this.transparentInteraction_ !== undefined) {
      this.transparentInteraction_.setOpacity(opacityVal);
    }
  }

  /**
     * Layers comparison mode
     *
     * @public
     * @function
     * @param { Number } comparisonMode opacidad de las capas
     * @api stable
     */
  setComparisonMode(comparisonMode) {
    if (this.transparentInteraction_ !== undefined) {
      this.transparentInteraction_.setComparisonMode(comparisonMode);
    }
    this.setVisibilityLayersCD();
  }

  /**
   * Set staticDivision
   *
   * @public
   * @function
   * @param { Number } staticDivision establece el tipo de división
   * @api stable
   */

  setStaticDivision(staticDivision) {
    if (this.transparentInteraction_ !== undefined) {
      this.transparentInteraction_.setStaticDivision(staticDivision);
    }
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
    this.transparentInteraction_.addLayer(layer.getImpl().getOL3Layer());
  }

  /**
   * Remove effects
   *
   * @public
   * @function
   * @api stable
   */
  removeEffectsCurtain() {
    this.olMap.removeInteraction(this.transparentInteraction_);
  }

  removeInteraction() {
    this.olMap.getInteractions().forEach((interaction) => {
      if (interaction instanceof ol.interaction.PinchRotate
        || interaction instanceof ol.interaction.DoubleClickZoom
        || interaction instanceof ol.interaction.KeyboardPan) {
        interaction.setActive(false);
      }
    });
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
    this.transparentInteraction_.removeLayer(layer.getImpl().getOL3Layer());
  }
}
