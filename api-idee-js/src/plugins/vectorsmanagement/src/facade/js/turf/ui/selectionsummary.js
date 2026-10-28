import template from '../../../../templates/turfselections';
import { getValue } from '../../i18n/language';
import { layerTitle } from '../layers/inputresolver';
import SelectionRegistry from '../layers/selectionregistry';
import { translate } from './messages';

/**
 * @classdesc
 * Resumen de las selecciones guardadas para Turf: qué capas tienen
 * selección, cuántos elementos aporta cada una, si se ve en el mapa y si
 * alguno ya no existe. Permite quitarlas una a una o todas.
 */
export default class SelectionSummary {
  /**
   * @constructor
   * @param {Object} options Opciones.
   * @param {SelectionRegistry} options.selections Selecciones guardadas.
   * @param {function(SelectionSnapshot): Boolean} options.isVisible Indica si
   * la selección se está mostrando en el mapa.
   * @param {Number} options.order Orden de tabulación.
   */
  constructor({ selections, isVisible, order }) {
    this.selections_ = selections;
    this.isVisible_ = isVisible;
    this.order_ = order;
  }

  /**
   * Muestra el resumen en el contenedor.
   *
   * @param {HTMLElement} container Contenedor.
   */
  render(container) {
    const order = this.order_;
    const items = this.selections_.list().map((snapshot) => {
      const { features, missing } = SelectionRegistry.check(snapshot);
      const title = layerTitle(snapshot.layer);
      const parts = [
        title,
        translate('turf.selections.count', { n: features.length }),
        getValue(this.isVisible_(snapshot) ? 'turf.selections.visible' : 'turf.selections.hidden'),
      ];
      if (missing > 0) parts.push(translate('turf.selections.missing', { n: missing }));
      return {
        id: snapshot.layer.idLayer,
        text: parts.join(' · '),
        stale: missing > 0,
        removeText: getValue('turf.selections.remove'),
        removeLabel: translate('turf.selections.removeLabel', { layer: title }),
        order,
      };
    });
    const html = IDEE.template.compileSync(template, {
      vars: {
        items,
        order,
        translations: {
          title: getValue('turf.selections.title'),
          clear: getValue('turf.selections.clear'),
          empty: getValue('turf.selections.empty'),
          note: getValue('turf.selections.note'),
        },
      },
    });
    container.replaceChildren(html);
    html.addEventListener('click', (evt) => {
      const button = evt.target.closest('button[data-action]');
      if (!button) return;
      if (button.dataset.action === 'remove-selection') {
        this.selections_.remove(button.dataset.layer);
      } else if (button.dataset.action === 'clear-selections') {
        this.selections_.clear();
      }
    });
  }
}
