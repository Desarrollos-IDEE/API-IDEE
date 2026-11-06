/**
 * @module IDEE/control/EditionControl
 */
import template from '../../templates/edition';
import removeLayerTemplate from '../../templates/clearlayer';
import editiontableTemplate from '../../templates/editiontable';

import { getValue } from './i18n/language';
import { renderSnapOptions, getToolSnapOptions } from './snapoptions';
import {
  FEATURE_DATA,
  HOLE_INTERACTION,
  MODIFY_INTERACTION,
  SNAPPING,
  TRANSFORM_INTERACTIONS,
  implementsContracts,
  requireImplementation,
} from './contracts';

const TOOL_INTERACTION_REMOVERS = {
  isHoleActive: 'removeDrawHoleInteraction',
  isRotateActive: 'removeRotateInteraction',
  isScaleActive: 'removeScaleInteraction',
  isMoveActive: 'removeMoveInteraction',
};

const DISABLED_BUTTON_ID_POINT = ['holedrawing', 'rotatedrawing', 'scaledrawing'];
const DISABLED_BUTTON_ID_LINE = ['holedrawing'];

export default class EditionControl extends IDEE.Control {
  /**
   * @classdesc
   * Main constructor of the class. Creates a PluginControl
   * control
   *
   * @constructor
   * @extends {IDEE.Control}
   * @param {IDEE.Map} map
   * @param {VectorsManagementControl} managementControl
   * @param {Object} impl platform implementation (MODIFY_INTERACTION, HOLE_INTERACTION,
   * TRANSFORM_INTERACTIONS, FEATURE_DATA; SNAPPING optional)
   * @api stable
   */
  constructor(map, managementControl, impl) {
    // 1. checks if the implementation fulfils the contracts of this control
    requireImplementation(impl, [
      MODIFY_INTERACTION,
      HOLE_INTERACTION,
      TRANSFORM_INTERACTIONS,
      FEATURE_DATA,
    ], 'exception.impl_editioncontrol');

    // 2. implementation of this control
    super('Edition', impl);
    this.getImpl().facadeControl = this;

    this.map_ = map;

    /**
     * vectorsmanagementcontrol to comunicate with others controls
     */
    this.managementControl_ = managementControl;

    /**
     * Template
     * @public
     * @type { HTMLElement }
     */
    this.template = null;

    /**
     * Selected layer
     */
    this.layer_ = null;

    /**
     * Checks if edit tool is active.
     * @private
     * @type {Boolean}
     */
    this.isEditActive = false;

    /**
     * Checks if hole tool is active.
     * @private
     * @type {Boolean}
     */
    this.isHoleActive = false;

    /**
     * Checks if rotate tool is active.
     * @private
     * @type {Boolean}
     */
    this.isRotateActive = false;

    /**
     * Checks if scale tool is active.
     * @private
     * @type {Boolean}
     */
    this.isScaleActive = false;

    /**
     * Checks if move tool is active.
     * @private
     * @type {Boolean}
     */
    this.isMoveActive = false;

    /**
     * Checks if edit attribute tool is active.
     * @private
     * @type {Boolean}
     */
    this.isEditAttributeActive = false;
  }

  /**
   * This functions active control
   *
   * @public
   * @function
   * @param {Node} html
   * @api
   */
  active(html) {
    this.template = IDEE.template.compileSync(template, {
      vars: {
        translations: {
          editgeometria: getValue('editgeometria'),
          clean: getValue('clean'),
          hole: getValue('hole'),
          rotation: getValue('rotation'),
          scale: getValue('scale'),
          move: getValue('move'),
          delete: getValue('delete'),
          attributes: getValue('attributes'),
          newcolumn: getValue('newcolumn'),
          title_attribute_table: getValue('title_attribute_table'),
          title_clear_geometries: getValue('title_clear_geometries'),
          clear_geometries_msg: getValue('clear_geometries_msg'),
          confirm: getValue('confirm'),
          cancel: getValue('cancel'),
        },
      },
    });
    this.initializeLayers();
    html.querySelector('#m-vectorsmanagement-controls').appendChild(this.template);
    this.addEvents();
    this.managementControl_.accessibilityTab(this.template);
    this.managementControl_.updateEditingAvailability();
    this.updateToolsAvailability_();
  }

  /**
   * Adds style and source to vector layer.
   * Adds selection layer to map.
   * @public
   * @function
   * @api
   */
  initializeLayers() {
    this.managementControl_.getFeatureSelection().getLayer();
    this.layer_.getImpl().extract = false;
  }

  /**
   * Adds events listeners to edition buttons
   * @public
   * @function
   * @api
   */
  addEvents() {
    this.template.querySelector('#edit').addEventListener('click', () => this.editionBtnClick('edit'));

    this.template.querySelector('#holedrawing').addEventListener('click', () => this.editionBtnClick('holedrawing'));

    this.template.querySelector('#rotatedrawing').addEventListener('click', () => this.editionBtnClick('rotatedrawing'));

    this.template.querySelector('#scaledrawing').addEventListener('click', () => this.editionBtnClick('scaledrawing'));

    this.template.querySelector('#movedrawing').addEventListener('click', () => this.editionBtnClick('movedrawing'));

    this.template.querySelector('#editattribute').addEventListener('click', () => this.editionBtnClick('editattribute'));

    this.template.querySelector('#cleanAll').addEventListener('click', () => this.showModalCleanGeometries());

    this.template.querySelector('#m-vectorsmanagement-deletegeom-btn').addEventListener('click', () => this.deleteSingleFeature());
  }

  /**
   * Adds events to modal for move the window
   * @public
   * @function
   * @api
   */
  addModalEvents() {
    const container = this.template.querySelector('#edition-attributes-container');
    container.addEventListener('mousedown', (evt) => {
      this.isDragging = true;
      this.offsetX = evt.offsetX;
      this.offsetY = evt.offsetY;
    });

    this.mouseupFunctionEvent = this.mouseupFunction.bind(this);
    this.mousemoveFunctionEvent = this.mousemoveFunction.bind(this);
    document.addEventListener('mouseup', this.mouseupFunctionEvent);
    document.addEventListener('mousemove', this.mousemoveFunctionEvent);
  }

  /**
   * Remove modal window events
   * @public
   * @function
   * @api
   */
  removeModalEvents() {
    document.removeEventListener('mouseup', this.mouseupFunctionEvent);
    document.removeEventListener('mousemove', this.mousemoveFunctionEvent);
  }

  /**
   * Mouseup event function
   * @public
   * @function
   * @api
   */
  mouseupFunction() {
    this.isDragging = false;
  }

  /**
   * Mousemove event function
   * @public
   * @function
   * @api
   * @param {Event} evt mousemove event
   */
  mousemoveFunction(evt) {
    if (this.isDragging) {
      const container = this.template.querySelector('#edition-attributes-container');
      container.style.top = `${(evt.clientY - this.offsetY) + (container.clientHeight / 2)}px`;
      container.style.left = `${(evt.clientX - this.offsetX) + (container.clientWidth / 2)}px`;
    }
  }

  /**
   * Shows/hides tools template and
   * adds/removes edit interaction.
   * @public
   * @function
   * @api
   * @param {String} tool - clicked button tool type
   */
  editionBtnClick(tool) {
    switch (tool) {
      case 'edit':
        this.activationManager('isEditActive', tool);
        break;
      case 'holedrawing':
        this.activationManager('isHoleActive', tool);
        break;
      case 'rotatedrawing':
        this.activationManager('isRotateActive', tool);
        break;
      case 'scaledrawing':
        this.activationManager('isScaleActive', tool);
        break;
      case 'movedrawing':
        this.activationManager('isMoveActive', tool);
        break;
      case 'editattribute':
        this.activationManager('isEditAttributeActive', tool);
        break;
      default:
    }

    if (this.isEditActive) {
      this.managementControl_.hideSelectionLayer();
      this.activateEdition();
    } else if (this.isHoleActive) {
      this.activateHole();
    } else if (this.isRotateActive) {
      this.activateRotate();
    } else if (this.isScaleActive) {
      this.activateScale();
    } else if (this.isMoveActive) {
      this.activateMove();
    } else if (this.isEditAttributeActive) {
      this.activateEditAttributes();
    }

    const snapPanel = this.template.querySelector('#m-vectorsmanagement-edition-snap');
    if (this.isEditActive || this.isHoleActive) {
      this.renderSnapOptions(this.isHoleActive ? 'Hole' : 'Modify');
      snapPanel.classList.remove('closed');
    } else {
      snapPanel.classList.add('closed');
    }
  }

  /**
   * Renders snap options panel for the active tool.
   * @public
   * @function
   * @param {String} tool active tool
   * @api
   */
  renderSnapOptions(tool) {
    const container = this.template.querySelector('#m-vectorsmanagement-edition-snap');
    const { snapOptions } = this.managementControl_;
    renderSnapOptions(container, 'edition', tool, snapOptions, (options) => {
      if (implementsContracts(this.getImpl(), SNAPPING)) {
        this.getImpl().updateSnap(options);
      }
    });
  }

  openModalEditAttribute() {
    const templateModal = IDEE.template.compileSync(editiontableTemplate, {
      vars: {
        translations: {
          newcolumn: getValue('newcolumn'),
        },
      },
    });

    this.managementControl_.accessibilityTab(templateModal);

    IDEE.dialog.info(templateModal.innerHTML, getValue('title_attribute_table'));
    IDEE.utils.draggabillyElement('.m-dialog .m-modal .m-content', '.m-dialog .m-modal .m-content .m-title');
    document.querySelector('#add-attribute-btn').onclick = () => this.newAttributeColumn();
    document.querySelector('.m-dialog.info .m-modal .m-button button').onclick = () => this.activationManager('isEditAttributeActive', 'editattribute');
  }

  /**
   * Hides/shows tools menu and de/activates editions.
   * @public
   * @function
   * @api
   * @param {String} clicked - i.e.isEditActive
   * @param {String} drawingDiv - i.e.edit
   */
  activationManager(clicked, drawingDiv) {
    // if drawing is active
    if (this[clicked]) {
      this.deactivateEdition();
      this[clicked] = false;
      document.getElementById(drawingDiv).classList.remove('activated');
    } else {
      this.deactivateEdition();
      this[clicked] = true;
      document.getElementById(drawingDiv).classList.add('activated');
    }
  }

  /**
   * Checks if any edition button is active and deactivates it,
   * deleting edition interaction.
   * @public
   * @function
   * @api
   */
  deactivateEdition() {
    if (this.isEditActive) {
      this.isEditActive = false;
      this.deactivateSelection();
      this.managementControl_.showSelectionLayer();
    } else if (this.isHoleActive) {
      this.deactivateTool('isHoleActive');
    } else if (this.isRotateActive) {
      this.deactivateTool('isRotateActive');
    } else if (this.isScaleActive) {
      this.deactivateTool('isScaleActive');
    } else if (this.isMoveActive) {
      this.deactivateTool('isMoveActive');
    } else if (this.isEditAttributeActive) {
      this.isEditAttributeActive = false;
      this.removeModalEvents();
    }
    const activeControl = this.getControlActive(this.template);
    if (activeControl) {
      activeControl.classList.remove('activated');
    }
  }

  /**
   * Deactivates an edition tool, removing its interaction.
   * @public
   * @function
   * @param {String} tool tool flag (isHoleActive, isRotateActive, isScaleActive or isMoveActive)
   * @api
   */
  deactivateTool(tool) {
    if (this[tool]) {
      this[tool] = false;
      this.getImpl()[TOOL_INTERACTION_REMOVERS[tool]]();
    }
  }

  /**
   * Remove edition and selection interactions and
   * hide edition template. Selected features remain selected.
   * @public
   * @function
   * @api
   */
  deactivateSelection() {
    this.feature = undefined;
    this.template.querySelector('#edition-container').classList.add('closed');
    this.getImpl().removeEditInteraction();
    this.getImpl().removeSelectInteraction();
  }

  /**
   * Show window to confirm delete features
   * @public
   * @function
   * @api
   */
  showModalCleanGeometries() {
    const total = this.layer_.getFeatures().length;
    const cleanMessage = getValue('clear_geometries_msg').replace('{count}', String(total));
    const templateModal = IDEE.template.compileSync(removeLayerTemplate, {
      vars: {
        translations: {
          title_clear_geometries: getValue('title_clear_geometries'),
          clear_geometries_msg: cleanMessage,
          confirm: getValue('confirm'),
          cancel: getValue('cancel'),
        },
      },
    });
    this.managementControl_.accessibilityTab(templateModal);
    IDEE.dialog.info(templateModal.innerHTML, getValue('title_attribute_table'));

    // this.template.querySelector('#clear-layer-modal').classList.remove('closed');
    document.querySelector('#confirm-clear-btn').onclick = () => this.closeModalCleanGeometries(true);
    document.querySelector('#cancel-clear-btn').onclick = () => this.closeModalM();
    this.changeStyleModalClean();
  }

  changeStyleModalClean() {
    document.querySelector('.m-modal .m-content .m-message').style.borderBottom = 'none';
    document.querySelector('.m-modal .m-content .m-button').style.display = 'none';
  }

  closeModalM() {
    document.querySelector('.m-modal .m-content .m-button button').click();
  }

  /**
   * Close window to confirm delete features
   * @public
   * @function
   * @api
   */
  closeModalCleanGeometries(clean) {
    if (clean) {
      this.cleanGeometries();
    }
    this.closeModalM();
  }

  /**
   * Delete features from layer
   * @public
   * @function
   * @api
   */
  cleanGeometries() {
    this.removeFeatures_(this.layer_.getFeatures());

    // remove buffer
    this.managementControl_.analysisControl?.removeBufferFeatures();
  }

  /**
   * Delete a feature from layer
   * @public
   * @function
   * @api
   */
  deleteSingleFeature() {
    if (this.feature) {
      this.removeFeatures_([this.feature]);
    }
  }

  /**
   * Removes features from the layer and from the selection.
   * @private
   * @function
   * @param {Array<IDEE.Feature>} features
   */
  removeFeatures_(features) {
    this.layer_.removeFeatures(features);
    this.managementControl_.getFeatureSelection().remove(features);
    this.feature = undefined;
    this.template.querySelector('#edition-container').classList.add('closed');
    if (this.isEditActive) {
      this.getImpl().removeEditInteraction();
      this.getImpl().removeSelectInteraction();
      this.getImpl().activateSelection(getToolSnapOptions('Modify', this.managementControl_.snapOptions));
    }
  }

  /**
   * This function returns node button of active control.
   * @public
   * @function
   * @param {Node} html plugin template
   * @api stable
   */
  getControlActive(html) {
    if (html.querySelectorAll('.m-vectorsmanagement-edition-container>#editionBtns .activated').length === 0) {
      return false;
    }
    return html.querySelectorAll('.m-vectorsmanagement-edition-container>#editionBtns .activated')[0];
  }

  /**
   * Activate edition tool
   *
   * @public
   * @function
   * @api stable
   */
  activateEdition() {
    IDEE.toast.info(getValue('info_remove_vertex'), null, 6000);
    const snapOptions = getToolSnapOptions('Modify', this.managementControl_.snapOptions);
    this.getImpl().activateSelection(snapOptions);
  }

  /**
   * Indicates whether the control is activated.
   * @public
   * @function
   * @return {Boolean} True if the control is activated, false otherwise.
   * @api
   */
  isActivated() {
    return document.querySelector('#m-vectorsmanagement-edition').classList.contains('activated');
  }

  /**
   * Activate hole tool
   *
   * @public
   * @function
   * @api stable
   */
  activateHole() {
    this.getImpl().addHoleDrawInteraction(getToolSnapOptions('Hole', this.managementControl_.snapOptions));
  }

  /**
   * Activate rotate tool
   *
   * @public
   * @function
   * @api stable
   */
  activateRotate() {
    const features = this.managementControl_.getSelectedFeatures();
    this.getImpl().addRotateInteraction(features);
  }

  /**
   * Activate scale tool
   *
   * @public
   * @function
   * @api stable
   */
  activateScale() {
    const features = this.managementControl_.getSelectedFeatures();
    this.getImpl().addScaleInteraction(features);
  }

  /**
   * Activate move tool
   *
   * @public
   * @function
   * @api stable
   */
  activateMove() {
    const features = this.managementControl_.getSelectedFeatures();
    this.getImpl().addMoveInteraction(features);
  }

  /**
   * Activate attribute edition tool
   *
   * @public
   * @function
   * @api stable
   */
  activateEditAttributes() {
    this.showFeatureAttributes();
  }

  /**
   * Modifies edition tools, updates inputs, emphasizes selection
   * and shows feature info on select.
   * @public
   * @function
   * @api
   * @param {{features: Array<IDEE.Feature|undefined>}} e selection event of the implementation
   */
  onSelect(e) {
    const [feature] = e.features;
    if (!feature) return;
    this.feature = feature;

    this.geometry = this.feature.getGeometry().type;
    this.emphasizeSelectedFeature();

    this.template.querySelector('#edition-container').classList.remove('closed');
  }

  /**
   * Keeps the modified features selected and emphasized after they are modified.
   * @public
   * @function
   * @api
   * @param {{features: Array<IDEE.Feature|undefined>}} event modification event of the
   * implementation
   */
  onModify(event) {
    const selection = this.managementControl_.getFeatureSelection();
    const modified = (event?.features || []).filter(Boolean);
    const selected = selection.getFeatures();
    if (modified.length === 0
      || (modified.length === selected.length && modified.every((f) => selected.includes(f)))) {
      selection.refresh();
    } else {
      selection.select(modified);
    }
    this.layer_.redraw();
  }

  /**
   * Selects the feature selected for edition, emphasizing it.
   * @public
   * @function
   * @api
   */
  emphasizeSelectedFeature() {
    this.managementControl_.getFeatureSelection().select([this.feature]);
  }

  /**
   * Refresh position of emphasize features after edit features
   * @public
   * @function
   * @api
   */
  refreshEmphasizedFeatures() {
    this.managementControl_.getFeatureSelection().refresh();
  }

  /**
   * Refresh selected features for edit tools
   * @public
   * @function
   * @api
   */
  refreshSelection() {
    this.updateToolsAvailability_();
    if (this.isEditAttributeActive) {
      const features = this.managementControl_.getSelectedFeatures();
      if (features.length > 0) {
        this.refreshAttributeTable(features);
      }
    } else if (this.isMoveActive) {
      const features = this.managementControl_.getSelectedFeatures();
      this.getImpl().refreshMoveSelection(features);
    } else if (this.isScaleActive) {
      const features = this.managementControl_.getSelectedFeatures();
      this.getImpl().refreshScaleSelection(features);
    } else if (this.isRotateActive) {
      const features = this.managementControl_.getSelectedFeatures();
      this.getImpl().refreshRotateSelection(features);
    }
  }

  /**
   * Enables edition tools according to the selected geometry
   * and deactivates the tools that do not apply to it.
   * @private
   * @function
   */
  updateToolsAvailability_() {
    const features = this.managementControl_.getSelectedFeatures();
    const geometry = features.length === 1 ? features[0].getGeometry().type : null;
    this.enabledButton([...DISABLED_BUTTON_ID_POINT, ...DISABLED_BUTTON_ID_LINE]);
    if (geometry === 'Point') {
      this.disabledButton(DISABLED_BUTTON_ID_POINT);
      ['isHoleActive', 'isRotateActive', 'isScaleActive'].forEach((tool) => this.deactivateTool(tool));
    } else if (geometry === 'LineString' || features.length > 1) {
      this.disabledButton(DISABLED_BUTTON_ID_LINE);
      this.deactivateTool('isHoleActive');
    }
  }

  /**
   * Disables buttons by id and removes the 'activated' class if present.
   * @public
   * @function
   * @api
   * @param {Array<String>} IdButtons List of button ids to disable
   */
  disabledButton(IdButtons) {
    IdButtons.forEach((id) => {
      const $button = this.template.querySelector(`#${id}`);
      $button.setAttribute('disabled', 'disabled');
      $button.classList.add('disabled');

      if ($button.classList.contains('activated')) {
        $button.classList.remove('activated');
      }
    });
  }

  /**
   * Enables buttons by id and removes the 'disabled' attribute and class if present.
   * @public
   * @function
   * @api
   * @param {Array<String>} IdButtons List of button ids to enable
   */
  enabledButton(IdButtons) {
    IdButtons.forEach((id) => {
      const $button = this.template.querySelector(`#${id}`);
      if ($button && $button.classList.contains('disabled')) {
        $button.removeAttribute('disabled');
        $button.classList.remove('disabled');
      }
    });
  }

  /**
   * Adds feature to the selection or, otherwise, draws again the emphasis of the selection.
   * @public
   * @function
   * @param {IDEE.Feature} feature
   * @param {Boolead} addToSelection add feature to selection (true/false)
   * @api
   */
  emphasizeFeature(feature, addToSelection) {
    const selection = this.managementControl_.getFeatureSelection();
    if (addToSelection) {
      selection.add(feature);
    } else {
      selection.refresh();
    }
  }

  /**
   * Show attribute edition template
   *
   * @public
   * @function
   * @api stable
   */
  showFeatureAttributes() {
    let features = this.managementControl_.getSelectedFeatures();
    if (features.length === 0) {
      features = this.layer_.getFeatures();
    }
    if (features.length > 0) {
      this.openModalEditAttribute();
      const attributes = features[0].getAttributes();
      if (attributes) {
        const keys = Object.keys(attributes);
        this.createAttributeTable(keys, features);
      } else {
        this.createEmptyTable();
      }
    } else {
      IDEE.dialog.info(getValue('exception.emptylayer'));
    }
  }

  /**
   * Create empty attributes table
   *
   * @public
   * @function
   * @api stable
   */
  createEmptyTable() {
    const table = document.createElement('table');
    table.id = 'attribute-table';
    document.querySelector('#m-vectorsmanagement-attribute-table-container').appendChild(table);
    return table;
  }

  /**
   * Create attributes table
   *
   * @public
   * @function
   * @api stable
   * @param {Array} keys attribute keys array
   * @param {Array} features features array
   */
  createAttributeTable(keys, features) {
    const table = this.createEmptyTable();
    const trhead = document.createElement('tr');
    table.appendChild(trhead);
    features.forEach((f) => table.appendChild(document.createElement('tr')));
    keys.forEach((k) => {
      const th = this.createAttributeHeader(k);
      trhead.appendChild(th);
      this.fillData(table, features, k, false);
    });
  }

  /**
   * Show modal for set new attribute name
   *
   * @public
   * @function
   * @api stable
   */
  newAttributeColumn() {
    const $dialog = document.querySelector('.m-dialog.info');
    $dialog.style.display = 'none';

    IDEE.dialog.info(
      `<div id="chooseAttribute" class="m-vectorsmanagement-editAttribute">
        <input autofocus type="text" id="attribute-name" style="width: 10rem;">
      </div>`,
      getValue('title_popup_attribute'),
    );
    const color = '#71a7d3';
    const dialog = document.querySelector('.m-dialog > div.m-modal > div.m-content');
    dialog.style.minWidth = 'auto';
    const btn = document.querySelectorAll('.m-button button')[1];
    const inputName = document.querySelector('div.m-modal input#attribute-name');
    btn.style.backgroundColor = color;
    btn.addEventListener('click', () => {
      $dialog.style.display = 'block';
      this.createAttributeColumn(inputName.value);
    });
  }

  /**
   * Create new attribute column
   *
   * @public
   * @function
   * @api stable
   * @param {String} attributeName
   */
  createAttributeColumn(attributeName) {
    if (attributeName) {
      const table = document.querySelector('#attribute-table');
      let trhead;
      if (table.firstChild) {
        trhead = table.firstChild;
      } else {
        trhead = document.createElement('tr');
        table.appendChild(trhead);
      }
      const th = this.createAttributeHeader(attributeName);
      trhead.appendChild(th);
      let features = this.managementControl_.getSelectedFeatures();
      if (features.length === 0) {
        features = this.layer_.getFeatures();
      }
      this.fillData(table, features, attributeName, true);
    }
  }

  /**
   * Create attribute table header
   *
   * @public
   * @function
   * @api stable
   * @param {String} attributeName
   */
  createAttributeHeader(attributeName) {
    const th = document.createElement('th');
    const span = document.createElement('span');
    span.textContent = attributeName;
    const btnDel = document.createElement('button');
    btnDel.name = attributeName;
    btnDel.classList.add('vectorsmanagement-icon-papelera');
    btnDel.addEventListener('click', (evt) => this.deleteAttribute(evt));
    const btnRename = document.createElement('button');
    btnRename.name = attributeName;
    btnRename.classList.add('vectorsmanagement-icon-editar2');
    btnRename.addEventListener('click', (evt) => this.renameAttribute(evt));
    th.appendChild(span);
    th.appendChild(btnDel);
    th.appendChild(btnRename);
    return th;
  }

  /**
   * Fill column with feature attribute data
   *
   * @public
   * @function
   * @api stable
   * @param {Node} table attributes table
   * @param {Array} features features array
   * @param {String} attributeName
   * @param {Boolean} newAttr is new attributte (true/false)
   */
  fillData(table, features, attributeName, newAttr) {
    if (newAttr) {
      const layerFeatures = this.layer_.getFeatures();
      for (let i = 0; i < layerFeatures.length; i += 1) {
        layerFeatures[i].setAttribute(attributeName, '');
      }
    }

    for (let i = 0; i < features.length; i += 1) {
      const td = document.createElement('td');
      const input = document.createElement('input');
      input.type = 'text';
      input.classList.add(features[i].getId());
      input.name = attributeName;
      input.value = features[i].getAttribute(attributeName);
      this.addInputEvents(input);
      td.appendChild(input);
      table.children[i + 1].appendChild(td);
    }
  }

  /**
   * Add events to attribute table header inputs
   *
   * @public
   * @function
   * @api stable
   */
  addInputEvents(input) {
    // const this2 = this;
    input.addEventListener('focus', () => {
      const featId = input.classList[0];
      this.feature = this.getLayer().getFeatureById(featId);
      this.geometry = this.feature.getGeometry().type;
      // this.emphasizeSelectedFeature();
      const extent = this.getImpl().getFeatureExtent(this.feature);
      this.map_.setBbox(extent);
      if (this.map_.getZoom() > 17) {
        this.map_.setZoom(17);
      }
    });
    input.addEventListener('keyup', () => {
      const attributeName = input.name;
      this.feature.setAttribute(attributeName, input.value);
    });
  }

  /**
   * OnFocus event function from attributes table cell
   *
   * @public
   * @function
   * @api stable
   * @param {Event} evt focus event
   */
  focusFeature(evt) {
    const featId = evt.target.classList[0];
    this.feature = this.layer_.getFeatureById(featId);
    this.emphasizeSelectedFeature();
  }

  /**
   * Update feature attribute value
   *
   * @public
   * @function
   * @api stable
   * @param {Event} evt change event
   */
  updateFeatureAttribute(evt) {
    this.feature.setAttribute(evt.target.name, evt.target.value);
  }

  /**
   * Delete attribute from features
   *
   * @public
   * @function
   * @api stable
   * @param {Event} evt click event
   */
  deleteAttribute(evt) {
    const attributeName = evt.target.name;
    const features = this.layer_.getFeatures();
    features.forEach((f) => {
      this.getImpl().unsetAttribute(f, attributeName);
    });
    const table = document.querySelector('#attribute-table');
    table.parentNode.removeChild(table);
    const selectedFeatures = this.managementControl_.getSelectedFeatures();
    this.createAttributeTable(
      Object.keys(features[0].getAttributes()),
      selectedFeatures.length > 0 ? selectedFeatures : features,
    );
  }

  /**
   * Show modal to change attribute name
   *
   * @public
   * @function
   * @api stable
   * @param {Event} evt click event
   */
  renameAttribute(evt) {
    const $dialog = document.querySelector('.m-dialog.info');
    $dialog.style.display = 'none';

    IDEE.dialog.info(
      `<div id="chooseAttribute" class="m-vectorsmanagement-editAttribute">
        <input type="text" id="attribute-name" style="width: 10rem;">
      </div>`,
      getValue('title_popup_editAttribute'),
    );

    const color = '#71a7d3';
    const dialog = document.querySelector('.m-dialog > div.m-modal > div.m-content');
    dialog.style.minWidth = 'auto';
    const title = document.querySelector('.m-modal .m-title');
    title.style.backgroundColor = color;
    const btn = document.querySelectorAll('.m-button button')[1];

    const inputName = document.querySelector('div.m-modal input#attribute-name');
    btn.style.backgroundColor = color;
    btn.addEventListener('click', () => {
      $dialog.style.display = 'block';
      this.updateFeaturesAttributeName(evt.target.name, inputName.value);
    });
  }

  /**
   * Update features attribute name
   *
   * @public
   * @function
   * @api stable
   * @param {String} attributeName
   * @param {String} newAttributeName
   */
  updateFeaturesAttributeName(attributeName, newAttributeName) {
    const features = this.layer_.getFeatures();
    features.forEach((f) => this.updateAttributes(f, attributeName, newAttributeName));
    const selectedFeatures = this.managementControl_.getSelectedFeatures();
    this.refreshAttributeTable(selectedFeatures.length > 0 ? selectedFeatures : features);
  }

  /**
   * Update features attribute table
   *
   * @public
   * @function
   * @api stable
   * @param {String} attributeName
   * @param {String} newAttributeName
   */
  refreshAttributeTable(features) {
    const table = document.querySelector('#attribute-table');
    table.parentNode.removeChild(table);
    this.createAttributeTable(Object.keys(features[0].getAttributes()), features);
  }

  /**
   * Update feature attribute name
   *
   * @public
   * @function
   * @api stable
   * @param {IDEE.Feature} feature
   * @param {String} attributeName
   * @param {String} newAttribute
   */
  updateAttributes(feature, attributeName, newAttribute) {
    const attributes = feature.getAttributes();
    const nuevoObjeto = {};
    const keys = Object.keys(attributes);
    keys.forEach((k) => {
      if (k === attributeName) {
        nuevoObjeto[newAttribute] = attributes[k];
      } else {
        nuevoObjeto[k] = attributes[k];
      }
      this.getImpl().unsetAttribute(feature, k);
    });
    feature.setAttributes(nuevoObjeto);
  }

  /**
   * Sets the layer selected for management
   * @public
   * @function
   * @api
   * @param {IDEE.layer} layer
   */
  setLayer(layer) {
    this.layer_ = layer;
  }

  /**
   * This function returns the layer selected for management
   *
   * @public
   * @function
   * @api stable
   */
  getLayer() {
    return this.layer_;
  }

  /**
   * This function is called on the control activation
   *
   * @public
   * @function
   * @api stable
   */
  activate() {
    super.activate();
  }

  /**
   * This function is called on the control deactivation
   *
   * @public
   * @function
   * @api stable
   */
  deactivate() {
    this.template.remove();
    this.deactivateEdition();
    this.removeModalEvents();
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
    // eslint-disable-next-line no-undef
    return control instanceof EditionControl;
  }
}
