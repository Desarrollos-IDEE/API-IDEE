import changeNameTemplate from 'templates/changename';
import { getValue } from './i18n/language';
import { fiendLayerInGroup } from './groupLayers';
import configTemplate from '../../templates/config';
import { focusModal } from './utils';

/* CHANGE NAME */
// I18N - Traducciones
const I18N_CHANGE = 'change';
const I18N_CHANGE_NAME = 'change_name';
const I18N_CLOSE = 'close';

// I18N - Traducciones INFO LAYER
export const TRANSLATIONS_OGCAPIFEATURES_WMS_WMTS = {
  title: getValue('title'),
  name: getValue('name'),
  abstract: getValue('abstract'),
  provider: getValue('provider'),
  service_info: getValue('service_info'),
  download_center: getValue('download_center'),
  see_more: getValue('see_more'),
  metadata_abstract: getValue('metadata_abstract'),
  responsible: getValue('responsible'),
  access_constraints: getValue('access_constraints'),
  use_constraints: getValue('use_constraints'),
  online_resources: getValue('online_resources'),
  see_more_layer: getValue('see_more_layer'),
  see_more_service: getValue('see_more_service'),
  metadata: getValue('metadata'),
  attributes: getValue('attributes'),
};

export const TRANSLATIONS_INFO_LAYER = {
  title: getValue('title'),
  name: getValue('name'),
  n_obj_geo: getValue('n_obj_geo'),
  extension: getValue('extension'),
  attributes: getValue('attributes'),
  values: getValue('values'),
  attribution: getValue('attribution'),
  description: getValue('description'),
  minzoom: getValue('minzoom'),
  maxzoom: getValue('maxzoom'),
  center: getValue('center'),
};

// Selector de cambio de nombre
const SELECTOR_CHANGE_NAME = 'div.m-mapea-container div.m-dialog #m-layer-change-name input';

// Contenedor de diálogo
const SELECTOR_DIALOG = 'div.m-mapea-container div.m-dialog';

// Botón de cambio de nombre
const ID_SELECTOR_CHANGE_NAME_BUTTON = '#m-layer-change-name button';

// Botón de cerrar diálogo
const ID_SELECTOR_CLOSE_DIALOG = 'div.m-dialog.info div.m-button > button';
const WIDTH_BUTTON = '75px';
const COLOR_BUTTON = '#71a7d3';

/* EYE SELECT LAYER */
const CLASS_CHECK = 'm-layerswitcher-check';

/* LEGEND LAYER */
const I18N_LEGEND_ERROR = 'legend_error';

const LEGEND_DEFAULT_IMG = 'assets/img/legend-default.png';

/* TARGET LAYER */
const layersTypesTarget = ['WMTS', 'WFS', 'MBTilesVector', 'MBTiles', 'OSM', 'XYZ', 'TMS', 'GeoJSON', 'KML', 'OGCAPIFeatures', 'Vector', 'GenericRaster', 'GenericVector', 'MVT', 'GeoTIFF', 'MapLibre'];

/* CHANGE NAME */
const changeLayerLegend = (layer, target) => {
  const element = target;
  const newValue = document.querySelector(SELECTOR_CHANGE_NAME).value.trim();
  if (newValue.length > 0) {
    layer.setLegend(newValue);
    document.querySelector(SELECTOR_DIALOG).remove();
    element.lastChild.textContent = ` ${newValue} `;
  }
};

export const showModalChangeName = (layer, target, order) => {
  if (target.className.indexOf('m-layerswitcher-title-box') > -1
  || target.className.indexOf('m-layerswitcher-sectionPanel-header-text') > -1) {
    const changeName = M.template.compileSync(changeNameTemplate, {
      jsonp: true,
      parseToHtml: false,
      vars: {
        name: layer.legend || layer.name,
        translations: {
          change: getValue(I18N_CHANGE),
        },
        order,
      },
    });

    M.dialog.info(changeName, getValue(I18N_CHANGE_NAME), order);

    document.querySelector(ID_SELECTOR_CHANGE_NAME_BUTTON).addEventListener('click', () => {
      changeLayerLegend(layer, target);
    });

    const button = document.querySelector(ID_SELECTOR_CLOSE_DIALOG);
    button.innerHTML = getValue(I18N_CLOSE);
    button.style.width = WIDTH_BUTTON;
    button.style.backgroundColor = COLOR_BUTTON;
  }
};

/* EYE SELECT LAYER */
export const showHideLayersEye = (evt, layer, self) => {
  const selectLayer = evt.target.getAttribute('data-select-type');

  if (evt.target.className.indexOf('m-layerswitcher-check') > -1 && selectLayer === 'eye') {
    if (evt.target.classList.contains(CLASS_CHECK)) {
      if (layer.transparent === true || !layer.isVisible()) {
        layer.setVisible(!layer.isVisible());
        self.render();
      }
    }
  }
};

/* LEGEND LAYER */
const errorLegendLayer = (layer, useProxy, statusProxy) => {
  return new Promise((success) => {
    let legend = '';
    if (layer.type === 'TMS') {
      legend = layer.url.replace('{z}/{x}/{-y}', '0/0/0');
    } else if (layer.type === 'XYZ') {
      legend = layer.url.replace('{z}/{x}/{y}', '0/0/0');
    } else if (layer.type === 'OSM') {
      let url = layer.getImpl().getOL3Layer().getSource().getUrls();
      if (url.length > 0) {
        url = url[0];
      }
      legend = url.replace('{z}/{x}/{y}', '0/0/0');
    }
    if (legend !== '') {
      M.proxy(useProxy);
      M.remote.get(legend).then((response) => {
        if (response.code !== 200) {
          legend = '';
        }
        success(legend);
      });
      M.proxy(statusProxy);
    } else {
      success('error legend');
    }
  });
};

export const legendInfo = (evt, layer, useProxy, statusProxy) => {
  if (evt.target.className.indexOf('m-layerswitcher-icons-image') > -1) {
    const legend = evt.target.parentElement.parentElement.parentElement.querySelector('.m-layerswitcher-legend');
    if (legend.style.display !== 'block') {
      const legendUrl = layer.getLegendURL();
      if (legendUrl instanceof Promise) {
        legendUrl.then((url) => {
          if (url.indexOf(LEGEND_DEFAULT_IMG) === -1) {
            legend.querySelector('img').src = url;
          } else {
            errorLegendLayer(layer, useProxy, statusProxy).then((newLegend) => {
              if (newLegend !== '') {
                legend.querySelector('img').src = newLegend;
              } else {
                legend.querySelector('img').src = url;
              }
            });
          }
        });
      } else if (legendUrl.indexOf(LEGEND_DEFAULT_IMG) >= 0) {
        errorLegendLayer(layer, useProxy, statusProxy).then((newLegend) => {
          if (newLegend === 'error legend') {
            const img = legend.querySelector('img');
            const messageError = document.createElement('p');
            const icon = document.createElement('span');
            icon.classList.add('m-layerswitcher-icons-cancel');
            messageError.classList.add('m-layerswitcher-legend-error');
            messageError.appendChild(icon);
            const text = document.createTextNode(getValue(I18N_LEGEND_ERROR));
            messageError.appendChild(text);
            img.parentNode.insertBefore(messageError, img);
          } else if (newLegend !== '') {
            legend.querySelector('img').src = newLegend;
          } else {
            legend.querySelector('img').src = legendUrl;
          }
        });
      } else {
        legend.querySelector('img').src = legendUrl;
      }
      legend.style.display = 'block';
    } else {
      const img = legend.querySelector('img');
      const p = img.parentElement.querySelector('p');
      if (!M.utils.isNullOrEmpty(p)) {
        p.remove();
      }
      legend.style.display = 'none';
    }
  }
};

/* TARGET LAYER */
export const eventIconTarget = (layer, map, order, evt) => {
  if (evt.target.className.indexOf('m-layerswitcher-icons-target') > -1) {
    const mapView = map;
    const layerType = layer.type;
    if (layerType === 'WMS') {
      layer.getMaxExtent((me) => {
        mapView.setBbox(me);
      });
    } else if (layersTypesTarget.includes(layerType)) {
      const extent = layer.getMaxExtent();
      if (extent === null) {
        if (layer.calculateMaxExtent) {
          layer.calculateMaxExtent()
            .then((ext) => {
              if (ext.length > 0) {
                mapView.setBbox(ext);
              } else {
                mapView.setBbox(mapView.getExtent());
              }
            })
            .catch((err) => {
              // eslint-disable-next-line no-console
              console.error(err);
            });
        } else {
          mapView.setBbox(mapView.getExtent());
        }
      } else {
        mapView.setBbox(extent);
      }
    } else {
      M.dialog.info(getValue('exception.extent'), getValue('info'), order);
    }
  }
};

/* RADIO SELECT LAYER */
const hideLayers = (layer) => {
  const changeLayer = layer;
  changeLayer.checkedLayer = 'false';
  changeLayer.setVisible(false);
};

const showLayers = (layer) => {
  const changeLayer = layer;
  changeLayer.checkedLayer = 'true';
  changeLayer.setVisible(true);

  if (layer.type === 'LayerGroup' && layer.getLayers().length === 1) {
    showLayers(layer.getLayers()[0]);
  }
};

const showHideLayersInLayerGroup = (layer, map) => {
  const group = fiendLayerInGroup(layer, map);

  if (!document.querySelector(`[data-layer-id="${group.idLayer}"]`).checked) {
    document.querySelector(`[data-layer-id="${group.idLayer}"]`).click();
  }

  if (group) {
    group.getLayers().forEach((subLayer) => {
      if (subLayer.name === layer.name) {
        showLayers(subLayer);
      } else {
        hideLayers(subLayer);
      }
    });
  }
};

export const showHideLayersRadio = (layer, map, target) => {
  const selectLayer = target.getAttribute('data-select-type');
  if (target.className.indexOf('m-layerswitcher-check') > -1 && selectLayer === 'radio') {
    const idLayers = target.getAttribute('data-layer-id');

    const layers = map.getLayers()
      .filter((l) => l.displayInLayerSwitcher === true && l.isBase === false);
    const layerMap = layers.some((l) => l.idLayer === idLayers);

    if (layerMap) {
      layers.forEach((l) => {
        if (l.idLayer === idLayers) {
          showLayers(l);
        } else {
          hideLayers(l);
        }
      });
    } else {
      showHideLayersInLayerGroup(layer, map);
    }
  }
};

const getRadioLayersFilter = (layers) => {
  return layers.filter((l) => l.displayInLayerSwitcher === true
  && l.transparent === true
  && l.isVisible()) || [];
};

const clickRadioLayers = (layersVisible, radioButtons) => {
  if (layersVisible.length === 1) {
    radioButtons.forEach((radio) => {
      if (radio.getAttribute('data-layer-id') === layersVisible[0].idLayer) {
        radio.click();
      }
    });
  }

  if (layersVisible.length > 1) {
    const radio = [...radioButtons]
      .find((r) => r.getAttribute('data-layer-id') === layersVisible[layersVisible.length - 1].idLayer);
    if (radio) radio.click();
  }
};

export const selectDefaultRange = (radioButtons, map) => {
  const layersMapVisible = map.getLayers()
    .filter((l) => l.displayInLayerSwitcher === true
    && l.isVisible()
    && l.transparent === true);

  // Del mapa
  clickRadioLayers(layersMapVisible, radioButtons);

  // De los grupos
  const layerGroupVisible = getRadioLayersFilter(map.getLayerGroup());
  clickRadioLayers(layerGroupVisible, radioButtons);

  // De las capas de cada grupo
  layerGroupVisible.forEach((groups) => {
    clickRadioLayers(getRadioLayersFilter(groups.layers), radioButtons);
  });
};

// Cambia estilo a la capa
const changeLayerConfig = (layer, otherStyles) => {
  const styleSelected = document.querySelector('#m-layerswitcher-style-select').value;
  if (styleSelected !== '') {
    if (layer instanceof M.layer.Vector) {
      if (!M.utils.isNullOrEmpty(otherStyles)) {
        const filtered = otherStyles[styleSelected];
        layer.clearStyle();
        if (styleSelected === 0) {
          layer.setStyle();
        } else {
          layer.setStyle(filtered);
        }
      }
    } else {
      layer.getImpl().getOL3Layer().getSource().updateParams({ STYLES: styleSelected });
      const cm = layer.capabilitiesMetadata;
      if (!M.utils.isNullOrEmpty(cm) && !M.utils.isNullOrEmpty(cm.style)) {
        const filtered = layer.capabilitiesMetadata.style.filter((style) => {
          return style.Name === styleSelected;
        });

        if (filtered.length > 0 && filtered[0].LegendURL.length > 0) {
          const newURL = filtered[0].LegendURL[0].OnlineResource;
          layer.setLegendURL(newURL);
        }
      }
    }
    document.querySelector('div.m-mapea-container div.m-dialog').remove();
  }
};

export const styleLayers = (layer, order, evt) => {
  if (evt.target.className.indexOf('m-layerswitcher-icons-style') > -1) {
    let otherStyles = [];
    let isVectorLayer = false;
    if (!M.utils.isUndefined(layer.capabilitiesMetadata)
              && !M.utils.isUndefined(layer.capabilitiesMetadata.style)) {
      otherStyles = layer.capabilitiesMetadata.style;
    }

    if (layer instanceof M.layer.Vector) {
      otherStyles = layer.predefinedStyles;
      isVectorLayer = true;
    }

    const config = M.template.compileSync(configTemplate, {
      jsonp: true,
      parseToHtml: false,
      vars: {
        styles: otherStyles,
        isVectorLayer,
        translations: {
          select_style: getValue('select_style'),
          change: getValue('change'),
          style: getValue('style'),
          default_style: getValue('default_style'),
          selected: getValue('selected'),
        },
      },
    });

    M.dialog.info(config, getValue('configure_layer'), order);
    focusModal('.m-title span');
    setTimeout(() => {
      const selector = '#m-layerswitcher-style button';
      document.querySelector(selector).addEventListener('click', () => {
        changeLayerConfig(layer, otherStyles);
      });
      document.querySelector('div.m-mapea-container div.m-dialog div.m-title').style.backgroundColor = '#71a7d3';
      const button = document.querySelector('div.m-dialog.info div.m-button > button');
      button.innerHTML = getValue('close');
      button.style.width = '75px';
      button.style.backgroundColor = '#71a7d3';
      setTimeout(() => {
        document.querySelector('.m-layerswitcher-style-container').focus();
      }, 500);
    }, 10);
  }
};
