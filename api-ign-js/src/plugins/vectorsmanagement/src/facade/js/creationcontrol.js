/**
 * @module M/control/CreationControl
 */
import CreationImplControl from '../../impl/ol/js/creationcontrol';
import template from '../../templates/creation';
import { getValue } from './i18n/language';

const DEFAULT_FONT_COLOR = '#71a7d3';
const DEFAULT_FONT_FAMILY = 'Arial';
const DEFAULT_SIZE = 12;
const DEFAULT_COLOR = '#71a7d3';
const DEFAULT_THICKNESS = 6;

export default class CreationControl extends M.Control {
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
    if (M.utils.isUndefined(CreationImplControl)) {
      M.exception(getValue('exception'));
    }

    // 2. implementation of this control
    const impl = new CreationImplControl(map);
    super(impl, 'Creation');

    // facade control goes to impl as reference param
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
     * Checks if point drawing tool is active.
     * @private
     * @type {Boolean}
     */
    this.isPointActive = false;

    /**
     * Checks if located point drawing tool is active.
     * @private
     * @type {Boolean}
     */
    this.isLocatedPointActive = false;

    /**
     * Checks if line drawing tool is active.
     * @private
     * @type {Boolean}
     */
    this.isLineActive = false;

    /**
     * Checks if polygon drawing tool is active.
     * @private
     * @type {Boolean}
     */
    this.isPolygonActive = false;

    /**
     * Checks if figure drawing tool is active.
     * @private
     * @type {Boolean}
     */
    this.isFigureActive = false;

    /**
     * Checks if text drawing tool is active.
     * @private
     * @type {Boolean}
     */
    this.isTextActive = false;

    /**
     * Selected Mapea feature
     * @private
     * @type {M.feature}
     */
    this.feature = undefined;

    /**
     * Feature that is drawn on selection layer around this.feature
     * to emphasize it.
     * @private
     * @type {M.feature}
     */
    this.emphasis = undefined;

    /**
     * Current geometry type selected for drawing.
     * @private
     * @type {String}
     */
    this.geometry = undefined; // Point, LineString, Polygon

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
          creationLayer: getValue('creationLayer'),
          creationPoint: getValue('creationPoint'),
          creationCoordPoint: getValue('creationCoordPoint'),
          creationLine: getValue('creationLine'),
          creationPolygon: getValue('creationPolygon'),
          creationFigure: getValue('creationFigure'),
          creationText: getValue('creationText'),
          creationLongitude: getValue('creationLongitude'),
          creationLatitude: getValue('creationLatitude'),
          draw: getValue('draw'),
          cuadrilatero: getValue('cuadrilatero'),
          circulo: getValue('circulo'),
          triangulo: getValue('triangulo'),
          pentagono: getValue('pentagono'),
          hexagono: getValue('hexagono'),
        },
      },
    });
    html.querySelector('#m-vectorsmanagement-controls').appendChild(this.template);
    this.initializeLayers();
    this.addEvents();
    this.managementControl_.accessibilityTab(this.template);
  }

  /**
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
        source: this.getImpl().getVectorSource(),
      }, { displayInLayerSwitcher: false });
      this.layer_.getImpl().extract = false;
      this.map_.addLayers(this.selectionLayer);
      this.selectionLayer.setZIndex(1045);
    }
  }

  /**
   * This function adds events to template buttons.
   * @public
   * @function
   * @api
   */
  addEvents() {
    this.template.querySelector('#pointdrawing').addEventListener('click', (evt) => this.geometryBtnClick('Point'));

    this.template.querySelector('#pointlocateddrawing').addEventListener('click', (evt) => this.geometryBtnClick('LocatedPoint'));

    this.template.querySelector('#linedrawing').addEventListener('click', (evt) => this.geometryBtnClick('LineString'));

    this.template.querySelector('#polygondrawing').addEventListener('click', (evt) => this.geometryBtnClick('Polygon'));

    this.template.querySelector('#figuredrawing').addEventListener('click', (evt) => this.geometryBtnClick('Figure'));

    this.template.querySelector('#textdrawing').addEventListener('click', (evt) => this.geometryBtnClick('Text'));

    this.template.querySelector('#m-point-coordinates-srs').addEventListener('change', this.srsChangeEvent);

    this.template.querySelector('#m-vectormanagement-coordinates-draw').addEventListener('click', this.drawPointCoords.bind(this));

    this.template.querySelector('#figuresSelector').addEventListener('change', (e) => this.getImpl().changeFigure(e));
  }

  /**
   * This function process change event of located point srs selector.
   * @public
   * @function
   * @param {Event} evt
   * @api
   */
  srsChangeEvent(evt) {
    const units = evt.target.selectedOptions[0].dataset.units;
    const utmCoords = document.querySelector('#m-point-coordinates-utm');
    const latlonCoords = document.querySelector('#m-point-coordinates-latlon');
    if (units === 'd') {
      if (!utmCoords.classList.contains('closed')) {
        utmCoords.classList.add('closed');
      }
      if (latlonCoords.classList.contains('closed')) {
        latlonCoords.classList.remove('closed');
      }
    } else if (units === 'm') {
      if (!latlonCoords.classList.contains('closed')) {
        latlonCoords.classList.add('closed');
      }
      if (utmCoords.classList.contains('closed')) {
        utmCoords.classList.remove('closed');
      }
    }
  }

  /**
   * This function draw point with coordinates.
   * @public
   * @function
   * @api
   */
  drawPointCoords() {
    const selectedSrs = this.template.querySelector('#m-point-coordinates-srs').selectedOptions[0];
    const srs = selectedSrs.value;
    const units = selectedSrs.dataset.units;
    let x;
    let y;

    if (units === 'd') {
      x = this.template.querySelector('#LON').value;
      y = this.template.querySelector('#LAT').value;
    } else {
      x = this.template.querySelector('#UTM-X').value;
      y = this.template.querySelector('#UTM-Y').value;
    }

    if (x !== undefined && x.length > 0
      && y !== undefined && y.length > 0) {
      const parsedX = parseFloat(x);
      const parsedY = parseFloat(y);
      if (!Number.isNaN(parsedX) && !Number.isNaN(parsedY)) {
        const coordinates = [parsedX, parsedY];
        this.feature = this.getImpl().drawPointFeature(coordinates, srs);
        // this.setFeatureStyle(this.feature, 'Point');
      } else {
        M.dialog.error(getValue('exception.formatocoord'));
      }
    } else {
      M.dialog.error(getValue('exception.introduzcoord'));
    }
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
  deactiveBtn(html, control) {
    const active = this.getControlActive(html);
    let clickActivate = false;
    if (!active) {
      return clickActivate;
    }

    if (active) {
      if (active.id === `${control}`) {
        clickActivate = true;
      }
      if (active.id === 'pointlocateddrawing') {
        this.template.querySelector('#m-point-coordinates').classList.add('closed');
      } else if (active.id === 'textdrawing') {
        this.template.querySelector('#m-text-draw').classList.add('closed');
      } else if (active.id === 'figuredrawing') {
        this.template.querySelector('#m-figuretools').classList.add('closed');
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
    if (html.querySelectorAll('.m-vectorsmanagement-creation-container>#creationBtns .activated').length === 0) {
      return false;
    }
    return html.querySelectorAll('.m-vectorsmanagement-creation-container>#creationBtns .activated')[0];
  }

  /**
   * Checks if any drawing button is active and deactivates it,
   * deleting drawing interaction.
   * @public
   * @function
   * @api
   */
  deactivateDrawing() {
    if (this.isPointActive || this.isLocatedPointActive || this.isLineActive
      || this.isPolygonActive || this.isTextActive || this.isFigureActive) {
      if (this.isLocatedPointActive) {
        this.template.querySelector('#m-point-coordinates').classList.add('closed');
      } if (this.isFigureActive) {
        this.template.querySelector('#m-figuretools').classList.add('closed');
        this.getImpl().removeFigureDrawInteraction();
      } else {
        if (this.isTextActive) {
          this.template.querySelector('#m-text-draw').classList.add('closed');
        }
        this.getImpl().removeDrawInteraction();
      }

      this.selectionLayer.removeFeatures(this.selectionLayer.getFeatures());
      this.managementControl_.removeSelectedFeatures();
      if ((this.feature !== undefined) && this.feature.getStyle() && this.feature.getStyle().get('label') !== undefined) {
        this.feature.getStyle().set('fill.opacity', 0);
      }

      this.feature = undefined;
      this.isPointActive = false;
      this.isLocatedPointActive = false;
      this.isLineActive = false;
      this.isPolygonActive = false;
      this.isFigureActive = false;
      this.isTextActive = false;
      const activeControl = this.getControlActive(this.template);
      if (activeControl) {
        activeControl.classList.remove('activated');
      }
    }
  }

  /**
   * Hides/shows tools menu and de/activates drawing.
   * @public
   * @function
   * @api
   * @param {Boolean} clickedGeometry - i.e.isPointActive
   * @param {String} drawingDiv - i.e.pointdrawing
   * @param {String} geometry - geometry type
   */
  activationManager(clickedGeometry, drawingDiv, geometry) {
    // if drawing is active
    if (this[clickedGeometry]) {
      this.deactivateDrawing();
      this[clickedGeometry] = false;
      this.geometry = undefined;
      document.getElementById(drawingDiv).classList.remove('activated');
    } else {
      this.deactivateDrawing();
      this[clickedGeometry] = true;
      this.geometry = geometry;
      document.getElementById(drawingDiv).classList.add('activated');
    }
  }

  /**
   * Shows/hides tools template and
   * adds/removes draw interaction.
   * @public
   * @function
   * @api
   * @param {String} geometry - clicked button geometry type
   */
  geometryBtnClick(geometry) {
    switch (geometry) {
      case 'Point':
        this.activationManager('isPointActive', 'pointdrawing', geometry);
        break;
      case 'LocatedPoint':
        this.activationManager('isLocatedPointActive', 'pointlocateddrawing', geometry);
        break;
      case 'LineString':
        this.activationManager('isLineActive', 'linedrawing', geometry);
        break;
      case 'Polygon':
        this.activationManager('isPolygonActive', 'polygondrawing', geometry);
        break;
      case 'Figure':
        this.activationManager('isFigureActive', 'figuredrawing', 'Polygon');
        break;
      case 'Text':
        this.activationManager('isTextActive', 'textdrawing', 'Point');
        break;
      default:
    }

    if (this.isPointActive || this.isLocatedPointActive || this.isLineActive
      || this.isPolygonActive || this.isFigureActive || this.isTextActive) {
      if (this.isTextActive) {
        this.template.querySelector('#textContent').value = '';
        this.template.querySelector('#m-text-draw').classList.remove('closed');
      } else if (this.isLocatedPointActive) {
        this.template.querySelector('#m-point-coordinates').classList.remove('closed');
      } else if (this.isFigureActive) {
        this.template.querySelector('#m-figuretools').classList.remove('closed');
        this.getImpl().addFigureInteraction();
      }

      if (geometry !== 'LocatedPoint' && geometry !== 'Figure') {
        this.getImpl().addDrawInteraction();
      }
    }
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
    this.getImpl().setVectorSource(this.layer_.getImpl().getOL3Layer().getSource());
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
   * After draw interaction event is over,
   * updates feature style, inputs, adds feature to draw layer,
   * shows feature info and emphasizes it.
   * @public
   * @function
   * @api
   * @param {Event} event - 'drawend' triggering event
   */
  onDraw(event) {
    // const lastFeature = this.feature;
    this.hideTextPoint();
    this.feature = M.impl.Feature.olFeature2Facade(event.feature);
    this.geometry = this.feature.getGeometry().type;

    if (this.geometry === 'Point' && this.isTextActive) {
      this.updateGlobalsWithInput();
      /*
      if (lastFeature !== undefined) {
        console.log('lastFeature !== undefined');
        this.textContent = 'Texto';
      }
      */
      this.setTextStyle();
    } /* else {
      this.setFeatureStyle(this.feature, this.geometry);
    } */
    this.addAttributesToFeature();
    this.layer_.addFeatures(this.feature);

    this.emphasizeSelectedFeature();
  }

  /**
   * Adds same attributes that have features created to new feature
   * @public
   * @function
   * @api
   */
  addAttributesToFeature() {
    const features = this.layer_.getFeatures();
    if (features.length > 0 && features[0].getAttributes()) {
      const keys = Object.keys(features[0].getAttributes());
      const attributes = {};
      keys.forEach((k) => {
        attributes[k] = '';
      });
      this.feature.setAttributes(attributes);
    }
  }

  /**
   * Add drawed feature to layer
   * @public
   * @function
   * @api
   * @param {Event} event - 'drawend' triggering event
   */
  onDrawFigure(event) {
    this.feature = this.getImpl().convertToMFeatures(event.feature);
    this.geometry = this.feature.getGeometry().type;
    this.addAttributesToFeature();
    this.layer_.addFeatures(this.feature);

    this.emphasizeSelectedFeature();
  }

  /**
   * Hides point associated to text feature.
   * @public
   * @function
   * @api
   */
  hideTextPoint() {
    if (this.geometry === 'Point'
      && this.feature && this.feature.getStyle()
      && this.feature.getStyle().get('label') !== undefined) {
      this.feature.getStyle().set('fill.opacity', 0);
    }
  }

  /**
   * Updates global text drawing variables with current input values.
   * @public
   * @function
   * @api
   */
  updateGlobalsWithInput() {
    const textInput = document.querySelector('#m-text-draw #textContent');
    this.textContent = textInput.value === '' ? 'Texto' : textInput.value;
  }

  /**
   * Sets style for text feature.
   * @public
   * @function
   * @api
   */
  setTextStyle() {
    let fontProperties;

    if ((this.feature.getStyle() !== null)
      && this.feature.getStyle().get('label.font').split(' ')[0] === 'bold') {
      fontProperties = `bold ${DEFAULT_SIZE}px ${DEFAULT_FONT_FAMILY}`;
    } else {
      fontProperties = `${DEFAULT_SIZE}px ${DEFAULT_FONT_FAMILY}`;
    }

    this.feature.setStyle(new M.style.Point({
      radius: 3,
      fill: {
        color: '#ff5733',
        opacity: 1,
      },
      stroke: {
        color: '#fdfefe',
        width: 0,
      },
      label: {
        text: this.textContent,
        font: fontProperties,
        color: DEFAULT_FONT_COLOR,
      },
    }));
  }

  /**
   * Sets style for a point, line or polygon feature
   * @public
   * @function
   * @api
   * @param {M.Feature} feature
   * @param {String} geometryType - Point / LineString / Polygon
   */
  setFeatureStyle(feature, geometryType) {
    switch (geometryType) {
      case 'Point':
      case 'MultiPoint':
        feature.setStyle(new M.style.Point({
          radius: DEFAULT_THICKNESS,
          fill: {
            color: DEFAULT_COLOR,
          },
          stroke: {
            color: DEFAULT_COLOR,
            width: 2,
          },
        }));
        break;
      case 'LineString':
      case 'MultiLineString':
        feature.setStyle(new M.style.Line({
          stroke: {
            color: DEFAULT_COLOR,
            width: DEFAULT_THICKNESS,
          },
        }));
        break;
      case 'Polygon':
      case 'MultiPolygon':
        feature.setStyle(new M.style.Polygon({
          fill: {
            color: DEFAULT_COLOR,
            opacity: 0.2,
          },
          stroke: {
            color: DEFAULT_COLOR,
            width: DEFAULT_THICKNESS,
          },
        }));
        break;
      default:
        throw new Error(getValue('exception.geometrianoencontrar'));
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
    this.selectionLayer.removeFeatures(this.selectionLayer.getFeatures());
    this.managementControl_.removeSelectedFeatures();

    if (this.feature) {
      const isTextDrawActive = document.querySelector('#textdrawtools') !== null;

      // if point vs text vs else
      if ((this.geometry === 'Point' || this.geometry === 'MultiPoint') && !isTextDrawActive) {
        this.emphasis = this.getImpl().getMapeaFeatureClone();

        this.emphasis.setStyle(new M.style.Point({
          radius: 20,
          stroke: {
            color: '#FF0000',
            width: 2,
          },
        }));
      } else if ((this.geometry === 'Point' || this.geometry === 'MultiPoint') && isTextDrawActive) {
        if (this.feature.getStyle() === null) this.setTextStyle(false);
        this.feature.getStyle().set('fill.opacity', 1);
      } else {
        // eslint-disable-next-line no-underscore-dangle
        const extent = this.getImpl().getFeatureExtent(this.feature);
        this.emphasis = M.impl.Feature.olFeature2Facade(this.getImpl().newPolygonFeature(extent));
        this.emphasis.setStyle(new M.style.Line({
          stroke: {
            color: '#FF0000',
            width: 2,
          },
        }));
      }
      this.managementControl_.addFeatureToSelection(this.feature);
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
    this.deactivateDrawing();
    if (this.template) {
      this.template.remove();
    }
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
    return control instanceof CreationControl;
  }
}
