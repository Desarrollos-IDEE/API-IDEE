/**
 * @module IDEE/control/Attributions
 */
import 'assets/css/controls/attributions';
import attributionsTemplate from 'templates/attributions';
import myhelp from 'templates/attributionshelp';
import * as EventType from 'IDEE/event/eventtype';
import AttributionsImpl from 'impl/control/Attributions';
import Control from './Control';
import { compileSync as compileTemplate } from '../util/Template';
import { getValue } from '../i18n/language';
import { INTERSECT } from '../filter/Module';
import {
  isUndefined, isNullOrEmpty, isObject, isBoolean,
} from '../util/Utils';
import Feature from '../feature/Feature';
import GeoJSON from '../layer/GeoJSON';
import KML from '../layer/KML';
import KMZ from '../layer/KMZ';
import { LAYER_VISIBILITY_CHANGE, ADDED_LAYER } from '../event/eventtype';
import Exception from '../exception/exception';
import * as Position from '../ui/position';

/**
 * @typedef {Object} module:IDEE/control/Attributions~Options
 * @api
 * @property {String} [position] Posición del control en el mapa.
 * @property {String} [tooltip] Texto del tooltip.
 * @property {String} [title] Título del control.
 * @property {Boolean} [collapsible] Indica si el control es colapsable.
 * (usada por ControlPanel)
 * @property {Boolean} [collapsed] Indica si el control está colapsado.
 * (usada por ControlPanel)
 * @property {Number} [order] Accesibilidad, tabIndex.
 * @property {String} [urlAttribute] Texto de la url.
 * @property {String} [url] URL del fichero de atribuciones.
 * @property {String} [type] Tipo de fichero de atribuciones, geojson, kml o kmz.
 * @property {String} [layerName] Nombre de la capa de atribuciones.
 * @property {Object} [layer] Capa de atribuciones.
 * @property {Number} [scale] Escala de visualización de la capa de atribuciones.
 * @property {String} [attributionParam] Parámetro de las features que contiene la
 * atribución.
 * @property {String} [urlParam] Parámetro de las features que contiene la url.
 * @property {String} [defaultAttribution] Atribución por defecto.
 * @property {String} [defaultURL] URL por defecto.
 * @property {Array.<String>} [collectionsAttributions] Colección de atribuciones.
 * @property {Boolean} [inlineText] Indica si las atribuciones se muestran en una única línea.
 * @property {Boolean} [translucentPanel] Establece el panel de atribuciones translucido
 * para poder ver elementos que colisionen con el.
 * @property {Object} [vendorOptions] Opciones específicas para la implementación.
 */

/**
 * @classdesc
 * Panel de atribuciones API-CING.
 * @property {String} [position='left'] Posición del control.
 * @property {String} [tooltip] Texto del tooltip. por defecto la traducción.
 * @property {String} [title] Texto del título.
 * @property {Boolean} [collapsible=true] Indica si el control es colapsable.
 * @property {Boolean} [collapsed=false] Indica si el control está colapsado.
 * @property {Number} [order=0] Accesibilidad, z-index.
 * @property {String} [urlAttribute='url'] Texto de la url.
 * @property {String} [url_] URL del fichero de atribuciones.
 * @property {String} [type_='kml'] geojson, kml o kmz, dependiendo de la url.
 * @property {String} [layerName_='attributions'] Nombre de la capa de atribuciones.
 * @property {Object} [layer_] Capa de atribuciones.
 * @property {Number} [scale_=10000] Define cuando cambiara la atribución.
 * @property {String} [urlParam_] Parámetro de las features que contiene la url.
 * @property {String} [attributionParam_] Parámetro de las features que contiene la
 * atribución.
 * @property {String} [defaultAttribution_='Instituto Geográfico Nacional'] Atribución por defecto.
 * @property {String} [defaultURL_='https://www.ign.es/'] URL por defecto.
 * @property {Array.<String>} [collectionsAttributions_=[]] Colección de atribuciones,
 * se especificarán como una colección de textos.
 * @property {Boolean} [inlineText=false] Indica si las atribuciones se muestran
 * en una única línea.
 * @property {Boolean} [translucentPanel=false] Establece el panel de atribuciones translucido
 * para poder ver elementos que colisionen con el.
 *
 * @extends {IDEE.Control}
 * @api
 */
class Attributions extends Control {
  /**
   * Constructor principal de la clase.
   *
   * @constructor
   * @param {module:IDEE/control/Attributions~Options} options Opciones de configuración
   * del control.
   * @api
   *
   * @example
   * const control = new IDEE.control.Attributions({
   *   position: 'left',
   *   tooltip: 'Reconocimientos de la capa',
   *   order: 2,
   *   collapsible: false,
   * });
   */
  constructor(options = {}) {
    if (isUndefined(AttributionsImpl) || (isObject(AttributionsImpl)
      && isNullOrEmpty(Object.keys(AttributionsImpl)))) {
      Exception(getValue('exception').attributions_method);
    }
    const impl = new AttributionsImpl(options.vendorOptions ?? {});
    super(Attributions.NAME, impl, options);

    this.position = options.position ?? Position.LEFT;

    this.collapsible = isBoolean(options.collapsible) ? options.collapsible : true;

    this.collapsed = isBoolean(options.collapsed) ? options.collapsed : this.collapsible;

    this.urlAttribute = options.urlAttribute ?? 'Gobierno de España';

    this.url_ = options.url ?? `${IDEE.config.STATIC_RESOURCES_URL}/Datos/reconocimientos/WMTS_PNOA_20170220/atribucionPNOA_Url.kml`;

    this.type_ = options.type ?? 'kml';

    this.layerName_ = options.layerName ?? 'attributions';

    this.layer_ = options.layer;

    this.scale_ = Number.parseInt(options.scale, 10) ?? 10000;

    this.attributionParam_ = options.attributionParam ?? 'atribucion';

    this.urlParam_ = options.urlParam ?? 'url';

    this.defaultAttribution_ = options.defaultAttribution ?? 'Instituto Geogr&aacute;fico Nacional';

    this.defaultURL_ = options.defaultURL ?? 'https://www.ign.es/';

    this.tooltip = options.tooltip ?? this.translation.title;

    this.title = options.title ?? this.tooltip;

    this.collectionsAttributions_ = (options.collectionsAttributions ?? []).map((attr) => {
      if (typeof attr === 'string') {
        return this.transformString(attr);
      }
      return attr;
    });

    this.inlineText = isBoolean(options.inlineText) ? options.inlineText : false;

    this.translucentPanel = isBoolean(options.translucentPanel) ? options.translucentPanel : false;

    this.on(EventType.ADDED_TO_MAP, this.onAddedToMap.bind(this));
  }

  onAddedToMap() {
    this.map.controlAttributions = this;
  }

  transformString(attrString) {
    return {
      attribuccion: attrString,
      id: window.crypto.randomUUID
        ? window.crypto.randomUUID() : new Date().getTime(),
    };
  }

  /**
   * Esta función crea la vista del mapa especificado.
   *
   * @public
   * @function
   * @param {IDEE.Map} map Mapa
   * @returns {Promise} Plantilla HTML.
   * @api
   */
  createView(map) {
    this.map_ = map;

    this.map_.on(ADDED_LAYER, (layers) => {
      layers.forEach((layer) => {
        if (layer.attribution) {
          layer.on(LAYER_VISIBILITY_CHANGE, ({ visibility, layer: l }) => {
            this.changeVisibility(l.idLayer, visibility);
          });
        }
      });
    });

    return new Promise((success, fail) => {
      const html = compileTemplate(attributionsTemplate, {
        vars: {
          collapsible: window.innerWidth < 769,
          order: this.order,
          title: this.title,
          tooltip: this.tooltip,
        },
      });

      this.html_ = html;

      setTimeout(() => {
        const panel = this.getPanel();
        if (panel && panel.getButtonPanel()) {
          panel.getButtonPanel().setAttribute('title', this.tooltip);
        }
      }, 0);

      this.initMode();

      this.onMoveEnd(() => {
        this.changeAttributions();
      });

      this.accessibilityTab(html);
      // this.map_.getLayers().forEach((layer) => {
      //   if (layer.attribution) {
      //     if (typeof layer.attribution === 'string') {
      //       this.addHTMLContent(layer.attribution, layer.id);
      //     } else {
      //       this.addAttributions(layer.attribution);
      //     }

      //     this.changeVisibility(layer.id, layer.isVisible());
      //   }
      // });

      this.map_.getLayers().forEach((layer) => {
        if (layer.attribution) {
          const attribution = layer.attribution;
          const attrObj = typeof attribution === 'string'
            ? { attribuccion: attribution, id: layer.idLayer ?? layer.id }
            : attribution;

          this.addAttributions(attrObj);
          this.changeVisibility(layer.idLayer ?? layer.id, layer.isVisible());
        }
      });
      success(html);
    });
  }

  changeVisibility(idLayer, isVisible) {
    if (idLayer) {
      const layerElm = this.html_.querySelector(`#${idLayer}`);
      if (layerElm && layerElm.style) {
        this.html_.querySelector(`#${idLayer}`).style.display = isVisible ? 'block' : 'none';
      }
    }
  }

  /**
   * Este método inicia el modo de funcionamiento del control.
   * @public
   * @function
   * @api
   */
  initMode() {
    this.collectionsAttributions_.forEach((attribuccionParams) => {
      const { id, contentAttributions, contentType } = attribuccionParams;
      if (contentAttributions) {
        this.createVectorLayer(id, contentAttributions, contentType);
      }
    });
  }

  /**
   * Este método añade una nueva capa de atribuciones.
   * @public
   * @function
   * @param {String} id Nombre de la capa de atribuciones.
   * @param {String} url URL del fichero de atribuciones.
   * @param {String} type Tipo de fichero de atribuciones.
   * @api
   */
  createVectorLayer(id, url, type) {
    let layer = this.layer_;
    if (!(layer instanceof GeoJSON)) {
      const optionsLayer = {
        name: `${id}_attributions`,
        url,
        legend: `${id}_attributions`,
      };

      if (type === 'geojson') {
        layer = new GeoJSON(optionsLayer, { displayInLayerSwitcher: false });
      } else if (type === 'kmz') {
        layer = new KMZ(optionsLayer, { displayInLayerSwitcher: false });
      } else if (type === 'kml') {
        layer = new KML(optionsLayer, { displayInLayerSwitcher: false });
      } else if (this.type === 'topojson') {
        // TODO: Implement in api-idee IDEE.layer.TopoJSON
      }
    }

    if (this.map_.getLayers({ name: layer }).length < 1) {
      this.map_.addLayers(layer);
      layer.displayInLayerSwitcher = false;
      layer.setVisible(false);
    }
  }

  /**
   * Este método muestra las atribuciones de la capa.
   *
   * @function
   * @public
   * @api
   */
  changeAttributions() {
    this.clearContent();
    const layers = this.collectionsAttributions_;

    layers.forEach((layer) => {
      if (typeof layer === 'string') {
        // ? Change value by reference
        // eslint-disable-next-line no-param-reassign
        layer = this.transformString(layer);
      }

      if (/<[a-z][\s\S]*>/i.test(layer.attribuccion)) {
        this.addHTMLContent(layer.attribuccion, layer.id);
        this.map_.getLayers().forEach((mapLayer) => {
          if (mapLayer.idLayer === layer.id) {
            this.changeVisibility(mapLayer.idLayer, mapLayer.isVisible());
          }
        });
        return;
      }

      let featureAttributions = false;

      const zoom = this.map_.getZoom();

      let mapAttributions = [];
      let defaultMapAttributions = false;

      if (this.checkDefaultAttribution(layer)) {
        defaultMapAttributions = this.defaultAttribution(layer, zoom, mapAttributions);
      }

      // No tiene attribuccion por defecto
      // Capas: 'OI.OrthoimageCoverage', 'EL.GridCoverageDSM', 'IGNBaseTodo', 'LC.LandCoverSurfaces'
      if (!defaultMapAttributions) {
        mapAttributions = [layer];
      } else {
        mapAttributions = defaultMapAttributions;
      }

      // Features Attributions
      if (this.map_.getScale() <= this.scale_) {
        this.setVisible(true);
        const vectorAttribution = this.map_.getLayers().filter((l) => {
          if (l.name || l.legend) {
            return l.name ? l.name.includes(`${layer.id}_attributions`) : l.legend.includes(`${layer.id}_attributions`);
          }
          return false;
        });
        if (vectorAttribution.length > 0) {
          const features = vectorAttribution[0].getFeatures();
          featureAttributions = this.getMapAttributions(features);
        }
      }

      if (featureAttributions) {
        mapAttributions = mapAttributions.concat(featureAttributions);
      }
      // ---

      this.addContent(mapAttributions);

      this.map_.getLayers().forEach((mapLayer) => {
        if (mapLayer.idLayer === layer.id) {
          this.changeVisibility(mapLayer.idLayer, mapLayer.isVisible());
        }
      });
    });
  }

  /**
   * Este método añade el contenido de las atribuciones.
   * @public
   * @function
   * @param {Array} layer Capas.
   * @param {Number} zoom Zoom.
   * @api
   */
  defaultAttribution(layer, zoom) {
    const isHybrid = this.map_.getLayers().filter((l) => {
      return l.type === 'WMTS' && !l.displayInLayerSwitcher && l.name === 'OI.OrthoimageCoverage';
    }).length > 0;
    if ((layer !== undefined && layer.name === 'OI.OrthoimageCoverage') || isHybrid) {
      if (zoom < 14) {
        return [{ name: 'Copernicus Sentinel 2019', url: 'https://sentinel.esa.int/web/sentinel/home' }];
      }
      return [{ name: 'Sistema Cartográfico Nacional', url: 'http://www.scne.es/' }];
    }
    if (layer !== undefined && (layer.name === 'IGNBaseTodo' || layer.name === 'EL.GridCoverageDSM')) {
      return [{ name: 'Sistema Cartográfico Nacional', url: 'http://www.scne.es/' }];
    }
    if (layer !== undefined && layer.name === 'LC.LandCoverSurfaces') {
      if (zoom < 14) {
        return [{ name: 'CORINE-Land Cover. Instituto Geográfico Nacional', url: this.defaultURL_ }];
      }
      return [{ name: 'Sistema Cartográfico Nacional', url: 'http://www.scne.es/' }];
    }
    return false;
  }

  /**
   * Este método devuelve si la capa tiene atribuciones por defecto.
   * @public
   * @function
   * @param {Object} layer Capa.
   * @api
   */
  checkDefaultAttribution(layer) {
    return ['OI.OrthoimageCoverage', 'EL.GridCoverageDSM', 'IGNBaseTodo', 'LC.LandCoverSurfaces'].includes(layer.name);
  }

  /**
   * Este método añade el contenido de texto a la vista de atribuciones.
   *
   * @function
   * @public
   * @param {Array} attributions Atribuciones.
   */
  addContent(attributions) {
    const html = this.html_;
    const id = attributions[0].name || '';
    const links = attributions.map((attrOpt) => {
      const element = attrOpt.url ? 'a' : 'p';
      const link = document.createElement(element);

      if (element === 'a') {
        link.target = '_blank';
        link.href = attrOpt.url || '';
        link.setAttribute('rol', 'link');
      }

      link.setAttribute('tabindex', this.order);
      const text = attrOpt.description ? attrOpt.description : `${attrOpt.name}, ${this.urlAttribute}`;
      link.innerHTML = text || '';
      link.setAttribute('title', text || '');
      return link;
    });
    const div = document.createElement('div');
    div.classList.add('attributionElements');
    div.id = attributions[0].id;

    links[0].innerHTML = `<span>${id}</span> ${links[0].innerHTML}`;

    links.forEach((link) => {
      div.append(link);
    });

    html.append(div);
  }

  /**
   * Este método añade el contenido de texto a la vista de atribuciones.
   * @public
   * @function
   * @param {String} html HTML.
   * @api
   */
  addHTMLContent(html, id) {
    this.html_.innerHTML += `<section id="${id}" class="attributionElements">${html}</section>`;
  }

  /**
   * Este método elimina el contenido de texto de la vista de atribuciones.
   *
   * @function
   * @public
   */
  clearContent() {
    if (!isNullOrEmpty(this.html_)) {
      const html = this.html_;
      html.querySelectorAll('.attributionElements').forEach((child) => html.removeChild(child));
    }
  }

  /**
   * Este método cambia la visibilidad de la vista de atribuciones.
   * @function
   * @public
   * @param {Boolean} visibility Visibilidad.
   * @api
   */
  setVisible(visibility) {
    const html = this.html_;
    html.style.display = visibility === false ? 'none' : '';
  }

  /**
   * Este método devuelve la atribución de objetos que intersectan con el bbox.
   * @function
   * @public
   * @param {Array} featuresAttributions Atribuciones.
   * @api
   */
  getMapAttributions(featuresAttributions) {
    this.updateBBoxFeature();
    const interFilter = INTERSECT(this.bboxFeature_);
    const filteredFeatures = interFilter.execute(featuresAttributions);
    return filteredFeatures.map((feature) => {
      return {
        name: feature.getAttribute(this.attributionParam_) || '',
        url: feature.getAttribute(this.urlParam_) || this.defaultURL_,
      };
    }).filter((element, index, array) => /* remove repeat elements */ array
      .map((e) => e.attribution).indexOf(element.attribution) === index);
  }

  /**
   * Este método devuelve la vista de atribuciones.
   * @function
   * @public
   * @param {Array} attribuccionParams Atribuciones.
   * @api
   */
  addAttributions(attribuccionParams) {
    if (this.collectionsAttributions_.some(({ id }) => attribuccionParams === id
      || id === attribuccionParams.id)) {
      return;
    }

    if (/<[a-z][\s\S]*>/i.test(attribuccionParams.attribuccion)) {
      this.addHTMLContent(attribuccionParams.attribuccion, attribuccionParams.id);
      this.collectionsAttributions_.push(attribuccionParams);
    } else if (attribuccionParams.collectionsAttributions) {
      attribuccionParams.collectionsAttributions.forEach((collectionAttribution) => {
        this.collectionsAttributions_.push(attribuccionParams);
        this.addHTMLContent(collectionAttribution, attribuccionParams.id);
      });
    } else {
      this.collectionsAttributions_.push(attribuccionParams);
      this.addContent([attribuccionParams]);
      const { id, contentType, contentAttributions } = attribuccionParams;
      this.createVectorLayer(id, contentAttributions, contentType);
    }
  }

  /**
   * Este método actualiza el bbox con sus features.
   * @function
   * @public
   */
  updateBBoxFeature() {
    const { x, y } = this.map_.getBbox();
    this.bboxFeature_ = new Feature('bbox_feature', {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [x.min, y.min],
            [x.min, y.max],
            [x.max, y.max],
            [x.max, y.min],
            [x.min, y.min],
          ],
        ],
      },
    });
  }

  /**
   * Optione las attribuciones de las capas cargadas
   * @function
   * @public
   * @param {Array} layers Capas.
   * @returns {Array} Atribuciones.
   * @api
   */
  getAttributionsFromMap(layers) {
    const layersFormat = layers.map((layer) => layer.getAttributions());
    // Se elimina las capas que no tenga atribuciones
    return layersFormat.filter(Boolean);
  }

  /**
   * @function
   * @public
   */
  onMoveEnd(callback) {
    this.impl_.registerEvent('moveend', this.map_, (e) => callback(e));
    // if (this.impl_ && typeof this.impl_.registerEvent === 'function') {
    //   this.impl_.registerEvent('moveend', this.map_, (e) => callback(e));
    // } else {
    //   console.log('FALLÓ onMoveEnd');
    // }
  }

  /**
   * Obtiene la ayuda del control
   *
   * @function
   * @public
   * @api
  */
  getHelp() {
    const textHelp = this.translation.textHelp;
    return {
      title: Attributions.NAME,
      content: new Promise((success) => {
        const html = compileTemplate(myhelp, {
          vars: {
            urlImages: `${IDEE.config.STATIC_RESOURCES_URL}facade/assets/images/help/${Attributions.NAME}`,
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
    const equals = (obj instanceof Attributions);
    return equals;
  }

  /**
   * Esta método devuelve las atribuciones.
   * @public
   * @function
   * @returns {Array} Atribuciones.
   * @api
   */
  getAttributions() {
    return this.collectionsAttributions_;
  }

  /**
   * Esta método cambia las atribuciones.
   * @public
   * @function
   * @api
   * @param {Array} attr Atribuciones.
   */
  setAttributions(attr) {
    this.collectionsAttributions_ = attr;
    this.changeAttributions();
  }

  /**
   * Esta método destruye el control.
   * @public
   * @function
   * @api
   */
  destroy() {
    super.destroy();
    this.un(EventType.ADDED_TO_MAP, this.onAddedToMap.bind(this));
    if (this.map_) this.map_.un(ADDED_LAYER);
  }

  /**
   * Esta método devuelve el panel.
   * @public
   * @function
   * @api
   */
  accessibilityTab(html) {
    html.querySelectorAll('[tabindex="0"]').forEach((el) => el.setAttribute('tabindex', this.order));
  }
}

/**
 * Nombre del control.
 * @const
 * @type {string}
 * @public
 * @api
 */
Attributions.NAME = 'attributions';

export default Attributions;
