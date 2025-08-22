import html2canvas from 'html2canvas';
import TemplateCustomizerImpl from '../../impl/ol/js/templateCustomizer';
import templateCustomizer from '../../templates/templateCustomizer';
import { getValue } from './i18n/language';
import { PREVIEW_MAP_ORIENTATION } from '../../constants';

const ID_TEMPLATE_ORIENTATION = 'input[name="map-orientation"]';
const ID_TEMPLATE_LAYOUT = '#template-layout';
const ID_TEMPLATE_SCALE = '#template-scale';
const ID_TEMPLATE_DPI = '#template-dpi';
const ID_TEMPLATE_INPUT_SRS = '#epsg-selected';
const ID_TEMPLATE_SRS_SELECTOR = '#m-customize-template-srs-selector';
const ID_MAP_CONTAINER_TEMPLATE = '#imagen-mascara';
const MAP_CONTAINER_TEMPLATE = 'imagen-mascara';
const CLASS_MAP_CONTAINER = '.m-customize-template-right';
const MAP_CONTAINER = 'm-customize-template-right';
const ID_CONTAINER_DEFAULT_TEMPLATE = '#api-idee-template-container';

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
      order,
      helpUrl,
      templateData,
      draggableDialog = true,
      onApply = null,
    },
    map,
  ) {
    const impl = new TemplateCustomizerImpl(map);

    super(impl);

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
          epsg: getValue('projection'),
          select_srs: getValue('select_srs'),
          choose_create_epsg: getValue('choose_create_epsg'),
          dpi: getValue('dpi'),
          apply: getValue('apply'),
          close: getValue('close'),
        },
      },
    });
    IDEE.dialog.info(content.outerHTML, getValue('customizeTemplate'), this.order);
    document.querySelector('.m-dialog>div.m-modal>div.m-content').style.minWidth = '80vw';
    document.querySelector('.m-dialog>div.m-modal>div.m-content').style.minHeight = '80vh';
    document.querySelector('.m-dialog>div.m-modal>div.m-content').style.maxWidth = '80vw';
    document.querySelector('.m-dialog>div.m-modal>div.m-content').style.maxHeight = '80vh';
    document.querySelector('.m-dialog>div.m-modal>div.m-content').style.padding = '0';
    document.querySelector('div.m-api-idee-container div.m-dialog div.m-title').style.backgroundColor = '#71a7d3';

    const buttonContainer = document.querySelector('div.m-dialog.info div.m-button');

    const closeButton = buttonContainer.querySelector('button');
    closeButton.innerHTML = getValue('close');
    closeButton.style.width = '75px';
    closeButton.style.backgroundColor = '#71a7d3';
    closeButton.style.marginRight = '10px';

    const applyButton = document.createElement('button');
    applyButton.innerHTML = getValue('apply');
    applyButton.style.width = '75px';
    applyButton.style.backgroundColor = '#71a7d3';
    applyButton.style.marginRight = '10px';

    buttonContainer.appendChild(applyButton);
    buttonContainer.insertBefore(closeButton, applyButton);

    applyButton.addEventListener('click', () => {
      const config = this.returnTemplateConfig();
      this.toggleEvent(config);
      this.cleanTemplateResources();
      closeButton.click();
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
    this.setupDpiControl(ID_TEMPLATE_DPI);
    this.setupInputSelectorControl(ID_TEMPLATE_INPUT_SRS, ID_TEMPLATE_SRS_SELECTOR);
  }

  /**
   * Crea un mapa de previsualización para la personalización de la plantilla
   * Este mapa se utiliza para mostrar cómo quedará la plantilla con los elementos añadidos.
   * Se configura con la misma vista, zoom y centro que el mapa original.
   */
  createPreviewMap() {
    const imagenMascara = document.querySelector(ID_MAP_CONTAINER_TEMPLATE);
    const containerId = imagenMascara ? MAP_CONTAINER_TEMPLATE : MAP_CONTAINER;
    this.previewMap = new IDEE.Map({
      container: containerId,
      view: this.map.getMapImpl().getView(),
      minZoom: this.map.getImpl().getMinZoom(),
      maxZoom: this.map.getImpl().getMaxZoom(),
      zoom: this.map.getImpl().getZoom(),
      center: Object.values(this.map.getImpl().getCenter()),
    });

    this.previewMap.addLayers(this.map.getLayers());
    const previewContainer = document.querySelector(ID_CONTAINER_DEFAULT_TEMPLATE);
    this.templateElementsContainer_ = previewContainer;
    this.stylesApplied_ = false;
    this.setupViewScaleListener();
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
    const unidades = view.getProjection().getUnits();
    const unidadesMapa = this.getImpl().getMetersPerUnit(unidades);
    const initialResolution = view.getResolution();
    const dpi = Number.parseInt(document.querySelector(ID_TEMPLATE_DPI).value, 10);
    const initalScale = this.getScaleForResolution(initialResolution, unidadesMapa, dpi);
    const scaleEl = document.querySelector(ID_TEMPLATE_SCALE);
    if (scaleEl) {
      scaleEl.value = `1:${initalScale}`;
      this.scale = initalScale;
    }

    view.on('change:resolution', () => {
      const resolution = view.getResolution();
      const scale = this.getScaleForResolution(resolution, unidadesMapa, dpi);
      const scaleElement = document.querySelector(ID_TEMPLATE_SCALE);
      if (scaleElement) {
        scaleElement.value = `1:${scale}`;
        this.scale = scale;
      }
    });
  }

  /**
   * Configura un listener para detectar cambios en el mapa (movimiento, zoom, EPSG, layout, etc.)
   */
  setupMapChangeListener() {
    const view = this.previewMap.getMapImpl().getView();
    view.on('change:center', () => this.updateDataTemplate());
    view.on('change:resolution', () => this.updateDataTemplate());
    view.on('change:rotation', () => this.updateDataTemplate());
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
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    const formattedDate = `${day}/${month}/${year}`;
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
   * Convierte coordenadas decimales a grados, minutos y segundos (DMS)
   * @param {Number} coord Coordenada
   * @returns {String} Coordenadas en formato DMS
   */
  toDMS(coord) {
    const absolute = Math.abs(coord);
    const degrees = Math.floor(absolute);
    const minutesNotTruncated = (absolute - degrees) * 60;
    const minutes = Math.floor(minutesNotTruncated);
    const seconds = Math.floor((minutesNotTruncated - minutes) * 60);
    return `${degrees}º${minutes}'${seconds}"`;
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
   * Maneja el evento de cambio de escala al escribir en el campo de entrada
   * @param {*} e - Evento de cambio en el campo de entrada de escala
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
   * @param {*} scale - La escala a la que se desea hacer zoom
   */
  zoomToScale(scale) {
    if (!scale || Number.isNaN(scale)) return;

    const view = this.previewMap.getMapImpl().getView();
    const dpi = this.dpi;
    const inchesPerMeter = 39.3701;

    const resolution = (scale * 1) / (dpi * inchesPerMeter);
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
        this.setupViewScaleListener();

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
    const map = this.previewMap.getMapImpl();

    dpiSelect.addEventListener('change', (e) => {
      this.dpi = e.target.value;
      const dims = this.layoutOptions_.find((layout) => layout.value === this.layout).dimensions;
      const width = Math.round((dims[1] * this.dpi) / 25.4);
      const height = Math.round((dims[0] * this.dpi) / 25.4);
      const size = map.getSize();
      const viewResolution = map.getView().getResolution();
      const printSize = [width, height];
      map.setSize(printSize);
      const scaling = Math.min(width / size[0], height / size[1]);
      map.getView().setResolution(viewResolution / scaling);
    });
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
        this.changeProjection(inputElement.value);
        this.updateDataTemplate();
      }
    });
  }

  /**
   * Cambia la proyección del mapa de previsualización
   * a la indicada por parámetro
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
      let transformedCenter;
      try {
        transformedCenter = this.getImpl().transformCoordinates(
          currentCenter,
          currentProjection,
          this.projection,
        );
      } catch (error) {
        try {
          await IDEE.impl.ol.js.projections.setNewProjection(epsg);
          transformedCenter = this.getImpl().transformCoordinates(
            currentCenter,
            currentProjection,
            this.projection,
          );
        } catch (err) {
          this.projection = previousProjection;
          inputElement.value = this.projection;
          IDEE.dialog.error(`${getValue('exception.srs')} ${this.projection}`);
          return;
        }
      }

      this.projectionsOptions_ = IDEE.impl.ol.js.projections.getSupportedProjs();
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

      const newView = this.getImpl().createView({
        projection: this.projection,
        center: transformedCenter,
        zoom: previewView.getZoom(),
        minZoom: this.map.getImpl().getMinZoom(),
        maxZoom: this.map.getImpl().getMaxZoom(),
      });

      this.previewMap.getMapImpl().setView(newView);
      this.previewMap.getMapImpl().renderSync();
      this.setupViewScaleListener();

      const scaleElement = document.querySelector(ID_TEMPLATE_SCALE);
      if (scaleElement) {
        const scale = this.previewMap.getImpl().getScale();
        scaleElement.value = `1:${scale}`;
        this.scale = scale;
      }
    }
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

    const widthPx = Math.round((widthMm * 96) / 25.4);
    const heightPx = Math.round((heightMm * 96) / 25.4);

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
   * Genera una imagen en base64 del mapa de previsualización
   * @returns {Promise<string>} Promesa que resuelve con la imagen en base64
   */
  async generateMapImage64() {
    const templateContainer = document.querySelector(ID_CONTAINER_DEFAULT_TEMPLATE);
    const currentLayout = this.layoutOptions_.find((layout) => layout.value === this.layout);
    const originalStyles = this.applyExportStyles(currentLayout);
    const canvas = await html2canvas(templateContainer, {
      useCORS: true,
      allowTaint: true,
      backgroundColor: 'white',
      scale: currentLayout.scale,
    });
    if (this.styleContainer_) {
      this.styleContainer_.textContent = originalStyles;
    }
    return canvas.toDataURL('image/png', 1.0);
  }

  /**
   * Aplica estilos escalados según DPI solo para la exportación
   * @returns {string} Los estilos originales para restauración
   * @param {Object} currentLayout El layout actual
   */
  applyExportStyles(currentLayout) {
    if (!this.styleContainer_) return '';

    const originalStyles = this.styleContainer_.textContent;
    const fontSizeScaleFactor = currentLayout.fontSizeMultiplier;
    const letterSpacingScaleFactor = currentLayout.letterSpacingMultiplier;

    let cssContent = this.templateData_.styles.styleTags.join('\n');

    cssContent = cssContent.replace(/font-size\s*:\s*(\d+\.?\d*)px/g, (match, fontSize) => {
      const originalFontSize = parseFloat(fontSize);
      const scaledFontSize = Math.max(originalFontSize * fontSizeScaleFactor, 1);
      return `font-size: ${scaledFontSize.toFixed(2)}px`;
    });

    cssContent = cssContent.replace(/letter-spacing\s*:\s*(\d+\.?\d*)px/g, (match, letterSpacing) => {
      const originalLetterSpacing = parseFloat(letterSpacing);
      const scaledLetterSpacing = originalLetterSpacing * letterSpacingScaleFactor;
      return `letter-spacing: ${scaledLetterSpacing.toFixed(2)}px`;
    });

    cssContent = cssContent.replace(/\.small-text\s*\{([^}]*)\}/g, `.small-text {$1
      line-height: ${currentLayout.lineHeight}em;
    }`);

    this.styleContainer_.textContent = cssContent;
    return originalStyles;
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
    const image64 = await this.generateMapImage64();
    const event = new CustomEvent('templateConfigApplied', {
      detail: { image64, config },
    });
    document.dispatchEvent(event);

    if (this.onApplyCallback) {
      this.onApplyCallback({
        instancePreviewMap: this.previewMap.getMapImpl(),
        imagePreviewMap: image64,
        layout: this.layout,
        orientation: this.mapOrientation,
      });
    }
  }
}
