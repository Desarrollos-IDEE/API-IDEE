/**
 * @module M/control/ContactLinkControl
 */

import ContactLinkImplControl from 'impl/contactlinkcontrol';
import template from 'templates/contactlink';
import { getValue } from './i18n/language';

export default class ContactLinkControl extends M.Control {
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
    if (M.utils.isUndefined(ContactLinkImplControl)) {
      M.exception(getValue('exceptions.impl'));
    }
    // 2. implementation of this control
    const impl = new ContactLinkImplControl();
    super(impl, 'ContactLink');

    /**
     * Link to cnig downloads
     * @private
     * @type {String}
     */
    this.linksDescargascnig = values.descargascnig;

    /**
     * Link to pnoa comparator
     * @private
     * @type {String}
     */
    this.linksPnoa = values.pnoa;

    /**
     * Link to 3d visualizer
     * @private
     * @type {String}
     */
    this.linksVisualizador3d = values.visualizador3d;

    /**
     * Link to cnig
     * @privatecnig
     * @type {String}
     */
    this.linksFototeca = values.fototeca;

    /**
     * Link to twitter
     * @private
     * @type {String}
     */
    this.linksTwitter = values.twitter;

    /**
     * Link to instagram
     * @private
     * @type {String}
     */
    this.linksInstagram = values.instagram;

    /**
     * Link to facebook
     * @private
     * @type {String}
     */
    this.linksFacebook = values.facebook;

    /**
     * Link to pinterest
     * @private
     * @type {String}
     */
    this.linksPinterest = values.pinterest;

    /**
     * Link to youtube
     * @private
     * @type {String}
     */
    this.linksYoutube = values.youtube;

    /**
     * Link to cnig downloads
     * @private
     * @type {String}
     */
    this.linksMail = values.mail;

    /**
     * Template
     * @public
     * @type { HTMLElement }
     */
    this.template = null;

    /**
     *@private
     *@type { Number }
     */
    this.order = values.order >= -1 ? values.order : null;
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
    if (!M.template.compileSync) { // JGL: retrocompatibilidad Mapea4
      M.template.compileSync = (string, options) => {
        let templateCompiled;
        let templateVars = {};
        let parseToHtml;
        if (!M.utils.isUndefined(options)) {
          templateVars = M.utils.extends(templateVars, options.vars);
          parseToHtml = options.parseToHtml;
        }
        const templateFn = Handlebars.compile(string);
        const htmlText = templateFn(templateVars);
        if (parseToHtml !== false) {
          templateCompiled = M.utils.stringToHtml(htmlText);
        } else {
          templateCompiled = htmlText;
        }
        return templateCompiled;
      };
    }

    return new Promise((success, fail) => {
      const html = M.template.compileSync(template, {
        vars: {
          urls: {
            cnig: this.linksDescargascnig,
            pnoa: this.linksPnoa,
            display: this.linksVisualizador3d,
            fototeca: this.linksFototeca,
            twitter: this.linksTwitter,
            instagram: this.linksInstagram,
            facebook: this.linksFacebook,
            pinterest: this.linksPinterest,
            youtube: this.linksYoutube,
            mail: this.linksMail,
          },
          title: getValue('title'),
          links: {
            downloads: getValue('links.downloads'),
            compare: getValue('links.compare'),
            display: getValue('links.3d'),
            photo: getValue('links.photo'),
          },
          accessibility: {
            webLinks: getValue('accessibility.webLinks'),
            socialMedia: getValue('accessibility.socialMedia'),
          },
        },
      });

      this.accessibilityTab(html);

      html.querySelector('#urlPNOAContactLink').addEventListener('click', () => {
        let url = this.linksPnoa;
        if (this.linksPnoa.indexOf('index.html') === -1 && this.linksPnoa.indexOf('/comparador_pnoa') > -1) {
          url = `${this.linksPnoa}?center=${map.getCenter().x},${map.getCenter().y}&zoom=${map.getZoom()}&srs=${map.getProjection().code}`;
        }

        window.open(url);
      });

      html.querySelector('#urlStereoLink').addEventListener('click', () => {
        let url = this.linksVisualizador3d;
        if (this.linksVisualizador3d.indexOf('index.html') === -1 && this.linksVisualizador3d.indexOf('/estereoscopico') > -1) {
          url = `${this.linksVisualizador3d}?center=${map.getCenter().x},${map.getCenter().y}&zoom=${map.getZoom()}&srs=${map.getProjection().code}`;
        }

        window.open(url);
      });

      html.querySelector('#urlFototecaContactLink').addEventListener('click', () => {
        const url = `${this.linksFototeca}fototeca/?center=${map.getCenter().x},${map.getCenter().y}&zoom=${map.getZoom()}&srs=${map.getProjection().code}`;
        window.open(url);
      });
      // Añadir código dependiente del DOM
      success(html);
    });
  }

  /**
   * This function is called on the control activation
   *
   * @public
   * @function
   * @api stable
   */
  activate() {}

  /**
   * This function is called on the control deactivation
   *
   * @public
   * @function
   * @api stable
   */
  deactivate() {}

  /**
   * This function gets activation button
   *
   * @public
   * @function
   * @param {HTML} html of control
   * @api stable
   */
  getActivationButton(html) {
    return html.querySelector('.m-contactlink button');
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
    return control instanceof ContactLinkControl;
  }

  accessibilityTab(html) {
    html.querySelectorAll('[tabindex="0"]').forEach((el) => el.setAttribute('tabindex', this.order));
  }
  // Add your own functions
}
