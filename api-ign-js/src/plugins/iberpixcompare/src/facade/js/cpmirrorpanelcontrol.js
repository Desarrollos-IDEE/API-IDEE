/**
 * @module M/control/CompareMirrorpanel
 */

import MirrorpanelImplControl from 'impl/cpmirrorpanel';
import template from 'templates/cpmirrorpanel';
import { getValue } from './i18n/language';

export default class CompareMirrorpanel extends M.Control {
  /**
   * @classdesc
   * Main constructor of the class. Creates a PluginControl
   * control
   *
   * @constructor
   * @extends {M.Control}
   * @api stable
   */
  constructor(values) {
    // 1. checks if the implementation can create PluginControl
    if (M.utils.isUndefined(MirrorpanelImplControl)) {
      M.exception(getValue('exception'));
    }

    // 2. implementation of this control
    const impl = new MirrorpanelImplControl();
    super(impl, 'Mirrorpanel');

    /**
     * Template
     * @public
     * @type { HTMLElement }
     */
    this.template = null;

    /**
     * Visual mode
     * @private
     * @type {Number}
     */
    this.modeViz = values.modeViz;

    /**
     * Mirror maps with plugins
     * @private
     * @type {boolean}
     */
    this.showCursors = values.showCursors;

    /**
     * Defining mirror maps variables
     */
    this.mapL = {
      A: null, B: null, C: null, D: null,
    };
    this.lyrCursor = {
      A: null, B: null, C: null, D: null,
    };
    this.featureLyrCursor = {
      A: null, B: null, C: null, D: null,
    };
    this.oldClass = '';

    /**
     * Defining cursor style
     */
    this.styleCursor = new M.style.Point({
      icon: {
        form: M.style.form.CIRCLE,
        fontsize: 0.5,
        radius: 5,
        rotation: 0,
        rotate: false,
        offset: [0, 0],
        color: 'black',
        fill: 'red',
        gradientcolor: '#088A85',
        opacity: 0.8,
      },
    });

    this.backImgLayersConfig = values.backImgLayersConfig;

    this.fullTOCConfig = values.fullTOCConfig;

    this.vectorsConfig = values.vectorsConfig;

    this.order = values.order;

    this.createMapContainers();
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
    if (!M.template.compileSync) {
      M.template.compileSync = (string, options) => {
        let templateCompiled;
        let templateVars = {};
        let parseToHtml;
        if (!M.utils.isUndefined(options)) {
          templateVars = M.utils.extends(templateVars, options.vars);
          parseToHtml = options.parseToHtml;
        }

        const templateFn = Handlebars.compile(string);
        const htmlText = templateFn(templateVars);
        if (parseToHtml !== false) {
          templateCompiled = M.utils.stringToHtml(htmlText);
        } else {
          templateCompiled = htmlText;
        }

        return templateCompiled;
      };
    }

    this.mapL.A = map;
    if (this.showCursors) {
      this.addLayerCursor('A');
    }

    return new Promise((success, fail) => {
      let templateOptions = '';
      templateOptions = {
        jsonp: true,
        vars: {
          translations: {
            titleMirrorpanel: getValue('titleMirrorpanel'),
            modViz0: getValue('modViz0'),
            modViz1: getValue('modViz1'),
            modViz2: getValue('modViz2'),
            modViz3: getValue('modViz3'),
            modViz4: getValue('modViz4'),
            modViz5: getValue('modViz5'),
            modViz6: getValue('modViz6'),
            modViz7: getValue('modViz7'),
            modViz8: getValue('modViz8'),
            modViz9: getValue('modViz9'),
          },
        },
      };

      this.template = M.template.compileSync(template, templateOptions);
      this.accessibilityTab(this.template);

      // Button's click events
      this.template.querySelectorAll('button[id^="set-mirror-"]').forEach((button) => {
        const modeViz = parseInt(button.getAttribute('id').replace('set-mirror-', ''), 10);
        button.addEventListener('click', (evt) => {
          this.manageVisionPanelByCSSGrid(modeViz);
        });

        button.addEventListener('keydown', (evt) => {
          if (evt.keyCode === 13) this.manageVisionPanelByCSSGrid(modeViz);
        });
      });

      success(this.template);
      // Apply default vision
      this.manageVisionPanelByCSSGrid(this.modeViz);
    });
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
    this.manageVisionPanelByCSSGrid(0);
  }

  /**
   * Initial configurations for applying CSS grid.
   *
   */
  createMapContainers() {
    const bigContainer = document.createElement('div');
    bigContainer.id = 'lienzo';
    bigContainer.classList.add('mirrorpanel-grid');

    const mapjsA = document.getElementById('mapjs') || document.getElementById('map');
    this.oldClass = mapjsA.classList.toString();
    mapjsA.parentElement.insertBefore(bigContainer, mapjsA);
    mapjsA.classList.add('mirror1');
    bigContainer.appendChild(mapjsA);

    const mapjsB = document.createElement('div');
    mapjsB.id = 'mapjsB';
    mapjsB.classList.add('mirror2');
    bigContainer.appendChild(mapjsB);

    const mapjsC = document.createElement('div');
    mapjsC.id = 'mapjsC';
    mapjsC.classList.add('mirror3');
    bigContainer.appendChild(mapjsC);

    const mapjsD = document.createElement('div');
    mapjsD.id = 'mapjsD';
    mapjsD.classList.add('mirror4');
    bigContainer.appendChild(mapjsD);
  }

  /**
   * This function shows/hides panel for differents viz options.
   * The mirror maps are launched from here
   *
   */
  manageVisionPanelByCSSGrid(modeViz) {
    const oldModeViz = this.modeViz;
    const map0 = document.getElementById('mapjs') || document.getElementById('map');
    map0.style.display = 'none';
    document.getElementById('mapjsB').style.display = 'none';
    document.getElementById('mapjsC').style.display = 'none';
    document.getElementById('mapjsD').style.display = 'none';
    this.template.querySelector(`#set-mirror-${oldModeViz}`).classList.remove('buttom-pressed');
    for (let i = 0; i < 10; i += 1) {
      document.getElementById('lienzo').classList.remove(`modeViz${i}`);
    }

    document.getElementById('lienzo').classList.add(`modeViz${modeViz}`);
    // Create map objects by modeviz
    if ([1, 2].includes(modeViz)) {
      if (this.mapL.B === null) {
        this.createMapObjects('B');// Create MapB
      }
    }

    if ([3, 7, 8, 9].includes(modeViz)) {
      if (this.mapL.B === null) {
        this.createMapObjects('B');// Create MapB
      }

      if (this.mapL.C === null) {
        this.createMapObjects('C');// Create MapC
      }
    }

    if ([4, 5, 6].includes(modeViz)) {
      if (this.mapL.B === null) {
        this.createMapObjects('B');// Create MapB
      }

      if (this.mapL.C === null) {
        this.createMapObjects('C');// Create MapC
      }

      if (this.mapL.D === null) {
        this.createMapObjects('D');// Create MapD
      }
    }

    this.modeViz = modeViz;
    this.template.querySelector(`#set-mirror-${modeViz}`).classList.add('buttom-pressed');
    this.map_.refresh();
    if (this.mapL.B !== null) { this.mapL.B.refresh(); }
    if (this.mapL.C !== null) { this.mapL.C.refresh(); }
    if (this.mapL.D !== null) { this.mapL.D.refresh(); }
    if (modeViz !== 0) {
      document.querySelector('#m-cp-mirrorpanel > button').click();
      this.disablePrintButtons();
    } else {
      this.enablePrintButtons();
    }
  }

  disablePrintButtons() {
    const printBtn = document.querySelector('.m-printermap .m-panel-btn.icon-impresora');
    const downloadBtn = document.querySelector('.m-georefimage2 .m-panel-btn.icon-descargar');
    if (printBtn !== null) {
      printBtn.disabled = true;
      printBtn.parentNode.title = getValue('print_disabled');
    }

    if (downloadBtn !== null) {
      downloadBtn.disabled = true;
      downloadBtn.parentNode.title = getValue('georef_download_disabled');
    }
  }

  enablePrintButtons() {
    const printBtn = document.querySelector('.m-printermap .m-panel-btn.icon-impresora');
    const downloadBtn = document.querySelector('.m-georefimage2 .m-panel-btn.icon-descargar');
    if (printBtn !== null) {
      printBtn.disabled = false;
      printBtn.parentNode.title = getValue('printmap');
    }

    if (downloadBtn !== null) {
      downloadBtn.disabled = false;
      downloadBtn.parentNode.title = getValue('georef_download');
    }
  }

  /**
   * Create mirror map object synchro with the main map
   */
  createMapObjects(mapLyr) {
    const plugin4map = null;
    const mpBILmap = null;
    this.mapL[mapLyr] = M.map({
      container: `mapjs${mapLyr}`,
      center: this.map_.getCenter(),
      projection: `${this.map_.getProjection().code}*${this.map_.getProjection().units}`,
      zoom: this.map_.getZoom(),
    });

    this.mapL[mapLyr].getMapImpl().setView(this.map_.getMapImpl().getView());
    if (plugin4map !== null) {
      this.mapL[mapLyr].addPlugin(plugin4map);
    }

    if (mpBILmap !== null) {
      this.mapL[mapLyr].addPlugin(mpBILmap);
    }

    if (['B', 'C', 'D'].indexOf(mapLyr) > -1) {
      this.addCommonPlugins(this.mapL[mapLyr], mapLyr);
    }

    if (this.showCursors) { this.addLayerCursor(mapLyr); }
    this.mapL[mapLyr].refresh();
  }

  /**
   * Adding a layer for cursor on Map
   */
  addLayerCursor(mapLyr) {
    // Cursor Layer
    this.lyrCursor[mapLyr] = new M.layer.Vector({
      name: `Coordenadas centro ${mapLyr}`,
    }, { displayInLayerSwitcher: false });

    this.featureLyrCursor[mapLyr] = new M.Feature(`Center${mapLyr}`, {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'Point',
        coordinates: this.mapL[mapLyr].getCenter(),
      },
    });

    this.lyrCursor[mapLyr].addFeatures([this.featureLyrCursor[mapLyr]]);
    this.lyrCursor[mapLyr].setStyle(this.styleCursor);
    this.lyrCursor[mapLyr].setZIndex(5000);
    this.mapL[mapLyr].addLayers(this.lyrCursor[mapLyr]);
    this.mapL[mapLyr].getMapImpl().on('pointermove', (event) => {
      this.lyrCursor[mapLyr].setVisible(false);
      Object.keys(this.featureLyrCursor).forEach((k) => {
        if (k !== mapLyr) {
          if (this.featureLyrCursor[k] !== null) {
            this.lyrCursor[k].setVisible(true);
            this.featureLyrCursor[k].setGeometry({
              type: 'Point',
              coordinates: event.coordinate,
            });
          }
        }
      });
    });
  }

  addCommonPlugins(map, mapLyr) {
    if (M.plugin.BackImgLayer !== undefined && this.backImgLayersConfig.position !== undefined) {
      if (mapLyr === 'B') {
        this.backImgLayersConfig.layerId = 1;
      } else if (mapLyr === 'C') {
        this.backImgLayersConfig.layerId = 2;
      } else if (mapLyr === 'D') {
        this.backImgLayersConfig.layerId = 3;
      } else {
        this.backImgLayersConfig.layerId = 0;
      }

      map.addPlugin(new M.plugin.BackImgLayer(this.backImgLayersConfig));
    }

    if (M.plugin.FullTOC !== undefined && this.fullTOCConfig.position !== undefined) {
      map.addPlugin(new M.plugin.FullTOC(this.fullTOCConfig));
    }

    if (M.plugin.Vectors !== undefined && this.vectorsConfig.position !== undefined) {
      map.addPlugin(new M.plugin.Vectors(this.vectorsConfig));
    }
  }

  /**
   * This function is called to remove the effects
   *
   * @public
   * @function
   * @api stable
   */
  removeMaps() {
    this.mapL.B = null;
    this.mapL.C = null;
    this.mapL.D = null;
  }

  destroyMapsContainer() {
    this.manageVisionPanelByCSSGrid(0);
    // Remove mirrors containers
    document.getElementById('mapjsB').remove();
    document.getElementById('mapjsC').remove();
    document.getElementById('mapjsD').remove();
    // Take the main map out of the container
    const lienzo = document.getElementById('lienzo');
    const mapjsA = document.querySelector('.mirror1');
    lienzo.parentElement.insertBefore(mapjsA, lienzo);
    mapjsA.style.display = 'block';
    mapjsA.classList.remove('mirror1');
    mapjsA.classList = this.oldClass;
    // Load the main container
    document.getElementById('lienzo').remove();
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
    return control instanceof CompareMirrorpanel;
  }

  accessibilityTab(html) {
    html.querySelectorAll('[tabindex="0"]').forEach((el) => el.setAttribute('tabindex', this.order));
  }
}
