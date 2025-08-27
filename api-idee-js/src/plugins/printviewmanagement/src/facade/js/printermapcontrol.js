/**
 * @module IDEE/control/PrinterMapControl
 */

import PrinterMapControlImpl from 'impl/printermapcontrol';
import { reproject } from 'impl/utils';
import jsPDF from 'jspdf';
import printermapHTML from '../../templates/printermap';
import { getValue } from './i18n/language';
import TemplateCustomizer from './templateCustomizer';
import {
  innerQueueElement, removeLoadQueueElement, createZipFile,
  generateTitle, getBase64Image, formatImageBase64,
} from './utils';
import {
  DPI_OPTIONS,
  LAYOUTS,
  PRINTERMAP_FORMATS,
  PROJECTIONS_TEMPLATE,
  TEMPLATE_ELEMENTS,
} from '../../constants';
import defaultTemplate from '../../templates/defaultTemplate';

const ID_TITLE = '#m-printermap-title';
const ID_FORMAT_SELECT = '#m-printermap-format';
const ID_CUSTOM_TEMPLATE = '#m-printermap-customTemplate';
const ID_PRINTERMAP_BUTTON = '#m-printviewmanagement-printermap';
const ID_PRINTERMAP_CONTROL = '#m-printviewmanagement-controls';
const ID_TEMPLATE_UPLOAD = '#m-printermap-template-upload';
const ID_UPLOADED_TEMPLATES = '#m-printermap-uploaded-templates';
export default class PrinterMapControl extends IDEE.Control {
  /**
    * @classdesc
    * Constructor de la clase del primer control de impresión del mapa.
    *
    * @constructor
    * @extends {IDEE.Control}
    * @api stable
    */
  constructor(
    {
      order,
      tooltip,
      filterTemplates,
      showDefaultTemplate,
      defaultDpiOptions,
      layoutsRestraintFromDpi,
    },
    map,
    statusProxy,
    useProxy,
  ) {
    if (IDEE.utils.isUndefined(PrinterMapControlImpl)
      || (IDEE.utils.isObject(PrinterMapControlImpl)
      && IDEE.utils.isNullOrEmpty(Object.keys(PrinterMapControlImpl)))) {
      IDEE.exception(getValue('exception.impl'));
    }
    const impl = new PrinterMapControlImpl(map);

    super(impl, PrinterMapControl.NAME);

    /**
     * Instacia del mapa
     * @private
     * @type {IDEE.Map}
     */
    this.map_ = map;

    if (IDEE.utils.isUndefined(PrinterMapControlImpl.prototype.encodeLayer)) {
      IDEE.exception(getValue('exception.encode'));
    }

    /**
     * Configuración del editor de plantilla proveniente del control templateCustomizer
     * @private
     * @type {Object | null}
     */
    this.templateConfig = null;

    /**
     * Array de los templates subidos por el usuario
     * @private
     * @type {Array<Object>}
     */
    this.uploadedTemplates = [];

    /**
      * Opciones por defecto para la impresión del mapa.
      * @private
      * @type {String}
      */
    this.options_ = {
      dpi: 150,
      keepView: true,
      format: 'pdf',
      legend: 'false',
      layout: 'A4',
    };

    /**
     * Opciones de plantillas para la impresión del mapa.
     * @private
     * @type {Array<Object>}
     */
    this.layoutOptions_ = LAYOUTS;

    /**
     * Opciones de DPI para la impresión del mapa.
     * @private
     * @type {Array<Number>}
     */
    this.dpiOptions_ = defaultDpiOptions || DPI_OPTIONS;

    /**
     * Layouts en los que no se puede modificar el nivel de DPI.
     * @private
     * @type {Array<String>}
     */
    this.layoutsRestraintFromDpi = layoutsRestraintFromDpi || [];

    /**
     * Formatos de salida para la impresión del mapa.
     * @private
     * @type {Array<String>}
     */
    this.outputFormats_ = PRINTERMAP_FORMATS;

    /**
     * Proyecciones por defecto para la impresión del mapa.
     * @private
     * @type {Array<String>}
     */
    this.proyectionsDefect_ = PROJECTIONS_TEMPLATE;

    /**
     * Posibles elementos que puede tener una plantilla de impresión.
     * @private
     * @type {Array<String>}
     */
    this.defaultTemplateElements = TEMPLATE_ELEMENTS;

    /**
     * Ima
     */
    this.documentRead_ = document.createElement('img');

    /**
     * Orden de tabulación para los elementos del control.
     * @private
     * @type {Number}
     */
    this.order = order >= -1 ? order : null;

    /**
     * Tooltip para el control de impresión del mapa.
     */
    this.tooltip_ = tooltip || getValue('tooltip');

    /**
     * Estado del proxy
     * @private
     * @type {Boolean}
     */
    this.statusProxy = statusProxy;

    /**
     * Indica si se utiliza un proxy para las peticiones.
     * @private
     * @type {Boolean}
     */
    this.useProxy = useProxy;

    /**
     *  Array de paths donde se encuentran las plantillas por defecto (opcional)
     * @private
     * @type {Array<String>}
     */
    this.filterTemplates = filterTemplates || [];

    /**
     * Si se puede seleccionar la plantilla que tiene el plugin por defecto
     * @private
     * @type {Boolean}
     */
    this.showDefaultTemplate = showDefaultTemplate || false;
  }

  /**
    * Crea el control de impresión del mapa.
    *
    * @public
    * @function
    * @param {IDEE.Map} map to add the control
    * @api stabletrue
    */
  async active(html) {
    this.html_ = html;
    const button = this.html_.querySelector(ID_PRINTERMAP_BUTTON);

    const template = IDEE.template.compileSync(printermapHTML, {
      jsonp: true,
      vars: {
        formats: this.outputFormats_,
        translations: {
          tooltip: getValue('tooltip'),
          title: getValue('title'),
          description: getValue('description'),
          layout: getValue('layout'),
          format: getValue('format'),
          projection: getValue('projection'),
          delete: getValue('delete'),
          download: getValue('download'),
          fixeddescription: getValue('fixeddescription'),
          nameTitle: getValue('title_map'),
          maintain_view: getValue('maintain_view'),
          customizeTemplate: getValue('customizeTemplate'),
          uploadTemplate: getValue('uploadTemplate'),
          selectUploadedTemplate: getValue('selectUploadedTemplate'),
        },
      },
    });

    this.accessibilityTab(template);

    this.template_ = template;

    this.addEvents(template);

    if (this.filterTemplates.length > 0) {
      await this.loadFilterTemplates();
    }

    if (!button.classList.contains('activated')) {
      this.html_.querySelector(ID_PRINTERMAP_CONTROL).appendChild(template);
    } else {
      document.querySelector('.m-printermap-container').remove();
    }
    button.classList.toggle('activated');
  }

  /**
   * Loads and processes templates from this.filterTemplates
   * @private
   * @function
   */
  async loadFilterTemplates() {
    try {
      const promises = this.filterTemplates.map(async (templatePath) => {
        const normalizedPath = templatePath.startsWith('http') || templatePath.startsWith('/')
          ? templatePath
          : `/${templatePath}`;

        const response = await fetch(normalizedPath, {
          headers: { 'Accept': 'text/html' },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch template at ${templatePath}: ${response.statusText}`);
        }

        const content = await response.text();
        const templateName = templatePath.split('/').pop().split('.')[0];

        const file = { name: `${templateName}.html` };

        this.handleTemplateUpload({ target: { result: content } }, file);
      });

      await Promise.all(promises);
    } catch (error) {
      IDEE.toast.error(`Error loading templates: ${error.message}`, null, 3000);
    }
  }

  /**
    * Ejecuta la funcion de impresión según si se ha configurado una plantilla de impresión o no.
    *
    * @private
    * @function
    */
  printClick(evt) {
    evt.preventDefault();
    if (IDEE.utils.isNullOrEmpty(this.templateConfig)) {
      this.downloadClient();
    } else {
      this.downloadClient(this.templateConfig);
    }
  }

  /**
   * Exporta una imagen base64 a un archivo PDF
   * @param {Object} options - Opciones para la exportación
   * @param {string} options.imageData - Datos de la imagen en base64
   * @param {string} options.imageType - Tipo de imagen ('PNG' o 'JPEG')
   * @param {string} options.title - Título del documento
   * @param {Object} options.layout - Dimensiones del PDF
   * @param {Function} options.errorCallback - Función a ejecutar en caso de error
   * @param {Function} options.finallyCallback - Función a ejecutar al finalizar
   */
  exportImageToPdf({
    imageData,
    imageType = 'PNG',
    title = 'map',
    layout = 'a4',
    orientation = 'horizontal',
    errorCallback = () => {},
    finallyCallback = () => {},
  }) {
    const dimensions = this.layoutOptions_.find((l) => l.value.toLowerCase()
    === layout.toLowerCase()).dimensions;
    if (orientation === 'vertical') {
      [dimensions[0], dimensions[1]] = [dimensions[1], dimensions[0]];
    }
    // eslint-disable-next-line new-cap
    const doc = new jsPDF({
      orientation: orientation === 'vertical' ? 'portrait' : 'landscape',
      unit: 'mm',
      format: dimensions,
    });

    try {
      doc.addImage(
        imageData,
        imageType,
        0,
        0,
        dimensions[1],
        dimensions[0],
      );
      doc.save(`${title}.pdf`);
    } catch (error) {
      errorCallback(error);
    } finally {
      finallyCallback();
    }
  }

  /**
   * Esta función descarga el mapa en el formato seleccionado.
   * @param {Object} config - Configuración de la plantilla proveniente del
   * control templateCustomizer
   */
  downloadClient(config = null) {
    const formatImage = document.querySelector(ID_FORMAT_SELECT).value;
    const title = document.querySelector(ID_TITLE);
    const queueEl = innerQueueElement(
      this.html_,
      title,
      this.elementQueueContainer_,
    );

    if (formatImage === 'pdf') {
      const imageData = config
        ? config.imagePreviewMap
        : IDEE.utils.getImageMap(this.map_, 'image/jpeg');

      const imageType = config ? 'PNG' : 'JPEG';

      this.exportImageToPdf({
        imageData,
        imageType,
        title: title.value,
        layout: (config && config.layout) ? config.layout : 'a4',
        orientation: (config && config.orientation) ? config.orientation : 'horizontal',
        errorCallback: (error) => {
          queueEl.parentElement.remove();
          IDEE.toast.error(error.message, null, 6000);
        },
        finallyCallback: () => removeLoadQueueElement(queueEl),
      });
    } else {
      const base64image = config
        ? config.imagePreviewMap
        : IDEE.utils.getImageMap(this.map_, `image/${formatImage}`);
      this.downloadPrint(queueEl, base64image);
    }
    this.templateConfig = null;
  }

  /**
   * Construye el zip con la imagen del mapa y setea el evento de descarga.
   * @param {HTMLElement} queueEl Elemento de la cola de descarga
   * @param {String} imgBase64 Imagen en formato base64.
   * Si no se pasa, se obtiene de la imagen del mapa.
   * @param {Object} config Configuración de la plantilla proveniente del control templateCustomizer
   */
  downloadPrint(queueEl, imgBase64) {
    const formatImage = document.querySelector(ID_FORMAT_SELECT).value;
    const title = document.querySelector(ID_TITLE).value;

    const base64image = (imgBase64) ? formatImageBase64(imgBase64) : getBase64Image(
      this.documentRead_.src,
      formatImage,
    );

    const titulo = generateTitle(title);

    const fileIMG = {
      name: titulo.concat(`.${formatImage === 'jpeg' ? 'jpg' : formatImage}`),
      data: base64image,
      base64: true,
    };

    const zipEvent = (evt) => {
      if (evt.key === undefined || evt.key === 'Enter' || evt.key === ' ') {
        createZipFile([fileIMG], '.zip', titulo);
      }
    };

    queueEl.addEventListener('click', zipEvent);
    queueEl.addEventListener('keydown', zipEvent);
    removeLoadQueueElement(queueEl);
  }

  /**
   * Esta funcion realiza la carga de un template
   */
  setupTemplateUpload() {
    const templateFile = this.template_.querySelector(ID_TEMPLATE_UPLOAD);
    const file = templateFile.files[0];

    if (!file) return;

    const reader = new window.FileReader();
    reader.onload = (event) => this.handleTemplateUpload(event, file);
    reader.onerror = () => IDEE.toast.error(getValue('loadTemplateError'), null, 3000);
    reader.readAsText(file);
  }

  /**
   * Esta funcion comprueba que el template cumpla con los requisitos
   * @param {Event} event Evento de carga del archivo
   * @param {File} file Archivo cargado
   * @returns
   */
  handleTemplateUpload(event, file) {
    const content = event.target.result;
    const templateName = file.name.split('.')[0];

    if (!this.validateTemplateName(templateName)) return;
    if (!this.checkDuplicateTemplate(templateName, content)) return;

    const doc = this.parseTemplateContent(content);
    const validationResult = this.validateTemplateElements(doc);

    if (!validationResult.isValid) {
      return;
    }

    const templateData = this.createTemplateData(
      templateName,
      content,
      validationResult.validElements,
      this.extractStyles(doc),
      this.extractScripts(doc),
    );

    this.saveTemplate(templateData);
  }

  /**
   * Esta funcion valida el nombre del template
   * @param {String} templateName Nombre del template
   * @returns {boolean} true si el nombre es valido, false si ya existe
   */
  validateTemplateName(templateName) {
    const selectElement = this.template_.querySelector(ID_UPLOADED_TEMPLATES);

    const options = Array.from(selectElement.options);
    const nameExists = options.some((option) => {
      return option.value.toLowerCase() === templateName.toLowerCase();
    });

    if (nameExists) {
      IDEE.dialog.error(`${getValue('templateSameName')} "${templateName}"`);
      return false;
    }

    return true;
  }

  /**
   * Esta funcion parsea el contenido del template
   * @param {*} content Contenido del template
   * @returns {Document} Documento HTML parseado
   */
  parseTemplateContent(content) {
    const parser = new DOMParser();
    return parser.parseFromString(content, 'text/html');
  }

  /**
   * Esta funcion valida el atributo data-type de los elementos
   * @param {Document} doc Contenido del template parseado a HTML
   * @returns
   */
  validateTemplateElements(doc) {
    const elementsWithType = doc.querySelectorAll('[data-type]');
    if (elementsWithType.length === 0) {
      IDEE.dialog.error(getValue('noDataType'));
      return { isValid: false };
    }
    const requiredPrefix = 'api-idee-template-';
    const result = {
      validElements: [],
      invalidElements: [],
      isValid: true,
    };

    elementsWithType.forEach((element) => {
      const typeValue = element.getAttribute('data-type');

      if (!typeValue.startsWith(requiredPrefix)) {
        result.invalidElements.push(`${element.tagName} (data-type="${typeValue}")`);
        result.isValid = false;
        return;
      }

      const suffix = typeValue.slice(requiredPrefix.length);

      if (!this.defaultTemplateElements.includes(suffix)) {
        result.invalidElements.push(`${element.tagName} (data-type="${typeValue}")`);
        result.isValid = false;
      } else {
        result.validElements.push({
          element,
          type: typeValue,
        });
      }
    });
    if (result.invalidElements.length > 0) {
      IDEE.dialog.error(`${getValue('invalidDataType')}`);
    }
    return result;
  }

  /**
   * Esta funcion extrae los estilos del template
   * @param {Document} doc contenido del documento html
   * @returns {Object} styles - Objeto con {styleTags: [], typeStyles: {}}
   */
  extractStyles(doc) {
    const styles = {
      styleTags: [],
      typeStyles: {},
    };

    doc.querySelectorAll('style').forEach((styleTag) => {
      if (styleTag.textContent.trim()) {
        styles.styleTags.push(styleTag.textContent);
      }
    });

    doc.querySelectorAll('[style]').forEach((element) => {
      const typeAttr = element.getAttribute('data-type');
      if (typeAttr && element.getAttribute('style').trim()) {
        styles.typeStyles[typeAttr] = element.getAttribute('style');
      }
    });

    return styles;
  }

  /**
   * Esta funcion extrae los scripts del template
   * @param {Document} doc contenido del documento html
   * @returns {Object} scripts - Objeto con {src: [], inline: []}
   */
  extractScripts(doc) {
    const scripts = {
      src: [],
      inline: [],
    };
    doc.querySelectorAll('script').forEach((script) => {
      if (script.src) {
        scripts.src.push(script.src);
      }
      if (script.textContent && script.textContent.trim()) {
        scripts.inline.push(script.textContent.trim());
      }
    });
    return scripts;
  }

  /**
   * Esta funcion crea el objeto de datos del template
   * @param {*} name Nombre del template
   * @param {*} content Contenido del template
   * @param {*} validElements Array de elementos validos del template
   * @param {*} styles Objeto con estilos del template
   * @param {*} scripts Objeto con scripts del template
   * @returns {Object} templateData - Objeto con los datos del template
   */
  createTemplateData(name, content, validElements, styles, scripts) {
    return {
      name,
      content,
      types: validElements.map((e) => e.type),
      styles,
      scripts,
    };
  }

  /**
   * Esta funcion guarda el template en la lista de templates
   * @param {*} templateData Objeto con los datos del template
   */
  saveTemplate(templateData) {
    this.uploadedTemplates.push(templateData);
    this.updateTemplateSelect(templateData.name);
    IDEE.toast.success(getValue('loadTemplateSuccess'), null, 3000);
  }

  /**
   * Esta funcion compriueba si el template ya existe
   * @param {*} templateName Nombre del template
   * @param {*} content Contenido del template
   * @returns {boolean} true si el template no existe, false si ya existe
   */
  checkDuplicateTemplate(templateName, content) {
    const nameExists = this.uploadedTemplates.some(
      (t) => t.name.toLowerCase() === templateName.toLowerCase(),
    );

    if (nameExists) {
      IDEE.toast.error(`${getValue('templateSameName')} "${templateName}"`, null, 3000);
    }

    const contentExists = this.uploadedTemplates.some(
      (t) => t.content.replace(/\s+/g, '') === content.replace(/\s+/g, ''),
    );

    if (contentExists) {
      IDEE.toast.error(getValue('templateSameContent'), null, 3000);
    }
    return !nameExists && !contentExists;
  }

  /**
   * Esta funcion actualiza el select de templates
   * @param {*} selectedTemplateName
   */
  updateTemplateSelect(selectedTemplateName = null) {
    const selectElement = this.template_.querySelector(ID_UPLOADED_TEMPLATES);

    while (selectElement.options.length > 1) {
      selectElement.remove(1);
    }

    if (this.showDefaultTemplate) {
      const defaultOption = document.createElement('option');
      defaultOption.value = 'default';
      defaultOption.textContent = getValue('defaultTemplate');
      selectElement.appendChild(defaultOption);
    }

    this.uploadedTemplates.forEach((template) => {
      const option = document.createElement('option');
      option.value = template.name;
      option.textContent = template.name;
      selectElement.appendChild(option);
    });

    if (selectedTemplateName) {
      selectElement.value = selectedTemplateName;
    }

    selectElement.disabled = this.uploadedTemplates.length === 0;
  }

  /**
   * Esta funcion añade los eventos a los elementos del template
   * @param {*} template Template del control de imrpesión del mapa
   */
  addEvents(template) {
    const customizeTemplate = template.querySelector(ID_CUSTOM_TEMPLATE);
    const templateFile = template.querySelector(ID_TEMPLATE_UPLOAD);

    customizeTemplate.addEventListener('click', () => {
      this.openTemplateEditor();
    });

    templateFile.addEventListener('change', () => {
      this.setupTemplateUpload();
    });
  }

  /**
   * Esta funcion abre el editor de templates
   * @returns {void}
   */
  openTemplateEditor() {
    let templateData;

    if (this.uploadedTemplates.length === 0 || this.template_.querySelector(ID_UPLOADED_TEMPLATES).value === 'default') {
      const parser = new DOMParser();
      const doc = parser.parseFromString(defaultTemplate, 'text/html');
      const dataTypeElements = doc.querySelectorAll('[data-type]');

      const types = Array.from(dataTypeElements).map((element) => {
        const fullType = element.getAttribute('data-type');
        let typeSuffix = fullType.split('api-idee-template-').pop();
        if (typeSuffix === 'texto-libre') {
          const typeName = element.getAttribute('data-type-name');
          if (typeName) {
            typeSuffix = `${typeSuffix}:${typeName}`;
          }
        }
        return typeSuffix;
      });
      const styles = this.extractStyles(doc);
      const scripts = this.extractScripts(doc);
      templateData = {
        name: 'default',
        content: defaultTemplate,
        types,
        styles,
        scripts,
      };
    } else {
      const selectedTemplateName = this.template_.querySelector(ID_UPLOADED_TEMPLATES).value;
      templateData = this.uploadedTemplates.find((t) => t.name === selectedTemplateName);
      if (templateData) {
        templateData.types = templateData.types.map((fullType, idx) => {
          let typeSuffix = fullType.split('api-idee-template-').pop();
          const parser = new DOMParser();
          const doc = parser.parseFromString(templateData.content, 'text/html');
          const dataTypeElements = doc.querySelectorAll('[data-type]');
          const element = dataTypeElements[idx];
          if (typeSuffix === 'texto-libre' && element) {
            const typeName = element.getAttribute('data-type-name');
            if (typeName) {
              typeSuffix = `${typeSuffix}:${typeName}`;
            }
          }
          return typeSuffix;
        });
      }
    }

    // eslint-disable-next-line no-new
    new TemplateCustomizer(
      {
        dpiOptions: this.dpiOptions_,
        layoutOptions: this.layoutOptions_,
        projectionsOptions: this.proyectionsDefect_,
        layoutsRestraintFromDpi: this.layoutsRestraintFromDpi,
        map: this.map_,
        order: this.order,
        helpUrl: this.helpUrl,
        templateData,
        onApply: (config) => this.handleTemplateConfig(config),
      },
      this.map_,
    );
  }

  /**
   * Funcion que se ejecuta al dispararse el evento
   * cuando se imprime desde el diseñador de plantillas.
   * @param {Object} config - Configuración de la plantilla {instancePreviewMap, imagePreviewmap}
   */
  handleTemplateConfig(config) {
    this.templateConfig = config;
    this.downloadClient(config);
  }

  /**
    * Converts decimal degrees coordinates to degrees, minutes, seconds
    * @public
    * @function
    * @param {String} coordinate - single coordinate (one of a pair)
    * @api
    */
  converterDecimalToDMS(coordinate) {
    const coord = Number.parseFloat(coordinate);
    const deg = Math.abs(coord);
    const min = (deg % 1) * 60;
    // sign Degrees Minutes Seconds
    return `${Math.sign(coord) === -1 ? '-' : ''}${Math.trunc(deg)}º ${Math.trunc(min)}' ${Math.trunc((min % 1) * 60)}'' `;
  }

  /**
    * Converts original bbox coordinates to DMS coordinates.
    * @public
    * @function
    * @api
    * @param {Array<Object>} bbox - { x: {min, max}, y: {min, max} }
    */
  convertBboxToDMS(bbox) {
    const proj = this.map_.getProjection();
    let dmsBbox = bbox;
    if (proj.units === 'm') {
      const min = [bbox.x.min, bbox.y.min];
      const max = [bbox.x.max, bbox.y.max];
      const newMin = reproject(proj.code, min);
      const newMax = reproject(proj.code, max);
      dmsBbox = {
        x: {
          min: newMin[0],
          max: newMax[0],
        },
        y: {
          min: newMin[1],
          max: newMax[1],
        },
      };
    }

    dmsBbox = this.convertDecimalBoxToDMS(dmsBbox);
    return dmsBbox;
  }

  /**
    * Converts decimal coordinates Bbox to DMS coordinates Bbox.
    * @public
    * @function
    * @api
    * @param { Array < Object > } bbox - { x: { min, max }, y: { min, max } }
    */
  convertDecimalBoxToDMS(bbox) {
    return {
      x: {
        min: this.converterDecimalToDMS(bbox.x.min),
        max: this.converterDecimalToDMS(bbox.x.max),
      },
      y: {
        min: this.converterDecimalToDMS(bbox.y.min),
        max: this.converterDecimalToDMS(bbox.y.max),
      },
    };
  }

  /**
    * This function checks if an object is equal to this control.
    *
    * @function
    * @api stable
    */
  equals(obj) {
    let equals = false;
    if (obj instanceof PrinterMapControl) {
      equals = (this.name === obj.name);
    }
    return equals;
  }

  /**
   * Inicializa el tabindex de los elementos del control
   * @param {*} html
   */
  accessibilityTab(html) {
    html.querySelectorAll('[tabindex="0"]').forEach((el) => el.setAttribute('tabindex', this.order));
  }

  /**
   * Desactiva el control de impresión del mapa.
   */
  deactive() {
    this.template_.remove();
    this.uploadedTemplates = [];
    this.templateConfig = null;
  }

  /**
   * Destruye el control de impresión del mapa.
   *
   * @public
   * @function
   * @api
   */
  destroy() {}
}

/**
  * Name for this controls
  * @const
  * @type {string}
  * @public
  * @api stable
  */
PrinterMapControl.NAME = 'printermapcontrol';

/**
  * IDEE.template for this controls
  * @const
  * @type {string}
  * @public
  * @api stable
  */
PrinterMapControl.TEMPLATE = 'printermap.html';

/**
  * IDEE.template for this controls
  * @const
  * @type {string}
  * @public
  * @api stable
  */
PrinterMapControl.LOADING_CLASS = 'printing';

/**
  * IDEE.template for this controls
  * @const
  * @type {string}
  * @public
  * @api stable
  */
PrinterMapControl.DOWNLOAD_ATTR_NAME = 'data-donwload-url-print';
