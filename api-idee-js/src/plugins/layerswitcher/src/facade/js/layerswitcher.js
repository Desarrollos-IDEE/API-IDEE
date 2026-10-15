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

// Estas capas hacen referencia a la estructura de iberpix
const PRECHARGED = {
  services: [
    // {
    //   type: 'WMS',
    //   name: 'Camino de Santiago',
    //   url: 'https://www.ign.es/wms-inspire/camino-santiago',
    // }, {
    //   type: 'WMS',
    //   name: 'Redes Geodésicas',
    //   url: 'https://www.ign.es/wms-inspire/redes-geodesicas',
    // }, {
    //   type: 'WMS',
    //   name: 'Planimetrías',
    //   url: 'https://www.ign.es/wms/minutas-cartograficas',
    // }, {
    //   type: 'MapLibre',
    //   name: 'Mapa Libre',
    //   legend: 'Mapa Libre',
    //   url: 'https://vt-mapabase.idee.es/files/styles/mapaBase_scn_color1_CNIG.json',
    // },
  ],
  groups: [{
    name: 'Cartografía',
    services: [{
      type: 'WMTS',
      name: 'Mapas',
      url: 'https://www.ign.es/wmts/mapa-raster?',
    }, {
      type: 'WMTS',
      name: 'Callejero',
      url: 'https://www.ign.es/wmts/ign-base?',
    }, {
      type: 'WMTS',
      name: 'Primera edición MTN y Minutas de 1910-1970',
      url: 'https://www.ign.es/wmts/primera-edicion-mtn?',
    }, {
      type: 'WMS',
      name: 'Planimetrías (1870 y 1950)',
      url: 'https://www.ign.es/wms/minutas-cartograficas?',
    }, {
      type: 'WMTS',
      name: 'Planos de Madrid (1622 - 1960)',
      url: 'https://www.ign.es/wmts/planos?',
    }, {
      type: 'WMS',
      name: 'Hojas kilométricas (Madrid - 1860)',
      url: 'https://www.ign.es/wms/hojas-kilometricas?',
    }, {
      type: 'WMS',
      name: 'Cuadrículas Mapa Topográfico Nacional',
      url: 'https://www.ign.es/wms-inspire/cuadriculas?',
    }],
  }, {
    name: 'Imágenes',
    services: [{
      type: 'WMTS',
      name: 'Ortofotos máxima actualidad PNOA',
      url: 'https://www.ign.es/wmts/pnoa-ma?',
    }, {
      type: 'WMS',
      name: 'Ortofotos históricas y PNOA anual',
      url: 'https://www.ign.es/wms/pnoa-historico?',
    }, {
      type: 'WMS',
      name: 'Ortofotos provisionales PNOA',
      url: 'https://wms-pnoa.idee.es/pnoa-provisionales?',
    }, {
      type: 'WMS',
      name: 'Mosaicos de satélite',
      url: 'https://wms-satelites-historicos.idee.es/satelites-historicos?',
    }, {
      type: 'WMS',
      name: 'Fototeca (Consulta de fotogramas históricos y PNOA)',
      url: 'https://wms-fototeca.idee.es/fototeca?',
    }],
  }, {
    name: 'Información geográfica de referencia y temática',
    services: [{
      type: 'WMS',
      name: 'Catastro',
      url: 'https://ovc.catastro.meh.es/Cartografia/WMS/ServidorWMS.aspx?',
    }, {
      type: 'WMS',
      name: 'Unidades administrativas',
      url: 'https://www.ign.es/wms-inspire/unidades-administrativas?',
    }, {
      type: 'WMS',
      name: 'Nombres geográficos (Nomenclátor Geográfico Básico NGBE)',
      url: 'https://www.ign.es/wms-inspire/ngbe?',
    }, {
      type: 'WMS',
      name: 'Redes de transporte',
      url: 'https://servicios.idee.es/wms-inspire/transportes?',
    }, {
      type: 'WMS',
      name: 'Hidrografía',
      url: 'https://servicios.idee.es/wms-inspire/hidrografia?',
    }, {
      type: 'WMS',
      name: 'Direcciones y códigos postales',
      url: 'https://www.cartociudad.es/wms-inspire/direcciones-ccpp?',
    }, {
      type: 'WMTS',
      name: 'Ocupación del suelo (Corine y SIOSE)',
      url: 'https://servicios.idee.es/wmts/ocupacion-suelo?',
    }, {
      type: 'WMS',
      name: 'Ocupación del suelo Histórico (Corine y SIOSE)',
      url: 'https://servicios.idee.es/wms-inspire/ocupacion-suelo-historico?',
    },
    // {
    //   type: 'WMS',
    //   name: 'Copernicus Land Monitoring Service',
    //   url: 'https://servicios.idee.es/wms/copernicus-landservice-spain?',
    // },
    {
      type: 'WMS',
      name: 'Información sísmica (terremotos)',
      url: 'https://www.ign.es/wms-inspire/geofisica?',
    }, {
      type: 'WMS',
      name: 'Red de vigilancia volcánica',
      url: 'https://wms-volcanologia.ign.es/volcanologia?',
    }, {
      type: 'WMS',
      name: 'Redes geodésicas',
      url: 'https://www.ign.es/wms-inspire/redes-geodesicas?',
    }],
  }, {
    name: 'Modelos digitales de elevaciones',
    services: [{
      type: 'WMTS',
      name: 'Modelo Digital de Superficies (Sombreado superficies y consulta de elevaciones edificios y vegetación)',
      url: 'https://wmts-mapa-lidar.idee.es/lidar?',
    }, {
      type: 'WMTS',
      name: 'Modelo Digital del Terreno (Sombreado terreno y consulta de altitudes)',
      url: 'https://servicios.idee.es/wmts/mdt?',
      white_list: ['EL.ElevationGridCoverage'],
    }, {
      type: 'WMS',
      name: 'Curvas de nivel y puntos acotados',
      url: 'https://servicios.idee.es/wms-inspire/mdt?',
      white_list: ['EL.ContourLine', 'EL.SpotElevation'],
    }],
  }],
};
export default class Layerswitcher extends IDEE.Plugin {
  constructor(options = {}) {
    super('layerswitcher', {
      position: options.position || 'right',
      tooltip: options.tooltip || getValue('tooltip'),
      order: options.order,
    });

    /**
     * Plugin parameters
     * @public
     * @type {object}
     */
    this.options = options;

    /**
     * Min panel width
     * @private
     * @type {number}
     */
    this.minPanelWidth = 360;

    /**
     * Option to allow the plugin to be collapsed or not
     * @public
     * @type {Boolean}
     */
    this.collapsed_ = !IDEE.utils.isUndefined(options.collapsed) ? options.collapsed : true;

    /**
     * Option to allow the plugin to drag and drop layers
     * @public
     * @type {Boolean}
     */
    this.isMoveLayers = options.isMoveLayers ?? false;

    /**
     * Option to allow the plugin to select layers with eyes or checkboxes
     * @public
     * @type {string}
     */
    this.modeSelectLayers = IDEE.utils.isUndefined(options.modeSelectLayers) ? 'eyes' : options.modeSelectLayers;

    /**
     * Tools to show in the plugin for each layer
     * @public
     * @type {Array}
     */
    this.tools = IDEE.utils.isUndefined(options.tools) ? ['transparency', 'legend', 'zoom', 'information', 'style', 'delete'] : options.tools;

    /**
     * Option to allow the ability add layers from the catalog of the plugin
     * @public
     * @type {Boolean}
     */
    this.addLayers = options.addLayers;

    /**
     * Option to allow the ability to show/hide all layers
     * @public
     * @type {Boolean}
     */
    this.statusLayers = options.statusLayers;

    /**
     * Object with precharged layers to show in the plugin
     * @public
     * @type {Object}
     */
    let { precharged } = options;
    if (typeof precharged === 'string') {
      try {
        precharged = JSON.parse(precharged);
      } catch (e) {
        try {
          precharged = IDEE.utils.decodeBase64(precharged);
        } catch (err) {
          IDEE.dialog.error(getValue('exception.errorPrecharged'), 'Layerswitcher.precharged');
          precharged = undefined;
        }
      }
    }
    this.precharged = precharged && Object.keys(precharged).length > 0
      ? precharged
      : PRECHARGED;

    /**
     * Option to show or not the label of the layers in the plugin
     * @public
     * @type {Boolean}
     */
    this.displayLabel = !IDEE.utils.isUndefined(options.displayLabel)
      ? options.displayLabel : false;

    /**
     * Metadata from api.json
     * @private
     * @type {Object}
     */
    this.metadata_ = api.metadata;

    /**
     * Option to allow the load of http services
     * @public
     * @type {Boolean}
     */
    this.http = true;
    if (options.http !== undefined && (options.http === false || options.http === 'false')) {
      this.http = false;
    }

    /**
     * Option to allow the load of https services. If null all services are allowed
     * @public
     * @type {Boolean}
     */
    this.https = true;
    if (options.https !== undefined && (options.https === false || options.https === 'false')) {
      this.https = false;
    }

    /**
     * Option to allow the load of layers from the catalog of the plugin
     * @public
     * @type {Boolean}
     */
    this.showCatalog = options.showCatalog || false;

    /**
     * Option to allow the use of proxy in the plugin
     * @public
     * @type {Boolean}
     */
    this.useProxy = IDEE.utils.isUndefined(options.useProxy) ? IDEE.useproxy : options.useProxy;

    /**
     * Initial status of the proxy
     * @private
     * @type {Boolean}
     */
    this.statusProxy = IDEE.useproxy;

    /**
     * Option to allow the use of attributions in the plugin
     * @public
     * @type {Boolean}
     */
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
    this.map = map;

    this.button = new IDEE.ui.buttons.SidePanelButton(this.name, {
      position: this.position,
      tooltip: this.tooltip,
      svgPath: 'https://componentes.idee.es/estaticos/Simbologia/svg/icons_cota/icn_capas.svg',
      order: this.order,
    });
    map.addButtons(this.button);

    this.panel = new IDEE.ui.panels.PluginSidePanel(this.name, {
      tooltip: this.tooltip,
      position: this.position,
      minWidth: this.minPanelWidth,
      maxWidth: this.maxPanelWidth,
      className: 'm-plugin-layerswitcher',
      collapsed: this.collapsed_,
      collapsedButtonClass: 'm-layerswitcher-icons-layers',
      order: this.order,
    });

    this.controls.push(new LayerswitcherControl({
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
    }));

    this.controls[0].on(IDEE.evt.ADDED_TO_MAP, () => {
      this.fire(IDEE.evt.ADDED_TO_MAP);
    });

    this.panel.addControls(this.controls);

    this.button.panel = this.panel;
    this.panel.button = this.button;

    map.addPanels(this.panel);
    this.controls[0].addEventPanel(this.panel);
  }

  // Devuelve la cadena API-REST del plugin
  getAPIRest() {
    return `${this.name}=${this.position}*${this.collapsed}*${this.order}*${this.tooltip}*${this.isMoveLayers}*${this.modeSelectLayers}*${this.tools}*${this.http}*${this.https}*${this.showCatalog}*${this.useProxy}*${this.addLayers}*${this.statusLayers}*${this.displayLabel}*${this.useAttributions}*${JSON.stringify(this.precharged)}`;
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
    return this.panel;
  }

  // Esta función elimina el plugin del mapa
  destroy() {
    this.map.removeButton(this.button);
    this.map.removePanel(this.panel);
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
