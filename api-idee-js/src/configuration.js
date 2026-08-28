/**
 * IGN API
 * Version ${pom.version}
 * Date ${build.timestamp}
 */

const backgroundlayersOpts = [{
  id: 'mapa',
  title: 'Callejero',
  layers: [
    'QUICK*Base_IGNBaseTodo_TMS',
  ],
},
{
  id: 'imagen',
  title: 'Imagen',
  layers: [
    'QUICK*BASE_PNOA_MA_TMS',
  ],
},
{
  id: 'hibrido',
  title: 'H&iacute;brido',
  layers: [
    'QUICK*BASE_HIBRIDO_LayerGroup',
  ],
},
];

const implementationSwitcherOpts = [{
  id: 'OL',
  type: 'ol',
  title: 'Open Layers',
  js: 'js/apiidee.ol.min.js',
  css: 'assets/css/apiidee.ol.min.css',
},
{
  id: 'CS',
  type: 'cesium',
  title: 'Cesium',
  js: 'js/apiidee.cesium.min.js',
  css: 'assets/css/apiidee.cesium.min.css',
}];

const params = window.location.search.split('&');
let center = '';
let zoom = '';
let srs = '';
let layers = '';
let zoomConstrains = '';
let extentConstrains = '';
params.forEach((param) => {
  if (param.indexOf('center') > -1) {
    const values = param.split('=')[1].split(',');
    center = [parseFloat(values[0]), parseFloat(values[1])];
  } else if (param.indexOf('zoomConstrains') > -1) {
    const value = param.split('=')[1];
    zoomConstrains = value;
  } else if (param.indexOf('extentConstrains') > -1) {
    const value = param.split('=')[1];
    extentConstrains = value;
  } else if (param.indexOf('zoom') > -1) {
    const value = param.split('=')[1];
    zoom = parseInt(value, 10);
  } else if (param.indexOf('srs') > -1) {
    const value = param.split('=')[1];
    srs = value;
  } else if (param.indexOf('layers') > -1) {
    let value = param.substring(param.indexOf('=') + 1, param.length);

    let layerGroups = [];
    const regex = /LayerGroup\*.*?!/g;
    if (value.match(regex) !== null) {
      layerGroups = value.match(regex).map((item) => item.slice(0, -1));
      value = value.replace(regex, '');
    }

    layers = value.split(',').filter((item) => item !== '').concat(layerGroups);
  }
});

(function (IDEE) {
  /**
   * Pixels width for mobile devices
   *
   * @private
   * @type {Number}
   */
  IDEE.config('MOBILE_WIDTH', '${mobile.width}');

  /**
   * The api-idee URL
   * @const
   * @type {string}
   * @public
   * @api stable
   */
  IDEE.config('API_IDEE_URL', '${api-idee.url}');

  /**
   * The path to the api-idee proxy to send
   * jsonp requests
   * @const
   * @type {string}
   * @public
   * @api stable
   */
  IDEE.config('PROXY_URL', `${(location.protocol !== 'file' && location.protocol !== 'file:') ? location.protocol : 'https:'}\${api-idee.proxy.url}`);

  /**
   * The path to the api-idee proxy to send
   * jsonp requests
   * @const
   * @type {string}
   * @public
   * @api stable
   */
  IDEE.config('PROXY_POST_URL', `${(location.protocol !== 'file' && location.protocol !== 'file:') ? location.protocol : 'https:'}\${api-idee.proxy_post.url}`);

  /**
   * The static resources URL
   * @const
   * @type {string}
   * @public
   * @api stable
   */
  IDEE.config('STATIC_RESOURCES_URL', '${api-idee.static_resources.url}');

  /**
   * The path to the api-idee theme
   * @const
   * @type {string}
   * @public
   * @api stable
   */
  IDEE.config('THEME_URL', `${(location.protocol !== 'file' && location.protocol !== 'file:') ? location.protocol : 'https:'}\${api-idee.theme.url}`);

  /**
   * Predefined WMC files. It is composed of URL,
   * predefined name and context name.
   * @type {object}
   * @public
   * @api stable
   */
  IDEE.config('predefinedWMC', {
    /**
     * Predefined WMC URLs
     * @const
     * @type {Array<string>}
     * @public
     * @api stable
     */
    'urls': '${wmc.urls}'.split(',').map((e) => e),

    /**
     * WMC predefined names
     * @const
     * @type {Array<string>}
     * @public
     * @api stable
     */
    'predefinedNames': '${wmc.predefinedNames}'.split(','),

    /**
     * WMC context names
     * @const
     * @type {Array<string>}
     * @public
     * @api stable
     */
    'names': '${wmc.names}'.split(','),
  });

  /**
   * The path to the api-idee theme
   * @const
   * @type {string}
   * @public
   * @api stable
   */

  /**
   * TODO
   * @type {object}
   * @public
   * @api stable
   */
  IDEE.config('tileMappgins', {
    /**
     * Predefined WMC URLs
     * @const
     * @type {Array<string>}
     * @public
     * @api stable
     */
    tiledNames: '${tile.mappings.tiledNames}'.split(','),

    /**
     * WMC predefined names
     * @const
     * @type {Array<string>}
     * @public
     * @api stable
     */
    tiledUrls: '${tile.mappings.tiledUrls}'.split(','),

    /**
     * WMC context names
     * @const
     * @type {Array<string>}
     * @public
     * @api stable
     */
    names: '${tile.mappings.names}'.split(','),

    /**
     * WMC context names
     * @const
     * @type {Array<string>}
     * @public
     * @api stable
     */
    urls: '${tile.mappings.urls}'.split(','),
  });

  /**
   * Default projection
   * @const
   * @type {string}
   * @public
   * @api stable
   */
  IDEE.config('DEFAULT_PROJ', '${api-idee.proj.default}');

  /**
   * TMS configuration
   *
   * @private
   * @type {object}
   */
  IDEE.config('baseLayer', '${baseLayer}');

  /**
   * Terrain configuration
   *
   * @private
   * @type {String}
   */
  IDEE.config('terrain', {
    default: '${terrain.default}',
  });

  /**
   * Controls configuration
   *
   * @private
   * @type {object}
   */
  IDEE.config('controls', {
    default: '${controls.default}',
  });

  /**
   * BackgroundLayers Control
   *
   * @private
   * @type {object}
   */
  IDEE.config('backgroundlayers', backgroundlayersOpts);

  /**
   * ImplementationSwitcher Control
   *
   * @private
   * @type {object}
   */
  IDEE.config('implementationswitcher', implementationSwitcherOpts);

  /**
   * URL of sql wasm file
   * @private
   * @type {String}
   */
  IDEE.config('SQL_WASM_URL', `${(location.protocol !== 'file' && location.protocol !== 'file:') ? location.protocol : 'https:'}\${sql_wasm.url}`);

  /**
   * MAP Viewer - Center
   *
   * @private
   * @type {object}
   */
  IDEE.config('MAP_VIEWER_CENTER', center);

  /**
   * MAP Viewer - Zoom
   *
   * @private
   * @type {object}
   */
  IDEE.config('MAP_VIEWER_ZOOM', zoom);

  /**
   * MAP Viewer - Zoom Constrains
   *
   * @private
   * @type {Object}
   */
  IDEE.config('MAP_VIEWER_ZOOM_CONSTRAINS', zoomConstrains);

  /**
   * Map Viewer - Extent constrains
   *
   * @private
   * @type {Object}
   */
  IDEE.config('MAP_VIEWER_EXTENT_CONSTRAINS', extentConstrains);

  /**
   * MAP Viewer - SRS
   *
   * @private
   * @type {object}
   */
  IDEE.config('MAP_VIEWER_SRS', srs);

  /**
   * MAP Viewer - Layers
   *
   * @private
   * @type {object}
   */
  IDEE.config('MAP_VIEWER_LAYERS', layers);

  /**
   * MAP Viewer - DPI (Dots per inch)
   *
   * @private
   * @type {Number}
   */
  IDEE.config('DPI', 72);

  /**
   * MAP Viewer - DPI OGC (Dots per inch for OGC services)
   *
   * @private
   * @type {Number}
   */
  IDEE.config('DPI_OGC', 25.4 / 0.28);

  /**
   * Mueve el mapa cuando se hace clic sobre un objeto
   * geográfico, (extract = true) o no (extract = false)
   *
   * @private
   * @type {object}
   */
  IDEE.config('MOVE_MAP_EXTRACT', true);

  /**
   * Zoom máximo.
   *
   * @public
   * @type {Number | String}
   */
  IDEE.config('MAX_ZOOM', '${maxZoom}');

  /**
   * Zoom mínimo.
   *
   * @public
   * @type {Number | String}
   */
  IDEE.config('MIN_ZOOM', '${minZoom}');

  /**
   * Zoom por defecto.
   *
   * @public
   * @type {Number | String}
   */
  IDEE.config('DEFAULT_ZOOM', '${defaultZoom}');

  /**
   * Activar las resoluciones.
   *
   * @public
   * @type {Boolean}
   */
  IDEE.config('ACTIVATE_RESOLUTIONS', '${activateResolutions}');

  /**
   * Hace el popup y dialog inteligente
   *
   * @private
   * @type {object}
   */
  IDEE.config('POPUP_INTELLIGENCE', {
    activate: true,
    sizes: {
      images: ['120px', '75px'],
      videos: ['500px', '300px'],
      documents: ['500px', '300px'],
      audios: ['250px', '40px'],
    },
  });

  /**
   * Hace el dialog inteligente
   *
   * @private
   * @type {object}
   */
  IDEE.config('DIALOG_INTELLIGENCE', {
    activate: true,
    sizes: {
      images: ['120px', '75px'],
      videos: ['500px', '300px'],
      documents: ['500px', '300px'],
      audios: ['250px', '40px'],
    },
  });

  /**
   * Determina el nivel de zoom cuando se usa el control location.
   * @public
   * @type {Number}
   */
  IDEE.config('ZOOM_LOCATION', '${zoomLocation}');
  window.M = IDEE;
}(window.IDEE));
