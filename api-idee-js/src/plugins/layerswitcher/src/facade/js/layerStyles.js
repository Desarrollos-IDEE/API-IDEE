/**
 * @module IDEE/plugin/layerswitcher/layerStyles
 */
import { getValue } from './i18n/language';

export const STYLE_SOURCE = {
  LAYER: 'layer',
  SERVICE: 'service',
  PUBLISHED: 'published',
  CLASS: 'class',
  FILE: 'file',
};

const isEmpty = (value) => IDEE.utils.isNullOrEmpty(value);

const toArray = (value) => {
  if (isEmpty(value)) return [];
  return Array.isArray(value) ? value : [value];
};

const deepClone = (value) => {
  if (Array.isArray(value)) return value.map(deepClone);
  if (value !== null && typeof value === 'object'
    && Object.getPrototypeOf(value) === Object.prototype) {
    return Object.keys(value).reduce((copy, key) => {
      // eslint-disable-next-line no-param-reassign
      copy[key] = deepClone(value[key]);
      return copy;
    }, {});
  }
  return value;
};

const safeSerialize = (style) => {
  try {
    return style.serialize();
  } catch (error) {
    return null;
  }
};

const layerTitle = (layer) => layer.legend || layer.name;

const warnDiscarded = (layer, item, reason) => {
  const label = typeof item === 'string' && item.length < 60 ? item : (item?.name || '');
  // eslint-disable-next-line no-console
  console.warn(getValue('exception.style_discarded')
    .replace('[style]', label)
    .replace('[layer]', layerTitle(layer))
    .replace('[reason]', reason));
};

const getLayerIds = (layer) => {
  const ids = [layer.name];
  if (!isEmpty(layer.namespace)) ids.push(`${layer.namespace}:${layer.name}`);
  return ids.filter((id) => !isEmpty(id));
};

const hasOwnFileStyles = (layer) => (layer.type === 'KML' || layer.type === 'KMZ')
  && (layer.options === null || layer.options?.extractStyles !== false);

const findMatchingByStyle = (layer, entries) => {
  const current = layer.getStyle?.();
  if (!(current instanceof IDEE.Style)) return undefined;
  const same = entries.find((entry) => entry.style === current);
  if (same) return same.id;
  const serialized = safeSerialize(current);
  if (serialized === null) return undefined;
  return entries.find((entry) => entry.style && safeSerialize(entry.style) === serialized)?.id;
};

export class PrechargedStyleResolver {
  constructor({ getServices, matchesUrl }) {
    this.getServices_ = getServices;
    this.matchesUrl_ = matchesUrl;
  }

  findService(type, url) {
    if (isEmpty(type) || isEmpty(url)) return undefined;
    const layerType = String(type).toLowerCase();
    return (this.getServices_() || []).find((service) => service
      && String(service.type).toLowerCase() === layerType
      && !isEmpty(service.url)
      && this.matchesUrl_(service.url, url));
  }

  resolve(layer) {
    const service = this.findService(layer.type, layer.url);
    if (!service) return [];
    const ids = getLayerIds(layer);
    const layerConfig = toArray(service.layers)
      .find((entry) => entry && ids.includes(entry.name));
    const levels = [];
    if (layerConfig && !isEmpty(layerConfig.styles)) {
      levels.push({ source: STYLE_SOURCE.LAYER, items: toArray(layerConfig.styles) });
    }
    if (!isEmpty(service.styles)) {
      levels.push({ source: STYLE_SOURCE.SERVICE, items: toArray(service.styles) });
    }
    return levels;
  }

  hasConfiguredStyles(type, url) {
    const service = this.findService(type, url);
    if (!service) return false;
    return !isEmpty(service.styles)
      || toArray(service.layers).some((entry) => !isEmpty(entry?.styles));
  }
}

const createStyleEntries = (layer, items, source, { createStyle, isCompatible }) => items
  .map((item) => {
    let style;
    try {
      style = createStyle(item);
    } catch (error) {
      warnDiscarded(layer, item, error?.message || String(error));
      return null;
    }
    if (!isCompatible(style)) {
      warnDiscarded(layer, item, getValue('exception.style_incompatible'));
      return null;
    }
    const name = item instanceof IDEE.Style ? style.get('name') : (item?.name ?? style.get('name'));
    return { style, label: isEmpty(name) ? undefined : String(name), source };
  })
  .filter((entry) => entry !== null);

const vectorAdapter = {
  supports: (layer) => layer instanceof IDEE.layer.Vector && !hasOwnFileStyles(layer),
  createStyle: (item) => {
    if (item instanceof IDEE.Style) return item;
    if (typeof item === 'string') return IDEE.Style.deserialize(item);
    return new IDEE.style.Generic(deepClone(item));
  },
  isCompatible: (style) => style instanceof IDEE.Style
    && !(style instanceof IDEE.style.Raster)
    && !(IDEE.style.Tiles3D && style instanceof IDEE.style.Tiles3D),
  toEntries(items, layer, source) {
    return createStyleEntries(layer, items, source, this);
  },
  fromLayer(layer) {
    return createStyleEntries(layer, toArray(layer.predefinedStyles), STYLE_SOURCE.CLASS, this)
      .map((entry, index) => ({ ...entry, isClassDefault: index === 0 }));
  },
  apply(layer, entry) {
    layer.clearStyle();
    layer.setStyle(entry.style);
  },
  mirror(layer, entries) {
    // eslint-disable-next-line no-param-reassign
    layer.predefinedStyles = entries.map((entry) => entry.style);
  },
  getActiveId: findMatchingByStyle,
  getUnsupported(layer, entry) {
    if (typeof layer.getUnsupportedStyleProperties !== 'function' || !entry.style) return [];
    return layer.getUnsupportedStyleProperties(entry.style) || [];
  },
};

const rasterAdapter = {
  supports: (layer) => layer instanceof IDEE.layer.GeoTIFF,
  createStyle: (item) => {
    if (item instanceof IDEE.Style) return item;
    if (typeof item === 'string') return IDEE.Style.deserialize(item);
    return new IDEE.style.Raster(deepClone(item));
  },
  isCompatible: (style) => style instanceof IDEE.style.Raster,
  toEntries(items, layer, source) {
    return createStyleEntries(layer, items, source, this);
  },
  fromLayer(layer) {
    return createStyleEntries(layer, toArray(layer.predefinedStyles), STYLE_SOURCE.CLASS, this);
  },
  apply(layer, entry) {
    layer.setStyle(entry.style);
  },
  mirror: vectorAdapter.mirror,
  getActiveId: findMatchingByStyle,
  getUnsupported: () => [],
};

const getPublishedStyles = (layer) => {
  const styles = layer.capabilitiesMetadata?.style;
  return Array.isArray(styles) ? styles : null;
};

const wmsAdapter = {
  supports: (layer) => layer instanceof IDEE.layer.WMS,
  toEntries(items, layer, source) {
    const published = getPublishedStyles(layer);
    return items.map((item) => {
      const name = typeof item === 'string' ? item : item?.name;
      if (isEmpty(name)) {
        warnDiscarded(layer, item, getValue('exception.style_incompatible'));
        return null;
      }
      const capability = published?.find((style) => style.Name === name);
      if (!isEmpty(published) && !capability) {
        warnDiscarded(layer, name, getValue('exception.style_not_published'));
        return null;
      }
      return { styleName: name, label: capability?.Title || name, source };
    }).filter((entry) => entry !== null);
  },
  fromLayer(layer) {
    return (getPublishedStyles(layer) || [])
      .filter((style) => !isEmpty(style?.Name))
      .map((style) => ({
        styleName: style.Name,
        label: style.Title || style.Name,
        source: STYLE_SOURCE.PUBLISHED,
      }));
  },
  apply(layer, entry) {
    layer.setStyles(entry.styleName);
    const capability = getPublishedStyles(layer)?.find((style) => style.Name === entry.styleName);
    const legend = capability?.LegendURL?.[0]?.OnlineResource;
    if (!isEmpty(legend)) layer.setLegendURL(legend);
  },
  mirror: () => {},
  getActiveId(layer, entries) {
    const current = layer.getStyles?.();
    const name = Array.isArray(current) ? current[0] : String(current ?? '').split(',')[0];
    const match = entries.find((entry) => entry.styleName === name);
    if (match) return match.id;
    if (isEmpty(name) && entries[0]?.source === STYLE_SOURCE.PUBLISHED) return entries[0].id;
    return undefined;
  },
  getUnsupported: () => [],
};

const ADAPTERS = [vectorAdapter, rasterAdapter, wmsAdapter];

export default class LayerStyles {
  constructor({ getServices, matchesUrl, getToolsSupport }) {
    this.resolver_ = new PrechargedStyleResolver({ getServices, matchesUrl });
    this.getToolsSupport_ = getToolsSupport;
    this.states_ = new WeakMap();
    this.fileCounter_ = 0;
  }

  static getAdapter(layer) {
    if (isEmpty(layer)) return null;
    return ADAPTERS.find((adapter) => adapter.supports(layer)) || null;
  }

  hasConfiguredStyles(type, url) {
    return this.resolver_.hasConfiguredStyles(type, url);
  }

  isStyleSupported_(layer) {
    return (this.getToolsSupport_(layer) || {}).style !== false;
  }

  build_(layer, adapter) {
    let entries = [];
    let configured = false;
    this.resolver_.resolve(layer).some(({ source, items }) => {
      entries = adapter.toEntries(items, layer, source);
      configured = entries.length > 0;
      return configured;
    });
    if (!configured) entries = adapter.fromLayer(layer);
    const styleLabel = getValue('style');
    const withIds = entries.map((entry, index) => ({
      ...entry,
      id: entry.styleName || String(index),
      label: entry.label
        || (entry.isClassDefault ? getValue('default_style') : `${styleLabel} ${index + 1}`),
    }));
    return { adapter, entries: withIds, configured };
  }

  getState_(layer) {
    const cached = this.states_.get(layer);
    if (cached) return cached;
    const adapter = LayerStyles.getAdapter(layer);
    if (!adapter) return null;
    const state = this.build_(layer, adapter);
    state.activeId = adapter.getActiveId(layer, state.entries);
    if (state.configured) this.states_.set(layer, state);
    return state;
  }

  applyInitial(layer) {
    const adapter = LayerStyles.getAdapter(layer);
    if (!adapter) return;
    const state = this.build_(layer, adapter);
    if (!state.configured) return;
    adapter.mirror(layer, state.entries);
    this.states_.set(layer, state);
    this.select(layer, state.entries[0].id);
  }

  getEntries(layer) {
    return this.getState_(layer)?.entries || [];
  }

  getActiveId(layer) {
    return this.getState_(layer)?.activeId;
  }

  hasAlternatives(layer) {
    return this.isStyleSupported_(layer) && this.getEntries(layer).length > 1;
  }

  supportsClientStyles(layer) {
    return vectorAdapter.supports(layer) && this.isStyleSupported_(layer);
  }

  getUnsupported(layer, entry) {
    const state = this.getState_(layer);
    if (!state || !entry) return [];
    return state.adapter.getUnsupported(layer, entry);
  }

  select(layer, id) {
    const state = this.getState_(layer);
    const entry = state?.entries.find((candidate) => candidate.id === id);
    if (!entry) return undefined;
    state.adapter.apply(layer, entry);
    state.activeId = entry.id;
    this.states_.set(layer, state);
    const unsupported = state.adapter.getUnsupported(layer, entry);
    if (unsupported.length > 0) {
      // eslint-disable-next-line no-console
      console.warn(getValue('style_unsupported').replace('[props]', unsupported.join(', ')));
    }
    return entry;
  }

  addEntries(layer, styles) {
    const state = this.getState_(layer);
    if (!state || state.adapter !== vectorAdapter || isEmpty(styles)) return undefined;
    const added = styles.map((item) => {
      this.fileCounter_ += 1;
      return {
        style: item.style,
        label: item.label,
        source: STYLE_SOURCE.FILE,
        id: `file-${this.fileCounter_}`,
      };
    });
    state.entries = state.entries.concat(added);
    state.configured = true;
    state.adapter.mirror(layer, state.entries);
    this.states_.set(layer, state);
    return added;
  }
}
