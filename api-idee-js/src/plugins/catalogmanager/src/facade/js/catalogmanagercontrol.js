/**
 * @module IDEE/control/CatalogmanagerControl
 */

import CatalogmanagerImplControl from 'impl/catalogmanagercontrol';
import flatpickr from 'flatpickr';
import { Spanish } from 'flatpickr/dist/l10n/es';
import template from 'templates/catalogmanager';
import addCatalogTemplate from 'templates/addcatalog';
import loginTemplate from 'templates/login';
import contentTemplate from 'templates/catalogmanagercontent';
import collectionsTemplate from 'templates/catalogmanagercollections';
import itemsTemplate from 'templates/catalogmanageritems';
import imagesTemplate from 'templates/catalogmanagerimages';
import itemMetadataTemplate from 'templates/itemMetadata';
import collectionMetadataTemplate from 'templates/collectionMetadata';
import advancedFilterTemplate from 'templates/advancedFilter';
import fieldsTableTemplate from 'templates/fieldstable';
import typeTableTemplate from 'templates/typetable';
import cloudCoverSliderTemplate from 'templates/cloudCoverSlider';
import { getValue } from './i18n/language';

// - Modal
/** @private @type {string} Selector CSS del botón de cierre del modal informativo */
const BT_CLOSE_MODAL = 'div.m-dialog.info div.m-button > button';

/**
 * Estilos ráster por defecto para índices espectrales (NDVI, NDWI, NBR).
 *
 * @constant
 * @private
 * @type {Object<string, Object>}
 */
const INDICES_STYLES = {
  NDVI: {
    min: -1,
    max: 1,
    ramp: ['#a6611a', '#dfc27d', '#f5f5f5', '#80cdc1', '#018571'],
    interpolation: 'linear',
  },
  NDWI: {
    min: -1,
    max: 1,
    ramp: ['#8c510a', '#d8b365', '#f5f5f5', '#5ab4ac', '#01665e'],
    interpolation: 'linear',
  },
  NBR: {
    min: -1,
    max: 1,
    ramp: ['#d73027', '#fdae61', '#ffffbf', '#a6d96a', '#1a9850'],
    interpolation: 'linear',
  },
};

/**
 * Estilo por defecto para la huella de los ítems en el mapa
 * @constant
 * @private
 * @type {IDEE.style.Generic}
 */
const HUELLA_STYLE = new IDEE.style.Generic({
  polygon: {
    stroke: {
      width: 1,
      color: 'blue',
    },
    fill: {
      color: 'blue',
      opacity: 0,
    },
  },
});

const BOX_EXTENT_STYLE = new IDEE.style.Generic({
  polygon: {
    stroke: {
      width: 1,
      color: 'orange',
    },
    fill: {
      color: 'orange',
      opacity: 0.1,
    },
  },
});
export default class CatalogmanagerControl extends IDEE.Control {
  /**
   * @classdesc
   * Control de gestión de catálogos STAC. Permite añadir catálogos, explorar
   * colecciones e ítems, aplicar filtros temporales, espaciales y avanzados,
   * visualizar metadatos e imágenes en el mapa, consultar histogramas de assets
   * y realizar descargas masivas de imágenes TIFF.
   *
   * @constructor
   * @extends {IDEE.Control}
   * @param {Object} [options={}] Opciones de configuración del control
   * @param {boolean} [options.isDraggable=false] Indica si el panel puede arrastrarse
   * @param {number} [options.order] Orden de tabulación y prioridad en modales
   * @param {Array<Object>} [options.predefinedCatalogs=[]] Catálogos STAC precargados
   * @param {boolean} [options.addCatalogEnabled=false] Permite añadir catálogos desde la UI
   * @param {string} [options.downloadUrl=''] URL del servicio de descarga masiva
   * @api stable
   */
  constructor(options = {}) {
    // 1. Comprueba si la implementación puede crear el control
    if (IDEE.utils.isUndefined(CatalogmanagerImplControl)
      || (IDEE.utils.isObject(CatalogmanagerImplControl)
      && IDEE.utils.isNullOrEmpty(Object.keys(CatalogmanagerImplControl)))) {
      IDEE.exception(getValue('exception.impl'));
    }
    // 2. Crea la implementación del control
    const impl = new CatalogmanagerImplControl();
    super(impl, 'Catalogmanager');

    /**
     * Indicador de si el plugin puede arrastrarse o no
     * @public
     * @type {boolean}
     */
    this.isDraggable_ = options.isDraggable || false;

    /**
     * Referencia al mapa asociado al control
     * @private
     * @type {IDEE.Map|undefined}
     */
    this.map_ = undefined;

    /**
     * Elemento DOM raíz de la plantilla del control
     * @private
     * @type {HTMLElement|undefined}
     */
    this.template_ = undefined;

    /**
     * Orden de tabulación y prioridad en modales
     * @public
     * @type {number|undefined}
     */
    this.order = options.order;

    /**
     * Catálogos STAC definidos en la configuración inicial
     * @private
     * @type {Array<Object>}
     */
    this.predefinedCatalogs_ = options.predefinedCatalogs || [];

    /**
     * Indica si se puede añadir un catálogo desde la interfaz
     * @private
     * @type {boolean}
     */
    this.addCatalogEnabled_ = options.addCatalogEnabled || false;

    /**
     * URL del servicio de descarga masiva de imágenes
     * @private
     * @type {string}
     */
    this.downloadUrl_ = options.downloadUrl || '';

    /**
     * Catálogos STAC cargados en el control
     * @private
     * @type {Array<Object>}
     */
    this.catalogs_ = [];

    /**
     * Índice del catálogo seleccionado en la interfaz
     * @private
     * @type {number}
     */
    this.selectedCatalogIndex_ = 0;

    /**
     * Índice de la colección seleccionada en la interfaz
     * @private
     * @type {number}
     */
    this.selectedCollectionIndex_ = -1;

    /**
     * Identificadores de ítems seleccionados para descarga masiva
     * @private
     * @type {Array<string>}
     */
    this.selectedItems_ = [];

    this.footprintLayers_ = [];

    /**
     * Identificadores de imágenes seleccionadas para descarga masiva
     * @private
     * @type {Object<string, Array<string>>}
     */
    this.selectedImages_ = {};

    this.cachedElements_ = {
      collectionId: null,
      items: {},
    };

    /**
     * Operadores SQL disponibles en el filtro avanzado
     * @private
     * @type {Array<string>}
     */
    this.operators_ = ['=', '<', '>', '<=', '>=', '<>', 'and'];

    /**
     * Mapeo de operadores SQL a operadores de consulta STAC
     * @private
     * @type {Object<string, string>}
     */
    this.sqlToStacOperator_ = {
      '=': 'eq',
      '<>': 'neq',
      '<': 'lt',
      '<=': 'lte',
      '>': 'gt',
      '>=': 'gte',
    };

    /**
     * Filtros comunes activos (temporal y espacial)
     * @private
     * @type {Object}
     */
    this.commonFilters_ = {};

    /**
     * Estado interno del panel de filtro avanzado
     * @private
     * @type {Object|null}
     */
    this.advancedFilterState_ = null;

    /**
     * Temporizador de debounce para actualizar ítems al mover el mapa
     * @private
     * @type {number|null}
     */
    this.moveMapTimer_ = null;

    /**
     * Retardo (ms) sin movimiento antes de llamar a updateItems
     * @private
     * @type {number}
     */
    this.moveMapDelay_ = 500;

    /**
     * Handler de MOVE del mapa con contexto fijado
     * @private
     * @type {Function}
     */
    this.onMoveMapBound_ = this.onMoveMap.bind(this);

    /**
     * Estilo aplicado a la huella del ítem enfocado en el mapa
     * @private
     * @type {IDEE.style.Generic}
     */
    this.focusStyle_ = new IDEE.style.Generic({
      polygon: {
        stroke: {
          width: 1,
          color: 'red',
        },
        fill: {
          color: 'red',
          opacity: 0.2,
        },
      },
    });

    this.collectionsSortType_ = 'sort-name-up';
    this.pagination_ = {
      currentPage: 1,
      totalPages: 1,
      pageSize: 10,
      totalItems: 0,
    };

    /**
     * Instancias Flatpickr de los campos temporales
     * @private
     * @type {Object<string, flatpickr.Instance>|null}
     */
    this.flatpickrInstances_ = null;

    /**
     * Indica si los cambios de Flatpickr deben refrescar los ítems
     * @private
     * @type {boolean}
     */
    this.temporalFilterEventsActive_ = false;
  }

  /**
   * Esta función crea la vista
   *
   * @public
   * @function
   * @param {IDEE.Map} map Mapa al que se añade el control
   * @returns {Promise<HTMLElement>} Promesa que resuelve con el HTML del control
   * @api stable
   */
  createView(map) {
    this.map_ = map;
    this.getImpl().createAllInteractions(map, this);
    this.updateItemsEvent_ = this.updateItems.bind(this, true);
    const yesterday = new Date(new Date().setDate(new Date().getDate() - 1)).toISOString().split('T')[0];
    const accept = ['.kml', '.zip', '.gpx', '.geojson', '.gml', '.json'];
    return new Promise((success, fail) => {
      const html = IDEE.template.compileSync(template, {
        vars: {
          translations: {
            title: getValue('title'),
            addCatalog: getValue('addCatalog'),
            update: getValue('update'),
            filters: getValue('filters'),
            filtersTab: getValue('filtersTab'),
            resultsTab: getValue('resultsTab'),
            configuration: getValue('configuration'),
            filtersTypes: getValue('filtersTypes'),
            masiveDownload: getValue('masiveDownload.title'),
            clearSelection: getValue('clearSelection'),
            noResults: getValue('exception.no_results'),
          },
          startDate: yesterday,
          startTime: '00:00:00',
          endDate: yesterday,
          endTime: '23:59:59',
          addCatalogEnabled: this.addCatalogEnabled_,
          accept,
        },
      });

      if (this.isDraggable_) {
        IDEE.utils.draggabillyPlugin(this.getPanel(), '#m-catalogmanager-title');
      }

      this.template_ = html;
      this.addEvents();
      this.initTemporalFlatpickr();
      this.addPredefinedCatalogs();
      success(html);
    });
  }

  /**
   * Carga los catálogos predefinidos y los renderiza en la interfaz
   *
   * @private
   * @function
   */
  async addPredefinedCatalogs() {
    const authenticatePromises = [];
    this.predefinedCatalogs_.forEach((predCatalog) => {
      const catalog = new IDEE.stac.Catalog(predCatalog);
      if (!predCatalog.public && !IDEE.utils.isNullOrEmpty(predCatalog.user)
          && !IDEE.utils.isNullOrEmpty(predCatalog.password)) {
        authenticatePromises.push(catalog.authenticate(predCatalog.user, predCatalog.password));
      }
      this.catalogs_.push(this.getJsonCatalog(catalog));
    });
    await Promise.all(authenticatePromises);
    if (this.catalogs_.length > 0) {
      this.renderCatalogs();
    }
    this.initCollections();
  }

  /**
   * Esta función añade los eventos al control
   *
   * @public
   * @function
   * @api stable
   */
  addEvents() {
    const btnAddCatalog = this.template_.querySelector('#m-catalogmanager-addcatalog');
    if (btnAddCatalog) {
      btnAddCatalog.addEventListener('click', this.openAddCatalog.bind(this));
    }
    this.template_.querySelector('#m-catalogmanager-filters-temporal-predefined').addEventListener('click', (evt) => this.setTemporalFilter(evt));
    this.template_.querySelector('#m-catalogmanager-filters-spatial-predefined').addEventListener('click', (evt) => this.toggleSpatialFilter(evt));
    this.template_.querySelector('#m-catalogmanager-file-input').addEventListener('change', (evt) => this.uploadFile(evt));
    // this.template_.querySelector('#m-catalogmanager-updatecatalog')
    // .addEventListener('click', this.updateItemsEvent_);
    this.template_.querySelector('#m-catalogmanager-extra-actions-content #m-catalogmanager-download').addEventListener('click', this.masiveDownload.bind(this));
    this.template_.querySelector('#m-catalogmanager-extra-actions-content #m-catalogmanager-delete').addEventListener('click', this.clearSelection.bind(this));
    this.template_.querySelector('#m-catalogmanager-filters-tabs').addEventListener('click', (evt) => this.toggleTabs(evt));
    this.template_.querySelector('#m-catalogmanager-filters-tab-content').addEventListener('click', (evt) => this.toggleFilterSection(evt));
  }

  /**
   * Abre el modal para añadir un nuevo catálogo STAC
   *
   * @private
   * @function
   */
  openAddCatalog() {
    const acTemplate = IDEE.template.compileSync(addCatalogTemplate, {
      jsonp: true,
      parseToHtml: false,
      vars: {
        translations: {
          cat_title: getValue('cat_title'),
          cat_url: getValue('cat_url'),
          cat_public: getValue('cat_public'),
          cat_auth_url: getValue('cat_auth_url'),
          cat_user: getValue('cat_user'),
          cat_password: getValue('cat_password'),
          add: getValue('add'),
        },
      },
    });
    IDEE.dialog.info(acTemplate, getValue('addCatalog'), this.order);
    this.changeCloseButtonModal();
    document.querySelector('#add-catalog').addEventListener('click', this.addCatalog.bind(this));
    document.querySelector('.m-catalogmanager-add-panel #cat-public').addEventListener('change', this.togglePublic.bind(this));
  }

  /**
   * Abre el modal de autenticación para un catálogo privado
   *
   * @private
   * @function
   * @param {Function} callback Función a ejecutar tras autenticarse o elegir acceso público
   */
  openLogin(callback) {
    const html = IDEE.template.compileSync(loginTemplate, {
      jsonp: true,
      parseToHtml: false,
      vars: {
        translations: {
          cat_user: getValue('cat_user'),
          cat_password: getValue('cat_password'),
          login: getValue('login'),
          publicUser: getValue('publicUser'),
        },
      },
    });
    IDEE.dialog.info(html, `${getValue('loginCatalog')} ${this.catalogs_[this.selectedCatalogIndex_].title}`, this.order);
    this.hideCloseButtonModal();
    document.querySelector('#m-catalogmanager-login-catalog').addEventListener('click', this.loginCatalog.bind(this, false, callback));
    document.querySelector('#m-catalogmanager-login-public').addEventListener('click', this.loginCatalog.bind(this, true, callback));
  }

  /**
   * Autentica el catálogo seleccionado o lo marca como público y ejecuta el callback
   *
   * @private
   * @function
   * @param {boolean} isPublic Indica si se accede al catálogo en modo público
   * @param {Function} callback Función a ejecutar tras el login o el acceso público
   */
  loginCatalog(isPublic, callback) {
    const catalogObj = this.catalogs_[this.selectedCatalogIndex_].obj;
    if (isPublic) {
      catalogObj.public = true;
      this.closeDialog();
      callback();
    } else {
      const user = document.querySelector('#m-catalogmanager-user').value;
      const password = document.querySelector('#m-catalogmanager-password').value;
      catalogObj.authenticate(user, password).then((resp) => {
        if (resp === true) {
          this.closeDialog();
          callback();
        }
      });
    }
  }

  /**
   * Alterna la clase CSS 'hidden' de un elemento
   *
   * @private
   * @function
   * @param {HTMLElement} elem Elemento DOM a mostrar u ocultar
   */
  toggleHidden(elem) {
    if (elem.classList.contains('hidden')) {
      elem.classList.remove('hidden');
    } else {
      elem.classList.add('hidden');
    }
  }

  /**
   * Alterna el icono de expansión/contracción de una sección
   *
   * @private
   * @function
   * @param {HTMLElement} elem Elemento que contiene el icono a alternar
   */
  toggleIcon(elem) {
    const iconElement = elem.querySelector('.m-catalogmanager-icon');
    if (iconElement.classList.contains('g-cartografia-catalog-down-open')) {
      iconElement.classList.remove('g-cartografia-catalog-down-open');
      iconElement.classList.add('g-cartografia-catalog-up-open');
    } else {
      iconElement.classList.remove('g-cartografia-catalog-up-open');
      iconElement.classList.add('g-cartografia-catalog-down-open');
    }
  }

  /**
   * Expande o contrae una sección de filtros al hacer clic en su título o icono
   *
   * @private
   * @function
   * @param {Event} evt Evento de clic en el título o icono de la sección
   */
  toggleFilterSection(evt) {
    evt.stopPropagation();
    const target = evt.target;
    let section = null;
    if (target.classList.contains('m-catalogmanager-section-title') && !target.classList.contains('no-event')) {
      section = target.parentElement;
    } else if (target.classList.contains('m-catalogmanager-icon')) {
      section = target.parentElement.parentElement;
    }
    if (!section) {
      return;
    }
    const content = section.querySelector(`#${section.id}-content`);
    this.toggleIcon(section);
    if (content.classList.contains('hidden')) {
      content.classList.remove('hidden');
    } else {
      content.classList.add('hidden');
    }
  }

  /**
   * Cambia la pestaña activa del panel (filtros, configuración, etc.)
   *
   * @private
   * @function
   * @param {Event} evt Evento de clic en una pestaña
   */
  toggleTabs(evt) {
    evt.stopPropagation();
    const tab = evt.target;
    this.changeTab(tab);
  }

  /**
   * Activa la pestaña indicada y muestra su contenido asociado
   *
   * @private
   * @function
   * @param {HTMLElement} tab Elemento DOM de la pestaña a activar
   */
  changeTab(tab) {
    const tabs = tab.parentNode.children;
    for (let i = 0; i < tabs.length; i += 1) {
      const child = tabs.item(i);
      child.classList.remove('active');
    }
    tab.classList.add('active');
    const tabsContent = this.template_.querySelector('#m-catalogmanager-tabs-contents').children;
    for (let i = 0; i < tabsContent.length; i += 1) {
      const child = tabsContent.item(i);
      if (child.id !== `${tab.id}-content`) {
        child.classList.add('hidden');
      } else if (child.classList.contains('hidden')) {
        child.classList.remove('hidden');
      }
    }
    this.toggleMapMoveEvent(tab.id);
  }

  toggleMapMoveEvent(tabId) {
    const filterViewBtn = this.template_.querySelector('button#view');
    if (!filterViewBtn.classList.contains('active')) {
      return;
    }
    if (tabId.includes('results')) {
      this.map_.un(IDEE.evt.MOVE, this.onMoveMapBound_);
    } else {
      this.map_.on(IDEE.evt.MOVE, this.onMoveMapBound_);
    }
  }

  /**
   * Alterna la visibilidad del panel de filtros comunes
   *
   * @private
   * @function
   * @param {Event} evt Evento de clic en el botón de filtros
   */
  toggleCommonFilters(evt) {
    evt.stopPropagation();
    const btn = evt.target.tagName === 'SPAN' ? evt.target.parentElement : evt.target;
    const filtersContent = this.template_.querySelector('#m-catalogmanager-filters-content');
    const catalogContainer = this.template_.querySelector('ul.m-catalogmanager-ulcatalogs');
    if (btn.classList.contains('active')) {
      btn.classList.remove('active');
      filtersContent.classList.add('hidden');
      catalogContainer.classList.add('fullsize');
      this.getImpl().deactivateAllInteractions();
    } else {
      btn.classList.add('active');
      filtersContent.classList.remove('hidden');
      catalogContainer.classList.remove('fullsize');
    }
  }

  /**
   * Activa o desactiva un filtro temporal predefinido
   *
   * @private
   * @function
   * @param {Event} evt Evento de clic en el botón de filtro temporal
   */
  setTemporalFilter(evt) {
    evt.stopPropagation();
    const btn = evt.target;
    if (btn.classList.contains('active')) {
      btn.classList.remove('active');
      delete this.commonFilters_.datetime;
      this.resetFilterTag('temporal_start');
      this.resetFilterTag('temporal_end');
      this.toggleTemporalFilterEvent(false);
    } else {
      const activeBtn = btn.parentElement.querySelector('.active');
      if (activeBtn) {
        activeBtn.classList.remove('active');
      } else {
        this.toggleTemporalFilterEvent(true);
      }
      btn.classList.add('active');
      const filterType = btn.id;
      this.setTemporalFilterByType(filterType);
    }
  }

  /**
   * Activa o desactiva la actualización de ítems al cerrar Flatpickr
   *
   * @private
   * @function
   * @param {boolean} activate Si se deben escuchar los cambios temporales
   */
  toggleTemporalFilterEvent(activate) {
    this.temporalFilterEventsActive_ = activate;
  }

  /**
   * Inicializa Flatpickr en los campos de fecha y hora del filtro temporal.
   * La actualización de ítems se dispara solo al cerrar el picker (`onClose`).
   *
   * @private
   * @function
   */
  initTemporalFlatpickr() {
    const startDateInput = this.template_.querySelector('#m-catalogmanager-filters-temporal-start');
    const startTimeInput = this.template_.querySelector('#m-catalogmanager-filters-temporal-start-time');
    const endDateInput = this.template_.querySelector('#m-catalogmanager-filters-temporal-end');
    const endTimeInput = this.template_.querySelector('#m-catalogmanager-filters-temporal-end-time');
    const locale = (typeof IDEE.language.getLang === 'function' && IDEE.language.getLang() === 'en')
      ? 'default'
      : Spanish;
    const onClose = () => {
      if (this.temporalFilterEventsActive_) {
        this.updateItems(true);
      }
    };
    const commonOptions = {
      allowInput: true,
      disableMobile: true,
      locale,
      onClose,
    };

    this.flatpickrInstances_ = {
      startDate: flatpickr(startDateInput, {
        ...commonOptions,
        dateFormat: 'd/m/Y',
        defaultDate: startDateInput.value || undefined,
      }),
      startTime: flatpickr(startTimeInput, {
        ...commonOptions,
        enableTime: true,
        noCalendar: true,
        enableSeconds: true,
        time_24hr: true,
        dateFormat: 'H:i:S',
        defaultDate: startTimeInput.value || undefined,
      }),
      endDate: flatpickr(endDateInput, {
        ...commonOptions,
        dateFormat: 'd/m/Y',
        defaultDate: endDateInput.value || undefined,
      }),
      endTime: flatpickr(endTimeInput, {
        ...commonOptions,
        enableTime: true,
        noCalendar: true,
        enableSeconds: true,
        time_24hr: true,
        dateFormat: 'H:i:S',
        defaultDate: endTimeInput.value || undefined,
      }),
    };
  }

  /**
   * Sincroniza el valor de un campo Flatpickr sin disparar onChange/onClose.
   *
   * @private
   * @function
   * @param {string} key Clave de la instancia (`startDate`, `startTime`, `endDate`, `endTime`)
   * @param {string} value Valor a establecer
   */
  setTemporalFlatpickrValue(key, value) {
    const instance = this.flatpickrInstances_ && this.flatpickrInstances_[key];
    if (instance && value) {
      instance.setDate(value, false);
    }
  }

  /**
   * Formatea una fecha en hora local (YYYY-MM-DD).
   *
   * @private
   * @param {Date} date Fecha a formatear
   * @returns {string} Fecha en formato local
   */
  formatLocalDate(date) {
    const pad = (value) => String(value).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }

  /**
   * Formatea una hora en hora local (HH:mm:ss).
   *
   * @private
   * @param {Date} date Fecha de la que extraer la hora
   * @returns {string} Hora en formato local
   */
  formatLocalTime(date) {
    const pad = (value) => String(value).padStart(2, '0');
    return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  }

  /**
   * Establece el filtro temporal según el tipo seleccionado
   *
   * @private
   * @function
   * @param {string} filterType Tipo de filtro ('last30days', 'last3months', 'lastyear', 'range')
   */
  setTemporalFilterByType(filterType) {
    let fullDate = null;
    let startDate = null;
    let startTime = null;
    let endDate = null;
    let endTime = null;
    switch (filterType) {
      case 'last30days':
        fullDate = new Date(new Date().setDate(new Date().getDate() - 30));
        startDate = this.formatLocalDate(fullDate);
        startTime = this.formatLocalTime(fullDate);
        fullDate = new Date();
        endDate = this.formatLocalDate(fullDate);
        endTime = this.formatLocalTime(fullDate);
        this.addTemporalCommonFilter(startDate, startTime, endDate, endTime);
        break;
      case 'last3months':
        fullDate = new Date(new Date().setMonth(new Date().getMonth() - 3));
        startDate = this.formatLocalDate(fullDate);
        startTime = this.formatLocalTime(fullDate);
        fullDate = new Date();
        endDate = this.formatLocalDate(fullDate);
        endTime = this.formatLocalTime(fullDate);
        this.addTemporalCommonFilter(startDate, startTime, endDate, endTime);
        break;
      case 'lastyear':
        fullDate = new Date(new Date().setFullYear(new Date().getFullYear() - 1));
        startDate = this.formatLocalDate(fullDate);
        startTime = this.formatLocalTime(fullDate);
        fullDate = new Date();
        endDate = this.formatLocalDate(fullDate);
        endTime = this.formatLocalTime(fullDate);
        this.addTemporalCommonFilter(startDate, startTime, endDate, endTime);
        break;
      case 'range':
        startDate = this.template_.querySelector('#m-catalogmanager-filters-temporal-start').value;
        startTime = this.template_.querySelector('#m-catalogmanager-filters-temporal-start-time').value;
        endDate = this.template_.querySelector('#m-catalogmanager-filters-temporal-end').value;
        endTime = this.template_.querySelector('#m-catalogmanager-filters-temporal-end-time').value;
        this.addTemporalCommonFilter(startDate, startTime, endDate, endTime);
        break;
      default:
        delete this.commonFilters_.datetime;
        break;
    }
  }

  /**
   * Añade o actualiza el filtro temporal común y sincroniza los campos del formulario
   *
   * @private
   * @function
   * @param {string} startDate Fecha de inicio (YYYY-MM-DD)
   * @param {string} [startTime] Hora de inicio (HH:mm:ss)
   * @param {string} endDate Fecha de fin (YYYY-MM-DD)
   * @param {string} [endTime] Hora de fin (HH:mm:ss)
   */
  addTemporalCommonFilter(startDate, startTime, endDate, endTime) {
    if (startTime && endTime) {
      this.commonFilters_.datetime = `${startDate}T${startTime}Z/${endDate}T${endTime}Z`;
      this.setTemporalFlatpickrValue('startDate', startDate);
      this.setTemporalFlatpickrValue('startTime', startTime);
      this.setTemporalFlatpickrValue('endDate', endDate);
      this.setTemporalFlatpickrValue('endTime', endTime);
      this.addFilterTag(`${getValue('filtersTypes.temporal.start')}: ${startDate}T${startTime}Z`, 'temporal_start');
      this.addFilterTag(`${getValue('filtersTypes.temporal.end')}: ${endDate}T${endTime}Z`, 'temporal_end');
    } else {
      this.commonFilters_.datetime = `${startDate}/${endDate}`;
      this.setTemporalFlatpickrValue('startDate', startDate);
      this.setTemporalFlatpickrValue('endDate', endDate);
      this.addFilterTag(`${getValue('filtersTypes.temporal.start')}: ${startDate}`, 'temporal_start');
      this.addFilterTag(`${getValue('filtersTypes.temporal.end')}: ${endDate}`, 'temporal_end');
    }
    IDEE.toast.success(getValue('filtersTypes.temporal.success'), null, 2500);
    this.updateItems(false);
  }

  /**
   * Activa o desactiva un filtro espacial predefinido
   *
   * @private
   * @function
   * @param {Event} evt Evento de clic en el botón de filtro espacial
   */
  toggleSpatialFilter(evt) {
    evt.stopPropagation();
    const btn = evt.target.tagName === 'SPAN' ? evt.target.parentElement : evt.target;

    this.getImpl().deactivateAllInteractions();
    this.removeBoxExtent();
    const filterType = btn.id;
    if (btn.classList.contains('active')) {
      this.resetFilterTag('spatial');
      if (filterType === 'view') {
        this.disableMoveMapEvent();
      }
    } else {
      const activeBtn = btn.parentElement.querySelector('.active');
      if (activeBtn) {
        activeBtn.classList.remove('active');
        if (activeBtn.id === 'view') {
          this.disableMoveMapEvent();
        }
      }
      this.resetFilterTag('spatial');
      if (filterType === 'view') {
        btn.classList.add('active');
        this.map_.on(IDEE.evt.MOVE, this.onMoveMapBound_);
      }
      this.setSpatialFilterByType(filterType);
    }
  }

  disableMoveMapEvent() {
    this.map_.un(IDEE.evt.MOVE, this.onMoveMapBound_);
    clearTimeout(this.moveMapTimer_);
    this.moveMapTimer_ = null;
  }

  /**
   * Actualiza los ítems con debounce al mover el mapa (filtro espacial por vista)
   *
   * @private
   * @function
   */
  onMoveMap() {
    clearTimeout(this.moveMapTimer_);
    this.moveMapTimer_ = setTimeout(() => {
      this.updateItems(true);
    }, this.moveMapDelay_);
  }

  /**
   * Establece el filtro espacial según el tipo seleccionado
   *
   * @private
   * @function
   * @param {string} filterType Tipo de filtro (`view`, `extent` o `referenced`).
   */
  setSpatialFilterByType(filterType) {
    switch (filterType) {
      case 'view':
        const bbox = this.map_.getBbox();
        const extent = [bbox.x.min, bbox.y.min, bbox.x.max, bbox.y.max];
        this.setSpatialFilterByExtent(this.getImpl().transformExtent(extent, this.map_.getProjection().code, 'EPSG:4326'));
        this.addFilterTag(`${getValue('filtersTypes.spatial.view')}`, 'spatial');
        break;
      case 'extent':
        this.getImpl().activateDrawExtent();
        this.addFilterTag(`${getValue('filtersTypes.spatial.extent')}`, 'spatial');
        break;
      case 'referenced':
        /* this.getImpl().activateSelectGeometry();
        this.addFilterTag(`${getValue('filtersTypes.spatial.referenced')}`, 'spatial'); */
        const inputFile = this.template_.querySelector('#m-catalogmanager-file-input');
        inputFile.click();
        break;
      default:
        delete this.commonFilters_.bbox;
        break;
    }
    this.toggleSpatialFilterHelp(filterType);
  }

  /**
   * Establece el filtro espacial a partir de una extensión en EPSG:4326
   *
   * @private
   * @function
   * @param {Array<number>} extent Extensión [minX, minY, maxX, maxY] en EPSG:4326
   */
  setSpatialFilterByExtent(extent) {
    this.commonFilters_.bbox = extent;
    IDEE.toast.success(getValue('filtersTypes.spatial.success'), null, 2500);
    this.getImpl().deactivateAllInteractions();
    this.updateItems(false);
  }

  /**
   * Dibuja en el mapa un polígono con la extensión espacial del filtro
   *
   * @private
   * @function
   * @param {Array<Array<number>>} coordinates Coordenadas del polígono en el CRS del mapa
   */
  drawBoxExtent(coordinates) {
    if (this.boxLayer_) {
      this.boxLayer_.removeFeatures(this.boxLayer_.getFeatures());
    } else {
      this.boxLayer_ = new IDEE.layer.Vector();
      this.boxLayer_.displayInLayerSwitcher = false;
      this.boxLayer_.setStyle(BOX_EXTENT_STYLE);
      this.map_.addLayers(this.boxLayer_);
    }
    const feature = new IDEE.Feature();
    feature.setGeometry({
      coordinates,
      type: 'Polygon',
    });
    this.boxLayer_.addFeatures(feature);
  }

  /**
   * Elimina del mapa las features del polígono de extensión espacial
   *
   * @private
   * @function
   */
  removeBoxExtent() {
    if (this.boxLayer_) {
      this.boxLayer_.removeFeatures(this.boxLayer_.getFeatures());
    }
  }

  /**
   * Carga un fichero vectorial al mapa y usa su extensión como filtro espacial
   *
   * @private
   * @function
   * @param {Event} evt Evento change del input de fichero
   */
  uploadFile(evt) {
    evt.stopPropagation();
    const inputFile = evt.target;
    const file = inputFile.files[0];
    IDEE.loadFiles.addFileToMap(this.map_, file);
    inputFile.value = '';
    const layerName = file.name.split('.').slice(0, -1).join('.');
    setTimeout(() => {
      const layer = this.map_.getLayers().find((l) => l.name === layerName);
      if (layer) {
        this.boxLayer_ = layer;
        const extent = layer.getFeaturesExtent();
        this.setSpatialFilterByExtent(this.getImpl()
          .transformExtent(extent, this.map_.getProjection().code, 'EPSG:4326'));
        this.addFilterTag(`${getValue('filtersTypes.spatial.referenced')}: ${layerName}`, 'spatial');
      }
    }, 1000);
  }

  /**
   * Muestra u oculta el texto de ayuda del filtro espacial activo
   *
   * @private
   * @function
   * @param {string} filterType Tipo de filtro espacial (`view`, `extent` o `referenced`)
   */
  toggleSpatialFilterHelp(filterType) {
    const helpContainer = this.template_.querySelector('#m-catalogmanager-filters-spatial-help');
    const helps = helpContainer.querySelectorAll('.spatial-help');
    helps.forEach((help) => {
      if (!help.classList.contains('hidden')) {
        help.classList.add('hidden');
      }
      if (help.id === `${filterType}-help`) {
        help.classList.remove('hidden');
      }
    });
  }

  /**
   * Añade una etiqueta visual de filtro activo en los contenedores de tags
   *
   * @private
   * @function
   * @param {string} text Texto descriptivo de la etiqueta
   * @param {string} type Tipo de filtro (`temporal`, `spatial`, `cloud_cover`, `collection`, etc.)
   */
  addFilterTag(text, type) {
    this.removeFilterTag(type);
    const containers = this.template_.querySelectorAll('.m-catalogmanager-filters-tags');
    containers.forEach((container) => {
      const tag = document.createElement('div');
      tag.classList.add('m-catalogmanager-tag');
      tag.classList.add(type);
      const tagText = document.createElement('span');
      tagText.innerHTML = text;
      tag.appendChild(tagText);
      const tagClose = document.createElement('span');
      tagClose.classList.add('m-catalogmanager-tag-close');
      tagClose.innerHTML = 'x';
      tagClose.addEventListener('click', () => this.closeFilterTag(type));
      tag.appendChild(tagClose);
      container.appendChild(tag);
    });
  }

  /**
   * Cierra una etiqueta de filtro, restablece el filtro asociado y actualiza los ítems
   *
   * @private
   * @function
   * @param {string} type Tipo de filtro de la etiqueta a cerrar
   */
  closeFilterTag(type) {
    this.resetFilterTag(type);
    this.updateItems(true);
  }

  /**
   * Restablece el estado del filtro asociado a una etiqueta sin actualizar los ítems
   *
   * @private
   * @function
   * @param {string} type Tipo de filtro de la etiqueta a restablecer
   */
  resetFilterTag(type) {
    this.removeFilterTag(type);
    const tagType = type.startsWith('temporal') ? 'temporal' : type;
    if (['temporal', 'spatial'].includes(tagType)) {
      const filterContainer = this.template_.querySelector(`#m-catalogmanager-filters-${tagType}-predefined`);
      const activeFilter = filterContainer.querySelector('.active');
      if (activeFilter) {
        activeFilter.classList.remove('active');
        if (tagType === 'temporal') {
          this.updateTemporalFilterByTag(type);
        } else if (tagType === 'spatial') {
          if (this.boxLayer_) { // Filtro espacial por extensión dibujada o fichero subido
            this.map_.removeLayers(this.boxLayer_);
            this.boxLayer_ = null;
          } else { // Filtro espacial por vista
            this.disableMoveMapEvent();
          }
          delete this.commonFilters_.bbox;
        }
      }
    } else if (tagType === 'collection') {
      const collectionsContainer = this.template_.querySelector('.m-catalogmanager-collections-list');
      const activeCollection = collectionsContainer.querySelector('.active');
      if (activeCollection) {
        activeCollection.click();
      }
    } else if (tagType === 'cloud_cover') {
      this.resetCloudCoverFilter();
    }
  }

  /**
   * Elimina del DOM las etiquetas visuales del tipo de filtro indicado
   *
   * @private
   * @function
   * @param {string} type Tipo de filtro cuyas etiquetas se eliminan
   */
  removeFilterTag(type) {
    const tagContainers = this.template_.querySelectorAll('.m-catalogmanager-filters-tags');
    tagContainers.forEach((tagContainer) => {
      const tags = tagContainer.querySelectorAll(`.m-catalogmanager-tag.${type}`);
      tags.forEach((tag) => {
        tag.remove();
      });
    });
  }

  /**
   * Abre el panel de filtros avanzados para una colección
   *
   * @private
   * @function
   * @param {number} catalogIndex Índice del catálogo en la lista interna
   * @param {number} collectionIndex Índice de la colección dentro del catálogo
   * @returns {Promise<void>}
   */
  async openAdvancedFilters(catalogIndex, collectionIndex) {
    const catalog = this.catalogs_[catalogIndex];
    const collection = catalog.collections[collectionIndex];
    let queryableFields = {};
    try {
      queryableFields = await catalog.obj.getQueryableFields(collection.id) || {};
    } catch (err) {
      IDEE.dialog.error(getValue('advancedFilter.loadError'));
      return;
    }
    const emptyQueryables = Object.keys(queryableFields).length === 0;
    const advancedFiltersHtml = IDEE.template.compileSync(advancedFilterTemplate, {
      vars: {
        catalogIndex,
        collectionIndex,
        operators: this.operators_,
        translations: getValue('advancedFilter'),
      },
    });
    if (emptyQueryables) {
      // IDEE.dialog.info(getValue('advancedFilter.noQueryableFields'));
      const noQueryableFieldsHtml = document.createElement('div');
      noQueryableFieldsHtml.innerHTML = `<p class="m-catalogmanager-headers">${getValue('advancedFilter.noQueryableFields')}</p>`;
      advancedFiltersHtml.querySelector('#m-catalogmanager-advanced-filters-content').innerHTML = noQueryableFieldsHtml.outerHTML;
    }
    const container = this.template_.querySelector('#m-catalogmanager-filters-advanced');
    container.innerHTML = advancedFiltersHtml.outerHTML;
    if (!emptyQueryables) {
      this.initAdvancedFilterState(catalogIndex, collectionIndex, queryableFields);
      this.renderCloudCoverSlider();
      this.renderQueryableFields();
      this.addAdvancedFilterEvents(container);
      if (collection.advancedFilter?.sqlExpression) {
        this.getAdvancedFilterAssistantTextarea().value = collection.advancedFilter.sqlExpression;
      }
      if (collection.advancedFilter?.queryExpression) {
        this.getAdvancedFilterQueryTextarea().value = collection.advancedFilter.queryExpression;
      }
    }
    this.toggleAdvancedFilters();
  }

  /**
   * Inicializa el estado interno del filtro avanzado
   *
   * @private
   * @function
   * @param {number} catalogIndex Índice del catálogo
   * @param {number} collectionIndex Índice de la colección
   * @param {Object} queryableFields Campos consultables devueltos por la API STAC
   */
  initAdvancedFilterState(catalogIndex, collectionIndex, queryableFields) {
    const fields = this.formatQueryableFields(queryableFields);
    this.advancedFilterState_ = {
      catalogIndex,
      collectionIndex,
      queryableFields: queryableFields || {},
      fields,
      fieldsPages: this.spliteList(fields),
      currentFieldsPage: 0,
      selectedField: null,
      fieldsTemplate: null,
    };
  }

  /**
   * Transforma el esquema de campos consultables STAC en una lista para la UI
   *
   * @private
   * @function
   * @param {Object} queryableFields Propiedades consultables del endpoint queryables
   * @returns {Array<{key: string, title: string}>} Lista de campos con clave y título
   */
  formatQueryableFields(queryableFields) {
    const fields = [];
    const keys = Object.keys(queryableFields);
    keys.forEach((key) => {
      fields.push({
        key,
        title: queryableFields[key].title,
      });
    });
    return fields;
  }

  /**
   * Obtiene el contenedor DOM del panel de filtro avanzado
   *
   * @private
   * @function
   * @returns {HTMLElement|null} Contenedor del filtro avanzado
   */
  getAdvancedFilterContainer() {
    return this.template_.querySelector('#m-catalogmanager-filters-advanced #m-catalogmanager-advanced-filters');
  }

  /**
   * Obtiene el textarea de expresión SQL del filtro avanzado
   *
   * @private
   * @function
   * @returns {HTMLTextAreaElement|null} Textarea de la expresión de filtro
   */
  getAdvancedFilterAssistantTextarea() {
    return this.getAdvancedFilterContainer().querySelector('#m-catalogmanager-assistant-body');
  }

  /**
   * Obtiene el textarea de expresión de consulta JSON del filtro avanzado
   *
   * @private
   * @function
   * @returns {HTMLTextAreaElement|null} Textarea de la expresión de consulta JSON
   */
  getAdvancedFilterQueryTextarea() {
    return this.getAdvancedFilterContainer().querySelector('#m-catalogmanager-query-body');
  }

  /**
   * Registra los eventos del panel de filtro avanzado
   *
   * @private
   * @function
   * @param {HTMLElement} container Contenedor raíz del filtro avanzado
   */
  addAdvancedFilterEvents(container) {
    const root = container.querySelector('#m-catalogmanager-advanced-filters');
    root.querySelectorAll('#m-catalogmanager-operators-container>button').forEach((btn) => {
      btn.addEventListener('click', (evt) => this.advancedFilterOperatorClick(evt));
    });
    root.querySelector('#m-catalogmanager-advanced-filters-tabs').addEventListener('click', (evt) => this.changeAdvancedFilterTab(evt));
    root.querySelector('#aplicar-btn').addEventListener('click', () => this.applyAdvancedFilter());
    root.querySelector('#limpiar-filtro-btn').addEventListener('click', () => this.clearAdvancedFilter());
  }

  /**
   * Cambia la pestaña activa del filtro avanzado (asistente o consulta)
   *
   * @private
   * @function
   * @param {Event} evt Evento de clic en una pestaña del filtro avanzado
   */
  changeAdvancedFilterTab(evt) {
    evt.stopPropagation();
    const btn = evt.target;
    if (btn.id === 'advanced-filter-tab-assistant') {
      this.showAdvancedFilter('assistant');
    } else if (btn.id === 'advanced-filter-tab-query') {
      this.showAdvancedFilter('query');
    }
  }

  /**
   * Muestra el panel del filtro avanzado correspondiente a la pestaña indicada
   *
   * @private
   * @function
   * @param {string} tabName Nombre de la pestaña (`assistant` o `query`)
   */
  showAdvancedFilter(tabName) {
    const tabs = this.getAdvancedFilterContainer().querySelectorAll('#m-catalogmanager-advanced-filters-tabs>div');
    const tabId = `advanced-filter-tab-${tabName}`;
    tabs.forEach((tab) => {
      if (tab.id === tabId) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });
    const containerId = `advanced-filter-${tabName}-container`;
    const containers = this.getAdvancedFilterContainer().querySelectorAll('.advanced-filter-container');
    containers.forEach((container) => {
      if (container.id === containerId) {
        container.classList.remove('hidden');
      } else {
        container.classList.add('hidden');
      }
    });
  }

  /**
   * Renderiza el slider dual de cobertura de nubes si el campo `eo:cloud_cover` existe
   *
   * @private
   * @function
   */
  renderCloudCoverSlider() {
    const state = this.advancedFilterState_;
    const fields = state.fieldsPages[state.currentFieldsPage] || [];
    const cloudCoverContainer = this.template_.querySelector('#m-catalogmanager-filters-cloud-cover');
    cloudCoverContainer.innerHTML = '';
    if (fields.find((field) => field.key === 'eo:cloud_cover')) {
      const cloudCoverSliderHtml = IDEE.template.compileSync(cloudCoverSliderTemplate, {
        jsonp: true,
        vars: {
          minValue: 0,
          maxValue: 100,
          translations: getValue('filtersTypes.cloudCover'),
        },
      });
      cloudCoverSliderHtml.querySelector('#m-catalogmanager-cloudcover-min')
        .addEventListener('change', () => this.changeCloudCoverFilter());
      cloudCoverSliderHtml.querySelector('#m-catalogmanager-cloudcover-max')
        .addEventListener('change', () => this.changeCloudCoverFilter());
      cloudCoverContainer.appendChild(cloudCoverSliderHtml);
      this.bindCloudCoverSlider(cloudCoverContainer);
    }
  }

  /**
   * Asocia eventos al slider dual de cobertura de nubes y sincroniza la barra
   *
   * @private
   * @function
   * @param {HTMLElement} container Contenedor del slider
   */
  bindCloudCoverSlider(container) {
    const minInput = container.querySelector('#m-catalogmanager-cloudcover-min');
    const maxInput = container.querySelector('#m-catalogmanager-cloudcover-max');
    if (!minInput || !maxInput) {
      return;
    }
    const onInput = (evt) => this.syncCloudCoverSlider(container, evt?.target);
    minInput.addEventListener('input', onInput);
    maxInput.addEventListener('input', onInput);
    this.syncCloudCoverSlider(container);
  }

  /**
   * Resincroniza el estilo visual del slider dual de cobertura de nubes
   *
   * @private
   * @function
   */
  syncCloudCoverSliderStyle() {
    const container = this.template_.querySelector('#m-catalogmanager-filters-cloud-cover');
    const minInput = container.querySelector('#m-catalogmanager-cloudcover-min');
    const maxInput = container.querySelector('#m-catalogmanager-cloudcover-max');
    this.syncCloudCoverSlider(container, minInput);
    this.syncCloudCoverSlider(container, maxInput);
  }

  /**
   * Evita que min/max se crucen y colorea solo el tramo seleccionado
   *
   * @private
   * @function
   * @param {HTMLElement} container Contenedor del slider
   * @param {HTMLInputElement} [activeInput] Input que disparó el cambio
   */
  syncCloudCoverSlider(container, activeInput) {
    const minInput = container.querySelector('#m-catalogmanager-cloudcover-min');
    const maxInput = container.querySelector('#m-catalogmanager-cloudcover-max');
    const track = container.querySelector('.m-catalogmanager-dual-range-track');
    const valuesLabel = container.querySelector('#m-catalogmanager-cloudcover-values');
    if (!minInput || !maxInput || !track) {
      return;
    }

    const gap = 1;
    let min = Number(minInput.value);
    let max = Number(maxInput.value);
    const rangeMax = Number(minInput.max) || 100;

    if (min > max - gap) {
      if (activeInput === minInput) {
        min = max - gap;
        minInput.value = min;
      } else {
        max = min + gap;
        maxInput.value = max;
      }
    }

    const percentMin = (min / rangeMax) * 100;
    const percentMax = (max / rangeMax) * 100;
    track.style.setProperty('--cc-min', `${percentMin}%`);
    track.style.setProperty('--cc-max', `${percentMax}%`);

    if (valuesLabel) {
      valuesLabel.textContent = `${min}% – ${max}%`;
    }
  }

  /**
   * Renderiza la tabla paginada de campos consultables
   *
   * @private
   * @function
   */
  renderQueryableFields() {
    const state = this.advancedFilterState_;
    const fields = state.fieldsPages[state.currentFieldsPage] || [];
    state.fieldsTemplate = IDEE.template.compileSync(fieldsTableTemplate, {
      jsonp: true,
      vars: { fields },
    });
    const totalPages = state.fieldsPages.length || 1;
    state.fieldsTemplate.querySelector('#pageNumBtn').innerHTML = `${state.currentFieldsPage + 1} ${getValue('advancedFilter.of')} ${totalPages}`;
    const fieldsContainer = this.getAdvancedFilterContainer().querySelector('.m-catalogmanager-fields');
    fieldsContainer.innerHTML = `<p class="m-catalogmanager-headers">${getValue('advancedFilter.fields')}</p>`;
    fieldsContainer.appendChild(state.fieldsTemplate);
    this.bindQueryableFieldCells();
    this.bindAdvancedFilterPagination();
  }

  /**
   * Asocia eventos de clic a las celdas de campos consultables
   *
   * @private
   * @function
   */
  bindQueryableFieldCells() {
    const state = this.advancedFilterState_;
    this.getAdvancedFilterContainer().querySelector('#m-catalogmanager-fieldstable')
      .addEventListener('click', (evt) => {
        const fieldName = evt.target.id;
        state.selectedField = fieldName;
        this.getAdvancedFilterAssistantTextarea().value += fieldName;
        this.showQueryableFieldValues(fieldName);
        this.toggleCellFocus(evt.target);
      });
  }

  /**
   * Muestra el tipo del campo seleccionado en el filtro avanzado
   *
   * @private
   * @function
   * @param {string} fieldName Nombre del campo consultable
   */
  async showQueryableFieldValues(fieldName) {
    const fieldType = await this.getQueryableFieldType(fieldName);
    const typeContainer = this.getAdvancedFilterContainer().querySelector('.m-catalogmanager-type');
    const typeTemplate = IDEE.template.compileSync(typeTableTemplate, {
      jsonp: true,
      vars: { fieldType },
    });
    typeContainer.innerHTML = `<p class="m-catalogmanager-headers">${getValue('advancedFilter.type')}</p>`;
    typeContainer.appendChild(typeTemplate);
  }

  /**
   * Obtiene la etiqueta traducida del tipo de un campo consultable
   *
   * @private
   * @function
   * @param {string} fieldName Nombre del campo
   * @returns {string} Etiqueta del tipo de dato
   */
  async getQueryableFieldType(fieldName) {
    const schema = this.advancedFilterState_.queryableFields[fieldName];
    if (!schema) {
      return getValue('advancedFilter.types.unknown');
    }
    let { type, format } = schema;
    const ref = schema.$ref;
    if (ref) {
      const refParts = ref.split('#');
      const url = refParts[0];
      const pathParts = refParts[1].substring(1).split('/');
      const response = await IDEE.remote.get(url);
      const refSchema = JSON.parse(response.text);
      let root = refSchema;
      pathParts.forEach((pathPart) => {
        root = root[pathPart];
      });
      type = root.type;
      format = root.format;
    }
    if (type === 'string' && format === 'date-time') {
      return getValue('advancedFilter.types.date');
    }
    if (type === 'string') {
      return getValue('advancedFilter.types.string');
    }
    if (type === 'number') {
      return getValue('advancedFilter.types.number');
    }
    if (type === 'integer') {
      return getValue('advancedFilter.types.integer');
    }
    if (type === 'boolean') {
      return getValue('advancedFilter.types.boolean');
    }
    return getValue('advancedFilter.types.unknown');
  }

  /**
   * Inserta un operador SQL en el textarea del filtro avanzado
   *
   * @private
   * @function
   * @param {Event} evt Evento de clic en un botón de operador
   */
  advancedFilterOperatorClick(evt) {
    evt.stopPropagation();
    const btn = evt.target;
    const textarea = this.getAdvancedFilterAssistantTextarea();
    switch (btn.innerHTML) {
      case '&#61;':
      case '=':
        textarea.value += ' = ';
        break;
      case '&lt;':
        textarea.value += ' < ';
        break;
      case '&gt;':
        textarea.value += ' > ';
        break;
      case '&lt;&gt;':
        textarea.value += ' <> ';
        break;
      case '&gt;=':
        textarea.value += ' >= ';
        break;
      case '&lt;=':
        textarea.value += ' <= ';
        break;
      default:
        textarea.value += ` ${btn.textContent.trim().toLowerCase()} `;
    }
  }

  /**
   * Divide una expresión SQL en condiciones separadas por el operador AND
   *
   * @private
   * @function
   * @param {string} sql Expresión SQL completa
   * @returns {Array<string>} Lista de condiciones individuales
   */
  splitSqlByAnd(sql) {
    const parts = [];
    let start = 0;
    let inQuote = null;
    for (let i = 0; i < sql.length; i += 1) {
      const char = sql[i];
      if (char === '\'' || char === '"') {
        if (inQuote === char) {
          inQuote = null;
        } else if (!inQuote) {
          inQuote = char;
        }
      }
      if (!inQuote && sql.slice(i, i + 5).toLowerCase() === ' and ') {
        parts.push(sql.slice(start, i).trim());
        start = i + 5;
        i += 4;
      }
    }
    const lastPart = sql.slice(start).trim();
    if (lastPart) {
      parts.push(lastPart);
    }
    return parts;
  }

  /**
   * Parsea una condición SQL en campo, operador y valor
   *
   * @private
   * @function
   * @param {string} condition Condición SQL (p. ej. 'cloud_cover < 20')
   * @returns {{field: string, operator: string, value: string}} Componentes de la condición
   * @throws {Error} Si la condición no es válida
   */
  parseSqlCondition(condition) {
    const operators = ['<=', '>=', '<>', '=', '<', '>'];
    let inQuote = null;
    let operator = null;
    let operatorIndex = -1;

    for (let i = 0; i < condition.length; i += 1) {
      const char = condition[i];
      if (char === '\'' || char === '"') {
        if (inQuote === char) {
          inQuote = null;
        } else if (!inQuote) {
          inQuote = char;
        }
      }
      if (!inQuote) {
        const foundOperator = operators.find((op) => condition.slice(i, i + op.length) === op);
        if (foundOperator) {
          operator = foundOperator;
          operatorIndex = i;
          break;
        }
      }
    }

    if (!operator || operatorIndex <= 0) {
      throw new Error('Invalid condition');
    }

    const fieldPart = condition.slice(0, operatorIndex).trim();
    const valuePart = condition.slice(operatorIndex + operator.length).trim();
    if (!fieldPart || !valuePart) {
      throw new Error('Invalid condition');
    }

    return {
      field: this.parseSqlFieldName(fieldPart),
      operator,
      value: valuePart,
    };
  }

  /**
   * Extrae el nombre de campo eliminando comillas si las tiene
   *
   * @private
   * @function
   * @param {string} fieldPart Parte izquierda de la condición SQL
   * @returns {string} Nombre del campo sin comillas
   */
  parseSqlFieldName(fieldPart) {
    const quoted = fieldPart.match(/^["'](.+)["']$/);
    return quoted ? quoted[1] : fieldPart;
  }

  /**
   * Convierte el valor literal de una condición SQL al tipo JavaScript adecuado
   *
   * @private
   * @function
   * @param {string} field Nombre del campo
   * @param {string} valueStr Valor en formato string de la condición
   * @returns {string|number|boolean} Valor parseado
   */
  parseSqlConditionValue(field, valueStr) {
    const schema = this.advancedFilterState_?.queryableFields[field];
    const trimmed = valueStr.trim();
    const quotedMatch = trimmed.match(/^['"](.*)['"]$/);
    if (quotedMatch) {
      return quotedMatch[1];
    }
    if (trimmed === 'true') {
      return true;
    }
    if (trimmed === 'false') {
      return false;
    }
    if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
      return schema?.type === 'integer' ? parseInt(trimmed, 10) : Number(trimmed);
    }
    return trimmed;
  }

  /**
   * Convierte una expresión SQL en un objeto de consulta STAC (CQL2-like)
   *
   * @private
   * @function
   * @param {string} sql Expresión SQL del filtro avanzado
   * @returns {Object} Objeto de consulta STAC con operadores por campo
   * @throws {Error} Si contiene operadores no soportados
   */
  turnSqlIntoStacQuery(sql) {
    const trimmed = sql.trim();
    if (!trimmed) {
      return {};
    }
    const conditions = this.splitSqlByAnd(trimmed);
    const query = {};
    conditions.forEach((condition) => {
      const { field, operator, value } = this.parseSqlCondition(condition);
      const stacOperator = this.sqlToStacOperator_[operator];
      if (!stacOperator) {
        throw new Error(`Unsupported operator: ${operator}`);
      }
      if (!query[field]) {
        query[field] = {};
      }
      query[field][stacOperator] = this.parseSqlConditionValue(field, value);
    });
    return query;
  }

  /**
   * Asocia eventos de paginación a la tabla de campos consultables
   *
   * @private
   * @function
   */
  bindAdvancedFilterPagination() {
    const state = this.advancedFilterState_;
    if (state.fieldsTemplate) {
      state.fieldsTemplate.querySelectorAll('#m-attributetable-tfoot>button').forEach((btn) => {
        btn.addEventListener('click', (evt) => this.changeAdvancedFilterPage(evt));
      });
    }
  }

  /**
   * Cambia la página de campos consultables en el filtro avanzado
   *
   * @private
   * @function
   * @param {Event} evt Evento de clic en botón de paginación
   */
  changeAdvancedFilterPage(evt) {
    evt.stopPropagation();
    const state = this.advancedFilterState_;
    const totalPages = state.fieldsPages.length;
    let currentPage = state.currentFieldsPage;

    if (evt.target.id === 'prevBtn') {
      currentPage = currentPage > 0 ? currentPage - 1 : currentPage;
    } else {
      currentPage = currentPage < totalPages - 1 ? currentPage + 1 : currentPage;
    }

    state.currentFieldsPage = currentPage;
    this.renderQueryableFields();
  }

  /**
   * Marca visualmente la celda seleccionada en la tabla de campos
   *
   * @private
   * @function
   * @param {HTMLElement} cell Celda TD seleccionada
   */
  toggleCellFocus(cell) {
    const table = cell.closest('table');
    if (!table) {
      return;
    }
    table.querySelectorAll('td').forEach((td) => td.classList.remove('focus'));
    cell.classList.add('focus');
  }

  /**
   * Aplica el filtro avanzado y recarga los ítems de la colección
   *
   * @private
   * @function
   */
  applyAdvancedFilter() {
    const tab = this.getAdvancedFilterContainer().querySelector('#m-catalogmanager-advanced-filters-tabs>div.active');
    if (tab.id === 'advanced-filter-tab-assistant') {
      this.applyAdvancedFilterAssistant();
    } else if (tab.id === 'advanced-filter-tab-query') {
      this.applyAdvancedFilterQuery();
    }
  }

  /**
   * Aplica el filtro avanzado del asistente SQL convirtiéndolo a stac-query
   *
   * @private
   * @function
   */
  applyAdvancedFilterAssistant() {
    const state = this.advancedFilterState_;
    const catalog = this.catalogs_[state.catalogIndex];
    const collection = catalog.collections[state.collectionIndex];
    const sqlExpression = this.getAdvancedFilterAssistantTextarea().value.trim();
    let filterObj;
    try {
      filterObj = this.turnSqlIntoStacQuery(sqlExpression);
    } catch (err) {
      IDEE.dialog.error(getValue('advancedFilter.invalidQuery'));
      return;
    }
    if (collection.advancedFilter && !IDEE.utils.isNullOrEmpty(collection.advancedFilter.filter['eo:cloud_cover'])) {
      if (IDEE.utils.isNullOrEmpty(filterObj['eo:cloud_cover'])) {
        filterObj['eo:cloud_cover'] = collection.advancedFilter.filter['eo:cloud_cover'];
      }
    }
    collection.advancedFilter = {
      format: 'stac-query',
      filter: filterObj,
      sqlExpression,
      limit: 10,
    };
    this.getFilteredItemsAdvanced();
  }

  /**
   * Aplica el filtro avanzado de la pestaña de consulta JSON (stac-query, cql-json o cql2-json)
   *
   * @private
   * @function
   */
  applyAdvancedFilterQuery() {
    const state = this.advancedFilterState_;
    const catalog = this.catalogs_[state.catalogIndex];
    const collection = catalog.collections[state.collectionIndex];
    const queryExpression = this.getAdvancedFilterQueryTextarea().value.trim();
    let jsonExpression;
    try {
      jsonExpression = JSON.parse(queryExpression);
    } catch (err) {
      IDEE.dialog.error(getValue('advancedFilter.invalidQuery'));
      return;
    }
    const format = this.getAdvancedFilterContainer().querySelector('#m-catalogmanager-query-type').value;
    collection.advancedFilter = {
      format,
      filter: jsonExpression,
      queryExpression,
      limit: 10,
    };
    this.getFilteredItemsAdvanced();
  }

  /**
   * Ejecuta la búsqueda avanzada contra el catálogo STAC y renderiza los resultados
   *
   * @private
   * @function
   */
  getFilteredItemsAdvanced() {
    // this.updateBboxFilter();
    this.selectedItems_ = [];
    this.selectedImages_ = {};
    const state = this.advancedFilterState_;
    const catalog = this.catalogs_[state.catalogIndex];
    const collection = catalog.collections[state.collectionIndex];
    const bbox = this.commonFilters_.bbox || null;
    const datetime = this.commonFilters_.datetime || null;
    catalog.obj.getFilteredItemsAdvanced(collection.id, collection.advancedFilter, bbox, datetime)
      .then((items) => {
        collection.links = items.links;
        if (items.features.length === 0) {
          IDEE.dialog.info(getValue('exception').no_results);
          return;
        }
        this.renderCollectionItems(state.catalogIndex, state.collectionIndex, items);
        this.toggleAdvancedFilters();
      }).catch((err) => {
        IDEE.dialog.error(getValue('advancedFilter.applyError'));
      });
  }

  /**
   * Limpia el filtro avanzado y recarga los ítems sin filtro
   *
   * @private
   * @function
   */
  clearAdvancedFilter() {
    const state = this.advancedFilterState_;
    const catalog = this.catalogs_[state.catalogIndex];
    const collection = catalog.collections[state.collectionIndex];
    collection.advancedFilter = null;
    this.getAdvancedFilterAssistantTextarea().value = '';
    this.getAdvancedFilterQueryTextarea().value = '';
    state.selectedField = null;
    const itemsElement = this.template_.querySelector(`.m-catalogmanager-items.collection-${collection.id}`);
    if (itemsElement && !itemsElement.classList.contains('empty')) {
      this.getItems(state.catalogIndex, state.collectionIndex);
    }
  }

  /**
   * Aplica el filtro de cobertura de nubes desde el slider y lanza la búsqueda avanzada
   *
   * @private
   * @function
   */
  changeCloudCoverFilter() {
    const cloudCoverMin = this.template_.querySelector('#m-catalogmanager-cloudcover-min');
    const cloudCoverMax = this.template_.querySelector('#m-catalogmanager-cloudcover-max');
    const cloudCoverMinValue = cloudCoverMin.value;
    const cloudCoverMaxValue = cloudCoverMax.value;
    this.addFilterTag(`${getValue('filtersTypes.cloudCover.cloudCover')}: ${cloudCoverMinValue}% - ${cloudCoverMaxValue}%`, 'cloud_cover');
    const catalog = this.catalogs_[this.selectedCatalogIndex_];
    const collection = catalog.collections[this.selectedCollectionIndex_];
    const filterObj = {
      'eo:cloud_cover': {
        gte: cloudCoverMinValue,
        lte: cloudCoverMaxValue,
      },
    };
    collection.advancedFilter = {
      format: 'stac-query',
      filter: filterObj,
      limit: 10,
    };
    this.getFilteredItemsAdvanced();
  }

  /**
   * Restablece el slider de cobertura de nubes a 0–100 y elimina el filtro activo
   *
   * @private
   * @function
   */
  resetCloudCoverFilter() {
    const cloudCoverMin = this.template_.querySelector('#m-catalogmanager-cloudcover-min');
    const cloudCoverMax = this.template_.querySelector('#m-catalogmanager-cloudcover-max');
    cloudCoverMin.value = 0;
    cloudCoverMax.value = 100;
    const catalog = this.catalogs_[this.selectedCatalogIndex_];
    const collection = catalog.collections[this.selectedCollectionIndex_];
    delete collection.advancedFilter.filter['eo:cloud_cover'];
    this.syncCloudCoverSliderStyle();
  }

  /**
   * Renderiza la lista de ítems de una colección en el DOM
   *
   * @private
   * @function
   * @param {number} catalogIndex Índice del catálogo
   * @param {number} collectionIndex Índice de la colección
   * @param {Object} items Respuesta STAC con features y links de paginación
   */
  renderCollectionItems(catalogIndex, collectionIndex, items) {
    const catalog = this.catalogs_[catalogIndex];
    const collection = catalog.collections[collectionIndex];
    this.selectedCollectionIndex_ = collectionIndex;
    const container = this.template_.querySelector('#m-catalogmanager-results-content');
    const itemsJson = this.getJsonItems(items.features, catalogIndex, collectionIndex);
    collection.items = itemsJson;
    const downloadable = !catalog.obj.public;
    this.updatePagination(items);
    const html = IDEE.template.compileSync(itemsTemplate, {
      vars: {
        items: itemsJson,
        downloadable,
        hasNotPrev: !this.linksHaveRel(items.links, 'previous'),
        hasNotNext: !this.linksHaveRel(items.links, 'next'),
        collectionTitle: collection.title,
        translations: {
          metadata: getValue('metadata'),
          previous: getValue('previous'),
          next: getValue('next'),
          download: getValue('imageActions.downloadCollection'),
          pagination: getValue('pagination').replace('{0}', this.pagination_.currentPage).replace('{1}', this.pagination_.totalPages),
        },
      },
    });
    const resultsTab = this.template_.querySelector('#m-catalogmanager-results-tab');
    resultsTab.innerHTML = `${getValue('resultsTab')} (${items.numberMatched})`;
    container.innerHTML = html.outerHTML;
    container.classList.remove('empty', 'hidden');
    const extraActionsContent = this.template_.querySelector('#m-catalogmanager-extra-actions-content');
    if (!downloadable && !extraActionsContent.classList.contains('hidden')) {
      extraActionsContent.classList.add('hidden');
    } else if (downloadable) {
      extraActionsContent.classList.remove('hidden');
    }
    const noResultsContent = this.template_.querySelector('#m-catalogmanager-no-results-content');
    if (itemsJson.length === 0) {
      noResultsContent.classList.remove('hidden');
    } else if (!noResultsContent.classList.contains('hidden')) {
      noResultsContent.classList.add('hidden');
    }
    container.querySelector('.m-catalogmanager-ulitems').addEventListener('click', (evt) => this.itemsEvent(evt));
    container.querySelector('.m-catalogmanager-next-items-button').addEventListener('click', (evt) => this.changeItemsPage(evt, 'next'));
    container.querySelector('.m-catalogmanager-prev-items-button').addEventListener('click', (evt) => this.changeItemsPage(evt, 'previous'));
    container.querySelectorAll('.m-catalogmanager-title-item').forEach((item) => {
      item.addEventListener('mouseenter', (evt) => this.applyFocusStyle(evt));
      item.addEventListener('mouseleave', (evt) => this.removeFocusStyle(evt));
    });
    container.querySelectorAll('.m-catalogmanager-images').forEach((imagesContainer) => {
      imagesContainer.addEventListener('mouseenter', (evt) => this.applyFocusStyle(evt));
      imagesContainer.addEventListener('mouseleave', (evt) => this.removeFocusStyle(evt));
    });
    container.querySelector('.m-catalogmanager-section-title').addEventListener('click', (evt) => this.collectionEvent(evt));
    this.previewItems(catalogIndex, collectionIndex, items);
    this.statsRequest();
  }

  /**
   * Actualiza el estado de paginación a partir de la respuesta STAC de ítems
   *
   * @private
   * @function
   * @param {Object} items Respuesta STAC con `numberMatched` y `numberReturned`
   */
  updatePagination(items) {
    this.pagination_.totalItems = items.numberMatched;
    this.pagination_.pageSize = items.numberReturned;
    this.pagination_.totalPages = Math.ceil(
      this.pagination_.totalItems / this.pagination_.pageSize,
    );
  }

  /**
   * Restablece la paginación a sus valores iniciales
   *
   * @private
   * @function
   */
  resetPagination() {
    this.pagination_.currentPage = 1;
    this.pagination_.totalPages = 1;
    this.pagination_.pageSize = 10;
    this.pagination_.totalItems = 0;
  }

  /**
   * Divide un array en páginas de tamaño fijo
   *
   * @private
   * @function
   * @param {Array} items Lista de elementos a paginar
   * @returns {Array<Array>} Lista de páginas
   */
  spliteList(items) {
    const pageSize = 5;
    const pages = [];
    let firstItem = 0;
    while (firstItem < items.length) {
      const newPage = [];
      for (let i = firstItem; i < firstItem + pageSize && i < items.length; i += 1) {
        if (items[i] !== undefined) {
          newPage.push(items[i]);
        }
      }
      pages.push(newPage);
      firstItem += pageSize;
    }
    return pages.length > 0 ? pages : [[]];
  }

  /**
   * Alterna la visibilidad entre el listado principal y el filtro avanzado
   *
   * @private
   * @function
   */
  toggleAdvancedFilters() {
    /* const commonFiltersBtn = this.template_.querySelector('#m-catalogmanager-filters');
    const sections = this.template_.querySelectorAll('section.m-catalogmanager-content');
    sections.forEach((section) => {
      if (!(section.id === 'm-catalogmanager-filters-content' &&
        !commonFiltersBtn.classList.contains('active'))) {
        this.toggleHidden(section);
      }
    }); */
    const advancedFiltersContent = this.template_.querySelector('#m-catalogmanager-advanced-filters');
    advancedFiltersContent.classList.remove('hidden');
  }

  /**
   * Personaliza el texto del botón de cierre del modal informativo
   *
   * @private
   * @function
   */
  changeCloseButtonModal() {
    const button = document.querySelector(BT_CLOSE_MODAL);
    button.innerHTML = getValue('close');
  }

  /**
   * Oculta el botón de cierre del modal informativo activo
   *
   * @private
   * @function
   */
  hideCloseButtonModal() {
    const button = document.querySelector(BT_CLOSE_MODAL);
    button.classList.add('hidden');
  }

  /**
   * Añade un catálogo STAC desde el formulario del modal
   *
   * @private
   * @function
   */
  async addCatalog() {
    const title = document.querySelector('.m-catalogmanager-add-panel #title').value;
    const url = document.querySelector('.m-catalogmanager-add-panel #catalog-url').value;
    const publicValue = document.querySelector('.m-catalogmanager-add-panel #cat-public').checked;
    const authUrl = document.querySelector('.m-catalogmanager-add-panel #auth-url').value;
    const collectionsUrl = document.querySelector('.m-catalogmanager-add-panel #collections-url').value;
    const user = document.querySelector('.m-catalogmanager-add-panel #user').value;
    const password = document.querySelector('.m-catalogmanager-add-panel #password').value;

    try {
      const catalog = new IDEE.stac.Catalog({
        title,
        url,
        public: publicValue,
        authUrl,
        collectionsUrl,
      });
      if (!publicValue) {
        await catalog.authenticate(user, password);
      }
      this.catalogs_.push(this.getJsonCatalog(catalog));
      this.closeDialog();
      this.renderCatalogs();
    } catch (error) {
      console.error(error.message);
    }
  }

  /**
   * Abre un modal con los metadatos de un ítem STAC
   *
   * @private
   * @function
   * @param {number} catalogIndex Índice del catálogo
   * @param {number} collectionIndex Índice de la colección
   * @param {string} itemId Identificador del ítem
   */
  openItemInfo(catalogIndex, collectionIndex, itemId) {
    const catalog = this.catalogs_[catalogIndex];
    const collection = catalog.collections[collectionIndex];
    const item = collection.items.find((it) => it.id === itemId);
    const sunElevationValue = item.properties['view:sun_elevation'];
    const cloudCoverValue = item.properties['eo:cloud_cover'];
    const vars = {
      id: item.id,
      collectionId: collection.id,
      datetime: item.properties.datetime,
      provider: item.properties.provider || getValue('unknown'),
      extent: item.bbox.join(', '),
      crs: 'EPSG:4326',
      platform: item.properties.platform || getValue('unknown'),
      instruments: item.properties.instruments.join(', '),
      sunElevation: sunElevationValue >= 0,
      sunElevationValue,
      cloudCover: cloudCoverValue >= 0,
      cloudCoverValue,
      processingLevel: item.properties['processing:level'] || getValue('unknown'),
      translations: getValue('itemMetadata'),
    };
    const metadataTemplate = IDEE.template.compileSync(itemMetadataTemplate, {
      jsonp: true,
      parseToHtml: false,
      vars,
    });
    IDEE.dialog.info(metadataTemplate, getValue('itemMetadata.title'), this.order);
    this.changeCloseButtonModal();
  }

  /**
   * Abre un modal con los metadatos de una colección STAC
   *
   * @private
   * @function
   * @param {number} catalogIndex Índice del catálogo
   * @param {number} collectionIndex Índice de la colección
   */
  openCollectionInfo(catalogIndex, collectionIndex) {
    const catalog = this.catalogs_[catalogIndex];
    const collection = catalog.collections[collectionIndex];
    const infoTemplate = IDEE.template.compileSync(collectionMetadataTemplate, {
      jsonp: true,
      parseToHtml: false,
      vars: {
        metadata: collection.metadata,
        translations: getValue('collectionMetadata'),
      },
    });
    IDEE.dialog.info(infoTemplate, getValue('collectionMetadata.title'), this.order);
    this.changeCloseButtonModal();
  }

  /**
   * Muestra u oculta los campos de autenticación según el checkbox público
   *
   * @private
   * @function
   */
  togglePublic() {
    const publicValue = document.querySelector('.m-catalogmanager-add-panel #cat-public').checked;
    if (publicValue) {
      document.querySelector('.m-catalogmanager-add-panel .private-data').classList.add('hidden');
    } else {
      document.querySelector('.m-catalogmanager-add-panel .private-data').classList.remove('hidden');
    }
  }

  /**
   * Renderiza la lista de catálogos en el panel principal
   *
   * @private
   * @function
   */
  renderCatalogs() {
    if (this.catalogs_.length <= 1) {
      return;
    }
    const contentElement = this.template_.querySelector('#m-catalogmanager-filters-catalogs');
    const translations = {
      catalogs: getValue('catalogs'),
      public: getValue('cat_public'),
      private: getValue('private'),
    };
    const html = IDEE.template.compileSync(contentTemplate, {
      vars: {
        catalogs: this.catalogs_,
        translations,
      },
    });
    contentElement.innerHTML = html.innerHTML;
    contentElement.querySelector('#m-catalogmanager-filters-catalogs-content').addEventListener('change', (evt) => this.catalogEvent(evt));
  }

  /**
   * Crea la representación JSON interna de un catálogo STAC
   *
   * @private
   * @function
   * @param {IDEE.stac.Catalog} catalog Instancia del catálogo STAC
   * @returns {Object} Objeto catálogo con metadatos y referencia al objeto STAC
   */
  getJsonCatalog(catalog) {
    const index = this.catalogs_.length;
    return {
      index,
      title: catalog.title,
      public: catalog.public,
      obj: catalog,
      collections: [],
    };
  }

  /**
   * Inicializa las colecciones del catálogo seleccionado en el contenedor de la UI
   *
   * @private
   * @function
   */
  initCollections() {
    const collectionsElement = this.template_.querySelector('#m-catalogmanager-filters-collections-content');
    this.getCollections(this.selectedCatalogIndex_, collectionsElement);
  }

  /**
   * Gestiona el clic en un catálogo para expandir o contraer sus colecciones
   *
   * @private
   * @function
   * @param {Event} evt Evento de clic en el listado de catálogos
   */
  catalogEvent(evt) {
    evt.stopPropagation();
    const catalogIndex = evt.target.value;
    this.selectedCatalogIndex_ = catalogIndex;
    const collectionsElement = this.template_.querySelector('#m-catalogmanager-filters-collections-content');
    this.getCollections(catalogIndex, collectionsElement);
    this.template_.querySelector('#m-catalogmanager-filters-advanced').innerHTML = '';
    this.template_.querySelector('#m-catalogmanager-results-content').innerHTML = '';
  }

  /**
   * Obtiene y renderiza las colecciones de un catálogo STAC
   *
   * @private
   * @function
   * @param {number} catalogIndex Índice del catálogo
   * @param {HTMLElement} collectionsElement Contenedor DOM de las colecciones
   */
  getCollections(catalogIndex, collectionsElement) {
    this.resetCachedElements();
    const catalog = this.catalogs_[catalogIndex];
    if (!catalog.obj.public && IDEE.utils.isNullOrEmpty(catalog.obj.token)) {
      const callback = () => this.requestCollections(collectionsElement);
      this.openLogin(callback);
    } else {
      this.requestCollections(collectionsElement);
    }
  }

  /**
   * Solicita las colecciones del catálogo seleccionado y las renderiza en el contenedor
   *
   * @private
   * @function
   * @param {HTMLElement} collectionsElement Contenedor DOM donde se pintan las colecciones
   */
  requestCollections(collectionsElement) {
    const catalog = this.catalogs_[this.selectedCatalogIndex_];
    catalog.obj.getCollections().then((collections) => {
      const collectionsJson = this.getJsonCollections(collections, this.selectedCatalogIndex_);
      catalog.collections = collectionsJson;
      this.sortCollections(this.collectionsSortType_);
    });
  }

  /**
   * Renderiza el listado de colecciones en el contenedor indicado
   *
   * @private
   * @function
   * @param {HTMLElement} collectionsElement Contenedor DOM de las colecciones
   * @param {Array<Object>} collections Colecciones a pintar
   */
  renderCollections(collectionsElement, collections) {
    const container = collectionsElement;
    const html = IDEE.template.compileSync(collectionsTemplate, {
      vars: {
        collections,
        translations: {
          footprint: getValue('footprint'),
          metadata: getValue('metadata'),
          advancedFilters: getValue('advancedFilters'),
          sort: getValue('sort'),
        },
      },
    });
    container.innerHTML = html.outerHTML;
    container.classList.remove('empty');
    container.querySelector('.m-catalogmanager-collections-container').addEventListener('click', (evt) => this.collectionEvent(evt));
    container.querySelector(`#${this.collectionsSortType_}`).classList.add('active');
  }

  /**
   * Ordena las colecciones del catálogo seleccionado y las vuelve a renderizar
   *
   * @private
   * @function
   * @param {string} sortType Criterio de orden (`sort-name-up`, `sort-name-down`,
   * `sort-date-up` o `sort-date-down`)
   */
  sortCollections(sortType) {
    const collections = this.catalogs_[this.selectedCatalogIndex_].collections;
    this.collectionsSortType_ = sortType;
    let sortFunction = null;
    switch (sortType) {
      case 'sort-name-up':
        sortFunction = (a, b) => a.title.localeCompare(b.title);
        break;
      case 'sort-name-down':
        sortFunction = (a, b) => b.title.localeCompare(a.title);
        break;
      case 'sort-date-up':
        sortFunction = (a, b) => a.metadata.extent.temporal.interval
          .localeCompare(b.metadata.extent.temporal.interval);
        break;
      case 'sort-date-down':
        sortFunction = (a, b) => b.metadata.extent.temporal.interval
          .localeCompare(a.metadata.extent.temporal.interval);
        break;
      default:
        sortFunction = (a, b) => a.title.localeCompare(b.title);
        break;
    }
    collections.sort(sortFunction);
    collections.forEach((c, index) => {
      const collection = c;
      if (collection.index === this.selectedCollectionIndex_) {
        this.selectedCollectionIndex_ = index;
      }
      collection.index = index;
    });
    const container = this.template_.querySelector('#m-catalogmanager-filters-collections-content');
    this.renderCollections(container, collections);
  }

  /**
   * Transforma las colecciones STAC en objetos JSON internos
   *
   * @private
   * @function
   * @param {Array<Object>} collections Colecciones devueltas por la API STAC
   * @param {number} catalogIndex Índice del catálogo padre
   * @returns {Array<Object>} Lista de colecciones con metadatos internos
   */
  getJsonCollections(collections, catalogIndex) {
    return collections.map((collection, index) => {
      const metadata = {
        extent: collection.extent,
        license: collection.license,
        summaries: collection.summaries,
        description: collection.description,
        stacVersion: collection.stac_version,
      };
      if (metadata.extent?.spatial?.bbox) {
        metadata.extent.spatial.bbox = metadata.extent.spatial.bbox.map((bbox) => bbox.join(', ')).join(' / ');
      }
      if (metadata.extent?.temporal?.interval) {
        metadata.extent.temporal.interval = metadata.extent.temporal.interval.map((interval) => interval.join(' / ')).join(', ');
      }
      if (!metadata.summaries) {
        metadata.summaries = {};
      }
      if (metadata.summaries.platform) {
        metadata.summaries.platform = metadata.summaries.platform.join(', ');
      } else {
        metadata.summaries.platform = getValue('unknown');
      }
      if (metadata.summaries.instruments) {
        metadata.summaries.instruments = metadata.summaries.instruments.join(', ');
      } else {
        metadata.summaries.instruments = getValue('unknown');
      }
      return {
        index,
        id: collection.id,
        title: collection.title,
        metadata,
        catalogIndex,
        layer: null,
        items: [],
        advancedFilter: null,
      };
    });
  }

  /**
   * Gestiona el clic en una colección (ítems, huella o filtro avanzado)
   *
   * @private
   * @function
   * @param {Event} evt Evento de clic en el listado de colecciones
   */
  collectionEvent(evt) {
    evt.stopPropagation();
    let target = evt.target;
    if (target.tagName === 'SPAN') {
      target = target.parentElement;
    } /* else if (target.tagName === 'BUTTON') {
      target = target;
    } */
    const catalogIndex = target.dataset.catalogIndex;
    const collectionIndex = target.dataset.collectionIndex;
    if (target.classList.contains('no-event')) {
      return;
    }
    if (target.classList.contains('m-catalogmanager-info-button')) {
      this.openCollectionInfo(this.selectedCatalogIndex_, this.selectedCollectionIndex_);
      return;
    }
    if (target.classList.contains('m-catalogmanager-download-button')) {
      this.collectionDownload(this.selectedCatalogIndex_, this.selectedCollectionIndex_);
      return;
    }
    if (target.classList.contains('m-catalogmanager-collections-order-button')) {
      if (!target.classList.contains('active')) {
        const activeButton = this.template_.querySelector('.m-catalogmanager-collections-order-button.active');
        if (activeButton) {
          activeButton.classList.remove('active');
        }
        target.classList.add('active');
        this.sortCollections(target.id);
      }
      return;
    }
    this.resetPagination();
    this.resetCachedElements();
    if (target.classList.contains('active')) {
      target.classList.remove('active');
      const itemsElement = this.template_.querySelector('#m-catalogmanager-results-content');
      itemsElement.innerHTML = '';
      this.catalogs_[catalogIndex].collections[this.selectedCollectionIndex_].selected = false;
      this.selectedCollectionIndex_ = -1;
      this.resetFilterTag('collection');
      const resultsTab = this.template_.querySelector('#m-catalogmanager-results-tab');
      resultsTab.innerHTML = `${getValue('resultsTab')} (0)`;
    } else {
      if (this.selectedCollectionIndex_ >= 0) {
        this.catalogs_[catalogIndex].collections[this.selectedCollectionIndex_].selected = false;
      }
      this.selectedCollectionIndex_ = collectionIndex;
      const collectionElements = this.template_.querySelectorAll('.m-catalogmanager-title-collection');
      collectionElements.forEach((element) => {
        element.classList.remove('active');
      });
      target.classList.add('active');
      this.catalogs_[catalogIndex].collections[this.selectedCollectionIndex_].selected = true;
      this.addFilterTag(`${this.catalogs_[catalogIndex].collections[collectionIndex].title}`, 'collection');
      this.openAdvancedFilters(catalogIndex, collectionIndex);
      this.getItems(catalogIndex, collectionIndex);
    }
  }

  /**
   * Obtiene y renderiza los ítems de una colección aplicando filtros activos
   *
   * @private
   * @function
   * @param {number} catalogIndex Índice del catálogo
   * @param {number} collectionIndex Índice de la colección
   */
  getItems(catalogIndex, collectionIndex) {
    this.selectedItems_ = [];
    this.selectedImages_ = {};
    const catalog = this.catalogs_[catalogIndex];
    const collection = catalog.collections[collectionIndex];
    let promise = null;
    const bbox = this.commonFilters_.bbox || null;
    const datetime = this.commonFilters_.datetime || null;
    if (collection.advancedFilter) {
      promise = catalog.obj
        .getFilteredItemsAdvanced(collection.id, collection.advancedFilter, bbox, datetime);
    } else if (!IDEE.utils.isNullOrEmpty(this.commonFilters_)) {
      promise = catalog.obj.getFilteredItems(collection.id, this.commonFilters_);
    } else {
      promise = catalog.obj.getItems(collection.id);
    }
    promise.then((items) => {
      collection.links = items.links;
      this.renderCollectionItems(catalogIndex, collectionIndex, items);
    });
  }

  /**
   * Navega entre páginas de ítems usando los enlaces de paginación STAC
   *
   * @private
   * @function
   * @param {Event} event Evento de clic en botón de paginación
   * @param {string} rel Relación del enlace STAC ('next' o 'previous')
   */
  changeItemsPage(event, rel) {
    event.stopPropagation();
    const catalogIndex = this.selectedCatalogIndex_;
    const collectionIndex = this.selectedCollectionIndex_;
    const catalog = this.catalogs_[catalogIndex];
    const collection = catalog.collections[collectionIndex];
    let promise = null;
    if (collection.advancedFilter) {
      promise = catalog.obj.getFilteredItemsAdvancedByLinks(collection.links, rel);
    } else {
      promise = catalog.obj.getItemsByLinks(collection.links, rel);
    }
    promise.then((items) => {
      collection.links = items.links;
      if (items.features.length === 0) {
        IDEE.dialog.info(getValue('exception').no_results);
        return;
      }
      if (rel === 'next') {
        this.pagination_.currentPage += 1;
      } else {
        this.pagination_.currentPage -= 1;
      }
      this.renderCollectionItems(catalogIndex, collectionIndex, items);
    });
  }

  /**
   * Transforma los ítems STAC en objetos JSON internos para la plantilla
   *
   * @private
   * @function
   * @param {Array<Object>} items Features STAC
   * @param {number} catalogIndex Índice del catálogo
   * @param {number} collectionIndex Índice de la colección
   * @returns {Array<Object>} Lista de ítems con metadatos internos
   */
  getJsonItems(items, catalogIndex, collectionIndex) {
    return items.map((item, index) => {
      return {
        index,
        id: item.id,
        collectionIndex,
        catalogIndex,
        properties: item.properties,
        bbox: item.bbox,
        selected: this.selectedItems_.includes(item.id),
      };
    });
  }

  /**
   * Gestiona el clic en un ítem (metadatos o imágenes)
   *
   * @private
   * @function
   * @param {Event} evt Evento de clic en el listado de ítems
   */
  itemsEvent(evt) {
    evt.stopPropagation();
    const target = evt.target;
    if (target.classList.contains('m-catalogmanager-checkbox-item')) {
      this.changeSelectedItems(target);
      return;
    }
    const itemDiv = this.findParentByClass(evt.target, 'm-catalogmanager-title-item');
    const catalogIndex = itemDiv.dataset.catalogIndex;
    const collectionIndex = itemDiv.dataset.collectionIndex;
    const itemId = itemDiv.dataset.itemId;
    if (target.classList.contains('m-catalogmanager-info-button')) {
      this.openItemInfo(catalogIndex, collectionIndex, itemId);
    } else {
      const imagesElement = this.template_.querySelector(`.m-catalogmanager-images.item-${itemId}`);
      if (imagesElement.classList.contains('empty')) {
        this.getItemImages(catalogIndex, collectionIndex, itemId, imagesElement);
      }
      this.toggleIcon(itemDiv);
      this.toggleHidden(imagesElement);
    }
    this.statsRequest(itemId);
  }

  /**
   * Gestiona la selección de un ítem en el mapa y abre su diálogo de imágenes
   *
   * @private
   * @function
   * @param {string} itemId Identificador del ítem STAC seleccionado
   */
  onItemSelect(itemId) {
    const itemElement = this.template_.querySelector(`#item-${itemId}`);
    const catalogIndex = itemElement.dataset.catalogIndex;
    const collectionIndex = itemElement.dataset.collectionIndex;
    const imagesElement = this.template_.querySelector(`.m-catalogmanager-images.item-${itemId}`);
    const resultsTab = this.template_.querySelector('#m-catalogmanager-results-tab');
    if (!resultsTab.classList.contains('active')) {
      this.changeTab(resultsTab);
    }
    if (imagesElement.classList.contains('empty')) {
      this.getItemImages(catalogIndex, collectionIndex, itemId, imagesElement, true);
    } else if (imagesElement.classList.contains('hidden')) {
      this.closeAllImages();
      this.toggleIcon(itemElement);
      this.toggleHidden(imagesElement);
    }
  }

  /**
   * Gestiona el hover de un ítem STAC en el mapa
   *
   * @private
   * @function
   * @param {string} itemId Identificador del ítem STAC seleccionado
   */
  onItemHover(itemId) {
    const itemDiv = document.querySelector(`#item-${itemId}`);
    if (itemDiv) {
      const catalogIndex = itemDiv.dataset.catalogIndex;
      const collectionIndex = itemDiv.dataset.collectionIndex;
      const collection = this.catalogs_[catalogIndex].collections[collectionIndex];
      this.applyFocusStyleToLayer(collection, itemId);
    }
    this.applyFocusStyleToItem(itemId);
  }

  /**
   * Obtiene y renderiza las imágenes TIFF de un ítem STAC
   *
   * @private
   * @function
   * @param {number} catalogIndex Índice del catálogo
   * @param {number} collectionIndex Índice de la colección
   * @param {string} itemId Identificador del ítem
   * @param {HTMLElement|null} imagesElement Contenedor DOM de las imágenes
   * @param {boolean} [openDialog=false] Si es verdadero, abre un modal con las imágenes
   */
  getItemImages(catalogIndex, collectionIndex, itemId, imagesElement, closeAll = false) {
    const catalog = this.catalogs_[catalogIndex];
    const collection = catalog.collections[collectionIndex];
    catalog.obj.getItem(collection.id, itemId).then((item) => {
      let assetsKeys = Object.keys(item.assets);
      assetsKeys = assetsKeys.filter((key) => item.assets[key].type.includes('image/tif'));
      const container = imagesElement;
      let content = '';
      let html = null;
      if (assetsKeys.length === 0) {
        content = `<div class="m-catalogmanager-no-images">${getValue('no_images')}</div>`;
      } else {
        const images = assetsKeys.map((key) => {
          return {
            key,
            itemId,
            collectionIndex,
            catalogIndex,
            title: item.assets[key].title,
          };
        });
        html = IDEE.template.compileSync(imagesTemplate, {
          vars: {
            images,
            downloadable: !catalog.obj.public,
            showCheckbox: !catalog.obj.public,
            translations: {
              imageActions: getValue('imageActions'),
              images: getValue('images'),
              actions: getValue('actions'),
            },
          },
        });
      }
      if (closeAll) {
        this.closeAllImages();
      }
      if (html) {
        html.addEventListener('click', (evt) => this.imagesEvent(evt));
        container.appendChild(html);
      } else {
        container.innerHTML = content;
      }
      container.classList.remove('empty');
      container.classList.remove('hidden');
      // }
    });
  }

  /**
   * Contrae todos los paneles de imágenes de ítems abiertos en el listado de resultados
   *
   * @private
   * @function
   */
  closeAllImages() {
    document.querySelectorAll('.m-catalogmanager-images').forEach((element) => {
      if (!element.classList.contains('hidden')) {
        const itemDiv = element.parentElement.firstElementChild;
        this.toggleIcon(itemDiv);
        this.toggleHidden(element);
      }
    });
  }

  /**
   * Gestiona acciones sobre una imagen (previsualizar o descargar)
   *
   * @private
   * @function
   * @param {Event} evt Evento de clic en el listado de imágenes
   */
  imagesEvent(evt) {
    evt.stopPropagation();
    const target = evt.target;
    if (target.classList.contains('m-catalogmanager-checkbox-image')) {
      this.changeSelectedImages(target);
      return;
    }
    const imageDiv = this.findParentByClass(target, 'm-catalogmanager-title-image');
    const imageKey = imageDiv.dataset.imageKey;
    const collectionIndex = imageDiv.dataset.collectionIndex;
    const catalogIndex = imageDiv.dataset.catalogIndex;
    const itemId = imageDiv.dataset.itemId;
    const catalog = this.catalogs_[catalogIndex];
    const collection = catalog.collections[collectionIndex];
    let operator = 'view';
    if (target.classList.contains('m-catalogmanager-preview-button')) {
      this.closeDialog();
      catalog.obj.getItem(collection.id, itemId).then((item) => {
        const asset = item.assets[imageKey];
        this.drawImageTiff(asset, catalog, collection, item);
        const itemBbox = item.bbox;
        this.map_.setBbox(this.getImpl().transformExtent(itemBbox, 'EPSG:4326', this.map_.getProjection().code));
      });
    } else if (target.classList.contains('m-catalogmanager-download-button')) {
      this.closeDialog();
      operator = 'download';
      catalog.obj.getItem(collection.id, itemId).then((item) => {
        const asset = item.assets[imageKey];
        window.open(asset.href, '_blank');
      });
    }
    this.statsRequest(itemId, imageKey, operator);
  }

  /**
   * Añade una capa GeoTIFF al mapa dentro del grupo de capas del catálogo
   *
   * @private
   * @function
   * @param {Object} image Asset STAC con href y title de la imagen
   * @param {Object} cat Objeto catálogo interno
   * @param {Object} coll Objeto colección interno
   */
  drawImageTiff(image, cat, coll, item) {
    // const catalog = cat;
    const collection = coll;
    const styleSpec = this.resolveStyleSpec(image);
    const style = this.buildRasterStyle(styleSpec);
    const normalize = IDEE.utils.isNullOrEmpty(styleSpec.indice);
    const convertToRGB = styleSpec.convertToRGB;
    const geotiff = new IDEE.layer.GeoTIFF({
      url: image.href,
      name: image.title,
      legend: image.title,
    }, {
      convertToRGB,
      normalize,
      style,
    });
    /* if (!catalog.layerGroup) {
      catalog.layerGroup = new IDEE.layer.LayerGroup({
        name: catalog.title,
        legend: catalog.title,
      });
      this.map_.addLayerGroups(catalog.layerGroup);
    } */
    if (!collection.layerGroup) {
      collection.layerGroup = new IDEE.layer.LayerGroup({
        name: collection.id,
        legend: collection.title,
      });
      // catalog.layerGroup.addLayers(collection.layerGroup);
      this.map_.addLayerGroups(collection.layerGroup);
    }
    let itemLayer = collection.layerGroup.getLayers()
      .find((l) => l.type === 'LayerGroup' && l.name === item.id);
    if (!itemLayer) {
      itemLayer = new IDEE.layer.LayerGroup({
        name: item.id,
        legend: item.title,
      });
      collection.layerGroup.addLayers(itemLayer);
    }

    const oldLayer = collection.layerGroup.getLayers()
      .find((layer) => layer.legend === geotiff.getLegend());
    if (oldLayer) {
      collection.layerGroup.removeLayers(oldLayer);
    }
    /* geotiff.on('load', () => {
      this.map_.setBbox(geotiff.getMaxExtent());
    }); */
    const oldGeotiff = itemLayer.getLayers()
      .find((l) => l.name === geotiff.name);
    if (!oldGeotiff) {
      itemLayer.addLayers(geotiff);
    }
  }

  /**
   * Muestra la huella (footprint) de los ítems de una colección en el mapa
   *
   * @private
   * @function
   * @param {number} catalogIndex Índice del catálogo
   * @param {number} collectionIndex Índice de la colección
   * @param {Array<Object>} items Ítems STAC (Features) cuyas huellas se visualizan
   */
  previewItems(catalogIndex, collectionIndex, items) {
    const catalog = this.catalogs_[catalogIndex];
    /* if (!catalog.layerGroup) {
      catalog.layerGroup = new IDEE.layer.LayerGroup({
        name: catalog.title,
        legend: catalog.title,
      });
      this.map_.addLayerGroups(catalog.layerGroup);
    } */
    const collection = catalog.collections[collectionIndex];

    if (items.features.length === 0) {
      IDEE.dialog.info(getValue('exception').no_results);
    }
    if (!collection.layerGroup) {
      // Puede perderse la asignación del layerGroup al cambiar de colección,
      // por lo que se debe buscar el layerGroup anterior y se asigna de nuevo
      // const previousGroup = catalog.layerGroup.getLayers()
      const previousGroup = this.map_.getLayerGroup()
        .find((l) => l.name === collection.id);
      if (previousGroup) {
        collection.layerGroup = previousGroup;
      } else {
        collection.layerGroup = new IDEE.layer.LayerGroup({
          name: collection.id,
          legend: collection.title,
        });
        // catalog.layerGroup.addLayers(collection.layerGroup);
        this.map_.addLayerGroups(collection.layerGroup);
      }
    }
    this.hideFootprintLayers();
    let huella = this.getHuellaLayer(collection);
    if (huella) {
      huella.setSource(items);
      huella.setVisible(true);
    } else {
      huella = new IDEE.layer.GeoJSON({
        name: collection.id,
        legend: 'Huella',
        source: items,
        extract: true,
      });
      huella.on('load', () => {
        if (huella.getFeatures().length > 0) {
          this.map_.setBbox(huella.getFeaturesExtent());
        } else if (this.commonFilters_.bbox) {
          this.map_.setBbox(this.getImpl().transformExtent(this.commonFilters_.bbox, 'EPSG:4326', this.map_.getProjection().code));
        }
      });
      huella.setStyle(HUELLA_STYLE);
      collection.layerGroup.addLayers(huella);
      this.footprintLayers_.push(huella);
    }
    this.getImpl().addLayerToSelectItem(huella.getImpl().getLayer());
  }

  /**
   * Oculta todas las capas de huella (footprint) almacenadas en el control
   *
   * @private
   * @function
   */
  hideFootprintLayers() {
    this.footprintLayers_.forEach((layer) => {
      layer.setVisible(false);
    });
  }

  /**
   * Actualiza el listado de ítems
   *
   * @private
   * @function
   */
  updateItems(updateFilters = false) {
    console.log('Actualizando elementos');
    if (this.selectedCatalogIndex_ === -1 || this.selectedCollectionIndex_ === -1) {
      return;
    }
    if (updateFilters) {
      console.log('Actualizando filtros');
      this.updateBboxFilter();
      this.updateTemporalFilter();
    }
    this.getItems(this.selectedCatalogIndex_, this.selectedCollectionIndex_);
  }

  /**
   * Actualiza el filtro espacial si está activo el modo de extensión de vista
   *
   * @private
   * @function
   */
  updateBboxFilter() {
    const btnView = this.template_.querySelector('#m-catalogmanager-filters-spatial-predefined #view');
    if (btnView && btnView.classList.contains('active')) {
      const bbox = this.map_.getBbox();
      const extent = [bbox.x.min, bbox.y.min, bbox.x.max, bbox.y.max];
      this.setSpatialFilterByExtent(this.getImpl().transformExtent(extent, this.map_.getProjection().code, 'EPSG:4326'));
    }
  }

  /**
   * Actualiza el filtro temporal si está activo el modo de rango personalizado
   *
   * @private
   * @function
   */
  updateTemporalFilter() {
    const btnRange = this.template_.querySelector('#m-catalogmanager-filters-temporal-predefined #range');
    if (btnRange && btnRange.classList.contains('active')) {
      this.setTemporalFilterByType('range');
    }
  }

  /**
   * Actualiza el filtro temporal al cerrar una etiqueta de inicio o fin de rango
   *
   * @private
   * @function
   * @param {string} tag Identificador de la etiqueta (`temporal_start` o `temporal_end`)
   */
  updateTemporalFilterByTag(tag) {
    const dateType = tag.startsWith('temporal_') ? tag.split('_')[1] : null;
    const dateFilter = this.commonFilters_.datetime.split('/');
    if (dateType === 'start') {
      dateFilter[0] = '..';
    } else if (dateType === 'end') {
      dateFilter[1] = '..';
    }
    if (dateFilter[0] === '..' && dateFilter[1] === '..') {
      delete this.commonFilters_.datetime;
    } else {
      this.commonFilters_.datetime = dateFilter.join('/');
    }
  }

  /**
   * Obtiene la capa de huella (footprint) de una colección
   *
   * @private
   * @function
   * @param {Object} collection Objeto de colección con layerGroup
   * @returns {IDEE.layer.Vector|undefined} Capa de huella o indefinido si no existe
   */
  getHuellaLayer(collection) {
    const collectionLayerGroup = collection.layerGroup;
    if (!collectionLayerGroup) {
      return;
    }
    return collectionLayerGroup.getLayers().find((layer) => layer.legend === 'Huella');
  }

  /**
   * Resalta en el mapa la huella del ítem bajo el cursor
   *
   * @private
   * @function
   * @param {Event} evt Evento mouseenter sobre el título del ítem
   */
  applyFocusStyle(evt) {
    evt.stopPropagation();
    let target = evt.target;
    if (target.classList.contains('m-catalogmanager-images')) {
      target = target.parentElement.firstElementChild;
    }
    const catalogIndex = target.dataset.catalogIndex;
    const collectionIndex = target.dataset.collectionIndex;
    const itemId = target.dataset.itemId;
    const collection = this.catalogs_[catalogIndex].collections[collectionIndex];
    this.applyFocusStyleToLayer(collection, itemId);
    this.applyFocusStyleToItem(itemId);
  }

  /**
   * Aplica el estilo de foco a la feature de huella del ítem indicado
   *
   * @private
   * @function
   * @param {Object} collection Colección que contiene la capa de huella
   * @param {string} itemId Identificador del ítem a resaltar
   */
  applyFocusStyleToLayer(collection, itemId) {
    const huella = this.getHuellaLayer(collection);
    if (!huella) {
      return;
    }
    this.clearFocusStyleFromLayer(huella);
    const itemFeature = huella.getFeatureById(itemId);
    if (itemFeature) {
      itemFeature.setStyle(this.focusStyle_);
    }
  }

  /**
   * Marca como activo en la UI el título del ítem indicado
   *
   * @private
   * @function
   * @param {string} itemId Identificador del ítem a resaltar
   */
  applyFocusStyleToItem(itemId) {
    const itemElement = this.template_.querySelector(`#item-${itemId}`);
    if (itemElement) {
      document.querySelectorAll('.m-catalogmanager-title-item').forEach((element) => {
        element.classList.remove('active');
      });
      itemElement.classList.add('active');
    }
  }

  /**
   * Elimina el resaltado de huella al salir del ítem con el cursor
   *
   * @private
   * @function
   * @param {Event} evt Evento mouseleave sobre el título del ítem
   */
  removeFocusStyle(evt) {
    evt.stopPropagation();
    let target = evt.target;
    if (target.classList.contains('m-catalogmanager-images')) {
      target = target.parentElement.firstElementChild;
    }
    const catalogIndex = target.dataset.catalogIndex;
    const collectionIndex = target.dataset.collectionIndex;
    const collection = this.catalogs_[catalogIndex].collections[collectionIndex];
    const huella = this.getHuellaLayer(collection);
    if (!huella) {
      return;
    }
    this.clearFocusStyleFromLayer(huella);
    this.clearFocusStyleFromItem(target.dataset.itemId);
  }

  /**
   * Restablece el estilo por defecto de la feature con resaltado activo
   *
   * @private
   * @function
   * @param {IDEE.layer.Vector} huellaLayer Capa de huella de la colección
   */
  clearFocusStyleFromLayer(huellaLayer) {
    const focusFeature = huellaLayer.getFeatures().find((feature) => feature.getStyle() !== null);
    if (focusFeature) {
      focusFeature.setStyle(null);
    }
  }

  /**
   * Quita la clase activa del título del ítem indicado en el listado
   *
   * @private
   * @function
   * @param {string} itemId Identificador del ítem
   */
  clearFocusStyleFromItem(itemId) {
    const itemElement = this.template_.querySelector(`#item-${itemId}`);
    if (itemElement) {
      itemElement.classList.remove('active');
    }
  }

  /**
   * Busca el ancestro DOM más cercano que contenga una clase CSS dada
   *
   * @private
   * @function
   * @param {HTMLElement} elem Elemento de partida
   * @param {string} className Nombre de la clase a buscar
   * @returns {HTMLElement|null} Elemento ancestro encontrado o null
   */
  findParentByClass(elem, className) {
    let parent = elem;
    while (parent && !parent.classList.contains(className)) {
      parent = parent.parentElement;
    }
    return parent;
  }

  /**
   * Comprueba si existe un enlace STAC con la relación indicada
   *
   * @private
   * @function
   * @param {Array<Object>} links Enlaces de paginación STAC
   * @param {string} rel Relación del enlace ('next', 'previous', 'self', etc.)
   * @returns {boolean} true si existe el enlace con esa relación
   */
  linksHaveRel(links, rel) {
    return links.some((link) => link.rel === rel);
  }

  /**
   * Mapea bandas espectrales a índices RGB por common_name
   *
   * @private
   * @function
   * @param {Array<Object>} eoBands Bandas espectrales del asset
   * @param {Array<string>} channelNames Nombres de canal ('red', 'green', 'blue')
   * @returns {{r: number, g: number, b: number}|null} Índices de bandas o null si no se encuentran
   */
  mapBandsByCommonName(eoBands, channelNames) {
    const indices = {};
    const bandsNumber = {
      gray: 1,
      red: 1,
      green: 2,
      blue: 3,
    };
    eoBands.forEach((band, i) => {
      const key = band.common_name?.toLowerCase();
      if (key) {
        indices[key] = bandsNumber[key];
      }
    });
    const [redName, greenName, blueName] = channelNames;
    const r = indices[redName];
    const g = indices[greenName];
    const b = indices[blueName];
    if (r && g && b) {
      return [r, g, b];
    }
    return null;
  }

  /**
   * Combina los metadatos de bandas STAC (eo:bands, raster:bands, bands)
   *
   * @private
   * @function
   * @param {Object} asset Asset STAC
   * @returns {Array<Object>} Bandas unificadas por índice
   */
  getAssetBands(asset) {
    const eoBands = asset['eo:bands'];
    const rasterBands = asset['raster:bands'];
    const bands = asset.bands;

    if (Array.isArray(bands) && bands.length > 0) {
      return bands;
    }

    if (Array.isArray(eoBands) && eoBands.length > 0) {
      if (Array.isArray(rasterBands)) {
        return eoBands.map((band, index) => ({
          ...band,
          ...(rasterBands[index] || {}),
        }));
      }
      return eoBands;
    }

    if (Array.isArray(rasterBands) && rasterBands.length > 0) {
      return rasterBands;
    }

    return [];
  }

  /**
   * Determina los índices de bandas RGB para el estilo WebGL según los metadatos del asset
   *
   * @private
   * @function
   * @param {Object} asset Asset STAC con metadatos eo:bands
   * @returns {{bands: {r: number, g: number, b: number}}|null} Índices de banda o null
   */
  resolveStyleSpec(asset) {
    const spec = {
      bands: [1, 1, 1],
      convertToRGB: false,
    };
    if (asset.title.includes('NDVI')) {
      spec.indice = 'NDVI';
    } else if (asset.title.includes('NDWI')) {
      spec.indice = 'NDWI';
    } else if (asset.title.includes('NBR')) {
      spec.indice = 'NBR';
    } else {
      spec.bands = [1, 2, 3];
      spec.convertToRGB = true;
    }
    const eoBands = this.getAssetBands(asset);
    if (!Array.isArray(eoBands) || eoBands.length === 0) {
      return spec;
    }
    spec.convertToRGB = false;
    // RGB Monobanda
    if (eoBands.length === 1) {
      const commonName = eoBands[0].common_name?.toLowerCase();
      const rgbChannels = {
        red: [1, 0, 0],
        green: [0, 1, 0],
        blue: [0, 0, 1],
      };
      if (commonName && rgbChannels[commonName]) {
        spec.bands = rgbChannels[commonName];
      } else {
        spec.bands = [1, 1, 1];
      }
    } else {
      // RGB multiBanda
      const rgbBands = this.mapBandsByCommonName(eoBands, ['red', 'green', 'blue']);
      if (rgbBands) {
        spec.bands = rgbBands;
      } else if (eoBands.length >= 3) {
        spec.bands = [1, 2, 3];
      } else { // Escala de grises
        spec.bands = [1, 1, 1];
      }
    }
    const bandDisplayOrder = asset.band_display_order;
    if (bandDisplayOrder) {
      spec.bands = this.reorderBands(eoBands, bandDisplayOrder);
    }
    return spec;
  }

  /**
   * Reordena los índices de banda según band_display_order (nombre o índice numérico)
   *
   * @private
   * @function
   * @param {Array<Object>} eoBands Bandas espectrales del asset
   * @param {Array<string>} bandDisplayOrder Orden de visualización definido en el asset
   * @returns {Array<number>} Índices de banda reordenados (base 1)
   */
  reorderBands(eoBands, bandDisplayOrder) {
    const reorderedBands = [];
    bandDisplayOrder.forEach((bandName, index) => {
      let bandIndex = -1;
      bandIndex = Number.parseInt(bandName, 10);
      if (Number.isNaN(bandIndex)) {
        bandIndex = eoBands.findIndex((b) => b.name?.toLowerCase() === bandName.toLowerCase());
        if (bandIndex !== -1) {
          bandIndex += 1;
        }
      }
      if (bandIndex !== -1) {
        reorderedBands.push(bandIndex);
      } else {
        reorderedBands.push(index + 1);
      }
    });
    return reorderedBands;
  }

  /**
   * Construye un estilo ráster a partir de la especificación de bandas e índice
   *
   * @private
   * @function
   * @param {{bands: Array<number>, indice?: string}|null} spec
   * Especificación de bandas e índice espectral
   * @returns {IDEE.style.Raster|null} Estilo ráster o nulo si no hay especificación
   */
  buildRasterStyle(spec) {
    if (!spec) {
      return null;
    }
    const bands = spec.bands.length > 3 ? spec.bands.slice(0, 3) : spec.bands;
    let options = {};
    if (spec.indice) {
      options = INDICES_STYLES[spec.indice];
    } else {
      options.exposure = 0.2;
    }
    options.nodata = 0;
    options.bands = bands;
    return new IDEE.style.Raster(options);
  }

  /**
   * Cierra el modal informativo activo simulando un clic en su botón de cierre
   *
   * @private
   * @function
   */
  closeDialog() {
    const buttonClose = document.querySelector('div.m-dialog.info div.m-button > button');
    if (buttonClose) {
      buttonClose.click();
    }
  }

  /**
   * Esta función compara controles
   *
   * @public
   * @function
   * @param {IDEE.Control} control Control a comparar
   * @returns {boolean} true si ambos controles son instancias de CatalogmanagerControl
   * @api stable
   */
  equals(control) {
    return control instanceof CatalogmanagerControl;
  }

  // DESCARGA MASIVA
  // ----------------------------------------------------------------------------------------------

  /**
   * Desmarca todas las imágenes TIFF seleccionadas en el panel y en el modal activo
   *
   * @private
   * @function
   */
  clearSelection() {
    this.selectedItems_ = [];
    this.selectedImages_ = {};
    const checkedItemsInputs = this.template_.querySelectorAll('.m-catalogmanager-checkbox-item:checked');
    for (let i = 0; i < checkedItemsInputs.length; i += 1) {
      checkedItemsInputs[i].checked = false;
    }
    const checkedImagesInputs = this.template_.querySelectorAll('.m-catalogmanager-checkbox-image:checked');
    for (let i = 0; i < checkedImagesInputs.length; i += 1) {
      checkedImagesInputs[i].checked = false;
    }
  }

  /**
   * Actualiza la selección de ítems según el estado del checkbox indicado
   *
   * @private
   * @function
   * @param {HTMLInputElement} checkbox Checkbox de ítem individual o de selección total
   */
  changeSelectedItems(checkbox) {
    if (checkbox.id === 'select-all-items') {
      const items = this.template_.querySelectorAll('.m-catalogmanager-checkbox-item');
      for (let i = 0; i < items.length; i += 1) {
        items[i].checked = checkbox.checked;
        if (checkbox.checked) {
          const itemId = items[i].dataset.itemId;
          if (itemId && !this.selectedItems_.includes(itemId)) {
            this.selectedItems_.push(itemId);
          }
        } else {
          const itemId = items[i].dataset.itemId;
          if (itemId) {
            this.selectedItems_ = this.selectedItems_.filter((id) => id !== itemId);
          }
        }
      }
    } else {
      const itemId = checkbox.dataset.itemId;
      if (itemId) {
        if (checkbox.checked) {
          this.selectedItems_.push(itemId);
        } else {
          this.selectedItems_ = this.selectedItems_.filter((id) => id !== itemId);
        }
      }
    }
  }

  /**
   * Actualiza la selección de imagenes según el estado del checkbox indicado
   *
   * @private
   * @function
   * @param {HTMLInputElement} checkbox Checkbox de imagen individual
   */
  changeSelectedImages(checkbox) {
    const itemId = checkbox.dataset.itemId;
    const imageKey = checkbox.dataset.imageKey;
    if (itemId && imageKey) {
      if (checkbox.checked) {
        if (!this.selectedImages_[itemId]) {
          this.selectedImages_[itemId] = [];
        }
        this.selectedImages_[itemId].push(imageKey);
      } else {
        this.selectedImages_[itemId] = this.selectedImages_[itemId]
          .filter((key) => key !== imageKey);
        if (this.selectedImages_[itemId].length === 0) {
          delete this.selectedImages_[itemId];
        }
      }
    }
  }

  /**
   * Lanza la descarga masiva de todos los assets de una colección
   *
   * @private
   * @function
   * @param {number} catalogIndex Índice del catálogo
   * @param {number} collectionIndex Índice de la colección
   */
  collectionDownload(catalogIndex, collectionIndex) {
    const catalog = this.catalogs_[catalogIndex];
    const collection = catalog.collections[collectionIndex];
    const downloadData = {
      selection: {
        type: 'collection',
        collectionId: collection.id,
      },
      options: {
        assests: ['data'],
      },
    };
    this.downloadRequest(downloadData);
  }

  /**
   * Lanza la descarga masiva de imágenes o ítems según la selección activa
   *
   * @public
   * @function
   * @api stable
   */
  masiveDownload() {
    if (!IDEE.utils.isNullOrEmpty(this.selectedImages_)) {
      this.imagesDownload();
    } else {
      this.itemsDownload();
    }
  }

  /**
   * Descarga masivamente los ítems seleccionados
   *
   * @public
   * @function
   * @api stable
   */
  itemsDownload() {
    const selection = this.collectSelectedItems();
    if (selection.length === 0) {
      IDEE.dialog.info(getValue('exception').no_selection);
      return;
    }
    const downloadData = {
      selection,
      options: {
        assests: ['data'],
        includeStacJson: true,
      },
    };
    this.downloadRequest(downloadData);
  }

  /**
   * Descarga masivamente las imágenes seleccionadas
   *
   * @public
   * @function
   * @api stable
   */
  imagesDownload() {
    const selection = this.collectSelectedImages();
    if (selection.length === 0) {
      IDEE.dialog.info(getValue('exception').no_selection);
      return;
    }
    const downloadData = {
      selection,
      options: {
        assests: ['data'],
        includeStacJson: true,
      },
    };
    this.downloadRequest(downloadData);
  }

  /**
   * Recoge los items marcados en el panel
   *
   * @private
   * @function
   * @returns {Array<Object>} Lista de selecciones con índices de catálogo/colección
   */
  collectSelectedItems() {
    const selection = {
      type: 'items',
    };
    selection.collectionId = this.catalogs_[this.selectedCatalogIndex_]
      .collections[this.selectedCollectionIndex_].id;
    selection.itemIds = this.selectedItems_;
    return selection;
  }

  /**
   * Recoge las imágenes marcadas en el panel para la descarga masiva
   *
   * @private
   * @function
   * @returns {Object} Selección con `type`, `collectionId` e `images`
   */
  collectSelectedImages() {
    const selection = {
      type: 'images',
    };
    const images = {};
    Object.keys(this.selectedImages_).forEach((key) => {
      const itemId = key;
      images[itemId] = this.selectedImages_[key];
    });
    this.selectedItems_.forEach((itemId) => {
      if (!images[itemId]) {
        images[itemId] = ['*'];
      }
    });
    selection.collectionId = this.catalogs_[this.selectedCatalogIndex_]
      .collections[this.selectedCollectionIndex_].id;
    selection.images = images;
    return selection;
  }

  /**
   * Envía la petición de descarga masiva al servicio configurado en `downloadUrl_`
   *
   * @private
   * @function
   * @param {Object} downloadData Cuerpo de la petición con la selección y opciones de descarga
   */
  downloadRequest(downloadData) {
    console.log(downloadData);
    const catalog = this.catalogs_[this.selectedCatalogIndex_];
    const collection = catalog.collections[this.selectedCollectionIndex_];
    const token = catalog.obj.token;
    let message = '';
    if (downloadData.selection.type === 'images') {
      message = getValue('masiveDownload.imagesDownloadMsg')
        .replace('{{numItems}}', Object.keys(downloadData.selection.images).length)
        .replace('{{collectionName}}', collection.title);
    } else if (downloadData.selection.type === 'items') {
      message = getValue('masiveDownload.itemsDownloadMsg')
        .replace('{{numItems}}', downloadData.selection.itemIds.length)
        .replace('{{collectionName}}', collection.title);
    } else {
      message = getValue('masiveDownload.collectionDownloadMsg')
        .replace('{{collectionName}}', collection.title);
    }
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
    IDEE.remote.post(this.downloadUrl_, downloadData, { headers }).then((response) => {
      if (response.code === 200 || response.code === 202) {
        this.notifyDownload(catalog.obj, message);
        IDEE.dialog.info(getValue('masiveDownload.startDownloadMsg'));
      } else if (response.code === 400) {
        IDEE.dialog.info(JSON.parse(response.text).error);
      } else {
        console.error(response.text);
      }
    }).catch((error) => {
      console.error(error);
    });
  }

  /**
   * Notifica al servicio de autenticación que se ha solicitado una descarga
   *
   * @private
   * @function
   * @param {IDEE.stac.Catalog} catalog Catálogo STAC autenticado
   * @param {string} message Mensaje de notificación de la descarga
   */
  notifyDownload(catalog, message) {
    const headers = {
      'Content-Type': 'application/json',
    };
    const body = {
      accessToken: catalog.token,
      notificationMessage: message,
      entryURL: '/descargas',
    };
    const url = `${catalog.authUrl.substring(0, catalog.authUrl.lastIndexOf('/'))}/test-download-notification`;
    IDEE.remote.post(url, body, { headers }).then((response) => {
      console.log(response);
    }).catch((error) => {
      console.error(error);
    });
  }

  /**
   * Restablece la caché de elementos ya contabilizados en estadísticas de visualización
   *
   * @private
   * @function
   */
  resetCachedElements() {
    this.cachedElements_ = {
      collectionId: null,
      items: {},
    };
  }

  /**
   * Envía una petición de estadística de visualización al servicio de autenticación
   *
   * @private
   * @function
   * @param {string|null} [itemId=null] Identificador del ítem visualizado
   * @param {string|null} [imageKey=null] Clave del asset/imagen visualizado
   * @param {string} [operator='view'] Operación realizada (`view`, etc.)
   */
  statsRequest(itemId = null, imageKey = null, operator = 'view') {
    if (this.isValidStatsCatalog() && !this.isCachedElement(itemId, imageKey, operator)) {
      const catalog = this.catalogs_[this.selectedCatalogIndex_];
      const collection = catalog.collections[this.selectedCollectionIndex_];
      this.cachedElements_.collectionId = collection.id;
      const token = catalog.obj.token;
      const headers = {
        'Content-Type': 'application/json',
      };
      const body = {
        collectionId: collection.id,
        source: 'visualizer',
        accessToken: token,
      };
      if (itemId) {
        body.itemId = itemId;
        if (!this.cachedElements_.items[itemId]) {
          this.cachedElements_.items[itemId] = {};
        }
      }
      if (imageKey) {
        body.imageId = imageKey;
        body.operator = operator;
        if (!this.cachedElements_.items[itemId][imageKey]) {
          this.cachedElements_.items[itemId][imageKey] = [operator];
        } else {
          this.cachedElements_.items[itemId][imageKey].push(operator);
        }
      }
      const url = `${catalog.obj.authUrl.substring(0, catalog.obj.authUrl.lastIndexOf('/'))}/collection-view`;
      IDEE.remote.post(url, body, { headers }).then((response) => {
        // console.log(response);
      }).catch((error) => {
        console.error(error);
      });
    }
  }

  /**
   * Indica si el catálogo seleccionado admite el envío de estadísticas
   *
   * @private
   * @function
   * @returns {boolean} Verdadero si el catálogo tiene `authUrl` configurada
   */
  isValidStatsCatalog() {
    const catalog = this.catalogs_[this.selectedCatalogIndex_];
    return !IDEE.utils.isNullOrEmpty(catalog.obj.authUrl);
  }

  /**
   * Comprueba si un elemento (colección, ítem o imagen) ya está en la caché de estadísticas
   *
   * @private
   * @function
   * @param {string|null} itemId Identificador del ítem
   * @param {string|null} imageKey Clave del asset/imagen
   * @param {string} operator Operación ya registrada
   * @returns {boolean} Verdadero si el elemento ya fue contabilizado
   */
  isCachedElement(itemId, imageKey, operator) {
    const selectedCollectionId = this.catalogs_[this.selectedCatalogIndex_]
      .collections[this.selectedCollectionIndex_].id;

    const cachedItem = this.cachedElements_.items[itemId];
    if (imageKey) {
      if (cachedItem && cachedItem[imageKey] && cachedItem[imageKey].includes(operator)) {
        return true;
      }
      return false;
    }
    if (itemId) {
      if (cachedItem) {
        return true;
      }
      return false;
    }
    if (this.cachedElements_.collectionId === selectedCollectionId) {
      return true;
    }
    return false;
  }
}
