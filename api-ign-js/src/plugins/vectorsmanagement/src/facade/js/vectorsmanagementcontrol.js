/**
 * @module M/control/VectorsManagementControl
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
import { changeStyleDialog } from './util';

/**
 * @classdesc
 * Vector layers management Mapea control.
 * This control can create vector layers, draw and edit features, edit styles,
 * calculate topographic profiles and buffers, and download a layer or feature.
 */
export default class VectorsManagementControl extends M.Control {
  /**
   * @classdesc
   * Main constructor of the class. Creates a PluginControl
   * control
   *
   * @constructor
   * @extends {M.Control}
   * @api stable
   */
  constructor({
    map, selection, addlayer, analysis, creation, download, edition, help, style,
    isDraggable, order,
  }) {
    const impl = new M.impl.Control();
    super(impl, 'VectorsManagement');

    const allLayers = map.getLayers().concat(map.getImpl().getAllLayerInGroup());

    this.selection_ = selection;
    this.addlayer_ = addlayer;
    this.analysis_ = analysis;
    this.creation_ = creation;
    this.download_ = download;
    this.edition_ = edition;
    this.help_ = help;
    this.style_ = style;
    this.layers_ = allLayers.filter((l) => (l instanceof M.layer.Vector
      || l instanceof M.layer.GenericVector) && l.displayInLayerSwitcher).map((l) => {
      return { value: l.name, text: l.legend || l.name, zIndex: l.getZIndex() };
    }).sort((a, b) => b.zIndex - a.zIndex);
    this.selectedLayer = null;

    // Determina si el plugin es draggable o no
    this.isDraggable_ = isDraggable;

    // order
    this.order = order;
  }

  /**
   * This function creates the view
   *
   * @public
   * @function
   * @param {M.Map} map to add the control
   * @api stable
   */
  createView(map) {
    this.map = map;
    return new Promise((success, fail) => {
      const html = M.template.compileSync(template, {
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
          },
        },
      });
      this.html = html;

      if (this.selection_) { this.addSelectionControl(html); }

      if (this.addlayer_) { this.addAddLayerControl(html); }

      if (this.analysis_) { this.addAnalysisControl(html); }

      if (this.creation_) { this.addCreationControl(html); }

      if (this.download_) { this.addDownloadControl(html); }

      if (this.edition_) { this.addEditionControl(html); }

      if (this.help_) { this.addHelpControl(html); }

      if (this.style_) { this.addStyleControl(html); }

      html.querySelector('#m-selectionlayer').addEventListener('change', this.selectLayerEvent.bind(this));

      this.map.on(M.evt.ADDED_LAYER, this.refreshLayers.bind(this));
      this.map.on(M.evt.REMOVED_LAYER, this.refreshLayers.bind(this));

      if (this.isDraggable_) {
        M.utils.draggabillyPlugin(this.getPanel(), '#m-vectorsmanagement-titulo');
      }
      this.accessibilityTab(html);
      success(html);
    });
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

    this.html.querySelector('#m-vectorsmanagement-previews').classList.remove('closed');
    const selector = this.html.querySelector('#m-selectionlayer');
    const selectedLayerName = selector.selectedOptions[0].value;

    const allLayers = this.map.getLayers().concat(this.map.getImpl().getAllLayerInGroup());
    this.selectedLayer = allLayers.filter((l) => l.name === selectedLayerName)[0];

    if (this.selectedLayer.type === 'MVT' || this.selectedLayer.type === 'MBTilesVector') {
      M.toast.warning(getValue('exception.typeLayer'), null, 6000);
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
          M.dialog.info(getValue('exception.emptylayer'));
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
        changeStyleDialog();
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
   * @param {M.Feature} feature
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
    const allLayers = this.map.getLayers().concat(this.map.getImpl().getAllLayerInGroup());
    this.layers_ = allLayers.filter((l) => (l instanceof M.layer.Vector
      || l instanceof M.layer.GenericVector) && l.displayInLayerSwitcher).map((l) => {
      return { value: l.name, text: l.legend || l.name, zIndex: l.getZIndex() };
    });
    const selector = this.html.querySelector('#m-selectionlayer');
    const selectedLayerName = selector.selectedOptions[0].value;
    const layerExists = this.layers_.filter((l) => l.value === selectedLayerName).length > 0;

    const length = selector.children.length;
    for (let i = 0; i < length; i += 1) {
      selector.children[0].remove();
    }
    let option = document.createElement('option');
    option.value = '';
    option.selected = !layerExists;
    option.disabled = true;
    option.innerText = `${getValue('selectLayerDefault')}...`;
    selector.appendChild(option);

    const layerOrder = [...this.layers_].sort((a, b) => b.zIndex - a.zIndex);

    layerOrder.forEach((l) => {
      option = document.createElement('option');
      option.value = l.value;
      option.innerText = l.text;
      option.selected = l.value === selectedLayerName;
      selector.appendChild(option);
    });

    if (!layerExists) {
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
    this.analysisControl.destroy();
  }

  /**
   * This function compares controls
   *
   * @public
   * @function
   * @param {M.Control} control to compare
   * @api stable
   */
  equals(control) {
    return control instanceof VectorsManagementControl;
  }
}
