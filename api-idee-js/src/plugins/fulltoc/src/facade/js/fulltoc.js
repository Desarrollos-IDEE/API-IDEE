/**
 * @module M/plugin/FullTOC
 */
import '../assets/css/fulltoc';
import '../assets/css/fonts';
import FullTOCControl from './fulltoccontrol';
import api from '../../api';
import { getValue } from './i18n/language';

import es from './i18n/es';
import en from './i18n/en';

// Estas capas hacen referencia a la estructura de
// https://centrodedescargas.cnig.es/CentroDescargas/index.jsp
/* const PRECHARGED = {
  groups: [
    {
      name: 'Mapas en formato imagen',
      services: [
        {
          name: 'Mapa',
          type: 'WMTS',
          url: 'https://www.ign.es/wmts/mapa-raster?',
        },

      ],
    },
    {
      name: 'Información geográfica de referencia',
      services: [
        {
          name: 'Unidades administrativas',
          type: 'WMS',
          url: 'https://www.ign.es/wms-inspire/unidades-administrativas?',
          white_list: ['AU.AdministrativeBoundary', 'AU.AdministrativeUnit'],
        },
        {
          name: 'Nombres geográficos',
          type: 'WMS',
          url: 'https://www.ign.es/wms-inspire/ngbe?',
        },
        {
          name: 'Redes geodésicas',
          type: 'WMS',
          url: 'https://www.ign.es/wms-inspire/redes-geodesicas?',
        },
        {
          name: 'Cuadrículas cartográficas',
          type: 'WMS',
          url: 'https://www.ign.es/wms-inspire/cuadriculas?',
          white_list: ['Grid-REGCAN95-lonlat-50k',
            'Grid-ETRS89-lonlat-50k',
            'Grid-ETRS89-lonlat-25k', 'Grid-REGCAN95-lonlat-25k', 'Grid-25k-extendida'],
        },
      ],
    },
    {
      name: 'Fotos e imágenes aéreas',
      services: [
        {
          name: 'PNOA. Ortofotos máxima actualidad',
          type: 'WMS',
          url: 'https://www.ign.es/wms-inspire/pnoa-ma?',
        },
        {
          name: 'PNOA. Ortofotos históricas y PNOA anual',
          type: 'WMS',
          url: 'https://www.ign.es/wms/pnoa-historico?',
        },
        {
          name: 'PNOA. Ortofotos provisionales',
          type: 'WMS',
          url: 'https://wms-pnoa.idee.es/pnoa-provisionales?',
        },
        {
          name: 'Imagen',
          type: 'WMTS',
          url: 'https://www.ign.es/wmts/pnoa-ma?',
        },
        {
          name: 'Fototeca',
          type: 'WMS',
          url: 'https://fototeca.cnig.es/wms/fototeca.dll?',
        },
        {
          name: 'Ocupación del suelo',
          type: 'WMS',
          url: 'https://servicios.idee.es/wms-inspire/ocupacion-suelo?',
        },
        {
          name: 'Ocupación del suelo. Histórico',
          type: 'WMS',
          url: 'https://servicios.idee.es/wms-inspire/ocupacion-suelo-historico?',
        },
        {
          name: 'Ocupación del suelo',
          type: 'WMTS',
          url: 'https://servicios.idee.es/wmts/ocupacion-suelo?',
        },
        {
          name: 'Mosaicos de Satélite históricos de España',
          type: 'WMS',
          url: 'https://wms-satelites-historicos.idee.es/satelites-historicos?',
        },
      ],
    },
    {
      name: 'Mapas vectoriales y Bases Cartográficas y Topográficas',
      services: [
        {
          name: 'Callejero',
          type: 'WMTS',
          url: 'https://www.ign.es/wmts/ign-base?',
        },
      ],
    },
    {
      name: 'Información geográfica temática',
      services: [
        {
          name: 'Direcciones y códigos postales',
          type: 'WMS',
          url: 'https://www.cartociudad.es/wms-inspire/direcciones-ccpp?',
        },
        {
          name: 'Modelos digitales del terreno',
          type: 'WMS',
          url: 'https://servicios.idee.es/wms-inspire/mdt?',
        },
        {
          name: 'Información Geográfica de Referencia. Transportes',
          type: 'WMS',
          url: 'https://servicios.idee.es/wms-inspire/transportes?',
        },
        {
          name: 'Información Geográfica de Referencia. Hidrografía',
          type: 'WMS',
          url: 'https://servicios.idee.es/wms-inspire/hidrografia?',
        },
        {
          name: 'Copernicus Land Monitoring Service',
          type: 'WMS',
          url: 'https://servicios.idee.es/wms/copernicus-landservice-spain?',
        },
        {
          name: 'Información sísmica y volcánica',
          type: 'WMS',
          url: 'https://www.ign.es/wms-inspire/geofisica?',
        },
        {
          name: 'Red de Vigilancia Volcánica',
          type: 'WMS',
          url: 'https://wms-volcanologia.ign.es/volcanologia?',
        },
        {
          name: 'Fototeca',
          type: 'WMS',
          url: 'https://wms-fototeca.idee.es/fototeca?',
        },
      ],
    },
    {
      name: 'Documentación geográfica y cartografía antiguas',
      services: [
        {
          name: 'Planos de Madrid (1622 - 1960)',
          type: 'WMS',
          url: 'https://www.ign.es/wms/planos?',
        },
        {
          name: 'Hojas kilométricas (Madrid - 1860)',
          type: 'WMS',
          url: 'https://www.ign.es/wms/hojas-kilometricas?',
        },
        {
          name: 'Planimetrías',
          type: 'WMS',
          url: 'https://www.ign.es/wms/minutas-cartograficas?',
        },
        {
          name: 'Primera edición de los Mapas Topográficos Nacionales',
          type: 'WMS',
          url: 'https://www.ign.es/wms/primera-edicion-mtn?',
        },
        {
          name: 'Mapas Históricos',
          type: 'WMTS',
          url: 'https://www.ign.es/wmts/primera-edicion-mtn',
        },
      ],
    },
    {
      name: 'Modelos Digitales de Elevaciones',
      services: [
        {
          name: 'Relieve',
          type: 'WMTS',
          url: 'https://wmts-mapa-lidar.idee.es/lidar?',
        },
      ],
    },
    {
      name: 'Rutas, ocio y tiempo libre',
      services: [
        {
          name: 'Camino de Santiago',
          type: 'WMS',
          url: 'https://www.ign.es/wms-inspire/camino-santiago?',
        },
      ],
    },
    {
      name: 'Capas vectoriales',
      services: [
        {
          name: 'Colecciones del Sistema Cartográfico Nacional',
          type: 'OGCAFPIFeatures',
          url: 'https://api-features.idee.es/',
        },
      ],
    },
    {
      name: 'Catastro',
      services: [
        {
          name: 'Catastro',
          type: 'WMS',
          url: 'http://ovc.catastro.meh.es/Cartografia/WMS/ServidorWMS.aspx?',
        },
      ],
    },
  ],
}; */

// Estas capas hacen referencia a la estructura de iberpix
const PRECHARGED = {
  groups: [{
    name: 'Cartografía',
    services: [{
      name: 'Mapas',
      type: 'WMTS',
      url: 'https://www.ign.es/wmts/mapa-raster?',
    },
    {
      name: 'Callejero ',
      type: 'WMTS',
      url: 'https://www.ign.es/wmts/ign-base?',
    },
    {
      name: 'Primera edición MTN y Minutas de 1910-1970',
      type: 'WMTS',
      url: 'https://www.ign.es/wmts/primera-edicion-mtn?',
    },
    {
      name: 'Planimetrías (1870 y 1950)',
      type: 'WMS',
      url: 'https://www.ign.es/wms/minutas-cartograficas?',
    },
    {
      name: 'Planos de Madrid (1622 - 1960)',
      type: 'WMTS',
      url: 'https://www.ign.es/wmts/planos?',
    },
    {
      name: 'Hojas kilométricas (Madrid - 1860)',
      type: 'WMS',
      url: 'https://www.ign.es/wms/hojas-kilometricas?',
    },
    {
      name: 'Cuadrículas Mapa Topográfico Nacional',
      type: 'WMS',
      url: 'https://www.ign.es/wms-inspire/cuadriculas?',
    },

    ],
  },
  {
    name: 'Imágenes',
    services: [{
      name: 'Ortofotos máxima actualidad PNOA',
      type: 'WMTS',
      url: 'https://www.ign.es/wmts/pnoa-ma?',
    },
    {
      name: 'Ortofotos históricas y PNOA anual',
      type: 'WMS',
      url: 'https://www.ign.es/wms/pnoa-historico?',
    },
    {
      name: 'Ortofotos provisionales PNOA',
      type: 'WMS',
      url: 'https://wms-pnoa.idee.es/pnoa-provisionales?',
    },
    {
      name: 'Mosaicos de satélite',
      type: 'WMS',
      url: 'https://wms-satelites-historicos.idee.es/satelites-historicos?',
    },
    {
      name: 'Fototeca (Consulta de fotogramas históricos y PNOA)',
      type: 'WMS',
      url: 'https://wms-fototeca.idee.es/fototeca?',
    },
    ],
  },
  {
    name: 'Información geográfica de referencia y temática',
    services: [{
      name: 'Catastro ',
      type: 'WMS',
      url: 'http://ovc.catastro.meh.es/Cartografia/WMS/ServidorWMS.aspx?',
    },
    {
      name: 'Unidades administrativas',
      type: 'WMS',
      url: ' https://www.ign.es/wms-inspire/unidades-administrativas?',
    },
    {
      name: 'Nombres geográficos (Nomenclátor Geográfico Básico NGBE)',
      type: 'WMS',
      url: 'https://www.ign.es/wms-inspire/ngbe?',
    },
    {
      name: 'Redes de transporte',
      type: 'WMS',
      url: 'https://servicios.idee.es/wms-inspire/transportes?',
    },
    {
      name: 'Hidrografía ',
      type: 'WMS',
      url: 'https://servicios.idee.es/wms-inspire/hidrografia?',
    },
    {
      name: 'Direcciones y códigos postales',
      type: 'WMS',
      url: 'https://www.cartociudad.es/wms-inspire/direcciones-ccpp?',
    },
    {
      name: 'Ocupación del suelo (Corine y SIOSE)',
      type: 'WMTS',
      url: 'https://servicios.idee.es/wmts/ocupacion-suelo?',
    },
    {
      name: 'Ocupación del suelo Histórico (Corine y SIOSE)',
      type: 'WMS',
      url: 'https://servicios.idee.es/wms-inspire/ocupacion-suelo-historico?',
    },
    {
      name: 'Copernicus Land Monitoring Service',
      type: 'WMS',
      url: 'https://servicios.idee.es/wms/copernicus-landservice-spain?',
    },
    {
      name: 'Información sísmica (terremotos)',
      type: 'WMS',
      url: 'https://www.ign.es/wms-inspire/geofisica?',
    },
    {
      name: 'Red de vigilancia volcánica',
      type: 'WMS',
      url: 'https://wms-volcanologia.ign.es/volcanologia?',
    },
    {
      name: 'Redes geodésicas',
      type: 'WMS',
      url: 'https://www.ign.es/wms-inspire/redes-geodesicas?',
    },
    ],
  },
  {
    name: 'Modelos digitales de elevaciones',
    services: [{
      name: 'Modelo Digital de Superficies (Sombreado superficies y consulta de elevaciones edificios y vegetación)',
      type: 'WMTS',
      url: 'https://wmts-mapa-lidar.idee.es/lidar?',
    },
    {
      name: 'Modelo Digital del Terreno (Sombreado terreno y consulta de altitudes)',
      type: 'WMTS',
      url: 'https://servicios.idee.es/wmts/mdt?',
      white_list: ['EL.ElevationGridCoverage'],
    },
    {
      name: 'Curvas de nivel y puntos acotados',
      type: 'WMS',
      url: 'https://servicios.idee.es/wms-inspire/mdt?',
      white_list: ['EL.ContourLine', 'EL.SpotElevation'],
    },
    ],
  },

  ],
};

export default class FullTOC extends M.Plugin {
  /**
   * @constructor
   * @extends {M.Plugin}
   * @param {Object} impl implementation object
   * @api
   */
  constructor(options = {}) {
    super();
    /**
     * Facade of the map
     * @private
     * @type {M.Map}
     */
    this.map_ = null;

    /**
     * Array of controls
     * @private
     * @type {Array<M.Control>}
     */
    this.controls_ = [];

    /**
     * Position of the plugin
     * @private
     * @type {string}
     */
    this.position_ = options.position || 'TR';

    /**
     * This parameter set if the plugin is collapsed
     * @private
     * @type {boolean}
     */
    this.collapsed_ = options.collapsed !== undefined ? options.collapsed : true;

    /**
     * Name of the plugin
     * @private
     * @type {String}
     */
    this.name_ = 'fulltoc';

    /**
     * Metadata from api.json
     * @private
     * @type {Object}
     */
    this.metadata_ = api.metadata;

    /**
     * WMS service protocol type
     * @type {Boolean}
     */
    this.http = true;
    if (options.http !== undefined && (options.http === false || options.http === 'false')) {
      this.http = false;
    }

    this.https = true;
    if (options.https !== undefined && (options.https === false || options.https === 'false')) {
      this.https = false;
    }

    this.codsi = options.codsi || false;

    /**
     * Precharged services
     * @private
     * @type {String}
     */
    this.precharged = options.precharged || PRECHARGED;

    /**
     *@private
     *@type { Number }
     */
    this.order = options.order >= -1 ? options.order : null;
  }

  /**
   * Return plugin language
   *
   * @public
   * @function
   * @param {string} lang type language
   * @api stable
   */
  static getJSONTranslations(lang) {
    if (lang === 'en' || lang === 'es') {
      return (lang === 'en') ? en : es;
    }
    return M.language.getTranslation(lang).fulltoc;
  }

  /**
   * This function adds this plugin into the map
   *
   * @public
   * @function
   * @param {M.Map} map the map to add the plugin
   * @api stable
   */
  addTo(map) {
    this.map_ = map;
    this.control_ = new FullTOCControl(
      this.http,
      this.https,
      this.precharged,
      this.codsi,
      this.order,
    );
    this.panel_ = new M.ui.Panel('FullTOC', {
      className: 'm-plugin-fulltoc',
      collapsed: this.collapsed_,
      collapsible: true,
      position: M.ui.position[this.position_],
      collapsedButtonClass: 'icon-capas',
      tooltip: getValue('tooltip'),
      order: this.order,
    });

    this.controls_.push(this.control_);
    this.control_.on(M.evt.ADDED_TO_MAP, () => {
      this.fire(M.evt.ADDED_TO_MAP);
    });

    this.map_.on(M.evt.COMPLETED, () => {
      if (this.map_ !== null) {
        if (this.control_ !== null) {
          this.control_.render();
        }

        this.map_.on(M.evt.ADDED_LAYER, () => {
          if (this.control_ !== null) {
            this.control_.render();
          }
        });

        this.map_.on(M.evt.REMOVED_LAYER, () => {
          if (this.control_ !== null) {
            this.control_.render();
          }
        });
      }
    });

    this.panel_.addControls(this.controls_);
    this.map_.addPanels(this.panel_);
  }

  /**
   * This function returns the position
   *
   * @public
   * @return {string}
   * @api
   */
  get position() {
    return this.position_;
  }

  /**
   * Name of the plugin
   *
   * @getter
   * @function
   */
  get name() {
    return this.name_;
  }

  /**
   * Collapsed parameter
   *
   * @getter
   * @function
   */
  get collapsed() {
    return this.panel_.isCollapsed();
  }

  /**
   * Get the API REST Parameters of the plugin
   *
   * @function
   * @public
   * @api
   */
  getAPIRest() {
    return `${this.name}=${this.position}*${this.collapsed}`;
  }

  /**
   * This function gets metadata plugin
   *
   * @public
   * @function
   * @api stable
   */
  getMetadata() {
    return this.metadata_;
  }

  /**
   * This function destroys this plugin
   *
   * @public
   * @function
   * @api
   */
  destroy() {
    this.map_.removeControls([this.control_]);
    [this.control_, this.controls_, this.panel_] = [null, null, null];
  }
}
