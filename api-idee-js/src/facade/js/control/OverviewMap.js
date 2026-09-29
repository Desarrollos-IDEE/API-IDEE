/**
 * @module IDEE/control/OverviewMap
 */
import 'assets/css/controls/overviewmap';
import myhelp from 'templates/overviewmaphelp';
import OverviewMapImpl from 'impl/control/OverviewMap';
import {
  isUndefined, isNullOrEmpty, isObject, isBoolean,
  isNumber,
} from '../util/Utils';
import Exception from '../exception/exception';
import * as Position from '../ui/position';
// eslint-disable-next-line import/no-relative-packages
import Control from './Control';
import { getValue } from '../i18n/language';
import { compileSync } from '../util/Template';

/**
 * @typedef {Object} Options
 * @param {string} [position] posición del control en el mapa.
 * @param {string} [tooltip] información sobre herramientas del control.
 * @param {boolean} [collapsible] indica si el control es plegable o no.
 * @param {boolean} [collapsed] indica si el control está plegado o no por defecto.
 * @param {boolean} [fixed] indica si el control muestra un mapa fijo.
 * @param {Number} [zoom] Zoom del minimapa.
 * @param {Number} [maxZoom] Zoom máximo del minimapa.
 * @param {Number} [minZoom] Zoom mínimo del minimapa.
 * @param {Number} [ratio] Relación del minimapa con respecto al mapa principal.
 * @param {string|IDEE.layer.WMS|IDEE.layer.WMTS|IDEE.layer.LayerGroup} [baseLayer] Capa
 * base que se mostrará en el mapa general.
*/

/**
 * @classdesc
 * OverviewMap control class.
 * Esta clase implementa el control de vista general,
 * que muestra un mapa pequeño con la ubicación del mapa principal. El control se puede
 * configurar para mostrar un mapa fijo o para mostrar el mismo mapa que el mapa principal.
 * El control se puede configurar para ser colapsable o no colapsable,
 * y para estar colapsado o no colapsado por defecto.
 *
 * @typedef {Object} Options
 * @param {string} [position='left'] posición del control en el mapa.
 * @param {string} [tooltip] información sobre herramientas del control.
 * Por defecto es 'Mapa general'.
 * @param {boolean} [collapsible=true] indica si el control es plegable o no.
 * Por defecto es true.
 * @param {boolean} [collapsed=true] indica si el control está plegado o no por defecto.
 * Por defecto es true.
 * @param {boolean} [fixed=6] indica si el control muestra un mapa fijo.
 * Por defecto es false.
 * @param {Number} [zoom] Zoom del minimapa.
 * @param {Number} [maxZoom] Zoom máximo del minimapa.
 * @param {Number} [minZoom] Zoom mínimo del minimapa.
 * @param {Number} [ratio] Relación del minimapa con respecto al mapa principal.
 * @param {string|IDEE.layer.WMS|IDEE.layer.WMTS|IDEE.layer.LayerGroup} [baseLayer] Capa
 * base que se mostrará en el mapa general.
 * El valor predeterminado es:
 * 'WMTS*http://www.ign.es/wmts/ign-base?*IGNBaseTodo*GoogleMapsCompatible*Mapa IGN*false*image/jpeg*false*'
 *
 * @api
 * @extends {IDEE.Control}
 */
class OverviewMap extends Control {
  /**
  * @classdesc
  * Objeto de control de la fachada principal. Esta clase crea un control
  * objeto que tiene una implementación Object
  *
  * @constructor
  * @extends {IDEE.Control}
  * @param {Options} [options={}] opciones de configuración del control.
  *
  * @example
  * // Crear un mapa y añadir el control de vista general
  *
  * const map = IDEE.map({
  *   container: 'map',
  *   zoom: 6,
  * };
  *
  * const control = new IDEE.control.OverviewMap({
  *   position: 'left',
  *   order: 2,
  *   tooltip: 'Mapa general',
  *   collapsible: false,
  *   zoom: 6,
  * });
  *
  * map.addControls(control);
   *
   * const baseLayer = new IDEE.layer.WMTS({
   *   url: 'http://www.ign.es/wmts/ign-base?',
   *   name: 'IGNBaseTodo',
   *   matrixSet: 'GoogleMapsCompatible',
   * });
   *
   * map.addControls(new IDEE.control.OverviewMap({ baseLayer }));
  *
  * @api stable
  */
  constructor(options = {}) {
    if (isUndefined(OverviewMapImpl) || (isObject(OverviewMapImpl)
      && isNullOrEmpty(Object.keys(OverviewMapImpl)))) {
      Exception(getValue('exception').impl_overviewmap);
    }
    const impl = new OverviewMapImpl(
      {
        tipLabel: OverviewMap.translation.title,
        ...options,
      },
    );

    super(
      OverviewMap.NAME,
      impl,
      {
        position: Position.isValid(options.position) ? options.position : Position.LEFT,
        ...options,
      },
    );

    impl.facadeControl = this;

    /**
    * Facade of the map
    * @private
    * @type {IDEE.Map}
    */
    this.map = null;

    /**
    * Fixed zoom
    * @private
    * @type {Boolean}
    */
    this.fixed_ = isBoolean(options.fixed) ? options.fixed : false;

    /**
    * Zoom to make fixed
    * @private
    * @type {Number}
    */
    this.zoom_ = isNumber(options.zoom) ? options.zoom : 6;

    /**
    * Zoom to make fixed
    * @private
    * @type {Number}
    */
    this.baseLayer_ = options.baseLayer !== undefined ? options.baseLayer : 'WMTS*http://www.ign.es/wmts/ign-base?*IGNBaseTodo*GoogleMapsCompatible*Mapa IGN*false*image/jpeg*false*false*true';

    /**
    * Vendor options
    * @public
    * @type {Object}
    */
    this.vendorOptions = {
      collapsed: options.collapsed,
      collapsible: options.collapsible,
    };

    if (options !== undefined && options.collapsed !== undefined && (options.collapsed === false || options.collapsed === 'false')) {
      this.vendorOptions.collapsed = false;
    }

    if (options !== undefined && options.collapsible !== undefined && (options.collapsible === false || options.collapsible === 'false')) {
      this.vendorOptions.collapsible = false;
    }

    /**
    * Vendor options
    * @public
    * @type {Object}
    */
    this.collapsible = isBoolean(options.collapsible) ? options.collapsible : true;

    /**
    * Vendor options
    * @public
    * @type {Object}
    */
    this.collapsed = (isBoolean(options.collapsed) && this.collapsible)
      ? options.collapsed : this.collapsible;

    /**
    * Options of the control
    * @private
    * @type {Object}
    */
    this.options = options;
  }

  /**
  * Este método es el que busca Map.js para insertar el control en el DOM
  */
  getView() {
    return this.getImpl().getView();
  }

  getActivationButton(element) {
    return isNullOrEmpty(element) ? null : document.querySelector('button');
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
    this.element = new Promise((success, fail) => {
      const html = this.getImpl().getView();
      // const html = IDEE.template.compileSync(template);
      success(html);
    });
    return this.element;
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
    return control instanceof OverviewMap && control.name === OverviewMap.NAME;
  }

  /**
  * Obtiene la ayuda del control
  *
  * @function
  * @public
  * @api
  */
  getHelp() {
    return {
      title: this.name,
      content: new Promise((success) => {
        const html = compileSync(myhelp, {
          vars: {
            urlImages: `${IDEE.config.API_IDEE_URL}facade/assets/images/help/${OverviewMap.NAME}`,
            translations: {
              help1: this.translation.textHelp.help1,
              help2: this.translation.textHelp.help2,
              help3: this.translation.textHelp.help3,
              help4: this.translation.textHelp.help4,
              help5: this.translation.textHelp.help5,
            },
          },
        });
        success(html);
      }),
    };
  }

  /**
  * This function destroys this control
  *
  * @public
  * @function
  * @api
  */
  destroy() {
    super.destroy();
    [this.map, this.panel_] = [null, null, null];
  }
}

/**
 * Name for this control
 * @const
 * @type {string}
 * @public
 * @api stable
 */
OverviewMap.NAME = 'overviewmap';

/**
 * Name for this control
 * @const
 * @type {string}
 * @public
 * @api stable
 */
OverviewMap.translation = getValue(OverviewMap.NAME);

export default OverviewMap;
