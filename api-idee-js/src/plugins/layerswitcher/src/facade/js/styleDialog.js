/**
 * @module IDEE/plugin/layerswitcher/styleDialog
 */
import configTemplate from '../../templates/config';
import { getValue } from './i18n/language';
import { focusModal } from './utils';
import { fillMessage } from './sldFileLoader';

const SELECT = '#m-layerswitcher-style-select';
const NOTICE = '.m-layerswitcher-style-notice';
const CHANGE_BUTTON = '.m-layerswitcher-style-change-button';
const SLD_BUTTON = '.m-layerswitcher-style-sld-button';

/**
 * Diálogo de estilos de una capa: selector de estilos, aviso de propiedades no admitidas,
 * botón «Cambiar» y, si la capa lo admite, carga de estilos desde un fichero SLD.
 */
export default class StyleDialog {
  /**
   * @param {Object} dependencies Dependencias.
   * @param {Object} dependencies.layerStyles Registro de estilos de las capas
   * (getEntries, getActiveId, getUnsupported y select).
   * @param {Object} dependencies.loader Cargador de SLD (load y maxSizeMB).
   * @param {Object} [dependencies.dialog] Diálogos de IDEE (info y getCloseButton).
   * @param {String} [dependencies.template] Plantilla del diálogo.
   */
  constructor({
    layerStyles, loader, dialog = IDEE.dialog, template = configTemplate,
  }) {
    this.layerStyles_ = layerStyles;
    this.loader_ = loader;
    this.dialog_ = dialog;
    this.template_ = template;
  }

  /**
   * Abre el diálogo de estilos de la capa.
   * @param {IDEE.Layer} layer Capa.
   * @param {Object} options Opciones.
   * @param {Number} options.order Orden de tabulación.
   * @param {Boolean} options.canUpload Muestra la carga de estilos SLD.
   * @returns {HTMLElement} Diálogo.
   */
  open(layer, { order, canUpload }) {
    const element = this.dialog_.info(
      this.render_(layer, canUpload),
      getValue('configure_layer'),
      order,
    );
    const select = element.querySelector(SELECT);
    select.addEventListener('change', () => this.updateNotice_(element));
    this.updateNotice_(element);
    element.querySelector(CHANGE_BUTTON).addEventListener('click', () => {
      if (select.value === '') return;
      this.layerStyles_.select(layer, select.value);
      this.dialog_.getCloseButton(element)?.click();
    });
    element.querySelector(SLD_BUTTON)?.addEventListener('click', () => {
      this.loader_.load(layer, order).then((result) => {
        if (result) this.refreshOptions_(element, layer, result.selected.id);
      });
    });
    const closeButton = this.dialog_.getCloseButton(element);
    if (closeButton) closeButton.innerHTML = getValue('close');
    focusModal('.m-title span');
    setTimeout(() => {
      element.querySelector('.m-layerswitcher-style-container')?.focus();
    }, 500);
    return element;
  }

  getOptions_(layer, selectedId = this.layerStyles_.getActiveId(layer)) {
    return this.layerStyles_.getEntries(layer).map((entry) => ({
      value: entry.id,
      label: entry.label,
      selected: entry.id === selectedId,
      unsupported: this.layerStyles_.getUnsupported(layer, entry).join(', '),
    }));
  }

  render_(layer, canUpload, selectedId) {
    const options = this.getOptions_(layer, selectedId);
    return IDEE.template.compileSync(this.template_, {
      jsonp: true,
      parseToHtml: false,
      vars: {
        options,
        hasActive: options.some((option) => option.selected),
        canUpload,
        translations: {
          select_style: getValue('select_style'),
          change: getValue('change'),
          load_sld: getValue('load_sld'),
          sld_hint: fillMessage(getValue('sld_hint'), { size: this.loader_.maxSizeMB }),
        },
      },
    });
  }

  refreshOptions_(element, layer, selectedId) {
    const holder = document.createElement('div');
    holder.innerHTML = this.render_(layer, false, selectedId);
    const select = element.querySelector(SELECT);
    select.innerHTML = holder.querySelector(SELECT).innerHTML;
    select.value = selectedId;
    this.updateNotice_(element);
  }

  updateNotice_(element) {
    const select = element.querySelector(SELECT);
    const notice = element.querySelector(NOTICE);
    if (!select || !notice) return;
    const properties = select.selectedOptions[0]?.dataset.unsupported || '';
    notice.textContent = properties === ''
      ? '' : getValue('style_unsupported').replace('[props]', properties);
    notice.hidden = properties === '';
  }
}
