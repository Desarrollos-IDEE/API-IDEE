/**
 * IGN API
 * Version ${pom.version}
 * Date ${build.timestamp}
 */

const backgroundlayersIds = '${backgroundlayers.ids}'.split(',');
const backgroundlayersTitles = '${backgroundlayers.titles}'.split(',');
const backgroundlayersLayers = '${backgroundlayers.layers}'.split(',');
const backgroundlayersOpts = backgroundlayersIds.map((id, index) => {
  return {
    id,
    title: backgroundlayersTitles[index],
    layers: backgroundlayersLayers[index].split('+'),
  };
});

(function(M) {
  /**
   * Pixels width for mobile devices
   *
   * @private
   * @type {Number}
   */
  M.config('MOBILE_WIDTH', '${mobile.width}');

  /**
   * The Mapea URL
   * @const
   * @type {string}
   * @public
   * @api stable
   */
  M.config('MAPEA_URL', '${mapea.url}');

  /**
   * The path to the Mapea proxy to send
   * jsonp requests
   * @const
   * @type {string}
   * @public
   * @api stable
   */
  M.config('PROXY_URL', location.protocol + '${mapea.proxy.url}');

  /**
   * The path to the Mapea proxy to send
   * jsonp requests
   * @const
   * @type {string}
   * @public
   * @api stable
   */
  M.config('PROXY_POST_URL', location.protocol + '${mapea.proxy_post.url}');

  /**
   * The path to the Mapea templates
   * @const
   * @type {string}
   * @public
   * @api stable
   */
  M.config('TEMPLATES_PATH', '${mapea.templates.path}');

  /**
   * The path to the Mapea theme
   * @const
   * @type {string}
   * @public
   * @api stable
   */
  M.config('THEME_URL', location.protocol + '${mapea.theme.url}');

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
    'tiledNames': '${tile.mappings.tiledNames}'.split(','),

    /**
     * WMC predefined names
     * @const
     * @type {Array<string>}
     * @public
     * @api stable
     */
    'tiledUrls': '${tile.mappings.tiledUrls}'.split(','),

    /**
     * WMC context names
     * @const
     * @type {Array<string>}
     * @public
     * @api stable
     */
    'names': '${tile.mappings.names}'.split(','),

    /**
     * WMC context names
     * @const
     * @type {Array<string>}
     * @public
     * @api stable
     */
    'urls': '${tile.mappings.urls}'.split(',')
  });

  /**
   * Default projection
   * @const
   * @type {string}
   * @public
   * @api stable
   */
  M.config('DEFAULT_PROJ', '${mapea.proj.default}');

  /**
   * Default projection
   * @const
   * @type {string}
   * @public
   * @api stable
   */
  M.config('GEOPRINT_URL', '${geoprint.url}');

  /**
   * Default projection
   * @const
   * @type {string}
   * @public
   * @api stable
   */
  M.config('GEOREFIMAGE_TEMPLATE', '${geoprint.url}' + '${georefimage.template}');

  /**
   * Default projection
   * @const
   * @type {string}
   * @public
   * @api stable
   */
  M.config('PRINTERMAP_TEMPLATE', '${geoprint.url}' + '${printermap.template}');

  /**
   * Default projection
   * @const
   * @type {string}
   * @public
   * @api stable
   */
  M.config('GEOPRINT_STATUS', '${geoprint.url}' + '${geoprint.status}');

  /**
   * WMTS configuration
   *
   * @private
   * @type {object}
   */
  M.config('wmts', {
    base: '${wmts.base}',
  });

  /**
   * Controls configuration
   *
   * @private
   * @type {object}
   */
  M.config('controls', {
    default: '${controls.default}',
  });

  /**
   * Attributions configuration
   *
   * @private
   * @type {object}
   */
  M.config('attributions', {
    defaultAttribution: '${attributions.defaultAttribution}',
    defaultURL: '${attributions.defaultURL}',
    url: '${attributions.url}',
    type: '${attributions.type}',
  });

  /**
   * BackgroundLayers Control
   *
   * @private
   * @type {object}
   */
  M.config('backgroundlayers', backgroundlayersOpts);

  /**
   * IGNSearch List Control
   *
   * @private
   * @type {object}
   */
   M.config('IGNSEARCH_TYPES_CONFIGURATION', [
     // 'Comunidad aut�noma',
     // 'Ciudad con estatuto de autonom�a',
     // 'Provincia',
     // 'Municipio',
     // 'EATIM',
     'Isla administrativa',
     'Comarca administrativa',
     'Jurisdicci�n',
     // 'Capital de Estado',
     // 'Capital de comunidad aut�noma y ciudad con estatuto de autonom�a',
     // 'Capital de provincia',
     // 'Capital de municipio',
     // 'Capital de EATIM',
     // 'Entidad colectiva',
     // 'Entidad menor de poblaci�n',
     'Distrito municipal',
     // 'Barrio',
     // 'Entidad singular',
     'Construcci�n/instalaci�n abierta',
     'Edificaci�n',
     'V�rtice Geod�sico',
     // 'Hitos de demarcaci�n territorial',
     // 'Hitos en v�as de comunicaci�n',
     'Alineaci�n monta�osa',
     'Monta�a',
     'Paso de monta�a',
     'Llanura',
     'Depresi�n',
     'Vertientes',
     'Comarca geogr�fica',
     'Paraje',
     'Elemento puntual del paisaje',
     'Saliente costero',
     'Playa',
     'Isla',
     'Otro relieve costero',
     // 'Parque Nacional y Natural',
     'Espacio protegido restante',
     // 'Aeropuerto',
     // 'Aer�dromo',
     // 'Pista de aviaci�n y helipuerto',
     // 'Puerto de Estado',
     'Instalaci�n portuaria',
     // 'Carretera',
     'Camino y v�a pecuaria',
     // 'V�a urbana',
     // 'Ferrocarril',
     'Curso natural de agua',
     'Masa de agua',
     'Curso artificial de agua',
     'Embalse',
     'Hidr�nimo puntual',
     'Glaciares',
     'Mar',
     'Entrante costero y estrecho mar�timo',
     'Relieve submarino',
   ]);
})(window.M);
