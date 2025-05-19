/**
 * @module IDEE/control/WindowSyncControl
 */
import template from 'templates/windowsync';
import WindowSyncImplControl from 'impl/windowsynccontrol';
import { getValue } from './i18n/language';
import { getBaseLayers, getLayers } from './utils';
import { handlerErrorPluginWindowSync, handlerErrorURLWindowSync } from './errorhandling';

const CONFIG_IBERPIX_BACKIMAGELAYER = {
  order: 10,
  position: 'TR',
  layerId: 0,
  layerVisibility: true,
  collapsed: true,
  collapsible: true,
  columnsNumber: 4,
  empty: true,
  layerOpts: [{
    id: 'raster',
    preview: 'https://www.ign.es/iberpix/static/media/raster.c7a904f3.png',
    title: 'Mapa',
    layers: [
      'WMTS*https://www.ign.es/wmts/mapa-raster*MTN*GoogleMapsCompatible*CartografíadelIGN*false*image/jpeg*false*false*true',
    ],
  },
  {
    id: 'imagen',
    preview: 'https://www.ign.es/iberpix/static/media/image.44c5b451.png',
    title: 'Imagen',
    layers: [
      'TMS*Nombre*https://tms-pnoa-ma.idee.es/1.0.0/pnoa-ma/{z}/{x}/{-y}.jpeg*true*false*19*false',
    ],
  },
  {
    id: 'mapa',
    preview: 'https://www.ign.es/iberpix/static/media/mapa.98d45f00.png',
    title: 'Callejero',
    layers: [
      'WMTS*https://www.ign.es/wmts/ign-base*IGNBaseTodo*GoogleMapsCompatible*Callejero*false*image/jpeg*false*false*true',
    ],
  },
  {
    id: 'hibrido',
    title: 'Híbrido',
    preview: 'https://www.ign.es/iberpix/static/media/hibrido.485e957e.png',
    layers: [
      'TMS*Nombre*https://tms-pnoa-ma.idee.es/1.0.0/pnoa-ma/{z}/{x}/{-y}.jpeg*true*false*19*false',
      'WMTS*https://www.ign.es/wmts/ign-base*IGNBaseOrto*GoogleMapsCompatible*Callejero*false*image/jpeg*false*false*true',
    ],
  },
  {
    id: 'lidar',
    preview: 'https://www.ign.es/iberpix/static/media/lidar.5aa94e82.png',
    title: 'LiDAR (Relieve)',
    layers: [
      'WMTS*https://wmts-mapa-lidar.idee.es/lidar*EL.GridCoverageDSM*GoogleMapsCompatible*LiDAR*false*image/png*false*false*true',
    ],
  },
  {
    id: 'ocupacion-suelo',
    preview: 'https://www.ign.es/iberpix/static/media/ocupacion_suelo.ae7c9787.png',
    title: 'Ocupación del suelo (CORINE)',
    layers: [
      'WMTS*https://servicios.idee.es/wmts/ocupacion-suelo?*LC.LandCoverSurfaces*GoogleMapsCompatible*SIOSE*false*image/jpeg*false*false*true',
    ],
  },
  {
    id: 'historicos',
    preview: 'https://www.ign.es/iberpix/static/media/historicos.78c9c369.png',
    title: 'Mapas Históricos',
    layers: [
      'WMTS*https://www.ign.es/wmts/primera-edicion-mtn?*mtn50-edicion1*GoogleMapsCompatible*mtn50-edicion1*false*image/jpeg*false*false*true',
    ],
  },
  ],
};

const CONFIG_IBERPIX_LAYERSWITCHER = {
  collapsed: true,
  position: 'TR',
  https: true,
  http: true,
  isDraggable: false,
  modeSelectLayers: 'eyes',
  tools: ['transparency', 'legend', 'zoom', 'information', 'style', 'delete'],
  isMoveLayers: true,
  showCatalog: true,
  precharged: {
    groups: [
      {
        name: 'Cartografía',
        services: [
          {
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
        services: [
          {
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
        services: [
          {
            name: 'Catastro ',
            type: 'WMS',
            url: 'https://ovc.catastro.meh.es/Cartografia/WMS/ServidorWMS.aspx?',
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
        services: [
          {
            name: 'Modelo Digital de Superficies (Sombreado superficies y consulta de elevaciones edificios y vegetación)',
            type: 'WMTS',
            url: 'https://wmts-mapa-lidar.idee.es/lidar?',
          },
          {
            name: 'Modelo Digital del Terreno (Sombreado terreno y consulta de altitudes)',
            type: 'WMTS',
            url: 'https://servicios.idee.es/wmts/mdt?',
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
  },
  order: 12,
};

export default class WindowSyncControl extends IDEE.Control {
  /**
     * @classdesc
     * Main constructor of the class. Creates a PluginControl
     * control
     *
     * @constructor
     * @extends {IDEE.Control}
     * @api stable
     */
  constructor({ controls, plugins = [], layersPlugin }, controlsLayers, map) {
    // 1. checks if the implementation can create PluginControl
    if (IDEE.utils.isUndefined(WindowSyncImplControl)
      || (IDEE.utils.isObject(WindowSyncImplControl)
      && IDEE.utils.isNullOrEmpty(Object.keys(WindowSyncImplControl)))) {
      IDEE.exception(getValue('exception'));
    }

    // 2. implementation of this control
    const impl = new WindowSyncImplControl();
    super(impl, 'WindowSync');
    this.implControl_ = impl;

    /**
      * Name plugin
      * @private
      * @type {String}
      */
    this.name_ = 'WindowSyncControl';

    /**
      * Facade of the map
      * @private
      * @type {IDEE.Map}
      */
    this.map_ = map;

    this.plugins = [
      {
        name: 'Layerswitcher',
        params: CONFIG_IBERPIX_LAYERSWITCHER,
      },
      {
        name: 'BackImgLayer',
        params: CONFIG_IBERPIX_BACKIMAGELAYER,
      },
    ];

    plugins.forEach((plugin) => {
      if (plugin.name !== 'Layerswitcher' && plugin.name !== 'BackImgLayer') {
        this.plugins.push(plugin);
      }
    });

    this.controls = controls;

    this.mapsWindows_ = [
      {
        id: 'base',
        map,
      },
    ];
    // ? Referencia de los mapas que se van cargando
    this.implControl_.maps = this.mapsWindows_;

    this.layers = controlsLayers;

    this.pluginScript = this.getScriptAndLink('script');
    this.linksStyle = this.getScriptAndLink('link');

    this.activate = this.activate.bind(this);
    this.closeWindows = this.closeWindows.bind(this);
  }

  /**
     * This function creates the view
     *
     * @public
     * @function
     * @param {IDEE.Map} map to add the control
     * @api stable
     */
  active(html) {
    const templateResult = new Promise((success, fail) => {
      const options = {
        jsonp: true,
        vars: {
          translations: {
            closeAll: getValue('closeAll'),
            openWindow: getValue('openWindow'),
          },
        },
      };

      this.template = IDEE.template.compileSync(template, options);

      success(this.template);
    });

    templateResult
      .then((t) => {
        html.querySelector('#m-comparators-contents').appendChild(t);

        const btnOpenWindow = t.querySelector('#new_windowsync');
        const btnCloseWindow = t.querySelector('#deleteAll_windowsync');
        if (btnOpenWindow) {
          btnOpenWindow.addEventListener('click', this.activate);
        }

        if (btnCloseWindow) {
          btnCloseWindow.addEventListener('click', this.closeWindows);
        }
      });

    this.map_.addLayers(this.layers);
    this.map_.getLayers().forEach((l) => !l.isBase && l.setVisible(false));
  }

  /**
     * Activate Select/Input
     *
     * @public
     * @function
     * @api stable
     */
  activate() {
    const newWindow = window.open(`${window.location.href}`, '_blank', 'width=800,height=800');
    this.generateNewMap(newWindow);

    const intervalID = setInterval(() => {
      if (newWindow.NEW_API_MAP !== undefined) {
        this.addEventMap(newWindow);
        clearInterval(intervalID);
      }
    }, 500);
  }

  addEventMap(nWindow) {
    const newWindow = nWindow;
    const randomNumber = Math.floor(Math.random() * 9000) + 1000;

    const id = `map_${randomNumber}`;
    newWindow.ID_MAP = id;

    this.mapsWindows_.push({
      id,
      map: newWindow.NEW_API_MAP,
      window: newWindow,
    });

    this.handerCloseWindow(newWindow, id);

    newWindow.NEW_API_MAP.on(IDEE.evt.COMPLETED, () => {
      this.implControl_.removeEventListeners(this.mapsWindows_);
      this.implControl_.handleMoveMap(this.mapsWindows_);
    });
  }

  handerCloseWindow(newWindow, id) {
    const timer = setInterval(() => {
      if (newWindow.closed) {
        clearInterval(timer);
        // ? Se elimina por el indice para no perder la referencia
        const index = this.mapsWindows_.findIndex((obj) => obj.id === id);
        this.mapsWindows_.splice(index, 1);
      }
    }, 1000);
  }

  generateNewMap(newWindow) {
    const centerMap = this.map_.getCenter();
    const center = JSON.stringify([centerMap.x, centerMap.y]);
    const projection = `${this.map_.getProjection().code}*${this.map_.getProjection().units}`;
    const zoom = this.map_.getZoom();
    const bgColorContainer = this.map_.getBGColorContainer();
    const controls = JSON.stringify(this.controls);
    const plugins = this.generatePlugins() || '';
    const layers = JSON.stringify([...this.layers, ...getLayers(this.map_)]);
    const baseLayers = JSON.stringify(getBaseLayers(this.map_));
    const ticket = IDEE.config.TICKET;

    const contenidoHTML = `
       <!DOCTYPE html>
       <html>
       <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0">
          <meta http-equiv="X-UA-Compatible" content="IE=edge" />
          <meta name="api-idee" content="yes">

           <title>Nueva Ventana</title>
           ${this.linksStyle.join(' ')}
           <style rel="stylesheet">
           html,
           body {
               margin: 0;
               padding: 0;
               height: 100%;
               overflow: hidden;
           }
       </style>
       </head>
       <body>
           <div id="map"></div>
           ${this.pluginScript.join(' ')}
           <script>
           const newMap = IDEE.map({
             container: 'map',
             bgColorContainer: '${bgColorContainer}',
             center: ${center},
             zoom: ${zoom},
             layers: ${baseLayers},
             projection: '${projection}',
             ${controls ? `controls:${controls},` : ''}
             ${ticket ? `ticket: '${ticket}'` : ''}
           });
           ${plugins}
           newMap.addLayers(${layers})
           window.NEW_API_MAP = newMap;
           </script>
       </body>
       </html>
       `;
    // Escribir el contenido en la nueva ventana
    newWindow.document.write(contenidoHTML);
  }

  /**
   * Devuelve los elementos link o script del html necesarios para cargar el
   * mapa, plugins, ...
   * @param {String} type script o link como valores posibles
   * @returns
   */
  getScriptAndLink(type) {
    const attr = type === 'link' ? 'href' : 'src';
    let elements = [...document.querySelectorAll(`${type}[${attr}*="${IDEE.config.API_IDEE_URL}"]`)];
    if (elements.length === 0) {
      elements = this.getAPIRestScriptAndLink(type, attr);
    }
    return elements.map((l) => l.outerHTML);
  }

  getAPIRestScriptAndLink(type, attr) {
    if (type === 'script') {
      return [...document.querySelectorAll(`${type}[${attr}*=".ol.min"]`), document.querySelector('script[src="js/configuration.js"]')];
    }
    return [...document.querySelectorAll(`${type}[${attr}*=".ol.min"]`)];
  }

  pluginScriptAndLinkAPI(style, script, name) {
    if (!style) {
      this.linksStyle.push(`<link type="text/css" rel="stylesheet" href="plugins/${name}/${name}.ol.min.css">`);
    }

    if (!script) {
      this.pluginScript.push(`<script type="text/javascript" src="plugins/${name}/${name}.ol.min.js"></script>`);
    }
  }

  generatePlugins() {
    if (this.plugins === undefined) {
      return '';
    }
    const plugins = this.plugins.map(({ name, params = {} }) => {
      this.handlePluginScrips(name);
      try {
        return `newMap.addPlugin(new IDEE.plugin.${name}(${JSON.stringify(params)}));`;
      } catch (error) {
        handlerErrorPluginWindowSync(error, name);
        return '';
      }
    }, this);
    return plugins.join(' ');
  }

  closeWindows() {
    this.mapsWindows_.forEach(({ window }, i) => {
      if (i !== 0) {
        window.close();
      }
    });

    this.implControl_.removeEventListeners(this.mapsWindows_);
  }

  handlePluginScrips(name) {
    const style = this.getScriptAndLink('link').some((s) => s.includes(`${name.toLowerCase()}.ol.min.css`));
    const script = this.getScriptAndLink('script').some((s) => s.includes(`${name.toLowerCase()}.ol.min.js`));

    const currentUrl = window.location.href;
    if (currentUrl.includes('comparators') && (currentUrl.includes(IDEE.config.API_IDEE_URL))) {
      this.pluginScriptAndLinkAPI(style, script, name.toLowerCase());
    } else {
      handlerErrorURLWindowSync(style, script, name);
    }
  }

  /**
     * Deactivate SpyEye
     *
     * @public
     * @function
     * @api stable
     */
  deactivate() {
    if (this.layerSelected === null) this.layerSelected = this.layers[0];

    if (this.template) this.template.remove();
    this.layerSelected = null;

    this.closeWindows();
  }

  destroy() {
    this.name_ = null;
    this.map_ = null;
    this.layers = null;

    this.closeWindows();
  }

  /**
     * This function compares controls
     *
     * @public
     * @function
     * @param {IDEE.Control} control to compare
     * @api stable
     * @return {Boolean}
     */
  equals(control) {
    return control instanceof WindowSyncControl;
  }
}
