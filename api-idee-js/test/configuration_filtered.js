const backgroundlayersIds = 'mapa,imagen,hibrido'.split(',');
const backgroundlayersTitles = 'Mapa,Imagen,Hibrido'.split(',');
const backgroundlayersLayers = 'QUICK*Base_IGNBaseTodo_TMS,QUICK*BASE_PNOA_MA_TMS,QUICK*BASE_HIBRIDO_LayerGroup'.split(',');
const backgroundlayersOpts = backgroundlayersIds.map((id, index) => {
  return {
    id,
    title: backgroundlayersTitles[index],
    layers: backgroundlayersLayers[index].split('+'),
  };
});

const implementationSwitcherOpts = [{
  id: 'OL',
  type: 'ol',
  title: 'Open Layers',
  js: '../../../dist/js/apiidee.ol.min.js',
  css: '../../../dist/assets/css/apiidee.ol.min.css',
},
{
  id: 'CS',
  type: 'cesium',
  title: 'Cesium',
  js: '../../../dist/js/apiidee.cesium.min.js',
  css: '../../../dist/assets/css/apiidee.cesium.min.css',
}];

const config = (configKey, configValue) => {
  config[configKey] = configValue;
};

if (!window.IDEE) {
  const IDEE = {};
  window.IDEE = IDEE;
  window.M = IDEE;
}
IDEE.config = config;

function fun(IDEE_) {
  /**
   * Pixels width for mobile devices
   *
   * @private
   * @type {Number}
   */
  IDEE_.config('MOBILE_WIDTH', 768);

  /**
   * The API IDEE URL
   * @const
   * @type {string}
   * @public
   * @api stable
   */
  IDEE_.config('API_IDEE_URL', 'https://componentes-desarrollo.idee.es/api-idee/');

  /**
   * The path to the API-IDEE proxy to send
   * jsonp requests
   * @const
   * @type {string}
   * @public
   * @api stable
   */
  IDEE_.config('PROXY_URL', `${location.protocol}//componentes-desarrollo.idee.es/api-idee/api/proxy`);

  /**
   * The path to the API-IDEE proxy to send
   * jsonp requests
   * @const
   * @type {string}
   * @public
   * @api stable
   */
  IDEE_.config('PROXY_POST_URL', `${location.protocol}//componentes-desarrollo.idee.es/api-idee/proxyPost`);

  /**
   * The path to the API IDEE theme
   * @const
   * @type {string}
   * @public
   * @api stable
   */
  IDEE_.config('THEME_URL', `${location.protocol}//componentes-desarrollo.idee.es/api-idee/assets/`);

  /**
   * TODO
   * @type {object}
   * @public
   * @api stable
   */
  IDEE_.config('tileMappgins', {
    /**
     * Predefined WMC URLs
     * @const
     * @type {Array<string>}
     * @public
     * @api stable
     */
    tiledNames: 'base,SPOT_Andalucia,orto_2010-11_25830,CallejeroCompleto,orto_2010-11_23030'.split(','),

    /**
     * WMC predefined names
     * @const
     * @type {Array<string>}
     * @public
     * @api stable
     */
    tiledUrls: 'http://www.callejerodeandalucia.es/servicios/base/gwc/service/wms?,http://www.callejerodeandalucia.es/servicios/base/gwc/service/wms?,http://www.ideandalucia.es/geowebcache/service/wms?,http://www.juntadeandalucia.es/servicios/mapas/callejero/wms-tiled?,http://www.ideandalucia.es/geowebcache/service/wms?'.split(','),

    /**
     * WMC context names
     * @const
     * @type {Array<string>}
     * @public
     * @api stable
     */
    names: 'CDAU_base,mosaico_spot_2005,orto_2010-11,CallejeroCompleto,orto_2010-11'.split(','),

    /**
     * WMC context names
     * @const
     * @type {Array<string>}
     * @public
     * @api stable
     */
    urls: 'http://www.callejerodeandalucia.es/servicios/base/wms?,http://www.juntadeandalucia.es/medioambiente/mapwms/REDIAM_SPOT_Andalucia_2005?,http://www.ideandalucia.es/wms/ortofoto2010?,http://www.juntadeandalucia.es/servicios/mapas/callejero/wms?,http://www.ideandalucia.es/wms/ortofoto2010?'.split(','),
  });

  /**
   * Default projection
   * @const
   * @type {string}
   * @public
   * @api stable
   */
  IDEE_.config('DEFAULT_PROJ', 'EPSG:3857*m');

  /**
   * Predefined WMC files. It is composed of URL,
   * predefined name and context name.
   * @type {object}
   * @public
   * @api stable
   */
  IDEE_.config('panels', {
    /**
     * TODO
     * @const
     * @type {Array<string>}
     * @public
     * @api stable
     */
    TOOLS: 'measurebar,getfeatureinfo'.split(','),
  });

  /**
   * WMTS configuration
   *
   * @private
   * @type {object}
   */
  IDEE_.config('baseLayer', 'QUICK*Base_IGNBaseTodo_TMS');

  /**
   * Terrain configuration
   *
   * @private
   * @type {object}
   */
  IDEE_.config('terrain', {
    default: 'QUICK*MDT_TERRAIN',
  });

  /**
   * BackgroundLayers Control
   *
   * @private
   * @type {object}
   */
  IDEE_.config('backgroundlayers', backgroundlayersOpts);

    /**
   * ImplementationSwitcher Control
   *
   * @private
   * @type {object}
   */
  IDEE_.config('implementationswitcher', implementationSwitcherOpts);

  /**
   * Attributions configuration
   *
   * @private
   * @type {object}
   */
  IDEE_.config('attributions', {
    defaultAttribution: 'Instituto Geográfico Nacional',
    defaultURL: 'https://www.ign.es/',
    url: 'https://componentes-desarrollo.idee.es/api-idee/files/attributions/WMTS_PNOA_20170220/atribucionPNOA_Url.kml',
    type: 'kml',
  });

  /**
   * Controls configuration
   *
   * @private
   * @type {object}
   */
  IDEE_.config('controls', {
    default: '',
  });

  /**
   * URL of sql wasm file
   * @private
   * @type {String}
   */
  IDEE_.config('SQL_WASM_URL', '../../../../node_modules/sql.js/dist/');

  /**
   * Mueve el mapa cuando se hace clic sobre un objeto
   * geográfico, (extract = true) o no (extract = false)
   *
   * @private
   * @type {object}
   */
  IDEE_.config('MOVE_MAP_EXTRACT', false);

  /**
   * Hace el popup inteligente
   *
   * @private
   * @type {object}
   */
  IDEE_.config('POPUP_INTELLIGENCE', {
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
}

fun(window.IDEE);
