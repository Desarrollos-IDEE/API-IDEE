/**
 * DPIs a elegir en el plugin de impresión
 *
 * @private
 * @type {Array<Number>}
 */
export const DPI_OPTIONS = [72, 150, 300];

/**
 * Layouts de impresión del mapa.
 *
 * @private
 * @type {Array<Object>}
 */
export const LAYOUTS = [
  {
    value: 'screensize',
    label: `Pantalla - ${window.innerHeight}x${window.innerWidth} px`,
    dimensions: [window.innerHeight, window.innerWidth],
    fontSizeMultiplier: 0.1,
    letterSpacingMultiplier: 20,
    lineHeight: 35,
  },
  {
    value: 'A0',
    label: 'A0 - 841x1189 mm',
    dimensions: [841, 1189],
    fontSizeMultiplier: 0.20,
    letterSpacingMultiplier: 15,
    lineHeight: 22,
  },
  {
    value: 'A1',
    label: 'A1 - 594x841 mm',
    dimensions: [594, 841],
    fontSizeMultiplier: 0.30,
    letterSpacingMultiplier: 10,
    lineHeight: 8,
  },
  {
    value: 'A2',
    label: 'A2 - 420x594 mm',
    dimensions: [420, 594],
    fontSizeMultiplier: 0.5,
    letterSpacingMultiplier: 7,
    lineHeight: 5,
  },
  {
    value: 'A3',
    label: 'A3 - 297x420 mm',
    dimensions: [297, 420],
    fontSizeMultiplier: 0.7,
    letterSpacingMultiplier: 3,
    lineHeight: 5,
  },
  {
    value: 'A4',
    label: 'A4 - 210x297 mm',
    dimensions: [210, 297],
    default: true,
    fontSizeMultiplier: 0.8,
    letterSpacingMultiplier: 1,
    lineHeight: 1,
  },
  {
    value: 'US Letter',
    label: 'US Letter - 215.9x279.4 mm',
    dimensions: [215.9, 279.4],
    fontSizeMultiplier: 0.7,
    letterSpacingMultiplier: 1,
    lineHeight: 1,
  },
  {
    value: 'A5',
    label: 'A5 - 148x210 mm',
    dimensions: [148, 210],
    fontSizeMultiplier: 0.6,
    letterSpacingMultiplier: 1,
    lineHeight: 1,
  },
  {
    value: 'B4',
    label: 'B4 - 257x364 mm',
    dimensions: [257, 364],
    fontSizeMultiplier: 0.75,
    letterSpacingMultiplier: 2.5,
    lineHeight: 1,
  },
  {
    value: 'B5',
    label: 'B5 - 182x257 mm',
    dimensions: [182, 257],
    fontSizeMultiplier: 0.65,
    letterSpacingMultiplier: 1,
    lineHeight: 1,
  },
];

/**
 * Formatos de salida del fichero del control de impresion de mapa.
 *
 * @private
 * @type {Array<String>}
 */
export const PRINTERMAP_FORMATS = ['pdf', 'png', 'jpg', 'gif'];

/**
 * Formatos de salida del fichero de imagen georreferenciada de la vista.
 *
 * @private
 * @type {Array<String>}
 */
export const GEOREFIMAGE_FORMATS = ['png', 'jpg'];

/**
 * Formato de salida del fichero de imagen georreferenciada a partir de listado.
 *
 * @private
 * @type {String}
 */
export const GEOREFIMAGEEPSG_FORMAT = 'jpg';

/**
 * Proyecciones a elegir en el diseñador de plantillas.
 *
 * @private
 * @type {Array<String>}
 */
export const PROJECTIONS_TEMPLATE = IDEE.impl.ol.js.projections.getSupportedProjs();

/**
 * Elementos a insertar dentro de una plantilla personalizada.
 *
 * @private
 * @type {Array<String>}
 */
export const TEMPLATE_ELEMENTS = [
  'titulo',
  'texto-libre',
  'leyenda',
  'flecha-norte',
  'escala',
  'perfil-topografico',
  'borde',
];

/**
 * Orientación del mapa de previsualización en la ventana de edición de plantilla.
 *
 * @private
 * @type {String}
 */
export const PREVIEW_MAP_ORIENTATION = 'horizontal';
