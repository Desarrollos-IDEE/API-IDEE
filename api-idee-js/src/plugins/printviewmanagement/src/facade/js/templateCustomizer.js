import { domToCanvas } from 'modern-screenshot';
import TemplateCustomizerImpl from '../../impl/ol/js/templateCustomizer';
import templateCustomizer from '../../templates/templateCustomizer';
import { getValue } from './i18n/language';
import { createLoadingSpinner, getLayerCanvases, getLayerCanvasOpacity } from './utils';
import { PREVIEW_MAP_ORIENTATION } from '../../constants';

const ID_TEMPLATE_ORIENTATION = 'input[name="map-orientation"]';
const ID_TEMPLATE_LAYOUT = '#template-layout';
const ID_TEMPLATE_SCALE = '#template-scale';
const SCALE_LINE_CONTROL_NAME = 'scaleline';
const ID_TEMPLATE_SCALE_LINE = '#template-scale-line';
const ID_TEMPLATE_DPI = '#template-dpi';
const ID_TEMPLATE_BORDER_WIDTH = '#template-border-width';
const ID_TEMPLATE_MARGIN = '#template-margin';
const ID_TEMPLATE_INPUT_SRS = '#epsg-selected';
const ID_TEMPLATE_SRS_SELECTOR = '#m-customize-template-srs-selector';
const ID_MAP_CONTAINER_TEMPLATE = '#imagen-mascara';
const MAP_CONTAINER_TEMPLATE = 'imagen-mascara';
const CLASS_MAP_CONTAINER = '.m-templateCustomizer-map-preview';
const MAP_CONTAINER = 'm-templateCustomizer-map-preview';
const ID_CONTAINER_DEFAULT_TEMPLATE = '#api-idee-template-container';
const ID_DOWNLOAD_TEMPLATE_BUTTON = '#m-templateCustomizer-download-button';
// Resolución CSS (px/pulgada) con la que se maqueta la plantilla en mm → px
const LAYOUT_DPI = 96;

export default class TemplateCustomizer extends IDEE.Control {
  /**
    * @classdesc
    * Clase para personalizar la plantilla de impresión.
    *
    * @constructor
    * @extends {IDEE.Control}
    * @api stable
  */
  constructor(
    {
      dpiOptions,
      layoutOptions,
      projectionsOptions,
      layoutsRestraintFromDpi,
      order,
      helpUrl,
      templateData,
      draggableDialog = true,
      onApply = null,
    },
    map,
  ) {
    const impl = new TemplateCustomizerImpl(map);

    super('TemplateCustomizer', impl);

    /**
     * Mapa base
     * @private
     * @type {IDEE.Map}
     */
    this.map = map;

    /**
     * Orden de aparición del control en la interfaz
     * @private
     * @type {number}
     */
    this.order = order;

    /**
     * URL de ayuda para la personalización de la plantilla
     * @private
     * @type {string}
     */
    this.helpUrl = helpUrl;

    /**
     * Indica si el diálogo es arrastrable
     * @private
     * @type {boolean}
     */
    this.draggableDialog = draggableDialog;

    /**
     * Orientación del mapa por defecto
     * @private
     * @type {string}
     */
    this.mapOrientation = PREVIEW_MAP_ORIENTATION;

    /**
     * Opciones de DPI disponibles para la personalización de la plantilla
     * @private
     * @type {Array<Number>}
     */
    this.dpiOptions_ = dpiOptions;

    /**
     * Opciones de layout disponibles para la personalización de la plantilla
     * @private
     * @type {Array<Object>}
     */
    this.layoutOptions_ = layoutOptions;

    /**
     * Opciones de proyección disponibles para la personalización de la plantilla
     * @private
     * @type {Array<string>}
     */
    this.projectionsOptions_ = projectionsOptions;

    /**
     * Layouts en los que no está permitido el uso de DPI
     * @private
     * @type {Array<string>}
     */
    this.layoutsRestraintFromDpi = layoutsRestraintFromDpi;

    /**
     * Datos de la plantilla que se personaliza
     * @private
     * @type {Object}
     */
    this.templateData_ = templateData;

    /**
     * Función de callback que se ejecuta al aplicar la personalización
     * @private
     * @type {Function|null}
     */
    this.onApplyCallback = onApply;

    /**
     * Instancia del mapa de previsualización
     * @private
     * @type {IDEE.Map|null}
     */
    this.previewMap = null;

    /**
     * Layout seleccionado por defecto
     * @private
     * @type {string}
     */
    this.layout = (this.layoutOptions_.find((layout) => layout.default)
      || this.layoutOptions_[0]).value;

    /**
     * Proyección seleccionada por defecto
     * @private
     * @type {string}
     */
    this.projection = null;

    /**
     * DPI seleccionado por defecto
     * @private
     * @type {number}
     */
    this.dpi = this.dpiOptions_[0];

    /**
     * Escala inicial del mapa de previsualización
     * @private
     * @type {number|null}
    */
    this.scale = null;

    /**
     * DPI seleccionado por defecto
     * @private
     * @type {number}
     */
    this.dpi = this.dpiOptions_[0];

    /**
     * Ancho del borde de la plantilla, en píxeles
     * @private
     * @type {number}
     */
    this.borderWidth = 1;

    /**
     * Margen de la plantilla, en píxeles. Se utiliza al generar el archivo final
     * (por ejemplo, al posicionar la imagen dentro del PDF)
     * @private
     * @type {number}
     */
    this.margin = 10;

    /**
     * Conjunto de elementos principales que tiene la plantilla
     * @private
     * @type {Array<Object>}
     */
    this.templateItems_ = [];

    /**
     * Elementos de tipo texto-libre que tiene la plantilla
     * @private
     * @type {Array<Object>}
     */
    this.freeTextElements_ = [];

    /**
     * Elemento SVG de carga
     * @private
     * @type {HTMLElement}
     */
    this.loadingOverlay_ = null;

    this.init();
    this.addEvents();
  }

  /**
   * Inicializa el diálogo de personalización de la plantilla
   */
  init() {
    const currentProjection = this.map.getMapImpl().getView().getProjection().getCode();
    this.projection = currentProjection;
    this.templateItems_ = this.templateData_.types.map((fullType) => {
      const [type, name] = fullType.split(':');
      return {
        id: name ? `texto-libre-${name}` : type,
        type: type || fullType,
        name: name || null,
        label: name || getValue(type) || type,
      };
    });
    const content = IDEE.template.compileSync(templateCustomizer, {
      jsonp: true,
      parseToHtml: true,
      vars: {
        hasHelp: this.helpUrl !== undefined && IDEE.utils.isUrl(this.helpUrl),
        helpUrl: this.helpUrl,
        order: this.order,
        dpiOptions: this.dpiOptions_,
        layoutOptions: this.layoutOptions_,
        templateElements: this.templateItems_,
        defaultProjection: currentProjection,
        projectionsOptions: this.projectionsOptions_,
        defaultScale: this.map.getImpl().getScale(),
        defaultBorderWidth: this.borderWidth,
        defaultMargin: this.margin,
        translations: {
          mapElements: getValue('mapElements'),
          mapTitle: getValue('mapTitle'),
          mapBorder: getValue('mapBorder'),
          mapFreeText: getValue('mapFreeText'),
          mapNorthArrow: getValue('mapNorthArrow'),
          mapOrientation: getValue('mapOrientation'),
          vertical: getValue('vertical'),
          horizontal: getValue('horizontal'),
          layout: getValue('layout'),
          scale: getValue('scale'),
          scaleLine: getValue('scaleLine'),
          epsg: getValue('projection'),
          select_srs: getValue('select_srs'),
          choose_create_epsg: getValue('choose_create_epsg'),
          dpi: getValue('dpi'),
          borderWidth: getValue('borderWidth'),
          margin: getValue('margin'),
          apply: getValue('apply'),
          close: getValue('close'),
        },
      },
    });
    IDEE.dialog.info(content.outerHTML, getValue('customizeTemplate'), this.order);
    document.querySelector('.m-dialog>div.m-modal>div.m-content').style.width = '90%';
    document.querySelector('.m-dialog>div.m-modal>div.m-content').style.maxWidth = '90%';
    document.querySelector('.m-dialog>div.m-modal>div.m-content').style.height = '90%';

    const buttonContainer = document.querySelector('div.m-dialog.info div.m-button');
    const closeButton = buttonContainer.querySelector('button');
    closeButton.innerHTML = getValue('close');

    document.querySelector(ID_DOWNLOAD_TEMPLATE_BUTTON).addEventListener('click', () => {
      const config = this.returnTemplateConfig();
      this.toggleEvent(config);
    });

    closeButton.addEventListener('click', () => {
      this.cleanTemplateResources();
    });

    const parser = new DOMParser();
    const doc = parser.parseFromString(this.templateData_.content, 'text/html');
    const templateContent = doc.body;
    const container = document.querySelector(CLASS_MAP_CONTAINER)
      || document.querySelector('.m-dialog .m-content');
    container.appendChild(templateContent);

    this.createPreviewMap();

    if (this.draggableDialog) {
      IDEE.utils.draggabillyElement('.m-dialog .m-modal .m-content', '.m-dialog .m-modal .m-content .m-title');
    }
    document.addEventListener('keydown', (evt) => {
      if (evt.key === 'Escape') {
        const btn = document.querySelector('.m-dialog .m-content .m-button > button');
        btn.style.width = '75px';
        if (btn !== null) {
          btn.click();
        }
      }
    });
  }

  /**
   * Añade eventos a los checkboxes de los tipos de elementos de la plantilla
   */
  addEvents() {
    this.templateItems_.forEach((item) => {
      const checkboxId = `#m-show-${item.id}`;
      const checkbox = document.querySelector(checkboxId);

      if (checkbox) {
        checkbox.addEventListener('change', (e) => {
          if (e.target.checked) {
            this.addTemplateElement(item.type, item.name);
          } else {
            this.removeTemplateElement(item.type, item.name);
          }
        });
      }
    });
    this.updateDataTemplate();
    this.setupMapOrientationControl(ID_TEMPLATE_ORIENTATION);
    this.setupLayoutControl(ID_TEMPLATE_LAYOUT);
    this.setupScaleControl(ID_TEMPLATE_SCALE);
    this.setupScaleLineControl(ID_TEMPLATE_SCALE_LINE);
    this.setupDpiControl(ID_TEMPLATE_DPI);
    this.setupBorderWidthControl(ID_TEMPLATE_BORDER_WIDTH);
    this.setupMarginControl(ID_TEMPLATE_MARGIN);
    this.setupInputSelectorControl(ID_TEMPLATE_INPUT_SRS, ID_TEMPLATE_SRS_SELECTOR);
  }

  /**
   * Crea un mapa de previsualización para la personalización de la plantilla
   * Este mapa se utiliza para mostrar cómo quedará la plantilla con los elementos añadidos.
   * Se configura con la misma vista, zoom y centro que el mapa original.
   */
  createPreviewMap() {
    const imagenMascara = document.querySelector(ID_MAP_CONTAINER_TEMPLATE);
    const containerTemplate = imagenMascara || document.querySelector(`.${MAP_CONTAINER}`);
    this.previewMap = new IDEE.Map({
      container: containerTemplate.id,
      zoom: this.map.getImpl().getZoom(),
      center: Object.values(this.map.getImpl().getCenter()),
      projection: `${this.map.getProjection().code}*${this.map.getProjection().units}`,
      containerTemplate,
    });

    const mapPanel = containerTemplate.querySelector('#mapPanel');
    const viewport = containerTemplate.querySelector('.ol-viewport');
    mapPanel.appendChild(viewport);

    this.previewMap.addLayers(this.map.getLayers().map((layer) => layer.clone()));
    this.previewMap.getLayers().forEach((layer) => {
      const style = typeof layer.getStyle === 'function' ? layer.getStyle() : null;
      if (style) {
        layer.setStyle(style instanceof IDEE.style.Simple ? style.clone() : style);
      }
    });
    const previewContainer = document.querySelector(ID_CONTAINER_DEFAULT_TEMPLATE);
    this.templateElementsContainer_ = previewContainer;
    this.stylesApplied_ = false;
    this.setupViewScaleListener();
    this.setupScaleLineInput();
    this.setupMapChangeListener();
    this.applyTemplateStyles();
    this.applyTemplateScripts();
  }

  /**
   * Configura un listener para la escala de la vista del mapa de previsualización
   * Este listener actualiza el campo de escala cada vez que cambia la resolución del mapa.
   * También calcula la escala inicial en base a la resolución actual, las unidades
   * del mapa y el DPI.
   */
  setupViewScaleListener() {
    const view = this.previewMap.getMapImpl().getView();
    const resolution = view.getResolution();
    // Escala respecto al papel (LAYOUT_DPI), no DPI_OGC de pantalla
    const scale = IDEE.impl.utils.getScaleForResolution(
      resolution,
      view,
      LAYOUT_DPI,
      true,
    );
    const scaleEl = document.querySelector(ID_TEMPLATE_SCALE);
    if (scaleEl) {
      scaleEl.value = `1:${scale}`;
      this.scale = scale;
    }
  }

  setupScaleLineInput() {
    const { checked } = document.querySelector(ID_TEMPLATE_SCALE_LINE);
    if (checked) {
      this.previewMap.addControls(this.getScaleLineControl({
        vendorOptions: {
          text: checked,
        },
      }));
    }
  }

  /**
   * Configura un listener para detectar cambios en el mapa (movimiento, zoom, EPSG, layout, etc.)
   */
  setupMapChangeListener() {
    const view = this.previewMap.getMapImpl().getView();
    view.on('change:center', () => this.updateDataTemplate());
    view.on('change:rotation', () => this.updateDataTemplate());
    this.previewMap.getMapImpl().on('postrender', () => {
      this.updateDataTemplate();
      this.setupViewScaleListener();
    });
  }

  /**
   * Actualiza las coordenadas en el elemento texto-libre si está activo
   */
  updateDataTemplate() {
    const epsgTemplate = this.getDescriptionElements().epsgTemplate;
    const dateTemplate = this.getDescriptionElements().dateTemplate;
    const coordElements = this.getBorderCoordinates();
    if (epsgTemplate !== null && dateTemplate !== null) {
      this.updateDescriptionElements(epsgTemplate, dateTemplate);
    }
    if (Object.values(coordElements).every((el) => el !== null)) {
      this.updateBorderCoordinates(coordElements);
    }
  }

  /**
   * Obtiene los elementos de coordenadas del borde del mapa
   * @returns {Object} Elementos de coordenadas del borde
   */
  getBorderCoordinates() {
    return {
      'top-left-coord': document.getElementById('top-left-coord'),
      'top-right-coord': document.getElementById('top-right-coord'),
      'left-top-coord': document.getElementById('left-top-coord'),
      'left-bottom-coord': document.getElementById('left-bottom-coord'),
      'right-top-coord': document.getElementById('right-top-coord'),
      'right-bottom-coord': document.getElementById('right-bottom-coord'),
      'bottom-left-coord': document.getElementById('bottom-left-coord'),
      'bottom-right-coord': document.getElementById('bottom-right-coord'),
    };
  }

  /**
   * Obtiene los elementos de descripción del mapa
   * @returns {Object} Elementos de descripción del mapa
   */
  getDescriptionElements() {
    return {
      epsgTemplate: document.getElementById('map-epsg'),
      dateTemplate: document.getElementById('current-date'),
    };
  }

  /**
   * Actualiza los elementos de descripción (texto-libre) con los datos actuales del mapa
   * Este método se puede personalizar para actualizar otros elementos de
   * descripción según sea necesario.
   * @param {Object} epsgTemplateObject Elemento de plantilla EPSG
   * @param {Object} dateTemplateObject Elemento de plantilla de fecha
   */
  updateDescriptionElements(epsgTemplateObject, dateTemplateObject) {
    const epsgTemplate = epsgTemplateObject;
    const dateTemplate = dateTemplateObject;
    const today = new Date();
    const day = String(today.getDate());
    const month = String(today.getMonth() + 1);
    const year = today.getFullYear();
    const hours = String(today.getHours()).padStart(2, '0');
    const minutes = String(today.getMinutes()).padStart(2, '0');
    const formattedDate = `${day}/${month}/${year} ${hours}:${minutes}`;
    epsgTemplate.textContent = this.projection;
    dateTemplate.textContent = formattedDate;
  }

  /**
   * Actualiza las coordenadas del borde del mapa en grados, minutos y segundos
   * Este método se puede personalizar para actualizar otros elementos de borde según sea necesario.
   * @param {Object} coordElementsObject Objeto que contiene los elementos de coordenadas del borde
   */
  updateBorderCoordinates(coordElementsObject) {
    const coordElements = coordElementsObject;
    const extent = this.previewMap.getMapImpl().getView().calculateExtent();
    const mapProjection = this.previewMap.getMapImpl().getView().getProjection().getCode();
    let transformedExtent = extent;
    if (mapProjection !== 'EPSG:4326') {
      transformedExtent = this.getImpl().transformExtent(extent, mapProjection, 'EPSG:4326');
    }
    const [minLon, minLat, maxLon, maxLat] = transformedExtent;
    coordElements['top-left-coord'].textContent = this.toDMS(maxLat);
    coordElements['top-right-coord'].textContent = this.toDMS(maxLat);
    coordElements['left-top-coord'].textContent = this.toDMS(minLon);
    coordElements['left-bottom-coord'].textContent = this.toDMS(minLon);
    coordElements['right-top-coord'].textContent = this.toDMS(maxLon);
    coordElements['right-bottom-coord'].textContent = this.toDMS(maxLon);
    coordElements['bottom-left-coord'].textContent = this.toDMS(minLat);
    coordElements['bottom-right-coord'].textContent = this.toDMS(minLat);
  }

  /**
   * Convierte coordenadas decimales a grados, minutos y segundos (DMS).
   * Segundos con dos decimales para reducir el error del truncado.
   * @param {Number} coord Coordenada
   * @returns {String} Coordenadas en formato DMS
   */
  toDMS(coord) {
    const sign = coord < 0 ? '-' : '';
    const absolute = Math.abs(coord);
    const degrees = Math.floor(absolute);
    const minutesNotTruncated = (absolute - degrees) * 60;
    const minutes = Math.floor(minutesNotTruncated);
    let seconds = (minutesNotTruncated - minutes) * 60;
    seconds = Math.round(seconds * 100) / 100;
    let finalDegrees = degrees;
    let finalMinutes = minutes;
    if (seconds >= 60) {
      seconds = 0;
      finalMinutes += 1;
    }
    if (finalMinutes === 60) {
      finalMinutes = 0;
      finalDegrees += 1;
    }
    const secondsText = seconds.toFixed(2);
    return `${sign}${finalDegrees}º${finalMinutes}'${secondsText}"`;
  }

  /**
   * Calcula la escala en base a la resolución, unidades del mapa y DPI
   * @param {*} resolution Resolución del mapa
   * @param {*} mapUnits Unidades del mapa
   * @param {*} dpi Dots per inch
   * @returns {number} Escala calculada
   */
  getScaleForResolution(resolution, mapUnits, dpi) {
    const inchesPerMeter = 39.3701;
    return Math.round(((resolution * dpi) * inchesPerMeter) / mapUnits);
  }

  /**
   * Añade un elemento de plantilla al contenedor de elementos de plantilla
   * @param {*} type - Tipo de elemento a añadir (ej. 'titulo', 'texto-libre', etc.)
   * @param {*} name - Nombre del elemento de plantilla (en caso de que sea texto-libre)
   */
  addTemplateElement(type, name = null) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(this.templateData_.content, 'text/html');
    const fullType = `api-idee-template-${type}`;

    if (type === 'borde') {
      const originalElement = doc.querySelector(`[data-type="${fullType}"]`);
      if (originalElement) {
        let borderElement = this.templateElementsContainer_.querySelector(
          `[data-type="${fullType}"]`,
        );
        const imagenMascara = this.templateElementsContainer_.querySelector(
          ID_MAP_CONTAINER_TEMPLATE,
        );

        if (imagenMascara && !borderElement) {
          borderElement = originalElement.cloneNode(true);
          const newImagenMascara = borderElement.querySelector(ID_MAP_CONTAINER_TEMPLATE);
          if (newImagenMascara) {
            newImagenMascara.replaceWith(imagenMascara);
          } else {
            borderElement.appendChild(imagenMascara);
          }
          this.templateElementsContainer_.appendChild(borderElement);
        } else if (!borderElement) {
          borderElement = originalElement.cloneNode(true);
          this.templateElementsContainer_.appendChild(borderElement);
        }
        this.borderElement_ = borderElement;
        const coordElements = this.getBorderCoordinates();
        this.updateBorderCoordinates(coordElements);
      }
    } else {
      let selector = `[data-type="${fullType}"]`;
      if (name !== null) {
        selector += `[data-type-name="${name}"]`;
      }
      const elements = doc.querySelectorAll(selector);
      elements.forEach((originalElement) => {
        const clonedElement = originalElement.cloneNode(true);
        const aux = this.templateElementsContainer_;
        let existingSelector = `[data-type="${fullType}"]`;
        if (name !== null) {
          existingSelector += `[data-type-name="${name}"]`;
        }
        const existingElement = aux.querySelector(existingSelector);
        if (!existingElement) {
          aux.appendChild(clonedElement);
        }
        switch (type) {
          case 'titulo':
            this.titleElement_ = clonedElement;
            break;
          case 'leyenda':
            this.legendElement_ = clonedElement;
            break;
          case 'flecha-norte':
            this.northArrowElement_ = clonedElement;
            break;
          case 'escala':
            this.scaleElement_ = clonedElement;
            break;
          case 'perfil-topografico':
            this.profileElement_ = clonedElement;
            break;
          case 'texto-libre':
            this.freeTextElements_.push(clonedElement);
            const epsgTemplate = this.getDescriptionElements().epsgTemplate;
            const dateTemplate = this.getDescriptionElements().dateTemplate;
            this.updateDescriptionElements(epsgTemplate, dateTemplate);
            break;
          default:
            break;
        }
      });
    }
    this.previewMap.getMapImpl().renderSync();
  }

  /**
   * Elimina un elemento de plantilla del contenedor de elementos de plantilla
   * @param {string} type - Tipo de elemento a eliminar (ej. 'titulo', 'texto-libre', etc.)
   */
  removeTemplateElement(type, name = null) {
    const fullType = `api-idee-template-${type}`;
    let selector = `[data-type="${fullType}"]`;
    if (name !== null) {
      selector += `[data-type-name="${name}"]`;
    }
    const elements = this.templateElementsContainer_.querySelectorAll(selector);

    elements.forEach((element) => {
      if (type === 'borde') {
        const children = Array.from(element.children);
        children.forEach((child) => {
          if (child.id !== MAP_CONTAINER_TEMPLATE) {
            element.removeChild(child);
          }
        });

        const imagenMascara = element.querySelector(ID_MAP_CONTAINER_TEMPLATE);
        if (imagenMascara) {
          this.templateElementsContainer_.appendChild(imagenMascara);
        }

        this.templateElementsContainer_.removeChild(element);
        this.borderElement_ = null;
      } else {
        this.templateElementsContainer_.removeChild(element);

        switch (type) {
          case 'titulo':
            this.titleElement_ = null;
            break;
          case 'texto-libre':
            this.freeTextElements_ = this.freeTextElements_.filter((el) => el !== element);
            break;
          case 'leyenda':
            this.legendElement_ = null;
            break;
          case 'flecha-norte':
            this.northArrowElement_ = null;
            break;
          case 'escala':
            this.scaleElement_ = null;
            break;
          case 'perfil-topografico':
            this.profileElement_ = null;
            break;
          default:
            break;
        }
      }
    });
    if (this.templateElementsContainer_.children.length === 0 && this.styleContainer_) {
      document.head.removeChild(this.styleContainer_);
      this.styleContainer_ = null;
      this.stylesApplied_ = false;
    }
  }

  /**
   * Aplica los estilos de la plantilla al contenedor de estilos
   */
  applyTemplateStyles() {
    if (this.styleContainer_ === undefined) {
      this.styleContainer_ = document.createElement('style');
      this.styleContainer_.setAttribute('data-template-styles', 'true');
      document.head.appendChild(this.styleContainer_);
    }
    const cssContent = this.templateData_.styles.styleTags.join('\n');
    this.styleContainer_.textContent = cssContent;
  }

  /**
   * Aplica los scripts de la plantilla al contenedor de elementos de plantilla
   */
  applyTemplateScripts() {
    if (this.templateData_.scripts
      && (this.templateData_.scripts.src.length > 0
        || this.templateData_.scripts.inline.length > 0)) {
      const { src, inline } = this.templateData_.scripts;

      src.forEach((scriptSrc) => {
        if (!document.querySelector(`script[src="${scriptSrc}"]`)) {
          const scriptTag = document.createElement('script');
          scriptTag.src = scriptSrc;
          scriptTag.async = false;
          document.head.appendChild(scriptTag);
        }
      });

      inline.forEach((scriptContent) => {
        new window.Function(scriptContent)();
      });
    }
  }

  /**
   * Elimina los estilos y scripts cargados de la plantilla
   */
  cleanTemplateResources() {
    const styleElements = document.querySelectorAll('style[data-template-styles]');
    styleElements.forEach((style) => {
      document.head.removeChild(style);
    });

    if (this.templateData_.scripts && this.templateData_.scripts.src) {
      this.templateData_.scripts.src.forEach((scriptSrc) => {
        const scripts = document.querySelectorAll(`script[src="${scriptSrc}"]`);
        scripts.forEach((script) => {
          if (script.parentNode) {
            script.parentNode.removeChild(script);
          }
        });
      });
    }

    if (this.templateElementsContainer_) {
      this.templateElementsContainer_.innerHTML = '';
    }
  }

  /**
   * Configura el control de escala
   * @param {string} scaleElementId - ID del elemento de entrada de escala
   */
  setupScaleControl(scaleElementId) {
    const scaleElement = document.querySelector(scaleElementId);
    scaleElement.addEventListener('keydown', (e) => {
      e.stopPropagation();
      if (e.keyCode === 13) {
        e.target.blur();
        this.zoomToInputScale(e);
      }
    });
  }

  /**
   * Configura el control de escala lineal
   * @param {string} scaleLineElementId - ID del elemento de entrada de escala lineal
   */
  setupScaleLineControl(scaleLineElementId) {
    const scaleElement = document.querySelector(scaleLineElementId);
    scaleElement.addEventListener('click', (e) => {
      if (this.previewMap.hasControl(SCALE_LINE_CONTROL_NAME)) {
        this.previewMap.removeControls(SCALE_LINE_CONTROL_NAME);
      }
      const checked = e.target.checked;
      this.previewMap.addControls(
        this.getScaleLineControl({
          vendorOptions: {
            bar: true,
            text: checked,
          },
        }),
      );
    });
  }

  /**
   * Maneja el evento de cambio de escala al escribir en el campo de entrada
   * @param {Event} e - Evento de cambio en el campo de entrada de escala
   */
  zoomToInputScale(e) {
    const writtenScale = e.target.value.trim().replace(/ /g, '').replace(/\./g, '').replace(/,/g, '');
    const scaleRegExp = /^1:[1-9]\d*$/;
    const simpleScaleRegExp = /^[1-9]\d*$/;
    if (scaleRegExp.test(writtenScale)) {
      this.zoomToScale(parseInt(writtenScale.substring(2), 10));
    } else if (simpleScaleRegExp.test(writtenScale)) {
      this.zoomToScale(parseInt(writtenScale, 10));
    }
  }

  /**
   * Zooms the map to a specific scale
   * @param {number} scale - La escala a la que se desea hacer zoom
   */
  zoomToScale(scale) {
    if (!scale || Number.isNaN(scale)) return;

    const view = this.previewMap.getMapImpl().getView();
    const resolution = IDEE.impl.utils.getCurrentScale(view, `${scale}`, LAYOUT_DPI);
    view.setResolution(resolution);

    const scaleElement = document.querySelector(ID_TEMPLATE_SCALE);
    if (scaleElement) {
      scaleElement.value = `1:${scale}`;
    }
    this.scale = scale;
  }

  /**
    * Configura el control de proyección
    * @param {string} projectionElementId - ID del elemento de selección de proyección
  */
  setupProjectionControl(projectionElementId) {
    const projectionSelect = document.querySelector(projectionElementId);

    projectionSelect.addEventListener('change', (e) => {
      this.projection = e.target.value;
      const previewView = this.previewMap.getMapImpl().getView();
      const currentProjection = previewView.getProjection().getCode();

      if (currentProjection !== this.projection) {
        const currentCenter = previewView.getCenter();

        const transformedCenter = this.getImpl().transformCoordinates(
          currentCenter,
          currentProjection,
          this.projection,
        );

        const newView = this.getImpl().createView({
          projection: this.projection,
          center: transformedCenter,
          zoom: previewView.getZoom(),
          minZoom: this.map.getImpl().getMinZoom(),
          maxZoom: this.map.getImpl().getMaxZoom(),
        });

        this.previewMap.getMapImpl().setView(newView);
        this.previewMap.getMapImpl().renderSync();

        const scaleElement = document.querySelector(ID_TEMPLATE_SCALE);
        if (scaleElement) {
          const scale = this.previewMap.getImpl().getScale();
          scaleElement.value = `1:${scale}`;
          this.scale = scale;
        }
      }
    });
  }

  /**
   * Configura el control de DPI
   * @param {string} dpiElementId - ID del elemento de selección de DPI
   */
  setupDpiControl(dpiElementId) {
    const dpiSelect = document.querySelector(dpiElementId);
    dpiSelect.addEventListener('change', (e) => {
      this.dpi = e.target.value;
    });
  }

  /**
   * Configura el control de ancho del borde de la plantilla.
   * Actualiza la previsualización en caliente con cada cambio del input.
   * @param {string} borderWidthElementId - ID del elemento de entrada del ancho de borde
   */
  setupBorderWidthControl(borderWidthElementId) {
    const borderWidthElement = document.querySelector(borderWidthElementId);
    borderWidthElement.addEventListener('input', (e) => {
      this.borderWidth = Math.min(10, Math.max(1, Number(e.target.value)));
      this.updateTemplateBorderWidth();
    });
  }

  /**
   * Aplica el ancho de borde actual a los elementos con borde de la plantilla
   * de previsualización
   */
  updateTemplateBorderWidth() {
    const container = document.querySelector(ID_CONTAINER_DEFAULT_TEMPLATE);
    if (!container) return;
    container.querySelectorAll('.interior-container, .inferior-container, .cell').forEach((el) => {
      // eslint-disable-next-line no-param-reassign
      el.style.borderWidth = `${this.borderWidth}px`;
    });
  }

  /**
   * Configura el control de margen de la plantilla. Este valor no se aplica
   * en la previsualización, sino al generar el archivo final (por ejemplo, el PDF)
   * @param {string} marginElementId - ID del elemento de entrada del margen
   */
  setupMarginControl(marginElementId) {
    const marginElement = document.querySelector(marginElementId);
    marginElement.addEventListener('input', (e) => {
      this.margin = Math.min(50, Math.max(0, Number(e.target.value)));
    });
  }

  /**
   * Refresca el listado de proyecciones del selector de EPSG con las
   * proyecciones actualmente soportadas, incluyendo las registradas
   * al vuelo por otros plugins.
   * @param {HTMLElement} selectorEl Elemento <ul> del selector de EPSG
   * @public
   * @function
   * @api
   */
  refreshProjectionsSelector(selectorEl) {
    this.projectionsOptions_ = IDEE.impl.ol.js.projections.getSupportedProjs();
    // eslint-disable-next-line no-param-reassign
    selectorEl.innerHTML = `
      <li><a class="m-customize-template-option-disabled" href="#" value="default" tabindex="-1" disabled>
          ${getValue('choose_create_epsg')}
      </a></li>
      ${this.projectionsOptions_.map((proj) => `
          <li>
              <a href="#" value="${proj.codes[0]}">
                  ${proj.codes[0]}
              </a>
          </li>
      `).join('')}
    `;
  }

  /**
   * Configura el control de entrada de SRS
   * @param {String} inputElementId ID del elemento de entrada de SRS
   * @param {String} selectorElementId ID del listado de SRS
   */
  setupInputSelectorControl(inputElementId, selectorElementId) {
    const inputElement = document.querySelector(inputElementId);
    const selectorElement = document.querySelector(selectorElementId);
    let isEditable = false;

    inputElement.setAttribute('readonly', 'readonly');
    inputElement.value = this.projection;

    inputElement.addEventListener('focus', () => {
      if (!isEditable) {
        this.refreshProjectionsSelector(selectorElement);
        selectorElement.style.display = 'block';
        const list = selectorElement.querySelectorAll('li a');
        list.forEach((li) => {
          li.addEventListener('mousedown', (event) => {
            event.preventDefault();
            const value = event.target.getAttribute('value');
            if (value === 'default') {
              isEditable = true;
              inputElement.removeAttribute('readonly');
              inputElement.value = '';
              inputElement.placeholder = getValue('placeholder_custom_epsg');
              selectorElement.style.display = 'none';
              inputElement.focus();
            } else {
              inputElement.value = value;
              this.changeProjection(value);
              this.updateDataTemplate();
            }
          });
        });
      }
    });

    inputElement.addEventListener('blur', () => {
      selectorElement.style.display = 'none';
      isEditable = false;
      if (!inputElement.hasAttribute('readonly')) {
        inputElement.setAttribute('readonly', 'readonly');
        inputElement.value = this.projection;
      }
    });

    inputElement.addEventListener('keyup', (event) => {
      if (isEditable && event.key === 'Enter') {
        isEditable = false;
        inputElement.setAttribute('readonly', 'readonly');
        this.changeProjection(inputElement.value.startsWith('EPSG:') ? inputElement.value : `EPSG:${inputElement.value}`);
        this.updateDataTemplate();
      }
    });
  }

  /**
   * Cambia la proyección del mapa de previsualización a la indicada por parámetro
   * @param {String} epsg - Código EPSG de la proyección a aplicar
   */
  async changeProjection(epsg) {
    const inputElement = document.querySelector(ID_TEMPLATE_INPUT_SRS);
    const previousProjection = this.projection;
    this.projection = epsg;
    const previewView = this.previewMap.getMapImpl().getView();
    const currentProjection = previewView.getProjection().getCode();
    const selectorEl = document.querySelector(ID_TEMPLATE_SRS_SELECTOR);
    if (currentProjection !== this.projection) {
      const currentCenter = previewView.getCenter();
      if (!await IDEE.impl.ol.js.projections.ensureProjection(epsg)) {
        this.projection = previousProjection;
        IDEE.dialog.error(`${getValue('exception.srs')} ${this.projection}`);
        return;
      }
      const transformedCenter = this.getImpl().transformCoordinates(
        currentCenter,
        currentProjection,
        this.projection,
      );

      inputElement.value = this.projection;
      this.refreshProjectionsSelector(selectorEl);

      const newView = this.getImpl().createView({
        projection: this.projection,
        center: transformedCenter,
        zoom: previewView.getZoom(),
        minZoom: this.map.getImpl().getMinZoom(),
        maxZoom: this.map.getImpl().getMaxZoom(),
      });

      this.previewMap.getMapImpl().setView(newView);
      this.reproyectLayers(previewView);
      this.previewMap.getMapImpl().renderSync();

      const scaleElement = document.querySelector(ID_TEMPLATE_SCALE);
      if (scaleElement) {
        const scale = this.previewMap.getImpl().getScale();
        scaleElement.value = `1:${scale}`;
        this.scale = scale;
      }
    }
  }

  /**
   * Reproyecta las capas del mapa de previsualización para que se ajusten a la nueva proyección
   * @param {Object} previewView - Vista actual del mapa de previsualización
   * antes del cambio de proyección
   */
  reproyectLayers(previewView) {
    this.previewMap.getLayers().forEach((layer) => {
      const impl = layer.getImpl();
      if (typeof impl.recreateLayer === 'function') {
        impl.recreateLayer();
      } else if (typeof impl.refresh === 'function') {
        impl.refresh(true);
      } else if (impl.constructor?.name === 'MapLibre') {
        impl.destroy();
        impl.addTo(this.previewMap.getImpl(), true);
        /* eslint-disable-next-line no-underscore-dangle */
      } else if (typeof impl.setProjection_ === 'function') {
        const oldProj = { code: previewView.getProjection().getCode() };
        const newProjObj = { code: this.projection };
        /* eslint-disable-next-line no-underscore-dangle */
        impl.setProjection_(oldProj, newProjObj);
      }
    });
  }

  /**
   * Configura el control de orientación del mapa
   * @param {string} elementId - ID del elemento de orintación del mapa
   */
  setupMapOrientationControl(elementId) {
    const orientationRadios = document.querySelectorAll(elementId);
    orientationRadios.forEach((radio) => {
      radio.addEventListener('change', (e) => {
        this.mapOrientation = e.target.value;
        this.applyMapOrientation();
      });
    });
  }

  /**
   * Configura el control de layout
   */
  setupLayoutControl(templateId) {
    const layoutSelect = document.querySelector(templateId);

    const initialLayout = this.layoutOptions_.find((layout) => layout.default)
      || this.layoutOptions_[0];
    this.applyLayout(initialLayout);

    layoutSelect.addEventListener('change', (e) => {
      const selectedValue = e.target.value;
      const selectedLayout = this.layoutOptions_.find((layout) => layout.value === selectedValue);
      if (selectedLayout) {
        this.layout = selectedLayout.value;
        this.applyLayout(selectedLayout);
      }
      if (this.layoutsRestraintFromDpi.includes(this.layout)) {
        document.querySelector(ID_TEMPLATE_DPI).disabled = true;
        IDEE.toast.warning(getValue('exception.disabledDpiSelector'), null, 6000);
        this.dpi = 96;
      } else {
        document.querySelector(ID_TEMPLATE_DPI).disabled = false;
        this.dpi = document.querySelector(ID_TEMPLATE_DPI).value;
      }
    });
  }

  /**
   * Aplica un layout específico al mapa de previsualización
   * @param {Object} layout - Objeto de layout con dimensiones
   */
  applyLayout(layout) {
    if (!layout || !layout.dimensions) return;

    const mapContainer = document.querySelector(CLASS_MAP_CONTAINER);

    let [widthMm, heightMm] = layout.dimensions;

    if (this.mapOrientation === 'horizontal') {
      [widthMm, heightMm] = [Math.max(widthMm, heightMm), Math.min(widthMm, heightMm)];
    } else {
      [widthMm, heightMm] = [Math.min(widthMm, heightMm), Math.max(widthMm, heightMm)];
    }

    const widthPx = Math.round((widthMm * LAYOUT_DPI) / 25.4);
    const heightPx = Math.round((heightMm * LAYOUT_DPI) / 25.4);

    const wrapperRect = mapContainer.parentNode.getBoundingClientRect();
    const availableWidth = wrapperRect.width - 40;
    const availableHeight = wrapperRect.height - 40;

    const scaleX = availableWidth / widthPx;
    const scaleY = availableHeight / heightPx;
    const scaleFactor = Math.min(scaleX, scaleY, 1);

    mapContainer.style.width = `${widthPx}px`;
    mapContainer.style.height = `${heightPx}px`;
    mapContainer.style.transform = `translate(-50%,-50%) scale(${scaleFactor})`;
    this.previewMap.getMapImpl().updateSize();
  }

  /**
   * Aplica la orientación seleccionada al mapa
   */
  applyMapOrientation() {
    const currentLayout = this.layoutOptions_.find((layout) => layout.value === this.layout);
    if (currentLayout) {
      this.applyLayout(currentLayout);
    }

    this.previewMap.getMapImpl().renderSync();
  }

  /**
   * Genera una imagen en base64 del mapa de previsualización.
   * Clona el contenedor del template y copia los canvas de OpenLayers (GPU-rendered)
   * para que modern-screenshot capture el DOM a tamaño real sin distorsiones de escala.
   * @returns {Promise<string>} Promesa que resuelve con la imagen en base64
   */
  async generateTemplateImage64() {
    const mapContainer = document.querySelector(CLASS_MAP_CONTAINER);

    const clone = mapContainer.cloneNode(true);
    clone.style.transform = 'none';
    clone.style.position = 'fixed';
    clone.style.top = '0';
    clone.style.left = '0';

    document.body.appendChild(clone);

    const templateBody = clone.querySelector('body');
    templateBody.style.width = clone.style.width;
    templateBody.style.height = clone.style.height;

    try {
      const targetElement = clone.querySelector(ID_CONTAINER_DEFAULT_TEMPLATE) || clone;
      const screenshotScale = this.getScreenshotScale(this.dpi);
      const canvas = await domToCanvas(targetElement, {
        backgroundColor: 'white',
        scale: screenshotScale,
      });
      return canvas.toDataURL('image/png', 1.0);
    } finally {
      clone.remove();
    }
  }

  /**
   * Devuelve el factor de escala para modern-screenshot según el DPI elegido.
   * Se garantiza un mínimo de devicePixelRatio para no bajar de la resolución de pantalla.
   * @param {Number} dpi DPI elegido por el usuario
   * @returns {Number} Factor de escala para modern-screenshot
   */
  getScreenshotScale(dpi) {
    const deviceScale = window.devicePixelRatio || 1;
    return Math.max(Number(dpi) / LAYOUT_DPI, deviceScale);
  }

  /**
   * Devuelve la configuración de la plantilla
   * @returns {Object} Configuración de la plantilla
   */
  returnTemplateConfig() {
    return this.previewMap;
  }

  /**
   * Dispara un evento personalizado con la configuración de la plantilla
   * @param {Object} config - Configuración de la plantilla
   */
  async toggleEvent(config) {
    this.loadingOverlay_ = createLoadingSpinner();
    this.generateMapImage64(config);
  }

  /**
   * Genera la imagen en base 64 del visor con el dpi elegido
   * @param {Object} config - Configuración de la plantilla
   */
  generateMapImage64(config) {
    const map = this.previewMap.getMapImpl();
    const originalSize = map.getSize();
    const originalResolution = map.getView().getResolution();

    const scaleFactor = this.dpi / LAYOUT_DPI;
    const newWidth = Math.round(originalSize[0] * scaleFactor);
    const newHeight = Math.round(originalSize[1] * scaleFactor);
    const maskImageContainer = document.querySelector(`${ID_MAP_CONTAINER_TEMPLATE} #mapPanel`) || document.querySelector(`.${MAP_CONTAINER} #mapPanel`);
    const originalMapViewport = map.getViewport();
    const parentNode = originalMapViewport.parentNode;

    map.once('rendercomplete', async () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = newWidth;
        canvas.height = newHeight;
        const context = canvas.getContext('2d');
        // Las capas WebGL llevan la clase ol-layer en el propio canvas
        getLayerCanvases(map).forEach(
          (layerCanvas) => {
            if (layerCanvas.width > 0) {
              context.globalAlpha = getLayerCanvasOpacity(layerCanvas);
              const transform = layerCanvas.style.transform;
              let matrix;
              if (transform) {
                matrix = transform
                  .match(/^matrix\(([^(]*)\)$/)[1]
                  .split(',')
                  .map(Number);
              } else {
                matrix = [
                  parseFloat(layerCanvas.style.width) / layerCanvas.width,
                  0,
                  0,
                  parseFloat(layerCanvas.style.height) / layerCanvas.height,
                  0,
                  0,
                ];
              }
              context.setTransform(...matrix);
              context.drawImage(layerCanvas, 0, 0);
            }
          },
        );
        context.setTransform(1, 0, 0, 1, 0, 0);
        context.globalAlpha = 1;

        map.setSize(originalSize);
        map.getView().setResolution(originalResolution);

        this.insertMapImageIntoTemplate(canvas.toDataURL('image/png'));
        const exportImg = maskImageContainer && maskImageContainer.querySelector('img');
        if (exportImg && !exportImg.complete) {
          await new Promise((resolve) => {
            exportImg.onload = resolve;
            exportImg.onerror = resolve;
          });
        }
        const templateImage64 = await this.generateTemplateImage64();
        const event = new CustomEvent('templateConfigApplied', {
          detail: { templateImage64, config },
        });
        document.dispatchEvent(event);

        if (this.onApplyCallback) {
          this.onApplyCallback({
            instancePreviewMap: this.previewMap.getMapImpl(),
            imagePreviewMap: templateImage64,
            layout: this.layout,
            orientation: this.mapOrientation,
            margin: this.margin,
          });
        }
      } catch (error) {
        map.setSize(originalSize);
        map.getView().setResolution(originalResolution);
        IDEE.toast.error(getValue('exception.printError'), null, 6000);
        // eslint-disable-next-line no-console
        console.error(error);
      } finally {
        if (this.loadingOverlay_) {
          this.loadingOverlay_.remove();
          this.loadingOverlay_ = null;
        }
        if (maskImageContainer) {
          maskImageContainer.innerHTML = '';
        }
        if (parentNode && !parentNode.contains(originalMapViewport)) {
          parentNode.appendChild(originalMapViewport);
        }
      }
    });
    map.setSize([newWidth, newHeight]);
    const scaling = Math.min(newWidth / originalSize[0], newHeight / originalSize[1]);
    map.getView().setResolution(originalResolution / scaling);
  }

  /**
   * Se crea elemento HTML img y en el src se introduce la imagen del mapa en base 64
   * @param {String} mapImage64 Imagen del mapa en base 64
   */
  insertMapImageIntoTemplate(mapImage64) {
    const img = document.createElement('img');
    img.src = mapImage64;
    img.style.width = '100%';
    img.style.height = '100%';
    const imagenMascara = document.querySelector(ID_MAP_CONTAINER_TEMPLATE);
    const containerId = imagenMascara || document.querySelector(`.${MAP_CONTAINER}`);
    const mapPanel = containerId.querySelector('#mapPanel');
    mapPanel.innerHTML = '';
    mapPanel.appendChild(img);
  }

  /**
   * Obtiene la instancia del control ScaleLine
   * @param {Object} options opciones parametrizables del control
   * @returns {IDEE.control.ScaleLine} instancia del control Scaleline
   */
  getScaleLineControl(options = {}) {
    return new IDEE.control.ScaleLine({
      ...options,
      vendorOptions: {
        bar: true,
        text: false,
        minWidth: 140,
        dpi: LAYOUT_DPI,
        // eslint-disable-next-line no-prototype-builtins
        ...(options.hasOwnProperty('vendorOptions') ? options.vendorOptions : {}),
      },
    });
  }
}
