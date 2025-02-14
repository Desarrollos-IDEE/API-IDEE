/**
 * IGN API
 * Version 4.9.0
 * Date 03-07-2024
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
    'QUICK*BASE_PNOA_MA_TMS',
    'QUICK*BASE_IGNBaseOrto_TMS',
  ],
},
];

const params = window.location.search.split('&');
let center = '';
let zoom = '';
let srs = '';
let layers = '';
params.forEach((param) => {
  if (param.indexOf('center') > -1) {
    const values = param.split('=')[1].split(',');
    center = [parseFloat(values[0]), parseFloat(values[1])];
  } else if (param.indexOf('zoom') > -1) {
    const value = param.split('=')[1];
    zoom = parseInt(value, 10);
  } else if (param.indexOf('srs') > -1) {
    const value = param.split('=')[1];
    srs = value;
  } else if (param.indexOf('layers') > -1) {
    const value = param.substring(param.indexOf('=') + 1, param.length);
    layers = value.split(',');
  }
});

(function (M) {
  /**
   * Pixels width for mobile devices
   *
   * @private
   * @type {Number}
   */
  M.config('MOBILE_WIDTH', '768');

  /**
   * The Mapea URL
   * @const
   * @type {string}
   * @public
   * @api stable
   */
  M.config('MAPEA_URL', 'https://componentes.cnig.es/api-core/');

  /**
   * The path to the Mapea proxy to send
   * jsonp requests
   * @const
   * @type {string}
   * @public
   * @api stable
   */
  M.config('PROXY_URL', `${(location.protocol !== 'file' && location.protocol !== 'file:') ? location.protocol : 'https:'}\//componentes.cnig.es/api-core/api/proxy`);

  /**
   * The path to the Mapea proxy to send
   * jsonp requests
   * @const
   * @type {string}
   * @public
   * @api stable
   */
  M.config('PROXY_POST_URL', `${(location.protocol !== 'file' && location.protocol !== 'file:') ? location.protocol : 'https:'}\//componentes.cnig.es/api-core/proxyPost`);

  /**
   * The path to the Mapea templates
   * @const
   * @type {string}
   * @public
   * @api stable
   */
  M.config('TEMPLATES_PATH', '/files/templates/');

  /**
   * The path to the Mapea theme
   * @const
   * @type {string}
   * @public
   * @api stable
   */
  M.config('THEME_URL', `${(location.protocol !== 'file' && location.protocol !== 'file:') ? location.protocol : 'https:'}\//componentes.cnig.es/api-core/assets/`);

  /**
   * The path to the Mapea theme
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
  M.config('tileMappgins', {
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
  M.config('DEFAULT_PROJ', 'EPSG:3857*m');

  /**
   * TMS configuration
   *
   * @private
   * @type {object}
   */
  M.config('tms', {
    base: 'QUICK*Base_IGNBaseTodo_TMS',
  });

  /**
   * Controls configuration
   *
   * @private
   * @type {object}
   */
  M.config('controls', {
    default: '',
  });

  /**
   * BackgroundLayers Control
   *
   * @private
   * @type {object}
   */
  M.config('backgroundlayers', backgroundlayersOpts);

  /**
   * URL of sql wasm file
   * @private
   * @type {String}
   */
  M.config('SQL_WASM_URL', `${(location.protocol !== 'file' && location.protocol !== 'file:') ? location.protocol : 'https:'}\//componentes.cnig.es/api-core/wasm/`);

  /**
   * MAP Viewer - Center
   *
   * @private
   * @type {object}
   */
  M.config('MAP_VIEWER_CENTER', center);

  /**
   * MAP Viewer - Zoom
   *
   * @private
   * @type {object}
   */
  M.config('MAP_VIEWER_ZOOM', zoom);

  /**
   * MAP Viewer - SRS
   *
   * @private
   * @type {object}
   */
  M.config('MAP_VIEWER_SRS', srs);

  /**
   * MAP Viewer - Layers
   *
   * @private
   * @type {object}
   */
  M.config('MAP_VIEWER_LAYERS', layers);

  /**
   * Mueve el mapa cuando se hace clic sobre un objeto
   * geográfico, (extract = true) o no (extract = false)
   *
   * @private
   * @type {object}
   */
  M.config('MOVE_MAP_EXTRACT', true);
}(window.M));
