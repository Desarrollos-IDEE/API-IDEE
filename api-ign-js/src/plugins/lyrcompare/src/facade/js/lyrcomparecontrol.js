/**
 * @module M/control/LyrCompareControl
 */

import LyrcompareImplControl from 'impl/lyrcomparecontrol';
import template from 'templates/lyrcompare';
import {
  getValue as getValueTranslate,
} from './i18n/language';

// eslint-disable-next-line no-extend-native, func-names
Array.prototype.unique = (function (a) {
  // eslint-disable-next-line func-names
  return function () {
    return this.filter(a);
  };
}((a, b, c) => {
  return c.indexOf(a, b + 1) < 0;
}));

export default class LyrCompareControl extends M.Control {
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
    if (M.utils.isUndefined(LyrcompareImplControl)) {
      M.exception('La implementación usada no puede crear controles LyrCompareControl');
    }
    // 2. implementation of this control
    const impl = new LyrcompareImplControl();
    super(impl, 'LyrCompare');

    /**
     * All layers
     * @public
     * @public {Array}
     */
    this.layers = values.layers;

    /**
         * Collapsible
         * @public
         * @public {boolean}
         */
    this.collapsible = values.collapsible;

    /**
     * Collapsed
     * @public
     * @public {boolean}
     */
    this.collapsed = values.collapsed;

    /**
     * Nivel de opacidad
     * @private
     * @type {Number}
     */
    this.opacityVal = values.opacityVal;

    /**
     * Layer selected A
     * @public
     * @type {M.layer}
     */
    this.layerSelectedA = null;

    /**
     * Layer selected B
     * @public
     * @type {M.layer}
     */
    this.layerSelectedB = null;

    /**
     * Layer selected C
     * @public
     * @type {M.layer}
     */
    this.layerSelectedC = null;

    /**
     * Layer selected D
     * @public
     * @type {M.layer}
     */
    this.layerSelectedD = null;

    /**
     * Template
     * @public
     * @type { HTMLElement }
     */
    this.template = null;

    /**
     * Static Division selected
     * @private
     * @type {Number}
     */
    this.staticDivision = values.staticDivision;

    /**
     * Opacity Value
     * @private
     * @type {Number}
     */
    this.opacityVal = values.opacityVal;

    /**
     * Comparison mode
     * @private
     * @type {Number}
     */
    this.comparisonMode = values.comparisonMode;

    /**
     * Layer A default
     * @private
     * @type {Number}
     */
    this.defaultLyrA = values.defaultLyrA;

    /**
     * Layer B default
     * @private
     * @type {Number}
     */
    this.defaultLyrB = values.defaultLyrB;

    /**
     * Layer C default
     * @private
     * @type {Number}
     */
    this.defaultLyrC = values.defaultLyrC;

    /**
     * Layer D default
     * @private
     * @type {Number}
     */
    this.defaultLyrD = values.defaultLyrD;
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
    console.warn(getValueTranslate('lyrcompare_obsolete'));
    if (this.comparisonMode > 0) {
      this.on(M.evt.ADDED_TO_MAP, (e) => {
        this.activateCurtain();
      });
    }
    this.map = map;
    return new Promise((success, fail) => {
      this.layers = this.transformToLayers(this.layers);
      if (this.layers.length >= 2) {
        if (this.comparisonMode === 3 && this.layers.length < 4) {
          M.dialog.error(getValueTranslate('no_layers_plugin'), 'lyrcompare');
          this.comparisonMode = 0;
        }
        let isLoad = this.allLayerLoad();
        if (isLoad) {
          this.setFunctionsAndCompile(success);
        } else {
          const idInterval = setInterval(
            () => {
              isLoad = this.allLayerLoad();
              if (isLoad) {
                clearInterval(idInterval);
                this.setFunctionsAndCompile(success);
              }
            },
            200,
          );
        }
      } else {
        M.dialog.error(getValueTranslate('no_layers_plugin'), 'lyrcompare');
      }
    });
  }

  /**
   * This function set plugin behavior and compile template
   *
   * @public
   * @function
   * @param { function } success to promise
   * @api stable
   */
  setFunctionsAndCompile(success) {
    const layers = this.layers.map((layer) => {
      return layer instanceof Object ? {
        name: layer.name,
        legend: layer.legend,
      } : {
        name: layer,
        legend: layer,
      };
    });

    const options = {
      jsonp: true,
      vars: {
        options: layers,
        comparisonMode: this.comparisonMode,
        translations: {
          tooltip: getValueTranslate('tooltip'),
          tooltip_vcurtain: getValueTranslate('tooltip_vcurtain'),
          tooltip_hcurtain: getValueTranslate('tooltip_hcurtain'),
          tooltip_multicurtain: getValueTranslate('tooltip_multicurtain'),
          opacity: getValueTranslate('opacity'),
          static: getValueTranslate('static'),
          dynamic: getValueTranslate('dynamic'),
          mixed: getValueTranslate('mixed'),
          layer: getValueTranslate('layer'),
          opacity_tooltip: getValueTranslate('opacity_tooltip'),
          static_tooltip: getValueTranslate('static_tooltip'),
          dynamic_tooltip: getValueTranslate('dynamic_tooltip'),
          mixed_tooltip: getValueTranslate('mixed_tooltip'),
          lyr1Select_tooltip: getValueTranslate('lyr1Select_tooltip'),
          lyr2Select_tooltip: getValueTranslate('lyr2Select_tooltip'),
          lyr3Select_tooltip: getValueTranslate('lyr3Select_tooltip'),
          lyr4Select_tooltip: getValueTranslate('lyr4Select_tooltip'),
        },
      },
    };

    // template with default options
    this.template = M.template.compileSync(template, options);
    this.setEventsAndValues();
    this.updateControls();

    if (this.layers.length === 0) {
      M.dialog.error(getValueTranslate('no_layers_plugin'));
    } else {
      // e2m: Toogle activate/desactivate vcurtain, hcurtain, multicurtain
      // ---> comparisonMode = 1, 2, 3
      this.template.querySelectorAll('button[id^="m-lyrcompare-"]')
        .forEach((button, i) => {
          button.addEventListener('click', (evt) => {
            if (this.comparisonMode === 0) {
              this.comparisonMode = i + 1;
              this.activateCurtain();
            } else if (this.comparisonMode === i + 1) {
              this.comparisonMode = 0;
              this.deactivateCurtain();
            } else {
              // Cambiamos de modo de visualización sin apagar/encender la interacción
              this.comparisonMode = i + 1;
              this.updateControls();
              this.getImpl().setComparisonMode(this.comparisonMode);
            }
          });
        });
    }
    return success(this.template);
  }

  /**
   * This function set events and values to template
   *
   * @public
   * @function
   * @api stable
   */
  setEventsAndValues() {
    // opacity control
    this.template.querySelector('#input-transparent-opacity').value = this.opacityVal;
    this.template.querySelector('#input-transparent-opacity').addEventListener('input', (evt) => {
      this.opacityVal = Number(evt.target.value);
      this.getImpl().setOpacity(this.opacityVal);
    });

    // division selector
    if (this.staticDivision === 1) {
      this.template.querySelector('#div-m-lyrcompare-transparent-static').checked = true;
    } else if (this.staticDivision === 0) {
      this.template.querySelector('#div-m-lyrcompare-transparent-dynamic').checked = true;
    } else {
      this.template.querySelector('#div-m-lyrcompare-transparent-mixed').checked = true;
    }

    this.template.querySelector('#div-m-lyrcompare-transparent-dynamic').addEventListener('change', (evt) => {
      this.staticDivision = Number(evt.target.value);
      this.getImpl().setStaticDivision(this.staticDivision);
    });

    this.template.querySelector('#div-m-lyrcompare-transparent-static').addEventListener('change', (evt) => {
      this.staticDivision = Number(evt.target.value);
      this.getImpl().setStaticDivision(this.staticDivision);
    });

    this.template.querySelector('#div-m-lyrcompare-transparent-mixed').addEventListener('change', (evt) => {
      this.staticDivision = Number(evt.target.value);
      this.getImpl().setStaticDivision(this.staticDivision);
    });

    this.template.querySelectorAll('select[id^="m-lyrcompare-"]').forEach((item) => {
      item.addEventListener('change', (evt) => {
        const layer = this.layers.filter((l) => {
          return l.name === evt.target.value;
        });

        let lstLayers = [];

        if (item.id === 'm-lyrcompare-lyrA') {
          lstLayers = [
            layer[0].name,
            this.layerSelectedB.name,
            this.layerSelectedC.name,
            this.layerSelectedD.name,
          ];
        } else if (item.id === 'm-lyrcompare-lyrB') {
          lstLayers = [
            this.layerSelectedA.name,
            layer[0].name,
            this.layerSelectedC.name,
            this.layerSelectedD.name,
          ];
        } else if (item.id === 'm-lyrcompare-lyrC') {
          lstLayers = [
            this.layerSelectedA.name,
            this.layerSelectedB.name,
            layer[0].name,
            this.layerSelectedD.name,
          ];
        } else if (item.id === 'm-lyrcompare-lyrD') {
          lstLayers = [
            this.layerSelectedA.name,
            this.layerSelectedB.name,
            this.layerSelectedC.name,
            layer[0].name,
          ];
        }

        // e2m: de esta forma pasamos los parámetros en forma de array

        if (this.checkLayersAreDifferent(...lstLayers) === false) {
          M.dialog.info(getValueTranslate('advice_sameLayer'));
          if (item.id === 'm-lyrcompare-lyrA') {
            this.template.querySelector(`#${item.id}`).value = this.layerSelectedA.name;
          } else if (item.id === 'm-lyrcompare-lyrB') {
            this.template.querySelector(`#${item.id}`).value = this.layerSelectedB.name;
          } else if (item.id === 'm-lyrcompare-lyrC') {
            this.template.querySelector(`#${item.id}`).value = this.layerSelectedC.name;
          } else if (item.id === 'm-lyrcompare-lyrD') {
            this.template.querySelector(`#${item.id}`).value = this.layerSelectedD.name;
          }
          return false;
        }

        if (item.id === 'm-lyrcompare-lyrA') {
          if (layer[0].name === this.layerSelectedC.name) {
            this.layerSelectedC.setVisible(false);
            this.layerSelectedC = this.layerSelectedA;
            this.template.querySelector('#m-lyrcompare-lyrC').value = this.layerSelectedA.name;
          }

          if (layer[0].name === this.layerSelectedD.name) {
            this.layerSelectedD.setVisible(false);
            this.layerSelectedD = this.layerSelectedA;
            this.template.querySelector('#m-lyrcompare-lyrD').value = this.layerSelectedA.name;
          }
        } else if (item.id === 'm-lyrcompare-lyrB') {
          if (layer[0].name === this.layerSelectedC.name) {
            this.layerSelectedC.setVisible(false);
            this.layerSelectedC = this.layerSelectedB;
            this.template.querySelector('#m-lyrcompare-lyrC').value = this.layerSelectedB.name;
          }

          if (layer[0].name === this.layerSelectedD.name) {
            this.layerSelectedD.setVisible(false);
            this.layerSelectedD = this.layerSelectedB;
            this.template.querySelector('#m-lyrcompare-lyrD').value = this.layerSelectedB.name;
          }
        }
        if (item.id === 'm-lyrcompare-lyrA') {
          this.layerSelectedA.setVisible(false);
          this.layerSelectedA = layer[0];
        } else if (item.id === 'm-lyrcompare-lyrB') {
          this.layerSelectedB.setVisible(false);
          this.layerSelectedB = layer[0];
        } else if (item.id === 'm-lyrcompare-lyrC') {
          this.layerSelectedC.setVisible(false);
          this.layerSelectedC = layer[0];
        } else if (item.id === 'm-lyrcompare-lyrD') {
          this.layerSelectedD.setVisible(false);
          this.layerSelectedD = layer[0];
        }
        this.removeEffectsComparison();
        this.getImpl().effectSelectedCurtain(
          this.layerSelectedA,
          this.layerSelectedB,
          this.layerSelectedC,
          this.layerSelectedD,
          this.opacityVal,
          this.staticDivision,
          this.comparisonMode,
        );
      });
    });
  }

  /**
   * This function checks selected layers are diferent
   *
   * @public
   * @function
   * @api stable
   * @param { string } lyerA layer 1
   * @param { string } lyerB layer 2
   * @param { string } lyerC layer 3
   * @param { string } lyerD layer 4

   * @return {Boolean}
   */
  checkLayersAreDifferent(lyerA, lyerB, lyerC, lyerD) {
    if ((this.comparisonMode === 1) || (this.comparisonMode === 2)) {
      if (lyerA === lyerB) {
        return false;
      }
    } else {
      const compLyers = [lyerA, lyerB, lyerC, lyerD];
      if (compLyers.length !== compLyers.unique().length) {
        return false;
      }
    }
    return true;
  }

  /**
   * Activate Select/Input
   *
   * @public
   * @function
   * @api stable
   */
  activateCurtain() {
    this.activeDefault();
    this.getImpl().effectSelectedCurtain(
      this.layerSelectedA,
      this.layerSelectedB,
      this.layerSelectedC,
      this.layerSelectedD,
      this.opacityVal,
      this.staticDivision,
      this.comparisonMode,
    );
    this.updateControls();
  }

  /**
   * Activate default values
   *
   * @public
   * @function
   * @api stable
   */
  activeDefault() {
    if (this.layerSelectedA === null) {
      this.layerSelectedA = this.layers[this.defaultLyrA];
      this.template.querySelector('#m-lyrcompare-lyrA').selectedIndex = this.defaultLyrA;
    }
    if (this.layerSelectedB === null) {
      this.layerSelectedB = this.layers[this.defaultLyrB];
      this.template.querySelector('#m-lyrcompare-lyrB').selectedIndex = this.defaultLyrB;
    }
    if (this.layerSelectedC === null) {
      this.layerSelectedC = this.layers[this.defaultLyrC];
      this.template.querySelector('#m-lyrcompare-lyrC').selectedIndex = this.defaultLyrC;
    }
    if (this.layerSelectedD === null) {
      this.layerSelectedD = this.layers[this.defaultLyrD];
      this.template.querySelector('#m-lyrcompare-lyrD').selectedIndex = this.defaultLyrD;
    }
  }

  /**
   * Deactivate Select/Input
   *
   * @public
   * @function
   * @api stable
   */
  deactivateCurtain() {
    this.comparisonMode = 0;
    if (this.layerSelectedA !== null && this.layerSelectedB !== null) {
      this.layerSelectedA.setVisible(false);
      this.layerSelectedB.setVisible(false);
    }
    if (this.layerSelectedC !== null && this.layerSelectedD !== null
      && this.layerSelectedC !== undefined && this.layerSelectedD !== undefined) {
      this.layerSelectedC.setVisible(false);
      this.layerSelectedD.setVisible(false);
    }
    this.removeEffectsComparison();
    this.updateControls();
  }

  /**
   * This function is called to remove the effects
   *
   * @public
   * @function
   * @api stable
   */
  removeEffectsComparison() {
    this.getImpl().removeEffectsCurtain();
  }

  /**
   * This procedure updates texts in controls
   *
   */
  updateControls() {
    this.removeActivate();
    this.activateByMode();

    const swapControl = document.querySelector('.lyrcompare-swipe-control');
    if (this.comparisonMode === 0) {
      this.template.querySelectorAll('select[id^="m-lyrcompare-"]').forEach((item) => {
        // eslint-disable-next-line no-param-reassign
        item.disabled = true;
      });
      this.template.querySelector('input').disabled = true; // Deshabilita el range del radio
      return;
    } if (this.comparisonMode === 1) {
      if (swapControl) swapControl.style.opacity = '1';
      this.template.querySelector('#m-lyrcompare-lyrA-lbl').classList.add('lyrcompare-icon-columns-2');
      this.template.querySelector('#m-lyrcompare-lyrB-lbl').classList.add('lyrcompare-icon-columns-1');
      this.template.querySelector('#m-lyrcompare-lyrA-cont').style.display = 'block';
      this.template.querySelector('#m-lyrcompare-lyrB-cont').style.display = 'block';
      this.template.querySelector('#m-lyrcompare-lyrA').disabled = false;
      this.template.querySelector('#m-lyrcompare-lyrB').disabled = false;
    } else if (this.comparisonMode === 2) {
      if (swapControl) swapControl.style.opacity = '1';
      this.template.querySelector('#m-lyrcompare-lyrA-lbl').classList.add('lyrcompare-icon-columns-4');
      this.template.querySelector('#m-lyrcompare-lyrB-lbl').classList.add('lyrcompare-icon-columns-3');
      this.template.querySelector('#m-lyrcompare-lyrA-cont').style.display = 'block';
      this.template.querySelector('#m-lyrcompare-lyrB-cont').style.display = 'block';
      this.template.querySelector('#m-lyrcompare-lyrA').disabled = false;
      this.template.querySelector('#m-lyrcompare-lyrB').disabled = false;
    } else if (this.comparisonMode === 3) {
      if (swapControl) swapControl.style.opacity = '1';
      this.template.querySelectorAll('select[id^="m-lyrcompare-"]').forEach((item) => {
        // eslint-disable-next-line no-param-reassign
        item.disabled = false;
      });
      this.template.querySelector('#m-lyrcompare-lyrA-lbl').classList.add('lyrcompare-icon-th-large-1');
      this.template.querySelector('#m-lyrcompare-lyrB-lbl').classList.add('lyrcompare-icon-th-large-2');
      this.template.querySelector('#m-lyrcompare-lyrC-lbl').classList.add('lyrcompare-icon-th-large-3');
      this.template.querySelector('#m-lyrcompare-lyrD-lbl').classList.add('lyrcompare-icon-th-large-4');

      this.template.querySelector('#m-lyrcompare-lyrA-cont').style.display = 'block';
      this.template.querySelector('#m-lyrcompare-lyrB-cont').style.display = 'block';
      this.template.querySelector('#m-lyrcompare-lyrC-cont').style.display = 'block';
      this.template.querySelector('#m-lyrcompare-lyrD-cont').style.display = 'block';
    }
    this.template.querySelector('input').disabled = false; // Habilita el range del radio
  }

  activateByMode() {
    if (this.comparisonMode === 1) {
      this.template.querySelector('#m-lyrcompare-vcurtain').classList.add('buttom-pressed-vcurtain'); // VCurtain pulsado
    } else if (this.comparisonMode === 2) {
      this.template.querySelector('#m-lyrcompare-hcurtain').classList.add('buttom-pressed-hcurtain'); // HCurtain pulsado
    } else if (this.comparisonMode === 3) {
      this.template.querySelector('#m-lyrcompare-multicurtain').classList.add('buttom-pressed-multicurtain'); // MultiCurtain pulsado
    }
  }

  removeActivate() {
    this.template.querySelector('#m-lyrcompare-vcurtain').classList.remove('buttom-pressed-vcurtain');
    this.template.querySelector('#m-lyrcompare-hcurtain').classList.remove('buttom-pressed-hcurtain');
    this.template.querySelector('#m-lyrcompare-multicurtain').classList.remove('buttom-pressed-multicurtain');
    this.template.querySelectorAll('select[id^="m-lyrcompare-"]').disabled = true;
    this.template.querySelector('#m-lyrcompare-lyrA-cont').style.display = 'none';
    this.template.querySelector('#m-lyrcompare-lyrB-cont').style.display = 'none';
    this.template.querySelector('#m-lyrcompare-lyrC-cont').style.display = 'none';
    this.template.querySelector('#m-lyrcompare-lyrD-cont').style.display = 'none';
    this.template.querySelector('#m-lyrcompare-lyrA-lbl').classList = '';
    this.template.querySelector('#m-lyrcompare-lyrB-lbl').classList = '';
    const swapControl = document.querySelector('.lyrcompare-swipe-control');
    if (swapControl) {
      swapControl.style.opacity = '0';
    }
  }

  /**
   * This function remove the Curtain layers
   *
   * @public
   * @function
   * @api stable
   */
  removeCurtainLayers(layers) {
    layers.forEach((layer) => {
      if (!(layer instanceof Object)) {
        if (layer.indexOf('*') >= 0) {
          const urlLayer = layer.split('*');
          const name = urlLayer[3];
          const layerByUrl = this.map.getLayers()
            .filter((l) => name.includes(l.name))[this.map.getLayers()
              .filter((l) => name.includes(l.name)).length - 1];
          this.map.removeLayers(layerByUrl);
        } else {
          const layerByName = this.map.getLayers()
            .filter((l) => layer.includes(l.name))[this.map.getLayers()
              .filter((l) => layer.includes(l.name)).length - 1];
          this.map.removeLayers(layerByName);
        }
      } else if (layer instanceof Object) {
        const layerByObject = this.map.getLayers()
          .filter((l) => layer.name.includes(l.name))[this.map.getLayers()
            .filter((l) => layer.name.includes(l.name)).length - 1];
        this.map.removeLayers(layerByObject);
      }
    });
  }

  allLayerLoad() {
    if (this.layers[0].load === undefined || (this.layers[1].load === undefined
        && (this.layers[2] !== undefined && this.layers[3] !== undefined
        && (this.layers[2].load === undefined || this.layers[3].load === undefined)))) {
      return false;
    }
    return true;
  }

  /**
   * Transform StringLayers to Mapea M.Layer
   * @public
   * @function
   * @api stable
   * @param {string}
   * @return
   */
  transformToLayers(layers) {
    const transform = layers.map((layer) => {
      let newLayer = null;
      if (!(layer instanceof Object)) {
        if (layer.indexOf('*') >= 0) {
          const urlLayer = layer.split('*');
          if (urlLayer[0].toUpperCase() === 'WMS') {
            newLayer = new M.layer.WMS({
              url: urlLayer[2],
              name: urlLayer[3],
            });
            if (this.map.getLayers().filter((l) => newLayer.name.includes(l.name)).length > 0) {
              this.map.removeLayers(this.map.getLayers()
                .filter((l) => newLayer.name.includes(l.name))[0]);
            }
            this.map.addLayers(newLayer);
          } else if (urlLayer[0].toUpperCase() === 'WMTS') {
            newLayer = new M.layer.WMTS({
              url: urlLayer[1],
              name: urlLayer[2],
            });
            this.map.addLayers(newLayer);
          }
        } else {
          const layerByName = this.map.getLayers().filter((l) => layer.includes(l.name))[0];
          newLayer = this.isValidLayer(layerByName) ? layerByName : null;
        }
      } else if (layer instanceof Object) {
        const layerByObject = this.map.getLayers().filter((l) => layer.name.includes(l.name))[0];
        newLayer = this.isValidLayer(layerByObject) ? layerByObject : null;
      }

      if (newLayer !== null) {
        if (newLayer.getImpl().getOL3Layer() === null) {
          setTimeout(() => {
            if (newLayer.type === 'WMS') {
              newLayer.load = true;
            } else if (newLayer.type === 'WMTS') {
              // eslint-disable-next-line no-underscore-dangle
              newLayer.facadeLayer_.load = true;
            }
          }, 1000);
        } else {
          newLayer.load = true;
        }
        newLayer.displayInLayerSwitcher = false;
        newLayer.setVisible(false);
        return newLayer;
      }
      this.layers.remove(layer);
    }, this);
    return (transform[0] === undefined) ? [] : transform;
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
    return control instanceof LyrCompareControl;
  }

  getLayersNames() {
    return this.layers.map((l) => l.name);
  }
}
