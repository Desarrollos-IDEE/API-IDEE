/**
 * @module M/control/TransparencyControl
 */

import TransparencyImplControl from 'impl/transparencycontrol';
import template from 'templates/transparency';
import { getValue } from './i18n/language';
import { transformToLayers } from './utils';

export default class TransparencyControl extends M.Control {
  /**
    * @classdesc
    * Main constructor of the class. Creates a PluginControl
    * control
    *
    * @constructor
    * @extends {M.Control}
    * @api stable
    */
  constructor(values, controlsLayers, map, fatherControl) {
    // 1. checks if the implementation can create PluginControl
    if (M.utils.isUndefined(TransparencyImplControl)) {
      M.exception(getValue('exception'));
    }

    // 2. implementation of this control
    const impl = new TransparencyImplControl();
    super(impl, 'Transparency');
    impl.addTo(map);

    /**
     * Name plugin
     * @private
     * @type {String}
     */
    this.name_ = 'transparency';

    /**
     * Facade of the map
     * @private
     * @type {M.Map}
     */
    this.map_ = map;

    /**
     * TO-DO Poner función que esta en cptransparency.js
     * Enabled key functions
     * @type {boolean}
     * @public
     */
    this.enabledKeyFunctions = values.enabledKeyFunctions;
    if (this.enabledKeyFunctions === undefined) this.enabledKeyFunctions = true;

    /**
      * All layers
      * @public
      * @public {Array}
      */
    this.layers = transformToLayers(controlsLayers);

    /**
     * Radio máximo
     * Value: number in range 30 - 200
     * @type {number}
     * @default 200
     */
    this.maxRadius = values.maxRadius;
    if (this.maxRadius === undefined) this.maxRadius = 200;
    if (this.maxRadius > 200) {
      this.maxRadius = 200;
    } else if (this.maxRadius < 30) {
      this.maxRadius = 30;
    }

    /**
     * Radio mínimo
     * Value: number in range 30 - 200
     * @type {number}
     * @default 30
     */
    this.minRadius = values.minRadius;
    if (this.minRadius === undefined) this.minRadius = 30;
    if (this.minRadius < 30) {
      this.minRadius = 30;
    } else if (this.minRadius > this.maxRadius) {
      this.minRadius = this.maxRadius;
    }

    /**
     * Transparent effect radius
     * Value: number in range 30 - 200
     * @type {number}
     * @public
     */
    // eslint-disable-next-line radix, no-undef, no-restricted-globals
    if (!isNaN(parseInt(values.radius))) {
      if (values.radius >= 30 && values.radius <= 200) {
        // eslint-disable-next-line radix
        this.radius = parseInt(values.radius);
      } else if (values.radius > 200) {
        this.radius = 200;
      } else if (values.radius < 30) {
        this.radius = 30;
      }
    } else {
      this.radius = 100; // Default value
    }

    /**
      * Layer selected
      * @public
      * @type {M.layer}
      */
    this.layerSelected = null;

    /**
      * Layer selected
      * @public
      * @type {M.layer}
      */
    this.freeze = false;

    /**
      * Template
      * @public
      * @type { HTMLElement }
      */
    this.template = null;

    /**
      * Set fixed SpyEye
      * @private
      * @type {boolean}
      */
    this.freezeSpyEye = false;

    this.fatherControl = fatherControl;
  }

  /**
    * This function creates the view
    *
    * @public
    * @function
    * @param {M.Map} map to add the control
    * @api stable
    */
  active(html) {
    const templateResult = new Promise((success, fail) => {
      const names = this.layers.map((layer) => {
        return layer instanceof Object
          ? { name: layer.name, legend: layer.legend }
          : { name: layer, legend: layer };
      });

      const options = {
        jsonp: true,
        vars: {
          translations: {
            transparency: getValue('transparency'),
            radius: getValue('radius'),
            layers: getValue('layers'),
            freeze: getValue('freeze'),
            unfreeze: getValue('unfreeze'),
            activate_spyeye: getValue('activate_spyeye'),
            deactivate_spyeye: getValue('deactivate_spyeye'),
            inputTransparentRadius: getValue('inputTransparentRadius'),
            selectTransparentRadius: getValue('selectTransparentRadius'),
          },
        },
      };

      if (names.length >= 1) {
        options.vars.options = names;
      }

      this.template = M.template.compileSync(template, options);

      // Radius
      const radiusElement = this.template.querySelector('#input-transparent-radius');
      radiusElement.value = this.radius;
      radiusElement.min = this.minRadius;
      radiusElement.max = this.maxRadius;

      this.template
        .querySelector('#input-transparent-radius')
        .addEventListener('change', (evt) => {
          this.radius = Number(evt.target.value);
          this.getImpl().setRadius(this.radius);
        });

      this.template
        .querySelector('#m-transparency-lock')
        .addEventListener('click', (evt) => {
          M.dialog.info('Mueva el cursor a la zona deseada y pulse Ctrl+Shift+Enter para congelar');
        });
      this.template
        .querySelector('#m-transparency-unlock')
        .addEventListener('click', (evt) => {
          this.freeze = !this.freeze;
          this.getImpl().setFreeze(this.freeze);
          this.template.querySelector('#m-transparency-lock').style.visibility = 'visible';
          this.template.querySelector('#m-transparency-unlock').style.visibility = 'hidden';
        });

      if (this.layers.length === 0 || this.layers === '') {
        M.toast.error(getValue('exception.notLayers'), null, 6000);
      } else if (options !== '') {
        this.template.querySelector('#m-transparency-lock').style.visibility = 'hidden';
        this.template.querySelector('#m-transparency-unlock').style.visibility = 'hidden';
        this.template
          .querySelector('select')
          .addEventListener('change', (evt) => {
            const optionsSelect = evt.target.options;
            Array.prototype.forEach.call(optionsSelect, (option) => option.removeAttribute('selected'));
            evt.target.selectedOptions[0].setAttribute('selected', '');

            this.layerSelected.setVisible(false);
            this.removeEffects();
            // eslint-disable-next-line no-shadow, array-callback-return, consistent-return
            const layer = this.layers.filter((layer) => {
              if (layer.name === evt.target.value) {
                const mapLayer = this.map_.getLayers().filter((l) => l.name === layer.name);
                if (mapLayer.length > 0) {
                  this.map_.removeLayers(mapLayer[0]);
                }

                this.map_.addLayers(layer);
                return layer;
              }
            });

            this.layerSelected = layer[0];
            this.effectSelectedImpl_();
          });
      }

      success(this.template);
    });

    templateResult.then((t) => {
      html.querySelector('#m-comparators-contents').appendChild(t);
    });

    document.addEventListener('keydown', (zEvent) => {
      if (!this.enabledKeyFunctions) {
        return;
      }
      if (zEvent.ctrlKey && zEvent.shiftKey && zEvent.key === 'ArrowUp') { // case sensitive
        if (this.radius >= 200) return;
        this.radius += 20;
        this.getImpl().setRadius(this.radius);
        this.template.querySelector('#input-transparent-radius').value = this.radius;
      }
      if (zEvent.ctrlKey && zEvent.shiftKey && zEvent.key === 'ArrowDown') { // case sensitive
        if (this.radius <= 32) return;
        this.radius -= 20;
        this.getImpl().setRadius(this.radius);
        this.template.querySelector('#input-transparent-radius').value = this.radius;
      }
      if (zEvent.ctrlKey && zEvent.shiftKey && zEvent.key === 'Enter') {
        this.freeze = !this.freeze;
        this.getImpl().setFreeze(this.freeze);
        if (this.freeze) {
          this.template.querySelector('#m-transparency-lock').style.visibility = 'hidden';
          this.template.querySelector('#m-transparency-unlock').style.visibility = 'visible';
        } else {
          this.template.querySelector('#m-transparency-lock').style.visibility = 'visible';
          this.template.querySelector('#m-transparency-unlock').style.visibility = 'hidden';
        }
      }
    });

    // Para activar cuando se haga clic en el boton transparency-btn
    this.evtActive_();
  }

  evtActive_() {
    if (document.querySelector('#m-lyrdropdown-selector')) {
      document.querySelector('#m-lyrdropdown-selector').value = 'none';
      document.querySelector('#m-lyrdropdown-selector').style.display = 'none';
    }

    this.template.querySelector('#m-transparency-lock').style.visibility = 'visible';
    this.template.querySelector('#m-transparency-unlock').style.visibility = 'hidden';
    this.activate();
  }

  setDefaultLayer() {
    // eslint-disable-next-line no-console
    console.log('Activación remota');
  }

  removeLayers_() {
    const removeLayer = [];
    this.map_.getLayers().forEach((l) => {
      if (this.layers.some((layer) => layer.name === l.name)) {
        removeLayer.push(l);
      }
    });

    // filtrar pot this.fatherControl.saveLayers

    removeLayer.forEach((l) => {
      if (!this.fatherControl.saveLayers.includes(l.name)) {
        this.map_.removeLayers(l);
      }
    });
  }

  effectSelectedImpl_() {
    setTimeout(() => {
      this.getImpl().effectSelected(this.layerSelected, this.radius, this.freeze);
    }, 1000);
  }

  /**
    * Activate Select/Input
    *
    * @public
    * @function
    * @api stable
    */
  activate() {
    // this.removeLayers_();

    if (this.layerSelected === null) {
      this.layerSelected = this.layers[0];
      const findLayer = this.map_.getLayers().filter((l) => l.name === this.layerSelected.name);

      if (findLayer.length > 0) {
        this.layerSelected = findLayer[0];
      } else {
        this.map_.addLayers(this.layerSelected);
      }
    }

    this.effectSelectedImpl_();
  }

  /**
    * Deactivate SpyEye
    *
    * @public
    * @function
    * @api stable
    */
  deactivate() {
    if (this.layerSelected === null) this.layerSelected = this.layers[0];
    this.removeEffects();

    if (this.template) this.template.remove();
    this.layerSelected = null;
  }

  updateNewLayers() {
    this.removeEffects();

    if (this.template) this.template.remove();
    this.layerSelected = null;
  }

  addlayersControl(layers) {
    this.layers.push(layers);
  }

  destroy() {
    this.removeEffects();

    this.name_ = null;
    this.map_ = null;
    this.enabledKeyFunctions = null;
    this.layers = null;
    this.maxRadius = null;
    this.minRadius = null;
    this.radius = null;

    this.layerSelected = null;
    this.freeze = null;
    this.freezeSpyEye = null;
    this.template = null;
  }

  /**
    * This function is called to remove the effects
    *
    * @public
    * @function
    * @api stable
    */
  removeEffects() {
    this.getImpl().removeEffects();
  }

  /**
    * This function remove the transparency layers
    *
    * @public
    * @function
    * @api stable
    */
  removeTransparencyLayers(layers) {
    layers.forEach((layer) => {
      if (!(layer instanceof Object)) {
        if (layer.indexOf('*') >= 0) {
          const urlLayer = layer.split('*');
          const name = urlLayer[3];
          const layerByUrl = this.map_.getLayers()
            .find((l) => name.includes(l.name));
          this.map_.removeLayers(layerByUrl);
        } else {
          const layerByName = this.map_.getLayers()
            .find((l) => layer.includes(l.name));
          this.map_.removeLayers(layerByName);
        }
      } else if (layer instanceof Object) {
        const layerByObject = this.map_.getLayers()
          .find((l) => layer.name.includes(l.name));
        this.map_.removeLayers(layerByObject);
      }
    });
  }

  /**
    * This function transform string to M.Layer
    *
    * @public
    * @function
    * @api stable
    * @param {string}
    * @return {Boolean}
    */
  isValidLayer(layer) {
    return layer.type === 'WMTS' || layer.type === 'WMS';
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
    return control instanceof TransparencyControl;
  }

  getLayersNames() {
    return this.layers.map((l) => l.name);
  }

  effectSelectedImpl_() {
    setTimeout(() => {
      this.getImpl().effectSelected(this.layerSelected, this.radius, this.freeze);
    }, 1000);
  }
}
