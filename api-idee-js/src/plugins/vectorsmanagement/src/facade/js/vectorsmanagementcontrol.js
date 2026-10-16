/**
 * @module IDEE/control/VectorsManagementControl
 */

import template from '../../templates/vectorsmanagement';
import { getValue } from './i18n/language';
import SelectionControl from './selectioncontrol';
import AddLayerControl from './addlayercontrol';
import AnalysisControl from './analysiscontrol';
import CreationControl from './creationcontrol';
import DownloadControl from './downloadcontrol';
import EditionControl from './editioncontrol';
import HelpControl from './helpcontrol';
import StyleControl from './stylecontrol';
import DataIDEEEditingSession from './dataideeeditingsession';

/**
 * @classdesc
 * Vector layers management api-idee control.
 * This control can create vector layers, draw and edit features, edit styles,
 * calculate topographic profiles and buffers, and download a layer or feature.
 */
export default class VectorsManagementControl extends IDEE.Control {
  get layerSelectorWrapper() {
    return this.html.querySelector('#m-vectorsmanagement-layer-selector');
  }

  get layerSelectorSelectedOption() {
    return this.layerSelectorWrapper.querySelector('#m-vectorsmanagement-layer-selected');
  }

  get layerSelectorOptionsContainer() {
    return this.layerSelectorWrapper.querySelector('#m-vectorsmanagement-layer-selector-options');
  }

  /**
   * @classdesc
   * Main constructor of the class. Creates a PluginControl
   * control
   *
   * @constructor
   * @extends {IDEE.Control}
   * @api stable
   */
  constructor({
    map, selection, addlayer, analysis, creation, download, edition, help, style, order,
  }) {
    const impl = new IDEE.impl.Control();
    super('VectorsManagement', impl, {});

    const allLayers = map.getLayers().concat(map.getImpl().getAllLayerInGroup());

    this.selection_ = selection;
    this.addlayer_ = addlayer;
    this.analysis_ = analysis;
    this.creation_ = creation;
    this.download_ = download;
    this.edition_ = edition;
    this.help_ = help;
    this.style_ = style;
    this.layers_ = allLayers.filter((l) => (l instanceof IDEE.layer.Vector
        || l instanceof IDEE.layer.GenericVector) && l.displayInLayerSwitcher).map((l) => {
      return { value: l.idLayer, text: l.legend || l.idLayer, zIndex: l.getZIndex() };
    }).sort((a, b) => b.zIndex - a.zIndex);
    this.selectedLayer = null;

    // Determina si el plugin es draggable o no
    this.isDraggable_ = false;

    // order
    this.order = order;
  }

  /**
   * This function creates the view
   *
   * @public
   * @function
   * @param {IDEE.Map} map to add the control
   * @api stable
   */
  createView(map) {
    this.map_ = map;
    return new Promise((success, fail) => {
      const html = IDEE.template.compileSync(template, {
        vars: {
          selection: this.selection_,
          addlayer: this.addlayer_,
          analysis: this.analysis_,
          creation: this.creation_,
          download: this.download_,
          edition: !!(this.edition_ instanceof Object || this.edition_ === true),
          help: this.help_,
          style: this.style_,
          layer: this.layers_,
          translations: {
            headertitle: getValue('tooltip'),
            analysis: getValue('analysis'),
            creation: getValue('creation'),
            download: getValue('download'),
            edition: getValue('edition'),
            help: getValue('help'),
            selection: getValue('selection'),
            style: getValue('style'),
            selectLayerDefault: getValue('selectLayerDefault'),
            dataidee_edit: getValue('dataidee_edit'),
            dataidee_start: getValue('dataidee_start'),
            dataidee_save: getValue('dataidee_save'),
            dataidee_discard: getValue('dataidee_discard'),
            dataidee_end: getValue('dataidee_end'),
          },
        },
      });
      this.html = html;
      this.initializeDataIDEEEditing(html);

      if (this.selection_) { this.addSelectionControl(html); }

      if (this.addlayer_) { this.addAddLayerControl(html); }

      if (this.analysis_) { this.addAnalysisControl(html); }

      if (this.creation_) { this.addCreationControl(html); }

      if (this.download_) { this.addDownloadControl(html); }

      if (this.edition_) { this.addEditionControl(html); }

      if (this.help_) { this.addHelpControl(html); }

      if (this.style_) { this.addStyleControl(html); }

      this.initLayerSelect();

      this.map_.on(IDEE.evt.ADDED_LAYER, this.refreshLayers.bind(this));
      this.map_.on(IDEE.evt.REMOVED_LAYER, this.refreshLayers.bind(this));

      if (this.isDraggable_) {
        setTimeout(() => {
          const panel = this.getPanel();
          if (panel) {
            IDEE.utils.draggabillyPlugin(panel, '#m-vectorsmanagement-titulo');
          } else {
            /* eslint-disable-next-line no-console */
            console.warn('VectorsManagement: No se pudo activar draggabilly porque el panel es null');
          }
        }, 500);
      }
      this.accessibilityTab(html);
      success(html);
    });
  }

  getAllLayers() {
    return this.map_.getLayers().concat(this.map_.getImpl().getAllLayerInGroup());
  }

  initLayerSelect() {
    this.layerSelectorWrapper.setAttribute('tabindex', '0');

    this.layerSelectorWrapper.addEventListener('click', (event) => {
      const isOpen = !this.layerSelectorOptionsContainer.classList.contains('closed');
      if (isOpen && this.layerSelectorOptionsContainer.children.length > 0) {
        this.layerSelectorOptionsContainer.classList.remove('flex');
        this.layerSelectorOptionsContainer.classList.add('closed');
        this.layerSelectorWrapper.classList.replace('vectorsmanagement-icon-selector-arrow-up', 'vectorsmanagement-icon-selector-arrow-down');
      } else {
        this.layerSelectorOptionsContainer.classList.remove('closed');
        this.layerSelectorOptionsContainer.classList.add('flex');
        this.layerSelectorWrapper.classList.replace('vectorsmanagement-icon-selector-arrow-down', 'vectorsmanagement-icon-selector-arrow-up');
      }
      this.layerSelectorWrapper.focus();
    });

    this.layerSelectorWrapper.addEventListener('selectLayer', (event) => {
      const { selected } = event.detail;
      if (this.dataIDEEPreparing_
        && selected.dataset.value !== this.selectedLayer?.idLayer) {
        this.dataIDEEStatus_.textContent = getValue('dataidee_prepare_wait');
        return;
      }
      if (this.dataIDEEEditingSession_
        && selected.dataset.value !== this.selectedLayer?.idLayer) {
        this.requestEndDataIDEEEditing().then((canSwitch) => {
          if (canSwitch) {
            this.layerSelectorWrapper.dispatchEvent(new CustomEvent('selectLayer', {
              detail: { selected },
            }));
          }
        });
        return;
      }
      this.selectLayerEvent.bind(this);
      const selectionLayer = this.layerSelectorSelectedOption;
      selectionLayer.dataset.value = selected.dataset.value;
      selectionLayer.textContent = selected.textContent;
      selectionLayer.title = selected.textContent;

      // eslint-disable-next-line no-plusplus
      for (let i = 0; i < this.layerSelectorOptionsContainer.children.length; i++) {
        const option = this.layerSelectorOptionsContainer.children[i];
        option.selected = option.dataset.value === selected.dataset.value;
        if (option.selected) {
          option.classList.add('selected');
        } else {
          option.classList.remove('selected');
        }
      }

      this.selectLayerEvent();
    });

    this.layerSelectorWrapper.addEventListener('blur', () => this.closeLayerSelect());
    this.handleDocumentClick = (e) => {
      if (!this.layerSelectorWrapper.contains(e.target)) this.closeLayerSelect();
    };
    document.addEventListener('click', this.handleDocumentClick);

    this.refreshLayers();
  }

  closeLayerSelect() {
    if (this.layerSelectorOptionsContainer) {
      this.layerSelectorOptionsContainer.classList.remove('flex');
      this.layerSelectorOptionsContainer.classList.add('closed');
      this.layerSelectorWrapper.classList.remove('vectorsmanagement-icon-selector-arrow-up');
      this.layerSelectorWrapper.classList.add('vectorsmanagement-icon-selector-arrow-down');
    }
  }

  /**
   * This function manage the selection of a layer in selector.
   *
   * @public
   * @function
   * @api stable
   */
  selectLayerEvent() {
    // eslint-disable-next-line no-underscore-dangle
    if (this.selectionControl && this.selectionControl.selectedFeatures_.length > 0) {
      document.querySelector('#m-vectorsmanagement-selection').classList.remove('activated');
      this.selectionControl.deactivate();
    }

    if (this.editionControl && this.editionControl.isActivated()) {
      document.querySelector('#m-vectorsmanagement-edition').classList.remove('activated');
      this.editionControl.deactivate();
    }

    this.html.querySelector('#m-vectorsmanagement-previews').classList.remove('closed');
    const selector = this.html.querySelector('#m-vectorsmanagement-layer-selected');
    const selectedLayerId = selector.dataset.value;

    const allLayers = this.map_.getLayers().concat(this.map_.getImpl().getAllLayerInGroup());
    this.selectedLayer = allLayers.filter((l) => l.idLayer === selectedLayerId)[0];
    if (!this.selectedLayer) return;

    if (this.selectedLayer.type === 'MVT' || this.selectedLayer.type === 'MBTilesVector') {
      IDEE.toast.warning(getValue('exception.typeLayer'), null, 6000);
    }

    if (this.selection_) {
      this.selectionControl.setLayer(this.selectedLayer);
    }
    if (this.creation_) {
      this.creationControl.setLayer(this.selectedLayer);
    }
    if (this.edition_) {
      this.editionControl.setLayer(this.selectedLayer);
    }
    if (this.style_) {
      this.styleControl.setLayer(this.selectedLayer);
    }
    if (this.analysis_) {
      this.analysisControl.setLayer(this.selectedLayer);
    }
    if (this.download_) {
      this.downloadControl.setLayer(this.selectedLayer);
    }
    this.updateDataIDEEEditingAvailability();
  }

  initializeDataIDEEEditing(html) {
    this.dataIDEEPanel_ = html.querySelector('#m-vectorsmanagement-dataidee-editing');
    this.dataIDEEStatus_ = html.querySelector('#m-vectorsmanagement-dataidee-status');
    html.querySelector('#m-vectorsmanagement-dataidee-start').addEventListener('click', () => this.startDataIDEEEditing());
    html.querySelector('#m-vectorsmanagement-dataidee-save').addEventListener('click', () => this.saveDataIDEEChanges());
    html.querySelector('#m-vectorsmanagement-dataidee-discard').addEventListener('click', () => this.discardDataIDEEChanges());
    html.querySelector('#m-vectorsmanagement-dataidee-end').addEventListener('click', () => this.requestEndDataIDEEEditing());
  }

  updateDataIDEEEditingAvailability() {
    const isDataIDEE = this.selectedLayer?.type === 'DataIDEE'
      && this.map_.getImplementation() === 'ol';
    this.dataIDEEPanel_.hidden = !isDataIDEE;
    const isEditable = !isDataIDEE || Boolean(this.dataIDEEEditingSession_);
    ['creation', 'edition'].forEach((id) => {
      const button = this.html.querySelector(`#m-vectorsmanagement-${id}`);
      if (button) button.disabled = !isEditable;
    });
    const creationTemplate = this.creationControl?.template;
    if (creationTemplate) {
      creationTemplate.querySelectorAll('button').forEach((button) => {
        button.toggleAttribute('disabled', isDataIDEE
          && (!this.dataIDEEEditingSession_ || !this.dataIDEECapabilities_?.create));
      });
      const textButton = creationTemplate.querySelector('#textdrawing');
      if (textButton) textButton.disabled = isDataIDEE || !isEditable;
      ['multipointdrawing', 'multilinedrawing', 'multipolygondrawing', 'finishmultipledrawing']
        .forEach((id) => {
          const button = creationTemplate.querySelector(`#${id}`);
          if (button) {
            button.hidden = !isDataIDEE || !this.dataIDEEEditingSession_;
            button.disabled = isDataIDEE
              && (!this.dataIDEEEditingSession_ || !this.dataIDEECapabilities_?.create);
          }
        });
    }
    const editionTemplate = this.editionControl?.template;
    if (editionTemplate) {
      editionTemplate.querySelectorAll('button').forEach((button) => {
        button.toggleAttribute('disabled', isDataIDEE && !this.dataIDEEEditingSession_);
      });
      const updateAllowed = !isDataIDEE || Boolean(
        this.dataIDEEEditingSession_ && this.dataIDEECapabilities_?.update,
      );
      ['edit', 'holedrawing', 'rotatedrawing', 'scaledrawing', 'movedrawing']
        .forEach((id) => {
          const button = editionTemplate.querySelector(`#${id}`);
          if (button) button.disabled = !updateAllowed;
        });
      ['cleanAll', 'm-vectorsmanagement-deletegeom-btn'].forEach((id) => {
        const button = editionTemplate.querySelector(`#${id}`);
        if (button) {
          button.disabled = isDataIDEE
            && (!this.dataIDEEEditingSession_ || !this.dataIDEECapabilities_?.delete);
        }
      });
      const attributes = editionTemplate.querySelector('#editattribute');
      if (attributes) attributes.hidden = isDataIDEE;
    }
    if (!isDataIDEE || this.dataIDEEEditingSession_) return;
    this.selectedLayer.getEditingCapabilities().then((capabilities) => {
      this.dataIDEEPanel_.querySelector('#m-vectorsmanagement-dataidee-start').disabled = !(
        capabilities.create || capabilities.update || capabilities.delete
      );
      this.dataIDEECapabilities_ = capabilities;
    }).catch(() => {
      this.dataIDEEPanel_.querySelector('#m-vectorsmanagement-dataidee-start').disabled = true;
      this.dataIDEEStatus_.textContent = getValue('dataidee_capability_error');
    });
  }

  async startDataIDEEEditing() {
    if (this.dataIDEEPreparing_) return;
    this.dataIDEEPreparing_ = true;
    let prepared = null;
    const targetLayer = this.selectedLayer;
    try {
      const nativeMap = this.map_.getMapImpl();
      const size = nativeMap.getSize();
      const view = nativeMap.getView();
      const bbox = ol.proj.transformExtent(view.calculateExtent(size), view.getProjection(), 'EPSG:4326');
      prepared = await targetLayer.beginEditing({ bbox });
      const format = new ol.format.GeoJSON();
      this.dataIDEEEditingSession_ = new DataIDEEEditingSession(targetLayer, {
        ...prepared, format, projection: view.getProjection(),
      });
      this.dataIDEECapabilities_ = prepared.capabilities;
      this.dataIDEESource_ = targetLayer.getImpl().getLayer().getSource();
      this.dataIDEEAddListener_ = (event) => this.recordDataIDEEFeature(event.feature, true);
      this.dataIDEERemoveListener_ = (event) => this.dataIDEEEditingSession_?.remove(event.feature);
      this.dataIDEEClearListener_ = (event) => {
        (event.features || []).forEach((feature) => this.dataIDEEEditingSession_?.remove(feature));
      };
      this.dataIDEESource_.on('addfeature', this.dataIDEEAddListener_);
      this.dataIDEESource_.on('removefeature', this.dataIDEERemoveListener_);
      this.dataIDEESource_.on('clear', this.dataIDEEClearListener_);
      this.addDataIDEEBoundary_(nativeMap, bbox, view.getProjection());
      this.dataIDEEStatus_.textContent = getValue('dataidee_fixed_area')
        .replace('{count}', String(prepared.features.length));
      this.toggleDataIDEEActions(true);
      this.updateDataIDEEEditingAvailability();
    } catch (error) {
      if (this.dataIDEEEditingSession_) this.finishDataIDEEEditing();
      else if (prepared) targetLayer.endEditing();
      this.dataIDEEStatus_.textContent = error.message;
    } finally {
      this.dataIDEEPreparing_ = false;
    }
  }

  toggleDataIDEEActions(active) {
    this.dataIDEEPanel_.querySelector('#m-vectorsmanagement-dataidee-start').hidden = active;
    ['save', 'discard', 'end'].forEach((name) => {
      this.dataIDEEPanel_.querySelector(`#m-vectorsmanagement-dataidee-${name}`).hidden = !active;
    });
  }

  async saveDataIDEEChanges() {
    if (!this.dataIDEEEditingSession_) return;
    try {
      const result = await this.dataIDEEEditingSession_.save();
      this.dataIDEEStatus_.textContent = getValue('dataidee_save_done')
        .replace('{completed}', String(result.completed.length))
        .replace('{pending}', String(result.pending));
    } catch (error) {
      this.dataIDEEStatus_.textContent = getValue('dataidee_save_error')
        .replace('{error}', error.message);
      if (this.dataIDEEEditingSession_?.requiresReview) {
        this.dataIDEEPanel_.querySelector('#m-vectorsmanagement-dataidee-save').disabled = true;
      }
    }
  }

  discardDataIDEEChanges() {
    if (!this.dataIDEEEditingSession_) return;
    const count = this.dataIDEEEditingSession_.count;
    const requiresReview = this.dataIDEEEditingSession_.requiresReview;
    this.dataIDEEEditingSession_.discard();
    this.dataIDEEPanel_.querySelector('#m-vectorsmanagement-dataidee-save').disabled = requiresReview;
    this.dataIDEEStatus_.textContent = getValue(requiresReview
      ? 'dataidee_discarded_uncertain' : 'dataidee_discarded')
      .replace('{count}', String(count));
  }

  async requestEndDataIDEEEditing() {
    if (!this.dataIDEEEditingSession_) return true;
    if (this.dataIDEEEditingSession_.count > 0) {
      // Native prompt provides save, discard and cancel without a second UI dependency.
      // eslint-disable-next-line no-alert
      const choice = window.prompt(getValue('dataidee_end_prompt'))?.trim().toLowerCase();
      if (choice === 'guardar' || choice === 'save' || choice === 'desar') {
        await this.saveDataIDEEChanges();
        if (this.dataIDEEEditingSession_?.count > 0) return false;
      } else if (choice === 'descartar' || choice === 'discard') this.discardDataIDEEChanges();
      else return false;
    }
    this.finishDataIDEEEditing();
    return true;
  }

  finishDataIDEEEditing(refresh = true) {
    if (!this.dataIDEEEditingSession_) return;
    this.dataIDEESource_?.un('addfeature', this.dataIDEEAddListener_);
    this.dataIDEESource_?.un('removefeature', this.dataIDEERemoveListener_);
    this.dataIDEESource_?.un('clear', this.dataIDEEClearListener_);
    this.dataIDEEEditingSession_ = null;
    this.selectedLayer.endEditing(refresh);
    if (this.dataIDEEBoundary_) this.map_.getMapImpl().removeLayer(this.dataIDEEBoundary_);
    this.dataIDEEBoundary_ = null;
    this.toggleDataIDEEActions(false);
    this.updateDataIDEEEditingAvailability();
    this.dataIDEEStatus_.textContent = '';
  }

  recordDataIDEEFeature(feature, isNew = false) {
    if (!this.dataIDEEEditingSession_ || !feature) return;
    try {
      const count = this.dataIDEEEditingSession_.record(feature);
      this.dataIDEEStatus_.textContent = `Zona fija. Cambios pendientes: ${count}.`;
    } catch (error) {
      if (isNew) this.dataIDEESource_.removeFeature(feature);
      this.dataIDEEStatus_.textContent = error.message;
    }
  }

  recordDataIDEERemovals(features) {
    if (!this.dataIDEEEditingSession_ || !this.dataIDEESource_) return;
    const candidates = this.dataIDEESource_.getFeatures();
    features.forEach((feature) => {
      const id = feature.getId?.();
      const nativeFeature = candidates.find((candidate) => candidate.getId() === id);
      if (nativeFeature) this.dataIDEEEditingSession_.remove(nativeFeature);
    });
    this.dataIDEEStatus_.textContent = `Zona fija. Cambios pendientes: ${this.dataIDEEEditingSession_.count}.`;
  }

  addDataIDEEBoundary_(nativeMap, bbox, projection) {
    const extent = ol.proj.transformExtent(bbox, 'EPSG:4326', projection);
    const feature = new ol.Feature(ol.geom.Polygon.fromExtent(extent));
    this.dataIDEEBoundary_ = new ol.layer.Vector({
      source: new ol.source.Vector({ features: [feature] }),
      style: new ol.style.Style({
        fill: new ol.style.Fill({ color: 'rgba(0, 0, 0, 0)' }),
        stroke: new ol.style.Stroke({ color: '#e67e22', width: 2, lineDash: [8, 5] }),
      }),
    });
    this.dataIDEEBoundary_.setZIndex(20000);
    nativeMap.addLayer(this.dataIDEEBoundary_);
  }

  /**
   * This function create the selection control.
   *
   * @public
   * @function
   * @param {Node} html plugin template
   * @api stable
   */
  addSelectionControl(html) {
    this.selectionControl = new SelectionControl(this.map_, this);
    html.querySelector('#m-vectorsmanagement-selection').addEventListener('click', (event) => {
      const clickActivate = event.target.classList.contains('activated');
      if (!clickActivate) {
        this.selectionControl.active(html);
        event.target.classList.add('activated');
        this.creationControl.deactivate();
        document.querySelector('#m-vectorsmanagement-creation').classList.remove('activated');
      } else {
        this.selectionControl.deactivate();
        event.target.classList.remove('activated');
      }
    });
  }

  /**
   * This function create addlayer control.
   *
   * @public
   * @function
   * @param {Node} html plugin template
   * @api stable
   */
  addAddLayerControl(html) {
    this.addLayerControl = new AddLayerControl(this.map_);
    html.querySelector('#layerdrawing').addEventListener('click', (event) => {
      const clickActivate = this.deactive(html, 'addlayer');
      if (!clickActivate) {
        event.target.classList.add('activated');
        this.addLayerControl.active(html);
      }
    });
  }

  /**
   * This function create analysis control.
   *
   * @public
   * @function
   * @param {Node} html plugin template
   * @api stable
   */
  addAnalysisControl(html) {
    this.analysisControl = new AnalysisControl(this.map_, this);
    html.querySelector('#m-vectorsmanagement-analysis').addEventListener('click', (event) => {
      const clickActivate = this.deactive(html, 'analysis');
      if (!clickActivate) {
        this.analysisControl.active(html);
        event.target.classList.add('activated');
      }
    });
  }

  /**
   * This function create creation control.
   *
   * @public
   * @function
   * @param {Node} html plugin template
   * @api stable
   */
  addCreationControl(html) {
    this.creationControl = new CreationControl(this.map_, this);
    html.querySelector('#m-vectorsmanagement-creation').addEventListener('click', (event) => {
      const clickActivate = this.deactive(html, 'creation');
      if (!clickActivate) {
        this.creationControl.active(html);
        event.target.classList.add('activated');
        if (this.selectionControl) {
          this.selectionControl.deactivate();
          document.querySelector('#m-vectorsmanagement-selection').classList.remove('activated');
        }
      }
    });
  }

  /**
   * This function create download control.
   *
   * @public
   * @function
   * @param {Node} html plugin template
   * @api stable
   */
  addDownloadControl(html) {
    this.downloadControl = new DownloadControl(this.map_, this);
    html.querySelector('#m-vectorsmanagement-download').addEventListener('click', (event) => {
      const clickActivate = this.deactive(html, 'download');
      if (!clickActivate) {
        if (this.selectedLayer.getFeatures().length > 0) {
          this.downloadControl.active(html);
          event.target.classList.add('activated');
        } else {
          IDEE.dialog.info(getValue('exception.emptylayer'));
        }
      }
    });
  }

  /**
   * This function create edition control.
   *
   * @public
   * @function
   * @param {Node} html plugin template
   * @api stable
   */
  addEditionControl(html) {
    this.editionControl = new EditionControl(this.map_, this);
    html.querySelector('#m-vectorsmanagement-edition').addEventListener('click', (event) => {
      const $selection = document.querySelector('#m-vectorsmanagement-selection');

      if (this.selectionControl && $selection.classList.contains('activated')) {
        this.selectionControl.deactivate();
        $selection.classList.remove('activated');
      }

      const clickActivate = this.deactive(html, 'edition');

      if (!clickActivate) {
        this.editionControl.active(html);
        if (this.selectionControl) {
          this.selectionControl.active(html);
          $selection.classList.add('activated');
        }
        event.target.classList.add('activated');
      }
    });
  }

  /**
   * This function create help control.
   *
   * @public
   * @function
   * @param {Node} html plugin template
   * @api stable
   */
  addHelpControl(html) {
    this.helpControl = new HelpControl(this.map_, this);
    html.querySelector('#m-vectorsmanagement-help').addEventListener('click', (event) => {
      const clickActivate = this.deactive(html, 'help');
      if (!clickActivate) {
        this.helpControl.active(html);
        event.target.classList.add('activated');
      }
    });
  }

  /**
   * This function create style control.
   *
   * @public
   * @function
   * @param {Node} html plugin template
   * @api stable
   */
  addStyleControl(html) {
    this.styleControl = new StyleControl(this.map_, this);
    html.querySelector('#m-vectorsmanagement-style').addEventListener('click', (event) => {
      const clickActivate = this.deactive(html, 'style');
      if (!clickActivate) {
        this.styleControl.active(html);
        event.target.classList.add('activated');
      }
    });
  }

  /**
   * This function deactivates the activated control
   * before activating another
   *
   * @public
   * @function
   * @param {Node} html
   * @param {String} control
   * @api
   */
  deactive(html, control) {
    const active = this.getControlActive(html);
    let clickActivate = false;
    if (!active) {
      return clickActivate;
    }

    if (active) {
      if (active.id === `m-vectorsmanagement-${control}`) {
        clickActivate = true;
      }
      if (active.id === 'layerdrawing') {
        this.addLayerControl.deactivate();
      } else if (active.id === 'm-vectorsmanagement-analysis') {
        this.analysisControl.deactivate();
      } else if (active.id === 'm-vectorsmanagement-creation') {
        this.creationControl.deactivate();
      } else if (active.id === 'm-vectorsmanagement-download') {
        this.downloadControl.deactivate();
      } else if (active.id === 'm-vectorsmanagement-edition') {
        this.editionControl.deactivate();
      } else if (active.id === 'm-vectorsmanagement-help') {
        this.helpControl.deactivate();
      } else if (active.id === 'm-vectorsmanagement-style') {
        this.styleControl.deactivate();
      }

      active.classList.remove('activated');
    }

    return clickActivate;
  }

  /**
   * This function returns node button of active control.
   *
   * @public
   * @function
   * @param {Node} html plugin template
   * @api stable
   */
  getControlActive(html) {
    if (html.querySelectorAll('#m-vectorsmanagement-previews .activated:not(#m-vectorsmanagement-selection)').length === 0) {
      return false;
    }
    return html.querySelectorAll('#m-vectorsmanagement-previews .activated:not(#m-vectorsmanagement-selection)')[0];
  }

  /**
   * This function gets the selection of selectionControl (feature/layer).
   *
   * @public
   * @function
   * @api stable
   * @returns {String} selection
   */
  getSelection() {
    let selection = 'layer';
    if (this.selectionControl) {
      selection = this.selectionControl.getSelection();
    }
    return selection;
  }

  /**
   * This function gets the selected features of selectionControl.
   *
   * @public
   * @function
   * @api stable
   * @returns {Array} features
   */
  getSelectedFeatures() {
    let selectedFeatures = [];
    if (this.selectionControl) {
      selectedFeatures = this.selectionControl.getSelectedFeatures();
    }
    return selectedFeatures;
  }

  /**
   * This function gets the selected openlayers features of selectionControl.
   *
   * @public
   * @function
   * @api stable
   * @returns {Array} features
   */
  getSelectedOLFeatures() {
    let olFeatures = [];
    if (this.selectionControl) {
      olFeatures = this.selectionControl.getSelectedOLFeatures();
    }
    return olFeatures;
  }

  /**
   * This function clear the selected features array of selectionControl.
   *
   * @public
   * @function
   * @api stable
   */
  removeSelectedFeatures() {
    if (this.selectionControl) {
      this.selectionControl.removeSelectedFeatures();
    }
  }

  /**
   * This function adds a feature to selected features array of selectionControl.
   *
   * @public
   * @function
   * @param {IDEE.Feature} feature
   * @api stable
   */
  addFeatureToSelection(feature) {
    if (this.selectionControl) {
      this.selectionControl.addFeatureToSelection(feature);
    }
  }

  /**
   * This function disable selection of selectionControl.
   *
   * @public
   * @function
   * @api stable
   */
  hideSelectionLayer() {
    if (this.selectionControl) {
      const controlBtn = this.html.querySelector('#m-vectorsmanagement-selection');
      if (controlBtn.classList.contains('activated')) {
        this.selectionControl.hideSelectionLayer();
      }
    }
  }

  /**
   * This function enable selection of selectionControl.
   *
   * @public
   * @function
   * @api stable
   */
  showSelectionLayer() {
    if (this.selectionControl) {
      const controlBtn = this.html.querySelector('#m-vectorsmanagement-selection');
      if (controlBtn.classList.contains('activated')) {
        this.selectionControl.showSelectedLayer();
      }
    }
  }

  /**
   * This function refresh options layers for selection.
   *
   * @public
   * @function
   * @api stable
   */
  refreshLayers() {
    if (this.dataIDEEEditingSession_ && !this.getAllLayers().includes(this.selectedLayer)) {
      const pending = this.dataIDEEEditingSession_.count;
      this.finishDataIDEEEditing(false);
      if (pending > 0) {
        IDEE.toast.warning(getValue('dataidee_removed_notice'), null, 6000);
      }
      this.selectedLayer = null;
    }
    this.layers_ = this.getAllLayers().filter((l) => (
      l instanceof IDEE.layer.Vector || l instanceof IDEE.layer.GenericVector)
      && l.displayInLayerSwitcher)
      .map((l) => ({ value: l.idLayer, text: l.legend || l.idLayer, zIndex: l.getZIndex() }));

    const layerSelector = this.layerSelectorWrapper;
    layerSelector.classList.remove('disabled');
    const selectedLayerSpan = this.layerSelectorSelectedOption;
    const optionsContainer = this.layerSelectorOptionsContainer;

    const layerIdSelected = selectedLayerSpan.dataset.value ?? '';
    const layerExists = this.layers_.some((l) => l.value === layerIdSelected);

    optionsContainer.innerHTML = '';

    const layerOrder = [...this.layers_].sort((a, b) => b.zIndex - a.zIndex);
    layerOrder.forEach((layer, i) => {
      const span = document.createElement('span');
      span.textContent = layer.text;
      span.title = layer.text;
      span.dataset.value = layer.value;
      span.addEventListener('click', (event) => {
        const changeEvent = new CustomEvent('selectLayer', {
          detail: { selected: event.target },
          bubbles: true,
        });
        layerSelector.dispatchEvent(changeEvent);
      });
      optionsContainer.appendChild(span);
    });

    if (!layerExists) {
      if (this.layers_.length === 0) layerSelector.classList.add('disabled');
      selectedLayerSpan.textContent = `${getValue('selectLayerDefault')}...`;
      selectedLayerSpan.title = selectedLayerSpan.textContent;
      delete selectedLayerSpan.dataset.value;
      this.html.querySelector('#m-vectorsmanagement-previews').classList.add('closed');
      this.deactive(this.html, '');
    }
  }

  /**
   * This function refresh selected features for other controls.
   *
   * @public
   * @function
   * @api stable
   */
  refreshSelection() {
    const active = this.getControlActive(this.html);
    if (active) {
      if (active.id === 'm-vectorsmanagement-edition') {
        this.editionControl.refreshSelection();
      } else if (active.id === 'm-vectorsmanagement-style') {
        this.styleControl.refreshStyle();
      }
    }
  }

  accessibilityTab(html) {
    html.querySelectorAll('[tabindex="0"]').forEach((el) => el.setAttribute('tabindex', this.order));
  }

  destroy() {
    document.removeEventListener('click', this.handleDocumentClick);
    this.analysisControl.destroy();
  }

  /**
   * This function compares controls
   *
   * @public
   * @function
   * @param {IDEE.Control} control to compare
   * @api stable
   */
  equals(control) {
    return control instanceof VectorsManagementControl;
  }
}
