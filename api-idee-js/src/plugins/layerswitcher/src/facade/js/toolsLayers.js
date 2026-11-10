import changeNameTemplate from 'templates/changename';
import configTemplate from '../../templates/config';
import { fiendLayerInGroup } from './groupLayers';
import { getValue } from './i18n/language';
import { focusModal } from './utils';
import { parseSLD, SLDError } from './sld';

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
const SELECTOR_CHANGE_NAME = 'div.m-api-idee-container div.m-dialog #layer-change-name input';

// Contenedor de diálogo
const SELECTOR_DIALOG = 'div.m-api-idee-container div.m-dialog';

// Botón de cambio de nombre
const ID_SELECTOR_CHANGE_NAME_BUTTON = '#layer-change-name button';

// Botón de cerrar diálogo
const INFO_DIALOG = 'div.m-dialog.info';

/* EYE SELECT LAYER */
const CLASS_CHECK = 'm-layerswitcher-check';

/* LEGEND LAYER */
const I18N_LEGEND_ERROR = 'legend_error';

/* TARGET LAYER */
const layersTypesTarget = ['WMTS', 'WFS', 'MBTilesVector', 'MBTiles', 'OSM', 'XYZ', 'TMS', 'GeoJSON', 'GPX', 'KML', 'KMZ', 'OGCAPIFeatures', 'DataIDEE', 'Vector', 'GenericRaster', 'GenericVector', 'MVT', 'GeoTIFF', 'MapLibre'];

/* TILE OPTIONS */
const TILE_COORDS_REGEX = /\{z\}\/\{x\}\/\{(-?)y\}/;

// Teselas de OSM cuando la capa no indica URL (las de la fuente OSM por defecto)
const OSM_DEFAULT_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

/* CHANGE NAME */
const changeLayerLegend = (layer, target, onChange) => {
  const element = target;
  const newValue = document.querySelector(SELECTOR_CHANGE_NAME).value.trim();
  if (newValue.length > 0) {
    layer.setLegend(newValue);
    document.querySelector(SELECTOR_DIALOG).remove();
    element.lastChild.textContent = ` ${newValue} `;
    // El panel puede haberse repintado mientras el diálogo estaba abierto (el elemento ya
    // no estaría en el documento): se repinta con la leyenda nueva
    if (typeof onChange === 'function') onChange();
  }
};

export const showModalChangeName = (layer, target, order, onChange) => {
  if (target.className.indexOf('m-layerswitcher-title-box') > -1
  || target.className.indexOf('m-layerswitcher-layergroup-name') > -1) {
    const changeName = IDEE.template.compileSync(changeNameTemplate, {
      jsonp: true,
      parseToHtml: false,
      vars: {
        name: layer.legend || layer.name,
        translations: {
          change: getValue('change'),
        },
        order,
      },
    });

    IDEE.dialog.info(changeName, getValue('change_name'), order);

    document.querySelector(ID_SELECTOR_CHANGE_NAME_BUTTON).addEventListener('click', () => {
      changeLayerLegend(layer, target, onChange);
    });

    const button = IDEE.dialog.getCloseButton(INFO_DIALOG);
    button.innerHTML = getValue('close');
  }
};

/* EYE SELECT LAYER */
export const showHideLayersEye = (evt, layer, self) => {
  const selectLayer = evt.target.getAttribute('data-select-type');

  if (evt.target.className.indexOf('m-layerswitcher-check') > -1 && selectLayer === 'eye') {
    if (evt.target.classList.contains(CLASS_CHECK)) {
      if (layer instanceof IDEE.layer.Section) {
        const sectionLayers = layer.getAllLayers();
        let isVisible = false;
        if (sectionLayers.length > 0) {
          isVisible = sectionLayers.some((l) => l.isVisible() === true);
        }
        layer.setVisible(!isVisible);
        self.render();
      } else if (layer.isBase === false || !layer.isVisible()) {
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
      legend = layer.url.replace(TILE_COORDS_REGEX, '0/0/0');
    } else if (layer.type === 'OSM') {
      const url = layer.url || OSM_DEFAULT_URL;
      legend = url.replace(TILE_COORDS_REGEX, '0/0/0');
    }
    if (legend !== '') {
      // IDEE.proxy(useProxy);
      IDEE.remote.get(legend).then((response) => {
        if (response.code !== 200) {
          legend = '';
        }
        success(legend);
      });
      // IDEE.proxy(statusProxy);
    } else {
      success('error legend');
    }
  });
};

export const legendInfo = (evt, layer, useProxy, statusProxy) => {
  const LEGEND_DEFAULT_IMG = `${IDEE.config.STATIC_RESOURCES_URL}/imagenes/leyenda/legend-default.png`;
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
            if (!IDEE.utils.isNullOrEmpty(img)) {
              img.src = '';
            }
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
      if (!IDEE.utils.isNullOrEmpty(p)) {
        p.remove();
      }
      legend.style.display = 'none';
    }
  }
};

/* TARGET LAYER */
export const eventIconTarget = (layer, map, order, evt, impl) => {
  if (evt.target.className.indexOf('m-layerswitcher-icons-target') > -1) {
    // Capas que la implementación encuadra por su cuenta (p. ej. teselas 3D)
    if (impl && impl.zoomToLayer(map, layer)) return;
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
                mapView.setBbox(mapView.getMaxExtent());
              }
            })
            .catch((err) => {
              // eslint-disable-next-line no-console
              console.error(err);
            });
        } else {
          mapView.setBbox(mapView.getMaxExtent());
        }
      } else {
        mapView.setBbox(extent);
      }
    } else {
      IDEE.dialog.info(getValue('exception.extent'), getValue('info'), order);
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
  if (!group) {
    return;
  }

  const groupInput = document.querySelector(`[data-layer-id="${group.idLayer}"]`);
  if (groupInput && !groupInput.checked) {
    groupInput.click();
  }

  group.getLayers().forEach((subLayer) => {
    if (subLayer.idLayer === layer.idLayer) {
      showLayers(subLayer);
    } else {
      hideLayers(subLayer);
    }
  });
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
  && l.isBase === false
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
    && l.isBase === false);

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

const STYLE_SELECT = '#m-layerswitcher-style-select';
const STYLE_NOTICE = '#m-layerswitcher-style .m-layerswitcher-style-notice';

const unsupportedNotice = (properties) => getValue('style_unsupported').replace('[props]', properties);

const changeLayerStyle = (layer, layerStyles) => {
  const styleSelected = document.querySelector(STYLE_SELECT).value;
  if (styleSelected !== '') {
    layerStyles.select(layer, styleSelected);
    document.querySelector('div.m-api-idee-container div.m-dialog').remove();
  }
};

const updateStyleNotice = () => {
  const select = document.querySelector(STYLE_SELECT);
  const notice = document.querySelector(STYLE_NOTICE);
  if (!select || !notice) return;
  const properties = select.selectedOptions[0]?.dataset.unsupported || '';
  notice.textContent = properties === '' ? '' : unsupportedNotice(properties);
  notice.hidden = properties === '';
};

export const styleLayers = (layer, order, evt, layerStyles) => {
  if (evt.target.className.indexOf('m-layerswitcher-icons-style') > -1) {
    const activeId = layerStyles.getActiveId(layer);
    const options = layerStyles.getEntries(layer).map((entry) => ({
      value: entry.id,
      label: entry.label,
      selected: entry.id === activeId,
      unsupported: layerStyles.getUnsupported(layer, entry).join(', '),
    }));

    const config = IDEE.template.compileSync(configTemplate, {
      jsonp: true,
      parseToHtml: false,
      vars: {
        options,
        hasActive: options.some((option) => option.selected),
        translations: {
          select_style: getValue('select_style'),
          change: getValue('change'),
        },
      },
    });

    IDEE.dialog.info(config, getValue('configure_layer'), order);
    focusModal('.m-title span');
    setTimeout(() => {
      document.querySelector(STYLE_SELECT).addEventListener('change', updateStyleNotice);
      updateStyleNotice();
      const selector = '#m-layerswitcher-style button';
      document.querySelector(selector).addEventListener('click', () => {
        changeLayerStyle(layer, layerStyles);
      });
      const button = IDEE.dialog.getCloseButton(INFO_DIALOG);
      button.innerHTML = getValue('close');
      setTimeout(() => {
        document.querySelector('.m-layerswitcher-style-container').focus();
      }, 500);
    }, 10);
  }
};

const SLD_MAX_SIZE_MB = 5;

const fillMessage = (text, vars) => Object.keys(vars)
  .reduce((message, name) => message.split(`[${name}]`).join(vars[name]), text);

const describeIgnored = (ignored) => ignored
  .map(({ key, name }) => fillMessage(getValue(`sld_items.${key}`), { name }))
  .join('; ');

const showSLDError = (key, vars, order) => {
  IDEE.dialog.error(fillMessage(getValue(key), vars), getValue('load_sld'), order);
};

const applySLD = (layer, file, text, { order, layerStyles, onChange }) => {
  const vars = { file: file.name, layer: layer.legend || layer.name, reason: '' };
  let result;
  try {
    result = parseSLD(text, {
      layerNames: [layer.name, layer.legend],
      fileName: file.name.replace(/\.[^.]+$/, ''),
    });
  } catch (error) {
    if (error instanceof SLDError) {
      showSLDError(`exception.${error.code}`, vars, order);
    } else {
      showSLDError('exception.sld_apply', { ...vars, reason: error?.message || String(error) }, order);
    }
    return;
  }

  const selectIndex = Math.max(0, result.styles.findIndex((item) => item.isDefault));
  let entry;
  try {
    entry = layerStyles.addEntries(layer, result.styles.map(({ label, style }) => ({
      label: fillMessage(getValue('sld_entry'), { style: label }),
      style,
    })), selectIndex);
  } catch (error) {
    showSLDError('exception.sld_apply', { ...vars, reason: error?.message || String(error) }, order);
    return;
  }
  if (!entry) {
    showSLDError('exception.sld_layer', vars, order);
    return;
  }
  if (typeof onChange === 'function') onChange();

  const notices = [];
  if (result.fallbackLayer) {
    notices.push(fillMessage(getValue('sld_named_layer'), { ...vars, name: result.fallbackLayer }));
  }
  if (result.ignored.length > 0) {
    notices.push(fillMessage(getValue('sld_ignored'), { items: describeIgnored(result.ignored) }));
  }
  const unsupported = layerStyles.getUnsupported(layer, entry);
  if (unsupported.length > 0) {
    notices.push(unsupportedNotice(unsupported.join(', ')));
  }
  IDEE.toast.success(fillMessage(getValue('sld_applied'), { style: entry.label, layer: vars.layer }), order, 6000);
  if (notices.length > 0) {
    // eslint-disable-next-line no-console
    console.warn(notices.join('\n'));
    IDEE.toast.warning(notices.join(' '), order, 12000);
  }
};

export const loadSLDStyle = (layer, evt, { order, layerStyles, onChange }) => {
  if (evt.target.className.indexOf('m-layerswitcher-icons-sld') === -1) return;
  const vars = { file: '', layer: layer.legend || layer.name, size: SLD_MAX_SIZE_MB };
  if (!layerStyles.supportsClientStyles(layer)) {
    showSLDError('exception.sld_layer', vars, order);
    return;
  }
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.sld,.xml,application/xml,text/xml';
  input.className = 'm-layerswitcher-sld-input';
  input.hidden = true;
  input.addEventListener('cancel', () => input.remove());
  input.addEventListener('change', () => {
    const [file] = input.files;
    input.remove();
    if (!file) return;
    const fileVars = { ...vars, file: file.name };
    if (file.size > SLD_MAX_SIZE_MB * 1024 * 1024) {
      showSLDError('exception.sld_too_large', fileVars, order);
      return;
    }
    if (file.size === 0) {
      showSLDError('exception.sld_read', fileVars, order);
      return;
    }
    file.text()
      .then((text) => applySLD(layer, file, text, { order, layerStyles, onChange }))
      .catch(() => showSLDError('exception.sld_read', fileVars, order));
  });
  document.body.appendChild(input);
  input.click();
};
