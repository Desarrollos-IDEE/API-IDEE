/**
 * @module M/impl/control/Rotate
 */
import Control from './Control';

/**
 * @classdesc
 * Agrega la funcionalidad para rotar el mapa para que el norte esté arriba.
 *
 * @param {Object} vendorOptions Opciones para la biblioteca base.
 * - element. Contenedor del control.
 * - target. Elemento donde se va a añadir el control.
 * - render. Función que devuelve el HTML del control.
 * @api
 */
class Rotate extends Control {
  /**
   * Constructor principal de la clase.
   *
   * @constructor
   * @extends {ol.control.Control}
   * @api stable
   */
  constructor(vendorOptions) {
    super(vendorOptions);

    this.facadeMap_ = null;
  }

  /**
   * Este método añade el control al mapa.
   *
   * @public
   * @function
   * @param {M.Map} map Map.
   * @param {function} template Plantilla del control.
   * @api stable
   */
  addTo(map, element) {
    super.addTo(map, element);
    const olMap = map.getMapImpl();
    // panel
    this.panel = element;
    // REV_OL
    // El funcionamiento por defecto en OL es mostrar el control oculto
    // En Mapea por defecto vamos a mostrar si alguien lo pone se interpreta
    // que es para usarlo en un contexto de uso para su visualización sobre el mapa
    // if (this.panel) {
    // this.panel.style.display = 'none';
    // }
    this.panel.querySelector('button').addEventListener('click', () => {
      olMap.getView().setRotation(0);
    });

    this.addRotationEvent(olMap);

    olMap.on('change:view', (e) => {
      this.addRotationEvent(e.target);
    });
  }

  /**
   * Gira el icono junto con la vista.
   * @public
   * @function
   * @api
   * @param {ol.Map} olMap Mapa de OpenLayers.
   */
  addRotationEvent(olMap) {
    olMap.getView().on('change:rotation', (ev) => {
      const newView = ev.target;
      const rotation = newView.getRotation();
      const iconRotation = `rotate(${(rotation * 360) / (2 * Math.PI)}deg)`;
      this.panel.querySelector('button').style.transform = iconRotation;
    });
  }

  /**
   * Retorna los elementos del control.
   *
   * @public
   * @function
   * @api stable
   */
  getElement() {
    return this.element;
  }

  /**
   * Esta función destruye este control, limpiando el HTML y anula el registro de todos los eventos.
   *
   * @public
   * @function
   * @api stable
   * @export
   */
  destroy() {
    this.facadeMap_.getMapImpl().removeControl(this);
    this.facadeMap_ = null;
  }
}

/**
 * ID del panel.
 * @const
 * @type {string}
 * @public
 * @api stable
 */
Rotate.PANEL_ID = 'm-layerswitcher-panel';

export default Rotate;
