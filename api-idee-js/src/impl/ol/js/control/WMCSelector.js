/**
 * @module IDEE/impl/control/WMCSelector
 */
import { isNullOrEmpty } from 'IDEE/util/Utils';
import Control from './Control';

/**
 * @typedef {module:IDEE/impl/Control~Options} module:IDEE/impl/control/WMCSelector~Options
 * @api
 */

/**
 * @classdesc
 * Hereda de {@link module:IDEE/impl/control/Control|Control}.
 * Selector de contextos de mapas WMC (Web Map Context). Permite cargar y cambiar entre
 * diferentes contextos de mapas guardados, restaurando las capas, estilos y extensión
 * del mapa seleccionado.
 *
 * @property {IDEE.Map} [facadeMap_] Referencia al mapa de fachada.
 * @property {HTMLElement} [element] Elemento DOM del control.
 *
 * @api
 * @extends {module:IDEE/impl/control/Control}
 */
class WMCSelector extends Control {
  /**
   * Constructor principal de la clase.
   *
   * @constructor
   * @param {module:IDEE/impl/control/WMCSelector~Options} options Opciones del control.
   * @extends {ol.control.Control}
   * @api stable
   */
  constructor(options = {}) {
    super(options);
    this.facadeMap_ = null;
  }

  /**
   * Este método agrega el control al mapa.
   *
   * @public
   * @function
   * @param {IDEE.Map} map Mapa
   * @param {HTMLElement} element Plantilla del control.
   * @api stable
   */
  addTo(map, element) {
    this.facadeMap_ = map;
    this.element = element;

    const select = element.getElementsByTagName('select')[0];
    if (!isNullOrEmpty(select)) {
      select.addEventListener('change', (e) => {
        const selectedOption = e.target.options[e.target.selectedIndex];
        const selectedWMCLayer = map.getWMC(selectedOption.text)[0];
        if (isNullOrEmpty(selectedWMCLayer)) {
          return;
        }
        const zoom = map.getZoom();
        selectedWMCLayer.select();
        map.setZoom(zoom);
      });
    }

    map.getMapImpl().addControl(this);
  }
}

export default WMCSelector;
