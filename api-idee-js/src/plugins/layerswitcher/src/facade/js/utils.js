//  Esta función ordena todas las capas por zindex
export const reorderLayers = (layers) => {
  const result = layers.sort((layer1, layer2) => layer1.getZIndex()
      - layer2.getZIndex()).reverse();
  return result;
};

export const removeLayerGroup = (layer) => {
  const group = layer.getImpl().rootGroup;

  group.getLayers().forEach((groupLayer) => {
    if (groupLayer.idLayer === layer.idLayer) {
      group.removeLayer(groupLayer);
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
    } else if (layer.getImpl().rootGroup) {
      removeLayerGroup(layer);
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
    message.focus();
    message.click();
  }, 100);
};
