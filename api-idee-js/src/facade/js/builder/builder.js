/* eslint-disable max-len */
/* eslint-disable no-nested-ternary */
/**
 * @module IDEE/facade/builder
 */
import {
  isNullOrEmpty, isFunction, isString, concatUrlPaths, normalize,
} from 'IDEE/util/Utils';
import CollapsiblePanel from '../ui/panels/CollapsiblePanel';
import { getValue } from '../i18n/language';
import Control from '../control/Control';
import Attributions from '../control/Attributions';
import GetFeatureInfo from '../control/GetFeatureInfo';
import Location from '../control/Location';
import Scale from '../control/Scale';
import Rotate from '../control/Rotate';
import ScaleLine from '../control/ScaleLine';
import Panzoom from '../control/Panzoom';
import Panzoombar from '../control/Panzoombar';
import BackgroundLayers from '../control/BackgroundLayers';
import ImplementationSwitcher from '../control/ImplementationSwitcher';
import WMCSelector from '../control/WMCSelector';
import Timeline from '../control/Timeline';
import * as dialog from '../dialog';
import Exception from '../exception/exception';
import { isBoolean, isNumber, parseUrlParams } from '../util/Utils';
import MeasureBar from '../control/MeasureBar';
import OverviewMap from '../control/OverviewMap';

/**
 * Get default panel options for a control.
 *
 * @public
 * @function
 * @param {IDEE.Control} control Control instance.
 * @param {Object} params Additional parameters for panel creation.
 * @returns {Object}
 */
export const getDefaultPanelOptions = (control, params) => ({
  order: isNumber(control.order) ? control.order : params.order,
  position: control.position ?? params.position,
  collapsible: isBoolean(control.collapsible) ? control.collapsible : params.collapsible,
  collapsed: isBoolean(control.collapsed) ? control.collapsed : params.collapsed,
  tooltip: isString(control.tooltip) ? control.tooltip
    : (control.translation ? control.translation.title : (params.tooltip ?? null)),
  className: `m-${control.name}`,
});

/**
 * Esta función devuelve el panel para el control Attributions.
 *
 * @public
 * @function
 *
 * @param {IDEE.Control} control Control.
 * @param {IDEE.Map} map Mapa.
 * @param {Object} params Parámetros del control.
 * @param {Object} defaultOptions Parámetros por defecto para el panel
 *
 * @return {CollapsiblePanel} Devuelve un panel de control compatible.
 * @api stable
 */
export const getAttributionsPanel = (control, map, params = {}) => {
  const className = [`m-${control.name}`];

  if (control.inlineText) {
    className.push('m-attributions-inline');
  }

  if (control.translucentPanel) {
    className.push('m-attributions-translucent');
  }

  return new CollapsiblePanel(Attributions.NAME, {
    ...getDefaultPanelOptions(control, params),
    className: className.join(' '),
    collapsedButtonClass: 'g-cartografia-comments-simple',
  });
};

/**
 * Esta función devuelve el panel para el control Scale.
 *
 * @public
 * @function
 *
 * @param {IDEE.Control} control Control.
 * @param {IDEE.Map} map Mapa.
 * @param {Object} params Parámetros del control.
 * @param {Object} defaultOptions Parámetros por defecto para el panel
 *
 * @return {CollapsiblePanel} Devuelve un panel de control compatible.
 * @api stable
 */
export const getScalePanel = (control, map, params = {}) => {
  let panel = map.getPanels('map-info')[0];
  if (isNullOrEmpty(panel)) {
    panel = new CollapsiblePanel('map-info', {
      ...getDefaultPanelOptions(control, params),
      collapsible: false,
      className: 'm-map-info',
    });
    map.addUpClass_(panel); // eslint-disable-line no-underscore-dangle
  }
  panel.addClassName(`m-with-${Scale.NAME}`);
  return panel;
};

/**
 * Esta función devuelve el panel para el control ScaleLine.
 *
 * @public
 * @function
 *
 * @param {IDEE.Control} control Control.
 * @param {IDEE.Map} map Mapa.
 * @param {Object} params Parámetros del control.
 * @param {Object} defaultOptions Parámetros por defecto para el panel
 *
 * @return {CollapsiblePanel} Devuelve un panel de control compatible.
 * @api stable
 */
export const getScaleLinePanel = (control, map, params = {}) => {
  const panel = new CollapsiblePanel(ScaleLine.NAME, {
    ...getDefaultPanelOptions(control, params),
    collapsible: false,
    tooltip: params.tooltip ?? control.title ?? getValue('scaleline').title,
  });
  map.addUpClass_(panel); // eslint-disable-line no-underscore-dangle
  return panel;
};

/**
 * Esta función devuelve el panel que alberga los controles de medida
 *
 * @public
 * @function
 *
 * @param {IDEE.Control} control Control.
 * @param {IDEE.Map} map Mapa.
 * @param {Object} params Parámetros del control.
 * @param {Object} defaultOptions Parámetros por defecto para el panel
 *
 * @return {CollapsiblePanel} Devuelve un panel de control compatible.
 * @api stable
 */
export const getMeasureBarPanel = (control, map, params = {}) => {
  const panel = new CollapsiblePanel(MeasureBar.NAME, {
    ...getDefaultPanelOptions(control, params),
    className: `m-control-${MeasureBar.NAME}`,
    collapsedButtonClass: 'g-cartografia-regla',
  });
  return panel;
};

/**
 * Esta función devuelve el panel que alberga el control de mini mapa observable
 *
 * @public
 * @function
 *
 * @param {IDEE.Control} control Control.
 * @param {IDEE.Map} map Mapa.
 * @param {Object} params Parámetros del control.
 * @param {Object} defaultOptions Parámetros por defecto para el panel
 *
 * @return {CollapsiblePanel} Devuelve un panel de control compatible.
 * @api stable
 */
export const getOverviewMapPanel = (control, map, params = {}) => {
  const panel = new CollapsiblePanel(OverviewMap.NAME, {
    ...getDefaultPanelOptions(control, params),
    className: `m-control-${OverviewMap.NAME}`,
    collapsedButtonClass: 'g-cartografia-mundo',
  });
  return panel;
};

/**
 * Esta función devuelve el panel para el control Panzoombar.
 *
 * @public
 * @function
 *
 * @param {IDEE.Control} control Control.
 * @param {IDEE.Map} map Mapa.
 * @param {Object} params Parámetros del control.
 * @param {Object} defaultOptions Parámetros por defecto para el panel
 *
 * @return {CollapsiblePanel} Devuelve un panel de control compatible.
 * @api stable
 */
export const getPanzoombarPanel = (control, map, params = {}) => {
  return new CollapsiblePanel(Panzoombar.NAME, {
    ...getDefaultPanelOptions(control, params),
    collapsible: false,
  });
};

/**
 * Esta función devuelve el panel para el control Panzoom.
 *
 * @public
 * @function
 *
 * @param {IDEE.Control} control Control.
 * @param {IDEE.Map} map Mapa.
 * @param {Object} params Parámetros del control.
 * @param {Object} defaultOptions Parámetros por defecto para el panel
 *
 * @return {CollapsiblePanel} Devuelve un panel de control compatible.
 * @api stable
 */
export const getPanzoomPanel = (control, map, params = {}) => {
  return new CollapsiblePanel(Panzoom.NAME, {
    ...getDefaultPanelOptions(control, params),
    collapsible: false,
  });
};

/**
 * Esta función devuelve el panel para el control GetFeatureInfo.
 *
 * @public
 * @function
 *
 * @param {IDEE.Control} control Control.
 * @param {IDEE.Map} map Mapa.
 * @param {Object} params Parámetros del control.
 * @param {Object} defaultOptions Parámetros por defecto para el panel
 *
 * @return {CollapsiblePanel} Devuelve un panel de control compatible.
 * @api stable
 */
export const getGetFeatureInfo = (control, map, params = {}) => {
  return new CollapsiblePanel(GetFeatureInfo.NAME, {
    ...getDefaultPanelOptions(control, params),
    collapsible: false,
    collapsedButtonClass: 'g-cartografia-info-pointer',
  });
};

/**
 * Esta función devuelve el panel para el control Location.
 *
 * @public
 * @function
 *
 * @param {IDEE.Control} control Control.
 * @param {IDEE.Map} map Mapa.
 * @param {Object} params Parámetros del control.
 * @param {Object} defaultOptions Parámetros por defecto para el panel
 *
 * @return {CollapsiblePanel} Devuelve un panel de control compatible.
 * @api stable
 */
export const getLocationPanel = (control, map, params = {}) => {
  return new CollapsiblePanel(Location.NAME, {
    ...getDefaultPanelOptions(control, params),
    collapsible: false,
  });
};

/**
 * Esta función devuelve el panel para el control Rotate.
 *
 * @public
 * @function
 *
 * @param {IDEE.Control} control Control.
 * @param {IDEE.Map} map Mapa.
 * @param {Object} params Parámetros del control.
 * @param {Object} defaultOptions Parámetros por defecto para el panel
 *
 * @return {CollapsiblePanel} Devuelve un panel de control compatible.
 * @api stable
 */
export const getRotatePanel = (control, map, params = {}) => {
  return new CollapsiblePanel(Rotate.NAME, {
    ...getDefaultPanelOptions(control, params),
    collapsible: false,
    className: 'm-rotate',
  });
};

/**
 * Esta función devuelve el panel para el control BackgroundLayers.
 *
 * @public
 * @function
 *
 * @param {IDEE.Control} control Control.
 * @param {IDEE.Map} map Mapa.
 * @param {Object} params Parámetros del control.
 * @param {Object} defaultOptions Parámetros por defecto para el panel
 *
 * @return {CollapsiblePanel} Devuelve un panel de control compatible.
 * @api stable
 */
export const getBackgroundLayersPanel = (control, map, params = {}) => {
  return new CollapsiblePanel(BackgroundLayers.NAME, {
    ...getDefaultPanelOptions(control, params),
    collapsible: false,
    className: 'm-control-baselayer',
  });
};

/**
 * Esta función devuelve el panel para el control ImplementationSwitcher.
 *
 * @public
 * @function
 *
 * @param {IDEE.Control} control Control.
 * @param {IDEE.Map} map Mapa.
 * @param {Object} params Parámetros del control.
 * @param {Object} defaultOptions Parámetros por defecto para el panel
 *
 * @return {CollapsiblePanel} Devuelve un panel de control compatible.
 * @api stable
 */
export const getImpSwitcherPanel = (control, map, params = {}) => {
  return new CollapsiblePanel(ImplementationSwitcher.NAME, {
    ...getDefaultPanelOptions(control, params),
    collapsedButtonClass: 'g-cartografia-implementacion',
    className: 'm-implementationswitcher',
  });
};

/**
 * Esta función devuelve el panel para el control WMCSelector.
 *
 * @public
 * @function
 *
 * @param {IDEE.Control} control Control.
 * @param {IDEE.Map} map Mapa.
 * @param {Object} params Parámetros del control.
 * @param {Object} defaultOptions Parámetros por defecto para el panel
 *
 * @return {CollapsiblePanel} Devuelve un panel de control compatible.
 * @api stable
 */
export const getWMCSelectorPanel = (control, map, params = {}) => {
  let panel = map.getPanels('map-info')[0];
  if (isNullOrEmpty(panel)) {
    panel = new CollapsiblePanel('map-info', {
      ...getDefaultPanelOptions(control, params),
      collapsible: false,
      className: 'm-map-info',
    });
    map.addUpClass_(panel); // eslint-disable-line no-underscore-dangle
  }
  panel.addClassName(`m-with-${WMCSelector.NAME}`);
  return panel;
};

/**
 * Esta función devuelve el panel para el control de línea de tiempo
 *
 * @public
 * @function
 *
 * @param {IDEE.Control} control Control.
 * @param {IDEE.Map} map Mapa.
 * @param {Object} params Parámetros del control.
 * @param {Object} defaultOptions Parámetros por defecto para el panel
 *
 * @return {CollapsiblePanel} Devuelve un panel de control compatible.
 * @api stable
 */
export const getTimelinePanel = (control, map, params = {}) => {
  const defaultOptions = getDefaultPanelOptions(control, params);
  return new CollapsiblePanel(Timeline.NAME, {
    ...defaultOptions,
    className: 'm-control-timeline',
    collapsedButtonClass: 'g-cartografia-gestion-reloj2',
  });
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
    [Attributions.NAME]: () => getAttributionsPanel(control, map, params),
    [Scale.NAME]: () => getScalePanel(control, map, params),
    [`${Scale.NAME}*true`]: () => getScalePanel(control, map, params),
    [ScaleLine.NAME]: () => getScaleLinePanel(control, map, params),
    [MeasureBar.NAME]: () => getMeasureBarPanel(control, map, params),
    [OverviewMap.NAME]: () => getOverviewMapPanel(control, map, params),
    [Panzoombar.NAME]: () => getPanzoombarPanel(control, map, params),
    [Panzoom.NAME]: () => getPanzoomPanel(control, map, params),
    [GetFeatureInfo.NAME]: () => getGetFeatureInfo(control, map, params),
    [Location.NAME]: () => getLocationPanel(control, map, params),
    [Rotate.NAME]: () => getRotatePanel(control, map, params),
    [BackgroundLayers.NAME]: () => getBackgroundLayersPanel(control, map, params),
    [ImplementationSwitcher.NAME]: () => getImpSwitcherPanel(control, map, params),
    [Timeline.NAME]: () => getTimelinePanel(control, map, params),
    [WMCSelector.NAME]: () => getWMCSelectorPanel(control, map, params),
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
  let control = null;
  const controlNameSeparator = '*';
  const normalizedControlParams = normalize(controlParam).split(controlNameSeparator);
  const controlName = normalizedControlParams[0];

  if (isString(controlParam)) {
    const controls = {
      [Attributions.NAME]: (options) => {
        const collectionsAttributions = options.collectionsAttributions ?? [];
        // eslint-disable-next-line no-underscore-dangle, no-param-reassign
        map._attributionsMap = [...map._attributionsMap, ...collectionsAttributions];
        return new Attributions({
          ...options,
          collectionsAttributions: collectionsAttributions.map((l) => {
            if (typeof l !== 'string') {
              const attr = l;
              attr.id = l.idLayer;
              return attr;
            }
            return l;
          }),
        });
      },
      [Scale.NAME]: (options) => new Scale(options),
      [ScaleLine.NAME]: (options) => new ScaleLine(options),
      [MeasureBar.NAME]: (options) => new MeasureBar(options),
      [OverviewMap.NAME]: (options) => new OverviewMap(options),
      [Panzoombar.NAME]: (options) => new Panzoombar(options),
      [Panzoom.NAME]: (options) => new Panzoom(options),
      [Location.NAME]: (options) => new Location(options),
      [GetFeatureInfo.NAME]: (options) => new GetFeatureInfo(options),
      [Rotate.NAME]: (options) => new Rotate(options),
      [BackgroundLayers.NAME]: (options) => new BackgroundLayers(options),
      [ImplementationSwitcher.NAME]: (options) => new ImplementationSwitcher(options),
      [WMCSelector.NAME]: (options) => new WMCSelector(options),
      [Timeline.NAME]: (options) => new Timeline({
        timelineType: 'absoluteSimple',
        ...options,
      }),
    };

    const builderFunction = controls[controlName];
    if (isFunction(builderFunction)) {
      const controlParams = controlParam.split(controlNameSeparator).slice(1).join(controlNameSeparator);
      const controlOptions = parseUrlParams(controlParams, controlName);
      control = builderFunction(controlOptions);
      if (control) {
        control.builderParams = controlOptions;
      }
    } else {
      const getControlsAvailable = concatUrlPaths([IDEE.config.API_IDEE_URL, '/api/actions/controls']);
      const exceptionMessage = getValue('exception').undefined_control;
      dialog.error(`( "${controlParam}" ) ${exceptionMessage} <a href='${getControlsAvailable}' target="_blank">aquí</a>`);
    }
  } else if (controlParam instanceof Control) {
    control = controlParam;
  } else {
    Exception(`${getValue('exception').invalid_control} ( ${controlParam} )`);
  }

  return control;
};

/**
 * Converts a layer URL parameter string in the named-param format
 * ('WMTS*url=http://...;name=MTN;matrixSet=GM') into a plain object
 * that parameter.layer() can consume directly.
 *
 * The old positional format ('WMTS*http://....*name') is returned unchanged
 * so existing callers are unaffected.
 *
 * @public
 * @function
 * @param {string|*} layerParam Raw layer parameter.
 * @returns {Object|string} Parsed object for named-param format, original value otherwise.
 */
export const buildLayer = (layerParam) => {
  if (!isString(layerParam)) return layerParam;
  const starIdx = layerParam.indexOf('*');
  if (starIdx <= 0) return layerParam;

  const type = layerParam.substring(0, starIdx);
  const paramsStr = layerParam.substring(starIdx + 1);

  // Named-param format: params start with 'key=value' (word chars then '=')
  if (/^\w+=/.test(paramsStr)) {
    return { type, ...parseUrlParams(paramsStr, type) };
  }

  return layerParam;
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
