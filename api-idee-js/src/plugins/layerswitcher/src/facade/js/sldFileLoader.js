/**
 * @module IDEE/plugin/layerswitcher/sldFileLoader
 */
import { getValue } from './i18n/language';
import { parseSLD, SLDError } from './sld';

/**
 * Tamaño máximo, en MB, de un fichero SLD.
 * @const
 * @type {Number}
 */
export const SLD_MAX_SIZE_MB = 5;

/**
 * Sustituye las variables [nombre] de un mensaje.
 * @param {String} text Mensaje.
 * @param {Object<String, *>} vars Valores de las variables.
 * @returns {String} Mensaje con los valores.
 */
export const fillMessage = (text, vars) => Object.keys(vars)
  .reduce((message, name) => message.split(`[${name}]`).join(vars[name]), text);

const describeIgnored = (ignored) => ignored
  .map(({ key, name }) => fillMessage(getValue(`sld_items.${key}`), { name }))
  .join('; ');

/**
 * Abre el selector de ficheros del navegador para elegir un SLD.
 * @returns {Promise<File|null>} Fichero elegido o null si se cancela.
 */
const pickSLDFile = () => new Promise((resolve) => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.sld,.xml,application/xml,text/xml';
  input.className = 'm-layerswitcher-sld-input';
  input.hidden = true;
  input.addEventListener('cancel', () => {
    input.remove();
    resolve(null);
  });
  input.addEventListener('change', () => {
    const [file] = input.files;
    input.remove();
    resolve(file || null);
  });
  document.body.appendChild(input);
  input.click();
});

const NOTIFIER = {
  error: (message, order) => IDEE.dialog.error(message, getValue('load_sld'), order),
  success: (message, order) => IDEE.toast.success(message, order, 6000),
  warning: (message, order) => IDEE.toast.warning(message, order, 12000),
};

/**
 * Carga un fichero SLD elegido por el usuario: lo valida, lo lee, lo convierte en estilos
 * de IDEE y los registra en la capa sin aplicarlos.
 */
export default class SLDFileLoader {
  /**
   * @param {Object} dependencies Dependencias.
   * @param {Object} dependencies.layerStyles Registro de estilos de las capas
   * (supportsClientStyles, addEntries y getUnsupported).
   * @param {function(String, Object): Object} [dependencies.parse] Conversor de SLD.
   * @param {function(): Promise<File|null>} [dependencies.pickFile] Selección del fichero.
   * @param {Object} [dependencies.notify] Avisos al usuario (error, success y warning).
   */
  constructor({
    layerStyles, parse = parseSLD, pickFile = pickSLDFile, notify = NOTIFIER,
  }) {
    this.layerStyles_ = layerStyles;
    this.parse_ = parse;
    this.pickFile_ = pickFile;
    this.notify_ = notify;
    this.maxSizeMB = SLD_MAX_SIZE_MB;
  }

  /**
   * Indica si la capa admite estilos cargados desde un SLD.
   * @param {IDEE.Layer} layer Capa.
   * @returns {Boolean} Verdadero si los admite.
   */
  canLoad(layer) {
    return this.layerStyles_.supportsClientStyles(layer);
  }

  /**
   * Pide un fichero SLD y registra sus estilos en la capa.
   * @param {IDEE.Layer} layer Capa.
   * @param {Number} order Orden de tabulación de los avisos.
   * @returns {Promise<{entries: Array<Object>, selected: Object}|null>} Estilos añadidos y
   * el que se propone seleccionar, o null si se cancela o no se puede cargar.
   */
  async load(layer, order) {
    const vars = { file: '', layer: layer.legend || layer.name, size: this.maxSizeMB };
    if (!this.canLoad(layer)) {
      this.error_('exception.sld_layer', vars, order);
      return null;
    }
    const file = await this.pickFile_();
    if (!file) return null;
    const fileVars = { ...vars, file: file.name };
    if (file.size > this.maxSizeMB * 1024 * 1024) {
      this.error_('exception.sld_too_large', fileVars, order);
      return null;
    }
    if (file.size === 0) {
      this.error_('exception.sld_read', fileVars, order);
      return null;
    }
    let text;
    try {
      text = await file.text();
    } catch (error) {
      this.error_('exception.sld_read', fileVars, order);
      return null;
    }
    return this.register_(layer, file, text, order);
  }

  error_(key, vars, order) {
    this.notify_.error(fillMessage(getValue(key), vars), order);
  }

  register_(layer, file, text, order) {
    const vars = { file: file.name, layer: layer.legend || layer.name, reason: '' };
    let result;
    try {
      result = this.parse_(text, {
        layerNames: [layer.name, layer.legend],
        fileName: file.name.replace(/\.[^.]+$/, ''),
      });
    } catch (error) {
      if (error instanceof SLDError) {
        this.error_(`exception.${error.code}`, vars, order);
      } else {
        this.error_('exception.sld_apply', { ...vars, reason: error?.message || String(error) }, order);
      }
      return null;
    }

    let entries;
    try {
      entries = this.layerStyles_.addEntries(layer, result.styles.map(({ label, style }) => ({
        label: fillMessage(getValue('sld_entry'), { style: label }),
        style,
      })));
    } catch (error) {
      this.error_('exception.sld_apply', { ...vars, reason: error?.message || String(error) }, order);
      return null;
    }
    if (!entries || entries.length === 0) {
      this.error_('exception.sld_layer', vars, order);
      return null;
    }
    const selected = entries[Math.max(0, result.styles.findIndex((item) => item.isDefault))];

    const notices = [];
    if (result.fallbackLayer) {
      notices.push(fillMessage(getValue('sld_named_layer'), { ...vars, name: result.fallbackLayer }));
    }
    if (result.ignored.length > 0) {
      notices.push(fillMessage(getValue('sld_ignored'), { items: describeIgnored(result.ignored) }));
    }
    const unsupported = this.layerStyles_.getUnsupported(layer, selected);
    if (unsupported.length > 0) {
      notices.push(getValue('style_unsupported').replace('[props]', unsupported.join(', ')));
    }
    this.notify_.success(fillMessage(getValue('sld_added'), {
      file: file.name, layer: vars.layer, style: selected.label,
    }), order);
    if (notices.length > 0) {
      // eslint-disable-next-line no-console
      console.warn(notices.join('\n'));
      this.notify_.warning(notices.join(' '), order);
    }
    return { entries, selected };
  }
}
