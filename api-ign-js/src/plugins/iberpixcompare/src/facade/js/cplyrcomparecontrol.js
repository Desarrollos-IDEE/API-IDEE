/**
 * @module M/control/LyrCompareControl
 */

import LyrcompareImplControl from 'impl/cplyrcomparecontrol';
import template from 'templates/cplyrcompare';
import templateList from 'templates/cplyrcomparelist';
import { getValue } from './i18n/language';

// eslint-disable-next-line no-extend-native
Array.prototype.unique = (a) => {
  return () => {
    return this.filter(a);
  };
};
// eslint-disable-next-line no-unused-expressions
((a, b, c) => {
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
    this.layers = [];

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

    /** Show interface
     *@public
     *@type{boolean}
     */
    this.interface = values.interface;

    this.order = values.order;
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
    console.warn(getValue('iberpixcompare_obsolete'));
    this.map = map;
    return new Promise((success, fail) => {
      this.renderPlugin(success);
    });
  }

  renderPlugin(success) {
    const emptyLayer = new M.layer.WMS({
      url: 'https://www.ign.es/wms-inspire/ign-base?',
      name: 'empty_layer',
      legend: 'Sin capa',
      tiled: false,
      version: '1.3.0',
      displayInLayerSwitcher: false,
    }, { visibility: true, displayInLayerSwitcher: false, queryable: false });
    emptyLayer.options.displayInLayerSwitcher = false;
    emptyLayer.displayInLayerSwitcher = false;

    const options = {
      jsonp: true,
      vars: {
        comparisonMode: this.comparisonMode,
        translations: {
          tooltip_vcurtain: getValue('tooltip_vcurtain'),
          tooltip_hcurtain: getValue('tooltip_hcurtain'),
          tooltip_multicurtain: getValue('tooltip_multicurtain'),
          static: getValue('static'),
          mixed: getValue('mixed'),
          static_tooltip: getValue('static_tooltip'),
          mixed_tooltip: getValue('mixed_tooltip'),
        },
      },
    };

    // template with default options
    this.template = M.template.compileSync(template, options);
    this.accessibilityTab(this.template);
    this.template.querySelectorAll('button[id^="m-lyrcompare-"]').forEach((button, i) => {
      button.addEventListener('click', this.assignEventsPlugin.bind(this, i));
      button.addEventListener('keydown', (e) => {
        if (e.keyCode === 13) this.assignEventsPlugin.bind(this, i);
      });
    });

    this.map.addLayers([emptyLayer]);
    this.map.on(M.evt.ADDED_LAYER, (evt) => {
      if (this.layerSelectedA !== null) {
        const cm = this.comparisonMode;
        this.comparisonMode = 0;
        this.deactivateCurtain();
        setTimeout(() => {
          this.comparisonMode = cm;
          this.activateCurtain();
        }, 1000);
      }
    });

    return success(this.template);
  }

  getAvailableLayers() {
    return this.map.getRootLayers().filter((layer) => {
      const isTransparent = (layer.transparent === true);
      const displayInLayerSwitcher = (layer.displayInLayerSwitcher === true || (layer.displayInLayerSwitcher === false && layer.name === 'empty_layer'));
      const isRaster = ['wms', 'wmts'].indexOf(layer.type.toLowerCase()) > -1;
      const isNotWMSFull = !((layer.type === M.layer.type.WMS)
        && M.utils.isNullOrEmpty(layer.name));
      return (isTransparent && displayInLayerSwitcher && isRaster && isNotWMSFull);
    }).reverse();
  }

  assignEventsPlugin(i) {
    this.layers = this.getAvailableLayers();
    if (this.comparisonMode === 0) {
      if ((i < 2 && this.layers.length < 2) || (i === 2 && this.layers.length < 4)) {
        M.dialog.error(getValue('no_layers_plugin'));
      } else {
        this.comparisonMode = i + 1;
        this.activateCurtain();
      }
    } else if (this.comparisonMode === i + 1) {
      this.comparisonMode = 0;
      this.deactivateCurtain();
    } else if (i === 2 && this.layers.length < 4) {
      M.dialog.error(getValue('no_layers_plugin'));
    } else {
      this.comparisonMode = i + 1;
      this.updateControls();
      this.getImpl().setComparisonMode(this.comparisonMode);
    }
  }

  /**
   * This function set events and values to template
   *
   * @public
   * @function
   * @api stable
   */
  setEventsAndValues() {
    // division selector
    if (this.staticDivision === 1) {
      this.template.querySelector('#div-m-lyrcompare-transparent-static').checked = true;
    } else {
      this.template.querySelector('#div-m-lyrcompare-transparent-mixed').checked = true;
    }

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
            layer[0] !== undefined ? layer[0].name : undefined,
            this.layerSelectedB !== undefined ? this.layerSelectedB.name : undefined,
            this.layerSelectedC !== undefined ? this.layerSelectedC.name : undefined,
            this.layerSelectedD !== undefined ? this.layerSelectedD.name : undefined,
          ];
        } else if (item.id === 'm-lyrcompare-lyrB') {
          lstLayers = [
            this.layerSelectedA !== undefined ? this.layerSelectedA.name : undefined,
            layer[0] !== undefined ? layer[0].name : undefined,
            this.layerSelectedC !== undefined ? this.layerSelectedC.name : undefined,
            this.layerSelectedD !== undefined ? this.layerSelectedD.name : undefined,
          ];
        } else if (item.id === 'm-lyrcompare-lyrC') {
          lstLayers = [
            this.layerSelectedA !== undefined ? this.layerSelectedA.name : undefined,
            this.layerSelectedB !== undefined ? this.layerSelectedB.name : undefined,
            layer[0] !== undefined ? layer[0].name : undefined,
            this.layerSelectedD !== undefined ? this.layerSelectedD.name : undefined,
          ];
        } else if (item.id === 'm-lyrcompare-lyrD') {
          lstLayers = [
            this.layerSelectedA !== undefined ? this.layerSelectedA.name : undefined,
            this.layerSelectedB !== undefined ? this.layerSelectedB.name : undefined,
            this.layerSelectedC !== undefined ? this.layerSelectedC.name : undefined,
            layer[0] !== undefined ? layer[0].name : undefined,
          ];
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
          if (this.layerSelectedC !== undefined && layer[0].name === this.layerSelectedC.name) {
            this.layerSelectedC.setVisible(false);
            this.layerSelectedC = this.layerSelectedA;
            this.template.querySelector('#m-lyrcompare-lyrC').value = this.layerSelectedA.name;
          }

          if (this.layerSelectedD !== undefined && layer[0].name === this.layerSelectedD.name) {
            this.layerSelectedD.setVisible(false);
            this.layerSelectedD = this.layerSelectedA;
            this.template.querySelector('#m-lyrcompare-lyrD').value = this.layerSelectedA.name;
          }
        } else if (item.id === 'm-lyrcompare-lyrB') {
          if (this.layerSelectedC !== undefined && layer[0].name === this.layerSelectedC.name) {
            this.layerSelectedC.setVisible(false);
            this.layerSelectedC = this.layerSelectedB;
            this.template.querySelector('#m-lyrcompare-lyrC').value = this.layerSelectedB.name;
          }

          if (this.layerSelectedD !== undefined && layer[0].name === this.layerSelectedD.name) {
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
    let res = true;
    if ((this.comparisonMode === 1) || (this.comparisonMode === 2)) {
      res = lyerA !== lyerB;
    } else {
      const compLyers = [lyerA, lyerB, lyerC, lyerD];
      res = compLyers.length === compLyers.unique().length;
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
    this.layers = this.getAvailableLayers();
    const layers = this.layers.map((layer) => {
      return {
        name: layer.name,
        legend: layer.legend,
      };
    });

    const options = {
      jsonp: true,
      vars: {
        options: layers,
        comparisonMode: this.comparisonMode,
        translations: {
          lyrLeftSelect_tooltip: getValue('lyrLeftSelect_tooltip'),
          lyrRightSelect_tooltip: getValue('lyrRightSelect_tooltip'),
        },
      },
    };

    // template with default options
    const html = M.template.compileSync(templateList, options);
    this.accessibilityTab(html);
    document.querySelector('#m-lyrcompare-list-container').innerHTML = '';
    document.querySelector('#m-lyrcompare-list-container').appendChild(html);
    this.setEventsAndValues();
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
    this.disablePrintButtons();
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
    this.enablePrintButtons();
    this.layerSelectedA = null;
    this.layerSelectedB = null;
    this.layerSelectedC = null;
    this.layerSelectedD = null;
    document.querySelector('#m-lyrcompare-list-container').innerHTML = '';
    this.map.fire(M.evt.ADDED_LAYER);
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

      this.template.querySelectorAll('input[type="radio"]').forEach((item) => {
        // eslint-disable-next-line no-param-reassign
        item.disabled = true;
      });
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

    this.template.querySelectorAll('input[type="radio"]').forEach((item) => {
      // eslint-disable-next-line no-param-reassign
      item.disabled = false;
    });
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
    if (this.template.querySelector('#m-lyrcompare-lyrA-cont') !== null) {
      this.template.querySelector('#m-lyrcompare-lyrA-cont').style.display = 'none';
    }

    if (this.template.querySelector('#m-lyrcompare-lyrB-cont') !== null) {
      this.template.querySelector('#m-lyrcompare-lyrB-cont').style.display = 'none';
    }

    if (this.template.querySelector('#m-lyrcompare-lyrC-cont') !== null) {
      this.template.querySelector('#m-lyrcompare-lyrC-cont').style.display = 'none';
    }

    if (this.template.querySelector('#m-lyrcompare-lyrD-cont') !== null) {
      this.template.querySelector('#m-lyrcompare-lyrD-cont').style.display = 'none';
    }

    if (this.template.querySelector('#m-lyrcompare-lyrA-lbl') !== null) {
      this.template.querySelector('#m-lyrcompare-lyrA-lbl').classList = '';
    }

    if (this.template.querySelector('#m-lyrcompare-lyrB-lbl') !== null) {
      this.template.querySelector('#m-lyrcompare-lyrB-lbl').classList = '';
    }

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

  accessibilityTab(html) {
    html.querySelectorAll('[tabindex="0"]').forEach((el) => el.setAttribute('tabindex', this.order));
  }
}
