/**
 * @module M/control/Help
 */
import HelpImplControl from '../../impl/ol/js/helpcontrol';
import template from '../../templates/help';
import { getValue } from './i18n/language';

export default class HelpControl extends M.Control {
  /**
   * @classdesc
   * Main constructor of the class. Creates a PluginControl
   * control
   *
   * @constructor
   * @extends {M.Control}
   * @api stable
   */
  constructor(map, managementControl) {
    // 1. checks if the implementation can create PluginControl
    if (M.utils.isUndefined(HelpImplControl)) {
      M.exception(getValue('exception'));
    }

    // 2. implementation of this control
    const impl = new HelpImplControl();
    super(impl, 'Help');

    this.map_ = map;

    /**
     * Template
     * @public
     * @type { HTMLElement }
     */
    this.template = null;

    this.closeEventActive_ = false;

    this.managementControl_ = managementControl;
  }

  /**
   * This functions active control
   *
   * @public
   * @function
   * @param {Node} html
   * @api
   */
  active(html) {
    this.template = M.template.compileSync(template, {
      vars: {
        translations: {
          addlayer_title: getValue('help_template').addlayer_title,
          addlayer_content: getValue('help_template').addlayer_content,
          selection_title: getValue('help_template').selection_title,
          selection_content: getValue('help_template').selection_content,
          creation_title: getValue('help_template').creation_title,
          creation_content: getValue('help_template').creation_content,
          edition_title: getValue('help_template').edition_title,
          edition_content: getValue('help_template').edition_content,
          edition_content_1: getValue('help_template').edition_content_1,
          edition_content_1_1: getValue('help_template').edition_content_1_1,
          edition_content_2: getValue('help_template').edition_content_2,
          edition_content_2_1: getValue('help_template').edition_content_2_1,
          edition_content_3: getValue('help_template').edition_content_3,
          edition_content_3_1: getValue('help_template').edition_content_3_1,
          edition_content_4: getValue('help_template').edition_content_4,
          edition_content_4_1: getValue('help_template').edition_content_4_1,
          edition_content_5: getValue('help_template').edition_content_5,
          edition_content_5_1: getValue('help_template').edition_content_5_1,
          edition_content_6: getValue('help_template').edition_content_6,
          edition_content_6_1: getValue('help_template').edition_content_6_1,
          edition_content_7: getValue('help_template').edition_content_7,
          edition_content_7_1: getValue('help_template').edition_content_7_1,
          style_title: getValue('help_template').style_title,
          style_content: getValue('help_template').style_content,
          analysis_title: getValue('help_template').analysis_title,
          analysis_content: getValue('help_template').analysis_content,
          analysis_content_1: getValue('help_template').analysis_content_1,
          analysis_content_1_1: getValue('help_template').analysis_content_1_1,
          analysis_content_2: getValue('help_template').analysis_content_2,
          analysis_content_2_1: getValue('help_template').analysis_content_2_1,
          download_title: getValue('help_template').download_title,
          download_content: getValue('help_template').download_content,
          creation_content_1: getValue('help_template').creation_content_1,
          creation_content_1_1: getValue('help_template').creation_content_1_1,
          creation_content_2: getValue('help_template').creation_content_2,
          creation_content_2_1: getValue('help_template').creation_content_2_1,
          creation_content_3: getValue('help_template').creation_content_3,
          creation_content_3_1: getValue('help_template').creation_content_3_1,
          creation_content_4: getValue('help_template').creation_content_4,
          creation_content_4_1: getValue('help_template').creation_content_4_1,
          creation_content_5: getValue('help_template').creation_content_5,
          creation_content_5_1: getValue('help_template').creation_content_5_1,
          creation_content_6: getValue('help_template').creation_content_6,
          creation_content_6_1: getValue('help_template').creation_content_6_1,
          analysis_content_3: getValue('help_template').analysis_content_3,
          analysis_content_3_1: getValue('help_template').analysis_content_3_1,
          analysis_content_4: getValue('help_template').analysis_content_4,
          analysis_content_4_1: getValue('help_template').analysis_content_4_1,
        },
      },
    });
    if (!this.closeEventActive_) {
      document.addEventListener('keydown', this.closeEvent.bind(this));
      this.closeEventActive_ = true;
    }
    M.dialog.info(M.utils.htmlToString(this.template), getValue('help_template').title);
    document.querySelector('.m-dialog.info .m-content').style.overflowX = 'auto';
    document.querySelector('.m-dialog.info .m-content').style.maxHeight = '70vh';
    document.querySelector('.m-button button').addEventListener('click', this.deactivate.bind(this));
    this.managementControl_.accessibilityTab(this.template);
  }

  /**
   * This function destroys this control
   *
   * @public
   * @function
   * @api stable
   */
  destroy() {}

  /**
   * This function is called on the control activation
   *
   * @public
   * @function
   * @api stable
   */
  activate() {
    super.activate();
  }

  /**
   * This function is called on the control deactivation
   *
   * @public
   * @function
   * @api stable
   */
  deactivate() {
    this.template.remove();
    const elem = document.querySelector('#m-vectorsmanagement-help');
    if (elem) {
      elem.classList.remove('activated');
    }
  }

  /**
   * Keydown event for close modal
   *
   * @public
   * @function
   * @api stable
   */
  closeEvent(evt) {
    if (evt.key === 'Escape') {
      const elem = document.querySelector('.m-control.m-container.m-modal');
      if (elem !== null) {
        this.deactivate();
      }
    }
  }

  /**
   * This function compares controls
   *
   * @public
   * @function
   * @param {M.Control} control to compare
   * @api stable
   */
  equals(control) {
    // eslint-disable-next-line no-undef
    return control instanceof HelpControl;
  }
}
