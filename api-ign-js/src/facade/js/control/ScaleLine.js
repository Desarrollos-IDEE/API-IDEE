/**
 * @module M/control/ScaleLine
 */
import 'assets/css/controls/scale';
import ScaleLineImpl from 'impl/control/ScaleLine';
import scalelineTemplate from 'templates/scaleline';
import myhelp from 'templates/scalelinehelp';
import ControlBase from './Control';
import { isUndefined } from '../util/Utils';
import Exception from '../exception/exception';
import { compileSync as compileTemplate } from '../util/Template';
import { getValue } from '../i18n/language';

/**
 * @classdesc
 * Añadir escala gráfica.
 *
 * @api
 * @extends {M.Control}
 */
class ScaleLine extends ControlBase {
  /**
   * Constructor principal de la clase.
   *
   * @constructor
   * @param {Object} vendorOptions Opciones de proveedor para la biblioteca base, estas opciones
   * se pasarán en formato objeto. Opciones disponibles:
   * - className: Nombre de la clase CSS.
   * El valor predeterminado es ol-scale-bar
   * cuando se configura con bar: Verdadero. De lo contrario, el valor
   * predeterminado es ol-scale-line.
   * - minWidth: Ancho mínimo en píxeles en los dpi predeterminados de OGC.
   * El ancho se ajustará para que coincida con los dpi utilizados.
   * - render: Función llamada cuando se debe volver a
   * representar el control.
   * Esto se llama en una devolución de llamada de requestAnimationFrame.
   * - target: Especifique un objetivo si desea que
   * el control se represente fuera de la ventana gráfica del mapa.
   * - units: Unidades.
   * - bar: Representa barras de escala en lugar de una línea.
   * - steps: Número de pasos que debe usar la barra de escala.
   * Utilice números pares para obtener mejores resultados. Solo se aplica cuando
   * la barra es verdadera.
   * - text: Representa la escala de texto arriba de la barra de escala.
   * Solo se aplica cuando la barra es verdadera.
   * - dpi: dpi del dispositivo de salida, como una impresora.
   * Solo se aplica cuando la barra es verdadera.
   * Si no se define, se asumirá el tamaño de píxel de pantalla predeterminado de OGC de 0,28 mm.
   * @api
   */
  constructor(vendorOptions = {}) {
    // implementation of this control
    const impl = new ScaleLineImpl(vendorOptions);

    // calls the super constructor
    super(impl, ScaleLine.NAME);

    if (isUndefined(ScaleLineImpl)) {
      Exception(getValue('exception').scaleline_method);
    }
  }

  /**
   * Esta función crea la vista del mapa especificado.
   *
   * @public
   * @function
   * @param {M.Map} map Mapa
   * @returns {Promise} Plantilla HTML.
   * @api
   */
  createView(map) {
    return compileTemplate(scalelineTemplate);
  }

  /**
   * Obtiene la ayuda del control
   *
   * @function
   * @public
   * @api
  */
  getHelp() {
    const textHelp = getValue('scaleline').textHelp;
    return {
      title: ScaleLine.NAME,
      content: new Promise((success) => {
        const html = compileTemplate(myhelp, {
          vars: {
            urlImages: `${M.config.MAPEA_URL}assets/images`,
            translations: {
              help1: textHelp.text1,
              help2: textHelp.text2,
              help3: textHelp.text3,
            },
          },
        });
        success(html);
      }),
    };
  }

  /**
   * Esta función comprueba si un objeto es igual
   * a este control.
   *
   * @public
   * @function
   * @param {*} obj Objeto a comparar.
   * @returns {boolean} Iguales devuelve verdadero, falso si no son iguales.
   * @api
   */
  equals(obj) {
    const equals = (obj instanceof ScaleLine);
    return equals;
  }
}

/**
 * Nombre para identificar este control.
 * @const
 * @type {string}
 * @public
 * @api
 */
ScaleLine.NAME = 'scaleline';

export default ScaleLine;
