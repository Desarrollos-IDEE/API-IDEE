/**
 * @module M/control/GeometryDrawControl
 */

import GeometryDrawImplControl from 'impl/geometrydrawcontrol';
import template from 'templates/geometrydraw';
import drawingTemplate from 'templates/drawing';
import locationDrawingTemplate from 'templates/locationdrawing';
import textDrawTemplate from 'templates/textdraw';
import downloadingTemplate from 'templates/downloading';
import uploadingTemplate from 'templates/uploading';
import shpWrite from 'shp-write';
import tokml from 'tokml';
import * as shp from 'shpjs';
import { getValue } from './i18n/language';

const DEFAULT_TEXT = 'Texto';
const DEFAULT_FONT_COLOR = '#71a7d3';
const DEFAULT_FONT_FAMILY = 'Arial';
const DEFAULT_SIZE = 12;

export default class GeometryDrawControl extends M.Control {
  /**
   * @classdesc
   * Main constructor of the class. Creates a PluginControl
   * control
   *
   * @constructor
   * @extends {M.Control}
   * @api stable
   */
  constructor() {
    if (M.utils.isUndefined(GeometryDrawImplControl)) {
      M.exception('La implementación usada no puede crear controles GeometryDrawControl');
    }

    const impl = new GeometryDrawImplControl();
    super(impl, 'GeometryDraw');

    // facade control goes to impl as reference param
    impl.facadeControl = this;

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
     * Checks if text drawing tool is active.
     * @private
     * @type {Boolean}
     */
    this.isTextActive = false;

    /**
     * Checks if edition tool is active.
     * @private
     * @type {Boolean}
     */
    this.isEditionActive = false;

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
     * Template that expands drawing tools with color and thickness options.
     * @private
     * @type {String}
     */
    this.drawingTools = undefined;

    /**
     * Template that expands drawing tools with color and thickness options by location
     * @private
     * @type {String}
     */
    this.locationDrawingTools = undefined;

    /**
     * Template with downloading format options.
     * @private
     * @type {String}
     */
    this.downloadingTemplate = undefined;

    /**
     * Template with uploading format options.
     * @private
     * @type {String}
     */
    this.uploadingTemplate = undefined;

    /**
     * Template with text feature drawing tools.
     * @private
     * @type {String}
     */
    this.textDrawTemplate = undefined;

    /**
     * Current color for drawing features.
     * @private
     * @type {String}
     */
    this.currentColor = undefined;

    /**
     * Current line thickness (or circle radius) for drawing features.
     * @private
     * @type {Number}
     */
    this.currentThickness = undefined;

    /**
     * Current feature name / description text.
     * @private
     * @type {String}
     */
    this.textContent = 'Texto';

    /**
     * Current text feature font color.
     * @private
     * @type {String}
     */
    this.fontColor = '#F00';

    /**
     * Current text feature font size.
     * @private
     * @type {String}
     */
    this.fontSize = '12';

    /**
     * Current text feature font family.
     * @private
     * @type {String}
     */
    this.fontFamily = 'Verdana';

    /**
     * SRS of the input coordinates.
     * @private
     * @type {String}
     */
    this.srs = 'EPSG:4258';

    /**
     * Longitude of the input coordinates.
     * @private
     * @type {String}
     */
    this.x = undefined;

    /**
     * Latitude of the input coordinates.
     * @private
     * @type {String}
     */
    this.y = undefined;

    /**
     * Saves drawing layer ( __ draw__) from Mapea.
     * @private
     * @type {*} - Mapea layer
     */
    this.drawLayer = undefined;

    /**
     * File to upload.
     * @private
     * @type {*}
     */
    this.file_ = null;

    /**
     * Mapea layer where a square will be drawn around selected feature.
     * @private
     * @type {*}
     */
    this.selectionLayer = new M.layer.Vector({
      extract: false,
      name: 'selectLayer',
      source: this.getImpl().newVectorSource(true),
    }, { displayInLayerSwitcher: false });
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
    // eslint-disable-next-line
    console.warn(getValue('exception.obsolete'));
    this.map = map;
    this.getImpl().setSource();
    return new Promise((success, fail) => {
      const html = M.template.compileSync(template, {
        vars: {
          translations: {
            punto: getValue('punto'),
            coordenadas: getValue('coordenadas'),
            linea: getValue('linea'),
            poligono: getValue('poligono'),
            texto: getValue('texto'),
            editgeometria: getValue('editgeometria'),
            descgeometria: getValue('descgeometria'),
            subircapa: getValue('subircapa'),
            limpiar: getValue('limpiar'),
            color: getValue('color'),
            grosor: getValue('grosor'),
            borrar: getValue('borrar'),
          },
        },
      });
      this.initializeLayers();
      this.createDrawingTemplate();
      this.createTextDrawTemplate();
      this.createDownloadingTemplate();
      this.createUploadingTemplate();
      this.addEvents(html);
      success(html);
    });
  }

  /**
   * Creates text drawing options template.
   *
   * @public
   * @function
   * @api
   */
  createTextDrawTemplate() {
    this.textDrawTemplate = M.template.compileSync(textDrawTemplate, {
      jsonp: true,
      vars: {
        translations: {
          texto: getValue('texto'),
          fuente: getValue('fuente'),
          tamaño: getValue('tamaño'),
          color: getValue('color'),
          eliminar: getValue('eliminar'),
        },
      },
    });

    this.textContent = this.textDrawTemplate.querySelector('#textContent').value;
    this.fontColor = this.textDrawTemplate.querySelector('#fontColor').value;
    this.fontSize = this.textDrawTemplate.querySelector('#fontSize').value;
    this.fontFamily = this.textDrawTemplate.querySelector('#fontFamily').value;

    this.textDrawTemplate.querySelector('#textContent').addEventListener('input', (e) => this.styleChange(e));
    this.textDrawTemplate.querySelector('#fontColor').addEventListener('change', (e) => this.styleChange(e));
    this.textDrawTemplate.querySelector('#fontSize').addEventListener('change', (e) => this.styleChange(e));
    this.textDrawTemplate.querySelector('#fontFamily').addEventListener('change', (e) => this.styleChange(e));
    this.textDrawTemplate.querySelector('button').addEventListener('click', this.deleteSingleFeature.bind(this));
    this.textDrawTemplate.querySelector('button').style.display = 'none';
  }

  /**
   * Creates download options template.
   * @public
   * @function
   * @api
   */
  createDownloadingTemplate() {
    this.downloadingTemplate = M.template.compileSync(downloadingTemplate, {
      jsonp: true,
      vars: {
        translations: {
          descargar: getValue('descargar'),
        },
      },
    });
    this.downloadingTemplate.querySelector('button').addEventListener('click', this.downloadLayer.bind(this));
  }

  /**
   * Creates upload options template.
   *
   * @public
   * @function
   * @api
   */
  createUploadingTemplate() {
    const accept = '.kml, .zip, .gpx, .geojson';
    this.uploadingTemplate = M.template.compileSync(uploadingTemplate, {
      jsonp: true,
      vars: {
        accept,
        translations: {
          ficheros: getValue('ficheros'),
          seleccionar: getValue('seleccionar'),
          cargarcapa: getValue('cargarcapa'),
        },
      },
    });
    const inputFile = this.uploadingTemplate.querySelector('#geometrydraw-uploading>input');
    this.loadBtn_ = this.uploadingTemplate.querySelector('#geometrydraw-uploading button');
    inputFile.addEventListener('change', (evt) => this.changeFile(evt, inputFile.files[0]));
    this.loadBtn_.addEventListener('click', () => {
      this.loadLayer();
    });
    this.loadBtn_.setAttribute('disabled', 'disabled');
  }

  /**
   * Creates drawing options template.
   * @public
   * @function
   * @api
   */
  createDrawingTemplate() {
    this.drawingTools = M.template.compileSync(drawingTemplate, {
      jsonp: true,
      vars: {
        translations: {
          color: getValue('color'),
          grosor: getValue('grosor'),
          borrar: getValue('borrar'),
        },
      },
    });

    this.currentColor = this.drawingTools.querySelector('#colorSelector').value;
    this.currentThickness = this.drawingTools.querySelector('#thicknessSelector').value;

    this.drawingTools.querySelector('#colorSelector').addEventListener('change', (e) => this.styleChange(e));
    this.drawingTools.querySelector('#thicknessSelector').addEventListener('change', (e) => this.styleChange(e));
    this.drawingTools.querySelector('button').addEventListener('click', () => this.deleteSingleFeature());

    this.drawingTools.querySelector('button').style.display = 'none';
  }

  /**
   * Creates location drawing options template.
   * @public
   * @function
   * @api
   */
  createLocationDrawingTemplate() {
    const innerThis = this;
    this.locationDrawingTools = M.template.compileSync(locationDrawingTemplate, {
      jsonp: true,
      vars: {
        translations: {
          color: getValue('color'),
          grosor: getValue('grosor'),
          sistema: getValue('sistema'),
          longitud: getValue('longitud'),
          latitud: getValue('latitud'),
          dibujar: getValue('dibujar'),
          borrar: getValue('borrar'),
        },
      },
    });

    this.currentColor = this.locationDrawingTools.querySelector('#colorSelector').value;
    this.currentThickness = this.locationDrawingTools.querySelector('#thicknessSelector').value;

    this.locationDrawingTools.querySelector('#colorSelector').addEventListener('change', (e) => this.styleChange(e));
    this.locationDrawingTools.querySelector('#thicknessSelector').addEventListener('change', (e) => this.styleChange(e));
    this.locationDrawingTools.querySelector('button#m-geometrydraw-coordinates-delete').addEventListener('click', () => this.deleteSingleFeature());
    this.locationDrawingTools.querySelector('#m-geometrydraw-coordinates-srs').addEventListener('change', (e) => {
      const value = e.target.value;
      if (value === 'EPSG:4258' || value === 'EPSG:4326') {
        this.locationDrawingTools.querySelector('#m-geometrydraw-coordinates-utm').style.display = 'none';
        this.locationDrawingTools.querySelector('#m-geometrydraw-coordinates-latlon').style.display = 'block';
        this.locationDrawingTools.querySelector('#UTM-X').value = '';
        this.locationDrawingTools.querySelector('#UTM-Y').value = '';
      } else {
        this.locationDrawingTools.querySelector('#m-geometrydraw-coordinates-latlon').style.display = 'none';
        this.locationDrawingTools.querySelector('#m-geometrydraw-coordinates-utm').style.display = 'block';
        this.locationDrawingTools.querySelector('#LON').value = '';
        this.locationDrawingTools.querySelector('#LAT').value = '';
      }

      this.srs = value;
    });

    this.locationDrawingTools.querySelector('#LON').addEventListener('change', (e) => {
      const value = e.target.value;
      this.x = value;
    });

    this.locationDrawingTools.querySelector('#LAT').addEventListener('change', (e) => {
      const value = e.target.value;
      this.y = value;
    });

    this.locationDrawingTools.querySelector('#UTM-X').addEventListener('change', (e) => {
      const value = e.target.value;
      this.x = value;
    });

    this.locationDrawingTools.querySelector('#UTM-Y').addEventListener('change', (e) => {
      const value = e.target.value;
      this.y = value;
    });

    this.locationDrawingTools.querySelector('button#m-geometrydraw-coordinates-draw').addEventListener('click', () => {
      const newPointStyle = new M.style.Point({
        radius: innerThis.currentThickness,
        fill: {
          color: innerThis.currentColor,
        },
        stroke: {
          color: 'white',
          width: 2,
        },
      });

      if (innerThis.x !== undefined && innerThis.x.length > 0
          && innerThis.y !== undefined && innerThis.y.length > 0) {
        const parsedX = parseFloat(innerThis.x);
        const parsedY = parseFloat(innerThis.y);
        if (!Number.isNaN(parsedX) && !Number.isNaN(parsedY)) {
          const coordinates = [parsedX, parsedY];
          innerThis.feature = innerThis.getImpl().drawPointFeature(coordinates, innerThis.srs);
          innerThis.feature.setStyle(newPointStyle);
        } else {
          M.dialog.error(getValue('exception.formatocoord'));
        }
      } else {
        M.dialog.error(getValue('exception.introduzcoord'));
      }
    });
  }

  /**
   * Adds event listeners to geometry buttons.
   * @public
   * @function
   * @api
   * @param {String} html - Geometry buttons template.
   */
  addEvents(html) {
    html.querySelector('#pointdrawing').addEventListener('click', (e) => this.geometryBtnClick('Point'));
    html.querySelector('#pointlocateddrawing').addEventListener('click', (e) => this.geometryBtnClick('LocatedPoint'));
    html.querySelector('#linedrawing').addEventListener('click', (e) => this.geometryBtnClick('LineString'));
    html.querySelector('#polygondrawing').addEventListener('click', (e) => this.geometryBtnClick('Polygon'));
    html.querySelector('#textdrawing').addEventListener('click', (e) => this.geometryBtnClick('Text'));
    html.querySelector('#cleanAll').addEventListener('click', () => this.deleteDrawnFeatures());
    html.querySelector('#download').addEventListener('click', () => this.openDownloadOptions());
    html.querySelector('#upload').addEventListener('click', () => this.openUploadOptions());
    html.querySelector('#edit').addEventListener('click', () => this.editBtnClick());
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
      this.geometry = undefined;
      this[clickedGeometry] = false;
      document.getElementById(drawingDiv).classList.remove('activeTool');
    } else {
      this.deactivateDrawing();
      this[clickedGeometry] = true;
      this.geometry = geometry;
      document.getElementById(drawingDiv).classList.add('activeTool');

      if (document.getElementById('drawingtools') !== null) {
        document.getElementById('drawingtools').remove();
      } else if (document.getElementById('textdrawtools') !== null) {
        document.getElementById('textdrawtools').remove();
      } else if (document.getElementById('geometrydraw-uploading') !== null) {
        document.getElementById('geometrydraw-uploading').remove();
      }
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
    if (this.isEditionActive) {
      this.deactivateEdition();
      document.querySelector('#otherBtns>#edit').classList.remove('activeTool');
    }

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
      case 'Text':
        this.activationManager('isTextActive', 'textdrawing', 'Point');
        break;
      default:
    }

    if (geometry === 'LocatedPoint') {
      this.createLocationDrawingTemplate();
    } else {
      this.createDrawingTemplate();
    }

    if (this.isPointActive || this.isLocatedPointActive || this.isLineActive
        || this.isPolygonActive || this.isTextActive) {
      if (this.isTextActive) {
        this.textDrawTemplate.querySelector('#textContent').value = '';
        this.textDrawTemplate.querySelector('button').style.display = 'none';
        document.querySelector('.m-geometrydraw').appendChild(this.textDrawTemplate);
      } else if (this.isLocatedPointActive) {
        document.querySelector('.m-geometrydraw').appendChild(this.locationDrawingTools);
      } else {
        this.drawingTools.querySelector('button').style.display = 'none';
        document.querySelector('.m-geometrydraw').appendChild(this.drawingTools);
      }

      if (geometry !== 'LocatedPoint') {
        this.getImpl().addDrawInteraction();
      }

      if (document.querySelector('#drawingtools #featureInfo') !== null) {
        document.querySelector('#drawingtools #featureInfo').style.display = 'none';
      }

      if (document.querySelector('.m-geometrydraw>#downloadFormat')) {
        document.querySelector('.m-geometrydraw').removeChild(this.downloadingTemplate);
      }
    }
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
        || this.isPolygonActive || this.isTextActive) {
      if (this.isLocatedPointActive) {
        document.querySelector('.m-geometrydraw').removeChild(this.locationDrawingTools);

        this.srs = 'EPSG:4258';
        this.x = undefined;
        this.y = undefined;
      } else {
        if (document.querySelector('.m-geometrydraw #drawingtools') !== null) {
          document.querySelector('.m-geometrydraw').removeChild(this.drawingTools);
        } else if (document.querySelector('.m-geometrydraw #textdrawtools') !== null) {
          document.querySelector('.m-geometrydraw').removeChild(this.textDrawTemplate);
        }

        this.getImpl().removeDrawInteraction();
      }

      this.selectionLayer.removeFeatures([this.emphasis]);
      if ((this.feature !== undefined) && this.feature.getStyle().get('label') !== undefined) {
        this.feature.getStyle().set('fill.opacity', 0);
      }

      this.feature = undefined;
      this.isPointActive = false;
      this.isLocatedPointActive = false;
      this.isLineActive = false;
      this.isPolygonActive = false;
      this.isTextActive = false;
      document.getElementById('pointdrawing').classList.remove('activeTool');
      document.getElementById('pointlocateddrawing').classList.remove('activeTool');
      document.getElementById('linedrawing').classList.remove('activeTool');
      document.getElementById('polygondrawing').classList.remove('activeTool');
      document.getElementById('textdrawing').classList.remove('activeTool');
    }
  }

  /**
   * Deactivates edition tool.
   * @public
   * @function
   * @api
   */
  deactivateEdition() {
    if (this.isEditionActive) {
      this.isEditionActive = false;
      this.deactivateSelection();
      if (document.querySelector('#drawingtools #featureInfo') !== null) {
        document.querySelector('#drawingtools #featureInfo').style.display = 'none';
      }
    }
  }

  /**
   * Activates or deactivates feature selection & modify interaction.
   * Deactivates drawing if it's active.
   * @public
   * @function
   * @api
   */
  editBtnClick() {
    if (this.isEditionActive) {
      this.deactivateEdition();
      document.querySelector('#otherBtns>#edit').classList.remove('activeTool');
      this.isEditionActive = false;
    } else {
      this.deactivateDrawing();
      if (document.getElementById('geometrydraw-uploading') !== null) {
        document.getElementById('geometrydraw-uploading').remove();
      }
      this.getImpl().activateSelection();
      this.isEditionActive = true;
      document.querySelector('#otherBtns>#edit').classList.add('activeTool');
    }
  }

  /**
   * Changes style of current feature.
   * @public
   * @function
   * @api
   * @param {Event} e - input on.change
   */
  styleChange(e) {
    if (this.feature) {
      const evtId = e.target.id;

      if (document.querySelector('#colorSelector') !== null) {
        this.currentColor = document.querySelector('#colorSelector').value;
        this.currentThickness = document.querySelector('#thicknessSelector').value;
      } else {
        this.textContent = document.querySelector('#textContent').value;
        this.fontColor = document.querySelector('#fontColor').value;
        this.fontSize = document.querySelector('#fontSize').value;
        this.fontFamily = document.querySelector('#fontFamily').value;
      }

      switch (this.feature.getGeometry().type) {
        case 'Point':
        case 'MultiPoint':
          if (evtId === 'colorSelector' || evtId === 'thicknessSelector') {
            const newPointStyle = new M.style.Point({
              radius: this.currentThickness,
              fill: {
                color: this.currentColor,
              },
              stroke: {
                color: 'white',
                width: 2,
              },
            });
            if (this.feature !== undefined) this.feature.setStyle(newPointStyle);
          } else {
            this.setTextStyle(false);
          }
          break;
        case 'LineString':
        case 'MultiLineString':
          const newLineStyle = new M.style.Line({
            stroke: {
              color: this.currentColor,
              width: this.currentThickness,
            },
          });
          if (this.feature !== undefined) this.feature.setStyle(newLineStyle);
          break;
        case 'Polygon':
        case 'MultiPolygon':
          const newPolygonStyle = new M.style.Polygon({
            fill: {
              color: this.currentColor,
              opacity: 0.2,
            },
            stroke: {
              color: this.currentColor,
              width: this.currentThickness,
            },
          });
          if (this.feature !== undefined) this.feature.setStyle(newPolygonStyle);
          break;
        default:
          break;
      }
    } else if (document.querySelector('#colorSelector') !== null) {
      this.currentColor = document.querySelector('#colorSelector').value;
      this.currentThickness = document.querySelector('#thicknessSelector').value;
    }
  }

  /**
   * Updates input values with selected feature values.
   * @public
   * @function
   * @api
   */
  updateInputValues() {
    if (this.feature) {
      const featureStyle = this.feature.getStyle();
      let featureIsText;

      if (featureStyle !== null) {
        featureIsText = featureStyle.get('label') !== undefined;
      }

      this.geometry = this.feature.getGeometry().type;

      if (featureIsText) {
        const fontProps = featureStyle.get('label.font').split(' ');
        this.fontColor = featureStyle.get('label.color');
        this.textContent = featureStyle.get('label.text');
        if (fontProps[0] === 'bold') {
          this.fontSize = fontProps[1].slice(0, fontProps[1].length - 2);
          this.fontFamily = fontProps[2];
        } else {
          this.fontSize = fontProps[0].slice(0, fontProps[0].length - 2);
          this.fontFamily = fontProps[1];
        }
        this.updateTextInputValues(
          this.textContent,
          this.fontColor,
          this.fontSize,
          this.fontFamily,
        );
      } else {
        this.currentColor = this.getFeatureColor();
        this.currentThickness = this.getFeatureThickness();
        this.drawingTools.querySelector('#colorSelector').value = this.currentColor;
        this.drawingTools.querySelector('#thicknessSelector').value = this.currentThickness;
        document.querySelector('#drawingtools #colorSelector').value = this.currentColor;
        document.querySelector('#drawingtools #thicknessSelector').value = this.currentThickness;
      }
    }
  }

  /**
   * Updates TextDraw menu options with given values.
   * @public
   * @function
   * @api
   * @param {String} content - #textContent
   * @param {String} color - #fontColor
   * @param {String} size - #fontSize
   * @param {String} family - #fontFamily
   */
  updateTextInputValues(content, color, size, family) {
    this.textDrawTemplate.querySelector('#textContent').value = content;
    this.textDrawTemplate.querySelector('#fontColor').value = color;
    this.textDrawTemplate.querySelector('#fontSize').value = size;
    this.textDrawTemplate.querySelector('#fontFamily').value = family;
    document.querySelector('#textdrawtools #textContent').value = content;
    document.querySelector('#textdrawtools #fontColor').value = color;
    document.querySelector('#textdrawtools #fontSize').value = size;
    document.querySelector('#textdrawtools #fontFamily').value = family;
  }

  /**
   * Updates global text drawing variables with current input values.
   * @public
   * @function
   * @api
   */
  updateGlobalsWithInput() {
    const textInput = document.querySelector('#textdrawtools #textContent');
    this.textContent = textInput.value === '' ? 'Texto' : textInput.value;
    this.fontColor = document.querySelector('#textdrawtools #fontColor').value;
    this.fontSize = document.querySelector('#textdrawtools #fontSize').value;
    this.fontFamily = document.querySelector('#textdrawtools #fontFamily').value;
  }

  /**
   * Adds style and source to vector layer.
   * Adds selection layer to map.
   * @public
   * @function
   * @api
   */
  initializeLayers() {
    this.drawLayer = this.map.getLayers()[this.map.getLayers().length - 1];
    // popup desactivated
    this.map.getLayers()[this.map.getLayers().length - 1].getImpl().extract = false;
    this.map.addLayers(this.selectionLayer);
    this.selectionLayer.setZIndex(this.selectionLayer.getZIndex() + 8);
    this.getImpl().setImplSource();
  }

  /**
   * Sets style for text feature.
   * @public
   * @function
   * @api
   * @param {Boolean} defaultTextStyle - whether default style should be used
   */
  setTextStyle(defaultTextStyle) {
    let fontProperties;

    if (defaultTextStyle) {
      this.textContent = DEFAULT_TEXT;
      this.fontColor = DEFAULT_FONT_COLOR;
      this.fontFamily = DEFAULT_FONT_FAMILY;
      this.fontSize = DEFAULT_SIZE;
    }

    if ((this.feature.getStyle() !== null)
      && this.feature.getStyle().get('label.font').split(' ')[0] === 'bold') {
      fontProperties = `bold ${this.fontSize}px ${this.fontFamily}`;
    } else {
      fontProperties = `${this.fontSize}px ${this.fontFamily}`;
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
        color: this.fontColor,
      },
    }));
  }

  /**
   * Checks if textdrawtool box has default input values.
   * @public
   * @function
   * @api
   */
  defaultTextInputValues() {
    const defaults = ['', DEFAULT_FONT_COLOR, DEFAULT_SIZE, DEFAULT_FONT_FAMILY];
    const inputs = document.querySelectorAll('#textdrawtools>label>*');
    let sameStyles = true;
    for (let i = 0; i < inputs.length; i += 1) {
      if (inputs[i].value !== defaults[i]) sameStyles = false;
    }
    return sameStyles;
  }

  /**
   * Sets style for a point, line or polygon feature
   * @public
   * @function
   * @api
   * @param {*} feature
   * @param {*} geometryType - Point / LineString / Polygon
   */
  setFeatureStyle(feature, geometryType) {
    switch (geometryType) {
      case 'Point':
      case 'MultiPoint':
        feature.setStyle(new M.style.Point({
          radius: this.currentThickness,
          fill: {
            color: this.currentColor,
          },
          stroke: {
            color: 'white',
            width: 2,
          },
        }));
        break;
      case 'LineString':
      case 'MultiLineString':
        feature.setStyle(new M.style.Line({
          stroke: {
            color: this.currentColor,
            width: this.currentThickness,
          },
        }));
        break;
      case 'Polygon':
      case 'MultiPolygon':
        feature.setStyle(new M.style.Polygon({
          fill: {
            color: this.currentColor,
            opacity: 0.2,
          },
          stroke: {
            color: this.currentColor,
            width: Number.parseInt(this.currentThickness, 10),
          },
        }));
        break;
      default:
        throw new Error(getValue('exception.geometrianoencontrar'));
    }
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
    const lastFeature = this.feature;
    this.hideTextPoint();
    this.feature = event.feature;
    this.feature = M.impl.Feature.olFeature2Facade(this.feature);
    if (this.geometry === undefined) this.geometry = this.feature.getGeometry().type;

    if (this.geometry === 'Point' && this.isTextActive) {
      this.updateGlobalsWithInput();
      if (lastFeature !== undefined) this.textContent = 'Texto';
      this.setTextStyle(false);
    } else {
      this.setFeatureStyle(this.feature, this.geometry);
    }

    if (this.isTextActive) {
      document.querySelector('.m-geometrydraw #textdrawtools button').style.display = 'block';
    } else {
      document.querySelector('.m-geometrydraw #drawingtools button').style.display = 'block';
    }

    this.map.getLayers()[this.map.getLayers().length - 1].addFeatures(this.feature);

    this.emphasizeSelectedFeature();
    this.showFeatureInfo();
    this.updateInputValues();
  }

  /**
   * Deletes Mapea feature set attributes.
   * @public
   * @function
   * @api
   * @param {Array<M.Feature>} features
   */
  deleteFeatureAttributes(features) {
    const newFeatures = features;
    newFeatures.forEach((feature) => {
      this.getImpl().unsetAttributes(feature);
    });
    return newFeatures;
  }

  /**
   * On select, shows feature info.
   * @public
   * @function
   * @api
   */
  showFeatureInfo() {
    const infoContainer = document.querySelector('#drawingtools #featureInfo');
    if (infoContainer !== null) {
      infoContainer.style.display = 'block';
      infoContainer.innerHTML = '';
    }

    switch (this.geometry) {
      case 'Point':
      case 'MultiPoint':
        const x = this.getImpl().getFeatureCoordinates()[0];
        const y = this.getImpl().getFeatureCoordinates()[1];
        if (infoContainer !== null) {
          infoContainer.innerHTML = `Coordenadas<br/>
          x: ${Math.round(x * 1000) / 1000},<br/>
          y: ${Math.round(y * 1000) / 1000}`;
        }
        break;
      case 'LineString':
      case 'MultiLineString':
        let lineLength = this.getImpl().getFeatureLength();
        let units = 'km';
        if (lineLength > 100) {
          lineLength = Math.round((lineLength / 1000) * 100) / 100;
        } else {
          lineLength = Math.round(lineLength * 100) / 100;
          units = 'm';
        }
        if (infoContainer !== null) infoContainer.innerHTML = `Longitud: ${lineLength} ${units}`;
        break;
      case 'Polygon':
      case 'MultiPolygon':
        let area = this.getImpl().getFeatureArea();
        let areaUnits = `km${'2'.sup()}`;
        if (area > 10000) {
          area = Math.round((area / 1000000) * 100) / 100;
        } else {
          area = Math.round(area * 100) / 100;
          areaUnits = `m${'2'.sup()}`;
        }
        if (infoContainer !== null) infoContainer.innerHTML = `Área: ${area} ${areaUnits}`;
        break;
      default:
        if (document.querySelector('#drawingtools #featureInfo') !== null) {
          document.querySelector('#drawingtools #featureInfo').style.display = 'none';
        }
        break;
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
   * Hides point associated to text feature.
   * @public
   * @function
   * @api
   */
  hideTextPoint() {
    if (this.geometry === 'Point'
      && this.feature
      && this.feature.getStyle().get('label') !== undefined) {
      this.feature.getStyle().set('fill.opacity', 0);
    }
  }

  /**
   * Opens download template
   * @public
   * @function
   * @api
   */
  openDownloadOptions() {
    if (this.drawLayer.getFeatures().length !== 0) {
      if (this.isEditionActive) {
        this.deactivateEdition();
        document.querySelector('#otherBtns>#edit').classList.remove('activeTool');
      }

      this.cleanUploadTemplate();

      this.deactivateDrawing();
      document.querySelector('.m-geometrydraw').appendChild(this.downloadingTemplate);
    } else {
      M.dialog.info(getValue('exception.emptylater'));
    }
  }

  /**
   * Removes upload template and reboots its options.
   * @public
   * @function
   * @api
   */
  cleanUploadTemplate() {
    if (document.querySelector('#geometrydraw-uploading') !== null) {
      document.querySelector('.m-geometrydraw').removeChild(this.uploadingTemplate);
      this.uploadingTemplate.querySelector('#geometrydraw-uploading>input').value = '';
      this.uploadingTemplate.querySelector('#geometrydraw-uploading>p#fileInfo').innerHTML = '';
      this.file_ = '';
      this.loadBtn_.setAttribute('disabled', 'disabled');
    }
  }

  /**
   * Opens upload template
   * @public
   * @function
   * @api
   */
  openUploadOptions() {
    if (this.isEditionActive) {
      this.deactivateEdition();
      document.querySelector('#otherBtns>#edit').classList.remove('activeTool');
    }
    if (document.querySelector('#downloadFormat') !== null) {
      document.querySelector('.m-geometrydraw').removeChild(this.downloadingTemplate);
    }
    this.deactivateDrawing();
    document.querySelector('.m-geometrydraw').appendChild(this.uploadingTemplate);
    this.loadBtn_.setAttribute('disabled', 'disabled');
  }

  /**
   * Parses geojsonLayer removing last item on every coordinate (NaN)
   * before converting the layer to kml.
   * @public
   * @function
   * @api
   * @param {*} geojsonLayer - geojson layer with drawn features
   */
  fixGeojsonKmlBug(geojsonLayer) {
    const newGeojsonLayer = geojsonLayer;
    const features = newGeojsonLayer.features;
    features.forEach((feature) => {
      switch (feature.geometry.type) {
        case 'Point':
          if (Number.isNaN(feature.geometry.coordinates[feature.geometry.coordinates.length - 1])) {
            feature.geometry.coordinates.pop();
          }
          break;
        case 'LineString':
          if (Number
            .isNaN(feature.geometry.coordinates[0][feature.geometry.coordinates[0].length - 1])) {
            feature.geometry.coordinates.map((line) => { return line.pop(); });
          }
          break;
        case 'Poylgon':
        case 'MultiPolygon':
          feature.geometry.coordinates.forEach((coord) => {
            if (feature.geometry.type === 'Polygon'
              && Number.isNaN(coord[0][coord[0].length - 1])) {
              coord.map((c) => {
                c.pop();
                return c;
              });
            } else if (feature.geometry.type === 'MultiPolygon'
              && Number.isNaN(coord[0][0][coord[0][0].length - 1])) {
              coord.forEach((coordsArray) => {
                coordsArray.map((c) => {
                  c.pop();
                  return c;
                });
              });
            }
          });
          break;
        default:
      }
    });

    newGeojsonLayer.features = features;
    return newGeojsonLayer;
  }

  /**
   * Parses geojson before shp download.
   * Changes geometry type to simple when necessary and removes one pair of brackets.
   * @public
   * @function
   * @api
   * @param {*} geojsonLayer - geojson layer with drawn and uploaded features
   */
  parseGeojsonForShp(geojsonLayer) {
    const newGeoJson = geojsonLayer;
    const newFeatures = [];

    geojsonLayer.features.forEach((originalFeature) => {
      const featureType = originalFeature.geometry.type;

      if (featureType.match(/^Multi/)) {
        const features = originalFeature.geometry.coordinates
          .map((simpleFeatureCoordinates, idx) => {
            const newFeature = {
              type: 'Feature',
              id: `${originalFeature.id}${idx}`,
              geometry: {
                type: '',
                coordinates: simpleFeatureCoordinates,
              },
              properties: {},
            };
            switch (featureType) {
              case 'MultiPoint':
                newFeature.geometry.type = 'Point';
                break;
              case 'MultiLineString':
                newFeature.geometry.type = 'LineString';
                break;
              case 'MultiPolygon':
                newFeature.geometry.type = 'Polygon';
                break;
              default:
            }
            return newFeature;
          });
        newFeatures.push(...features);
      } else {
        newFeatures.push(originalFeature);
      }
    });

    newGeoJson.features = newFeatures;
    for (let i = 0; i < newGeoJson.features.length; i += 1) {
      delete newGeoJson.features[i].id;
    }
    return newGeoJson;
  }

  /**
   * Creates vector layer copy of __draw__ layer excluding text features.
   * @public
   * @function
   * @api
   * @returns {M.layer.Vector}
   */
  newNoTextLayer() {
    const newLayer = new M.layer.Vector({ name: 'copia' });
    const noTextFeatures = this.drawLayer.getFeatures().filter((feature) => {
      return feature.getStyle().get('label') === undefined;
    });
    newLayer.addFeatures(noTextFeatures);
    return newLayer;
  }

  /**
   * Downloads draw layer as GeoJSON, kml or gml.
   * @public
   * @function
   * @api
   */
  downloadLayer() {
    const fileName = 'misgeometrias';
    const downloadFormat = this.downloadingTemplate.querySelector('select').value;
    const noTextLayer = this.newNoTextLayer();
    noTextLayer.setVisible(false);
    this.map.addLayers(noTextLayer);
    const geojsonLayer = this.toGeoJSON(noTextLayer); // noTextLayer.toGeoJSON(); when fixed
    this.map.removeLayers(noTextLayer);
    let arrayContent;
    let mimeType;
    let extensionFormat;

    switch (downloadFormat) {
      case 'geojson':
        arrayContent = JSON.stringify(geojsonLayer);
        mimeType = 'geo+json';
        extensionFormat = 'geojson';
        break;
      case 'kml':
        const fixedGeojsonLayer = this.fixGeojsonKmlBug(geojsonLayer);
        arrayContent = tokml(fixedGeojsonLayer);
        mimeType = 'vnd.google-earth.kml+xml';
        extensionFormat = 'kml';
        break;
      case 'shp':
        const json = this.parseGeojsonForShp(geojsonLayer);
        const options = {
          folder: fileName,
          types: {
            point: 'puntos',
            polygon: 'poligonos',
            polyline: 'lineas',
          },
        };
        shpWrite.download(json, options);
        break;
      default:
        M.dialog.error(getValue('exception.ficherosel'));
        break;
    }

    if (downloadFormat !== 'shp') {
      const url = window.URL.createObjectURL(new window.Blob([arrayContent], {
        type: `application/${mimeType}`,
      }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${fileName}.${extensionFormat}`);
      document.body.appendChild(link);
      link.click();
    }

    document.querySelector('.m-geometrydraw').removeChild(this.downloadingTemplate);
  }

  /**
   * Deletes all drawn features.
   * @public
   * @function
   * @api
   */
  deleteDrawnFeatures() {
    this.deactivateDrawing();
    this.deactivateSelection();
    this.drawLayer.removeFeatures(this.drawLayer.getFeatures());
    this.feature = undefined;
    this.geometry = undefined;
    this.selectionLayer.removeFeatures([this.emphasis]);
    if (document.querySelector('#drawingtools #featureInfo') !== null) {
      document.querySelector('#drawingtools #featureInfo').style.display = 'none';
    }
    if (document.querySelector('#otherBtns>#edit') !== null) {
      document.querySelector('#otherBtns>#edit').classList.remove('activeTool');
    }
    if (document.querySelector('.m-geometrydraw>#downloadFormat') !== null) {
      document.querySelector('.m-geometrydraw').removeChild(this.downloadingTemplate);
    }
    this.cleanUploadTemplate();
  }

  /**
   * Deletes selected geometry.
   * @public
   * @function
   * @api
   */
  deleteSingleFeature() {
    const editionMode = this.isEditionActive;
    this.drawLayer.removeFeatures([this.feature]);
    this.feature = undefined;
    this.geometry = undefined;
    this.selectionLayer.removeFeatures([this.emphasis]);
    this.deactivateDrawing();
    this.deactivateSelection();
    if (editionMode) this.getImpl().activateSelection();
  }

  /**
   * Gets given feature thickness.
   * @public
   * @function
   * @api
   */
  getFeatureThickness() {
    const feature = this.feature;
    if (feature.getGeometry().type === 'Point' || feature.getGeometry().type === 'MultiPoint') {
      return feature.getStyle().get('radius');
    }
    return feature.getStyle().get('stroke.width');
  }

  /**
   * Gets given feature color.
   * @public
   * @function
   * @api
   */
  getFeatureColor() {
    const feature = this.feature;
    if (feature.getGeometry().type === 'Point' || feature.getGeometry().type === 'MultiPoint') {
      return feature.getStyle().get('fill.color');
    }
    return feature.getStyle().get('stroke.color');
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
    return control instanceof GeometryDrawControl;
  }

  /* Layer upload */

  /**
   * Changes selected file.
   * @public
   * @function
   * @api
   * @param {Event} evt - file input change event
   * @param {File} file - selected file on file input
   */
  changeFile(evt, file) {
    this.file_ = file;
    this.loadBtn_.setAttribute('disabled', 'disabled');
    if (!M.utils.isNullOrEmpty(file)) {
      if (file.size > 20971520) {
        M.dialog.info(getValue('exception.maxfichero'));
        this.file_ = null;
        document.querySelector('#fileInfo').innerHTML = '';
      } else {
        this.loadBtn_.removeAttribute('disabled');
        document.querySelector('#fileInfo').innerHTML = `Fichero seleccionado: ${file.name}`;
      }
    }
  }

  /**
   * Loads vector layer features on __draw__ (Mapea) layer.
   * @public
   * @function
   * @api
   */
  loadLayer() {
    // eslint-disable-next-line no-bitwise
    const fileExt = this.file_.name.slice((this.file_.name.lastIndexOf('.') - 1 >>> 0) + 2);
    const fileReader = new window.FileReader();
    fileReader.addEventListener('load', (e) => {
      try {
        let features = [];
        if (fileExt === 'zip') {
          // In case of shp group, this unites features
          const geojsonArray = [].concat(shp.parseZip(fileReader.result));
          geojsonArray.forEach((geojson) => {
            const localFeatures = this.getImpl()
              .loadGeoJSONLayer(geojson);
            if (localFeatures) {
              features = features.concat(localFeatures);
            }
          });
        } else if (fileExt === 'kml') {
          features = this.getImpl()
            .loadKMLLayer(fileReader.result, false);
        } else if (fileExt === 'gpx') {
          features = this.getImpl()
            .loadGPXLayer(fileReader.result);
        } else if (fileExt === 'geojson') {
          features = this.getImpl()
            .loadGeoJSONLayer(fileReader.result);
        } else {
          M.dialog.error(getValue('exception.errorfichero'));
          return;
        }
        if (features.length === 0) {
          M.dialog.info(getValue('exception.nodetectado'));
        } else {
          this.getImpl().centerFeatures(features);
        }
      } catch (error) {
        M.dialog.error(getValue('exception.comprobar'));
      }
    });
    if (fileExt === 'zip') {
      fileReader.readAsArrayBuffer(this.file_);
    } else if (fileExt === 'kml' || fileExt === 'gpx' || fileExt === 'geojson') {
      fileReader.readAsText(this.file_);
    } else {
      M.dialog.error(getValue('exception.insertado'));
    }
  }

  /**
   * Turns GeometryCollection features into single geometry features.
   * @public
   * @function
   * @api
   * @param {Array<M.Feature>} features
   */
  geometryCollectionParse(features) {
    const parsedFeatures = [];
    features.forEach((feature) => {
      if (feature.getGeometry().type === 'GeometryCollection') {
        const geometries = feature.getGeometry().geometries;
        geometries.forEach((geometry) => {
          const num = Math.random();
          const newFeature = new M.Feature(`mf${num}`, {
            type: 'Feature',
            id: `gf${num}`,
            geometry: {
              type: geometry.type,
              coordinates: geometry.coordinates,
            },
          });
          parsedFeatures.push(newFeature);
        });
      } else {
        parsedFeatures.push(feature);
      }
    });
    return parsedFeatures;
  }

  /* TO GEOJSON WITH BUG FIXED */

  /**
   * This function gets the geojson representation of the layer
   * @function
   * @api
   */
  toGeoJSON(layer) {
    const code = this.map_.getProjection().code;
    const featuresAsJSON = layer.getFeatures().map((feature) => feature.getGeoJSON());
    return { type: 'FeatureCollection', features: this.geojsonTo4326(featuresAsJSON, code) };
  }

  /**
   * Creates GeoJSON feature from a previous feature and a new set of coordinates.
   * @public
   * @function
   * @api
   * @param {GeoJSON Feature} previousFeature
   * @param {Array} coordinates
   */
  createGeoJSONFeature(previousFeature, coordinates) {
    return {
      ...previousFeature,
      geometry: {
        type: previousFeature.geometry.type,
        coordinates,
      },
    };
  }

  /**
    * Este método transforma coordenadas a EPSG:4326.
    *
    * @function
    * @param {String} type Tipo de geometría.
    * @param {Object} codeProjection Código de proyección actual.
    * @param {Number|Array} coordinates Coordenadas a transformar.
    * @return {Array} Coordenadas transformadas.
    * @public
    * @api
    */
  geometryTypeCoordTransform(type, codeProjection, coordinates) {
    const newCoordinates = [];
    switch (type) {
      case 'Point':
        return this.getImpl().getTransformedCoordinates(codeProjection, coordinates);
      case 'MultiPoint':
      case 'LineString':
        for (let i = 0; i < coordinates.length; i += 1) {
          const newDot = this.getImpl().getTransformedCoordinates(codeProjection, coordinates[i]);
          newCoordinates.push(newDot);
        }
        return newCoordinates;
      case 'MultiLineString':
      case 'Polygon':
        for (let i = 0; i < coordinates.length; i += 1) {
          const group = [];
          for (let j = 0; j < coordinates[i].length; j += 1) {
            const dot = this.getImpl().getTransformedCoordinates(codeProjection, coordinates[i][j]);
            group.push(dot);
          }
          newCoordinates.push(group);
        }
        return newCoordinates;
      case 'MultiPolygon':
        for (let i = 0; i < coordinates.length; i += 1) {
          const group = [];
          for (let j = 0; j < coordinates[i].length; j += 1) {
            const newPolygon = [];
            const aux = coordinates[i][j];
            for (let k = 0; k < aux.length; k += 1) {
              const dot = this.getImpl().getTransformedCoordinates(codeProjection, aux[k]);
              newPolygon.push(dot);
            }
            group.push(newPolygon);
          }
          newCoordinates.push(group);
        }
        return newCoordinates;
      default:
        return newCoordinates;
    }
  }

  /**
   * Converts features coordinates on geojson format to 4326.
   * @public
   * @function
   */
  geojsonTo4326(featuresAsJSON, codeProjection) {
    const jsonResult = [];
    featuresAsJSON.forEach((featureAsJSON) => {
      let jsonFeature;
      if (featureAsJSON.geometry.type !== 'GeometryCollection') {
        const newCoordinates = this.geometryTypeCoordTransform(
          featureAsJSON.geometry.type,
          codeProjection,
          featureAsJSON.geometry.coordinates,
        );
        jsonFeature = this.createGeoJSONFeature(featureAsJSON, newCoordinates);
      } else {
        const collection = featureAsJSON.geometry.geometries.map((g) => {
          return {
            type: g.type,
            coordinates: this.geometryTypeCoordTransform(g.type, codeProjection, g.coordinates),
          };
        });
        jsonFeature = { ...featureAsJSON, geometry: { type: 'GeometryCollection', geometries: collection } };
      }
      jsonResult.push(jsonFeature);
    });
    return jsonResult;
  }

  /**
   * Check whether the value is a JavaScript number.
   *
   * First checks typeof, then self-equality to make sure it is
   * not NaN, then Number.isFinite() to check for Infinity.
   *
   * @public
   * @function
   * @param {*} value - The value to check
   * @return {boolean} Whether that value is a number
   */
  isNumber(value) {
    if (typeof value !== 'number') return false;
    if (value !== Number(value)) return false;
    if (Number.isFinite(value) === false) return false;
    return true;
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
    const MFeatures = this.drawLayer.getFeatures();
    const olFeature = e.target.getFeatures().getArray()[0];

    this.feature = MFeatures.filter((f) => f.getImpl().getOLFeature() === olFeature)[0]
      || undefined;

    this.geometry = this.feature.getGeometry().type;

    if (document.querySelector('.m-geometrydraw #drawingtools') !== null) {
      document.querySelector('.m-geometrydraw').removeChild(this.drawingTools);
    } else if (document.querySelector('.m-geometrydraw #textdrawtools') !== null) {
      document.querySelector('.m-geometrydraw').removeChild(this.textDrawTemplate);
    }

    // if selected feature is a text feature
    if (this.geometry === 'Point'
      && this.feature.getStyle().get('label') !== undefined) {
      document.querySelector('.m-geometrydraw').appendChild(this.textDrawTemplate);
      document.querySelector('.m-geometrydraw>#textdrawtools button').style.display = 'block';
    } else {
      document.querySelector('.m-geometrydraw').appendChild(this.drawingTools);
      document.querySelector('.m-geometrydraw>#drawingtools button').style.display = 'block';
    }

    this.updateInputValues();
    this.emphasizeSelectedFeature();
    this.showFeatureInfo();
  }

  /**
   * Emphasizes selection and shows feature info after feature is modified.
   * @public
   * @function
   * @api
   */
  onModify() {
    this.emphasizeSelectedFeature();
    this.showFeatureInfo();
  }

  /**
   * Deletes features attributes, sets style for features and adds
   * features to drawLayer.
   * @function
   * @public
   * @api
   * @param {Array<M.Feature>} features
   * @return {Array<M.Feature>}
   */
  featuresLoader(features) {
    let newFeatures = features;

    // Avoids future conflicts if different layers are loaded
    newFeatures = this.deleteFeatureAttributes(newFeatures);

    for (let i = 0; i < newFeatures.length; i += 1) {
      this.setFeatureStyle(newFeatures[i], newFeatures[i].getGeometry().type);
    }

    this.drawLayer.addFeatures(newFeatures);
    return newFeatures;
  }

  /**
   * Deactivates selection mode.
   * @public
   * @function
   * @api
   */
  deactivateSelection() {
    if (this.drawLayer) {
      if (document.querySelector('.m-geometrydraw #drawingtools')) {
        document.querySelector('.m-geometrydraw>#drawingtools button').style.display = 'none';
        document.querySelector('.m-geometrydraw').removeChild(this.drawingTools);
      }
      if (document.querySelector('.m-geometrydraw #textdrawtools')) {
        document.querySelector('.m-geometrydraw>#textdrawtools button').style.display = 'none';
        document.querySelector('.m-geometrydraw').removeChild(this.textDrawTemplate);
      }

      this.hideTextPoint();
      this.feature = undefined;
      this.geometry = undefined;
      this.emphasizeSelectedFeature();

      this.getImpl().removeEditInteraction();
      this.getImpl().removeSelectInteraction();
    }
  }
}
