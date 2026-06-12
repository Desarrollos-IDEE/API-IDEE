/**
 * @module IDEE/plugin/WFSTControls
 */
import api from '../../api';
import myhelp from '../../templates/myhelp.html';
import '../assets/css/wfstcontrols';
import ClearFeature from './clearfeature';
import DeleteFeature from './deletefeature';
import DrawFeature from './drawfeature';
import EditAttribute from './editattribute';
import en from './i18n/en';
import es from './i18n/es';
import { getValue } from './i18n/language';
import ModifyFeature from './modifyfeature';
import SaveFeature from './savefeature';

/**
 * @classdesc
 * Main facade plugin object. This class creates a plugin
 * object which has an implementation Object
 *
 * @constructor
 * @extends {IDEE.Plugin}
 * @param {array | string} controls - Array of controls to be added
 * @param {string} layername - Name of the WFS layer
 * @param {string} geometry - Geometry of the WFS layer
 * @api stable
 */
export default class WFSTControls extends IDEE.Plugin {
  constructor(controls, layername, geometry, proxyStatus, proxyDisable) {
    super();

    let controlsfix;
    let layernamefix;
    let geometryfix;
    const proxyfix = {};
    let optionsPosition = 'TL';

    // Parse new controls model to the old one

    if (!controls.length || !Array.isArray(controls)) {
      layernamefix = controls.layername;
      controlsfix = controls.features.split(',');
      geometryfix = controls.geometry;
      proxyfix.status = controls.proxy ? controls.proxy.status === true || controls.proxy.status === 'true' : true;
      proxyfix.disable = controls.proxy ? controls.proxy.disable === true || controls.proxy.disable === 'true' : true;
      if (controls.position) {
        optionsPosition = controls.position;
      }
    } else {
      layernamefix = layername;
      controlsfix = controls;
      geometryfix = geometry;
      proxyfix.status = proxyStatus;
      proxyfix.disable = proxyDisable;
    }

    const positions = ['TR', 'TL', 'BL', 'BR'];
    this.position_ = positions.includes(optionsPosition) ? optionsPosition : 'TL';

    /**
     * Array of controls to be added
     * @private
     * @type {String}
     */

    this.controls = controlsfix;
    /**
     * Array of controls to be added
     * @private
     * @type {String}
     */
    this.controls_ = [];

    /**
     * Geometry of the layer
     * @private
     * @type {String}
     */

    this.geometry = geometryfix;

    /**
     * Name of this control
     * @public
     * @type {string}
     * @api stable
     */
    this.name = WFSTControls.NAME;

    /**
     * Layer
     * @private
     * @type {String}
     */
    this.layername_ = layernamefix;

    /**
     * Proxy config
     * @private
     * @type {boolean}
     */

    this.proxy = proxyfix;

    /**
     * Facade of the map
     * @private
     * @type {IDEE.Map}
     */
    this.map_ = null;

    /**
     * Implementation of this object
     * @private
     * @type {Object}
     */
    this.drawfeature_ = null;

    /**
     * Implementation of this object
     * @private
     * @type {Object}
     */
    this.modifyfeature_ = null;

    /**
     * Implementation of this object
     * @private
     * @type {Object}
     */
    this.deletefeature_ = null;

    /**
     * Implementation of this object
     * @private
     * @type {Object}
     */
    this.clearfeature_ = null;

    /**
     * Implementation of this object
     * @private
     * @type {Object}
     */
    this.savefeature_ = null;

    /**
     * Implementation of this object
     * @private
     * @type {Object}
     */
    this.editattibute_ = null;

    /**
     * Metadata from api.json
     * @private
     * @type {Object}
     */
    this.metadata_ = api.metadata;

    /**
     * Number controls
     * @private
     * @type {Object}
     */
    this.numControls_ = 0;

    /**
     * Number load controls
     * @private
     * @type {Object}
     */
    this.numLoadControls_ = 0;
  }

  /**
   * This function provides the implementation
   * of the object
   *
   * @public
   * @function
   * @param {Object} map - Map to add the plugin
   * @api stable
   */
  addTo(map) {
    this.map_ = map;
    const firstLayer = this.map_.getWFS()[0];
    const firstNamedLayer = this.map_.getWFS({
      name: this.layername_,
    })[0];
    const wfslayer = IDEE.utils.isNullOrEmpty(firstNamedLayer) ? firstLayer : firstNamedLayer;

    if (!wfslayer) {
      IDEE.dialog.error(getValue('exception.WFSlayernotfound'));
      return;
    }

    if (!this.geometry) {
      let geomChanged = false;

      const tryParseGeometry = () => {
        if (!IDEE.utils.isNullOrEmpty(wfslayer)
          && !wfslayer.geometry
          && wfslayer.getFeatures
          && wfslayer.getFeatures().length > 0) {
          const reemplazos = {
            MultiPolygon: 'MPOLYGON',
            MultiPoint: 'MPOINT',
            Polygon: 'POLYGON',
            Point: 'POINT',
            LineString: 'LINESTRING',
            MultiLineString: 'MLINESTRING',
          };

          try {
            const geom = wfslayer.getGeometryType();
            if (geom) {
              wfslayer.geometry = reemplazos[geom] || geom;
            } else {
              throw new Error('getGeometryType returned no value');
            }
          } catch (error) {
            IDEE.dialog.error(getValue('exceptiom.errorgeometryparameter'));
          }
          return true;
        }
        return false;
      };

      geomChanged = tryParseGeometry();

      wfslayer.on(IDEE.evt.LOAD, () => {
        if (!geomChanged) {
          tryParseGeometry();
        }
      });
    } else {
      try {
        wfslayer.geometry = this.geometry;
      } catch (error) {
        IDEE.dialog.error(getValue('exception.errorloadingplugin'));
      }
    }

    this.panel_ = new IDEE.ui.Panel('edit', {
      collapsible: true,
      className: 'm-edition',
      collapsedButtonClass: 'g-cartografia-editar',
      position: IDEE.ui.position[this.position_],
      tooltip: getValue('tooltip'),
    });
    if (IDEE.utils.isNullOrEmpty(wfslayer)) {
      IDEE.dialog.error(`${getValue('exception.noWFSlayerloaded')}<b>${this.controls.join(',')}</b>${getValue('exception.noWFSlayerloaded1')}`);
    } else {
      let addSave = false;
      let addClear = false;
      for (let i = 0, ilen = this.controls.length; i < ilen; i += 1) {
        if (this.controls[i] === 'drawfeature') {
          this.drawfeature_ = new DrawFeature(wfslayer);
          this.controls_.push(this.drawfeature_);
          addSave = true;
          addClear = true;
          this.numControls_ += 1;
          this.drawfeature_.on(IDEE.evt.ADDED_TO_MAP, () => {
            this.checkAddControlsToMap();
          });
        } else if (this.controls[i] === 'modifyfeature') {
          this.modifyfeature_ = new ModifyFeature(wfslayer);
          this.controls_.push(this.modifyfeature_);
          addSave = true;
          addClear = true;
          this.numControls_ += 1;
          this.modifyfeature_.on(IDEE.evt.ADDED_TO_MAP, () => {
            this.checkAddControlsToMap();
          });
        } else if (this.controls[i] === 'deletefeature') {
          this.deletefeature_ = new DeleteFeature(wfslayer);
          this.controls_.push(this.deletefeature_);
          addSave = true;
          addClear = true;
          this.numControls_ += 1;
          this.deletefeature_.on(IDEE.evt.ADDED_TO_MAP, () => {
            this.checkAddControlsToMap();
          });
        } else if (this.controls[i] === 'editattribute') {
          this.editattibute_ = new EditAttribute(wfslayer);
          this.controls_.push(this.editattibute_);
          addClear = true;
          this.numControls_ += 1;
          this.editattibute_.on(IDEE.evt.ADDED_TO_MAP, () => {
            this.checkAddControlsToMap();
          });
        }
      }

      if (addSave) {
        this.savefeature_ = new SaveFeature(wfslayer, this.proxy);
        this.controls_.push(this.savefeature_);
        this.numControls_ += 1;
        this.savefeature_.on(IDEE.evt.ADDED_TO_MAP, () => {
          this.checkAddControlsToMap();
        });
      }
      if (addClear) {
        this.clearfeature_ = new ClearFeature(wfslayer);
        this.controls_.push(this.clearfeature_);
        this.numControls_ += 1;
        this.clearfeature_.on(IDEE.evt.ADDED_TO_MAP, () => {
          this.checkAddControlsToMap();
        });
      }

      this.panel_.addControls(this.controls_);
      this.map_.addPanels(this.panel_);
      this.map_.panel.EDITION = this.panel_;
    }
  }

  /**
   * This function return the control of plugin
   *
   * @public
   * @function
   * @api stable
   */
  getControls() {
    return this.controls_;
  }

  /**
   * This function return the geometry provided
   *
   * @public
   * @function
   * @api stable
   */
  getGeometry() {
    return this.geometry;
  }

  /**
   * This function destroys this plugin
   *
   * @public
   * @function
   * @api stable
   */
  destroy() {
    this.map_.removeControls([
      this.drawfeature_,
      this.modifyfeature_,
      this.deletefeature_,
      this.clearfeature_,
      this.savefeature_,
      this.editattibute_,
    ]);
    this.controls = null;
    this.map_ = null;
    this.drawfeature_ = null;
    this.modifyfeature_ = null;
    this.deletefeature_ = null;
    this.clearfeature_ = null;
    this.savefeature_ = null;
    this.editattibute_ = null;
  }

  /**
   * This function set layer
   *
   * @public
   * @function
   * @param {IDEE.layer.WFS} layer - Layer
   * @api stable
   */
  setLayer(layername) {
    this.layername_ = layername;
    const wfslayer = this.map_.getWFS({
      name: this.layername_,
    })[0];
    if (IDEE.utils.isNullOrEmpty(wfslayer)) {
      IDEE.dialog.error(`${getValue('exception.noloadedWFSlayer')}<b>${layername}</b>${getValue('exception.noloadedWFSlayer1')}.`);
    } else {
      const objControls = [];
      if (!IDEE.utils.isNullOrEmpty(this.drawfeature_)) objControls.push(this.drawfeature_);
      if (!IDEE.utils.isNullOrEmpty(this.modifyfeature_)) objControls.push(this.modifyfeature_);
      if (!IDEE.utils.isNullOrEmpty(this.deletefeature_)) objControls.push(this.deletefeature_);
      if (!IDEE.utils.isNullOrEmpty(this.clearfeature_)) objControls.push(this.clearfeature_);
      if (!IDEE.utils.isNullOrEmpty(this.savefeature_)) objControls.push(this.savefeature_);
      if (!IDEE.utils.isNullOrEmpty(this.editattibute_)) objControls.push(this.editattibute_);

      // let ctrlActivo = null;
      // objControls.forEach(function (ctrl){if (ctrl.activated) ctrlActivo = ctrl});
      this.clearfeature_.getImpl().clear();
      objControls.forEach((ctrl) => ctrl.setLayer(wfslayer));
      // if(ctrl===ctrlActivo){ ctrl.activate();} //JGL: TODO no funciona
    }
  }

  /**
   * This function compare if pluging recieved by param is instance of IDEE.plugin.WFSTControls
   *
   * @public
   * @function
   * @param {IDEE.plugin} plugin to comapre
   * @api stable
   */

  equals(plugin) {
    if (plugin instanceof WFSTControls) {
      return true;
    }
    return false;
  }

  /**
   * Gets the parameter api rest of the plugin
   *
   * @public
   * @function
   * @api
   */
  getAPIRest() {
    return `wfstcontrols=${this.controls.join(',')}`;
  }

  /**
   * This function gets metadata plugin
   *
   * @public
   * @function
   * @api stable
   */
  getMetadata() {
    return this.metadata_;
  }

  /**
   * This function return the control of plugin
   *
   * @public
   * @function
   * @api stable
   */
  checkAddControlsToMap() {
    this.numLoadControls_ += 1;
    if (this.numLoadControls_ === this.numControls_) {
      this.fire(IDEE.evt.ADDED_TO_MAP);
    }
  }

  /**
   * Return plugin language
   *
   * @public
   * @function
   * @param {string} lang type language
   * @api stable
   */
  static getJSONTranslations(lang) {
    if (lang === 'en' || lang === 'es') {
      return (lang === 'en') ? en : es;
    }
    return IDEE.language.getTranslation(lang).wfstcontrols;
  }

  /**
   * Obtiene la ayuda del plugin
   *
   * @function
   * @public
   * @api
   */
  getHelp() {
    return {
      title: getValue('textHelp.squemaTitle'),
      content: new Promise((resolve) => {
        const html = IDEE.template.compileSync(myhelp, {
          vars: {
            title: getValue('textHelp.title'),
            urlImages: `${IDEE.config.API_IDEE_URL}plugins/wfstcontrols/images/`,
            translations: {
              paragraph1: getValue('textHelp.paragraph1'),
              screenshot1Alt: getValue('textHelp.screenshot1Alt'),
              screenshot1Caption: getValue('textHelp.screenshot1Caption'),
              screenshot2Alt: getValue('textHelp.screenshot2Alt'),
              screenshot2Caption: getValue('textHelp.screenshot2Caption'),
              screenshot2Description: getValue(
                'textHelp.screenshot2Description',
              ),
            },
          },
        });
        resolve(html);
      }),
    };
  }
}

/**
 * Name to identify this plugin
 * @const
 * @type {string}
 * @public
 * @api stable
 */
WFSTControls.NAME = 'wfstcontrols';
