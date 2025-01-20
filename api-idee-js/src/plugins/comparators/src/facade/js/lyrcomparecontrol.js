/**
 * @module M/control/LyrCompareControl
 */

import LyrcompareImplControl from 'impl/lyrcomparecontrol';
import template from 'templates/lyrcompare';
import { getValue } from './i18n/language';
import dicAccesibilityButtonES from './i18n/accessibility_es';
import dicAccesibilityButtonEN from './i18n/accessibility_en';
import { transformToLayers } from './utils';

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
  constructor(values, controlsLayers, map, fatherControl) {
    // 1. checks if the implementation can create PluginControl
    if (M.utils.isUndefined(LyrcompareImplControl) || (M.utils.isObject(LyrcompareImplControl)
      && M.utils.isNullOrEmpty(Object.keys(LyrcompareImplControl)))) {
      M.exception(getValue('exception'));
    }

    // 2. implementation of this control
    const impl = new LyrcompareImplControl(map);
    super(impl, 'LyrCompare');
    impl.addTo(map);
    this.map_ = map;

    /**
     * Name plugin
     * @private
     * @type {String}
     */
    this.name_ = 'lyrcompare';

    /**
     * Layer names that will have effects
     * @public
     * Value: the names separated with commas
     * @type {Array<String>}
     */
    this.layers = transformToLayers(controlsLayers); // Capas mapa principal

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
       * staticDivision
       * Value: number in range 0 - 1
       * @type {number}
       * @public
       */
    // eslint-disable-next-line radix
    this.staticDivision = values.staticDivision === undefined ? 1 : parseInt(values.staticDivision);

    /**
    * Opacity
    * Value: number in range 0 - 100
    * @type {number}
    * @public
    */
    this.opacityVal = 100;
    if (values.opacityVal === undefined) {
      this.opacityVal = 100;
    } else {
      // eslint-disable-next-line radix
      this.opacityVal = parseInt(values.opacityVal);
      if (this.opacityVal <= 0) {
        this.opacityVal = 0;
      } else if (this.opacityVal >= 100) {
        this.opacityVal = 100;
      }
    }

    /**
      * Comparison mode
      * 0: desactivado, 1: vertical, 2: horizontal, 3: multivista
      * @private
      * @type {Number}
      */
    this.comparisonMode = 0;
    if (values.defaultCompareViz === undefined) {
      this.comparisonMode = 0;
    } else {
      // eslint-disable-next-line radix
      this.comparisonMode = parseInt(values.defaultCompareViz);
      if (this.comparisonMode <= 0 || this.comparisonMode > 3) {
        this.comparisonMode = 0;
      }
    }

    /**
      * Layer A default
      * @private
      * @type {Number}
      */
    this.defaultLyrA = 0;
    if (values.defaultLyrA === undefined) {
      this.defaultLyrA = 0;
    } else {
      // eslint-disable-next-line radix
      this.defaultLyrA = parseInt(values.defaultLyrA);
    }

    /**
      * Layer B default
      * @private
      * @type {Number}
      */
    this.defaultLyrB = 0;
    if (values.defaultLyrB === undefined) {
      this.defaultLyrB = this.defaultLyrA !== 0 ? 0 : 1;
    } else {
      // eslint-disable-next-line radix
      this.defaultLyrB = parseInt(values.defaultLyrB);
    }

    if (this.defaultLyrA === this.defaultLyrB) {
      M.dialog.error(getValue('repeated_layers'), 'lyrcompare');
      this.error_ = true;
    }

    /**
      * Layer C default
      * @private
      * @type {Number}
      */
    this.defaultLyrC = 2;
    if (values.defaultLyrC === undefined) {
      this.defaultLyrC = 2;
    } else {
      // eslint-disable-next-line radix
      this.defaultLyrC = parseInt(values.defaultLyrC);
    }

    if ((this.defaultLyrA === this.defaultLyrC) || (this.defaultLyrB === this.defaultLyrC)) {
      M.dialog.error(getValue('repeated_layers'), 'lyrcompare');
      this.error_ = true;
    }

    /**
      * Layer D default
      * @private
      * @type {Number}
      */
    this.defaultLyrD = 3;
    if (values.defaultLyrD === undefined) {
      this.defaultLyrD = 3;
    } else {
      // eslint-disable-next-line radix
      this.defaultLyrD = parseInt(values.defaultLyrD);
    }

    if ((this.defaultLyrA === this.defaultLyrD)
    || (this.defaultLyrB === this.defaultLyrD)
    || (this.defaultLyrC === this.defaultLyrD)) {
      M.dialog.error(getValue('repeated_layers'), 'lyrcompare');
      this.error_ = true;
    }

    /** Show interface
      *@public
      *@type{boolean}
      */
    this.interface = values.interface === undefined ? true : values.interface;

    this.dicAccesibilityButton = (M.language.getLang() === 'es') ? dicAccesibilityButtonES : dicAccesibilityButtonEN;

    this.fatherControl_ = fatherControl;
  }

  /**
    * This function creates the view
    *
    * @public
    * @function
    * @api stable
    */
  active(html) {
    const templateResult = new Promise((success, fail) => {
      this.comparisonMode = 0;

      const emptyLayer = new M.layer.WMS({
        url: 'https://www.ign.es/wms-inspire/ign-base?',
        name: 'empty_layer',
        legend: getValue('selector'),
        tiled: false,
        version: '1.3.0',
        displayInLayerSwitcher: false,
      }, { visibility: true, displayInLayerSwitcher: false, queryable: false });

      this.layers.push(emptyLayer);

      this.addDefaultLayers_();

      this.setFunctionsAndCompile(success);
    });

    templateResult
      .then((t) => {
        html.querySelector('#m-comparators-contents').appendChild(t);

        setTimeout(() => {
          const selectFirst = document.querySelector('#m-lyrcompare-void');
          if (selectFirst) {
            selectFirst.click();
          }
        }, 1000);
      });
  }

  deactiveByError_() {
    this.fatherControl_.controls[1].active = false;
    const target = document.querySelector('#lyrcompare-btn');
    target.classList.remove('activatedComparators');

    setTimeout(() => {
      this.template.remove();
    }, 10);

    this.deactivate();
  }

  addDefaultLayers_() {
    if (!this.isDefaultLyr_()) {
      this.layers.forEach((layer, i) => {
        if (layer.getImpl().getLayer() === null
           && (i === this.defaultLyrA
            || i === this.defaultLyrB
            || i === this.defaultLyrC
            || i === this.defaultLyrD)) {
          const mapLayer = this.map_.getLayers().filter((l) => l.name === layer.name);
          if (mapLayer.length > 0) {
            this.map_.removeLayers(mapLayer[0]);
          }
          this.map_.addLayers(layer);
          layer.setVisible(false);
        }
      });
    } else {
      /*
      ? Añade las capas por defecto si no se quiere que aparezca las capas vacías

      const nLayers = (this.comparisonMode === 1
        || this.comparisonMode === 2
        || this.comparisonMode !== 0) ? 2 : 4;

      this.layers.forEach((layer, i) => {
        if (layer.getImpl().getLayer() === null && i < nLayers) {
          this.map_.addLayers(layer);
          layer.setVisible(false);
        }
      });
      */

      const lastIndexEmptyLayer = this.layers.length - 1;
      this.defaultLyrA = lastIndexEmptyLayer;
      this.defaultLyrB = lastIndexEmptyLayer;
      this.defaultLyrC = lastIndexEmptyLayer;
      this.defaultLyrD = lastIndexEmptyLayer;
    }
  }

  isDefaultLyr_() {
    return this.defaultLyrA === 0
    && this.defaultLyrB === 1
    && this.defaultLyrC === 2
    && this.defaultLyrD === 3;
  }

  /**
   * This function destroys this plugin
   *
   * @public
   * @function
   * @api stable
   */
  destroy() {
    this.deactivate();
    const swipeControl = document.querySelector('.lyrcompare-swipe-control');
    if (swipeControl) { swipeControl.remove(); }

    this.control_.removeCurtainLayers(this.control_.getLayersNames());

    [this.name_, this.error_, this.map_,
      this.layers_,
      this.position, this.collapsed, this.collapsible,
      this.staticDivision, this.opacityVal, this.comparisonMode, this.metadata_,
      this.tooltip_, this.interface, this.defaultLyrA,
      this.defaultLyrB, this.defaultLyrC, this.defaultLyrD,
    ] = [null, null, null, null, null, null, null, null, null, null,
      null, null, null, null, null, null, null, null];
  }

  deactivate() {
    if (!this.template) return;
    // Valores por defecto
    this.comparisonMode = 0;
    this.layers = [];
    this.layerSelectedA = null;
    this.layerSelectedB = null;
    this.layerSelectedC = null;
    this.layerSelectedD = null;
    this.staticDivision = 1;
    this.opacityVal = 100;
    this.defaultLyrA = 0;
    this.defaultLyrB = 1;
    this.defaultLyrC = 2;
    this.defaultLyrD = 3;
    this.interface = true;

    this.deactivateCurtain();
    this.template.remove();

    const swipeControl = document.querySelector('.lyrcompare-swipe-control');
    if (swipeControl) {
      swipeControl.remove();
    }
  }

  updateNewLayers() {
    if (!this.template) return;

    // this.layerSelectedA = null;
    // this.layerSelectedB = null;
    // this.layerSelectedC = null;
    // this.layerSelectedD = null;
    this.opacityVal = 100;
    // this.defaultLyrA = 0;
    // this.defaultLyrB = 1;
    // this.defaultLyrC = 2;
    // this.defaultLyrD = 3;
    this.interface = true;

    const swipeControl = document.querySelector('.lyrcompare-swipe-control');
    if (swipeControl) {
      swipeControl.classList.display = 'none !important';
    }

    if (swipeControl) {
      swipeControl.remove();
    }

    if (this.layerSelectedA !== null && this.layerSelectedB !== null) {
      this.layerSelectedA.setVisible(false);
      this.layerSelectedB.setVisible(false);
    }

    if (this.layerSelectedC !== null
        && this.layerSelectedD !== null
        && this.layerSelectedC !== undefined && this.layerSelectedD !== undefined) {
      this.layerSelectedC.setVisible(false);
      this.layerSelectedD.setVisible(false);
    }

    this.removeEffectsComparison();
    this.updateControls();

    this.template.remove();
  }

  /**
   * Change span text
   * @param {String} class Texto
   */
  changeSpanText(idButton) {
    const dicMirrorLang = {
      'm-lyrcompare-vcurtain': 'set-mirror-1',
      'm-lyrcompare-hcurtain': 'set-mirror-2',
      'm-lyrcompare-void': 'set-mirror-0',
      'm-lyrcompare-multicurtain': 'set-mirror-5',
    };

    const mirrorID = dicMirrorLang[idButton];
    const langMirror = this.dicAccesibilityButton[mirrorID];

    langMirror.forEach(({ id, text }) => {
      document.querySelector(`.${id}`).innerHTML = text.secondaryMap;
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
        ? { name: layer.name, legend: layer.legend } : { name: layer, legend: layer };
    });

    const options = {
      jsonp: true,
      vars: {
        options: layers,
        translations: {
          tooltip_vcurtain: getValue('tooltip_vcurtain'),
          tooltip_hcurtain: getValue('tooltip_hcurtain'),
          tooltip_void: getValue('tooltip_void'),
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

    // if (this.comparisonMode) {
    //   this.activateCurtain();
    // }

    if ((this.layers.length - 1) === 0) {
      M.dialog.error(getValue('no_layers_plugin'));
    } else {
      this.activateCurtain();
      this.template.querySelectorAll('button[id^="m-lyrcompare-"]').forEach((button, i) => {
        button.addEventListener('click', (evt) => {
          const nLayers = (this.map_.getWMS().length + this.map_.getWMTS().length) - 1;
          this.changeSpanText(evt.target.id);

          if (nLayers < 3 && button.value === 'multicurtain') {
            M.toast.error(getValue('exception.fourLayers'), null, 6000);
            return;
          }

          if (button.value === 'void') {
            this.comparisonMode = 0;
          }

          if (button.value === 'vcurtain') {
            this.comparisonMode = 1;
          }

          if (button.value === 'hcurtain') {
            this.comparisonMode = 2;
          }

          if (button.value === 'multicurtain') {
            this.activeDefault();
            this.activateEffectCurtain();
            this.comparisonMode = 3;
          }

          this.updateControls();
          this.getImpl().setComparisonMode(this.comparisonMode);
          this.setVisibleLayers_();
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
      this.getImpl().removeInteraction();
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
      // eslint-disable-next-line consistent-return
      item.addEventListener('change', (evt) => {
        const options = evt.target.options;
        Array.prototype.forEach.call(options, (option) => option.removeAttribute('selected'));
        evt.target.selectedOptions[0].setAttribute('selected', '');

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

        let lstLayers = [];
        if (item.id === 'm-lyrcompare-lyrA') {
          lstLayers = [layer[0].name,
            this.layerSelectedB.name,
            this.layerSelectedC ? this.layerSelectedC.name : undefined,
            this.layerSelectedD ? this.layerSelectedD.name : undefined,
          ];
        } else if (item.id === 'm-lyrcompare-lyrB') {
          lstLayers = [
            this.layerSelectedA.name,
            layer[0].name,
            this.layerSelectedC ? this.layerSelectedC.name : undefined,
            this.layerSelectedD ? this.layerSelectedD.name : undefined,
          ];
        } else if (item.id === 'm-lyrcompare-lyrC') {
          lstLayers = [
            this.layerSelectedA.name,
            this.layerSelectedB.name,
            layer[0].name,
            this.layerSelectedD ? this.layerSelectedD.name : undefined,
          ];
        } else if (item.id === 'm-lyrcompare-lyrD') {
          lstLayers = [
            this.layerSelectedA.name,
            this.layerSelectedB.name,
            this.layerSelectedC ? this.layerSelectedC.name : undefined,
            layer[0].name,
          ];
        }

        // e2m: de esta forma pasamos los parámetros en forma de array
        if (this.checkLayersAreDifferent(...lstLayers) === false) {
          M.toast.error(getValue('advice_sameLayer'), null, 6000);
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
          if (this.layerSelectedC && layer[0].name === this.layerSelectedC.name) {
            this.layerSelectedC.setVisible(false);
            this.layerSelectedC = this.layerSelectedA;
            this.template.querySelector('#m-lyrcompare-lyrC').value = this.layerSelectedA.name;
          }

          if (this.layerSelectedD && layer[0].name === this.layerSelectedD.name) {
            this.layerSelectedD.setVisible(false);
            this.layerSelectedD = this.layerSelectedA;
            this.template.querySelector('#m-lyrcompare-lyrD').value = this.layerSelectedA.name;
          }
        } else if (item.id === 'm-lyrcompare-lyrB') {
          if (this.layerSelectedC && layer[0].name === this.layerSelectedC.name) {
            this.layerSelectedC.setVisible(false);
            this.layerSelectedC = this.layerSelectedB;
            this.template.querySelector('#m-lyrcompare-lyrC').value = this.layerSelectedB.name;
          }

          if (this.layerSelectedD && layer[0].name === this.layerSelectedD.name) {
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
          if (this.layerSelectedC) {
            this.layerSelectedC.setVisible(false);
          }

          this.layerSelectedC = layer[0];
        } else if (item.id === 'm-lyrcompare-lyrD') {
          if (this.layerSelectedD) {
            this.layerSelectedD.setVisible(false);
          }

          this.layerSelectedD = layer[0];
        }

        this.activateEffectCurtain();
      });
    });
  }

  activateEffectCurtain() {
    // ? Necessario para tener ol3
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
      this.updateControls();
    }, 1000);
  }

  setVisibleLayers_() {
    if (this.comparisonMode === 0) {
      this.layerSelectedA.setVisible(false);
      this.layerSelectedB.setVisible(false);
      if (this.layerSelectedC !== null && this.layerSelectedD !== null) {
        this.layerSelectedC.setVisible(false);
        this.layerSelectedD.setVisible(false);
      }
    }

    if (this.comparisonMode === 1 || this.comparisonMode === 2) {
      this.layerSelectedA.setVisible(true);
      this.layerSelectedB.setVisible(true);
      if (this.layerSelectedC !== null && this.layerSelectedD !== null) {
        this.layerSelectedC.setVisible(false);
        this.layerSelectedD.setVisible(false);
      }
    }
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
      // res = compLyers.length !== compLyers.unique().length;
      // No entiendo por qué esto funcionaba antes y ahora no
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
    this.activateEffectCurtain();
  }

  /**
    * Activate default values
    *
    * @public
    * @function
    * @api stable
    */
  activeDefault() {
    if (this.layerSelectedA === null && this.layers.length >= 1) {
      this.layerSelectedA = this.layers[this.defaultLyrA];
      const selectA = this.template.querySelector('#m-lyrcompare-lyrA');
      selectA.selectedIndex = this.defaultLyrA;
      if (!selectA.options[this.defaultLyrA]) {
        M.dialog.error('Error layerSelectedA', 'lyrcompare');
        this.deactiveByError_();
        return;
      }

      selectA.options[this.defaultLyrA].setAttribute('selected', '');
      if (this.map_.getLayers().some((l) => l.name === this.layerSelectedA.name)) {
        this.map_.addLayers(this.layerSelectedA);
      }
    }

    if (this.layerSelectedB === null && this.layers.length >= 2) {
      this.layerSelectedB = this.layers[this.defaultLyrB];
      const selectB = this.template.querySelector('#m-lyrcompare-lyrB');
      selectB.selectedIndex = this.defaultLyrB;
      selectB.options[this.defaultLyrB].setAttribute('selected', '');

      if (!selectB.options[this.defaultLyrB]) {
        M.dialog.error('Error layerSelectedB', 'lyrcompare');
        this.deactiveByError_();
        return;
      }

      selectB.options[this.defaultLyrB].setAttribute('selected', '');

      if (this.map_.getLayers().some((l) => l.name === this.layerSelectedB.name)) {
        this.map_.addLayers(this.layerSelectedB);
      }
    }

    if (this.layerSelectedC === null && this.layers.length >= 3) {
      this.layerSelectedC = this.layers[this.defaultLyrC];
      const selectC = this.template.querySelector('#m-lyrcompare-lyrC');
      selectC.selectedIndex = this.defaultLyrC;
      selectC.options[this.defaultLyrC].setAttribute('selected', '');

      if (!selectC.options[this.defaultLyrC]) {
        M.dialog.error('Error layerSelectedC', 'lyrcompare');
        this.deactiveByError_();
        return;
      }

      selectC.selectedIndex = this.defaultLyrC;
      selectC.options[this.defaultLyrC].setAttribute('selected', '');

      if (this.map_.getLayers().some((l) => l.name === this.layerSelectedC.name)) {
        this.map_.addLayers(this.layerSelectedC);
      }
    }

    if (this.layerSelectedD === null && this.layers.length >= 4) {
      this.layerSelectedD = this.layers[this.defaultLyrD];
      const selectD = this.template.querySelector('#m-lyrcompare-lyrD');
      selectD.selectedIndex = this.defaultLyrD;
      selectD.options[this.defaultLyrD].setAttribute('selected', '');

      if (!selectD.options[this.defaultLyrD]) {
        M.dialog.error('Error layerSelectedD', 'lyrcompare');
        this.deactiveByError_();
        return;
      }

      selectD.options[this.defaultLyrD].setAttribute('selected', '');

      if (this.map_.getLayers().some((l) => l.name === this.layerSelectedD.name)) {
        this.map_.addLayers(this.layerSelectedD);
      }
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

    if (this.layerSelectedC !== null
        && this.layerSelectedD !== null
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
      // eslint-disable-next-line no-plusplus
      for (let iOpt = 1; iOpt < dropDownContainer.options.length; iOpt++) {
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
    } if (this.comparisonMode === 1) {
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
    if (this.comparisonMode === 0) {
      this.template.querySelector('#m-lyrcompare-void').classList.add('buttom-pressed');
    } else if (this.comparisonMode === 1) {
      this.template.querySelector('#m-lyrcompare-vcurtain').classList.add('buttom-pressed');
    } else if (this.comparisonMode === 2) {
      this.template.querySelector('#m-lyrcompare-hcurtain').classList.add('buttom-pressed');
    } else if (this.comparisonMode === 3) {
      this.template.querySelector('#m-lyrcompare-multicurtain').classList.add('buttom-pressed');
    }
  }

  removeActivate() {
    if (this.template.querySelector('.buttom-pressed')) {
      this.template.querySelector('.buttom-pressed').classList.remove('buttom-pressed');
    }

    this.template.querySelectorAll('select[id^="m-lyrcompare-"]').disabled = true;
    this.template.querySelector('#m-lyrcompare-lyrA-cont').style.display = 'none';
    this.template.querySelector('#m-lyrcompare-lyrB-cont').style.display = 'none';
    this.template.querySelector('#m-lyrcompare-lyrC-cont').style.display = 'none';
    this.template.querySelector('#m-lyrcompare-lyrD-cont').style.display = 'none';
    this.template.querySelector('#m-lyrcompare-lyrA-lbl').classList.remove('cp-th-large-1', 'cp-columns-2');
    this.template.querySelector('#m-lyrcompare-lyrA-lbl').classList.remove('cp-th-large-2', 'cp-columns-3');
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
          const layerByUrl = this.map_.getLayers()
            .filter((l) => name.includes(l.name)).pop();
          this.map_.removeLayers(layerByUrl);
        } else {
          const layerByName = this.map_.getLayers()
            .filter((l) => layer.includes(l.name)).pop();
          this.map_.removeLayers(layerByName);
        }
      } else if (layer instanceof Object) {
        const layerByObject = this.map_.getLayers()
          .filter((l) => layer.name.includes(l.name)).pop();
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
    return control instanceof LyrCompareControl;
  }

  getLayersNames() {
    return this.layers.map((l) => l.name);
  }

  addlayersControl(layer) {
    this.layers.push(layer);
  }
}
