/* eslint-disable no-underscore-dangle */
/**
 * @module M/control/CompareMirrorpanel
 */
import MirrorpanelImplControl from 'impl/cpmirrorpanel';
import template from 'templates/cpmirrorpanel';
import { getValue } from './i18n/language';
import Lyrdropdown from './lyrdropdown'; // e2m: reference LayerDropDown control

/* const objWMTSsiose = new M.layer.WMTS({
  url: 'https://servicios.idee.es/wmts/ocupacion-suelo',
  name: 'LC.LandCoverSurfaces',
  matrixSet: 'GoogleMapsCompatible',
  legend: 'CORINE / SIOSE',
  transparent: false,
  displayInLayerSwitcher: false,
  queryable: false,
  visible: true,
  format: 'image/png',
});

const objWMTSMTN501Edi = new M.layer.WMTS({
  url: 'https://www.ign.es/wmts/primera-edicion-mtn?',
  name: 'mtn50-edicion1',
  legend: 'MTN50 1Edi',
  matrixSet: 'GoogleMapsCompatible',
  transparent: false,
  displayInLayerSwitcher: false,
  queryable: false,
  visible: true,
  format: 'image/jpeg',
});

const objWMTSMapa = new M.layer.WMTS({
  url: 'https://www.ign.es/wmts/mapa-raster',
  name: 'MTN',
  matrixSet: 'GoogleMapsCompatible',
  legend: 'Mapa MTN',
  transparent: false,
  displayInLayerSwitcher: false,
  queryable: false,
  visible: true,
  format: 'image/jpeg',
});

const objWMTSLidar = new M.layer.WMTS({
  url: 'https://wmts-mapa-lidar.idee.es/lidar',
  name: 'EL.GridCoverageDSM',
  matrixSet: 'GoogleMapsCompatible',
  legend: 'Modelo Digital de Superficies LiDAR',
  transparent: true,
  displayInLayerSwitcher: false,
  queryable: false,
  visible: false,
  format: 'image/png',
});

const objTMSIGNBase = new M.layer.XYZ({
  url: 'https://tms-ign-base.idee.es/1.0.0/IGNBaseTodo/{z}/{x}/{-y}.jpeg',
  projection: 'EPSG:3857',
  transparent: false,
  displayInLayerSwitcher: false,
  queryable: false,
  visible: true,
  maxZoom: 19,
});

const objTMSPNOA = new M.layer.XYZ({
  url: 'https://tms-pnoa-ma.idee.es/1.0.0/pnoa-ma/{z}/{x}/{-y}.jpeg',
  projection: 'EPSG:3857',
  transparent: false,
  displayInLayerSwitcher: false,
  queryable: false,
  visible: true,
  maxZoom: 19,
});

const objTMSIGNBaseSoloTextos = new M.layer.XYZ({
  url: 'https://tms-ign-base.idee.es/1.0.0/IGNBaseOrto/{z}/{x}/{-y}.png',
  projection: 'EPSG:3857',
  transparent: false,
  displayInLayerSwitcher: false,
  queryable: false,
  visible: true,
  maxZoom: 19,
});

const BASE_LAYERS_CONFIG = {
  position: 'TR',
  collapsible: true,
  collapsed: true,
  layerId: 0,
  layerVisibility: true,
  columnsNumber: 4,
  layerOpts: [
    {
      id: 'MAPAMTN',
      preview: 'https://i.ibb.co/cL76yjr/raster.png',
      title: 'Mapa MTN',
      layers: [objWMTSMapa],
    },
    {
      id: 'mapa',
      preview: 'https://i.ibb.co/DfPrChV/mapa.png',
      title: 'Callejero',
      layers: [objTMSIGNBase],
    },
    {
      id: 'imagen',
      preview: 'https://i.ibb.co/SKn17Yn/image.png',
      title: 'Imagen',
      layers: [objTMSPNOA],
    },
    {
      id: 'hibrido',
      title: 'Híbrido',
      preview: 'https://i.ibb.co/N6jfqwz/hibrido.png',
      layers: [objTMSPNOA, objTMSIGNBaseSoloTextos],
    },
    {
      id: 'lidar',
      preview: 'https://componentes.ign.es/api-core/plugins/backimglayer/images/svqlidar.png',
      title: 'LiDAR',
      layers: [objWMTSLidar],
    },
    {
      id: 'lidar-hibrido',
      title: 'LiDAR híbrido',
      preview: 'https://i.ibb.co/TYZcmkz/lidar.png',
      layers: [objWMTSLidar, objTMSIGNBaseSoloTextos],
    },
    {
      id: 'SIOSE',
      preview: 'https://i.ibb.co/g34dLwz/siose.jpg',
      title: 'SIOSE',
      layers: [objWMTSsiose],
    },
    {
      id: 'MTN501Edi',
      preview: 'https://i.ibb.co/gPNp5g7/mtn501-Edi.jpg',
      title: 'MTN50 1Edi',
      layers: [objWMTSMTN501Edi],
    },
  ],
}; */
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
    this.reverseLayout = values.reverseLayout;
    this.enabledPlugins = values.enabledPlugins;
    this.backImgLayersConfig = values.backImgLayersConfig;
    this.target = values.target;

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
     * Default layers for mirror maps
     * @public
     * @public {Array}
     */
    this.defaultBaseLyrs = values.defaultBaseLyrs;

    /**
     * Nivel mínimo en el que empiezan a cargarse las capas
     * @public
     * @type { integer }
     */
    this.lyrsMirrorMinZindex = values.lyrsMirrorMinZindex;

    /**
     * All layers
     * @public
     * @public {Array}
     */
    this.mirrorLayers = values.mirrorLayers;

    /**
     * Define the control for managing layers
     *
     */

    this.lyDropControlA = new Lyrdropdown({
      position: 'TL',
      // El botón para desplegar/replegar el plugin no aparece (false) o sí aparece(true)
      collapsible: false,
      collapsed: true, // El panel del plugin se muestra desplegado (false) o replegado (true)
      layers: this.defaultBaseLyrs,
      lyrsMirrorMinZindex: this.lyrsMirrorMinZindex,
    });

    this.lyDropControlB = new Lyrdropdown({
      position: 'TL',
      collapsible: false,
      collapsed: true,
      layers: this.defaultBaseLyrs,
      lyrsMirrorMinZindex: this.lyrsMirrorMinZindex,
    });

    this.lyDropControlC = new Lyrdropdown({
      position: 'TL',
      collapsible: false,
      collapsed: true,
      layers: this.defaultBaseLyrs,
      lyrsMirrorMinZindex: this.lyrsMirrorMinZindex,
    });

    this.lyDropControlD = new Lyrdropdown({
      position: 'TL',
      collapsible: false,
      collapsed: true,
      layers: this.defaultBaseLyrs,
      lyrsMirrorMinZindex: this.lyrsMirrorMinZindex,
    });

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
    if (this.mirrorLayers.length > 0) {
      this.mapL.A.addLayers(this.mirrorLayers);
      this.mapL.A.getLayers().forEach((l) => {
        if (l.zindex_ !== 0) { l.setVisible(false); }
      });

      this.mapL.A.addLayers(this.defaultBaseLyrs[0]);
    }

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

      // Button's click events
      this.template.querySelectorAll('button[id^="set-mirror-"]').forEach((button, modeViz) => {
        button.addEventListener('click', (evt) => {
          this.manageVisionPanelByCSSGrid(modeViz);
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
      pluginsControls = (e)
        ? [...pluginsControls, ...e.getControls(), ...e.getPlugins()]
        : pluginsControls;
    });
    pluginsControls.forEach((e) => {
      return (e.changeStyleResponsive)
        ? e.changeStyleResponsive(change)
        : null;
    });
  }

  /**
   * This function shows/hides panel for differents viz options.
   * The mirror maps are launched from here
   *
   */
  manageVisionPanelByCSSGrid(modeViz) {
    const oldModeViz = this.modeViz;
    const map0 = document.getElementById(this.target);
    map0.style.display = 'none';
    document.getElementById('mapjsB').style.display = 'none';
    document.getElementById('mapjsC').style.display = 'none';
    document.getElementById('mapjsD').style.display = 'none';
    document.getElementById('lienzo').classList.remove('reverseMirror');
    this.template.querySelector(`#set-mirror-${oldModeViz}`).classList.remove('buttom-pressed');
    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < 10; i++) {
      document.getElementById('lienzo').classList.remove(`modeViz${i}`);
    }

    document.getElementById('lienzo').classList.add(`modeViz${modeViz}`);
    if (this.reverseLayout) document.getElementById('lienzo').classList.add('reverseMirror');
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

    if (modeViz === 0) {
      const toDelete = this.map_.getPlugins().filter((p) => {
        return p.name === 'lyrdropdown';
      });

      if (toDelete.length > 0) {
        // Se quedaba enganchada la última capa. Ahora parece que va al introducir esta línea
        this.lyDropControlA.deactivate();
        this.map_.removePlugins(toDelete);
      }
    } else {
      // Añado aquí el DropDownLayer del mapa principal
      this.lyDropControlA = new Lyrdropdown({
        position: 'TL',
        collapsible: false,
        collapsed: true,
        layers: this.defaultBaseLyrs,
        lyrsMirrorMinZindex: this.lyrsMirrorMinZindex,
      });

      this.mapL.A.addPlugin(this.lyDropControlA);
    }

    this.modeViz = modeViz;
    this.template.querySelector(`#set-mirror-${modeViz}`).classList.add('buttom-pressed');
    this.map_.refresh();
    if (this.mapL.B !== null) { this.mapL.B.refresh(); }
    if (this.mapL.C !== null) { this.mapL.C.refresh(); }
    if (this.mapL.D !== null) { this.mapL.D.refresh(); }

    // e2m: esta manera de cerrar el panel provocaba que se lanzara el evento
    // deactivateAndActivateMirrorPanel document.querySelector('#m-cp-mirrorpanel > button').click()
    // e2m: de esta manera se oculta el panel y no se lanza el evento, pero es un poco raro
    document.querySelector('#m-cp-mirrorpanel-btn').classList.remove('active');
    document.querySelector('.m-panel-controls .cp-mirrorpanel').classList.remove('hide-panel');

    setTimeout(() => {
      this.changeViewPluginsGrid([3, 4, 7].includes(modeViz));
    }, 500);
  }

  /**
   * Create mirror map object synchro with the main map
   */
  createMapObjects(mapLyr) {
    let pluginFullTOC4map = null;
    let pluginBackImgLayer4map = null;
    let pluginVector = null;

    this.mapL[mapLyr] = M.map({
      container: `mapjs${mapLyr}`,
      center: this.map_.getCenter(),
      projection: `${this.map_.getProjection().code}*${this.map_.getProjection().units}`,
      zoom: this.map_.getZoom(),
    });

    this.mapL[mapLyr].getMapImpl().setView(this.map_.getMapImpl().getView());

    if (this.enabledPlugins) {
      const listaCtrls = this.map_.getControls();
      const listaPlugs = this.map_.getPlugins();

      listaCtrls.forEach((itemCtrl) => {
        if (itemCtrl.name === 'backgroundlayers') {
          this.mapL[mapLyr].addControls(['backgroundlayers']);
        }
      });

      listaPlugs.forEach((itemPlug) => {
        if (itemPlug.metadata_) {
          // FullTOC
          if (itemPlug.metadata_.name === 'FullTOC') {
            pluginFullTOC4map = new M.plugin.FullTOC({
              position: itemPlug.position,
              collapsed: itemPlug.collapsed,
              collapsible: itemPlug.collapsible,
              http: itemPlug.http,
              https: itemPlug.https,
              precharged: itemPlug.precharged,
            });
          }
          // Vector
          if (itemPlug.metadata_.name === 'Vectors') {
            pluginVector = new M.plugin.Vectors({
              position: itemPlug.position,
              collapsed: itemPlug.collapsed,
              collapsible: itemPlug.collapsible,
            });
          }
          if (itemPlug.metadata_.name === 'backimglayer') {
          /**
 * Nota de Jesús: OJO!!
 * El problema del backimglayer venía porque se usaban los mismos objetos capa en ambos mapas
 * y eso provocaba los errores.
 * Se ha sacado una versión específica para el comparador_pnoa con esa definición de capas fija.
 * Las siguientes líneas se han comentado para subir al plugin.
 *
 * ToDO:
 * Lo ideal sería que se le pasara por parámetro como antiguamente, pero como era una cosa urgente
 * he optado por eso por ahora.
 * En el iberpixcompare como todavía se usaba la configuración antigua en la que se le metían las
 * capas por parámetro no daba ese error.
 * Para un futuro lo ideal sería eso, meterlas por parámetro. No le borres nada por si hay que
 * volver a compilar versión con algún cambio.
 *
 */
            /* Para el Comparador PNOA descomentar las dos siguientes líneas y comentar
// la tercera y comentar la definición posterior
// BASE_LAYERS_CONFIG.layerId = mapLyr === 'A' ? 0 : mapLyr === 'B' ? 1 : mapLyr == 'C' ? 2 : 3,
// pluginBackImgLayer4map = new M.plugin.BackImgLayer(BASE_LAYERS_CONFIG); */

            let auxID;
            if (mapLyr === 'A') {
              auxID = 0;
            } else if (mapLyr === 'B') {
              auxID = 1;
            } else if (mapLyr === 'C') {
              auxID = 2;
            } else {
              auxID = 3;
            }
            pluginBackImgLayer4map = new M.plugin.BackImgLayer({
              layerId: auxID,
              layerVisibility: itemPlug.layerVisibility,
              columnsNumber: itemPlug.columnsNumber,
              layerOpts: itemPlug.layerOpts,
            });
          }
        }
      });
    }

    if (this.lyDropControl !== null) {
      if (mapLyr === 'B') {
        this.mapL[mapLyr].addPlugin(this.lyDropControlB);
      }

      if (mapLyr === 'C') {
        this.mapL[mapLyr].addPlugin(this.lyDropControlC);
      }

      if (mapLyr === 'D') {
        this.mapL[mapLyr].addPlugin(this.lyDropControlD);
      }
    }

    // Añadimos plugins secundarios
    if (pluginFullTOC4map !== null) {
      this.mapL[mapLyr].addPlugin(pluginFullTOC4map);
    }

    if (pluginVector !== null) {
      this.mapL[mapLyr].addPlugin(pluginVector);
    }

    if (pluginBackImgLayer4map !== null) {
      this.mapL[mapLyr].addPlugin(pluginBackImgLayer4map);
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

  manageLyrAvailable(lyrList) {
    if (this.lyDropControlA.control_ !== null) {
      this.lyDropControlA.setDisabledLyrs(lyrList);
    }
    if (this.lyDropControlB.control_ !== null) {
      this.lyDropControlB.setDisabledLyrs(lyrList);
    }
    if (this.lyDropControlC.control_ !== null) {
      this.lyDropControlC.setDisabledLyrs(lyrList);
    }
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
}
