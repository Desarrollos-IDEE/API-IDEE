/**
 * @module IDEE/impl/control/WMCSelector
 */
import Control from './Control';

/**
 * @classdesc
 * Implementación para Cesium del selector de contextos WMC.
 *
 * @api
 * @extends {IDEE.impl.Control}
 */
class WMCSelector extends Control {
  /**
   * Añade el control al mapa: al elegir un contexto lo selecciona manteniendo el zoom.
   *
   * @public
   * @function
   * @param {IDEE.Map} map Mapa.
   * @param {HTMLElement} element Plantilla del control.
   * @api
   */
  addTo(map, element) {
    const select = element.getElementsByTagName('select')[0];
    select.addEventListener('change', (e) => {
      const selectedWMCLayer = map.getWMC(e.target.options[e.target.selectedIndex].text)[0];
      const zoom = map.getZoom();
      selectedWMCLayer.select();
      map.setZoom(zoom);
    });
    super.addTo(map, element);
  }
}

export default WMCSelector;
