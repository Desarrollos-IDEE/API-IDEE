import Sortable from 'sortablejs';
import { findSectionById, getAllLayersGroup, getAllLayersSection } from './groupLayers';
// import { getValue } from './i18n/language';

const LAYER_NOT_URL = ['OSM', 'GeoJSON', 'MBTilesVector', 'MBTiles', 'LayerGroup'];

const findDropContainer = (map, id) => {
  if (IDEE.utils.isNullOrEmpty(id)) {
    return null;
  }

  const group = map.getLayerGroup().find((g) => g.idLayer === id);
  if (group !== undefined) {
    return { container: group, isSection: false };
  }

  const section = findSectionById(id, map.getSections());
  if (section !== null) {
    return { container: section, isSection: true };
  }

  return null;
};

const setZIndex = (maxZIndex, parentElem, layers) => {
  let zindex = maxZIndex;
  const children = parentElem.children;
  const parentType = parentElem.getAttribute('data-layer-type');
  if (parentType === 'LayerGroup' || parentType === 'Section') {
    const id = parentElem.getAttribute('data-layer-id');
    const filtered = layers.filter((layer) => layer.idLayer === id || layer.idSection === id);
    if (filtered.length > 0) {
      filtered[0].setZIndex(zindex);
      zindex -= 1;
    }
  }
  if (children && children.length > 0) {
    [...children].forEach((c) => {
      if (!c.classList.contains('m-layerswitcher-sectionPanel-header')) {
        const childType = c.getAttribute('data-layer-type');
        if (childType === 'LayerGroup'
        || childType === 'Section'
        || c.classList.contains('m-layerswitcher-ullayersGroup')) {
          zindex = setZIndex(zindex, c, layers);
        } else {
          const id = c.getAttribute('data-layer-id');
          const name = c.getAttribute('data-layer-name');
          const url = c.getAttribute('data-layer-url') || undefined;
          const type = c.getAttribute('data-layer-type');

          const filtered = layers.filter((layer) => {
            return layer.idLayer === id && layer.name === name && (layer.url === url
              || (layer.url === undefined && LAYER_NOT_URL.includes(layer.type)))
                && layer.type === type;
          });
          if (filtered.length > 0) {
            filtered[0].setZIndex(zindex);
            zindex -= 1;
          }
        }
      }
    });
  }

  return zindex;
};

const handleOnAdd = (map) => (evt) => {
  // De mapa a mapa (no se hace nada)
  if (evt.to.classList.contains('m-layerswitcher-ullayers')
        && evt.from.classList.contains('m-layerswitcher-ullayers')) {
    return;
  }

  const idFrom = evt.from.getAttribute('data-layer-id');
  const itemId = evt.item.getAttribute('data-layer-id');
  const idTo = evt.to.getAttribute('data-layer-id');

  // De grupo a mapa
  const isToMap = (evt.to.classList.contains('m-layerswitcher-ullayers')
      && evt.from.classList.contains('m-layerswitcher-ullayersGroup'));

  // De mapa a grupo
  const isFromMap = (evt.from.classList.contains('m-layerswitcher-ullayers')
      && evt.to.classList.contains('m-layerswitcher-ullayersGroup'));

  // De grupo a grupo
  const isGroupToGroup = (evt.from.classList.contains('m-layerswitcher-ullayersGroup')
      && evt.to.classList.contains('m-layerswitcher-ullayersGroup'));

  const fromContainer = isToMap || isGroupToGroup
    ? findDropContainer(map, idFrom) : null;
  const toContainer = isFromMap || isGroupToGroup
    ? findDropContainer(map, idTo) : null;

  let item = null;
  if (isToMap || isGroupToGroup) {
    if (fromContainer !== null) {
      if (fromContainer.isSection) {
        item = fromContainer.container.getChildren()
          .find((l) => l.idLayer === itemId || l.idSection === itemId);
      } else {
        item = fromContainer.container.getLayers().find((l) => l.idLayer === itemId);
      }
    }
  } else {
    item = map.getLayers().find((l) => l.idLayer === itemId);
  }

  if (!item) {
    return;
  }
  if ((isToMap || isGroupToGroup) && fromContainer === null) {
    return;
  }
  if ((isFromMap || isGroupToGroup) && toContainer === null) {
    return;
  }

  // if (item instanceof IDEE.layer.MBTilesVector
  //     || item instanceof IDEE.layer.MBTiles) {
  //   IDEE.toast.error(getValue('exception.not_layerGroup'), null, 6000);
  //   return;
  // }

  if (item.checkedLayer === 'true') {
    item.checkedLayer = 'false';
    item.setVisible(false);
  }

  if (isToMap || isGroupToGroup) {
    if (fromContainer.isSection) {
      fromContainer.container.ungroup(item, isToMap);
    } else {
      fromContainer.container.ungroup(item, true);
    }
  }
  if (isFromMap || isGroupToGroup) {
    if (toContainer.isSection) {
      toContainer.container.addChildren(item);
    } else {
      map.removeLayers(item);
      toContainer.container.addLayers(item);
    }
  }
};

const handleOnEnd = (map, overlayLayers) => (evt) => {
  const layers = getAllLayersGroup(map)
    .concat(getAllLayersSection(map))
    .concat(map.getRootLayers());

  let maxZIndex = 0;

  const filterLayers = layers
    .filter((l) => l.displayInLayerSwitcher === true || l instanceof IDEE.layer.Section);
  maxZIndex = Math.max(...(filterLayers.map((l) => {
    return l.getZIndex();
  })));
  const root = document.querySelector('.m-layerswitcher-ullayers');
  setZIndex(maxZIndex, root, filterLayers);
};

const generateSortable = (map, overlayLayers) => {
  [...document.querySelectorAll('.nested-sortable')].forEach((nestedSortable) => {
    // eslint-disable-next-line no-new
    new Sortable(nestedSortable, {
      group: 'nested',
      animation: 150,
      fallbackOnBody: true,
      preventOnFilter: false,
      ghostClass: 'm-layerswitcher-gray-shadow',
      filter: '.m-layerswitcher-opacity',
      swapThreshold: 0.65,
      onAdd: handleOnAdd(map),
      onEnd: handleOnEnd(map, overlayLayers),
    });
  });
};

export default generateSortable;
