/* eslint-disable no-underscore-dangle,no-param-reassign */
/**
 * @module M/control/LayerswitcherControl
 */

import LayerswitcherImplControl from 'impl/layerswitchercontrol';
import template from '../../templates/layerswitcher';
import templateAux from '../../templates/layerswitchercontent';
import { getValue } from './i18n/language';
import infoTemplate from '../../templates/information';
import infoTemplateOGC from '../../templates/informationogc';
import infoTemplateOthers from '../../templates/informationothers';
import layerGroupTemplate from '../../templates/layergroup';
import layerGroupChildTemplate from '../../templates/layergroupchild';
import addServicesTemplate from '../../templates/addservices';
import resultstemplate from '../../templates/addservicesresults';
import ogcModalTemplate from '../../templates/ogcmodal';
import layerModalTemplate from '../../templates/layermodal';
import customQueryFiltersTemplate from '../../templates/customqueryfilters';
import generateSortable from './sortable';
import {
  getAllLayersGroup, displayLayers, createSelectGroup, getLayerSelectGroup,
  filterGroups,
} from './groupLayers';
import {
  reorderLayers, removeLayersInLayerSwitcher, addAttributions, focusModal,
} from './utils';
import {
  TRANSLATIONS_OGCAPIFEATURES_WMS_WMTS, TRANSLATIONS_INFO_LAYER, showModalChangeName,
  showHideLayersEye, legendInfo, eventIconTarget, showHideLayersRadio, selectDefaultRange,
  styleLayers,
} from './toolsLayers';

const CATASTRO = '//ovc.catastro.meh.es/Cartografia/WMS/ServidorWMS.aspx';
const CODSI_CATALOG = 'https://www.idee.es/csw-inspire-idee/srv/spa/q?_content_type=json&bucket=s101&facet.q=type%2Fservice&fast=index&from=*1&keyword=WMS%20or%20Web%20Map%20Service%20or%20WMTS%20or%20Web%20Map%20Tile%20Service%20or%20TMS%20or%20MVT%20or%20Features%20WFS&resultType=details&sortBy=title&sortOrder=asc&to=*2';
const CODSI_PAGESIZE = 9;

// IDs HTML
// - CODSI
const LAYER_GROUP = '#m-layerswitcher-layerGroup';
const CODSI = '#m-layerswitcher-addservices-codsi';
const CODSI_BTN = '#m-layerswitcher-addservices-codsi-btn';
const CODSI_FILTER = '#m-layerswitcher-addservices-codsi-filter-btn';
const CODSI_SEARCH = '#m-layerswitcher-addservices-codsi-search-input';
const CODSI_CLEAN = '#m-layerswitcher-addservices-codsi-clean-btn';
const SEARCH_INPUT = '#m-layerswitcher-addservices-search-input';

const OGC_CONTAINER = '#m-layerswitcher-ogcCContainer';
const ADDSERVICES_RESULTS = '#m-layerswitcher-addservices-results';
const LAYERS_CONTAINER = '#m-layerswitcher-layerContainer';

// - Suggestions
const LIST_BTN = '#m-layerswitcher-addservices-list-btn';
const ADDSERVICES_SUGGESTIONS = '#m-layerswitcher-addservices-suggestions';

// - Search
const SEARCH_BTN = '#m-layerswitcher-addservices-search-btn';

// - Modal
const BT_CLOSE_MODAL = 'div.m-dialog.info div.m-button > button';

const SPINER_FATHER = '.m-layerswitcher-search-panel';

const SHOW_BUTTON = [1, 2, 3]; // Añadir más numeros para mostrar más botones

export default class LayerswitcherControl extends M.Control {
  constructor(options = {}) {
    if (M.utils.isUndefined(LayerswitcherImplControl)) {
      M.exception(getValue('exception.impl'));
    }

    const impl = new LayerswitcherImplControl();
    super(impl, 'Layerswitcher');

    // Fachada del control
    impl.facadeControl = this;

    // Paginacion
    this.pages_ = {
      total: 0,
      actual: 1,
      element: 0,
    };
    this.numPages_ = 5;

    // Mapa
    this.map_ = undefined;

    // Plantilla del control
    this.template_ = undefined;

    // Determina si el plugin es draggable o no
    this.isDraggable_ = options.isDraggable;

    // Determina el modo de selección de las capas
    this.modeSelectLayers = options.modeSelectLayers;

    // Determina si se ha seleccionado una capa mediante radio
    this.isCheckedLayerRadio = false;

    //  Listado de capas overlays
    this.overlayLayers = [];

    // Determina si se van a mostrar o si se van a ocultar todas las capas
    this.statusShowHideAllLayers = true;

    // Añadir control añadir capas
    this.isAddLayers = M.utils.isNullOrEmpty(options.addLayers) ? true : options.addLayers;

    // Añadir control mostrar/ocultar capas
    this.isStatusLayers = M.utils.isNullOrEmpty(options.statusLayers) ? true : options.statusLayers;

    // Herramientas para mostrar en las capas
    this.tools = options.tools;

    // Añadir control transparencia
    this.isTransparency = false;

    // Añadir control leyenda
    this.isLegend = false;

    // Añadir control zoom
    this.isZoom = false;

    // Añadir control informacion
    this.isInformation = false;

    // Añadir control de estilos
    this.isStyle = false;

    // Añadir control eliminar
    this.isDelete = false;

    // Permite saber si se permite movimiento de capas
    this.isMoveLayers = options.isMoveLayers;

    // Permite saber si el plugin está colapsado o no
    this.collapsed = options.collapsed;

    // Listado de capas precargadas/
    this.precharged = options.precharged;

    // Determina si permite o no servicios http
    this.http = options.http;

    // Determina si permite o no servicios https
    this.https = options.https;

    // Filtro
    this.filterName = undefined;

    // Determina si se han seleccionado todas las capas o no
    this.stateSelectAll = false;

    // active codsi
    this.codsiActive = options.showCatalog;

    // Determina si se desea usar proxy en las peticiones
    this.useProxy = options.useProxy;

    // Estado inicial del proxy
    this.statusProxy = options.statusProxy;

    this.select_codsi = 1; // Seleccionado por defecto

    // Mostrar tipo
    this.displayLabel = options.displayLabel;

    // order
    this.order = options.order;

    // Attribution
    this.useAttributions_ = options.useAttributions;
  }

  // Esta función crea la vista
  createView(map) {
    this.map_ = map;
    if (M.utils.isString(this.tools)) {
      this.tools = this.tools.split(',');
    }
    this.tools.forEach((tool) => {
      if (tool === 'transparency') {
        this.isTransparency = true;
      }
      if (tool === 'legend') {
        this.isLegend = true;
      }
      if (tool === 'zoom') {
        this.isZoom = true;
      }
      if (tool === 'information') {
        this.isInformation = true;
      }
      if (tool === 'style') {
        this.isStyle = true;
      }
      if (tool === 'delete') {
        this.isDelete = true;
      }
    });

    map.on(M.evt.ADDED_LAYER, (layers) => {
      if (this.modeSelectLayers === 'radio'
      && this.isCheckedLayerRadio === true) {
        layers.forEach((layer) => {
          if (layer.isBase === false && layer.displayInLayerSwitcher) {
            if (layer instanceof M.layer.LayerGroup) {
              this.recursiveVisibleHide_(layer, false);
            } else {
              layer.setVisible(false);
            }
          }
        });
      }
    });

    return new Promise((success) => {
      this.getTemplateVariables(map).then((templateVars) => {
        const html = M.template.compileSync(template, {
          vars: templateVars,
        });

        this.template_ = html;
        this.template_.addEventListener('click', this.clickLayer.bind(this), false);
        this.template_.addEventListener('input', this.inputLayer.bind(this), false);

        this.getImpl().registerEvent(map);
        this.template_.querySelector('#m-layerswitcher-addlayers').addEventListener('click', this.openAddServices.bind(this), false);
        this.template_.querySelector('#m-layerswitcher-addlayers').addEventListener('touchstart', this.openAddServices.bind(this), false);
        this.accessibilityTab(this.template_);

        success(this.template_);
      });
    });
  }

  recursiveVisibleHide_(layerGroup, visible) {
    layerGroup.getLayers().forEach((subLayer) => {
      if (subLayer instanceof M.layer.LayerGroup) {
        this.recursiveVisibleHide_(subLayer, visible);
      } else {
        subLayer.setVisible(visible);
      }
    });
  }

  addEventPanel(panel) {
    if (panel.getButtonPanel().parentElement.classList.contains('collapsed')) {
      setTimeout(() => {
        this.getImpl().removeRenderComplete();
      }, 501);
    }

    panel.getButtonPanel().addEventListener('click', this.collapsedPlugin.bind(this), false);

    if (this.isDraggable_) {
      M.utils.draggabillyPlugin(panel, '#m-layerswitcher-title');
    }
  }

  // Esta función devuelve las variables para la plantilla
  getTemplateVariables(map) {
    return new Promise((success, fail) => {
      if (!M.utils.isNullOrEmpty(map)) {
        this.overlayLayers = map.getLayers().filter((layer) => {
          const isTransparent = (layer.transparent === true);
          const displayInLayerSwitcher = (layer.displayInLayerSwitcher === true);
          const isLayerGroup = (layer instanceof M.layer.LayerGroup);
          return isTransparent && displayInLayerSwitcher && !isLayerGroup;
        });

        const overlayLayersPromise = Promise
          .all(this.overlayLayers.map(this.parseLayerForTemplate_.bind(this)));
        overlayLayersPromise.then((parsedOverlayLayers) => {
          success({
            someLayerGroup: map.getLayerGroup().length > 0,
            overlayLayers: parsedOverlayLayers,
            ...this.getTemplateVariablesValues(),
          });
        });
      }
    });
  }

  getTemplateVariablesValues() {
    return {
      translations: {
        layers: getValue('layers'),
        show_hide: getValue('show_hide'),
        hide_service: getValue('hide_service'),
        show_service: getValue('show_service'),
        changeName: getValue('change_name'),
        show_all_services: getValue('show_all_services'),
        hide_all_services: getValue('hide_all_services'),
        zoom: getValue('zoom'),
        info_metadata: getValue('info_metadata'),
        remove_layer: getValue('remove_layer'),
        change_style: getValue('change_style'),
        add: getValue('add'),
      },
      allVisible: !this.statusShowHideAllLayers,
      isRadio: this.modeSelectLayers === 'radio',
      isEyes: this.modeSelectLayers === 'eyes',
      isTransparency: this.isTransparency,
      isLegend: this.isLegend,
      isZoom: this.isZoom,
      isInformation: this.isInformation,
      isStyle: this.isStyle,
      isDelete: this.isDelete,
      displayLabel: !this.displayLabel,
      isAddLayers: !this.isAddLayers,
      isStatusLayers: !this.isStatusLayers,
    };
  }

  // Esta función monta objeto con propiedades de la capa para la plantilla
  parseLayerForTemplate_(layer) {
    const layerTitle = layer.legend || layer.name;
    const hasMetadata = !M.utils.isNullOrEmpty(layer.capabilitiesMetadata)
      && !M.utils.isNullOrEmpty(layer.capabilitiesMetadata.abstract);

    return new Promise((success) => {
      let hasStyles = (hasMetadata && layer.capabilitiesMetadata.style.length > 1)
        || (layer instanceof M.layer.Vector && !M.utils.isNullOrEmpty(layer.predefinedStyles)
          && layer.predefinedStyles.length > 1);
      if (layer.type === 'KML') {
        if (layer.options === null) {
          hasStyles = false;
        } else if (layer.options.extractStyles
          || M.utils.isUndefined(layer.options.extractStyles)) {
          hasStyles = false;
        }
      }
      const layerVarTemplate = {
        title: layerTitle,
        type: layer.type,
        dataOrder: layer.getZIndex(),
        visible: (layer.isVisible() === true),
        idLayer: layer.idLayer,
        id: layer.name,
        url: layer.url,
        outOfRange: !layer.inRange(),
        checkedLayer: layer.checkedLayer || 'false',
        opacity: layer.getOpacity(),
        metadata: hasMetadata,
        hasStyles,
      };
      success(layerVarTemplate);
    });
  }

  async generateTemplateLayerGroup() {
    const layersFilter = filterGroups(this.map_.getLayers());

    if (layersFilter.length === 0) {
      return;
    }

    // eslint-disable-next-line no-restricted-syntax
    for (const layer of layersFilter) {
      if (layer instanceof M.layer.LayerGroup) {
        // eslint-disable-next-line no-await-in-loop
        const layerGroupHTML = await this.recursiveLayerGroupTemplate_(layer);

        [...layerGroupHTML.querySelectorAll('.m-layerswitcher-ullayersGroup')].forEach((group) => {
          this.orderLayers(group);
        });

        this.template_.querySelector('.m-layerswitcher-ullayers').appendChild(layerGroupHTML);
      }
    }
  }

  recursiveLayerGroupTemplate_(layer) {
    return new Promise((resolve, reject) => {
      this.parseLayerForTemplate_(layer)
        .then((varsGroup) => {
          const html = M.template.compileSync(layerGroupTemplate, {
            vars: {
              changeName: getValue('change_name'),
              displayGroup: layer.display === undefined ? true : layer.display,
              show_group: getValue('show_group'),
              hide_group: getValue('hide_group'),
              nameRadio: layer.getImpl().rootGroup === null ? 'm-layerswitcher-radioLayers' : layer.getImpl().rootGroup.name,
              ...varsGroup,
              ...this.getTemplateVariablesValues(),
            },
          });

          const layerPromises = reorderLayers(filterGroups(layer.getLayers(), false))
            .map((sublayer) => {
              if (sublayer instanceof M.layer.LayerGroup) {
                return this.recursiveLayerGroupTemplate_(sublayer).then((subLayerGroupHTML) => {
                  html.querySelector('.m-layerswitcher-ullayersGroup').appendChild(subLayerGroupHTML);
                });
              }
              return this.parseLayerForTemplate_(sublayer).then((varsSubLayer) => {
                const li = M.template.compileSync(layerGroupChildTemplate, {
                  vars: {
                    nameRadio: layer.name,
                    ...varsSubLayer,
                    ...this.getTemplateVariablesValues(),
                  },
                });

                html.querySelector('.m-layerswitcher-ullayersGroup').appendChild(li);
              });
            });

          Promise.all(layerPromises)
            .then(() => resolve(html))
            .catch(reject);
        })
        .catch(reject);
    });
  }

  // Esta función renderiza la plantilla
  async render() {
    const listLayer = document.getElementById('m-layerswitcher-content').childElementCount;

    if (listLayer === 0) {
      this.statusShowHideAllLayers = this.map_.getLayers().find((layer) => {
        if (layer.isBase === false && layer.displayInLayerSwitcher) {
          // RANGE ¿?
          // return layer.isVisible();
          return true;
        }
        return false;
      });
    }

    // ? NO SE MUESTRA NINGUNA CAPA
    if (this.statusShowHideAllLayers === undefined) {
      return;
    }

    const templateVars = await this.getTemplateVariables(this.map_);
    let scroll;
    if (document.querySelector('.m-plugin-layerswitcher.opened ul.m-layerswitcher-ullayers') !== null) {
      scroll = document.querySelector('.m-plugin-layerswitcher.opened ul.m-layerswitcher-ullayers').scrollTop;
    }

    const html = M.template.compileSync(templateAux, {
      vars: templateVars,
    });

    this.template_.querySelector('#m-layerswitcher-content').innerHTML = html.innerHTML;

    await this.generateTemplateLayerGroup();

    const ulContainer = this.template_.querySelector('.m-layerswitcher-ullayers');
    this.orderLayers(ulContainer);

    const layerList = this.template_.querySelector('.m-layerswitcher-ullayers');

    if (layerList !== null && this.isMoveLayers) { // ??¿?¿ isMoveLayers
      generateSortable(this.map_, this.overlayLayers);
    }
    if (scroll !== undefined) {
      const aux = document.querySelector('.m-plugin-layerswitcher.opened ul.m-layerswitcher-ullayers');
      if (aux !== null) {
        aux.scrollTop = scroll;
      }
    }

    // si el modo de selección es radio y no se ha seleccionado ninguna capa se marca la primera
    this.defaultRangeSelect_();
  }

  defaultRangeSelect_() {
    if (this.modeSelectLayers === 'radio' && this.isCheckedLayerRadio === false) {
      const radioButtons = this.template_.querySelectorAll('input[type=radio]');
      if (radioButtons.length > 0) {
        this.isCheckedLayerRadio = true;

        selectDefaultRange(radioButtons, this.map_);
      }
    }
  }

  orderLayers(ulContainer) {
    const items = [...ulContainer.children];

    items.sort((a, b) => b.dataset.order - a.dataset.order);

    ulContainer.innerHTML = '';

    items.forEach((item) => ulContainer.appendChild(item));
  }

  // Controla el registro de evento rendercomplete si está abierto o cerrado el plugin
  collapsedPlugin(e) {
    if (!e.target.parentElement.classList.contains('collapsed')) {
      this.render();
      this.getImpl().registerEvent(this.map_);
    } else {
      this.getImpl().removeRenderComplete();
    }
  }

  // Esta función detecta cuando se hace click en la plantilla y efectúa la acción correspondiente
  clickLayer(evtParameter) {
    const evt = (evtParameter || window.event);

    if (evt.target.id === 'm-layerswitcher-hsalllayers') {
      this.showHideAllLayers();
    } else {
      const layer = this.findLayer(evt)[0];

      if (layer) {
        // ? Cambiar nombre de la capa
        showModalChangeName(layer, evt.target, this.order);
        // ? Mostrar/Ocultar capa (modo eye)
        showHideLayersEye(evt, layer, this);
        // ? Mostrar/Ocultar capa (modo radio)
        showHideLayersRadio(layer, this.map_, evt.target);
        // ? Leyenda de la capa
        legendInfo(evt, layer, this.useProxy, this.statusProxy);
        // ? Zoom a la capa
        eventIconTarget(layer, this.map_, this.order, evt);
        // ? Cambiar estilo de la capa
        styleLayers(layer, this.order, evt);

        // ? Información de la capa
        if (evt.target.className.indexOf('m-layerswitcher-icons-info') > -1) {
          if (layer.type === 'OGCAPIFeatures') {
            const metadataURL = `${layer.url}${layer.name}?f=json`;
            const htmlURL = `${layer.url}${layer.name}?f=html`;
            let jsonResponseOgc;
            M.proxy(this.useProxy);
            M.remote.get(metadataURL).then((response) => {
              jsonResponseOgc = JSON.parse(response.text);
              const vars = {
                title: jsonResponseOgc.title,
                abstract: jsonResponseOgc.description,
                hasMetadata: true,
                metadata: htmlURL,
                isOgc: true,
                translations: TRANSLATIONS_OGCAPIFEATURES_WMS_WMTS,
              };
              const nFeatures = layer.getFeatures().length;
              if (nFeatures > 0) {
                this.pages_ = {
                  total: 0,
                  actual: 1,
                  element: 0,
                };
                const attributes = [];
                const features = layer.getFeatures();
                const headerAtt = Object.keys(features[0].getAttributes());
                features.forEach((feature) => {
                  const properties = Object.values(feature.getAttributes());
                  if (!M.utils.isNullOrEmpty(properties)) {
                    attributes.push({
                      properties,
                    });
                  }
                });
                if (!M.utils.isUndefined(headerAtt)) {
                  vars.pages = this.pageResults_(attributes);
                  vars.allAttributes = attributes;
                  vars.attributes = (M.utils.isNullOrEmpty(attributes)) ? false : attributes
                    .slice(this.pages_.element, this.pages_.element + this.numPages_);
                } else {
                  vars.attributes = attributes;
                }
                vars.headerAtt = headerAtt;
              }
              this.renderInfo(vars, 'OGCAPIFeatures');
              this.latestVars_ = vars;
              if (layer instanceof M.layer.Vector) {
                if (document.querySelector('#m-layerswitcher-next')) {
                  const next = document.querySelector('#m-layerswitcher-next');
                  next.addEventListener('click', this.nextPage_.bind(this));
                  next.addEventListener('keyup', (event) => {
                    event.preventDefault();
                    if (event.keyCode === 13) {
                      next.click();
                    }
                  });

                  const previous = document.querySelector('#m-layerswitcher-previous');
                  previous.addEventListener('click', this.previousPage_.bind(this));
                  previous.addEventListener('keyup', (event) => {
                    event.preventDefault();
                    if (event.keyCode === 13) {
                      previous.click();
                    }
                  });
                  this.hasNext_();
                  this.hasPrevious_();
                }
              }
            });
            M.proxy(this.statusProxy);
          } else if (layer.type === 'WMS' || layer.type === 'WMTS') {
            const vars = {
              name: layer.name, // nombre
              title: layer.legend, // titulo
              abstract: layer.capabilitiesMetadata.abstract, // resumen
              translations: TRANSLATIONS_OGCAPIFEATURES_WMS_WMTS,
            };

            vars.capabilities = this.addCapabilitiesInformation(layer);
            if (layer.capabilitiesMetadata.metadataURL) {
              vars.metadata = layer.capabilitiesMetadata.metadataURL[0].OnlineResource;
            }
            vars.provider = this.informationProvider(layer);
            M.proxy(this.useProxy);
            M.remote.get(vars.capabilities).then((response) => {
              const source = response.text;
              const urlService = source.split('<inspire_common:URL>')[1].split('<')[0].split('&amp;').join('&');
              if (!M.utils.isNullOrEmpty(urlService) && M.utils.isUrl(urlService)) {
                vars.metadata_service = urlService;
                vars.hasMetadata = true;
              }

              if (M.utils.isNullOrEmpty(vars.metadata) || !M.utils.isUrl(vars.metadata)) {
                if (vars.metadata_service !== undefined) {
                  this.infoDownloadCenter(vars.metadata_service, vars);
                } else {
                  this.renderInfo(vars);
                }
              } else {
                vars.hasMetadata = true;
                this.infoDownloadCenter(vars.metadata, vars);
              }
            }).catch((err) => {
              this.renderInfo(vars);
            });
            M.proxy(this.statusProxy);
          } else {
            let rendInfo = true;
            const vars = {
              name: layer.name, // nombre
              title: layer.legend, // titulo
              translations: TRANSLATIONS_INFO_LAYER,
            };
            if (layer instanceof M.layer.Vector) {
              const nFeatures = layer.getFeatures().length;
              vars.numberFeatures = nFeatures;
              const ext = layer.getMaxExtent();
              vars.extension = M.utils.isNullOrEmpty(ext) ? ext : ext.toString().replaceAll(',', ', ');
              if (nFeatures > 0) {
                this.pages_ = {
                  total: 0,
                  actual: 1,
                  element: 0,
                };
                const attributes = [];
                const features = layer.getFeatures();
                const headerAtt = Object.keys(features[0].getAttributes());
                features.forEach((feature) => {
                  const properties = Object.values(feature.getAttributes());
                  if (!M.utils.isNullOrEmpty(properties)) {
                    attributes.push({
                      properties,
                    });
                  }
                });
                if (!M.utils.isUndefined(headerAtt)) {
                  vars.pages = this.pageResults_(attributes);
                  vars.allAttributes = attributes;
                  vars.attributes = (M.utils.isNullOrEmpty(attributes)) ? false : attributes
                    .slice(this.pages_.element, this.pages_.element + this.numPages_);
                } else {
                  vars.attributes = attributes;
                }
                vars.headerAtt = headerAtt;
              }
            }

            const type = layer.type;
            if (type === 'MVT' || type === 'TMS' || type === 'XYZ') {
              rendInfo = false;
              let url = layer.url;
              const regex = /\{z\}\/\{x\}\/\{(-?)y\}\/?.*$/;
              url = url.replace(regex, 'metadata.json');
              const ext = layer.getMaxExtent();
              vars.extension = M.utils.isNullOrEmpty(ext) ? ext : ext.toString().replaceAll(',', ', ');
              M.proxy(this.useProxy);
              M.remote.get(url).then((response) => {
                if (response.code === 200) {
                  const res = JSON.parse(response.text);
                  const others = {};
                  if (res.id) {
                    others.id = res.id;
                  }
                  if (res.attribution) {
                    others.attribution = res.attribution;
                  }
                  if (res.description) {
                    others.description = res.description;
                  }
                  if (res.minzoom !== undefined) {
                    others.minzoom = res.minzoom.toString();
                  }
                  if (res.maxzoom !== undefined) {
                    others.maxzoom = res.maxzoom.toString();
                  }
                  if (res.center) {
                    others.center = res.center.toString().replaceAll(',', ', ');
                  }
                  if (Object.keys(others).length > 0) {
                    vars.others = others;
                  }
                }
                this.renderInfo(vars, 'Others');
              });
              M.proxy(this.statusProxy);
            } else if (type === 'OSM' || type === 'MBTiles') {
              const ext = layer.getMaxExtent();
              vars.extension = M.utils.isNullOrEmpty(ext) ? ext : ext.toString().replaceAll(',', ', ');
            }
            if (rendInfo) {
              this.renderInfo(vars, 'Others');
              this.latestVars_ = vars;
            }
            if (layer instanceof M.layer.Vector) {
              // Esperar que se muestre el modal
              const loadFeatures = () => {
                setTimeout(() => {
                  const loaded = document.querySelector('#m-layerswitcher-next');
                  if (loaded) {
                    if (document.querySelector('#m-layerswitcher-next')) {
                      this.latestVars_ = vars;
                      document.querySelector('#m-layerswitcher-next').addEventListener('click', this.nextPage_.bind(this));
                      document.querySelector('#m-layerswitcher-previous').addEventListener('click', this.previousPage_.bind(this));
                      this.hasNext_();
                      this.hasPrevious_();
                    }
                  } else {
                    loadFeatures();
                  }
                }, 1000);
              };
              loadFeatures();
            }
          }
        }

        // ? Eliminar capa
        removeLayersInLayerSwitcher(evt, layer, this.map_);
        // ? Colapsar/Expandir grupo de capas
        displayLayers(evt, layer, this.map_);
      }
    }

    evt.stopPropagation();
  }

  /**
   * This function returns the number of pages based on the number of attributes indicated
   *
   * @private
   * @function
   * @param {array<string>} attributes - attributes to page
   * @retrun {number} Returns the number of pages
   */
  pageResults_(attributes) {
    this.pages_.total = Math.ceil(attributes.length / this.numPages_);
    return this.pages_;
  }

  /**
   * This function sets a next page if possible
   *
   * @private
   * @function
   */
  nextPage_() {
    if (this.pages_.total > this.pages_.actual) {
      this.pages_.actual += 1;
      this.pages_.element += this.numPages_;

      this.updateTablePage_();
    }
  }

  /**
   * This function sets a previous page if possible
   *
   * @private
   * @function
   */
  previousPage_() {
    if (this.pages_.actual > 1) {
      this.pages_.actual -= 1;
      this.pages_.element -= this.numPages_;

      this.updateTablePage_();
    }
  }

  /**
   * This function updates the current page on the table
   *
   * @private
   * @function
   */
  updateTablePage_() {
    const tableBody = document.querySelector('#m-layerswitcher-table tbody');
    tableBody.innerHTML = '';

    this.latestVars_.attributes = (M.utils.isNullOrEmpty(this.latestVars_.allAttributes))
      ? false
      // eslint-disable-next-line max-len
      : this.latestVars_.allAttributes.slice(this.pages_.element, this.pages_.element + this.numPages_);

    if (this.latestVars_.attributes) {
      this.latestVars_.attributes.forEach((att) => {
        const tableRow = document.createElement('tr');
        att.properties.forEach((proper) => {
          const tableElement = document.createElement('td');
          tableElement.innerHTML = proper;
          tableRow.appendChild(tableElement);
        });
        tableBody.appendChild(tableRow);
      });
    }

    document.querySelector('#m-layerswitcher-pageinfo').innerText = `Página ${this.pages_.actual} de ${this.pages_.total}`;

    this.hasNext_();
    this.hasPrevious_();
  }

  /**
   * This function adds / deletes classes if you have next results
   *
   * @private
   * @function
   */
  hasNext_(html) {
    let element;
    if (!M.utils.isNullOrEmpty(html)) element = html;
    if (M.utils.isNullOrEmpty(element)) element = document;
    if (this.pages_.actual < this.pages_.total) {
      element.querySelector('#m-layerswitcher-next').classList.remove('m-layerswitcher-hidden');
    } else {
      element.querySelector('#m-layerswitcher-next').classList.add('m-layerswitcher-hidden');
    }
  }

  /**
   * This function adds / deletes classes if you have previous results
   *
   * @private
   * @function
   */
  hasPrevious_(html) {
    let element;
    if (!M.utils.isNullOrEmpty(html)) element = html;
    if (M.utils.isNullOrEmpty(element)) element = document;
    if (this.pages_.actual <= this.pages_.total && this.pages_.actual !== 1) {
      element.querySelector('#m-layerswitcher-previous').classList.remove('m-layerswitcher-hidden');
    } else {
      element.querySelector('#m-layerswitcher-previous').classList.add('m-layerswitcher-hidden');
    }
  }

  // Esta función gestiona el control de la opacidad de las capas
  inputLayer(evtParameter) {
    if (evtParameter.target.type === 'radio') {
      return;
    }

    clearTimeout(this.inputLayerTimeID);
    this.getImpl().removeRenderComplete();

    const evt = (evtParameter || window.event);
    if (!M.utils.isNullOrEmpty(evt.target)) {
      const layer = this.findLayer(evt);
      if (layer.length > 0) {
        evt.stopPropagation();
        layer[0].setOpacity(evt.target.value);
      }
    }

    this.inputLayerTimeID = setTimeout(() => {
      this.getImpl().registerEvent(this.map_);
    }, 500);
  }

  //  Función para buscar la capa por nombre, url y tipo
  findLayer(evt) {
    const idLayers = evt.target.getAttribute('data-layer-id');

    let result = [];
    if (!M.utils.isNullOrEmpty(idLayers)) {
      const allLayers = getAllLayersGroup(this.map_).concat(this.overlayLayers);
      result = allLayers.filter((l) => l.idLayer === idLayers);
    }

    return result;
  }

  // Muestra la información de la capa
  renderInfo(v, type) {
    let info;
    const vars = v;
    vars.translations.previous = getValue('previous');
    vars.translations.next = getValue('next');
    if (type === 'OGCAPIFeatures') {
      info = M.template.compileSync(infoTemplateOGC, {
        jsonp: false,
        parseToHtml: false,
        vars,
      });
      focusModal('.m-layerswitcher-info-cap p');
    } else if (type === 'Others') {
      info = M.template.compileSync(infoTemplateOthers, {
        jsonp: false,
        parseToHtml: false,
        vars,
      });
      focusModal('.m-layerswitcher-info-cap p');
    } else {
      info = M.template.compileSync(infoTemplate, {
        jsonp: false,
        parseToHtml: false,
        vars,
      });
      focusModal('.m-layerswitcher-info-cap p');
    }

    M.dialog.info(info, getValue('layer_info'), this.order);
    setTimeout(() => {
      document.querySelector('div.m-mapea-container div.m-dialog div.m-title').style.backgroundColor = '#71a7d3';
      const button = document.querySelector('div.m-dialog.info div.m-button > button');
      button.innerHTML = getValue('close');
      button.style.width = '75px';
      button.style.backgroundColor = '#71a7d3';
    }, 10);
  }

  // Obtiene la información de la capa del GetCapabilities
  addCapabilitiesInformation(layer) {
    if (layer.type === 'WMS') {
      return M.utils.getWMSGetCapabilitiesUrl(layer.url, layer.version);
    }

    if (layer.type === 'WMTS') {
      return M.utils.getWMTSGetCapabilitiesUrl(layer.url);
    }
    return false;
  }

  // Obtiene información del provider
  informationProvider(layer) {
    if (M.utils.isNullOrEmpty(layer.capabilitiesMetadata.attribution)) {
      return false;
    }
    let provider = '';

    if (layer.type === 'WMS') {
      provider = `${layer.capabilitiesMetadata.attribution.Title}`;
      if (layer.capabilitiesMetadata.attribution.OnlineResource !== undefined) {
        provider += `<p><a class="m-layerswitcher-provider-link" href="${layer.capabilitiesMetadata.attribution.OnlineResource}" target="_blank">${layer.capabilitiesMetadata.attribution.OnlineResource}</a></p>`;
      }
    }
    if (layer.type === 'WMTS') {
      provider = `${layer.capabilitiesMetadata.attribution.ProviderName}`
        + `<p><a class="m-layerswitcher-provider-link" href="${layer.capabilitiesMetadata.attribution.ProviderSite}" target="_blank">${layer.capabilitiesMetadata.attribution.ProviderSite}</a></p>`;
      const sc = layer.capabilitiesMetadata.attribution.ServiceContact;
      if (!M.utils.isNullOrEmpty(sc) && !M.utils.isNullOrEmpty(sc.ContactInfo)) {
        const mail = sc.ContactInfo.Address.ElectronicMailAddress;
        provider += `<p><a class="m-layerswitcher-provider-link" href="mailto:${mail}">${mail}</a></p>`;
      }
    }

    return provider;
  }

  // Centro de descarga
  infoDownloadCenter(url, vars) {
    M.proxy(this.useProxy);
    M.remote.get(url).then((response) => {
      const metadataText = response.text;
      const unfiltered = metadataText.split('<gmd:MD_DigitalTransferOptions>')[1].split('<gmd:URL>').filter((elem) => {
        return elem.indexOf('centrodedescargas') > -1 && elem.indexOf('atom') === -1;
      });

      if (unfiltered.length > 0) {
        const downloadCenter = unfiltered[0].split('</gmd:URL>')[0].trim();
        vars.downloadCenter = downloadCenter;
      }

      this.renderInfo(vars);
    }).catch((err) => {
      this.renderInfo(vars);
    });
    M.proxy(this.statusProxy);
  }

  // Esta función muestra/oculta todas las capas
  showHideAllLayers() {
    this.statusShowHideAllLayers = !this.statusShowHideAllLayers;
    const allLayers = getAllLayersGroup(this.map_).concat(this.overlayLayers);
    allLayers.forEach((layer) => {
      layer.setVisible(this.statusShowHideAllLayers);
    });
  }

  // Muestra cargando
  showLoading() {
    // Crear un nuevo elemento
    const newElement = document.createElement('p');
    newElement.id = 'm-layerswitcher-loading';
    newElement.innerHTML = '<span class="m-layerswitcher-icons-spinner"></span>';

    // Obtener el elemento padre
    const parentElement = document.querySelector(SPINER_FATHER);

    // Agregar el nuevo elemento al padre
    parentElement.appendChild(newElement);

    document.querySelector(SEARCH_BTN).style.display = 'none';

    if (document.querySelector(CODSI_BTN)) {
      document.querySelector(CODSI_BTN).style.display = 'none';
    }

    if (document.querySelector(LAYER_GROUP)) {
      document.querySelector(LAYER_GROUP).style.display = 'none';
    }

    if (document.getElementById('m-layerswitcher-addservices-file-input')) {
      document.getElementById('labelFileInput').style.display = 'none';
    }

    document.querySelector(LIST_BTN).style.display = 'none';

    this.loadingActive = true;
  }

  // Elimina cargando
  removeLoading() {
    if (document.querySelector('#m-layerswitcher-loading') && document.querySelector(SEARCH_BTN)) {
      document.querySelector('#m-layerswitcher-loading').remove();
      document.querySelector(SEARCH_BTN).style.display = 'inline';

      if (document.querySelector(CODSI_BTN)) {
        document.querySelector(CODSI_BTN).style.display = 'inline';
      }

      if (document.querySelector(LAYER_GROUP)) {
        document.querySelector(LAYER_GROUP).style.display = ' inline-block';
      }

      if (document.getElementById('m-layerswitcher-addservices-file-input')) {
        document.getElementById('labelFileInput').style.display = 'inline';
      }

      document.querySelector(LIST_BTN).style.display = 'inline';

      this.loadingActive = false;
    }
  }

  // Esta función lee las capas de un servicio
  readCapabilities(evt) {
    // Elements
    const addSuggestions = document.querySelector(ADDSERVICES_SUGGESTIONS);
    const searchInput = document.querySelector(SEARCH_INPUT);

    evt.preventDefault();
    let HTTPeval = false;
    let HTTPSeval = false;
    addSuggestions.style.display = 'none';
    const url = searchInput.value.trim().split('?')[0];
    this.removeContains(evt);
    if (!M.utils.isNullOrEmpty(url)) {
      if (M.utils.isUrl(url)) {
        if (this.http && !this.https) {
          const expReg = /^(http:)/;
          HTTPeval = expReg.test(url);
        } else if (this.https && !this.http) {
          const expReg = /^(https:)/;
          HTTPSeval = expReg.test(url);
        } else if (this.http && this.https) {
          HTTPeval = true;
          HTTPSeval = true;
        }

        if (HTTPeval === true || HTTPSeval === true) {
          this.showLoading();
          // MVT
          const pbf = url.indexOf('.pbf') >= 0;
          const json = url.indexOf('.json') >= 0;
          if (pbf || json) {
            let metadata = url;
            let orderxyz = '{z}/{x}/{y}.pbf';
            if (pbf) {
              if (url.indexOf('{z}/{x}/{y}') === -1) {
                orderxyz = '{z}/{y}/{x}.pbf';
              }
              metadata = url.replace(orderxyz, 'metadata.json');
            }

            if (url.indexOf('{z}/{x}/{-y}') >= 0) {
              this.printLayerModal(url, 'tms');
            } else if (url.indexOf('{z}/{x}/{y}' && !url.indexOf('.pbf')) >= 0) {
              this.printLayerModal(url, 'xyz');
            } else {
              M.proxy(this.useProxy);
              M.remote.get(metadata).then((meta) => {
                if (json && meta.text.indexOf('sources') !== -1 && meta.text.indexOf('version') !== -1 && meta.text.indexOf('layers') !== -1) {
                  this.printLayerModal(url, 'maplibre');
                } else if (json && meta.text.replaceAll('\r\n', '').replaceAll(' ', '').indexOf('"type":"FeatureCollection"') >= 0) {
                  this.printLayerModal(url, 'geojson');
                } else {
                  let parse = JSON.parse(meta.text);
                  let url2;
                  if (!M.utils.isNullOrEmpty(parse)) {
                    if (!M.utils.isNullOrEmpty(parse.json)) {
                      parse = JSON.parse(parse.json);
                    }
                    url2 = metadata.substring(0, metadata.lastIndexOf('/') + 1).concat(orderxyz);
                  } else {
                    parse = {};
                  }
                  let layers = parse.vector_layers || [];
                  let urlLayer = parse.tileurl || parse.tiles || url2 || url;
                  if (M.utils.isString(urlLayer)) {
                    urlLayer = [urlLayer];
                  }
                  layers = layers.map((layer) => {
                    return { name: layer.id };
                  });

                  if (urlLayer[0].indexOf('{z}/{x}/{-y}') >= 0) {
                    this.printLayerModal(urlLayer[0], 'tms');
                  } else if (urlLayer[0].indexOf('{z}/{x}/{y}') >= 0 && urlLayer[0].indexOf('.pbf') === -1) {
                    this.printLayerModal(urlLayer[0], 'xyz');
                  } else {
                    this.printLayerModal(urlLayer[0], 'mvt', layers);
                  }
                }
              });
              M.proxy(this.statusProxy);
            }

            // GeoTIFF
          } else if (url.indexOf('.tif') >= 0) {
            this.printLayerModal(url, 'geotiff');
            // TMS
          } else if (url.indexOf('{z}/{x}/{-y}') >= 0) {
            this.printLayerModal(url, 'tms');
            // OSM
          } else if (url.indexOf('{z}/{x}/{y}') >= 0 && url.indexOf('openstreetmap') >= 0) {
            this.printLayerModal(url, 'osm');
            // XYZ
          } else if (url.indexOf('{z}/{x}/{y}') >= 0) {
            this.printLayerModal(url, 'xyz');
          } else {
            const promise = new Promise((success, reject) => {
              const id = setTimeout(() => reject(), 15000);
              M.proxy(this.useProxy);
              M.remote.get(M.utils.getWMTSGetCapabilitiesUrl(url)).then((response) => {
                clearTimeout(id);
                success(response);
              });
              M.proxy(this.statusProxy);
            });

            promise.then((response) => {
              if (response.text && !M.utils.isNullOrEmpty(response.text) && response.text.indexOf('<TileMatrixSetLink>') >= 0 && response.text.indexOf('Operation name="GetTile"') >= 0) {
                const getCapabilitiesParser = new M.impl.format.WMTSCapabilities();
                const getCapabilities = getCapabilitiesParser.read(response.xml);
                this.serviceCapabilities = getCapabilities.capabilities || {};
                const layers = M.impl.util.wmtscapabilities.getLayers(
                  getCapabilities.capabilities,
                  url,
                  this.map_.getProjection().code,
                );
                this.capabilities = this.filterResults(layers);
                this.showResults();
              } else {
                const promise2 = new Promise((success, reject) => {
                  const id = setTimeout(() => reject(), 15000);
                  M.proxy(this.useProxy);
                  M.remote.get(M.utils.getWMSGetCapabilitiesUrl(url, '1.3.0')).then((response2) => {
                    clearTimeout(id);
                    success(response2);
                  });
                  M.proxy(this.statusProxy);
                });
                const promisewfs = new Promise((success, reject) => {
                  const id = setTimeout(() => reject(), 15000);
                  let urlAux = url;
                  urlAux = M.utils.addParameters(url, 'request=GetCapabilities');
                  urlAux = M.utils.addParameters(urlAux, 'service=WFS');

                  urlAux = M.utils.addParameters(urlAux, {
                    version: '1.3.0',
                  });
                  M.proxy(this.useProxy);
                  M.remote.get(urlAux).then((responsewfs) => {
                    clearTimeout(id);
                    success(responsewfs);
                  });
                  M.proxy(this.statusProxy);
                });
                Promise.all([promise2, promisewfs]).then((response2) => {
                  let wms = false;
                  let wfs = false;

                  if (!M.utils.isNullOrEmpty(response2[0].text) && response2[0].text.indexOf('<TileMatrixSetLink>') === -1 && response2[0].text.indexOf('<GetMap>') >= 0) {
                    wms = true;
                  }

                  if (!M.utils.isNullOrEmpty(response2[1].text) && response2[1].text.indexOf('<TileMatrixSetLink>') === -1 && response2[1].text.indexOf('Operation name="GetFeature"') >= 0) {
                    wfs = true;
                  }

                  if (wms || wfs) {
                    try {
                      // WMS
                      if (wms) {
                        const getCapabilitiesParser = new M.impl.format.WMSCapabilities();
                        const getCapabilities = getCapabilitiesParser.read(response2[0].xml || new DOMParser().parseFromString(response2[0].text, 'text/xml'));
                        this.serviceCapabilities = getCapabilities.Service || {};
                        const getCapabilitiesUtils = new M.impl.GetCapabilities(
                          getCapabilities,
                          url,
                          this.map_.getProjection().code,
                        );
                        this.capabilities = this.filterResults(getCapabilitiesUtils.getLayers());
                        this.capabilities.forEach((layer) => {
                          try {
                            this.getParents(getCapabilities, layer);
                          } catch (err) { /* Continue */ }
                        });
                      }
                      // WFS
                      let wfsDatas;
                      if (wfs) {
                        wfsDatas = this.readWFSCapabilities(response2[1]);
                      }
                      this.showResults(wfsDatas);
                    } catch (error) {
                      M.dialog.error(getValue('exception.capabilities'), undefined, this.order);
                      this.removeLoading();
                    }
                  } else {
                    this.checkIfOGCAPIFeatures(url).then((reponseIsJson) => {
                      if (reponseIsJson === true) {
                        this.checkIfOGCAPICollection(url).then((responseIsOGC) => {
                          if (responseIsOGC) {
                            this.printOGCModal(url);
                          } else {
                            M.dialog.error(getValue('exception.ogcfeatures'), undefined, this.order);
                            this.removeLoading();
                          }
                        });
                      } else {
                        M.proxy(this.useProxy);
                        const extension = url.includes('.') ? url.substring(url.lastIndexOf('.') + 1, url.length) : '';
                        if (['zip', 'gpx', 'gml'].includes(extension)) {
                          this.openFileFromUrl(url, extension);
                        } else {
                          M.remote.get(url).then((response3) => {
                            // GEOJSON
                            if (M.utils.isNullOrEmpty(response3.text)) {
                              M.remote.get(searchInput.value.trim()).then((response4) => {
                                if (!M.utils.isNullOrEmpty(response4.text) && response4.text.replaceAll('\r\n', '').replaceAll(' ', '').indexOf('"type":"FeatureCollection"') >= 0) {
                                  this.printLayerModal(searchInput.value.trim(), 'geojson');
                                } else {
                                  M.dialog.error(getValue('exception.capabilities'), undefined, this.order);
                                  this.removeLoading();
                                }
                              });
                            } else if (response3.text.replaceAll('\r\n', '').replaceAll(' ', '').indexOf('"type":"FeatureCollection"') >= 0) {
                              this.printLayerModal(url, 'geojson');
                            } else if (response3.text.indexOf('<kml ') >= 0) {
                              const parser = new DOMParser();
                              const xmlDoc = parser.parseFromString(response3.text, 'text/xml');
                              const folders = xmlDoc.getElementsByTagName('Folder');
                              let cont = -1;
                              const names = Array.from(folders).map((folder) => {
                                cont += 1;
                                const name = folder.querySelector(':scope > name') ? folder.querySelector(':scope > name').textContent.trim() : `Layer__${cont}`;
                                return { name };
                              });
                              this.printLayerModal(url, 'kml', names);
                            }
                          });
                        }
                        M.proxy(this.statusProxy);
                      }
                    });
                    M.proxy(this.statusProxy);
                  }
                }).catch((eerror) => {
                  M.dialog.error(getValue('exception.capabilities'), undefined, this.order);
                  this.removeLoading();
                });
              }
            }).catch((err) => {
              M.dialog.error(getValue('exception.capabilities'), undefined, this.order);
              this.removeLoading();
            });
          }
        } else {
          let errorMsg;
          if (this.http) {
            errorMsg = getValue('exception.only_http');
          } else if (this.https) {
            errorMsg = getValue('exception.only_https');
          } else if (!this.http && !this.https) {
            errorMsg = getValue('exception.no_http_https');
          }
          M.dialog.error(errorMsg, undefined, this.order);
        }
      } else {
        M.dialog.error(getValue('exception.valid_url'), undefined, this.order);
      }
    } else {
      M.dialog.error(getValue('exception.empty'), undefined, this.order);
    }
  }

  // Permite añadir servicios
  openAddServices() {
    const precharged = this.precharged;
    const hasPrecharged = (precharged.groups !== undefined && precharged.groups.length > 0)
      || (precharged.services !== undefined && precharged.services.length > 0);
    const codsiActive = this.codsiActive;
    const accept = '.kml, .zip, .gpx, .geojson, .gml, .json';
    const addServices = M.template.compileSync(addServicesTemplate, {
      jsonp: true,
      parseToHtml: false,
      vars: {
        precharged,
        hasPrecharged,
        codsiActive,
        accept,
        translations: {
          url_service: getValue('url_service'),
          query: getValue('query'),
          group: getValue('group'),
          loaded_services: getValue('loaded_services'),
          clean: getValue('clean'),
          availables: getValue('availables'),
          codsi_services: getValue('codsi_services'),
          filter_results: getValue('filter_results'),
          clean_filter: getValue('clean_filter'),
          filter_text: getValue('filter_text'),
          upload_file: getValue('upload_file'),
        },
      },
    });
    M.dialog.info(addServices, getValue('load_ext_services'), this.order);

    setTimeout(() => {
      // Se modifica texto bt cerrar modal
      this.changeClodeButtonModal();

      // Eventos lista sugerencias
      this.addEventSuggestions();

      // Eventos Servicios CODSI
      this.addEventCODSI();

      // Eventos Buscador
      this.addEventSearch();

      // Eventos carga de ficheros
      this.addEventFileUpload();

      // Evento para añadir capas de grupo
      this.addGroupLayersEvent();
    }, 10);

    focusModal('#m-layerswitcher-addservices-search-input');
  }

  changeClodeButtonModal() {
    // Elements
    const button = document.querySelector(BT_CLOSE_MODAL);

    button.innerHTML = getValue('close');
  }

  addGroupLayersEvent() {
    const button = document.querySelector(LAYER_GROUP);
    const addSuggestions = document.querySelector(ADDSERVICES_SUGGESTIONS);
    const navBarModal = document.querySelector('.input-container');

    button.addEventListener('click', (evt) => {
      this.printLayerModal('', 'layerGroup');
      addSuggestions.style.display = 'none';
      navBarModal.style.display = 'none';
    });
  }

  addEventSearch() {
    // Elements
    const searchBtn = document.querySelector(SEARCH_BTN);
    // const fileUrlBtn = document.querySelector('#m-layerswitcher-addservices-fileurl-btn');
    const searchInput = document.querySelector(SEARCH_INPUT);

    searchBtn.addEventListener('click', (e) => {
      this.filterName = undefined;
      this.readCapabilities(e);
    });
    searchInput.addEventListener('keydown', (e) => {
      if (e.keyCode === 13) {
        this.filterName = undefined;
        this.readCapabilities(e);
      }
    });
  }

  addEventFileUpload() {
    const inputFile = document.querySelector('#m-layerswitcher-addservices-file-input');
    inputFile.addEventListener('change', () => this.changeFile(inputFile));
  }

  changeFile(inputFile) {
    M.loadFiles.addFileToMap(this.map_, inputFile.files[0]);
    inputFile.value = '';
    const buttonClose = document.querySelector('div.m-dialog.info div.m-button > button');
    buttonClose.click();
  }

  openFileFromUrl(url, extension) {
    if (M.utils.isUrl(url)) {
      const fileName = url.substring(url.lastIndexOf('/') + 1, url.lastIndexOf('.'));
      if (['zip', 'kml', 'gpx', 'geojson', 'gml', 'json'].includes(extension) > -1) {
        if (extension === 'zip') {
          this.downloadShp(url, fileName);
        } else {
          M.remote.get(url).then((response) => {
            const source = response.text;
            M.utils.loadFeaturesFromSource(this.map_, source, fileName, extension);
            const buttonClose = document.querySelector('div.m-dialog.info div.m-button > button');
            buttonClose.click();
          });
        }
      } else {
        M.dialog.error(getValue('exception.url_not_valid'));
      }
    }
  }

  downloadShp(url, fileName) {
    window.fetch(url)
      .then((response) => {
        if (!response.ok) {
          M.dialog.error(getValue('exception.url_not_valid'));
          return null;
        }
        return response.blob();
      }).then((blob) => {
        if (blob) {
          blob.arrayBuffer().then((buffer) => {
            M.utils.loadFeaturesFromSource(this.map_, buffer, fileName, 'zip');
            const buttonClose = document.querySelector('div.m-dialog.info div.m-button > button');
            buttonClose.click();
          });
        } else {
          M.dialog.error(getValue('exception.url_not_valid'));
        }
      })
      .catch((error) => {
        M.dialog.error(getValue('exception.url_not_valid'));
      });
  }

  addEventSuggestions() {
    // Elements
    const listSuggestBtn = document.querySelector(LIST_BTN);

    if (listSuggestBtn !== null) {
      listSuggestBtn.addEventListener('click', (e) => this.showSuggestions(e));
      listSuggestBtn.addEventListener('keydown', (e) => (e.keyCode === 13) && this.showSuggestions(e));
    }

    // evento para desplegar capas predefinidas
    document.querySelectorAll('.m-layerswitcher-suggestion-caret').forEach((elem) => {
      elem.addEventListener('click', () => {
        elem.parentElement.querySelector('.m-layerswitcher-suggestion-group').classList.toggle('active');
        elem.classList.toggle('m-layerswitcher-suggestion-caret-close');
      });
    });

    // evento para mostrar listado de capas predefinidas
    document.querySelectorAll('#m-layerswitcher-addservices-suggestions .m-layerswitcher-suggestion').forEach((elem) => {
      elem.addEventListener('click', (e) => this.loadSuggestion(e));
    });
  }

  showSuggestions() {
    // Elements
    const codsi = document.querySelector(CODSI);
    const ogcContainer = document.querySelector(OGC_CONTAINER);
    const addServicesResults = document.querySelector(ADDSERVICES_RESULTS);
    const addServicesSuggestions = document.querySelector(ADDSERVICES_SUGGESTIONS);
    document.querySelector(LAYERS_CONTAINER).innerHTML = '';

    if (codsi !== null) {
      codsi.style.display = 'none';
    }
    if (ogcContainer !== null) {
      ogcContainer.style.display = 'none';
    }

    addServicesResults.innerHTML = '';
    addServicesSuggestions.style.display = 'block';
  }

  // Lee el capabilities de un WFS
  readWFSCapabilities(response) {
    const services = [];
    const formatDefault = [];

    const operation = response.text.split('<ows:Operation name="GetFeature">')[1].split('</ows:Operation>')[0];
    const outputFormat = operation.split('<ows:Parameter name="outputFormat">')[1].split('</ows:Parameter>')[0];
    let allowedValues = '';
    if (outputFormat.indexOf('<ows:AllowedValues>') > -1) {
      allowedValues = outputFormat.split('<ows:AllowedValues>')[1].split('</ows:AllowedValues>')[0];
    } else {
      allowedValues = outputFormat;
    }

    if (allowedValues.indexOf('<ows:Value>') > -1) {
      const values = allowedValues.split('<ows:Value>');
      values.forEach((value) => {
        if (value.indexOf('</ows:Value>') > -1) {
          formatDefault.push(value.split('</ows:Value>')[0].trim());
        }
      });
    }

    const defaultFormatGetFeature = formatDefault.includes('json') ? 'application/json' : formatDefault[0];

    const prenode = response.text.split('<FeatureTypeList>')[1].split('</FeatureTypeList>')[0];
    if (prenode.indexOf('<FeatureType>') > -1) {
      const nodes = prenode.split('<FeatureType>');
      nodes.forEach((node) => {
        if (node.indexOf('</Name>') > -1) {
          // Extraer los formatos disponibles para cada FeatureType
          let formats = [];
          if (node.indexOf('<OutputFormats>') > -1) {
            const formatNode = node.split('<OutputFormats>')[1].split('</OutputFormats>')[0];
            formats = formatNode.split('<Format>').slice(1).map((format) => format.split('</Format>')[0].trim());
          }

          services.push({
            name: node.split('</Name>')[0].split('>')[1].trim(),
            title: node.split('</Title>')[0].split('<Title>')[1].trim(),
            formats: formats.length === 0 ? [defaultFormatGetFeature] : formats,
          });
        }
      });
    } else if (prenode.indexOf('<FeatureType') > -1) {
      const nodes = prenode.split('<FeatureType');
      nodes.forEach((node) => {
        if (node.indexOf('</Name>') > -1) {
          // Extraer los formatos disponibles para cada FeatureType
          let formats = [];
          if (node.indexOf('<OutputFormats>') > -1) {
            const formatNode = node.split('<OutputFormats>')[1].split('</OutputFormats>')[0];
            formats = formatNode.split('<Format>').slice(1).map((format) => format.split('</Format>')[0].trim());
          }

          services.push({
            name: node.split('</Name>')[0].split('<Name>')[1].trim(),
            title: node.split('</Title>')[0].split('<Title>')[1].trim(),
            formats: formats.length === 0 ? [defaultFormatGetFeature] : formats,
          });
        }
      });
    }

    const capabilities = {};
    let hasCapabilities = false;
    try {
      capabilities.title = response.text.split('<ows:Title>')[1].split('</ows:Title>')[0];
      hasCapabilities = true;
    } catch (err) {
      hasCapabilities = hasCapabilities || false;
    }

    try {
      capabilities.abstract = response.text.split('<ows:Abstract>')[1].split('</ows:Abstract>')[0];
      hasCapabilities = true;
    } catch (err) {
      hasCapabilities = hasCapabilities || false;
    }

    try {
      capabilities.accessConstraints = response.text.split('<ows:AccessConstraints>')[1].split('</ows:AccessConstraints>')[0];
      hasCapabilities = true;
    } catch (err) {
      hasCapabilities = hasCapabilities || false;
    }
    return { services, capabilities, hasCapabilities };
  }

  // Elimina contenido
  removeContains(evt) {
    evt.preventDefault();

    // Elements
    const codsi = document.querySelector(CODSI);
    const ogcContainer = document.querySelector(OGC_CONTAINER);

    if (ogcContainer !== null) {
      ogcContainer.style.display = 'none';
    }

    if (document.querySelector(LAYERS_CONTAINER) !== null) {
      document.querySelector(LAYERS_CONTAINER).style.display = 'none';
    }

    if (codsi !== null) {
      codsi.style.display = 'none';
    }

    document.querySelector(ADDSERVICES_RESULTS).innerHTML = '';
  }

  // Filtra los resultados
  filterResults(allLayers) {
    const layers = [];
    const layerNames = [];
    let allServices = [];
    if (this.filterName === undefined) {
      allLayers.forEach((layer) => {
        layers.push(layer);
        layerNames.push(layer.name);
      });
    } else if (this.filterName === 'none') {
      if (this.precharged.services !== undefined && this.precharged.services.length > 0) {
        allServices = allServices.concat(this.precharged.services);
      }

      if (this.precharged.groups !== undefined && this.precharged.groups.length > 0) {
        this.precharged.groups.forEach((group) => {
          if (group.services !== undefined && group.services.length > 0) {
            allServices = allServices.concat(group.services);
          }
        });
      }

      allLayers.forEach((layer) => {
        let insideService = false;
        allServices.forEach((service) => {
          if (service.type === layer.type && this.checkUrls(service.url, layer.url)) {
            if (service.white_list !== undefined && service.white_list.length > 0
                && service.white_list.indexOf(layer.name) > -1
                && layerNames.indexOf(layer.name) === -1) {
              layers.push(layer);
              layerNames.push(layer.name);
            } else if (service.white_list === undefined && layerNames.indexOf(layer.name) === -1) {
              layers.push(layer);
              layerNames.push(layer.name);
            }

            insideService = true;
          }
        });

        if (!insideService) {
          layers.push(layer);
          layerNames.push(layer.name);
        }
      });
    } else if (this.precharged.groups !== undefined && this.precharged.groups.length > 0) {
      this.precharged.groups.forEach((group) => {
        if (group.services !== undefined && group.services.length > 0
            && group.name === this.filterName) {
          allLayers.forEach((layer) => {
            let insideService = false;
            group.services.forEach((service) => {
              if (service.type === layer.type && this.checkUrls(service.url, layer.url)) {
                if (service.white_list !== undefined && service.white_list.length > 0
                    && service.white_list.indexOf(layer.name) > -1
                    && layerNames.indexOf(layer.name) === -1) {
                  layers.push(layer);
                  layerNames.push(layer.name);
                } else if (service.white_list === undefined
                    && layerNames.indexOf(layer.name) === -1) {
                  layers.push(layer);
                  layerNames.push(layer.name);
                }

                insideService = true;
              }
            });

            if (!insideService) {
              layers.push(layer);
              layerNames.push(layer.name);
            }
          });
        }
      });
    }

    return layers;
  }

  // Muesta el resueltado de las capas encontradas
  showResults(wfsDatas) {
    this.removeLoading();
    const result = [];
    let serviceType = 'WMS';
    if (!M.utils.isUndefined(this.capabilities)) {
      this.capabilities.forEach((capability) => {
        const add = capability.getImpl();
        add.abstract = capability.capabilitiesMetadata.abstract.trim();
        serviceType = capability.type;
        result.push(add);
      });
    }

    const container = document.querySelector(ADDSERVICES_RESULTS);
    if (result.length > 0 || !M.utils.isUndefined(wfsDatas)) {
      const serviceCapabilities = {};
      let showgeneral = true;
      if (serviceType === 'WMTS') {
        const si = this.serviceCapabilities.ServiceIdentification;
        const sp = this.serviceCapabilities.ServiceProvider;
        if (si !== undefined && si.Title !== undefined) {
          serviceCapabilities.title = si.Title.trim();
        }

        if (si !== undefined && si.Abstract !== undefined) {
          serviceCapabilities.abstract = si.Abstract.trim();
        }

        if (si !== undefined && si.AccessConstraints !== undefined) {
          serviceCapabilities.accessConstraints = si.AccessConstraints.trim();
        }

        if (sp !== undefined) {
          let contact = `${sp.ProviderName}<p><a class="m-layerswitcher-provider-link" href="${sp.ProviderSite}" target="_blank">${sp.ProviderSite}</a></p>`;
          const ci = sp.ServiceContact.ContactInfo;
          if (!M.utils.isNullOrEmpty(sp.ServiceContact) && !M.utils.isNullOrEmpty(ci)) {
            const mail = ci.Address.ElectronicMailAddress;
            contact += `<p><a class="m-layerswitcher-provider-link" href="mailto:${mail}">${mail}</a></p>`;
          }

          serviceCapabilities.contact = contact;
        }
      } else if (!M.utils.isUndefined(this.serviceCapabilities)) {
        const ci = this.serviceCapabilities.ContactInformation;
        if (this.serviceCapabilities.Title !== undefined) {
          serviceCapabilities.title = this.serviceCapabilities.Title.trim();
        }

        if (this.serviceCapabilities.Abstract !== undefined) {
          serviceCapabilities.abstract = this.serviceCapabilities.Abstract.trim();
        }

        if (this.serviceCapabilities.AccessConstraints !== undefined) {
          serviceCapabilities.accessConstraints = this.serviceCapabilities.AccessConstraints.trim();
        }

        if (ci !== undefined && ci.ContactPersonPrimary !== undefined) {
          if (ci.ContactPersonPrimary.ContactOrganization !== undefined) {
            serviceCapabilities.contact = ci.ContactPersonPrimary.ContactOrganization.trim();
          }
        }
      } else {
        showgeneral = false;
      }

      const vars = {
        result,
        serviceCapabilities,
        type: serviceType,
        isWFS: false,
        showgeneral,
        translations: {
          layers: getValue('layers'),
          add: getValue('add'),
          title: getValue('title'),
          abstract: getValue('abstract'),
          responsible: getValue('responsible'),
          access_constraints: getValue('access_constraints'),
          show_service_info: getValue('show_service_info'),
          addAllLayers: getValue('addAllLayers'),
          add_service: getValue('add_service'),
        },
      };

      if (!M.utils.isUndefined(wfsDatas)) {
        vars.layersWFS = wfsDatas.services;
        vars.serviceCapabilitieswfs = wfsDatas.capabilities;
        vars.isWFS = true;
      }

      const html = M.template.compileSync(resultstemplate, {
        vars,
      });

      container.innerHTML = html.innerHTML;
      createSelectGroup(this.map_);

      const results = container.querySelectorAll('span.m-check-layerswitcher-addservices');
      for (let i = 0; i < results.length; i += 1) {
        results[i].addEventListener('click', (evt) => this.registerCheck(evt));
      }

      const resultsWFS = container.querySelectorAll('span.m-check-layerswitcher-addservices-wfs');
      for (let i = 0; i < resultsWFS.length; i += 1) {
        resultsWFS[i].addEventListener('click', (evt) => this.registerCheckWFS(evt));
      }

      const resultsNames = container.querySelectorAll('#m-layerswitcher-all tbody tr td.m-layerswitcher-table-layer-name');
      for (let i = 0; i < resultsNames.length; i += 1) {
        resultsNames[i].addEventListener('click', (evt) => this.registerCheckFromName(evt));
      }

      const resultsNamesWFS = container.querySelectorAll('#m-layerswitcher-wfs tbody tr td.m-layerswitcher-table-layer-name');
      for (let i = 0; i < resultsNamesWFS.length; i += 1) {
        resultsNamesWFS[i].addEventListener('click', (evt) => this.registerCheckFromNameWFS(evt));
      }

      const checkboxResults = container.querySelectorAll('.m-layerswitcher-table-results .m-layerswitcher-table-container table tbody tr td span');
      checkboxResults.forEach((l) => l.addEventListener('keydown', (e) => (e.keyCode === 13) && this.registerCheckFromName(e)));

      const sAll = container.querySelector('#m-layerswitcher-addservices-selectall');
      if (!M.utils.isNull(sAll)) {
        sAll.addEventListener('click', (evt) => this.registerCheck(evt));
      }
      const selAllWFS = container.querySelector('#m-layerswitcher-addservices-selectall-wfs');
      if (!M.utils.isNull(selAllWFS)) {
        selAllWFS.addEventListener('click', (evt) => this.registerCheckWFS(evt));
      }
      container.querySelector('.m-layerswitcher-addservices-add').addEventListener('click', (evt) => this.addSelected_WMS_WMTS_WFS(evt));
      const elem = container.querySelector('.m-layerswitcher-show-capabilities');
      if (!M.utils.isNull(elem)) {
        elem.addEventListener('click', () => {
          const block = container.querySelector('.m-layerswitcher-capabilities-container');
          if (block.style.display !== 'block') {
            block.style.display = 'block';
            elem.innerHTML = `<span class="m-layerswitcher-icons-colapsar"></span>&nbsp;${getValue('hide_service_info')}`;
          } else {
            block.style.display = 'none';
            elem.innerHTML = `<span class="m-layerswitcher-icons-desplegar"></span>&nbsp;${getValue('show_service_info')}`;
          }
        });
      }
      const elem2 = container.querySelector('.m-layerswitcher-show-capabilities-wfs');
      if (!M.utils.isNull(elem2)) {
        elem2.addEventListener('click', () => {
          const block = container.querySelector('.m-layerswitcher-capabilities-container-wfs');
          if (block.style.display !== 'block') {
            block.style.display = 'block';
            elem2.innerHTML = `<span class="m-layerswitcher-icons-colapsar"></span>&nbsp;${getValue('hide_service_info')}`;
          } else {
            block.style.display = 'none';
            elem2.innerHTML = `<span class="m-layerswitcher-icons-desplegar"></span>&nbsp;${getValue('show_service_info')}`;
          }
        });
      }
    } else {
      container.innerHTML = `<p class="m-layerswitcher-noresults">${getValue('exception.no_results')}</p>`;
    }
    const addServicesResults = document.querySelector(ADDSERVICES_RESULTS);
    addServicesResults.style.display = 'block';
  }

  // Determina si es OGCAPI
  checkIfOGCAPIFeatures(url) {
    M.proxy(this.useProxy);
    return M.remote.get(`${url}?f=json`).then((response) => {
      let isJson = false;
      if (!M.utils.isNullOrEmpty(response) && !M.utils.isNullOrEmpty(response.text) && response.text.indexOf('collections') !== -1) {
        isJson = true;
      }
      return isJson;
    }).catch(() => {
      return false;
    });
  }

  checkIfOGCAPICollection(url) {
    M.proxy(this.useProxy);
    const collections = `${(url.endsWith('/') ? url : `${url}/`)}collections?f=json`;
    return M.remote.get(collections).then((response) => {
      let isOGCAPI = false;
      if (!M.utils.isNullOrEmpty(response) && !M.utils.isNullOrEmpty(response.text)) {
        const responseJson = JSON.parse(response.text);
        if (responseJson.collections.length > 0 && responseJson.collections[0].itemType === 'feature') {
          isOGCAPI = true;
        } else {
          const collections2 = `${(url.endsWith('/') ? url : `${url}/`)}collections/${responseJson.collections[0].id}/items?f=json&limit=1`;
          return M.remote.get(collections2).then((response2) => {
            const responseJson2 = JSON.parse(response2.text);
            if (responseJson2.type === 'FeatureCollection') {
              isOGCAPI = true;
            }
            return isOGCAPI; // Agregar un retorno aquí
          });
        }
      }
      return isOGCAPI; // Agregar un retorno aquí también
    }).catch(() => {
      return false;
    });
  }

  // Registra los checks de las capas
  registerCheck(evt) {
    const e = (evt || window.event);
    if (!M.utils.isNullOrEmpty(e.target) && e.target.classList.contains('m-check-layerswitcher-addservices')) {
      const container = document.querySelector(ADDSERVICES_RESULTS);
      let numNotChecked = container.querySelectorAll('.m-check-layerswitcher-addservices.m-layerswitcher-icons-check').length;
      numNotChecked += (e.target.classList.contains('m-layerswitcher-icons-check') ? -1 : 1);
      e.stopPropagation();
      e.target.classList.toggle('m-layerswitcher-icons-check');
      e.target.classList.toggle('m-layerswitcher-icons-check-seleccionado');
      if (numNotChecked > 0) {
        this.stateSelectAll = false;
        document.querySelector('#m-layerswitcher-addservices-selectall').classList.remove('m-layerswitcher-icons-check-seleccionado');
        document.querySelector('#m-layerswitcher-addservices-selectall').classList.add('m-layerswitcher-icons-check');
      } else if (numNotChecked === 0) {
        this.stateSelectAll = true;
        document.querySelector('#m-layerswitcher-addservices-selectall').classList.remove('m-layerswitcher-icons-check');
        document.querySelector('#m-layerswitcher-addservices-selectall').classList.add('m-layerswitcher-icons-check-seleccionado');
      }
    } else if (!M.utils.isNullOrEmpty(e.target) && e.target.id === 'm-layerswitcher-addservices-selectall') {
      if (this.stateSelectAll) {
        e.target.classList.remove('m-layerswitcher-icons-check-seleccionado');
        e.target.classList.add('m-layerswitcher-icons-check');
        this.unSelect();
        this.stateSelectAll = false;
      } else {
        e.target.classList.remove('m-layerswitcher-icons-check');
        e.target.classList.add('m-layerswitcher-icons-check-seleccionado');
        this.select();
        this.stateSelectAll = true;
      }
    }
  }

  // Registra los checks de las WFS
  registerCheckWFS(evt) {
    const e = (evt || window.event);
    if (!M.utils.isNullOrEmpty(e.target) && e.target.classList.contains('m-check-layerswitcher-addservices-wfs')) {
      const container = document.querySelector(ADDSERVICES_RESULTS);
      let numNotChecked = container.querySelectorAll('.m-check-layerswitcher-addservices-wfs.m-layerswitcher-icons-check').length;
      numNotChecked += (e.target.classList.contains('m-layerswitcher-icons-check') ? -1 : 1);
      e.stopPropagation();
      e.target.classList.toggle('m-layerswitcher-icons-check');
      e.target.classList.toggle('m-layerswitcher-icons-check-seleccionado');
      if (numNotChecked > 0) {
        this.stateSelectAll = false;
        document.querySelector('#m-layerswitcher-addservices-selectall-wfs').classList.remove('m-layerswitcher-icons-check-seleccionado');
        document.querySelector('#m-layerswitcher-addservices-selectall-wfs').classList.add('m-layerswitcher-icons-check');
      } else if (numNotChecked === 0) {
        this.stateSelectAll = true;
        document.querySelector('#m-layerswitcher-addservices-selectall-wfs').classList.remove('m-layerswitcher-icons-check');
        document.querySelector('#m-layerswitcher-addservices-selectall-wfs').classList.add('m-layerswitcher-icons-check-seleccionado');
      }
    } else if (!M.utils.isNullOrEmpty(e.target) && e.target.id === 'm-layerswitcher-addservices-selectall-wfs') {
      if (this.stateSelectAll) {
        e.target.classList.remove('m-layerswitcher-icons-check-seleccionado');
        e.target.classList.add('m-layerswitcher-icons-check');
        this.unSelectWFS();
        this.stateSelectAll = false;
      } else {
        e.target.classList.remove('m-layerswitcher-icons-check');
        e.target.classList.add('m-layerswitcher-icons-check-seleccionado');
        this.selectWFS();
        this.stateSelectAll = true;
      }
    }
  }

  // Registra los checks por nombre
  registerCheckFromName(evt) {
    const e = (evt || window.event);
    e.target.parentElement.querySelector('span.m-check-layerswitcher-addservices').click();
  }

  // Registra los checks por nombre para WFS
  registerCheckFromNameWFS(evt) {
    const e = (evt || window.event);
    e.target.parentElement.querySelector('span.m-check-layerswitcher-addservices-wfs').click();
  }

  addLayersWFS(elmSelWFS) {
    const url = document.querySelector(SEARCH_INPUT).value.trim().split('?')[0];
    elmSelWFS.forEach((elm) => {
      const id = elm.id.split(':');
      const format = elm.getAttribute('format');
      if (id[0] !== 'm-layerswitcher-addservices-selectall-wfs') {
        const namespace = id[0];
        const name = id[1];
        const obj = {
          type: 'WFS',
          url,
          legend: name,
          extact: true,
          format: format || 'application/json',
        };
        if (M.utils.isUndefined(name)) {
          obj.name = namespace;
        } else {
          obj.name = name;
          obj.namespace = namespace;
        }
        this.addLayer(obj);
      }
    });
  }

  // Añade capas
  addSelected_WMS_WMTS_WFS(evt) {
    evt.preventDefault();
    const layers = [];
    const elmSel = document.querySelectorAll('#m-layerswitcher-addservices-results #m-layerswitcher-all .m-layerswitcher-icons-check-seleccionado');
    const elmSelWFS = document.querySelectorAll('#m-layerswitcher-addservices-results #m-layerswitcher-wfs .m-layerswitcher-icons-check-seleccionado');
    if (elmSel.length === 0 && elmSelWFS.length === 0) {
      M.dialog.error(getValue('exception.select_layer'), undefined, this.order);
    } else {
      for (let i = 0; i < elmSel.length; i += 1) {
        for (let j = 0; j < this.capabilities.length; j += 1) {
          const name = this.capabilities[j].name;
          if (elmSel[i].id === name || elmSel[i].name === name) {
            const limit = parseInt(this.serviceCapabilities.MaxWidth, 10);
            const hasLimit = !Number.isNaN(limit) && limit < 4096;
            const isIDECanarias = this.serviceCapabilities.Title !== undefined && this.serviceCapabilities.Title.toLowerCase().indexOf('idecanarias') > -1;
            if (this.capabilities[j].url.indexOf(CATASTRO) > -1 || isIDECanarias) {
              this.capabilities[j].version = '1.1.1';
            }

            this.capabilities[j].tiled = this.capabilities[j].type === 'WMTS' || hasLimit || isIDECanarias;
            this.capabilities[j].options.origen = this.capabilities[j].type;
            const legendUrl = this.capabilities[j].getLegendURL();
            const meta = this.capabilities[j].capabilitiesMetadata;
            if ((legendUrl.indexOf('GetLegendGraphic') > -1 || legendUrl.indexOf('assets/img/legend-default.png') > -1) && meta !== undefined && meta.style.length > 0) {
              if (meta.style[0].LegendURL !== undefined && meta.style[0].LegendURL.length > 0) {
                const style = meta.style[0].LegendURL[0].OnlineResource;
                if (style !== undefined && style !== null) {
                  this.capabilities[j].setLegendURL(style);
                }
              }

              if (this.capabilities[j].type === 'WMTS') {
                if (meta.style !== undefined && meta.style.length > 0) {
                  meta.style.forEach((s) => {
                    if (s.isDefault === true && s.LegendURL !== undefined
                        && s.LegendURL.length > 0) {
                      const urlDefaultStyle = s.LegendURL[0].href;
                      this.capabilities[j].setLegendURL(urlDefaultStyle);
                    }
                  });
                }
              }
            }

            layers.push(this.capabilities[j]);
          }
        }
      }
      if (elmSelWFS.length > 0) {
        this.addLayersWFS(elmSelWFS);
      }

      layers.reverse();
      const useAttributions = (this.useAttributions_) ? addAttributions(layers) : layers;
      useAttributions.forEach((layer) => this.addLayer({ existingLayer: layer }));

      const buttonClose = document.querySelector('div.m-dialog.info div.m-button > button');
      buttonClose.click();
    }
  }

  // Quita selección a capa
  unSelect() {
    const unSelect = document.querySelectorAll('#m-layerswitcher-all tbody span.m-layerswitcher-icons-check-seleccionado');
    for (let i = 0; i < unSelect.length; i += 1) {
      unSelect[i].classList.remove('m-layerswitcher-icons-check-seleccionado');
      unSelect[i].classList.add('m-layerswitcher-icons-check');
    }
  }

  // Pone selección a capa
  select() {
    const select = document.querySelectorAll('#m-layerswitcher-all tbody span');
    for (let i = 0; i < select.length; i += 1) {
      select[i].classList.remove('m-layerswitcher-icons-check');
      select[i].classList.add('m-layerswitcher-icons-check-seleccionado');
    }
  }

  // Quita selección a capa WFS
  unSelectWFS() {
    const unSelect = document.querySelectorAll('#m-layerswitcher-addservices-results #m-layerswitcher-wfs .m-layerswitcher-icons-check-seleccionado');
    for (let i = 0; i < unSelect.length; i += 1) {
      unSelect[i].classList.remove('m-layerswitcher-icons-check-seleccionado');
      unSelect[i].classList.add('m-layerswitcher-icons-check');
    }
  }

  // Pone selección a capa WFS
  selectWFS() {
    const select = document.querySelectorAll('#m-layerswitcher-addservices-results #m-layerswitcher-wfs .m-layerswitcher-icons-check');
    for (let i = 0; i < select.length; i += 1) {
      select[i].classList.remove('m-layerswitcher-icons-check');
      select[i].classList.add('m-layerswitcher-icons-check-seleccionado');
    }
  }

  loadSuggestion(evt) {
    const url = evt.target.getAttribute('data-link');
    try {
      const group = evt.target.parentElement.parentElement.parentElement;
      const nameGroup = group.querySelector('.m-layerswitcher-suggestion-caret').innerText;
      this.filterName = nameGroup;
      if (group.localName === 'tbody') {
        this.filterName = 'none';
      }
    } catch (err) { /* Continue */ }
    document.querySelector(SEARCH_INPUT).value = url;

    this.readCapabilities(evt);
  }

  // Compara 2 URLS
  checkUrls(url1, url2) {
    return url1 === url2 || (url1.indexOf(url2) > -1) || (url2.indexOf(url1) > -1);
  }

  // Plantilla para añadir capas (Generales)
  printLayerModal(url, type, layers) {
    const modal = M.template.compileSync(layerModalTemplate, {
      jsonp: true,
      parseToHtml: false,
      vars: {
        type,
        isMVT: type === 'mvt',
        layers,
        translations: {
          add_btn: getValue('add_btn'),
          legend: getValue('legend'),
          name: getValue('name'),
          data_layer: getValue('data_layer'),
          layers: getValue('layers'),
          addAllLayers: getValue('addAllLayers'),
          add_service: getValue('add_service'),
          separatedby: getValue('separatedby'),
          placeHolderLegend: getValue('placeHolderLegend'),
        },
      },
    });

    document.querySelector(LAYERS_CONTAINER).outerHTML = modal;

    if (type === 'mvt' || type === 'kml') {
      const selAll = document.querySelector('#m-layerswitcher-addservices-selectall');
      if (!M.utils.isNullOrEmpty(selAll)) {
        selAll.addEventListener('click', (evt) => this.registerCheck(evt));
        const results = document.querySelectorAll('span.m-check-layerswitcher-addservices');
        for (let i = 0; i < results.length; i += 1) {
          results[i].addEventListener('click', (evt) => this.registerCheck(evt));
        }
      }
    }

    createSelectGroup(this.map_);

    const btnAddLayer = document.querySelector('#m-layerswitcher-layer-button');
    btnAddLayer.addEventListener('click', () => {
      const randomNumber = Math.floor(Math.random() * 9000) + 1000;
      const nameModal = document.querySelector('#m-layerswitcher-layer-name');
      let name = null;
      if (M.utils.isNullOrEmpty(name)) {
        name = `layer_${randomNumber}`;
      } else {
        name = name.value || `layer_${randomNumber}`;
      }
      const legend = document.querySelector('#m-layerswitcher-layer-legend').value || name || `layer_${randomNumber}`;
      let matrixSet = document.querySelector('#m-layerswitcher-layer-matrixset');
      if (!M.utils.isNullOrEmpty(matrixSet)) {
        matrixSet = matrixSet.value || 'EPSG:3857';
      }

      this.addLayer({
        name: nameModal === null ? legend : name,
        type,
        legend,
        url,
        matrixSet,
      });

      document.querySelector('div.m-dialog.info').parentNode.removeChild(document.querySelector('div.m-dialog.info'));
    });
    this.removeLoading();
  }

  addLayer({
    name,
    type,
    legend,
    url,
    format,
    matrixSet,
    OGCAPIFeatures,
    namespace,
    existingLayer,
  }) {
    let layer = null;

    if (type === 'osm') {
      layer = new M.layer.OSM({
        name,
        legend,
        transparent: true,
        url,
        matrixSet,
      });
    } else if (type === 'geojson') {
      layer = new M.layer.GeoJSON({
        extract: true,
        name,
        legend,
        url,
      });
    } else if (type === 'tms') {
      layer = new M.layer.TMS({
        name,
        legend,
        url,
        // projection: matrixSet,
      });
    } else if (type === 'xyz') {
      layer = new M.layer.XYZ({
        name,
        legend,
        url,
        // projection: matrixSet,
      });
    } else if (type === 'mvt') {
      const elmSel = document.querySelectorAll('#m-layerswitcher-addservices-results .m-layerswitcher-icons-check-seleccionado');
      let layersSelected = [];
      elmSel.forEach((elm) => {
        layersSelected.push(elm.id);
      });
      const nameLayers = document.querySelector('#m-layerswitcher-layer-name');
      if (!M.utils.isNullOrEmpty(nameLayers) && nameLayers.value.indexOf('layer_') === -1) {
        layersSelected = nameLayers.value.split(',');
      }
      const obj = {
        name,
        legend,
        url,
        projection: matrixSet,
        extract: true,
      };
      if (!M.utils.isNullOrEmpty(layersSelected)) {
        obj.layers = layersSelected;
      }
      layer = new M.layer.MVT(obj);
    } else if (type === 'kml') {
      const elmSel = document.querySelectorAll('#m-layerswitcher-addservices-results .m-layerswitcher-icons-check-seleccionado');
      const layersSelected = [];
      elmSel.forEach((elm) => {
        layersSelected.push(elm.id);
      });
      const obj = {
        name,
        legend,
        url,
        extract: true,
      };
      if (!M.utils.isNullOrEmpty(layersSelected)) {
        obj.layers = layersSelected;
      }
      layer = new M.layer.KML(obj);
    } else if (type === 'geotiff') {
      layer = new M.layer.GeoTIFF({
        name,
        legend,
        url,
      });
    } else if (type === 'maplibre') {
      layer = new M.layer.MapLibre({
        name,
        legend,
        url,
        extract: true,
      });
    } else if (type === 'layerGroup') {
      layer = new M.layer.LayerGroup({
        name,
        legend,
      });
    } else if (type === 'OGCAPIFeatures') {
      layer = new M.layer.OGCAPIFeatures(OGCAPIFeatures);
      layer.setZIndex(layer.getZIndex() + 8);
    } else if (type === 'WFS') {
      layer = new M.layer.WFS({
        name,
        namespace,
        legend,
        url,
        extract: true,
      }, {
        describeFeatureTypeOutputFormat: 'geojson',
        getFeatureOutputFormat: format,
      });
    } else if (existingLayer) {
      layer = existingLayer;
    }

    const inGroup = getLayerSelectGroup(this.map_);

    if (inGroup) {
      inGroup.addLayers(layer);
      layer.setZIndex(inGroup.getZIndex());
    } else {
      this.map_.addLayers(layer);
    }
  }

  // Plantilla para OGCAPI
  printOGCModal(
    url,
    selectedLayer,
    limitVal,
    onlyBbox,
    summary,
    filterByID,
    filterByOtherFilters,
  ) {
    let prevID;
    let urlOGC = url.trim();
    if (M.utils.isUrl(urlOGC)) {
      document.querySelector(SEARCH_INPUT).value = url;

      const collections = `${(urlOGC.endsWith('/') ? urlOGC : `${urlOGC}/`)}collections?f=json`;
      M.proxy(this.useProxy);
      M.remote.get(collections).then((response) => {
        const resJSON = JSON.parse(response.text);
        const layers = resJSON.collections;
        if (M.utils.isNullOrEmpty(summary)) {
          summary = undefined;
          filterByID = undefined;
          filterByOtherFilters = undefined;
        }

        const ogcModal = M.template.compileSync(ogcModalTemplate, {
          jsonp: true,
          parseToHtml: false,
          vars: {
            layers,
            selectedLayer,
            limit: limitVal,
            bbox: onlyBbox,
            summary,
            filterByID,
            filterByOtherFilters,
            prevID,
            translations: {
              select_service: getValue('select_service'),
              amount_results: getValue('amount_results'),
              amount_results_2: getValue('amount_results_2'),
              bbox_select: getValue('bbox-select'),
              other_filters: getValue('other_filters'),
              id_filter: getValue('id_filter'),
              warning: getValue('warning'),
              add_btn: getValue('add_btn'),
              custom_query_btn: getValue('custom_query_btn'),
              filters: getValue('filters'),
              check_results: getValue('check_results'),
            },
          },
        });
        this.removeLoading();

        document.querySelector('#m-layerswitcher-ogcCContainer').outerHTML = ogcModal;

        createSelectGroup(this.map_);

        const radioBtnFilterByID = document.querySelector('input[name="m-layerswitcher-ogc-filter"][value="id"]');
        const radioBtnFilterByOther = document.querySelector('input[name="m-layerswitcher-ogc-filter"][value="others"]');

        this.setOnClickRadioBtn(radioBtnFilterByID, radioBtnFilterByOther);
        this.setOnChanges(summary);
        this.setOnClickCloseBtn();
        this.setOnClickersFiltersButtons(
          summary,
          urlOGC,
          radioBtnFilterByID,
          radioBtnFilterByOther,
          layers,
          url,
          filterByID,
          filterByOtherFilters,
        );
      }).catch((err) => {
        urlOGC = '';
        M.dialog.error(getValue('exception.error_ogc'), undefined, this.order);
      });
      M.proxy(this.statusProxy);
    }
  }

  // Cambia la visualización de opciones de filtrado dependiendo del filtro seleccionado
  // (ID u otros)
  setOnClickRadioBtn(radioBtnFilterByID, radioBtnFilterByOther) {
    radioBtnFilterByID.addEventListener('click', () => {
      document.querySelector('#m-layerswitcher-ogc-other-filters').style.display = 'none';
      document.querySelector('#m-layerswitcher-ogc-filter-id').style.display = 'block';
      document.querySelector('#m-layerswitcher-ogc-check-results').innerHTML = '';
    });
    radioBtnFilterByOther.addEventListener('click', () => {
      document.querySelector('#m-layerswitcher-ogc-other-filters').style.display = 'block';
      document.querySelector('#m-layerswitcher-ogc-filter-id').style.display = 'none';
      document.querySelector('#m-layerswitcher-ogc-check-results').innerHTML = '';
    });
  }

  setOnChanges(summary) {
    document.querySelector('#m-layerswitcher-ogc-search-form-ID').addEventListener('change', () => {
      document.querySelector('#m-layerswitcher-ogc-check-results').innerHTML = '';
    });

    document.querySelector('#m-layerswitcher-ogc-limit-items').addEventListener('change', () => {
      document.querySelector('#m-layerswitcher-ogc-check-results').innerHTML = '';
    });
    document.querySelector('#m-layerswitcher-ogc-search-bbox').addEventListener('change', () => {
      document.querySelector('#m-layerswitcher-ogc-check-results').innerHTML = '';
    });

    document.querySelector('#m-layerswitcher-ogc-vectors-select').addEventListener('change', () => {
      const divSummary = document.querySelector('#m-layerswitcher-ogc-summary');
      if (divSummary !== null) {
        divSummary.remove();
        summary = undefined;
      }
      document.querySelector('#m-layerswitcher-ogc-check-results').innerHTML = '';
    });
  }

  setOnClickCloseBtn() {
    const buttonClose = document.querySelector('div.m-dialog.info div.m-button > button');
    buttonClose.innerHTML = getValue('close');
    buttonClose.style.width = '75px';
    buttonClose.style.backgroundColor = '#71a7d3';
    buttonClose.addEventListener('click', () => {
      try {
        document.querySelector('div.m-dialog.info').parentNode.removeChild(document.querySelector('div.m-dialog.info'));
      } catch (error) { /* Continue */ }
    });
  }

  setOnClickersFiltersButtons(
    summary,
    urlOGC,
    radioBtnFilterByID,
    radioBtnFilterByOther,
    layers,
    url,
    filterByID,
    filterByOtherFilters,
  ) {
    let indexCurrentLayer;
    let formInputs;
    let properties;
    let selectValue = document.querySelector('#m-layerswitcher-ogc-vectors-select').value;
    const btnAddLayer = document.querySelector('#m-layerswitcher-ogcCContainer #m-layerswitcher-ogc-select-button');
    const btnCheck = document.querySelector('#m-layerswitcher-ogcCContainer #m-layerswitcher-ogc-check-button');
    const btnCustomQuery = document.querySelector('#m-layerswitcher-ogc-custom-query-button');

    btnAddLayer.addEventListener('click', () => {
      if (selectValue === getValue('select_service')) {
        M.dialog.error(getValue('no_results'), undefined, this.order);
      } else {
        properties = this.getProperties(selectValue, summary);

        this.addLayer({ OGCAPIFeatures: properties, type: 'OGCAPIFeatures' });

        const buttonClose = document.querySelector('div.m-dialog.info div.m-button > button');
        buttonClose.click();
      }
    });

    btnCheck.addEventListener('click', () => {
      if (selectValue === getValue('select_service')) {
        M.dialog.error(getValue('no_results'), undefined, this.order);
      } else {
        properties = this.getProperties(selectValue, summary);
        this.getNumberFeaturesOGCAPIFeaturesLayer(properties).then((numberFeatures) => {
          let results1;
          let results2;
          if (numberFeatures === 1) {
            results1 = getValue('results_1_singular');
            results2 = getValue('results_2_singular');
          } else {
            results1 = getValue('results_1_plural');
            results2 = getValue('results_2_plural');
          }
          const result = document.querySelector('#m-layerswitcher-ogc-check-results');
          result.style.display = 'block';
          result.innerHTML = `${results1}${numberFeatures}${results2}`;
        })
          .then(() => {
            document.querySelector('#m-layerswitcher-ogc-check-results').focus();
          });
        M.proxy(this.statusProxy);
      }
    });

    btnCustomQuery.addEventListener('click', () => {
      let filtersList;

      const previousModal = document.querySelector('.m-content').innerHTML;
      selectValue = document.querySelector('#m-layerswitcher-ogc-vectors-select').value;
      const limit = document.querySelector('#m-layerswitcher-ogc-limit-items').value;
      const checked = document.querySelector('#m-layerswitcher-ogc-search-bbox').checked;
      const urlQueryables = `${urlOGC}/collections/${selectValue}/queryables`;
      M.proxy(this.useProxy);
      M.remote.get(urlQueryables).then((queryablesResponse) => {
        try {
          const res = JSON.parse(queryablesResponse.text);
          const props = res.properties;
          filtersList = Object.values(props);
          filtersList.forEach((v) => {
            if (v.title !== undefined) {
              const type = v.type.toLowerCase();
              if (type === 'bool' || type === 'boolean') {
                v.bool = true;
              } else if (type === 'timestamp' || type === 'date') {
                v.date = true;
              } else if (type === 'int4' || type === 'int'
                || type === 'number' || type === 'numeric' || type.includes('numeric')) {
                v.number = true;
              } else {
                v.text = true;
              }
            }
            if (summary !== undefined) {
              if (v.title in summary) {
                v.value = summary[v.title];
              }
              document.querySelector('#m-layerswitcher-ogc-check-results').innerHTML = '';
            }
          });
        } catch (error) { /* Continue */ }
        const urlInput = document.querySelector(SEARCH_INPUT).value;

        const customQueryTemplate = M.template.compileSync(customQueryFiltersTemplate, {
          jsonp: true,
          parseToHtml: false,
          vars: {
            filtersList,
            summary,
            translations: {
              other_filters: getValue('other_filters'),
              id_filter: getValue('id_filter'),
              filters: getValue('filters'),
              custom_query_warning: getValue('custom_query_warning'),
            },
          },
        });
        const msg = `${getValue('custom_query_btn')}`;
        M.dialog.remove(ogcModalTemplate, undefined, this.order);
        M.dialog.info(customQueryTemplate, msg, this.order);
        const btnApplyFilters = document.createElement('button');
        const btnBack = document.createElement('button');
        setTimeout(() => {
          const temp = document.querySelector('div.m-mapea-container div.m-dialog div.m-title');
          temp.style.backgroundColor = '#71a7d3';
          const button = document.querySelector('div.m-dialog.info div.m-button > button');
          button.innerHTML = getValue('close');
          button.style.width = '75px';
          button.style.backgroundColor = '#71a7d3';
          button.style.display = 'none';
          const buttons = document.querySelector('div.m-dialog.info div.m-button');

          btnBack.textContent = getValue('close');
          btnBack.style.width = '75px';
          btnBack.style.backgroundColor = '#71a7d3';
          btnBack.style.marginLeft = '4px';
          btnBack.setAttribute('data-link', urlInput);
          btnBack.setAttribute('data-service-type', 'OGCAPIFeatures');
          buttons.insertBefore(btnBack, buttons.firstChild);

          btnApplyFilters.textContent = getValue('apply_btn');
          btnApplyFilters.style.width = '75px';
          btnApplyFilters.style.backgroundColor = '#71a7d3';
          btnApplyFilters.setAttribute('data-link', urlInput);
          btnApplyFilters.setAttribute('data-service-type', 'OGCAPIFeatures');
          buttons.insertBefore(btnApplyFilters, buttons.firstChild);
        }, 10);
        btnApplyFilters.addEventListener('click', () => {
          let filterByIDTemp = false;
          let filterByOtherFiltersTemp = false;

          // comprobar el valor del tipo de m-layerswitcher-ogc-filter seleccionado
          if (radioBtnFilterByID.checked) {
            filterByIDTemp = true;
            filterByOtherFiltersTemp = false;
            formInputs = document.querySelectorAll('#m-layerswitcher-ogc-search-form-id input');
          } else if (radioBtnFilterByOther.checked) {
            filterByIDTemp = false;
            filterByOtherFiltersTemp = true;
            formInputs = document.querySelectorAll('#m-layerswitcher-ogc-search-formothers input');
          }
          const cDict = this.getFiltersDict(formInputs);

          const modalActual = document.querySelector('.m-content');

          modalActual.innerHTML = previousModal;

          indexCurrentLayer = layers.findIndex((capa) => {
            return capa.id === selectValue;
          });

          if (M.utils.isNullOrEmpty(cDict)) {
            this.printOGCModal(url, indexCurrentLayer, limit, checked);
          } else if (Object.keys(cDict).length === 0) {
            this.printOGCModal(url, indexCurrentLayer, limit, checked);
          } else {
            this.printOGCModal(
              url,
              indexCurrentLayer,
              limit,
              checked,
              cDict,
              filterByIDTemp,
              filterByOtherFiltersTemp,
            );
          }
        });
        btnBack.addEventListener('click', () => {
          const modalActual = document.querySelector('.m-content');
          modalActual.innerHTML = previousModal;
          indexCurrentLayer = layers.findIndex((capa) => {
            return capa.id === selectValue;
          });
          this.printOGCModal(
            url,
            indexCurrentLayer,
            limit,
            checked,
            summary,
            filterByID,
            filterByOtherFilters,
          );
        });
      }).catch((err) => {
        M.dialog.error(getValue('no_results'), undefined, this.order);
      });
      M.proxy(this.statusProxy);
    });
  }

  getProperties(selectValue, summary) {
    const urlQuery = document.querySelector(SEARCH_INPUT).value;
    const selectValueText = document.querySelector('#m-layerswitcher-ogc-vectors-select').selectedOptions[0].text;
    selectValue = document.querySelector('#m-layerswitcher-ogc-vectors-select').value;
    const limit = document.querySelector('#m-layerswitcher-ogc-limit-items').value;
    const checked = document.querySelector('#m-layerswitcher-ogc-search-bbox').checked;
    const limitValue = limit;
    let bboxString;
    if (checked) {
      const bbox = this.map_.getBbox();
      const min = this.getImpl().getTransformedCoordinates(
        this.map_.getProjection().code,
        [bbox.x.min, bbox.y.min],
      );
      const max = this.getImpl().getTransformedCoordinates(
        this.map_.getProjection().code,
        [bbox.x.max, bbox.y.max],
      );
      bboxString = `${min[0]};${min[1]};${max[0]};${max[1]}`;
    }
    const properties = {};
    properties.url = `${urlQuery}/collections/`;
    properties.name = selectValue;
    properties.legend = selectValueText;
    properties.limit = limitValue;
    properties.extract = true;

    if (this.useAttributions_) {
      properties.attribution = {
        url: 'https://www.idee.es/',
        id: window.crypto.randomUUID(),
        name: properties.legend,
        nameLayer: properties.name,
      };
    }

    if (checked) {
      properties.bbox = bboxString;
    }

    const isFiltroPorID = document.querySelector('#m-layerswitcher-ogc-filter-id-input').checked;

    if (isFiltroPorID === true) {
      properties.id = document.querySelector('#m-layerswitcher-ogc-search-form-ID').value;
    } else if (summary !== undefined) {
      properties.conditional = summary;
    }

    properties.format = 'json';

    return properties;
  }

  /**
   * This function get filters as a dict
   *
   * @function
   * @param formInputs - formInputs
   * @private
   */
  getFiltersDict(formInputs) {
    const formData = {};
    const checkboxes = {};
    formInputs.forEach((inputForm) => {
      const id = inputForm.id;
      const attrName = id.substring(inputForm.id.indexOf('form-') + 5);
      switch (inputForm.type) {
        case 'checkbox':
          // Agrupar los checkboxes por su atributo name
          if (!checkboxes[attrName]) {
            checkboxes[attrName] = [];
          }

          checkboxes[attrName].push(inputForm);
          // if (inputForm.checked !== false) {
          //   formData[attrName] = inputForm.value;
          // }
          break;
        case 'date':
          if (!M.utils.isNullOrEmpty(inputForm.value)) {
            const date = new Date(inputForm.value);
            formData[attrName] = date.toISOString().split('T')[0];
          }
          break;
        default:
          if (!M.utils.isNullOrEmpty(inputForm.value)) {
            // formData[attrName] = encodeURIComponent(inputForm.value);
            formData[attrName] = inputForm.value;
          }
      }
    });

    // Procesar los checkboxes agrupados
    Object.keys(checkboxes).forEach((name) => {
      const checkboxGroup = checkboxes[name];
      const checkedValues = checkboxGroup
        .filter((checkbox) => checkbox.checked).map((checkbox) => checkbox.value);

      if (checkedValues.length === 1) {
        // Si solo hay un checkbox marcado, establecer el valor correspondiente en formData
        formData[name] = checkedValues[0];
      }
    });

    const propsKeysForm = Object.keys(formData);
    const propsValuesForm = Object.values(formData);

    const cDict = {};

    propsKeysForm.forEach((key, i) => {
      cDict[key] = propsValuesForm[i];
    });
    return cDict;
  }

  // Devuelve el número de features de un layer OGCAPI
  getNumberFeaturesOGCAPIFeaturesLayer(layerParameters) {
    const layer = new M.layer.OGCAPIFeatures(layerParameters);
    const url = this.getFeatureUrl(layer);
    let numberFeatures;
    let jsonResponseOgc;
    M.proxy(this.useProxy);
    return M.remote.get(url).then((response) => {
      jsonResponseOgc = JSON.parse(response.text);
      if (jsonResponseOgc !== null) {
        if (jsonResponseOgc.type === 'Feature') {
          numberFeatures = 1;
        } else {
          numberFeatures = jsonResponseOgc.features.length;
        }
      } else {
        numberFeatures = 0;
      }

      return numberFeatures;
    });
  }

  destroy() {
    this.getImpl().destroy();
  }

  /**
   * Gets feature url of features
   * @public
   * @function
   * @api
   */
  getFeatureUrl(layer) {
    const getFeatureParams = {
      // service: 'OGCAPIFeatures',
      // request: 'GetFeature',
      // outputFormat: layer.getFeatureOutputFormat_,
      // describeOutputFormat: layer.getDescribeFeatureType_,
      // srsname: projection.getCode(),
    };
    let fUrl;
    /* eslint-disable no-param-reassign */
    if (!M.utils.isNullOrEmpty(layer.name)) {
      layer.url = `${layer.url}${layer.name}/items`;
    }

    if (!M.utils.isNullOrEmpty(layer.format)) {
      getFeatureParams.f = layer.format;
    }

    if (!M.utils.isNullOrEmpty(layer.id)) {
      layer.url = `${layer.url}${layer.id}?`;
      fUrl = M.utils.addParameters(M.utils
        .addParameters(layer.url, getFeatureParams), layer.getFeatureVendor);
    } else {
      layer.url = `${layer.url}?`;
      /* eslint-enable no-param-reassign */
      if (!M.utils.isNullOrEmpty(layer.limit)) {
        getFeatureParams.limit = layer.limit;
      }

      if (!M.utils.isNullOrEmpty(layer.offset)) {
        getFeatureParams.offset = layer.offset;
      }

      if (!M.utils.isNullOrEmpty(layer.bbox)) {
        getFeatureParams.bbox = layer.bbox;
      }
      fUrl = M.utils.addParameters(M.utils
        .addParameters(layer.url, getFeatureParams), layer.getFeatureVendor);
      if (!M.utils.isNullOrEmpty(layer.conditional)) {
        let text = '';
        Object.keys(layer.conditional).forEach((key) => {
          const param = `&${key}=${layer.conditional[key]}&`;
          text += param;
        });
        getFeatureParams.conditional = text;
        fUrl += getFeatureParams.conditional;
      }
    }
    fUrl = fUrl.replaceAll(' ', '%20');
    return fUrl;
  }

  // CODSI
  addEventCODSI() {
    // Elements
    this.codsiButton = document.querySelector(CODSI_BTN);
    this.codsiFilterButton = document.querySelector(CODSI_FILTER);
    this.codsiSearchInput = document.querySelector(CODSI_SEARCH);
    this.codsiCleanButton = document.querySelector(CODSI_CLEAN);

    if (this.codsiButton !== null) {
      this.codsiButton.addEventListener('click', (e) => this.showCODSI(e));
      this.codsiButton.addEventListener('keydown', (e) => (e.keyCode === 13) && this.showCODSI(e));
      this.codsiFilterButton.addEventListener('click', (e) => {
        this.loadCODSIResults(this.select_codsi);
      });

      this.codsiFilterButton.addEventListener('keydown', (e) => (e.keyCode === 13) && this.loadCODSIResults(this.select_codsi));

      this.codsiSearchInput.addEventListener('keypress', (e) => {
        if (e.keyCode === 13) {
          this.loadCODSIResults(this.select_codsi);
        }
      });

      this.codsiCleanButton.addEventListener('click', (e) => {
        this.codsiSearchInput.value = '';
        this.loadCODSIResults(this.select_codsi);
      });
    }
  }

  loadCODSIResults(pageNumber) {
    const DATA_SUMMARY = '@count';

    const url = this.generateUrlCODSI(pageNumber);
    M.proxy(this.useProxy);
    M.remote.get(url).then((response) => {
      const data = JSON.parse(response.text);
      const total = data.summary[DATA_SUMMARY];

      const results = this.getResultCODSI(data);

      this.renderCODSIResults(results);
      this.renderCODSIPagination(pageNumber, total);
    }).catch((err) => {
      M.dialog.error(getValue('exception.codsi'), undefined, this.order);
    });
    M.proxy(this.statusProxy);
  }

  getResultCODSI(data) {
    const results = [];
    if (data.metadata !== undefined) {
      data.metadata.forEach((m) => {
        const links = this.getLinksCODSIResults(m);
        if (links.length > 0) {
          results.push({
            title: m.title || m.defaultTitle,
            url: links[0].split('?')[0],
          });
        }
      });
    }
    return results;
  }

  generateUrlCODSI(pageNumber) {
    const query = this.codsiSearchInput.value.trim();

    const start = 1 + ((pageNumber - 1) * CODSI_PAGESIZE);
    const end = pageNumber * CODSI_PAGESIZE;

    let url = CODSI_CATALOG.split('*1').join(`${start}`).split('*2').join(`${end}`);
    if (query !== '') {
      url += `&any=${encodeURIComponent(query)}`;
    }
    return url;
  }

  getLinksCODSIResults(data) {
    let links = [];
    if (Array.isArray(data.link)) {
      data.link.forEach((l) => {
        links = links.concat(this.formatLinksCODSIResults(l));
      });
    } else {
      links = links.concat(this.formatLinksCODSIResults(data.link));
    }
    return links;
  }

  formatLinksCODSIResults(link) {
    let parts = [];
    if (link.indexOf('||') > -1) {
      parts = link.split('||').filter((part) => {
        return part.indexOf('http://') > -1 || part.indexOf('https://') > -1;
      });
    } else if (link.indexOf('|') > -1) {
      parts = link.split('|').filter((part) => {
        return part.indexOf('http://') > -1 || part.indexOf('https://') > -1;
      });
    }
    return parts;
  }

  renderCODSIResults(results) {
    // IDs
    const CODSI_RESULTS = '#m-layerswitcher-addservices-codsi-results';

    // Elements
    this.codsiResults = document.querySelector(CODSI_RESULTS);

    this.codsiResults.innerHTML = '';

    if (results.length > 0) {
      const resultsElement = results.map((r) => this.createElementCODSIResults(r));
      resultsElement.forEach((r) => this.codsiResults.appendChild(r));
    } else {
      this.codsiResults.innerHTML = `<div class="codsi-no-results">${getValue('exception.codsi_no_results')}</div>`;
    }
  }

  createElementCODSIResults({ url, title }) {
    const CLASS_SPAN = 'm-layerswitcher-codsi-result';
    const ATTRIBUTE_DATA_URL = 'data-link';

    // create tr and td elements
    const tr = document.createElement('tr');
    const td = document.createElement('td');

    const span = document.createElement('span');
    span.setAttribute('tabindex', '0');
    span.setAttribute('class', CLASS_SPAN);
    span.setAttribute(ATTRIBUTE_DATA_URL, url);
    span.innerHTML = title;

    span.addEventListener('click', (evt) => {
      document.querySelector(SEARCH_INPUT).value = url;

      this.filterName = undefined;
      this.readCapabilities(evt);
    });

    td.appendChild(span);
    tr.appendChild(td);

    return tr;
  }

  paginationCODSI() {
    const container = document.querySelector('#m-layerswitcher-addservices-codsi-pagination');
    // create button element
    const buttonNext = document.createElement('button');
    buttonNext.setAttribute('type', 'button');
    buttonNext.classList.add('m-layerswitcher-addservices-pagination-btn');
    buttonNext.id = 'nextCODSI';
    buttonNext.innerHTML = '...';

    buttonNext.addEventListener('click', (e) => {
      SHOW_BUTTON.forEach((b, i) => {
        SHOW_BUTTON[i] = b + SHOW_BUTTON.length;
      });
      this.showButtonPaginationCODSI(container, SHOW_BUTTON);
    });

    const buttonBack = document.createElement('button');
    buttonBack.setAttribute('type', 'button');
    buttonBack.id = 'backCODSI';
    buttonBack.classList.add('m-layerswitcher-addservices-pagination-btn');
    buttonBack.innerHTML = '...';

    buttonBack.addEventListener('click', (e) => {
      SHOW_BUTTON.forEach((b, i) => {
        SHOW_BUTTON[i] = b - SHOW_BUTTON.length;
      });
      this.showButtonPaginationCODSI(container, SHOW_BUTTON);
    });

    // Add buttons delante y detrar container
    container.insertBefore(buttonBack, container.firstChild);
    container.appendChild(buttonNext);

    this.showButtonPaginationCODSI(container, SHOW_BUTTON);
  }

  showButtonPaginationCODSI(container, showButton) {
    const buttons = container.querySelectorAll('button');
    buttons.forEach((b, i) => {
      if (showButton.indexOf(i) > -1) {
        buttons[i].style.display = 'inline-block';
      } else if (b.id !== 'nextCODSI' && b.id !== 'backCODSI') {
        buttons[i].style.display = 'none';
      }

      // add disable element
      if (i === this.select_codsi) {
        buttons[i].setAttribute('disabled', 'disabled');
      } else {
        // remove disable element
        buttons[i].removeAttribute('disabled');
      }
    });

    if (showButton.indexOf(1) > -1) {
      document.querySelector('#backCODSI').style.display = 'none';
    } else {
      document.querySelector('#backCODSI').style.display = 'inline-block';
    }
    if (showButton.indexOf(buttons.length - 1) > -1) {
      document.querySelector('#nextCODSI').style.display = 'none';
    } else {
      document.querySelector('#nextCODSI').style.display = 'inline-block';
    }
  }

  renderCODSIPagination(pageNumber, total) {
    document.querySelector('#m-layerswitcher-addservices-codsi-pagination').innerHTML = '';
    if (total > 0) {
      const numPages = Math.ceil(total / CODSI_PAGESIZE);
      let buttons = '';
      for (let i = 1; i <= numPages; i += 1) {
        if (i === pageNumber) {
          buttons += `<button type="button" tabindex="0" class="m-layerswitcher-addservices-pagination-btn" disabled>${i}</button>`;
        } else {
          buttons += `<button type="button" tabindex="0" class="m-layerswitcher-addservices-pagination-btn">${i}</button>`;
        }
      }

      document.querySelector('#m-layerswitcher-addservices-codsi-pagination').innerHTML = buttons;
      document.querySelectorAll('#m-layerswitcher-addservices-codsi-pagination button').forEach((elem, index) => {
        elem.addEventListener('click', () => {
          this.select_codsi = index + 1;
          this.loadCODSIResults(index + 1);
        });
      });
    }
    this.paginationCODSI();
  }

  showCODSI() {
    document.querySelector(ADDSERVICES_RESULTS).innerHTML = '';
    document.querySelector(LAYERS_CONTAINER).innerHTML = '';
    document.querySelector(CODSI).style.display = 'block';
    document.querySelector(ADDSERVICES_SUGGESTIONS).style.display = 'none';

    if (document.querySelector('#m-layerswitcher-ogcCContainer') !== null) {
      document.querySelector('#m-layerswitcher-ogcCContainer').style.display = 'none';
    }
    this.loadCODSIResults(this.select_codsi);
  }

  accessibilityTab(html) {
    html.querySelectorAll('[tabindex="0"]').forEach((el) => el.setAttribute('tabindex', this.order));
  }

  /**
   * This function compares controls
   *
   * @public
   * @function
   * @param {M.Control} control to compare
   * @api
   */
  equals(control) {
    return control instanceof LayerswitcherControl;
  }
}
