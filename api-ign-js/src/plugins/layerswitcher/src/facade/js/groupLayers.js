import addInGroupTemplate from 'templates/addInGroup';
import { getValue } from './i18n/language';

// I18N - Traducciones
const I18N_DEFAULT_OPTION_GROUP = 'defaultOptionGroup';

// Display
const CLASS_DISPLAY_GROUP = 'm-layerswitcher-groupDisplay';
const CLASS_DISPLAY_DESPLEGAR = 'm-layerswitcher-icons-desplegar';
const CLASS_DISPLAY_COLAPSAR = 'm-layerswitcher-icons-colapsar';

// Selector de grupos
const CLASS_MODAL_LAYERGROUP = '.m-layerswitcher-groups-fields';
const CONTAINER_LAYERGROUP = '#m-layerswitcher-groups-fields';

export const getAllLayersGroup = (map) => {
  const allLayers = [];
  const layersGroup = map.getImpl().getGroupedLayers();

  layersGroup.forEach((group) => {
    if (group.displayInLayerSwitcher) {
      allLayers.push(group);
      group.getLayers().forEach((layer) => {
        if (layer.type !== M.layer.type.LayerGroup) {
          allLayers.push(layer);
        }
      });
    }
  });
  return allLayers;
};

export const displayLayers = ({ target }, layer, map) => {
  if (target.classList.contains(CLASS_DISPLAY_GROUP)) {
    const groupLayer = map.getLayerGroup().find((layerGroup) => layerGroup.name === layer.name);

    const group = target.parentElement.parentElement.parentElement.children[1];
    group.style.display = group.style.display === 'none' ? 'block' : 'none';

    if (target.classList.contains(CLASS_DISPLAY_DESPLEGAR)) {
      target.classList.remove(CLASS_DISPLAY_DESPLEGAR);
      target.classList.add(CLASS_DISPLAY_COLAPSAR);
      target.setAttribute('title', getValue('hide_group'));
      target.setAttribute('aria-label', getValue('hide_group'));

      groupLayer.display = true;
    } else {
      target.classList.remove(CLASS_DISPLAY_COLAPSAR);
      target.classList.add(CLASS_DISPLAY_DESPLEGAR);
      target.setAttribute('title', getValue('show_group'));
      target.setAttribute('aria-label', getValue('show_group'));
      groupLayer.display = false;
    }
  }
};

export const fiendLayerInGroup = (layer, map) => {
  let group = null;

  const findRecursiveGroup = (layerGroup) => {
    layerGroup.getLayers().forEach((subLayer) => {
      if (subLayer.name === layer.name) {
        group = layerGroup;
      } else if (subLayer.type === M.layer.type.LayerGroup) {
        findRecursiveGroup(subLayer);
      }
    });
  };

  map.getLayerGroup().forEach((subLayer) => {
    findRecursiveGroup(subLayer);
  });

  return group;
};

export const createSelectGroup = (map) => {
  const groups = map.getLayerGroup()
    .filter((l) => l.isBase === false && l.displayInLayerSwitcher).reverse();

  const select = M.template.compileSync(addInGroupTemplate, {
    vars: {
      groups,
      translations: {
        defaultSelectOption: getValue(I18N_DEFAULT_OPTION_GROUP),
      },
      order: 0,
    },
  });

  const addGroup = document.querySelector(CONTAINER_LAYERGROUP);
  addGroup.appendChild(select);
};

export const getLayerSelectGroup = (map) => {
  const select = document.querySelector(CLASS_MODAL_LAYERGROUP);
  const groups = map.getLayerGroup();
  return groups.find((group) => group.getImpl().getOL3Layer().ol_uid === select.value);
};

export const filterGroups = (layers, inLayerGroup = true) => {
  if (inLayerGroup) {
    return layers.filter((l) => {
      const isTransparent = (l.transparent === true);
      const displayInLayerSwitcher = (l.displayInLayerSwitcher === true);
      const isLayerGroup = (l instanceof M.layer.LayerGroup);
      return isTransparent && displayInLayerSwitcher && isLayerGroup;
    });
  }
  return layers.filter((l) => {
    const isTransparent = (l.transparent === true);
    const displayInLayerSwitcher = (l.displayInLayerSwitcher === true);
    return isTransparent && displayInLayerSwitcher;
  });
};
