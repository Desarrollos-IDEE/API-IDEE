/**
 * @module M/control/InfoCatastroControl
 */

import InfoCatastroImplControl from 'impl/infocatastrocontrol';
import template from 'templates/infocatastro';
import { getValue } from './i18n/language';

export default class InfoCatastroControl extends M.Control {
  /**
   * @classdesc
   * Main constructor of the class. Creates a PluginControl
   * control
   *
   * @constructor
   * @extends {M.Control}
   * @api stable
   */
  constructor(parameters) {
    const impl = new InfoCatastroImplControl();
    super(impl, 'InfoCatastro');

    this.facadeMap_ = null;

    /**
     * Main control's html element
     * @private
     * @type {HTMLElement}
     */
    this.element_ = null;

    /**
     * catastroWMS
     * @private
     * @type {string}
     */
    this.catastroWMS = parameters.url;

    /**
     * tooltip
     * @private
     * @type {string}
     */
    this.tooltip = parameters.tooltip;

    /**
     * Title for the popup
     * @const
     * @type {string}
     * @public
     * @api stable
     */
    this.POPUP_TITLE = getValue('informacionCatastral');
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
    this.facadeMap_ = map;
    // eslint-disable-next-line
    console.warn(getValue('infocatastro_obsolete'));
    return new Promise((success, fail) => {
      const html = M.template.compileSync(template, {
        vars: {
          translations: {
            consultar: this.tooltip || getValue('consultar'),
          },
        },
      });
      this.element_ = html;
      const castastroInfo = this.element_.querySelector('#m-infocatastro-btn');
      castastroInfo.addEventListener('click', this.activate.bind(this));
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
  activate() {
    if (this.activated) {
      this.deactivate();
    } else {
      this.facadeMap_.on(M.evt.CLICK, this.buildUrl_, this);
      this.activated = true;
      this.element_.querySelector('#m-infocatastro-btn').classList.add('activated');
      document.addEventListener('keydown', this.checkEscKey.bind(this));
    }
  }

  checkEscKey(evt) {
    if (evt.key === 'Escape') {
      this.deactivate();
      document.removeEventListener('keydown', this.checkEscKey);
    }
  }

  /**
   * This function is called on the control deactivation
   *
   * @public
   * @function
   * @api stable
   */
  deactivate() {
    this.facadeMap_.removePopup();
    this.facadeMap_.un(M.evt.CLICK, this.buildUrl_, this);
    this.activated = false;
    this.element_.querySelector('#m-infocatastro-btn').classList.remove('activated');
  }

  /**
   * This function builds the query URL and shows results
   *
   * @private
   * @function
   * @param {ol.MapBrowserPointerEvent} evt - Browser point event
   */
  buildUrl_(evt) {
    const options = {
      jsonp: true,
    };

    const srs = this.facadeMap_.getProjection().code;
    M.remote.get(this.catastroWMS, {
      SRS: srs,
      Coordenada_X: evt.coord[0],
      Coordenada_Y: evt.coord[1],
    }).then((res) => {
      this.showInfoFromURL_(res, evt.coord);
    }, options);
  }

  /**
   * This function displays information in a popup
   *
   * @private
   * @function
   * @param {XML} response - response from the petition
   * @param {array} coordinate - Coordinate position onClick
   */
  showInfoFromURL_(response, coordinates) {
    if ((response.code === 200) && (response.error === false)) {
      const infos = [];
      const info = response.text;
      const formatedInfo = this.formatInfo_(info);
      infos.push(formatedInfo);

      const tab = {
        icon: 'g-cartografia-pin',
        title: this.POPUP_TITLE,
        content: infos.join(''),
      };

      let popup = this.facadeMap_.getPopup();

      if (M.utils.isNullOrEmpty(popup)) {
        popup = new M.Popup();
        popup.addTab(tab);
        this.facadeMap_.addPopup(popup, coordinates);
      } else if (popup.getCoordinate()[0] === coordinates[0]
        && popup.getCoordinate()[1] === coordinates[1]) {
        let hasExternalContent = false;
        popup.getTabs().forEach((t) => {
          if (t.title !== this.POPUP_TITLE) {
            hasExternalContent = true;
          } else {
            popup.removeTab(t);
          }
        });
        if (hasExternalContent) {
          popup.addTab(tab);
        } else {
          popup = new M.Popup();
          popup.addTab(tab);
          this.facadeMap_.addPopup(popup, coordinates);
        }
      } else {
        popup = new M.Popup();
        popup.addTab(tab);
        this.facadeMap_.addPopup(popup, coordinates);
      }
    } else {
      this.facadeMap_.removePopup();
      M.dialog.error(getValue('errorConexion'));
    }
  }

  /**
   * This function formats the response
   *
   * @param {string} info - Information to formatting
   * @returns {string} information - Formatted information
   * @private
   * @function
   */
  formatInfo_(info) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(info, 'text/xml');
    let ldtNode;
    let valuePopup;
    let codProv;
    let codMun;
    let link = '';

    const rootElement = xmlDoc.getElementsByTagName('consulta_coordenadas')[0];
    const controlNode = rootElement.getElementsByTagName('control')[0];
    const errorCtlNode = controlNode.getElementsByTagName('cuerr')[0].childNodes[0].nodeValue;
    if (errorCtlNode === '1') {
      // const errorNode = rootElement.getElementsByTagName('lerr')[0];
      // const errorDesc = errorNode.getElementsByTagName('err')[0];
      // const errorDescTxt = errorDesc.getElementsByTagName('des')[0].childNodes[0].nodeValue;
      valuePopup = getValue('noInfo');
    } else {
      const coordenadasNode = rootElement.getElementsByTagName('coordenadas')[0];
      const coordNode = coordenadasNode.getElementsByTagName('coord')[0];
      const pcNode = coordNode.getElementsByTagName('pc')[0];
      const pc1Node = pcNode.getElementsByTagName('pc1')[0].childNodes[0].nodeValue;
      const pc2Node = pcNode.getElementsByTagName('pc2')[0].childNodes[0].nodeValue;

      codProv = pc1Node.substring(0, 2);
      codMun = pc1Node.substring(2, 5);

      ldtNode = coordNode.getElementsByTagName('ldt')[0].childNodes[0].nodeValue;
      valuePopup = pc1Node + pc2Node;
      link = `https://www1.sedecatastro.gob.es/CYCBienInmueble/OVCListaBienes.aspx?del==${codProv}&mun=${codMun}&rc1=${pc1Node}&rc2=${pc2Node}`;
    }

    let formatedInfo = `${M.utils.beautifyAttribute(getValue('informacionCatastral'))}
    <div class='divinfo'>
    <table class='mapea-table'>
    <tbody>
    <tr><td class='header' colspan='4'></td></tr>
    <tr><td class='key'><b>${M.utils.beautifyAttribute(getValue('reference'))}</b></td><td class='value'></b>
    <a href='${link}' target='_blank'>${valuePopup}</a></td></tr>
    <tr><td class='key'><b>${M.utils.beautifyAttribute(getValue('description'))}</b></td>
    <td class='value'>${ldtNode}</td></tr>
    </tbody></table></div>`;

    if (valuePopup.toLowerCase().indexOf(getValue('noReference')) > -1) {
      formatedInfo = `${M.utils.beautifyAttribute(getValue('informacionCatastral'))}
      <div class='divinfo'>
      <table class='mapea-table'>
      <tbody>
      <tr><td class='header' colspan='4'></td></tr>
      <tr><td class='key' colspan='4'><b>${valuePopup}</b></td></tr>
      </tbody></table>
      </div>`;
    }

    return formatedInfo;
  }

  /**
   * This function compares controls
   *
   * @public
   * @function
   * @param {M.Control} control to compare
   * @api
   */
  equals(control) {
    return control instanceof InfoCatastroControl;
  }
}
