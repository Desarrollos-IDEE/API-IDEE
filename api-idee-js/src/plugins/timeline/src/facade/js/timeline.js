/**
 * @module M/plugin/Timeline
 */
import 'assets/css/timeline';
import TimelineControl from './timelinecontrol';
import api from '../../api';
import { getValue } from './i18n/language';
import myhelp from '../../templates/myhelp';

import es from './i18n/es';
import en from './i18n/en';

const typesTimeline = ['absoluteSimple', 'absolute', 'relative'];

export default class Timeline extends M.Plugin {
  /**
   * @classdesc
   * Main facade plugin object. This class creates a plugin
   * object which has an implementation Object
   *
   * @constructor
   * @extends {M.Plugin}
   * @param {Object} impl implementation object
   * @api stable
   */
  constructor(options = {}) {
    super();

    /**
     * Name plugin
     * @private
     * @type {String}
     */
    this.name_ = 'timeline';

    /**
     * Facade of the map
     * @private
     * @type {M.Map}
     */
    this.map_ = null;

    /**
     * Array of controls
     * @private
     * @type {Array<M.Control>}
     */
    this.controls_ = [];

    /**
     * Class name of the html view Plugin
     * @public
     * @type {string}
     */
    this.className = 'm-plugin-timeline';

    /**
     * Position of the Plugin
     * @public
     * Posible values: TR | TL | BL | BR
     * @type {String}
     */
    const positions = ['TR', 'TL', 'BL', 'BR'];
    this.position = positions.includes(options.position) ? options.position : 'TR';

    /**
     * Intervals
     * @public
     * Value: Array with each interval attributes [name, tag, service]
     * @type {String}
     */
    if (options !== undefined) {
      if (M.utils.isString(options.intervals)) {
        this.intervals = JSON.parse(options.intervals.replace(/!!/g, '[').replace(/¡¡/g, ']'));
      } else if (M.utils.isArray(options.intervals)) {
        this.intervals = options.intervals;
      } else {
        // M.dialog.error(getValue('intervals_error'));
        this.intervals = [];
      }
    }

    /**
     * Animation of the timeline
     * @public
     * Value: true / false
     * @type {boolean}
     */
    this.animation = options.animation;
    if (this.animation === undefined) this.animation = true;

    /**
     * Speed of animation
     * @public
     * Value: 1 - 100
     * @type {number}
     */
    this.speed = parseFloat(options.speed) || 1;

    /**
     * Metadata from api.json
     * @private
     * @type {Object}
     */
    this.metadata_ = api.metadata;

    /**
     *@private
     *@type { string }
     */
    this.tooltip_ = options.tooltip || getValue('tooltip');

    /**
     *@private
     *@type { Number }
     */
    this.speedDate = (options.speedDate) ? options.speedDate : 2;

    /**
     *@private
     *@type { String }
     */
    this.paramsDate = (options.paramsDate) ? options.paramsDate : 'yr';

    /**
     *@private
     *@type { Number }
     */
    this.stepValue = (options.stepValue) ? options.stepValue : 1;

    /**
     *@private
     *@type { String }
     */
    this.sizeWidthDinamic = (options.sizeWidthDinamic) ? options.sizeWidthDinamic : '';

    /**
     *@private
     *@type { String }
     */
    this.formatMove = (options.formatMove === 'discrete') ? 'discrete' : 'continuous';

    /**
     *@private
     *@type { String }
     */
    this.formatValue = (options.formatValue) ? options.formatValue : 'linear';

    /**
     *@private
     *@type { String }
     */
    this.timelineType = options.timelineType || false;
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
    return M.language.getTranslation(lang).timeline;
  }

  /**
   * This function adds this plugin into the map
   *
   * @public
   * @function
   * @param {M.Map} map the map to add the plugin
   * @api stable
   */
  addTo(map) {
    if (!this.timelineType || !typesTimeline.includes(this.timelineType)) {
      throw new Error('Add correct typesTimeline, (absoluteSimple', 'absolute', 'relative)');
    }

    if (this.timelineType === 'absolute' || this.timelineType === 'relative') {
      this.intervals = this.intervals.filter(({ layer }) => {
        if (typeof layer === 'string') {
          return !layer.includes('GenericRaster') || !layer.includes('GenericVector');
        }

        return layer.type !== 'GenericRaster' || layer.type !== 'GenericVector';
      });
    } else {
      this.intervals = this.intervals.filter((layer) => {
        if (typeof layer === 'string') {
          return !layer.includes('GenericRaster') || !layer.includes('GenericVector');
        }

        return layer.type !== 'GenericRaster' || layer.type !== 'GenericVector';
      });
    }

    this.control_ = new TimelineControl({
      intervals: this.intervals,
      animation: this.animation,
      speed: this.speed,
      speedDate: this.speedDate,
      paramsDate: this.paramsDate,
      stepValue: this.stepValue,
      sizeWidthDinamic: this.sizeWidthDinamic,
      formatMove: this.formatMove,
      formatValue: this.formatValue,
      timelineType: this.timelineType,
    });
    this.controls_.push(this.control_);
    this.map_ = map;
    this.panel_ = new M.ui.Panel('panelTimeline', {
      collapsible: true,
      position: M.ui.position[this.position],
      className: this.className,
      collapsedButtonClass: 'timeline-gestion-reloj2',
      tooltip: this.tooltip_,
    });
    this.panel_.addControls(this.controls_);
    map.addPanels(this.panel_);
  }

  /**
   * This function destroys this plugin
   *
   * @public
   * @function
   * @api stable
   */
  destroy() {
    if (['absolute', 'relative'].includes(this.timelineType)) {
      this.control_.removeLayers();
    } else {
      this.control_.removeTimelineLayers();
    }

    this.map_.removeControls([this.control_]);
    [this.control_, this.panel_, this.map_, this.layers, this.radius] = [
      null, null, null, null, null,
    ];
  }

  /**
   * This function gets name plugin
   * @getter
   * @public
   * @returns {string}
   * @api stable
   */
  get name() {
    return this.name_;
  }

  /**
   * This function gets metadata plugin
   *
   * @public
   * @getter
   * @api stable
   * @return {Object}
   */
  getMetadata() {
    return this.metadata_;
  }

  /**
   * Get the API REST Parameters of the plugin
   *
   * @function
   * @public
   * @api
   */
  getAPIRest() {
    const intervals = JSON.stringify(this.intervals).replace(/\[/g, '!!').replace(/\]/g, '¡¡');
    return `${this.name}=${this.position}*!${intervals}*!${this.animation}*!${this.speed}*!${this.timelineType}`;
  }

  /**
   * Activate plugin
   *
   * @function
   * @public
   * @api
   */
  activate() {
    this.control_.activate();
  }

  /**
   * Desactivate plugin
   *
   * @function
   * @public
   * @api
   */
  deactivate() {
    this.control_.deactivate();
  }

  /**
   * This
   function compare
   if pluging recieved by param is instance of M.plugin.Timeline
   *
   * @public
   * @function
   * @param {M.plugin} plugin to compare
   * @api stable
   */
  equals(plugin) {
    return plugin instanceof Timeline;
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
      title: this.name,
      content: new Promise((success) => {
        const html = M.template.compileSync(myhelp, {
          vars: {
            urlImages: `${M.config.API_IDEE_URL}plugins/timeline/images/`,
            translations: {
              help1: getValue('textHelp.help1'),
              help2: getValue('textHelp.help2'),
              help3: getValue('textHelp.help3'),
              help4: getValue('textHelp.help4'),
              help5: getValue('textHelp.help5'),
            },
          },
        });
        success(html);
      }),
    };
  }
}
