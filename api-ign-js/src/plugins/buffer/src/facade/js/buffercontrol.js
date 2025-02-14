import buffer from '@turf/buffer';
import template from 'templates/buffer';
import BufferControlImpl from 'impl/buffercontrolImpl';
import Picker from './vanilla-picker';
import { getValue } from './i18n/language';

export default class BufferControl extends M.Control {
  /**
   * @classdesc
   * Main constructor of the class. Creates a influenceareaControl
   * control
   *
   * @constructor
   * @extends {M.Control}
   * @api stable
   */
  constructor(editLayer, featuresEdit) {
    const impl = new BufferControlImpl();
    super(impl, 'buffer');
    this.impl = impl;
    this.editLayer = editLayer;

    this.featuresEdit = featuresEdit;

    // 1. checks if the implementation can create influenceareaControl
    if (M.utils.isUndefined(BufferControlImpl)) {
      M.exception(getValue('exception_control'));
    }
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
    console.warn(getValue('exception.buffer_obsolete'));
    return new Promise((success, fail) => {
      const html = M.template.compileSync(template, {
        vars: {
          translations: {
            tooltip_point: getValue('tooltip_point'),
            tooltip_line: getValue('tooltip_line'),
            tooltip_polygon: getValue('tooltip_polygon'),
            tooltip_remove: getValue('tooltip_remove'),
          },
        },
      });
      this.template_ = html;
      this.template_.querySelector('#point').addEventListener('click', (e) => this.manageDraw_(e));
      this.template_.querySelector('#polygon').addEventListener('click', (e) => this.manageDraw_(e));
      this.template_.querySelector('#lineString').addEventListener('click', (e) => this.manageDraw_(e));
      this.template_.querySelector('#remove').addEventListener('click', (e) => this.removeFeatures(e));
      success(html);
    });
  }

  /**
   * Add or remove interaction to draw in map
   * @public
   * @function
   * @api stable
   * @export
   */
  manageDraw_(evt) {
    const isTheSame = this.manageActivatedDeactivated(evt.target);
    const value = evt.target.getAttribute('data-geometry-type');
    this.manageInteraction_(false, null, null);
    if (!isTheSame) {
      evt.target.classList.add('activated');
      const draw = this.impl.createNewDrawInteraction(this.featuresEdit, (value));
      const originDraw = this.impl.createNewDrawInteraction(this.featuresEdit, (value));
      let colorFeature = '#71a7d3';
      let originFeature;
      originDraw.on('drawend', (event) => {
        originFeature = event.feature;
      });
      draw.on('drawend', (e) => {
        M.dialog.info(
          `<div id="chooseBuffer">
            <div id="colorPick"></div>
            <input type="number" id="metreBuffer" value="50" style="width: 10rem;">
            <div style="padding-top: 0.5rem;text-align: center;">
              <input type="radio" name="unit" id="metro" value="m" checked="checked"/>
              <label for="metro">${getValue('unit_m')}</label>
              <input type="radio" name="unit" id="kilometro" value="km"/>
              <label for="kilometro">${getValue('unit_km')}</label>
            </div>
          </div>`,
          getValue('title_popup'),
        );
        const dialog = document.querySelector('.m-dialog > div.m-modal > div.m-content');
        dialog.style.minWidth = 'auto';
        const title = document.querySelector('.m-modal .m-title');
        title.style.backgroundColor = '#71a7d3';
        const colorPickBtn = document.querySelector('div#colorPick');
        const colorPicker = new Picker({
          parent: colorPickBtn,
          popup: 'bottom',
          alpha: false,
          color: '#71a7d3',
          editor: false,
          onChange: (color) => {
            colorPickBtn.style.background = color.rgbaString;
            colorFeature = color.rgbString;
          },
        });
        colorPickBtn.addEventListener('click', () => {
          colorPicker.show();
        });
        const btn = document.querySelector('.m-button button');
        const inputBuffer = document.querySelector('div.m-modal input#metreBuffer');
        let distance = 50;
        inputBuffer.addEventListener('keyup', () => {
          distance = inputBuffer.value;
          btn.style.pointerEvents = document.querySelector('div.m-modal input#metreBuffer:invalid') === null ? 'initial' : 'none';
        });
        inputBuffer.addEventListener('keydown', () => {
          btn.style.pointerEvents = document.querySelector('div.m-modal input#metreBuffer:invalid') === null ? 'initial' : 'none';
        });
        let unit = 1;
        const unitBufferM = document.querySelector('div.m-modal input#metro');
        const unitBufferKm = document.querySelector('div.m-modal input#kilometro');
        unitBufferM.addEventListener('change', () => { unit = 1; });
        unitBufferKm.addEventListener('change', () => { unit = 1000; });
        btn.style.backgroundColor = '#71a7d3';
        btn.addEventListener('click', (ev) => {
          this.impl.setStyle(colorFeature, originFeature);
          this.impl.setStyle(colorFeature, e.feature);
          this.manageInteraction_(false, null, null);
          this.addBuffer_(e.feature, (distance * unit), evt.target);
        });
      });
      this.facadeMap_.getMapImpl().addInteraction(draw);
      this.facadeMap_.getMapImpl().addInteraction(originDraw);
    } else {
      evt.target.classList.remove('activated');
    }
  }

  manageInteraction_(add, featuresEdit, value) {
    const evt = window.event;
    if (!add) {
      const arrayInteractions = [].concat(this.facadeMap_.getMapImpl()
        .getInteractions().getArray());
      arrayInteractions.forEach((interaction) => {
        if (this.impl.isInteractionInstanceOfDrawOrModify(interaction)) {
          this.facadeMap_.getMapImpl().removeInteraction(interaction);
        }
      });
    } else {
      const draw = this.impl.createNewDrawInteraction(this.featuresEdit, (value));
      draw.on('drawend', (e) => {
        const arrayInteractions = [].concat(this.facadeMap_.getMapImpl()
          .getInteractions().getArray());
        arrayInteractions.forEach((interaction) => {
          if (this.impl.isInteractionInstanceOfDrawOrModify(interaction)) {
            this.facadeMap_.getMapImpl().removeInteraction(interaction);
          }
        });
        const inputBuffer = document.querySelector('input#metreBuffer');
        if (inputBuffer) {
          const distance = inputBuffer.value;
          this.addBuffer_(e.feature, distance, evt.target);
        }
      });
      this.facadeMap_.getMapImpl().addInteraction(draw);
    }
  }

  /**
   * Get feature and create buffer
   * @public
   * @function
   * @api stable
   * @export
   */
  addBuffer_(feature, distance, target) {
    const format = new ol.format.GeoJSON();
    feature.getGeometry().transform(this.facadeMap_.getProjection().code, 'EPSG:4326');
    const turfGeom = format.writeFeatureObject(feature);
    const buffered = buffer(turfGeom, parseInt(distance, 10), { units: 'meters' });
    feature.setGeometry(format.readFeature(buffered).getGeometry().transform('EPSG:4326', this.facadeMap_.getProjection().code));
    this.manageActivatedDeactivated(target);
  }

  /**
   * Manage which features has to activated or deactivated
   * @public
   * @function
   * @api stable
   * @export
   */
  manageActivatedDeactivated(target) {
    let flag = false;
    const elements = document.querySelectorAll('div.m-buffer button.activated');
    if (elements && elements != null && elements.length && elements.length > 0) {
      for (let i = 0; i < elements.length; i += 1) {
        const elementAux = elements[0];
        elementAux.classList.remove('activated');
        flag = true;
      }
    }
    return flag;
  }

  /**
   * Remove all features and deactivated all tools
   * @public
   * @function
   * @api stable
   * @export
   */
  removeFeatures() {
    this.editLayer.getSource().clear();
    const elements = document.querySelectorAll('div.m-buffer button.activated');
    if (elements && elements != null && elements.length) {
      for (let i = 0; i < elements.length; i += 1) {
        const elementAux = elements[0];
        elementAux.classList.remove('activated');
      }
    }
    this.manageInteraction_(false, null, null);
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
    return control instanceof BufferControl;
  }
}
