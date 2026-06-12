/**
 * @module IDEE/facade/builder
 */
import {
  isUndefined, isNullOrEmpty, isFunction, isString, concatUrlPaths, normalize,
} from 'IDEE/util/Utils';
import Panel from '../ui/Panel';
import * as Position from '../ui/position';
import { getValue } from '../i18n/language';
import Control from '../control/Control';
import GetFeatureInfo from '../control/GetFeatureInfo';
import Location from '../control/Location';
import Scale from '../control/Scale';
import Rotate from '../control/Rotate';
import ScaleLine from '../control/ScaleLine';
import Panzoom from '../control/Panzoom';
import Panzoombar from '../control/Panzoombar';
import BackgroundLayers from '../control/BackgroundLayers';
import WMCSelector from '../control/WMCSelector';
import Attributions from '../control/Attributions';
import ImplementationSwitcher from '../control/ImplementationSwitcher';
import * as dialog from '../dialog';
import Exception from '../exception/exception';

/**
 * Esta función devuelve el panel para el control Scale.
 *
 * @public
 * @function
 *
 * @param {Object} map Mapa.
 * @param {Object} params Parámetros del control.
 *
 * @return {Object} Devuelve el panel del control Scale.
 * @api stable
 */
export const getScalePanel = (map, params = {}) => {
  let panel = map.getPanels('map-info')[0];
  if (isNullOrEmpty(panel)) {
    panel = new Panel('map-info', {
      collapsible: false,
      className: 'm-map-info',
      position: Position.BR,
      order: params.order || null,
    });
    map.addUpClass_(panel); // eslint-disable-line no-underscore-dangle
  }
  panel.addClassName('m-with-scale');
  return panel;
};

/**
 * Esta función devuelve el panel para el control ScaleLine.
 *
 * @public
 * @function
 *
 * @param {Object} map Mapa.
 *
 * @return {Object} Devuelve el panel del control ScaleLine.
 * @api stable
 */
export const getScaleLinePanel = (map) => {
  const panel = new Panel('scaleline', {
    collapsible: false,
    className: 'm-scaleline',
    position: Position.BL,
    tooltip: 'Línea de escala',
  });
  map.addUpClass_(panel); // eslint-disable-line no-underscore-dangle
  return panel;
};

/**
 * Esta función devuelve el panel para el control Panzoombar.
 *
 * @public
 * @function
 *
 * @return {Object} Devuelve el panel del control Panzoombar.
 * @api stable
 */
export const getPanzoombarPanel = () => {
  return new Panel('panzoombar', {
    collapsible: false,
    className: 'm-panzoombar',
    position: Position.TL,
    tooltip: 'Nivel de zoom',
  });
};

/**
 * Esta función devuelve el panel para el control Panzoom.
 *
 * @public
 * @function
 *
 * @return {Object} Devuelve el panel del control Panzoom.
 * @api stable
 */
export const getPanzoomPanel = () => {
  return new Panel('panzoom', {
    collapsible: false,
    className: 'm-panzoom',
    position: Position.TL,
  });
};

/**
 * Esta función devuelve el panel para el control Location.
 *
 * @public
 * @function
 *
 * @return {Object} Devuelve el panel del control Location.
 * @api stable
 */
export const getLocationPanel = () => {
  return new Panel('location', {
    collapsible: false,
    className: 'm-location',
    position: Position.BR,
  });
};

/**
 * Esta función devuelve el panel para el control Rotate.
 *
 * @public
 * @function
 *
 * @param {Object} params Parámetros del control.
 *
 * @return {Object} Devuelve el panel del control Rotate.
 * @api stable
 */
export const getRotatePanel = (params = {}) => {
  return new Panel('rotate', {
    collapsible: false,
    className: 'm-rotate',
    position: Position.TL,
    order: params.order || null,
  });
};

/**
 * Esta función devuelve el panel para el control BackgroundLayers.
 *
 * @public
 * @function
 *
 * @return {Object} Devuelve el panel del control BackgroundLayers.
 * @api stable
 */
export const getBackgroundLayersPanel = () => {
  return new Panel('backgroundlayers', {
    collapsible: false,
    position: Position.TR,
    className: 'm-plugin-baselayer',
  });
};

/**
 * Esta función devuelve el panel para el control ImplementationSwitcher.
 *
 * @public
 * @function
 *
 * @return {Object} Devuelve el panel del control ImplementationSwitcher.
 * @api stable
 */
export const getImplementationSwitcherPanel = () => {
  return new Panel('implementationswitcher', {
    collapsible: true,
    position: Position.TR,
    className: 'm-implementationswitcher',
    collapsedButtonClass: 'g-cartografia-implementacion',
    tooltip: getValue('implementationswitcher').title,
  });
};

/**
 * Esta función devuelve el panel para el control WMCSelector.
 *
 * @public
 * @function
 *
 * @param {Object} map Mapa.
 *
 * @return {Object} Devuelve el panel del control WMCSelector.
 * @api stable
 */
export const getWMCSelectorPanel = (map) => {
  let panel = map.getPanels('map-info')[0];
  if (isNullOrEmpty(panel)) {
    panel = new Panel('map-info', {
      collapsible: false,
      position: Position.BR,
      className: 'm-map-info',
    });
    map.addUpClass_(panel); // eslint-disable-line no-underscore-dangle
  }
  panel.addClassName('m-with-wmcselector');
  return panel;
};

/**
 * This method create the mapea panel control from the name control.
 * @function
 * @param {Object} control Control instance.
 * @param {Object} map Map instance.
 * @param {Object} params Additional parameters for panel creation.
 * @private
 */
export const getPanelForControl = (control, map, params = {}) => {
  const panels = {
    [Scale.NAME]: () => getScalePanel(map, params),
    [`${Scale.NAME}*true`]: () => getScalePanel(map, params),
    [ScaleLine.NAME]: () => getScaleLinePanel(map),
    [Panzoombar.NAME]: () => getPanzoombarPanel(),
    [Panzoom.NAME]: () => getPanzoomPanel(),
    [GetFeatureInfo.NAME]: () => null, // GetFeatureInfo doesn't use panel
    [Location.NAME]: () => getLocationPanel(),
    [Attributions.NAME]: () => map.createAttribution(params, control),
    [Rotate.NAME]: () => getRotatePanel(params),
    [BackgroundLayers.NAME]: () => getBackgroundLayersPanel(),
    [ImplementationSwitcher.NAME]: () => getImplementationSwitcherPanel(),
    [WMCSelector.NAME]: () => getWMCSelectorPanel(map),
  };
  const controlParam = control.name;
  const builderFunction = panels[controlParam];

  return isFunction(builderFunction) ? builderFunction() : null;
};

/**
 * This method create the mapea control from its name string.
 * @function
 * @param {string|Object} controlParam Control name or control instance.
 * @param {Object} map Map instance.
 * @returns {Object} Built control instance.
 */
export const buildControl = (controlParam, map) => {
  let builtControl = null;
  const params = {};

  if (isString(controlParam)) {
    const normalizedControl = normalize(controlParam).split('*');
    const controlName = normalizedControl[0];

    const controls = {
      [Scale.NAME]: () => {
        normalizedControl.forEach((p) => {
          if (p === 'true') params.exactScale = true;
          // eslint-disable-next-line no-restricted-globals
          if (!isNaN(p)) params.order = Number(p);
        });
        return new Scale(params);
      },
      [ScaleLine.NAME]: () => new ScaleLine(),
      [Panzoombar.NAME]: () => new Panzoombar(),
      [Panzoom.NAME]: () => new Panzoom(),
      [Location.NAME]: () => new Location(),
      [GetFeatureInfo.NAME]: () => new GetFeatureInfo(true),
      [Attributions.NAME]: () => {
        // Attributions handled separately via map.createAttribution
        if (normalizedControl.length === 2) {
          map.createAttribution({ collectionsAttributions: [normalizedControl[1]] });
        } else {
          map.createAttribution();
        }
        return null;
      },
      [Rotate.NAME]: () => {
        normalizedControl.forEach((p) => {
          if (!isUndefined(p)) {
            const bbox = p.split(',');
            if (bbox.length === 4) {
              params.viewInitial = bbox;
            }
            if (p === 'false') params.help = false;
            // eslint-disable-next-line no-restricted-globals
            if (!isNaN(p)) params.order = Number(p);
          }
        });
        return new Rotate(params);
      },
      [BackgroundLayers.NAME]: () => {
        // Check for special pattern: backgroundlayers*[0-9]*true|false
        if (/backgroundlayers\*([0-9])+\*(true|false)/.test(controlParam)) {
          const idLayer = controlParam.match(/backgroundlayers\*([0-9])+\*(true|false)/)[1];
          const visible = controlParam.match(/backgroundlayers\*([0-9])+\*(true|false)/)[2] === 'true';
          return new BackgroundLayers(map, Number.parseInt(idLayer, 10), visible);
        }
        return new BackgroundLayers(map);
      },
      [ImplementationSwitcher.NAME]: () => new ImplementationSwitcher(),
      [WMCSelector.NAME]: () => new WMCSelector(),
    };

    const builderFunction = controls[controlName];
    if (isFunction(builderFunction)) {
      builtControl = builderFunction();
      if (builtControl) {
        builtControl.builderParams = params; // Store params for panel creation
      }
    } else {
      const getControlsAvailable = concatUrlPaths([window.IDEE.config.API_IDEE_URL, '/api/actions/controls']);
      dialog.error(`El control ${controlName} no está definido. Consulte los controles disponibles <a href='${getControlsAvailable}' target="_blank">aquí</a>`);
    }
  } else if (controlParam instanceof Control) {
    builtControl = controlParam;
  } else {
    Exception('El control añadido no es válido.');
  }

  return builtControl;
};

/**
 * Este comentario no se verá, es necesario incluir
 * una exportación por defecto para que el compilador
 * muestre las funciones.
 *
 * Esto se produce por al archivo normaliza-exports.js
 * @api stable
 */
export default {};
