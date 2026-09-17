import template from 'templates/downloads';
import { getValue } from './i18n/language';

/**
 * Control de descargas de resultados de la calculadora ráster.
 */
export default class DownloadsControl {
  /**
   * @param {IDEE.control.RasterManagementControl} parentControl Control principal.
   */
  constructor(parentControl) {
    /**
     * @private
     * @type {IDEE.control.RasterManagementControl}
     */
    this.parentControl_ = parentControl;

    /**
     * @private
     * @type {HTMLElement|null}
     */
    this.root_ = null;

    /**
     * Resultados disponibles para descarga.
     * @private
     * @type {Array<{ url: string, name: string }>}
     */
    this.items_ = [];
  }

  /**
   * Inicializa la interfaz dentro del contenedor de descargas.
   *
   * @param {HTMLElement} html Plantilla principal del control.
   */
  init(html) {
    const container = html.querySelector('#m-rastermanagement-downloads-container');
    const content = IDEE.template.compileSync(template, {
      vars: {
        downloads: getValue('downloads'),
        downloadsEmpty: getValue('downloadsEmpty'),
      },
    });
    container.innerHTML = '';
    container.appendChild(content);
    this.root_ = content;
    this.render_();
  }

  /**
   * Añade un resultado de la calculadora a la lista de descargas.
   *
   * @param {string} resultsUrl URL del GeoTIFF de resultado.
   * @param {string} outputName Nombre del fichero / capa.
   */
  addDownload(resultsUrl, outputName) {
    if (IDEE.utils.isNullOrEmpty(resultsUrl)) {
      return;
    }

    let name = outputName;
    if (IDEE.utils.isNullOrEmpty(name)) {
      name = 'calc';
    }

    this.items_.push({
      url: resultsUrl,
      name,
    });
    this.render_();
  }

  /**
   * Actualiza la vista según haya o no resultados.
   *
   * @private
   * @function
   */
  render_() {
    if (!this.root_) {
      return;
    }

    const emptyEl = this.root_.querySelector('#m-rastermanagement-downloads-empty');
    const listEl = this.root_.querySelector('#m-rastermanagement-downloads-list');
    listEl.innerHTML = '';

    if (this.items_.length === 0) {
      emptyEl.classList.remove('hidden');
      listEl.classList.add('hidden');
      return;
    }

    emptyEl.classList.add('hidden');
    listEl.classList.remove('hidden');

    this.items_.forEach((item) => {
      const li = document.createElement('li');
      li.className = 'm-rastermanagement-downloads-item';

      const link = document.createElement('a');
      link.className = 'm-rastermanagement-downloads-link g-cartografia-raster-download';
      link.href = item.url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.download = `${item.name}.tif`;
      link.setAttribute('tabindex', '0');
      link.setAttribute('aria-label', `${getValue('downloadResult')}: ${item.name}`);
      link.textContent = item.name;

      li.appendChild(link);
      listEl.appendChild(li);
    });
  }

  /**
   * Limpia recursos.
   */
  destroy() {
    this.items_ = [];
    this.root_ = null;
  }
}
