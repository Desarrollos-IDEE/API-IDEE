import html2canvas from 'html2canvas';
import TemplateCustomizerImpl from '../../impl/ol/js/templateCustomizer';
import templateCustomizer from '../../templates/templateCustomizer';
import { getValue } from './i18n/language';
import { createLoadingSpinner } from './utils';
import { PREVIEW_MAP_ORIENTATION } from '../../constants';

const ID_TEMPLATE_ORIENTATION = 'input[name="map-orientation"]';
const ID_TEMPLATE_LAYOUT = '#template-layout';
const ID_TEMPLATE_SCALE = '#template-scale';
const ID_TEMPLATE_DPI = '#template-dpi';
const ID_TEMPLATE_INPUT_SRS = '#epsg-selected';
const ID_TEMPLATE_SRS_SELECTOR = '#m-customize-template-srs-selector';
const ID_SHOW_SCALEBAR = '#m-show-scalebar';
const SCALE_LINE_CONTROL_NAME = 'scaleline';
const ID_MAP_CONTAINER_TEMPLATE = '#imagen-mascara';
const MAP_CONTAINER_TEMPLATE = 'imagen-mascara';
const CLASS_MAP_CONTAINER = '.m-customize-template-right';
const MAP_CONTAINER = 'm-customize-template-right';
const ID_CONTAINER_DEFAULT_TEMPLATE = '#api-idee-template-container';
/**
 * DPI de maquetación papel↔CSS en applyLayout (px = mm * LAYOUT_DPI / 25.4).
 * Debe usarse para escala numérica y ScaleLine del preview/PDF.
 * No usar DPI_OGC (~90.7): provoca ~6-7% de error en papel.
 */
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
     * DPI base para el cálculo del parametro scale de la libreria html2canvas
     * @private
     * @type {number}
     */
    this.baseDpi_ = 28;

    /**
     * Escala inicial del mapa de previsualización
     * @private
     * @type {number|null}
     */
    this.scale = null;

    /**
     * Indica si se incluye la barra de escala en la previsualización y la impresión
     * @private
     * @type {Boolean}
     */
    this.showScaleBar_ = true;

    /**
     * Evita recalcular coordenadas del borde durante el export (tamaños DPI incorrectos)
     * @private
     * @type {Boolean}
     */
    this.isExporting_ = false;

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
          scaleBar: getValue('scaleBar'),
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
    document.querySelector('.m-dialog>div.m-modal>div.m-content').style.maxHeight = 'fit-content';
    document.querySelector('.m-dialog>div.m-modal>div.m-content').style.padding = '0';
    document.querySelector('div.m-api-idee-container div.m-dialog div.m-title').style.backgroundColor = '#71a7d3';

    const buttonContainer = document.querySelector('div.m-dialog.info div.m-button');

    const closeButton = buttonContainer.querySelector('button');
    closeButton.innerHTML = getValue('close');
    closeButton.style.width = '75px';
    closeButton.style.padding = '8px';
    closeButton.style.backgroundColor = '#FFF';
    closeButton.style.color = '#71a7d3';
    closeButton.style.border = '1px solid #71a7d3';
    closeButton.style.margin = '10px';
    closeButton.style.borderRadius = '4px';
    closeButton.style.transition = 'background-color 0.3s ease';
    closeButton.addEventListener('mouseover', () => {
      closeButton.style.backgroundColor = '#1470dbFF';
      closeButton.style.color = '#FFF';
    });
    closeButton.addEventListener('mouseout', () => {
      closeButton.style.backgroundColor = '#FFF';
      closeButton.style.color = '#71a7d3';
    });

    const applyButton = document.createElement('button');
    applyButton.innerHTML = getValue('apply');
    applyButton.style.width = '75px';
    applyButton.style.padding = '8px';
    applyButton.style.backgroundColor = '#71a7d3';
    applyButton.style.margin = '10px';
    applyButton.style.borderRadius = '4px';
    applyButton.style.transition = 'background-color 0.3s ease';
    applyButton.addEventListener('mouseover', () => {
      applyButton.style.backgroundColor = '#1470dbFF';
    });
    applyButton.addEventListener('mouseout', () => {
      applyButton.style.backgroundColor = '#71a7d3';
    });

    buttonContainer.appendChild(applyButton);
    buttonContainer.insertBefore(closeButton, applyButton);

    applyButton.addEventListener('click', () => {
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
    this.setupScaleBarControl(ID_SHOW_SCALEBAR);
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
      zoom: this.map.getImpl().getZoom(),
      center: Object.values(this.map.getImpl().getCenter()),
      projection: this.map.getProjection().code,
      controls: [new IDEE.control.ScaleLine({
        bar: true,
        steps: 4,
        dpi: LAYOUT_DPI,
      })],
    });

    this.previewMap.addLayers(this.map.getLayers().map((layer) => layer.clone()));
    this.previewMap.getLayers().forEach((layer) => {
      if (typeof layer.getStyle === 'function' && layer.getStyle()) {
        layer.setStyle(layer.getStyle());
      }
    });
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
    if (this.isExporting_) {
      return;
    }
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
   * Actualiza las coordenadas del borde del mapa.
   * Sin borde: esquinas del viewport del mapa.
   * Con borde: esquinas del marco exterior (interior-container).
   * @param {Object} coordElementsObject Objeto que contiene los elementos de coordenadas del borde
   */
  updateBorderCoordinates(coordElementsObject) {
    const coordElements = coordElementsObject;
    const map = this.previewMap.getMapImpl();
    const view = map.getView();
    let extent = view.calculateExtent(map.getSize());
    if (this.borderElement_) {
      extent = this.expandExtentToBorderFrame(extent);
    }

    const mapProjection = view.getProjection().getCode();
    let minLon;
    let minLat;
    let maxLon;
    let maxLat;
    if (mapProjection === 'EPSG:4326') {
      [minLon, minLat, maxLon, maxLat] = extent;
    } else {
      const corners = [
        [extent[0], extent[1]],
        [extent[0], extent[3]],
        [extent[2], extent[1]],
        [extent[2], extent[3]],
      ];
      const transformed = corners.map((corner) => {
        return this.getImpl().transformCoordinates(corner, mapProjection, 'EPSG:4326');
      });
      const lons = transformed.map((corner) => corner[0]);
      const lats = transformed.map((corner) => corner[1]);
      minLon = Math.min(...lons);
      maxLon = Math.max(...lons);
      minLat = Math.min(...lats);
      maxLat = Math.max(...lats);
    }

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
   * Expande el extent del mapa hasta las esquinas del marco de borde.
   * Usa el viewport OL y compensa el CSS transform: scale del preview.
   * @param {Array<number>} mapExtent Extent del viewport [minX, minY, maxX, maxY]
   * @returns {Array<number>} Extent ampliado al interior-container
   */
  expandExtentToBorderFrame(mapExtent) {
    const map = this.previewMap.getMapImpl();
    const borderEl = this.borderElement_;
    if (!borderEl) {
      return mapExtent;
    }
    const viewport = map.getViewport();
    if (!viewport) {
      return mapExtent;
    }
    const mapSize = map.getSize();
    if (!mapSize || mapSize[0] <= 0 || mapSize[1] <= 0) {
      return mapExtent;
    }

    const mapRect = viewport.getBoundingClientRect();
    const borderRect = borderEl.getBoundingClientRect();
    if (mapRect.width <= 0 || mapRect.height <= 0) {
      return mapExtent;
    }

    // getBoundingClientRect está afectado por transform:scale; map.getSize() no.
    const scaleX = mapSize[0] / mapRect.width;
    const scaleY = mapSize[1] / mapRect.height;
    const leftPx = (borderRect.left - mapRect.left) * scaleX;
    const topPx = (borderRect.top - mapRect.top) * scaleY;
    const rightPx = (borderRect.right - mapRect.left) * scaleX;
    const bottomPx = (borderRect.bottom - mapRect.top) * scaleY;

    const topLeft = map.getCoordinateFromPixel([leftPx, topPx]);
    const topRight = map.getCoordinateFromPixel([rightPx, topPx]);
    const bottomLeft = map.getCoordinateFromPixel([leftPx, bottomPx]);
    const bottomRight = map.getCoordinateFromPixel([rightPx, bottomPx]);
    if (!topLeft || !topRight || !bottomLeft || !bottomRight) {
      return mapExtent;
    }

    const xs = [topLeft[0], topRight[0], bottomLeft[0], bottomRight[0]];
    const ys = [topLeft[1], topRight[1], bottomLeft[1], bottomRight[1]];
    return [
      Math.min(...xs),
      Math.min(...ys),
      Math.max(...xs),
      Math.max(...ys),
    ];
  }

  /**
   * Convierte coordenadas decimales a grados, minutos y segundos (DMS).
   * Redondea segundos para reducir el error sistemático del truncado.
   * @param {Number} coord Coordenada
   * @returns {String} Coordenadas en formato DMS
   */
  toDMS(coord) {
    const sign = coord < 0 ? '-' : '';
    const absolute = Math.abs(coord);
    const degrees = Math.floor(absolute);
    const minutesNotTruncated = (absolute - degrees) * 60;
    const minutes = Math.floor(minutesNotTruncated);
    let seconds = Math.round((minutesNotTruncated - minutes) * 60);
    let finalDegrees = degrees;
    let finalMinutes = minutes;
    if (seconds === 60) {
      seconds = 0;
      finalMinutes += 1;
    }
    if (finalMinutes === 60) {
      finalMinutes = 0;
      finalDegrees += 1;
    }
    return `${sign}${finalDegrees}º${finalMinutes}'${seconds}"`;
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
        this.previewMap.getMapImpl().updateSize();
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
        this.previewMap.getMapImpl().updateSize();
        const coordElements = this.getBorderCoordinates();
        if (Object.values(coordElements).every((el) => el !== null)) {
          this.updateBorderCoordinates(coordElements);
        }
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
   * Configura el checkbox para incluir o no la barra de escala en la impresión
   * y en la previsualización.
   * @param {string} checkboxId Selector del checkbox
   */
  setupScaleBarControl(checkboxId) {
    const checkbox = document.querySelector(checkboxId);
    if (!checkbox) {
      return;
    }
    this.showScaleBar_ = checkbox.checked;
    this.setPreviewScaleBarVisible(this.showScaleBar_);
    checkbox.addEventListener('change', (e) => {
      this.showScaleBar_ = e.target.checked;
      this.setPreviewScaleBarVisible(this.showScaleBar_);
    });
  }

  /**
   * Muestra u oculta el ScaleLine del mapa de previsualización.
   * @param {boolean} visible Si true, añade la barra; si false, la elimina
   */
  setPreviewScaleBarVisible(visible) {
    if (!this.previewMap) {
      return;
    }
    const hasScaleLine = this.previewMap.hasControl(SCALE_LINE_CONTROL_NAME);
    if (visible) {
      if (!hasScaleLine) {
        this.previewMap.addControls(new IDEE.control.ScaleLine({
          bar: true,
          steps: 4,
          dpi: LAYOUT_DPI,
        }));
      }
      return;
    }
    if (hasScaleLine) {
      this.previewMap.removeControls(SCALE_LINE_CONTROL_NAME);
    }
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
   * Zooms the map to a specific scale (respecto al papel / LAYOUT_DPI).
   * Usa la inversa de getScaleForResolution para no desfasar la escala ~x1000.
   * @param {*} scale - La escala a la que se desea hacer zoom
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
   * Obtiene el ScaleLine de OpenLayers del mapa de preview.
   * @param {Object} map Mapa OL
   * @returns {Object|null}
   */
  getOlScaleLineControl(map) {
    const controls = map.getControls().getArray();
    const scaleLine = controls.find((control) => {
      return typeof control.getDpi === 'function' && typeof control.setDpi === 'function';
    });
    if (!scaleLine) {
      return null;
    }
    return scaleLine;
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
        this.changeProjection(inputElement.value.startsWith('EPSG:') ? inputElement.value : `EPSG:${inputElement.value}`);
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
          IDEE.dialog.error(`${getValue('exception.srs')} ${this.projection}`);
          return;
        }
      }

      inputElement.value = this.projection;
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
        this.dpi = 72;
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
    if (this.previewMap) {
      this.previewMap.getMapImpl().updateSize();
    }
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
   * Inyecta CSS para que la plantilla ocupe el 100% de la página en exportación.
   * @returns {HTMLStyleElement} Nodo de estilo (hay que eliminarlo al terminar)
   */
  injectFullPageTemplateStyles() {
    const fullPageStyle = document.createElement('style');
    fullPageStyle.setAttribute('data-print-fullpage', 'true');
    fullPageStyle.textContent = `
      ${ID_CONTAINER_DEFAULT_TEMPLATE},
      ${ID_CONTAINER_DEFAULT_TEMPLATE} .interior-container,
      ${ID_CONTAINER_DEFAULT_TEMPLATE} .superior-container,
      ${ID_CONTAINER_DEFAULT_TEMPLATE} .inferior-container,
      ${ID_CONTAINER_DEFAULT_TEMPLATE} .api-idee-template-container {
        width: 100% !important;
        max-width: 100% !important;
        margin-left: 0 !important;
        margin-right: 0 !important;
        left: 0 !important;
        right: 0 !important;
      }
      ${ID_CONTAINER_DEFAULT_TEMPLATE} {
        width: 100% !important;
        height: 100% !important;
        box-sizing: border-box !important;
      }
    `;
    document.head.appendChild(fullPageStyle);
    return fullPageStyle;
  }

  /**
   * Genera una imagen en base64 de la página de plantilla (ratio del PDF).
   * @param {Object} [options]
   * @param {boolean} [options.keepFullPageStyles=false] Si true, no inyecta/quita el CSS 100%
   * @param {HTMLStyleElement} [options.fullPageStyle] Estilo ya inyectado por el caller
   * @returns {Promise<string>} Imagen en base64
   */
  async generateTemplateImage64(options = {}) {
    const keepFullPageStyles = options.keepFullPageStyles === true;
    const pageContainer = document.querySelector(CLASS_MAP_CONTAINER);
    const templateContainer = document.querySelector(ID_CONTAINER_DEFAULT_TEMPLATE);
    const currentLayout = this.layoutOptions_.find((layout) => layout.value === this.layout);
    const originalStyles = this.applyExportStyles(currentLayout);

    let previousTransform = '';
    if (pageContainer) {
      previousTransform = pageContainer.style.transform;
      pageContainer.style.transform = 'translate(-50%, -50%) scale(1)';
    }

    let fullPageStyle = options.fullPageStyle || null;
    if (!keepFullPageStyles) {
      fullPageStyle = this.injectFullPageTemplateStyles();
    }

    const html2canvasScale = this.getHtml2CanvasScale(this.dpi);
    const captureTarget = pageContainer || templateContainer;
    let canvas;
    try {
      canvas = await html2canvas(captureTarget, {
        useCORS: true,
        allowTaint: true,
        backgroundColor: 'white',
        scale: html2canvasScale,
        width: captureTarget.offsetWidth,
        height: captureTarget.offsetHeight,
        windowWidth: captureTarget.offsetWidth,
        windowHeight: captureTarget.offsetHeight,
      });
    } finally {
      if (!keepFullPageStyles && fullPageStyle) {
        fullPageStyle.remove();
      }
      if (pageContainer && !keepFullPageStyles) {
        pageContainer.style.transform = previousTransform;
      }
      if (this.styleContainer_) {
        this.styleContainer_.textContent = originalStyles;
      }
    }
    return canvas.toDataURL('image/png', 1.0);
  }

  /**
   * Funcion que devuelve el factor de escala de la libreria
   * html2canvas según el dpi elegido.
   * @param {Number} dpi DPI elegido por el usuario
   * @returns {Number} Factor de escala para html2canvas
   */
  getHtml2CanvasScale(dpi) {
    return Number(dpi) / this.baseDpi_;
  }

  /**
   * Aplica estilos escalados según DPI solo para la exportación
   * @returns {string} Los estilos originales para restauración
   * @param {Object} currentLayout El layout actual
   */
  applyExportStyles(currentLayout) {
    if (!this.styleContainer_) return '';

    const originalStyles = this.styleContainer_.textContent;
    let fontSizeScaleFactor = currentLayout.fontSizeMultiplier;
    let letterSpacingScaleFactor = currentLayout.letterSpacingMultiplier;

    let cssContent = this.templateData_.styles.styleTags.join('\n');

    if (this.mapOrientation === 'vertical') {
      fontSizeScaleFactor *= 0.625;
      letterSpacingScaleFactor *= 2.5;
    }

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
    this.loadingOverlay_ = createLoadingSpinner();
    this.generateMapImage64(config);
  }

  /**
   * Genera la imagen en base 64 del visor con el dpi elegido.
   * Mantiene la vista (centro + escala) y renderiza al tamaño del marco
   * para no deformar el mapa al insertarlo al 100%.
   * @param {Object} config - Configuración de la plantilla
   */
  generateMapImage64(config) {
    const map = this.previewMap.getMapImpl();
    const view = map.getView();
    const originalSize = map.getSize();
    const originalResolution = view.getResolution();
    const center = view.getCenter();
    const printDpi = Number(this.dpi);

    this.isExporting_ = true;

    const mapContainer = document.querySelector(CLASS_MAP_CONTAINER);
    let originalTransform = '';
    if (mapContainer) {
      originalTransform = mapContainer.style.transform;
      mapContainer.style.transform = 'translate(-50%, -50%) scale(1)';
    }

    // 100% de página ANTES de medir el marco y renderizar el mapa
    const fullPageStyle = this.injectFullPageTemplateStyles();

    const maskImageContainer = document.querySelector(`#${MAP_CONTAINER_TEMPLATE}`);
    map.updateSize();

    // Forzar layout a escala 1 antes de medir el marco del borde
    if (mapContainer) {
      mapContainer.getBoundingClientRect();
    }
    if (this.borderElement_) {
      this.borderElement_.getBoundingClientRect();
    }

    // Coordenadas del borde con layout a escala 1 (antes del setSize DPI)
    const coordElements = this.getBorderCoordinates();
    if (Object.values(coordElements).every((el) => el !== null)) {
      this.updateBorderCoordinates(coordElements);
    }

    let baseWidth = originalSize[0];
    let baseHeight = originalSize[1];
    if (maskImageContainer && maskImageContainer.clientWidth > 0
      && maskImageContainer.clientHeight > 0) {
      baseWidth = maskImageContainer.clientWidth;
      baseHeight = maskImageContainer.clientHeight;
    }

    const scaleFactor = printDpi / LAYOUT_DPI;
    const newWidth = Math.round(baseWidth * scaleFactor);
    const newHeight = Math.round(baseHeight * scaleFactor);

    const originalMapViewport = map.getViewport();
    const parentNode = originalMapViewport.parentNode;

    const cleanupExportLayout = () => {
      fullPageStyle.remove();
      if (mapContainer) {
        mapContainer.style.transform = originalTransform;
      }
      this.isExporting_ = false;
    };

    map.once('rendercomplete', async () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = newWidth;
        canvas.height = newHeight;
        const context = canvas.getContext('2d');
        Array.prototype.forEach.call(
          map.getViewport().querySelectorAll('.ol-layer canvas, canvas.ol-layer'),
          (layerCanvas) => {
            if (layerCanvas.width > 0) {
              const opacity = layerCanvas.parentNode.style.opacity
                || layerCanvas.style.opacity
                || '1';
              context.globalAlpha = Number(opacity);
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
        if (this.showScaleBar_) {
          this.drawExportScaleBar(context, map, newWidth, newHeight);
        }

        // Quitar el viewport del DOM y poner la imagen; layout sigue al 100%
        if (maskImageContainer) {
          this.insertMapImageIntoTemplate(canvas.toDataURL('image/png'));
        }

        const templateImage64 = await this.generateTemplateImage64({
          keepFullPageStyles: true,
          fullPageStyle,
        });

        cleanupExportLayout();

        map.setSize(originalSize);
        view.setResolution(originalResolution);
        view.setCenter(center);

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
          });
        }
        if (this.loadingOverlay_) {
          this.loadingOverlay_.remove();
          this.loadingOverlay_ = null;
        }
        if (maskImageContainer) {
          maskImageContainer.innerHTML = '';
        }
        parentNode.appendChild(originalMapViewport);
        map.updateSize();
      } catch (error) {
        cleanupExportLayout();
        map.setSize(originalSize);
        view.setResolution(originalResolution);
        view.setCenter(center);
        if (this.loadingOverlay_) {
          this.loadingOverlay_.remove();
          this.loadingOverlay_ = null;
        }
        if (parentNode && originalMapViewport && !parentNode.contains(originalMapViewport)) {
          parentNode.appendChild(originalMapViewport);
        }
        IDEE.toast.error(error.message, null, 6000);
      }
    });

    map.setSize([newWidth, newHeight]);
    view.setCenter(center);
    view.setResolution(originalResolution / scaleFactor);
  }

  /**
   * Dibuja una barra de escala métrica coherente con la resolución del canvas exportado.
   * Evita html2canvas (desalineaba y cortaba etiquetas).
   * @param {CanvasRenderingContext2D} context Contexto del canvas de exportación
   * @param {Object} map Mapa OL en el estado de exportación
   * @param {number} canvasWidth Ancho del canvas
   * @param {number} canvasHeight Alto del canvas
   */
  drawExportScaleBar(context, map, canvasWidth, canvasHeight) {
    const view = map.getView();
    const center = view.getCenter();
    const projection = view.getProjection();
    let pointResolution = this.getImpl().getMetricPointResolution(
      projection,
      view.getResolution(),
      center,
    );
    if (!pointResolution || pointResolution <= 0) {
      return;
    }

    // Misma lógica de “números redondos” que OpenLayers ScaleLine (métrico)
    const leadingDigits = [1, 2, 5];
    const minWidthPx = Math.max(64, Math.round(canvasWidth * 0.08));
    const nominalCount = minWidthPx * pointResolution;
    let suffix = 'm';
    if (nominalCount < 1) {
      suffix = 'mm';
      pointResolution *= 1000;
    } else if (nominalCount >= 1000) {
      suffix = 'km';
      pointResolution /= 1000;
    }

    let i = 3 * Math.floor(Math.log(minWidthPx * pointResolution) / Math.log(10));
    let count = 0;
    let width = 0;
    let found = false;
    while (!found && i < 100) {
      const decimalCount = Math.floor(i / 3);
      const decimal = 10 ** decimalCount;
      const digitIndex = ((i % 3) + 3) % 3;
      count = leadingDigits[digitIndex] * decimal;
      width = Math.round(count / pointResolution);
      if (width >= minWidthPx) {
        found = true;
      } else {
        i += 1;
      }
    }
    if (!found || width <= 0) {
      return;
    }

    const steps = 4;
    const margin = Math.max(8, Math.round(canvasWidth * 0.012));
    const barHeight = Math.max(8, Math.round(canvasHeight * 0.012));
    const fontSize = Math.max(10, Math.round(canvasHeight * 0.018));
    const labelGap = Math.max(4, Math.round(fontSize * 0.35));
    const x0 = margin;
    const y0 = canvasHeight - margin - barHeight - fontSize - labelGap;

    context.save();
    context.fillStyle = 'rgba(255,255,255,0.75)';
    context.fillRect(
      x0 - 4,
      y0 - fontSize - labelGap - 2,
      width + 8,
      barHeight + fontSize + labelGap + 6,
    );

    const stepWidth = width / steps;
    for (let step = 0; step < steps; step += 1) {
      if (step % 2 === 0) {
        context.fillStyle = '#000000';
      } else {
        context.fillStyle = '#ffffff';
      }
      context.fillRect(x0 + (step * stepWidth), y0, stepWidth, barHeight);
    }
    context.strokeStyle = '#000000';
    context.lineWidth = 1;
    context.strokeRect(x0, y0, width, barHeight);

    context.fillStyle = '#000000';
    context.font = `${fontSize}px sans-serif`;
    context.textBaseline = 'bottom';
    const labelY = y0 - labelGap;
    const midCount = count / 2;
    let midLabel = `${midCount}`;
    if (midCount % 1 !== 0) {
      midLabel = midCount.toFixed(1);
    }
    context.textAlign = 'left';
    context.fillText('0', x0, labelY);
    context.textAlign = 'center';
    context.fillText(midLabel, x0 + (width / 2), labelY);
    context.textAlign = 'right';
    context.fillText(`${count} ${suffix}`, x0 + width, labelY);
    context.restore();
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
    let containerId = MAP_CONTAINER;
    if (imagenMascara) {
      containerId = MAP_CONTAINER_TEMPLATE;
    }
    const maskImageContainer = document.querySelector(`#${containerId}`);
    maskImageContainer.innerHTML = '';
    maskImageContainer.appendChild(img);
  }
}
