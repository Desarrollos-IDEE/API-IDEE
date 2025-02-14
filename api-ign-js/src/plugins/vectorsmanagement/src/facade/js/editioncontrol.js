/**
 * @module M/control/EditionControl
 */
import EditionImplControl from '../../impl/ol/js/editioncontrol';
import template from '../../templates/edition';
import removeLayerTemplate from '../../templates/clearlayer';
import editiontableTemplate from '../../templates/editiontable';

import { getValue } from './i18n/language';
import { changeStyleDialog } from './util';

export default class EditionControl extends M.Control {
  /**
   * @classdesc
   * Main constructor of the class. Creates a PluginControl
   * control
   *
   * @constructor
   * @extends {M.Control}
   * @api stable
   */
  constructor(map, managementControl) {
    // 1. checks if the implementation can create PluginControl
    if (M.utils.isUndefined(EditionImplControl)) {
      M.exception(getValue('exception'));
    }

    // 2. implementation of this control
    const impl = new EditionImplControl(map);
    super(impl, 'Edition');
    impl.facadeControl = this;

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

    /**
     * Mapea layer where a square will be drawn around selected feature.
     * @private
     * @type {*}
     */
    this.selectionLayer = null;
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
    this.template = M.template.compileSync(template, {
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
  }

  /**
   * Adds style and source to vector layer.
   * Adds selection layer to map.
   * @public
   * @function
   * @api
   */
  initializeLayers() {
    const layers = this.map_.getLayers().filter((l) => l.name === 'selectLayer');
    if (layers.length > 0) {
      this.selectionLayer = layers[0];
    } else {
      this.selectionLayer = new M.layer.Vector({
        extract: false,
        name: 'selectLayer',
        source: this.layer_.getImpl().getOL3Layer().getSource(),
      }, { displayInLayerSwitcher: false });
      this.layer_.getImpl().extract = false;
      this.map_.addLayers(this.selectionLayer);
      this.selectionLayer.setZIndex(1045);
    }
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
  }

  openModalEditAttribute() {
    const templateModal = M.template.compileSync(editiontableTemplate, {
      vars: {
        translations: {
          newcolumn: getValue('newcolumn'),
        },
      },
    });

    this.managementControl_.accessibilityTab(templateModal);

    M.dialog.info(templateModal.innerHTML, getValue('title_attribute_table'));
    M.utils.draggabillyElement('.m-dialog .m-modal .m-content', '.m-dialog .m-modal .m-content .m-title');
    changeStyleDialog();
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
      this.isHoleActive = false;
      this.getImpl().removeDrawHoleInteraction();
    } else if (this.isRotateActive) {
      this.isRotateActive = false;
      this.getImpl().removeRotateInteraction();
    } else if (this.isScaleActive) {
      this.isScaleActive = false;
      this.getImpl().removeScaleInteraction();
    } else if (this.isMoveActive) {
      this.isMoveActive = false;
      this.getImpl().removeMoveInteraction();
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
   * Remove edition and selection interactions,
   * hide edition template and remove selected features
   * @public
   * @function
   * @api
   */
  deactivateSelection() {
    this.feature = undefined;
    this.template.querySelector('#edition-container').classList.add('closed');
    this.getImpl().removeEditInteraction();
    this.getImpl().removeSelectInteraction();
    this.managementControl_.removeSelectedFeatures();
    this.selectionLayer.removeFeatures(this.selectionLayer.getFeatures());
  }

  /**
   * Show window to confirm delete features
   * @public
   * @function
   * @api
   */
  showModalCleanGeometries() {
    const templateModal = M.template.compileSync(removeLayerTemplate, {
      vars: {
        translations: {
          title_clear_geometries: getValue('title_clear_geometries'),
          clear_geometries_msg: getValue('clear_geometries_msg'),
          confirm: getValue('confirm'),
          cancel: getValue('cancel'),
        },
      },
    });
    this.managementControl_.accessibilityTab(templateModal);
    M.dialog.info(templateModal.innerHTML, getValue('title_attribute_table'));

    // this.template.querySelector('#clear-layer-modal').classList.remove('closed');
    document.querySelector('#confirm-clear-btn').onclick = () => this.closeModalCleanGeometries(true);
    document.querySelector('#cancel-clear-btn').onclick = () => this.closeModalM();
    this.changeStyleModalClean();
  }

  changeStyleModalClean() {
    changeStyleDialog();
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
    this.selectionLayer.removeFeatures(this.selectionLayer.getFeatures());
    this.layer_.removeFeatures(this.layer_.getFeatures());

    // remove buffer
    this.managementControl_.analysisControl.removeBufferFeatures();
  }

  /**
   * Delete a feature from layer
   * @public
   * @function
   * @api
   */
  deleteSingleFeature() {
    if (this.feature) {
      this.layer_.removeFeatures(this.feature);
      this.selectionLayer.removeFeatures(this.selectionLayer.getFeatures());
      this.template.querySelector('#edition-container').classList.add('closed');
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
    // eslint-disable-next-line no-underscore-dangle
    const snap = this.managementControl_.edition_ instanceof Object
      // eslint-disable-next-line no-underscore-dangle
      ? this.managementControl_.edition_
      : { snapToPointer: true, pixelTolerance: 30 };

    this.getImpl().activateSelection(snap);
  }

  /**
   * Activate hole tool
   *
   * @public
   * @function
   * @api stable
   */
  activateHole() {
    this.getImpl().addHoleDrawInteraction();
  }

  /**
   * Activate rotate tool
   *
   * @public
   * @function
   * @api stable
   */
  activateRotate() {
    const olFeatures = this.managementControl_.getSelectedOLFeatures();
    this.getImpl().addRotateInteraction(olFeatures);
  }

  /**
   * Activate scale tool
   *
   * @public
   * @function
   * @api stable
   */
  activateScale() {
    const olFeatures = this.managementControl_.getSelectedOLFeatures();
    this.getImpl().addScaleInteraction(olFeatures);
  }

  /**
   * Activate move tool
   *
   * @public
   * @function
   * @api stable
   */
  activateMove() {
    const olFeatures = this.managementControl_.getSelectedOLFeatures();
    this.getImpl().addMoveInteraction(olFeatures);
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
   * @param {Event}
   */
  onSelect(e) {
    const MFeatures = this.layer_.getFeatures();
    const olFeature = e.target.getFeatures().getArray()[0];

    this.feature = MFeatures.filter((f) => f.getImpl().getOLFeature() === olFeature)[0]
      || undefined;

    this.geometry = this.feature.getGeometry().type;
    this.emphasizeSelectedFeature();

    this.template.querySelector('#edition-container').classList.remove('closed');
  }

  /**
   * Emphasizes selection and shows feature info after feature is modified.
   * @public
   * @function
   * @api
   */
  onModify() {
    this.refreshEmphasizedFeatures();
    this.layer_.redraw();
  }

  /**
   * Clears selection layer.
   * Draws square around feature and adds it to selection layer.
   * For points:
   *    If feature doesn't have style, sets new style.
   * For text:
   *    Colours red text feature point.
   * @public
   * @function
   * @api
   */
  emphasizeSelectedFeature() {
    this.emphasis = null;
    this.selectionLayer.removeFeatures(this.selectionLayer.getFeatures());
    this.managementControl_.removeSelectedFeatures();

    this.emphasizeFeature(this.feature, true);
  }

  /**
   * Refresh position of emphasize features after edit features
   * @public
   * @function
   * @api
   */
  refreshEmphasizedFeatures() {
    this.emphasis = null;
    this.selectionLayer.removeFeatures(this.selectionLayer.getFeatures());
    const selectedFeatures = this.managementControl_.getSelectedFeatures();
    selectedFeatures.forEach((f) => this.emphasizeFeature(f, false));
  }

  /**
   * Refresh selected features for edit tools
   * @public
   * @function
   * @api
   */
  refreshSelection() {
    if (this.isEditAttributeActive) {
      const features = this.managementControl_.getSelectedFeatures();
      this.refreshAttributeTable(features);
    } else if (this.isMoveActive) {
      const olFeatures = this.managementControl_.getSelectedOLFeatures();
      this.getImpl().refreshMoveSelection(olFeatures);
    } else if (this.isScaleActive) {
      const olFeatures = this.managementControl_.getSelectedOLFeatures();
      this.getImpl().refreshScaleSelection(olFeatures);
    } else if (this.isRotateActive) {
      const olFeatures = this.managementControl_.getSelectedOLFeatures();
      this.getImpl().refreshRotateSelection(olFeatures);
    }
  }

  /**
   * Draws square around feature and adds it to selection layer.
   * @public
   * @function
   * @param {M.Feature} feature
   * @param {Boolead} addToSelection add feature to selection (true/false)
   * @api
   */
  emphasizeFeature(feature, addToSelection) {
    if (feature) {
      const geomType = feature.getGeometry().type;
      let emphasis;
      // if point vs text vs else
      if (geomType === 'Point' || geomType === 'MultiPoint') {
        emphasis = this.getImpl().getMapeaFeatureClone(feature);

        emphasis.setStyle(new M.style.Point({
          radius: 20,
          stroke: {
            color: '#FF0000',
            width: 2,
          },
        }));
      } else {
        // eslint-disable-next-line no-underscore-dangle
        const extent = this.getImpl().getFeatureExtent(feature);
        emphasis = M.impl.Feature.olFeature2Facade(this.getImpl().newPolygonFeature(extent));
        emphasis.setStyle(new M.style.Line({
          stroke: {
            color: '#FF0000',
            width: 2,
          },
        }));
      }
      if (addToSelection) {
        this.managementControl_.addFeatureToSelection(feature);
      }
      this.selectionLayer.addFeatures([emphasis]);
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
      M.dialog.info(getValue('exception.emptylayer'));
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

    M.dialog.info(
      `<div id="chooseAttribute" class="m-vectorsmanagement-editAttribute">
        <input autofocus type="text" id="attribute-name" style="width: 10rem;">
      </div>`,
      getValue('title_popup_attribute'),
    );
    changeStyleDialog();
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
      const extent = this.feature.getImpl().getOLFeature().getGeometry().getExtent();
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
      f.getImpl().getOLFeature().unset(attributeName);
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

    M.dialog.info(
      `<div id="chooseAttribute" class="m-vectorsmanagement-editAttribute">
        <input type="text" id="attribute-name" style="width: 10rem;">
      </div>`,
      getValue('title_popup_editAttribute'),
    );

    changeStyleDialog();

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

  changeStyleDialog() {
    document.querySelectorAll('div.m-mapea-container div.m-dialog div.m-title').forEach((t) => {
      const title = t;
      title.style.backgroundColor = '#71a7d3';
    });

    document.querySelector('div.m-mapea-container div.m-dialog div.m-title').style.backgroundColor = '#71a7d3';

    const button = document.querySelector('div.m-dialog.info div.m-button > button');
    button.style.backgroundColor = '#71a7d3';
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
   * @param {M.Feature} feature
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
      feature.getImpl().getOLFeature().unset(k);
    });
    feature.setAttributes(nuevoObjeto);
  }

  /**
   * Sets the layer selected for management
   * @public
   * @function
   * @api
   * @param {M.layer} layer
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
   * @param {M.Control} control to compare
   * @api stable
   */
  equals(control) {
    // eslint-disable-next-line no-undef
    return control instanceof EditionControl;
  }
}
