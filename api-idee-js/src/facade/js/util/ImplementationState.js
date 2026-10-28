/**
 * Estado de un mapa independiente de la implementación (OpenLayers, Cesium), para
 * recrearlo en otro núcleo sin perder sus capas, controles y plugins.
 *
 * Cada núcleo es un bundle con su propio `window.IDEE`: las instancias de uno no valen en
 * el otro. Por eso el estado solo guarda datos planos (más File, Blob y ArrayBuffer, que
 * son de la ventana) y lo reconstruye el código del núcleo de destino con sus clases.
 * Lo que el destino no admite se aparca en el registro y se recupera al volver.
 *
 * @module IDEE/util/ImplementationState
 */
import {
  getViewState,
  applyViewState,
  toMapBbox,
} from 'impl/control/ImplementationSwitcher';
import Style from '../style/Style';
import Section from '../layer/Section';
import { isObject, isString, reproject } from './Utils';

/** Clave con la que se guarda un estilo serializado dentro de los parámetros. */
const STYLE_KEY = '__ideeStyle';

/** Capas internas del mapa o de sus controles: las vuelve a crear quien las usa. */
const INTERNAL_LAYERS = ['__draw__', 'selectLayer', '__timeline_empty_layer__'];

const DROP = Symbol('drop');
const MAX_DEPTH = 20;

/**
 * Registro compartido por los núcleos cargados en la página. Vive fuera de los bundles
 * (en `window`) para sobrevivir al cambio de `window.IDEE`.
 *
 * @function
 * @returns {Object} Registro: espacios de nombres por implementación, hojas de estilo y
 * scripts cargados, elementos aparcados y opciones de vista por implementación.
 * @public
 */
export const getRegistry = () => {
  if (!isObject(window.IDEE_IMPLEMENTATIONS)) {
    window.IDEE_IMPLEMENTATIONS = {
      namespaces: {},
      styles: {},
      scripts: [],
      parked: { layers: [], controls: [], plugins: [] },
      views: {},
    };
  }
  return window.IDEE_IMPLEMENTATIONS;
};

/**
 * Implementación de un espacio de nombres IDEE cargado (la declara el propio bundle).
 *
 * @function
 * @param {Object} namespace Espacio de nombres IDEE.
 * @returns {String|undefined} 'ol', 'cesium'...
 * @public
 */
export const getNamespaceImplementation = (namespace) => {
  const MapImpl = namespace && namespace.impl && namespace.impl.Map;
  return MapImpl && MapImpl.prototype.getImplementation
    ? MapImpl.prototype.getImplementation()
    : undefined;
};

const isPlainObject = (value) => {
  if (Object.prototype.toString.call(value) !== '[object Object]') return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
};

const isBinary = (value) => value instanceof Blob || value instanceof ArrayBuffer
  || ArrayBuffer.isView(value);

/**
 * Copia de datos planos: los estilos se serializan y se descartan las instancias de clases
 * (capas, objetos de OpenLayers o Cesium). Las funciones se conservan salvo en las opciones
 * del motor (`keepFunctions` falso), donde suelen depender de él.
 */
const toPlain = (value, keepFunctions = true, depth = 0) => {
  if (value === null || value === undefined) return value;
  if (depth > MAX_DEPTH) return DROP;
  if (typeof value === 'function') return keepFunctions ? value : DROP;
  if (typeof value !== 'object') return value;
  if (value instanceof Style) {
    try {
      return { [STYLE_KEY]: value.serialize() };
    } catch (error) {
      return DROP;
    }
  }
  if (isBinary(value)) return value;
  if (Array.isArray(value)) {
    return value.map((item) => toPlain(item, keepFunctions, depth + 1))
      .filter((item) => item !== DROP);
  }
  if (!isPlainObject(value)) return DROP;
  return Object.entries(value).reduce((plain, [key, item]) => {
    const copy = toPlain(item, keepFunctions, depth + 1);
    // eslint-disable-next-line no-param-reassign
    if (copy !== DROP) plain[key] = copy;
    return plain;
  }, {});
};

/** Inversa de toPlain: los estilos serializados vuelven a ser estilos del núcleo actual. */
const fromPlain = (value) => {
  if (Array.isArray(value)) return value.map(fromPlain);
  if (isPlainObject(value)) {
    if (isString(value[STYLE_KEY])) return Style.deserialize(value[STYLE_KEY]);
    return Object.entries(value).reduce((copy, [key, item]) => {
      // eslint-disable-next-line no-param-reassign
      copy[key] = fromPlain(item);
      return copy;
    }, {});
  }
  return value;
};

const attempt = (fn, fallback) => {
  try {
    return fn();
  } catch (error) {
    return fallback;
  }
};

/** Clave con la que está registrada la clase de una instancia en un espacio de nombres. */
const getClassKey = (namespace, instance) => Object.keys(namespace || {})
  .find((key) => namespace[key] === instance.constructor);

const isInternalLayer = (layer) => INTERNAL_LAYERS.includes(layer.name)
  || (isString(layer.name) && layer.name.endsWith('_attributions'))
  || (layer.displayInLayerSwitcher === false && layer.isBase !== true);

const captureLayer = (layer) => {
  const key = getClassKey(window.IDEE.layer, layer) || layer.type;
  const args = Object.values(layer.constructorParameters || {}).slice(0, 3)
    .map((arg, index) => {
      const plain = toPlain(arg, index < 2);
      return plain === DROP ? undefined : plain;
    });
  const entry = {
    key,
    params: args,
    state: {
      visible: attempt(() => layer.isVisible(), true),
      opacity: attempt(() => layer.getOpacity()),
      zIndex: attempt(() => layer.getZIndex()),
      legend: layer.legend,
      isBase: layer.isBase,
      displayInLayerSwitcher: layer.displayInLayerSwitcher,
    },
  };
  if (typeof layer.getStyles === 'function') {
    entry.state.styles = attempt(() => toPlain(layer.getStyles()));
  }
  // Los KML y KMZ traen sus propios estilos: no se pisan con el que tengan aplicado
  if (typeof layer.getStyle === 'function' && !['KML', 'KMZ'].includes(layer.type)) {
    const style = attempt(() => layer.getStyle());
    if (style instanceof Style) entry.state.style = toPlain(style);
  }
  if (key === 'Vector') {
    entry.features = attempt(() => layer.toGeoJSON().features, []);
  }
  if (key === 'LayerGroup') {
    entry.children = layer.getLayers().map(captureLayer);
  }
  return entry;
};

const captureSection = (section) => ({
  section: {
    idSection: section.idSection,
    title: section.title,
    collapsed: section.collapsed,
    order: section.order,
    zIndex: attempt(() => section.getZIndex()),
  },
  children: section.getChildren().map((child) => (child instanceof Section
    ? captureSection(child)
    : captureLayer(child))),
});

/**
 * Captura el estado del mapa con el código de su propio núcleo. Hay que hacerlo antes de
 * destruirlo (destroy quita las capas y revoca las URL locales de los KMZ).
 *
 * @function
 * @param {IDEE.Map} map Mapa actual.
 * @returns {Object} Estado independiente de la implementación.
 * @public
 */
export const captureState = (map) => {
  const registry = getRegistry();
  const implementation = map.getImplementation();
  const projection = map.getProjection();
  registry.views[implementation] = {
    projection: `${projection.code}*${projection.units}`,
    minZoom: attempt(() => map.getMinZoom()),
    maxZoom: attempt(() => map.getMaxZoom()),
  };

  const geopackages = map.geopackages || [];
  const geopackageLayers = geopackages
    .flatMap((geopackage) => attempt(() => geopackage.getLayers(), []));
  const layers = map.getLayers()
    .filter((layer) => !isInternalLayer(layer)
      && !geopackageLayers.includes(layer)
      && !attempt(() => layer.getSection(), null)
      && !(typeof layer.getWMCParent === 'function' && attempt(() => layer.getWMCParent(), null)))
    .map(captureLayer);

  // Controles del núcleo: los de los plugins los vuelve a crear su plugin
  const coreControls = Object.values(window.IDEE.control || {})
    .filter((value) => typeof value === 'function' && value.NAME)
    .map((value) => value.NAME);
  const controls = map.getControls()
    .filter((control) => !control.parentPlugin && coreControls.includes(control.name))
    .map((control) => ({ name: control.name, options: toPlain(control.options || {}) }));
  const plugins = map.getPlugins().map((plugin) => ({
    key: getClassKey(window.IDEE.plugin, plugin)
      || getClassKey(window.M && window.M.plugin, plugin),
    name: plugin.name,
    options: toPlain(plugin.options || {}),
  }));

  // Lo aparcado en cambios anteriores se suma, sin repetir lo que ya está en el mapa
  const layerId = (entry) => {
    const [userParameters] = entry.params;
    return [entry.key, userParameters && userParameters.name, entry.state.legend].join('|');
  };
  const layerIds = layers.map(layerId);
  const parkedLayers = registry.parked.layers.filter((entry) => !layerIds.includes(layerId(entry)));
  return {
    implementation,
    view: getViewState(map),
    bgColorContainer: attempt(() => map.getBGColorContainer()),
    layers: [...layers, ...parkedLayers]
      .sort((a, b) => (a.state.zIndex || 0) - (b.state.zIndex || 0)),
    sections: map.getSections().map(captureSection),
    geopackages: geopackages.map((geopackage) => toPlain(geopackage.toJSON())),
    controls: [
      ...controls,
      ...registry.parked.controls
        .filter((entry) => !controls.some((control) => control.name === entry.name)),
    ],
    plugins: [
      ...plugins,
      ...registry.parked.plugins
        .filter((entry) => !plugins.some((plugin) => plugin.name === entry.name)),
    ],
  };
};

/** Pasa los objetos guardados en EPSG:4326 a la proyección del mapa nuevo. */
const reprojectGeometry = (coordinates, code) => {
  if (!Array.isArray(coordinates)) return coordinates;
  if (typeof coordinates[0] === 'number') {
    return [...reproject(coordinates.slice(0, 2), 'EPSG:4326', code), ...coordinates.slice(2)];
  }
  return coordinates.map((item) => reprojectGeometry(item, code));
};

/**
 * Reconstruye el mapa con el código del núcleo actual (el de destino). Lo que no se puede
 * crear o añadir aquí se aparca en el registro para el próximo cambio.
 *
 * @function
 * @param {Object} state Estado capturado con captureState.
 * @param {HTMLElement} container Contenedor del mapa.
 * @returns {IDEE.Map} Mapa nuevo.
 * @public
 */
export const restoreState = (state, container) => {
  const { IDEE } = window;
  const registry = getRegistry();
  const implementation = getNamespaceImplementation(IDEE);
  const own = registry.views[implementation] || {};
  const parked = { layers: [], controls: [], plugins: [] };
  const created = [];

  const params = { container: container.id, layers: [], controls: [] };
  if (implementation !== 'cesium') {
    params.projection = own.projection || IDEE.config.DEFAULT_PROJ;
    if (own.minZoom !== undefined) params.minZoom = own.minZoom;
    if (own.maxZoom !== undefined) params.maxZoom = own.maxZoom;
  }
  const code = isString(params.projection) ? params.projection.split('*')[0] : 'EPSG:4326';
  const bbox = toMapBbox(state.view, code);
  if (bbox) params.bbox = bbox;
  if (state.bgColorContainer) params.bgColorContainer = state.bgColorContainer;

  const map = IDEE.map(params);
  applyViewState(map, state.view);
  const mapCode = map.getProjection().code;

  const buildLayer = (entry) => {
    const LayerClass = IDEE.layer[entry.key];
    if (typeof LayerClass !== 'function') throw new Error(`${entry.key} no disponible`);
    const [userParameters, options, vendorOptions] = fromPlain(entry.params);
    let layer;
    if (entry.key === 'LayerGroup' && !isString(userParameters)) {
      const layers = (entry.children || []).map((child) => {
        try {
          return buildLayer(child);
        } catch (error) {
          parked.layers.push(child);
          return null;
        }
      }).filter((child) => child !== null);
      layer = new LayerClass({ ...(userParameters || {}), layers }, options, vendorOptions);
    } else {
      layer = new LayerClass(userParameters, options, vendorOptions);
    }
    created.push([layer, entry]);
    return layer;
  };

  const buildSection = (entry) => new Section({
    ...entry.section,
    children: entry.children.map((child) => {
      if (child.section) return buildSection(child);
      try {
        return buildLayer(child);
      } catch (error) {
        parked.layers.push(child);
        return null;
      }
    }).filter((child) => child !== null),
  });

  state.layers.forEach((entry) => {
    try {
      const layer = buildLayer(entry);
      map.addLayers(layer);
      if (!map.getLayers().includes(layer) && !map.getLayerGroup().includes(layer)) {
        throw new Error(`${entry.key} no se pudo añadir`);
      }
    } catch (error) {
      parked.layers.push(entry);
    }
  });
  state.sections.forEach((entry) => {
    try {
      map.addSections(buildSection(entry));
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('No se pudo recrear la sección', entry.section.title, error);
    }
  });
  state.geopackages.forEach((json) => {
    try {
      map.addLayers(fromPlain(json));
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('No se pudo recrear el GeoPackage', json.name, error);
    }
  });

  created.forEach(([createdLayer, entry]) => {
    const layer = createdLayer;
    const layerState = entry.state || {};
    const isTopLevel = state.layers.includes(entry);
    attempt(() => {
      if (layerState.legend !== undefined) layer.legend = layerState.legend;
    });
    attempt(() => {
      if (layerState.displayInLayerSwitcher !== undefined) {
        layer.displayInLayerSwitcher = layerState.displayInLayerSwitcher;
      }
    });
    if (isTopLevel && !layerState.isBase && typeof layerState.zIndex === 'number') {
      attempt(() => layer.setZIndex(layerState.zIndex));
    }
    // La opacidad se aplica después de crear: Cesium toma `opacity: 0` como 1
    if (typeof layerState.opacity === 'number') attempt(() => layer.setOpacity(layerState.opacity));
    if (layerState.styles && typeof layer.setStyles === 'function') {
      attempt(() => layer.setStyles(fromPlain(layerState.styles)));
    }
    if (layerState.style && typeof layer.setStyle === 'function') {
      attempt(() => layer.setStyle(fromPlain(layerState.style)));
    }
    if (Array.isArray(entry.features) && entry.features.length > 0) {
      const inDegrees = mapCode === 'EPSG:4326' || mapCode === 'EPSG:4979';
      const toMapGeometry = (geometry) => (geometry && !inDegrees
        ? { ...geometry, coordinates: reprojectGeometry(geometry.coordinates, mapCode) }
        : geometry);
      attempt(() => layer.addFeatures(entry.features.map((feature) => new IDEE.Feature(
        feature.id,
        { ...feature, geometry: toMapGeometry(feature.geometry) },
      ))));
    }
    attempt(() => layer.setVisible(layerState.visible !== false));
  });

  state.controls.forEach((entry) => {
    const ControlClass = Object.values(IDEE.control || {})
      .find((value) => typeof value === 'function' && value.NAME === entry.name);
    if (!ControlClass) {
      parked.controls.push(entry);
      return;
    }
    if (map.hasControl(entry.name)) return;
    try {
      map.addControls(new ControlClass(fromPlain(entry.options)));
    } catch (error) {
      parked.controls.push(entry);
    }
  });

  state.plugins.forEach((entry) => {
    const PluginClass = entry.key ? IDEE.plugin[entry.key] : undefined;
    if (typeof PluginClass !== 'function') {
      parked.plugins.push(entry);
      return;
    }
    let plugin;
    try {
      plugin = new PluginClass(fromPlain(entry.options));
      map.addPlugin(plugin);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn(error);
    }
    if (!plugin || !map.getPlugins().includes(plugin)) {
      parked.plugins.push(entry);
      attempt(() => plugin && plugin.destroy());
    }
  });

  registry.parked = parked;
  return map;
};
