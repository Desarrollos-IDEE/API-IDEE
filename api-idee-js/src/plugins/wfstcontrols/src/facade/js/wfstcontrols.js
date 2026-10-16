/**
 * @module IDEE/plugin/WFSTControls
 */
import api from '../../api';
import myhelp from '../../templates/myhelp.html';
import '../assets/css/fonts';
import '../assets/css/wfstcontrols';
import ClearFeature from './clearfeature';
import DeleteFeature from './deletefeature';
import DrawFeature from './drawfeature';
import EditAttribute from './editattribute';
import en from './i18n/en';
import es from './i18n/es';
import { getValue } from './i18n/language';
import ModifyFeature from './modifyfeature';
import SaveFeature from './savefeature';

const DEFAULT_FEATURES = [
  'drawfeature',
  'modifyfeature',
  'deletefeature',
  'editattribute',
];

const normalizePosition = (position) => {
  const validPositions = [
    'left',
    'right',
    'down',
    'center-top-left',
    'center-top-right',
    'center-bottom-left',
    'center-bottom-right',
  ];

  if (validPositions.includes(position)) {
    return position;
  }

  // Compatibilidad con posiciones v1.
  const legacyPositions = {
    TL: 'center-top-left',
    TR: 'center-top-right',
    BL: 'center-bottom-left',
    BR: 'center-bottom-right',
  };

  return legacyPositions[position] || 'center-top-left';
};

const parseBoolean = (value, defaultValue) => {
  if (value === true || value === 'true') {
    return true;
  }

  if (value === false || value === 'false') {
    return false;
  }

  return defaultValue;
};

const normalizeOptions = (
  options,
  layername,
  geometry,
  proxyStatus,
  proxyDisable,
) => {
  /*
   * Compatibilidad con la antigua firma:
   *
   * new WFSTControls(
   *   [controls],
   *   layername,
   *   geometry,
   *   proxyStatus,
   *   proxyDisable
   * )
   */
  if (Array.isArray(options)) {
    return {
      features: options.join(','),
      layername,
      geometry,
      proxy: {
        status: proxyStatus,
        disable: proxyDisable,
      },
    };
  }

  if (
    !IDEE.utils.isNullOrEmpty(options)
    && typeof options === 'object'
  ) {
    return {
      ...options,
    };
  }

  return {};
};

/**
 * @classdesc
 * Plugin de edición transaccional WFST.
 *
 * @extends {IDEE.Plugin}
 */
export default class WFSTControls extends IDEE.Plugin {
  /**
   * @constructor
   * @param {Object|Array} options opciones del plugin
   * @param {string} layername nombre de capa en firma legacy
   * @param {string} geometry geometría en firma legacy
   * @param {boolean} proxyStatus estado de proxy en firma legacy
   * @param {boolean} proxyDisable desactivación de proxy en firma legacy
   * @api stable
   */
  constructor(
    options,
    layername,
    geometry,
    proxyStatus,
    proxyDisable,
  ) {
    const pluginOptions = normalizeOptions(
      options,
      layername,
      geometry,
      proxyStatus,
      proxyDisable,
    );

    const position = normalizePosition(
      pluginOptions.position,
    );

    const tooltip = pluginOptions.tooltip
      || getValue('tooltip');

    super('wfstcontrols', {
      position,
      tooltip,
      order: pluginOptions.order,
    });

    /**
     * Opciones normalizadas del plugin.
     * Se rellenan al final del constructor.
     *
     * @private
     * @type {Object}
     */
    this.options = {};

    /**
     * Mapa.
     *
     * @private
     * @type {IDEE.Map}
     */
    this.map = null;

    /**
     * Controles de edición.
     *
     * @private
     * @type {Array<IDEE.Control>}
     */
    this.controls = [];

    /**
     * Herramientas solicitadas.
     *
     * @private
     * @type {Array<string>}
     */
    let configuredFeatures = pluginOptions.features;

    if (
      IDEE.utils.isNullOrEmpty(
        configuredFeatures,
      )
    ) {
      configuredFeatures = DEFAULT_FEATURES;
    }

    if (!Array.isArray(configuredFeatures)) {
      configuredFeatures = String(
        configuredFeatures,
      ).split(',');
    }

    this.features = configuredFeatures
      .map(
        (feature) => String(feature)
          .trim()
          .toLowerCase(),
      )
      .filter(
        (feature) => feature.length > 0,
      );

    /**
     * Tipo de geometría.
     *
     * @private
     * @type {string|null}
     */
    this.geometry = pluginOptions.geometry || null;

    /**
     * Nombre de capa WFS.
     *
     * @private
     * @type {string|null}
     */
    this.layername = pluginOptions.layername || null;

    /**
     * Configuración proxy.
     *
     * Se mantiene por compatibilidad
     * funcional del plugin.
     *
     * @private
     * @type {Object}
     */
    const proxyOptions = pluginOptions.proxy || {};

    const statusValue = !IDEE.utils.isUndefined(
      pluginOptions.proxyStatus,
    )
      ? pluginOptions.proxyStatus
      : proxyOptions.status;

    const disableValue = !IDEE.utils.isUndefined(
      pluginOptions.proxyDisable,
    )
      ? pluginOptions.proxyDisable
      : proxyOptions.disable;

    this.proxy = {
      status: parseBoolean(
        statusValue,
        true,
      ),

      disable: parseBoolean(
        disableValue,
        false,
      ),
    };

    /**
     * Clase CSS del panel.
     *
     * @private
     * @type {string}
     */
    this.className = 'm-plugin-wfstcontrols';
    if (!IDEE.utils.isNullOrEmpty(pluginOptions.className)) {
      this.className = `${this.className} ${pluginOptions.className}`;
    }

    /**
     * Estado inicial del panel.
     *
     * @private
     * @type {boolean}
     */
    this.collapsed = IDEE.utils.isBoolean(
      pluginOptions.collapsed,
    )
      ? pluginOptions.collapsed
      : true;

    /**
     * Icono del CollapsiblePanel.
     *
     * @private
     * @type {string}
     */
    this.collapsedButtonClass = 'g-cartografia-btn-wfstcontrols-main';
    if (!IDEE.utils.isNullOrEmpty(pluginOptions.collapsedButtonClass)) {
      this.collapsedButtonClass = pluginOptions.collapsedButtonClass;
    }

    /**
     * Panel de controles.
     *
     * @private
     * @type {IDEE.ui.panels.CollapsiblePanel|null}
     */
    this.panel = null;

    /**
     * Número total de controles.
     *
     * @private
     * @type {number}
     */
    this.numControls = 0;

    /**
     * Controles cargados.
     *
     * @private
     * @type {number}
     */
    this.numLoadControls = 0;

    /**
     * Controles concretos.
     *
     * @private
     */
    this.drawfeature = null;
    this.modifyfeature = null;
    this.deletefeature = null;
    this.clearfeature = null;
    this.savefeature = null;
    this.editattribute = null;

    /**
     * Metadata.
     *
     * @private
     */
    this.metadata = api.metadata;

    this.separatorApiJson = api.url.separator;

    /*
     * Conservamos los parámetros v2
     * normalizados para getAPIRestBase64().
     */
    this.options = {
      ...pluginOptions,

      position:
        this.position,

      collapsed:
        this.collapsed,

      order:
        this.order,

      tooltip:
        this.tooltip,

      features:
        this.features.join(','),

      layername:
        this.layername,

      geometry:
        this.geometry,

      proxy:
        this.proxy,

      className:
        this.className,

      collapsedButtonClass:
        this.collapsedButtonClass,
    };
  }

  /**
   * Añade el plugin al mapa.
   *
   * @public
   * @function
   * @param {IDEE.Map} map mapa
   * @api stable
   */
  addTo(map) {
    this.map = map;

    const firstLayer = this.map.getWFS()[0];

    const firstNamedLayer = IDEE.utils.isNullOrEmpty(
      this.layername,
    )
      ? null
      : this.map.getWFS({
        name: this.layername,
      })[0];

    const wfslayer = IDEE.utils.isNullOrEmpty(
      firstNamedLayer,
    )
      ? firstLayer
      : firstNamedLayer;

    if (
      IDEE.utils.isNullOrEmpty(
        wfslayer,
      )
    ) {
      IDEE.dialog.error(
        getValue(
          'exception.WFSlayernotfound',
        ),
      );

      return;
    }

    this.configureGeometry_(
      wfslayer,
    );

    this.createControls_(
      wfslayer,
    );

    /*
     * WFSTControls es una barra compacta
     * de herramientas.
     *
     * No debe utilizar PluginSidePanel.
     *
     * En v2 se monta como CollapsiblePanel,
     * igual que otros grupos de controles.
     */
    this.panel = new IDEE.ui.panels.CollapsiblePanel(
      this.name,
      {
        collapsed:
            this.collapsed,

        collapsible:
            true,

        position:
            this.position,

        className:
            this.className,

        tooltip:
            this.tooltip,

        order:
            this.order,

        collapsedButtonClass:
            this.collapsedButtonClass,

        openedButtonClass:
            this.collapsedButtonClass,
      },
    );

    /*
     * Los controles conocen el panel
     * al que pertenecen.
     */
    this.controls.forEach(
      (control) => {
        control.setPanel(
          this.panel,
        );
      },
    );

    /*
     * Añadimos los controles al panel.
     */
    this.panel.addControls(
      this.controls,
    );

    /*
     * IMPORTANTE:
     *
     * Al tratarse de CollapsiblePanel
     * se utiliza addControlPanels().
     */
    map.addControlPanels(
      this.panel,
    );

    this.panel.on(
      IDEE.evt.ADDED_TO_MAP,
      (html) => {
        IDEE.utils.enableTouchScroll(
          html,
        );

        this.fire(
          IDEE.evt.ADDED_TO_MAP,
        );
      },
    );

    /*
     * Compatibilidad con código legacy
     * que consulta map.panel.EDITION.
     */
    if (this.map.panel) {
      this.map.panel.EDITION = this.panel;
    }
  }

  /**
   * Configura o detecta la geometría
   * de la capa.
   *
   * @private
   * @function
   * @param {IDEE.layer.WFS} wfslayer capa WFS
   */
  configureGeometry_(wfslayer) {
    /*
     * Si la geometría viene definida
     * por parámetro, la utilizamos.
     */
    if (
      !IDEE.utils.isNullOrEmpty(
        this.geometry,
      )
    ) {
      try {
        Object.assign(
          wfslayer,
          {
            geometry:
              this.geometry,
          },
        );
      } catch (error) {
        IDEE.dialog.error(
          getValue(
            'exception.errorloadingplugin',
          ),
        );
      }

      return;
    }

    let geomChanged = false;

    const tryParseGeometry = () => {
      if (
        IDEE.utils.isNullOrEmpty(
          wfslayer,
        )
        || !IDEE.utils.isNullOrEmpty(
          wfslayer.geometry,
        )
        || !wfslayer.getFeatures
        || wfslayer.getFeatures()
          .length === 0
      ) {
        return false;
      }

      const replacements = {
        MultiPolygon:
          'MPOLYGON',

        MultiPoint:
          'MPOINT',

        Polygon:
          'POLYGON',

        Point:
          'POINT',

        LineString:
          'LINE',

        MultiLineString:
          'MLINE',
      };

      try {
        const geom = wfslayer.getGeometryType();

        if (
          IDEE.utils.isNullOrEmpty(
            geom,
          )
        ) {
          throw new Error(
            'getGeometryType returned no value',
          );
        }

        Object.assign(
          wfslayer,
          {
            geometry:
              replacements[geom]
              || geom,
          },
        );

        return true;
      } catch (error) {
        IDEE.dialog.error(
          getValue(
            'exception.errorgeometryparameter',
          ),
        );

        return false;
      }
    };

    geomChanged = tryParseGeometry();

    wfslayer.on(
      IDEE.evt.LOAD,
      () => {
        if (!geomChanged) {
          geomChanged = tryParseGeometry();
        }
      },
    );
  }

  /**
   * Crea los controles configurados.
   *
   * @private
   * @function
   * @param {IDEE.layer.WFS} wfslayer capa WFS
   */
  createControls_(wfslayer) {
    this.controls = [];

    let addSave = false;
    let addClear = false;
    let controlOrder = 0;

    const baseOptions = (tooltip) => {
      controlOrder += 1;

      return {
        layer:
            wfslayer,

        tooltip,

        position:
            this.position,

        order:
            controlOrder,
      };
    };

    this.features.forEach(
      (featureName) => {
        if (
          featureName
          === 'drawfeature'
        ) {
          this.drawfeature = new DrawFeature(
            baseOptions(
              getValue('draw'),
            ),
          );

          this.controls.push(
            this.drawfeature,
          );

          addSave = true;
          addClear = true;
        } else if (
          featureName
          === 'modifyfeature'
        ) {
          this.modifyfeature = new ModifyFeature(
            baseOptions(
              getValue('modify'),
            ),
          );

          this.controls.push(
            this.modifyfeature,
          );

          addSave = true;
          addClear = true;
        } else if (
          featureName
          === 'deletefeature'
        ) {
          this.deletefeature = new DeleteFeature(
            baseOptions(
              getValue('delete'),
            ),
          );

          this.controls.push(
            this.deletefeature,
          );

          addSave = true;
          addClear = true;
        } else if (
          featureName
          === 'editattribute'
        ) {
          this.editattribute = new EditAttribute(
            baseOptions(
              getValue('edit'),
            ),
          );

          this.controls.push(
            this.editattribute,
          );

          addClear = true;
        } else if (
          featureName
          === 'savefeature'
        ) {
          addSave = true;
        } else if (
          featureName
          === 'clearfeature'
        ) {
          addClear = true;
        }
      },
    );

    /*
     * Guardar se añade automáticamente
     * cuando alguna herramienta modifica
     * geometrías.
     */
    if (addSave) {
      this.savefeature = new SaveFeature({
        ...baseOptions(
          getValue('save'),
        ),

        proxy:
            this.proxy,
      });

      this.controls.push(
        this.savefeature,
      );
    }

    /*
     * Limpiar se añade cuando existen
     * herramientas que pueden dejar
     * cambios temporales.
     */
    if (addClear) {
      this.clearfeature = new ClearFeature(
        baseOptions(
          getValue('clear'),
        ),
      );

      this.controls.push(
        this.clearfeature,
      );
    }

    this.numControls = this.controls.length;

    this.numLoadControls = 0;
  }

  /**
   * Propaga ADDED_TO_MAP cuando todos
   * los controles internos han sido añadidos.
   *
   * @public
   * @function
   * @api stable
   */
  checkAddControlsToMap() {
    this.numLoadControls += 1;

    if (
      this.numLoadControls
      === this.numControls
    ) {
      this.fire(
        IDEE.evt.ADDED_TO_MAP,
      );
    }
  }

  /**
   * Devuelve los controles del plugin.
   *
   * @public
   * @function
   * @returns {Array<IDEE.Control>} controles
   * @api stable
   */
  getControls() {
    return this.controls;
  }

  /**
   * Devuelve la geometría configurada.
   *
   * @public
   * @function
   * @returns {string|null} geometría
   * @api stable
   */
  getGeometry() {
    return this.geometry;
  }

  /**
   * Devuelve el panel.
   *
   * @public
   * @function
   * @returns {IDEE.ui.panels.CollapsiblePanel} panel
   * @api stable
   */
  getPanel() {
    return this.panel;
  }

  /**
   * Destruye el plugin.
   *
   * @public
   * @function
   * @api stable
   */
  destroy() {
    if (this.map) {
      /*
       * Primero eliminamos la referencia
       * al panel en cada control.
       */
      this.controls.forEach(
        (control) => {
          control.setPanel(null);
        },
      );

      /*
       * Eliminamos controles.
       */
      if (
        this.controls.length > 0
      ) {
        this.map.removeControls(
          this.controls,
        );
      }

      /*
       * Eliminamos el panel.
       *
       * Algunas versiones de API-IDEE
       * exponen destroy() directamente
       * sobre CollapsiblePanel.
       */
      if (this.panel) {
        if (
          IDEE.utils.isFunction(
            this.panel.destroy,
          )
        ) {
          this.panel.destroy();
        }

        /*
         * Compatibilidad con versiones
         * que mantienen el panel en
         * map.panels.
         */
        if (
          Array.isArray(
            this.map.panels,
          )
        ) {
          const panel = this.panel;

          this.map.panels = this.map.panels.filter(
            (item) => {
              if (
                panel.equals
                  && IDEE.utils.isFunction(
                    panel.equals,
                  )
              ) {
                return !panel.equals(
                  item,
                );
              }

              return item !== panel;
            },
          );
        }
      }

      if (
        this.map.panel
        && this.map.panel.EDITION
        === this.panel
      ) {
        this.map.panel.EDITION = null;
      }
    }

    this.map = null;

    this.controls = [];

    this.panel = null;

    this.numControls = 0;
    this.numLoadControls = 0;

    this.drawfeature = null;
    this.modifyfeature = null;
    this.deletefeature = null;
    this.clearfeature = null;
    this.savefeature = null;
    this.editattribute = null;
  }

  /**
   * Cambia la capa WFS utilizada
   * por los controles.
   *
   * @public
   * @function
   * @param {string} layername nombre de capa
   * @api stable
   */
  setLayer(layername) {
    this.layername = layername;

    if (
      IDEE.utils.isNullOrEmpty(
        this.map,
      )
    ) {
      return;
    }

    const wfslayer = this.map.getWFS({
      name: this.layername,
    })[0];

    if (
      IDEE.utils.isNullOrEmpty(
        wfslayer,
      )
    ) {
      IDEE.dialog.error(
        `${getValue(
          'exception.noloadedWFSlayer',
        )}<b>${layername}</b>${
          getValue(
            'exception.noloadedWFSlayer1',
          )
        }.`,
      );

      return;
    }

    if (
      !IDEE.utils.isNullOrEmpty(
        this.clearfeature,
      )
    ) {
      this.clearfeature
        .getImpl()
        .clear();
    }

    this.controls.forEach(
      (control) => {
        if (
          IDEE.utils.isFunction(
            control.setLayer,
          )
        ) {
          control.setLayer(
            wfslayer,
          );
        }
      },
    );
  }

  /**
   * Compara plugins.
   *
   * @public
   * @function
   * @param {IDEE.Plugin} plugin plugin
   * @returns {boolean} resultado
   * @api stable
   */
  equals(plugin) {
    return (
      plugin
      instanceof WFSTControls
    );
  }

  /**
   * Devuelve los parámetros API REST v2.
   *
   * Orden:
   *
   * position
   * collapsed
   * order
   * tooltip
   * features
   * layername
   * geometry
   * proxyStatus
   * proxyDisable
   *
   * @public
   * @function
   * @returns {string} cadena REST
   * @api stable
   */
  getAPIRest() {
    const separator = this.separatorApiJson;

    const order = IDEE.utils.isNullOrEmpty(
      this.order,
    )
      ? ''
      : this.order;

    const layername = IDEE.utils.isNullOrEmpty(
      this.layername,
    )
      ? ''
      : this.layername;

    const geometry = IDEE.utils.isNullOrEmpty(
      this.geometry,
    )
      ? ''
      : this.geometry;

    return `${this.name}=${this.position}${separator}${this.collapsed}${separator}${order}${separator}${this.tooltip}${separator}${this.features.join(',')}${separator}${layername}${separator}${geometry}${separator}${this.proxy.status}${separator}${this.proxy.disable}`;
  }

  /**
   * Devuelve la configuración REST Base64.
   *
   * @public
   * @function
   * @returns {string} cadena Base64
   * @api stable
   */
  getAPIRestBase64() {
    return `${this.name}=base64=${IDEE.utils.encodeBase64(this.options)}`;
  }

  /**
   * Devuelve metadata.
   *
   * @public
   * @function
   * @returns {Object} metadata
   * @api stable
   */
  getMetadata() {
    return this.metadata;
  }

  /**
   * Traducciones.
   *
   * @public
   * @function
   * @param {string} lang idioma
   * @returns {Object} traducciones
   * @api stable
   */
  static getJSONTranslations(lang) {
    if (
      lang === 'en'
      || lang === 'es'
    ) {
      return lang === 'en'
        ? en
        : es;
    }

    return IDEE.language
      .getTranslation(lang)
      .wfstcontrols;
  }

  /**
   * Ayuda del plugin.
   *
   * @public
   * @function
   * @returns {Object} ayuda
   * @api stable
   */
  getHelp() {
    // eslint-disable-next-line global-require, import/no-dynamic-require
    const imageHelp01 = require(`assets/images/${this.getMetadata().version}/help-01.png`);
    // eslint-disable-next-line global-require, import/no-dynamic-require
    const imageHelp02 = require(`assets/images/${this.getMetadata().version}/help-02.png`);

    return {
      title:
        getValue(
          'textHelp.squemaTitle',
        ),

      content:
        new Promise(
          (resolve) => {
            const html = IDEE.template.compileSync(
              myhelp,
              {
                vars: {
                  title:
                      getValue(
                        'textHelp.title',
                      ),

                  iconUrl:
                      'https://componentes.idee.es/estaticos/Simbologia/svg/icons_cota/icn_editarGeo.svg',

                  imageHelp01,
                  imageHelp02,

                  translations: {
                    paragraph1:
                        getValue(
                          'textHelp.paragraph1',
                        ),

                    screenshot1Alt:
                        getValue(
                          'textHelp.screenshot1Alt',
                        ),

                    screenshot1Caption:
                        getValue(
                          'textHelp.screenshot1Caption',
                        ),

                    screenshot2Alt:
                        getValue(
                          'textHelp.screenshot2Alt',
                        ),

                    screenshot2Caption:
                        getValue(
                          'textHelp.screenshot2Caption',
                        ),

                    screenshot2Description:
                        getValue(
                          'textHelp.screenshot2Description',
                        ),
                  },
                },
              },
            );

            resolve(html);
          },
        ),
    };
  }
}

/**
 * Nombre del plugin.
 *
 * @const
 * @type {string}
 * @public
 * @api stable
 */
WFSTControls.NAME = 'wfstcontrols';
