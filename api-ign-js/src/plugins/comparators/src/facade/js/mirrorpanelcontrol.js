/**
 * @module M/control/MirrorpanelControl
 */
import MirrorpanelImplControl from 'impl/mirrorpanel';
import template from 'templates/mirrorpanel';
import { getValue } from './i18n/language';
import dicAccesibilityButtonES from './i18n/accessibility_es';
import dicAccesibilityButtonEN from './i18n/accessibility_en';
import { getNameString } from './utils';

export default class MirrorpanelControl extends M.Control {
  /**
  * @classdesc
  * Main constructor of the class. Creates a PluginControl
  * control
  *
  * @constructor
  * @extends {M.Control}
  * @api stable
  */
  constructor(values, controlsLayers, map, _, comparatorsControls) {
    // 1. checks if the implementation can create PluginControl
    if (M.utils.isUndefined(MirrorpanelImplControl)) {
      M.exception(getValue('exception'));
    }

    // 2. implementation of this control
    const impl = new MirrorpanelImplControl();
    super(impl, 'Mirrorpanel');

    this.map_ = map;

    /**
       * Template
       * @public
       * @type { HTMLElement }
       */
    this.template = null;

    /**
     * Define los iconos de división
     * que se mostrarán.
     * Valores modeViz [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
     * @public
     * @type { Array<Number> }
     * @default [0,1,2,3,4,5,6,7,8,9]
     */
    this.modeVizTypes = values.modeVizTypes;
    if (this.modeVizTypes === undefined) this.modeVizTypes = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

    /**
       * Visual mode
       * @private
       * @type {Number}
       */
    this.defaultCompareViz = values.defaultCompareViz;
    if (this.defaultCompareViz === undefined) this.defaultCompareViz = 0;

    /**
       * Mirror maps with plugins
       * @private
       * @type {boolean}
       */
    this.showCursors = values.showCursors;
    // if (this.showCursors === undefined) this.showCursors = true;

    // Mapas creados según el modo de visualización
    this.mapL = {
      A: this.map_, B: null, C: null, D: null,
    };

    this.lyrCursor = {
      A: null, B: null, C: null, D: null,
    };

    this.featureLyrCursor = {
      A: null, B: null, C: null, D: null,
    };

    this.layerSelected = {
      A: null, B: null, C: null, D: null,
    };

    this.oldClass = '';

    /**
     * Define si el mapa principal se muestra a la derecha
     * @public
     * @type {boolean}
     * @default false
     */
    this.principalMap = values.principalMap;
    if (this.principalMap === undefined) this.principalMap = false;

    /**
     * Define si se añaaden los plugins al mapa
     * @public
     * @type {boolean}
     * @default false
     */
    this.enabledControlsPlugins = values.enabledControlsPlugins;
    if (this.enabledControlsPlugins === undefined) this.enabledControlsPlugins = false;

    // TO-DO ?¿
    this.backImgLayersConfig = values.backImgLayersConfig;

    // eslint-disable-next-line no-underscore-dangle
    this.target = map.getMapImpl().values_.target;

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

    /**
     * Defie las capas de los mapas
     */
    this.controlsLayers = controlsLayers;

    this.layers = this.map_
      .getLayers()
      .filter((l) => l.displayInLayerSwitcher && (l.type === 'WMS' || l.type === 'WMTS'));

    this.lyrSelectorIds = ['mapLASelect', 'mapLBSelect', 'mapLCSelect', 'mapLDSelect'];
    this.maps = ['A', 'B', 'C', 'D'];

    this.dicAccesibilityButton = (M.language.getLang() === 'es') ? dicAccesibilityButtonES : dicAccesibilityButtonEN;

    /**
     * Enabled key functions
     * @type {boolean}
     * @public
     */
    this.enabledKeyFunctions = values.enabledKeyFunctions;
    if (this.enabledKeyFunctions === undefined) this.enabledKeyFunctions = true;

    this.comparatorsControls = comparatorsControls;
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
    // Si es false no existe el botón, se devuelve error
    if (!this.modeVizTypes.includes(this.defaultCompareViz)) {
      M.toast.error(`Error: ${getValue('exception.mirrorDefaultCompareViz')}`);
      this.defaultCompareViz = this.modeVizTypes[0];
    }

    this.modeVizTypes.forEach((n) => {
      if (![0, 1, 2, 3, 4, 5, 6, 7, 8, 9].includes(n)) {
        M.toast.error(`Error: ${getValue('exception.mirrorModeVizTypes')} - ${n}`);
      }
    });

    this.createMapContainers();
    const options = {
      jsonp: true,
      vars: {
        translations: {
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
          selectLayers: getValue('selectLayers'),
          selector: getValue('selector'),
        },
      },
    };

    this.template = M.template.compileSync(template, options);

    html.querySelector('#m-comparators-contents').appendChild(this.template);

    this.createLyrDropDown();

    this.modeVizTypes.forEach((modeViz) => {
      const button = this.template.querySelector(`#set-mirror-${modeViz}`);
      button.style.display = 'initial';

      button.addEventListener('click', ({ target }) => {
        this.createSelectorLayer(this.addValueButton(modeViz));
        this.manageVisionPanelByCSSGrid(modeViz);
        this.changeSpanText(target.id);
      });
    });

    this.manageVisionPanelByCSSGrid(this.defaultCompareViz);
    this.createSelectorLayer(this.addValueButton(this.defaultCompareViz));
    this.changeSpanText(`set-mirror-${this.defaultCompareViz}`);

    if (this.showCursors) {
      this.addLayerCursor('A');
    }

    if (this.enabledKeyFunctions) this.addEventKey_();
  }

  addValueButton(modeViz) {
    if ([1, 2].includes(modeViz)) {
      return ['B'];
    }

    if ([3, 7, 8, 9].includes(modeViz)) {
      return ['B', 'C'];
    }

    if ([4, 5, 6].includes(modeViz)) {
      return ['B', 'C', 'D'];
    }
    return ['A'];
  }

  createLyrDropDown() {
    this.lyrSelectorIds.forEach((id, i) => {
      const select = this.template.querySelector(`#${id}`);
      this.controlsLayers.forEach((layer) => {
        const [type, legendWMS, ,, legendWMTS] = layer.split('*');
        select.innerHTML += (type === 'WMS')
          ? `<option class="lyrDropOptions" value="${layer}">${legendWMS}</option>`
          : `<option class="lyrDropOptions" value="${layer}">${legendWMTS}</option>`;
      });
      select.addEventListener('change', ({ target }) => {
        this.changeLayer(target);
      });
    });
  }

  /**
   * This function destroys this control
   *
   * @public
   * @function
   * @api stable
   */
  destroy() {
    document.removeEventListener('keydown', (zEvent) => { });
    this.removeMaps();
    this.destroyMapsContainer();
    [
      this.control_,
      this.panel_,
      this.map_,
      this.collapsible,
      this.collapsed,
      this.modeViz,
      this.enabledPlugins,
      this.enabledKeyFunctions,
      this.showCursors,
      this.mirrorLayers,
      this.defaultBaseLyrs,
      this.backImgLayersParams,
      this.interface] = [null, null, null, null, null,
      null, null, null, null, null, null, null, null];
  }

  removeAllLayers() {
    this.maps.forEach((map) => {
      if (this.layerSelected[map] !== null) {
        const [type, nameWMS, , , nameWMTS] = this.layerSelected[map].split('*');
        if (type === 'WMS') this.mapL[map].removeWMS({ name: nameWMS });
        if (type === 'WMTS') this.mapL[map].removeWMTS({ name: nameWMTS });
      }
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

    this.removeAllLayers();
    document.removeEventListener('keydown', (zEvent) => { });
    this.removeMaps();

    if (
      !(document.getElementById('mapjsB')
      || document.getElementById('mapjsC')
      || document.getElementById('mapjsD'))
    ) return;

    this.destroyMapsContainer();
    this.template.remove();
  }

  /**
  * Crea los 4 contenedores de los mapas,
  * crea un contenedor padre llamado lienzo y los mete dentro
  */
  createMapContainers() {
    const bigContainer = document.createElement('div');
    bigContainer.id = 'lienzo';
    bigContainer.classList.add('mirrorpanel-grid');
    const mapjsA = document.getElementById(this.target);
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

  changeViewPluginsGrid(change) {
    M.config.MOBILE_WIDTH = (change) ? '2000' : '768';
    let pluginsControls = [];
    Object.entries(this.mapL).forEach(([_, e]) => {
      pluginsControls = (e) ? [...pluginsControls, ...e.getControls(), ...e.getPlugins()]
        : pluginsControls;
    });
    pluginsControls.forEach((e) => ((e.changeStyleResponsive)
      ? e.changeStyleResponsive(change) : null));
  }

  /**
     * This function shows/hides panel for differents viz options.
     * The mirror maps are launched from here
     *
     */
  manageVisionPanelByCSSGrid(modeViz) {
    const oldModeViz = this.defaultCompareViz;
    const map0 = document.getElementById(this.target);
    map0.style.display = 'none';
    document.getElementById('mapjsB').style.display = 'none';
    document.getElementById('mapjsC').style.display = 'none';
    document.getElementById('mapjsD').style.display = 'none';
    document.getElementById('lienzo').classList.remove('reverseMirror');
    this.template.querySelector(`#set-mirror-${oldModeViz}`).classList.remove('activatedComparators');
    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < 10; i++) {
      document.getElementById('lienzo').classList.remove(`modeViz${i}`);
    }

    document.getElementById('lienzo').classList.add(`modeViz${modeViz}`);
    if (this.principalMap) document.getElementById('lienzo').classList.add('reverseMirror');

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

    this.defaultCompareViz = modeViz;
    this.template.querySelector(`#set-mirror-${modeViz}`).classList.add('activatedComparators');
    this.map_.refresh();
    if (this.mapL.B !== null) { this.mapL.B.refresh(); }
    if (this.mapL.C !== null) { this.mapL.C.refresh(); }
    if (this.mapL.D !== null) { this.mapL.D.refresh(); }

    setTimeout(() => {
      this.changeViewPluginsGrid([3, 4, 7].includes(modeViz));
    }, 500);
  }

  /**
   * Crea los selectores de capas
   * @param {Array<String>} modeViz Tipo de visualización
   */
  createSelectorLayer(modeViz) {
    this.lyrSelectorIds.forEach((id, i) => {
      if (i !== 0)document.getElementById(id).parentElement.style.display = 'none';
    });

    modeViz.forEach((map) => {
      document.querySelector(`#mapL${map}Select`).parentElement.style.display = 'initial';
    });
  }

  /**
   * Change span text
   * @param {String} class Texto
   */
  changeSpanText(idButton) {
    const mapsPositions = (this.principalMap) ? 'principalMap' : 'secondaryMap';
    this.dicAccesibilityButton[idButton].forEach(({ id, text }) => {
      document.getElementById(id).innerHTML = text[mapsPositions];
    });
  }

  /**
     * Create mirror map object synchro with the main map
     */
  createMapObjects(mapLyr) {
    this.mapL[mapLyr] = M.map({
      container: `mapjs${mapLyr}`,
      center: this.map_.getCenter(),
      projection: `${this.map_.getProjection().code}*${this.map_.getProjection().units}`,
      zoom: this.map_.getZoom(),
    });

    // Le pasa la referencia del mapa principal al resto de mapas y así permite mover
    // todos los mapas a la vez
    this.mapL[mapLyr].getMapImpl().setView(this.map_.getMapImpl().getView());

    if (this.enabledControlsPlugins) {
      this.addPluginsControls(mapLyr);
    }

    if (this.showCursors) { this.addLayerCursor(mapLyr); }
    this.mapL[mapLyr].refresh();
  }

  createControls(control) {
    const controlsUrl = [
      'scale',
      'scaleline',
      'panzoombar',
      'panzoom',
      'location',
      'getfeatureinfo',
      'rotate',
      'backgroundlayers',
    ];
    return (controlsUrl.includes(control)) ? control : false;
  }

  addPluginsControls(mapLyr) {
    Object.keys(this.enabledControlsPlugins).forEach((k) => {
      Object.keys(this.enabledControlsPlugins[k]).forEach((p) => {
        if (k === 'map2' && mapLyr === 'B') {
          this.addControlsPlugins(mapLyr, p, k);
        } else if (k === 'map3' && mapLyr === 'C') {
          this.addControlsPlugins(mapLyr, p, k);
        } else if (k === 'map4' && mapLyr === 'D') {
          this.addControlsPlugins(mapLyr, p, k);
        }
      });
    });
  }

  addControlsPlugins(mapLyr, p, k) {
    if (p === 'controls') {
      this.mapL[mapLyr].addControls(this.enabledControlsPlugins[k][p]);
    } else {
      try {
        this.mapL[mapLyr].addPlugin(new M.plugin[p](this.enabledControlsPlugins[k][p]));
      } catch (error) {
        M.toast.error('Error: enabledControlsPlugins');
      }
    }
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

  manageLyrAvailable(lyrList) {
    // eslint-disable-next-line no-underscore-dangle
    if (this.lyDropControlA.control_ !== null) {
      this.lyDropControlA.setDisabledLyrs(lyrList);
    }
    // eslint-disable-next-line no-underscore-dangle
    if (this.lyDropControlB.control_ !== null) {
      this.lyDropControlB.setDisabledLyrs(lyrList);
    }
    // eslint-disable-next-line no-underscore-dangle
    if (this.lyDropControlC.control_ !== null) {
      this.lyDropControlC.setDisabledLyrs(lyrList);
    }
    // eslint-disable-next-line no-underscore-dangle
    if (this.lyDropControlD.control_ !== null) {
      this.lyDropControlD.setDisabledLyrs(lyrList);
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
    this.mapL.A = null;
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
   * Cambia la capa del mapa
   * @param {M.map} map Mapa
   * @param {M.layer} layer Capa
   */
  changeLayer(target) {
    const { id, value, selectedIndex } = target;

    const optionSelected = target.options[selectedIndex];
    this.disableSelects(id);

    optionSelected.setAttribute('selected', '');

    if (optionSelected.id.includes('external') && id === 'mapLASelect') {
      this.externalLayersEvt(optionSelected);
      return;
    }

    optionSelected.disabled = true;

    const map = id.split('Select')[0].split('mapL')[1];

    if (!this.mapL[map]) return;

    // ? Si ya existe una capa seleccionada, la oculta.
    const mapSelect = this.layerSelected[map];
    if (mapSelect) {
      const [type, , nameWMTS, nameWMS] = mapSelect.split('*');
      if (type === 'WMS' && this.comparatorsControls.saveLayers.includes(nameWMS)) {
        const wmsLayers = this.mapL[map].getWMS({ name: nameWMS });
        if (wmsLayers.length !== 0) {
          wmsLayers[0].setVisible(false);
        }
      }

      if (type === 'WMTS' && this.comparatorsControls.saveLayers.includes(nameWMTS)) {
        // this.mapL[map].removeWMTS(layerWMTS);
        const wmtsLayers = this.mapL[map].getWMTS({ name: nameWMTS });
        if (wmtsLayers.length !== 0) {
          wmtsLayers[0].setVisible(false);
        }
      }
    }

    // ? No es "ninguna capa" muestra la capa.
    if (value !== 'void') {
      const someSaveLayers = this.comparatorsControls.saveLayers.find((l) => value.includes(`*${l}*`));
      const layerFind = this.mapL[map].getLayers().find((l) => l.name === someSaveLayers);

      if (layerFind) {
        layerFind.setVisible(true);
      } else {
        this.mapL[map].addLayers(value);
      }
      this.layerSelected[map] = value;
    }
  }

  /**
   * Cambia la visibilidad de las capas externas
   * @param {HTMLOptionElement} optionSelected Opción seleccionada
   */
  externalLayersEvt(optionSelected) {
    const name = getNameString(optionSelected.value);
    const layer = this.mapL.A.getLayers().find((l) => l.name === name);
    layer.setVisible(!layer.isVisible());
  }

  /**
   * Deshabilita las opciones de los selectores
   * @param {String} id Id del selector
   */
  disableSelects(id) {
    const elementos = document.querySelectorAll(`#${id} option`);
    elementos.forEach((e) => {
      if (!e.id.includes('external_mapLASelect')) {
        e.disabled = false;
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
    return control instanceof CompareMirrorpanel;
  }

  addEventKey_() {
    // Keybindings for Ctrl + Shift + (F1-F8) / ESC
    document.addEventListener('keydown', (zEvent) => {
      // eslint-disable-next-line no-plusplus
      for (let i = 0; i < 10; i++) {
        if (zEvent.ctrlKey && zEvent.shiftKey && zEvent.key === `F${i + 1}`) {
          if (this.modeVizTypes.includes(i)) { this.manageVisionPanelByCSSGrid(i); }
        }
      }
      const keyStr = ['Control', 'Shift', 'Alt', 'Meta'].includes(zEvent.key) ? '' : zEvent.key;

      const combinedKeys = (zEvent.ctrlKey ? 'Control ' : '')
        + (zEvent.shiftKey ? 'Shift ' : '')
        + (zEvent.altKey ? 'Alt ' : '')
        + (zEvent.metaKey ? 'Meta ' : '') + keyStr;
      if (combinedKeys === 'Escape') {
        this.manageVisionPanelByCSSGrid(0);
      }
    });
  }
}
