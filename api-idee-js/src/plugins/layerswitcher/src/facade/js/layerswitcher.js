/* eslint-disable indent */
/**
 * @module IDEE/plugin/Layerswitcher
 */
import '../assets/css/layerswitcher';
import '../assets/css/fonts';
import LayerswitcherControl from './layerswitchercontrol';
import api from '../../api';
import { getValue } from './i18n/language';
import myhelp from '../../templates/myhelp';

import es from './i18n/es';
import en from './i18n/en';

export default class Layerswitcher extends IDEE.Plugin {
  constructor(options = {}) {
    super();
    // Fachada del mapa
    this.map_ = null;

    // Controles del plugin
    this.controls_ = [];

    // Nombre del plugin
    this.name_ = 'layerswitcher';

    // Parámetros del plugin
    this.options = options;

    // Posición del plugin
    this.position_ = options.position ?? 'TR';

    // Permite saber si el plugin está colapsado o no
    this.collapsed_ = !IDEE.utils.isUndefined(options.collapsed) ? options.collapsed : true;

    // Permite que el plugin sea colapsado o no
    this.collapsible_ = !IDEE.utils.isUndefined(options.collapsible) ? options.collapsible : true;

    // Tooltip
    this.tooltip_ = options.tooltip || getValue('tooltip');

    // Determina si el plugin es draggable o no
    this.isDraggable = !IDEE.utils.isUndefined(options.isDraggable) ? options.isDraggable : false;

    // Permite saber si se permite movimiento de capas
    this.isMoveLayers = options.isMoveLayers || false;

    // Determina el modo de selección de las capas
    this.modeSelectLayers = IDEE.utils.isUndefined(options.modeSelectLayers) ? 'eyes' : options.modeSelectLayers;

    // Herramientas para mostrar en las capas
    this.tools = IDEE.utils.isUndefined(options.tools) ? ['transparency', 'legend', 'zoom', 'information', 'style', 'delete'] : options.tools;

    // Funcionalidad añadir capas
    this.addLayers = options.addLayers;

    // Funcionalidad ocultar/añadir capas
    this.statusLayers = options.statusLayers;

    // Servicios precargados
    this.precharged = options.precharged || `${IDEE.config.LIST_PRECHARGED_URL}`;
    // URL del JSON para probar en local
    // this.precharged = options.precharged || 'http://localhost:6123/test/precharged.json';

    this.loadPrecharged_();

    // Mostrar tipo de capa
    this.displayLabel = !IDEE.utils.isUndefined(options.displayLabel)
      ? options.displayLabel : false;

    //  Metadatos
    this.metadata_ = api.metadata;

    //  Determina si permite o no servicios http
    this.http = true;
    if (options.http !== undefined && (options.http === false || options.http === 'false')) {
      this.http = false;
    }

    // Determina si permite o no servicios https
    this.https = true;
    if (options.https !== undefined && (options.https === false || options.https === 'false')) {
      this.https = false;
    }

    // showCatalog
    this.showCatalog = options.showCatalog || false;

    // use proxy
    this.useProxy = IDEE.utils.isUndefined(options.useProxy) ? IDEE.useproxy : options.useProxy;

    // Estado inicial del proxy
    this.statusProxy = IDEE.useproxy;

    // Indicates order to the plugin
    this.order = options.order >= -1 ? options.order : null;

    // Añadir attributions
    this.useAttributions = options.useAttributions || false;
  }

  // Devuelve el idioma del plugin
  static getJSONTranslations(lang) {
    if (lang === 'en' || lang === 'es') {
      return (lang === 'en') ? en : es;
    }
    return IDEE.language.getTranslation(lang).layerswitcher;
  }

  // Esta función añade el plugin al mapa
  addTo(map) {
    this.map_ = map;

    // creamos panel
    const panel = new IDEE.ui.Panel('Layerswitcher', {
      className: 'm-plugin-layerswitcher',
      collapsed: this.collapsed_,
      collapsible: this.collapsible_,
      position: IDEE.ui.position[this.position_],
      collapsedButtonClass: 'm-layerswitcher-icons-layers',
      tooltip: this.tooltip_,
      order: this.order,
    });

    this.panel_ = panel;

    // creamos control
    const control = new LayerswitcherControl({
      isDraggable: this.isDraggable,
      modeSelectLayers: this.modeSelectLayers,
      tools: this.tools,
      addLayers: this.addLayers,
      statusLayers: this.statusLayers,
      collapsed: this.collapsed_,
      isMoveLayers: this.isMoveLayers,
      precharged: this.precharged,
      http: this.http,
      https: this.https,
      showCatalog: this.showCatalog,
      order: this.order,
      useProxy: this.useProxy,
      statusProxy: this.statusProxy,
      useAttributions: this.useAttributions,
      displayLabel: this.displayLabel,
    });
    this.control_ = control;

    this.controls_.push(this.control_);

    // se dispara evento cuando se añade al mapa
    this.control_.on(IDEE.evt.ADDED_TO_MAP, () => {
      this.fire(IDEE.evt.ADDED_TO_MAP);
    });

    this.panel_.addControls(this.controls_);
    this.map_.addPanels(this.panel_);

    control.addEventPanel(panel);
  }

  /**
   * Carga el catálogo precargado desde una URL JSON.
   * @private
   */
  loadPrecharged_() {
    if (IDEE.utils.isUrl(this.precharged)) {
      window.fetch(this.precharged)
      .then((response) => {
        if (response.status !== 200) {
          throw new Error(String(response.status));
        }
        return response.json();
      })
      .then((data) => {
        if (!data || !IDEE.utils.isObject(data)) {
          throw new Error('invalid json');
        }
        this.precharged = data;
        if (this.control_) {
          this.control_.precharged = data;
        }
      })
      .catch((err) => {
        IDEE.dialog.error(getValue('exception.errorPrechargedUrl'), 'Layerswitcher.precharged');
      });
    }
  }

  // Esta función devuelve la posición del plugin
  get position() {
    return this.position_;
  }

  //  Esta función devuelve el nombre del plugin
  get name() {
    return this.name_;
  }

  // Esta función devuelve si el panel es collapsible o no
  get collapsed() {
    return this.panel_.isCollapsed();
  }

  // Devuelve la cadena API-REST del plugin
  getAPIRest() {
    return `${this.name}=${this.position_}*${this.collapsed}*${this.collapsible}*${this.tooltip_}*${this.isDraggable}*${this.isMoveLayers}*${this.modeSelectLayers}*${this.tools}*${this.http}*${this.https}*${this.showCatalog}*${this.useProxy}*${this.displayLabel}*${this.addLayers}*${this.statusLayers}`;
  }

  // Devuelve la cadena API-REST del plugin en base64
  getAPIRestBase64() {
    return `${this.name}=base64=${IDEE.utils.encodeBase64(this.options)}`;
  }

  // Esta función devuelve los metadatos del plugin
  getMetadata() {
    return this.metadata_;
  }

  getPanel() {
    return this.panel_;
  }

  // Esta función elimina el plugin del mapa
  destroy() {
    this.map_.removeControls(this.controls_);
    [this.control_] = [null];
  }

  // Esta función devuelve si el plugin recibido por parámetro es instancia de Layerswitcher
  equals(plugin) {
    return plugin instanceof Layerswitcher;
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
        const html = IDEE.template.compileSync(myhelp, {
          vars: {
            urlImages: `${IDEE.config.API_IDEE_URL}plugins/layerswitcher/images/`,
            translations: {
              help1: getValue('textHelp.help1'),
              help2: getValue('textHelp.help2'),
              help3: getValue('textHelp.help3'),
              help4: getValue('textHelp.help4'),
              help5: getValue('textHelp.help5'),
              help6: getValue('textHelp.help6'),
              help7: getValue('textHelp.help7'),
              help8: getValue('textHelp.help8'),
              help9: getValue('textHelp.help9'),
              help10: getValue('textHelp.help10'),
              help11: getValue('textHelp.help11'),
              help12: getValue('textHelp.help12'),
              help13: getValue('textHelp.help13'),
              help14: getValue('textHelp.help14'),
              help15: getValue('textHelp.help15'),
              help16: getValue('textHelp.help16'),
              help17: getValue('textHelp.help17'),
              help18: getValue('textHelp.help18'),
              help19: getValue('textHelp.help19'),
              help20: getValue('textHelp.help20'),
            },
          },
        });
        success(html);
      }),
    };
  }
}
