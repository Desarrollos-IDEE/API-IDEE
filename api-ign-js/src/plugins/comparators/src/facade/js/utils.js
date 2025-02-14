import { handlerErrorGenericLayer, handlerErrorTileLoadFunction } from './errorhandling';

export const dicAccesibilityButton = {
  'set-mirror-0': [
    {
      id: 'mapLASelect_label',
      text: {
        principalMap: 'Capas del mapa:',
        secondaryMap: 'Capas del mapa:',
      },
    },
  ],
  'set-mirror-1': [
    {
      id: 'mapLASelect_label',
      text: {
        principalMap: 'Capas del mapa derecho:',
        secondaryMap: 'Capas del mapa izquierdo:',
      },
    },
    {
      id: 'mapLBSelect_label',
      text: {
        principalMap: 'Capas del mapa izquierdo:',
        secondaryMap: 'Capas del mapa derecho:',
      },
    },
  ],
  'set-mirror-2': [
    {
      id: 'mapLASelect_label',
      text: {
        principalMap: 'Capas del mapa superior:',
        secondaryMap: 'Capas del mapa superior:',
      },
    },
    {
      id: 'mapLBSelect_label',
      text: {
        principalMap: 'Capas del mapa inferior:',
        secondaryMap: 'Capas del mapa inferior:',
      },
    },
  ],
  'set-mirror-3': [
    {
      id: 'mapLASelect_label',
      text: {
        principalMap: 'Capas del mapa derecho:',
        secondaryMap: 'Capas del mapa izquierdo:',
      },
    },
    {
      id: 'mapLBSelect_label',
      text: {
        principalMap: 'Capas del mapa central:',
        secondaryMap: 'Capas del mapa central:',
      },
    },
    {
      id: 'mapLCSelect_label',
      text: {
        principalMap: 'Capas del mapa izquierdo:',
        secondaryMap: 'Capas del mapa derecho:',
      },
    }],
  'set-mirror-4': [
    {
      id: 'mapLASelect_label',
      text: {
        principalMap: 'Capas del mapa derecho:',
        secondaryMap: 'Capas del mapa izquierdo:',
      },
    },
    {
      id: 'mapLBSelect_label',
      text: {
        principalMap: 'Capas del mapa central derecho:',
        secondaryMap: 'Capas del mapa central izquierdo:',
      },
    },
    {
      id: 'mapLCSelect_label',
      text: {
        principalMap: 'Capas del mapa central izquierdo:',
        secondaryMap: 'Capas del mapa central derecho:',
      },
    },
    {
      id: 'mapLDSelect_label',
      text: {
        principalMap: 'Capas del mapa izquierdo:',
        secondaryMap: 'Capas del mapa derecho:',
      },
    },
  ],
  'set-mirror-5': [
    {
      id: 'mapLASelect_label',
      text: {
        principalMap: 'Capas del mapa superior derecho:',
        secondaryMap: 'Capas del mapa superior izquierdo:',
      },
    },
    {
      id: 'mapLBSelect_label',
      text: {
        principalMap: 'Capas del mapa superior izquierdo:',
        secondaryMap: 'Capas del mapa superior derecho:',
      },
    },
    {
      id: 'mapLCSelect_label',
      text: {
        principalMap: 'Capas del mapa inferior izquierdo:',
        secondaryMap: 'Capas del mapa inferior izquierdo:',
      },
    },
    {
      id: 'mapLDSelect_label',
      text: {
        principalMap: 'Capas del mapa inferior derecho:',
        secondaryMap: 'Capas del mapa inferior derecho:',
      },
    },
  ],
  'set-mirror-6': [
    {
      id: 'mapLASelect_label',
      text: {
        principalMap: 'Capas del primer mapa:',
        secondaryMap: 'Capas del primer mapa:',
      },
    },
    {
      id: 'mapLBSelect_label',
      text: {
        principalMap: 'Capas del segundo mapa:',
        secondaryMap: 'Capas del segundo mapa:',
      },
    },
    {
      id: 'mapLCSelect_label',
      text: {
        principalMap: 'Capas del tercer mapa:',
        secondaryMap: 'Capas del tercer mapa:',
      },
    },
    {
      id: 'mapLDSelect_label',
      text: {
        principalMap: 'Capas del cuarto mapa:',
        secondaryMap: 'Capas del cuarto mapa:',
      },
    },
  ],
  'set-mirror-7': [
    {
      id: 'mapLASelect_label',
      text: {
        principalMap: 'Capas del mapa derecho:',
        secondaryMap: 'Capas del mapa izquierdo:',
      },
    },
    {
      id: 'mapLBSelect_label',
      text: {
        principalMap: 'Capas del mapa central:',
        secondaryMap: 'Capas del mapa central:',
      },
    },
    {
      id: 'mapLCSelect_label',
      text: {
        principalMap: 'Capas del mapa izquierdo:',
        secondaryMap: 'Capas del mapa derecho:',
      },
    },
  ],
  'set-mirror-8': [
    {
      id: 'mapLASelect_label',
      text: {
        principalMap: 'Capas del mapa superior:',
        secondaryMap: 'Capas del mapa superior:',
      },
    },
    {
      id: 'mapLBSelect_label',
      text: {
        principalMap: 'Capas del mapa izquierdo:',
        secondaryMap: 'Capas del mapa izquierdo:',
      },
    },
    {
      id: 'mapLCSelect_label',
      text: {
        principalMap: 'Capas del mapa derecho:',
        secondaryMap: 'Capas del mapa derecho:',
      },
    },
  ],
  'set-mirror-9': [
    {
      id: 'mapLASelect_label',
      text: {
        principalMap: 'Capas del mapa derecho:',
        secondaryMap: 'Capas del mapa izquierdo:',
      },
    },
    {
      id: 'mapLBSelect_label',
      text: {
        principalMap: 'Capas del mapa izquierdo:',
        secondaryMap: 'Capas del mapa derecho:',
      },
    },
    {
      id: 'mapLCSelect_label',
      text: {
        principalMap: 'Capas del mapa inferior:',
        secondaryMap: 'Capas del mapa inferior:',
      },
    },
  ],
};

export const getNameString = (value) => {
  const [type,, nameWMTS, nameWMS] = value.split('*');
  return (type === 'WMS') ? nameWMS : nameWMTS;
};

/**
 * @param {*} layer Capa del evento
 * @param {*} comparatorLayers Capas del comparador
 * @returns {Array} Capas del comparador activa y otras capas
 */
export const checkLayers = (layer, comparatorLayers) => {
  let activeLayerComparators = null;
  const otherLayers = [];

  layer.forEach((l) => {
    const some = comparatorLayers.some((c) => l.name === getNameString(c));
    if (some) {
      activeLayerComparators = l;
    } else {
      otherLayers.push(l);
    }
  });

  return [activeLayerComparators, otherLayers];
};

/**
 * Este método se encarga de obtener los parámetros de la
 * capa
 * @function
 * @param {M.layer.WMS | M.layer.WMTS} layer Capa WMS o WMTS
 * @return {Array<String> | false} Array con las capas o false si no es un objeto
 */
export const transformToStringLayers = (layer, map, remove = true) => {
  if (layer.type === 'WMS') {
    const {
      url, name, legend, useCapabilities, options, version,
    } = layer;
    if (remove) { map.removeWMS(name); }
    return `WMS*${legend}*${url}*${name}*true*${options.format || 'image/png'}*${useCapabilities}*${version}`;
  } if (layer.type === 'WMTS') {
    const {
      url, name, legend, matrixSet, options,
      useCapabilities,
      // transparent, options, displayInLayerSwitcher,
    } = layer;
    if (remove) { map.removeWMTS(name); }
    const { code } = map.getProjection();
    return `WMTS*${url}*${name}*${matrixSet || code}*${legend}*${options.format || 'image/png'}*${useCapabilities}`;
  }

  return false; // No son objetos
};

export const transformToLayers = (layers, index) => {
  const transform = layers.map((layer) => {
    const urlLayer = layer.split('*');
    if (urlLayer[0].toUpperCase() === 'WMS') {
      const l = new M.layer.WMS({
        url: urlLayer[2],
        name: urlLayer[3],
        legend: urlLayer[1],
        format: urlLayer[4],
        useCapabilities: urlLayer[5] === 'true' || false,
        version: urlLayer[7],
      });
      l.setZIndex(index);
      return l;
    }

    const l = new M.layer.WMTS({
      url: urlLayer[1],
      name: urlLayer[2],
      legend: urlLayer[4],
      matrixSet: urlLayer[3],
      transparent: true, // Es una capa Overlay -> zIndex > 0
      queryable: false, // No GetFeatureInfo
      visibility: false, // Visible a false por defecto
      format: urlLayer[5],
      useCapabilities: urlLayer[6] === 'true' || false,
    }, { displayInLayerSwitcher: false });
    l.setZIndex(index);

    return l;
  });
  return transform;
};

export const formatearID = (str) => {
  return str.replace(/[^\w$]/g, '');
};

function normalizeString(text) {
  let newText = text.replace(/,/g, '');
  newText = newText.replace(/\*/g, '');
  return newText;
}

/**
 * This methods gets the kml url parameters
 *
 * @public
 * @function
 */
function getKML(layer) {
  return `KML*${layer.name}*${layer.url}*${layer.extract}*${layer.label}*${layer.isVisible()}`;
}

/**
 * This method gets the geojson url parameter
 *
 * @public
 * @function
 */
function getGeoJSON(layer) {
  const source = !M.utils.isUndefined(layer.source)
    ? layer.serialize()
    : layer.url;
  const style = (layer.getStyle()) ? layer.getStyle().serialize() : '';
  return `GeoJSON*${layer.name}*${source}*${layer.extract}*${style}`;
}

/**
 * This method gets the ogcApiFeatures url parameter
 *
 * @public
 * @function
 */
function getOGCAPIFeatures(layer) {
  const style = (layer.getStyle()) ? layer.getStyle().serialize() : '';
  return `OGCAPIFeatures*${layer.legend || layer.name}*${layer.url}*${layer.name}*${layer.limit || ''}*${layer.bbox || ''}*${layer.id || ''}*${layer.offset || ''}*${layer.format || ''}*${style}*${layer.extract || ''}`;
}

/**
 * This method gets the geojson url parameter
 *
 * @public
 * @function
 */
function getVector(layer) {
  let source = Object.assign(layer.toGeoJSON());
  source.crs = {
    properties: {
      name: 'EPSG:4326',
    },
    type: 'name',
  };
  source = window.btoa(unescape(encodeURIComponent(JSON.stringify(source))));
  const style = (layer.getStyle()) ? layer.getStyle().serialize() : '';
  return `GeoJSON*${layer.name}*${source}**${style}`;
}

/**
 * This method gets the mvt url parameter
 *
 * @public
 * @function
 */
function getMVT(layer) {
  return `MVT*${layer.url}*${layer.name}*${layer.getProjection()}`;
}

/**
 * This method gets the wms url parameter
 *
 * @public
 * @function
 */
function getWMS(layer) {
  return `WMS*${normalizeString(layer.legend || layer.name)}*${layer.url}*${layer.name}*${layer.transparent}*${layer.tiled}*${layer.userMaxExtent || ''}*${layer.version}*${layer.displayInLayerSwitcher}*${layer.isQueryable()}*${layer.isVisible()}`;
}

/**
 * This method gets the wfs url parameter
 *
 * @public
 * @function
 */
function getWFS(layer) {
  const style = layer.getStyle().serialize();
  return `WFS*${normalizeString(layer.legend || layer.name)}*${layer.url}*${layer.namespace}:${layer.name}:*${layer.geometry || ''}*${layer.ids || ''}*${layer.cql || ''}*${style || ''}`;
}

/**
 * This method gets the wmts url parameter
 *
 * @public
 * @function
 */
function getWMTS(layer, map) {
  const { code } = map.getProjection();
  let legend = null;
  try {
    legend = layer.getLegend();
  } catch (err) {
    legend = layer.legend;
  }
  return `WMTS*${layer.url}*${layer.name}*${layer.matrixSet || code}*${normalizeString(legend)}*${layer.transparent}*${layer.options.format || 'image/png'}*${layer.displayInLayerSwitcher}*${layer.isQueryable()}*${layer.isVisible()}`;
}

function getXYZ(layer) {
  return `XYZ*${normalizeString(layer.legend || layer.name)}*${layer.url}*${layer.isVisible()}*${layer.transparent}*${layer.displayInLayerSwitcher}*${normalizeString(layer.legend || '')}`;
}

function getTMS(layer) {
  return `TMS*${normalizeString(layer.legend || layer.name)}*${layer.url}*${layer.isVisible()}*${layer.transparent}*${layer.tileGridMaxZoom}*${layer.displayInLayerSwitcher}*${normalizeString(layer.legend || '')}`;
}

function getOSM(layer) {
  return `OSM*${normalizeString(layer.legend || layer.name)}*${normalizeString(layer.legend || '')}*${layer.url}*${layer.isVisible()}*${layer.transparent}`;
}

function getMBTiles(layer) {
  if (layer.url === undefined) {
    handlerErrorTileLoadFunction(layer);
    return '';
  }
  return `MBTiles*${normalizeString(layer.legend || layer.name)}*${layer.url}*${layer.name}*${layer.transparent}*${layer.isVisible()}*${layer.getOpacity()}*${layer.maxZoom}*${layer.userMaxExtent || ''}`;
}

function getMBTilesVector(layer) {
  if (layer.url === undefined) {
    handlerErrorTileLoadFunction(layer);
    return '';
  }

  const style = layer.getStyle().serialize();
  return `MBTilesVector*${normalizeString(layer.legend || layer.name)}*${layer.url}*${layer.name}*${layer.isVisible()}**${style}*${layer.extract}`;
}

function layerToParam(layer, map) {
  let param;
  if (layer.name === 'osm' || layer.type === 'OSM') {
    param = layer.transparent === true ? getOSM(layer) : 'OSM';
  } else if (/mapbox/.test(layer.name)) {
    param = `MAPBOX.${layer.name}`;
  } else if (layer.type === 'WMS') {
    param = getWMS(layer);
  } else if (layer.type === 'WMTS') {
    param = getWMTS(layer, map);
  } else if (layer.type === 'XYZ') {
    param = getXYZ(layer);
  } else if (layer.type === 'MBTilesVector') {
    param = getMBTilesVector(layer);
  } else if (layer.type === 'MBTiles') {
    param = getMBTiles(layer);
  } else if (layer.type === 'TMS') {
    param = getTMS(layer);
  } else if (layer.type === 'KML') {
    param = getKML(layer);
  } else if (layer.type === 'WFS') {
    param = getWFS(layer);
  } else if (layer.type === 'GeoJSON') {
    param = getGeoJSON(layer);
  } else if (layer.type === 'Vector') {
    param = getVector(layer);
  } else if (layer.type === 'MVT') {
    param = getMVT(layer);
  } else if (layer.type === 'OGCAPIFeatures') {
    param = getOGCAPIFeatures(layer);
  } else if (layer.type === 'GenericRaster' || layer.type === 'GenericVector') {
    handlerErrorGenericLayer();
    return '';
  }
  return param;
}

/**
   * This method gets the layers parameters
   *
   * @public
   * @function
   */
export function getLayers(map) {
  const layers = map.getLayers().filter((layer) => {
    if (layer.displayInLayerSwitcher === false) {
      return false;
    }

    let res = layer.name !== '__draw__' && layer.name !== 'selectionLayer';
    if (layer.name === 'attributions' && layer.type === 'KML') {
      res = res && false;
    }

    if (layer.transparent === false) {
      res = res && false;
    }

    return res;
  });

  return layers.map((layer) => layerToParam(layer, map)).filter((param) => param != null);
}

/**
   * This method gets the layers parameters
   *
   * @public
   * @function
   */
export function getBaseLayers(map) {
  return map.getBaseLayers()
    .map((layer) => layerToParam(layer, map))
    .filter((param) => param != null)
    .reverse();
}
