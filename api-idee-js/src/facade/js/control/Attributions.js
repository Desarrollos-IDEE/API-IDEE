/**
 * @module IDEE/control/Attributions
 */
import 'assets/css/controls/attributions';
import attributionsTemplate from 'templates/attributions';
import myhelp from 'templates/attributionshelp';
import AttributionsImpl from 'impl/control/Attributions';
import ControlBase from './Control';
import { compileSync as compileTemplate } from '../util/Template';
import { getValue } from '../i18n/language';
import { INTERSECT } from '../filter/Module';
import { isUndefined, isNullOrEmpty, isObject } from '../util/Utils';
import Feature from '../feature/Feature';
import GeoJSON from '../layer/GeoJSON';
import KML from '../layer/KML';
import { LAYER_VISIBILITY_CHANGE, ADDED_LAYER } from '../event/eventtype';
import Exception from '../exception/exception';

/**
 * @classdesc
 * Panel de atribuciones API-CING.
 * @property {Number} scale_ Escala de visualización de la capa de atribuciones.
 * @property {String} tooltip_ Texto del tooltip.
 * @property {String} position Posición del control.
 * @property {Number} order Accesibilidad, tabIndex.
 * @property {String} url_ URL del fichero de atribuciones.
 * @property {Object} collectionsAttributions Colección de atribuciones.
 * @property {Boolean} closePanel Panel cerrado o abierto.
 * @property {String} urlAttribute Texto de la url.
 * @property {String} type geojson o kml, dependiendo de la url.
 * @property {Number} scale Define cuando cambiara la atribución.
 * @property {String} defaultAttribution Atribución por defecto.
 * @property {String} defaultURL URL por defecto.
 * @property {Number} order Accesibilidad, z-index.
 * @api
 */
class Attributions extends ControlBase {
  /**
   * Constructor principal de la clase.
   *
   * @constructor
   * @param {Number} scale_ Escala de visualización de la capa de atribuciones.
   * @param {String} tooltip Texto del tooltip.
   * @param {String} position Posición del control.
   * @param {Number} order Accesibilidad, tabIndex.
   * @param {String} url URL del fichero de atribuciones.
   * @param {Object} collectionsAttributions Colección de atribuciones.
   * @param {Boolean} closePanel Panel cerrado o abierto.
   * @param {String} urlAttribute Texto de la url.
   * @param {String} type geojson o kml, dependiendo de la url.
   * @param {Number} scale Define cuando cambiara la atribución.
   * @param {String} defaultAttribution Atribución por defecto.
   * @param {String} defaultURL URL por defecto.
   * @param {Number} order Accesibilidad, z-index.
   * @api
   */
  constructor(options = {}) {
    if (isUndefined(AttributionsImpl) || (isObject(AttributionsImpl)
      && isNullOrEmpty(Object.keys(AttributionsImpl)))) {
      Exception(getValue('exception').attributions_method);
    }

    const impl = new AttributionsImpl();
    super(impl, Attributions.NAME);

    this.position = options.position;
    this.closePanel = options.closePanel;
    this.urlAttribute = options.urlAttribute || 'Gobierno de España';
    this.options = options;

    this.url_ = options.url || 'https://componentes.idee.es/api-idee/files/attributions/WMTS_PNOA_20170220/atribucionPNOA_Url.kml';
    this.type_ = options.type || 'kml';
    this.layerName_ = options.layerName || 'attributions';
    this.layer_ = options.layer;
    this.scale_ = Number.parseInt(options.scale, 10) || 10000;
    this.attributionParam_ = options.attributionParam || 'atribucion';
    this.urlParam_ = options.urlParam || 'url';
    this.defaultAttribution_ = options.defaultAttribution || 'Instituto Geogr&aacute;fico Nacional';
    this.defaultURL_ = options.defaultURL || 'https://www.ign.es/';
    this.tooltip_ = options.tooltip || getValue('attributionsControl').tooltip;
    this.collectionsAttributions_ = options.collectionsAttributions || [];

    this.collectionsAttributions_ = this.collectionsAttributions_.map((attr) => {
      if (typeof attr === 'string') {
        return this.transformString(attr);
      }
      return attr;
    });

    /**
     * Order: Orden que tendrá con respecto al
     * resto de plugins y controles por pantalla.
     */
    this.order = options.order;
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
        },
      });

      html.querySelector('#close-button').addEventListener('click', () => this.closePanel());
      this.html_ = html;

      this.initMode();

      this.onMoveEnd(() => {
        this.changeAttributions();
      });

      this.accessibilityTab(html);
      this.map_.getLayers().forEach(({ attribution, idLayer, isVisible }) => {
        if (attribution) {
          if (typeof attribution === 'string') {
            this.addHTMLContent(attribution, idLayer);
          } else {
            this.addAttributions(attribution);
          }

          this.changeVisibility(idLayer, isVisible());
        }
      });
      success(html);
    });
  }

  changeVisibility(idLayer, isVisible) {
    this.html_.querySelector(`#${idLayer}`)
      .style.display = isVisible ? 'block' : 'none';
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
        return;
      }

      let featureAttributions = false;

      const zoom = this.map_.getZoom();

      let mapAttributions = [];
      let defaultMapAttributions = false;

      if (this.checkDefaultAttribution(layer) && isNullOrEmpty(layer.name)) {
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
    if (this.collectionsAttributions_.some(({ id }) => attribuccionParams === id)) {
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
   * Este método elimina el panel.
   * @function
   * @public
   */
  closePanel() {
    this.getPanel().collapse();
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
   * Este método cierra el panel si la pantalla es pequeña.
   * @function
   * @public
   * @param {Event} e Evento.
   */
  setCollapsiblePanel(e) {
    if (this.getPanel() && this.getPanel().getTemplatePanel()) {
      if (e.target.innerWidth < 769) {
        this.getPanel().getTemplatePanel().classList.remove('no-collapsible');
        this.closePanel();
      } else {
        this.getPanel().getTemplatePanel().classList.add('no-collapsible');
        this.getPanel().getTemplatePanel().classList.remove('collapsed');
      }
    }
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
  }

  /**
   * Obtiene la ayuda del control
   *
   * @function
   * @public
   * @api
  */
  getHelp() {
    const textHelp = getValue('attributionsControl').textHelp;
    return {
      title: Attributions.NAME,
      content: new Promise((success) => {
        const html = compileTemplate(myhelp, {
          vars: {
            urlImages: `${IDEE.config.API_IDEE_URL}assets/images`,
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
    this.getImpl().destroy();
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
