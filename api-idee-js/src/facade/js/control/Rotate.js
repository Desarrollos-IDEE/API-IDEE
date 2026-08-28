/**
 * @module IDEE/control/Rotate
 */
import 'assets/css/controls/rotate';
import RotateImpl from 'impl/control/Rotate';
import template from 'templates/rotate';
import templateCesium from 'templates/rotateCesium';
import myhelp from 'templates/rotatehelp';
import myhelpCesium from 'templates/rotatehelpCesium';
import ControlBase from './Control';
import { compileSync as compileTemplate } from '../util/Template';
import { isUndefined, isNullOrEmpty, isObject } from '../util/Utils';
import Exception from '../exception/exception';
import { getValue } from '../i18n/language';
import * as EventType from '../event/eventtype';

/**
 * Esta función escucha el evento de rotación y actualiza la rotación del mapa.
 *
 * @private
 * @function
 * @param {Event} e Evento del ratón.
 * @param {HTMLElement} html Elemento HTML del control.
 * @param {IDEE.Map} map Mapa.
 */
const rotateListener = (e, html, map) => {
  const htmlVar = html;
  let sliderContainer = e.target.parentElement.parentElement;
  let x = 0;
  let y = 0;

  while (sliderContainer && !Number.isNaN(sliderContainer.offsetLeft)
    && !Number.isNaN(sliderContainer.offsetTop)) {
    x += sliderContainer.offsetLeft - sliderContainer.scrollLeft;
    y += sliderContainer.offsetTop - sliderContainer.scrollTop;
    sliderContainer = sliderContainer.offsetParent;
  }
  x = e.clientX - x;
  y = e.clientY - y;

  const { clientWidth, clientHeight } = e.currentTarget;
  const perpendicularLine = [0, -clientHeight];
  // It needs this const to centre the button on mouse
  const angleToCenter = 45;

  const coords = [x - (clientWidth / 2), y - (clientHeight / 2)];
  const escalarProd = (perpendicularLine[0] * coords[0]) + (perpendicularLine[1] * coords[1]);
  const perpendicularMod = Math.sqrt((perpendicularLine[0] ** 2) + (perpendicularLine[1] ** 2));
  const pointerMod = Math.sqrt((coords[0] ** 2) + (coords[1] ** 2));
  const cosA = escalarProd / (perpendicularMod * pointerMod);
  const angle = Math.acos(cosA);
  let alfa = (angle * 180) / Math.PI;
  if (coords[0] < 0) {
    alfa = 360 - alfa;
  }
  map.setRotation(alfa);
  const transform = 'transform';
  htmlVar.querySelector('#m-rotate-marker').style.WebkitTransform = `rotate(${alfa + angleToCenter}deg)`;
  htmlVar.querySelector('#m-rotate-marker').style.MozTransform = `rotate(${alfa + angleToCenter}deg)`;
  htmlVar.querySelector('#m-rotate-marker').style[transform] = `rotate(${alfa + angleToCenter}deg)`;
};

/**
 * Esta función registra el evento de pulsación del ratón sobre el control.
 *
 * @public
 * @function
 * @param {IDEE.control.Rotate} instance Instancia del control Rotate.
 * @param {HTMLElement} html Elemento HTML del control.
 * @api
 */
export const onMouseDown = (instance, html) => {
  const sliderContainer = html.querySelector('#m-rotate-slider-container');
  sliderContainer.addEventListener('mousedown', (e) => {
    instance.setActive(true);
    if (e.target.id !== 'm-rotate-button') {
      instance.setMouseDown(true);
    }
  });
};

/**
 * Esta función registra el evento de liberación del ratón.
 *
 * @public
 * @function
 * @param {IDEE.control.Rotate} instance Instancia del control Rotate.
 * @param {HTMLElement} html Elemento HTML del control.
 * @api
 */
export const onMouseUp = (instance, html) => {
  document.body.addEventListener('mouseup', (e) => {
    instance.setActive(false);
  });
};

/**
 * Esta función registra el evento de clic sobre el control.
 * Permite resetear la rotación o aplicar una nueva rotación según el objetivo del clic.
 *
 * @public
 * @function
 * @param {IDEE.control.Rotate} instance Instancia del control Rotate.
 * @param {HTMLElement} html Elemento HTML del control.
 * @param {IDEE.Map} map Mapa.
 * @api
 */
export const onClick = (instance, html, map) => {
  const htmlVar = html;
  const sliderContainer = html.querySelector('#m-rotate-slider-container');
  const transform = 'transform';
  sliderContainer.addEventListener('click', (e) => {
    if (e.target.id === 'm-rotate-button' && !instance.getMouseDown()) {
      instance.getImpl().resetRotation();
      htmlVar.querySelector('#m-rotate-marker').style.WebkitTransform = 'rotate(45deg)';
      htmlVar.querySelector('#m-rotate-marker').style.MozTransform = 'rotate(45deg)';
      htmlVar.querySelector('#m-rotate-marker').style[transform] = 'rotate(45deg)';
    } else {
      rotateListener(e, html, map);
    }
    instance.setMouseDown(false);
  });
};

/**
 * Esta función registra el evento de movimiento del ratón sobre el control.
 * Permite rotar el mapa mientras se mantiene pulsado el ratón.
 *
 * @public
 * @function
 * @param {IDEE.control.Rotate} instance Instancia del control Rotate.
 * @param {HTMLElement} html Elemento HTML del control.
 * @param {IDEE.Map} map Mapa.
 * @api
 */
export const onMouseMove = (instance, html, map) => {
  const sliderContainer = html.querySelector('#m-rotate-slider-container');
  sliderContainer.addEventListener('mousemove', (e) => {
    if (instance.getActive()) {
      rotateListener(e, html, map);
    }
  });
};

/**
 * @classdesc
 * Agrega la funcionalidad para rotar el mapa.
 *
 * @api
 * @extends {IDEE.Control}
 */
class Rotate extends ControlBase {
  /**
   * Constructor principal de la clase.
   *
   * @constructor
   * @param {String} options Opciones del control.
   * - viewInitial: Vista inicial. Solo disponible para Cesium.
   * - help: Indica si se muestra la ayuda al crear el control.
   * Por defecto, verdadero. Solo disponible para Cesium.
   * - order: Orden que tendrá con respecto al
   * resto de plugins y controles por pantalla.
   * @api
   */
  constructor(options = {}) {
    if (isUndefined(RotateImpl) || (isObject(RotateImpl)
      && isNullOrEmpty(Object.keys(RotateImpl)))) {
      Exception(getValue('exception').rotate_method);
    }

    const opts = {
      help: isNullOrEmpty(options.help) || isUndefined(options.help) ? true : options.help,
      ...options,
    };

    // implementation of this control
    const impl = new RotateImpl(opts);

    // calls the super constructor
    super(impl, Rotate.NAME);

    this.help = opts.help;

    /**
     * Order: Orden que tendrá con respecto al
     * resto de plugins y controles por pantalla.
     */
    this.order = options.order >= -1 ? options.order : null;
  }

  /**
   * Este método crea la vista del mapa especificado.
   *
   * @public
   * @function
   * @param {IDEE.Map} map Añade el control al mapa.
   * @returns {Promise} HTML generado, promesa.
   * @api
   */
  createView(map) {
    this.map = map;
    let compTemplate;

    if (this.map.getImplementation() === 'cesium') {
      const textHelp = getValue('rotate').help;
      compTemplate = compileTemplate(templateCesium, {
        vars: {
          title: getValue('rotate').titleCesium,
          title_help: getValue('rotate').title_help,
          title_help_container: textHelp.title,
          title1: textHelp.title1,
          text1: textHelp.text1,
          title2: textHelp.title2,
          text2: textHelp.text2,
          text3: textHelp.text3,
          text4: textHelp.text4,
          showHelp: this.help,
          close_not_show_help: getValue('rotate').close_not_show_help,
          image1_description: getValue('rotate').image1_description,
          image2_description: getValue('rotate').image2_description,
          close_btn: getValue('rotate').close_btn,
          order: this.order,
        },
      });
    } else {
      compTemplate = compileTemplate(template, {
        vars: {
          title: getValue('rotate').title,
          order: this.order,
        },
      });
    }

    if (this.map.getImplementation() !== 'cesium') {
      const transform = 'transform';
      compTemplate.querySelector('#m-rotate-marker').style.WebkitTransform = 'rotate(45deg)';
      compTemplate.querySelector('#m-rotate-marker').style.MozTransform = 'rotate(45deg)';
      compTemplate.querySelector('#m-rotate-marker').style[transform] = 'rotate(45deg)';
      onMouseDown(this, compTemplate);
      onMouseMove(this, compTemplate, map);
      onMouseUp(this, compTemplate);
      onClick(this, compTemplate, map);
      this.on(EventType.ADDED_TO_MAP, () => {
        this.getImpl().onChangeView(compTemplate);
      });
    }
    return compTemplate;
  }

  /**
   * Esta función obtiene la ayuda del control.
   *
   * @public
   * @function
   * @returns {Object} Objeto con el título y contenido de la ayuda.
   * @api
   */
  getHelp() {
    if (!isNullOrEmpty(this.map) && this.map.getImplementation() === 'cesium') {
      const textHelp = getValue('rotate').textHelp;
      return {
        title: Rotate.NAME,
        content: new Promise((success) => {
          const html = compileTemplate(myhelpCesium, {
            vars: {
              urlImages: 'https://componentes.idee.es/estaticos/imagenes/controles',
              translations: {
                help1: textHelp.text1,
                help2: textHelp.text2,
                help3: textHelp.text3,
                help4: textHelp.text4,
                help5: textHelp.text5,
              },
            },
          });
          success(html);
        }),
      };
    }

    const textHelp = getValue('rotate').textHelp;
    return {
      title: Rotate.NAME,
      content: new Promise((success) => {
        const html = compileTemplate(myhelp, {
          vars: {
            urlImages: `${IDEE.config.STATIC_RESOURCES_URL}/imagenes/controles`,
            translations: {
              help1: textHelp.text1,
              help2: textHelp.text2,
            },
          },
        });
        success(html);
      }),
    };
  }

  /**
   * Esta función establece el estado activo del control.
   *
   * @public
   * @function
   * @param {Boolean} flag Verdadero para activar, falso para desactivar.
   * @api
   */
  setActive(flag) {
    this.active_ = !!flag;
  }

  /**
   * Esta función obtiene el estado activo del control.
   *
   * @public
   * @function
   * @returns {Boolean} Verdadero si está activo, falso si no.
   * @api
   */
  getActive() {
    return this.active_;
  }

  /**
   * Esta función establece el estado de pulsación del ratón.
   *
   * @public
   * @function
   * @param {Boolean} flag Verdadero si el ratón está pulsado, falso si no.
   * @api
   */
  setMouseDown(flag) {
    this.isMouseDown_ = !!flag;
  }

  /**
   * Esta función obtiene el estado de pulsación del ratón.
   *
   * @public
   * @function
   * @returns {Boolean} Verdadero si el ratón está pulsado, falso si no.
   * @api
   */
  getMouseDown() {
    return this.isMouseDown_;
  }

  /**
   * Este método comprueba si un objeto es igual
   * a este control.
   *
   * @function
   * @param {Object} obj Objeto a comparar.
   * @returns {Boolean} Verdadero es igual, falso si no.
   * @api
   */
  equals(obj) {
    const equals = (obj instanceof Rotate);
    return equals;
  }

  /**
   * Esta función destruye este control y limpia el HTML.
   *
   * @public
   * @function
   * @api stable
   */
  destroy() {
    this.getImpl().destroy();
  }
}

/**
 * Nombre del control.
 * @const
 * @type {string}
 * @public
 * @api
 */
Rotate.NAME = 'rotate';

export default Rotate;
