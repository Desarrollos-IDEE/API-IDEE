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
  const layersGroup = map.getLayerGroup();

  layersGroup.forEach((group) => {
    if (group.displayInLayerSwitcher) {
      allLayers.push(group);
      group.getLayers().forEach((layer) => {
        if (layer.type !== IDEE.layer.type.LayerGroup) {
          allLayers.push(layer);
        }
      });
    }
  });
  return allLayers;
};

export const getAllLayersSection = (map) => {
  const allLayers = [];

  const processSection = (section) => {
    allLayers.push(section);
    section.getChildren().forEach((child) => {
      if (child instanceof IDEE.layer.Section) {
        processSection(child);
      } else if (child.displayInLayerSwitcher !== false) {
        allLayers.push(child);
      }
    });
  };

  map.getSections().forEach(processSection);
  return allLayers;
};

export const findSectionById = (idSection, sections = []) => {
  let result = null;
  sections.forEach((section) => {
    if (result !== null) {
      return;
    }
    if (section.idSection === idSection) {
      result = section;
      return;
    }
    const nested = section.getChildren()
      .filter((child) => child instanceof IDEE.layer.Section);
    result = findSectionById(idSection, nested);
  });
  return result;
};

const togglePanelDisplay = (target, expand) => {
  const panel = target.parentElement.parentElement.parentElement.children[1];
  panel.hidden = !expand;
  panel.style.display = '';

  if (expand) {
    target.classList.remove(CLASS_DISPLAY_DESPLEGAR);
    target.classList.remove('g-cartografia-btn-layerswitcher-desplegar');
    target.classList.add(CLASS_DISPLAY_COLAPSAR);
    target.classList.add('g-cartografia-btn-layerswitcher-colapsar');
    target.setAttribute('title', getValue('hide_group'));
    target.setAttribute('aria-label', getValue('hide_group'));
  } else {
    target.classList.remove(CLASS_DISPLAY_COLAPSAR);
    target.classList.remove('g-cartografia-btn-layerswitcher-colapsar');
    target.classList.add(CLASS_DISPLAY_DESPLEGAR);
    target.classList.add('g-cartografia-btn-layerswitcher-desplegar');
    target.setAttribute('title', getValue('show_group'));
    target.setAttribute('aria-label', getValue('show_group'));
  }
};

export const displayLayers = ({ target }, layer, map) => {
  if (target.classList.contains(CLASS_DISPLAY_GROUP)) {
    const expand = target.classList.contains(CLASS_DISPLAY_DESPLEGAR);

    if (layer instanceof IDEE.layer.Section) {
      const sectionLayer = findSectionById(layer.idSection, map.getSections());
      if (sectionLayer === null || sectionLayer === undefined) {
        return;
      }
      togglePanelDisplay(target, expand);
      sectionLayer.collapsed = !expand;
      return;
    }

    const groupLayer = map.getLayerGroup()
      .find((layerGroup) => layerGroup.idLayer === layer.idLayer);

    togglePanelDisplay(target, expand);
    groupLayer.display = expand;
  }
};

export const fiendLayerInGroup = (layer, map) => {
  let group = null;

  const findRecursiveGroup = (layerGroup) => {
    layerGroup.getLayers().forEach((subLayer) => {
      if (subLayer.idLayer === layer.idLayer) {
        group = layerGroup;
      } else if (subLayer.type === IDEE.layer.type.LayerGroup) {
        findRecursiveGroup(subLayer);
      }
    });
  };

  map.getLayerGroup().forEach((subLayer) => {
    findRecursiveGroup(subLayer);
  });

  return group;
};

// Selector de destino de la capa: siempre visible con «Añadir al mapa» (valor vacío)
// y una opción por cada grupo de capas del mapa
export const createSelectGroup = (map) => {
  const groups = map.getLayerGroup()
    .filter((l) => l.isBase === false && l.displayInLayerSwitcher).reverse();

  const select = IDEE.template.compileSync(addInGroupTemplate, {
    vars: {
      groups,
      translations: {
        defaultSelectOption: getValue(I18N_DEFAULT_OPTION_GROUP),
      },
      order: 0,
    },
  });

  const addGroup = document.querySelector(CONTAINER_LAYERGROUP);
  if (addGroup !== null) addGroup.appendChild(select);
};

export const getLayerSelectGroup = (map) => {
  const select = document.querySelector(CLASS_MODAL_LAYERGROUP);
  if (select === null) return undefined;
  const groups = map.getLayerGroup();
  return groups.find((group) => group.idLayer === select.value);
};

export const filterGroups = (layers, inLayerGroup = true) => {
  if (inLayerGroup) {
    return layers.filter((l) => {
      const isTransparent = (l.transparent === true);
      const displayInLayerSwitcher = (l.displayInLayerSwitcher === true);
      const isLayerGroup = (l instanceof IDEE.layer.LayerGroup);
      return isTransparent && displayInLayerSwitcher && isLayerGroup;
    });
  }
  return layers.filter((l) => {
    if (l instanceof IDEE.layer.Section) {
      return true;
    }
    const isTransparent = (l.transparent === true);
    const displayInLayerSwitcher = (l.displayInLayerSwitcher === true);
    return isTransparent && displayInLayerSwitcher;
  });
};
