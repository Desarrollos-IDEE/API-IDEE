/**
 * @module M/control/SelectionControl
 */
import SelectionImplControl from '../../impl/ol/js/selectioncontrol';
// import template from '../../templates/selection';
import { getValue } from './i18n/language';

const DISABLED_BUTTON_ID_POINT = ['holedrawing', 'rotatedrawing', 'scaledrawing'];
const DISABLED_BUTTON_ID_LINE = ['holedrawing'];

export default class SelectionControl extends M.Control {
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
    if (M.utils.isUndefined(SelectionImplControl)) {
      M.exception(getValue('exception'));
    }

    // 2. implementation of this control
    const impl = new SelectionImplControl(map);
    super(impl, 'Selection');
    impl.facadeControl = this;

    this.map_ = map;

    this.managementControl_ = managementControl;

    /**
     * Template
     * @public
     * @type { HTMLElement }
     */
    this.template = null;

    this.selection_ = 'layer';

    this.layer_ = null;

    this.selectedFeatures_ = [];

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
    this.initializeLayers();
    this.getImpl().activateSelection();
    this.selection_ = 'feature';
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
   * Returns selection
   *
   * @public
   * @function
   * @api stable
   */
  getSelection() {
    return this.selection_;
  }

  /**
   * This function disable selection.
   *
   * @public
   * @function
   * @api stable
   */
  hideSelectionLayer() {
    this.getImpl().removeSelectInteraction();
  }

  /**
   * This function enable selection.
   *
   * @public
   * @function
   * @api stable
   */
  showSelectedLayer() {
    this.getImpl().activateSelection();
  }

  /**
   * Returns selected features array
   *
   * @public
   * @function
   * @api stable
   */
  getSelectedFeatures() {
    return this.selectedFeatures_;
  }

  /**
   * Returns selected OL features array
   *
   * @public
   * @function
   * @api stable
   */
  getSelectedOLFeatures() {
    const olFeatures = [];
    this.selectedFeatures_.forEach((f) => olFeatures.push(f.getImpl().getOLFeature()));
    return olFeatures;
  }

  /**
   * Clean selected features array
   *
   * @public
   * @function
   * @api stable
   */
  removeSelectedFeatures() {
    this.selectedFeatures_ = [];
  }

  /**
   * This function adds a feature to selected features array.
   *
   * @public
   * @function
   * @param {M.Feature} feature
   * @api stable
   */
  addFeatureToSelection(feature) {
    this.selectedFeatures_.push(feature);
  }

  /**
   * Modifies drawing tools, updates inputs, emphasizes selection
   * and shows feature info on select.
   * @public
   * @function
   * @api
   * @param {Event}
   */
  onSelect(e) {
    const MFeatures = this.layer_.getFeatures();
    const olFeatures = e.target.getFeatures().getArray();
    this.selectionLayer.removeFeatures(this.selectionLayer.getFeatures());
    this.removeSelectedFeatures();
    olFeatures.forEach((olFeature) => {
      this.feature = MFeatures.filter((f) => f.getImpl().getOLFeature() === olFeature)[0]
        || undefined;
      if (this.feature) {
        this.addFeatureToSelection(this.feature);
      }
      this.geometry = this.feature.getGeometry().type;
      this.emphasizeSelectedFeature();
    });
    this.managementControl_.refreshSelection();

    if (this.selectedFeatures_.length === 1 && document.querySelector('.m-vectorsmanagement-analysis') !== null) {
      this.managementControl_.analysisControl.showFeatureInfo(this.selectedFeatures_[0]);
    }

    const $edit = document.querySelector('#m-vectorsmanagement-edition');

    if ($edit.classList.contains('activated')) {
      this.enabledButton([...DISABLED_BUTTON_ID_POINT, ...DISABLED_BUTTON_ID_LINE]);
      const referenceEditControl = this.managementControl_.editionControl;

      if (this.selectedFeatures_.length === 1) {
        const geometry = this.selectedFeatures_[0].getGeometry().type;

        if (geometry === 'Point') {
          this.disabledButton(DISABLED_BUTTON_ID_POINT);

          if (referenceEditControl.isHoleActive) {
            referenceEditControl.isHoleActive = false;
            referenceEditControl.getImpl().removeDrawHoleInteraction();
          } else if (referenceEditControl.isRotateActive) {
            referenceEditControl.isRotateActive = false;
            referenceEditControl.getImpl().removeRotateInteraction();
          } else if (referenceEditControl.isScaleActive) {
            referenceEditControl.isScaleActive = false;
            referenceEditControl.getImpl().removeScaleInteraction();
          }
        }

        if (geometry === 'LineString') {
          this.disabledButton(DISABLED_BUTTON_ID_LINE);

          if (referenceEditControl.isHoleActive) {
            referenceEditControl.isHoleActive = false;
            referenceEditControl.getImpl().removeDrawHoleInteraction();
          }
        }
      } else {
        this.disabledButton(DISABLED_BUTTON_ID_LINE);

        if (referenceEditControl.isHoleActive) {
          referenceEditControl.isHoleActive = false;
          referenceEditControl.getImpl().removeDrawHoleInteraction();
        }
      }
    }
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
    if (this.feature) {
      // if point vs text vs else
      if ((this.geometry === 'Point' || this.geometry === 'MultiPoint')) {
        this.emphasis = this.getImpl().getMapeaFeatureClone();

        this.emphasis.setStyle(new M.style.Point({
          radius: 20,
          stroke: {
            color: '#FF0000',
            width: 2,
          },
        }));
      } else {
        // eslint-disable-next-line no-underscore-dangle
        const extent = this.getImpl().getFeatureExtent();
        this.emphasis = M.impl.Feature.olFeature2Facade(this.getImpl().newPolygonFeature(extent));
        this.emphasis.setStyle(new M.style.Line({
          stroke: {
            color: '#FF0000',
            width: 2,
          },
        }));
      }
      this.selectionLayer.addFeatures([this.emphasis]);
    }
  }

  /**
   * This function destroys this control
   *
   * @public
   * @function
   * @api stable
   */
  destroy() {}

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
    // this.template.remove();
    this.getImpl().removeSelectInteraction();
    this.removeSelectedFeatures();
    if (this.selectionLayer) {
      this.selectionLayer.removeFeatures(this.selectionLayer.getFeatures());
    }
    this.selection_ = 'layer';
    this.managementControl_.refreshSelection();

    this.enabledButton([...DISABLED_BUTTON_ID_POINT, ...DISABLED_BUTTON_ID_LINE]);
  }

  disabledButton(IdButtons) {
    IdButtons.forEach((id) => {
      const $button = document.querySelector(`#${id}`);
      $button.setAttribute('disabled', 'disabled');
      $button.classList.add('disabled');

      if ($button.classList.contains('activated')) {
        $button.classList.remove('activated');
      }
    });
  }

  enabledButton(IdButtons) {
    IdButtons.forEach((id) => {
      const $button = document.querySelector(`#${id}`);
      if ($button && $button.classList.contains('disabled')) {
        $button.removeAttribute('disabled');
        $button.classList.remove('disabled');
      }
    });
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
    return control instanceof SelectionControl;
  }
}
