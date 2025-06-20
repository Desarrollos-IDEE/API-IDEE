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
    label: `Pantalla - ${window.innerWidth}x${window.innerHeight} px`,
    dimensions: [window.innerWidth, window.innerHeight],
  },
  {
    value: 'A0',
    label: 'A0 - 841x1189 mm',
    dimensions: [841, 1189],
  },
  {
    value: 'A1',
    label: 'A1 - 594x841 mm',
    dimensions: [594, 841],
  },
  {
    value: 'A2',
    label: 'A2 - 420x594 mm',
    dimensions: [420, 594],
  },
  {
    value: 'A3',
    label: 'A3 - 297x420 mm',
    dimensions: [297, 420],
    default: true,
  },
  {
    value: 'A4',
    label: 'A4 - 210x297 mm',
    dimensions: [210, 297],
  },
  {
    value: 'US Letter',
    label: 'US Letter - 215.9x279.4 mm',
    dimensions: [215.9, 279.4],
  },
  {
    value: 'A5',
    label: 'A5 - 148x210 mm',
    dimensions: [148, 210],
  },
  {
    value: 'B4',
    label: 'B4 - 257x364 mm',
    dimensions: [257, 364],
  },
  {
    value: 'B5',
    label: 'B5 - 182x257 mm',
    dimensions: [182, 257],
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
export const PROJECTIONS_TEMPLATE = [
  'EPSG:25829',
  'EPSG:25830',
  'EPSG:25831',
  'EPSG:3857',
  'EPSG:4326',
  'EPSG:4258',
];

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
