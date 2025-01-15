/**
 * @module M/control/BackgroundLayers
 */
import template from 'templates/backgroundlayers';
import myhelp from 'templates/backgroundlayershelp';
import 'assets/css/controls/backgroundlayers';
import ControlImpl from 'impl/control/Control';
import WMS from 'M/layer/WMS';
import WMTS from 'M/layer/WMTS';
import TMS from 'M/layer/TMS';
import { getQuickLayers } from '../api-idee';
import ControlBase from './Control';
import { compileSync as compileTemplate } from '../util/Template';
import { LOAD, ADDED_TO_MAP } from '../event/eventtype';
import { getValue } from '../i18n/language';

/**
 * Esta constante indica el número máximo de capas base que tendrá el control.
 *
 * @type {number}
 * @const
 * @public
 */
const MAXIMUM_LAYERS = 5;

/**
 * @classdesc
 * Selector de capas de fondo API-CING.
 * Añade un selector de capas base al mapa.
 *
 * @property {Array<Layer>} layer Proviene de "M.config.backgroundlayers".
 * @property {Array<Layer>} flattedLayers Concadena las capas generadas.
 * @property {Number} activeLayer Esta propiedad indica la capa que se activa.
 * @property {Number} idLayer Indica la capa que se mostrará primero.
 * @property {Boolean} visible Indica si sera visible o no.
 *
 * @extends {M.Control}
 * @api
 */
class BackgroundLayers extends ControlBase {
  /**
   * Constructor principal de la clase.
   * Las capas base provienen de "M.config.backgroundlayers".
   *
   * @constructor
   * @param {M.map} map Mapa.
   * @param {Number} idLayer Identificador de la capa.
   * @param {Boolean} visible Define si será visible.
   * @api
   */
  constructor(map, idLayer, visible) {
    const impl = new ControlImpl();
    super(impl, BackgroundLayers.NAME);
    map.getBaseLayers().forEach((layer) => {
      layer.on(LOAD, map.removeLayers(layer));
    });

    /**
     * Control layers, proviene de "M.config.backgroundlayers".
     */
    this.layers = M.config.backgroundlayers.slice(0, MAXIMUM_LAYERS).map((layer) => {
      return {
        id: layer.id,
        title: layer.title,
        layers: layer.layers.map((subLayer) => {
          let l = subLayer;
          if (typeof subLayer === 'string') {
            if (/QUICK.*/.test(subLayer)) {
              l = getQuickLayers(subLayer.replace('QUICK*', ''));
            }
            if (typeof l === 'string') {
              if (/WMTS.*/.test(l)) {
                l = new WMTS(l);
              } else if (/TMS.*/.test(l)) {
                l = new TMS(l);
              } else {
                l = new WMS(l);
              }
            }
          }
          return l;
        }),
      };
    });

    /**
     * flattedLayers: Concadena las capas generadas.
     */
    this.flattedLayers = this.layers.reduce((current, next) => current.concat(next.layers), []);

    /**
     * Active Layer, default -1.
     */
    this.activeLayer = -1;

    /**
     * ID layer.
     */
    this.idLayer = idLayer == null ? 0 : idLayer;

    /**
     * Visibility.
     */
    this.visible = visible == null ? true : visible;
  }

  /**
   * Este método genera la vista.
   *
   * @public
   * @function
   * @param {M.Map} map Mapa donde se incluirá el control.
   * @api
   */
  createView(map) {
    this.map = map;
    return new Promise((success, fail) => {
      const html = compileTemplate(template, { vars: { layers: this.layers } });
      this.html = html;
      this.listen(html);
      // html.querySelector('button').click();
      this.uniqueButton = this.html.querySelector('#m-baselayerselector-unique-btn');
      this.uniqueButton.innerHTML = this.layers[0].title;
      this.on(ADDED_TO_MAP, () => {
        const visible = this.visible;
        if (this.idLayer > -1) {
          if (window.innerWidth > M.config.MOBILE_WIDTH) {
            this.activeLayer = this.idLayer;
          }

          this.showBaseLayer({
            target: {
              parentElement: html,
            },
          }, this.layers[this.activeLayer], this.activeLayer);
        }

        if (visible === false) {
          this.map_.removeLayers(this.map_.getBaseLayers());
        }
      });
      success(html);
    });
  }

  /**
   * Este método compara los controles.
   *
   * @public
   * @function
   * @param {M.Control} control Objeto control para comparar.
   * @returns {Boolean} Verdadero es igual, falso si no.
   * @api
   */
  equals(control) {
    return control instanceof BackgroundLayers;
  }

  /**
   * Evento que muestra la capa cuando se hace clic.
   * @public
   * @param {DOMEvent} e Clic en html.
   * @param {object} layersInfo Opciones de la capa.
   * @api
   */
  showBaseLayer(e, layersInfo, i) {
    let callback = this.handlerClickDesktop.bind(this);
    if (window.innerWidth <= M.config.MOBILE_WIDTH) {
      callback = this.handlerClickMobile.bind(this);
    }

    callback(e, layersInfo, i);
  }

  /**
   * Cambia al estilo "responsive".
   * @public
   * @param {Boolean} change Falso móvil (768px), ordenador verdadera (2000px).
   * @api
   */
  changeStyleResponsive(change) {
    M.config.MOBILE_WIDTH = (change) ? '2000' : '768';

    const buttons = document.querySelectorAll('.m-plugin-baselayer .m-panel-controls #div-contenedor button');
    buttons.forEach((e) => {
      // eslint-disable-next-line no-unused-expressions
      (e.classList.contains('m-background-unique-btn'))
      // eslint-disable-next-line space-infix-ops
        ? e.style.display = (change) ? 'block' : 'none'
        : e.style.display = (change) ? 'none' : 'block';
    });
  }

  /**
   * Este método administra el evento de clic cuando la
   * aplicación está en resolución de escritorio.
   *
   * @Public
   * @param {Event} e Evento.
   * @param {M.layer} layersInfo Capas.
   * @param {Number} i Índice.
   * @function
   * @api
   */
  handlerClickDesktop(e, layersInfo, i) {
    this.removeLayers();
    this.visible = false;
    const { layers, title } = layersInfo;
    const isActived = e.target.parentElement
      .querySelector(`#m-baselayerselector-${layersInfo.id}`)
      .classList.contains('activeBaseLayerButton');
    layers.forEach((layer, index, array) => layer.setZIndex(index - array.length));

    e.target.parentElement.querySelectorAll('button[id^="m-baselayerselector-"]').forEach((button) => {
      if (button.classList.contains('activeBaseLayerButton')) {
        button.classList.remove('activeBaseLayerButton');
      }
    });
    if (!isActived) {
      this.visible = true;
      this.activeLayer = i;
      e.target.parentElement.querySelector('#m-baselayerselector-unique-btn').innerText = title;
      e.target.parentElement
        .querySelector(`#m-baselayerselector-${layersInfo.id}`).classList.add('activeBaseLayerButton');
      this.map.addLayers(layers);
    }
  }

  /**
   * Esta función gestiona el evento de clic cuando la aplicación está en resolución móvil.
   * @function
   * @public
   * @param {Event} e Evento.
   * @api
   */
  handlerClickMobile(e) {
    this.removeLayers();
    this.activeLayer += 1;
    this.activeLayer %= this.layers.length;
    const layersInfo = this.layers[this.activeLayer];
    const { layers, id, title } = layersInfo;
    layers.forEach((layer, index, array) => layer.setZIndex(index - array.length));
    e.target.parentElement.querySelectorAll('button[id^="m-baselayerselector-"]').forEach((button) => {
      if (button.classList.contains('activeBaseLayerButton')) {
        button.classList.remove('activeBaseLayerButton');
      }
    });

    e.target.innerHTML = title;
    e.target.parentElement.querySelector(`#m-baselayerselector-${id}`).classList.add('activeBaseLayerButton');
    this.map.addLayers(layers);
  }

  /**
   * Esta función elimina "this.layers" del mapa.
   * @function
   * @public
   * @api
   */
  removeLayers() {
    this.map.removeLayers(this.flattedLayers);
    this.map.removeLayers(this.map.getBaseLayers());
  }

  /**
   * Esta función agrega el detector de eventos a cada botón del html.
   * @param {HTMLElement} html Elemento botón.
   * @function
   * @public
   * @api
   */
  listen(html) {
    html.querySelectorAll('button.m-background-group-btn')
      .forEach((b, i) => b.addEventListener('click', (e) => this.showBaseLayer(e, this.layers[i], i)));
    html.querySelector('#m-baselayerselector-unique-btn').addEventListener('click', (e) => this.showBaseLayer(e));
  }

  /**
   * Obtiene la ayuda del control
   *
   * @function
   * @public
   * @api
  */
  getHelp() {
    const textHelp = getValue('backgroundlayers').textHelp;
    return {
      title: BackgroundLayers.NAME,
      content: new Promise((success) => {
        const html = compileTemplate(myhelp, {
          vars: {
            urlImages: `${M.config.API_IDEE_URL}assets/images`,
            translations: {
              help1: textHelp.text1,
            },
          },
        });
        success(html);
      }),
    };
  }
}

/**
 * Nombre para identificar este control.
 * @const
 * @type {string}
 * @public
 * @api
 */
BackgroundLayers.NAME = 'backgroundlayers';

export default BackgroundLayers;
