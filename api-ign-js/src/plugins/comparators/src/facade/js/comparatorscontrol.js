/**
 * @module M/control/ComparatorsControl
 */
import template from '../../templates/comparators';
import ComparatorsImpl from '../../impl/ol/js/comparators';
import { getValue } from './i18n/language';
import MirrorpanelControl from './mirrorpanelcontrol';
import LyrCompareControl from './lyrcomparecontrol';
import TransparencyControl from './transparencycontrol';
import WindowSyncControl from './windowsynccontrol';
import {
  getNameString, checkLayers, transformToStringLayers, formatearID,
} from './utils';

export default class ComparatorsControl extends M.Control {
  /**
   * Main constructor of the class. Creates a PluginControl
   * control
   *
   * @constructor
   * @extends {M.Control}
   * @api
   */
  constructor(isDraggable, order, options) {
    if (M.utils.isUndefined(ComparatorsImpl)) {
      M.exception(getValue('exception.impl'));
    }

    const impl = new ComparatorsImpl();
    super(impl, 'Comparators');

    /**
     * Option to allow the plugin to be draggable or not
     * @private
     * @type {Boolean}
     */
    this.isDraggable_ = isDraggable || false;

    /**
     * Order of plugin
     * @public
     * @type {Number}
     */
    this.order = order;

    /**
     * Plugin parameters
     * @public
     * @type {Object}
     */
    this.options = options;

    if (!this.options.listLayers) {
      this.options.listLayers = ['WMS*Huellas Sentinel2*https://wms-satelites-historicos.idee.es/satelites-historicos*teselas_sentinel2_espanna*true',
        'WMS*Invierno 2022 falso color natural*https://wms-satelites-historicos.idee.es/satelites-historicos*SENTINEL.2022invierno_432-1184*true',
        'WMS*Invierno 2022 falso color infrarrojo*https://wms-satelites-historicos.idee.es/satelites-historicos*SENTINEL.2022invierno_843*true',
        'WMS*Filomena*https://wms-satelites-historicos.idee.es/satelites-historicos*Filomena*true',
        'WMS*Invierno 2021 falso color natural*https://wms-satelites-historicos.idee.es/satelites-historicos*SENTINEL.2021invierno_432-1184*true',
        'WMS*Invierno 2021 falso color infrarrojo*https://wms-satelites-historicos.idee.es/satelites-historicos*SENTINEL.2021invierno_843*true',
        'WMS*Verano 2021 falso color natural*https://wms-satelites-historicos.idee.es/satelites-historicos*SENTINEL.2021verano_432-1184*true',
        'WMS*Verano 2021 falso color infrarrojo*https://wms-satelites-historicos.idee.es/satelites-historicos*SENTINEL.2021verano_843*true',
        'WMS*Invierno 2020 falso color natural*https://wms-satelites-historicos.idee.es/satelites-historicos*SENTINEL.2020invierno_432-1184*true',
        'WMS*Invierno 2020 falso color infrarrojo*https://wms-satelites-historicos.idee.es/satelites-historicos*SENTINEL.2020invierno_843*true',
        'WMS*Verano 2020 falso color natural*https://wms-satelites-historicos.idee.es/satelites-historicos*SENTINEL.2020verano_432-1184*true',
        'WMS*Verano 2020 falso color infrarrojo*https://wms-satelites-historicos.idee.es/satelites-historicos*SENTINEL.2020verano_843*true',
        'WMS*Invierno 2019 falso color natural*https://wms-satelites-historicos.idee.es/satelites-historicos*SENTINEL.2019invierno_432-1184*true',
        'WMS*Invierno 2019 falso color infrarrojo*https://wms-satelites-historicos.idee.es/satelites-historicos*SENTINEL.2019invierno_843*true',
        'WMS*Verano 2019 falso color natural*https://wms-satelites-historicos.idee.es/satelites-historicos*SENTINEL.2019verano_432-1184*true',
        'WMS*Verano 2019 falso color infrarrojo*https://wms-satelites-historicos.idee.es/satelites-historicos*SENTINEL.2019verano_843*true',
        'WMS*Verano 2018 falso color natural*https://wms-satelites-historicos.idee.es/satelites-historicos*SENTINEL.2018verano_432-1184*true',
        'WMS*Verano 2018 falso color infrarrojo*https://wms-satelites-historicos.idee.es/satelites-historicos*SENTINEL.2018verano_843*true',
        'WMS*Huellas Spot5*https://wms-satelites-historicos.idee.es/satelites-historicos*HuellasSpot5_espanna*true',
        'WMS*2014. Pseudocolor natural*https://wms-satelites-historicos.idee.es/satelites-historicos*SPOT.2014*true',
        'WMS*2013. Pseudocolor natural*https://wms-satelites-historicos.idee.es/satelites-historicos*SPOT.2013*true',
        'WMS*2012. Pseudocolor natural*https://wms-satelites-historicos.idee.es/satelites-historicos*SPOT.2012*true',
        'WMS*2011. Pseudocolor natural*https://wms-satelites-historicos.idee.es/satelites-historicos*SPOT.2011*true',
        'WMS*2009. Pseudocolor natural*https://wms-satelites-historicos.idee.es/satelites-historicos*SPOT.2009*true',
        'WMS*2008. Pseudocolor natural*https://wms-satelites-historicos.idee.es/satelites-historicos*SPOT.2008*true',
        'WMS*2005. Pseudocolor natural*https://wms-satelites-historicos.idee.es/satelites-historicos*SPOT.2005*true',
        'WMS*Huellas Landsat8*https://wms-satelites-historicos.idee.es/satelites-historicos*Landsat_huellas_espanna*true',
        'WMS*Landsat 8 2014. Color natural*https://wms-satelites-historicos.idee.es/satelites-historicos*LANDSAT8.2014_432*true',
        'WMS*Landsat 8 2014. Falso color infrarrojo*https://wms-satelites-historicos.idee.es/satelites-historicos*LANDSAT8.2014_654*true',
        'WMS*Landsat 5 TM 2006. Color natural*https://wms-satelites-historicos.idee.es/satelites-historicos*LANDSAT5.2006_321-543',
        'WMS*Landsat 5 TM 2006. Falso color infrarrojo*https://wms-satelites-historicos.idee.es/satelites-historicos*LANDSAT5.2006_432*true',
        'WMS*Landsat 5 TM 1996. Color natural*https://wms-satelites-historicos.idee.es/satelites-historicos*LANDSAT5.1996_321-543*true',
        'WMS*Landsat 5 TM 1996. Falso color infrarrojo*https://wms-satelites-historicos.idee.es/satelites-historicos*LANDSAT5.1996_432*true',
        'WMS*Landsat 5 TM 1991. Color natural*https://wms-satelites-historicos.idee.es/satelites-historicos*LANDSAT5.1991_321-543*true',
        'WMS*Landsat 5 TM 1991. Falso color infrarrojo*https://wms-satelites-historicos.idee.es/satelites-historicos*LANDSAT5.1991_432*true',
        'WMS*Landsat 5 TM 1986. Color natural*https://wms-satelites-historicos.idee.es/satelites-historicos*LANDSAT5.1986_321-543*true',
        'WMS*Landsat 5 TM 1986. Falso color infrarrojo*https://wms-satelites-historicos.idee.es/satelites-historicos*LANDSAT5.1986_432*true',
        'WMS*Landsat 1 1971-1975. Color natural*https://wms-satelites-historicos.idee.es/satelites-historicos*LANDSAT1_544-574*true',
        'WMS*Landsat 1 1971-1975. Falso color infrarrojo*https://wms-satelites-historicos.idee.es/satelites-historicos*LANDSAT1_654*true',
        'WMS*Fondo*https://wms-satelites-historicos.idee.es/satelites-historicos*fondo*true',
      ];
    }

    this.defaultCompareMode = this.options.defaultCompareMode || false;

    this.mirrorpanelParams = M.utils
      .isUndefined(this.options.mirrorpanelParams) ? true : this.options.mirrorpanelParams;
    if (typeof this.mirrorpanelParams === 'object') {
      this.mirrorpanelParams.enabledKeyFunctions = this.options.enabledKeyFunctions || false;
    }

    this.lyrcompareParams = M.utils
      .isUndefined(this.options.lyrcompareParams) ? true : this.options.lyrcompareParams;

    this.transparencyParams = M.utils
      .isUndefined(this.options.transparencyParams) ? true : this.options.transparencyParams;
    if (typeof this.transparencyParams === 'object') {
      this.transparencyParams.enabledKeyFunctions = this.options.enabledKeyFunctions || false;
    }

    this.windowsyncParams = M.utils.isUndefined(this.options.windowsyncParams)
      ? true
      : this.options.windowsyncParams;

    this.control = null;

    this.enabledDisplayInLayerSwitcher = this.options.enabledDisplayInLayerSwitcher || false;
  }

  /**
   * This function creates the view
   *
   * @public
   * @function
   * @param {M.Map} map to add the control
   * @api
   */
  createView(map) {
    this.map_ = map;
    this.layerDefault = this.map_.getLayers().filter((l) => l.getZIndex() !== 0 && l.name !== '__draw__');
    this.layersPlugin = [];
    this.listLayersString = [];
    this.saveLayers = [];
    this.addLayersEventsMap_();

    if (this.options.listLayers) {
      this.listLayersString = this.options.listLayers
        .map((l) => ((l instanceof Object) ? transformToStringLayers(l, this.map_) : l));
      this.layersPlugin = this.listLayersString;
    }

    if (this.enabledDisplayInLayerSwitcher === true) {
      this.layersPlugin = this.layersPlugin.concat(this.map_
        .getLayers()
        .filter((l) => l.displayInLayerSwitcher && (l.type === 'WMS' || l.type === 'WMTS'))
        .map((l) => transformToStringLayers(l, this.map_)));
      this.addLayersEventsMap_();
      this.removeLayersEventMap_();
      this.defaultLayers_(this.layerDefault);
    }

    // Gestor de los diferentes controles
    this.controls = [{
      id: 'mirrorpanel',
      buttonsID: 'mirrorpanel-btn',
      controlParam: [
        this.mirrorpanelParams,
        this.layersPlugin,
        this.map_,
        this.defaultCompareMode,
        this,
      ],
      controlCreate: (param) => new MirrorpanelControl(...param),
      control: null,
      active: false,
    },
    {
      id: 'lyrcompare',
      buttonsID: 'lyrcompare-btn',
      controlParam: [
        this.lyrcompareParams,
        this.layersPlugin,
        this.map_,
        this,
      ],
      controlCreate: (param) => new LyrCompareControl(...param),
      control: null,
      active: false,
    },
    {
      id: 'transparency',
      buttonsID: 'transparency-btn',
      controlParam: [
        this.transparencyParams,
        this.layersPlugin,
        this.map_,
        this,
      ],
      controlCreate: (param) => new TransparencyControl(...param),
      control: null,
      active: false,
    },
    {
      id: 'windowsync',
      buttonsID: 'windowsync-btn',
      controlParam: [
        this.windowsyncParams,
        this.layersPlugin,
        this.map_,
      ],
      controlCreate: (param) => new WindowSyncControl(...param),
      control: null,
      active: false,
    },
    ];

    return new Promise((success, fail) => {
      const translations = {
        headertitle: getValue('tooltip'),
        mirrorpanelParams_tooltip: this.mirrorpanelParams.tooltip || getValue('tooltipMirrorpanel'),
        lyrcompareParams_tooltip: this.lyrcompareParams.tooltip || getValue('tooltipLyr'),
        transparencyParams_tooltip: this.transparencyParams.tooltip || getValue('tooltipTransparency'),
        windowsyncParams_tooltip: this.windowsyncParams.tooltip || getValue('tooltipWindSync'),
      };
      this.html = M.template.compileSync(template, {
        vars: {
          mirrorpanelParams: this.mirrorpanelParams,
          lyrcompareParams: this.lyrcompareParams,
          transparencyParams: this.transparencyParams,
          windowsyncParams: this.windowsyncParams,
          translations,
        },
      });

      this.controls.forEach(({ buttonsID, controlParam }) => {
        if (controlParam[0]) {
          this.html.querySelector(`#${buttonsID}`).addEventListener('click', ({ target }) => this.event_(target));
          this.html.querySelector(`#${buttonsID}`).addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              this.event_(event.target);
            }
          });
        }
      });

      if (this.isDraggable_) {
        M.utils.draggabillyPlugin(this.getPanel(), '#m-comparators-title');
      }

      this.accessibilityTab_(this.html);

      setTimeout(() => {
        this.defaultCompareMode_();
      }, 500);

      success(this.html);
    });
  }

  /**
   * Este método se encarga de gestionar y activar los controles
   * @param {Node} target
   * @param {M.Control} control
   * @private
   * @function
   * @api stable
   */
  event_(target) {
    this.controls.forEach((c) => {
      const controlObjet = c;
      controlObjet.active = (target.id === controlObjet.buttonsID) ? !controlObjet.active : false;
    });
    this.eventActive_();
  }

  eventActive_() {
    // this.removeLayers_();
    this.controls.forEach((c) => {
      if (c.controlParam[0]) {
        if (c.active) {
          this.html.querySelector(`#${c.buttonsID}`).classList.add('activatedComparators');
          if (c.id === 'lyrcompare' && c.controlParam[1].length < 1) {
            M.toast.error(getValue('exception.notLayers'), null, 6000);
            setTimeout(() => {
              this.map_.addLayers(this.layerDefault);
            }, 500);
            return;
          }

          if (c.id === 'transparency') {
            setTimeout(() => {
              this.map_.getLayers().forEach((l) => !l.isBase && l.setVisible(false));
            }, 1000);
          }

          if (c.id === 'mirrorpanel') {
            this.map_.getLayers().forEach((l) => !l.isBase && l.setVisible(false));
          }

          const control = c.controlCreate(c.controlParam);
          // eslint-disable-next-line no-param-reassign
          c.control = control;
          this.control = control;
          control.active(this.html);
        } else {
          this.html.querySelector(`#${c.buttonsID}`).classList.remove('activatedComparators');
          if (c.control) c.control.deactivate();
          // eslint-disable-next-line no-param-reassign
          c.control = null;
        }
      }
    });
  }

  defaultLayers_() {
    if (!this.controls
      || (!this.controls[0].active && !this.controls[1].active && !this.controls[2].active)) {
      const layerDefault = this.layerDefault;
      setTimeout(() => {
        this.map_.addLayers(layerDefault);
      }, 500);
    }
    // else if (this.layerDefault.length !== 0) {
    //   this.map_.addLayers(this.layerDefault.map((l) => transformToStringLayers(
    //     l,
    //     this.map_,
    //     false,
    //   )));
    // }
  }

  // Añadir las capas que se van añadiendo
  addLayersEventsMap_() {
    const enabledControlsPlugins = this.enabledDisplayInLayerSwitcher;
    [M.evt.ADDED_WMTS, M.evt.ADDED_WMS].forEach((evt) => {
      this.map_.on(evt, (layer) => {
        if (enabledControlsPlugins === true) {
          // mirrror
          if (this.controls[0].active) {
            this.addLayersEventMapMirror_(layer);
          }

          // lyrcompare
          if (this.controls[1].active) {
            const selectes = ['m-lyrcompare-lyrA', 'm-lyrcompare-lyrB', 'm-lyrcompare-lyrC', 'm-lyrcompare-lyrD'];
            this.addNewLayerUpdate_(layer, this.controls[1].control, selectes);
          }

          // transparency
          if (this.controls[2].active) {
            const selectes = ['m-transparency-lyr'];
            this.addNewLayerUpdate_(layer, this.controls[2].control, selectes);
          }

          if (!this.controls[0].active
            && !this.controls[1].active
            && !this.controls[2].active
            && !this.controls[3].active) {
            const [, otherLayers] = checkLayers(layer, this.layersPlugin);

            const layersStringDefault = [];

            otherLayers.forEach((l) => {
              if (l.displayInLayerSwitcher && l.transparent) {
                layersStringDefault.push(transformToStringLayers(l, this.map_, false));
              }
            });

            this.layersPlugin = [...this.layersPlugin, ...layersStringDefault];
            this.layerDefault = [...this.layerDefault, ...layersStringDefault];

            // eslint-disable-next-line
            this.controls.forEach((c) => c
              // eslint-disable-next-line
              .controlParam[1] = [...c.controlParam[1], ...layersStringDefault]);
          }
        }

        layer.forEach((l) => {
          if (!this.saveLayers.includes(l.name)) {
            this.saveLayers.push(l.name);
          }
        });
      });
    });
  }

  addZindex_(layer) {
    if (layer) {
      const searchIndex = this.searchIndex_(layer);
      if (searchIndex !== 0) {
        layer.setZIndex(this.searchIndex_(layer));
      }
    }
  }

  addLayersEventMapMirror_(layer = []) {
    const [activeLayerComparators, otherLayers] = checkLayers(layer, this.layersPlugin);
    this.addZindex_(activeLayerComparators);
    if (otherLayers.length === 0) return;
    otherLayers.forEach((l, i) => {
      if (l.displayInLayerSwitcher && l.transparent) {
        const stringLayer = transformToStringLayers(l, this.map_, false);
        this.layersPlugin.push(stringLayer); // Evitamos poner las mismas
        // mapjsB, mapjsC, mapjsD
        // ${id === 'mapLASelect' && otherLayers.length - 1 === i ? 'selected' : ''}
        ['mapLASelect', 'mapLBSelect', 'mapLCSelect', 'mapLDSelect'].forEach((id) => {
          const select = document.querySelector(`#${id}`);
          const idName = formatearID(l.name).replaceAll('.', '');
          select.innerHTML += `<option 
          ${id === 'mapLASelect' ? 'disabled' : ''} 
          id="${(id === 'mapLASelect') ? `l_${idName}_external_mapLASelect` : `l_${idName}_external`}" 
          class="externalLayers"
          value="${stringLayer}">${l.legend}</option>`;
        });

        this.changeLayersEventMap_(l);
      }
    });
  }

  addNewLayerUpdate_(layer = [], control = undefined, selectes = undefined) {
    const [activeLayerComparators, otherLayers] = checkLayers(layer, this.layersPlugin);
    this.addZindex_(activeLayerComparators);
    if (otherLayers.length === 0) return;

    otherLayers.forEach((l, i) => {
      if (l.displayInLayerSwitcher && l.transparent) {
        const stringLayer = transformToStringLayers(l, this.map_, false);
        this.layersPlugin.push(stringLayer);
        if (selectes !== undefined && control !== undefined) {
          control.addlayersControl(l);
          setTimeout(() => {
            this.addOptions(selectes, l);
          }, 1000);
        }
      }
    });
  }

  addOptions(selects, l) {
    selects.forEach((id) => {
      const select = document.querySelector(`#${id}`);
      select.innerHTML += `<option 
        class="externalLayers"
        value="${l.name}">${l.legend}</option>`;
    });
  }

  // get zIndex this.defaultLayers
  searchIndex_(layer) {
    const { name } = layer;
    let index = this.layerDefault.filter((l) => l.name === name);
    index = (index.length === 0) ? 0 : index[0].getZIndex();
    this.options.listLayers.forEach((l) => {
      if (l.name === name && typeof l === 'object') {
        index = l.getZIndex();
      }
    });
    return index;
  }

  changeLayersEventMap_(layer) {
    const { name } = layer;
    // Se necesita la capa de openlayers para usar el método change
    const ol3Load = new Promise((resolve, reject) => {
      let keyInterval = null;
      const handlerValue = () => {
        if (layer.getImpl().getOL3Layer()) {
          clearInterval(keyInterval);
          resolve(layer.getImpl().getOL3Layer());
        }
      };

      keyInterval = setInterval(handlerValue, 1000);
    });
    ol3Load.then((ol3Layer) => {
      ol3Layer.on('change:visible', ({ oldValue }) => { // false activo
        document.querySelector(`#l_${name}_external_mapLASelect`).disabled = (oldValue !== true);
      });
    });
  }

  // Eliminar las capas que se fueron añadiendo
  removeLayersEventMap_() {
    this.map_.on(M.evt.REMOVED_LAYER, (layer) => {
      if (!(layer instanceof Array)) { return; }
      layer.forEach((l) => {
        this.layersPlugin.forEach((lp) => {
          if (lp.includes(l.url) && lp.includes(l.name)) {
            if (this.controls[0].active) {
              const selectes = ['mapLASelect', 'mapLBSelect', 'mapLCSelect', 'mapLDSelect'];
              selectes.forEach((id) => {
                const select = document.querySelector(`#${id}`);
                [...select.children].forEach((child) => {
                  if (child.value.includes(l.name)
                     && child.value.includes(l.url)
                     && child.disabled) {
                    child.removeAttribute('disabled');
                    select.selectedIndex = 0;
                  }
                });
              });
            }
            /*
            if (this.controls[1].active) {
              const selects = ['m-lyrcompare-lyrA',
              'm-lyrcompare-lyrB', 'm-lyrcompare-lyrC', 'm-lyrcompare-lyrD'];
              selects.forEach((id) => {
                const select = document.querySelector(`#${id}`);
                [...select.children].forEach((child) => {
                  if (child.value === l.name && select.value === l.name) {
                    child.remove();
                    // child.removeAttribute('disabled');
                    select.selectedIndex = select.children.length - 1;
                  }
                });
              });
            }
            */
          }
        });
      });
    });
  }

  /**
   * This function compares controls
   *
   * @public
   * @function
   * @param {M.Control} control to compare
   * @api
   */
  equals(control) {
    return control instanceof ComparatorsControl;
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
    // eventActive_ con if (c.control) c.control.deactivate(); parece haberlo sustituido.
    // activatedComparators podría ser necesario en vez de activated.
    const active = html.querySelector('#m-comparators-previews .activated');
    if (active && !active.id.includes(control)) {
      if (active.id === 'm-comparators-zoomextent') {
        // zoomextentControl no parece existir ahora en este plugin.
        this.zoomextentControl.deactive();
      }
      active.classList.remove('activated');
      const container = document.querySelector('#div-contenedor-comparators');
      if (container && container.children.length > 2) {
        // Borra el div de id="m-comparators-contents" que luego causará problemas.
        container.removeChild(container.children[2]);
      }
    }
  }

  /**
   * This function changes number of tabindex
   *
   * @public
   * @function
   * @param {Node} html
   * @api
   */
  accessibilityTab_(html) {
    html.querySelectorAll('[tabindex="0"]').forEach((el) => el.setAttribute('tabindex', this.order));
  }

  /**
   * This function destroys controls inside this control
   *
   * @public
   * @function
   * @api
   */
  deactivate() {
    this.controls.forEach((c) => {
      if (c.control) { c.control.destroy(); }
    });

    this.order = null;
    this.isDraggable_ = null;
    this.options = null;
    this.defaultCompareMode = null;
    this.mirrorpanelParams = null;
    this.lyrcompareParams = null;
    this.transparencyParams = null;
    this.windowsyncParams = null;
    this.html = null;
    this.map_ = null;
    this.controls = null;
  }

  removeLayers_() {
    this.layersPlugin.forEach((l) => {
      const layerName = getNameString(l);
      const filter = this.map_.getLayers().filter(({ name }) => name === layerName);
      const notLoaded = filter.filter((s) => this.saveLayers.includes(s.name));
      this.map_.removeLayers(notLoaded);
    });
  }

  defaultCompareMode_() {
    if (!this.options.defaultCompareMode || this.options.defaultCompareMode === 'none') return;
    const dic = {
      mirrorpanelParams: 'mirrorpanel',
      lyrcompareParams: 'lyrcompare',
      transparecyParams: 'transparency',
      windowsyncParams: 'windowsync',
    };

    this.controls.forEach((c) => {
      const controlObjet = c;
      controlObjet.active = (dic[this.options.defaultCompareMode] === controlObjet.id)
        ? !controlObjet.active
        : false;
    });

    this.eventActive_();
  }
}
