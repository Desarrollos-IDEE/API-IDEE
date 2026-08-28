/**
 * @module M/control/MagnifyControl
 */

import MagnifyImplControl from 'impl/magnifycontrol';
import template from 'templates/magnify';
import { getValue } from './i18n/language';

export default class MagnifyControl extends IDEE.Control {
  /**
   * @classdesc
   * Main constructor of the class. Creates a PluginControl
   * control
   *
   * @constructor
   * @extends {IDEE.Control}
   * @api stable
   */
  constructor(values) {
    // 1. checks if the implementation can create PluginControl
    if (IDEE.utils.isUndefined(MagnifyImplControl)) {
      IDEE.exception(getValue('exception.impl'));
    }
    // 2. implementation of this control
    const impl = new MagnifyImplControl();
    super(impl, 'Magnify');

    this.pluginOnLeft = values.pluginOnLeft;
    this.arrayListNames = values.layers;
    this.zoom = values.zoom;
    this.zoomMax = values.zoomMax;
  }

  /**
   * This function creates the view
   *
   * @public
   * @function
   * @param {IDEE.Map} map to add the control
   * @api stable
   */
  createView(map) {
    this.map = map;
    return new Promise((success, fail) => {
      // Desplazar open button
      if (this.pluginOnLeft) {
        document.querySelector('.m-panel.m-plugin-magnify')
          .querySelector('.m-panel-btn.g-cartografia-zoom-extension')
          .addEventListener('click', (evt) => {
            let buttonOpened = document.querySelector('.m-panel.m-plugin-magnify.opened');
            if (buttonOpened !== null) {
              buttonOpened = buttonOpened.querySelector('.m-panel-btn.g-cartografia-flecha-izquierda');
            }
            if (buttonOpened && this.pluginOnLeft) {
              buttonOpened.classList.add('opened-left');
            }
          });
      }

      // Creamos las variables necesarias para el html
      const zoomMax = this.zoomMax;
      const options = {
        vars: { zoomMax },
      };

      const html = IDEE.template.compileSync(template, options);

      // Zoom de la lupa
      html.querySelector('#input-zoom-offset').value = this.zoom;
      html.querySelector('#input-zoom-offset').addEventListener('change', (evt) => {
        this.zoom = Number(evt.target.value);
        this.getImpl().setOptionZoom(this.zoom);
      });

      // Botón efecto lupa
      html.querySelector('#m-magnify-magnifying').addEventListener('click', (evt) => {
        if (document.getElementsByClassName('buttom-pressed').length === 0) {
          html.querySelector('#m-magnify-magnifying').classList.add('buttom-pressed');

          // Cojo todas las capas del mapa
          const allLayers = map.getLayers();
          // De cada capas del mapa obtengo su nombre
          // (en los parámetros del plugin, las capas se meten por su nombre)
          const usableLayers = allLayers.filter((l) => l.name);
          // Cojo las capas del mapa que coinciden con el nombre
          // de las capas metidas como parámetro en el plugin
          const layers = usableLayers.filter((l) => this.arrayListNames.includes(l.name));

          // Obtengo la capa base
          const layerBase = this.map.getBaseLayers();

          if (layerBase === 0) {
            // No hay capa base en el mapa, debe coger todas las capas.
            this.getImpl().effectSelected(usableLayers, this.zoom);
          } else if (layers.length === 0) {
            // En el plugin no se ha puesto capa en los parámetros o no existe
            this.getImpl().effectSelected(layerBase, this.zoom); // mostrará la capa base
          } else {
            // se ha puesto capa o capas en los parámetros, debe mostrarlas
            this.getImpl().effectSelected(layers, this.zoom);
          }
        } else {
          html.querySelector('#m-magnify-magnifying').classList.remove('buttom-pressed');
          this.removeEffects();
        }
      });
      success(html);
    });
  }

  /**
   * This function is called to remove the effects
   *
   * @public
   * @function
   * @api stable
   */
  removeEffects() {
    this.getImpl().removeEffects();
  }

  /**
   * This function compares controls
   *
   * @public
   * @function
   * @param {IDEE.Control} control to compare
   * @api stable
   */
  equals(control) {
    return control instanceof MagnifyControl;
  }
}
