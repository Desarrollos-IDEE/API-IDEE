/* eslint-disable no-underscore-dangle */
/**
 * @module M/control/ComparepanelControl
 */

import ComparepanelImplControl from 'impl/comparepanelcontrol';
import template from 'templates/comparepanel';
import { getValue } from './i18n/language';
import Mirrorpanel from './cpmirrorpanel';
import Timeline from './cptimeline';
import LyrCompare from './cplyrcompare';
import Transparency from './cptransparency';

export default class ComparepanelControl extends M.Control {
  /**
   * @classdesc
   * Main constructor of the class. Creates a PluginControl
   * control
   *
   * @constructor
   * @extends {M.Control}
   * @api stable
   */
  constructor(options) {
    // 1. checks if the implementation can create PluginControl
    if (M.utils.isUndefined(ComparepanelImplControl)) {
      M.exception(getValue('exception'));
    }
    // 2. implementation of this control
    const impl = new ComparepanelImplControl();
    super(impl, 'Comparepanel');
    /**
     * Template
     * @public
     * @type { HTMLElement }
     */
    this.template = null;
    this.baseLayers = options.baseLayers;
    this.position = options.position;
    this.layers = [];
    this.layersPlugins = [];
    this.defaultComparisonMode = options.defaultComparisonMode;
    this.defaultComparisonViz = options.defaultComparisonViz;
    this.previousComparisonMode = '';
    this.actualComparisonMode = '';
    this.urlCover = options.urlCover;
    this.lyrsMirrorMinZindex = options.lyrsMirrorMinZindex;

    this.baseLayers.forEach((e) => this.layers.push(e[2]));
    this.params = [options.mirrorpanelParams, options.timelineParams,
      options.lyrcompareParams, options.transparencyParams];
    this.params.forEach((p) => {
      // eslint-disable-next-line no-param-reassign
      p.position = this.position;
    });

    this.layersPlugins = this.transformToLayers(this.layers, options.map);
    /* eslint-disable no-param-reassign */
    options.mirrorpanelParams.defaultBaseLyrs = this.layers;
    options.mirrorpanelParams.lyrsMirrorMinZindex = this.lyrsMirrorMinZindex;
    // e2m: TimeLine needs this.baseLayers with the time param
    options.timelineParams.intervals = this.baseLayers;
    options.lyrcompareParams.layers = this.layersPlugins;
    options.transparencyParams.layers = this.layersPlugins;
    /* eslint-enable no-param-reassign */

    // e2m: extraemos de las definiciones de capa los nombres de todas las capas
    this.allLayersName = this.layers.map((lyrDef) => {
      if (lyrDef.indexOf('*') >= 0) {
        const lyrAttrib = lyrDef.split('*');
        if (lyrAttrib[0].toUpperCase() === 'WMS') {
          return lyrAttrib[3];
        }
        if (lyrAttrib[0].toUpperCase() === 'WMTS') {
          return lyrAttrib[3];
        }
      }
    });

    this.mirrorpanel = new Mirrorpanel(options.mirrorpanelParams);
    this.timeline = new Timeline(options.timelineParams);

    this.lyrcompare = new LyrCompare(options.lyrcompareParams);
    this.transparency = new Transparency(options.transparencyParams);
    this.panels = [];
    this.plugins = [this.mirrorpanel, this.timeline, this.lyrcompare, this.transparency];

    this.map = null;
    this.lyrCoverture = null;
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
    console.warn(getValue('comparepanel_obsolete'));
    this.map = map;
    return new Promise((success, fail) => {
      const options = {
        jsonp: true,
        vars: {
          translations: {
            tooltipLyr: getValue('tooltipLyr'),
            tooltipMirrorpanel: getValue('tooltipMirrorpanel'),
            tooltipTimeline: getValue('tooltipTimeline'),
            tooltipTransparency: getValue('tooltipTransparency'),
          },
        },
      };

      this.template = M.template.compileSync(template, options);
      success(this.template);
      this.addComparators(map);
    });
  }

  addComparators(map) {
    this.plugins.forEach((p, index) => {
      map.addPlugin(p);
      this.panels.push(p.panel_._element);
      const element = document.querySelector(`.${p.panel_._className} .m-panel-controls`);
      element.classList.add(`cp-${p.name}`);
      document.querySelector(`.${p.panel_._className}`).remove();
      this.template.querySelector(`#m-cp-${p.name}`).append(element);
      if (index === this.plugins.length - 1) {
        this.addButtonEvents();
      }
    });
    this.setComparatorsDefaultStyle();

    if (this.urlCover !== '') {
      this.loadCoverPNOALyr();
    }

    this.onMoveEnd((evt) => {
      if (this.urlCover === '') {
        // e2m: si no hay filtro de comerturas, se pueden elegir todas las capas
        this.mirrorpanel.manageLyrAvailable(this.allLayersName);
        this.lyrcompare.manageLyrAvailable(this.allLayersName);
        this.transparency.manageLyrAvailable(this.allLayersName);
      } else {
        // e2m: si tenemos filtro de coberturas, se evalúan las capas visibles
        this.getCobertura(evt);
      }
    });
  }

  addButtonEvents() {
    this.plugins.forEach((p) => {
      if (p.name === 'mirrorpanel') {
        this.template.querySelector(`#m-cp-${p.name} .cp-button`).addEventListener('click', (e) => {
          this.deactivateAndActivateMirrorPanel(p);
        });
      } else if (p.name === 'lyrcompare') {
        this.template.querySelector(`#m-cp-${p.name} .cp-button`).addEventListener('click', (e) => {
          this.deactivateAndActivateOtherModes(p);
        });
      } else {
        this.template.querySelector(`#m-cp-${p.name} .cp-button`).addEventListener('click', (e) => {
          this.deactivateAndActivateOtherModes(p);
        });
      }
    });

    // e2m: eventos del botón de texto
    this.template.querySelector('#m-cp-testing-btn').addEventListener('click', (e) => {
      this.map.getMapImpl().getLayers().forEach((lyr) => {
        // eslint-disable-next-line no-console
        console.log(lyr.getSource().key_);
      });
    });
  }

  setComparatorsDefaultStyle() {
    if ((this.defaultComparisonMode === 'mirrorpanel') && (this.defaultComparisonViz === 0)) {
      // eslint-disable-next-line no-console
      console.log('Modo defecto');
    } else {
      // this.template.querySelector('#m-cp-' + this.defaultComparisonMode + ' .cp-'
      // + this.defaultComparisonMode).classList.toggle('hide-panel'); // Muestro panel
      // this.template.querySelector('#m-cp-' + this.defaultComparisonMode + ' .cp-button')
      // .classList.toggle('active'); // Añado scolor botón CamparePanel
    }

    this.plugins.forEach((p) => {
      if (p.name === this.defaultComparisonMode) {
        if (p.name === 'transparency') {
          p.setDefaultLayer();
        }
        if (p.name === 'timeline') {
          p.setDefaultLayer(this.defaultComparisonViz);
        }
      }
    });

    this.actualComparisonMode = this.defaultComparisonMode; // mirror - curtain - timeline - spyeye
  }

  deactivateAndActivateMirrorPanel(plugin) {
    this.template.querySelector('#m-cp-mirrorpanel .cp-mirrorpanel').classList.toggle('hide-panel'); // Oculto panel
    this.template.querySelector('#m-cp-mirrorpanel .cp-button').classList.toggle('active'); // Elimino sonbra botón

    this.plugins.forEach((p) => {
      if (p.name !== 'mirrorpanel') {
        this.template.querySelector(`#m-cp-${p.name} .cp-${p.name}`).classList.remove('hide-panel'); // Oculto panel
        this.template.querySelector(`#m-cp-${p.name} .cp-button`).classList.remove('active'); // Elimino sombra botón
      }
      // if (p.name==='lyrcompare'){
      //   if (p.isActive()===true){
      //     p.deactivate();
      //   }
      // }
    });
    /* Aquí no debería hacer nada 👇 */
    if (plugin.name === 'mirrorpanel') {
      this.actualComparisonMode = plugin.name;
      // return;
    }
  }

  deactivateAndActivateOtherModes(plugin) {
    this.actualComparisonMode = plugin.name;
    if (plugin.name === 'mirrorpanel') return;

    this.plugins.forEach((p) => {
      if (p.name !== plugin.name) {
        this.template.querySelector(`#m-cp-${p.name} .cp-${p.name}`).classList.remove('hide-panel');
        this.template.querySelector(`#m-cp-${p.name} .cp-button`).classList.remove('active');
      }
    });
    this.template.querySelector(`#m-cp-${plugin.name} .cp-button`).classList.toggle('active');
    this.template.querySelector(`#m-cp-${plugin.name} .cp-${plugin.name}`).classList.toggle('hide-panel');
  }

  deactivateAndActivateOtherModesDeprecated(plugin) {
    this.actualComparisonMode = plugin.name;
    if (plugin.name === 'mirrorpanel') return;

    // this.plugins.forEach((p) => {
    //   if (p.name === 'mirrorpanel'){
    //     return;
    //   }
    //   if (p.name === 'lyrcompare'){
    //     return;
    //   }
    //   if (p.name !== plugin.name) {
    // this.template.querySelector('#m-cp-'+p.name+' .cp-' + p.name).classList.remove('hide-panel');
    // this.template.querySelector('#m-cp-' + p.name + ' .cp-button').classList.remove('active');
    //     p.deactivate();
    //   } else if (plugin.name !== 'mirrorpanel') {
    //     p.deactivate();
    //   }
    // });
    this.template.querySelector(`#m-cp-${plugin.name} .cp-button`).classList.toggle('active');
    // if (this.template.querySelector('#m-cp-' + plugin.name + ' .cp-button').classList
    //  .contains('active') && plugin.name === 'transparency') {
    //   console.log("3");
    //   plugin.activate();
    // }
    if (this.template.querySelector(`#m-cp-${plugin.name} .cp-button`).classList.contains('active') && plugin.name === 'timeline') {
      plugin.activate();
    }
    this.template.querySelector(`#m-cp-${plugin.name} .cp-${plugin.name}`).classList.toggle('hide-panel');
    this.template.querySelector('#m-cp-mirrorpanel .cp-mirrorpanel').classList.remove('hide-panel'); // Oculto panel
    this.template.querySelector('#m-cp-mirrorpanel .cp-button').classList.remove('active'); // Elimino sombra botón
  }

  /**
   * Transform StringLayers to Mapea M.Layer
   * Entra tantas veces como mapas lienzo activos haya.
   * @public
   * @function
   * @api stable
   * @param {string}
   * @return
   */
  transformToLayers(layers, map) {
    const transform = layers.map((layer) => {
      let newLayer = null;
      if (!(layer instanceof Object)) {
        if (layer.indexOf('*') >= 0) {
          const urlLayer = layer.split('*');
          if (urlLayer[0].toUpperCase() === 'WMS') {
            newLayer = new M.layer.WMS({
              url: urlLayer[2],
              name: urlLayer[3],
              legend: urlLayer[1],
              useCapabilities: urlLayer[4] === 'true' || false,
            });

            if (map.getLayers().filter((l) => newLayer.name.includes(l.name)).length > 0) {
              newLayer = map.getLayers().filter((l) => newLayer.name.includes(l.name))[0];
              newLayer.legend = urlLayer[1] || newLayer.name;
            } else {
              // this.map.addLayers(newLayer);
            }
          } else if (urlLayer[0].toUpperCase() === 'WMTS') {
            /* newLayer = new M.layer.WMTS({
              url: urlLayer[2] + '?',
              name: urlLayer[3],
              legend: urlLayer[1],
              matrixSet: urlLayer[4],
              transparent: true,              // Es una capa Overlay -> zIndex > 0
              displayInLayerSwitcher: false,  // No aparece en el TOC
              queryable: false,               // No GetFeatureInfo
              visibility: false,              // Visible a false por defecto
              format: urlLayer[5],
            }), this.map.addWMTS(newLayer); */

            newLayer = new M.layer.WMTS({
              url: urlLayer[2],
              name: urlLayer[3],
              legend: urlLayer[1],
              matrixSet: urlLayer[4],
              transparent: true, // Es una capa Overlay -> zIndex > 0
              displayInLayerSwitcher: false, // No aparece en el TOC
              queryable: false, // No GetFeatureInfo
              visibility: false, // Visible a false por defecto
              format: urlLayer[5],
              useCapabilities: urlLayer[6] === 'true' || false,
            });
            // this.map.addWMTS(newLayer);
            // this.map.addLayers(newLayer);
          }
        } else {
          const layerByName = map.getLayers().filter((l) => layer.includes(l.name))[0];
          newLayer = this.isValidLayer(layerByName) ? layerByName : null;
        }
      } else if (layer instanceof Object) {
        const layerByObject = map.getLayers().filter((l) => layer.name.includes(l.name))[0];
        newLayer = this.isValidLayer(layerByObject) ? layerByObject : null;
      }

      if (newLayer !== null) {
        if (newLayer.getImpl().getOL3Layer() === null) {
          setTimeout(() => {
            if (newLayer.type === 'WMS' || newLayer.type === 'WMTS') {
              newLayer.load = true;
            } else if (newLayer.facadeLayer_.type === 'WMTS') {
              newLayer.facadeLayer_.load = true;
            }
          }, 1000);
        } else {
          newLayer.load = true;
        }

        newLayer.displayInLayerSwitcher = false;
        newLayer.setVisible(false);
        // Establezco un zIndex a partir del cual se cargan las capas
        newLayer.setZIndex(this.lyrsMirrorMinZindex);
        return newLayer;
      }
      this.layers.remove(layer);
    }, this);

    return (transform[0] === undefined) ? [] : transform;
  }

  /**
       * @public
       * @function
       */
  loadCoverPNOALyr() {
    const estiloPoly = new M.style.Polygon({
      fill: {
        color: 'green',
        opacity: 0.0,
      },
      /* stroke: {
        color: '#FF0000',
        width: 0,
      } */
    });// Estilo no visible

    const optionsLayer = {
      name: 'coverpnoa',
      url: this.urlCover,
    };
    this.lyrCoverture = new M.layer.GeoJSON(optionsLayer, { displayInLayerSwitcher: false });

    // this.map.addLayers(this.lyrCoverture);
    this.lyrCoverture.displayInLayerSwitcher = false;
    this.lyrCoverture.setVisible(true);
    this.lyrCoverture.setStyle(estiloPoly);
  }

  onMoveEnd(callback) {
    const olMap = this.map.getMapImpl();
    olMap.on('moveend', (e) => callback(e));
  }

  getCobertura(evt) {
    const olMap = this.map.getMapImpl();
    const pixelCentral = olMap.getPixelFromCoordinate(olMap.getView().getCenter());
    const lyrAvailable = [];
    olMap.forEachFeatureAtPixel(pixelCentral, (feature, layer) => {
      if (feature.get('layerkey') !== undefined) {
        lyrAvailable.push(feature.get('layerkey'));
      }
    });

    this.mirrorpanel.manageLyrAvailable(lyrAvailable);
    this.lyrcompare.manageLyrAvailable(lyrAvailable);
    this.transparency.manageLyrAvailable(lyrAvailable);
  }

  deactivate() {
    this.plugins.forEach((p, k) => {
      p.deactivate();
      document.querySelector('.m-plugin-comparepanel').parentElement.append(this.panels[k]);
    });

    this.map.removePlugins(this.plugins);
  }

  /**
   * This function compares controls
   *
   * @public
   * @function
   * @param {M.Control} control to compare
   * @api stable
   * @return {Boolean}
   */
  equals(control) {
    return control instanceof ComparepanelControl;
  }
}
