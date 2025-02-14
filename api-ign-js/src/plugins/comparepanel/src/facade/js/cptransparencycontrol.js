/**
 * @module M/control/TransparencyControl
 */

import TransparencyImplControl from 'impl/cptransparencycontrol';
import template from 'templates/cptransparency';
import { getValue } from './i18n/language';

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
  constructor(values) {
    // 1. checks if the implementation can create PluginControl
    if (M.utils.isUndefined(TransparencyImplControl)) {
      M.exception(getValue('exception'));
    }

    // 2. implementation of this control
    const impl = new TransparencyImplControl();
    super(impl, 'Transparency');

    /**
     * All layers
     * @public
     * @public {Array}
     */
    this.layers = values.layers;
    /**
     * Radius selected
     * @private
     * @type {Number}
     */
    this.radius = values.radius;
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
    this.map = map;
    return new Promise((success, fail) => {
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
          },
        },
      };

      if (names.length >= 1) {
        options.vars.options = names;
      }

      this.template = M.template.compileSync(template, options);

      // Radius
      this.template.querySelector('#input-transparent-radius').value = this.radius;
      this.template
        .querySelector('#input-transparent-radius')
        .addEventListener('change', (evt) => {
          this.radius = Number(evt.target.value);
          this.getImpl().setRadius(this.radius);
        });

      this.template
        .querySelector('#m-transparency-active')
        .addEventListener('click', (evt) => {
          // e2m: evitamos que el mapa principal,
          // sobre el que se activa SpyEye pueda poner sobre él capas
          if (document.querySelector('#m-lyrdropdown-selector')) {
            document.querySelector('#m-lyrdropdown-selector').value = 'none';
            document.querySelector('#m-lyrdropdown-selector').style.display = 'none';
          }

          // e2m: cuando activamos SpyEye, evitamos que se activen los comparadores de cortina
          document.querySelector('#m-lyrcompare-vcurtain').disabled = true;
          document.querySelector('#m-lyrcompare-hcurtain').disabled = true;
          document.querySelector('#m-lyrcompare-multicurtain').disabled = true;
          document.querySelector('#m-lyrcompare-deactivate').disabled = true;

          this.template.querySelector('#m-transparency-lock').style.visibility = 'visible';
          this.template.querySelector('#m-transparency-unlock').style.visibility = 'hidden';
          this.activate();
        });
      this.template
        .querySelector('#m-transparency-deactivate')
        .addEventListener('click', (evt) => {
          // e2m: volvemos a permitir que el mapa principal pueda poner sobre él capas
          if (document.querySelector('#m-lyrdropdown-selector'))document.querySelector('#m-lyrdropdown-selector').style.display = 'block';

          // e2m: cuando desactivamos SpyEye,
          // permitimos que se activen los comparadores de cortina de nuevo
          document.querySelector('#m-lyrcompare-vcurtain').disabled = false;
          document.querySelector('#m-lyrcompare-hcurtain').disabled = false;
          document.querySelector('#m-lyrcompare-multicurtain').disabled = false;
          document.querySelector('#m-lyrcompare-deactivate').disabled = false;

          this.template.querySelector('#m-transparency-lock').style.visibility = 'hidden';
          this.template.querySelector('#m-transparency-unlock').style.visibility = 'hidden';

          this.deactivate();
        });
      this.template
        .querySelector('#m-transparency-lock')
        .addEventListener('click', (evt) => {
          M.dialog.info(
            'Mueva el cursor a la zona deseada y pulse Ctrl+Shift+Enter para congelar',
          );
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
        M.dialog.error(getValue('errorLayer'));
      } else if (options !== '') {
        this.template.querySelector('#m-transparency-lock').style.visibility = 'hidden';
        this.template.querySelector('#m-transparency-unlock').style.visibility = 'hidden';
        this.template.querySelector('select').disabled = true;
        this.template.querySelector('input').disabled = true;
        this.template
          .querySelector('select')
          .addEventListener('change', (evt) => {
            this.layerSelected.setVisible(false);
            this.removeEffects();
            const layer = this.layers.filter((layer2) => {
              if (layer2.name === evt.target.value) {
                this.map.addLayers(layer2);
                return layer2;
              }
            });

            this.layerSelected = layer[0];
            setTimeout(() => {
              this.getImpl().effectSelected(
                this.layerSelected,
                this.radius,
                this.freeze,
              );
            }, 1000);
          });
      }

      success(this.template);
    });
  }

  setDefaultLayer() {
    // eslint-disable-next-line no-console
    console.log('Activación remota');
  }

  manageLyrAvailable(lyrList) {
    if (this.template === null) {
      return;
    }

    try {
      let dropDownContainer = null;
      dropDownContainer = this.template.querySelector('#m-transparency-lyr');
      for (let iOpt = 1; iOpt < dropDownContainer.options.length; iOpt += 1) {
        dropDownContainer.options[iOpt].disabled = !lyrList.includes(
          dropDownContainer.options[iOpt].value,
        );
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log(error);
    }
  }

  /**
   * Activate Select/Input
   *
   * @public
   * @function
   * @api stable
   */
  activate() {
    this.map.getLayers().forEach((l) => {
      if (this.layers.some((layer) => layer.name === l.name)) this.map.removeLayers(l);
    });

    if (this.layerSelected === null) {
      this.layerSelected = this.layers[0];
      this.map.addLayers(this.layerSelected);
    }

    const names = this.layers.map((layer) => {
      return layer instanceof Object ? { name: layer.name } : { name: layer };
    });

    if (names.length >= 1) {
      this.template.querySelector('select').disabled = false;
      this.template.querySelector('input').disabled = false;
      this.template.querySelector('#m-transparency-lock').style.visibility = 'visible';
      this.template.querySelector('#m-transparency-unlock').style.visibility = 'hidden';
      this.template.querySelector('#m-transparency-active').disabled = true;
      this.template.querySelector('#m-transparency-deactivate').disabled = false;
    }

    setTimeout(() => {
      this.getImpl().effectSelected(this.layerSelected, this.radius, this.freeze);
    }, 1000);
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
    const names = this.layers.map((layer) => {
      return layer instanceof Object ? { name: layer.name } : { name: layer };
    });
    this.removeEffects();
    // this.layerSelected.setVisible(false);
    this.map.removeLayers(this.layerSelected);
    if (names.length >= 1) {
      this.template.querySelector('select').disabled = true;
      this.template.querySelector('input').disabled = true;
      this.template.querySelector('#m-transparency-active').disabled = false;
      this.template.querySelector('#m-transparency-deactivate').disabled = true;
    }
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
          const layerByUrl = this.map
            .getLayers()
            .filter((l) => name.includes(l.name))[0];
          this.map.removeLayers(layerByUrl);
        } else {
          const layerByName = this.map
            .getLayers()
            .filter((l) => layer.includes(l.name))[0];
          this.map.removeLayers(layerByName);
        }
      } else if (layer instanceof Object) {
        const layerByObject = this.map
          .getLayers()
          .filter((l) => layer.name.includes(l.name))[0];
        this.map.removeLayers(layerByObject);
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
}
