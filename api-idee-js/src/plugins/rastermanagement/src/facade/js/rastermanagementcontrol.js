/**
 * @module IDEE/control/RasterManagementControl
 */

import RasterManagementImplControl from 'impl/rastermanagementcontrol';
import template from 'templates/rastermanagement';
import StylesControl from './stylescontrol';
import GeoprocessControl from './geoprocesscontrol';
import { getValue } from './i18n/language';

export default class RasterManagementControl extends IDEE.Control {
  /**
   * @classdesc
   * Control padre de gestión raster. Orquesta los controles hijo
   * de Estilos y Geoprocesos.
   *
   * @constructor
   * @extends {IDEE.Control}
   * @api stable
   */
  constructor(values) {
    if (IDEE.utils.isUndefined(RasterManagementImplControl)
      || (IDEE.utils.isObject(RasterManagementImplControl)
      && IDEE.utils.isNullOrEmpty(Object.keys(RasterManagementImplControl)))) {
      IDEE.exception(getValue('exception.impl'));
    }
    const impl = new RasterManagementImplControl();
    super(impl, 'RasterManagement');

    /**
     * Orden del control en el panel
     * @public
     * @type {Number|null}
     */
    this.order = values.order >= -1 ? values.order : null;

    /**
     * URL del servicio WPS calcHistogram
     * @public
     * @type {string}
     */
    this.calcHistogramUrl = values.calcHistogramUrl;

    /**
     * Capas GeoTIFF disponibles en el selector
     * @private
     * @type { Array<{value: string, text: string}> }
     */
    this.layers_ = [];

    /**
     * Capa GeoTIFF seleccionada
     * @public
     * @type { IDEE.layer.GeoTIFF|null }
     */
    this.selectedLayer = null;

    /**
     * Grupos de capas con escuchador ADDED_TO_LAYERGROUP registrado
     * @private
     * @type {Set<string>}
     */
    this.layerGroupListeners_ = new Set();

    /**
     * Escuchadores del mapa ya registrados
     * @private
     * @type {boolean}
     */
    this.mapLayerEventsRegistered_ = false;

    /**
     * Indica si debe refrescarse el selector cuando la plantilla esté lista
     * @private
     * @type {boolean}
     */
    this.pendingLayersRefresh_ = false;

    /**
     * Plantilla principal del control
     * @public
     * @type {HTMLElement|null}
     */
    this.html = null;

    /**
     * Mapa asociado
     * @public
     * @type {IDEE.Map|null}
     */
    this.map = null;
  }

  /**
   * Crea la vista del control padre.
   *
   * @public
   * @function
   * @param {IDEE.Map} map Mapa asociado
   * @api stable
   */
  createView(map) {
    this.map = map;
    this.registerMapLayerEvents_();
    return new Promise((success) => {
      const html = IDEE.template.compileSync(template, {
        vars: {
          title: getValue('title'),
          sections: getValue('sections'),
          stylesSection: getValue('stylesSection'),
          geoprocessSection: getValue('geoprocessSection'),
          selectLayer: getValue('selectLayer'),
          selectLayerDefault: getValue('selectLayerDefault'),
          apply: getValue('apply'),
          clearStyle: getValue('clearStyle'),
          copyStyle: getValue('copyStyle'),
        },
      });
      this.accessibilityTab(html);
      this.html = html;
      this.addStylesControl(html);
      this.addGeoprocessControl(html);
      this.addSectionEvents(html);
      this.addLayerSelectorEvents(html);
      this.stylesControl_.active(html);
      this.refreshLayers();
      success(html);
    });
  }

  /**
   * Registra el control hijo de Estilos.
   *
   * @private
   * @function
   * @param {HTMLElement} html Plantilla principal
   */
  addStylesControl(html) {
    this.stylesControl_ = new StylesControl(this, this.map);
  }

  /**
   * Registra el control hijo de Geoprocesos.
   *
   * @private
   * @function
   * @param {HTMLElement} html Plantilla principal
   */
  addGeoprocessControl(html) {
    this.geoprocessControl_ = new GeoprocessControl(this, this.map);
  }

  /**
   * Añade los eventos de cambio de sección principal (Estilos / Geoprocesos).
   *
   * @private
   * @function
   * @param {HTMLElement} html Plantilla del control
   */
  addSectionEvents(html) {
    const sectionsContainer = html.querySelector('#m-rastermanagement-sections');
    sectionsContainer.addEventListener('click', (evt) => this.toggleSections(evt));
  }

  /**
   * Cambia la sección activa (Estilos / Geoprocesos).
   *
   * @private
   * @function
   * @param {Event} evt Evento de clic en una sección
   */
  toggleSections(evt) {
    evt.stopPropagation();
    let sectionTab = evt.target;
    if (!sectionTab.classList.contains('m-rastermanagement-section-tab')) {
      sectionTab = sectionTab.closest('.m-rastermanagement-section-tab');
    }
    if (!sectionTab) {
      return;
    }

    const sectionTabs = sectionTab.parentNode.children;
    for (let i = 0; i < sectionTabs.length; i += 1) {
      const child = sectionTabs.item(i);
      child.classList.remove('active');
      child.setAttribute('aria-selected', 'false');
    }
    sectionTab.classList.add('active');
    sectionTab.setAttribute('aria-selected', 'true');

    const isStylesSection = sectionTab.id === 'm-rastermanagement-styles-section-tab';
    if (isStylesSection) {
      this.deactive(this.html, 'styles');
      this.stylesControl_.active(this.html);
    } else {
      this.deactive(this.html, 'geoprocess');
      this.geoprocessControl_.active(this.html);
    }
  }

  /**
   * Desactiva el control hijo que no corresponde a la sección activa.
   *
   * @private
   * @function
   * @param {HTMLElement} html Plantilla principal
   * @param {string} activeSection Sección que permanece activa ('styles'|'geoprocess')
   */
  deactive(html, activeSection) {
    if (activeSection !== 'styles' && this.stylesControl_) {
      this.stylesControl_.deactive();
    }
    if (activeSection !== 'geoprocess' && this.geoprocessControl_) {
      this.geoprocessControl_.deactive();
    }
  }

  /**
   * Indica si la sección de estilos está activa.
   *
   * @public
   * @function
   * @returns {boolean}
   */
  isStylesSectionActive() {
    const tab = this.html.querySelector('#m-rastermanagement-styles-section-tab');
    return tab.classList.contains('active');
  }

  /**
   * Añade eventos del selector de capa y botones de estilo.
   *
   * @private
   * @function
   * @param {HTMLElement} html Plantilla del control
   */
  addLayerSelectorEvents(html) {
    const selector = html.querySelector('#m-rastermanagement-selectionlayer');
    const selectBtn = html.querySelector('#m-rastermanagement-selectionlayer-btn');
    const selectList = html.querySelector('#m-rastermanagement-selectionlayer-list');
    const applyBtn = html.querySelector('#m-rastermanagement-apply');
    const clearBtn = html.querySelector('#m-rastermanagement-clear');
    const copyBtn = html.querySelector('#m-rastermanagement-copy');

    selectBtn.addEventListener('click', (evt) => {
      evt.stopPropagation();
      selectList.classList.toggle('hidden');
    });
    selectList.addEventListener('click', (evt) => {
      const option = evt.target.closest('li[data-value]');
      if (!option) {
        return;
      }
      selector.value = option.dataset.value;
      selectList.classList.add('hidden');
      this.updateLayerSelectLabel_();
      this.selectLayerEvent();
    });
    document.addEventListener('click', () => {
      selectList.classList.add('hidden');
    });

    selector.addEventListener('change', () => this.selectLayerEvent());
    applyBtn.addEventListener('click', () => this.stylesControl_.applyStyle());
    clearBtn.addEventListener('click', () => this.stylesControl_.clearStyle());
    copyBtn.addEventListener('click', () => this.stylesControl_.copySerializedStyle());
    this.registerLayerGroupListeners_(this.map.getLayerGroup());
    if (this.pendingLayersRefresh_) {
      this.pendingLayersRefresh_ = false;
      this.refreshLayers();
    }
  }

  /**
   * Registra escuchadores del mapa para GeoTIFF y grupos de capas.
   *
   * @private
   * @function
   */
  registerMapLayerEvents_() {
    if (this.mapLayerEventsRegistered_ || IDEE.utils.isNullOrEmpty(this.map)) {
      return;
    }
    this.mapLayerEventsRegistered_ = true;
    this.map.on(IDEE.evt.ADDED_GEOTIFF, () => {
      this.refreshLayers();
    });
    this.map.on(IDEE.evt.ADDED_LAYERGROUP, (groups) => {
      this.registerLayerGroupListeners_(groups);
    });
    this.map.on(IDEE.evt.REMOVED_LAYER, () => {
      this.refreshLayers();
    });
  }

  /**
   * Obtiene las capas GeoTIFF visibles en el mapa.
   *
   * @public
   * @function
   * @returns {Array<IDEE.layer.GeoTIFF>}
   */
  getGeoTIFFLayers() {
    const geotiffLayers = this.map.getGeoTIFF().slice();
    const collectFromGroup = (group) => {
      group.getLayers().forEach((layer) => {
        if (layer.type === 'GeoTIFF') {
          if (!geotiffLayers.includes(layer)) {
            geotiffLayers.push(layer);
          }
        } else if (layer.type === 'LayerGroup') {
          collectFromGroup(layer);
        }
      });
    };
    this.map.getImpl().getLayerGroups().forEach((group) => {
      collectFromGroup(group);
    });
    return geotiffLayers;
  }

  /**
   * Registra escuchadores en grupos de capas para detectar capas añadidas dinámicamente.
   *
   * @private
   * @function
   * @param {Array<IDEE.layer.LayerGroup>|IDEE.layer.LayerGroup} groups Grupos a registrar
   */
  registerLayerGroupListeners_(groups) {
    let arrGroups = groups;
    if (IDEE.utils.isNullOrEmpty(arrGroups)) {
      return;
    }
    if (!Array.isArray(arrGroups)) {
      arrGroups = [arrGroups];
    }
    arrGroups.forEach((layer) => {
      if (layer.type === 'LayerGroup') {
        this.registerLayerGroupListener_(layer);
        layer.getLayers().forEach((child) => {
          if (child.type === 'LayerGroup') {
            this.registerLayerGroupListeners_(child);
          }
        });
      }
    });
  }

  /**
   * Registra el escuchador ADDED_TO_LAYERGROUP en un grupo concreto.
   *
   * @private
   * @function
   * @param {IDEE.layer.LayerGroup} group Grupo de capas
   */
  registerLayerGroupListener_(group) {
    if (this.layerGroupListeners_.has(group.idLayer)) {
      return;
    }
    this.layerGroupListeners_.add(group.idLayer);
    group.on(IDEE.evt.ADDED_TO_LAYERGROUP, (addedLayer) => {
      if (addedLayer.type === 'LayerGroup') {
        this.registerLayerGroupListeners_(addedLayer);
      }
      this.refreshLayers();
    });
  }

  /**
   * Actualiza el listado de capas GeoTIFF del selector.
   *
   * @public
   * @function
   * @api stable
   */
  refreshLayers() {
    if (IDEE.utils.isNullOrEmpty(this.html)) {
      this.pendingLayersRefresh_ = true;
      return;
    }
    const geotiffLayers = this.getGeoTIFFLayers();
    this.layers_ = geotiffLayers.map((layer) => {
      let text = layer.idLayer;
      if (layer.legend) {
        text = layer.legend;
      }
      return {
        value: layer.idLayer,
        text,
      };
    });

    const selector = this.html.querySelector('#m-rastermanagement-selectionlayer');
    const selectedLayerId = selector.value;
    let layerExists = false;
    for (let i = 0; i < this.layers_.length; i += 1) {
      if (this.layers_[i].value === selectedLayerId) {
        layerExists = true;
        break;
      }
    }

    const length = selector.children.length;
    for (let i = 0; i < length; i += 1) {
      selector.children[0].remove();
    }

    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.selected = !layerExists;
    defaultOption.disabled = true;
    defaultOption.innerText = `${getValue('selectLayerDefault')}...`;
    selector.appendChild(defaultOption);

    this.layers_.forEach((layer) => {
      const option = document.createElement('option');
      option.value = layer.value;
      option.innerText = layer.text;
      option.selected = layer.value === selectedLayerId;
      selector.appendChild(option);
    });

    if (!layerExists) {
      this.selectedLayer = null;
      selector.value = '';
    }
    this.renderLayerSelectOptions_();
    if (this.stylesControl_) {
      this.stylesControl_.updateEditorVisibility();
    }
    if (this.geoprocessControl_) {
      this.geoprocessControl_.onLayerSelected();
    }
  }

  /**
   * Actualiza el listado visual del selector de capas.
   *
   * @private
   * @function
   */
  renderLayerSelectOptions_() {
    const selector = this.html.querySelector('#m-rastermanagement-selectionlayer');
    const list = this.html.querySelector('#m-rastermanagement-selectionlayer-list');
    list.innerHTML = '';
    list.classList.add('hidden');

    this.layers_.forEach((layer) => {
      const item = document.createElement('li');
      item.dataset.value = layer.value;
      item.innerText = layer.text;
      item.title = layer.text;
      if (layer.value === selector.value) {
        item.classList.add('is-selected');
      }
      list.appendChild(item);
    });
    this.updateLayerSelectLabel_();
  }

  /**
   * Actualiza la etiqueta visible del selector de capas.
   *
   * @private
   * @function
   */
  updateLayerSelectLabel_() {
    const selector = this.html.querySelector('#m-rastermanagement-selectionlayer');
    const label = this.html.querySelector('#m-rastermanagement-selectionlayer-label');
    const btn = this.html.querySelector('#m-rastermanagement-selectionlayer-btn');
    let text = `${getValue('selectLayerDefault')}...`;
    if (!IDEE.utils.isNullOrEmpty(selector.value) && selector.selectedOptions.length > 0) {
      text = selector.selectedOptions[0].text;
    }
    label.innerText = text;
    label.title = text;
    btn.title = text;
  }

  /**
   * Gestiona la selección de una capa GeoTIFF en el selector.
   *
   * @public
   * @function
   * @api stable
   */
  selectLayerEvent() {
    const selector = this.html.querySelector('#m-rastermanagement-selectionlayer');
    const selectedLayerId = selector.value;
    const geotiffLayers = this.getGeoTIFFLayers();
    this.selectedLayer = null;
    for (let i = 0; i < geotiffLayers.length; i += 1) {
      if (geotiffLayers[i].idLayer === selectedLayerId) {
        this.selectedLayer = geotiffLayers[i];
        break;
      }
    }
    if (this.stylesControl_) {
      this.stylesControl_.onLayerSelected();
    }
    if (this.geoprocessControl_) {
      this.geoprocessControl_.onLayerSelected();
    }
  }

  /**
   * Compara controles.
   *
   * @public
   * @function
   * @param {IDEE.Control} control Control a comparar
   * @api stable
   */
  equals(control) {
    return control instanceof RasterManagementControl;
  }

  /**
   * Ajusta tabindex para accesibilidad.
   *
   * @public
   * @function
   * @param {HTMLElement} html Plantilla del control
   */
  accessibilityTab(html) {
    html.querySelectorAll('[tabindex="0"]').forEach((el) => el.setAttribute('tabindex', this.order));
  }

  /**
   * Destruye los controles hijo.
   *
   * @public
   * @function
   * @api stable
   */
  destroy() {
    if (this.stylesControl_) {
      this.stylesControl_.destroy();
    }
    if (this.geoprocessControl_) {
      this.geoprocessControl_.destroy();
    }
  }
}
