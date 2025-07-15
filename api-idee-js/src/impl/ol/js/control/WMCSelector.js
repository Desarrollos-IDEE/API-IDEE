/**
 * @module IDEE/impl/control/WMCSelector
 */
import Control from './Control';

/**
 * @classdesc
 * Agregar selector de capas WMC.
 *
 * @api
 * @extends {IDEE.impl.Control}
 */
class WMCSelector extends Control {
  /**
   * Este método agrega el control al mapa.
   *
   * @public
   * @function
   * @param {IDEE.Map} map Mapa
   * @param {function} template Plantilla del control.
   * @api stable
   */
  addTo(map, element) {
    const select = element.getElementsByTagName('select')[0];
    select.addEventListener('change', (e) => {
      const selectedWMCLayer = map.getWMC(e.target.options[e.target.selectedIndex].text)[0];
      // eslint-disable-next-line no-console
      console.log(e.target.options[e.target.selectedIndex].text);
      const zoom = map.getZoom();
      selectedWMCLayer.select();
      map.setZoom(zoom);
    });
    super.addTo(map, element);
  }
}

export default WMCSelector;
