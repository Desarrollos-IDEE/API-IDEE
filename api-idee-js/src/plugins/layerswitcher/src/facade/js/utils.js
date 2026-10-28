import { fiendLayerInGroup } from './groupLayers';

//  Esta función ordena todas las capas por zindex
export const reorderLayers = (layers) => {
  const result = layers.sort((layer1, layer2) => layer1.getZIndex()
      - layer2.getZIndex()).reverse();
  return result;
};

export const removeLayerGroup = (layer, map) => {
  const group = fiendLayerInGroup(layer, map);
  if (IDEE.utils.isNullOrEmpty(group)) return;

  group.getLayers().forEach((groupLayer) => {
    if (groupLayer.idLayer === layer.idLayer) {
      group.removeLayers(groupLayer);
    }
  });
};

const removeNestedSection = (section) => {
  const parent = section.parent;
  if (IDEE.utils.isNullOrEmpty(parent)) {
    return;
  }

  if (!IDEE.utils.isNullOrEmpty(section.map)) {
    section.map.removeLayers(section.getAllLayers());
  }

  parent.getChildren().remove(section);
  // eslint-disable-next-line no-param-reassign
  section.parent = null;
};

export const removeLayersInLayerSwitcher = (evt, layer, map) => {
  if (evt.target.className.indexOf('g-cartografia-btn-layerswitcher-delete') > -1) {
    if (layer instanceof IDEE.layer.Section) {
      if (layer.parent) {
        removeNestedSection(layer);
      } else {
        map.removeSections(layer);
      }
      map.fire(IDEE.evt.REMOVED_LAYER, [layer]);
    } else if (fiendLayerInGroup(layer, map)) {
      removeLayerGroup(layer, map);
    } else {
      map.removeLayers(layer);
    }
  }
};

export const addAttributions = (layers) => {
  return layers.map((l) => {
    const layer = l;
    const attributions = layer.capabilitiesMetadata.attribution;

    if (attributions !== undefined) {
      const {
        Title,
        OnlineResource,
        ProviderName,
        ProviderSite,
      } = attributions;

      layer.attribution = {
        name: Title || ProviderName,
        url: OnlineResource || ProviderSite,
        nameLayer: layer.name,
        id: window.crypto.randomUUID(),
      };
      return layer;
    }
    return layer;
  });
};

export const focusModal = (id) => {
  setTimeout(() => {
    const message = document.querySelector(id);
    // El diálogo puede haberse cerrado antes de enfocarlo
    if (message === null) return;
    // Si el temporizador llega tarde y ya se está escribiendo en otro campo, no se le quita el foco
    const active = document.activeElement;
    if (active !== null && active !== message && ['INPUT', 'SELECT', 'TEXTAREA'].includes(active.tagName)) {
      return;
    }
    message.focus();
    message.click();
  }, 100);
};
