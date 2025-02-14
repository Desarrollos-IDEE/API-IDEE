/**
 * @module M/control/LyrCompareControl
 */

import LyrcompareImplControl from 'impl/cplyrcomparecontrol';
import template from 'templates/cplyrcompare';
import { getValue } from './i18n/language';

// eslint-disable-next-line no-extend-native
Array.prototype.unique = (a) => {
  return () => {
    return this.filter(a);
  };
// eslint-disable-next-line no-unused-expressions
}; ((a, b, c) => {
  return c.indexOf(a, b + 1) < 0;
});

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
      M.exception(getValue('exception'));
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
    // 0: desactivado, 1: vertical, 2: horizontal, 3: multivista
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

    /** Show interface
     *@public
     *@type{boolean}
     */
    this.interface = values.interface;
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

    // Se hace esto para poder añadir ol3Layers a la instancia
    // this.layers. Ol3Layers tiene valor cuando se añade al mapa
    this.map.on(M.evt.ADDED_LAYER, (evt) => {
      evt.forEach((l) => {
        if (l.type === 'WMS' || l.type === 'WMTS') {
          this.layers = this.layers.map((layers) => {
            return (layers.name !== l.name) ? layers : l;
          });
        }
      });
    });

    return new Promise((success, fail) => {
      if (this.layers.length >= 2) {
        if (this.comparisonMode === 3 && this.layers.length < 4) {
          M.dialog.error(getValue('no_layers_plugin'), 'lyrcompare');
          this.comparisonMode = 0;
        }

        let isLoad = this.allLayerLoad();
        if (isLoad) {
          this.setFunctionsAndCompile(success);
        } else {
          const idInterval = setInterval(() => {
            isLoad = this.allLayerLoad();
            if (isLoad) {
              clearInterval(idInterval);
              this.setFunctionsAndCompile(success);
            }
          }, 200);
        }
      } else {
        M.dialog.error(getValue('no_layers_plugin'), 'lyrcompare');
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
      return layer instanceof Object
        ? { name: layer.name, legend: layer.legend }
        : { name: layer, legend: layer };
    });

    const options = {
      jsonp: true,
      vars: {
        options: layers,
        comparisonMode: this.comparisonMode,
        translations: {
          tooltip_vcurtain: getValue('tooltip_vcurtain'),
          tooltip_hcurtain: getValue('tooltip_hcurtain'),
          tooltip_multicurtain: getValue('tooltip_multicurtain'),
          tooltip_deactivatecurtain: getValue('tooltip_deactivatecurtain'),
          opacity: getValue('opacity'),
          static: getValue('static'),
          dynamic: getValue('dynamic'),
          mixed: getValue('mixed'),
          layer: getValue('layer'),
          opacity_tooltip: getValue('opacity_tooltip'),
          static_tooltip: getValue('static_tooltip'),
          dynamic_tooltip: getValue('dynamic_tooltip'),
          mixed_tooltip: getValue('mixed_tooltip'),
          lyrLeftSelect_tooltip: getValue('lyrLeftSelect_tooltip'),
          lyrRightSelect_tooltip: getValue('lyrRightSelect_tooltip'),
        },
      },
    };

    // template with default options
    this.template = M.template.compileSync(template, options);
    this.setEventsAndValues();
    this.updateControls();

    if (this.layers.length === 0) {
      M.dialog.error(getValue('no_layers_plugin'));
    } else {
      // e2m: Toogle activate/desactivate vcurtain, hcurtain, multicurtain
      // ---> comparisonMode = 1, 2, 3
      this.template.querySelectorAll('button[id^="m-lyrcompare-"]').forEach((button, i) => {
        if (button.id === 'm-lyrcompare-deactivate') {
          button.addEventListener('click', (evt) => {
            if (document.querySelector('#m-lyrdropdown-selector')) document.querySelector('#m-lyrdropdown-selector').style.display = 'block';

            // e2m: permitimos que se activen de nuevo los comparadores de Spy Eye
            // al desactivar las cortinas
            document.querySelector('#m-transparency-active').disabled = false;
            document.querySelector('#m-transparency-deactivate').disabled = false;

            this.comparisonMode = 0;
            this.deactivateCurtain();
            // return;
          });
        } else {
          button.addEventListener('click', (evt) => {
            if (this.comparisonMode === 0) {
              if (document.querySelector('#m-lyrdropdown-selector')) {
                document.querySelector('#m-lyrdropdown-selector').value = 'none';
                document.querySelector('#m-lyrdropdown-selector').style.display = 'none';
              }

              // e2m: evitamos que se activen los comparadores de Spy Eye mientras
              // las cortinas estén activas
              document.querySelector('#m-transparency-active').disabled = true;
              document.querySelector('#m-transparency-deactivate').disabled = true;

              this.comparisonMode = i + 1;
              this.activateCurtain();
              // return;
            } else if (this.comparisonMode === i + 1) {
              this.comparisonMode = 0;
              this.deactivateCurtain();
              // return;
            } else {
              // Cambiamos de modo de visualización sin apagar/encender la interacción
              this.comparisonMode = i + 1;
              this.updateControls();
              this.getImpl().setComparisonMode(this.comparisonMode);
            }
          });
        }
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
        const layer = this.layers.filter((layer2) => {
          if (layer2.name === evt.target.value) {
            this.map.addLayers(layer2);
            return layer2;
          }
        });

        let lstLayers = [];
        if (item.id === 'm-lyrcompare-lyrA') {
          lstLayers = [layer[0].name, this.layerSelectedB.name,
            this.layerSelectedC.name, this.layerSelectedD.name];
        } else if (item.id === 'm-lyrcompare-lyrB') {
          lstLayers = [this.layerSelectedA.name, layer[0].name,
            this.layerSelectedC.name, this.layerSelectedD.name];
        } else if (item.id === 'm-lyrcompare-lyrC') {
          lstLayers = [this.layerSelectedA.name, this.layerSelectedB.name,
            layer[0].name, this.layerSelectedD.name];
        } else if (item.id === 'm-lyrcompare-lyrD') {
          lstLayers = [this.layerSelectedA.name, this.layerSelectedB.name,
            this.layerSelectedC.name, layer[0].name];
        }

        // e2m: de esta forma pasamos los parámetros en forma de array
        if (this.checkLayersAreDifferent(...lstLayers) === false) {
          M.dialog.info(getValue('advice_sameLayer'));
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

        setTimeout(() => {
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
          this.getImpl().effectSelectedCurtain(
            this.layerSelectedA,
            this.layerSelectedB,
            this.layerSelectedC,
            this.layerSelectedD,
            this.opacityVal,
            this.staticDivision,
            this.comparisonMode,
          );
          this.getImpl().effectSelectedCurtain(
            this.layerSelectedA,
            this.layerSelectedB,
            this.layerSelectedC,
            this.layerSelectedD,
            this.opacityVal,
            this.staticDivision,
            this.comparisonMode,
          );
          this.getImpl().effectSelectedCurtain(
            this.layerSelectedA,
            this.layerSelectedB,
            this.layerSelectedC,
            this.layerSelectedD,
            this.opacityVal,
            this.staticDivision,
            this.comparisonMode,
          );
          this.getImpl().effectSelectedCurtain(
            this.layerSelectedA,
            this.layerSelectedB,
            this.layerSelectedC,
            this.layerSelectedD,
            this.opacityVal,
            this.staticDivision,
            this.comparisonMode,
          );
        }, 1000);
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
    let res = true;
    if ((this.comparisonMode === 1) || (this.comparisonMode === 2)) {
      res = lyerA !== lyerB;
    } else {
      const compLyers = [lyerA, lyerB, lyerC, lyerD];
      const noDups = [...new Set(compLyers)];
      res = noDups.length === compLyers.length;
      // No entiendo por qué esto funcionaba antes y ahora no
      // res = compLyers.length !== compLyers.unique().length;
    }

    return res;
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
    setTimeout(
      () => {
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
      },
      1000,
    );
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
      if (this.map.getLayers().some((l) => l.name === this.layerSelectedA.name));
      this.map.addLayers(this.layerSelectedA);
    }

    if (this.layerSelectedB === null) {
      this.layerSelectedB = this.layers[this.defaultLyrB];
      this.template.querySelector('#m-lyrcompare-lyrB').selectedIndex = this.defaultLyrB;
      if (this.map.getLayers().some((l) => l.name === this.layerSelectedB.name));
      this.map.addLayers(this.layerSelectedB);
    }

    if (this.layerSelectedC === null) {
      this.layerSelectedC = this.layers[this.defaultLyrC];
      this.template.querySelector('#m-lyrcompare-lyrC').selectedIndex = this.defaultLyrC;
      if (this.map.getLayers().some((l) => l.name === this.layerSelectedC.name));
      this.map.addLayers(this.layerSelectedC);
    }

    if (this.layerSelectedD === null) {
      this.layerSelectedD = this.layers[this.defaultLyrD];
      this.template.querySelector('#m-lyrcompare-lyrD').selectedIndex = this.defaultLyrD;
      if (this.map.getLayers().some((l) => l.name === this.layerSelectedD.name));
      this.map.addLayers(this.layerSelectedD);
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
    const swipeControl = document.querySelector('.lyrcompare-swipe-control');
    if (swipeControl) {
      swipeControl.classList.display = 'none !important';
    }

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

  manageLyrAvailable(lyrList) {
    if (this.template === null) {
      return;
    }
    this.updateLyrsAvailables(lyrList, 'A');
    this.updateLyrsAvailables(lyrList, 'B');
    this.updateLyrsAvailables(lyrList, 'C');
    this.updateLyrsAvailables(lyrList, 'D');
  }

  updateLyrsAvailables(lyrList, dropDownLyrLetter) {
    try {
      let dropDownContainer = null;
      dropDownContainer = this.template.querySelector(`#m-lyrcompare-lyr${dropDownLyrLetter}`);
      for (let iOpt = 1; iOpt < dropDownContainer.options.length; iOpt += 1) {
        dropDownContainer.options[iOpt].disabled = !lyrList
          .includes(dropDownContainer.options[iOpt].value);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log(error);
    }
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
      this.template.querySelector('#div-m-lyrcompare-transparent-dynamic').disabled = true; // Deshabilita options de tipo de control de cortina
      this.template.querySelector('#div-m-lyrcompare-transparent-static').disabled = true; // Deshabilita options de tipo de control de cortina
      this.template.querySelector('#div-m-lyrcompare-transparent-mixed').disabled = true; // Deshabilita options de tipo de control de cortina
      return;
    }
    if (this.comparisonMode === 1) {
      if (swapControl) swapControl.style.opacity = '1';
      this.template.querySelector('#m-lyrcompare-lyrA-lbl').classList.add('cp-columns-2');
      this.template.querySelector('#m-lyrcompare-lyrB-lbl').classList.add('cp-columns-1');
      this.template.querySelector('#m-lyrcompare-lyrA-cont').style.display = 'block';
      this.template.querySelector('#m-lyrcompare-lyrB-cont').style.display = 'block';
      this.template.querySelector('#m-lyrcompare-lyrA').disabled = false;
      this.template.querySelector('#m-lyrcompare-lyrB').disabled = false;
    } else if (this.comparisonMode === 2) {
      if (swapControl) swapControl.style.opacity = '1';
      this.template.querySelector('#m-lyrcompare-lyrA-lbl').classList.add('cp-columns-4');
      this.template.querySelector('#m-lyrcompare-lyrB-lbl').classList.add('cp-columns-3');
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

      this.template.querySelector('#m-lyrcompare-lyrA-lbl').classList.add('cp-th-large-1');
      this.template.querySelector('#m-lyrcompare-lyrB-lbl').classList.add('cp-th-large-2');
      this.template.querySelector('#m-lyrcompare-lyrC-lbl').classList.add('cp-th-large-3');
      this.template.querySelector('#m-lyrcompare-lyrD-lbl').classList.add('cp-th-large-4');
      this.template.querySelector('#m-lyrcompare-lyrA-cont').style.display = 'block';
      this.template.querySelector('#m-lyrcompare-lyrB-cont').style.display = 'block';
      this.template.querySelector('#m-lyrcompare-lyrC-cont').style.display = 'block';
      this.template.querySelector('#m-lyrcompare-lyrD-cont').style.display = 'block';
    }

    this.template.querySelector('input').disabled = false; // Habilita el range del radio
    this.template.querySelector('#div-m-lyrcompare-transparent-dynamic').disabled = false; // Habilita options de tipo de control de cortina
    this.template.querySelector('#div-m-lyrcompare-transparent-static').disabled = false; // Habilita options de tipo de control de cortina
    this.template.querySelector('#div-m-lyrcompare-transparent-mixed').disabled = false; // Habilita options de tipo de control de cortina
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
          const layerByUrl = this.map.getLayers().filter((l) => name.includes(l.name))[this.map
            .getLayers().filter((l) => name.includes(l.name)).length - 1];
          this.map.removeLayers(layerByUrl);
        } else {
          const layerByName = this.map.getLayers().filter((l) => layer.includes(l.name))[this.map
            .getLayers().filter((l) => layer.includes(l.name)).length - 1];
          this.map.removeLayers(layerByName);
        }
      } else if (layer instanceof Object) {
        const layerByObject = this.map.getLayers().filter((l) => layer.name.includes(l.name))[this
          .map.getLayers().filter((l) => layer.name.includes(l.name)).length - 1];
        this.map.removeLayers(layerByObject);
      }
    });
  }

  allLayerLoad() {
    let res = true;
    if (this.layers[0].load === undefined || (this.layers[1].load === undefined
      && (this.layers[2] !== undefined && this.layers[3] !== undefined
        && (this.layers[2].load === undefined || this.layers[3].load === undefined)))) {
      res = false;
    }

    return res;
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
